import { useState, useMemo } from "react";
import type { Branch, BranchFiltersProps } from "@/types/branches";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/UI/table";
import { Button } from "@/components/UI/new-button";
import { Badge } from "@/components/UI/badge";
import { Card } from "@/components/UI/card";
import { EditBranchDialog } from "./edit-branch-dialog";
import { DeleteBranchDialog } from "./delete-branch-dialog";
import {
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Building,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

interface BranchesTableProps {
  branches: Branch[];
  filters: BranchFiltersProps;
  loading?: boolean;
}

export function BranchesTable({
  branches,
  filters,
  loading,
}: BranchesTableProps) {
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      const matchesSearch =
        !filters.search ||
        branch.description
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        branch.manager.toLowerCase().includes(filters.search.toLowerCase()) ||
        branch.address.toLowerCase().includes(filters.search.toLowerCase()) ||
        branch.branchID2.toLowerCase().includes(filters.search.toLowerCase());

      const matchesRegion =
        !filters.regionID || branch.regionID === filters.regionID;
      const matchesState =
        !filters.stateID || branch.stateID === filters.stateID;
      const matchesActive =
        !filters.active || branch.active.toString() === filters.active;

      return matchesSearch && matchesRegion && matchesState && matchesActive;
    });
  }, [branches, filters]);

  const totalPages = Math.ceil(filteredBranches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBranches = filteredBranches.slice(
    startIndex,
    startIndex + itemsPerPage
  );

//   const getRegionName = (regionID: string) => {
//     const regions: Record<string, string> = {
//       "001": "South West",
//       "002": "South South",
//       "003": "North Central",
//       "004": "Lagos",
//       "014": "North West",
//     };
//     return regions[regionID] || `Region ${regionID}`;
//   };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-
          {Math.min(startIndex + itemsPerPage, filteredBranches.length)} of{" "}
          {filteredBranches.length} branches
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} // @ts-ignore
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              } // @ts-ignore
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBranches.map((branch) => (
              <TableRow key={branch.branchID}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{branch.description}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {branch.branchID} ({branch.branchID2})
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div
                    className="max-w-[200px] truncate"
                    title={branch.manager}
                  >
                    {branch.manager || "Not assigned"}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {branch.regionID}
                    </div>
                    {branch.address && (
                      <div
                        className="text-xs text-muted-foreground max-w-[200px] truncate"
                        title={branch.address}
                      >
                        {branch.address}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    {branch.mobilePhone && (
                      <div className="flex items-center gap-1 text-xs">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {branch.mobilePhone}
                      </div>
                    )}
                    {branch.email && (
                      <div className="flex items-center gap-1 text-xs">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {branch.email}
                      </div>
                    )}
                    {!branch.mobilePhone && !branch.email && (
                      <span className="text-xs text-muted-foreground">
                        No contact info
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant={branch.active ? "default" : "secondary"}>
                    {branch.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="text-sm">
                    {branch.modifiedOn
                      ? format(new Date(branch.modifiedOn), "MMM dd, yyyy")
                      : "Never"}
                  </div>
                  {branch.modifiedBy && (
                    <div className="text-xs text-muted-foreground">
                      by {branch.modifiedBy}
                    </div>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingBranch(branch)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingBranch(branch)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredBranches.length === 0 && (
        <Card className="p-8">
          <div className="text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No branches found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search terms.
            </p>
          </div>
        </Card>
      )}

      <EditBranchDialog
        branch={editingBranch}
        open={!!editingBranch}
        onOpenChange={(open) => !open && setEditingBranch(null)}
      />

      <DeleteBranchDialog
        branch={deletingBranch}
        open={!!deletingBranch}
        onOpenChange={(open) => !open && setDeletingBranch(null)}
      />
    </div>
  );
}
