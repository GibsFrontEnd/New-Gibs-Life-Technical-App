import { NavLink } from "react-router-dom";

const basePath = "/quotations";

const menuItems = [
  { path: "overview", label: "Overview", icon: "📊" },
  { path: "investment-link", label: "Investment Link Quotes", icon: "💼" },
  { path: "traditional", label: "Traditional Quotes", icon: "📜" },
  { path: "group-life", label: "Group Life Quotes", icon: "🏢" },
  { path: "credit-life", label: "Credit Life Quotes", icon: "💳" },
];

const QuotationsSidebar = () => {
  return (
    <div className="max-md:hidden">
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] z-100 bg-blue-900 text-white flex flex-col overflow-y-auto md:w-52 max-md:w-16 ">
      <div className="font-bold text-lg pt-5 pl-3 pb-8 max-md:text-center max-md:pl-0 max-md:text-sm">
        <span className="max-md:hidden">GIBSLIFE ENTERPRISE</span>
        <span className="md:hidden">G</span>
      </div>
      <nav className="flex-1 py-2.5">
        {menuItems.map((item) => {
          const link = `${basePath}/${item.path}`;

          return (
            <NavLink
              key={item.path}
              to={link}
              className={({ isActive }) =>
                `flex items-center py-3 px-5 text-white/80 no-underline transition-all duration-200 border-l-4 border-transparent hover:bg-white/10 hover:text-white max-md:justify-center max-md:py-4 max-md:px-0 ${
                  isActive ? "bg-blue-500/15 text-white border-l-blue-300" : ""
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
    </div>
  );
};

export default QuotationsSidebar;