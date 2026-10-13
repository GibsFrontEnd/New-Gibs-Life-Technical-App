//@ts-nocheck
import { Filter, Search, Plus, Eye, Edit, Trash2, CheckCircle, X, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import type { RootState } from "../../../features/store"
import {
  fetchProposals,
  setSearchTerm,
  setActiveTab,
  setSelectedRiskFilter,
  deleteProposal,
  fetchProposalReport,
} from "../../../features/reducers/quoteReducers/quotationSlice"
import { getAllRisks } from "../../../features/reducers/adminReducers/riskSlice"
import { Button } from "../../ui/new-button"
import { Input as NewInput } from "../../ui/new-input"
import "./Quotations.css"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../ui/collapsible"
import { Checkbox } from "../../ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/new-select"
import { Checkbox as UICheckbox } from "../../ui/checkbox"

type QuotationsProps = {
  businessId: string | null
}

const Quotations = ({ businessId }: QuotationsProps) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { proposals, loading, error, searchTerm, activeTab, selectedRiskFilter, pagination } = useSelector(
    (state: RootState) => state.quotations,
  )

  const { risks } = useSelector((state: RootState) => state.risks)

  const [showRiskDropdown, setShowRiskDropdown] = useState(false)
  const [searchFilter, setSearchFilter] = useState(true)
  const [selectedQuotations, setSelectedQuotations] = useState<Set<string>>(new Set())

  const [filterCriteria, setFilterCriteria] = useState({
    searchField: "fullName",
    searchValue: "",
    startDate: "",
    endDate: "",
    status: "all",
    coverCode: "",
  })

  const [filteredQuotations, setFilteredQuotations] = useState<any>(null)

  const clearFilters = () => {
    setFilterCriteria({
      searchField: "fullName",
      searchValue: "",
      startDate: "",
      endDate: "",
      status: "all",
      coverCode: "",
    })
    setFilteredQuotations(null)
  }

  useEffect(() => {
    dispatch(getAllRisks({ pageNumber: 1, pageSize: 100 }) as any)
  }, [dispatch])

  useEffect(() => {
    dispatch(
      fetchProposals({
        page: pagination.page,
        pageSize: pagination.pageSize,
        riskClass: "",
      }) as any,
    )
  }, [dispatch, pagination.page, pagination.pageSize, selectedRiskFilter])

  const handleSearch = (value: string) => {
    dispatch(setSearchTerm(value))
  }

  const handleTabChange = (tab: "overview" | "drafts" | "calculated" | "converted") => {
    dispatch(setActiveTab(tab))
  }

  useEffect(() => {
    dispatch(setSelectedRiskFilter(businessId))
  }, [])

  const handleRiskFilter = (riskID: string | null) => {
    dispatch(setSelectedRiskFilter(riskID))
    setShowRiskDropdown(false)
  }

  const handleCreateProposal = () => {
    if(businessId)
      navigate(`/quotations/create/${businessId}`)
    else
      navigate("/quotations/create")
  }

  const handleEditProposal = (proposalNo: string) => {
    navigate(`/quotations/edit/${proposalNo}`)
  }

  const handleDeleteProposal = (proposalNo: string) => {
    if (window.confirm("Are you sure you want to delete this proposal?")) {
      dispatch(deleteProposal(proposalNo) as any)
    }
  }

  const handlePageChange = (newPage: number) => {
    dispatch(
      fetchProposals({
        page: newPage,
        pageSize: pagination.pageSize,
        riskClass: selectedRiskFilter || "",
      }) as any,
    )
  }

  // Selection handlers
  const handleSelectQuotation = (proposalNo: string, checked: boolean) => {
    setSelectedQuotations(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(proposalNo)
      } else {
        newSet.delete(proposalNo)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = (filteredQuotations?.items || filteredProposals).map(p => p.proposalNo)
      setSelectedQuotations(new Set(allIds))
    } else {
      setSelectedQuotations(new Set())
    }
  }

  // Handle convert to policy - navigate to edit page for each selected quotation
  const handleConvertToPolicy = () => {
    if (selectedQuotations.size === 1) {
      // If single quotation, navigate directly to its edit page
      const proposalNo = Array.from(selectedQuotations)[0]
      navigate(`/quotations/edit/${proposalNo}`)
    } else if (selectedQuotations.size > 1) {
      // If multiple, navigate to the first one and show message
      const firstProposal = Array.from(selectedQuotations)[0]
      alert(`Selected ${selectedQuotations.size} quotations. Please convert them individually.\n\nYou will be redirected to the first one.`)
      navigate(`/quotations/edit/${firstProposal}`)
    }
    setSelectedQuotations(new Set())
  }

  const filteredProposals = proposals.filter((proposal) => {
    const safeLower = (val?: string) => val?.toLowerCase() ?? ""

    const matchesSearch =
      safeLower(proposal.proposalNo || "").includes(searchTerm.toLowerCase()) ||
      safeLower(proposal.insSurname || "").includes(searchTerm.toLowerCase())

    if (selectedRiskFilter != null) {
      switch (activeTab) {
        case "drafts":
          return matchesSearch && selectedRiskFilter == proposal.riskID && proposal.transSTATUS === "PENDING"
        case "calculated":
          return matchesSearch && selectedRiskFilter == proposal.riskID && proposal.transSTATUS === "CALCULATED"
        case "converted":
          return matchesSearch && selectedRiskFilter == proposal.riskID && proposal.transSTATUS === "CONVERTED"
        default:
          return matchesSearch && selectedRiskFilter == proposal.riskID
      }
    } else {
      switch (activeTab) {
        case "drafts":
          return matchesSearch && proposal.transSTATUS === "PENDING"
        case "calculated":
          return matchesSearch && proposal.transSTATUS === "CALCULATED"
        case "converted":
          return matchesSearch && proposal.transSTATUS === "CONVERTED"
        default:
          return matchesSearch
      }
    }
  })

  const applyFilters = () => {
    const tabFilteredQuotations = filteredProposals
    if (!tabFilteredQuotations || tabFilteredQuotations.length === 0) {
      setFilteredQuotations({
        items: [],
        totalCount: 0,
      })
      return
    }

    let filtered = [...tabFilteredQuotations]

    if (filterCriteria.searchValue.trim()) {
      filtered = filtered.filter((quote) => {
        const searchValue = filterCriteria.searchValue.toLowerCase()
        switch (filterCriteria.searchField) {
          case "fullName":
            const fullName = `${quote.insSurname || ""} ${quote.insFirstname || ""}`.toLowerCase()
            return fullName.includes(searchValue)
          case "quoteNo":
            return quote.insOthernames?.toLowerCase().includes(searchValue)
          case "proposalNo":
            return quote.proposalNo?.toLowerCase().includes(searchValue)
          case "coverCode":
            return quote.insMobilePhone?.toLowerCase().includes(searchValue)
          default:
            return true
        }
      })
    }

    if (filterCriteria.startDate) {
      filtered = filtered.filter((quote) => {
        const quoteDate = new Date(quote.startDate)
        const startDate = new Date(filterCriteria.startDate)
        return quoteDate >= startDate
      })
    }

    if (filterCriteria.endDate) {
      filtered = filtered.filter((quote) => {
        const quoteDate = new Date(quote.startDate)
        const endDate = new Date(filterCriteria.endDate)
        return quoteDate <= endDate
      })
    }

    if (filterCriteria.status !== "all") {
      filtered = filtered.filter((quote) => quote.transSTATUS?.toLowerCase() === filterCriteria.status.toLowerCase())
    }

    if (filterCriteria.coverCode.trim()) {
      filtered = filtered.filter((quote) =>
        quote.companyID?.toLowerCase().includes(filterCriteria.coverCode.toLowerCase()),
      )
    }

    setFilteredQuotations({
      items: filtered,
      totalCount: filtered.length,
    })
  }

  useEffect(() => {
    setFilteredQuotations(null)
  }, [activeTab, searchTerm, selectedRiskFilter, proposals])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: "Draft", class: "bg-amber-100 text-amber-700 border-amber-200" },
      CALCULATED: { label: "Calculated", class: "bg-blue-100 text-blue-700 border-blue-200" },
      CONVERTED: { label: "Converted", class: "bg-green-100 text-green-700 border-green-200" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, class: "bg-gray-100 text-gray-700 border-gray-200" }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.class}`}>
        {config.label}
      </span>
    )
  }

  if (loading.fetchProposals) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quotations...</p>
        </div>
      </div>
    )
  }

  if (error.fetchProposals) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">Error: {error.fetchProposals}</p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quotations Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and convert quotations to policy</p>
          </div>
          <div className="flex gap-3">
            {selectedQuotations.size > 0 && (
              <Button 
                onClick={handleConvertToPolicy}
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all duration-200"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Convert to Policy ({selectedQuotations.size})
              </Button>
            )}
            <Button 
              onClick={handleCreateProposal} 
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Quotation
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-6">
        <Collapsible open={searchFilter} onOpenChange={setSearchFilter}>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Advanced Filters</span>
                </div>
                <Checkbox checked={searchFilter} className="cursor-pointer" />
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Search by</label>
                    <Select
                      value={filterCriteria.searchField}
                      onValueChange={(value) =>
                        setFilterCriteria((prev) => ({
                          ...prev,
                          searchField: value,
                        }))
                      }
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fullName">Client Name</SelectItem>
                        <SelectItem value="proposalNo">Proposal Number</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Search text</label>
                    <NewInput
                      value={filterCriteria.searchValue}
                      onChange={(e) =>
                        setFilterCriteria((prev) => ({
                          ...prev,
                          searchValue: e.target.value,
                        }))
                      }
                      placeholder="Enter search text"
                      className="bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
                    <Select
                      value={filterCriteria.status}
                      onValueChange={(value) =>
                        setFilterCriteria((prev) => ({
                          ...prev,
                          status: value,
                        }))
                      }
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All ({proposals.filter((p) => (selectedRiskFilter != null ? selectedRiskFilter == p.riskID : p)).length})</SelectItem>
                        <SelectItem value="PENDING">Drafts ({proposals.filter((p) => selectedRiskFilter != null ? p.transSTATUS === "PENDING" && selectedRiskFilter == p.riskID : p.transSTATUS === "PENDING").length})</SelectItem>
                        <SelectItem value="CALCULATED">Calculated ({proposals.filter((p) => selectedRiskFilter != null ? p.transSTATUS === "CALCULATED" && selectedRiskFilter == p.riskID : p.transSTATUS === "CALCULATED").length})</SelectItem>
                        <SelectItem value="CONVERTED">Converted ({proposals.filter((p) => selectedRiskFilter != null ? p.transSTATUS === "CONVERTED" && selectedRiskFilter == p.riskID : p.transSTATUS === "CONVERTED").length})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Start Date</label>
                    <NewInput
                      type="date"
                      value={filterCriteria.startDate}
                      onChange={(e) =>
                        setFilterCriteria((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className="bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">End Date</label>
                    <NewInput
                      type="date"
                      value={filterCriteria.endDate}
                      onChange={(e) =>
                        setFilterCriteria((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={applyFilters}>
                    <Search className="w-4 h-4 mr-2" />
                    Apply Filters
                  </Button>
                  <Button variant="outline" className="border-gray-300 hover:bg-gray-50" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {(filteredQuotations?.items || filteredProposals).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-500 mb-4">No quotations found</p>
            <Button onClick={handleCreateProposal} variant="outline">
              Create Your First Quotation
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left w-12">
                    <UICheckbox
                      checked={selectedQuotations.size === (filteredQuotations?.items || filteredProposals).length}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Proposal No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Business</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subclass</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Start Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">End Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Premium</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(filteredQuotations?.items || filteredProposals).map((proposal: any) => (
                  <tr 
                    key={proposal.proposalNo} 
                    onClick={() => handleEditProposal(proposal.proposalNo)}
                    className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <UICheckbox
                        checked={selectedQuotations.has(proposal.proposalNo)}
                        onCheckedChange={(checked) => handleSelectQuotation(proposal.proposalNo, checked as boolean)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">{proposal.proposalNo}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {proposal.insSurname} {proposal.insFirstname}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(proposal.transSTATUS)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {risks.find((r) => r.riskID == proposal.riskID)?.riskName || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{proposal.subRisk || "-"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{formatDate(proposal.startDate)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{formatDate(proposal.endDate)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {proposal.grossPremium
                          ? new Intl.NumberFormat("en-NG", {
                              style: "currency",
                              currency: "NGN",
                            }).format(proposal.grossPremium)
                          : "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          onClick={() => handleEditProposal(proposal.proposalNo)}
                          variant="outline"
                          size="sm"
                          className="border-gray-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                          title="View/Edit"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteProposal(proposal.proposalNo)}
                          variant="outline"
                          size="sm"
                          className="border-gray-300 bg-red-50 hover:bg-red-100 hover:border-red-300 text-red-600 hover:text-red-700 transition-all duration-200"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {filteredQuotations ? (
            <>Showing {filteredQuotations.totalCount} filtered results</>
          ) : (
            <>Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)</>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPrevious}
            variant="outline"
            size="sm"
            className="border-gray-300 hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <Button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNext}
            variant="outline"
            size="sm"
            className="border-gray-300 hover:bg-gray-50"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Quotations