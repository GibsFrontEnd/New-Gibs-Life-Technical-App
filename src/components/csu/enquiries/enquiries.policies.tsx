//@ts-nocheck
"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/UI/new-button"
import { useAppDispatch, useAppSelector } from "@/hooks/use-apps"
import SearchBar from "@/components/SearchBar"
import {
  getAllPolicies,
  endorsePolicy,
  cancelPolicy,
  niipUpload,
  selectPolicies,
  setCurrentPolicy,
} from "@/features/reducers/csuReducers/policySlice"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/UI/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/UI/pagination"
import {
  selectUiState,
  setShowCreatePolicyDialog,
  setShowRenewPolicyDialog,
  setShowPolicyDetailsDialog,
} from "@/features/reducers/uiReducers/uiSlice"
import type { Policy } from "@/types/policy"
import { CreatePolicy, RenewPolicy, PolicyDetails } from "../../components.policies"
import "./EnquiriesPolicies.css"

const ITEMS_PER_PAGE = 10
const SEARCH_DEBOUNCE_MS = 300

const EnquiriesPolicies = () => {
  const dispatch = useAppDispatch()
  const { policies, success, loading, error, niipResponse } = useAppSelector(selectPolicies)
  const { showCreatePolicyDialog, showRenewPolicyDialog, showPolicyDetailsDialog } = useAppSelector(selectUiState)

  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const debounceRef = useRef<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all")

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), SEARCH_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [searchTerm])

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, statusFilter])

  // Load policies on component mount
  useEffect(() => {
    dispatch(getAllPolicies())
  }, [dispatch])

  // Check if policy is expired
  const isPolicyExpired = (endDate: string) => {
    return new Date(endDate) < new Date()
  }

  // Filter policies based on search and status
  const filteredPolicies = policies.filter((policy) => {
    if (!debouncedSearch && statusFilter === "all") return true

    const searchLower = debouncedSearch.toLowerCase()
    const matchesSearch =
      !debouncedSearch ||
      policy.policyNo.toLowerCase().includes(searchLower) ||
      policy.customerName.toLowerCase().includes(searchLower) ||
      policy.productID.toLowerCase().includes(searchLower) ||
      policy.agentID.toLowerCase().includes(searchLower) ||
      policy.documentNo.toLowerCase().includes(searchLower)

    const isExpired = isPolicyExpired(policy.endDate)
    const matchesStatus =
      statusFilter === "all" || (statusFilter === "active" && !isExpired) || (statusFilter === "expired" && isExpired)

    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalItems = filteredPolicies.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentData = filteredPolicies.slice(startIndex, endIndex)

  // Statistics
  const stats = {
    total: policies.length,
    active: policies.filter((p) => !isPolicyExpired(p.endDate)).length,
    expired: policies.filter((p) => isPolicyExpired(p.endDate)).length,
    totalPremium: policies.reduce((sum, p) => sum + p.premium, 0),
  }

  const handleViewPolicy = (policy: Policy) => {
    dispatch(setCurrentPolicy(policy))
    dispatch(setShowPolicyDetailsDialog(true))
  }

  const handleRenewPolicy = (policy: Policy) => {
    dispatch(setCurrentPolicy(policy))
    dispatch(setShowRenewPolicyDialog(true))
  }

  const handleEndorsePolicy = async (policyNo: string) => {
    if (window.confirm("Are you sure you want to endorse this policy?")) {
      try {
        await dispatch(endorsePolicy(policyNo)).unwrap()
        alert("Policy endorsed successfully!")
      } catch (error: any) {
        if (error.includes("Feature coming soon")) {
          alert("Endorsement feature is coming soon!")
        } else {
          alert(`Failed to endorse policy: ${error}`)
        }
      }
    }
  }

  const handleCancelPolicy = async (policyNo: string) => {
    if (window.confirm("Are you sure you want to cancel this policy? This action cannot be undone.")) {
      try {
        await dispatch(cancelPolicy(policyNo)).unwrap()
        alert("Policy cancelled successfully!")
      } catch (error: any) {
        if (error.includes("Feature coming soon")) {
          alert("Cancellation feature is coming soon!")
        } else {
          alert(`Failed to cancel policy: ${error}`)
        }
      }
    }
  }

  const handleNiipUpload = async (policyNo: string) => {
    if (window.confirm("Upload this policy to NIIP (National Insurance Information Portal)?")) {
      try {
        await dispatch(niipUpload(policyNo)).unwrap()
        if (niipResponse) {
          if (niipResponse.success) {
            alert("Policy uploaded to NIIP successfully!")
          } else {
            alert(`NIIP Upload failed: ${niipResponse.resultMessage}`)
          }
        }
      } catch (error: any) {
        alert(`Failed to upload to NIIP: ${error}`)
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB")
  }

  const getStatusBadge = (policy: Policy) => {
    const isExpired = isPolicyExpired(policy.endDate)
    return (
      <span className={`ep-status-badge ${isExpired ? "ep-status-expired" : "ep-status-active"}`}>
        {isExpired ? "Expired" : "Active"}
      </span>
    )
  }

  // Pagination UI (5 window + ellipses)
  const renderPageNumbers = () => {
    const pages: (number | "ellipsis")[] = []
    const left = Math.max(1, currentPage - 2)
    const right = Math.min(totalPages, currentPage + 2)

    if (left > 1) {
      pages.push(1)
      if (left > 2) pages.push("ellipsis")
    }

    for (let p = left; p <= right; p++) pages.push(p)

    if (right < totalPages) {
      if (right < totalPages - 1) pages.push("ellipsis")
      pages.push(totalPages)
    }

    return pages.map((p, idx) =>
      p === "ellipsis" ? (
        <PaginationItem key={`el-${idx}`} className="ep-pagination-item">
          <span style={{ padding: "0 .5rem" }}>…</span>
        </PaginationItem>
      ) : (
        <PaginationItem key={p} className="ep-pagination-item">
          <PaginationLink isActive={currentPage === p} onClick={() => setCurrentPage(p)}>
            {p}
          </PaginationLink>
        </PaginationItem>
      ),
    )
  }

  return (
    <div className="ep-policies-container">
      <div className="ep-policies-header">
        <div className="ep-header-section">
          <h1 className="ep-page-title">Policy Management</h1>
          <p className="ep-page-subtitle">Manage insurance policies and operations</p>
        </div>

        <div className="ep-stats-cards">
          <div className="ep-stat-card">
            <div className="ep-stat-number">{stats.total}</div>
            <div className="ep-stat-label">Total Policies</div>
          </div>
          <div className="ep-stat-card ep-stat-active">
            <div className="ep-stat-number">{stats.active}</div>
            <div className="ep-stat-label">Active Policies</div>
          </div>
          <div className="ep-stat-card ep-stat-expired">
            <div className="ep-stat-number">{stats.expired}</div>
            <div className="ep-stat-label">Expired Policies</div>
          </div>
          <div className="ep-stat-card ep-stat-premium">
            <div className="ep-stat-number">{formatCurrency(stats.totalPremium)}</div>
            <div className="ep-stat-label">Total Premium</div>
          </div>
        </div>
      </div>

      <div className="ep-controls-section">
        <div className="ep-search-section">
          <SearchBar
            placeholder="Search by policy number, customer, product, or agent..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="ep-search-bar"
          />
        </div>

        <div className="ep-filter-section">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "expired")}
            className="ep-status-filter"
          >
            <option value="all">All Policies</option>
            <option value="active">Active Only</option>
            <option value="expired">Expired Only</option>
          </select>
        </div>

        <Button className="ep-add-policy-btn" onClick={() => dispatch(setShowCreatePolicyDialog(true))}>
          Create New Policy
        </Button>
      </div>

      {loading.getAllPolicies ? (
        <div className="ep-loading-container">
          <div className="ep-loading-spinner"></div>
          <p>Loading policies...</p>
        </div>
      ) : (
        <div className="ep-table-container">
          <Table className="ep-policies-table">
            <TableHeader>
              <TableRow className="ep-table-header-row">
                <TableHead className="ep-table-head">S/N</TableHead>
                <TableHead className="ep-table-head">Policy No.</TableHead>
                <TableHead className="ep-table-head">Customer</TableHead>
                <TableHead className="ep-table-head">Product</TableHead>
                <TableHead className="ep-table-head">Premium</TableHead>
                <TableHead className="ep-table-head">Period</TableHead>
                <TableHead className="ep-table-head">Status</TableHead>
                <TableHead className="ep-table-head">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="ep-table-body">
              {currentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="ep-no-data-cell">
                    {debouncedSearch || statusFilter !== "all"
                      ? "No policies found matching your search criteria"
                      : "No policies found"}
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((policy, index) => {
                  const globalIndex = startIndex + index
                  const isExpired = isPolicyExpired(policy.endDate)
                  return (
                    <TableRow key={policy.policyNo} className="ep-table-row">
                      <TableCell className="ep-table-cell">{globalIndex + 1}</TableCell>
                      <TableCell className="ep-table-cell">
                        <div className="ep-policy-info">
                          <span className="ep-policy-no">{policy.policyNo}</span>
                          <span className="ep-document-no">{policy.documentNo}</span>
                        </div>
                      </TableCell>
                      <TableCell className="ep-table-cell">
                        <div className="ep-customer-info">
                          <span className="ep-customer-name">{policy.customerName}</span>
                          <span className="ep-customer-id">ID: {policy.customerID}</span>
                        </div>
                      </TableCell>
                      <TableCell className="ep-table-cell">
                        <div className="ep-product-info">
                          <span className="ep-product-id">{policy.productID}</span>
                          <span className="ep-agent-id">Agent: {policy.agentID}</span>
                        </div>
                      </TableCell>
                      <TableCell className="ep-table-cell">
                        <span className="ep-premium">{formatCurrency(policy.premium)}</span>
                      </TableCell>
                      <TableCell className="ep-table-cell">
                        <div className="ep-period-info">
                          <span className="ep-start-date">{formatDate(policy.startDate)}</span>
                          <span className="ep-end-date">{formatDate(policy.endDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="ep-table-cell">{getStatusBadge(policy)}</TableCell>
                      <TableCell className="ep-table-cell">
                        <div className="ep-actions-cell">
                          <Button
                            className="ep-view-btn"
                            size="sm"
                            onClick={() => handleViewPolicy(policy)}
                            title="View Details"
                          >
                            View
                          </Button>
{/*                           {!isExpired && (
                            <Button
                              className="ep-renew-btn"
                              size="sm"
                              onClick={() => handleRenewPolicy(policy)}
                              title="Renew Policy"
                            >
                              Renew
                            </Button>
                          )}
 */}                          
{/*  <Button
                            className="ep-endorse-btn"
                            size="sm"
                            onClick={() => handleEndorsePolicy(policy.policyNo)}
                            title="Endorse Policy"
                          >
                            Endorse
                          </Button>
 */}           
                <Button
                            className="ep-niip-btn"
                            size="sm"
                            onClick={() => handleNiipUpload(policy.policyNo)}
                            title="Upload to NIIP"
                          >
                            NIIP
                          </Button>
                          <Button
                            variant="destructive"
                            className="ep-cancel-btn"
                            size="sm"
                            onClick={() => handleCancelPolicy(policy.policyNo)}
                            title="Cancel Policy"
                          >
                            Cancel
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          <div className="ep-pagination-container">
            <div className="ep-pagination-info">
              Showing{" "}
              <span className="ep-pagination-numbers">
                {totalItems > 0
                  ? `${startIndex + 1} to ${Math.min(endIndex, totalItems)} of ${totalItems}`
                  : "0 to 0 of 0"}
              </span>{" "}
              Policies
            </div>

            <Pagination className="pr-pagination-controls">
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious
          className="pr-pagination-prev"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        />
      </PaginationItem>

      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(
          (page) =>
            page >= Math.max(1, currentPage - 2) &&
            page <= Math.min(totalPages, currentPage + 2),
        )
        .map((page) => (
          <PaginationItem
            key={page}
            className="pr-pagination-item"
          >
            <PaginationLink
              isActive={currentPage === page}
              onClick={() => setCurrentPage(page)}
              className="pr-pagination-link"
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

      <PaginationItem>
        <PaginationNext
          className="pr-pagination-next"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
          </div>
        </div>
      )}

      <CreatePolicy />
      <RenewPolicy />
      <PolicyDetails />
    </div>
  )
}

export default EnquiriesPolicies
