import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  AssignRoleRequest,
  UsersResponse,
  UserState,
} from "../../../types/user";
import { decryptData } from "../../../utils/encrypt-utils";
import type { RootState } from "../../store";
import { SERVER_URL } from "../../../utils/constants";

const encryptedToken = localStorage.getItem("token");

const API_BASE_URL = SERVER_URL;

// You'll need to get this token from your auth system
const getAuthToken = () => {
  return decryptData(encryptedToken);
};

// Async thunks
export const getAllUsers = createAsyncThunk(
  "users/getAllUsers",
  async (
    { page = 1, pageSize = 50 }: { page?: number; pageSize?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/Users?page=${page}&pageSize=${pageSize}`,
        {
          method: "GET",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: UsersResponse = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch users");
    }
  }
);

export const getUserById = createAsyncThunk(
  "users/getUserById",
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Users/${userId}`, {
        method: "GET",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: User = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch user");
    }
  }
);

export const createUser = createAsyncThunk(
  "users/createUser",
  async (userData: CreateUserRequest, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Users`, {
        method: "POST",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: User = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create user");
    }
  }
);

export const updateUser = createAsyncThunk(
  "users/updateUser",
  async (
    { id, userData }: { id: number; userData: UpdateUserRequest },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Users/${id}`, {
        method: "PUT",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        // Return the updated user data that was sent
        return { ...userData, userID: id } as User;
      }

      // If there is content, parse it as JSON
      const data: User = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update user");
    }
  }
);

export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Users/${userId}`, {
        method: "DELETE",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return userId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete user");
    }
  }
);

export const changePassword = createAsyncThunk(
  "users/changePassword",
  async (
    {
      userId,
      passwordData,
    }: { userId: number; passwordData: ChangePasswordRequest },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/Users/${userId}/change-password`,
        {
          method: "PUT",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(passwordData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return userId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to change password");
    }
  }
);

export const assignRole = createAsyncThunk(
  "users/assignRole",
  async (roleData: AssignRoleRequest, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Users/assign-role`, {
        method: "POST",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roleData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return roleData;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to assign role");
    }
  }
);

export const removeRole = createAsyncThunk(
  "users/removeRole",
  async (roleData: AssignRoleRequest, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Users/remove-role`, {
        method: "POST",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roleData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return roleData;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to remove role");
    }
  }
);

const initialState: UserState = {
  users: [],
  totalUsers: 0,
  loading: {
    getAllUsers: false,
    getUserById: false,
    createUser: false,
    updateUser: false,
    deleteUser: false,
    changePassword: false,
    assignRole: false,
    removeRole: false,
  },
  success: {
    createUser: false,
    updateUser: false,
    deleteUser: false,
    changePassword: false,
    assignRole: false,
    removeRole: false,
  },
  error: {
    getAllUsers: null,
    getUserById: null,
    createUser: null,
    updateUser: null,
    deleteUser: null,
    changePassword: null,
    assignRole: null,
    removeRole: null,
  },
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.success = {
        createUser: false,
        updateUser: false,
        deleteUser: false,
        changePassword: false,
        assignRole: false,
        removeRole: false,
      };
      state.error = {
        getAllUsers: null,
        getUserById: null,
        createUser: null,
        updateUser: null,
        deleteUser: null,
        changePassword: null,
        assignRole: null,
        removeRole: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all users
      .addCase(getAllUsers.pending, (state) => {
        state.loading.getAllUsers = true;
        state.error.getAllUsers = null;
      })
      .addCase(
        getAllUsers.fulfilled,
        (state, action: PayloadAction<UsersResponse>) => {
          state.loading.getAllUsers = false;
          state.users = action.payload.items;
          state.totalUsers = action.payload.total;
        }
      )
      .addCase(getAllUsers.rejected, (state, action) => {
        state.loading.getAllUsers = false;
        state.error.getAllUsers = action.payload as string;
      })

      // Get user by ID
      .addCase(getUserById.pending, (state) => {
        state.loading.getUserById = true;
        state.error.getUserById = null;
      })
      .addCase(getUserById.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading.getUserById = false;
        // Update user in the list if it exists
        const index = state.users.findIndex(
          (u) => u.userID === action.payload.userID
        );
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.loading.getUserById = false;
        state.error.getUserById = action.payload as string;
      })

      // Create user
      .addCase(createUser.pending, (state) => {
        state.loading.createUser = true;
        state.error.createUser = null;
        state.success.createUser = false;
      })
      .addCase(createUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading.createUser = false;
        state.success.createUser = true;
        state.users.unshift(action.payload);
        state.totalUsers += 1;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading.createUser = false;
        state.error.createUser = action.payload as string;
      })

      // Update user
      .addCase(updateUser.pending, (state) => {
        state.loading.updateUser = true;
        state.error.updateUser = null;
        state.success.updateUser = false;
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading.updateUser = false;
        state.success.updateUser = true;
        const index = state.users.findIndex(
          (u) => u.userID === action.payload.userID
        );
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading.updateUser = false;
        state.error.updateUser = action.payload as string;
      })

      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading.deleteUser = true;
        state.error.deleteUser = null;
        state.success.deleteUser = false;
      })
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading.deleteUser = false;
        state.success.deleteUser = true;
        state.users = state.users.filter((u) => u.userID !== action.payload);
        state.totalUsers -= 1;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading.deleteUser = false;
        state.error.deleteUser = action.payload as string;
      })

      // Change password
      .addCase(changePassword.pending, (state) => {
        state.loading.changePassword = true;
        state.error.changePassword = null;
        state.success.changePassword = false;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading.changePassword = false;
        state.success.changePassword = true;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading.changePassword = false;
        state.error.changePassword = action.payload as string;
      })

      // Assign role
      .addCase(assignRole.pending, (state) => {
        state.loading.assignRole = true;
        state.error.assignRole = null;
        state.success.assignRole = false;
      })
      .addCase(assignRole.fulfilled, (state) => {
        state.loading.assignRole = false;
        state.success.assignRole = true;
      })
      .addCase(assignRole.rejected, (state, action) => {
        state.loading.assignRole = false;
        state.error.assignRole = action.payload as string;
      })

      // Remove role
      .addCase(removeRole.pending, (state) => {
        state.loading.removeRole = true;
        state.error.removeRole = null;
        state.success.removeRole = false;
      })
      .addCase(removeRole.fulfilled, (state) => {
        state.loading.removeRole = false;
        state.success.removeRole = true;
      })
      .addCase(removeRole.rejected, (state, action) => {
        state.loading.removeRole = false;
        state.error.removeRole = action.payload as string;
      });
  },
});

export const { clearMessages } = userSlice.actions;

export const selectUsers = (state: RootState) => state.users;

export default userSlice.reducer;
