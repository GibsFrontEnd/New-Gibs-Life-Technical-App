import type {
  CreateMktStaffRequest,
  MarketingStaffState,
  MktStaff,
  UpdateMktStaffRequest,
} from "@/types/marketing-staff";
import apiCall from "@/utils/api-call";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const fetchMktStaffs = createAsyncThunk(
  "marketingStaff/fetchMktStaffs",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiCall.get<MktStaff[]>("/MktStaffs");
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchMktStaff = createAsyncThunk(
  "marketingStaff/fetchMktStaff",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiCall.get<MktStaff>(`/MktStaffs/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const createMktStaff = createAsyncThunk(
  "marketingStaff/createMktStaff",
  async (body: CreateMktStaffRequest, { rejectWithValue }) => {
    try {
      const response = await apiCall.post<MktStaff>("/MktStaffs", body);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const updateMktStaff = createAsyncThunk(
  "marketingStaff/updateMktStaff",
  async (
    { id, data }: { id: string; data: UpdateMktStaffRequest },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiCall.put(`/MktStaffs/${id}`, data);
      return { id, data: response.data };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const deleteMktStaff = createAsyncThunk(
  "marketingStaff/deleteMktStaff",
  async (id: string, { rejectWithValue }) => {
    try {
      await apiCall.delete(`/MktStaffs/${id}`);
      return { id };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const initialState: MarketingStaffState = {
  mktStaffs: [],
  selectedMktStaff: null,

  loading: {
    fetchMktStaffs: false,
    fetchMktStaff: false,
    createMktStaff: false,
    updateMktStaff: false,
    deleteMktStaff: false,
  },
  
  error: {
    fetchMktStaffs: null,
    fetchMktStaff: null,
    createMktStaff: null,
    updateMktStaff: null,
    deleteMktStaff: null,
  },

  success: {
    createMktStaff: false,
    updateMktStaff: false,
    deleteMktStaff: false,
  },
};

const marketingStaffSlice = createSlice({
  name: "marketingStaff",
  initialState,
  reducers: {
    clearMarketingStaffMessages: (state) => {
      state.error = { ...initialState.error };
      state.success = { ...initialState.success };
    },
    clearSelectedMktStaff: (state) => {
      state.selectedMktStaff = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Marketing Staffs
      .addCase(fetchMktStaffs.pending, (state) => {
        state.loading.fetchMktStaffs = true;
        state.error.fetchMktStaffs = null;
      })
      .addCase(fetchMktStaffs.fulfilled, (state, action) => {
        state.loading.fetchMktStaffs = false;
        state.mktStaffs = action.payload;
      })
      .addCase(fetchMktStaffs.rejected, (state, action) => {
        state.loading.fetchMktStaffs = false;
        state.error.fetchMktStaffs = action.payload;
      })

      // Fetch Single Marketing Staff
      .addCase(fetchMktStaff.pending, (state) => {
        state.loading.fetchMktStaff = true;
        state.error.fetchMktStaff = null;
        state.selectedMktStaff = null;
      })
      .addCase(fetchMktStaff.fulfilled, (state, action) => {
        state.loading.fetchMktStaff = false;
        state.selectedMktStaff = action.payload;
      })
      .addCase(fetchMktStaff.rejected, (state, action) => {
        state.loading.fetchMktStaff = false;
        state.error.fetchMktStaff = action.payload;
      })

      // Create Marketing Staff
      .addCase(createMktStaff.pending, (state) => {
        state.loading.createMktStaff = true;
        state.error.createMktStaff = null;
      })
      .addCase(createMktStaff.fulfilled, (state, action) => {
        state.loading.createMktStaff = false;
        state.mktStaffs.push(action.payload);
        state.success.createMktStaff = true;
      })
      .addCase(createMktStaff.rejected, (state, action) => {
        state.loading.createMktStaff = false;
        state.error.createMktStaff = action.payload;
      })

      // Update Marketing Staff
      .addCase(updateMktStaff.pending, (state) => {
        state.loading.updateMktStaff = true;
        state.error.updateMktStaff = null;
      })
      .addCase(updateMktStaff.fulfilled, (state, action) => {
        state.loading.updateMktStaff = false;
        const { id } = action.payload;
        const index = state.mktStaffs.findIndex((staff) => staff.mktStaffID === id);
        if (index !== -1) {
          // Update the staff in the list with the updated data
          const updatedStaff = { ...state.mktStaffs[index], ...action.payload.data };
          state.mktStaffs[index] = updatedStaff;
        }
        // Update selected staff if it's the same one being updated
        if (state.selectedMktStaff && state.selectedMktStaff.mktStaffID === id) {
          state.selectedMktStaff = { ...state.selectedMktStaff, ...action.payload.data };
        }
        state.success.updateMktStaff = true;
      })
      .addCase(updateMktStaff.rejected, (state, action) => {
        state.loading.updateMktStaff = false;
        state.error.updateMktStaff = action.payload;
      })

      // Delete Marketing Staff
      .addCase(deleteMktStaff.pending, (state) => {
        state.loading.deleteMktStaff = true;
        state.error.deleteMktStaff = null;
      })
      .addCase(deleteMktStaff.fulfilled, (state, action) => {
        state.loading.deleteMktStaff = false;
        const { id } = action.payload;
        state.mktStaffs = state.mktStaffs.filter((staff) => staff.mktStaffID !== id);
        // Clear selected staff if it was the one being deleted
        if (state.selectedMktStaff && state.selectedMktStaff.mktStaffID === id) {
          state.selectedMktStaff = null;
        }
        state.success.deleteMktStaff = true;
      })
      .addCase(deleteMktStaff.rejected, (state, action) => {
        state.loading.deleteMktStaff = false;
        state.error.deleteMktStaff = action.payload;
      });
  },
});

export const { clearMarketingStaffMessages, clearSelectedMktStaff } = 
  marketingStaffSlice.actions;

export const selectMarketingStaff = (state: {
  marketingStaff: MarketingStaffState;
}) => state.marketingStaff;

export default marketingStaffSlice.reducer;