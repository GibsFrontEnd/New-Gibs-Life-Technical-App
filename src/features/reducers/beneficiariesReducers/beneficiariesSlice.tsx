//@ts-nocheck

import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import apiCall from "../../../utils/api-call";
import type { BeneficiaryFormData } from "../../../types/beneficiaries";

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
  photoBase64: string;
  hasPhoto: boolean;
  //   policyNo: string;
  address: string;
  remark: string;
  tag: string;
  deleted: number;
  active: number;
  submittedBy: string;
  submittedOn: string;
  modifiedBy: string;
  modifiedOn: string;
}

export interface BeneficiaryState {
  beneficiaries: {
    items: Beneficiary[];
    page: number;
    pageSize: number;
    totalCount: number;
  };
  beneficiary: Beneficiary | null;
  loading: {
    getBeneficiaries: boolean;
    getBeneficiary: boolean;
    createBeneficiary: boolean;
    updateBeneficiary: boolean;
    deleteBeneficiary: boolean;
    getBeneficiariesByPolicy: boolean;
    getBeneficiariesByProposal: boolean;
  };
  error: {
    getBeneficiaries: string | null;
    getBeneficiary: string | null;
    createBeneficiary: string | null;
    updateBeneficiary: string | null;
    deleteBeneficiary: string | null;
    getBeneficiariesByPolicy: string | null;
    getBeneficiariesByProposal: string | null;
  };
  success: {
    createBeneficiary: boolean;
    updateBeneficiary: boolean;
    deleteBeneficiary: boolean;
  };
}

export interface GetBeneficiariesQuery {
  page: number;
  pageSize: number;
  policyNo?: string | null;
  proposalNo?: string | null;
  surname?: string | null;
}

export interface CreateBeneficiaryPayload {
  formData: any; // Allow the pre-formatted API payload
  policyNo?: string;
  proposalNo?: string;
}

export interface UpdateBeneficiaryPayload {
  id: number;
  formData: Partial<BeneficiaryFormData>;
}

// Get all beneficiaries with pagination and filtering
// Get all beneficiaries with pagination and filtering
export const getBeneficiaries = createAsyncThunk(
  "beneficiaries/getBeneficiaries",
  async (
    { page, pageSize, policyNo, proposalNo, surname }: GetBeneficiariesQuery,
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams({
        pageNumber: page.toString(),
        pageSize: pageSize.toString(),
      });

      // Add optional filters
      if (policyNo) params.append("policyNo", policyNo);
      if (proposalNo) params.append("proposalNo", proposalNo);
      if (surname) params.append("surname", surname);

      console.log("📡 Fetching beneficiaries with params:", params.toString());

      const response = await apiCall.get(`/Beneficiaries?${params.toString()}`);

      console.log("✅ API Response:", response.data);

      // The API returns { data: [], pageNumber, pageSize, totalCount, totalPages }
      // Extract the nested data array and pagination info
      const apiData = response.data;

      return {
        items: apiData.data || [], // Extract the nested array
        page: apiData.pageNumber || page,
        pageSize: apiData.pageSize || pageSize,
        totalCount: apiData.totalCount || 0,
      };
    } catch (error: any) {
      console.error("❌ Error fetching beneficiaries:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch beneficiaries"
      );
    }
  }
);

// Get beneficiary by ID
export const getBeneficiary = createAsyncThunk(
  "beneficiaries/getBeneficiary",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/Beneficiaries/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch beneficiary"
      );
    }
  }
);

// Create new beneficiary - FIXED VERSION with correct field names
export const createBeneficiary = createAsyncThunk(
  "beneficiaries/createBeneficiary",
  async (
    { formData, policyNo, proposalNo }: CreateBeneficiaryPayload,
    { rejectWithValue }
  ) => {
    try {
      const formDataToSend = new FormData();

      // The formData is now pre-formatted by the component to match API expectations
      // We just need to append it to the FormData object
      console.log("📦 Raw formData received:", formData);

      Object.entries(formData).forEach(([key, value]) => {
        // Convert all values to strings except for Files
        if (value === null || value === undefined) {
          formDataToSend.append(key, "");
        } else if (key === "Photo" && value === null) {
          // Skip null photo field if we have PhotoBase64, or send empty string
          formDataToSend.append(key, "");
        } else if (value instanceof File) {
          formDataToSend.append(key, value);
        } else {
          // Ensure all other values are converted to string
          formDataToSend.append(key, String(value));
        }
      });

      // Debug: Log all form data being sent
      console.log("📤 Sending beneficiary data to API:");
      for (let [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      // Make the API call
      const response = await apiCall.post(
        "/Beneficiaries", // Note: Added /api prefix to match your other endpoints
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000, // 30 second timeout for file uploads
        }
      );

      console.log("✅ Beneficiary created successfully:", response.data);
      return response.data;
    } catch (error: any) {
      // Enhanced error handling
      let errorMessage = "Failed to create beneficiary";

      if (error.response?.data) {
        // Handle different error response formats
        if (error.response.data.errors) {
          // Validation errors from API
          const validationErrors = error.response.data.errors;
          errorMessage = Object.entries(validationErrors)
            .map(
              ([field, messages]) =>
                `${field}: ${(messages as string[]).join(", ")}`
            )
            .join("; ");
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.title) {
          errorMessage = error.response.data.title;
        } else if (typeof error.response.data === "string") {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error("❌ Error creating beneficiary:", {
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data,
      });

      return rejectWithValue(errorMessage);
    }
  }
);

// Update beneficiary
export const updateBeneficiary = createAsyncThunk(
  "beneficiaries/updateBeneficiary",
  async ({ id, formData }: UpdateBeneficiaryPayload, { rejectWithValue }) => {
    try {
      const formDataToSend = new FormData();

      // Append updated fields
      if (formData.surname) formDataToSend.append("Surname", formData.surname);
      if (formData.otherNames)
        formDataToSend.append("OtherNames", formData.otherNames);
      if (formData.address) formDataToSend.append("Address", formData.address);
      if (formData.sex) formDataToSend.append("Sex", formData.sex);
      if (formData.relationship)
        formDataToSend.append("Relation", formData.relationship);
      if (formData.percentage)
        formDataToSend.append("Percentage", formData.percentage.toString());
      if (formData.beneficiaryType)
        formDataToSend.append("Type", formData.beneficiaryType);

      if (formData.dateOfBirth) {
        const dob = new Date(formData.dateOfBirth);
        const dobString = dob.toISOString().split("T")[0];
        if (dobString) {
          formDataToSend.append("DOB", dobString);
        }
      }

      if (formData.age) formDataToSend.append("Age", formData.age.toString());
      if (formData.photo) formDataToSend.append("Photo", formData.photo);

      const response = await apiCall.put(
        `/Beneficiaries/${id}`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update beneficiary"
      );
    }
  }
);

// Delete beneficiary
export const deleteBeneficiary = createAsyncThunk(
  "beneficiaries/deleteBeneficiary",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiCall.delete(`/Beneficiaries/${id}`);
      return { id, ...response.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete beneficiary"
      );
    }
  }
);

// Get beneficiaries by policy number
export const getBeneficiariesByPolicy = createAsyncThunk(
  "beneficiaries/getBeneficiariesByPolicy",
  async (policyNo: string, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/Beneficiaries/policy/${policyNo}`);

      // Handle both array response and nested data structure
      const beneficiaries = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      return beneficiaries;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch beneficiaries by policy"
      );
    }
  }
);

// Get beneficiaries by proposal number
export const getBeneficiariesByProposal = createAsyncThunk(
  "beneficiaries/getBeneficiariesByProposal",
  async (proposalNo: string, { rejectWithValue }) => {
    try {
      console.log(
        "📤 API Call - Fetching beneficiaries for proposalNo:",
        proposalNo
      );
      console.log("📤 API Call - proposalNo type:", typeof proposalNo);
      console.log(
        "📤 API Call - Full URL will be:",
        `/Beneficiaries/proposal/${proposalNo}`
      );

      const response = await apiCall.get(
        `/Beneficiaries/proposal/${proposalNo}`
      );

      console.log("✅ API Response - Raw response.data:", response.data);

      // Handle both array response and nested data structure
      const beneficiaries = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      console.log("✅ API Response - Processed beneficiaries:", beneficiaries);
      console.log(
        "✅ API Response - Number of beneficiaries:",
        beneficiaries.length
      );

      return beneficiaries;
    } catch (error: any) {
      console.error("❌ API Error - Failed to fetch beneficiaries:", error);
      console.error("❌ API Error - Error response:", error.response?.data);
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch beneficiaries by proposal"
      );
    }
  }
);

const initialState: BeneficiaryState = {
  beneficiaries: {
    items: [],
    page: 1,
    pageSize: 20,
    totalCount: 0,
  },
  beneficiary: null,
  loading: {
    getBeneficiaries: false,
    getBeneficiary: false,
    createBeneficiary: false,
    updateBeneficiary: false,
    deleteBeneficiary: false,
    getBeneficiariesByPolicy: false,
    getBeneficiariesByProposal: false,
  },
  error: {
    getBeneficiaries: null,
    getBeneficiary: null,
    createBeneficiary: null,
    updateBeneficiary: null,
    deleteBeneficiary: null,
    getBeneficiariesByPolicy: null,
    getBeneficiariesByProposal: null,
  },
  success: {
    createBeneficiary: false,
    updateBeneficiary: false,
    deleteBeneficiary: false,
  },
};

const beneficiarySlice = createSlice({
  name: "beneficiaries",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = { ...initialState.error };
      state.success = { ...initialState.success };
    },
    clearBeneficiaries: (state) => {
      state.beneficiaries = {
        items: [],
        page: 1,
        pageSize: 20,
        totalCount: 0,
      };
    },
    clearBeneficiary: (state) => {
      state.beneficiary = null;
    },
    // Reset create success state
    resetCreateSuccess: (state) => {
      state.success.createBeneficiary = false;
    },
    // Reset update success state
    resetUpdateSuccess: (state) => {
      state.success.updateBeneficiary = false;
    },
    // Reset delete success state
    resetDeleteSuccess: (state) => {
      state.success.deleteBeneficiary = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Beneficiaries
      .addCase(getBeneficiaries.pending, (state) => {
        state.loading.getBeneficiaries = true;
        state.error.getBeneficiaries = null;
      })
      .addCase(getBeneficiaries.fulfilled, (state, action) => {
        state.loading.getBeneficiaries = false;
        // Now action.payload has the correct structure: { items, page, pageSize, totalCount }
        state.beneficiaries = action.payload;

        console.log("📊 Updated beneficiaries state:", state.beneficiaries);
      })
      .addCase(getBeneficiaries.rejected, (state, action) => {
        state.loading.getBeneficiaries = false;
        state.error.getBeneficiaries = action.payload as string;
      })

      // Get Beneficiary by ID
      .addCase(getBeneficiary.pending, (state) => {
        state.loading.getBeneficiary = true;
        state.error.getBeneficiary = null;
      })
      .addCase(
        getBeneficiary.fulfilled,
        (state, action: PayloadAction<Beneficiary>) => {
          state.loading.getBeneficiary = false;
          state.beneficiary = action.payload;
        }
      )
      .addCase(getBeneficiary.rejected, (state, action) => {
        state.loading.getBeneficiary = false;
        state.error.getBeneficiary = action.payload as string;
      })

      // Create Beneficiary
      .addCase(createBeneficiary.pending, (state) => {
        state.loading.createBeneficiary = true;
        state.error.createBeneficiary = null;
        state.success.createBeneficiary = false;
      })
      .addCase(createBeneficiary.fulfilled, (state, action) => {
        state.loading.createBeneficiary = false;
        state.success.createBeneficiary = true;
        // Optionally add the new beneficiary to the list
        if (state.beneficiaries.items) {
          state.beneficiaries.items.unshift(action.payload);
          state.beneficiaries.totalCount += 1;
        }
      })
      .addCase(createBeneficiary.rejected, (state, action) => {
        state.loading.createBeneficiary = false;
        state.error.createBeneficiary = action.payload as string;
      })

      // Update Beneficiary
      .addCase(updateBeneficiary.pending, (state) => {
        state.loading.updateBeneficiary = true;
        state.error.updateBeneficiary = null;
        state.success.updateBeneficiary = false;
      })
      .addCase(updateBeneficiary.fulfilled, (state, action) => {
        state.loading.updateBeneficiary = false;
        state.success.updateBeneficiary = true;

        // Update beneficiary in the list if it exists
        if (state.beneficiaries.items) {
          const index = state.beneficiaries.items.findIndex(
            (beneficiary) => beneficiary.transID === action.payload.transID
          );
          if (index !== -1) {
            state.beneficiaries.items[index] = action.payload;
          }
        }

        // Update current beneficiary if it's the one being updated
        if (
          state.beneficiary &&
          state.beneficiary.transID === action.payload.transID
        ) {
          state.beneficiary = action.payload;
        }
      })
      .addCase(updateBeneficiary.rejected, (state, action) => {
        state.loading.updateBeneficiary = false;
        state.error.updateBeneficiary = action.payload as string;
      })

      // Delete Beneficiary
      .addCase(deleteBeneficiary.pending, (state) => {
        state.loading.deleteBeneficiary = true;
        state.error.deleteBeneficiary = null;
        state.success.deleteBeneficiary = false;
      })
      .addCase(deleteBeneficiary.fulfilled, (state, action) => {
        state.loading.deleteBeneficiary = false;
        state.success.deleteBeneficiary = true;

        // Remove beneficiary from the list
        if (state.beneficiaries.items) {
          state.beneficiaries.items = state.beneficiaries.items.filter(
            (beneficiary) => beneficiary.transID !== action.payload.id
          );
          state.beneficiaries.totalCount -= 1;
        }

        // Clear current beneficiary if it's the one being deleted
        if (
          state.beneficiary &&
          state.beneficiary.transID === action.payload.id
        ) {
          state.beneficiary = null;
        }
      })
      .addCase(deleteBeneficiary.rejected, (state, action) => {
        state.loading.deleteBeneficiary = false;
        state.error.deleteBeneficiary = action.payload as string;
      })

      // Get Beneficiaries by Policy
      .addCase(getBeneficiariesByPolicy.pending, (state) => {
        state.loading.getBeneficiariesByPolicy = true;
        state.error.getBeneficiariesByPolicy = null;
      })
      .addCase(getBeneficiariesByPolicy.fulfilled, (state, action) => {
        state.loading.getBeneficiariesByPolicy = false;
        state.beneficiaries.items = action.payload;
        state.beneficiaries.totalCount = action.payload.length;
      })
      .addCase(getBeneficiariesByPolicy.rejected, (state, action) => {
        state.loading.getBeneficiariesByPolicy = false;
        state.error.getBeneficiariesByPolicy = action.payload as string;
      })

      // Get Beneficiaries by Proposal
      .addCase(getBeneficiariesByProposal.pending, (state) => {
        state.loading.getBeneficiariesByProposal = true;
        state.error.getBeneficiariesByProposal = null;
      })
      .addCase(getBeneficiariesByProposal.fulfilled, (state, action) => {
        state.loading.getBeneficiariesByProposal = false;
        state.beneficiaries.items = action.payload;
        state.beneficiaries.totalCount = action.payload.length;
      })
      .addCase(getBeneficiariesByProposal.rejected, (state, action) => {
        state.loading.getBeneficiariesByProposal = false;
        state.error.getBeneficiariesByProposal = action.payload as string;
      });
  },
});

export const selectBeneficiaries = (state: {
  beneficiaries: BeneficiaryState;
}) => state.beneficiaries;

export const {
  clearMessages,
  clearBeneficiaries,
  clearBeneficiary,
  resetCreateSuccess,
  resetUpdateSuccess,
  resetDeleteSuccess,
} = beneficiarySlice.actions;

export default beneficiarySlice.reducer;
