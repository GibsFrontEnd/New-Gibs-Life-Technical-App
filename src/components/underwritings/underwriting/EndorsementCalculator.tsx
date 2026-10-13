//@ts-nocheck
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "../../../features/store"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import {
  getPolicyByNumber,
  getPolicyEndorsements,
  fetchPolicyCalculations,
  fetchPolicies,
  getEndorsementTypes,
  clearMessages,
} from "../../../features/reducers/underwriteReducers/underwritingSlice"
import { getAllRisks } from "../../../features/reducers/adminReducers/riskSlice"
import { Button } from "../../ui/new-button"
import type { AvailableCalculation } from "../../../types/underwriting"
import "./PolicyCalculator.css"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useOutdatedCheck } from "../../../hooks/use-outdated-check"
import { formatMoney, policyCurrency } from "../../../utils/currency"

// ============================================================================
// UNIVERSAL ENDORSEMENT TYPES (same across fire / motor / hull / cargo / aviation)
// ============================================================================
// Rows whose *type* makes them non-endorsable. We still allow the user to
// open them in a read-only view.
const NON_ENDORSABLE_TYPES = ['REVERSAL', 'DELETE', 'DELETED', 'CANCELLATION', 'EXPIRED']

const ENDORSEMENT_ALIASES: Record<string, string> = {
  ADDITION: 'ADDITIONAL',
  DELETE: 'REVERSAL',
  DELETED: 'REVERSAL',
  CANCELLATION: 'REVERSAL',
  NEW: 'REDO',
  REDONEW: 'REDO',
}

export const normalizeEndorsementType = (raw?: string): string => {
  if (!raw) return ''
  const upper = raw.toUpperCase().trim()
  return ENDORSEMENT_ALIASES[upper] || upper
}

export const getEndorsementColorClass = (rawType: string) => {
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
// RISK → ENDORSEMENT CALCULATOR ROUTING
// This app has fire and motor calculators only: V goes to motor, everything
// else uses the fire endpoint (F, AG, B, E, G, O, P, S)
// ============================================================================
const RISK_ENDORSEMENT_CONFIG: Record<string, { mode: string }> = {
  V:  { mode: "motor" },
  F:  { mode: "fire" },
  AG: { mode: "fire" },
  B:  { mode: "fire" },
  E:  { mode: "fire" },
  G:  { mode: "fire" },
  O:  { mode: "fire" },
  P:  { mode: "fire" },
  S:  { mode: "fire" },
}

const getEndorsementMode = (riskID?: string) => {
  const cfg = RISK_ENDORSEMENT_CONFIG[(riskID || "").toUpperCase()]
  return cfg?.mode ?? "fire"
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const EndorsementCalculator = () => {
  const { policyNo } = useParams<{ policyNo: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch<AppDispatch>()

  const {
    currentPolicy: rawCurrentPolicy,
    policies,
    endorsementTypes,
    loading,
    error,
  } = useSelector((state: RootState) => state.underwritings)

  const safePolicyNo = policyNo ? decodeURIComponent(policyNo).trim() : ""

  const currentPolicy = useMemo(
    () =>
      rawCurrentPolicy ||
      (safePolicyNo ? ({ policyNo: safePolicyNo, proposalNo: safePolicyNo } as any) : null),
    [rawCurrentPolicy, safePolicyNo]
  )

  const { isOutdated } = useOutdatedCheck(safePolicyNo, policies)

  // ============================================================================
  // STATE
  // ============================================================================
  const [endorsementType, setEndorsementType] = useState<string>("")
  const [displayList, setDisplayList] = useState<AvailableCalculation[]>([])
  const [sectionsLoading, setSectionsLoading] = useState(false)
  const viewModeInitializedRef = useRef(false)

  // ============================================================================
  // EFFECTS
  // ============================================================================
  useEffect(() => {
    if (!policies || policies.length === 0) {
      dispatch(fetchPolicies({ page: 1, pageSize: 100, riskClass: "" }) as any)
    }
  }, [dispatch, policies])

  useEffect(() => {
    dispatch(getEndorsementTypes() as any)
    dispatch(getAllRisks({ pageNumber: 1, pageSize: 100 }) as any)
  }, [dispatch])

  useEffect(() => {
    if (!policyNo) return
    const safe = decodeURIComponent(policyNo).trim()
    if (
      !rawCurrentPolicy ||
      (rawCurrentPolicy.policyNo?.trim() !== safe &&
        rawCurrentPolicy.proposalNo?.trim() !== safe)
    ) {
      dispatch(getPolicyByNumber(policyNo) as any)
      return
    }
    if (!viewModeInitializedRef.current) {
      refreshCalculations()
      viewModeInitializedRef.current = true
    }
  }, [dispatch, rawCurrentPolicy, policyNo])

  // ============================================================================
  // DATA LOADING
  // ============================================================================
  const refreshCalculations = () => {
    setSectionsLoading(true)
    const promises: any[] = []

    promises.push(
      dispatch(getPolicyEndorsements(policyNo) as any)
        .then((res: any) => ({ type: 'ENDORSEMENTS', data: res.payload || [] }))
        .catch((err: any) => {
          console.error("Endorsements fetch failed", err)
          return { type: 'ENDORSEMENTS', data: [] }
        })
    )

    promises.push(
      dispatch(fetchPolicyCalculations(policyNo) as any)
        .unwrap()
        .then((res: any) => ({ type: 'CALCULATIONS', data: res || [] }))
        .catch((err: any) => {
          console.error("Calculations fetch failed", err)
          return { type: 'CALCULATIONS', data: [] }
        })
    )

    Promise.all(promises)
      .then((results) => {
        const endorsements = results.find((r) => r.type === 'ENDORSEMENTS')?.data || []
        const calculations = results.find((r) => r.type === 'CALCULATIONS')?.data || []

        const normalizedEndorsements: AvailableCalculation[] = endorsements.map((e: any) => ({
          detailID: e.detailID,
          certOrDocNo: e.certOrDocNo || "N/A",
          calculatedOn: e.calculatedOn,
          calculatedBy: e.calculatedBy || "System",
          calculationType: normalizeEndorsementType(e.calculationType) || "Endorsement",
          totalSumInsured: e.totalSumInsured || 0,
          totalPremium: e.totalPremium || e.netPremium || 0,
          sectionCount: e.sectionCount || 1,
          status: e.status || "ACTIVE",
          isRecommended: false,
        }))

        const normalizedCalculations: AvailableCalculation[] = calculations
          .filter((c: any) => {
            const t = normalizeEndorsementType(c.calculationType).toLowerCase()
            const isEndorsement = (endorsementTypes || []).some(
              (et: string) => normalizeEndorsementType(et).toLowerCase() === t
            )
            return !isEndorsement
          })
          .map((c: any) => ({
            detailID: c.detailID || c.calculationID,
            certOrDocNo: c.certOrDocNo || "N/A",
            calculatedOn: c.calculatedOn,
            calculatedBy: c.calculatedBy || "System",
            calculationType: c.calculationType || "Calculation",
            totalSumInsured: c.totalSumInsured || 0,
            totalPremium: c.totalPremium || c.netPremium || 0,
            sectionCount: c.sectionCount || 1,
            status: c.status || "ACTIVE",
            isRecommended: true,
          }))

        const merged = [...normalizedEndorsements, ...normalizedCalculations]
        merged.sort(
          (a, b) => new Date(b.calculatedOn).getTime() - new Date(a.calculatedOn).getTime()
        )

        setDisplayList(merged)
      })
      .finally(() => setSectionsLoading(false))
  }

  // ============================================================================
  // FILTER: when type chosen, hide non-endorsable rows
  // ============================================================================
  const memoizedDisplayList = useMemo(() => {
    if (!endorsementType) return displayList

    return displayList.filter((calc) => {
      if (!calc.isRecommended) return true
      return !NON_ENDORSABLE_TYPES.includes(normalizeEndorsementType(calc.calculationType))
    })
  }, [displayList, endorsementType])

  // ============================================================================
  // NAVIGATION
  // ============================================================================
  const handleRowAction = (calc: AvailableCalculation) => {
    const mode = getEndorsementMode(currentPolicy?.riskID)
    const base = `/underwriting/endorsements/edit/${encodeURIComponent(safePolicyNo)}`

    // A row is "blocked" (non-endorsable) if its type is one of the
    // terminal codes. We still let the user open it read-only.
    const isBlocked = NON_ENDORSABLE_TYPES.includes(
      normalizeEndorsementType(calc.calculationType)
    )

    // Endorsable rows still require an endorsement type to be selected first.
    if (!isBlocked && calc.isRecommended && !endorsementType) {
      toast({
        title: "Select a Type",
        description: "Please choose an endorsement type before endorsing.",
        variant: "destructive",
      })
      return
    }

    // An earlier endorsement's record is a valid source too — after a REDO it is the only
    // live record (the original is EXPIRED) — so with a type chosen it is endorsed; without
    // one it opens as itself.
    const effectiveType = isBlocked
      ? 'VIEW'
      : calc.isRecommended || endorsementType
      ? normalizeEndorsementType(endorsementType) || 'ADDITIONAL'
      : normalizeEndorsementType(calc.calculationType)

    const navState = {
      endorsementType: effectiveType,
      detailID: calc.detailID,
      isRecommended: calc.isRecommended,
      certOrDocNo: calc.certOrDocNo,
      readOnly: isBlocked,
      from: location.pathname,
    }

    // Fire and motor both handle every type (REVERSAL included) in their own calculator,
    // so a motor reversal must stay on the motor endpoint.
    navigate(`${base}/${mode}/${encodeURIComponent(calc.detailID)}`, { state: navState })
  }

  const handleCancel = () => {
    navigate("/underwriting/endorsements")
  }

  // Amounts are in the policy's currency
  const formatCurrency = (amount: number | null | undefined) => formatMoney(amount, policyCurrency(currentPolicy), "N/A")

  const isPolicyMatching =
    currentPolicy &&
    ((currentPolicy.policyNo || safePolicyNo)?.trim() === safePolicyNo ||
      currentPolicy.proposalNo?.trim() === safePolicyNo)

  // ============================================================================
  // LOADING / ERROR GATES
  // ============================================================================
  if (error?.fetchPolicy) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-white">
        <div className="flex flex-col items-center gap-4 text-center p-8 border rounded-lg bg-red-50/50">
          <p className="text-red-600 font-bold text-lg">⚠️ Policy Not Found</p>
          <p className="text-gray-600 font-medium">
            {typeof error.fetchPolicy === 'string'
              ? error.fetchPolicy
              : 'The requested policy could not be loaded.'}
          </p>
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

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Available Calculations for Endorsement</h2>
          <p className="text-sm text-gray-500 mt-1">
            Policy: <span className="font-mono font-semibold">{safePolicyNo}</span>
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {isOutdated && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
              Outdated
            </span>
          )}
          <div className="w-56 relative group">
  <select
    className={`
      h-10 w-full rounded-md border px-3 py-2 text-sm font-medium
      transition-all duration-200 ease-out
      hover:shadow-md hover:border-gray-300
      focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1
      active:scale-[0.98]
      cursor-pointer
      ${getEndorsementColorClass(endorsementType)}
      ${!endorsementType ? 'animate-pulse-subtle' : ''}
    `}
    value={endorsementType}
    onChange={(e) => setEndorsementType(e.target.value)}
  >
    <option value="" disabled>
      Select Endorsement Type
    </option>
    {(endorsementTypes || []).map((type: string) => (
      <option key={type} value={type} className="bg-white text-black">
        {type}
      </option>
    ))}
  </select>

  <span
    className="
      pointer-events-none absolute right-3 top-1/2 -translate-y-1/2
      text-gray-500 text-xs
      transition-transform duration-200
      group-hover:translate-y-[-55%]
    "
  >
    ▾
  </span>
</div>
          <Button variant="outline" onClick={handleCancel}>
            Back
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
        {/* Scrollable area — grows with content, caps at 70vh */}
        <div className="overflow-y-auto overflow-x-auto relative custom-scrollbar max-h-[70vh]">
          <table className="w-full text-sm text-left min-w-[900px]">
            <thead className="bg-gray-100 uppercase text-xs font-semibold text-gray-700 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3 whitespace-nowrap">Policy No</th>
                <th className="p-3 whitespace-nowrap">Doc No</th>
                <th className="p-3 whitespace-nowrap">Insured Name</th>
                <th className="p-3 whitespace-nowrap">Calculated On</th>
                <th className="p-3 whitespace-nowrap">Type</th>
                <th className="p-3 text-right whitespace-nowrap">Sum Insured</th>
                <th className="p-3 text-right whitespace-nowrap">Premium</th>
                <th className="p-3 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sectionsLoading || !endorsementTypes || endorsementTypes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <span className="inline-block h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      Loading available calculations...
                    </div>
                  </td>
                </tr>
              ) : memoizedDisplayList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    No available calculations found.
                  </td>
                </tr>
              ) : (
                memoizedDisplayList.map((calc) => {
                  const normalized = normalizeEndorsementType(calc.calculationType)
                  const isBlocked = NON_ENDORSABLE_TYPES.includes(normalized)
                  const needsType = calc.isRecommended && !endorsementType

                  // Every row is now clickable. Blocked rows open read-only.
                  const buttonDisabled = false

                  return (
                    <tr
                      key={calc.detailID}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 font-mono whitespace-nowrap">
                        {safePolicyNo}
                      </td>
                      <td className="p-3 font-medium whitespace-nowrap">
                        {calc.certOrDocNo || calc.detailID}
                      </td>
                      <td
                        className="p-3 max-w-[200px] truncate"
                        title={`${currentPolicy?.insSurname || ''} ${currentPolicy?.insFirstname || ''}`}
                      >
                        {currentPolicy?.insSurname || ''} {currentPolicy?.insFirstname || ''}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {new Date(calc.calculatedOn).toLocaleDateString()}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium inline-block ${getEndorsementColorClass(
                            calc.calculationType
                          )}`}
                        >
                          {calc.calculationType}
                        </span>
                      </td>
                      <td className="p-3 text-right tabular-nums whitespace-nowrap">
                        {formatCurrency(calc.totalSumInsured)}
                      </td>
                      <td className="p-3 text-right tabular-nums whitespace-nowrap">
                        {formatCurrency(calc.totalPremium)}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <Button
                          size="sm"
                          variant={isBlocked ? 'secondary' : 'default'}
                          onClick={() => handleRowAction(calc)}
                          disabled={buttonDisabled}
                          title={
                            isBlocked
                              ? 'View (read-only)'
                              : needsType
                              ? 'Select an endorsement type first'
                              : 'Endorse'
                          }
                        >
                          {isBlocked
                            ? 'View'
                            : calc.isRecommended || endorsementType
                            ? 'Endorse'
                            : 'View'}
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Optional footer: row count + hint */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
          <span>
            {memoizedDisplayList.length} row{memoizedDisplayList.length === 1 ? '' : 's'}
          </span>
          <span className="hidden sm:inline">
            Scroll horizontally for more columns →
          </span>
        </div>
      </div>
    </div>
  )
}

export default EndorsementCalculator