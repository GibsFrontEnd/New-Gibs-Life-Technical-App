import { AuthErrorContext } from "../../context/AuthErrorContext";
import { selectAuth } from "../../features/reducers/authReducers/authSlice";
import { useAppSelector } from "../../hooks/use-apps";
import CustomErrorComponent from "./CustomErrorComponent";

// @ts-ignore
const AuthErrorProvider = ({ children }) => {
  const { showAuthError } = useAppSelector(selectAuth);

  return (
    // @ts-ignore
    <AuthErrorContext.Provider value={{ showAuthError }}>
      {children}
      {showAuthError && <CustomErrorComponent />}
    </AuthErrorContext.Provider>
  );
};

export default AuthErrorProvider;
