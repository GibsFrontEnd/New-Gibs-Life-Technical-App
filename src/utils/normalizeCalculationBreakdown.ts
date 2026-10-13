//@ts-nocheck

/**
 * Normalises a fire calculation breakdown response so both
 * PolicyCalculator and FireEndorsementCalculator render the same shape.
 *
 * Priority:
 *   1. calculationSteps.sectionCalculations  (has riskItemCalculations.items
 *      with discountsApplied, loadingsApplied, netPremiumAfterDiscounts)
 *   2. inputs.sectionInputs                  (raw shape — fallback)
 *   3. sections / sectionInputs              (legacy)
 */
export const normalizeCalculationBreakdown = (raw: any) => {
    if (!raw) return null
  
    const inputSections =
      raw.calculationSteps?.sectionCalculations ||
      raw.inputs?.sectionInputs ||
      raw.sectionInputs ||
      raw.sections ||
      []
  
    const sectionCalculations = inputSections.map((s: any, idx: number) => {
      const rawItems =
        s.riskItemCalculations?.items ||
        s.riskItems ||
        []
  
      const items = rawItems.map((ri: any, i: number) => ({
        itemNo: ri.itemNo ?? i + 1,
        smiCode: ri.smiCode,
        itemDescription: ri.itemDescription,
        actualValue: ri.actualValue ?? 0,
        itemRate: ri.itemRate ?? 0,
        multiplyRate: ri.multiplyRate ?? 0,
        actualPremium: ri.actualPremium ?? ri.premiumValue ?? 0,
        actualPremiumFormula: ri.actualPremiumFormula ?? "",
        shareValue: ri.shareValue ?? 0,
        shareValueFormula: ri.shareValueFormula ?? "",
        premiumValue: ri.premiumValue ?? 0,
        premiumValueFormula: ri.premiumValueFormula ?? "",
        stockItem: ri.stockItem ?? null,
        stockDiscountAmount: ri.stockDiscountAmount ?? 0,
        stockNetPremium: ri.stockNetPremium ?? 0,
        feaDiscountRate: ri.feaDiscountRate ?? 0,
        feaDiscountAmount: ri.feaDiscountAmount ?? 0,
        netPremiumAfterDiscounts: ri.netPremiumAfterDiscounts ?? 0,
  
        // ---- the rich fields ----
        discountsApplied: ri.discountsApplied ?? [],
        loadingsApplied: ri.loadingsApplied ?? [],
        totalItemDiscountAmount:
          ri.totalItemDiscountAmount ??
          (ri.discountsApplied || []).reduce(
            (sum: number, d: any) => sum + (d.amount || 0),
            0
          ),
        totalItemLoadingAmount:
          ri.totalItemLoadingAmount ??
          (ri.loadingsApplied || []).reduce(
            (sum: number, l: any) => sum + (l.amount || 0),
            0
          ),
  
        sectionId: ri.sectionId ?? ri.sectionID ?? s.sectionID,
        location: ri.location ?? s.location,
        __raw: ri,
      }))
  
      const secAdj = s.sectionAdjustments || {}
  
      return {
        sectionID: s.sectionID ?? `section-${idx}`,
        sectionName: s.sectionName ?? s.sectionDisplayName ?? `Section ${idx + 1}`,
        location: s.location,
        riskItemCalculations: {
          items,
          totals: {
            totalActualValue:
              s.sectionSumInsured ??
              s.riskItemCalculations?.totals?.totalActualValue ??
              items.reduce((a: number, it: any) => a + (it.actualValue || 0), 0),
            totalSharePremium:
              s.sectionGrossPremium ??
              s.riskItemCalculations?.totals?.totalSharePremium ??
              items.reduce((a: number, it: any) => a + (it.actualPremium || 0), 0),
            totalNetPremiumAfterDiscounts:
              s.sectionNetPremium ??
              s.riskItemCalculations?.totals?.totalNetPremiumAfterDiscounts ??
              0,
          },
        },
        sectionAdjustments: {
          startingPremium: secAdj.startingPremium ?? s.sectionGrossPremium ?? 0,
          discountsApplied: secAdj.discountsApplied ?? s.discountsApplied ?? [],
          loadingsApplied: secAdj.loadingsApplied ?? s.loadingsApplied ?? [],
          finalNetPremium: secAdj.finalNetPremium ?? s.sectionNetPremium ?? 0,
          totalDiscountAmount: secAdj.totalDiscountAmount ?? 0,
          totalLoadingAmount: secAdj.totalLoadingAmount ?? 0,
          netAdjustmentAmount: secAdj.netAdjustmentAmount ?? 0,
        },
        __raw: s,
      }
    })
  
    const finalResults = raw.finalResults ?? {
      totalSumInsured: inputSections.reduce(
        (acc: number, s: any) => acc + (s.sectionSumInsured || 0),
        0
      ),
      totalPremium: inputSections.reduce(
        (acc: number, s: any) => acc + (s.sectionGrossPremium || 0),
        0
      ),
      netPremium: inputSections.reduce(
        (acc: number, s: any) => acc + (s.sectionNetPremium || 0),
        0
      ),
    }
  
    return {
      ...raw,
      calculationSteps: {
        ...(raw.calculationSteps || {}),
        sectionCalculations,
        proRataCalculations:
          raw.calculationSteps?.proRataCalculations ?? raw.proRataCalculations,
      },
      finalResults,
      inputs: raw.inputs ?? raw,
    }
  }