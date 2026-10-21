// src/pages/underwriting/GroupLife/SchemeRenewals.tsx
// @ts-nocheck

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../components/UI/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/UI/new-select";
import { Input } from "../../components/UI/new-input";
import {
  Filter,
  Search,
  X,
  Building2,
  FileText,
  Check,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "../../components/UI/new-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from "../../components/UI/table";
import { Badge } from "../../components/UI/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/UI/card";
import { Label } from "../../components/UI/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogSubTitle,
} from "../../components/UI/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/UI/alert-dialog";
import { useAppDispatch, useAppSelector } from "../../hooks/use-apps";
import { useGroupLifeList } from "./useGroupLifeList";
import GroupLifeListFilters from "./GroupLifeListFilters";
import {
  selectGroupLifePolicies,
  setCurrentQuotation,
  fetchGroupLifePolicies,
  fetchGroupLifePolicy,
} from "../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";
import { formatDate, formatCurrency } from "../../utils/ui-utilities";
import { useToast } from "../../hooks/use-toast";
import { Checkbox } from "../../components/UI/checkbox";
import { SERVER_URL } from "../../utils/constants";

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
  renewalDate?: string;
  renewalStatus?: "PENDING" | "COMPLETED" | "OVERDUE";
}

export default function SchemeRenewals() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  // ✅ Use selectGroupLifePolicies instead of selectGroupLifeQuotations
  const { policies, totalCount, totalPages, loading, error } = useAppSelector(selectGroupLifePolicies);
  const isLoading = loading || false;

  const [isMobile, setIsMobile] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [selectedQuotations, setSelectedQuotations] = useState<Set<string>>(
    new Set()
  );
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [processingRenewals, setProcessingRenewals] = useState<Set<string>>(
    new Set()
  );
  const [processError, setProcessError] = useState("");

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
  const { filterCriteria, currentPage, setCurrentPage, clearAllFilters, hasActiveFilters } = list;
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [selectedForRenewal, setSelectedForRenewal] = useState<any>(null);
  const [renewalDate, setRenewalDate] = useState("");
  const [isProcessingRenewal, setIsProcessingRenewal] = useState(false);

  // ✅ Fetch policies when component mounts or when page/filters change

  const getQuotationId = (quote: any) => {
    return quote.id || quote.quoteID || quote.policyNo || quote.transGUID;
  };

  const getQuotationNumber = (quote: any) => {
    return quote.quotationNumber || quote.quoteNo || quote.policyNo || quote.transGUID;
  };

  const getCompanyName = (quote: any) => {
    return quote.companyName || quote.surName || quote.insuredName || quote.fullName || "";
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

  const handleProcessRenewal =  (quote: any) => {
  dispatch(setCurrentQuotation(quote));
  const quoteNumber = getQuotationNumber(quote);
  // ✅ Make sure this is correct
  const url = `/underwriting/group-life-quotations/${encodeURIComponent(quoteNumber)}?source=renewals`;
  navigate(url);
};

  const confirmRenewal =  (quote: any) => {
  dispatch(setCurrentQuotation(quote));
  const quoteNumber = getQuotationNumber(quote);
  // ✅ Make sure this is correct
  const url = `/underwriting/group-life-quotations/${encodeURIComponent(quoteNumber)}?source=renewals`;
  navigate(url);
};

  const handleBulkRenewal =  (quote: any) => {
  dispatch(setCurrentQuotation(quote));
  const quoteNumber = getQuotationNumber(quote);
  // ✅ Make sure this is correct
  const url = `/underwriting/group-life-quotations/${encodeURIComponent(quoteNumber)}?source=renewals`;
  navigate(url);
};



  // ✅ Get policies from the slice state
  const itemsArray = policies || [];

  const getDisplayQuotations = () => {
    // Filter for schemes that are eligible for renewal (active or expiring soon)
    let filtered = itemsArray.filter((quote: any) => {
      const status = quote.status?.toUpperCase() || quote.transSTATUS?.toUpperCase();
      // Show schemes that are APPROVED, ACTIVE, PENDING, or PROSPECT for renewal (the API sets PENDING / APPROVED)
      return status === "APPROVED" || status === "ACTIVE" || status === "PENDING" || status === "PROSPECT";
    });

    // Apply additional filters
    // search, status and dates are applied by the server across every page
    return filtered;
  };


  const itemsForDisplay = getDisplayQuotations();
  const effectiveTotalCount = totalCount || itemsForDisplay.length;
  const totalPagesCount = totalPages || Math.max(1, Math.ceil(effectiveTotalCount / pageSize));
  const startItem = (currentPage - 1) * pageSize;
  const endItem = Math.min(currentPage * pageSize, effectiveTotalCount);
  const paginatedQuotations = itemsForDisplay;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPagesCount) {
      setCurrentPage(page);
      setSelectedQuotations(new Set());
      setIsAllSelected(false);

      // ✅ Fetch the new page
    }
  };

  const getStatusBadge = (status: string) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case "PROSPECT":
        return <Badge variant="outline">Prospect</Badge>;
      case "ACTIVE":
        return <Badge variant="default">Active</Badge>;
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>;
    }
  };

  const getRenewalStatusBadge = (effectiveDate: string) => {
    if (!effectiveDate) return <Badge variant="secondary">N/A</Badge>;
    
    const today = new Date();
    const expiry = new Date(effectiveDate);
    expiry.setFullYear(expiry.getFullYear() + 1);
    
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (daysUntilExpiry <= 30) {
      return <Badge className="border-amber-200 bg-amber-50 text-amber-700" title={`Expires in ${daysUntilExpiry} days`}>Due in {daysUntilExpiry}d</Badge>;
    } else {
      return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700" title={`Expires in ${daysUntilExpiry} days`}>{daysUntilExpiry}d left</Badge>;
    }
  };


const handleViewScheme = (quote: any) => {
  dispatch(setCurrentQuotation(quote));
  const quoteNumber = getQuotationNumber(quote);
  // ✅ Make sure this is correct
  const url = `/underwriting/group-life-quotations/${encodeURIComponent(quoteNumber)}?source=renewals`;
  navigate(url);
};

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
          {processError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
              <div className="text-red-500 mr-2">⚠️</div>
              <p className="text-red-700">{processError}</p>
              <button
                onClick={() => setProcessError("")}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Header Card */}
          <Card className="mb-6 border-0 bg-transparent shadow-none">
            <div className="p-0">
              <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                <RefreshCw className="h-10 w-10 shrink-0 rounded-xl bg-blue-50 p-2.5 text-[#155dfd]" />
                Group Life Scheme Renewals
              </h2>
              <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
                Manage and process renewals for group life insurance schemes
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Schemes eligible for renewal are shown below. Renewals should be processed before the expiry date.
              </p>
            </div>
            <CardContent className="px-0 pb-0 pt-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {selectedQuotations.size > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleBulkRenewal}
                    disabled={processingRenewals.size > 0}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                  >
                    {processingRenewals.size > 0 ? (
                      <>
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Renew Selected ({selectedQuotations.size})
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <GroupLifeListFilters list={list} total={totalCount} loading={isLoading} />

          {/* Data Display Area */}
          <div className="min-h-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
                <p className="text-gray-600 font-medium">
                  Loading schemes...
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Please wait while we fetch the data
                </p>
              </div>
            ) : itemsForDisplay.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <RefreshCw className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm font-medium mb-2">
                  {hasActiveFilters
                    ? "No schemes match your filters"
                    : "No schemes available for renewal"}
                </p>
                <p className="text-xs">
                  {hasActiveFilters
                    ? "Try adjusting your search criteria or clear filters."
                    : "All schemes are either cancelled or already renewed."}
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
                      <SchemeRenewalCard
                        key={getQuotationId(quote)}
                        quote={quote}
                        onView={handleViewScheme}
                        onRenew={handleProcessRenewal}
                        onSelect={handleSelectQuotation}
                        isSelected={selectedQuotations.has(getQuotationId(quote))}
                        isProcessing={processingRenewals.has(getQuotationId(quote))}
                      />
                    ))}
                  </div>
                ) : (
                  // Desktop table view
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
                          <TableHead className="w-[160px] text-right">Sum assured</TableHead>
                          <TableHead className="hidden w-[130px] @3xl:table-cell">Cover</TableHead>
                          <TableHead className="w-[130px]">Status</TableHead>
                          <TableHead className="w-[110px] text-right">
                            <span className="sr-only">Actions</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedQuotations.map((quote: any) => {
                          const quoteId = getQuotationId(quote);
                          const isSelected = selectedQuotations.has(quoteId);
                          const isProcessing = processingRenewals.has(quoteId);
                          const effectiveDate = quote.effectiveDate || quote.startDate || quote.transactionDate;
                          const expiryDate = effectiveDate ? new Date(effectiveDate) : null;
                          if (expiryDate) {
                            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                          }

                          return (
                            <TableRow
                              key={quoteId}
                              className={`${isSelected ? "bg-blue-50" : ""} ${
                                isProcessing ? "opacity-60" : ""
                              } hover:bg-blue-50/50 transition-colors`}
                            >
                              <TableCell>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() =>
                                      handleSelectQuotation(quoteId)
                                    }
                                    className="h-4 w-4"
                                    disabled={isProcessing}
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
                              <TableCell className="text-right">
                                <div className="truncate font-semibold text-slate-900">
                                  {formatCurrency(quote.totalSumInsured || quote.sumAssured || quote.sumInsured)}
                                </div>
                                <div className="truncate text-xs text-slate-500">{formatCurrency(quote.totalPremium || quote.grossPremium)} premium</div>
                              </TableCell>
                              <TableCell className="hidden @3xl:table-cell">
                                <div className="truncate text-slate-900">{formatDate(effectiveDate)}</div>
                                <div className="truncate text-xs text-slate-500">to {expiryDate ? formatDate(expiryDate.toISOString()) : "N/A"}</div>
                              </TableCell>
                              <TableCell>
                                <div className="flex min-w-0 flex-col items-start gap-1">
                                  {getStatusBadge(quote.status || quote.transSTATUS)}
                                  {getRenewalStatusBadge(effectiveDate)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="h-8 rounded-lg px-3"
                                    onClick={() => handleViewScheme(quote)}
                                    disabled={isProcessing}
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <>
                                        <RefreshCw className="w-3 h-3 mr-1" />
                                        Renew
                                      </>
                                    )}
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
                {totalPagesCount > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 px-5 py-3">
                    <div className="text-sm text-slate-500 order-2 sm:order-1">
                      Showing {startItem + 1} to {endItem} of{" "}
                      {effectiveTotalCount} entries | Page {currentPage} of{" "}
                      {totalPagesCount}
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

                      <div className="flex items-center space-x-1">
                        {Array.from(
                          {
                            length: Math.min(isMobile ? 3 : 5, totalPagesCount),
                          },
                          (_, i) => {
                            let pageNum: number;
                            const maxPages = isMobile ? 3 : 5;
                            if (totalPagesCount <= maxPages) {
                              pageNum = i + 1;
                            } else if (
                              currentPage <= Math.floor(maxPages / 2) + 1
                            ) {
                              pageNum = i + 1;
                            } else if (
                              currentPage >= totalPagesCount - Math.floor(maxPages / 2)
                            ) {
                              pageNum = totalPagesCount - maxPages + 1 + i;
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
                          }
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPagesCount}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(totalPagesCount)}
                        disabled={currentPage === totalPagesCount}
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

      {/* Renewal Dialog */}
      <Dialog open={showRenewalDialog} onOpenChange={setShowRenewalDialog}>
        <DialogContent className="p-6 space-y-4">
          <DialogHeader>
            <DialogTitle>Process Scheme Renewal</DialogTitle>
            <DialogSubTitle>
              Renew the group life scheme for{" "}
              <strong>{selectedForRenewal ? getCompanyName(selectedForRenewal) : ""}</strong>
            </DialogSubTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Scheme Number:</strong>{" "}
                {selectedForRenewal ? getQuotationNumber(selectedForRenewal) : ""}
              </p>
              <p className="text-sm text-blue-800 mt-1">
                <strong>Current Effective Date:</strong>{" "}
                {selectedForRenewal ? formatDate(selectedForRenewal.effectiveDate || selectedForRenewal.startDate || selectedForRenewal.transactionDate) : ""}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="renewal-date" className="text-sm font-medium text-gray-700">
                New Effective Date
              </Label>
              <Input
                id="renewal-date"
                type="date"
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                The new effective date should be the start date for the renewed scheme.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowRenewalDialog(false);
                setSelectedForRenewal(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmRenewal}
              disabled={isProcessingRenewal || !renewalDate}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
            >
              {isProcessingRenewal ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Renew Scheme
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Mobile Card Component
const SchemeRenewalCard = ({
  quote,
  onView,
  onRenew,
  onSelect,
  isSelected,
  isProcessing,
}: {
  quote: any;
  onView: (quote: any) => void;
  onRenew: (quote: any) => void;
  onSelect: (quoteId: string) => void;
  isSelected: boolean;
  isProcessing: boolean;
}) => {
  const getQuotationId = (quote: any) => {
    if (!quote) return "";
    return quote.id || quote.quoteID || quote.policyNo || quote.transGUID || "";
  };

  const getQuotationNumber = (quote: any) => {
    if (!quote) return "";
    return quote.quotationNumber || quote.quoteNo || quote.policyNo || quote.transGUID || "";
  };

  const getCompanyName = (quote: any) => {
    if (!quote) return "";
    return quote.companyName || quote.surName || quote.insuredName || quote.fullName || "";
  };

  const getStatusBadge = (status: string) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case "PROSPECT":
        return <Badge variant="outline">Prospect</Badge>;
      case "ACTIVE":
        return <Badge variant="default">Active</Badge>;
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>;
    }
  };

  const getRenewalStatusBadge = (effectiveDate: string) => {
    if (!effectiveDate) return <Badge variant="secondary">N/A</Badge>;
    
    const today = new Date();
    const expiry = new Date(effectiveDate);
    expiry.setFullYear(expiry.getFullYear() + 1);
    
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (daysUntilExpiry <= 30) {
      return <Badge className="border-amber-200 bg-amber-50 text-amber-700" title={`Expires in ${daysUntilExpiry} days`}>Due in {daysUntilExpiry}d</Badge>;
    } else {
      return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700" title={`Expires in ${daysUntilExpiry} days`}>{daysUntilExpiry}d left</Badge>;
    }
  };

  const effectiveDate = quote.effectiveDate || quote.startDate || quote.transactionDate;
  const expiryDate = effectiveDate ? new Date(effectiveDate) : null;
  if (expiryDate) {
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  }

  return (
    <Card
      className={`mb-4 hover:shadow-md transition-shadow ${
        isSelected ? "bg-blue-50 border-blue-200" : ""
      } ${isProcessing ? "opacity-60" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelect(getQuotationId(quote))}
                className="h-4 w-4"
                disabled={isProcessing}
              />
            </div>
            <CardTitle className="text-base font-medium">
              {getCompanyName(quote)}
            </CardTitle>
          </div>
          {getStatusBadge(quote.status || quote.transSTATUS)}
        </div>
        <div className="text-sm text-muted-foreground ml-7">
          {getQuotationNumber(quote)}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-medium text-muted-foreground">Sum Assured:</span>
            <div className="font-medium">
              {formatCurrency(quote.totalSumInsured || quote.sumAssured || quote.sumInsured)}
            </div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Premium:</span>
            <div className="font-medium">
              {formatCurrency(quote.totalPremium || quote.grossPremium)}
            </div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Effective Date:</span>
            <div>{formatDate(effectiveDate)}</div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Expiry Date:</span>
            <div>{expiryDate ? formatDate(expiryDate.toISOString()) : "N/A"}</div>
          </div>
          <div className="col-span-2">
            <span className="font-medium text-muted-foreground">Renewal Status:</span>
            <div className="mt-1">{getRenewalStatusBadge(effectiveDate)}</div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent border-blue-300 text-blue-700 hover:bg-blue-50"
            onClick={() => onView(quote)}
          >
            <FileText className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onRenew(quote)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Renew
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};