"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "../../UI/new-button"
import { useAppDispatch, useAppSelector } from "../../../hooks/use-apps"
import ConfirmationModal from "../../Modals/ConfirmationModal"
import SearchBar from "../../SearchBar"
import { clearMessages, deleteRisk, getAllRisks, selectRisks } from "../../../features/reducers/adminReducers/riskSlice"
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
  setShowCreateRiskDialog,
  setShowDeleteRiskDialog,
  setShowEditRiskDialog,
} from "../../../features/reducers/uiReducers/uiSlice"
import type { Risk } from "../../../types/risk"
import { CreateRisk, EditRisk } from "../../components.risks"
import "./ProductsRisks.css"

const ProductsRisks = () => {
  const dispatch = useAppDispatch()
  const reduxRisksState = useAppSelector(selectRisks)
  const { showDeleteRiskDialog } = useAppSelector(selectUiState)

  // UI state
  const [riskToEdit, setRiskToEdit] = useState<Risk | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // paging config
  const rowsPerPage = 5
  const chunkSize = 50 // fetch 50 items per server request
  const prefetchThreshold = rowsPerPage * 2 // when within this many items from end, prefetch next chunk

  // local cached risks (concatenate chunks here)
  const [cachedRisks, setCachedRisks] = useState<Risk[]>([])
  const [serverPage, setServerPage] = useState(1) // next page to fetch (1-based)
  const [isFetchingChunk, setIsFetchingChunk] = useState(false)
  const [hasMoreChunks, setHasMoreChunks] = useState(true)
  const mountedRef = useRef(false)

  // store deletion target
  const [riskIdToDelete, setRiskIdToDelete] = useState<string | null>(null)

  // Keep derived redux flags
  const loading = reduxRisksState?.loading ?? {}
  const success = reduxRisksState?.success ?? {}
  const error = reduxRisksState?.error ?? {}

  /**
   * Fetch one chunk from server (pageNumber). Returns number of NEW items appended (0..chunkSize).
   * We dedupe by riskID to avoid duplicates.
   */
  const fetchChunk = async (pageNumber: number): Promise<number> => {
    if (isFetchingChunk || !hasMoreChunks) return 0
    setIsFetchingChunk(true)
    try {
      const resAction = await dispatch(
        // thunk accepts { pageNumber, pageSize }
        // @ts-ignore allow different arg shape
        getAllRisks({ pageNumber, pageSize: chunkSize }),
      )
      const payload: Risk[] = (resAction && (resAction as any).payload) || []
      if (Array.isArray(payload)) {
        let addedCount = 0
        setCachedRisks((prev) => {
          const existingIds = new Set(prev.map((r) => r.riskID))
          const newOnes = payload.filter((r) => !existingIds.has(r.riskID))
          addedCount = newOnes.length
          return prev.concat(newOnes)
        })
        if (payload.length < chunkSize) {
          setHasMoreChunks(false)
        } else {
          setHasMoreChunks(true)
        }
        setServerPage(pageNumber + 1)
        return addedCount
      } else {
        setHasMoreChunks(false)
        return 0
      }
    } catch (err) {
      console.error("Failed to fetch risk chunk:", err)
      return 0
    } finally {
      setIsFetchingChunk(false)
    }
  }

  // initial fetch on mount
  useEffect(() => {
    mountedRef.current = true
    setCachedRisks([])
    setServerPage(1)
    setHasMoreChunks(true)
    // fetch first chunk
    fetchChunk(1)
    return () => {
      mountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  // derived filtered list (search is client-side across cachedRisks)
  const filteredRisks = cachedRisks.filter(
    (risk) =>
      (risk.riskID ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (risk.riskName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (risk.description ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.max(1, Math.ceil(filteredRisks.length / rowsPerPage))
  const currentData = filteredRisks.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  // clamp current page if filtering reduces total pages
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
    if (currentPage < 1) setCurrentPage(1)
  }, [currentPage, totalPages])

  // prefetch next chunk when user navigates near the end of cachedRisks
  useEffect(() => {
    const neededIndex = currentPage * rowsPerPage
    if (hasMoreChunks && !isFetchingChunk && cachedRisks.length - neededIndex <= prefetchThreshold) {
      fetchChunk(serverPage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, cachedRisks.length, hasMoreChunks, isFetchingChunk, serverPage])

  // seed cache from redux (edge case)
  useEffect(() => {
    if (cachedRisks.length === 0 && Array.isArray(reduxRisksState?.risks) && reduxRisksState.risks.length > 0) {
      setCachedRisks(reduxRisksState.risks)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduxRisksState?.risks])

  // delete handler (dispatch only)
  const confirmDeleteRisk = async (riskId: string | null) => {
    if (!riskId) {
      console.log("No Risk Id")
      return
    }
    dispatch(deleteRisk(riskId))
  }

  // sync local cache when a delete succeeded
  useEffect(() => {
    if (success.deleteRisk) {
      if (Array.isArray(reduxRisksState?.risks) && reduxRisksState.risks.length > 0) {
        setCachedRisks(reduxRisksState.risks)
      } else {
        // best-effort: remove the deleted id if we know it
        setCachedRisks((prev) => prev.filter((r) => r.riskID !== riskIdToDelete))
      }
      dispatch(clearMessages())
      setRiskIdToDelete(null)
      dispatch(setShowDeleteRiskDialog(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success.deleteRisk])

  if (error.getAllRisks) {
    console.error("Error fetching Risks:", error.getAllRisks ?? error.getAllRisks)
  }

  // When user requests a page, ensure we have enough cached items for it.
  // If not, fetch chunks until we either have enough or there are no more chunks.
  const handleSetPage = async (page: number) => {
    const normalizedPage = Math.max(1, Math.min(page, Math.max(1, totalPages)))
    const neededItems = normalizedPage * rowsPerPage

    // If we already have enough items (or there are no more server chunks), set page immediately.
    if (filteredRisks.length >= neededItems || !hasMoreChunks) {
      setCurrentPage(normalizedPage)
      return
    }

    // Need to fetch chunks until we have enough or server reports no more.
    // Loop to support multiple chunk fetches if necessary.
    while (filteredRisks.length < neededItems && hasMoreChunks) {
      const added = await fetchChunk(serverPage)
      // if nothing added, break to avoid infinite loop
      if (!added) break
      // note: filteredRisks will update after state set; recompute length from latest cachedRisks
      // but since we're in async function, read cachedRisks directly
      // (small delay possible — but loop will attempt again if still short)
    }

    // recompute available pages based on newly cached items
    const newTotalPages = Math.max(1, Math.ceil(filteredRisks.length / rowsPerPage))
    setCurrentPage(Math.min(normalizedPage, newTotalPages))
  }

  // pagination page numbers generator (5-window, first/last + ellipses)
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
        <PaginationItem key={`el-${idx}`} className="pr-pagination-item">
          <span style={{ padding: "0 .5rem" }}>…</span>
        </PaginationItem>
      ) : (
        <PaginationItem key={p} className="pr-pagination-item">
          <PaginationLink isActive={currentPage === p} onClick={() => void handleSetPage(p)}>
            {p}
          </PaginationLink>
        </PaginationItem>
      ),
    )
  }

  // start index for current page (used for S/N)
  const startIndex = (currentPage - 1) * rowsPerPage

  return (
    <div className="pr-risks-container">
      <div className="pr-risks-header">
        <SearchBar placeholder="Search by ID, name, or description..." value={searchTerm} onChange={setSearchTerm} />
        <Button className="pr-add-risk-btn" onClick={() => dispatch(setShowCreateRiskDialog(true))}>
          Add New Risk
        </Button>
      </div>

      {isFetchingChunk && cachedRisks.length === 0 ? (
        <div className="pr-loading-container">Loading...</div>
      ) : (
        <div className="pr-table-container">
          <Table className="pr-risks-table">
            <TableHeader>
              <TableRow >
                <TableHead className="pr-table-header">S/N</TableHead>
                <TableHead className="pr-table-header">Risk ID</TableHead>
                <TableHead className="pr-table-header">Risk Name</TableHead>
                <TableHead className="pr-table-header">Description</TableHead>
                <TableHead className="pr-table-header">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="pr-table-body">
              {currentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="pr-no-data-cell">
                    No risks found
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((risk, idx) => (
                  <TableRow key={risk.riskID+idx}>
                    {/* S/N now computed from the filtered list's startIndex to ensure stable numbering */}
                    <TableCell>{startIndex + idx + 1}</TableCell>

                    <TableCell className="pr-risk-id-cell">{risk.riskID}</TableCell>
                    <TableCell className="pr-risk-name-cell">{risk.riskName}</TableCell>
                    <TableCell className="pr-description-cell">{risk.description || "-"}</TableCell>
                    <TableCell className="pr-actions-cell">
                      <Button
                        className="pr-edit-btn"
                        onClick={() => {
                          setRiskToEdit(risk)
                          dispatch(setShowEditRiskDialog(true))
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        //@ts-ignore
                        variant="destructive"
                        className="pr-delete-btn"
                        onClick={() => {
                          setRiskIdToDelete(risk.riskID)
                          dispatch(setShowDeleteRiskDialog(true))
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

          <div className="pr-pagination-container">
            <div className="pr-pagination-info">
              Showing{" "}
              <span className="pr-pagination-numbers">
                {filteredRisks.length > 0
                  ? `${startIndex + 1} to ${Math.min(startIndex + currentData.length, filteredRisks.length)} of ${filteredRisks.length}`
                  : "0 to 0 of 0"}
              </span>{" "}
              Risks
            </div>

            <Pagination className="pr-pagination-controls">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    className="pr-pagination-prev"
                    onClick={() => void handleSetPage(Math.max(1, currentPage - 1))}
                  />
                </PaginationItem>

                {renderPageNumbers()}

                <PaginationItem>
                  <PaginationNext
                    className="pr-pagination-next"
                    onClick={() => void handleSetPage(Math.min(totalPages, currentPage + 1))}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}

      <CreateRisk />
      <EditRisk risk={riskToEdit} />

      {showDeleteRiskDialog && (
        <ConfirmationModal
          title="Delete Risk"
          message="Are you sure you want to delete this risk? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => confirmDeleteRisk(riskIdToDelete)}
          onCancel={() => {
            setRiskIdToDelete(null)
            dispatch(setShowDeleteRiskDialog(false))
          }}
          isLoading={Boolean(loading.deleteRisk)}
        />
      )}
    </div>
  )
}

export default ProductsRisks
