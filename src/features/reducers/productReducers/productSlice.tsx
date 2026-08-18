//@ts-nocheck

import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { SERVER_URL } from "../../../utils/constants";

// ==================== TYPES ====================

export interface Product {
  riskID: string;
  productID: string;
  productName: string;
  productType: string | null;
  description: string;
}

export interface ProductDetail {
  productID: string;
  min_Age: number;
  max_Age: number;
  min_Duration: number;
  max_Duration: number;
  min_Contribution: number;
  max_Contribution: number;
  rateDiv_factor: number;
  min_SA: number;
  max_SA: number;
  multiplier: string;
  a1: number;
  a2: number;
  remarks: string;
  tag: string;
}

export interface UpdateProductTypeRequest {
  type: string;
  modifiedBy: string;
}

export interface ProductFilters {
  searchText?: string;
  dateFrom?: string;
  dateTo?: string;
  pageNo?: number;
  pageSize?: number;
}

export interface ProductListResponse {
  items: Product[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// ==================== RISKS TYPES ====================

export interface Risk {
  riskID: string;
  riskName: string;
  description: string;
}

export interface RisksListResponse {
  items: Risk[];
  page: number;
  pageSize: number;
  pageNumber: number;
  totalCount: number;
  totalPages: number;
}

export interface RisksFilters {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

// ==================== PRODUCTS STATE ====================

export interface ProductsState {
  products: Product[];
  currentProduct: Product | null;
  currentProductDetail: ProductDetail | null;
  totalCount: number;
  totalPages: number;
  // Risks state
  risks: Risk[];
  risksTotalCount: number;
  risksTotalPages: number;
  loading: {
    list: boolean;
    detail: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    updateType: boolean;
    risks: boolean;
  };
  error: {
    list: string | null;
    detail: string | null;
    create: string | null;
    update: string | null;
    delete: string | null;
    updateType: string | null;
    risks: string | null;
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

// ==================== INITIAL STATE ====================

const initialState: ProductsState = {
  products: [],
  currentProduct: null,
  currentProductDetail: null,
  totalCount: 0,
  totalPages: 0,
  // Risks state
  risks: [],
  risksTotalCount: 0,
  risksTotalPages: 0,
  loading: {
    list: false,
    detail: false,
    create: false,
    update: false,
    delete: false,
    updateType: false,
    risks: false,
  },
  error: {
    list: null,
    detail: null,
    create: null,
    update: null,
    delete: null,
    updateType: null,
    risks: null,
  },
};

// ==================== API CALLS ====================

// GET /api/v1/Products - Fetch a collection of products
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (filters: ProductFilters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.searchText) queryParams.append('SearchText', filters.searchText);
      if (filters.dateFrom) queryParams.append('DateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('DateTo', filters.dateTo);
      if (filters.pageNo) queryParams.append('PageNo', String(filters.pageNo));
      if (filters.pageSize) queryParams.append('PageSize', String(filters.pageSize));

      const queryString = queryParams.toString();
      const url = `${SERVER_URL}/v1/Products${queryString ? `?${queryString}` : ''}`;

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

      const data = await response.json();
      
      // The API returns an array directly, not a paginated response
      // We'll wrap it in a consistent format
      return {
        items: data as Product[],
        totalCount: data.length,
        page: filters.pageNo || 1,
        pageSize: filters.pageSize || data.length,
        totalPages: 1,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch products");
    }
  }
);

// GET /api/v1/Products/{productId} - Fetch a single product
export const fetchProductById = createAsyncThunk(
  "products/fetchProductById",
  async (productId: string, { rejectWithValue }) => {
    try {
      if (!productId) {
        throw new Error("Product ID is required");
      }

      const response = await fetch(
        `${SERVER_URL}/v1/Products/${encodeURIComponent(productId)}`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

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

      const data = await response.json();
      return data as Product;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch product");
    }
  }
);

// GET /api/v1/Products/{code} - Fetch product by code
export const fetchProductByCode = createAsyncThunk(
  "products/fetchProductByCode",
  async (code: string, { rejectWithValue }) => {
    try {
      if (!code) {
        throw new Error("Product code is required");
      }

      const response = await fetch(
        `${SERVER_URL}/v1/Products/${encodeURIComponent(code)}`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

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

      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch product by code");
    }
  }
);

// POST /api/v1/Products - Create a new product
export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (productData: Partial<ProductDetail>, { rejectWithValue }) => {
    try {
      const response = await fetch(`${SERVER_URL}/v1/Products`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(productData),
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
      return rejectWithValue(error.message || "Failed to create product");
    }
  }
);

// PUT /api/v1/Products/{id} - Update a product
export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async (
    { id, productData }: { id: string; productData: Partial<ProductDetail> },
    { rejectWithValue }
  ) => {
    try {
      if (!id) {
        throw new Error("Product ID is required");
      }

      const response = await fetch(
        `${SERVER_URL}/v1/Products/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(productData),
        }
      );

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
      return rejectWithValue(error.message || "Failed to update product");
    }
  }
);

// DELETE /api/v1/Products/{id} - Delete a product
export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (id: string, { rejectWithValue }) => {
    try {
      if (!id) {
        throw new Error("Product ID is required");
      }

      const response = await fetch(
        `${SERVER_URL}/v1/Products/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

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

      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete product");
    }
  }
);

// PATCH /api/v1/Products/{subRiskId}/Type - Update product type
export const updateProductType = createAsyncThunk(
  "products/updateProductType",
  async (
    { subRiskId, typeData }: { subRiskId: string; typeData: UpdateProductTypeRequest },
    { rejectWithValue }
  ) => {
    try {
      if (!subRiskId) {
        throw new Error("SubRisk ID is required");
      }

      const response = await fetch(
        `${SERVER_URL}/v1/Products/${encodeURIComponent(subRiskId)}/Type`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify(typeData),
        }
      );

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

      // 204 No Content - return the subRiskId to identify which product was updated
      return { subRiskId, typeData };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update product type");
    }
  }
);

// ==================== RISKS API CALLS ====================

// GET /api/v1/Risks/List - Fetch all risks
export const fetchRisks = createAsyncThunk(
  "products/fetchRisks",
  async (filters: RisksFilters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.append('Search', filters.search);
      if (filters.pageNumber) queryParams.append('PageNumber', String(filters.pageNumber));
      if (filters.pageSize) queryParams.append('PageSize', String(filters.pageSize));

      const queryString = queryParams.toString();
      const url = `${SERVER_URL}/v1/Risks/List${queryString ? `?${queryString}` : ''}`;

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

      const data = await response.json();
      
      return {
        items: data.items || [],
        page: data.page || 0,
        pageSize: data.pageSize || 20,
        pageNumber: data.pageNumber || 1,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 0,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch risks");
    }
  }
);

// GET /api/v1/Risks/{riskId} - Fetch a single risk
export const fetchRiskById = createAsyncThunk(
  "products/fetchRiskById",
  async (riskId: string, { rejectWithValue }) => {
    try {
      if (!riskId) {
        throw new Error("Risk ID is required");
      }

      const response = await fetch(
        `${SERVER_URL}/v1/Risks/${encodeURIComponent(riskId)}`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

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

      const data = await response.json();
      return data as Risk;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch risk");
    }
  }
);

// ==================== SLICE ====================

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setCurrentProduct: (state, action: PayloadAction<Product | null>) => {
      state.currentProduct = action.payload;
    },
    setCurrentProductDetail: (state, action: PayloadAction<ProductDetail | null>) => {
      state.currentProductDetail = action.payload;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
      state.currentProductDetail = null;
    },
    clearErrors: (state) => {
      state.error = initialState.error;
    },
    clearMessages: (state) => {
      state.error = initialState.error;
    },
    clearProducts: (state) => {
      state.products = [];
      state.totalCount = 0;
      state.totalPages = 0;
    },
    clearRisks: (state) => {
      state.risks = [];
      state.risksTotalCount = 0;
      state.risksTotalPages = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products List
      .addCase(fetchProducts.pending, (state) => {
        state.loading.list = true;
        state.error.list = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading.list = false;
        state.products = action.payload.items || [];
        state.totalCount = action.payload.totalCount || 0;
        state.totalPages = action.payload.totalPages || 0;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading.list = false;
        state.error.list = action.payload as string;
      })

      // Fetch Product by ID
      .addCase(fetchProductById.pending, (state) => {
        state.loading.detail = true;
        state.error.detail = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading.detail = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading.detail = false;
        state.error.detail = action.payload as string;
      })

      // Fetch Product by Code
      .addCase(fetchProductByCode.pending, (state) => {
        state.loading.detail = true;
        state.error.detail = null;
      })
      .addCase(fetchProductByCode.fulfilled, (state, action) => {
        state.loading.detail = false;
        state.currentProductDetail = action.payload;
      })
      .addCase(fetchProductByCode.rejected, (state, action) => {
        state.loading.detail = false;
        state.error.detail = action.payload as string;
      })

      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.loading.create = true;
        state.error.create = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading.create = false;
        const product = action.payload;
        state.products.unshift(product);
        state.currentProduct = product;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading.create = false;
        state.error.create = action.payload as string;
      })

      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.loading.update = true;
        state.error.update = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading.update = false;
        const updated = action.payload;
        const index = state.products.findIndex(
          (p) => p.productID === updated.productID
        );
        if (index !== -1) {
          state.products[index] = updated;
        }
        state.currentProduct = updated;
        state.currentProductDetail = updated;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading.update = false;
        state.error.update = action.payload as string;
      })

      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.loading.delete = true;
        state.error.delete = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading.delete = false;
        const productId = action.payload;
        state.products = state.products.filter(
          (p) => p.productID !== productId && p.riskID !== productId
        );
        if (state.currentProduct?.productID === productId) {
          state.currentProduct = null;
        }
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading.delete = false;
        state.error.delete = action.payload as string;
      })

      // Update Product Type (PATCH)
      .addCase(updateProductType.pending, (state) => {
        state.loading.updateType = true;
        state.error.updateType = null;
      })
      .addCase(updateProductType.fulfilled, (state, action) => {
        state.loading.updateType = false;
        const { subRiskId, typeData } = action.payload;
        // Find and update the product in the list
        const index = state.products.findIndex(
          (p) => p.riskID === subRiskId
        );
        if (index !== -1) {
          state.products[index] = {
            ...state.products[index],
            productType: typeData.type,
          };
        }
        // If this is the current product, update it too
        if (state.currentProduct?.riskID === subRiskId) {
          state.currentProduct = {
            ...state.currentProduct,
            productType: typeData.type,
          };
        }
      })
      .addCase(updateProductType.rejected, (state, action) => {
        state.loading.updateType = false;
        state.error.updateType = action.payload as string;
      })

      // ==================== RISKS REDUCERS ====================
      
      // Fetch Risks List
      .addCase(fetchRisks.pending, (state) => {
        state.loading.risks = true;
        state.error.risks = null;
      })
      .addCase(fetchRisks.fulfilled, (state, action) => {
        state.loading.risks = false;
        state.risks = action.payload.items || [];
        state.risksTotalCount = action.payload.totalCount || 0;
        state.risksTotalPages = action.payload.totalPages || 0;
      })
      .addCase(fetchRisks.rejected, (state, action) => {
        state.loading.risks = false;
        state.error.risks = action.payload as string;
      })
      
      // Fetch Risk by ID
      .addCase(fetchRiskById.pending, (state) => {
        state.loading.risks = true;
        state.error.risks = null;
      })
      .addCase(fetchRiskById.fulfilled, (state, action) => {
        state.loading.risks = false;
        // Add or update the risk in the list
        const risk = action.payload;
        const index = state.risks.findIndex(r => r.riskID === risk.riskID);
        if (index !== -1) {
          state.risks[index] = risk;
        } else {
          state.risks.push(risk);
        }
      })
      .addCase(fetchRiskById.rejected, (state, action) => {
        state.loading.risks = false;
        state.error.risks = action.payload as string;
      });
  },
});

// ==================== EXPORTS ====================

export const {
  setCurrentProduct,
  setCurrentProductDetail,
  clearCurrentProduct,
  clearErrors,
  clearProducts,
  clearMessages,
  clearRisks,
} = productSlice.actions;

// ==================== SELECTORS ====================

// Products selectors
export const selectProducts = (state: { products: ProductsState }) => state.products;

export const selectProductsList = (state: { products: ProductsState }) => ({
  products: state.products.products,
  totalCount: state.products.totalCount,
  totalPages: state.products.totalPages,
  loading: state.products.loading.list,
  error: state.products.error.list,
});

export const selectCurrentProduct = (state: { products: ProductsState }) => ({
  currentProduct: state.products.currentProduct,
  currentProductDetail: state.products.currentProductDetail,
  loading: state.products.loading.detail,
  error: state.products.error.detail,
});

// Risks selectors
export const selectRisks = (state: { products: ProductsState }) => ({
  risks: state.products.risks,
  totalCount: state.products.risksTotalCount,
  totalPages: state.products.risksTotalPages,
  loading: state.products.loading.risks,
  error: state.products.error.risks,
});

export const selectRisksList = (state: { products: ProductsState }) => ({
  risks: state.products.risks,
  totalCount: state.products.risksTotalCount,
  totalPages: state.products.risksTotalPages,
  loading: state.products.loading.risks,
  error: state.products.error.risks,
});

export default productSlice.reducer;