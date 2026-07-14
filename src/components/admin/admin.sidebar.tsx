//@ts-nocheck
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Building2, 
  Lock, 
  Settings, 
  ChevronDown,
  Grid,
  Layers,
  FileText,
  Package,
  Shield,
  Users,
  GitBranch,
  Percent,
  TrendingUp,
  BarChart,
  Heart,
  Hospital,
  Circle
} from "lucide-react";

const SIDEBAR_BG = "#0d47a1";        // Dark blue
const ACTIVE_BG = "rgba(255,255,255,0.15)";
const HOVER_BG = "rgba(255,255,255,0.08)";

const AdminSidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: "", label: "Overview", icon: LayoutDashboard },
    { path: "company", label: "Company", icon: Building2 },
    { path: "security", label: "Security", icon: Lock },
    { 
      path: "configurations", 
      label: "Configurations", 
      icon: Settings,
      isCategory: true,
      subItems: [
        { path: "configurations/product-main-class", label: "Product Main Class", icon: Grid },
        { path: "configurations/product-lines", label: "Product Lines", icon: Layers },
        { path: "configurations/product-settings", label: "Product Settings", icon: Package },
        { path: "configurations/product-sections", label: "Product Sections", icon: FileText },
        { path: "configurations/product-covers", label: "Product Covers", icon: Shield },
        { path: "configurations/product-smi", label: "Product SMI", icon: BarChart },
        { path: "configurations/bus-channel", label: "Bus Channel", icon: GitBranch },
        { path: "configurations/sub-channel", label: "Sub Channel", icon: Users },
        { path: "configurations/commission-rates", label: "Commission Rates", icon: Percent },
        { path: "configurations/interest-rates", label: "Interest Rates", icon: TrendingUp },
        { path: "configurations/premium-rates", label: "Premium Rates", icon: Percent },
        { path: "configurations/allocation-rates", label: "Allocation Rates", icon: BarChart },
        { path: "configurations/medical-test", label: "Medical Test", icon: Heart },
        { path: "configurations/test-distribution", label: "Test Distribution", icon: Circle },
        { path: "configurations/medical-hospital", label: "Medical Hospital", icon: Hospital },
      ]
    },
  ];

  const [openDropdown, setOpenDropdown] = useState<string | null>(() => {
    const hasActiveSub = menuItems.some(item => {
      if (item.subItems) {
        return item.subItems.some((sub: any) => 
          location.pathname.startsWith(`/admin/${sub.path}`)
        );
      }
      return false;
    });
    return hasActiveSub ? "configurations" : null;
  });

  const toggleDropdown = (path: string) => {
    setOpenDropdown(prev => prev === path ? null : path);
  };

  const isActive = (itemPath: string) => {
    if (itemPath === "") {
      return location.pathname === "/admin";
    }
    return location.pathname === `/admin/${itemPath}` ||
           location.pathname.startsWith(`/admin/${itemPath}/`);
  };

  const hasActiveSubItem = (subItems: any[]) => {
    return subItems.some((sub: any) => 
      location.pathname.startsWith(`/admin/${sub.path}`)
    );
  };

  return (
    <aside
      className="fixed left-0 top-16 h-[calc(100vh-64px)] z-100 text-white flex-col overflow-y-auto md:w-52 hidden md:flex"
      style={{ backgroundColor: SIDEBAR_BG }}
    >
      <nav className="flex-1 py-2.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const path = item.path ? `/admin/${item.path}` : "/admin";
          const isItemActive = isActive(item.path);
          const isOpen = openDropdown === item.path;
          const hasActiveSub = item.subItems && hasActiveSubItem(item.subItems);
          const isCategory = item.isCategory || false;

          if (item.subItems) {
            return (
              <div key={item.path}>
                <button
                  onClick={() => toggleDropdown(item.path)}
                  className="w-full flex items-center gap-3 py-3 px-4 text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white"
                  style={{
                    backgroundColor: (isOpen || hasActiveSub) ? HOVER_BG : "transparent",
                    borderLeft: (isOpen || hasActiveSub) ? "3px solid white" : "3px solid transparent",
                    cursor: isCategory ? "pointer" : "pointer",
                  }}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span className="text-sm font-medium flex-1 text-left">
                    {item.label}
                  </span>
                  <ChevronDown
                    size={14}
                    className="flex-shrink-0 transition-transform duration-200"
                    style={{
                      transform: (isOpen || hasActiveSub) ? "rotate(180deg)" : "rotate(0deg)",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  />
                </button>

                <div
                  style={{
                    maxHeight: (isOpen || hasActiveSub) ? `${item.subItems.length * 40}px` : "0px",
                    overflow: "hidden",
                    transition: "max-height 0.3s ease-in-out",
                  }}
                >
                  {item.subItems.map((subItem: any) => {
                    const SubIcon = subItem.icon || Circle;
                    const subPath = `/admin/${subItem.path}`;
                    const isSubActive = location.pathname.startsWith(subPath);

                    return (
                      <Link
                        key={subItem.path}
                        to={subPath}
                        className="flex items-center gap-3 py-2 pl-10 pr-4 text-white/40 no-underline transition-all duration-150 border-l-3 border-transparent hover:text-white hover:bg-white/10"
                        style={
                          isSubActive
                            ? { backgroundColor: ACTIVE_BG, borderLeftColor: "white", color: "white" }
                            : {}
                        }
                      >
                        <SubIcon size={14} className="flex-shrink-0" />
                        <span className="text-xs font-medium leading-tight">
                          {subItem.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              to={path}
              className="flex items-center gap-3 py-3 px-4 text-white/80 no-underline transition-all duration-200 border-l-3 border-transparent hover:bg-white/10 hover:text-white"
              style={
                isItemActive
                  ? { backgroundColor: ACTIVE_BG, borderLeftColor: "white" }
                  : {}
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="text-sm font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;