import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChevronDown,
  LayoutDashboard,
  User,
  Users,
  CreditCard,
  HeartHandshake,
  FileX,
  FileMinus,
  Skull,
  Cpu,
  FileCheck,
  ClipboardList,
  BadgeCheck,
  HelpCircle,
  Crosshair,
} from "lucide-react";

const SIDEBAR_BG = "#0d47a1";        // Dark blue
const ACTIVE_BG = "rgba(255,255,255,0.15)";
const HOVER_BG = "rgba(255,255,255,0.08)";

type SubItem = { label: string; path: string; icon: any };
type SectionItem =
  | (SubItem & { isGroup?: false })
  | { label: string; key: string; icon: any; isGroup: true; items: SubItem[] };

const sections: { label: string; key: string; icon: any; items: SectionItem[] }[] = [
  {
    label: "Individual",
    key: "individual",
    icon: User,
    items: [
      { label: "Maturity",           path: "/claims/individual/maturity",            icon: HeartHandshake },
      { label: "Death Benefit",      path: "/claims/individual/death-benefit",       icon: Crosshair },
      { label: "Surrender",          path: "/claims/individual/surrender",           icon: FileX },
      { label: "Partial Withdrawal", path: "/claims/individual/partial-withdrawal",  icon: FileMinus },
      {
        label: "Processing",
        key: "individual-processing",
        icon: Cpu,
        isGroup: true,
        items: [
          { label: "Offer",             path: "/claims/individual/processing/offer",            icon: FileCheck },
          { label: "Requisition",       path: "/claims/individual/processing/requisition",      icon: ClipboardList },
          { label: "Payment Approval",  path: "/claims/individual/processing/payment-approval", icon: BadgeCheck },
          { label: "Enquiries",         path: "/claims/individual/processing/enquiries",        icon: HelpCircle },
        ],
      },
    ],
  },
  {
    label: "Group Life",
    key: "group-life",
    icon: Users,
    items: [
      { label: "Death Claim", path: "/claims/group-life/death-claim", icon: Skull },
      {
        label: "Processing",
        key: "group-life-processing",
        icon: Cpu,
        isGroup: true,
        items: [
          { label: "Offer",             path: "/claims/group-life/processing/offer",            icon: FileCheck },
          { label: "Requisition",       path: "/claims/group-life/processing/requisition",      icon: ClipboardList },
          { label: "Payment Approval",  path: "/claims/group-life/processing/payment-approval", icon: BadgeCheck },
          { label: "Enquiries",         path: "/claims/group-life/processing/enquiries",        icon: HelpCircle },
        ],
      },
    ],
  },
  {
    label: "Credit Life",
    key: "credit-life",
    icon: CreditCard,
    items: [
      { label: "Death Claim", path: "/claims/credit-life/death-claim", icon: Skull },
      {
        label: "Processing",
        key: "credit-life-processing",
        icon: Cpu,
        isGroup: true,
        items: [
          { label: "Offer",             path: "/claims/credit-life/processing/offer",            icon: FileCheck },
          { label: "Requisition",       path: "/claims/credit-life/processing/requisition",      icon: ClipboardList },
          { label: "Payment Approval",  path: "/claims/credit-life/processing/payment-approval", icon: BadgeCheck },
          { label: "Enquiries",         path: "/claims/credit-life/processing/enquiries",        icon: HelpCircle },
        ],
      },
    ],
  },
];

const ClaimsSidebar = () => {
  const location = useLocation();
  const path = location.pathname;

  const getDefaultSection = () => {
    return sections.find((s) =>
      s.items.some((item) =>
        item.isGroup
          ? item.items.some((sub) => path.startsWith(sub.path))
          : path.startsWith(item.path)
      )
    )?.key ?? null;
  };

  const getDefaultSubGroup = () => {
    for (const s of sections) {
      for (const item of s.items) {
        if (item.isGroup && item.items.some((sub) => path.startsWith(sub.path))) {
          return item.key;
        }
      }
    }
    return null;
  };

  const [openSection, setOpenSection] = useState<string | null>(getDefaultSection);
  const [openSubGroup, setOpenSubGroup] = useState<string | null>(getDefaultSubGroup);

  const toggleSection = (key: string) =>
    setOpenSection((prev) => (prev === key ? null : key));

  const toggleSubGroup = (key: string) =>
    setOpenSubGroup((prev) => (prev === key ? null : key));

  return (
    <aside
      className="fixed left-0 top-16 h-[calc(100vh-64px)] z-100 text-white flex flex-col overflow-y-auto md:w-52 max-md:w-16"
      style={{ backgroundColor: SIDEBAR_BG }}
    >

      <nav className="flex-1 py-2 overflow-y-auto">
        {/* Overview */}
        <NavLink
          to="/claims/overview"
          className="flex items-center gap-3 px-4 py-3 text-white/80 no-underline transition-all duration-150 border-l-4 border-transparent hover:bg-white/10 hover:text-white max-md:justify-center max-md:px-2"
          style={({ isActive }) =>
            isActive ? { backgroundColor: ACTIVE_BG, borderLeftColor: "white", color: "white" } : {}
          }
        >
          <LayoutDashboard size={17} className="flex-shrink-0" />
          <span className="text-sm font-bold max-md:hidden">Overview</span>
        </NavLink>

        <div className="mx-4 my-2 border-t border-white/10" />

        {/* Sections */}
        {sections.map((section) => {
          const isOpen = openSection === section.key;
          const hasActive = section.items.some((item) =>
            item.isGroup
              ? item.items.some((sub) => path.startsWith(sub.path))
              : path.startsWith(item.path)
          );
          const SectionIcon = section.icon;

          return (
            <div key={section.key}>
              {/* Section header button */}
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-white/10 max-md:justify-center max-md:px-2"
                style={{
                  backgroundColor: isOpen || hasActive ? HOVER_BG : "transparent",
                  color: hasActive ? "white" : "rgba(255,255,255,0.85)",
                }}
              >
                <SectionIcon size={17} className="flex-shrink-0" />
                <span className="text-sm font-bold flex-1 max-md:hidden">{section.label}</span>
                <ChevronDown
                  size={14}
                  className="max-md:hidden flex-shrink-0 transition-transform duration-200"
                  style={{
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    color: "rgba(255,255,255,0.5)",
                  }}
                />
              </button>

              {/* Section items */}
              <div
                style={{
                  maxHeight: isOpen ? "600px" : "0px",
                  overflow: "hidden",
                  transition: "max-height 0.3s ease-in-out",
                }}
              >
                {section.items.map((item) => {
                  if (item.isGroup) {
                    // Processing sub-group
                    const isSubOpen = openSubGroup === item.key;
                    const subHasActive = item.items.some((sub) => path.startsWith(sub.path));
                    const GroupIcon = item.icon;

                    return (
                      <div key={item.key}>
                        <button
                          onClick={() => toggleSubGroup(item.key)}
                          className="w-full flex items-center gap-3 pl-8 pr-4 py-2.5 text-left transition-all duration-200 hover:bg-white/10 max-md:justify-center max-md:px-2"
                          style={{
                            backgroundColor: isSubOpen || subHasActive ? HOVER_BG : "transparent",
                            color: subHasActive ? "white" : "rgba(255,255,255,0.7)",
                          }}
                        >
                          <GroupIcon size={14} className="flex-shrink-0" />
                          <span className="text-xs font-bold flex-1 max-md:hidden">{item.label}</span>
                          <ChevronDown
                            size={12}
                            className="max-md:hidden flex-shrink-0 transition-transform duration-200"
                            style={{
                              transform: isSubOpen ? "rotate(180deg)" : "rotate(0deg)",
                              color: "rgba(255,255,255,0.4)",
                            }}
                          />
                        </button>

                        {/* Processing sub-items */}
                        <div
                          style={{
                            maxHeight: isSubOpen ? `${item.items.length * 40}px` : "0px",
                            overflow: "hidden",
                            transition: "max-height 0.2s ease-in-out",
                          }}
                        >
                          {item.items.map((sub) => {
                            const SubIcon = sub.icon;
                            return (
                              <NavLink
                                key={sub.path}
                                to={sub.path}
                                className="flex items-center gap-2 py-2 pl-12 pr-4 text-white/55 no-underline transition-all duration-150 border-l-4 border-transparent hover:text-white hover:bg-white/10 max-md:justify-center max-md:pl-2 max-md:pr-2"
                                style={({ isActive }) =>
                                  isActive
                                    ? { backgroundColor: ACTIVE_BG, borderLeftColor: "white", color: "white" }
                                    : {}
                                }
                              >
                                <SubIcon size={12} className="flex-shrink-0" />
                                <span className="text-xs font-medium max-md:hidden">{sub.label}</span>
                              </NavLink>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // Regular item
                  const ItemIcon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className="flex items-center gap-3 py-2.5 pl-8 pr-4 text-white/65 no-underline transition-all duration-150 border-l-4 border-transparent hover:text-white hover:bg-white/10 max-md:justify-center max-md:pl-2 max-md:pr-2"
                      style={({ isActive }) =>
                        isActive
                          ? { backgroundColor: ACTIVE_BG, borderLeftColor: "white", color: "white" }
                          : {}
                      }
                    >
                      <ItemIcon size={14} className="flex-shrink-0" />
                      <span className="text-xs font-medium max-md:hidden">{item.label}</span>
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

export default ClaimsSidebar;