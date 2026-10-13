import { useEffect } from "react";
import { checkToken } from "../utils/check-token"; // Your global token check function

export const useAuth = () => {
  useEffect(() => {
    checkToken();

    const onStorageChange = () => checkToken();
    window.addEventListener("storage", onStorageChange);

    return () => window.removeEventListener("storage", onStorageChange);
  }, []);
};