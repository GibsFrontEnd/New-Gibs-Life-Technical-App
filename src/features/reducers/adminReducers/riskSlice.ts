import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type {
  Risk,
  CreateRiskRequest,
  UpdateRiskRequest,
  RiskState,
} from "../../../types/risk";
import type { RootState } from "../../store";
import { decryptData } from "../../../utils/encrypt-utils";

const encryptedToken = localStorage.getItem("token");

const API_BASE_URL = "https://core-api.newgibsonline.com/api";

// You'll need to get this token from your auth system
const getAuthToken = () => {
  return decryptData(encryptedToken);
};

// Async thunks
export const getAllRisks = createAsyncThunk(
  "risks/getAllRisks",
  async (
    {
      pageNumber = 1,
      pageSize = 50,
    }: { pageNumber?: number; pageSize?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/risks?PageNumber=${pageNumber}&PageSize=${pageSize}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Risk[] = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch risks");
    }
  }
);

export const getRiskById = createAsyncThunk(
  "risks/getRiskById",
  async (riskId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/risks/${riskId}`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Risk = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch risk");
    }
  }
);

export const createRisk = createAsyncThunk(
  "risks/createRisk",
  async (riskData: CreateRiskRequest, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/risks`, {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(riskData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Risk = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create risk");
    }
  }
);

export const updateRisk = createAsyncThunk(
  "risks/updateRisk",
  async (
    { id, riskData }: { id: string; riskData: UpdateRiskRequest },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/risks/${id}`, {
        method: "PUT",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(riskData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Risk = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update risk");
    }
  }
);

export const deleteRisk = createAsyncThunk(
  "risks/deleteRisk",
  async (riskId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/risks/${riskId}`, {
        method: "DELETE",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return riskId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete risk");
    }
  }
);

const initialState: RiskState = {
  risks: [],
  loading: {
    getAllRisks: false,
    getRiskById: false,
    createRisk: false,
    updateRisk: false,
    deleteRisk: false,
  },
  success: {
    createRisk: false,
    updateRisk: false,
    deleteRisk: false,
  },
  error: {
    getAllRisks: null,
    getRiskById: null,
    createRisk: null,
    updateRisk: null,
    deleteRisk: null,
  },
};

const riskSlice = createSlice({
  name: "risks",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.success = {
        createRisk: false,
        updateRisk: false,
        deleteRisk: false,
      };
      state.error = {
        getAllRisks: null,
        getRiskById: null,
        createRisk: null,
        updateRisk: null,
        deleteRisk: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all risks
      .addCase(getAllRisks.pending, (state) => {
        state.loading.getAllRisks = true;
        state.error.getAllRisks = null;
      })
      .addCase(
        getAllRisks.fulfilled,
        (state, action: PayloadAction<Risk[]>) => {
          state.loading.getAllRisks = false;
          state.risks = action.payload;
        }
      )
      .addCase(getAllRisks.rejected, (state, action) => {
        state.loading.getAllRisks = false;
        state.error.getAllRisks = action.payload as string;
      })

      // Get risk by ID
      .addCase(getRiskById.pending, (state) => {
        state.loading.getRiskById = true;
        state.error.getRiskById = null;
      })
      .addCase(getRiskById.fulfilled, (state, action: PayloadAction<Risk>) => {
        state.loading.getRiskById = false;
        // Update risk in the list if it exists
        const index = state.risks.findIndex(
          (r) => r.riskID === action.payload.riskID
        );
        if (index !== -1) {
          state.risks[index] = action.payload;
        }
      })
      .addCase(getRiskById.rejected, (state, action) => {
        state.loading.getRiskById = false;
        state.error.getRiskById = action.payload as string;
      })

      // Create risk
      .addCase(createRisk.pending, (state) => {
        state.loading.createRisk = true;
        state.error.createRisk = null;
        state.success.createRisk = false;
      })
      .addCase(createRisk.fulfilled, (state, action: PayloadAction<Risk>) => {
        state.loading.createRisk = false;
        state.success.createRisk = true;
        state.risks.unshift(action.payload);
      })
      .addCase(createRisk.rejected, (state, action) => {
        state.loading.createRisk = false;
        state.error.createRisk = action.payload as string;
      })

      // Update risk
      .addCase(updateRisk.pending, (state) => {
        state.loading.updateRisk = true;
        state.error.updateRisk = null;
        state.success.updateRisk = false;
      })
      .addCase(updateRisk.fulfilled, (state, action: PayloadAction<Risk>) => {
        state.loading.updateRisk = false;
        state.success.updateRisk = true;
        const index = state.risks.findIndex(
          (r) => r.riskID === action.payload.riskID
        );
        if (index !== -1) {
          state.risks[index] = action.payload;
        }
      })
      .addCase(updateRisk.rejected, (state, action) => {
        state.loading.updateRisk = false;
        state.error.updateRisk = action.payload as string;
      })

      // Delete risk
      .addCase(deleteRisk.pending, (state) => {
        state.loading.deleteRisk = true;
        state.error.deleteRisk = null;
        state.success.deleteRisk = false;
      })
      .addCase(deleteRisk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading.deleteRisk = false;
        state.success.deleteRisk = true;
        state.risks = state.risks.filter((r) => r.riskID !== action.payload);
      })
      .addCase(deleteRisk.rejected, (state, action) => {
        state.loading.deleteRisk = false;
        state.error.deleteRisk = action.payload as string;
      });
  },
});

export const { clearMessages } = riskSlice.actions;

export const selectRisks = (state: RootState) => state.risks;

export default riskSlice.reducer;
