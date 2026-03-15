"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/UI/new-button";
import { useAppDispatch, useAppSelector } from "@/hooks/use-apps";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import SearchBar from "@/components/SearchBar";
import {
  clearMessages,
  deletePermission,
  getAllPermissions,
  selectPermissions,
} from "@/features/reducers/adminReducers/permissionSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/UI/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/UI/pagination";
import {
  selectUiState,
  setShowCreatePermissionDialog,
  setShowDeletePermissionDialog,
  setShowEditPermissionDialog,
} from "@/features/reducers/uiReducers/uiSlice";
import type { Permission } from "@/types/permission";
import { CreatePermission, EditPermission } from "@/components/components.permissions";
import "./SecurityPermissions.css";

const SecurityPermissions = () => {
  const dispatch = useAppDispatch();

  // defensive defaults in case selector returns undefined
  const permissionsState = useAppSelector(selectPermissions) ?? {};
  const defaultLoading = {
    getAllPermissions: false,
    createPermission: false,
    updatePermission: false,
    deletePermission: false,
  };
  const defaultSuccess = {
    createPermission: false,
    updatePermission: false,
    deletePermission: false,
  };
  const defaultError = {
    getAllPermissions: null,
    createPermission: null,
    updatePermission: null,
    deletePermission: null,
  };

  const {
    permissions = [],
    success = defaultSuccess,
    loading = defaultLoading,
    error = defaultError,
  } = permissionsState as {
    permissions?: Permission[];
    success?: typeof defaultSuccess;
    loading?: typeof defaultLoading;
    error?: typeof defaultError;
  };

  const { showDeletePermissionDialog } = useAppSelector(selectUiState);

  const [permissionToEdit, setPermissionToEdit] = useState<Permission | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const [permissionIdToDelete, setPermissionIdToDelete] = useState<
    number | null | undefined
  >(null);

  // filter
  const filteredPermissions = permissions.filter(
    (permission) =>
      (permission.permissionName ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (permission.module ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (permission.category ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const totalPages = 23
  const currentData = filteredPermissions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    dispatch(getAllPermissions());
  }, [dispatch]);

  // close after successful delete
  useEffect(() => {
    if (success.deletePermission) {
      dispatch(clearMessages());
      setPermissionIdToDelete(null);
      dispatch(setShowDeletePermissionDialog(false));
    }
  }, [success.deletePermission, dispatch]);

  const confirmDeletePermission = async (
    permissionId: number | null | undefined
  ) => {
    if (permissionId == null) {
      console.warn("No Permission Id to delete");
      return;
    }

    dispatch(deletePermission(permissionId));
    // we react to success.deletePermission in the effect above
  };

  if (error.getAllPermissions) {
    console.error("Error fetching Permissions:", error.getAllPermissions);
  }

  return (
    <div className="sp-permissions-container">
      <div className="sp-permissions-header">
        <SearchBar
          placeholder="Search by name, module, or category..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <Button
          className="sp-add-permission-btn"
          onClick={() => dispatch(setShowCreatePermissionDialog(true))}
        >
          Add New Permission
        </Button>
      </div>

      {loading.getAllPermissions ? (
        <div className="sp-loading-container">Loading...</div>
      ) : (
        <div className="sp-table-container">
          <Table className="sp-permissions-table">
            <TableHeader>
              <TableRow>
                <TableHead>S/N</TableHead>
                <TableHead>Permission ID</TableHead>
                <TableHead>Permission Name</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="sp-table-body">
              {currentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="sp-no-data-cell">
                    No permissions found
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((permission, index) => (
                  <TableRow key={permission.permissionID}>
                    <TableCell>
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell>{permission.permissionID}</TableCell>
                    <TableCell className="sp-permission-name-cell">
                      {permission.permissionName}
                    </TableCell>
                    <TableCell>{permission.module || "-"}</TableCell>
                    <TableCell>{permission.category || "-"}</TableCell>
                    <TableCell className="sp-remarks-cell">
                      {permission.remarks || "-"}
                    </TableCell>
                    <TableCell className="sp-actions-cell">
                      <Button
                        className="sp-edit-btn"
                        onClick={() => {
                          setPermissionToEdit(permission);
                          dispatch(setShowEditPermissionDialog(true));
                        }}
                      >
                        Edit
                      </Button>

                      <Button
                        variant="destructive"
                        className="sp-delete-btn"
                        onClick={() => {
                          setPermissionIdToDelete(permission.permissionID);
                          dispatch(setShowDeletePermissionDialog(true));
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

          <div className="sp-pagination-container">
            <div className="sp-pagination-info">
              Showing{" "}
              <span className="sp-pagination-numbers">
                {filteredPermissions.length > 0
                  ? `${(currentPage - 1) * rowsPerPage + 1} to ${Math.min(
                      currentPage * rowsPerPage,
                      filteredPermissions.length
                    )} of ${filteredPermissions.length}`
                  : "0 to 0 of 0"}
              </span>{" "}
              Permissions
            </div>

            <Pagination className="sp-pagination-controls">
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious
        className="sp-pagination-prev"
        onClick={() =>
          setCurrentPage((prev) => Math.max(prev - 1, 1))
        }
      />
    </PaginationItem>

    {Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(
        (page) =>
          page >= Math.max(1, currentPage - 2) &&
          page <= Math.min(totalPages, currentPage + 2)
      )
      .map((page) => (
        <PaginationItem key={page} className="sp-pagination-item">
          <PaginationLink
            isActive={currentPage === page}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </PaginationLink>
        </PaginationItem>
      ))}

    <PaginationItem>
      <PaginationNext
        className="sp-pagination-next"
        onClick={() =>
          setCurrentPage((prev) => Math.min(prev + 1, totalPages))
        }
      />
    </PaginationItem>
  </PaginationContent>
</Pagination>
          </div>
        </div>
      )}

      <CreatePermission />
      <EditPermission permission={permissionToEdit} />

      {showDeletePermissionDialog && (
        <ConfirmationModal
          title="Delete Permission"
          message="Are you sure you want to delete this permission? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => confirmDeletePermission(permissionIdToDelete)}
          onCancel={() => dispatch(setShowDeletePermissionDialog(false))}
          isLoading={loading.deletePermission}
        />
      )}
    </div>
  );
};

export default SecurityPermissions;
