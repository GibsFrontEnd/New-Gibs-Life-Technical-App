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
import { PageHeader, StatusChip, btnIcon, btnPrimary, btnRow } from "../page/PageKit";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from "../UI/table";
import { Badge } from "../UI/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../UI/card";
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
import { useGroupLifeList } from "./useGroupLifeList";
import GroupLifeListFilters from "./GroupLifeListFilters";
import {
  selectGroupLifeQuotations,
  selectGroupLifePolicies,
  setCurrentQuotation,
  fetchGroupLifePolicy,
  createGroupLifePolicy,
  fetchGroupLifePolicies,
} from "../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";
import { formatDate, formatCurrency } from "../../utils/ui-utilities";
import { useToast } from "../../hooks/use-toast";
import { Checkbox } from "../UI/checkbox";
import { SERVER_URL } from "../../utils/constants";

// ✅ Updated interface to match API response
interface GroupLifeQuotation {
  id: string;
  quotationNumber: string;
  policyNo?: string;
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
  quoteID?: string;
  quoteNo?: string;
  surName?: string;
  startDate?: string;
  sumAssured?: number;
}

export default function GroupLifeQuotation() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  // ✅ totalPages now comes straight from the slice/selector — no client recompute
  const { policies, totalCount, totalPages, loading, error } = useAppSelector(selectGroupLifePolicies);
  const isLoading = loading || false;

  const [isMobile, setIsMobile] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ✅ Product options fetched from API to populate the subRiskId filter
  const [productOptions, setProductOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const response = await fetch(`${SERVER_URL}/v1/Products?PageNo=1&PageSize=100`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        const list = Array.isArray(data)
          ? data
          : data.data || data.items || data.records || data.results || [];
        // Only group-life products (RiskID "GL") belong on this screen.
        setProductOptions(
          list
            .filter((item: any) =>
              (item.riskID || item.riskId || item.RiskID)?.toString().trim().toUpperCase() === "GL"
            )
            .map((item: any) => ({
              id: item.productID || item.riskID || item.id,
              name: item.productName || item.description || item.name,
            }))
        );
      } catch (err) {
        console.error("Failed to fetch product options:", err);
      }
    };
    fetchProducts();
  }, []);

  const [selectedQuotations, setSelectedQuotations] = useState<Set<string>>(
    new Set()
  );
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [approvingQuotations, setApprovingQuotations] = useState<Set<string>>(
    new Set()
  );
  const [approveError, setApproveError] = useState("");

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const pageSize = 20;
  // search, filters and paging (server-side, every page) - see useGroupLifeList
  const list = useGroupLifeList({
    pageSize,
    onReset: () => {
      setSelectedQuotations(new Set());
      setIsAllSelected(false);
    },
  });
  const { filterCriteria, currentPage, setCurrentPage, refreshList, clearAllFilters, hasActiveFilters } = list;
  const [deletingQuotation, setDeletingQuotation] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showComplianceDialog, setShowComplianceDialog] = useState(false);
  const [complianceCompanyName, setComplianceCompanyName] = useState("");
  const [isGeneratingCompliance, setIsGeneratingCompliance] = useState(false);

  // ✅ Helper to get the ID from a quotation
  const getQuotationId = (quote: any) => {
    return quote.id || quote.quoteID || quote.policyNo;
  };

  // ✅ Helper to get the quotation number
  const getQuotationNumber = (quote: any) => {
    return quote.quotationNumber || quote.quoteNo || quote.policyNo;
  };

  // ✅ Helper to get company name
  const getCompanyName = (quote: any) => {
    return quote.companyName || quote.surName || quote.insuredName;
  };


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

      setSuccessMessage(`Quotation ${quoteNo} approved successfully!`);
      setShowSuccessToast(true);

      setTimeout(() => {
        setShowSuccessToast(false);
      }, 5000);

      // Refresh the policies list
      refreshList();

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
          `Successfully approved ${successCount} out of ${quotesToApprove.length} quotations!`
        );
        setShowSuccessToast(true);

        setTimeout(() => {
          setShowSuccessToast(false);
        }, 5000);
      }

      // Refresh the policies list
      refreshList();

      setSelectedQuotations(new Set());
      setIsAllSelected(false);
    } catch (err) {
      const errorMessage = err?.message || "Unknown error occurred";
      setApproveError("Error during bulk approval: " + errorMessage);
    } finally {
      setApprovingQuotations(new Set());
    }
  };



  // Get policies from the slice state
  const itemsArray = policies || [];

  const getDisplayQuotations = () => {
    let filtered = itemsArray;

    // The deployed list endpoint returns every product (fire, motor, ...) when no subRiskId is
    // sent; those have no group-life members or sections, so hide anything that isn't GL.
    if (productOptions.length > 0) {
      const groupLifeIds = new Set(productOptions.map((p) => String(p.id).trim().toUpperCase()));
      filtered = filtered.filter((quote: any) =>
        groupLifeIds.has(String(quote.subRiskId ?? quote.subRiskID ?? "").trim().toUpperCase())
      );
    }

    // Search, status and dates are applied by the server across every page (see useGroupLifeList).
    return filtered;
  };



  const itemsForDisplay = getDisplayQuotations();
  const effectiveTotalCount = totalCount || itemsForDisplay.length;
  const startItem = (currentPage - 1) * pageSize;
  // ✅ Server already returns one page at a time — don't re-slice a page-sized array
  const endItem = startItem + itemsForDisplay.length;
  const paginatedQuotations = itemsForDisplay;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setSelectedQuotations(new Set());
      setIsAllSelected(false);
    }
  };

  const handleEditQuotation = (quote: any) => {
    console.log("✏️ Editing quotation:", quote);

    // Get the policy number from the quote
    const quoteNumber = quote.policyNo || quote.quotationNumber || quote.quoteNo || quote.id;

    if (!quoteNumber) {
      toast({
        title: "Error",
        description: "Cannot edit: No policy number found",
        variant: "destructive",
      });
      console.error("❌ No policy number found in quote:", quote);
      return;
    }

    // Set the current quotation in Redux for the edit page to use
    dispatch(setCurrentQuotation(quote));

    // ✅ Navigate to edit page
    const encodedPolicyNo = encodeURIComponent(quoteNumber);
    const editPath = `/underwriting/group-life-quotations/${encodeURIComponent(quoteNumber)}`;

    console.log("🔄 Navigating to edit path:", editPath);
    navigate(editPath);
  };

  const handleNewQuotation = () => {
    console.log("🔄 handleNewQuotation - Starting navigation to create new quotation");

    // Clear any existing quotation
    dispatch(setCurrentQuotation(null));

    // ✅ Navigate to new quotation page
    navigate("/underwriting/group-life-quotations/new");
  };

  const handlePrintQuotation = (quote: any, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(setCurrentQuotation(quote));
    const quoteNumber = getQuotationNumber(quote);
    navigate(`/underwriting/group-life-quotations/${encodeURIComponent(quoteNumber)}`, {
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
      toast({
        title: "Info",
        description: "Delete functionality is not available. Please contact support.",
        variant: "default",
      });
      setShowDeleteDialog(false);
      setDeletingQuotation(null);
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

      const contentType = response.headers.get("Content-Type") || "";
      let fileExtension = ".docx";

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

  const getStatusBadge = (status: string) => (
    <StatusChip status={status} tone={status?.toUpperCase() === "PROSPECT" ? "blue" : undefined} />
  );

  return (
    <div className="min-h-full">
      <div className="mx-auto w-full max-w-[1400px]">
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
            <div className="mb-6 flex items-center rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
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
          <div className="mb-6">
            <PageHeader
              eyebrow="Group life"
              title="Group life schemes"
              description="Manage and track your group life insurance schemes."
              actions={
                <button type="button" onClick={handleNewQuotation} className={btnPrimary}>
                  <Plus className="h-4 w-4" />
                  New group life scheme
                </button>
              }
            />
            <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-relaxed text-slate-600">
              Nigeria Insurance Industry Reform Act (NIIRA) 2025 and Sections
              4(5) and 8 of the Pension Reform Act 2014 on Mandatory Insurance
              Coverage –
              <button
                type="button"
                onClick={handleOpenComplianceDialog}
                className="ml-1 font-semibold text-[#155dfd] underline underline-offset-2 hover:text-[#0f4fe0]"
              >
                Group Life Assurance
              </button>
              .
            </p>
          </div>

          {/* SELECTION ACTIONS */}
          {selectedQuotations.size > 0 && (
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
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

          <GroupLifeListFilters list={list} productOptions={productOptions} total={totalCount} loading={isLoading} />

          {/* Data Display Area */}
          <div className="min-h-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#155dfd]" />
                <p className="text-gray-600 font-medium">
                  Loading group life schemes...
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
                    ? "No schemes match your filters"
                    : "No schemes found"}
                </p>
                <p className="text-xs">
                  {hasActiveFilters
                    ? "Try adjusting your search criteria or clear filters to see all schemes."
                    : "Create a new group life scheme to get started."}
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
                        key={getQuotationId(quote)}
                        quote={quote}
                        onEdit={handleEditQuotation}
                        onApprove={handleApproveQuotation}
                        onDelete={handleDeleteQuotation}
                        onSelect={handleSelectQuotation}
                        isSelected={selectedQuotations.has(getQuotationId(quote))}
                        isApproving={approvingQuotations.has(getQuotationId(quote))}
                      />
                    ))}
                  </div>
                ) : (
                  // Desktop table view: six columns, so it fits beside the menu without sideways scrolling
                  <div className="overflow-x-auto">
                    <Table className="table-fixed">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-11 pr-0">
                            <Checkbox
                              checked={isAllSelected}
                              onCheckedChange={handleSelectAll}
                              className="h-4 w-4"
                            />
                          </TableHead>
                          <TableHead>Scheme</TableHead>
                          <TableHead className="hidden w-[170px] @5xl:table-cell">Product</TableHead>
                          <TableHead className="w-[160px] text-right">Sum insured</TableHead>
                          <TableHead className="hidden w-[130px] @3xl:table-cell">Cover</TableHead>
                          <TableHead className="w-[110px]">Status</TableHead>
                          <TableHead className="w-[84px] text-right">
                            <span className="sr-only">Actions</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedQuotations.map((quote: any) => {
                          const quoteId = getQuotationId(quote);
                          const isSelected = selectedQuotations.has(quoteId);
                          const isApproving = approvingQuotations.has(quoteId);
                          const start = quote.effectiveDate || quote.startDate || quote.entryDate;

                          return (
                            <TableRow
                              key={quoteId}
                              onClick={() => !isApproving && handleEditQuotation(quote)}
                              className={`${isSelected ? "bg-blue-50/60" : ""} ${isApproving ? "opacity-60" : ""} cursor-pointer`}
                            >
                              <TableCell className="pr-0">
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => handleSelectQuotation(quoteId)}
                                    className="h-4 w-4"
                                    disabled={isApproving}
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex min-w-0 items-center gap-3">
                                  <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600 @4xl:grid">
                                    <Building2 className="h-4 w-4" />
                                  </span>
                                  <div className="min-w-0">
                                    <div className="truncate font-semibold text-slate-900" title={getCompanyName(quote)}>
                                      {getCompanyName(quote) || "—"}
                                    </div>
                                    <div className="truncate text-xs text-slate-500">{getQuotationNumber(quote)}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="hidden @5xl:table-cell">
                                <div className="truncate text-slate-900" title={quote.subRiskName}>
                                  {quote.subRiskName || quote.subRiskId || "—"}
                                </div>
                                {quote.isProposal !== undefined && (
                                  <div className="text-xs text-slate-500">{quote.isProposal ? "Proposal" : "Policy"}</div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="truncate font-semibold text-slate-900">
                                  {formatCurrency(quote.totalSumInsured || quote.sumInsured || quote.sumAssured)}
                                </div>
                                <div className="truncate text-xs text-slate-500">
                                  {formatCurrency(quote.totalPremium || quote.grossPremium)} premium
                                </div>
                              </TableCell>
                              <TableCell className="hidden @3xl:table-cell">
                                <div className="truncate text-slate-900">{formatDate(start)}</div>
                                {quote.expiryDate && <div className="truncate text-xs text-slate-500">to {formatDate(quote.expiryDate)}</div>}
                              </TableCell>
                              <TableCell>{getStatusBadge(quote.status)}</TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    title="Open scheme"
                                    aria-label="Open scheme"
                                    className={btnIcon}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditQuotation(quote);
                                    }}
                                    disabled={isApproving}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Print"
                                    aria-label="Print"
                                    className={btnIcon}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePrintQuotation(quote, e);
                                    }}
                                    disabled={isApproving}
                                  >
                                    <Printer className="h-3.5 w-3.5" />
                                  </button>
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
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 px-5 py-3">
                    <div className="text-sm text-slate-500 order-2 sm:order-1">
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
            <AlertDialogTitle>Delete Group Life Scheme</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this scheme for{" "}
              <strong>
                {deletingQuotation ? getCompanyName(deletingQuotation) : ""}
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
  const getQuotationId = (quote: any) => {
    if (!quote) return "";
    return quote.id || quote.quoteID || quote.policyNo || "";
  };

  const getQuotationNumber = (quote: any) => {
    if (!quote) return "";
    return quote.quotationNumber || quote.quoteNo || quote.policyNo || "";
  };

  const getCompanyName = (quote: any) => {
    if (!quote) return "";
    return quote.companyName || quote.surName || quote.insuredName || "";
  };

  const getStatusBadge = (status: string) => (
    <StatusChip status={status} tone={status?.toUpperCase() === "PROSPECT" ? "blue" : undefined} />
  );

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
                onCheckedChange={() => onSelect(getQuotationId(quote))}
                className="h-4 w-4"
                disabled={isApproving}
              />
            </div>
            <CardTitle className="text-base font-medium">
              {getCompanyName(quote)}
            </CardTitle>
          </div>
          {getStatusBadge(quote.status)}
        </div>
        <div className="text-sm text-muted-foreground ml-7">
          {getQuotationNumber(quote)}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-medium text-muted-foreground">
              Sum Assured:
            </span>
            <div className="font-medium">
              {formatCurrency(quote.totalSumInsured || quote.sumInsured || quote.sumAssured)}
            </div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Premium:</span>
            <div className="font-medium">
              {formatCurrency(quote.totalPremium || quote.grossPremium)}
            </div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">
              Effective Date:
            </span>
            <div>{formatDate(quote.effectiveDate || quote.startDate || quote.entryDate)}</div>
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