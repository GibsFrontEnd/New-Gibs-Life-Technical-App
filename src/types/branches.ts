export interface Branch {
  branchID: string;
  companyID: string | null;
  regionID: string | null;
  stateID: string | null;
  branchID2: string;
  description: string;
  manager: string;
  address: string;
  mobilePhone: string;
  landPhone: string | null;
  email: string;
  fax: string;
  deleted: boolean;
  active: boolean;
  remarks: string | null;
  submittedBy: string;
  submittedOn: string;
  modifiedBy: string | null;
  modifiedOn: string | null;
}

export interface UpdateBranchRequest {
  branchId: string;
  data: Branch;
}

export interface BranchState {
  branches: Branch[];
  branch: Branch | null;

  loading: {
    getAllBranches: boolean;
    getBranchDetails: boolean;
    createBranch: boolean;
    updateBranch: boolean;
    deleteBranch: boolean;
  };
  error: {
    getAllBranches: unknown;
    getBranchDetails: unknown;
    createBranch: unknown;
    updateBranch: unknown;
    deleteBranch: unknown;
  };
  success: {
    createBranch: boolean;
    updateBranch: boolean;
    deleteBranch: boolean;
  };
}

export interface BranchFiltersProps {
  search: string
  regionID: string
  stateID: string
  active: string
}
