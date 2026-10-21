// @ts-nocheck
// The menus, in one place: the header's slide-out menu and the sidebar both read these.
import { LayoutDashboard, User, Handshake, TrendingUp, FileCheck, FilePen, RefreshCw, Settings, Shield, Building2, Bus, BarChart, GitBranch, GitPullRequest, CreditCard, HeartHandshake, Crosshair, FileX, FileMinus, ClipboardList, BadgeCheck, HelpCircle, Skull, Building, Lock, Grid, Layers, Package, FileText, Users, Percent, Heart, Circle, Hospital, Home, PenTool, Scale, UserCog, FileBarChart } from "lucide-react";
import { QUOTATIONS_URL } from "../../config/config";
import { reportPath, reportSections } from "../../pages/reports/reportsCatalog";

export const getNavConfig = () => {
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
    { path: "/underwriting/group-life-quotations", label: "Group Life · Scheme Admin", icon: Shield },
    { path: "/underwriting/group-life/scheme-renewals", label: "Group Life · Scheme Renewals", icon: RefreshCw },
    { path: "/underwriting/group-life/endorsement", label: "Group Life · Endorsements", icon: FilePen },
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
    { path: "/reinsurance/facultative-inwards", label: "Facultative", icon: FileCheck },
    // Treaties > Family Treaties, as in the legacy menu
    { path: "/reinsurance/treaties/process-underwriting-treaty?class=group", label: "Treaties · Group Life Underwriting Treaty", icon: FileText },
    { path: "/reinsurance/treaties/process-underwriting-treaty?class=individual", label: "Treaties · Individual Life Underwriting Treaty", icon: FileText },
    { path: "/reinsurance/treaties/ri-distribution", label: "Treaties · RI Distribution", icon: FileText },
    { path: "/reinsurance/maintenance/treaty-distribution", label: "Maintenance", icon: Settings },
    { path: "/reinsurance/treaties/claims-paid-recoveries", label: "Recoveries", icon: CreditCard },
    { path: "/reinsurance/authorization", label: "Authorization", icon: Shield },
  ];

  // Reports: a section with reports becomes its own dropdown ("Individual · Active Policy Registers Reports")
  const reportsItems = [
    { path: "/reports/overview", label: "Overview", icon: LayoutDashboard },
    ...reportSections.flatMap((s) =>
      s.reports
        ? s.reports.map((r) => ({ path: reportPath(s.slug, r.slug), label: `${s.title} · ${r.title}`, icon: FileText }))
        : [{ path: reportPath(s.slug), label: s.title, icon: FileText }],
    ),
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
      title: "Reports",
      link: "/reports",
      hidden: false,
      roles: ["admin", "agent", "user"],
      hasDropdown: true,
      dropdownItems: reportsItems,
      icon: FileBarChart,
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

  return navItems;
};
