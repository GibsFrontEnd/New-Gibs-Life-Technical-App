import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type {
  Permission,
  CreatePermissionRequest,
  PermissionState,
} from "../../../types/permission";
import type { RootState } from "../../store";
import { SERVER_URL } from "../../../utils/constants";

const API_BASE_URL = SERVER_URL;

// Async thunks
export const getAllPermissions = createAsyncThunk(
  "permissions/getAllPermissions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/permissions`, {
        method: "GET",
        headers: {
          accept: "*/*",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch permissions");
    }
  }
);

export const createPermission = createAsyncThunk(
  "permissions/createPermission",
  async (permissionData: CreatePermissionRequest, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/permissions`, {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(permissionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create permission");
    }
  }
);

export const updatePermission = createAsyncThunk(
  "permissions/updatePermission",
  async (
    {
      id,
      permissionData,
    }: { id: number; permissionData: CreatePermissionRequest },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/permissions/${id}`, {
        method: "PUT",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(permissionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response has content before parsing JSON
      const contentLength = response.headers.get("content-length");
      if (contentLength === "0" || !response.body) {
        // Return the original data if no response body
        return { ...permissionData, permissionID: id };
      }

      try {
        const data = await response.json();
        return data;
      } catch (jsonError) {
        // If JSON parsing fails but status is OK, return the original data
        console.log("No JSON response, returning original data");
        return { ...permissionData, permissionID: id };
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update permission");
    }
  }
);

export const deletePermission = createAsyncThunk(
  "permissions/deletePermission",
  async (permissionId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/permissions/${permissionId}`,
        {
          method: "DELETE",
          headers: {
            accept: "*/*",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return permissionId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete permission");
    }
  }
);

const initialState: PermissionState = {
  permissions: [],
  loading: {
    getAllPermissions: false,
    createPermission: false,
    updatePermission: false,
    deletePermission: false,
  },
  success: {
    createPermission: false,
    updatePermission: false,
    deletePermission: false,
  },
  error: {
    getAllPermissions: null,
    createPermission: null,
    updatePermission: null,
    deletePermission: null,
  },
};

const permissionSlice = createSlice({
  name: "permissions",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.success = {
        createPermission: false,
        updatePermission: false,
        deletePermission: false,
      };
      state.error = {
        getAllPermissions: null,
        createPermission: null,
        updatePermission: null,
        deletePermission: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all permissions
      .addCase(getAllPermissions.pending, (state) => {
        state.loading.getAllPermissions = true;
        state.error.getAllPermissions = null;
      })
      .addCase(
        getAllPermissions.fulfilled,
        (state, action: PayloadAction<Permission[]>) => {
          state.loading.getAllPermissions = false;
          state.permissions = action.payload;
        }
      )
      .addCase(getAllPermissions.rejected, (state, action) => {
        state.loading.getAllPermissions = false;
        state.error.getAllPermissions = action.payload as string;
      })

      // Create permission
      .addCase(createPermission.pending, (state) => {
        state.loading.createPermission = true;
        state.error.createPermission = null;
        state.success.createPermission = false;
      })
      .addCase(
        createPermission.fulfilled,
        (state, action: PayloadAction<Permission>) => {
          state.loading.createPermission = false;
          state.success.createPermission = true;
          state.permissions.unshift(action.payload);
        }
      )
      .addCase(createPermission.rejected, (state, action) => {
        state.loading.createPermission = false;
        state.error.createPermission = action.payload as string;
      })

      // Update permission
      .addCase(updatePermission.pending, (state) => {
        state.loading.updatePermission = true;
        state.error.updatePermission = null;
        state.success.updatePermission = false;
      })
      .addCase(
        updatePermission.fulfilled,
        (state, action: PayloadAction<Permission>) => {
          state.loading.updatePermission = false;
          state.success.updatePermission = true;
          const index = state.permissions.findIndex(
            (p) => p.permissionID === action.payload.permissionID
          );
          if (index !== -1) {
            state.permissions[index] = action.payload;
          }
        }
      )
      .addCase(updatePermission.rejected, (state, action) => {
        state.loading.updatePermission = false;
        state.error.updatePermission = action.payload as string;
      })

      // Delete permission
      .addCase(deletePermission.pending, (state) => {
        state.loading.deletePermission = true;
        state.error.deletePermission = null;
        state.success.deletePermission = false;
      })
      .addCase(
        deletePermission.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.loading.deletePermission = false;
          state.success.deletePermission = true;
          state.permissions = state.permissions.filter(
            (p) => p.permissionID !== action.payload
          );
        }
      )
      .addCase(deletePermission.rejected, (state, action) => {
        state.loading.deletePermission = false;
        state.error.deletePermission = action.payload as string;
      });
  },
});

export const { clearMessages } = permissionSlice.actions;

export const selectPermissions = (state: RootState) => state.permissions;

export default permissionSlice.reducer;
