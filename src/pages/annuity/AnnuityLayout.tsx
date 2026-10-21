// @ts-nocheck
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { PageHeader, PageShell } from "@/components/page/PageKit";

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
    <PageShell>
      <PageHeader
        eyebrow="Underwriting"
        title="Annuity"
        description="Underwriting, policy administration, payments and accounting for annuity business."
      />
      <nav className="flex flex-wrap gap-2" aria-label="Annuity sections">
        {TABS.map(([path, label]) => (
          <NavLink
            key={path}
            to={`/underwriting/annuity/${path}`}
            className={({ isActive }) =>
              `rounded-full border px-4 py-1.5 text-sm font-medium no-underline transition-colors ${
                isActive ? "border-[#155dfd] bg-[#155dfd] text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </PageShell>
  );
};

export default AnnuityLayout;
