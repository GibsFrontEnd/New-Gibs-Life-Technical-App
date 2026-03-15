//@ts-nocheck
"use client"

import { useEffect, useState } from "react"
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
  // getCustomerPolicies,
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
import "./SecurityCustomers.css"

const Customers = () => {
  const dispatch = useAppDispatch()
  const { customers, loading, error } = useAppSelector(selectCustomers)
  const { showCreateCustomerDialog, showEditCustomerDialog, showCustomerDetailsDialog } = useAppSelector(selectUiState)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5 

  useEffect(() => {
    dispatch(getAllCustomers())
  }, [dispatch])

  useEffect(() => {
    if (error.deleteCustomer) {
      alert(`Error: ${error.deleteCustomer}`)
      dispatch(clearMessages())
    }
  }, [error.deleteCustomer, dispatch])

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.customerID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.orgName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.firstName && customer.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.lastName && customer.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilter =
      filterType === "all" ||
      (filterType === "organization" && customer.isOrg) ||
      (filterType === "individual" && !customer.isOrg)

    return matchesSearch && matchesFilter
  })

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage)

  const handleCreateCustomer = () => {
    dispatch(setShowCreateCustomerDialog(true))
  }

  const handleEditCustomer = (customer: any) => {
    dispatch(setCurrentCustomer(customer))
    dispatch(setShowEditCustomerDialog(true))
  }

  const handleViewCustomer = (customer: any) => {
    dispatch(setCurrentCustomer(customer))
    dispatch(getCustomerPolicies(customer.customerID))
    dispatch(setShowCustomerDetailsDialog(true))
  }

  const handleDeleteCustomer = (customerID: string) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      dispatch(deleteCustomer(customerID))
    }
  }

  const getCustomerDisplayName = (customer: any) => {
    if (customer.isOrg) {
      return customer.orgName || "Unknown Organization"
    }
    return `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Unknown Individual"
  }

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "1900-01-01") return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const getCustomerStats = () => {
    const total = customers.length
    const organizations = customers.filter((c) => c.isOrg).length
    const individuals = customers.filter((c) => !c.isOrg).length
    const withEmail = customers.filter((c) => c.email && c.email.trim() !== "").length

    return { total, organizations, individuals, withEmail }
  }

  const stats = getCustomerStats()

  return (
    <div className="sc-customers-container">
      {/* Header Section */}
      <div className="sc-header-section">
        <div className="sc-title-section">
          <h1 className="sc-page-title">Customer Management</h1>
          <p className="sc-page-subtitle">Manage customer information and policies</p>
        </div>
        <Button onClick={handleCreateCustomer} className="sc-create-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Customer
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="sc-stats-grid">
        <div className="sc-stat-card">
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

        <div className="sc-stat-card">
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

        <div className="sc-stat-card">
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

        <div className="sc-stat-card">
          <div className="sc-stat-icon sc-stat-email">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <div className="sc-stat-content">
            <div className="sc-stat-number">{stats.withEmail.toLocaleString()}</div>
            <div className="sc-stat-label">With Email</div>
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
              placeholder="Search customers by ID, name, organization, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sc-search-input"
            />
          </div>
        </div>

        <div className="sc-filter-controls">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="sc-filter-select">
            <option value="all">All Types</option>
            <option value="organization">Organizations</option>
            <option value="individual">Individuals</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="sc-results-summary">
        <span className="sc-results-text">
          Showing {paginatedCustomers.length} of {filteredCustomers.length} customers
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
            <Button onClick={() => dispatch(getAllCustomers())} className="sc-retry-btn">
              Try Again
            </Button>
          </div>
        ) : paginatedCustomers.length === 0 ? (
          <div className="sc-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h3>No Customers Found</h3>
            <p>
              {searchTerm || filterType !== "all"
                ? "No customers match your search criteria."
                : "Get started by adding your first customer."}
            </p>
            {!searchTerm && filterType === "all" && (
              <Button onClick={handleCreateCustomer} className="sc-empty-action-btn">
                Add First Customer
              </Button>
            )}
          </div>
        ) : (
          <table className="sc-customers-table">
            <thead>
              <tr className="sc-table-header">
                <th className="sc-table-head">Customer ID</th>
                <th className="sc-table-head">Name/Organization</th>
                <th className="sc-table-head">Type</th>
                <th className="sc-table-head">Email</th>
                <th className="sc-table-head">Phone</th>
                <th className="sc-table-head">State</th>
                <th className="sc-table-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((customer) => (
                <tr key={customer.customerID} className="sc-table-row">
                  <td className="sc-table-cell">
                    <span className="sc-customer-id">{customer.customerID}</span>
                  </td>
                  <td className="sc-table-cell">
                    <div className="sc-customer-info">
                      <span className="sc-customer-name">{getCustomerDisplayName(customer)}</span>
                      {customer.address && (
                        <span className="sc-customer-address">{customer.address.substring(0, 50)}...</span>
                      )}
                    </div>
                  </td>
                  <td className="sc-table-cell">
                    <span className={`sc-type-badge ${customer.isOrg ? "sc-org" : "sc-individual"}`}>
                      {customer.isOrg ? "Organization" : "Individual"}
                    </span>
                  </td>
                  <td className="sc-table-cell">
                    <span className="sc-customer-email">{customer.email || "N/A"}</span>
                  </td>
                  <td className="sc-table-cell">
                    <span className="sc-customer-phone">{customer.phoneLine1 || "N/A"}</span>
                  </td>
                  <td className="sc-table-cell">
                    <span className="sc-customer-state">{customer.stateID || "N/A"}</span>
                  </td>
                  <td className="sc-table-cell">
                    <div className="sc-action-buttons">
                      <button
                        onClick={() => handleViewCustomer(customer)}
                        className="sc-action-btn sc-view-btn"
                        title="View Details"
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
                        onClick={() => handleDeleteCustomer(customer.customerID)}
                        className="sc-action-btn sc-delete-btn"
                        title="Delete Customer"
                        disabled={loading.deleteCustomer}
                      >
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
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
        {filteredCustomers.length > 0
          ? `${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, filteredCustomers.length)} of ${filteredCustomers.length}`
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
            disabled={currentPage === 1}
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
            disabled={currentPage === totalPages}
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
