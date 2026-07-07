// features/claims/components/ClaimsTable.tsx
//@ts-nocheck

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from "../UI/table";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "../UI/badge";
import { Button } from "../UI/new-button";
import { Checkbox } from "../UI/checkbox";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  Trash2,
  Eye,
  FileText,
} from "lucide-react";
import { formatDate, formatCurrency } from "../../utils/ui-utilities";
import { ClaimReserve } from "../../features/reducers/claimsReducers/claimsSlice";

interface ClaimsTableProps {
  claims: ClaimReserve[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onEdit: (claim: ClaimReserve) => void;
  onDelete: (claim: ClaimReserve) => void;
  onView: (claim: ClaimReserve) => void;
  onSelect?: (claim: ClaimReserve) => void;
  selectedClaims?: Set<number>;
  isMobile?: boolean;
}

export const ClaimsTable: React.FC<ClaimsTableProps> = ({
  claims,
  loading,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onView,
  onSelect,
  selectedClaims = new Set(),
  isMobile = false,
}) => {
  const [isAllSelected, setIsAllSelected] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = totalCount > 0 ? (currentPage - 1) * pageSize : 0;
  const endItem = totalCount > 0 ? Math.min(currentPage * pageSize, totalCount) : 0;

  const handleSelectAll = () => {
    if (isAllSelected) {
      selectedClaims.clear();
    } else {
      claims.forEach((claim) => selectedClaims.add(claim.claimID));
    }
    setIsAllSelected(!isAllSelected);
  };

  const handleSelectClaim = (claimId: number) => {
    if (selectedClaims.has(claimId)) {
      selectedClaims.delete(claimId);
    } else {
      selectedClaims.add(claimId);
    }
    setIsAllSelected(selectedClaims.size === claims.length);
  };

  const getStatusBadge = (approval: number, active: number, deleted: number) => {
    if (deleted === 1) {
      return <Badge variant="destructive">Deleted</Badge>;
    }
    if (active === 0) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    switch (approval) {
      case 0:
        return <Badge variant="outline">Draft</Badge>;
      case 1:
        return <Badge variant="secondary">Pending</Badge>;
      case 2:
        return <Badge variant="default">Approved</Badge>;
      case 3:
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getDisplayLossType = (claim: ClaimReserve) => {
    if (claim.lossType) {
      return claim.lossType;
    }
    if (claim.lossDetails) {
      const details = claim.lossDetails.toLowerCase();
      if (details.includes("maturity")) return "Maturity";
      if (details.includes("surrender")) return "Surrender";
      if (details.includes("withdrawal")) return "Partial Withdrawal";
      if (details.includes("death") || details.includes("benefit")) return "Death Benefit";
      return claim.lossDetails;
    }
    return "N/A";
  };

  const getLossTypeColor = (lossType: string) => {
    if (!lossType) return "text-gray-700 bg-gray-50";
    
    const type = lossType.toLowerCase();
    if (type.includes("maturity")) {
      return "text-green-700 bg-green-50";
    } else if (type.includes("surrender")) {
      return "text-orange-700 bg-orange-50";
    } else if (type.includes("withdrawal")) {
      return "text-blue-700 bg-blue-50";
    } else if (type.includes("death") || type.includes("benefit")) {
      return "text-red-700 bg-red-50";
    } else {
      return "text-gray-700 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading claims...</p>
        <p className="text-gray-400 text-sm mt-2">
          Please wait while we fetch your data
        </p>
      </div>
    );
  }

  if (!claims || claims.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-sm font-medium mb-2">No claims found</p>
        <p className="text-xs">Create a new claim to get started.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {isMobile ? (
        // Mobile card view
        <div className="space-y-3">
          {claims.map((claim) => (
            <ClaimCard
              key={claim.claimID}
              claim={claim}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              onSelect={onSelect}
              isSelected={selectedClaims.has(claim.claimID)}
              getStatusBadge={getStatusBadge}
              getLossTypeColor={getLossTypeColor}
              getDisplayLossType={getDisplayLossType}
              navigate={navigate}           // ← PASS navigate
              location={location}            // ← PASS location
            />
          ))}
        </div>
      ) : (
        // Desktop table view (this is fine)
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {onSelect && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      className="h-4 w-4"
                    />
                  </TableHead>
                )}
                <TableHead>Claim No.</TableHead>
                <TableHead>Policy No.</TableHead>
                <TableHead>Insured Name</TableHead>
                <TableHead>Loss Type</TableHead>
                <TableHead className="text-right">Amount Reserved</TableHead>
                <TableHead>Loss Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => (
                <TableRow
                  key={claim.claimID}
                  className={`${
                    selectedClaims.has(claim.claimID) ? "bg-blue-50" : ""
                  } cursor-pointer hover:bg-blue-50/50 border-blue-100 transition-colors`}
                >
                  {onSelect && (
                    <TableCell>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedClaims.has(claim.claimID)}
                          onCheckedChange={() =>
                            handleSelectClaim(claim.claimID)
                          }
                          className="h-4 w-4"
                        />
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <div className="text-sm font-medium">
                      {claim.claimNo || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900">
                      {claim.policyNo || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900">
                      {claim.insuredName || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getLossTypeColor(
                        getDisplayLossType(claim)
                      )}`}
                    >
                      {getDisplayLossType(claim)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-blue-900">
                    {formatCurrency(claim.a9 || claim.amtReserved || 0)}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {claim.lossDate ? formatDate(claim.lossDate) : "N/A"}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(claim.approval, claim.active, claim.deleted)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 bg-transparent border-blue-300 text-blue-700 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(claim);
                        }}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 bg-transparent border-green-300 text-green-700 hover:bg-green-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(claim);
                        }}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 bg-transparent border-red-300 text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(claim);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
          <div className="text-sm text-muted-foreground order-2 sm:order-1">
            Showing {startItem + 1} to {endItem} of {totalCount} entries | Page{" "}
            {currentPage} of {totalPages}
            {selectedClaims.size > 0 && ` | ${selectedClaims.size} selected`}
          </div>

          <div className="flex items-center space-x-1 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="hidden sm:flex"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from(
                {
                  length: Math.min(isMobile ? 3 : 5, totalPages),
                },
                (_, i) => {
                  let pageNum: number;
                  const maxPages = isMobile ? 3 : 5;
                  if (totalPages <= maxPages) {
                    pageNum = i + 1;
                  } else if (currentPage <= Math.floor(maxPages / 2) + 1) {
                    pageNum = i + 1;
                  } else if (
                    currentPage >=
                    totalPages - Math.floor(maxPages / 2)
                  ) {
                    pageNum = totalPages - maxPages + 1 + i;
                  } else {
                    pageNum = currentPage - Math.floor(maxPages / 2) + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                }
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="hidden sm:flex"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ FIXED: Mobile Card Component with proper props
const ClaimCard = ({
  claim,
  onEdit,
  onDelete,
  onView,
  onSelect,
  isSelected,
  getStatusBadge,
  getLossTypeColor,
  getDisplayLossType,
  navigate,     // ← Added
  location,     // ← Added
}: any) => {
  return (
    <div
      className={`border rounded-lg mb-4 p-4 hover:shadow-md transition-shadow ${
        isSelected ? "bg-blue-50 border-blue-200" : "bg-white"
      } cursor-pointer`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {onSelect && (
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelect(claim.claimID)}
                className="h-4 w-4"
              />
            </div>
          )}
          <div>
            <div className="font-medium text-sm">
              {claim.claimNo || "N/A"}
            </div>
            <div className="text-xs text-muted-foreground">
              {claim.policyNo || "N/A"}
            </div>
          </div>
        </div>
        {getStatusBadge(claim.approval, claim.active, claim.deleted)}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="font-medium text-muted-foreground">Insured:</span>
          <div className="font-medium">{claim.insuredName || "N/A"}</div>
        </div>
        <div>
          <span className="font-medium text-muted-foreground">Loss Type:</span>
          <div>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getLossTypeColor(
                getDisplayLossType(claim)
              )}`}
            >
              {getDisplayLossType(claim)}
            </span>
          </div>
        </div>
        <div>
          <span className="font-medium text-muted-foreground">
            Amount Reserved:
          </span>
          <div className="font-medium text-blue-900">
            {formatCurrency(claim.a9 || claim.amtReserved || 0)}
          </div>
        </div>
        <div>
          <span className="font-medium text-muted-foreground">Loss Date:</span>
          <div>{claim.lossDate ? formatDate(claim.lossDate) : "N/A"}</div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
        {/* ✅ FIXED: Use onView callback instead of direct navigate */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 bg-transparent border-blue-300 text-blue-700 hover:bg-blue-50"
          onClick={(e) => {
            e.stopPropagation();
            onView(claim);  // ← Use the callback
          }}
        >
          <Eye className="w-3 h-3" />
        </Button>

        {/* ✅ FIXED: Use onEdit callback */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 bg-transparent border-green-300 text-green-700 hover:bg-green-50"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(claim);  // ← Use the callback
          }}
        >
          <Pencil className="w-3 h-3" />
        </Button>

        {/* ✅ FIXED: Use onDelete callback */}
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent border-red-300 text-red-700 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(claim);  // ← Use the callback
          }}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
};