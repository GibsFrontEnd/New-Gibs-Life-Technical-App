// features/claims/pages/ClaimFormPage.tsx
//@ts-nocheck

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft, Save, Loader2, Trash2, ChevronDown, X, Eye, Pencil,
  FileText, Upload, AlertCircle, Calculator,
  CheckCircle, Clock, FileCheck, RefreshCw, Plus,
  Building2, TrendingUp, FileSpreadsheet
} from "lucide-react";
import { Button } from "../../components/UI/new-button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/UI/card";
import { Input } from "../../components/UI/new-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/UI/new-select";
import { Label } from "../../components/UI/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/UI/tabs";
import { Badge } from "../../components/UI/badge";
import {
  insertClaimReserve,
  updateClaimReserve,
  fetchClaimReserveById,
  selectCurrentReserve,
  selectCurrentLoading,
  selectCurrentError,
  clearCurrentError,
  searchIndividualPolicies,
  selectAllPolicies,
  selectPoliciesLoading,
  selectPoliciesError,
  type ClaimReserve,
  type IndividualPolicy,
} from "../../features/reducers/claimsReducers/claimsSlice";
import { useToast } from "../../hooks/use-toast";
import { SERVER_URL } from "../../utils/constants";

// ==================== TYPES ====================

interface ApiDropdownOption {
  id: string;
  name: string;
  code?: string;
  policyNo?: string;
  insuredName?: string;
  subRisk?: string;
  [key: string]: any;
}

interface SearchableDropdownProps {
  options: ApiDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  onSelect?: (option: ApiDropdownOption) => void;
  placeholder: string;
  label: string;
  loading: boolean;
  error: boolean;
  required?: boolean;
  disabled?: boolean;
  searchPlaceholder?: string;
}

// ==================== NAIRA ICON ====================

const NairaIcon = ({ className = "w-5 h-5" }) => (
  <span className={`font-bold text-purple-600 ${className}`}>₦</span>
);

// ==================== SECTION HEADER ====================

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

// ==================== SEARCHABLE DROPDOWN ====================

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  onSelect,
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
    opt.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opt.policyNo?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <span className={`${selectedOption ? 'text-gray-900' : 'text-gray-400'} truncate text-sm`}>
            {selectedOption?.name || placeholder}
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
                  No policies available
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
                    {option.policyNo && (
                      <div className="text-xs text-gray-500">Policy: {option.policyNo}</div>
                    )}
                    {option.insuredName && (
                      <div className="text-xs text-gray-500">Insured: {option.insuredName}</div>
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

// ==================== CLAIM DETAILS TAB ====================

const ClaimDetailsTab: React.FC<{
  formData: Partial<ClaimReserve>;
  handleChange: (key: keyof ClaimReserve, value: any) => void;
  isViewMode: boolean;
  isCreateMode: boolean;
  isEditMode: boolean;
  hasSelectedPolicy: boolean;
  errors: Record<string, string>;
  policies: ApiDropdownOption[];
  policyLoading: boolean;
  policyError: boolean;
  handlePolicySelect: (policy: ApiDropdownOption) => void;
  lossTypeOptions: { label: string; value: string }[];
}> = ({
  formData,
  handleChange,
  isViewMode,
  isCreateMode,
  isEditMode,
  hasSelectedPolicy,
  errors,
  policies,
  policyLoading,
  policyError,
  handlePolicySelect,
  lossTypeOptions,
}) => {
  const showPremiumCheck = (isCreateMode && hasSelectedPolicy) || isEditMode || isViewMode;

  return (
    <div className="space-y-6">
      {/* LOSS DETAILS */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <SectionHeader
          title="Loss Details"
          icon={<FileText className="w-4 h-4" />}
          borderColor="border-blue-200"
          badge="Required"
          badgeColor="blue"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="claimNo">Claim No</Label>
            <Input
              id="claimNo"
              value={formData.claimNo || "[AUTO]"}
              disabled
              className="bg-gray-50 font-medium"
            />
          </div>
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
        </div>
      </div>

      {/* POLICY SELECTION */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <SectionHeader
          title="Policy Selection"
          icon={<Building2 className="w-4 h-4" />}
          borderColor="border-blue-300"
        />
        <div className="mt-2">
          {isCreateMode ? (
            <SearchableDropdown
              options={policies}
              value={formData.policyNo || ""}
              onChange={(value) => handleChange("policyNo", value)}
              onSelect={handlePolicySelect}
              placeholder="Search for policy..."
              label="Policy Number *"
              loading={policyLoading}
              error={policyError}
              required={true}
              searchPlaceholder="Search by policy number or insured name..."
            />
          ) : (
            <Input
              id="policyNo"
              value={formData.policyNo || ""}
              disabled={isViewMode}
              className={isViewMode ? "bg-gray-50" : ""}
              placeholder="Policy number"
            />
          )}
          {errors.policyNo && !isViewMode && (
            <p className="text-red-500 text-xs mt-1">{errors.policyNo}</p>
          )}
        </div>
      </div>

      {/* BY PASS PREMIUM CHECK */}
      {showPremiumCheck && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <SectionHeader
            title="By Pass Premium Check"
            icon={<CheckCircle className="w-4 h-4" />}
            borderColor="border-green-200"
            badge={isViewMode ? "View Mode" : isEditMode ? "Edit Mode" : "Policy Loaded"}
            badgeColor={isViewMode ? "gray" : "green"}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <Label htmlFor="insuredName">Surname {!isViewMode && "*"}</Label>
              <Input
                id="insuredName"
                value={formData.insuredName || ""}
                onChange={(e) => handleChange("insuredName", e.target.value)}
                placeholder="Enter surname"
                disabled={isViewMode}
                className={isViewMode ? "bg-gray-50" : ""}
              />
              {errors.insuredName && !isViewMode && (
                <p className="text-red-500 text-xs mt-1">{errors.insuredName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="othername">Othername</Label>
              <Input
                id="othername"
                value={formData.field1 || ""}
                onChange={(e) => handleChange("field1", e.target.value)}
                placeholder="Enter other name"
                disabled={isViewMode}
                className={isViewMode ? "bg-gray-50" : ""}
              />
            </div>

            <div>
              <Label htmlFor="startDate">Commencement Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate || ""}
                onChange={(e) => handleChange("startDate", e.target.value)}
                disabled={isViewMode}
                className={isViewMode ? "bg-gray-50" : ""}
              />
            </div>

            <div>
              <Label htmlFor="lossDate">Loss Date *</Label>
              <Input
                id="lossDate"
                type="date"
                value={formData.lossDate || ""}
                onChange={(e) => handleChange("lossDate", e.target.value)}
                disabled={isViewMode}
                className={isViewMode ? "bg-gray-50" : ""}
                required
              />
              {errors.lossDate && !isViewMode && (
                <p className="text-red-500 text-xs mt-1">{errors.lossDate}</p>
              )}
            </div>

            <div>
              <Label htmlFor="endDate">Maturity Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate || ""}
                onChange={(e) => handleChange("endDate", e.target.value)}
                disabled={isViewMode}
                className={isViewMode ? "bg-gray-50" : ""}
              />
            </div>

            <div>
              <Label htmlFor="modeOfPayment">Mode Of Payment</Label>
              <Select
                value={formData.field3 || ""}
                onValueChange={(value) => handleChange("field3", value)}
                disabled={isViewMode}
              >
                <SelectTrigger className={isViewMode ? "bg-gray-50" : ""}>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Direct Debit">Direct Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sumAssured">Sum Assured</Label>
              <Input
                id="sumAssured"
                type="number"
                step="0.01"
                value={formData.a9 || 0}
                onChange={(e) => handleChange("a9", parseFloat(e.target.value) || 0)}
                disabled={isViewMode}
                className={isViewMode ? "bg-gray-50 font-medium" : ""}
              />
            </div>

            <div>
              <Label htmlFor="policyStatus">Policy Status</Label>
              <Input
                id="policyStatus"
                value={formData.field2 || "IN FORCE"}
                onChange={(e) => handleChange("field2", e.target.value)}
                disabled={isViewMode}
                className={isViewMode ? "bg-gray-50 font-medium text-green-600" : ""}
              />
            </div>

            <div>
              <Label htmlFor="subRisk">Cover Name</Label>
              <Input
                id="subRisk"
                value={formData.subRisk || ""}
                onChange={(e) => handleChange("subRisk", e.target.value)}
                placeholder="Enter cover name"
                disabled={isViewMode}
                className={isViewMode ? "bg-gray-50" : ""}
              />
            </div>

            <div>
              <Label htmlFor="leader">Financial Planner</Label>
              <Input
                id="leader"
                value={formData.leader || ""}
                onChange={(e) => handleChange("leader", e.target.value)}
                placeholder="Enter financial planner"
                disabled={isViewMode}
                className={isViewMode ? "bg-gray-50" : ""}
              />
            </div>

            <div>
              <Label htmlFor="brcode">Branch</Label>
              <Input
                id="brcode"
                value={formData.brcode || ""}
                onChange={(e) => handleChange("brcode", e.target.value)}
                placeholder="Enter branch code"
                disabled={isViewMode}
                className={isViewMode ? "bg-gray-50" : ""}
              />
            </div>

            <div>
              <Label htmlFor="regularSaving">Regular Saving</Label>
              <Input
                id="regularSaving"
                type="number"
                step="0.01"
                value={formData.field8 || 0}
                onChange={(e) => handleChange("field8", parseFloat(e.target.value) || 0)}
                disabled={isViewMode}
                className={isViewMode ? "bg-gray-50" : ""}
              />
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT DETAILS */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <SectionHeader
          title="Payment Details"
          icon={<NairaIcon className="w-4 h-4" />}
          borderColor="border-purple-200"
          badge="Calculated"
          badgeColor="purple"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div>
            <Label htmlFor="totalContributed">Total Contributed</Label>
            <Input
              id="totalContributed"
              type="number"
              step="0.01"
              value={formData.a5 || 0}
              onChange={(e) => handleChange("a5", parseFloat(e.target.value) || 0)}
              disabled={isViewMode}
              className={isViewMode ? "bg-gray-50 font-medium" : ""}
            />
          </div>

          <div>
            <Label htmlFor="amtToInvestment">Amt To Investment</Label>
            <Input
              id="amtToInvestment"
              type="number"
              step="0.01"
              value={formData.field12 || 0}
              onChange={(e) => handleChange("field12", parseFloat(e.target.value) || 0)}
              disabled={isViewMode}
              className={isViewMode ? "bg-gray-50" : ""}
            />
          </div>

          <div>
            <Label htmlFor="yearToDateInterest">Year To Date Interest</Label>
            <Input
              id="yearToDateInterest"
              type="number"
              step="0.01"
              value={formData.field9 || 0}
              onChange={(e) => handleChange("field9", parseFloat(e.target.value) || 0)}
              disabled={isViewMode}
              className={isViewMode ? "bg-gray-50" : ""}
            />
          </div>

          <div>
            <Label htmlFor="lifeCoverAmount">Life Cover Amount</Label>
            <Input
              id="lifeCoverAmount"
              type="number"
              step="0.01"
              value={formData.a9 || 0}
              onChange={(e) => handleChange("a9", parseFloat(e.target.value) || 0)}
              disabled={isViewMode}
              className={isViewMode ? "bg-gray-50" : ""}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="grossTotalBalance">Gross Total Balance</Label>
            <Input
              id="grossTotalBalance"
              value={`${(parseFloat(formData.a5 || 0) + parseFloat(formData.a6 || 0)).toFixed(2)}`}
              disabled
              className="bg-gray-50 font-bold text-blue-700 text-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== PAYMENT DETAILS TAB ====================

const PaymentDetailsTab: React.FC<{
  formData: Partial<ClaimReserve>;
  handleChange: (key: keyof ClaimReserve, value: any) => void;
  isViewMode: boolean;
  errors: Record<string, string>;
  lossType?: string;
}> = ({ formData, handleChange, isViewMode, errors, lossType }) => {
  const { toast } = useToast();

  const isDeathBenefit = lossType === "DB";
  const isSurrenderClaim = lossType === "SV";
  const isMaturityClaim = lossType === "MV";
  const isPartialWithdrawal = lossType === "PWD";

  const [isFetchingRate, setIsFetchingRate] = useState(false);

  const totalContributed = parseFloat(formData.a5 || 0);
  const interestEarned = parseFloat(formData.a6 || 0);
  const totalBalance = totalContributed + interestEarned;
  const lifeCoverAmount = parseFloat(formData.a9 || 0);
  const outstandingLoans = parseFloat(formData.a7 || 0);
  const approvedLoanAmt = parseFloat(formData.a8 || 0);

  const surrenderValueRate = parseFloat(formData.field13 || 0);
  const surrenderValue = parseFloat(formData.field14 || 0);
  const penaltyCharge = parseFloat(formData.field15 || 0);

  const withdrawalPercentage = parseFloat(formData.field16 || 0);
  const withdrawalInstalmentType = formData.field17 || "";
  const withdrawalAmount = parseFloat(formData.field18 || 0);

  let netWithdrawal = 0;
  if (isSurrenderClaim) {
    netWithdrawal = withdrawalAmount;
  } else {
    netWithdrawal = totalBalance - outstandingLoans - approvedLoanAmt - (isDeathBenefit ? penaltyCharge : 0);
  }

  const calcLoanInterest = parseFloat(formData.field4 || 0);
  const outstandingLoanInterest = parseFloat(formData.field11 || 0);
  const outstandingPremium = parseFloat(formData.field5 || 0);
  const bonus = parseFloat(formData.field6 || 0);
  const whtOnInterest = parseFloat(formData.field7 || 0);
  const otherDeductions = parseFloat(formData.field10 || 0);

  let netPayable = 0;
  if (isSurrenderClaim) {
    netPayable = withdrawalAmount;
  } else {
    netPayable = netWithdrawal - otherDeductions - outstandingPremium + bonus - whtOnInterest;
  }

  const fetchExchangeRate = async (fromCurrency: string, toCurrency: string = "NGN") => {
    if (!fromCurrency || fromCurrency === "NAIRA") {
      handleChange("propRate", 1);
      return;
    }

    setIsFetchingRate(true);
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      if (!response.ok) throw new Error("Failed to fetch exchange rate");
      const data = await response.json();
      const rate = data.rates[toCurrency] || 1;
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

  const handleCurrencyChange = (currency: string) => {
    handleChange("field12", currency);
    if (currency && currency !== "NAIRA") {
      fetchExchangeRate(currency);
    } else {
      handleChange("propRate", 1);
    }
  };

  const handleReCalc = () => {
    toast({
      title: "Recalculated",
      description: "All values have been recalculated",
      variant: "default",
    });
  };

  return (
    <div className="space-y-6">
      {/* PAYABLE AMOUNT */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <SectionHeader
          title="Payable Amount"
          icon={<Calculator className="w-4 h-4" />}
          borderColor="border-blue-200"
          badge="Auto-calculated"
          badgeColor="blue"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="md:col-span-2">
            <Label htmlFor="claimDescription">Claim Description</Label>
            <Input
              id="claimDescription"
              value={formData.lossDetails || "Policy Maturity claims in respect of the policy"}
              disabled
              className="bg-gray-50"
            />
          </div>

          {isDeathBenefit && (
            <>
              <div>
                <Label htmlFor="surrenderValueRate">Surrender Value Rate</Label>
                <Input
                  id="surrenderValueRate"
                  type="number"
                  step="0.01"
                  value={surrenderValueRate}
                  onChange={(e) => handleChange("field13", parseFloat(e.target.value) || 0)}
                  disabled={isViewMode}
                  className={isViewMode ? "bg-gray-50" : ""}
                  placeholder="Enter surrender value rate"
                />
              </div>

              <div>
                <Label htmlFor="surrenderValue">Surrender Value</Label>
                <Input
                  id="surrenderValue"
                  type="number"
                  step="0.01"
                  value={surrenderValue}
                  onChange={(e) => handleChange("field14", parseFloat(e.target.value) || 0)}
                  disabled={isViewMode}
                  className={isViewMode ? "bg-gray-50" : ""}
                  placeholder="Enter surrender value"
                />
              </div>

              <div>
                <Label htmlFor="penaltyCharge">Penalty Charge</Label>
                <Input
                  id="penaltyCharge"
                  type="number"
                  step="0.01"
                  value={penaltyCharge}
                  onChange={(e) => handleChange("field15", parseFloat(e.target.value) || 0)}
                  disabled={isViewMode}
                  className={isViewMode ? "bg-gray-50" : ""}
                  placeholder="Enter penalty charge"
                />
              </div>

              <div>
                <Label htmlFor="interestEarn">Interest Earn</Label>
                <Input
                  id="interestEarn"
                  type="number"
                  step="0.01"
                  value={interestEarned}
                  onChange={(e) => handleChange("a6", parseFloat(e.target.value) || 0)}
                  disabled={isViewMode}
                  className={isViewMode ? "bg-gray-50" : ""}
                  placeholder="Enter interest earned"
                />
              </div>
            </>
          )}

          {isSurrenderClaim && (
            <>
              <div>
                <Label htmlFor="withdrawalPercentage">Withdrawal (%)</Label>
                <Input
                  id="withdrawalPercentage"
                  type="number"
                  step="0.01"
                  value={withdrawalPercentage}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleChange("field16", val);
                    const amount = (totalBalance * val) / 100;
                    handleChange("field18", amount);
                  }}
                  disabled={isViewMode}
                  className={isViewMode ? "bg-gray-50" : ""}
                  placeholder="Enter withdrawal percentage"
                />
              </div>

              <div>
                <Label htmlFor="withdrawalInstalmentType">Withdrawal Instalment Type</Label>
                <Select
                  value={withdrawalInstalmentType}
                  onValueChange={(value) => handleChange("field17", value)}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={isViewMode ? "bg-gray-50" : ""}>
                    <SelectValue placeholder="- select -" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="withdrawalAmount">Withdrawal Amount</Label>
                <Input
                  id="withdrawalAmount"
                  type="number"
                  step="0.01"
                  value={withdrawalAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleChange("field18", val);
                    if (totalBalance > 0) {
                      const percent = (val / totalBalance) * 100;
                      handleChange("field16", percent);
                    }
                  }}
                  disabled={isViewMode}
                  className={isViewMode ? "bg-gray-50 font-bold" : ""}
                  placeholder="Enter withdrawal amount"
                />
              </div>
            </>
          )}

          {!isSurrenderClaim && (
            <div>
              <Label htmlFor="approvedLoanAmt">Approved Loan Amt</Label>
              <Input
                id="approvedLoanAmt"
                type="number"
                step="0.01"
                value={approvedLoanAmt}
                onChange={(e) => handleChange("a8", parseFloat(e.target.value) || 0)}
                disabled={isViewMode}
                className={isViewMode ? "bg-gray-50" : ""}
              />
            </div>
          )}

          {!isSurrenderClaim && (
            <div>
              <Label htmlFor="outstandingLoans">Outstanding Loans</Label>
              <Input
                id="outstandingLoans"
                type="number"
                step="0.01"
                value={outstandingLoans}
                onChange={(e) => handleChange("a7", parseFloat(e.target.value) || 0)}
                disabled={isViewMode}
                className={isViewMode ? "bg-gray-50" : ""}
              />
            </div>
          )}

          <div>
            <Label htmlFor="netWithdrawal">Net Withdrawal</Label>
            <Input
              id="netWithdrawal"
              value={`${netWithdrawal.toFixed(2)}`}
              disabled
              className="bg-gray-50 font-bold"
            />
          </div>

          {!isSurrenderClaim && (
            <div>
              <Label htmlFor="otherDeductions">Other Deductions</Label>
              <Input
                id="otherDeductions"
                type="number"
                step="0.01"
                value={otherDeductions}
                onChange={(e) => handleChange("field10", parseFloat(e.target.value) || 0)}
                disabled={isViewMode}
                className={isViewMode ? "bg-gray-50" : ""}
              />
            </div>
          )}

          <div className="md:col-span-2">
            <div className="flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReCalc}
                className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                disabled={isViewMode}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                ReCalc
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ADDITIONAL CALCULATIONS */}
      {!isSurrenderClaim && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <SectionHeader
            title="Additional Calculations"
            icon={<TrendingUp className="w-4 h-4" />}
            borderColor="border-yellow-200"
            badge="Summary"
            badgeColor="yellow"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <Label htmlFor="outstandingPremium">Outstanding Premium</Label>
              <Input
                id="outstandingPremium"
                type="number"
                step="0.01"
                value={outstandingPremium}
                onChange={(e) => handleChange("field5", parseFloat(e.target.value) || 0)}
                disabled={isViewMode}
                className={isViewMode ? "bg-gray-50" : ""}
              />
            </div>

            <div>
              <Label htmlFor="bonus">Bonus</Label>
              <Input
                id="bonus"
                type="number"
                step="0.01"
                value={bonus}
                onChange={(e) => handleChange("field6", parseFloat(e.target.value) || 0)}
                disabled={isViewMode}
                className={isViewMode ? "bg-gray-50" : ""}
              />
            </div>

            <div>
              <Label htmlFor="whtOnInterest">WHT On Interest</Label>
              <Input
                id="whtOnInterest"
                type="number"
                step="0.01"
                value={whtOnInterest}
                onChange={(e) => handleChange("field7", parseFloat(e.target.value) || 0)}
                disabled={isViewMode}
                className={isViewMode ? "bg-gray-50" : ""}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="netPayable" className="text-lg font-bold">Net Payable</Label>
              <Input
                id="netPayable"
                value={`${netPayable.toFixed(2)}`}
                disabled
                className="bg-green-50 font-bold text-green-700 text-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* NET PAYABLE FOR SURRENDER CLAIMS */}
      {isSurrenderClaim && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="netPayable" className="text-lg font-bold">Net Payable</Label>
              <Input
                id="netPayable"
                value={`${netPayable.toFixed(2)}`}
                disabled
                className="bg-green-50 font-bold text-green-700 text-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* DV DETAILS */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <SectionHeader
          title="DV Details"
          icon={<NairaIcon className="w-4 h-4" />}
          borderColor="border-purple-200"
          badge="Exchange"
          badgeColor="purple"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div>
            <Label htmlFor="currencyType">Currency Type</Label>
            <Select
              value={formData.field12 || "NAIRA"}
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
                <SelectItem value="AUD">AUD</SelectItem>
                <SelectItem value="JPY">JPY</SelectItem>
                <SelectItem value="CNY">CNY</SelectItem>
                <SelectItem value="ZAR">ZAR</SelectItem>
              </SelectContent>
            </Select>
            {isFetchingRate && (
              <div className="flex items-center mt-1 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Fetching exchange rate...
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="exchangeRate">Exchange Rate</Label>
            <Input
              id="exchangeRate"
              type="number"
              step="0.01"
              value={formData.propRate || 1}
              onChange={(e) => handleChange("propRate", parseFloat(e.target.value) || 1)}
              disabled={isViewMode}
              className={isViewMode ? "bg-gray-50" : ""}
            />
          </div>

          <div>
            <Label htmlFor="adjustedAmountDue">Adjusted Amount Due</Label>
            <Input
              id="adjustedAmountDue"
              type="number"
              step="0.01"
              value={formData.a1 || 0}
              onChange={(e) => handleChange("a1", parseFloat(e.target.value) || 0)}
              disabled={isViewMode}
              className={isViewMode ? "bg-gray-50" : ""}
            />
          </div>

          <div>
            <Label htmlFor="ourLiabilityAmount">Our Liability Amount (Local)</Label>
            <Input
              id="ourLiabilityAmount"
              type="number"
              step="0.01"
              value={formData.a2 || 0}
              onChange={(e) => handleChange("a2", parseFloat(e.target.value) || 0)}
              disabled={isViewMode}
              className={isViewMode ? "bg-gray-50" : ""}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== DOCUMENT UPLOAD TAB ====================

const DocumentUploadTab: React.FC<{
  isViewMode: boolean;
}> = ({ isViewMode }) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{ name: string; size: number; uploadDate: string }>>([]);
  const [transactionStatus, setTransactionStatus] = useState("PENDING");
  const [authorizedBy, setAuthorizedBy] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      setUploadedDocuments([
        ...uploadedDocuments,
        {
          name: selectedFile.name,
          size: selectedFile.size,
          uploadDate: new Date().toLocaleDateString()
        }
      ]);
      setSelectedFile(null);
      const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      toast({
        title: "Document Uploaded",
        description: "Document has been added successfully",
        variant: "default",
      });
    }
  };

  const handleDeleteDocument = (index: number) => {
    setUploadedDocuments(uploadedDocuments.filter((_, i) => i !== index));
    toast({
      title: "Document Deleted",
      description: "Document has been removed",
      variant: "default",
    });
  };

  const handleAddApprovalDocument = () => {
    toast({
      title: "Approval Document Added",
      description: "Document has been sent for approval",
      variant: "default",
    });
  };

  return (
    <div className="space-y-6">
      {/* ADDITIONAL INFO */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <SectionHeader
          title="Additional Info"
          icon={<Upload className="w-4 h-4" />}
          borderColor="border-blue-200"
          badge="Upload"
          badgeColor="blue"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div>
            <Label htmlFor="fileUpload">Upload</Label>
            <div className="flex items-center gap-2">
              <Input
                id="fileUpload"
                type="file"
                onChange={handleFileChange}
                disabled={isViewMode}
                className={isViewMode ? "bg-gray-50" : ""}
              />
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isViewMode}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            {selectedFile && (
              <p className="text-sm text-gray-500 mt-1">Selected: {selectedFile.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="transactionStatus">Transaction Status</Label>
            <Select
              value={transactionStatus}
              onValueChange={setTransactionStatus}
              disabled={isViewMode}
            >
              <SelectTrigger className={isViewMode ? "bg-gray-50" : ""}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">PENDING</SelectItem>
                <SelectItem value="APPROVED">APPROVED</SelectItem>
                <SelectItem value="REJECTED">REJECTED</SelectItem>
                <SelectItem value="PROCESSING">PROCESSING</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="authorizedBy">Authorized By</Label>
            <Select
              value={authorizedBy}
              onValueChange={setAuthorizedBy}
              disabled={isViewMode}
            >
              <SelectTrigger className={isViewMode ? "bg-gray-50" : ""}>
                <SelectValue placeholder="- select -" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager1">Manager 1</SelectItem>
                <SelectItem value="manager2">Manager 2</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleAddApprovalDocument}
              disabled={isViewMode}
              className="bg-green-600 hover:bg-green-700 text-white w-full"
            >
              <FileCheck className="w-4 h-4 mr-2" />
              Add Approval Document
            </Button>
          </div>
        </div>
      </div>

      {/* HELP */}
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
          <li>To notify your Unit Head of the newly created voucher for approval, kindly use the EMAIL ALERT link.</li>
          <li>Verify all added records before you click on SAVE button.</li>
          <li>If you have uploaded a wrong document, kindly use the newly introduced DELETE button below to delete the document.</li>
        </ul>
      </div>

      {/* UPLOADED DOCUMENTS */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <SectionHeader
          title="Uploaded Document Details"
          icon={<FileSpreadsheet className="w-4 h-4" />}
          borderColor="border-gray-300"
          badge={`${uploadedDocuments.length} files`}
          badgeColor="gray"
        />
        {uploadedDocuments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg mt-2">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No documents uploaded yet</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto mt-2">
            <table className="w-full min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Document Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Size</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Upload Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {uploadedDocuments.map((doc, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{doc.name}</td>
                    <td className="px-4 py-3 text-sm">{(doc.size / 1024).toFixed(2)} KB</td>
                    <td className="px-4 py-3 text-sm">{doc.uploadDate}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs bg-transparent border-blue-300 text-blue-700 hover:bg-blue-50"
                          disabled={isViewMode}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Document
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs bg-transparent border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteDocument(index)}
                          disabled={isViewMode}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete File
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BOTTOM ACTIONS */}
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
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isViewMode}
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

interface ClaimFormPageProps {
  mode: "create" | "edit" | "view";
  lossType?: string;
}

const ClaimFormPage: React.FC<ClaimFormPageProps> = ({ mode, lossType }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("details");

  const mapLossTypeToCode = (type: string): string => {
    const mapping: Record<string, string> = {
      'surrender': 'SV',
      'maturity': 'MV',
      'death-benefit': 'DB',
      'partial-withdrawal': 'PWD',
      'db': 'DB',
      'mv': 'MV',
      'sv': 'SV',
      'pwd': 'PWD'
    };
    return mapping[type?.toLowerCase()] || type || '';
  };

  const params = useParams<{ lossType?: string }>();
  const urlLossType = params.lossType || '';
  const effectiveLossType = lossType || mapLossTypeToCode(urlLossType);

  const returnPath = location.state?.returnPath ||
    (effectiveLossType ? `/claims/individual/${urlLossType || effectiveLossType.toLowerCase()}` : "/claims/overview");

  const currentReserve = useSelector(selectCurrentReserve);
  const loading = useSelector(selectCurrentLoading);
  const error = useSelector(selectCurrentError);

  const policiesFromRedux = useSelector(selectAllPolicies);
  const policyLoadingFromRedux = useSelector(selectPoliciesLoading);
  const policyErrorFromRedux = useSelector(selectPoliciesError);

  const [policies, setPolicies] = useState<ApiDropdownOption[]>([]);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<ApiDropdownOption | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState<Partial<ClaimReserve>>({
    claimID: 0,
    claimNo: "",
    brcode: "",
    policyNo: "",
    coPolicyNo: "",
    refDNCNNo: "",
    insuredName: "",
    insuredID: "",
    lossType: effectiveLossType || "",
    lossDetails: "",
    lossDate: "",
    startDate: "",
    endDate: "",
    subRiskID: "",
    subRisk: "",
    partyID: "",
    party: "",
    leadID: "",
    leader: "",
    propType: "",
    leadProp: 0,
    propRate: 1,
    undYear: 0,
    detailID: 0,
    approval: 0,
    deleted: 0,
    active: 1,
    amtReserved: 0,
    amtPaid: 0,
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
    field13: "",
    field14: "",
    field15: "",
    field16: "",
    field17: "",
    field18: "",
    a1: 0,
    a2: 0,
    a3: 0,
    a4: 0,
    a5: 0,
    a6: 0,
    a7: 0,
    a8: 0,
    a9: 0,
    submittedBy: "",
    submittedOn: "",
    modifiedBy: "",
    modifiedOn: "",
    approvedBy: "",
    approvedOn: "",
    entryDate: "",
    notifiedDate: "",
  });

  const hasSelectedPolicy = !!formData.policyNo && formData.policyNo.trim() !== "";

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isCreateMode = mode === "create";

  // ===== FETCH POLICIES =====
  const fetchPolicies = async (searchText: string = "") => {
    if (!isCreateMode) return;

    setPolicyLoading(true);
    setPolicyError(false);

    try {
      const result = await dispatch(searchIndividualPolicies({
        search: searchText || "",
        page: 1,
        pageSize: 50,
        isProposal: false,
      })).unwrap();

      const policyOptions = (result.items || []).map((item: IndividualPolicy) => ({
        id: item.policyNo || item.policyNo,
        name: `${item.policyNo} - ${item.insuredName || 'N/A'}`,
        policyNo: item.policyNo,
        insuredName: item.insuredName,
        coverCode: item.coverCode,
        covertype: item.covertype,
        brCode: item.brCode,
        assuredCode: item.assuredCode,
        tDate: item.tDate,
        startDate: item.startDate,
        maturityDate: item.maturityDate,
        sumAssured: item.sumAssured,
        basicPremium: item.basicPremium,
        status: item.status,
        isProposal: item.isProposal,
        subRisk: item.covertype || item.coverCode,
        subRiskId: item.coverCode,
        faceAmount: item.sumAssured,
        lifeCoverAmount: item.sumAssured,
        monthlyPremium: item.basicPremium,
        regularSaving: item.basicPremium,
        policyStatus: item.status,
      }));

      setPolicies(policyOptions);
      setPolicyError(false);

    } catch (error: any) {
      console.error("Error fetching policies:", error);
      setPolicyError(true);
      toast({
        title: "Error",
        description: error || "Failed to load policies. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPolicyLoading(false);
    }
  };

  const handlePolicySearch = (searchText: string) => {
    setSearchTerm(searchText);
    const debounceTimer = setTimeout(() => {
      fetchPolicies(searchText);
    }, 500);
    return () => clearTimeout(debounceTimer);
  };

  // ===== EFFECTS =====

  useEffect(() => {
    if (isCreateMode) {
      fetchPolicies("");
    }
  }, [isCreateMode]);

  useEffect(() => {
    if (isCreateMode && policiesFromRedux.length > 0) {
      const transformed = policiesFromRedux.map((item: IndividualPolicy) => ({
        id: item.policyNo || item.policyNo,
        name: `${item.policyNo} - ${item.insuredName || 'N/A'}`,
        policyNo: item.policyNo,
        insuredName: item.insuredName,
        coverCode: item.coverCode,
        covertype: item.covertype,
        brCode: item.brCode,
        assuredCode: item.assuredCode,
        tDate: item.tDate,
        startDate: item.startDate,
        maturityDate: item.maturityDate,
        sumAssured: item.sumAssured,
        basicPremium: item.basicPremium,
        status: item.status,
        isProposal: item.isProposal,
        subRisk: item.covertype || item.coverCode,
        subRiskId: item.coverCode,
        faceAmount: item.sumAssured,
        lifeCoverAmount: item.sumAssured,
        monthlyPremium: item.basicPremium,
        regularSaving: item.basicPremium,
        policyStatus: item.status,
      }));
      setPolicies(transformed);
    }
  }, [policiesFromRedux, isCreateMode]);

  useEffect(() => {
    if (isCreateMode) {
      setPolicyLoading(policyLoadingFromRedux);
      setPolicyError(!!policyErrorFromRedux);
    }
  }, [policyLoadingFromRedux, policyErrorFromRedux, isCreateMode]);

  useEffect(() => {
    if ((isEditMode || isViewMode) && id) {
      dispatch(fetchClaimReserveById(parseInt(id)));
    }
  }, [isEditMode, isViewMode, id, dispatch]);

  useEffect(() => {
    if ((isEditMode || isViewMode) && currentReserve) {
      setFormData({
        claimID: currentReserve.claimID,
        claimNo: currentReserve.claimNo || "",
        policyNo: currentReserve.policyNo || "",
        insuredName: currentReserve.insuredName || "",
        lossType: currentReserve.lossType || "",
        lossDetails: currentReserve.lossDetails || "",
        lossDate: currentReserve.lossDate || new Date().toISOString().split("T")[0],
        amtReserved: currentReserve.amtReserved || 0,
        amtPaid: currentReserve.amtPaid || 0,
        brcode: currentReserve.brcode || "",
        coPolicyNo: currentReserve.coPolicyNo || "",
        refDNCNNo: currentReserve.refDNCNNo || "",
        propRate: currentReserve.propRate || 1,
        undYear: currentReserve.undYear || 0,
        startDate: currentReserve.startDate || "",
        endDate: currentReserve.endDate || "",
        subRiskID: currentReserve.subRiskID || "",
        subRisk: currentReserve.subRisk || "",
        partyID: currentReserve.partyID || "",
        party: currentReserve.party || "",
        insuredID: currentReserve.insuredID || "",
        detailID: currentReserve.detailID || 0,
        approval: currentReserve.approval || 0,
        active: currentReserve.active || 1,
        leadID: currentReserve.leadID || "",
        leader: currentReserve.leader || "",
        propType: currentReserve.propType || "",
        leadProp: currentReserve.leadProp || 0,
        field1: currentReserve.field1 || "",
        field2: currentReserve.field2 || "IN FORCE",
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
        field13: currentReserve.field13 || "",
        field14: currentReserve.field14 || "",
        field15: currentReserve.field15 || "",
        a1: currentReserve.a1 || 0,
        a2: currentReserve.a2 || 0,
        a3: currentReserve.a3 || 0,
        a4: currentReserve.a4 || 0,
        a5: currentReserve.a5 || 0,
        a6: currentReserve.a6 || 0,
        a7: currentReserve.a7 || 0,
        a8: currentReserve.a8 || 0,
        a9: currentReserve.a9 || 0,
        entryDate: currentReserve.entryDate || "",
        notifiedDate: currentReserve.notifiedDate || "",
      });
    }
  }, [isEditMode, isViewMode, currentReserve]);

  useEffect(() => {
    return () => {
      dispatch(clearCurrentError());
    };
  }, [dispatch]);

  // ===== HANDLERS =====

  const handlePolicySelect = (policy: ApiDropdownOption) => {
    if (!isCreateMode) return;

    setSelectedPolicy(policy);

    setFormData((prev) => ({
      ...prev,
      policyNo: policy.policyNo || policy.id || "",
      insuredName: policy.insuredName || "",
      insuredID: policy.assuredCode || "",
      subRisk: policy.covertype || policy.subRisk || "",
      subRiskID: policy.coverCode || policy.subRiskId || "",
      brcode: policy.brCode || "",
      startDate: policy.startDate
        ? new Date(policy.startDate).toISOString().split("T")[0]
        : "",
      endDate: policy.maturityDate
        ? new Date(policy.maturityDate).toISOString().split("T")[0]
        : "",
      a9: policy.sumAssured || policy.faceAmount || policy.lifeCoverAmount || 0,
      a5: policy.totalContribution || 0,
      a6: policy.interestEarned || 0,
      field1: "",
      field2: policy.policyStatus || policy.status || "IN FORCE",
      field3: "Transfer",
      field8: policy.basicPremium || policy.monthlyPremium || policy.regularSaving || 0,
      field9: policy.yearToDateInterest || 0,
      coPolicyNo: policy.coPolicyNo || "",
      leader: policy.financialPlanner || "",
      party: policy.partyName || "",
      partyID: policy.partyId || "",
      propType: policy.covertype || policy.productType || "",
      propRate: 1,
    }));

    toast({
      title: "Policy Loaded Successfully",
      description: `Policy ${policy.policyNo} - ${policy.insuredName} loaded with all details`,
      duration: 3000,
    });
  };

  const validate = () => {
    if (isViewMode) return true;

    const newErrors: Record<string, string> = {};

    if (!formData.policyNo?.trim()) {
      newErrors.policyNo = "Policy number is required";
    }
    if (!formData.insuredName?.trim()) {
      newErrors.insuredName = "Insured name is required";
    }
    if (!formData.lossType) {
      newErrors.lossType = "Loss type is required";
    }
    if (!formData.lossDate) {
      newErrors.lossDate = "Loss date is required";
    }

    if ((formData.amtReserved || 0) < 0) {
      newErrors.amtReserved = "Amount reserved cannot be negative";
    }
    if ((formData.amtPaid || 0) < 0) {
      newErrors.amtPaid = "Amount paid cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isViewMode) return;

    const isValid = validate();
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const toIso = (d?: string) =>
        d ? new Date(d).toISOString() : new Date().toISOString();

      const submitData = {
        claimID: Number(formData.claimID) || 0,
        brCode: formData.brcode || "",
        claimNo: formData.claimNo || "",
        policyNo: formData.policyNo || "",
        dncnNo: formData.refDNCNNo || "",
        unitID: formData.unitID || "",
        underYr: Number(formData.undYear) || 0,
        recType: formData.recType || "CLAIM",
        insuredName: formData.insuredName || "",
        startDate: toIso(formData.startDate),
        endDate: toIso(formData.endDate),
        renDate: toIso(formData.renDate),
        subRiskCode: formData.subRiskID || "",
        subRiskName: formData.subRisk || "",
        partyCode: formData.partyID || "",
        insuredCode: formData.insuredID || "",
        tDate: toIso(formData.entryDate),
        notifyDate: toIso(formData.notifiedDate),
        lossDate: toIso(formData.lossDate),
        lossDetails: formData.lossDetails || "",
        amount: Number(formData.amtReserved) || 0,
        paidAmt: Number(formData.amtPaid) || 0,
        adjAmt: Number(formData.adjAmt) || 0,
        a1: Number(formData.a1) || 0,
        a2: Number(formData.a2) || 0,
        a3: Number(formData.a3) || 0,
        a4: Number(formData.a4) || 0,
        a5: Number(formData.a5) || 0,
        a6: Number(formData.a6) || 0,
        a7: Number(formData.a7) || 0,
        a8: Number(formData.a8) || 0,
        a9: Number(formData.a9) || 0,
        a10: 0, a11: 0, a12: 0, a13: 0, a14: 0, a15: 0,
        d1: 0, d2: 0, d3: 0,
        vehRegNo: 0,
        submitBy: formData.submittedBy || "",
        submitOn: formData.submittedOn || new Date().toISOString(),
        modifiedBy: formData.modifiedBy || "",
        modifiedOn: formData.modifiedOn || new Date().toISOString(),
        approvedBy: formData.approvedBy || "",
        approvedOn: formData.approvedOn || new Date().toISOString(),
        transGUID: formData.transGUID || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : ""),
        transSTATUS: formData.transSTATUS || "PENDING",
        remark: formData.remark || "",
        tag: formData.tag || "",
      };

      if (isCreateMode) {
        await dispatch(insertClaimReserve(submitData)).unwrap();
        toast({
          title: "Claim Created",
          description: "Claim has been created successfully!",
          variant: "default",
        });
      } else if (isEditMode && formData.claimID) {
        await dispatch(updateClaimReserve({
          id: formData.claimID,
          data: submitData
        })).unwrap();
        toast({
          title: "Claim Updated",
          description: "Claim has been updated successfully!",
          variant: "default",
        });
      }

      navigate(returnPath);
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to save claim",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (key: keyof ClaimReserve, value: any) => {
    if (isViewMode) return;

    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleCancel = () => {
    navigate(returnPath);
  };

  const handleRefreshPolicies = () => {
    if (isCreateMode) {
      fetchPolicies(searchTerm);
      toast({
        title: "Refreshing Policies",
        description: "Fetching latest policy data...",
        duration: 2000,
      });
    }
  };

  // ===== HELPERS =====

  const getLossTypeOptions = () => {
    const options = [
      { label: "Maturity Claims", value: "MV" },
      { label: "Death Benefit Claims", value: "DB" },
      { label: "Partial Withdrawal Claims", value: "PWD" },
      { label: "Surrender Claims ", value: "SV" },
    ];

    if (effectiveLossType) {
      return options.filter(opt => opt.value === effectiveLossType);
    }
    return options;
  };

  const lossTypeOptions = getLossTypeOptions();

  const getPageTitle = () => {
    const allOptions = [
      { label: "Maturity Claims", value: "MV" },
      { label: "Death Benefit Claims", value: "DB" },
      { label: "Partial Withdrawal Claims", value: "PWD" },
      { label: "Surrender Claims", value: "SV" },
    ];
    const lossTypeLabel = allOptions.find(opt => opt.value === effectiveLossType)?.label || effectiveLossType || 'Claim';
    if (isViewMode) return `${lossTypeLabel} Details`;
    if (isEditMode) return `Edit ${lossTypeLabel}`;
    return `New ${lossTypeLabel}`;
  };

  const getPageSubtitle = () => {
    if (isViewMode) return "View complete claim details and history";
    if (isEditMode) return "Update claim information and details";
    return "Fill in the details to create a new claim";
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
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleCancel}
              >
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
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="bg-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
              <p className="text-sm text-gray-500 mt-1">{getPageSubtitle()}</p>
            </div>
          </div>
          <div className="flex gap-2 w-10 md:w-auto">
            {isViewMode && (
              <Button
                onClick={() => {
                  navigate(`/claims/individual/claim/edit/${id}`, {
                    state: { returnPath: returnPath }
                  });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white w-10 md:w-auto"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Claim
              </Button>
            )}
            {!isViewMode && (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="bg-white w-10 md:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-10 md:w-auto"
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

        {/* STATUS BADGE */}
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

        {/* MAIN FORM CARD */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {lossTypeOptions.find(opt => opt.value === effectiveLossType)?.label || effectiveLossType || 'Claim'} Management
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

              <TabsContent value="details" className="animate-in slide-in-from-top-3 fade-in duration-300">
                <ClaimDetailsTab
                  formData={formData}
                  handleChange={handleChange}
                  isViewMode={isViewMode}
                  isCreateMode={isCreateMode}
                  isEditMode={isEditMode}
                  hasSelectedPolicy={hasSelectedPolicy}
                  errors={errors}
                  policies={policies}
                  policyLoading={policyLoading}
                  policyError={policyError}
                  handlePolicySelect={handlePolicySelect}
                  lossTypeOptions={lossTypeOptions}
                />
              </TabsContent>

              <TabsContent value="payment" className="animate-in slide-in-from-top-3 fade-in duration-300">
                <PaymentDetailsTab
                  formData={formData}
                  handleChange={handleChange}
                  isViewMode={isViewMode}
                  errors={errors}
                  lossType={effectiveLossType}
                />
              </TabsContent>

              <TabsContent value="documents" className="animate-in slide-in-from-top-3 fade-in duration-300">
                <DocumentUploadTab isViewMode={isViewMode} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClaimFormPage;