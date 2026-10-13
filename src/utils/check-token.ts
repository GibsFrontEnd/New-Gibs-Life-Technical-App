import { jwtDecode } from "jwt-decode";
import { setTokenExpired } from "../features/reducers/authReducers/authSlice";
import { store } from "../features/store";
import { decryptData } from "./encrypt-utils";

export const checkToken = () => {
  const encryptedToken = localStorage.getItem("token");
  if (!encryptedToken) {
    console.log("No encrypted token found in localStorage");
    store.dispatch(setTokenExpired(true));
    return;
  }

  try {
    let token: string;

    // Check if it's already a JWT token (starts with eyJ)
    if (encryptedToken.startsWith('eyJ')) {
      console.log("Token is already JWT, using directly");
      token = encryptedToken;
    } else {
      // Only try to decrypt if it's not a JWT
      console.log("Attempting to decrypt token...");
      const decryptedResult = decryptData(encryptedToken);
      
      // Handle the decrypted result - it could be a string or an object
      if (typeof decryptedResult === "string") {
        token = decryptedResult;
      } else if (decryptedResult && typeof decryptedResult === "object") {
        // If it's an object, try to extract the token from common properties
        token = decryptedResult.token || decryptedResult.accessToken || decryptedResult.jwt;
        
        // If we still don't have a token string, check if it's the full user data object
        if (!token && decryptedResult.userData) {
          token = decryptedResult.userData.token;
        }
      } else {
        console.error("Decryption returned invalid token format:", typeof decryptedResult);
        store.dispatch(setTokenExpired(true));
        return;
      }
    }

    // Check if we have a valid token string
    if (!token || typeof token !== "string") {
      console.error("No valid token found after processing");
      store.dispatch(setTokenExpired(true));
      return;
    }

    // Check if token is a valid JWT format (basic check)
    if (!token.includes('.') || token.split('.').length !== 3) {
      console.error("Token is not in valid JWT format");
      store.dispatch(setTokenExpired(true));
      return;
    }

    const decodedToken = jwtDecode(token);
    const expirationTime = decodedToken.exp ? decodedToken.exp * 1000 : 0;

    const isExpired = Date.now() > expirationTime;
    store.dispatch(setTokenExpired(isExpired));
    
    if (isExpired) {
      console.log("Token is expired");
    } else {
      console.log("Token is valid");
    }
  } catch (error) {
    console.error("Token check error:", error);
    store.dispatch(setTokenExpired(true));
  }
};