import type { Region, RegionState, UpdateRegionRequest } from "@/types/regions";
import apiCall from "@/utils/api-call";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const getAllRegions = createAsyncThunk(
  "regions/getAllRegions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/regions`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const getRegionDetails = createAsyncThunk(
  "regions/getRegionDetails",
  async (regionId: string, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/regions/${regionId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const createRegion = createAsyncThunk(
  "regions/createRegion",
  async (body: Region, { rejectWithValue }) => {
    try {
      const response = await apiCall.post(`/regions`, body);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const updateRegion = createAsyncThunk(
  "regions/updateRegion",
  async ({ regionId, data }: UpdateRegionRequest, { rejectWithValue }) => {
    try {
      const response = await apiCall.put(`/regions/${regionId}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const deleteRegion = createAsyncThunk(
  "regions/deleteRegion",
  async (regionId: string, { rejectWithValue }) => {
    try {
      const response = await apiCall.delete(`/regions/${regionId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const initialState: RegionState = {
  regions: [],
  region: null,

  loading: {
    getAllRegions: false,
    getRegionDetails: false,
    createRegion: false,
    updateRegion: false,
    deleteRegion: false,
  },
  error: {
    getAllRegions: null,
    getRegionDetails: null,
    createRegion: null,
    updateRegion: null,
    deleteRegion: null,
  },
  success: {
    createRegion: false,
    updateRegion: false,
    deleteRegion: false,
  },
};

const regionSlice = createSlice({
  name: "regions",
  initialState,
  reducers: {
    clearRegionMessages: (state) => {
      state.error = { ...initialState.error };
      state.success = { ...initialState.success };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllRegions.pending, (state) => {
        state.loading.getAllRegions = true;
        state.error.getAllRegions = null;
      })
      .addCase(getAllRegions.fulfilled, (state, action) => {
        state.loading.getAllRegions = false;
        state.regions = action.payload;
      })
      .addCase(getAllRegions.rejected, (state, action) => {
        state.loading.getAllRegions = false;
        state.error.getAllRegions = action.payload;
      })

      .addCase(getRegionDetails.pending, (state) => {
        state.loading.getRegionDetails = true;
        state.error.getRegionDetails = null;
      })
      .addCase(getRegionDetails.fulfilled, (state, action) => {
        state.loading.getRegionDetails = false;
        state.region = action.payload;
      })
      .addCase(getRegionDetails.rejected, (state, action) => {
        state.loading.getRegionDetails = false;
        state.error.getRegionDetails = action.payload;
      })

      .addCase(createRegion.pending, (state) => {
        state.loading.createRegion = true;
        state.error.createRegion = null;
        state.success.createRegion = false;
      })
      .addCase(createRegion.fulfilled, (state, action) => {
        state.loading.createRegion = false;
        state.regions.push(action.payload);
        state.success.createRegion = true;
      })
      .addCase(createRegion.rejected, (state, action) => {
        state.loading.createRegion = false;
        state.error.createRegion = action.payload;
      })

      .addCase(updateRegion.pending, (state) => {
        state.loading.updateRegion = true;
        state.error.updateRegion = null;
        state.success.updateRegion = false;
      })
      .addCase(updateRegion.fulfilled, (state, action) => {
        state.loading.updateRegion = false;
        state.success.updateRegion = true;
        state.error.updateRegion = null;
        const updatedRegion: Region = action.payload;
        state.regions = state.regions.map((region) =>
          region.regionID === updatedRegion.regionID ? updatedRegion : region
        );
        if (state.region && state.region.regionID === updatedRegion.regionID) {
          state.region = updatedRegion;
        }
      })
      .addCase(updateRegion.rejected, (state, action) => {
        state.loading.updateRegion = false;
        state.error.updateRegion = action.payload;
        state.success.updateRegion = false;
      })

      .addCase(deleteRegion.pending, (state) => {
        state.loading.deleteRegion = true;
        state.error.deleteRegion = null;
        state.success.deleteRegion = false;
      })
      .addCase(deleteRegion.fulfilled, (state, action) => {
        state.loading.deleteRegion = false;
        state.success.deleteRegion = true;
        state.regions = state.regions.filter(
          (region) => region.regionID !== action.payload
        );
      })
      .addCase(deleteRegion.rejected, (state, action) => {
        state.loading.deleteRegion = false;
        state.error.deleteRegion = action.payload;
      });
  },
});

export const selectRegion = (state: { regions: RegionState }) => state.regions;

export const { clearRegionMessages } = regionSlice.actions;

export default regionSlice.reducer;
