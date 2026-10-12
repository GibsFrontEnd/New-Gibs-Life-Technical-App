// @ts-nocheck
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { decryptData } from "../../../utils/encrypt-utils";
import { SERVER_URL } from "../../../utils/constants";

const API_BASE_URL = SERVER_URL;

const getAuthToken = () => {
  try {
    const encryptedToken = localStorage.getItem("token");
    if (!encryptedToken) return null;
    return decryptData(encryptedToken);
  } catch (err) {
    console.warn("Failed to get token", err);
    return null;
  }
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface FacOutComponent {
  policyNo: string;
  policyDetailId: string;
  certOrDocNo: string;
  componentRef: string;
  componentRefSource: string;
  componentType: string;
  componentId: string;
  description: string;
  location: string;
  sumInsured: number;
  netPremium: number;
  itemCount: number;
  hasFacSlip: boolean;
  cessionCount: number;
  totalAmtCeded: number;
  totalPropOffer: number;
  facslipID: string | null;
}

export interface FacOutListItem {
  facslipID: number;
  policyNo: string;
  certOrDocNo: string;
  componentRef: string;
  componentType: string;
  slipKind: string;
  partyID: string;
  party: string;
  riskValue: number;
  acceptRate: number;
  propOffer: number;
  amtCeded: number;
  reinPremium: number;
  proRataPremium: number;
  reinStartDate: string;
  reinEndDate: string;
  status: string;
  submittedBy: string;
  submittedOn: string;
}

export interface InitFacOutRequest {
  policyNo: string;
  componentRef: string;
  componentId: string;
  certOrDocNo: string;
  policyDetailId: string;
  riskClass?: string;
}

export interface InitFacOutResponse {
  policyNo: string;
  certOrDocNo: string;
  policyDetailId: string;
  componentRef: string;
  componentType: string;
  componentDescription: string;
  componentLocation: string;
  componentRefIsFallback: boolean;
  riskClass: string;
  insuredName: string;
  subRiskId: string;
  branchId: string;
  riskValue: number;
  riskPremium: number;
  acceptRate: number;
  acceptance: number;
  acceptedPremium: number;
  retentionRate: number;
  retention: number;
  reinStartDate: string;
  reinEndDate: string;
  coverDays: number;
  proRataDays: number;
  exchangeRate: number;
  currency: string;
  proportionRate: number;
  visibility?: any;
  sourceRule?: string;
}

export interface CalculateFacOutRequest {
  policyNo: string;
  riskValue: number;
  riskPremium: number;
  acceptRate: number;
  retentionRate: number;
  reinStartDate: string;
  reinEndDate: string;
  coverDays: number;
  proRataDays: number;
  cessions: {
    facslipID?: number;
    partyID: string;
    party: string;
    propOffer: number;
    reinCommission: number;
  }[];
}

export interface CalculateFacOutResponse {
  riskValue: number;
  riskPremium: number;
  acceptRate: number;
  acceptance: number;
  acceptanceFormula?: string;
  acceptedPremium: number;
  acceptedPremiumFormula?: string;
  retentionRate: number;
  retention: number;
  retentionFormula?: string;
  coverDays: number;
  proRataDays: number;
  cessionBasis?: string;
  cessions: {
    amtCededFormula?: string;
    reinPremiumFormula?: string;
    proRataFormula?: string;
    facslipID?: number;
    partyID: string;
    party: string;
    propOffer: number;
    amtCeded: number;
    reinCommission: number;
    reinCommissionAmount: number;
    reinPremium: number;
    coverDays: number;
    proRataPremium: number;
    netToReinsurer?: number;
    isActive?: boolean;
  }[];
  totals?: any;
  warnings?: string[];
}

export interface SaveFacOutRequest {
  policyNo: string;
  policyDetailId: string;
  certOrDocNo: string;
  componentRef: string;
  componentId: string;
  riskClass: string;
  riskValue: number;
  riskPremium: number;
  reinStartDate: string;
  reinEndDate: string;
  acceptRate: number;
  acceptance: number;
  acceptedPremium: number;
  retentionRate: number;
  retention: number;
  riskDescription: string;
  location: string;
  remarks: string;
  rateOption: number;
  useVariousRates: boolean;
  rateVarious: string;
  mplRate: number;
  voyageFrom: string;
  voyageTo: string;
  interest: string;
  conveyance: string;
  cover: string;
  proRataDays: number;
  cessions: {
    facslipID?: number;
    partyID: string;
    party: string;
    propOffer: number;
    reinCommission: number;
  }[];
  submittedBy: string;
  recalculate: boolean;
}

interface FacOutState {
  components: FacOutComponent[];
  facOutList: FacOutListItem[];
  loading: {
    getComponents: boolean;
    getFacOutList: boolean;
    fetchForEdit: boolean;
    initComponent: boolean;
    calculateComponent: boolean;
    saveFacOut: boolean;
    deleteCession: boolean;
    deleteSlip: boolean;
  };
  error: {
    fetchPolicies: string | null;
    fetchPolicy: string | null;
    fetchFacOutList: string | null;
    getFacOutComponents: string | null;
    saveFacOut: string | null;
    updateFacOut: string | null;
    deleteCession: string | null;
    deleteSlip: string | null;
    initBatchFacOut: string | null;
    calculateBatchFacOut: string | null;
    saveBatchFacOut: string | null;
    initFacOutNote: string | null;
    calculateFacOutNote: string | null;
    saveFacOutNote: string | null;
    getFacOutNotes: string | null;
    getFacOutNoteDetail: string | null;
    deleteFacOutNote: string | null;
  };
  saveSuccess: boolean;
}

const initialState: FacOutState = {
  components: [],
  facOutList: [],
  loading: {
    getComponents: false,
    getFacOutList: false,
    fetchForEdit: false,
    initComponent: false,
    calculateComponent: false,
    saveFacOut: false,
    deleteCession: false,
    deleteSlip: false,
  },
  error: {
    getComponents: null,
    getFacOutList: null,
    fetchForEdit: null,
    initComponent: null,
    calculateComponent: null,
    saveFacOut: null,
    deleteCession: null,
    deleteSlip: null,
    initBatchFacOut: null,
    calculateBatchFacOut: null,
    saveBatchFacOut: null,
    initFacOutNote: null,
    calculateFacOutNote: null,
    saveFacOutNote: null,
    getFacOutNotes: null,
    getFacOutNoteDetail: null,
    deleteFacOutNote: null,
  },
  saveSuccess: false,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

// GET /api/facouts/components?policyNo=xxx&onlyWithoutFac=false
export const getFacOutComponents = createAsyncThunk<
  FacOutComponent[],
  { policyNo: string; onlyWithoutFac?: boolean },
  { rejectValue: string }
>(
  "facOut/getComponents",
  async ({ policyNo, onlyWithoutFac = false }, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken();
      const url = `${API_BASE_URL}/facouts/components?policyNo=${encodeURIComponent(policyNo)}&onlyWithoutFac=${onlyWithoutFac}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch fac out components"
      );
    }
  }
);

// GET /api/facouts/list
export const getFacOutList = createAsyncThunk<
  FacOutListItem[],
  { policyNo: string; includeDeleted?: boolean; page?: number; pageSize?: number },
  { rejectValue: string }
>(
  "facOut/getList",
  async ({ policyNo, includeDeleted = false, page = 1, pageSize = 25 }, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken();
      const url = `${API_BASE_URL}/facouts/list?policyNo=${encodeURIComponent(policyNo)}&includeDeleted=${includeDeleted}&page=${page}&pageSize=${pageSize}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch fac out list"
      );
    }
  }
);

// GET /api/facouts/{facslipID}/edit
export const fetchFacOutForEdit = createAsyncThunk<
  any,
  number,
  { rejectValue: string }
>(
  "facOut/fetchForEdit",
  async (facslipID, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken();
      const url = `${API_BASE_URL}/facouts/${facslipID}/edit`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch fac out for edit"
      );
    }
  }
);

// GET /api/facouts/init
export const initFacOutComponent = createAsyncThunk<
  InitFacOutResponse,
  InitFacOutRequest,
  { rejectValue: string }
>(
  "facOut/initComponent",
  async (params, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken();
      const queryParams = new URLSearchParams();
      queryParams.append("policyNo", params.policyNo);
      queryParams.append("componentRef", params.componentRef);
      queryParams.append("componentId", params.componentId);
      queryParams.append("certOrDocNo", params.certOrDocNo);
      queryParams.append("policyDetailId", params.policyDetailId);
      if (params.riskClass) {
        queryParams.append("riskClass", params.riskClass);
      }

      const url = `${API_BASE_URL}/facouts/init?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      });
      
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to initialize fac out component"
      );
    }
  }
);

// POST /api/facouts/calculate
export const calculateFacOutComponent = createAsyncThunk<
  CalculateFacOutResponse,
  CalculateFacOutRequest,
  { rejectValue: string }
>(
  "facOut/calculateComponent",
  async (payload, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken();
      // Destructure policyNo to not send it in body, only in query param
      const { policyNo, ...bodyData } = payload;
      
      const url = `${API_BASE_URL}/facouts/calculate?policyNo=${encodeURIComponent(policyNo)}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: JSON.stringify(bodyData),
      });
      
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to calculate fac out component"
      );
    }
  }
);

// POST /api/facouts (Save)
export const saveFacOut = createAsyncThunk<
  any,
  SaveFacOutRequest,
  { rejectValue: string }
>(
  "facOut/saveFacOut",
  async (payload, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken();
      const url = `${API_BASE_URL}/facouts`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to save fac out"
      );
    }
  }
);

// PUT /api/facouts/{facslipID} (Update)
export const updateFacOut = createAsyncThunk<
  any,
  { facslipID: number; payload: SaveFacOutRequest },
  { rejectValue: string }
>(
  "facOut/updateFacOut",
  async ({ facslipID, payload }, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken();
      const url = `${API_BASE_URL}/facouts/${facslipID}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update fac out"
      );
    }
  }
);

// DELETE /api/facouts/{facslipID} (Delete Cession)
export const deleteCession = createAsyncThunk<
  any,
  number,
  { rejectValue: string }
>(
  "facOut/deleteCession",
  async (facslipID, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken();
      const url = `${API_BASE_URL}/facouts/${facslipID}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      return facslipID;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to delete cession"
      );
    }
  }
);

// DELETE /api/facouts/slip (Delete Slip)
export const deleteSlip = createAsyncThunk<
  any,
  { policyNo: string; componentRef: string },
  { rejectValue: string }
>(
  "facOut/deleteSlip",
  async ({ policyNo, componentRef }, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken();
      const url = `${API_BASE_URL}/facouts/slip?policyNo=${encodeURIComponent(policyNo)}&componentRef=${encodeURIComponent(componentRef)}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      return { policyNo, componentRef };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to delete slip"
      );
    }
  }
);

// POST /api/facouts/batch/init (Initialize Batch Fac Out)
export const initBatchFacOut = createAsyncThunk<
  any,
  { policyNo: string; policyDetailIds: string[] },
  { rejectValue: string }
>(
  "facOut/initBatchFacOut",
  async ({ policyNo, policyDetailIds }, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken();
      const url = `${API_BASE_URL}/facouts/batch/init`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: JSON.stringify({ policyNo, policyDetailIds }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to init batch fac out"
      );
    }
  }
);

// POST /api/facouts/batch/calculate (Calculate Batch Fac Out)
export const calculateBatchFacOut = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>(
  "facOut/calculateBatchFacOut",
  async (payload, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken();
      const url = `${API_BASE_URL}/facouts/batch/calculate`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to calculate batch fac out"
      );
    }
  }
);

// POST /api/facouts/batch (Save Batch Fac Out)
export const saveBatchFacOut = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>(
  "facOut/saveBatchFacOut",
  async (payload, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken();
      const url = `${API_BASE_URL}/facouts/batch`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to save batch fac out"
      );
    }
  }
);

// GET /api/facouts/notes/init (Initialize Fac Out Credit Note)
export const initFacOutNote = createAsyncThunk<
  any,
  { facslipId: number; policyNo: string; noteType: "CN" | "DN" },
  { rejectValue: string }
>(
  "facOut/initFacOutNote",
  async ({ facslipId, policyNo, noteType }, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken();
      const url = `${API_BASE_URL}/facouts/notes/init?facslipId=${facslipId}&policyNo=${encodeURIComponent(
        policyNo
      )}&noteType=${noteType}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to init fac out note"
      );
    }
  }
);

// POST /api/facouts/notes/calculate (Calculate Note)
export const calculateFacOutNote = createAsyncThunk<
  any,
  { grossPremium: number; commissionRate: number; vatRate: number },
  { rejectValue: string }
>(
  "facOut/calculateFacOutNote",
  async (payload, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken();
      const url = `${API_BASE_URL}/facouts/notes/calculate`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to calculate note"
      );
    }
  }
);

// POST /api/facouts/notes (Save Note)
export const saveFacOutNote = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>(
  "facOut/saveFacOutNote",
  async (payload, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken();
      const url = `${API_BASE_URL}/facouts/notes`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to save note"
      );
    }
  }
);

// GET /api/facouts/notes/list (Get list of credit notes)
export const getFacOutNotes = createAsyncThunk<
  any[],
  { policyNo: string; noteType: "CN" | "DN"; includeDeleted?: boolean },
  { rejectValue: string }
>(
  "facOut/getFacOutNotes",
  async ({ policyNo, noteType, includeDeleted = false }, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken();
      const url = `${API_BASE_URL}/facouts/notes/list?policyNo=${encodeURIComponent(
        policyNo
      )}&noteType=${noteType}&includeDeleted=${includeDeleted}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch credit notes list"
      );
    }
  }
);

// GET /api/facouts/notes/detail (Get credit note detail for edit)
export const getFacOutNoteDetail = createAsyncThunk<
  any,
  string,
  { rejectValue: string }
>(
  "facOut/getFacOutNoteDetail",
  async (dncnNo, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken();
      const url = `${API_BASE_URL}/facouts/notes/detail?dncnNo=${encodeURIComponent(
        dncnNo
      )}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch credit note details"
      );
    }
  }
);

// DELETE /api/facouts/notes (Delete credit note)
export const deleteFacOutNote = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  "facOut/deleteFacOutNote",
  async (dncnNo, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken();
      const url = `${API_BASE_URL}/facouts/notes?dncnNo=${encodeURIComponent(dncnNo)}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to delete credit note"
      );
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const facOutSlice = createSlice({
  name: "facOut",
  initialState,
  reducers: {
    clearComponents: (state) => {
      state.components = [];
    },
    clearSaveSuccess: (state) => {
      state.saveSuccess = false;
      state.error.saveFacOut = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getFacOutComponents.pending, (state) => {
        state.loading.getComponents = true;
        state.error.getComponents = null;
      })
      .addCase(getFacOutComponents.fulfilled, (state, action) => {
        state.loading.getComponents = false;
        state.components = action.payload;
      })
      .addCase(getFacOutComponents.rejected, (state, action) => {
        state.loading.getComponents = false;
        state.error.getComponents = action.payload ?? "Unknown error";
        state.components = [];
      })
      .addCase(initFacOutComponent.pending, (state) => {
        state.loading.initComponent = true;
        state.error.initComponent = null;
      })
      .addCase(initFacOutComponent.fulfilled, (state) => {
        state.loading.initComponent = false;
      })
      .addCase(initFacOutComponent.rejected, (state, action) => {
        state.loading.initComponent = false;
        state.error.initComponent = action.payload ?? "Unknown error";
      })
      .addCase(calculateFacOutComponent.pending, (state) => {
        state.loading.calculateComponent = true;
        state.error.calculateComponent = null;
      })
      .addCase(calculateFacOutComponent.fulfilled, (state) => {
        state.loading.calculateComponent = false;
      })
      .addCase(calculateFacOutComponent.rejected, (state, action) => {
        state.loading.calculateComponent = false;
        state.error.calculateComponent = action.payload ?? "Unknown error";
      })
      .addCase(saveFacOut.pending, (state) => {
        state.loading.saveFacOut = true;
        state.error.saveFacOut = null;
        state.saveSuccess = false;
      })
      .addCase(saveFacOut.fulfilled, (state) => {
        state.loading.saveFacOut = false;
        state.saveSuccess = true;
      })
      .addCase(saveFacOut.rejected, (state, action) => {
        state.loading.saveFacOut = false;
        state.error.saveFacOut = action.payload ?? "Unknown error";
      })
      .addCase(getFacOutList.pending, (state) => {
        state.loading.getFacOutList = true;
        state.error.getFacOutList = null;
      })
      .addCase(getFacOutList.fulfilled, (state, action) => {
        state.loading.getFacOutList = false;
        state.facOutList = action.payload;
      })
      .addCase(getFacOutList.rejected, (state, action) => {
        state.loading.getFacOutList = false;
        state.error.getFacOutList = action.payload ?? "Unknown error";
        state.facOutList = [];
      })
      .addCase(updateFacOut.pending, (state) => {
        state.loading.saveFacOut = true;
        state.error.saveFacOut = null;
        state.saveSuccess = false;
      })
      .addCase(updateFacOut.fulfilled, (state) => {
        state.loading.saveFacOut = false;
        state.saveSuccess = true;
      })
      .addCase(updateFacOut.rejected, (state, action) => {
        state.loading.saveFacOut = false;
        state.error.saveFacOut = action.payload ?? "Unknown error";
      })
      .addCase(deleteCession.pending, (state) => {
        state.loading.deleteCession = true;
        state.error.deleteCession = null;
      })
      .addCase(deleteCession.fulfilled, (state, action) => {
        state.loading.deleteCession = false;
        // Optionally update the list immediately by filtering out the deleted cession
        if (state.facOutList && action.payload) {
          state.facOutList = state.facOutList.filter(f => f.facslipID !== action.payload);
        }
      })
      .addCase(deleteCession.rejected, (state, action) => {
        state.loading.deleteCession = false;
        state.error.deleteCession = action.payload ?? "Unknown error";
      })
      .addCase(deleteSlip.pending, (state) => {
        state.loading.deleteSlip = true;
        state.error.deleteSlip = null;
      })
      .addCase(deleteSlip.fulfilled, (state) => {
        state.loading.deleteSlip = false;
      })
      .addCase(deleteSlip.rejected, (state, action) => {
        state.loading.deleteSlip = false;
        state.error.deleteSlip = action.payload ?? "Unknown error";
      })
      .addCase(initBatchFacOut.pending, (state) => {
        state.error.initBatchFacOut = null;
      })
      .addCase(initBatchFacOut.fulfilled, (state) => {
        state.error.initBatchFacOut = null;
      })
      .addCase(initBatchFacOut.rejected, (state, action) => {
        state.error.initBatchFacOut = action.payload ?? "Unknown error";
      })
      .addCase(calculateBatchFacOut.pending, (state) => {
        state.error.calculateBatchFacOut = null;
      })
      .addCase(calculateBatchFacOut.fulfilled, (state) => {
        state.error.calculateBatchFacOut = null;
      })
      .addCase(calculateBatchFacOut.rejected, (state, action) => {
        state.error.calculateBatchFacOut = action.payload ?? "Unknown error";
      })
      .addCase(saveBatchFacOut.pending, (state) => {
        state.error.saveBatchFacOut = null;
      })
      .addCase(saveBatchFacOut.fulfilled, (state) => {
        state.error.saveBatchFacOut = null;
      })
      .addCase(saveBatchFacOut.rejected, (state, action) => {
        state.error.saveBatchFacOut = action.payload ?? "Unknown error";
      })
      .addCase(initFacOutNote.pending, (state) => {
        state.error.initFacOutNote = null;
      })
      .addCase(initFacOutNote.fulfilled, (state) => {
        state.error.initFacOutNote = null;
      })
      .addCase(initFacOutNote.rejected, (state, action) => {
        state.error.initFacOutNote = action.payload ?? "Unknown error";
      })
      .addCase(calculateFacOutNote.pending, (state) => {
        state.error.calculateFacOutNote = null;
      })
      .addCase(calculateFacOutNote.fulfilled, (state) => {
        state.error.calculateFacOutNote = null;
      })
      .addCase(calculateFacOutNote.rejected, (state, action) => {
        state.error.calculateFacOutNote = action.payload ?? "Unknown error";
      })
      .addCase(saveFacOutNote.pending, (state) => {
        state.error.saveFacOutNote = null;
      })
      .addCase(saveFacOutNote.fulfilled, (state) => {
        state.error.saveFacOutNote = null;
      })
      .addCase(saveFacOutNote.rejected, (state, action) => {
        state.error.saveFacOutNote = action.payload ?? "Unknown error";
      })
      .addCase(getFacOutNotes.pending, (state) => {
        state.error.getFacOutNotes = null;
      })
      .addCase(getFacOutNotes.fulfilled, (state) => {
        state.error.getFacOutNotes = null;
      })
      .addCase(getFacOutNotes.rejected, (state, action) => {
        state.error.getFacOutNotes = action.payload ?? "Unknown error";
      })
      .addCase(getFacOutNoteDetail.pending, (state) => {
        state.error.getFacOutNoteDetail = null;
      })
      .addCase(getFacOutNoteDetail.fulfilled, (state) => {
        state.error.getFacOutNoteDetail = null;
      })
      .addCase(getFacOutNoteDetail.rejected, (state, action) => {
        state.error.getFacOutNoteDetail = action.payload ?? "Unknown error";
      })
      .addCase(deleteFacOutNote.pending, (state) => {
        state.error.deleteFacOutNote = null;
      })
      .addCase(deleteFacOutNote.fulfilled, (state) => {
        state.error.deleteFacOutNote = null;
      })
      .addCase(deleteFacOutNote.rejected, (state, action) => {
        state.error.deleteFacOutNote = action.payload ?? "Unknown error";
      });
  },
});

export const { clearComponents, clearSaveSuccess } = facOutSlice.actions;
export default facOutSlice.reducer;
