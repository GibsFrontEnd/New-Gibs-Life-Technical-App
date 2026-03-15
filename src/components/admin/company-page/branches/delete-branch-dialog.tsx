import { useAppDispatch, useAppSelector } from "@/hooks/use-apps";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  OutsideDismissDialog,
} from "@/components/UI/dialog";
import { Button } from "@/components/UI/new-button";
import type { Branch } from "@/types/branches";
import { Loader2, AlertTriangle, Building } from "lucide-react";
import { Alert, AlertDescription } from "@/components/UI/alert";
import { useToast } from "@/components/UI/use-toast";
import {
  deleteBranch,
  selectBranch,
} from "@/features/reducers/companyReducers/branchSlice";
import { useEffect } from "react";

interface DeleteBranchDialogProps {
  branch: Branch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteBranchDialog({
  branch,
  open,
  onOpenChange,
}: DeleteBranchDialogProps) {
  const dispatch = useAppDispatch();
  const { loading, success, error } = useAppSelector(selectBranch);
  const { toast } = useToast();

  useEffect(() => {
    if (success.deleteBranch) {
      toast({
        title: "Success",
        description: `Branch "${branch?.description}" has been deleted successfully.`,
      });
      onOpenChange(false);
    } else if (error.deleteBranch) {
      toast({
        title: "Error",
        description: "Failed to delete branch. Please try again.",
        variant: "destructive",
      });
    }
  }, [success.deleteBranch, error.deleteBranch, toast, onOpenChange]);

  const handleDelete = async () => {
    if (!branch) return;

    dispatch(deleteBranch(branch.branchID));
  };

  if (!branch) return null;

  return (
    <OutsideDismissDialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Branch</DialogTitle>
          <div>
            This action cannot be undone. This will permanently delete the
            branch from the system.
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Building className="h-4 w-4" />
            <AlertDescription>
              You are about to delete the following branch:
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Branch ID:</span>
              <span>{branch.branchID}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Name:</span>
              <span>{branch.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Code:</span>
              <span>{branch.branchID2}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Manager:</span>
              <span
                className="text-right max-w-[200px] truncate"
                title={branch.manager}
              >
                {branch.manager || "Not assigned"}
              </span>
            </div>
            {branch.address && (
              <div className="flex justify-between">
                <span className="font-medium">Address:</span>
                <span
                  className="text-right max-w-[200px] truncate"
                  title={branch.address}
                >
                  {branch.address}
                </span>
              </div>
            )}
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This will permanently remove all branch
              data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Branch contact information</li>
                <li>Manager assignments</li>
                <li>Historical records</li>
                <li>Associated metadata</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete} // @ts-ignore
            disabled={loading.deleteBranch}
          >
            {loading.deleteBranch && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete Branch
          </Button>
        </div>
      </DialogContent>
    </OutsideDismissDialog>
  );
}
