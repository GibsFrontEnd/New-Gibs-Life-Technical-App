//@ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "../../../hooks/use-apps"
import { Button } from "../../UI/new-button"
import Input from "../../UI/Input"
import {
  getAllAgents,
  getAgent,
  deleteAgent,
  selectAgents,
  selectAgentPagination,
  selectAgentLoading,
  selectAgentError,
  selectAgentSuccess,
  setCurrentAgent,
  clearMessages,
} from "../../../features/reducers/csuReducers/agentSlice"
import {
  selectUiState,
  setShowCreateAgentDialog,
  setShowEditAgentDialog,
  setShowAgentDetailsDialog,
} from "../../../features/reducers/uiReducers/uiSlice"
import { CreateAgent, EditAgent, AgentDetails } from "../../components.agents"
import "./SecurityAgents.css"

// Pagination primitives
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/UI/pagination"

const Party = () => {
  const dispatch = useAppDispatch()
  
  // Use selectors with safe defaults - ensure agents is always an array
  const agentsData = useAppSelector(selectAgents)
  const agents = Array.isArray(agentsData) ? agentsData : []
  
  const pagination = useAppSelector(selectAgentPagination)
  const loading = useAppSelector(selectAgentLoading)
  const error = useAppSelector(selectAgentError)
  const success = useAppSelector(selectAgentSuccess)
  const { showCreateAgentDialog, showEditAgentDialog, showAgentDetailsDialog } = useAppSelector(selectUiState)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch agents on page change
  useEffect(() => {
    console.log("Fetching agents for page:", currentPage)
    dispatch(getAllAgents({ pageNumber: currentPage, pageSize: 10 }))
  }, [dispatch, currentPage])

  // Handle delete success/errors
  useEffect(() => {
    if (success?.deleteAgent) {
      // Refresh the list after successful delete
      dispatch(getAllAgents({ pageNumber: currentPage, pageSize: 10 }))
      dispatch(clearMessages())
    }
  }, [success?.deleteAgent, dispatch, currentPage])

  useEffect(() => {
    if (error?.deleteAgent) {
      alert(`Error: ${error.deleteAgent}`)
      dispatch(clearMessages())
    }
  }, [error?.deleteAgent, dispatch])

  // Debug log to check data
  console.log("Agents Data:", agents)
  console.log("Is Agents Array:", Array.isArray(agents))
  console.log("Agents Length:", agents?.length)
  console.log("Pagination:", pagination)
  console.log("Loading:", loading)
  console.log("Error:", error)

  // Client-side filtering - safely handle cases where agents might not be an array
  const filteredAgents = Array.isArray(agents) ? agents.filter((agent) => {
    if (!agent) return false
    const matchesSearch =
      agent.agentID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.agent && agent.agent.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (agent.email && agent.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (agent.unitID && agent.unitID.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilter =
      filterType === "all" ||
      (filterType === "active" && agent.deleted !== 1) ||
      (filterType === "inactive" && agent.deleted === 1)

    return matchesSearch && matchesFilter
  }) : []

  const handleCreateAgent = () => {
    dispatch(setShowCreateAgentDialog(true))
  }

  const handleEditAgent = (agent: any) => {
    dispatch(setCurrentAgent(agent))
    dispatch(setShowEditAgentDialog(true))
  }

  const handleViewAgent = (agent: any) => {
    dispatch(setCurrentAgent(agent))
    dispatch(getAgent(agent.agentID))
    dispatch(setShowAgentDetailsDialog(true))
  }

  const handleDeleteAgent = (agentID: string) => {
    if (window.confirm("Are you sure you want to delete this agent?")) {
      dispatch(deleteAgent(agentID))
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "₦0"
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getAgentStats = () => {
    const safeAgents = Array.isArray(agents) ? agents : []
    const total = pagination?.totalRecords ?? safeAgents.length
    const active = safeAgents.filter((a) => a?.deleted !== 1).length
    const inactive = safeAgents.filter((a) => a?.deleted === 1).length
    const withEmail = safeAgents.filter((a) => a?.email && a.email.trim() !== "").length

    return { total, active, inactive, withEmail }
  }

  const stats = getAgentStats()
  const safeAgents = Array.isArray(agents) ? agents : []

  // Pagination helpers
  const pageSize = pagination?.pageSize ?? 10
  const totalPages = Math.max(1, pagination?.totalPages ?? 1)
  const pageNumber = pagination?.pageNumber ?? currentPage
  const totalRecords = pagination?.totalRecords ?? safeAgents.length
  const startIndex = (pageNumber - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalRecords)

  return (
    <div className="sa-agents-container">
      {/* Header Section */}
      <div className="sa-header-section">
        <div className="sa-title-section">
          <h1 className="sa-page-title">Agent Management</h1>
          <p className="sa-page-subtitle">Manage insurance agents and brokers</p>
        </div>
        <Button onClick={handleCreateAgent} className="sa-create-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Agent
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="sa-stats-grid">
        <div className="sa-stat-card">
          <div className="sa-stat-icon sa-stat-total">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="sa-stat-content">
            <div className="sa-stat-number">{totalRecords.toLocaleString()}</div>
            <div className="sa-stat-label">Total Agents</div>
          </div>
        </div>

        <div className="sa-stat-card">
          <div className="sa-stat-icon sa-stat-active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22,4 12,14.01 9,11.01" />
            </svg>
          </div>
          <div className="sa-stat-content">
            <div className="sa-stat-number">{stats.active.toLocaleString()}</div>
            <div className="sa-stat-label">Active Agents</div>
          </div>
        </div>

        <div className="sa-stat-card">
          <div className="sa-stat-icon sa-stat-inactive">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div className="sa-stat-content">
            <div className="sa-stat-number">{stats.inactive.toLocaleString()}</div>
            <div className="sa-stat-label">Inactive Agents</div>
          </div>
        </div>

        <div className="sa-stat-card">
          <div className="sa-stat-icon sa-stat-email">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <div className="sa-stat-content">
            <div className="sa-stat-number">{stats.withEmail.toLocaleString()}</div>
            <div className="sa-stat-label">With Email</div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="sa-filters-section">
        <div className="sa-search-container">
          <div className="sa-search-wrapper">
            <svg
              className="sa-search-icon"
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
              placeholder="Search agents by ID, name, email, or unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sa-search-input"
            />
          </div>
        </div>

        <div className="sa-filter-controls">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="sa-filter-select">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="sa-results-summary">
        <span className="sa-results-text">
          Showing {filteredAgents.length} of {totalRecords} agents (Page {pageNumber} of {totalPages})
        </span>
      </div>

      {/* Agents Table */}
      <div className="sa-table-container">
        {loading?.getAllAgents ? (
          <div className="sa-loading-state">
            <div className="sa-loading-spinner"></div>
            <p>Loading agents...</p>
          </div>
        ) : error?.getAllAgents ? (
          <div className="sa-error-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <h3>Error Loading Agents</h3>
            <p>{error.getAllAgents}</p>
            <Button
              onClick={() => dispatch(getAllAgents({ pageNumber: currentPage, pageSize: 10 }))}
              className="sa-retry-btn"
            >
              Try Again
            </Button>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="sa-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h3>No Agents Found</h3>
            <p>
              {searchTerm || filterType !== "all"
                ? "No agents match your search criteria."
                : "Get started by adding your first agent."}
            </p>
            {!searchTerm && filterType === "all" && (
              <Button onClick={handleCreateAgent} className="sa-empty-action-btn">
                Add First Agent
              </Button>
            )}
          </div>
        ) : (
          <table className="sa-agents-table">
            <thead>
              <tr className="sa-table-header">
                <th className="sa-table-head">Agent ID</th>
                <th className="sa-table-head">Name</th>
                <th className="sa-table-head">Unit</th>
                <th className="sa-table-head">Email</th>
                <th className="sa-table-head">Phone</th>
                <th className="sa-table-head">Status</th>
                <th className="sa-table-head">Credit Limit</th>
                <th className="sa-table-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map((agent) => (
                <tr key={agent.agentID} className="sa-table-row">
                  <td className="sa-table-cell">
                    <span className="sa-agent-id">{agent.agentID}</span>
                  </td>
                  <td className="sa-table-cell">
                    <div className="sa-agent-info">
                      <span className="sa-agent-name">{agent.agent || "N/A"}</span>
                      {agent.address && <span className="sa-agent-address">{agent.address.substring(0, 50)}...</span>}
                    </div>
                  </td>
                  <td className="sa-table-cell">
                    <span className="sa-type-badge">{agent.unitID || "N/A"}</span>
                  </td>
                  <td className="sa-table-cell">
                    <span className="sa-agent-email">{agent.email || "N/A"}</span>
                  </td>
                  <td className="sa-table-cell">
                    <span className="sa-agent-phone">{agent.phone1 || agent.phone2 || "N/A"}</span>
                  </td>
                  <td className="sa-table-cell">
                    <span className={`sa-status-badge ${agent.deleted === 1 ? "sa-inactive" : "sa-active"}`}>
                      {agent.deleted === 1 ? "Inactive" : "Active"}
                    </span>
                  </td>
                  <td className="sa-table-cell">
                    <span className="sa-credit-limit">{formatCurrency(agent.creditLimit)}</span>
                  </td>
                  <td className="sa-table-cell">
                    <div className="sa-action-buttons">
                      <button
                        onClick={() => handleViewAgent(agent)}
                        className="sa-action-btn sa-view-btn"
                        title="View Details"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditAgent(agent)}
                        className="sa-action-btn sa-edit-btn"
                        title="Edit Agent"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteAgent(agent.agentID)}
                        className="sa-action-btn sa-delete-btn"
                        title="Delete Agent"
                        disabled={loading?.deleteAgent}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              {totalRecords > 0 ? `${startIndex + 1} to ${endIndex} of ${totalRecords}` : "0 to 0 of 0"}
            </span>{" "}
            Agents
          </div>

          <Pagination className="pr-pagination-controls" role="navigation" aria-label="Pagination">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className="pr-pagination-prev"
                  onClick={() => handlePageChange(Math.max(1, pageNumber - 1))}
                  disabled={!pagination?.hasPreviousPage}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page >= Math.max(1, pageNumber - 2) &&
                    page <= Math.min(totalPages, pageNumber + 2),
                )
                .map((page) => (
                  <PaginationItem key={page} className="pr-pagination-item">
                    <PaginationLink
                      isActive={pageNumber === page}
                      onClick={() => handlePageChange(page)}
                      className="pr-pagination-link"
                      aria-current={pageNumber === page ? "page" : undefined}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

              <PaginationItem>
                <PaginationNext
                  className="pr-pagination-next"
                  onClick={() => handlePageChange(Math.min(totalPages, pageNumber + 1))}
                  disabled={!pagination?.hasNextPage}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Modals */}
      {showCreateAgentDialog && <CreateAgent />}
      {showEditAgentDialog && <EditAgent />}
      {showAgentDetailsDialog && <AgentDetails />}
    </div>
  )
}

export default Party