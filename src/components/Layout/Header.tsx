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
import { QUOTATIONS_URL } from "../../config/config";

// Splits "Group · Label" entries into headed groups so long menus stay scannable
const groupItems = (items: any[]) => {
  const groups: { name: string; items: any[] }[] = [];
  items.forEach((it) => {
    const parts = it.label.split(" · ");
    const name = parts.length > 1 ? parts[0] : "";
    const shortLabel = parts.length > 1 ? parts.slice(1).join(" · ") : it.label;
    const last = groups[groups.length - 1];
    if (last && last.name === name) last.items.push({ ...it, shortLabel });
    else groups.push({ name, items: [{ ...it, shortLabel }] });
  });
  return groups;
};

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navigate = useNavigate();

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
    path: QUOTATIONS_URL, // ← Uses config, no fallback
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
    // Annuity
    { path: "/underwriting/annuity/proposals", label: "Annuity · Proposals", icon: FileCheck },
    { path: "/underwriting/annuity/policies", label: "Annuity · Policies", icon: Shield },
    { path: "/underwriting/annuity/payments", label: "Annuity · Due Payments", icon: CreditCard },
    { path: "/underwriting/annuity/batches", label: "Annuity · Payment Batches", icon: Layers },
    { path: "/underwriting/annuity/deaths", label: "Annuity · Death & Benefits", icon: Heart },
    { path: "/underwriting/annuity/products", label: "Annuity · Rules & Factors", icon: Settings },
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
    link: QUOTATIONS_URL, // ← Uses config, no fallback
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
          background: "linear-gradient(180deg, #14325a 0%, #0b1a33 100%)",
        }}
      >
        {/* Static soft glow */}
        <div
          className="absolute inset-x-0 top-0 h-64 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.25) 0%, transparent 70%)" }}
        />

        {/* Mobile Sidebar Header */}
        <div className="sticky top-0 z-10 flex justify-between items-center p-5 border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="no-underline" onClick={() => setMenuOpen(false)}>
              <span className="font-extrabold text-base text-white tracking-wide leading-tight cursor-pointer">
                GIBS-LIFE <span className="text-blue-400">TECHNICAL</span>
              </span>
            </Link>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="relative z-10 flex flex-col p-4 space-y-1 overflow-y-auto h-[calc(100vh-76px)] pb-8 scrollbar-hide">
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
                    <div className="ml-5 border-l border-white/15 pl-3 mt-1 pb-1 animate-in fade-in slide-in-from-top-2 duration-200">
                      {groupItems(item.dropdownItems).map((group, gi) => (
                        <div key={gi} className="mb-2">
                          {group.name && (
                            <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-blue-300/70">
                              {group.name}
                            </div>
                          )}
                          <div className="space-y-0.5">
                            {group.items.map((dropdownItem, idx) => {
                              const IconComponent = dropdownItem.icon;
                              return dropdownItem.external ? (
                                <button
                                  key={idx}
                                  onClick={() => handleExternalLink(dropdownItem.path)}
                                  className="relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 w-full text-white/70 hover:text-white hover:bg-white/10"
                                >
                                  {IconComponent && <IconComponent size={16} className="flex-shrink-0" />}
                                  <span className="text-left leading-snug">{dropdownItem.shortLabel}</span>
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
                                    `relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                      isActive
                                        ? 'text-white bg-blue-500/30 font-medium'
                                        : 'text-white/70 hover:text-white hover:bg-white/10'
                                    }`
                                  }
                                >
                                  {({ isActive }) => (
                                    <>
                                      {isActive && (
                                        <div className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-full" />
                                      )}
                                      {IconComponent && <IconComponent size={16} className="flex-shrink-0" />}
                                      <span className="leading-snug">{dropdownItem.shortLabel}</span>
                                    </>
                                  )}
                                </NavLink>
                              );
                            })}
                          </div>
                        </div>
                      ))}
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