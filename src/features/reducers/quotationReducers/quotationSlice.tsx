// @ts-nocheck

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { GetProposalQuery } from "../proposalReducers/proposalSlice";
import apiCall from "../../../utils/api-call";
import type { QuotationState } from "../../../types/quotation";
import type { RootState } from "../../store";

// Update the interface to include agentId
interface GetQuotationQuery {
  page: number;
  pageSize: number;
  agentId?: string;
  filters?: any;
}

export const getQuotations = createAsyncThunk(
  "quotations/getQuotations",
  async (
    { page, pageSize, agentId, filters }: GetQuotationQuery,
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

      // Add any additional filters
      if (filters) {
        Object.keys(filters).forEach((key) => {
          if (filters[key]) {
            params.append(key, filters[key]);
          }
        });
      }

      const response = await apiCall.get(
        `/Quotation/quotations?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Add a new thunk for getting quotations by specific agent using dedicated endpoint
export const getQuotationsByAgent = createAsyncThunk(
  "quotations/getQuotationsByAgent",
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
        "🔍 Fetching quotations for agent:",
        agentCode,
        "Page:",
        page,
        "PageSize:",
        pageSize
      );
      console.log(
        "🔍 API endpoint:",
        `/Quotation/agent/${agentCode}/paged?page=${page}&pageSize=${pageSize}`
      );

      const response = await apiCall.get(
        `/Quotation/agent/${agentCode}/paged?page=${page}&pageSize=${pageSize}`
      );

      console.log("✅ Agent quotations response:", response.data);
      console.log(
        "✅ Number of quotations:",
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

      console.log("✅ Normalized quotations response:", normalizedResponse);
      return normalizedResponse;
    } catch (error) {
      console.error("❌ Error fetching agent quotations:", error);
      return rejectWithValue(error);
    }
  }
);

// Add a new thunk for getting traditional quotations by specific agent
export const getTraditionalQuotationsByAgent = createAsyncThunk(
  "quotations/getTraditionalQuotationsByAgent",
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
        "🔍 Fetching traditional quotations for agent:",
        agentCode,
        "Page:",
        page,
        "PageSize:",
        pageSize
      );
      console.log(
        "🔍 API endpoint:",
        `/Quotation/traditional/agent/${agentCode}/paged?page=${page}&pageSize=${pageSize}`
      );

      const response = await apiCall.get(
        `/Quotation/traditional/agent/${agentCode}/paged?page=${page}&pageSize=${pageSize}`
      );

      console.log("✅ Traditional agent quotations response:", response.data);
      console.log(
        "✅ Number of traditional quotations:",
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

      console.log(
        "✅ Normalized traditional quotations response:",
        normalizedResponse
      );
      return normalizedResponse;
    } catch (error) {
      console.error("❌ Error fetching traditional agent quotations:", error);
      return rejectWithValue(error);
    }
  }
);

// Add a new thunk for getting group life quotations by specific agent
export const getGroupLifeQuotationsByAgent = createAsyncThunk(
  "quotations/getGroupLifeQuotationsByAgent",
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
        "🔍 Fetching group life quotations for agent:",
        agentCode,
        "Page:",
        page,
        "PageSize:",
        pageSize
      );
      console.log(
        "🔍 API endpoint:",
        `/Quotation/grouplife/agent/${agentCode}/paged?page=${page}&pageSize=${pageSize}`
      );

      const response = await apiCall.get(
        `/Quotation/grouplife/agent/${agentCode}/paged?page=${page}&pageSize=${pageSize}`
      );

      console.log("✅ Group life agent quotations response:", response.data);
      console.log(
        "✅ Number of group life quotations:",
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

      console.log(
        "✅ Normalized group life quotations response:",
        normalizedResponse
      );
      return normalizedResponse;
    } catch (error) {
      console.error("❌ Error fetching group life agent quotations:", error);
      return rejectWithValue(error);
    }
  }
);

const initialState: QuotationState = {
  quotations: [],
  loading: false,
  error: null,
  currentQuotation: null,
};

const quotationSlice = createSlice({
  name: "quotations",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = null;
    },
    clearQuotations: (state) => {
      state.quotations = [];
    },
    setCurrentQuotation: (state, action) => {
      state.currentQuotation = action.payload;
    },
    clearCurrentQuotation: (state) => {
      state.currentQuotation = null;
    },
    // Filter quotations by agent on client side (fallback)
    filterQuotationsByAgent: (state, action) => {
      const agentId = action.payload;
      if (agentId) {
        state.quotations = state.quotations.filter(
          (quotation: any) =>
            quotation.agentId === agentId || quotation.createdBy === agentId
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Quotations
      .addCase(getQuotations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQuotations.fulfilled, (state, action) => {
        state.loading = false;
        state.quotations = action.payload;

        // Client-side filtering as fallback
        const agentId = localStorage.getItem("agentId");
        if (agentId && Array.isArray(action.payload)) {
          state.quotations = action.payload.filter(
            (quotation: any) =>
              quotation.agentId === agentId || quotation.createdBy === agentId
          );
        }
      })
      .addCase(getQuotations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get Quotations by Agent
      .addCase(getQuotationsByAgent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQuotationsByAgent.fulfilled, (state, action) => {
        state.loading = false;
        state.quotations = action.payload;
      })
      .addCase(getQuotationsByAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getTraditionalQuotationsByAgent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTraditionalQuotationsByAgent.fulfilled, (state, action) => {
        state.loading = false;
        state.quotations = action.payload;
      })
      .addCase(getTraditionalQuotationsByAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getGroupLifeQuotationsByAgent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getGroupLifeQuotationsByAgent.fulfilled, (state, action) => {
        state.loading = false;
        state.quotations = action.payload;
      })
      .addCase(getGroupLifeQuotationsByAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const selectQuotations = (state: RootState) => state.quotation;

export const {
  clearMessages,
  clearQuotations,
  setCurrentQuotation,
  clearCurrentQuotation,
  filterQuotationsByAgent,
} = quotationSlice.actions;

export default quotationSlice.reducer;
