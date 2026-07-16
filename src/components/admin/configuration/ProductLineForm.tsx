import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  createProduct,
  updateProduct,
  fetchProductById,
  selectCurrentProduct,
  clearCurrentProduct,
} from "../../../features/reducers/productReducers/productSlice";
import { Save, X, Eye, Pencil, ChevronLeft, Loader2 } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";

// ─── Types ──────────────────────────────────────────────────────
interface ProductFormData {
  productID: string;
  productName: string;
  riskID: string;
  productType: string;
  remarks?: string;
}

interface ProductFormProps {
  mode?: "new" | "edit" | "view";
  productId?: string;
}

// ─── Main Component ─────────────────────────────────────────────
const ProductForm: React.FC<ProductFormProps> = ({ mode: propMode, productId: propProductId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: paramId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const currentProduct = useSelector(selectCurrentProduct);

  // Determine mode from props or URL
  const path = location.pathname;
  const isViewMode = propMode === 'view' || path.includes('/view/');
  const isEditMode = propMode === 'edit' || path.includes('/edit/');
  const isNewMode = propMode === 'new' || path.includes('/new');
  
  const productId = propProductId || paramId;

  const [formData, setFormData] = useState<ProductFormData>({
    productID: "",
    productName: "",
    riskID: "",
    productType: "",
    remarks: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load product data for edit/view modes
  useEffect(() => {
    if ((isEditMode || isViewMode) && productId) {
      setLoading(true);
      dispatch(fetchProductById(productId))
        .unwrap()
        .then((product: any) => {
          setFormData({
            productID: product.productID || "",
            productName: product.productName || "",
            riskID: product.riskID || "",
            productType: product.productType || "",
            remarks: product.remarks || "",
          });
          setLoading(false);
        })
        .catch((err: any) => {
          setError(err.message || "Failed to load product");
          setLoading(false);
          
        });
    }

    // If we have product data from navigation state
    if (location.state?.productData) {
      const data = location.state.productData;
      setFormData({
        productID: data.productID || "",
        productName: data.productName || "",
        riskID: data.riskID || "",
        productType: data.productType || "",
        remarks: data.remarks || "",
      });
    }

    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [dispatch, productId, isEditMode, isViewMode, location.state]);

  // ─── Handlers ──────────────────────────────────────────────────

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Prepare the data with default values for required fields
      const submitData = {
  // Form fields
  productID: formData.productID,
  productName: formData.productName,
  riskID: formData.riskID,
  productType: formData.productType,
  remarks: formData.remarks || "",
  
  // Default values for required API fields
  description: formData.productName || "",
  tag: "default",
  min_Age: 18,
  max_Age: 100,
  min_Duration: 1,
  max_Duration: 30,
  min_Contribution: 0,
  max_Contribution: 0,
  rateDiv_factor: 0,
  min_SA: 0,
  max_SA: 0,
  multiplier: "",
  a1: 0,
  a2: 0,
};

      if (isNewMode) {
        await dispatch(createProduct(submitData)).unwrap();
        toast({
          title: "Success",
          description: "Product created successfully!",
          variant: "default",
        });
      } else if (isEditMode && productId) {
        await dispatch(updateProduct({ id: productId, productData: submitData })).unwrap();
        toast({
          title: "Success",
          description: "Product updated successfully!",
          variant: "default",
        });
      }
      
      setLoading(false);
      navigate('/admin/configurations/product-lines');
    } catch (err: any) {
      setError(err.message || "Failed to save product");
      setLoading(false);
      toast({
        title: "Error",
        description: err.message || "Failed to save product",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate('/admin/configurations/product-lines');
  };

  const handleGoBack = () => {
    navigate('/admin/configurations/product-lines');
  };

  // ─── Loading State ────────────────────────────────────────────

  if (loading && (isEditMode || isViewMode)) {
    return (
      <div className="min-h-screen bg-gray-50/80 p-6">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 rounded-lg w-1/4" />
            <div className="h-20 bg-gray-200 rounded-xl" />
            <div className="h-96 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50/80 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
       <button
  onClick={handleGoBack}
  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gradient-to-r from-white to-gray-50/80 border border-gray-200 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:border-gray-300 transition-all duration-200 mb-4 group shadow-sm hover:shadow-md"
>
  <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
  Back to Products
</button>

        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {isNewMode && "Create New Product"}
                  {isEditMode && "Edit Product"}
                  {isViewMode && "View Product Details"}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {isNewMode ? "Add a new product to the system" : "Manage and update product information"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isViewMode && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    <Eye size={14} /> View Mode
                  </span>
                )}
                {isEditMode && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                    <Pencil size={14} /> Edit Mode
                  </span>
                )}
                {isNewMode && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <Save size={14} /> New
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {/* {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <X size={18} className="text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )} */}

        {/* Form Card */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
                {/* Left Column */}
                <div className="space-y-5">
                  {/* Schemes Type */}
                  {/* <div>
                    <label htmlFor="productType" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Schemes Type
                    </label>
                    <input
                      id="productType"
                      type="text"
                      name="productType"
                      value={formData.productType}
                      onChange={handleChange}
                      disabled={isViewMode}
                      placeholder="New Product"
                      className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isViewMode 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      }`}
                    />
                  </div> */}

                  {/* Product Code */}
                  <div>
                    <label htmlFor="productID" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Product Code
                    </label>
                    <input
                      id="productID"
                      type="text"
                      name="productID"
                      value={formData.productID}
                      onChange={handleChange}
                      disabled={isViewMode || isEditMode}
                      placeholder="Enter Product code"
                      className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        (isViewMode || isEditMode) 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      }`}
                    />
                    {isEditMode && (
                      <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Product code cannot be changed
                      </p>
                    )}
                  </div>

                  {/* Product Name */}
                  <div>
                    <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Product Name
                    </label>
                    <input
                      id="productName"
                      type="text"
                      name="productName"
                      value={formData.productName}
                      onChange={handleChange}
                      disabled={isViewMode}
                      placeholder="Enter Product name"
                      className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isViewMode 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      }`}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  {/* Main Class */}
                  <div>
                    <label htmlFor="riskID" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Main Class
                    </label>
                    <select
                      id="riskID"
                      name="riskID"
                      value={formData.riskID}
                      onChange={handleChange}
                      disabled={isViewMode}
                      className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isViewMode 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      }`}
                    >
                      <option value="">Select Main Class</option>
                      <option value="A">A - Traditional</option>
                      <option value="B">B - Investment</option>
                      <option value="GL">GL - Group Life</option>
                      <option value="GPA">GPA - Group Personal Accident</option>
                    </select>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Remarks
                    </label>
                    <textarea
                      id="remarks"
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      disabled={isViewMode}
                      rows={4}
                      placeholder="Enter any additional remarks or notes"
                      className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none ${
                        isViewMode 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              {!isViewMode && (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {isNewMode ? "Submit" : "Update"}
                    </>
                  )}
                </button>
              )}
              
              {isViewMode && (
                <button
                  type="button"
                  onClick={() => navigate(`/admin/configurations/product-lines/edit/${productId}`)}
                  className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
                >
                  <Pencil size={16} />
                  Edit
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;