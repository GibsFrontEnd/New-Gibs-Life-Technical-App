// @ts-nocheck
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Printer,
  Trash2,
  Search,
  Filter,
  X,
  Calendar,
  User,
  FileText,
  Check,
} from "lucide-react";
import { Button } from "../UI/new-button";
import { Input } from "../UI/new-input";
import { Label } from "../UI/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../UI/new-select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../UI/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "../UI/card";
import { useAppDispatch, useAppSelector } from "@/hooks/use-apps";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../UI/table";
import { Skeleton } from "../UI/skeleton";
import { formatCurrency, formatDate } from "@/utils/ui-utilities";
import {
  clearProposals,
  getProposals,
  selectProposals,
} from "@/features/reducers/individualLifeReducers/proposalSlice";
import { useNavigate } from "react-router-dom";
import { Badge } from "../UI/badge";
import { Alert, AlertDescription } from "../UI/alert";
import { Checkbox } from "@/components/UI/checkbox";

// @ts-ignore
const AgentTradProposal = ({ setShowTradProposal }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { proposals, loading, error } = useAppSelector(selectProposals);

  // Filter states
  const [insuredName, setInsuredName] = useState("");
  const [containsText, setContainsText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [coverTypeFilter, setCoverTypeFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // NEW STATE FOR CHECKBOXES AND APPROVAL
  const [selectedProposals, setSelectedProposals] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [approvingProposals, setApprovingProposals] = useState<Set<string>>(new Set());
  const [approveError, setApproveError] = useState('');

  // Toast states
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const agentCode = localStorage.getItem("agentID");
  const role = localStorage.getItem("role");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    dispatch(clearProposals());
    
    // Add customerType filter to only fetch traditional proposals
    const filters = { 
      page: currentPage, 
      pageSize,
      customerType: "B" // Only fetch traditional proposals
    };
    
    dispatch(getProposals(filters));
  }, [currentPage, dispatch]);

  const totalPages = proposals ? Math.ceil(proposals.totalCount / pageSize) : 0;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Get traditional proposals from the fetched data
  const getTraditionalProposals = () => {
    if (!proposals?.items) return [];

    return proposals.items.filter((proposal) => {
      // Additional role-based filtering if needed
      if (role !== "admin" && proposal.agentcode !== agentCode) {
        return false;
      }
      return true;
    });
  };

  const traditionalProposals = getTraditionalProposals();

  // NEW: Checkbox handlers
  const handleSelectProposal = (proposalId: string) => {
    const newSelected = new Set(selectedProposals);
    if (newSelected.has(proposalId)) {
      newSelected.delete(proposalId);
    } else {
      newSelected.add(proposalId);
    }
    setSelectedProposals(newSelected);
    
    // Update all selected state
    const filteredProposals = getFilteredProposals();
    setIsAllSelected(newSelected.size === filteredProposals.length);
  };

  const handleSelectAll = () => {
    const filteredProposals = getFilteredProposals();
    
    if (isAllSelected) {
      setSelectedProposals(new Set());
    } else {
      const allIds = new Set(filteredProposals.map((proposal: any) => proposal.policyID));
      setSelectedProposals(allIds);
    }
    setIsAllSelected(!isAllSelected);
  };

  // NEW: Handle individual proposal approval
  const handleApproveProposal = async (proposalId: string, proposalNo: string) => {
    if (!proposalId) {
      setApproveError('Invalid proposal ID');
      return;
    }

    try {
      setApprovingProposals(prev => new Set(prev).add(proposalId));
      setApproveError('');

      // TODO: Replace with your actual API call
      // await apiService.approveProposal(proposalId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      setSuccessMessage(`Traditional Proposal ${proposalNo} approved successfully!`);
      setShowSuccessToast(true);
      
      // Auto hide success toast after 5 seconds
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 5000);
      
      // If successful, refresh the data
      dispatch(clearProposals());
      const filters = { 
        page: currentPage, 
        pageSize,
        customerType: "B"
      };
      dispatch(getProposals(filters));
      
      // Remove from selected proposals
      const newSelected = new Set(selectedProposals);
      newSelected.delete(proposalId);
      setSelectedProposals(newSelected);
      
    } catch (err) {
      const errorMessage = err?.message || 'Unknown error occurred';
      setApproveError('Failed to approve proposal: ' + errorMessage);
      console.error('Error approving proposal:', err);
    } finally {
      setApprovingProposals(prev => {
        const newSet = new Set(prev);
        newSet.delete(proposalId);
        return newSet;
      });
    }
  };

  // NEW: Handle bulk approval of selected proposals
  const handleBulkApprove = async () => {
    if (selectedProposals.size === 0) return;

    try {
      setApproveError('');
      
      // Convert Set to Array for easier iteration
      const proposalsToApprove = Array.from(selectedProposals);
      
      // Add all to approving set
      setApprovingProposals(new Set(proposalsToApprove));

      let successCount = 0;
      
      // Approve each proposal sequentially
      for (const proposalId of proposalsToApprove) {
        try {
          // TODO: Replace with your actual API call
          // await apiService.approveProposal(proposalId);
          await new Promise(resolve => setTimeout(resolve, 500));
          successCount++;
        } catch (err) {
          console.error(`Failed to approve ${proposalId}:`, err);
          // Continue with next even if one fails
        }
      }
      
      // Show success message
      if (successCount > 0) {
        setSuccessMessage(`Successfully approved ${successCount} out of ${proposalsToApprove.length} traditional proposals!`);
        setShowSuccessToast(true);
        
        // Auto hide success toast after 5 seconds
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 5000);
      }
      
      // Refresh data after all approvals
      dispatch(clearProposals());
      const filters = { 
        page: currentPage, 
        pageSize,
        customerType: "B"
      };
      dispatch(getProposals(filters));
      
      // Clear selection
      setSelectedProposals(new Set());
      setIsAllSelected(false);
      
    } catch (err) {
      const errorMessage = err?.message || 'Unknown error occurred';
      setApproveError('Error during bulk approval: ' + errorMessage);
    } finally {
      setApprovingProposals(new Set());
    }
  };

  const getStatusBadge = (remarks: string | null, tag: string | null) => {
    if (remarks === "IN FORCE") {
      return (
        <Badge variant="default" className="bg-green-500">
          In Force
        </Badge>
      );
    }
    if (tag === "ADMITTED") {
      return <Badge variant="secondary">Admitted</Badge>;
    }
    if (tag === "NOT ADMITTED") {
      return <Badge variant="outline">Not Admitted</Badge>;
    }
    return <Badge variant="secondary">Unknown</Badge>;
  };

  // Filter function for traditional proposals (applies search/filters on top of traditional proposals)
  const getFilteredProposals = () => {
    if (!traditionalProposals || traditionalProposals.length === 0) return [];

    return traditionalProposals.filter((proposal) => {
      // Name filter
      if (
        insuredName &&
        !proposal.fullName?.toLowerCase().includes(insuredName.toLowerCase())
      ) {
        return false;
      }

      // Text content filter
      if (containsText) {
        const searchText = containsText.toLowerCase();
        const searchableFields = [
          proposal.proposalNo,
          proposal.policyNo,
          proposal.fullName,
          proposal.coverCode,
          proposal.state,
          proposal.agentDescription,
        ]
          .join(" ")
          .toLowerCase();

        if (!searchableFields.includes(searchText)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "in-force" && proposal.remarks !== "IN FORCE")
          return false;
        if (statusFilter === "admitted" && proposal.tag !== "ADMITTED")
          return false;
        if (statusFilter === "not-admitted" && proposal.tag !== "NOT ADMITTED")
          return false;
      }

      // Cover type filter
      if (coverTypeFilter !== "all" && proposal.coverCode !== coverTypeFilter) {
        return false;
      }

      // Date range filter
      if (startDate && proposal.startDate) {
        const proposalDate = new Date(proposal.startDate);
        const filterStartDate = new Date(startDate);
        if (proposalDate < filterStartDate) return false;
      }

      if (endDate && proposal.startDate) {
        const proposalDate = new Date(proposal.startDate);
        const filterEndDate = new Date(endDate);
        if (proposalDate > filterEndDate) return false;
      }

      return true;
    });
  };

  const filteredProposals = getFilteredProposals();
  const hasActiveFilters =
    insuredName ||
    containsText ||
    startDate ||
    endDate ||
    statusFilter !== "all" ||
    coverTypeFilter !== "all";

  const clearAllFilters = () => {
    setInsuredName("");
    setContainsText("");
    setStartDate("");
    setEndDate("");
    setStatusFilter("all");
    setCoverTypeFilter("all");
    // Clear selection when clearing filters
    setSelectedProposals(new Set());
    setIsAllSelected(false);
  };

  // Get unique cover types for filter dropdown (only from traditional proposals)
  const uniqueCoverTypes = [
    ...new Set(traditionalProposals?.map((p) => p.coverCode).filter(Boolean)),
  ];

  if (error.getProposals) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error loading proposals</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* SUCCESS TOAST */}
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
            onClick={() => setApproveError('')}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header with Title and Quick Stats */}
      {/* Action Buttons */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-50 border-blue-200">
        <div className="p-4 pb-0">
          <h2 className="text-xl font-bold text-gray-900">
            Traditional Policy Proposals
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage traditional insurance policy proposals
          </p>
        </div>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="default"
              size="sm"
              onClick={setShowTradProposal}
              className="w-full sm:w-auto text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">New Business</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters Section */}
      <Card className="border-blue-200">
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-blue-50/50 transition-colors pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-lg text-blue-900">
                    Search & Filters
                  </CardTitle>
                  {hasActiveFilters && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800"
                    >
                      {
                        [
                          insuredName,
                          containsText,
                          startDate,
                          endDate,
                          statusFilter !== "all" ? statusFilter : null,
                          coverTypeFilter !== "all" ? coverTypeFilter : null,
                        ].filter(Boolean).length
                      }{" "}
                      active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
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
                  <ChevronRight
                    className={`w-4 h-4 text-blue-600 transition-transform ${
                      filtersOpen ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* Quick Search */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="insured-name"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <User className="w-3 h-3" />
                    Client Name
                  </Label>
                  <Input
                    id="insured-name"
                    placeholder="Search by client name..."
                    value={insuredName}
                    onChange={(e) => setInsuredName(e.target.value)}
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="contains-text"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Search className="w-3 h-3" />
                    General Search
                  </Label>
                  <Input
                    id="contains-text"
                    placeholder="Search proposals, policies..."
                    value={containsText}
                    onChange={(e) => setContainsText(e.target.value)}
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="in-force">In Force</SelectItem>
                      <SelectItem value="admitted">Admitted</SelectItem>
                      <SelectItem value="not-admitted">Not Admitted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cover Type</Label>
                  <Select
                    value={coverTypeFilter}
                    onValueChange={setCoverTypeFilter}
                  >
                    <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                      <SelectValue placeholder="All cover types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cover Types</SelectItem>
                      {uniqueCoverTypes.map((coverType) => (
                        <SelectItem key={coverType} value={coverType}>
                          {coverType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="start-date"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Calendar className="w-3 h-3" />
                    Start Date From
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="end-date"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Calendar className="w-3 h-3" />
                    Start Date To
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Results Summary */}
              <div className="flex items-center justify-between pt-2 border-t border-blue-100">
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-medium text-blue-600">
                    {filteredProposals.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">
                    {traditionalProposals?.length || 0}
                  </span>{" "}
                  traditional proposals
                  {selectedProposals.size > 0 && (
                    <span className="ml-2 text-blue-700 font-medium">
                      | {selectedProposals.size} selected
                    </span>
                  )}
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* SELECTION ACTIONS - NEW SECTION */}
      {selectedProposals.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-blue-700 font-medium">
              {selectedProposals.size} traditional proposal{selectedProposals.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleBulkApprove}
              disabled={approvingProposals.size > 0}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {approvingProposals.size > 0 ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Approving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Approve Selected ({selectedProposals.size})
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <Card className="border-blue-200 mb-20">
        <CardContent className="p-0">
          {/* Mobile Card View */}
          <div className="block lg:hidden">
            {loading.getProposals ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="p-4 border-b border-blue-100 space-y-3"
                >
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))
            ) : filteredProposals.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm font-medium mb-2">
                  {hasActiveFilters
                    ? "No traditional proposals match your filters"
                    : "No Traditional Proposals found"}
                </p>
                <p className="text-xs">
                  {hasActiveFilters
                    ? "Try adjusting your search criteria or clear filters to see all traditional proposals."
                    : "Create a new traditional quote to get started."}
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
              filteredProposals.map((proposal) => {
                const isSelected = selectedProposals.has(proposal.policyID);
                const isApproving = approvingProposals.has(proposal.policyID);
                
                return (
                  <div
                    key={proposal.policyID}
                    className={`p-4 border-b border-blue-100 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-blue-50/50'
                    } ${isApproving ? 'opacity-60' : ''}`}
                    onClick={() =>
                      navigate(`trad/${proposal.proposalNo}/detail`)
                    }
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectProposal(proposal.policyID)}
                          className="h-4 w-4 mt-1"
                          disabled={isApproving}
                        />
                      </div>
                      <div 
                        className="flex-1 space-y-3"
                      >
                        {/* Header */}
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            {proposal.policyNo && (
                              <div className="text-sm font-medium text-blue-900">
                                {proposal.policyNo}
                              </div>
                            )}
                            <div className="text-xs text-blue-600">
                              {proposal.proposalNo}
                            </div>
                          </div>
                          {getStatusBadge(proposal.remarks, proposal.tag)}
                        </div>
                        {/* Client Info */}
                        <div>
                          <div className="font-medium text-sm text-gray-900">
                            {proposal.fullName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {proposal.sex}, Age {proposal.age}
                          </div>
                        </div>
                        {/* Financial Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-gray-500">Sum Assured</div>
                            <div className="font-medium text-blue-900">
                              {formatCurrency(proposal.sumAssured)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Premium</div>
                            <div className="font-medium text-blue-900">
                              {formatCurrency(proposal.totalPremium)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {proposal.fop}
                            </div>
                          </div>
                        </div>
                        {/* Additional Info */}
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-gray-500">Cover: </span>
                            <span className="text-blue-700 font-medium">
                              {proposal.coverCode}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Start: </span>
                            <span>{formatDate(proposal.startDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Action buttons for mobile */}
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                      {/* Individual Approve Button for mobile */}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-blue-300 text-blue-700 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log(
                            "Print traditional proposal:",
                            proposal.proposalNo
                          );
                        }}
                        disabled={isApproving}
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-blue-300 text-blue-700 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log(
                            "Convert traditional proposal:",
                            proposal.proposalNo
                          );
                        }}
                        disabled={isApproving}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Convert
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-blue-100 hover:bg-blue-50/30">
                  <TableHead className="w-12 text-blue-900 font-semibold">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      className="h-4 w-4"
                    />
                  </TableHead>
                  <TableHead className="min-w-[150px] text-blue-900 font-semibold">
                    Policy/Proposal No.
                  </TableHead>
                  <TableHead className="min-w-[180px] text-blue-900 font-semibold">
                    Client Name
                  </TableHead>
                  <TableHead className="min-w-[120px] text-blue-900 font-semibold">
                    Cover Type
                  </TableHead>
                  <TableHead className="min-w-[120px] text-right text-blue-900 font-semibold">
                    Sum Assured
                  </TableHead>
                  <TableHead className="min-w-[120px] text-right text-blue-900 font-semibold">
                    Premium
                  </TableHead>
                  <TableHead className="min-w-[100px] text-blue-900 font-semibold">
                    Start Date
                  </TableHead>
                  <TableHead className="min-w-[100px] text-blue-900 font-semibold">
                    State
                  </TableHead>
                  <TableHead className="min-w-[100px] text-blue-900 font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="min-w-[120px] text-right text-blue-900 font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading.getProposals ? (
                  Array.from({ length: pageSize }).map((_, index) => (
                    <TableRow key={index} className="border-blue-100">
                      <TableCell>
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-36" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredProposals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center p-8">
                      <div className="text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="font-medium mb-2">
                          {hasActiveFilters
                            ? "No traditional proposals match your filters"
                            : "No Traditional Proposals found"}
                        </p>
                        <p className="text-sm">
                          {hasActiveFilters
                            ? "Try adjusting your search criteria or clear filters to see all traditional proposals."
                            : "Use the search filter above or create a new traditional quote to get started."}
                        </p>
                        {hasActiveFilters && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllFilters}
                            className="mt-3 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent"
                          >
                            Clear All Filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProposals.map((proposal) => {
                    const isSelected = selectedProposals.has(proposal.policyID);
                    const isApproving = approvingProposals.has(proposal.policyID);
                    
                    return (
                      <TableRow
                        key={proposal.policyID}
                        className={`cursor-pointer hover:bg-blue-50/50 border-blue-100 transition-colors ${
                          isSelected ? 'bg-blue-50' : ''
                        } ${isApproving ? 'opacity-60' : ''}`}
                        onClick={() => navigate(`${proposal.proposalNo}/detail`)}
                      >
                        <TableCell>
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleSelectProposal(proposal.policyID)}
                              className="h-4 w-4"
                              disabled={isApproving}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            {proposal.policyNo && (
                              <div className="text-sm text-blue-900 font-medium">
                                {proposal.policyNo}
                              </div>
                            )}
                            <div className="text-xs text-blue-600">
                              {proposal.proposalNo}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">
                              {proposal.fullName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {proposal.sex}, Age {proposal.age}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-blue-700">
                              {proposal.coverCode}
                            </div>
                            {proposal.covertype && (
                              <div className="text-xs text-gray-500">
                                {proposal.covertype}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-blue-900">
                          {formatCurrency(proposal.sumAssured)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <div className="font-medium text-blue-900">
                              {formatCurrency(proposal.totalPremium)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {proposal.fop}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {formatDate(proposal.startDate)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900">
                              {proposal.state}
                            </div>
                            {proposal.agentDescription && (
                              <div className="text-xs text-gray-500">
                                {proposal.agentDescription}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(proposal.remarks, proposal.tag)}
                        </TableCell>
                        {/* Actions Cell */}
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {/* Individual Approve Button */}
                          
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 bg-transparent border-blue-300 text-blue-700 hover:bg-blue-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log(
                                  "Convert traditional proposal:",
                                  proposal.proposalNo
                                );
                              }}
                              disabled={isApproving}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {proposals && totalPages > 1 && (
            <div className="border-t border-purple-100 p-4 bg-purple-50/30">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600 order-2 sm:order-1">
                  Page{" "}
                  <span className="font-medium text-purple-600">
                    {currentPage}
                  </span>{" "}
                  of <span className="font-medium">{totalPages}</span>
                  {hasActiveFilters && (
                    <span className="ml-2 text-xs">(filtered results)</span>
                  )}
                  {selectedProposals.size > 0 && (
                    <span className="ml-2 text-blue-700 font-medium">
                      | {selectedProposals.size} selected
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2 order-1 sm:order-2">
                  {/* First Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(1)} // @ts-ignore
                    disabled={currentPage === 1 || loading.getProposals}
                    className="hidden sm:flex h-8 w-8 p-0 border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  {/* Previous Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)} // @ts-ignore
                    disabled={currentPage === 1 || loading.getProposals}
                    className="h-8 w-8 p-0 border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from(
                      {
                        length: Math.min(
                          window.innerWidth < 640 ? 3 : 5,
                          totalPages
                        ),
                      },
                      (_, i) => {
                        let pageNum: number;
                        const maxVisible = window.innerWidth < 640 ? 3 : 5;
                        if (totalPages <= maxVisible) {
                          pageNum = i + 1;
                        } else if (currentPage <= Math.ceil(maxVisible / 2)) {
                          pageNum = i + 1;
                        } else if (
                          currentPage >=
                          totalPages - Math.floor(maxVisible / 2)
                        ) {
                          pageNum = totalPages - maxVisible + 1 + i;
                        } else {
                          pageNum =
                            currentPage - Math.floor(maxVisible / 2) + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={
                              currentPage === pageNum ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => goToPage(pageNum)} // @ts-ignore
                            disabled={loading.getProposals}
                            className={`h-8 w-8 p-0 text-xs sm:text-sm ${
                              currentPage === pageNum
                                ? "bg-purple-600 hover:bg-purple-700"
                                : "border-purple-300 text-purple-700 hover:bg-purple-50"
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                    )}
                  </div>
                  {/* Next Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)} // @ts-ignore
                    disabled={
                      currentPage === totalPages || loading.getProposals
                    }
                    className="h-8 w-8 p-0 border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  {/* Last Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(totalPages)} // @ts-ignore
                    disabled={
                      currentPage === totalPages || loading.getProposals
                    }
                    className="hidden sm:flex h-8 w-8 p-0 border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentTradProposal;