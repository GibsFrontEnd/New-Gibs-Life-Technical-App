//@ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "../../../../features/store"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import type { RootState } from "../../../../features/store"
import {
  getPolicyByNumber,
  getMotorCalculationBreakdownByDetailID,
  setCurrentCalculation,
  fetchPolicies,
  createMotorEndorsement,
  getMotorEndorsementTypes,
  getEndorsableMotorVehicles,
} from "../../../../features/reducers/underwriteReducers/underwritingSlice"
import { Button } from "../../../ui/new-button"
import Input from "../../../ui/Input"
import { Label } from "../../../ui/label"
import { AddPolicyVehicleModal } from "../../../Modals/AddPolicyVehicleModal"
import "../PolicyCalculator.css"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useOutdatedCheck } from "../../../../hooks/use-outdated-check"
import { formatMoney, policyCurrency } from "../../../../utils/currency"

// ============================================================================
// ENDORSEMENT TYPE HELPERS
// ============================================================================
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
// HELPERS
// ============================================================================
const getVehiclePremium = (v: any) =>
  v?.step4_FinalPremium?.resultingAmount ??
  v?.step4_FinalPremium?.premiumDue ??
  v?.sharePremium ??
  v?.premium ??
  v?.netPremium ??
  0

const getVehicleSumInsured = (v: any) =>
  v?.vehicleValue ??
  v?.sumInsured ??
  v?.shareValue ??
  0

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const MotorEndorsementCalculator = () => {
  const { policyNo, detailID: urlDetailID } = useParams<{ policyNo: string; detailID?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch<AppDispatch>()

  const routeState = (location.state as any) || {}
  const [endorsementType] = useState<string>(
    normalizeEndorsementType(routeState.endorsementType)
  )
  const [activeCalculationId] = useState<string | null>(
    urlDetailID || routeState.detailID || null
  )

  const {
    currentPolicy: rawCurrentPolicy,
    loading,
    error,
    policies,
  } = useSelector((state: RootState) => state.underwritings)

  const safePolicyNo = policyNo ? decodeURIComponent(policyNo).trim() : ""
  const currentPolicy =
    rawCurrentPolicy ||
    (safePolicyNo ? ({ policyNo: safePolicyNo, proposalNo: safePolicyNo } as any) : null)

  const { isOutdated } = useOutdatedCheck(safePolicyNo, policies)

  const [vehicles, setVehicles] = useState<any[]>([])
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set())
  const [sectionsLoading, setSectionsLoading] = useState(false)
  const [remarks, setRemarks] = useState("")
  const [extensionEndDate, setExtensionEndDate] = useState<string>("")
  // ADDITIONAL is pro-rated by the API from this date to the policy's expiry
  const [effectiveDate, setEffectiveDate] = useState<string>(() => new Date().toISOString().split("T")[0])

  // Modal state
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false)
  const [editingVehicleIdx, setEditingVehicleIdx] = useState<number | null>(null)

  // ============================================================================
  // COMPUTED FLAGS
  // ============================================================================
  const canEditFields = endorsementType === 'ADDITIONAL' && !isOutdated
  const canTickItems = endorsementType === 'RETURN' || endorsementType === 'REDO'
  const needsDate = endorsementType === 'EXTENSION'
  const isFullyReadOnly =
    isOutdated || endorsementType === 'REVERSAL' || endorsementType === 'EXTENSION'
  const isReadOnly = isFullyReadOnly || !canEditFields

  // ============================================================================
  // EFFECTS
  // ============================================================================
  useEffect(() => {
    if (!policies || policies.length === 0) {
      dispatch(fetchPolicies({ page: 1, pageSize: 100, riskClass: "" }) as any)
    }
  }, [dispatch, policies])

  useEffect(() => {
    dispatch(getMotorEndorsementTypes() as any)
  }, [dispatch])

  useEffect(() => {
    if (!safePolicyNo) return
    const isMatch =
      rawCurrentPolicy &&
      (rawCurrentPolicy.policyNo?.trim() === safePolicyNo ||
        rawCurrentPolicy.proposalNo?.trim() === safePolicyNo)
    if (!isMatch) dispatch(getPolicyByNumber(safePolicyNo) as any)
  }, [dispatch, safePolicyNo, rawCurrentPolicy])

  // ============================================================================
  // INITIAL LOAD
  // ============================================================================
  useEffect(() => {
    if (!safePolicyNo || !activeCalculationId || !endorsementType) return
    if (!currentPolicy) return

    const buildVehicles = (rawBreakdown: any, endorsableList: any[], markExisting = false) => {
      const rawVehicles: any[] =
        rawBreakdown?.vehicleCalculations ??
        rawBreakdown?.calculatedVehicles ??
        []

      const tokensByCert: Record<string, any> = {}
      const endorsable = Array.isArray(endorsableList) ? endorsableList : []
      endorsable.forEach((e: any) => {
        const key = String(e.certificateNo ?? e.certNo ?? "")
        if (!key) return
        tokensByCert[key] = {
          selectionToken: e.selectionToken,
          isExpired: !!e.isExpired,
          stampedBy: e.stampedBy ?? null,
          tag: e.tag ?? "SECTION",
        }
      })

      return rawVehicles.map((v: any) => {
        const certKey = String(v.certificateNo ?? v.certNo ?? "")
        const meta = tokensByCert[certKey] || {}

        return {
          ...v,
          sumInsured: getVehicleSumInsured(v),
          premium: getVehiclePremium(v),
          netPremium: v?.netPremium ?? v?.step4_FinalPremium?.resultingAmount ?? 0,

          selectionToken: meta.selectionToken ?? v.selectionToken,
          isExpired: meta.isExpired ?? false,
          stampedBy: meta.stampedBy ?? null,
          tag: meta.tag ?? v.tag ?? "SECTION",

          _isExisting: markExisting,
        }
      })
    }

    const load = async () => {
      setSectionsLoading(true)
      try {
        if (endorsementType === 'ADDITIONAL') {
          const rawBreakdown: any = await dispatch(
            getMotorCalculationBreakdownByDetailID({
              proposalNo: safePolicyNo,
              detailID: activeCalculationId,
            }) as any
          )
            .unwrap()
            .catch(() => null)

          const built = buildVehicles(rawBreakdown, [], true)
          console.log('[MOTOR ADDITIONAL] rawBreakdown:', rawBreakdown)
          console.log('[MOTOR ADDITIONAL] built vehicles:', built.length, built)
          setVehicles(built)
        } else {
          const [rawBreakdown, endorsable] = await Promise.all([
            dispatch(
              getMotorCalculationBreakdownByDetailID({
                proposalNo: safePolicyNo,
                detailID: activeCalculationId,
              }) as any
            )
              .unwrap()
              .catch(() => null),
            dispatch(
              getEndorsableMotorVehicles({
                policyNo: safePolicyNo,
                detailId: activeCalculationId,
              }) as any
            )
              .unwrap()
              .catch(() => []),
          ])

          const built = buildVehicles(rawBreakdown, endorsable, false)
          console.log('[MOTOR NON-ADD] rawBreakdown:', rawBreakdown)
          console.log('[MOTOR NON-ADD] endorsable:', endorsable)
          console.log('[MOTOR NON-ADD] built vehicles:', built.length, built)
          setVehicles(built)
        }
      } catch (err: any) {
        console.error("Failed to load motor endorsement details:", err)
        toast({
          title: "Error",
          description: err.message || "Failed to load motor calculation details",
          variant: "destructive",
        })
        setVehicles([])
      } finally {
        setSectionsLoading(false)
      }
    }

    load()
  }, [safePolicyNo, activeCalculationId, endorsementType, currentPolicy, dispatch])

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleToggleToken = (token: string, isExpired?: boolean) => {
    if (!token || isExpired) return
    setSelectedTokens((prev) => {
      const next = new Set(prev)
      if (next.has(token)) next.delete(token)
      else next.add(token)
      return next
    })
  }

  const handleDeleteVehicle = (index: number) => {
    if (!window.confirm("Remove this vehicle?")) return
    setVehicles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddVehicle = () => {
    setEditingVehicleIdx(null)
    setShowAddVehicleModal(true)
  }

  const handleEditVehicle = (index: number) => {
    setEditingVehicleIdx(index)
    setShowAddVehicleModal(true)
  }

  const handleSaveVehicle = (saved: any) => {
    setVehicles((prev) => {
      const list = prev ? [...prev] : []
      const clean = { ...saved }
      delete clean._collapsed
      delete clean._showDetails
      delete clean.uiId

      if (editingVehicleIdx == null) {
        list.push({ ...clean, _isExisting: false })
      } else {
        const idx = editingVehicleIdx
        if (idx >= 0 && idx < list.length) {
          list[idx] = { ...list[idx], ...clean, _isExisting: false }
        } else {
          list.push({ ...clean, _isExisting: false })
        }
      }
      return list
    })
    setShowAddVehicleModal(false)
    setEditingVehicleIdx(null)
  }

  // ============================================================================
  // CALCULATE / SAVE
  // ============================================================================
  const handleCalculate = async (navigateBack = false) => {
    if (!safePolicyNo || !endorsementType || !activeCalculationId) {
      toast({
        title: "Missing Data",
        description: "Policy, endorsement type, or source record not set",
        variant: "destructive",
      })
      return
    }

    const type = normalizeEndorsementType(endorsementType)

    const sanitiseVehicle = (v: any) => {
      const {
        _isExisting, _collapsed, _showDetails, uiId,
        selectionToken, isExpired, stampedBy, tag,
        sumInsured, premium, netPremium,
        step1_BasicPremium, step2_AfterDiscounts, step3_AfterLoadings, step4_FinalPremium,
        shareValue, sharePremium,
        ...keep
      } = v
      return keep
    }

    const basePayload: any = {
      policyNo: safePolicyNo,
      endorsementType: type,
      sourceDetailID: String(activeCalculationId),
      createdBy: "System",
      remarks: remarks || `${type} ${safePolicyNo}`,
    }

    if (type === 'ADDITIONAL') {
      if (!effectiveDate) {
        toast({ title: "Missing date", description: "Effective date is required", variant: "destructive" })
        return
      }
      basePayload.effectiveDate = effectiveDate
      basePayload.vehicles = vehicles
        .filter((v: any) => !v._isExisting)
        .map(sanitiseVehicle)

    } else if (type === 'RETURN' || type === 'REDO') {
      const tokens = vehicles
        .map((v: any) => v.selectionToken)
        .filter((t: string) => t && selectedTokens.has(t))
      if (tokens.length === 0) {
        toast({
          title: "Nothing ticked",
          description: `${type} needs at least one vehicle`,
          variant: "destructive",
        })
        return
      }
      basePayload.selectedVehicleTokens = tokens
      if (type === 'REDO') {
        basePayload.description = remarks || "Re-entry of vehicles"
      }

    } else if (type === 'EXTENSION') {
      if (!extensionEndDate) {
        toast({
          title: "Missing date",
          description: "New end date is required",
          variant: "destructive",
        })
        return
      }
      basePayload.newEndDate = extensionEndDate

    } else if (type === 'REDUCTION' || type === 'REVERSAL') {
      // sourceDetailID is all the server needs
    }

    console.log("=== MOTOR ENDORSEMENT PAYLOAD ===", JSON.stringify(basePayload, null, 2))

    // Where we'll go if navigateBack is true
    const cameFrom = routeState.from as string | undefined
    const endorsementsList = "/underwriting/endorsements"

    try {
      const result = await dispatch(createMotorEndorsement(basePayload) as any).unwrap()
      dispatch(setCurrentCalculation(result))

      toast({
        title: "Success",
        description: `${type} processed.`,
        variant: "default",
      })

      if (navigateBack) {
        // Let the toast render before routing away
        setTimeout(() => {
          if (cameFrom) navigate(cameFrom)
          else if (window.history.length > 1) navigate(-1)
          else navigate(endorsementsList)
        }, 500)
      }
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Error",
        description: err.message || "Motor endorsement failed",
        variant: "destructive",
      })
    }
  }

  // Amounts are in the policy's currency
  const formatCurrency = (amount: number | null | undefined) => formatMoney(amount, policyCurrency(currentPolicy), "N/A")

  const isPolicyMatching =
    currentPolicy &&
    ((currentPolicy.policyNo || safePolicyNo)?.trim() === safePolicyNo ||
      currentPolicy.proposalNo?.trim() === safePolicyNo)

  if (error?.fetchPolicy) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-white">
        <div className="text-center p-8 border rounded-lg bg-red-50/50">
          <p className="text-red-600 font-bold text-lg">⚠️ Policy Not Found</p>
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
          <p className="text-gray-500 font-medium">Loading Policy & Motor Data...</p>
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
              <h1>Motor Endorsement Calculator</h1>
              <p className="text-sm text-gray-500 mt-1">
                Policy: <span className="font-mono font-semibold">{safePolicyNo}</span>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                navigate(`/underwriting/endorsements/edit/${encodeURIComponent(safePolicyNo)}/calculator`)
              }
            >
              Back
            </Button>
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
              <Label className="font-bold">Endorsement Type</Label>
              <select
                value={endorsementType}
                disabled
                className={`h-10 w-full rounded-md border px-3 py-2 text-sm font-semibold ${getEndorsementColorClass(endorsementType)}`}
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
                />
              </div>
            )}
          </div>
        </div>

        <div className="pc-content">
          <div className="pc-sections-panel">
            <div className="pc-sections-header">
              <h3>Vehicles ({vehicles.length})</h3>
              <div className="flex items-center gap-3">
                {canTickItems && (
                  <span className="text-xs text-gray-500">
                    {selectedTokens.size} selected
                  </span>
                )}
                {canEditFields && (
                  <Button onClick={handleAddVehicle} size="sm">
                    Add Vehicle
                  </Button>
                )}
              </div>
            </div>

            {sectionsLoading ? (
              <div className="pc-no-sections">
                <Loader2 className="animate-spin" />
              </div>
            ) : vehicles.length === 0 ? (
              <div className="pc-no-sections">
                <p>
                  No vehicles found.{' '}
                  {endorsementType === 'ADDITIONAL' && 'Click "Add Vehicle" to begin.'}
                </p>
              </div>
            ) : (
              <div className="pc-sections-table-wrap">
                <table className="pc-sections-table">
                  <thead>
                    <tr>
                      <th className="w-10"></th>
                      <th>#</th>
                      <th>Reg No</th>
                      <th>Make</th>
                      <th>Model</th>
                      <th>Vehicle Type</th>
                      <th>Cover Type</th>
                      <th className="text-right">Sum Insured</th>
                      <th className="text-right">Premium</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((v, idx) => {
                      const token = v.selectionToken
                      const isTicked = token && selectedTokens.has(token)
                      const rowKey = token || v.certificateNo || idx
                      const isExpired = !!v.isExpired
                      const isExisting = !!v._isExisting

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
                         <td className="text-center">
  <input
    type="checkbox"
    checked={!!isTicked}
    onChange={() => handleToggleToken(token, isExpired)}
    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    disabled={!canTickItems || !token || isExpired}
    style={{ cursor: canTickItems && token && !isExpired ? 'pointer' : 'not-allowed' }}
    title={
      !canTickItems
        ? `Ticking is only used for RETURN and REDO. ${endorsementType} applies to every vehicle on cover.`
        : isExpired
        ? `Already off cover${v.stampedBy ? ` (${v.stampedBy})` : ""}`
        : ""
    }
  />
</td>
                          <td>{idx + 1}</td>
                          <td>
                            {v.vehicleRegNo || '—'}
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
                          <td>{v.vehicleMake || '—'}</td>
                          <td>{v.vehicleModel || '—'}</td>
                          <td>{v.vehicleType || '—'}</td>
                          <td>{v.coverType || '—'}</td>
                          <td className="text-right">{formatCurrency(v.sumInsured || 0)}</td>
                          <td className="text-right">{formatCurrency(v.premium || 0)}</td>
                          <td>
                            <div className="flex gap-2">
                              {canEditFields && !isExisting && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditVehicle(idx)}
                                >
                                  Edit
                                </Button>
                              )}
                              {canEditFields && !isExisting && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteVehicle(idx)}
                                >
                                  Remove
                                </Button>
                              )}
                              {!canEditFields && !canTickItems && (
                                <span className="text-xs text-gray-400 italic">Read-only</span>
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

          <div className="flex gap-4 w-full mt-6">
            {endorsementType === 'REVERSAL' ? (
              <Button
                onClick={() => handleCalculate(false)}
                disabled={loading?.createEndorsement}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {loading?.createEndorsement ? 'Reversing...' : 'Reverse Endorsement'}
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => handleCalculate(false)}
                  disabled={
                    loading?.createEndorsement ||
                    (endorsementType === 'ADDITIONAL' &&
                      vehicles.filter((v: any) => !v._isExisting).length === 0) ||
                    ((endorsementType === 'RETURN' || endorsementType === 'REDO') &&
                      selectedTokens.size === 0) ||
                    (endorsementType === 'EXTENSION' && !extensionEndDate)
                  }
                  className="w-full"
                >
                  {loading?.createEndorsement ? "Processing..." : `Apply ${endorsementType}`}
                </Button>
                <Button
                  onClick={() => handleCalculate(true)}
                  disabled={
                    loading?.createEndorsement ||
                    (endorsementType === 'ADDITIONAL' &&
                      vehicles.filter((v: any) => !v._isExisting).length === 0) ||
                    ((endorsementType === 'RETURN' || endorsementType === 'REDO') &&
                      selectedTokens.size === 0) ||
                    (endorsementType === 'EXTENSION' && !extensionEndDate)
                  }
                  className="bg-green-600 hover:bg-green-700 w-full"
                >
                  {loading?.createEndorsement ? "Processing..." : "Save & Return"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <AddPolicyVehicleModal
        currency={policyCurrency(currentPolicy)}
        isOpen={showAddVehicleModal}
        onClose={() => {
          setShowAddVehicleModal(false)
          setEditingVehicleIdx(null)
        }}
        onSave={handleSaveVehicle}
        vehicle={
          editingVehicleIdx != null
            ? vehicles[editingVehicleIdx]
            : undefined
        }
        // An added vehicle is covered from the endorsement's effective date to the policy end
        defaultStartDate={effectiveDate || (currentPolicy?.startDate ? String(currentPolicy.startDate).split('T')[0] : undefined)}
        defaultEndDate={currentPolicy?.endDate ? String(currentPolicy.endDate).split('T')[0] : undefined}
        nextItemNo={(vehicles?.length || 0) + 1}
      />
    </>
  )
}

export default MotorEndorsementCalculator