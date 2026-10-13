import { Button } from "@/components/UI/new-button";
import {
  getAllBranches,
  selectBranch,
} from "@/features/reducers/companyReducers/branchSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/use-apps";
import type { BranchFiltersProps } from "@/types/branches";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { BranchesTable } from "./branches/branch-table"
import { BranchFilters } from "./branches/branch-filters"
import { CreateBranchDialog } from "./branches/create-branch-dialog"

const CompanyBranches = () => {
  const dispatch = useAppDispatch();
  const { branches, loading } = useAppSelector(selectBranch);
  const [filters, setFilters] = useState<BranchFiltersProps>({
    search: "",
    regionID: "",
    stateID: "",
    active: "",
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(getAllBranches());
  }, [dispatch]);
  return (
    <div className="min-h-[calc(100vh_-_64px)]">
      <div className="w-full flex flex-wrap gap-4 items-end justify-between">
        <BranchFilters filters={filters} onFiltersChange={setFilters} />
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 mb-4">
          <Plus className="h-4 w-4" />
          Add Branch
        </Button>
      </div>
      <div className="mb-16">
        <BranchesTable
          branches={branches}
          filters={filters}
          loading={loading.getAllBranches}
        />
      </div>

      <CreateBranchDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </div>
  );
};

export default CompanyBranches;
