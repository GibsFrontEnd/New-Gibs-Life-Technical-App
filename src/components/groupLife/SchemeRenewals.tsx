// src/pages/Underwriting/GroupLife/SchemeRenewals.tsx
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
  const [filterCriteria, setFilterCriteria] = useState({
    searchField: "companyName",
    searchValue: "",
    startDate: "",
    endDate: "",
    status: "all",
    renewalStatus: "all",
    subRiskId: "all",
    tag: "GL",
  });

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

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [selectedForRenewal, setSelectedForRenewal] = useState<any>(null);
  const [renewalDate, setRenewalDate] = useState("");
  const [isProcessingRenewal, setIsProcessingRenewal] = useState(false);

  // ✅ Fetch policies when component mounts or when page/filters change
  useEffect(() => {
    console.log("📊 Fetching group life policies for renewals...");

    dispatch(fetchGroupLifePolicies({
      page: currentPage,
      pageSize: pageSize,
      subRiskId: filterCriteria.subRiskId !== "all" ? filterCriteria.subRiskId : undefined,
    }));
  }, [dispatch, currentPage, pageSize, filterCriteria.subRiskId]);

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

  const handleProcessRenewal = async (quote: any) => {
    dispatch(setCurrentQuotation(quote));
    const quoteNumber = getQuotationNumber(quote);
    navigate(`/underwriting/group-life-quotations/${encodeURIComponent(quoteNumber)}`);
  };

  const confirmRenewal = async () => {
    if (!selectedForRenewal || !renewalDate) {
      toast({
        title: "Error",
        description: "Please select a renewal date",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessingRenewal(true);
      const quoteId = getQuotationId(selectedForRenewal);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch(
        `${SERVER_URL}/api/v1/lifepolicyAdmin/renew-scheme`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            quotationId: quoteId,
            renewalDate: renewalDate,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to process renewal");
      }

      toast({
        title: "Success",
        description: `Scheme ${getQuotationNumber(selectedForRenewal)} renewed successfully!`,
        variant: "default",
      });

      setShowRenewalDialog(false);
      setSelectedForRenewal(null);
      
      // ✅ Refresh the policies list
      dispatch(fetchGroupLifePolicies({
        page: currentPage,
        pageSize: pageSize,
        subRiskId: filterCriteria.subRiskId !== "all" ? filterCriteria.subRiskId : undefined,
      }));
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process renewal",
        variant: "destructive",
      });
    } finally {
      setIsProcessingRenewal(false);
    }
  };

  const handleBulkRenewal = async () => {
    if (selectedQuotations.size === 0) return;

    try {
      setProcessError("");
      const quotesToRenew = Array.from(selectedQuotations);
      setProcessingRenewals(new Set(quotesToRenew));

      let successCount = 0;
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      for (const quoteId of quotesToRenew) {
        try {
          const response = await fetch(
            `${SERVER_URL}/api/v1/lifepolicyAdmin/renew-scheme`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                quotationId: quoteId,
                renewalDate: new Date().toISOString().split('T')[0],
              }),
            }
          );

          if (response.ok) {
            successCount++;
          }
        } catch (err) {
          console.error(`Failed to renew ${quoteId}:`, err);
        }
      }

      if (successCount > 0) {
        setSuccessMessage(
          `Successfully renewed ${successCount} out of ${quotesToRenew.length} schemes!`
        );
        setShowSuccessToast(true);

        setTimeout(() => {
          setShowSuccessToast(false);
        }, 5000);
      }

      // ✅ Refresh the policies list
      dispatch(fetchGroupLifePolicies({
        page: currentPage,
        pageSize: pageSize,
        subRiskId: filterCriteria.subRiskId !== "all" ? filterCriteria.subRiskId : undefined,
      }));
      
      setSelectedQuotations(new Set());
      setIsAllSelected(false);
    } catch (err) {
      const errorMessage = err?.message || "Unknown error occurred";
      setProcessError("Error during bulk renewal: " + errorMessage);
    } finally {
      setProcessingRenewals(new Set());
    }
  };

  const applyFilters = () => {
    setCurrentPage(1);
    setSelectedQuotations(new Set());
    setIsAllSelected(false);

    // ✅ Fetch with filters
    dispatch(fetchGroupLifePolicies({
      page: 1,
      pageSize: pageSize,
      search: filterCriteria.searchValue || undefined,
      status: filterCriteria.status !== 'all' ? filterCriteria.status.toUpperCase() : undefined,
      fromDate: filterCriteria.startDate || undefined,
      toDate: filterCriteria.endDate || undefined,
      subRiskId: filterCriteria.subRiskId !== "all" ? filterCriteria.subRiskId : undefined,
    }));
  };

  const clearAllFilters = () => {
    setFilterCriteria({
      searchField: "companyName",
      searchValue: "",
      startDate: "",
      endDate: "",
      status: "all",
      renewalStatus: "all",
      subRiskId: "all",
      tag: "GL",
    });
    setCurrentPage(1);
    setSelectedQuotations(new Set());
    setIsAllSelected(false);

    // ✅ Reset to default fetch
    dispatch(fetchGroupLifePolicies({
      page: 1,
      pageSize: pageSize,
    }));
  };

  // ✅ Get policies from the slice state
  const itemsArray = policies || [];

  const getDisplayQuotations = () => {
    // Filter for schemes that are eligible for renewal (active or expiring soon)
    let filtered = itemsArray.filter((quote: any) => {
      const status = quote.status?.toUpperCase() || quote.transSTATUS?.toUpperCase();
      // Show schemes that are ACTIVE, PENDING, or PROSPECT for renewal
      return status === "ACTIVE" || status === "PENDING" || status === "PROSPECT";
    });

    // Apply additional filters
    if (filterCriteria.searchValue) {
      const searchLower = filterCriteria.searchValue.toLowerCase();
      filtered = filtered.filter((quote: any) => {
        if (filterCriteria.searchField === "companyName") {
          const name = getCompanyName(quote)?.toLowerCase() || "";
          return name.includes(searchLower);
        } else {
          return getQuotationNumber(quote)?.toLowerCase().includes(searchLower);
        }
      });
    }

    if (filterCriteria.status !== "all") {
      filtered = filtered.filter((quote: any) => {
        const status = quote.status?.toUpperCase() || quote.transSTATUS?.toUpperCase();
        return status === filterCriteria.status.toUpperCase();
      });
    }

    if (filterCriteria.startDate) {
      filtered = filtered.filter((quote: any) => {
        const date = quote.effectiveDate || quote.startDate || quote.transactionDate;
        return date && date >= filterCriteria.startDate;
      });
    }

    if (filterCriteria.endDate) {
      filtered = filtered.filter((quote: any) => {
        const date = quote.effectiveDate || quote.startDate || quote.transactionDate;
        return date && date <= filterCriteria.endDate;
      });
    }

    return filtered;
  };

  const hasActiveFilters =
    filterCriteria.searchValue ||
    filterCriteria.startDate ||
    filterCriteria.endDate ||
    filterCriteria.status !== "all" ||
    filterCriteria.renewalStatus !== "all";

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
      dispatch(fetchGroupLifePolicies({
        page: page,
        pageSize: pageSize,
        subRiskId: filterCriteria.subRiskId !== "all" ? filterCriteria.subRiskId : undefined,
      }));
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
      return <Badge variant="warning" className="bg-yellow-500 text-white">Expiring Soon ({daysUntilExpiry} days)</Badge>;
    } else {
      return <Badge variant="outline" className="border-green-500 text-green-700">Active ({daysUntilExpiry} days)</Badge>;
    }
  };


const handleViewScheme = (quote: any) => {
  dispatch(setCurrentQuotation(quote));
  const quoteNumber = getQuotationNumber(quote);
  // ✅ Make sure this is correct
  const url = `/underwriting/group-life-quotations/${encodeURIComponent(quoteNumber)}?source=renewals`;
  console.log('🔗 Navigating to:', url); // Add this to debug
  navigate(url);
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
          <Card className="bg-gradient-to-r from-gray-200 to-gray-200 border-white-200 mb-6">
            <div className="p-4 pb-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                Group Life Scheme Renewals
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage and process renewals for group life insurance schemes
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Schemes eligible for renewal are shown below. Renewals should be processed before the expiry date.
              </p>
            </div>
            <CardContent className="p-3 sm:p-4">
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
                          filterCriteria.renewalStatus !== "all" ? filterCriteria.renewalStatus : null,
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
                          <SelectItem value="companyName">Company Name</SelectItem>
                          <SelectItem value="quotationNumber">Scheme Number</SelectItem>
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
                          <TableHead>Scheme No.</TableHead>
                          <TableHead>Company Name</TableHead>
                          <TableHead className="text-right">Sum Assured</TableHead>
                          <TableHead className="text-right">Premium</TableHead>
                          <TableHead>Effective Date</TableHead>
                          <TableHead>Expiry Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Renewal Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
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
                              <TableCell className="font-medium">
                                <div className="text-sm font-medium">
                                  {getQuotationNumber(quote)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium text-gray-900">
                                    {getCompanyName(quote)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium text-blue-900">
                                {formatCurrency(quote.totalSumInsured || quote.sumAssured || quote.sumInsured)}
                              </TableCell>
                              <TableCell className="text-right font-medium text-blue-900">
                                {formatCurrency(quote.totalPremium || quote.grossPremium)}
                              </TableCell>
                              <TableCell>{formatDate(effectiveDate)}</TableCell>
                              <TableCell>
                                {expiryDate ? formatDate(expiryDate.toISOString()) : "N/A"}
                              </TableCell>
                              <TableCell>{getStatusBadge(quote.status || quote.transSTATUS)}</TableCell>
                              <TableCell>{getRenewalStatusBadge(effectiveDate)}</TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="h-8 bg-green-600 hover:bg-green-700 text-white"
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
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
                    <div className="text-sm text-muted-foreground order-2 sm:order-1">
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
      return <Badge variant="warning" className="bg-yellow-500 text-white">Expiring Soon ({daysUntilExpiry} days)</Badge>;
    } else {
      return <Badge variant="outline" className="border-green-500 text-green-700">Active ({daysUntilExpiry} days)</Badge>;
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