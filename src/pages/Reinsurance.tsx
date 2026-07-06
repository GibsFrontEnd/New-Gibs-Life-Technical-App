//@ts-nocheck
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ReinsuranceSidebar from "@/components/reinsurance/reinsurance.sidebar";

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
      <ReinsuranceSidebar />
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:ml-52 max-md:ml-15">
        <Outlet />
      </div>
    </div>
  );
};

export default Reinsurance;
