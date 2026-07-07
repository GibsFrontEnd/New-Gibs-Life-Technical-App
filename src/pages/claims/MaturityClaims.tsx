// features/claims/pages/MaturityClaims.tsx
//@ts-nocheck

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "../../components/UI/new-button";
import { Card, CardContent } from "../../components/UI/card";
import {
  searchClaimReserves,
  deleteClaimReserve,
  selectSearchResults,
  selectSearchLoading,
  selectSearchTotalCount,
  type ClaimReserve,
} from "../../features/reducers/claimsReducers/claimsSlice";
import { ClaimFilters } from "../../components/claims/ClaimsFilters";
import { ClaimsTable } from "../../components/claims/ClaimsTable";
import { useToast } from "../../hooks/use-toast";

const MaturityClaims = () => {
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
    lossType: "Maturity",
  });

  const searchResults = useSelector(selectSearchResults);
  const loading = useSelector(selectSearchLoading);
  const totalCount = useSelector(selectSearchTotalCount);

  // No client-side slicing - use the data directly from API
  const claims = searchResults;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch claims using SV (Saving/Investment) class option
  const fetchClaims = async () => {
    try {
      const defaultDateFrom = "2000-01-01 00:00:00";
      const defaultDateTo = "2099-12-31 23:59:59";

      const params = {
        classOption: "SV",
       
        date1: filters.dateFrom || defaultDateFrom,
        date2: filters.dateTo || defaultDateTo,
        searchText: filters.searchText || "",
        pageNumber: currentPage,
        pageSize: pageSize,
      };

      console.log("🔍 Fetching maturity claims with params:", params);

      const result = await dispatch(searchClaimReserves(params)).unwrap();
      
      console.log("📦 API Response:", result);
      console.log("📊 Total Records:", result?.totalRecords);
      console.log("📋 Data length:", result?.data?.length);
      
    } catch (error) {
      console.error("Failed to fetch maturity claims:", error);
      toast({
        title: "Error",
        description: "Failed to fetch claims. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch when page, pageSize, or filters change
  useEffect(() => {
    fetchClaims();
  }, [dispatch, currentPage, pageSize, filters.searchText, filters.dateFrom, filters.dateTo]);

  // Navigate to create claim page
 const handleCreate = () => {
  navigate(`/claims/individual/maturity/create`, {
    state: { returnPath: "/claims/individual/maturity" }
  });
};

  // Navigate to edit claim page
  const handleEdit = (claim: ClaimReserve) => {
    navigate(`/claims/individual/claim/edit/${claim.claimID}`, {
      state: { returnPath: "/claims/individual/maturity" }
    });
  };

  const handleDelete = async (claim: ClaimReserve) => {
    if (window.confirm(`Are you sure you want to delete claim ${claim.claimNo}?`)) {
      try {
        await dispatch(deleteClaimReserve(claim.claimID)).unwrap();
        toast({
          title: "Success",
          description: "Claim deleted successfully!",
          variant: "default",
        });
        await fetchClaims();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error || "Failed to delete claim",
          variant: "destructive",
        });
      }
    }
  };

  const handleView = (claim: ClaimReserve) => {
    console.log("View claim:", claim);
    navigate(`/claims/individual/claim/view/${claim.claimID}`, {
      state: { returnPath: "/claims/individual/maturity" }
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
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      searchText: "",
      dateFrom: "",
      dateTo: "",
      lossType: "Maturity",
    });
    setCurrentPage(1);
  };

  const lossTypeOptions = [
    { label: "Maturity", value: "Maturity" },
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto">
        <div className="rounded-lg">
          <Card className="bg-gradient-to-r from-gray-200 to-gray-200 border-white-200 mb-6">
            <div className="p-4 pb-0">
              <h2 className="text-xl font-bold text-gray-900">
                Maturity Claims
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage and track maturity claims
              </p>
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
                  <span className="hidden sm:inline">New Maturity Claim</span>
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
          />

          <div className="border border-border rounded-lg bg-white">
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
                if (newSet.has(claim.claimID)) {
                  newSet.delete(claim.claimID);
                } else {
                  newSet.add(claim.claimID);
                }
                setSelectedClaims(newSet);
              }}
              selectedClaims={selectedClaims}
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaturityClaims;