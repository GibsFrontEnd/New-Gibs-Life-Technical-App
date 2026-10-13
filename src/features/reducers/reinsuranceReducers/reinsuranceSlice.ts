// src/features/reducers/reinsurance/reinsuranceSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import reinsuranceService from '../../../services/reinsurance.service';
import { 
  FacultativeInwardPolicy, 
  PaginatedResponse, 
  ReinsuranceFilterParams 
} from '../../../types/reinsurance';

interface ReinsuranceState {
  policies: FacultativeInwardPolicy[];
  selectedPolicy: FacultativeInwardPolicy | null;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: ReinsuranceFilterParams;
  loading: boolean;
  error: string | null;
}

const initialState: ReinsuranceState = {
  policies: [],
  selectedPolicy: null,
  pagination: {
    currentPage: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
  filters: {
    page: 1,
    pageSize: 50,
    sortBy: 'TransDate',
    sortDirection: 'DESC',
  },
  loading: false,
  error: null,
};

// Async thunks
export const fetchFacInPolicies = createAsyncThunk(
  'reinsurance/fetchFacInPolicies',
  async (params: ReinsuranceFilterParams, { rejectWithValue }) => {
    try {
      const response = await reinsuranceService.getAllFacInPolicies(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchFacInPolicyById = createAsyncThunk(
  'reinsurance/fetchFacInPolicyById',
  async ({ policyNo, classType }: { policyNo: string; classType?: string }, { rejectWithValue }) => {
    try {
      const response = await reinsuranceService.getFacInPolicy(policyNo, classType);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createFacInPolicy = createAsyncThunk(
  'reinsurance/createFacInPolicy',
  async (data: any, { rejectWithValue, dispatch }) => {
    try {
      const response = await reinsuranceService.createFacInPolicy(data);
      await dispatch(fetchFacInPolicies({ page: 1, pageSize: 50 }));
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateFacInPolicy = createAsyncThunk(
  'reinsurance/updateFacInPolicy',
  async ({ policyNo, data }: { policyNo: string; data: any }, { rejectWithValue, dispatch }) => {
    try {
      const response = await reinsuranceService.updateFacInPolicy(policyNo, data);
      await dispatch(fetchFacInPolicies({ page: 1, pageSize: 50 }));
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const reinsuranceSlice = createSlice({
  name: 'reinsurance',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ReinsuranceFilterParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedPolicy: (state) => {
      state.selectedPolicy = null;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.filters.page = action.payload;
      state.pagination.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all policies
      .addCase(fetchFacInPolicies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFacInPolicies.fulfilled, (state, action: PayloadAction<PaginatedResponse<FacultativeInwardPolicy>>) => {
        state.loading = false;
        state.policies = action.payload.items;
        state.pagination = {
          currentPage: action.payload.page,
          pageSize: action.payload.pageSize,
          totalCount: action.payload.totalCount,
          totalPages: action.payload.totalPages,
          hasNext: action.payload.hasNext,
          hasPrevious: action.payload.hasPrevious,
        };
      })
      .addCase(fetchFacInPolicies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch single policy
      .addCase(fetchFacInPolicyById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFacInPolicyById.fulfilled, (state, action: PayloadAction<FacultativeInwardPolicy>) => {
        state.loading = false;
        state.selectedPolicy = action.payload;
      })
      .addCase(fetchFacInPolicyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create policy
      .addCase(createFacInPolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFacInPolicy.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createFacInPolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update policy
      .addCase(updateFacInPolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFacInPolicy.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateFacInPolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, clearFilters, clearSelectedPolicy, setPage } = reinsuranceSlice.actions;
export default reinsuranceSlice.reducer;