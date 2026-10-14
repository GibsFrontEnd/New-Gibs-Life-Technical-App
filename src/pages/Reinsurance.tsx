//@ts-nocheck
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ReinsuranceSidebar from "../components/Reinsurance/reinsurance.sidebar";

const Reinsurance = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/reinsurance") {
      navigate("overview");
    }
  }, [location.pathname, navigate]);

  return (
    <div className="w-full flex h-full">
      <div className="hidden"><ReinsuranceSidebar /></div>
     <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default Reinsurance;
