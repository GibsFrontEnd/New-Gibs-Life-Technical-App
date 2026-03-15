export interface MktStaff {
  mktStaffID: string;
  mktGrpID: string;
  groupName: string;
  staffName: string;
  groupHead: string;
  mktUnitID: string;
  mktUnit: string;
  budyear1: string;
  budyear2: string;
  curTarget: number;
  prevTarget: number;
  deleted: number;
  active: number;
  submittedBy: string;
  submittedOn: string;
  modifiedBy: string;
  modifiedOn: string;
}

export interface CreateMktStaffRequest {
  mktStaffID: string;
  mktGrpID: string;
  groupName: string;
  staffName: string;
  groupHead: string;
  mktUnitID: string;
  mktUnit: string;
  budyear1: string;
  budyear2: string;
  curTarget: number;
  prevTarget: number;
  deleted: number;
  active: number;
  submittedBy: string;
  modifiedBy: string;
}

export interface UpdateMktStaffRequest {
  mktGrpID: string;
  groupName: string;
  staffName: string;
  groupHead: string;
  mktUnitID: string;
  mktUnit: string;
  budyear1: string;
  budyear2: string;
  curTarget: number;
  prevTarget: number;
  deleted: number;
  active: number;
  modifiedBy: string;
}

export interface MarketingStaffState {
  mktStaffs: MktStaff[];
  selectedMktStaff: MktStaff | null;

  loading: {
    fetchMktStaffs: boolean;
    fetchMktStaff: boolean;
    createMktStaff: boolean;
    updateMktStaff: boolean;
    deleteMktStaff: boolean;
  };

  error: {
    fetchMktStaffs: unknown;
    fetchMktStaff: unknown;
    createMktStaff: unknown;
    updateMktStaff: unknown;
    deleteMktStaff: unknown;
  };

  success: {
    createMktStaff: boolean;
    updateMktStaff: boolean;
    deleteMktStaff: boolean;
  };
}