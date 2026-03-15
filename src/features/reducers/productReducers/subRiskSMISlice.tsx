// @ts-nocheck
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiCall from "../../../utils/api-call";
import {
  SubRiskSMI,
  SubRiskSMICreateUpdateRequest,
} from "../../../types/sub-risk-smis";

// Get all SubRiskSMIs
export const getAllSubRiskSMIs = createAsyncThunk(
  "subRiskSMIs/getAllSubRiskSMIs",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiCall.get("/SubRiskSMIs");
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Get SubRiskSMI by ID
export const getSubRiskSMIById = createAsyncThunk(
  "subRiskSMIs/getSubRiskSMIById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/SubRiskSMIs/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Create SubRiskSMI
export const createSubRiskSMI = createAsyncThunk(
  "subRiskSMIs/createSubRiskSMI",
  async (data: SubRiskSMICreateUpdateRequest, { rejectWithValue }) => {
    try {
      const response = await apiCall.post("/SubRiskSMIs", data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Update SubRiskSMI
export interface SubRiskSMIUpdatePayload {
  id: number;
  data: Omit<SubRiskSMICreateUpdateRequest, 'submittedBy'> & { modifiedBy: string };
}

export const updateSubRiskSMI = createAsyncThunk(
  "subRiskSMIs/updateSubRiskSMI",
  async ({ id, data }: SubRiskSMIUpdatePayload, { rejectWithValue }) => {
    try {
      const response = await apiCall.put(`/SubRiskSMIs/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Delete SubRiskSMI
export const deleteSubRiskSMI = createAsyncThunk(
  "subRiskSMIs/deleteSubRiskSMI",
  async (id: number, { rejectWithValue }) => {
    try {
      await apiCall.delete(`/SubRiskSMIs/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Get SubRiskSMIs by SubRiskID
export const getSubRiskSMIsBySubRiskId = createAsyncThunk(
  "subRiskSMIs/getSubRiskSMIsBySubRiskId",
  async (subRiskId: string, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/SubRiskSMIs/by-subrisk/${subRiskId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Get SubRiskSMIs by SectionCode
export const getSubRiskSMIsBySectionCode = createAsyncThunk(
  "subRiskSMIs/getSubRiskSMIsBySectionCode",
  async (sectionCode: string, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/SubRiskSMIs/by-section/${sectionCode}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Get active SubRiskSMIs
export const getActiveSubRiskSMIs = createAsyncThunk(
  "subRiskSMIs/getActiveSubRiskSMIs",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiCall.get("/SubRiskSMIs/active");
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Get SubRiskSMIs by SMICode
export const getSubRiskSMIsBySMICode = createAsyncThunk(
  "subRiskSMIs/getSubRiskSMIsBySMICode",
  async (smiCode: string, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/SubRiskSMIs/by-smi-code/${smiCode}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Get SubRiskSMIs with flags
export interface GetSubRiskSMIsWithFlagsParams {
  addSI?: number;
  stockItem?: number;
  multiplier?: number;
}

export const getSubRiskSMIsWithFlags = createAsyncThunk(
  "subRiskSMIs/getSubRiskSMIsWithFlags",
  async (params: GetSubRiskSMIsWithFlagsParams, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.addSI !== undefined) queryParams.append('addSI', params.addSI.toString());
      if (params.stockItem !== undefined) queryParams.append('stockItem', params.stockItem.toString());
      if (params.multiplier !== undefined) queryParams.append('multiplier', params.multiplier.toString());
      
      const response = await apiCall.get(`/SubRiskSMIs/with-flags?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Check if SubRiskSMI exists
export const checkSubRiskSMIExists = createAsyncThunk(
  "subRiskSMIs/checkSubRiskSMIExists",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/SubRiskSMIs/${id}/exists`);
      return { id, exists: response.data };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Bulk update Active status
export interface BulkUpdateActivePayload {
  siDs: number[];
  active: number;
  modifiedBy: string;
}

export const bulkUpdateActive = createAsyncThunk(
  "subRiskSMIs/bulkUpdateActive",
  async (data: BulkUpdateActivePayload, { rejectWithValue }) => {
    try {
      await apiCall.patch("/SubRiskSMIs/bulk-active", data);
      return data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Bulk update flags
export interface BulkUpdateFlagsPayload {
  siDs: number[];
  addSI?: number;
  stockItem?: number;
  multiplier?: number;
  modifiedBy: string;
}

export const bulkUpdateFlags = createAsyncThunk(
  "subRiskSMIs/bulkUpdateFlags",
  async (data: BulkUpdateFlagsPayload, { rejectWithValue }) => {
    try {
      await apiCall.patch("/SubRiskSMIs/bulk-flags", data);
      return data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// State interface
export interface SubRiskSMIState {
  subRiskSMIs: SubRiskSMI[];
  currentSubRiskSMI: SubRiskSMI | null;
  existsResult: { id: number; exists: boolean } | null;

  loading: {
    getAllSubRiskSMIs: boolean;
    getSubRiskSMIById: boolean;
    createSubRiskSMI: boolean;
    updateSubRiskSMI: boolean;
    deleteSubRiskSMI: boolean;
    getSubRiskSMIsBySubRiskId: boolean;
    getSubRiskSMIsBySectionCode: boolean;
    getActiveSubRiskSMIs: boolean;
    getSubRiskSMIsBySMICode: boolean;
    getSubRiskSMIsWithFlags: boolean;
    checkSubRiskSMIExists: boolean;
    bulkUpdateActive: boolean;
    bulkUpdateFlags: boolean;
  };

  error: {
    getAllSubRiskSMIs: unknown;
    getSubRiskSMIById: unknown;
    createSubRiskSMI: unknown;
    updateSubRiskSMI: unknown;
    deleteSubRiskSMI: unknown;
    getSubRiskSMIsBySubRiskId: unknown;
    getSubRiskSMIsBySectionCode: unknown;
    getActiveSubRiskSMIs: unknown;
    getSubRiskSMIsBySMICode: unknown;
    getSubRiskSMIsWithFlags: unknown;
    checkSubRiskSMIExists: unknown;
    bulkUpdateActive: unknown;
    bulkUpdateFlags: unknown;
  };

  success: {
    createSubRiskSMI: boolean;
    updateSubRiskSMI: boolean;
    deleteSubRiskSMI: boolean;
    bulkUpdateActive: boolean;
    bulkUpdateFlags: boolean;
  };
}

const initialState: SubRiskSMIState = {
  subRiskSMIs: [],
  currentSubRiskSMI: null,
  existsResult: null,

  loading: {
    getAllSubRiskSMIs: false,
    getSubRiskSMIById: false,
    createSubRiskSMI: false,
    updateSubRiskSMI: false,
    deleteSubRiskSMI: false,
    getSubRiskSMIsBySubRiskId: false,
    getSubRiskSMIsBySectionCode: false,
    getActiveSubRiskSMIs: false,
    getSubRiskSMIsBySMICode: false,
    getSubRiskSMIsWithFlags: false,
    checkSubRiskSMIExists: false,
    bulkUpdateActive: false,
    bulkUpdateFlags: false,
  },

  error: {
    getAllSubRiskSMIs: null,
    getSubRiskSMIById: null,
    createSubRiskSMI: null,
    updateSubRiskSMI: null,
    deleteSubRiskSMI: null,
    getSubRiskSMIsBySubRiskId: null,
    getSubRiskSMIsBySectionCode: null,
    getActiveSubRiskSMIs: null,
    getSubRiskSMIsBySMICode: null,
    getSubRiskSMIsWithFlags: null,
    checkSubRiskSMIExists: null,
    bulkUpdateActive: null,
    bulkUpdateFlags: null,
  },

  success: {
    createSubRiskSMI: false,
    updateSubRiskSMI: false,
    deleteSubRiskSMI: false,
    bulkUpdateActive: false,
    bulkUpdateFlags: false,
  },
};

const subRiskSMISlice = createSlice({
  name: "subRiskSMIs",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = { ...initialState.error };
      state.success = { ...initialState.success };
    },
    clearSubRiskSMIs: (state) => {
      state.subRiskSMIs = [];
    },
    clearCurrentSubRiskSMI: (state) => {
      state.currentSubRiskSMI = null;
    },
    clearExistsResult: (state) => {
      state.existsResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All SubRiskSMIs
      .addCase(getAllSubRiskSMIs.pending, (state) => {
        state.loading.getAllSubRiskSMIs = true;
        state.error.getAllSubRiskSMIs = null;
      })
      .addCase(getAllSubRiskSMIs.fulfilled, (state, action) => {
        state.loading.getAllSubRiskSMIs = false;
        state.subRiskSMIs = action.payload;
      })
      .addCase(getAllSubRiskSMIs.rejected, (state, action) => {
        state.loading.getAllSubRiskSMIs = false;
        state.error.getAllSubRiskSMIs = action.payload;
      })

      // Get SubRiskSMI by ID
      .addCase(getSubRiskSMIById.pending, (state) => {
        state.loading.getSubRiskSMIById = true;
        state.error.getSubRiskSMIById = null;
      })
      .addCase(getSubRiskSMIById.fulfilled, (state, action) => {
        state.loading.getSubRiskSMIById = false;
        state.currentSubRiskSMI = action.payload;
      })
      .addCase(getSubRiskSMIById.rejected, (state, action) => {
        state.loading.getSubRiskSMIById = false;
        state.error.getSubRiskSMIById = action.payload;
      })

      // Create SubRiskSMI
      .addCase(createSubRiskSMI.pending, (state) => {
        state.loading.createSubRiskSMI = true;
        state.error.createSubRiskSMI = null;
        state.success.createSubRiskSMI = false;
      })
      .addCase(createSubRiskSMI.fulfilled, (state, action) => {
        state.loading.createSubRiskSMI = false;
        state.success.createSubRiskSMI = true;
        state.subRiskSMIs.push(action.payload);
      })
      .addCase(createSubRiskSMI.rejected, (state, action) => {
        state.loading.createSubRiskSMI = false;
        state.error.createSubRiskSMI = action.payload;
      })

      // Update SubRiskSMI
      .addCase(updateSubRiskSMI.pending, (state) => {
        state.loading.updateSubRiskSMI = true;
        state.error.updateSubRiskSMI = null;
        state.success.updateSubRiskSMI = false;
      })
      .addCase(updateSubRiskSMI.fulfilled, (state, action) => {
        state.loading.updateSubRiskSMI = false;
        state.success.updateSubRiskSMI = true;
        const index = state.subRiskSMIs.findIndex(
          (item) => item.sid === action.payload.sid
        );
        if (index !== -1) {
          state.subRiskSMIs[index] = action.payload;
        }
        if (state.currentSubRiskSMI?.sid === action.payload.sid) {
          state.currentSubRiskSMI = action.payload;
        }
      })
      .addCase(updateSubRiskSMI.rejected, (state, action) => {
        state.loading.updateSubRiskSMI = false;
        state.error.updateSubRiskSMI = action.payload;
      })

      // Delete SubRiskSMI
      .addCase(deleteSubRiskSMI.pending, (state) => {
        state.loading.deleteSubRiskSMI = true;
        state.error.deleteSubRiskSMI = null;
        state.success.deleteSubRiskSMI = false;
      })
      .addCase(deleteSubRiskSMI.fulfilled, (state, action) => {
        state.loading.deleteSubRiskSMI = false;
        state.success.deleteSubRiskSMI = true;
        state.subRiskSMIs = state.subRiskSMIs.filter(
          (item) => item.sid !== action.payload
        );
        if (state.currentSubRiskSMI?.sid === action.payload) {
          state.currentSubRiskSMI = null;
        }
      })
      .addCase(deleteSubRiskSMI.rejected, (state, action) => {
        state.loading.deleteSubRiskSMI = false;
        state.error.deleteSubRiskSMI = action.payload;
      })

      // Get SubRiskSMIs by SubRiskID
      .addCase(getSubRiskSMIsBySubRiskId.pending, (state) => {
        state.loading.getSubRiskSMIsBySubRiskId = true;
        state.error.getSubRiskSMIsBySubRiskId = null;
      })
      .addCase(getSubRiskSMIsBySubRiskId.fulfilled, (state, action) => {
        state.loading.getSubRiskSMIsBySubRiskId = false;
        state.subRiskSMIs = action.payload;
      })
      .addCase(getSubRiskSMIsBySubRiskId.rejected, (state, action) => {
        state.loading.getSubRiskSMIsBySubRiskId = false;
        state.error.getSubRiskSMIsBySubRiskId = action.payload;
      })

      // Get SubRiskSMIs by SectionCode
      .addCase(getSubRiskSMIsBySectionCode.pending, (state) => {
        state.loading.getSubRiskSMIsBySectionCode = true;
        state.error.getSubRiskSMIsBySectionCode = null;
      })
      .addCase(getSubRiskSMIsBySectionCode.fulfilled, (state, action) => {
        state.loading.getSubRiskSMIsBySectionCode = false;
        state.subRiskSMIs = action.payload;
      })
      .addCase(getSubRiskSMIsBySectionCode.rejected, (state, action) => {
        state.loading.getSubRiskSMIsBySectionCode = false;
        state.error.getSubRiskSMIsBySectionCode = action.payload;
      })

      // Get Active SubRiskSMIs
      .addCase(getActiveSubRiskSMIs.pending, (state) => {
        state.loading.getActiveSubRiskSMIs = true;
        state.error.getActiveSubRiskSMIs = null;
      })
      .addCase(getActiveSubRiskSMIs.fulfilled, (state, action) => {
        state.loading.getActiveSubRiskSMIs = false;
        state.subRiskSMIs = action.payload;
      })
      .addCase(getActiveSubRiskSMIs.rejected, (state, action) => {
        state.loading.getActiveSubRiskSMIs = false;
        state.error.getActiveSubRiskSMIs = action.payload;
      })

      // Get SubRiskSMIs by SMICode
      .addCase(getSubRiskSMIsBySMICode.pending, (state) => {
        state.loading.getSubRiskSMIsBySMICode = true;
        state.error.getSubRiskSMIsBySMICode = null;
      })
      .addCase(getSubRiskSMIsBySMICode.fulfilled, (state, action) => {
        state.loading.getSubRiskSMIsBySMICode = false;
        state.subRiskSMIs = action.payload;
      })
      .addCase(getSubRiskSMIsBySMICode.rejected, (state, action) => {
        state.loading.getSubRiskSMIsBySMICode = false;
        state.error.getSubRiskSMIsBySMICode = action.payload;
      })

      // Get SubRiskSMIs with Flags
      .addCase(getSubRiskSMIsWithFlags.pending, (state) => {
        state.loading.getSubRiskSMIsWithFlags = true;
        state.error.getSubRiskSMIsWithFlags = null;
      })
      .addCase(getSubRiskSMIsWithFlags.fulfilled, (state, action) => {
        state.loading.getSubRiskSMIsWithFlags = false;
        state.subRiskSMIs = action.payload;
      })
      .addCase(getSubRiskSMIsWithFlags.rejected, (state, action) => {
        state.loading.getSubRiskSMIsWithFlags = false;
        state.error.getSubRiskSMIsWithFlags = action.payload;
      })

      // Check SubRiskSMI Exists
      .addCase(checkSubRiskSMIExists.pending, (state) => {
        state.loading.checkSubRiskSMIExists = true;
        state.error.checkSubRiskSMIExists = null;
      })
      .addCase(checkSubRiskSMIExists.fulfilled, (state, action) => {
        state.loading.checkSubRiskSMIExists = false;
        state.existsResult = action.payload;
      })
      .addCase(checkSubRiskSMIExists.rejected, (state, action) => {
        state.loading.checkSubRiskSMIExists = false;
        state.error.checkSubRiskSMIExists = action.payload;
      })

      // Bulk Update Active
      .addCase(bulkUpdateActive.pending, (state) => {
        state.loading.bulkUpdateActive = true;
        state.error.bulkUpdateActive = null;
        state.success.bulkUpdateActive = false;
      })
      .addCase(bulkUpdateActive.fulfilled, (state, action) => {
        state.loading.bulkUpdateActive = false;
        state.success.bulkUpdateActive = true;
        // Update the active status for the affected items in state
        action.payload.siDs.forEach((sid) => {
          const index = state.subRiskSMIs.findIndex((item) => item.sid === sid);
          if (index !== -1) {
            state.subRiskSMIs[index].active = action.payload.active;
            state.subRiskSMIs[index].modifiedBy = action.payload.modifiedBy;
          }
        });
      })
      .addCase(bulkUpdateActive.rejected, (state, action) => {
        state.loading.bulkUpdateActive = false;
        state.error.bulkUpdateActive = action.payload;
      })

      // Bulk Update Flags
      .addCase(bulkUpdateFlags.pending, (state) => {
        state.loading.bulkUpdateFlags = true;
        state.error.bulkUpdateFlags = null;
        state.success.bulkUpdateFlags = false;
      })
      .addCase(bulkUpdateFlags.fulfilled, (state, action) => {
        state.loading.bulkUpdateFlags = false;
        state.success.bulkUpdateFlags = true;
        // Update the flags for the affected items in state
        action.payload.siDs.forEach((sid) => {
          const index = state.subRiskSMIs.findIndex((item) => item.sid === sid);
          if (index !== -1) {
            if (action.payload.addSI !== undefined) {
              state.subRiskSMIs[index].addSI = action.payload.addSI;
            }
            if (action.payload.stockItem !== undefined) {
              state.subRiskSMIs[index].stockItem = action.payload.stockItem;
            }
            if (action.payload.multiplier !== undefined) {
              state.subRiskSMIs[index].multiplier = action.payload.multiplier;
            }
            state.subRiskSMIs[index].modifiedBy = action.payload.modifiedBy;
          }
        });
      })
      .addCase(bulkUpdateFlags.rejected, (state, action) => {
        state.loading.bulkUpdateFlags = false;
        state.error.bulkUpdateFlags = action.payload;
      });
  },
});

export const selectSubRiskSMIs = (state: { subRiskSMIs: SubRiskSMIState }) =>
  state.subRiskSMIs;

export const {
  clearMessages,
  clearSubRiskSMIs,
  clearCurrentSubRiskSMI,
  clearExistsResult,
} = subRiskSMISlice.actions;

export default subRiskSMISlice.reducer;