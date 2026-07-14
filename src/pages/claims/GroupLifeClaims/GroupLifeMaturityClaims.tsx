// features/claims/pages/GroupLifeMaturityClaims.tsx
//@ts-nocheck

import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Plus, FileText } from "lucide-react";
import { Button } from "../../../components/UI/new-button";
import { Card, CardContent } from "../../../components/UI/card";
import {
  searchClaimReserves,
  deleteClaimReserve,
  selectSearchResults,
  selectSearchLoading,
  selectSearchTotalCount,
  type ClaimReserve,
} from "../../../features/reducers/claimsReducers/claimsSlice";
import ClaimFilters from "../../../components/claims/ClaimsFilters";
import ClaimsTable from "../../../components/claims/ClaimsTable";
import { useToast } from "../../../hooks/use-toast";

const GroupLifeMaturityClaims = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isMobile, setIsMobile] = useState(false);
  const [selectedClaims, setSelectedClaims] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    searchText: "",
    dateFrom: "",
    dateTo: "",
    lossType: "",
  });

  const isInitialMount = useRef(true);

  // Get data from Redux
  const searchResults = useSelector(selectSearchResults);
  const loading = useSelector(selectSearchLoading);
  const totalCount = useSelector(selectSearchTotalCount);

  // Ensure claims is always an array
  const claims = Array.isArray(searchResults) ? searchResults : [];
  
  // Debug logs
  console.log("🔍 searchResults from Redux:", searchResults);
  console.log("📊 totalCount from Redux:", totalCount);
  console.log("⏳ loading from Redux:", loading);
  console.log("📋 claims passed to table:", claims);
  console.log("📋 claims length:", claims.length);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ===== FETCH CLAIMS =====
  const fetchClaims = useCallback(async () => {
    try {
      const defaultDateFrom = "2000-01-01 00:00:00";
      const defaultDateTo = "2099-12-31 23:59:59";

      // Determine search field based on what the user typed
      let searchField = "";
      let searchText = filters.searchText || "";
      let searchTextCleaned = searchText.trim();
      
      if (searchTextCleaned) {
        // Check if it's a Claim Number
        if (searchTextCleaned.match(/^CLM/i) || 
            searchTextCleaned.match(/^GL/i) || 
            searchTextCleaned.match(/^CLM-\d+/i) ||
            searchTextCleaned.match(/^GL-\d+/i) ||
            searchTextCleaned.match(/^[A-Z]{2,3}-\d{4}-\d+/i)) {
          searchField = "ClaimNo";
        } 
        // Check if it's a Policy Number
        else if (searchTextCleaned.match(/^SV/i) || 
                 searchTextCleaned.match(/^MV/i) || 
                 searchTextCleaned.match(/^DB/i) || 
                 searchTextCleaned.match(/^PWD/i) ||
                 searchTextCleaned.match(/^POL/i) ||
                 searchTextCleaned.match(/^[A-Z]{2}\d+/i)) {
          searchField = "PolicyNo";
        } 
        // Check if it's a numeric ID (Claim ID)
        else if (searchTextCleaned.match(/^\d+$/)) {
          searchField = "ClaimID";
        } 
        // Otherwise, search by Insured Name
        else {
          searchField = "InsuredName";
        }
      }

      const params = {
        classOption: "MV",
        typeOption: "PENDING",
        date1: filters.dateFrom || defaultDateFrom,
        date2: filters.dateTo || defaultDateTo,
        searchField: searchField,
        searchText: searchTextCleaned,
        pageNumber: currentPage,
        pageSize: pageSize,
      };

      console.log("🔍 Fetching Group Life Maturity Claims with params:", params);
      console.log(`🔍 Search Field: "${searchField}", Search Text: "${searchTextCleaned}"`);

      const result = await dispatch(searchClaimReserves(params)).unwrap();
      console.log("✅ API Response:", result);
      
    } catch (error: any) {
      console.error("❌ Failed to fetch group life maturity claims:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to fetch claims. Please try again.",
        variant: "destructive",
      });
    }
  }, [dispatch, currentPage, pageSize, filters, toast]);

  // ===== FETCH ON MOUNT AND WHEN DEPENDENCIES CHANGE =====
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      console.log("🚀 Initial mount - fetching claims");
      fetchClaims();
      return;
    }
    
    console.log("🔄 Dependencies changed - fetching claims");
    fetchClaims();
  }, [fetchClaims]);

  // ===== HANDLERS =====
  const handleCreate = () => {
    navigate(`/claims/group-life/maturity/create`, {
      state: { returnPath: "/claims/group-life/maturity" }
    });
  };

  const handleEdit = (claim: ClaimReserve) => {
    navigate(`/claims/group-life/claim/edit/${claim.claimID}`, {
      state: { returnPath: "/claims/group-life/maturity" }
    });
  };

  const handleDelete = async (claim: ClaimReserve) => {
    if (window.confirm(`Are you sure you want to delete claim ${claim.claimNo}?`)) {
      try {
        await dispatch(deleteClaimReserve(claim.claimID)).unwrap();
        toast({ title: "Success", description: "Claim deleted successfully!", variant: "default" });
        await fetchClaims();
      } catch (error: any) {
        toast({ title: "Error", description: error || "Failed to delete claim", variant: "destructive" });
      }
    }
  };

  const handleView = (claim: ClaimReserve) => {
    navigate(`/claims/group-life/claim/view/${claim.claimID}`, {
      state: { returnPath: "/claims/group-life/maturity" }
    });
  };

  const handlePageChange = (page: number) => {
    console.log("📄 Changing to page:", page);
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    console.log("📏 Changing page size to:", size);
    setPageSize(size);
    setCurrentPage(1);
  };

  const applyFilters = () => {
    console.log("🔍 Applying filters - fetching claims");
    setCurrentPage(1);
    // fetchClaims will be called by useEffect when currentPage changes
  };

  const clearFilters = () => {
    console.log("🧹 Clearing filters");
    setFilters({
      searchText: "",
      dateFrom: "",
      dateTo: "",
      lossType: "",
    });
    setCurrentPage(1);
  };

  const lossTypeOptions = [{ label: "Group Life Maturity", value: "Group Life Maturity" }];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto">
        <div className="rounded-lg">
          <Card className="bg-gradient-to-r from-gray-200 to-gray-200 border-white-200 mb-6">
            <div className="p-4 pb-0">
              <h2 className="text-xl font-bold text-gray-900">Group Life Maturity Claims</h2>
              <p className="text-sm text-gray-600 mt-1">Manage and track group life maturity claims</p>
            </div>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCreate}
                  className="w-full sm:w-auto text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">New Group Life Maturity Claim</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <ClaimFilters
            filters={filters}
            onFilterChange={setFilters}
            onApply={applyFilters}
            onClear={clearFilters}
            lossTypeOptions={lossTypeOptions}
            showLossType={false}
            autoFetch={true}
          />

          <div className="border border-border rounded-lg bg-white">
            {claims.length === 0 && !loading ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm font-medium mb-2">No claims found</p>
                <p className="text-xs">Try adjusting your filters or create a new claim.</p>
              </div>
            ) : (
              <ClaimsTable
                claims={claims}
                loading={loading}
                totalCount={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onSelect={(claim) => {
                  const newSet = new Set(selectedClaims);
                  if (newSet.has(claim.claimID)) newSet.delete(claim.claimID);
                  else newSet.add(claim.claimID);
                  setSelectedClaims(newSet);
                }}
                selectedClaims={selectedClaims}
                isMobile={isMobile}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupLifeMaturityClaims;