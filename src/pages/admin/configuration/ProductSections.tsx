//@ts-nocheck
import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  fetchProducts, 
  deleteProduct, 
  updateProductType,
  selectProductsList,
  selectCurrentProduct,
  clearCurrentProduct,
  setCurrentProduct
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
  FileText
} from "lucide-react";
import { Button } from "../../../components/UI/new-button";
import { Card, CardContent } from "../../../components/UI/card";
import { useToast } from "../../../hooks/use-toast";

const StatusBadge = ({ type }: { type: string | null }) => {
  const colors: Record<string, string> = {
    'Investment': '#8c4b8d',
    'Traditional': '#2563eb',
    'Group': '#16a34a',
    'Individual': '#f59e0b',
    'GPA': '#06b6d4',
    'GL': '#3b82f6',
  };
  
  const bgColor = type && colors[type] ? colors[type] : '#6b7280';
  
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap text-white"
      style={{ background: bgColor }}
    >
      {type || "Uncategorized"}
    </span>
  );
};

const ProductSections = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { products, totalCount, loading, error } = useSelector(selectProductsList);
  const { currentProduct } = useSelector(selectCurrentProduct);

  const [isMobile, setIsMobile] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    searchText: "",
    productType: "",
    riskID: "",
  });

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    type: "",
    modifiedBy: ""
  });

  // ─── Mobile detection ─────────────────────────────────────────────
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ─── Fetch products ──────────────────────────────────────────────
  const fetchProductsData = async () => {
    try {
      await dispatch(fetchProducts({ 
        pageNo: currentPage, 
        pageSize: pageSize,
        searchText: filters.searchText || undefined
      })).unwrap();
    } catch (error: any) {
      console.error("Failed to fetch products:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch products. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchProductsData();
  }, [dispatch, currentPage, pageSize, filters.searchText]);

  // ─── Filter products locally ──────────────────────────────────────
  const filtered = useMemo(() => {
    // Filter for Product Sections type
    return products.filter((p: any) => {
      const searchLower = filters.searchText.toLowerCase();
      const matchesSearch = !filters.searchText || 
        p.productID?.toLowerCase().includes(searchLower) ||
        p.productName?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower);
      
      const matchesType = !filters.productType || 
        p.productType?.toLowerCase().includes(filters.productType.toLowerCase());
      
      const matchesRisk = !filters.riskID || 
        p.riskID?.toLowerCase().includes(filters.riskID.toLowerCase());
      
      return matchesSearch && matchesType && matchesRisk;
    });
  }, [products, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ─── handlers ──────────────────────────────────────────────────────

  const handleCreate = () => {
    navigate('/admin/configurations/product-sections/new');
  };

  const handleView = (product: any) => {
    navigate(`/admin/configurations/product-sections/view/${product.productID}`, { 
      state: { productData: product } 
    });
  };

  const handleEdit = (product: any) => {
    navigate(`/admin/configurations/product-sections/edit/${product.productID}`, { 
      state: { productData: product } 
    });
  };

  const handleDelete = async (product: any) => {
    if (window.confirm(`Are you sure you want to delete product "${product.productName}"?`)) {
      try {
        await dispatch(deleteProduct(product.riskID || product.productID)).unwrap();
        toast({ 
          title: "Success", 
          description: "Product deleted successfully!", 
          variant: "default" 
        });
        await fetchProductsData();
      } catch (error: any) {
        toast({ 
          title: "Error", 
          description: error.message || "Failed to delete product", 
          variant: "destructive" 
        });
      }
    }
  };

  const handleUpdateType = async () => {
    if (editingProduct && editingProduct.riskID) {
      try {
        await dispatch(updateProductType({
          subRiskId: editingProduct.riskID,
          typeData: editFormData
        })).unwrap();
        toast({ 
          title: "Success", 
          description: "Product type updated successfully!", 
          variant: "default" 
        });
        setShowEditModal(false);
        setEditingProduct(null);
        await fetchProductsData();
      } catch (error: any) {
        toast({ 
          title: "Error", 
          description: error.message || "Failed to update product type", 
          variant: "destructive" 
        });
      }
    }
  };

  const handlePageChange = (page: number) => setCurrentPage(page);
  const applyFilters = () => setCurrentPage(1);
  const clearFilters = () => {
    setFilters({ searchText: "", productType: "", riskID: "" });
    setCurrentPage(1);
  };

  // ─── loading skeleton ─────────────────────────────────────────────
  if (loading && products.length === 0) {
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
        <p className="text-red-500 font-medium">{typeof error === 'string' ? error : 'Failed to load products'}</p>
        <button
          onClick={fetchProductsData}
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
          {/* Header Card */}
          <Card className="bg-gradient-to-r from-gray-200 to-gray-200 border-white-200 mb-6">
            <div className="p-4 pb-0">
              <h2 className="text-xl font-bold text-gray-900">Product Sections</h2>
              <p className="text-sm text-gray-600 mt-1">Manage and configure product sections</p>
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
                  onClick={fetchProductsData}
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
                {filters.searchText || filters.productType || filters.riskID ? (
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
                      value={filters.searchText}
                      onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                      placeholder="Search by ID, Name, or Description"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Product Type</label>
                    <input
                      type="text"
                      value={filters.productType}
                      onChange={(e) => setFilters({ ...filters, productType: e.target.value })}
                      placeholder="e.g. Investment, Traditional"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Risk ID</label>
                    <input
                      type="text"
                      value={filters.riskID}
                      onChange={(e) => setFilters({ ...filters, riskID: e.target.value })}
                      placeholder="e.g. A, B, GL"
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
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Details</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Type</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-gray-400">
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((p: any) => (
                      <tr
                        key={p.productID}
                        className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-800">{p.productID}</div>
                          <div className="text-xs text-gray-400 mt-0.5">Risk: {p.riskID}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-800">{p.productName}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-600">{p.description || "—"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge type={p.productType} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleView(p)}
                              title="View Details"
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(p)}
                              title="Edit Type"
                              className="p-2 rounded-lg text-[#0d47a1] hover:bg-[#0d47a1]/10 transition-colors"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              title="Delete Product"
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

export default ProductSections;