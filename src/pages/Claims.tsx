//@ts-nocheck
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ClaimsSidebar from "../components/claims/claims.sidebar";

const Claims = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/claims") {
      navigate("overview");
    }
  }, [location.pathname, navigate]);

  return (
    <div className="w-full flex h-full">
      <div className="hidden"><ClaimsSidebar /></div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default Claims;
