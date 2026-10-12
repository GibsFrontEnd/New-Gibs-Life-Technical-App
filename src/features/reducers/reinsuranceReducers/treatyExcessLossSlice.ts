//@ts-nocheck
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { treatyExcessLossService } from '../../../services/treatyExcessLossService';
import { TreatyExcessLossDto, CreateTreatyExcessLossDto, TreatyExcessLossState } from '../../../types/treatyExcessLoss';

const initialState: TreatyExcessLossState = {
  records: [],
  selectedRecord: null,
  loading: false,
  error: null,
};

// Async Thunks
export const fetchAllTreatyExcessLoss = createAsyncThunk(
  'treatyExcessLoss/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await treatyExcessLossService.getAll();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch records');
    }
  }
);

export const fetchTreatyExcessLossById = createAsyncThunk(
  'treatyExcessLoss/fetchById',
  async ({ subriskId, underYr }: { subriskId: string; underYr: number }, { rejectWithValue }) => {
    try {
      const response = await treatyExcessLossService.getById(subriskId, underYr);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch record');
    }
  }
);

// Update the create async thunk
export const createTreatyExcessLoss = createAsyncThunk(
  'treatyExcessLoss/create',
  async (data: CreateTreatyExcessLossDto, { rejectWithValue }) => {
    try {
      const response = await treatyExcessLossService.create(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create record');
    }
  }
);

export const updateTreatyExcessLoss = createAsyncThunk(
  'treatyExcessLoss/update',
  async (data: TreatyExcessLossDto, { rejectWithValue }) => {
    try {
      const response = await treatyExcessLossService.update(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update record');
    }
  }
);

export const deleteTreatyExcessLoss = createAsyncThunk(
  'treatyExcessLoss/delete',
  async ({ subriskId, underYr }: { subriskId: string; underYr: number }, { rejectWithValue }) => {
    try {
      await treatyExcessLossService.delete(subriskId, underYr);
      return { subriskId, underYr };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete record');
    }
  }
);

const treatyExcessLossSlice = createSlice({
  name: 'treatyExcessLoss',
  initialState,
  reducers: {
    clearSelectedRecord: (state) => {
      state.selectedRecord = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchAllTreatyExcessLoss.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllTreatyExcessLoss.fulfilled, (state, action: PayloadAction<TreatyExcessLossDto[]>) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchAllTreatyExcessLoss.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch By ID
      .addCase(fetchTreatyExcessLossById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTreatyExcessLossById.fulfilled, (state, action: PayloadAction<TreatyExcessLossDto>) => {
        state.loading = false;
        state.selectedRecord = action.payload;
      })
      .addCase(fetchTreatyExcessLossById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createTreatyExcessLoss.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTreatyExcessLoss.fulfilled, (state, action: PayloadAction<TreatyExcessLossDto>) => {
        state.loading = false;
        state.records.unshift(action.payload); // Add to beginning for latest first
      })
      .addCase(createTreatyExcessLoss.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update
      .addCase(updateTreatyExcessLoss.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTreatyExcessLoss.fulfilled, (state, action: PayloadAction<TreatyExcessLossDto>) => {
        state.loading = false;
        const index = state.records.findIndex(
          r => r.subriskID === action.payload.subriskID && r.underYr === action.payload.underYr
        );
        if (index !== -1) {
          state.records[index] = action.payload;
        }
        state.selectedRecord = action.payload;
      })
      .addCase(updateTreatyExcessLoss.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete
      .addCase(deleteTreatyExcessLoss.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTreatyExcessLoss.fulfilled, (state, action: PayloadAction<{ subriskId: string; underYr: number }>) => {
        state.loading = false;
        state.records = state.records.filter(
          r => !(r.subriskID === action.payload.subriskId && r.underYr === action.payload.underYr)
        );
        // Clear selected record if it was deleted
        if (state.selectedRecord?.subriskID === action.payload.subriskId && 
            state.selectedRecord?.underYr === action.payload.underYr) {
          state.selectedRecord = null;
        }
      })
      .addCase(deleteTreatyExcessLoss.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSelectedRecord, clearError } = treatyExcessLossSlice.actions;
export default treatyExcessLossSlice.reducer;