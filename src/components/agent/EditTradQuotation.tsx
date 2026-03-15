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
  Save,
} from "lucide-react";
import { DOBCalendar } from "../UI/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../UI/popover";
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
  getQuotationByQuoteNo,
  getFilteredQuotations,
  getProducts,
  getBranches,
  deleteQuotation,
  type FilteredQuotationData,
  type Product,
  type Branch,
  type TradQuotationCalculateResponse,
} from "../../types/quotation";

import { getRates } from "../../api/quotation";
import { generateQuotationSummaryPdf } from "../../utils/quotation-summary-pdf";

interface EditTradQuotationProps {
  quotation: any;
  onClose: () => void;
}

const EditTradQuotation = ({ quotation, onClose }: EditTradQuotationProps) => {
  const { toast } = useToast();
  const [quotationDate, setQuotationDate] = useState<Date>(new Date());
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [showDOBCalendar, setShowDOBCalendar] = useState(false);
  const [showQuotationCalendar, setShowQuotationCalendar] = useState(false);
  const [isLoadingQuotations, setIsLoadingQuotations] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [_isCalculating, setIsCalculating] = useState(false);
  const [showQuotationInfo] = useState(false);
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
  const [rates, setRates] = useState<RateOption[]>([]);

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
  });

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
        formData.planType === "FFP" && formData.remark
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
          "An error occurred while fetching rates. Please verify your inputs.",
      });
    } finally {
      setIsLoadingRates(false);
    }
  };

  // Initialize form data with quotation details
  useEffect(() => {
    if (quotation) {
      // Set quotation date
      if (quotation.tDate) {
        setQuotationDate(new Date(quotation.tDate));
      }

      // Set date of birth
      if (quotation.dateofBirth) {
        const dob = new Date(quotation.dateofBirth);
        setDateOfBirth(dob);
      }

      // Calculate age from date of birth
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

      const age = quotation.dateofBirth
        ? calculateAge(new Date(quotation.dateofBirth))
        : "";

      // Determine calculation mode based on initial values
      let initialCalculationMode: "premium" | "sumAssured" | null = null;
      if (quotation.premium1 > 0 && quotation.sumAssured === 0) {
        initialCalculationMode = "premium";
      } else if (quotation.sumAssured > 0 && quotation.premium1 === 0) {
        initialCalculationMode = "sumAssured";
      }
      setCalculationMode(initialCalculationMode);

      //       const calculateAgeFrom = (birthDate: Date): number => {
      //   const today = new Date();
      //   let age = today.getFullYear() - birthDate.getFullYear();
      //   const monthDiff = today.getMonth() - birthDate.getMonth();

      //   if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      //     age--;
      //   }
      //   return age;
      // };

      // Set form data
      setFormData({
        quotationNumber: quotation.quoteNo || "",
        locationBranch: quotation.brCode || "",
        firstName: quotation.otherNames || "",
        lastName: quotation.surName || "",
        mobilePhone: quotation.mobilePhone || "",
        planType: quotation.coverCode || "",
        emailAddress: quotation.email || "",
        age: age,
        frequencyOfPayment: quotation.cardNo || "",
        duration: quotation.duration?.toString() || "",
        regularSaving: quotation.regularSaving?.toString() || "",
        rateCode: quotation.rateCode || "", // Assuming rateCode is available
        rate: quotation.rate || "",
        firstPremium: quotation.premium1?.toString() || "",
        sumAssured: quotation.sumAssured?.toString() || "",
        remark: quotation.remark || "",
      });

      setCurrentQuoteNo(quotation.quoteNo || "");

      // Set calculation result if available
      if (quotation.sumAssured && quotation.totalPremium) {
        setCalculationResult({
          quoteNo: quotation.quoteNo,
          annualPremium: quotation.premium1 || 0, // Use premium1 for annual premium
          sumAssured: quotation.sumAssured,
          lifeCover: quotation.totalPremium || 0, // Use total premium for life cover
          loading: quotation.loading || 0,
          extraPremium: quotation.extraPremium || 0, // Assuming extraPremium is available
          totalPremium: quotation.totalPremium,
          firstPremium: quotation.premium1 || 0,
          premium2: quotation.premium2 || 0,
          premium3: quotation.premium3 || 0,
          intrestRate: quotation.intrestRate || 0,
        });
      }

      // Refresh from new quote-no endpoint and map response into current form structure.
      if (quotation.quoteNo) {
        (async () => {
          try {
            const response = await getQuotationByQuoteNo(quotation.quoteNo);

            // 🔍 DEBUG: Log the full response
            console.log("🔍 Full API Response:", response);

            // Extract the master object (which contains the actual quote data)
            const q = response.master || response; // Fallback to response if master doesn't exist

            console.log("🔍 Extracted master:", q);
            console.log(
              "🔍 basicPremium from API:",
              q.basicPremium,
              typeof q.basicPremium,
            );
            console.log("🔍 premium1 from API:", q.premium1, typeof q.premium1);
            console.log(
              "🔍 sumAssured from API:",
              q.sumAssured,
              typeof q.sumAssured,
            );

            if (q.tDate) {
              setQuotationDate(new Date(q.tDate));
            }

            if (q.dateofBirth) {
              setDateOfBirth(new Date(q.dateofBirth));
            }

            // Calculate age from date of birth
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

            const derivedAge = q.dateofBirth
              ? calculateAge(new Date(q.dateofBirth))
              : "";

            // Determine calculation mode based on initial values
            let initialCalculationMode: "premium" | "sumAssured" | null = null;
            if (q.premium1 > 0 && q.sumAssured === 0) {
              initialCalculationMode = "premium";
            } else if (q.sumAssured > 0 && q.premium1 === 0) {
              initialCalculationMode = "sumAssured";
            }
            setCalculationMode(initialCalculationMode);

            // 🔧 FIX: Determine firstPremium value
            // Priority: basicPremium (non-zero) > premium1 > "0"
            let firstPremiumValue = "0";
            if (
              q.basicPremium !== undefined &&
              q.basicPremium !== null &&
              q.basicPremium !== 0
            ) {
              firstPremiumValue = String(q.basicPremium);
            } else if (
              q.premium1 !== undefined &&
              q.premium1 !== null &&
              q.premium1 !== 0
            ) {
              firstPremiumValue = String(q.premium1);
            }

            console.log("🔧 Setting firstPremium to:", firstPremiumValue);

            setFormData((prev) => ({
              ...prev,
              quotationNumber: q.quoteNo || prev.quotationNumber,
              locationBranch: q.brCode || prev.locationBranch,
              firstName: q.otherNames || prev.firstName,
              lastName: q.surName || prev.lastName,
              mobilePhone: q.mobilePhone || prev.mobilePhone,
              planType: q.coverCode || prev.planType,
              emailAddress: q.email || prev.emailAddress,
              age: derivedAge || prev.age,
              frequencyOfPayment: q.cardNo || prev.frequencyOfPayment,
              duration:
                q.duration !== undefined && q.duration !== null
                  ? String(q.duration)
                  : prev.duration,

              // The new response body doesn't provide these in your sample.
              // Keep them as-is to avoid changing the form structure/behavior.
              regularSaving: prev.regularSaving,
              rateCode: prev.rateCode,
              rate: prev.rate,

              // 🔧 Use the computed firstPremiumValue
              firstPremium: firstPremiumValue,
              sumAssured:
                q.sumAssured !== undefined && q.sumAssured !== null
                  ? String(q.sumAssured)
                  : prev.sumAssured,

              // New response uses "remarks" (plural)
              remark: (q.remarks ?? prev.remark) || "",
            }));

            setCurrentQuoteNo(q.quoteNo || quotation.quoteNo);

            if (q.sumAssured && q.totalPremium) {
              setCalculationResult((prev) => ({
                ...(prev ?? {
                  quoteNo: q.quoteNo,
                  annualPremium: 0,
                  sumAssured: 0,
                  lifeCover: 0,
                  loading: 0,
                  extraPremium: 0,
                  totalPremium: 0,
                  firstPremium: 0,
                }),
                quoteNo: q.quoteNo,
                annualPremium: q.premium1 || 0,
                sumAssured: q.sumAssured,
                lifeCover: q.totalPremium || 0,
                loading: q.loading || 0,
                totalPremium: q.totalPremium,
                // 🔧 Use basicPremium for calculationResult too
                firstPremium:
                  q.basicPremium !== undefined &&
                  q.basicPremium !== null &&
                  q.basicPremium !== 0
                    ? q.basicPremium
                    : q.premium1 || 0,
                // 🔧 Add maturity benefits from quote-no response
                premium2: q.premium2 || 0,
                premium3: q.premium3 || 0,
                intrestRate: q.intrestRate || 0,
              }));
            }

            console.log("✅ Form data updated with API response");
          } catch (error: any) {
            console.error("❌ Quote-no Fetch Error:", error);
            // Non-blocking: keep the already-hydrated prop values.
          }
        })();
      }
    }
  }, [quotation]);

  // useEffect to fetch rates when required fields change
  useEffect(() => {
    if (
      formData.age &&
      formData.duration &&
      formData.rateCode &&
      formData.planType
    ) {
      // A small delay to avoid too many API calls
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
      setFormData((prev) => ({ ...prev, rateCode: value }));
    }
  };

  const handleDOBChange = (date: Date) => {
    setDateOfBirth(date);
    //@ts-ignore
    const calculatedAge = calculateAgeFrom(date);
    setFormData((prev) => ({ ...prev, age: String(calculatedAge) }));
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
      const payload = {
        quoteNo: formData.quotationNumber || "",
        surName: formData.lastName,
        otherNames: formData.firstName,
        quotationDate: quotationDate.toISOString(),
        dateOfBirth: dateOfBirth.toISOString(),
        branchID: formData.locationBranch,
        mobileNumber: formData.mobilePhone,
        email: formData.emailAddress,
        duration: Number.parseFloat(formData.duration) || 0,
        frequency: formData.frequencyOfPayment,
        regularSaving: Number.parseFloat(formData.regularSaving) || 0,
        productCode: formData.planType,
        age: Number.parseInt(formData.age) || 0,
        rateCode: formData.frequencyOfPayment.toUpperCase(),
        product: formData.planType,
        firstPremium: Number.parseFloat(formData.firstPremium) || 0,
        sumAssured: Number.parseFloat(formData.sumAssured) || 0,
        status: "draft",
      };

      console.log("Calculating traditional quotation with payload:", payload);

      const response: TradQuotationCalculateResponse =
        await calculateTradQuotation(payload);

      // Store the calculation result for the summary
      setCalculationResult(response);

      // Update the form with calculated values
      if (calculationMode === "premium") {
        // If user entered premium, update sum assured from response
        const calculatedSumAssured = formatTo2DpOrZero(response.sumAssured);
        setFormData((prev) => ({
          ...prev,
          sumAssured: calculatedSumAssured,
        }));
      } else if (calculationMode === "sumAssured") {
        // If user entered sum assured, update first premium from response
        const calculatedFirstPremium = formatTo2DpOrZero(response.firstPremium);
        setFormData((prev) => ({
          ...prev,
          firstPremium: calculatedFirstPremium,
        }));
      }

      toast({
        title: "Success",
        description: "Traditional quotation calculated successfully",
      });

      // Set the current quote number from the response
      setCurrentQuoteNo(response.quoteNo);
      setFormData((prev) => ({ ...prev, quotationNumber: response.quoteNo }));

      // Fetch quotations for this quote number
      fetchFilteredQuotations(response.quoteNo);
    } catch (error: any) {
      console.error("Calculation Error:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to calculate traditional quotation",
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
      console.log("Products fetched (riskID A only):", data);
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

    const selectedRate = rates.find((rate) => rate.rateID === formData.rate);

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

    const calculationModeLabel =
      calculationMode === "premium"
        ? "Premium → Sum Assured"
        : "Sum Assured → Premium";

    const product = getSelectedProduct();
    const quoteNumber =
      calculationResult.quoteNo || formData.quotationNumber || "N/A";

    generateQuotationSummaryPdf({
      title: "Traditional Quotation Summary",
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
              value: quotationDate
                ? format(quotationDate, "dd MMM yyyy")
                : "Not specified",
            },
          ],
        },
        {
          title: "Financial Summary",
          rows: [
            {
              label: "First Premium",
              value: formatCurrencyOrNA(
                calculationResult.firstPremium ?? formData.firstPremium,
              ),
            },
            {
              label: "Annual Premium",
              value: formatCurrencyOrNA(calculationResult.annualPremium ?? 0),
            },
            {
              label: "Sum Assured",
              value: formatCurrencyOrNA(
                calculationResult.sumAssured ?? formData.sumAssured,
              ),
            },
            {
              label: "Life Cover",
              value: formatCurrencyOrNA(calculationResult.lifeCover ?? 0),
            },
            {
              label: "Extra Premium",
              value: formatCurrencyOrNA(calculationResult.extraPremium ?? 0),
            },
            ...(calculationResult.premium2 !== undefined &&
            calculationResult.premium2 !== null &&
            Number(calculationResult.premium2) !== 0
              ? [
                  {
                    label: "1st Maturity Benefit",
                    value: formatCurrencyOrNA(calculationResult.premium2),
                  },
                ]
              : []),
            ...(calculationResult.premium3 !== undefined &&
            calculationResult.premium3 !== null &&
            Number(calculationResult.premium3) !== 0
              ? [
                  {
                    label: "2nd Maturity Benefit",
                    value: formatCurrencyOrNA(calculationResult.premium3),
                  },
                ]
              : []),
            ...(calculationResult.intrestRate !== undefined &&
            calculationResult.intrestRate !== null &&
            Number(calculationResult.intrestRate) !== 0
              ? [
                  {
                    label: "3rd Maturity Benefit",
                    value: formatCurrencyOrNA(calculationResult.intrestRate),
                  },
                ]
              : []),
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
              label: "Selected Rate",
              value: cleanValue(formData.rate),
            },
            { label: "Remark", value: cleanValue(formData.remark) },
            { label: "Calculation Mode", value: calculationModeLabel },
            {
              label: "Date of Birth",
              value: dateOfBirth
                ? format(dateOfBirth, "dd MMM yyyy")
                : "Not specified",
            },
          ],
        },
      ],
      footerNote: `${product?.productName || "Traditional"} • GibsNonlife`,
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
                Edit Traditional Quotation
              </h1>
              <p className="text-gray-600">
                Edit an existing traditional insurance quotation
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
                      disabled // Made read-only
                      placeholder="Auto-generated after calculation"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Location/Branch *
                    </label>
                    <select
                      value={formData.locationBranch}
                      disabled // Made read-only
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                    >
                      <option value="">
                        {isLoadingBranches
                          ? "Loading branches..."
                          : "- select -"}
                      </option>
                      {branches.map((branch) => (
                        <option
                          key={branch.branchID}
                          value={branch.description}
                        >
                          {branch.description}
                        </option>
                      ))}
                    </select>
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
                          className="w-full justify-start text-left font-normal bg-gray-50"
                          disabled
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
                          className="w-full justify-start text-left font-normal bg-gray-50"
                          disabled
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
                    <select
                      value={formData.planType}
                      disabled // Made read-only
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                    >
                      <option value="">
                        {isLoadingProducts
                          ? "Loading products..."
                          : "Select plan type"}
                      </option>
                      {products
                        .filter((product) => product.riskID === "A")
                        .map((product) => (
                          <option
                            key={product.productID}
                            value={product.productID}
                          >
                            {product.productName}
                          </option>
                        ))}
                    </select>
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
                      <Input
                        value={formData.frequencyOfPayment}
                        readOnly
                        disabled
                        className="bg-gray-50"
                      />
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
                        disabled
                        className="bg-gray-50"
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

                    {/* REMARK FIELD FOR FFP */}
                    {formData.planType === "FFP" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Payment Variant:
                        </label>
                        <Input
                          value={formData.remark}
                          readOnly
                          disabled
                          className="bg-gray-50"
                        />
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
                          const val = e.target.value.trim();
                          if (val !== "") {
                            const formatted = formatTo2Dp(val);
                            handleInputChange("firstPremium", formatted);
                          }
                        }}
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        disabled
                        className="bg-gray-50"
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
                          const val = e.target.value.trim();
                          if (val !== "") {
                            const formatted = formatTo2Dp(val);
                            handleInputChange("sumAssured", formatted);
                          }
                        }}
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    {/* <Button
                      className="bg-primary hover:bg-primary-blue"
                      onClick={handleCalculate}
                      disabled={isCalculating || !calculationMode}
                    >
                      {isCalculating ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Calculator className="w-4 h-4 mr-2" />
                      )}
                      Recalculate Traditional Quote
                    </Button> */}
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
                            No quotations available. Calculate a quotation
                            first.
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

            {/* Mobile Quotation Summary */}
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
                            {formatCurrency(calculationResult.firstPremium)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {formData.planType === "SPP\r\n"
                              ? "Annual Salary:"
                              : "Sum Assured:"}
                          </span>
                          <span className="font-bold text-primary">
                            {formatCurrency(calculationResult.sumAssured)}
                          </span>
                        </div>

                        {/* Maturity Benefit Fields */}
                        {calculationResult.premium2 !== undefined &&
                          calculationResult.premium2 !== null &&
                          Number(calculationResult.premium2) !== 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                1st Maturity Benefit:
                              </span>
                              <span className="font-medium">
                                {formatCurrency(calculationResult.premium2)}
                              </span>
                            </div>
                          )}
                        {calculationResult.premium3 !== undefined &&
                          calculationResult.premium3 !== null &&
                          Number(calculationResult.premium3) !== 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                2nd Maturity Benefit:
                              </span>
                              <span className="font-medium">
                                {formatCurrency(calculationResult.premium3)}
                              </span>
                            </div>
                          )}
                        {calculationResult.intrestRate !== undefined &&
                          calculationResult.intrestRate !== null &&
                          Number(calculationResult.intrestRate) !== 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                3rd Maturity Benefit:
                              </span>
                              <span className="font-medium">
                                {formatCurrency(calculationResult.intrestRate)}
                              </span>
                            </div>
                          )}

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

                    {/* Calculation Mode Information */}
                    <div className="border-b pb-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
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
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={handleDownloadSummary}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Print Summary
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
                    <div className="border-b pb-4 avoid-break">
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
                    <div className="border-b pb-4 avoid-break">
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
                    <div className="border-b pb-4 financial-summary avoid-break">
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
                            {formatCurrency(calculationResult.firstPremium)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {formData.planType === "SPP\r\n"
                              ? "Annual Salary:"
                              : "Sum Assured:"}
                          </span>
                          <span className="font-bold text-primary">
                            {formatCurrency(calculationResult.sumAssured)}
                          </span>
                        </div>

                        {/* Maturity Benefit Fields from quote-no API */}
                        {calculationResult.premium2 !== undefined &&
                          calculationResult.premium2 !== null &&
                          Number(calculationResult.premium2) !== 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                1st Maturity Benefit:
                              </span>
                              <span className="font-medium">
                                {formatCurrency(calculationResult.premium2)}
                              </span>
                            </div>
                          )}
                        {calculationResult.premium3 !== undefined &&
                          calculationResult.premium3 !== null &&
                          Number(calculationResult.premium3) !== 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                2nd Maturity Benefit:
                              </span>
                              <span className="font-medium">
                                {formatCurrency(calculationResult.premium3)}
                              </span>
                            </div>
                          )}
                        {calculationResult.intrestRate !== undefined &&
                          calculationResult.intrestRate !== null &&
                          Number(calculationResult.intrestRate) !== 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                3rd Maturity Benefit:
                              </span>
                              <span className="font-medium">
                                {formatCurrency(calculationResult.intrestRate)}
                              </span>
                            </div>
                          )}

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
                    <div className="pt-4 space-y-2 no-print">
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={handleDownloadSummary}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Print Summary
                      </Button>
                      {/* Save Changes button hidden - this is a view-only page */}
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
                      <label className="text-xs font-medium text-gray-500">
                        First Premium
                      </label>
                      <Input
                        value={formatCurrency(viewingQuotation.premium1)}
                        readOnly
                        className="bg-gray-50 font-medium text-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">
                        Annual Premium
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
                          viewingQuotation?.createdAt || "N/A"
                            ? format(
                                new Date(
                                  viewingQuotation?.createdAt || new Date(),
                                ),
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

export default EditTradQuotation;
