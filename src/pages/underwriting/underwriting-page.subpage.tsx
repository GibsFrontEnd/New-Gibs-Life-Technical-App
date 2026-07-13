//@ts-nocheck
import { useParams, useLocation } from "react-router-dom";
import PolicyAdminPage from "./PolicyAdminPage";
import NewInvestmentPolicySetupPage from "./NewInvestmentPolicySetupPage";
import NewTraditionalPolicySetupPage from "./NewTraditionalPolicySetupPage";
import InvestmentPoliciesPage from "../proposals/InvestmentPoliciesPage";
import ConvertInvestmentPolicyPage from "../proposals/ConvertInvestmentPolicyPage";
import SchemeQuotationsPage from "../proposals/SchemeQuotationsPage";
import GroupLifeQuotation from "../../components/groupLife/GroupLifeQuotation";
import GroupLifeQuotationDetail from "../../components/groupLife/GroupLifeQuotationDetail";
import EditGroupLifeQuotationDetail from "../../components/groupLife/EditGroupLifeQuotationDetail";
import PlaceholderPage from "./PlaceHolderPage";
import CreditLifeSchemeAdmin from "../../components/underwriting/CreditLife/CreditLifeSchemeAdmin";
import CreditLifeSchemeRenewals from "../../components/underwriting/CreditLife/CreditLifeSchemeRenewal";
import MemberDetailPage from "../../components/groupLife/MemberDetailPage";

// Converts slug like "policy-admin" → "Policy Admin"
const toTitle = (slug: string = "") =>
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const sectionLabels: Record<string, string> = {
  individual: "Individual",
  "group-life": "Group Life",
  "credit-life": "Credit Life",
  "convert-to-policy": "Convert to Policy",
  "convert-to-scheme": "Convert to Scheme",
  "group-life-quotations": "Group Life Quotations",
};

const UnderwritingSubPage = () => {
  const location = useLocation();
  const { section = "", page = "", id = "" } = useParams<{
    section: string;
    page: string;
    id?: string;
  }>();

  const pathname = location.pathname;

  // ============================================
  // GROUP LIFE QUOTATIONS ROUTES
  // ============================================

  // 1. Member Detail - MUST COME FIRST
  if (pathname.startsWith("/underwriting/group-life-quotations/members/")) {
    console.log("✅ Rendering MemberDetailPage for:", pathname);
    return <MemberDetailPage />;
  }

  // 2. Edit with /edit/ in URL
  if (pathname.startsWith("/underwriting/group-life-quotations/edit/")) {
    return <EditGroupLifeQuotationDetail />;
  }

  // 3. New - CREATE
  if (pathname === "/underwriting/group-life-quotations/new") {
    return <GroupLifeQuotationDetail />;
  }

  // 4. View/Edit - without edit in URL (catch-all for :id)
  // Only match if the path has something after group-life-quotations/
  // but NOT if it's just the base path
  if (pathname.startsWith("/underwriting/group-life-quotations/") && 
      pathname !== "/underwriting/group-life-quotations/new" &&
      pathname !== "/underwriting/group-life-quotations" &&
      !pathname.includes("/members/") &&
      !pathname.includes("/edit/")) {
    console.log("✅ Rendering EditGroupLifeQuotationDetail for:", pathname);
    return <EditGroupLifeQuotationDetail />;
  }

  // 5. List
  if (pathname === "/underwriting/group-life-quotations") {
    return <GroupLifeQuotation />;
  }

  // ============================================
  // INDIVIDUAL ROUTES
  // ============================================

  // 🆕 Handle: /underwriting/individual/policy-admin/investment-policies (Investment Policies List)
  if (pathname === "/underwriting/individual/policy-admin/investment-policies") {
    return <PolicyAdminPage defaultTab="B" />;
  }

  // 🆕 Handle: /underwriting/individual/policy-admin/traditional-policies (Traditional Policies List)
  if (pathname === "/underwriting/individual/policy-admin/traditional-policies") {
    return <PolicyAdminPage defaultTab="A" />;
  }

  // Handle: /underwriting/individual/policy-admin (LIST - Default/All Policies)
  if (pathname === "/underwriting/individual/policy-admin") {
    return <PolicyAdminPage />;
  }
  
  // Handle: /underwriting/individual/policy-admin/new-investment (CREATE)
  if (pathname === "/underwriting/individual/policy-admin/new-investment") {
    return <NewInvestmentPolicySetupPage />;
  }

  // Handle: /underwriting/individual/policy-admin/new-traditional (CREATE)
  if (pathname === "/underwriting/individual/policy-admin/new-traditional") {
    return <NewTraditionalPolicySetupPage />;
  }

  // Handle: /underwriting/individual/policy-admin/edit-investment/:id (EDIT)
  if (pathname.startsWith("/underwriting/individual/policy-admin/edit-investment/")) {
    return <NewInvestmentPolicySetupPage />;
  }

  // Handle: /underwriting/individual/policy-admin/edit-traditional/:id (EDIT)
  if (pathname.startsWith("/underwriting/individual/policy-admin/edit-traditional/")) {
    return <NewTraditionalPolicySetupPage />;
  }

  // ============================================
  // INDIVIDUAL - ENDORSEMENTS (Coming Soon)
  // ============================================
  if (pathname === "/underwriting/individual/endorsements") {
    return <PlaceholderPage title="Endorsements" />;
  }
  if (pathname === "/underwriting/individual/endorsements/personal-details") {
    return <PlaceholderPage title="Personal Details Change" />;
  }
  if (pathname === "/underwriting/individual/endorsements/premium-details") {
    return <PlaceholderPage title="Premium Details Change" />;
  }
  if (pathname === "/underwriting/individual/endorsements/scheme-details") {
    return <PlaceholderPage title="Scheme Details Change" />;
  }
  if (pathname === "/underwriting/individual/endorsements/beneficiary-details") {
    return <PlaceholderPage title="Beneficiary Details Change" />;
  }
  if (pathname === "/underwriting/individual/endorsements/policy-agent") {
    return <PlaceholderPage title="Policy Agent Change" />;
  }

  // ============================================
  // INDIVIDUAL - PROCESSING (Coming Soon)
  // ============================================
  if (pathname === "/underwriting/individual/processing") {
    return <PlaceholderPage title="Processing" />;
  }
  if (pathname === "/underwriting/individual/processing/account-balance") {
    return <PlaceholderPage title="Account Balance Statement" />;
  }
  if (pathname === "/underwriting/individual/processing/lapse-policies") {
    return <PlaceholderPage title="Lapse Policies Processing" />;
  }
  if (pathname === "/underwriting/individual/processing/premium-alert") {
    return <PlaceholderPage title="Premium Alert Processing" />;
  }
  if (pathname === "/underwriting/individual/processing/policy-renewal") {
    return <PlaceholderPage title="Policy Renewal Processing" />;
  }
  if (pathname === "/underwriting/individual/processing/end-actuarial") {
    return <PlaceholderPage title="End Actuarial Processing" />;
  }

  // ============================================
  // INDIVIDUAL - MAINTENANCE (Coming Soon)
  // ============================================
  if (pathname === "/underwriting/individual/maintenance") {
    return <PlaceholderPage title="Maintenance" />;
  }

  // ============================================
  // GROUP LIFE ROUTES
  // ============================================
  
  // Group Life - Endorsements (Coming Soon)
  if (pathname === "/underwriting/group-life/endorsements") {
    return <PlaceholderPage title="Group Life Endorsements" />;
  }
  
  // Group Life - Maintenance (Coming Soon)
  if (pathname === "/underwriting/group-life/maintenance") {
    return <PlaceholderPage title="Group Life Maintenance" />;
  }

  // ============================================
  // CREDIT LIFE ROUTES (All Coming Soon)
  // ============================================
  if (pathname === "/underwriting/credit-life/scheme-admin") {
    return <CreditLifeSchemeAdmin />;
  }
  if (pathname === "/underwriting/credit-life/scheme-renewals") {
    return <CreditLifeSchemeRenewals />;
  }
  if (pathname === "/underwriting/credit-life/endorsements") {
    return <PlaceholderPage title="Credit Life Endorsements" />;
  }
  if (pathname === "/underwriting/credit-life/maintenance") {
    return <PlaceholderPage title="Credit Life Maintenance" />;
  }

  // ============================================
  // CONVERT TO POLICY ROUTES
  // ============================================

  // Handle: /underwriting/convert-to-policy/investment-policies (LIST)
  if (pathname === "/underwriting/convert-to-policy/investment-policies") {
    return <InvestmentPoliciesPage />;
  }

  // Handle: /underwriting/convert-to-policy/investment-policies/:id (EDIT)
  if (pathname.startsWith("/underwriting/convert-to-policy/investment-policies/")) {
    return <ConvertInvestmentPolicyPage proposalNo={id} />;
  }

  // Handle: /underwriting/convert-to-policy/group-business-quotations
  if (pathname === "/underwriting/convert-to-policy/group-business-quotations") {
    return <SchemeQuotationsPage title="Group Business Quotations" tag="GL" actionLabel="Convert to Policy" />;
  }

  // ============================================
  // CONVERT TO SCHEME ROUTES
  // ============================================

  // Handle: /underwriting/convert-to-scheme/group-life-policies
  if (pathname === "/underwriting/convert-to-scheme/group-life-policies") {
    return <SchemeQuotationsPage title="Group Life Policies" tag="GL" />;
  }

  // Handle: /underwriting/convert-to-scheme/credit-life-policies
  if (pathname === "/underwriting/convert-to-scheme/credit-life-policies") {
    return <SchemeQuotationsPage title="Credit Life Policies" tag="CL" />;
  }

  // ============================================
  // FALLBACK
  // ============================================

  const pageLabel = toTitle(page);

  // Fallback placeholder for any unmatched routes
  return (
    <PlaceholderPage title={pageLabel || "Page Under Development"} />
  );
};

export default UnderwritingSubPage;