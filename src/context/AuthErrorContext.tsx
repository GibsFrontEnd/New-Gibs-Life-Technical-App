import { createContext, useContext } from "react";

export const AuthErrorContext = createContext<string | null>(null);

export const useAuthError = () => useContext(AuthErrorContext);
