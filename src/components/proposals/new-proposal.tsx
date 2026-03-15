// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../UI/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../UI/tabs";
import { Label } from "../UI/label";
import { Input } from "../UI/new-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../UI/new-select";
import { Popover, PopoverContent, PopoverTrigger } from "../UI/popover";
import { Button } from "../UI/new-button";
import {
  CalendarIcon,
  Loader2,
  Users,
  Plus,
  CheckCircle,
  CreditCard,
  Banknote,
  User,
  FileText,
  Image,
  Heart,
} from "lucide-react";
import { cn } from "@/utils/class-names";
import { DOBCalendar, Calendar } from "../UI/calendar";
import { Textarea } from "../UI/textarea";
import { format } from "date-fns";
import type { ProposalFormData } from "@/types/proposals";
import { useAppDispatch, useAppSelector } from "@/hooks/use-apps";
import {
  clearMessages,
  createProposal,
  getProducts,
  selectProposals,
} from "@/features/reducers/individualLifeReducers/proposalSlice";
import { useToast } from "../UI/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../UI/dropdown";
import CreateBeneficiaryForm, {
  BeneficiaryFormData,
} from "./CreateBeneficiaryForm";
import {
  getBeneficiariesByProposal,
  selectBeneficiaries,
} from "@/features/reducers/beneficiariesReducers/beneficiariesSlice";
import DocumentManager from "./DocumentManager";
import { SERVER_URL } from "@/utils/constants";

type CustomerSearchResult = {
  customerID: string;
  title?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  otherName?: string | null;
  gender?: string | null;
  email?: string | null;
  phoneLine1?: string | null;
  phoneLine2?: string | null;
  address?: string | null;
  cityLGA?: string | null;
  stateID?: string | null;
  nationality?: string | null;
  dateOfBirth?: string | null;
  taxIdNumber?: string | null;
  kycType?: string | null;
  kycNumber?: string | null;
  nextOfKin?: {
    title?: string | null;
    lastName?: string | null;
    firstName?: string | null;
    otherName?: string | null;
    email?: string | null;
    address?: string | null;
    phoneLine1?: string | null;
  } | null;
};

// Using your exact schema with all payment fields
const initialState: ProposalFormData = {
  title: "",
  assuredCode: "",
  surName: "",
  otherNames: "",
  fullName: "",
  address: "",
  state: "",
  landphone: "",
  mobilePhone: "",
  email: "",
  nationalID: "",
  occupation: "",
  gender: "",
  dateOfBirth: undefined,
  duration: 1,
  frequency: "Single",
  regularSaving: "",
  firstPremium: "",
  productCode: "",
  extraRate: 0,
  loadingRate: 0,
  maritalStatus: "",
  country: "",
  agentCode: "",
  agentDescription: "",
  riskID: "A",
  meansID: "",
  idNo: "",
  chronicIllness: "",
  mop: "",
  paymentType: "",
  paymentAmount: "",
  dateofpayment: undefined,
  receiptNo: "",
  bankName: "",
  accountNo: "",
  spouseName: "",
  localGovtOrigin: "",
  religion: "",
  designation: "",
  residentialAddress: "",
  contactAddress: "",
  landmark: "",
  issueDate: undefined,
  expiryDate: undefined,
  ninNumber: "",
  bvnNumber: "",
  employmentType: "",
  employerName: "",
  employerAddress: "",
  dateEmployed: undefined,
  employerTelNo: "",
  employerEmail: "",
  height: "",
  weight: "",
  sportEngagement: "",
  bodilyInfirmity: "",
  medicalConditions: "",
  currentTreatment: "",
  workAbsence: "",
  habits: "",
  aviationEngagement: "",
};

const NewProposal = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  const { products, success, loading, error } = useAppSelector(selectProposals);
  const beneficiaryState = useAppSelector(selectBeneficiaries);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [form, setForm] = useState<ProposalFormData>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<
    CustomerSearchResult[]
  >([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const customerSearchAbortRef = useRef<AbortController | null>(null);

  const [showBeneficiaryForm, setShowBeneficiaryForm] = useState(false);
  const [localBeneficiaries, setLocalBeneficiaries] = useState<
    BeneficiaryFormData[]
  >([]);
  const [currentProposalNo, setCurrentProposalNo] = useState<string | null>(
    null,
  );
  const [proposalCreated, setProposalCreated] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const tabs = ["personal", "product", "beneficiaries", "documents"] as const;

  useEffect(() => {
    dispatch(getProducts());
  }, [dispatch]);

  useEffect(() => {
    const agentCode = localStorage.getItem("agentId");
    if (agentCode) {
      setForm((prev) => ({ ...prev, agentCode }));
    }
  }, []);

  // Fetch beneficiaries when proposal number is available
  useEffect(() => {
    if (currentProposalNo && currentProposalNo.trim() !== "") {
      dispatch(getBeneficiariesByProposal(currentProposalNo));
    }
  }, [currentProposalNo, dispatch]);

  // Update local beneficiaries when backend data changes
  useEffect(() => {
    if (beneficiaryState.beneficiaries.items.length > 0) {
      // Filter beneficiaries to only show ones matching current proposal
      const filtered = currentProposalNo
        ? beneficiaryState.beneficiaries.items.filter(
            (b) => b.proposalNo === currentProposalNo,
          )
        : beneficiaryState.beneficiaries.items;

      const formattedBeneficiaries: BeneficiaryFormData[] = filtered.map(
        (b) => ({
          surname: b.surname,
          otherNames: b.otherNames,
          address: b.address,
          sex: b.sex,
          dateOfBirth: b.dob ? new Date(b.dob) : undefined,
          age: parseInt(b.age) || 0,
          relationship: b.relation,
          percentage: b.percentage,
          beneficiaryType: b.type,
          remark: b.remark,
          tag: b.tag,
          proposalNo: b.proposalNo,
          policyNo: b.policyNo,
        }),
      );

      console.log(
        "✅ NewProposal - Setting local beneficiaries:",
        formattedBeneficiaries,
      );
      setLocalBeneficiaries(formattedBeneficiaries);
    } else {
      console.log(
        "⚠️ NewProposal - No beneficiaries in state, clearing local list",
      );
      setLocalBeneficiaries([]);
    }
  }, [beneficiaryState.beneficiaries.items, currentProposalNo]);

  useEffect(() => {
    if (success.createProposal) {
      dispatch(clearMessages());
      setProposalCreated(true);
    } else if (error.createProposal) {
      toast({
        title: "Error",
        description: error.createProposal || "Failed to create proposal",
        variant: "destructive",
      });
    }
  }, [dispatch, error.createProposal, success.createProposal, toast]);

  const handleAddBeneficiary = (beneficiaryData: BeneficiaryFormData) => {
    setShowBeneficiaryForm(false);

    if (currentProposalNo) {
      setTimeout(() => {
        dispatch(getBeneficiariesByProposal(currentProposalNo));
      }, 500);
    }
  };
  const validatePersonalInfo = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic required field validations
    if (!form.title) newErrors.title = "Title is required";
    if (!form.surName) newErrors.surName = "Surname is required";
    if (!form.otherNames) newErrors.otherNames = "Other names are required";
    if (!form.fullName) newErrors.fullName = "Full name is required";
    if (!form.gender) newErrors.gender = "Gender is required";
    if (!form.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!form.maritalStatus)
      newErrors.maritalStatus = "Marital status is required";
    if (!form.occupation) newErrors.occupation = "Occupation is required";

    // Address validations
    if (!form.residentialAddress)
      newErrors.residentialAddress = "Residential address is required";
    if (!form.state) newErrors.state = "State is required";
    if (!form.country) newErrors.country = "Country is required";

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation patterns
    const phoneRegex = /^[0-9]+$/;

    // Mobile phone validation
    if (!form.mobilePhone) {
      newErrors.mobilePhone = "Mobile phone is required";
    } else if (!phoneRegex.test(form.mobilePhone)) {
      newErrors.mobilePhone = "Phone number must contain only numbers";
    } else if (form.mobilePhone.length < 10) {
      newErrors.mobilePhone = "Phone number must be at least 10 digits";
    } else if (form.mobilePhone.length > 15) {
      newErrors.mobilePhone = "Phone number cannot exceed 15 digits";
    }

    // ID Information validations
    if (!form.meansID) newErrors.meansID = "Means of ID is required";
    if (!form.idNo) newErrors.idNo = "ID number is required";
    if (!form.issueDate) newErrors.issueDate = "Issue date is required";

    // Employment validations
    if (!form.employmentType)
      newErrors.employmentType = "Type of employment is required";
    if (!form.dateEmployed)
      newErrors.dateEmployed = "Date employed is required";

    // // National ID validation
    // if (!form.nationalID) {
    //   newErrors.nationalID = "National ID is required";
    // } else if (!idNoRegex.test(form.nationalID)) {
    //   newErrors.nationalID = "National ID must contain only numbers";
    // } else if (form.nationalID.length < 10) {
    //   newErrors.nationalID = "National ID must be at least 10 digits";
    // } else if (form.nationalID.length > 15) {
    //   newErrors.nationalID = "National ID cannot exceed 15 digits";
    // }

    // // ID Number validation
    // if (!form.idNo) {
    //   newErrors.idNo = "ID number is required";
    // } else if (!idNoRegex.test(form.idNo)) {
    //   newErrors.idNo = "ID number must contain only numbers";
    // } else if (form.idNo.length < 10) {
    //   newErrors.idNo = "ID number must be at least 10 digits";
    // } else if (form.idNo.length > 15) {
    //   newErrors.idNo = "ID number cannot exceed 15 digits";
    // }

    // Landphone validation (optional)
    // if (form.landphone && form.landphone.trim() !== "") {
    //   if (!phoneRegex.test(form.landphone)) {
    //     newErrors.landphone = "Landphone must contain only numbers";
    //   } else if (form.landphone.length < 7) {
    //     newErrors.landphone = "Landphone must be at least 7 digits";
    //   } else if (form.landphone.length > 15) {
    //     newErrors.landphone = "Landphone cannot exceed 15 digits";
    //   }
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateProductInfo = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.productCode) newErrors.productCode = "Product is required";
    if (!form.duration || form.duration < 1)
      newErrors.duration = "Duration must be at least 1 year";
    if (!form.frequency) newErrors.frequency = "Payment frequency is required";

    // Updated validation to handle empty string
    const savingAmount =
      typeof form.regularSaving === "string"
        ? parseFloat(form.regularSaving)
        : form.regularSaving;

    if (
      !form.regularSaving ||
      form.regularSaving === "" ||
      isNaN(savingAmount) ||
      savingAmount <= 0
    )
      newErrors.regularSaving =
        "Regular saving amount is required and must be positive";

    const premiumAmount =
      typeof form.firstPremium === "string"
        ? parseFloat(form.firstPremium)
        : form.firstPremium;

    if (
      !form.firstPremium ||
      form.firstPremium === "" ||
      isNaN(premiumAmount) ||
      premiumAmount <= 0
    )
      newErrors.firstPremium =
        "First premium amount is required and must be positive";

    // Payment date validation
    if (!form.dateofpayment)
      newErrors.dateofpayment = "Payment date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleDropdown = () => {
    setOpen((prev) => !prev);
  };

  const filteredOptions = products
    .filter(
      (product) =>
        product.productName.toLowerCase().includes(search.toLowerCase()) &&
        product.riskID === "B",
    )
    .slice(0, 5);

  const handleChange = (field: keyof ProposalFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when value changes
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const parsedValue =
      type === "number" ? (value === "" ? "" : Number(value)) : value;
    handleChange(name as keyof ProposalFormData, parsedValue);

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (name === "surName") {
      const trimmed = value.trim();
      setCustomerSearchQuery(trimmed);

      if (trimmed.length >= 2) {
        setShowCustomerSuggestions(true);
      } else {
        customerSearchAbortRef.current?.abort();
        customerSearchAbortRef.current = null;
        setCustomerResults([]);
        setShowCustomerSuggestions(false);
        setIsSearchingCustomers(false);
      }
    }
  };

  const handleCreateProposal = async () => {
    // Validate personal info first
    if (!validatePersonalInfo()) {
      setActiveTab("personal");
      toast({
        title: "Validation Error",
        description: "Please fill all required personal information fields",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    // Then validate product info
    if (!validateProductInfo()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required product fields correctly",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get agent code and agent name from localStorage
      const agentCode = localStorage.getItem("agentId") || "";
      let agentName = localStorage.getItem("agentName") || "";

      // Fallback: if agentName is not stored, extract it from the JWT token
      if (!agentName) {
        try {
          const token = localStorage.getItem("token");
          if (token) {
            const tokenPayload = JSON.parse(atob(token.split(".")[1]));
            agentName = tokenPayload.AgentName || tokenPayload.name || "";
            if (agentName) {
              localStorage.setItem("agentName", agentName);
            }
          }
        } catch (e) {
          console.error("Error extracting agent name from token:", e);
        }
      }

      const proposalData = {
        title: form.title,
        assuredCode: form.assuredCode || "",
        surName: form.surName,
        otherNames: form.otherNames,
        fullName: form.fullName,
        address: form.address || form.residentialAddress || "",
        state: form.state,
        landphone: form.landphone || "",
        mobilePhone: form.mobilePhone,
        email: form.email,
        nationalID: form.nationalID,
        occupation: form.occupation,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth ? form.dateOfBirth.toISOString() : "",
        duration: form.duration,
        frequency: form.frequency,
        regularSaving:
          typeof form.regularSaving === "string"
            ? form.regularSaving === ""
              ? 0
              : parseFloat(form.regularSaving)
            : form.regularSaving,
        firstPremium:
          typeof form.firstPremium === "string"
            ? form.firstPremium === ""
              ? 0
              : parseFloat(form.firstPremium)
            : form.firstPremium,
        productCode: form.productCode,
        extraRate: form.extraRate || 0,
        loadingRate: form.loadingRate || 0,
        maritalStatus: form.maritalStatus,
        country: form.country,
        agentCode: agentCode,
        agentDescription: agentName,
        riskID: form.riskID || "A",
        meansID: form.meansID,
        idNo: form.idNo,
        chronicIllness: form.chronicIllness || "",
        mop: form.mop || "",
        paymentType: form.paymentType || "",
        paymentAmount:
          typeof form.paymentAmount === "string"
            ? form.paymentAmount === ""
              ? 0
              : parseFloat(form.paymentAmount)
            : form.paymentAmount || 0,
        dateofpayment: form.dateofpayment
          ? form.dateofpayment.toISOString()
          : "",
        receiptNo: form.receiptNo || "",
        bankName: form.bankName || "",
        accountNo: form.accountNo || "",

        // NEW FIELDS REQUIRED BY BACKEND:
        placeOfBirth: form.placeOfBirth || "",
        govtOfOrigin: form.localGovtOrigin || "",
        resAddress: form.residentialAddress || form.address || "",
        landMark: form.landmark || "",
        sport: form.sportEngagement || "",
        infirmity: form.bodilyInfirmity || "",
        stroke: form.medicalConditions || "", // This includes stroke conditions
        treatment: form.currentTreatment || "",
        workAbesent: form.workAbsence || "",
        smoke: form.habits || "",
        aviation: form.aviationEngagement || "",

        // Additional contact information fields
        spouseName: form.spouseName || "",
        contactName: form.contactName || "",
        contactAddress: form.contactAddress || "",
        contactPhone: form.contactPhone || "",
        contactEmail: form.contactEmail || "",
        contactJob: form.contactJob || "",

        // Employment fields
        employmentType: form.employmentType || "",
        employerName: form.employerName || "",
        employerAddress: form.employerAddress || "",
        employerNumber: form.employerTelNo || "",
        employerEmail: form.employerEmail || "",
        dateEmployed: form.dateEmployed ? form.dateEmployed.toISOString() : "",

        // Physical attributes
        height: form.height || "",
        weight: form.weight || "",

        // Identification fields
        nin: form.ninNumber || "",
        bvn: form.bvnNumber || "",
      };

      const result = await dispatch(createProposal(proposalData)).unwrap();

      if (result?.proposalNo) {
        setCurrentProposalNo(result.proposalNo);
        toast({
          title: "Proposal Created Successfully",
          description: `Proposal Number: ${result.proposalNo}`,
          variant: "success",
        });
        // Automatically navigate to beneficiaries tab
        setActiveTab("beneficiaries");
      }
    } catch (error: any) {
      console.error("❌ Failed to create proposal:", error);
      toast({
        title: "Error Creating Proposal",
        description: error?.message || "Failed to create proposal",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (activeTab === "personal") {
      const isValid = validatePersonalInfo();

      if (!isValid) {
        toast({
          title: "Validation Error",
          description: "Please fill all required personal information fields",
          variant: "destructive",
          duration: 1000,
        });
        return;
      }
    }

    const currentIndex = tabs.indexOf(activeTab as (typeof tabs)[number]);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const currentIndex = tabs.indexOf(activeTab as (typeof tabs)[number]);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  // Customer search implementation
  useEffect(() => {
    const query = customerSearchQuery.trim();

    if (query.length < 2) {
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
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            signal: controller.signal,
          },
        );

        if (!response.ok) throw new Error("Failed to search customers");

        const payload = await response.json();
        const results: CustomerSearchResult[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];

        const normalizedQuery = query.toLowerCase();
        const filtered = results.filter((customer) =>
          (customer.lastName || "").toLowerCase().includes(normalizedQuery),
        );

        setCustomerResults(filtered);
        setShowCustomerSuggestions(true);
      } catch (error: any) {
        if (error?.name === "AbortError") return;
        console.error("Customer search error:", error);
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

  const applyCustomerSelection = (customer: CustomerSearchResult) => {
    const trim = (value?: string | null) => (value ? value.trim() : "");
    const resolvedSurname = trim(customer.lastName);
    const resolvedOtherNames = [
      trim(customer.firstName),
      trim(customer.otherName),
    ]
      .filter(Boolean)
      .join(" ");
    const resolvedFullName = [
      trim(customer.title),
      trim(customer.firstName),
      trim(customer.otherName),
      trim(customer.lastName),
    ]
      .filter(Boolean)
      .join(" ");
    const resolvedGender = (() => {
      const raw = trim(customer.gender)?.toUpperCase();
      if (raw === "MALE") return "Male";
      if (raw === "FEMALE") return "Female";
      return "";
    })();
    const resolvedDob = customer.dateOfBirth
      ? new Date(customer.dateOfBirth)
      : undefined;
    const resolvedMobile =
      trim(customer.phoneLine1) || trim(customer.phoneLine2);
    const resolvedLand = trim(customer.phoneLine2) || trim(customer.phoneLine1);
    const resolvedKycType = (() => {
      const raw = trim(customer.kycType)?.toUpperCase();
      switch (raw) {
        case "NATIONAL_ID":
          return "National ID";
        case "PASSPORT":
          return "Passport";
        case "DRIVERS_LICENSE":
          return "Driver's License";
        case "VOTERS_CARD":
          return "Voter's Card";
        default:
          return "";
      }
    })();

    const updates: Partial<ProposalFormData> = {
      assuredCode: trim(customer.customerID),
      surName: resolvedSurname,
      otherNames: resolvedOtherNames,
      fullName: resolvedFullName,
      gender: resolvedGender,
      dateOfBirth: resolvedDob,
      address: trim(customer.address),
      state: trim(customer.stateID || customer.cityLGA),
      country: trim(customer.nationality),
      landphone: resolvedLand,
      mobilePhone: resolvedMobile,
      email: trim(customer.email),
      nationalID: trim(customer.taxIdNumber),
      meansID: resolvedKycType,
      idNo: trim(customer.kycNumber),
    };

    setForm((prev) => ({ ...prev, ...updates }));
    setErrors((prev) => {
      const cleared = { ...prev };
      Object.keys(updates).forEach((key) => {
        if (updates[key as keyof ProposalFormData] !== undefined) {
          delete cleared[key];
        }
      });
      return cleared;
    });

    setCustomerSearchQuery(resolvedSurname);
    setCustomerResults([]);
    setShowCustomerSuggestions(false);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-20 max-w-6xl">
      <Card className="w-full">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl">
            Create New Proposal
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Complete all sections to create a comprehensive insurance proposal
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 h-auto gap-1 p-1">
              <TabsTrigger
                value="personal"
                className="text-xs px-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-center flex items-center justify-center gap-1 min-h-[2.5rem]"
              >
                <User className="h-3 w-3 sm:mr-1" />
                <span className=" xs:inline">Personal</span>
                <span className="xs:hidden">Info</span>
              </TabsTrigger>

              <TabsTrigger
                value="product"
                className="text-xs px-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-center flex items-center justify-center gap-1 min-h-[2.5rem]"
              >
                {proposalCreated && (
                  <CheckCircle className="h-3 w-3 flex-shrink-0" />
                )}
                <FileText className="h-3 w-3 sm:mr-1" />
                <span className=" xs:inline">Cover</span>
                <span className="xs:hidden">Details</span>
              </TabsTrigger>

              <TabsTrigger
                value="beneficiaries"
                className="text-xs px-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-center flex items-center justify-center gap-1 min-h-[2.5rem]"
              >
                <Users className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Beneficiaries</span>
                <span className="sm:hidden">Benef.</span>
              </TabsTrigger>

              <TabsTrigger
                value="documents"
                className="text-xs px-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-center flex items-center justify-center gap-1 min-h-[2.5rem]"
              >
                <FileText className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Documents</span>
                <span className="sm:hidden">Docs</span>
              </TabsTrigger>
            </TabsList>

            {/* Personal Info Tab - Updated with all new fields */}
            <TabsContent
              value="personal"
              className="space-y-4 sm:space-y-6 mt-4 sm:mt-6"
            >
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Title *
                    </Label>
                    <Select
                      value={form.title}
                      onValueChange={(value) => handleChange("title", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select title" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mr">Mr</SelectItem>
                        <SelectItem value="Mrs">Mrs</SelectItem>
                        <SelectItem value="Miss">Miss</SelectItem>
                        <SelectItem value="Dr">Dr</SelectItem>
                        <SelectItem value="Prof">Prof</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.title && (
                      <p className="text-sm text-red-500">{errors.title}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="surName" className="text-sm font-medium">
                      Surname *
                    </Label>
                    <div className="relative">
                      <Input
                        id="surName"
                        name="surName"
                        value={form.surName}
                        onChange={handleInputChange}
                        // onFocus={() => {
                        //   if (customerResults.length > 0) {
                        //     setShowCustomerSuggestions(true);
                        //   }
                        // }}
                        onBlur={() => {
                          setTimeout(
                            () => setShowCustomerSuggestions(false),
                            150,
                          );
                        }}
                        placeholder="Enter surname"
                        className="w-full"
                        autoComplete="off"
                      />
                      {/* {showCustomerSuggestions && (
                        <div className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto rounded-md border border-border bg-white shadow-lg">
                          {isSearchingCustomers && (
                            <div className="flex items-center px-3 py-2 text-sm text-muted-foreground">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Searching...
                            </div>
                          )}
                          {!isSearchingCustomers &&
                            customerResults.length === 0 && (
                              <div className="px-3 py-2 text-sm text-muted-foreground">
                                No matching customers found
                              </div>
                            )}
                          {customerResults.map((customer) => {
                            const displayName = [
                              customer.lastName,
                              customer.firstName,
                              customer.otherName,
                            ]
                              .filter(Boolean)
                              .map((part) => part?.trim())
                              .filter(Boolean)
                              .join(", ");

                            const contactDetails = [
                              customer.email?.trim(),
                              customer.phoneLine1?.trim(),
                              customer.phoneLine2?.trim(),
                            ]
                              .filter(Boolean)
                              .join(" • ");

                            return (
                              <button
                                key={customer.customerID}
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-primary/5"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => applyCustomerSelection(customer)}
                              >
                                <div className="font-medium text-gray-900">
                                  {displayName || customer.customerID}
                                </div>
                                <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                                  {contactDetails ||
                                    customer.address ||
                                    "No additional details"}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )} */}
                    </div>
                    {errors.surName && (
                      <p className="text-sm text-red-500">{errors.surName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otherNames" className="text-sm font-medium">
                      Other Names *
                    </Label>
                    <Input
                      id="otherNames"
                      name="otherNames"
                      value={form.otherNames}
                      onChange={handleInputChange}
                      placeholder="Enter other names"
                      className="w-full"
                    />
                    {errors.otherNames && (
                      <p className="text-sm text-red-500">
                        {errors.otherNames}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">
                      Middle Name *
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter Middle name"
                      className="w-full"
                    />
                    {errors.fullName && (
                      <p className="text-sm text-red-500">{errors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-medium">
                      Gender *
                    </Label>
                    <Select
                      value={form.gender}
                      onValueChange={(value) => handleChange("gender", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-sm text-red-500">{errors.gender}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="dateOfBirth"
                      className="text-sm font-medium"
                    >
                      Date of Birth *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !form.dateOfBirth && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.dateOfBirth
                            ? format(form.dateOfBirth, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DOBCalendar
                          value={form.dateOfBirth}
                          onChange={(date) => handleChange("dateOfBirth", date)}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.dateOfBirth && (
                      <p className="text-sm text-red-500">
                        {errors.dateOfBirth}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="placeOfBirth"
                      className="text-sm font-medium"
                    >
                      Place of Birth
                    </Label>
                    <Input
                      id="placeOfBirth"
                      name="placeOfBirth"
                      value={form.placeOfBirth}
                      onChange={handleInputChange}
                      placeholder="Enter place of birth"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="spouseName" className="text-sm font-medium">
                      Name of Spouse
                    </Label>
                    <Input
                      id="spouseName"
                      name="spouseName"
                      value={form.spouseName}
                      onChange={handleInputChange}
                      placeholder="Enter spouse name"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="localGovtOrigin"
                      className="text-sm font-medium"
                    >
                      Local Govt of Origin
                    </Label>
                    <Input
                      id="localGovtOrigin"
                      name="localGovtOrigin"
                      value={form.localGovtOrigin}
                      onChange={handleInputChange}
                      placeholder="Enter local government"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="religion" className="text-sm font-medium">
                      Religion
                    </Label>
                    <Select
                      value={form.religion}
                      onValueChange={(value) => handleChange("religion", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select religion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Christianity">
                          Christianity
                        </SelectItem>
                        <SelectItem value="Islam">Islam</SelectItem>
                        <SelectItem value="Traditional">Traditional</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="designation"
                      className="text-sm font-medium"
                    >
                      Designation
                    </Label>
                    <Input
                      id="designation"
                      name="designation"
                      value={form.designation}
                      onChange={handleInputChange}
                      placeholder="Enter designation"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="maritalStatus"
                      className="text-sm font-medium"
                    >
                      Marital Status *
                    </Label>
                    <Select
                      value={form.maritalStatus}
                      onValueChange={(value) =>
                        handleChange("maritalStatus", value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select marital status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.maritalStatus && (
                      <p className="text-sm text-red-500">
                        {errors.maritalStatus}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="occupation" className="text-sm font-medium">
                      Occupation *
                    </Label>
                    <Input
                      id="occupation"
                      name="occupation"
                      value={form.occupation}
                      onChange={handleInputChange}
                      placeholder="Enter occupation"
                      className="w-full"
                    />
                    {errors.occupation && (
                      <p className="text-sm text-red-500">
                        {errors.occupation}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Address Information
                </h3>

                <div className="space-y-2">
                  <Label
                    htmlFor="residentialAddress"
                    className="text-sm font-medium"
                  >
                    Residential Address *
                  </Label>
                  <Textarea
                    id="residentialAddress"
                    name="residentialAddress"
                    value={form.residentialAddress}
                    onChange={handleInputChange}
                    placeholder="Enter residential address"
                    rows={3}
                    className="w-full resize-none"
                  />
                  {errors.residentialAddress && (
                    <p className="text-sm text-red-500">
                      {errors.residentialAddress}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="contactAddress"
                    className="text-sm font-medium"
                  >
                    Contact Address (If different from above)
                  </Label>
                  <Textarea
                    id="contactAddress"
                    name="contactAddress"
                    value={form.contactAddress}
                    onChange={handleInputChange}
                    placeholder="Enter contact address if different"
                    rows={3}
                    className="w-full resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landmark" className="text-sm font-medium">
                    Landmark (Police station, market place, bus stop etc)
                  </Label>
                  <Input
                    id="landmark"
                    name="landmark"
                    value={form.landmark}
                    onChange={handleInputChange}
                    placeholder="Enter nearby landmark"
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-medium">
                      State *
                    </Label>
                    <Input
                      id="state"
                      name="state"
                      value={form.state}
                      onChange={handleInputChange}
                      placeholder="Enter state"
                      className="w-full"
                    />
                    {errors.state && (
                      <p className="text-sm text-red-500">{errors.state}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-medium">
                      Country *
                    </Label>
                    <Input
                      id="country"
                      name="country"
                      value={form.country}
                      onChange={handleInputChange}
                      placeholder="Enter country"
                      className="w-full"
                    />
                    {errors.country && (
                      <p className="text-sm text-red-500">{errors.country}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Contact Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="landphone" className="text-sm font-medium">
                      Landphone
                    </Label>
                    <Input
                      id="landphone"
                      name="landphone"
                      type="tel"
                      value={form.landphone}
                      onChange={handleInputChange}
                      placeholder="Enter landphone number"
                      inputMode="numeric"
                      className="w-full"
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                    {errors.landphone && (
                      <p className="text-sm text-red-500">{errors.landphone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="mobilePhone"
                      className="text-sm font-medium"
                    >
                      Mobile Phone *
                    </Label>
                    <Input
                      id="mobilePhone"
                      name="mobilePhone"
                      type="tel"
                      value={form.mobilePhone}
                      onChange={handleInputChange}
                      placeholder="Enter mobile phone number"
                      className="w-full"
                      inputMode="numeric"
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                    {errors.mobilePhone && (
                      <p className="text-sm text-red-500">
                        {errors.mobilePhone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleInputChange}
                      placeholder="Enter valid email address"
                      className="w-full"
                      onBlur={(e) => {
                        const email = e.target.value.trim();
                        if (
                          email &&
                          !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
                            email,
                          )
                        ) {
                          setErrors((prev) => ({
                            ...prev,
                            email: "Please enter a valid email address",
                          }));
                        }
                      }}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ID Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  ID Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meansID" className="text-sm font-medium">
                      Means of ID *
                    </Label>
                    <Select
                      value={form.meansID}
                      onValueChange={(value) => handleChange("meansID", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="National ID">National ID</SelectItem>
                        <SelectItem value="Passport">Passport</SelectItem>
                        <SelectItem value="Driver's License">
                          Driver's License
                        </SelectItem>
                        <SelectItem value="Voter's Card">
                          Voter's Card
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.meansID && (
                      <p className="text-sm text-red-500">{errors.meansID}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idNo" className="text-sm font-medium">
                      ID Number *
                    </Label>
                    <Input
                      id="idNo"
                      name="idNo"
                      value={form.idNo}
                      onChange={handleInputChange}
                      placeholder="Enter ID number"
                      className="w-full"
                    />
                    {errors.idNo && (
                      <p className="text-sm text-red-500">{errors.idNo}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issueDate" className="text-sm font-medium">
                      Issue Date *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !form.issueDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.issueDate
                            ? format(form.issueDate, "PPP")
                            : "Pick issue date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DOBCalendar
                          value={form.issueDate}
                          onChange={(date) => handleChange("issueDate", date)}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.issueDate && (
                      <p className="text-sm text-red-500">{errors.issueDate}</p>
                    )}
                  </div>
                  {/* <div className="space-y-2">
  <Label htmlFor="expiryDate" className="text-sm font-medium">
    Expiry Date
  </Label>
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal h-10 sm:h-9 px-3 sm:px-4",
          !form.expiryDate && "text-muted-foreground"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        <span className="truncate">
          {form.expiryDate ? format(form.expiryDate, "PPP") : "Pick expiry date"}
        </span>
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar
        value={form.expiryDate}
        onChange={(date) => handleChange("expiryDate", date)}
        initialFocus
      />
    </PopoverContent>
  </Popover>
</div> */}

                  <div className="space-y-2">
                    <Label htmlFor="ninNumber" className="text-sm font-medium">
                      NIN Number
                    </Label>
                    <Input
                      id="ninNumber"
                      name="ninNumber"
                      value={form.ninNumber}
                      onChange={handleInputChange}
                      placeholder="Enter NIN number"
                      className="w-full"
                      inputMode="numeric"
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bvnNumber" className="text-sm font-medium">
                      BVN Number
                    </Label>
                    <Input
                      id="bvnNumber"
                      name="bvnNumber"
                      value={form.bvnNumber}
                      onChange={handleInputChange}
                      placeholder="Enter BVN number"
                      className="w-full"
                      inputMode="numeric"
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Occupation Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Occupation Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="employmentType"
                      className="text-sm font-medium"
                    >
                      Type of Employment *
                    </Label>
                    <Select
                      value={form.employmentType}
                      onValueChange={(value) =>
                        handleChange("employmentType", value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Employee">Employee</SelectItem>
                        <SelectItem value="Self Employed">
                          Self Employed
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.employmentType && (
                      <p className="text-sm text-red-500">
                        {errors.employmentType}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="employerName"
                      className="text-sm font-medium"
                    >
                      Name of Employer
                    </Label>
                    <Input
                      id="employerName"
                      name="employerName"
                      value={form.employerName}
                      onChange={handleInputChange}
                      placeholder="Enter employer name"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label
                      htmlFor="employerAddress"
                      className="text-sm font-medium"
                    >
                      Address of Employer
                    </Label>
                    <Textarea
                      id="employerAddress"
                      name="employerAddress"
                      value={form.employerAddress}
                      onChange={handleInputChange}
                      placeholder="Enter employer address"
                      rows={2}
                      className="w-full resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="dateEmployed"
                      className="text-sm font-medium"
                    >
                      Date Employed *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !form.dateEmployed && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.dateEmployed
                            ? format(form.dateEmployed, "PPP")
                            : "Pick employment date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DOBCalendar
                          value={form.dateEmployed}
                          onChange={(date) =>
                            handleChange("dateEmployed", date)
                          }
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.dateEmployed && (
                      <p className="text-sm text-red-500">
                        {errors.dateEmployed}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="employerTelNo"
                      className="text-sm font-medium"
                    >
                      Employer Tel No
                    </Label>
                    <Input
                      id="employerTelNo"
                      name="employerTelNo"
                      value={form.employerTelNo}
                      onChange={handleInputChange}
                      placeholder="Enter employer phone number"
                      className="w-full"
                      inputMode="numeric"
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="employerEmail"
                      className="text-sm font-medium"
                    >
                      Employer Email Address
                    </Label>
                    <Input
                      id="employerEmail"
                      name="employerEmail"
                      type="email"
                      value={form.employerEmail}
                      onChange={handleInputChange}
                      placeholder="Enter employer email"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Health Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Health Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height" className="text-sm font-medium">
                      Height (cm)
                    </Label>
                    <Input
                      id="height"
                      name="height"
                      value={form.height}
                      onChange={handleInputChange}
                      placeholder="Enter height"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-sm font-medium">
                      Weight (kg)
                    </Label>
                    <Input
                      id="weight"
                      name="weight"
                      value={form.weight}
                      onChange={handleInputChange}
                      placeholder="Enter weight"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="sportEngagement"
                      className="text-sm font-medium"
                    >
                      Sport Engagement
                    </Label>
                    <Input
                      id="sportEngagement"
                      name="sportEngagement"
                      value={form.sportEngagement}
                      onChange={handleInputChange}
                      placeholder="Enter sports engaged in"
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="bodilyInfirmity"
                      className="text-sm font-medium"
                    >
                      Do you have any Bodily Infirmity?
                    </Label>
                    <Select
                      value={form.bodilyInfirmity}
                      onValueChange={(value) =>
                        handleChange("bodilyInfirmity", value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YES">YES</SelectItem>
                        <SelectItem value="NO">NO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="medicalConditions"
                      className="text-sm font-medium"
                    >
                      Heart condition, stroke, hypertension, paralysis, cancer,
                      diabetes, liver failure, mental illness?
                    </Label>
                    <Select
                      value={form.medicalConditions}
                      onValueChange={(value) =>
                        handleChange("medicalConditions", value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YES">YES</SelectItem>
                        <SelectItem value="NO">NO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="currentTreatment"
                      className="text-sm font-medium"
                    >
                      Currently receiving treatment for any medical condition or
                      disabilities?
                    </Label>
                    <Select
                      value={form.currentTreatment}
                      onValueChange={(value) =>
                        handleChange("currentTreatment", value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YES">YES</SelectItem>
                        <SelectItem value="NO">NO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="workAbsence"
                      className="text-sm font-medium"
                    >
                      Absent from work due to illness/injury for more than 10
                      days in past 10 years?
                    </Label>
                    <Select
                      value={form.workAbsence}
                      onValueChange={(value) =>
                        handleChange("workAbsence", value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YES">YES</SelectItem>
                        <SelectItem value="NO">NO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="chronicIllness"
                    className="text-sm font-medium"
                  >
                    Chronic Illness (if any)
                  </Label>
                  <Textarea
                    id="chronicIllness"
                    name="chronicIllness"
                    value={form.chronicIllness}
                    onChange={handleInputChange}
                    placeholder="Describe any chronic illness or medical conditions"
                    rows={3}
                    className="w-full resize-none"
                  />
                </div>
              </div>

              {/* Habits Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Habits
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="habits" className="text-sm font-medium">
                      Do you smoke, drink or take any medicine regularly?
                    </Label>
                    <Select
                      value={form.habits}
                      onValueChange={(value) => handleChange("habits", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YES">YES</SelectItem>
                        <SelectItem value="NO">NO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="aviationEngagement"
                      className="text-sm font-medium"
                    >
                      Intentions to engage in aviation (other than as
                      passenger)?
                    </Label>
                    <Select
                      value={form.aviationEngagement}
                      onValueChange={(value) =>
                        handleChange("aviationEngagement", value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YES">YES</SelectItem>
                        <SelectItem value="NO">NO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNext}>Next: Cover Details</Button>
              </div>
            </TabsContent>

            {/* Rest of the tabs remain the same */}
            <TabsContent
              value="product"
              className="space-y-6 sm:space-y-8 mt-4 sm:mt-6"
            >
              {/* Product Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Product Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="productCode"
                      className="text-sm font-medium"
                    >
                      Product *
                    </Label>
                    <DropdownMenu>
                      <button
                        className="w-full px-4 py-2 border border-border rounded-md bg-white text-left"
                        onClick={toggleDropdown}
                        type="button"
                      >
                        {form.productCode
                          ? products.find(
                              (p) => p.productID === form.productCode,
                            )?.productName || form.productCode
                          : "Select a product"}
                      </button>

                      <DropdownMenuContent
                        className="w-full p-2 bg-white border border-border rounded-md shadow-md"
                        open={open}
                        setOpen={setOpen}
                      >
                        <Input
                          placeholder="Search for a product"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="mb-2 w-full px-2 py-1 border border-border rounded-md"
                          autoFocus
                        />
                        {filteredOptions.map((product) => (
                          <DropdownMenuItem
                            key={product.productID}
                            onClick={() => {
                              handleChange("productCode", product.productID);
                              setOpen(false);
                              setSearch("");
                            }}
                          >
                            <button className="cursor-pointer px-4 py-2 rounded-md text-left w-full">
                              <div className="font-medium">
                                {product.productName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {product.productID}
                              </div>
                            </button>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {errors.productCode && (
                      <p className="text-sm text-red-500">
                        {errors.productCode}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-medium">
                      Duration (years) *
                    </Label>
                    <Input
                      id="duration"
                      name="duration"
                      type="number"
                      min="1"
                      value={
                        form.duration === 0 || form.duration === ""
                          ? ""
                          : form.duration
                      }
                      onChange={handleInputChange}
                      placeholder="1"
                      className="w-full"
                    />
                    {errors.duration && (
                      <p className="text-sm text-red-500">{errors.duration}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency" className="text-sm font-medium">
                      Payment Frequency *
                    </Label>
                    <Select
                      value={form.frequency}
                      onValueChange={(value) =>
                        handleChange("frequency", value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Half-Yearly">Half-Yearly</SelectItem>
                        <SelectItem value="Annually">Annually</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Fortnightly">Fortnightly</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.frequency && (
                      <p className="text-sm text-red-500">{errors.frequency}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="regularSaving"
                      className="text-sm font-medium"
                    >
                      Regular Saving Amount *
                    </Label>
                    <Input
                      id="regularSaving"
                      name="regularSaving"
                      type="number"
                      step="1"
                      value={
                        form.regularSaving === 0 || form.regularSaving === ""
                          ? ""
                          : form.regularSaving
                      }
                      onChange={handleInputChange}
                      placeholder="Enter saving amount"
                      className="w-full"
                    />
                    {errors.regularSaving && (
                      <p className="text-sm text-red-500">
                        {errors.regularSaving}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="firstPremium"
                      className="text-sm font-medium"
                    >
                      First Premium Amount *
                    </Label>
                    <Input
                      id="firstPremium"
                      name="firstPremium"
                      type="number"
                      step="0.01"
                      value={
                        form.firstPremium === 0 || form.firstPremium === ""
                          ? ""
                          : form.firstPremium
                      }
                      onChange={handleInputChange}
                      placeholder="Enter first premium amount"
                      className="w-full"
                    />
                    {errors.firstPremium && (
                      <p className="text-sm text-red-500">
                        {errors.firstPremium}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="extraRate" className="text-sm font-medium">
                      Extra Rate (%)
                    </Label>
                    <Input
                      id="extraRate"
                      name="extraRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.extraRate}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="loadingRate"
                      className="text-sm font-medium"
                    >
                      Loading Rate (%)
                    </Label>
                    <Input
                      id="loadingRate"
                      name="loadingRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.loadingRate}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Information Section */}
              <div className="border-t pt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-green-600" />
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mop" className="text-sm font-medium">
                        Mode of Payment
                      </Label>
                      <Select
                        value={form.mop}
                        onValueChange={(value) => handleChange("mop", value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select payment mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Automatic Salary Deduction">
                            Automatic Salary Deduction
                          </SelectItem>
                          <SelectItem value="Bank Transfer">
                            Bank Transfer
                          </SelectItem>
                          <SelectItem value="Cheque">Cheque</SelectItem>
                          <SelectItem value="Direct Debit">
                            Direct Debit
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="paymentType"
                        className="text-sm font-medium"
                      >
                        Payment Type
                      </Label>
                      <Select
                        value={form.paymentType}
                        onValueChange={(value) =>
                          handleChange("paymentType", value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="paymentAmount"
                        className="text-sm font-medium"
                      >
                        Payment Amount
                      </Label>
                      <Input
                        id="paymentAmount"
                        name="paymentAmount"
                        type="number"
                        step="1"
                        value={
                          form.paymentAmount === 0 || form.paymentAmount === ""
                            ? ""
                            : form.paymentAmount
                        }
                        onChange={handleInputChange}
                        placeholder="Enter payment amount"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="dateofpayment"
                        className="text-sm font-medium"
                      >
                        Payment Date *
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !form.dateofpayment && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {form.dateofpayment
                              ? format(form.dateofpayment, "PPP")
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <DOBCalendar
                            value={form.dateofpayment}
                            onChange={(date) =>
                              handleChange("dateofpayment", date)
                            }
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.dateofpayment && (
                        <p className="text-sm text-red-500">
                          {errors.dateofpayment}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="receiptNo"
                        className="text-sm font-medium"
                      >
                        Receipt Number
                      </Label>
                      <Input
                        id="receiptNo"
                        name="receiptNo"
                        value={form.receiptNo}
                        onChange={handleInputChange}
                        placeholder="Enter receipt number"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankName" className="text-sm font-medium">
                        Bank Name
                      </Label>
                      <Input
                        id="bankName"
                        name="bankName"
                        value={form.bankName}
                        onChange={handleInputChange}
                        placeholder="Enter bank name"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label
                        htmlFor="accountNo"
                        className="text-sm font-medium"
                      >
                        Account Number
                      </Label>
                      <Input
                        id="accountNo"
                        name="accountNo"
                        value={form.accountNo}
                        onChange={handleInputChange}
                        placeholder="Enter account number"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Create Proposal Section */}
              <div className="border-t pt-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">
                        Ready to Create Proposal
                      </h3>
                      <p className="text-blue-700 mt-1">
                        Create the proposal to generate a proposal number and
                        proceed to add beneficiaries.
                      </p>
                    </div>
                    <div className="flex gap-3 flex-col sm:flex-row">
                      <Button variant="outline" onClick={handlePrevious}>
                        Back to Personal Info
                      </Button>
                      <Button
                        onClick={handleCreateProposal}
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isSubmitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isSubmitting
                          ? "Creating Proposal..."
                          : "Create Proposal"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Beneficiaries Tab */}
            <TabsContent
              value="beneficiaries"
              className="space-y-4 sm:space-y-6 mt-4 sm:mt-6"
            >
              {!proposalCreated ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    Proposal Required
                  </h3>
                  <p className="text-yellow-700 mb-4">
                    Please create the proposal first to generate a proposal
                    number before adding beneficiaries.
                  </p>
                  <Button
                    onClick={() => setActiveTab("product")}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    Go to Cover Details
                  </Button>
                </div>
              ) : (
                <>
                  {/* Success Header */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-green-900">
                          Proposal Created Successfully
                        </h3>
                        <p className="text-green-700">
                          Proposal Number:{" "}
                          <span className="font-bold">{currentProposalNo}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Beneficiary Management */}
                  <div className="space-y-6">
                    {/* Beneficiaries List - Always visible */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-blue/10 rounded-lg">
                              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary-blue" />
                            </div>
                            <div>
                              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                                Beneficiary Management
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                Add and manage beneficiaries for this proposal
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => setShowBeneficiaryForm(true)}
                            className="bg-green-600 hover:bg-green-700 px-4 sm:px-6 py-2 sm:py-2.5"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Beneficiary
                          </Button>
                        </div>
                      </div>

                      {/* Beneficiaries List */}
                      <div className="p-4 sm:p-6">
                        {localBeneficiaries.length === 0 ? (
                          <div className="text-center py-8">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              No Beneficiaries Added
                            </h3>
                            <p className="text-gray-500 mb-4">
                              Start by adding beneficiaries to this proposal.
                            </p>
                            <Button
                              onClick={() => setShowBeneficiaryForm(true)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add First Beneficiary
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-gray-900">
                                Beneficiaries ({localBeneficiaries.length})
                              </h4>
                            </div>
                            <div className="border rounded-lg divide-y">
                              {localBeneficiaries.map((beneficiary, index) => (
                                <div key={index} className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h5 className="font-medium text-gray-900">
                                        {beneficiary.surname}{" "}
                                        {beneficiary.otherNames}
                                      </h5>
                                      <div className="mt-1 text-sm text-gray-600 space-y-1">
                                        <div className="flex flex-wrap gap-4">
                                          <span>
                                            Relationship:{" "}
                                            {beneficiary.relationship}
                                          </span>
                                          <span>
                                            Percentage: {beneficiary.percentage}
                                            %
                                          </span>
                                          <span>
                                            Type: {beneficiary.beneficiaryType}
                                          </span>
                                        </div>
                                        {beneficiary.address && (
                                          <div>
                                            Address: {beneficiary.address}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Beneficiary Form - Conditionally visible */}
                    {showBeneficiaryForm && (
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <CreateBeneficiaryForm
                          onSubmit={handleAddBeneficiary}
                          onCancel={() => setShowBeneficiaryForm(false)}
                          proposalNo={currentProposalNo || ""}
                        />
                      </div>
                    )}
                  </div>

                  {/* Navigation Button */}
                  <div className="flex justify-end pt-4">
                    <Button onClick={() => setActiveTab("documents")}>
                      Next: Documents
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Attached Documents Tab */}
            <TabsContent
              value="documents"
              className="space-y-4 sm:space-y-6 mt-4 sm:mt-6"
            >
              <DocumentManager
                proposalIds={currentProposalNo ? [currentProposalNo] : []}
                className="w-full"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewProposal;
