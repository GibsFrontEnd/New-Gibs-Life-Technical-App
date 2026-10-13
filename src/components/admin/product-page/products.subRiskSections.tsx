"use client"

import { useEffect, useState } from "react"
import { Button } from "../../UI/new-button"
import { useAppDispatch, useAppSelector } from "../../../hooks/use-apps"
import ConfirmationModal from "../../Modals/ConfirmationModal"
import {
  clearMessages,
  deleteSubRiskSection,
  getAllSubRiskSections,
  checkSubRiskSectionExists,
  selectSubRiskSections,
} from "../../../features/reducers/productReducers/subRiskSectionSlice"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../UI/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../UI/pagination"
import {
  selectUiState,
  setShowCreateSubRiskSectionDialog,
  setShowDeleteSubRiskSectionDialog,
  setShowEditSubRiskSectionDialog,
} from "../../../features/reducers/uiReducers/uiSlice"
import type { SubRiskSection } from "../../../types/subRiskSection"
import { CreateSubRiskSection, EditSubRiskSection } from "../../components.subRiskSections"
import "./ProductsSubRiskSections.css"

const ProductsSubRiskSections = () => {
  const dispatch = useAppDispatch()

  const { subRiskSections, success, loading, error, exists } = useAppSelector(selectSubRiskSections)
  const { showDeleteSubRiskSectionDialog } = useAppSelector(selectUiState)

  const [subRiskSectionToEdit, setSubRiskSectionToEdit] = useState<SubRiskSection | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Filter states
  const [sectionCodeFilter, setSectionCodeFilter] = useState("")
  const [subRiskIdFilter, setSubRiskIdFilter] = useState("")
  const [sectionNameFilter, setSectionNameFilter] = useState("")
  const [activeOnlyFilter, setActiveOnlyFilter] = useState(false)
  const [hasRatesFilter, setHasRatesFilter] = useState(false)
  const [hasField2Filter, setHasField2Filter] = useState(false)
  //@ts-ignore
  const filteredSubRiskSections = subRiskSections.filter((section) => {
    const matchesSearch =
      section.sectionCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.sectionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.subRiskID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.subRiskName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.field1?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSectionCode =
      !sectionCodeFilter || section.sectionCode?.toLowerCase().includes(sectionCodeFilter.toLowerCase())
    const matchesSubRiskId =
      !subRiskIdFilter || section.subRiskID?.toLowerCase().includes(subRiskIdFilter.toLowerCase())
    const matchesSectionName =
      !sectionNameFilter || section.sectionName?.toLowerCase().includes(sectionNameFilter.toLowerCase())
    const matchesActiveOnly = !activeOnlyFilter || section.active === 1
    const matchesHasRates =
      !hasRatesFilter || (section.rates !== null && section.rates !== undefined && section.rates > 0)
    const matchesHasField2 =
      !hasField2Filter || (section.field2 !== null && section.field2 !== undefined && section.field2.trim() !== "")

    return (
      matchesSearch &&
      matchesSectionCode &&
      matchesSubRiskId &&
      matchesSectionName &&
      matchesActiveOnly &&
      matchesHasRates &&
      matchesHasField2
    )
  })

  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 3
  const totalPages = Math.ceil(filteredSubRiskSections.length / rowsPerPage)

  const [sectionIdToDelete, setSectionIdToDelete] = useState<number | null>(null)
  const [sectionIdToCheck, setSectionIdToCheck] = useState<number | null>(null)

  const currentData = filteredSubRiskSections.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  // Statistics
  const totalRecords = subRiskSections.length
  //@ts-ignore
  const activeRecords = subRiskSections.filter((section) => section.active === 1).length
  const withRates = subRiskSections.filter(   //@ts-ignore
    (section) => section.rates !== null && section.rates !== undefined && section.rates > 0,
  ).length
  const withField2 = subRiskSections.filter(   //@ts-ignore
    (section) => section.field2 !== null && section.field2 !== undefined && section.field2.trim() !== "",
  ).length

  useEffect(() => {
    dispatch(getAllSubRiskSections())
  }, [dispatch])

  const handleRefresh = () => {
    dispatch(getAllSubRiskSections())
  }

  const handleApplyFilters = () => {
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setSectionCodeFilter("")
    setSubRiskIdFilter("")
    setSectionNameFilter("")
    setActiveOnlyFilter(false)
    setHasRatesFilter(false)
    setHasField2Filter(false)
    setCurrentPage(1)
  }

  const handleCheckExists = (sectionId: number) => {
    setSectionIdToCheck(sectionId)
    dispatch(checkSubRiskSectionExists(sectionId))
  }

  const confirmDeleteSubRiskSection = async (sectionId: number | null) => {
    if (!sectionId) {
      console.log("No Section Id")
      return
    }

    dispatch(deleteSubRiskSection(sectionId))

    if (success.deleteSubRiskSection) {
      dispatch(clearMessages())
      setSectionIdToDelete(null)
      dispatch(setShowDeleteSubRiskSectionDialog(false))
    } else if (error.deleteSubRiskSection) {
      console.log(error)
    }
  }

  if (error.getAllSubRiskSections) {
    console.error("Error fetching Sub Risk Sections:", error)
  }

  return (
    <div className="subrisk-sections-container">
      {/* Header Section */}
      <div className="subrisk-sections-header">
        <div className="subrisk-sections-header-content">
          <div className="subrisk-sections-title-section">
            <h1 className="subrisk-sections-title">SubRisk Sections Management</h1>
            <p className="subrisk-sections-subtitle">Manage your SubRisk Section records</p>
          </div>
          <div className="subrisk-sections-header-actions">
            <Button
              className="subrisk-sections-refresh-btn"
              onClick={handleRefresh}
                //@ts-ignore
              disabled={loading.getAllSubRiskSections}
            >
              {loading.getAllSubRiskSections ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              className="subrisk-sections-create-btn"
              onClick={() => dispatch(setShowCreateSubRiskSectionDialog(true))}
            >
              Create New
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="subrisk-sections-stats-grid">
        <div className="subrisk-sections-stat-card">
          <div className="subrisk-sections-stat-value">{totalRecords}</div>
          <div className="subrisk-sections-stat-label">Total Records</div>
        </div>
        <div className="subrisk-sections-stat-card">
          <div className="subrisk-sections-stat-value">{activeRecords}</div>
          <div className="subrisk-sections-stat-label">Active Records</div>
        </div>
        <div className="subrisk-sections-stat-card">
          <div className="subrisk-sections-stat-value">{withRates}</div>
          <div className="subrisk-sections-stat-label">With Rates</div>
        </div>
        <div className="subrisk-sections-stat-card">
          <div className="subrisk-sections-stat-value">{withField2}</div>
          <div className="subrisk-sections-stat-label">With Field2</div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="subrisk-sections-filters-section">
        <h3 className="subrisk-sections-filters-title">Filters</h3>
        <div className="subrisk-sections-filters-grid">
          <div className="subrisk-sections-filter-group">
            <label className="subrisk-sections-filter-label">Section Code</label>
            <input
              type="text"
              placeholder="Filter by Section Code"
              value={sectionCodeFilter}
              onChange={(e) => setSectionCodeFilter(e.target.value)}
              className="subrisk-sections-filter-input"
            />
          </div>
          <div className="subrisk-sections-filter-group">
            <label className="subrisk-sections-filter-label">SubRisk ID</label>
            <input
              type="text"
              placeholder="Filter by SubRisk ID"
              value={subRiskIdFilter}
              onChange={(e) => setSubRiskIdFilter(e.target.value)}
              className="subrisk-sections-filter-input"
            />
          </div>
          <div className="subrisk-sections-filter-group">
            <label className="subrisk-sections-filter-label">Section Name</label>
            <input
              type="text"
              placeholder="Filter by Section Name"
              value={sectionNameFilter}
              onChange={(e) => setSectionNameFilter(e.target.value)}
              className="subrisk-sections-filter-input"
            />
          </div>
        </div>

        <div className="subrisk-sections-checkbox-filters">
          <label className="subrisk-sections-checkbox-label">
            <input
              type="checkbox"
              checked={activeOnlyFilter}
              onChange={(e) => setActiveOnlyFilter(e.target.checked)}
              className="subrisk-sections-checkbox"
            />
            Active Only
          </label>
          <label className="subrisk-sections-checkbox-label">
            <input
              type="checkbox"
              checked={hasRatesFilter}
              onChange={(e) => setHasRatesFilter(e.target.checked)}
              className="subrisk-sections-checkbox"
            />
            Has Rates
          </label>
          <label className="subrisk-sections-checkbox-label">
            <input
              type="checkbox"
              checked={hasField2Filter}
              onChange={(e) => setHasField2Filter(e.target.checked)}
              className="subrisk-sections-checkbox"
            />
            Has Field2
          </label>
        </div>

        <div className="subrisk-sections-filter-actions">
          <Button className="subrisk-sections-apply-filters-btn" onClick={handleApplyFilters}>
            Apply Filters
          </Button>
          <Button className="subrisk-sections-clear-filters-btn" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <div className="subrisk-sections-search-section">
        <input
          type="text"
          placeholder="Search by section code, name, sub risk ID, sub risk name, or field..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="subrisk-sections-search-input"
        />
      </div>

      {/* Exists Indicator */}
      {exists !== null && sectionIdToCheck && (
        <div
          className={`subrisk-sections-exists-indicator ${exists ? "subrisk-sections-exists-true" : "subrisk-sections-exists-false"}`}
        >
          Section ID {sectionIdToCheck} {exists ? "exists" : "does not exist"}
        </div>
      )}

      {/* Table Section */}
      {loading.getAllSubRiskSections ||
      loading.getActiveSubRiskSections ||
      loading.getSubRiskSectionsBySectionCode ||
      loading.getSubRiskSectionsBySubRisk ? (
        <div className="subrisk-sections-loading-container">
          <div className="subrisk-sections-loading-spinner"></div>
          <span>Loading sub risk sections...</span>
        </div>
      ) : (
        <div className="subrisk-sections-table-container">
          <Table className="subrisk-sections-table">
            <TableHeader>
              <TableRow className="subrisk-sections-table-header-row">
                <TableHead className="subrisk-sections-table-header">S/N</TableHead>
                <TableHead className="subrisk-sections-table-header">Section ID</TableHead>
                <TableHead className="subrisk-sections-table-header">Section Code</TableHead>
                <TableHead className="subrisk-sections-table-header">Sub Risk ID</TableHead>
                <TableHead className="subrisk-sections-table-header">Section Name</TableHead>
                <TableHead className="subrisk-sections-table-header">Sub Risk Name</TableHead>
                <TableHead className="subrisk-sections-table-header">Field1</TableHead>
                <TableHead className="subrisk-sections-table-header">Field2</TableHead>
                <TableHead className="subrisk-sections-table-header">Rates</TableHead>
                <TableHead className="subrisk-sections-table-header">A1-A5</TableHead>
                <TableHead className="subrisk-sections-table-header">Active</TableHead>
                <TableHead className="subrisk-sections-table-header">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="subrisk-sections-table-body">
              {currentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="subrisk-sections-no-data-cell">
                    No sub risk sections found
                  </TableCell>
                </TableRow>
              ) : (
                  //@ts-ignore
                currentData.map((section, index) => (
                  <TableRow key={section.sectionID} className="subrisk-sections-table-row">
                    <TableCell className="subrisk-sections-table-cell">
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="subrisk-sections-table-cell subrisk-sections-section-id-cell">
                      {section.sectionID}
                    </TableCell>
                    <TableCell className="subrisk-sections-table-cell subrisk-sections-section-code-cell">
                      {section.sectionCode}
                    </TableCell>
                    <TableCell className="subrisk-sections-table-cell subrisk-sections-sub-risk-id-cell">
                      {section.subRiskID}
                    </TableCell>
                    <TableCell className="subrisk-sections-table-cell subrisk-sections-section-name-cell">
                      {section.sectionName}
                    </TableCell>
                    <TableCell className="subrisk-sections-table-cell subrisk-sections-sub-risk-name-cell">
                      {section.subRiskName}
                    </TableCell>
                    <TableCell className="subrisk-sections-table-cell subrisk-sections-field-cell">
                      {section.field1}
                    </TableCell>
                    <TableCell className="subrisk-sections-table-cell subrisk-sections-field-cell">
                      {section.field2 || "-"}
                    </TableCell>
                    <TableCell className="subrisk-sections-table-cell subrisk-sections-rates-cell">
                      {section.rates ?? "-"}
                    </TableCell>
                    <TableCell className="subrisk-sections-table-cell subrisk-sections-a-values-cell">
                      <div className="subrisk-sections-a-values-grid">
                        <span>A1: {section.a1 ?? "-"}</span>
                        <span>A2: {section.a2 ?? "-"}</span>
                        <span>A3: {section.a3 ?? "-"}</span>
                        <span>A4: {section.a4 ?? "-"}</span>
                        <span>A5: {section.a5 ?? "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="subrisk-sections-table-cell subrisk-sections-active-cell">
                      <span
                        className={`subrisk-sections-status-badge ${section.active === 1 ? "subrisk-sections-active" : "subrisk-sections-inactive"}`}
                      >
                        {section.active === 1 ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="subrisk-sections-table-cell subrisk-sections-actions-cell">
                      <Button
                        className="subrisk-sections-check-btn"
                        onClick={() => handleCheckExists(section.sectionID)}
                      >
                        Check
                      </Button>
                      <Button
                        className="subrisk-sections-edit-btn"
                        onClick={() => {
                          setSubRiskSectionToEdit(section)
                          dispatch(setShowEditSubRiskSectionDialog(true))
                        }}
                      >
                        Edit
                      </Button>
                      <Button   //@ts-ignore
                        variant="destructive"
                        className="subrisk-sections-delete-btn"
                        onClick={() => {
                          setSectionIdToDelete(section.sectionID)
                          dispatch(setShowDeleteSubRiskSectionDialog(true))
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="pr-pagination-container">
  <div className="pr-pagination-info">
    Showing{" "}
    <span className="pr-pagination-numbers">
      {filteredSubRiskSections.length > 0
        ? `${(currentPage - 1) * rowsPerPage + 1} to ${Math.min(
            currentPage * rowsPerPage,
            filteredSubRiskSections.length,
          )} of ${filteredSubRiskSections.length}`
        : "0 to 0 of 0"}
    </span>{" "}
    Sub Risk Sections
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

      <CreateSubRiskSection />
      <EditSubRiskSection subRiskSection={subRiskSectionToEdit} />

      {showDeleteSubRiskSectionDialog && (
        <ConfirmationModal
          title="Delete Sub Risk Section"
          message="Are you sure you want to delete this sub risk section? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => confirmDeleteSubRiskSection(sectionIdToDelete)}
          onCancel={() => dispatch(setShowDeleteSubRiskSectionDialog(false))}
          isLoading={loading.deleteSubRiskSection}
        />
      )}
    </div>
  )
}

export default ProductsSubRiskSections
