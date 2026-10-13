// Section-level discounts/loadings for fire calculations.
//
// These are the only section adjustments the API applies (ApplySectionAdjustmentsAsync):
// loadings first, then discounts, each compounding on the running premium.

export type SectionRateKey =
  | "specialDiscountRate"
  | "deductibleDiscountRate"
  | "spreadDiscountRate"
  | "ltaDiscountRate"
  | "theftLoadingRate"
  | "srccLoadingRate"
  | "otherLoading2Rate"

export type SectionRates = Record<SectionRateKey, number>

export interface SectionAdjustmentField {
  key: SectionRateKey
  label: string
  /** Name the API uses in discountsApplied / loadingsApplied */
  apiName: string
  /** Field on the adjustment-preview response holding the amount */
  amountField: string
}

export const SECTION_DISCOUNTS: SectionAdjustmentField[] = [
  { key: "specialDiscountRate", label: "Special Discount", apiName: "Special Discount", amountField: "specialDiscountAmount" },
  { key: "deductibleDiscountRate", label: "Deductible Discount", apiName: "Deductible Discount", amountField: "deductibleDiscountAmount" },
  { key: "spreadDiscountRate", label: "Spread Discount", apiName: "Spread Discount", amountField: "spreadDiscountAmount" },
  { key: "ltaDiscountRate", label: "LTA Discount", apiName: "LTA Discount", amountField: "ltaDiscountAmount" },
]

export const SECTION_LOADINGS: SectionAdjustmentField[] = [
  { key: "theftLoadingRate", label: "Theft Loading", apiName: "Theft Loading", amountField: "theftLoadingAmount" },
  { key: "srccLoadingRate", label: "SRCC Loading", apiName: "SRCC Loading", amountField: "srccLoadingAmount" },
  { key: "otherLoading2Rate", label: "Other Loading", apiName: "Other Loading 2", amountField: "otherLoading2Amount" },
]

export const SECTION_ADJUSTMENT_FIELDS = [...SECTION_DISCOUNTS, ...SECTION_LOADINGS]

export const emptySectionRates = (): SectionRates =>
  SECTION_ADJUSTMENT_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: 0 }), {} as SectionRates)

const toNumber = (v: any) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const findApplied = (list: any, apiName: string) =>
  Array.isArray(list)
    ? list.find((a: any) => String(a?.name ?? "").trim().toLowerCase() === apiName.toLowerCase())
    : undefined

/**
 * Reads a section's adjustment rates from whatever shape it arrived in: a section edited in
 * this session carries the rates as plain fields; a section loaded from a saved calculation
 * carries them inside sectionAdjustments.discountsApplied / loadingsApplied (older API builds
 * only list adjustments whose amount was non-zero, so a missing entry means 0).
 */
export const readSectionRates = (section: any): SectionRates => {
  const rates = emptySectionRates()
  if (!section) return rates

  const adj = section.sectionAdjustments ?? section.__raw?.sectionAdjustments
  SECTION_DISCOUNTS.forEach((f) => {
    const direct = toNumber(section[f.key] ?? section.__raw?.[f.key])
    rates[f.key] = direct > 0 ? direct : toNumber(findApplied(adj?.discountsApplied, f.apiName)?.rate)
  })
  SECTION_LOADINGS.forEach((f) => {
    const direct = toNumber(section[f.key] ?? section.__raw?.[f.key])
    rates[f.key] = direct > 0 ? direct : toNumber(findApplied(adj?.loadingsApplied, f.apiName)?.rate)
  })
  return rates
}

export const hasSectionAdjustments = (rates: SectionRates) =>
  SECTION_ADJUSTMENT_FIELDS.some((f) => rates[f.key] > 0)

/**
 * Rebuilds the adjustment-preview shape (as returned by calculate/section-adjustments)
 * from a saved section, so the modal can show the saved breakdown before anything is re-run.
 */
export const savedSectionAdjustmentResult = (section: any) => {
  const adj = section?.sectionAdjustments ?? section?.__raw?.sectionAdjustments
  if (!adj) return null
  const result: any = {
    startingPremium: toNumber(adj.startingPremium ?? section?.sectionGrossPremium),
    netPremiumDue: toNumber(adj.finalNetPremium ?? section?.sectionNetPremium),
    success: true,
    message: "Saved section adjustments",
  }
  SECTION_DISCOUNTS.forEach((f) => {
    result[f.amountField] = toNumber(findApplied(adj.discountsApplied, f.apiName)?.amount)
  })
  SECTION_LOADINGS.forEach((f) => {
    result[f.amountField] = toNumber(findApplied(adj.loadingsApplied, f.apiName)?.amount)
  })
  return result
}

// ---------------------------------------------------------------------------
// Item-level named discounts/loadings (API FireAdjustmentDto)
// ---------------------------------------------------------------------------

/** AdjustmentBasis enum on the API, sent by name (the API registers a string enum converter) */
export const BASIS_SUM_INSURED = "SumInsured"
export const BASIS_PREMIUM = "Premium"

export interface ItemAdjustment {
  adjustmentName: string
  rate: number | ""
  appliedOn: string
  sequenceOrder?: number
}

export const ITEM_DISCOUNT_SUGGESTIONS = ["Special Discount", "Deductible Discount", "Spread Discount", "LTA Discount", "Other Discount"]
export const ITEM_LOADING_SUGGESTIONS = ["Special Perils", "Malicious Damage", "SRCC", "Other Loading"]

// FEA has its own field on the item; the API folds it into the discount list itself
const FEA_NAME = "fea discount"

// accepts the name in any case, or the enum's number (0 = SumInsured)
const toBasis = (v: any) =>
  v === 0 || String(v).toLowerCase() === "suminsured" ? BASIS_SUM_INSURED : BASIS_PREMIUM

/** Editable item adjustments from whatever the item carries: its own lists, or the saved breakdown. */
export const readItemAdjustments = (item: any): { discounts: ItemAdjustment[]; loadings: ItemAdjustment[] } => {
  const fromList = (own: any, applied: any) => {
    // An input list, even an empty one, is authoritative (the user may have removed every
    // row); the saved breakdown is only a fallback for items that never had one.
    const source = Array.isArray(own) ? own : Array.isArray(applied) ? applied : []
    return source
      .map((a: any) => ({
        adjustmentName: String(a.adjustmentName ?? a.name ?? "").trim(),
        rate: toNumber(a.rate),
        appliedOn: toBasis(a.appliedOn),
        sequenceOrder: toNumber(a.sequenceOrder),
      }))
      .filter((a: ItemAdjustment) => a.adjustmentName && a.adjustmentName.toLowerCase() !== FEA_NAME)
  }
  return {
    discounts: fromList(item?.discounts, item?.discountsApplied),
    loadings: fromList(item?.loadings, item?.loadingsApplied),
  }
}

/** The lists as the calculation endpoints accept them (complete rows only, in order). */
export const toItemAdjustmentInput = (list: ItemAdjustment[] | undefined) =>
  (list || [])
    .filter((a) => String(a.adjustmentName || "").trim() && toNumber(a.rate) > 0)
    .map((a, i) => ({
      adjustmentName: String(a.adjustmentName).trim(),
      rate: toNumber(a.rate),
      appliedOn: toBasis(a.appliedOn),
      sequenceOrder: i + 1,
    }))

// Fields the calculator/breakdown adds to risk items that the calculation endpoints don't accept.
const RISK_ITEM_UI_FIELDS = [
  "actualPremium", "actualPremiumFormula", "shareValue", "shareValueFormula", "premiumValue",
  "premiumValueFormula", "stockDiscountAmount", "feaDiscountAmount", "netPremiumAfterDiscounts",
  "totalSumInsured", "appliedLoadings", "totalItemLoadingAmount", "stockSumInsured", "stockGrossPremium",
  "stockNetPremium", "itemCertNo", "discountsApplied", "loadingsApplied", "appliedDiscounts",
  "totalItemDiscountAmount", "_showStock", "_collapsed", "__raw", "id",
  // the breakdown spells it sectionId; sectionID is set from the section below
  "sectionId",
]

const toRiskItemInput = (item: any, index: number, section: any) => {
  const clean: any = { ...item }
  RISK_ITEM_UI_FIELDS.forEach((k) => delete clean[k])
  const stock = item.stockItem
  const { discounts, loadings } = readItemAdjustments(item)
  return {
    ...clean,
    discounts: toItemAdjustmentInput(discounts),
    loadings: toItemAdjustmentInput(loadings),
    itemNo: toNumber(item.itemNo) || index + 1,
    sectionID: section.sectionID,
    smiCode: item.smiCode ?? "",
    itemDescription: item.itemDescription ?? "",
    actualValue: toNumber(item.actualValue),
    itemRate: toNumber(item.itemRate),
    multiplyRate: toNumber(item.multiplyRate),
    location: item.location ?? section.location ?? "",
    feaDiscountRate: toNumber(item.feaDiscountRate),
    stockItem: stock && toNumber(stock.stockSumInsured) > 0
      ? {
        stockCode: stock.stockCode ?? "",
        stockDescription: stock.stockDescription ?? "",
        stockSumInsured: toNumber(stock.stockSumInsured),
        stockRate: toNumber(item.itemRate), // stock is rated at the item rate
        stockDiscountRate: toNumber(stock.stockDiscountRate),
      }
      : null,
  }
}

/**
 * Section as the complete/recalculate endpoints expect it (FireSectionDto): inputs only,
 * with the section's adjustment rates as plain fields so they're re-applied on save.
 */
export const toFireSectionInput = (section: any) => ({
  sectionID: section.sectionID,
  sectionName: section.sectionName,
  location: section.location ?? "",
  sectionSumInsured: toNumber(section.sectionSumInsured),
  sectionPremium: toNumber(section.sectionPremium ?? section.sectionGrossPremium),
  field26: section.field26 ?? section.Field26 ?? undefined,
  field7: section.field7 ?? section.Field7 ?? undefined,
  field8: section.field8 ?? section.Field8 ?? undefined,
  ...readSectionRates(section),
  riskItems: (section.riskItems || []).map((it: any, i: number) => toRiskItemInput(it, i, section)),
})
