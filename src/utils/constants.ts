// src/utils/constants.ts
// Re-export everything from config.ts for backward compatibility

// Import from config.ts
import { 
  SERVER_URL as ConfigSERVER_URL, 
  ROOT_URL as ConfigROOT_URL, 
  QUOTATIONS_URL as ConfigQUOTATIONS_URL,
  CHAR_SET as ConfigCHAR_SET 
} from "../config/config";

// Re-export with same names so existing imports don't break
export const SERVER_URL = ConfigSERVER_URL;
export const ROOT_URL = ConfigROOT_URL;
export const QUOTATIONS_URL = ConfigQUOTATIONS_URL;
export const CHAR_SET = ConfigCHAR_SET;

// Remove the duplicate declare global block
// ❌ DELETE THIS:
// declare global {
//   interface Window {
//     APP_CONFIG?: {
//       API_BASE_URL?: string;
//       ROOT_URL?: string;
//     };
//   }
// }