import type { Branch, BranchState, UpdateBranchRequest } from "@/types/branches";
import apiCall from "@/utils/api-call";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const getAllBranches = createAsyncThunk(
  "branches/getAllBranches",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/branches`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const getBranchDetails = createAsyncThunk(
  "branches/getBranchDetails",
  async (branchId: string, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/branches/${branchId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const createBranch = createAsyncThunk(
  "branches/createBranch",
  async (body: Branch, { rejectWithValue }) => {
    try {
      const response = await apiCall.post(`/branches`, body);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const updateBranch = createAsyncThunk(
  "branches/updateBranch",
  async ({ branchId, data }: UpdateBranchRequest, { rejectWithValue }) => {
    try {
      const response = await apiCall.put(`/branches/${branchId}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const deleteBranch = createAsyncThunk(
  "branches/deleteBranch",
  async (branchId: string, { rejectWithValue }) => {
    try {
      const response = await apiCall.delete(`/branches/${branchId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const initialState: BranchState = {
  branches: [],
  branch: null,

  loading: {
    getAllBranches: false,
    getBranchDetails: false,
    createBranch: false,
    updateBranch: false,
    deleteBranch: false,
  },
  error: {
    getAllBranches: null,
    getBranchDetails: null,
    createBranch: null,
    updateBranch: null,
    deleteBranch: null,
  },
  success: {
    createBranch: false,
    updateBranch: false,
    deleteBranch: false,
  },
};

const branchSlice = createSlice({
  name: "branches",
  initialState,
  reducers: {
    clearBranchMessages: (state) => {
      state.error = { ...initialState.error };
      state.success = { ...initialState.success };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllBranches.pending, (state) => {
        state.loading.getAllBranches = true;
        state.error.getAllBranches = null;
      })
      .addCase(getAllBranches.fulfilled, (state, action) => {
        state.loading.getAllBranches = false;
        state.branches = action.payload;
      })
      .addCase(getAllBranches.rejected, (state, action) => {
        state.loading.getAllBranches = false;
        state.error.getAllBranches = action.payload;
      })

      .addCase(getBranchDetails.pending, (state) => {
        state.loading.getBranchDetails = true;
        state.error.getBranchDetails = null;
      })
      .addCase(getBranchDetails.fulfilled, (state, action) => {
        state.loading.getBranchDetails = false;
        state.branch = action.payload;
      })
      .addCase(getBranchDetails.rejected, (state, action) => {
        state.loading.getBranchDetails = false;
        state.error.getBranchDetails = action.payload;
      })

      .addCase(createBranch.pending, (state) => {
        state.loading.createBranch = true;
        state.error.createBranch = null;
        state.success.createBranch = false;
      })
      .addCase(createBranch.fulfilled, (state, action) => {
        state.loading.createBranch = false;
        state.branches.push(action.payload);
        state.success.createBranch = true;
      })
      .addCase(createBranch.rejected, (state, action) => {
        state.loading.createBranch = false;
        state.error.createBranch = action.payload;
      })

      .addCase(updateBranch.pending, (state) => {
        state.loading.updateBranch = true;
        state.error.updateBranch = null;
        state.success.updateBranch = false;
      })
      .addCase(updateBranch.fulfilled, (state, action) => {
        state.loading.updateBranch = false;
        state.success.updateBranch = true;
        state.error.updateBranch = null;
        const updatedBranch: Branch = action.payload;
        state.branches = state.branches.map((branch) =>
          branch.branchID === updatedBranch.branchID ? updatedBranch : branch
        );
        if (state.branch && state.branch.branchID === updatedBranch.branchID) {
          state.branch = updatedBranch;
        }
      })
      .addCase(updateBranch.rejected, (state, action) => {
        state.loading.updateBranch = false;
        state.error.updateBranch = action.payload;
        state.success.updateBranch = false;
      })

      .addCase(deleteBranch.pending, (state) => {
        state.loading.deleteBranch = true;
        state.error.deleteBranch = null;
        state.success.deleteBranch = false;
      })
      .addCase(deleteBranch.fulfilled, (state, action) => {
        state.loading.deleteBranch = false;
        state.success.deleteBranch = true;
        state.branches = state.branches.filter(
          (branch) => branch.branchID !== action.payload
        );
      })
      .addCase(deleteBranch.rejected, (state, action) => {
        state.loading.deleteBranch = false;
        state.error.deleteBranch = action.payload;
      });
  },
});

export const selectBranch = (state: { branches: BranchState }) =>
  state.branches;

export const { clearBranchMessages } = branchSlice.actions;

export default branchSlice.reducer;
