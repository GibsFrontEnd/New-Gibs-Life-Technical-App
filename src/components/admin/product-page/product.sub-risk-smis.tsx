import { useEffect, useState } from "react";
import { Button } from "../../UI/new-button";
import { Card, CardContent, CardHeader, CardTitle } from "../../UI/card";
import {
  OutsideDismissDialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../UI/dialog";
import { useToast } from "../../UI/use-toast";
import { Toaster } from "../../UI/toaster";
import { SubRiskSMIForm } from "../../admin/product-page/sub-risk-smi/sub-risk-smi-form";
import { SubRiskSMITable } from "../../admin/product-page/sub-risk-smi/sub-risk-smi-table";
import { SubRiskSMIFilters } from "../../admin/product-page/sub-risk-smi/sub-risk-smi-filters";
import { useAppDispatch, useAppSelector } from "../../../hooks/use-apps";
import {
  getAllSubRiskSMIs,
  getSubRiskSMIById,
  createSubRiskSMI,
  updateSubRiskSMI,
  deleteSubRiskSMI,
  getSubRiskSMIsBySubRiskId,
  getSubRiskSMIsBySectionCode,
  getActiveSubRiskSMIs,
  getSubRiskSMIsBySMICode,
  getSubRiskSMIsWithFlags,
  bulkUpdateActive,
  bulkUpdateFlags,
  clearMessages,
  clearCurrentSubRiskSMI,
  clearExistsResult,
  selectSubRiskSMIs,
} from "../../../features/reducers/productReducers/subRiskSMISlice";
import type {
  SubRiskSMI,
  SubRiskSMICreateUpdateRequest,
} from "../../../types/sub-risk-smis";
import { Plus, RefreshCw } from "lucide-react";

type DialogMode = "create" | "edit" | "view" | null;

export default function SubRiskSMIManagement() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const {
    subRiskSMIs,
    currentSubRiskSMI,
    existsResult,
    loading,
    error,
    success,
  } = useAppSelector(selectSubRiskSMIs);

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedSubRiskSMI, setSelectedSubRiskSMI] =
    useState<SubRiskSMI | null>(null);

  // Load all SubRiskSMIs on component mount
  useEffect(() => {
    dispatch(getAllSubRiskSMIs());
  }, [dispatch]);

  // Handle success messages
  useEffect(() => {
    if (success.createSubRiskSMI) {
      toast({
        title: "Success",
        description: "SubRisk SMI created successfully",
      });
      setDialogMode(null);
      dispatch(clearMessages());
    }
    if (success.updateSubRiskSMI) {
      toast({
        title: "Success",
        description: "SubRisk SMI updated successfully",
      });
      setDialogMode(null);
      dispatch(clearMessages());
    }
    if (success.deleteSubRiskSMI) {
      toast({
        title: "Success",
        description: "SubRisk SMI deleted successfully",
      });
      dispatch(clearMessages());
    }
    if (success.bulkUpdateActive) {
      toast({
        title: "Success",
        description: "Bulk active status updated successfully",
      });
      dispatch(clearMessages());
    }
    if (success.bulkUpdateFlags) {
      toast({
        title: "Success",
        description: "Bulk flags updated successfully",
      });
      dispatch(clearMessages());
    }
  }, [success, toast, dispatch]);

  // Handle error messages
  useEffect(() => {
    Object.entries(error).forEach(([key, err]) => {
      if (err) {
        toast({
          title: "Error",
          description: `Failed to ${key
            .replace(/([A-Z])/g, " $1")
            .toLowerCase()}`,
          variant: "destructive",
        });
      }
    });
    if (Object.values(error).some((err) => err)) {
      dispatch(clearMessages());
    }
  }, [error, toast, dispatch]);

  const handleCreate = () => {
    setSelectedSubRiskSMI(null);
    setDialogMode("create");
    dispatch(clearCurrentSubRiskSMI());
  };

  const handleEdit = (subRiskSMI: SubRiskSMI) => {
    setSelectedSubRiskSMI(subRiskSMI);
    setDialogMode("edit");
    dispatch(getSubRiskSMIById(subRiskSMI.sid));
  };

  const handleView = (subRiskSMI: SubRiskSMI) => {
    setSelectedSubRiskSMI(subRiskSMI);
    setDialogMode("view");
    dispatch(getSubRiskSMIById(subRiskSMI.sid));
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this SubRisk SMI?")) {
      dispatch(deleteSubRiskSMI(id));
    }
  };

  const handleFormSubmit = (data: SubRiskSMICreateUpdateRequest) => {
    if (dialogMode === "create") {
      dispatch(createSubRiskSMI(data));
    } else if (dialogMode === "edit" && selectedSubRiskSMI) {
      dispatch(
        updateSubRiskSMI({
          id: selectedSubRiskSMI.sid,
          data: { ...data, modifiedBy: "current-user" },
        })
      );
    }
  };

  const handleBulkUpdateActive = (ids: number[], active: number) => {
    dispatch(
      bulkUpdateActive({ siDs: ids, active, modifiedBy: "current-user" })
    );
  };

  const handleBulkUpdateFlags = (
    ids: number[],
    flags: { addSI?: number; stockItem?: number; multiplier?: number }
  ) => {
    dispatch(
      bulkUpdateFlags({ siDs: ids, ...flags, modifiedBy: "current-user" })
    );
  };

  const handleFilter = (filters: any) => {
    if (filters.subRiskId) {
      dispatch(getSubRiskSMIsBySubRiskId(filters.subRiskId));
    } else if (filters.sectionCode) {
      dispatch(getSubRiskSMIsBySectionCode(filters.sectionCode));
    } else if (filters.smiCode) {
      dispatch(getSubRiskSMIsBySMICode(filters.smiCode));
    } else if (filters.activeOnly) {
      dispatch(getActiveSubRiskSMIs());
    } else if (filters.addSI || filters.stockItem || filters.multiplier) {
      const flagParams: any = {};
      if (filters.addSI) flagParams.addSI = 1;
      if (filters.stockItem) flagParams.stockItem = 1;
      if (filters.multiplier) flagParams.multiplier = 1;
      dispatch(getSubRiskSMIsWithFlags(flagParams));
    } else {
      dispatch(getAllSubRiskSMIs());
    }
  };

  const handleClearFilters = () => {
    dispatch(getAllSubRiskSMIs());
  };

  const handleRefresh = () => {
    dispatch(getAllSubRiskSMIs());
  };

  /*   const handleCheckExists = (id: number) => {
    dispatch(checkSubRiskSMIExists(id));
  };
 */
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SubRisk SMI Management</h1>
          <p className="text-muted-foreground">
            Manage your SubRisk SMI records
          </p>
        </div>
        <div className="flex gap-2">
          <Button //@ts-ignore
            onClick={handleRefresh}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subRiskSMIs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subRiskSMIs.filter((item) => item.active === 1).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">With Add SI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subRiskSMIs.filter((item) => item.addSI === 1).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subRiskSMIs.filter((item) => item.stockItem === 1).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <SubRiskSMIFilters
        onFilter={handleFilter}
        onClear={handleClearFilters}
        isLoading={loading.getAllSubRiskSMIs}
      />

      {/* Exists Check */}
      {existsResult && (
        <Card>
          <CardContent className="pt-6">
            <p>
              SubRisk SMI with ID {existsResult.id}{" "}
              {existsResult.exists ? "exists" : "does not exist"}
            </p>
            <Button //@ts-ignore
              variant="outline"
              size="sm"
              onClick={() => dispatch(clearExistsResult())}
              className="mt-2"
            >
              Clear
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <SubRiskSMITable
        subRiskSMIs={subRiskSMIs}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onBulkUpdateActive={handleBulkUpdateActive}
        onBulkUpdateFlags={handleBulkUpdateFlags}
        isLoading={loading.getAllSubRiskSMIs}
      />

      {/* Form Dialog */}
      <OutsideDismissDialog
        open={dialogMode !== null}
        onOpenChange={() => setDialogMode(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" && "Create SubRisk SMI"}
              {dialogMode === "edit" && "Edit SubRisk SMI"}
              {dialogMode === "view" && "View SubRisk SMI"}
            </DialogTitle>
          </DialogHeader>
          {dialogMode !== "view" ? (
            <SubRiskSMIForm
              subRiskSMI={currentSubRiskSMI || selectedSubRiskSMI}
              onSubmit={handleFormSubmit}
              onCancel={() => setDialogMode(null)}
              isLoading={loading.createSubRiskSMI || loading.updateSubRiskSMI}
            />
          ) : (
            currentSubRiskSMI && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>SMI Code:</strong> {currentSubRiskSMI.smiCode}
                  </div>
                  <div>
                    <strong>Section Code:</strong>{" "}
                    {currentSubRiskSMI.sectionCode}
                  </div>
                  <div>
                    <strong>SubRisk ID:</strong> {currentSubRiskSMI.subRiskID}
                  </div>
                  <div>
                    <strong>Section Name:</strong>{" "}
                    {currentSubRiskSMI.sectionName}
                  </div>
                  <div>
                    <strong>SubRisk Name:</strong>{" "}
                    {currentSubRiskSMI.subRiskName}
                  </div>
                  <div>
                    <strong>Rates:</strong> {currentSubRiskSMI.rates}
                  </div>
                </div>
                <div>
                  <strong>SMI Details:</strong>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {currentSubRiskSMI.smiDetails}
                  </p>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <strong>A1:</strong> {currentSubRiskSMI.a1}
                  </div>
                  <div>
                    <strong>A2:</strong> {currentSubRiskSMI.a2}
                  </div>
                  <div>
                    <strong>A3:</strong> {currentSubRiskSMI.a3}
                  </div>
                  <div>
                    <strong>A4:</strong> {currentSubRiskSMI.a4}
                  </div>
                  <div>
                    <strong>A5:</strong> {currentSubRiskSMI.a5}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div>
                    <strong>Add SI:</strong>{" "}
                    {currentSubRiskSMI.addSI ? "Yes" : "No"}
                  </div>
                  <div>
                    <strong>Stock Item:</strong>{" "}
                    {currentSubRiskSMI.stockItem ? "Yes" : "No"}
                  </div>
                  <div>
                    <strong>Multiplier:</strong> {currentSubRiskSMI.multiplier}
                  </div>
                  <div>
                    <strong>Active:</strong>{" "}
                    {currentSubRiskSMI.active ? "Yes" : "No"}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <strong>Submitted By:</strong>{" "}
                    {currentSubRiskSMI.submittedBy}
                  </div>
                  <div>
                    <strong>Submitted On:</strong>{" "}
                    {currentSubRiskSMI.submittedOn}
                  </div>
                  <div>
                    <strong>Modified By:</strong> {currentSubRiskSMI.modifiedBy}
                  </div>
                  <div>
                    <strong>Modified On:</strong> {currentSubRiskSMI.modifiedOn}
                  </div>
                </div>
              </div>
            )
          )}
        </DialogContent>
      </OutsideDismissDialog>

      <Toaster />
    </div>
  );
}
