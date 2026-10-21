// @ts-nocheck
// The Reports menu, in one place: the sidebar, the overview and each report page read this.
// A section with `reports` opens a second dropdown; a section without one is a single link.
// A report's `items` are the individual reports, listed on its page rather than in the menu;
// `{ group, items }` puts a few of them under a heading ("Outstanding Premium Reports").
export const reportSections = [
  {
    slug: "individual",
    title: "Individual",
    blurb: "Active policy registers, policy production and premium collections for individual life.",
    reports: [
      {
        slug: "active-policy-registers",
        title: "Active Policy Registers Reports",
        items: [
          "Active Policy Registers Reports",
          "All Matured Policy Registers",
          "All Policy Registers By Plan",
          "All Policy Registers",
          "All Surrendered Policy Registers",
          "Maturity Policy Registers",
          "Policy Register by Financial Planners",
          "Policy Registers (TRADITIONAL)",
          "Policy Registers Traditional Options",
          "Policy Registers-Investment Schemes",
        ],
      },
      {
        slug: "policies-production",
        title: "Policies Production Reports",
        items: [
          "Individual life production (all marketers)",
          "Individual life production (ind. Marketers)",
          "Individual life production (products)",
          "Policy production per product",
          "Production position register (individual) traditional",
          "Production position register (individual)",
          "Production position register traditional nil payment",
          "Production summary by reports",
          "Production total summary",
        ],
      },
      {
        slug: "premium-production-collection",
        title: "Premium Production - Collection Reports",
        items: [
          "Premium Production - Collection Reports",
          "Comprehensive collection report",
          "Premium Production by branch",
          "Premium production summary by product",
          "Summary collection report by branch",
        ],
      },
    ],
  },
  {
    slug: "group-life",
    title: "Group Life",
    blurb: "Group life production, premium collections, claims, renewals and credit control.",
    reports: [
      {
        slug: "production-collection",
        title: "Production-Collection Report",
        items: [
          "Group life production By Broker",
          "Group life production",
          "IA Production (grouplife)",
          "Premium collection register grouplife",
        ],
      },
      {
        slug: "premium-collections",
        title: "Premium Collections Reports",
        items: [
          "All Branch Premium Collected By Brokers",
          "All Premium Collected (Consolidated)",
        ],
      },
      {
        slug: "claims-and-renewal",
        title: "Claims And Renewal Reports",
        items: [
          "Death Claims Outstanding for Period (Grouplife)",
          "Death Claims Paid for Period (Grouplife)",
        ],
      },
      {
        slug: "credit-control",
        title: "Credit Control Reports",
        items: [
          {
            group: "Outstanding Premium Reports",
            items: [
              "Outstanding Balances Details",
              "Outstanding Summary (All Brokers)",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "claims",
    title: "Claims",
    blurb: "Claims paid, general and operational claims, loans and confirmed policy registers.",
    reports: [
      {
        slug: "claims-paid",
        title: "Claims Paid Report",
        items: [
          "All Claims Part Payment Report",
          "Claims Paid By Sub Class",
        ],
      },
      {
        slug: "general-claims",
        title: "General Claims Report",
        items: [
          "All Claims Reported",
          "Credit life maturity statement",
          "Credit life Terminated policies",
          "Individual Maturity Statement",
        ],
      },
      {
        slug: "loan",
        title: "Loan Reports",
        items: [
          "Loan register",
        ],
      },
      {
        slug: "operational-claims",
        title: "Operational Claims Reports",
        items: [
          "Business Due for Maturity By Marketer",
          "Business Due for Maturity (Order by Policy No)",
        ],
      },
      {
        slug: "registers-of-confirmed-policies",
        title: "Registers of Confirmed policies",
        items: [
          "Register of Claims policies (All)",
          "Register of Death policies (All)",
          "Register of Death Policies (Individual)",
          "Register of matured expired policies",
          "Register of surrendered policies",
        ],
      },
    ],
  },
  {
    slug: "reinsurance",
    title: "Reinsurance",
    blurb: "Reinsurance summaries and details, and actuarial operation reports.",
    reports: [
      {
        slug: "summary-and-details",
        title: "Reinsurance Summary And Details Reports",
        items: [
          "Reassurance Details Report - Group life",
          "Reassurance Details Report - Individual life",
          "Reassurance Cession Certificate",
          "Risk profile report",
        ],
      },
      {
        slug: "reinsurance",
        title: "Reinsurance",
        items: [
          "Register Of All Policy Exits",
          "Register Of All Policy In Force",
          "Register Of All Policy Written",
          "Register of Lapsed Policies",
          "Traditional Bus Actuarial Report (Exit)",
          "Traditional Bus Actuarial report (In force)",
        ],
      },
      {
        slug: "actuarial-operation",
        title: "Actuarial Operation Reports",
        items: [
          "Actuarial valuation report (EXIT)",
          "Actuarial valuation report (in force)",
        ],
      },
    ],
  },
  {
    slug: "premium-servicing",
    title: "Premium Servicing",
    blurb: "Premium servicing reports.",
  },
  {
    slug: "audit-trail",
    title: "Audit Trail",
    blurb: "Who changed what, and when, across the system.",
  },
];

export const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** A report's items as one list, each with the heading it sits under (if any). */
export const flattenItems = (items: any[] = []) =>
  items.flatMap((it) => (typeof it === "string" ? [{ title: it, group: null }] : it.items.map((title) => ({ title, group: it.group }))));

export const reportPath = (section: string, report?: string) =>
  report ? `/reports/${section}/${report}` : `/reports/${section}`;

/** Finds the section and (optional) report for a URL's slugs. */
export const findReport = (sectionSlug?: string, reportSlug?: string) => {
  const section = reportSections.find((s) => s.slug === sectionSlug);
  if (!section) return null;
  if (!reportSlug) return section.reports ? null : { section, report: null };
  const report = section.reports?.find((r) => r.slug === reportSlug);
  return report ? { section, report } : null;
};
