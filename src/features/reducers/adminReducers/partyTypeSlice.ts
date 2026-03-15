//@ts-nocheck
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import apiCall from "../../../utils/api-call"
import type { CreatePartyTypeRequest, UpdatePartyTypeRequest, PartyTypeState } from "../../../types/partyType"

export const getAllPartyTypes = createAsyncThunk("partyTypes/getAllPartyTypes", async (_, { rejectWithValue }) => {
  try {
    const response = await apiCall.get("/partytypes")
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch party types")
  }
})

export const getPartyTypeDetails = createAsyncThunk(
  "partyTypes/getPartyTypeDetails",
  async (typeID: string, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/partytypes/${typeID}`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch party type details")
    }
  },
)

export const createPartyType = createAsyncThunk(
  "partyTypes/createPartyType",
  async (data: CreatePartyTypeRequest, { rejectWithValue }) => {
    try {
      const response = await apiCall.post("/partytypes", data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to create party type")
    }
  },
)

export interface PartyTypeUpdatePayload {
  typeID: string
  data: UpdatePartyTypeRequest
}

export const updatePartyType = createAsyncThunk(
  "partyTypes/updatePartyType",
  async ({ typeID, data }: PartyTypeUpdatePayload, { rejectWithValue }) => {
    try {
      const response = await apiCall.put(`/partytypes/${typeID}`, data)
      return { typeID, ...data }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to update party type")
    }
  },
)

export const deletePartyType = createAsyncThunk(
  "partyTypes/deletePartyType",
  async (typeID: string, { rejectWithValue }) => {
    try {
      await apiCall.delete(`/partytypes/${typeID}`)
      return typeID
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to delete party type")
    }
  },
)

const initialState: PartyTypeState = {
  partyTypes: [],
  partyType: null,
  loading: {
    getAllPartyTypes: false,
    getPartyTypeDetails: false,
    createPartyType: false,
    updatePartyType: false,
    deletePartyType: false,
  },
  error: {
    getAllPartyTypes: null,
    getPartyTypeDetails: null,
    createPartyType: null,
    updatePartyType: null,
    deletePartyType: null,
  },
  success: {
    createPartyType: false,
    updatePartyType: false,
    deletePartyType: false,
  },
}

const partyTypeSlice = createSlice({
  name: "partyTypes",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = { ...initialState.error }
      state.success = { ...initialState.success }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All Party Types
      .addCase(getAllPartyTypes.pending, (state) => {
        state.loading.getAllPartyTypes = true
        state.error.getAllPartyTypes = null
      })
      .addCase(getAllPartyTypes.fulfilled, (state, action) => {
        state.loading.getAllPartyTypes = false
        state.partyTypes = action.payload
      })
      .addCase(getAllPartyTypes.rejected, (state, action) => {
        state.loading.getAllPartyTypes = false
        state.error.getAllPartyTypes = action.payload as string
      })

      // Get Party Type Details
      .addCase(getPartyTypeDetails.pending, (state) => {
        state.loading.getPartyTypeDetails = true
        state.error.getPartyTypeDetails = null
      })
      .addCase(getPartyTypeDetails.fulfilled, (state, action) => {
        state.loading.getPartyTypeDetails = false
        state.partyType = action.payload
      })
      .addCase(getPartyTypeDetails.rejected, (state, action) => {
        state.loading.getPartyTypeDetails = false
        state.error.getPartyTypeDetails = action.payload as string
      })

      // Create Party Type
      .addCase(createPartyType.pending, (state) => {
        state.loading.createPartyType = true
        state.error.createPartyType = null
        state.success.createPartyType = false
      })
      .addCase(createPartyType.fulfilled, (state, action) => {
        state.loading.createPartyType = false
        state.success.createPartyType = true
        state.partyTypes.push(action.payload)
      })
      .addCase(createPartyType.rejected, (state, action) => {
        state.loading.createPartyType = false
        state.error.createPartyType = action.payload as string
      })

      // Update Party Type
      .addCase(updatePartyType.pending, (state) => {
        state.loading.updatePartyType = true
        state.error.updatePartyType = null
        state.success.updatePartyType = false
      })
      .addCase(updatePartyType.fulfilled, (state, action) => {
        state.loading.updatePartyType = false
        state.success.updatePartyType = true
        const index = state.partyTypes.findIndex((partyType) => partyType.typeID === action.payload.typeID)
        if (index !== -1) {
          state.partyTypes[index] = {
            ...state.partyTypes[index],
            name: action.payload.name,
            groupID: action.payload.groupID.toString(),
            groupName: action.payload.groupName,
            tag: action.payload.tag,
          }
        }
      })
      .addCase(updatePartyType.rejected, (state, action) => {
        state.loading.updatePartyType = false
        state.error.updatePartyType = action.payload as string
      })

      // Delete Party Type
      .addCase(deletePartyType.pending, (state) => {
        state.loading.deletePartyType = true
        state.error.deletePartyType = null
        state.success.deletePartyType = false
      })
      .addCase(deletePartyType.fulfilled, (state, action) => {
        state.loading.deletePartyType = false
        state.success.deletePartyType = true
        state.partyTypes = state.partyTypes.filter((partyType) => partyType.typeID !== action.payload)
      })
      .addCase(deletePartyType.rejected, (state, action) => {
        state.loading.deletePartyType = false
        state.error.deletePartyType = action.payload as string
      })
  },
})

export const selectPartyTypes = (state: { partyTypes: PartyTypeState }) => state.partyTypes

export const { clearMessages } = partyTypeSlice.actions

export default partyTypeSlice.reducer
