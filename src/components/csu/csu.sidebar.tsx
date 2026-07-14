import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Handshake } from "lucide-react";

const SIDEBAR_BG = "#0d47a1";        // Dark blue
const ACTIVE_BG = "rgba(255,255,255,0.15)";


const CSUSidebar = () => {
  const location = useLocation();
  const menuItems = [
    { path: "/csu/overview", label: "Overview", icon: LayoutDashboard },
    { path: "/csu/customers", label: "Customers", icon: Users },
    { path: "/csu/partners", label: "Partners", icon: Handshake },
    // Hidden for now — restore when ready
    // { path: "/csu/agency", label: "Agency", icon: Building2 },
    // { path: "/csu/manager", label: "Manager", icon: UserCog },
    // { path: "/csu/enquiries", label: "Enquiries", icon: HelpCircle },
    // { path: "/csu/messaging", label: "Messaging", icon: MessageSquare },
    // { path: "/csu/tickets", label: "Tickets", icon: Ticket },
  ];

  // helper to check active even for nested routes
  const isActive = (itemPath: string) =>
    location.pathname === itemPath ||
    location.pathname.startsWith(`${itemPath}/`);

  return (
   <aside
  className="fixed left-0 top-16 h-[calc(100vh-64px)] z-100 text-white flex-col overflow-y-auto md:w-52 hidden md:flex"
  style={{ backgroundColor: SIDEBAR_BG }}
>
      {/* Brand */}
      
     

      <nav className="flex-1 py-2.5">
        {menuItems.map((item, index) => {
          const ItemIcon = item.icon;
          return (
            <div key={item.path}>
              <Link
                to={item.path}
                className="flex items-center gap-3 py-3 px-5 text-white/80 no-underline transition-all duration-200 border-l-4 border-transparent hover:bg-white/10 hover:text-white max-md:justify-center max-md:gap-0 max-md:py-4 max-md:px-2.5"
                style={
                  isActive(item.path)
                    ? { backgroundColor: ACTIVE_BG, borderLeftColor: "white", color: "white" }
                    : {}
                }
              >
                <ItemIcon size={17} className="flex-shrink-0" />
                <span className="text-sm font-bold max-md:hidden">
                  {item.label}
                </span>
              </Link>

              {/* Divider under Overview, matching other sidebars */}
              {index === 0 && <div className="mx-4 my-2 border-t border-white/10" />}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default CSUSidebar;
