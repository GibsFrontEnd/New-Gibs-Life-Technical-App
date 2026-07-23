
// @ts-nocheck

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../components/UI/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/UI/new-select";
import { Input } from "../../../components/UI/new-input";
import {
  Filter,
  Search,
  X,
  Building2,
  FileText,
  Check,
  Loader2,
  RefreshCw,
  FilePen,
  RotateCcw,
  Plus,
} from "lucide-react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "../../../components/UI/new-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from "../../../components/UI/table";
import { Badge } from "../../../components/UI/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/UI/card";
import { Label } from "../../../components/UI/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogSubTitle,
} from "../../../components/UI/dialog";
import { useAppDispatch, useAppSelector } from "../../../hooks/use-apps";
import {
  selectGroupLifePolicies,
  setCurrentQuotation,
  fetchGroupLifePolicies,
} from "../../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";
import { formatDate, formatCurrency } from "../../../utils/ui-utilities";
import { useToast } from "../../../hooks/use-toast";
import { Checkbox } from "../../../components/UI/checkbox";
import { SERVER_URL } from "../../../utils/constants";

interface GroupLifePolicy {
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
}

type EndorsementType = "REVERSAL" | "ADDITIONAL";

export default function Endorsement() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

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
    subRiskId: "all",
    tag: "GL",
  });

  const [selectedPolicies, setSelectedPolicies] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [processingEndorsements, setProcessingEndorsements] = useState<Set<string>>(new Set());
  const [processError, setProcessError] = useState("");

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Endorsement Dialog state
  const [showEndorsementDialog, setShowEndorsementDialog] = useState(false);
  const [selectedForEndorsement, setSelectedForEndorsement] = useState<any>(null);
  const [endorsementType, setEndorsementType] = useState<EndorsementType>("ADDITIONAL");
  const [endorsementReason, setEndorsementReason] = useState("");
  const [isProcessingEndorsement, setIsProcessingEndorsement] = useState(false);

  // Bulk endorsement dialog
  const [showBulkEndorsementDialog, setShowBulkEndorsementDialog] = useState(false);
  const [bulkEndorsementType, setBulkEndorsementType] = useState<EndorsementType>("ADDITIONAL");
  const [bulkEndorsementReason, setBulkEndorsementReason] = useState("");

  // Fetch policies
  useEffect(() => {
    dispatch(fetchGroupLifePolicies({
      page: currentPage,
      pageSize: pageSize,
      subRiskId: filterCriteria.subRiskId !== "all" ? filterCriteria.subRiskId : undefined,
    }));
  }, [dispatch, currentPage, pageSize, filterCriteria.subRiskId]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getPolicyId = (policy: any) => {
    return policy.id || policy.quoteID || policy.policyNo || policy.transGUID;
  };

  const getPolicyNumber = (policy: any) => {
    return policy.quotationNumber || policy.quoteNo || policy.policyNo || policy.transGUID;
  };

  const getCompanyName = (policy: any) => {
    return policy.companyName || policy.surName || policy.insuredName || policy.fullName || "";
  };

  const handleSelectPolicy = (policyId: string) => {
    const newSelected = new Set(selectedPolicies);
    if (newSelected.has(policyId)) {
      newSelected.delete(policyId);
    } else {
      newSelected.add(policyId);
    }
    setSelectedPolicies(newSelected);

    const displayPolicies = getDisplayPolicies();
    setIsAllSelected(newSelected.size === displayPolicies?.length);
  };

  const handleSelectAll = () => {
    const displayPolicies = getDisplayPolicies();
    if (isAllSelected) {
      setSelectedPolicies(new Set());
    } else {
      const allIds = new Set(displayPolicies.map((policy: any) => getPolicyId(policy)));
      setSelectedPolicies(allIds);
    }
    setIsAllSelected(!isAllSelected);
  };

  const handleEndorsement = (policy: any) => {
    setSelectedForEndorsement(policy);
    setEndorsementType("ADDITIONAL");
    setEndorsementReason("");
    setShowEndorsementDialog(true);
  };

  const confirmEndorsement = async () => {
    if (!selectedForEndorsement || !endorsementReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the endorsement",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessingEndorsement(true);
      const policyId = getPolicyId(selectedForEndorsement);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch(
        `${SERVER_URL}/api/v1/lifepolicyAdmin/endorsement`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            policyId: policyId,
            endorsementType: endorsementType,
            reason: endorsementReason,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to process endorsement");
      }

      toast({
        title: "Success",
        description: `${endorsementType === "REVERSAL" ? "Reversal" : "Additional"} endorsement processed for ${getCompanyName(selectedForEndorsement)}`,
        variant: "default",
      });

      setShowEndorsementDialog(false);
      setSelectedForEndorsement(null);
      setEndorsementReason("");

      dispatch(fetchGroupLifePolicies({
        page: currentPage,
        pageSize: pageSize,
        subRiskId: filterCriteria.subRiskId !== "all" ? filterCriteria.subRiskId : undefined,
      }));

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process endorsement",
        variant: "destructive",
      });
    } finally {
      setIsProcessingEndorsement(false);
    }
  };

  const handleBulkEndorsement = async () => {
    if (selectedPolicies.size === 0) return;

    if (!bulkEndorsementReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the bulk endorsement",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessError("");
      const policiesToEndorse = Array.from(selectedPolicies);
      setProcessingEndorsements(new Set(policiesToEndorse));

      let successCount = 0;
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      for (const policyId of policiesToEndorse) {
        try {
          const response = await fetch(
            `${SERVER_URL}/api/v1/lifepolicyAdmin/endorsement`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                policyId: policyId,
                endorsementType: bulkEndorsementType,
                reason: bulkEndorsementReason,
              }),
            }
          );

          if (response.ok) {
            successCount++;
          }
        } catch (err) {
          console.error(`Failed to endorse ${policyId}:`, err);
        }
      }

      if (successCount > 0) {
        setSuccessMessage(
          `Successfully processed ${successCount} out of ${policiesToEndorse.length} endorsements!`
        );
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 5000);
      }

      dispatch(fetchGroupLifePolicies({
        page: currentPage,
        pageSize: pageSize,
        subRiskId: filterCriteria.subRiskId !== "all" ? filterCriteria.subRiskId : undefined,
      }));

      setSelectedPolicies(new Set());
      setIsAllSelected(false);
      setShowBulkEndorsementDialog(false);
      setBulkEndorsementReason("");
      
    } catch (err) {
      setProcessError("Error during bulk endorsement: " + (err?.message || "Unknown error"));
    } finally {
      setProcessingEndorsements(new Set());
    }
  };

  const applyFilters = () => {
    setCurrentPage(1);
    setSelectedPolicies(new Set());
    setIsAllSelected(false);

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
      subRiskId: "all",
      tag: "GL",
    });
    setCurrentPage(1);
    setSelectedPolicies(new Set());
    setIsAllSelected(false);

    dispatch(fetchGroupLifePolicies({
      page: 1,
      pageSize: pageSize,
    }));
  };

  const getDisplayPolicies = () => {
    let filtered = policies || [];

    if (filterCriteria.searchValue) {
      const searchLower = filterCriteria.searchValue.toLowerCase();
      filtered = filtered.filter((policy: any) => {
        if (filterCriteria.searchField === "companyName") {
          return getCompanyName(policy)?.toLowerCase().includes(searchLower);
        } else {
          return getPolicyNumber(policy)?.toLowerCase().includes(searchLower);
        }
      });
    }

    if (filterCriteria.status !== "all") {
      filtered = filtered.filter((policy: any) => {
        const status = policy.status?.toUpperCase() || policy.transSTATUS?.toUpperCase();
        return status === filterCriteria.status.toUpperCase();
      });
    }

    if (filterCriteria.startDate) {
      filtered = filtered.filter((policy: any) => {
        const date = policy.effectiveDate || policy.startDate || policy.transactionDate;
        return date && date >= filterCriteria.startDate;
      });
    }

    if (filterCriteria.endDate) {
      filtered = filtered.filter((policy: any) => {
        const date = policy.effectiveDate || policy.startDate || policy.transactionDate;
        return date && date <= filterCriteria.endDate;
      });
    }

    return filtered;
  };

  const hasActiveFilters =
    filterCriteria.searchValue ||
    filterCriteria.startDate ||
    filterCriteria.endDate ||
    filterCriteria.status !== "all";

  const itemsForDisplay = getDisplayPolicies();
  const effectiveTotalCount = totalCount || itemsForDisplay.length;
  const totalPagesCount = totalPages || Math.max(1, Math.ceil(effectiveTotalCount / pageSize));
  const startItem = (currentPage - 1) * pageSize;
  const endItem = Math.min(currentPage * pageSize, effectiveTotalCount);
  const paginatedPolicies = itemsForDisplay;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPagesCount) {
      setCurrentPage(page);
      setSelectedPolicies(new Set());
      setIsAllSelected(false);
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

 const handleViewPolicy = (policy: any) => {
  dispatch(setCurrentQuotation(policy));
  const policyNumber = getPolicyNumber(policy);
  // ✅ Pass sourcePage as a query parameter
  navigate(`/underwriting/group-life-quotations/${encodeURIComponent(policyNumber)}?source=endorsements`);
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
                <FilePen className="w-5 h-5 text-blue-600" />
                Group Life Endorsements
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Process reversal and additional endorsements for group life insurance policies
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Select policies to process endorsements. Choose between reversal or additional endorsement types.
              </p>
            </div>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {selectedPolicies.size > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowBulkEndorsementDialog(true)}
                    disabled={processingEndorsements.size > 0}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {processingEndorsements.size > 0 ? (
                      <>
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FilePen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Endorse Selected ({selectedPolicies.size})
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
                          <SelectItem value="quotationNumber">Policy Number</SelectItem>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
                <p className="text-gray-600 font-medium">Loading policies...</p>
                <p className="text-gray-400 text-sm mt-2">Please wait while we fetch the data</p>
              </div>
            ) : itemsForDisplay.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FilePen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm font-medium mb-2">
                  {hasActiveFilters ? "No policies match your filters" : "No policies available"}
                </p>
                <p className="text-xs">
                  {hasActiveFilters ? "Try adjusting your search criteria or clear filters." : "All policies are up to date."}
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
                  <div>
                    {paginatedPolicies.map((policy: any) => (
                      <EndorsementCard
                        key={getPolicyId(policy)}
                        policy={policy}
                        onView={handleViewPolicy}
                        onEndorse={handleEndorsement}
                        onSelect={handleSelectPolicy}
                        isSelected={selectedPolicies.has(getPolicyId(policy))}
                        isProcessing={processingEndorsements.has(getPolicyId(policy))}
                      />
                    ))}
                  </div>
                ) : (
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
                          <TableHead>Policy No.</TableHead>
                          <TableHead>Company Name</TableHead>
                          <TableHead className="text-right">Sum Assured</TableHead>
                          <TableHead className="text-right">Premium</TableHead>
                          <TableHead>Effective Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedPolicies.map((policy: any) => {
                          const policyId = getPolicyId(policy);
                          const isSelected = selectedPolicies.has(policyId);
                          const isProcessing = processingEndorsements.has(policyId);

                          return (
                            <TableRow
                              key={policyId}
                              className={`${isSelected ? "bg-blue-50" : ""} ${
                                isProcessing ? "opacity-60" : ""
                              } hover:bg-blue-50/50 transition-colors`}
                            >
                              <TableCell>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => handleSelectPolicy(policyId)}
                                    className="h-4 w-4"
                                    disabled={isProcessing}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="text-sm font-medium">
                                  {getPolicyNumber(policy)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium text-gray-900">
                                    {getCompanyName(policy)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium text-blue-900">
                                {formatCurrency(policy.totalSumInsured || policy.sumAssured || policy.sumInsured)}
                              </TableCell>
                              <TableCell className="text-right font-medium text-blue-900">
                                {formatCurrency(policy.totalPremium || policy.grossPremium)}
                              </TableCell>
                              <TableCell>{formatDate(policy.effectiveDate || policy.startDate || policy.transactionDate)}</TableCell>
                              <TableCell>{getStatusBadge(policy.status || policy.transSTATUS)}</TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => handleViewPolicy(policy)}
                                    
                                  >
                                    
                                      <>
                                        <FilePen className="w-3 h-3 mr-1" />
                                        Endorse
                                      </>
                                   
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
                      Showing {startItem + 1} to {endItem} of {effectiveTotalCount} entries | Page {currentPage} of {totalPagesCount}
                      {selectedPolicies.size > 0 && ` | ${selectedPolicies.size} selected`}
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
                          { length: Math.min(isMobile ? 3 : 5, totalPagesCount) },
                          (_, i) => {
                            let pageNum: number;
                            const maxPages = isMobile ? 3 : 5;
                            if (totalPagesCount <= maxPages) {
                              pageNum = i + 1;
                            } else if (currentPage <= Math.floor(maxPages / 2) + 1) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPagesCount - Math.floor(maxPages / 2)) {
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

      {/* Single Endorsement Dialog */}
      <Dialog open={showEndorsementDialog} onOpenChange={setShowEndorsementDialog}>
        <DialogContent className="p-6 space-y-4">
          <DialogHeader>
            <DialogTitle>Process Endorsement</DialogTitle>
            <DialogSubTitle>
              {endorsementType === "REVERSAL" ? "Reversal" : "Additional"} endorsement for{" "}
              <strong>{selectedForEndorsement ? getCompanyName(selectedForEndorsement) : ""}</strong>
            </DialogSubTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Policy Number:</strong> {selectedForEndorsement ? getPolicyNumber(selectedForEndorsement) : ""}
              </p>
              <p className="text-sm text-blue-800 mt-1">
                <strong>Effective Date:</strong> {selectedForEndorsement ? formatDate(selectedForEndorsement.effectiveDate || selectedForEndorsement.startDate || selectedForEndorsement.transactionDate) : ""}
              </p>
              <p className="text-sm text-blue-800 mt-1">
                <strong>Status:</strong> {selectedForEndorsement ? getStatusBadge(selectedForEndorsement.status || selectedForEndorsement.transSTATUS) : ""}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endorsement-type" className="text-sm font-medium text-gray-700">
                Endorsement Type
              </Label>
              <Select
                value={endorsementType}
                onValueChange={(value) => setEndorsementType(value as EndorsementType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select endorsement type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADDITIONAL">
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-green-600" />
                      Additional Endorsement
                    </span>
                  </SelectItem>
                  <SelectItem value="REVERSAL">
                    <span className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-orange-600" />
                      Reversal Endorsement
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endorsement-reason" className="text-sm font-medium text-gray-700">
                Reason for Endorsement
              </Label>
              <Input
                id="endorsement-reason"
                value={endorsementReason}
                onChange={(e) => setEndorsementReason(e.target.value)}
                placeholder="Enter reason for endorsement"
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Please provide a clear reason for this endorsement action.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEndorsementDialog(false);
                setSelectedForEndorsement(null);
                setEndorsementReason("");
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmEndorsement}
              disabled={isProcessingEndorsement || !endorsementReason.trim()}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isProcessingEndorsement ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FilePen className="w-4 h-4 mr-2" />
                  Process Endorsement
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Endorsement Dialog */}
      <Dialog open={showBulkEndorsementDialog} onOpenChange={setShowBulkEndorsementDialog}>
        <DialogContent className="p-6 space-y-4">
          <DialogHeader>
            <DialogTitle>Bulk Endorsement</DialogTitle>
            <DialogSubTitle>
              Process endorsements for <strong>{selectedPolicies.size}</strong> selected policies
            </DialogSubTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Selected Policies:</strong> {selectedPolicies.size}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                All selected policies will receive the same endorsement type and reason.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-endorsement-type" className="text-sm font-medium text-gray-700">
                Endorsement Type
              </Label>
              <Select
                value={bulkEndorsementType}
                onValueChange={(value) => setBulkEndorsementType(value as EndorsementType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select endorsement type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADDITIONAL">
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-green-600" />
                      Additional Endorsement
                    </span>
                  </SelectItem>
                  <SelectItem value="REVERSAL">
                    <span className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-orange-600" />
                      Reversal Endorsement
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-endorsement-reason" className="text-sm font-medium text-gray-700">
                Reason for Endorsement
              </Label>
              <Input
                id="bulk-endorsement-reason"
                value={bulkEndorsementReason}
                onChange={(e) => setBulkEndorsementReason(e.target.value)}
                placeholder="Enter reason for bulk endorsement"
                className="w-full"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowBulkEndorsementDialog(false);
                setBulkEndorsementReason("");
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleBulkEndorsement}
              disabled={processingEndorsements.size > 0 || !bulkEndorsementReason.trim()}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              {processingEndorsements.size > 0 ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FilePen className="w-4 h-4 mr-2" />
                  Process All Endorsements
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
const EndorsementCard = ({
  policy,
  onView,
  onEndorse,
  onSelect,
  isSelected,
  isProcessing,
}: {
  policy: any;
  onView: (policy: any) => void;
  onEndorse: (policy: any) => void;
  onSelect: (policyId: string) => void;
  isSelected: boolean;
  isProcessing: boolean;
}) => {
  const getPolicyId = (policy: any) => {
    if (!policy) return "";
    return policy.id || policy.quoteID || policy.policyNo || policy.transGUID || "";
  };

  const getPolicyNumber = (policy: any) => {
    if (!policy) return "";
    return policy.quotationNumber || policy.quoteNo || policy.policyNo || policy.transGUID || "";
  };

  const getCompanyName = (policy: any) => {
    if (!policy) return "";
    return policy.companyName || policy.surName || policy.insuredName || policy.fullName || "";
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
                onCheckedChange={() => onSelect(getPolicyId(policy))}
                className="h-4 w-4"
                disabled={isProcessing}
              />
            </div>
            <CardTitle className="text-base font-medium">
              {getCompanyName(policy)}
            </CardTitle>
          </div>
          {getStatusBadge(policy.status || policy.transSTATUS)}
        </div>
        <div className="text-sm text-muted-foreground ml-7">
          {getPolicyNumber(policy)}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-medium text-muted-foreground">Sum Assured:</span>
            <div className="font-medium">
              {formatCurrency(policy.totalSumInsured || policy.sumAssured || policy.sumInsured)}
            </div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Premium:</span>
            <div className="font-medium">
              {formatCurrency(policy.totalPremium || policy.grossPremium)}
            </div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Effective Date:</span>
            <div>{formatDate(policy.effectiveDate || policy.startDate || policy.transactionDate)}</div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Members:</span>
            <div>{policy.totalMembers || 0}</div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent border-blue-300 text-blue-700 hover:bg-blue-50"
            onClick={() => onView(policy)}
          >
            <FileText className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => onEndorse(policy)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <FilePen className="w-4 h-4 mr-2" />
                Endorse
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};