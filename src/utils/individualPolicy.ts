// Helpers shared by the individual-life policy pages (investment "B" and traditional "A").

const FREQUENCY_LABELS: Record<string, string> = {
  SINGLE: "Single",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  "HALF-YEARLY": "Half-Yearly",
  ANNUALLY: "Annually",
  ANNUAL: "Annually",
  WEEKLY: "Weekly",
  FORTNIGHTLY: "Fortnightly",
  FORTHNIGHTLY: "Fortnightly",
  DAILY: "Daily",
};

const GENDER_LABELS: Record<string, string> = { M: "Male", F: "Female", MALE: "Male", FEMALE: "Female" };

const dateOnly = (d: unknown): string => (d ? String(d).split("T")[0] ?? "" : "");

/** Duration is a number of YEARS (that is what the rate tables and the API use). */
export const maturityFor = (start: string, years: number): string => {
  const d = new Date(start);
  if (isNaN(d.getTime()) || !years || years < 0) return "";
  d.setUTCFullYear(d.getUTCFullYear() + Math.floor(years));
  return d.toISOString();
};

/**
 * The policy list/edit data uses policy-master field names (coverCode, fop, sex, dateofBirth, startDate…),
 * the setup forms use request names (productCode, frequency, gender, dateOfBirth, issueDate…).
 * Without this mapping an edit opens with defaults and saves them over the real policy.
 */
export const policyToForm = (p: any, empty: any) => {
  const fop = String(p.fop ?? p.frequency ?? "").trim().toUpperCase();
  const sex = String(p.sex ?? p.gender ?? "").trim().toUpperCase();
  const num = (v: unknown, fallback = 0) => (v === null || v === undefined || v === "" ? fallback : Number(v));

  return {
    ...empty,
    ...p,
    policyNo: p.policyNo ?? p.proposalNo ?? "",
    brCode: p.brCode ?? empty.brCode,
    productCode: p.coverCode ?? p.productCode ?? "",
    frequency: FREQUENCY_LABELS[fop] ?? empty.frequency,
    gender: GENDER_LABELS[sex] ?? p.gender ?? p.sex ?? "",
    agentCode: p.agentcode ?? p.agentCode ?? "",
    religion: p.relgion ?? p.religion ?? empty.religion,
    regularSaving: num(p.basicPremium ?? p.regularSaving),
    // one of the two drives the calculation: keep the stored sum assured, let the API re-price the premium
    sumAssured: num(p.sumAssured),
    firstPremium: 0,
    extraRate: num(p.xMas ?? p.extraRate),
    loadingRate: num(p.loading ?? p.loadingRate),
    duration: num(p.duration, empty.duration),
    remark: p.cardNo || p.remark || "PREMIUM",
    mop: p.mop ?? "",
    dateOfBirth: dateOnly(p.dateofBirth ?? p.dateOfBirth),
    issueDate: dateOnly(p.startDate ?? p.issueDate),
    expiryDate: dateOnly(p.maturityDate ?? p.expiryDate),
    dateofpayment: dateOnly(p.dateofpayment),
    dateEmployed: dateOnly(p.dateEmployed),
  };
};
