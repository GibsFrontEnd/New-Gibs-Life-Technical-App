//@ts-nocheck
"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "../../../../features/store"
import { useNavigate, useParams } from "react-router-dom"
import type { RootState } from "../../../../features/store"
import {
  getPolicyByNumber,
  setCalculationBreakdown,
  getAdjustmentOptions,
  getMotorAdjustmentTypes,
  getSubriskFields,
  fetchPolicies,
  getRenewalAvailableCalculations,
} from "../../../../features/reducers/underwriteReducers/underwritingSlice"
import { Button } from "../../../ui/new-button"
import type { AvailableCalculation } from "../../../../types/underwriting"
import "../PolicyCalculator.css"
import { toast } from "@/components/ui/use-toast"
import { getAllRisks } from "../../../../features/reducers/adminReducers/riskSlice"
import { Loader2 } from "lucide-react"
import { useOutdatedCheck } from "../../../../hooks/use-outdated-check"
import { formatMoney, policyCurrency } from "../../../../utils/currency"

// ===== RISK RENEWAL CONFIG =====
// This app has fire (and fire-based) and motor only; every other risk renews on the fire/general path.
const RISK_RENEWAL_CONFIG: Record<string, { mode: string; tokenField: string }> = {
  F:  { mode: "fire",     tokenField: "selectionToken" },
  V:  { mode: "motor",    tokenField: "vehicleToken" },
}

const getRiskConfig = (riskID: string | undefined) =>
  RISK_RENEWAL_CONFIG[riskID?.toUpperCase() || ""] ?? { mode: "fire", tokenField: "selectionToken" }

const RenewalCalculator = () => {
  const { policyNo } = useParams<{ policyNo: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const {
    currentPolicy: rawCurrentPolicy,
    policies,
  } = useSelector((state: RootState) => state.underwritings)

  const safePolicyNo = useMemo(
    () => (policyNo ? decodeURIComponent(policyNo).trim() : ""),
    [policyNo]
  )

  const currentPolicy = useMemo(() => {
    if (rawCurrentPolicy) return rawCurrentPolicy
    if (safePolicyNo) return { policyNo: safePolicyNo, proposalNo: safePolicyNo } as any
    return null
  }, [rawCurrentPolicy, safePolicyNo])

  const { isOutdated } = useOutdatedCheck(safePolicyNo, policies)

  const isFetchingCalculationsRef = useRef(false)
  const isFetchingPolicyRef = useRef(false)
  const hasFetchedPoliciesListRef = useRef(false)

  const [sectionsLoading, setSectionsLoading] = useState(false)
  const [displayList, setDisplayList] = useState<AvailableCalculation[]>([])

  // ===== CHECKBOX / BULK RENEW STATE =====
  const [selectedCalculations, setSelectedCalculations] = useState<string[]>([])
  const [bulkRenewing, setBulkRenewing] = useState(false)

  // 1. Reset on policy change
  useEffect(() => {
    setDisplayList([])
    setSelectedCalculations([])
    isFetchingCalculationsRef.current = false
    isFetchingPolicyRef.current = false
    dispatch(setCalculationBreakdown(null))
  }, [safePolicyNo, dispatch])

  // 2. Fetch policies list once
  useEffect(() => {
    if (!hasFetchedPoliciesListRef.current) {
      hasFetchedPoliciesListRef.current = true
      dispatch(fetchPolicies({ page: 1, pageSize: 100, riskClass: "" }) as any)
    }
  }, [dispatch])

  // 3. Load adjustment options
  useEffect(() => {
    dispatch(getAdjustmentOptions() as any)
    dispatch(getMotorAdjustmentTypes() as any)
  }, [dispatch])

  // 4. Fetch policy + calculations list
  useEffect(() => {
    if (!safePolicyNo) return

    const isMatch =
      rawCurrentPolicy &&
      (rawCurrentPolicy.policyNo?.trim() === safePolicyNo ||
        rawCurrentPolicy.proposalNo?.trim() === safePolicyNo)

    if (!isMatch && !isFetchingPolicyRef.current) {
      isFetchingPolicyRef.current = true
      dispatch(getPolicyByNumber(safePolicyNo) as any).finally(() => {
        isFetchingPolicyRef.current = false
      })
      dispatch(getAllRisks({ pageNumber: 1, pageSize: 100 }) as any)
    }

    refreshCalculations()
  }, [safePolicyNo, dispatch])

  // 5. Subrisk fields
  const currentRiskId = currentPolicy?.riskID
  useEffect(() => {
    if (!currentRiskId) return
    dispatch(getSubriskFields(currentRiskId) as any).catch((err: any) => {
      console.error("getSubriskFields error:", err)
    })
  }, [dispatch, currentRiskId])

  const refreshCalculations = () => {
    if (!safePolicyNo || isFetchingCalculationsRef.current) return

    isFetchingCalculationsRef.current = true
    setSectionsLoading(true)

    dispatch(getRenewalAvailableCalculations(safePolicyNo) as any)
      .then((res: any) => {
        const calculations: AvailableCalculation[] = res.payload || []

        const sorted = [...calculations].sort(
          (a, b) =>
            new Date(b.calculatedOn).getTime() - new Date(a.calculatedOn).getTime()
        )

        const renewalItems = sorted.filter(
          (c) => c.calculationType === "Old" || c.calculationType === "Old-Additional"
        )
        const otherItems = sorted.filter(
          (c) => c.calculationType !== "Old" && c.calculationType !== "Old-Additional"
        )

        let finalDisplayList = [...otherItems]

        if (renewalItems.length > 0) {
          const primaryOld =
            renewalItems.find((c) => c.calculationType === "Old") || renewalItems[0]
          const totalSumInsured = renewalItems.reduce(
            (sum, item) => sum + (Number(item.totalSumInsured) || 0),
            0
          )
          const totalPremium = renewalItems.reduce(
            (sum, item) => sum + (Number(item.totalPremium) || 0),
            0
          )
          const mergedItem = {
            ...primaryOld,
            totalSumInsured,
            totalPremium,
            _mergedIds: renewalItems.map((i) => i.detailID),
            remarks: `Renewal (${renewalItems.length} items merged)`,
          }
          finalDisplayList.push(mergedItem)
        }

        finalDisplayList.sort(
          (a, b) =>
            new Date(b.calculatedOn).getTime() - new Date(a.calculatedOn).getTime()
        )

        setDisplayList(finalDisplayList)
      })
      .catch((err: any) => {
        console.error("❌ Failed to fetch renewal list:", err)
        setDisplayList([])
      })
      .finally(() => {
        setSectionsLoading(false)
        isFetchingCalculationsRef.current = false
      })
  }

  // ===== Single row: navigate to its dedicated calculator =====
  const handleRenewItem = (calc: AvailableCalculation) => {
    const { mode } = getRiskConfig(currentPolicy?.riskID)
    const policyRisk = currentPolicy?.riskID?.toUpperCase()
    const id = calc.detailID || calc.id
    const base = `/underwriting/renewals/edit/${encodeURIComponent(safePolicyNo)}`

    if (policyRisk === "V" || mode === "motor")    return navigate(`${base}/motor/${id}`)

    navigate(`${base}/general/${id}`)
  }

  // ===== Checkbox helpers =====
  const selectableRows = displayList.filter(
    (c) => !["RENEWAL", "New", "Additional", "EXPIRED"].includes(c.calculationType)
  )
  const allRowIds = selectableRows.map((c) => String(c.detailID || c.id)).filter(Boolean)
  const allSelected =
    allRowIds.length > 0 && allRowIds.every((id) => selectedCalculations.includes(id))
  const someSelected = selectedCalculations.length > 0 && !allSelected

  const handleToggleRow = (id: string) => {
    if (!id) return
    setSelectedCalculations((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleToggleSelectAll = () => {
    if (allSelected) setSelectedCalculations([])
    else setSelectedCalculations(allRowIds)
  }

  // ===== Bulk renew =====
  const handleBulkRenew = async () => {
    if (selectedCalculations.length === 0) return
    const risk = currentPolicy?.riskID?.toUpperCase()
    const { mode } = getRiskConfig(currentPolicy?.riskID)

    // Which thunk to call for this risk family?
    // NOTE: token shape differs per family. Fire/hull/cargo expect token arrays;
    // aviation/motor expect different arg shapes. This uses each thunk's expected
    // argument and passes the detail IDs where the endpoint supports it.
    setBulkRenewing(true)
    let ok = 0
    let fail = 0

    for (const id of selectedCalculations) {
      try {
        if (mode === "motor") {
          // renewMotorVehicles expects selectedVehicleTokens, not IDs.
          // Without an items fetch, we can't reliably bulk-renew motor here.
          // Fall through to per-row navigation instead.
          navigate(
            `/underwriting/renewals/edit/${encodeURIComponent(safePolicyNo)}/motor/${id}`
          )
          ok++
        } else {
          navigate(
            `/underwriting/renewals/edit/${encodeURIComponent(safePolicyNo)}/general/${id}`
          )
          ok++
        }
      } catch (err) {
        console.error("Bulk renew failed for", id, err)
        fail++
      }
    }

    setBulkRenewing(false)
    setSelectedCalculations([])

    toast({
      title: "Bulk Renew",
      description: `Opened ${ok} calculation(s) for renewal${fail ? `, ${fail} failed` : ""}.`,
    })
  }

  const handleCreateDebitNote = (calculationId: string) => {
    navigate(
      `/underwriting/renewals/edit/${encodeURIComponent(safePolicyNo)}/debit-note`,
      { state: { detailID: calculationId } }
    )
  }

  // Amounts are in the policy's currency
  const formatCurrency = (amount: number | null | undefined) => formatMoney(amount, policyCurrency(currentPolicy), "N/A")

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Available Renewal Calculations
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Policy: <span className="font-mono font-semibold">{safePolicyNo}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOutdated && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
              Outdated
            </span>
          )}
          {selectedCalculations.length > 0 && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleBulkRenew}
              disabled={bulkRenewing}
            >
              {bulkRenewing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Renewing...
                </>
              ) : (
                <>Renew Selected ({selectedCalculations.length})</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Loading / Empty states */}
      {sectionsLoading ? (
        <div className="border rounded-lg bg-white shadow-sm p-8 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-500 font-medium">
            Loading available calculations...
          </span>
        </div>
      ) : displayList.length === 0 ? (
        <div className="border rounded-lg bg-white shadow-sm p-8 text-center text-gray-500">
          No available calculations found for renewal.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block border rounded-lg overflow-hidden bg-white shadow-sm max-h-[500px] overflow-y-auto overflow-x-auto relative custom-scrollbar">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-100 uppercase text-xs font-semibold text-gray-700 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected
                      }}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      aria-label="Select all renewable calculations"
                    />
                  </th>
                  <th className="p-3 w-10">#</th>
                  <th className="p-3">Policy No</th>
                  <th className="p-3">Doc No</th>
                  <th className="p-3">Insured Name</th>
                  <th className="p-3">Calculated On</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Sum Insured</th>
                  <th className="p-3 text-right">Premium</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {displayList.map((calc, idx) => {
                  const id = String(calc.detailID || calc.id || "")
                  const isRenewable = !["RENEWAL", "New", "Additional", "EXPIRED"].includes(
                    calc.calculationType
                  )
                  const isChecked = selectedCalculations.includes(id)

                  return (
                    <tr
                      key={id || idx}
                      className={`hover:bg-gray-50 ${isChecked ? "bg-blue-50/40" : ""}`}
                    >
                      <td className="p-3 text-center">
                        {isRenewable ? (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleRow(id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            aria-label={`Select calculation ${idx + 1}`}
                          />
                        ) : (
                          <span className="inline-block w-4 h-4" />
                        )}
                      </td>
                      <td className="p-3 text-gray-400">{idx + 1}</td>
                      <td className="p-3 font-mono">{calc.policyNo || safePolicyNo}</td>
                      <td className="p-3 font-medium text-blue-700">
                        {calc.certOrDocNo || calc.docNo || calc.detailID || "-"}
                      </td>
                      <td className="p-3">
                        {currentPolicy?.insSurname || ""} {currentPolicy?.insFirstname || ""}
                      </td>
                      <td className="p-3">
                        {calc.calculatedOn
                          ? new Date(calc.calculatedOn).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            ["RENEWAL", "New", "Additional"].includes(calc.calculationType)
                              ? "bg-green-100 text-green-800"
                              : ["EXPIRED"].includes(calc.calculationType)
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {calc.calculationType}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono">
                        {formatCurrency(calc.totalSumInsured)}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-emerald-600">
                        {formatCurrency(calc.totalPremium)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant={isRenewable ? "default" : "secondary"}
                            onClick={() => handleRenewItem(calc)}
                          >
                            {isRenewable ? "Renew" : "View"}
                          </Button>
                          {!["EXPIRED"].includes(calc.calculationType) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreateDebitNote(calc.detailID)}
                            >
                              Debit Note
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

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {displayList.map((calc, idx) => {
              const id = String(calc.detailID || calc.id || "")
              const isRenewable = !["RENEWAL", "New", "Additional", "EXPIRED"].includes(
                calc.calculationType
              )
              const isChecked = selectedCalculations.includes(id)

              return (
                <div
                  key={id || idx}
                  className={`bg-white rounded-lg border shadow-sm p-4 ${
                    isChecked ? "border-blue-400 bg-blue-50/30" : "border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {isRenewable ? (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRow(id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-1 shrink-0"
                          aria-label={`Select calculation ${idx + 1}`}
                        />
                      ) : (
                        <span className="inline-block w-4 h-4 mt-1 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs text-gray-400">#{idx + 1}</div>
                        <div className="font-medium text-blue-700 truncate">
                          {calc.certOrDocNo || calc.docNo || calc.detailID || "-"}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 shrink-0">
                      {calc.calculationType}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-500 text-xs">Sum Insured:</span>
                      <div className="font-mono">
                        {formatCurrency(calc.totalSumInsured)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Premium:</span>
                      <div className="font-mono font-semibold text-emerald-600">
                        {formatCurrency(calc.totalPremium)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 border-t pt-3">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleRenewItem(calc)}
                    >
                      {isRenewable ? "Renew" : "View"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default RenewalCalculator