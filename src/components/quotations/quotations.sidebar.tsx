import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChevronDown,
  LayoutDashboard,
  FileInput,
  TrendingUp,
  Scroll,
} from "lucide-react";

const SIDEBAR_BG = "#0d47a1";        // Dark blue
const ACTIVE_BG = "rgba(255,255,255,0.15)";
const HOVER_BG = "rgba(255,255,255,0.08)";

const sections = [
  {
    label: "Quotes",
    key: "quotes",
    icon: FileInput,
    items: [
      { label: "Investment Link Quotes", path: "/quotations/investment-link-quotes", icon: TrendingUp },
      { label: "Traditional Quotes",     path: "/quotations/traditional-quotes",     icon: Scroll },
      
    ],
  },
];

const QuotationsSidebar = () => {
  const location = useLocation();
  const path = location.pathname;

  const getDefaultOpen = () =>
    sections.find((s) => s.items.some((item) => path.startsWith(item.path)))?.key ?? "quotes";

  const [openSection, setOpenSection] = useState<string | null>(getDefaultOpen);

  const toggle = (key: string) =>
    setOpenSection((prev) => (prev === key ? null : key));

  return (
    <div className="max-md:hidden">
      <aside
        className="fixed left-0 top-16 h-[calc(100vh-64px)] z-100 text-white flex flex-col overflow-y-auto md:w-52 max-md:w-16"
        style={{ backgroundColor: SIDEBAR_BG }}
      >
        {/* Brand */}
        
        <div className="font-bold text-sm pt-5 pb-4 text-center border-b border-white/10 md:hidden">G</div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {/* Overview */}
          <NavLink
            to="/quotations/overview"
            className="flex items-center gap-3 px-4 py-3 text-white/80 no-underline transition-all duration-150 border-l-4 border-transparent hover:bg-white/10 hover:text-white max-md:justify-center max-md:px-2"
            style={({ isActive }) =>
              isActive ? { backgroundColor: ACTIVE_BG, borderLeftColor: "white", color: "white" } : {}
            }
          >
            <LayoutDashboard size={17} className="flex-shrink-0" />
            <span className="text-sm font-bold max-md:hidden">Overview</span>
          </NavLink>

          <div className="mx-4 my-2 border-t border-white/10" />

          {/* Accordion sections */}
          {sections.map((section) => {
            const isOpen = openSection === section.key;
            const hasActive = section.items.some((item) => path.startsWith(item.path));
            const SectionIcon = section.icon;

            return (
              <div key={section.key}>
                {/* Section toggle */}
                <button
                  onClick={() => toggle(section.key)}
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

                {/* Sub-items */}
                <div
                  style={{
                    maxHeight: isOpen ? `${section.items.length * 44}px` : "0px",
                    overflow: "hidden",
                    transition: "max-height 0.25s ease-in-out",
                  }}
                >
                  {section.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className="flex items-center gap-3 py-2.5 pl-10 pr-4 text-white/65 no-underline transition-all duration-150 border-l-4 border-transparent hover:text-white hover:bg-white/10 max-md:justify-center max-md:pl-2 max-md:pr-2"
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
    </div>
  );
};

export default QuotationsSidebar;