// @ts-nocheck

import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X, ChevronDown,ChevronRight, LogOut } from "lucide-react";
import Button from "../UI/Button";
import logoImage from "../../assets/logo.jpg";

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Sanitize user data for logging
  const sanitizeUserData = (userData: any) => {
    if (!userData) return null;
    
    try {
      const sanitized = { ...userData };
      
      // Remove or mask sensitive fields
      if (sanitized.token) {
        sanitized.token = '[JWT_TOKEN_REDACTED]';
      }
      
      if (sanitized.user) {
        sanitized.user = {
          ...sanitized.user,
          // Keep non-sensitive user info but remove sensitive ones
          id: sanitized.user.id,
          username: sanitized.user.username,
          firstName: sanitized.user.firstName,
          lastName: sanitized.user.lastName,
          email: '[EMAIL_REDACTED]',
          roles: sanitized.user.roles,
          permissions: sanitized.user.permissions,
        };
      }
      
      return sanitized;
    } catch (error) {
      return { error: 'Failed to sanitize user data' };
    }
  };

  // Get user role from localStorage
  useEffect(() => {
    const getUserRole = () => {
      try {
        const userData = localStorage.getItem("unEncryptedUser");

        if (userData) {
          const user = JSON.parse(userData);
          
          // Sanitize before logging
          if (import.meta.env.DEV) {
            const sanitizedData = sanitizeUserData(user);
            console.log("🔍 Header - Sanitized userData:", sanitizedData);
          }

          let role = user.userType || user.roles?.[0] || user.role || "agent";
          role = role.toLowerCase().trim();
          if (import.meta.env.DEV) {
            console.log("👤 Header - Detected user role:", role);
          }
          return role;
        }

        const storedRole = localStorage.getItem("userRole");
        if (storedRole) {
          if (import.meta.env.DEV) {
            console.log("👤 Header - Using stored userRole:", storedRole);
          }
          return storedRole.toLowerCase().trim();
        }

        if (import.meta.env.DEV) {
          console.log("⚠️ Header - No user role found, defaulting to agent");
        }
        return "agent";
      } catch (error) {
        console.error("❌ Header - Error parsing user data:", error);
        return "agent";
      }
    };

    const role = getUserRole();
    setUserRole(role);
  }, []);

  // Dropdown menu items for Quotations
  const quotationItems = [
    { path: "/quotations/overview", label: "Overview", icon: "📊" },
    { path: "/quotations/investment-link", label: "Investment Link Quotes", icon: "💼" },
    { path: "/quotations/traditional", label: "Traditional Quotes", icon: "📜" },
    { path: "/quotations/group-life", label: "Group Life Quotes", icon: "🏢" },
    { path: "/quotations/credit-life", label: "Credit Life Quotes", icon: "💳" },
  ];

  // Dropdown menu items for Proposals
  const proposalItems = [
    { path: "/proposals/overview", label: "Overview", icon: "📊" },
    { path: "/proposals/investment-link", label: "Investment Link Schemes", icon: "💼" },
    { path: "/proposals/traditional", label: "Traditional Schemes", icon: "💼" },
    { path: "/proposals/policy-history", label: "Policy History", icon: "📜" },
  ];

  // Dropdown menu items for Admin
  const adminItems = [
    { path: "/admin", label: "Overview", icon: "📊" },
    { path: "/admin/company", label: "Company", icon: "⚙️" },
    { path: "/admin/security", label: "Security", icon: "🔒" },
  ];

  const navItems = [
    {
      title: "Home",
      link: "/dashboard",
      hidden: false,
      roles: ["admin", "user", "agent", "customer"],
    },
    { title: "CSU", link: "/csu", hidden: true, roles: ["admin"] },
    {
      title: "Quotations",
      link: "/quotations",
      hidden: false,
      roles: ["admin", "agent", "user"],
      hasDropdown: true,
      dropdownItems: quotationItems
    },
    {
      title: "Proposals",
      link: "/proposals",
      hidden: false,
      roles: ["admin", "agent", "user"],
      hasDropdown: true,
      dropdownItems: proposalItems
    },
    {
      title: "Underwriting",
      link: "/underwriting",
      hidden: true,
      roles: ["admin"],
    },
    { title: "Claims", link: "/claims", hidden: true, roles: ["admin"] },
    {
      title: "ReInsurance",
      link: "/reinsurance",
      hidden: true,
      roles: ["admin"],
    },
    {
      title: "Requisition Accounts",
      link: "/requisition-accounts",
      hidden: true,
      roles: ["admin"],
    },
    { title: "Reports", link: "/reports", hidden: true, roles: ["admin"] },
    { 
      title: "Admin", 
      link: "/admin", 
      hidden: false, 
      roles: ["admin", "user"],
      hasDropdown: true,
      dropdownItems: adminItems
    },
  ];

  // Filter navigation items based on user role
  const visibleNavItems = navItems.filter((item) => {
    if (item.hidden) return false;
    if (!userRole) return false;
    const hasAccess = item.roles.includes(userRole);
    return hasAccess;
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("agentId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    localStorage.removeItem("unEncryptedUser");
    window.location.href = "/login";
  };

  const toggleDropdown = (title: string) => {
    setOpenDropdown(openDropdown === title ? null : title);
  };

  if (!userRole) {
    return (
      <header
        className="bg-white border-b border-gray-200 px-5 flex items-center justify-between h-16 shadow w-[87%] ml-auto"
        style={{ backgroundColor: "#93c5fd" }}
      >
        <div>Loading...</div>
      </header>
    );
  }

  return (
    <header
      className="bg-white border-b border-gray-200 px-5 flex items-center justify-between h-16 shadow w-full relative"
      style={{ backgroundColor: "#155dfd" }}
    >
      {/* Logo added here */}
      <div className="flex items-center gap-4">
        <img 
          src={logoImage} 
          alt="GIBSLIFE Logo" 
          className="w-17 h-10 rounded-lg"
        />
        <nav className="hidden xl:flex items-center gap-0 pl-10">
          {visibleNavItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.link}
              className={({ isActive }) =>
                `px-4 py-2 bg-transparent border-none text-white text-sm font-medium cursor-pointer transition-all duration-200 ease-in-out border-b-2 border-transparent hover:text-[#e0e7ff] hover:bg-[#0b46d4] ${
                  isActive ? "text-blue-600 border-b-blue-600" : ""
                }`
              }
            >
              {item.title}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Desktop Logout Button - Hidden on mobile */}
        <div className="hidden xl:block">
          <Button onClick={handleLogout} variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
            Logout
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="block xl:hidden w-fit p-2 text-white hover:text-gray-200"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
    <div
  className={`fixed top-0 right-0 h-full w-72 bg-gradient-to-b from-blue-50 to-white shadow-xl transform transition-all duration-300 ease-in-out z-50 ${
    menuOpen ? "translate-x-0" : "translate-x-full"
  }`}
>
  {/* Header with gradient */}
  <div className="flex justify-between items-center p-5 h-[70px] bg-gradient-to-r from-blue-600 to-blue-800 shadow-md">
    <div className="flex items-center gap-3">
      <img 
        src={logoImage} 
        alt="GIBSLIFE Logo" 
        className="w-9 h-9 rounded-lg ring-2 ring-white/30"
      />
      <div>
        <h2 className="font-bold text-white text-lg">Menu</h2>
        <p className="text-xs text-blue-100 opacity-90 capitalize">({userRole})</p>
      </div>
    </div>
    <button 
      onClick={() => setMenuOpen(false)}
      className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
    >
      <X size={22} className="text-white" />
    </button>
  </div>
  
  {/* Navigation with scrollable area */}
  <nav className="flex flex-col h-[calc(100%-70px)]">
    <div className="flex-1 overflow-y-auto p-4 space-y-1">
      {visibleNavItems.map((item, index) => (
        <div key={index} className="mb-1">
          {item.hasDropdown ? (
            <div className="mb-1">
              <button
                onClick={() => toggleDropdown(item.title)}
                className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-gray-800 hover:bg-blue-50 transition-all duration-200 group border border-transparent hover:border-blue-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <span className="text-blue-600 text-sm">📋</span>
                  </div>
                  <span className="font-medium text-sm">{item.title}</span>
                </div>
                <ChevronDown 
                  size={18} 
                  className={`transition-all duration-300 text-blue-500 ${
                    openDropdown === item.title ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {openDropdown === item.title && (
                <div className="ml-10 mt-1 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  {item.dropdownItems.map((dropdownItem, idx) => (
                    <NavLink
                      key={idx}
                      to={dropdownItem.path}
                      onClick={() => {
                        setMenuOpen(false);
                        setOpenDropdown(null);
                      }}
                      className={({ isActive }) =>
                        `flex items-center px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                          isActive 
                            ? "bg-blue-100 text-blue-700 border-l-4 border-blue-500" 
                            : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className={`mr-3 text-base ${openDropdown === item.title ? 'animate-bounce' : ''}`}>
                            {dropdownItem.icon}
                          </span>
                          <span className="font-medium">{dropdownItem.label}</span>
                          {isActive && (
                            <div className="ml-auto w-2 h-2 rounded-full bg-blue-500"></div>
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <NavLink
              to={item.link}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md" 
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isActive ? 'bg-white/20' : 'bg-blue-100 group-hover:bg-blue-200'
                  }`}>
                    <span className={isActive ? 'text-white' : 'text-blue-600'}>
                      {item.title === "Home" ? "🏠" : 
                       item.title === "CSU" ? "⚙️" :
                       item.title === "Quotations" ? "📋" :
                       item.title === "Proposals" ? "📄" :
                       item.title === "Underwriting" ? "✍️" :
                       item.title === "Claims" ? "⚖️" :
                       item.title === "ReInsurance" ? "🔄" :
                       item.title === "Requisition Accounts" ? "💰" :
                       item.title === "Reports" ? "📊" :
                       item.title === "Admin" ? "👨‍💼" : "📌"}
                    </span>
                  </div>
                  <span className="font-medium text-sm">{item.title}</span>
                  {isActive && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </>
              )}
            </NavLink>
          )}
        </div>
      ))}
    </div>
    
    {/* Logout Button - Bottom of mobile menu */}
    <div className="p-4 mb-8 border-t border-blue-100 bg-gradient-to-r from-blue-50 to-white">
      <button
        onClick={() => {
          handleLogout();
          setMenuOpen(false);
        }}
        className="flex items-center justify-center w-full px-4 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-md hover:shadow-lg font-semibold group"
      >
        <div className="mr-3 p-1 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
          <LogOut size={18} className="text-white" />
        </div>
        Logout
        <ChevronRight size={18} className="ml-auto opacity-70" />
      </button>
      
      {/* User info footer */}
      <div className="mt-3 pt-3 border-t border-blue-100">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
            {userRole.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <p className="text-xs text-gray-600">Signed in as</p>
            <p className="text-sm font-medium text-blue-700 capitalize">{userRole}</p>
          </div>
        </div>
      </div>
    </div>
  </nav>
</div>

{/* Backdrop overlay */}
{menuOpen && (
  <div 
    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
    onClick={() => setMenuOpen(false)}
  />
)}
{/* Backdrop overlay */}
{menuOpen && (
  <div 
    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
    onClick={() => setMenuOpen(false)}
  />
)}

      {/* Close dropdown when clicking outside */}
      {openDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </header>
  );
};

export default Header;