// @ts-nocheck

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import CustomerDashboard from "./customer/CustomerDashboard";
import {
  Users,
  ShieldCheck,
  Plus,
  FileCheck,
  User,
  CreditCard,
  Landmark,
  Scale,
  RefreshCw,
  UserCog,
  FileText,
  ArrowRight,
  Building2,
} from "lucide-react";
import { EmptyState, PageHeader, PageShell, Panel, ShortcutCard, StatCard, StatusChip, btnOutline, btnPrimary, tableCls } from "../components/page/PageKit";
import { loadDashboard, type DashboardData } from "../api/dashboard";

// Where each work area starts. `roles` matches the menu's role rules.
const SHORTCUTS = [
  { title: "Individual policies", subtitle: "Policy admin", to: "/underwriting/individual/policy-admin", icon: User, tone: "blue" },
  { title: "Group life", subtitle: "Scheme admin", to: "/underwriting/group-life-quotations", icon: Users, tone: "violet" },
  { title: "Credit life", subtitle: "Scheme admin", to: "/underwriting/credit-life/scheme-admin", icon: CreditCard, tone: "orange" },
  { title: "Annuity", subtitle: "Proposals and policies", to: "/underwriting/annuity/proposals", icon: Landmark, tone: "teal" },
  { title: "Claims", subtitle: "View and process", to: "/claims/overview", icon: Scale, tone: "amber" },
  { title: "Reinsurance", subtitle: "Treaties and facultative", to: "/reinsurance/overview", icon: RefreshCw, tone: "emerald" },
  { title: "Customers", subtitle: "Customer service", to: "/csu/customers", icon: FileText, tone: "rose" },
  { title: "Administration", subtitle: "Company and security", to: "/admin", icon: UserCog, tone: "slate", roles: ["admin", "user"] },
];

const money = (v: any) =>
  v === null || v === undefined || v === "" ? "—" : `₦${Number(v).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const shortDate = (v: any) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

/** A figure, or a dash while loading / when its source could not be reached. */
const fig = (v: number | null | undefined, loading: boolean) => (loading ? "…" : v === null || v === undefined ? "—" : v.toLocaleString("en-NG"));

// ========== BUSINESS MIX ==========
// Validated categorical order (blue, amber, teal, purple); colour follows the line of business.
const MIX = [
  { key: "investment", label: "Investment link", color: "#155dfd", to: "/underwriting/individual/policy-admin/investment-policies" },
  { key: "traditional", label: "Traditional", color: "#d97706", to: "/underwriting/individual/policy-admin/traditional-policies" },
  { key: "groupLife", label: "Group life", color: "#0d9488", to: "/underwriting/group-life-quotations" },
  { key: "annuity", label: "Annuity", color: "#9333ea", to: "/underwriting/annuity/policies" },
];

const BusinessMix = ({ data, loading }: { data: DashboardData | null; loading: boolean }) => {
  const [hover, setHover] = useState<string | null>(null);
  const rows = MIX.map((m) => ({ ...m, value: data?.[m.key] ?? null }));
  const known = rows.filter((r) => typeof r.value === "number" && r.value > 0);
  const sum = known.reduce((a, r) => a + r.value, 0);
  const pct = (v: number) => (sum ? Math.round((v / sum) * 100) : 0);
  const active = rows.find((r) => r.key === hover);

  return (
    <Panel title="Business mix" description={loading ? "Loading…" : `${sum.toLocaleString("en-NG")} policies and schemes on the books`}>
      {sum > 0 ? (
        <div className="relative">
          <div className="flex h-3 w-full gap-0.5" role="img" aria-label="Share of policies by line of business">
            {known.map((r) => (
              <div
                key={r.key}
                onMouseEnter={() => setHover(r.key)}
                onMouseLeave={() => setHover(null)}
                className="h-full cursor-default rounded-[4px] transition-opacity first:rounded-l-full last:rounded-r-full"
                style={{ width: `${Math.max(pct(r.value), 2)}%`, background: r.color, opacity: hover && hover !== r.key ? 0.35 : 1 }}
              />
            ))}
          </div>
          <div className="mt-2 h-5 text-xs text-slate-500" aria-live="polite">
            {active && typeof active.value === "number" ? (
              <span>
                <span className="font-semibold text-slate-900">{active.label}</span> · {active.value.toLocaleString("en-NG")} ({pct(active.value)}%)
              </span>
            ) : (
              "Hover a segment for its share"
            )}
          </div>
        </div>
      ) : (
        <div className="h-3 w-full rounded-full bg-slate-100" />
      )}

      <ul className="mt-3 divide-y divide-slate-100">
        {rows.map((r) => (
          <li key={r.key}>
            <Link
              to={r.to}
              onMouseEnter={() => setHover(r.key)}
              onMouseLeave={() => setHover(null)}
              className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-[#155dfd]"
            >
              <span className="flex items-center gap-2.5 text-slate-600">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
                {r.label}
              </span>
              <span className="font-semibold text-slate-900">
                {fig(r.value, loading)}
                {typeof r.value === "number" && sum > 0 && <span className="ml-2 font-normal text-slate-400">{pct(r.value)}%</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
};

// ========== MAIN DASHBOARD ==========
const Dashboard = () => {
  const navigate = useNavigate();
  const authState = useSelector((state: any) => state.auth);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const getUserRole = () => {
    const storedRole = localStorage.getItem("userRole");
    if (storedRole) return storedRole.toLowerCase();
    if (authState?.user) {
      const u = authState.user;
      if (u.roles?.length) return u.roles[0]?.toLowerCase() || "agent";
      if (u.role) return u.role.toLowerCase();
      if (u.userType) return u.userType.toLowerCase();
    }
    return "agent";
  };

  const userRole = getUserRole();
  const isCustomer = userRole === "customer";

  useEffect(() => {
    if (isCustomer) return;
    let live = true;
    loadDashboard()
      .then((d) => live && setData(d))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [isCustomer]);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (isCustomer) return <CustomerDashboard />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const userName = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("unEncryptedUser") || localStorage.getItem("user") || "{}") || {};
      return u.name || u.fullName || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || u.userName || "";
    } catch {
      return "";
    }
  })();

  const shortcuts = SHORTCUTS.filter((s) => !s.roles || s.roles.includes(userRole));
  const individual =
    data && (data.investment !== null || data.traditional !== null) ? (data.investment ?? 0) + (data.traditional ?? 0) : null;

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <PageShell className="space-y-8">
        <PageHeader
          eyebrow={today}
          title={`${greeting}${userName ? `, ${userName}` : ""}`}
          description="Here is where your life business stands today."
          actions={
            <>
              <button type="button" className={btnOutline} onClick={() => navigate("/underwriting/overview")}>
                <ShieldCheck className="h-4 w-4" />
                Underwriting
              </button>
              <button type="button" className={btnPrimary} onClick={() => navigate("/underwriting/group-life-quotations/new")}>
                <Plus className="h-4 w-4" />
                New group life scheme
              </button>
            </>
          }
        />

        {/* ===== STATS ===== */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Individual policies"
            value={fig(individual, loading)}
            hint={data ? `${fig(data.investment, false)} investment · ${fig(data.traditional, false)} traditional` : "In force"}
            icon={FileCheck}
            tone="blue"
          />
          <StatCard label="Group life schemes" value={fig(data?.groupLife, loading)} hint="Schemes and quotations" icon={Users} tone="violet" />
          <StatCard
            label="Annuity policies"
            value={fig(data?.annuity, loading)}
            hint={data?.annuityPending ? `${data.annuityPending} proposal${data.annuityPending === 1 ? "" : "s"} pending` : "Policies on record"}
            icon={Landmark}
            tone="teal"
          />
          <StatCard label="Customers" value={fig(data?.customers, loading)} hint="Insured on record" icon={User} tone="amber" />
        </div>

        {/* ===== SHORTCUTS ===== */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shortcuts.map((s) => (
            <ShortcutCard key={s.to} to={s.to} icon={s.icon} title={s.title} subtitle={s.subtitle} tone={s.tone} />
          ))}
        </div>

        {/* ===== RECENT + MIX ===== */}
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
          <Panel
            className="xl:col-span-2"
            flush
            title="Recent policies"
            description="The six most recent individual policies"
            actions={
              <Link to="/underwriting/individual/policy-admin" className="inline-flex items-center gap-1 text-sm font-semibold text-[#155dfd] hover:underline">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            }
          >
            {loading ? (
              <EmptyState title="Loading policies…" />
            ) : data?.recentPolicies?.length ? (
              <div className={tableCls.wrap}>
              <table className={tableCls.table}>
                <thead className={tableCls.thead}>
                  <tr>
                    <th className={tableCls.th}>Policy</th>
                    <th className={tableCls.th + " hidden w-[170px] @xl:table-cell"}>Cover</th>
                    <th className={tableCls.th + " w-[130px] text-right"}>Premium</th>
                    <th className={tableCls.th + " w-[110px]"}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentPolicies.map((p: any) => (
                    <tr key={p.transGUID || p.policyNo} className={tableCls.tr}>
                      <td className={tableCls.td}>
                        <div className={tableCls.primary} title={p.fullName}>{p.fullName || "—"}</div>
                        <div className={tableCls.secondary}>
                          {p.policyNo} · {shortDate(p.startDate)}
                        </div>
                      </td>
                      <td className={tableCls.td + " hidden @xl:table-cell"}>
                        <div className="truncate font-medium text-slate-900">{p.coverCode}</div>
                        <div className={tableCls.secondary} title={p.covertype}>{p.covertype}</div>
                      </td>
                      <td className={tableCls.td + " text-right"}>
                        <div className={tableCls.primary}>{money(p.totalPremium)}</div>
                        {p.mop && <div className={tableCls.secondary}>{p.mop}</div>}
                      </td>
                      <td className={tableCls.td}>
                        <StatusChip status={p.transSTATUS || p.status || p.remarks} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            ) : (
              <EmptyState title="No policies to show" description="Recent policies will appear here, or the list could not be reached." />
            )}
          </Panel>

          <div className="space-y-6">
            <BusinessMix data={data} loading={loading} />

            <Panel
              title="Latest group life schemes"
              bodyClassName="px-5 py-1 sm:px-6"
              actions={
                <Link to="/underwriting/group-life-quotations" className="text-sm font-semibold text-[#155dfd] hover:underline">
                  View all
                </Link>
              }
            >
              {data?.recentSchemes?.length ? (
                <ul className="divide-y divide-slate-100">
                  {data.recentSchemes.map((s: any) => (
                    <li key={s.policyNo}>
                      <Link
                        to={`/underwriting/group-life-quotations/${encodeURIComponent(s.policyNo)}`}
                        className="flex items-center gap-3 py-3 hover:text-[#155dfd]"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600">
                          <Building2 className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900">{s.insuredName || s.policyNo}</span>
                          <span className="block truncate text-xs text-slate-500">
                            {s.policyNo} · {shortDate(s.startDate)}
                          </span>
                        </span>
                        <StatusChip status={s.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-sm text-slate-500">{loading ? "Loading…" : "No schemes to show."}</p>
              )}
            </Panel>
          </div>
        </div>
      </PageShell>
    </div>
  );
};

export default Dashboard;
