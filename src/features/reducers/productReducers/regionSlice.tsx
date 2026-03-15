import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { decryptData } from "../../../utils/encrypt-utils"; 

// Types
interface Region {
  regionID: number;
  region: string;
  manager: string;
  address: string
  mobilePhone: string;
  landPhone: string;
  email: string;
  fax: string;
  remarks: string;
  deleted: boolean;
  active: boolean;
  submittedBy: string;
  submittedOn: string;
  modifiedBy: string;
  modifiedOn: string;
}

interface CreateRegionRequest {
   regionID: number;
  region: string;
  manager: string;
  address: string;
  mobilePhone: string;
  landPhone: string;
  email: string;
  fax: string;
  remarks: string;
  deleted: boolean; 
  active: boolean;
  submittedBy: string;
}

interface UpdateRegionRequest extends CreateRegionRequest {
  regionID: number
}

interface RegionState {
  regions: Region[]
  loading: {
    getActiveRegions: boolean | undefined
    getAllRegions?: boolean
    createRegion?: boolean
    updateRegion?: boolean
    deleteRegion?: boolean
    checkRegionExists?: boolean
  }
  success: {
    getAllRegions?: boolean
    createRegion?: boolean
    updateRegion?: boolean
    deleteRegion?: boolean
    checkRegionExists?: boolean
  }
  error: {
    getAllRegions?: string
    createRegion?: string
    updateRegion?: string
    deleteRegion?: string
    checkRegionExists?: string
  }
  exists: boolean | null
}

const initialState: RegionState = {
  regions: [],
  //@ts-ignore
  loading: {},
  success: {},
  error: {},
  exists: null
}

// In your regionSlice.ts or auth utility file
const getAuthHeaders = (): HeadersInit => {
  // Check for token in all possible storage locations
  const encryptedToken = localStorage.getItem('authToken') || 
                localStorage.getItem('token') ||
                sessionStorage.getItem('authToken') ||
                sessionStorage.getItem('token');
 
  
  if (!encryptedToken) {
     // Don't redirect automatically, just throw error
    throw new Error('No authentication token found');
  }
  // Decrypt the token
  const token = decryptData(encryptedToken);

  
  if (!token) {
    throw new Error('Invalid authentication token');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Enhanced API call function
  const makeApiCall = async (url: string, options: RequestInit = {}) => {
    const headers = getAuthHeaders();
    
  const response = await fetch(url, {
  ...options,
  headers: {
    'Content-Type': 'application/json',
    ...headers, // Your auth headers
    ...options.headers, // Option headers should not override yours
  },
});
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Authentication failed. Please login again.');
    }
    
    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error ${response.status}`);
    }
    
    return response.json();
  };
  

// Async Thunks
export const getAllRegions = createAsyncThunk(
  'regions/getAllRegions',
  async (_, { rejectWithValue }) => {
    try {
      const data = await makeApiCall(`https://core-api.newgibsonline.com/api/regions`)
      return data
    } catch (error) {
       return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch regions')
    }
  }
)

export const createRegion = createAsyncThunk(
  'regions/createRegion',
  async (regionData: CreateRegionRequest, { rejectWithValue }) => {
    try {
      const data = await makeApiCall(`https://core-api.newgibsonline.com/api/regions`, {
        method: 'POST',
        body: JSON.stringify({
          ...regionData,
          submittedOn: new Date().toISOString(),
          modifiedOn: new Date().toISOString(),
          modifiedBy: regionData.submittedBy
        }),
      })
      return data
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create region')
    }
  }
)

export const updateRegion = createAsyncThunk(
  'regions/updateRegion',
  async (regionData: UpdateRegionRequest, { rejectWithValue }) => {
    try {
      const data = await makeApiCall(`https://core-api.newgibsonline.com/api/regions/${regionData.regionID}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...regionData,
          modifiedOn: new Date().toISOString(),
        }),
      })
      return data
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update region')
    }
  }
)

export const deleteRegion = createAsyncThunk(
  'regions/deleteRegion',
  async (regionId: number, { rejectWithValue }) => {
    try {
      await makeApiCall(`https://core-api.newgibsonline.com/api/regions/${regionId}`, {
        method: 'DELETE',
      })
      return regionId
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete region')
    }
  }
)

export const checkRegionExists = createAsyncThunk(
  'regions/checkRegionExists',
  async (regionId: number, { rejectWithValue }) => {
    try {
      const data = await makeApiCall(`https://core-api.newgibsonline.com/api/regions/exists/${regionId}`)
      return data.exists || false
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to check region existence')
    }
  }
)

// Region Slice
const regionSlice = createSlice({
  name: 'regions',
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.success = {}
      state.error = {}
      state.exists = null
    },
    setRegions: (state, action: PayloadAction<Region[]>) => {
      state.regions = action.payload
    },
    addRegion: (state, action: PayloadAction<Region>) => {
      state.regions.push(action.payload)
    },
    updateRegionInState: (state, action: PayloadAction<Region>) => {
      const index = state.regions.findIndex(region => region.regionID === action.payload.regionID)
      if (index !== -1) {
        state.regions[index] = action.payload
      }
    },
    removeRegionFromState: (state, action: PayloadAction<number>) => {
      state.regions = state.regions.filter(region => region.regionID !== action.payload)
    }
  },
  extraReducers: (builder) => {
    // Get All Regions
    builder
      .addCase(getAllRegions.pending, (state) => {
        state.loading.getAllRegions = true
        state.success.getAllRegions = false
        state.error.getAllRegions = undefined
      })
      .addCase(getAllRegions.fulfilled, (state, action) => {
        state.loading.getAllRegions = false
        state.success.getAllRegions = true
        state.regions = action.payload
      })
      .addCase(getAllRegions.rejected, (state, action) => {
        state.loading.getAllRegions = false
        state.success.getAllRegions = false
        state.error.getAllRegions = action.payload as string
      })

    // Create Region
    builder
      .addCase(createRegion.pending, (state) => {
        state.loading.createRegion = true
        state.success.createRegion = false
        state.error.createRegion = undefined
      })
      .addCase(createRegion.fulfilled, (state, action) => {
        state.loading.createRegion = false
        state.success.createRegion = true
        state.regions.push(action.payload)
      })
      .addCase(createRegion.rejected, (state, action) => {
        state.loading.createRegion = false
        state.success.createRegion = false
        state.error.createRegion = action.payload as string
      })

    // Update Region
    builder
      .addCase(updateRegion.pending, (state) => {
        state.loading.updateRegion = true
        state.success.updateRegion = false
        state.error.updateRegion = undefined
      })
      .addCase(updateRegion.fulfilled, (state, action) => {
        state.loading.updateRegion = false
        state.success.updateRegion = true
        const index = state.regions.findIndex(region => region.regionID === action.payload.regionID)
        if (index !== -1) {
          state.regions[index] = action.payload
        }
      })
      .addCase(updateRegion.rejected, (state, action) => {
        state.loading.updateRegion = false
        state.success.updateRegion = false
        state.error.updateRegion = action.payload as string
      })

    // Delete Region
    builder
      .addCase(deleteRegion.pending, (state) => {
        state.loading.deleteRegion = true
        state.success.deleteRegion = false
        state.error.deleteRegion = undefined
      })
      .addCase(deleteRegion.fulfilled, (state, action) => {
        state.loading.deleteRegion = false
        state.success.deleteRegion = true
        state.regions = state.regions.filter(region => region.regionID !== action.payload)
      })
      .addCase(deleteRegion.rejected, (state, action) => {
        state.loading.deleteRegion = false
        state.success.deleteRegion = false
        state.error.deleteRegion = action.payload as string
      })

    // Check Region Exists
    builder
      .addCase(checkRegionExists.pending, (state) => {
        state.loading.checkRegionExists = true
        state.success.checkRegionExists = false
        state.error.checkRegionExists = undefined
        state.exists = null
      })
      .addCase(checkRegionExists.fulfilled, (state, action) => {
        state.loading.checkRegionExists = false
        state.success.checkRegionExists = true
        state.exists = action.payload
      })
      .addCase(checkRegionExists.rejected, (state, action) => {
        state.loading.checkRegionExists = false
        state.success.checkRegionExists = false
        state.error.checkRegionExists = action.payload as string
        state.exists = null
      })
  }
})

// Actions
export const { 
  clearMessages, 
  setRegions, 
  addRegion, 
  updateRegionInState, 
  removeRegionFromState 
} = regionSlice.actions

// Selectors
export const selectRegions = (state: { regions: RegionState }) => state.regions

export const selectRegionById = (state: { regions: RegionState }, regionId: number) => 
  state.regions.regions.find(region => region.regionID === regionId)

export const selectActiveRegions = (state: { regions: RegionState }) => 
  state.regions.regions.filter(region => region.active === true)

export default regionSlice.reducer