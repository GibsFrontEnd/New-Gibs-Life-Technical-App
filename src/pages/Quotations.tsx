import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import QuotationsSidebar from "@/components/quotations/quotations.sidebar";

const Quotations = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/quotations") {
      navigate("overview");
    }
  }, [location.pathname, navigate]);

  return (
    <div className="w-full flex h-[calc(100vh-64px)]">
      <QuotationsSidebar />
      <div className="flex-1 overflow-x-hidden p-4 md:ml-52 overflow-y-auto"> {/* Remove pl-50 and max-md:ml-15 */}
        <Outlet />
      </div>
    </div>
  );
};

export default Quotations;