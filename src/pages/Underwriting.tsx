import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import UnderwritingSidebar from "../components/underwriting/underwriting.sidebar";

const Underwriting = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/underwriting") {
      navigate("overview");
    }
  }, [location.pathname, navigate]);

  return (
    <div className="w-full flex h-full">
      <div className="hidden"><UnderwritingSidebar /></div>
      <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </div>
    </div>
  );
};

export default Underwriting;
