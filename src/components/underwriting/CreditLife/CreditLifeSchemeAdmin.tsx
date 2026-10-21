// src/pages/underwriting/CreditLife/CreditLifeSchemeAdmin.tsx
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
import { formatDate, formatCurrency } from "../../../utils/ui-utilities";
import { useToast } from "../../../hooks/use-toast";
import { Checkbox } from "../../UI/checkbox";

export default function CreditLifeSchemeAdmin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Local state
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
    schemeType: "all",
    insuredType: "all",
    tag: "CL",
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

  const handleApproveQuotation = async (quoteId: string, quoteNo: string) => {
    toast({
      title: "Coming Soon",
      description: "Credit life approval feature will be available soon",
      variant: "default",
    });
  };

  const handleBulkApprove = async () => {
    toast({
      title: "Coming Soon",
      description: "Bulk approval feature will be available soon",
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
      schemeType: "all",
      insuredType: "all",
      tag: "CL",
    });
    setCurrentPage(1);
    setSelectedQuotations(new Set());
    setIsAllSelected(false);
    refreshQuotations();
  };

  const getDisplayQuotations = () => {
    return quotations;
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
    toast({
      title: "Coming Soon",
      description: "Edit feature will be available soon",
      variant: "default",
    });
  };

  const handleNewQuotation = () => {
    toast({
      title: "Coming Soon",
      description: "New credit life scheme creation will be available soon",
      variant: "default",
    });
  };

  const handleDeleteQuotation = (quote: any, e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "Coming Soon",
      description: "Delete feature will be available soon",
      variant: "default",
    });
  };

  const confirmDeleteQuotation = async () => {
    // Placeholder
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
    <div className="min-h-full">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="rounded-lg">
          {/* Header Card */}
          <Card className="mb-6 border-0 bg-transparent shadow-none">
            <div className="p-0">
              <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                <CreditCard className="h-10 w-10 shrink-0 rounded-xl bg-blue-50 p-2.5 text-[#155dfd]" />
                Credit Life Schemes
              </h2>
              <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
                Manage and track your credit life insurance schemes
              </p>
            </div>
            <CardContent className="px-0 pb-0 pt-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleNewQuotation}
                  className="w-full sm:w-auto text-xs sm:text-sm bg-[#155dfd] hover:bg-[#0f4fe0] text-white"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">New Credit Life Scheme</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filters Section */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CollapsibleTrigger asChild>
                <div className="flex cursor-pointer items-center justify-between px-5 py-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-semibold text-slate-900">Search and filters</span>
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
          <div className="min-h-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Loading credit life schemes...</p>
                <p className="text-gray-400 text-sm mt-2">Please wait while we fetch your data</p>
              </div>
            ) : quotations.length === 0 ? (
              <div className="p-8 text-center">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-700 mb-2">No Credit Life Schemes Available</p>
                <p className="text-sm text-gray-500 mb-4">
                  Credit life insurance schemes will appear here once they are set up.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewQuotation}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Scheme
                </Button>
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
    </div>
  );
}