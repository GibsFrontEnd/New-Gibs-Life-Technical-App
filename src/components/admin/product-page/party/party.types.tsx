
//@ts-nocheck
"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "../../../UI/new-button"
import { useAppDispatch, useAppSelector } from "../../../../hooks/use-apps"
import ConfirmationModal from "../../../Modals/ConfirmationModal"
import SearchBar from "../../../SearchBar"
import {
  clearMessages,
  deletePartyType,
  getAllPartyTypes,
  selectPartyTypes,
} from "../../../../features/reducers/adminReducers/partyTypeSlice"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../UI/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../../UI/pagination"
import {
  selectUiState,
  setShowCreatePartyTypeDialog,
  setShowDeletePartyTypeDialog,
  setShowEditPartyTypeDialog,
} from "../../../../features/reducers/uiReducers/uiSlice"
import type { PartyType } from "../../../../types/partyType"
import { CreatePartyType, EditPartyType } from "../../../components.partyTypes"
import "./SecurityPartyTypes.css"

const ITEMS_PER_PAGE = 5
const SEARCH_DEBOUNCE_MS = 300

const SecurityPartyTypes = () => {
  const dispatch = useAppDispatch()
  const { partyTypes, success, loading, error } = useAppSelector(selectPartyTypes)
  const { showDeletePartyTypeDialog } = useAppSelector(selectUiState)

  const [partyTypeToEdit, setPartyTypeToEdit] = useState<PartyType | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const debounceRef = useRef<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [partyTypeIdToDelete, setPartyTypeIdToDelete] = useState<string | null>(null)

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
  }, [debouncedSearch])

  // Load party types on component mount
  useEffect(() => {
    dispatch(getAllPartyTypes())
  }, [dispatch])

  // Filter party types based on search
  const filteredPartyTypes = partyTypes.filter((partyType) => {
    if (!debouncedSearch) return true
    const searchLower = debouncedSearch.toLowerCase()
    return (
      partyType.typeID.toLowerCase().includes(searchLower) ||
      partyType.code.toLowerCase().includes(searchLower) ||
      partyType.name.toLowerCase().includes(searchLower) ||
      partyType.groupName.toLowerCase().includes(searchLower) ||
      partyType.tag.toLowerCase().includes(searchLower)
    )
  })

  // Pagination
  const totalItems = filteredPartyTypes.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentData = filteredPartyTypes.slice(startIndex, endIndex)

  const confirmDeletePartyType = async (typeID: string | null) => {
    if (!typeID) {
      console.log("No Party Type ID")
      return
    }
    dispatch(deletePartyType(typeID))
    if (success.deletePartyType) {
      dispatch(clearMessages())
      setPartyTypeIdToDelete(null)
      dispatch(setShowDeletePartyTypeDialog(false))
    } else if (error.deletePartyType) {
      console.log(error)
    }
  }

  const getTagBadge = (tag: string) => {
    const tagColors: Record<string, string> = {
      A: "spt-tag-agent",
      B: "spt-tag-business",
      C: "spt-tag-client",
    }

    const tagLabels: Record<string, string> = {
      A: "Agent",
      B: "Business",
      C: "Client",
    }

    return <span className={`spt-tag-badge ${tagColors[tag] || "spt-tag-default"}`}>{tagLabels[tag] || tag}</span>
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
        <PaginationItem key={`el-${idx}`} className="spt-pagination-item">
          <span style={{ padding: "0 .5rem" }}>…</span>
        </PaginationItem>
      ) : (
        <PaginationItem key={p} className="spt-pagination-item">
          <PaginationLink isActive={currentPage === p} onClick={() => setCurrentPage(p)}>
            {p}
          </PaginationLink>
        </PaginationItem>
      ),
    )
  }

  return (
    <div className="spt-party-types-container">
      <div className="spt-party-types-header">
        <div className="spt-header-section">
          <h1 className="spt-page-title">Party Types Management</h1>
          <p className="spt-page-subtitle">Manage party types and their classifications</p>
        </div>

        <div className="spt-stats-cards">
          <div className="spt-stat-card">
            <div className="spt-stat-number">{partyTypes.length}</div>
            <div className="spt-stat-label">Total Party Types</div>
          </div>
          <div className="spt-stat-card">
            <div className="spt-stat-number">{partyTypes.filter((pt) => pt.tag === "A").length}</div>
            <div className="spt-stat-label">Agent Types</div>
          </div>
          <div className="spt-stat-card">
            <div className="spt-stat-number">{partyTypes.filter((pt) => pt.tag === "C").length}</div>
            <div className="spt-stat-label">Client Types</div>
          </div>
        </div>
      </div>

      <div className="spt-controls-section">
        <div className="spt-search-section">
          <SearchBar
            placeholder="Search by type ID, code, name, group, or tag..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="spt-search-bar"
          />
        </div>

        <Button className="spt-add-party-type-btn" onClick={() => dispatch(setShowCreatePartyTypeDialog(true))}>
          Add New Party Type
        </Button>
      </div>

      {loading.getAllPartyTypes ? (
        <div className="spt-loading-container">
          <div className="spt-loading-spinner"></div>
          <p>Loading party types...</p>
        </div>
      ) : (
        <div className="spt-table-container">
          <Table className="spt-party-types-table">
            <TableHeader>
              <TableRow className="spt-table-header-row">
                <TableHead className="spt-table-head">S/N</TableHead>
                <TableHead className="spt-table-head">Type ID</TableHead>
                <TableHead className="spt-table-head">Code</TableHead>
                <TableHead className="spt-table-head">Name</TableHead>
                <TableHead className="spt-table-head">Group</TableHead>
                <TableHead className="spt-table-head">Tag</TableHead>
                <TableHead className="spt-table-head">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="spt-table-body">
              {currentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="spt-no-data-cell">
                    {debouncedSearch ? "No party types found matching your search" : "No party types found"}
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((partyType, index) => {
                  const globalIndex = startIndex + index
                  return (
                    <TableRow key={partyType.typeID} className="spt-table-row">
                      <TableCell className="spt-table-cell">{globalIndex + 1}</TableCell>
                      <TableCell className="spt-table-cell">
                        <span className="spt-type-id">{partyType.typeID}</span>
                      </TableCell>
                      <TableCell className="spt-table-cell">
                        <span className="spt-code">{partyType.code}</span>
                      </TableCell>
                      <TableCell className="spt-table-cell">
                        <div className="spt-name-cell">
                          <span className="spt-name">{partyType.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="spt-table-cell">
                        <div className="spt-group-cell">
                          <span className="spt-group-name">{partyType.groupName}</span>
                          <span className="spt-group-id">ID: {partyType.groupID}</span>
                        </div>
                      </TableCell>
                      <TableCell className="spt-table-cell">{getTagBadge(partyType.tag)}</TableCell>
                      <TableCell className="spt-table-cell">
                        <div className="spt-actions-cell">
                          <Button
                            className="spt-edit-btn"
                            onClick={() => {
                              setPartyTypeToEdit(partyType)
                              dispatch(setShowEditPartyTypeDialog(true))
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            className="spt-delete-btn"
                            onClick={() => {
                              setPartyTypeIdToDelete(partyType.typeID)
                              dispatch(setShowDeletePartyTypeDialog(true))
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          <div className="spt-pagination-container">
            <div className="spt-pagination-info">
              Showing{" "}
              <span className="spt-pagination-numbers">
                {totalItems > 0
                  ? `${startIndex + 1} to ${Math.min(endIndex, totalItems)} of ${totalItems}`
                  : "0 to 0 of 0"}
              </span>{" "}
              Party Types
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

      <CreatePartyType />
      <EditPartyType partyType={partyTypeToEdit} />

      {showDeletePartyTypeDialog && (
        <ConfirmationModal
          title="Delete Party Type"
          message="Are you sure you want to delete this party type? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => confirmDeletePartyType(partyTypeIdToDelete)}
          onCancel={() => dispatch(setShowDeletePartyTypeDialog(false))}
          isLoading={loading.deletePartyType}
        />
      )}
    </div>
  )
}

export default SecurityPartyTypes
