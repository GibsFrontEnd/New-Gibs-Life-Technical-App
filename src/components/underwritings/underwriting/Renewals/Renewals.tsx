//@ts-nocheck
//@ts-nocheck
// @ts-nocheck

import { Filter, Search, RefreshCcw, CornerDownRight, FileEdit, Eye, Loader2, CheckCircle } from "lucide-react"

import { useEffect, useState } from "react"

import { useDispatch, useSelector } from "react-redux"

import { useNavigate, useParams } from "react-router-dom"

import type { RootState, AppDispatch } from "../../../../features/store"

import {
  fetchPolicies,
  setSearchTerm,
  setActiveTab,
  setSelectedRiskFilter,
  deletePolicy,
} from "../../../../features/reducers/underwriteReducers/underwritingSlice"

import { getAllRisks } from "../../../../features/reducers/adminReducers/riskSlice"

import { Button } from "../../../ui/new-button"

import { Input as NewInput } from "../../../ui/new-input"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Input from "../../../ui/Input"

import "./Renewals.css"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../ui/collapsible"

import { Checkbox } from "../../../ui/checkbox"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/new-select"
import { toast } from "../../../ui/use-toast"
import { formatMoney, policyCurrency } from "../../../../utils/currency"

// --- INTERNAL COMPONENT: RenewalList (Mirrors Underwriting.tsx) ---
type RenewalListProps = {
  businessId: string | null
}

const groupPolicies = (list: any[]) => {
  if (!list) return []

  // Simply return the policies without building copolicy chains
  return list.map(policy => ({
    ...policy,
    _isOutdated: false,
    _isChild: false,
    _depth: 0
  }))
}

const RenewalList = ({ businessId }: RenewalListProps) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { policies, loading, error, searchTerm, activeTab, selectedRiskFilter, pagination } = useSelector(
    (state: RootState) => state.underwritings,
  )

  const { risks } = useSelector((state: RootState) => state.risks)

  const [showRiskDropdown, setShowRiskDropdown] = useState(false)
  // FIXED: Changed from true to false so filter panel starts closed (like Underwriting)
  const [searchFilter, setSearchFilter] = useState(false)

  const [filterCriteria, setFilterCriteria] = useState({
    searchField: "fullName",
    searchValue: "",
    startDate: "",
    endDate: "",
    status: "all",
    coverCode: "",
  })

  const [filteredPolicies, setFilteredPolicies] = useState<any>(null)

  // Bulk selection states (like Underwriting)
  const [selectedPolicies, setSelectedPolicies] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isBulkAction, setIsBulkAction] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)

  const clearFilters = () => {
    setFilterCriteria({
      searchField: "fullName",
      searchValue: "",
      startDate: "",
      endDate: "",
      status: "all",
      coverCode: "",
    })
    setFilteredPolicies(null)
  }

  // Filter by this tab's risk (the URL), not the shared selectedRiskFilter: another page may
  // have left it on e.g. Motor, and that stale fetch could land after this one.
  // Load Policies with current risk filter
  useEffect(() => {
    // Ensure we are fetching with the correct page and risk
    dispatch(
      fetchPolicies({
        page: pagination.page,
        pageSize: pagination.pageSize,
        riskClass: businessId || "",
      }) as any,
    )
  }, [dispatch, pagination.page, pagination.pageSize, businessId])

  const handleSearch = (value: string) => {
    dispatch(setSearchTerm(value))
  }

  // Sync businessId param to selectedRiskFilter
  useEffect(() => {
    dispatch(setSelectedRiskFilter(businessId))
  }, [businessId, dispatch]) // Needs to update when businessId changes (tab switch)

  const handleRiskFilter = (riskID: string | null) => {
    dispatch(setSelectedRiskFilter(riskID))
    setShowRiskDropdown(false)
    dispatch(
      fetchPolicies({
        page: 1,
        pageSize: pagination.pageSize,
        riskClass: riskID || "",
      }) as any,
    )
  }

  const handleRenewPolicy = (policyNo: string) => {
    navigate(`/underwriting/renewals/process/${encodeURIComponent(policyNo)}`)
  }

  const handlePageChange = (newPage: number) => {
    dispatch(
      fetchPolicies({
        page: newPage,
        pageSize: pagination.pageSize,
        riskClass: businessId || "",
      }) as any,
    )
  }

  // Bulk selection handlers (like Underwriting)
  const handleSelectPolicy = (policyNo: string, checked: boolean) => {
    setSelectedPolicies(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(policyNo)
      } else {
        newSet.delete(policyNo)
      }
      return newSet
    })
    setShowBulkActions(true)
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      const currentPolicies = filteredPolicies?.items || filteredPoliciesList
      const allIds = currentPolicies
        .filter((p: any) => !p._isOutdated)
        .map((p: any) => p.proposalNo)
      setSelectedPolicies(new Set(allIds))
    } else {
      setSelectedPolicies(new Set())
    }
    setShowBulkActions(checked)
  }

  const handleBulkDelete = async () => {
    if (selectedPolicies.size === 0) return
    
    if (!window.confirm(`Are you sure you want to delete ${selectedPolicies.size} policy(ies)?`)) return
    
    setIsBulkAction(true)
    try {
      const failed: string[] = []
      for (const policyNo of selectedPolicies) {
        const result = await dispatch(deletePolicy(policyNo) as any)
        if (result?.error) failed.push(`${policyNo}: ${result.payload || "could not be deleted"}`)
      }
      const deletedCount = selectedPolicies.size - failed.length
      if (deletedCount > 0) toast({ title: "Deleted", description: `${deletedCount} policy(ies) deleted.`, variant: "success" })
      if (failed.length > 0) toast({ title: "Delete failed", description: failed.join("; "), variant: "destructive" })
      setSelectedPolicies(new Set())
      setSelectAll(false)
      setShowBulkActions(false)
      dispatch(
        fetchPolicies({
          page: pagination.page,
          pageSize: pagination.pageSize,
          riskClass: businessId || "",
        }) as any,
      )
    } catch (error) {
      console.error("Bulk delete failed:", error)
    } finally {
      setIsBulkAction(false)
    }
  }

  const handleBulkRenew = async () => {
    if (selectedPolicies.size === 0) return
    
    setIsBulkAction(true)
    try {
      // Navigate to renewal for all selected policies
      // This could open multiple tabs or a bulk renewal page
      const policyNos = Array.from(selectedPolicies)
      // For now, navigate to the first one and show a message
      if (policyNos.length > 0) {
        navigate(`/underwriting/renewals/process/${encodeURIComponent(policyNos[0])}`)
        toast({
          title: "Bulk Renewal",
          description: `${policyNos.length} policy(ies) selected for renewal. Processing the first one.`,
          variant: "info",
        })
      }
      setSelectedPolicies(new Set())
      setSelectAll(false)
      setShowBulkActions(false)
    } catch (error) {
      console.error("Bulk renew failed:", error)
    } finally {
      setIsBulkAction(false)
    }
  }

  const filteredPoliciesList = policies.filter((policy) => {
    const safeLower = (val?: string) => val?.toLowerCase() ?? ""

    const matchesSearch =
      safeLower(policy.proposalNo || "").includes(searchTerm.toLowerCase()) ||
      safeLower(policy.insSurname || "").includes(searchTerm.toLowerCase())

    return matchesSearch;
  })

  const applyFilters = () => {
    const tabFilteredPolicies = filteredPoliciesList
    if (!tabFilteredPolicies || tabFilteredPolicies.length === 0) {
      setFilteredPolicies({
        items: [],
        totalCount: 0,
      })
      return
    }

    let filtered = [...tabFilteredPolicies]

    if (filterCriteria.searchValue.trim()) {
      filtered = filtered.filter((policy) => {
        const searchValue = filterCriteria.searchValue.toLowerCase()
        switch (filterCriteria.searchField) {
          case "fullName":
            const fullName = `${policy.insSurname || ""} ${policy.insFirstname || ""}`.toLowerCase()
            return fullName.includes(searchValue)
          case "quoteNo":
            return policy.insOthernames?.toLowerCase().includes(searchValue)
          case "policyNo":
            return policy.proposalNo?.toLowerCase().includes(searchValue)
          case "coverCode":
            return policy.insMobilePhone?.toLowerCase().includes(searchValue)
          default:
            return true
        }
      })
    }

    if (filterCriteria.startDate) {
      filtered = filtered.filter((policy) => {
        const policyDate = new Date(policy.startDate)
        const startDate = new Date(filterCriteria.startDate)
        return policyDate >= startDate
      })
    }

    if (filterCriteria.endDate) {
      filtered = filtered.filter((policy) => {
        const policyDate = new Date(policy.startDate)
        const endDate = new Date(filterCriteria.endDate)
        return policyDate <= endDate
      })
    }

    if (filterCriteria.status !== "all") {
      filtered = filtered.filter((policy) => policy.transSTATUS?.toLowerCase() === filterCriteria.status.toLowerCase())
    }

    if (filterCriteria.coverCode.trim()) {
      filtered = filtered.filter((policy) =>
        policy.companyID?.toLowerCase().includes(filterCriteria.coverCode.toLowerCase()),
      )
    }

    setFilteredPolicies({
      items: filtered,
      totalCount: filtered.length,
    })
  }

  useEffect(() => {
    setFilteredPolicies(null)
    // Reset selection when filters/tabs change
    setSelectedPolicies(new Set())
    setSelectAll(false)
    setShowBulkActions(false)
  }, [activeTab, searchTerm, selectedRiskFilter, policies])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: "Draft", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      CALCULATED: { label: "Calculated", className: "bg-blue-100 text-blue-800 border-blue-200" },
      CONVERTED: { label: "Converted", className: "bg-green-100 text-green-800 border-green-200" },
      APPROVED: { label: "Approved", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
      REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-200" },
      PENDING_APPROVAL: { label: "Pending Approval", className: "bg-purple-100 text-purple-800 border-purple-200" },
    }

    const statusInfo = statusMap[status] || { label: status || "Unknown", className: "bg-gray-100 text-gray-800 border-gray-200" }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  if (loading.fetchPolicies) {
    return <div className="renewals-loading">Loading policies...</div>
  }

  if (error.fetchPolicies) {
    return <div className="renewals-error">Error: {error.fetchPolicies}</div>
  }

  return (
    <div className="renewals-container">
      <div className="renewals-header">
        <h1>Policy Renewals</h1>
        {/* Removed Create Policy Button */}
      </div>

      <div className="renewals-controls">
        <Collapsible open={searchFilter} onOpenChange={setSearchFilter}>
          <div className="border-b border-gray-200">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-2 text-gray-700">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">Filter & Search</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 mr-2">{searchFilter ? "Hide Filters" : "Show Filters"}</span>
                  <Checkbox checked={searchFilter} />
                </div>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="px-6 pb-6 pt-4 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Search by</label>
                    <Select
                      value={filterCriteria.searchField}
                      onValueChange={(value) =>
                        setFilterCriteria((prev) => ({
                          ...prev,
                          searchField: value,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fullName">Client Name</SelectItem>
                        <SelectItem value="policyNo">Proposal/Policy No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="lg:col-span-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Search text</label>
                    <NewInput
                      value={filterCriteria.searchValue}
                      onChange={(e) =>
                        setFilterCriteria((prev) => ({
                          ...prev,
                          searchValue: e.target.value,
                        }))
                      }
                      placeholder="Enter search term..."
                      className="w-full"
                    />
                  </div>

                  <div className="lg:col-span-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Status</label>
                    <Select
                      value={filterCriteria.status}
                      onValueChange={(value) =>
                        setFilterCriteria((prev) => ({
                          ...prev,
                          status: value,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All ({policies.length})</SelectItem>
                        <SelectItem value="PENDING">Drafts ({policies.filter((p) => p.transSTATUS === "PENDING").length})</SelectItem>
                        <SelectItem value="CALCULATED">Calculated ({policies.filter((p) => p.transSTATUS === "CALCULATED").length})</SelectItem>
                        <SelectItem value="CONVERTED">Converted ({policies.filter((p) => p.transSTATUS === "CONVERTED").length})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="lg:col-span-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Start Date</label>
                    <NewInput
                      type="date"
                      value={filterCriteria.startDate}
                      onChange={(e) =>
                        setFilterCriteria((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className="w-full"
                    />
                  </div>

                  <div className="lg:col-span-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">End Date</label>
                    <NewInput
                      type="date"
                      value={filterCriteria.endDate}
                      onChange={(e) =>
                        setFilterCriteria((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6 border-t border-gray-100 pt-4 justify-end">
                  <Button variant="outline" className="text-gray-600 border-gray-300 hover:bg-gray-50" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" onClick={applyFilters}>
                    <Search className="w-4 h-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      <div className="renewals-table-container relative">
        {loading.fetchPolicies && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-sm font-medium text-gray-600">Loading renewals...</p>
            </div>
          </div>
        )}
        {(filteredPolicies?.items || filteredPoliciesList).length === 0 ? (
          <div className="renewals-no-policies">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Filter className="h-8 w-8 text-gray-400" />
            </div>
            <p className="font-medium text-gray-900">No policies found</p>
            <p className="text-sm text-gray-500 mb-6">Adjust your search/filters or select a different risk.</p>
          </div>
        ) : (
          <>
            {/* Bulk Actions Bar - Like Underwriting */}
            {showBulkActions && selectedPolicies.size > 0 && (
              <div className="mt-4 mb-4 flex items-center justify-between gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-200 animate-in slide-in-from-top duration-200">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-700">{selectedPolicies.size}</span>
                  <span className="text-gray-500">policy(ies) selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleBulkRenew}
                    variant="default"
                    size="sm"
                    disabled={isBulkAction}
                    className="text-xs px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isBulkAction ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Renew Selected
                  </Button>
                  
                  <Button
                    onClick={handleBulkDelete}
                    variant="default"
                    size="sm"
                    disabled={isBulkAction}
                    className="text-xs px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isBulkAction ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Delete Selected
                  </Button>

                 
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr>
                    {/* Checkbox column - Like Underwriting */}
                    <th className="w-[5%]">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="w-[15%] text-left">Policy No</th>
                    <th className="w-[20%] text-left hidden sm:table-cell">Client Name</th>
                    <th className="w-[15%] text-left hidden md:table-cell">Sub Class</th>
                    <th className="w-[12%] text-left hidden lg:table-cell">End Date</th>
                    <th className="w-[15%] text-right">Premium</th>
                    <th className="w-[10%] text-center hidden sm:table-cell">Status</th>
                    <th className="w-[18%] text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupPolicies(filteredPolicies?.items || filteredPoliciesList).map((policy: any) => (
                    <tr key={policy.proposalNo} className={policy._isOutdated ? "bg-gray-50/50" : ""}>
                      {/* Checkbox cell - Like Underwriting */}
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedPolicies.has(policy.proposalNo)}
                          onChange={(e) => handleSelectPolicy(policy.proposalNo, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          disabled={policy._isOutdated}
                        />
                      </td>
                      <td className="font-medium text-indigo-900 text-xs truncate">
                        <div className="flex items-center min-w-0">
                          {policy._isChild && (
                            <CornerDownRight className="w-4 h-4 text-gray-400 mr-1 ml-1 flex-shrink-0" />
                          )}
                          <span className={`truncate ${policy._isOutdated ? "text-gray-500 line-through" : ""}`}>
                            {policy.proposalNo}
                          </span>
                        </div>
                      </td>
                      <td className="truncate hidden sm:table-cell" title={`${policy.insSurname} ${policy.insFirstname}`}>
                        <span className={policy._isOutdated ? "text-gray-500" : ""}>
                          {policy.insSurname} {policy.insFirstname}
                        </span>
                      </td>
                      <td className="truncate hidden md:table-cell" title={policy.subRisk}>
                        {policy.subRisk || "—"}
                      </td>
                      <td className="text-xs text-gray-500 truncate hidden lg:table-cell">
                        {formatDate(policy.endDate)}
                      </td>
                      <td className="text-right font-semibold text-gray-900 text-xs truncate">
                        {policy.grossPremium
                          ? formatMoney(policy.grossPremium, policyCurrency(policy))
                          : "N/A"}
                      </td>
                      <td className="text-center hidden sm:table-cell">
                        {getStatusBadge(policy.transSTATUS)}
                      </td>
                      <td>
                        {!policy._isOutdated ? (
                          <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                             <Button
                            onClick={() => handleRenewPolicy(policy.proposalNo)}
                            variant="default"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 px-2 py-1 h-7"
                          >
                            <RefreshCcw className="w-3 h-3" />
                            <span className=" xs:inline ml-1 text-xs">Renew</span>
                          </Button>
                          {/* <Button
                            onClick={() => navigate(`/underwriting/renewals/calculate/${encodeURIComponent(policy.proposalNo)}`)}
                            variant="outline"
                            size="sm"
                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 px-2 py-1 h-7"
                            title="Edit Renewal Calculation"
                          >
                            <FileEdit className="w-3 h-3" />
                            <span className="hidden xs:inline ml-1 text-xs">Edit</span>
                          </Button> */}
                         
                        </div>
                        ) : (
                          <div className="flex justify-center">
                            <Button
                              onClick={() => navigate(`/underwriting/renewals/calculate/${policy.proposalNo}`)}
                              variant="outline"
                              size="sm"
                              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2"
                              title="View Outdated Renewal"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline ml-1">View</span>
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="renewals-pagination">
        <span className="renewals-pagination-info">
          {filteredPolicies ? (
            <>Showing <span className="font-semibold">{filteredPolicies.totalCount}</span> filtered results</>
          ) : (
            <>
              Page <span className="font-semibold">{pagination.page}</span> of <span className="font-semibold">{pagination.totalPages}</span> (<span className="font-semibold">{pagination.totalCount}</span> total)
            </>
          )}
        </span>

        <div className="flex gap-2">
          {/* @ts-ignore */}
          <Button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPrevious}
            size="sm"
            variant="outline"
            className="text-gray-700 border-gray-300"
          >
            Previous
          </Button>

          {/* @ts-ignore */}
          <Button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNext}
            size="sm"
            variant="outline"
            className="text-gray-700 border-gray-300"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}


// --- MAIN PAGE COMPONENT WITH TABS (Mirrors UnderwritingsPage.tsx) ---
const Renewals = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { risks } = useSelector((state: RootState) => state.risks)
  const { businessId: businessIdParam } = useParams<{ businessId?: string }>()
  const businessId = businessIdParam ?? null;

  useEffect(() => {
    dispatch(getAllRisks({ pageNumber: 1, pageSize: 100 }) as any)
  }, [dispatch])

  // get a single tab object based on businessId (or "All" if none / not found)
  const tabs = (() => {
    if (!businessId) {
      return { title: "All", content: <RenewalList businessId={null} /> };
    }

    const risk = risks.find(r => String(r.riskID) === String(businessId));
    if (risk) {
      return { title: risk.riskName, content: <RenewalList businessId={risk.riskID} /> };
    }

    if (businessId == "Package") {
      return { title: "Package", content: <RenewalList businessId={"Package"} /> };
    }

    // fallback if param doesn't match any risk
    return { title: "All", content: <RenewalList businessId={null} /> };
  })();

  const [activeTab, setActiveTab] = useState<string | undefined>(undefined)

  // ✅ Whenever risks change, update the default active tab
  useEffect(() => {
    if (tabs) {
      setActiveTab(tabs.title)
    }
  }, [tabs, activeTab])

  return (
    <div className="max-w-[1200px] mx-auto mb-10">
     
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex flex-wrap">
          <TabsTrigger
            key={tabs.title}
            value={tabs.title}
            className="flex-1 min-w-[100px] hover:bg-neutral-200"
          >
            {tabs.title}
          </TabsTrigger>
        </TabsList>

        <TabsContent key={tabs.title} value={tabs.title}>
          {tabs.content}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Renewals;