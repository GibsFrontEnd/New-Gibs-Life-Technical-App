//@ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"
import type { AppDispatch, RootState } from "../../../../features/store"
import {
  getPolicyByNumber,
  getRenewableSections,
  renewPolicySections,
} from "../../../../features/reducers/underwriteReducers/underwritingSlice"
import { Button } from "../../../ui/new-button"
import Input from "../../../ui/Input"
import { Label } from "../../../ui/label"
import { toast } from "sonner"
import "../PolicyCalculator.css"
import { Loader2, Eye } from "lucide-react"
import { formatMoney, policyCurrency } from "../../../../utils/currency"


const GENERIC_RISK_CLASS = "fire"

export const GeneralRenewalCalculator = () => {
  const { policyNo, detailID } = useParams<{ policyNo: string; detailID: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  // This app's useAuth() only checks the token and returns nothing; the logged-in user lives in the auth slice
  const user = useSelector((state: RootState) => (state as any).auth?.user)

  const { currentPolicy: rawCurrentPolicy } = useSelector(
    (state: RootState) => state.underwritings
  )

  const safePolicyNo = policyNo ? decodeURIComponent(policyNo).trim() : ""
  const currentPolicy =
    rawCurrentPolicy ||
    (safePolicyNo ? ({ policyNo: safePolicyNo, proposalNo: safePolicyNo } as any) : null)

  const [isLoading, setIsLoading] = useState(true)
  const [isRenewing, setIsRenewing] = useState(false)
  const [sectionList, setSectionList] = useState<any[]>([])
  const [selectedTokens, setSelectedTokens] = useState<string[]>([])
  const [remarks, setRemarks] = useState("")
  const [adjCollapse, setAdjCollapse] = useState(false)

  // 1. Fetch policy if not in store
  useEffect(() => {
    if (safePolicyNo && !rawCurrentPolicy) {
      dispatch(getPolicyByNumber(safePolicyNo) as any)
    }
  }, [dispatch, safePolicyNo, rawCurrentPolicy])

  // 2. Fetch renewable sections ONLY
  useEffect(() => {
    if (!safePolicyNo || !detailID) return

    setIsLoading(true)

    // detailID comes from this policy's own calculation list (RenewalCalculator loads it for
    // safePolicyNo) and the Renew POST uses safePolicyNo too — so read sections from the same
    // policy. Using coPolicyNo looked DetailID up on the previous policy and returned nothing.
    dispatch(
      getRenewableSections({
        policyNo: safePolicyNo,
        riskClass: GENERIC_RISK_CLASS,
        detailID,
      }) as any
    )
      .unwrap()
      .then((sections: any[]) => {
        const list = Array.isArray(sections) ? sections : []
        setSectionList(list)
        // No auto-select — user picks manually
      })
      .catch((err: any) => {
        console.error("Failed to load renewable sections:", err)
        toast.error(err?.message || "Failed to load renewable sections.")
      })
      .finally(() => setIsLoading(false))
  }, [dispatch, safePolicyNo, detailID])

  // ===== Selection =====
  const totalSections = sectionList.length
  const selectedCount = selectedTokens.length
  const allSelected = totalSections > 0 && selectedCount === totalSections

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedTokens([])
    } else {
      setSelectedTokens(sectionList.map((s) => s.selectionToken).filter(Boolean))
    }
  }

  const handleToggleToken = (token: string) => {
    if (!token) return
    setSelectedTokens((prev) =>
      prev.includes(token) ? prev.filter((t) => t !== token) : [...prev, token]
    )
  }

  const handleBackToList = () => {
    navigate(
      `/underwriting/renewals/edit/${encodeURIComponent(safePolicyNo)}/calculator`
    )
  }

  const currentUserName =
    user?.userName ||
    user?.username ||
    user?.name ||
    user?.fullName ||
    "System"

  const handleRenew = async () => {
    if (selectedTokens.length === 0) {
      toast.error("Please select at least one section to renew.")
      return
    }

    setIsRenewing(true)
    try {
      const safeRemarks = remarks.trim()
        ? remarks.trim().substring(0, 30)
        : `Renewal ${safePolicyNo}`.substring(0, 30)

        const payload = {
          policyNo: safePolicyNo,
          riskClass: GENERIC_RISK_CLASS,
          detailID: detailID!,
          selectedSectionTokens: selectedTokens,
          renewedBy: currentUserName,          
          remarks: safeRemarks,
        }

      const result = await dispatch(renewPolicySections(payload) as any).unwrap()

      toast.success(
        result?.message || `Successfully renewed ${selectedTokens.length} section(s)!`
      )

      handleBackToList()
    } catch (err: any) {
      console.error("Renewal failed:", err)
      toast.error(err?.message || "Failed to renew sections.")
    } finally {
      setIsRenewing(false)
    }
  }

  // Amounts are in the policy's currency
  const formatCurrency = (amount: number | null | undefined) => formatMoney(amount, policyCurrency(currentPolicy), "N/A")

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
    if (allSelected) return `Renew All (${totalSections})`
    return `Renew (${selectedCount})`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-gray-500 font-medium">Loading Renewal Details...</p>
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
            <h1>Policy Renewal Calculator</h1>
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
            <Label>Detail ID</Label>
            <Input value={detailID || "—"} disabled />
          </div>
        </div>
      </div>

      <div className="pc-content">
        {/* Sections Panel */}
        <div className="pc-sections-panel">
          <div className="pc-sections-header flex justify-between items-center">
            <h3>Sections ({totalSections})</h3>

            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-gray-600">
                Selected: <span className="font-bold text-blue-600">{selectedCount}</span> / {totalSections}
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

          {sectionList.length === 0 ? (
            <div className="pc-no-sections">
              <p>No section records found in this calculation breakdown.</p>
            </div>
          ) : (
            <>
              {/* ===== DESKTOP TABLE (lg+) ===== */}
              <div className="hidden lg:block pc-sections-table-wrap custom-scrollbar">
                <table className="pc-sections-table w-full" role="table" aria-label="Sections Renewal">
                  <thead>
                    <tr>
                      <th className="w-10">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={handleToggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                          aria-label="Select all sections"
                        />
                      </th>
                      <th className="w-10">#</th>
                      <th className="min-w-[200px] font-semibold">Section Name</th>
                      <th className="min-w-[120px]">Location</th>
                      <th className="min-w-[110px] text-right">Sum Insured</th>
                      <th className="min-w-[110px] text-right">Net Premium</th>
                      <th className="min-w-[80px] text-right">Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionList.map((section, index) => {
                      const token = section.selectionToken
                      const isChecked = selectedTokens.includes(token)

                      return (
                        <tr
                          key={token || index}
                          className={`pc-section-row hover:bg-gray-50 transition-colors ${isChecked ? "bg-blue-50/50" : ""}`}
                        >
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleToken(token)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                              aria-label={`Select section ${index + 1}`}
                            />
                          </td>
                          <td className="text-center text-gray-500 text-sm">{index + 1}</td>
                          <td className="font-medium text-blue-700">
                            {section.sectionName || "Unnamed Section"}
                          </td>
                          <td>{section.location || "—"}</td>
                          <td className="text-right font-mono text-sm">
                            {formatCurrency(section.sectionSumInsured)}
                          </td>
                          <td className="text-right font-mono text-sm font-semibold text-emerald-600">
                            {formatCurrency(section.sectionNetPremium)}
                          </td>
                          <td className="text-right text-gray-500 text-sm">
                            {section.riskItemCount ?? 0}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* ===== MOBILE CARD VIEW (< lg) ===== */}
              <div className="lg:hidden space-y-3">
                {sectionList.map((section, index) => {
                  const token = section.selectionToken
                  const isChecked = selectedTokens.includes(token)

                  return (
                    <div
                      key={token || index}
                      className={`bg-white rounded-lg border p-4 shadow-sm ${isChecked ? "border-blue-400 bg-blue-50/30" : "border-gray-200"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleToken(token)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer mt-1 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-blue-700 truncate">
                              {section.sectionName || "Unnamed Section"}
                            </div>
                            <div className="text-xs text-gray-500">#{index + 1}</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                        <div>
                          <span className="text-gray-500">Location:</span>
                          <span className="ml-1">{section.location || "—"}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Items:</span>
                          <span className="ml-1">{section.riskItemCount ?? 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Sum Insured:</span>
                          <span className="ml-1 font-mono">{formatCurrency(section.sectionSumInsured)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Net Premium:</span>
                          <span className="ml-1 font-mono font-semibold text-emerald-600">
                            {formatCurrency(section.sectionNetPremium)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
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
                    placeholder="e.g., Annual Policy Renewal"
                    maxLength={30}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400">Max 30 characters</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
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
      </div>
    </div>
  )
}

export default GeneralRenewalCalculator