// src/types/reinsurance.ts
//@ts-nocheck

export interface FacultativeInwardPolicy {
  policyid?: number;
  proposalNo: string;
   policyNo: string;  
  transDate: string;
  coPolicyNo: string | null;
  companyID: string;
  branchID: string;
  branch: string;
  bizSource: string;
  sourceType: string | null;
  subRiskID: string;
  subRisk: string;
  riskID: string;
  partyID: string;
  party: string;
  mktStaffID: string;
  mktStaff: string;
  insuredID: string;
  insSurname: string;
  insFirstname: string;
  insOthernames: string | null;
  insAddress: string;
  insStateID: string | null;
  insMobilePhone: string;
  insLandPhone: string | null;
  insEmail: string | null;
  insFaxNo: string | null;
  insOccupation: string | null;
  isProposal: number;
  startDate: string;
  endDate: string;
  exRate: number;
  exCurrency: string;
  premiumRate: number | null;
  proportionRate: number;
  sumInsured: number | null;
  grossPremium: number | null;
  sumInsuredFrgn: number | null;
  grossPremiumFrgn: number | null;
  proRataDays: number | null;
  proRataPremium: number | null;
  remarks: string | null;
  deleted: number;
  active: number;
  undEmail1: string | null;
  undEmail2: string | null;
  transSTATUS: 'PENDING' | 'CALCULATED' | 'APPROVED' | 'REJECTED';
  submittedBy: string | null;
  submittedOn: string;
  modifiedBy: string | null;
  modifiedOn: string | null;
  leaderID: string | null;
  leader: string | null;
  commissionRate: number | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ReinsuranceFilterParams {
  branchId?: string;
  status?: string;
  partyId?: string;
  mktStaffId?: string;
  riskClass?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface CreateFacultativeInwardDto {
  entryDate: string;
  startDate: string;
  expiryDate: string;
  branchId: string;
  branchName: string;
  bizSource: string;
  subRiskId: string;
  subRiskName: string;
  partyId: string;
  marketingStaffId: string;
  insuredId: string;
  coPolicyNo: string;
  leaderId: string;
  leaderName: string;
  currency: string;
  exchangeRate: number;
  businessProportion: number;
  businessType: string;
  classType: string;
  companyAbrev: string;
}

export interface UpdateFacultativeInwardDto extends Partial<CreateFacultativeInwardDto> {}