// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
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
  DollarSign,
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
  type FilteredQuotationData,
  type Product,
  type Branch,
  type QuotationCalculateResponse,
  previewQuotation,
} from "../../types/quotation";
import { SERVER_URL } from "../../utils/constants";

const NewQuotation = () => {
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
  const [deletingQuotation, setDeletingQuotation] =
    useState<FilteredQuotationData | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [calculationResult, setCalculationResult] =
    useState<QuotationCalculateResponse | null>(null);

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
    contributions: "",
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
      regularSaving: Number.parseFloat(formData.contributions) || 0,
      productCode: formData.planType,
      product: formData.planType,
      extraRate: Number.parseFloat(formData.extraRate) || 0,
      loadingRate: Number.parseFloat(formData.loadingRate) || 0,
      agentCode,
      status: "draft",
    };
  };

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

      console.log("Previewing quotation with payload:", payload);

      const response: QuotationCalculateResponse =
        await previewQuotation(payload);

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
      // console.log("Products fetched (riskID B only):", data);
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

      const response = await calculateQuotation(payload);

      toast({
        title: "Success",
        description: "Quotation saved successfully",
      });

      // Navigate to quotations
      window.location.href = "/quotations/investment-link";
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
                New Quotation
              </h1>
              <p className="text-gray-600">Create a new insurance quotation</p>
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
                          .filter((product) => product.riskID === "B")
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
                        Duration
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
                      <label className="text-sm font-medium text-gray-700">
                        Contributions
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          value={formData.contributions}
                          onChange={(e) =>
                            handleInputChange("contributions", e.target.value)
                          }
                          placeholder="0.00"
                          className="flex-1"
                          type="number"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Extra Rate - optional
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
                        Loading Rate - optional
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
                          className="bg-primary hover:bg-primary-blue"
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
                  <div className="flex items-center space-x-2">
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
                      className="bg-primary hover:bg-primary-blue"
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
                          loading
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
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">{quotation.quoteNo}</td>
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
                  <span>Quotation Summary</span>
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
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Duration:
                          </span>
                          <span className="font-medium">
                            {formData.duration
                              ? `${formData.duration} years`
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Frequency:</span>
                          <span className="font-medium text-xs">
                            {formData.frequencyOfPayment || "N/A"}
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
                          <span className="text-gray-600">Contributions:</span>
                          <span className="font-medium">
                            {formData.contributions
                              ? formatCurrency(Number(formData.contributions))
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sum Assured:</span>
                          <span className="font-bold text-primary">
                            {formatCurrency(calculationResult.sumAssured)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Life Cover:</span>
                          <span className="font-medium">
                            {formatCurrency(calculationResult.lifeCover)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Annual Premium:</span>
                          <span className="font-medium">
                            {formatCurrency(calculationResult.annualPremium)}
                          </span>
                        </div>
                        {calculationResult.extraPremium > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Extra Premium:
                            </span>
                            <span className="font-medium">
                              {formatCurrency(calculationResult.extraPremium)}
                            </span>
                          </div>
                        )}
                        {calculationResult.loading > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Loading:</span>
                            <span className="font-medium">
                              {formatCurrency(calculationResult.loading)}
                            </span>
                          </div>
                        )}
                        <div className="border-t pt-2 mt-3">
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-800">
                              Total Premium:
                            </span>
                            <span className="font-bold text-lg text-green-600">
                              {formatCurrency(calculationResult.totalPremium)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">
                        Additional Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        {formData.extraRate &&
                          Number(formData.extraRate) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Extra Rate:</span>
                              <span className="font-medium">
                                {formData.extraRate}%
                              </span>
                            </div>
                          )}
                        {formData.loadingRate &&
                          Number(formData.loadingRate) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Loading Rate:
                              </span>
                              <span className="font-medium">
                                {formData.loadingRate}%
                              </span>
                            </div>
                          )}
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
                        className="w-full bg-primary hover:bg-primary-blue"
                        onClick={handleDone}
                        disabled={isCalculating}
                      >
                        {isCalculating ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        {isCalculating ? "Saving..." : "Done (Save & Exit)"}
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
                  <span>Quotation Summary</span>
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
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Duration:
                          </span>
                          <span className="font-medium">
                            {formData.duration
                              ? `${formData.duration} years`
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Frequency:</span>
                          <span className="font-medium text-xs">
                            {formData.frequencyOfPayment || "N/A"}
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
                          <span className="text-gray-600">Contributions:</span>
                          <span className="font-medium">
                            {formData.contributions
                              ? formatCurrency(Number(formData.contributions))
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sum Assured:</span>
                          <span className="font-bold text-primary">
                            {formatCurrency(calculationResult.sumAssured)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Life Cover:</span>
                          <span className="font-medium">
                            {formatCurrency(calculationResult.lifeCover)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Annual Premium:</span>
                          <span className="font-medium">
                            {formatCurrency(calculationResult.annualPremium)}
                          </span>
                        </div>
                        {calculationResult.extraPremium > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Extra Premium:
                            </span>
                            <span className="font-medium">
                              {formatCurrency(calculationResult.extraPremium)}
                            </span>
                          </div>
                        )}
                        {calculationResult.loading > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Loading:</span>
                            <span className="font-medium">
                              {formatCurrency(calculationResult.loading)}
                            </span>
                          </div>
                        )}
                        <div className="border-t pt-2 mt-3">
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-800">
                              Total Premium:
                            </span>
                            <span className="font-bold text-lg text-green-600">
                              {formatCurrency(calculationResult.totalPremium)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        {/* <Target className="w-4 h-4 mr-2" /> */}
                        Additional Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        {formData.extraRate &&
                          Number(formData.extraRate) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Extra Rate:</span>
                              <span className="font-medium">
                                {formData.extraRate}%
                              </span>
                            </div>
                          )}
                        {formData.loadingRate &&
                          Number(formData.loadingRate) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Loading Rate:
                              </span>
                              <span className="font-medium">
                                {formData.loadingRate}%
                              </span>
                            </div>
                          )}
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
                        className="w-full bg-primary hover:bg-primary-blue"
                        onClick={handleDone}
                        disabled={isCalculating}
                      >
                        {isCalculating ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        {isCalculating ? "Saving..." : "Done (Save & Exit)"}
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
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>View Quotation Details</span>
            </DialogTitle>
          </DialogHeader>
          {viewingQuotation && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700 flex items-center">
                      <User className="w-4 h-4 mr-2" />
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
                      <FileText className="w-4 h-4 mr-2" />
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
                          viewingQuotation.quotationDate
                            ? format(
                                new Date(viewingQuotation.quotationDate),
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
                          viewingQuotation.dateOfBirth
                            ? format(
                                new Date(viewingQuotation.dateOfBirth),
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
                    <DollarSign className="w-4 h-4 mr-2" />
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
                      <label className="text-xs font-medium text-gray-500">
                        Premium 1
                      </label>
                      <Input
                        value={formatCurrency(viewingQuotation.premium1)}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        Premium 2
                      </label>
                      <Input
                        value={formatCurrency(viewingQuotation.premium2)}
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
                    <Target className="w-4 h-4 mr-2" />
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
                <Button
                  onClick={() => window.print()}
                  className="bg-primary hover:bg-primary-blue"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Print Details
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

export default NewQuotation;
