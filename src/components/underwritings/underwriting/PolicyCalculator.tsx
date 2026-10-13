//@ts-nocheck
import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "../../../features/store"
import { useNavigate, useParams, useOutletContext } from "react-router-dom"
import type { RootState } from "../../../features/store"
import {
  getPolicyByNumber,
  calculatePolicyComplete,
  recalculatePolicyComplete,
  getPolicyCurrentCalculation,
  getPolicyCalculationBreakdown,
  setSectionsSummary,
  setCalculationBreakdown,
  setCurrentCalculation,
  clearMessages,
  calculatePolicyMultiSectionAggregate,
  applyPolicyAdjustments,
  calculatePolicyProRata,
  fetchPolicyCalculations,
  calculateAdditionalPolicy,
  getAdjustmentOptions,
  getMotorAdjustmentTypes,
  getSubriskFields,
  getSectionCalculationSummary,
  setCurrentPolicy,
  getMotorCalculations,
  recalculateFireProposalComplete,
} from "../../../features/reducers/underwriteReducers/underwritingSlice"
import { fetchProducts } from "../../../features/reducers/productReducers/productSlice"
import { inclusiveCoverDays } from "../../../utils/cover-days"
import { toFireSectionInput } from "../../../utils/section-adjustments"
import { apiErrorMessage } from "../../../utils/api-error"
import { formatMoney, policyCurrency } from "../../../utils/currency"
import { Button } from "../../ui/new-button"
import Input from "../../ui/Input"
import { Label } from "../../ui/label"
import { AddPolicySectionModal } from "../Modals/AddPolicySectionModal"
import type {
  PolicySection,
  CompletePolicyCalculationRequest,
  PolicyAdjustments,
  PolicyAggregateTotals,
} from "../../../types/underwriting"
import "./PolicyCalculator.css"
import { toast } from "@/components/ui/use-toast"
import MotorPolicyCalculator from "./MotorPolicyCalculator"
import { getAllRisks } from "../../../features/reducers/adminReducers/riskSlice"
import { Loader2, Printer } from "lucide-react"

// helpers
const getLatestSectionSummaries = (rawSections: any[] | undefined) => {
  if (!Array.isArray(rawSections) || rawSections.length === 0) return []

  const map = new Map<string, any>()
  rawSections.forEach((s) => {
    const id = s.sectionID ?? JSON.stringify(s)
    const existing = map.get(id)
    const ts = s.lastCalculated ? Date.parse(s.lastCalculated) : 0
    const existingTs = existing && existing.lastCalculated ? Date.parse(existing.lastCalculated) : 0
    if (!existing || ts >= existingTs) map.set(id, s)
  })

  return Array.from(map.values())
}

export const extractSectionsFromData = (data: any): any[] => {
  if (!data) return []

  const safeParse = (val: any) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val)
      } catch {
        return null
      }
    }
    return val
  }

  const parsedData = safeParse(data)
  if (!parsedData || typeof parsedData !== "object") return []

  const inputs = safeParse(parsedData.inputs)
  const calculationSteps = safeParse(parsedData.calculationSteps)

  const candidates = [
    inputs?.sectionInputs,
    inputs?.sections,
    parsedData.sectionInputs,
    parsedData.sections,
    calculationSteps?.sectionCalculations,
    calculationSteps?.sectionInputs,
    calculationSteps?.sections,
    parsedData.sectionCalculations,
  ]

  let rawList: any[] | null = null
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      rawList = candidate
      break
    }
  }

  if (!rawList && parsedData.sections && Array.isArray(parsedData.sections.sections)) {
    rawList = parsedData.sections.sections
  }

  if (!rawList || rawList.length === 0) {
    if (Array.isArray(parsedData) && parsedData.length > 0) {
      rawList = parsedData
    } else {
      return []
    }
  }

  return rawList.map((s: any, idx: number) => {
    const riskItems = s.riskItems || s.riskItemCalculations?.items || []
    const sumInsured =
      s.sectionSumInsured ??
      s.sumInsured ??
      (riskItems.length > 0
        ? riskItems.reduce((acc: number, it: any) => acc + (Number(it.actualValue) || Number(it.sumInsured) || 0), 0)
        : 0)

    const grossPremium =
      s.sectionGrossPremium ??
      s.sectionPremium ??
      s.grossPremium ??
      s.premium ??
      (riskItems.length > 0
        ? riskItems.reduce((acc: number, it: any) => acc + (Number(it.actualPremium) || Number(it.premium) || 0), 0)
        : 0)

    const netPremium = s.sectionNetPremium ?? s.netPremium ?? grossPremium

    return {
      ...s,
      sectionID: s.sectionID ?? s.sectionId ?? `SEC-${idx + 1}`,
      sectionName: s.sectionName ?? s.name ?? `Section ${idx + 1}`,
      location: s.location ?? "",
      sectionSumInsured: Number(sumInsured) || 0,
      sectionGrossPremium: Number(grossPremium) || 0,
      sectionPremium: Number(grossPremium) || 0,
      sectionNetPremium: Number(netPremium) || 0,
      riskItems: Array.isArray(riskItems) ? riskItems : [],
      lastCalculated: s.lastCalculated ?? s.lastCalculatedOn ?? s.calculatedOn ?? parsedData.calculatedOn ?? null,
    }
  })
}

const normalizeCalculationBreakdown = (raw: any) => {
  if (!raw) return null

  const safeParse = (val: any) => {
    if (typeof val === "string") {
      try { return JSON.parse(val) } catch { return null }
    }
    return val
  }

  const parsedInputs = safeParse(raw.inputs)
  const parsedSteps = safeParse(raw.calculationSteps)

  const rawWithParsed = {
    ...raw,
    inputs: parsedInputs ?? raw.inputs,
    calculationSteps: parsedSteps ?? raw.calculationSteps,
  }

  if (rawWithParsed.calculationSteps?.sectionCalculations) return rawWithParsed

  const inputSections =
    rawWithParsed.inputs?.sectionInputs ||
    rawWithParsed.inputs?.sections ||
    rawWithParsed.sectionInputs ||
    rawWithParsed.sections ||
    []
  const sectionCalculations = (inputSections || []).map((s: any, idx: number) => {
    const items = (s.riskItems || []).map((ri: any, i: number) => ({
      itemNo: ri.itemNo ?? i + 1,
      smiCode: ri.smiCode,
      itemDescription: ri.itemDescription,
      actualValue: ri.actualValue ?? 0,
      itemRate: ri.itemRate ?? 0,
      actualPremium: ri.actualPremium ?? ri.premiumValue ?? 0,
      actualPremiumFormula: ri.actualPremiumFormula ?? ri.actualPremiumFormula,
      stockDiscountAmount: ri.stockDiscountAmount ?? 0,
      feaDiscountAmount: ri.feaDiscountAmount ?? 0,
      netPremiumAfterDiscounts: ri.netPremiumAfterDiscounts ?? 0,
      shareValue: ri.shareValue ?? 0,
      premiumValue: ri.premiumValue ?? 0,
      multiplyRate: ri.multiplyRate ?? 0,
      sectionId: ri.sectionId ?? s.sectionID,
      location: ri.location ?? s.location,
      __raw: ri,
    }))

    return {
      sectionID: s.sectionID ?? `section-${idx}`,
      sectionName: s.sectionName ?? s.sectionDisplayName ?? `Section ${idx + 1}`,
      location: s.location,
      riskItemCalculations: {
        items,
        totals: {
          totalActualValue: s.sectionSumInsured ?? items.reduce((a: number, it: any) => a + (it.actualValue || 0), 0),
          totalSharePremium:
            s.sectionGrossPremium ?? items.reduce((a: number, it: any) => a + (it.actualPremium || 0), 0),
          totalNetPremiumAfterDiscounts: s.sectionNetPremium ?? 0,
        },
      },
      sectionAdjustments: {
        startingPremium: s.sectionGrossPremium ?? 0,
        discountsApplied: s.discountsApplied || [],
        loadingsApplied: s.loadingsApplied || [],
        finalNetPremium: s.sectionNetPremium ?? 0,
      },
      __raw: s,
    }
  })

  const finalResults = raw.finalResults ?? {
    totalSumInsured: inputSections.reduce((acc: number, s: any) => acc + (s.sectionSumInsured || 0), 0),
    totalPremium: inputSections.reduce((acc: number, s: any) => acc + (s.sectionGrossPremium || 0), 0),
    netPremium: inputSections.reduce((acc: number, s: any) => acc + (s.sectionNetPremium || 0), 0),
  }

  return {
    ...raw,
    calculationSteps: {
      sectionCalculations,
      proRataCalculations: raw.inputs?.proRataCalculations ?? raw.proRataCalculations,
    },
    finalResults,
    inputs: raw.inputs ?? raw,
  }
}

const PolicyCalculator = () => {
  // ===== ALL HOOKS AT THE VERY TOP =====
  const { policyNo: encodedPolicyNo } = useParams<{ policyNo: string }>()
  const policyNo = encodedPolicyNo ? decodeURIComponent(encodedPolicyNo) : ''
  console.log('🔍 Policy number from URL:', policyNo)
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const { isReadOnly } = useOutletContext<{ isReadOnly: boolean }>() || { isReadOnly: false };

  const {
    currentPolicy = null,
    currentCalculation = null,
    calculationHistory = [],
    calculationBreakdown = null,
    sectionsSummary: storeSectionsSummary = null,
    loading = {},
    success = {},
    error = {},
    adjustmentOptions = null,
    motorCalculationHistory = [],
  } = useSelector((state: RootState) => state.underwritings) || {}

  const { products } = useSelector((state: RootState) => state.products)
  const { risks } = useSelector((state: RootState) => state.risks)

  // ===== ALL useState hooks =====
  const [showAddSectionModal, setShowAddSectionModal] = useState(false)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [adjCollapse, setAdjCollapse] = useState(true)
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false)

  const [adjustments, setAdjustments] = useState<any>({
    otherDiscountsRate: 0,
    otherLoadingsRate: 0,
  })

  const [remarks, setRemarks] = useState("")
  const [normalizedBreakdown, setNormalizedBreakdown] = useState<any | null>(null)
  const [aggregateTotals, setAggregateTotals] = useState<PolicyAggregateTotals | null>(null)
  const [sectionsLoading, setSectionsLoading] = useState(false)
  const [localSectionsSummary, setLocalSectionsSummary] = useState<any | null>(null)
  const [payloadSection, setPayloadSection] = useState<any[] | null>([])
  const [localSections, setLocalSections] = useState<PolicySection[] | null>(null)
  const [calculatedRiskMap, setCalculatedRiskMap] = useState<Record<string, any[]>>({})
  const [editedSections, setEditedSections] = useState<number[]>([]);
  const [proposalAdjustmentsResult, setProposalAdjustmentsResult] = useState<any | null>(null)
  const [coverDays, setCoverDays] = useState<number>(365)
  const [proRataResult, setProRataResult] = useState<any | null>(null)

  const [subRiskFields, setSubRiskFields] = useState<any[]>([])
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, any>>({})
  const [activeCalculationId, setActiveCalculationId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [loadingSubRisks, setLoadingSubRisks] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [downloadingBrokingSlip, setDownloadingBrokingSlip] = useState(false);
  const [isApplyingAdjustments, setIsApplyingAdjustments] = useState(false);
  const [isCalculatingProRata, setIsCalculatingProRata] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const actualRiskID = currentPolicy?.riskID;
  const sectionsFetchIdRef = useRef(0)
  // true while localSections were filled from the store/server (vs. built by the user)
  const sectionsFromServerRef = useRef(false)
  const viewModeInitializedRef = useRef(false)
  const netPremium = proposalAdjustmentsResult?.netPremiumDue || calculationBreakdown?.calculationSteps?.proRataCalculations?.netPremiumBeforeProRata

  // ===== MOTOR CHECK - Just for detecting motor policy =====
  const isMotorPolicy = (() => {
    if (!currentPolicy) return false;
    
    // Check 1: Check riskName from risks array using riskID
    if (risks && risks.length > 0) {
      const risk = risks.find(r => r.riskID === currentPolicy.riskID);
      if (risk?.riskName?.toLowerCase().includes("motor")) {
        console.log('✅ [PolicyCalculator] Detected motor via riskName:', risk.riskName);
        return true;
      }
    }
    
    // Check 2: Check riskClass from the policy itself
    const riskClass = currentPolicy.riskClass || currentPolicy.subRisk || '';
    if (riskClass === 'V' || riskClass === 'MOTOR' || riskClass?.toLowerCase().includes('motor')) {
      console.log('✅ [PolicyCalculator] Detected motor via riskClass:', riskClass);
      return true;
    }
    
    // Check 3: Check if there are motor calculations
    if (motorCalculationHistory && motorCalculationHistory.length > 0) {
      console.log('✅ [PolicyCalculator] Detected motor via motorCalculationHistory');
      return true;
    }
    
    console.log('❌ [PolicyCalculator] Not a motor policy. riskClass:', currentPolicy?.riskClass);
    return false;
  })();

  // ===== ALL useEffect hooks =====
  
  // 1. Cleanup on policy change
  useEffect(() => {
    console.log("PolicyCalculator policyNo:", policyNo);

    setLocalSections(null)
    sectionsFromServerRef.current = false
    setLocalSectionsSummary(null)
    setCalculatedRiskMap({})
    setProposalAdjustmentsResult(null)
    setProRataResult(null)
    setNormalizedBreakdown(null)
    setAggregateTotals(null)
    setShowDetailedBreakdown(false)
    setIsDataReady(false)
    setInitialLoadComplete(false)

    dispatch(setCalculationBreakdown(null))
    dispatch(setCurrentCalculation(null))
    dispatch(setSectionsSummary(null))
  }, [policyNo, dispatch])

  // 2. Cleanup on unmount
  useEffect(() => {
    return () => {
      setProRataResult(null)
      setProposalAdjustmentsResult(null)
      dispatch(setCalculationBreakdown(null))
      dispatch(setCurrentCalculation(null))
    }
  }, [])

  // 3. Fetch adjustment options
  useEffect(() => {
    dispatch(getAdjustmentOptions() as any)
    dispatch(getMotorAdjustmentTypes() as any)
  }, [dispatch])

  // 4. Fetch sub-risk fields when riskID is available
  useEffect(() => {
    if (currentPolicy?.riskID) {
      setLoadingSubRisks(true);
      dispatch(getSubriskFields(currentPolicy.riskID) as any)
        .then((res: any) => {
          let fields = [];
          if (res.payload && Array.isArray(res.payload)) {
            fields = res.payload;
          } else if (res.payload && typeof res.payload === 'object') {
            fields = [res.payload];
          }

          if (fields.length > 0) {
            const validFields = fields.filter((f: any) =>
              f.dbSectionField &&
              f.dbSectionField !== "-" &&
              f.dbSectionField.trim() !== ""
            );
            setSubRiskFields(validFields)
          } else {
            setSubRiskFields([]);
          }
        })
        .catch((err: any) => {
          console.error("getSubriskFields dispatch error:", err);
        })
        .finally(() => {
          setLoadingSubRisks(false);
        });
    }
  }, [dispatch, currentPolicy?.riskID])

  // 5. Populate dynamic fields from currentCalculation or breakdown if available
  useEffect(() => {
    if (calculationBreakdown?.inputs?.sectionInputs?.[0]) {
      const firstSection = calculationBreakdown.inputs.sectionInputs[0];
      if (firstSection && subRiskFields.length > 0) {
        const newValues: Record<string, any> = {};
        subRiskFields.forEach(field => {
          const dbField = field.dbSectionField;
          if (firstSection[dbField] !== undefined) {
            newValues[dbField] = firstSection[dbField];
          } else if (firstSection[dbField.toLowerCase()] !== undefined) {
            newValues[dbField] = firstSection[dbField.toLowerCase()];
          }
        });
        setDynamicFieldValues(prev => ({ ...prev, ...newValues }));
      }
    }
  }, [calculationBreakdown, subRiskFields])

  // 6. MAIN DATA FETCHING EFFECT
  useEffect(() => {
    if (!policyNo) return;

    const fetchData = async () => {
      setSectionsLoading(true);
      setIsDataReady(false);
      setInitialLoadComplete(false);
      
      try {
        console.log("🔄 Fetching policy data for:", policyNo);
        
        // Fetch policy data first
        await dispatch(getPolicyByNumber(policyNo) as any).unwrap();
        console.log("✅ Policy data fetched");
        
        // Fetch risks if not loaded
        if (!risks || risks.length === 0) {
          console.log("🔄 Fetching risks...");
          await dispatch(getAllRisks({ pageNumber: 1, pageSize: 100 }) as any).unwrap();
          console.log("✅ Risks fetched");
        }
        
        // Fetch calculations list
        console.log("🔄 Fetching calculations list...");
        const calcs = await dispatch(fetchPolicyCalculations(policyNo) as any).unwrap();
        console.log("✅ Calculations list fetched");

        // Fetch saved sections summary
        console.log("🔄 Fetching saved sections summary...");
        await dispatch(getSectionCalculationSummary(policyNo) as any).unwrap().catch((err: any) => {
          console.warn("⚠️ getSectionCalculationSummary error:", err);
          return null;
        });

        // If motor policy, fetch motor calculations
        if (isMotorPolicy) {
          console.log("🔄 Fetching motor calculations...");
          await dispatch(getMotorCalculations(policyNo) as any).unwrap();
          console.log("✅ Motor calculations fetched");
        } else if (Array.isArray(calcs) && calcs.length > 0) {
          // Pre-fetch breakdown for the calculation that has sections (or latest)
          const calcWithSections = calcs.find((c: any) => c.sectionCount > 0) || calcs[0];
          if (calcWithSections?.detailID) {
            await dispatch(getPolicyCalculationBreakdown({ policyNo, detailID: calcWithSections.detailID }) as any).unwrap().catch(() => null);
          }
        }
        
        console.log("✅ All data fetched successfully");
        setIsDataReady(true);
        setInitialLoadComplete(true);
        
        // Initialize view mode after data is loaded
        if (!viewModeInitializedRef.current) {
          setViewMode('list');
          viewModeInitializedRef.current = true;
        }
        
      } catch (err) {
        console.error("❌ Failed to fetch policy data:", err);
        setIsDataReady(true);
        setInitialLoadComplete(true);
      } finally {
        setSectionsLoading(false);
      }
    };

    fetchData();
  }, [dispatch, policyNo]);

  // 7. FETCH MOTOR CALCULATIONS (redundant - kept for backwards compatibility)
  useEffect(() => {
    if (!policyNo || !isMotorPolicy) {
      console.log(`⏭️ Skipping motor fetch: policyNo=${policyNo}, isMotor=${isMotorPolicy}`);
      return;
    }

    console.log(`🔄 Fetching motor calculations for policy: ${policyNo}`);

    dispatch(getMotorCalculations(policyNo) as any)
      .unwrap()
      .then((data: any[]) => {
        console.log(`✅ Motor calculations fetched: ${data?.length || 0} records for policy ${policyNo}`);
        console.log('📊 Full data:', data);
      })
      .catch((err: any) => {
        console.error(`❌ Failed to fetch motor calculations for ${policyNo}:`, err);
        console.error('Error details:', err.message || err);
      });
  }, [policyNo, isMotorPolicy, dispatch]);

  // 8. Process section inputs from calculation breakdown or policy data
  useEffect(() => {
    // The store still holds the previous policy's data for a moment after navigating here
    // (and until this policy's own requests finish), so skip anything tagged with another policy.
    const belongsToPolicy = (data: any) => {
      if (!data) return false
      const owner = data.proposalNo ?? data.policyNo ?? data.inputs?.proposalNo ?? data.inputs?.policyNo
      return !owner || owner === policyNo
    }
    const fromPolicy = (data: any) => (belongsToPolicy(data) ? extractSectionsFromData(data) : [])

    // 1. Try calculationBreakdown first
    let extracted = fromPolicy(calculationBreakdown)

    // 2. If not found, try normalizedBreakdown
    if (extracted.length === 0 && normalizedBreakdown) {
      extracted = fromPolicy(normalizedBreakdown)
    }

    // 3. If not found, try currentCalculation
    if (extracted.length === 0 && currentCalculation) {
      extracted = fromPolicy(currentCalculation)
    }

    // 4. If not found, try storeSectionsSummary
    if (extracted.length === 0 && storeSectionsSummary) {
      extracted = fromPolicy(storeSectionsSummary)
    }

    // 5. If not found, try currentPolicy (policy might have saved sections)
    if (extracted.length === 0 && currentPolicy) {
      extracted = fromPolicy(currentPolicy)
    }

    if (extracted.length > 0) {
      console.log(`✅ [PolicyCalculator] Successfully extracted ${extracted.length} section(s):`, extracted)
      sectionsFromServerRef.current = true
      setLocalSections(extracted)
      setLocalSectionsSummary((prev: any) => {
        const copy = prev ? { ...prev } : { policyNo, sections: [] }
        copy.sections = extracted
        return copy
      })
      setSectionsLoading(false)
      return
    }

    // Nothing for this policy: drop sections that were loaded from the store (e.g. the previous
    // policy's), but never sections the user is building for a new calculation.
    if (sectionsFromServerRef.current) {
      sectionsFromServerRef.current = false
      setLocalSections([])
      setLocalSectionsSummary(null)
      setSectionsLoading(false)
      return
    }

    if (viewMode === 'detail' && activeCalculationId === null) {
      console.log("⏭️ No active calculation, skipping section setup")
      return
    }

    if (calculationBreakdown && !storeSectionsSummary && (!localSectionsSummary || !localSectionsSummary.sections?.length)) {
      console.log("ℹ️ No section calculations found for policy in breakdown")
      setLocalSections([])
      setSectionsLoading(false)
    }
  }, [calculationBreakdown, normalizedBreakdown, currentCalculation, storeSectionsSummary, currentPolicy, viewMode, activeCalculationId, policyNo])

  // 9. Set adjustments from calculation breakdown
  useEffect(() => {
    if (calculationBreakdown?.inputs?.proposalAdjustments) {
      setAdjustments({
        otherDiscountsRate: calculationBreakdown?.inputs?.proposalAdjustments.otherDiscountsRate || 0,
        otherLoadingsRate: calculationBreakdown?.inputs?.proposalAdjustments.otherLoadingsRate || 0,
      })
      if (currentCalculation?.remarks) setRemarks(currentCalculation.remarks)
    }
  }, [calculationBreakdown?.inputs?.proposalAdjustments])

  // 10. Calculate cover days from policy dates (inclusive of both start and end date)
  useEffect(() => {
    const days = inclusiveCoverDays(currentPolicy?.startDate, currentPolicy?.endDate)
    if (days) setCoverDays(days)
  }, [currentPolicy?.startDate, currentPolicy?.endDate])

  // 11. Fetch products
  useEffect(() => {
    if (policyNo) {
      const policyProductId = currentPolicy && currentPolicy.riskID
      if (policyProductId) {
        dispatch(
          fetchProducts({
            riskId: policyProductId,
            pageNumber: 1,
            pageSize: 100,
          }) as any,
        )
      }
    }
  }, [dispatch, policyNo, currentPolicy])

  // 12. Clear messages on successful calculation
  useEffect(() => {
    if (success?.calculate) dispatch(clearMessages() as any)
  }, [success?.calculate, dispatch])

  // 13. Normalize calculation breakdown
  useEffect(() => {
    if (calculationBreakdown) {
      try {
        const normalized = normalizeCalculationBreakdown(calculationBreakdown)
        setNormalizedBreakdown(normalized)
      } catch (err) {
        console.error("Normalization failed:", err)
        setNormalizedBreakdown(null)
      }
    } else {
      setNormalizedBreakdown(null)
    }
  }, [calculationBreakdown])

  // 14. Calculate multi-section aggregate when in detail view. Keyed on the section figures,
  // not just the count, so editing a section (same count) refreshes the totals too.
  const sectionsSignature = (localSections || [])
    .map((s: any) => `${s.sectionID}:${Number(s.sectionSumInsured) || 0}:${Number(s.sectionNetPremium) || 0}`)
    .join("|")
  useEffect(() => {
    if (isDataReady && viewMode === 'detail' && localSections?.length > 0) {
      calculateMultiSectionAggregateLocal();
    }
  }, [sectionsSignature, viewMode, isDataReady])

  // 14b. Keep the policy-level adjustment preview in step with the sections' total and the
  // policy rates, so the pro-rata below never runs on a stale net premium.
  useEffect(() => {
    if (!isDataReady || !(Number(aggregateTotals?.totalAggregatePremium) > 0)) return
    const timer = setTimeout(() => { handleApplyPolicyAdjustments(true) }, 400)
    return () => clearTimeout(timer)
  }, [aggregateTotals?.totalAggregatePremium, adjustments.otherDiscountsRate, adjustments.otherLoadingsRate, isDataReady])

  // 15. Auto-calculate pro-rata when net premium changes
  useEffect(() => {
    if (isDataReady && netPremium) {
      handleCalculateProRata();
    }
  }, [netPremium, coverDays, isDataReady])

  const policyProductId = currentPolicy && currentPolicy.subRiskID
  const currentProduct = products.find((p) => p.productID === policyProductId)

  const isPolicyMatching = currentPolicy && (currentPolicy.policyNo === policyNo || currentPolicy.proposalNo === policyNo);

  // ===== LOADING STATE =====
  const isLoading = loading?.fetchPolicy || 
                    loading?.fetchPolicies || 
                    !isDataReady || 
                    !initialLoadComplete;

  console.log("🔄 Loading check:", {
    fetchPolicy: loading?.fetchPolicy,
    fetchPolicies: loading?.fetchPolicies,
    isDataReady,
    initialLoadComplete,
    isLoading,
    isMotorPolicy
  });

  // ===== FUNCTIONS =====
  const handleAddSection = () => {
    setEditingSectionId(null)
    setShowAddSectionModal(true)
  }

  const handleEditSection = (sectionId: string) => {
    setEditingSectionId(sectionId)
    setShowAddSectionModal(true)
  }

  /** Complete/recalculate request for the given sections, with every section's own discount/loading rates. */
  const buildCalculationRequest = (sections: any[]): CompletePolicyCalculationRequest => ({
    policyNo,
    proposalNo: policyNo,
    sections: sections.map(toFireSectionInput),
    proportionRate: currentPolicy?.proportionRate || 100,
    exchangeRate: currentPolicy?.exRate || 1,
    currency: currentPolicy?.exCurrency || "NGN",
    coverDays: coverDays || 365,
    ...adjustments,
    calculatedBy: "SYSTEM",
    remarks: remarks || "Policy calculation",
  })

  /**
   * Saves the full section list over the calculation being edited (PUT calculations/fire/{detailID}),
   * then reloads it from the server. Throws with the API's message on failure.
   */
  const persistSavedCalculation = async (sections: any[]) => {
    if (!activeCalculationId || !policyNo) return
    const request = buildCalculationRequest(sections)
    await dispatch(recalculatePolicyComplete({
      policyNo,
      detailID: activeCalculationId,
      calculationData: { ...request, detailID: String(activeCalculationId) },
    }) as any).unwrap()

    await dispatch(getPolicyCalculationBreakdown({ policyNo, detailID: activeCalculationId }) as any)
    await dispatch(getSectionCalculationSummary(policyNo) as any)
    await dispatch(fetchPolicyCalculations(policyNo) as any)
    dispatch(getPolicyByNumber(policyNo) as any)
  }

  const applyLocalSections = (sections: any[]) => {
    sectionsFromServerRef.current = false
    setLocalSections(sections)
    setPayloadSection(sections)
    setLocalSectionsSummary((prev: any) => ({ ...(prev || {}), policyNo, sections }))
  }

  const handleSaveSection = async (fullsection: any) => {
    const current = localSections ? [...localSections] : []
    const idx = editingSectionId == null ? -1 : Number(editingSectionId)
    const isEdit = idx >= 0 && idx < current.length
    const nextSections = isEdit
      ? current.map((s, i) => (i === idx ? fullsection : s))
      : [...current, fullsection]

    // Editing a saved Fire calculation: save the whole calculation (keyed by its detailID) so the
    // section, its discounts/loadings and the policy totals are stored together.
    if (activeCalculationId && policyNo && !isMotorPolicy) {
      try {
        setLocalLoading(true)
        await persistSavedCalculation(nextSections)
        toast({
          description: isEdit ? "Section updated and calculation saved." : "Section added and calculation saved.",
          variant: "success",
          duration: 1500,
        })
        setShowAddSectionModal(false)
        setEditingSectionId(null)
      } catch (err: any) {
        // Keep the modal open with the user's changes so they can retry
        toast({
          description: `Could not save the section: ${apiErrorMessage(err)}`,
          variant: "destructive",
          duration: 4000,
        })
      } finally {
        setLocalLoading(false)
      }
      return
    }

    // New calculation (not saved yet): keep the sections locally until Calculate
    applyLocalSections(nextSections)
    if (isEdit) {
      setEditedSections((prev) => (prev.includes(idx) ? prev : [...prev, idx]))
    }
    setShowAddSectionModal(false)
    setEditingSectionId(null)
    setIsCalculated(false)
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!window.confirm("Are you sure you want to delete this section?")) return

    const remaining = (localSections || []).filter((_, index) => index !== sectionId)

    if (activeCalculationId && policyNo && !isMotorPolicy) {
      if (remaining.length === 0) {
        toast({
          description: "A calculation needs at least one section. Add the replacement section first, then delete this one.",
          variant: "warning",
          duration: 4000,
        })
        return
      }
      try {
        setLocalLoading(true)
        await persistSavedCalculation(remaining)
        toast({ description: "Section deleted and calculation saved.", variant: "success", duration: 1500 })
      } catch (err: any) {
        toast({ description: `Could not delete the section: ${apiErrorMessage(err)}`, variant: "destructive", duration: 4000 })
      } finally {
        setLocalLoading(false)
      }
      return
    }

    applyLocalSections(remaining)
    setCalculatedRiskMap((m) => {
      const copy = { ...m }
      delete copy[sectionId]
      return copy
    })
    setIsCalculated(false);
  }

  const handleReceiveFullRiskArray = (sectionID: string, fullRiskArray: any[]) => {
    setCalculatedRiskMap((prev) => ({ ...prev, [sectionID]: fullRiskArray }))

    const existsInLocalSections = !!(localSections && localSections.find((s) => s.sectionID === sectionID))
    const existsInSummary = !!(
      localSectionsSummary &&
      Array.isArray(localSectionsSummary.sections) &&
      localSectionsSummary.sections.find((s: any) => s.sectionID === sectionID)
    )

    if (editingSectionId !== null) {
      setLocalSections((prev) => {
        if (!prev) return prev
        const idx = Number(editingSectionId);
        if (Number.isNaN(idx) || idx < 0 || idx >= prev.length) return prev;

        return prev.map((s, i) =>
          i === idx ? { ...s, riskItems: fullRiskArray, lastCalculated: new Date().toISOString() } : s,
        )
      })
    }

    if (existsInLocalSections || existsInSummary) {
      setLocalSectionsSummary((prev: any) => {
        const copy = prev ? { ...prev } : { sections: [] }
        const sectionsArr = Array.isArray(copy.sections) ? [...copy.sections] : []
        const idx = sectionsArr.findIndex((s: any) => s.sectionID === sectionID)

        const updatedEntry = {
          ...(sectionsArr[idx] || {}),
          sectionID,
          riskItems: fullRiskArray,
          lastCalculated: new Date().toISOString(),
        }

        if (idx >= 0) sectionsArr[idx] = updatedEntry
        else sectionsArr.push(updatedEntry)

        return { ...copy, sections: sectionsArr }
      })
    }
  }

  const buildMultiSectionPayload = () => {
    const authoritativeSections: any[] = localSections
      ? localSections
      : localSectionsSummary?.sections && localSectionsSummary.sections.length > 0
        ? localSectionsSummary.sections
        : []

    const sectionsForPayload = {
      adjustedSections: authoritativeSections.map((s) => ({
        sectionID: s.sectionID,
        sectionName: s.sectionName,
        sectionSumInsured: s.sectionSumInsured,
        sectionNetPremium: s.sectionNetPremium,
        riskItemCount: s.riskItems.length,
        location: s.location,
      })),
    }

    return { ...sectionsForPayload }
  }

  const calculateMultiSectionAggregateLocal = async () => {
    const authoritativeSections: any[] = localSections?.length
      ? localSections
      : localSectionsSummary?.sections?.length
        ? localSectionsSummary.sections
        : []

    if (!authoritativeSections || authoritativeSections.length === 0) return

    const payload = buildMultiSectionPayload()

    try {
      const resultAction = await dispatch(calculatePolicyMultiSectionAggregate(payload))

      if (calculatePolicyMultiSectionAggregate.rejected.match(resultAction)) {
        throw new Error(resultAction.payload || "Aggregate calculation failed")
      }
      setAggregateTotals(resultAction.payload)

    } catch (err: any) {
      toast({
        description: `Failed to calculate aggregate: ${err?.message ?? err}`,
        variant: "destructive",
        duration: 1000,
      });
      console.error("Aggregate calculation failed:", err)
    }
  }

  const totalAggregatePremium = aggregateTotals?.totalAggregatePremium ?? 0
  const canApplyAdjustments = Number(totalAggregatePremium) > 0

  // Preview of the policy-level discount/loading on the sections' total (saved on Calculate)
  const handleApplyPolicyAdjustments = async (quiet = false) => {
    if (!canApplyAdjustments) return

    const payload = {
      totalAggregatePremium: aggregateTotals?.totalAggregatePremium,
      otherDiscountsRate: Number(adjustments.otherDiscountsRate) || 0,
      otherLoadingsRate: Number(adjustments.otherLoadingsRate) || 0,
    }

    setIsApplyingAdjustments(true)
    try {
      const res = await (dispatch(applyPolicyAdjustments(payload)) as any).unwrap?.()
      setProposalAdjustmentsResult(res || null)
      if (!quiet) {
        toast({ description: "Policy adjustments applied.", variant: "success", duration: 1000 })
      }
    } catch (err: any) {
      console.error("applyPolicyAdjustments failed:", err)
      toast({
        description: "Failed to apply policy adjustments",
        variant: "destructive",
        duration: 1000,
      });
    } finally {
      setIsApplyingAdjustments(false)
    }
  }

  const handleCalculateProRata = async () => {
    if (!netPremium || Number(netPremium) <= 0) {
      toast({
        description: "No net premium available to pro-rate.",
        variant: "warning",
        duration: 1000,
      });
      return
    }

    const payload = {
      netPremiumDue: Number(netPremium),
      coverDays: Number(coverDays || 0),
    }

    setIsCalculatingProRata(true)
    try {
      // Preview only (nothing is saved), so there's no need to reload the breakdown
      const res = await (dispatch(calculatePolicyProRata(payload)) as any).unwrap?.()
      setProRataResult(res || null)
    } catch (err: any) {
      console.error("calculateProRata failed:", err)
      toast({
        description: "Failed to calculate pro-rata.",
        variant: "destructive",
        duration: 1000,
      });
    } finally {
      setIsCalculatingProRata(false)
    }
  }

  const handleCalculate = async (navigateBack = false) => {
    if (navigateBack && isCalculated && !activeCalculationId) {
      setViewMode('list')
      dispatch(fetchPolicyCalculations(policyNo) as any)
      toast({
        description: "Policy saved successfully!",
        variant: "success",
        duration: 1000,
      });
      return
    }

    if (!policyNo || !currentPolicy) {
      toast({
        description: "Policy number is required.",
        variant: "destructive",
        duration: 1000,
      });
      return
    }

    if (!localSections?.length) {
      toast({ description: "Add at least one section before calculating.", variant: "warning", duration: 2500 })
      return
    }

    const calculationRequest = buildCalculationRequest(localSections)

    console.log("Calculation Request:", calculationRequest);

    setLocalLoading(true);

    try {
      let result;

      if (activeCalculationId) {
        // Updating an EXISTING saved calculation
        console.log('🟢 Using recalculatePolicyComplete (Update existing detailID:', activeCalculationId, ')')
        const finalPayload = {
          ...calculationRequest,
          detailID: String(activeCalculationId),
        }
        result = await dispatch(recalculatePolicyComplete({
          policyNo,
          detailID: activeCalculationId,
          calculationData: finalPayload
        }) as any).unwrap()

        toast({
          description: "Policy recalculated successfully!",
          variant: "success",
          duration: 1000,
        })
        setIsCalculated(true)
      } else if (calculationHistory && calculationHistory.length > 0) {
        // Policy has existing calculations but user clicked "Add New Details" — create an additional calculation
        console.log('🟡 Using calculateAdditionalPolicy (New Additional Calculation)')
        const additionalPayload = {
          ...calculationRequest,
          calculationType: "Additional"
        }
        result = await dispatch(calculateAdditionalPolicy({
          policyNo,
          calculationData: additionalPayload
        }) as any).unwrap()

        toast({
          description: "New calculation created successfully!",
          variant: "success",
          duration: 1000,
        })

        setIsCalculated(true);
      } else {
        // First-ever calculation for this policy
        console.log('🔵 Using calculatePolicyComplete (First Calculation)')
        result = await dispatch(calculatePolicyComplete({ policyNo, calculationData: calculationRequest }) as any).unwrap()

        toast({
          description: "Policy calculation completed successfully!",
          variant: "success",
          duration: 1000,
        })

        if (currentPolicy) {
          dispatch(setCurrentPolicy({ ...currentPolicy, transSTATUS: 'Calculated' }))
        }

        setIsCalculated(true)
      }

      await dispatch(fetchPolicyCalculations(policyNo) as any).unwrap()
      // Reload the header so the status/totals shown are what the server stored
      dispatch(getPolicyByNumber(policyNo) as any)

      if (navigateBack || isCalculated) {
        setViewMode('list');
      }

    } catch (err: any) {
      console.error("Calculation failed:", err)
      toast({
        description: apiErrorMessage(err, "Calculation failed. Please try again."),
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLocalLoading(false);
    }
  }

  const handleCancel = () => {
    navigate(`/underwriting/edit/${policyNo}`)
  }

  // Amounts are in the policy's currency
  const formatCurrency = (amount: number | null | undefined) => formatMoney(amount, policyCurrency(currentPolicy), "N/A")

  const renderDynamicInput = (field: any) => {
    const value = dynamicFieldValues[field.dbSectionField] || ""
    const handleChange = (val: any) => {
      setDynamicFieldValues((prev) => ({
        ...prev,
        [field.dbSectionField]: val,
      }))
      setIsCalculated(false);
    }

    switch (field.fieldType) {
      case "DATE":
        return (
          <Input
            type="date"
            value={value ? new Date(value).toISOString().split("T")[0] : ""}
            onChange={(e) => handleChange(e.target.value)}
            className="pc-dynamic-input"
          />
        )
      case "INT":
      case "DECIMAL":
        return (
          <Input
            type="number"
            step={field.fieldType === "DECIMAL" ? "0.01" : "1"}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="pc-dynamic-input"
          />
        )
      case "ENUM":
        let options: { value: string; label: string }[] = []
        if (field.minValue) {
          const values = field.minValue.split(",").map((s: string) => s.trim())
          const labels = field.maxValue ? field.maxValue.split(",").map((s: string) => s.trim()) : values
          options = values.map((v: string, i: number) => ({ value: v, label: labels[i] || v }))
        }
        return (
          <select
            className="pc-dynamic-input h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
          >
            <option value="">Select {field.fieldCode}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )
      case "COMPUTE":
      case "INTERPOLATE":
        return (
          <Input
            value={field.defValue || value}
            readOnly
            disabled
            className="pc-dynamic-input bg-gray-100 text-gray-500"
            placeholder={field.defValue || "Auto-calculated"}
          />
        )
      case "STRING":
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="pc-dynamic-input"
            placeholder={field.description || `Enter ${field.fieldCode}`}
          />
        )
    }
  }

  const breakdown = normalizedBreakdown || calculationBreakdown


const handleCreateDebitNote = (calculationId: string) => {
  // Navigate to the debit note route WITHOUT 'edit' in the path
  navigate(`/underwriting/debit-note/${encodeURIComponent(policyNo)}/new`, {
    state: {
      mode: 'add',
      detailId: calculationId,
      policyNo: policyNo,
      sourcePage: 'policy-calculator'
    }
  });
}

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-gray-500 font-medium">Loading Policy Data...</p>
        </div>
      </div>
    )
  }

  // ==================== LIST VIEW ====================
  if (viewMode === 'list') {
    // Filter motor calculations for THIS policy only
    const motorCalculationsForThisPolicy = motorCalculationHistory?.filter(
      (calc: any) => calc.policyNo === policyNo || calc.proposalNo === policyNo
    ) || [];

    console.log(`📊 Motor calculations for ${policyNo}:`, motorCalculationsForThisPolicy.length);
    console.log(`📊 All motor calculations in store:`, motorCalculationHistory?.length || 0);

    return (
      <div className="pc-container">
        <div className="pc-header-container mb-8">
          <div className="pc-header flex justify-between items-center pb-4 border-b border-gray-200">
            <div>
              <h1>Policy Details</h1>
              {isMotorPolicy && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Motor Policy</span>
              )}
            </div>

            <div className="pc-header-actions flex gap-2"></div>
          </div>

          <div className="pc-content mt-6">
            {/* MOTOR CALCULATIONS LIST */}
            {isMotorPolicy ? (
              motorCalculationsForThisPolicy.length > 0 ? (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">DATE</th>
                      <th className="px-6 py-3">TYPE</th>
                      <th className="px-6 py-3">VEHICLES</th>
                      <th className="px-6 py-3">TOTAL PREMIUM</th>
                      <th className="px-6 py-3">STATUS</th>
                      <th className="px-6 py-3">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {motorCalculationsForThisPolicy.map((calc: any) => {
                      // Determine calculation type
                      let calcType = calc.calculationType || "NEW";
                      // If it's the first calculation or has no type, default to "NEW"
                      if (!calc.calculationType || calc.calculationType === '') {
                        calcType = "NEW";
                      }
                      
                      return (
                        <tr key={calc.detailID} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-6 py-4">
                            {calc.calculatedOn ? new Date(calc.calculatedOn).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium">
                              {calcType.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">{calc.vehicleCount || 0}</td>
                          <td className="px-6 py-4">{formatCurrency(calc.totalPremium || 0)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              calc.status === 'ACTIVE' || calc.status === 'Completed' 
                                ? 'bg-green-100 text-green-800' 
                                : calc.status === 'PENDING' || calc.status === 'Pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}>
                              {calc.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {/* UPDATE BUTTON - Navigates to MotorPolicyCalculator */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const encodedPolicyNo = encodeURIComponent(policyNo);
                                  navigate(`/underwriting/edit/${encodedPolicyNo}/motor/${calc.detailID}`)
                                }}
                              >
                                {isReadOnly ? "View" : "Update"}
                              </Button>
                              {!isReadOnly && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleCreateDebitNote(calc.detailID)}
                                >
                                  Do Invoice
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  No motor calculations found for this policy.
                  <div className="mt-4">
                    <Button
                      onClick={() => {
                        const encodedPolicyNo = encodeURIComponent(policyNo);
                        navigate(`/underwriting/edit/${encodedPolicyNo}/motor`)
                      }}
                      variant="outline"
                    >
                      Go to Motor Calculator
                    </Button>
                  </div>
                </div>
              )
            ) : (
              // NON-MOTOR CALCULATIONS LIST
              calculationHistory && calculationHistory.length > 0 ? (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Sum Insured</th>
                      <th className="px-6 py-3">Total Premium</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculationHistory.map((calc) => (
                      <tr key={calc.detailID} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{new Date(calc.calculatedOn).toLocaleDateString()}</td>
                        <td className="px-6 py-4">{calc.calculationType}</td>
                        <td className="px-6 py-4">{formatCurrency(calc.totalSumInsured)}</td>
                        <td className="px-6 py-4">{formatCurrency(calc.totalPremium)}</td>
                        <td className="px-6 py-4">{calc.status}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={async () => {
                              setActiveCalculationId(calc.detailID);
                              dispatch(setCurrentCalculation(calc));
                              setSectionsLoading(true);
                              setViewMode('detail');
                              try {
                                const res = await dispatch(getPolicyCalculationBreakdown({ policyNo, detailID: calc.detailID }) as any).unwrap();
                                if (res?.finalResults) {
                                  dispatch(setCurrentCalculation({ ...calc, ...res.finalResults }));
                                }
                                // Only this calculation's own sections: borrowing another calculation's
                                // (or the policy-wide summary) would save them into this one on edit.
                                const sections = extractSectionsFromData(res);
                                sectionsFromServerRef.current = true;
                                setLocalSections(sections);
                                setLocalSectionsSummary((prev: any) => ({ ...(prev || { policyNo }), sections }));
                              } catch (breakdownErr) {
                                console.warn("Failed to load calculation breakdown:", breakdownErr);
                                toast({ description: "Could not load this calculation's sections. Please try again.", variant: "destructive", duration: 3000 });
                                setViewMode('list');
                              } finally {
                                setSectionsLoading(false);
                              }
                            }}>
                              {isReadOnly ? "View" : "Update"}
                            </Button>
                            {!isReadOnly && (
                              <Button size="sm" variant="secondary" onClick={() => handleCreateDebitNote(calc.detailID)}>
                                Do Invoice
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  No calculations found.
                </div>
              )
            )}
          </div>
        </div>
      </div>
    )
  }

  // ==================== DETAIL VIEW ====================
  return (
    <>
      <div className="pc-container">
        <div className="pc-header-container mb-8">
          <div className="pc-header flex justify-between items-center pb-4 border-b border-gray-200">
            <div>
              <h1>Policy Details {activeCalculationId ? "(Edit)" : "(New)"}</h1>
            </div>
            <div className="pc-header-actions flex gap-2">
              <Button onClick={() => setViewMode('list')} variant="outline">
                {isReadOnly ? "Back" : "Cancel"}
              </Button>
            </div>
          </div>

          <div className="pc-policy-header-grid">
            <div className="pc-policy-header-item">
              <Label>Policy No</Label>
              <Input value={currentPolicy?.policyNo || ''} disabled />
            </div>
            <div className="pc-policy-header-item">
              <Label>Product</Label>
              <Input value={currentProduct?.productName || "N/A"} disabled />
            </div>
            <div className="pc-policy-header-item">
              <Label>Insured</Label>
              <Input value={currentPolicy ? `${currentPolicy.insSurname} ${currentPolicy.insFirstname}` : ''} disabled />
            </div>
            <div className="pc-policy-header-item">
              <Label>Start Date</Label>
              <Input value={currentPolicy ? new Date(currentPolicy.startDate).toLocaleDateString() : ''} disabled />
            </div>
            <div className="pc-policy-header-item">
              <Label>End Date</Label>
              <Input value={currentPolicy ? new Date(currentPolicy.endDate).toLocaleDateString() : ''} disabled />
            </div>
          </div>

          {subRiskFields.filter(f => f.dbHistoryField && f.dbHistoryField !== "-").length > 0 && (
            <>
              <div className="pc-policy-header-grid">
                {(showAllFields
                  ? subRiskFields.filter(f => f.dbHistoryField && f.dbHistoryField !== "-")
                  : subRiskFields.filter(f => f.dbHistoryField && f.dbHistoryField !== "-").slice(0, 10)
                ).map((field, index) => (
                  <div key={`${field.codeID}-${index}`} className="pc-policy-header-item">
                    <Label>
                      {field.fieldCode}
                    </Label>
                    {renderDynamicInput(field)}
                  </div>
                ))}
              </div>
              {subRiskFields.filter(f => f.dbHistoryField && f.dbHistoryField !== "-").length > 10 && (
                <div className="flex justify-center mt-4 mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllFields(!showAllFields)}
                    className="text-primary"
                  >
                    {showAllFields ? "Show Less" : `Show ${subRiskFields.filter(f => f.dbHistoryField && f.dbHistoryField !== "-").length - 10} More Fields`}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {error?.calculate && <div className="pc-error-message">{error.calculate}</div>}
        {success?.calculate && <div className="pc-success-message">Calculation completed successfully!</div>}

        <div className="pc-content">
          {/* Sections Panel */}
          {/* Sections Panel */}
<div className="pc-sections-panel">
  <div className="pc-sections-header">
    <h3>
      Sections (
      {localSections && localSections.length > 0
        ? localSections.length
        : localSectionsSummary?.sections && localSectionsSummary.sections.length > 0
          ? getLatestSectionSummaries(localSectionsSummary.sections).length
          : Array.isArray(localSectionsSummary) && localSectionsSummary.length > 0
            ? getLatestSectionSummaries(localSectionsSummary).length
            : 0}
      )
    </h3>
    {!isReadOnly && (
      <Button onClick={handleAddSection} size="sm">
        Add Section
      </Button>
    )}
  </div>

  {(() => {
    const rawSummary = Array.isArray(localSectionsSummary)
      ? localSectionsSummary
      : localSectionsSummary?.sections;
    const summaryList = rawSummary && rawSummary.length > 0
      ? getLatestSectionSummaries(rawSummary)
      : null;
    const listToRender =
      localSections && localSections.length > 0
        ? localSections
        : summaryList && summaryList.length > 0
          ? summaryList
          : []

    if (sectionsLoading) {
      return (
        <div className="pc-no-sections pc-loading-sections">
          <p>Loading sections…</p>
        </div>
      )
    }

    if (!listToRender || listToRender.length === 0) {
      return (
        <div className="pc-no-sections">
          <p>No sections added yet. Click "Add Section" to begin.</p>
        </div>
      )
    }

    return (
      <div className="pc-sections-table-wrap">
        <table className="pc-sections-table" role="table" aria-label="Sections">
          <thead>
            <tr>
              <th>#</th>
              <th>Section Name</th>
              <th>Location</th>
              <th className="pc-num">Sum Insured</th>
              <th className="pc-num">Premium</th>
              <th className="pc-num">Adjustments</th>
              <th className="pc-num">Net Premium</th>
              <th>Calculated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {listToRender.map((section: any, index) => {
              const id = index
              const rawSummaryList = Array.isArray(storeSectionsSummary)
                ? storeSectionsSummary
                : storeSectionsSummary?.sections;
              const summaryMatch = Array.isArray(rawSummaryList)
                ? rawSummaryList.find(
                    (sm: any) =>
                      (sm.sectionID && sm.sectionID === section.sectionID) ||
                      (sm.sectionName && sm.sectionName.toLowerCase() === (section.sectionName || "").toLowerCase())
                  )
                : null;

              // The section's own figures come first: the summary is policy-wide and can match a
              // same-named section from another calculation.
              const name = section.sectionName ?? summaryMatch?.sectionName ?? "Unnamed Section"
              const location = section.location ?? summaryMatch?.location ?? ""
              const sumInsured = section.sectionSumInsured ?? summaryMatch?.sectionSumInsured ?? 0
              const premium = section.sectionGrossPremium ?? section.sectionPremium ?? summaryMatch?.sectionGrossPremium ?? summaryMatch?.sectionPremium ?? 0
              const netSectionPremium = section.sectionNetPremium ?? premium
              const applied = section.sectionAdjustments || {}
              const sumAmounts = (list: any[]) => (list || []).reduce((a: number, x: any) => a + (Number(x?.amount) || 0), 0)
              const discountTotal = sumAmounts(applied.discountsApplied)
              const loadingTotal = sumAmounts(applied.loadingsApplied)
              const lastCalc = section.lastCalculated ?? summaryMatch?.lastCalculated ?? null

              return (
                <tr key={index} className="pc-section-row">
                  <td>{index + 1}</td>
                  <td>{name}</td>
                  <td>{location || "N/A"}</td>
                  <td className="pc-num">{formatCurrency(sumInsured)}</td>
                  <td className="pc-num">{formatCurrency(premium)}</td>
                  <td className="pc-num">
                    {discountTotal || loadingTotal ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        {loadingTotal ? <span>+{formatCurrency(loadingTotal)}</span> : null}
                        {discountTotal ? <span>−{formatCurrency(discountTotal)}</span> : null}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="pc-num"><strong>{formatCurrency(netSectionPremium)}</strong></td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {lastCalc ? (
                      <>
                        <div>{new Date(lastCalc).toLocaleDateString()}</div>
                        <small className="text-gray-500">{new Date(lastCalc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button onClick={() => handleEditSection(String(index))} size="sm" variant="outline">
                        {isReadOnly ? "View" : "Edit"}
                      </Button>
                      {!isReadOnly && (
                        <Button
                          onClick={() => handleDeleteSection(id)}
                          size="sm"
                          variant="outline"
                          className="pc-delete-btn"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  })()}

  {aggregateTotals && (
    <>
      <br />
      <div className="pc-sections-summary">
        <h3>Sections Totals</h3>
        <div className="pc-results-grid">
          <div className="pc-result-item">
            <Label>Total Sum Insured</Label>
            <div className="pc-result-value">{formatCurrency(aggregateTotals.totalSumInsured)}</div>
          </div>
          <div className="pc-result-item">
            <Label>Total Aggregate Premium</Label>
            <div className="pc-result-value">{formatCurrency(aggregateTotals?.totalAggregatePremium)}</div>
          </div>
          <div className="pc-result-item">
            <Label>Section Count</Label>
            <div className="pc-result-value">{aggregateTotals?.sectionCount}</div>
          </div>
        </div>
      </div>
    </>
  )}
</div>

          {/* Adjustments panel */}
          <div className="pc-adjustments-panel">
            <h3 style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Policy Adjustments</span>
              <button
                className="link-btn"
                onClick={() => setAdjCollapse(!adjCollapse)}
                aria-label={adjCollapse ? "Expand item" : "Collapse item"}
              >
                {adjCollapse ? "Expand ▾" : "Collapse ▴"}
              </button>
            </h3>
            {!adjCollapse &&
              <div className="pc-adjustments-grid">
                <div className="pc-adjustment-section">
                  <h4>Discounts</h4>
                  {adjustmentOptions?.proposalLevelAdjustments
                    ?.filter((n: string) => n.toUpperCase().includes("DISCOUNT"))
                    .map((name: string) => {
                      const key = name.toUpperCase().includes("OTHER DISCOUNT")
                        ? "otherDiscountsRate"
                        : name.toLowerCase().replace(/[^a-z0-9]/g, "") + "Rate";

                      return (
                        <div className="pc-adjustment-field" key={key}>
                          <Label htmlFor={key}>{name} (%)</Label>
                          <Input
                            id={key}
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={(adjustments as any)[key] || 0}
                            onChange={(e) => setAdjustments((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                            disabled={isReadOnly}
                          />
                        </div>
                      )
                    })}
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <Label htmlFor="coverDaysSmall">Cover Days</Label>
                    <Input
                      id="coverDaysSmall"
                      type="number"
                      min="0"
                      step="1"
                      value={coverDays}
                      onChange={(e) => setCoverDays(Number(e.target.value || 0))}
                      style={{ width: 120 }}
                      disabled
                    />
                    <div style={{ fontSize: 12, color: "#666" }}>Used for pro-rata calculation</div>
                  </div>
                </div>

                <div className="pc-adjustment-section">
                  <h4>Loadings</h4>
                  {adjustmentOptions?.proposalLevelAdjustments
                    ?.filter((n: string) => n.toUpperCase().includes("LOADING"))
                    .map((name: string) => {
                      const key = name.toUpperCase().includes("OTHER LOADING")
                        ? "otherLoadingsRate"
                        : name.toLowerCase().replace(/[^a-z0-9]/g, "") + "Rate";
                      return (
                        <div className="pc-adjustment-field" key={key}>
                          <Label htmlFor={key}>{name} (%)</Label>
                          <Input
                            id={key}
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={(adjustments as any)[key] || 0}
                            onChange={(e) => setAdjustments((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                            disabled={isReadOnly}
                          />
                        </div>
                      )
                    })}
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    {!canApplyAdjustments && (
                      <p style={{ fontSize: 11, color: "#e05a2b", margin: 0 }}>
                        ⚠ Total aggregate premium must be greater than {formatCurrency(0)} to apply adjustments or calculate pro-rata.
                      </p>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      {!isReadOnly && (
                        <Button
                          onClick={() => handleApplyPolicyAdjustments()}
                          size="sm"
                          variant="outline"
                          disabled={!canApplyAdjustments || isApplyingAdjustments || isCalculatingProRata}
                        >
                          {isApplyingAdjustments ? "Applying…" : "Apply Policy Adjustments"}
                        </Button>
                      )}
                      {!isReadOnly && (
                        <Button
                          onClick={handleCalculateProRata}
                          size="sm"
                          variant="outline"
                          disabled={!canApplyAdjustments || isCalculatingProRata || isApplyingAdjustments}
                        >
                          {isCalculatingProRata ? "Calculating…" : "Calculate Pro-Rata"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            }

            {(calculationBreakdown?.calculationSteps?.proposalAdjustments?.discountsApplied?.length > 0 ||
              calculationBreakdown?.calculationSteps?.proposalAdjustments?.loadingsApplied?.length > 0 ||
              proposalAdjustmentsResult) && (
                <div className="pc-proposal-adjustments-card">
                  <div className="pc-card-header">
                    <h4>Policy Adjustments</h4>
                    <span className="pc-badge success">Applied</span>
                  </div>
                  <div className="pc-card-body pc-two-column">
                    <div className="pc-summary-column">
                      <div className="pc-summary-row">
                        <span className="pc-label">Starting Premium</span>
                        <span className="pc-value">{formatCurrency(proposalAdjustmentsResult?.startingPremium || aggregateTotals?.totalAggregatePremium)}</span>
                      </div>
                      <div className="pc-summary-row">
                        <span className="pc-label">Net Premium Due</span>
                        <span className="pc-value pc-highlight">{formatCurrency(proposalAdjustmentsResult?.netPremiumDue)}</span>
                      </div>
                      <div className="pc-divider"></div>
                      <div className="pc-mini-grid">
                        <div className="pc-mini-item">
                          <span className="pc-mini-label">Discounts</span>
                          <span className="pc-mini-value">{formatCurrency(proposalAdjustmentsResult?.otherDiscountsAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {(proRataResult || breakdown?.calculationSteps?.proRataCalculations) && (() => {
              const activePR = proRataResult || breakdown?.calculationSteps?.proRataCalculations;
              // Live /calculate/pro-rata results are at 100% (proRataPremium is 0 for a full year, premiumDue is the payable
              // figure). Saved breakdowns are already our share (finalPremiumDue = NetAmount), so never re-apply the share to them.
              const isLiveResult = !!proRataResult
              const proportionRate = Number(currentPolicy?.proportionRate) || 100
              const premiumDue = isLiveResult ? activePR?.premiumDue : activePR?.finalPremiumDue
              const showShare = isLiveResult && proportionRate < 100
              return (
                <div className="pc-pro-rata-card">
                  <div className="pc-card-header">
                    <h4>Pro-Rata</h4>
                    <span className={`pc-badge ${activePR?.isProRated ? "info" : "muted"}`}>
                      {activePR?.isProRated ? "Pro-Rated" : "Not Pro-Rated"}
                    </span>
                  </div>
                  <div className="pc-card-body pc-pro-rata-grid">
                    <div className="pc-pr-row">
                      <span className="pc-pr-label">Base Net Premium</span>
                      <span className="pc-pr-value">{formatCurrency(activePR?.netPremiumDue ?? activePR?.netPremiumBeforeProRata)}</span>
                    </div>
                    <div className="pc-pr-row">
                      <span className="pc-pr-label">
                        {activePR?.isProRated ? "Pro-Rata Premium" : "Premium Due"}
                        {!isLiveResult && proportionRate < 100 ? ` (our ${proportionRate}% share)` : ""}
                      </span>
                      <span className="pc-pr-value">{formatCurrency(premiumDue)}</span>
                    </div>
                    {showShare && (
                      <div className="pc-pr-row">
                        <span className="pc-pr-label">Our Share ({proportionRate}%)</span>
                        <span className="pc-pr-value">{formatCurrency((Number(premiumDue) || 0) * proportionRate / 100)}</span>
                      </div>
                    )}
                    <div className="pc-pr-row">
                      <span className="pc-pr-label">Cover Days</span>
                      <span className="pc-pr-value">{activePR?.coverDays}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex gap-4 w-full">
            {!isReadOnly && (
              <>
                <Button
                  onClick={() => handleCalculate(false)}
                  disabled={
                    localLoading ||
                    loading?.calculate ||
                    loading?.calculateGeneric ||
                    (isCalculated && !activeCalculationId) ||
                    currentPolicy?.transSTATUS === 'Calculated'
                  }
                  className="w-full"
                >
                  {localLoading || loading?.calculate || loading?.calculateGeneric ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating...</>
                  ) : (isCalculated && !activeCalculationId) ? "Calculated" : "Calculate"}
                </Button>
                <Button
                  onClick={() => handleCalculate(true)}
                  disabled={
                    localLoading ||
                    loading?.updatePolicy ||
                    loading?.createPolicy ||
                    loading?.calculate ||
                    loading?.calculateGeneric
                  }
                  className="bg-green-600 hover:bg-green-700 w-full"
                >
                  {localLoading || loading?.updatePolicy || loading?.createPolicy ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : "Save Policy"}
                </Button>
              </>
            )}
          </div>

          {(currentCalculation || breakdown) && (
            <div className="pc-calculation-results">
              <div className="pc-results-header">
                <h3>Calculation Results</h3>
                {breakdown && (
                  <Button onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)} variant="outline" size="sm">
                    {showDetailedBreakdown ? "Show Summary" : "Show Detailed Breakdown"}
                  </Button>
                )}
              </div>

              {!showDetailedBreakdown ? (
                <div className="pc-results-grid">
                  <div className="pc-result-item">
                    <Label>Total Sum Insured</Label>
                    <div className="pc-result-value">
                      {formatCurrency(
                        breakdown?.finalResults?.totalSumInsured ??
                        currentCalculation?.totalSumInsured ??
                        (breakdown?.calculationSteps?.sectionCalculations?.length
                          ? breakdown.calculationSteps.sectionCalculations.reduce((sum: number, section: any) =>
                              sum + (section.sectionSumInsured ||
                                section.riskItemCalculations?.items?.reduce((isum: number, item: any) => isum + (item.actualValue || 0), 0) || 0
                              ), 0)
                          : 0)
                      )}
                    </div>
                  </div>
                  <div className="pc-result-item">
                    <Label>Total Premium</Label>
                    <div className="pc-result-value">
                      {formatCurrency(
                        breakdown?.finalResults?.totalPremium ??
                        currentCalculation?.totalPremium ??
                        (breakdown?.calculationSteps?.sectionCalculations?.length
                          ? breakdown.calculationSteps.sectionCalculations.reduce((sum: number, section: any) =>
                              sum + (section.sectionPremium || section.sectionGrossPremium ||
                                section.riskItemCalculations?.items?.reduce((isum: number, item: any) => isum + (item.actualPremium || 0), 0) || 0
                              ), 0)
                          : 0)
                      )}
                    </div>
                  </div>
                  <div className="pc-result-item">
                    <Label>Net Premium</Label>
                    <div className="pc-result-value">
                      {formatCurrency(
                        breakdown?.finalResults?.netPremium ??
                        breakdown?.finalResults?.totalNetPremium ??
                        currentCalculation?.netPremium ??
                        (breakdown?.calculationSteps?.proRataCalculations?.netPremiumBeforeProRata ??
                         breakdown?.proposalAdjustments?.finalNetPremium ??
                         breakdown?.calculationSteps?.proposalAdjustments?.finalNetPremium ??
                         (breakdown?.calculationSteps?.sectionCalculations?.length
                           ? breakdown.calculationSteps.sectionCalculations.reduce((sum: number, section: any) => sum + (section.sectionNetPremium || 0), 0)
                           : 0) ?? 0)
                      )}
                    </div>
                  </div>
                  <div className="pc-result-item">
                    <Label>Pro-Rata Premium</Label>
                    <div className="pc-result-value">
                      {formatCurrency(
                        breakdown?.finalResults?.proRataPremium ??
                        currentCalculation?.proRataPremium ??
                        breakdown?.calculationSteps?.proRataCalculations?.proRataPremium ??
                        0
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                breakdown && (
                  <div className="pc-detailed-breakdown">
                    {breakdown.calculationSteps?.sectionCalculations?.map((sectionCalc: any) => (
                      <div key={sectionCalc.sectionID} className="pc-breakdown-section">
                        <h4>Section: {sectionCalc.sectionName}</h4>
                        <div className="pc-items-breakdown">
                          <h5>Risk Items Calculation</h5>
                          <div className="pc-items-table">
                            <table>
                              <thead>
                                <tr>
                                  <th>Item</th>
                                  <th>Description</th>
                                  <th>Actual Value</th>
                                  <th>Premium</th>
                                  <th>Net Premium</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sectionCalc.riskItemCalculations?.items?.length > 0 ? (
                                  sectionCalc.riskItemCalculations.items.map((item: any) => (
                                    <tr key={`${item.smiCode || ""}-${item.itemNo}`}>
                                      <td>{item.itemNo}</td>
                                      <td>{item.itemDescription}</td>
                                      <td>{formatCurrency(item.actualValue)}</td>
                                      <td>{formatCurrency(item.actualPremium)}</td>
                                      <td className="pc-highlight">{formatCurrency(item.netPremiumAfterDiscounts)}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={5} className="text-center py-4 text-gray-500">
                                      No risk items details available.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <AddPolicySectionModal
        isOpen={showAddSectionModal}
        onClose={() => setShowAddSectionModal(false)}
        onSave={handleSaveSection}
        section={
          editingSectionId != null
            ? localSections &&
            localSections.find(
              (s: any, index: any) => index === Number(editingSectionId) || s.sectionID === editingSectionId,
            )
            : undefined
        }
        productId={actualRiskID}
        proportionRate={currentPolicy?.proportionRate || 100}
        onCalculateFullRiskArray={handleReceiveFullRiskArray}
        subRiskFields={subRiskFields}
        isReadOnly={isReadOnly}
        currency={policyCurrency(currentPolicy)}
      />
    </>
  )
}

export default PolicyCalculator