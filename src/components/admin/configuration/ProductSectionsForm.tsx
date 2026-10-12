//@ts-nocheck
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  createProductSection,
  updateProductSection,
  fetchSectionById,
  selectCurrentSection,
  setCurrentSection,
} from "../../../features/reducers/productReducers/productSlice";
import { 
  Save, 
  X, 
  Eye, 
  Pencil, 
  ChevronLeft, 
  Loader2, 
  FileText,
  Settings,
  Grid
} from "lucide-react";
import { useToast } from "../../../hooks/use-toast";

// ─── Types ──────────────────────────────────────────────────────
interface SectionFormData {
  sectionID: number;
  sectionCode: string;
  subRiskID: string;
  sectionName: string;
  subRiskName: string;
  field1: string;
  field2: string;
  rates: number;
  a1: number;
  a2: number;
  a3: number;
  a4: number;
  a5: number;
  active: number;
  submittedBy: string;
  submittedOn: string;
  modifiedBy: string;
  modifiedOn: string;
}

interface ProductSectionFormProps {
  mode?: "new" | "edit" | "view";
  sectionId?: string;
}

// ─── Main Component ─────────────────────────────────────────────
const ProductSectionsForm: React.FC<ProductSectionFormProps> = ({ 
  mode: propMode, 
  sectionId: propSectionId 
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: paramId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { currentSection } = useSelector(selectCurrentSection);

  // Determine mode from props or URL
  const path = location.pathname;
  const isViewMode = propMode === 'view' || path.includes('/view/');
  const isEditMode = propMode === 'edit' || path.includes('/edit/');
  const isNewMode = propMode === 'new' || path.includes('/new');
  
  const sectionId = propSectionId || paramId;

  const [formData, setFormData] = useState<SectionFormData>({
    sectionID: 0,
    sectionCode: "",
    subRiskID: "",
    sectionName: "",
    subRiskName: "",
    field1: "",
    field2: "",
    rates: 0,
    a1: 0,
    a2: 0,
    a3: 0,
    a4: 0,
    a5: 0,
    active: 1,
    submittedBy: "",
    submittedOn: "",
    modifiedBy: "",
    modifiedOn: ""
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Config info ──────────────────────────────────────────────
  const configInfo = {
    title: 'Product Section',
    icon: <FileText className="w-5 h-5" />,
    backPath: '/admin/configurations/product-sections',
    color: 'blue',
    fields: ['sectionCode', 'sectionName', 'subRiskID', 'subRiskName', 'field1', 'field2', 'rates', 'a1', 'a2', 'a3', 'a4', 'a5', 'active']
  };

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

  // ─── Load section data ────────────────────────────────────────
  useEffect(() => {
    const stateData = location.state?.sectionData;
    
    if (stateData && !isNewMode) {
      setFormData({
        sectionID: stateData.sectionID || 0,
        sectionCode: stateData.sectionCode || "",
        subRiskID: stateData.subRiskID || "",
        sectionName: stateData.sectionName || "",
        subRiskName: stateData.subRiskName || "",
        field1: stateData.field1 || "",
        field2: stateData.field2 || "",
        rates: stateData.rates || 0,
        a1: stateData.a1 || 0,
        a2: stateData.a2 || 0,
        a3: stateData.a3 || 0,
        a4: stateData.a4 || 0,
        a5: stateData.a5 || 0,
        active: stateData.active ?? 1,
        submittedBy: stateData.submittedBy || "",
        submittedOn: stateData.submittedOn || "",
        modifiedBy: stateData.modifiedBy || "",
        modifiedOn: stateData.modifiedOn || ""
      });
      return;
    }

    if ((isEditMode || isViewMode) && sectionId) {
      const id = parseInt(sectionId);
      setLoading(true);
      dispatch(fetchSectionById(id))
        .unwrap()
        .then((section: any) => {
          setFormData({
            sectionID: section.sectionID || 0,
            sectionCode: section.sectionCode || "",
            subRiskID: section.subRiskID || "",
            sectionName: section.sectionName || "",
            subRiskName: section.subRiskName || "",
            field1: section.field1 || "",
            field2: section.field2 || "",
            rates: section.rates || 0,
            a1: section.a1 || 0,
            a2: section.a2 || 0,
            a3: section.a3 || 0,
            a4: section.a4 || 0,
            a5: section.a5 || 0,
            active: section.active ?? 1,
            submittedBy: section.submittedBy || "",
            submittedOn: section.submittedOn || "",
            modifiedBy: section.modifiedBy || "",
            modifiedOn: section.modifiedOn || ""
          });
          setLoading(false);
        })
        .catch((err: any) => {
          setError(err.message || "Failed to load section");
          setLoading(false);
        });
    }

    return () => {
      dispatch(setCurrentSection(null));
    };
  }, [dispatch, sectionId, isEditMode, isViewMode, isNewMode, location.state]);

  // ─── Validation ──────────────────────────────────────────────
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.sectionCode.trim()) newErrors.sectionCode = 'Section Code is required';
    if (!formData.subRiskID.trim()) newErrors.subRiskID = 'Sub Risk ID is required';
    if (!formData.sectionName.trim()) newErrors.sectionName = 'Section Name is required';
    if (formData.rates < 0) newErrors.rates = 'Rates must be greater than or equal to 0';
    return newErrors;
  };

  // ─── Handlers ──────────────────────────────────────────────────

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? parseFloat(value) || 0 : value;
    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        sectionID: isNewMode ? 0 : formData.sectionID,
        modifiedBy: formData.modifiedBy || 'System',
        submittedBy: formData.submittedBy || 'System',
        submittedOn: formData.submittedOn || new Date().toISOString(),
        modifiedOn: new Date().toISOString()
      };

      let result;
      if (isNewMode) {
        result = await dispatch(createProductSection(submitData)).unwrap();
        toast({
          title: "Success",
          description: `${configInfo.title} created successfully!`,
          variant: "default",
        });
      } else if (isEditMode && sectionId) {
        result = await dispatch(updateProductSection(submitData)).unwrap();
        toast({
          title: "Success",
          description: `${configInfo.title} updated successfully!`,
          variant: "default",
        });
      }
      
      setLoading(false);
      navigate(-1);
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
    navigate(-1);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    navigate(`/admin/configurations/product-sections/edit/${formData.sectionID}`, {
      state: { sectionData: formData }
    });
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
                  {/* Section Code */}
                  <div>
                    <label htmlFor="sectionCode" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Section Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="sectionCode"
                      type="text"
                      name="sectionCode"
                      value={formData.sectionCode}
                      onChange={handleChange}
                      disabled={isViewMode}
                      placeholder="Enter section code"
                      className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isViewMode 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      } ${
                        errors.sectionCode ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {errors.sectionCode && (
                      <p className="text-xs text-red-500 mt-1.5">{errors.sectionCode}</p>
                    )}
                  </div>

                  {/* Section Name */}
                  <div>
                    <label htmlFor="sectionName" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Section Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="sectionName"
                      type="text"
                      name="sectionName"
                      value={formData.sectionName}
                      onChange={handleChange}
                      disabled={isViewMode}
                      placeholder="Enter section name"
                      className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isViewMode 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      } ${
                        errors.sectionName ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {errors.sectionName && (
                      <p className="text-xs text-red-500 mt-1.5">{errors.sectionName}</p>
                    )}
                  </div>

                  {/* Sub Risk ID */}
                  <div>
                    <label htmlFor="subRiskID" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Sub Risk ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="subRiskID"
                      type="text"
                      name="subRiskID"
                      value={formData.subRiskID}
                      onChange={handleChange}
                      disabled={isViewMode}
                      placeholder="e.g. GPA, GL"
                      className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isViewMode 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      } ${
                        errors.subRiskID ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {errors.subRiskID && (
                      <p className="text-xs text-red-500 mt-1.5">{errors.subRiskID}</p>
                    )}
                  </div>

                 
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  {/* Field 1 */}
                  {/* <div>
                    <label htmlFor="field1" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Field 1
                    </label>
                    <input
                      id="field1"
                      type="text"
                      name="field1"
                      value={formData.field1}
                      onChange={handleChange}
                      disabled={isViewMode}
                      placeholder="Enter field 1"
                      className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isViewMode 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      }`}
                    />
                  </div> */}

                  {/* Field 2 */}
                  {/* <div>
                    <label htmlFor="field2" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Field 2
                    </label>
                    <input
                      id="field2"
                      type="text"
                      name="field2"
                      value={formData.field2}
                      onChange={handleChange}
                      disabled={isViewMode}
                      placeholder="Enter field 2"
                      className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isViewMode 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      }`}
                    />
                  </div> */}
                   {/* Sub Risk Name */}
                  <div>
                    <label htmlFor="subRiskName" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Sub Risk Name
                    </label>
                    <input
                      id="subRiskName"
                      type="text"
                      name="subRiskName"
                      value={formData.subRiskName}
                      onChange={handleChange}
                      disabled={isViewMode}
                      placeholder="Enter sub risk name"
                      className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isViewMode 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      }`}
                    />
                  </div>
                  {/* Rates */}
                  <div>
                    <label htmlFor="rates" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Rates
                    </label>
                    <input
                      id="rates"
                      type="number"
                      name="rates"
                      value={formData.rates}
                      onChange={handleChange}
                      disabled={isViewMode}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isViewMode 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      } ${
                        errors.rates ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {errors.rates && (
                      <p className="text-xs text-red-500 mt-1.5">{errors.rates}</p>
                    )}
                  </div>

                  {/* Active Status */}
                  <div>
                    <label htmlFor="active" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Status
                    </label>
                    <select
                      id="active"
                      name="active"
                      value={formData.active}
                      onChange={handleChange}
                      disabled={isViewMode}
                      className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isViewMode 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      }`}
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                </div>

                {/* A1 - A5 - Full Width Row */}
                {/* <div className="col-span-1 lg:col-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-2">
                    <div>
                      <label htmlFor="a1" className="block text-sm font-medium text-gray-700 mb-1.5">
                        A1
                      </label>
                      <input
                        id="a1"
                        type="number"
                        name="a1"
                        value={formData.a1}
                        onChange={handleChange}
                        disabled={isViewMode}
                        placeholder="0"
                        step="0.01"
                        className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                          isViewMode 
                            ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                            : "bg-white hover:border-gray-300"
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="a2" className="block text-sm font-medium text-gray-700 mb-1.5">
                        A2
                      </label>
                      <input
                        id="a2"
                        type="number"
                        name="a2"
                        value={formData.a2}
                        onChange={handleChange}
                        disabled={isViewMode}
                        placeholder="0"
                        step="0.01"
                        className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                          isViewMode 
                            ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                            : "bg-white hover:border-gray-300"
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="a3" className="block text-sm font-medium text-gray-700 mb-1.5">
                        A3
                      </label>
                      <input
                        id="a3"
                        type="number"
                        name="a3"
                        value={formData.a3}
                        onChange={handleChange}
                        disabled={isViewMode}
                        placeholder="0"
                        step="0.01"
                        className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                          isViewMode 
                            ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                            : "bg-white hover:border-gray-300"
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="a4" className="block text-sm font-medium text-gray-700 mb-1.5">
                        A4
                      </label>
                      <input
                        id="a4"
                        type="number"
                        name="a4"
                        value={formData.a4}
                        onChange={handleChange}
                        disabled={isViewMode}
                        placeholder="0"
                        step="0.01"
                        className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                          isViewMode 
                            ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                            : "bg-white hover:border-gray-300"
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="a5" className="block text-sm font-medium text-gray-700 mb-1.5">
                        A5
                      </label>
                      <input
                        id="a5"
                        type="number"
                        name="a5"
                        value={formData.a5}
                        onChange={handleChange}
                        disabled={isViewMode}
                        placeholder="0"
                        step="0.01"
                        className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                          isViewMode 
                            ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                            : "bg-white hover:border-gray-300"
                        }`}
                      />
                    </div>
                  </div>
                </div> */}

                {/* Metadata - Only show in view mode */}
                {isViewMode && (
                  <div className="col-span-1 lg:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Submitted By
                        </label>
                        <input
                          type="text"
                          value={formData.submittedBy}
                          disabled
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Submitted On
                        </label>
                        <input
                          type="text"
                          value={formData.submittedOn ? new Date(formData.submittedOn).toLocaleString() : ''}
                          disabled
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Modified By
                        </label>
                        <input
                          type="text"
                          value={formData.modifiedBy}
                          disabled
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Modified On
                        </label>
                        <input
                          type="text"
                          value={formData.modifiedOn ? new Date(formData.modifiedOn).toLocaleString() : ''}
                          disabled
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                  onClick={handleEdit}
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

export default ProductSectionsForm;