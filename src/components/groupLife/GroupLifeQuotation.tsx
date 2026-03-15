// @ts-nocheck

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../UI/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../UI/new-select";
import { Input } from "../UI/new-input";
import {
  Filter,
  Search,
  X,
  Calendar,
  Building2,
  FileText,
  Check,
  Pencil,
  Download,
  Loader2,
} from "lucide-react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";
import { Button } from "../UI/new-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../UI/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogSubTitle,
} from "../UI/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../UI/alert-dialog";
import { useAppDispatch, useAppSelector } from "../../hooks/use-apps";
import {
  fetchGroupLifeQuotations,
  fetchGroupLifeQuotationsByAgent,
  selectGroupLifeQuotations,
  setCurrentQuotation,
  deleteGroupLifeQuotation,
} from "../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";
import { formatDate, formatCurrency } from "../../utils/ui-utilities";
import { useToast } from "../../hooks/use-toast";
import { Checkbox } from "../UI/checkbox";
import { SERVER_URL } from "../../utils/constants";

interface GroupLifeQuotation {
  quoteID: string;
  quotationNumber: string;
  companyName: string;
  transactionDate: string;
  effectiveDate: string;
  expiryDate: string;
  totalMembers: number;
  totalSumInsured: number;
  totalPremium: number;
  status: "PROSPECT" | "ACTIVE" | "PENDING" | "CANCELLED";
  groupFactorAmount: number;
  loadingPercentage: number;
}

export default function GroupLifeQuotation() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { quotations, loading, totalCount } = useAppSelector(
    selectGroupLifeQuotations
  );
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
    tag: "GL",
  });

  // NEW STATE FOR CHECKBOXES AND APPROVAL
  const [selectedQuotations, setSelectedQuotations] = useState<Set<string>>(
    new Set()
  );
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [approvingQuotations, setApprovingQuotations] = useState<Set<string>>(
    new Set()
  );
  const [approveError, setApproveError] = useState("");

  // Toast states
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [deletingQuotation, setDeletingQuotation] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showComplianceDialog, setShowComplianceDialog] = useState(false);
  const [complianceCompanyName, setComplianceCompanyName] = useState("");
  const [isGeneratingCompliance, setIsGeneratingCompliance] = useState(false);

  // Helper function to refresh quotations based on user type
  const refreshQuotations = () => {
    const agentId = localStorage.getItem("agentId");

    if (agentId) {
      console.log("🔄 Refreshing group life quotations for agent:", agentId);
      dispatch(
        fetchGroupLifeQuotationsByAgent({
          agentCode: agentId,
          page: currentPage,
          pageSize,
        })
      );
    } else {
      console.log("🔄 Refreshing all group life quotations");
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

    console.log(
      "🔍 GroupLifeQuotation - Retrieved agentId from localStorage:",
      agentId
    );

    if (agentId) {
      // If user is logged in as agent, fetch their group life quotations using the dedicated endpoint
      console.log(
        "✅ GroupLifeQuotation - Calling agent-specific endpoint:",
        "agentId:",
        agentId,
        "page:",
        currentPage,
        "pageSize:",
        pageSize
      );
      dispatch(
        fetchGroupLifeQuotationsByAgent({
          agentCode: agentId,
          page: currentPage,
          pageSize,
        })
      );
    } else {
      // If user is admin/manager, fetch all group life quotations
      console.warn("⚠️ No agent ID found - fetching all group life quotations");
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

  // NEW: Checkbox handlers
  const handleSelectQuotation = (quoteId: string) => {
    const newSelected = new Set(selectedQuotations);
    if (newSelected.has(quoteId)) {
      newSelected.delete(quoteId);
    } else {
      newSelected.add(quoteId);
    }
    setSelectedQuotations(newSelected);

    // Update all selected state
    const displayQuotations = getDisplayQuotations();
    setIsAllSelected(newSelected.size === displayQuotations?.length);
  };

  const handleSelectAll = () => {
    const displayQuotations = getDisplayQuotations();

    if (isAllSelected) {
      setSelectedQuotations(new Set());
    } else {
      const allIds = new Set(
        displayQuotations.map((quote: any) => quote.quoteID)
      );
      setSelectedQuotations(allIds);
    }
    setIsAllSelected(!isAllSelected);
  };

  // NEW: Handle individual quotation approval
  const handleApproveQuotation = async (quoteId: string, quoteNo: string) => {
    if (!quoteId) {
      setApproveError("Invalid quotation ID");
      return;
    }

    try {
      setApprovingQuotations((prev) => new Set(prev).add(quoteId));
      setApproveError("");

      // TODO: Replace with your actual API call
      // await apiService.approveQuotation(quoteId);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show success message
      setSuccessMessage(`Quotation ${quoteNo} approved successfully!`);
      setShowSuccessToast(true);

      // Auto hide success toast after 5 seconds
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 5000);

      // If successful, refresh the data
      refreshQuotations();

      // Remove from selected quotations
      const newSelected = new Set(selectedQuotations);
      newSelected.delete(quoteId);
      setSelectedQuotations(newSelected);
    } catch (err) {
      const errorMessage = err?.message || "Unknown error occurred";
      setApproveError("Failed to approve quotation: " + errorMessage);
      console.error("Error approving quotation:", err);
    } finally {
      setApprovingQuotations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(quoteId);
        return newSet;
      });
    }
  };

  // NEW: Handle bulk approval of selected quotations
  const handleBulkApprove = async () => {
    if (selectedQuotations.size === 0) return;

    try {
      setApproveError("");

      // Convert Set to Array for easier iteration
      const quotesToApprove = Array.from(selectedQuotations);

      // Add all to approving set
      setApprovingQuotations(new Set(quotesToApprove));

      let successCount = 0;

      // Approve each quote sequentially
      for (const quoteId of quotesToApprove) {
        try {
          // TODO: Replace with your actual API call
          // await apiService.approveQuotation(quoteId);
          await new Promise((resolve) => setTimeout(resolve, 500));
          successCount++;
        } catch (err) {
          console.error(`Failed to approve ${quoteId}:`, err);
          // Continue with next even if one fails
        }
      }

      // Show success message
      if (successCount > 0) {
        setSuccessMessage(
          `Successfully approved ${successCount} out of ${quotesToApprove.length} quotations!`
        );
        setShowSuccessToast(true);

        // Auto hide success toast after 5 seconds
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 5000);
      }

      // Refresh data after all approvals
      refreshQuotations();

      // Clear selection
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
    // Clear selection when filters change
    setSelectedQuotations(new Set());
    setIsAllSelected(false);
    setCurrentPage(1);
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
      tag: "GL",
    });
    setCurrentPage(1);
    // Clear selection when clearing filters
    setSelectedQuotations(new Set());
    setIsAllSelected(false);
    refreshQuotations();
  };

  // Normalize quotations payload
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
    return itemsArray;
  };

  const hasActiveFilters =
    filterCriteria.searchValue ||
    filterCriteria.startDate ||
    filterCriteria.endDate ||
    filterCriteria.status !== "all" ||
    filterCriteria.schemeType !== "all" ||
    filterCriteria.insuredType !== "all";

  // Use filtered GL items for pagination / counts
  const itemsForDisplay = itemsArray;
  const effectiveTotalCount = itemsForDisplay.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotalCount / pageSize));
  const startItem = (currentPage - 1) * pageSize;
  const endItem = Math.min(currentPage * pageSize, effectiveTotalCount);
  const paginatedQuotations = itemsForDisplay.slice(startItem, endItem);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Clear selection when changing page
      setSelectedQuotations(new Set());
      setIsAllSelected(false);
    }
  };

  const handleEditQuotation = (quote: any) => {
    dispatch(setCurrentQuotation(quote));
    navigate(`/quotations/group-life/${quote.quoteNo}`);
  };

  const handleNewQuotation = () => {
    dispatch(setCurrentQuotation(null));
    navigate(`/quotations/group-life/${"new"}`);
  };

  const handlePrintQuotation = (quote: any, e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to the quotation detail page and trigger print
    dispatch(setCurrentQuotation(quote));
    navigate(`/quotations/group-life/${quote.quoteNo}`, {
      state: { print: true },
    });
  };

  const handleDeleteQuotation = (quote: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingQuotation(quote);
    setShowDeleteDialog(true);
  };

  const confirmDeleteQuotation = async () => {
    if (!deletingQuotation) return;

    try {
      await dispatch(
        deleteGroupLifeQuotation(deletingQuotation.quoteNo)
      ).unwrap();

      toast({
        title: "Success",
        description: "Quotation deleted successfully",
        variant: "default",
      });

      // Refresh the quotations list
      refreshQuotations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete quotation",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setDeletingQuotation(null);
    }
  };

  const handleOpenComplianceDialog = () => {
    setComplianceCompanyName("");
    setShowComplianceDialog(true);
  };

  const handleDownloadCompliance = async () => {
    const trimmedName = complianceCompanyName.trim();

    if (!trimmedName) {
      toast({
        title: "Company name required",
        description: "Please enter a company name to generate the mandate.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingCompliance(true);
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch(
        `${SERVER_URL}/Reports/generate-business-proposal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ companyName: trimmedName }),
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to generate compliance document";
        try {
          const errorBody = await response.json();
          errorMessage = errorBody?.message || errorMessage;
        } catch (parseError) {
          // Ignore parse errors and use default message
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();

      if (!blob || blob.size === 0) {
        throw new Error("Received an empty document");
      }

      // Determine file extension from Content-Type header
      const contentType = response.headers.get("Content-Type") || "";
      let fileExtension = ".docx"; // Default to docx

      if (contentType.includes("application/pdf")) {
        fileExtension = ".pdf";
      } else if (
        contentType.includes(
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
      ) {
        fileExtension = ".docx";
      } else if (contentType.includes("application/msword")) {
        fileExtension = ".doc";
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = trimmedName.replace(/[^a-z0-9]+/gi, "_");
      link.download = `${
        safeName || "group_life"
      }-group-life-assurance${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download ready",
        description: "The Group Life Assurance mandate has been downloaded.",
      });

      setShowComplianceDialog(false);
      setComplianceCompanyName("");
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message || "Unable to download mandate",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCompliance(false);
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
    <div className="min-h-screen ">
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
                    <p className="text-sm font-medium text-green-800">
                      {successMessage}
                    </p>
                  </div>
                  <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                      <button
                        onClick={() => setShowSuccessToast(false)}
                        className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                      >
                        <span className="sr-only">Dismiss</span>
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
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
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Header Card */}
          <Card className="bg-gradient-to-r from-gray-200 to-gray-200 border-white-200 mb-6">
            <div className="p-4 pb-0">
              <h2 className="text-xl font-bold text-gray-900">
                Group Life Quotations
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage and track your group life insurance quotations
              </p>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Nigeria Insurance Industry Reform Act (NIIRA) 2025 and Sections
                4(5) and 8 of the Pension Reform Act 2014 on Mandatory Insurance
                Coverage –
                <button
                  type="button"
                  onClick={handleOpenComplianceDialog}
                  className="ml-1 text-blue-700 font-semibold underline underline-offset-2 hover:text-blue-800"
                >
                  Group Life Assurance
                </button>
                .
              </p>
            </div>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleNewQuotation}
                  className="w-full sm:w-auto text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">New Quotation</span>
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
                  {selectedQuotations.size} quotation
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
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800"
                      >
                        {
                          [
                            filterCriteria.searchValue,
                            filterCriteria.startDate,
                            filterCriteria.endDate,
                            filterCriteria.status !== "all"
                              ? filterCriteria.status
                              : null,
                            filterCriteria.schemeType !== "all"
                              ? filterCriteria.schemeType
                              : null,
                            filterCriteria.insuredType !== "all"
                              ? filterCriteria.insuredType
                              : null,
                          ].filter(Boolean).length
                        }{" "}
                        active
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
                      <label className="text-sm text-gray-600 mb-1 block">
                        Search by
                      </label>
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
                          <SelectItem value="companyName">
                            Company Name
                          </SelectItem>
                          <SelectItem value="quotationNumber">
                            Quotation Number
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="lg:col-span-1">
                      <label className="text-sm text-gray-600 mb-1 block">
                        Search text
                      </label>
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
                      <label className="text-sm text-gray-600 mb-1 block">
                        Start Date
                      </label>
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
                      <label className="text-sm text-gray-600 mb-1 block">
                        End Date
                      </label>
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
                      <Button
                        className="w-full bg-primary hover:bg-primary-blue"
                        onClick={applyFilters}
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Apply
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">
                        Status
                      </label>
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
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={clearAllFilters}
                      >
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
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
                <p className="text-gray-600 font-medium">
                  Loading group life quotations...
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Please wait while we fetch your data
                </p>
              </div>
            ) : itemsArray.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm font-medium mb-2">
                  {hasActiveFilters
                    ? "No quotations match your filters"
                    : "No quotations found"}
                </p>
                <p className="text-xs">
                  {hasActiveFilters
                    ? "Try adjusting your search criteria or clear filters to see all quotations."
                    : "Create a new quotation to get started."}
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    className="mt-3 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-4">
                {isMobile ? (
                  // Mobile card view
                  <div>
                    {paginatedQuotations.map((quote: any) => (
                      <GroupLifeQuotationCard
                        key={quote.quoteID}
                        quote={quote}
                        onEdit={handleEditQuotation}
                        onApprove={handleApproveQuotation}
                        onDelete={handleDeleteQuotation}
                        onSelect={handleSelectQuotation}
                        isSelected={selectedQuotations.has(quote.quoteID)}
                        isApproving={approvingQuotations.has(quote.quoteID)}
                      />
                    ))}
                  </div>
                ) : (
                  // Desktop table view
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={isAllSelected}
                              onCheckedChange={handleSelectAll}
                              className="h-4 w-4"
                            />
                          </TableHead>
                          <TableHead>Quotation No.</TableHead>
                          <TableHead>Company Name</TableHead>
                          <TableHead className="text-right">
                            Sum Assured
                          </TableHead>
                          <TableHead className="text-right">Premium</TableHead>
                          <TableHead>Effective Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedQuotations.map((quote: any) => {
                          const isSelected = selectedQuotations.has(
                            quote.quoteID
                          );
                          const isApproving = approvingQuotations.has(
                            quote.quoteID
                          );

                          return (
                            <TableRow
                              key={quote.quoteID}
                              className={`${isSelected ? "bg-blue-50" : ""} ${
                                isApproving ? "opacity-60" : ""
                              } cursor-pointer hover:bg-blue-50/50 border-blue-100 transition-colors`}
                              onClick={() => handleEditQuotation(quote)}
                            >
                              <TableCell>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() =>
                                      handleSelectQuotation(quote.quoteID)
                                    }
                                    className="h-4 w-4"
                                    disabled={isApproving}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="space-y-1">
                                  <div className="text-sm font-medium">
                                    {quote.quotationNumber || quote.quoteNo}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {quote.quoteID}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium text-gray-900 flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    {quote.companyName || quote.surName}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium text-blue-900">
                                {formatCurrency(
                                  quote.totalSumInsured || quote.sumAssured
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium text-blue-900">
                                {formatCurrency(quote.totalPremium)}
                              </TableCell>
                              <TableCell className="text-gray-700">
                                {formatDate(
                                  quote.effectiveDate || quote.startDate
                                )}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(quote.status)}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  {/* Edit Button */}
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

                                  {/* Delete Button */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 bg-transparent border-red-300 text-red-700 hover:bg-red-50"
                                    onClick={(e) =>
                                      handleDeleteQuotation(quote, e)
                                    }
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
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
                    <div className="text-sm text-muted-foreground order-2 sm:order-1">
                      Showing {startItem + 1} to {endItem} of{" "}
                      {effectiveTotalCount} entries | Page {currentPage} of{" "}
                      {totalPages}
                      {selectedQuotations.size > 0 &&
                        ` | ${selectedQuotations.size} selected`}
                    </div>

                    <div className="flex items-center space-x-1 order-1 sm:order-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                        className="hidden sm:flex"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      {/* Page numbers - responsive */}
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
                            } else if (
                              currentPage <=
                              Math.floor(maxPages / 2) + 1
                            ) {
                              pageNum = i + 1;
                            } else if (
                              currentPage >=
                              totalPages - Math.floor(maxPages / 2)
                            ) {
                              pageNum = totalPages - maxPages + 1 + i;
                            } else {
                              pageNum =
                                currentPage - Math.floor(maxPages / 2) + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  currentPage === pageNum
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => goToPage(pageNum)}
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
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="hidden sm:flex"
                      >
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

      {/* Compliance Download Dialog */}
      <Dialog
        open={showComplianceDialog}
        onOpenChange={setShowComplianceDialog}
      >
        <DialogContent className="p-6 space-y-4">
          <DialogHeader>
            <DialogTitle>Group Life Assurance Mandate</DialogTitle>
            <DialogSubTitle>
              Provide the company name to download the mandatory Group Life
              Assurance documentation required by NIIRA 2025.
            </DialogSubTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Label
              htmlFor="compliance-company-name"
              className="text-sm font-medium text-gray-700"
            >
              Company Name
            </Label>
            <Input
              id="compliance-company-name"
              placeholder="e.g. Acme Holdings Limited"
              value={complianceCompanyName}
              onChange={(e) => setComplianceCompanyName(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowComplianceDialog(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={handleDownloadCompliance}
              disabled={isGeneratingCompliance}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isGeneratingCompliance ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group Life Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quotation for{" "}
              <strong>
                {deletingQuotation?.companyName || deletingQuotation?.surName}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteQuotation}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Group Life Quotation Card Component for Mobile View
const GroupLifeQuotationCard = ({
  quote,
  onEdit,
  onApprove,
  onDelete,
  onSelect,
  isSelected,
  isApproving,
}: {
  quote: any;
  onEdit: (quote: any) => void;
  onApprove: (quoteId: string, quoteNo: string) => void;
  onDelete: (quote: any, e: React.MouseEvent) => void;
  onSelect: (quoteId: string) => void;
  isSelected: boolean;
  isApproving: boolean;
}) => {
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
    <Card
      className={`mb-4 hover:shadow-md transition-shadow ${
        isSelected ? "bg-blue-50 border-blue-200" : ""
      } ${isApproving ? "opacity-60" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelect(quote.quoteID)}
                className="h-4 w-4"
                disabled={isApproving}
              />
            </div>
            <CardTitle className="text-base font-medium">
              {quote.companyName || quote.surName}
            </CardTitle>
          </div>
          {getStatusBadge(quote.status)}
        </div>
        <div className="text-sm text-muted-foreground ml-7">
          {quote.quotationNumber || quote.quoteNo}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-medium text-muted-foreground">
              Sum Assured:
            </span>
            <div className="font-medium">
              {formatCurrency(quote.totalSumInsured || quote.sumAssured)}
            </div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Premium:</span>
            <div className="font-medium">
              {formatCurrency(quote.totalPremium)}
            </div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">
              Effective Date:
            </span>
            <div>{formatDate(quote.effectiveDate || quote.startDate)}</div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">
              Expiry Date:
            </span>
            <div>{formatDate(quote.expiryDate)}</div>
          </div>
        </div>
        {/* Action buttons for mobile */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent border-red-300 text-red-700 hover:bg-red-50"
            onClick={(e) => onDelete(quote, e)}
            disabled={isApproving}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => onEdit(quote)}
            disabled={isApproving}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
