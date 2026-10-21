// Group-life navigation. Back/Cancel must go somewhere defined, not "the previous history entry":
// after a debit-note form the previous entry IS the form, and a scheme can be reached from three lists.

export type SchemeSource = "endorsements" | "renewals" | "";

const KEY = (policyNo: string) => `gl.source.${policyNo}`;

const policyFromPath = (pathname: string) => {
  try {
    return decodeURIComponent(pathname.split("/").filter(Boolean).pop() || "");
  } catch {
    return "";
  }
};

/** Remember which list the scheme was opened from (?source=…), so later pages can send the user back there. */
export const rememberSchemeSource = (policyNo: string, source: string | null) => {
  if (!policyNo) return;
  try {
    // opened without a source (Scheme Admin, or straight after creating it): forget any earlier one
    if (source) sessionStorage.setItem(KEY(policyNo), source);
    else sessionStorage.removeItem(KEY(policyNo));
  } catch {
    /* storage unavailable: fall back to the Scheme Admin list */
  }
};

export const getSchemeSource = (policyNo: string): SchemeSource => {
  try {
    const v = sessionStorage.getItem(KEY(policyNo));
    return v === "endorsements" || v === "renewals" ? v : "";
  } catch {
    return "";
  }
};

/** The scheme page, on a given tab, keeping the list it was opened from. */
export const schemeUrl = (policyNo: string, tab?: string) => {
  const params = new URLSearchParams();
  if (tab) params.set("tab", tab);
  const src = getSchemeSource(policyNo);
  if (src) params.set("source", src);
  const qs = params.toString();
  return `/underwriting/group-life-quotations/${encodeURIComponent(policyNo)}${qs ? `?${qs}` : ""}`;
};

/** The list a scheme is reached from: Endorsements, Scheme Renewals or Scheme Admin. */
export const schemeListUrl = (source?: string | null) =>
  source === "endorsements"
    ? "/underwriting/group-life/endorsement"
    : source === "renewals"
      ? "/underwriting/group-life/scheme-renewals"
      : "/underwriting/group-life-quotations";

export { policyFromPath };
