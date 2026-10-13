//@ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"
import type { AppDispatch, RootState } from "../../../../features/store"
import {
  getPolicyByNumber,
  getMotorCalculationBreakdownByDetailID,
  getRenewableMotorVehicles,
  renewMotorVehicles,
} from "../../../../features/reducers/underwriteReducers/underwritingSlice"
import { Button } from "../../../ui/new-button"
import Input from "../../../ui/Input"
import { Label } from "../../../ui/label"
import { toast } from "sonner"
import "../PolicyCalculator.css"
import { Loader2, Eye, ChevronDown } from "lucide-react"
import { AddPolicyVehicleModal } from "../../../Modals/AddPolicyVehicleModal"
import { formatMoney, policyCurrency } from "../../../../utils/currency"

export const MotorRenewalCalculator = () => {
  const { policyNo, detailID } = useParams<{ policyNo: string; detailID: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const { currentPolicy: rawCurrentPolicy } = useSelector(
    (state: RootState) => state.underwritings
  )

  const safePolicyNo = policyNo ? decodeURIComponent(policyNo).trim() : ""
  const currentPolicy =
    rawCurrentPolicy ||
    (safePolicyNo ? ({ policyNo: safePolicyNo, proposalNo: safePolicyNo } as any) : null)

  const [isLoading, setIsLoading] = useState(true)
  const [isRenewing, setIsRenewing] = useState(false)
  const [breakdown, setBreakdown] = useState<any>(null)
  const [vehicleList, setVehicleList] = useState<any[]>([])
  const [selectedTokens, setSelectedTokens] = useState<string[]>([])
  const [remarks, setRemarks] = useState("")
  const [adjCollapse, setAdjCollapse] = useState(false)
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  // View modal state
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingVehicle, setViewingVehicle] = useState<any>(null)

  // 1. Fetch policy details if not loaded
  useEffect(() => {
    if (safePolicyNo && !rawCurrentPolicy) {
      dispatch(getPolicyByNumber(safePolicyNo) as any)
    }
  }, [dispatch, safePolicyNo, rawCurrentPolicy])

  // 2. Load breakdown + renewable vehicles
  useEffect(() => {
    if (!safePolicyNo || !detailID) return

    setIsLoading(true)

    dispatch(
      getMotorCalculationBreakdownByDetailID({
        proposalNo: safePolicyNo,
        detailID,
      }) as any
    )
      .unwrap()
      .then(async (breakdownData: any) => {
        setBreakdown(breakdownData)

        const rawVehicles =
          breakdownData?.vehicleCalculations ||
          breakdownData?.calculatedVehicles ||
          []

        try {
          const renewableData = await dispatch(
            getRenewableMotorVehicles({
              proposalNo: safePolicyNo,
              detailID,
            }) as any
          ).unwrap()

          const renewableArray = Array.isArray(renewableData) ? renewableData : []

          const enriched = rawVehicles.map((item: any, idx: number) => {
            const renToken =
              renewableArray[idx]?.vehicleToken ||
              renewableArray[idx]?.selectionToken ||
              renewableArray[idx]?.token ||
              item.vehicleToken ||
              item.selectionToken ||
              ""

            return {
              ...item,
              selectionToken: renToken,
            }
          })

          setVehicleList(enriched)
          // No auto-selection
        } catch (tokenErr) {
          console.warn("Could not fetch renewal tokens, showing breakdown:", tokenErr)
          setVehicleList(rawVehicles)
        }
      })
      .catch((err: any) => {
        console.error("Failed to fetch motor breakdown:", err)
        toast.error(err?.message || "Failed to load motor calculation details.")
      })
      .finally(() => setIsLoading(false))
  }, [dispatch, safePolicyNo, detailID])

  // ===== Selection handlers =====
  const totalVehicles = vehicleList.length
  const selectedCount = selectedTokens.length
  const allSelected = totalVehicles > 0 && selectedCount === totalVehicles

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedTokens([])
    } else {
      const allTokens = vehicleList.map((v) => v.selectionToken).filter(Boolean)
      setSelectedTokens(allTokens)
    }
  }

  const handleToggleToken = (token: string) => {
    if (!token) return
    setSelectedTokens((prev) =>
      prev.includes(token) ? prev.filter((t) => t !== token) : [...prev, token]
    )
  }

  const toggleRow = (itemNo: number) => {
    const next = new Set(expandedRows)
    if (next.has(itemNo)) next.delete(itemNo)
    else next.add(itemNo)
    setExpandedRows(next)
  }

  const handleBackToList = () => {
    navigate(`/underwriting/renewals/edit/${encodeURIComponent(safePolicyNo)}/calculator`)
  }

  // ===== Renewal execution =====
  const handleRenew = async () => {
    if (selectedTokens.length === 0) {
      toast.error("Please select at least one vehicle to renew.")
      return
    }

    setIsRenewing(true)
    try {
      const safeRemarks = remarks.trim()
        ? remarks.trim().substring(0, 30)
        : `Renewal ${safePolicyNo}`.substring(0, 30)

      const payload = {
        proposalNo: safePolicyNo,
        detailID: detailID!,
        selectedVehicleTokens: selectedTokens,
        renewedBy: "System",
        remarks: safeRemarks,
      }

      const result = await dispatch(renewMotorVehicles(payload) as any).unwrap()

      toast.success(
        result?.message || `Successfully renewed ${selectedTokens.length} vehicle(s)!`
      )

      handleBackToList()
    } catch (err: any) {
      console.error("Motor renewal failed:", err)
      toast.error(err?.message || "Failed to renew motor calculation.")
    } finally {
      setIsRenewing(false)
    }
  }

  // Amounts are in the policy's currency
  const formatCurrency = (amount: number | null | undefined) => formatMoney(amount, policyCurrency(currentPolicy), "N/A")

  const getPremium = (v: any) =>
    v?.step4_FinalPremium?.resultingAmount ??
    v?.step4_FinalPremium?.premiumDue ??
    v?.aggregatePremium ??
    0

  // Dynamic label for the top + bottom Renew buttons
  const renewButtonLabel = () => {
    if (isRenewing) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Renewing...
        </>
      )
    }
    if (selectedCount === 0) return "Renew"
    if (allSelected) return `Renew All (${totalVehicles})`
    return `Renew (${selectedCount})`
  }

  // ===== Loading state =====
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-gray-500 font-medium">Loading Motor Renewal Details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pc-container">
      {/* Header */}
      <div className="pc-header-container mb-8">
        <div className="pc-header flex justify-between items-center pb-4 border-b border-gray-200">
          <div>
            <h1>Motor Renewal Calculator</h1>
          </div>
          <div className="pc-header-actions flex gap-2">
            <Button onClick={handleBackToList} variant="outline">
              Back
            </Button>
          </div>
        </div>

        <div className="pc-policy-header-grid">
          <div className="pc-policy-header-item">
            <Label>Policy No</Label>
            <Input value={safePolicyNo} disabled />
          </div>
          <div className="pc-policy-header-item">
            <Label>Insured Name</Label>
            <Input
              value={`${currentPolicy?.insSurname || ""} ${currentPolicy?.insFirstname || ""}`.trim() || "—"}
              disabled
            />
          </div>
          <div className="pc-policy-header-item">
            <Label>Doc / Detail ID</Label>
            <Input value={breakdown?.certOrDocNo || detailID || "—"} disabled />
          </div>
        </div>
      </div>

      <div className="pc-content">
        {/* Vehicles Panel */}
        <div className="pc-sections-panel">
          <div className="pc-sections-header flex justify-between items-center">
            <h3>Vehicles ({totalVehicles})</h3>

            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-gray-600">
                Selected: <span className="font-bold text-blue-600">{selectedCount}</span> / {totalVehicles}
              </div>
              <Button
                onClick={handleRenew}
                disabled={isRenewing || selectedCount === 0}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {renewButtonLabel()}
              </Button>
            </div>
          </div>

          {vehicleList.length === 0 ? (
            <div className="pc-no-sections">
              <p>No vehicle records found in this calculation breakdown.</p>
            </div>
          ) : (
            <div className="pc-sections-table-wrap custom-scrollbar">
              <table className="pc-sections-table w-full" role="table" aria-label="Vehicle Renewal">
                <thead>
                  <tr>
                    <th className="w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                        aria-label="Select all vehicles"
                      />
                    </th>
                    <th className="w-10">#</th>
                    <th className="min-w-[120px] font-semibold">Reg No</th>
                    <th className="min-w-[120px]">Vehicle Type</th>
                    <th className="min-w-[120px]">Cover Type</th>
                    <th className="min-w-[120px]">Location</th>
                    <th className="min-w-[110px] text-right">Premium</th>
                    <th className="min-w-[80px] text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleList.map((vehicle, index) => {
                    const token = vehicle.selectionToken
                    const isChecked = selectedTokens.includes(token)

                    return (
                      <tr
                        key={token || vehicle.itemNo || index}
                        className={`pc-section-row hover:bg-gray-50 transition-colors ${isChecked ? "bg-blue-50/50" : ""}`}
                      >
                        <td className="text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleToken(token)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                            aria-label={`Select vehicle ${index + 1}`}
                          />
                        </td>
                        <td className="text-center text-gray-500 text-sm">{index + 1}</td>
                        <td className="font-medium text-blue-700">
                          {vehicle.vehicleRegNo || "—"}
                        </td>
                        <td>{vehicle.vehicleType || "—"}</td>
                        <td>{vehicle.coverType || "—"}</td>
                        <td>{vehicle.location || "—"}</td>
                        <td className="text-right font-mono text-sm font-semibold text-emerald-600">
                          {formatCurrency(getPremium(vehicle))}
                        </td>
                        <td className="text-center">
                          <Button
                            onClick={() => {
                              setViewingVehicle(vehicle)
                              setShowViewModal(true)
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs hover:bg-blue-50 hover:text-blue-700"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Remarks Panel */}
        <div className="pc-adjustments-panel mt-6">
          <h3 className="flex justify-between items-center text-xl font-semibold text-gray-900 mb-6">
            <span>Renewal Parameters & Remarks</span>
            <button
              className="text-blue-600 hover:text-blue-800 text-sm font-medium bg-transparent border-0 cursor-pointer"
              onClick={() => setAdjCollapse(!adjCollapse)}
              aria-label={adjCollapse ? "Expand item" : "Collapse item"}
            >
              {adjCollapse ? "Expand ▾" : "Collapse ▴"}
            </button>
          </h3>

          {!adjCollapse && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="pc-adjustments-card col-span-full">
                <h4 className="font-semibold text-gray-900 mb-4">Renewal Remarks</h4>
                <div className="flex flex-col gap-2">
                  <Input
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g., Annual Motor Policy Renewal"
                    maxLength={30}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400">Max 30 characters</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 w-full mt-6 mb-8">
          <Button
            onClick={handleBackToList}
            variant="outline"
            className="w-1/2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRenew}
            disabled={isRenewing || selectedCount === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white w-1/2"
          >
            {renewButtonLabel()}
          </Button>
        </div>

        {/* Calculation Results / Breakdown */}
        {breakdown && (
          <div className="pc-calculation-results">
            <div className="pc-results-header">
              <h3>Previous Calculation Details</h3>
              <Button
                onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
                variant="outline"
                size="sm"
              >
                {showDetailedBreakdown ? "Show Summary" : "Show Detailed Breakdown"}
              </Button>
            </div>

            {!showDetailedBreakdown ? (
              <div className="pc-results-grid">
                <div className="pc-result-item">
                  <Label>Total Sum Insured</Label>
                  <div className="pc-result-value">
                    {formatCurrency(
                      breakdown.totalSumInsured ||
                      breakdown.finalResults?.totalSumInsured
                    )}
                  </div>
                </div>
                <div className="pc-result-item">
                  <Label>Total Premium</Label>
                  <div className="pc-result-value">
                    {formatCurrency(
                      breakdown.totalPremium ||
                      breakdown.finalResults?.sharePremium
                    )}
                  </div>
                </div>
                <div className="pc-result-item">
                  <Label>Net Premium</Label>
                  <div className="pc-result-value">
                    {formatCurrency(
                      breakdown.totalNetPremium ||
                      breakdown.finalResults?.totalNetPremium
                    )}
                  </div>
                </div>
                <div className="pc-result-item">
                  <Label>Pro-Rata Premium</Label>
                  <div className="pc-result-value pc-highlight">
                    {formatCurrency(
                      breakdown.finalPremiumDue ||
                      breakdown.finalResults?.proRataPremium
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="pc-detailed-breakdown">
                {breakdown.vehicleCalculations && breakdown.vehicleCalculations.length > 0 && (
                  <div className="pc-breakdown-section">
                    <h4>Vehicle Breakdown</h4>
                    <div className="pc-items-table">
                      <table>
                        <thead>
                          <tr>
                            <th className="w-12"></th>
                            <th>Reg No</th>
                            <th>Vehicle Type</th>
                            <th>Cover Type</th>
                            <th className="text-right">Vehicle Value</th>
                            <th className="text-right">Final Premium</th>
                          </tr>
                        </thead>
                        {breakdown.vehicleCalculations.map((calc: any) => (
                          <tbody key={calc.itemNo}>
                            <tr className="pc-section-row">
                              <td className="px-6 py-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleRow(calc.itemNo)}
                                  className="h-8 w-8 p-0"
                                >
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform ${expandedRows.has(calc.itemNo) ? "rotate-180" : ""}`}
                                  />
                                </Button>
                              </td>
                              <td className="font-medium">{calc.vehicleRegNo}</td>
                              <td>{calc.vehicleType}</td>
                              <td>{calc.coverType}</td>
                              <td className="text-right">
                                {formatCurrency(calc.vehicleValue)}
                              </td>
                              <td className="text-right font-semibold">
                                {formatCurrency(getPremium(calc))}
                              </td>
                            </tr>
                            {expandedRows.has(calc.itemNo) && (
                              <tr>
                                <td colSpan={6} className="p-0 bg-gray-50/50">
                                  <div className="p-6 border-b border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                      {/* Step 1 */}
                                      <div>
                                        <h5 className="font-semibold text-gray-700 mb-3 border-b pb-2">
                                          Step 1: Risk Items
                                        </h5>
                                        {calc.step1_RiskItems?.calculatedItems?.length > 0 ? (
                                          <ul className="space-y-2">
                                            {calc.step1_RiskItems.calculatedItems.map((item: any, i: number) => (
                                              <li key={i} className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                  {item.smiName || item.smiCode}
                                                </span>
                                                <span className="font-medium">
                                                  {formatCurrency(item.premium)}
                                                </span>
                                              </li>
                                            ))}
                                            <li className="flex justify-between text-sm font-semibold pt-2 border-t mt-2">
                                              <span>Total Premium</span>
                                              <span>
                                                {formatCurrency(calc.step1_RiskItems.aggregatePremium)}
                                              </span>
                                            </li>
                                          </ul>
                                        ) : (
                                          <p className="text-sm text-gray-500 italic">No risk items.</p>
                                        )}
                                      </div>

                                      {/* Step 2 */}
                                      <div>
                                        <h5 className="font-semibold text-gray-700 mb-3 border-b pb-2">
                                          Step 2: Loadings
                                        </h5>
                                        {calc.step2_AfterLoadings?.adjustments?.length > 0 ? (
                                          <ul className="space-y-2">
                                            {calc.step2_AfterLoadings.adjustments.map((adj: any, i: number) => (
                                              <li key={i} className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                  {adj.name} ({adj.rate}%)
                                                </span>
                                                <span className="font-medium text-orange-600">
                                                  +{formatCurrency(adj.amount)}
                                                </span>
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <p className="text-sm text-gray-500 italic">
                                            No loadings applied.
                                          </p>
                                        )}
                                      </div>

                                      {/* Step 3 */}
                                      <div>
                                        <h5 className="font-semibold text-gray-700 mb-3 border-b pb-2">
                                          Step 3: Discounts
                                        </h5>
                                        {calc.step3_AfterDiscounts?.adjustments?.length > 0 ? (
                                          <ul className="space-y-2">
                                            {calc.step3_AfterDiscounts.adjustments.map((adj: any, i: number) => (
                                              <li key={i} className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                  {adj.name} ({adj.rate}%)
                                                </span>
                                                <span className="font-medium text-green-600">
                                                  -{formatCurrency(adj.amount)}
                                                </span>
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <p className="text-sm text-gray-500 italic">
                                            No discounts applied.
                                          </p>
                                        )}
                                      </div>

                                      {/* Step 4 */}
                                      <div>
                                        <h5 className="font-semibold text-gray-700 mb-3 border-b pb-2">
                                          Step 4: Final Premium
                                        </h5>
                                        <div className="flex justify-between text-sm font-semibold pt-2 border-t mt-2">
                                          <span>Final Premium</span>
                                          <span className="text-blue-600">
                                            {formatCurrency(getPremium(calc))}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        ))}
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* View vehicle modal */}
      {showViewModal && viewingVehicle && (
        <AddPolicyVehicleModal
          currency={policyCurrency(currentPolicy)}
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false)
            setViewingVehicle(null)
          }}
          onSave={() => {}}
          vehicle={viewingVehicle}
          isReadOnly
        />
      )}
    </div>
  )
}

export default MotorRenewalCalculator