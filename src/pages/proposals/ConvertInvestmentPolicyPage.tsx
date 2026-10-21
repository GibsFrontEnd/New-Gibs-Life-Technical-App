//@ts-nocheck
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchInvestmentProposalById, fetchProposalDocuments, fetchProposalBeneficiaries, fetchProposalStatuses, convertInvestmentProposal, ProposalDocument, Beneficiary } from "../../features/reducers/proposalReducers/proposalsSlice";
import { ArrowLeft, User, Users, RefreshCw, FileText, Download, Calendar, Mail, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ─── helpers ───────────────────────────────────────────────
const InputField = ({ label, value, type = "text", required = false }: any) => (
  <div>
    <label className="block text-sm font-semibold text-gray-800 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value || ""}
      readOnly
      className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-600 focus:outline-none"
    />
  </div>
);

const SectionHead = ({ title }: { title: string }) => (
  <h3 className="text-lg font-semibold text-[#111827] border-b border-gray-200 pb-2 mb-4 mt-8">
    {title}
  </h3>
);

// ─── main component ─────────────────────────────────────────
interface Props {
  proposalNo: string;
}

const ConvertInvestmentPolicyPage = ({ proposalNo }: Props) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentProposal: p, loadingCurrent, errorCurrent, currentDocuments, loadingDocuments, currentBeneficiaries, loadingBeneficiaries, proposalStatuses, loadingStatuses } = useSelector((s: any) => s.investmentProposals);

  const [activeTab, setActiveTab] = useState("Information");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    if (!selectedStatus) {
      alert("Please select a status first.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await dispatch(convertInvestmentProposal({ proposalNo, policyStatus: selectedStatus })).unwrap();
      alert("Proposal Status updated successfully!");
      navigate("/underwriting/convert-to-policy/investment-policies");
    } catch (err: any) {
      alert("Failed to update status: " + (err || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (proposalNo) {
      dispatch(fetchInvestmentProposalById(proposalNo));
      dispatch(fetchProposalDocuments(proposalNo));
      dispatch(fetchProposalBeneficiaries(proposalNo));
      dispatch(fetchProposalStatuses());
    }
  }, [dispatch, proposalNo]);

  useEffect(() => {
    if (p && p.remarks) {
      if (p.remarks.toUpperCase() !== "PROPOSAL") {
        setSelectedStatus(p.remarks);
      } else {
        setSelectedStatus("");
      }
    }
  }, [p]);

  // ─── loading skeleton ─────────────────────────────────────
  if (loadingCurrent) {
    return (
      <div className="p-6 space-y-4 animate-pulse max-w-[1400px] mx-auto">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
        <div className="flex gap-4 border-b border-gray-200 pb-2">
          <div className="h-10 bg-gray-200 rounded w-32" />
          <div className="h-10 bg-gray-200 rounded w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="h-12 bg-gray-100 rounded" />
          <div className="h-12 bg-gray-100 rounded" />
          <div className="h-12 bg-gray-100 rounded" />
          <div className="h-12 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  // ─── error ───────────────────────────────────────────────
  if (errorCurrent || !p) {
    return (
      <div className="p-6 flex flex-col items-center gap-4 text-center max-w-[1400px] mx-auto pt-20">
        <p className="text-red-500 font-medium">{errorCurrent || "No proposal found"}</p>
        <div className="flex gap-4 mt-2">
          <button
            onClick={() => navigate("/underwriting/convert-to-policy/investment-policies")}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            Go Back
          </button>
          <button
            onClick={() => {
              dispatch(fetchInvestmentProposalById(proposalNo));
              dispatch(fetchProposalDocuments(proposalNo));
              dispatch(fetchProposalBeneficiaries(proposalNo));
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm"
            style={{ background: "#155dfd" }}
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "Information", icon: User },
    { id: "Beneficiaries", icon: Users },
  ];

  const handleProcessConvert = () => {
    // API call for saving the conversion would go here
    alert("Process Convert to Policy for " + proposalNo);
  };

  const fmtDate = (dateStr: string) => dateStr ? dateStr.substring(0, 10) : "";
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      {/* Policy Type Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => { setActiveTag("B"); setPage(1); }}
          className={`px-5 py-3 text-sm font-semibold transition-colors relative ${activeTag === "B" ? "text-[#155dfd]" : "text-gray-500 hover:text-gray-700"}`}
        >
          Investment Policies
          {activeTag === "B" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#155dfd]" />}
        </button>
        <button
          onClick={() => { setActiveTag("A"); setPage(1); }}
          className={`px-5 py-3 text-sm font-semibold transition-colors relative ${activeTag === "A" ? "text-[#155dfd]" : "text-gray-500 hover:text-gray-700"}`}
        >
          Traditional Policies
          {activeTag === "A" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#155dfd]" />}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-6 font-medium text-sm">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 transition-colors ${
                isActive
                  ? "bg-[#155dfd] text-white rounded-t-lg"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-t-lg"
              }`}
            >
              <Icon size={16} />
              {tab.id}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-gray-200 rounded-b-xl rounded-tr-xl shadow-sm p-8">
        {activeTab === "Information" && (
          <form className="space-y-4 max-w-5xl">
            {/* Personal Information */}
            <SectionHead title="Personal Information" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <InputField label="Title" value={p.title} required />
              <InputField label="Surname" value={p.surName} required />
              <InputField label="Other Names" value={p.otherNames} required />
              <InputField label="Middle Name" value={""} required />
              <InputField label="Gender" value={p.sex} required />
              <InputField label="Date of Birth" value={fmtDate(p.dateofBirth)} type="date" required />
              <InputField label="Place of Birth" value={p.placeOfBirth} />
              <InputField label="Name of Spouse" value={p.spouseName} />
              <InputField label="Local Govt of Origin" value={p.govtOfOrigin} />
              <InputField label="Religion" value={p.relgion} />
              <InputField label="Designation" value={p.designation} />
              <InputField label="Marital Status" value={p.maritalStatus} required />
              <InputField label="Occupation" value={p.occupation} required />
            </div>

            {/* Address Information */}
            <SectionHead title="Address Information" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="md:col-span-3">
                <InputField label="Residential Address" value={p.resAddress || p.address} required />
              </div>
              <div className="md:col-span-3">
                <InputField label="Contact Address (If different from above)" value={p.contactAddress} />
              </div>
              <div className="md:col-span-3">
                <InputField label="Landmark (Police station, market place, bus stop etc)" value={p.landMark} />
              </div>
              <InputField label="State" value={p.state} required />
              <InputField label="Country" value={p.country} required />
            </div>

            {/* Contact Information */}
            <SectionHead title="Contact Information" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <InputField label="Landphone" value={p.landphone} />
              <InputField label="Mobile Phone" value={p.mobilePhone} required />
              <InputField label="Email" value={p.email} type="email" required />
            </div>

            {/* ID Information */}
            <SectionHead title="ID Information" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <InputField label="Means of ID" value={p.meansID} required />
              <InputField label="ID Number" value={p.idNo} required />
              <InputField label="Issue Date" value={fmtDate(p.issueDate)} type="date" required />
              <InputField label="NIN Number" value={p.nin} />
              <InputField label="BVN Number" value={p.bvn} />
            </div>

            {/* Occupation Information */}
            <SectionHead title="Occupation Information" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <InputField label="Type of Employment" value={p.employmentType} required />
              <InputField label="Name of Employer" value={p.employerName} />
              <InputField label="Date Employed" value={fmtDate(p.dateEmployed)} type="date" required />
              <div className="md:col-span-3">
                <InputField label="Address of Employer" value={p.employerAddress} />
              </div>
              <InputField label="Employer Tel No" value={p.employerNumber} />
              <InputField label="Employer Email Address" value={p.employerEmail} />
            </div>

            {/* Health Information */}
            <SectionHead title="Health Information" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <InputField label="Height (cm)" value={p.height} />
              <InputField label="Weight (kg)" value={p.weight} />
              <InputField label="Sport Engagement" value={p.sport} />
            </div>

            {/* Cover Details */}
            <SectionHead title="Cover Details" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <InputField label="Cover Code" value={p.coverCode} />
              <InputField label="Cover Type" value={p.covertype} />
              <InputField label="Sum Assured" value={`₦${p.sumAssured?.toLocaleString()}`} />
              <InputField label="Basic Premium" value={`₦${p.basicPremium?.toLocaleString()}`} />
              <InputField label="Total Premium" value={`₦${p.totalPremium?.toLocaleString()}`} />
              <InputField label="Payment Type" value={p.paymentType} />
              <InputField label="Payment Amount" value={`₦${p.paymentAmount?.toLocaleString()}`} />
              <InputField label="Start Date" value={fmtDate(p.startDate)} type="date" />
              <InputField label="Maturity Date" value={fmtDate(p.maturityDate)} type="date" />
              <InputField label="Duration (Years)" value={p.duration} />
            </div>

            {/* Proposal Status */}
            <SectionHead title="Proposal Status" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select 
                  className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:border-[#155dfd] focus:ring-4 focus:ring-blue-100 focus:border-[#155dfd]"
                  disabled={loadingStatuses || isSubmitting}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">{loadingStatuses ? "Loading..." : "Select Status"}</option>
                  {proposalStatuses && proposalStatuses.map((opt: {text: string, value: string}, idx: number) => (
                    <option key={idx} value={opt.value}>{opt.text}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Documents */}
            <SectionHead title="Documents" />
            {loadingDocuments ? (
              <div className="p-8 border border-dashed border-gray-300 rounded-lg text-center bg-gray-50 flex flex-col items-center justify-center min-h-[160px]">
                <RefreshCw size={24} className="text-gray-400 animate-spin mb-2" />
                <p className="text-gray-500 font-medium text-sm">Loading documents...</p>
              </div>
            ) : currentDocuments && currentDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentDocuments.map((doc: ProposalDocument) => (
                  <div key={doc.attachID} className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50 hover:border-blue-300 transition-colors group">
                    <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-100 text-blue-500">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm truncate" title={doc.docDetails}>
                        {doc.docDetails}
                      </h4>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="font-medium px-2 py-0.5 bg-gray-200/60 rounded text-gray-600">
                          {doc.docTypes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(doc.entryDate).toLocaleDateString()}
                        </span>
                        <span>{formatBytes(doc.documentSize)}</span>
                      </div>
                    </div>
                    <button type="button" className="p-2 text-gray-400 hover:text-[#155dfd] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200" title="Download Document">
                      <Download size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 border border-dashed border-gray-300 rounded-lg text-center bg-gray-50 flex flex-col items-center justify-center min-h-[160px]">
                <FileText size={32} className="text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No documents attached.</p>
                <p className="text-xs text-gray-400 mt-1">There are no files uploaded for this proposal.</p>
              </div>
            )}

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-8 mt-4 border-t border-gray-100">
              <button
                type="button"
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium text-sm disabled:opacity-50"
                disabled={isSubmitting}
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-sm text-sm disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Approved"
                )}
              </button>
            </div>
          </form>
        )}

        {/* Beneficiaries Tab */}
        {activeTab === "Beneficiaries" && (
          <div className="space-y-6 max-w-5xl">
            {loadingBeneficiaries ? (
              <div className="p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
                <RefreshCw size={32} className="text-gray-300 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading beneficiaries...</p>
              </div>
            ) : currentBeneficiaries && currentBeneficiaries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {currentBeneficiaries.map((ben: Beneficiary) => (
                  <div key={ben.transID} className="bg-gray-50 border border-gray-200 rounded-xl p-6 relative overflow-hidden">
                    {/* Primary Badge */}
                    {ben.type === "PRIMARY" && (
                      <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">
                        Primary
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4 mb-4">
                      <div className="h-12 w-12 bg-[#155dfd]/10 text-[#155dfd] flex items-center justify-center rounded-full text-lg font-bold">
                        {ben.surname?.charAt(0) || ""}{ben.otherNames?.charAt(0) || ""}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 text-lg">
                          {ben.otherNames} {ben.surname}
                        </h4>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                          <span>{ben.relation}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full" />
                          <span>{ben.percentage * 100}% Allocation</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mt-4 text-sm text-gray-600">
                      <div className="flex items-center justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-400">Gender &amp; Age</span>
                        <span className="font-medium text-gray-700">{ben.sex}, {ben.age} yrs</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-400">Date of Birth</span>
                        <span className="font-medium text-gray-700">{fmtDate(ben.dob)}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-400">Address</span>
                        <span className="font-medium text-gray-700 text-right max-w-[60%] truncate" title={ben.address}>{ben.address || "—"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center min-h-[400px] flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-xl bg-gray-50">
                <Users size={32} className="text-gray-300 mb-4" />
                <h4 className="text-lg font-medium text-gray-700">No Beneficiaries</h4>
                <p className="text-gray-500 mt-2 max-w-sm">
                  There are currently no beneficiaries listed for this proposal.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConvertInvestmentPolicyPage;
