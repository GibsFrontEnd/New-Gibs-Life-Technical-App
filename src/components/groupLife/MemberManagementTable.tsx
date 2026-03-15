// @ts-nocheck
"use client";

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
} from "../ui/table";
import { Pencil, Trash2, Plus, Save, X } from "lucide-react";
import type { GroupLifeMember } from "../../types/groupLifeQuotation";
import {
  ButtonDismissDialog,
  DialogHeader,
  DialogTitle,
} from "../UI/new-dialog";
import { Label } from "../ui/label";
import { formatCurrency } from "../../utils/ui-utilities";

interface MemberManagementTableProps {
  members: GroupLifeMember[];
  onAddMember: (member: Omit<GroupLifeMember, "id">) => void;
  onUpdateMember: (index: number, member: GroupLifeMember) => void;
  onDeleteMember: (index: number) => void;
  groupFactorAmount: number;
  // NEW: hide add/edit/delete when true (used in creation flow with file import)
  readOnly?: boolean;
}

export default function MemberManagementTable({
  members,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  groupFactorAmount,
  readOnly = false,
}: MemberManagementTableProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    employeeNames: "",
    sex: "",
    dateOfBirth: "",
    anb: 0,
    totalEmolument: 0,
    rate: 0,
    staffNo: "",
    basicSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0,
    hireDate: "",
  });

  const calculateSumInsured = (emolument: number) => {
    return emolument * groupFactorAmount;
  };

  const calculatePremium = (sumInsured: number, rate: number) => {
    return (sumInsured * rate) / 1000;
  };

  const calculateANB = (dateOfBirth: string) => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Age Next Birthday calculation
    if (
      monthDiff > 6 ||
      (monthDiff === 6 && today.getDate() >= birthDate.getDate())
    ) {
      age += 1;
    }

    return age + 1;
  };

  const handleOpenDialog = (index: number | null = null) => {
    if (index !== null) {
      const member = members[index] as any;
      setFormData({
        employeeNames: member.employeeNames,
        sex: member.sex,
        dateOfBirth: member.dateOfBirth,
        anb: member.anb,
        totalEmolument: member.totalEmolument,
        rate: member.rate,
        staffNo: member.staffNo || "",
        basicSalary: member.basicSalary || 0,
        housingAllowance: member.housingAllowance || 0,
        transportAllowance: member.transportAllowance || 0,
        hireDate: member.hireDate || "",
      });
      setEditingIndex(index);
    } else {
      setFormData({
        employeeNames: "",
        sex: "",
        dateOfBirth: "",
        anb: 0,
        totalEmolument: 0,
        rate: 0,
        staffNo: "",
        basicSalary: 0,
        housingAllowance: 0,
        transportAllowance: 0,
        hireDate: "",
      });
      setEditingIndex(null);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingIndex(null);
    setFormData({
      employeeNames: "",
      sex: "",
      dateOfBirth: "",
      anb: 0,
      totalEmolument: 0,
      rate: 0,
      staffNo: "",
      basicSalary: 0,
      housingAllowance: 0,
      transportAllowance: 0,
      hireDate: "",
    });
  };

  const handleSaveMember = () => {
    // const sumInsured = calculateSumInsured(formData.totalEmolument);
    // const premium = calculatePremium(sumInsured, formData.rate);
    const anb = calculateANB(formData.dateOfBirth);

    console.log("Saving member with hire date:", formData.hireDate);

    const memberData = {
      ...formData,
      anb,
      hireDate: formData.hireDate || null,
      sumInsured: 0,
      premium: 0,
    };

    if (editingIndex !== null) {
      onUpdateMember(editingIndex, {
        ...memberData,
        id: members[editingIndex].id,
      });
    } else {
      onAddMember({
        ...memberData,
      });
    }

    handleCloseDialog();
  };

  const totalSumInsured = members.reduce(
    (sum, member) => sum + member.sumInsured,
    0
  );
  const totalPremium = members.reduce((sum, member) => sum + member.premium, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Members ({members.length})</h3>
        {!readOnly && (
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-primary hover:bg-primary/80 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        )}
      </div>

      <div className="border rounded-lg ">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Employee Names</TableHead>
                <TableHead>Sex</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead className="text-right">ANB</TableHead>
                <TableHead className="text-right">Emolument</TableHead>
                <TableHead className="text-right">Sum Insured</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Premium</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No members added yet. Import Members to get started.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member, index) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{member.employeeNames}</TableCell>
                    <TableCell>{member.sex}</TableCell>
                    <TableCell>
                      {new Date(member.dateOfBirth).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">{member.anb}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(member.totalEmolument)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(member.sumInsured)}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.rate.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(member.premium)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        {!readOnly && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(index)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteMember(index)}
                              className="text-red-600 hover:text-red-700"
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
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={6} className="text-right">
                    Totals:
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totalSumInsured)}
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totalPremium)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ButtonDismissDialog
        open={isDialogOpen}
        onOpenChange={() => setIsDialogOpen(false)}
        maxWidth="800px"
        className="w-full"
      >
        <DialogHeader>
          <DialogTitle>
            {editingIndex !== null ? "Edit Member" : "Add New Member"}
          </DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="staffNo">Staff Number *</Label>
              <Input
                id="staffNo"
                value={formData.staffNo}
                onChange={(e) =>
                  setFormData({ ...formData, staffNo: e.target.value })
                }
                placeholder="Enter staff number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeNames">Employee Names *</Label>
              <Input
                id="employeeNames"
                value={formData.employeeNames}
                onChange={(e) =>
                  setFormData({ ...formData, employeeNames: e.target.value })
                }
                placeholder="Enter employee names"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sex">Sex *</Label>
              <select
                id="sex"
                value={formData.sex}
                onChange={(e) =>
                  setFormData({ ...formData, sex: e.target.value })
                }
                className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select sex</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => {
                  const anb = calculateANB(e.target.value);
                  setFormData({
                    ...formData,
                    dateOfBirth: e.target.value,
                    anb,
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hireDate">Hire Date</Label>
              <Input
                id="hireDate"
                type="date"
                value={formData.hireDate}
                onChange={(e) =>
                  setFormData({ ...formData, hireDate: e.target.value })
                }
              />
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="anb">Age Next Birthday</Label>
              <Input
                id="anb"
                type="number"
                value={formData.anb}
                readOnly
                className="bg-muted"
              />
            </div> */}

            {/* Salary Breakdown Section */}
            <div className="col-span-3 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-3">Salary Breakdown</h4>
            </div>
            <div className="space-y-2">
              <Label htmlFor="basicSalary">Basic Salary *</Label>
              <Input
                id="basicSalary"
                type="number"
                value={formData.basicSalary}
                onChange={(e) => {
                  const basicSalary = Number.parseFloat(e.target.value) || 0;
                  const totalEmolument =
                    basicSalary +
                    formData.housingAllowance +
                    formData.transportAllowance;
                  setFormData({
                    ...formData,
                    basicSalary,
                    totalEmolument,
                  });
                }}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="housingAllowance">Housing Allowance</Label>
              <Input
                id="housingAllowance"
                type="number"
                value={formData.housingAllowance}
                onChange={(e) => {
                  const housingAllowance =
                    Number.parseFloat(e.target.value) || 0;
                  const totalEmolument =
                    formData.basicSalary +
                    housingAllowance +
                    formData.transportAllowance;
                  setFormData({
                    ...formData,
                    housingAllowance,
                    totalEmolument,
                  });
                }}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transportAllowance">Transport Allowance</Label>
              <Input
                id="transportAllowance"
                type="number"
                value={formData.transportAllowance}
                onChange={(e) => {
                  const transportAllowance =
                    Number.parseFloat(e.target.value) || 0;
                  const totalEmolument =
                    formData.basicSalary +
                    formData.housingAllowance +
                    transportAllowance;
                  setFormData({
                    ...formData,
                    transportAllowance,
                    totalEmolument,
                  });
                }}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalEmolument">Total Emolument</Label>
              <Input
                id="totalEmolument"
                type="number"
                value={formData.totalEmolument}
                readOnly
                className="bg-muted font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Rate (per 1000) *</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rate: Number.parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCloseDialog}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveMember}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={
                readOnly ||
                !formData.staffNo ||
                !formData.employeeNames ||
                !formData.sex ||
                !formData.dateOfBirth ||
                !formData.basicSalary
              }
            >
              <Save className="w-4 h-4 mr-2" />
              {editingIndex !== null ? "Update" : "Add"} Member
            </Button>
          </div>
        </div>
      </ButtonDismissDialog>
    </div>
  );
}