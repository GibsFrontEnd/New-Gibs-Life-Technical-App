//@ts-nocheck
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  fetchProductSettings,
  selectProductSettings,
} from "../../../features/reducers/productReducers/productSlice";
import { 
  ChevronLeft, 
  Eye, 
  Settings,
  Calendar,
  User,
  Hash,
  Banknote,
  Tag,
  FileText,
  AlertCircle
} from "lucide-react";
import { Card, CardContent } from "../../../components/UI/card";
import { useToast } from "../../../hooks/use-toast";

// ─── Helper to format values ────────────────────────────────────
const formatValue = (value: any) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toFixed(2);
  }
  if (typeof value === 'string' && value.trim() === '') return '—';
  return value;
};

// ─── Info Row Component ─────────────────────────────────────────
const InfoRow = ({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) => {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
      {Icon && (
        <div className="flex-shrink-0 mt-0.5">
          <Icon size={18} className="text-gray-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5 break-words">
          {formatValue(value)}
        </p>
      </div>
    </div>
  );
};

// ─── Section Component ──────────────────────────────────────────
const InfoSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {children}
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────
const ProductSettingForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { toast } = useToast();
  
  const { settings, loading, error } = useSelector(selectProductSettings);
  
  const [settingData, setSettingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ─── Load setting data ──────────────────────────────────────────
  useEffect(() => {
    const stateData = location.state?.settingData;
    
    if (stateData) {
      setSettingData(stateData);
      return;
    }

    if (id) {
      const existing = settings.find((s: any) => s.productID === id);
      if (existing) {
        setSettingData(existing);
        return;
      }

      const fetchSetting = async () => {
        try {
          setIsLoading(true);
          const result = await dispatch(fetchProductSettings()).unwrap();
          const found = result.items?.find((s: any) => s.productID === id);
          if (found) {
            setSettingData(found);
          } else {
            toast({
              title: "Not Found",
              description: `Product setting with ID "${id}" not found`,
              variant: "destructive",
            });
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "Failed to load product setting",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchSetting();
    }
  }, [id, settings, location.state, dispatch, toast]);

  // ─── Handlers ──────────────────────────────────────────────────
  const handleGoBack = () => {
    navigate(-1);
  };

  // ─── Loading State ─────────────────────────────────────────────
  if (isLoading || (loading && !settingData)) {
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

  // ─── Error / Not Found ─────────────────────────────────────────
  if (!settingData) {
    return (
      <div className="min-h-screen p-6">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col items-center gap-4 text-center p-12 bg-white rounded-xl border border-gray-200">
            <div className="p-3 bg-red-50 rounded-full">
              <Settings className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-500 font-medium">Product setting not found</p>
            <button
              onClick={handleGoBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <ChevronLeft size={15} /> Back to Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors mb-4 group"
        >
          <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Settings
        </button>

        {/* Header Card */}
        <Card className="bg-gradient-to-r from-gray-200 to-gray-200 border-white-200 mb-6">
          <div className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-50 text-green-700">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Product Setting Details</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      View configuration settings for product <span className="font-semibold text-gray-900">{settingData.productID}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  <Eye size={14} /> View Mode
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Details Card */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 space-y-6">
            {/* Product Information */}
            <InfoSection title="Product Information">
              <InfoRow 
                label="Product ID" 
                value={settingData.productID} 
                icon={Hash}
              />
              <InfoRow 
                label="Tag" 
                value={settingData.tag} 
                icon={Tag}
              />
              <InfoRow 
                label="Remarks" 
                value={settingData.remarks} 
                icon={FileText}
              />
            </InfoSection>

            {/* Age Range */}
            <InfoSection title="Age Requirements">
              <InfoRow 
                label="Minimum Age" 
                value={settingData.min_Age} 
                icon={User}
              />
              <InfoRow 
                label="Maximum Age" 
                value={settingData.max_Age} 
                icon={User}
              />
            </InfoSection>

            {/* Duration */}
            <InfoSection title="Duration Requirements">
              <InfoRow 
                label="Minimum Duration" 
                value={settingData.min_Duration} 
                icon={Calendar}
              />
              <InfoRow 
                label="Maximum Duration" 
                value={settingData.max_Duration} 
                icon={Calendar}
              />
            </InfoSection>

            {/* Contribution */}
            <InfoSection title="Contribution Requirements">
              <InfoRow 
                label="Minimum Contribution" 
                value={settingData.min_Contribution} 
               
              />
              <InfoRow 
                label="Maximum Contribution" 
                value={settingData.max_Contribution} 
          
              />
              <InfoRow 
                label="Rate Division Factor" 
                value={settingData.rateDiv_factor} 
              />
            </InfoSection>

            {/* Sum Assured */}
            <InfoSection title="Sum Assured Requirements">
              <InfoRow 
                label="Minimum Sum Assured" 
                value={settingData.min_SA} 
               
              />
              <InfoRow 
                label="Maximum Sum Assured" 
                value={settingData.max_SA} 
              
              />
              <InfoRow 
                label="Multiplier" 
                value={settingData.multiplier?.trim()} 
              />
            </InfoSection>


            {/* Configuration Status */}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <AlertCircle size={18} className="text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Configuration Status</p>
                  <p className="text-sm text-gray-600">
                    {settingData.min_Age !== null && 
                     settingData.min_Age !== undefined && 
                     settingData.min_Age !== '' && 
                     settingData.min_Age !== 0 &&
                     settingData.max_Age !== null &&
                     settingData.max_Age !== undefined &&
                     settingData.max_Age !== '' &&
                     settingData.max_Age !== 0 ? (
                      <span className="text-green-600 font-medium">✓ Configured</span>
                    ) : (
                      <span className="text-gray-500">Not Configured</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleGoBack}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductSettingForm;