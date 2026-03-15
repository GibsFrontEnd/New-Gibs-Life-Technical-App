import { NavLink } from "react-router-dom";

const basePath = "/underwriting";

const menuItems = [
  { path: "overview", label: "Overview", icon: "📊" },
  { path: "investment-link", label: "Investment Link Schemes", icon: "💼" },
  { path: "traditional", label: "Traditional Schemes", icon: "📜" },
  { path: "group-life", label: "Group Life Schemes", icon: "👥" },
  { path: "credit-life", label: "Credit Life Schemes", icon: "💳" },
  { path: "health", label: "Health Ins Schemes", icon: "💊" },
];

const UnderwritingSidebar = () => {
  return (
    <aside className="fixed left-0 top-0 bottom-0 z-100 bg-primary text-white flex flex-col overflow-y-auto md:w-52 max-md:w-15">
      <div className="font-bold text-lg pt-5 pl-3 pb-8">
        GIBSLIFE ENTERPRISE 7
      </div>
      <nav className="flex-1 py-2.5">
        {menuItems.map((item) => {
          const link = `${basePath}/${item.path}`;

          return (
            <NavLink
              key={item.path}
              to={link}
              className={({ isActive }) =>
                `flex items-center py-3 px-5 text-white/80 no-underline transition-all duration-200 border-l-4 border-transparent hover:bg-white/10 hover:text-white max-md:justify-center max-md:py-4 max-md:px-2.5 ${
                  isActive ? "bg-white/15 text-white border-l-orange-500" : ""
                }`
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

export default UnderwritingSidebar;
