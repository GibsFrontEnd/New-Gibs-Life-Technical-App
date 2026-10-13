//@ts-nocheck
import { Filter, Search, CornerDownRight, Eye, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import type { RootState } from "../../../features/store"
import {
  fetchPolicies,
  setSearchTerm,
  setActiveTab,
  setSelectedRiskFilter,
  deletePolicy,
} from "../../../features/reducers/underwriteReducers/underwritingSlice"
import { getAllRisks } from "../../../features/reducers/adminReducers/riskSlice"
import { Button } from "../../ui/new-button"
import { Input as NewInput } from "../../ui/new-input"
import "./Underwriting.css"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../ui/collapsible"
import { Checkbox } from "../../ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/new-select"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from "../../ui/table"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, Printer, Trash2, Pencil, Check } from "lucide-react"
import { formatMoney, policyCurrency } from "../../../utils/currency"
import { apiErrorMessage } from "../../../utils/api-error"
import { toast } from "sonner"

type UnderwritingProps = {
  businessId: string | null
}

// Local helper functions
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A"
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return "N/A"
  }
}

// Premiums are in each policy's own currency
const formatCurrency = (amount: number, currency?: string) => formatMoney(amount, currency, "N/A")

// Helper function to get auth token
const getAuthToken = () => {
  try {
    const encryptedToken = localStorage.getItem("token")
    if (!encryptedToken) return null
    return encryptedToken
  } catch (err) {
    console.warn("Failed to get token", err)
    return null
  }
}

const API_BASE_URL = "https://lifetechnicalapi.newgibsonline.com"


// Map businessId to riskClass for API filtering
const getRiskClassFromBusinessId = (businessId: string | null): string | null => {
  if (!businessId) return null
  
  const riskMap: Record<string, string> = {
    'F': 'F',      // Fire
    'V': 'V',      // Motor
    'PP': 'PP',    // Package Bus
    'B': 'B',      // Bond
    'GL': 'GL',    // General Liability
  }
  
  return riskMap[businessId] || null
}

const Underwriting = ({ businessId }: UnderwritingProps) => {

  const underwritingsState = useSelector((state: RootState) => state.underwritings) || {};
  const risksState = useSelector((state: RootState) => state.risks) || {};

  const {
    policies = [],
    loading = { fetchPolicies: false },
    error = { fetchPolicies: null },
    searchTerm = "",
    activeTab = "overview",
    selectedRiskFilter = null,
    pagination = { page: 1, pageSize: 50, totalCount: 0, totalPages: 1, hasNext: false, hasPrevious: false }
  } = underwritingsState;

  const { risks = [] } = risksState;

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [isMobile, setIsMobile] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [allPolicies, setAllPolicies] = useState<any[]>([])
  const [isLoadingAll, setIsLoadingAll] = useState(false)
  const [selectedPolicies, setSelectedPolicies] = useState<Set<string>>(new Set())
  const [isAllSelected, setIsAllSelected] = useState(false)
  const [filterCriteria, setFilterCriteria] = useState({
    searchField: "fullName",
    searchValue: "",
    startDate: "",
    endDate: "",
    status: "all",
    coverCode: "",
  })
  const [filteredPolicies, setFilteredPolicies] = useState<any>(null)
  const pageSize = 20

  // Map businessId to route path for navigation
  const getCreateRoute = (id: string | null) => {
    if (!id) return null
    
    const routeMap: Record<string, string> = {
      'F': '/underwriting/general-bus/fire/create',
      'V': '/underwriting/general-bus/motor/create',
      'PP': '/underwriting/package-bus/create',
    }
    
    return routeMap[id] || null
  }

  const getBaseRoute = (id: string | null) => {
    if (!id) return null
    
    const routeMap: Record<string, string> = {
      'F': '/underwriting/general-bus/fire',
      'V': '/underwriting/general-bus/motor',
      'PP': '/underwriting/package-bus',
    }
    
    return routeMap[id] || null
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    dispatch(getAllRisks({ pageNumber: 1, pageSize: 100 }) as any)
  }, [dispatch])

  // 🔥 FIXED: Fetch policies with server-side filtering using businessId
useEffect(() => {
  const fetchAllPagesForRisk = async () => {
    setIsLoadingAll(true)
    setAllPolicies([])
    
    try {
      const AUTH_TOKEN = getAuthToken()
      if (!AUTH_TOKEN) {
        console.error('No auth token found')
        setIsLoadingAll(false)
        return
      }

      let allItems: any[] = []
      let page = 1
      let hasMore = true

      // Determine status filter
      let statusFilter = ''
      if (activeTab === 'drafts') {
        statusFilter = 'PENDING'
      } else if (activeTab === 'calculated') {
        statusFilter = 'CALCULATED'
      } else if (activeTab === 'converted') {
        statusFilter = 'CONVERTED'
      }

      // 🔥 Get the riskClass from businessId
      const riskClass = getRiskClassFromBusinessId(businessId)

      while (hasMore && page <= 50) {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(50),
          sortBy: "TransDate",
          sortDirection: "DESC"
        })

        // 🔥 CRITICAL: Use riskClass for server-side filtering (NOT riskID)
        if (riskClass && riskClass !== 'null' && riskClass !== '') {
          params.append('riskClass', riskClass)
        }

        if (statusFilter) {
          params.append('status', statusFilter)
        }

        const url = `${API_BASE_URL}/api/PolicyAdmin?${params.toString()}`
        console.log(`📡 Fetching page ${page} with riskClass: ${riskClass || 'all'}`)

        const response = await fetch(url, {
          method: "GET",
          headers: { 
            accept: "text/plain", 
            Authorization: `Bearer ${AUTH_TOKEN}` 
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log(`📄 Page ${page}: got ${data.items?.length || 0} items`)

        // 🔥 DEBUG: Log the first item's riskID to verify filtering
        if (data.items && data.items.length > 0) {
          console.log(`🔍 First item riskID: ${data.items[0]?.riskID}`)
        }

        if (data.items && data.items.length > 0) {
          allItems = [...allItems, ...data.items]
        }

        hasMore = data.hasNext || false
        page++
      }

      console.log(`✅ Total loaded: ${allItems.length} policies for ${businessId || 'all'}`)
      setAllPolicies(allItems)
      setCurrentPage(1)

    } catch (error) {
      console.error('Failed to fetch policies:', error)
    } finally {
      setIsLoadingAll(false)
    }
  }

  fetchAllPagesForRisk()
}, [businessId, activeTab])// 🔥 Re-fetch when businessId or activeTab changes

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      'F': 'Fire',
      'V': 'Motor',
      'PP': 'Package Bus',
      'B': 'Bond',
      'GL': 'General Liability',
    }
    return businessId ? titles[businessId] || 'Policies' : 'All'
  }

  const getPageDescription = () => {
    const desc: Record<string, string> = {
      'F': 'Manage all fire policies',
      'V': 'Manage all motor policies',
      'PP': 'Manage all package bus policies',
      'B': 'Manage all bond policies',
      'GL': 'Manage all general liability policies',
    }
    return businessId ? desc[businessId] || 'Manage all policies' : 'Manage all policies'
  }

  const handleSearch = (value: string) => {
    dispatch(setSearchTerm(value))
  }

  const handleTabChange = (tab: "overview" | "drafts" | "calculated" | "converted") => {
    dispatch(setActiveTab(tab))
    setCurrentPage(1)
    setSelectedPolicies(new Set())
    setIsAllSelected(false)
  }

  useEffect(() => {
    if (businessId) {
      dispatch(setSelectedRiskFilter(businessId))
    }
  }, [businessId, dispatch])

 // ✅ FIXED: Create Policy navigation - includes businessId in URL
  const handleCreatePolicy = () => {
    if (businessId && businessId !== 'null' && businessId !== '') {
      // Map businessId to the correct route
      const routeMap: Record<string, string> = {
        'F': '/underwriting/general-bus/fire/create',
        'V': '/underwriting/general-bus/motor/create',
        'PP': '/underwriting/package-bus/create',
        'B': '/underwriting/general-bus/bond/create',
        'GL': '/underwriting/general-bus/general-liability/create',
        'CL': '/underwriting/general-bus/credit-life/create',
        'C': '/underwriting/general-bus/riders/create',
        'A': '/underwriting/general-bus/traditional/create',
      };
      
      const baseRoute = routeMap[businessId];
      if (baseRoute) {
        // Navigate to the create page with businessId in the URL
        // This will match the route: /general-bus/fire/create/:businessId
        navigate(`${baseRoute}/${businessId}`);
        console.log(`🔗 Navigating to: ${baseRoute}/${businessId}`);
      } else {
        // Fallback for unmapped business IDs
        navigate(`/underwriting/create/${businessId}`);
        console.log(`🔗 Navigating to: /underwriting/create/${businessId}`);
      }
    } else {
      // No businessId - go to generic create
      navigate("/underwriting/create");
      console.log('🔗 Navigating to: /underwriting/create');
    }
  };

  const handleEditPolicy = (policyNo: string) => {
  navigate(`/underwriting/edit/${encodeURIComponent(policyNo)}`);
}

  /**
   * Deletes the policies and drops them from this page's own list (allPolicies is loaded
   * here, not from the store, so the store update alone leaves the rows on screen).
   */
  const deletePolicies = async (policyNos: string[]) => {
    const deleted: string[] = []
    const failed: string[] = []
    for (const policyNo of policyNos) {
      try {
        await (dispatch(deletePolicy(policyNo) as any) as any).unwrap()
        deleted.push(policyNo)
      } catch (err: any) {
        failed.push(`${policyNo}: ${apiErrorMessage(err, "could not be deleted")}`)
      }
    }
    if (deleted.length > 0) {
      const keep = (p: any) => !deleted.includes(p.proposalNo) && !deleted.includes(p.policyNo)
      setAllPolicies((prev) => prev.filter(keep))
      setFilteredPolicies((prev: any) => {
        if (!prev) return prev
        const items = prev.items.filter(keep)
        return { ...prev, items, totalCount: items.length }
      })
      toast.success(deleted.length === 1 ? `Policy ${deleted[0]} deleted` : `${deleted.length} policies deleted`)
    }
    if (failed.length > 0) toast.error(`Delete failed — ${failed.join("; ")}`)
  }

  const handleDeletePolicy = (policyNo: string) => {
    if (window.confirm(`Are you sure you want to delete policy ${policyNo}?`)) {
      deletePolicies([policyNo])
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleSelectPolicy = (policyNo: string) => {
    const newSelected = new Set(selectedPolicies)
    if (newSelected.has(policyNo)) {
      newSelected.delete(policyNo)
    } else {
      newSelected.add(policyNo)
    }
    setSelectedPolicies(newSelected)
    const displayData = getCurrentPageData()
    setIsAllSelected(newSelected.size === displayData.items.length)
  }

  const handleSelectAll = () => {
    const displayData = getCurrentPageData()
    if (isAllSelected) {
      setSelectedPolicies(new Set())
    } else {
      const allIds = new Set(displayData.items.map((p: any) => p.proposalNo))
      setSelectedPolicies(allIds)
    }
    setIsAllSelected(!isAllSelected)
  }

  const applyFilters = () => {
    let filtered = [...allPolicies]
    
    if (filterCriteria.searchValue) {
      const term = filterCriteria.searchValue.toLowerCase()
      filtered = filtered.filter(policy => 
        policy.proposalNo?.toLowerCase().includes(term) ||
        policy.insSurname?.toLowerCase().includes(term) ||
        policy.insFirstname?.toLowerCase().includes(term)
      )
    }

    if (filterCriteria.status !== 'all') {
      filtered = filtered.filter(policy => 
        policy.transSTATUS?.toLowerCase() === filterCriteria.status.toLowerCase()
      )
    }

    if (filterCriteria.startDate) {
      const startDate = new Date(filterCriteria.startDate)
      filtered = filtered.filter(policy => 
        new Date(policy.startDate) >= startDate
      )
    }

    if (filterCriteria.endDate) {
      const endDate = new Date(filterCriteria.endDate)
      filtered = filtered.filter(policy => 
        new Date(policy.startDate) <= endDate
      )
    }

    setFilteredPolicies({
      items: filtered,
      totalCount: filtered.length
    })
    setCurrentPage(1)
    setSelectedPolicies(new Set())
    setIsAllSelected(false)
  }

  const clearAllFilters = () => {
    setFilterCriteria({
      searchField: "fullName",
      searchValue: "",
      startDate: "",
      endDate: "",
      status: "all",
      coverCode: "",
    })
    setFilteredPolicies(null)
    setCurrentPage(1)
    setSelectedPolicies(new Set())
    setIsAllSelected(false)
  }

  const hasActiveFilters = filterCriteria.searchValue || filterCriteria.startDate || filterCriteria.endDate || filterCriteria.status !== "all"

  useEffect(() => {
    setFilteredPolicies(null)
  }, [activeTab, searchTerm, selectedRiskFilter, allPolicies])

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

  // Get current page data with client-side pagination
  const getCurrentPageData = () => {
    const data = filteredPolicies?.items || allPolicies
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    const paginated = data.slice(start, end)
    
    return {
      items: paginated,
      totalCount: data.length,
      totalPages: Math.max(1, Math.ceil(data.length / pageSize)),
      currentPage: currentPage,
      hasNext: end < data.length,
      hasPrevious: currentPage > 1
    }
  }

  const displayData = getCurrentPageData()

  if (isLoadingAll) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-gray-600">Loading {getPageTitle()} policies...</p>
        </div>
      </div>
    )
  }

  if (error.fetchPolicies) {
    return <div className="uw-error">Error: {error.fetchPolicies}</div>
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto">
        <div className="rounded-lg">
          {/* Header Card */}
          <Card className="bg-gradient-to-r from-gray-200 to-gray-200 border-white-200 mb-6">
            <div className="p-4 pb-0">
              <h2 className="text-xl font-bold text-gray-900">
                {getPageTitle()} Policies
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {getPageDescription()}
              </p>
            </div>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCreatePolicy}
                  className="w-full sm:w-auto text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Create New {getPageTitle()} Policy</span>
                  <span className="sm:hidden">New Policy</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filters Section */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <div className="border rounded-lg mb-6 bg-gray-50">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 cursor-pointer">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Search Filter</span>
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {[filterCriteria.searchValue, filterCriteria.startDate, filterCriteria.endDate, filterCriteria.status !== "all" ? filterCriteria.status : null].filter(Boolean).length} active
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          clearAllFilters()
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        <CornerDownRight className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    )}
                    <Checkbox checked={filtersOpen} />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-1">
                      <label className="text-sm text-gray-600 mb-1 block">Search by</label>
                      <Select
                        value={filterCriteria.searchField}
                        onValueChange={(value) =>
                          setFilterCriteria((prev) => ({
                            ...prev,
                            searchField: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fullName">Client Name</SelectItem>
                          <SelectItem value="policyNo">Proposal/Policy No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="lg:col-span-1">
                      <label className="text-sm text-gray-600 mb-1 block">Search text</label>
                      <NewInput
                        value={filterCriteria.searchValue}
                        onChange={(e) =>
                          setFilterCriteria((prev) => ({
                            ...prev,
                            searchValue: e.target.value,
                          }))
                        }
                        placeholder="Enter search text"
                      />
                    </div>

                    <div className="lg:col-span-1">
                      <label className="text-sm text-gray-600 mb-1 block">Start Date</label>
                      <NewInput
                        type="date"
                        value={filterCriteria.startDate}
                        onChange={(e) =>
                          setFilterCriteria((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="lg:col-span-1">
                      <label className="text-sm text-gray-600 mb-1 block">End Date</label>
                      <NewInput
                        type="date"
                        value={filterCriteria.endDate}
                        onChange={(e) =>
                          setFilterCriteria((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="lg:col-span-1 flex items-end">
                      <Button
                        className="w-full bg-primary hover:bg-primary-blue"
                        onClick={applyFilters}
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Apply
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Status</label>
                      <Select
                        value={filterCriteria.status}
                        onValueChange={(value) =>
                          setFilterCriteria((prev) => ({
                            ...prev,
                            status: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="PENDING">Draft</SelectItem>
                          <SelectItem value="CALCULATED">Calculated</SelectItem>
                          <SelectItem value="CONVERTED">Converted</SelectItem>
                          <SelectItem value="APPROVED">Approved</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={clearAllFilters}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Selection Actions */}
          {selectedPolicies.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-blue-700 font-medium">
                  {selectedPolicies.size} policy{selectedPolicies.size !== 1 ? "s" : ""} selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-sm"
                  onClick={() => {
                    if (window.confirm(`Delete ${selectedPolicies.size} selected policies?`)) {
                      deletePolicies(Array.from(selectedPolicies))
                      setSelectedPolicies(new Set())
                      setIsAllSelected(false)
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          )}

          {/* Data Display Area */}
          <div className="border border-border rounded-lg min-h-96 bg-white">
            {displayData.items.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm font-medium mb-2">
                  {hasActiveFilters
                    ? "No policies match your filters"
                    : `No ${getPageTitle()} policies found`}
                </p>
                <p className="text-xs">
                  {hasActiveFilters
                    ? "Try adjusting your search criteria or clear filters to see all policies."
                    : `Create a new ${getPageTitle().toLowerCase()} policy to get started.`}
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    className="mt-3 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-4">
                {isMobile ? (
                  // Mobile card view
                  <div>
                    {displayData.items.map((policy: any) => (
                      <PolicyCard
                        key={policy.proposalNo}
                        policy={policy}
                        onEdit={handleEditPolicy}
                        onDelete={handleDeletePolicy}
                        onSelect={handleSelectPolicy}
                        isSelected={selectedPolicies.has(policy.proposalNo)}
                        formatDate={formatDate}
                        getStatusBadge={getStatusBadge}
                        formatCurrency={formatCurrency}
                      />
                    ))}
                  </div>
                ) : (
                  // Desktop table view
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={isAllSelected}
                              onCheckedChange={handleSelectAll}
                              className="h-4 w-4"
                            />
                          </TableHead>
                          <TableHead>Policy No</TableHead>
                          <TableHead>Client Name</TableHead>
                          <TableHead>Sub Class</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead className="text-right">Premium</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayData.items.map((policy: any) => (
                          <TableRow
                            key={policy.proposalNo}
                            className={`${selectedPolicies.has(policy.proposalNo) ? "bg-blue-50" : ""} cursor-pointer hover:bg-blue-50/50 border-blue-100 transition-colors`}
                          >
                            <TableCell>
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedPolicies.has(policy.proposalNo)}
                                  onCheckedChange={() => handleSelectPolicy(policy.proposalNo)}
                                  className="h-4 w-4"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-indigo-900">
                                  {policy.proposalNo}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium text-gray-900">
                                  {policy.insSurname} {policy.insFirstname}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {policy.subRisk || "—"}
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {formatDate(policy.endDate)}
                            </TableCell>
                            <TableCell className="text-right font-medium text-blue-900">
                              {policy.grossPremium
                                ? formatCurrency(policy.grossPremium, policyCurrency(policy))
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(policy.transSTATUS)}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 bg-transparent border-green-300 text-green-700 hover:bg-green-50"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditPolicy(policy.proposalNo)
                                  }}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 bg-transparent border-red-300 text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeletePolicy(policy.proposalNo)
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Pagination */}
                {displayData.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
                    <div className="text-sm text-muted-foreground order-2 sm:order-1">
                      Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, displayData.totalCount)} of {displayData.totalCount} entries | Page {currentPage} of {displayData.totalPages}
                      {selectedPolicies.size > 0 && ` | ${selectedPolicies.size} selected`}
                    </div>

                    <div className="flex items-center space-x-1 order-1 sm:order-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="hidden sm:flex"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(isMobile ? 3 : 5, displayData.totalPages) }, (_, i) => {
                          let pageNum: number
                          const maxPages = isMobile ? 3 : 5
                          if (displayData.totalPages <= maxPages) {
                            pageNum = i + 1
                          } else if (currentPage <= Math.floor(maxPages / 2) + 1) {
                            pageNum = i + 1
                          } else if (currentPage >= displayData.totalPages - Math.floor(maxPages / 2)) {
                            pageNum = displayData.totalPages - maxPages + 1 + i
                          } else {
                            pageNum = currentPage - Math.floor(maxPages / 2) + i
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === displayData.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(displayData.totalPages)}
                        disabled={currentPage === displayData.totalPages}
                        className="hidden sm:flex"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Underwriting

// Policy Card Component for Mobile View
const PolicyCard = ({ policy, onEdit, onDelete, onSelect, isSelected, formatDate, getStatusBadge, formatCurrency }) => {
  return (
    <Card className={`mb-4 hover:shadow-md transition-shadow ${isSelected ? "bg-blue-50 border-blue-200" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelect(policy.proposalNo)}
                className="h-4 w-4"
              />
            </div>
            <CardTitle className="text-base font-medium text-indigo-900">
              {policy.proposalNo}
            </CardTitle>
          </div>
          {getStatusBadge(policy.transSTATUS)}
        </div>
        <div className="text-sm text-muted-foreground ml-7">
          {policy.insSurname} {policy.insFirstname}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-medium text-muted-foreground">Sub Class:</span>
            <div className="font-medium">{policy.subRisk || "—"}</div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">End Date:</span>
            <div>{formatDate(policy.endDate)}</div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Premium:</span>
            <div className="font-medium text-blue-900">
              {policy.grossPremium ? formatCurrency(policy.grossPremium, policyCurrency(policy)) : "N/A"}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent border-red-300 text-red-700 hover:bg-red-50"
            onClick={() => onDelete(policy.proposalNo)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => onEdit(policy.proposalNo)}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}