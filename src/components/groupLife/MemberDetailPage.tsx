// src/components/groupLife/MemberDetailPage.tsx
// @ts-nocheck

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../UI/new-button";
import { Card, CardContent, CardHeader, CardTitle } from "../UI/card";
import { Input } from "../UI/new-input";
import { Label } from "../UI/label";
import { ArrowLeft, RefreshCw, Loader2, Upload, Plus, Pencil, Trash2, Printer, Users, FileText, Building2, Calendar, DollarSign } from "lucide-react";
import { useToast } from "../UI/use-toast";
import type { GroupLifeMember } from "../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";
import MemberManagementTable from "./MemberManagementTable";
import { formatDate, formatCurrency } from "../../utils/ui-utilities";
import { SERVER_URL } from "../../utils/constants";

const MemberDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const policyNo = id ? decodeURIComponent(id) : "";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [members, setMembers] = useState<GroupLifeMember[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [detailData, setDetailData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState<GroupLifeMember | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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

  const handleUploadExcel = async () => {
    if (!selectedFile) {
      toast({
        title: "No file",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("policyNo", policyNo);

      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/members/bulk/upload-excel`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: `Uploaded ${data.insertedCount || 0} members successfully`,
        variant: "default",
      });

      await fetchPolicyDetail();
      setSelectedFile(null);
    } catch (error) {
      console.error("Error uploading Excel:", error);
      toast({
        title: "Error",
        description: "Failed to upload members",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleBack = () => {
    navigate("/underwriting/group-life-quotations/policies");
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
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Policy No</p>
            <p className="font-semibold text-gray-900 truncate">{formData.policyNo || "N/A"}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Insured Name</p>
            <p className="font-semibold text-gray-900 truncate">{formData.insuredName || "N/A"}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Our Share (%)</p>
            <p className="font-semibold text-gray-900">{formData.ourShare || 100}%</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Members</p>
            <p className="font-semibold text-gray-900">{members.length}</p>
          </div>
        </div>

       

        {/* Upload Excel Section */}
        <Card className="mb-6">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-base font-semibold">Upload Data From Excel</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1 w-full">
                <Input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full"
                />
                {selectedFile && (
                  <p className="text-sm text-green-600 mt-1">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
              <Button
                onClick={handleUploadExcel}
                disabled={uploading || !selectedFile}
                className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
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
    </div>
  );
};

export default MemberDetailPage;