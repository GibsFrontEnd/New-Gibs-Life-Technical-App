//@ts-nocheck
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  createProductSmi,
  updateProductSmi,
  fetchSmiById,
  selectCurrentSmi,
  setCurrentSmi,
} from "../../../features/reducers/productReducers/productSlice";
import { Button } from "../../../components/UI/new-button";
import { Card, CardContent } from "../../../components/UI/card";
import { useToast } from "../../../hooks/use-toast";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Edit, 
  Loader2,
  BarChart,
  FileText,
  Hash,
  Tag,
  Banknote,
  Settings
} from "lucide-react";

// ─── Helper: Get mode from URL ──────────────────────────────────
const getModeFromPath = (pathname: string) => {
  if (pathname.includes('/view/')) return 'view';
  if (pathname.includes('/edit/')) return 'edit';
  if (pathname.includes('/new')) return 'new';
  return 'view';
};

// ─── Main Component ─────────────────────────────────────────────
const ProductSMIForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { toast } = useToast();
  
  const { currentSmi } = useSelector(selectCurrentSmi);
  
  const mode = getModeFromPath(location.pathname);
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isNew = mode === 'new';
  const isReadOnly = isView;

  // ─── Form State ──────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    sid: 0,
    smiCode: '',
    sectionCode: '',
    subRiskID: '',
    smiDetails: '',
    sectionName: '',
    subRiskName: '',
    field1: '',
    field2: '',
    rates: 0,
    addSI: 0,
    stockItem: 0,
    multiplier: 0,
    a1: 0,
    a2: 0,
    a3: 0,
    a4: 0,
    a5: 0,
    active: 1,
    submittedBy: '',
    submittedOn: '',
    modifiedBy: '',
    modifiedOn: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Get color classes ────────────────────────────────────────
  const colorClasses = {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-100',
    button: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-300'
  };

  // ─── Load SMI data ──────────────────────────────────────────────
  useEffect(() => {
    // If we have data from navigation state, use it
    const stateData = location.state?.smiData;
    
    if (stateData && !isNew) {
      setFormData({
        sid: stateData.sid || 0,
        smiCode: stateData.smiCode || '',
        sectionCode: stateData.sectionCode || '',
        subRiskID: stateData.subRiskID || '',
        smiDetails: stateData.smiDetails || '',
        sectionName: stateData.sectionName || '',
        subRiskName: stateData.subRiskName || '',
        field1: stateData.field1 || '',
        field2: stateData.field2 || '',
        rates: stateData.rates || 0,
        addSI: stateData.addSI || 0,
        stockItem: stateData.stockItem || 0,
        multiplier: stateData.multiplier || 0,
        a1: stateData.a1 || 0,
        a2: stateData.a2 || 0,
        a3: stateData.a3 || 0,
        a4: stateData.a4 || 0,
        a5: stateData.a5 || 0,
        active: stateData.active ?? 1,
        submittedBy: stateData.submittedBy || '',
        submittedOn: stateData.submittedOn || '',
        modifiedBy: stateData.modifiedBy || '',
        modifiedOn: stateData.modifiedOn || ''
      });
      return;
    }

    // If we have an ID and we're not in new mode, fetch the SMI
    if (id && !isNew) {
      const smiId = parseInt(id);
      fetchSmiData(smiId);
    }

    // Cleanup
    return () => {
      dispatch(setCurrentSmi(null));
    };
  }, [id, location.state, isNew]);

  const fetchSmiData = async (smiId: number) => {
    try {
      setLoading(true);
      const result = await dispatch(fetchSmiById(smiId)).unwrap();
      if (result) {
        setFormData({
          sid: result.sid || 0,
          smiCode: result.smiCode || '',
          sectionCode: result.sectionCode || '',
          subRiskID: result.subRiskID || '',
          smiDetails: result.smiDetails || '',
          sectionName: result.sectionName || '',
          subRiskName: result.subRiskName || '',
          field1: result.field1 || '',
          field2: result.field2 || '',
          rates: result.rates || 0,
          addSI: result.addSI || 0,
          stockItem: result.stockItem || 0,
          multiplier: result.multiplier || 0,
          a1: result.a1 || 0,
          a2: result.a2 || 0,
          a3: result.a3 || 0,
          a4: result.a4 || 0,
          a5: result.a5 || 0,
          active: result.active ?? 1,
          submittedBy: result.submittedBy || '',
          submittedOn: result.submittedOn || '',
          modifiedBy: result.modifiedBy || '',
          modifiedOn: result.modifiedOn || ''
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load SMI data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── Form handlers ──────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? parseFloat(value) || 0 : value;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.smiCode.trim()) newErrors.smiCode = 'SMI Code is required';
    if (!formData.subRiskID.trim()) newErrors.subRiskID = 'Sub Risk ID is required';
    if (!formData.smiDetails.trim()) newErrors.smiDetails = 'SMI Details is required';
    if (formData.rates < 0) newErrors.rates = 'Rates must be greater than or equal to 0';
    if (formData.multiplier < 0) newErrors.multiplier = 'Multiplier must be greater than or equal to 0';
    return newErrors;
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

    try {
      setLoading(true);
      
      // Prepare data with proper types
      const submitData = {
        ...formData,
        sid: isNew ? 0 : formData.sid,
        modifiedBy: formData.modifiedBy || 'System',
        submittedBy: formData.submittedBy || 'System',
        submittedOn: formData.submittedOn || new Date().toISOString(),
        modifiedOn: new Date().toISOString()
      };

      if (isNew) {
        await dispatch(createProductSmi(submitData)).unwrap();
        toast({
          title: "Success",
          description: "SMI created successfully!",
          variant: "default",
        });
      } else {
        await dispatch(updateProductSmi(submitData)).unwrap();
        toast({
          title: "Success",
          description: "SMI updated successfully!",
          variant: "default",
        });
      }

      navigate('/admin/configurations/product-smi');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isNew ? 'create' : 'update'} SMI`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/configurations/product-smi');
  };

  const handleEdit = () => {
    navigate(`/admin/configurations/product-smi/edit/${formData.sid}`, {
      state: { smiData: formData }
    });
  };

  // ─── Render ──────────────────────────────────────────────────────
  if (loading && !isNew) {
    return (
      <div className="min-h-screen p-6">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-20 bg-gray-200 rounded-xl" />
            <div className="h-96 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <button
          onClick={handleCancel}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors mb-4 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to SMI List
        </button>

        {/* Header Card */}
        <Card className="bg-gradient-to-r from-gray-200 to-gray-200 border-white-200 mb-6">
          <div className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colorClasses.bg} ${colorClasses.text}`}>
                  <BarChart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {isNew ? 'Create New SMI' : isView ? 'SMI Details' : 'Edit SMI'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {isNew ? 'Add a new product SMI to the system' : 
                      isView ? 'View product SMI details' : 
                      'Update product SMI information'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isView && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    <Eye size={14} /> View Mode
                  </span>
                )}
                {isEdit && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                    <Edit size={14} /> Edit Mode
                  </span>
                )}
                {isNew && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <Save size={14} /> New
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6">
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
                {/* Left Column */}
                <div className="space-y-5">
                  {/* SMI Code */}
                  <div>
                    <label htmlFor="smiCode" className="block text-sm font-medium text-gray-700 mb-1.5">
                      SMI Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="smiCode"
                      type="text"
                      name="smiCode"
                      value={formData.smiCode}
                      onChange={handleChange}
                      disabled={isReadOnly}
                      placeholder="Enter SMI code"
                      className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isReadOnly 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      } ${
                        errors.smiCode ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {errors.smiCode && (
                      <p className="text-xs text-red-500 mt-1.5">{errors.smiCode}</p>
                    )}
                  </div>

                  {/* SMI Details */}
                  <div>
                    <label htmlFor="smiDetails" className="block text-sm font-medium text-gray-700 mb-1.5">
                      SMI Details <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="smiDetails"
                      type="text"
                      name="smiDetails"
                      value={formData.smiDetails}
                      onChange={handleChange}
                      disabled={isReadOnly}
                      placeholder="Enter SMI details"
                      className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isReadOnly 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      } ${
                        errors.smiDetails ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {errors.smiDetails && (
                      <p className="text-xs text-red-500 mt-1.5">{errors.smiDetails}</p>
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
                      disabled={isReadOnly}
                      placeholder="e.g. GPA, GL"
                      className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isReadOnly 
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
                      disabled={isReadOnly}
                      placeholder="Enter sub risk name"
                      className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isReadOnly 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      }`}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  {/* Section Code */}
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
                      disabled={isReadOnly}
                      placeholder="Enter section code"
                      className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isReadOnly 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      }`}
                    />
                  </div>

                  {/* Section Name */}
                  <div>
                    <label htmlFor="sectionName" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Section Name
                    </label>
                    <input
                      id="sectionName"
                      type="text"
                      name="sectionName"
                      value={formData.sectionName}
                      onChange={handleChange}
                      disabled={isReadOnly}
                      placeholder="Enter section name"
                      className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isReadOnly 
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
                      disabled={isReadOnly}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isReadOnly 
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

                  {/* Multiplier */}
                  <div>
                    <label htmlFor="multiplier" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Multiplier
                    </label>
                    <input
                      id="multiplier"
                      type="number"
                      name="multiplier"
                      value={formData.multiplier}
                      onChange={handleChange}
                      disabled={isReadOnly}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isReadOnly 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      } ${
                        errors.multiplier ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {errors.multiplier && (
                      <p className="text-xs text-red-500 mt-1.5">{errors.multiplier}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label htmlFor="active" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Status
                    </label>
                    <select
                      id="active"
                      name="active"
                      value={formData.active}
                      onChange={handleChange}
                      disabled={isReadOnly}
                      className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                        isReadOnly 
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                          : "bg-white hover:border-gray-300"
                      }`}
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Additional Fields - Full Width */}
                {/* <div className="col-span-1 lg:col-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                    <div>
                      <label htmlFor="field1" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Field 1
                      </label>
                      <input
                        id="field1"
                        type="text"
                        name="field1"
                        value={formData.field1}
                        onChange={handleChange}
                        disabled={isReadOnly}
                        placeholder="Field 1"
                        className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                          isReadOnly 
                            ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                            : "bg-white hover:border-gray-300"
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="field2" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Field 2
                      </label>
                      <input
                        id="field2"
                        type="text"
                        name="field2"
                        value={formData.field2}
                        onChange={handleChange}
                        disabled={isReadOnly}
                        placeholder="Field 2"
                        className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                          isReadOnly 
                            ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                            : "bg-white hover:border-gray-300"
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="addSI" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Add SI
                      </label>
                      <input
                        id="addSI"
                        type="number"
                        name="addSI"
                        value={formData.addSI}
                        onChange={handleChange}
                        disabled={isReadOnly}
                        placeholder="0"
                        step="0.01"
                        className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                          isReadOnly 
                            ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                            : "bg-white hover:border-gray-300"
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="stockItem" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Stock Item
                      </label>
                      <input
                        id="stockItem"
                        type="number"
                        name="stockItem"
                        value={formData.stockItem}
                        onChange={handleChange}
                        disabled={isReadOnly}
                        placeholder="0"
                        step="0.01"
                        className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                          isReadOnly 
                            ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                            : "bg-white hover:border-gray-300"
                        }`}
                      />
                    </div>
                  </div>
                </div> */}

                {/* A1 - A5 - Full Width Row */}
                {/* <div className="col-span-1 lg:col-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
                        disabled={isReadOnly}
                        placeholder="0"
                        step="0.01"
                        className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                          isReadOnly 
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
                        disabled={isReadOnly}
                        placeholder="0"
                        step="0.01"
                        className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                          isReadOnly 
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
                        disabled={isReadOnly}
                        placeholder="0"
                        step="0.01"
                        className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                          isReadOnly 
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
                        disabled={isReadOnly}
                        placeholder="0"
                        step="0.01"
                        className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                          isReadOnly 
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
                        disabled={isReadOnly}
                        placeholder="0"
                        step="0.01"
                        className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                          isReadOnly 
                            ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                            : "bg-white hover:border-gray-300"
                        }`}
                      />
                    </div>
                  </div>
                </div> */}

                {/* Metadata - Only show in view mode */}
                {isView && (
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
              
              {!isReadOnly && (
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
                      {isNew ? 'Create SMI' : 'Update SMI'}
                    </>
                  )}
                </button>
              )}
              
              {isView && (
                <button
                  type="button"
                  onClick={handleEdit}
                  className={`inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white ${colorClasses.button} rounded-lg focus:ring-4 transition-colors`}
                >
                  <Edit size={16} />
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

export default ProductSMIForm;