// src/components/policy-admin/NewInvestmentPolicySetupPage.tsx
// @ts-nocheck

import { useState, useEffect } from "react";
import { ArrowLeft, Users, RefreshCw, Save, ArrowRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import apiCall from "../../utils/api-call";
import { useToast } from "../../components/UI/use-toast";
import { policyToForm } from "../../utils/individualPolicy";
import BeneficiariesPanel from "../../components/individual/BeneficiariesPanel";
import PolicySummaryCard from "../../components/individual/PolicySummaryCard";
import { usePolicySteps, type StepField } from "../../components/individual/usePolicySteps";
import { Stepper } from "../../components/page/PageKit";

// Required fields per step (Client, Identity & health, Plan, Payment & save). validateForm still runs on save.
const STEP_FIELDS: StepField[][] = [
  [["surName", "Surname"], ["dateOfBirth", "Date of Birth"], ["gender", "Gender"], ["email", "Email Address"], ["mobilePhone", "Mobile Phone"], ["address", "Contact Address"], ["state", "State"]],
  [],
  [["productCode", "Product Code"], ["frequency", "Frequency"], ["regularSaving", "Regular Saving", "positive"], ["issueDate", "Start Date"], ["duration", "Duration", "positive"]],
  [["paymentType", "Payment Type"], ["dateofpayment", "Date of Payment"]]
];


// ─── helpers ───────────────────────────────────────────────
const InputField = ({ label, value, onChange, type = "text", required = false, disabled = false }: any) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-slate-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value || ""}
      onChange={onChange}
      disabled={disabled}
      required={required}
      className={`w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-[#155dfd] focus:ring-4 focus:ring-blue-100 ${disabled ? "cursor-not-allowed bg-slate-50 text-slate-500" : "bg-white"}`}
    />
  </div>
);

const SelectField = ({ label, value, onChange, options, required = false }: any) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-slate-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value || ""}
      onChange={onChange}
      required={required}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-[#155dfd] focus:ring-4 focus:ring-blue-100"
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
  <h3 className="mb-5 mt-10 border-b border-slate-100 pb-3 text-base font-semibold text-slate-900 first:mt-0">
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
  regularSaving: 0,
  productCode: "",
  extraRate: 0,
  loadingRate: 0,
  maritalStatus: "Single",
  country: "Nigeria",
  agentCode: "",
  agentDescription: "",
  riskID: "B",
  remark: "PREMIUM",
  meansID: "National ID",
  idNo: "",
  chronicIllness: "",
  mop: "",
  paymentType: "Cash",
  paymentAmount: 0,
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

const NewInvestmentPolicySetupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast(); // ✅ Initialize toast hook
  
  // ✅ Check if we're in edit mode and get initial data
  const isEditMode = location.state?.editMode || location.pathname.includes("edit-investment");
  const initialData = location.state?.policyData || null;
  
  const [activeTab, setActiveTab] = useState("Information");
  const [formData, setFormData] = useState(emptyFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  // ✅ Populate form with initial data if in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData(policyToForm(initialData, emptyFormState));
      
      // ✅ Show success toast when loading edit data
      toast({
        title: "Success",
        description: "Policy data loaded successfully",
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
        
        const filteredProds = (prodResp.data || []).filter((p: any) => p.riskID === "B");
        setProducts(filteredProds);
        setBranches(branchResp.data || []);
      } catch (err) {
        console.error("Failed to fetch setup data:", err);
        // ✅ Show error toast on data fetch failure
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
        // Duration is in YEARS (rate tables and API) whatever the payment frequency
        mat.setFullYear(mat.getFullYear() + Math.floor(Number(formData.duration) || 0));

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

  const validateForm = () => {
    const fail = (description: string) => {
      toast({ title: "Validation Error", description, variant: "destructive" });
      return false;
    };
    const required = [
      ["surName", "Surname"], ["dateOfBirth", "Date of Birth"], ["gender", "Gender"], ["email", "Email Address"],
      ["mobilePhone", "Mobile Phone"], ["address", "Contact Address"], ["state", "State"], ["productCode", "Product Code"],
      ["frequency", "Frequency"], ["issueDate", "Start Date"], ["paymentType", "Payment Type"], ["dateofpayment", "Date of Payment"],
    ];
    for (const [field, label] of required) {
      const v = formData[field];
      if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) return fail(`${label} is required`);
    }
    if (!(Number(formData.regularSaving) > 0)) return fail("Regular Saving must be greater than 0");
    if (!(Number(formData.duration) > 0)) return fail("Duration must be greater than 0");
    if (new Date(formData.dateOfBirth) > new Date()) return fail("Date of birth cannot be in the future");
    return true;
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    
    // ✅ Show loading toast
    const loadingToast = toast({
      title: "Processing",
      description: isEditMode ? "Updating policy..." : "Creating policy...",
      variant: "default",
    });
    
    try {
      const payload = {
        ...formData,
        fullName: `${formData.surName || ""} ${formData.otherNames || ""}`.trim(),
        riskID: "B",
        remark: "PREMIUM",
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : new Date().toISOString(),
        dateofpayment: formData.dateofpayment ? new Date(formData.dateofpayment).toISOString() : new Date().toISOString(),
        issueDate: formData.issueDate ? new Date(formData.issueDate).toISOString() : new Date().toISOString(),
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : new Date().toISOString(),
        dateEmployed: formData.dateEmployed ? new Date(formData.dateEmployed).toISOString() : null,
      };
      
      let response;
      if (isEditMode) {
        // ✅ CORRECT: Use POST with /edit/{policyNo}
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
        
         response = await apiCall.post(`/v1/lifepolicyAdmin/edit/policyNo?policyNo=${encodeURIComponent(policyNo)}`, payload);
      
      toast({
        title: "Success",
        description: "Investment policy updated successfully!",
        variant: "default",
      });
      } else {
        // ✅ Create new policy
        response = await apiCall.post("/v1/lifepolicyAdmin/create", payload);
        
        // ✅ Success toast for creation
        const policyNo = response?.data?.policyNo || response?.data?.proposalNo || "";
        toast({
          title: "Success",
          description: `Investment policy created successfully!${policyNo ? ` Policy No: ${policyNo}` : ''}`,
          variant: "default",
        });
      }
      
      // ✅ Navigate after successful operation
      navigate("/underwriting/individual/policy-admin");
      
    } catch (err: any) {
      // ✅ Show error toast
      const errorMessage = err?.response?.data?.message || err.message || "Unknown error";
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'create'} policy: ${errorMessage}`,
        variant: "destructive",
      });
      
      console.error("Policy operation failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };


  const flow = usePolicySteps({ formData, stepFields: STEP_FIELDS, toast, editMode: !!isEditMode, onSave: handleCreatePolicy });

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-[#155dfd]"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <p className="text-sm font-medium text-[#155dfd]">Policy admin</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {isEditMode ? "Edit Investment Policy" : "New Investment Policy Setup"}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
            {isEditMode ? "Update policy details for the client" : "Create a brand new policy for a client"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          onClick={() => setActiveTab("Information")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${activeTab === "Information" ? "bg-[#155dfd] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
        >
          Information
        </button>
        <button
          onClick={() => setActiveTab("Beneficiaries")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${activeTab === "Beneficiaries" ? "bg-[#155dfd] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
        >
          <Users size={16} /> Beneficiaries
        </button>
      </div>

      {activeTab === "Information" && (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div ref={flow.topRef} className="min-w-0 scroll-mt-6 space-y-6">
        <Stepper steps={flow.steps} current={flow.step} reachable={flow.reached} onStep={flow.goTo} />
        <form onSubmit={flow.onSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          
          {flow.step === 0 && (<>
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

          </>)}

          {flow.step === 1 && (<>
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

          </>)}

          {flow.step === 2 && (<>
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
            <SelectField label="Frequency" value={formData.frequency} onChange={(e: any) => handleChange("frequency", e.target.value)} options={["Single", "Monthly", "Quarterly", "Half-Yearly", "Annually", "Weekly", "Fortnightly", "Daily"]} required />

            <InputField label="Regular Saving" type="number" value={formData.regularSaving} onChange={(e: any) => handleChange("regularSaving", Number(e.target.value))} required />
            <InputField label="Extra Rate" type="number" value={formData.extraRate} onChange={(e: any) => handleChange("extraRate", Number(e.target.value))} />
            <InputField label="Loading Rate" type="number" value={formData.loadingRate} onChange={(e: any) => handleChange("loadingRate", Number(e.target.value))} />

            <InputField label="Start Date" type="date" value={formData.issueDate?.split('T')[0] || ''} onChange={(e: any) => handleChange("issueDate", e.target.value)} required />
            <InputField label="Duration" type="number" value={formData.duration} onChange={(e: any) => handleChange("duration", Number(e.target.value))} required />
            <InputField label="Maturity Date" type="date" value={formData.expiryDate?.split('T')[0] || ''} onChange={(e: any) => handleChange("expiryDate", e.target.value)} disabled={true} required />
          </div>

          </>)}

          {flow.step === 3 && (<>
          <SectionHead title="Payment Details" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            <SelectField label="Payment Type" value={formData.paymentType} onChange={(e: any) => handleChange("paymentType", e.target.value)} options={["Cash", "Transfer", "Cheque", "POS"]} required />
            <InputField label="Payment Amount" type="number" value={formData.paymentAmount} onChange={(e: any) => handleChange("paymentAmount", Number(e.target.value))} required />
            <InputField label="Date of Payment" type="date" value={formData.dateofpayment?.split('T')[0]} onChange={(e: any) => handleChange("dateofpayment", e.target.value)} required />
            <InputField label="Receipt No" value={formData.receiptNo} onChange={(e: any) => handleChange("receiptNo", e.target.value)} />
            <InputField label="Bank Name" value={formData.bankName} onChange={(e: any) => handleChange("bankName", e.target.value)} />
            <InputField label="Account No" value={formData.accountNo} onChange={(e: any) => handleChange("accountNo", e.target.value)} />
          </div>

          </>)}

          {/* Step navigation */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
              onClick={flow.isFirst ? () => navigate(-1) : flow.back}
            >
              {flow.isFirst ? "Cancel" : (<><ArrowLeft size={16} /> Back</>)}
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <span className="hidden text-sm text-slate-500 md:inline">Step {flow.step + 1} of {flow.steps.length}</span>
              {isEditMode && !flow.isLast && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={flow.saveAll}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  <Save size={16} /> Save changes
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-[#155dfd] px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-[#0f4fe0] disabled:opacity-70"
              >
                {!flow.isLast ? (
                  <>
                    Continue to {flow.steps[flow.step + 1].toLowerCase()}
                    <ArrowRight size={16} />
                  </>
                ) : isSubmitting ? (
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
          </div>
        </form>
        </div>
        <PolicySummaryCard formData={formData} branches={branches} products={products} />
        </div>
      )}

      {activeTab === "Beneficiaries" && (
        isEditMode && (formData.policyNo || formData.proposalNo) ? (
          <BeneficiariesPanel policyNo={formData.policyNo || formData.proposalNo} />
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Users size={32} className="text-[#155dfd] mb-3" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Save the policy first</h2>
            <p className="text-gray-500 max-w-sm">Beneficiaries are added from the policy's Edit screen once it has a policy number.</p>
          </div>
        )
      )}

    </div>
  );
};

export default NewInvestmentPolicySetupPage;