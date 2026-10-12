// store/slices/riskDistributionSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RiskDistribution, CreateRiskDistributionDto, UpdateRiskDistributionDto } from '../../../types/riskDistribution';
import { riskDistributionApi } from '../../../services/riskDistributionApi';

interface RiskDistributionState {
  items: RiskDistribution[];
  selectedItem: RiskDistribution | null;
  loading: boolean;
  error: string | null;
  filters: {
    subRiskId?: string;
    year?: string;
  };
}

const initialState: RiskDistributionState = {
  items: [],
  selectedItem: null,
  loading: false,
  error: null,
  filters: {},
};

// Async thunks
export const fetchAllRiskDistributions = createAsyncThunk(
  'riskDistribution/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await riskDistributionApi.getAll();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch risk distributions');
    }
  }
);

export const fetchRiskDistributionById = createAsyncThunk(
  'riskDistribution/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await riskDistributionApi.getById(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch risk distribution');
    }
  }
);

export const fetchRiskDistributionsBySubRisk = createAsyncThunk(
  'riskDistribution/fetchBySubRisk',
  async (subRiskId: string, { rejectWithValue }) => {
    try {
      return await riskDistributionApi.getBySubRisk(subRiskId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch risk distributions by sub risk');
    }
  }
);

export const fetchRiskDistributionBySubRiskAndYear = createAsyncThunk(
  'riskDistribution/fetchBySubRiskAndYear',
  async ({ subRiskId, underYr }: { subRiskId: string; underYr: string }, { rejectWithValue }) => {
    try {
      return await riskDistributionApi.getBySubRiskAndYear(subRiskId, underYr);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch risk distribution');
    }
  }
);

export const createRiskDistribution = createAsyncThunk(
  'riskDistribution/create',
  async (data: CreateRiskDistributionDto, { rejectWithValue }) => {
    try {
      return await riskDistributionApi.create(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create risk distribution');
    }
  }
);

export const updateRiskDistribution = createAsyncThunk(
  'riskDistribution/update',
  async ({ id, data }: { id: number; data: UpdateRiskDistributionDto }, { rejectWithValue }) => {
    try {
      return await riskDistributionApi.update(id, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update risk distribution');
    }
  }
);

export const deleteRiskDistribution = createAsyncThunk(
  'riskDistribution/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await riskDistributionApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete risk distribution');
    }
  }
);

const riskDistributionSlice = createSlice({
  name: 'riskDistribution',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<{ subRiskId?: string; year?: string }>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearSelectedItem: (state) => {
      state.selectedItem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchAllRiskDistributions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRiskDistributions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAllRiskDistributions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch by ID
      .addCase(fetchRiskDistributionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRiskDistributionById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchRiskDistributionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch by sub risk
      .addCase(fetchRiskDistributionsBySubRisk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRiskDistributionsBySubRisk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchRiskDistributionsBySubRisk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch by sub risk and year
      .addCase(fetchRiskDistributionBySubRiskAndYear.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRiskDistributionBySubRiskAndYear.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchRiskDistributionBySubRiskAndYear.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create
      .addCase(createRiskDistribution.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRiskDistribution.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createRiskDistribution.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update
      .addCase(updateRiskDistribution.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRiskDistribution.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item.distributionID === action.payload.distributionID);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.selectedItem = action.payload;
      })
      .addCase(updateRiskDistribution.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete
      .addCase(deleteRiskDistribution.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRiskDistribution.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item.distributionID !== action.payload);
        if (state.selectedItem?.distributionID === action.payload) {
          state.selectedItem = null;
        }
      })
      .addCase(deleteRiskDistribution.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setFilters, clearFilters, clearSelectedItem } = riskDistributionSlice.actions;
export default riskDistributionSlice.reducer;