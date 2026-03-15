//@ts-nocheck

import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import apiCall from "@/utils/api-call";
import {
  Proposal,
  ProposalEditPayload,
  ProposalFormData,
  ProposalState,
  TradProposalFormData,
} from "@/types/proposals";
import { SERVER_URL } from "@/utils/constants";

export interface GetProposalQuery {
  page: number;
  pageSize: number;
  proposalNo?: string | null;
  assuredCode?: string | null;
  surname?: string | null;
}

export const getProposals = createAsyncThunk(
  "proposals/getProposals",
  async (
    // @ts-ignore
    { page, pageSize, proposalNo, assuredCode, surname }: GetProposalQuery,
    { rejectWithValue }
  ) => {
    try {
      const response = await apiCall.get(
        `/v1/IndividualLife/proposals?page=${page}&pageSize=${pageSize}`
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
  async (
    {
      agentCode,
      page = 1,
      pageSize = 20,
    }: { agentCode: string; page?: number; pageSize?: number },
    { rejectWithValue }
  ) => {
    try {
      if (!agentCode) {
        throw new Error("Agent code is required");
      }

      console.log(
        "🔍 Fetching proposals for agent:",
        agentCode,
        "Page:",
        page,
        "PageSize:",
        pageSize
      );
      console.log(
        "🔍 API endpoint:",
        `/v1/IndividualLife/agent/${agentCode}/paged?page=${page}&pageSize=${pageSize}`
      );

      const response = await apiCall.get(
        `/v1/IndividualLife/agent/${agentCode}/paged?page=${page}&pageSize=${pageSize}`
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

// Add a new thunk for getting traditional proposals by specific agent
export const getTraditionalProposalsByAgent = createAsyncThunk(
  "proposals/getTraditionalProposalsByAgent",
  async (
    {
      agentCode,
      page = 1,
      pageSize = 20,
    }: { agentCode: string; page?: number; pageSize?: number },
    { rejectWithValue }
  ) => {
    try {
      if (!agentCode) {
        throw new Error("Agent code is required");
      }

      console.log(
        "🔍 Fetching traditional proposals for agent:",
        agentCode,
        "Page:",
        page,
        "PageSize:",
        pageSize
      );
      console.log(
        "🔍 API endpoint:",
        `/v1/IndividualLife/traditional/agent/${agentCode}/paged?page=${page}&pageSize=${pageSize}`
      );

      const response = await apiCall.get(
        `/v1/IndividualLife/traditional/agent/${agentCode}/paged?page=${page}&pageSize=${pageSize}`
      );

      console.log("✅ Traditional agent proposals response:", response.data);
      console.log(
        "✅ Number of traditional proposals:",
        response.data?.data?.length || response.data?.items?.length || 0
      );

      // Normalize the response structure to match expected format
      const normalizedResponse = {
        items: response.data?.data || response.data?.items || [],
        page: response.data?.page || 1,
        pageSize: response.data?.pageSize || 20,
        totalCount: response.data?.totalCount || 0,
        totalPages: response.data?.totalPages || 0,
      };

      console.log("✅ Normalized traditional response:", normalizedResponse);
      return normalizedResponse;
    } catch (error) {
      console.error("❌ Error fetching traditional agent proposals:", error);
      return rejectWithValue(error);
    }
  }
);

// Add this async thunk for approving proposals
export const approveProposal = createAsyncThunk(
  "proposals/approveProposal",
  async (proposalNo: string, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${SERVER_URL}/v1/IndividualLife/approve?proposalNo=${proposalNo}`,
        {
          method: "PUT",
          headers: {
            accept: "*/*",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to approve proposal: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createProposal = createAsyncThunk(
  "proposals/createProposal",
  async (body: ProposalFormData, { rejectWithValue }) => {
    try {
      const response = await apiCall.post("/v1/IndividualLife/create", body);
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
      const response = await apiCall.post(
        "/v1/IndividualLife/tradproposal/create",
        body
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
    } catch (error: any) {  // ✅ Add type annotation
      // ✅ Extract only serializable data
      const serializableError = {
        message: error.response?.data?.message || error.message || 'Unknown error',
        status: error.response?.status,
        code: error.code,
        url: error.config?.url,
      };
      console.error('API Error details:', serializableError);
      return rejectWithValue(serializableError); // ✅ Returns serializable object
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

export const getProposal = createAsyncThunk(
  "proposals/getProposal",
  async (proposalNo: string, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(
        `/v1/IndividualLife/proposals?proposalNo=${proposalNo}`
      );
      const proposals = response.data?.items || response.data;
      const data = Array.isArray(proposals) ? proposals[0] : proposals;

      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error("Could not fetch proposal detail");
      }

      return data;
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Could not fetch proposal detail";
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
    approveProposal: false, // Added approveProposal
  },
  error: {
    getProposals: null,
    createProposal: null,
    createTradProposal: null,
    getProducts: null,
    getBranches: null,
    getProposal: null,
    editProposal: null,
    approveProposal: null, // Added approveProposal
  },
  success: {
    createProposal: false,
    createTradProposal: false,
    editProposal: false,
    approveProposal: false, // Added approveProposal
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

      // Get Traditional Proposals by Agent
      .addCase(getTraditionalProposalsByAgent.pending, (state) => {
        state.loading.getProposals = true;
        state.error.getProposals = null;
        console.log(
          "🔄 getTraditionalProposalsByAgent.pending - Loading started"
        );
      })
      .addCase(getTraditionalProposalsByAgent.fulfilled, (state, action) => {
        state.loading.getProposals = false;
        state.proposals = action.payload;
        console.log(
          "✅ getTraditionalProposalsByAgent.fulfilled - Proposals set in state:",
          action.payload
        );
        console.log(
          "✅ State after update - proposals.items.length:",
          state.proposals?.items?.length
        );
      })
      .addCase(getTraditionalProposalsByAgent.rejected, (state, action) => {
        state.loading.getProposals = false;
        state.error.getProposals = action.payload;
      })

      // Approve Proposal
      .addCase(approveProposal.pending, (state) => {
        state.loading.approveProposal = true;
        state.error.approveProposal = null;
        state.success.approveProposal = false;
      })
      .addCase(approveProposal.fulfilled, (state, action) => {
        state.loading.approveProposal = false;
        state.success.approveProposal = true;

        // Optional: Update the proposal status in the proposals list if needed
        const approvedProposalNo = action.meta.arg; // This is the proposalNo passed to the thunk
        const proposalIndex = state.proposals.items.findIndex(
          (proposal: Proposal) => proposal.proposalNo === approvedProposalNo
        );
        if (proposalIndex !== -1) {
          // Update the proposal status to approved
          state.proposals.items[proposalIndex] = {
            ...state.proposals.items[proposalIndex],
            status: "approved", // Adjust this based on your API response
          };
        }
      })
      .addCase(approveProposal.rejected, (state, action) => {
        state.loading.approveProposal = false;
        state.error.approveProposal = action.payload;
        state.success.approveProposal = false;
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

export const { clearMessages, clearProposals, clearProposal } =
  proposalSlice.actions;

export default proposalSlice.reducer;
