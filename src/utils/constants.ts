// Runtime configuration from config.js (can be changed after build)
// Falls back to empty string if config.js is not available
declare global {
  interface Window {
    APP_CONFIG?: {
      API_BASE_URL?: string;
      ROOT_URL?: string;
    };
  }
}

export const SERVER_URL = window.APP_CONFIG?.API_BASE_URL || "";
export const ROOT_URL = window.APP_CONFIG?.ROOT_URL || "";

// Log warning if config is missing
if (!window.APP_CONFIG?.API_BASE_URL) {
  console.error(
    "⚠️ API_BASE_URL not found in config.js. Please configure public/config.js"
  );
}

export const CHAR_SET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
