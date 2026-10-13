import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from '@/hooks/use-apps'
import { useToast } from "@/components/UI/use-toast";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    OutsideDismissDialog,
} from "@/components/UI/dialog";
import { Button } from "@/components/UI/new-button";
import { deleteMktStaff, clearMarketingStaffMessages, selectMarketingStaff } from '@/features/reducers/companyReducers/marketingStaffSlice'
import type { MktStaff } from '@/types/marketing-staff'

interface MarketingStaffDeleteDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    staff: MktStaff | null
}

export function MarketingStaffDeleteDialog({ open, onOpenChange, staff }: MarketingStaffDeleteDialogProps) {
    const dispatch = useAppDispatch()
    const { loading, success, error } = useAppSelector(selectMarketingStaff)
    const { toast } = useToast()

    useEffect(() => {
        if (success.deleteMktStaff) {
            toast({
                title: "Success",
                description: "Marketing staff member deleted successfully.",
            })
            onOpenChange(false)
            dispatch(clearMarketingStaffMessages())
        }
    }, [success.deleteMktStaff, toast, onOpenChange, dispatch])

    useEffect(() => {
        if (error.deleteMktStaff) {
            toast({
                title: "Error",
                description: "Failed to delete marketing staff member. Please try again.",
                variant: "destructive",
            })
            dispatch(clearMarketingStaffMessages())
        }
    }, [error.deleteMktStaff, toast, dispatch])

    const handleDelete = () => {
        if (staff) {
            dispatch(deleteMktStaff(staff.mktStaffID))
        }
    }

    if (!staff) return null

    return (
        <OutsideDismissDialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="">
                <DialogHeader>
                    <DialogTitle>Delete Marketing Staff Member</DialogTitle>
                    <div>
                        Are you sure you want to delete <strong>{staff.staffName}</strong>? This action cannot be undone.
                    </div>
                </DialogHeader>

                <div className="px-6">
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Staff Name:</span>
                            <span className="font-medium">{staff.staffName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Group:</span>
                            <span className="font-medium">{staff.groupName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Marketing Unit:</span>
                            <span className="font-medium">{staff.mktUnit}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Current Target:</span>
                            <span className="font-medium">
                                {new Intl.NumberFormat("en-US", {
                                    style: "currency",
                                    currency: "USD",
                                }).format(staff.curTarget)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6 flex gap-4">
                    {/* @ts-ignore */}
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading.deleteMktStaff}>
                        Cancel
                    </Button>
                    <Button className="flex-1" variant="destructive" onClick={handleDelete} loading={loading.deleteMktStaff}>
                        {loading.deleteMktStaff ? "Deleting..." : "Delete Staff Member"}
                    </Button>
                </div>
            </DialogContent>
        </OutsideDismissDialog>
    )
}
