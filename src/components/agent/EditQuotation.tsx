// @ts-nocheck

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../UI/card";
import { Input } from "../UI/new-input";
import { Button } from "../UI/new-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../UI/new-select";
import {
  CalendarIcon,
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
  Save,
} from "lucide-react";
import { DOBCalendar } from "../UI/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../UI/popover";
import { format, isValid } from "date-fns";
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
} from "../../types/quotation";
import { generateQuotationSummaryPdf } from "../../utils/quotation-summary-pdf";

interface EditQuotationProps {
  quotation: any;
  ta;
  onClose: () => void;
}

const EditQuotation = ({ quotation, onClose }: EditQuotationProps) => {
  const { toast } = useToast();
  const [quotationDate, setQuotationDate] = useState<Date>(new Date());
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [showDOBCalendar, setShowDOBCalendar] = useState(false);
  const [showQuotationCalendar, setShowQuotationCalendar] = useState(false);
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
  });

  // Initialize form data with quotation details
  useEffect(() => {
    if (quotation) {
      // Set quotation date
      if (quotation.tDate) {
        const date = new Date(quotation.tDate);
        if (isValid(date)) {
          setQuotationDate(date);
        }
      }

      // Set date of birth
      if (quotation.dateofBirth) {
        const dob = new Date(quotation.dateofBirth);
        if (isValid(dob)) {
          setDateOfBirth(dob);
        }
      }

      // Calculate age from date of birth
      const calculateAge = (birthDate: Date) => {
        if (!isValid(birthDate)) return "";
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

      const age = quotation.dateofBirth
        ? calculateAge(new Date(quotation.dateofBirth))
        : "";

      // Set form data
      setFormData({
        quotationNumber: quotation.quoteNo || "",
        locationBranch: quotation.brCode || "",
        firstName: quotation.otherNames || "",
        lastName: quotation.surName || "",
        mobilePhone: quotation.mobilePhone || "",
        planType: quotation.coverCode || "",
        emailAddress: quotation.email || "",
        //@ts-ignore
        age: age,
        frequencyOfPayment: quotation.cardNo || "",
        duration: quotation.duration?.toString() || "",
        contributions: quotation.basicPremium?.toString() || "",
        extraRate: quotation.premium2?.toString() || "",
        loadingRate: quotation.loading?.toString() || "",
      });

      setCurrentQuoteNo(quotation.quoteNo || "");

      // Set calculation result if available
      if (quotation.sumAssured && quotation.totalPremium) {
        setCalculationResult({
          quoteNo: quotation.quoteNo,
          annualPremium: quotation.premium1 || 0,
          sumAssured: quotation.sumAssured,
          lifeCover: quotation.sumAssured, // Assuming life cover equals sum assured
          loading: quotation.loading || 0,
          extraPremium: quotation.premium2 || 0,
          totalPremium: quotation.totalPremium,
        });
      }
    }
  }, [quotation]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

    // setIsCalculating(true);
    try {
      const payload = {
        quoteNo: formData.quotationNumber || "",
        surName: formData.lastName,
        otherNames: formData.firstName,
        quotationDate:
          quotationDate && isValid(quotationDate)
            ? quotationDate.toISOString()
            : new Date().toISOString(),
        dateOfBirth:
          dateOfBirth && isValid(dateOfBirth)
            ? dateOfBirth.toISOString()
            : new Date().toISOString(),
        branchID: formData.locationBranch,
        mobileNumber: formData.mobilePhone,
        email: formData.emailAddress,
        duration: Number.parseFloat(formData.duration) || 0,
        frequency: formData.frequencyOfPayment,
        regularSaving: Number.parseFloat(formData.contributions) || 0,
        productCode: formData.planType,
        product: formData.planType,
        extraRate: Number.parseFloat(formData.extraRate) || 0,
        loadingRate: Number.parseFloat(formData.loadingRate) || 0,
        status: "draft",
      };

      console.log("Creating new quotation with payload:", payload);

      const response: QuotationCalculateResponse =
        await calculateQuotation(payload);

      // Store the calculation result for the summary
      setCalculationResult(response);

      toast({
        title: "Success",
        description: "New quotation created successfully",
      });

      // Set the new quote number from the response
      setCurrentQuoteNo(response.quoteNo);
      setFormData((prev) => ({ ...prev, quotationNumber: response.quoteNo }));

      // Fetch quotations for this quote number
      fetchFilteredQuotations(response.quoteNo);
    } catch (error: any) {
      console.error("Calculation Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create new quotation",
        variant: "destructive",
      });
    }
  };

  const calculateAgeFrom = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
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
      console.log(branches);
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

  const handleDownloadSummary = () => {
    if (!calculationResult) {
      toast({
        title: "Summary unavailable",
        description:
          "Please calculate this quotation before downloading the summary.",
        variant: "destructive",
      });
      return;
    }

    const branchDetails = branches.find(
      (branch) => branch.branchID === formData.locationBranch,
    );

    const formatCurrencyOrNA = (value?: number | string | null) => {
      if (value === null || value === undefined) return "Not specified";
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return "Not specified";
        const parsed = Number(trimmed);
        if (Number.isNaN(parsed)) return "Not specified";
        return formatCurrency(parsed);
      }
      if (Number.isNaN(value)) {
        return "Not specified";
      }
      return formatCurrency(value);
    };

    const cleanValue = (value?: string | null) => {
      if (!value) return "Not specified";
      const trimmed = value.trim();
      return trimmed.length ? trimmed : "Not specified";
    };

    const product = getSelectedProduct();
    const quoteNumber =
      calculationResult.quoteNo || formData.quotationNumber || "N/A";

    generateQuotationSummaryPdf({
      title: "Investment Link Quotation Summary",
      subtitle: product?.productName,
      quoteNumber,
      generatedDate: format(new Date(), "dd MMM yyyy, hh:mm a"),
      sections: [
        {
          title: "Client Information",
          rows: [
            {
              label: "Client Name",
              value:
                cleanValue(
                  `${formData.firstName || ""} ${formData.lastName || ""}`,
                ) || "Not specified",
            },
            { label: "Age", value: cleanValue(formData.age) },
            { label: "Phone", value: cleanValue(formData.mobilePhone) },
            { label: "Email", value: cleanValue(formData.emailAddress) },
          ],
        },
        {
          title: "Policy Information",
          rows: [
            { label: "Quote Number", value: quoteNumber },
            {
              label: "Product",
              value: product?.productName || cleanValue(formData.planType),
            },
            {
              label: "Branch",
              value:
                branchDetails?.description ||
                cleanValue(formData.locationBranch),
            },
            {
              label: "Duration",
              value: cleanValue(
                formData.duration
                  ? `${formData.duration} ${
                      Number(formData.duration) > 1 ? "years" : "year"
                    }`
                  : "",
              ),
            },
            {
              label: "Payment Frequency",
              value: cleanValue(formData.frequencyOfPayment),
            },
            {
              label: "Quotation Date",
              value:
                quotationDate && isValid(quotationDate)
                  ? format(quotationDate, "dd MMM yyyy")
                  : "Not specified",
            },
          ],
        },
        {
          title: "Financial Summary",
          rows: [
            {
              label: "Contributions",
              value: formatCurrencyOrNA(formData.contributions),
            },
            {
              label: "Sum Assured",
              value: formatCurrencyOrNA(calculationResult.sumAssured ?? 0),
            },
            {
              label: "Life Cover",
              value: formatCurrencyOrNA(calculationResult.lifeCover ?? 0),
            },
            {
              label: "Annual Premium",
              value: formatCurrencyOrNA(calculationResult.annualPremium ?? 0),
            },
            {
              label: "Extra Premium",
              value: formatCurrencyOrNA(calculationResult.extraPremium ?? 0),
            },
            {
              label: "Loading",
              value: formatCurrencyOrNA(calculationResult.loading ?? 0),
            },
            {
              label: "Total Premium",
              value: formatCurrencyOrNA(calculationResult.totalPremium ?? 0),
            },
          ],
        },
        {
          title: "Additional Details",
          rows: [
            {
              label: "Extra Rate",
              value: formData.extraRate
                ? `${formData.extraRate}%`
                : "Not specified",
            },
            {
              label: "Loading Rate",
              value: formData.loadingRate
                ? `${formData.loadingRate}%`
                : "Not specified",
            },
            {
              label: "Date of Birth",
              value:
                dateOfBirth && isValid(dateOfBirth)
                  ? format(dateOfBirth, "dd MMM yyyy")
                  : "Not specified",
            },
            { label: "Calculated Age", value: cleanValue(formData.age) },
          ],
        },
      ],
      footerNote: `${product?.productName || "Investment Link"} • GibsNonlife`,
    });

    toast({
      title: "Summary generated",
      description: "We have prepared a PDF summary for this quotation.",
    });
  };

  const handleSave = () => {
    handleCalculate();
    onClose();
  };

  useEffect(() => {
    fetchProducts();
    fetchBranches();
  }, []);

  useEffect(() => {
    if (currentQuoteNo) {
      fetchFilteredQuotations(currentQuoteNo);
    }
  }, [currentQuoteNo]);

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Edit Quotation
              </h1>
              <p className="text-gray-600">Edit an existing quotation</p>
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
                  <User className="w-5 h-5 text-blue-600" />
                  <span>Quotation Details</span>
                  <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
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
                      disabled // Made read-only
                      placeholder="Auto-generated after calculation"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Location/Branch *
                    </label>
                    <Select
                      value={formData.locationBranch}
                      onValueChange={(value) =>
                        handleInputChange("locationBranch", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingBranches
                              ? "Loading branches..."
                              : "- select -"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem
                            key={branch.branchID}
                            value={branch.description}
                          >
                            {branch.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                          {quotationDate && isValid(quotationDate)
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
                          {dateOfBirth && isValid(dateOfBirth)
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
                    <Input
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      placeholder="Enter first name"
                      disabled // Made read-only
                    />
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
                      disabled // Made read-only
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Mobile Phone *
                    </label>
                    <Input
                      value={formData.mobilePhone}
                      onChange={(e) =>
                        handleInputChange("mobilePhone", e.target.value)
                      }
                      placeholder="Enter mobile phone"
                      disabled // Made read-only
                    />
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
                    <Input
                      type="email"
                      value={formData.emailAddress}
                      onChange={(e) =>
                        handleInputChange("emailAddress", e.target.value)
                      }
                      placeholder="Enter email address"
                      disabled // Made read-only
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Age (ANB)
                    </label>
                    <Input
                      value={formData.age}
                      className="bg-gray-50"
                      disabled // Made read-only
                      placeholder="Auto-calculated from DOB"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quotation Info */}
            <Card className="shadow-lg border-0 bg-white/80">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Calculator className="w-5 h-5 text-blue-600" />
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
                        <SelectItem value="Half-Yearly">Half-Yearly</SelectItem>
                        <SelectItem value="Annually">Annually</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Fortnightly">Fortnightly</SelectItem>
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
                      {/* <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleCalculate}
                        disabled={isCalculating}
                      >
                        {isCalculating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Recalculate"
                        )}
                      </Button> */}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Multiple Details Table */}
            <Card className="shadow-lg border-0 bg-white/80">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span>Quotation Multiple Details</span>
                    {currentQuoteNo && (
                      <span className="text-sm text-gray-500">
                        (Quote No: {currentQuoteNo})
                      </span>
                    )}
                  </div>
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
                            No quotations available.
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
                              ₦{(quotation.sumAssured ?? 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">{quotation.cardNo}</td>
                            <td className="py-3 px-4">
                              ₦{(quotation.premium2 ?? 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              ₦{(quotation.loading ?? 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              ₦{(quotation.totalPremium ?? 0).toLocaleString()}
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

            {/* Mobile Quotation Summary */}
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
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
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
                            {quotationDate && isValid(quotationDate)
                              ? format(quotationDate, "dd MMM, yyyy")
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="border-b pb-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
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
                          <span className="font-bold text-blue-600">
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
                        {dateOfBirth && isValid(dateOfBirth) && (
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
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={handleDownloadSummary}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Print Summary
                      </Button>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={handleSave}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quotation Summary - Desktop only */}
          <div className="hidden lg:block lg:col-span-1 space-y-6 print-wrapper">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm sticky top-6 print-content">
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
                    <div className="border-b pb-4 avoid-break">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
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
                    <div className="border-b pb-4 avoid-break">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
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
                            {quotationDate && isValid(quotationDate)
                              ? format(quotationDate, "dd MMM, yyyy")
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="border-b pb-4 financial-summary avoid-break">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
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
                          <span className="font-bold text-blue-600">
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
                        {dateOfBirth && isValid(dateOfBirth) && (
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
                    <div className="pt-4 space-y-2 no-print">
                      {/* <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={handleCalculate}
                        disabled={isCalculating}
                      >
                        {isCalculating ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Calculator className="w-4 h-4 mr-2" />
                        )}
                        Recalculate
                      </Button> */}
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={handleDownloadSummary}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Print Summary
                      </Button>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={handleSave}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
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
                <span>View Quotation Details</span>
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
                        Date of Birth
                      </label>
                      <Input
                        value={(() => {
                          if (!viewingQuotation.dateofBirth) return "N/A";
                          const date = new Date(viewingQuotation.dateofBirth);
                          return isValid(date)
                            ? format(date, "dd MMM, yyyy")
                            : "Invalid Date";
                        })()}
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
                        className="bg-gray-50 font-medium text-blue-600"
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

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowViewDialog(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700"
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

export default EditQuotation;
