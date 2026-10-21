// @ts-nocheck
// The "Policy summary" side panel on the individual policy setup forms. Display only: it reads
// the form's current values and the branch/product lists the form already loaded.
import { Panel, SummaryList } from "../page/PageKit";

const money = (v: any) => {
  if (v === null || v === undefined || v === "" || Number.isNaN(Number(v)) || Number(v) === 0) return null;
  return `₦${Number(v).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const date = (v: any) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const PolicySummaryCard = ({ formData, branches = [], products = [], traditional = false }: any) => {
  const client = [formData.title, formData.surName, formData.otherNames].filter(Boolean).join(" ");
  const branch = branches.find((b: any) => String(b.branchID) === String(formData.brCode))?.description || formData.brCode;
  const product = products.find((p: any) => String(p.productID) === String(formData.productCode))?.productName || formData.productCode;
  const reference = formData.policyNo || formData.proposalNo;

  const rows: [string, any][] = [
    ["Client", client],
    ["Date of birth", date(formData.dateOfBirth)],
    ["Gender", formData.gender],
    ["Branch", branch],
    ["Product", product],
    ["Frequency", formData.frequency],
    ["Duration", formData.duration ? `${formData.duration} years` : null],
    ["Start date", date(formData.issueDate)],
    ["Maturity date", date(formData.expiryDate)],
    ["Regular saving", money(formData.regularSaving)],
  ];
  if (traditional) {
    rows.push(["Sum assured", money(formData.sumAssured)], ["First premium", money(formData.firstPremium)]);
  }
  rows.push(["Payment amount", money(formData.paymentAmount)]);

  return (
    <aside className="xl:sticky xl:top-6">
      <Panel title="Policy summary" description={reference || "New policy"} bodyClassName="px-5 py-1 sm:px-6">
        <SummaryList rows={rows} />
      </Panel>
    </aside>
  );
};

export default PolicySummaryCard;
