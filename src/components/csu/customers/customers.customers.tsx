//@ts-nocheck
"use client"

import { useEffect, useState, useMemo } from "react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/UI/pagination"

import { useAppDispatch, useAppSelector } from "../../../hooks/use-apps"
import { Button } from "../../UI/new-button"
import Input from "../../UI/Input"
import {
  getAllCustomers,
  getCustomer,
  deleteCustomer,
  selectCustomers,
  setCurrentCustomer,
  clearMessages,
} from "../../../features/reducers/csuReducers/customerSlice"
import {
  selectUiState,
  setShowCreateCustomerDialog,
  setShowEditCustomerDialog,
  setShowCustomerDetailsDialog,
} from "../../../features/reducers/uiReducers/uiSlice"
import { CreateCustomer, EditCustomer, CustomerDetails } from "../../components.customers"
import { useToast } from "@/components/UI/use-toast"
import "./SecurityCustomers.css"

/**
 * Normalizes clientType based on the business rules:
 * - If corporate / corp / organization / isOrg => "Organization"
 * - If individual / person => "Individual"
 */
export const getClientType = (customer: any): "Organization" | "Individual" => {
  if (!customer) return "Individual"
  if (customer.isOrg === true) return "Organization"
  const raw = (customer.clientType || customer.insuredType || "").toString().trim().toUpperCase()
  if (
    raw === "CORPORATE" ||
    raw === "CORP" ||
    raw === "ORGANIZATION" ||
    raw === "ORGANISATION"
  ) {
    return "Organization"
  }
  if (raw === "INDIVIDUAL" || raw === "PERSON") {
    return "Individual"
  }
  if (customer.orgName && !customer.surName && !customer.firstName) {
    return "Organization"
  }
  return "Individual"
}

export const isIndividual = (customer: any) => getClientType(customer) === "Individual"
export const isOrganization = (customer: any) => getClientType(customer) === "Organization"

export const getCustomerDisplayName = (customer: any) => {
  if (!customer) return "Unknown"
  if (isOrganization(customer) && customer.orgName) {
    return customer.orgName
  }
  const name =
    customer.fullName ||
    `${customer.title ? customer.title + " " : ""}${customer.surName || ""} ${customer.otherNames || ""}`.trim() ||
    customer.orgName
  return name || "Unnamed Customer"
}

const getInitials = (name: string) => {
  if (!name) return "C"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const Customers = () => {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const { customers, pagination, loading, error, success } = useAppSelector(selectCustomers)
  const { showCreateCustomerDialog, showEditCustomerDialog, showCustomerDetailsDialog } = useAppSelector(selectUiState)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "organization" | "individual">("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  const [itemsPerPage, setItemsPerPage] = useState<number>(20)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [sortColumn, setSortColumn] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch customers from API when page or page size changes
  useEffect(() => {
    dispatch(getAllCustomers({ pageNumber: currentPage, pageSize: itemsPerPage }))
  }, [dispatch, currentPage, itemsPerPage])

  useEffect(() => {
    if (success.deleteCustomer) {
      toast({
        title: "Customer Deleted",
        description: "Customer has been deleted successfully.",
        variant: "success",
      })
      dispatch(clearMessages())
      dispatch(getAllCustomers({ pageNumber: currentPage, pageSize: itemsPerPage }))
    }
  }, [success.deleteCustomer, dispatch, toast, currentPage, itemsPerPage])

  useEffect(() => {
    if (error.deleteCustomer) {
      toast({
        title: "Delete Failed",
        description: error.deleteCustomer,
        variant: "error",
      })
      dispatch(clearMessages())
    }
  }, [error.deleteCustomer, dispatch, toast])

  // Re-fetch when a new customer is created or updated
  useEffect(() => {
    if (success.createCustomer || success.updateCustomer) {
      dispatch(getAllCustomers({ pageNumber: currentPage, pageSize: itemsPerPage }))
    }
  }, [success.createCustomer, success.updateCustomer, dispatch, currentPage, itemsPerPage])

  // Reset page whenever search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterType, filterStatus])

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()

    return customers.filter((customer) => {
      const type = getClientType(customer)

      const matchesSearch =
        !q ||
        customer.insuredID?.toLowerCase().includes(q) ||
        customer.fullName?.toLowerCase().includes(q) ||
        customer.surName?.toLowerCase().includes(q) ||
        customer.otherNames?.toLowerCase().includes(q) ||
        customer.orgName?.toLowerCase().includes(q) ||
        customer.email?.toLowerCase().includes(q) ||
        customer.mobilePhone?.toLowerCase().includes(q) ||
        customer.landphone?.toLowerCase().includes(q) ||
        customer.state?.toLowerCase().includes(q) ||
        customer.address?.toLowerCase().includes(q)

      const matchesType =
        filterType === "all" ||
        (filterType === "organization" && type === "Organization") ||
        (filterType === "individual" && type === "Individual")

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && customer.active === 1) ||
        (filterStatus === "inactive" && customer.active !== 1)

      return matchesSearch && matchesType && matchesStatus
    })
  }, [customers, searchTerm, filterType, filterStatus])

  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => {
      let valA: string | number = ""
      let valB: string | number = ""

      switch (sortColumn) {
        case "name":
          valA = getCustomerDisplayName(a).toLowerCase()
          valB = getCustomerDisplayName(b).toLowerCase()
          break
        case "id":
          valA = (a.insuredID || "").toLowerCase()
          valB = (b.insuredID || "").toLowerCase()
          break
        case "type":
          valA = getClientType(a)
          valB = getClientType(b)
          break
        case "state":
          valA = (a.state || "").toLowerCase()
          valB = (b.state || "").toLowerCase()
          break
        case "status":
          valA = a.active === 1 ? 1 : 0
          valB = b.active === 1 ? 1 : 0
          break
        default:
          return 0
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1
      if (valA > valB) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [filteredCustomers, sortColumn, sortDirection])

  // Server pagination data
  const totalRecords = pagination?.totalRecords || customers.length
  const totalPages = pagination?.totalPages || Math.max(1, Math.ceil(totalRecords / itemsPerPage))
  const displayCustomers = sortedCustomers
  const paginatedCustomers = displayCustomers

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortColumn(col)
      setSortDirection("asc")
    }
  }

  const handleCreateCustomer = () => {
    dispatch(setShowCreateCustomerDialog(true))
  }

  const handleEditCustomer = (customer: any) => {
    dispatch(setCurrentCustomer(customer))
    dispatch(setShowEditCustomerDialog(true))
    if (customer.insuredID) {
      dispatch(getCustomer(customer.insuredID))
    }
  }

  const handleViewCustomer = (customer: any) => {
    dispatch(setCurrentCustomer(customer))
    dispatch(setShowCustomerDetailsDialog(true))
    if (customer.insuredID) {
      dispatch(getCustomer(customer.insuredID))
    }
  }

  const handleDeleteCustomer = async (insuredID: string) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      setDeletingId(insuredID)
      try {
        await dispatch(deleteCustomer(insuredID)).unwrap()
      } catch (err) {
        // error will trigger alert via useEffect
      } finally {
        setDeletingId(null)
      }
    }
  }

  const handleRefresh = () => {
    dispatch(getAllCustomers({ pageNumber: currentPage, pageSize: itemsPerPage }))
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setFilterType("all")
    setFilterStatus("all")
  }

  const stats = useMemo(() => {
    const total = pagination?.totalRecords || customers.length
    const organizations = customers.filter((c) => isOrganization(c)).length
    const individuals = customers.filter((c) => isIndividual(c)).length
    const activeCount = customers.filter((c) => c.active === 1).length

    return { total, organizations, individuals, activeCount }
  }, [customers, pagination])

  const hasActiveFilters = searchTerm !== "" || filterType !== "all" || filterStatus !== "all"

  return (
    <div className="sc-customers-container">
      {/* Header Section */}
      <div className="sc-header-section">
        <div className="sc-title-section">
          <h1 className="sc-page-title">Customer Management</h1>
          <p className="sc-page-subtitle">Manage individual and organization customer profiles and policies</p>
        </div>
        <div className="sc-header-actions">
          <button
            type="button"
            onClick={handleRefresh}
            className="sc-refresh-btn"
            title="Refresh customers"
            disabled={loading.getAllCustomers}
          >
            <svg
              className={loading.getAllCustomers ? "sc-spinning" : ""}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
            </svg>
            Refresh
          </button>
          <Button onClick={handleCreateCustomer} className="sc-create-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Customer
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="sc-stats-grid">
        <div
          className={`sc-stat-card sc-stat-clickable ${filterType === "all" && filterStatus === "all" ? "sc-stat-active" : ""}`}
          onClick={() => {
            setFilterType("all")
            setFilterStatus("all")
          }}
          title="Click to view all customers"
        >
          <div className="sc-stat-icon sc-stat-total">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="sc-stat-content">
            <div className="sc-stat-number">{stats.total.toLocaleString()}</div>
            <div className="sc-stat-label">Total Customers</div>
          </div>
        </div>

        <div
          className={`sc-stat-card sc-stat-clickable ${filterType === "organization" ? "sc-stat-active" : ""}`}
          onClick={() => setFilterType(filterType === "organization" ? "all" : "organization")}
          title="Click to filter by Organizations"
        >
          <div className="sc-stat-icon sc-stat-organizations">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
              <path d="M9 9v.01M9 12v.01M9 15v.01M13 9v.01M13 12v.01M13 15v.01" />
            </svg>
          </div>
          <div className="sc-stat-content">
            <div className="sc-stat-number">{stats.organizations.toLocaleString()}</div>
            <div className="sc-stat-label">Organizations</div>
          </div>
        </div>

        <div
          className={`sc-stat-card sc-stat-clickable ${filterType === "individual" ? "sc-stat-active" : ""}`}
          onClick={() => setFilterType(filterType === "individual" ? "all" : "individual")}
          title="Click to filter by Individuals"
        >
          <div className="sc-stat-icon sc-stat-individuals">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="sc-stat-content">
            <div className="sc-stat-number">{stats.individuals.toLocaleString()}</div>
            <div className="sc-stat-label">Individuals</div>
          </div>
        </div>

        <div
          className={`sc-stat-card sc-stat-clickable ${filterStatus === "active" ? "sc-stat-active" : ""}`}
          onClick={() => setFilterStatus(filterStatus === "active" ? "all" : "active")}
          title="Click to filter by Active status"
        >
          <div className="sc-stat-icon sc-stat-active-count">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="sc-stat-content">
            <div className="sc-stat-number">{stats.activeCount.toLocaleString()}</div>
            <div className="sc-stat-label">Active Records</div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="sc-filters-section">
        <div className="sc-search-container">
          <div className="sc-search-wrapper">
            <svg
              className="sc-search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <Input
              type="text"
              placeholder="Search by ID, name, organization, email, phone, or state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sc-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="sc-search-clear-btn"
                onClick={() => setSearchTerm("")}
                title="Clear search"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        <div className="sc-filter-controls">
          <div className="sc-filter-group">
            <label className="sc-filter-label">Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="sc-filter-select"
            >
              <option value="all">All Types</option>
              <option value="organization">Organization</option>
              <option value="individual">Individual</option>
            </select>
          </div>

          <div className="sc-filter-group">
            <label className="sc-filter-label">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="sc-filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="sc-filter-group">
            <label className="sc-filter-label">Per Page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="sc-filter-select sc-per-page-select"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="sc-clear-filters-btn"
              title="Reset all filters"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="sc-results-summary">
        <span className="sc-results-text">
          Showing {displayCustomers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
          {Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} customers
          {hasActiveFilters && ` (${displayCustomers.length} on this page match filters)`}
        </span>
      </div>

      {/* Customers Table */}
      <div className="sc-table-container">
        {loading.getAllCustomers ? (
          <div className="sc-loading-state">
            <div className="sc-loading-spinner"></div>
            <p>Loading customers...</p>
          </div>
        ) : error.getAllCustomers ? (
          <div className="sc-error-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <h3>Error Loading Customers</h3>
            <p>{error.getAllCustomers}</p>
            <Button onClick={handleRefresh} className="sc-retry-btn">
              Try Again
            </Button>
          </div>
        ) : displayCustomers.length === 0 ? (
          <div className="sc-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h3>No Customers Found</h3>
            <p>
              {hasActiveFilters
                ? "No customers match your current filter and search criteria."
                : "Get started by adding your first customer."}
            </p>
            {hasActiveFilters ? (
              <Button onClick={handleClearFilters} className="sc-empty-action-btn">
                Clear Filters
              </Button>
            ) : (
              <Button onClick={handleCreateCustomer} className="sc-empty-action-btn">
                Add First Customer
              </Button>
            )}
          </div>
        ) : (
          <table className="sc-customers-table">
            <thead>
              <tr className="sc-table-header">
                <th className="sc-table-head sc-sortable-head" onClick={() => handleSort("name")}>
                  <div className="sc-head-cell">
                    <span>Customer</span>
                    <span className="sc-sort-indicator">
                      {sortColumn === "name" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </div>
                </th>
                <th className="sc-table-head sc-sortable-head" onClick={() => handleSort("type")}>
                  <div className="sc-head-cell">
                    <span>Client Type</span>
                    <span className="sc-sort-indicator">
                      {sortColumn === "type" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </div>
                </th>
                <th className="sc-table-head">Contact</th>
                <th className="sc-table-head sc-sortable-head" onClick={() => handleSort("state")}>
                  <div className="sc-head-cell">
                    <span>State / Address</span>
                    <span className="sc-sort-indicator">
                      {sortColumn === "state" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </div>
                </th>
                <th className="sc-table-head sc-sortable-head" onClick={() => handleSort("status")}>
                  <div className="sc-head-cell">
                    <span>Status</span>
                    <span className="sc-sort-indicator">
                      {sortColumn === "status" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </div>
                </th>
                <th className="sc-table-head sc-actions-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayCustomers.map((customer) => {
                const displayName = getCustomerDisplayName(customer)
                const clientType = getClientType(customer)
                const isOrg = clientType === "Organization"
                const isActive = customer.active === 1
                const isDeleting = deletingId === customer.insuredID

                return (
                  <tr key={customer.insuredID || Math.random()} className="sc-table-row">
                    {/* Customer Name & ID */}
                    <td className="sc-table-cell">
                      <div className="sc-customer-cell">
                        <div className={`sc-avatar ${isOrg ? "sc-avatar-org" : "sc-avatar-ind"}`}>
                          {getInitials(displayName)}
                        </div>
                        <div className="sc-customer-info">
                          <span className="sc-customer-name" title={displayName}>
                            {displayName}
                          </span>
                          <span className="sc-customer-id-pill">
                            ID: {customer.insuredID || "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Normalized Client Type */}
                    <td className="sc-table-cell">
                      <span className={`sc-type-badge ${isOrg ? "sc-badge-org" : "sc-badge-ind"}`}>
                        {isOrg ? (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
                            </svg>
                            Organization
                          </>
                        ) : (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            Individual
                          </>
                        )}
                      </span>
                    </td>

                    {/* Contact (Email + Phone) */}
                    <td className="sc-table-cell">
                      <div className="sc-contact-stack">
                        {customer.email && customer.email.trim() !== "@" && customer.email.trim() !== "" ? (
                          <a
                            href={`mailto:${customer.email}`}
                            className="sc-contact-link sc-contact-email"
                            title={customer.email}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                              <polyline points="22,6 12,13 2,6" />
                            </svg>
                            <span>{customer.email}</span>
                          </a>
                        ) : (
                          <span className="sc-contact-muted">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            </svg>
                            No email
                          </span>
                        )}

                        <span className="sc-contact-phone">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <span>{customer.mobilePhone || customer.landphone || "N/A"}</span>
                        </span>
                      </div>
                    </td>

                    {/* State & Address */}
                    <td className="sc-table-cell">
                      <div className="sc-location-stack">
                        <span className="sc-state-badge">{customer.state || "Unspecified"}</span>
                        {customer.address && (
                          <span className="sc-address-preview" title={customer.address}>
                            {customer.address.length > 45 ? `${customer.address.substring(0, 45)}...` : customer.address}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="sc-table-cell">
                      <span className={`sc-status-pill ${isActive ? "sc-status-active" : "sc-status-inactive"}`}>
                        <span className="sc-status-dot"></span>
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="sc-table-cell sc-actions-cell">
                      <div className="sc-action-buttons">
                        <button
                          onClick={() => handleViewCustomer(customer)}
                          className="sc-action-btn sc-view-btn"
                          title="View Details"
                          aria-label="View Customer Details"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="sc-action-btn sc-edit-btn"
                          title="Edit Customer"
                          aria-label="Edit Customer"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer.insuredID)}
                          className="sc-action-btn sc-delete-btn"
                          title="Delete Customer"
                          aria-label="Delete Customer"
                          disabled={isDeleting || (loading.deleteCustomer && deletingId === customer.insuredID)}
                        >
                          {isDeleting ? (
                            <span className="sc-inline-spinner" />
                          ) : (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="3,6 5,6 21,6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="ep-pagination-container">
          <div className="ep-pagination-info">
            Showing{" "}
            <span className="ep-pagination-numbers">
              {totalRecords > 0
                ? `${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, totalRecords)} of ${totalRecords}`
                : "0 to 0 of 0"}
            </span>{" "}
            Customers
          </div>

          <Pagination className="pr-pagination-controls">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className="pr-pagination-prev"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || pagination?.hasPreviousPage === false}
                />
              </PaginationItem>

              {/* page numbers (current ±2 window) */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page >= Math.max(1, currentPage - 2) &&
                    page <= Math.min(totalPages, currentPage + 2),
                )
                .map((page) => (
                  <PaginationItem key={page} className="pr-pagination-item">
                    <PaginationLink
                      isActive={currentPage === page}
                      onClick={() => setCurrentPage(page)}
                      className="pr-pagination-link"
                      aria-current={currentPage === page ? "page" : undefined}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

              <PaginationItem>
                <PaginationNext
                  className="pr-pagination-next"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || pagination?.hasNextPage === false}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Modals */}
      {showCreateCustomerDialog && <CreateCustomer />}
      {showEditCustomerDialog && <EditCustomer />}
      {showCustomerDetailsDialog && <CustomerDetails />}
    </div>
  )
}

export default Customers
