//@ts-nocheck
import { Link, useLocation } from "react-router-dom";

const SIDEBAR_BG = "#0d47a1";        // Dark blue
const ACTIVE_BG = "rgba(255,255,255,0.15)";
const HOVER_BG = "rgba(255,255,255,0.08)";

const AdminSidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: "", label: "Overview", icon: "📊" },
    { path: "company", label: "Company", icon: "⚙️" },
    { path: "security", label: "Security", icon: "🔒" },
  ];
  const isActive = (itemPath: string) =>
    location.pathname === `/${itemPath}` ||
    location.pathname.startsWith(`/${itemPath}/`);

  return (
    <div className="max-md:hidden">
      <aside
        className="fixed left-0 top-16 h-[calc(100vh-64px)] z-100 text-white flex flex-col overflow-y-auto md:w-52 max-md:w-15"
        style={{ backgroundColor: SIDEBAR_BG }}
      >
       
        <nav className="flex-1 py-2.5">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center py-3 px-5 text-white/80 no-underline transition-all duration-200 border-l-3 border-transparent hover:bg-white/10 hover:text-white max-md:justify-center max-md:py-4 max-md:px-2.5"
              style={
                isActive(item.path)
                  ? { backgroundColor: ACTIVE_BG, borderLeftColor: "white" }
                  : {}
              }
            >
              <span className="mr-3 text-base max-md:mr-0">{item.icon}</span>
              <span className="text-sm font-medium max-md:hidden">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );
};

export default AdminSidebar;