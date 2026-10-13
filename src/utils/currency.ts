// Money in a policy's own currency. Sums insured and premiums are entered and stored in the
// policy's currency (exCurrency); the API's "foreign" figures are those × exRate, i.e. Naira.

export const BASE_CURRENCY = "NGN"

const currencyCode = (currency?: string | null) => {
  const code = String(currency || "").trim().toUpperCase()
  return /^[A-Z]{3}$/.test(code) ? code : BASE_CURRENCY
}

/** e.g. formatMoney(1500, "USD") → "$1,500.00", formatMoney(1500) → "₦1,500.00" */
export const formatMoney = (
  amount: number | string | null | undefined,
  currency?: string | null,
  empty = "—",
) => {
  if (amount === null || amount === undefined || amount === "" || Number.isNaN(Number(amount))) return empty
  const code = currencyCode(currency)
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: code, currencyDisplay: "narrowSymbol" }).format(Number(amount))
  } catch {
    return `${code} ${Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
}

/** "$", "₦", "€"… */
export const currencySymbol = (currency?: string | null) => formatMoney(0, currency).replace(/[\d.,\s]/g, "")

/** The API writes its step formulas in Naira ("₦1,000.00 × 5%"); show them in the policy's currency. */
export const formulaInCurrency = (formula: string | null | undefined, currency?: string | null) =>
  formula && isForeignCurrency(currency) ? formula.split("₦").join(currencySymbol(currency)) : formula || ""

/** The policy's currency, from a policy or calculation object. */
export const policyCurrency = (policy: any): string =>
  currencyCode(policy?.exCurrency ?? policy?.currency ?? policy?.inputs?.currency)

export const isForeignCurrency = (currency?: string | null) => currencyCode(currency) !== BASE_CURRENCY
