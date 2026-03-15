// @ts-nocheck

import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type {
  GroupLifeQuotation,
  GroupLifeMember,
} from "@/types/groupLifeQuotation";
import * as api from "@/api/groupLifeQuotation";

interface GroupLifeQuotationState {
  quotations: GroupLifeQuotation[];
  currentQuotation: GroupLifeQuotation | null;
  totalCount: number;
  loading: {
    list: boolean;
    detail: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  error: {
    list: string | null;
    detail: string | null;
    create: string | null;
    update: string | null;
    delete: string | null;
  };
}

const initialState: GroupLifeQuotationState = {
  quotations: [],
  currentQuotation: null,
  totalCount: 0,
  loading: {
    list: false,
    detail: false,
    create: false,
    update: false,
    delete: false,
  },
  error: {
    list: null,
    detail: null,
    create: null,
    update: null,
    delete: null,
  },
};

export const fetchGroupLifeQuotations = createAsyncThunk(
  "groupLifeQuotations/fetchList",
  async (
    {
      filters,
      page,
      pageSize,
    }: { filters: any; page: number; pageSize: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.fetchGroupLifeQuotations(
        filters,
        page,
        pageSize
      );
      // const trimmed =  (response as any)?.data.items ?? response
      return (response as any)?.data ?? response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch quotations");
    }
  }
);

export const fetchGroupLifeQuotationById = createAsyncThunk(
  "groupLifeQuotations/fetchById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.fetchGroupLifeQuotationById(id);
      return (response as any)?.data ?? response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch quotation");
    }
  }
);

export const createGroupLifeQuotation = createAsyncThunk(
  "groupLifeQuotations/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.createGroupLifeQuotation(data as any);
      return response.data ?? response;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (response as any)?.data ?? response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create quotation");
    }
  }
);

export const updateGroupLifeQuotation = createAsyncThunk(
  "groupLifeQuotations/update",
  async (
    { id, data }: { id: string; data: Partial<GroupLifeQuotation> },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.updateGroupLifeQuotation(id, data);
      return (response as any)?.data ?? response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update quotation");
    }
  }
);

export const deleteGroupLifeQuotation = createAsyncThunk(
  "groupLifeQuotations/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.deleteGroupLifeQuotation(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete quotation");
    }
  }
);

// Add a new thunk for getting group life quotations by specific agent
export const fetchGroupLifeQuotationsByAgent = createAsyncThunk(
  "groupLifeQuotations/fetchByAgent",
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

      const response = await api.fetchGroupLifeQuotationsByAgent(
        agentCode,
        page,
        pageSize
      );

      console.log("✅ Group life agent quotations response:", response);
      return (response as any)?.data ?? response;
    } catch (error: any) {
      console.error("❌ Error fetching group life agent quotations:", error);
      return rejectWithValue(
        error.message || "Failed to fetch agent quotations"
      );
    }
  }
);

const groupLifeQuotationSlice = createSlice({
  name: "groupLifeQuotations",
  initialState,
  reducers: {
    setCurrentQuotation: (
      state,
      action: PayloadAction<GroupLifeQuotation | null>
    ) => {
      state.currentQuotation = action.payload;
    },
    clearCurrentQuotation: (state) => {
      state.currentQuotation = null;
    },
    addMemberToCurrentQuotation: (
      state,
      action: PayloadAction<GroupLifeMember>
    ) => {
      if (state.currentQuotation) {
        state.currentQuotation.members.push(action.payload);
        state.currentQuotation.totalMembers =
          state.currentQuotation.members.length;
      }
    },
    updateMemberInCurrentQuotation: (
      state,
      action: PayloadAction<{ index: number; member: GroupLifeMember }>
    ) => {
      if (state.currentQuotation) {
        state.currentQuotation.members[action.payload.index] =
          action.payload.member;
      }
    },
    removeMemberFromCurrentQuotation: (
      state,
      action: PayloadAction<number>
    ) => {
      if (state.currentQuotation) {
        state.currentQuotation.members.splice(action.payload, 1);
        state.currentQuotation.totalMembers =
          state.currentQuotation.members.length;
      }
    },
    //replace full member list after upload
    setMembersForCurrentQuotation: (
      state,
      action: PayloadAction<GroupLifeMember[]>
    ) => {
      if (state.currentQuotation) {
        state.currentQuotation.members = action.payload;
        state.currentQuotation.totalMembers = action.payload.length;
      }
    },
    // set computed totals after server compute
    setComputedTotalsForCurrentQuotation: (
      state,
      action: PayloadAction<{
        totalSumInsured?: number;
        totalPremium?: number;
        netPremiumDue?: number;
        loadingPercentage?: number;
        reductionPercentage?: number;
      }>
    ) => {
      if (state.currentQuotation) {
        const {
          totalSumInsured,
          totalPremium,
          netPremiumDue,
          loadingPercentage,
          reductionPercentage,
        } = action.payload;
        if (typeof totalSumInsured === "number")
          state.currentQuotation.totalSumInsured = totalSumInsured;
        if (typeof totalPremium === "number")
          state.currentQuotation.totalPremium = totalPremium;
        if (typeof netPremiumDue === "number")
          state.currentQuotation.netPremiumDue = netPremiumDue;
        if (typeof loadingPercentage === "number")
          state.currentQuotation.loadingPercentage = loadingPercentage;
        if (typeof reductionPercentage === "number")
          state.currentQuotation.reductionPercentage = reductionPercentage;
      }
    },
    clearErrors: (state) => {
      state.error = initialState.error;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch list
      .addCase(fetchGroupLifeQuotations.pending, (state) => {
        state.loading.list = true;
        state.error.list = null;
      })
      .addCase(fetchGroupLifeQuotations.fulfilled, (state, action) => {
        state.loading.list = false;
        // payload may be:
        // - { items: [...], totalCount: number }  <-- backend via response.data
        // - { data: [...], total: number }         <-- older shape
        // - an array
        const payload: any = action.payload ?? {};
        if (Array.isArray(payload)) {
          state.quotations = payload;
          state.totalCount = payload.length;
        } else if (Array.isArray(payload.items)) {
          state.quotations = payload.items;
          state.totalCount =
            typeof payload.totalCount === "number"
              ? payload.totalCount
              : payload.items.length;
        } else if (Array.isArray(payload.data)) {
          state.quotations = payload.data;
          state.totalCount =
            typeof payload.total === "number"
              ? payload.total
              : payload.data.length;
        } else {
          // fallback: keep previous quotations as empty array
          state.quotations = [];
          state.totalCount = 0;
        }
      })
      .addCase(fetchGroupLifeQuotations.rejected, (state, action) => {
        state.loading.list = false;
        state.error.list = action.payload as string;
      })
      // Fetch by ID
      .addCase(fetchGroupLifeQuotationById.pending, (state) => {
        state.loading.detail = true;
        state.error.detail = null;
      })
      .addCase(fetchGroupLifeQuotationById.fulfilled, (state, action) => {
        state.loading.detail = false;
        state.currentQuotation = action.payload;
      })
      .addCase(fetchGroupLifeQuotationById.rejected, (state, action) => {
        state.loading.detail = false;
        state.error.detail = action.payload as string;
      })
      // Create
      .addCase(createGroupLifeQuotation.pending, (state) => {
        state.loading.create = true;
        state.error.create = null;
      })
      .addCase(createGroupLifeQuotation.fulfilled, (state, action) => {
        state.loading.create = false;
        state.quotations.unshift(action.payload);
        state.currentQuotation = action.payload;
      })
      .addCase(createGroupLifeQuotation.rejected, (state, action) => {
        state.loading.create = false;
        state.error.create = action.payload as string;
      })
      // Update
      .addCase(updateGroupLifeQuotation.pending, (state) => {
        state.loading.update = true;
        state.error.update = null;
      })
      .addCase(updateGroupLifeQuotation.fulfilled, (state, action) => {
        state.loading.update = false;
        const index = state.quotations.findIndex(
          (q) => q.id === action.payload.id
        );
        if (index !== -1) {
          state.quotations[index] = action.payload;
        }
        state.currentQuotation = action.payload;
      })
      .addCase(updateGroupLifeQuotation.rejected, (state, action) => {
        state.loading.update = false;
        state.error.update = action.payload as string;
      })
      // Delete
      .addCase(deleteGroupLifeQuotation.pending, (state) => {
        state.loading.delete = true;
        state.error.delete = null;
      })
      .addCase(deleteGroupLifeQuotation.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.quotations = state.quotations.filter(
          (q) => q.id !== action.payload
        );
      })
      .addCase(deleteGroupLifeQuotation.rejected, (state, action) => {
        state.loading.delete = false;
        state.error.delete = action.payload as string;
      })
      // Fetch by agent
      .addCase(fetchGroupLifeQuotationsByAgent.pending, (state) => {
        state.loading.list = true;
        state.error.list = null;
      })
      .addCase(fetchGroupLifeQuotationsByAgent.fulfilled, (state, action) => {
        state.loading.list = false;
        const payload: any = action.payload ?? {};
        if (Array.isArray(payload)) {
          state.quotations = payload;
          state.totalCount = payload.length;
        } else if (Array.isArray(payload.items)) {
          state.quotations = payload.items;
          state.totalCount =
            typeof payload.totalCount === "number"
              ? payload.totalCount
              : payload.items.length;
        } else if (Array.isArray(payload.data)) {
          state.quotations = payload.data;
          state.totalCount =
            typeof payload.total === "number"
              ? payload.total
              : payload.data.length;
        } else {
          state.quotations = [];
          state.totalCount = 0;
        }
      })
      .addCase(fetchGroupLifeQuotationsByAgent.rejected, (state, action) => {
        state.loading.list = false;
        state.error.list = action.payload as string;
      });
  },
});

export const {
  setCurrentQuotation,
  clearCurrentQuotation,
  addMemberToCurrentQuotation,
  updateMemberInCurrentQuotation,
  removeMemberFromCurrentQuotation,
  clearErrors,
  setMembersForCurrentQuotation,
  setComputedTotalsForCurrentQuotation,
} = groupLifeQuotationSlice.actions;

export const selectGroupLifeQuotations = (state: {
  groupLifeQuotations: GroupLifeQuotationState;
}) => state.groupLifeQuotations;

export default groupLifeQuotationSlice.reducer;
