//@ts-nocheck

import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import apiCall from "../../../utils/api-call";
import type {
  Proposal,
  ProposalEditPayload,
  ProposalFormData,
  ProposalState,
  TradProposalFormData,
} from "@/types/proposals";

export interface GetProposalQuery {
  page: number;
  pageSize: number;
  proposalNo?: string | null;
  assuredCode?: string | null;
  surname?: string | null;
  agentId?: string | null;
  filters?: any;
}

export interface GetProposalParams {
  type: "trad" | "reg";
  proposalNo: string;
}

export const getProposals = createAsyncThunk(
  "proposals/getProposals",
  async (
    {
      page,
      pageSize,
      proposalNo,
      assuredCode,
      surname,
      agentId,
      filters,
    }: GetProposalQuery,
    { rejectWithValue }
  ) => {
    try {
      // Get the current agent ID from localStorage or parameters
      const currentAgentId = agentId || localStorage.getItem("agentId");

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      // Add agentId to filter if available
      if (currentAgentId) {
        params.append("agentId", currentAgentId);
      }

      // Add optional filters
      if (proposalNo) params.append("proposalNo", proposalNo);
      if (assuredCode) params.append("assuredCode", assuredCode);
      if (surname) params.append("surname", surname);

      // Add any additional filters
      if (filters) {
        Object.keys(filters).forEach((key) => {
          if (filters[key]) {
            params.append(key, filters[key]);
          }
        });
      }

      const response = await apiCall.get(
        `/v1/IndividualLife/proposals?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Add a new thunk for getting proposals by specific agent using the dedicated endpoint
export const getProposalsByAgent = createAsyncThunk(
  "proposals/getProposalsByAgent",
  async (agentCode: string, { rejectWithValue }) => {
    try {
      if (!agentCode) {
        throw new Error("Agent code is required");
      }

      console.log("🔍 Fetching proposals for agent:", agentCode);
      console.log(
        "🔍 API endpoint:",
        `/v1/IndividualLife/agent/${agentCode}/paged`
      );

      const response = await apiCall.get(
        `/v1/IndividualLife/agent/${agentCode}/paged`
      );

      console.log("✅ Agent proposals response:", response.data);
      console.log(
        "✅ Number of proposals:",
        response.data?.data?.length || response.data?.items?.length || 0
      );
      console.log("🔍 response.data.data:", response.data?.data);
      console.log("🔍 response.data.items:", response.data?.items);

      // Normalize the response structure to match expected format
      const normalizedResponse = {
        items: response.data?.data || response.data?.items || [],
        page: response.data?.page || 1,
        pageSize: response.data?.pageSize || 20,
        totalCount: response.data?.totalCount || 0,
        totalPages: response.data?.totalPages || 0,
      };

      console.log("✅ Normalized response:", normalizedResponse);
      console.log("✅ Normalized response.items:", normalizedResponse.items);
      console.log(
        "✅ Normalized response.items.length:",
        normalizedResponse.items.length
      );

      return normalizedResponse;
    } catch (error) {
      console.error("❌ Error fetching agent proposals:", error);
      return rejectWithValue(error);
    }
  }
);

export const createProposal = createAsyncThunk(
  "proposals/createProposal",
  async (body: ProposalFormData, { rejectWithValue }) => {
    try {
      // Add agent ID to the proposal when creating
      const agentId = localStorage.getItem("agentId");
      const proposalData = {
        ...body,
        agentId: agentId, // Include agent ID in the proposal
        createdBy: agentId,
      };

      const response = await apiCall.post(
        "/v1/IndividualLife/create",
        proposalData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const createTradProposal = createAsyncThunk(
  "proposals/createTradProposal",
  async (body: TradProposalFormData, { rejectWithValue }) => {
    try {
      // Add agent ID to the traditional proposal when creating
      const agentId = localStorage.getItem("agentId");
      const proposalData = {
        ...body,
        agentId: agentId, // Include agent ID in the proposal
        createdBy: agentId,
      };

      const response = await apiCall.post(
        "/v1/IndividualLife/tradproposal/create",
        proposalData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const editProposal = createAsyncThunk(
  "proposals/editProposal",
  async (
    { type, proposalNo, body }: ProposalEditPayload,
    { rejectWithValue }
  ) => {
    try {
      if (type === "trad") {
        const response = await apiCall.put(
          `/v1/IndividualLife/tradproposal/edit/${proposalNo}`,
          body
        );

        return response.data;
      } else {
        const response = await apiCall.put(
          `/v1/IndividualLife/proposal/${proposalNo}`,
          body
        );

        return response.data;
      }
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const getProducts = createAsyncThunk(
  "proposals/getProducts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/v1/Products`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const getBranches = createAsyncThunk(
  "proposals/getBranches",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/Quotation/Branches`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const getProposal = createAsyncThunk<Proposal, GetProposalParams>(
  "proposals/getProposal",
  async ({ type, proposalNo }: GetProposalParams, { rejectWithValue }) => {
    try {
      // Use the proposals endpoint with proposalNo query parameter
      const endpoint = `/v1/IndividualLife/proposals?proposalNo=${proposalNo}`;

      const response = await apiCall.get(endpoint);

      // The API returns an array of proposals, get the first one
      const proposals = response.data?.items || response.data;
      const data = Array.isArray(proposals) ? proposals[0] : proposals;

      if (!data) {
        throw new Error(
          `Could not fetch ${
            type === "trad" ? "traditional " : ""
          }proposal detail`
        );
      }

      return data as Proposal;
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        `Could not fetch ${
          type === "trad" ? "traditional " : ""
        }proposal detail`;
      return rejectWithValue(errorMessage);
    }
  }
);

const initialState: ProposalState = {
  proposals: {
    items: [],
    page: 1,
    pageSize: 20,
    totalCount: 0,
  },
  products: [],
  branches: [],
  proposal: null,

  loading: {
    getProposals: false,
    createProposal: false,
    createTradProposal: false,
    getProducts: false,
    getBranches: false,
    getProposal: false,
    editProposal: false,
  },
  error: {
    getProposals: null,
    createProposal: null,
    createTradProposal: null,
    getProducts: null,
    getBranches: null,
    getProposal: null,
    editProposal: null,
  },
  success: {
    createProposal: false,
    createTradProposal: false,
    editProposal: false,
  },
};

const proposalSlice = createSlice({
  name: "proposals",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = { ...initialState.error };
      state.success = { ...initialState.success };
    },
    clearProposals: (state) => {
      state.proposals = {
        items: [],
        page: 1,
        pageSize: 20,
        totalCount: 0,
      };
    },
    clearProposal: (state) => {
      state.proposal = null;
    },
    // Filter proposals by agent on client side (fallback)
    filterProposalsByAgent: (state, action) => {
      const agentId = action.payload;
      if (agentId && Array.isArray(state.proposals.items)) {
        state.proposals.items = state.proposals.items.filter(
          (proposal: any) =>
            proposal.agentId === agentId || proposal.createdBy === agentId
        );
        state.proposals.totalCount = state.proposals.items.length;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Proposals
      .addCase(getProposals.pending, (state) => {
        state.loading.getProposals = true;
        state.error.getProposals = null;
      })
      .addCase(getProposals.fulfilled, (state, action) => {
        state.loading.getProposals = false;
        state.proposals = action.payload;

        // Client-side filtering as fallback
        const agentId = localStorage.getItem("agentId");
        if (agentId && Array.isArray(action.payload.items)) {
          state.proposals.items = action.payload.items.filter(
            (proposal: any) =>
              proposal.agentId === agentId || proposal.createdBy === agentId
          );
          state.proposals.totalCount = state.proposals.items.length;
        }
      })
      .addCase(getProposals.rejected, (state, action) => {
        state.loading.getProposals = false;
        state.error.getProposals = action.payload;
      })

      // Get Proposals by Agent
      .addCase(getProposalsByAgent.pending, (state) => {
        state.loading.getProposals = true;
        state.error.getProposals = null;
        console.log("🔄 getProposalsByAgent.pending - Loading started");
      })
      .addCase(getProposalsByAgent.fulfilled, (state, action) => {
        state.loading.getProposals = false;
        state.proposals = action.payload;
        console.log(
          "✅ getProposalsByAgent.fulfilled - Proposals set in state:",
          action.payload
        );
        console.log(
          "✅ State after update - proposals.items.length:",
          state.proposals?.items?.length
        );
      })
      .addCase(getProposalsByAgent.rejected, (state, action) => {
        state.loading.getProposals = false;
        state.error.getProposals = action.payload;
      })

      .addCase(getProposal.pending, (state) => {
        state.loading.getProposal = true;
        state.error.getProposal = null;
      })
      .addCase(
        getProposal.fulfilled,
        (state, action: PayloadAction<Proposal>) => {
          state.loading.getProposal = false;
          state.proposal = action.payload;
        }
      )
      .addCase(getProposal.rejected, (state, action) => {
        state.loading.getProposal = false;
        state.error.getProposal =
          action.payload || "Failed to fetch proposal details";
      })

      .addCase(getProducts.pending, (state) => {
        state.loading.getProducts = true;
        state.error.getProducts = null;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.loading.getProducts = false;
        state.products = action.payload;
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.loading.getProducts = false;
        state.error.getProducts = action.payload;
      })

      .addCase(getBranches.pending, (state) => {
        state.loading.getBranches = true;
        state.error.getBranches = null;
      })
      .addCase(getBranches.fulfilled, (state, action) => {
        state.loading.getBranches = false;
        state.branches = action.payload;
      })
      .addCase(getBranches.rejected, (state, action) => {
        state.loading.getBranches = false;
        state.error.getBranches = action.payload;
      })

      .addCase(createProposal.pending, (state) => {
        state.loading.createProposal = true;
        state.error.createProposal = null;
        state.success.createProposal = false;
      }) // @ts-ignore
      .addCase(createProposal.fulfilled, (state, action) => {
        state.loading.createProposal = false;
        state.success.createProposal = true;
        // state.proposals.push(action.payload);
      })
      .addCase(createProposal.rejected, (state, action) => {
        state.loading.createProposal = false;
        state.error.createProposal = action.payload;
      })

      .addCase(createTradProposal.pending, (state) => {
        state.loading.createTradProposal = true;
        state.error.createTradProposal = null;
        state.success.createTradProposal = false;
      }) // @ts-ignore
      .addCase(createTradProposal.fulfilled, (state, action) => {
        state.loading.createTradProposal = false;
        state.success.createTradProposal = true;
        // state.proposals.push(action.payload);
      })
      .addCase(createTradProposal.rejected, (state, action) => {
        state.loading.createTradProposal = false;
        state.error.createTradProposal = action.payload;
      })

      .addCase(editProposal.pending, (state) => {
        state.loading.editProposal = true;
        state.error.editProposal = null;
        state.success.editProposal = false;
      }) // @ts-ignore
      .addCase(editProposal.fulfilled, (state, action) => {
        state.loading.editProposal = false;
        state.success.editProposal = true;
        // const index = state.roles.findIndex(
        //   (role) => role.id === action.payload.id
        // );
        // if (index !== -1) {
        //   state.roles[index] = {
        //     ...state.roles[index],
        //     roleName: action.payload.roleName,
        //   };
        // }
      })
      .addCase(editProposal.rejected, (state, action) => {
        state.loading.editProposal = false;
        state.error.editProposal = action.payload;
      });
  },
});

export const selectProposals = (state: { proposals: ProposalState }) =>
  state.proposals;

export const {
  clearMessages,
  clearProposals,
  clearProposal,
  filterProposalsByAgent,
} = proposalSlice.actions;

export default proposalSlice.reducer;
