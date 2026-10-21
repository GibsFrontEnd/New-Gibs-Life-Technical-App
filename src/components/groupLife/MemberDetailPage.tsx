// src/components/groupLife/MemberDetailPage.tsx
// @ts-nocheck

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { schemeUrl } from "../../utils/groupLifeNav";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../UI/new-button";
import { Card, CardContent, CardHeader, CardTitle } from "../UI/card";
import { Input } from "../UI/new-input";
import { Label } from "../UI/label";
import { 
  ArrowLeft, 
  RefreshCw, 
  Loader2, 
  Upload, 
  Plus, 
  Pencil, 
  Trash2, 
  Printer, 
  Users, 
  FileText, 
  Building2, 
  Calendar, 
  Banknote,
  FileCheck,
  X,
  Eye,
  Save,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useToast } from "../UI/use-toast";
import type { GroupLifeMember } from "../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";
import { 
  uploadExcelMembers, 
  parseExcelMembers, 
  bulkUploadMembers,
  selectGroupLifeQuotations 
} from "../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";
import MemberManagementTable from "./MemberManagementTable";
import { formatDate, formatCurrency } from "../../utils/ui-utilities";
import { SERVER_URL } from "../../utils/constants";
// ✅ FIX: Import the correct components from new-dialog
import { 
  ButtonDismissDialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter
} from "../UI/new-dialog";

const MemberDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const policyNo = id ? decodeURIComponent(id) : "";
  const navigate = useNavigate();
  const location = useLocation();

  // ==================== READ endorsementNo FROM THE URL OR LOCATION STATE ====================
  const [searchParams] = useSearchParams();
  // "[AUTO]" is only the details-tab placeholder for a section with no endorsement number yet.
  const rawEndorsementNo = searchParams.get("endorsementNo") || location.state?.endorsementNo || "";
  const endorsementNo = rawEndorsementNo === "[AUTO]" ? "" : rawEndorsementNo;

  const { toast } = useToast();
  const dispatch = useDispatch();

  // Get state from Redux
  const { currentMembers, loading } = useSelector(selectGroupLifeQuotations);

  const [members, setMembers] = useState<GroupLifeMember[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [detailData, setDetailData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState<GroupLifeMember | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [bizOption, setBizOption] = useState<string>("");

  
  // New states for parse & preview workflow
  const [parsedPayload, setParsedPayload] = useState<any>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [uploadMethod, setUploadMethod] = useState<'direct' | 'preview'>('direct');

  // Direct upload options modal
  const [showDirectUploadModal, setShowDirectUploadModal] = useState(false);
  const [pricingMode, setPricingMode] = useState<"PolicyRate" | "FixedRate">("PolicyRate");
  const [fixedPremiumRate, setFixedPremiumRate] = useState<number | string>("");
  // The scheme's own Premium Rate% (policy A10), used when pricing mode is PolicyRate.
  const [policyRatePercent, setPolicyRatePercent] = useState<number | null>(null);

  useEffect(() => {
    if (!policyNo) return;
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    fetch(`${SERVER_URL}/grouplife/policies/policyNo?policyNo=${encodeURIComponent(policyNo)}`, {
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((policy) => {
        const fraction = policy?.premiumRateFraction;
        setPolicyRatePercent(fraction != null ? Number(fraction) * 100 : null);
      })
      .catch(() => setPolicyRatePercent(null));
  }, [policyNo]);

  // Format date for display
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Fetch policy detail
  const fetchPolicyDetail = async () => {
    if (!policyNo) {
      console.warn("No policy number found");
      setLoadingDetail(false);
      return;
    }

    setLoadingDetail(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      // Scope the detail lookup to the specific endorsement when we have one,
      // so a brand-new Additional/Reversal/etc. endorsement doesn't silently
      // fall back to whatever the backend considers "current".
      const query = new URLSearchParams({ policyNo });
      if (endorsementNo) query.append("endorsementNo", endorsementNo);
      
      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/policyNo/detail?${query.toString()}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Not Found",
            description: "Policy details not found",
            variant: "destructive",
          });
          setLoadingDetail(false);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setDetailData(data);
      
      const effectiveEndorsement = data.endorsementNo || endorsementNo || location.state?.endorsementNo || "";
      
      setFormData({
        policyNo: data.policyNo || policyNo,
        insuredName: data.insuredName || "N/A",
        endorsementNo: effectiveEndorsement,
        entryDate: data.entryDate || new Date().toISOString(),
        startDate: data.startDate || new Date().toISOString(),
        expiryDate: data.expiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        ourShare: data.proportionPercent || 100,
        totalMembers: data.members?.length || 0,
        fixedPremiumRate: data.premiumRatePercent || 0,
        gpaRates: data.gpaRates || false,
        totalSumInsured: data.totalSumInsured || 0,
        totalPremium: data.totalPremium || 0,
      });

      // Members ultimately come from MemberManagementTable's own fetch (scoped by
      // policyNo + endorsementNo via Redux), but seed local state from this response
      // too so the summary cards above don't show stale counts while that loads.
      setMembers(data.members || []);

    } catch (error) {
      console.error("Error fetching policy detail:", error);
      toast({
        title: "Error",
        description: "Failed to load policy details",
        variant: "destructive",
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (policyNo) {
      fetchPolicyDetail();
    } else {
      setLoadingDetail(false);
    }
    // Re-fetch whenever we land on a different endorsement for the same policy,
    // not just when the policy number itself changes.
  }, [policyNo, endorsementNo]);

  // Sync with Redux members when they change - including when they're cleared
  // to an empty array (e.g. a fresh Additional endorsement with no members yet).
  useEffect(() => {
    setMembers(currentMembers || []);
  }, [currentMembers]);

  // Handle member operations
  const handleAddMember = (member: Omit<GroupLifeMember, "id">) => {
    const newMember = {
      ...member,
      id: `temp-${Date.now()}`,
    };
    setMembers([...members, newMember]);
    toast({
      title: "Success",
      description: "Member added successfully",
      variant: "default",
    });
  };

  const handleUpdateMember = (index: number, member: GroupLifeMember) => {
    const updatedMembers = [...members];
    updatedMembers[index] = member;
    setMembers(updatedMembers);
    toast({
      title: "Success",
      description: "Member updated successfully",
      variant: "default",
    });
  };

  const handleDeleteMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
    toast({
      title: "Success",
      description: "Member removed successfully",
      variant: "default",
    });
  };

  const handlePrintCertificate = () => {
    toast({
      title: "Print Certificate",
      description: "Generating certificate...",
      variant: "default",
    });
  };

  // Says how many rows went in, how many were skipped and why (the API groups the reasons).
  // Success only when something was added; otherwise the user must see why nothing happened.
  const reportUpload = (result: any) => {
    const inserted = result?.insertedCount || 0;
    const skipped = result?.skippedCount || 0;
    const reasons = (result?.skipReasons || [])
      .slice(0, 3)
      .map((r: any) => `${r.count} × ${r.reason}${r.examples?.length ? ` (e.g. ${r.examples.slice(0, 2).join(", ")})` : ""}`)
      .join("\n");
    if (inserted === 0) {
      toast({
        title: "No members were added",
        description: skipped > 0 ? `All ${skipped} rows were skipped.\n${reasons}` : "The file contained no usable member rows.",
        variant: "destructive",
        duration: 12000,
      });
    } else {
      toast({
        title: "Upload complete",
        description: `Added ${inserted} member${inserted === 1 ? "" : "s"}${skipped > 0 ? `, skipped ${skipped}.\n${reasons}` : "."}`,
        variant: skipped > 0 ? "default" : "success",
        duration: skipped > 0 ? 10000 : 4000,
      });
    }
  };

  // ============================================
// 1. DIRECT UPLOAD - upload-excel endpoint
// ============================================
// PolicyRate prices with the scheme's saved rate; FixedRate needs one typed in here.
const pricingError = (): string | null => {
  if (pricingMode === "FixedRate") {
    return Number(fixedPremiumRate) > 0 ? null : "Enter a Fixed Premium Rate greater than 0.";
  }
  return policyRatePercent && policyRatePercent > 0
    ? null
    : "This scheme has no Premium Rate% set. Set it on the scheme's edit page, or use FixedRate.";
};

const handleUploadExcel = async () => {
  const rateProblem = pricingError();
  if (rateProblem) {
    toast({ title: "Premium rate required", description: rateProblem, variant: "destructive" });
    return;
  }

  if (!selectedFile) {
    toast({
      title: "No file",
      description: "Please select a file to upload",
      variant: "destructive",
    });
    return;
  }

  if (!policyNo) {
    toast({
      title: "Error",
      description: "Policy number is required",
      variant: "destructive",
    });
    return;
  }

  setUploading(true);
  setUploadMethod('direct');
  try {
    const result = await dispatch(uploadExcelMembers({
      file: selectedFile,
      policyNo: policyNo,
      endorsementNo: endorsementNo || detailData?.endorsementNo,
      bizOption: bizOption || undefined,
      pricingMode: pricingMode,
      fixedPremiumRate: pricingMode === "FixedRate" ? Number(fixedPremiumRate) : 0,
    })).unwrap();

    reportUpload(result);

    setShowDirectUploadModal(false);
    // Refresh the policy detail to get updated members
    await fetchPolicyDetail();
    setSelectedFile(null);
    setBizOption(""); // Reset BizOption after upload
    setFixedPremiumRate("");
    
  } catch (error: any) {
    console.error("Error uploading Excel:", error);
    toast({
      title: "❌ Upload Failed",
      description: error || "Failed to upload members",
      variant: "destructive",
      duration: 5000,
    });
  } finally {
    setUploading(false);
  }
};

 // ============================================
// 2. PARSE EXCEL - parse-excel endpoint
// ============================================
const handleParseExcel = async () => {
  if (!selectedFile) {
    toast({
      title: "No file",
      description: "Please select a file to parse",
      variant: "destructive",
    });
    return;
  }

  setParsing(true);
  setUploadMethod('preview');
  try {
    // ✅ Pass correct parameters to parse-excel
    const result = await dispatch(parseExcelMembers({
      file: selectedFile,
      sheetName: "Sheet1", // Optional: you can make this a selectable field
      bizOption: bizOption || undefined,
    })).unwrap();
    
    console.log("📊 Parse Result:", result);
    
    // ✅ Handle the response - the API returns the parsed data directly
    // The response should contain the parsed rows
    const parsedRows = result.rows || result.payload?.rows || result.data || [];
    const warnings = result.warnings || [];

    if (parsedRows.length === 0) {
      const unmapped = result.unmappedColumns?.length ? ` Unrecognised columns: ${result.unmappedColumns.join(", ")}.` : "";
      toast({
        title: "No members found",
        description: `${warnings[0] || "No member rows could be read from this file."}${unmapped}`,
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    // Store the parsed data for preview
    setParsedPayload({
      rows: parsedRows,
      warnings: warnings,
      ...result
    });
    setPreviewData(result);
    
    // Show preview dialog
    setShowPreviewDialog(true);
    
    const rowsMapped = parsedRows.length || result.rowsMapped || 0;
    
    toast({
      title: "📋 Parse Successful",
      description: `Parsed ${rowsMapped} members. Review before uploading.`,
      variant: "default",
      duration: 4000,
    });

  } catch (error: any) {
    console.error("Error parsing Excel:", error);
    toast({
      title: "❌ Parse Failed",
      description: error || "Failed to parse Excel file",
      variant: "destructive",
      duration: 5000,
    });
  } finally {
    setParsing(false);
  }
};

// ============================================
// 3. BULK UPLOAD - bulk endpoint (after preview)
// ============================================
const handleConfirmUpload = async () => {
  const rateProblem = pricingError();
  if (rateProblem) {
    toast({ title: "Premium rate required", description: rateProblem, variant: "destructive" });
    return;
  }

  if (!parsedPayload || !parsedPayload.rows || parsedPayload.rows.length === 0) {
    toast({
      title: "No data",
      description: "No members to upload. Parse an Excel file first.",
      variant: "destructive",
    });
    return;
  }

  if (!policyNo) {
    toast({
      title: "Error",
      description: "Policy number is required",
      variant: "destructive",
    });
    return;
  }

  setUploading(true);
  try {
    // parse-excel already returns rows in the shape members/bulk expects
    // (customerName, disbursementAmount, dateOfBirth, ...), so send them through unchanged.
    const result = await dispatch(bulkUploadMembers({
      policyNo: policyNo,
      endorsementNo: endorsementNo || detailData?.endorsementNo,
      rows: parsedPayload.rows,
      bizOption: bizOption || undefined,
      pricingMode: pricingMode,
      fixedPremiumRate: pricingMode === "FixedRate" ? Number(fixedPremiumRate) : 0,
    })).unwrap();

    // ✅ Use the correct response fields
    const insertedCount = result.insertedCount || 0;
    const skippedCount = result.skippedCount || 0;
    const totalMembers = result.aggregate?.memberCount || insertedCount;

    reportUpload(result);

    // Refresh the policy detail to get updated members
    await fetchPolicyDetail();
    
    // Reset states
    setSelectedFile(null);
    setParsedPayload(null);
    setPreviewData(null);
    setShowPreviewDialog(false);
    setBizOption("");
    
  } catch (error: any) {
    console.error("Error uploading members:", error);
    toast({
      title: "❌ Upload Failed",
      description: error || "Failed to upload members",
      variant: "destructive",
      duration: 5000,
    });
  } finally {
    setUploading(false);
  }
};

  const handleBack = () => {
    // back to the scheme's Group Life Detail tab (the list of sections the members belong to)
    navigate(policyNo ? schemeUrl(policyNo, 'group-life') : -1 as any);
  };

  // If no policy number, show error
  if (!policyNo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Invalid Policy</h2>
          <p className="text-gray-600">No policy number provided</p>
          <Button onClick={handleBack} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (loadingDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600 font-medium">Loading member details...</p>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalSumInsured = members.reduce((sum, m) => sum + (m.sumInsured || 0), 0);
  const totalPremium = members.reduce((sum, m) => sum + (m.premium || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={handleBack}
            className="bg-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Schemes
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Member Management
          </h1>
          <div className="w-24"></div>
        </div>

        {/* Policy Header Card */}
        <Card className="mb-6 bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {formData.insuredName || "N/A"}
                </h2>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                  <span>
                    <span className="font-medium">Policy No:</span>{" "}
                    {formData.policyNo || "N/A"}
                  </span>
                  {formData.endorsementNo && (
                    <span>
                      <span className="font-medium">Endorsement No:</span>{" "}
                      {formData.endorsementNo}
                    </span>
                  )}
                  <span>
                    <span className="font-medium">Entry Date:</span>{" "}
                    {formatDateDisplay(formData.entryDate)}
                  </span>
                  
                  <span>
                    <span className="font-medium">Expiry Date:</span>{" "}
                    {formatDateDisplay(formData.expiryDate)}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPolicyDetail}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Policy Info Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-300 hover:bg-blue-50/30 cursor-default group animate-slide-up [animation-delay:100ms]">
    <p className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">Policy No</p>
    <p className="font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">{formData.policyNo || "N/A"}</p>
  </div>
  
  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-300 hover:bg-blue-50/30 cursor-default group animate-slide-up [animation-delay:200ms]">
    <p className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">Insured Name</p>
    <p className="font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">{formData.insuredName || "N/A"}</p>
  </div>
  
  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-300 hover:bg-blue-50/30 cursor-default group animate-slide-up [animation-delay:300ms]">
    <p className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">Our Share (%)</p>
    <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{formData.ourShare || 100}%</p>
  </div>
  
  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-300 hover:bg-blue-50/30 cursor-default group animate-slide-up [animation-delay:400ms]">
    <p className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">Total Members</p>
    <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{members.length}</p>
  </div>
</div>

       {/* Upload Excel Section - Updated with BizOption */}
<Card className="mb-6">
  <CardHeader className="border-b bg-gray-50">
    <CardTitle className="text-base font-semibold">Upload Data From Excel</CardTitle>
    <p className="text-sm text-gray-500 mt-1">
      Choose upload method: Direct upload or Parse & Preview before saving
    </p>
  </CardHeader>
  <CardContent className="p-6">
    <div className="flex flex-col gap-4">
      {/* File input + BizOption row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Label className="text-sm text-gray-600 mb-1 block">Excel File</Label>
          <Input
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="w-full"
          />
        </div>
        {/* <div>
          <Label className="text-sm text-gray-600 mb-1 block">Biz Option</Label>
          <select
            value={bizOption}
            onChange={(e) => setBizOption(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select Biz Option</option>
            <option value="GL">GL - Group Life</option>
            <option value="GPA">GPA - Group Personal Accident</option>
            <option value="GHS">GHS - Group Health Scheme</option>
            <option value="GTL">GTL - Group Term Life</option>
            <option value="Credit">Credit Life</option>
            <option value="Mortgage">Mortgage Protection</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">Optional: Specify business option for this upload</p>
        </div> */}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex flex-wrap gap-2">
          {/* 1. Parse & Preview Button */}
          <Button
            onClick={handleParseExcel}
            disabled={parsing || !selectedFile || uploading}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 whitespace-nowrap"
          >
            {parsing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Parsing...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Parse & Preview
              </>
            )}
          </Button>

          {/* 2. Confirm Upload Button (enabled after parsing) */}
          <Button
            onClick={handleConfirmUpload}
            disabled={uploading || !parsedPayload || parsedPayload.rows?.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
          >
            {uploading && uploadMethod === 'preview' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Confirm Upload
              </>
            )}
          </Button>

          {/* 3. Direct Upload Button */}
          <Button
            onClick={() => {
              if (!selectedFile) {
                toast({
                  title: "No file",
                  description: "Please select an Excel or CSV file first",
                  variant: "destructive",
                });
                return;
              }
              setShowDirectUploadModal(true);
            }}
            disabled={uploading || !selectedFile || parsing}
            className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
          >
            {uploading && uploadMethod === 'direct' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Direct
              </>
            )}
          </Button>

        </div>
      </div>

      {/* Upload Method Info */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span>Parse & Preview: Review before saving</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>Upload Direct: Parse and save in one step</span>
        </div>
        
      </div>
    </div>
  </CardContent>
</Card>

        {/* Member Management Table */}
        <Card>
          <CardHeader className="border-b bg-gray-50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Member Details</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Manage members for policy {policyNo}
                  {endorsementNo && <> — endorsement {endorsementNo}</>}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintCertificate}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Printer className="w-4 h-4 mr-1" />
                  Print Certificate
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <MemberManagementTable
              members={members}
              onAddMember={handleAddMember}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
              groupFactorAmount={1000}
              policyNo={policyNo}
              endorsementNo={formData?.endorsementNo || detailData?.endorsementNo || endorsementNo || location.state?.endorsementNo || ""}
              readOnly={false}
              coverStartDate={detailData?.startDate || formData?.startDate}
            />
          </CardContent>
        </Card>
      </div>

      {/* ============================================
          PREVIEW DIALOG - Shows parsed data before saving
          ============================================ */}
      <ButtonDismissDialog 
        open={showPreviewDialog} 
        onOpenChange={() => setShowPreviewDialog(false)}
        maxWidth="1200px"
      >
        <DialogHeader className="pr-12">
          <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span>Preview Parsed Data</span>
            {previewData?.rowsMapped && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {previewData.rowsMapped} members found
              </span>
            )}
          </DialogTitle>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Review the data below before confirming the upload.
          </p>
        </DialogHeader>

        {parsedPayload && parsedPayload.rows && (
          <>
            <DialogContent className="p-4 sm:p-6 space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="relative bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-3 sm:p-4 border border-blue-200 shadow-sm">
                  <p className="text-xs font-medium text-blue-600">Total Members</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-900 mt-1">
                    {parsedPayload.rows.length}
                  </p>
                </div>

                <div className="relative bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-3 sm:p-4 border border-green-200 shadow-sm">
                  <p className="text-xs font-medium text-green-600">Total Sum Insured</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-900 mt-1 truncate" title={formatCurrency(parsedPayload.rows.reduce((sum: number, r: any) => sum + (r.sumInsured || r.disbursementAmount || 0), 0))}>
                    {formatCurrency(
                      parsedPayload.rows.reduce((sum: number, r: any) => 
                        sum + (r.sumInsured || r.disbursementAmount || 0), 0
                      )
                    )}
                  </p>
                </div>

                <div className="relative bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-3 sm:p-4 border border-purple-200 shadow-sm">
                  <p className="text-xs font-medium text-purple-600">Total Premium</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-900 mt-1 truncate" title={formatCurrency(parsedPayload.rows.reduce((sum: number, r: any) => sum + (r.premium || 0), 0))}>
                    {formatCurrency(
                      parsedPayload.rows.reduce((sum: number, r: any) => 
                        sum + (r.premium || 0), 0
                      )
                    )}
                  </p>
                </div>

                <div className="relative bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg p-3 sm:p-4 border border-orange-200 shadow-sm">
                  <p className="text-xs font-medium text-orange-600">Warnings</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-900 mt-1">
                    {previewData?.warnings?.length || 0}
                  </p>
                </div>
              </div>

              {/* Warnings Section */}
              {previewData?.warnings && previewData.warnings.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Warnings</p>
                      <ul className="text-xs text-amber-700 mt-1 list-disc list-inside space-y-0.5">
                        {previewData.warnings.map((warning: string, idx: number) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto max-h-[340px] sm:max-h-[380px] overflow-y-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2.5 text-left font-semibold text-gray-700 w-12">#</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-gray-700">Customer No</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-gray-700">Customer Name</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-gray-700">Gender</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-gray-700">Date of Birth</th>
                        <th className="px-3 py-2.5 text-right font-semibold text-gray-700">Amount</th>
                        <th className="px-3 py-2.5 text-right font-semibold text-gray-700">Premium</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedPayload.rows.slice(0, 20).map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                          <td className="px-3 py-2 text-gray-500 font-mono text-xs">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium text-gray-900">{row.customerNo || '—'}</td>
                          <td className="px-3 py-2 text-gray-800">{row.customerName || row.surname || '—'}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              row.sex === 'Male' || row.gender === 'Male' 
                                ? 'bg-blue-100 text-blue-800' 
                                : row.sex === 'Female' || row.gender === 'Female'
                                ? 'bg-pink-100 text-pink-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {row.sex || row.gender || '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{formatDateDisplay(row.dateOfBirth || row.dobDate)}</td>
                          <td className="px-3 py-2 text-right font-medium text-blue-700 whitespace-nowrap">
                            {formatCurrency(row.sumInsured || row.disbursementAmount || 0)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-green-700 whitespace-nowrap">
                            {formatCurrency(row.premium || 0)}
                          </td>
                        </tr>
                      ))}
                      {parsedPayload.rows.length > 20 && (
                        <tr>
                          <td colSpan={7} className="px-3 py-2.5 text-center text-gray-500 text-xs sm:text-sm bg-gray-50/50">
                            ... and {parsedPayload.rows.length - 20} more members
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </DialogContent>

            {/* Sticky Footer Actions - Always visible on any screen size */}
            <DialogFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Total: <strong className="text-gray-900">{parsedPayload.rows.length}</strong> members ready to upload</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPreviewDialog(false);
                    setParsedPayload(null);
                    setPreviewData(null);
                  }}
                  className="flex-1 sm:flex-none"
                >
                  <X className="w-4 h-4 mr-1.5" />
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmUpload}
                  disabled={uploading}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1.5" />
                      Confirm & Upload ({parsedPayload.rows.length})
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </ButtonDismissDialog>

      {/* Direct Upload Options Modal */}
      <ButtonDismissDialog
        open={showDirectUploadModal}
        onOpenChange={() => setShowDirectUploadModal(false)}
        maxWidth="480px"
      >
        <DialogHeader className="pr-12">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-600" />
            Direct Upload Configuration
          </DialogTitle>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Configure pricing options before uploading members.
          </p>
        </DialogHeader>

        <DialogContent className="p-4 sm:p-6 space-y-4">
          {selectedFile && (
            <div className="p-3 bg-gray-50 rounded-md border border-gray-200 text-xs text-gray-600">
              <p className="font-semibold text-gray-800">File: {selectedFile.name}</p>
              <p className="text-gray-500">Policy: {policyNo}</p>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium text-gray-700 block mb-1">
              Pricing Mode
            </Label>
            <select
              value={pricingMode}
              onChange={(e) => setPricingMode(e.target.value as "PolicyRate" | "FixedRate")}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="PolicyRate">PolicyRate</option>
              <option value="FixedRate">FixedRate</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {pricingMode === "PolicyRate"
                ? "Uses the Premium Rate% saved on the scheme."
                : "Applies a uniform fixed rate across all members."}
            </p>
          </div>

          {pricingMode === "PolicyRate" ? (
            <div>
              <Label className="text-sm font-medium text-gray-700 block mb-1">
                Scheme Premium Rate
              </Label>
              <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                {policyRatePercent != null ? `${policyRatePercent}%` : "Not set"}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {policyRatePercent != null
                  ? "Change it on the scheme's edit page."
                  : "Set a Premium Rate% on the scheme before uploading with PolicyRate."}
              </p>
            </div>
          ) : (
            <div>
              <Label className="text-sm font-medium text-gray-700 block mb-1">
                Fixed Premium Rate
              </Label>
              <Input
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 5"
                value={fixedPremiumRate}
                onChange={(e) => setFixedPremiumRate(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Specify the fixed premium rate as a percentage (e.g., 5 for 5%).
              </p>
            </div>
          )}
        </DialogContent>

        <DialogFooter className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDirectUploadModal(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUploadExcel}
            disabled={uploading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </ButtonDismissDialog>
    </div>
  );
};

export default MemberDetailPage;