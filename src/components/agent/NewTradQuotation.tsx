//@ts-nocheck
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../UI/card";
import { Input } from "../UI/new-input";
import { Button } from "../UI/new-button";
import { cn } from "../../utils/class-names";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../UI/new-select";
import {
  CalendarIcon,
  Plus,
  Calculator,
  FileText,
  User,
  TrendingUp,
  Loader2,
  CheckCircle,
  Eye,
  Trash2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Info,
  ChevronsUpDown,
  Check,
  XCircle,
} from "lucide-react";
import { DOBCalendar } from "../UI/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../UI/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../UI/command";
import { format } from "date-fns";
import { useToast } from "../UI/use-toast";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  OutsideDismissDialog,
} from "../UI/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../UI/alert-dialog";
import { Alert, AlertDescription } from "../UI/alert";
import {
  calculateTradQuotation,
  getFilteredQuotations,
  getProducts,
  getBranches,
  deleteQuotation,
  getProductSettings,
  type FilteredQuotationData,
  type Product,
  type Branch,
  type TradQuotationCalculateResponse,
  previewTradQuotation,
} from "../../types/quotation";

import { getRates } from "../../api/quotation";
import { SERVER_URL } from "../../utils/constants";

type CustomerSearchResult = {
  customerID: string;
  firstName?: string | null;
  lastName?: string | null;
  otherName?: string | null;
  phoneLine1?: string | null;
  phoneLine2?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  assuredCode?: string | null;
  assuredcode?: string | null;
  customerCode?: string | null;
  customerId?: string | null;
  assured_id?: string | null;
};
const NewTradQuotation = () => {
  const { toast } = useToast();
  const [quotationDate, setQuotationDate] = useState<Date>(new Date());
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [showDOBCalendar, setShowDOBCalendar] = useState(false);
  const [showQuotationCalendar, setShowQuotationCalendar] = useState(false);
  const [showBranchCombobox, setShowBranchCombobox] = useState(false);
  const [showQuotationInfo, setShowQuotationInfo] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoadingQuotations, setIsLoadingQuotations] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [quotations, setQuotations] = useState<FilteredQuotationData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentQuoteNo, setCurrentQuoteNo] = useState<string>("");
  const [viewingQuotation, setViewingQuotation] =
    useState<FilteredQuotationData | null>(null);
  const [deletingQuotation, setDeletingQuotation] =
    useState<FilteredQuotationData | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [calculationResult, setCalculationResult] =
    useState<TradQuotationCalculateResponse | null>(null);
  const [calculationMode, setCalculationMode] = useState<
    "premium" | "sumAssured" | null
  >(null);

  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [premiumRate, setPremiumRate] = useState<number | null>(null);
  const [bonus, setBonus] = useState<number | null>(null);
  const [isLoadingBonus, setIsLoadingBonus] = useState(false);

  const [formData, setFormData] = useState({
    quotationNumber: "",
    locationBranch: "",
    firstName: "",
    lastName: "",
    mobilePhone: "",
    planType: "",
    emailAddress: "",
    age: "",
    frequencyOfPayment: "",
    duration: "",
    regularSaving: "",
    rateCode: "",
    rate: "",
    firstPremium: "",
    sumAssured: "",
    remark: "",
    assuredCode: "",
  });
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<
    CustomerSearchResult[]
  >([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerSearchResult | null>(null);
  const [agentCode, setAgentCode] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("agentId") || "";
    }
    return "";
  });
  const customerSearchAbortRef = useRef<AbortController | null>(null);
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isTouched, setIsTouched] = useState({
    mobilePhone: false,
    emailAddress: false,
  });

  // Nigerian phone number validation - FIXED VERSION
  const validatePhoneNumber = (
    phone: string,
  ): { isValid: boolean; error: string } => {
    const cleanPhone = phone.replace(/\D/g, "");

    if (!cleanPhone)
      return { isValid: false, error: "Phone number is required" };
    if (cleanPhone.length !== 11)
      return { isValid: false, error: "Phone number must be 11 digits" };

    // Fixed Nigerian phone number regex - allows all valid prefixes
    const nigeriaPhoneRegex = /^(0)(70|80|81|90|91)\d{8}$/;
    if (!nigeriaPhoneRegex.test(cleanPhone)) {
      return {
        isValid: false,
        error:
          "Please enter a valid Nigerian phone number starting with 070, 080, 081, 090, or 091",
      };
    }

    return { isValid: true, error: "" };
  };

  // Simple Nigerian phone number formatting (no spaces)
  const formatPhoneNumber = (value: string): string => {
    return value.replace(/\D/g, "").slice(0, 11); // Just keep numbers, max 11 digits
  };

  // Comprehensive email validation
  const validateEmail = (
    email: string,
  ): { isValid: boolean; error: string } => {
    if (!email) return { isValid: false, error: "Email is required" };

    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(email)) {
      return { isValid: false, error: "Please enter a valid email address" };
    }

    // Check for common disposable email domains
    const disposableDomains = [
      "tempmail.com",
      "throwaway.com",
      "guerrillamail.com",
      "mailinator.com",
    ];
    const domainPart = email.split("@")[1]?.toLowerCase();
    if (domainPart && disposableDomains.includes(domainPart)) {
      return {
        isValid: false,
        error: "Disposable email addresses are not allowed",
      };
    }

    return { isValid: true, error: "" };
  };

  const handlePhoneChange = (value: string) => {
    const formattedValue = formatPhoneNumber(value);
    handleInputChange("mobilePhone", formattedValue);

    if (isTouched.mobilePhone) {
      const validation = validatePhoneNumber(formattedValue);
      setPhoneError(validation.error);
    }
  };

  const handleEmailChange = (value: string) => {
    handleInputChange("emailAddress", value);

    if (isTouched.emailAddress) {
      const validation = validateEmail(value);
      setEmailError(validation.error);
    }
  };

  const handleBlur = (field: "mobilePhone" | "emailAddress") => {
    setIsTouched((prev) => ({ ...prev, [field]: true }));

    if (field === "mobilePhone") {
      const validation = validatePhoneNumber(formData.mobilePhone);
      setPhoneError(validation.error);
    } else if (field === "emailAddress") {
      const validation = validateEmail(formData.emailAddress);
      setEmailError(validation.error);
    }
  };

  const fetchRates = async () => {
    // Check if all required fields are filled
    if (
      !formData.age ||
      !formData.duration ||
      !formData.rateCode ||
      !formData.planType
    ) {
      console.log("Missing required fields for fetching rates");
      return;
    }

    setIsLoadingRates(true);
    try {
      // Determine remark value based on plan type
      const remarkValue =
        (formData.planType === "FFP" || formData.planType === "TAS") &&
        formData.remark
          ? formData.remark
          : "PREMIUM";

      console.log("Fetching rates with params:", {
        age: parseInt(formData.age),
        duration: parseFloat(formData.duration),
        rateCode: formData.rateCode,
        productCode: formData.planType,
        remark: remarkValue,
      });

      const data = await getRates(
        parseInt(formData.age),
        parseFloat(formData.duration),
        formData.rateCode,
        formData.planType,
        remarkValue,
      );

      console.log("Rate fetched:", data);

      // Store the premium rate
      if (data && typeof data.premiumRate === "number") {
        setPremiumRate(data.premiumRate);
        // Auto-populate the rate field
        setFormData((prev) => ({
          ...prev,
          rate: data.premiumRate.toString(),
        }));
      }
    } catch (error: any) {
      console.error("Rates Fetch Error:", error);
      toast({
        title: "Info",
        description:
          "An error occurred while fetching rates. Please ensure all required fields are correctly filled.",
      });
    } finally {
      setIsLoadingRates(false);
    }
  };

  const fetchBonus = async () => {
    if (!formData.planType || formData.planType !== "FFP") {
      return;
    }

    setIsLoadingBonus(true);
    try {
      console.log("Fetching bonus for product:", formData.planType);

      // Call the getProductSettings API
      const data = await getProductSettings();

      console.log("Product settings data:", data);

      // Find the product settings for FFP using productID
      const ffpSettings = data.find(
        (setting: any) =>
          setting.productID === "FFP" || setting.productId === "FFP",
      );

      console.log("FFP Settings found:", ffpSettings);

      if (ffpSettings && typeof ffpSettings.a1 === "number") {
        setBonus(ffpSettings.a1);
        console.log("Bonus (a1) fetched:", ffpSettings.a1);
      } else {
        setBonus(null);
        console.log("No bonus found for FFP product", ffpSettings);
      }
    } catch (error: any) {
      console.error("Bonus Fetch Error:", error);
      toast({
        title: "Info",
        description: "Could not fetch bonus information",
      });
      setBonus(null);
    } finally {
      setIsLoadingBonus(false);
    }
  };

  // useEffect to fetch rates when required fields change
  useEffect(() => {
    if (
      formData.age &&
      formData.duration &&
      formData.rateCode &&
      formData.planType
    ) {
      // Add a small delay to avoid too many API calls
      const timeoutId = setTimeout(() => {
        fetchRates();
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      // Reset rate if required fields are missing
      setPremiumRate(null);
      setFormData((prev) => ({ ...prev, rate: "" }));
    }
  }, [
    formData.age,
    formData.duration,
    formData.rateCode,
    formData.planType,
    formData.remark,
  ]);

  // useEffect to fetch bonus when planType changes to FFP
  useEffect(() => {
    if (formData.planType === "FFP") {
      fetchBonus();
    } else {
      // Reset bonus if not FFP
      setBonus(null);
    }
  }, [formData.planType]);

  const formatTo2Dp = (raw: unknown): string => {
    // IMPORTANT: For inputs, keep empty as empty so we don't accidentally
    // treat a cleared field as "filled" (which triggers mutual exclusivity).
    if (raw === null || raw === undefined) return "";
    if (typeof raw === "string" && raw.trim() === "") return "";

    const n = typeof raw === "number" ? raw : Number.parseFloat(String(raw));
    if (Number.isNaN(n) || !Number.isFinite(n)) return "";
    return n.toFixed(2);
  };

  const formatTo2DpOrZero = (raw: unknown): string => {
    const formatted = formatTo2Dp(raw);
    return formatted === "" ? "0.00" : formatted;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Handle mutual exclusivity between firstPremium and sumAssured
    if (field === "firstPremium" && value) {
      setFormData((prev) => ({ ...prev, sumAssured: "" }));
      setCalculationMode("premium");
    } else if (field === "sumAssured" && value) {
      setFormData((prev) => ({ ...prev, firstPremium: "" }));
      setCalculationMode("sumAssured");
    } else if (field === "firstPremium" && !value && !formData.sumAssured) {
      setCalculationMode(null);
    } else if (field === "sumAssured" && !value && !formData.firstPremium) {
      setCalculationMode(null);
    }

    // Automatically set rateCode when frequencyOfPayment changes
    if (field === "frequencyOfPayment" && value) {
      // Map "Annually" to "ANNUAL" for rate code
      const rateCodeValue = value === "Annually" ? "ANNUAL" : value;
      setFormData((prev) => ({ ...prev, rateCode: rateCodeValue }));
    }

    checkFirstSectionComplete();
  };

  const handleFirstNameChange = (value: string) => {
    handleInputChange("firstName", value);
    setCustomerSearchQuery(value);

    if (selectedCustomer) {
      setSelectedCustomer(null);
      setFormData((prev) => ({ ...prev, assuredCode: "" }));
    }

    if (value.trim().length >= 2) {
      setShowCustomerSuggestions(true);
    } else {
      setCustomerResults([]);
      setShowCustomerSuggestions(false);
      setIsSearchingCustomers(false);
      customerSearchAbortRef.current?.abort();
      customerSearchAbortRef.current = null;
    }
  };

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age.toString();
  };

  const handleDOBChange = (date: Date) => {
    setDateOfBirth(date);
    const calculatedAge = calculateAge(date);
    setFormData((prev) => ({ ...prev, age: calculatedAge }));
    setShowDOBCalendar(false);
    checkFirstSectionComplete();
  };

  const resolveAssuredCode = (customer?: CustomerSearchResult | null) => {
    if (!customer) return "";

    const candidates = [
      customer.assuredCode,
      customer.assuredcode,
      customer.customerID,
      customer.customerId,
      customer.customerCode,
      customer.assured_id,
    ];

    for (const value of candidates) {
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    return "";
  };

  const checkFirstSectionComplete = () => {
    const requiredFields = [
      formData.locationBranch,
      formData.firstName,
      formData.lastName,
      formData.mobilePhone,
      formData.planType,
      formData.emailAddress,
      dateOfBirth,
    ];

    const isComplete = requiredFields.every((field) => field && field !== "");

    if (isComplete && !showQuotationInfo) {
      setTimeout(() => setShowQuotationInfo(true), 300);
    } else if (!isComplete && showQuotationInfo) {
      setShowQuotationInfo(false);
    }
  };

  const handleSelectCustomer = (customer: CustomerSearchResult) => {
    const trim = (value?: string | null) => (value ? value.trim() : "");

    // Parse the full name from firstName or lastName field
    const fullNameRaw =
      trim(customer.firstName) || trim(customer.lastName) || "";
    const nameParts = fullNameRaw.split(/\s+/).filter(Boolean);

    let resolvedFirstName = "";
    let resolvedLastName = "";

    if (nameParts.length === 1) {
      // Only one name part
      resolvedFirstName = nameParts[0] || "";
    } else if (nameParts.length === 2) {
      // Two parts: firstName lastName
      resolvedFirstName = nameParts[0] || "";
      resolvedLastName = nameParts[1] || "";
    } else if (nameParts.length >= 3) {
      // Three or more parts: firstName middleName(s) lastName
      resolvedFirstName = nameParts[0] || "";
      resolvedLastName = nameParts[nameParts.length - 1] || "";
    }

    const resolvedPhone =
      trim(customer.phoneLine1) || trim(customer.phoneLine2);
    const resolvedEmail = trim(customer.email);
    const derivedAssuredCode = resolveAssuredCode(customer);

    let parsedDOB: Date | null = null;
    if (customer.dateOfBirth) {
      const date = new Date(customer.dateOfBirth);
      if (!Number.isNaN(date.getTime())) {
        parsedDOB = date;
      }
    }

    if (parsedDOB) {
      setDateOfBirth(parsedDOB);
    }

    setFormData((prev) => ({
      ...prev,
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      mobilePhone: resolvedPhone,
      emailAddress: resolvedEmail,
      assuredCode: derivedAssuredCode,
      ...(parsedDOB ? { age: calculateAge(parsedDOB) } : {}),
    }));

    setCustomerSearchQuery(resolvedFirstName);
    setCustomerResults([]);
    setShowCustomerSuggestions(false);
    setSelectedCustomer({ ...customer, assuredCode: derivedAssuredCode });

    setTimeout(() => {
      checkFirstSectionComplete();
    }, 0);
  };

  const handleCalculate = async () => {
    if (!dateOfBirth) {
      toast({
        title: "Error",
        description: "Please select date of birth",
        variant: "destructive",
      });
      return;
    }

    if (!calculationMode) {
      toast({
        title: "Error",
        description: "Please enter either First Premium or Sum Assured",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);

    try {
      const payload = createCalculationPayload();

      console.log("Previewing traditional quotation with payload:", payload);

      const response: TradQuotationCalculateResponse =
        await previewTradQuotation(payload);

      console.log("Trad preview response (raw):", response);
      console.log(
        "Trad calc firstPremium:",
        response?.firstPremium,
        typeof response?.firstPremium,
      );
      console.log(
        "Trad calc sumAssured:",
        response?.sumAssured,
        typeof response?.sumAssured,
      );
      console.log(
        "Trad calc annualPremium:",
        response?.annualPremium,
        typeof response?.annualPremium,
      );
      console.log("Calculation mode:", calculationMode);

      // Store the calculation result for the summary
      setCalculationResult(response);

      // Update the form with calculated values
      if (calculationMode === "premium") {
        // If user entered premium, update sum assured from response
        const calculatedSumAssured = formatTo2DpOrZero(response.sumAssured);
        console.log("Updating sumAssured to:", calculatedSumAssured);
        setFormData((prev) => ({
          ...prev,
          sumAssured: calculatedSumAssured,
        }));
      } else if (calculationMode === "sumAssured") {
        // If user entered sum assured, update first premium from response
        const calculatedFirstPremium = formatTo2DpOrZero(
          response.firstPremium ?? response.annualPremium,
        );
        console.log("Updating firstPremium to:", calculatedFirstPremium);
        setFormData((prev) => ({
          ...prev,
          firstPremium: calculatedFirstPremium,
        }));
      }

      toast({
        title: "Success",
        description: "Traditional quotation calculated successfully",
      });

      // NOTE: We do NOT set currentQuoteNo from preview because it's not saved yet
      // But we can set it if the preview returns a temp number, though usually we wait for save.
      // For now, let's NOT fetch filtered quotations since it's just a preview.
      // setCurrentQuoteNo(response.quoteNo);
      // setFormData((prev) => ({ ...prev, quotationNumber: response.quoteNo }));
      // fetchFilteredQuotations(response.quoteNo);
    } catch (error: any) {
      console.error("Preview Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to preview traditional quotation",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const createCalculationPayload = () => {
    const agentCodeValue =
      agentCode ||
      (typeof window !== "undefined"
        ? localStorage.getItem("agentId") || ""
        : "");

    // Ensure agentCode is up to date in state
    if (agentCode !== agentCodeValue) {
      setAgentCode(agentCodeValue);
    }

    const assuredCode =
      formData.assuredCode || resolveAssuredCode(selectedCustomer);

    return {
      quoteNo: formData.quotationNumber || "",
      surName: formData.lastName,
      otherNames: formData.firstName,
      quotationDate: quotationDate.toISOString(),
      dateOfBirth: dateOfBirth
        ? dateOfBirth.toISOString()
        : new Date().toISOString(), // Fallback shouldn't happen due to check
      branchID: formData.locationBranch,
      mobileNumber: formData.mobilePhone,
      assuredCode,
      email: formData.emailAddress,
      duration: Number.parseFloat(formData.duration) || 0,
      frequency: formData.frequencyOfPayment,
      regularSaving: Number.parseFloat(formData.regularSaving) || 0,
      productCode: formData.planType,
      age: Number.parseInt(formData.age) || 0,
      rateCode: formData.rateCode,
      product: formData.planType,
      firstPremium: Number.parseFloat(formData.firstPremium) || 0,
      sumAssured: Number.parseFloat(formData.sumAssured) || 0,
      status: "draft",
      remark: formData.remark || "Premium",
      agentCode: agentCodeValue,
    };
  };

  const fetchFilteredQuotations = async (quoteNo: string) => {
    if (!quoteNo) return;

    setIsLoadingQuotations(true);
    try {
      console.log("Fetching filtered quotations for quoteNo:", quoteNo);
      const data = await getFilteredQuotations(quoteNo);
      setQuotations(data);
      console.log("Filtered quotations fetched:", data);
    } catch (error: any) {
      console.error("Fetch Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch quotations",
        variant: "destructive",
      });
    } finally {
      setIsLoadingQuotations(false);
    }
  };

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const data = await getProducts();
      setProducts(data);
      console.log("Products fetched (riskID B only):", data);
    } catch (error: any) {
      console.error("Products Fetch Error:", error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchBranches = async () => {
    setIsLoadingBranches(true);
    try {
      const data = await getBranches();
      setBranches(data);
      console.log("Branches fetched:", data);
    } catch (error: any) {
      console.error("Branches Fetch Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch branches",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const handleViewQuotation = (quotation: FilteredQuotationData) => {
    setViewingQuotation(quotation);
    setShowViewDialog(true);
  };

  const handleDeleteQuotation = (quotation: FilteredQuotationData) => {
    setDeletingQuotation(quotation);
    setShowDeleteDialog(true);
  };

  const confirmDeleteQuotation = async () => {
    if (!deletingQuotation) return;

    setIsDeleting(true);
    try {
      await deleteQuotation(deletingQuotation.quoteID);

      toast({
        title: "Success",
        description: "Quotation deleted successfully",
      });

      setShowDeleteDialog(false);
      setDeletingQuotation(null);

      // Refresh the quotations list
      if (currentQuoteNo) {
        fetchFilteredQuotations(currentQuoteNo);
      }
    } catch (error: any) {
      console.error("Delete Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete quotation",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getSelectedProduct = () => {
    return products.find((p) => p.productID === formData.planType);
  };

  const handleDone = async () => {
    setIsCalculating(true);
    try {
      const payload = createCalculationPayload();
      console.log("Saving traditional quotation with payload:", payload);

      const response = await calculateTradQuotation(payload);

      toast({
        title: "Success",
        description: "Quotation saved successfully",
      });

      // Navigate to homepage
      window.location.href = "/quotations/traditional";
    } catch (error: any) {
      console.error("Save Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save quotation",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchBranches();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAgentCode(localStorage.getItem("agentId") || "");
    }
  }, []);

  useEffect(() => {
    const query = customerSearchQuery.trim();

    if (query.length < 2) {
      customerSearchAbortRef.current?.abort();
      customerSearchAbortRef.current = null;
      setCustomerResults([]);
      setShowCustomerSuggestions(false);
      setIsSearchingCustomers(false);
      return;
    }

    const controller = new AbortController();
    customerSearchAbortRef.current?.abort();
    customerSearchAbortRef.current = controller;
    setIsSearchingCustomers(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        const response = await fetch(
          `${SERVER_URL}/v1/Customers/search?SearchText=${encodeURIComponent(
            query,
          )}`,
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : undefined,
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Failed to search customers");
        }

        const data = await response.json();
        const results: CustomerSearchResult[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : [];

        setCustomerResults(results);
        setShowCustomerSuggestions(true);
      } catch (error: any) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error("Customer search error:", error);
        toast({
          title: "Search Error",
          description: error?.message || "Failed to search for customers",
          variant: "destructive",
        });
        setCustomerResults([]);
        setShowCustomerSuggestions(false);
      } finally {
        setIsSearchingCustomers(false);
      }
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [customerSearchQuery, toast]);

  useEffect(() => {
    checkFirstSectionComplete();
  }, [formData, dateOfBirth]);

  const resolvedAssuredCode =
    formData.assuredCode || resolveAssuredCode(selectedCustomer);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                New Traditional Quotation
              </h1>
              <p className="text-gray-600">
                Create a new traditional insurance quotation
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Quotation Details */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm relative z-20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <User className="w-5 h-5 text-primary" />
                  <span>Quotation Details</span>
                  {showQuotationInfo && (
                    <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Quotation Number
                    </label>
                    <Input
                      value={formData.quotationNumber}
                      onChange={(e) =>
                        handleInputChange("quotationNumber", e.target.value)
                      }
                      className="bg-gray-50"
                      disabled
                      placeholder="Auto-generated after calculation"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Location/Branch *
                    </label>
                    <Popover
                      open={showBranchCombobox}
                      onOpenChange={setShowBranchCombobox}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={showBranchCombobox}
                          className={cn(
                            "w-full justify-between font-normal bg-transparent",
                            isLoadingBranches &&
                              "opacity-50 pointer-events-none",
                          )}
                        >
                          {formData.locationBranch
                            ? branches.find(
                                (branch) =>
                                  branch.description ===
                                  formData.locationBranch,
                              )?.description
                            : isLoadingBranches
                              ? "Loading branches..."
                              : "- select -"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search branch..." />
                          <CommandList>
                            <CommandEmpty>No branch found.</CommandEmpty>
                            <CommandGroup>
                              {branches.map((branch) => (
                                <CommandItem
                                  key={branch.branchID}
                                  value={branch.description}
                                  onSelect={(currentValue) => {
                                    handleInputChange(
                                      "locationBranch",
                                      currentValue === formData.locationBranch
                                        ? ""
                                        : branch.description,
                                    );
                                    setShowBranchCombobox(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.locationBranch ===
                                        branch.description
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {branch.description}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Quotation Date
                    </label>
                    <Popover
                      open={showQuotationCalendar}
                      onOpenChange={setShowQuotationCalendar}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-transparent"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {quotationDate
                            ? format(quotationDate, "dd MMM, yyyy")
                            : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DOBCalendar
                          value={quotationDate}
                          onChange={(date) => {
                            setQuotationDate(date);
                            setShowQuotationCalendar(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Date of Birth *
                    </label>
                    <Popover
                      open={showDOBCalendar}
                      onOpenChange={setShowDOBCalendar}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-transparent"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateOfBirth
                            ? format(dateOfBirth, "dd-MMM-yyyy")
                            : "Select date of birth"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DOBCalendar
                          value={dateOfBirth}
                          onChange={handleDOBChange}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      First Name *
                    </label>
                    <div className="relative">
                      <Input
                        value={formData.firstName}
                        onChange={(e) => handleFirstNameChange(e.target.value)}
                        // onFocus={() => {
                        //   if (customerResults.length > 0) {
                        //     setShowCustomerSuggestions(true);
                        //   }
                        // }}
                        onBlur={() => {
                          setTimeout(() => {
                            setShowCustomerSuggestions(false);
                          }, 150);
                        }}
                        placeholder="Enter first name"
                      />
                      {/* {showCustomerSuggestions && (
                        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                          {isSearchingCustomers && (
                            <div className="flex items-center px-3 py-2 text-sm text-gray-500">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Searching...
                            </div>
                          )}
                          {!isSearchingCustomers &&
                            customerResults.length === 0 && (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                No matching customers
                              </div>
                            )}
                          {customerResults.map((customer) => {
                            const displayName =
                              customer.lastName?.trim() || customer.customerID;

                            const contactLine =
                              customer.email?.trim() ||
                              customer.phoneLine1?.trim() ||
                              customer.phoneLine2?.trim() ||
                              customer.address?.trim() ||
                              "No additional info";

                            return (
                              <button
                                key={customer.customerID}
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => handleSelectCustomer(customer)}
                              >
                                <div className="font-medium text-gray-900">
                                  {displayName}
                                </div>
                                <div className="mt-0.5 text-xs text-gray-500">
                                  {contactLine}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )} */}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Last Name *
                    </label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Mobile Phone *
                    </label>
                    <div className="relative">
                      <Input
                        value={formData.mobilePhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        onBlur={() => handleBlur("mobilePhone")}
                        placeholder="090-0000-0000"
                        type="tel"
                        className={`${
                          phoneError
                            ? "border-red-500 focus:border-red-500"
                            : ""
                        } ${
                          formData.mobilePhone && !phoneError
                            ? "border-green-500 focus:border-green-500"
                            : ""
                        }`}
                        maxLength={11}
                      />
                      {formData.mobilePhone && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {phoneError ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {phoneError && (
                      <p className="text-red-500 text-sm flex items-center">
                        <XCircle className="h-4 w-4 mr-1" />
                        {phoneError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Plan Types *
                    </label>
                    <Select
                      value={formData.planType}
                      onValueChange={(value) =>
                        handleInputChange("planType", value)
                      }
                      // disabled={isLoadingProducts}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingProducts
                              ? "Loading products..."
                              : "Select plan type"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {products
                          .filter((product) => product.riskID === "A")
                          .map((product) => (
                            <SelectItem
                              key={product.productID}
                              value={product.productID}
                            >
                              {product.productName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Input
                        type="email"
                        value={formData.emailAddress}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        onBlur={() => handleBlur("emailAddress")}
                        placeholder="Enter email address"
                        className={`${
                          emailError
                            ? "border-red-500 focus:border-red-500"
                            : ""
                        } ${
                          formData.emailAddress && !emailError
                            ? "border-green-500 focus:border-green-500"
                            : ""
                        }`}
                      />
                      {formData.emailAddress && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {emailError ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {emailError && (
                      <p className="text-red-500 text-sm flex items-center">
                        <XCircle className="h-4 w-4 mr-1" />
                        {emailError}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Age (ANB)
                    </label>
                    <Input
                      value={formData.age}
                      className="bg-gray-50"
                      disabled
                      placeholder="Auto-calculated from DOB"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quotation Info - Only show when first section is complete */}
            <div>
              <Card className="shadow-lg border-0 bg-white/80 relative z-10">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Calculator className="w-5 h-5 text-primary" />
                    <span>Traditional Quotation Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Calculation Mode Information */}
                  {calculationMode && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        {calculationMode === "premium"
                          ? "You're calculating Sum Assured from First Premium. The Sum Assured field will be auto-calculated."
                          : "You're calculating First Premium from Sum Assured. The First Premium field will be auto-calculated."}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Frequency of Payment *
                      </label>
                      <Select
                        value={formData.frequencyOfPayment}
                        onValueChange={(value) =>
                          handleInputChange("frequencyOfPayment", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="- select -" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Quarterly">Quarterly</SelectItem>
                          <SelectItem value="Half-Yearly">
                            Half-Yearly
                          </SelectItem>
                          <SelectItem value="Annualy">Annualy</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Fortnightly">
                            Fortnightly
                          </SelectItem>
                          <SelectItem value="Daily">Daily</SelectItem>
                          <SelectItem value="Daily (5 Days)">
                            Daily (5 Days)
                          </SelectItem>
                          <SelectItem value="Daily (6 Days)">
                            Daily (6 Days)
                          </SelectItem>
                          <SelectItem value="Daily (7 Days)">
                            Daily (7 Days)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Duration *
                      </label>
                      <Input
                        value={formData.duration}
                        onChange={(e) =>
                          handleInputChange("duration", e.target.value)
                        }
                        placeholder="0"
                        type="number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* RATE FIELD */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                        <span>Rate</span>
                        {isLoadingRates && (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        )}
                      </label>
                      <Input
                        value={formData.rate}
                        onChange={(e) =>
                          handleInputChange("rate", e.target.value)
                        }
                        disabled={true}
                        placeholder={
                          !formData.age ||
                          !formData.duration ||
                          !formData.rateCode ||
                          !formData.planType
                            ? "Fill required fields first"
                            : isLoadingRates
                              ? "Loading rate..."
                              : premiumRate !== null
                                ? premiumRate.toString()
                                : "No rate available"
                        }
                        className={"bg-gray-50"}
                        type="number"
                        step="0.01"
                      />
                      {!formData.age ||
                      !formData.duration ||
                      !formData.rateCode ||
                      !formData.planType ? (
                        <p className="text-xs text-gray-500">
                          Please fill Age, Duration, Rate Code, and Plan Type to
                          load rate
                        </p>
                      ) : premiumRate !== null ? (
                        <p className="text-xs text-green-600">
                          Premium rate loaded: {premiumRate}
                        </p>
                      ) : null}
                    </div>

                    {/* BONUS FIELD - Only show when planType is FFP */}
                    {formData.planType === "FFP" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                          <span>Bonus</span>
                          {isLoadingBonus && (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          )}
                        </label>
                        <Input
                          value={bonus !== null ? bonus.toString() : ""}
                          disabled={true}
                          placeholder={
                            isLoadingBonus
                              ? "Loading bonus..."
                              : bonus !== null
                                ? bonus.toString()
                                : "No bonus available"
                          }
                          className="bg-gray-50"
                          type="number"
                          step="0.01"
                        />
                        {bonus !== null && (
                          <p className="text-xs text-green-600">
                            Bonus rate loaded: {bonus}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Rate Code *
                      </label>
                      <Select
                        value={formData.rateCode}
                        onValueChange={(value) =>
                          handleInputChange("rateCode", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select rate code" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Quarterly">Quarterly</SelectItem>
                          <SelectItem value="Half-Yearly">
                            Half-Yearly
                          </SelectItem>
                          <SelectItem value="ANNUAL">ANNUAL</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Fortnightly">
                            Fortnightly
                          </SelectItem>
                          <SelectItem value="Daily">Daily</SelectItem>
                          <SelectItem value="Daily (5 Days)">
                            Daily (5 Days)
                          </SelectItem>
                          <SelectItem value="Daily (6 Days)">
                            Daily (6 Days)
                          </SelectItem>
                          <SelectItem value="Daily (7 Days)">
                            Daily (7 Days)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div> */}

                    {/* Payment Variant for FFP */}
                    {formData.planType === "FFP" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Payment Variant:
                        </label>
                        <Select
                          value={formData.remark}
                          onValueChange={(value) => {
                            console.log("Selected FFP variant:", value);
                            handleInputChange("remark", value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select variant" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="25_25_50">
                              25%, 25%, 50% VARIANT
                            </SelectItem>
                            <SelectItem value="25_25_75">
                              25%, 25%, 75% VARIANT
                            </SelectItem>
                            <SelectItem value="25_25_100">
                              25%, 25%, 100% VARIANT
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Payment Variant for TAS */}
                    {formData.planType === "TAS" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Payment Variant:
                        </label>
                        <Select
                          value={formData.remark}
                          onValueChange={(value) => {
                            console.log("Selected TAS variant:", value);
                            handleInputChange("remark", value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select variant" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CASHBACK_PLAN">
                              Cash Back Plan
                            </SelectItem>
                            <SelectItem value="NORMAL_PLAN">
                              Normal Plan
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center">
                        {formData.planType === "SPP\r\n"
                          ? "Monthly Contribution"
                          : "First Premium"}
                        {calculationMode === "sumAssured" && (
                          <span className="ml-2 text-xs text-primary bg-blue-100 px-2 py-1 rounded">
                            Will be calculated
                          </span>
                        )}
                      </label>
                      <Input
                        value={formData.firstPremium}
                        onChange={(e) =>
                          handleInputChange("firstPremium", e.target.value)
                        }
                        onBlur={(e) => {
                          const formatted = formatTo2Dp(e.target.value);
                          if (formatted !== "") {
                            handleInputChange("firstPremium", formatted);
                          }
                        }}
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        disabled={calculationMode === "sumAssured"}
                        className={
                          calculationMode === "sumAssured" ? "bg-gray-100" : ""
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center">
                        {formData.planType === "SPP\r\n"
                          ? "Annual Salary"
                          : "Sum Assured"}
                        {calculationMode === "premium" && (
                          <span className="ml-2 text-xs text-primary bg-blue-100 px-2 py-1 rounded">
                            Will be calculated
                          </span>
                        )}
                      </label>
                      <Input
                        value={formData.sumAssured}
                        onChange={(e) =>
                          handleInputChange("sumAssured", e.target.value)
                        }
                        onBlur={(e) => {
                          const formatted = formatTo2Dp(e.target.value);
                          if (formatted !== "") {
                            handleInputChange("sumAssured", formatted);
                          }
                        }}
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        disabled={calculationMode === "premium"}
                        className={
                          calculationMode === "premium" ? "bg-gray-100" : ""
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      className="bg-primary hover:bg-primary-blue"
                      onClick={handleCalculate}
                      // disabled={isCalculating || !calculationMode}
                    >
                      {isCalculating ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Calculator className="w-4 h-4 mr-2" />
                      )}
                      Calculate Traditional Quote
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Multiple Details Table */}
            <Card className="shadow-lg border-0 bg-white/80">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span>Traditional Quotation Multiple Details</span>
                    {currentQuoteNo && (
                      <span className="text-sm text-gray-500">
                        (Quote No: {currentQuoteNo})
                      </span>
                    )}
                  </div>
                  {currentQuoteNo && (
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary-blue"
                      onClick={() => fetchFilteredQuotations(currentQuoteNo)}
                      // disabled={isLoadingQuotations}
                    >
                      {isLoadingQuotations ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Plus className="w-4 h-4 mr-1" />
                      )}
                      Refresh
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          Quote No
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          Duration
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          Sum Assured
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          First Premium
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          Annual Premium
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          Total Premium
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingQuotations ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                            <p className="text-gray-500">
                              Loading quotations...
                            </p>
                          </td>
                        </tr>
                      ) : !currentQuoteNo ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="text-center py-8 text-gray-500"
                          >
                            No quotations available. Create a quotation first.
                          </td>
                        </tr>
                      ) : quotations.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="text-center py-8 text-gray-500"
                          >
                            No quotations found for quote number{" "}
                            {currentQuoteNo}.
                          </td>
                        </tr>
                      ) : (
                        quotations.map((quotation, index) => (
                          <tr
                            key={quotation.quoteID || index}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">{quotation.quoteNo}</td>
                            <td className="py-3 px-4">{quotation.duration}</td>
                            <td className="py-3 px-4">
                              {formatCurrency(
                                Number(quotation.sumAssured ?? 0),
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {formatCurrency(
                                Number(quotation.basicPremium ?? 0),
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {formatCurrency(Number(quotation.premium1 ?? 0))}
                            </td>
                            <td className="py-3 px-4">
                              {formatCurrency(
                                Number(quotation.totalPremium ?? 0),
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  quotation.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {quotation.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewQuotation(quotation)}
                                  className="flex items-center space-x-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDeleteQuotation(quotation)
                                  }
                                  className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Quotation Summary - Show on mobile only */}
            <Card className="lg:hidden shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <span>Traditional Quote Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!calculationResult ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calculator className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">
                      Calculate quotation to see summary
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Client Information */}
                    <div className="border-b pb-4">
                      <h4 className="font-semibold text-gray-800 mb-3">
                        Client Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-medium">
                            {`${formData.firstName} ${formData.lastName}`.trim() ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Age:</span>
                          <span className="font-medium">
                            {formData.age || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            Phone:
                          </span>
                          <span className="font-medium text-xs">
                            {formData.mobilePhone || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            Email:
                          </span>
                          <span className="font-medium text-xs truncate max-w-32">
                            {formData.emailAddress || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Assured Code:</span>
                          <span className="font-medium text-xs">
                            {resolvedAssuredCode || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Policy Information */}
                    <div className="border-b pb-4">
                      <h4 className="font-semibold text-gray-800 mb-3">
                        Policy Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quote No:</span>
                          <span className="font-medium">
                            {calculationResult.quoteNo || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Product:</span>
                          <span className="font-medium text-xs">
                            {getSelectedProduct()?.productName || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            Branch:
                          </span>
                          <span className="font-medium text-xs">
                            {formData.locationBranch || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Agent Code:</span>
                          <span className="font-medium text-xs">
                            {agentCode || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Duration:
                          </span>
                          <span className="font-medium">
                            {formData.duration
                              ? `${formData.duration} `
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Frequency:</span>
                          <span className="font-medium text-xs">
                            {formData.frequencyOfPayment || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rate Code:</span>
                          <span className="font-medium">
                            {formData.rateCode || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Quote Date:
                          </span>
                          <span className="font-medium text-xs">
                            {format(quotationDate, "dd MMM, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="border-b pb-4">
                      <h4 className="font-semibold text-gray-800 mb-3">
                        Financial Summary
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {formData.planType === "SPP\r\n"
                              ? "Monthly Contribution:"
                              : "First Premium:"}
                          </span>
                          <span className="font-bold text-primary">
                            {formatCurrency(
                              Number(calculationResult.firstPremium ?? 0),
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {formData.planType === "SPP\r\n"
                              ? "Annual Salary:"
                              : "Sum Assured:"}
                          </span>
                          <span className="font-bold text-primary">
                            {formatCurrency(
                              Number(calculationResult.sumAssured ?? 0),
                            )}
                          </span>
                        </div>

                        {/* Maturity Benefit Fields - Only for FFP */}
                        {formData.planType === "FFP" && (
                          <>
                            {calculationResult.firstpayable !== undefined &&
                              calculationResult.firstpayable !== null && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    1st Maturity Benefit:
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(
                                      Number(
                                        calculationResult.firstpayable ?? 0,
                                      ),
                                    )}
                                  </span>
                                </div>
                              )}
                            {calculationResult.secondpayable !== undefined &&
                              calculationResult.secondpayable !== null && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    2nd Maturity Benefit:
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(
                                      Number(
                                        calculationResult.secondpayable ?? 0,
                                      ),
                                    )}
                                  </span>
                                </div>
                              )}
                          </>
                        )}

                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {formData.planType === "FFP"
                              ? "Final Maturity Payment:"
                              : "Life Cover:"}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(
                              Number(calculationResult.lifeCover ?? 0),
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Annual Premium:</span>
                          <span className="font-medium">
                            {formatCurrency(
                              Number(calculationResult.annualPremium ?? 0),
                            )}
                          </span>
                        </div>
                        {calculationResult.extraPremium > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Extra Premium:
                            </span>
                            <span className="font-medium">
                              {formatCurrency(
                                Number(calculationResult.extraPremium ?? 0),
                              )}
                            </span>
                          </div>
                        )}
                        {calculationResult.loading > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Loading:</span>
                            <span className="font-medium">
                              {formatCurrency(
                                Number(calculationResult.loading ?? 0),
                              )}
                            </span>
                          </div>
                        )}
                        <div className="border-t pt-2 mt-3">
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-800">
                              Total Premium:
                            </span>
                            <span className="font-bold text-lg text-green-600">
                              {formatCurrency(
                                Number(calculationResult.totalPremium ?? 0),
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Calculation Mode Information */}
                    <div className="border-b pb-4">
                      <h4 className="font-semibold text-gray-800 mb-3">
                        Calculation Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Calculation Mode:
                          </span>
                          <span className="font-medium">
                            {calculationMode === "premium"
                              ? "Premium → Sum Assured"
                              : "Sum Assured → Premium"}
                          </span>
                        </div>
                        {dateOfBirth && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Date of Birth:
                            </span>
                            <span className="font-medium text-xs">
                              {format(dateOfBirth, "dd MMM, yyyy")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 space-y-2">
                      <Button
                        className="w-full"
                        onClick={handleDone}
                        disabled={isCalculating}
                      >
                        {isCalculating ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Done (Save & Exit)
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quotation Summary - Desktop only */}
          <div className="hidden lg:block lg:col-span-1 space-y-6">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <span>Traditional Quote Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!calculationResult ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calculator className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">
                      Calculate quotation to see summary
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Client Information */}
                    <div className="border-b pb-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        {/* <User className="w-4 h-4 mr-2" /> */}
                        Client Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-medium">
                            {`${formData.firstName} ${formData.lastName}`.trim() ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Age:</span>
                          <span className="font-medium">
                            {formData.age || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            Phone:
                          </span>
                          <span className="font-medium text-xs">
                            {formData.mobilePhone || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            Email:
                          </span>
                          <span className="font-medium text-xs truncate max-w-32">
                            {formData.emailAddress || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Assured Code:</span>
                          <span className="font-medium text-xs">
                            {resolvedAssuredCode || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Policy Information */}
                    <div className="border-b pb-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        {/* <FileText className="w-4 h-4 mr-2" /> */}
                        Policy Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quote No:</span>
                          <span className="font-medium">
                            {calculationResult.quoteNo || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Product:</span>
                          <span className="font-medium text-xs">
                            {getSelectedProduct()?.productName || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            Branch:
                          </span>
                          <span className="font-medium text-xs">
                            {formData.locationBranch || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Agent Code:</span>
                          <span className="font-medium text-xs">
                            {agentCode || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Duration:
                          </span>
                          <span className="font-medium">
                            {formData.duration
                              ? `${formData.duration} `
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Frequency:</span>
                          <span className="font-medium text-xs">
                            {formData.frequencyOfPayment || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rate Code:</span>
                          <span className="font-medium">
                            {formData.rateCode || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Quote Date:
                          </span>
                          <span className="font-medium text-xs">
                            {format(quotationDate, "dd MMM, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="border-b pb-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        {/* <DollarSign className="w-4 h-4 mr-2" /> */}
                        Financial Summary
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {formData.planType === "SPP\r\n"
                              ? "Monthly Contribution:"
                              : "First Premium:"}
                          </span>
                          <span className="font-bold text-primary">
                            {formatCurrency(
                              Number(calculationResult.firstPremium ?? 0),
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {formData.planType === "SPP\r\n"
                              ? "Annual Salary:"
                              : "Sum Assured:"}
                          </span>
                          <span className="font-bold text-primary">
                            {formatCurrency(
                              Number(calculationResult.sumAssured ?? 0),
                            )}
                          </span>
                        </div>

                        {/* Maturity Benefit Fields - Only for FFP */}
                        {formData.planType === "FFP" && (
                          <>
                            {calculationResult.firstpayable !== undefined &&
                              calculationResult.firstpayable !== null && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    1st Maturity Benefit:
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(
                                      Number(
                                        calculationResult.firstpayable ?? 0,
                                      ),
                                    )}
                                  </span>
                                </div>
                              )}
                            {calculationResult.secondpayable !== undefined &&
                              calculationResult.secondpayable !== null && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    2nd Maturity Benefit:
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(
                                      Number(
                                        calculationResult.secondpayable ?? 0,
                                      ),
                                    )}
                                  </span>
                                </div>
                              )}
                          </>
                        )}

                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {formData.planType === "FFP"
                              ? "Final Maturity Payment:"
                              : "Life Cover:"}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(
                              Number(calculationResult.lifeCover ?? 0),
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Annual Premium:</span>
                          <span className="font-medium">
                            {formatCurrency(
                              Number(calculationResult.annualPremium ?? 0),
                            )}
                          </span>
                        </div>
                        {calculationResult.extraPremium > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Extra Premium:
                            </span>
                            <span className="font-medium">
                              {formatCurrency(
                                Number(calculationResult.extraPremium ?? 0),
                              )}
                            </span>
                          </div>
                        )}
                        {calculationResult.loading > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Loading:</span>
                            <span className="font-medium">
                              {formatCurrency(
                                Number(calculationResult.loading ?? 0),
                              )}
                            </span>
                          </div>
                        )}
                        <div className="border-t pt-2 mt-3">
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-800">
                              Total Premium:
                            </span>
                            <span className="font-bold text-lg text-green-600">
                              {formatCurrency(
                                Number(calculationResult.totalPremium ?? 0),
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Calculation Mode Information */}
                    <div className="border-b pb-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        {/* <Target className="w-4 h-4 mr-2" /> */}
                        Calculation Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Calculation Mode:
                          </span>
                          <span className="font-medium">
                            {calculationMode === "premium"
                              ? "Premium → Sum Assured"
                              : "Sum Assured → Premium"}
                          </span>
                        </div>
                        {dateOfBirth && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Date of Birth:
                            </span>
                            <span className="font-medium text-xs">
                              {format(dateOfBirth, "dd MMM, yyyy")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 space-y-2">
                      {/* <Button
                        className="w-full bg-primary hover:bg-primary-blue"
                        onClick={handleCalculate}
                        // disabled={isCalculating || !calculationMode}
                      >
                        {isCalculating ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Calculator className="w-4 h-4 mr-2" />
                        )}
                        Recalculate
                      </Button> */}
                      {/* <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => window.print()}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Print Summary
                      </Button> */}
                      <Button onClick={handleDone} disabled={isCalculating}>
                        {isCalculating ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Done (Save & Exit)
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* View Quotation Dialog */}
      <OutsideDismissDialog
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center space-x-2">
              <DialogTitle>
                <Eye className="w-5 h-5" />
                <span>View Traditional Quotation Details</span>
              </DialogTitle>
            </div>
          </DialogHeader>
          {viewingQuotation && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700 flex items-center">
                      {/* <User className="w-4 h-4 mr-2" /> */}
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        Quote Number
                      </label>
                      <Input
                        value={viewingQuotation.quoteNo}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        First Name
                      </label>
                      <Input
                        value={viewingQuotation.otherNames}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        Last Name
                      </label>
                      <Input
                        value={viewingQuotation.surName}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        Mobile Phone
                      </label>
                      <Input
                        value={viewingQuotation.mobilePhone}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        Email
                      </label>
                      <Input
                        value={viewingQuotation.email}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700 flex items-center">
                      {/* <FileText className="w-4 h-4 mr-2" /> */}
                      Policy Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        Duration (Years)
                      </label>
                      <Input
                        value={
                          viewingQuotation.duration
                            ? viewingQuotation.duration.toString()
                            : "N/A"
                        }
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        Frequency
                      </label>
                      <Input
                        value={viewingQuotation.cardNo}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        Status
                      </label>
                      <Input
                        value={viewingQuotation.status}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        Quote Date
                      </label>
                      <Input
                        value={
                          viewingQuotation.tDate
                            ? format(
                                new Date(viewingQuotation.tDate),
                                "dd MMM, yyyy",
                              )
                            : "N/A"
                        }
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        Date of Birth
                      </label>
                      <Input
                        value={
                          viewingQuotation.dateofBirth
                            ? format(
                                new Date(viewingQuotation.dateofBirth),
                                "dd MMM, yyyy",
                              )
                            : "N/A"
                        }
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700 flex items-center">
                    {/* <DollarSign className="w-4 h-4 mr-2" /> */}
                    Financial Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        Sum Assured
                      </label>
                      <Input
                        value={formatCurrency(viewingQuotation.sumAssured)}
                        readOnly
                        className="bg-gray-50 font-medium text-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Remarks
                      </label>
                      <Input
                        value={formData.remark}
                        onChange={(e) =>
                          handleInputChange("remark", e.target.value)
                        }
                        placeholder="Enter any additional remarks or notes"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        First Premium
                      </label>
                      <Input
                        value={formatCurrency(viewingQuotation.basicPremium)}
                        readOnly
                        className="bg-gray-50 font-medium text-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        Annual Premium
                      </label>
                      <Input
                        value={formatCurrency(viewingQuotation.premium1)}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        Premium 3
                      </label>
                      <Input
                        value={formatCurrency(viewingQuotation.premium3)}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        Loading
                      </label>
                      <Input
                        value={formatCurrency(viewingQuotation.loading)}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        Total Premium
                      </label>
                      <Input
                        value={formatCurrency(viewingQuotation.totalPremium)}
                        readOnly
                        className="bg-gray-50 font-bold text-green-600"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700 flex items-center">
                    {/* <Target className="w-4 h-4 mr-2" /> */}
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        Quote ID
                      </label>
                      <Input
                        value={viewingQuotation.quoteID}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        Created Date
                      </label>
                      <Input
                        value={
                          viewingQuotation.createdAt
                            ? format(
                                new Date(viewingQuotation.createdAt),
                                "dd MMM, yyyy HH:mm",
                              )
                            : "N/A"
                        }
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowViewDialog(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </OutsideDismissDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Traditional Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this traditional quotation for{" "}
              <strong>
                {deletingQuotation
                  ? `${deletingQuotation.otherNames} ${deletingQuotation.surName}`
                  : ""}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteQuotation}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NewTradQuotation;
