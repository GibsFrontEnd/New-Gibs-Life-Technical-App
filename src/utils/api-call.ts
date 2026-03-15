import axios from "axios";
import { SERVER_URL } from "./constants";
import { setShowAuthError } from "../features/reducers/authReducers/authSlice";
import { store } from "../features/store";
import { decryptData } from "./encrypt-utils";

const apiCall = axios.create({
  baseURL: SERVER_URL,
  timeout: 60000,
});

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV;

apiCall.interceptors.request.use(
  (config) => {
    if (isDevelopment) {
      console.log("🔐 API Request Interceptor - Starting...");
    }

    const encryptedToken = localStorage.getItem("token");
    
    if (isDevelopment) {
      // Don't log the actual token, just confirm it exists
      console.log("📦 Token from localStorage:", encryptedToken ? "EXISTS" : "NOT FOUND");
      if (encryptedToken) {
        console.log("🔐 Token type:", encryptedToken.startsWith('eyJ') ? "JWT" : "Encrypted");
        console.log("🔐 Token length:", encryptedToken.length);
      }
    }

    let token = null;
    if (encryptedToken) {
      try {
        // Check if token is already a JWT (starts with eyJ)
        if (encryptedToken.startsWith('eyJ')) {
          if (isDevelopment) {
            console.log("✅ Token is already JWT");
          }
          token = encryptedToken;
        } else {
          // Try to decrypt if it's encrypted
          if (isDevelopment) {
            console.log("🔄 Attempting to decrypt token...");
          }
          token = decryptData(encryptedToken);
          if (isDevelopment) {
            console.log("✅ Token decryption completed");
          }
        }
        
        if (isDevelopment) {
          console.log("🔑 Token length:", token?.length);
        }

        if (token && token !== "null" && token !== "undefined") {
          config.headers.Authorization = `Bearer ${token}`;
          if (isDevelopment) {
            console.log("✅ Authorization header set");
          }
        } else {
          if (isDevelopment) {
            console.warn("⚠️ Token is invalid");
          }
          config.headers.Authorization = `Bearer ${encryptedToken}`;
          if (isDevelopment) {
            console.log("🔄 Using encrypted token as fallback");
          }
        }
      } catch (decryptError) {
        if (isDevelopment) {
          console.error("❌ Token processing failed");
        }
        config.headers.Authorization = `Bearer ${encryptedToken}`;
        if (isDevelopment) {
          console.log("🔄 Using encrypted token as fallback after error");
        }
      }
    } else {
      if (isDevelopment) {
        console.warn("⚠️ No token found in localStorage");
      }
    }

    if (isDevelopment) {
      console.log("🚀 Final request config:", {
        url: config.url,
        method: config.method,
        hasAuthHeader: !!config.headers.Authorization,
        // Don't log the actual token!
      });
    }

    return config;
  },
  (error) => {
    if (isDevelopment) {
      console.error("❌ Request interceptor error:", error);
    }
    return Promise.reject(error);
  }
);

apiCall.interceptors.response.use(
  (response) => {
    if (isDevelopment) {
      console.log("✅ API Response Success:", {
        url: response.config.url,
        method: response.config.method,
        status: response.status,
        dataCount: response.data?.items?.length || response.data?.length || "N/A",
      });
      console.log("📊 Response data structure:", response.data);
    }
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    // Always log actual errors, but reduce verbosity for normal operations
    if (error.response?.status >= 400) {
      console.error("❌ API Response Error:", {
        url: originalRequest?.url,
        status: error.response?.status,
        message: error.message,
      });
    } else if (isDevelopment) {
      console.error("❌ API Response Error:", {
        url: originalRequest?.url,
        status: error.response?.status,
        message: error.message,
        hasAuthHeader: !!originalRequest?.headers?.Authorization,
      });
    }

    // Don't trigger auth error for login endpoint or if we've already tried to refresh
    const isLoginEndpoint = originalRequest?.url?.includes("/Auth/login");
    const hasAlreadyRetried = originalRequest?._retry;

    if (
      error.response?.status === 401 &&
      !isLoginEndpoint &&
      !hasAlreadyRetried
    ) {
      if (isDevelopment) {
        console.log("🔐 401 Unauthorized detected");
      }

      // Check if we actually have a token
      const encryptedToken = localStorage.getItem("token");
      if (!encryptedToken) {
        if (isDevelopment) {
          console.log("❌ No token found - redirecting to login");
        }
        store.dispatch(setShowAuthError(true));
        return Promise.reject(error);
      }

      // Try to decrypt and verify the token
      try {
        let token = encryptedToken;
        // Only try to decrypt if it's not already a JWT
        if (!encryptedToken.startsWith('eyJ')) {
          token = decryptData(encryptedToken);
        }
        
        if (isDevelopment) {
          console.log("🔍 Current token status:", {
            hasToken: !!token,
            tokenLength: token?.length,
            tokenPreview: token ? `${token.substring(0, 50)}...` : "No token",
          });
        }

        if (!token || token === "null" || token === "undefined") {
          if (isDevelopment) {
            console.log("❌ Invalid token found - redirecting to login");
          }
          store.dispatch(setShowAuthError(true));
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("unEncryptedUser");
        } else {
          if (isDevelopment) {
            console.log("⚠️ Valid token but 401 response - might be expired or server issue");
          }
          // Don't immediately logout - let the component handle it
        }
      } catch (decryptError) {
        if (isDevelopment) {
          console.error("❌ Token processing failed in interceptor:", decryptError);
        }
        store.dispatch(setShowAuthError(true));
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("unEncryptedUser");
      }
    }

    return Promise.reject(error);
  }
);

export default apiCall;