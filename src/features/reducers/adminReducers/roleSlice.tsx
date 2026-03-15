// @ts-nocheck
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiCall from "../../../utils/api-call";
import { RoleCreateUpdateRequest, RoleState } from "../../../types/role";

export const getAllRoles = createAsyncThunk(
  "roles/getAllRoles",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiCall.get("/Roles");
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const getRoleDetails = createAsyncThunk(
  "roles/getRoleDetails",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/Roles/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const createRole = createAsyncThunk(
  "roles/createRole",
  async (data: RoleCreateUpdateRequest, { rejectWithValue }) => {
    try {
      const response = await apiCall.post("/Roles", data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export interface RoleUpdatePayload {
  id: number;
  data: RoleCreateUpdateRequest;
}

export const updateRole = createAsyncThunk(
  "roles/updateRole",
  async ({ id, data }: RoleUpdatePayload, { rejectWithValue }) => {
    try {
      await apiCall.put(`/Roles/${id}`, data);
      return { roleID: id, ...data };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const deleteRole = createAsyncThunk(
  "roles/deleteRole",
  async (id: number | undefined, { rejectWithValue }) => {
    try {
      await apiCall.delete(`/Roles/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const assignPermission = createAsyncThunk(
  "roles/assignPermission",
  async (
    {
      roleId,
      permissionId,
    }: {
      roleId: number | undefined | null;
      permissionId: number | undefined | null;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiCall.post("/roles/assign-permission", {
        roleId,
        permissionId,
      });
      return { roleId, permissionId, ...response.data };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const removePermission = createAsyncThunk(
  "roles/removePermission",
  async (
    {
      roleId,
      permissionId,
    }: {
      roleId: number | undefined | null;
      permissionId: number | undefined | null;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiCall.post("/roles/remove-permission", {
        roleId,
        permissionId,
      });
      return { roleId, permissionId, ...response.data };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const initialState: RoleState = {
  roles: [],
  role: null,
  loading: {
    getAllRoles: false,
    getRoleDetails: false,
    createRole: false,
    updateRole: false,
    deleteRole: false,
    assignPermission: false,
    removePermission: false,
  },
  error: {
    getAllRoles: null,
    getRoleDetails: null,
    createRole: null,
    updateRole: null,
    deleteRole: null,
    assignPermission: null,
    removePermission: null,
  },
  success: {
    createRole: false,
    updateRole: false,
    deleteRole: false,
    assignPermission: false,
    removePermission: false,
  },
};

const roleSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = { ...initialState.error };
      state.success = { ...initialState.success };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Roles
      .addCase(getAllRoles.pending, (state) => {
        state.loading.getAllRoles = true;
        state.error.getAllRoles = null;
      })
      .addCase(getAllRoles.fulfilled, (state, action) => {
        state.loading.getAllRoles = false;
        state.roles = action.payload;
      })
      .addCase(getAllRoles.rejected, (state, action) => {
        state.loading.getAllRoles = false;
        state.error.getAllRoles = action.payload;
      })

      // Fetch Roles Details
      .addCase(getRoleDetails.pending, (state) => {
        state.loading.getRoleDetails = true;
        state.error.getRoleDetails = null;
      })
      .addCase(getRoleDetails.fulfilled, (state, action) => {
        state.loading.getRoleDetails = false;
        state.role = action.payload;
      })
      .addCase(getRoleDetails.rejected, (state, action) => {
        state.loading.getRoleDetails = false;
        state.error.getRoleDetails = action.payload;
      })

      // Create Role
      .addCase(createRole.pending, (state) => {
        state.loading.createRole = true;
        state.error.createRole = null;
        state.success.createRole = false;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.loading.createRole = false;
        state.success.createRole = true;
        state.roles.push(action.payload);
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading.createRole = false;
        state.error.createRole = action.payload;
      })

      // Update Role
      .addCase(updateRole.pending, (state) => {
        state.loading.updateRole = true;
        state.error.updateRole = null;
        state.success.updateRole = false;
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.loading.updateRole = false;
        state.success.updateRole = true;
        const index = state.roles.findIndex(
          (role) => role.roleID === action.payload.roleID
        );
        if (index !== -1) {
          state.roles[index] = {
            ...state.roles[index],
            roleName: action.payload.roleName,
            roleDescription: action.payload.roleDescription,
          };
        }
        state.role = {
          ...state.role,
          roleName: action.payload.roleName,
          roleDescription: action.payload.roleDescription,
        };
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.loading.updateRole = false;
        state.error.updateRole = action.payload;
      })

      // Delete Role
      .addCase(deleteRole.pending, (state) => {
        state.loading.deleteRole = true;
        state.error.deleteRole = null;
        state.success.deleteRole = false;
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.loading.deleteRole = false;
        state.success.deleteRole = true;
        state.roles = state.roles.filter(
          (role) => role.roleID !== action.payload
        );
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.loading.deleteRole = false;
        state.error.deleteRole = action.payload;
      })

      // Assign Role
      .addCase(assignPermission.pending, (state) => {
        state.loading.assignPermission = true;
        state.error.assignPermission = null;
        state.success.assignPermission = false;
      })
      .addCase(assignPermission.fulfilled, (state, action) => {
        state.loading.assignPermission = false;
        state.success.assignPermission = true;
      })
      .addCase(assignPermission.rejected, (state, action) => {
        state.loading.assignPermission = false;
        state.error.assignPermission = action.payload;
      })

      // Remove Role
      .addCase(removePermission.pending, (state) => {
        state.loading.removePermission = true;
        state.error.removePermission = null;
        state.success.removePermission = false;
      })
      .addCase(removePermission.fulfilled, (state, action) => {
        state.loading.removePermission = false;
        state.success.removePermission = true;
      })
      .addCase(removePermission.rejected, (state, action) => {
        state.loading.removePermission = false;
        state.error.removePermission = action.payload;
      });
  },
});

export const selectRoles = (state: { roles: RoleState }) => state.roles;

export const { clearMessages } = roleSlice.actions;

export default roleSlice.reducer;
