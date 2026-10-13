// src/components/groupLife/MemberManagementTable.tsx
// @ts-nocheck

import { useState, useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../UI/new-button";
import { Input } from "../UI/new-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../UI/table";
import { Pencil, Trash2, Plus, Save, X, Calendar, Upload, ChevronLeft, ChevronRight, RefreshCw, Search, CheckSquare, Square, Trash } from "lucide-react";
import type { GroupLifeMember } from "../../types/groupLifeQuotation";
import {
  ButtonDismissDialog,
  DialogHeader,
  DialogTitle,
} from "../UI/new-dialog";
import { Label } from "../UI/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../UI/new-select";
import { formatCurrency } from "../../utils/ui-utilities";
import { 
  savePolicyMember, 
  removePolicyMember,
  fetchPolicyMembers,
  selectGroupLifeQuotations
} from "../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";
import { useToast } from "../UI/use-toast";

interface MemberManagementTableProps {
  members?: GroupLifeMember[];
  onAddMember?: (member: Omit<GroupLifeMember, "id">) => void;
  onUpdateMember?: (index: number, member: GroupLifeMember) => void;
  onDeleteMember?: (index: number) => void;
  onRefreshMembers?: () => void;
  groupFactorAmount?: number;
  policyNo?: string;
  endorsementNo?: string;
  readOnly?: boolean;
  /** Cover start the Age Next Birthday is measured from; defaults to today. */
  coverStartDate?: string;
  onBulkDelete?: (memberIds: string[]) => void;
  onBulkAction?: (action: string, memberIds: string[]) => void;
}

interface CoverOption {
  coverCode: string;
  coverDescription: string;
  value: number;
  rate: number;
  premiumValue: number;
}

export default function MemberManagementTable({
  members: propMembers,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onRefreshMembers,
  groupFactorAmount,
  policyNo,
  endorsementNo,
  readOnly = false,
  coverStartDate,
  onBulkDelete,
  onBulkAction,
}: MemberManagementTableProps) {
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  let location: any = null;
  let searchParams: any = null;
  try {
    location = useLocation();
    [searchParams] = useSearchParams();
  } catch (e) {
    // Graceful fallback if rendered outside Router context
  }

  // Get members from Redux state
  const { currentMembers, loading } = useSelector(selectGroupLifeQuotations);
  // Use Redux state as the primary source, props as fallback
  const members = currentMembers && currentMembers.length > 0 ? currentMembers : propMembers || [];

  // Fallback to URL search params, location state, or member list if props are not provided
  const effectiveEndorsementNo = 
    endorsementNo || 
    location?.state?.endorsementNo || 
    searchParams?.get("endorsementNo") || 
    (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("endorsementNo") : null) || 
    members.find((m: any) => m.endorsementNo)?.endorsementNo || 
    currentMembers?.find((m: any) => m.endorsementNo)?.endorsementNo || 
    "";

  const effectivePolicyNo = 
    policyNo || 
    location?.state?.policyNo || 
    searchParams?.get("policyNo") || 
    (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("policyNo") : null) || 
    members.find((m: any) => m.policyNo)?.policyNo || 
    "";
  
  // ✅ SEARCH STATE
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // ✅ CHECKBOX STATE
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ FILTERED MEMBERS based on search
  const filteredMembers = members.filter((member) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    
    // Search across multiple fields
    const searchableFields = [
      member.surname || "",
      member.otherNames || "",
      member.employeeNames || "",
      member.membersNo || "",
      member.staffNo || "",
      member.memberId || "",
      member.id || "",
    ];
    
    // Also search in combined name
    const fullName = `${member.surname || ""} ${member.otherNames || ""} ${member.employeeNames || ""}`.toLowerCase();
    
    return (
      fullName.includes(query) ||
      searchableFields.some(field => field.toLowerCase().includes(query))
    );
  });

  // ✅ Get member ID helper
  const getMemberId = (member: GroupLifeMember): string => {
    return member.id || member.memberId || member.memberID || String(member.membersNo || `temp-${Math.random()}`);
  };

  // ✅ Checkbox handlers
  const handleSelectMember = (memberId: string, checked: boolean) => {
    const newSelected = new Set(selectedMembers);
    if (checked) {
      newSelected.add(memberId);
    } else {
      newSelected.delete(memberId);
    }
    setSelectedMembers(newSelected);
    setSelectAll(newSelected.size === filteredMembers.length && filteredMembers.length > 0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredMembers.map(m => getMemberId(m));
      setSelectedMembers(new Set(allIds));
    } else {
      setSelectedMembers(new Set());
    }
    setSelectAll(checked);
  };

  // ✅ Check if a member is selected
  const isMemberSelected = (memberId: string): boolean => {
    return selectedMembers.has(memberId);
  };

  // ✅ Bulk Delete Handler
  const handleBulkDelete = async () => {
    if (selectedMembers.size === 0) {
      toast({
        title: "No members selected",
        description: "Please select at least one member to delete.",
        variant: "default",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedMembers.size} selected member(s)?`)) {
      return;
    }

    try {
      const memberIds = Array.from(selectedMembers);
      
      // If onBulkDelete prop is provided, use it
      if (onBulkDelete) {
        await onBulkDelete(memberIds);
      } else {
        // Otherwise, delete each member individually using Redux
        const deletePromises = memberIds.map(id => 
          dispatch(removePolicyMember(id)).unwrap()
        );
        await Promise.all(deletePromises);
      }

      toast({
        title: "✅ Members Deleted Successfully",
        description: `${memberIds.length} member(s) have been removed from the policy.`,
        variant: "default",
        duration: 4000,
      });

      // Refresh members list
      await fetchMembers();
      
      // Clear selection
      setSelectedMembers(new Set());
      setSelectAll(false);

    } catch (error: any) {
      toast({
        title: "❌ Failed to Delete Members",
        description: error || "An error occurred while deleting the selected members.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // ✅ Handle search toggle
  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    } else {
      setSearchQuery("");
    }
  };

  // ✅ Handle click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current && 
        !searchContainerRef.current.contains(event.target as Node) &&
        isSearchOpen
      ) {
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen]);

  // ✅ Handle Escape key to close search
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isSearchOpen]);

  // ✅ Pagination with filtered members
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const totalFilteredMembers = filteredMembers.length;

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
    // Clear selection when search changes
    setSelectedMembers(new Set());
    setSelectAll(false);
  }, [searchQuery]);

  // Reset selection when members change
  useEffect(() => {
    setSelectedMembers(new Set());
    setSelectAll(false);
  }, [members]);

  // Age Next Birthday, same rule as the API's compute/anb (PremiumCalculator.AgeNextBirthday):
  // years between DOB and the cover start, +1 when the birth month is on/before the start month.
  const calculateANB = (dateOfBirth: string) => {
    if (!dateOfBirth) return 0;
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) return 0;
    const parsedStart = coverStartDate ? new Date(coverStartDate) : new Date();
    const asOf = isNaN(parsedStart.getTime()) ? new Date() : parsedStart;
    const yearsDiff = asOf.getFullYear() - birthDate.getFullYear();
    return birthDate.getMonth() <= asOf.getMonth() ? yearsDiff + 1 : yearsDiff;
  };

  const getFullName = (member: GroupLifeMember) =>
    [member.surname, member.otherNames || member.employeeNames]
      .map((part) => (part || "").trim())
      .filter(Boolean)
      .join(" ");

  const calculateTotalEmolument = (data = formData) => {
    return (
      (data.basicSalary || 0) +
      (data.housing || 0) +
      (data.transport || 0) +
      (data.otherAmount || 0)
    );
  };

  const calculateSumInsured = (emolument: number) => {
    return emolument;
  };

  const calculatePremium = (sumInsured: number, rate: number) => {
    return (sumInsured * rate) / 100;
  };

  const calculateAllTotals = (data = formData) => {
    const totalEmolument = calculateTotalEmolument(data);
    const sumInsured = calculateSumInsured(totalEmolument);
    const premium = calculatePremium(sumInsured, data.fixedPremiumRate || 0);
    const sharePercent = data.ourSharePercent || 100;

    return {
      totalEmolument,
      totalSumInsured: sumInsured,
      totalPremium: premium,
      shareSumInsured: (sumInsured * sharePercent) / 100,
      sharePremiumDue: (premium * sharePercent) / 100,
      sumInsured: sumInsured,
      grossPremium: premium,
    };
  };

  const handleOpenDialog = (index: number | null = null) => {
    const activeEndorsementNo = effectiveEndorsementNo || endorsementNo || members.find((m: any) => m.endorsementNo)?.endorsementNo || "";
    const activePolicyNo = effectivePolicyNo || policyNo || "";

    if (index !== null) {
      const member = members[index] as any;
      const dateOfBirth = member.dateOfBirth || member.dobDate ? (member.dateOfBirth || member.dobDate).split("T")[0] : "";
      
      setFormData({
        membersNo: member.membersNo || member.staffNo || "",
        surname: member.surname || "",
        otherNames: member.otherNames || member.employeeNames || "",
        sex: member.sex || "",
        dateOfBirth: dateOfBirth,
        ageANB: member.age || member.anb || calculateANB(dateOfBirth),
        startDate: member.startDate || member.hireDate ? (member.startDate || member.hireDate).split("T")[0] : new Date().toISOString().split("T")[0],
        expiryDate: member.expiryDate ? member.expiryDate.split("T")[0] : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
        basicSalary: member.basicSalary || 0,
        housing: member.housing || member.housingAllowance || 0,
        transport: member.transport || member.transportAllowance || 0,
        otherAmount: member.otherAmount || 0,
        totalEmolument: member.totalEmolument || member.tEmolument || 0,
        policyNo: member.policyNo || activePolicyNo,
        endorsementNo: member.endorsementNo || activeEndorsementNo,
        numberType: member.numberType || "AUTO",
        serialNo: member.serialNo || "",
        freqOfPayment: member.freqOfPayment || member.field7 || "Monthly",
        duration: member.duration || member.a1 || 12,
        fixedPremiumRate: member.fixedPremiumRate || member.premiumRate || 0,
        ourSharePercent: member.ourSharePercent || 100,
        loanAmount: member.loanAmount || 0,
        totalSumInsured: member.totalSumInsured || member.sumInsured || member.a9 || 0,
        totalPremium: member.totalPremium || member.grossPremium || member.a10 || 0,
        shareSumInsured: member.shareSumInsured || 0,
        sharePremiumDue: member.sharePremiumDue || 0,
        sumInsured: member.sumInsured || member.a9 || 0,
        grossPremium: member.grossPremium || member.a10 || 0,
        coverOptions: member.coverOptions || [
          { coverCode: "GFMW001", coverDescription: "Death (from whatever cause)", value: 0, rate: 0, premiumValue: 0 },
          { coverCode: "GFMW002", coverDescription: "TOTAL PERMANENT DISABILITY(ACCIDENT/SICKNESS)", value: 0, rate: 0, premiumValue: 0 },
          { coverCode: "GFMW003", coverDescription: "OTHER PERMANENT DISABILITY", value: 0, rate: 0, premiumValue: 0 },
          { coverCode: "GFMW004", coverDescription: "INCOME LOSS (FOLLOWING ACCIDENT OR SICKNESS) HUST", value: 0, rate: 0, premiumValue: 0 },
          { coverCode: "GFMW005", coverDescription: "MEDICAL EXPENSES FOLLOWING ACCIDENT UP TO 50 DAYS", value: 0, rate: 0, premiumValue: 0 },
        ],
      });
      setEditingIndex(index);
      setEditingMemberId(member.id || member.memberId || member.memberID || null);
    } else {
      setFormData({
        membersNo: "",
        surname: "",
        otherNames: "",
        sex: "",
        dateOfBirth: "",
        ageANB: 0,
        startDate: new Date().toISOString().split("T")[0],
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
        basicSalary: 0,
        housing: 0,
        transport: 0,
        otherAmount: 0,
        totalEmolument: 0,
        policyNo: activePolicyNo,
        endorsementNo: activeEndorsementNo,
        numberType: "AUTO",
        serialNo: "",
        freqOfPayment: "Monthly",
        duration: 12,
        fixedPremiumRate: 0,
        ourSharePercent: 100,
        loanAmount: 0,
        totalSumInsured: 0,
        totalPremium: 0,
        shareSumInsured: 0,
        sharePremiumDue: 0,
        sumInsured: 0,
        grossPremium: 0,
        coverOptions: [
          { coverCode: "GFMW001", coverDescription: "Death (from whatever cause)", value: 0, rate: 0, premiumValue: 0 },
          { coverCode: "GFMW002", coverDescription: "TOTAL PERMANENT DISABILITY(ACCIDENT/SICKNESS)", value: 0, rate: 0, premiumValue: 0 },
          { coverCode: "GFMW003", coverDescription: "OTHER PERMANENT DISABILITY", value: 0, rate: 0, premiumValue: 0 },
          { coverCode: "GFMW004", coverDescription: "INCOME LOSS (FOLLOWING ACCIDENT OR SICKNESS) HUST", value: 0, rate: 0, premiumValue: 0 },
          { coverCode: "GFMW005", coverDescription: "MEDICAL EXPENSES FOLLOWING ACCIDENT UP TO 50 DAYS", value: 0, rate: 0, premiumValue: 0 },
        ],
      });
      setEditingIndex(null);
      setEditingMemberId(null);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingIndex(null);
    setEditingMemberId(null);
  };

  const handleFieldChange = (field: string, value: any) => {
    const updatedData = { ...formData, [field]: value };
    
    if (field === 'dateOfBirth') {
      updatedData.ageANB = calculateANB(value);
    }
    
    if (['basicSalary', 'housing', 'transport', 'otherAmount'].includes(field)) {
      const totals = calculateAllTotals(updatedData);
      updatedData.totalEmolument = totals.totalEmolument;
      updatedData.totalSumInsured = totals.totalSumInsured;
      updatedData.totalPremium = totals.totalPremium;
      updatedData.shareSumInsured = totals.shareSumInsured;
      updatedData.sharePremiumDue = totals.sharePremiumDue;
      updatedData.sumInsured = totals.sumInsured;
      updatedData.grossPremium = totals.grossPremium;
    }
    
    if (field === 'fixedPremiumRate') {
      const totals = calculateAllTotals(updatedData);
      updatedData.totalPremium = totals.totalPremium;
      updatedData.sharePremiumDue = totals.sharePremiumDue;
      updatedData.grossPremium = totals.grossPremium;
    }
    
    if (field === 'ourSharePercent') {
      const totals = calculateAllTotals(updatedData);
      updatedData.shareSumInsured = totals.shareSumInsured;
      updatedData.sharePremiumDue = totals.sharePremiumDue;
    }
    
    setFormData(updatedData);
  };

  const handleCoverChange = (index: number, field: string, value: any) => {
    const updatedCovers = [...formData.coverOptions];
    updatedCovers[index] = { ...updatedCovers[index], [field]: value };
    
    if (field === 'value' || field === 'rate') {
      updatedCovers[index].premiumValue = 
        (updatedCovers[index].value || 0) * (updatedCovers[index].rate || 0) / 1000;
    }
    
    setFormData({ ...formData, coverOptions: updatedCovers });
  };

  const handleGetANB = () => {
    if (!formData.dateOfBirth) {
      toast({
        title: "Error",
        description: "Please enter Date of Birth first",
        variant: "destructive",
      });
      return;
    }
    const anb = calculateANB(formData.dateOfBirth);
    setFormData({ ...formData, ageANB: anb });
  };

  // ✅ SAVE MEMBER - Uses Redux Thunk
  const handleSaveMember = async () => {
    // Check required fields
    if (!formData.surname || !formData.otherNames || !formData.sex || !formData.dateOfBirth) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields: Surname, Other Names, Sex, and Date of Birth",
        variant: "destructive",
      });
      return;
    }

    if (!policyNo) {
      toast({
        title: "Error",
        description: "Policy number is required to save a member",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const totals = calculateAllTotals();
      
      // Prepare member data for API
      const memberData = {
        policyNo: policyNo,
        endorsementNo: formData.endorsementNo || endorsementNo || "",
        numberType: formData.numberType || "AUTO",
        membersNo: formData.membersNo || "",
        serialNo: formData.serialNo || "",
        surname: formData.surname,
        otherNames: formData.otherNames,
        sex: formData.sex,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString(),
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : new Date().toISOString(),
        freqOfPayment: formData.freqOfPayment || "Monthly",
        duration: formData.duration || 12,
        age: formData.ageANB || calculateANB(formData.dateOfBirth),
        fixedPremiumRate: formData.fixedPremiumRate || 0,
        ourSharePercent: formData.ourSharePercent || 100,
        basicSalary: formData.basicSalary || 0,
        housing: formData.housing || 0,
        transport: formData.transport || 0,
        otherAmount: formData.otherAmount || 0,
      };

      // Dispatch the save action
      const result = await dispatch(savePolicyMember({
        policyNo: policyNo,
        memberData: memberData
      })).unwrap();

      // ✅ Success Toast
      toast({
        title: "✅ Member Saved Successfully",
        description: `${formData.surname} ${formData.otherNames} has been added to the policy.`,
        variant: "default",
        duration: 4000,
      });

      // Refresh members list
      await fetchMembers();

      // Close dialog after save
      handleCloseDialog();

    } catch (error: any) {
      // ❌ Error Toast
      toast({
        title: "❌ Failed to Save Member",
        description: error || "An error occurred while saving the member. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ DELETE MEMBER - Uses Redux Thunk
  const handleDeleteMember = async (index: number) => {
    const member = filteredMembers[index];
    const memberId = getMemberId(member);
    
    if (!memberId) {
      toast({
        title: "Error",
        description: "Member ID not found",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete member ${member.surname} ${member.otherNames}?`)) {
      return;
    }

    try {
      await dispatch(removePolicyMember(String(memberId))).unwrap();
      
      // ✅ Success Toast
      toast({
        title: "🗑️ Member Deleted Successfully",
        description: `${member.surname} ${member.otherNames} has been removed from the policy.`,
        variant: "default",
        duration: 4000,
      });

      await fetchMembers();

    } catch (error: any) {
      // ❌ Error Toast
      toast({
        title: "❌ Failed to Delete Member",
        description: error || "An error occurred while deleting the member.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // ✅ Fetch members when policy number changes
  const fetchMembers = async () => {
    const targetPolicyNo = policyNo || effectivePolicyNo;
    const targetEndorsementNo = endorsementNo || effectiveEndorsementNo;

    if (!targetPolicyNo) {
      console.warn("⚠️ No policy number provided, skipping member fetch");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("🔍 Fetching members for policy:", targetPolicyNo, "endorsement:", targetEndorsementNo);
      
      const result = await dispatch(fetchPolicyMembers({ 
        policyNo: targetPolicyNo, 
        endorsementNo: targetEndorsementNo 
      })).unwrap();
      
      console.log("✅ Members loaded from API:", result);
      console.log("📊 Number of members:", result?.length || 0);
      
      // If onRefreshMembers is provided, call it to update parent
      if (onRefreshMembers) {
        onRefreshMembers();
      }
    } catch (error: any) {
      console.error("❌ Error fetching members:", error);
      toast({
        title: "Error",
        description: error || "Failed to load members",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add this debug useEffect to see what's in the Redux state
  useEffect(() => {
    console.log("📊 Current members from Redux:", members);
    console.log("📊 Members count:", members?.length || 0);
  }, [members]);

  // Fetch members on mount and when policyNo or endorsementNo changes
  useEffect(() => {
    if (policyNo || effectivePolicyNo) {
      fetchMembers();
    }
  }, [policyNo, endorsementNo, effectivePolicyNo, effectiveEndorsementNo]);

  // Reset to first page when members change
  useEffect(() => {
    setCurrentPage(1);
  }, [members.length]);

  // Form state
  const [formData, setFormData] = useState({
    // Personal Details
    membersNo: "",
    surname: "",
    otherNames: "",
    sex: "",
    dateOfBirth: "",
    ageANB: 0,
    startDate: "",
    expiryDate: "",
    
    // Employment Details
    basicSalary: 0,
    housing: 0,
    transport: 0,
    otherAmount: 0,
    totalEmolument: 0,
    
    // Policy Details
    policyNo: policyNo || effectivePolicyNo || "",
    endorsementNo: endorsementNo || effectiveEndorsementNo || "",
    numberType: "AUTO",
    serialNo: "",
    freqOfPayment: "Monthly",
    duration: 12,
    fixedPremiumRate: 0,
    ourSharePercent: 100,
    loanAmount: 0,
    
    // Computed Fields
    totalSumInsured: 0,
    totalPremium: 0,
    shareSumInsured: 0,
    sharePremiumDue: 0,
    sumInsured: 0,
    grossPremium: 0,
    
    // Cover Options
    coverOptions: [
      { coverCode: "GFMW001", coverDescription: "Death (from whatever cause)", value: 0, rate: 0, premiumValue: 0 },
      { coverCode: "GFMW002", coverDescription: "TOTAL PERMANENT DISABILITY(ACCIDENT/SICKNESS)", value: 0, rate: 0, premiumValue: 0 },
      { coverCode: "GFMW003", coverDescription: "OTHER PERMANENT DISABILITY", value: 0, rate: 0, premiumValue: 0 },
      { coverCode: "GFMW004", coverDescription: "INCOME LOSS (FOLLOWING ACCIDENT OR SICKNESS) HUST", value: 0, rate: 0, premiumValue: 0 },
      { coverCode: "GFMW005", coverDescription: "MEDICAL EXPENSES FOLLOWING ACCIDENT UP TO 50 DAYS", value: 0, rate: 0, premiumValue: 0 },
    ] as CoverOption[],
  });

  // Keep formData in sync when effectiveEndorsementNo or effectivePolicyNo becomes available
  useEffect(() => {
    if (effectiveEndorsementNo && !formData.endorsementNo) {
      setFormData(prev => ({
        ...prev,
        endorsementNo: effectiveEndorsementNo
      }));
    }
    if (effectivePolicyNo && !formData.policyNo) {
      setFormData(prev => ({
        ...prev,
        policyNo: effectivePolicyNo
      }));
    }
  }, [effectiveEndorsementNo, effectivePolicyNo]);

  // Calculate totals for filtered members
  const totalSumInsured = filteredMembers.reduce(
    (sum, member) => sum + (member.totalSumInsured || member.sumInsured || member.a9 || 0),
    0
  );
  const totalPremium = filteredMembers.reduce(
    (sum, member) => sum + (member.totalPremium || member.grossPremium || member.a10 || 0),
    0
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading members...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ✅ Header with Search, Bulk Actions, and Add Member */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">
            Members ({filteredMembers.length})
            {searchQuery && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                (filtered from {members.length})
              </span>
            )}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchMembers}
            className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
            title="Refresh members"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* ✅ Bulk Actions */}
          {!readOnly && selectedMembers.size > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-sm text-gray-600">
                {selectedMembers.size} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="h-9 px-3"
              >
                <Trash className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          )}

          {/* ✅ Search Container with Expand Animation */}
          <div 
            ref={searchContainerRef}
            className="flex items-center gap-2"
          >
            <div
              className={`
                flex items-center transition-all duration-300 ease-in-out overflow-hidden
                ${isSearchOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'}
              `}
            >
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by name, ID, or staff no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* ✅ Search Toggle Button */}
            <Button
              variant={isSearchOpen ? "default" : "outline"}
              size="sm"
              onClick={toggleSearch}
              className={`
                h-9 px-3 transition-colors duration-200
                ${isSearchOpen ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-gray-600 hover:text-blue-600'}
              `}
              title={isSearchOpen ? "Close search" : "Search members"}
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* ✅ Add Member Button */}
          {!readOnly && (
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-blue-600 hover:bg-blue-700 text-white data-add-member-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          )}
        </div>
      </div>

      {/* ✅ Search Results Info */}
      {searchQuery && filteredMembers.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <p className="text-yellow-800">
            No members found matching "<strong>{searchQuery}</strong>"
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="text-sm text-blue-600 hover:text-blue-800 underline mt-1"
          >
            Clear search
          </button>
        </div>
      )}

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {/* ✅ Checkbox Header */}
              {!readOnly && (
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    title="Select all members"
                  />
                </TableHead>
              )}
              <TableHead className="w-12 font-semibold">#</TableHead>
              <TableHead className="font-semibold">Members No</TableHead>
              <TableHead className="font-semibold">Full Name</TableHead>
              <TableHead className="font-semibold">Sex</TableHead>
              <TableHead className="font-semibold">Date of Birth</TableHead>
              <TableHead className="font-semibold text-right">Age</TableHead>
              <TableHead className="font-semibold text-right">Emolument</TableHead>
              <TableHead className="font-semibold text-right">Sum Insured</TableHead>
              <TableHead className="font-semibold text-right">Premium</TableHead>
              <TableHead className="text-center font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                  {searchQuery ? (
                    <>
                      <p>No members found matching "<strong>{searchQuery}</strong>"</p>
                      <p className="text-sm mt-1">Try adjusting your search criteria</p>
                    </>
                  ) : (
                    <>
                      <p>No members found for this policy.</p>
                      <p className="text-sm mt-1">Click "Add Member" to add a new member.</p>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paginatedMembers.map((member, index) => {
                const actualIndex = (currentPage - 1) * pageSize + index;
                const memberId = getMemberId(member);
                const isSelected = isMemberSelected(memberId);
                
                return (
                  <TableRow 
                    key={memberId} 
                    className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    {/* ✅ Checkbox Cell */}
                    {!readOnly && (
                      <TableCell className="w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectMember(memberId, e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          title={`Select ${member.surname} ${member.otherNames}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{actualIndex + 1}</TableCell>
                    <TableCell>{member.membersNo || member.staffNo || "—"}</TableCell>
                    <TableCell className="font-medium">{getFullName(member) || "—"}</TableCell>
                    <TableCell>{member.sex || "—"}</TableCell>
                    <TableCell>{formatDate(member.dateOfBirth || member.dobDate)}</TableCell>
                    <TableCell className="text-right">
                      {member.age || member.anb || calculateANB(member.dateOfBirth || member.dobDate) || "—"}
                    </TableCell>
                    {/* Loan uploads store no emolument: the disbursed amount (A9, 100% sum insured) is the emolument. */}
                    <TableCell className="text-right">{formatCurrency(member.totalEmolument || member.tEmolument || member.a9 || 0)}</TableCell>
                    <TableCell className="text-right text-blue-700 font-medium">
                      {formatCurrency(member.totalSumInsured || member.sumInsured || member.a9 || 0)}
                    </TableCell>
                    <TableCell className="text-right text-green-700 font-medium">
                      {formatCurrency(member.totalPremium || member.grossPremium || member.a10 || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMember(actualIndex)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                            title={`Delete ${member.surname} ${member.otherNames}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            {filteredMembers.length > 0 && (
              <TableRow className="bg-gray-100 font-semibold">
                {!readOnly && <TableCell></TableCell>}
                <TableCell colSpan={7} className="text-right">Totals:</TableCell>
                <TableCell className="text-right text-blue-700">
                  {formatCurrency(totalSumInsured)}
                </TableCell>
                <TableCell className="text-right text-green-700">
                  {formatCurrency(totalPremium)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ✅ Pagination with filtered members */}
      {filteredMembers.length > pageSize && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border">
          <span className="text-sm text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredMembers.length)} of {filteredMembers.length} members
            {searchQuery && (
              <span className="ml-1 text-gray-400">
                (filtered)
              </span>
            )}
            {selectedMembers.size > 0 && (
              <span className="ml-2 text-blue-600">
                • {selectedMembers.size} selected
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="h-8 px-3"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            <span className="px-3 py-1 text-sm bg-white border rounded-md">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="h-8 px-3"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Member Dialog - Keep the same as before */}
      <ButtonDismissDialog
        open={isDialogOpen}
        onOpenChange={() => setIsDialogOpen(false)}
        maxWidth="1000px"
        className="w-full"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {editingIndex !== null ? "Edit Member Details" : "New Member Details"}
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            {editingIndex !== null ? "Update the member's information below" : "Fill in the member's details below"}
          </p>
        </DialogHeader>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {/* Personal Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            <div className="col-span-3 pt-2 border-b pb-2">
              <h4 className="text-sm font-semibold text-blue-600">Personal Details</h4>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberType" className="text-sm font-medium">Number Type</Label>
              <Select
                value={formData.numberType}
                onValueChange={(value) => handleFieldChange("numberType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="AUTO" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTO">AUTO</SelectItem>
                  <SelectItem value="MANUAL">MANUAL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="membersNo" className="text-sm font-medium">Members No</Label>
              <Input
                id="membersNo"
                value={formData.membersNo}
                onChange={(e) => handleFieldChange("membersNo", e.target.value)}
                placeholder="[AUTO]"
                disabled={formData.numberType === "AUTO"}
                className={formData.numberType === "AUTO" ? "bg-gray-50" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="surname" className="text-sm font-medium">Surnames <span className="text-red-500">*</span></Label>
              <Input
                id="surname"
                value={formData.surname}
                onChange={(e) => handleFieldChange("surname", e.target.value)}
                placeholder="Enter surname"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherNames" className="text-sm font-medium">Othernames <span className="text-red-500">*</span></Label>
              <Input
                id="otherNames"
                value={formData.otherNames}
                onChange={(e) => handleFieldChange("otherNames", e.target.value)}
                placeholder="Enter other names"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleFieldChange("startDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate" className="text-sm font-medium">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleFieldChange("expiryDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="text-sm font-medium">Date Of Birth <span className="text-red-500">*</span></Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleFieldChange("dateOfBirth", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sex" className="text-sm font-medium">Sex <span className="text-red-500">*</span></Label>
              <Select
                value={formData.sex}
                onValueChange={(value) => handleFieldChange("sex", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="- select -" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ageANB" className="text-sm font-medium">Age(ANB)</Label>
              <div className="flex gap-2">
                <Input
                  id="ageANB"
                  type="number"
                  value={formData.ageANB}
                  onChange={(e) => handleFieldChange("ageANB", Number(e.target.value))}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleGetANB}
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Get ANB
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanAmount" className="text-sm font-medium">Loan Amount</Label>
              <Input
                id="loanAmount"
                type="number"
                value={formData.loanAmount}
                onChange={(e) => handleFieldChange("loanAmount", Number(e.target.value))}
                placeholder="0.00"
              />
            </div>

            {/* Policy Details */}
            <div className="col-span-3 pt-4 border-b pb-2">
              <h4 className="text-sm font-semibold text-blue-600">Policy Details</h4>
            </div>

            <div className="space-y-2">
              <Label htmlFor="policyNo" className="text-sm font-medium">Policy Number</Label>
              <Input
                id="policyNo"
                value={formData.policyNo || effectivePolicyNo || ""}
                className="bg-gray-50"
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endorsementNo" className="text-sm font-medium">Endorsement No</Label>
              <Input
                id="endorsementNo"
                value={formData.endorsementNo || effectiveEndorsementNo || ""}
                className="bg-gray-50"
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNo" className="text-sm font-medium">Serial No</Label>
              <Input
                id="serialNo"
                value={formData.serialNo}
                onChange={(e) => handleFieldChange("serialNo", e.target.value)}
                placeholder="Enter serial number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="freqOfPayment" className="text-sm font-medium">Freq. Of Payment</Label>
              <Select
                value={formData.freqOfPayment}
                onValueChange={(value) => handleFieldChange("freqOfPayment", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="- select -" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Half-Yearly">Half-Yearly</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium">Duration (Loan Term)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => handleFieldChange("duration", Number(e.target.value))}
                placeholder="12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fixedPremiumRate" className="text-sm font-medium">Fixed Premium Rate (%)</Label>
              <Input
                id="fixedPremiumRate"
                type="number"
                step="0.01"
                value={formData.fixedPremiumRate}
                onChange={(e) => handleFieldChange("fixedPremiumRate", Number(e.target.value))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ourSharePercent" className="text-sm font-medium">Our Share (%)</Label>
              <Input
                id="ourSharePercent"
                type="number"
                value={formData.ourSharePercent}
                onChange={(e) => handleFieldChange("ourSharePercent", Number(e.target.value))}
                placeholder="100"
              />
            </div>

            {/* Salary Breakdown */}
            <div className="col-span-3 pt-4 border-b pb-2">
              <h4 className="text-sm font-semibold text-blue-600">Salary Breakdown</h4>
            </div>

            <div className="space-y-2">
              <Label htmlFor="basicSalary" className="text-sm font-medium">Basic Salary</Label>
              <Input
                id="basicSalary"
                type="number"
                value={formData.basicSalary}
                onChange={(e) => handleFieldChange("basicSalary", Number(e.target.value))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="housing" className="text-sm font-medium">Housing Allowance</Label>
              <Input
                id="housing"
                type="number"
                value={formData.housing}
                onChange={(e) => handleFieldChange("housing", Number(e.target.value))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transport" className="text-sm font-medium">Transport Allowance</Label>
              <Input
                id="transport"
                type="number"
                value={formData.transport}
                onChange={(e) => handleFieldChange("transport", Number(e.target.value))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherAmount" className="text-sm font-medium">Other Allowance</Label>
              <Input
                id="otherAmount"
                type="number"
                value={formData.otherAmount}
                onChange={(e) => handleFieldChange("otherAmount", Number(e.target.value))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalEmolument" className="text-sm font-medium">Total Emolument</Label>
              <Input
                id="totalEmolument"
                type="number"
                value={formData.totalEmolument}
                readOnly
                className="bg-gray-50 font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalSumInsured" className="text-sm font-medium">Total Sum Insured</Label>
              <Input
                id="totalSumInsured"
                type="number"
                value={formData.totalSumInsured}
                readOnly
                className="bg-gray-50 font-semibold text-blue-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalPremium" className="text-sm font-medium">Total Premium</Label>
              <Input
                id="totalPremium"
                type="number"
                value={formData.totalPremium}
                readOnly
                className="bg-gray-50 font-semibold text-green-600"
              />
            </div>

            {/* Premium Details */}
            <div className="col-span-3 pt-4 border-b pb-2">
              <h4 className="text-sm font-semibold text-blue-600">Premium Details</h4>
            </div>

            <div className="col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 border">
                <p className="text-sm text-gray-500">Staff Total SumInsured</p>
                <p className="text-lg font-semibold text-blue-700">
                  {formatCurrency(formData.totalSumInsured)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border">
                <p className="text-sm text-gray-500">Staff Total Premium</p>
                <p className="text-lg font-semibold text-green-700">
                  {formatCurrency(formData.totalPremium)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border">
                <p className="text-sm text-gray-500">Share SumInsured</p>
                <p className="text-lg font-semibold text-purple-700">
                  {formatCurrency(formData.shareSumInsured)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border">
                <p className="text-sm text-gray-500">Share Premium Due</p>
                <p className="text-lg font-semibold text-orange-700">
                  {formatCurrency(formData.sharePremiumDue)}
                </p>
              </div>
            </div>

            {/* Aggregate Premium Details */}
            <div className="col-span-3 pt-4 border-b pb-2">
              <h4 className="text-sm font-semibold text-blue-600">Aggregate Premium Details</h4>
            </div>

            <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-600">Sum Insured</p>
                <p className="text-xl font-bold text-blue-800">
                  {formatCurrency(formData.sumInsured)}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-600">Gross Premium</p>
                <p className="text-xl font-bold text-green-800">
                  {formatCurrency(formData.grossPremium)}
                </p>
              </div>
            </div>

            {/* Image Upload */}
            <div className="col-span-3 pt-4 border-b pb-2">
              <h4 className="text-sm font-semibold text-blue-600">Document Upload</h4>
            </div>

            <div className="col-span-3">
              <p className="text-xs text-gray-500 mb-2">Click browse to attach a picture to the system.</p>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  className="flex-1"
                />
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-1" />
                  Browse
                </Button>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveMember}
              disabled={
                isSubmitting ||
                readOnly ||
                !formData.surname ||
                !formData.otherNames ||
                !formData.sex ||
                !formData.dateOfBirth ||
                !formData.policyNo
              }
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingIndex !== null ? "Update" : "Save"}
                </>
              )}
            </Button>
          </div>
        </div>
      </ButtonDismissDialog>
    </div>
  );
}