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
      <UnderwritingSidebar />
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:ml-52 md:p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default Underwriting;
