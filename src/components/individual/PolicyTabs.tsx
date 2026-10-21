// The tabs on an individual policy's setup / edit page, and what sits behind every tab except Information.
import { FileText, History, User, Users } from "lucide-react";
import BeneficiariesPanel from "./BeneficiariesPanel";
import PolicyDocumentsPanel from "./PolicyDocumentsPanel";
import PremiumHistoryPanel from "./PremiumHistoryPanel";

export type PolicyTab = "Information" | "Beneficiaries" | "Premium History" | "Documents";

const TABS: { key: PolicyTab; icon: typeof User }[] = [
  { key: "Information", icon: User },
  { key: "Beneficiaries", icon: Users },
  { key: "Premium History", icon: History },
  { key: "Documents", icon: FileText },
];

const NEEDS_POLICY: Record<string, string> = {
  Beneficiaries: "Beneficiaries are added from the policy's Edit screen once it has a policy number.",
  "Premium History": "The premium history appears once the policy has a policy number.",
  Documents: "Documents can be attached from the policy's Edit screen once it has a policy number.",
};

export const PolicyTabBar = ({ active, onChange }: { active: string; onChange: (t: PolicyTab) => void }) => (
  <div className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
    {TABS.map(({ key, icon: Icon }) => (
      <button
        key={key}
        type="button"
        onClick={() => onChange(key)}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${active === key ? "bg-[#155dfd] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
      >
        <Icon size={16} /> {key}
      </button>
    ))}
  </div>
);

/** The body of every tab except Information. Renders nothing for Information. */
export const PolicyTabContent = ({ active, policyNo, isEditMode }: { active: string; policyNo?: string; isEditMode: boolean }) => {
  if (active === "Information" || !NEEDS_POLICY[active]) return null;

  if (!isEditMode || !policyNo) {
    const Icon = TABS.find((t) => t.key === active)?.icon ?? User;
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Icon size={32} className="mb-3 text-[#155dfd]" />
        <h2 className="mb-2 text-xl font-bold text-gray-800">Save the policy first</h2>
        <p className="max-w-sm text-gray-500">{NEEDS_POLICY[active]}</p>
      </div>
    );
  }

  if (active === "Beneficiaries") return <BeneficiariesPanel policyNo={policyNo} />;
  if (active === "Premium History") return <PremiumHistoryPanel policyNo={policyNo} />;
  return <PolicyDocumentsPanel policyNo={policyNo} />;
};
