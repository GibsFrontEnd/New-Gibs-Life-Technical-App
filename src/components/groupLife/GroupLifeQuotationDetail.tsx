// @ts-nocheck
"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../UI/new-button";
import { Input } from "../UI/new-input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../UI/new-select";
import { ArrowLeft } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/use-apps";
import {
  selectGroupLifeQuotations,
  fetchGroupLifeQuotationById,
  createGroupLifeQuotation,
  updateGroupLifeQuotation,
  addMemberToCurrentQuotation,
  updateMemberInCurrentQuotation,
  removeMemberFromCurrentQuotation,
  clearCurrentQuotation,
  setMembersForCurrentQuotation,
  setComputedTotalsForCurrentQuotation,
  setCurrentQuotation,
} from "../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";
import type { GroupLifeMember } from "../../types/groupLifeQuotation";
import MemberManagementTable from "./MemberManagementTable";
import { useToast } from "../ui/use-toast";
import {
  getCsvTemplate,
  getExcelTemplate,
  validateMembers as apiValidateMembers,
  uploadMembers as apiUploadMembers,
  computeQuotation as apiComputeQuotation,
  type ComputeQuotationMember,
  type ComputeQuotationPayload,
} from "../../api/groupLifeQuotation";
import { debounce } from "lodash";
import { SERVER_URL } from "../../utils/constants";

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

const GroupLifeQuotationDetail: React.FC = () => {
  const navigate = useNavigate();
  const { Param } = useParams<{ Param: string }>();
  const dispatch = useAppDispatch();
  const { currentQuotation, loading, error } = useAppSelector(
    selectGroupLifeQuotations
  );
  const { toast } = useToast();

  const isNewQuotation = Param === "new";

  useEffect(() => {
    console.log("new quotation: ", Param);
    if (isNewQuotation) {
      dispatch(
        setCurrentQuotation({
          quotationNumber: "TEMP",
          members: [],
          totalMembers: 0,
          totalSumInsured: 0,
          totalPremium: 0,
          status: "PROSPECT",
        })
      );
    } else if (Param) {
      // Redirect to edit page for existing quotations
      navigate(`/agent/group-life-quotes/${Param}/edit`);
    }

    return () => {
      dispatch(clearCurrentQuotation());
    };
  }, [dispatch, Param, isNewQuotation]);

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

  const [expandedSections, setExpandedSections] = useState({
    policyDetails: true,
    memberQuotation: true,
    memberDetails: true,
    extensionDetails: false,
    quotationStatus: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleInputChange = (
    field: keyof CompleteQuotationFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleExtensionRowChange = (
    index: number,
    field: keyof GroupLifeExtensionRow,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      extensionRows: prev.extensionRows.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      ),
    }));
  };

  const handleAddMember = (member: Omit<GroupLifeMember, "id">) => {
    const newMember: GroupLifeMember = {
      ...member,
      id: `temp-${Date.now()}`,
    };
    dispatch(addMemberToCurrentQuotation(newMember));

    // calculateTotals();
  };

  const handleUpdateMember = (index: number, member: GroupLifeMember) => {
    dispatch(updateMemberInCurrentQuotation({ index, member }));

    // calculateTotals();
  };

  const handleDeleteMember = (index: number) => {
    dispatch(removeMemberFromCurrentQuotation(index));

    // calculateTotals();
  };

  const calculateTotals = () => {
    if (!currentQuotation) return;

    const totalSumInsured = currentQuotation.members.reduce(
      (sum, m) => sum + m.sumInsured,
      0
    );
    const totalPremium = currentQuotation.members.reduce(
      (sum, m) => sum + m.premium,
      0
    );

    const loadingAmount =
      (totalPremium * Number.parseFloat(formData.loadingPercent)) / 100;
    const reductionAmount =
      (totalPremium * Number.parseFloat(formData.reductionPercent)) / 100;
    const netPremium = totalPremium + loadingAmount - reductionAmount;

    setFormData((prev) => ({
      ...prev,
      totalSumInsured: totalSumInsured.toFixed(2),
      totalPremium: totalPremium.toFixed(2),
      netPremiumDue: netPremium.toFixed(2),
    }));
  };

  const handleGetCoverDay = () => {
    const effective = new Date(formData.effectiveDate);
    const expiry = new Date(formData.expiryDate);
    const diffTime = Math.abs(expiry.getTime() - effective.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setFormData((prev) => ({ ...prev, coverDay: diffDays.toString() }));
  };

  const handleCompute = () => {
    calculateTotals();
    toast({
      title: "Calculations Complete",
      description: "Premium and sum insured have been recalculated.",
    });
  };

  const handleCancel = () => {
    navigate("/quotations/group-life/");
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

    // Check if there are any members
    if (!currentQuotation?.members || currentQuotation.members.length === 0) {
      toast({
        title: "No members",
        description: "Add members before saving the quotation",
        variant: "destructive",
      });
      return;
    }

    // Convert UI members to API format
    const membersForApi: ComputeQuotationMember[] =
      currentQuotation.members.map((m) => ({
        staffNo: (m as any).staffNo || "",
        employeeNames: m.employeeNames,
        sex: m.sex,
        dateOfBirth: m.dateOfBirth,
        basicSalary: (m as any).basicSalary || 0,
        housingAllowance: (m as any).housingAllowance || 0,
        transportAllowance: (m as any).transportAllowance || 0,
        hireDate: (m as any).hireDate || "",
      }));

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
      members: membersForApi,
    };

    try {
      if (isNewQuotation) {
        await dispatch(createGroupLifeQuotation(quotationData)).unwrap();
        toast({
          title: "Success",
          description: "Quotation created successfully.",
        });
      } else if (id) {
        await dispatch(
          updateGroupLifeQuotation({ id, data: quotationData })
        ).unwrap();
        toast({
          title: "Success",
          description: "Quotation updated successfully.",
        });
      }
      // navigate("/agent/group-life-quotations");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err || "Failed to save quotation.",
        variant: "destructive",
      });
    }
  };

  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadedMembersRaw, setUploadedMembersRaw] = useState<
    ComputeQuotationMember[] | null
  >(null);

  const download = async (which: "csv" | "excel") => {
    try {
      const resp =
        which === "csv" ? await getCsvTemplate() : await getExcelTemplate();
      const blob = (resp as any)?.data ?? resp;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        which === "csv"
          ? "group-members-template.csv"
          : "group-members-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({
        title: "Download failed",
        description: e?.message ?? "Unable to download template",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file",
        description: "Select a CSV or Excel file",
        variant: "destructive",
      });
      return;
    }
    if (validationErrors.length) {
      toast({
        title: "Fix validation errors",
        description: "Re-validate after fixing file",
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      const { data } = await apiUploadMembers(selectedFile as any);
      if (!data?.success) {
        toast({
          title: "Upload failed",
          description:
            (data?.errors ?? []).join(", ") || "Server rejected the file",
          variant: "destructive",
        });
        return;
      }
      setUploadedMembersRaw(data.members || []);

      // Map server members to UI members for table display and totals
      const toUiMembers = (m: ComputeQuotationMember): GroupLifeMember => {
        const employeeNames = m.employeeNames || "Unknown";
        const sex = m.sex ?? "U";
        const totalEmolument =
          (m.basicSalary ?? 0) +
          (m.housingAllowance ?? 0) +
          (m.transportAllowance ?? 0);
        return {
          id: `temp-${m.staffNo || Math.random().toString(36).slice(2)}`,
          employeeNames,
          sex,
          dateOfBirth: m.dateOfBirth,
          anb: 0,
          totalEmolument,
          sumInsured: 0,
          premium: 0,
          rate: 0,
          staffNo: m.staffNo || "",
          basicSalary: m.basicSalary || 0,
          housingAllowance: m.housingAllowance || 0,
          transportAllowance: m.transportAllowance || 0,
          hireDate: m.hireDate || "",
        };
      };

      const mapped = (data.members || []).map(toUiMembers);
      dispatch(setMembersForCurrentQuotation(mapped));
      console.log("Updated members:", mapped);

      toast({
        title: "Members uploaded",
        description: `Imported ${data.validRecords} member(s)`,
      });
    } catch (e: any) {
      toast({
        title: "Upload error",
        description: e?.message ?? "Unable to upload members",
        variant: "destructive",
      });
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleComputePreview = async () => {
    if (!currentQuotation) {
      toast({
        title: "No quotation",
        description: "Fill quotation header details first",
        variant: "destructive",
      });
      return;
    }
    if (!uploadedMembersRaw || uploadedMembersRaw.length === 0) {
      toast({
        title: "No members",
        description: "Upload and validate members before compute",
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

      const response = await apiComputeQuotation(payload);

      // Extract the actual data from the response
      const computedData = response?.data?.data || response?.data || response;

      if (computedData?.memberCalculations) {
        // Map memberCalculations to GroupLifeMember format
        const mappedMembers = computedData.memberCalculations.map(
          (member: any) => ({
            id: `temp-${member.staffNo || Math.random().toString(36).slice(2)}`,
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

        // Update members in store
        dispatch(setMembersForCurrentQuotation(mappedMembers));
      }

      // Extract the computed values
      const totalSumInsured = computedData?.totalSumInsured || 0;
      const totalBasicPremium = computedData?.totalBasicPremium || 0;
      const netPremium = computedData?.netPremium || 0;
      const loadingAmount = computedData?.loadingAmount || 0;
      const reductionAmount = computedData?.reductionAmount || 0;

      // Update computed totals in the store
      dispatch(
        setComputedTotalsForCurrentQuotation({
          totalSumInsured,
          totalPremium: totalBasicPremium,
          netPremiumDue: netPremium,
          loadingAmount,
          reductionAmount,
        })
      );

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
        return updated;
      });

      toast({
        title: "Preview ready",
        description: `Quotation computed successfully. Total Premium: ${totalBasicPremium.toFixed(
          2
        )}, Net Premium: ${netPremium.toFixed(2)}`,
      });
    } catch (e: any) {
      toast({
        title: "Compute failed",
        description: e?.message || "Unable to compute quotation",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (file: File | null) => {
    if (!file) {
      setValidationErrors([]);
      setUploadedMembersRaw(null);
      return;
    }

    setSelectedFile(file);
    setValidating(true);
    setValidationErrors([]);

    try {
      const { data } = await apiValidateMembers(file);
      const errors = [...(data.fileErrors ?? [])];

      for (const result of data.validationResults ?? []) {
        if (!result.isValid) {
          errors.push(
            `Row ${result.rowNumber}: ${result.validationErrors?.join(", ")}`
          );
        }
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        toast({
          title: "Validation Failed",
          description: "Fix the errors and upload the file again.",
          variant: "destructive",
        });
        setUploadedMembersRaw(null);
      } else {
        toast({
          title: "Validation Successful",
          description: "The file has been validated successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: error?.message || "An error occurred during validation.",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  // New state variables for client search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Client search handler
  const handleClientSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const response = await fetch(
          `${SERVER_URL}/v1/Customers/search?SearchText=${encodeURIComponent(
            query
          )}`
        );
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        toast({
          title: "Search Error",
          description: "Failed to search for existing clients.",
          variant: "destructive",
        });
      } finally {
        setSearching(false);
      }
    }, 500),
    []
  );

  const selectClient = (client: any) => {
    // Get the client's name to display (prioritize actual name fields)
    let clientName = "";

    if (client.isOrg && client.orgName) {
      clientName = client.orgName;
    } else {
      // Format individual name with whatever fields are available
      const titlePart = client.title ? `${client.title} ` : "";
      const firstPart = client.firstName ? `${client.firstName} ` : "";
      const lastPart = client.lastName || "";

      clientName = (titlePart + firstPart + lastPart).trim();

      // If we couldn't build a name from the parts, use customerID as fallback
      if (!clientName) {
        clientName = client.customerID;
      }
    }

    // Set the client name in the form
    handleInputChange("clientName", clientName);

    // Clear search state
    setSearchResults([]);
    setSearchQuery("");

    // Turn off existing clients mode to show the textarea with selected value
    handleInputChange("existingClients", false);
  };

  // Trigger search when query changes
  useEffect(() => {
    if (formData.existingClients) {
      handleClientSearch(searchQuery);
    }
  }, [searchQuery, formData.existingClients]);

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
                {isNewQuotation ? "New" : "Edit"} Group Life Quotation
              </h1>
              {!isNewQuotation && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.quotationNumber}
                </p>
              )}
            </div>

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
                  {isNewQuotation ? (
                    /* Render full form for new quotation */
                    <>
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
                            onChange={(e) =>
                              handleInputChange(
                                "quotationNumber",
                                e.target.value
                              )
                            }
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
                            <SelectTrigger>
                              <SelectValue placeholder="- select -" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="company">Company</SelectItem>
                              <SelectItem value="individual">
                                Individual
                              </SelectItem>
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
                              handleInputChange(
                                "transactionDate",
                                e.target.value
                              )
                            }
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
                            <SelectTrigger>
                              <SelectValue placeholder="- select -" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="credit-life">
                                Credit life
                              </SelectItem>
                              <SelectItem value="group-life">
                                Group life
                              </SelectItem>
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
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="coverDay"
                            className="text-sm font-medium"
                          >
                            Cover Day:
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="coverDay"
                              value={formData.coverDay}
                              onChange={(e) =>
                                handleInputChange("coverDay", e.target.value)
                              }
                            />
                            <Button
                              type="button"
                              onClick={handleGetCoverDay}
                              className="bg-primary hover:bg-primary/80 text-white whitespace-nowrap"
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
                            />
                            <Label
                              htmlFor="existingClients"
                              className="text-sm"
                            >
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
                            <SelectTrigger>
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
                          {formData.existingClients ? (
                            <div className="space-y-2">
                              <div className="relative">
                                <Input
                                  id="clientNameSearch"
                                  value={searchQuery}
                                  onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                  }
                                  placeholder="Search for existing clients..."
                                  className={searching ? "pr-8" : ""}
                                />
                                {searching && (
                                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                                  </div>
                                )}
                              </div>

                              {searchResults.length > 0 && (
                                <div className="border rounded-md max-h-60 overflow-y-auto shadow-sm bg-white">
                                  {searchResults.map((client) => {
                                    // Determine display name for the search result
                                    let displayName = "";
                                    if (client.isOrg && client.orgName) {
                                      displayName = client.orgName;
                                    } else {
                                      const titlePart = client.title
                                        ? `${client.title} `
                                        : "";
                                      const firstPart = client.firstName
                                        ? `${client.firstName} `
                                        : "";
                                      const lastPart = client.lastName || "";
                                      displayName =
                                        (
                                          titlePart +
                                          firstPart +
                                          lastPart
                                        ).trim() || client.customerID;
                                    }

                                    return (
                                      <button
                                        key={client.customerID}
                                        type="button"
                                        onClick={() => selectClient(client)}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100"
                                      >
                                        <div className="font-medium">
                                          {displayName}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          ID: {client.customerID}
                                          {client.phoneLine1 &&
                                            ` • Phone: ${client.phoneLine1}`}
                                        </div>
                                        {client.address && (
                                          <div className="text-xs text-gray-500 truncate">
                                            {client.address}
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <textarea
                              id="clientName"
                              value={formData.clientName}
                              onChange={(e) =>
                                handleInputChange("clientName", e.target.value)
                              }
                              className="w-full min-h-[80px] px-3 py-2 bg-gray-50 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
                              placeholder="Enter client name..."
                            />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="rateType"
                            className="text-sm font-medium"
                          >
                            Rate Type:
                          </Label>
                          <Select
                            value={formData.rateType}
                            onValueChange={(value) =>
                              handleInputChange("rateType", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="-select-" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PRAN RATE">
                                PRAN RATE
                              </SelectItem>
                              <SelectItem value="RATE 2.7">RATE 2.7</SelectItem>
                              <SelectItem value="RATE 2.4">RATE 2.4</SelectItem>
                              <SelectItem value="RATE 2.06">
                                RATE 2.06
                              </SelectItem>
                              <SelectItem value="CR RATE 1">
                                CR RATE 1
                              </SelectItem>
                              <SelectItem value="CR RATE 2">
                                CR RATE 2
                              </SelectItem>
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
                              handleInputChange(
                                "groupFactorAmount",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Render read-only summary for existing quotation */
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-600 mb-1">
                            Quotation Number
                          </p>
                          <p className="font-semibold">
                            {formData.quotationNumber}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-600 mb-1">
                            Client Name
                          </p>
                          <p className="font-semibold">
                            {formData.clientName || "N/A"}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-600 mb-1">
                            Insured Type
                          </p>
                          <p className="font-semibold">
                            {formData.insuredType || "N/A"}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-600 mb-1">
                            Scheme Type
                          </p>
                          <p className="font-semibold">
                            {formData.schemeTypes || "N/A"}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-600 mb-1">
                            Effective Date
                          </p>
                          <p className="font-semibold">
                            {formData.effectiveDate}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-600 mb-1">
                            Expiry Date
                          </p>
                          <p className="font-semibold">{formData.expiryDate}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-primary/50 border border-primary/200 rounded-md">
                        <p className="text-sm text-primary/800">
                          This is an existing quotation. Policy details are
                          read-only. To modify, create a new quotation or
                          contact admin.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Import & Compute Panel (creation flow) */}
            {isNewQuotation && (
              <div className="border rounded-lg shadow-sm  mb-4">
                <div className="w-full flex items-center gap-2 px-6 py-4 bg-gray-100">
                  <span className="font-semibold">Import Members</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => download("csv")}
                      className="bg-transparent"
                    >
                      Download CSV Template
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => download("excel")}
                      className="bg-transparent"
                    >
                      Download Excel Template
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <input
                      type="file"
                      accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={(e) =>
                        handleFileSelect(e.target.files?.[0] ?? null)
                      }
                    />
                    <Button
                      onClick={handleUpload}
                      disabled={
                        !selectedFile ||
                        validating ||
                        uploading ||
                        validationErrors.length > 0
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {uploading ? "Uploading..." : "Upload"}
                    </Button>
                  </div>

                  {validationErrors.length > 0 && (
                    <div className="rounded-md border p-3 text-sm text-red-600 bg-red-50">
                      <div className="font-semibold mb-1">
                        Validation Errors
                      </div>
                      <ul className="list-disc ml-5 space-y-1">
                        {validationErrors.slice(0, 10).map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                      {validationErrors.length > 10 && (
                        <p className="mt-2 text-sm text-gray-600">
                          + {validationErrors.length - 10} more errors not
                          displayed.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

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
                    members={currentQuotation?.members || []}
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

            <div className="border rounded-lg shadow-sm mb-4">
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
                type="button"
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
                disabled={loading.create || loading.update}
              >
                {loading.create || loading.update ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={handleComputePreview}
                disabled={!uploadedMembersRaw?.length}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Preview (Compute)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupLifeQuotationDetail;
