import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks/use-apps";
import {
  getAllRisks,
  selectRisks,
} from "../../../features/reducers/adminReducers/riskSlice";
import SearchBar from "../../SearchBar";
import { Button } from "../../UI/new-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../UI/dropdown";
import { Input } from "../../UI/new-input";
import type { Risk } from "../../../types/risk";
import {
  clearMessages,
  clearProducts,
  deleteProduct,
  getAllProducts,
  selectProducts,
} from "../../../features/reducers/productReducers/productSlice";
import { Card, CardContent } from "../../UI/card";
import { Skeleton } from "../../UI/skeleton";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../UI/table";
import { Alert, AlertDescription } from "../../UI/alert";
import {
  selectUiState,
  setShowCreateProductDialog,
  setShowDeleteProductDialog,
  setShowEditProductDialog,
} from "../../../features/reducers/uiReducers/uiSlice";
import ConfirmationModal from "../../Modals/ConfirmationModal";
import { useToast } from "../../UI/use-toast";
import ProductCreateModal from "../../Modals/CreateProductModal";
import ProductEditModal from "../../Modals/EditProductModal";
import type { Product } from "../../../types/product";

const ProductSubRisk = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [productIdToDelete, setProductIdToDelete] = useState<string | null>(
    null
  );
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const {
    risks,
    loading: riskLoading,
      //@ts-ignore
    error: riskError,
  } = useAppSelector(selectRisks);
  const { products, loading, error, success } = useAppSelector(selectProducts);
  const {
    showDeleteProductDialog,
    showCreateProductDialog,
    showEditProductDialog,
  } = useAppSelector(selectUiState);

  const pageSize = 10;
  const totalPages = risks ? Math.ceil(risks.length / pageSize) : 0;

  useEffect(() => {  //@ts-ignore
    dispatch(getAllRisks());
  }, [dispatch]);

  useEffect(() => {
    dispatch(clearProducts());
  }, [dispatch]);

  useEffect(() => {
    if (selectedRisk?.riskID) {
      dispatch(clearProducts());
      dispatch(
        getAllProducts({
          riskId: selectedRisk.riskID,
          pageNumber: currentPage,
          pageSize,
        })
      );
    }
  }, [selectedRisk, currentPage, dispatch]);

  useEffect(() => {
    if (success.deleteProduct) {
      dispatch(clearMessages());
      setProductIdToDelete(null);
      dispatch(setShowDeleteProductDialog(false));
      toast({
        title: "Product Deleted!",
        description: "You have been successfully deleted the product.",
        variant: "success",
        duration: 3000,
      });
    } else if (error.deleteProduct) {
      dispatch(clearMessages());
      console.log(error.deleteProduct);
      toast({
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [success.deleteProduct, dispatch, error.deleteProduct]);

  useEffect(() => {
    if (success.createProduct || success.updateProduct) {
      if (selectedRisk?.riskID) {
        dispatch(
          getAllProducts({
            riskId: selectedRisk.riskID,
            pageNumber: currentPage,
            pageSize,
          })
        );
      }
      dispatch(clearMessages());
    }
  }, [
    success.createProduct,
    success.updateProduct,
    selectedRisk,
    currentPage,
    dispatch,
  ]);

  const confirmDeleteProduct = async (productId: string | null) => {
    if (productId === null) {
      console.log("No Product Id");
      toast({
        description: "Please select a product to delete and try again!",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

      //@ts-ignore
    dispatch(deleteProduct(productId));
  };

  const toggleDropdown = () => {
    setOpen((prev) => !prev);
  };

  const filteredOptions = risks
    .filter((risk) =>
      risk?.riskName?.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 5);

  const filteredProducts = products.filter((risk) =>
    risk.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="py-4 flex flex-col gap-6 bg-[#f8f9fa] min-h-[calc(100vh_-_64px)]">
      <div className="w-full flex flex-wrap gap-4 items-center mb-4">
        <div className="flex-1">
          <DropdownMenu>
            <button
              className="w-full px-4 py-2 border border-border rounded-md bg-white text-left"
              onClick={toggleDropdown}
              disabled={riskLoading.getAllRisks}
              type="button"
            >
              {selectedRisk ? selectedRisk.riskName : "Select a risk"}
            </button>

            <DropdownMenuContent
              className="w-full p-2 bg-white border border-border rounded-md shadow-md"
              open={open}
              setOpen={setOpen}
            >
              <Input
                placeholder="Search for a risk"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-2 w-full px-2 py-1 border border-border rounded-md"
                autoFocus
              />
              {filteredOptions.map((risk) => (
                <DropdownMenuItem
                  key={risk.riskID}
                  onClick={() => {
                    setSelectedRisk(risk);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <button className="cursor-pointer px-4 py-2 rounded-md">
                    {risk.riskName}
                  </button>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <SearchBar
          placeholder="Search by name or description..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <Button
          className="bg-primary-blue text-white"
          onClick={() => dispatch(setShowCreateProductDialog(true))}
        >
          Add New Product
        </Button>
      </div>
      {error.getAllProducts ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Error loading proposals</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Mobile Card View */}
            <div className="block lg:hidden">
              {loading.getAllProducts ? (
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
              ) : filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm font-medium mb-2">
                    {searchTerm.length > 0
                      ? "No Product match your filters"
                      : "No Products found"}
                  </p>
                  <p className="text-xs">
                    {searchTerm.length > 0
                      ? "Try adjusting your search criteria to see all products."
                      : "Create a new product under this risk or select a risk in the dropdown to get started."}
                  </p>
                  {searchTerm.length > 0 && (
                    <Button   //@ts-ignore
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchTerm("")}
                      className="mt-3 text-xs border-blue-300 text-blue-900 hover:bg-blue-50 bg-transparent"
                    >
                      Clear Filter
                    </Button>
                  )}
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product.productID}
                    className="p-4 border-b border-blue-100 cursor-pointer hover:bg-blue-50/50 transition-colors"
                    // onClick={() => navigate(`${product.productNo}/detail`)}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          {/* {product.policyNo && (
                          <div className="text-sm font-medium text-blue-900">
                            {product.policyNo}
                          </div>
                        )} */}
                          {/* <div className="text-xs text-blue-600">
                          {product.productNo}
                        </div> */}
                        </div>
                        {/* {getStatusBadge(product.remarks, product.tag)} */}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-blue-100 hover:bg-blue-50/30">
                    <TableHead className="min-w-[150px] text-blue-900 font-semibold">
                      Product ID
                    </TableHead>
                    <TableHead className="min-w-[180px] text-blue-900 font-semibold">
                      Product Name
                    </TableHead>
                    <TableHead className="min-w-[120px] text-blue-900 font-semibold">
                      Sections Count
                    </TableHead>
                    <TableHead className="min-w-[120px] text-blue-900 font-semibold">
                      Fields Count
                    </TableHead>
                    <TableHead className="min-w-[120px] text-blue-900 font-semibold">
                      Rates Count
                    </TableHead>
                    <TableHead className="min-w-[100px] text-blue-900 font-semibold">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading.getAllProducts ? (
                    Array.from({ length: pageSize }).map((_, index) => (
                      <TableRow key={index} className="border-blue-100">
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
                      </TableRow>
                    ))
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center p-8">
                        <div className="p-8 text-center text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-sm font-medium mb-2">
                            {searchTerm.length > 0
                              ? "No Product match your filters"
                              : "No Products found"}
                          </p>
                          <p className="text-xs">
                            {searchTerm.length > 0
                              ? "Try adjusting your search criteria to see all products."
                              : "Create a new product under this risk or select a risk in the dropdown to get started."}
                          </p>
                          {searchTerm.length > 0 && (
                            <Button   //@ts-ignore
                              variant="outline"
                              size="sm"
                              onClick={() => setSearchTerm("")}
                              className="mt-3 text-xs border-blue-300 text-blue-900 hover:bg-blue-50 bg-transparent"
                            >
                              Clear Filter
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow
                        key={product.productID}
                        className="cursor-pointer hover:bg-blue-50/50 border-blue-100 transition-colors"
                        // onClick={() => navigate(`${product.productNo}/detail`)}
                      >
                        <TableCell className="font-medium">
                          {product.productID}
                        </TableCell>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell>
                          {  //@ts-ignore
                          product.sections ? product.sections.length : 0}
                        </TableCell>
                        <TableCell className="">
                          {product.fields ? product.fields.length : 0}
                        </TableCell>
                        <TableCell className="">
                          {  //@ts-ignore
                          product.rates ? product.rates.length : 0}
                        </TableCell>
                        <TableCell className="flex gap-2 items-center justify-end">
                          <Button
                            className="action-button edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProductToEdit(product);
                              dispatch(setShowEditProductDialog(true));
                            }}
                          >
                            Edit
                          </Button>
                          <Button   //@ts-ignore
                            variant="destructive"
                            className="action-button delete"
                            onClick={() => {
                              setProductIdToDelete(product.productID);
                              dispatch(setShowDeleteProductDialog(true));
                            }}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {products && totalPages > 1 && (
              <div className="border-t border-blue-100 p-4 bg-blue-50/30">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600 order-2 sm:order-1">
                    Page{" "}
                    <span className="font-medium text-blue-600">
                      {currentPage}
                    </span>{" "}
                    of <span className="font-medium">{totalPages}</span>
                    {searchTerm.length > 0 && (
                      <span className="ml-2 text-xs">(filtered results)</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 order-1 sm:order-2">
                    {/* First Page */}
                    <Button   //@ts-ignore
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(1)} // @ts-ignore
                      disabled={currentPage === 1 || loading.getProposals}
                      className="hidden sm:flex h-8 w-8 p-0 border-blue-300 text-blue-900 hover:bg-blue-50"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    {/* Previous Page */}
                    <Button   //@ts-ignore
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)} // @ts-ignore
                      disabled={currentPage === 1 || loading.getProposals}
                      className="h-8 w-8 p-0 border-blue-300 text-blue-900 hover:bg-blue-50"
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
                                //@ts-ignore
                              variant={
                                currentPage === pageNum ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => goToPage(pageNum)} // @ts-ignore
                              disabled={loading.getProposals}
                              className={`h-8 w-8 p-0 text-xs sm:text-sm ${
                                currentPage === pageNum
                                  ? "bg-blue-900 hover:bg-blue-900"
                                  : "border-blue-900 text-blue-900 hover:bg-blue-50"
                              }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>
                    {/* Next Page */}
                    <Button   //@ts-ignore
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)} // @ts-ignore
                      disabled={
                        currentPage === totalPages || loading.getAllProducts
                      }
                      className="h-8 w-8 p-0 border-blue-300 text-blue-900 hover:bg-blue-50"
                    >
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    {/* Last Page */}
                    <Button   //@ts-ignore
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(totalPages)} // @ts-ignore
                      disabled={
                        currentPage === totalPages || loading.getAllProducts
                      }
                      className="hidden sm:flex h-8 w-8 p-0 border-blue-300 text-blue-900 hover:bg-blue-50"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showCreateProductDialog && (
        <ProductCreateModal
          isOpen={showCreateProductDialog}
          onClose={() => dispatch(setShowCreateProductDialog(false))}
            //@ts-ignore
          riskId={selectedRisk?.riskID || ""}
        />
      )}

      {showEditProductDialog && (
        <ProductEditModal
          isOpen={showEditProductDialog}
          onClose={() => {
            dispatch(setShowEditProductDialog(false));
            setProductToEdit(null);
          }}
          product={productToEdit}
        />
      )}

      {showDeleteProductDialog && (
        <ConfirmationModal
          title="Delete Product"
          message="Are you sure you want to delete this Product Sub Risk and its related sections, fields and rates? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => confirmDeleteProduct(productIdToDelete)}
          onCancel={() => dispatch(setShowDeleteProductDialog(false))}
          isLoading={loading.deleteProduct}
        />
      )}
    </div>
  );
};

export default ProductSubRisk;
