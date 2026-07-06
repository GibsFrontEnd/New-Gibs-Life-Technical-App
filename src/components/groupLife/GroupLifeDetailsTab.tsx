// src/components/groupLife/GroupLifeDetailsTab.tsx
// @ts-nocheck

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../UI/card";
import { Button } from "../UI/new-button";
import { useToast } from "../UI/use-toast";
import { SERVER_URL } from "../../utils/constants";
import { useNavigate } from "react-router-dom";
import MemberManagementTable from "./MemberManagementTable";
import type { GroupLifeMember } from "../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";
import { Loader2, Plus, Trash2, Printer, FileText, Building2, Users, Calendar, ChevronLeft, ChevronRight, FileCheck, Send } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../UI/table";
import { formatDate, formatCurrency } from "../../utils/ui-utilities";
import { Badge } from "../UI/badge";

interface GroupLifeDetailsTabProps {
  policyNo: string;
  formData: any;
  members: GroupLifeMember[];
  setMembers: (members: GroupLifeMember[]) => void;
}

interface PolicyDetailItem {
  detailID: number;
  policyNo: string;
  endorsementNo: string;
  certOrDocNo: string;
  insuredName: string;
  created: boolean;
  sumInsured?: number;
  premium?: number;
  transDate?: string;
}

const GroupLifeDetailsTab: React.FC<GroupLifeDetailsTabProps> = ({ 
  policyNo, 
  formData, 
  members, 
  setMembers 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [detailData, setDetailData] = useState<PolicyDetailItem | null>(null);
  const [creatingDetail, setCreatingDetail] = useState(false);
  const [policyDetails, setPolicyDetails] = useState<PolicyDetailItem[]>([]);

  // Fetch group life details
  const fetchDetail = async () => {
    if (!policyNo) return;

    setLoading(true);
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
          await createDetail();
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setDetailData(data);
      
      const detailItem: PolicyDetailItem = {
        detailID: data.detailID,
        policyNo: data.policyNo || policyNo,
        endorsementNo: data.endorsementNo || "[AUTO]",
        certOrDocNo: data.certOrDocNo || "N/A",
        insuredName: data.insuredName || formData?.clientName || "N/A",
        created: data.created || false,
        sumInsured: formData?.totalSumInsured || 0,
        premium: formData?.totalPremium || 0,
        transDate: formData?.transactionDate || new Date().toISOString(),
      };
      setPolicyDetails([detailItem]);
      
      if (data.members) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error("Error fetching detail:", error);
      toast({
        title: "Error",
        description: "Failed to load group life details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

 // Handle row click - navigate to member detail page
const handleRowClick = (item: PolicyDetailItem) => {
 
  
  const encodedPolicyNo = encodeURIComponent(item.policyNo);

  
  const path = `/underwriting/group-life-quotations/members/${encodedPolicyNo}`;

  
  // Check if the path is correctly formed
  console.log("✅ Path starts with /underwriting/group-life-quotations/members/:", 
    path.startsWith("/underwriting/group-life-quotations/members/"));
  
  navigate(path);
  console.log("🔄 Navigate called with:", path);
};

  // Create detail if it doesn't exist
  const createDetail = async () => {
    if (!policyNo) return;

    setCreatingDetail(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/policyNo/detail?policyNo=${encodeURIComponent(policyNo)}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setDetailData(data);
      
      toast({
        title: "Success",
        description: "Group life details created successfully",
        variant: "default",
      });

      await fetchDetail();
    } catch (error) {
      console.error("Error creating detail:", error);
      toast({
        title: "Error",
        description: "Failed to create group life details",
        variant: "destructive",
      });
    } finally {
      setCreatingDetail(false);
    }
  };

  useEffect(() => {
    if (policyNo) {
      fetchDetail();
    }
  }, [policyNo]);

  // Handle member operations
  const handleAddMember = (member: Omit<GroupLifeMember, "id">) => {
    const newMember = {
      ...member,
      id: `temp-${Date.now()}`,
    };
    setMembers([...members, newMember]);
  };

  const handleUpdateMember = (index: number, member: GroupLifeMember) => {
    const updatedMembers = [...members];
    updatedMembers[index] = member;
    setMembers(updatedMembers);
  };

  const handleDeleteMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  // Action handlers
  const handleNewDetails = () => {
    toast({
      title: "New Details",
      description: "Opening new details form...",
      variant: "default",
    });
  };

  const handleDelete = () => {
    toast({
      title: "Delete",
      description: "Delete functionality coming soon",
      variant: "default",
    });
  };

  const handleDebitNotes = () => {
    toast({
      title: "Debit Notes",
      description: "Opening debit notes...",
      variant: "default",
    });
  };

  const handleCoinsurance = () => {
    toast({
      title: "Coinsurance",
      description: "Processing coinsurance details...",
      variant: "default",
    });
  };

  const handlePrintSchedule = () => {
    toast({
      title: "Print Schedule",
      description: "Generating print schedule...",
      variant: "default",
    });
  };

  const handlePrintCoinsuranceSchedule = () => {
    toast({
      title: "Print Coinsurance Schedule",
      description: "Generating coinsurance schedule...",
      variant: "default",
    });
  };

  if (loading || creatingDetail) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600 font-medium">
          {creatingDetail ? "Creating group life details..." : "Loading group life details..."}
        </p>
      </div>
    );
  }

  // Calculate totals
  const totalSumInsured = members.reduce((sum, m) => sum + (m.sumInsured || 0), 0);
  const totalPremium = members.reduce((sum, m) => sum + (m.premium || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500 mb-1">Policy Number</p>
          <p className="font-semibold text-gray-900 truncate">{policyNo}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500 mb-1">Insured Name</p>
          <p className="font-semibold text-gray-900 truncate">{detailData?.insuredName || formData?.clientName || "N/A"}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500 mb-1">Total Members</p>
          <p className="font-semibold text-gray-900">{members?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500 mb-1">Total Sum Insured</p>
          <p className="font-semibold text-blue-700">{formatCurrency(totalSumInsured)}</p>
        </div>
      </div>

      {/* Policy Details Table */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Policy Details</h3>
              <p className="text-sm text-gray-500">
                Showing {policyDetails.length} record{policyDetails.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleNewDetails}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Policy No</TableHead>
                  <TableHead className="font-semibold text-gray-700">Endorsement Num</TableHead>
                  <TableHead className="font-semibold text-gray-700">Insured Name</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Sum Insured</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Premium</TableHead>
                  <TableHead className="font-semibold text-gray-700">Transaction Date</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policyDetails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No policy details found.</p>
                      <p className="text-sm mt-1">Click "New Details" to add a record.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  policyDetails.map((item, index) => (
                    <TableRow 
                      key={index} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(item)}
                    >
                      <TableCell className="font-medium text-gray-900">
                        {item.policyNo}
                        
                      </TableCell>
                      <TableCell className="text-gray-700">{item.endorsementNo || "[AUTO]"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{item.insuredName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-blue-700">
                        {formatCurrency(item.sumInsured || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-700">
                        {formatCurrency(item.premium || 0)}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(item.transDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={item.created ? "default" : "secondary"}
                          className={item.created 
                            ? "bg-green-100 text-green-800 hover:bg-green-200" 
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          }
                        >
                          {item.created ? "Active" : "Pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {policyDetails.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t gap-3">
              <div className="text-sm text-gray-500">
                Showing 1 to {policyDetails.length} of {policyDetails.length} entries
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled className="px-3">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="default" size="sm" className="px-4 bg-blue-600 hover:bg-blue-700 text-white">
                  1
                </Button>
                <Button variant="outline" size="sm" disabled className="px-3">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDebitNotes}
              className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
            >
              <FileCheck className="w-4 h-4 mr-1" />
              Do Debit Notes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCoinsurance}
              className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
            >
              <Send className="w-4 h-4 mr-1" />
              Process Coinsurance Details
            </Button>
          </div>

          {/* Print Buttons */}
          <div className="flex flex-wrap gap-3 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintSchedule}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              <Printer className="w-4 h-4 mr-1" />
              Print Schedule
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintCoinsuranceSchedule}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              <Printer className="w-4 h-4 mr-1" />
              Print Coinsurance Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Member Management Table */}
      {/* <Card>
        <CardContent className="p-6">
          <MemberManagementTable
            members={members}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            groupFactorAmount={Number.parseFloat(formData?.groupFactorAmount || "1000")}
            policyNo={policyNo}
            readOnly={false}
          />
        </CardContent>
      </Card> */}
    </div>
  );
};

export default GroupLifeDetailsTab;