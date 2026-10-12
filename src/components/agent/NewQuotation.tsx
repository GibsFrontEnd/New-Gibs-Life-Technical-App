// @ts-nocheck

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../UI/card";
import { Input } from "../UI/new-input";
import { Button } from "../UI/new-button";
import { cn } from "../../utils/class-names";
import { useLocation, useNavigate } from "react-router-dom";
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
  Banknote,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Target,
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
import {
  calculateQuotation,
  getFilteredQuotations,
  getProducts,
  getBranches,
  deleteQuotation,
  getPremiumRate,
  previewInvestmentQuotation,
  calculateInvestmentQuotation,
  previewTradQuotationNew,
  calculateTradQuotationNew,
  type FilteredQuotationData,
  type Product,
  type Branch,
  type QuotationCalculateResponse,
  previewQuotation,
} from "../../types/quotation";
import { SERVER_URL } from "../../utils/constants";

const NewQuotation = () => {
  console.log("🚀 NewQuotation component mounting...");
  const { pathname } = useLocation();
  console.log("📍 Pathname:", pathname);
  const navigate = useNavigate();
  const isInvestment = pathname.includes("investment");
  const tag = isInvestment ? "B" : "A";
  const title = isInvestment ? "Investment Link Quote" : "Traditional Quote";

  const { toast } = useToast();
  const [quotationDate, setQuotationDate] = useState<Date>(new Date());
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [showDOBCalendar, setShowDOBCalendar] = useState(false);
  const [showQuotationCalendar, setShowQuotationCalendar] = useState(false);
  const [showBranchCombobox, setShowBranchCombobox] = useState(false);
  const [showQuotationInfo, setShowQuotationInfo] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoadingQuotations, setIsLoadingQuotations] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [quotations, setQuotations] = useState<FilteredQuotationData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentQuoteNo, setCurrentQuoteNo] = useState<string>("");
  const [viewingQuotation, setViewingQuotation] =
    useState<FilteredQuotationData | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingQuotation, setDeletingQuotation] = useState<FilteredQuotationData | null>(null);
  const [calculationResult, setCalculationResult] =
    useState<QuotationCalculateResponse | null>(null);
  const [premiumRate, setPremiumRate] = useState<any>(null);
  const [isLoadingPremiumRate, setIsLoadingPremiumRate] = useState(false);

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
    firstPremium: "",
    sumAssured: "",
    remark: "PREMIUM",
    extraRate: "",
    loadingRate: "",
    assuredCode: "",
  });
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Add these validation states
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isTouched, setIsTouched] = useState({
    mobilePhone: false,
    emailAddress: false,
  });

  // Comprehensive phone number validation
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
    const domain = email.split("@")[1];
    if (disposableDomains.includes(domain?.toLowerCase())) {
      return {
        isValid: false,
        error: "Disposable email addresses are not allowed",
      };
    }

    return { isValid: true, error: "" };
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    checkFirstSectionComplete();
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

  const handleFirstNameChange = (value: string) => {
    handleInputChange("firstName", value);
    setCustomerSearchQuery(value);

    if (value.trim().length >= 2) {
      setShowCustomerSuggestions(true);
    } else {
      setCustomerResults([]);
      setShowCustomerSuggestions(false);
      setIsSearchingCustomers(false);
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

  const resolveAssuredCode = (customer: any) => {
    if (!customer) return "";
    return (
      customer.assuredCode ||
      customer.assuredcode ||
      customer.customerID ||
      customer.customerId ||
      customer.customerCode ||
      customer.assured_id ||
      ""
    );
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

  const handleSelectCustomer = (customer: any) => {
    // Parse the full name from firstName or lastName field
    const fullNameRaw =
      customer?.firstName || customer?.lastName || customer?.orgName || "";
    const nameParts = fullNameRaw.trim().split(/\s+/).filter(Boolean);

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
      customer?.phoneLine1 || customer?.phoneLine2 || customer?.mobile || "";
    const resolvedEmail = customer?.email || "";

    const derivedAssuredCode = resolveAssuredCode(customer);

    handleInputChange("firstName", resolvedFirstName);
    handleInputChange("lastName", resolvedLastName);
    handleInputChange("mobilePhone", resolvedPhone.trim());
    handleInputChange("emailAddress", resolvedEmail.trim());
    handleInputChange("assuredCode", derivedAssuredCode);

    if (customer?.dateOfBirth) {
      const parsedDOB = new Date(customer.dateOfBirth);

      if (!Number.isNaN(parsedDOB.getTime())) {
        setDateOfBirth(parsedDOB);
        setFormData((prev) => ({
          ...prev,
          age: calculateAge(parsedDOB),
        }));
      }
    }

    setCustomerSearchQuery("");
    setCustomerResults([]);
    setShowCustomerSuggestions(false);
    setSelectedCustomer({ ...customer, assuredCode: derivedAssuredCode });

    // Trigger validation after customer selection
    setTimeout(() => {
      setIsTouched({ mobilePhone: true, emailAddress: true });
      const phoneValidation = validatePhoneNumber(formData.mobilePhone);
      const emailValidation = validateEmail(formData.emailAddress);
      setPhoneError(phoneValidation.error);
      setEmailError(emailValidation.error);
    }, 100);
  };

  const createCalculationPayload = () => {
    const agentCode = localStorage.getItem("agentId") || "";
    const assuredCode =
      formData.assuredCode || resolveAssuredCode(selectedCustomer);

    return {
      quoteNo: formData.quotationNumber || "",
      surName: formData.lastName,
      otherNames: formData.firstName,
      quotationDate: quotationDate.toISOString(),
      dateOfBirth: dateOfBirth
        ? dateOfBirth.toISOString()
        : new Date().toISOString(),
      branchID: formData.locationBranch,
      mobileNumber: formData.mobilePhone,
      assuredCode,
      email: formData.emailAddress,
      duration: Number.parseFloat(formData.duration) || 0,
      frequency: formData.frequencyOfPayment,
      remark: (tag === "A" && (formData.planType === "FFP" || formData.planType === "TAS")) ? (formData.remark || "PREMIUM") : "PREMIUM",
      regularSaving: Number.parseFloat(formData.firstPremium) || 0,
      sumAssured: Number.parseFloat(formData.sumAssured) || 0,
      productCode: formData.planType,
      product: formData.planType,
      extraRate: Number.parseFloat(formData.extraRate) || 0,
      loadingRate: Number.parseFloat(formData.loadingRate) || 0,
      agentCode,
      tag: tag,
      status: "draft",
    };
  };

  // ─── Auto-fetch premium rate for quotes when inputs change ──
  useEffect(() => {
    // Both tag A and B use this now
    const productCode = formData.planType;
    const duration = Number(formData.duration);
    const age = Number(formData.age);
    if (!productCode || !duration || !age) return;

    let cancelled = false;
    setIsLoadingPremiumRate(true);
    getPremiumRate({ productCode, duration, age })
      .then((data) => { if (!cancelled) setPremiumRate(data); })
      .catch((err) => console.error("Premium rate fetch failed:", err))
      .finally(() => { if (!cancelled) setIsLoadingPremiumRate(false); });

    return () => { cancelled = true; };
  }, [formData.planType, formData.duration, formData.age]);

  const handleCalculate = async () => {
    // Validate required fields before calculation
    const phoneValidation = validatePhoneNumber(formData.mobilePhone);
    const emailValidation = validateEmail(formData.emailAddress);

    if (phoneValidation.error || emailValidation.error) {
      setIsTouched({ mobilePhone: true, emailAddress: true });
      setPhoneError(phoneValidation.error);
      setEmailError(emailValidation.error);

      toast({
        title: "Validation Error",
        description: "Please fix the validation errors before proceeding",
        variant: "destructive",
      });
      return;
    }

    if (!dateOfBirth) {
      toast({
        title: "Error",
        description: "Please select date of birth",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);

    try {
      const payload = createCalculationPayload();
      console.log("Calculate payload:", payload);

      let response: QuotationCalculateResponse;
      if (tag === "B") {
        // Investment Link Quote — Calculate uses POST /api/lifequotes/calculate
        response = await calculateInvestmentQuotation(payload);
      } else {
        // Traditional Quote — Calculate uses POST /api/lifequotes/tradcalculate
        response = await calculateTradQuotationNew(payload);
      }

      // Store the calculation result for the summary
      setCalculationResult(response);

      toast({
        title: "Success",
        description: "Quotation calculated successfully",
      });

      // NOTE: We do NOT set currentQuoteNo from preview as it is not saved yet
      // setFormData((prev) => ({ ...prev, quotationNumber: response.quoteNo }));
    } catch (error: any) {
      console.error("Preview Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to preview quotation",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
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
      // console.log("Products fetched:", data);
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

  const getSelectedBranch = () => {
    return branches.find((b) => b.description === formData.locationBranch);
  };

  const handleDone = async () => {
    setIsCalculating(true);
    try {
      const payload = createCalculationPayload();
      console.log("Saving quotation with payload:", payload);

      let response: QuotationCalculateResponse;
      if (tag === "B") {
        // Investment Link Quote — Save uses POST /api/lifequotes/calculate/preview
        response = await previewInvestmentQuotation(payload);
      } else {
        // Traditional Quote — Save uses POST /api/lifequotes/tradcalculate/preview
        response = await previewTradQuotationNew(payload);
      }

      toast({
        title: "Quotation Saved",
        description: `Quote No: ${response.quoteNo || ""} saved successfully`,
      });

      // Navigate back to the list
      navigate(isInvestment ? "/quotations/investment-link-quotes" : "/quotations/traditional-quotes");
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
  }, [tag]);

  useEffect(() => {
    const query = customerSearchQuery.trim();

    if (query.length < 2) {
      setCustomerResults([]);
      setShowCustomerSuggestions(false);
      setIsSearchingCustomers(false);
      return;
    }

    const controller = new AbortController();
    setIsSearchingCustomers(true);

    const timeoutId = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
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
        setCustomerResults(Array.isArray(data) ? data : []);
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
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [customerSearchQuery, toast]);

  // Real-time validation for better UX
  useEffect(() => {
    if (isTouched.mobilePhone) {
      const validation = validatePhoneNumber(formData.mobilePhone);
      setPhoneError(validation.error);
    }
  }, [formData.mobilePhone, isTouched.mobilePhone]);

  useEffect(() => {
    if (isTouched.emailAddress) {
      const validation = validateEmail(formData.emailAddress);
      setEmailError(validation.error);
    }
  }, [formData.emailAddress, isTouched.emailAddress]);

  useEffect(() => {
    checkFirstSectionComplete();
  }, [formData, dateOfBirth]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-blue rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                New {title}
              </h1>
              <p className="text-gray-600">Create a new {title.toLowerCase()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Quotation Details */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
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
                          className="w-full justify-between font-normal bg-transparent"
                          disabled={isLoadingBranches}
                        >
                          {formData.locationBranch
                            ? branches.find(
                                (branch) =>
                                  branch.branchID ===
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
                                  onSelect={() => {
                                    handleInputChange(
                                      "locationBranch",
                                      branch.branchID,
                                    );
                                    setShowBranchCombobox(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.locationBranch ===
                                        branch.branchID
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
                        onBlur={() => {
                          setTimeout(() => {
                            setShowCustomerSuggestions(false);
                          }, 150);
                        }}
                        placeholder="Enter first name"
                      />
                      {showCustomerSuggestions && (
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
                            const customerName =
                              customer?.lastName?.trim() ||
                              customer?.orgName ||
                              "Unknown";

                            const customerContact =
                              customer?.email ||
                              customer?.phoneLine1 ||
                              customer?.phoneLine2 ||
                              "No additional details";

                            return (
                              <button
                                key={customer.customerID ?? customerName}
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => handleSelectCustomer(customer)}
                              >
                                <div className="font-medium text-gray-900">
                                  {customerName}
                                </div>
                                <div className="mt-0.5 text-xs text-gray-500">
                                  {customerContact}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
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
                      disabled={isLoadingProducts}
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
                          .filter((product) => product.riskID === tag)
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

                {tag === "A" && (formData.planType === "FFP" || formData.planType === "TAS") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Payment Variant *
                      </label>
                      <Select
                        value={formData.remark === "PREMIUM" ? "" : formData.remark}
                        onValueChange={(value) => handleInputChange("remark", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select variant" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.planType === "FFP" ? (
                            <>
                              <SelectItem value="25_25_50">25%, 25%, 50% VARIANT</SelectItem>
                              <SelectItem value="25_25_75">25%, 25%, 75% VARIANT</SelectItem>
                              <SelectItem value="25_25_100">25%, 25%, 100% VARIANT</SelectItem>
                            </>
                          ) : formData.planType === "TAS" ? (
                            <>
                              <SelectItem value="CASHBACK_PLAN">Cash Back Plan</SelectItem>
                              <SelectItem value="NORMAL_PLAN">Normal Plan</SelectItem>
                            </>
                          ) : null}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

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
              <Card className="shadow-lg border-0 bg-white/80">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Calculator className="w-5 h-5 text-primary" />
                    <span>Quotation Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
                          <SelectItem value="Annually">Annually</SelectItem>
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
                        Duration (Years)
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
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                          First Premium
                        </label>
                        {formData.sumAssured && (
                          <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Will be calculated
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          value={formData.firstPremium}
                          onChange={(e) =>
                            handleInputChange("firstPremium", e.target.value)
                          }
                          placeholder="0.00"
                          className="flex-1"
                          type="number"
                          disabled={Boolean(formData.sumAssured)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                          Sum Assured
                        </label>
                        {formData.firstPremium && (
                          <span className="text-[10px] font-medium text-[#8c4b8d] bg-[#8c4b8d]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Will be calculated
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          value={formData.sumAssured}
                          onChange={(e) =>
                            handleInputChange("sumAssured", e.target.value)
                          }
                          placeholder="0.00"
                          className="flex-1"
                          type="number"
                          disabled={Boolean(formData.firstPremium)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Extra Rate (%) - optional
                      </label>
                      <Input
                        value={formData.extraRate}
                        onChange={(e) =>
                          handleInputChange("extraRate", e.target.value)
                        }
                        placeholder="0.00"
                        type="number"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Loading Rate (%) - optional
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          value={formData.loadingRate}
                          onChange={(e) =>
                            handleInputChange("loadingRate", e.target.value)
                          }
                          placeholder="0.00"
                          className="flex-1"
                          type="number"
                        />
                        <Button
                          size="sm"
                          className="bg-[#8c4b8d] hover:bg-opacity-90"
                          onClick={handleCalculate}
                          disabled={isCalculating}
                        >
                          {isCalculating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Calculate"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Multiple Details Table */}
            <Card className="shadow-lg border-0 bg-white/80">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span>Quotation Multiple Details</span>
                    {currentQuoteNo && (
                      <span className="text-sm text-gray-500">
                        (Quote No: {currentQuoteNo})
                      </span>
                    )}
                  </div>
                  {currentQuoteNo && (
                    <Button
                      size="sm"
                      className="bg-[#8c4b8d] hover:bg-opacity-90"
                      onClick={() => fetchFilteredQuotations(currentQuoteNo)}
                      disabled={isLoadingQuotations}
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
                          Frequency
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          Extra Premium
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          Loading
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
                          <td colSpan={9} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                            <p className="text-gray-500">
                              Loading quotations...
                            </p>
                          </td>
                        </tr>
                      ) : !currentQuoteNo ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="text-center py-8 text-gray-500"
                          >
                            No quotations available. Create a quotation first.
                          </td>
                        </tr>
                      ) : quotations.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
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
                            className="border-b border-gray-100 hover:bg-gray-50 text-sm"
                          >
                            <td className="py-3 px-4 font-medium">{quotation.quoteNo}</td>
                            <td className="py-3 px-4">{quotation.duration}</td>
                            <td className="py-3 px-4">
                              {formatCurrency(
                                Number(quotation.sumAssured ?? 0),
                              )}
                            </td>
                            <td className="py-3 px-4">{quotation.cardNo}</td>
                            <td className="py-3 px-4">
                              {formatCurrency(Number(quotation.premium2 ?? 0))}
                            </td>
                            <td className="py-3 px-4">
                              {formatCurrency(Number(quotation.loading ?? 0))}
                            </td>
                            <td className="py-3 px-4 font-semibold text-primary">
                              {formatCurrency(
                                Number(quotation.totalPremium ?? 0),
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-[10px] font-medium uppercase ${
                                  quotation.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {quotation.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewQuotation(quotation)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleDeleteQuotation(quotation)
                                  }
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
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
          </div>

          {/* Right Column - Quotation Summary - Desktop and Tablet */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <span>Quotation Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!calculationResult ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calculator className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-sm">
                      Complete form and click calculate to see summary
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Client Information */}
                    <div className="border-b border-gray-100 pb-4">
                      <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">
                        Client Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Name:</span>
                          <span className="font-medium text-gray-900">
                            {`${formData.firstName} ${formData.lastName}`.trim() || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Age:</span>
                          <span className="font-medium text-gray-900">
                            {formData.age || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Phone:</span>
                          <span className="font-medium text-gray-900 truncate ml-2">
                            {formData.mobilePhone || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Email:</span>
                          <span className="font-medium text-gray-900 truncate ml-2 max-w-[160px] text-right">
                            {formData.emailAddress || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Quote Date:</span>
                          <span className="font-medium text-gray-900">
                            {format(quotationDate, "dd MMM yyyy")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Branch:</span>
                          <span className="font-medium text-gray-900 truncate ml-2 max-w-[140px] text-right">
                            {branches.find(b => b.branchID === formData.locationBranch)?.description || formData.locationBranch || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Policy Information */}
                    <div className="border-b border-gray-100 pb-4">
                      <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">
                        Plan Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Quote No:</span>
                          <span className="font-bold text-[#8c4b8d]">
                            {calculationResult.quoteNo || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Product:</span>
                          <span className="font-medium text-gray-900 truncate ml-2">
                            {getSelectedProduct()?.productName || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Frequency:</span>
                          <span className="font-medium text-gray-900">
                            {formData.frequencyOfPayment || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Duration:</span>
                          <span className="font-medium text-gray-900">
                            {formData.duration
                              ? `${formData.duration} Years`
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">
                        Financial Summary
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">First Premium:</span>
                          <span className="font-medium text-gray-900">
                            {formData.firstPremium
                              ? formatCurrency(Number(formData.firstPremium))
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Sum Assured:</span>
                          <span className="font-bold text-[#8c4b8d]">
                            {formatCurrency(calculationResult.sumAssured)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Annual Premium:</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(calculationResult.annualPremium)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Life Cover:</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(calculationResult.lifeCover)}
                          </span>
                        </div>
                        {calculationResult.extraPremium > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Extra Premium:</span>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(calculationResult.extraPremium)}
                            </span>
                          </div>
                        )}
                        {calculationResult.loading > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Loading:</span>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(calculationResult.loading)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between py-2 border-y border-dashed border-gray-100 my-2">
                          <span className="font-semibold text-gray-900">Total Premium:</span>
                          <span className="font-bold text-lg text-[#8c4b8d]">
                            {formatCurrency(calculationResult.totalPremium)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4">
                      <Button
                        className="w-full bg-[#8c4b8d] hover:bg-opacity-90 py-6"
                        onClick={handleDone}
                        disabled={isCalculating}
                      >
                        {isCalculating ? (
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="w-5 h-5 mr-2" />
                        )}
                        {isCalculating ? "Processing..." : "Save Quotation"}
                      </Button>
                      <p className="text-[10px] text-gray-400 text-center mt-3">
                        By clicking Save, this quotation will be registered in the system as a draft.
                      </p>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 border-b border-gray-100 flex-row items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-[#8c4b8d]" />
              <span>Quotation Details</span>
            </DialogTitle>
          </DialogHeader>
          {viewingQuotation && (
            <div className="p-8 space-y-8 bg-gray-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                    <User className="h-3 w-3 mr-1" /> Client Information
                  </h3>
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">First Name</p>
                        <p className="font-medium text-gray-900 mt-1">{viewingQuotation.otherNames}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">Last Name</p>
                        <p className="font-medium text-gray-900 mt-1">{viewingQuotation.surName}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Mobile Phone</p>
                      <p className="font-medium text-gray-900 mt-1">{viewingQuotation.mobilePhone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Email Address</p>
                      <p className="font-medium text-gray-900 mt-1 truncate">{viewingQuotation.email}</p>
                    </div>
                  </div>
                </div>

                {/* Policy Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                    <FileText className="h-3 w-3 mr-1" /> Plan Information
                  </h3>
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">Quote Number</p>
                        <p className="font-medium text-[#8c4b8d] mt-1">{viewingQuotation.quoteNo}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">Duration</p>
                        <p className="font-medium text-gray-900 mt-1">{viewingQuotation.duration} Years</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">Status</p>
                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md mt-1 uppercase">
                          {viewingQuotation.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">Frequency</p>
                        <p className="font-medium text-gray-900 mt-1">{viewingQuotation.cardNo}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                  <Banknote className= "h-3 w-3 mr-1" /> Financial Details
                </h3>
                <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase mb-1">Sum Assured</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(viewingQuotation.sumAssured)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase mb-1">Total Premium</p>
                      <p className="text-xl font-bold text-[#8c4b8d]">{formatCurrency(viewingQuotation.totalPremium)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase mb-1">Extra Premium</p>
                      <p className="font-medium text-gray-900">{formatCurrency(viewingQuotation.premium2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase mb-1">Loading</p>
                      <p className="font-medium text-gray-900">{formatCurrency(viewingQuotation.loading)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 pb-8">
                <Button variant="outline" onClick={() => setShowViewDialog(false)} className="px-8">
                  Close
                </Button>
                <Button onClick={() => window.print()} className="bg-[#8c4b8d] hover:bg-opacity-90 px-8">
                  <FileText className="w-4 h-4 mr-2" />
                  Print Receipt
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
            <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quotation for{" "}
              <strong>
                {deletingQuotation
                  ? `${deletingQuotation.otherNames} ${deletingQuotation.surName}`
                  : ""}
              </strong>
              ? This action cannot be undone and will remove the draft from our records.
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
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NewQuotation;
