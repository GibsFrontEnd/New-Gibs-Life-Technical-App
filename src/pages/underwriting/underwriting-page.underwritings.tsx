//@ts-nocheck
import { useEffect, useState } from "react";
import Underwriting from "../../components/underwritings/underwriting/Underwriting";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllRisks } from "../../features/reducers/adminReducers/riskSlice";
import { AppDispatch, RootState } from "@/features/store";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useLocation } from "react-router-dom";

const UnderwritingsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { risks } = useSelector((state: RootState) => state.risks);
  const { businessId: businessIdParam } = useParams<{ businessId?: string }>();
  const location = useLocation();
  const businessId = businessIdParam ?? null;

  useEffect(() => {
    dispatch(getAllRisks({ pageNumber: 1, pageSize: 100 }) as any);
  }, [dispatch]);

  // FIXED: Correct risk ID mapping
  const getRiskIdFromBusinessType = (businessType: string) => {
    const riskMap: Record<string, string> = {
      'fire': 'F',           // Fire → F
      'motor': 'V',          // Motor/Vehicle → V
      'package-bus': 'PP',   // Package Bus → PP (FIXED from GL to PP)
      'agric': 'GL',
      'bond': 'B',
      'engineering': 'GL',
      'aviation': 'GL',
      'marine-cargo': 'GL',
      'marine-hull': 'GL',
      'oil-and-energy': 'GL',
      'special-risk': 'GL',
    };
    return riskMap[businessType] || businessType;
  };

  // Determine the business type from the URL path
  const getBusinessTypeFromPath = () => {
    const path = location.pathname;
    
    if (path.includes('/general-bus/fire')) return 'fire';
    if (path.includes('/general-bus/motor')) return 'motor';
    if (path.includes('/package-bus')) return 'package-bus';
    if (path.includes('/agric')) return 'agric';
    if (path.includes('/bond')) return 'bond';
    if (path.includes('/engineering')) return 'engineering';
    if (path.includes('/aviation')) return 'aviation';
    if (path.includes('/marine-cargo')) return 'marine-cargo';
    if (path.includes('/marine-hull')) return 'marine-hull';
    if (path.includes('/oil-and-energy')) return 'oil-and-energy';
    if (path.includes('/special-risk')) return 'special-risk';
    
    return null;
  };

  const businessTypeFromPath = getBusinessTypeFromPath();

  // Get the business ID to pass to Underwriting component
  const getBusinessIdForUnderwriting = () => {
    // If we have a businessId from params, use it
    if (businessId) return businessId;
    
    // If we have a business type from path, map it to risk ID
    if (businessTypeFromPath) {
      const mappedId = getRiskIdFromBusinessType(businessTypeFromPath);
      console.log(`📌 Mapping ${businessTypeFromPath} to risk ID: ${mappedId}`);
      return mappedId;
    }
    
    // Default to Fire if no match
    return 'F';
  };

  const underwritingBusinessId = getBusinessIdForUnderwriting();

  // Get display title based on the current route
  const getPageTitle = () => {
    const titles: Record<string, string> = {
      'fire': 'Fire',
      'motor': 'Motor',
      'package-bus': 'Package Bus',
      'agric': 'Agric',
      'bond': 'Bond',
      'engineering': 'Engineering',
      'aviation': 'Aviation',
      'marine-cargo': 'Marine Cargo',
      'marine-hull': 'Marine Hull',
      'oil-and-energy': 'Oil and Energy',
      'special-risk': 'Special Risk',
    };
    
    if (businessTypeFromPath && titles[businessTypeFromPath]) {
      return titles[businessTypeFromPath];
    }
    
    if (businessId) {
      const risk = risks.find(r => String(r.riskID) === String(businessId));
      if (risk) return risk.riskName;
    }
    
    return 'All Policies';
  };

  // Build tabs based on the current route
  const buildTabs = () => {
    if (businessTypeFromPath || businessId) {
      const title = getPageTitle();
      return {
        title: title,
        content: <Underwriting businessId={underwritingBusinessId} />
      };
    }

    const uniqueRisks = risks?.reduce((acc, risk) => {
      if (!acc.some(r => r.riskID === risk.riskID)) {
        acc.push(risk);
      }
      return acc;
    }, []) || [];

    return uniqueRisks.map(risk => ({
      title: risk.riskName,
      content: <Underwriting businessId={risk.riskID} />
    }));
  };

  const tabs = buildTabs();
  const isSingleTab = !Array.isArray(tabs) || tabs.length === 1;
  const tabArray = Array.isArray(tabs) ? tabs : [tabs];

  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (tabArray && tabArray.length > 0) {
      setActiveTab(tabArray[0].title);
    }
  }, [tabs]);

  // If we're on a specific business route, show the page without tabs
  if (businessTypeFromPath || businessId) {
    return (
      <div className="max-w-[1200px] mx-auto mb-10">
       
        <div className="bg-white rounded-lg shadow-sm p-6">
          <Underwriting businessId={underwritingBusinessId} />
        </div>
      </div>
    );
  }

  // Default: Show tabs view (All Policies)
  return (
    <div className="max-w-[1200px] mx-auto mb-10">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-[#111827] m-0">Underwriting</h1>
        <p className="text-sm text-gray-500 mt-1">Manage all policies across all business lines</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex flex-wrap">
          {tabArray.map((tab) => (
            <TabsTrigger
              key={tab.title}
              value={tab.title}
              className="flex-1 min-w-[100px] hover:bg-neutral-200"
            >
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabArray.map((tab) => (
          <TabsContent key={tab.title} value={tab.title}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default UnderwritingsPage;