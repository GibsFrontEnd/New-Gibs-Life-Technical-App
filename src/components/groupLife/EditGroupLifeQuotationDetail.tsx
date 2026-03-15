// @ts-nocheck

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../UI/new-button";
import { Input } from "../Ui/new-input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../UI/new-select";
import { ArrowLeft } from "lucide-react";
import { useToast } from "../ui/use-toast";
import type { GroupLifeMember } from "../../types/groupLifeQuotation";
import MemberManagementTable from "./MemberManagementTable";
import {
  fetchGroupLifeQuotationById,
  updateGroupLifeQuotation as apiUpdateQuotation,
  addMemberToCurrentQuotation as apiAddMember,
  updateMemberInCurrentQuotation as apiUpdateMember,
  removeMemberFromCurrentQuotation as apiRemoveMember,
  computeQuotation as apiComputeQuotation,
  type ComputeQuotationMember,
  type ComputeQuotationPayload,
} from "../../api/groupLifeQuotation";
import { formatDate } from "@/utils/ui-utilities";

const formatDateForInput = (dateString: string): string => {
  if (!dateString) return "";

  // If already in YYYY-MM-DD format, return as is
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }

  // Parse the ISO date and convert to YYYY-MM-DD
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return ""; // Invalid date

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

interface GroupLifeExtensionRow {
  itemNo: number;
  description: string;
  rate: string;
  itemValue: string;
}

interface CompleteQuotationFormData {
  quotationNumber: string;
  transactionDate: string;
  effectiveDate: string;
  expiryDate: string;
  coverDay: string;
  clientName: string;
  groupFactorAmount: string;
  insuredType: string;
  schemeTypes: string;
  groupLifeFactor: string;
  rateType: string;
  existingClients: boolean;
  useFixedRate: boolean;
  useAverageAge: boolean;
  gpaRates: boolean;
  uploadMemberDetails: boolean;
  groupLifeExtension: boolean;
  extensionRows: GroupLifeExtensionRow[];
  totalSumInsured: string;
  loadingPercent: string;
  quotationStatus: string;
  totalPremium: string;
  reductionPercent: string;
  netPremiumDue: string;
}

const EditGroupLifeQuotationDetail: React.FC = () => {
  const { Param } = useParams<{ Param: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quotationData, setQuotationData] = useState<any>(null);
  const [members, setMembers] = useState<GroupLifeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isInitializedRef = useRef(false);

  const [formData, setFormData] = useState<CompleteQuotationFormData>({
    quotationNumber: "[AUTO]",
    transactionDate: new Date().toISOString().split("T")[0],
    effectiveDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split("T")[0],
    coverDay: "0.00",
    clientName: "",
    groupFactorAmount: "1000.00",
    insuredType: "",
    schemeTypes: "",
    groupLifeFactor: "0",
    rateType: "",
    existingClients: false,
    useFixedRate: false,
    useAverageAge: false,
    gpaRates: false,
    uploadMemberDetails: false,
    groupLifeExtension: false,
    extensionRows: [
      { itemNo: 1, description: "", rate: "0", itemValue: "0" },
      { itemNo: 2, description: "", rate: "0", itemValue: "0" },
      { itemNo: 3, description: "", rate: "0", itemValue: "0" },
      { itemNo: 4, description: "", rate: "0", itemValue: "0" },
      { itemNo: 5, description: "", rate: "0", itemValue: "0" },
    ],
    totalSumInsured: "0.00",
    loadingPercent: "0",
    quotationStatus: "PROSPECT",
    totalPremium: "0.00",
    reductionPercent: "0",
    netPremiumDue: "0.00",
  });

  const [uploadedMembersRaw, setUploadedMembersRaw] = useState<
    ComputeQuotationMember[] | null
  >(null);

  const [expandedSections, setExpandedSections] = useState({
    policyDetails: true,
    memberDetails: true,
    extensionDetails: false,
    quotationStatus: true,
  });

  // Fetch quotation on mount
  useEffect(() => {
    const loadQuotation = async () => {
      if (!Param) return;

      try {
        setLoading(true);
        const response = await fetchGroupLifeQuotationById(Param);
        const data = response?.data?.data ?? response?.data ?? response;

        console.log("Loaded quotation data:", data); // Debug log
        console.log("Member calculations:", data?.memberCalculations);

        setQuotationData(data);

        // Transform memberCalculations to GroupLifeMember format
        if (data.memberCalculations && Array.isArray(data.memberCalculations)) {
          const transformedMembers: GroupLifeMember[] =
            data.memberCalculations.map((member: any) => ({
              id: `${member.staffNo}`,
              staffNo: member.staffNo,
              employeeNames: member.employeeNames,
              sex: member.sex,
              dateOfBirth: member.dateOfBirth,
              anb: member.anb,
              totalEmolument: member.totalEmolument,
              sumInsured: member.sumAssured,
              premium: member.totalMemberPremium,
              rate: member.premiumRate,
              basicSalary: member.basicSalary,
              housingAllowance: member.housingAllowance,
              transportAllowance: member.transportAllowance,
              hireDate: member.hireDate,
            }));

          console.log("Transformed members:", transformedMembers); // Debug log
          setMembers(transformedMembers);

          // Also store raw members for compute operations
          const rawMembers: ComputeQuotationMember[] =
            data.memberCalculations.map((member: any) => ({
              staffNo: member.staffNo,
              employeeNames: member.employeeNames,
              sex: member.sex,
              dateOfBirth: member.dateOfBirth,
              basicSalary: member.basicSalary || 0,
              housingAllowance: member.housingAllowance || 0,
              transportAllowance: member.transportAllowance || 0,
              hireDate: member.hireDate || new Date().toISOString(),
              permanentDisabilityRate: member.permanentDisabilityRate || 0,
              temporaryDisabilityRate: member.temporaryDisabilityRate || 0,
              medicalExpensesRate: member.medicalExpensesRate || 0,
              funeralExtensionRate: member.funeralExtensionRate || 0,
              criticalIllnessRate: member.criticalIllnessRate || 0,
            }));
          setUploadedMembersRaw(rawMembers);
        } else {
          console.warn("No memberCalculations found in response"); // Debug log
          setMembers([]);
        }

        console.log("Date values before formatting:", {
          transactionDate: data.transactionDate,
          effectiveDate: data.effectiveDate,
          expiryDate: data.expiryDate,
        });

        console.log("Date values after formatting:", {
          transactionDate: formatDateForInput(data.transactionDate),
          effectiveDate: formatDateForInput(data.effectiveDate),
          expiryDate: formatDateForInput(data.expiryDate),
        });

        // Set form data with properly formatted dates
        setFormData({
          quotationNumber: data.quotationNumber || "[AUTO]",
          transactionDate: formatDateForInput(data.transactionDate),
          effectiveDate: formatDateForInput(data.effectiveDate),
          expiryDate: formatDateForInput(data.expiryDate),
          coverDay: data.coverDays != null ? data.coverDays.toString() : "0.00",
          clientName: data.clientName || "",
          groupFactorAmount:
            data.groupFactorAmount != null
              ? data.groupFactorAmount.toString()
              : "1000.00",
          insuredType: data.insuredType || "",
          schemeTypes: data.schemeType || "",
          groupLifeFactor:
            data.groupLifeFactor != null
              ? data.groupLifeFactor.toString()
              : "0",
          rateType: data.rateType || "",
          existingClients: data.existingClient || false,
          useFixedRate: data.useFixedRate || false,
          useAverageAge: data.useAverageAge || false,
          gpaRates: false,
          uploadMemberDetails: false,
          groupLifeExtension: data.groupLifeExtension || false,
          extensionRows:
            Array.isArray(data.extensions) && data.extensions.length > 0
              ? data.extensions.map((ext: any) => ({
                  itemNo: ext.itemNo,
                  description: ext.description || "",
                  rate: ext.rate != null ? ext.rate.toString() : "0",
                  itemValue:
                    ext.itemValue != null ? ext.itemValue.toString() : "0",
                }))
              : [
                  { itemNo: 1, description: "", rate: "0", itemValue: "0" },
                  { itemNo: 2, description: "", rate: "0", itemValue: "0" },
                  { itemNo: 3, description: "", rate: "0", itemValue: "0" },
                  { itemNo: 4, description: "", rate: "0", itemValue: "0" },
                  { itemNo: 5, description: "", rate: "0", itemValue: "0" },
                ],
          totalSumInsured:
            data.totalSumInsured != null
              ? data.totalSumInsured.toFixed(2)
              : "0.00",
          loadingPercent:
            data.loadingAmount != null ? data.loadingAmount.toString() : "0",
          quotationStatus: data.status || "PROSPECT",
          totalPremium:
            data.totalBasicPremium != null
              ? data.totalBasicPremium.toFixed(2)
              : "0.00",
          reductionPercent:
            data.reductionAmount != null
              ? data.reductionAmount.toString()
              : "0",
          netPremiumDue:
            data.netPremium != null ? data.netPremium.toFixed(2) : "0.00",
        });

        console.log("Form data set:", formData); // Debug log - Note: This might show old state due to closure
      } catch (error: any) {
        console.error("Load quotation error:", error);
        toast({
          title: "Error",
          description: error?.message || "Failed to load quotation",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadQuotation();
  }, [Param, toast]);
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleInputChange = (
    field: keyof CompleteQuotationFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Add this helper function near the top of the component, after the state declarations
  const formatDateForBackend = (dateString: string): string => {
    if (!dateString) return new Date().toISOString();

    // If it's already in ISO format, return as is
    if (dateString.includes("T")) return dateString;

    // Convert YYYY-MM-DD to ISO DateTime format
    const date = new Date(dateString);
    return date.toISOString();
  };

  const handleAddMember = async (member: Omit<GroupLifeMember, "id">) => {
    if (!id) {
      toast({
        title: "Error",
        description: "Quotation ID is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare new member data for backend
      const newMemberData: ComputeQuotationMember = {
        staffNo: member.staffNo || `STAFF-${Date.now()}`,
        employeeNames: member.employeeNames,
        sex: member.sex,
        dateOfBirth: formatDateForBackend(member.dateOfBirth),
        basicSalary: member.basicSalary || 0,
        housingAllowance: member.housingAllowance || 0,
        transportAllowance: member.transportAllowance || 0,
        hireDate: formatDateForBackend(
          member.hireDate || new Date().toISOString().split("T")[0]
        ),
        permanentDisabilityRate: 0,
        temporaryDisabilityRate: 0,
        medicalExpensesRate: 0,
        funeralExtensionRate: 0,
        criticalIllnessRate: 0,
      };

      // Add to the members list
      const updatedMembersRaw = [...(uploadedMembersRaw || []), newMemberData];

      // Prepare the full quotation update payload with the new member
      const quotationData = {
        transactionDate: formatDateForBackend(formData.transactionDate),
        effectiveDate: formatDateForBackend(formData.effectiveDate),
        expiryDate: formatDateForBackend(formData.expiryDate),
        insuredType: formData.insuredType,
        schemeType: formData.schemeTypes,
        clientName: formData.clientName,
        groupLifeFactor: Number.parseFloat(formData.groupLifeFactor) || 0,
        groupFactorAmount: Number.parseFloat(formData.groupFactorAmount) || 0,
        useFixedRate: formData.useFixedRate,
        fixedRate: 0,
        useAverageAge: formData.useAverageAge,
        averageAge: 0,
        loadingRate: Number.parseFloat(formData.loadingPercent) || 0,
        reductionRate: Number.parseFloat(formData.reductionPercent) || 0,
        coverDays: Number.parseFloat(formData.coverDay) || 0,
        members: updatedMembersRaw,
      };

      // Call PUT endpoint to update the entire quotation with the new member
      await apiUpdateQuotation(id, quotationData);

      // Update local state
      const newMember: GroupLifeMember = {
        ...member,
        id: `${newMemberData.staffNo}`,
        staffNo: newMemberData.staffNo,
      };
      setMembers((prev) => [...prev, newMember]);
      setUploadedMembersRaw(updatedMembersRaw);

      // Recalculate totals
      // calculateTotals([...members, newMember]);

      toast({
        title: "Success",
        description: "Member added successfully",
      });
    } catch (error: any) {
      console.error("Add member error:", error); // Debug log
      toast({
        title: "Error",
        description: error?.message || "Failed to add member",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMember = async (index: number, member: GroupLifeMember) => {
    if (!id) return;

    try {
      // Prepare the updated member list
      const updatedMembers = [...members];
      updatedMembers[index] = member;

      // Prepare all members data for backend
      const updatedMembersRaw = updatedMembers.map((m, i) => {
        const existingRaw = uploadedMembersRaw?.[i];
        return {
          staffNo: m.staffNo || `STAFF-${Date.now()}`,
          employeeNames: m.employeeNames,
          sex: m.sex,
          dateOfBirth: formatDateForBackend(m.dateOfBirth),
          basicSalary: m.basicSalary || existingRaw?.basicSalary || 0,
          housingAllowance:
            m.housingAllowance || existingRaw?.housingAllowance || 0,
          transportAllowance:
            m.transportAllowance || existingRaw?.transportAllowance || 0,
          hireDate: formatDateForBackend(
            m.hireDate || existingRaw?.hireDate || new Date().toISOString()
          ),
          permanentDisabilityRate: existingRaw?.permanentDisabilityRate || 0,
          temporaryDisabilityRate: existingRaw?.temporaryDisabilityRate || 0,
          medicalExpensesRate: existingRaw?.medicalExpensesRate || 0,
          funeralExtensionRate: existingRaw?.funeralExtensionRate || 0,
          criticalIllnessRate: existingRaw?.criticalIllnessRate || 0,
        } as ComputeQuotationMember;
      });

      // Prepare the full quotation update payload
      const quotationData = {
        transactionDate: formatDateForBackend(formData.transactionDate),
        effectiveDate: formatDateForBackend(formData.effectiveDate),
        expiryDate: formatDateForBackend(formData.expiryDate),
        insuredType: formData.insuredType,
        schemeType: formData.schemeTypes,
        clientName: formData.clientName,
        groupLifeFactor: Number.parseFloat(formData.groupLifeFactor) || 0,
        groupFactorAmount: Number.parseFloat(formData.groupFactorAmount) || 0,
        useFixedRate: formData.useFixedRate,
        fixedRate: 0,
        useAverageAge: formData.useAverageAge,
        averageAge: 0,
        loadingRate: Number.parseFloat(formData.loadingPercent) || 0,
        reductionRate: Number.parseFloat(formData.reductionPercent) || 0,
        coverDays: Number.parseFloat(formData.coverDay) || 0,
        members: updatedMembersRaw,
      };

      // Call PUT endpoint to update the entire quotation with updated members
      await apiUpdateQuotation(id, quotationData);

      // Update local state
      setMembers(updatedMembers);
      setUploadedMembersRaw(updatedMembersRaw);

      // Recalculate totals
      // calculateTotals(updatedMembers);

      toast({
        title: "Success",
        description: "Member updated successfully",
      });
    } catch (error: any) {
      console.error("Update member error:", error); // Debug log
      toast({
        title: "Error",
        description: error?.message || "Failed to update member",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = async (index: number) => {
    if (!id) return;

    try {
      // Remove the member from the list
      const updatedMembers = members.filter((_, i) => i !== index);
      const updatedMembersRaw =
        uploadedMembersRaw?.filter((_, i) => i !== index) || [];

      // Prepare the full quotation update payload without the deleted member
      const quotationData = {
        transactionDate: formatDateForBackend(formData.transactionDate),
        effectiveDate: formatDateForBackend(formData.effectiveDate),
        expiryDate: formatDateForBackend(formData.expiryDate),
        insuredType: formData.insuredType,
        schemeType: formData.schemeTypes,
        clientName: formData.clientName,
        groupLifeFactor: Number.parseFloat(formData.groupLifeFactor) || 0,
        groupFactorAmount: Number.parseFloat(formData.groupFactorAmount) || 0,
        useFixedRate: formData.useFixedRate,
        fixedRate: 0,
        useAverageAge: formData.useAverageAge,
        averageAge: 0,
        loadingRate: Number.parseFloat(formData.loadingPercent) || 0,
        reductionRate: Number.parseFloat(formData.reductionPercent) || 0,
        coverDays: Number.parseFloat(formData.coverDay) || 0,
        members: updatedMembersRaw,
      };

      // Call PUT endpoint to update the entire quotation with the deleted member removed
      await apiUpdateQuotation(id, quotationData);

      // Update local state
      setMembers(updatedMembers);
      setUploadedMembersRaw(updatedMembersRaw);

      // Recalculate totals
      // calculateTotals(updatedMembers);

      toast({
        title: "Success",
        description: "Member deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete member error:", error); // Debug log
      toast({
        title: "Error",
        description: error?.message || "Failed to delete member",
        variant: "destructive",
      });
    }
  };

  // const calculateTotals = (memberList: GroupLifeMember[] = members) => {
  //   const totalSumInsured = memberList.reduce(
  //     (sum, m) => sum + m.sumInsured,
  //     0
  //   );
  //   const totalPremium = memberList.reduce((sum, m) => sum + m.premium, 0);

  //   const loadingAmount =
  //     (totalPremium * Number.parseFloat(formData.loadingPercent)) / 100;
  //   const reductionAmount =
  //     (totalPremium * Number.parseFloat(formData.reductionPercent)) / 100;
  //   const netPremium = totalPremium + loadingAmount - reductionAmount;

  //   setFormData((prev) => ({
  //     ...prev,
  //     totalSumInsured: totalSumInsured.toFixed(2),
  //     totalPremium: totalPremium.toFixed(2),
  //     netPremiumDue: netPremium.toFixed(2),
  //   }));
  // };

  const handleGetCoverDay = () => {
    const effective = new Date(formData.effectiveDate);
    const expiry = new Date(formData.expiryDate);
    const diffTime = Math.abs(expiry.getTime() - effective.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setFormData((prev) => ({ ...prev, coverDay: diffDays.toString() }));
  };

  const handleComputePreview = async () => {
    if (!uploadedMembersRaw || uploadedMembersRaw.length === 0) {
      toast({
        title: "No members",
        description: "Members must be available to compute",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload: ComputeQuotationPayload = {
        quotationNumber: formData.quotationNumber || "TEMP",
        transactionDate: formData.transactionDate,
        effectiveDate: formData.effectiveDate,
        expiryDate: formData.expiryDate,
        insuredType: formData.insuredType,
        schemeType: formData.schemeTypes,
        clientName: formData.clientName,
        groupLifeFactor: Number.parseFloat(formData.groupLifeFactor) || 0,
        groupFactorAmount: Number.parseFloat(formData.groupFactorAmount) || 0,
        useFixedRate: formData.useFixedRate,
        fixedRate: 0,
        useAverageAge: formData.useAverageAge,
        averageAge: 0,
        loadingRate: Number.parseFloat(formData.loadingPercent) || 0,
        reductionRate: Number.parseFloat(formData.reductionPercent) || 0,
        coverDays: Number.parseFloat(formData.coverDay) || 0,
        members: uploadedMembersRaw,
      };

      console.log("Compute payload:", payload); // Debug log
      const response = await apiComputeQuotation(payload);
      console.log("Compute response:", response); // Debug log

      // Extract the actual data from the response
      const computedData = response?.data?.data || response?.data || response;
      console.log("Computed data:", computedData); // Debug log

      if (computedData?.memberCalculations) {
        // Map memberCalculations to GroupLifeMember format
        const mappedMembers = computedData.memberCalculations.map(
          (member: any) => ({
            id: `${member.staffNo}`,
            staffNo: member.staffNo,
            employeeNames: member.employeeNames,
            sex: member.sex,
            dateOfBirth: member.dateOfBirth,
            anb: member.anb,
            totalEmolument: member.totalEmolument,
            sumInsured: member.sumAssured,
            premium: member.totalMemberPremium,
            rate: member.premiumRate,
            basicSalary: member.basicSalary,
            housingAllowance: member.housingAllowance,
            transportAllowance: member.transportAllowance,
            hireDate: member.hireDate,
          })
        );

        // Update members in local state
        setMembers(mappedMembers);
        console.log("Updated members:", mappedMembers); // Debug log
      }

      // Extract the computed values
      const totalSumInsured = computedData?.totalSumInsured || 0;
      const totalBasicPremium = computedData?.totalBasicPremium || 0;
      const netPremium = computedData?.netPremium || 0;
      const loadingAmount = computedData?.loadingAmount || 0;
      const reductionAmount = computedData?.reductionAmount || 0;

      console.log("Extracted values:", {
        totalSumInsured,
        totalBasicPremium,
        netPremium,
        loadingAmount,
        reductionAmount,
      }); // Debug log

      // Update form data with computed values
      setFormData((prev) => {
        const updated = {
          ...prev,
          totalSumInsured: totalSumInsured.toFixed(2),
          totalPremium: totalBasicPremium.toFixed(2),
          netPremiumDue: netPremium.toFixed(2),
          loadingPercent: loadingAmount.toString(),
          reductionPercent: reductionAmount.toString(),
        };
        console.log("Updated formData:", updated); // Debug log
        return updated;
      });

      toast({
        title: "Preview ready",
        description: `Quotation recomputed successfully.`,
      });
    } catch (e: any) {
      console.error("Compute error:", e); // Debug log
      toast({
        title: "Compute failed",
        description: e?.message || "Unable to compute quotation",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (
      !formData.clientName ||
      !formData.insuredType ||
      !formData.schemeTypes
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!uploadedMembersRaw || uploadedMembersRaw.length === 0) {
      toast({
        title: "No members",
        description: "Members must be available to save",
        variant: "destructive",
      });
      return;
    }

    const quotationData = {
      transactionDate: formData.transactionDate,
      effectiveDate: formData.effectiveDate,
      expiryDate: formData.expiryDate,
      insuredType: formData.insuredType,
      schemeType: formData.schemeTypes,
      clientName: formData.clientName,
      groupLifeFactor: Number.parseFloat(formData.groupLifeFactor) || 0,
      groupFactorAmount: Number.parseFloat(formData.groupFactorAmount) || 0,
      useFixedRate: formData.useFixedRate,
      fixedRate: 0,
      useAverageAge: formData.useAverageAge,
      averageAge: 0,
      loadingRate: Number.parseFloat(formData.loadingPercent) || 0,
      reductionRate: Number.parseFloat(formData.reductionPercent) || 0,
      coverDays: Number.parseFloat(formData.coverDay) || 0,
      members: uploadedMembersRaw,
    };

    try {
      if (id) {
        await dispatch(
          updateGroupLifeQuotation({ id, data: quotationData })
        ).unwrap();
        toast({
          title: "Success",
          description: "Quotation updated successfully.",
        });
        navigate("/quotations/group-life/");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err || "Failed to save quotation.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate("/quotations/group-life/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg">Loading quotation...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 lg:p-6 space-y-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="mb-4 bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Quotations
            </Button>

            <div className="mb-6">
              <h1 className="text-2xl font-semibold">
                Edit Group Life Quotation
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {formData.quotationNumber}
              </p>
            </div>

            {/* Policy Details Section */}
            <div className="border rounded-lg shadow-sm  mb-4">
              <button
                type="button"
                onClick={() => toggleSection("policyDetails")}
                className="w-full flex items-center gap-2 px-6 py-4 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <span className="font-semibold">Quotation Policy Details</span>
              </button>
              {expandedSections.policyDetails && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="quotationNumber"
                        className="text-sm font-medium"
                      >
                        Quotation Number:
                      </Label>
                      <Input
                        id="quotationNumber"
                        value={formData.quotationNumber}
                        className="bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="insuredType"
                        className="text-sm font-medium"
                      >
                        Insured Type:
                      </Label>
                      <Select
                        value={formData.insuredType}
                        onValueChange={(value) =>
                          handleInputChange("insuredType", value)
                        }
                      >
                        <SelectTrigger disabled className="bg-gray-50">
                          <SelectValue placeholder="- select -" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="company">Company</SelectItem>
                          <SelectItem value="individual">Individual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="transactionDate"
                        className="text-sm font-medium"
                      >
                        Transaction Date:
                      </Label>
                      <Input
                        id="transactionDate"
                        type="date"
                        value={formData.transactionDate}
                        onChange={(e) =>
                          handleInputChange("transactionDate", e.target.value)
                        }
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="schemeTypes"
                        className="text-sm font-medium"
                      >
                        Scheme Types:
                      </Label>
                      <Select
                        value={formData.schemeTypes}
                        onValueChange={(value) =>
                          handleInputChange("schemeTypes", value)
                        }
                      >
                        <SelectTrigger disabled className="bg-gray-50">
                          <SelectValue placeholder="- select -" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credit-life">
                            Credit life
                          </SelectItem>
                          <SelectItem value="group-life">Group life</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="effectiveDate"
                        className="text-sm font-medium"
                      >
                        Effective Date:
                      </Label>
                      <Input
                        id="effectiveDate"
                        type="date"
                        value={formData.effectiveDate}
                        onChange={(e) =>
                          handleInputChange("effectiveDate", e.target.value)
                        }
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="expiryDate"
                        className="text-sm font-medium"
                      >
                        Expiry Date:
                      </Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) =>
                          handleInputChange("expiryDate", e.target.value)
                        }
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="coverDay" className="text-sm font-medium">
                        Cover Day:
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="coverDay"
                          value={formData.coverDay}
                          onChange={(e) =>
                            handleInputChange("coverDay", e.target.value)
                          }
                          readOnly
                          className="bg-gray-50"
                        />
                        <Button
                          type="button"
                          onClick={handleGetCoverDay}
                          className="bg-primary hover:bg-primary/80 text-white whitespace-nowrap"
                          disabled
                        >
                          Get Cover Day
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <input
                          type="checkbox"
                          id="existingClients"
                          checked={formData.existingClients}
                          onChange={(e) =>
                            handleInputChange(
                              "existingClients",
                              e.target.checked
                            )
                          }
                          className="rounded"
                          disabled
                        />
                        <Label htmlFor="existingClients" className="text-sm">
                          Existing Clients
                        </Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="groupLifeFactor"
                        className="text-sm font-medium"
                      >
                        Group Life Factor:
                      </Label>
                      <Select
                        value={formData.groupLifeFactor}
                        onValueChange={(value) =>
                          handleInputChange("groupLifeFactor", value)
                        }
                      >
                        <SelectTrigger disabled className="bg-gray-50">
                          <SelectValue placeholder="0" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="6">6</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="clientName"
                        className="text-sm font-medium"
                      >
                        Client Name:
                      </Label>
                      <textarea
                        id="clientName"
                        value={formData.clientName}
                        onChange={(e) =>
                          handleInputChange("clientName", e.target.value)
                        }
                        className="w-full min-h-[80px] px-3 py-2 bg-gray-50 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Enter client name..."
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rateType" className="text-sm font-medium">
                        Rate Type:
                      </Label>
                      <Select
                        value={formData.rateType}
                        onValueChange={(value) =>
                          handleInputChange("rateType", value)
                        }
                      >
                        <SelectTrigger disabled className="bg-gray-50">
                          <SelectValue placeholder="-select-" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRAN RATE">PRAN RATE</SelectItem>
                          <SelectItem value="RATE 2.7">RATE 2.7</SelectItem>
                          <SelectItem value="RATE 2.4">RATE 2.4</SelectItem>
                          <SelectItem value="RATE 2.06">RATE 2.06</SelectItem>
                          <SelectItem value="CR RATE 1">CR RATE 1</SelectItem>
                          <SelectItem value="CR RATE 2">CR RATE 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="groupFactorAmount"
                        className="text-sm font-medium"
                      >
                        Group Factor Amount:
                      </Label>
                      <Input
                        id="groupFactorAmount"
                        value={formData.groupFactorAmount}
                        onChange={(e) =>
                          handleInputChange("groupFactorAmount", e.target.value)
                        }
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Member Details Section */}
            <div className="border rounded-lg shadow-sm  mb-4">
              <button
                type="button"
                onClick={() => toggleSection("memberDetails")}
                className="w-full flex items-center gap-2 px-6 py-4 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <span className="font-semibold">Member Details</span>
              </button>
              {expandedSections.memberDetails && (
                <div className="p-6">
                  <MemberManagementTable
                    members={members}
                    onAddMember={handleAddMember}
                    onUpdateMember={handleUpdateMember}
                    onDeleteMember={handleDeleteMember}
                    groupFactorAmount={Number.parseFloat(
                      formData.groupFactorAmount
                    )}
                    readOnly={false}
                  />
                </div>
              )}
            </div>

            {/* Extension Details Section */}
            <div className="border rounded-lg shadow-sm  mb-4">
              <button
                type="button"
                onClick={() => toggleSection("extensionDetails")}
                className="w-full flex items-center gap-2 px-6 py-4 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <span className="font-semibold">
                  Group Life Extension Details
                </span>
              </button>
              {expandedSections.extensionDetails && (
                <div className="p-6">
                  <p className="text-sm text-gray-500">
                    No extension details available.
                  </p>
                </div>
              )}
            </div>

            {/* Quotation Status Section */}
            <div className="border rounded-lg shadow-sm  mb-4">
              <button
                type="button"
                onClick={() => toggleSection("quotationStatus")}
                className="w-full flex items-center gap-2 px-6 py-4 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <span className="font-semibold">Quotation Status</span>
              </button>
              {expandedSections.quotationStatus && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="totalSumInsured"
                        className="text-sm font-medium"
                      >
                        Total Sum Insured:
                      </Label>
                      <Input
                        id="totalSumInsured"
                        value={formData.totalSumInsured}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="totalPremium"
                        className="text-sm font-medium"
                      >
                        Total Premium:
                      </Label>
                      <Input
                        id="totalPremium"
                        value={formData.totalPremium}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="loadingPercent"
                        className="text-sm font-medium"
                      >
                        Loading %:
                      </Label>
                      <Input
                        id="loadingPercent"
                        value={formData.loadingPercent}
                        onChange={(e) =>
                          handleInputChange("loadingPercent", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="reductionPercent"
                        className="text-sm font-medium"
                      >
                        Reduction %:
                      </Label>
                      <Input
                        id="reductionPercent"
                        value={formData.reductionPercent}
                        onChange={(e) =>
                          handleInputChange("reductionPercent", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="quotationStatus"
                        className="text-sm font-medium"
                      >
                        Quotation Status:
                      </Label>
                      <Select
                        value={formData.quotationStatus}
                        onValueChange={(value) =>
                          handleInputChange("quotationStatus", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="PROSPECT" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PROSPECT">PROSPECT</SelectItem>
                          <SelectItem value="PENDING">PENDING</SelectItem>
                          <SelectItem value="APPROVED">APPROVED</SelectItem>
                          <SelectItem value="REJECTED">REJECTED</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="netPremiumDue"
                        className="text-sm font-medium"
                      >
                        Net Premium Due:
                      </Label>
                      <Input
                        id="netPremiumDue"
                        value={formData.netPremiumDue}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-4 bg-transparent p-6 rounded-xl">
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                className="px-8 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={handleComputePreview}
                disabled={!uploadedMembersRaw?.length}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Recompute
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditGroupLifeQuotationDetail;