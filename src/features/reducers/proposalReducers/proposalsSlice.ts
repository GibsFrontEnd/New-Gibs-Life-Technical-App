// proposalsSlice.ts - Updated with correct endpoints
//@ts-nocheck

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiCall from "../../../utils/api-call";
import { decryptData } from "../../../utils/encrypt-utils";
import { SERVER_URL } from "../../../utils/constants";

export interface Proposal {
  policyID: number;
  policyNo: string | null;
  proposalNo: string;
  brCode: string;
  coverCode: string;
  covertype: string | null;
  title: string;
  assuredCode: string;
  surName: string;
  otherNames: string;
  fullName: string;
  address: string;
  state: string;
  mobilePhone: string;
  email: string;
  occupation: string;
  sex: string;
  maritalStatus: string;
  country: string;
  agentcode: string;
  agentDescription: string;
  startDate: string;
  maturityDate: string;
  duration: number;
  dateofBirth: string;
  age: number;
  mop: string | null;
  fop: string | null;
  sumAssured: number;
  premium1: number;
  basicPremium: number;
  totalPremium: number;
  paymentType: string;
  paymentAmount: number;
  dateofpayment: string;
  status: string | null;
  transSTATUS: string | null;
  transGUID: string;
  remarks: string;
  tag: string;
  customerType: string;
  isProposal: number;
  deleted: number;
  submittedBy: string;
  submittedOn: string;
  modifiedOn: string;
  employmentType: string;
  employerName: string;
}

export interface IndividualQuotation {
  quoteID: number;
  quoteNo: string;
  proposalNo: string;
  brCode: string;
  tDate: string;
  assDate: string;
  coverCode: string;
  covertype: string;
  assuredCode: string;
  surName: string;
  otherNames: string;
  address: string | null;
  state: string | null;
  landphone: string | null;
  mobilePhone: string;
  email: string;
  nationalID: string | null;
  occupation: string | null;
  sex: string | null;
  maritalStatus: string | null;
  country: string | null;
  startDate: string;
  maturityDate: string;
  duration: number;
  dateofBirth: string;
  sumAssured: number;
  customerType: string | null;
  cardNo: string;
  status: string;
  medical: string | null;
  premium1: number;
  premium2: number | null;
  premium3: number | null;
  a1: number;
  a2: number;
  tpdRate: number | null;
  ttdrAte: number | null;
  ciRate: number | null;
  medicalRate: number | null;
  funeralRate: number | null;
  suppsa: number | null;
  toAllocate: number | null;
  loading: number | null;
  xMas: number | null;
  adbsa: number | null;
  basicPremium: number | null;
  intrestRate: number | null;
  totalPremium: number;
  transSTATUS: string | null;
  transGUID: string;
  remarks: string;
  tag: string;
  isQuote: number;
  submittedBy: string;
  submittedOn: string;
  modifiedBy: string | null;
  modifiedOn: string | null;
  fullName?: string;
}

export interface ProposalDocument {
  attachID: number;
  docNo: string;
  entryDate: string;
  docTypes: string;
  docFrom: string;
  docDetails: string;
  documentSize: number;
  active: number;
  optionType: string;
  submittedBy: string;
  submittedOn: string;
}

export interface Beneficiary {
  transID: number;
  proposalNo: string;
  surname: string;
  otherNames: string;
  age: string;
  sex: string;
  dob: string;
  relation: string;
  percentage: number;
  type: string;
  transFlag: string;
  photoBase64: string | null;
  hasPhoto: boolean;
  policyNo: string;
  address: string;
  remark: string | null;
  tag: string;
  deleted: number;
  active: number;
  submittedBy: string;
  submittedOn: string;
}

interface ProposalsState {
  items: Proposal[];
  schemeItems: any[];
  quotationItems: IndividualQuotation[];
  totalCount: number;
  schemeTotalCount: number;
  quotationTotalCount: number;
  /** The newest policy-list request; an older response that arrives later is ignored. */
  itemsRequestId?: string | null;
  loading: boolean;
  schemeLoading: boolean;
  quotationLoading: boolean;
  error: string | null;
  schemeError: string | null;
  quotationError: string | null;
  currentProposal: Proposal | null;
  loadingCurrent: boolean;
  errorCurrent: string | null;
  currentDocuments: ProposalDocument[];
  loadingDocuments: boolean;
  errorDocuments: string | null;
  currentBeneficiaries: Beneficiary[];
  loadingBeneficiaries: boolean;
  errorBeneficiaries: string | null;
  proposalStatuses: Array<{ text: string, value: string }>;
  loadingStatuses: boolean;
}

const initialState: ProposalsState = {
  items: [],
  schemeItems: [],
  quotationItems: [],
  totalCount: 0,
  schemeTotalCount: 0,
  quotationTotalCount: 0,
  loading: false,
  schemeLoading: false,
  quotationLoading: false,
  error: null,
  schemeError: null,
  quotationError: null,
  currentProposal: null,
  loadingCurrent: false,
  errorCurrent: null,
  currentDocuments: [],
  loadingDocuments: false,
  errorDocuments: null,
  currentBeneficiaries: [],
  loadingBeneficiaries: false,
  errorBeneficiaries: null,
  proposalStatuses: [],
  loadingStatuses: false,
};

// ✅ UPDATED: Fetch policies from the correct endpoint
export const fetchInvestmentProposals = createAsyncThunk(
  "proposals/fetchInvestmentProposals",
  async ({ 
    tag = "",
    page = 1, 
    pageSize = 20,
    policyNo = "",
    assuredCode = "",
    surname = "",
    coverCode = "",
    status = "",
    fromDate = "",
    toDate = ""
  }: { 
    tag?: string; 
    page?: number; 
    pageSize?: number;
    policyNo?: string;
    assuredCode?: string;
    surname?: string;
    coverCode?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  } = {}, { rejectWithValue }) => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      if (tag) params.append('tag', tag);
      if (policyNo) params.append('policyNo', policyNo);
      if (assuredCode) params.append('assuredCode', assuredCode);
      if (surname) params.append('surname', surname);
      if (coverCode) params.append('coverCode', coverCode);
      if (status) params.append('status', status);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      
      // Use the correct /policies endpoint
      const url = `/v1/lifepolicyAdmin/policies?${params.toString()}`;
      const response = await apiCall.get(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch policies"
      );
    }
  }
);

// ✅ UPDATED: Fetch a single policy by policy number
export const fetchPolicyByNumber = createAsyncThunk(
  "proposals/fetchPolicyByNumber",
  async (policyNo: string, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/v1/lifepolicyAdmin/policy/${policyNo}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch policy details"
      );
    }
  }
);

// ✅ UPDATED: Update policy status
export const updatePolicyStatus = createAsyncThunk(
  "proposals/updatePolicyStatus",
  async ({ policyNo, status }: { policyNo: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await apiCall.put(`/v1/lifepolicyAdmin/status`, {
        policyNo,
        status
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to update policy status"
      );
    }
  }
);

// ✅ UPDATED: Fetch policies by agent code
export const fetchPoliciesByAgent = createAsyncThunk(
  "proposals/fetchPoliciesByAgent",
  async ({ agentCode, page = 1, pageSize = 20 }: { agentCode: string; page?: number; pageSize?: number }, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/v1/lifepolicyAdmin/agent/${agentCode}/paged?page=${page}&pageSize=${pageSize}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch policies by agent"
      );
    }
  }
);

// ✅ UPDATED: Fetch policies by insured ID
export const fetchPoliciesByInsured = createAsyncThunk(
  "proposals/fetchPoliciesByInsured",
  async ({ insuredId, page = 1, pageSize = 20 }: { insuredId: string; page?: number; pageSize?: number }, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/v1/lifepolicyAdmin/insured/${insuredId}/paged?page=${page}&pageSize=${pageSize}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch policies by insured"
      );
    }
  }
);

// Keep existing thunks for other endpoints...
export const fetchIndividualQuotations = createAsyncThunk(
  "proposals/fetchIndividualQuotations",
  async ({ page = 1, pageSize = 100 }: { page?: number, pageSize?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/quotations/search?page=${page}&pageSize=${pageSize}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch individual quotations"
      );
    }
  }
);

export const fetchInvestmentProposalById = createAsyncThunk(
  "proposals/fetchInvestmentProposalById",
  async (proposalNo: string, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/v1/lifepolicyAdmin/proposal/${proposalNo}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch proposal details"
      );
    }
  }
);

export const fetchProposalDocuments = createAsyncThunk(
  "proposals/fetchProposalDocuments",
  async (proposalNo: string, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/v1/Documents/docno?docNo=${proposalNo}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch proposal documents"
      );
    }
  }
);

export const fetchProposalBeneficiaries = createAsyncThunk(
  "proposals/fetchProposalBeneficiaries",
  async (proposalNo: string, { rejectWithValue }) => {
    try {
      const tokenObj = localStorage.getItem("token");
      let tokenValue = tokenObj;
      if (tokenObj && !tokenObj.startsWith('eyJ')) {
        try {
          tokenValue = decryptData(tokenObj);
        } catch (e) {
          // Keep Original
        }
      }
      
      const response = await fetch(`${SERVER_URL}/Beneficiaries/proposal/${proposalNo}`, {
        headers: {
          'Authorization': `Bearer ${tokenValue}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Beneficiaries limit hit or route invalid. Status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error?.message || "Failed to fetch proposal beneficiaries"
      );
    }
  }
);

export const fetchSchemeQuotations = createAsyncThunk(
  "proposals/fetchSchemeQuotations",
  async (tag: string, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/Grouplifepolicy/quotations?tag=${tag}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch scheme quotations"
      );
    }
  }
);

export const fetchProposalStatuses = createAsyncThunk(
  "proposals/fetchProposalStatuses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiCall.get("/v1/lifepolicyAdmin/ProposalStatus");
      let data = response.data;
      if (data?.items) data = data.items;
      
      const parsedStatuses = (Array.isArray(data) ? data : []).map((str: string) => {
        if (typeof str === "string") {
          const match = str.match(/Text\s*=\s*(.*?),.*?Value\s*=\s*(.*?)\s*\}/);
          if (match) {
            return { text: match[1].trim(), value: match[2].trim() };
          }
        }
        return { text: str, value: str };
      });
      return parsedStatuses;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch statuses"
      );
    }
  }
);

export const convertInvestmentProposal = createAsyncThunk(
  "proposals/convertInvestmentProposal",
  async ({ proposalNo, policyStatus }: { proposalNo: string; policyStatus: string }, { rejectWithValue }) => {
    try {
      const response = await apiCall.post(`/v1/lifepolicyAdmin/ConvertToPolicy?proposalNo=${proposalNo}`, {
        policyStatus,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to convert proposal"
      );
    }
  }
);

const proposalsSlice = createSlice({
  name: "proposals",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // ✅ UPDATED: fetchInvestmentProposals
      .addCase(fetchInvestmentProposals.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.itemsRequestId = action.meta.requestId;
      })
      .addCase(fetchInvestmentProposals.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.itemsRequestId) return;
        state.loading = false;
        const data = action.payload;
        state.items = data?.items ?? (Array.isArray(data) ? data : []);
        state.totalCount = data?.totalCount ?? state.items.length;
      })
      .addCase(fetchInvestmentProposals.rejected, (state, action) => {
        if (action.meta.requestId !== state.itemsRequestId) return;
        state.loading = false;
        state.error = action.payload as string;
      })
      // ✅ NEW: fetchPolicyByNumber
      .addCase(fetchPolicyByNumber.pending, (state) => {
        state.loadingCurrent = true;
        state.errorCurrent = null;
      })
      .addCase(fetchPolicyByNumber.fulfilled, (state, action) => {
        state.loadingCurrent = false;
        state.currentProposal = action.payload;
      })
      .addCase(fetchPolicyByNumber.rejected, (state, action) => {
        state.loadingCurrent = false;
        state.errorCurrent = action.payload as string;
      })
      // ✅ NEW: updatePolicyStatus
      .addCase(updatePolicyStatus.fulfilled, (state, action) => {
        // Update the policy in the list if it exists
        const updatedPolicy = action.payload;
        if (updatedPolicy?.policyNo) {
          const index = state.items.findIndex(p => p.policyNo === updatedPolicy.policyNo);
          if (index !== -1) {
            state.items[index] = { ...state.items[index], ...updatedPolicy };
          }
        }
      })
      // Keep existing reducers...
      .addCase(fetchSchemeQuotations.pending, (state) => {
        state.schemeLoading = true;
        state.schemeError = null;
      })
      .addCase(fetchSchemeQuotations.fulfilled, (state, action) => {
        state.schemeLoading = false;
        const data = action.payload;
        state.schemeItems = data?.items ?? (Array.isArray(data) ? data : []);
        state.schemeTotalCount = data?.totalCount ?? state.schemeItems.length;
      })
      .addCase(fetchSchemeQuotations.rejected, (state, action) => {
        state.schemeLoading = false;
        state.schemeError = action.payload as string;
      })
      .addCase(fetchIndividualQuotations.pending, (state) => {
        state.quotationLoading = true;
        state.quotationError = null;
      })
      .addCase(fetchIndividualQuotations.fulfilled, (state, action) => {
        state.quotationLoading = false;
        const data = action.payload;
        state.quotationItems = (data?.items ?? (Array.isArray(data) ? data : [])).map((q: any) => ({
           ...q,
           fullName: `${q.surName || ""} ${q.otherNames || ""}`.trim() || "Anonymous"
        }));
        state.quotationTotalCount = data?.totalCount ?? state.quotationItems.length;
      })
      .addCase(fetchIndividualQuotations.rejected, (state, action) => {
        state.quotationLoading = false;
        state.quotationError = action.payload as string;
      })
      .addCase(fetchInvestmentProposalById.pending, (state) => {
        state.loadingCurrent = true;
        state.errorCurrent = null;
        state.currentProposal = null;
      })
      .addCase(fetchInvestmentProposalById.fulfilled, (state, action) => {
        state.loadingCurrent = false;
        const data = action.payload;
        state.currentProposal = data?.items?.[0] || (Array.isArray(data) ? data[0] : data) || null;
      })
      .addCase(fetchInvestmentProposalById.rejected, (state, action) => {
        state.loadingCurrent = false;
        state.errorCurrent = action.payload as string;
      })
      .addCase(fetchProposalDocuments.pending, (state) => {
        state.loadingDocuments = true;
        state.errorDocuments = null;
        state.currentDocuments = [];
      })
      .addCase(fetchProposalDocuments.fulfilled, (state, action) => {
        state.loadingDocuments = false;
        const data = action.payload;
        state.currentDocuments = Array.isArray(data) ? data : (data?.items || []);
      })
      .addCase(fetchProposalDocuments.rejected, (state, action) => {
        state.loadingDocuments = false;
        state.errorDocuments = action.payload as string;
      })
      .addCase(fetchProposalBeneficiaries.pending, (state) => {
        state.loadingBeneficiaries = true;
        state.errorBeneficiaries = null;
        state.currentBeneficiaries = [];
      })
      .addCase(fetchProposalBeneficiaries.fulfilled, (state, action) => {
        state.loadingBeneficiaries = false;
        const data = action.payload;
        state.currentBeneficiaries = Array.isArray(data) ? data : (data?.items || []);
      })
      .addCase(fetchProposalBeneficiaries.rejected, (state, action) => {
        state.loadingBeneficiaries = false;
        state.errorBeneficiaries = action.payload as string;
      })
      .addCase(fetchProposalStatuses.pending, (state) => {
        state.loadingStatuses = true;
      })
      .addCase(fetchProposalStatuses.fulfilled, (state, action) => {
        state.loadingStatuses = false;
        state.proposalStatuses = action.payload;
      })
      .addCase(fetchProposalStatuses.rejected, (state) => {
        state.loadingStatuses = false;
      });
  },
});

export default proposalsSlice.reducer;