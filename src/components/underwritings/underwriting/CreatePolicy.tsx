//@ts-nocheck
import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"
import type { RootState } from "../../../features/store"
import {
  createPolicy,
  clearMessages,
} from "../../../features/reducers/underwriteReducers/underwritingSlice"
import { getAllRisks } from "../../../features/reducers/adminReducers/riskSlice"
import { getAllBranches } from "../../../features/reducers/companyReducers/branchSlice"
import { getAllAgents } from "../../../features/reducers/csuReducers/agentSlice"
import { getAllCustomers } from "../../../features/reducers/csuReducers/customerSlice"
import { fetchMktStaffs, selectMarketingStaff } from "../../../features/reducers/companyReducers/marketingStaffSlice"
import { useAppSelector } from "../../../hooks/use-apps"

import { Button } from "../../ui/new-button"
import Input from "../../ui/Input"
import { Label } from "../../ui/label"
import type { CreatePolicyRequest } from "../../../types/underwriting"
import "./CreatePolicy.css"
import { useToast } from "../../ui/use-toast"
import { SERVER_URL } from "../../../utils/constants"
import { ChevronDown, X, Loader2 } from "lucide-react"

// ==================== TYPES ====================

interface ApiDropdownOption {
  id: string;
  name: string;
  code?: string;
  value?: string;
  label?: string;
  [key: string]: any;
}

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
   showRiskInfo?: boolean;
}

// ==================== RISK ID MAPPING ====================

// Map businessId to risk ID - using actual IDs from your system
const RISK_ID_MAP: Record<string, string> = {
  'F': 'F',      // Fire
  'V': 'V',      // Motor
  'PP': 'PP',    // Package
  'B': 'B',      // Investment/Bond
  'GL': 'GL',    // Group Life
  'CL': 'CL',    // Credit Life
  'C': 'C',      // Riders
  'A': 'A',      // Traditional
}

// Map businessId to display names
const RISK_DISPLAY_NAMES: Record<string, string> = {
  'F': 'Fire',
  'V': 'Motor',
  'PP': 'Package',
  'B': 'Investment',
  'GL': 'Group Life',
  'CL': 'Credit Life',
  'C': 'Riders',
  'A': 'Traditional',
}

// Map businessId to route paths for navigation
const ROUTE_MAP: Record<string, string> = {
  'F': '/underwriting/general-bus/fire',
  'V': '/underwriting/general-bus/motor',
  'PP': '/underwriting/package-bus',
  'B': '/underwriting/general-bus/bond',
  'GL': '/underwriting/general-bus/general-liability',
  'CL': '/underwriting/general-bus/credit-life',
  'C': '/underwriting/general-bus/riders',
  'A': '/underwriting/general-bus/traditional',
}

// ==================== CUSTOMER SEARCH ====================

const tidy = (v: any) => String(v ?? "").replace(/\s+/g, " ").trim()

/**
 * Maps a /v1/Customers/search result (CustomerResult) to the insured fields of the form.
 * For individuals the API puts the surname in lastName and the remaining names in otherName
 * (its firstName is derived from the full name and unreliable), so first/other names are
 * split from otherName.
 */
const toCustomerOption = (c: any) => {
  const isOrg = !!c.isOrg
  const surname = isOrg ? tidy(c.orgName || c.lastName) : tidy(c.lastName)
  const [firstName = "", ...rest] = tidy(c.otherName || c.firstName).split(" ").filter(Boolean)
  const name = isOrg ? surname : tidy(`${surname} ${[firstName, ...rest].join(" ")}`)
  return {
    id: c.customerID,
    insuredID: c.customerID,
    isOrg,
    name: name || c.customerID,
    surname,
    firstName: isOrg ? "" : firstName,
    otherNames: isOrg ? "" : rest.join(" "),
    address: tidy(c.address),
    phone: tidy(c.phoneLine1 || c.phoneLine2),
    email: tidy(c.email),
  }
}

// ==================== SEARCHABLE DROPDOWN COMPONENT ====================

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
  showRiskInfo = false
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

// ==================== MAIN COMPONENT ====================

const CreatePolicy = () => {
  const { toast } = useToast()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const errorRef = useRef<HTMLDivElement | null>(null)
  const { businessId: businessIdParam } = useParams<{ businessId?: string }>()
  
  // 🔥 Get the businessId from the URL parameter
  const businessId = businessIdParam ?? null

  const [isFetchingRate, setIsFetchingRate] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isRiskLocked, setIsRiskLocked] = useState(false)

  // ==================== REDUX SELECTORS ====================
  
  const underwritingState = useSelector((state: RootState) => state.underwritings || {})
  const {
    loading = { createPolicy: false },
    success = { createPolicy: false },
    error = { createPolicy: null },
    currentPolicy = null,
  } = underwritingState

  const { risks = [] } = useSelector((state: RootState) => state.risks || {})
  const { branches = [] } = useSelector((state: RootState) => state.branches || {})
  const { customers = [] } = useSelector((state: RootState) => state.customers || {})
  const { agents = [] } = useSelector((state: RootState) => state.parties || {})
  const { mktStaffs = [] } = useAppSelector(selectMarketingStaff) || {}

  // ==================== DROPDOWN STATE (Local) ====================
  
  const [riskClass, setRiskClass] = useState("")
  const [insuredType, setInsuredType] = useState<"individual" | "corporate">("individual")
  const [customerSearch, setCustomerSearch] = useState<string>("")
  // Existing customer the policy is linked to (null = a new customer is created from the form)
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Dropdown options states
  const [riskOptions, setRiskOptions] = useState<ApiDropdownOption[]>([])
  const [productOptions, setProductOptions] = useState<ApiDropdownOption[]>([])
  const [branchOptions, setBranchOptions] = useState<ApiDropdownOption[]>([])
  const [agentOptions, setAgentOptions] = useState<ApiDropdownOption[]>([])
  const [mktStaffOptions, setMktStaffOptions] = useState<ApiDropdownOption[]>([])
  const [customerOptions, setCustomerOptions] = useState<ApiDropdownOption[]>([])
  const [businessTypeOptions, setBusinessTypeOptions] = useState<ApiDropdownOption[]>([])
  const [accountTypeOptions, setAccountTypeOptions] = useState<ApiDropdownOption[]>([])
  const [busChannelOptions, setBusChannelOptions] = useState<ApiDropdownOption[]>([])
  const [subChannelOptions, setSubChannelOptions] = useState<ApiDropdownOption[]>([])
  const [occupationOptions, setOccupationOptions] = useState<ApiDropdownOption[]>([])
  const [bizSourceOptions, setBizSourceOptions] = useState<ApiDropdownOption[]>([])

  // Loading states for dropdowns
  const [dropdownLoading, setDropdownLoading] = useState({
    risks: true,
    products: true,
    branches: true,
    agents: true,
    mktStaffs: true,
    customers: true,
    businessTypes: true,
    accountTypes: true,
    busChannels: true,
    subChannels: true,
    occupations: true,
    bizSources: true,
  })

  // Error states for dropdowns
  const [dropdownErrors, setDropdownErrors] = useState({
    risks: false,
    products: false,
    branches: false,
    agents: false,
    mktStaffs: false,
    customers: false,
    businessTypes: false,
    accountTypes: false,
    busChannels: false,
    subChannels: false,
    occupations: false,
    bizSources: false,
  })

  // ==================== FORM DATA ====================

  const [formData, setFormData] = useState<CreatePolicyRequest>({
    productID: "",
    subriskID: "",
    branchID: "",
    insuredID: "",
    partyID: "",
    mktStaffID: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: (() => {
      const d = new Date()
      d.setFullYear(d.getFullYear() + 1)
      return d.toISOString().split('T')[0]
    })(),
    insAddress: "",
    insMobilePhone: "",
    insEmail: "",
    insOccupation: "",
    bizSource: "",
    proportionRate: 100,
    currency: "NGN",
    exRate: 1,
    surname: "",
    firstName: "",
    otherNames: "",
    isOrg: false,
    remarks: "",
    businessType: "",
    accountType: "",
    busChannel: "",
    subChannel: "",
    riskClassification: "",
    riskLocation: ""
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Currency options
  const currencyOptions = [
    { value: "NGN", label: "₦ NGN - Nigerian Naira", symbol: "₦" },
    { value: "USD", label: "$ USD - US Dollar", symbol: "$" },
    { value: "EUR", label: "€ EUR - Euro", symbol: "€" },
    { value: "GBP", label: "£ GBP - British Pound", symbol: "£" },
    { value: "CAD", label: "C$ CAD - Canadian Dollar", symbol: "C$" },
    { value: "AUD", label: "A$ AUD - Australian Dollar", symbol: "A$" },
    { value: "JPY", label: "¥ JPY - Japanese Yen", symbol: "¥" },
    { value: "CNY", label: "¥ CNY - Chinese Yuan", symbol: "¥" },
    { value: "ZAR", label: "R ZAR - South African Rand", symbol: "R" }
  ]

  // ==================== FETCH DROPDOWN DATA ====================

  const fetchDropdownData = async (endpoint: string, params?: Record<string, any>): Promise<ApiDropdownOption[]> => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token")

      let url = `${SERVER_URL}${endpoint}`
      if (params) {
        const queryParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString())
          }
        })
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`
        }
      }

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (Array.isArray(data)) return data
      if (data.data) return data.data
      if (data.items) return data.items
      if (data.records) return data.records
      if (data.results) return data.results
      return []
    } catch (error) {
      console.error(`Error fetching from ${endpoint}:`, error)
      throw error
    }
  }

  // ==================== FETCH ALL DROPDOWNS ====================

  const fetchAllDropdowns = async () => {
    const endpoints = [
      {
        key: 'risks',
        url: '/v1/Risks/List',
        params: { PageNo: 1, PageSize: 100 },
        mapper: (item: any) => ({
          id: item.riskID || item.id,
          name: item.riskName || item.name || item.description,
          code: item.riskID || item.code,
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
        key: 'agents',
        url: '/v1/Agents',
        params: { PageNo: 1, PageSize: 100 },
        mapper: (item: any) => ({
          id: item.agentID || item.id,
          name: item.agent || item.name || item.fullName,
          code: item.agentID || item.code,
          phone: item.phone1,
          email: item.email,
          ...item
        })
      },
      {
        key: 'mktStaffs',
        url: '/MktStaffs',
        mapper: (item: any) => ({
          id: item.mktStaffID || item.id,
          name: item.staffName || item.name || item.fullName,
          code: item.mktStaffID || item.code,
          ...item
        })
      },
      {
        key: 'occupations',
        url: '/PolicyAdmin/occupations',
        mapper: (item: any) => {
          // The deployed API returns each row stringified: "{ Occupation = ACCOUNTANT, Description = , Tag =  }"
          if (typeof item === "string") {
            const occupation = (item.match(/Occupation = (.*?),/)?.[1] || "").trim()
            const description = (item.match(/Description = (.*?),/)?.[1] || "").trim()
            return { id: occupation, name: description || occupation, code: occupation }
          }
          return {
            ...item,
            id: item.occupation || item.id,
            name: item.description || item.occupation || item.name,
            code: item.occupation || item.code,
          }
        }
      },
      {
        key: 'accountTypes',
        url: '/lookups/account-types',
        mapper: (item: any) => ({
          id: item.value || item.id,
          name: item.text || item.name || item.label,
          code: item.value || item.code,
          ...item
        })
      },
      {
        key: 'busChannels',
        url: '/lookups/channels',
        mapper: (item: any) => ({
          id: item.value || item.id,
          name: item.text || item.name || item.label,
          code: item.value || item.code,
          ...item
        })
      },
      {
        key: 'bizSources',
        url: '/lookups/business-sources',
        mapper: (item: any) => ({
          id: item.value || item.id,
          name: item.text || item.name || item.label,
          code: item.value || item.code,
          ...item
        })
      },
    ]

    setDropdownLoading(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: true }), {}))

    const promises = endpoints.map(async ({ key, url, params, mapper }) => {
      try {
        const rawData = await fetchDropdownData(url, params)
        const formattedData = rawData.map((item: any) => mapper(item))

        switch (key) {
          case 'risks': setRiskOptions(formattedData); break
          case 'branches': setBranchOptions(formattedData); break
          case 'agents': setAgentOptions(formattedData); break
          case 'mktStaffs': setMktStaffOptions(formattedData); break
          case 'customers': setCustomerOptions(formattedData); break
          case 'businessTypes': setBusinessTypeOptions(formattedData); break
          case 'accountTypes': setAccountTypeOptions(formattedData); break
          case 'busChannels': setBusChannelOptions(formattedData); break
          case 'subChannels': setSubChannelOptions(formattedData); break
          case 'occupations': setOccupationOptions(formattedData); break
          case 'bizSources': setBizSourceOptions(formattedData); break
        }

        setDropdownLoading(prev => ({ ...prev, [key]: false }))
        setDropdownErrors(prev => ({ ...prev, [key]: false }))
      } catch (error) {
        console.error(`Failed to fetch ${key}:`, error)
        setDropdownLoading(prev => ({ ...prev, [key]: false }))
        setDropdownErrors(prev => ({ ...prev, [key]: true }))
      }
    })

    await Promise.all(promises)
  }

  // ==================== FETCH PRODUCTS (FILTERED BY RISK) ====================

  const fetchProducts = async (riskId: string) => {
    if (!riskId) {
      setProductOptions([])
      return
    }

    try {
      setDropdownLoading(prev => ({ ...prev, products: true }))
      
      const rawData = await fetchDropdownData('/v1/Products', {
        PageNo: 1,
        PageSize: 100,
      })

      const filteredData = rawData
        .filter((item: any) => item.riskID === riskId)
        .map((item: any) => ({
          id: item.productID || item.id,
          name: item.productName || item.description || item.name,
          code: item.productID,
          riskID: item.riskID,
          productType: item.productType,
          description: item.description,
          ...item
        }))

      setProductOptions(filteredData)
      setDropdownLoading(prev => ({ ...prev, products: false }))
      setDropdownErrors(prev => ({ ...prev, products: false }))
      
      if (filteredData.length === 0) {
        toast({
          description: `No products available for this risk. Please check the configuration.`,
          variant: "warning",
          duration: 3000,
        })
      }
      
    } catch (error) {
      console.error("Failed to fetch products:", error)
      setDropdownLoading(prev => ({ ...prev, products: false }))
      setDropdownErrors(prev => ({ ...prev, products: true }))
      toast({
        description: "Failed to load products. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  // ==================== EFFECTS ====================

  // 🔥 CRITICAL: Handle businessId from URL and map to risk ID
  useEffect(() => {
    if (businessId && businessId !== "All" && businessId !== undefined && businessId !== "null" && businessId !== "") {
      // Check if this businessId has a mapped risk ID
      const mappedRiskId = RISK_ID_MAP[businessId]
      
      if (mappedRiskId) {
        // We have a mapped risk ID - use it directly
        console.log(`🔒 Business category locked to: ${RISK_DISPLAY_NAMES[businessId] || businessId} (${mappedRiskId})`)
        setRiskClass(mappedRiskId)
        setIsRiskLocked(true)
        // Also update form data
        handleInputChange("riskClassification", mappedRiskId)
      } else {
        // No mapping found - try to find the risk by name
        const displayName = RISK_DISPLAY_NAMES[businessId] || businessId
        console.log(`🔍 Looking for risk: ${displayName}`)
        
        // Wait for risk options to load, then find the matching risk
        const findRiskByName = () => {
          const foundRisk = riskOptions.find(risk => 
            risk.name?.toLowerCase().includes(displayName.toLowerCase()) ||
            risk.code?.toLowerCase() === businessId.toLowerCase() ||
            risk.id?.toLowerCase() === businessId.toLowerCase()
          )
          
          if (foundRisk) {
            console.log(`✅ Found matching risk: ${foundRisk.name} (${foundRisk.id})`)
            setRiskClass(foundRisk.id)
            setIsRiskLocked(true)
            handleInputChange("riskClassification", foundRisk.id)
          } else {
            console.warn(`⚠️ No matching risk found for: ${displayName}`)
            // Don't lock - let user select manually
            setIsRiskLocked(false)
          }
        }
        
        // If risk options are already loaded, find immediately
        if (riskOptions.length > 0) {
          findRiskByName()
        }
      }
    } else {
      // No businessId - user can select any risk
      setIsRiskLocked(false)
    }
  }, [businessId, riskOptions]) // Re-run when riskOptions load

  useEffect(() => {
    fetchAllDropdowns()
  }, [])

  useEffect(() => {
    if (riskClass) {
      fetchProducts(riskClass)
    } else {
      setProductOptions([])
    }
  }, [riskClass])

  // Existing-customer search. /v1/Customers/search matches on SearchText; the plain
  // /v1/Customers list ignores search and type and only returns the newest page.
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
      searchDebounceRef.current = null
    }

    const trimmed = (customerSearch ?? "").trim()
    if (trimmed.length < 2) {
      setCustomerOptions([])
      return
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        setDropdownLoading(prev => ({ ...prev, customers: true }))

        const rawData = await fetchDropdownData('/v1/Customers/search', {
          SearchText: trimmed,
          PageNo: 1,
          PageSize: 20,
        })

        const wantOrg = insuredType === "corporate"
        const formattedData = rawData
          .map(toCustomerOption)
          // same kind as the toggle, and skip the "User" placeholders old policies created
          .filter((c: any) => !!c.isOrg === wantOrg && !(c.name === "User" && !c.email && !c.phone))

        setCustomerOptions(formattedData)
        setDropdownLoading(prev => ({ ...prev, customers: false }))
        setDropdownErrors(prev => ({ ...prev, customers: false }))
      } catch (error) {
        console.error("Failed to search customers:", error)
        setCustomerOptions([])
        setDropdownLoading(prev => ({ ...prev, customers: false }))
        setDropdownErrors(prev => ({ ...prev, customers: true }))
      }
    }, 400)

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
        searchDebounceRef.current = null
      }
    }
  }, [customerSearch, insuredType])

  useEffect(() => {
    if (success.createPolicy && currentPolicy?.proposalNo) {
      toast({
        description: (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                Policy Created Successfully! ✅
              </p>
              {currentPolicy?.proposalNo && (
                <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                  Policy Number: <span className="font-mono font-semibold">{currentPolicy.proposalNo}</span>
                </p>
              )}
            </div>
          </div>
        ),
        duration: 4000,
        variant: "success",
        className: "border-l-4 border-green-500 shadow-lg",
      })

      setIsSuccess(true)
      setIsSubmitting(false)

      setTimeout(() => {
        dispatch(clearMessages())
        navigate(-1)
      }, 1500)
    }
  }, [success.createPolicy, currentPolicy, navigate, dispatch, toast])

  useEffect(() => {
    if (error.createPolicy) {
      toast({
        variant: "destructive",
        title: "Error Creating Policy ❌",
        description: typeof error.createPolicy === "string" 
          ? error.createPolicy 
          : error.createPolicy?.message || "Failed to create policy. Please try again.",
        duration: 5000,
        className: "border-l-4 border-red-500",
      })
      setIsSubmitting(false)
    }
  }, [error.createPolicy, toast])

  // ==================== HANDLERS ====================

  const handleInputChange = (field: keyof CreatePolicyRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (validationErrors.length > 0) setValidationErrors([])
  }

  const handleCurrencyChange = async (currencyValue: string) => {
    setFormData(prev => ({ ...prev, currency: currencyValue }))
    if (currencyValue !== "NGN") {
      await fetchExchangeRate(currencyValue, "NGN")
    } else {
      setFormData(prev => ({ ...prev, exRate: 1 }))
    }
  }

  const fetchExchangeRate = async (fromCurrency: string, toCurrency: string = "NGN") => {
    if (fromCurrency === toCurrency) {
      setFormData(prev => ({ ...prev, exRate: 1 }))
      return
    }
  
    setIsFetchingRate(true)
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch exchange rate")
      }
      
      const data = await response.json()
      const rate = data.rates?.[toCurrency]
      
      if (rate) {
        setFormData(prev => ({ ...prev, exRate: rate }))
        toast({
          description: `Exchange rate updated: 1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`,
          duration: 3000,
        })
      } else {
        throw new Error("Rate not available")
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error)
      toast({
        description: `Could not fetch live rate. Using approximate rate.`,
        duration: 4000,
        variant: "destructive"
      })
      if (fromCurrency !== "NGN") {
        const fallbackRates: Record<string, number> = {
          USD: 1500,
          EUR: 1600,
          GBP: 1900,
          CAD: 1100,
          AUD: 1000,
          JPY: 10,
          CNY: 210,
          ZAR: 80
        }
        setFormData(prev => ({ ...prev, exRate: fallbackRates[fromCurrency] || 1 }))
      }
    } finally {
      setIsFetchingRate(false)
    }
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.subriskID) errors.push("Subclass/Product is required")
    if (!formData.branchID) errors.push("Branch is required")
    if (!formData.mktStaffID) errors.push("Marketing staff is required")
    if (!formData.busChannel) errors.push("Business Channel is required")

    // Insured: either an existing customer, or enough details to create a new one.
    // (A linked customer's stored details are used by the API as they are.)
    if (!formData.insuredID) {
      if (insuredType === "individual") {
        if (!formData.surname?.trim()) errors.push("Insured surname is required")
        if (!formData.firstName?.trim()) errors.push("Insured first name is required")
      } else if (!formData.surname?.trim()) {
        errors.push("Company name is required")
      }
      if (!formData.insAddress?.trim()) errors.push("Insured address is required")
      if (!formData.insMobilePhone?.trim()) errors.push("Insured mobile phone is required")
      if (!formData.insEmail?.trim()) errors.push("Insured email is required")
      else if (!/^\S+@\S+\.\S+$/.test(formData.insEmail.trim())) errors.push("Insured email is not a valid email address")
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      errors.push("End date must be after start date")
    }

    return errors
  }

  // Link the policy to an existing customer and show their stored details
  const selectCustomer = (c: any) => {
    setSelectedCustomer(c)
    setCustomerSearch("")
    setCustomerOptions([])
    setFormData(prev => ({
      ...prev,
      insuredID: c.insuredID,
      isOrg: c.isOrg,
      surname: c.surname,
      firstName: c.firstName,
      otherNames: c.otherNames,
      insAddress: c.address,
      insMobilePhone: c.phone,
      insEmail: c.email,
    }))
    if (validationErrors.length > 0) setValidationErrors([])
  }

  // Back to creating a new customer from the form
  const clearCustomer = () => {
    setSelectedCustomer(null)
    setFormData(prev => ({
      ...prev,
      insuredID: "",
      surname: "",
      firstName: "",
      otherNames: "",
      insAddress: "",
      insMobilePhone: "",
      insEmail: "",
    }))
  }

  const switchInsuredType = (type: "individual" | "corporate") => {
    if (type === insuredType) return
    setInsuredType(type)
    clearCustomer()
    setCustomerSearch("")
    setCustomerOptions([])
    setFormData(prev => ({ ...prev, isOrg: type === "corporate" }))
  }

  const getDefaultValues = () => {
    const defaultBizSource = bizSourceOptions?.length > 0 
      ? (bizSourceOptions[0]?.id || bizSourceOptions[0]?.value || "DIRECT")
      : "DIRECT"
    
    const defaultBusinessType = businessTypeOptions?.length > 0
      ? (businessTypeOptions[0]?.id || businessTypeOptions[0]?.value || "NEW_BUSINESS")
      : "NEW_BUSINESS"
    
    const defaultAccountType = accountTypeOptions?.length > 0
      ? (accountTypeOptions[0]?.id || accountTypeOptions[0]?.value || "100")
      : "100"
    
    const defaultPartyID = agentOptions?.length > 0 ? agentOptions[0]?.id : ""

    return {
      bizSource: defaultBizSource,
      businessType: defaultBusinessType,
      accountType: defaultAccountType,
      partyID: defaultPartyID
    }
  }

  const handleSubmit = () => {
    const errors = validateForm()
    if (errors.length > 0) {
      setValidationErrors(errors)
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      return
    }

    if (isSubmitting) {
      toast({
        description: "Please wait, creating policy...",
        duration: 2000,
      })
      return
    }

    const defaultValues = getDefaultValues()

    const selectedProduct = productOptions.find(p => p.id === formData.subriskID)
    const riskId = selectedProduct?.riskID || riskClass || businessId || ""

    if (!riskId) {
      toast({
        variant: "destructive",
        title: "Error ❌",
        description: "Please select a valid product before creating a policy.",
        duration: 5000,
      })
      return
    }

    const riskName = riskOptions.find(r => r.id === riskId)?.name || riskId
    const displayName = businessId ? RISK_DISPLAY_NAMES[businessId] || riskName : riskName

    const payload = {
      riskID: riskId,
      riskClass: riskId,
      riskClassification: riskId,
      riskCode: riskId,
      subriskID: formData.subriskID || "",
      branchID: formData.branchID || "",
      partyID: formData.partyID || defaultValues.partyID || "",
      mktStaffID: formData.mktStaffID || "",
      insuredID: formData.insuredID || "",
      // With insuredID the API links the existing customer; otherwise it creates one from these
      surname: (formData.surname || "").trim(),
      firstName: insuredType === "individual" ? (formData.firstName || "").trim() : "",
      otherNames: insuredType === "individual" ? (formData.otherNames || "").trim() : "",
      isOrg: insuredType === "corporate",
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      insAddress: formData.insAddress || "",
      insMobilePhone: formData.insMobilePhone || "",
      insEmail: formData.insEmail || "",
      insOccupation: formData.insOccupation || "",
      bizSource: formData.bizSource || defaultValues.bizSource || "DIRECT",
      businessType: formData.businessType || defaultValues.businessType || "NEW_BUSINESS",
      accountType: formData.accountType || defaultValues.accountType || "STANDARD",
      busChannel: formData.busChannel || "",
      subChannel: formData.subChannel || "",
      proportionRate: formData.proportionRate || 100,
      currency: formData.currency || "NGN",
      exRate: formData.exRate || 1,
    }

    delete payload.productID
    delete payload.remarks
    delete payload.riskLocation

    if (!payload.riskID) {
      toast({
        variant: "destructive",
        title: "Validation Error ❌",
        description: "Risk ID is missing. Please select a valid product.",
        duration: 5000,
      })
      return
    }

    setIsSubmitting(true)

    dispatch(createPolicy(payload) as any)
      .unwrap()
      .then((newPolicy: any) => {
        toast({
          description: (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Policy Created Successfully! ✅
                </p>
                {newPolicy?.proposalNo && (
                  <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                    Policy Number: <span className="font-mono font-semibold">{newPolicy.proposalNo}</span>
                  </p>
                )}
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                  Product: {selectedProduct?.name || formData.subriskID}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Risk: {displayName} ({riskId})
                </p>
              </div>
            </div>
          ),
          duration: 4000,
          variant: "success",
          className: "border-l-4 border-green-500 shadow-lg",
        })

        setIsSuccess(true)
        setIsSubmitting(false)

        setTimeout(() => {
          dispatch(clearMessages())
          
          // Navigate back to the appropriate list page using the route map
          const targetRoute = businessId ? ROUTE_MAP[businessId] : '/underwriting'
          
          if (targetRoute) {
            navigate(targetRoute, { 
              state: { 
                refresh: Date.now(),
                newPolicyNo: newPolicy?.proposalNo 
              } 
            })
          } else {
            navigate(-1)
          }
        }, 1500)
      })
      .catch((err: any) => {
        console.error("❌ Failed to create policy:", err)
        setIsSubmitting(false)
        toast({
          variant: "destructive",
          title: "Error Creating Policy ❌",
          description: typeof err === "string" ? err : err?.message || "Failed to create policy. Please check your inputs and try again.",
          duration: 5000,
          className: "border-l-4 border-red-500",
        })
      })
  }

  const handleCancel = () => {
    const hasChanges = Object.values(formData).some(value => 
      value !== "" && value !== 0 && value !== "NGN" && value !== 100
    )
    
    if (hasChanges && !isSuccess) {
      if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
        navigate(-1)
      }
    } else {
      navigate(-1)
    }
  }

  const isButtonDisabled = isSubmitting || loading.createPolicy || isSuccess

  // ==================== RENDER ====================

  // Get the display name for the locked risk
  const getLockedRiskDisplayName = () => {
    if (!businessId) return null
    return RISK_DISPLAY_NAMES[businessId] || businessId
  }

  return (
    <div className="create-policy-container">
      <div className="create-policy-header">
        <h1>Create New Policy</h1>
        <div className="header-actions">
          <Button 
            onClick={handleCancel} 
            variant="outline" 
            className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
            disabled={isButtonDisabled}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isButtonDisabled}
            className={`${isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white shadow-sm`}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Creating...
              </>
            ) : isSuccess ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Created! ✅
              </>
            ) : (
              "Create Policy"
            )}
          </Button>
        </div>
      </div>

      <div className="create-policy-form" ref={errorRef}>
        {validationErrors.length > 0 && (
          <div className="validation-errors">
            <h4>Please fix the following errors:</h4>
            <ul>
              {validationErrors.map((error, i) => <li key={i}>{error}</li>)}
            </ul>
          </div>
        )}

        {error.createPolicy && !isSuccess && (
          <div className="error-message border border-red-200 bg-red-50 text-red-600 rounded-md p-4 mb-6">
            {typeof error.createPolicy === 'string' 
              ? error.createPolicy 
              : error.createPolicy?.message || "An error occurred while creating the policy"}
          </div>
        )}

        {isSuccess && (
          <div className="success-message border border-green-200 bg-green-50 text-green-700 rounded-md p-4 mb-6 flex items-center gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Policy created successfully! ✅</p>
              {currentPolicy?.proposalNo && (
                <p className="text-sm">Policy Number: <span className="font-mono font-semibold">{currentPolicy.proposalNo}</span></p>
              )}
            </div>
          </div>
        )}

        <div className="form-section">
          <h3>Business Information</h3>
          <div className="form-grid">
           <div className="form-field">
  <Label htmlFor="riskClass" className="text-sm font-medium">
    Business Category <span className="text-red-500">*</span>
  </Label>
  <Input
    id="riskClass"
    value={(() => {
      // Find the risk name from loaded options
      const foundRisk = riskOptions.find(r => r.id === riskClass);
      const displayName = getLockedRiskDisplayName();
      
      // Console logs for debugging
      console.log("🔍 Business Category Debug:");
      console.log("  - riskClass:", riskClass);
      console.log("  - riskOptions loaded:", riskOptions.length);
      console.log("  - foundRisk:", foundRisk);
      console.log("  - displayName:", displayName);
      
      // Return the appropriate value
      if (foundRisk) {
        return foundRisk.name;
      } else if (displayName) {
        return displayName;
      } else if (riskClass) {
        return riskClass;
      } else {
        return "Loading...";
      }
    })()}
    disabled
    className="bg-gray-100 cursor-not-allowed mt-1"
  />
  <input type="hidden" name="riskId" value={riskClass} />
</div>

            <div className="form-field">
              <SearchableDropdown
                options={productOptions}
                value={formData.subriskID}
                onChange={(value) => {
                  handleInputChange("subriskID", value)
                  handleInputChange("productID", value)
                  
                  const selectedProduct = productOptions.find(p => p.id === value)
                  if (selectedProduct?.riskID) {
                    setRiskClass(selectedProduct.riskID)
                  }
                }}
                placeholder="Select Subclass/Product"
                label="Subclass / Product"
                loading={dropdownLoading.products}
                error={dropdownErrors.products}
                required={true}
                searchPlaceholder="Search product..."
                disabled={!riskClass || isButtonDisabled}
                showRiskInfo={true}
              />
            </div>

            <div className="form-field">
              <SearchableDropdown
                options={branchOptions}
                value={formData.branchID}
                onChange={(value) => handleInputChange("branchID", value)}
                placeholder="Select Branch"
                label="Branch"
                loading={dropdownLoading.branches}
                error={dropdownErrors.branches}
                required={true}
                searchPlaceholder="Search branch..."
                disabled={isButtonDisabled}
              />
            </div>

            <div className="form-field">
              <SearchableDropdown
                options={busChannelOptions}
                value={formData.busChannel}
                onChange={(value) => handleInputChange("busChannel", value)}
                placeholder="Select Channel"
                label="Business Channel"
                loading={dropdownLoading.busChannels}
                error={dropdownErrors.busChannels}
                required={true}
                searchPlaceholder="Search channel..."
                disabled={isButtonDisabled}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Agent & Marketing Information</h3>
          <div className="form-grid">
            <div className="form-field">
              <SearchableDropdown
                options={agentOptions}
                value={formData.partyID}
                onChange={(value) => handleInputChange("partyID", value)}
                placeholder="Select Agent/Broker"
                label="Agent/Broker"
                loading={dropdownLoading.agents}
                error={dropdownErrors.agents}
                searchPlaceholder="Search agent/broker..."
                disabled={isButtonDisabled}
              />
            </div>

            <div className="form-field">
              <SearchableDropdown
                options={mktStaffOptions}
                value={formData.mktStaffID}
                onChange={(value) => handleInputChange("mktStaffID", value)}
                placeholder="Select Marketing Staff"
                label="Marketing Staff"
                loading={dropdownLoading.mktStaffs}
                error={dropdownErrors.mktStaffs}
                required={true}
                searchPlaceholder="Search marketing staff..."
                disabled={isButtonDisabled}
              />
            </div>

            <div className="form-field">
              <SearchableDropdown
                options={accountTypeOptions}
                value={formData.accountType}
                onChange={(value) => handleInputChange("accountType", value)}
                placeholder="Select Account Type"
                label="Account Type"
                loading={dropdownLoading.accountTypes}
                error={dropdownErrors.accountTypes}
                searchPlaceholder="Search account type..."
                disabled={isButtonDisabled}
              />
            </div>

            <div className="form-field">
              <SearchableDropdown
                options={bizSourceOptions}
                value={formData.bizSource}
                onChange={(value) => handleInputChange("bizSource", value)}
                placeholder="Select Business Source"
                label="Business Source"
                loading={dropdownLoading.bizSources}
                error={dropdownErrors.bizSources}
                searchPlaceholder="Search business source..."
                disabled={isButtonDisabled}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Policy Period</h3>
          <div className="form-grid">
            <div className="form-field">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate ? formData.startDate.split('T')[0] : ""}
                onChange={(e) => {
                  const start = e.target.value;
                  handleInputChange("startDate", start);
                  if (start) {
                    const startDateObj = new Date(start);
                    const endDateObj = new Date(startDateObj);
                    endDateObj.setFullYear(endDateObj.getFullYear() + 1);
                    const endDateFormatted = endDateObj.toISOString().split("T")[0];
                    handleInputChange("endDate", endDateFormatted);
                  } else {
                    handleInputChange("endDate", "");
                  }
                }}
                disabled={isButtonDisabled}
              />
            </div>

            <div className="form-field">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate ? formData.endDate.split('T')[0] : ""}
                onChange={e => handleInputChange("endDate", e.target.value)}
                disabled={isButtonDisabled}
              />
            </div>

            <div className="form-field">
              <Label htmlFor="proportionRate">Proportion Rate (%)</Label>
              <Input
                id="proportionRate"
                type="number"
                min={0}
                max={100}
                value={formData.proportionRate}
                onChange={(e) => handleInputChange("proportionRate", Number(e.target.value))}
                disabled={isButtonDisabled}
              />
            </div>

            <div className="form-field">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                className="form-select"
                value={formData.currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                disabled={isFetchingRate || isButtonDisabled}
              >
                {currencyOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {isFetchingRate && (
                <div className="text-sm text-blue-600 mt-1">Fetching exchange rate...</div>
              )}
            </div>

            <div className="form-field">
              <Label htmlFor="exRate">
                Exchange Rate 
                <span className="text-sm text-gray-500 ml-1">(1 {formData.currency} to NGN)</span>
              </Label>
              <Input
                id="exRate"
                type="number"
                min={0}
                step={0.01}
                value={formData.exRate}
                onChange={e => handleInputChange("exRate", Number(e.target.value))}
                disabled={isFetchingRate || isButtonDisabled}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Insured Information</h3>
          <div className="insured-type-toggle">
            <Label className="mb-2 block">Insured Type</Label>
            <div className="toggle-buttons">
              {(["individual", "corporate"] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  className={`toggle-btn ${insuredType === type ? "active" : ""}`}
                  onClick={() => switchInsuredType(type)}
                  disabled={isButtonDisabled}
                >
                  {type === "individual" ? "Individual" : "Corporate"}
                </button>
              ))}
            </div>
          </div>

          {selectedCustomer ? (
            <div className="border border-indigo-200 bg-indigo-50 rounded-md p-3 mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm text-gray-600">Existing customer</div>
                <div className="font-semibold">{selectedCustomer.name}</div>
                <div className="text-xs text-gray-500 font-mono">{selectedCustomer.insuredID}</div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={clearCustomer} disabled={isButtonDisabled}>
                <X className="w-4 h-4 mr-1" /> Use a new customer instead
              </Button>
            </div>
          ) : (
            <div className="form-field mb-4" style={{ position: "relative" }}>
              <Label htmlFor="customerSearch">
                Search existing {insuredType === "corporate" ? "companies" : "customers"}
                <span className="text-sm text-gray-500 ml-1">(or fill in the details below for a new one)</span>
              </Label>
              <Input
                id="customerSearch"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder={insuredType === "corporate" ? "Type a company name..." : "Type a name, email or phone..."}
                disabled={isButtonDisabled}
                autoComplete="off"
              />
              {customerSearch.trim().length >= 2 && (
                <div
                  className="border border-gray-200 bg-white rounded-md shadow-md mt-1"
                  style={{ position: "absolute", left: 0, right: 0, zIndex: 20, maxHeight: 260, overflowY: "auto" }}
                >
                  {dropdownLoading.customers ? (
                    <div className="p-3 text-sm text-gray-500 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                    </div>
                  ) : dropdownErrors.customers ? (
                    <div className="p-3 text-sm text-red-600">Customer search failed. You can still enter a new customer below.</div>
                  ) : customerOptions.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No matching {insuredType === "corporate" ? "companies" : "customers"}. Enter the details below to create one.</div>
                  ) : (
                    customerOptions.map((c: any) => (
                      <button
                        key={c.insuredID}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-indigo-50 border-b border-gray-100 last:border-b-0"
                        onClick={() => selectCustomer(c)}
                      >
                        <div className="font-medium text-sm">{c.name}</div>
                        <div className="text-xs text-gray-500">
                          {[c.insuredID, c.email, c.phone].filter(Boolean).join(" · ")}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div className="form-grid">
            {insuredType === "individual" ? (
              <>
                <div className="form-field">
                  <Label htmlFor="surname">Surname *</Label>
                  <Input id="surname" value={formData.surname}
                    onChange={(e) => handleInputChange("surname", e.target.value)}
                    placeholder="Doe" disabled={isButtonDisabled || !!selectedCustomer} />
                </div>
                <div className="form-field">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="John" disabled={isButtonDisabled || !!selectedCustomer} />
                </div>
                <div className="form-field">
                  <Label htmlFor="otherNames">Other Names</Label>
                  <Input id="otherNames" value={formData.otherNames}
                    onChange={(e) => handleInputChange("otherNames", e.target.value)}
                    placeholder="Middle name etc." disabled={isButtonDisabled || !!selectedCustomer} />
                </div>
              </>
            ) : (
              <div className="form-field">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input id="companyName" value={formData.surname}
                  onChange={(e) => handleInputChange("surname", e.target.value)}
                  placeholder="Company Ltd" disabled={isButtonDisabled || !!selectedCustomer} />
              </div>
            )}

            <div className="form-field">
              <Label htmlFor="insMobilePhone">Mobile Phone *</Label>
              <Input id="insMobilePhone" type="tel" value={formData.insMobilePhone}
                onChange={(e) => handleInputChange("insMobilePhone", e.target.value)}
                placeholder="08012345678" disabled={isButtonDisabled || !!selectedCustomer} />
            </div>

            <div className="form-field">
              <Label htmlFor="insEmail">Email Address *</Label>
              <Input id="insEmail" type="email" value={formData.insEmail}
                onChange={(e) => handleInputChange("insEmail", e.target.value)}
                placeholder="example@domain.com" disabled={isButtonDisabled || !!selectedCustomer} />
            </div>

            <div className="form-field">
              <SearchableDropdown
                options={occupationOptions}
                value={formData.insOccupation}
                onChange={(value) => handleInputChange("insOccupation", value)}
                placeholder="Select occupation"
                label={insuredType === "corporate" ? "Business / Industry" : "Occupation"}
                loading={dropdownLoading.occupations}
                error={dropdownErrors.occupations}
                disabled={isButtonDisabled}
                searchPlaceholder="Search occupations..."
              />
            </div>

            <div className="form-field" style={{ gridColumn: "1 / -1" }}>
              <Label htmlFor="insAddress">Address *</Label>
              <textarea id="insAddress" className="form-textarea" rows={3} value={formData.insAddress}
                onChange={(e) => handleInputChange("insAddress", e.target.value)}
                placeholder="Full street address" disabled={isButtonDisabled || !!selectedCustomer} />
            </div>
          </div>
        </div>

        <div className="footer-actions">
          <Button 
            onClick={handleCancel} 
            variant="outline" 
            className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
            disabled={isButtonDisabled}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isButtonDisabled}
            className={`${isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white shadow-sm px-8`}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Creating Policy...
              </>
            ) : isSuccess ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Created! ✅
              </>
            ) : (
              "Create Policy"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CreatePolicy