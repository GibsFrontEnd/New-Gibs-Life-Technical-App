// src/components/policy-admin/NewTraditionalPolicySetupPage.tsx
// @ts-nocheck

import { useState, useEffect } from "react";
import { ArrowLeft, User, Users, RefreshCw, Save } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import apiCall from "../../utils/api-call";
import { useToast } from "../../components/UI/use-toast";

// ─── helpers ───────────────────────────────────────────────
const InputField = ({ label, value, onChange, type = "text", required = false, disabled = false }: any) => (
  <div>
    <label className="block text-sm font-semibold text-gray-800 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value || ""}
      onChange={onChange}
      disabled={disabled}
      required={required}
      className={`w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8c4b8d]/30 focus:border-[#8c4b8d] ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
    />
  </div>
);

const SelectField = ({ label, value, onChange, options, required = false }: any) => (
  <div>
    <label className="block text-sm font-semibold text-gray-800 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value || ""}
      onChange={onChange}
      required={required}
      className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8c4b8d]/30 focus:border-[#8c4b8d]"
    >
      <option value="">Select...</option>
      {options.map((opt: any) => (
        <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
          {typeof opt === 'string' ? opt : opt.label}
        </option>
      ))}
    </select>
  </div>
);

const SectionHead = ({ title }: { title: string }) => (
  <h3 className="text-lg font-semibold text-[#111827] border-b border-gray-200 pb-2 mb-4 mt-8">
    {title}
  </h3>
);

const emptyFormState = {
  title: "",
  brCode: "HEAD OFFICE",
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
  dateOfBirth: "",
  duration: 5,
  frequency: "Monthly",
  regularSaving: 10000,
  productCode: "CEE",
  extraRate: 0,
  loadingRate: 0,
  maritalStatus: "Single",
  country: "Nigeria",
  agentCode: "",
  agentDescription: "",
  riskID: "A",
  remark: "PREMIUM",
  firstPremium: 0,
  sumAssured: 0,
  meansID: "National ID",
  idNo: "",
  chronicIllness: "",
  mop: "",
  paymentType: "Cash",
  paymentAmount: 5000,
  dateofpayment: "",
  receiptNo: "",
  bankName: "",
  accountNo: "",
  placeOfBirth: "",
  spouseName: "",
  govtOfOrigin: "",
  resAddress: "",
  landMark: "",
  nin: "",
  bvn: "",
  employmentType: "Employee",
  employerName: "",
  employerAddress: "",
  employerNumber: "",
  employerEmail: "",
  dateEmployed: "",
  height: "",
  weight: "",
  sport: "",
  infirmity: "NO",
  stroke: "NO",
  treatment: "NO",
  workAbesent: "NO",
  smoke: "NO",
  aviation: "NO",
  religion: "Christianity",
  designation: "",
  issueDate: "",
  expiryDate: ""
};

const NewTraditionalPolicySetupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // ✅ Check if we're in edit mode and get initial data
  const isEditMode = location.state?.editMode || location.pathname.includes("edit-traditional");
  const initialData = location.state?.policyData || null;
  
  const [activeTab, setActiveTab] = useState("Information");
  const [formData, setFormData] = useState(emptyFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  // ✅ Populate form with initial data if in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        ...emptyFormState,
        ...initialData,
        // Ensure dates are in the correct format
        dateOfBirth: initialData.dateOfBirth?.split('T')[0] || "",
        issueDate: initialData.issueDate?.split('T')[0] || "",
        expiryDate: initialData.expiryDate?.split('T')[0] || "",
        dateofpayment: initialData.dateofpayment?.split('T')[0] || "",
        dateEmployed: initialData.dateEmployed?.split('T')[0] || "",
      });
      
      toast({
        title: "Success",
        description: "Traditional policy data loaded successfully",
        variant: "default",
      });
    }
  }, [isEditMode, initialData, toast]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodResp, branchResp] = await Promise.all([
          apiCall.get("/v1/Products"),
          apiCall.get("/lookups/branches")
        ]);
        
        const filteredProds = (prodResp.data || []).filter((p: any) => p.riskID === "A");
        setProducts(filteredProds);
        setBranches(branchResp.data || []);
      } catch (err) {
        console.error("Failed to fetch setup data:", err);
        toast({
          title: "Error",
          description: "Failed to load setup data. Please refresh the page.",
          variant: "destructive",
        });
      }
    };
    fetchData();
  }, [toast]);

  useEffect(() => {
    if (formData.issueDate && formData.duration) {
      const start = new Date(formData.issueDate);
      if (!isNaN(start.getTime())) {
        const mat = new Date(start);
        const durationVal = Number(formData.duration);
        
        switch (formData.frequency) {
          case "Monthly":
            mat.setMonth(mat.getMonth() + durationVal);
            break;
          case "Quarterly":
            mat.setMonth(mat.getMonth() + (durationVal * 3));
            break;
          case "Half-Yearly":
            mat.setMonth(mat.getMonth() + (durationVal * 6));
            break;
          case "Weekly":
            mat.setDate(mat.getDate() + (durationVal * 7));
            break;
          case "Fortnightly":
            mat.setDate(mat.getDate() + (durationVal * 14));
            break;
          case "Daily":
            mat.setDate(mat.getDate() + durationVal);
            break;
          case "Annually":
          case "Single":
          default:
            mat.setFullYear(mat.getFullYear() + durationVal);
            break;
        }

        const isoString = mat.toISOString();
        if (formData.expiryDate !== isoString) {
          setFormData((prev) => ({ ...prev, expiryDate: isoString }));
        }
      }
    }
  }, [formData.issueDate, formData.duration, formData.frequency]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Validate required fields before submission
  const validateForm = () => {
    const requiredFields = [
      { field: 'surName', label: 'Surname' },
      { field: 'dateOfBirth', label: 'Date of Birth' },
      { field: 'gender', label: 'Gender' },
      { field: 'email', label: 'Email Address' },
      { field: 'mobilePhone', label: 'Mobile Phone' },
      { field: 'address', label: 'Contact Address' },
      { field: 'state', label: 'State' },
      { field: 'country', label: 'Country' },
      { field: 'meansID', label: 'Means of ID' },
      { field: 'idNo', label: 'ID Number' },
      { field: 'brCode', label: 'Branch' },
      { field: 'productCode', label: 'Product Code' },
      { field: 'frequency', label: 'Frequency' },
      { field: 'regularSaving', label: 'Regular Saving' },
      { field: 'issueDate', label: 'Start Date' },
      { field: 'duration', label: 'Duration' },
      { field: 'paymentType', label: 'Payment Type' },
      { field: 'paymentAmount', label: 'Payment Amount' },
      { field: 'dateofpayment', label: 'Date of Payment' },
    ];

    for (const { field, label } of requiredFields) {
      if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
        toast({
          title: "Validation Error",
          description: `${label} is required`,
          variant: "destructive",
        });
        return false;
      }
    }

    // ✅ Validate firstPremium or sumAssured
    if (formData.firstPremium === 0 && formData.sumAssured === 0) {
      toast({
        title: "Validation Error",
        description: "Either First Premium or Sum Assured must be greater than 0",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // ✅ Show loading toast
    toast({
      title: "Processing",
      description: isEditMode ? "Updating traditional policy..." : "Creating traditional policy...",
      variant: "default",
    });
    
    try {
      // ✅ Build payload exactly as Swagger expects
      const payload = {
        title: formData.title || "",
        assuredCode: formData.assuredCode || "",
        surName: formData.surName || "",
        otherNames: formData.otherNames || "",
        fullName: `${formData.surName || ""} ${formData.otherNames || ""}`.trim(),
        address: formData.address || "",
        state: formData.state || "",
        landphone: formData.landphone || "",
        mobilePhone: formData.mobilePhone || "",
        email: formData.email || "",
        riskID: "A",
        occupation: formData.occupation || "",
        gender: formData.gender || "",
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : new Date().toISOString(),
        duration: Number(formData.duration) || 0,
        frequency: formData.frequency || "Monthly",
        remark: (formData.productCode === "FFP" || formData.productCode === "TAS") 
          ? (formData.remark && formData.remark !== "" ? formData.remark : "PREMIUM") 
          : "PREMIUM",
        regularSaving: Number(formData.regularSaving) || 0,
        productCode: formData.productCode || "CEE",
        firstPremium: Number(formData.firstPremium) || 0,
        sumAssured: Number(formData.sumAssured) || 0,
        maritalStatus: formData.maritalStatus || "Single",
        country: formData.country || "Nigeria",
        agentCode: formData.agentCode || "",
        agentDescription: formData.agentDescription || "",
        meansID: formData.meansID || "National ID",
        idNo: formData.idNo || "",
        chronicIllness: formData.chronicIllness || "",
        mop: formData.mop || "",
        paymentType: formData.paymentType || "Cash",
        paymentAmount: Number(formData.paymentAmount) || 0,
        dateofpayment: formData.dateofpayment ? new Date(formData.dateofpayment).toISOString() : new Date().toISOString(),
        receiptNo: formData.receiptNo || "",
        bankName: formData.bankName || "",
        accountNo: formData.accountNo || "",
        placeOfBirth: formData.placeOfBirth || "",
        spouseName: formData.spouseName || "",
        govtOfOrigin: formData.govtOfOrigin || "",
        resAddress: formData.resAddress || "",
        landMark: formData.landMark || "",
        nin: formData.nin || "",
        bvn: formData.bvn || "",
        employmentType: formData.employmentType || "Employee",
        employerName: formData.employerName || "",
        employerAddress: formData.employerAddress || "",
        employerNumber: formData.employerNumber || "",
        employerEmail: formData.employerEmail || "",
        dateEmployed: formData.dateEmployed ? new Date(formData.dateEmployed).toISOString() : new Date().toISOString(),
        height: formData.height || "",
        weight: formData.weight || "",
        sport: formData.sport || "",
        infirmity: formData.infirmity || "NO",
        stroke: formData.stroke || "NO",
        treatment: formData.treatment || "NO",
        workAbesent: formData.workAbesent || "NO",
        smoke: formData.smoke || "NO",
        aviation: formData.aviation || "NO",
        religion: formData.religion || "Christianity",
        designation: formData.designation || "",
        issueDate: formData.issueDate ? new Date(formData.issueDate).toISOString() : new Date().toISOString(),
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : new Date().toISOString()
      };

      console.log("📤 Submitting traditional policy payload:", JSON.stringify(payload, null, 2));
      
      let response;
      if (isEditMode) {
        const policyNo = formData.policyNo || formData.proposalNo;
        if (!policyNo) {
          toast({
            title: "Error",
            description: "Policy number is required for update",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        
        console.log(`📤 Updating traditional policy: ${policyNo}`);
        response = await apiCall.post(`/v1/lifepolicyAdmin/tradpolicy/edit/${encodeURIComponent(policyNo)}`, payload);
        
        toast({
          title: "Success ✅",
          description: `Traditional policy updated successfully! Policy No: ${policyNo}`,
          variant: "default",
        });
      } else {
        console.log("📤 Creating new traditional policy");
        response = await apiCall.post("/v1/lifepolicyAdmin/tradpolicy/create", payload);
        
        // ✅ Handle response - the API returns 200 with data
        const policyNo = response?.data?.policyNo || response?.data?.proposalNo || "";
        const message = response?.data?.message || "Traditional policy created successfully!";
        
        // ✅ Show calculation details if available
        let description = `${message}`;
        if (response?.data?.calculation) {
          const calc = response.data.calculation;
          description += `\nPolicy No: ${policyNo}`;
          if (calc.sumAssured) description += `\nSum Assured: ₦${Number(calc.sumAssured).toLocaleString()}`;
          if (calc.annualPremium) description += `\nAnnual Premium: ₦${Number(calc.annualPremium).toLocaleString()}`;
        }
        
        toast({
          title: "Success 🎉",
          description: description,
          variant: "default",
        });
      }
      
      console.log("✅ Traditional policy operation successful:", response?.data);
      
      // ✅ Navigate after successful operation with a slight delay
      setTimeout(() => {
        navigate("/underwriting/individual/policy-admin");
      }, 1500);
      
    } catch (err: any) {
      // ✅ Detailed error logging
      console.error("❌ Traditional policy operation failed:", {
        error: err,
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
        config: err.config,
      });
      
      // ✅ Extract detailed error message
      let errorMessage = "Unknown error occurred";
      let errorDetails = "";
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const serverData = err.response.data;
        errorMessage = serverData?.message || serverData?.error || serverData?.detail || err.message;
        errorDetails = serverData?.details || serverData?.errors || "";
        
        // Log the full response data for debugging
        console.error("Server response data:", serverData);
        
        // Check for specific error patterns
        if (err.response.status === 500) {
          errorMessage = "Server error occurred. Please check the server logs for details.";
        } else if (err.response.status === 400) {
          errorMessage = serverData?.message || "Invalid data submitted. Please check all fields.";
        } else if (err.response.status === 404) {
          errorMessage = "Resource not found. Please try again.";
        } else if (err.response.status === 409) {
          errorMessage = "Conflict: The policy may already exist.";
        }
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = "No response from server. Please check your network connection.";
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = err.message || "Request setup failed";
      }
      
      // ✅ Show detailed error toast
      toast({
        title: `Error ${isEditMode ? 'Updating' : 'Creating'} Traditional Policy`,
        description: `${errorMessage}${errorDetails ? `\nDetails: ${errorDetails}` : ''}`,
        variant: "destructive",
      });
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? "Edit Traditional Policy" : "New Traditional Policy Setup"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEditMode ? "Update policy details for the client" : "Create a brand new policy for a client"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 mb-6 relative">
        <button
          onClick={() => setActiveTab("Information")}
          className={`px-5 py-3 text-sm font-semibold transition-colors relative ${activeTab === "Information" ? "text-[#8c4b8d]" : "text-gray-500 hover:text-gray-700"}`}
        >
          <div className="flex items-center gap-2">
            <User size={16} /> Information
          </div>
          {activeTab === "Information" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8c4b8d]" />}
        </button>
        <button
          onClick={() => setActiveTab("Beneficiaries")}
          className={`px-5 py-3 text-sm font-semibold transition-colors relative ${activeTab === "Beneficiaries" ? "text-[#8c4b8d]" : "text-gray-500 hover:text-gray-700"}`}
        >
          <div className="flex items-center gap-2">
            <Users size={16} /> Beneficiaries
          </div>
          {activeTab === "Beneficiaries" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8c4b8d]" />}
        </button>
      </div>

      {activeTab === "Information" && (
        <form onSubmit={handleCreatePolicy} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 lg:p-8">
          
          <SectionHead title="Personal Information" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            <SelectField label="Title" value={formData.title} onChange={(e: any) => handleChange("title", e.target.value)} options={["Mr", "Mrs", "Ms", "Miss", "Dr", "Prof", "Rev", "Chief"]} required />
            <InputField label="Surname" value={formData.surName} onChange={(e: any) => handleChange("surName", e.target.value)} required />
            <InputField label="Other Names" value={formData.otherNames} onChange={(e: any) => handleChange("otherNames", e.target.value)} />
            <InputField label="Date of Birth" type="date" value={formData.dateOfBirth?.split('T')[0]} onChange={(e: any) => handleChange("dateOfBirth", e.target.value)} required />
            <SelectField label="Gender" value={formData.gender} onChange={(e: any) => handleChange("gender", e.target.value)} options={["Male", "Female", "Other"]} required />
            <SelectField label="Marital Status" value={formData.maritalStatus} onChange={(e: any) => handleChange("maritalStatus", e.target.value)} options={["Single", "Married", "Divorced", "Widowed"]} required />
            <InputField label="Religion" value={formData.religion} onChange={(e: any) => handleChange("religion", e.target.value)} />
            <InputField label="Place of Birth" value={formData.placeOfBirth} onChange={(e: any) => handleChange("placeOfBirth", e.target.value)} />
          </div>

          <SectionHead title="Contact Information" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            <InputField label="Email Address" type="email" value={formData.email} onChange={(e: any) => handleChange("email", e.target.value)} required />
            <InputField label="Mobile Phone" value={formData.mobilePhone} onChange={(e: any) => handleChange("mobilePhone", e.target.value)} required />
            <InputField label="Land Phone" value={formData.landphone} onChange={(e: any) => handleChange("landphone", e.target.value)} />
            <div className="md:col-span-3">
              <InputField label="Contact Address" value={formData.address} onChange={(e: any) => handleChange("address", e.target.value)} required />
            </div>
            <div className="md:col-span-3">
              <InputField label="Residential Address" value={formData.resAddress} onChange={(e: any) => handleChange("resAddress", e.target.value)} />
            </div>
            <InputField label="Landmark" value={formData.landMark} onChange={(e: any) => handleChange("landMark", e.target.value)} />
            <InputField label="State" value={formData.state} onChange={(e: any) => handleChange("state", e.target.value)} required />
            <InputField label="Country" value={formData.country} onChange={(e: any) => handleChange("country", e.target.value)} required />
          </div>

          <SectionHead title="Identification" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            <SelectField label="Means of ID" value={formData.meansID} onChange={(e: any) => handleChange("meansID", e.target.value)} options={["National ID", "Passport", "Driver's License", "Voter's Card"]} required />
            <InputField label="ID Number" value={formData.idNo} onChange={(e: any) => handleChange("idNo", e.target.value)} required />
            <InputField label="National ID (Optional)" value={formData.nationalID} onChange={(e: any) => handleChange("nationalID", e.target.value)} />
            <InputField label="NIN" value={formData.nin} onChange={(e: any) => handleChange("nin", e.target.value)} />
            <InputField label="BVN" value={formData.bvn} onChange={(e: any) => handleChange("bvn", e.target.value)} />
          </div>

          <SectionHead title="Health & Lifestyle" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            <InputField label="Height (cm)" type="number" value={formData.height} onChange={(e: any) => handleChange("height", e.target.value)} />
            <InputField label="Weight (kg)" type="number" value={formData.weight} onChange={(e: any) => handleChange("weight", e.target.value)} />
            <InputField label="Sports" value={formData.sport} onChange={(e: any) => handleChange("sport", e.target.value)} />
            <SelectField label="Bodily Infirmity?" value={formData.infirmity} onChange={(e: any) => handleChange("infirmity", e.target.value)} options={["YES", "NO"]} />
            <SelectField label="Stroke History?" value={formData.stroke} onChange={(e: any) => handleChange("stroke", e.target.value)} options={["YES", "NO"]} />
            <SelectField label="Currently Under Treatment?" value={formData.treatment} onChange={(e: any) => handleChange("treatment", e.target.value)} options={["YES", "NO"]} />
            <SelectField label="Absent from work past 10yrs?" value={formData.workAbesent} onChange={(e: any) => handleChange("workAbesent", e.target.value)} options={["YES", "NO"]} />
            <SelectField label="Do you smoke?" value={formData.smoke} onChange={(e: any) => handleChange("smoke", e.target.value)} options={["YES", "NO"]} />
            <SelectField label="Engage in aviation?" value={formData.aviation} onChange={(e: any) => handleChange("aviation", e.target.value)} options={["YES", "NO"]} />
            <InputField label="Chronic Illness (if any)" value={formData.chronicIllness} onChange={(e: any) => handleChange("chronicIllness", e.target.value)} />
          </div>

          <SectionHead title="Policy & Cover Details" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            <SelectField 
              label="Branch" 
              value={formData.brCode} 
              onChange={(e: any) => handleChange("brCode", e.target.value)} 
              options={branches.map((b: any) => ({ label: b.description, value: b.branchID }))}
              required 
            />
            <SelectField
              label="Product Code"
              value={formData.productCode}
              onChange={(e: any) => handleChange("productCode", e.target.value)}
              options={products.map((p: any) => ({ label: p.productName, value: p.productID }))}
              required
            />
            {(formData.productCode === "FFP" || formData.productCode === "TAS") && (
              <SelectField 
                label="Payment Variant" 
                value={formData.remark === "PREMIUM" ? "" : formData.remark} 
                onChange={(e: any) => handleChange("remark", e.target.value)} 
                options={formData.productCode === "FFP" ? [
                  { label: "25%, 25%, 50% VARIANT", value: "25_25_50" },
                  { label: "25%, 25%, 75% VARIANT", value: "25_25_75" },
                  { label: "25%, 25%, 100% VARIANT", value: "25_25_100" }
                ] : [
                  { label: "Cash Back Plan", value: "CASHBACK_PLAN" },
                  { label: "Normal Plan", value: "NORMAL_PLAN" }
                ]}
                required 
              />
            )}
            <SelectField label="Frequency" value={formData.frequency} onChange={(e: any) => handleChange("frequency", e.target.value)} options={["Single", "Monthly", "Quarterly", "Half-Yearly", "Annually", "Weekly", "Fortnightly", "Daily"]} required />

            <InputField label="Regular Saving" type="number" value={formData.regularSaving} onChange={(e: any) => handleChange("regularSaving", Number(e.target.value))} required />
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-800">First Premium Amount</label>
                {formData.sumAssured > 0 && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Will be calculated</span>}
              </div>
              <input
                type="number"
                value={formData.firstPremium || ""}
                onChange={(e) => handleChange("firstPremium", Number(e.target.value))}
                disabled={formData.sumAssured > 0}
                className={`w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8c4b8d]/30 focus:border-[#8c4b8d] ${formData.sumAssured > 0 ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-800">Sum Assured</label>
                {formData.firstPremium > 0 && <span className="text-[10px] font-bold text-[#8c4b8d] bg-[#8c4b8d]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Will be calculated</span>}
              </div>
              <input
                type="number"
                value={formData.sumAssured || ""}
                onChange={(e) => handleChange("sumAssured", Number(e.target.value))}
                disabled={formData.firstPremium > 0}
                className={`w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8c4b8d]/30 focus:border-[#8c4b8d] ${formData.firstPremium > 0 ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
              />
            </div>

            <InputField label="Extra Rate" type="number" value={formData.extraRate} onChange={(e: any) => handleChange("extraRate", Number(e.target.value))} />
            <InputField label="Loading Rate" type="number" value={formData.loadingRate} onChange={(e: any) => handleChange("loadingRate", Number(e.target.value))} />

            <InputField label="Start Date" type="date" value={formData.issueDate?.split('T')[0] || ""} onChange={(e: any) => handleChange("issueDate", e.target.value)} required />
            <InputField label="Duration" type="number" value={formData.duration} onChange={(e: any) => handleChange("duration", Number(e.target.value))} required />
            <InputField label="Maturity Date" type="date" value={formData.expiryDate?.split('T')[0] || ""} onChange={(e: any) => handleChange("expiryDate", e.target.value)} disabled={true} required />
          </div>

          <SectionHead title="Payment Details" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            <SelectField label="Payment Type" value={formData.paymentType} onChange={(e: any) => handleChange("paymentType", e.target.value)} options={["Cash", "Transfer", "Cheque", "POS"]} required />
            <InputField label="Payment Amount" type="number" value={formData.paymentAmount} onChange={(e: any) => handleChange("paymentAmount", Number(e.target.value))} required />
            <InputField label="Date of Payment" type="date" value={formData.dateofpayment?.split('T')[0]} onChange={(e: any) => handleChange("dateofpayment", e.target.value)} required />
            <InputField label="Receipt No" value={formData.receiptNo} onChange={(e: any) => handleChange("receiptNo", e.target.value)} />
            <InputField label="Bank Name" value={formData.bankName} onChange={(e: any) => handleChange("bankName", e.target.value)} />
            <InputField label="Account No" value={formData.accountNo} onChange={(e: any) => handleChange("accountNo", e.target.value)} />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-8 mt-4 border-t border-gray-100">
            <button
              type="button"
              disabled={isSubmitting}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium text-sm disabled:opacity-50"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#8c4b8d] text-white rounded-lg hover:bg-opacity-90 transition-opacity font-semibold shadow-sm text-sm disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditMode ? "Update Policy" : "Submit Policy"}
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {activeTab === "Beneficiaries" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center min-h-[400px] flex flex-col justify-center items-center">
          <div className="bg-purple-100 p-4 rounded-full mb-4">
            <Users size={32} className="text-[#8c4b8d]" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Beneficiaries Added Yet</h2>
          <p className="text-gray-500 max-w-sm">
            {isEditMode 
              ? "Add beneficiaries to this policy in the system." 
              : "Save the initial policy setup first to unlock adding beneficiaries in the system."}
          </p>
        </div>
      )}

    </div>
  );
};

export default NewTraditionalPolicySetupPage;