import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type {
  CreateSubRiskSectionRequest,
  UpdateSubRiskSectionRequest,
  SubRiskSectionState,
} from "../../../types/subRiskSection"

const API_BASE_URL = "https://core-api.newgibsonline.com/api"

// Async thunks
export const getAllSubRiskSections = createAsyncThunk(
  "subRiskSections/getAllSubRiskSections",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/SubRiskSections`)
      if (!response.ok) {
        throw new Error("Failed to fetch sub risk sections")
      }
      const data = await response.json()
      return data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const getSubRiskSectionById = createAsyncThunk(
  "subRiskSections/getSubRiskSectionById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/SubRiskSections/${id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch sub risk section")
      }
      const data = await response.json()
      return data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const getSubRiskSectionsBySectionCode = createAsyncThunk(
  "subRiskSections/getSubRiskSectionsBySectionCode",
  async (sectionCode: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/SubRiskSections/by-section-code/${sectionCode}`)
      if (!response.ok) {
        throw new Error("Failed to fetch sub risk sections by section code")
      }
      const data = await response.json()
      return data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const getSubRiskSectionsBySubRisk = createAsyncThunk(
  "subRiskSections/getSubRiskSectionsBySubRisk",
  async (subRiskId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/SubRiskSections/by-subrisk/${subRiskId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch sub risk sections by sub risk")
      }
      const data = await response.json()
      return data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const getActiveSubRiskSections = createAsyncThunk(
  "subRiskSections/getActiveSubRiskSections",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/SubRiskSections/active`)
      if (!response.ok) {
        throw new Error("Failed to fetch active sub risk sections")
      }
      const data = await response.json()
      return data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const checkSubRiskSectionExists = createAsyncThunk(
  "subRiskSections/checkSubRiskSectionExists",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/SubRiskSections/${id}/exists`)
      if (!response.ok) {
        throw new Error("Failed to check sub risk section existence")
      }
      const data = await response.text()
      return data === "true"
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const createSubRiskSection = createAsyncThunk(
  "subRiskSections/createSubRiskSection",
  async (subRiskSectionData: CreateSubRiskSectionRequest, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/SubRiskSections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subRiskSectionData),
      })
      if (!response.ok) {
        throw new Error("Failed to create sub risk section")
      }
      const data = await response.json()
      return data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const updateSubRiskSection = createAsyncThunk(
  "subRiskSections/updateSubRiskSection",
  async (
    { id, subRiskSectionData }: { id: number; subRiskSectionData: UpdateSubRiskSectionRequest },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/SubRiskSections/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subRiskSectionData),
      })
      if (!response.ok) {
        throw new Error("Failed to update sub risk section")
      }
      const data = await response.json()
      return data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const deleteSubRiskSection = createAsyncThunk(
  "subRiskSections/deleteSubRiskSection",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/SubRiskSections/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Failed to delete sub risk section")
      }
      return id
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

const initialState: SubRiskSectionState = {
  subRiskSections: [],
  exists: null,
  loading: {
    getAllSubRiskSections: false,
    getSubRiskSectionById: false,
    getSubRiskSectionsBySectionCode: false,
    getSubRiskSectionsBySubRisk: false,
    getActiveSubRiskSections: false,
    checkSubRiskSectionExists: false,
    createSubRiskSection: false,
    updateSubRiskSection: false,
    deleteSubRiskSection: false,
  },
  success: {
    getAllSubRiskSections: false,
    getSubRiskSectionById: false,
    getSubRiskSectionsBySectionCode: false,
    getSubRiskSectionsBySubRisk: false,
    getActiveSubRiskSections: false,
    checkSubRiskSectionExists: false,
    createSubRiskSection: false,
    updateSubRiskSection: false,
    deleteSubRiskSection: false,
  },
  error: {
    getAllSubRiskSections: null,
    getSubRiskSectionById: null,
    getSubRiskSectionsBySectionCode: null,
    getSubRiskSectionsBySubRisk: null,
    getActiveSubRiskSections: null,
    checkSubRiskSectionExists: null,
    createSubRiskSection: null,
    updateSubRiskSection: null,
    deleteSubRiskSection: null,
  },
}

const subRiskSectionSlice = createSlice({
  name: "subRiskSections",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.success = {
        getAllSubRiskSections: false,
        getSubRiskSectionById: false,
        getSubRiskSectionsBySectionCode: false,
        getSubRiskSectionsBySubRisk: false,
        getActiveSubRiskSections: false,
        checkSubRiskSectionExists: false,
        createSubRiskSection: false,
        updateSubRiskSection: false,
        deleteSubRiskSection: false,
      }
      state.error = {
        getAllSubRiskSections: null,
        getSubRiskSectionById: null,
        getSubRiskSectionsBySectionCode: null,
        getSubRiskSectionsBySubRisk: null,
        getActiveSubRiskSections: null,
        checkSubRiskSectionExists: null,
        createSubRiskSection: null,
        updateSubRiskSection: null,
        deleteSubRiskSection: null,
      }
      state.exists = null
    },
  },
  extraReducers: (builder) => {
    // Get all sub risk sections
    builder
      .addCase(getAllSubRiskSections.pending, (state) => {
        state.loading.getAllSubRiskSections = true
        state.error.getAllSubRiskSections = null
      })
      .addCase(getAllSubRiskSections.fulfilled, (state, action) => {
        state.loading.getAllSubRiskSections = false
        state.success.getAllSubRiskSections = true
        state.subRiskSections = action.payload
      })
      .addCase(getAllSubRiskSections.rejected, (state, action) => {
        state.loading.getAllSubRiskSections = false
        state.error.getAllSubRiskSections = action.payload as string
      })

    // Get sub risk section by ID
    builder
      .addCase(getSubRiskSectionById.pending, (state) => {
        state.loading.getSubRiskSectionById = true
        state.error.getSubRiskSectionById = null
      })
      .addCase(getSubRiskSectionById.fulfilled, (state) => {
        state.loading.getSubRiskSectionById = false
        state.success.getSubRiskSectionById = true
      })
      .addCase(getSubRiskSectionById.rejected, (state, action) => {
        state.loading.getSubRiskSectionById = false
        state.error.getSubRiskSectionById = action.payload as string
      })

    // Get sub risk sections by section code
    builder
      .addCase(getSubRiskSectionsBySectionCode.pending, (state) => {
        state.loading.getSubRiskSectionsBySectionCode = true
        state.error.getSubRiskSectionsBySectionCode = null
      })
      .addCase(getSubRiskSectionsBySectionCode.fulfilled, (state, action) => {
        state.loading.getSubRiskSectionsBySectionCode = false
        state.success.getSubRiskSectionsBySectionCode = true
        state.subRiskSections = action.payload
      })
      .addCase(getSubRiskSectionsBySectionCode.rejected, (state, action) => {
        state.loading.getSubRiskSectionsBySectionCode = false
        state.error.getSubRiskSectionsBySectionCode = action.payload as string
      })

    // Get sub risk sections by sub risk
    builder
      .addCase(getSubRiskSectionsBySubRisk.pending, (state) => {
        state.loading.getSubRiskSectionsBySubRisk = true
        state.error.getSubRiskSectionsBySubRisk = null
      })
      .addCase(getSubRiskSectionsBySubRisk.fulfilled, (state, action) => {
        state.loading.getSubRiskSectionsBySubRisk = false
        state.success.getSubRiskSectionsBySubRisk = true
        state.subRiskSections = action.payload
      })
      .addCase(getSubRiskSectionsBySubRisk.rejected, (state, action) => {
        state.loading.getSubRiskSectionsBySubRisk = false
        state.error.getSubRiskSectionsBySubRisk = action.payload as string
      })

    // Get active sub risk sections
    builder
      .addCase(getActiveSubRiskSections.pending, (state) => {
        state.loading.getActiveSubRiskSections = true
        state.error.getActiveSubRiskSections = null
      })
      .addCase(getActiveSubRiskSections.fulfilled, (state, action) => {
        state.loading.getActiveSubRiskSections = false
        state.success.getActiveSubRiskSections = true
        state.subRiskSections = action.payload
      })
      .addCase(getActiveSubRiskSections.rejected, (state, action) => {
        state.loading.getActiveSubRiskSections = false
        state.error.getActiveSubRiskSections = action.payload as string
      })

    // Check sub risk section exists
    builder
      .addCase(checkSubRiskSectionExists.pending, (state) => {
        state.loading.checkSubRiskSectionExists = true
        state.error.checkSubRiskSectionExists = null
      })
      .addCase(checkSubRiskSectionExists.fulfilled, (state, action) => {
        state.loading.checkSubRiskSectionExists = false
        state.success.checkSubRiskSectionExists = true
        state.exists = action.payload
      })
      .addCase(checkSubRiskSectionExists.rejected, (state, action) => {
        state.loading.checkSubRiskSectionExists = false
        state.error.checkSubRiskSectionExists = action.payload as string
      })

    // Create sub risk section
    builder
      .addCase(createSubRiskSection.pending, (state) => {
        state.loading.createSubRiskSection = true
        state.error.createSubRiskSection = null
      })
      .addCase(createSubRiskSection.fulfilled, (state, action) => {
        state.loading.createSubRiskSection = false
        state.success.createSubRiskSection = true
        state.subRiskSections.push(action.payload)
      })
      .addCase(createSubRiskSection.rejected, (state, action) => {
        state.loading.createSubRiskSection = false
        state.error.createSubRiskSection = action.payload as string
      })

    // Update sub risk section
    builder
      .addCase(updateSubRiskSection.pending, (state) => {
        state.loading.updateSubRiskSection = true
        state.error.updateSubRiskSection = null
      })
      .addCase(updateSubRiskSection.fulfilled, (state, action) => {
        state.loading.updateSubRiskSection = false
        state.success.updateSubRiskSection = true
        const index = state.subRiskSections.findIndex((section) => section.sectionID === action.payload.sectionID)
        if (index !== -1) {
          state.subRiskSections[index] = action.payload
        }
      })
      .addCase(updateSubRiskSection.rejected, (state, action) => {
        state.loading.updateSubRiskSection = false
        state.error.updateSubRiskSection = action.payload as string
      })

    // Delete sub risk section
    builder
      .addCase(deleteSubRiskSection.pending, (state) => {
        state.loading.deleteSubRiskSection = true
        state.error.deleteSubRiskSection = null
      })
      .addCase(deleteSubRiskSection.fulfilled, (state, action) => {
        state.loading.deleteSubRiskSection = false
        state.success.deleteSubRiskSection = true
        state.subRiskSections = state.subRiskSections.filter((section) => section.sectionID !== action.payload)
      })
      .addCase(deleteSubRiskSection.rejected, (state, action) => {
        state.loading.deleteSubRiskSection = false
        state.error.deleteSubRiskSection = action.payload as string
      })
  },
})

export const { clearMessages } = subRiskSectionSlice.actions
export const selectSubRiskSections = (state: any) => state.subRiskSections
export default subRiskSectionSlice.reducer
