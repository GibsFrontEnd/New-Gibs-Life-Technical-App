import * as CryptoJS from "crypto-js";

const getSecretKey = (): string => {
  const key = import.meta.env.VITE_SECRET_KEY;
  
  if (!key) {
    if (import.meta.env.DEV) {
      console.warn('VITE_SECRET_KEY not found, using development fallback');
      return 'dev-secret-key-change-in-production';
    } else {
      throw new Error('VITE_SECRET_KEY is required in production');
    }
  }
  
  return key;
};

const encryptData = (data: any): string | null => {
  try {
    if (data === null || data === undefined) return null;
    const secretKey = getSecretKey();
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return CryptoJS.AES.encrypt(dataString, secretKey).toString();
  } catch (error) {
    console.error("Encryption failed:", error);
    return null;
  }
};

const decryptData = (encryptedData: string | any): any => {
  try {
    // If it's not a string, return as-is (already decrypted)
    if (typeof encryptedData !== "string") {
      return encryptedData;
    }

    // If it looks like plain JSON (starts with { or [), try to parse it directly
    if (encryptedData.trim().startsWith('{') || encryptedData.trim().startsWith('[')) {
      try {
        return JSON.parse(encryptedData);
      } catch {
        // If JSON parsing fails, continue with decryption
      }
    }

    // If it's a JWT token (starts with eyJ), return as-is
    if (encryptedData.startsWith('eyJ')) {
      return encryptedData;
    }

    const secretKey = getSecretKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
    
    if (!bytes || bytes.sigBytes <= 0) {
      console.warn("Decryption failed - invalid encrypted data or wrong key");
      // Return the original data if decryption fails
      return encryptedData;
    }

    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      console.warn("Decryption produced empty result");
      return encryptedData;
    }

    // Try to parse as JSON, if it fails return as string
    try {
      return JSON.parse(decryptedString);
    } catch {
      return decryptedString;
    }
  } catch (error) {
    console.warn("Decryption failed, returning original data:", error);
    // Return the original data if anything goes wrong
    return encryptedData;
  }
};

export { encryptData, decryptData };