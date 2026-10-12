//@ts-nocheck
import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  fetchProductSections, 
  deleteProductSection,
  selectProductSections,
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
  Settings,
  Layers,
  Package,
  FileText,
  BarChart,
  Grid
} from "lucide-react";
import { Button } from "../../../components/UI/new-button";
import { Card, CardContent } from "../../../components/UI/card";
import { useToast } from "../../../hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "../../../components/UI/tabs";

// Status Badge for Section Active Status
const StatusBadge = ({ active }: { active: number }) => {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
        active === 1 
          ? 'bg-green-100 text-green-700' 
          : 'bg-red-100 text-red-700'
      }`}
    >
      {active === 1 ? 'Active' : 'Inactive'}
    </span>
  );
};

const ProductSections = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const { sections, loading, error } = useSelector(selectProductSections);

  const [isMobile, setIsMobile] = useState(false);
  const [selectedSections, setSelectedSections] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    subRiskID: "",
    sectionName: "",
  });

  // ─── Get active tab based on current path ──────────────────────
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('product-main-class')) return 'product-main-class';
    if (path.includes('product-lines')) return 'product-lines';
    if (path.includes('product-settings')) return 'product-settings';
    if (path.includes('product-sections')) return 'product-sections';
    if (path.includes('product-smi')) return 'product-smi';
    return 'product-sections';
  };

  const activeTab = getActiveTab();

  // ─── Tab navigation ──────────────────────────────────────────────
  const handleTabChange = (value: string) => {
    navigate(`/admin/configurations/${value}`);
  };

  // ─── Mobile detection ─────────────────────────────────────────────
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ─── Fetch sections ──────────────────────────────────────────────
  const fetchData = async () => {
    try {
      await dispatch(fetchProductSections(filters.search || undefined)).unwrap();
    } catch (error: any) {
      console.error("Failed to fetch sections:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch sections. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [dispatch, filters.search]);

  // ─── Filter sections locally ──────────────────────────────────────
  const filtered = useMemo(() => {
    return sections.filter((section: any) => {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = !filters.search || 
        section.sectionCode?.toLowerCase().includes(searchLower) ||
        section.sectionName?.toLowerCase().includes(searchLower) ||
        section.subRiskID?.toLowerCase().includes(searchLower) ||
        section.subRiskName?.toLowerCase().includes(searchLower);
      
      const matchesSubRisk = !filters.subRiskID || 
        section.subRiskID?.toLowerCase().includes(filters.subRiskID.toLowerCase());
      
      const matchesSectionName = !filters.sectionName || 
        section.sectionName?.toLowerCase().includes(filters.sectionName.toLowerCase());
      
      return matchesSearch && matchesSubRisk && matchesSectionName;
    });
  }, [sections, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ─── handlers ──────────────────────────────────────────────────────

  const handleCreate = () => {
    navigate('/admin/configurations/product-sections/new');
  };

  const handleView = (section: any) => {
    navigate(`/admin/configurations/product-sections/view/${section.sectionID}`, { 
      state: { sectionData: section } 
    });
  };

  const handleEdit = (section: any) => {
    navigate(`/admin/configurations/product-sections/edit/${section.sectionID}`, { 
      state: { sectionData: section } 
    });
  };

  const handleDelete = async (section: any) => {
    if (window.confirm(`Are you sure you want to delete section "${section.sectionName}"?`)) {
      try {
        await dispatch(deleteProductSection(section.sectionID)).unwrap();
        toast({ 
          title: "Success", 
          description: "Section deleted successfully!", 
          variant: "default" 
        });
        await fetchData();
      } catch (error: any) {
        toast({ 
          title: "Error", 
          description: error.message || "Failed to delete section", 
          variant: "destructive" 
        });
      }
    }
  };

  const handlePageChange = (page: number) => setCurrentPage(page);
  const applyFilters = () => setCurrentPage(1);
  const clearFilters = () => {
    setFilters({ search: "", subRiskID: "", sectionName: "" });
    setCurrentPage(1);
  };

  // ─── loading skeleton ─────────────────────────────────────────────
  if (loading && sections.length === 0) {
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
  if (error) {
    return (
      <div className="p-6 flex flex-col items-center gap-4 text-center">
        <p className="text-red-500 font-medium">{typeof error === 'string' ? error : 'Failed to load sections'}</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm"
          style={{ background: "#0d47a1" }}
        >
          <RefreshCw size={15} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto">
        <div className="rounded-lg">
          
          {/* ===== TABS NAVIGATION ===== */}
          <div className="bg-white border-b border-gray-200 rounded-t-lg">
            <Tabs 
              value={activeTab}
              onValueChange={handleTabChange}
              variant="default" 
              size="md"
            >
              <TabsList fullWidth className="px-4 pt-2 pb-1">
                <TabsTrigger 
                  value="product-main-class" 
                  icon={<Grid className="w-4 h-4" />}
                  className="flex-1 justify-center"
                >
                  Product Main Class
                </TabsTrigger>
                <TabsTrigger 
                  value="product-lines" 
                  icon={<Layers className="w-4 h-4" />}
                  className="flex-1 justify-center"
                >
                  Product Lines
                </TabsTrigger>
                <TabsTrigger 
                  value="product-settings" 
                  icon={<Package className="w-4 h-4" />}
                  className="flex-1 justify-center"
                >
                  Product Settings
                </TabsTrigger>
                <TabsTrigger 
                  value="product-sections" 
                  icon={<FileText className="w-4 h-4" />}
                  className="flex-1 justify-center"
                >
                  Product Sections
                </TabsTrigger>
                <TabsTrigger 
                  value="product-smi" 
                  icon={<BarChart className="w-4 h-4" />}
                  className="flex-1 justify-center"
                >
                  Product SMI
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* ===== CONTENT ===== */}
          <div className="bg-white rounded-b-lg p-4">
            {/* Header Card */}
            <Card className="bg-gradient-to-r from-gray-200 to-gray-200 border-white-200 mb-6">
              <div className="p-4 pb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Product Sections</h2>
                    <p className="text-sm text-gray-600 mt-1">Manage and configure product sections</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleCreate}
                    className="w-30 sm:w-auto text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 hover:border-gray-300 transition-all duration-200 mb-4 group shadow-sm hover:shadow-md text-white"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">New Section</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchData}
                    className="w-5 sm:w-auto text-xs sm:text-sm"
                  >
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Filter Section */}
            <div className="bg-white border border-gray-200 rounded-lg mb-4 overflow-hidden">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  <Filter size={16} />
                  Search &amp; Filters
                  {filters.search || filters.subRiskID || filters.sectionName ? (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                      Active
                    </span>
                  ) : null}
                </div>
                {filtersOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              {filtersOpen && (
                <div className="p-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                      <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        placeholder="Search by Code, Name, or Risk"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Sub Risk ID</label>
                      <input
                        type="text"
                        value={filters.subRiskID}
                        onChange={(e) => setFilters({ ...filters, subRiskID: e.target.value })}
                        placeholder="e.g. GPA, GL"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Section Name</label>
                      <input
                        type="text"
                        value={filters.sectionName}
                        onChange={(e) => setFilters({ ...filters, sectionName: e.target.value })}
                        placeholder="Search by section name"
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
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Code</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Section Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Sub Risk</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Rates</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-gray-400">
                          No sections found.
                        </td>
                      </tr>
                    ) : (
                      paginated.map((section: any) => (
                        <tr
                          key={section.sectionID}
                          className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-800">{section.sectionCode}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-800">{section.sectionName}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-800">{section.subRiskID}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{section.subRiskName || '—'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-800">{section.rates || 0}</div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge active={section.active} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleView(section)}
                                title="View Details"
                                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleEdit(section)}
                                title="Edit Section"
                                className="p-2 rounded-lg text-[#0d47a1] hover:bg-[#0d47a1]/10 transition-colors"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(section)}
                                title="Delete Section"
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
    </div>
  );
};

export default ProductSections;