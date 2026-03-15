//@ts-nocheck
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "../../store"
import type { Agent, AgentState, CreateAgentRequest, AgentPaginationResponse } from "../../../types/agent"
import { decryptData } from "../../../utils/encrypt-utils";

const encryptedToken = localStorage.getItem("token");

const API_BASE_URL = "https://core-api.newgibsonline.com/api";

// You'll need to get this token from your auth system
  const AUTH_TOKEN = decryptData(encryptedToken);

// Async thunks
export const getAllAgents = createAsyncThunk(
  "agents/getAllAgents",
  async ({ pageNumber = 1, pageSize = 10 }: { pageNumber?: number; pageSize?: number }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/agents?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
        method: "GET",
        headers: {
          accept: "text/plain",
          Authorization: "Bearer "+AUTH_TOKEN,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data as AgentPaginationResponse
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch agents")
    }
  },
)

export const getAgent = createAsyncThunk("agents/getAgent", async (agentID: string, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/agents/${agentID}`, {
      method: "GET",
      headers: {
        accept: "text/plain",
        Authorization: AUTH_TOKEN,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data as Agent
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch agent")
  }
})

export const createAgent = createAsyncThunk(
  "agents/createAgent",
  async (agentData: CreateAgentRequest, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        PartyID: agentData.PartyID,
        StateID: agentData.StateID,
        Party: agentData.Party,
        Description: agentData.Description,
        PartyType: agentData.PartyType,
        Address: agentData.Address,
        mobilePhone: agentData.mobilePhone,
        LandPhone: agentData.LandPhone,
        Email: agentData.Email,
        Fax: agentData.Fax,
        InsContact: agentData.InsContact,
        FinContact: agentData.FinContact,
        CreditLimit: agentData.CreditLimit.toString(),
        ComRate: agentData.ComRate.toString(),
        StartDate: agentData.StartDate,
        ExpiryDate: agentData.ExpiryDate,
        Remarks: agentData.Remarks,
        Tag: agentData.Tag,
        Deleted: agentData.Deleted.toString(),
        Active: agentData.Active.toString(),
        SubmittedBy: agentData.SubmittedBy,
        ModifiedBy: agentData.ModifiedBy,
        Z_NAICOM_ID: agentData.Z_NAICOM_ID,
      })

      const response = await fetch(`${API_BASE_URL}/agents?${queryParams.toString()}`, {
        method: "POST",
        headers: {
          accept: "text/plain",
          Authorization: AUTH_TOKEN,
        },
        body: "",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.text()
      return { partyID: agentData.PartyID, response: data }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to create agent")
    }
  },
)

export const updateAgent = createAsyncThunk(
  "agents/updateAgent",
  async ({ agentID, agentData }: { agentID: string; agentData: Partial<Agent> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/agents/${agentID}`, {
        method: "PUT",
        headers: {
          accept: "*/*",
          Authorization: AUTH_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(agentData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return { agentID, agentData }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to update agent")
    }
  },
)

export const deleteAgent = createAsyncThunk("agents/deleteAgent", async (agentID: string, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/agents/${agentID}`, {
      method: "DELETE",
      headers: {
        accept: "*/*",
        Authorization: AUTH_TOKEN,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return agentID
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to delete agent")
  }
})

const initialState: AgentState = {
  agents: [],
  currentAgent: null,
  pagination: {
    pageNumber: 1,
    pageSize: 10,
    totalRecords: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  loading: {
    getAllAgents: false,
    getAgent: false,
    createAgent: false,
    updateAgent: false,
    deleteAgent: false,
  },
  error: {
    getAllAgents: null,
    getAgent: null,
    createAgent: null,
    updateAgent: null,
    deleteAgent: null,
  },
  success: {
    createAgent: false,
    updateAgent: false,
    deleteAgent: false,
  },
}

const agentSlice = createSlice({
  name: "agents",
  initialState,
  reducers: {
    setCurrentAgent: (state, action: PayloadAction<Agent | null>) => {
      state.currentAgent = action.payload
    },
    clearMessages: (state) => {
      state.error = {
        getAllAgents: null,
        getAgent: null,
        createAgent: null,
        updateAgent: null,
        deleteAgent: null,
      }
      state.success = {
        createAgent: false,
        updateAgent: false,
        deleteAgent: false,
      }
    },
  },
  extraReducers: (builder) => {
    // Get all agents
    builder
      .addCase(getAllAgents.pending, (state) => {
        state.loading.getAllAgents = true
        state.error.getAllAgents = null
      })
      .addCase(getAllAgents.fulfilled, (state, action) => {
        state.loading.getAllAgents = false
        state.agents = action.payload.data
        state.pagination = {
          pageNumber: action.payload.pageNumber,
          pageSize: action.payload.pageSize,
          totalRecords: action.payload.totalRecords,
          totalPages: action.payload.totalPages,
          hasNextPage: action.payload.hasNextPage,
          hasPreviousPage: action.payload.hasPreviousPage,
        }
      })
      .addCase(getAllAgents.rejected, (state, action) => {
        state.loading.getAllAgents = false
        state.error.getAllAgents = action.payload as string
      })

    // Get agent
    builder
      .addCase(getAgent.pending, (state) => {
        state.loading.getAgent = true
        state.error.getAgent = null
      })
      .addCase(getAgent.fulfilled, (state, action) => {
        state.loading.getAgent = false
        state.currentAgent = action.payload
      })
      .addCase(getAgent.rejected, (state, action) => {
        state.loading.getAgent = false
        state.error.getAgent = action.payload as string
      })

    // Create agent
    builder
      .addCase(createAgent.pending, (state) => {
        state.loading.createAgent = true
        state.error.createAgent = null
        state.success.createAgent = false
      })
      .addCase(createAgent.fulfilled, (state) => {
        state.loading.createAgent = false
        state.success.createAgent = true
      })
      .addCase(createAgent.rejected, (state, action) => {
        state.loading.createAgent = false
        state.error.createAgent = action.payload as string
      })

    // Update agent
    builder
      .addCase(updateAgent.pending, (state) => {
        state.loading.updateAgent = true
        state.error.updateAgent = null
        state.success.updateAgent = false
      })
      .addCase(updateAgent.fulfilled, (state, action) => {
        state.loading.updateAgent = false
        state.success.updateAgent = true
        const index = state.agents.findIndex((a) => a.partyID === action.payload.agentID)
        if (index !== -1) {
          state.agents[index] = { ...state.agents[index], ...action.payload.agentData }
        }
        if (state.currentAgent?.partyID === action.payload.agentID) {
          state.currentAgent = { ...state.currentAgent, ...action.payload.agentData }
        }
      })
      .addCase(updateAgent.rejected, (state, action) => {
        state.loading.updateAgent = false
        state.error.updateAgent = action.payload as string
      })

    // Delete agent
    builder
      .addCase(deleteAgent.pending, (state) => {
        state.loading.deleteAgent = true
        state.error.deleteAgent = null
        state.success.deleteAgent = false
      })
      .addCase(deleteAgent.fulfilled, (state, action) => {
        state.loading.deleteAgent = false
        state.success.deleteAgent = true
        state.agents = state.agents.filter((a) => a.partyID !== action.payload)
        if (state.currentAgent?.partyID === action.payload) {
          state.currentAgent = null
        }
      })
      .addCase(deleteAgent.rejected, (state, action) => {
        state.loading.deleteAgent = false
        state.error.deleteAgent = action.payload as string
      })
  },
})

export const { setCurrentAgent, clearMessages } = agentSlice.actions

export const selectAgents = (state: RootState) => state.parties

export default agentSlice.reducer
