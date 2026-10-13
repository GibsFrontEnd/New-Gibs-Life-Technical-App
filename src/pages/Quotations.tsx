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
      <QuotationsSidebar />
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:ml-52 max-md:ml-15">
        <Outlet />
      </div>
    </div>
  );
};

export default Quotations;
