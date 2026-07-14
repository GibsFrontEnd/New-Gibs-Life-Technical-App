// src/pages/Underwriting/CreditLife/CreditLifeSchemeRenewals.tsx
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
  Loader2,
  RefreshCw,
  CreditCard,
} from "lucide-react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
import { Label } from "../../UI/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogSubTitle,
} from "../../UI/dialog";
import { formatDate, formatCurrency } from "../../../utils/ui-utilities";
import { useToast } from "../../../hooks/use-toast";
import { Checkbox } from "../../UI/checkbox";
import { SERVER_URL } from "../../../utils/constants";

export default function CreditLifeSchemeRenewals() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Local state instead of Redux
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    searchField: "companyName",
    searchValue: "",
    startDate: "",
    endDate: "",
    status: "all",
  });

  const [selectedQuotations, setSelectedQuotations] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [processingRenewals, setProcessingRenewals] = useState<Set<string>>(new Set());
  const [processError, setProcessError] = useState("");

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [selectedForRenewal, setSelectedForRenewal] = useState<any>(null);
  const [renewalDate, setRenewalDate] = useState("");
  const [isProcessingRenewal, setIsProcessingRenewal] = useState(false);

  const getQuotationId = (quote: any) => {
    return quote.id || quote.quoteID;
  };

  const getQuotationNumber = (quote: any) => {
    return quote.quotationNumber || quote.quoteNo;
  };

  const getCompanyName = (quote: any) => {
    return quote.companyName || quote.surName;
  };

  // Placeholder function - will be replaced with real API call
  const refreshQuotations = () => {
    setLoading(true);
    // Simulate API call with empty data
    setTimeout(() => {
      setQuotations([]);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    refreshQuotations();
  }, []);

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
    toast({
      title: "Coming Soon",
      description: "Credit life renewal feature will be available soon",
      variant: "default",
    });
    // Keep the dialog for when the feature is ready
    // setSelectedForRenewal(quote);
    // const effectiveDate = quote.effectiveDate || quote.startDate;
    // if (effectiveDate) {
    //   const date = new Date(effectiveDate);
    //   date.setFullYear(date.getFullYear() + 1);
    //   setRenewalDate(date.toISOString().split('T')[0]);
    // } else {
    //   setRenewalDate(new Date().toISOString().split('T')[0]);
    // }
    // setShowRenewalDialog(true);
  };

  const confirmRenewal = async () => {
    toast({
      title: "Coming Soon",
      description: "Renewal processing will be available soon",
      variant: "default",
    });
    setShowRenewalDialog(false);
    setSelectedForRenewal(null);
  };

  const handleBulkRenewal = async () => {
    toast({
      title: "Coming Soon",
      description: "Bulk renewal feature will be available soon",
      variant: "default",
    });
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
    });
    setCurrentPage(1);
    setSelectedQuotations(new Set());
    setIsAllSelected(false);
    refreshQuotations();
  };

  const getDisplayQuotations = () => {
    // Filter for schemes eligible for renewal
    return quotations.filter((quote: any) => {
      const status = quote.status?.toUpperCase();
      return status === "ACTIVE" || status === "PENDING" || status === "PROSPECT";
    });
  };

  const hasActiveFilters =
    filterCriteria.searchValue ||
    filterCriteria.startDate ||
    filterCriteria.endDate ||
    filterCriteria.status !== "all";

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

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
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
    toast({
      title: "Coming Soon",
      description: "View scheme details will be available soon",
      variant: "default",
    });
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
          {processError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
              <div className="text-red-500 mr-2">⚠️</div>
              <p className="text-red-700">{processError}</p>
              <button onClick={() => setProcessError("")} className="ml-auto text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Header Card */}
          <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200 mb-6">
            <div className="p-4 pb-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-600" />
                Credit Life Scheme Renewals
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage and process renewals for credit life insurance schemes
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
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Loading schemes...</p>
                <p className="text-gray-400 text-sm mt-2">Please wait while we fetch the data</p>
              </div>
            ) : itemsForDisplay.length === 0 ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-700 mb-2">No Credit Life Schemes Available for Renewal</p>
                <p className="text-sm text-gray-500 mb-4">
                  {hasActiveFilters 
                    ? "No schemes match your filter criteria. Try adjusting your search." 
                    : "Credit life schemes eligible for renewal will appear here once they are set up."}
                </p>
                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearAllFilters}
                    className="mt-2"
                  >
                    <X className="w-4 h-4 mr-2" />
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
                        const effectiveDate = quote.effectiveDate || quote.startDate;
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
                                  onCheckedChange={() => handleSelectQuotation(quoteId)}
                                  className="h-4 w-4"
                                  disabled={isProcessing}
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
                            <TableCell>{formatDate(effectiveDate)}</TableCell>
                            <TableCell>{expiryDate ? formatDate(expiryDate.toISOString()) : "N/A"}</TableCell>
                            <TableCell>{getStatusBadge(quote.status)}</TableCell>
                            <TableCell>{getRenewalStatusBadge(effectiveDate)}</TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 bg-transparent border-blue-300 text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleViewScheme(quote)}
                                >
                                  <FileText className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-8 bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleProcessRenewal(quote)}
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

      {/* Renewal Dialog */}
      <Dialog open={showRenewalDialog} onOpenChange={setShowRenewalDialog}>
        <DialogContent className="p-6 space-y-4">
          <DialogHeader>
            <DialogTitle>Process Credit Life Scheme Renewal</DialogTitle>
            <DialogSubTitle>
              Renew the credit life scheme for{" "}
              <strong>{selectedForRenewal ? getCompanyName(selectedForRenewal) : ""}</strong>
            </DialogSubTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-indigo-50 p-3 rounded-md">
              <p className="text-sm text-indigo-800">
                <strong>Scheme Number:</strong>{" "}
                {selectedForRenewal ? getQuotationNumber(selectedForRenewal) : ""}
              </p>
              <p className="text-sm text-indigo-800 mt-1">
                <strong>Current Effective Date:</strong>{" "}
                {selectedForRenewal ? formatDate(selectedForRenewal.effectiveDate || selectedForRenewal.startDate) : ""}
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