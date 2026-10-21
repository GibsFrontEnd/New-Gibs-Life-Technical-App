import { User, Users, CreditCard, Landmark, FilePen, RefreshCw, TrendingUp, GitBranch } from "lucide-react";
import { PageHeader, PageShell, ShortcutCard, type Tone } from "../../components/page/PageKit";

// Mirrors the underwriting menu so the overview stays in sync.
const groups: { title: string; items: { label: string; blurb: string; icon: any; path: string; tone: Tone }[] }[] = [
  {
    title: "Policy administration",
    items: [
      { label: "Individual", blurb: "Investment and traditional policies", icon: User, path: "/underwriting/individual/policy-admin", tone: "blue" },
      { label: "Group Life", blurb: "Schemes, members and renewals", icon: Users, path: "/underwriting/group-life-quotations", tone: "violet" },
      { label: "Credit Life", blurb: "Schemes and renewals", icon: CreditCard, path: "/underwriting/credit-life/scheme-admin", tone: "orange" },
      { label: "Annuity", blurb: "Proposals, policies and payments", icon: Landmark, path: "/underwriting/annuity/proposals", tone: "teal" },
    ],
  },
  {
    title: "Changes and renewals",
    items: [
      { label: "Individual endorsements", blurb: "Change an individual policy", icon: FilePen, path: "/underwriting/individual/endorsements", tone: "amber" },
      { label: "Group life endorsements", blurb: "Change a group life scheme", icon: FilePen, path: "/underwriting/group-life/endorsement", tone: "rose" },
      { label: "Scheme renewals", blurb: "Renew group life schemes", icon: RefreshCw, path: "/underwriting/group-life/scheme-renewals", tone: "emerald" },
    ],
  },
  {
    title: "Convert",
    items: [
      { label: "Investment policies", blurb: "Proposals to policies", icon: TrendingUp, path: "/underwriting/convert-to-policy/investment-policies", tone: "blue" },
      { label: "Group life policies", blurb: "Quotations to schemes", icon: GitBranch, path: "/underwriting/convert-to-scheme/group-life-policies", tone: "violet" },
    ],
  },
];

const UnderwritingOverview = () => (
  <PageShell className="space-y-8">
    <PageHeader
      eyebrow="Underwriting"
      title="Underwriting overview"
      description="Convert proposals into policies and schemes, then administer the full policy lifecycle."
    />

    {groups.map((g) => (
      <section key={g.title}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{g.title}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {g.items.map((s) => (
            <ShortcutCard key={s.path} to={s.path} icon={s.icon} title={s.label} subtitle={s.blurb} tone={s.tone} />
          ))}
        </div>
      </section>
    ))}
  </PageShell>
);

export default UnderwritingOverview;
