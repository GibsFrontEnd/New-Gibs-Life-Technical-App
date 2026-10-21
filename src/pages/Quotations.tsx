import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import QuotationsSidebar from "../components/quotations/quotations.sidebar";

const Quotations = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/quotations") {
      navigate("overview");
    }
  }, [location.pathname, navigate]);

  return (
    <div className="w-full flex h-full">
      <div className="hidden"><QuotationsSidebar /></div>
      <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4">
        <Outlet />
      </div>
    </div>
  );
};

export default Quotations;
