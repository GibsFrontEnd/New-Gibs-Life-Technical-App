import { createSlice } from "@reduxjs/toolkit";


interface User {
  id: string;
  username: string;
  email?: string;
  roles: string[]; // Array of roles from backend
  role?: string; // Single role if needed
  permissions: string[];
  loginTime: string;
}

interface AuthState {
   user: User | null;
  token: string | null;
  isExpired: boolean;
  showAuthError: boolean;
}

const initialState: AuthState = {
  isExpired: false,
  showAuthError: false,
  user: null,
  token: null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokenExpired: (state, action) => {
      state.isExpired = action.payload;
    },
    setShowAuthError: (state, action) => {
      state.showAuthError = action.payload;
    },
  },
});

export const selectAuth = (state: { auth: AuthState }) => state.auth;

export const { setTokenExpired, setShowAuthError } = authSlice.actions;
export default authSlice.reducer;
