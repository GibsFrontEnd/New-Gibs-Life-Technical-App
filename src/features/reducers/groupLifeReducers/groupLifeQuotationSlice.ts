// @ts-nocheck

import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { SERVER_URL } from "../../../utils/constants";

// ==================== TYPES ====================

export interface GroupLifeMember {
  id?: string;
  memberId?: string;
  name: string;
  dateOfBirth: string;
  gender: "M" | "F";
  salary: number;
  sumAssured: number;
  premium: number;
  relationship?: string;
  [key: string]: any;
}

export interface GroupLifePolicy {
  policyNo: string;
  branch?: string;
  branchID?: string;
  companyName?: string;
  transDate?: string;
  effectiveDate?: string;
  expiryDate?: string;
  subRiskName?: string;
  subRiskID?: string;
  partyID?: string;
  isProposal?: boolean;
  trackID?: number;
  bizSource?: string;
  totalMembers?: number;
  totalSumInsured?: number;
  totalPremium?: number;
  groupFactorAmount?: number;
  loadingPercentage?: number;
  netPremiumDue?: number;
  reductionPercentage?: number;
  status?: "PROSPECT" | "ACTIVE" | "PENDING" | "CANCELLED";
  members?: GroupLifeMember[];
  quotationNumber?: string;
  id?: string;
}

export interface GroupLifePolicyListResponse {
  items: GroupLifePolicyListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface GroupLifePolicyListItem {
  policyNo: string;
  isProposal: boolean;
  subRiskId: string;
  subRiskName: string;
  branchId: string;
  insuredId: string;
  insuredName: string;
  entryDate: string;
  startDate: string;
  expiryDate: string;
  sumInsured: number;
  grossPremium: number;
  status: string;
}

export interface GroupLifePolicyFilters {
  subRiskId?: string;
  branchId?: string;
  insuredId?: string;
  status?: string;
  isProposal?: boolean;
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface ComputeRequest {
  companyName: string;
  effectiveDate: string;
  expiryDate: string;
  members: GroupLifeMember[];
  loadingPercentage?: number;
  reductionPercentage?: number;
  [key: string]: any;
}

export interface ComputeResponse {
  totalMembers: number;
  totalSumInsured: number;
  totalPremium: number;
  netPremiumDue: number;
  loadingPercentage: number;
  reductionPercentage: number;
  members: GroupLifeMember[];
  [key: string]: any;
}

export interface BulkUploadResponse {
  insertedCount: number;
  totalMembers: number;
  totalSumInsured: number;
  totalPremium: number;
  errors?: string[];
}

export interface PolicyDetail {
  policyNo: string;
  endorsementNo?: string;
  [key: string]: any;
}

export interface AggregateTotals {
  totalMembers: number;
  totalSumInsured: number;
  totalPremium: number;
  averagePremium?: number;
  [key: string]: any;
}

// ==================== ENDORSEMENT TYPES ====================

export type EndorsementType = "Renewal" | "Reversal" | "Additional";

export interface CreateEndorsementRequest {
  policyNo: string;
  sourceEndorsementNo: string;
  type: EndorsementType;
}

export interface CreateEndorsementResponse {
  detailID: number;
  policyNo: string;
  endorsementNo: string;
  certOrDocNo: string;
  insuredName: string;
  created: boolean;
}

// ==================== DEBIT NOTE TYPES ====================

export interface DebitNotePremium {
  grossPremium: number;
  commissionRate: number;
  commissionAmount: number;
  whtRate: number;
  whtAmount: number;
  orcRate: number;
  orcAmount: number;
  netPremium: number;
  ncdfRate: number;
  ncdfValue: number;
  ncdfNetValue: number;
  naicomLevyRate: number;
  naicomLevyValue: number;
  naicomLevyNetValue: number;
  orcDeductedFromNet: boolean;
}

export interface CoinsuranceLine {
  sn: number;
  participantId: string;
  participantName: string;
  sharePercent: number;
  commissionRate: number;
  orcRate: number;
  whtRate: number;
  isLead: boolean;
  shareSumInsured: number;
  sharePremium: number;
  commissionAmount: number;
  orcAmount: number;
  whtAmount: number;
  netPremium: number;
}

export interface DebitNoteUI {
  showCommissionSection: boolean;
  showWhtSection: boolean;
  showOrcSection: boolean;
  showDistributionSection: boolean;
  showComputeButton: boolean;
  showTrackingCost: boolean;
  showLevies: boolean;
  showCurrencyPanel: boolean;
  showShareTotals: boolean;
  commissionEditable: boolean;
  editable: boolean;
  lockReason: string;
}

export interface DebitNote {
  debitNoteNo: string;
  refDebitNoteNo: string;
  receiptNo: string;
  policyNo: string;
  coPolicyNo: string;
  branchId: string;
  bizSource: string;
  bizOption: string;
  noteType: string;
  subRiskId: string;
  subRisk: string;
  riskClass: string;
  billingDate: string;
  startDate: string;
  endDate: string;
  partyId: string;
  partyName: string;
  mktStaffId: string;
  mktStaffName: string;
  insuredId: string;
  insuredName: string;
  totalRiskSumInsured: number;
  totalRiskPremium: number;
  totalTrackingCost: number;
  topMostLocationValue: number;
  mplValue: number;
  sumInsured: number;
  grossPremium: number;
  ourSharePercent: number;
  premium: DebitNotePremium;
  exRate: number;
  exCurrency: string;
  sumInsuredFrgn: number;
  grossPremiumFrgn: number;
  paymentType: string;
  creditRefNo: string;
  narration: string;
  transGuid: string;
  approval: number;
  submittedBy: string;
  submittedOn: string;
  ui: DebitNoteUI;
  coinsuranceLines: CoinsuranceLine[];
  detailId: number;
  distributionTemplate: CoinsuranceLine[];
}

// ==================== DEBIT NOTE LIST TYPES ====================

export interface DebitNoteListItem {
  debitNoteNo: string;
  refDebitNoteNo: string;
  policyNo: string;
  receiptNo: string;
  noteType: string;
  bizSource: string;
  bizOption: string;
  paymentType: string;
  branchId: string;
  billingDate: string;
  partyId: string;
  partyName: string;
  insuredName: string;
  sumInsured: number;
  grossPremium: number;
  commission: number;
  netAmount: number;
  approval: number;
  approvalStatus: string;
  isInvoice: boolean;
  isHeadNote: boolean;
  submittedBy: string;
  submittedOn: string;
}

export interface DebitNoteListResponse {
  items: DebitNoteListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface DebitNoteFilters {
  policyNo?: string;
  branchId?: string;
  bizSource?: string;
  paymentType?: string;
  noteType?: string;
  approval?: number;
  pendingOnly?: boolean;
  headNotesOnly?: boolean;
  billingFrom?: string;
  billingTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ==================== CO-INSURANCE CREDIT NOTE TYPES ====================

export interface CoinsuranceCreditNotePremium {
  totalSumInsured: number;
  totalPremium: number;
  businessPropPercent: number;
  shareSumInsured: number;
  sharePremium: number;
  ourPropPercent: number;
  ourSumInsured: number;
  ourPremium: number;
  commissionRate: number;
  commissionAmount: number;
  whtRate: number;
  whtAmount: number;
  netPremium: number;
  orcRate: number;
  orcAmount: number;
  whtDeductedFromNet: boolean;
}

export interface CoinsuranceCreditNote {
  creditNoteNo: string;
  refDebitNoteNo: string;
  receiptNo: string;
  policyNo: string;
  branchId: string;
  bizSource: string;
  bizOption: string;
  noteType: string;
  subRiskId: string;
  subRisk: string;
  billingDate: string;
  startDate: string;
  endDate: string;
  participantId: string;
  participantName: string;
  leaderId: string;
  leaderName: string;
  mktStaffId: string;
  mktStaffName: string;
  insuredId: string;
  insuredName: string;
  narration: string;
  premium: CoinsuranceCreditNotePremium;
  exRate: number;
  exCurrency: string;
  sumInsuredFrgn: number;
  grossPremiumFrgn: number;
  approval: number;
  editable: boolean;
  lockReason: string;
  showOrcSection: boolean;
  showCurrencyPanel: boolean;
  submittedBy: string;
  submittedOn: string;
}

// ==================== CO-INSURANCE CREDIT NOTE LIST TYPES ====================

export interface CoinsuranceCreditNoteListItem {
  creditNoteNo: string;
  refDebitNoteNo: string;
  policyNo: string;
  noteType: string;
  bizOption: string;
  billingDate: string;
  participantId: string;
  participantName: string;
  insuredName: string;
  sharePercent: number;
  shareSumInsured: number;
  sharePremium: number;
  commission: number;
  netPremium: number;
  approval: number;
  approvalStatus: string;
  isReversal: boolean;
  submittedBy: string;
  submittedOn: string;
}

export interface CoinsuranceCreditNoteListResponse {
  items: CoinsuranceCreditNoteListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface CoinsuranceCreditNoteFilters {
  policyNo?: string;
  refDebitNoteNo?: string;
  participantId?: string;
  branchId?: string;
  approval?: number;
  reversalsOnly?: boolean;
  billingFrom?: string;
  billingTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PrefillCoinsuranceCreditNoteRequest {
  policyNo: string;
  refDebitNoteNo: string;
  type: 'CN' | string;
}

export interface AmendCoinsuranceCreditNoteRequest {
  billingDate: string;
  startDate: string;
  endDate: string;
  participantId: string;
  insuredName: string;
  narration: string;
  sumInsured: number;
  grossPremium: number;
  businessPropPercent: number;
  commissionRate: number;
  commissionAmount: number;
  whtAmount: number;
  netPremium: number;
}

export interface CalculateCoinsuranceCreditNoteRequest {
  totalSumInsured: number;
  totalPremium: number;
  businessPropPercent: number;
  ourPropPercent: number;
  commissionRate: number;
  whtRate: number;
  orcRate: number;
  deductWhtFromNet: boolean;
}

export interface CalculateCoinsuranceCreditNoteResponse {
  totalSumInsured: number;
  totalPremium: number;
  businessPropPercent: number;
  shareSumInsured: number;
  sharePremium: number;
  ourPropPercent: number;
  ourSumInsured: number;
  ourPremium: number;
  commissionRate: number;
  commissionAmount: number;
  whtRate: number;
  whtAmount: number;
  netPremium: number;
  orcRate: number;
  orcAmount: number;
  whtDeductedFromNet: boolean;
}

export interface RaiseCoinsuranceCreditNoteRequest {
  policyNo: string;
  refDebitNoteNo: string;
  type: string;
  billingDate: string;
  startDate: string;
  endDate: string;
  participantId: string;
  insuredName: string;
  narration: string;
  bizOption: string;
  sumInsured: number;
  grossPremium: number;
  businessPropPercent: number;
  commissionRate: number;
  commissionAmount: number;
  whtAmount: number;
  netPremium: number;
  recordParticipation: boolean;
  totalSumInsured: number;
  totalPremium: number;
}

export interface RaiseCoinsuranceCreditNoteResponse {
  creditNoteNo: string;
  refDebitNoteNo: string;
  policyNo: string;
  participantId: string;
  noteType: string;
  participationRecorded: boolean;
}

// ==================== PREFILL DEBIT NOTE TYPES ====================

export interface PrefillDebitNoteRequest {
  policyNo: string;
  detailId: number;
  riskClass: string;
}

export interface AmendDebitNoteRequest {
  branchId: string;
  billingDate: string;
  startDate: string;
  endDate: string;
  insuredName: string;
  narration: string;
  transGuid: string;
  partyId: string;
  partyName: string;
  mktStaffId: string;
  totalRiskSumInsured: number;
  totalRiskPremium: number;
  sumInsured: number;
  grossPremium: number;
  ourSharePercent: number;
  commissionAmount: number;
  whtAmount: number;
  orcRate: number;
  orcAmount: number;
  netPremium: number;
  exRate: number;
  exCurrency: string;
  sumInsuredFrgn: number;
  grossPremiumFrgn: number;
  paymentType: string;
  creditRefNo: string;
}

export interface CalculatePremiumRequest {
  grossPremium: number;
  commissionRate: number;
  whtRate: number;
  orcRate: number;
  ncdfRate: number;
  naicomLevyRate: number;
  deductOrcFromNet: boolean;
}

export interface CalculatePremiumResponse {
  grossPremium: number;
  commissionRate: number;
  commissionAmount: number;
  whtRate: number;
  whtAmount: number;
  orcRate: number;
  orcAmount: number;
  netPremium: number;
  ncdfRate: number;
  ncdfValue: number;
  ncdfNetValue: number;
  naicomLevyRate: number;
  naicomLevyValue: number;
  naicomLevyNetValue: number;
  orcDeductedFromNet: boolean;
}

export interface DistributeRiskRequest {
  totalRiskSumInsured: number;
  totalRiskPremium: number;
  ourSharePercent: number;
  ourGrossPremium: number;
  lines: CoinsuranceLine[];
}

export interface DistributeRiskResponse {
  lines: CoinsuranceLine[];
  totalCededPercent: number;
  totalCededSumInsured: number;
  totalCededPremium: number;
  shareProportion: number;
  isBalanced: boolean;
  errors: string[];
  warnings: string[];
}

export interface RaiseDebitNoteRequest {
  policyNo: string;
  detailId: number;
  riskClass: string;
  branchId: string;
  bizSource: string;
  bizOption: string;
  billingDate: string;
  startDate: string;
  endDate: string;
  insuredName: string;
  narration: string;
  transGuid: string;
  paymentType: string;
  creditRefNo: string;
  totalRiskSumInsured: number;
  totalRiskPremium: number;
  sumInsured: number;
  grossPremium: number;
  ourSharePercent: number;
  commissionRate: number;
  commissionAmount: number;
  whtRate: number;
  whtAmount: number;
  orcRate: number;
  orcAmount: number;
  netPremium: number;
  exRate: number;
  exCurrency: string;
  sumInsuredFrgn: number;
  grossPremiumFrgn: number;
  coinsuranceLines: CoinsuranceLine[];
  postCommissionCreditNote: boolean;
  postCoinsuranceCreditNotes: boolean;
  postCoinsuranceOrcDebitNotes: boolean;
  postLeadOrcCreditNotes: boolean;
}

export interface RaiseDebitNoteResponse {
  debitNoteNo: string;
  policyNo: string;
  endorsementNo: string;
  coinsuranceCreditNotes: string[];
  coinsuranceOrcDebitNotes: string[];
  leadOrcCreditNotes: string[];
  commissionCreditNote: string;
  participationRowsWritten: number;
}

export interface ApproveDebitNoteRequest {
  dncnNo: string;
  approvalStatus: number;
}

export interface ApproveDebitNoteResponse {
  previousDebitNoteNo: string;
  debitNoteNo: string;
  renumbered: boolean;
  approvalStatus: number;
  approvedBy: string;
}

// ==================== SLICE STATE ====================

export interface GroupLifeQuotationState {
  quotations: GroupLifePolicy[];
  currentQuotation: GroupLifePolicy | null;
  currentMembers: GroupLifeMember[];
  policyDetail: PolicyDetail | null;
  aggregateTotals: AggregateTotals | null;
  totalCount: number;
  policies: GroupLifePolicyListItem[];
  policiesTotalCount: number;
  policiesTotalPages: number;
  createdEndorsement: CreateEndorsementResponse | null;
  // Debit Note fields
  currentDebitNote: DebitNote | null;
  debitNoteList: DebitNoteListItem[];
  debitNoteListTotalCount: number;
  debitNoteListTotalPages: number;
  calculatedPremium: CalculatePremiumResponse | null;
  distributedRisk: DistributeRiskResponse | null;
  raisedDebitNote: RaiseDebitNoteResponse | null;
  approvedDebitNote: ApproveDebitNoteResponse | null;
  // Coinsurance Credit Note fields
  currentCoinsuranceCreditNote: CoinsuranceCreditNote | null;
  coinsuranceCreditNoteList: CoinsuranceCreditNoteListItem[];
  coinsuranceCreditNoteListTotalCount: number;
  coinsuranceCreditNoteListTotalPages: number;
  calculatedCoinsuranceCreditNote: CalculateCoinsuranceCreditNoteResponse | null;
  raisedCoinsuranceCreditNote: RaiseCoinsuranceCreditNoteResponse | null;
  debitNoteChildren: any[];
  loading: {
    list: boolean;
    detail: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    compute: boolean;
    upload: boolean;
    bulk: boolean;
    parse: boolean;
    aggregate: boolean;
    anb: boolean;
    duration: boolean;
    policies: boolean;
    endorsement: boolean;
    // Debit Note loading states
    debitNoteNew: boolean;
    debitNoteLoad: boolean;
    debitNoteAmend: boolean;
    debitNoteRefresh: boolean;
    debitNoteCalculate: boolean;
    debitNoteDistribute: boolean;
    debitNoteRaise: boolean;
    debitNoteApprove: boolean;
    debitNoteList: boolean;
    // Coinsurance Credit Note loading states
    coinsuranceCreditNoteNew: boolean;
    coinsuranceCreditNoteLoad: boolean;
    coinsuranceCreditNoteAmend: boolean;
    coinsuranceCreditNoteCalculate: boolean;
    coinsuranceCreditNoteRaise: boolean;
    coinsuranceCreditNoteList: boolean;
     debitNoteChildren: boolean;
  };
  error: {
    list: string | null;
    detail: string | null;
    create: string | null;
    update: string | null;
    delete: string | null;
    compute: string | null;
    upload: string | null;
    bulk: string | null;
    parse: string | null;
    aggregate: string | null;
    anb: string | null;
    duration: string | null;
    policies: string | null;
    endorsement: string | null;
    // Debit Note error states
    debitNoteNew: string | null;
    debitNoteLoad: string | null;
    debitNoteAmend: string | null;
    debitNoteRefresh: string | null;
    debitNoteCalculate: string | null;
    debitNoteDistribute: string | null;
    debitNoteRaise: string | null;
    debitNoteApprove: string | null;
    debitNoteList: string | null;
    // Coinsurance Credit Note error states
    coinsuranceCreditNoteNew: string | null;
    coinsuranceCreditNoteLoad: string | null;
    coinsuranceCreditNoteAmend: string | null;
    coinsuranceCreditNoteCalculate: string | null;
    coinsuranceCreditNoteRaise: string | null;
    coinsuranceCreditNoteList: string | null;
    debitNoteChildren: string | null;
  };
}

// ==================== API HELPER FUNCTIONS ====================

const getAuthToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

const getHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getFormDataHeaders = () => {
  const token = getAuthToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ==================== INITIAL STATE ====================

const initialState: GroupLifeQuotationState = {
  quotations: [],
  currentQuotation: null,
  currentMembers: [],
  policyDetail: null,
  aggregateTotals: null,
  totalCount: 0,
  policies: [],
  policiesTotalCount: 0,
  policiesTotalPages: 0,
  createdEndorsement: null,
  // Debit Note fields
  currentDebitNote: null,
  debitNoteList: [],
  debitNoteListTotalCount: 0,
  debitNoteListTotalPages: 0,
  calculatedPremium: null,
  distributedRisk: null,
  raisedDebitNote: null,
  approvedDebitNote: null,
  // Coinsurance Credit Note fields
  currentCoinsuranceCreditNote: null,
  coinsuranceCreditNoteList: [],
  coinsuranceCreditNoteListTotalCount: 0,
  coinsuranceCreditNoteListTotalPages: 0,
  calculatedCoinsuranceCreditNote: null,
  raisedCoinsuranceCreditNote: null,
  debitNoteChildren: [],
  loading: {
    list: false,
    detail: false,
    create: false,
    update: false,
    delete: false,
    compute: false,
    upload: false,
    bulk: false,
    parse: false,
    aggregate: false,
    anb: false,
    duration: false,
    policies: false,
    endorsement: false,
    // Debit Note loading states
    debitNoteNew: false,
    debitNoteLoad: false,
    debitNoteAmend: false,
    debitNoteRefresh: false,
    debitNoteCalculate: false,
    debitNoteDistribute: false,
    debitNoteRaise: false,
    debitNoteApprove: false,
    debitNoteList: false,
    // Coinsurance Credit Note loading states
    coinsuranceCreditNoteNew: false,
    coinsuranceCreditNoteLoad: false,
    coinsuranceCreditNoteAmend: false,
    coinsuranceCreditNoteCalculate: false,
    coinsuranceCreditNoteRaise: false,
    coinsuranceCreditNoteList: false,
     debitNoteChildren: false,
  },
  error: {
    list: null,
    detail: null,
    create: null,
    update: null,
    delete: null,
    compute: null,
    upload: null,
    bulk: null,
    parse: null,
    aggregate: null,
    anb: null,
    duration: null,
    policies: null,
    endorsement: null,
    // Debit Note error states
    debitNoteNew: null,
    debitNoteLoad: null,
    debitNoteAmend: null,
    debitNoteRefresh: null,
    debitNoteCalculate: null,
    debitNoteDistribute: null,
    debitNoteRaise: null,
    debitNoteApprove: null,
    debitNoteList: null,
    // Coinsurance Credit Note error states
    coinsuranceCreditNoteNew: null,
    coinsuranceCreditNoteLoad: null,
    coinsuranceCreditNoteAmend: null,
    coinsuranceCreditNoteCalculate: null,
    coinsuranceCreditNoteRaise: null,
    coinsuranceCreditNoteList: null,
     debitNoteChildren: null,
  },
};

// ==================== API CALLS ====================

// POST /api/grouplife/policies - Create a group-life policy or proposal
export const createGroupLifePolicy = createAsyncThunk(
  "groupLifeQuotations/createPolicy",
  async (policyData: Partial<GroupLifePolicy>, { rejectWithValue }) => {
    try {
      const response = await fetch(`${SERVER_URL}/grouplife/policies`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(policyData),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create policy");
    }
  }
);

// GET /api/grouplife/policies/policyNo - Get policy by number
export const fetchGroupLifePolicy = createAsyncThunk(
  "groupLifeQuotations/fetchPolicy",
  async (policyNo: string, { rejectWithValue }) => {
    try {
      if (!policyNo) {
        throw new Error("Policy number is required");
      }

      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/policyNo?policyNo=${encodeURIComponent(policyNo)}`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch policy");
    }
  }
);

// GET /api/grouplife/policies - List/search group-life policies
export const fetchGroupLifePolicies = createAsyncThunk(
  "groupLifeQuotations/fetchPolicies",
  async (filters: GroupLifePolicyFilters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.subRiskId) queryParams.append('SubRiskId', filters.subRiskId);
      if (filters.branchId) queryParams.append('BranchId', filters.branchId);
      if (filters.insuredId) queryParams.append('InsuredId', filters.insuredId);
      if (filters.status) queryParams.append('Status', filters.status);
      if (filters.isProposal !== undefined) queryParams.append('IsProposal', String(filters.isProposal));
      if (filters.search) queryParams.append('Search', filters.search);
      if (filters.fromDate) queryParams.append('FromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('ToDate', filters.toDate);
      if (filters.page) queryParams.append('Page', String(filters.page));
      if (filters.pageSize) queryParams.append('PageSize', String(filters.pageSize));

      const queryString = queryParams.toString();
      const url = `${SERVER_URL}/grouplife/policies${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data as GroupLifePolicyListResponse;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch group life policies");
    }
  }
);

// PUT /api/grouplife/policies/policyNo?policyNo={policyNo} - Update policy
export const updateGroupLifePolicy = createAsyncThunk(
  "groupLifeQuotations/updatePolicy",
  async (
    { policyNo, policyData }: { policyNo: string; policyData: Partial<GroupLifePolicy> },
    { rejectWithValue }
  ) => {
    try {
      if (!policyNo) {
        throw new Error("Policy number is required");
      }

      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/policyNo?policyNo=${encodeURIComponent(policyNo)}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(policyData),
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update policy");
    }
  }
);

// POST /api/grouplife/policies/policyNo/detail - Ensure member envelope exists
export const ensurePolicyDetail = createAsyncThunk(
  "groupLifeQuotations/ensureDetail",
  async (policyNo: string, { rejectWithValue }) => {
    try {
      if (!policyNo) {
        throw new Error("Policy number is required");
      }

      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/${encodeURIComponent(policyNo)}/detail`,
        {
          method: "POST",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to ensure policy detail");
    }
  }
);

// GET /api/grouplife/policies/policyNo/detail - Get policy detail
export const fetchPolicyDetail = createAsyncThunk(
  "groupLifeQuotations/fetchDetail",
  async (policyNo: string, { rejectWithValue }) => {
    try {
      if (!policyNo) {
        throw new Error("Policy number is required");
      }

      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/${encodeURIComponent(policyNo)}/detail`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch policy detail");
    }
  }
);

// GET /api/grouplife/policies/policie/members - List members for a policy
export const fetchPolicyMembers = createAsyncThunk(
  "groupLifeQuotations/fetchMembers",
  async (
    { policyNo, endorsementNo }: { policyNo: string; endorsementNo?: string },
    { rejectWithValue }
  ) => {
    try {
      if (!policyNo) {
        throw new Error("Policy number is required");
      }

      const queryParams = new URLSearchParams();
      queryParams.append('policyNo', policyNo);
      if (endorsementNo) {
        queryParams.append('endorsementNo', endorsementNo);
      }

      const url = `${SERVER_URL}/grouplife/policies/policie/members?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      const members = Array.isArray(result) ? result.map((item: any) => ({
        id: item.memberID?.toString(),
        memberId: item.memberID?.toString(),
        memberID: item.memberID,
        policyNo: item.policyNo,
        quotationNo: item.quotationNo,
        endorsementNo: item.endorsementNo,
        bizOption: item.bizOption,
        serialNo: item.serialNo,
        membersNo: item.membersNo,
        surname: item.surname,
        otherNames: item.otherNames,
        dateOfBirth: item.dobDate,
        dobDate: item.dobDate,
        hireDate: item.hireDate,
        startDate: item.hireDate,
        sex: item.sex,
        age: item.age,
        ageANB: item.age,
        basicSalary: item.basicSalary,
        housing: item.housing,
        transport: item.transport,
        otherAmount: item.otherAmount,
        totalEmolument: item.tEmolument,
        tEmolument: item.tEmolument,
        sumInsured: item.sumInsured || item.a9 || 0,
        a9: item.a9,
        grossPremium: item.grossPremium || item.a10 || 0,
        a10: item.a10,
        premiumRate: item.premiumRate,
        totalSumInsured: item.sumInsured || item.a9 || 0,
        totalPremium: item.grossPremium || item.a10 || 0,
        freqOfPayment: item.field7 || "Monthly",
        field7: item.field7,
        duration: item.a1 || 12,
        a1: item.a1,
        photo: item.photo,
        deleted: item.deleted,
        active: item.active,
        submittedBy: item.submittedBy,
        submittedOn: item.submittedOn,
        modifiedBy: item.modifiedBy,
        modifiedOn: item.modifiedOn,
        _raw: item
      })) : [];
      
      return members;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch members");
    }
  }
);

// POST /api/grouplife/policies/members/calc - Compute member premium without saving
export const computeMemberPremium = createAsyncThunk(
  "groupLifeQuotations/computeMember",
  async (memberData: GroupLifeMember, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/members/calc`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(memberData),
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to compute premium");
    }
  }
);

// POST /api/grouplife/policies/members - Add or update member
export const savePolicyMember = createAsyncThunk(
  "groupLifeQuotations/saveMember",
  async (
    { policyNo, memberData }: { policyNo: string; memberData: GroupLifeMember },
    { rejectWithValue }
  ) => {
    try {
      if (!policyNo) {
        throw new Error("Policy number is required");
      }

      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/members`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ policyNo, ...memberData }),
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to save member");
    }
  }
);

// DELETE /api/grouplife/policies/members/{memberId} - Remove member
export const removePolicyMember = createAsyncThunk(
  "groupLifeQuotations/removeMember",
  async (memberId: string, { rejectWithValue }) => {
    try {
      if (!memberId) {
        throw new Error("Member ID is required");
      }

      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/members/${encodeURIComponent(memberId)}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return memberId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to remove member");
    }
  }
);

// GET /api/grouplife/policies/policies/members/aggregate - Aggregate totals
export const fetchAggregateTotals = createAsyncThunk(
  "groupLifeQuotations/fetchAggregate",
  async (policyNo: string, { rejectWithValue }) => {
    try {
      if (!policyNo) {
        throw new Error("Policy number is required");
      }

      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/${encodeURIComponent(policyNo)}/members/aggregate`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch aggregate totals");
    }
  }
);

// The bulk endpoints have no exception middleware, so business-rule failures come back as a
// 500 whose body is either JSON ({ message }) or the plain-text exception ("XException: reason").
const readBulkError = async (response: Response): Promise<string> => {
  const fallback = `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`;
  const text = await response.text().catch(() => "");
  if (!text) return fallback;
  try {
    const data = JSON.parse(text);
    if (typeof data === "string") return data;
    return data?.message || data?.title || fallback;
  } catch {
    const firstLine = text.split(/\r?\n/)[0].trim();
    const match = firstLine.match(/Exception:\s*(.+)$/);
    return (match ? match[1] : firstLine).slice(0, 300) || fallback;
  }
};

// POST /api/grouplife/policies/members/bulk - Bulk upload members.
// `rows` are BulkMemberRowDto-shaped (customerName, disbursementAmount, dateOfBirth, ...),
// i.e. exactly what parse-excel returns under payload.rows.
export const bulkUploadMembers = createAsyncThunk(
  "groupLifeQuotations/bulkUpload",
  async (
    payload: {
      policyNo: string;
      rows: Record<string, any>[];
      endorsementNo?: string;
      bizOption?: string;
      pricingMode?: "PolicyRate" | "FixedRate" | string;
      fixedPremiumRate?: number;
      loadingRate?: number;
      discountRate?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const { policyNo, rows, endorsementNo, bizOption, pricingMode, fixedPremiumRate, loadingRate, discountRate } = payload;
      if (!policyNo) {
        throw new Error("Policy number is required");
      }

      const bodyData: any = { policyNo, rows };
      if (endorsementNo) bodyData.endorsementNo = endorsementNo;
      if (bizOption) bodyData.bizOption = bizOption;
      // The API has no string-enum converter: BulkPricingMode must go over JSON as 0/1.
      if (pricingMode) bodyData.pricingMode = pricingMode === "FixedRate" ? 1 : 0;
      if (fixedPremiumRate !== undefined) bodyData.fixedPremiumRate = fixedPremiumRate;
      if (loadingRate !== undefined) bodyData.loadingRate = loadingRate;
      if (discountRate !== undefined) bodyData.discountRate = discountRate;

      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/members/bulk`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(bodyData),
        }
      );

      if (!response.ok) {
        throw new Error(await readBulkError(response));
      }

      const result = await response.json();
      return result as BulkUploadResponse;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to bulk upload members");
    }
  }
);

export interface ParseExcelMembersPayload {
  file: File;
  sheetName?: string;
  bizOption?: string;
}

// POST /api/grouplife/policies/members/bulk/parse-excel - Parse Excel without saving
export const parseExcelMembers = createAsyncThunk(
  "groupLifeQuotations/parseExcel",
  async (
    arg: File | ParseExcelMembersPayload,
    { rejectWithValue }
  ) => {
    try {
      const isFile = arg instanceof File;
      const file = isFile ? arg : arg?.file;
      const sheetName = !isFile ? arg?.sheetName : undefined;
      const bizOption = !isFile ? arg?.bizOption : undefined;

      if (!file) {
        throw new Error("No file was selected");
      }

      const formData = new FormData();
      formData.append('file', file);
      if (sheetName) formData.append('sheetName', sheetName);
      if (bizOption) formData.append('BizOption', bizOption);

      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/members/bulk/parse-excel`,
        {
          method: "POST",
          headers: getFormDataHeaders(),
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(await readBulkError(response));
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to parse Excel file");
    }
  }
);

// POST /api/grouplife/policies/members/bulk/upload-excel - Parse and upload Excel
export const uploadExcelMembers = createAsyncThunk(
  "groupLifeQuotations/uploadExcel",
  async (
    {
      file,
      policyNo,
      endorsementNo,
      bizOption,
      pricingMode,
      fixedPremiumRate,
      loadingRate,
      discountRate,
      sheetName,
    }: {
      file: File;
      policyNo: string;
      endorsementNo?: string;
      bizOption?: string;
      pricingMode?: "PolicyRate" | "FixedRate" | string;
      fixedPremiumRate?: number;
      loadingRate?: number;
      discountRate?: number;
      sheetName?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('policyNo', policyNo);
      if (endorsementNo) formData.append('endorsementNo', endorsementNo);
      if (bizOption) formData.append('BizOption', bizOption);
      if (pricingMode) formData.append('pricingMode', pricingMode);
      if (fixedPremiumRate !== undefined) formData.append('fixedPremiumRate', String(fixedPremiumRate));
      if (loadingRate !== undefined) formData.append('loadingRate', String(loadingRate));
      if (discountRate !== undefined) formData.append('discountRate', String(discountRate));
      if (sheetName) formData.append('sheetName', sheetName);

      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/members/bulk/upload-excel`,
        {
          method: "POST",
          headers: getFormDataHeaders(),
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(await readBulkError(response));
      }

      const result = await response.json();
      return result as BulkUploadResponse;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to upload Excel file");
    }
  }
);

// POST /api/grouplife/policies/compute/anb - Calculate Age Next Birthday
export const computeAgeNextBirthday = createAsyncThunk(
  "groupLifeQuotations/computeANB",
  async (dateOfBirth: string, { rejectWithValue }) => {
    try {
      if (!dateOfBirth) {
        throw new Error("Date of birth is required");
      }

      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/compute/anb`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ dateOfBirth }),
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to compute ANB");
    }
  }
);

// POST /api/grouplife/policies/compute/duration - Calculate duration from frequency
export const computeDuration = createAsyncThunk(
  "groupLifeQuotations/computeDuration",
  async (frequency: string, { rejectWithValue }) => {
    try {
      if (!frequency) {
        throw new Error("Frequency is required");
      }

      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/compute/duration`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ frequency }),
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to compute duration");
    }
  }
);

// ================================================================
// 🆕 ENDORSEMENT ENDPOINT
// ================================================================

export const createEndorsement = createAsyncThunk(
  "groupLifeQuotations/createEndorsement",
  async (request: CreateEndorsementRequest, { rejectWithValue }) => {
    try {
      if (!request.policyNo) {
        throw new Error("Policy number is required");
      }
      if (!request.sourceEndorsementNo) {
        throw new Error("Source endorsement number is required");
      }
      if (!request.type) {
        throw new Error("Endorsement type is required (Renewal, Reversal, or Additional)");
      }

      const url = new URL(`${SERVER_URL}/grouplife/policies/policyNo/details/sourceEndorsementNo/endorsement`);
      url.searchParams.append('policyNo', request.policyNo);
      url.searchParams.append('sourceEndorsementNo', request.sourceEndorsementNo);
      url.searchParams.append('type', request.type);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: getHeaders(),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result: CreateEndorsementResponse = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create endorsement");
    }
  }
);

// ================================================================
// 🆕 DEBIT NOTE ENDPOINTS
// ================================================================

// GET /api/grouplife/debit-notes - List debit notes
export const fetchDebitNotes = createAsyncThunk(
  "groupLifeQuotations/fetchDebitNotes",
  async (filters: DebitNoteFilters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.policyNo) queryParams.append('PolicyNo', filters.policyNo);
      if (filters.branchId) queryParams.append('BranchId', filters.branchId);
      if (filters.bizSource) queryParams.append('BizSource', filters.bizSource);
      if (filters.paymentType) queryParams.append('PaymentType', filters.paymentType);
      if (filters.noteType) queryParams.append('NoteType', filters.noteType);
      if (filters.approval !== undefined) queryParams.append('Approval', String(filters.approval));
      if (filters.pendingOnly !== undefined) queryParams.append('PendingOnly', String(filters.pendingOnly));
      if (filters.headNotesOnly !== undefined) queryParams.append('HeadNotesOnly', String(filters.headNotesOnly));
      if (filters.billingFrom) queryParams.append('BillingFrom', filters.billingFrom);
      if (filters.billingTo) queryParams.append('BillingTo', filters.billingTo);
      if (filters.search) queryParams.append('Search', filters.search);
      if (filters.page) queryParams.append('Page', String(filters.page));
      if (filters.pageSize) queryParams.append('PageSize', String(filters.pageSize));

      const queryString = queryParams.toString();
      const url = `${SERVER_URL}/grouplife/debit-notes${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result: DebitNoteListResponse = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch debit notes");
    }
  }
);

export const prefillDebitNote = createAsyncThunk(
  "groupLifeQuotations/prefillDebitNote",
  async (request: PrefillDebitNoteRequest, { rejectWithValue }) => {
    try {
      const url = new URL(`${SERVER_URL}/grouplife/debit-notes/new`);
      url.searchParams.append('policyNo', request.policyNo);
      url.searchParams.append('detailId', String(request.detailId));
      url.searchParams.append('riskClass', request.riskClass);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result: DebitNote = await response.json();
      
      // ✅ Return a flattened version with all fields properly mapped
      return {
        // Basic info
        detailId: result.detailId,
        policyNo: result.policyNo,
        branchId: result.branchId,
        bizSource: result.bizSource,
        bizOption: result.bizOption,
        sourceType: result.bizOption,
        
        // Party info
        insuredId: result.insuredId,
        insuredName: result.insuredName,
        partyId: result.partyId,
        partyName: result.partyName,
        mktStaffId: result.mktStaffId,
        mktStaffName: result.mktStaffName,
        
        // Dates
        startDate: result.startDate,
        endDate: result.endDate,
        billingDate: result.billingDate,
        
        // Premium - main fields
        sumInsured: result.sumInsured || 0,
        grossPremium: result.grossPremium || 0,
        totalRiskSumInsured: result.totalRiskSumInsured || result.sumInsured || 0,
        totalRiskPremium: result.totalRiskPremium || result.grossPremium || 0,
        ourSharePercent: result.ourSharePercent || 100,
        
        // Premium - nested premium object
        premium: result.premium || {
          grossPremium: result.grossPremium || 0,
          commissionRate: 0,
          commissionAmount: 0,
          whtRate: 0,
          whtAmount: 0,
          orcRate: 0,
          orcAmount: 0,
          netPremium: result.grossPremium || 0,
          ncdfRate: 0,
          ncdfValue: 0,
          ncdfNetValue: 0,
          naicomLevyRate: 0,
          naicomLevyValue: 0,
          naicomLevyNetValue: 0,
          orcDeductedFromNet: false
        },
        
        // Currency
        exRate: result.exRate || 1,
        exCurrency: result.exCurrency || "NGN",
        sumInsuredFrgn: result.sumInsuredFrgn || 0,
        grossPremiumFrgn: result.grossPremiumFrgn || 0,
        
        // Payment
        paymentType: result.paymentType || "DIRECT CASH",
        creditRefNo: result.creditRefNo || "N/A",
        narration: result.narration || "",
        transGuid: result.transGuid || `DN-${Date.now()}`,
        
        // Coinsurance
        coinsuranceLines: result.coinsuranceLines || [],
        
        // Other
        totalTrackingCost: result.totalTrackingCost || 0,
        approval: result.approval || 0,
        
        // UI flags
        ui: result.ui || {
          showCommissionSection: true,
          showWhtSection: true,
          showOrcSection: false,
          showDistributionSection: false,
          showComputeButton: false,
          showTrackingCost: false,
          showLevies: false,
          showCurrencyPanel: true,
          showShareTotals: false,
          commissionEditable: true,
          editable: true,
          lockReason: null
        }
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to prefill debit note");
    }
  }
);

// GET /api/grouplife/debit-notes/{dncnNo} - Load an existing debit note
export const loadDebitNote = createAsyncThunk(
  "groupLifeQuotations/loadDebitNote",
  async ({ dncnNo, riskClass }: { dncnNo: string; riskClass?: string }, { rejectWithValue }) => {
    try {
      if (!dncnNo) {
        throw new Error("Debit note number is required");
      }

      const url = new URL(`${SERVER_URL}/grouplife/debit-notes/${encodeURIComponent(dncnNo)}`);
      if (riskClass) {
        url.searchParams.append('riskClass', riskClass);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result: DebitNote = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to load debit note");
    }
  }
);

// PUT /api/grouplife/debit-notes/{dncnNo} - Amend an unposted debit note
export const amendDebitNote = createAsyncThunk(
  "groupLifeQuotations/amendDebitNote",
  async ({ dncnNo, data }: { dncnNo: string; data: AmendDebitNoteRequest }, { rejectWithValue }) => {
    try {
      if (!dncnNo) {
        throw new Error("Debit note number is required");
      }

      const url = `${SERVER_URL}/grouplife/debit-notes/${encodeURIComponent(dncnNo)}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to amend debit note");
    }
  }
);

// GET /api/grouplife/debit-notes/{dncnNo}/refresh - Re-pull sum insured / gross premium from underlying policy detail
export const refreshDebitNote = createAsyncThunk(
  "groupLifeQuotations/refreshDebitNote",
  async ({ dncnNo, riskClass }: { dncnNo: string; riskClass?: string }, { rejectWithValue }) => {
    try {
      if (!dncnNo) {
        throw new Error("Debit note number is required");
      }

      const url = new URL(`${SERVER_URL}/grouplife/debit-notes/${encodeURIComponent(dncnNo)}/refresh`);
      if (riskClass) {
        url.searchParams.append('riskClass', riskClass);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result: DebitNote = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to refresh debit note");
    }
  }
);

// POST /api/grouplife/debit-notes/calculate - Commission, WHT, ORC and net premium for the header figures
export const calculateDebitNotePremium = createAsyncThunk(
  "groupLifeQuotations/calculateDebitNotePremium",
  async (request: CalculatePremiumRequest, { rejectWithValue }) => {
    try {
      const url = `${SERVER_URL}/grouplife/debit-notes/calculate`;

      const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result: CalculatePremiumResponse = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to calculate premium");
    }
  }
);

// POST /api/grouplife/debit-notes/distribute - Spread the risk across co-insurance participants
export const distributeDebitNoteRisk = createAsyncThunk(
  "groupLifeQuotations/distributeDebitNoteRisk",
  async (request: DistributeRiskRequest, { rejectWithValue }) => {
    try {
      const url = `${SERVER_URL}/grouplife/debit-notes/distribute`;

      const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result: DistributeRiskResponse = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to distribute risk");
    }
  }
);

// POST /api/grouplife/debit-notes - Raise the debit note with default flags = false
export const raiseDebitNote = createAsyncThunk(
  "groupLifeQuotations/raiseDebitNote",
  async (request: RaiseDebitNoteRequest, { rejectWithValue }) => {
    try {
      // Ensure all post flags default to false if not provided
      const payload = {
        ...request,
        postCommissionCreditNote: request.postCommissionCreditNote ?? false,
        postCoinsuranceCreditNotes: request.postCoinsuranceCreditNotes ?? false,
        postCoinsuranceOrcDebitNotes: request.postCoinsuranceOrcDebitNotes ?? false,
        postLeadOrcCreditNotes: request.postLeadOrcCreditNotes ?? false,
      };

      const url = `${SERVER_URL}/grouplife/debit-notes`;

      const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result: RaiseDebitNoteResponse = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to raise debit note");
    }
  }
);

// PUT /api/grouplife/debit-notes/{dncnNo}/approve - Approve the note
export const approveDebitNote = createAsyncThunk(
  "groupLifeQuotations/approveDebitNote",
  async (request: ApproveDebitNoteRequest, { rejectWithValue }) => {
    try {
      if (!request.dncnNo) {
        throw new Error("Debit note number is required");
      }

      const url = new URL(`${SERVER_URL}/grouplife/debit-notes/${encodeURIComponent(request.dncnNo)}/approve`);
      if (request.approvalStatus !== undefined) {
        url.searchParams.append('approvalStatus', String(request.approvalStatus));
      }

      const response = await fetch(url.toString(), {
        method: "PUT",
        headers: getHeaders(),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result: ApproveDebitNoteResponse = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to approve debit note");
    }
  }
);

// ================================================================
// 🆕 CO-INSURANCE CREDIT NOTE ENDPOINTS
// ================================================================

// GET /api/grouplife/coinsurance-notes - List co-insurance notes
export const fetchCoinsuranceCreditNotes = createAsyncThunk(
  "groupLifeQuotations/fetchCoinsuranceCreditNotes",
  async (filters: CoinsuranceCreditNoteFilters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.policyNo) queryParams.append('PolicyNo', filters.policyNo);
      if (filters.refDebitNoteNo) queryParams.append('RefDebitNoteNo', filters.refDebitNoteNo);
      if (filters.participantId) queryParams.append('ParticipantId', filters.participantId);
      if (filters.branchId) queryParams.append('BranchId', filters.branchId);
      if (filters.approval !== undefined) queryParams.append('Approval', String(filters.approval));
      if (filters.reversalsOnly !== undefined) queryParams.append('ReversalsOnly', String(filters.reversalsOnly));
      if (filters.billingFrom) queryParams.append('BillingFrom', filters.billingFrom);
      if (filters.billingTo) queryParams.append('BillingTo', filters.billingTo);
      if (filters.search) queryParams.append('Search', filters.search);
      if (filters.page) queryParams.append('Page', String(filters.page));
      if (filters.pageSize) queryParams.append('PageSize', String(filters.pageSize));

      const queryString = queryParams.toString();
      const url = `${SERVER_URL}/grouplife/coinsurance-notes${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result: CoinsuranceCreditNoteListResponse = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch coinsurance credit notes");
    }
  }
);

// GET /api/grouplife/coinsurance-notes/new - Prefill from the head debit note
export const prefillCoinsuranceCreditNote = createAsyncThunk(
  "groupLifeQuotations/prefillCoinsuranceCreditNote",
  async (request: PrefillCoinsuranceCreditNoteRequest, { rejectWithValue }) => {
    try {
      const url = new URL(`${SERVER_URL}/grouplife/coinsurance-notes/new`);
      url.searchParams.append('policyNo', request.policyNo);
      url.searchParams.append('refDebitNoteNo', request.refDebitNoteNo);
      if (request.type) {
        url.searchParams.append('type', request.type);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result: CoinsuranceCreditNote = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to prefill coinsurance credit note");
    }
  }
);

// ================================================================
// 🆕 DEBIT NOTE CHILDREN ENDPOINT
// ================================================================

// GET /api/grouplife/debit-notes/{dncnNo}/children - Get child notes (commission, participant, ORC notes)
export const fetchDebitNoteChildren = createAsyncThunk(
  "groupLifeQuotations/fetchDebitNoteChildren",
  async (dncnNo: string, { rejectWithValue }) => {
    try {
      if (!dncnNo) {
        throw new Error("Debit note number is required");
      }

      const url = `${SERVER_URL}/grouplife/debit-notes/${encodeURIComponent(dncnNo)}/children`;

      const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result; // Returns an array of child notes
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch debit note children");
    }
  }
);

// GET /api/grouplife/coinsurance-notes/{dncnNo} - Load an existing co-insurance note
export const loadCoinsuranceCreditNote = createAsyncThunk(
  "groupLifeQuotations/loadCoinsuranceCreditNote",
  async (dncnNo: string, { rejectWithValue }) => {
    try {
      if (!dncnNo) {
        throw new Error("Co-insurance note number is required");
      }

      const url = `${SERVER_URL}/grouplife/coinsurance-notes/${encodeURIComponent(dncnNo)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result: CoinsuranceCreditNote = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to load coinsurance credit note");
    }
  }
);

// PUT /api/grouplife/coinsurance-notes/{dncnNo} - Amend a co-insurance note that has not reached the ledger
export const amendCoinsuranceCreditNote = createAsyncThunk(
  "groupLifeQuotations/amendCoinsuranceCreditNote",
  async ({ dncnNo, data }: { dncnNo: string; data: AmendCoinsuranceCreditNoteRequest }, { rejectWithValue }) => {
    try {
      if (!dncnNo) {
        throw new Error("Co-insurance note number is required");
      }

      const url = `${SERVER_URL}/grouplife/coinsurance-notes/${encodeURIComponent(dncnNo)}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to amend coinsurance credit note");
    }
  }
);

// POST /api/grouplife/coinsurance-notes/calculate - Share, commission, WHT, net and ORC for one participant
export const calculateCoinsuranceCreditNote = createAsyncThunk(
  "groupLifeQuotations/calculateCoinsuranceCreditNote",
  async (request: CalculateCoinsuranceCreditNoteRequest, { rejectWithValue }) => {
    try {
      const url = `${SERVER_URL}/grouplife/coinsurance-notes/calculate`;

      const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result: CalculateCoinsuranceCreditNoteResponse = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to calculate coinsurance credit note");
    }
  }
);

// POST /api/grouplife/coinsurance-notes - Raise a credit note for one participating company
export const raiseCoinsuranceCreditNote = createAsyncThunk(
  "groupLifeQuotations/raiseCoinsuranceCreditNote",
  async (request: RaiseCoinsuranceCreditNoteRequest, { rejectWithValue }) => {
    try {
      const url = `${SERVER_URL}/grouplife/coinsurance-notes`;

      const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result: RaiseCoinsuranceCreditNoteResponse = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to raise coinsurance credit note");
    }
  }
);

// ==================== SLICE ====================

const groupLifeQuotationSlice = createSlice({
  name: "groupLifeQuotations",
  initialState,
  reducers: {
    setCurrentQuotation: (
      state,
      action: PayloadAction<GroupLifePolicy | null>
    ) => {
      state.currentQuotation = action.payload;
      if (action.payload?.members) {
        state.currentMembers = action.payload.members;
      } else {
        state.currentMembers = [];
      }
    },
    clearCurrentQuotation: (state) => {
      state.currentQuotation = null;
      state.currentMembers = [];
      state.policyDetail = null;
      state.aggregateTotals = null;
      state.createdEndorsement = null;
      state.currentDebitNote = null;
      state.calculatedPremium = null;
      state.distributedRisk = null;
      state.raisedDebitNote = null;
      state.approvedDebitNote = null;
      state.currentCoinsuranceCreditNote = null;
      state.calculatedCoinsuranceCreditNote = null;
      state.raisedCoinsuranceCreditNote = null;
    },
    setCurrentMembers: (
      state,
      action: PayloadAction<GroupLifeMember[]>
    ) => {
      state.currentMembers = action.payload;
      if (state.currentQuotation) {
        state.currentQuotation.members = action.payload;
        state.currentQuotation.totalMembers = action.payload.length;
      }
    },
    setMembersForCurrentQuotation: (state, action: PayloadAction<GroupLifeMember[]>) => {
      if (state.currentQuotation) {
        state.currentQuotation.members = action.payload;
        state.currentQuotation.totalMembers = action.payload.length;
        state.currentMembers = action.payload;
      }
    },
    addMemberToCurrentQuotation: (
      state,
      action: PayloadAction<GroupLifeMember>
    ) => {
      state.currentMembers.push(action.payload);
      if (state.currentQuotation) {
        state.currentQuotation.members = state.currentMembers;
        state.currentQuotation.totalMembers = state.currentMembers.length;
      }
    },
    updateMemberInCurrentQuotation: (
      state,
      action: PayloadAction<{ index: number; member: GroupLifeMember }>
    ) => {
      state.currentMembers[action.payload.index] = action.payload.member;
      if (state.currentQuotation) {
        state.currentQuotation.members = state.currentMembers;
      }
    },
    removeMemberFromCurrentQuotation: (
      state,
      action: PayloadAction<number>
    ) => {
      state.currentMembers.splice(action.payload, 1);
      if (state.currentQuotation) {
        state.currentQuotation.members = state.currentMembers;
        state.currentQuotation.totalMembers = state.currentMembers.length;
      }
    },
    setComputedTotalsForCurrentQuotation: (
      state,
      action: PayloadAction<{
        totalSumInsured?: number;
        totalPremium?: number;
        netPremiumDue?: number;
        loadingPercentage?: number;
        reductionPercentage?: number;
      }>
    ) => {
      if (state.currentQuotation) {
        const {
          totalSumInsured,
          totalPremium,
          netPremiumDue,
          loadingPercentage,
          reductionPercentage,
        } = action.payload;
        if (typeof totalSumInsured === "number")
          state.currentQuotation.totalSumInsured = totalSumInsured;
        if (typeof totalPremium === "number")
          state.currentQuotation.totalPremium = totalPremium;
        if (typeof netPremiumDue === "number")
          state.currentQuotation.netPremiumDue = netPremiumDue;
        if (typeof loadingPercentage === "number")
          state.currentQuotation.loadingPercentage = loadingPercentage;
        if (typeof reductionPercentage === "number")
          state.currentQuotation.reductionPercentage = reductionPercentage;
      }
    },
    clearErrors: (state) => {
      state.error = initialState.error;
    },
    clearAggregateTotals: (state) => {
      state.aggregateTotals = null;
    },
    setPolicyDetail: (state, action: PayloadAction<PolicyDetail | null>) => {
      state.policyDetail = action.payload;
    },
    clearEndorsement: (state) => {
      state.createdEndorsement = null;
      state.error.endorsement = null;
    },
    setCurrentDebitNote: (state, action: PayloadAction<DebitNote | null>) => {
      state.currentDebitNote = action.payload;
    },
    clearCurrentDebitNote: (state) => {
      state.currentDebitNote = null;
      state.calculatedPremium = null;
      state.distributedRisk = null;
      state.raisedDebitNote = null;
      state.approvedDebitNote = null;
    },
    clearDebitNoteErrors: (state) => {
      state.error.debitNoteNew = null;
      state.error.debitNoteLoad = null;
      state.error.debitNoteAmend = null;
      state.error.debitNoteRefresh = null;
      state.error.debitNoteCalculate = null;
      state.error.debitNoteDistribute = null;
      state.error.debitNoteRaise = null;
      state.error.debitNoteApprove = null;
      state.error.debitNoteList = null;
    },
    clearCurrentCoinsuranceCreditNote: (state) => {
      state.currentCoinsuranceCreditNote = null;
      state.calculatedCoinsuranceCreditNote = null;
      state.raisedCoinsuranceCreditNote = null;
    },
    clearCoinsuranceCreditNoteErrors: (state) => {
      state.error.coinsuranceCreditNoteNew = null;
      state.error.coinsuranceCreditNoteLoad = null;
      state.error.coinsuranceCreditNoteAmend = null;
      state.error.coinsuranceCreditNoteCalculate = null;
      state.error.coinsuranceCreditNoteRaise = null;
      state.error.coinsuranceCreditNoteList = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Policy
      .addCase(createGroupLifePolicy.pending, (state) => {
        state.loading.create = true;
        state.error.create = null;
      })
      .addCase(createGroupLifePolicy.fulfilled, (state, action) => {
        state.loading.create = false;
        const policy = action.payload;
        state.quotations.unshift(policy);
        state.currentQuotation = policy;
        state.currentMembers = policy.members || [];
      })
      .addCase(createGroupLifePolicy.rejected, (state, action) => {
        state.loading.create = false;
        state.error.create = action.payload as string;
      })

      // Fetch Policy
      .addCase(fetchGroupLifePolicy.pending, (state) => {
        state.loading.detail = true;
        state.error.detail = null;
      })
      .addCase(fetchGroupLifePolicy.fulfilled, (state, action) => {
        state.loading.detail = false;
        state.currentQuotation = action.payload;
        state.currentMembers = action.payload.members || [];
      })
      .addCase(fetchGroupLifePolicy.rejected, (state, action) => {
        state.loading.detail = false;
        state.error.detail = action.payload as string;
      })

      // Fetch Policies List
      .addCase(fetchGroupLifePolicies.pending, (state) => {
        state.loading.policies = true;
        state.error.policies = null;
      })
      .addCase(fetchGroupLifePolicies.fulfilled, (state, action) => {
        state.loading.policies = false;
        state.policies = action.payload.items || [];
        state.policiesTotalCount = action.payload.totalCount || 0;
        state.policiesTotalPages = action.payload.totalPages || 0;
        state.totalCount = action.payload.totalCount || 0;
      })
      .addCase(fetchGroupLifePolicies.rejected, (state, action) => {
        state.loading.policies = false;
        state.error.policies = action.payload as string;
      })

      // Update Policy
      .addCase(updateGroupLifePolicy.pending, (state) => {
        state.loading.update = true;
        state.error.update = null;
      })
      .addCase(updateGroupLifePolicy.fulfilled, (state, action) => {
        state.loading.update = false;
        const updated = action.payload;
        const index = state.quotations.findIndex(
          (q) => q.policyNo === updated.policyNo
        );
        if (index !== -1) {
          state.quotations[index] = updated;
        }
        state.currentQuotation = updated;
        state.currentMembers = updated.members || [];
      })
      .addCase(updateGroupLifePolicy.rejected, (state, action) => {
        state.loading.update = false;
        state.error.update = action.payload as string;
      })

      // Ensure Policy Detail
      .addCase(ensurePolicyDetail.pending, (state) => {
        state.loading.detail = true;
        state.error.detail = null;
      })
      .addCase(ensurePolicyDetail.fulfilled, (state, action) => {
        state.loading.detail = false;
        state.policyDetail = action.payload;
      })
      .addCase(ensurePolicyDetail.rejected, (state, action) => {
        state.loading.detail = false;
        state.error.detail = action.payload as string;
      })

      // Fetch Policy Detail
      .addCase(fetchPolicyDetail.pending, (state) => {
        state.loading.detail = true;
        state.error.detail = null;
      })
      .addCase(fetchPolicyDetail.fulfilled, (state, action) => {
        state.loading.detail = false;
        state.policyDetail = action.payload;
      })
      .addCase(fetchPolicyDetail.rejected, (state, action) => {
        state.loading.detail = false;
        state.error.detail = action.payload as string;
      })

      // Fetch Members
      .addCase(fetchPolicyMembers.pending, (state) => {
        state.loading.detail = true;
        state.error.detail = null;
      })
      .addCase(fetchPolicyMembers.fulfilled, (state, action) => {
        state.loading.detail = false;
        state.currentMembers = action.payload || [];
        if (state.currentQuotation) {
          state.currentQuotation.members = action.payload || [];
          state.currentQuotation.totalMembers = action.payload?.length || 0;
        }
      })
      .addCase(fetchPolicyMembers.rejected, (state, action) => {
        state.loading.detail = false;
        state.error.detail = action.payload as string;
      })

      // Compute Member Premium
      .addCase(computeMemberPremium.pending, (state) => {
        state.loading.compute = true;
        state.error.compute = null;
      })
      .addCase(computeMemberPremium.fulfilled, (state) => {
        state.loading.compute = false;
      })
      .addCase(computeMemberPremium.rejected, (state, action) => {
        state.loading.compute = false;
        state.error.compute = action.payload as string;
      })

      // Save Member
      .addCase(savePolicyMember.pending, (state) => {
        state.loading.update = true;
        state.error.update = null;
      })
      .addCase(savePolicyMember.fulfilled, (state) => {
        state.loading.update = false;
      })
      .addCase(savePolicyMember.rejected, (state, action) => {
        state.loading.update = false;
        state.error.update = action.payload as string;
      })

      // Remove Member
      .addCase(removePolicyMember.pending, (state) => {
        state.loading.delete = true;
        state.error.delete = null;
      })
      .addCase(removePolicyMember.fulfilled, (state, action) => {
        state.loading.delete = false;
        const memberId = action.payload;
        state.currentMembers = state.currentMembers.filter(
          (m) => m.id !== memberId && m.memberId !== memberId
        );
        if (state.currentQuotation) {
          state.currentQuotation.members = state.currentMembers;
          state.currentQuotation.totalMembers = state.currentMembers.length;
        }
      })
      .addCase(removePolicyMember.rejected, (state, action) => {
        state.loading.delete = false;
        state.error.delete = action.payload as string;
      })

      // Fetch Aggregate Totals
      .addCase(fetchAggregateTotals.pending, (state) => {
        state.loading.aggregate = true;
        state.error.aggregate = null;
      })
      .addCase(fetchAggregateTotals.fulfilled, (state, action) => {
        state.loading.aggregate = false;
        state.aggregateTotals = action.payload;
      })
      .addCase(fetchAggregateTotals.rejected, (state, action) => {
        state.loading.aggregate = false;
        state.error.aggregate = action.payload as string;
      })

      // Bulk Upload Members
      .addCase(bulkUploadMembers.pending, (state) => {
        state.loading.bulk = true;
        state.error.bulk = null;
      })
      .addCase(bulkUploadMembers.fulfilled, (state) => {
        state.loading.bulk = false;
      })
      .addCase(bulkUploadMembers.rejected, (state, action) => {
        state.loading.bulk = false;
        state.error.bulk = action.payload as string;
      })

      // Parse Excel
      .addCase(parseExcelMembers.pending, (state) => {
        state.loading.parse = true;
        state.error.parse = null;
      })
      .addCase(parseExcelMembers.fulfilled, (state, action) => {
        state.loading.parse = false;
        state.currentMembers = action.payload.members || [];
      })
      .addCase(parseExcelMembers.rejected, (state, action) => {
        state.loading.parse = false;
        state.error.parse = action.payload as string;
      })

      // Upload Excel
      .addCase(uploadExcelMembers.pending, (state) => {
        state.loading.upload = true;
        state.error.upload = null;
      })
      .addCase(uploadExcelMembers.fulfilled, (state) => {
        state.loading.upload = false;
      })
      .addCase(uploadExcelMembers.rejected, (state, action) => {
        state.loading.upload = false;
        state.error.upload = action.payload as string;
      })

      // Compute ANB
      .addCase(computeAgeNextBirthday.pending, (state) => {
        state.loading.anb = true;
        state.error.anb = null;
      })
      .addCase(computeAgeNextBirthday.fulfilled, (state) => {
        state.loading.anb = false;
      })
      .addCase(computeAgeNextBirthday.rejected, (state, action) => {
        state.loading.anb = false;
        state.error.anb = action.payload as string;
      })

      // Compute Duration
      .addCase(computeDuration.pending, (state) => {
        state.loading.duration = true;
        state.error.duration = null;
      })
      .addCase(computeDuration.fulfilled, (state) => {
        state.loading.duration = false;
      })
      .addCase(computeDuration.rejected, (state, action) => {
        state.loading.duration = false;
        state.error.duration = action.payload as string;
      })

      // Create Endorsement
      .addCase(createEndorsement.pending, (state) => {
        state.loading.endorsement = true;
        state.error.endorsement = null;
        state.createdEndorsement = null;
      })
      .addCase(createEndorsement.fulfilled, (state, action) => {
        state.loading.endorsement = false;
        state.createdEndorsement = action.payload;
      })
      .addCase(createEndorsement.rejected, (state, action) => {
        state.loading.endorsement = false;
        state.error.endorsement = action.payload as string;
        state.createdEndorsement = null;
      })

      // ================================================================
      // 🆕 DEBIT NOTE REDUCERS
      // ================================================================

      // Fetch Debit Notes List
      .addCase(fetchDebitNotes.pending, (state) => {
        state.loading.debitNoteList = true;
        state.error.debitNoteList = null;
      })
      .addCase(fetchDebitNotes.fulfilled, (state, action) => {
        state.loading.debitNoteList = false;
        state.debitNoteList = action.payload.items || [];
        state.debitNoteListTotalCount = action.payload.totalCount || 0;
        state.debitNoteListTotalPages = action.payload.totalPages || 0;
      })
      .addCase(fetchDebitNotes.rejected, (state, action) => {
        state.loading.debitNoteList = false;
        state.error.debitNoteList = action.payload as string;
        state.debitNoteList = [];
        state.debitNoteListTotalCount = 0;
        state.debitNoteListTotalPages = 0;
      })

      // Prefill Debit Note
      .addCase(prefillDebitNote.pending, (state) => {
        state.loading.debitNoteNew = true;
        state.error.debitNoteNew = null;
        state.currentDebitNote = null;
      })
      .addCase(prefillDebitNote.fulfilled, (state, action) => {
        state.loading.debitNoteNew = false;
        state.currentDebitNote = action.payload;
      })
      .addCase(prefillDebitNote.rejected, (state, action) => {
        state.loading.debitNoteNew = false;
        state.error.debitNoteNew = action.payload as string;
        state.currentDebitNote = null;
      })

      // Load Debit Note
      .addCase(loadDebitNote.pending, (state) => {
        state.loading.debitNoteLoad = true;
        state.error.debitNoteLoad = null;
        state.currentDebitNote = null;
      })
      .addCase(loadDebitNote.fulfilled, (state, action) => {
        state.loading.debitNoteLoad = false;
        state.currentDebitNote = action.payload;
      })
      .addCase(loadDebitNote.rejected, (state, action) => {
        state.loading.debitNoteLoad = false;
        state.error.debitNoteLoad = action.payload as string;
        state.currentDebitNote = null;
      })

      // Amend Debit Note
      .addCase(amendDebitNote.pending, (state) => {
        state.loading.debitNoteAmend = true;
        state.error.debitNoteAmend = null;
      })
      .addCase(amendDebitNote.fulfilled, (state, action) => {
        state.loading.debitNoteAmend = false;
        if (state.currentDebitNote) {
          state.currentDebitNote = { ...state.currentDebitNote, ...action.payload };
        }
      })
      .addCase(amendDebitNote.rejected, (state, action) => {
        state.loading.debitNoteAmend = false;
        state.error.debitNoteAmend = action.payload as string;
      })

      // Refresh Debit Note
      .addCase(refreshDebitNote.pending, (state) => {
        state.loading.debitNoteRefresh = true;
        state.error.debitNoteRefresh = null;
      })
      .addCase(refreshDebitNote.fulfilled, (state, action) => {
        state.loading.debitNoteRefresh = false;
        state.currentDebitNote = action.payload;
      })
      .addCase(refreshDebitNote.rejected, (state, action) => {
        state.loading.debitNoteRefresh = false;
        state.error.debitNoteRefresh = action.payload as string;
      })

      // Calculate Debit Note Premium
      .addCase(calculateDebitNotePremium.pending, (state) => {
        state.loading.debitNoteCalculate = true;
        state.error.debitNoteCalculate = null;
        state.calculatedPremium = null;
      })
      .addCase(calculateDebitNotePremium.fulfilled, (state, action) => {
        state.loading.debitNoteCalculate = false;
        state.calculatedPremium = action.payload;
      })
      .addCase(calculateDebitNotePremium.rejected, (state, action) => {
        state.loading.debitNoteCalculate = false;
        state.error.debitNoteCalculate = action.payload as string;
        state.calculatedPremium = null;
      })

      // Distribute Debit Note Risk
      .addCase(distributeDebitNoteRisk.pending, (state) => {
        state.loading.debitNoteDistribute = true;
        state.error.debitNoteDistribute = null;
        state.distributedRisk = null;
      })
      .addCase(distributeDebitNoteRisk.fulfilled, (state, action) => {
        state.loading.debitNoteDistribute = false;
        state.distributedRisk = action.payload;
        if (action.payload.isBalanced && action.payload.errors.length === 0) {
          if (state.currentDebitNote) {
            state.currentDebitNote.coinsuranceLines = action.payload.lines;
          }
        }
      })
      .addCase(distributeDebitNoteRisk.rejected, (state, action) => {
        state.loading.debitNoteDistribute = false;
        state.error.debitNoteDistribute = action.payload as string;
        state.distributedRisk = null;
      })

      // Raise Debit Note
      .addCase(raiseDebitNote.pending, (state) => {
        state.loading.debitNoteRaise = true;
        state.error.debitNoteRaise = null;
        state.raisedDebitNote = null;
      })
      .addCase(raiseDebitNote.fulfilled, (state, action) => {
        state.loading.debitNoteRaise = false;
        state.raisedDebitNote = action.payload;
      })
      .addCase(raiseDebitNote.rejected, (state, action) => {
        state.loading.debitNoteRaise = false;
        state.error.debitNoteRaise = action.payload as string;
        state.raisedDebitNote = null;
      })

      // Approve Debit Note
      .addCase(approveDebitNote.pending, (state) => {
        state.loading.debitNoteApprove = true;
        state.error.debitNoteApprove = null;
        state.approvedDebitNote = null;
      })
      .addCase(approveDebitNote.fulfilled, (state, action) => {
        state.loading.debitNoteApprove = false;
        state.approvedDebitNote = action.payload;
        if (state.currentDebitNote && action.payload.renumbered) {
          state.currentDebitNote.debitNoteNo = action.payload.debitNoteNo;
        }
      })
      .addCase(approveDebitNote.rejected, (state, action) => {
        state.loading.debitNoteApprove = false;
        state.error.debitNoteApprove = action.payload as string;
        state.approvedDebitNote = null;
      })

      // ================================================================
      // 🆕 CO-INSURANCE CREDIT NOTE REDUCERS
      // ================================================================

      // Fetch Coinsurance Credit Notes List
      .addCase(fetchCoinsuranceCreditNotes.pending, (state) => {
        state.loading.coinsuranceCreditNoteList = true;
        state.error.coinsuranceCreditNoteList = null;
      })
      .addCase(fetchCoinsuranceCreditNotes.fulfilled, (state, action) => {
        state.loading.coinsuranceCreditNoteList = false;
        state.coinsuranceCreditNoteList = action.payload.items || [];
        state.coinsuranceCreditNoteListTotalCount = action.payload.totalCount || 0;
        state.coinsuranceCreditNoteListTotalPages = action.payload.totalPages || 0;
      })
      .addCase(fetchCoinsuranceCreditNotes.rejected, (state, action) => {
        state.loading.coinsuranceCreditNoteList = false;
        state.error.coinsuranceCreditNoteList = action.payload as string;
        state.coinsuranceCreditNoteList = [];
        state.coinsuranceCreditNoteListTotalCount = 0;
        state.coinsuranceCreditNoteListTotalPages = 0;
      })

      // Prefill Coinsurance Credit Note
      .addCase(prefillCoinsuranceCreditNote.pending, (state) => {
        state.loading.coinsuranceCreditNoteNew = true;
        state.error.coinsuranceCreditNoteNew = null;
        state.currentCoinsuranceCreditNote = null;
      })
      .addCase(prefillCoinsuranceCreditNote.fulfilled, (state, action) => {
        state.loading.coinsuranceCreditNoteNew = false;
        state.currentCoinsuranceCreditNote = action.payload;
      })
      .addCase(prefillCoinsuranceCreditNote.rejected, (state, action) => {
        state.loading.coinsuranceCreditNoteNew = false;
        state.error.coinsuranceCreditNoteNew = action.payload as string;
        state.currentCoinsuranceCreditNote = null;
      })

      // Load Coinsurance Credit Note
      .addCase(loadCoinsuranceCreditNote.pending, (state) => {
        state.loading.coinsuranceCreditNoteLoad = true;
        state.error.coinsuranceCreditNoteLoad = null;
        state.currentCoinsuranceCreditNote = null;
      })
      .addCase(loadCoinsuranceCreditNote.fulfilled, (state, action) => {
        state.loading.coinsuranceCreditNoteLoad = false;
        state.currentCoinsuranceCreditNote = action.payload;
      })
      .addCase(loadCoinsuranceCreditNote.rejected, (state, action) => {
        state.loading.coinsuranceCreditNoteLoad = false;
        state.error.coinsuranceCreditNoteLoad = action.payload as string;
        state.currentCoinsuranceCreditNote = null;
      })

      // Amend Coinsurance Credit Note
      .addCase(amendCoinsuranceCreditNote.pending, (state) => {
        state.loading.coinsuranceCreditNoteAmend = true;
        state.error.coinsuranceCreditNoteAmend = null;
      })
      .addCase(amendCoinsuranceCreditNote.fulfilled, (state, action) => {
        state.loading.coinsuranceCreditNoteAmend = false;
        if (state.currentCoinsuranceCreditNote) {
          state.currentCoinsuranceCreditNote = { ...state.currentCoinsuranceCreditNote, ...action.payload };
        }
      })
      .addCase(amendCoinsuranceCreditNote.rejected, (state, action) => {
        state.loading.coinsuranceCreditNoteAmend = false;
        state.error.coinsuranceCreditNoteAmend = action.payload as string;
      })
      // Fetch Debit Note Children
.addCase(fetchDebitNoteChildren.pending, (state) => {
  state.loading.debitNoteChildren = true;
  state.error.debitNoteChildren = null;
  state.debitNoteChildren = [];
})
.addCase(fetchDebitNoteChildren.fulfilled, (state, action) => {
  state.loading.debitNoteChildren = false;
  state.debitNoteChildren = action.payload || [];
})
.addCase(fetchDebitNoteChildren.rejected, (state, action) => {
  state.loading.debitNoteChildren = false;
  state.error.debitNoteChildren = action.payload as string;
  state.debitNoteChildren = [];
})

      // Calculate Coinsurance Credit Note
      .addCase(calculateCoinsuranceCreditNote.pending, (state) => {
        state.loading.coinsuranceCreditNoteCalculate = true;
        state.error.coinsuranceCreditNoteCalculate = null;
        state.calculatedCoinsuranceCreditNote = null;
      })
      .addCase(calculateCoinsuranceCreditNote.fulfilled, (state, action) => {
        state.loading.coinsuranceCreditNoteCalculate = false;
        state.calculatedCoinsuranceCreditNote = action.payload;
      })
      .addCase(calculateCoinsuranceCreditNote.rejected, (state, action) => {
        state.loading.coinsuranceCreditNoteCalculate = false;
        state.error.coinsuranceCreditNoteCalculate = action.payload as string;
        state.calculatedCoinsuranceCreditNote = null;
      })

      // Raise Coinsurance Credit Note
      .addCase(raiseCoinsuranceCreditNote.pending, (state) => {
        state.loading.coinsuranceCreditNoteRaise = true;
        state.error.coinsuranceCreditNoteRaise = null;
        state.raisedCoinsuranceCreditNote = null;
      })
      .addCase(raiseCoinsuranceCreditNote.fulfilled, (state, action) => {
        state.loading.coinsuranceCreditNoteRaise = false;
        state.raisedCoinsuranceCreditNote = action.payload;
      })
      .addCase(raiseCoinsuranceCreditNote.rejected, (state, action) => {
        state.loading.coinsuranceCreditNoteRaise = false;
        state.error.coinsuranceCreditNoteRaise = action.payload as string;
        state.raisedCoinsuranceCreditNote = null;
      });
  },
});

// ==================== EXPORTS ====================

export const {
  setCurrentQuotation,
  clearCurrentQuotation,
  setCurrentMembers,
  addMemberToCurrentQuotation,
  updateMemberInCurrentQuotation,
  removeMemberFromCurrentQuotation,
  setComputedTotalsForCurrentQuotation,
  clearErrors,
  setMembersForCurrentQuotation,
  clearAggregateTotals,
  setPolicyDetail,
  clearEndorsement,
  setCurrentDebitNote,
  clearCurrentDebitNote,
  clearDebitNoteErrors,
  clearCurrentCoinsuranceCreditNote,
  clearCoinsuranceCreditNoteErrors,
} = groupLifeQuotationSlice.actions;

export const selectGroupLifeQuotations = (state: {
  groupLifeQuotations: GroupLifeQuotationState;
}) => state.groupLifeQuotations;

export const selectGroupLifePolicies = (state: {
  groupLifeQuotations: GroupLifeQuotationState;
}) => ({
  policies: state.groupLifeQuotations.policies,
  totalCount: state.groupLifeQuotations.policiesTotalCount,
  totalPages: state.groupLifeQuotations.policiesTotalPages,
  loading: state.groupLifeQuotations.loading.policies,
  error: state.groupLifeQuotations.error.policies,
});

export const selectEndorsement = (state: {
  groupLifeQuotations: GroupLifeQuotationState;
}) => ({
  createdEndorsement: state.groupLifeQuotations.createdEndorsement,
  loading: state.groupLifeQuotations.loading.endorsement,
  error: state.groupLifeQuotations.error.endorsement,
});

export const selectDebitNote = (state: {
  groupLifeQuotations: GroupLifeQuotationState;
}) => ({
  currentDebitNote: state.groupLifeQuotations.currentDebitNote,
  debitNoteList: state.groupLifeQuotations.debitNoteList,
  debitNoteListTotalCount: state.groupLifeQuotations.debitNoteListTotalCount,
  debitNoteListTotalPages: state.groupLifeQuotations.debitNoteListTotalPages,
  calculatedPremium: state.groupLifeQuotations.calculatedPremium,
  distributedRisk: state.groupLifeQuotations.distributedRisk,
  raisedDebitNote: state.groupLifeQuotations.raisedDebitNote,
  approvedDebitNote: state.groupLifeQuotations.approvedDebitNote,
  loading: {
    new: state.groupLifeQuotations.loading.debitNoteNew,
    load: state.groupLifeQuotations.loading.debitNoteLoad,
    amend: state.groupLifeQuotations.loading.debitNoteAmend,
    refresh: state.groupLifeQuotations.loading.debitNoteRefresh,
    calculate: state.groupLifeQuotations.loading.debitNoteCalculate,
    distribute: state.groupLifeQuotations.loading.debitNoteDistribute,
    raise: state.groupLifeQuotations.loading.debitNoteRaise,
    approve: state.groupLifeQuotations.loading.debitNoteApprove,
    list: state.groupLifeQuotations.loading.debitNoteList,
  },
  error: {
    new: state.groupLifeQuotations.error.debitNoteNew,
    load: state.groupLifeQuotations.error.debitNoteLoad,
    amend: state.groupLifeQuotations.error.debitNoteAmend,
    refresh: state.groupLifeQuotations.error.debitNoteRefresh,
    calculate: state.groupLifeQuotations.error.debitNoteCalculate,
    distribute: state.groupLifeQuotations.error.debitNoteDistribute,
    raise: state.groupLifeQuotations.error.debitNoteRaise,
    approve: state.groupLifeQuotations.error.debitNoteApprove,
    list: state.groupLifeQuotations.error.debitNoteList,
  },
});

export const selectDebitNoteChildren = (state: {
  groupLifeQuotations: GroupLifeQuotationState;
}) => ({
  children: state.groupLifeQuotations.debitNoteChildren,
  loading: state.groupLifeQuotations.loading.debitNoteChildren,
  error: state.groupLifeQuotations.error.debitNoteChildren,
});

export const selectCoinsuranceCreditNote = (state: {
  groupLifeQuotations: GroupLifeQuotationState;
}) => ({
  currentCoinsuranceCreditNote: state.groupLifeQuotations.currentCoinsuranceCreditNote,
  coinsuranceCreditNoteList: state.groupLifeQuotations.coinsuranceCreditNoteList,
  coinsuranceCreditNoteListTotalCount: state.groupLifeQuotations.coinsuranceCreditNoteListTotalCount,
  coinsuranceCreditNoteListTotalPages: state.groupLifeQuotations.coinsuranceCreditNoteListTotalPages,
  calculatedCoinsuranceCreditNote: state.groupLifeQuotations.calculatedCoinsuranceCreditNote,
  raisedCoinsuranceCreditNote: state.groupLifeQuotations.raisedCoinsuranceCreditNote,
  loading: {
    new: state.groupLifeQuotations.loading.coinsuranceCreditNoteNew,
    load: state.groupLifeQuotations.loading.coinsuranceCreditNoteLoad,
    amend: state.groupLifeQuotations.loading.coinsuranceCreditNoteAmend,
    calculate: state.groupLifeQuotations.loading.coinsuranceCreditNoteCalculate,
    raise: state.groupLifeQuotations.loading.coinsuranceCreditNoteRaise,
    list: state.groupLifeQuotations.loading.coinsuranceCreditNoteList,
  },
  error: {
    new: state.groupLifeQuotations.error.coinsuranceCreditNoteNew,
    load: state.groupLifeQuotations.error.coinsuranceCreditNoteLoad,
    amend: state.groupLifeQuotations.error.coinsuranceCreditNoteAmend,
    calculate: state.groupLifeQuotations.error.coinsuranceCreditNoteCalculate,
    raise: state.groupLifeQuotations.error.coinsuranceCreditNoteRaise,
    list: state.groupLifeQuotations.error.coinsuranceCreditNoteList,
  },
});

export default groupLifeQuotationSlice.reducer;