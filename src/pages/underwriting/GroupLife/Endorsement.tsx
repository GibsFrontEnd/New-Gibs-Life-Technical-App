
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
import { useGroupLifeList } from "../../../components/groupLife/useGroupLifeList";
import GroupLifeListFilters from "../../../components/groupLife/GroupLifeListFilters";
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

  const [selectedPolicies, setSelectedPolicies] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [processingEndorsements, setProcessingEndorsements] = useState<Set<string>>(new Set());
  const [processError, setProcessError] = useState("");

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const pageSize = 20;
  // search, filters and paging (server-side, every page) - see useGroupLifeList
  const list = useGroupLifeList({
    pageSize,
    onReset: () => {
      setSelectedPolicies(new Set());
      setIsAllSelected(false);
    },
  });
  const { filterCriteria, currentPage, setCurrentPage, clearAllFilters, hasActiveFilters } = list;

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
  dispatch(setCurrentQuotation(policy));
  const policyNumber = getPolicyNumber(policy);
  // ✅ Pass sourcePage as a query parameter
  navigate(`/underwriting/group-life-quotations/${encodeURIComponent(policyNumber)}?source=endorsements`);
};

  const confirmEndorsement = (policy: any) => {
  dispatch(setCurrentQuotation(policy));
  const policyNumber = getPolicyNumber(policy);
  // ✅ Pass sourcePage as a query parameter
  navigate(`/underwriting/group-life-quotations/${encodeURIComponent(policyNumber)}?source=endorsements`);
};

  const handleBulkEndorsement = (policy: any) => {
  dispatch(setCurrentQuotation(policy));
  const policyNumber = getPolicyNumber(policy);
  // ✅ Pass sourcePage as a query parameter
  navigate(`/underwriting/group-life-quotations/${encodeURIComponent(policyNumber)}?source=endorsements`);
};



  const getDisplayPolicies = () => {
    let filtered = policies || [];

    // search, status and dates are applied by the server across every page
    return filtered;
  };


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
                <FilePen className="h-10 w-10 shrink-0 rounded-xl bg-blue-50 p-2.5 text-[#155dfd]" />
                Group Life Endorsements
              </h2>
              <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
                Process reversal and additional endorsements for group life insurance policies
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Select policies to process endorsements. Choose between reversal or additional endorsement types.
              </p>
            </div>
            <CardContent className="px-0 pb-0 pt-4">
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

          <GroupLifeListFilters list={list} total={totalCount} loading={isLoading} />

          {/* Data Display Area */}
          <div className="min-h-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                          <TableHead className="hidden w-[130px] @3xl:table-cell">Effective</TableHead>
                          <TableHead className="w-[110px]">Status</TableHead>
                          <TableHead className="w-[120px] text-right">
                            <span className="sr-only">Actions</span>
                          </TableHead>
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
                              <TableCell>
                                <div className="flex min-w-0 items-center gap-3">
                                  <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600 @4xl:grid">
                                    <Building2 className="h-4 w-4" />
                                  </span>
                                  <div className="min-w-0">
                                    <div className="truncate font-semibold text-slate-900" title={getCompanyName(policy)}>
                                      {getCompanyName(policy) || "—"}
                                    </div>
                                    <div className="truncate text-xs text-slate-500">{getPolicyNumber(policy)}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="truncate font-semibold text-slate-900">
                                  {formatCurrency(policy.totalSumInsured || policy.sumAssured || policy.sumInsured)}
                                </div>
                                <div className="truncate text-xs text-slate-500">{formatCurrency(policy.totalPremium || policy.grossPremium)} premium</div>
                              </TableCell>
                              <TableCell className="hidden truncate @3xl:table-cell">{formatDate(policy.effectiveDate || policy.startDate || policy.transactionDate)}</TableCell>
                              <TableCell>{getStatusBadge(policy.status || policy.transSTATUS)}</TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="h-8 rounded-lg px-3"
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
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 px-5 py-3">
                    <div className="text-sm text-slate-500 order-2 sm:order-1">
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