// @ts-nocheck
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { 
  Menu, X, ChevronDown, LogOut, Home, 
  Settings, FileText, PenTool, Scale, RefreshCw, 
  BarChart, Users, UserCog, ExternalLink,
  LayoutDashboard, FileCheck, User, Handshake,
  TrendingUp, Calendar, Repeat, GitBranch, GitPullRequest,
  Shield, Building, Lock, BookOpen, ClipboardList,
  Wrench, CreditCard, PieChart, Target, Layers, ArrowRight,
  // Claims icons
  HeartHandshake, FileX, FileMinus, Skull, Cpu, BadgeCheck, HelpCircle, Crosshair,
  // Admin icons
  Grid, Package, Percent, Heart, Hospital, Circle,
  // Reinsurance icons
  TrendingDown, Globe, Database, Activity,FilePen, Building2, Bus
} from "lucide-react";
import Button from "../UI/Button";
import logoImage from "../../assets/logo.jpg";

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const navigate = useNavigate();

  // Animated background effects
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Mouse move effect for interactive background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar');
      if (sidebar) {
        const rect = sidebar.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Get user role from localStorage
  useEffect(() => {
    const getUserRole = () => {
      try {
        const userData = localStorage.getItem("unEncryptedUser");
        if (userData) {
          const user = JSON.parse(userData);
          let role = user.userType || user.roles?.[0] || user.role || "agent";
          role = role.toLowerCase().trim();
          return role;
        }
        const storedRole = localStorage.getItem("userRole");
        if (storedRole) {
          return storedRole.toLowerCase().trim();
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

  // Close mobile menu when route changes
  useEffect(() => {
    setMenuOpen(false);
    setOpenDropdown(null);
  }, [window.location.pathname]);

  // CSU Dropdown Items
  const csuItems = [
    { path: "/csu/overview", label: "Overview", icon: LayoutDashboard },
    { path: "/csu/customers", label: "Customers", icon: User },
    { path: "/csu/partners", label: "Partners", icon: Handshake },
  ];

  // Quotations - External Link
  const quotationsItems = [
    { 
      path: "https://fortislifetest.newgibsonline.com", 
      label: "Go to Quotations", 
      icon: TrendingUp,
      external: true 
    },
  ];

  // Underwriting Dropdown Items - Full from UnderwritingSidebar
  const underwritingItems = [
    { path: "/underwriting/overview", label: "Overview", icon: LayoutDashboard },
    { path: "/underwriting/individual/policy-admin", label: "Individual · Policy Admin", icon: FileCheck },
    { path: "/underwriting/individual/endorsements", label: "Individual · Endorsements", icon: FilePen },
    { path: "/underwriting/individual/processing", label: "Individual · Processing", icon: RefreshCw },
    { path: "/underwriting/individual/maintenance", label: "Individual · Maintenance", icon: Settings },
    { path: "/underwriting/group-life/scheme-admin", label: "Group Life · Scheme Admin", icon: Shield },
    { path: "/underwriting/group-life/scheme-renewals", label: "Group Life · Scheme Renewals", icon: RefreshCw },
    { path: "/underwriting/group-life/endorsements", label: "Group Life · Endorsements", icon: FilePen },
    { path: "/underwriting/group-life/maintenance", label: "Group Life · Maintenance", icon: Settings },
    { path: "/underwriting/credit-life/scheme-admin", label: "Credit Life · Scheme Admin", icon: Shield },
    { path: "/underwriting/credit-life/scheme-renewals", label: "Credit Life · Scheme Renewals", icon: RefreshCw },
    { path: "/underwriting/credit-life/endorsements", label: "Credit Life · Endorsements", icon: FilePen },
    { path: "/underwriting/credit-life/general-bus", label: "Credit Life · General Bus", icon: Building2 },
    { path: "/underwriting/credit-life/package-bus", label: "Credit Life · Package Bus", icon: Bus },
    { path: "/underwriting/credit-life/maintenance", label: "Credit Life · Maintenance", icon: Settings },
    { path: "/underwriting/convert-to-policy/investment-policies", label: "Convert to Policy · Investment Policies", icon: TrendingUp },
    { path: "/underwriting/convert-to-policy/group-business-quotations", label: "Convert to Policy · Group Business Quotations", icon: BarChart },
    { path: "/underwriting/convert-to-scheme/group-life-policies", label: "Convert to Scheme · Group Life Policies", icon: GitBranch },
    { path: "/underwriting/convert-to-scheme/credit-life-policies", label: "Convert to Scheme · Credit Life Policies", icon: GitPullRequest },
  ];

  // Claims Dropdown Items - Full from ClaimsSidebar
  const claimsItems = [
    { path: "/claims/overview", label: "Overview", icon: LayoutDashboard },
    // Individual Claims
    { path: "/claims/individual/maturity", label: "Individual · Maturity", icon: HeartHandshake },
    { path: "/claims/individual/death-benefit", label: "Individual · Death Benefit", icon: Crosshair },
    { path: "/claims/individual/surrender", label: "Individual · Surrender", icon: FileX },
    { path: "/claims/individual/partial-withdrawal", label: "Individual · Partial Withdrawal", icon: FileMinus },
    { path: "/claims/individual/processing/offer", label: "Individual · Processing Offer", icon: FileCheck },
    { path: "/claims/individual/processing/requisition", label: "Individual · Requisition", icon: ClipboardList },
    { path: "/claims/individual/processing/payment-approval", label: "Individual · Payment Approval", icon: BadgeCheck },
    { path: "/claims/individual/processing/enquiries", label: "Individual · Enquiries", icon: HelpCircle },
    // Group Life Claims
    { path: "/claims/group-life/death-claim", label: "Group Life · Death Claim", icon: Skull },
    { path: "/claims/group-life/processing/offer", label: "Group Life · Processing Offer", icon: FileCheck },
    { path: "/claims/group-life/processing/requisition", label: "Group Life · Requisition", icon: ClipboardList },
    { path: "/claims/group-life/processing/payment-approval", label: "Group Life · Payment Approval", icon: BadgeCheck },
    { path: "/claims/group-life/processing/enquiries", label: "Group Life · Enquiries", icon: HelpCircle },
    // Credit Life Claims
    { path: "/claims/credit-life/death-claim", label: "Credit Life · Death Claim", icon: Skull },
    { path: "/claims/credit-life/processing/offer", label: "Credit Life · Processing Offer", icon: FileCheck },
    { path: "/claims/credit-life/processing/requisition", label: "Credit Life · Requisition", icon: ClipboardList },
    { path: "/claims/credit-life/processing/payment-approval", label: "Credit Life · Payment Approval", icon: BadgeCheck },
    { path: "/claims/credit-life/processing/enquiries", label: "Credit Life · Enquiries", icon: HelpCircle },
  ];

  // Reinsurance Dropdown Items - Full from ReinsuranceSidebar
  const reinsuranceItems = [
    { path: "/reinsurance/overview", label: "Overview", icon: LayoutDashboard },
  ];

  // Admin Dropdown Items - Full from AdminSidebar
  const adminItems = [
    { path: "/admin", label: "Overview", icon: LayoutDashboard },
    { path: "/admin/company", label: "Company", icon: Building },
    { path: "/admin/security", label: "Security", icon: Lock },
    { path: "/admin/configurations/product-main-class", label: "Config · Product Main Class", icon: Grid },
    { path: "/admin/configurations/product-lines", label: "Config · Product Lines", icon: Layers },
    { path: "/admin/configurations/product-settings", label: "Config · Product Settings", icon: Package },
    { path: "/admin/configurations/product-sections", label: "Config · Product Sections", icon: FileText },
    { path: "/admin/configurations/product-covers", label: "Config · Product Covers", icon: Shield },
    { path: "/admin/configurations/product-smi", label: "Config · Product SMI", icon: BarChart },
    { path: "/admin/configurations/bus-channel", label: "Config · Bus Channel", icon: GitBranch },
    { path: "/admin/configurations/sub-channel", label: "Config · Sub Channel", icon: Users },
    { path: "/admin/configurations/commission-rates", label: "Config · Commission Rates", icon: Percent },
    { path: "/admin/configurations/interest-rates", label: "Config · Interest Rates", icon: TrendingUp },
    { path: "/admin/configurations/premium-rates", label: "Config · Premium Rates", icon: Percent },
    { path: "/admin/configurations/allocation-rates", label: "Config · Allocation Rates", icon: BarChart },
    { path: "/admin/configurations/medical-test", label: "Config · Medical Test", icon: Heart },
    { path: "/admin/configurations/test-distribution", label: "Config · Test Distribution", icon: Circle },
    { path: "/admin/configurations/medical-hospital", label: "Config · Medical Hospital", icon: Hospital },
  ];

  const navItems = [
    {
      title: "Home",
      link: "/dashboard",
      hidden: false,
      roles: ["admin", "user", "agent", "customer"],
      icon: Home,
    },
    {
      title: "CSU",
      link: "/csu/overview",
      hidden: false,
      roles: ["admin", "user", "agent"],
      hasDropdown: true,
      dropdownItems: csuItems,
      icon: Users,
    },
    {
      title: "Quotations",
      link: "https://fortislifetest.newgibsonline.com",
      hidden: false,
      roles: ["admin", "agent", "user"],
      hasDropdown: true,
      dropdownItems: quotationsItems,
      icon: PenTool,
      external: true,
    },
    {
      title: "Underwriting",
      link: "/underwriting",
      hidden: false,
      roles: ["admin", "agent", "user"],
      hasDropdown: true,
      dropdownItems: underwritingItems,
      icon: PenTool,
    },
    {
      title: "Claims",
      link: "/claims",
      hidden: false,
      roles: ["admin", "agent", "user"],
      hasDropdown: true,
      dropdownItems: claimsItems,
      icon: Scale,
    },
    {
      title: "Reinsurance",
      link: "/reinsurance",
      hidden: false,
      roles: ["admin", "agent", "user"],
      hasDropdown: true,
      dropdownItems: reinsuranceItems,
      icon: RefreshCw,
    },
    {
      title: "Admin",
      link: "/admin",
      hidden: false,
      roles: ["admin", "user"],
      hasDropdown: true,
      dropdownItems: adminItems,
      icon: UserCog,
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
    setMenuOpen(false);
    navigate("/login");
  };

  const toggleDropdown = (title: string) => {
    setOpenDropdown(openDropdown === title ? null : title);
  };

  // Handle external link click
  const handleExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setMenuOpen(false);
    setOpenDropdown(null);
  };

  if (!userRole) {
    return (
      <header className="bg-gradient-to-r from-blue-900 to-blue-700 border-b border-white/10 px-5 flex items-center justify-between h-16 shadow ml-auto">
        <div className="text-white">Loading...</div>
      </header>
    );
  }

  return (
    <>
      <header className="bg-gradient-to-r from-blue-900 to-blue-700 border-b border-white/10 px-5 flex items-center justify-between h-16 shadow w-full relative z-50">
        {/* Logo Section */}
        <Link to="/dashboard" className="flex items-center gap-3 no-underline">
          <span className="text-white font-bold text-xl tracking-wider cursor-pointer hover:text-gray-300 transition-colors">
            GIBS-LIFE TECHNICAL
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-1 flex-1">
          <div className="flex items-center gap-1 ml-auto">
            {visibleNavItems.map((item, index) => (
              item.external ? (
                <button
                  key={index}
                  onClick={() => handleExternalLink(item.link)}
                  className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-white/80 text-sm font-medium transition-all duration-200 hover:bg-white/10 hover:text-white"
                >
                  {item.icon && <item.icon size={18} />}
                  <span>{item.title}</span>
                  <ExternalLink size={14} />
                </button>
              ) : (
                <NavLink
                  key={index}
                  to={item.link}
                  className={({ isActive }) =>
                    `relative flex items-center gap-2 px-4 py-2 rounded-lg text-white/80 text-sm font-medium transition-all duration-200 hover:bg-white/10 hover:text-white ${
                      isActive ? "bg-blue-500/20 text-blue-300" : ""
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full" />
                      )}
                      {item.icon && <item.icon size={18} />}
                      <span>{item.title}</span>
                    </>
                  )}
                </NavLink>
              )
            ))}
          </div>
          <Button
            onClick={handleLogout}
            variant="secondary"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white ml-2 border-none"
          >
            <LogOut size={16} />
            <span className="hidden lg:inline">Logout</span>
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="block xl:hidden w-fit p-2 text-white hover:text-blue-200 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Sidebar with Animated Blue Background */}
      <div
        id="mobile-sidebar"
        className={`fixed top-0 right-0 h-full w-80 shadow-2xl transform transition-transform duration-300 ease-in-out z-[9999] overflow-y-auto ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "linear-gradient(180deg, #1a3a5c 0%, #0d1f3c 50%, #1a3a5c 100%)",
        }}
      >
        {/* Animated Rotating Gradient Background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `conic-gradient(from ${time}deg at 50% 50%, 
              #1a3a5c, #2563eb, #3b82f6, #60a5fa, #93c5fd, #3b82f6, #1a3a5c)`,
            opacity: 0.3,
            filter: 'blur(60px)',
            transform: 'scale(1.5)',
          }}
        />

        {/* Floating Blue Orbs */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            left: `${30 + Math.sin(time * 0.02) * 20}%`,
            top: `${20 + Math.cos(time * 0.015) * 30}%`,
            animation: 'float 8s ease-in-out infinite',
          }}
        />

        <div
          className="absolute pointer-events-none"
          style={{
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(96, 165, 250, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(30px)',
            right: `${10 + Math.cos(time * 0.025) * 25}%`,
            bottom: `${15 + Math.sin(time * 0.018) * 35}%`,
            animation: 'float 6s ease-in-out infinite reverse',
          }}
        />

        <div
          className="absolute pointer-events-none"
          style={{
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(147, 197, 253, 0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(25px)',
            left: `${10 + Math.sin(time * 0.03) * 30}%`,
            top: `${60 + Math.cos(time * 0.02) * 25}%`,
            animation: 'float 7s ease-in-out infinite',
          }}
        />

        {/* Mouse Following Blue Light */}
        <div
          className="absolute pointer-events-none transition-all duration-300"
          style={{
            width: '350px',
            height: '350px',
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.15) 0%, transparent 60%)`,
            filter: 'blur(50px)',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.8,
          }}
        />

        {/* Shimmer Scan Line */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.05) ${45 + Math.sin(time * 0.03) * 15}%, transparent 100%)`,
            transform: `skewX(-15deg) translateX(${-100 + (time % 200)}%)`,
            transition: 'transform 0.05s linear',
          }}
        />

        {/* Mobile Sidebar Header */}
        <div className="sticky top-0 z-10 flex justify-between items-center p-5 border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="no-underline" onClick={() => setMenuOpen(false)}>
              <span className="font-extrabold text-lg text-white tracking-wider ring-2 ring-white/30 px-4 py-2 rounded-lg hover:ring-white/50 transition-all cursor-pointer">
                GIBS-LIFE <span className="text-blue-400">TECHNICAL</span>
              </span>
            </Link>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="text-white/80 hover:text-white p-1"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="relative z-10 flex flex-col p-4 space-y-1 overflow-y-auto h-[calc(100vh-80px)] scrollbar-hide">
          {visibleNavItems.map((item, index) => (
            <div key={index} className="mb-1">
              {item.hasDropdown ? (
                <div className="mb-1">
                  <button
                    onClick={() => toggleDropdown(item.title)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 ${
                      openDropdown === item.title
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.icon && <item.icon size={18} className="flex-shrink-0" />}
                      <span className="text-sm font-medium truncate">{item.title}</span>
                      {item.external && <ExternalLink size={14} className="text-blue-400 flex-shrink-0" />}
                    </div>
                    <ChevronDown
                      size={18}
                      className={`flex-shrink-0 transition-transform duration-300 ${openDropdown === item.title ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {openDropdown === item.title && (
                    <div className="ml-6 border-l-2 border-blue-400/30 pl-3 mt-1 space-y-1 max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                      {item.dropdownItems.map((dropdownItem, idx) => {
                        const IconComponent = dropdownItem.icon;
                        return dropdownItem.external ? (
                          <button
                            key={idx}
                            onClick={() => handleExternalLink(dropdownItem.path)}
                            className="relative flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200 w-full text-white/60 hover:text-white hover:bg-white/5"
                          >
                            {IconComponent && <IconComponent size={16} className="flex-shrink-0" />}
                            <span className="truncate">{dropdownItem.label}</span>
                            <ExternalLink size={12} className="ml-auto text-blue-400 flex-shrink-0" />
                          </button>
                        ) : (
                          <NavLink
                            key={idx}
                            to={dropdownItem.path}
                            onClick={() => {
                              setMenuOpen(false);
                              setOpenDropdown(null);
                            }}
                            className={({ isActive }) =>
                              `relative flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                                isActive
                                  ? 'text-blue-300 bg-blue-500/20 font-medium'
                                  : 'text-white/60 hover:text-white hover:bg-white/5'
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                {isActive && (
                                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full" />
                                )}
                                {IconComponent && <IconComponent size={16} className="flex-shrink-0" />}
                                <span className="truncate">{dropdownItem.label}</span>
                              </>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                item.external ? (
                  <button
                    onClick={() => handleExternalLink(item.link)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-white/80 hover:text-white hover:bg-white/10"
                  >
                    {item.icon && <item.icon size={18} className="flex-shrink-0" />}
                    <span className="text-sm truncate">{item.title}</span>
                    <ExternalLink size={14} className="ml-auto text-blue-400 flex-shrink-0" />
                  </button>
                ) : (
                  <NavLink
                    to={item.link}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-500/20 text-blue-300 font-medium'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full" />
                        )}
                        {item.icon && <item.icon size={18} className="flex-shrink-0" />}
                        <span className="text-sm truncate">{item.title}</span>
                      </>
                    )}
                  </NavLink>
                )
              )}
            </div>
          ))}

          {/* Mobile Logout Button */}
          <div className="border-t border-white/10 mt-4 pt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/20 rounded-xl transition-all duration-200 font-medium hover:text-red-300"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Overlay to close menu when clicking outside */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] xl:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default Header;