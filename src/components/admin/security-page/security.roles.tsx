import { useEffect, useState } from "react";
import { Button } from "../../UI/new-button";
import { useAppDispatch, useAppSelector } from "../../../hooks/use-apps";
import ConfirmationModal from "../../Modals/ConfirmationModal";
import SearchBar from "../../SearchBar";
import {
  clearMessages,
  deleteRole,
  getAllRoles,
  selectRoles,
} from "../../../features/reducers/adminReducers/roleSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../UI/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../UI/pagination";
import {
  selectUiState,
  setShowCreateRoleDialog,
  setShowDeleteRoleDialog,
  setShowEditRoleDialog,
} from "../../../features/reducers/uiReducers/uiSlice";
import type { Role } from "../../../types/role";
import { CreateRole, EditRole } from "../../components.roles";

const SecurityRoles = () => {
  const dispatch = useAppDispatch();

  const { roles, success, loading, error } = useAppSelector(selectRoles);
  const { showDeleteRoleDialog } = useAppSelector(selectUiState);

  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [roleIdToDelete, setRoleIdToDelete] = useState<
    number | null | undefined
  >(null);

  const rowsPerPage = 5;

  // Safe filtering with optional chaining
  const filteredRoles = (Array.isArray(roles) ? roles : []).filter(
    (role) =>
      role.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.roleDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.submittedBy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRoles.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentData = filteredRoles.slice(startIndex, startIndex + rowsPerPage);

  useEffect(() => {
    dispatch(getAllRoles());
  }, [dispatch]);

  // Handle successful deletion
  useEffect(() => {
    if (success.deleteRole) {
      dispatch(clearMessages());
      setRoleIdToDelete(null);
      dispatch(setShowDeleteRoleDialog(false));
    }
  }, [success.deleteRole, dispatch]);

  const confirmDeleteRole = async (roleId: number | null | undefined) => {
    if (roleId == null) {
      console.warn("No Role ID to delete");
      return;
    }

    dispatch(deleteRole(roleId));
  };
  const formatDateTime = (dateString: string) => {
    if (!dateString || dateString === "1900-01-01T00:00:00") return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };

  if (loading.getAllRoles) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div>Loading roles...</div>
        </div>
      </div>
    );
  }

  if (error.getAllRoles) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Roles</h3>
          <p className="text-red-600 text-sm mt-1">
            {typeof error.getAllRoles === "string"
              ? error.getAllRoles
              : "Failed to load roles"}
          </p>
          <Button onClick={() => dispatch(getAllRoles())} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-6 bg-[#f8f9fa] min-h-screen">
      {/* Header Section */}
      <div className="flex flex-wrap gap-4 items-center mb-4">
        {/* Search and Filters */}
        <SearchBar
          placeholder="Search by name, module, or category..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <Button
          className="flex flex-wrap gap-4 items-center mb-4"
          onClick={() => dispatch(setShowCreateRoleDialog(true))}
        >
          Add New Role
        </Button>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold text-gray-900">S/N</TableHead>
              <TableHead className="font-semibold text-gray-900">
                Role ID
              </TableHead>
              <TableHead className="font-semibold text-gray-900">
                Role Name
              </TableHead>
              <TableHead className="font-semibold text-gray-900">
                Description
              </TableHead>
              <TableHead className="font-semibold text-gray-900">
                Submitted By
              </TableHead>
              <TableHead className="font-semibold text-gray-900">
                Submitted On
              </TableHead>
              <TableHead className="font-semibold text-gray-900">
                Modified By
              </TableHead>
              <TableHead className="font-semibold text-gray-900">
                Modified On
              </TableHead>
              <TableHead className="font-semibold text-gray-900 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-gray-500 p-8"
                >
                  <div className="flex flex-col items-center justify-center">
                    <svg
                      className="w-12 h-12 text-gray-400 mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                    <p className="text-lg font-medium text-gray-900 mb-1">
                      No roles found
                    </p>
                    <p className="text-gray-600">
                      {searchTerm
                        ? "Try adjusting your search terms"
                        : "Get started by creating your first role"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((role, index) => (
                <TableRow
                  key={role.roleID}
                  className="hover:bg-gray-50 border-b border-gray-100"
                >
                  <TableCell className="text-gray-600">
                    {startIndex + index + 1}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-blue-600">
                    {role.roleID}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900">
                      {role.roleName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className="text-gray-600 max-w-[200px] truncate"
                      title={role.roleDescription}
                    >
                      {role.roleDescription || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        role.submittedBy
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {role.submittedBy || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDateTime(role.submittedOn)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        role.modifiedBy
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {role.modifiedBy || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDateTime(role.modifiedOn)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRoleToEdit(role);
                          dispatch(setShowEditRoleDialog(true));
                        }}
                        // disabled={loading.updateRole}
                        className="bg-[#8B4B8C] text-white px-3 py-1 border-none rounded text-sm cursor-pointer transition-colors duration-200 hover:bg-[#7a3a7b]"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setRoleIdToDelete(role.roleID);
                          dispatch(setShowDeleteRoleDialog(true));
                        }}
                        // disabled={loading.deleteRole}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t bg-gray-50">
            <div className="text-sm text-gray-600 mb-4 sm:mb-0">
              Showing{" "}
              <span className="font-medium text-gray-900">
                {filteredRoles.length > 0
                  ? `${startIndex + 1} to ${Math.min(
                      startIndex + rowsPerPage,
                      filteredRoles.length
                    )} of ${filteredRoles.length}`
                  : "0 to 0 of 0"}
              </span>{" "}
              Roles
            </div>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    // disabled={currentPage === 1}
                    className={
                      currentPage === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "cursor-pointer"
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
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={currentPage === page}
                        onClick={() => setCurrentPage(page)}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    // disabled={currentPage === totalPages}
                    className={
                      currentPage === totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateRole />
      <EditRole role={roleToEdit} />

      {showDeleteRoleDialog && (
        <ConfirmationModal
          title="Delete Role"
          message="Are you sure you want to delete this role? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => confirmDeleteRole(roleIdToDelete)}
          onCancel={() => dispatch(setShowDeleteRoleDialog(false))}
          isLoading={loading.deleteRole}
        />
      )}
    </div>
  );
};

export default SecurityRoles;
