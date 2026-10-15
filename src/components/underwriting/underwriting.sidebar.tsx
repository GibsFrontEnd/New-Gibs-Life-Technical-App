
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  ChevronDown, 
  LayoutDashboard, 
  User, 
  Users, 
  CreditCard, 
  FileCheck, 
  FilePen, 
  Settings, 
  RefreshCw,
  Shield,
  TrendingUp,
  UserCog,
  CalendarCheck,
  Heart,
  UsersRound,
  Wallet,
  AlertCircle,
  Bell,
  RotateCcw,
  Calculator,
  FolderOpen,
} from "lucide-react";

const SIDEBAR_BG = "#0d47a1";        // Dark blue
const ACTIVE_BG = "rgba(255,255,255,0.15)";
const HOVER_BG = "rgba(255,255,255,0.08)";

const sections = [
  {
    label: "Individual",
    key: "individual",
    icon: User,
    items: [
      { 
        path: "/underwriting/individual/policy-admin", 
        label: "Policy Admin", 
        icon: FileCheck,
        subItems: [
          { path: "/underwriting/individual/policy-admin/investment-policies", label: "Investment Policies", icon: TrendingUp },
          { path: "/underwriting/individual/policy-admin/traditional-policies", label: "Traditional Policies", icon: FolderOpen },
        ]
      },
      { 
        path: "/underwriting/individual/endorsements", 
        label: "Endorsements", 
        icon: FilePen,
        subItems: [
          { path: "/underwriting/individual/endorsements/personal-details", label: "Personal Details Change", icon: UserCog },
          { path: "/underwriting/individual/endorsements/premium-details", label: "Premium Details Change", icon: Wallet },
          { path: "/underwriting/individual/endorsements/scheme-details", label: "Scheme Details Change", icon: CalendarCheck },
          { path: "/underwriting/individual/endorsements/beneficiary-details", label: "Beneficiary Details Change", icon: Heart },
          { path: "/underwriting/individual/endorsements/policy-agent", label: "Policy Agent Change", icon: UsersRound },
        ]
      },
      { 
        path: "/underwriting/individual/processing", 
        label: "Processing", 
        icon: RefreshCw,
        subItems: [
          { path: "/underwriting/individual/processing/account-balance", label: "Account Balance Statement", icon: Wallet },
          { path: "/underwriting/individual/processing/lapse-policies", label: "Lapse Policies Processing", icon: AlertCircle },
          { path: "/underwriting/individual/processing/premium-alert", label: "Premium Alert Processing", icon: Bell },
          { path: "/underwriting/individual/processing/policy-renewal", label: "Policy Renewal Processing", icon: RotateCcw },
          { path: "/underwriting/individual/processing/end-actuarial", label: "End Actuarial Processing", icon: Calculator },
        ]
      },
      { path: "/underwriting/individual/maintenance", label: "Maintenance", icon: Settings },
    ],
  },
  {
    label: "Group Life",
    key: "group-life",
    icon: Users,
    items: [
      { path: "/underwriting/group-life-quotations", label: "Scheme Admin", icon: Shield }, 
      { path: "/underwriting/group-life/scheme-renewals", label: "Scheme Renewals", icon: RefreshCw }, 
      { path: "/underwriting/group-life/endorsement", label: "Endorsements", icon: FilePen },
      { path: "/underwriting/group-life/maintenance", label: "Maintenance", icon: Settings },
    ],
  },
  {
    label: "Credit Life",
    key: "credit-life",
    icon: CreditCard,
    items: [
      { path: "/underwriting/credit-life/scheme-admin", label: "Scheme Admin", icon: Shield },
      { path: "/underwriting/credit-life/scheme-renewals", label: "Scheme Renewals", icon: RefreshCw },
      { path: "/underwriting/credit-life/endorsements", label: "Endorsements", icon: FilePen },
      { path: "/underwriting/credit-life/maintenance", label: "Maintenance", icon: Settings },
    ],
  },
  {
    label: "Annuity",
    key: "annuity",
    icon: Wallet,
    items: [
      { path: "/underwriting/annuity/proposals", label: "Proposals", icon: FileCheck },
      { path: "/underwriting/annuity/policies", label: "Policies", icon: Shield },
      { path: "/underwriting/annuity/payments", label: "Due Payments", icon: Wallet },
      { path: "/underwriting/annuity/batches", label: "Payment Batches", icon: CreditCard },
      { path: "/underwriting/annuity/deaths", label: "Death & Benefits", icon: Heart },
      { path: "/underwriting/annuity/products", label: "Rules & Factors", icon: Settings },
    ],
  },
  // {
  //   label: "General Bus",
  //   key: "general-bus",
  //   icon: Building2,
  //   items: [
  //     { path: "/underwriting/general-bus/fire", label: "Fire", icon: Flame },
  //     { path: "/underwriting/general-bus/motor", label: "Motor", icon: Car },
  //     { path: "/underwriting/renewals", label: "Renewals", icon: RefreshCw },
  //     { path: "/underwriting/endorsements", label: "Endorsements", icon: FilePen },
  //   ],
  // },
  // {
  //   label: "Package Bus",
  //   key: "package-bus",
  //   icon: Bus,
  //   items: [
  //     // If Package Bus should have items, add them here
  //     // If it should be a simple link without sub-items, you can modify the structure
  //     { path: "/underwriting/package-bus", label: "Package Bus", icon: Bus },
  //   ],
  // },
];

const UnderwritingSidebar = () => {
  const location = useLocation();

  // Auto-open the section that contains the current route
  const getDefaultOpen = () => {
    const active = sections.find((s) =>
      s.items.some((item) => {
        if (location.pathname.startsWith(item.path)) return true;
        if (item.subItems) {
          return item.subItems.some((sub: any) => location.pathname.startsWith(sub.path));
        }
        return false;
      })
    );
    return active ? active.key : null;
  };

  const [openSection, setOpenSection] = useState<string | null>(getDefaultOpen);
  const [openSubItems, setOpenSubItems] = useState<Record<string, boolean>>(() => {
    // Auto-open subItems that have active routes
    const initialOpen: Record<string, boolean> = {};
    sections.forEach(section => {
      section.items.forEach(item => {
        if (item.subItems) {
          const hasActive = item.subItems.some((sub: any) => 
            location.pathname.startsWith(sub.path)
          );
          if (hasActive) {
            initialOpen[item.path] = true;
          }
        }
      });
    });
    return initialOpen;
  });

  const toggle = (key: string) =>
    setOpenSection((prev) => (prev === key ? null : key));

  const toggleSubItems = (path: string) => {
    setOpenSubItems((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  // Check if any subItem is active
  const hasActiveSubItem = (item: any) => {
    if (!item.subItems) return false;
    return item.subItems.some((sub: any) => location.pathname.startsWith(sub.path));
  };

  // Calculate total items count including subItems for maxHeight
  const getTotalItemsCount = (items: any[]) => {
    let count = 0;
    items.forEach(item => {
      count++; // count the main item
      if (item.subItems) {
        // Check if this sub-menu should be expanded
        const isExpanded = openSubItems[item.path] || hasActiveSubItem(item);
        if (isExpanded) {
          count += item.subItems.length; // count all subItems if expanded
        }
      }
    });
    return count;
  };

  return (
   <aside
  className="fixed left-0 top-16 h-[calc(100vh-64px)] z-100 text-white flex-col overflow-y-auto md:w-52 hidden md:flex"
  style={{ backgroundColor: SIDEBAR_BG }}
>
      <nav className="flex-1 py-2 overflow-y-auto">
        {/* Overview — top-level link */}
        <NavLink
          to="/underwriting/overview"
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

        {/* Accordion sections */}
        {sections.map((section) => {
          const isOpen = openSection === section.key;
          const hasActive = section.items.some((item) => {
            if (location.pathname.startsWith(item.path)) return true;
            if (item.subItems) {
              return item.subItems.some((sub: any) => location.pathname.startsWith(sub.path));
            }
            return false;
          });
          const SectionIcon = section.icon;

          return (
            <div key={section.key}>
              {/* Section toggle button */}
              <button
                onClick={() => toggle(section.key)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-white/10 max-md:justify-center max-md:px-2"
                style={{
                  backgroundColor: isOpen || hasActive ? HOVER_BG : "transparent",
                  color: hasActive ? "white" : "rgba(255,255,255,0.85)",
                }}
              >
                <SectionIcon size={17} className="flex-shrink-0" />
                <span className="text-sm font-bold flex-1 max-md:hidden">
                  {section.label}
                </span>
                <ChevronDown
                  size={14}
                  className="max-md:hidden flex-shrink-0 transition-transform duration-200"
                  style={{
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    color: "rgba(255,255,255,0.5)",
                  }}
                />
              </button>

              {/* Dropdown sub-items with dynamic height */}
              <div
                style={{
                  maxHeight: isOpen ? `${getTotalItemsCount(section.items) * 48}px` : "0px",
                  overflow: "hidden",
                  transition: "max-height 0.3s ease-in-out",
                }}
              >
                {section.items.map((item) => {
                  const ItemIcon = item.icon;
                  const hasActiveSub = hasActiveSubItem(item);
                  const isSubOpen = openSubItems[item.path] || false;

                  // If item has subItems, render as expandable
                  if (item.subItems) {
                    return (
                      <div key={item.path}>
                        <button
                          onClick={() => toggleSubItems(item.path)}
                          className="flex items-center gap-3 py-2.5 pl-10 pr-4 w-full text-white/60 no-underline transition-all duration-150 hover:text-white hover:bg-white/10 max-md:justify-center max-md:pl-2 max-md:pr-2"
                          style={{
                            backgroundColor: hasActiveSub ? ACTIVE_BG : "transparent",
                            borderLeft: hasActiveSub ? "4px solid white" : "4px solid transparent",
                            color: hasActiveSub ? "white" : "rgba(255,255,255,0.6)",
                          }}
                        >
                          <ItemIcon size={14} className="flex-shrink-0" />
                          <span className="text-xs font-medium max-md:hidden leading-tight flex-1 text-left">
                            {item.label}
                          </span>
                          <ChevronDown
                            size={12}
                            className="max-md:hidden flex-shrink-0 transition-transform duration-200"
                            style={{
                              transform: isSubOpen || hasActiveSub ? "rotate(180deg)" : "rotate(0deg)",
                              color: "rgba(255,255,255,0.4)",
                            }}
                          />
                        </button>

                        {/* Sub-sub-items with dynamic height */}
                        <div
                          style={{
                            maxHeight: (isSubOpen || hasActiveSub) ? `${item.subItems.length * 40}px` : "0px",
                            overflow: "hidden",
                            transition: "max-height 0.3s ease-in-out",
                          }}
                        >
                          {item.subItems.map((subItem: any) => {
                            const SubIcon = subItem.icon;
                            return (
                              <NavLink
                                key={subItem.path}
                                to={subItem.path}
                                className="flex items-center gap-3 py-2 pl-14 pr-4 text-white/40 no-underline transition-all duration-150 border-l-4 border-transparent hover:text-white hover:bg-white/10 max-md:justify-center max-md:pl-2 max-md:pr-2"
                                style={({ isActive }) =>
                                  isActive
                                    ? { backgroundColor: ACTIVE_BG, borderLeftColor: "white", color: "white" }
                                    : {}
                                }
                              >
                                <SubIcon size={12} className="flex-shrink-0" />
                                <span className="text-[11px] font-medium max-md:hidden leading-tight">
                                  {subItem.label}
                                </span>
                              </NavLink>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // Regular item without subItems
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
                      <span className="text-xs font-medium max-md:hidden leading-tight">
                        {item.label}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default UnderwritingSidebar;