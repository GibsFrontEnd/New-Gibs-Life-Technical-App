import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import CSUSidebar from "../components/csu/csu.sidebar";

const CSU = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/csu") {
      navigate("enquiries");
    }
  }, [navigate]);

  return (
    <div className="w-full flex h-full">
      <CSUSidebar />
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:ml-52 max-md:ml-15">
                <Outlet />
      </div>
    </div>
  );
};

export default CSU;
