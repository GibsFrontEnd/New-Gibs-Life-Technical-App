//@ts-nocheck
import React, { useEffect, useState, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAllRisks } from "../../features/reducers/adminReducers/riskSlice";
import type { AppDispatch, RootState } from "../../features/store";
import { 
  ChevronDown,
  Shield,
  RefreshCw,
  FilePen,
  FileOutput,
  FileText,
  ClipboardList,
  RotateCcw,
  Users
} from "lucide-react";

const SIDEBAR_BG = "#0d47a1";
const ACTIVE_BG = "rgba(255,255,255,0.15)";
const HOVER_BG = "rgba(255,255,255,0.08)";

const UnderwritingSidebar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { risks } = useSelector((s: RootState) => s.risks);

  // Auto-open sections based on current route
  const getDefaultOpen = () => {
    if (location.pathname.startsWith('/underwritings/renewals')) return 'renewals';
    if (location.pathname.startsWith('/underwritings/endorsements')) return 'endorsements';
    if (location.pathname.startsWith('/underwritings')) return 'policyAdmin';
    return null;
  };

  const [openSection, setOpenSection] = useState<string | null>(getDefaultOpen);

  useEffect(() => {
    dispatch(
      getAllRisks({
        pageNumber: 1,
        pageSize: 100,
        baseUrl: "https://gibsucrapi.newgibsonline.com/api",
      }) as any,
    );
  }, [dispatch]);

  const navItems = useMemo(
    () => ({
      policyAdmin: [
        { path: "/underwritings", label: "All Policies", icon: ClipboardList },
        ...(risks || []).map((risk) => ({
          path: `/underwritings/${risk.riskID}`,
          label: risk.riskName,
          icon: FileText,
          id: risk.riskID,
        })),
      ],
      renewals: [
        { path: "/underwritings/renewals", label: "All Renewals", icon: ClipboardList },
        ...(risks || []).map((risk) => ({
          path: `/underwritings/renewals/${risk.riskID}`,
          label: risk.riskName,
          icon: RotateCcw,
          id: risk.riskID,
        })),
      ],
      endorsements: [
        { path: "/underwritings/endorsements", label: "All Endorsements", icon: ClipboardList },
        ...(risks || []).map((risk) => ({
          path: `/underwritings/endorsements/${risk.riskID}`,
          label: risk.riskName,
          icon: FilePen,
          id: risk.riskID,
        })),
      ],
    }),
    [risks],
  );

  const toggle = (key: string) =>
    setOpenSection((prev) => (prev === key ? null : key));

  const hasActiveSection = (basePath: string) => {
    return location.pathname.startsWith(basePath);
  };

  return (
    <aside
      className="fixed left-0 top-16 h-[calc(100vh-64px)] z-100 text-white flex-col overflow-y-auto md:w-52 hidden md:flex"
      style={{ backgroundColor: SIDEBAR_BG }}
    >
      <nav className="flex-1 py-2 overflow-y-auto">
        {/* Policy Admin Section */}
        <div>
          <button
            onClick={() => toggle("policyAdmin")}
            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-white/10 max-md:justify-center max-md:px-2"
            style={{
              backgroundColor: openSection === "policyAdmin" || hasActiveSection("/underwritings") 
                ? HOVER_BG : "transparent",
              color: hasActiveSection("/underwritings") ? "white" : "rgba(255,255,255,0.85)",
            }}
          >
            <Shield size={17} className="flex-shrink-0" />
            <span className="text-sm font-bold flex-1 max-md:hidden">Policy Admin</span>
            <ChevronDown
              size={14}
              className="max-md:hidden flex-shrink-0 transition-transform duration-200"
              style={{
                transform: openSection === "policyAdmin" ? "rotate(180deg)" : "rotate(0deg)",
                color: "rgba(255,255,255,0.5)",
              }}
            />
          </button>

          <div
            style={{
              maxHeight: openSection === "policyAdmin" ? `${navItems.policyAdmin.length * 44}px` : "0px",
              overflow: "hidden",
              transition: "max-height 0.3s ease-in-out",
            }}
          >
            {navItems.policyAdmin.map((item) => {
              const ItemIcon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-3 py-2.5 pl-10 pr-4 text-white/60 no-underline transition-all duration-150 border-l-4 border-transparent hover:text-white hover:bg-white/10 max-md:justify-center max-md:pl-2 max-md:pr-2"
                  style={({ isActive }) =>
                    isActive
                      ? { backgroundColor: ACTIVE_BG, borderLeftColor: "white", color: "white" }
                      : {}
                  }
                >
                  <ItemIcon size={14} className="flex-shrink-0" />
                  <span className="text-xs font-medium max-md:hidden leading-tight">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Policy Renewals Section */}
        <div>
          <button
            onClick={() => toggle("renewals")}
            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-white/10 max-md:justify-center max-md:px-2"
            style={{
              backgroundColor: openSection === "renewals" || hasActiveSection("/underwritings/renewals") 
                ? HOVER_BG : "transparent",
              color: hasActiveSection("/underwritings/renewals") ? "white" : "rgba(255,255,255,0.85)",
            }}
          >
            <RefreshCw size={17} className="flex-shrink-0" />
            <span className="text-sm font-bold flex-1 max-md:hidden">Policy Renewals</span>
            <ChevronDown
              size={14}
              className="max-md:hidden flex-shrink-0 transition-transform duration-200"
              style={{
                transform: openSection === "renewals" ? "rotate(180deg)" : "rotate(0deg)",
                color: "rgba(255,255,255,0.5)",
              }}
            />
          </button>

          <div
            style={{
              maxHeight: openSection === "renewals" ? `${navItems.renewals.length * 44}px` : "0px",
              overflow: "hidden",
              transition: "max-height 0.3s ease-in-out",
            }}
          >
            {navItems.renewals.map((item) => {
              const ItemIcon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-3 py-2.5 pl-10 pr-4 text-white/60 no-underline transition-all duration-150 border-l-4 border-transparent hover:text-white hover:bg-white/10 max-md:justify-center max-md:pl-2 max-md:pr-2"
                  style={({ isActive }) =>
                    isActive
                      ? { backgroundColor: ACTIVE_BG, borderLeftColor: "white", color: "white" }
                      : {}
                  }
                >
                  <ItemIcon size={14} className="flex-shrink-0" />
                  <span className="text-xs font-medium max-md:hidden leading-tight">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Endorsements Section */}
        <div>
          <button
            onClick={() => toggle("endorsements")}
            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-white/10 max-md:justify-center max-md:px-2"
            style={{
              backgroundColor: openSection === "endorsements" || hasActiveSection("/underwritings/endorsements") 
                ? HOVER_BG : "transparent",
              color: hasActiveSection("/underwritings/endorsements") ? "white" : "rgba(255,255,255,0.85)",
            }}
          >
            <FilePen size={17} className="flex-shrink-0" />
            <span className="text-sm font-bold flex-1 max-md:hidden">Endorsements</span>
            <ChevronDown
              size={14}
              className="max-md:hidden flex-shrink-0 transition-transform duration-200"
              style={{
                transform: openSection === "endorsements" ? "rotate(180deg)" : "rotate(0deg)",
                color: "rgba(255,255,255,0.5)",
              }}
            />
          </button>

          <div
            style={{
              maxHeight: openSection === "endorsements" ? `${navItems.endorsements.length * 44}px` : "0px",
              overflow: "hidden",
              transition: "max-height 0.3s ease-in-out",
            }}
          >
            {navItems.endorsements.map((item) => {
              const ItemIcon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-3 py-2.5 pl-10 pr-4 text-white/60 no-underline transition-all duration-150 border-l-4 border-transparent hover:text-white hover:bg-white/10 max-md:justify-center max-md:pl-2 max-md:pr-2"
                  style={({ isActive }) =>
                    isActive
                      ? { backgroundColor: ACTIVE_BG, borderLeftColor: "white", color: "white" }
                      : {}
                  }
                >
                  <ItemIcon size={14} className="flex-shrink-0" />
                  <span className="text-xs font-medium max-md:hidden leading-tight">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Convert Quotes - top-level link */}
        <NavLink
          to="/underwritings/convert-quotes"
          className="flex items-center gap-3 px-4 py-3 text-white/80 no-underline transition-all duration-150 border-l-4 border-transparent hover:bg-white/10 hover:text-white max-md:justify-center max-md:px-2"
          style={({ isActive }) =>
            isActive ? { backgroundColor: ACTIVE_BG, borderLeftColor: "white", color: "white" } : {}
          }
        >
          <FileOutput size={17} className="flex-shrink-0" />
          <span className="text-sm font-bold max-md:hidden">Convert Quotes</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default UnderwritingSidebar;