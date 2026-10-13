//@ts-nocheck
import React, { useState, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAllRisks } from "../../features/reducers/adminReducers/riskSlice";
import type { AppDispatch, RootState } from "../../features/store";
import { SERVER_URL } from "../../utils/constants";
import { 
  ChevronDown,
  FileCheck,
  FilePen,
  RefreshCw,
  Settings,
  Shield,
  TrendingUp,
  Users,
  CreditCard,
  GitBranch,
  FileOutput,
  ClipboardList,
  Send,
  CheckCircle,
  Wrench,
  BarChart3,
  DollarSign,
  Clock,
  Receipt,
  FileText,
  Calculator,
  PieChart,
  Scale,
  Lock,
  Tag,
  Layers,
  Activity,
  Inbox,
  LayoutDashboard, // ← ADD THIS
  // Outbox,
  Award
} from "lucide-react";

const SIDEBAR_BG = "#0d47a1";
const ACTIVE_BG = "rgba(255,255,255,0.15)";
const HOVER_BG = "rgba(255,255,255,0.08)";

const ReinsuranceSidebar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { risks } = useSelector((s: RootState) => s.risks);

  const [openSections, setOpenSections] = useState({
    facultativeInwards: false,
    facultativeOutwards: false,
    treaties: false,
    authorization: false,
    maintenance: false,
  });

  // Auto-open sections based on current route
  const getDefaultOpen = () => {
    const sectionMap = {
      '/reinsurance/overview': 'overview',
      '/reinsurance/facultative-inwards': 'facultativeInwards',
      '/reinsurance/facultative-outwards': 'facultativeOutwards',
      '/reinsurance/treaties': 'treaties',
      '/reinsurance/authorization': 'authorization',
      '/reinsurance/maintenance': 'maintenance',
    };
    
    for (const [path, section] of Object.entries(sectionMap)) {
      if (location.pathname.startsWith(path)) {
        return section;
      }
    }
    return null;
  };

  const [openSection, setOpenSection] = useState<string | null>(getDefaultOpen);

  const treatySubItems = useMemo(() => [
    { path: "/reinsurance/treaties/process-underwriting-treaty", label: "Process Underwriting Treaty", icon: FileCheck },
    { path: "/reinsurance/treaties/ri-distribution", label: "RI Distribution", icon: Send },
    { path: "/reinsurance/treaties/final-ri-distribution", label: "Final RI Distribution", icon: CheckCircle },
    { path: "/reinsurance/treaties/process-claims-paid", label: "Process Claims Paid", icon: DollarSign },
    { path: "/reinsurance/treaties/claims-paid-recoveries", label: "Claims Paid Recoveries", icon: Receipt },
    { path: "/reinsurance/treaties/process-outstanding-claims", label: "Process Outstanding Claims", icon: Clock },
    { path: "/reinsurance/treaties/outstanding-claims-recoveries", label: "Outstanding Claims Recoveries", icon: FileText },
    { path: "/reinsurance/treaties/premium-losses-summary", label: "Premium and Losses Summary", icon: BarChart3 },
    { path: "/reinsurance/treaties/premium-adjustment-profit-commission", label: "Premium Adjustment & Profit", icon: Calculator },
  ], []);

  const maintenanceSubItems = useMemo(() => [
    { path: "/reinsurance/maintenance/treaty-distribution", label: "Treaty Distribution", icon: Layers },
    { path: "/reinsurance/maintenance/bond-quota-share-rates", label: "Bond Quota Share Rates", icon: PieChart },
    { path: "/reinsurance/maintenance/risk-profile-ranges", label: "Risk Profile Ranges", icon: Activity },
    { path: "/reinsurance/maintenance/treaty-proportion-rules", label: "Treaty Proportion Rules", icon: Scale },
    { path: "/reinsurance/maintenance/excess-of-loss-treaty-rules", label: "Excess of Loss Treaty Rules", icon: Lock },
    { path: "/reinsurance/maintenance/loss-ratio-range", label: "Loss Ratio Range", icon: TrendingUp },
    { path: "/reinsurance/maintenance/risk-classification", label: "Risk Classification", icon: Tag },
  ], []);

  const navItems = useMemo(() => ({
    facultativeInwards: [
      { path: "/reinsurance/facultative-inwards", label: "All Inwards", icon: Inbox },
      ...(risks || []).map((risk) => ({
        path: `/reinsurance/facultative-inwards/${risk.riskID}`,
        label: risk.riskName,
        icon: FileText,
      })),
    ],
    facultativeOutwards: [
      { path: "/reinsurance/facultative-outwards", label: "All Outwards", icon: Inbox },
      ...(risks || []).map((risk) => ({
        path: `/reinsurance/facultative-outwards/${risk.riskID}`,
        label: risk.riskName,
        icon: FileText,
      })),
    ],
    authorization: [
      { path: "/reinsurance/authorization", label: "All Authorizations", icon: Shield },
      ...(risks || []).map((risk) => ({
        path: `/reinsurance/authorization/${risk.riskID}`,
        label: risk.riskName,
        icon: FileText,
      })),
    ],
  }), [risks]);

  const toggle = (key: string) =>
    setOpenSection((prev) => (prev === key ? null : key));

  const hasActiveSection = (basePath: string) => {
    return location.pathname.startsWith(basePath);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <aside
      className="fixed left-0 top-16 h-[calc(100vh-64px)] z-100 text-white flex-col overflow-y-auto md:w-52 hidden md:flex"
      style={{ backgroundColor: SIDEBAR_BG }}
    >
      <nav className="flex-1 py-2 overflow-y-auto">
        {/* ✅ OVERVIEW - Now first item */}
        <NavLink
          to="/reinsurance/overview"
          className="flex items-center gap-3 px-4 py-3 text-white/80 no-underline transition-all duration-150 border-l-4 border-transparent hover:bg-white/10 hover:text-white max-md:justify-center max-md:px-2"
          style={({ isActive }) =>
            isActive ? { backgroundColor: ACTIVE_BG, borderLeftColor: "white", color: "white" } : {}
          }
        >
          <LayoutDashboard size={17} className="flex-shrink-0" />
          <span className="text-sm font-bold max-md:hidden">Overview</span>
        </NavLink>

        {/* Divider */}
        <div className="mx-4 my-2 border-t border-white/10" />

        {/* Enquiries/Approval - top-level link */}
        <NavLink
          to="/reinsurance/enquiries-approval"
          className="flex items-center gap-3 px-4 py-3 text-white/80 no-underline transition-all duration-150 border-l-4 border-transparent hover:bg-white/10 hover:text-white max-md:justify-center max-md:px-2"
          style={({ isActive }) =>
            isActive ? { backgroundColor: ACTIVE_BG, borderLeftColor: "white", color: "white" } : {}
          }
        >
          <ClipboardList size={17} className="flex-shrink-0" />
          <span className="text-sm font-bold max-md:hidden">Enquiries/Approval</span>
        </NavLink>

        {/* Divider */}
        <div className="mx-4 my-2 border-t border-white/10" />

        {/* Facultative Inwards Section */}
        <div>
          <button
            onClick={() => toggle("facultativeInwards")}
            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-white/10 max-md:justify-center max-md:px-2"
            style={{
              backgroundColor: openSection === "facultativeInwards" || hasActiveSection("/reinsurance/facultative-inwards") 
                ? HOVER_BG : "transparent",
              color: hasActiveSection("/reinsurance/facultative-inwards") ? "white" : "rgba(255,255,255,0.85)",
            }}
          >
            <Inbox size={17} className="flex-shrink-0" />
            <span className="text-sm font-bold flex-1 max-md:hidden">Facultative Inwards</span>
            <ChevronDown
              size={14}
              className="max-md:hidden flex-shrink-0 transition-transform duration-200"
              style={{
                transform: openSection === "facultativeInwards" ? "rotate(180deg)" : "rotate(0deg)",
                color: "rgba(255,255,255,0.5)",
              }}
            />
          </button>

          <div
            style={{
              maxHeight: openSection === "facultativeInwards" ? `${navItems.facultativeInwards.length * 44}px` : "0px",
              overflow: "hidden",
              transition: "max-height 0.3s ease-in-out",
            }}
          >
            {navItems.facultativeInwards.map((item) => {
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

        {/* Facultative Outwards Section */}
        <div>
          <button
            onClick={() => toggle("facultativeOutwards")}
            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-white/10 max-md:justify-center max-md:px-2"
            style={{
              backgroundColor: openSection === "facultativeOutwards" || hasActiveSection("/reinsurance/facultative-outwards") 
                ? HOVER_BG : "transparent",
              color: hasActiveSection("/reinsurance/facultative-outwards") ? "white" : "rgba(255,255,255,0.85)",
            }}
          >
            <Inbox size={17} className="flex-shrink-0" />
            <span className="text-sm font-bold flex-1 max-md:hidden">Facultative Outwards</span>
            <ChevronDown
              size={14}
              className="max-md:hidden flex-shrink-0 transition-transform duration-200"
              style={{
                transform: openSection === "facultativeOutwards" ? "rotate(180deg)" : "rotate(0deg)",
                color: "rgba(255,255,255,0.5)",
              }}
            />
          </button>

          <div
            style={{
              maxHeight: openSection === "facultativeOutwards" ? `${navItems.facultativeOutwards.length * 44}px` : "0px",
              overflow: "hidden",
              transition: "max-height 0.3s ease-in-out",
            }}
          >
            {navItems.facultativeOutwards.map((item) => {
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

        {/* Treaties Section */}
        <div>
          <button
            onClick={() => toggle("treaties")}
            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-white/10 max-md:justify-center max-md:px-2"
            style={{
              backgroundColor: openSection === "treaties" || hasActiveSection("/reinsurance/treaties") 
                ? HOVER_BG : "transparent",
              color: hasActiveSection("/reinsurance/treaties") ? "white" : "rgba(255,255,255,0.85)",
            }}
          >
            <FileCheck size={17} className="flex-shrink-0" />
            <span className="text-sm font-bold flex-1 max-md:hidden">Treaties</span>
            <ChevronDown
              size={14}
              className="max-md:hidden flex-shrink-0 transition-transform duration-200"
              style={{
                transform: openSection === "treaties" ? "rotate(180deg)" : "rotate(0deg)",
                color: "rgba(255,255,255,0.5)",
              }}
            />
          </button>

          <div
            style={{
              maxHeight: openSection === "treaties" ? `${treatySubItems.length * 44}px` : "0px",
              overflow: "hidden",
              transition: "max-height 0.3s ease-in-out",
            }}
          >
            {treatySubItems.map((item) => {
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

        {/* Authorization Section */}
        <div>
          <button
            onClick={() => toggle("authorization")}
            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-white/10 max-md:justify-center max-md:px-2"
            style={{
              backgroundColor: openSection === "authorization" || hasActiveSection("/reinsurance/authorization") 
                ? HOVER_BG : "transparent",
              color: hasActiveSection("/reinsurance/authorization") ? "white" : "rgba(255,255,255,0.85)",
            }}
          >
            <Shield size={17} className="flex-shrink-0" />
            <span className="text-sm font-bold flex-1 max-md:hidden">Authorization</span>
            <ChevronDown
              size={14}
              className="max-md:hidden flex-shrink-0 transition-transform duration-200"
              style={{
                transform: openSection === "authorization" ? "rotate(180deg)" : "rotate(0deg)",
                color: "rgba(255,255,255,0.5)",
              }}
            />
          </button>

          <div
            style={{
              maxHeight: openSection === "authorization" ? `${navItems.authorization.length * 44}px` : "0px",
              overflow: "hidden",
              transition: "max-height 0.3s ease-in-out",
            }}
          >
            {navItems.authorization.map((item) => {
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

        {/* Maintenance Section */}
        <div>
          <button
            onClick={() => toggle("maintenance")}
            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-white/10 max-md:justify-center max-md:px-2"
            style={{
              backgroundColor: openSection === "maintenance" || hasActiveSection("/reinsurance/maintenance") 
                ? HOVER_BG : "transparent",
              color: hasActiveSection("/reinsurance/maintenance") ? "white" : "rgba(255,255,255,0.85)",
            }}
          >
            <Wrench size={17} className="flex-shrink-0" />
            <span className="text-sm font-bold flex-1 max-md:hidden">Maintenance</span>
            <ChevronDown
              size={14}
              className="max-md:hidden flex-shrink-0 transition-transform duration-200"
              style={{
                transform: openSection === "maintenance" ? "rotate(180deg)" : "rotate(0deg)",
                color: "rgba(255,255,255,0.5)",
              }}
            />
          </button>

          <div
            style={{
              maxHeight: openSection === "maintenance" ? `${maintenanceSubItems.length * 44}px` : "0px",
              overflow: "hidden",
              transition: "max-height 0.3s ease-in-out",
            }}
          >
            {maintenanceSubItems.map((item) => {
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
      </nav>
    </aside>
  );
};

export default ReinsuranceSidebar;