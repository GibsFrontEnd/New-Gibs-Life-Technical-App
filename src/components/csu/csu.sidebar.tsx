import { Link, useLocation } from "react-router-dom";

const CSUSidebar = () => {
  const location = useLocation();
  const menuItems = [
    { path: "enquiries", label: "Enquiries", icon: "🔒" },
    { path: "customers", label: "Customers", icon: "📦" },
    { path: "partners", label: "Partners", icon: "⚡" },
    { path: "messaging", label: "Messaging", icon: "⚙️" },
    { path: "tickets", label: "Tickets", icon: "🎫" },
  ];

  // helper to check active even for nested routes (e.g. /enquiries/123)
  const isActive = (itemPath: string) =>
    location.pathname === `/${itemPath}` ||
    location.pathname.startsWith(`/${itemPath}/`);

  return (
   <aside
  className="
    fixed left-0 top-0 bottom-0 z-100
    bg-gradient-to-b from-slate-800 to-blue-900 text-white
    flex flex-col
    overflow-y-auto
    md:w-52 max-md:w-15
  "
>
      <div className="font-bold text-lg pt-5 pl-3 pb-8">
        GIBSLIFE ENTERPRISE 7
      </div>
      <nav className="flex-1 py-2.5">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center py-3 px-5 text-white/80 no-underline transition-all duration-200 border-l-4 border-transparent hover:bg-white/10 hover:text-white max-md:justify-center max-md:py-4 max-md:px-2.5 ${
              isActive(item.path)
                ? "bg-white/15 text-white border-l-orange-500"
                : ""
            }`}
          >
            <span className="mr-3 text-base max-md:mr-0">{item.icon}</span>
            <span className="text-sm font-medium max-md:hidden">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default CSUSidebar;
