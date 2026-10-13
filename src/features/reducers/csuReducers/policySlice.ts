//@ts-nocheck
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import apiCall from "../../../utils/api-call"
import type {
  CreatePolicyRequest,
  RenewPolicyRequest,
  PolicySectionsFilterRequest,
  PolicyState,
} from "../../../types/policy"

// Get All Policies
export const getAllPolicies = createAsyncThunk("policies/getAllPolicies", async (_, { rejectWithValue }) => {
  try {
    const response = await apiCall.get("/policies")
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch policies")
  }
})

// Get Policy Details
export const getPolicyDetails = createAsyncThunk(
  "policies/getPolicyDetails",
  async (policyNo: string, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/policies/${encodeURIComponent(policyNo)}`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch policy details")
    }
  },
)

// Get Policy Sections with Filter
export const getPolicySections = createAsyncThunk(
  "policies/getPolicySections",
  async (filterData: PolicySectionsFilterRequest, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        fieldName: filterData.fieldName,
        fieldValue: filterData.fieldValue,
      })
      const response = await apiCall.get(`/policies/sections?${params}`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch policy sections")
    }
  },
)

// Create Policy
export const createPolicy = createAsyncThunk(
  "policies/createPolicy",
  async (policyData: CreatePolicyRequest, { rejectWithValue }) => {
    try {
      const response = await apiCall.post("/policies", policyData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to create policy")
    }
  },
)

// Renew Policy
export const renewPolicy = createAsyncThunk(
  "policies/renewPolicy",
  async ({ policyNo, renewData }: { policyNo: string; renewData: RenewPolicyRequest }, { rejectWithValue }) => {
    try {
      const response = await apiCall.post(`/policies/${encodeURIComponent(policyNo)}/renew`, renewData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to renew policy")
    }
  },
)

// Endorse Policy
export const endorsePolicy = createAsyncThunk(
  "policies/endorsePolicy",
  async (policyNo: string, { rejectWithValue }) => {
    try {
      const response = await apiCall.post(`/policies/${encodeURIComponent(policyNo)}/endorse`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to endorse policy")
    }
  },
)

// Cancel Policy
export const cancelPolicy = createAsyncThunk("policies/cancelPolicy", async (policyNo: string, { rejectWithValue }) => {
  try {
    const response = await apiCall.post(`/policies/${encodeURIComponent(policyNo)}/cancel`)
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message || "Failed to cancel policy")
  }
})

// NIIP Upload
export const niipUpload = createAsyncThunk("policies/niipUpload", async (policyNo: string, { rejectWithValue }) => {
  try {
    const response = await apiCall.post(`/policies/${encodeURIComponent(policyNo)}/niip-upload`)
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message || "Failed to upload to NIIP")
  }
})

const initialState: PolicyState = {
  policies: [],
  currentPolicy: null,
  policySections: [],
  loading: {
    getAllPolicies: false,
    getPolicyDetails: false,
    createPolicy: false,
    renewPolicy: false,
    endorsePolicy: false,
    cancelPolicy: false,
    niipUpload: false,
    getPolicySections: false,
  },
  error: {
    getAllPolicies: null,
    getPolicyDetails: null,
    createPolicy: null,
    renewPolicy: null,
    endorsePolicy: null,
    cancelPolicy: null,
    niipUpload: null,
    getPolicySections: null,
  },
  success: {
    createPolicy: false,
    renewPolicy: false,
    endorsePolicy: false,
    cancelPolicy: false,
    niipUpload: false,
  },
  niipResponse: null,
}

const policySlice = createSlice({
  name: "policies",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = { ...initialState.error }
      state.success = { ...initialState.success }
    },
    clearNiipResponse: (state) => {
      state.niipResponse = null
    },
    setCurrentPolicy: (state, action) => {
      state.currentPolicy = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All Policies
      .addCase(getAllPolicies.pending, (state) => {
        state.loading.getAllPolicies = true
        state.error.getAllPolicies = null
      })
      .addCase(getAllPolicies.fulfilled, (state, action) => {
        state.loading.getAllPolicies = false
        state.policies = action.payload
      })
      .addCase(getAllPolicies.rejected, (state, action) => {
        state.loading.getAllPolicies = false
        state.error.getAllPolicies = action.payload as string
      })

      // Get Policy Details
      .addCase(getPolicyDetails.pending, (state) => {
        state.loading.getPolicyDetails = true
        state.error.getPolicyDetails = null
      })
      .addCase(getPolicyDetails.fulfilled, (state, action) => {
        state.loading.getPolicyDetails = false
        state.currentPolicy = action.payload
      })
      .addCase(getPolicyDetails.rejected, (state, action) => {
        state.loading.getPolicyDetails = false
        state.error.getPolicyDetails = action.payload as string
      })

      // Get Policy Sections
      .addCase(getPolicySections.pending, (state) => {
        state.loading.getPolicySections = true
        state.error.getPolicySections = null
      })
      .addCase(getPolicySections.fulfilled, (state, action) => {
        state.loading.getPolicySections = false
        state.policySections = action.payload
      })
      .addCase(getPolicySections.rejected, (state, action) => {
        state.loading.getPolicySections = false
        state.error.getPolicySections = action.payload as string
      })

      // Create Policy
      .addCase(createPolicy.pending, (state) => {
        state.loading.createPolicy = true
        state.error.createPolicy = null
        state.success.createPolicy = false
      })
      .addCase(createPolicy.fulfilled, (state, action) => {
        state.loading.createPolicy = false
        state.success.createPolicy = true
        state.policies.push(action.payload)
      })
      .addCase(createPolicy.rejected, (state, action) => {
        state.loading.createPolicy = false
        state.error.createPolicy = action.payload as string
      })

      // Renew Policy
      .addCase(renewPolicy.pending, (state) => {
        state.loading.renewPolicy = true
        state.error.renewPolicy = null
        state.success.renewPolicy = false
      })
      .addCase(renewPolicy.fulfilled, (state, action) => {
        state.loading.renewPolicy = false
        state.success.renewPolicy = true
        // Update the policy in the list if it exists
        const index = state.policies.findIndex((policy) => policy.policyNo === action.payload.policyNo)
        if (index !== -1) {
          state.policies[index] = action.payload
        }
      })
      .addCase(renewPolicy.rejected, (state, action) => {
        state.loading.renewPolicy = false
        state.error.renewPolicy = action.payload as string
      })

      // Endorse Policy
      .addCase(endorsePolicy.pending, (state) => {
        state.loading.endorsePolicy = true
        state.error.endorsePolicy = null
        state.success.endorsePolicy = false
      })
      .addCase(endorsePolicy.fulfilled, (state, action) => {
        state.loading.endorsePolicy = false
        state.success.endorsePolicy = true
      })
      .addCase(endorsePolicy.rejected, (state, action) => {
        state.loading.endorsePolicy = false
        state.error.endorsePolicy = action.payload as string
      })

      // Cancel Policy
      .addCase(cancelPolicy.pending, (state) => {
        state.loading.cancelPolicy = true
        state.error.cancelPolicy = null
        state.success.cancelPolicy = false
      })
      .addCase(cancelPolicy.fulfilled, (state, action) => {
        state.loading.cancelPolicy = false
        state.success.cancelPolicy = true
      })
      .addCase(cancelPolicy.rejected, (state, action) => {
        state.loading.cancelPolicy = false
        state.error.cancelPolicy = action.payload as string
      })

      // NIIP Upload
      .addCase(niipUpload.pending, (state) => {
        state.loading.niipUpload = true
        state.error.niipUpload = null
        state.success.niipUpload = false
      })
      .addCase(niipUpload.fulfilled, (state, action) => {
        state.loading.niipUpload = false
        state.success.niipUpload = true
        state.niipResponse = action.payload
      })
      .addCase(niipUpload.rejected, (state, action) => {
        state.loading.niipUpload = false
        state.error.niipUpload = action.payload as string
      })
  },
})

export const selectPolicies = (state: { policies: PolicyState }) => state.policies

export const { clearMessages, clearNiipResponse, setCurrentPolicy } = policySlice.actions

export default policySlice.reducer
