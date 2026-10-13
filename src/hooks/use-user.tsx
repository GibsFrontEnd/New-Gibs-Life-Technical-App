import { useState } from "react";
import { store } from "../features/store";
import { setTokenExpired } from "../features/reducers/authReducers/authSlice";
import { decryptData } from "../utils/encrypt-utils";
import type { LocalUser } from "../types/user";

const useUser = () => {
  // @ts-ignore
  const [user, setUser] = useState<LocalUser>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? decryptData(storedUser) : null;
  });

  if (!user || user === null) {
    localStorage.setItem("redirectAfterLogin", window.location.pathname);
    store.dispatch(setTokenExpired(true));
  }

  return user;
};

export default useUser;
