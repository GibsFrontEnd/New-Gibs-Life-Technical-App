// @ts-nocheck
// @ts-nocheck

import { useEffect, useState, useCallback, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../UI/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../UI/collapsible";
import { Checkbox } from "../UI/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../UI/new-select";
import { Input } from "../UI/new-input";
import { Filter, Search } from "lucide-react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Trash2,
  Check,
  Pencil,
} from "lucide-react";
import { Button } from "../UI/new-button";
import { useAppDispatch, useAppSelector } from "../../hooks/use-apps";
import {
  clearQuotations,
  getQuotations,
  getQuotationsByAgent,
  getTraditionalQuotationsByAgent,
  selectQuotations,
} from "../../features/reducers/quotationReducers/quotationSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../UI/table";
import { Skeleton } from "../UI/skeleton";
import { formatCurrency, formatDate } from "../../utils/ui-utilities";
import { Badge } from "../UI/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../UI/card";
import NewQuotation from "./NewQuotation";
import NewTradQuotation from "./NewTradQuotation";
import EditQuotation from "./EditQuotation";
import EditTradQuotation from "./EditTradQuotation";

interface AgentQuotationProps {
  quotationType?: "investments" | "traditional" | "both";
}

const AgentQuotation = ({ quotationType = "both" }: AgentQuotationProps) => {
  const dispatch = useAppDispatch();
  const [isMobile, setIsMobile] = useState(false);
  const [searchFilter, setSearchFilter] = useState(false);
  const [activeTab, setActiveTab] = useState(
    quotationType === "traditional" ? "traditional" : "investments"
  );
  const [filterCriteria, setFilterCriteria] = useState({
    searchField: "fullName",
    searchValue: "",
    startDate: "",
    endDate: "",
    status: "all",
    coverCode: "",
  });
  const [showNewQuotation, setShowNewQuotation] = useState(false);
  const [showNewTradQuotation, setShowNewTradQuotation] = useState(false);
  const [showEditQuotation, setShowEditQuotation] = useState(false);
  const [showEditTradQuotation, setShowEditTradQuotation] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<any>(null);

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

  // DEBUGGING REMOVE LATER
  const rawQuotState = useAppSelector(selectQuotations);

  const {
    //@ts-ignore
    quotations = { items: [], totalCount: 0 },
    //@ts-ignore
    loading: loadingState = false,
  } = rawQuotState || {};

  const isLoading =
    typeof loadingState === "boolean"
      ? loadingState
      : Boolean(
          loadingState?.getQuotations ||
            loadingState?.getQuotationsByAgent ||
            loadingState?.getTraditionalQuotationsByAgent
        );

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // CHANGED FROM 100 TO 20

  const [filteredQuotations, setFilteredQuotations] = useState<any>(null);

  // Optimized fetch function with useCallback
  const fetchQuotations = useCallback(() => {
    const agentId = localStorage.getItem("agentId");

    // Remove any artificial delays
    if (agentId) {
      if (activeTab === "traditional") {
        dispatch(
          getTraditionalQuotationsByAgent({
            agentCode: agentId,
            page: currentPage,
            pageSize,
          })
        );
      } else if (activeTab === "investments") {
        dispatch(
          getQuotationsByAgent({
            agentCode: agentId,
            page: currentPage,
            pageSize,
          })
        );
      }
    } else {
      dispatch(getQuotations({ page: currentPage, pageSize }));
    }

    setFilteredQuotations(null);
    setSelectedQuotations(new Set());
    setIsAllSelected(false);
  }, [currentPage, dispatch, pageSize, activeTab]);

  // Handle tab changes and reset pagination
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
    setFilterCriteria({
      searchField: "fullName",
      searchValue: "",
      startDate: "",
      endDate: "",
      status: "all",
      coverCode: "",
    });
    setFilteredQuotations(null);
    setSelectedQuotations(new Set());
    setIsAllSelected(false);
  }, []);

  // Filter quotations by tab (Investment = B, Traditional = A) - memoized
  const getQuotationsByTab = useCallback(
    (quotationsData: any) => {
      if (!quotationsData?.items) return { items: [], totalCount: 0 };

      const targetTag = activeTab === "investments" ? "B" : "A";
      const filteredItems = quotationsData.items.filter(
        (quote: any) => quote.tag === targetTag
      );

      return {
        items: filteredItems,
        totalCount: filteredItems.length,
      };
    },
    [activeTab]
  );

  // Memoized tab filtered quotations
  const tabFilteredQuotations = useMemo(
    () => getQuotationsByTab(quotations),
    [getQuotationsByTab, quotations]
  );

  // NEW: Checkbox handlers - optimized
  const handleSelectQuotation = useCallback(
    (quoteId: string) => {
      const newSelected = new Set(selectedQuotations);
      if (newSelected.has(quoteId)) {
        newSelected.delete(quoteId);
      } else {
        newSelected.add(quoteId);
      }
      setSelectedQuotations(newSelected);

      const displayQuotations = filteredQuotations || tabFilteredQuotations;
      setIsAllSelected(newSelected.size === displayQuotations?.items?.length);
    },
    [selectedQuotations, filteredQuotations, tabFilteredQuotations]
  );

  const handleSelectAll = useCallback(() => {
    const displayQuotations = filteredQuotations || tabFilteredQuotations;

    if (isAllSelected) {
      setSelectedQuotations(new Set());
    } else {
      const allIds = new Set(
        displayQuotations.items.map((quote: any) => quote.quoteID)
      );
      setSelectedQuotations(allIds);
    }
    setIsAllSelected(!isAllSelected);
  }, [isAllSelected, filteredQuotations, tabFilteredQuotations]);

  // NEW: Handle individual quotation approval
  const handleApproveQuotation = useCallback(
    async (quoteId: string, quoteNo: string) => {
      if (!quoteId) {
        setApproveError("Invalid quotation ID");
        return;
      }

      try {
        setApprovingQuotations((prev) => new Set(prev).add(quoteId));
        setApproveError("");

        // TODO: Replace with your actual API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        setTimeout(() => {
          setShowSuccessToast(false);
        }, 1000);

        setTimeout(() => {
          setShowSuccessToast(false);
        }, 5000);

        dispatch(clearQuotations());
        fetchQuotations();

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
    },
    [dispatch, fetchQuotations, selectedQuotations]
  );

  // NEW: Handle bulk approval of selected quotations
  const handleBulkApprove = useCallback(async () => {
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
        }, 1000);
      }

      dispatch(clearQuotations());
      fetchQuotations();

      setSelectedQuotations(new Set());
      setIsAllSelected(false);
    } catch (err) {
      const errorMessage = err?.message || "Unknown error occurred";
      setApproveError("Error during bulk approval: " + errorMessage);
    } finally {
      setApprovingQuotations(new Set());
    }
  }, [selectedQuotations, dispatch, fetchQuotations]);

  // Filter functions - optimized
  const applyFilters = useCallback(() => {
    if (!tabFilteredQuotations?.items) return;

    let filtered = [...tabFilteredQuotations.items];

    // Apply search filter
    if (filterCriteria.searchValue.trim()) {
      filtered = filtered.filter((quote) => {
        const searchValue = filterCriteria.searchValue.toLowerCase();
        switch (filterCriteria.searchField) {
          case "fullName":
            const fullName = `${quote.surName || ""} ${
              quote.otherNames || ""
            }`.toLowerCase();
            return fullName.includes(searchValue);
          case "quoteNo":
            return quote.quoteNo?.toLowerCase().includes(searchValue);
          case "proposalNo":
            return quote.proposalNo?.toLowerCase().includes(searchValue);
          case "coverCode":
            return quote.coverCode?.toLowerCase().includes(searchValue);
          default:
            return true;
        }
      });
    }

    // Apply date filters - optimized with timestamps
    if (filterCriteria.startDate) {
      const startDate = new Date(filterCriteria.startDate).getTime();
      filtered = filtered.filter((quote) => {
        const quoteDate = new Date(quote.startDate).getTime();
        return quoteDate >= startDate;
      });
    }

    if (filterCriteria.endDate) {
      const endDate = new Date(filterCriteria.endDate).getTime();
      filtered = filtered.filter((quote) => {
        const quoteDate = new Date(quote.startDate).getTime();
        return quoteDate <= endDate;
      });
    }

    // Apply status filter
    if (filterCriteria.status !== "all") {
      filtered = filtered.filter(
        (quote) =>
          quote.status?.toLowerCase() === filterCriteria.status.toLowerCase()
      );
    }

    // Apply cover code filter
    if (filterCriteria.coverCode.trim()) {
      filtered = filtered.filter((quote) =>
        quote.coverCode
          ?.toLowerCase()
          .includes(filterCriteria.coverCode.toLowerCase())
      );
    }

    setFilteredQuotations({
      items: filtered,
      totalCount: filtered.length,
    });

    setSelectedQuotations(new Set());
    setIsAllSelected(false);
  }, [tabFilteredQuotations, filterCriteria]);

  const clearFilters = useCallback(() => {
    setFilterCriteria({
      searchField: "fullName",
      searchValue: "",
      startDate: "",
      endDate: "",
      status: "all",
      coverCode: "",
    });
    setFilteredQuotations(null);
    setSelectedQuotations(new Set());
    setIsAllSelected(false);
  }, []);

  // Main data fetching effect
  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Get quotations filtered by current tab
  const displayQuotations = filteredQuotations || tabFilteredQuotations;
  const totalPages = displayQuotations
    ? Math.ceil(displayQuotations.totalCount / pageSize)
    : 0;

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  const handleEditQuotation = useCallback(
    (quote: any) => {
      setEditingQuotation(quote);
      if (activeTab === "investments") {
        setShowEditQuotation(true);
      } else if (activeTab === "traditional") {
        setShowEditTradQuotation(true);
      }
    },
    [activeTab]
  );

  const handleCloseEdit = useCallback(() => {
    setShowEditQuotation(false);
    setShowEditTradQuotation(false);
    setEditingQuotation(null);
    fetchQuotations();
  }, [fetchQuotations]);

  // Rest of your component JSX remains exactly the same...
  // Only the performance-critical parts above were optimized

  return (
    <div className="min-h-screen">
      <div className="container mx-auto ">
        <div className="rounded-lg">
          <div className="p-4 lg:p-6">
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

            {showNewQuotation ? (
              <div>
                <div className="mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewQuotation(false)}
                    className="mb-4"
                  >
                    ← Back to Quotations
                  </Button>
                </div>
                <NewQuotation />
              </div>
            ) : showNewTradQuotation ? (
              <div>
                <div className="mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewTradQuotation(false)}
                    className="mb-4"
                  >
                    ← Back to Quotations
                  </Button>
                </div>
                <NewTradQuotation />
              </div>
            ) : showEditQuotation ? (
              <div>
                <div className="mb-4">
                  <Button
                    variant="outline"
                    onClick={handleCloseEdit}
                    className="mb-4 bg-transparent"
                  >
                    ← Back to Quotations
                  </Button>
                </div>
                <EditQuotation
                  quotation={editingQuotation}
                  onClose={handleCloseEdit}
                />
              </div>
            ) : showEditTradQuotation ? (
              <div>
                <div className="mb-4">
                  <Button
                    variant="outline"
                    onClick={handleCloseEdit}
                    className="mb-4 bg-transparent"
                  >
                    ← Back to Quotations
                  </Button>
                </div>
                <EditTradQuotation
                  quotation={editingQuotation}
                  onClose={handleCloseEdit}
                />
              </div>
            ) : (
              <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-full"
              >
                {/* ERROR MESSAGES - MOVED TO GLOBAL LEVEL */}
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

                {(quotationType === "investments" ||
                  quotationType === "both") && (
                  <TabsContent value="investments" className="mt-6">
                    {/* Action Buttons */}
                    <Card className="bg-gradient-to-r from-gray-200 to-gray-200 border-white-200">
                      <div className="p-4 pb-0">
                        <h2 className="text-xl font-bold text-gray-900">
                          Investment Policy Quotes
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          Manage quotation operations and records
                        </p>
                      </div>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full sm:w-auto text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => setShowNewQuotation(true)}
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">New Quote</span>
                            <span className="sm:hidden">New</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Search Filter Section */}
                    <Collapsible
                      open={searchFilter}
                      onOpenChange={setSearchFilter}
                    >
                      <div className="border rounded-lg mb-6 mt-6 bg-gray-50">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 cursor-pointer">
                            <div className="flex items-center space-x-2">
                              <Filter className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                Search Filter
                              </span>
                            </div>
                            <Checkbox checked={searchFilter} />
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
                                    <SelectItem value="fullName">
                                      Client Name
                                    </SelectItem>
                                    <SelectItem value="quoteNo">
                                      Quote Number
                                    </SelectItem>
                                    <SelectItem value="proposalNo">
                                      Proposal Number
                                    </SelectItem>
                                    <SelectItem value="coverCode">
                                      Cover Code
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
                                    <SelectItem value="all">
                                      All Statuses
                                    </SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="active">
                                      Active
                                    </SelectItem>
                                    <SelectItem value="pending">
                                      Pending
                                    </SelectItem>
                                    <SelectItem value="cancelled">
                                      Cancelled
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm text-gray-600 mb-1 block">
                                  Cover Code
                                </label>
                                <Input
                                  value={filterCriteria.coverCode}
                                  onChange={(e) =>
                                    setFilterCriteria((prev) => ({
                                      ...prev,
                                      coverCode: e.target.value,
                                    }))
                                  }
                                  placeholder="Enter cover code"
                                />
                              </div>
                              <div className="flex items-end">
                                <Button
                                  variant="outline"
                                  className="w-full bg-transparent"
                                  onClick={clearFilters}
                                >
                                  Clear Filters
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>

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

                    {/* Data Display Area */}
                    <QuotationDataDisplay
                      isLoading={isLoading}
                      displayQuotations={displayQuotations}
                      isMobile={isMobile}
                      pageSize={pageSize}
                      handleEditQuotation={handleEditQuotation}
                      handleApproveQuotation={handleApproveQuotation}
                      handleSelectQuotation={handleSelectQuotation}
                      handleSelectAll={handleSelectAll}
                      selectedQuotations={selectedQuotations}
                      isAllSelected={isAllSelected}
                      approvingQuotations={approvingQuotations}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      goToPage={goToPage}
                    />
                  </TabsContent>
                )}

                {(quotationType === "traditional" ||
                  quotationType === "both") && (
                  <TabsContent value="traditional" className="mt-6">
                    {/* Action Buttons */}
                    <Card className="bg-gradient-to-r from-gray-200 to-gray-200 border-blue-200">
                      <div className="p-4 pb-0">
                        <h2 className="text-xl font-bold text-gray-900">
                          Traditional Policy Quotes
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          Manage quotation operations and records
                        </p>
                      </div>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full sm:w-auto text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => setShowNewTradQuotation(true)}
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">New Quote</span>
                            <span className="sm:hidden">New</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Search Filter Section */}
                    <Collapsible
                      open={searchFilter}
                      onOpenChange={setSearchFilter}
                    >
                      <div className="border rounded-lg mb-6 mt-6 bg-gray-50">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 cursor-pointer">
                            <div className="flex items-center space-x-2">
                              <Filter className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                Search Filter
                              </span>
                            </div>
                            <Checkbox checked={searchFilter} />
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
                                    <SelectItem value="fullName">
                                      Client Name
                                    </SelectItem>
                                    <SelectItem value="quoteNo">
                                      Quote Number
                                    </SelectItem>
                                    <SelectItem value="proposalNo">
                                      Proposal Number
                                    </SelectItem>
                                    <SelectItem value="coverCode">
                                      Cover Code
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
                                  className="w-full bg-blue-600 hover:bg-blue-700"
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
                                    <SelectItem value="all">
                                      All Statuses
                                    </SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="active">
                                      Active
                                    </SelectItem>
                                    <SelectItem value="pending">
                                      Pending
                                    </SelectItem>
                                    <SelectItem value="cancelled">
                                      Cancelled
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm text-gray-600 mb-1 block">
                                  Cover Code
                                </label>
                                <Input
                                  value={filterCriteria.coverCode}
                                  onChange={(e) =>
                                    setFilterCriteria((prev) => ({
                                      ...prev,
                                      coverCode: e.target.value,
                                    }))
                                  }
                                  placeholder="Enter cover code"
                                />
                              </div>
                              <div className="flex items-end">
                                <Button
                                  variant="outline"
                                  className="w-full bg-transparent"
                                  onClick={clearFilters}
                                >
                                  Clear Filters
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>

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

                    {/* Data Display Area */}
                    <QuotationDataDisplay
                      isLoading={isLoading}
                      displayQuotations={displayQuotations}
                      isMobile={isMobile}
                      pageSize={pageSize}
                      handleEditQuotation={handleEditQuotation}
                      handleApproveQuotation={handleApproveQuotation}
                      handleSelectQuotation={handleSelectQuotation}
                      handleSelectAll={handleSelectAll}
                      selectedQuotations={selectedQuotations}
                      isAllSelected={isAllSelected}
                      approvingQuotations={approvingQuotations}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      goToPage={goToPage}
                    />
                  </TabsContent>
                )}
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Keep all your existing helper components exactly the same...
// QuotationDataDisplay, QuotationCard, getStatusBadge, calculateAge

const QuotationDataDisplay = ({
  isLoading,
  displayQuotations,
  isMobile,
  pageSize,
  handleEditQuotation,
  handleApproveQuotation,
  handleSelectQuotation,
  handleSelectAll,
  selectedQuotations,
  isAllSelected,
  approvingQuotations,
  currentPage,
  totalPages,
  goToPage,
}: {
  isLoading: boolean;
  displayQuotations: any;
  isMobile: boolean;
  pageSize: number;
  handleEditQuotation: (quote: any) => void;
  handleApproveQuotation: (quoteId: string, quoteNo: string) => void;
  handleSelectQuotation: (quoteId: string) => void;
  handleSelectAll: () => void;
  selectedQuotations: Set<string>;
  isAllSelected: boolean;
  approvingQuotations: Set<string>;
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(
    currentPage * pageSize,
    displayQuotations?.totalCount || 0
  );
  const totalItems = displayQuotations?.totalCount || 0;

  return (
    <div className="border border-border rounded-lg min-h-96 bg-white">
      {isLoading ? (
        // Loading state with spinner
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading quotations...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait</p>
        </div>
      ) : !displayQuotations?.items || displayQuotations.items.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>No Quotations found matching the current criteria.</p>
          <p className="text-sm mt-2">
            Use the search filter above or create a new quote to get started.
          </p>
        </div>
      ) : (
        <div className="p-4">
          {isMobile ? (
            // Mobile card view
            <div>
              {displayQuotations.items.map((quote: any) => (
                <QuotationCard
                  key={quote.quoteID}
                  quote={quote}
                  onEdit={handleEditQuotation}
                  onApprove={handleApproveQuotation}
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
                    <TableHead>Policy/Quotation No.</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Cover Type</TableHead>
                    <TableHead className="text-right">Sum Assured</TableHead>
                    <TableHead className="text-right">First Premium</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayQuotations.items.map((quote: any) => {
                    const isSelected = selectedQuotations.has(quote.quoteID);
                    const isApproving = approvingQuotations.has(quote.quoteID);

                    return (
                      <TableRow
                        key={quote.quoteID}
                        className={`${isSelected ? "bg-blue-50" : ""} ${
                          isApproving ? "opacity-60" : ""
                        }`}
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
                              {quote.quoteNo}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {quote.proposalNo}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {`${quote.surName || ""} ${
                                quote.otherNames || ""
                              }`.trim() || "N/A"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {quote.sex ? `${quote.sex}, ` : ""}Age{" "}
                              {calculateAge(quote.dateofBirth)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {quote.coverCode}
                            </div>
                            {quote.covertype &&
                              quote.covertype !== quote.coverCode && (
                                <div className="text-xs text-muted-foreground">
                                  {quote.covertype}
                                </div>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(quote.sumAssured)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <div>{formatCurrency(quote.basicPremium)}</div>
                            <div className="text-xs text-muted-foreground">
                              {quote.cardNo}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(quote.startDate)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {quote.brCode || "N/A"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Duration: {quote.duration} years
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(quote.status)}</TableCell>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log("Delete quote:", quote.quoteNo);
                              }}
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
          {displayQuotations && totalPages > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Showing {startItem} to {endItem} of {totalItems} entries | Page{" "}
                {currentPage} of {totalPages}
                {selectedQuotations.size > 0 &&
                  ` | ${selectedQuotations.size} selected`}
              </div>

              <div className="flex items-center space-x-1 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(1)}
                  // @ts-ignore
                  disabled={currentPage === 1 || isLoading}
                  className="hidden sm:flex"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  // @ts-ignore
                  disabled={currentPage === 1 || isLoading}
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
                      } else if (currentPage <= Math.floor(maxPages / 2) + 1) {
                        pageNum = i + 1;
                      } else if (
                        currentPage >=
                        totalPages - Math.floor(maxPages / 2)
                      ) {
                        pageNum = totalPages - maxPages + 1 + i;
                      } else {
                        pageNum = currentPage - Math.floor(maxPages / 2) + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => goToPage(pageNum)}
                          // @ts-ignore
                          disabled={isLoading}
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
                  // @ts-ignore
                  disabled={currentPage === totalPages || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(totalPages)}
                  // @ts-ignore
                  disabled={currentPage === totalPages || isLoading}
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
  );
};

const QuotationCard = ({
  quote,
  onEdit,
  onApprove,
  onSelect,
  isSelected,
  isApproving,
}: {
  quote: any;
  onEdit: (quote: any) => void;
  onApprove: (quoteId: string, quoteNo: string) => void;
  onSelect: (quoteId: string) => void;
  isSelected: boolean;
  isApproving: boolean;
}) => (
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
            {`${quote.surName || ""} ${quote.otherNames || ""}`.trim() || "N/A"}
          </CardTitle>
        </div>
        {getStatusBadge(quote.status)}
      </div>
      <div className="text-sm text-muted-foreground ml-7">
        {quote.sex ? `${quote.sex}, ` : ""}Age {calculateAge(quote.dateofBirth)}
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <span className="font-medium text-muted-foreground">Quote No:</span>
          <div className="font-medium">{quote.quoteNo}</div>
          <div className="text-xs text-muted-foreground">
            {quote.proposalNo}
          </div>
        </div>
        <div>
          <span className="font-medium text-muted-foreground">Cover Type:</span>
          <div className="font-medium">{quote.coverCode}</div>
          {quote.covertype && quote.covertype !== quote.coverCode && (
            <div className="text-xs text-muted-foreground">
              {quote.covertype}
            </div>
          )}
        </div>
        <div>
          <span className="font-medium text-muted-foreground">
            Sum Assured:
          </span>
          <div className="font-medium">{formatCurrency(quote.sumAssured)}</div>
        </div>
        <div>
          <span className="font-medium text-muted-foreground">Premium:</span>
          <div className="font-medium">
            {formatCurrency(quote.totalPremium)}
          </div>
          <div className="text-xs text-muted-foreground">{quote.cardNo}</div>
        </div>
        <div>
          <span className="font-medium text-muted-foreground">Start Date:</span>
          <div>{formatDate(quote.startDate)}</div>
        </div>
        <div>
          <span className="font-medium text-muted-foreground">Branch:</span>
          <div>{quote.brCode || "N/A"}</div>
          <div className="text-xs text-muted-foreground">
            Duration: {quote.duration} years
          </div>
        </div>
      </div>
      {/* Action buttons for mobile */}
      <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent border-red-300 text-red-700 hover:bg-red-50"
          onClick={(e) => {
            console.log("Delete quote:", quote.quoteNo);
          }}
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

const getStatusBadge = (status: string | null) => {
  if (!status) return <Badge variant="secondary">Unknown</Badge>;

  switch (status.toLowerCase()) {
    case "draft":
      return <Badge variant="outline">Draft</Badge>;
    case "active":
      return <Badge variant="default">Active</Badge>;
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const calculateAge = (dateOfBirth: string | null) => {
  if (!dateOfBirth) return "N/A";
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age.toString();
};

export default AgentQuotation;
