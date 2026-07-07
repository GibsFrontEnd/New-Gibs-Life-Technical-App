// claimsSlice.ts
//@ts-nocheck

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiCall from "../../../utils/api-call";
import { decryptData } from "../../../utils/encrypt-utils";
import { SERVER_URL } from "../../../utils/constants";

// ==================== TYPES ====================

export interface ClaimNotification {
  policyNo: string;
  lossNotifyDate: string;
  lossDate: string;
  lossType: string;
  lossDescription: string;
}

export interface ClaimReserve {
  claimID: number;
  claimNo: string;
  brcode: string;
  entryDate: string;
  notifyDate: string;
  lossDate: string;
  policyNo: string;
  coPolicyNo: string;
  refDNCNNo: string;
  propRate: number;
  undYear: number;
  insuredName: string;
  startDate: string;
  endDate: string;
  subRiskID: string;
  subRisk: string;
  partyID: string;
  party: string;
  insuredID: string;
  lossType: string;
  lossDetails: string;
  field1: string;
  field2: string;
  field3: string;
  field4: string;
  field5: string;
  field6: string;
  field7: string;
  field8: string;
  field9: string;
  field10: string;
  field11: string;
  field12: string;
  amtReserved: number;
  amtPaid: number;
  detailID: number;
  approval: number;
  deleted: number;
  active: number;
  submittedBy: string;
  submittedOn: string;
  modifiedBy: string;
  modifiedOn: string;
  approvedBy: string;
  approvedOn: string;
  a1: number;
  a2: number;
  a3: number;
  a4: number;
  a5: number;
  a6: number;
  a7: number;
  a8: number;
  a9: number;
  leadID: string;
  leader: string;
  propType: string;
  leadProp: number;
}

export interface ClaimSearchParams {
  searchText?: string;
  dateFrom?: string;
  dateTo?: string;
  pageNo?: number;
  pageSize?: number;
}

export interface ClaimReserveSearchParams {
  classOption?: string;
  typeOption?: string;
  date1?: string;
  date2?: string;
  searchField?: string;
  searchText?: string;
  pageNumber?: number;
  pageSize?: number;
}

// ✅ New interface for Individual Policy Search
export interface IndividualPolicySearchParams {
  coverCode?: string;           // e.g. "GLA" for Group Life
  brCode?: string;
  assuredCode?: string;
  status?: string;
  isProposal?: boolean;         // false = policies only, true = proposals only, null = both
  search?: string;              // Matches against policy number or insured name
  fromDate?: string;            // Filter on start date (inclusive)
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface IndividualPolicy {
  policyNo: string;
  isProposal: boolean;
  coverCode: string;
  covertype: string;
  brCode: string;
  assuredCode: string;
  insuredName: string;
  tDate: string;
  startDate: string;
  maturityDate: string;
  sumAssured: number;
  basicPremium: number;
  status: string;
}

export interface IndividualPolicyResponse {
  items: IndividualPolicy[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface ClaimsState {
  // Claim Notifications
  notifications: ClaimNotification[];
  notificationsTotalCount: number;
  loadingNotifications: boolean;
  errorNotifications: string | null;
  
  // Claim Reserves
  reserves: ClaimReserve[];
  reservesTotalCount: number;
  loadingReserves: boolean;
  errorReserves: string | null;
  
  // Current/Single items
  currentClaim: ClaimNotification | null;
  currentReserve: ClaimReserve | null;
  loadingCurrent: boolean;
  errorCurrent: string | null;
  
  // Search results
  searchResults: ClaimReserve[];
  searchTotalCount: number;
  loadingSearch: boolean;
  errorSearch: string | null;

  // ✅ Individual Policy Search
  policies: IndividualPolicy[];
  policiesTotalCount: number;
  policiesTotalPages: number;
  loadingPolicies: boolean;
  errorPolicies: string | null;
  
  // Pagination
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

const initialState: ClaimsState = {
  notifications: [],
  notificationsTotalCount: 0,
  loadingNotifications: false,
  errorNotifications: null,
  
  reserves: [],
  reservesTotalCount: 0,
  loadingReserves: false,
  errorReserves: null,
  
  currentClaim: null,
  currentReserve: null,
  loadingCurrent: false,
  errorCurrent: null,
  
  searchResults: [],
  searchTotalCount: 0,
  loadingSearch: false,
  errorSearch: null,

  // ✅ Initialize policy search state
  policies: [],
  policiesTotalCount: 0,
  policiesTotalPages: 0,
  loadingPolicies: false,
  errorPolicies: null,
  
  pagination: {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  },
};

// ==================== ASYNC THUNKS ====================

// ✅ Fetch claim notifications with pagination and search
export const fetchClaims = createAsyncThunk(
  "claims/fetchClaims",
  async ({ 
    searchText = "", 
    dateFrom = "", 
    dateTo = "", 
    pageNo = 1, 
    pageSize = 10 
  }: ClaimSearchParams = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (searchText) params.append('SearchText', searchText);
      if (dateFrom) params.append('DateFrom', dateFrom);
      if (dateTo) params.append('DateTo', dateTo);
      if (pageNo) params.append('PageNo', pageNo.toString());
      if (pageSize) params.append('PageSize', pageSize.toString());
      
      const url = `/v1/Claims?${params.toString()}`;
      const response = await apiCall.get(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch claims"
      );
    }
  }
);

// ✅ Create a new claim reserve
export const createClaimReserve = createAsyncThunk(
  "claims/createClaimReserve",
  async (claimData: Partial<ClaimReserve>, { rejectWithValue }) => {
    try {
      const response = await apiCall.post(`/v1/Claims`, claimData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to create claim reserve"
      );
    }
  }
);

// ✅ Fetch a single claim notification by claim number
export const fetchClaimByNo = createAsyncThunk(
  "claims/fetchClaimByNo",
  async (claimNo: string, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/v1/Claims/${claimNo}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch claim details"
      );
    }
  }
);

// ✅ Search claim reserves with advanced filters
export const searchClaimReserves = createAsyncThunk(
  "claims/searchClaimReserves",
  async ({ 
    classOption = "", 
    typeOption = "PENDING", 
    date1 = "", 
    date2 = "", 
    searchField = "", 
    searchText = "", 
    pageNumber = 1, 
    pageSize = 10 
  }: ClaimReserveSearchParams = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (classOption) params.append('ClassOption', classOption);
      if (typeOption) params.append('TypeOption', typeOption);
      if (date1) params.append('Date1', date1);
      if (date2) params.append('Date2', date2);
      if (searchField) params.append('SearchField', searchField);
      if (searchText) params.append('SearchText', searchText);
      if (pageNumber) params.append('PageNumber', pageNumber.toString());
      if (pageSize) params.append('PageSize', pageSize.toString());
      
      const url = `/v1/Claims/GetAllClaimReserveSearch?${params.toString()}`;
      const response = await apiCall.get(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to search claim reserves"
      );
    }
  }
);

// ✅ Fetch all claim reserves
export const fetchAllClaimReserves = createAsyncThunk(
  "claims/fetchAllClaimReserves",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/v1/Claims/GetallClaim`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch claim reserves"
      );
    }
  }
);

// ✅ Fetch claim reserve by ID
export const fetchClaimReserveById = createAsyncThunk(
  "claims/fetchClaimReserveById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/v1/Claims/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch claim reserve"
      );
    }
  }
);

// ✅ Update claim reserve by ID
export const updateClaimReserve = createAsyncThunk(
  "claims/updateClaimReserve",
  async ({ id, data }: { id: number; data: Partial<ClaimReserve> }, { rejectWithValue }) => {
    try {
      const response = await apiCall.put(`/v1/Claims/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to update claim reserve"
      );
    }
  }
);

// ✅ Delete claim reserve by ID
export const deleteClaimReserve = createAsyncThunk(
  "claims/deleteClaimReserve",
  async (id: number, { rejectWithValue }) => {
    try {
      await apiCall.delete(`/v1/Claims/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to delete claim reserve"
      );
    }
  }
);

// ✅ Insert claim reserve (alternative endpoint)
export const insertClaimReserve = createAsyncThunk(
  "claims/insertClaimReserve",
  async (claimData: Partial<ClaimReserve>, { rejectWithValue }) => {
    try {
      const response = await apiCall.post(`/v1/Claims/DoInsert`, claimData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to insert claim reserve"
      );
    }
  }
);

// ✅ NEW: Search Individual Life Policies
export const searchIndividualPolicies = createAsyncThunk(
  "claims/searchIndividualPolicies",
  async ({
    coverCode = "",
    brCode = "",
    assuredCode = "",
    status = "",
    isProposal = null,
    search = "",
    fromDate = "",
    toDate = "",
    page = 1,
    pageSize = 10
  }: IndividualPolicySearchParams = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      
      // Add optional parameters only if they have values
      if (coverCode) params.append('CoverCode', coverCode);
      if (brCode) params.append('BrCode', brCode);
      if (assuredCode) params.append('AssuredCode', assuredCode);
      if (status) params.append('Status', status);
      if (isProposal !== null && isProposal !== undefined) {
        params.append('IsProposal', isProposal.toString());
      }
      if (search) params.append('Search', search);
      if (fromDate) params.append('FromDate', fromDate);
      if (toDate) params.append('ToDate', toDate);
      if (page) params.append('Page', page.toString());
      if (pageSize) params.append('PageSize', pageSize.toString());
      
      const url = `/v1/lifepolicyAdmin/IndpolicySearch?${params.toString()}`;
      const response = await apiCall.get(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to search individual policies"
      );
    }
  }
);

// ==================== SLICE ====================

const claimsSlice = createSlice({
  name: "claims",
  initialState,
  reducers: {
    // Clear all claims data
    clearClaims: (state) => {
      state.notifications = [];
      state.notificationsTotalCount = 0;
      state.reserves = [];
      state.reservesTotalCount = 0;
      state.currentClaim = null;
      state.currentReserve = null;
      state.searchResults = [];
      state.searchTotalCount = 0;
      state.policies = [];
      state.policiesTotalCount = 0;
      state.policiesTotalPages = 0;
      state.errorNotifications = null;
      state.errorReserves = null;
      state.errorCurrent = null;
      state.errorSearch = null;
      state.errorPolicies = null;
    },
    
    // Clear specific errors
    clearNotificationsError: (state) => {
      state.errorNotifications = null;
    },
    
    clearReservesError: (state) => {
      state.errorReserves = null;
    },
    
    clearCurrentError: (state) => {
      state.errorCurrent = null;
    },
    
    clearSearchError: (state) => {
      state.errorSearch = null;
    },

    clearPoliciesError: (state) => {
      state.errorPolicies = null;
    },
    
    // Clear all errors
    clearAllErrors: (state) => {
      state.errorNotifications = null;
      state.errorReserves = null;
      state.errorCurrent = null;
      state.errorSearch = null;
      state.errorPolicies = null;
    },
    
    // Set current claim
    setCurrentClaim: (state, action) => {
      state.currentClaim = action.payload;
    },
    
    // Set current reserve
    setCurrentReserve: (state, action) => {
      state.currentReserve = action.payload;
    },
    
    // Update pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    // Reset state
    resetClaimsState: () => initialState,

    // Clear policies
    clearPolicies: (state) => {
      state.policies = [];
      state.policiesTotalCount = 0;
      state.policiesTotalPages = 0;
      state.errorPolicies = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ===== FETCH CLAIMS =====
      .addCase(fetchClaims.pending, (state) => {
        state.loadingNotifications = true;
        state.errorNotifications = null;
      })
      .addCase(fetchClaims.fulfilled, (state, action) => {
        state.loadingNotifications = false;
        const data = action.payload;
        state.notifications = Array.isArray(data) ? data : (data?.items || []);
        state.notificationsTotalCount = data?.totalCount ?? state.notifications.length;
        if (data?.pagination) {
          state.pagination = data.pagination;
        }
      })
      .addCase(fetchClaims.rejected, (state, action) => {
        state.loadingNotifications = false;
        state.errorNotifications = action.payload as string;
      })
      
      // ===== CREATE CLAIM RESERVE =====
      .addCase(createClaimReserve.pending, (state) => {
        state.loadingCurrent = true;
        state.errorCurrent = null;
      })
      .addCase(createClaimReserve.fulfilled, (state, action) => {
        state.loadingCurrent = false;
        const newReserve = action.payload;
        state.reserves.unshift(newReserve);
        state.reservesTotalCount += 1;
        state.currentReserve = newReserve;
      })
      .addCase(createClaimReserve.rejected, (state, action) => {
        state.loadingCurrent = false;
        state.errorCurrent = action.payload as string;
      })
      
      // ===== FETCH CLAIM BY NO =====
      .addCase(fetchClaimByNo.pending, (state) => {
        state.loadingCurrent = true;
        state.errorCurrent = null;
      })
      .addCase(fetchClaimByNo.fulfilled, (state, action) => {
        state.loadingCurrent = false;
        state.currentClaim = action.payload;
      })
      .addCase(fetchClaimByNo.rejected, (state, action) => {
        state.loadingCurrent = false;
        state.errorCurrent = action.payload as string;
      })
      
      // ===== SEARCH CLAIM RESERVES - FIXED =====
      .addCase(searchClaimReserves.pending, (state) => {
        state.loadingSearch = true;
        state.errorSearch = null;
      })
      .addCase(searchClaimReserves.fulfilled, (state, action) => {
        state.loadingSearch = false;
        state.errorSearch = null;
        
        const response = action.payload;
        console.log("🔍 Redux - Search Response:", response);
        
        // ✅ FIX: The data is under response.data (not response.items)
        if (response?.data && Array.isArray(response.data)) {
          state.searchResults = response.data;
          state.searchTotalCount = response.totalRecords || response.data.length;
          
          state.pagination = {
            currentPage: response.pageNumber || 1,
            pageSize: response.pageSize || 10,
            totalItems: response.totalRecords || 0,
            totalPages: response.totalPages || 0,
          };
        } else if (Array.isArray(response)) {
          // Fallback if response is directly an array
          state.searchResults = response;
          state.searchTotalCount = response.length;
        } else {
          state.searchResults = [];
          state.searchTotalCount = 0;
        }
        
        console.log("📦 Redux - Updated searchResults:", state.searchResults);
        console.log("📊 Redux - Total count:", state.searchTotalCount);
      })
      .addCase(searchClaimReserves.rejected, (state, action) => {
        state.loadingSearch = false;
        state.errorSearch = action.payload as string;
        state.searchResults = [];
        state.searchTotalCount = 0;
      })
      
      // ===== FETCH ALL CLAIM RESERVES =====
      .addCase(fetchAllClaimReserves.pending, (state) => {
        state.loadingReserves = true;
        state.errorReserves = null;
      })
      .addCase(fetchAllClaimReserves.fulfilled, (state, action) => {
        state.loadingReserves = false;
        const data = action.payload;
        state.reserves = Array.isArray(data) ? data : (data?.items || []);
        state.reservesTotalCount = data?.totalCount ?? state.reserves.length;
      })
      .addCase(fetchAllClaimReserves.rejected, (state, action) => {
        state.loadingReserves = false;
        state.errorReserves = action.payload as string;
      })
      
      // ===== FETCH CLAIM RESERVE BY ID =====
      .addCase(fetchClaimReserveById.pending, (state) => {
        state.loadingCurrent = true;
        state.errorCurrent = null;
        state.currentReserve = null;
      })
      .addCase(fetchClaimReserveById.fulfilled, (state, action) => {
        state.loadingCurrent = false;
        state.currentReserve = action.payload;
      })
      .addCase(fetchClaimReserveById.rejected, (state, action) => {
        state.loadingCurrent = false;
        state.errorCurrent = action.payload as string;
      })
      
      // ===== UPDATE CLAIM RESERVE =====
      .addCase(updateClaimReserve.pending, (state) => {
        state.loadingCurrent = true;
        state.errorCurrent = null;
      })
      .addCase(updateClaimReserve.fulfilled, (state, action) => {
        state.loadingCurrent = false;
        const updatedReserve = action.payload;
        if (updatedReserve?.claimID) {
          // Update in reserves list
          const index = state.reserves.findIndex(r => r.claimID === updatedReserve.claimID);
          if (index !== -1) {
            state.reserves[index] = { ...state.reserves[index], ...updatedReserve };
          }
          // Update in search results if present
          const searchIndex = state.searchResults.findIndex(r => r.claimID === updatedReserve.claimID);
          if (searchIndex !== -1) {
            state.searchResults[searchIndex] = { ...state.searchResults[searchIndex], ...updatedReserve };
          }
          // Update current reserve
          if (state.currentReserve?.claimID === updatedReserve.claimID) {
            state.currentReserve = { ...state.currentReserve, ...updatedReserve };
          }
        }
      })
      .addCase(updateClaimReserve.rejected, (state, action) => {
        state.loadingCurrent = false;
        state.errorCurrent = action.payload as string;
      })
      
      // ===== DELETE CLAIM RESERVE =====
      .addCase(deleteClaimReserve.pending, (state) => {
        state.loadingCurrent = true;
        state.errorCurrent = null;
      })
      .addCase(deleteClaimReserve.fulfilled, (state, action) => {
        state.loadingCurrent = false;
        const deletedId = action.payload;
        // Remove from reserves list
        state.reserves = state.reserves.filter(r => r.claimID !== deletedId);
        state.reservesTotalCount = Math.max(0, state.reservesTotalCount - 1);
        // Remove from search results
        state.searchResults = state.searchResults.filter(r => r.claimID !== deletedId);
        state.searchTotalCount = Math.max(0, state.searchTotalCount - 1);
        // Clear current reserve if deleted
        if (state.currentReserve?.claimID === deletedId) {
          state.currentReserve = null;
        }
      })
      .addCase(deleteClaimReserve.rejected, (state, action) => {
        state.loadingCurrent = false;
        state.errorCurrent = action.payload as string;
      })
      
      // ===== INSERT CLAIM RESERVE =====
      .addCase(insertClaimReserve.pending, (state) => {
        state.loadingCurrent = true;
        state.errorCurrent = null;
      })
      .addCase(insertClaimReserve.fulfilled, (state, action) => {
        state.loadingCurrent = false;
        const newReserve = action.payload;
        state.reserves.unshift(newReserve);
        state.reservesTotalCount += 1;
        state.currentReserve = newReserve;
      })
      .addCase(insertClaimReserve.rejected, (state, action) => {
        state.loadingCurrent = false;
        state.errorCurrent = action.payload as string;
      })

      // ===== SEARCH INDIVIDUAL POLICIES =====
      .addCase(searchIndividualPolicies.pending, (state) => {
        state.loadingPolicies = true;
        state.errorPolicies = null;
        state.policies = [];
        state.policiesTotalCount = 0;
        state.policiesTotalPages = 0;
      })
      .addCase(searchIndividualPolicies.fulfilled, (state, action) => {
        state.loadingPolicies = false;
        state.errorPolicies = null;
        
        const response = action.payload;
        console.log("📋 Redux - Individual Policies Search Response:", response);
        
        if (response?.items && Array.isArray(response.items)) {
          state.policies = response.items;
          state.policiesTotalCount = response.totalCount || response.items.length;
          state.policiesTotalPages = response.totalPages || 0;
          
          // Also update pagination
          state.pagination = {
            currentPage: response.page || 1,
            pageSize: response.pageSize || 10,
            totalItems: response.totalCount || 0,
            totalPages: response.totalPages || 0,
          };
        } else if (Array.isArray(response)) {
          state.policies = response;
          state.policiesTotalCount = response.length;
          state.policiesTotalPages = 1;
        } else {
          state.policies = [];
          state.policiesTotalCount = 0;
          state.policiesTotalPages = 0;
        }
        
     
      })
      .addCase(searchIndividualPolicies.rejected, (state, action) => {
        state.loadingPolicies = false;
        state.errorPolicies = action.payload as string;
        state.policies = [];
        state.policiesTotalCount = 0;
        state.policiesTotalPages = 0;
      });
  },
});

// ==================== EXPORT ACTIONS ====================

export const {
  clearClaims,
  clearNotificationsError,
  clearReservesError,
  clearCurrentError,
  clearSearchError,
  clearPoliciesError,
  clearAllErrors,
  setCurrentClaim,
  setCurrentReserve,
  setPagination,
  resetClaimsState,
  clearPolicies,
} = claimsSlice.actions;

// ==================== EXPORT SELECTORS ====================

// Claim Notifications Selectors
export const selectAllNotifications = (state: { claims: ClaimsState }) => 
  state.claims.notifications;
export const selectNotificationsTotalCount = (state: { claims: ClaimsState }) => 
  state.claims.notificationsTotalCount;
export const selectNotificationsLoading = (state: { claims: ClaimsState }) => 
  state.claims.loadingNotifications;
export const selectNotificationsError = (state: { claims: ClaimsState }) => 
  state.claims.errorNotifications;

// Claim Reserves Selectors
export const selectAllReserves = (state: { claims: ClaimsState }) => 
  state.claims.reserves;
export const selectReservesTotalCount = (state: { claims: ClaimsState }) => 
  state.claims.reservesTotalCount;
export const selectReservesLoading = (state: { claims: ClaimsState }) => 
  state.claims.loadingReserves;
export const selectReservesError = (state: { claims: ClaimsState }) => 
  state.claims.errorReserves;

// Current Items Selectors
export const selectCurrentClaim = (state: { claims: ClaimsState }) => 
  state.claims.currentClaim;
export const selectCurrentReserve = (state: { claims: ClaimsState }) => 
  state.claims.currentReserve;
export const selectCurrentLoading = (state: { claims: ClaimsState }) => 
  state.claims.loadingCurrent;
export const selectCurrentError = (state: { claims: ClaimsState }) => 
  state.claims.errorCurrent;

// Search Results Selectors
export const selectSearchResults = (state: { claims: ClaimsState }) => 
  state.claims.searchResults;
export const selectSearchTotalCount = (state: { claims: ClaimsState }) => 
  state.claims.searchTotalCount;
export const selectSearchLoading = (state: { claims: ClaimsState }) => 
  state.claims.loadingSearch;
export const selectSearchError = (state: { claims: ClaimsState }) => 
  state.claims.errorSearch;

// ✅ Individual Policy Selectors
export const selectAllPolicies = (state: { claims: ClaimsState }) => 
  state.claims.policies;
export const selectPoliciesTotalCount = (state: { claims: ClaimsState }) => 
  state.claims.policiesTotalCount;
export const selectPoliciesTotalPages = (state: { claims: ClaimsState }) => 
  state.claims.policiesTotalPages;
export const selectPoliciesLoading = (state: { claims: ClaimsState }) => 
  state.claims.loadingPolicies;
export const selectPoliciesError = (state: { claims: ClaimsState }) => 
  state.claims.errorPolicies;

// Pagination Selectors
export const selectPagination = (state: { claims: ClaimsState }) => 
  state.claims.pagination;

export default claimsSlice.reducer;