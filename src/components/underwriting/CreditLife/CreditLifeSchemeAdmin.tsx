// src/pages/Underwriting/CreditLife/CreditLifeSchemeAdmin.tsx
// @ts-nocheck

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../UI/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../UI/new-select";
import { Input } from "../../UI/new-input";
import {
  Filter,
  Search,
  X,
  Building2,
  FileText,
  Check,
  Pencil,
  Loader2,
  CreditCard,
} from "lucide-react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "../../UI/new-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from "../../UI/table";
import { Badge } from "../../UI/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../UI/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../UI/alert-dialog";
import { useAppDispatch, useAppSelector } from "../../../hooks/use-apps";
// import {
  // fetchGroupLifeQuotations,
  // fetchGroupLifeQuotationsByAgent,
  // selectGroupLifeQuotations,
  // setCurrentQuotation,
  // deleteGroupLifeQuotation,
// } from "../../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";
import { formatDate, formatCurrency } from "../../../utils/ui-utilities";
import { useToast } from "../../../hooks/use-toast";
import { Checkbox } from "../../UI/checkbox";

interface CreditLifeQuotation {
  id: string;
  quotationNumber: string;
  companyName: string;
  transactionDate: string;
  effectiveDate: string;
  expiryDate: string;
  totalMembers: number;
  totalSumInsured: number;
  totalPremium: number;
  status: "PROSPECT" | "ACTIVE" | "PENDING" | "CANCELLED";
}

export default function CreditLifeSchemeAdmin() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  // Using Group Life selector since we're using the same endpoint
  const { quotations, loading } = useAppSelector(selectGroupLifeQuotations);
  const isLoading = Boolean(loading?.list);

  const [isMobile, setIsMobile] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    searchField: "companyName",
    searchValue: "",
    startDate: "",
    endDate: "",
    status: "all",
    schemeType: "all",
    insuredType: "all",
    tag: "CL", // Credit Life tag
  });

  const [selectedQuotations, setSelectedQuotations] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [approvingQuotations, setApprovingQuotations] = useState<Set<string>>(new Set());
  const [approveError, setApproveError] = useState("");

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [deletingQuotation, setDeletingQuotation] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getQuotationId = (quote: any) => {
    return quote.id || quote.quoteID;
  };

  const getQuotationNumber = (quote: any) => {
    return quote.quotationNumber || quote.quoteNo;
  };

  const getCompanyName = (quote: any) => {
    return quote.companyName || quote.surName;
  };

  const refreshQuotations = () => {
    const agentId = localStorage.getItem("agentId");

    if (agentId) {
      dispatch(
        fetchGroupLifeQuotationsByAgent({
          agentCode: agentId,
          page: currentPage,
          pageSize,
        })
      );
    } else {
      dispatch(
        fetchGroupLifeQuotations({
          filters: filterCriteria,
          page: currentPage,
          pageSize,
        })
      );
    }
  };

  useEffect(() => {
    const agentId = localStorage.getItem("agentId");

    if (agentId) {
      dispatch(
        fetchGroupLifeQuotationsByAgent({
          agentCode: agentId,
          page: currentPage,
          pageSize,
        })
      );
    } else {
      dispatch(
        fetchGroupLifeQuotations({
          filters: filterCriteria,
          page: currentPage,
          pageSize,
        })
      );
    }
  }, [dispatch, currentPage, pageSize]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSelectQuotation = (quoteId: string) => {
    const newSelected = new Set(selectedQuotations);
    if (newSelected.has(quoteId)) {
      newSelected.delete(quoteId);
    } else {
      newSelected.add(quoteId);
    }
    setSelectedQuotations(newSelected);

    const displayQuotations = getDisplayQuotations();
    setIsAllSelected(newSelected.size === displayQuotations?.length);
  };

  const handleSelectAll = () => {
    const displayQuotations = getDisplayQuotations();

    if (isAllSelected) {
      setSelectedQuotations(new Set());
    } else {
      const allIds = new Set(
        displayQuotations.map((quote: any) => getQuotationId(quote))
      );
      setSelectedQuotations(allIds);
    }
    setIsAllSelected(!isAllSelected);
  };

  const handleApproveQuotation = async (quoteId: string, quoteNo: string) => {
    if (!quoteId) {
      setApproveError("Invalid quotation ID");
      return;
    }

    try {
      setApprovingQuotations((prev) => new Set(prev).add(quoteId));
      setApproveError("");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccessMessage(`Scheme ${quoteNo} approved successfully!`);
      setShowSuccessToast(true);

      setTimeout(() => {
        setShowSuccessToast(false);
      }, 5000);

      refreshQuotations();

      const newSelected = new Set(selectedQuotations);
      newSelected.delete(quoteId);
      setSelectedQuotations(newSelected);
    } catch (err) {
      const errorMessage = err?.message || "Unknown error occurred";
      setApproveError("Failed to approve scheme: " + errorMessage);
      console.error("Error approving scheme:", err);
    } finally {
      setApprovingQuotations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(quoteId);
        return newSet;
      });
    }
  };

  const handleBulkApprove = async () => {
    if (selectedQuotations.size === 0) return;

    try {
      setApproveError("");

      const quotesToApprove = Array.from(selectedQuotations);
      setApprovingQuotations(new Set(quotesToApprove));

      let successCount = 0;

      for (const quoteId of quotesToApprove) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));
          successCount++;
        } catch (err) {
          console.error(`Failed to approve ${quoteId}:`, err);
        }
      }

      if (successCount > 0) {
        setSuccessMessage(
          `Successfully approved ${successCount} out of ${quotesToApprove.length} schemes!`
        );
        setShowSuccessToast(true);

        setTimeout(() => {
          setShowSuccessToast(false);
        }, 5000);
      }

      refreshQuotations();
      setSelectedQuotations(new Set());
      setIsAllSelected(false);
    } catch (err) {
      const errorMessage = err?.message || "Unknown error occurred";
      setApproveError("Error during bulk approval: " + errorMessage);
    } finally {
      setApprovingQuotations(new Set());
    }
  };

  const applyFilters = () => {
    setCurrentPage(1);
    setSelectedQuotations(new Set());
    setIsAllSelected(false);
    refreshQuotations();
  };

  const clearAllFilters = () => {
    setFilterCriteria({
      searchField: "companyName",
      searchValue: "",
      startDate: "",
      endDate: "",
      status: "all",
      schemeType: "all",
      insuredType: "all",
      tag: "CL",
    });
    setCurrentPage(1);
    setSelectedQuotations(new Set());
    setIsAllSelected(false);
    refreshQuotations();
  };

  const raw = quotations ?? {};
  let itemsArray: any[] = [];

  if (Array.isArray(raw)) {
    itemsArray = raw;
  } else if (Array.isArray(raw.items)) {
    itemsArray = raw.items;
  } else if (Array.isArray(raw.data?.items)) {
    itemsArray = raw.data.items;
  } else {
    itemsArray = [];
  }

  const getDisplayQuotations = () => {
    // Filter for Credit Life schemes (you can filter by tag or any other field)
    return itemsArray;
  };

  const hasActiveFilters =
    filterCriteria.searchValue ||
    filterCriteria.startDate ||
    filterCriteria.endDate ||
    filterCriteria.status !== "all" ||
    filterCriteria.schemeType !== "all" ||
    filterCriteria.insuredType !== "all";

  const itemsForDisplay = getDisplayQuotations();
  const effectiveTotalCount = itemsForDisplay.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotalCount / pageSize));
  const startItem = (currentPage - 1) * pageSize;
  const endItem = Math.min(currentPage * pageSize, effectiveTotalCount);
  const paginatedQuotations = itemsForDisplay.slice(startItem, endItem);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setSelectedQuotations(new Set());
      setIsAllSelected(false);
    }
  };

  const handleEditQuotation = (quote: any) => {
    dispatch(setCurrentQuotation(quote));
    const quoteNumber = getQuotationNumber(quote);
    navigate(`/underwriting/group-life-quotations/${encodeURIComponent(quoteNumber)}`);
  };

  const handleNewQuotation = () => {
    dispatch(setCurrentQuotation(null));
    navigate(`/underwriting/group-life-quotations/new`);
  };

  const handleDeleteQuotation = (quote: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingQuotation(quote);
    setShowDeleteDialog(true);
  };

  const confirmDeleteQuotation = async () => {
    if (!deletingQuotation) return;

    try {
      const quoteNumber = getQuotationNumber(deletingQuotation);
      await dispatch(deleteGroupLifeQuotation(quoteNumber)).unwrap();

      toast({
        title: "Success",
        description: "Scheme deleted successfully",
        variant: "default",
      });

      refreshQuotations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete scheme",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setDeletingQuotation(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PROSPECT":
        return <Badge variant="outline">Prospect</Badge>;
      case "ACTIVE":
        return <Badge variant="default">Active</Badge>;
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto">
        <div className="rounded-lg">
          {/* SUCCESS TOAST */}
          {showSuccessToast && (
            <div className="fixed top-20 right-4 z-[100] animate-in slide-in-from-right duration-300">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Check className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">{successMessage}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={() => setShowSuccessToast(false)}
                      className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100"
                    >
                      <span className="sr-only">Dismiss</span>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ERROR MESSAGES */}
          {approveError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
              <div className="text-red-500 mr-2">⚠️</div>
              <p className="text-red-700">{approveError}</p>
              <button
                onClick={() => setApproveError("")}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Header Card */}
          <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200 mb-6">
            <div className="p-4 pb-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Credit Life Schemes
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage and track your credit life insurance schemes
              </p>
            </div>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleNewQuotation}
                  className="w-full sm:w-auto text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">New Credit Life Scheme</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SELECTION ACTIONS */}
          {selectedQuotations.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-blue-700 font-medium">
                  {selectedQuotations.size} scheme
                  {selectedQuotations.size !== 1 ? "s" : ""} selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleBulkApprove}
                  disabled={approvingQuotations.size > 0}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {approvingQuotations.size > 0 ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      Approving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Approve Selected ({selectedQuotations.size})
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Filters Section */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <div className="border rounded-lg mb-6 bg-gray-50">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 cursor-pointer">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Search Filter</span>
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {[
                          filterCriteria.searchValue,
                          filterCriteria.startDate,
                          filterCriteria.endDate,
                          filterCriteria.status !== "all" ? filterCriteria.status : null,
                          filterCriteria.schemeType !== "all" ? filterCriteria.schemeType : null,
                          filterCriteria.insuredType !== "all" ? filterCriteria.insuredType : null,
                        ].filter(Boolean).length} active
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearAllFilters();
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    )}
                    <Checkbox checked={filtersOpen} />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-1">
                      <label className="text-sm text-gray-600 mb-1 block">Search by</label>
                      <Select
                        value={filterCriteria.searchField}
                        onValueChange={(value) =>
                          setFilterCriteria((prev) => ({
                            ...prev,
                            searchField: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="companyName">Company Name</SelectItem>
                          <SelectItem value="quotationNumber">Scheme Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="lg:col-span-1">
                      <label className="text-sm text-gray-600 mb-1 block">Search text</label>
                      <Input
                        value={filterCriteria.searchValue}
                        onChange={(e) =>
                          setFilterCriteria((prev) => ({
                            ...prev,
                            searchValue: e.target.value,
                          }))
                        }
                        placeholder="Enter search text"
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <label className="text-sm text-gray-600 mb-1 block">Start Date</label>
                      <Input
                        type="date"
                        value={filterCriteria.startDate}
                        onChange={(e) =>
                          setFilterCriteria((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <label className="text-sm text-gray-600 mb-1 block">End Date</label>
                      <Input
                        type="date"
                        value={filterCriteria.endDate}
                        onChange={(e) =>
                          setFilterCriteria((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="lg:col-span-1 flex items-end">
                      <Button className="w-full bg-primary hover:bg-primary-blue" onClick={applyFilters}>
                        <Search className="w-4 h-4 mr-2" />
                        Apply
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Status</label>
                      <Select
                        value={filterCriteria.status}
                        onValueChange={(value) =>
                          setFilterCriteria((prev) => ({
                            ...prev,
                            status: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="prospect">Prospect</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline" className="w-full bg-transparent" onClick={clearAllFilters}>
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Data Display Area */}
          <div className="border border-border rounded-lg min-h-96 bg-white">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Loading credit life schemes...</p>
                <p className="text-gray-400 text-sm mt-2">Please wait while we fetch your data</p>
              </div>
            ) : itemsArray.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm font-medium mb-2">
                  {hasActiveFilters ? "No schemes match your filters" : "No credit life schemes found"}
                </p>
                <p className="text-xs">
                  {hasActiveFilters
                    ? "Try adjusting your search criteria or clear filters to see all schemes."
                    : "Create a new credit life scheme to get started."}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearAllFilters} className="mt-3">
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} className="h-4 w-4" />
                        </TableHead>
                        <TableHead>Scheme No.</TableHead>
                        <TableHead>Company Name</TableHead>
                        <TableHead className="text-right">Sum Assured</TableHead>
                        <TableHead className="text-right">Premium</TableHead>
                        <TableHead>Effective Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedQuotations.map((quote: any) => {
                        const quoteId = getQuotationId(quote);
                        const isSelected = selectedQuotations.has(quoteId);
                        const isApproving = approvingQuotations.has(quoteId);

                        return (
                          <TableRow
                            key={quoteId}
                            className={`${isSelected ? "bg-blue-50" : ""} ${
                              isApproving ? "opacity-60" : ""
                            } cursor-pointer hover:bg-blue-50/50 transition-colors`}
                            onClick={() => handleEditQuotation(quote)}
                          >
                            <TableCell>
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleSelectQuotation(quoteId)}
                                  className="h-4 w-4"
                                  disabled={isApproving}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="text-sm font-medium">{getQuotationNumber(quote)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-gray-900">{getCompanyName(quote)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium text-indigo-900">
                              {formatCurrency(quote.totalSumInsured || quote.sumAssured)}
                            </TableCell>
                            <TableCell className="text-right font-medium text-indigo-900">
                              {formatCurrency(quote.totalPremium)}
                            </TableCell>
                            <TableCell>{formatDate(quote.effectiveDate || quote.startDate)}</TableCell>
                            <TableCell>{getStatusBadge(quote.status)}</TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 bg-transparent border-green-300 text-green-700 hover:bg-green-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditQuotation(quote);
                                  }}
                                  disabled={isApproving}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 bg-transparent border-red-300 text-red-700 hover:bg-red-50"
                                  onClick={(e) => handleDeleteQuotation(quote, e)}
                                  disabled={isApproving}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
                    <div className="text-sm text-muted-foreground order-2 sm:order-1">
                      Showing {startItem + 1} to {endItem} of {effectiveTotalCount} entries | Page {currentPage} of {totalPages}
                      {selectedQuotations.size > 0 && ` | ${selectedQuotations.size} selected`}
                    </div>
                    <div className="flex items-center space-x-1 order-1 sm:order-2">
                      <Button variant="outline" size="sm" onClick={() => goToPage(1)} disabled={currentPage === 1} className="hidden sm:flex">
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(isMobile ? 3 : 5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          const maxPages = isMobile ? 3 : 5;
                          if (totalPages <= maxPages) {
                            pageNum = i + 1;
                          } else if (currentPage <= Math.floor(maxPages / 2) + 1) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - Math.floor(maxPages / 2)) {
                            pageNum = totalPages - maxPages + 1 + i;
                          } else {
                            pageNum = currentPage - Math.floor(maxPages / 2) + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="hidden sm:flex">
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Credit Life Scheme</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this scheme for{" "}
              <strong>{deletingQuotation ? getCompanyName(deletingQuotation) : ""}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteQuotation} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}