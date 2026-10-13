//@ts-nocheck
//@ts-nocheck
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "../../store";
import type {
  Customer,
  CustomerState,
  CustomerPagination,
  CreateCustomerRequest,
} from "../../../types/customer";
import { decryptData } from "../../../utils/encrypt-utils";
import { SERVER_URL } from "../../../utils/constants";

const API_BASE_URL = SERVER_URL;

const getAuthToken = () => {
  try {
    const encryptedToken = localStorage.getItem("token");
    if (!encryptedToken) return "";
    return decryptData(encryptedToken) || "";
  } catch {
    return "";
  }
};

const AUTH_TOKEN = getAuthToken();

// Payment types
interface InitializePaymentRequest {
  policyNo: string;
  paymentAmount: number;
  email: string;
  customerName: string;
}

interface InitializePaymentResponse {
  reference: string;
  authorizationUrl: string;
  // Add other response fields as needed
}

interface VerifyPaymentResponse {
  status: string;
  reference: string;
  amount: number;
  // Add other response fields as needed
}

// Async thunks
export const getAllCustomers = createAsyncThunk(
  "customers/getAllCustomers",
  async (
    params: {
      pageNumber?: number;
      pageSize?: number;
      searchTerm?: string;
      insuredType?: string;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const pageNumber = params.pageNumber || 1;
      const pageSize = params.pageSize || 20;

      const queryParams = new URLSearchParams();
      queryParams.append("pageNumber", pageNumber.toString());
      queryParams.append("pageSize", pageSize.toString());
      if (params.searchTerm && params.searchTerm.trim()) {
        queryParams.append("searchTerm", params.searchTerm.trim());
      }
      if (params.insuredType && params.insuredType.trim()) {
        queryParams.append("insuredType", params.insuredType.trim());
      }

      const response = await fetch(
        `${API_BASE_URL}/v1/Customers?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: "Bearer " + getAuthToken(),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        return {
          data,
          pageNumber,
          pageSize,
          totalRecords: data.length,
          totalPages: Math.ceil(data.length / pageSize) || 1,
          hasNextPage: pageNumber * pageSize < data.length,
          hasPreviousPage: pageNumber > 1,
        };
      }

      if (data && Array.isArray(data.data)) {
        const total =
          data.totalRecords ?? data.totalCount ?? data.count ?? data.data.length;
        const totalP =
          data.totalPages ?? Math.ceil(total / pageSize) ?? 1;
        return {
          data: data.data,
          pageNumber: data.pageNumber || pageNumber,
          pageSize: data.pageSize || pageSize,
          totalRecords: total,
          totalPages: totalP,
          hasNextPage: data.hasNextPage ?? pageNumber < totalP,
          hasPreviousPage: data.hasPreviousPage ?? pageNumber > 1,
        };
      }

      if (data && Array.isArray(data.items)) {
        const total =
          data.totalCount ?? data.totalRecords ?? data.items.length;
        const totalP =
          data.totalPages ?? Math.ceil(total / pageSize) ?? 1;
        return {
          data: data.items,
          pageNumber: data.page || data.pageNumber || pageNumber,
          pageSize: data.pageSize || pageSize,
          totalRecords: total,
          totalPages: totalP,
          hasNextPage: data.hasNext ?? pageNumber < totalP,
          hasPreviousPage: data.hasPrevious ?? pageNumber > 1,
        };
      }

      return {
        data: [],
        pageNumber,
        pageSize,
        totalRecords: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch customers"
      );
    }
  }
);

export const getCustomer = createAsyncThunk(
  "customers/getCustomer",
  async (customerId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/Customers/${encodeURIComponent(customerId)}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: "Bearer " + AUTH_TOKEN,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // API may wrap the record in { data: {...} }
      return (data?.data ?? data) as Customer;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch customer"
      );
    }
  }
);

export const createCustomer = createAsyncThunk(
  "customers/createCustomer",
  async (customerData: CreateCustomerRequest, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/Customers`, {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: "Bearer " + AUTH_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.errors) {
            errMsg = Object.values(errData.errors).flat().join(" ") || errData.title || errMsg;
          } else if (errData.message || errData.title) {
            errMsg = errData.message || errData.title;
          }
        } catch {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      return data as Customer;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to create customer"
      );
    }
  }
);

export const updateCustomer = createAsyncThunk(
  "customers/updateCustomer",
  async (
    {
      customerID,
      customerData,
    }: { customerID: string; customerData: CreateCustomerRequest },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/Customers/${customerID}`, {
        method: "PUT",
        headers: {
          accept: "application/json",
          Authorization: "Bearer " + AUTH_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.errors) {
            errMsg = Object.values(errData.errors).flat().join(" ") || errData.title || errMsg;
          } else if (errData.message || errData.title) {
            errMsg = errData.message || errData.title;
          }
        } catch {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      return { customerID, customerData: data as Customer };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update customer"
      );
    }
  }
);

export const deleteCustomer = createAsyncThunk(
  "customers/deleteCustomer",
  async (customerID: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/Customers/${customerID}`, {
        method: "DELETE",
        headers: {
          accept: "*/*",
          Authorization: "Bearer " + AUTH_TOKEN,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return customerID;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to delete customer"
      );
    }
  }
);

// Payment thunks
export const initializePayment = createAsyncThunk(
  "customers/initializePayment",
  async (paymentData: InitializePaymentRequest, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Payment/initialize`, {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: AUTH_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as InitializePaymentResponse;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to initialize payment"
      );
    }
  }
);

export const verifyPayment = createAsyncThunk(
  "customers/verifyPayment",
  async (reference: string, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/Payment/verify/${reference}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: AUTH_TOKEN,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as VerifyPaymentResponse;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to verify payment"
      );
    }
  }
);

// Regular Proposal Thunks
export const getRegularProposalsByInsuredId = createAsyncThunk(
  "customers/getRegularProposalsByInsuredId",
  async (insuredId: string, { rejectWithValue }) => {
    try {
      const encodedInsuredId = encodeURIComponent(insuredId);
      const response = await fetch(
        `${API_BASE_URL}/v1/IndividualLife/insured/${encodedInsuredId}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: AUTH_TOKEN,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as PagedResponse;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch regular proposals"
      );
    }
  }
);

export const getTraditionalProposalsByInsuredId = createAsyncThunk(
  "customers/getTraditionalProposalsByInsuredId",
  async (insuredId: string, { rejectWithValue }) => {
    try {
      const encodedInsuredId = encodeURIComponent(insuredId);
      const response = await fetch(
        `${API_BASE_URL}/v1/IndividualLife/traditional/insured/${encodedInsuredId}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: AUTH_TOKEN,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as PagedResponse;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch traditional proposals"
      );
    }
  }
);

// QUOTATION THUNKS
export const getRegularQuotationsByInsuredId = createAsyncThunk(
  "customers/getRegularQuotationsByInsuredId",
  async (insuredId: string, { rejectWithValue }) => {
    try {
      const encodedInsuredId = encodeURIComponent(insuredId);
      const response = await fetch(
        `${API_BASE_URL}/Quotation/insured/${encodedInsuredId}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: AUTH_TOKEN,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as PagedResponse;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch regular quotations"
      );
    }
  }
);

export const getRegularQuotationsPaged = createAsyncThunk(
  "customers/getRegularQuotationsPaged",
  async (
    {
      insuredId,
      page = 1,
      pageSize = 10,
    }: { insuredId: string; page?: number; pageSize?: number },
    { rejectWithValue }
  ) => {
    try {
      const encodedInsuredId = encodeURIComponent(insuredId);
      const response = await fetch(
        `${API_BASE_URL}/Quotation/insured/${encodedInsuredId}/paged?page=${page}&pageSize=${pageSize}`,
        {
          method: "GET",
          headers: {
            accept: "*/*",
            Authorization: AUTH_TOKEN,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as PagedResponse;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch paged regular quotations"
      );
    }
  }
);

export const getTraditionalQuotationsByInsuredId = createAsyncThunk(
  "customers/getTraditionalQuotationsByInsuredId",
  async (insuredId: string, { rejectWithValue }) => {
    try {
      const encodedInsuredId = encodeURIComponent(insuredId);
      const response = await fetch(
        `${API_BASE_URL}/Quotation/traditional/insured/${encodedInsuredId}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: AUTH_TOKEN,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as PagedResponse;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch traditional quotations"
      );
    }
  }
);

export const getTraditionalQuotationsPaged = createAsyncThunk(
  "customers/getTraditionalQuotationsPaged",
  async (
    {
      insuredId,
      page = 1,
      pageSize = 10,
    }: { insuredId: string; page?: number; pageSize?: number },
    { rejectWithValue }
  ) => {
    try {
      const encodedInsuredId = encodeURIComponent(insuredId);
      const response = await fetch(
        `${API_BASE_URL}/Quotation/traditional/insured/${encodedInsuredId}/paged?page=${page}&pageSize=${pageSize}`,
        {
          method: "GET",
          headers: {
            accept: "*/*",
            Authorization: AUTH_TOKEN,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as PagedResponse;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch paged traditional quotations"
      );
    }
  }
);

export const getGroupLifeQuotationsByInsuredId = createAsyncThunk(
  "customers/getGroupLifeQuotationsByInsuredId",
  async (insuredId: string, { rejectWithValue }) => {
    try {
      const encodedInsuredId = encodeURIComponent(insuredId);
      const response = await fetch(
        `${API_BASE_URL}/Quotation/grouplife/insured/${encodedInsuredId}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: AUTH_TOKEN,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as PagedResponse;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch group life quotations"
      );
    }
  }
);

export const getGroupLifeQuotationsPaged = createAsyncThunk(
  "customers/getGroupLifeQuotationsPaged",
  async (
    {
      insuredId,
      page = 1,
      pageSize = 10,
    }: { insuredId: string; page?: number; pageSize?: number },
    { rejectWithValue }
  ) => {
    try {
      const encodedInsuredId = encodeURIComponent(insuredId);
      const response = await fetch(
        `${API_BASE_URL}/Quotation/grouplife/insured/${encodedInsuredId}/paged?page=${page}&pageSize=${pageSize}`,
        {
          method: "GET",
          headers: {
            accept: "*/*",
            Authorization: AUTH_TOKEN,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as PagedResponse;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch paged group life quotations"
      );
    }
  }
);

export const searchQuotations = createAsyncThunk(
  "customers/searchQuotations",
  async (
    params: {
      agentCode?: string;
      insuredId?: string;
      quoteNo?: string;
      tag?: string;
      fromDate?: string;
      toDate?: string;
      page?: number;
      pageSize?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(
        `${API_BASE_URL}/Quotation/search?${queryParams}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: AUTH_TOKEN,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as PagedResponse;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to search quotations"
      );
    }
  }
);

// Update the state interface
interface CustomerState {
  customers: Customer[];
  currentCustomer: Customer | null;
  regularProposals: Proposal[];
  traditionalProposals: Proposal[];
  regularQuotations: Quotation[];
  traditionalQuotations: Quotation[];
  groupLifeQuotations: Quotation[];
  searchedQuotations: Quotation[];
  pagedRegularProposals: PagedResponse | null;
  pagedTraditionalProposals: PagedResponse | null;
  pagedRegularQuotations: PagedResponse | null;
  pagedTraditionalQuotations: PagedResponse | null;
  pagedGroupLifeQuotations: PagedResponse | null;
  // Payment state
  payment: {
    initializedPayment: InitializePaymentResponse | null;
    verifiedPayment: VerifyPaymentResponse | null;
  };
  loading: {
    getAllCustomers: boolean;
    getCustomer: boolean;
    createCustomer: boolean;
    updateCustomer: boolean;
    deleteCustomer: boolean;
    // Payment loading states
    initializePayment: boolean;
    verifyPayment: boolean;
    getRegularProposalsByInsuredId: boolean;
    getTraditionalProposalsByInsuredId: boolean;
    getRegularQuotationsByInsuredId: boolean;
    getRegularQuotationsPaged: boolean;
    getTraditionalQuotationsByInsuredId: boolean;
    getTraditionalQuotationsPaged: boolean;
    getGroupLifeQuotationsByInsuredId: boolean;
    getGroupLifeQuotationsPaged: boolean;
    searchQuotations: boolean;
  };
  error: {
    getAllCustomers: string | null;
    getCustomer: string | null;
    createCustomer: string | null;
    updateCustomer: string | null;
    deleteCustomer: string | null;
    // Payment error states
    initializePayment: string | null;
    verifyPayment: string | null;
    getRegularProposalsByInsuredId: string | null;
    getTraditionalProposalsByInsuredId: string | null;
    getRegularQuotationsByInsuredId: string | null;
    getRegularQuotationsPaged: string | null;
    getTraditionalQuotationsByInsuredId: string | null;
    getTraditionalQuotationsPaged: string | null;
    getGroupLifeQuotationsByInsuredId: string | null;
    getGroupLifeQuotationsPaged: string | null;
    searchQuotations: string | null;
  };
  success: {
    createCustomer: boolean;
    updateCustomer: boolean;
    deleteCustomer: boolean;
    // Payment success states
    initializePayment: boolean;
    verifyPayment: boolean;
  };
}

const initialState: CustomerState = {
  customers: [],
  currentCustomer: null,
  pagination: {
    pageNumber: 1,
    pageSize: 20,
    totalRecords: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  regularProposals: [],
  traditionalProposals: [],
  regularQuotations: [],
  traditionalQuotations: [],
  groupLifeQuotations: [],
  searchedQuotations: [],
  pagedRegularProposals: null,
  pagedTraditionalProposals: null,
  pagedRegularQuotations: null,
  pagedTraditionalQuotations: null,
  pagedGroupLifeQuotations: null,
  // Payment initial state
  payment: {
    initializedPayment: null,
    verifiedPayment: null,
  },
  loading: {
    getAllCustomers: false,
    getCustomer: false,
    createCustomer: false,
    updateCustomer: false,
    deleteCustomer: false,
    // Payment loading initial state
    initializePayment: false,
    verifyPayment: false,
    getRegularProposalsByInsuredId: false,
    getTraditionalProposalsByInsuredId: false,
    getRegularQuotationsByInsuredId: false,
    getRegularQuotationsPaged: false,
    getTraditionalQuotationsByInsuredId: false,
    getTraditionalQuotationsPaged: false,
    getGroupLifeQuotationsByInsuredId: false,
    getGroupLifeQuotationsPaged: false,
    searchQuotations: false,
  },
  error: {
    getAllCustomers: null,
    getCustomer: null,
    createCustomer: null,
    updateCustomer: null,
    deleteCustomer: null,
    // Payment error initial state
    initializePayment: null,
    verifyPayment: null,
    getRegularProposalsByInsuredId: null,
    getTraditionalProposalsByInsuredId: null,
    getRegularQuotationsByInsuredId: null,
    getRegularQuotationsPaged: null,
    getTraditionalQuotationsByInsuredId: null,
    getTraditionalQuotationsPaged: null,
    getGroupLifeQuotationsByInsuredId: null,
    getGroupLifeQuotationsPaged: null,
    searchQuotations: null,
  },
  success: {
    createCustomer: false,
    updateCustomer: false,
    deleteCustomer: false,
    // Payment success initial state
    initializePayment: false,
    verifyPayment: false,
  },
};

const customerSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {
    setCurrentCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.currentCustomer = action.payload;
    },
    clearMessages: (state) => {
      // Clear all errors
      Object.keys(state.error).forEach((key) => {
        state.error[key as keyof typeof state.error] = null;
      });
      // Clear success states
      Object.keys(state.success).forEach((key) => {
        state.success[key as keyof typeof state.success] = false;
      });
    },
    clearProposals: (state) => {
      state.regularProposals = [];
      state.traditionalProposals = [];
      state.pagedRegularProposals = null;
      state.pagedTraditionalProposals = null;
    },
    clearQuotations: (state) => {
      state.regularQuotations = [];
      state.traditionalQuotations = [];
      state.groupLifeQuotations = [];
      state.searchedQuotations = [];
      state.pagedRegularQuotations = null;
      state.pagedTraditionalQuotations = null;
      state.pagedGroupLifeQuotations = null;
    },
    // Payment reducers
    clearPayment: (state) => {
      state.payment.initializedPayment = null;
      state.payment.verifiedPayment = null;
      state.loading.initializePayment = false;
      state.loading.verifyPayment = false;
      state.error.initializePayment = null;
      state.error.verifyPayment = null;
      state.success.initializePayment = false;
      state.success.verifyPayment = false;
    },
  },
  extraReducers: (builder) => {
    // Get all customers
    builder
      .addCase(getAllCustomers.pending, (state) => {
        state.loading.getAllCustomers = true;
        state.error.getAllCustomers = null;
      })
      .addCase(getAllCustomers.fulfilled, (state, action) => {
        state.loading.getAllCustomers = false;
        if (action.payload && Array.isArray(action.payload.data)) {
          state.customers = action.payload.data;
          state.pagination = {
            pageNumber: action.payload.pageNumber || 1,
            pageSize: action.payload.pageSize || 20,
            totalRecords: action.payload.totalRecords || action.payload.data.length,
            totalPages: action.payload.totalPages || 1,
            hasNextPage: action.payload.hasNextPage ?? false,
            hasPreviousPage: action.payload.hasPreviousPage ?? false,
          };
        } else if (Array.isArray(action.payload)) {
          state.customers = action.payload;
          state.pagination = {
            pageNumber: 1,
            pageSize: action.payload.length || 20,
            totalRecords: action.payload.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          };
        }
      })
      .addCase(getAllCustomers.rejected, (state, action) => {
        state.loading.getAllCustomers = false;
        state.error.getAllCustomers = action.payload as string;
      });

    // Get single customer (by insuredID)
    builder
      .addCase(getCustomer.pending, (state) => {
        state.loading.getCustomer = true;
        state.error.getCustomer = null;
      })
      .addCase(getCustomer.fulfilled, (state, action) => {
        state.loading.getCustomer = false;
        state.currentCustomer = action.payload;
      })
      .addCase(getCustomer.rejected, (state, action) => {
        state.loading.getCustomer = false;
        state.error.getCustomer = action.payload as string;
      });

    // Create customer
    builder
      .addCase(createCustomer.pending, (state) => {
        state.loading.createCustomer = true;
        state.error.createCustomer = null;
        state.success.createCustomer = false;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.loading.createCustomer = false;
        state.success.createCustomer = true;
        state.customers.unshift(action.payload);
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.loading.createCustomer = false;
        state.error.createCustomer = action.payload as string;
      });

    // Update customer
    builder
      .addCase(updateCustomer.pending, (state) => {
        state.loading.updateCustomer = true;
        state.error.updateCustomer = null;
        state.success.updateCustomer = false;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.loading.updateCustomer = false;
        state.success.updateCustomer = true;
        const targetId = action.payload.customerID;
        const index = state.customers.findIndex(
          (c) => c.insuredID === targetId || c.customerID === targetId
        );
        if (index !== -1) {
          state.customers[index] = { ...state.customers[index], ...action.payload.customerData };
        }
        if (state.currentCustomer && (state.currentCustomer.insuredID === targetId || state.currentCustomer.customerID === targetId)) {
          state.currentCustomer = { ...state.currentCustomer, ...action.payload.customerData };
        }
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.loading.updateCustomer = false;
        state.error.updateCustomer = action.payload as string;
      });

    // Delete customer
    builder
      .addCase(deleteCustomer.pending, (state) => {
        state.loading.deleteCustomer = true;
        state.error.deleteCustomer = null;
        state.success.deleteCustomer = false;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.loading.deleteCustomer = false;
        state.success.deleteCustomer = true;
        state.customers = state.customers.filter(
          (c) => c.insuredID !== action.payload
        );
        if (state.currentCustomer?.insuredID === action.payload) {
          state.currentCustomer = null;
        }
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.loading.deleteCustomer = false;
        state.error.deleteCustomer = action.payload as string;
      });

    // Payment reducers
    // Initialize payment
    builder
      .addCase(initializePayment.pending, (state) => {
        state.loading.initializePayment = true;
        state.error.initializePayment = null;
        state.success.initializePayment = false;
      })
      .addCase(initializePayment.fulfilled, (state, action) => {
        state.loading.initializePayment = false;
        state.success.initializePayment = true;
        state.payment.initializedPayment = action.payload;
      })
      .addCase(initializePayment.rejected, (state, action) => {
        state.loading.initializePayment = false;
        state.error.initializePayment = action.payload as string;
      });

    // Verify payment
    builder
      .addCase(verifyPayment.pending, (state) => {
        state.loading.verifyPayment = true;
        state.error.verifyPayment = null;
        state.success.verifyPayment = false;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading.verifyPayment = false;
        state.success.verifyPayment = true;
        state.payment.verifiedPayment = action.payload;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading.verifyPayment = false;
        state.error.verifyPayment = action.payload as string;
      });

    // Get regular proposals by insured ID
    builder
      .addCase(getRegularProposalsByInsuredId.pending, (state) => {
        state.loading.getRegularProposalsByInsuredId = true;
        state.error.getRegularProposalsByInsuredId = null;
      })
      .addCase(getRegularProposalsByInsuredId.fulfilled, (state, action) => {
        state.loading.getRegularProposalsByInsuredId = false;
        state.regularProposals = action.payload.data || [];
      })
      .addCase(getRegularProposalsByInsuredId.rejected, (state, action) => {
        state.loading.getRegularProposalsByInsuredId = false;
        state.error.getRegularProposalsByInsuredId = action.payload as string;
      });

    // Get traditional proposals by insured ID
    builder
      .addCase(getTraditionalProposalsByInsuredId.pending, (state) => {
        state.loading.getTraditionalProposalsByInsuredId = true;
        state.error.getTraditionalProposalsByInsuredId = null;
      })
      .addCase(
        getTraditionalProposalsByInsuredId.fulfilled,
        (state, action) => {
          state.loading.getTraditionalProposalsByInsuredId = false;
          state.traditionalProposals = action.payload.data || [];
        }
      )
      .addCase(getTraditionalProposalsByInsuredId.rejected, (state, action) => {
        state.loading.getTraditionalProposalsByInsuredId = false;
        state.error.getTraditionalProposalsByInsuredId =
          action.payload as string;
      });

    // QUOTATION BUILDERS
    // Get regular quotations by insured ID
    builder
      .addCase(getRegularQuotationsByInsuredId.pending, (state) => {
        state.loading.getRegularQuotationsByInsuredId = true;
        state.error.getRegularQuotationsByInsuredId = null;
      })
      .addCase(getRegularQuotationsByInsuredId.fulfilled, (state, action) => {
        state.loading.getRegularQuotationsByInsuredId = false;
        state.regularQuotations = action.payload.data || [];
      })
      .addCase(getRegularQuotationsByInsuredId.rejected, (state, action) => {
        state.loading.getRegularQuotationsByInsuredId = false;
        state.error.getRegularQuotationsByInsuredId = action.payload as string;
      });

    // Get regular quotations paged
    builder
      .addCase(getRegularQuotationsPaged.pending, (state) => {
        state.loading.getRegularQuotationsPaged = true;
        state.error.getRegularQuotationsPaged = null;
      })
      .addCase(getRegularQuotationsPaged.fulfilled, (state, action) => {
        state.loading.getRegularQuotationsPaged = false;
        state.pagedRegularQuotations = action.payload;
      })
      .addCase(getRegularQuotationsPaged.rejected, (state, action) => {
        state.loading.getRegularQuotationsPaged = false;
        state.error.getRegularQuotationsPaged = action.payload as string;
      });

    // Get traditional quotations by insured ID
    builder
      .addCase(getTraditionalQuotationsByInsuredId.pending, (state) => {
        state.loading.getTraditionalQuotationsByInsuredId = true;
        state.error.getTraditionalQuotationsByInsuredId = null;
      })
      .addCase(
        getTraditionalQuotationsByInsuredId.fulfilled,
        (state, action) => {
          state.loading.getTraditionalQuotationsByInsuredId = false;
          state.traditionalQuotations = action.payload.data || [];
        }
      )
      .addCase(
        getTraditionalQuotationsByInsuredId.rejected,
        (state, action) => {
          state.loading.getTraditionalQuotationsByInsuredId = false;
          state.error.getTraditionalQuotationsByInsuredId =
            action.payload as string;
        }
      );

    // Get traditional quotations paged
    builder
      .addCase(getTraditionalQuotationsPaged.pending, (state) => {
        state.loading.getTraditionalQuotationsPaged = true;
        state.error.getTraditionalQuotationsPaged = null;
      })
      .addCase(getTraditionalQuotationsPaged.fulfilled, (state, action) => {
        state.loading.getTraditionalQuotationsPaged = false;
        state.pagedTraditionalQuotations = action.payload;
      })
      .addCase(getTraditionalQuotationsPaged.rejected, (state, action) => {
        state.loading.getTraditionalQuotationsPaged = false;
        state.error.getTraditionalQuotationsPaged = action.payload as string;
      });

    // Get group life quotations by insured ID
    builder
      .addCase(getGroupLifeQuotationsByInsuredId.pending, (state) => {
        state.loading.getGroupLifeQuotationsByInsuredId = true;
        state.error.getGroupLifeQuotationsByInsuredId = null;
      })
      .addCase(getGroupLifeQuotationsByInsuredId.fulfilled, (state, action) => {
        state.loading.getGroupLifeQuotationsByInsuredId = false;
        state.groupLifeQuotations = action.payload.data || [];
      })
      .addCase(getGroupLifeQuotationsByInsuredId.rejected, (state, action) => {
        state.loading.getGroupLifeQuotationsByInsuredId = false;
        state.error.getGroupLifeQuotationsByInsuredId =
          action.payload as string;
      });

    // Get group life quotations paged
    builder
      .addCase(getGroupLifeQuotationsPaged.pending, (state) => {
        state.loading.getGroupLifeQuotationsPaged = true;
        state.error.getGroupLifeQuotationsPaged = null;
      })
      .addCase(getGroupLifeQuotationsPaged.fulfilled, (state, action) => {
        state.loading.getGroupLifeQuotationsPaged = false;
        state.pagedGroupLifeQuotations = action.payload;
      })
      .addCase(getGroupLifeQuotationsPaged.rejected, (state, action) => {
        state.loading.getGroupLifeQuotationsPaged = false;
        state.error.getGroupLifeQuotationsPaged = action.payload as string;
      });

    // Search quotations
    builder
      .addCase(searchQuotations.pending, (state) => {
        state.loading.searchQuotations = true;
        state.error.searchQuotations = null;
      })
      .addCase(searchQuotations.fulfilled, (state, action) => {
        state.loading.searchQuotations = false;
        state.searchedQuotations = action.payload.data || [];
      })
      .addCase(searchQuotations.rejected, (state, action) => {
        state.loading.searchQuotations = false;
        state.error.searchQuotations = action.payload as string;
      });
  },
});

export const {
  setCurrentCustomer,
  clearMessages,
  clearProposals,
  clearQuotations,
  clearPayment, // Export the new clearPayment action
} = customerSlice.actions;

export const selectCustomers = (state: RootState) => state.customers;

export default customerSlice.reducer;
