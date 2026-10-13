// EditGroupLifeQuotationDetail.tsx
// @ts-nocheck

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "../UI/new-button";
import { Input } from "../UI/new-input";
import { Label } from "../UI/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../UI/new-select";
import { ArrowLeft, RefreshCw, Loader2, ChevronDown, X, Users, CreditCard, Paperclip, FileText } from "lucide-react";
import { useToast } from "../UI/use-toast";
import { useAppDispatch, useAppSelector } from "../../hooks/use-apps";
import {
  selectGroupLifeQuotations,
  fetchGroupLifePolicy,
  updateGroupLifePolicy,
  setCurrentQuotation,
  setMembersForCurrentQuotation,
  setComputedTotalsForCurrentQuotation,
  clearCurrentQuotation,
  removePolicyMember,
  savePolicyMember,
  computeMemberPremium,
} from "../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";
import type { GroupLifeMember } from "../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";
import MemberManagementTable from "./MemberManagementTable";
import { formatDate } from "@/utils/ui-utilities";
import { SERVER_URL } from "../../utils/constants";
import { inclusiveCoverDays } from "../../utils/cover-days";
import { debounce } from "lodash";

// Import the tabs components
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../UI/tabs";
import GroupLifeDetailsTab from "./GroupLifeDetailsTab";
import CreditNotesTab from "./CreditNotesTab";
import AttachmentsTab from "./AttachmentsTab";
import DebitNoteList from './DebitNoteList';

// ==================== TYPES ====================

interface GroupLifeExtensionRow {
  itemNo: number;
  description: string;
  rate: string;
  itemValue: string;
}

interface CompleteQuotationFormData {
  quotationNumber: string;
  policyNo: string;
  transactionDate: string;
  effectiveDate: string;
  expiryDate: string;
  coverDay: string;
  clientName: string;
  groupFactorAmount: string;
  insuredType: string;
  schemeTypes: string;
  groupLifeFactor: string;
  rateType: string;
  existingClients: boolean;
  useFixedRate: boolean;
  useAverageAge: boolean;
  gpaRates: boolean;
  uploadMemberDetails: boolean;
  groupLifeExtension: boolean;
  extensionRows: GroupLifeExtensionRow[];
  totalSumInsured: string;
  loadingPercent: string;
  quotationStatus: string;
  totalPremium: string;
  reductionPercent: string;
  netPremiumDue: string;
  currency: string;
  exRate: number;
  accountExecutiveId: string;
  branchId: string;
  businessSource: string;
  agentBrokerId: string;
  accountTypeId: string;
  busChannelId: string;
  subChannelId: string;
  proportionPercent: number;
  premiumRatePercent: number;
  businessSector: string;
  product: string;
}

// Dropdown option types from API
interface ApiDropdownOption {
  id: string;
  name: string;
  code?: string;
  value?: string;
  label?: string;
  [key: string]: any;
}

// Searchable Dropdown Component
interface SearchableDropdownProps {
  options: ApiDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  loading: boolean;
  error: boolean;
  required?: boolean;
  disabled?: boolean;
  searchPlaceholder?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
  label,
  loading,
  error,
  required = false,
  disabled = false,
  searchPlaceholder = "Search...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  const filteredOptions = options.filter(opt =>
    opt.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opt.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

 

  const handleSelect = (option: ApiDropdownOption) => {
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    onChange("");
    setSearchTerm("");
  };

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <div
          className={`flex items-center justify-between border rounded-md px-3 py-2 cursor-pointer ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'
          } ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span className={`${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
            {selectedOption?.name || placeholder}
          </span>
          <div className="flex items-center gap-1">
            {selectedOption && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-0.5 hover:bg-gray-200 rounded-full"
              >
                <X className="h-3 w-3 text-gray-500" />
              </button>
            )}
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-gray-200">
              <Input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-8 text-sm"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <span className="ml-2 text-sm text-gray-500">Loading...</span>
                </div>
              ) : error ? (
                <div className="py-4 text-center text-sm text-red-500">
                  Failed to load options
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="py-4 text-center text-sm text-gray-500">
                  No options available
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-0 ${
                      option.id === value ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="font-medium text-sm">{option.name}</div>
                    {option.code && (
                      <div className="text-xs text-gray-500">Code: {option.code}</div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const formatDateForInput = (dateString: string): string => {
  if (!dateString) return "";
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const EditGroupLifeQuotationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const policyNo = id ? decodeURIComponent(id) : "";
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { currentQuotation, loading } = useAppSelector(selectGroupLifeQuotations);

  const [members, setMembers] = useState<GroupLifeMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("policy");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    const VALID_TABS = ["policy", "group-life", "debit-note", "credit-note", "attachments"];
  
    if (tab && VALID_TABS.includes(tab)) {
      setActiveTab(tab);
  
      // Strip the query param so a refresh doesn't force the tab again
      const newSearch = new URLSearchParams(location.search);
      newSearch.delete("tab");
      newSearch.delete("policy");
      const newPath =
        location.pathname + (newSearch.toString() ? `?${newSearch.toString()}` : "");
      window.history.replaceState({}, document.title, newPath);
    }
  }, [location.search]);

  // Track if dropdowns are loaded
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // State for dropdown options
  const [accountExecutives, setAccountExecutives] = useState<ApiDropdownOption[]>([]);
  const [branches, setBranches] = useState<ApiDropdownOption[]>([]);
  const [businessSources, setBusinessSources] = useState<ApiDropdownOption[]>([]);
  const [agentBrokers, setAgentBrokers] = useState<ApiDropdownOption[]>([]);
  const [accountTypes, setAccountTypes] = useState<ApiDropdownOption[]>([]);
  const [busChannels, setBusChannels] = useState<ApiDropdownOption[]>([]);
  const [businessSectors, setBusinessSectors] = useState<ApiDropdownOption[]>([]);
  const [products, setProducts] = useState<ApiDropdownOption[]>([]);
  const [rateTypes, setRateTypes] = useState<ApiDropdownOption[]>([]);

  // Loading states for dropdowns
  const [dropdownLoading, setDropdownLoading] = useState({
    accountExecutives: true,
    branches: true,
    businessSources: true,
    agentBrokers: true,
    accountTypes: true,
    busChannels: true,
    businessSectors: true,
    products: true,
    rateTypes: true,
  });

  // Error states for dropdowns
  const [dropdownErrors, setDropdownErrors] = useState({
    accountExecutives: false,
    branches: false,
    businessSources: false,
    agentBrokers: false,
    accountTypes: false,
    busChannels: false,
    businessSectors: false,
    products: false,
    rateTypes: false,
  });

  const [formData, setFormData] = useState<CompleteQuotationFormData>({
    quotationNumber: "[AUTO]",
    policyNo: "",
    transactionDate: new Date().toISOString().split("T")[0],
    effectiveDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split("T")[0],
    coverDay: "0.00",
    clientName: "",
    groupFactorAmount: "1000.00",
    insuredType: "",
    schemeTypes: "",
    groupLifeFactor: "0",
    rateType: "",
    existingClients: false,
    useFixedRate: false,
    useAverageAge: false,
    gpaRates: false,
    uploadMemberDetails: false,
    groupLifeExtension: false,
    extensionRows: [
      { itemNo: 1, description: "", rate: "0", itemValue: "0" },
      { itemNo: 2, description: "", rate: "0", itemValue: "0" },
      { itemNo: 3, description: "", rate: "0", itemValue: "0" },
      { itemNo: 4, description: "", rate: "0", itemValue: "0" },
      { itemNo: 5, description: "", rate: "0", itemValue: "0" },
    ],
    totalSumInsured: "0.00",
    loadingPercent: "0",
    quotationStatus: "PROSPECT",
    totalPremium: "0.00",
    reductionPercent: "0",
    netPremiumDue: "0.00",
    currency: "NGN",
    exRate: 1,
    accountExecutiveId: "",
    branchId: "",
    businessSource: "",
    agentBrokerId: "",
    accountTypeId: "",
    busChannelId: "",
    subChannelId: "",
    proportionPercent: 100,
    premiumRatePercent: 2.0,
    businessSector: "",
    product: "",
  });

  const [expandedSections, setExpandedSections] = useState({
    policyDetails: true,
    memberDetails: true,
    extensionDetails: false,
    quotationStatus: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleInputChange = (
    field: keyof CompleteQuotationFormData,
    value: string | boolean | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getSourceFromUrl = () => {

  const params = new URLSearchParams(location.search);
  return params.get('source') || 'scheme-admin';

  console.log('📍 Source from URL:', sourceFromUrl);
};
 

const sourcePage = getSourceFromUrl();

  // ==================== FETCH DROPDOWN OPTIONS FROM API ====================

  const fetchDropdownData = async (endpoint: string, params?: Record<string, any>): Promise<ApiDropdownOption[]> => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      let url = `${SERVER_URL}${endpoint}`;
      if (params) {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }
      }
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) return data;
      if (data.data) return data.data;
      if (data.items) return data.items;
      if (data.records) return data.records;
      if (data.results) return data.results;
      return [];
    } catch (error) {
      console.error(`Error fetching from ${endpoint}:`, error);
      throw error;
    }
  };

  // Fetch all dropdown data - CORRECTED with all endpoints
  const fetchAllDropdowns = async () => {
    const endpoints = [
      { 
        key: 'products', 
        url: '/v1/Products',
        params: { PageNo: 1, PageSize: 100 },
        mapper: (item: any) => ({
          id: item.productID || item.riskID || item.id || item.subRiskId,
          name: item.productName || item.description || item.name || item.subRiskName,
          code: item.productID || item.code || item.subRiskId,
          riskID: item.riskID || item.riskId || item.RiskID,
          ...item
        })
      },
      { 
        key: 'accountExecutives', 
        url: '/lookups/account-executives',  // ✅ FIXED: Correct endpoint
        mapper: (item: any) => ({
          id: item.value || item.id,
          name: item.text || item.name,
          code: item.value || item.code,
          ...item
        })
      },
      { 
        key: 'agentBrokers', 
        url: '/v1/Agents',
        mapper: (item: any) => ({
          id: item.agentID || item.id,
          name: item.agent || item.name,
          code: item.agentID || item.code,
          phone: item.phone1,
          email: item.email,
          ...item
        })
      },
      { 
        key: 'branches', 
        url: '/lookups/branches',
        mapper: (item: any) => ({
          id: item.branchID || item.id,
          name: item.description || item.name,
          code: item.branchID2 || item.code,
          regionID: item.regionID,
          stateID: item.stateID,
          manager: item.manager,
          address: item.address,
          ...item
        })
      },
      { 
        key: 'busChannels', 
        url: '/lookups/channels',
        mapper: (item: any) => ({
          id: item.value || item.id,
          name: item.text || item.name,
          code: item.value || item.code,
          ...item
        })
      },
      { 
        key: 'businessSources', 
        url: '/lookups/business-sources',
        mapper: (item: any) => ({
          id: item.value || item.id,
          name: item.text || item.name,
          code: item.value || item.code,
          ...item
        })
      },
      { 
        key: 'accountTypes', 
        url: '/lookups/account-types',
        mapper: (item: any) => ({
          id: item.value || item.id,
          name: item.text || item.name,
          code: item.value || item.code,
          ...item
        })
      },
      { 
        key: 'rateTypes', 
        url: '/lookups/premium-rate',
        params: { productCode: 'GL', duration: 12, age: 0 },
        mapper: (item: any) => ({
          id: item.id || item.rateId || item.rateTypeId || item.value,
          name: item.name || item.rateName || item.description || item.text,
          value: item.rateValue || item.value || item.rate,
          code: item.code || item.rateCode,
          ...item
        })
      },
    ];

    setDropdownLoading(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    const promises = endpoints.map(async ({ key, url, params, mapper }) => {
      try {
        const rawData = await fetchDropdownData(url, params);
        console.log(`🔍 Raw data for ${key}:`, rawData);
        const formattedData = rawData.map((item: any) => mapper(item));
        console.log(`✅ Formatted data for ${key}:`, formattedData);

        switch (key) {
          case 'products': {
            const filteredProducts = formattedData.filter((item: any) => {
              const rId = (item.riskID || item.riskId || item.RiskID)?.toString().trim().toUpperCase();
              return rId === "GL";
            });
            setProducts(filteredProducts);
            break;
          }
          case 'accountExecutives': setAccountExecutives(formattedData); break;
          case 'agentBrokers': setAgentBrokers(formattedData); break;
          case 'branches': setBranches(formattedData); break;
          case 'busChannels': setBusChannels(formattedData); break;
          case 'businessSources': setBusinessSources(formattedData); break;
          case 'accountTypes': setAccountTypes(formattedData); break;
          case 'rateTypes': setRateTypes(formattedData); break;
        }
        setDropdownLoading(prev => ({ ...prev, [key]: false }));
        setDropdownErrors(prev => ({ ...prev, [key]: false }));
      } catch (error) {
        console.error(`Failed to fetch ${key}:`, error);
        setDropdownLoading(prev => ({ ...prev, [key]: false }));
        setDropdownErrors(prev => ({ ...prev, [key]: true }));
      }
    });

    await Promise.all(promises);
    console.log("✅ All dropdowns loaded");
  };

  // Fetch dropdown data and mark as loaded
  useEffect(() => {
    const loadDropdowns = async () => {
      await fetchAllDropdowns();
      setDropdownsLoaded(true);
      console.log("✅ Dropdowns loaded successfully");
    };
    loadDropdowns();
  }, []);

  // Fetch exchange rate from external API
  const fetchExchangeRate = async (fromCurrency: string, toCurrency: string = "NGN") => {
    setIsFetchingRate(true);
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch exchange rate");
      }
      
      const data = await response.json();
      const rate = data.rates?.[toCurrency];
      
      if (rate) {
        setFormData(prev => ({ ...prev, exRate: rate }));
        toast({
          description: `Exchange rate updated: 1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`,
          duration: 2000,
        });
      } else {
        throw new Error("Rate not available");
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      toast({
        description: `Could not fetch live rate. Please try again later.`,
        duration: 2000,
        variant: "destructive",
      });
    } finally {
      setIsFetchingRate(false);
    }
  };

  const handleCurrencyChange = (currencyValue: string) => {
    setFormData(prev => ({ ...prev, currency: currencyValue }));
    if (currencyValue !== "NGN") {
      fetchExchangeRate(currencyValue, "NGN");
    } else {
      setFormData(prev => ({ ...prev, exRate: 1 }));
      toast({
        description: "Base currency selected: NGN",
        duration: 2000,
      });
    }
  };

  const handleRefreshRate = () => {
    if (formData.currency && formData.currency !== "NGN") {
      fetchExchangeRate(formData.currency, "NGN");
    } else {
      toast({
        description: "Using base currency NGN",
        duration: 2000,
      });
    }
  };

  // Client search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleClientSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const response = await fetch(
          `${SERVER_URL}/v1/Customers/search?SearchText=${encodeURIComponent(query)}`
        );
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        toast({
          title: "Search Error",
          description: "Failed to search for existing clients.",
          variant: "destructive",
        });
      } finally {
        setSearching(false);
      }
    }, 500),
    []
  );

  const selectClient = (client: any) => {
    let clientName = "";
    if (client.isOrg && client.orgName) {
      clientName = client.orgName;
    } else {
      const titlePart = client.title ? `${client.title} ` : "";
      const firstPart = client.firstName ? `${client.firstName} ` : "";
      const lastPart = client.lastName || "";
      clientName = (titlePart + firstPart + lastPart).trim() || client.customerID;
    }
    setSelectedClientId(client.customerID);
    handleInputChange("clientName", clientName);
    setSearchResults([]);
    setSearchQuery("");
    handleInputChange("existingClients", false);
  };

  useEffect(() => {
    if (formData.existingClients) {
      handleClientSearch(searchQuery);
    }
  }, [searchQuery, formData.existingClients, handleClientSearch]);

  // Load quotation data AFTER dropdowns are ready
  useEffect(() => {
    if (!dropdownsLoaded) {
      console.log("⏳ Waiting for dropdowns to load...");
      return;
    }

    const loadQuotation = async () => {
      if (!policyNo) {
        console.warn("⚠️ No policy number found in URL");
        return;
      }

      console.log("🔍 Fetching quotation with policy number:", policyNo);

      try {
        const result = await dispatch(
          fetchGroupLifePolicy(policyNo)
        ).unwrap();

        console.log("📦 Full API Response:", result);
        
        const data = result.data || result;
        
        console.log("✅ Extracted quotation data:", data);

        // Find matching dropdown values
        const findOptionId = (options: ApiDropdownOption[], searchValue: string): string => {
          if (!searchValue) return "";
          
          console.log(`🔍 Searching for: "${searchValue}" in ${options.length} options`);
          
          // Try exact match first
          let found = options.find(opt => 
            opt.id?.toLowerCase() === searchValue.toLowerCase() ||
            opt.name?.toLowerCase() === searchValue.toLowerCase() ||
            opt.code?.toLowerCase() === searchValue.toLowerCase()
          );
          
          // Try partial match if no exact match
          if (!found) {
            found = options.find(opt => 
              opt.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
              searchValue.toLowerCase().includes(opt.name?.toLowerCase() || '')
            );
          }
          
          console.log(`✅ Found:`, found);
          return found?.id || "";
        };

        // Map API response to form fields
        const updatedFormData = {
          quotationNumber: data.policyNo || data.quotationNumber || "[AUTO]",
          policyNo: data.policyNo || policyNo,
          transactionDate: data.entryDate ? formatDateForInput(data.entryDate) : new Date().toISOString().split("T")[0],
          effectiveDate: data.startDate ? formatDateForInput(data.startDate) : new Date().toISOString().split("T")[0],
          expiryDate: data.expiryDate ? formatDateForInput(data.expiryDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
          coverDay: data.coverDays != null ? data.coverDays.toString() : "0.00",
          clientName: data.insuredName || data.companyName || data.clientName || "",
          groupFactorAmount: data.groupFactorAmount != null ? data.groupFactorAmount.toString() : "1000.00",
          insuredType: data.insuredType || "",
          schemeTypes: data.subRiskName || data.schemeType || "GROUP LIFE",
          groupLifeFactor: data.groupLifeFactor != null ? data.groupLifeFactor.toString() : "0",
          rateType: data.rateType || "",
          existingClients: false,
          useFixedRate: data.useFixedRate || false,
          useAverageAge: data.useAverageAge || false,
          gpaRates: false,
          uploadMemberDetails: false,
          groupLifeExtension: data.groupLifeExtension || false,
          extensionRows: Array.isArray(data.extensions) && data.extensions.length > 0
            ? data.extensions.map((ext: any) => ({
                itemNo: ext.itemNo,
                description: ext.description || "",
                rate: ext.rate != null ? ext.rate.toString() : "0",
                itemValue: ext.itemValue != null ? ext.itemValue.toString() : "0",
              }))
            : [
                { itemNo: 1, description: "", rate: "0", itemValue: "0" },
                { itemNo: 2, description: "", rate: "0", itemValue: "0" },
                { itemNo: 3, description: "", rate: "0", itemValue: "0" },
                { itemNo: 4, description: "", rate: "0", itemValue: "0" },
                { itemNo: 5, description: "", rate: "0", itemValue: "0" },
              ],
          totalSumInsured: data.totalSumInsured != null ? data.totalSumInsured.toFixed(2) : "0.00",
          loadingPercent: data.loadingPercentage != null ? data.loadingPercentage.toString() : "0",
          quotationStatus: data.status || "PROSPECT",
          totalPremium: data.totalPremium != null ? data.totalPremium.toFixed(2) : "0.00",
          reductionPercent: data.reductionPercentage != null ? data.reductionPercentage.toString() : "0",
          netPremiumDue: data.netPremiumDue != null ? data.netPremiumDue.toFixed(2) : "0.00",
          currency: data.currency || data.currencyName || "NGN",
          exRate: data.exchangeRate || 1,
          accountExecutiveId: findOptionId(
            accountExecutives,
            data.accountExecId || data.accountExecutiveId || data.accountExecName || data.accountExecutive || ""
          ),
          branchId: findOptionId(branches, data.branchId || data.branch || ""),
          businessSource: findOptionId(businessSources, data.businessSource || ""),
          agentBrokerId: findOptionId(agentBrokers, data.agentBrokerId || data.agentBroker || ""),
          accountTypeId: findOptionId(accountTypes, data.accountTypeId || data.accountType || ""),
          busChannelId: findOptionId(busChannels, data.busChannelId || data.busChannel || ""),
          subChannelId: data.subChannelId || data.subChannel || "",
          proportionPercent: data.proportionPercent || 100,
          premiumRatePercent: data.premiumRateFraction != null
            ? data.premiumRateFraction * 100
            : (data.premiumRatePercent || 0),
          businessSector: data.businessSector || "",
          product: findOptionId(products, data.subRiskId || data.subRiskName || ""),
        };

        if (data.insuredId) {
          setSelectedClientId(data.insuredId);
        }

        console.log("📋 Form data to set:", updatedFormData);
        setFormData(updatedFormData);

        // Set members if available
        if (data.members && Array.isArray(data.members)) {
          const mappedMembers = data.members.map((m: any) => ({
            id: m.id || m.memberId || `temp-${Math.random().toString(36).slice(2)}`,
            staffNo: m.staffNo || "",
            employeeNames: m.name || m.employeeNames || "Unknown",
            sex: m.gender || m.sex || "M",
            dateOfBirth: m.dateOfBirth ? formatDateForInput(m.dateOfBirth) : "",
            anb: m.anb || 0,
            basicSalary: m.salary || m.basicSalary || 0,
            housingAllowance: m.housingAllowance || 0,
            transportAllowance: m.transportAllowance || 0,
            totalEmolument: m.totalEmolument || m.salary || 0,
            sumInsured: m.sumAssured || 0,
            premium: m.premium || 0,
            rate: m.rate || 0,
            hireDate: m.hireDate ? formatDateForInput(m.hireDate) : "",
          }));
          setMembers(mappedMembers);
          console.log("👥 Members loaded:", mappedMembers.length);
        }

        dispatch(setCurrentQuotation(data));
        setDataLoaded(true);
        console.log("✅ Form data updated successfully");

      } catch (error: any) {
        console.error("❌ Load quotation error:", error);
        toast({
          title: "Error",
          description: error?.message || "Failed to load quotation",
          variant: "destructive",
        });
        setDataLoaded(true);
      }
    };

    loadQuotation();

    return () => {
      dispatch(clearCurrentQuotation());
    };
  }, [policyNo, dispatch, toast, dropdownsLoaded, accountExecutives, branches, businessSources, agentBrokers, accountTypes, busChannels, products]);

  const handleAddMember = async (member: Omit<GroupLifeMember, "id">) => {
    if (!policyNo) {
      toast({
        title: "Error",
        description: "Policy number is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const newMember = {
        ...member,
        id: `temp-${Date.now()}`,
      };

      const result = await dispatch(
        savePolicyMember({
          policyNo: policyNo,
          memberData: newMember,
        })
      ).unwrap();

      if (result && result.members) {
        setMembers(result.members);
      } else {
        setMembers([...members, newMember]);
      }

      toast({
        title: "Success",
        description: "Member added successfully",
      });
    } catch (error: any) {
      console.error("Add member error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to add member",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMember = async (index: number, member: GroupLifeMember) => {
    if (!policyNo) {
      toast({
        title: "Error",
        description: "Policy number is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await dispatch(
        savePolicyMember({
          policyNo: policyNo,
          memberData: member,
        })
      ).unwrap();

      if (result && result.members) {
        setMembers(result.members);
      } else {
        const updatedMembers = [...members];
        updatedMembers[index] = member;
        setMembers(updatedMembers);
      }

      toast({
        title: "Success",
        description: "Member updated successfully",
      });
    } catch (error: any) {
      console.error("Update member error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update member",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = async (index: number) => {
    if (!policyNo) {
      toast({
        title: "Error",
        description: "Policy number is required",
        variant: "destructive",
      });
      return;
    }

    const memberToDelete = members[index];
    if (!memberToDelete?.id) {
      toast({
        title: "Error",
        description: "Member ID is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await dispatch(
        removePolicyMember(memberToDelete.id)
      ).unwrap();

      setMembers(members.filter((_, i) => i !== index));

      toast({
        title: "Success",
        description: "Member deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete member error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete member",
        variant: "destructive",
      });
    }
  };

  // Inclusive of both dates, same as the API and the fire/motor screens.
  const handleGetCoverDay = () => {
    const days = inclusiveCoverDays(formData.effectiveDate, formData.expiryDate);
    setFormData((prev) => ({ ...prev, coverDay: days.toString() }));
  };

  // Keep Cover Day in step with the dates (including once the saved scheme loads).
  useEffect(() => {
    const days = inclusiveCoverDays(formData.effectiveDate, formData.expiryDate);
    setFormData((prev) => (prev.coverDay === days.toString() ? prev : { ...prev, coverDay: days.toString() }));
  }, [formData.effectiveDate, formData.expiryDate]);

  const handleComputePreview = async () => {
    if (!members || members.length === 0) {
      toast({
        title: "No members",
        description: "Please add members before computing",
        variant: "destructive",
      });
      return;
    }

    try {
      let totalSumInsured = 0;
      let totalPremium = 0;
      const computedMembers = [];

      for (const member of members) {
        const memberData = {
          name: member.employeeNames || member.name || "Unknown",
          dateOfBirth: member.dateOfBirth || new Date().toISOString().split('T')[0],
          gender: member.sex || member.gender || "M",
          salary: member.basicSalary || member.salary || 0,
          sumAssured: member.sumInsured || member.sumAssured || 0,
          premium: member.premium || 0,
        };

        try {
          const result = await dispatch(computeMemberPremium(memberData)).unwrap();
          const computedMember = {
            ...member,
            sumInsured: result.sumAssured || memberData.sumAssured,
            premium: result.premium || 0,
            anb: result.anb || 0,
          };
          computedMembers.push(computedMember);
          totalSumInsured += computedMember.sumInsured;
          totalPremium += computedMember.premium;
        } catch (err) {
          console.error("Error computing member:", err);
          computedMembers.push(member);
          totalSumInsured += member.sumInsured || 0;
          totalPremium += member.premium || 0;
        }
      }

      const loadingRate = Number.parseFloat(formData.loadingPercent) || 0;
      const reductionRate = Number.parseFloat(formData.reductionPercent) || 0;
      const netPremiumDue = totalPremium * (1 + loadingRate / 100) * (1 - reductionRate / 100);

      dispatch(
        setComputedTotalsForCurrentQuotation({
          totalSumInsured: totalSumInsured,
          totalPremium: totalPremium,
          netPremiumDue: netPremiumDue,
          loadingPercentage: loadingRate,
          reductionPercentage: reductionRate,
        })
      );

      setMembers(computedMembers);

      setFormData((prev) => ({
        ...prev,
        totalSumInsured: totalSumInsured.toFixed(2),
        totalPremium: totalPremium.toFixed(2),
        netPremiumDue: netPremiumDue.toFixed(2),
        loadingPercent: loadingRate.toString(),
        reductionPercent: reductionRate.toString(),
      }));

      toast({
        title: "Preview ready",
        description: `Quotation recomputed successfully. Total Premium: ${totalPremium.toFixed(2)}`,
      });
    } catch (error: any) {
      console.error("Compute error:", error);
      toast({
        title: "Compute failed",
        description: error?.message || "Unable to compute quotation",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    const missingFields = [];
    
    if (!formData.clientName || formData.clientName.trim() === "") {
      missingFields.push("Client Name");
    }
    if (!formData.accountExecutiveId) missingFields.push("Account Executive");
    if (!formData.branchId) missingFields.push("Branch/Location");
    if (!formData.businessSource) missingFields.push("Business Source");
    if (!formData.accountTypeId) missingFields.push("Account Types");
    if (!formData.busChannelId) missingFields.push("Bus Channels");
    if (!formData.product) missingFields.push("Product");
    if (!(Number(formData.premiumRatePercent) > 0)) missingFields.push("Premium Rate%");

    if (missingFields.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Get subRiskId from selected product
    const selectedProduct = products.find((p) => p.id === formData.product);
    const subRiskId = selectedProduct?.code || selectedProduct?.id || formData.product;

    const policyData = {
      transactionType: formData.product === "credit-life" ? "Credit Life" : "Group Life",
      class: formData.insuredType || "Company",
      subRiskId: subRiskId,
      entryDate: formData.transactionDate
        ? new Date(formData.transactionDate).toISOString()
        : new Date().toISOString(),
      startDate: formData.effectiveDate
        ? new Date(formData.effectiveDate).toISOString()
        : new Date().toISOString(),
      expiryDate: formData.expiryDate
        ? new Date(formData.expiryDate).toISOString()
        : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      accountExecutiveId: formData.accountExecutiveId,
      branchId: formData.branchId,
      businessSource: formData.businessSource,
      agentBrokerId: formData.agentBrokerId,
      insuredId: selectedClientId || currentQuotation?.insuredId || "",
      accountTypeId: formData.accountTypeId,
      busChannelId: formData.busChannelId,
      subChannelId: formData.subChannelId || "",
      proportionPercent: Number(formData.proportionPercent) || 100,
      premiumRatePercent: Number(formData.premiumRatePercent),
      currencyName: formData.currency || "NGN",
      exchangeRate: Number(formData.exRate) || 1,
    };

    try {
      setSaving(true);
      await dispatch(
        updateGroupLifePolicy({
          policyNo: formData.policyNo || policyNo,
          policyData: policyData,
        })
      ).unwrap();
      
      toast({
        title: "Success",
        description: "Quotation updated successfully.",
      });
      navigate("/underwriting/group-life-quotations");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to save quotation.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
     navigate(-1); 
  };

  // Show loading state while data loads
  if (loading.detail || !dropdownsLoaded || !dataLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg">
            {!dropdownsLoaded ? "Loading options..." : "Loading scheme details..."}
          </div>
        </div>
      </div>
    );
  }

  // Render Policy Details content (the main edit form)
  const renderPolicyDetails = () => {
    return (
      <>
        {/* Policy Details Section */}
        <div className="border rounded-lg shadow-sm mb-4">
          <button
            type="button"
            onClick={() => toggleSection("policyDetails")}
            className="w-full flex items-center gap-2 px-6 py-4 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <span className="font-semibold">Scheme Policy Details</span>
          </button>
          {expandedSections.policyDetails && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Policy Number */}
                <div className="space-y-2">
                  <Label htmlFor="quotationNumber" className="text-sm font-medium">
                    Policy Number
                  </Label>
                  <Input
                    id="quotationNumber"
                    value={formData.policyNo || formData.quotationNumber}
                    className="bg-gray-50"
                    readOnly
                  />
                </div>

                {/* Entry Date */}
                <div className="space-y-2">
                  <Label htmlFor="transactionDate" className="text-sm font-medium">
                    Entry Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="transactionDate"
                    type="date"
                    value={formData.transactionDate}
                    onChange={(e) => handleInputChange("transactionDate", e.target.value)}
                  />
                </div>

                {/* Effective Date */}
                <div className="space-y-2">
                  <Label htmlFor="effectiveDate" className="text-sm font-medium">
                    Effective Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => handleInputChange("effectiveDate", e.target.value)}
                  />
                </div>

                {/* Expiry Date */}
                <div className="space-y-2">
                  <Label htmlFor="expiryDate" className="text-sm font-medium">
                    Expiry Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                  />
                </div>

                {/* Agent/Broker */}
                <div className="space-y-2">
                  <SearchableDropdown
                    options={agentBrokers}
                    value={formData.agentBrokerId}
                    onChange={(value) => handleInputChange("agentBrokerId", value)}
                    placeholder="Select Agent/Broker"
                    label="Agent/Broker"
                    loading={dropdownLoading.agentBrokers}
                    error={dropdownErrors.agentBrokers}
                    searchPlaceholder="Search agent/broker..."
                  />
                </div>

                {/* Insured Details / Client Name */}
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="text-sm font-medium">
                    Insured Details <span className="text-red-500">*</span>
                  </Label>
                  {formData.existingClients ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          id="clientNameSearch"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search for existing clients..."
                          className={searching ? "pr-8" : ""}
                        />
                        {searching && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          </div>
                        )}
                      </div>

                      {searchResults.length > 0 && (
                        <div className="border rounded-md max-h-60 overflow-y-auto shadow-sm bg-white">
                          {searchResults.map((client) => {
                            let displayName = "";
                            if (client.isOrg && client.orgName) {
                              displayName = client.orgName;
                            } else {
                              const titlePart = client.title ? `${client.title} ` : "";
                              const firstPart = client.firstName ? `${client.firstName} ` : "";
                              const lastPart = client.lastName || "";
                              displayName = (titlePart + firstPart + lastPart).trim() || client.customerID;
                            }

                            return (
                              <button
                                key={client.customerID}
                                type="button"
                                onClick={() => selectClient(client)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100"
                              >
                                <div className="font-medium">{displayName}</div>
                                <div className="text-xs text-gray-500">
                                  ID: {client.customerID}
                                  {client.phoneLine1 && ` • Phone: ${client.phoneLine1}`}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <textarea
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => handleInputChange("clientName", e.target.value)}
                      className="w-full min-h-[80px] px-3 py-2 bg-gray-50 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Enter client name..."
                    />
                  )}
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="checkbox"
                      id="existingClients"
                      checked={formData.existingClients}
                      onChange={(e) => handleInputChange("existingClients", e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="existingClients" className="text-sm">
                      Existing Clients
                    </Label>
                  </div>
                </div>

                {/* Proportion % */}
                <div className="space-y-2">
                  <Label htmlFor="proportionPercent" className="text-sm font-medium">
                    Proportion% <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="proportionPercent"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.proportionPercent}
                    onChange={(e) => handleInputChange("proportionPercent", parseFloat(e.target.value) || 0)}
                    placeholder="Enter proportion percentage"
                  />
                </div>

                {/* Premium Rate % — used by "PolicyRate" pricing for added/uploaded members */}
                <div className="space-y-2">
                  <Label htmlFor="premiumRatePercent" className="text-sm font-medium">
                    Premium Rate% <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="premiumRatePercent"
                    type="number"
                    min="0"
                    step="any"
                    value={formData.premiumRatePercent || ""}
                    onChange={(e) => handleInputChange("premiumRatePercent", parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 2 for 2%"
                  />
                </div>

                {/* Foreign Currency */}
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm font-medium">
                    Foreign Currency <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.currency}
                      onValueChange={handleCurrencyChange}
                      className="flex-1"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="- select -" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NGN">NGN</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={handleRefreshRate}
                      variant="outline"
                      size="icon"
                      disabled={isFetchingRate || formData.currency === "NGN"}
                      title="Refresh Exchange Rate"
                    >
                      {isFetchingRate ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Exchange Rate */}
                <div className="space-y-2">
                  <Label htmlFor="exchangeRate" className="text-sm font-medium">
                    Exchange Rate <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="exchangeRate"
                    type="number"
                    step="0.0001"
                    value={formData.exRate}
                    onChange={(e) => handleInputChange("exRate", parseFloat(e.target.value) || 1)}
                    className="bg-gray-50"
                    disabled={isFetchingRate}
                  />
                </div>

                {/* Product */}
                <div className="space-y-2">
                  <SearchableDropdown
                    options={products}
                    value={formData.product}
                    onChange={(value) => handleInputChange("product", value)}
                    placeholder="Select Product"
                    label="Product"
                    loading={dropdownLoading.products}
                    error={dropdownErrors.products}
                    required={true}
                    searchPlaceholder="Search product..."
                  />
                </div>

                {/* Account Executive */}
                <div className="space-y-2">
                  <SearchableDropdown
                    options={accountExecutives}
                    value={formData.accountExecutiveId}
                    onChange={(value) => handleInputChange("accountExecutiveId", value)}
                    placeholder="Select Account Executive"
                    label="Account Executive"
                    loading={dropdownLoading.accountExecutives}
                    error={dropdownErrors.accountExecutives}
                    required={true}
                    searchPlaceholder="Search account executive..."
                  />
                </div>

                {/* Branch/Location */}
                <div className="space-y-2">
                  <SearchableDropdown
                    options={branches}
                    value={formData.branchId}
                    onChange={(value) => handleInputChange("branchId", value)}
                    placeholder="Select Branch/Location"
                    label="Branch/Location"
                    loading={dropdownLoading.branches}
                    error={dropdownErrors.branches}
                    required={true}
                    searchPlaceholder="Search branch..."
                  />
                </div>

                {/* Business Source */}
                <div className="space-y-2">
                  <SearchableDropdown
                    options={businessSources}
                    value={formData.businessSource}
                    onChange={(value) => handleInputChange("businessSource", value)}
                    placeholder="Select Business Source"
                    label="Business Source"
                    loading={dropdownLoading.businessSources}
                    error={dropdownErrors.businessSources}
                    required={true}
                    searchPlaceholder="Search business source..."
                  />
                </div>

                {/* Bus Channels */}
                <div className="space-y-2">
                  <SearchableDropdown
                    options={busChannels}
                    value={formData.busChannelId}
                    onChange={(value) => handleInputChange("busChannelId", value)}
                    placeholder="Select Bus Channel"
                    label="Bus Channels"
                    loading={dropdownLoading.busChannels}
                    error={dropdownErrors.busChannels}
                    required={true}
                    searchPlaceholder="Search bus channel..."
                  />
                </div>

                {/* Account Types */}
                <div className="space-y-2">
                  <SearchableDropdown
                    options={accountTypes}
                    value={formData.accountTypeId}
                    onChange={(value) => handleInputChange("accountTypeId", value)}
                    placeholder="Select Account Type"
                    label="Account Types"
                    loading={dropdownLoading.accountTypes}
                    error={dropdownErrors.accountTypes}
                    required={true}
                    searchPlaceholder="Search account type..."
                  />
                </div>

                {/* Cover Day */}
                <div className="space-y-2">
                  <Label htmlFor="coverDay" className="text-sm font-medium">
                    Cover Day
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="coverDay"
                      value={formData.coverDay}
                      onChange={(e) => handleInputChange("coverDay", e.target.value)}
                    />
                    <Button
                      type="button"
                      onClick={handleGetCoverDay}
                      className="bg-primary hover:bg-primary/80 text-white whitespace-nowrap"
                    >
                      Get Cover Day
                    </Button>
                  </div>
                </div>

                {/* Quotation Status */}
                <div className="space-y-2">
                  <Label htmlFor="quotationStatus" className="text-sm font-medium">
                    Scheme Status
                  </Label>
                  <Select
                    value={formData.quotationStatus}
                    onValueChange={(value) => handleInputChange("quotationStatus", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="PROSPECT" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROSPECT">PROSPECT</SelectItem>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="PENDING">PENDING</SelectItem>
                      <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-4 bg-transparent p-6 rounded-xl">
          <Button
            type="button"
            onClick={handleCancel}
            variant="outline"
            className="px-8 bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleComputePreview}
            disabled={!members?.length}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Recompute
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white px-8"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 lg:p-6 space-y-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="mb-4 bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Schemes
            </Button>

            <div className="mb-6">
              <h1 className="text-2xl font-semibold">
                Edit Group Life Scheme
              </h1>
              {loading.detail ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  Loading Scheme...
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  Policy Number: {formData.policyNo || formData.quotationNumber}
                </p>
              )}
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="relative">
                <TabsList className="w-full justify-start border-b bg-transparent p-0 h-auto gap-25 overflow-x-auto scrollbar-hide flex-nowrap">
                  <TabsTrigger 
                    value="policy" 
                    className={`
                      px-3 sm:px-4 py-2.5 sm:py-3 
                      text-xs sm:text-sm font-medium 
                      text-gray-600 hover:text-gray-900 hover:bg-blue-50/50 
                      data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 
                      data-[state=active]:bg-transparent rounded-none 
                      transition-all duration-200 whitespace-nowrap
                      flex-shrink-0 min-w-[80px] sm:min-w-0
                    `}
                  >
                   
                    <span className="flex items-center gap-1.5 sm:gap-2">
                       <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">Policy Detail</span>
                      <span className="xs:hidden">Policy Detail</span>
                    </span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="group-life" 
                    className={`
                      px-3 sm:px-4 py-2.5 sm:py-3 
                      text-xs sm:text-sm font-medium 
                      text-gray-600 hover:text-gray-900 hover:bg-blue-50/50 
                      data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 
                      data-[state=active]:bg-transparent rounded-none 
                      transition-all duration-200 whitespace-nowrap
                      flex-shrink-0 min-w-[80px] sm:min-w-0
                    `}
                  >
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">Group Life Detail</span>
                      <span className="xs:hidden">Group Life Detail</span>
                    </span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="debit-note" 
                    className={`
                      px-3 sm:px-4 py-2.5 sm:py-3 
                      text-xs sm:text-sm font-medium 
                      text-gray-600 hover:text-gray-900 hover:bg-blue-50/50 
                      data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 
                      data-[state=active]:bg-transparent rounded-none 
                      transition-all duration-200 whitespace-nowrap
                      flex-shrink-0 min-w-[80px] sm:min-w-0
                    `}
                  >
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">Debit Note</span>
                      <span className="xs:hidden">Debit Note</span>
                    </span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="credit-note" 
                    className={`
                      px-3 sm:px-4 py-2.5 sm:py-3 
                      text-xs sm:text-sm font-medium 
                      text-gray-600 hover:text-gray-900 hover:bg-blue-50/50 
                      data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 
                      data-[state=active]:bg-transparent rounded-none 
                      transition-all duration-200 whitespace-nowrap
                      flex-shrink-0 min-w-[80px] sm:min-w-0
                    `}
                  >
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Co-Insurance (Credit Note)</span>
                      <span className=" hidden xs:hidden">Credit Note</span>
           
                    </span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="attachments" 
                    className={`
                      px-3 sm:px-4 py-2.5 sm:py-3 
                      text-xs sm:text-sm font-medium 
                      text-gray-600 hover:text-gray-900 hover:bg-blue-50/50 
                      data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 
                      data-[state=active]:bg-transparent rounded-none 
                      transition-all duration-200 whitespace-nowrap
                      flex-shrink-0 min-w-[80px] sm:min-w-0
                    `}
                  >
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">Attachments</span>
                      <span className="xs:hidden">Files</span>
                    </span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="mt-4 sm:mt-6">
                <TabsContent value="policy" className="mt-0">
                  {renderPolicyDetails()}
                </TabsContent>

                <TabsContent value="group-life" className="mt-0">
  <GroupLifeDetailsTab 
    policyNo={policyNo} 
    formData={formData} 
    members={members}
    setMembers={setMembers}
    sourcePage={sourcePage as "scheme-admin" | "renewals" | "endorsements" | "convert-to-policy" | "convert-to-scheme"}
    onRenew={(item) => {
      // Handle renew action - navigate to renew page or open dialog
      console.log('Renew policy:', item);
      // You can navigate to a renew page or open a modal
      navigate(`/underwriting/group-life-quotations/renew/${encodeURIComponent(item.policyNo)}`);
    }}
    onEndorse={(item) => {
      // Handle endorse action - navigate to endorse page or open dialog
      console.log('Endorse policy:', item);
      // You can navigate to an endorse page or open a modal
      navigate(`/underwriting/group-life-quotations/endorse/${encodeURIComponent(item.policyNo)}`);
    }}
  />
</TabsContent>
<TabsContent value="debit-note" className="mt-0">
  <DebitNoteList policyNo={policyNo} />
</TabsContent>

                <TabsContent value="credit-note" className="mt-0">
                  <CreditNotesTab policyNo={policyNo} />
                </TabsContent>

                <TabsContent value="attachments" className="mt-0">
                  <AttachmentsTab policyNo={policyNo} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditGroupLifeQuotationDetail;