// @ts-nocheck

import AgentTradProposal from "@/components/proposals/trad-proposal";
import NewProposal from "@/components/proposals/new-proposal";
import NewTradProposal from "@/components/proposals/new-trad-proposal";
import { Badge } from "@/components/UI/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card";
import { Button } from "@/components/UI/new-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/UI/tabs";
import {
  clearProposals,
  getProposals,
  getProposalsByAgent,
  getTraditionalProposalsByAgent,
  selectProposals,
  approveProposal,
} from "@/features/reducers/individualLifeReducers/proposalSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/use-apps";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Printer,
  Search,
  Filter,
  X,
  Calendar,
  User,
  FileText,
  Check,
  Trash2,
  Pencil,
  Eye,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/UI/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/UI/new-select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/UI/collapsible";
import { Input } from "@/components/UI/new-input";
import { Label } from "@/components/UI/label";
import { formatCurrency, formatDate } from "@/utils/ui-utilities";
import { Checkbox } from "@/components/UI/checkbox";

interface AgentProposalProps {
  proposalType?: "investments" | "traditional" | "both";
}

const AgentProposal = ({ proposalType = "both" }: AgentProposalProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Filter states
  const [insuredName, setInsuredName] = useState("");
  const [containsText, setContainsText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [coverTypeFilter, setCoverTypeFilter] = useState("all");

  const [showNewProposal, setShowNewProposal] = useState(false);
  const [showTradProposal, setShowTradProposal] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(
    proposalType === "traditional" ? "traditional" : "investments"
  );

  // NEW STATE FOR CHECKBOXES AND APPROVAL
  const [selectedProposals, setSelectedProposals] = useState<Set<string>>(
    new Set()
  );
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [approvingProposals, setApprovingProposals] = useState<Set<string>>(
    new Set()
  );
  const [approveError, setApproveError] = useState("");

  // Toast states
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { proposals, loading } = useAppSelector(selectProposals);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Separate state for tracking which data is currently loaded
  const [loadedDataType, setLoadedDataType] = useState<
    "investments" | "traditional" | null
  >(null);

  // Use totalPages from API response, fallback to calculation if not available
  const totalPages =
    proposals?.totalPages ||
    (proposals ? Math.ceil(proposals.totalCount / pageSize) : 0);

  console.log("📊 Pagination Debug:", {
    totalPages,
    totalCount: proposals?.totalCount,
    pageSize,
    currentPage,
    itemsLength: proposals?.items?.length,
    proposalsTotalPages: proposals?.totalPages,
    loadedDataType,
    activeTab,
  });

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
    // Clear selection when switching tabs
    setSelectedProposals(new Set());
    setIsAllSelected(false);
    // Clear proposals when switching tabs to force refetch
    // dispatch(clearProposals());
    setLoadedDataType(null);
  };

  // Refresh proposals data - OPTIMIZED
  const refreshProposals = () => {
    const agentId = localStorage.getItem("agentId");

    console.log("🔄 Refreshing proposals...", {
      agentId,
      activeTab,
      currentPage,
      pageSize,
    });

    if (agentId) {
      if (activeTab === "traditional") {
        dispatch(
          getTraditionalProposalsByAgent({
            agentCode: agentId,
            page: currentPage,
            pageSize,
          })
        );
      } else if (activeTab === "investments") {
        dispatch(
          getProposalsByAgent({
            agentCode: agentId,
            page: currentPage,
            pageSize,
          })
        );
      }
    } else {
      if (activeTab === "traditional") {
        dispatch(
          getTraditionalProposalsByAgent({
            agentCode: "",
            page: currentPage,
            pageSize,
          })
        );
      } else {
        dispatch(
          getProposals({
            page: currentPage,
            pageSize,
          })
        );
      }
    }
  };

  // NEW: Edit proposal handler - navigates to proposal detail page
  const handleEditProposal = (proposal: any) => {
    navigate(`${proposal.proposalNo}/detail`);
  };

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
      const allIds = new Set(
        filteredProposals.map((proposal: any) => proposal.policyID)
      );
      setSelectedProposals(allIds);
    }
    setIsAllSelected(!isAllSelected);
  };

  // NEW: Handle individual proposal approval
  const handleApproveProposal = async (
    proposalId: string,
    proposalNo: string
  ) => {
    if (!proposalId || !proposalNo) {
      setApproveError("Invalid proposal ID or proposal number");
      return;
    }

    try {
      console.log("🔄 Starting approval for:", proposalNo);
      setApprovingProposals((prev) => new Set(prev).add(proposalId));
      setApproveError("");

      // Use the Redux action to approve the proposal
      const result = await dispatch(approveProposal(proposalNo)).unwrap();

      console.log("✅ Approval successful:", result);
      console.log("📝 Response data:", result);

      // Show success message
      setSuccessMessage(`Proposal ${proposalNo} approved successfully!`);
      setShowSuccessToast(true);

      // Auto hide success toast after 5 seconds
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 1000);

      // Refresh the data to get updated status
      console.log("🔄 Refreshing proposals after approval...");
      refreshProposals();

      // Remove from selected proposals
      const newSelected = new Set(selectedProposals);
      newSelected.delete(proposalId);
      setSelectedProposals(newSelected);
    } catch (err: any) {
      console.error("❌ Approval failed:", err);
      const errorMessage = err?.message || err || "Failed to approve proposal";
      setApproveError("Failed to approve proposal: " + errorMessage);
    } finally {
      setApprovingProposals((prev) => {
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
      setApproveError("");

      // Convert Set to Array for easier iteration
      const proposalsToApprove = Array.from(selectedProposals);

      // Find the proposal numbers for the selected IDs
      const proposalNumbers = filteredProposals
        .filter((proposal) => selectedProposals.has(proposal.policyID))
        .map((proposal) => proposal.proposalNo);

      // Add all to approving set
      setApprovingProposals(new Set(proposalsToApprove));

      let successCount = 0;

      // Approve each proposal sequentially
      for (const proposalNo of proposalNumbers) {
        try {
          await dispatch(approveProposal(proposalNo)).unwrap();
          successCount++;
        } catch (err) {
          console.error(`Failed to approve ${proposalNo}:`, err);
          // Continue with next even if one fails
        }
      }

      // Show success message
      if (successCount > 0) {
        setSuccessMessage(
          `Successfully approved ${successCount} out of ${proposalsToApprove.length} proposals!`
        );
        setShowSuccessToast(true);

        // Auto hide success toast after 5 seconds
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 1000);
      }

      // Refresh data after all approvals
      refreshProposals();

      // Clear selection
      setSelectedProposals(new Set());
      setIsAllSelected(false);
    } catch (err) {
      const errorMessage = err?.message || "Unknown error occurred";
      setApproveError("Error during bulk approval: " + errorMessage);
    } finally {
      setApprovingProposals(new Set());
    }
  };

  const getStatusBadge = (
    remarks: string | null,
    tag: string | null,
    status?: string
  ) => {
    // Check API status first
    if (status === "APPROVED") {
      return (
        <Badge variant="default" className="bg-green-500">
          Approved
        </Badge>
      );
    }

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

  // Filter function - OPTIMIZED
  const getFilteredProposals = () => {
    if (!proposals?.items) return [];

    // Only show proposals if they match the currently loaded data type
    if (loadedDataType !== activeTab) {
      return [];
    }

    return proposals.items.filter((proposal) => {
      // Name filter
      if (
        insuredName &&
        !proposal.fullName?.toLowerCase().includes(insuredName.toLowerCase())
      ) {
        return false;
      }

      // Text content filter - simplified
      if (containsText) {
        const searchText = containsText.toLowerCase();
        const searchableText = [
          proposal.proposalNo,
          proposal.policyNo,
          proposal.fullName,
          proposal.coverCode,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(searchText)) {
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

      // Date range filter - optimized
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

  console.log("📊 Proposals in state:", proposals);
  console.log("📊 Total proposals.items:", proposals?.items?.length || 0);
  console.log("📊 Filtered proposals count:", filteredProposals.length);
  console.log("📊 Loaded data type:", loadedDataType);
  console.log("📊 Active tab:", activeTab);
  console.log(
    "📊 First 3 proposals agentCodes:",
    filteredProposals.slice(0, 3).map((p) => ({
      proposalNo: p.proposalNo,
      agentCode: p.agentcode || p.agentCode || p.agentID || "N/A",
    }))
  );

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

  // Get unique cover types for filter dropdown
  const uniqueCoverTypes = [
    ...new Set(proposals?.items?.map((p) => p.coverCode).filter(Boolean)),
  ];

  // Show loading when data doesn't match active tab
  const isLoading =
    Boolean(loading?.getProposals) || loadedDataType !== activeTab;

  useEffect(() => {
    const agentId = localStorage.getItem("agentId");

    console.log(
      "🔍 AgentProposal - Retrieved agentId from localStorage:",
      agentId
    );
    console.log("🔍 AgentProposal - proposalType:", proposalType);
    console.log("🔍 AgentProposal - activeTab:", activeTab);

    if (agentId) {
      // If user is logged in as agent, fetch their proposals using the dedicated endpoint
      console.log(
        "✅ AgentProposal - Calling agent-specific endpoint for type:",
        activeTab,
        "agentId:",
        agentId,
        "page:",
        currentPage,
        "pageSize:",
        pageSize
      );

      // Call the appropriate endpoint based on ACTIVE TAB, not proposalType
      if (activeTab === "traditional") {
        console.log("🔄 Fetching traditional proposals...");
        setLoadedDataType("traditional");
        dispatch(
          getTraditionalProposalsByAgent({
            agentCode: agentId,
            page: currentPage,
            pageSize,
          })
        );
      } else if (activeTab === "investments") {
        console.log("🔄 Fetching investment proposals...");
        setLoadedDataType("investments");
        dispatch(
          getProposalsByAgent({
            agentCode: agentId,
            page: currentPage,
            pageSize,
          })
        );
      }
    } else {
      // If user is admin/manager, fetch all proposals based on active tab
      console.warn(
        "⚠️ No agent ID found - fetching all proposals for:",
        activeTab
      );
      if (activeTab === "traditional") {
        setLoadedDataType("traditional");
        // You might need a different action for traditional admin view
        dispatch(
          getTraditionalProposalsByAgent({
            agentCode: "",
            page: currentPage,
            pageSize,
          })
        );
      } else {
        setLoadedDataType("investments");
        dispatch(
          getProposals({
            page: currentPage,
            pageSize,
          })
        );
      }
    }

    // Cleanup: clear proposals when component unmounts or when activeTab changes
    return () => {
      dispatch(clearProposals());
    };
  }, [currentPage, dispatch, pageSize, activeTab]);

  useEffect(() => {
    if (
      proposals?.items &&
      proposals.items.length > 0 &&
      loadedDataType === activeTab
    ) {
      console.log("✅ Data loaded successfully for:", activeTab);
    }
  }, [proposals, loadedDataType, activeTab]);

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

          {!showNewProposal && !showTradProposal ? (
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
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

              {(proposalType === "investments" || proposalType === "both") && (
                <TabsContent
                  value="investments"
                  className="space-y-4 sm:space-y-6"
                >
                  {/* Action Buttons */}
                  <Card className="bg-gradient-to-r from-blue-50 to-blue-50 border-blue-200">
                    <div className="p-4 pb-0">
                      <h2 className="text-xl font-bold text-gray-900">
                        Investment Policy Proposals
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Manage and track your insurance proposals
                      </p>
                    </div>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setShowNewProposal(true)}
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
                  <Card className="border-red-200">
                    <Collapsible
                      open={filtersOpen}
                      onOpenChange={setFiltersOpen}
                    >
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
                                      statusFilter !== "all"
                                        ? statusFilter
                                        : null,
                                      coverTypeFilter !== "all"
                                        ? coverTypeFilter
                                        : null,
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
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
                                onChange={(e) =>
                                  setContainsText(e.target.value)
                                }
                                className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                              />
                            </div>
                          </div>

                          {/* Filters Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Status
                              </Label>
                              <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                              >
                                <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                                  <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">
                                    All Statuses
                                  </SelectItem>
                                  <SelectItem value="in-force">
                                    In Force
                                  </SelectItem>
                                  <SelectItem value="admitted">
                                    Admitted
                                  </SelectItem>
                                  <SelectItem value="not-admitted">
                                    Not Admitted
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Cover Type
                              </Label>
                              <Select
                                value={coverTypeFilter}
                                onValueChange={setCoverTypeFilter}
                              >
                                <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                                  <SelectValue placeholder="All cover types" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">
                                    All Cover Types
                                  </SelectItem>
                                  {uniqueCoverTypes.map((coverType) => (
                                    <SelectItem
                                      key={coverType}
                                      value={coverType}
                                    >
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
                                {proposals?.items?.length || 0}
                              </span>{" "}
                              proposals
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
                          {selectedProposals.size} proposal
                          {selectedProposals.size !== 1 ? "s" : ""} selected
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
                        {isLoading ? (
                          <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
                            <p className="text-gray-600 font-medium">
                              Loading proposals...
                            </p>
                            <p className="text-gray-400 text-sm mt-2">
                              Hang tight while we fetch your records
                            </p>
                          </div>
                        ) : filteredProposals.length === 0 ? (
                          <div className="p-8 text-center text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-sm font-medium mb-2">
                              {hasActiveFilters
                                ? "No proposals match your filters"
                                : "No Proposals found"}
                            </p>
                            <p className="text-xs">
                              {hasActiveFilters
                                ? "Try adjusting your search criteria or clear filters to see all proposals."
                                : "Create a new quote to get started."}
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
                            const isSelected = selectedProposals.has(
                              proposal.policyID
                            );
                            const isApproving = approvingProposals.has(
                              proposal.policyID
                            );

                            return (
                              <div
                                key={proposal.policyID}
                                className={`p-4 border-b border-blue-100 cursor-pointer transition-colors ${
                                  isSelected
                                    ? "bg-blue-50"
                                    : "hover:bg-blue-50/50"
                                } ${isApproving ? "opacity-60" : ""}`}
                                onClick={() =>
                                  navigate(`${proposal.proposalNo}/detail`)
                                }
                              >
                                <div className="flex items-start gap-3 mb-3">
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() =>
                                        handleSelectProposal(proposal.policyID)
                                      }
                                      className="h-4 w-4 mt-1"
                                      disabled={isApproving}
                                    />
                                  </div>
                                  <div className="flex-1 space-y-3">
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
                                      {getStatusBadge(
                                        proposal.remarks,
                                        proposal.tag,
                                        proposal.status
                                      )}
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
                                        <div className="text-xs text-gray-500">
                                          Sum Assured
                                        </div>
                                        <div className="font-medium text-blue-900">
                                          {formatCurrency(proposal.sumAssured)}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-gray-500">
                                          Premium
                                        </div>
                                        <div className="font-medium text-blue-900">
                                          {formatCurrency(
                                            proposal.totalPremium
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {proposal.fop}
                                        </div>
                                      </div>
                                    </div>
                                    {/* Additional Info */}
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                      <div>
                                        <span className="text-gray-500">
                                          Cover:{" "}
                                        </span>
                                        <span className="text-blue-700 font-medium">
                                          {proposal.coverCode}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">
                                          Start:{" "}
                                        </span>
                                        <span>
                                          {formatDate(proposal.startDate)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {/* Action buttons for mobile */}
                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                                  {/* Approve Button for mobile */}
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApproveProposal(
                                        proposal.policyID,
                                        proposal.proposalNo
                                      );
                                    }}
                                    disabled={isApproving}
                                  >
                                    {isApproving ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                    ) : (
                                      <Check className="w-4 h-4 mr-2" />
                                    )}
                                    {isApproving ? "Approving..." : "Approve"}
                                  </Button>

                                  {/* Edit Button for mobile */}
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditProposal(proposal);
                                    }}
                                    disabled={isApproving}
                                  >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit
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
                            {isLoading ? (
                              <TableRow>
                                <TableCell colSpan={10} className="p-10">
                                  <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
                                    <p className="text-gray-600 font-medium">
                                      Loading proposals...
                                    </p>
                                    <p className="text-gray-400 text-sm mt-2">
                                      Please wait while we load your data
                                    </p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : filteredProposals.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={10}
                                  className="text-center p-8"
                                >
                                  <div className="text-gray-500">
                                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p className="font-medium mb-2">
                                      {hasActiveFilters
                                        ? "No proposals match your filters"
                                        : "No Proposals found"}
                                    </p>
                                    <p className="text-sm">
                                      {hasActiveFilters
                                        ? "Try adjusting your search criteria or clear filters to see all proposals."
                                        : "Use the search filter above or create a new quote to get started."}
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
                                const isSelected = selectedProposals.has(
                                  proposal.policyID
                                );
                                const isApproving = approvingProposals.has(
                                  proposal.policyID
                                );

                                return (
                                  <TableRow
                                    key={proposal.policyID}
                                    className={`cursor-pointer hover:bg-blue-50/50 border-blue-100 transition-colors ${
                                      isSelected ? "bg-blue-50" : ""
                                    } ${isApproving ? "opacity-60" : ""}`}
                                    onClick={() =>
                                      navigate(`${proposal.proposalNo}/detail`)
                                    }
                                  >
                                    <TableCell>
                                      <div onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() =>
                                            handleSelectProposal(
                                              proposal.policyID
                                            )
                                          }
                                          className="h-4 w-4"
                                          disabled={isApproving}
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      <div className="space-y-1">
                                        {proposal.policyNo && (
                                          <div className="text-sm text-black font-medium">
                                            {proposal.policyNo}
                                          </div>
                                        )}
                                        <div className="text-xs text-black">
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
                                          {formatCurrency(
                                            proposal.totalPremium
                                          )}
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
                                      {getStatusBadge(
                                        proposal.remarks,
                                        proposal.tag,
                                        proposal.status
                                      )}
                                    </TableCell>
                                    {/* Actions Cell */}
                                    <TableCell>
                                      <div className="flex justify-end gap-2">
                                        {/* Approve Button
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 w-8 p-0 bg-transparent border-green-300 text-green-700 hover:bg-green-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleApproveProposal(
                                              proposal.policyID,
                                              proposal.proposalNo
                                            );
                                          }}
                                          disabled={isApproving}
                                        >
                                          {isApproving ? (
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-700"></div>
                                          ) : (
                                            <Check className="w-4 h-4" />
                                          )}
                                        </Button> */}

                                        {/* Edit Button */}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 w-8 p-0 bg-transparent border-blue-300 text-blue-700 hover:bg-blue-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditProposal(proposal);
                                          }}
                                          disabled={isApproving}
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </Button>

                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 w-8 p-0 bg-transparent border-blue-300 text-blue-700 hover:bg-blue-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            console.log(
                                              "Convert proposal:",
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
                        <div className="border-t border-blue-100 p-4 bg-blue-50/30">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-600 order-2 sm:order-1">
                              Page{" "}
                              <span className="font-medium text-blue-600">
                                {currentPage}
                              </span>{" "}
                              of{" "}
                              <span className="font-medium">{totalPages}</span>
                              {hasActiveFilters && (
                                <span className="ml-2 text-xs">
                                  (filtered results)
                                </span>
                              )}
                              {selectedProposals.size > 0 && (
                                <span className="ml-2 text-blue-700 font-medium">
                                  | {selectedProposals.size} selected
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2 order-1 sm:order-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToPage(1)}
                                disabled={currentPage === 1 || isLoading}
                                className="hidden sm:flex h-8 w-8 p-0 border-blue-300 text-blue-700 hover:bg-blue-50"
                              >
                                <ChevronsLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1 || isLoading}
                                className="h-8 w-8 p-0 border-blue-300 text-blue-700 hover:bg-blue-50"
                              >
                                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
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
                                    const maxVisible =
                                      window.innerWidth < 640 ? 3 : 5;
                                    if (totalPages <= maxVisible) {
                                      pageNum = i + 1;
                                    } else if (
                                      currentPage <= Math.ceil(maxVisible / 2)
                                    ) {
                                      pageNum = i + 1;
                                    } else if (
                                      currentPage >=
                                      totalPages - Math.floor(maxVisible / 2)
                                    ) {
                                      pageNum = totalPages - maxVisible + 1 + i;
                                    } else {
                                      pageNum =
                                        currentPage -
                                        Math.floor(maxVisible / 2) +
                                        i;
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
                                        disabled={isLoading}
                                        className={`h-8 w-8 p-0 text-xs sm:text-sm ${
                                          currentPage === pageNum
                                            ? "bg-blue-600 hover:bg-blue-700"
                                            : "border-blue-300 text-blue-700 hover:bg-blue-50"
                                        }`}
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
                                disabled={
                                  currentPage === totalPages || isLoading
                                }
                                className="h-8 w-8 p-0 border-blue-300 text-blue-700 hover:bg-blue-50"
                              >
                                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToPage(totalPages)}
                                disabled={
                                  currentPage === totalPages || isLoading
                                }
                                className="hidden sm:flex h-8 w-8 p-0 border-blue-300 text-blue-700 hover:bg-blue-50"
                              >
                                <ChevronsRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {(proposalType === "traditional" || proposalType === "both") && (
                <TabsContent
                  value="traditional"
                  className="space-y-4 sm:space-y-6"
                >
                  {/* Action Buttons */}
                  <Card className="bg-gradient-to-r from-blue-50 to-blue-50 border-blue-200">
                    <div className="p-4 pb-0">
                      <h2 className="text-xl font-bold text-gray-900">
                        Traditional Policy Proposals
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Manage and track your traditional insurance proposals
                      </p>
                    </div>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setShowTradProposal(true)}
                          className="w-full sm:w-auto text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">
                            New Traditional Proposal
                          </span>
                          <span className="sm:hidden">New</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Filters Section */}
                  <Card className="border-blue-200">
                    <Collapsible
                      open={filtersOpen}
                      onOpenChange={setFiltersOpen}
                    >
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
                                      statusFilter !== "all"
                                        ? statusFilter
                                        : null,
                                      coverTypeFilter !== "all"
                                        ? coverTypeFilter
                                        : null,
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div className="space-y-2">
                              <Label
                                htmlFor="insured-name-trad"
                                className="text-sm font-medium flex items-center gap-2"
                              >
                                <User className="w-3 h-3" />
                                Client Name
                              </Label>
                              <Input
                                id="insured-name-trad"
                                placeholder="Search by client name..."
                                value={insuredName}
                                onChange={(e) => setInsuredName(e.target.value)}
                                className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="contains-text-trad"
                                className="text-sm font-medium flex items-center gap-2"
                              >
                                <Search className="w-3 h-3" />
                                General Search
                              </Label>
                              <Input
                                id="contains-text-trad"
                                placeholder="Search proposals, policies..."
                                value={containsText}
                                onChange={(e) =>
                                  setContainsText(e.target.value)
                                }
                                className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                              />
                            </div>
                          </div>

                          {/* Filters Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Status
                              </Label>
                              <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                              >
                                <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                                  <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">
                                    All Statuses
                                  </SelectItem>
                                  <SelectItem value="in-force">
                                    In Force
                                  </SelectItem>
                                  <SelectItem value="admitted">
                                    Admitted
                                  </SelectItem>
                                  <SelectItem value="not-admitted">
                                    Not Admitted
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Cover Type
                              </Label>
                              <Select
                                value={coverTypeFilter}
                                onValueChange={setCoverTypeFilter}
                              >
                                <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                                  <SelectValue placeholder="All cover types" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">
                                    All Cover Types
                                  </SelectItem>
                                  {uniqueCoverTypes.map((coverType) => (
                                    <SelectItem
                                      key={coverType}
                                      value={coverType}
                                    >
                                      {coverType}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label
                                htmlFor="start-date-trad"
                                className="text-sm font-medium flex items-center gap-2"
                              >
                                <Calendar className="w-3 h-3" />
                                Start Date From
                              </Label>
                              <Input
                                id="start-date-trad"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label
                                htmlFor="end-date-trad"
                                className="text-sm font-medium flex items-center gap-2"
                              >
                                <Calendar className="w-3 h-3" />
                                Start Date To
                              </Label>
                              <Input
                                id="end-date-trad"
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
                                {proposals?.items?.length || 0}
                              </span>{" "}
                              proposals
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

                  {/* SELECTION ACTIONS */}
                  {selectedProposals.size > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-blue-700 font-medium">
                          {selectedProposals.size} proposal
                          {selectedProposals.size !== 1 ? "s" : ""} selected
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

                  {/* Traditional Proposals Table */}
                  <Card className="border-blue-200 mb-20">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
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
                            {isLoading ? (
                              <TableRow>
                                <TableCell colSpan={10} className="p-10">
                                  <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
                                    <p className="text-gray-600 font-medium">
                                      Loading proposals...
                                    </p>
                                    <p className="text-gray-400 text-sm mt-2">
                                      Please wait while we load your data
                                    </p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : filteredProposals.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={10}
                                  className="text-center p-8"
                                >
                                  <div className="text-gray-500">
                                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p className="font-medium mb-2">
                                      No Traditional Proposals found
                                    </p>
                                    <p className="text-sm">
                                      Create a new traditional proposal to get
                                      started.
                                    </p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredProposals.map((proposal) => {
                                const isSelected = selectedProposals.has(
                                  proposal.policyID
                                );
                                const isApproving = approvingProposals.has(
                                  proposal.policyID
                                );

                                return (
                                  <TableRow
                                    key={proposal.policyID}
                                    className={`cursor-pointer hover:bg-blue-50/50 border-blue-100 transition-colors ${
                                      isSelected ? "bg-blue-50" : ""
                                    } ${isApproving ? "opacity-60" : ""}`}
                                    onClick={() =>
                                      navigate(`${proposal.proposalNo}/detail`)
                                    }
                                  >
                                    <TableCell>
                                      <div onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() =>
                                            handleSelectProposal(
                                              proposal.policyID
                                            )
                                          }
                                          className="h-4 w-4"
                                          disabled={isApproving}
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      <div className="space-y-1">
                                        {proposal.policyNo && (
                                          <div className="text-sm text-black font-medium">
                                            {proposal.policyNo}
                                          </div>
                                        )}
                                        <div className="text-xs text-black">
                                          {proposal.proposalNo}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        <div className="font-medium text-gray-900">
                                          {proposal.fullName || "N/A"}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {proposal.sex || "N/A"}, Age{" "}
                                          {proposal.age || "N/A"}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        <div className="text-sm font-medium text-blue-700">
                                          {proposal.coverCode || "N/A"}
                                        </div>
                                        {proposal.covertype && (
                                          <div className="text-xs text-gray-500">
                                            {proposal.covertype}
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-gray-900">
                                      {formatCurrency(proposal.sumAssured)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="space-y-1">
                                        <div className="font-medium text-gray-900">
                                          {formatCurrency(
                                            proposal.totalPremium
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {proposal.fop || "N/A"}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-700">
                                      {formatDate(proposal.startDate)}
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm text-gray-900">
                                        {proposal.state || "N/A"}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {getStatusBadge(
                                        proposal.remarks,
                                        proposal.tag,
                                        proposal.status
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex justify-end gap-2">
                                        {/* Approve Button
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 w-8 p-0 bg-transparent border-green-300 text-green-700 hover:bg-green-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleApproveProposal(
                                              proposal.policyID,
                                              proposal.proposalNo
                                            );
                                          }}
                                          disabled={isApproving}
                                        >
                                          {isApproving ? (
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-700"></div>
                                          ) : (
                                            <Check className="w-4 h-4" />
                                          )}
                                        </Button> */}

                                        {/* View Button */}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 w-8 p-0 bg-transparent border-blue-300 text-blue-700 hover:bg-blue-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(
                                              `${proposal.proposalNo}/detail`
                                            );
                                          }}
                                          disabled={isApproving}
                                        >
                                          <Eye className="h-4 w-4" />
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
                        <div className="border-t border-blue-100 p-4 bg-blue-50/30">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-600 order-2 sm:order-1">
                              Page{" "}
                              <span className="font-medium text-blue-600">
                                {currentPage}
                              </span>{" "}
                              of{" "}
                              <span className="font-medium">{totalPages}</span>
                              {selectedProposals.size > 0 && (
                                <span className="ml-2 text-blue-700 font-medium">
                                  | {selectedProposals.size} selected
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2 order-1 sm:order-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToPage(1)}
                                disabled={currentPage === 1 || isLoading}
                                className="hidden sm:flex h-8 w-8 p-0 border-blue-300 text-blue-700 hover:bg-blue-50"
                              >
                                <ChevronsLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1 || isLoading}
                                className="h-8 w-8 p-0 border-blue-300 text-blue-700 hover:bg-blue-50"
                              >
                                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
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
                                    const maxVisible =
                                      window.innerWidth < 640 ? 3 : 5;
                                    if (totalPages <= maxVisible) {
                                      pageNum = i + 1;
                                    } else if (
                                      currentPage <= Math.ceil(maxVisible / 2)
                                    ) {
                                      pageNum = i + 1;
                                    } else if (
                                      currentPage >=
                                      totalPages - Math.floor(maxVisible / 2)
                                    ) {
                                      pageNum = totalPages - maxVisible + 1 + i;
                                    } else {
                                      pageNum =
                                        currentPage -
                                        Math.floor(maxVisible / 2) +
                                        i;
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
                                        disabled={isLoading}
                                        className={`h-8 w-8 p-0 text-xs sm:text-sm ${
                                          currentPage === pageNum
                                            ? "bg-blue-600 hover:bg-blue-700"
                                            : "border-blue-300 text-blue-700 hover:bg-blue-50"
                                        }`}
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
                                disabled={
                                  currentPage === totalPages || isLoading
                                }
                                className="h-8 w-8 p-0 border-blue-300 text-blue-700 hover:bg-blue-50"
                              >
                                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToPage(totalPages)}
                                disabled={
                                  currentPage === totalPages || isLoading
                                }
                                className="hidden sm:flex h-8 w-8 p-0 border-blue-300 text-blue-700 hover:bg-blue-50"
                              >
                                <ChevronsRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          ) : (
            <div className="space-y-4">
              <Card className="border-blue-200">
                <CardContent className="p-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewProposal(false);
                      setShowTradProposal(false);
                      // Refresh proposals list when returning
                      refreshProposals();
                    }}
                    className="text-sm border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Proposals
                  </Button>
                </CardContent>
              </Card>
              {showNewProposal && <NewProposal />}
              {showTradProposal && <NewTradProposal />}
            </div>
          )}
        
     
     </div>
      </div>
    </div>
  );
};

export default AgentProposal;
