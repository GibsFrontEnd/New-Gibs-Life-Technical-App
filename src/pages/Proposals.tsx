//@ts-nocheck

import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ProposalsSidebar from "@/components/proposals/proposals.sidebar";

const Proposals = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/proposals") {
      navigate("overview");
    }
  }, [location.pathname, navigate]);

  return (
    <div className="w-full flex h-full">
      <div className="hidden"><ProposalsSidebar /></div>
      <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4">
        <Outlet />
      </div>
    </div>
  );
};

export default Proposals;
