import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from '@/hooks/use-apps'
import { useToast } from "@/components/UI/use-toast";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    OutsideDismissDialog,
} from "@/components/UI/dialog";
import { Button } from "@/components/UI/new-button";
import { Input } from "@/components/UI/new-input";
import { Label } from "@/components/UI/label";
import { Switch } from "@/components/UI/switch";
import { updateMktStaff, clearMarketingStaffMessages, selectMarketingStaff } from '@/features/reducers/companyReducers/marketingStaffSlice'
import type { MktStaff, UpdateMktStaffRequest } from '@/types/marketing-staff'

interface MarketingStaffEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: MktStaff | null
}

export function MarketingStaffEditDialog({ open, onOpenChange, staff }: MarketingStaffEditDialogProps) {
  const dispatch = useAppDispatch()
  const { loading, success, error } = useAppSelector(selectMarketingStaff)
  const { toast } = useToast()

  const [formData, setFormData] = useState<UpdateMktStaffRequest>({
    mktGrpID: "",
    groupName: "",
    staffName: "",
    groupHead: "",
    mktUnitID: "",
    mktUnit: "",
    budyear1: "",
    budyear2: "",
    curTarget: 0,
    prevTarget: 0,
    deleted: 0,
    active: 1,
    modifiedBy: "system",
  })

  useEffect(() => {
    if (staff && open) {
      setFormData({
        mktGrpID: staff.mktGrpID,
        groupName: staff.groupName,
        staffName: staff.staffName,
        groupHead: staff.groupHead,
        mktUnitID: staff.mktUnitID,
        mktUnit: staff.mktUnit,
        budyear1: staff.budyear1,
        budyear2: staff.budyear2,
        curTarget: staff.curTarget,
        prevTarget: staff.prevTarget,
        deleted: staff.deleted,
        active: staff.active,
        modifiedBy: "system",
      })
    }
  }, [staff, open])

  useEffect(() => {
    if (success.updateMktStaff) {
      toast({
        title: "Success",
        description: "Marketing staff member updated successfully.",
      })
      onOpenChange(false)
      dispatch(clearMarketingStaffMessages())
    }
  }, [success.updateMktStaff, toast, onOpenChange, dispatch])

  useEffect(() => {
    if (error.updateMktStaff) {
      toast({
        title: "Error",
        description: "Failed to update marketing staff member. Please try again.",
        variant: "destructive",
      })
      dispatch(clearMarketingStaffMessages())
    }
  }, [error.updateMktStaff, toast, dispatch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (staff) {
      dispatch(updateMktStaff({ id: staff.mktStaffID, data: formData }))
    }
  }

  const handleInputChange = (field: keyof UpdateMktStaffRequest, value: string | number) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (!staff) return null

  return (
    <OutsideDismissDialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Marketing Staff Member</DialogTitle>
          <div>Update the information for {staff.staffName}.</div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-6">
          <div className="space-y-2">
            <Label htmlFor="staffName">Staff Name *</Label>
            <Input
              id="staffName"
              value={formData.staffName}
              onChange={(e: any) => handleInputChange("staffName", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mktGrpID">Marketing Group ID *</Label>
              <Input
                id="mktGrpID"
                value={formData.mktGrpID}
                onChange={(e: any) => handleInputChange("mktGrpID", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name *</Label>
              <Input
                id="groupName"
                value={formData.groupName}
                onChange={(e: any) => handleInputChange("groupName", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupHead">Group Head *</Label>
            <Input
              id="groupHead"
              value={formData.groupHead}
              onChange={(e: any) => handleInputChange("groupHead", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mktUnitID">Marketing Unit ID *</Label>
              <Input
                id="mktUnitID"
                value={formData.mktUnitID}
                onChange={(e: any) => handleInputChange("mktUnitID", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mktUnit">Marketing Unit *</Label>
              <Input
                id="mktUnit"
                value={formData.mktUnit}
                onChange={(e: any) => handleInputChange("mktUnit", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budyear1">Budget Year 1 *</Label>
              <Input
                id="budyear1"
                value={formData.budyear1}
                onChange={(e: any) => handleInputChange("budyear1", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budyear2">Budget Year 2 *</Label>
              <Input
                id="budyear2"
                value={formData.budyear2}
                onChange={(e: any) => handleInputChange("budyear2", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="curTarget">Current Target *</Label>
              <Input
                id="curTarget"
                type="number"
                step="0.01"
                value={formData.curTarget}
                onChange={(e: any) => handleInputChange("curTarget", Number.parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prevTarget">Previous Target *</Label>
              <Input
                id="prevTarget"
                type="number"
                step="0.01"
                value={formData.prevTarget}
                onChange={(e: any) => handleInputChange("prevTarget", Number.parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active === 1}
              onCheckedChange={(checked: boolean) => handleInputChange("active", checked ? 1 : 0)}
            />
            <Label htmlFor="active">Active</Label>
          </div>

          <div className="pb-6 flex gap-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)} // @ts-ignore
              disabled={loading.updateMktStaff}
            >
              Cancel
            </Button>
            {/* @ts-ignore */}
            <Button type="submit" className="flex-1" loading={loading.updateMktStaff}>
              {loading.updateMktStaff ? "Updating..." : "Update Staff Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </OutsideDismissDialog>
  )
}
