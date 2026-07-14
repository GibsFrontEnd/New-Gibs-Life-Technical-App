import { NavLink } from "react-router-dom";

const basePath = "/reinsurance";

const SIDEBAR_BG = "#0d47a1";        // Dark blue
const ACTIVE_BG = "rgba(255,255,255,0.15)";


const menuItems = [
  { path: "overview", label: "Overview", icon: "📊" },
];

const ReinsuranceSidebar = () => {
  return (
    <aside
  className="fixed left-0 top-16 h-[calc(100vh-64px)] z-100 text-white flex-col overflow-y-auto md:w-52 hidden md:flex"
  style={{ backgroundColor: SIDEBAR_BG }}
>
      <nav className="flex-1 py-2.5">
        {menuItems.map((item) => {
          const link = `${basePath}/${item.path}`;
          return (
            <NavLink
              key={item.path}
              to={link}
              className="flex items-center py-3 px-5 text-white/80 no-underline transition-all duration-200 border-l-4 border-transparent hover:bg-white/10 hover:text-white max-md:justify-center max-md:py-4 max-md:px-2.5"
              style={({ isActive }) =>
                isActive
                  ? { backgroundColor: ACTIVE_BG, borderLeftColor: "white", color: "white" }
                  : {}
              }
              end={item.path === "overview"}
            >
              <span className="mr-3 text-base max-md:mr-0">{item.icon}</span>
              <span className="text-sm font-medium max-md:hidden">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default ReinsuranceSidebar;