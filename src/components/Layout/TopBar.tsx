// @ts-nocheck
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, LogOut } from "lucide-react";
import { readRole, readUser } from "./userRole";

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  csu: "CSU",
  underwriting: "Underwriting",
  claims: "Claims",
  reinsurance: "Reinsurance",
  admin: "Administration",
  proposals: "Proposals",
  quotations: "Quotations",
};

/** The slim bar above the page on large screens: where you are, and the signed-in user. */
const TopBar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useMemo(readUser, [pathname]);
  const name = String(user.name || user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || user.userName || user.email || "User");
  const role = readRole();
  const section = pathname.split("/")[1];

  // The same clean-up the header's Logout does.
  const handleLogout = () => {
    ["token", "agentId", "userRole", "user", "unEncryptedUser"].forEach((k) => localStorage.removeItem(k));
    navigate("/login");
  };

  return (
    <header className="hidden h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 lg:flex">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-500">
        <span>Workspace</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to={`/${section}`} className="font-semibold text-slate-900">
          {TITLES[section] || "Home"}
        </Link>
      </nav>

      <div className="relative">
        <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-haspopup="menu" aria-expanded={menuOpen} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#155dfd] text-xs font-bold uppercase text-white">{name.slice(0, 2)}</span>
          <span className="text-left leading-tight">
            <span className="block max-w-[10rem] truncate text-sm font-semibold capitalize text-slate-900">{name}</span>
            {role && <span className="block max-w-[10rem] truncate text-xs capitalize text-slate-500">{role}</span>}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div role="menu" className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
              <button type="button" role="menuitem" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50">
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default TopBar;
