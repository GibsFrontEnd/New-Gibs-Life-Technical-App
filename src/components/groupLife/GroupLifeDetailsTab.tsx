// src/components/groupLife/GroupLifeDetailsTab.tsx
// @ts-nocheck

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../UI/card";
import { Button } from "../UI/new-button";
import { useToast } from "../UI/use-toast";
import { SERVER_URL } from "../../utils/constants";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import MemberManagementTable from "./MemberManagementTable";
import type { GroupLifeMember } from "../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";
import { 
  createEndorsement,
  clearEndorsement,
  selectEndorsement,
  type CreateEndorsementResponse,
  type EndorsementType
} from "../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Printer, 
  FileText, 
  Building2, 
  Users, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  FileCheck, 
  Send,
  RefreshCw,
  FilePen,
  Eye,
  CheckCircle,
  XCircle,
  Copy,
  FilePlus,
  AlertCircle,
  Undo2,
  Ban,
  MinusCircle,
  Clock,
  Layers
} from "lucide-react";
import { Checkbox } from "../UI/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../UI/dialog";
import { RadioGroup, RadioGroupItem } from "../UI/radio-group";
import { Label } from "../UI/label";

interface GroupLifeDetailsTabProps {
  policyNo: string;
  formData: any;
  members: GroupLifeMember[];
  setMembers: (members: GroupLifeMember[]) => void;
  /** The source page that led to this details view */
  sourcePage?: "scheme-admin" | "renewals" | "endorsements" | "convert-to-policy" | "convert-to-scheme";
  /** Callback when renew is clicked - DEPRECATED: Now uses Redux thunk */
  onRenew?: (item: PolicyDetailItem) => void;
  /** Callback when endorsement is clicked - DEPRECATED: Now uses Redux thunk */
  onEndorse?: (item: PolicyDetailItem) => void;
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
  // Add these new fields
  endorsementType?: string;
  completionStatus?: string;
  effectiveDate?: string;
  expiryDate?: string;
  grossPremium?: number;
  netPremium?: number;
  submittedBy?: string;
  submittedOn?: string;
}

// Add type definition for endorsement type with description
interface EndorsementTypeInfo {
  value: EndorsementType;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  borderColor: string;
  bgColor: string;
}

const GroupLifeDetailsTab: React.FC<GroupLifeDetailsTabProps> = ({ 
  policyNo, 
  formData, 
  members, 
  setMembers,
  sourcePage = "scheme-admin",
  onRenew,
  onEndorse,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  // Redux state for endorsement
  const { createdEndorsement, loading: endorsementLoading, error: endorsementError } = useAppSelector(selectEndorsement);
  
  const [detailData, setDetailData] = useState<PolicyDetailItem | null>(null);
  const [creatingDetail, setCreatingDetail] = useState(false);
  const [policyDetails, setPolicyDetails] = useState<PolicyDetailItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Local state for endorsement processing
  const [processingEndorsement, setProcessingEndorsement] = useState<string | null>(null);

  // Selection state for policy details table
  const [selectedDetailIds, setSelectedDetailIds] = useState<Set<string | number>>(new Set());

  const handleToggleSelectDetail = (id: string | number) => {
    setSelectedDetailIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllDetails = () => {
    if (selectedDetailIds.size === policyDetails.length && policyDetails.length > 0) {
      setSelectedDetailIds(new Set());
    } else {
      const allIds = policyDetails.map((item, index) => item.detailID || item.endorsementNo || index);
      setSelectedDetailIds(new Set(allIds));
    }
  };

  const handlePrintSchedule = () => {
    const selectedItems = policyDetails.filter((item, index) => {
      const id = item.detailID || item.endorsementNo || index;
      return selectedDetailIds.has(id);
    });
    console.log("Print Schedule clicked for details:", selectedItems.length > 0 ? selectedItems : policyDetails);
    toast({
      title: "Print Schedule",
      description: selectedDetailIds.size > 0
        ? `Print Schedule triggered for ${selectedDetailIds.size} selected record(s). API will be connected shortly.`
        : `Print Schedule triggered for policy ${policyNo}. API will be connected shortly.`,
    });
  };

  const handleProcessCoinsuranceDetails = () => {
    const selectedItems = policyDetails.filter((item, index) => {
      const id = item.detailID || item.endorsementNo || index;
      return selectedDetailIds.has(id);
    });
    console.log("Process Coinsurance Details clicked for details:", selectedItems.length > 0 ? selectedItems : policyDetails);
    toast({
      title: "Process Coinsurance Details",
      description: selectedDetailIds.size > 0
        ? `Process Coinsurance Details triggered for ${selectedDetailIds.size} selected record(s). API will be connected shortly.`
        : `Process Coinsurance Details triggered for policy ${policyNo}. API will be connected shortly.`,
    });
  };
  
  // ==================== ENDORSEMENT DIALOG STATE ====================
  const [endorsementDialogOpen, setEndorsementDialogOpen] = useState(false);
  const [selectedEndorsementType, setSelectedEndorsementType] = useState<EndorsementType>("Reversal");
  const [selectedItemForEndorsement, setSelectedItemForEndorsement] = useState<PolicyDetailItem | null>(null);

  // Define endorsement types with their metadata
  const endorsementTypes: EndorsementTypeInfo[] = [
    {
      value: "Reversal",
      label: "Reversal",
      icon: <Copy className="w-4 h-4" />,
      description: "Clones the source section's figures and members onto a new endorsement number and marks the source as EXPIRED.",
      color: "text-blue-600",
      borderColor: "border-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      value: "Additional",
      label: "Additional",
      icon: <FilePlus className="w-4 h-4" />,
      description: "Creates a blank envelope for you to fill independently. The source is left untouched.",
      color: "text-green-600",
      borderColor: "border-green-500",
      bgColor: "bg-green-50"
    },
    {
      value: "Return",
      label: "Return",
      icon: <Undo2 className="w-4 h-4" />,
      description: "Process a return endorsement. Reverses the policy and returns to previous state.",
      color: "text-orange-600",
      borderColor: "border-orange-500",
      bgColor: "bg-orange-50"
    },
    {
      value: "Cancellation",
      label: "Cancellation",
      icon: <Ban className="w-4 h-4" />,
      description: "Cancel the current policy endorsement. This will terminate the policy coverage.",
      color: "text-red-600",
      borderColor: "border-red-500",
      bgColor: "bg-red-50"
    },
    {
      value: "Reduction",
      label: "Reduction",
      icon: <MinusCircle className="w-4 h-4" />,
      description: "Reduce the coverage amount or benefits under the current policy endorsement.",
      color: "text-yellow-600",
      borderColor: "border-yellow-500",
      bgColor: "bg-yellow-50"
    },
    {
      value: "Extension",
      label: "Extension",
      icon: <Clock className="w-4 h-4" />,
      description: "Extend the policy duration or coverage period for the current endorsement.",
      color: "text-purple-600",
      borderColor: "border-purple-500",
      bgColor: "bg-purple-50"
    }
  ];

  // Determine which actions to show based on source page
  const showRenewButton = sourcePage === "renewals";
  const showEndorseButton = sourcePage === "endorsements";
  const showDebitNoteButton = true;

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
      // ✅ Use actual API data
      sumInsured: data.sumInsured || 0,
      premium: data.grossPremium || data.netPremium || 0,
      transDate: data.effectiveDate || data.submittedOn || formData?.transactionDate || new Date().toISOString(),
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
    const hasEndorsement = item.endorsementNo && item.endorsementNo !== "[AUTO]";
    const endorsementQuery = hasEndorsement ? `?endorsementNo=${encodeURIComponent(item.endorsementNo)}` : "";
    const path = `/underwriting/group-life-quotations/members/${encodedPolicyNo}${endorsementQuery}`;
    console.log("🔄 Navigate called with:", path);
    navigate(path, {
      state: {
        endorsementNo: item.endorsementNo,
        detailId: item.detailID,
        policyNo: item.policyNo,
      }
    });
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
    // Clear endorsement state when component unmounts
    return () => {
      dispatch(clearEndorsement());
    };
  }, [policyNo]);

  // Monitor endorsement creation status from Redux
  useEffect(() => {
    if (createdEndorsement) {
      // Close dialog if open
      setEndorsementDialogOpen(false);
      setSelectedItemForEndorsement(null);
      
      // Success - show toast and navigate
      toast({
        title: "Success!",
        description: (
          <div>
            <p className="font-medium">New endorsement created:</p>
            <p className="text-sm text-gray-600">Endorsement: {createdEndorsement.endorsementNo}</p>
            <p className="text-sm text-gray-600">Policy: {createdEndorsement.policyNo}</p>
            <p className="text-sm text-gray-600">Insured: {createdEndorsement.insuredName}</p>
          </div>
        ),
        variant: "default",
        duration: 5000,
      });
      
      // Navigate to the new endorsement details
      const encodedPolicyNo = encodeURIComponent(createdEndorsement.policyNo);
     
      
      // Clear processing state
      setProcessingEndorsement(null);
    }
    
    if (endorsementError) {
      // Close dialog if open
      setEndorsementDialogOpen(false);
      setSelectedItemForEndorsement(null);
      
      toast({
        title: "Error",
        description: endorsementError,
        variant: "destructive",
      });
      setProcessingEndorsement(null);
    }
  }, [createdEndorsement, endorsementError, navigate, toast]);

  // ==================== ACTION HANDLERS ====================

  /**
   * ✅ UPDATED: Handle Debit Note navigation
   * Navigates to the DebitNote component with the policy number
   */
 const handleDebitNote = (item: PolicyDetailItem) => {
    console.log('🔴 Navigate to DebitNote with:', {
        policyNo: item.policyNo,
        detailID: item.detailID,
        endorsementNo: item.endorsementNo,
        insuredName: item.insuredName,
        sourcePage: "group-life-details"
    });
    
    const encodedPolicyNo = encodeURIComponent(item.policyNo);
    navigate(`/underwriting/group-life-quotations/debit-note/${encodedPolicyNo}`, {
        state: {
            detailID: item.detailID,
            detailId: item.detailID, // ← Add this for compatibility
            endorsementNo: item.endorsementNo,
            insuredName: item.insuredName,
            sourcePage: "group-life-details",
            policyNo: item.policyNo,  // ← Also pass policyNo in state
            mode: 'add',
            returnTo: location.pathname + location.search 
        }
    });
};

  /**
   * Handle Renew using the Redux thunk
   * This calls the POST endpoint with type = "Renewal"
   */
  const handleRenew = async (item: PolicyDetailItem) => {
    // Prevent duplicate clicks
    if (processingEndorsement === item.endorsementNo) return;
    
    // Check if we have a valid endorsement number
    if (!item.endorsementNo || item.endorsementNo === "[AUTO]") {
      toast({
        title: "Error",
        description: "Cannot renew: No valid endorsement number found. Please ensure the policy has been properly created.",
        variant: "destructive",
      });
      return;
    }

    setProcessingEndorsement(item.endorsementNo);

    try {
      console.log(`🔄 Creating RENEWAL endorsement from ${item.endorsementNo} for policy ${item.policyNo}`);
      
      // Dispatch the Redux thunk
      const resultAction = await dispatch(createEndorsement({
        policyNo: item.policyNo,
        sourceEndorsementNo: item.endorsementNo,
        type: "Renewal" as EndorsementType,
      }));
      
      // Check if the action was rejected
      if (createEndorsement.rejected.match(resultAction)) {
        throw new Error(resultAction.payload as string || "Failed to create renewal endorsement");
      }
      
    } catch (error: any) {
      console.error("❌ Renewal failed:", error);
      toast({
        title: "Renewal Failed",
        description: error.message || "An error occurred while processing the renewal",
        variant: "destructive",
      });
      setProcessingEndorsement(null);
    }
  };

  /**
   * ✅ UPDATED: Open dialog to select endorsement type
   * This gives the user a choice between all available endorsement types
   */
  const handleEndorseClick = (item: PolicyDetailItem) => {
    // Check if we have a valid endorsement number
    if (!item.endorsementNo || item.endorsementNo === "[AUTO]") {
      toast({
        title: "Error",
        description: "Cannot endorse: No valid endorsement number found. Please ensure the policy has been properly created.",
        variant: "destructive",
      });
      return;
    }

    // Set the selected item and open the dialog
    setSelectedItemForEndorsement(item);
    setSelectedEndorsementType("Reversal"); // Default selection
    setEndorsementDialogOpen(true);
  };

  /**
   * Handle the actual endorsement creation after user selects the type
   */
  const handleEndorseConfirm = async () => {
    if (!selectedItemForEndorsement) return;
    
    // Prevent duplicate clicks
    if (processingEndorsement === selectedItemForEndorsement.endorsementNo) return;

    setProcessingEndorsement(selectedItemForEndorsement.endorsementNo);

    try {
      console.log(`📝 Creating ${selectedEndorsementType} endorsement from ${selectedItemForEndorsement.endorsementNo} for policy ${selectedItemForEndorsement.policyNo}`);
      
      // Dispatch the Redux thunk with the selected type
      const resultAction = await dispatch(createEndorsement({
        policyNo: selectedItemForEndorsement.policyNo,
        sourceEndorsementNo: selectedItemForEndorsement.endorsementNo,
        type: selectedEndorsementType,
      }));
      
      // Check if the action was rejected
      if (createEndorsement.rejected.match(resultAction)) {
        throw new Error(resultAction.payload as string || `Failed to create ${selectedEndorsementType} endorsement`);
      }
      
      // The useEffect will handle the success case with the createdEndorsement state
      
    } catch (error: any) {
      console.error(`❌ ${selectedEndorsementType} failed:`, error);
      toast({
        title: "Endorsement Failed",
        description: error.message || "An error occurred while processing the endorsement",
        variant: "destructive",
      });
      setProcessingEndorsement(null);
      setEndorsementDialogOpen(false);
    }
  };

  // Handle Print for a specific detail
  const handlePrint = (item: PolicyDetailItem) => {
    toast({
      title: "Print",
      description: `Printing schedule for policy ${item.policyNo}`,
      variant: "default",
    });
  };

  // Handle Delete for a specific detail
  const handleDelete = (item: PolicyDetailItem) => {
    toast({
      title: "Delete",
      description: `Delete policy ${item.policyNo}`,
      variant: "destructive",
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

  // Check if a specific row is processing
  const isProcessing = (endorsementNo: string) => processingEndorsement === endorsementNo;

  // Get the selected endorsement type metadata
  const getSelectedTypeInfo = () => {
    return endorsementTypes.find(type => type.value === selectedEndorsementType);
  };

  return (
    <div className="space-y-6">
      {/* ==================== HEADER WITH SOURCE INDICATOR ==================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Policy Details
           
          </h2>
          <p className="text-sm text-gray-500">
            Policy: {policyNo} 
          </p>
        </div>
        
      </div>

      {/* ==================== POLICY DETAILS TABLE ==================== */}
      <Card>
        <CardContent className="p-6">
          {/* Action Toolbar - Always visible */}
          <div className="mb-4 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {selectedDetailIds.size > 0 ? (
                <>
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {selectedDetailIds.size} {selectedDetailIds.size === 1 ? 'record' : 'records'} selected
                  </span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">
                    Policy Details Actions
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePrintSchedule}
                disabled={selectedDetailIds.size === 0}
                variant="outline"
                size="sm"
                className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Print Schedule
              </Button>
              <Button
                onClick={handleProcessCoinsuranceDetails}
                disabled={selectedDetailIds.size === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                size="sm"
              >
                <Layers className="w-4 h-4 mr-1.5" />
                Process Coinsurance Details
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedDetailIds.size === policyDetails.length && policyDetails.length > 0}
                      onCheckedChange={handleSelectAllDetails}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">Policy No</TableHead>
                  <TableHead className="font-semibold text-gray-700">Endorsement Num</TableHead>
                  <TableHead className="font-semibold text-gray-700">Insured Name</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Sum Insured</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Premium</TableHead>
                  <TableHead className="font-semibold text-gray-700">Transaction Date</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  {/* ==================== ACTIONS COLUMN ==================== */}
                  <TableHead className="font-semibold text-gray-700 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policyDetails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No policy details found.</p>
                      <p className="text-sm mt-1">Click "New Details" to add a record.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  policyDetails.map((item, index) => {
                    const isItemProcessing = isProcessing(item.endorsementNo);
                    const rowId = item.detailID || item.endorsementNo || index;
                    const isSelected = selectedDetailIds.has(rowId);
                    
                    return (
                      <TableRow 
                        key={index} 
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/50' : ''}`}
                        onClick={() => handleRowClick(item)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleSelectDetail(rowId)}
                            className="data-[state=checked]:bg-blue-600"
                          />
                        </TableCell>
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
                        {/* ==================== ACTIONS PER ROW ==================== */}
                        <TableCell>
                          <div className="flex flex-wrap items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                            
                            {/* Renew Button - Only show if coming from Renewals page */}
                            {showRenewButton && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRenew(item)}
                                disabled={isItemProcessing || endorsementLoading}
                                className={`h-7 px-2 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800 text-xs ${
                                  isItemProcessing ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                title="Renew Policy"
                              >
                                {isItemProcessing ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                    Renew
                                  </>
                                )}
                              </Button>
                            )}

                            {/* Endorse Button - Opens dialog for type selection */}
                            {showEndorseButton && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEndorseClick(item)}
                                disabled={isItemProcessing || endorsementLoading}
                                className={`h-7 px-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800 text-xs ${
                                  isItemProcessing ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                title="Create Endorsement"
                              >
                                {isItemProcessing ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <FilePen className="w-3 h-3 mr-1" />
                                    Endorse
                                  </>
                                )}
                              </Button>
                            )}

                            {/* ✅ UPDATED: Debit Note Button - Navigates to DebitNote component */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDebitNote(item)}
                              className="h-7 px-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 text-xs"
                              title="Create Debit Note"
                            >
                              <FileCheck className="w-3 h-3 mr-1" />
                              Do Debit Note
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
        </CardContent>
      </Card>

      
      {/* ==================== ENDORSEMENT TYPE SELECTION DIALOG ==================== */}
      <Dialog 
        open={endorsementDialogOpen} 
        onOpenChange={setEndorsementDialogOpen}
      >
        <DialogContent className="p-0 gap-0 max-w-[95vw] sm:max-w-[640px] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b px-4 sm:px-6 py-3 sm:py-4 sticky top-0 bg-white z-10">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FilePen className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
              <span className="truncate">Select Endorsement Type</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-gray-600 space-y-1 pt-1">
              <p className="break-words">
                Choose the type of endorsement to create for policy{' '}
                <strong className="break-all">{selectedItemForEndorsement?.policyNo}</strong>
              </p>
              <p className="text-xs text-gray-500 flex flex-wrap items-center gap-1">
                Source Endorsement: <span className="font-mono break-all">{selectedItemForEndorsement?.endorsementNo}</span>
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="px-4 sm:px-6 py-4 sm:py-5">
            <RadioGroup
              value={selectedEndorsementType}
              onValueChange={(value) => setSelectedEndorsementType(value as EndorsementType)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3"
            >
              {endorsementTypes.map((type) => (
                <div 
                  key={type.value}
                  className={`flex flex-col rounded-lg border-2 p-3 sm:p-4 transition-all cursor-pointer touch-manipulation ${
                    selectedEndorsementType === type.value 
                      ? `${type.borderColor} ${type.bgColor} shadow-sm` 
                      : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedEndorsementType(type.value)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedEndorsementType(type.value);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <div className={`flex items-center gap-1.5 sm:gap-2 ${type.color} min-w-0`}>
                      <span className="flex-shrink-0">{type.icon}</span>
                      <span className="font-semibold text-gray-800 text-xs sm:text-sm truncate">
                        {type.label}
                      </span>
                    </div>
                    <RadioGroupItem value={type.value} id={type.value} className="flex-shrink-0" />
                  </div>
                  <Label htmlFor={type.value} className="cursor-pointer flex-1">
                    <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">
                      {type.description}
                    </p>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {/* Info Box - Dynamic based on selected type */}
            <div className="mt-3 sm:mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 sm:gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-[11px] sm:text-xs text-amber-700">
                <p className="font-medium">What happens next:</p>
                <p className="mt-0.5 sm:mt-1 leading-relaxed">
                  {selectedEndorsementType === "Reversal" && 
                    "A new endorsement will be created with all members and figures from the source. The source endorsement will be marked as EXPIRED."}
                  {selectedEndorsementType === "Additional" && 
                    "A blank endorsement envelope will be created. You'll need to add members and figures manually."}
                  {selectedEndorsementType === "Return" && 
                    "A return endorsement will be processed. This will reverse the policy and return to the previous state."}
                  {selectedEndorsementType === "Cancellation" && 
                    "A cancellation endorsement will be processed. This will terminate the policy coverage."}
                  {selectedEndorsementType === "Reduction" && 
                    "A reduction endorsement will be processed. This will reduce the coverage amount or benefits."}
                  {selectedEndorsementType === "Extension" && 
                    "An extension endorsement will be processed. This will extend the policy duration or coverage period."}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row gap-2 sticky bottom-0 bg-white">
            <Button
              variant="outline"
              onClick={() => {
                setEndorsementDialogOpen(false);
                setSelectedItemForEndorsement(null);
              }}
              className="w-full sm:w-auto order-2 sm:order-1 text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEndorseConfirm}
              disabled={processingEndorsement === selectedItemForEndorsement?.endorsementNo || endorsementLoading}
              className={`w-full sm:w-auto text-white order-1 sm:order-2 text-sm sm:text-base ${
                selectedEndorsementType === "Reversal" ? "bg-blue-600 hover:bg-blue-700" :
                selectedEndorsementType === "Additional" ? "bg-green-600 hover:bg-green-700" :
                selectedEndorsementType === "Return" ? "bg-orange-600 hover:bg-orange-700" :
                selectedEndorsementType === "Cancellation" ? "bg-red-600 hover:bg-red-700" :
                selectedEndorsementType === "Reduction" ? "bg-yellow-600 hover:bg-yellow-700" :
                "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {processingEndorsement === selectedItemForEndorsement?.endorsementNo ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
                  <span className="truncate">Creating...</span>
                </>
              ) : (
                <>
                  <span className="flex-shrink-0">{getSelectedTypeInfo()?.icon}</span>
                  <span className="ml-1.5 sm:ml-2 truncate">
                    Create {selectedEndorsementType} Endorsement
                  </span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success banner when endorsement is created */}
      {createdEndorsement && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-green-800">Endorsement Created Successfully</h4>
            <p className="text-sm text-green-700">
              New endorsement <strong>{createdEndorsement.endorsementNo}</strong> has been created for policy {createdEndorsement.policyNo}.
              {createdEndorsement.endorsementNo !== createdEndorsement.sourceEndorsementNo && 
                " The source endorsement has been marked as EXPIRED."}
            </p>
            <Button
              variant="link"
              size="sm"
              className="text-green-700 p-0 h-auto mt-1"
              onClick={() => {
                const encodedPolicyNo = encodeURIComponent(createdEndorsement.policyNo);
                const endorsementQuery = createdEndorsement.endorsementNo ? `?endorsementNo=${encodeURIComponent(createdEndorsement.endorsementNo)}` : "";
                navigate(`/underwriting/group-life-quotations/members/${encodedPolicyNo}${endorsementQuery}`, {
                  state: {
                    endorsementNo: createdEndorsement.endorsementNo,
                    policyNo: createdEndorsement.policyNo,
                  }
                });
                dispatch(clearEndorsement());
              }}
            >
              View New Endorsement →
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-green-600 hover:text-green-800"
            onClick={() => dispatch(clearEndorsement())}
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default GroupLifeDetailsTab;