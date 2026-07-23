//@ts-nocheck
import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  fetchRisks,
  selectRisks,
} from "../../../features/reducers/productReducers/productSlice";
import { 
  Plus, 
  Pencil, 
  Trash2,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Filter,
  Grid
} from "lucide-react";
import { Button } from "../../../components/UI/new-button";
import { Card, CardContent } from "../../../components/UI/card";
import { useToast } from "../../../hooks/use-toast";

// ─── helper components ───────────────────────────────────────────────

// Risk Badge component
const RiskBadge = ({ riskID }: { riskID: string }) => {
  const colors: Record<string, string> = {
    'A': '#8c4b8d',
    'B': '#2563eb',
    'CL': '#16a34a',
    'GL': '#f59e0b',
    'GPA': '#06b6d4',
    'HL': '#ef4444',
    'C': '#8b5cf6',
  };
  
  const bgColor = colors[riskID] || '#6b7280';
  
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap text-white"
      style={{ background: bgColor }}
    >
      {riskID || "N/A"}
    </span>
  );
};

const ProductMainClass = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { risks, loading: risksLoading, error: risksError } = useSelector(selectRisks);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    searchText: "",
    riskID: "",
  });

  // ─── Fetch risks ──────────────────────────────────────────────────
  const fetchRisksData = async () => {
    try {
      await dispatch(fetchRisks({
        pageNumber: 1,
        pageSize: 100 // Fetch all risks
      })).unwrap();
    } catch (error: any) {
      console.error("Failed to fetch risks:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch risks. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchRisksData();
  }, []);

  // ─── Filter risks locally ──────────────────────────────────────
  const filtered = useMemo(() => {
    return risks.filter((r: any) => {
      const searchLower = filters.searchText.toLowerCase();
      const matchesSearch = !filters.searchText || 
        r.riskID?.toLowerCase().includes(searchLower) ||
        r.riskName?.toLowerCase().includes(searchLower) ||
        r.description?.toLowerCase().includes(searchLower);
      
      const matchesRiskID = !filters.riskID || 
        r.riskID?.toLowerCase().includes(filters.riskID.toLowerCase());
      
      return matchesSearch && matchesRiskID;
    });
  }, [risks, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ─── handlers ──────────────────────────────────────────────────────

  const handleCreate = () => {
    navigate('/admin/configurations/product-main-class/new');
  };

  const handleView = (risk: any) => {
    navigate(`/admin/configurations/product-main-class/view/${risk.riskID}`, { 
      state: { riskData: risk } 
    });
  };

  const handleEdit = (risk: any) => {
    navigate(`/admin/configurations/product-main-class/edit/${risk.riskID}`, { 
      state: { riskData: risk } 
    });
  };

  const handleDelete = async (risk: any) => {
    if (window.confirm(`Are you sure you want to delete risk "${risk.riskName}"?`)) {
      toast({
        title: "Info",
        description: `Delete functionality for ${risk.riskName} will be implemented soon.`,
        variant: "default",
      });
    }
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  const applyFilters = () => setCurrentPage(1);
  const clearFilters = () => {
    setFilters({ searchText: "", riskID: "" });
    setCurrentPage(1);
  };

  // ─── loading skeleton ─────────────────────────────────────────────
  if (risksLoading && risks.length === 0) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-1/4" />
        <div className="h-12 bg-gray-100 rounded" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded" />
        ))}
      </div>
    );
  }

  // ─── error ────────────────────────────────────────────────────────
  if (risksError) {
    return (
      <div className="p-6 flex flex-col items-center gap-4 text-center">
        <p className="text-red-500 font-medium">{typeof risksError === 'string' ? risksError : 'Failed to load risks'}</p>
        <button
          onClick={fetchRisksData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm"
          style={{ background: "#0d47a1" }}
        >
          <RefreshCw size={15} /> Retry
        </button>
      </div>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <div className="container mx-auto">
        <div className="rounded-lg">
          {/* Header Card */}
          <Card className="bg-gradient-to-r from-gray-200 to-gray-200 border-white-200 mb-6">
            <div className="p-4 pb-0">
              <h2 className="text-xl font-bold text-gray-900">Product Main Classes</h2>
              <p className="text-sm text-gray-600 mt-1">Manage and configure product main classes (Risks)</p>
            </div>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchRisksData}
                  className="w-5 sm:w-auto text-xs sm:text-sm"
                >
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filter Section - Collapsible */}
          <div className="bg-white border border-gray-200 rounded-lg mb-4 overflow-hidden">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <Filter size={16} />
                Search &amp; Filters
                {filters.searchText || filters.riskID ? (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                    Active
                  </span>
                ) : null}
              </div>
              {filtersOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {filtersOpen && (
              <div className="p-4 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                    <input
                      type="text"
                      value={filters.searchText}
                      onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                      placeholder="Search by Risk ID, Name, or Description"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Risk ID</label>
                    <input
                      type="text"
                      value={filters.riskID}
                      onChange={(e) => setFilters({ ...filters, riskID: e.target.value })}
                      placeholder="Filter by Risk ID"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={applyFilters}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Table Section */}
          <div className="border border-border rounded-lg bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Risk ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Risk Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Description</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center text-gray-400">
                        No risks found.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((risk: any) => (
                      <tr
                        key={risk.riskID}
                        className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <RiskBadge riskID={risk.riskID} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-800">{risk.riskName}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-600">{risk.description || "—"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                           
                            
                            <button
                              onClick={() => handleDelete(risk)}
                              title="Delete Risk"
                              className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filtered.length > pageSize && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
                <span className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-100 transition-colors"
                  >
                    ← Prev
                  </button>
                  <span className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-100 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductMainClass;