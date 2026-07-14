//@ts-nocheck
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "../../store"
import type { Agent, AgentState, CreateAgentRequest, AuthenticateRequest, AuthenticateResponse, UnitResponse, VerifyAgentRequest } from "../../../types/agent"
import { decryptData } from "../../../utils/encrypt-utils";

const encryptedToken = localStorage.getItem("token");
const API_BASE_URL = "https://lifetechnicalapi.newgibsonline.com/api";
const AUTH_TOKEN = decryptData(encryptedToken);

// ==============================
// 1. AUTHENTICATE AGENT
// ==============================
export const authenticateAgent = createAsyncThunk(
  "agents/authenticateAgent",
  async (credentials: AuthenticateRequest, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/Agents/agent/authenticate`, {
        method: "POST",
        headers: {
          "accept": "text/plain",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed! status: ${response.status}`);
      }

      const data = await response.json();
      return data as AuthenticateResponse;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Authentication failed");
    }
  }
);

// ==============================
// 2. GET ALL AGENTS (with pagination) - FIXED
// ==============================
export const getAllAgents = createAsyncThunk(
  "agents/getAllAgents",
  async ({ pageNumber = 1, pageSize = 10 }: { pageNumber?: number; pageSize?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/Agents?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
        method: "GET",
        headers: {
          "accept": "text/plain",
          "Authorization": `Bearer ${AUTH_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Raw API Response:", data); // Debug log
      
      // Check if data is an array (direct response)
      if (Array.isArray(data)) {
        // API returned an array directly
        return {
          data: data,
          pageNumber: pageNumber,
          pageSize: pageSize,
          totalRecords: data.length,
          totalPages: Math.ceil(data.length / pageSize),
          hasNextPage: pageNumber * pageSize < data.length,
          hasPreviousPage: pageNumber > 1,
        };
      }
      
      // If data has a 'data' property (paginated response)
      if (data && data.data && Array.isArray(data.data)) {
        return {
          data: data.data,
          pageNumber: data.pageNumber || pageNumber,
          pageSize: data.pageSize || pageSize,
          totalRecords: data.totalRecords || data.data.length,
          totalPages: data.totalPages || Math.ceil((data.totalRecords || data.data.length) / pageSize),
          hasNextPage: data.hasNextPage || false,
          hasPreviousPage: data.hasPreviousPage || false,
        };
      }
      
      // Fallback - return empty array
      return {
        data: [],
        pageNumber: pageNumber,
        pageSize: pageSize,
        totalRecords: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch agents");
    }
  }
);

// ==============================
// 3. GET SINGLE AGENT
// ==============================
export const getAgent = createAsyncThunk(
  "agents/getAgent",
  async (agentId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/Agents/${agentId}`, {
        method: "GET",
        headers: {
          "accept": "text/plain",
          "Authorization": `Bearer ${AUTH_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as Agent;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch agent");
    }
  }
);

// ==============================
// 4. GET UNITS
// ==============================
export const getUnits = createAsyncThunk(
  "agents/getUnits",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/Agents/Unit`, {
        method: "GET",
        headers: {
          "accept": "text/plain",
          "Authorization": `Bearer ${AUTH_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as UnitResponse[];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch units");
    }
  }
);

// ==============================
// 5. VERIFY AGENT (Admin)
// ==============================
export const verifyAgent = createAsyncThunk(
  "agents/verifyAgent",
  async (verificationData: VerifyAgentRequest, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/Agents/admin/verify-agent`, {
        method: "POST",
        headers: {
          "accept": "*/*",
          "Authorization": `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(verificationData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to verify agent");
    }
  }
);

// ==============================
// 6. CREATE AGENT
// ==============================
export const createAgent = createAsyncThunk(
  "agents/createAgent",
  async (agentData: CreateAgentRequest, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/Agents/create`, {
        method: "POST",
        headers: {
          "accept": "*/*",
          "Authorization": `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(agentData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to create agent");
    }
  }
);

// ==============================
// 7. UPDATE AGENT
// ==============================
export const updateAgent = createAsyncThunk(
  "agents/updateAgent",
  async ({ agentId, agentData }: { agentId: string; agentData: Partial<Agent> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/Agents/agent/${agentId}`, {
        method: "PUT",
        headers: {
          "accept": "*/*",
          "Authorization": `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(agentData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { agentId, agentData: data };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to update agent");
    }
  }
);

// ==============================
// 8. DELETE AGENT
// ==============================
export const deleteAgent = createAsyncThunk(
  "agents/deleteAgent",
  async (agentId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/Agents/${agentId}`, {
        method: "DELETE",
        headers: {
          "accept": "*/*",
          "Authorization": `Bearer ${AUTH_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return agentId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to delete agent");
    }
  }
);

// ==============================
// 9. UPDATE PASSWORD
// ==============================
export const updatePassword = createAsyncThunk(
  "agents/updatePassword",
  async ({ agentId, passwordData }: { agentId: string; passwordData: { oldPassword: string; newPassword: string } }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/Agents/update-password`, {
        method: "PATCH",
        headers: {
          "accept": "*/*",
          "Authorization": `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          ...passwordData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to update password");
    }
  }
);

// ==============================
// INITIAL STATE
// ==============================
const initialState: AgentState = {
  agents: [],
  currentAgent: null,
  units: [],
  isAuthenticated: false,
  pagination: {
    pageNumber: 1,
    pageSize: 10,
    totalRecords: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  loading: {
    authenticateAgent: false,
    getAllAgents: false,
    getAgent: false,
    getUnits: false,
    verifyAgent: false,
    createAgent: false,
    updateAgent: false,
    deleteAgent: false,
    updatePassword: false,
  },
  error: {
    authenticateAgent: null,
    getAllAgents: null,
    getAgent: null,
    getUnits: null,
    verifyAgent: null,
    createAgent: null,
    updateAgent: null,
    deleteAgent: null,
    updatePassword: null,
  },
  success: {
    authenticateAgent: false,
    verifyAgent: false,
    createAgent: false,
    updateAgent: false,
    deleteAgent: false,
    updatePassword: false,
  },
};

// ==============================
// SLICE
// ==============================
const agentSlice = createSlice({
  name: "agents",
  initialState,
  reducers: {
    setCurrentAgent: (state, action: PayloadAction<Agent | null>) => {
      state.currentAgent = action.payload;
    },
    clearMessages: (state) => {
      state.error = {
        authenticateAgent: null,
        getAllAgents: null,
        getAgent: null,
        getUnits: null,
        verifyAgent: null,
        createAgent: null,
        updateAgent: null,
        deleteAgent: null,
        updatePassword: null,
      };
      state.success = {
        authenticateAgent: false,
        verifyAgent: false,
        createAgent: false,
        updateAgent: false,
        deleteAgent: false,
        updatePassword: false,
      };
    },
    clearAuth: (state) => {
      state.isAuthenticated = false;
      state.currentAgent = null;
    },
  },
  extraReducers: (builder) => {
    // ==========================
    // Get All Agents
    // ==========================
    builder
      .addCase(getAllAgents.pending, (state) => {
        state.loading.getAllAgents = true;
        state.error.getAllAgents = null;
      })
      .addCase(getAllAgents.fulfilled, (state, action) => {
        state.loading.getAllAgents = false;
        state.agents = action.payload.data || [];
        state.pagination = {
          pageNumber: action.payload.pageNumber || 1,
          pageSize: action.payload.pageSize || 10,
          totalRecords: action.payload.totalRecords || 0,
          totalPages: action.payload.totalPages || 0,
          hasNextPage: action.payload.hasNextPage || false,
          hasPreviousPage: action.payload.hasPreviousPage || false,
        };
        console.log("Agents loaded:", state.agents.length);
      })
      .addCase(getAllAgents.rejected, (state, action) => {
        state.loading.getAllAgents = false;
        state.error.getAllAgents = action.payload as string;
        console.error("Failed to load agents:", action.payload);
      })

    // ==========================
    // Get Single Agent
    // ==========================
    builder
      .addCase(getAgent.pending, (state) => {
        state.loading.getAgent = true;
        state.error.getAgent = null;
      })
      .addCase(getAgent.fulfilled, (state, action) => {
        state.loading.getAgent = false;
        state.currentAgent = action.payload;
      })
      .addCase(getAgent.rejected, (state, action) => {
        state.loading.getAgent = false;
        state.error.getAgent = action.payload as string;
      })

    // ==========================
    // Get Units
    // ==========================
    builder
      .addCase(getUnits.pending, (state) => {
        state.loading.getUnits = true;
        state.error.getUnits = null;
      })
      .addCase(getUnits.fulfilled, (state, action) => {
        state.loading.getUnits = false;
        state.units = action.payload;
      })
      .addCase(getUnits.rejected, (state, action) => {
        state.loading.getUnits = false;
        state.error.getUnits = action.payload as string;
      })

    // ==========================
    // Verify Agent
    // ==========================
    builder
      .addCase(verifyAgent.pending, (state) => {
        state.loading.verifyAgent = true;
        state.error.verifyAgent = null;
        state.success.verifyAgent = false;
      })
      .addCase(verifyAgent.fulfilled, (state) => {
        state.loading.verifyAgent = false;
        state.success.verifyAgent = true;
      })
      .addCase(verifyAgent.rejected, (state, action) => {
        state.loading.verifyAgent = false;
        state.error.verifyAgent = action.payload as string;
      })

    // ==========================
    // Create Agent
    // ==========================
    builder
      .addCase(createAgent.pending, (state) => {
        state.loading.createAgent = true;
        state.error.createAgent = null;
        state.success.createAgent = false;
      })
      .addCase(createAgent.fulfilled, (state, action) => {
        state.loading.createAgent = false;
        state.success.createAgent = true;
        if (action.payload) {
          state.agents.push(action.payload);
        }
      })
      .addCase(createAgent.rejected, (state, action) => {
        state.loading.createAgent = false;
        state.error.createAgent = action.payload as string;
      })

    // ==========================
    // Update Agent
    // ==========================
    builder
      .addCase(updateAgent.pending, (state) => {
        state.loading.updateAgent = true;
        state.error.updateAgent = null;
        state.success.updateAgent = false;
      })
      .addCase(updateAgent.fulfilled, (state, action) => {
        state.loading.updateAgent = false;
        state.success.updateAgent = true;
        const index = state.agents.findIndex((a) => a.agentID === action.payload.agentId);
        if (index !== -1 && action.payload.agentData) {
          state.agents[index] = { ...state.agents[index], ...action.payload.agentData };
        }
        if (state.currentAgent?.agentID === action.payload.agentId) {
          state.currentAgent = { ...state.currentAgent, ...action.payload.agentData };
        }
      })
      .addCase(updateAgent.rejected, (state, action) => {
        state.loading.updateAgent = false;
        state.error.updateAgent = action.payload as string;
      })

    // ==========================
    // Delete Agent
    // ==========================
    builder
      .addCase(deleteAgent.pending, (state) => {
        state.loading.deleteAgent = true;
        state.error.deleteAgent = null;
        state.success.deleteAgent = false;
      })
      .addCase(deleteAgent.fulfilled, (state, action) => {
        state.loading.deleteAgent = false;
        state.success.deleteAgent = true;
        state.agents = state.agents.filter((a) => a.agentID !== action.payload);
        if (state.currentAgent?.agentID === action.payload) {
          state.currentAgent = null;
        }
      })
      .addCase(deleteAgent.rejected, (state, action) => {
        state.loading.deleteAgent = false;
        state.error.deleteAgent = action.payload as string;
      })

    // ==========================
    // Update Password
    // ==========================
    builder
      .addCase(updatePassword.pending, (state) => {
        state.loading.updatePassword = true;
        state.error.updatePassword = null;
        state.success.updatePassword = false;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.loading.updatePassword = false;
        state.success.updatePassword = true;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading.updatePassword = false;
        state.error.updatePassword = action.payload as string;
      })

    // ==========================
    // Authenticate Agent
    // ==========================
    builder
      .addCase(authenticateAgent.pending, (state) => {
        state.loading.authenticateAgent = true;
        state.error.authenticateAgent = null;
        state.success.authenticateAgent = false;
      })
      .addCase(authenticateAgent.fulfilled, (state, action) => {
        state.loading.authenticateAgent = false;
        state.success.authenticateAgent = true;
        state.isAuthenticated = true;
        state.currentAgent = action.payload.agent;
      })
      .addCase(authenticateAgent.rejected, (state, action) => {
        state.loading.authenticateAgent = false;
        state.error.authenticateAgent = action.payload as string;
        state.isAuthenticated = false;
      });
  },
});

// ==============================
// EXPORT ACTIONS & SELECTORS
// ==============================
export const { setCurrentAgent, clearMessages, clearAuth } = agentSlice.actions;

export const selectAgents = (state: RootState) => state.agents?.agents || [];
export const selectCurrentAgent = (state: RootState) => state.agents?.currentAgent || null;
export const selectUnits = (state: RootState) => state.agents?.units || [];
export const selectAgentPagination = (state: RootState) => state.agents?.pagination || {
  pageNumber: 1,
  pageSize: 10,
  totalRecords: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};
export const selectAgentLoading = (state: RootState) => state.agents?.loading || {
  authenticateAgent: false,
  getAllAgents: false,
  getAgent: false,
  getUnits: false,
  verifyAgent: false,
  createAgent: false,
  updateAgent: false,
  deleteAgent: false,
  updatePassword: false,
};
export const selectAgentError = (state: RootState) => state.agents?.error || {
  authenticateAgent: null,
  getAllAgents: null,
  getAgent: null,
  getUnits: null,
  verifyAgent: null,
  createAgent: null,
  updateAgent: null,
  deleteAgent: null,
  updatePassword: null,
};
export const selectAgentSuccess = (state: RootState) => state.agents?.success || {
  authenticateAgent: false,
  verifyAgent: false,
  createAgent: false,
  updateAgent: false,
  deleteAgent: false,
  updatePassword: false,
};
export const selectIsAuthenticated = (state: RootState) => state.agents?.isAuthenticated || false;

export default agentSlice.reducer;