//@ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "../../../../features/store"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import type { RootState } from "../../../../features/store"
import {
  getPolicyByNumber,
  getPolicyCalculationBreakdown,
  setCalculationBreakdown,
  setCurrentCalculation,
  clearMessages,
  getAdjustmentOptions,
  getSubriskFields,
  fetchPolicies,
  createFireEndorsement,
  getFireEndorsementTypes,
  getEndorsableFireSections,
} from "../../../../features/reducers/underwriteReducers/underwritingSlice"
import { fetchProducts as getAllProducts } from "../../../../features/reducers/productReducers/productSlice"
import { Button } from "../../../ui/new-button"
import Input from "../../../ui/Input"
import { Label } from "../../../ui/label"
import { AddPolicySectionModal } from "../../Modals/AddPolicySectionModal"
import { readSectionRates, readItemAdjustments, toItemAdjustmentInput } from "../../../../utils/section-adjustments"
import type { PolicySection } from "../../../../types/underwriting"
import { normalizeCalculationBreakdown } from "../../../../utils/normalizeCalculationBreakdown"
import "../PolicyCalculator.css"
import { toast } from "@/components/ui/use-toast"
import { getAllRisks } from "../../../../features/reducers/adminReducers/riskSlice"
import { Loader2 } from "lucide-react"
import { useOutdatedCheck } from "../../../../hooks/use-outdated-check"
import { formatMoney, policyCurrency } from "../../../../utils/currency"

// ============================================================================
// ENDORSEMENT TYPE HELPERS
// ============================================================================
const NON_ENDORSABLE_TYPES = ['REVERSAL', 'DELETE', 'DELETED', 'CANCELLATION', 'EXPIRED']

const ENDORSEMENT_ALIASES: Record<string, string> = {
  ADDITION: 'ADDITIONAL',
  DELETE: 'REVERSAL',
  DELETED: 'REVERSAL',
  CANCELLATION: 'REVERSAL',
  NEW: 'REDO',
  REDONEW: 'REDO',
}

const normalizeEndorsementType = (raw?: string): string => {
  if (!raw) return ''
  const upper = raw.toUpperCase().trim()
  return ENDORSEMENT_ALIASES[upper] || upper
}

const getEndorsementColorClass = (rawType: string) => {
  const type = normalizeEndorsementType(rawType)
  switch (type) {
    case 'ADDITIONAL': return 'bg-green-100 text-green-800 border-green-200'
    case 'REVERSAL':   return 'bg-red-200 text-red-900 border-red-300'
    case 'RETURN':     return 'bg-red-100 text-red-800 border-red-200'
    case 'REDO':       return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'EXTENSION':  return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'REDUCTION':  return 'bg-orange-100 text-orange-800 border-orange-200'
    default:           return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const FireEndorsementCalculator = () => {
  const { policyNo, detailID: urlDetailID } = useParams<{ policyNo: string; detailID?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch<AppDispatch>()

  const routeState = (location.state as any) || {}
  const initialType = normalizeEndorsementType(routeState.endorsementType)
  const [endorsementType, setEndorsementType] = useState<string>(initialType)
  const [activeCalculationId, setActiveCalculationId] = useState<string | null>(
    urlDetailID || routeState.detailID || null
  )

  const {
    currentPolicy: rawCurrentPolicy,
    currentCalculation,
    calculationBreakdown,
    loading,
    success,
    error,
    policies,
  } = useSelector((state: RootState) => state.underwritings)

  const safePolicyNo = policyNo ? decodeURIComponent(policyNo).trim() : ""
  const currentPolicy =
    rawCurrentPolicy ||
    (safePolicyNo ? ({ policyNo: safePolicyNo, proposalNo: safePolicyNo } as any) : null)

  const { isOutdated } = useOutdatedCheck(safePolicyNo, policies)

  // ============================================================================
  // STATE
  // ============================================================================
  const [showAddSectionModal, setShowAddSectionModal] = useState(false)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [adjCollapse, setAdjCollapse] = useState(true)
  const [adjustments, setAdjustments] = useState<any>({
    otherDiscountsRate: 0,
    otherLoadingsRate: 0,
  })
  const [remarks, setRemarks] = useState("")
  const [sectionsLoading, setSectionsLoading] = useState(false)
  const [localSections, setLocalSections] = useState<PolicySection[] | null>(null)
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set())
  const [coverDays, setCoverDays] = useState<number>(365)
  const [subRiskFields, setSubRiskFields] = useState<any[]>([])
  const [showAllFields, setShowAllFields] = useState(false)
  const [extensionEndDate, setExtensionEndDate] = useState<string>("")
  // ADDITIONAL is pro-rated by the API from this date to the policy's expiry
  const [effectiveDate, setEffectiveDate] = useState<string>(() => new Date().toISOString().split("T")[0])
  const [softDeletedRiskItems, setSoftDeletedRiskItems] = useState<Record<number, number[]>>({})

  // ============================================================================
  // COMPUTED FLAGS
  // ============================================================================
  const canEditFields =
    endorsementType === 'ADDITIONAL' && !isOutdated
  const canTickItems =
    endorsementType === 'RETURN' || endorsementType === 'REDO'
  const needsDate =
    endorsementType === 'EXTENSION'
  const isFullyReadOnly =
    isOutdated || endorsementType === 'REVERSAL' || endorsementType === 'EXTENSION'
  const isReadOnly = isFullyReadOnly || !canEditFields

  // ============================================================================
  // EFFECTS
  // ============================================================================
  useEffect(() => {
    if (success?.calculate) dispatch(clearMessages() as any)
  }, [success?.calculate, dispatch])

  useEffect(() => {
    if (!policies || policies.length === 0) {
      dispatch(fetchPolicies({ page: 1, pageSize: 100, riskClass: "" }) as any)
    }
  }, [dispatch, policies])

  useEffect(() => {
    dispatch(getAdjustmentOptions() as any)
    dispatch(getFireEndorsementTypes() as any)
    dispatch(getAllRisks({ pageNumber: 1, pageSize: 100 }) as any)
  }, [dispatch])

  useEffect(() => {
    if (!safePolicyNo) return
    const isMatch =
      rawCurrentPolicy &&
      (rawCurrentPolicy.policyNo?.trim() === safePolicyNo ||
        rawCurrentPolicy.proposalNo?.trim() === safePolicyNo)
    if (!isMatch) dispatch(getPolicyByNumber(safePolicyNo) as any)
  }, [dispatch, safePolicyNo, rawCurrentPolicy])

  useEffect(() => {
    if (currentPolicy?.riskID) {
      dispatch(getSubriskFields(currentPolicy.riskID) as any)
        .then((res: any) => {
          let fields = []
          if (res.payload && Array.isArray(res.payload)) fields = res.payload
          else if (res.payload && typeof res.payload === 'object') fields = [res.payload]
          if (fields.length > 0) {
            const validFields = fields.filter(
              (f: any) =>
                f.dbSectionField && f.dbSectionField !== "-" && f.dbSectionField.trim() !== ""
            )
            setSubRiskFields(validFields)
          } else setSubRiskFields([])
        })
        .catch((err: any) => console.error("getSubriskFields error:", err))
    }
  }, [dispatch, currentPolicy?.riskID])

  useEffect(() => {
    if (currentPolicy?.riskID) {
      dispatch(
        getAllProducts({ riskId: currentPolicy.riskID, pageNumber: 1, pageSize: 100 }) as any
      )
    }
  }, [dispatch, currentPolicy?.riskID])

  // ============================================================================
  // INITIAL LOAD
  // ============================================================================
  useEffect(() => {
    if (!safePolicyNo || !activeCalculationId || !endorsementType) return
    if (!currentPolicy) return

    const buildSections = (rawBreakdown: any, endorsableList: any[], markExisting = false) => {
      const normalised = normalizeCalculationBreakdown(rawBreakdown)
      const normalisedSections: any[] =
        normalised?.calculationSteps?.sectionCalculations ?? []

      const rawSections: any[] =
        rawBreakdown?.inputs?.sectionInputs ??
        rawBreakdown?.sections ??
        []

      const source: any[] = normalisedSections.length > 0 ? normalisedSections : rawSections

      const tokensById: Record<string, any> = {}
      const endorsable = Array.isArray(endorsableList) ? endorsableList : []
      endorsable.forEach((e: any) => {
        const key = String(e.sectionID ?? "")
        if (!key) return
        tokensById[key] = {
          selectionToken: e.selectionToken,
          isExpired: !!e.isExpired,
          stampedBy: e.stampedBy ?? null,
          tag: e.tag ?? "SECTION",
        }
      })

      return source.map((s: any) => {
        const idKey = String(s.sectionID ?? "")
        const meta = tokensById[idKey] || {}
        const rawItems: any[] = s.riskItemCalculations?.items ?? s.riskItems ?? []

        const riskItems = rawItems.map((ri: any) => ({
          ...ri,
          discounts: ri.discounts ?? ri.discountsApplied ?? [],
          loadings: ri.loadings ?? ri.loadingsApplied ?? [],
          appliedDiscounts: ri.appliedDiscounts ?? ri.discountsApplied ?? [],
          appliedLoadings: ri.appliedLoadings ?? ri.loadingsApplied ?? [],
        }))

        return {
          sectionID: s.sectionID,
          sectionName: s.sectionName,
          location: s.location ?? "",
          sectionSumInsured:
            s.sectionSumInsured ??
            s.riskItemCalculations?.totals?.totalActualValue ??
            0,
          sectionPremium:
            s.sectionGrossPremium ??
            s.riskItemCalculations?.totals?.totalSharePremium ??
            0,
          sectionNetPremium:
            s.sectionNetPremium ??
            s.sectionAdjustments?.finalNetPremium ??
            s.riskItemCalculations?.totals?.totalNetPremiumAfterDiscounts ??
            0,
          riskItems,
          riskItemCount: riskItems.length,
          specialDiscountRate: s.specialDiscountRate ?? 0,
          deductibleDiscountRate: s.deductibleDiscountRate ?? 0,
          spreadDiscountRate: s.spreadDiscountRate ?? 0,
          ltaDiscountRate: s.ltaDiscountRate ?? 0,
          theftLoadingRate: s.theftLoadingRate ?? 0,
          srccLoadingRate: s.srccLoadingRate ?? 0,
          otherLoading2Rate: s.otherLoading2Rate ?? 0,
          otherDiscountsRate: s.otherDiscountsRate ?? 0,
          otherLoadingsRate: s.otherLoadingsRate ?? 0,
          proportionRate: s.proportionRate ?? 0,
          selectionToken: meta.selectionToken ?? s.selectionToken,
          isExpired: meta.isExpired ?? false,
          stampedBy: meta.stampedBy ?? null,
          tag: meta.tag ?? "SECTION",
          _isExisting: markExisting,
          lastCalculated: rawBreakdown?.calculatedOn ?? null,
        }
      })
    }

    const loadData = async () => {
      try {
        setSectionsLoading(true)

        if (endorsementType === 'ADDITIONAL') {
          const rawBreakdown: any = await dispatch(
            getPolicyCalculationBreakdown({
              policyNo: safePolicyNo,
              detailID: activeCalculationId,
            }) as any
          )
            .unwrap()
            .catch(() => null)

          if (rawBreakdown) dispatch(setCalculationBreakdown(rawBreakdown))

          const built = buildSections(rawBreakdown, [], true)
          console.log('[ENDORSEMENT ADDITIONAL] rawBreakdown:', rawBreakdown)
          console.log('[ENDORSEMENT ADDITIONAL] built sections:', built.length, built)
          setLocalSections(built)
        } else {
          const [rawBreakdown, endorsable] = await Promise.all([
            dispatch(
              getPolicyCalculationBreakdown({
                policyNo: safePolicyNo,
                detailID: activeCalculationId,
              }) as any
            )
              .unwrap()
              .catch(() => null),
            dispatch(
              getEndorsableFireSections({
                policyNo: safePolicyNo,
                detailId: activeCalculationId,
              }) as any
            )
              .unwrap()
              .catch(() => []),
          ])

          if (rawBreakdown) dispatch(setCalculationBreakdown(rawBreakdown))

          const built = buildSections(rawBreakdown, endorsable, false)
          console.log('[ENDORSEMENT NON-ADD] rawBreakdown:', rawBreakdown)
          console.log('[ENDORSEMENT NON-ADD] endorsable:', endorsable)
          console.log('[ENDORSEMENT NON-ADD] built sections:', built.length, built)
          setLocalSections(built)
        }
      } catch (err: any) {
        console.error("Failed to load endorsement details:", err)
        toast({
          title: "Error",
          description: err.message || "Failed to load calculation details",
          variant: "destructive",
        })
        setLocalSections([])
      } finally {
        setSectionsLoading(false)
      }
    }

    loadData()
  }, [safePolicyNo, activeCalculationId, endorsementType, currentPolicy, dispatch])

  // Sync extensionEndDate
  useEffect(() => {
    if (endorsementType !== 'EXTENSION') {
      setExtensionEndDate("")
      return
    }
    if (currentCalculation?.inputs?.endDate) {
      setExtensionEndDate(new Date(currentCalculation.inputs.endDate).toISOString().split('T')[0])
    }
  }, [currentCalculation, endorsementType])

  useEffect(() => {
    if (calculationBreakdown?.inputs?.coverDays) {
      setCoverDays(Number(calculationBreakdown.inputs.coverDays))
    }
  }, [calculationBreakdown])

  // ============================================================================
  // SECTION HANDLERS
  // ============================================================================
  const handleAddSection = () => {
    setEditingSectionId(null)
    setShowAddSectionModal(true)
  }

  const handleEditSection = (sectionId: string) => {
    setEditingSectionId(sectionId)
    setShowAddSectionModal(true)
  }

  const handleSaveSection = (fullsection: any, deletedRiskIndices: number[] = []) => {
    if (editingSectionId != null) {
      const idx = Number(editingSectionId)
      if (!Number.isNaN(idx)) {
        setSoftDeletedRiskItems((prev) => ({ ...prev, [idx]: deletedRiskIndices }))
      }
    }

    setLocalSections((prev) => {
      const list = prev ? [...prev] : []
      if (editingSectionId == null) {
        list.push(fullsection)
      } else {
        const idx = Number(editingSectionId)
        if (!Number.isNaN(idx) && idx >= 0 && idx < list.length) list[idx] = fullsection
        else list.push(fullsection)
      }
      return list
    })

    setShowAddSectionModal(false)
    setEditingSectionId(null)
  }

  const handleToggleToken = (token: string, isExpired?: boolean) => {
    if (!token || isExpired) return
    setSelectedTokens((prev) => {
      const next = new Set(prev)
      if (next.has(token)) next.delete(token)
      else next.add(token)
      return next
    })
  }

  const handleDeleteSection = (index: number) => {
    if (!window.confirm("Remove this section?")) return
    setLocalSections((prev) => (prev ? prev.filter((_, i) => i !== index) : null))
  }

  // Amounts are in the policy's currency
  const formatCurrency = (amount: number | null | undefined) => formatMoney(amount, policyCurrency(currentPolicy), "N/A")

  const renderDynamicInput = (field: any) => {
    const value = field.defValue || ""
    return <Input value={value} disabled readOnly />
  }

  // ============================================================================
  // CALCULATE / SAVE
  // ============================================================================
  const handleCalculate = async (navigateBack = false) => {
    if (!safePolicyNo || !currentPolicy || !endorsementType || !activeCalculationId) {
      toast({
        title: "Missing Data",
        description: "Policy, endorsement type, or source record not set",
        variant: "destructive",
      })
      return
    }

    const type = normalizeEndorsementType(endorsementType)
    const sections = localSections || []

    const sanitiseItem = (it: any) => {
      const {
        _showStock, _collapsed, id,
        actualPremium, actualPremiumFormula,
        shareValue, shareValueFormula,
        premiumValue, premiumValueFormula,
        stockDiscountAmount, feaDiscountAmount,
        netPremiumAfterDiscounts, totalSumInsured,
        discounts, loadings, discountsApplied, loadingsApplied,
        ...keep
      } = it
      // The API reads item-level adjustments from `discounts` / `loadings` only, in its own
      // shape (adjustmentName/rate/appliedOn); the saved breakdown returns *Applied (name/rate).
      const adj = readItemAdjustments({ discounts, loadings, discountsApplied, loadingsApplied })
      return {
        ...keep,
        discounts: toItemAdjustmentInput(adj.discounts),
        loadings: toItemAdjustmentInput(adj.loadings),
      }
    }

    const sanitiseSection = (s: any) => {
      const {
        lastCalculated, selectionToken, isExpired, stampedBy, tag, riskItemCount,
        sectionGrossPremium, sectionNetPremium,
        _isExisting,
        ...rest
      } = s
      return {
        ...rest,
        // section discounts/loadings as plain rate fields (loaded sections only carry them nested)
        ...readSectionRates(s),
        riskItems: (s.riskItems || []).map(sanitiseItem),
      }
    }

    const endorsementRequest: any = {
      policyNo: safePolicyNo,
      endorsementType: type,
      sourceDetailID: String(activeCalculationId),
      createdBy: "System",
      remarks: remarks || `${type} ${safePolicyNo}`,
    }

    if (type === "ADDITIONAL") {
      if (!effectiveDate) {
        toast({ title: "Missing date", description: "Effective date is required", variant: "destructive" })
        return
      }
      endorsementRequest.effectiveDate = effectiveDate
      endorsementRequest.sections = sections
        .filter((s: any) => !s._isExisting)
        .map(sanitiseSection)
      endorsementRequest.otherDiscountsRate = adjustments.otherDiscountsRate
      endorsementRequest.otherLoadingsRate = adjustments.otherLoadingsRate

    } else if (type === "RETURN" || type === "REDO") {
      const tokens = sections
        .map((s: any) => s.selectionToken)
        .filter((t: string) => t && selectedTokens.has(t))
      if (tokens.length === 0) {
        toast({
          title: "Nothing ticked",
          description: `${type} needs at least one section`,
          variant: "destructive",
        })
        return
      }
      endorsementRequest.selectedSectionTokens = tokens
      if (type === "REDO") {
        endorsementRequest.description = remarks || "Re-entry of sections"
      }

    } else if (type === "EXTENSION") {
      if (!extensionEndDate) {
        toast({
          title: "Missing date",
          description: "New end date is required",
          variant: "destructive",
        })
        return
      }
      endorsementRequest.newEndDate = extensionEndDate

    } else if (type === "REDUCTION") {
      // sourceDetailID is all the server needs

    } else if (type === "REVERSAL") {
      // sourceDetailID is all the server needs
    }

    console.log("=== FIRE ENDORSEMENT PAYLOAD ===", JSON.stringify(endorsementRequest, null, 2))

    try {
      const result = await dispatch(createFireEndorsement(endorsementRequest) as any).unwrap()
      dispatch(setCurrentCalculation(result))
      toast({ title: "Success", description: `${type} processed.`, variant: "default" })
      if (navigateBack) {
        navigate(`/underwriting/endorsements/edit/${encodeURIComponent(safePolicyNo)}/calculator`)
      }
    } catch (err: any) {
      console.error(err)
      toast({ title: "Error", description: err.message || "Endorsement failed", variant: "destructive" })
    }
  }

  const handleCancel = () => {
    navigate(`/underwriting/endorsements/edit/${encodeURIComponent(safePolicyNo)}/calculator`)
  }

  // ============================================================================
  // RENDER
  // ============================================================================
  const isPolicyMatching =
    currentPolicy &&
    ((currentPolicy.policyNo || safePolicyNo)?.trim() === safePolicyNo ||
      currentPolicy.proposalNo?.trim() === safePolicyNo)

  if (error?.fetchPolicy) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-white">
        <div className="text-center p-8 border rounded-lg bg-red-50/50">
          <p className="text-red-600 font-bold text-lg">⚠️ Policy Not Found</p>
          <p className="text-gray-600">{error.fetchPolicy}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (loading?.fetchPolicy || !currentPolicy || !isPolicyMatching) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-gray-500 font-medium">Loading Policy & Risk Data...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="pc-container">
        <div className="pc-header-container mb-8">
          <div className="pc-header flex justify-between items-center pb-4 border-b border-gray-200">
            <div>
              <h1>Fire Endorsement Calculator</h1>
              <p className="text-sm text-gray-500 mt-1">
                Policy: <span className="font-mono font-semibold">{safePolicyNo}</span>
                {currentPolicy?.riskID && (
                  <span className="ml-3 px-2 py-1 rounded text-xs font-medium bg-slate-100">
                    Risk: {currentPolicy.riskID}
                  </span>
                )}
              </p>
            </div>
            <div className="pc-header-actions">
              <Button onClick={handleCancel} variant="outline">
                Back
              </Button>
            </div>
          </div>

          <div className="pc-policy-header-grid">
            <div className="pc-policy-header-item">
              <Label>Policy No</Label>
              <Input value={currentPolicy.policyNo || safePolicyNo} disabled />
            </div>
            <div className="pc-policy-header-item">
              <Label>Insured</Label>
              <Input
                value={`${currentPolicy.insSurname || ''} ${currentPolicy.insFirstname || ''}`}
                disabled
              />
            </div>
            <div className="pc-policy-header-item">
              <Label>Start Date</Label>
              <Input
                value={
                  currentPolicy.startDate
                    ? new Date(currentPolicy.startDate).toLocaleDateString()
                    : '—'
                }
                disabled
              />
            </div>
            <div className="pc-policy-header-item">
              <Label>End Date</Label>
              <Input
                value={
                  currentPolicy.endDate
                    ? new Date(currentPolicy.endDate).toLocaleDateString()
                    : '—'
                }
                disabled
              />
            </div>
            <div className="pc-policy-header-item">
              <Label className="font-bold">Endorsement Type</Label>
              <select
                value={endorsementType}
                disabled
                className={`h-10 w-full rounded-md border px-3 py-2 text-sm font-semibold ${getEndorsementColorClass(
                  endorsementType
                )}`}
              >
                <option value={endorsementType}>{endorsementType}</option>
              </select>
            </div>

            {endorsementType === 'ADDITIONAL' && (
              <div className="pc-policy-header-item">
                <Label>
                  Effective Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  min={currentPolicy?.startDate ? String(currentPolicy.startDate).split('T')[0] : undefined}
                  max={currentPolicy?.endDate ? String(currentPolicy.endDate).split('T')[0] : undefined}
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  disabled={isOutdated}
                />
              </div>
            )}

            {needsDate && (
              <div className="pc-policy-header-item">
                <Label>
                  New End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={extensionEndDate}
                  onChange={(e) => setExtensionEndDate(e.target.value)}
                  disabled={isFullyReadOnly && endorsementType !== 'EXTENSION'}
                />
              </div>
            )}
          </div>

          {subRiskFields.filter((f) => f.dbHistoryField && f.dbHistoryField !== "-").length > 0 && (
            <>
              <div className="pc-policy-header-grid">
                {(showAllFields ? subRiskFields : subRiskFields.slice(0, 10))
                  .filter((f) => f.dbHistoryField && f.dbHistoryField !== "-")
                  .map((field, index) => (
                    <div key={`${field.codeID}-${index}`} className="pc-policy-header-item">
                      <Label>{field.fieldCode}</Label>
                      {renderDynamicInput(field)}
                    </div>
                  ))}
              </div>
              {subRiskFields.filter((f) => f.dbHistoryField && f.dbHistoryField !== "-").length > 10 && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline" onClick={() => setShowAllFields(!showAllFields)}>
                    {showAllFields ? "Show Less" : "Show More Fields"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {error?.calculate && <div className="pc-error-message">{error.calculate}</div>}
        {success?.calculate && (
          <div className="pc-success-message">Calculation completed successfully!</div>
        )}

        <div className="pc-content">
          {/* Sections Panel */}
          <div className="pc-sections-panel">
            <div className="pc-sections-header">
              <h3>Sections ({localSections?.length || 0})</h3>
              {canEditFields && (
                <Button onClick={handleAddSection} size="sm">
                  Add Section
                </Button>
              )}
              {canTickItems && (
                <span className="text-xs text-gray-500">
                  {selectedTokens.size} section(s) selected
                </span>
              )}
            </div>

            {sectionsLoading ? (
              <div className="pc-no-sections">
                <Loader2 className="animate-spin" />
              </div>
            ) : !localSections || localSections.length === 0 ? (
              <div className="pc-no-sections">
                <p>
                  No sections yet.{' '}
                  {endorsementType === 'ADDITIONAL' && 'Click "Add Section" to begin.'}
                </p>
              </div>
            ) : (
              <div className="pc-sections-table-wrap">
                <table className="pc-sections-table">
                  <thead>
                    <tr>
                      {canTickItems && <th className="w-10"></th>}
                      <th>#</th>
                      <th>Section Name</th>
                      <th>Location</th>
                      <th>Sum Insured</th>
                      <th>Premium</th>
                      <th>Risk Items</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localSections.map((section: any, index) => {
                      const token = section.selectionToken
                      const isTicked = token && selectedTokens.has(token)
                      const rowKey = token || section.sectionID || index
                      const isExpired = !!section.isExpired
                      const isExisting = !!section._isExisting

                      return (
                        <tr
                          key={rowKey}
                          className={
                            isTicked
                              ? 'opacity-50 line-through bg-gray-100'
                              : isExpired
                              ? 'bg-gray-50'
                              : ''
                          }
                        >
                          {canTickItems && (
                            <td className="text-center">
                              <input
                                type="checkbox"
                                checked={!!isTicked}
                                onChange={() => handleToggleToken(token, isExpired)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                disabled={!token || isExpired}
                                title={
                                  isExpired
                                    ? `Already off cover${section.stampedBy ? ` (${section.stampedBy})` : ""}`
                                    : ""
                                }
                              />
                            </td>
                          )}
                          <td>{index + 1}</td>
                          <td>
                            {section.sectionName || 'Unnamed'}
                            {isExisting && (
                              <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                                Existing
                              </span>
                            )}
                            {isExpired && (
                              <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-200 text-gray-600">
                                Off cover
                              </span>
                            )}
                          </td>
                          <td>{section.location || 'N/A'}</td>
                          <td>{formatCurrency(section.sectionSumInsured || 0)}</td>
                          <td>
                            {formatCurrency(
                              section.sectionPremium || section.sectionNetPremium || 0
                            )}
                          </td>
                          <td>{section.riskItems?.length ?? 0}</td>
                          <td>
                            <div className="flex gap-2">
                              {canEditFields && !isExisting && (
                                <Button
                                  onClick={() => handleEditSection(String(index))}
                                  size="sm"
                                  variant="outline"
                                >
                                  Edit
                                </Button>
                              )}
                              {canEditFields && !isExisting && (
                                <Button
                                  onClick={() => handleDeleteSection(index)}
                                  size="sm"
                                  variant="outline"
                                >
                                  Remove
                                </Button>
                              )}
                              {!canEditFields && !canTickItems && (
                                <span className="text-xs text-gray-400 italic">
                                  Read-only
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Adjustments Panel */}
          {(endorsementType === 'ADDITIONAL' || endorsementType === 'REDUCTION') && (
            <div className="pc-adjustments-panel">
              <h3 style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Policy Adjustments</span>
                <button className="link-btn" onClick={() => setAdjCollapse(!adjCollapse)}>
                  {adjCollapse ? 'Expand ▾' : 'Collapse ▴'}
                </button>
              </h3>
              {!adjCollapse && (
                <div className="pc-adjustments-grid">
                  <div className="pc-adjustment-section">
                    <h4>Discounts</h4>
                    <div className="pc-adjustment-field">
                      <Label>Other Discounts (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={adjustments.otherDiscountsRate}
                        onChange={(e) =>
                          setAdjustments((prev: any) => ({
                            ...prev,
                            otherDiscountsRate: Number(e.target.value),
                          }))
                        }
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                  <div className="pc-adjustment-section">
                    <h4>Loadings</h4>
                    <div className="pc-adjustment-field">
                      <Label>Other Loadings (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={adjustments.otherLoadingsRate}
                        onChange={(e) =>
                          setAdjustments((prev: any) => ({
                            ...prev,
                            otherLoadingsRate: Number(e.target.value),
                          }))
                        }
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 w-full mt-6">
            {endorsementType === 'REVERSAL' ? (
              <Button
                onClick={() => handleCalculate(false)}
                disabled={loading?.calculate}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {loading?.calculate ? 'Reversing...' : 'Reverse Endorsement'}
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => handleCalculate(false)}
                  disabled={
                    loading?.calculate ||
                    (endorsementType === 'ADDITIONAL' &&
                      (!localSections || localSections.filter((s: any) => !s._isExisting).length === 0)) ||
                    ((endorsementType === 'RETURN' || endorsementType === 'REDO') &&
                      selectedTokens.size === 0) ||
                    (endorsementType === 'EXTENSION' && !extensionEndDate)
                  }
                  className="w-full"
                >
                  {loading?.calculate ? 'Processing...' : `Apply ${endorsementType}`}
                </Button>
                <Button
                  onClick={() => handleCalculate(true)}
                  disabled={loading?.calculate}
                  className="bg-green-600 hover:bg-green-700 w-full"
                >
                  Save & Return
                </Button>
              </>
            )}
          </div>

          {/* Calculation Results */}
          {currentCalculation && (
            <div className="pc-calculation-results mt-6">
              <h3>Calculation Results</h3>
              <div className="pc-results-grid">
                <div className="pc-result-item">
                  <Label>Total Sum Insured</Label>
                  <div className="pc-result-value">
                    {formatCurrency(currentCalculation.totalSumInsured || 0)}
                  </div>
                </div>
                <div className="pc-result-item">
                  <Label>Total Premium</Label>
                  <div className="pc-result-value">
                    {formatCurrency(currentCalculation.totalPremium || 0)}
                  </div>
                </div>
                <div className="pc-result-item">
                  <Label>Net Premium</Label>
                  <div className="pc-result-value">
                    {formatCurrency(currentCalculation.netPremium || 0)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddPolicySectionModal
        currency={policyCurrency(currentPolicy)}
        isOpen={showAddSectionModal}
        onClose={() => setShowAddSectionModal(false)}
        onSave={handleSaveSection}
        section={
          editingSectionId != null
            ? localSections?.find((_, index) => index === Number(editingSectionId))
            : undefined
        }
        productId={currentPolicy?.riskID || ""}
        proportionRate={currentPolicy?.proportionRate || 100}
        subRiskFields={subRiskFields}
        endorsementType={normalizeEndorsementType(endorsementType)}
        isReadOnly={endorsementType !== 'ADDITIONAL'}
        initialSoftDeletedIndices={
          editingSectionId != null
            ? softDeletedRiskItems[Number(editingSectionId)] || []
            : []
        }
      />
    </>
  )
}

export default FireEndorsementCalculator