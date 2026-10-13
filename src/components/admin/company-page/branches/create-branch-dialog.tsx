import { useEffect, useState } from "react";
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
import {
  createBranch,
  selectBranch,
} from "@/features/reducers/companyReducers/branchSlice";
import { useToast } from "@/components/UI/use-toast";

interface CreateBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBranchDialog({
  open,
  onOpenChange,
}: CreateBranchDialogProps) {
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
    if (success.createBranch) {
      toast({
        title: "Success",
        description: "Branch created successfully.",
      });
      onOpenChange(false);
      resetForm();
    } else if (error.createBranch) {
      toast({
        title: "Error",
        description: "Failed to create branch. Please try again.",
        variant: "destructive",
      });
    }
  }, [success.createBranch, error.createBranch, toast, onOpenChange]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.branchID || !formData.description || !formData.regionID) {
      toast({
        title: "Validation Error",
        description:
          "Please fill in all required fields (Branch ID, Description, Region).",
        variant: "destructive",
      });
      return;
    }

    const branchData: Branch = {
      ...formData,
      companyID: null,
      deleted: false,
      submittedBy: "Admin", // In real app, get from auth context
      submittedOn: new Date().toISOString(),
      modifiedBy: null,
      modifiedOn: null,
    };

    dispatch(createBranch(branchData));
  };

  const resetForm = () => {
    setFormData({
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
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <OutsideDismissDialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Branch</DialogTitle>
          <div>
            Add a new branch location to the system. Fields marked with * are
            required.
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="branchID">Branch ID *</Label>
              <Input
                id="branchID"
                value={formData.branchID}
                onChange={(e) => handleInputChange("branchID", e.target.value)}
                placeholder="e.g., 114"
                required
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
            <Button type="submit" disabled={loading.createBranch}>
              {loading.createBranch && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Branch
            </Button>
          </div>
        </form>
      </DialogContent>
    </OutsideDismissDialog>
  );
}
