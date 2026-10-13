// @ts-nocheck
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { decryptData } from "../../../utils/encrypt-utils"
import { SERVER_URL } from "../../../utils/constants"

const API_BASE_URL = SERVER_URL

const getAuthToken = () => {
  try {
    const encryptedToken = localStorage.getItem("token")
    if (!encryptedToken) return null
    return decryptData(encryptedToken)
  } catch (err) {
    console.warn("Failed to get token", err)
    return null
  }
}

const handleFetchError = async (res: Response) => {
  const text = await res.text().catch(() => "")
  throw new Error(text || `HTTP error! status: ${res.status}`)
}

// ============================================================================
// TYPES
// ============================================================================

export interface DebitNoteParticipant {
  participantID: string
  participantName: string
  sharePercentage: number
  shareAmount: number
  role: string
}

export interface DebitNote {
  dncnNo: string
  policyNo: string
  proposalNo: string
  dncnDate: string
  dncnType: string
  description: string
  premiumAmount: number
  commissionAmount: number
  vatAmount: number
  totalAmount: number
  currency: string
  exchangeRate: number
  participants: DebitNoteParticipant[]
  status: string
  createdBy: string
  createdOn: string
  modifiedBy: string | null
  modifiedOn: string | null
  approvedBy: string | null
  approvedOn: string | null
  isDeleted: boolean
  coInsurers: any[]
  debitNoteDocumentUrl?: string
  creditNoteDocumentUrl?: string
  id?: number // From second slice
  approvalStatus?: string // From second slice
  billingDate?: string // From second slice
  netAmount?: number // From second slice
  insuredName?: string // From second slice
  branchName?: string // From second slice
}

export interface CreateDebitNoteRequest {
  policyNo: string
  proposalNo: string
  dncnDate: string
  dncnType: string
  description: string
  premiumAmount: number
  commissionAmount: number
  vatAmount: number
  totalAmount: number
  currency: string
  exchangeRate: number
  participants: DebitNoteParticipant[]
  coInsurers: any[]
  createdBy: string
}

export interface UpdateDebitNoteRequest {
  dncnDate?: string
  dncnType?: string
  description?: string
  premiumAmount?: number
  commissionAmount?: number
  vatAmount?: number
  totalAmount?: number
  currency?: string
  exchangeRate?: number
  participants?: DebitNoteParticipant[]
  coInsurers?: any[]
  modifiedBy?: string
}

export interface DebitNotePaginationResponse {
  items: DebitNote[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface DebitNoteMapResponse {
  policyNo: string
  proposalNo: string
  insuredName: string
  branch: string
  bizSource: string
  startDate: string
  endDate: string
  totalPremium: number
  currency: string
  exchangeRate: number
  coInsurers: any[]
  participants: DebitNoteParticipant[]
}

export interface CoinsuranceCalculationRequest {
  policyNo: string
  totalPremium: number
  participants: Array<{
    participantID: string
    participantName: string
    sharePercentage: number
    role: string
  }>
}

export interface CoinsuranceCalculationResponse {
  participants: DebitNoteParticipant[]
  totalSharePercentage: number
  totalShareAmount: number
  validationErrors: string[]
  success: boolean
}

export interface CreditNote {
  cnNo: string
  policyNo: string
  dncnNo: string
  cnDate: string
  amount: number
  reason: string
  status: string
  createdBy: string
  createdOn: string
}

export interface ProcessDebitNoteDto {
  status: string
  notes?: string
  approvedBy?: string
}

export interface BulkProcessResult {
  success: boolean
  processed: number
  failed: number
  errors?: string[]
}

export interface DebitNoteFilters {
  page?: number
  pageSize?: number
  policyNo?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

// ============================================================================
// COMBINED STATE
// ============================================================================

export interface DebitNoteState {
  // From first slice
  debitNotes: DebitNote[]
  currentDebitNote: DebitNote | null
  creditNotes: CreditNote[]
  currentCreditNote: CreditNote | null
  debitNoteMapping: DebitNoteMapResponse | null
  coinsuranceResult: CoinsuranceCalculationResponse | null
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
  loading: {
    fetchDebitNotes: boolean
    fetchDebitNote: boolean
    createDebitNote: boolean
    updateDebitNote: boolean
    deleteDebitNote: boolean
    fetchMapping: boolean
    fetchCreditNotes: boolean
    calculateCoinsurance: boolean
    recalculateDebitNote: boolean
    fetchPendingApproval: boolean
    downloadDocument: boolean
    downloadCreditNoteDocument: boolean
    processDebitNote: boolean
    bulkProcessDebitNotes: boolean
  }
  success: {
    createDebitNote: boolean
    updateDebitNote: boolean
    deleteDebitNote: boolean
    recalculateDebitNote: boolean
    processDebitNote: boolean
    bulkProcessDebitNotes: boolean
  }
  error: {
    fetchDebitNotes: string | null
    fetchDebitNote: string | null
    createDebitNote: string | null
    updateDebitNote: string | null
    deleteDebitNote: string | null
    fetchMapping: string | null
    fetchCreditNotes: string | null
    calculateCoinsurance: string | null
    recalculateDebitNote: string | null
    fetchPendingApproval: string | null
    downloadDocument: string | null
    downloadCreditNoteDocument: string | null
    processDebitNote: string | null
    bulkProcessDebitNotes: string | null
  }
  filters: {
    policyNo?: string
    status?: string
    dateFrom?: string
    dateTo?: string
    page?: number
    pageSize?: number
  }
  // From second slice
  items: DebitNote[]
  pendingItems: DebitNote[]
  selectedItem: DebitNote | null
  selectedDocument: Blob | null
  downloading: boolean
  pendingPagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: DebitNoteState = {
  // First slice state
  debitNotes: [],
  currentDebitNote: null,
  creditNotes: [],
  currentCreditNote: null,
  debitNoteMapping: null,
  coinsuranceResult: null,
  pagination: {
    page: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
  loading: {
    fetchDebitNotes: false,
    fetchDebitNote: false,
    createDebitNote: false,
    updateDebitNote: false,
    deleteDebitNote: false,
    fetchMapping: false,
    fetchCreditNotes: false,
    calculateCoinsurance: false,
    recalculateDebitNote: false,
    fetchPendingApproval: false,
    downloadDocument: false,
    downloadCreditNoteDocument: false,
    processDebitNote: false,
    bulkProcessDebitNotes: false,
  },
  success: {
    createDebitNote: false,
    updateDebitNote: false,
    deleteDebitNote: false,
    recalculateDebitNote: false,
    processDebitNote: false,
    bulkProcessDebitNotes: false,
  },
  error: {
    fetchDebitNotes: null,
    fetchDebitNote: null,
    createDebitNote: null,
    updateDebitNote: null,
    deleteDebitNote: null,
    fetchMapping: null,
    fetchCreditNotes: null,
    calculateCoinsurance: null,
    recalculateDebitNote: null,
    fetchPendingApproval: null,
    downloadDocument: null,
    downloadCreditNoteDocument: null,
    processDebitNote: null,
    bulkProcessDebitNotes: null,
  },
  filters: {
    page: 1,
    pageSize: 50,
  },
  // Second slice state
  items: [],
  pendingItems: [],
  selectedItem: null,
  selectedDocument: null,
  downloading: false,
  pendingPagination: {
    page: 1,
    pageSize: 50,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
}

// ============================================================================
// ASYNC THUNKS - COMBINED
// ============================================================================

// 1. GET /api/DebitNotes/map-policy/{policyNo}
export const mapPolicyToDebitNote = createAsyncThunk<
  DebitNoteMapResponse,
  string,
  { rejectValue: string }
>(
  "debitNotes/mapPolicyToDebitNote",
  async (policyNo, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(
        `${API_BASE_URL}/DebitNotes/map-policy/${encodeURIComponent(policyNo)}`,
        {
          method: "GET",
          headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
        }
      )
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to map policy to debit note")
    }
  }
)

// 2. POST /api/DebitNotes/recalculate
export const recalculateDebitNote = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>(
  "debitNotes/recalculateDebitNote",
  async (noteData, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/DebitNotes/recalculate`, {
        method: "POST",
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          policyNo: noteData.policyNo,
          trackID: noteData.trackID || Math.floor(1000 + Math.random() * 9000),
          bizSource: noteData.bizSource || "DIRECT",
          totalRiskPremium: noteData.totalRiskPremium || 0,
          grossPremium: noteData.grossPremium || 0,
          totalRiskSumInsured: noteData.totalRiskSumInsured || 0,
          commissionRate: noteData.commissionRate || 0,
          vatRate: noteData.vatRate || 0,
          ncdfLevyRate: noteData.ncdfLevyRate || 0,
          naicomLevyRate: noteData.naicomLevyRate || 0,
          orcRate: noteData.orcRate || 0,
        }),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      return result
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to recalculate debit note")
    }
  }
)

// 3. POST /api/DebitNotes
export const createDebitNote = createAsyncThunk<
  DebitNote,
  CreateDebitNoteRequest,
  { rejectValue: string }
>(
  "debitNotes/createDebitNote",
  async (noteData, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/DebitNotes`, {
        method: "POST",
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(noteData),
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to create debit note")
    }
  }
)

// 4. GET /api/DebitNotes
export const getDebitNotes = createAsyncThunk<
  DebitNotePaginationResponse,
  {
    page?: number
    pageSize?: number
    policyNo?: string
    status?: string
    dateFrom?: string
    dateTo?: string
  },
  { rejectValue: string }
>(
  "debitNotes/getDebitNotes",
  async (params, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const { page = 1, pageSize = 50, policyNo, status, dateFrom, dateTo } = params
      let url = `${API_BASE_URL}/DebitNotes?page=${page}&pageSize=${pageSize}`

      if (policyNo) {
        url += `&PolicyNo=${encodeURIComponent(policyNo)}`
      }
      if (status) {
        url += `&Status=${encodeURIComponent(status)}`
      }
      if (dateFrom) {
        url += `&DateFrom=${encodeURIComponent(dateFrom)}`
      }
      if (dateTo) {
        url += `&DateTo=${encodeURIComponent(dateTo)}`
      }

      const response = await fetch(url, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch debit notes")
    }
  }
)

// 5. GET /api/DebitNotes/{dncnNo}
export const getDebitNoteById = createAsyncThunk<
  DebitNote,
  string,
  { rejectValue: string }
>(
  "debitNotes/getDebitNoteById",
  async (dncnNo, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/DebitNotes/${encodeURIComponent(dncnNo)}`, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch debit note")
    }
  }
)

// 6. PUT /api/DebitNotes/{dncnNo}
export const updateDebitNote = createAsyncThunk<
  DebitNote,
  { dncnNo: string; noteData: UpdateDebitNoteRequest },
  { rejectValue: string }
>(
  "debitNotes/updateDebitNote",
  async ({ dncnNo, noteData }, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/DebitNotes/${encodeURIComponent(dncnNo)}`, {
        method: "PUT",
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(noteData),
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to update debit note")
    }
  }
)

// 7. DELETE /api/DebitNotes/{dncnNo}
export const deleteDebitNote = createAsyncThunk<
  { dncnNo: string },
  string,
  { rejectValue: string }
>(
  "debitNotes/deleteDebitNote",
  async (dncnNo, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/DebitNotes/${encodeURIComponent(dncnNo)}`, {
        method: "DELETE",
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      })
      if (!response.ok) await handleFetchError(response)
      return { dncnNo }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to delete debit note")
    }
  }
)

// 8. GET /api/DebitNotes/policy/{policyNo}/credit-notes
export const getCreditNotesByPolicy = createAsyncThunk<
  CreditNote[],
  string,
  { rejectValue: string }
>(
  "debitNotes/getCreditNotesByPolicy",
  async (policyNo, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(
        `${API_BASE_URL}/DebitNotes/policy/${encodeURIComponent(policyNo)}/credit-notes`,
        {
          method: "GET",
          headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
        }
      )
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch credit notes")
    }
  }
)

// 9. GET /api/DebitNotes/coinsurance
export const getCoinsuranceDistribution = createAsyncThunk<
  any[],
  string,
  { rejectValue: string }
>(
  "debitNotes/getCoinsuranceDistribution",
  async (policyNo, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(
        `${API_BASE_URL}/DebitNotes/coinsurance?policyNo=${encodeURIComponent(policyNo)}`,
        {
          method: "GET",
          headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
        }
      )
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch coinsurance distribution")
    }
  }
)

// 10. POST /api/DebitNotes/calculatecoinsurance
export const calculateCoinsurance = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>(
  "debitNotes/calculateCoinsurance",
  async (payload, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/DebitNotes/calculatecoinsurance`, {
        method: "POST",
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bizSource: payload.bizSource || "DIRECT",
          trackID: payload.trackID || Math.floor(1000 + Math.random() * 9000),
          totalRiskSumInsured: payload.totalRiskSumInsured || 0,
          totalRiskPremium: payload.totalRiskPremium || 0,
          grossSumInsured: payload.grossSumInsured || 0,
          grossPremium: payload.grossPremium || 0,
          headerCommRate: payload.headerCommRate || 0,
          leaderBusProp: payload.leaderBusProp || 100,
          companyAbrev: payload.companyAbrev || "GIBS",
          participants: payload.participants || [],
        }),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      return result
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to calculate coinsurance")
    }
  }
)

// 11. GET /api/DebitNotes/by-policy/{policyNo}
export const getDebitNotesByPolicy = createAsyncThunk<
  DebitNote[],
  { policyNo: string; page?: number; pageSize?: number },
  { rejectValue: string }
>(
  "debitNotes/getDebitNotesByPolicy",
  async ({ policyNo, page = 1, pageSize = 50 }, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const url = `${API_BASE_URL}/DebitNotes/by-policy/${encodeURIComponent(policyNo)}?page=${page}&pageSize=${pageSize}`
      const response = await fetch(url, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      const data = await response.json()

      if (data.items && Array.isArray(data.items)) {
        return data.items
      }
      if (Array.isArray(data)) {
        return data
      }
      return []
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch debit notes by policy")
    }
  }
)

// 12. GET /api/DebitNotes/pending-approval
export const getPendingDebitNotes = createAsyncThunk<
  DebitNote[],
  { page?: number; pageSize?: number },
  { rejectValue: string }
>(
  "debitNotes/getPendingDebitNotes",
  async ({ page = 1, pageSize = 50 }, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const url = `${API_BASE_URL}/DebitNotes/pending-approval?page=${page}&pageSize=${pageSize}`
      const response = await fetch(url, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      const data = await response.json()

      if (data.items && Array.isArray(data.items)) {
        return data.items
      }
      if (Array.isArray(data)) {
        return data
      }
      return []
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch pending debit notes")
    }
  }
)

// 13. GET /api/DebitNotes/{dncnNo}/debitnotedocument
export const getDebitNoteDocument = createAsyncThunk<
  Blob,
  string,
  { rejectValue: string }
>(
  "debitNotes/getDebitNoteDocument",
  async (dncnNo, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(
        `${API_BASE_URL}/DebitNotes/${encodeURIComponent(dncnNo)}/debitnotedocument`,
        {
          method: "GET",
          headers: { accept: "application/octet-stream", Authorization: `Bearer ${AUTH_TOKEN}` },
        }
      )
      if (!response.ok) await handleFetchError(response)
      return await response.blob()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to download debit note document")
    }
  }
)

// 14. GET /api/DebitNotes/{cnNo}/creditnotedocument
export const getCreditNoteDocument = createAsyncThunk<
  Blob,
  string,
  { rejectValue: string }
>(
  "debitNotes/getCreditNoteDocument",
  async (cnNo, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(
        `${API_BASE_URL}/DebitNotes/${encodeURIComponent(cnNo)}/creditnotedocument`,
        {
          method: "GET",
          headers: { accept: "application/octet-stream", Authorization: `Bearer ${AUTH_TOKEN}` },
        }
      )
      if (!response.ok) await handleFetchError(response)
      return await response.blob()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to download credit note document")
    }
  }
)

// 15. GET /api/PolicyAdmin/creditnotes/{cnNo}/document (Alternative)
export const getCreditNoteDocumentAlt = createAsyncThunk<
  Blob,
  string,
  { rejectValue: string }
>(
  "debitNotes/getCreditNoteDocumentAlt",
  async (cnNo, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(
        `${API_BASE_URL}/PolicyAdmin/creditnotes/${encodeURIComponent(cnNo)}/document`,
        {
          method: "GET",
          headers: { accept: "application/octet-stream", Authorization: `Bearer ${AUTH_TOKEN}` },
        }
      )
      if (!response.ok) await handleFetchError(response)
      return await response.blob()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to download credit note document")
    }
  }
)

// 16. Process Debit Note (from second slice)
export const processDebitNote = createAsyncThunk<
  DebitNote,
  { id: number; data: ProcessDebitNoteDto },
  { rejectValue: string }
>(
  "debitNotes/processDebitNote",
  async ({ id, data }, { rejectWithValue, dispatch }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/DebitNotes/${id}/process`, {
        method: "POST",
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) await handleFetchError(response)
      const result = await response.json()
      // Refresh the list
      await dispatch(getDebitNotes({ page: 1, pageSize: 50 }))
      return result
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to process debit note")
    }
  }
)

// 17. Bulk Process Debit Notes (from second slice)
export const bulkProcessDebitNotes = createAsyncThunk<
  BulkProcessResult,
  { ids: number[]; notes?: string },
  { rejectValue: string }
>(
  "debitNotes/bulkProcessDebitNotes",
  async ({ ids, notes }, { rejectWithValue, dispatch }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/DebitNotes/bulk-process`, {
        method: "POST",
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids, notes }),
      })
      if (!response.ok) await handleFetchError(response)
      const result = await response.json()
      // Refresh the list
      await dispatch(getDebitNotes({ page: 1, pageSize: 50 }))
      return result
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to bulk process debit notes")
    }
  }
)

// ============================================================================
// SLICE
// ============================================================================

const debitNoteSlice = createSlice({
  name: "debitNotes",
  initialState,
  reducers: {
    // First slice reducers
    setFilters: (state, action: PayloadAction<Partial<DebitNoteState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = {}
    },
    setCurrentDebitNote: (state, action: PayloadAction<DebitNote | null>) => {
      state.currentDebitNote = action.payload
    },
    clearCurrentDebitNote: (state) => {
      state.currentDebitNote = null
    },
    clearMessages: (state) => {
      state.success = {
        createDebitNote: false,
        updateDebitNote: false,
        deleteDebitNote: false,
        recalculateDebitNote: false,
        processDebitNote: false,
        bulkProcessDebitNotes: false,
      }
      state.error = {
        fetchDebitNotes: null,
        fetchDebitNote: null,
        createDebitNote: null,
        updateDebitNote: null,
        deleteDebitNote: null,
        fetchMapping: null,
        fetchCreditNotes: null,
        calculateCoinsurance: null,
        recalculateDebitNote: null,
        fetchPendingApproval: null,
        downloadDocument: null,
        downloadCreditNoteDocument: null,
        processDebitNote: null,
        bulkProcessDebitNotes: null,
      }
    },
    resetState: () => initialState,

    // Second slice reducers
    clearSelectedItem: (state) => {
      state.selectedItem = null
    },
    clearError: (state) => {
      state.error = {
        fetchDebitNotes: null,
        fetchDebitNote: null,
        createDebitNote: null,
        updateDebitNote: null,
        deleteDebitNote: null,
        fetchMapping: null,
        fetchCreditNotes: null,
        calculateCoinsurance: null,
        recalculateDebitNote: null,
        fetchPendingApproval: null,
        downloadDocument: null,
        downloadCreditNoteDocument: null,
        processDebitNote: null,
        bulkProcessDebitNotes: null,
      }
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.filters.page = action.payload
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.filters.pageSize = action.payload
      state.filters.page = 1
    },
    resetFilters: (state) => {
      state.filters = {
        page: 1,
        pageSize: 50,
      }
    },
    clearPendingItems: (state) => {
      state.pendingItems = []
    },
    clearCreditNotes: (state) => {
      state.items = []
      state.selectedItem = null
    },
  },
  extraReducers: (builder) => {
    // ========================================================================
    // MAP POLICY TO DEBIT NOTE
    // ========================================================================
    builder.addCase(mapPolicyToDebitNote.pending, (state) => {
      state.loading.fetchMapping = true
      state.error.fetchMapping = null
    })
    builder.addCase(mapPolicyToDebitNote.fulfilled, (state, action) => {
      state.loading.fetchMapping = false
      state.debitNoteMapping = action.payload
    })
    builder.addCase(mapPolicyToDebitNote.rejected, (state, action) => {
      state.loading.fetchMapping = false
      state.error.fetchMapping = action.payload as string
    })

    // ========================================================================
    // RECALCULATE DEBIT NOTE
    // ========================================================================
    builder.addCase(recalculateDebitNote.pending, (state) => {
      state.loading.recalculateDebitNote = true
      state.success.recalculateDebitNote = false
      state.error.recalculateDebitNote = null
    })
    builder.addCase(recalculateDebitNote.fulfilled, (state, action) => {
      state.loading.recalculateDebitNote = false
      state.success.recalculateDebitNote = true
      if (state.currentDebitNote) {
        state.currentDebitNote = { ...state.currentDebitNote, ...action.payload }
      }
      if (action.payload?.dncnNo) {
        const index = state.debitNotes.findIndex((dn) => dn.dncnNo === action.payload.dncnNo)
        if (index !== -1) {
          state.debitNotes[index] = { ...state.debitNotes[index], ...action.payload }
        }
      }
      if (action.payload) {
        state.items = [action.payload]
      }
    })
    builder.addCase(recalculateDebitNote.rejected, (state, action) => {
      state.loading.recalculateDebitNote = false
      state.error.recalculateDebitNote = action.payload as string
    })

    // ========================================================================
    // CREATE DEBIT NOTE
    // ========================================================================
    builder.addCase(createDebitNote.pending, (state) => {
      state.loading.createDebitNote = true
      state.success.createDebitNote = false
      state.error.createDebitNote = null
    })
    builder.addCase(createDebitNote.fulfilled, (state, action) => {
      state.loading.createDebitNote = false
      state.success.createDebitNote = true
      state.debitNotes.unshift(action.payload)
      state.currentDebitNote = action.payload
    })
    builder.addCase(createDebitNote.rejected, (state, action) => {
      state.loading.createDebitNote = false
      state.error.createDebitNote = action.payload as string
    })

    // ========================================================================
    // GET DEBIT NOTES
    // ========================================================================
    builder.addCase(getDebitNotes.pending, (state) => {
      state.loading.fetchDebitNotes = true
      state.error.fetchDebitNotes = null
    })
    builder.addCase(getDebitNotes.fulfilled, (state, action) => {
      state.loading.fetchDebitNotes = false
      state.debitNotes = action.payload.items
      state.pagination = {
        page: action.payload.page,
        pageSize: action.payload.pageSize,
        totalCount: action.payload.totalCount,
        totalPages: action.payload.totalPages,
        hasNext: action.payload.hasNext,
        hasPrevious: action.payload.hasPrevious,
      }
    })
    builder.addCase(getDebitNotes.rejected, (state, action) => {
      state.loading.fetchDebitNotes = false
      state.error.fetchDebitNotes = action.payload as string
    })

    // ========================================================================
    // GET DEBIT NOTE BY ID
    // ========================================================================
    builder.addCase(getDebitNoteById.pending, (state) => {
      state.loading.fetchDebitNote = true
      state.error.fetchDebitNote = null
    })
    builder.addCase(getDebitNoteById.fulfilled, (state, action) => {
      state.loading.fetchDebitNote = false
      state.currentDebitNote = action.payload
    })
    builder.addCase(getDebitNoteById.rejected, (state, action) => {
      state.loading.fetchDebitNote = false
      state.error.fetchDebitNote = action.payload as string
    })

    // ========================================================================
    // UPDATE DEBIT NOTE
    // ========================================================================
    builder.addCase(updateDebitNote.pending, (state) => {
      state.loading.updateDebitNote = true
      state.success.updateDebitNote = false
      state.error.updateDebitNote = null
    })
    builder.addCase(updateDebitNote.fulfilled, (state, action) => {
      state.loading.updateDebitNote = false
      state.success.updateDebitNote = true
      const index = state.debitNotes.findIndex((dn) => dn.dncnNo === action.payload.dncnNo)
      if (index !== -1) {
        state.debitNotes[index] = action.payload
      }
      state.currentDebitNote = action.payload
    })
    builder.addCase(updateDebitNote.rejected, (state, action) => {
      state.loading.updateDebitNote = false
      state.error.updateDebitNote = action.payload as string
    })

    // ========================================================================
    // DELETE DEBIT NOTE
    // ========================================================================
    builder.addCase(deleteDebitNote.pending, (state) => {
      state.loading.deleteDebitNote = true
      state.success.deleteDebitNote = false
      state.error.deleteDebitNote = null
    })
    builder.addCase(deleteDebitNote.fulfilled, (state, action) => {
      state.loading.deleteDebitNote = false
      state.success.deleteDebitNote = true
      state.debitNotes = state.debitNotes.filter((dn) => dn.dncnNo !== action.payload.dncnNo)
      if (state.currentDebitNote?.dncnNo === action.payload.dncnNo) {
        state.currentDebitNote = null
      }
    })
    builder.addCase(deleteDebitNote.rejected, (state, action) => {
      state.loading.deleteDebitNote = false
      state.error.deleteDebitNote = action.payload as string
    })

    // ========================================================================
    // GET CREDIT NOTES BY POLICY
    // ========================================================================
    builder.addCase(getCreditNotesByPolicy.pending, (state) => {
      state.loading.fetchCreditNotes = true
      state.error.fetchCreditNotes = null
    })
    builder.addCase(getCreditNotesByPolicy.fulfilled, (state, action) => {
      state.loading.fetchCreditNotes = false
      state.creditNotes = action.payload
    })
    builder.addCase(getCreditNotesByPolicy.rejected, (state, action) => {
      state.loading.fetchCreditNotes = false
      state.error.fetchCreditNotes = action.payload as string
    })

    // ========================================================================
    // GET COINSURANCE DISTRIBUTION
    // ========================================================================
    builder.addCase(getCoinsuranceDistribution.pending, (state) => {
      state.loading.fetchMapping = true
      state.error.fetchMapping = null
    })
    builder.addCase(getCoinsuranceDistribution.fulfilled, (state, action) => {
      state.loading.fetchMapping = false
      state.debitNoteMapping = action.payload
    })
    builder.addCase(getCoinsuranceDistribution.rejected, (state, action) => {
      state.loading.fetchMapping = false
      state.error.fetchMapping = action.payload as string
    })

    // ========================================================================
    // CALCULATE COINSURANCE
    // ========================================================================
    builder.addCase(calculateCoinsurance.pending, (state) => {
      state.loading.calculateCoinsurance = true
      state.error.calculateCoinsurance = null
    })
    builder.addCase(calculateCoinsurance.fulfilled, (state, action) => {
      state.loading.calculateCoinsurance = false
      state.coinsuranceResult = action.payload
    })
    builder.addCase(calculateCoinsurance.rejected, (state, action) => {
      state.loading.calculateCoinsurance = false
      state.error.calculateCoinsurance = action.payload as string
    })

    // ========================================================================
    // GET DEBIT NOTES BY POLICY
    // ========================================================================
    builder.addCase(getDebitNotesByPolicy.pending, (state) => {
      state.loading.fetchDebitNotes = true
      state.error.fetchDebitNotes = null
    })
    builder.addCase(getDebitNotesByPolicy.fulfilled, (state, action) => {
      state.loading.fetchDebitNotes = false
      state.debitNotes = action.payload
      state.items = action.payload
    })
    builder.addCase(getDebitNotesByPolicy.rejected, (state, action) => {
      state.loading.fetchDebitNotes = false
      state.error.fetchDebitNotes = action.payload as string
    })

    // ========================================================================
    // GET PENDING DEBIT NOTES
    // ========================================================================
    builder.addCase(getPendingDebitNotes.pending, (state) => {
      state.loading.fetchPendingApproval = true
      state.error.fetchPendingApproval = null
    })
    builder.addCase(getPendingDebitNotes.fulfilled, (state, action) => {
      state.loading.fetchPendingApproval = false
      state.pendingItems = action.payload
    })
    builder.addCase(getPendingDebitNotes.rejected, (state, action) => {
      state.loading.fetchPendingApproval = false
      state.error.fetchPendingApproval = action.payload as string
    })

    // ========================================================================
    // GET DEBIT NOTE DOCUMENT
    // ========================================================================
    builder.addCase(getDebitNoteDocument.pending, (state) => {
      state.loading.downloadDocument = true
      state.error.downloadDocument = null
    })
    builder.addCase(getDebitNoteDocument.fulfilled, (state) => {
      state.loading.downloadDocument = false
      state.downloading = false
    })
    builder.addCase(getDebitNoteDocument.rejected, (state, action) => {
      state.loading.downloadDocument = false
      state.downloading = false
      state.error.downloadDocument = action.payload as string
    })

    // ========================================================================
    // GET CREDIT NOTE DOCUMENT
    // ========================================================================
    builder.addCase(getCreditNoteDocument.pending, (state) => {
      state.loading.downloadCreditNoteDocument = true
      state.error.downloadCreditNoteDocument = null
    })
    builder.addCase(getCreditNoteDocument.fulfilled, (state) => {
      state.loading.downloadCreditNoteDocument = false
      state.downloading = false
    })
    builder.addCase(getCreditNoteDocument.rejected, (state, action) => {
      state.loading.downloadCreditNoteDocument = false
      state.downloading = false
      state.error.downloadCreditNoteDocument = action.payload as string
    })

    // ========================================================================
    // GET CREDIT NOTE DOCUMENT ALT
    // ========================================================================
    builder.addCase(getCreditNoteDocumentAlt.pending, (state) => {
      state.loading.downloadCreditNoteDocument = true
      state.error.downloadCreditNoteDocument = null
    })
    builder.addCase(getCreditNoteDocumentAlt.fulfilled, (state) => {
      state.loading.downloadCreditNoteDocument = false
      state.downloading = false
    })
    builder.addCase(getCreditNoteDocumentAlt.rejected, (state, action) => {
      state.loading.downloadCreditNoteDocument = false
      state.downloading = false
      state.error.downloadCreditNoteDocument = action.payload as string
    })

    // ========================================================================
    // PROCESS DEBIT NOTE
    // ========================================================================
    builder.addCase(processDebitNote.pending, (state) => {
      state.loading.processDebitNote = true
      state.success.processDebitNote = false
      state.error.processDebitNote = null
    })
    builder.addCase(processDebitNote.fulfilled, (state, action) => {
      state.loading.processDebitNote = false
      state.success.processDebitNote = true
      const index = state.debitNotes.findIndex((dn) => dn.id === action.payload.id)
      if (index !== -1) {
        state.debitNotes[index] = action.payload
      }
    })
    builder.addCase(processDebitNote.rejected, (state, action) => {
      state.loading.processDebitNote = false
      state.error.processDebitNote = action.payload as string
    })

    // ========================================================================
    // BULK PROCESS DEBIT NOTES
    // ========================================================================
    builder.addCase(bulkProcessDebitNotes.pending, (state) => {
      state.loading.bulkProcessDebitNotes = true
      state.success.bulkProcessDebitNotes = false
      state.error.bulkProcessDebitNotes = null
    })
    builder.addCase(bulkProcessDebitNotes.fulfilled, (state) => {
      state.loading.bulkProcessDebitNotes = false
      state.success.bulkProcessDebitNotes = true
    })
    builder.addCase(bulkProcessDebitNotes.rejected, (state, action) => {
      state.loading.bulkProcessDebitNotes = false
      state.error.bulkProcessDebitNotes = action.payload as string
    })
  },
})

// ============================================================================
// EXPORTS
// ============================================================================


// Export slice actions
export const {
  setFilters,
  clearFilters,
  setCurrentDebitNote,
  clearCurrentDebitNote,
  clearMessages,
  resetState,
  clearSelectedItem,
  clearError,
  clearPendingItems,
  setPage,
  setPageSize,
  resetFilters,
  clearCreditNotes,
} = debitNoteSlice.actions

// Export default
export default debitNoteSlice.reducer

// ============================================================================
// ALIAS EXPORTS FOR DEBITNOTE LIST COMPONENT
// ============================================================================

// These are aliases for the thunks already exported above
// They provide the names that DebitNoteList.tsx expects
export const fetchDebitNotesByPolicy = getDebitNotesByPolicy;
export const fetchPendingDebitNotes = getPendingDebitNotes;
export const fetchCreditNotesByPolicy = getCreditNotesByPolicy;
export const downloadDebitNoteDocument = getDebitNoteDocument;
export const downloadCreditNoteDocument = getCreditNoteDocument;
export const downloadCreditNoteDocumentAlt = getCreditNoteDocumentAlt;