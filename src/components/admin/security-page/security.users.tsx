"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Button } from "../../UI/new-button"
import { useAppDispatch, useAppSelector } from "../../../hooks/use-apps"
import ConfirmationModal from "../../Modals/ConfirmationModal"
import SearchBar from "../../SearchBar"
import { clearMessages, deleteUser, getAllUsers, selectUsers } from "../../../features/reducers/adminReducers/userSlice"
import { getAllRoles, selectRoles } from "../../../features/reducers/adminReducers/roleSlice"
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
  setShowCreateUserDialog,
  setShowDeleteUserDialog,
  setShowEditUserDialog,
  setShowChangePasswordDialog,
} from "../../../features/reducers/uiReducers/uiSlice"
import type { User } from "../../../types/user"
import { CreateUser, EditUser, ChangePassword, AssignRole, RemoveRole } from "../../components.users"
import "./SecurityUsers.css"

const FETCH_CHUNK_SIZE = 50
const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300
const PREFETCH_THRESHOLD_PAGES_FROM_END = 2

const SecurityUsers = () => {
  const dispatch = useAppDispatch()
  const { users: storeUsers, totalUsers: totalUsersFromStore, success, loading, error } = useAppSelector(selectUsers)
  const { roles } = useAppSelector(selectRoles)
  const { showDeleteUserDialog } = useAppSelector(selectUiState)

  // Add toast state here
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  })

  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [userToChangePassword, setUserToChangePassword] = useState<User | null>(null)
  const [userToAssignRole, setUserToAssignRole] = useState<User | null>(null)
  const [userToRemoveRole, setUserToRemoveRole] = useState<User | null>(null)
  const [showAssignRoleDialog, setShowAssignRoleDialog] = useState(false)
  const [showRemoveRoleDialog, setShowRemoveRoleDialog] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const debounceRef = useRef<number | null>(null)

  const [currentPage, setCurrentPage] = useState(1)

  // cache for normal listing
  const [cachedUsers, setCachedUsers] = useState<(User | undefined)[]>([])
  const fetchedChunksRef = useRef<Set<number>>(new Set())
  const [isFetchingChunk, setIsFetchingChunk] = useState(false)

  // search mode
  const [isSearching, setIsSearching] = useState(false)
  const [searchPageCache, setSearchPageCache] = useState<Record<number, User[]>>({})
  const [searchTotal, setSearchTotal] = useState<number>(0)
  const [isFetchingSearchPage, setIsFetchingSearchPage] = useState(false)

  const pageSize = PAGE_SIZE
  const pagesPerChunk = Math.ceil(FETCH_CHUNK_SIZE / pageSize)

  // derive totalUsers from mode
  const totalUsers = isSearching
    ? searchTotal
    : typeof totalUsersFromStore === "number"
      ? totalUsersFromStore
      : cachedUsers.filter(Boolean).length
  const totalPages = Math.max(1, Math.ceil((totalUsers || 0) / pageSize))

  // Add toast effects here
  useEffect(() => {
    if (success.updateUser) {
      setToast({
        show: true,
        message: 'User updated successfully!',
        type: 'success'
      })
      dispatch(clearMessages())
      
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }))
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [success.updateUser, dispatch])

  useEffect(() => {
    if (success.createUser) {
      setToast({
        show: true,
        message: 'User created successfully!',
        type: 'success'
      })
      dispatch(clearMessages())
      
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }))
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [success.createUser, dispatch])

  useEffect(() => {
    if (success.deleteUser) {
      setToast({
        show: true,
        message: 'User deleted successfully!',
        type: 'success'
      })
      dispatch(clearMessages())
      
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }))
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [success.deleteUser, dispatch])

  // Add error handling too
  useEffect(() => {
    if (error.updateUser || error.createUser || error.deleteUser) {
      const errorMessage = error.updateUser || error.createUser || error.deleteUser
      setToast({
        show: true,
        message: errorMessage || 'An error occurred',
        type: 'error'
      })
      
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }))
        dispatch(clearMessages())
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [error.updateUser, error.createUser, error.deleteUser, dispatch])

  // Load roles on component mount
  useEffect(() => {
    dispatch(getAllRoles())
  }, [dispatch])

  /* ------------------- Utilities ------------------- */
  const extractPayloadUsers = (payload: any): { users: User[]; total?: number } => {
    if (!payload) return { users: [], total: undefined }
    if (Array.isArray(payload)) return { users: payload, total: undefined }
    if (Array.isArray(payload.users))
      return {
        users: payload.users,
        total: payload.totalUsers ?? payload.total,
      }
    if (Array.isArray(payload.data))
      return {
        users: payload.data,
        total: payload.totalUsers ?? payload.total,
      }
    // shape might be { result: { rows: [], count: n } } or similar - try some common fallbacks:
    if (Array.isArray(payload.result?.rows))
      return {
        users: payload.result.rows,
        total: payload.result.count ?? payload.totalUsers ?? payload.total,
      }
    if (Array.isArray(payload.items)) return { users: payload.items, total: payload.total }
    return { users: [], total: undefined }
  }

  /* ------------------- Seed cached from store if present ------------------- */
  useEffect(() => {
    if (Array.isArray(storeUsers) && storeUsers.length > 0 && cachedUsers.length === 0) {
      const copy: (User | undefined)[] = []
      for (let i = 0; i < storeUsers.length; i++) copy[i] = storeUsers[i]
      setCachedUsers(copy)
      fetchedChunksRef.current.add(1)
      if (typeof totalUsersFromStore === "number") {
        setSearchTotal(totalUsersFromStore)
      }
      console.debug("SecurityUsers: seeded cache from storeUsers", {
        seedCount: storeUsers.length,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeUsers])

  /* ------------------- Debounce search input ------------------- */
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), SEARCH_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [searchTerm])

  useEffect(() => {
    if (debouncedSearch.length > 0) {
      setIsSearching(true)
      setSearchPageCache({})
      setCurrentPage(1)
    } else {
      setIsSearching(false)
      setSearchPageCache({})
      setSearchTotal(typeof totalUsersFromStore === "number" ? totalUsersFromStore : 0)
      setCurrentPage(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  /* ------------------- Chunk fetch for listing ------------------- */
  const ensureChunkForPage = useCallback(
    async (page: number) => {
      const pageIndex0 = Math.max(0, page - 1)
      const chunkNumber = Math.floor(pageIndex0 / pagesPerChunk) + 1

      if (fetchedChunksRef.current.has(chunkNumber) || isFetchingChunk) return

      setIsFetchingChunk(true)
      try {
        const action = await dispatch(getAllUsers({ page: chunkNumber, pageSize: FETCH_CHUNK_SIZE }))
        const payload = (action as any)?.payload ?? action
        const { users: fetchedUsers, total } = extractPayloadUsers(payload)

        console.debug("ensureChunkForPage payload", {
          chunkNumber,
          fetchedUsersLength: fetchedUsers.length,
          total,
          payload,
        })

        if (fetchedUsers.length === 0 && typeof total === "number" && total === 0) {
          setCachedUsers([])
          fetchedChunksRef.current.add(chunkNumber)
          setSearchTotal(0)
          return
        }

        setCachedUsers((prev) => {
          const baseIndex = (chunkNumber - 1) * FETCH_CHUNK_SIZE
          const copy = prev.slice()
          const needed = baseIndex + fetchedUsers.length
          if (copy.length < needed) copy.length = needed
          for (let i = 0; i < fetchedUsers.length; i++) {
            copy[baseIndex + i] = fetchedUsers[i]
          }
          return copy
        })

        fetchedChunksRef.current.add(chunkNumber)
        if (typeof total === "number") setSearchTotal(total)
      } catch (err) {
        console.error("Error fetching chunk:", err)
      } finally {
        setIsFetchingChunk(false)
      }
    },
    [dispatch, isFetchingChunk, pagesPerChunk],
  )

  /* ------------------- Fetch search page (server-side) ------------------- */
  const fetchSearchPage = useCallback(
    async (page: number) => {
      if (isFetchingSearchPage) return
      setIsFetchingSearchPage(true)
      try {
        const action = await dispatch(getAllUsers({ page, pageSize }))
        const payload = (action as any)?.payload ?? action
        const { users: fetchedUsers } = extractPayloadUsers(payload)
        
        // Client-side filtering
        const filteredUsers = fetchedUsers.filter(user => 
          user.username?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          user.firstName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          user.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
        
        setSearchPageCache((prev) => ({ ...prev, [page]: filteredUsers }))
        setSearchTotal(filteredUsers.length) // Note: This will be per page, not total
      } catch (err) {
        console.error("Error fetching search page:", err)
      } finally {
        setIsFetchingSearchPage(false)
      }
    },
    [debouncedSearch, dispatch, isFetchingSearchPage, pageSize],
  )

  /* ------------------- initial load ------------------- */
  useEffect(() => {
    if (!isSearching) {
      ensureChunkForPage(1)
      if (typeof totalUsersFromStore === "number" && totalUsersFromStore > 0) setSearchTotal(totalUsersFromStore)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ensureChunkForPage, isSearching])

  /* ------------------- page change triggers fetches & prefetch ------------------- */
  useEffect(() => {
    if (isSearching) {
      if (!searchPageCache[currentPage]) fetchSearchPage(currentPage)
    } else {
      ensureChunkForPage(currentPage)

      const pageIndex0 = Math.max(0, currentPage - 1)
      const currentChunk = Math.floor(pageIndex0 / pagesPerChunk) + 1
      const posInChunk = pageIndex0 % pagesPerChunk

      if (posInChunk >= pagesPerChunk - PREFETCH_THRESHOLD_PAGES_FROM_END) {
        ensureChunkForPage(currentChunk * pagesPerChunk + 1)
      }
      if (posInChunk >= pagesPerChunk - 1) {
        ensureChunkForPage((currentChunk + 1) * pagesPerChunk + 1)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, isSearching, fetchSearchPage, ensureChunkForPage])

  /* ------------------- build currentData ------------------- */
  const getCurrentPageData = (): (User | null)[] => {
    if (isSearching) {
      const pageData = searchPageCache[currentPage] ?? []
      return Array.from({ length: pageSize }, (_, i) => pageData[i] ?? null)
    }
    const startIndex = (currentPage - 1) * pageSize
    const pageSlice = cachedUsers.slice(startIndex, startIndex + pageSize)
    return Array.from({ length: pageSize }, (_, i) => pageSlice[i] ?? null)
  }

  const currentData = getCurrentPageData()
  // @ts-ignore
  const anyMissing = currentData.some((d) => d == null)

  const [userIdToDelete, setUserIdToDelete] = useState<number | null | undefined>(null)
  const confirmDeleteUser = async (userId: number | null | undefined) => {
    if (userId === null) {
      console.log("No User Id")
      return
    }
    dispatch(deleteUser(userId!))
    if (success.deleteUser) {
      dispatch(clearMessages())
      setUserIdToDelete(null)
      dispatch(setShowDeleteUserDialog(false))
    } else if (error.deleteUser) {
      console.log(error)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusBadge = (active: number | boolean) => {
    const isActive = active === 1 || active === true
    return (
      <span className={`su-status-badge ${isActive ? "su-active" : "su-inactive"}`}>
        {isActive ? "Active" : "Inactive"}
      </span>
    )
  }

  // Get user roles display
  const getUserRoles = (user: User) => {
    const roles = user.roles || user.userRoles || []
    if (!roles || roles.length === 0) return "No roles assigned"
    return roles.map((role) => role.roleName || role.name || `Role ${role.roleId || role.id}`).join(", ")
  }

  /* ------------------- pagination UI (5 window + ellipses) ------------------- */
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
        <PaginationItem key={`el-${idx}`} className="sp-pagination-item">
          <span style={{ padding: "0 .5rem" }}>…</span>
        </PaginationItem>
      ) : (
        <PaginationItem key={p} className="sp-pagination-item">
          <PaginationLink isActive={currentPage === p} onClick={() => setCurrentPage(p)}>
            {p}
          </PaginationLink>
        </PaginationItem>
      ),
    )
  }

  /* ------------------- render ------------------- */
  // compute "showLoading" more robustly:
  const showInitialLoading = !isSearching && cachedUsers.filter(Boolean).length === 0 && isFetchingChunk
  const showSearchInitialLoading = isSearching && Object.keys(searchPageCache).length === 0 && isFetchingSearchPage

  /* ------------------- Compact ActionsMenu Component ------------------- */
  const ActionsMenu = ({
    //@ts-ignore
    user,
    onEdit,
    onPassword,
    onAssignRole,
    onRemoveRole,
    onDelete,
  }: {
    user: User
    onEdit: () => void
    onPassword: () => void
    onAssignRole: () => void
    onRemoveRole: () => void
    onDelete: () => void
  }) => {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
      const onDocClick = (e: MouseEvent) => {
        if (!ref.current) return
        if (!ref.current.contains(e.target as Node)) setOpen(false)
      }
      document.addEventListener("click", onDocClick)
      return () => document.removeEventListener("click", onDocClick)
    }, [])

    return (
      <div className="su-actions-menu" ref={ref}>
        <div className="su-main-actions">
          <Button className="su-edit-btn" onClick={onEdit}>Edit</Button>
          <Button variant="destructive" className="su-delete-btn" onClick={onDelete}>Delete</Button>
        </div>

        <div className="su-overflow-wrapper">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((s) => !s)}
            className="su-overflow-btn"
            title="More actions"
          >
            •••
          </button>

          {open && (
            <div className="su-overflow-dropdown" role="menu">
              <button className="su-action-item" onClick={() => { onPassword(); setOpen(false) }}>Change Password</button>
              <button className="su-action-item" onClick={() => { onAssignRole(); setOpen(false) }}>Assign Role</button>
              <button className="su-action-item" onClick={() => { onRemoveRole(); setOpen(false) }}>Remove Role</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="su-users-container">
      <div className="su-users-header">
        <SearchBar placeholder="Search by username, name, or email..." value={searchTerm} onChange={setSearchTerm} />
        <Button className="su-add-user-btn" onClick={() => dispatch(setShowCreateUserDialog(true))}>
          Add New User
        </Button>
      </div>

      {showInitialLoading || showSearchInitialLoading ? (
        <div className="su-loading-container">Loading...</div>
      ) : (
        <div className="su-table-container">
          <Table className="su-users-table">
            <TableHeader>
              <TableRow>
                <TableHead>S/N</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Password Expiry</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="su-table-body">
              {currentData.every((d) => d == null) &&
              (totalUsers === 0 || (!isSearching && cachedUsers.filter(Boolean).length === 0)) ? (
                <TableRow>
                  <TableCell colSpan={10} className="su-no-data-cell">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((user, index) => {
                  if (!user) {
                    return (
                      <TableRow key={`placeholder-${index}`}>
                        <TableCell colSpan={10} className="su-no-data-cell">
                          Loading...
                        </TableCell>
                      </TableRow>
                    )
                  }

                  const globalIndex = (currentPage - 1) * pageSize + index
                  return (
                    <TableRow key={user.userID ?? globalIndex}>
                      <TableCell>{globalIndex + 1}</TableCell>
                      <TableCell className="su-userid-cell">
                        <span className="su-userid-text">{user.userID}</span>
                      </TableCell>
                      <TableCell className="su-username-cell">
                        <p className="flex flex-col">{user.username}</p>
                      </TableCell>
                      <TableCell className="su-email-cell">
                        <span className="font-medium text-sm normal-case">{`${user.firstName} ${user.lastName}`}</span>
                        <br /> {user.email || "-"}
                      </TableCell>
                      <TableCell>{user.phone || "-"}</TableCell>
                      <TableCell className="su-roles-cell">
                        <span className="su-roles-text">{getUserRoles(user)}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.active)}</TableCell>
                      <TableCell>{formatDate(user.pwdExpiry)}</TableCell>
                      <TableCell className="su-modified-cell">
                        <div className="su-modified-info">
                          <div>{user.modifiedBy || "-"}</div>
                          <div className="su-modified-date">{formatDate(user.modifiedOn)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="su-actions-cell">
                        <ActionsMenu
                          user={user}
                          onEdit={() => {
                            setUserToEdit(user)
                            dispatch(setShowEditUserDialog(true))
                          }}
                          onPassword={() => {
                            setUserToChangePassword(user)
                            dispatch(setShowChangePasswordDialog(true))
                          }}
                          onAssignRole={() => {
                            setUserToAssignRole(user)
                            setShowAssignRoleDialog(true)
                          }}
                          onRemoveRole={() => {
                            setUserToRemoveRole(user)
                            setShowRemoveRoleDialog(true)
                          }}
                          onDelete={() => {
                            setUserIdToDelete(user.userID)
                            dispatch(setShowDeleteUserDialog(true))
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          <div className="su-pagination-container">
            <div className="su-pagination-info">
              Showing{" "}
              <span className="su-pagination-numbers">
                {totalUsers > 0
                  ? `${(currentPage - 1) * pageSize + 1} to ${Math.min(
                      currentPage * pageSize,
                      totalUsers,
                    )} of ${totalUsers}`
                  : "0 to 0 of 0"}
              </span>{" "}
              Users
            </div>

            <Pagination className="sp-pagination-controls">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    className="sp-pagination-prev"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  />
                </PaginationItem>

                {renderPageNumbers()}

                <PaginationItem>
                  <PaginationNext
                    className="sp-pagination-next"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}

      <CreateUser />
      <EditUser user={userToEdit} />
      <ChangePassword user={userToChangePassword} />
      <AssignRole
        user={userToAssignRole}
        roles={roles}
        isOpen={showAssignRoleDialog}
        onClose={() => {
          setShowAssignRoleDialog(false)
          setUserToAssignRole(null)
        }}
      />
      <RemoveRole
        user={userToRemoveRole}
        roles={roles}
        isOpen={showRemoveRoleDialog}
        onClose={() => {
          setShowRemoveRoleDialog(false)
          setUserToRemoveRole(null)
        }}
      />

      {showDeleteUserDialog && (
        <ConfirmationModal
          title="Delete User"
          message="Are you sure you want to delete this user? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => confirmDeleteUser(userIdToDelete)}
          onCancel={() => dispatch(setShowDeleteUserDialog(false))}
          isLoading={loading.deleteUser}
        />
      )}

      {/* Add this toast notification at the end */}
      {toast.show && (
        <div className={`su-toast su-toast-${toast.type}`}>
          <div className="su-toast-content">
            <span className="su-toast-icon">
              {toast.type === 'success' ? '✓' : '✗'}
            </span>
            <span className="su-toast-message">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default SecurityUsers