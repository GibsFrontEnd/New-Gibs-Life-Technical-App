// src/components/groupLife/MemberDetailPage.tsx
// @ts-nocheck

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  DollarSign,
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
  DialogContent
} from "../UI/new-dialog";

const MemberDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const policyNo = id ? decodeURIComponent(id) : "";
  const navigate = useNavigate();
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
  
  // New states for parse & preview workflow
  const [parsedPayload, setParsedPayload] = useState<any>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [uploadMethod, setUploadMethod] = useState<'direct' | 'preview'>('direct');

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
      
      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/policyNo/detail?policyNo=${encodeURIComponent(policyNo)}`,
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
      
      setFormData({
        policyNo: data.policyNo || policyNo,
        insuredName: data.insuredName || "N/A",
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

      if (data.members) {
        setMembers(data.members);
      }

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
  }, [policyNo]);

  // Sync with Redux members when they change
  useEffect(() => {
    if (currentMembers && currentMembers.length > 0) {
      setMembers(currentMembers);
    }
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

  // ============================================
  // 1. DIRECT UPLOAD - upload-excel endpoint
  // ============================================
  const handleUploadExcel = async () => {
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
        policyNo: policyNo
      })).unwrap();

      toast({
        title: "✅ Upload Successful",
        description: `Uploaded ${result.insertedCount || 0} members successfully`,
        variant: "default",
        duration: 4000,
      });

      // Refresh the policy detail to get updated members
      await fetchPolicyDetail();
      setSelectedFile(null);
      
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
      const result = await dispatch(parseExcelMembers(selectedFile)).unwrap();
      
      console.log("📊 Parse Result:", result);
      
      // Store the parsed data for preview
      setParsedPayload(result.payload || result);
      setPreviewData(result);
      
      // Show preview dialog
      setShowPreviewDialog(true);
      
      const rowsMapped = result.rowsMapped || result.payload?.rows?.length || 0;
      
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
      // Prepare the payload for bulk upload
      const bulkPayload = {
        policyNo: policyNo,
        members: parsedPayload.rows.map((row: any) => ({
          ...row,
          // Map fields to match the API expectations
          surname: row.surname || row.customerName?.split(' ')[0] || '',
          otherNames: row.otherNames || row.customerName?.split(' ').slice(1).join(' ') || '',
          dateOfBirth: row.dateOfBirth || row.dobDate || '',
          sex: row.sex || row.gender || '',
          basicSalary: row.basicSalary || row.salary || 0,
          sumInsured: row.sumInsured || row.disbursementAmount || 0,
          premium: row.premium || 0,
        }))
      };

      const result = await dispatch(bulkUploadMembers({
        policyNo: policyNo,
        members: bulkPayload.members
      })).unwrap();

      toast({
        title: "✅ Upload Successful",
        description: `Added ${result.insertedCount || 0} members successfully`,
        variant: "default",
        duration: 4000,
      });

      // Refresh the policy detail to get updated members
      await fetchPolicyDetail();
      
      // Reset states
      setSelectedFile(null);
      setParsedPayload(null);
      setPreviewData(null);
      setShowPreviewDialog(false);
      
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
    navigate(-1);
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
                  <span>
                    <span className="font-medium">Entry Date:</span>{" "}
                    {formatDateDisplay(formData.entryDate)}
                  </span>
                  <span>
                    <span className="font-medium">Start Date:</span>{" "}
                    {formatDateDisplay(formData.startDate)}
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

        {/* Upload Excel Section - Updated with 3 options */}
        <Card className="mb-6">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-base font-semibold">Upload Data From Excel</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Choose upload method: Direct upload or Parse & Preview before saving
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1 w-full">
                  <Input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full"
                  />
                 
                </div>
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
                    onClick={handleUploadExcel}
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
              readOnly={false}
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
        height="90vh"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            Preview Parsed Data
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Review the data below before confirming the upload.
            {previewData?.rowsMapped && (
              <span className="ml-2 font-medium text-blue-600">
                {previewData.rowsMapped} members found
              </span>
            )}
          </p>
        </DialogHeader>

        <DialogContent className="p-6 space-y-4">
          {/* Summary Cards */}
          {parsedPayload && parsedPayload.rows && (
            <>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <div className="relative bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-4 border border-blue-200 hover:shadow-xl hover:border-blue-400 transition-all duration-300 cursor-default group overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/0 to-blue-400/0 group-hover:from-blue-400/10 group-hover:via-blue-400/5 group-hover:to-blue-400/10 transition-all duration-500"></div>
    <div className="relative z-10">
      <p className="text-xs font-medium text-blue-600 group-hover:text-blue-700 transition-colors">Total Members</p>
      <p className="text-2xl font-bold text-blue-800 group-hover:text-blue-900 transition-colors">
        {parsedPayload.rows.length}
      </p>
    </div>
  </div>

  <div className="relative bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-4 border border-green-200 hover:shadow-xl hover:border-green-400 transition-all duration-300 cursor-default group overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/0 to-green-400/0 group-hover:from-green-400/10 group-hover:via-green-400/5 group-hover:to-green-400/10 transition-all duration-500"></div>
    <div className="relative z-10">
      <p className="text-xs font-medium text-green-600 group-hover:text-green-700 transition-colors">Total Sum Insured</p>
      <p className="text-2xl font-bold text-green-800 group-hover:text-green-900 transition-colors">
        {formatCurrency(
          parsedPayload.rows.reduce((sum: number, r: any) => 
            sum + (r.sumInsured || r.disbursementAmount || 0), 0
          )
        )}
      </p>
    </div>
  </div>

  <div className="relative bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-4 border border-purple-200 hover:shadow-xl hover:border-purple-400 transition-all duration-300 cursor-default group overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/0 to-purple-400/0 group-hover:from-purple-400/10 group-hover:via-purple-400/5 group-hover:to-purple-400/10 transition-all duration-500"></div>
    <div className="relative z-10">
      <p className="text-xs font-medium text-purple-600 group-hover:text-purple-700 transition-colors">Total Premium</p>
      <p className="text-2xl font-bold text-purple-800 group-hover:text-purple-900 transition-colors">
        {formatCurrency(
          parsedPayload.rows.reduce((sum: number, r: any) => 
            sum + (r.premium || 0), 0
          )
        )}
      </p>
    </div>
  </div>

  <div className="relative bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg p-4 border border-orange-200 hover:shadow-xl hover:border-orange-400 transition-all duration-300 cursor-default group overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-orange-400/0 to-orange-400/0 group-hover:from-orange-400/10 group-hover:via-orange-400/5 group-hover:to-orange-400/10 transition-all duration-500"></div>
    <div className="relative z-10">
      <p className="text-xs font-medium text-orange-600 group-hover:text-orange-700 transition-colors">Warnings</p>
      <p className="text-2xl font-bold text-orange-800 group-hover:text-orange-900 transition-colors">
        {previewData?.warnings?.length || 0}
      </p>
    </div>
  </div>
</div>

              {/* Warnings Section */}
              {previewData?.warnings && previewData.warnings.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-800">Warnings</p>
                      <ul className="text-xs text-yellow-700 mt-1 list-disc list-inside">
                        {previewData.warnings.map((warning: string, idx: number) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">#</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Customer No</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Customer Name</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Gender</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Date of Birth</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-700">Amount</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-700">Premium</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedPayload.rows.slice(0, 20).map((row: any, idx: number) => (
                        <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium">{row.customerNo || '—'}</td>
                          <td className="px-3 py-2">{row.customerName || row.surname || '—'}</td>
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
                          <td className="px-3 py-2">{formatDateDisplay(row.dateOfBirth || row.dobDate)}</td>
                          <td className="px-3 py-2 text-right font-medium text-blue-700">
                            {formatCurrency(row.sumInsured || row.disbursementAmount || 0)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-green-700">
                            {formatCurrency(row.premium || 0)}
                          </td>
                        </tr>
                      ))}
                      {parsedPayload.rows.length > 20 && (
                        <tr>
                          <td colSpan={7} className="px-3 py-2 text-center text-gray-500 text-sm">
                            ... and {parsedPayload.rows.length - 20} more members
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Total: {parsedPayload.rows.length} members ready to upload</span>
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
                    <X className="w-4 h-4 mr-2" />
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
                        <Save className="w-4 h-4 mr-2" />
                        Confirm & Upload ({parsedPayload.rows.length} members)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </ButtonDismissDialog>
    </div>
  );
};

export default MemberDetailPage;