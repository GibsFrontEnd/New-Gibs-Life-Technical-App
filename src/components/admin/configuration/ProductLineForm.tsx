//@ts-nocheck

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
import { Save, X, Eye, Pencil, ChevronLeft, Loader2, Settings, Grid, FileText, Shield, BarChart } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";

// ─── Types ──────────────────────────────────────────────────────
interface ProductFormData {
  productID: string;
  productName: string;
  riskID: string;
  productType: string;
  remarks?: string;
  // Additional fields for different product types
  mainClass?: string;
  sectionCode?: string;
  coverType?: string;
  smiCode?: string;
  settingCategory?: string;
  settingValue?: string;
}

interface ProductFormProps {
  mode?: "new" | "edit" | "view";
  productId?: string;
  // Configuration type to determine which form to show
  configType?: "product-lines" | "product-main-class" | "product-settings" | "product-sections" | "product-covers" | "product-smi";
}

// ─── Helper: Get config type from URL ─────────────────────────
const getConfigTypeFromPath = (path: string): ProductFormProps["configType"] => {
  if (path.includes('/product-lines')) return 'product-lines';
  if (path.includes('/product-main-class')) return 'product-main-class';
  if (path.includes('/product-settings')) return 'product-settings';
  if (path.includes('/product-sections')) return 'product-sections';
  if (path.includes('/product-covers')) return 'product-covers';
  if (path.includes('/product-smi')) return 'product-smi';
  return 'product-lines';
};

// ─── Main Component ─────────────────────────────────────────────
const ProductForm: React.FC<ProductFormProps> = ({ 
  mode: propMode, 
  productId: propProductId,
  configType: propConfigType 
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: paramId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const currentProduct = useSelector(selectCurrentProduct);

  // Determine config type from URL if not provided
  const configType = propConfigType || getConfigTypeFromPath(location.pathname);

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
    mainClass: "",
    sectionCode: "",
    coverType: "",
    smiCode: "",
    settingCategory: "",
    settingValue: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Get config display info ──────────────────────────────────
  const getConfigInfo = () => {
    const configs = {
      'product-lines': {
        title: 'Product Line',
        icon: <Settings className="w-5 h-5" />,
        backPath: '/admin/configurations/product-lines',
        color: 'blue',
        fields: ['productID', 'productName', 'riskID', 'productType', 'remarks']
      },
      'product-main-class': {
        title: 'Product Main Class',
        icon: <Grid className="w-5 h-5" />,
        backPath: '/admin/configurations/product-main-class',
        color: 'purple',
        fields: ['productID', 'productName', 'mainClass', 'remarks']
      },
      'product-settings': {
        title: 'Product Setting',
        icon: <Settings className="w-5 h-5" />,
        backPath: '/admin/configurations/product-settings',
        color: 'green',
        fields: ['productID', 'productName', 'settingCategory', 'settingValue', 'remarks']
      },
      'product-sections': {
        title: 'Product Section',
        icon: <FileText className="w-5 h-5" />,
        backPath: '/admin/configurations/product-sections',
        color: 'orange',
        fields: ['productID', 'productName', 'sectionCode', 'remarks']
      },
      'product-covers': {
        title: 'Product Cover',
        icon: <Shield className="w-5 h-5" />,
        backPath: '/admin/configurations/product-covers',
        color: 'red',
        fields: ['productID', 'productName', 'coverType', 'remarks']
      },
      'product-smi': {
        title: 'Product SMI',
        icon: <BarChart className="w-5 h-5" />,
        backPath: '/admin/configurations/product-smi',
        color: 'indigo',
        fields: ['productID', 'productName', 'smiCode', 'remarks']
      }
    };
    return configs[configType] || configs['product-lines'];
  };

  const configInfo = getConfigInfo();

  // ─── Load product data ────────────────────────────────────────
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
            mainClass: product.mainClass || product.riskID || "",
            sectionCode: product.sectionCode || "",
            coverType: product.coverType || "",
            smiCode: product.smiCode || "",
            settingCategory: product.settingCategory || "",
            settingValue: product.settingValue || "",
          });
          setLoading(false);
        })
        .catch((err: any) => {
          setError(err.message || "Failed to load product");
          setLoading(false);
        });
    }

    if (location.state?.productData) {
      const data = location.state.productData;
      setFormData({
        productID: data.productID || "",
        productName: data.productName || "",
        riskID: data.riskID || "",
        productType: data.productType || "",
        remarks: data.remarks || "",
        mainClass: data.mainClass || data.riskID || "",
        sectionCode: data.sectionCode || "",
        coverType: data.coverType || "",
        smiCode: data.smiCode || "",
        settingCategory: data.settingCategory || "",
        settingValue: data.settingValue || "",
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
      const submitData = {
        productID: formData.productID,
        productName: formData.productName,
        riskID: formData.riskID,
        productType: formData.productType,
        remarks: formData.remarks || "",
        // Additional fields based on config type
        mainClass: formData.mainClass,
        sectionCode: formData.sectionCode,
        coverType: formData.coverType,
        smiCode: formData.smiCode,
        settingCategory: formData.settingCategory,
        settingValue: formData.settingValue,
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
          description: `${configInfo.title} created successfully!`,
          variant: "default",
        });
      } else if (isEditMode && productId) {
        await dispatch(updateProduct({ id: productId, productData: submitData })).unwrap();
        toast({
          title: "Success",
          description: `${configInfo.title} updated successfully!`,
          variant: "default",
        });
      }
      
      setLoading(false);
      navigate(configInfo.backPath);
    } catch (err: any) {
      setError(err.message || `Failed to save ${configInfo.title}`);
      setLoading(false);
      toast({
        title: "Error",
        description: err.message || `Failed to save ${configInfo.title}`,
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate(configInfo.backPath);
  };

  const handleGoBack = () => {
    navigate(configInfo.backPath);
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

  // ─── Get color classes ────────────────────────────────────────
  const getColorClasses = (color: string) => {
    const colors = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-300' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', button: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-300' },
      green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100', button: 'bg-green-600 hover:bg-green-700 focus:ring-green-300' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', button: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-300' },
      red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', button: 'bg-red-600 hover:bg-red-700 focus:ring-red-300' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', button: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-300' },
    };
    return colors[color] || colors.blue;
  };

  const colorClasses = getColorClasses(configInfo.color);

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
          Back to {configInfo.title}s
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colorClasses.bg} ${colorClasses.text}`}>
                  {configInfo.icon}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {isNewMode && `Create New ${configInfo.title}`}
                    {isEditMode && `Edit ${configInfo.title}`}
                    {isViewMode && `${configInfo.title} Details`}
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {isNewMode ? `Add a new ${configInfo.title.toLowerCase()} to the system` : `Manage and update ${configInfo.title.toLowerCase()} information`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isViewMode && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${colorClasses.bg} ${colorClasses.text} border ${colorClasses.border}`}>
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

        {/* Form Card */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
                {/* Left Column */}
                <div className="space-y-5">
                  {/* Product Code */}
                  <div>
                    <label htmlFor="productID" className="block text-sm font-medium text-gray-700 mb-1.5">
                      {configType === 'product-settings' ? 'Setting Code' : 'Product Code'}
                    </label>
                    <input
                      id="productID"
                      type="text"
                      name="productID"
                      value={formData.productID}
                      onChange={handleChange}
                      disabled={isViewMode || isEditMode}
                      placeholder={configType === 'product-settings' ? 'Enter setting code' : 'Enter product code'}
                      className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        (isViewMode || isEditMode) 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      }`}
                    />
                    {isEditMode && (
                      <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Code cannot be changed
                      </p>
                    )}
                  </div>

                  {/* Product Name */}
                  <div>
                    <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1.5">
                      {configType === 'product-settings' ? 'Setting Name' : 'Product Name'}
                    </label>
                    <input
                      id="productName"
                      type="text"
                      name="productName"
                      value={formData.productName}
                      onChange={handleChange}
                      disabled={isViewMode}
                      placeholder={configType === 'product-settings' ? 'Enter setting name' : 'Enter product name'}
                      className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isViewMode 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      }`}
                    />
                  </div>

                  {/* Dynamic field based on config type */}
                  {configType === 'product-settings' && (
                    <>
                      <div>
                        <label htmlFor="settingCategory" className="block text-sm font-medium text-gray-700 mb-1.5">
                          Category
                        </label>
                        <input
                          id="settingCategory"
                          type="text"
                          name="settingCategory"
                          value={formData.settingCategory}
                          onChange={handleChange}
                          disabled={isViewMode}
                          placeholder="e.g. General, Premium, Risk"
                          className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                            isViewMode 
                              ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                              : "bg-white hover:border-gray-300"
                          }`}
                        />
                      </div>
                      <div>
                        <label htmlFor="settingValue" className="block text-sm font-medium text-gray-700 mb-1.5">
                          Value
                        </label>
                        <input
                          id="settingValue"
                          type="text"
                          name="settingValue"
                          value={formData.settingValue}
                          onChange={handleChange}
                          disabled={isViewMode}
                          placeholder="Enter setting value"
                          className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                            isViewMode 
                              ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                              : "bg-white hover:border-gray-300"
                          }`}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  {/* Main Class / Risk ID */}
                  {configType !== 'product-settings' && (
                    <div>
                      <label htmlFor="riskID" className="block text-sm font-medium text-gray-700 mb-1.5">
                        {configType === 'product-main-class' ? 'Main Class Code' : 'Main Class'}
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
                  )}

                  {/* Additional fields for specific config types */}
                  {configType === 'product-sections' && (
                    <div>
                      <label htmlFor="sectionCode" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Section Code
                      </label>
                      <input
                        id="sectionCode"
                        type="text"
                        name="sectionCode"
                        value={formData.sectionCode}
                        onChange={handleChange}
                        disabled={isViewMode}
                        placeholder="Enter section code"
                        className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                          isViewMode 
                            ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                            : "bg-white hover:border-gray-300"
                        }`}
                      />
                    </div>
                  )}

                  {configType === 'product-covers' && (
                    <div>
                      <label htmlFor="coverType" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Cover Type
                      </label>
                      <select
                        id="coverType"
                        name="coverType"
                        value={formData.coverType}
                        onChange={handleChange}
                        disabled={isViewMode}
                        className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                          isViewMode 
                            ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                            : "bg-white hover:border-gray-300"
                        }`}
                      >
                        <option value="">Select Cover Type</option>
                        <option value="Basic">Basic</option>
                        <option value="Standard">Standard</option>
                        <option value="Premium">Premium</option>
                        <option value="Comprehensive">Comprehensive</option>
                      </select>
                    </div>
                  )}

                  {configType === 'product-smi' && (
                    <div>
                      <label htmlFor="smiCode" className="block text-sm font-medium text-gray-700 mb-1.5">
                        SMI Code
                      </label>
                      <input
                        id="smiCode"
                        type="text"
                        name="smiCode"
                        value={formData.smiCode}
                        onChange={handleChange}
                        disabled={isViewMode}
                        placeholder="Enter SMI code"
                        className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                          isViewMode 
                            ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                            : "bg-white hover:border-gray-300"
                        }`}
                      />
                    </div>
                  )}

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
                  className={`inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white ${colorClasses.button} rounded-lg focus:ring-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {isNewMode ? `Create ${configInfo.title}` : `Update ${configInfo.title}`}
                    </>
                  )}
                </button>
              )}
              
              {isViewMode && (
                <button
                  type="button"
                  onClick={() => navigate(`${configInfo.backPath}/edit/${productId}`)}
                  className={`inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white ${colorClasses.button} rounded-lg focus:ring-4 transition-colors`}
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