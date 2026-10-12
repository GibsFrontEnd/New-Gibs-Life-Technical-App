// @ts-nocheck
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const TABS = [
  ["proposals", "Proposals"],
  ["policies", "Policies"],
  ["payments", "Due payments"],
  ["batches", "Payment batches"],
  ["deaths", "Death & benefits"],
  ["products", "Rules & factors"],
];

const AnnuityLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (/^\/underwriting\/annuity\/?$/.test(location.pathname)) navigate("proposals", { replace: true });
  }, [location.pathname, navigate]);

  return (
    <div className="mx-auto max-w-[1300px] space-y-4">
      <div>
        <h1 className="m-0 text-2xl font-semibold text-gray-900">Annuity</h1>
        <p className="mt-1 text-sm text-gray-500">
          Underwriting, policy administration, payments and accounting for annuity business.
        </p>
      </div>
      <nav className="flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.map(([path, label]) => (
          <NavLink
            key={path}
            to={`/underwriting/annuity/${path}`}
            className={({ isActive }) =>
              `-mb-px border-b-2 px-4 py-2 text-sm font-medium no-underline ${
                isActive ? "border-blue-900 text-blue-900" : "border-transparent text-gray-500 hover:text-gray-800"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
};

export default AnnuityLayout;
