//@ts-nocheck

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

// NEW: Interface for the policy list response from GET /api/grouplife/policies
export interface GroupLifePolicyListResponse {
  items: GroupLifePolicyListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// NEW: Interface for each policy item in the list
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

// NEW: Interface for filter parameters
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

export interface GroupLifeQuotationState {
  quotations: GroupLifePolicy[];
  currentQuotation: GroupLifePolicy | null;
  currentMembers: GroupLifeMember[];
  policyDetail: PolicyDetail | null;
  aggregateTotals: AggregateTotals | null;
  totalCount: number;
  // NEW: Fields for the policies list
  policies: GroupLifePolicyListItem[];
  policiesTotalCount: number;
  policiesTotalPages: number;
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
    policies: boolean; // NEW: Loading state for policies
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
    policies: string | null; // NEW: Error state for policies
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
  // NEW: Initialize policies fields
  policies: [],
  policiesTotalCount: 0,
  policiesTotalPages: 0,
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
    policies: false, // NEW
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
    policies: null, // NEW
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

// In groupLifeQuotationSlice.ts - update the fetchGroupLifePolicy thunk

// GET /api/grouplife/policies/policyNo - Get policy by number
export const fetchGroupLifePolicy = createAsyncThunk(
  "groupLifeQuotations/fetchPolicy",
  async (policyNo: string, { rejectWithValue }) => {
    try {
      if (!policyNo) {
        throw new Error("Policy number is required");
      }

      // ✅ CORRECT ENDPOINT: Use /policyNo with query parameter
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

// NEW: GET /api/grouplife/policies - List/search group-life policies
export const fetchGroupLifePolicies = createAsyncThunk(
  "groupLifeQuotations/fetchPolicies",
  async (filters: GroupLifePolicyFilters = {}, { rejectWithValue }) => {
    try {
      // Build query string from filters
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

// PUT /api/grouplife/policies/policyNo - Update policy
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
        `${SERVER_URL}/grouplife/policies/${encodeURIComponent(policyNo)}`,
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
    { policyNo, endorsement }: { policyNo: string; endorsement?: string },
    { rejectWithValue }
  ) => {
    try {
      if (!policyNo) {
        throw new Error("Policy number is required");
      }

      let url = `${SERVER_URL}/grouplife/policies/${encodeURIComponent(policyNo)}/members`;
      if (endorsement) {
        url += `&endorsement=${encodeURIComponent(endorsement)}`;
      }

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
      return Array.isArray(result) ? result : result.members || result.data || [];
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

// POST /api/grouplife/policies/members/bulk - Bulk upload members
export const bulkUploadMembers = createAsyncThunk(
  "groupLifeQuotations/bulkUpload",
  async (
    { policyNo, members }: { policyNo: string; members: GroupLifeMember[] },
    { rejectWithValue }
  ) => {
    try {
      if (!policyNo) {
        throw new Error("Policy number is required");
      }

      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/members/bulk`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ policyNo, members }),
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
      return result as BulkUploadResponse;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to bulk upload members");
    }
  }
);

// POST /api/grouplife/policies/members/bulk/parse-excel - Parse Excel without saving
export const parseExcelMembers = createAsyncThunk(
  "groupLifeQuotations/parseExcel",
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/members/bulk/parse-excel`,
        {
          method: "POST",
          headers: getFormDataHeaders(),
          body: formData,
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
      return rejectWithValue(error.message || "Failed to parse Excel file");
    }
  }
);

// POST /api/grouplife/policies/members/bulk/upload-excel - Parse and upload Excel
export const uploadExcelMembers = createAsyncThunk(
  "groupLifeQuotations/uploadExcel",
  async (
    { file, policyNo }: { file: File; policyNo: string },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('policyNo', policyNo);

      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/members/bulk/upload-excel`,
        {
          method: "POST",
          headers: getFormDataHeaders(),
          body: formData,
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

      // NEW: Fetch Policies List
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
        state.currentMembers = action.payload;
        if (state.currentQuotation) {
          state.currentQuotation.members = action.payload;
          state.currentQuotation.totalMembers = action.payload.length;
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
      .addCase(computeMemberPremium.fulfilled, (state, action) => {
        state.loading.compute = false;
        // Handle the computed premium result
        const result = action.payload;
        if (result && state.currentQuotation) {
          // Update the current member's premium if needed
        }
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
      .addCase(savePolicyMember.fulfilled, (state, action) => {
        state.loading.update = false;
        const member = action.payload;
        // Add or update member in current list
        const existingIndex = state.currentMembers.findIndex(
          (m) => m.id === member.id || m.memberId === member.memberId
        );
        if (existingIndex !== -1) {
          state.currentMembers[existingIndex] = member;
        } else {
          state.currentMembers.push(member);
        }
        if (state.currentQuotation) {
          state.currentQuotation.members = state.currentMembers;
          state.currentQuotation.totalMembers = state.currentMembers.length;
        }
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
      .addCase(bulkUploadMembers.fulfilled, (state, action) => {
        state.loading.bulk = false;
        const result = action.payload;
        // Update the members list with the uploaded members
        if (result && result.totalMembers && state.currentQuotation) {
          // The bulk upload endpoint should return the updated members or count
          // We might need to refetch members after upload
        }
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
        // Store parsed data for preview
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
      .addCase(uploadExcelMembers.fulfilled, (state, action) => {
        state.loading.upload = false;
        const result = action.payload;
        if (result && state.currentQuotation) {
          // Update the members list
          // The upload endpoint returns the insert count and totals
          // We might need to refetch members after upload
        }
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
      .addCase(computeAgeNextBirthday.fulfilled, (state, action) => {
        state.loading.anb = false;
        // Handle ANB result
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
      .addCase(computeDuration.fulfilled, (state, action) => {
        state.loading.duration = false;
        // Handle duration result
      })
      .addCase(computeDuration.rejected, (state, action) => {
        state.loading.duration = false;
        state.error.duration = action.payload as string;
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
} = groupLifeQuotationSlice.actions;

export const selectGroupLifeQuotations = (state: {
  groupLifeQuotations: GroupLifeQuotationState;
}) => state.groupLifeQuotations;

// NEW: Selector for the policies list
export const selectGroupLifePolicies = (state: {
  groupLifeQuotations: GroupLifeQuotationState;
}) => ({
  policies: state.groupLifeQuotations.policies,
  totalCount: state.groupLifeQuotations.policiesTotalCount,
  totalPages: state.groupLifeQuotations.policiesTotalPages,
  loading: state.groupLifeQuotations.loading.policies,
  error: state.groupLifeQuotations.error.policies,
});

export default groupLifeQuotationSlice.reducer;