import { useLocation } from "react-router-dom";
import InvestmentPoliciesPage from "./InvestmentPoliciesPage";
import ConvertInvestmentPolicyPage from "./ConvertInvestmentPolicyPage";
import SchemeQuotationsPage from "./SchemeQuotationsPage";

const toTitle = (slug: string = "") =>
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const sectionLabels: Record<string, string> = {
  "convert-to-policy": "Convert to Policy",
  "convert-to-scheme": "Convert to Scheme",
};

const ProposalsSubPage = () => {
  const { pathname } = useLocation();
  const parts = pathname.replace(/^\/proposals\//, "").split("/");
  const sectionKey = parts[0] ?? "";
  const pageKey = parts[1] ?? "";
  const idKey = parts[2] ?? ""; // proposalNo or quoteID

  // Render dedicated page for investment-policies
  if (sectionKey === "convert-to-policy" && pageKey === "investment-policies") {
    if (idKey) {
      return <ConvertInvestmentPolicyPage proposalNo={idKey} />;
    }
    return <InvestmentPoliciesPage />;
  }

  // Render SchemeQuotationsPage for convert-to-scheme items
  if (sectionKey === "convert-to-scheme") {
    if (pageKey === "group-life-policies") {
      return <SchemeQuotationsPage title="Group Life Policies" tag="GL" />;
    }
    if (pageKey === "credit-life-policies") {
      return <SchemeQuotationsPage title="Credit Life Policies" tag="CL" />;
    }
  }

  // Generic placeholder for other sub-pages
  const sectionLabel = sectionLabels[sectionKey] ?? toTitle(sectionKey);
  const pageLabel = toTitle(pageKey);

  return (
    <div className="p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#155dfd] mb-1">
        {sectionLabel}
      </p>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{pageLabel}</h1>
      <p className="text-gray-500">
        {sectionLabel} — {pageLabel} content will go here.
      </p>
    </div>
  );
};

export default ProposalsSubPage;
