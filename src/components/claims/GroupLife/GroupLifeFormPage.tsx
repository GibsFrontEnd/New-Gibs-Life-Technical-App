// features/claims/pages/GroupLifeClaimFormPage.tsx
//@ts-nocheck

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { 
  ArrowLeft, Save, Loader2, Eye, Pencil, ChevronDown, X,
  FileText, Upload, AlertCircle, Calculator, 
  CheckCircle, Clock, RefreshCw, Plus,
  FileCheck, Search
} from "lucide-react";
import { Button } from "../../UI/new-button";
import { Card, CardContent, CardHeader, CardTitle } from "../../UI/card";
import { Input } from "../../UI/new-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../UI/new-select";
import { Label } from "../../UI/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../UI/tabs";
import { Badge } from "../../UI/badge";
import { Checkbox } from "../../UI/checkbox";
import {
  insertClaimReserve,
  updateClaimReserve,
  fetchClaimReserveById,
  selectCurrentReserve,
  selectCurrentLoading,
  selectCurrentError,
  clearCurrentError,
  type ClaimReserve,
} from "../../../features/reducers/claimsReducers/claimsSlice";
import { useToast } from "../../../hooks/use-toast";

// ✅ Import from groupLifeQuotationSlice
import {
  fetchGroupLifePolicies,
  fetchPolicyMembers,
  selectGroupLifePolicies,
  type GroupLifePolicyListItem,
} from "../../../features/reducers/grouplifeReducers/groupLifeQuotationSlice";

// ==================== TYPES ====================

interface GroupLifeMember {
  id: string;
  memberId: string;
  memberID: number;
  policyNo: string;
  surname: string;
  otherNames: string;
  dateOfBirth: string;
  dobDate: string;
  hireDate: string;
  startDate: string;
  sex: string;
  age: number;
  basicSalary: number;
  housing: number;
  transport: number;
  otherAmount: number;
  totalEmolument: number;
  tEmolument: number;
  sumInsured: number;
  a9: number;
  grossPremium: number;
  a10: number;
  premiumRate: number;
  totalSumInsured: number;
  totalPremium: number;
  freqOfPayment: string;
  field7: string;
  duration: number;
  a1: number;
  active: number;
  deleted: number;
}

// ==================== NAIRA ICON COMPONENT ====================

const NairaIcon = ({ className = "w-5 h-5" }) => (
  <span className={`font-bold text-purple-600 ${className}`}>₦</span>
);

// ==================== SECTION HEADER COMPONENT ====================

const SectionHeader: React.FC<{
  title: string;
  icon?: React.ReactNode;
  className?: string;
  badge?: string;
  badgeColor?: "blue" | "green" | "red" | "yellow" | "purple" | "gray";
  rightElement?: React.ReactNode;
  borderColor?: string;
}> = ({ 
  title, 
  icon, 
  className, 
  badge, 
  badgeColor = "blue", 
  rightElement,
  borderColor = "border-gray-200"
}) => {
  const badgeColors = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
    purple: "bg-purple-100 text-purple-700",
    gray: "bg-gray-100 text-gray-700",
  };

  return (
    <div className={`flex items-center justify-between mb-4 pb-3 border-b-2 ${borderColor} ${className || ''}`}>
      <div className="flex items-center gap-3">
        {icon && <span className="text-blue-600">{icon}</span>}
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {badge && (
          <Badge className={`${badgeColors[badgeColor]} px-2 py-0.5 text-xs font-medium`}>
            {badge}
          </Badge>
        )}
      </div>
      {rightElement && (
        <div className="flex items-center gap-2">
          {rightElement}
        </div>
      )}
    </div>
  );
};

// ==================== SEARCHABLE DROPDOWN COMPONENT ====================

interface SearchableDropdownProps {
  options: any[];
  value: string;
  onChange: (value: string) => void;
  onSelect?: (option: any) => void;
  placeholder: string;
  label: string;
  loading: boolean;
  required?: boolean;
  disabled?: boolean;
  searchPlaceholder?: string;
  displayKey: string;
  valueKey: string;
  renderOption?: (option: any) => React.ReactNode;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  onSelect,
  placeholder,
  label,
  loading,
  required = false,
  disabled = false,
  searchPlaceholder = "Search...",
  displayKey,
  valueKey,
  renderOption,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => String(opt[valueKey]) === String(value));

  const filteredOptions = options.filter(opt => {
    const displayValue = String(opt[displayKey] || "").toLowerCase();
    return displayValue.includes(searchTerm.toLowerCase());
  });

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

  const handleSelect = (option: any) => {
    onChange(String(option[valueKey]));
    if (onSelect) onSelect(option);
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
          className={`flex items-center justify-between border rounded-md px-3 py-2.5 cursor-pointer ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'
          } ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span className={`${selectedOption ? 'text-gray-900' : 'text-gray-400'} truncate text-sm flex-1`}>
            {selectedOption ? (renderOption ? renderOption(selectedOption) : selectedOption[displayKey]) : placeholder}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
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
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
            <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-8 text-sm pl-9"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <span className="ml-2 text-sm text-gray-500">Loading...</span>
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="py-4 text-center text-sm text-gray-500">
                  No options available
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={String(option[valueKey])}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-0 ${
                      String(option[valueKey]) === String(value) ? 'bg-blue-50' : ''
                    }`}
                  >
                    {renderOption ? renderOption(option) : (
                      <div className="font-medium text-sm">{option[displayKey]}</div>
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

interface GroupLifeClaimFormPageProps {
  mode: "create" | "edit" | "view";
}

const GroupLifeClaimFormPage: React.FC<GroupLifeClaimFormPageProps> = ({ mode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("details");

  // Determine loss type from URL
  const getLossTypeFromPath = () => {
    const path = location.pathname;
    if (path.includes('death-claim')) return 'Death';
    if (path.includes('maturity')) return 'Maturity';
    if (path.includes('surrender')) return 'Surrender';
    if (path.includes('partial-withdrawal')) return 'Partial Withdrawal';
    return 'Death';
  };

  const lossType = getLossTypeFromPath();
  const isDeathClaim = lossType === 'Death';
  
  // Determine return path based on loss type
  const returnPath = location.state?.returnPath || 
    (lossType ? `/claims/group-life/${lossType.toLowerCase().replace(/ /g, '-')}` : "/claims/group-life/death-claim");

  const currentReserve = useSelector(selectCurrentReserve);
  const loading = useSelector(selectCurrentLoading);
  const error = useSelector(selectCurrentError);

  // ✅ Get policies from Redux (groupLifeQuotationSlice)
  const { policies, totalCount: policiesTotalCount, loading: policiesLoading, error: policiesError } = 
    useSelector(selectGroupLifePolicies);

  // ===== EXCHANGE RATE STATE =====
  const [isFetchingRate, setIsFetchingRate] = useState(false);

  // ===== STATE =====
  const [formData, setFormData] = useState<Partial<ClaimReserve>>({
    claimNo: "",
    schemeNo: "",
    schemeName: "",
    debitNo: "",
    memberNo: "",
    memberName: "",
    notifiedDate: new Date().toISOString().split("T")[0],
    lossDate: new Date().toISOString().split("T")[0],
    courseOfDeath: "",
    totalAmountPayable: 0,
    recoveryFromCoinsurers: 0,
    ourSharePayment: 0,
    ourShareOfPayable: 0,
    recoveryFromReinsurers: 0,
    paymentDelayReasons: "",
    coInsuranceStatus: "",
    validMeansId: false,
    deathCertificate: false,
    policeReport: false,
    burialCertificate: false,
    recentUtilities: false,
    passport: false,
    currencyType: "NAIRA",
    exchangeRate: 1,
    adjustedAmountDue: 0,
    ourLiabilityAmount: 0,
    dvSignedDate: "2010-01-01",
    dvSentDate: "2010-01-01",
    approval: 0,
    active: 1,
    lossType: lossType,
    field1: "",
    field2: "",
    field3: "",
    field4: "",
    field5: "",
    field6: "",
    field7: "",
    field8: "",
    field9: "",
    field10: "",
    field11: "",
    field12: "",
    a1: 0,
    a2: 0,
    a3: 0,
    a4: 0,
    a5: 0,
    a6: 0,
    a7: 0,
    a8: 0,
    a9: 0,
  });

  // ===== GROUP LIFE MEMBERS STATE =====
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isCreateMode = mode === "create";

  // ===== FETCH POLICIES USING THUNK =====
  const fetchPolicies = (search: string = "") => {
    dispatch(fetchGroupLifePolicies({
      search: search,
      isProposal: false,
      page: 1,
      pageSize: 50,
    }));
  };

  // ===== FETCH MEMBERS USING THUNK =====
  const fetchMembers = async (policyNo: string) => {
    if (!policyNo) return;
    
    setMembersLoading(true);
    try {
      const result = await dispatch(fetchPolicyMembers({ policyNo })).unwrap();
      console.log("✅ Members fetched:", result);
      setMembers(result || []);
    } catch (error: any) {
      console.error("❌ Failed to fetch members:", error);
      toast({
        title: "Error",
        description: error || "Failed to load members. Please try again.",
        variant: "destructive",
      });
    } finally {
      setMembersLoading(false);
    }
  };

  // ===== FETCH EXCHANGE RATE =====
  const fetchExchangeRate = async (fromCurrency: string, toCurrency: string = "NGN") => {
    setIsFetchingRate(true);
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      if (!response.ok) throw new Error("Failed to fetch exchange rate");
      const data = await response.json();
      const rate = data.rates[toCurrency] || 1;
      handleChange("exchangeRate", rate);
      handleChange("propRate", rate);
      
      toast({
        title: "Exchange Rate Updated",
        description: `1 ${fromCurrency} = ${rate} ${toCurrency}`,
        variant: "default",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      toast({
        title: "Error",
        description: "Failed to fetch exchange rate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingRate(false);
    }
  };

  // ===== HANDLE CURRENCY CHANGE =====
  const handleCurrencyChange = (currency: string) => {
    handleChange("currencyType", currency);
    handleChange("field12", currency);
    if (currency && currency !== "NAIRA") {
      fetchExchangeRate(currency);
    } else {
      handleChange("exchangeRate", 1);
      handleChange("propRate", 1);
    }
  };

  // ===== AUTO-FILL FUNCTION =====
  const autoFillForm = (policy: any) => {
    console.log("🔄 Auto-filling form with policy data:", policy);
    
    // Auto-fill basic policy information
    const autoFillData: any = {
      schemeNo: policy.policyNo,
      schemeName: policy.insuredName || policy.schemeName || policy.policyNo,
      field1: policy.policyNo,
      // Set loss details from policy
      lossDetails: `Claim for policy ${policy.policyNo} - ${policy.insuredName || ''}`,
    };

    // If we have member data, auto-fill member fields
    if (policy.members && policy.members.length > 0) {
      const firstMember = policy.members[0];
      const fullName = `${firstMember.surname || ''} ${firstMember.otherNames || ''}`.trim();
      autoFillData.memberNo = String(firstMember.memberID || firstMember.id);
      autoFillData.memberName = fullName;
      autoFillData.field3 = String(firstMember.memberID || firstMember.id);
      // Auto-populate some fields from member data
      autoFillData.a9 = firstMember.sumInsured || firstMember.a9 || 0;
      autoFillData.a5 = firstMember.totalEmolument || firstMember.tEmolument || 0;
    }

    // Update form data
    setFormData((prev) => ({
      ...prev,
      ...autoFillData,
    }));

    toast({
      title: "✅ Form Auto-Filled",
      description: `Policy ${policy.policyNo} details loaded successfully`,
      duration: 3000,
    });
  };

  // ===== EFFECTS =====

  // Fetch policies on mount for create mode
  useEffect(() => {
    if (isCreateMode) {
      fetchPolicies("");
    }
  }, [isCreateMode]);

  // Fetch members when policy is selected
  useEffect(() => {
    if (formData.schemeNo && isCreateMode) {
      fetchMembers(formData.schemeNo);
    }
  }, [formData.schemeNo, isCreateMode]);

  // Fetch claim data if in edit or view mode
  useEffect(() => {
    if ((isEditMode || isViewMode) && id) {
      dispatch(fetchClaimReserveById(parseInt(id)));
    }
  }, [isEditMode, isViewMode, id, dispatch]);

  // Populate form when data is loaded
  useEffect(() => {
    if ((isEditMode || isViewMode) && currentReserve) {
      setFormData({
        claimID: currentReserve.claimID,
        claimNo: currentReserve.claimNo || "",
        schemeNo: currentReserve.schemeNo || currentReserve.field1 || "",
        schemeName: currentReserve.schemeName || "",
        debitNo: currentReserve.debitNo || currentReserve.field2 || "",
        memberNo: currentReserve.memberNo || currentReserve.field3 || "",
        memberName: currentReserve.memberName || "",
        notifiedDate: currentReserve.notifiedDate || new Date().toISOString().split("T")[0],
        lossDate: currentReserve.lossDate || new Date().toISOString().split("T")[0],
        courseOfDeath: currentReserve.courseOfDeath || currentReserve.field4 || "",
        totalAmountPayable: currentReserve.totalAmountPayable || currentReserve.a1 || 0,
        recoveryFromCoinsurers: currentReserve.recoveryFromCoinsurers || currentReserve.a2 || 0,
        ourSharePayment: currentReserve.ourSharePayment || currentReserve.a3 || 0,
        ourShareOfPayable: currentReserve.ourShareOfPayable || currentReserve.a4 || 0,
        recoveryFromReinsurers: currentReserve.recoveryFromReinsurers || currentReserve.a5 || 0,
        paymentDelayReasons: currentReserve.paymentDelayReasons || currentReserve.field5 || "",
        coInsuranceStatus: currentReserve.coInsuranceStatus || currentReserve.field6 || "",
        validMeansId: currentReserve.validMeansId || false,
        deathCertificate: currentReserve.deathCertificate || false,
        policeReport: currentReserve.policeReport || false,
        burialCertificate: currentReserve.burialCertificate || false,
        recentUtilities: currentReserve.recentUtilities || false,
        passport: currentReserve.passport || false,
        currencyType: currentReserve.currencyType || currentReserve.field12 || "NAIRA",
        exchangeRate: currentReserve.exchangeRate || currentReserve.propRate || 1,
        adjustedAmountDue: currentReserve.adjustedAmountDue || currentReserve.a6 || 0,
        ourLiabilityAmount: currentReserve.ourLiabilityAmount || currentReserve.a7 || 0,
        dvSignedDate: currentReserve.dvSignedDate || "2010-01-01",
        dvSentDate: currentReserve.dvSentDate || "2010-01-01",
        approval: currentReserve.approval || 0,
        active: currentReserve.active || 1,
        lossType: currentReserve.lossType || lossType,
        field1: currentReserve.field1 || "",
        field2: currentReserve.field2 || "",
        field3: currentReserve.field3 || "",
        field4: currentReserve.field4 || "",
        field5: currentReserve.field5 || "",
        field6: currentReserve.field6 || "",
        field7: currentReserve.field7 || "",
        field8: currentReserve.field8 || "",
        field9: currentReserve.field9 || "",
        field10: currentReserve.field10 || "",
        field11: currentReserve.field11 || "",
        field12: currentReserve.field12 || "",
        a1: currentReserve.a1 || 0,
        a2: currentReserve.a2 || 0,
        a3: currentReserve.a3 || 0,
        a4: currentReserve.a4 || 0,
        a5: currentReserve.a5 || 0,
        a6: currentReserve.a6 || 0,
        a7: currentReserve.a7 || 0,
        a8: currentReserve.a8 || 0,
        a9: currentReserve.a9 || 0,
      });

      // If we have a scheme number, fetch members for edit/view mode
      if (currentReserve.field1) {
        fetchMembers(currentReserve.field1);
      }
    }
  }, [isEditMode, isViewMode, currentReserve]);

  useEffect(() => {
    return () => {
      dispatch(clearCurrentError());
    };
  }, [dispatch]);

  // ===== HANDLERS =====

  const handleChange = (key: keyof ClaimReserve, value: any) => {
    if (isViewMode) return;
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleCheckboxChange = (key: string, checked: boolean) => {
    if (isViewMode) return;
    setFormData((prev) => ({ ...prev, [key]: checked }));
  };

  const handlePolicySelect = (policy: any) => {
    setSelectedPolicy(policy);
    
    // ✅ Auto-fill the form with policy data
    autoFillForm(policy);
    
    // Clear member selection when policy changes
    setSelectedMember(null);
    setMembers([]);
    
    // Fetch members for this policy
    fetchMembers(policy.policyNo);
  };

  const handleMemberSelect = (member: any) => {
    setSelectedMember(member);
    const fullName = `${member.surname || ''} ${member.otherNames || ''}`.trim();
    setFormData((prev) => ({
      ...prev,
      memberNo: String(member.memberID || member.id),
      memberName: fullName,
      field3: String(member.memberID || member.id),
      // Auto-populate some fields from member data
      a9: member.sumInsured || member.a9 || 0,
      a5: member.totalEmolument || member.tEmolument || 0,
    }));
    
    toast({
      title: "✅ Member Selected",
      description: `Member ${fullName} loaded successfully`,
      duration: 3000,
    });
  };

  const validate = () => {
    if (isViewMode) return true;
    const newErrors: Record<string, string> = {};

    if (!formData.schemeNo?.trim()) {
      newErrors.schemeNo = "Scheme number is required";
    }
    if (!formData.memberNo?.trim()) {
      newErrors.memberNo = "Member number is required";
    }
    if (!formData.lossDate) {
      newErrors.lossDate = "Loss date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isViewMode) return;
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        lossType: lossType,
        entryDate: new Date().toISOString(),
        submittedOn: new Date().toISOString(),
        modifiedOn: new Date().toISOString(),
        field1: formData.schemeNo,
        field2: formData.debitNo,
        field3: formData.memberNo,
        field4: formData.courseOfDeath,
        field5: formData.paymentDelayReasons,
        field6: formData.coInsuranceStatus,
        field12: formData.currencyType,
        propRate: formData.exchangeRate,
        a1: formData.totalAmountPayable,
        a2: formData.recoveryFromCoinsurers,
        a3: formData.ourSharePayment,
        a4: formData.ourShareOfPayable,
        a5: formData.recoveryFromReinsurers,
        a6: formData.adjustedAmountDue,
        a7: formData.ourLiabilityAmount,
      };

      if (isCreateMode) {
        await dispatch(insertClaimReserve(submitData)).unwrap();
        toast({
          title: "✅ Claim Created",
          description: `Group Life ${lossType} claim has been created successfully!`,
          variant: "default",
        });
      } else if (isEditMode && formData.claimID) {
        await dispatch(updateClaimReserve({ 
          id: formData.claimID, 
          data: submitData 
        })).unwrap();
        toast({
          title: "✅ Claim Updated",
          description: `Group Life ${lossType} claim has been updated successfully!`,
          variant: "default",
        });
      }
      
      navigate(returnPath);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "Failed to save claim",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(returnPath);
  };

  const getPageTitle = () => {
    if (isViewMode) return `Group Life ${lossType} Claim Details`;
    if (isEditMode) return `Edit Group Life ${lossType} Claim`;
    return `New Group Life ${lossType} Claim`;
  };

  const getPageSubtitle = () => {
    if (isViewMode) return `View complete group life ${lossType.toLowerCase()} claim details`;
    if (isEditMode) return `Update group life ${lossType.toLowerCase()} claim information`;
    return `Fill in the details to create a new group life ${lossType.toLowerCase()} claim`;
  };

  // ===== RENDER =====

  if (loading && (isEditMode || isViewMode)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading claim details...</p>
        <p className="text-gray-400 text-sm mt-2">Please wait while we fetch your data</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium mb-2">Error loading claim</p>
              <p className="text-red-500 text-sm">{error}</p>
              <Button variant="outline" className="mt-4" onClick={handleCancel}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="container mx-auto max-w-7xl">
        {/* ===== HEADER ===== */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleCancel} className="bg-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
              <p className="text-sm text-gray-500 mt-1">{getPageSubtitle()}</p>
            </div>
          </div>
          <div className="flex gap-2  md:w-auto">
            {isViewMode && (
              <Button
                onClick={() => {
                  navigate(`/claims/group-life/claim/edit/${id}`, {
                    state: { returnPath: returnPath }
                  });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white  md:w-auto"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Claim
              </Button>
            )}
            {!isViewMode && (
              <>
                <Button variant="outline" onClick={handleCancel} className="bg-white md:w-auto">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white  md:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isCreateMode ? "Creating..." : "Updating..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isCreateMode ? "Create Claim" : "Update Claim"}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ===== STATUS BADGE ===== */}
        {isViewMode && (
          <div className="mb-6 flex items-center gap-3">
            <Badge className="bg-green-100 text-green-700 px-3 py-1">
              <CheckCircle className="w-3 h-3 mr-1" />
              {formData.approval === 2 ? 'Approved' : formData.approval === 1 ? 'Pending' : 'Draft'}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Clock className="w-3 h-3 mr-1" />
              {new Date().toLocaleDateString()}
            </Badge>
          </div>
        )}

        {/* ===== MAIN FORM CARD ===== */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Group Life {lossType} Claim Management
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="details" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <FileText className="w-4 h-4" />
                  Claim Details
                </TabsTrigger>
                <TabsTrigger value="payment" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <NairaIcon className="w-4 h-4" />
                  Payment Details
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Upload className="w-4 h-4" />
                  Documents
                </TabsTrigger>
              </TabsList>

              {/* ===== TAB 1: CLAIM DETAILS ===== */}
              <TabsContent value="details" className="animate-in slide-in-from-top-3 fade-in duration-300">
                <div className="space-y-6">
                  {/* Loss Details Section */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <SectionHeader 
                      title="Loss Details" 
                      icon={<FileText className="w-4 h-4" />}
                      borderColor="border-blue-200"
                      badge="Required"
                      badgeColor="blue"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Claim No - Auto-generated */}
                      <div>
                        <Label htmlFor="claimNo">Claim No</Label>
                        <Input
                          id="claimNo"
                          value={formData.claimNo || "[AUTO]"}
                          disabled
                          className="bg-gray-50 font-medium"
                        />
                      </div>

                      {/* Processing Date - Auto-generated */}
                      <div>
                        <Label htmlFor="processingDate">Processing Date</Label>
                        <Input
                          id="processingDate"
                          value={new Date().toLocaleDateString('en-US', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>

                      {/* Scheme No - Searchable Dropdown using Redux state */}
                      <div>
                        <SearchableDropdown
                          options={policies}
                          value={formData.schemeNo || ""}
                          onChange={(value) => {
                            const policy = policies.find(p => p.policyNo === value);
                            if (policy) {
                              handlePolicySelect(policy);
                            } else {
                              handleChange("schemeNo", value);
                              handleChange("field1", value);
                            }
                          }}
                          onSelect={handlePolicySelect}
                          placeholder="Search for scheme..."
                          label="Scheme No *"
                          loading={policiesLoading}
                          required={true}
                          disabled={isViewMode || isEditMode}
                          searchPlaceholder="Search by scheme number or name..."
                          displayKey="insuredName"
                          valueKey="policyNo"
                          renderOption={(option) => (
                            <div>
                              <div className="font-medium text-sm">{option.policyNo}</div>
                              <div className="text-xs text-gray-500">{option.insuredName || option.schemeName}</div>
                              <div className="text-xs text-gray-400">Status: {option.status}</div>
                            </div>
                          )}
                        />
                        {errors.schemeNo && <p className="text-red-500 text-xs mt-1">{errors.schemeNo}</p>}
                      </div>

                      {/* Debit No */}
                      <div>
                        <Label htmlFor="debitNo">Debit No</Label>
                        <Input
                          id="debitNo"
                          value={formData.debitNo || ""}
                          onChange={(e) => {
                            handleChange("debitNo", e.target.value);
                            handleChange("field2", e.target.value);
                          }}
                          placeholder="Enter debit number"
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>

                      {/* Member No - Searchable Dropdown */}
                      <div>
                        <SearchableDropdown
                          options={members}
                          value={formData.memberNo || ""}
                          onChange={(value) => {
                            const member = members.find(m => String(m.memberID || m.id) === String(value));
                            if (member) {
                              handleMemberSelect(member);
                            } else {
                              handleChange("memberNo", value);
                              handleChange("field3", value);
                            }
                          }}
                          onSelect={handleMemberSelect}
                          placeholder="Search for member..."
                          label="Member No *"
                          loading={membersLoading}
                          required={true}
                          disabled={isViewMode || !formData.schemeNo}
                          searchPlaceholder="Search by member number or name..."
                          displayKey="surname"
                          valueKey="id"
                          renderOption={(option) => (
                            <div>
                              <div className="font-medium text-sm">
                                {option.memberID || option.id} - {option.surname} {option.otherNames}
                              </div>
                              <div className="text-xs text-gray-500">
                                Age: {option.age} | Salary: ₦{(option.basicSalary || 0).toLocaleString()}
                              </div>
                            </div>
                          )}
                        />
                        {!formData.schemeNo && !isViewMode && (
                          <p className="text-xs text-amber-600 mt-1">Please select a scheme first</p>
                        )}
                        {errors.memberNo && <p className="text-red-500 text-xs mt-1">{errors.memberNo}</p>}
                      </div>

                      {/* Get Details Button */}
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 w-full"
                          disabled={isViewMode || !formData.schemeNo}
                          onClick={() => {
                            if (formData.schemeNo) {
                              fetchMembers(formData.schemeNo);
                              toast({
                                title: "Refreshing",
                                description: "Fetching latest member data...",
                                duration: 2000,
                              });
                            }
                          }}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Get Details
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Payable Amount Section */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <SectionHeader 
                      title="Payable Amount" 
                      icon={<Calculator className="w-4 h-4" />}
                      borderColor="border-blue-200"
                      badge="Required"
                      badgeColor="blue"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Document Checkboxes - Only for Death Claims */}
                      {isDeathClaim && (
                        <div className="md:col-span-2">
                          <Label className="text-sm font-medium mb-2 block">Valid Documents</Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="validMeansId"
                                checked={formData.validMeansId || false}
                                onCheckedChange={(checked) => handleCheckboxChange("validMeansId", checked)}
                                disabled={isViewMode}
                              />
                              <Label htmlFor="validMeansId" className="text-sm cursor-pointer">Valid Means ID</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="deathCertificate"
                                checked={formData.deathCertificate || false}
                                onCheckedChange={(checked) => handleCheckboxChange("deathCertificate", checked)}
                                disabled={isViewMode}
                              />
                              <Label htmlFor="deathCertificate" className="text-sm cursor-pointer">Death Certificate</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="policeReport"
                                checked={formData.policeReport || false}
                                onCheckedChange={(checked) => handleCheckboxChange("policeReport", checked)}
                                disabled={isViewMode}
                              />
                              <Label htmlFor="policeReport" className="text-sm cursor-pointer">Police Report</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="burialCertificate"
                                checked={formData.burialCertificate || false}
                                onCheckedChange={(checked) => handleCheckboxChange("burialCertificate", checked)}
                                disabled={isViewMode}
                              />
                              <Label htmlFor="burialCertificate" className="text-sm cursor-pointer">Burial Certificate</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="recentUtilities"
                                checked={formData.recentUtilities || false}
                                onCheckedChange={(checked) => handleCheckboxChange("recentUtilities", checked)}
                                disabled={isViewMode}
                              />
                              <Label htmlFor="recentUtilities" className="text-sm cursor-pointer">Recent Utilities</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="passport"
                                checked={formData.passport || false}
                                onCheckedChange={(checked) => handleCheckboxChange("passport", checked)}
                                disabled={isViewMode}
                              />
                              <Label htmlFor="passport" className="text-sm cursor-pointer">Passport</Label>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="md:col-span-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast({ title: "Recalculated", description: "All values have been recalculated", variant: "default" })}
                          className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                          disabled={isViewMode}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          ReCalc
                        </Button>
                      </div>

                      <div>
                        <Label htmlFor="notifiedDate">Notified Date</Label>
                        <Input
                          id="notifiedDate"
                          type="date"
                          value={formData.notifiedDate || ""}
                          onChange={(e) => handleChange("notifiedDate", e.target.value)}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="courseOfDeath">Course Of Death</Label>
                        <Input
                          id="courseOfDeath"
                          value={formData.courseOfDeath || ""}
                          onChange={(e) => {
                            handleChange("courseOfDeath", e.target.value);
                            handleChange("field4", e.target.value);
                          }}
                          placeholder="Enter course of death"
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lossDate">Loss (Death) Date</Label>
                        <Input
                          id="lossDate"
                          type="date"
                          value={formData.lossDate || ""}
                          onChange={(e) => handleChange("lossDate", e.target.value)}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                        {errors.lossDate && <p className="text-red-500 text-xs mt-1">{errors.lossDate}</p>}
                      </div>
                      <div>
                        <Label htmlFor="coInsuranceStatus">Co-Insurance Status</Label>
                        <Select
                          value={formData.coInsuranceStatus || ""}
                          onValueChange={(value) => {
                            handleChange("coInsuranceStatus", value);
                            handleChange("field6", value);
                          }}
                          disabled={isViewMode}
                        >
                          <SelectTrigger className={isViewMode ? "bg-gray-50" : ""}>
                            <SelectValue placeholder="- Select -" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="None">None</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="totalAmountPayable">Total Amount Payable</Label>
                        <Input
                          id="totalAmountPayable"
                          type="number"
                          step="0.01"
                          value={formData.totalAmountPayable || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleChange("totalAmountPayable", val);
                            handleChange("a1", val);
                          }}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="recoveryFromCoinsurers">Recovery From Coinsurers</Label>
                        <Input
                          id="recoveryFromCoinsurers"
                          type="number"
                          step="0.01"
                          value={formData.recoveryFromCoinsurers || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleChange("recoveryFromCoinsurers", val);
                            handleChange("a2", val);
                          }}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ourSharePayment">Our Share Payment</Label>
                        <Input
                          id="ourSharePayment"
                          type="number"
                          step="0.01"
                          value={formData.ourSharePayment || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleChange("ourSharePayment", val);
                            handleChange("a3", val);
                          }}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ourShareOfPayable">Our Share Of Payable</Label>
                        <Input
                          id="ourShareOfPayable"
                          type="number"
                          step="0.01"
                          value={formData.ourShareOfPayable || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleChange("ourShareOfPayable", val);
                            handleChange("a4", val);
                          }}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="recoveryFromReinsurers">Recovery From Reinsurers</Label>
                        <Input
                          id="recoveryFromReinsurers"
                          type="number"
                          step="0.01"
                          value={formData.recoveryFromReinsurers || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleChange("recoveryFromReinsurers", val);
                            handleChange("a5", val);
                          }}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="paymentDelayReasons">Payment Delay Reasons</Label>
                        <Input
                          id="paymentDelayReasons"
                          value={formData.paymentDelayReasons || ""}
                          onChange={(e) => {
                            handleChange("paymentDelayReasons", e.target.value);
                            handleChange("field5", e.target.value);
                          }}
                          placeholder="Enter payment delay reasons"
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                    </div>
                  </div>

                  {/* DV Details Section with Exchange Rate */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <SectionHeader 
                      title="DV Details" 
                      icon={<NairaIcon className="w-4 h-4" />}
                      borderColor="border-purple-200"
                      badge="Exchange"
                      badgeColor="purple"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Currency Type - Select dropdown with exchange rate fetch */}
                      <div>
                        <Label htmlFor="currencyType">Currency Type</Label>
                        <Select
                          value={formData.currencyType || "NAIRA"}
                          onValueChange={handleCurrencyChange}
                          disabled={isViewMode || isFetchingRate}
                        >
                          <SelectTrigger className={isViewMode ? "bg-gray-50" : ""}>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NAIRA">NAIRA</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="CAD">CAD</SelectItem>
                           
                          </SelectContent>
                        </Select>
                        {isFetchingRate && (
                          <div className="flex items-center mt-1 text-sm text-blue-600">
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Fetching exchange rate...
                          </div>
                        )}
                      </div>

                      {/* Exchange Rate */}
                      <div>
                        <Label htmlFor="exchangeRate">Exchange Rate</Label>
                        <Input
                          id="exchangeRate"
                          type="number"
                          step="0.01"
                          value={formData.exchangeRate || 1}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 1;
                            handleChange("exchangeRate", val);
                            handleChange("propRate", val);
                          }}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>

                      {/* Adjusted Amount Due */}
                      <div>
                        <Label htmlFor="adjustedAmountDue">Adjusted Amount Due</Label>
                        <Input
                          id="adjustedAmountDue"
                          type="number"
                          step="0.01"
                          value={formData.adjustedAmountDue || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleChange("adjustedAmountDue", val);
                            handleChange("a6", val);
                          }}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>

                      {/* Our Liability Amount (Local) */}
                      <div>
                        <Label htmlFor="ourLiabilityAmount">Our Liability Amount (Local)</Label>
                        <Input
                          id="ourLiabilityAmount"
                          type="number"
                          step="0.01"
                          value={formData.ourLiabilityAmount || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleChange("ourLiabilityAmount", val);
                            handleChange("a7", val);
                          }}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>

                      {/* DV Signed Date */}
                      <div>
                        <Label htmlFor="dvSignedDate">DV Signed Date</Label>
                        <Input
                          id="dvSignedDate"
                          type="date"
                          value={formData.dvSignedDate || ""}
                          onChange={(e) => handleChange("dvSignedDate", e.target.value)}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>

                      {/* DV Sent Date */}
                      <div>
                        <Label htmlFor="dvSentDate">DV Sent Date</Label>
                        <Input
                          id="dvSentDate"
                          type="date"
                          value={formData.dvSentDate || ""}
                          onChange={(e) => handleChange("dvSentDate", e.target.value)}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ===== TAB 2: PAYMENT DETAILS ===== */}
              <TabsContent value="payment" className="animate-in slide-in-from-top-3 fade-in duration-300">
                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <SectionHeader 
                      title="Payment Summary" 
                     
                      borderColor="border-green-200"
                      badge="Summary"
                      badgeColor="green"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="totalAmountPayableDisplay">Total Amount Payable</Label>
                        <Input
                          id="totalAmountPayableDisplay"
                          value={`${(formData.totalAmountPayable || 0).toFixed(2)}`}
                          disabled
                          className="bg-green-50 font-bold text-green-700 text-lg"
                        />
                      </div>
                      <div>
                        <Label htmlFor="netPayableDisplay">Net Payable</Label>
                        <Input
                          id="netPayableDisplay"
                          value={`${((formData.totalAmountPayable || 0) - (formData.recoveryFromCoinsurers || 0) - (formData.recoveryFromReinsurers || 0)).toFixed(2)}`}
                          disabled
                          className="bg-blue-50 font-bold text-blue-700 text-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ===== TAB 3: DOCUMENTS ===== */}
              <TabsContent value="documents" className="animate-in slide-in-from-top-3 fade-in duration-300">
                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <SectionHeader 
                      title="Upload Documents" 
                      icon={<Upload className="w-4 h-4" />}
                      borderColor="border-blue-200"
                      badge="Upload"
                      badgeColor="blue"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fileUpload">Upload</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="fileUpload"
                            type="file"
                            disabled={isViewMode}
                            className={isViewMode ? "bg-gray-50" : ""}
                          />
                          <Button
                            disabled={isViewMode}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <SectionHeader 
                      title="HELP" 
                      icon={<AlertCircle className="w-4 h-4" />}
                      borderColor="border-blue-300"
                      badge="Important"
                      badgeColor="blue"
                    />
                    <ul className="text-sm text-blue-700 space-y-1 list-disc pl-4 mt-2">
                      <li>Make sure you click on ADD button to add the record to grid-view before you click on SAVE button</li>
                      <li>Make sure you click on choose file button then click ADD DOCUMENT button if you have document you want to upload.</li>
                      <li>Verify all added records before you click on SAVE button.</li>
                      <li>If you have uploaded a wrong document, kindly use the DELETE button below to delete the document.</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <SectionHeader 
                      title="Uploaded Document Details" 
                      icon={<FileText className="w-4 h-4" />}
                      borderColor="border-gray-300"
                      badge="0 files"
                      badgeColor="gray"
                    />
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg mt-2">
                      <Upload className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No documents uploaded yet</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button variant="outline" className="bg-white" disabled={isViewMode}>
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                      disabled={isViewMode}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reversal
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isViewMode}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroupLifeClaimFormPage;