import { useLocation } from "react-router-dom";

const toTitle = (slug: string = "") =>
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const sectionLabels: Record<string, string> = {
  individual: "Individual",
  "group-life": "Group Life",
  "credit-life": "Credit Life",
};

const ClaimsSubPage = () => {
  const { pathname } = useLocation();

  // Strip leading /claims/ and split
  const parts = pathname.replace(/^\/claims\//, "").split("/");
  // e.g. ["individual", "maturity"] or ["individual", "processing", "offer"]

  const sectionKey = parts[0] ?? "";
  const sectionLabel = sectionLabels[sectionKey] ?? toTitle(sectionKey);
  const isProcessing = parts[1] === "processing";
  const pageLabel = isProcessing
    ? `Processing — ${toTitle(parts[2])}`
    : toTitle(parts[1]);

  return (
    <div className="p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#8c4b8d] mb-1">
        {sectionLabel}
      </p>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{pageLabel}</h1>
      <p className="text-gray-500">
        {sectionLabel} — {pageLabel} content will go here.
      </p>
    </div>
  );
};

export default ClaimsSubPage;
