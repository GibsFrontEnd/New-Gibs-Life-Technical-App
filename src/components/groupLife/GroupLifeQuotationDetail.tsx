//@ts-nocheck

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { ArrowLeft, RefreshCw, Loader2, ChevronDown, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/use-apps";
import {
  selectGroupLifeQuotations,
  createGroupLifePolicy,
  setCurrentQuotation,
  addMemberToCurrentQuotation,
  updateMemberInCurrentQuotation,
  removeMemberFromCurrentQuotation,
  clearCurrentQuotation,
  setMembersForCurrentQuotation,
  setComputedTotalsForCurrentQuotation,
  parseExcelMembers,
  computeMemberPremium,
} from "../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";
import type { GroupLifeMember } from "../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";

import { useToast } from "../UI/use-toast";
import { debounce } from "lodash";
import { SERVER_URL } from "../../utils/constants";

// ==================== TYPES ====================

interface GroupLifeExtensionRow {
  itemNo: number;
  description: string;
  rate: string;
  itemValue: string;
}

interface CompleteQuotationFormData {
  quotationNumber: string;
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
          className={`flex items-center justify-between border rounded-md px-3 py-2 cursor-pointer ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'
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
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-0 ${option.id === value ? 'bg-blue-50' : ''
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

const GroupLifeQuotationDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { currentQuotation, loading } = useAppSelector(selectGroupLifeQuotations);
  const { toast } = useToast();

  // State for exchange rate
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  // State for dropdown options - all from API only
  const [accountExecutives, setAccountExecutives] = useState<ApiDropdownOption[]>([]);
  const [branches, setBranches] = useState<ApiDropdownOption[]>([]);
  const [businessSources, setBusinessSources] = useState<ApiDropdownOption[]>([]);
  const [agentBrokers, setAgentBrokers] = useState<ApiDropdownOption[]>([]);
  const [accountTypes, setAccountTypes] = useState<ApiDropdownOption[]>([]);
  const [busChannels, setBusChannels] = useState<ApiDropdownOption[]>([]);
  const [businessSectors, setBusinessSectors] = useState<ApiDropdownOption[]>([]);
  const [products, setProducts] = useState<ApiDropdownOption[]>([]);
  const [insuredTypes, setInsuredTypes] = useState<ApiDropdownOption[]>([]);
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
    insuredTypes: true,
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
    insuredTypes: false,
    rateTypes: false,
  });

  const isNewQuotation = location.pathname === "/underwriting/group-life-quotations/new";

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

  // Fetch all dropdown data
  const fetchAllDropdowns = async () => {
    const endpoints = [
      {
        key: 'products',
        url: '/v1/Products',
        params: { PageNo: 1, PageSize: 100 },
        mapper: (item: any) => ({
          id: item.productID || item.riskID || item.id,
          name: item.productName || item.description || item.name,
          code: item.productID || item.code,
          ...item
        })
      },
      {
        key: 'accountExecutives',
        url: '/lookups/account-executives',
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
        url: '/grouplife/policies/policy-business-types',
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
      // {
      //   key: 'rateTypes',
      //   url: '/lookups/premium-rate',
      //   mapper: (item: any) => ({
      //     id: item.id || item.rateId || item.rateTypeId,
      //     name: item.name || item.rateName || item.description,
      //     value: item.rateValue || item.value || item.rate,
      //     code: item.code || item.rateCode,
      //     ...item
      //   })
      // },
    ];

    setDropdownLoading(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    const promises = endpoints.map(async ({ key, url, params, mapper }) => {
      try {
        const rawData = await fetchDropdownData(url, params);
        const formattedData = rawData.map((item: any) => mapper(item));

        switch (key) {
          case 'products': setProducts(formattedData); break;
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
  };

  useEffect(() => {
    if (isNewQuotation) {
      fetchAllDropdowns();
    }
  }, [isNewQuotation]);

  useEffect(() => {
    if (!isNewQuotation) {
      console.warn("⚠️ This component is only for creating new quotations. Redirecting...");
      navigate("/underwriting/group-life-quotations");
      return;
    }

    dispatch(
      setCurrentQuotation({
        quotationNumber: "TEMP",
        members: [],
        totalMembers: 0,
        totalSumInsured: 0,
        totalPremium: 0,
        status: "PROSPECT",
        policyNo: `GL-${Date.now()}`,
      } as any)
    );

    return () => {
      dispatch(clearCurrentQuotation());
    };
  }, [dispatch, isNewQuotation, navigate]);

  // Initialize form with defaults
  const [formData, setFormData] = useState<CompleteQuotationFormData>({
    quotationNumber: "[AUTO]",
    transactionDate: new Date().toISOString().split("T")[0],
    effectiveDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split("T")[0],
    coverDay: "0.00",
    clientName: "",
    groupFactorAmount: "1000",
    insuredType: "company",
    schemeTypes: "",
    groupLifeFactor: "2",
    rateType: "PRAN RATE",
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
    memberQuotation: true,
    memberDetails: true,
    extensionDetails: false,
    quotationStatus: true,
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

  const handleAddMember = (member: Omit<GroupLifeMember, "id">) => {
    const newMember: GroupLifeMember = {
      ...member,
      id: `temp-${Date.now()}`,
    };
    dispatch(addMemberToCurrentQuotation(newMember));
  };

  const handleUpdateMember = (index: number, member: GroupLifeMember) => {
    dispatch(updateMemberInCurrentQuotation({ index, member }));
  };

  const handleDeleteMember = (index: number) => {
    dispatch(removeMemberFromCurrentQuotation(index));
  };

  const handleGetCoverDay = () => {
    const effective = new Date(formData.effectiveDate);
    const expiry = new Date(formData.expiryDate);
    const diffTime = Math.abs(expiry.getTime() - effective.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setFormData((prev) => ({ ...prev, coverDay: diffDays.toString() }));
  };

  const handleCancel = () => {
    navigate("/underwriting/group-life-quotations");
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

    if (missingFields.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Get subRiskId from selected product
    const selectedProduct = products.find(p => p.id === formData.product);
    const subRiskId = selectedProduct?.code || (formData.product === "credit-life" ? "CR-001" : "GL-001");

    // Get premium rate from selected rate type
    const selectedRateType = rateTypes.find(r => r.id === formData.rateType);
    const premiumRatePercent = selectedRateType?.value || 2.0;

    const quotationData = {
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
      insuredId: selectedClientId,
      accountTypeId: formData.accountTypeId,
      busChannelId: formData.busChannelId,
      subChannelId: formData.subChannelId,
      proportionPercent: formData.proportionPercent || 100,
      premiumRatePercent: premiumRatePercent,
      currencyName: formData.currency || "NGN",
      exchangeRate: formData.exRate || 1,
    };

    try {
      const result = await dispatch(createGroupLifePolicy(quotationData)).unwrap();
      toast({
        title: "Success",
        description: `Scheme created successfully with Policy No: ${result.policyNo}`,
        variant: "default",
      });
      navigate("/underwriting/group-life-quotations");
    } catch (err: any) {
      console.error("❌ Save error:", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to save quotation.",
        variant: "destructive",
      });
    }
  };

  const [uploading, setUploading] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [validating, setValidating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadedMembersRaw, setUploadedMembersRaw] = useState<any[] | null>(null);

  const downloadTemplate = async (format: "csv" | "excel") => {
    try {
      const headers = [
        "StaffNo",
        "EmployeeName",
        "Sex",
        "DateOfBirth",
        "BasicSalary",
        "HousingAllowance",
        "TransportAllowance",
        "HireDate"
      ];

      const csvContent = headers.join(",") + "\n" +
        "EMP001,John Doe,M,1990-01-15,100000,50000,30000,2020-01-01\n" +
        "EMP002,Jane Smith,F,1985-06-20,120000,60000,35000,2019-03-15";

      const blob = new Blob([csvContent], { type: format === "csv" ? "text/csv" : "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "csv" ? "group-members-template.csv" : "group-members-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Template downloaded",
        description: `Template downloaded as ${format.toUpperCase()}`,
      });
    } catch (e: any) {
      toast({
        title: "Download failed",
        description: e?.message ?? "Unable to download template",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file",
        description: "Select a CSV or Excel file",
        variant: "destructive",
      });
      return;
    }
    if (validationErrors.length) {
      toast({
        title: "Fix validation errors",
        description: "Re-validate after fixing file",
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      const parseResult = await dispatch(parseExcelMembers(selectedFile)).unwrap();

      if (parseResult.members) {
        setUploadedMembersRaw(parseResult.members);

        const mapped = parseResult.members.map((m: any) => ({
          id: `temp-${m.staffNo || Math.random().toString(36).slice(2)}`,
          employeeNames: m.employeeNames || m.name || "Unknown",
          sex: m.sex ?? "M",
          dateOfBirth: m.dateOfBirth || new Date().toISOString().split('T')[0],
          anb: 0,
          totalEmolument: (m.basicSalary || 0) + (m.housingAllowance || 0) + (m.transportAllowance || 0),
          sumInsured: 0,
          premium: 0,
          rate: 0,
          staffNo: m.staffNo || "",
          basicSalary: m.basicSalary || 0,
          housingAllowance: m.housingAllowance || 0,
          transportAllowance: m.transportAllowance || 0,
          hireDate: m.hireDate || "",
        }));

        dispatch(setMembersForCurrentQuotation(mapped));

        toast({
          title: "Members uploaded",
          description: `Imported ${parseResult.members.length} member(s)`,
        });
      } else {
        toast({
          title: "Upload error",
          description: "No members found in the file",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Upload error",
        description: e?.message ?? "Unable to upload members",
        variant: "destructive",
      });
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleComputePreview = async () => {
    if (!currentQuotation) {
      toast({
        title: "No quotation",
        description: "Fill quotation header details first",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Preview ready",
      description: "Quotation details look good.",
    });
  };

  const handleFileSelect = async (file: File | null) => {
    if (!file) {
      setValidationErrors([]);
      setUploadedMembersRaw(null);
      return;
    }
    setSelectedFile(file);
    setValidating(true);
    setValidationErrors([]);

    try {
      if (file.size === 0) {
        setValidationErrors(["File is empty"]);
        toast({
          title: "Validation Failed",
          description: "File is empty",
          variant: "destructive",
        });
      } else {
        toast({
          title: "File Selected",
          description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: error?.message || "An error occurred during validation.",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showTemplateDropdown && !(event.target as HTMLElement).closest('.relative')) {
        setShowTemplateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTemplateDropdown]);

  if (!isNewQuotation) {
    return null;
  }

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
                New Group Life Scheme
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create a new group life insurance scheme
              </p>
            </div>

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
                        value={formData.quotationNumber}
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

                    {/* Agent/Broker - Searchable Dropdown */}
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
                            <SelectItem value="NGN"> NGN </SelectItem>
                            <SelectItem value="USD">USD </SelectItem>
                            <SelectItem value="EUR">EUR </SelectItem>
                            <SelectItem value="GBP">GBP </SelectItem>

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

                    {/* Product - Searchable Dropdown */}
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

                    {/* Account Executive - Searchable Dropdown */}
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

                    {/* Branch/Location - Searchable Dropdown */}
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

                    {/* Business Source - Searchable Dropdown */}
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

                    {/* Bus Channels - Searchable Dropdown */}
                    <div className="space-y-2">
                      <SearchableDropdown
                        options={busChannels}
                        value={formData.busChannelId}
                        onChange={(value) => handleInputChange("busChannelId", value)}
                        placeholder="Select Business Channel"
                        label="Business Channels"
                        loading={dropdownLoading.busChannels}
                        error={dropdownErrors.busChannels}
                        required={true}
                        searchPlaceholder="Search business channel..."
                      />
                    </div>

                    {/* Account Types - Searchable Dropdown */}
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
                        Quotation Status
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

            {/* Extension Details Section */}
            <div className="border rounded-lg shadow-sm mb-4">
              <button
                type="button"
                onClick={() => toggleSection("extensionDetails")}
                className="w-full flex items-center gap-2 px-6 py-4 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <span className="font-semibold">Group Life Extension Details</span>
              </button>
              {expandedSections.extensionDetails && (
                <div className="p-6">
                  <p className="text-sm text-gray-500">No extension details available.</p>
                </div>
              )}
            </div>

            {/* Scheme Status Section */}
            <div className="border rounded-lg shadow-sm mb-4">
              <button
                type="button"
                onClick={() => toggleSection("quotationStatus")}
                className="w-full flex items-center gap-2 px-6 py-4 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <span className="font-semibold">Scheme Status</span>
              </button>
              {expandedSections.quotationStatus && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="totalSumInsured" className="text-sm font-medium">
                        Total Sum Insured:
                      </Label>
                      <Input
                        id="totalSumInsured"
                        value={formData.totalSumInsured}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalPremium" className="text-sm font-medium">
                        Total Premium:
                      </Label>
                      <Input
                        id="totalPremium"
                        value={formData.totalPremium}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="loadingPercent" className="text-sm font-medium">
                        Loading %:
                      </Label>
                      <Input
                        id="loadingPercent"
                        value={formData.loadingPercent}
                        onChange={(e) => handleInputChange("loadingPercent", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reductionPercent" className="text-sm font-medium">
                        Reduction %:
                      </Label>
                      <Input
                        id="reductionPercent"
                        value={formData.reductionPercent}
                        onChange={(e) => handleInputChange("reductionPercent", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="netPremiumDue" className="text-sm font-medium">
                        Net Premium Due:
                      </Label>
                      <Input
                        id="netPremiumDue"
                        value={formData.netPremiumDue}
                        readOnly
                        className="bg-gray-50"
                      />
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
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Preview (Compute)
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
                disabled={loading.create || loading.update}
              >
                {loading.create || loading.update ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupLifeQuotationDetail;