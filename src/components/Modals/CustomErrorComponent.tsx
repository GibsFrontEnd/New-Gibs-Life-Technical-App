import { useNavigate } from "react-router-dom";
import { setShowAuthError } from "../../features/reducers/authReducers/authSlice";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  OutsideDismissDialog,
} from "../UI/dialog";
import { Button } from "../UI/new-button";
import { useAppDispatch } from "../../hooks/use-apps";

const CustomErrorComponent = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  return (
    // @ts-ignore
    <OutsideDismissDialog open={true}>
      <DialogHeader>
        <DialogTitle>Session Expired</DialogTitle>
      </DialogHeader>
      <DialogContent className="p-6 pt-0">
        <p className="mb-4 font-semibold text-sm">
          Your session has expired. Please log in again.
        </p>
        <Button
          className="w-full"
          onClick={() => {
            localStorage.setItem(
              "redirectAfterLogin",
              window.location.pathname
            );
            localStorage.removeItem("token");
            dispatch(setShowAuthError(false));
            navigate("/login", { replace: true });
          }}
        >
          Go to Login
        </Button>
      </DialogContent>
    </OutsideDismissDialog>
  );
};

export default CustomErrorComponent;
