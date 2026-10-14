import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import CSUSidebar from "../components/csu/csu.sidebar";

const CSU = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/csu" || location.pathname === "/csu/") {
      navigate("overview");
    }
  }, [navigate]);

  return (
    <div className="w-full flex h-full">
      <div className="hidden"><CSUSidebar /></div>
     <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
                <Outlet />
      </div>
    </div>
  );
};

export default CSU;
