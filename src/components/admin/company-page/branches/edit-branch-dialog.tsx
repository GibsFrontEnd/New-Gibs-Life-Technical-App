import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/use-apps";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  OutsideDismissDialog,
} from "@/components/UI/dialog";
import { Button } from "@/components/UI/new-button";
import { Input } from "@/components/UI/new-input";
import { Label } from "@/components/UI/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/UI/new-select";
import { Textarea } from "@/components/UI/textarea";
import { Switch } from "@/components/UI/switch";
import type { Branch } from "@/types/branches";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/UI/use-toast";
import {
  selectBranch,
  updateBranch,
} from "@/features/reducers/companyReducers/branchSlice";

interface EditBranchDialogProps {
  branch: Branch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBranchDialog({
  branch,
  open,
  onOpenChange,
}: EditBranchDialogProps) {
  const dispatch = useAppDispatch();
  const { loading, success, error } = useAppSelector(selectBranch);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    branchID: "",
    regionID: "",
    stateID: "",
    branchID2: "",
    description: "",
    manager: "",
    address: "",
    mobilePhone: "",
    landPhone: "",
    email: "",
    fax: "",
    active: true,
    remarks: "",
  });

  useEffect(() => {
    if (branch) {
      setFormData({
        branchID: branch.branchID,
        regionID: branch.regionID || "",
        stateID: branch.stateID || "",
        branchID2: branch.branchID2,
        description: branch.description,
        manager: branch.manager,
        address: branch.address,
        mobilePhone: branch.mobilePhone,
        landPhone: branch.landPhone || "",
        email: branch.email,
        fax: branch.fax,
        active: branch.active,
        remarks: branch.remarks || "",
      });
    }
  }, [branch]);

  useEffect(() => {
    if (success.updateBranch) {
      toast({
        title: "Success",
        description: "Branch updated successfully.",
      });
      onOpenChange(false);
    } else if (error.updateBranch) {
      toast({
        title: "Error",
        description: "Failed to update branch. Please try again.",
        variant: "destructive",
      });
    }
  }, [success.updateBranch, error.updateBranch, toast, onOpenChange]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!branch || !formData.description || !formData.regionID) {
      toast({
        title: "Validation Error",
        description:
          "Please fill in all required fields (Description, Region).",
        variant: "destructive",
      });
      return;
    }

    const updateData: Branch = {
      ...branch,
      ...formData,
      modifiedBy: "Admin", // In real app, get from auth context
      modifiedOn: new Date().toISOString(),
    };

    dispatch(
      updateBranch({
        branchId: branch.branchID,
        data: updateData,
      })
    );
  };

  if (!branch) return null;

  return (
    <OutsideDismissDialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Branch</DialogTitle>
          <div>
            Update branch information. Fields marked with * are required.
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="branchID">Branch ID</Label>
              <Input
                id="branchID"
                value={formData.branchID}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branchID2">Branch Code</Label>
              <Input
                id="branchID2"
                value={formData.branchID2}
                onChange={(e) => handleInputChange("branchID2", e.target.value)}
                placeholder="e.g., LG"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Branch Name *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="e.g., LAGOS MAINLAND"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="regionID">Region *</Label>
              <Select
                value={formData.regionID}
                onValueChange={(value) => handleInputChange("regionID", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="001">South West (001)</SelectItem>
                  <SelectItem value="002">South South (002)</SelectItem>
                  <SelectItem value="003">North Central (003)</SelectItem>
                  <SelectItem value="004">Lagos (004)</SelectItem>
                  <SelectItem value="014">North West (014)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stateID">State</Label>
              <Select
                value={formData.stateID}
                onValueChange={(value) => handleInputChange("stateID", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No State</SelectItem>
                  <SelectItem value="15">FCT Abuja (15)</SelectItem>
                  <SelectItem value="19">Kaduna (19)</SelectItem>
                  <SelectItem value="20">Kano (20)</SelectItem>
                  <SelectItem value="25">Lagos (25)</SelectItem>
                  <SelectItem value="28">Ogun (28)</SelectItem>
                  <SelectItem value="29">Ondo (29)</SelectItem>
                  <SelectItem value="30">Osun (30)</SelectItem>
                  <SelectItem value="31">Oyo (31)</SelectItem>
                  <SelectItem value="32">Plateau (32)</SelectItem>
                  <SelectItem value="33">Rivers (33)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="manager">Manager</Label>
              <Input
                id="manager"
                value={formData.manager}
                onChange={(e) => handleInputChange("manager", e.target.value)}
                placeholder="Branch Manager Name"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Branch Address"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobilePhone">Mobile Phone</Label>
              <Input
                id="mobilePhone"
                value={formData.mobilePhone}
                onChange={(e) =>
                  handleInputChange("mobilePhone", e.target.value)
                }
                placeholder="e.g., 08012345678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="landPhone">Land Phone</Label>
              <Input
                id="landPhone"
                value={formData.landPhone}
                onChange={(e) => handleInputChange("landPhone", e.target.value)}
                placeholder="e.g., 01-2345678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="branch@cornerstone.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fax">Fax</Label>
              <Input
                id="fax"
                value={formData.fax}
                onChange={(e) => handleInputChange("fax", e.target.value)}
                placeholder="Fax Number"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
                placeholder="Additional notes or remarks"
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2 md:col-span-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) =>
                  handleInputChange("active", checked)
                }
              />
              <Label htmlFor="active">Active Branch</Label>
            </div>
          </div>

          <div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {/* @ts-ignore */}
            <Button type="submit" disabled={loading.updateBranch}>
              {loading.updateBranch && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Branch
            </Button>
          </div>
        </form>
      </DialogContent>
    </OutsideDismissDialog>
  );
}
