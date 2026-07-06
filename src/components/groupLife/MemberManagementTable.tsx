// src/components/groupLife/MemberManagementTable.tsx
// @ts-nocheck

import { useState } from "react";
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
import { Pencil, Trash2, Plus, Save, X, Calendar, Upload } from "lucide-react";
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

interface MemberManagementTableProps {
  members: GroupLifeMember[];
  onAddMember: (member: Omit<GroupLifeMember, "id">) => void;
  onUpdateMember: (index: number, member: GroupLifeMember) => void;
  onDeleteMember: (index: number) => void;
  groupFactorAmount: number;
  policyNo?: string;
  readOnly?: boolean;
}

interface CoverOption {
  coverCode: string;
  coverDescription: string;
  value: number;
  rate: number;
  premiumValue: number;
}

export default function MemberManagementTable({
  members,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  groupFactorAmount,
  policyNo,
  readOnly = false,
}: MemberManagementTableProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
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
    policyNo: policyNo || "",
    endorsementNo: "",
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

  const calculateANB = (dateOfBirth: string) => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff > 6 || (monthDiff === 6 && today.getDate() >= birthDate.getDate())) {
      age += 1;
    }

    return age + 1;
  };

  const calculateTotalEmolument = () => {
    return (
      (formData.basicSalary || 0) +
      (formData.housing || 0) +
      (formData.transport || 0) +
      (formData.otherAmount || 0)
    );
  };

  const calculateSumInsured = (emolument: number) => {
    return emolument * groupFactorAmount;
  };

  const calculatePremium = (sumInsured: number, rate: number) => {
    return (sumInsured * rate) / 1000;
  };

  const calculateAllTotals = () => {
    const totalEmolument = calculateTotalEmolument();
    const sumInsured = calculateSumInsured(totalEmolument);
    const premium = calculatePremium(sumInsured, formData.fixedPremiumRate || 0);
    const sharePercent = formData.ourSharePercent || 100;

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
    if (index !== null) {
      const member = members[index] as any;
      const dateOfBirth = member.dateOfBirth ? member.dateOfBirth.split("T")[0] : "";
      
      setFormData({
        membersNo: member.membersNo || member.staffNo || "",
        surname: member.surname || "",
        otherNames: member.otherNames || member.employeeNames || "",
        sex: member.sex || "",
        dateOfBirth: dateOfBirth,
        ageANB: member.age || member.anb || calculateANB(dateOfBirth),
        startDate: member.startDate ? member.startDate.split("T")[0] : new Date().toISOString().split("T")[0],
        expiryDate: member.expiryDate ? member.expiryDate.split("T")[0] : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
        basicSalary: member.basicSalary || 0,
        housing: member.housing || member.housingAllowance || 0,
        transport: member.transport || member.transportAllowance || 0,
        otherAmount: member.otherAmount || 0,
        totalEmolument: member.totalEmolument || 0,
        policyNo: policyNo || "",
        endorsementNo: member.endorsementNo || "",
        numberType: member.numberType || "AUTO",
        serialNo: member.serialNo || "",
        freqOfPayment: member.freqOfPayment || "Monthly",
        duration: member.duration || 12,
        fixedPremiumRate: member.fixedPremiumRate || 0,
        ourSharePercent: member.ourSharePercent || 100,
        loanAmount: member.loanAmount || 0,
        totalSumInsured: member.totalSumInsured || member.sumInsured || 0,
        totalPremium: member.totalPremium || member.premium || 0,
        shareSumInsured: member.shareSumInsured || 0,
        sharePremiumDue: member.sharePremiumDue || 0,
        sumInsured: member.sumInsured || 0,
        grossPremium: member.grossPremium || 0,
        coverOptions: member.coverOptions || [
          { coverCode: "GFMW001", coverDescription: "Death (from whatever cause)", value: 0, rate: 0, premiumValue: 0 },
          { coverCode: "GFMW002", coverDescription: "TOTAL PERMANENT DISABILITY(ACCIDENT/SICKNESS)", value: 0, rate: 0, premiumValue: 0 },
          { coverCode: "GFMW003", coverDescription: "OTHER PERMANENT DISABILITY", value: 0, rate: 0, premiumValue: 0 },
          { coverCode: "GFMW004", coverDescription: "INCOME LOSS (FOLLOWING ACCIDENT OR SICKNESS) HUST", value: 0, rate: 0, premiumValue: 0 },
          { coverCode: "GFMW005", coverDescription: "MEDICAL EXPENSES FOLLOWING ACCIDENT UP TO 50 DAYS", value: 0, rate: 0, premiumValue: 0 },
        ],
      });
      setEditingIndex(index);
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
        policyNo: policyNo || "",
        endorsementNo: "",
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
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingIndex(null);
  };

  const handleFieldChange = (field: string, value: any) => {
    const updatedData = { ...formData, [field]: value };
    
    if (field === 'dateOfBirth') {
      updatedData.ageANB = calculateANB(value);
    }
    
    if (['basicSalary', 'housing', 'transport', 'otherAmount'].includes(field)) {
      const totals = calculateAllTotals();
      updatedData.totalEmolument = totals.totalEmolument;
      updatedData.totalSumInsured = totals.totalSumInsured;
      updatedData.totalPremium = totals.totalPremium;
      updatedData.shareSumInsured = totals.shareSumInsured;
      updatedData.sharePremiumDue = totals.sharePremiumDue;
      updatedData.sumInsured = totals.sumInsured;
      updatedData.grossPremium = totals.grossPremium;
    }
    
    if (field === 'fixedPremiumRate') {
      const totals = calculateAllTotals();
      updatedData.totalPremium = totals.totalPremium;
      updatedData.sharePremiumDue = totals.sharePremiumDue;
      updatedData.grossPremium = totals.grossPremium;
    }
    
    if (field === 'ourSharePercent') {
      const totals = calculateAllTotals();
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
      alert("Please enter Date of Birth first");
      return;
    }
    const anb = calculateANB(formData.dateOfBirth);
    setFormData({ ...formData, ageANB: anb });
  };

  const handleSaveMember = () => {
    if (!formData.surname || !formData.otherNames || !formData.sex || !formData.dateOfBirth) {
      alert("Please fill in all required fields: Surname, Other Names, Sex, and Date of Birth");
      return;
    }

    const totals = calculateAllTotals();
    const memberData = {
      ...formData,
      ageANB: formData.ageANB || calculateANB(formData.dateOfBirth),
      totalEmolument: formData.totalEmolument || totals.totalEmolument,
      totalSumInsured: formData.totalSumInsured || totals.totalSumInsured,
      totalPremium: formData.totalPremium || totals.totalPremium,
      shareSumInsured: formData.shareSumInsured || totals.shareSumInsured,
      sharePremiumDue: formData.sharePremiumDue || totals.sharePremiumDue,
      sumInsured: formData.sumInsured || totals.sumInsured,
      grossPremium: formData.grossPremium || totals.grossPremium,
    };

    if (editingIndex !== null) {
      onUpdateMember(editingIndex, {
        ...memberData,
        id: members[editingIndex].id,
      });
    } else {
      onAddMember(memberData);
    }

    handleCloseDialog();
  };

  const totalSumInsured = members.reduce(
    (sum, member) => sum + (member.totalSumInsured || member.sumInsured || 0),
    0
  );
  const totalPremium = members.reduce(
    (sum, member) => sum + (member.totalPremium || member.premium || 0),
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Members ({members.length})</h3>
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

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12 font-semibold">#</TableHead>
              <TableHead className="font-semibold">Members No</TableHead>
              <TableHead className="font-semibold">Surname</TableHead>
              <TableHead className="font-semibold">Other Names</TableHead>
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
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                  <p>No members added yet.</p>
                  <p className="text-sm mt-1">Click "Add Member" to get started.</p>
                </TableCell>
              </TableRow>
            ) : (
              members.map((member, index) => (
                <TableRow key={member.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{member.membersNo || member.staffNo || "—"}</TableCell>
                  <TableCell className="font-medium">{member.surname || "—"}</TableCell>
                  <TableCell>{member.otherNames || member.employeeNames || "—"}</TableCell>
                  <TableCell>{member.sex || "—"}</TableCell>
                  <TableCell>{formatDate(member.dateOfBirth)}</TableCell>
                  <TableCell className="text-right">{member.age || member.anb || 0}</TableCell>
                  <TableCell className="text-right">{formatCurrency(member.totalEmolument || 0)}</TableCell>
                  <TableCell className="text-right text-blue-700 font-medium">
                    {formatCurrency(member.totalSumInsured || member.sumInsured || 0)}
                  </TableCell>
                  <TableCell className="text-right text-green-700 font-medium">
                    {formatCurrency(member.totalPremium || member.premium || 0)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      {!readOnly && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(index)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteMember(index)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
            {members.length > 0 && (
              <TableRow className="bg-gray-100 font-semibold">
                <TableCell colSpan={8} className="text-right">Totals:</TableCell>
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

      {/* Add/Edit Member Dialog */}
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
              <Label htmlFor="sex" className="text-sm font-medium">Sex</Label>
              <Select
                value={formData.sex}
                onValueChange={(value) => handleFieldChange("sex", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="- select -" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
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
                value={formData.policyNo}
                className="bg-gray-50"
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endorsementNo" className="text-sm font-medium">Endorsement No</Label>
              <Input
                id="endorsementNo"
                value={formData.endorsementNo}
                onChange={(e) => handleFieldChange("endorsementNo", e.target.value)}
                placeholder="Enter endorsement number"
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

            {/* Product Cover Options */}
            <div className="col-span-3 pt-4 border-b pb-2">
              <h4 className="text-sm font-semibold text-blue-600">Product Cover Options</h4>
            </div>

            <div className="col-span-3 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">Cover Code</TableHead>
                    <TableHead className="font-semibold text-gray-700">Cover Description</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Value</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Rate</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Premium Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.coverOptions.map((cover, index) => (
                    <TableRow key={cover.coverCode}>
                      <TableCell className="font-medium text-gray-700">{cover.coverCode}</TableCell>
                      <TableCell className="text-gray-600 text-sm">{cover.coverDescription}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={cover.value}
                          onChange={(e) => handleCoverChange(index, "value", Number(e.target.value))}
                          className="w-24 text-right"
                          placeholder="0.0"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={cover.rate}
                          onChange={(e) => handleCoverChange(index, "rate", Number(e.target.value))}
                          className="w-20 text-right"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium text-blue-600">
                        {formatCurrency(cover.premiumValue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={handleCloseDialog}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveMember}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={
                readOnly ||
                !formData.surname ||
                !formData.otherNames ||
                !formData.sex ||
                !formData.dateOfBirth
              }
            >
              <Save className="w-4 h-4 mr-2" />
              {editingIndex !== null ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      </ButtonDismissDialog>
    </div>
  );
}