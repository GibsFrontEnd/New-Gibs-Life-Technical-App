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

// ==================== PRODUCT SETTINGS TYPES ====================

export interface ProductSetting {
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

export interface ProductSettingsResponse {
  items: ProductSetting[];
  page: number;
  pageSize: number;
  pageNumber: number;
  totalCount: number;
  totalPages: number;
}

// ==================== PRODUCT SECTION TYPES ====================

export interface ProductSection {
  sectionID: number;
  sectionCode: string;
  subRiskID: string;
  sectionName: string;
  subRiskName: string;
  field1: string;
  field2: string;
  rates: number;
  a1: number;
  a2: number;
  a3: number;
  a4: number;
  a5: number;
  active: number;
  submittedBy: string;
  submittedOn: string;
  modifiedBy: string;
  modifiedOn: string;
}

// ==================== PRODUCT SMI TYPES ====================

export interface ProductSmi {
  sid: number;
  smiCode: string;
  sectionCode: string;
  subRiskID: string;
  smiDetails: string;
  sectionName: string;
  subRiskName: string;
  field1: string;
  field2: string;
  rates: number;
  addSI: number;
  stockItem: number;
  multiplier: number;
  a1: number;
  a2: number;
  a3: number;
  a4: number;
  a5: number;
  active: number;
  submittedBy: string;
  submittedOn: string;
  modifiedBy: string;
  modifiedOn: string;
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
  // Product Settings state
  productSettings: ProductSetting[];
  productSettingsTotalCount: number;
  productSettingsTotalPages: number;
  // Product Sections state
  productSections: ProductSection[];
  currentSection: ProductSection | null;
  // Product SMIs state
  productSmis: ProductSmi[];
  currentSmi: ProductSmi | null;
  loading: {
    list: boolean;
    detail: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    updateType: boolean;
    risks: boolean;
    settings: boolean;
    sections: boolean;
    smis: boolean;
    sectionDetail: boolean;
    smiDetail: boolean;
    sectionCreate: boolean;
    sectionUpdate: boolean;
    sectionDelete: boolean;
    smiCreate: boolean;
    smiUpdate: boolean;
    smiDelete: boolean;
  };
  error: {
    list: string | null;
    detail: string | null;
    create: string | null;
    update: string | null;
    delete: string | null;
    updateType: string | null;
    risks: string | null;
    settings: string | null;
    sections: string | null;
    smis: string | null;
    sectionDetail: string | null;
    smiDetail: string | null;
    sectionCreate: string | null;
    sectionUpdate: string | null;
    sectionDelete: string | null;
    smiCreate: string | null;
    smiUpdate: string | null;
    smiDelete: string | null;
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
  // Product Settings state
  productSettings: [],
  productSettingsTotalCount: 0,
  productSettingsTotalPages: 0,
  // Product Sections state
  productSections: [],
  currentSection: null,
  // Product SMIs state
  productSmis: [],
  currentSmi: null,
  loading: {
    list: false,
    detail: false,
    create: false,
    update: false,
    delete: false,
    updateType: false,
    risks: false,
    settings: false,
    sections: false,
    smis: false,
    sectionDetail: false,
    smiDetail: false,
    sectionCreate: false,
    sectionUpdate: false,
    sectionDelete: false,
    smiCreate: false,
    smiUpdate: false,
    smiDelete: false,
  },
  error: {
    list: null,
    detail: null,
    create: null,
    update: null,
    delete: null,
    updateType: null,
    risks: null,
    settings: null,
    sections: null,
    smis: null,
    sectionDetail: null,
    smiDetail: null,
    sectionCreate: null,
    sectionUpdate: null,
    sectionDelete: null,
    smiCreate: null,
    smiUpdate: null,
    smiDelete: null,
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

// ==================== PRODUCT SETTINGS API CALLS ====================



// GET /api/v1/Products/AllProductSettings - Fetch all product settings
export const fetchProductSettings = createAsyncThunk(
  "products/fetchProductSettings",
  async (search?: string, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('Search', search);

      const queryString = queryParams.toString();
      const url = `${SERVER_URL}/v1/Products/AllProductSettings${queryString ? `?${queryString}` : ''}`;

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
      
      // FIX: The API returns an array directly, not a paginated response with 'items'
      // Return it in a consistent format
      return {
        items: Array.isArray(data) ? data : [],
        totalCount: Array.isArray(data) ? data.length : 0,
        page: 0,
        pageSize: Array.isArray(data) ? data.length : 0,
        pageNumber: 1,
        totalPages: 1,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch product settings");
    }
  }
);

// ==================== PRODUCT SECTIONS API CALLS ====================

// GET /api/v1/Products/AllProductSections - Fetch all product sections
export const fetchProductSections = createAsyncThunk(
  "products/fetchProductSections",
  async (search?: string, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('Search', search);

      const queryString = queryParams.toString();
      const url = `${SERVER_URL}/v1/Products/AllProductSections${queryString ? `?${queryString}` : ''}`;

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
      return data as ProductSection[];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch product sections");
    }
  }
);

// GET /api/v1/Products/{sectionId} - Fetch a section by ID
export const fetchSectionById = createAsyncThunk(
  "products/fetchSectionById",
  async (sectionId: number, { rejectWithValue }) => {
    try {
      if (!sectionId) {
        throw new Error("Section ID is required");
      }

      const response = await fetch(
        `${SERVER_URL}/v1/Products/${sectionId}`,
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
      return data as ProductSection;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch section");
    }
  }
);

// POST /api/v1/Products/ProductNewSection - Create a new section
export const createProductSection = createAsyncThunk(
  "products/createProductSection",
  async (sectionData: Partial<ProductSection>, { rejectWithValue }) => {
    try {
      const response = await fetch(`${SERVER_URL}/v1/Products/ProductNewSection`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(sectionData),
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
      return rejectWithValue(error.message || "Failed to create product section");
    }
  }
);

// PUT /api/v1/Products/ProductUpdateSection - Update a section
export const updateProductSection = createAsyncThunk(
  "products/updateProductSection",
  async (sectionData: Partial<ProductSection>, { rejectWithValue }) => {
    try {
      if (!sectionData.sectionID) {
        throw new Error("Section ID is required");
      }

      const response = await fetch(`${SERVER_URL}/v1/Products/ProductUpdateSection`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(sectionData),
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
      return rejectWithValue(error.message || "Failed to update product section");
    }
  }
);

// DELETE /api/v1/Products/{sectionId} - Delete a section
export const deleteProductSection = createAsyncThunk(
  "products/deleteProductSection",
  async (sectionId: number, { rejectWithValue }) => {
    try {
      if (!sectionId) {
        throw new Error("Section ID is required");
      }

      const response = await fetch(
        `${SERVER_URL}/v1/Products/${sectionId}`,
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

      return sectionId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete product section");
    }
  }
);

// ==================== PRODUCT SMIS API CALLS ====================

// GET /api/v1/Products/AllProductSmis - Fetch all product SMIs
export const fetchProductSmis = createAsyncThunk(
  "products/fetchProductSmis",
  async (search?: string, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('Search', search);

      const queryString = queryParams.toString();
      const url = `${SERVER_URL}/v1/Products/AllProductSmis${queryString ? `?${queryString}` : ''}`;

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
      return data as ProductSmi[];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch product SMIs");
    }
  }
);

// GET /api/v1/Products/{sid} - Fetch a SMI by ID
export const fetchSmiById = createAsyncThunk(
  "products/fetchSmiById",
  async (sid: number, { rejectWithValue }) => {
    try {
      if (!sid) {
        throw new Error("SMI ID is required");
      }

      const response = await fetch(
        `${SERVER_URL}/v1/Products/${sid}`,
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
      return data as ProductSmi;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch SMI");
    }
  }
);

// POST /api/v1/Products/ProductNewSmi - Create a new SMI
export const createProductSmi = createAsyncThunk(
  "products/createProductSmi",
  async (smiData: Partial<ProductSmi>, { rejectWithValue }) => {
    try {
      const response = await fetch(`${SERVER_URL}/v1/Products/ProductNewSmi`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(smiData),
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
      return rejectWithValue(error.message || "Failed to create product SMI");
    }
  }
);

// PUT /api/v1/Products/ProductUpdateSmi - Update a SMI
export const updateProductSmi = createAsyncThunk(
  "products/updateProductSmi",
  async (smiData: Partial<ProductSmi>, { rejectWithValue }) => {
    try {
      if (!smiData.sid) {
        throw new Error("SMI ID is required");
      }

      const response = await fetch(`${SERVER_URL}/v1/Products/ProductUpdateSmi`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(smiData),
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
      return rejectWithValue(error.message || "Failed to update product SMI");
    }
  }
);

// DELETE /api/v1/Products/{sid} - Delete a SMI
export const deleteProductSmi = createAsyncThunk(
  "products/deleteProductSmi",
  async (sid: number, { rejectWithValue }) => {
    try {
      if (!sid) {
        throw new Error("SMI ID is required");
      }

      const response = await fetch(
        `${SERVER_URL}/v1/Products/${sid}`,
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

      return sid;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete product SMI");
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
    clearProductSettings: (state) => {
      state.productSettings = [];
      state.productSettingsTotalCount = 0;
      state.productSettingsTotalPages = 0;
    },
    clearProductSections: (state) => {
      state.productSections = [];
      state.currentSection = null;
    },
    clearProductSmis: (state) => {
      state.productSmis = [];
      state.currentSmi = null;
    },
    setCurrentSection: (state, action: PayloadAction<ProductSection | null>) => {
      state.currentSection = action.payload;
    },
    setCurrentSmi: (state, action: PayloadAction<ProductSmi | null>) => {
      state.currentSmi = action.payload;
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
      })

      // ==================== PRODUCT SETTINGS REDUCERS ====================
      
      // Fetch Product Settings
      .addCase(fetchProductSettings.pending, (state) => {
        state.loading.settings = true;
        state.error.settings = null;
      })
      .addCase(fetchProductSettings.fulfilled, (state, action) => {
        state.loading.settings = false;
        state.productSettings = action.payload.items || [];
        state.productSettingsTotalCount = action.payload.totalCount || 0;
        state.productSettingsTotalPages = action.payload.totalPages || 0;
      })
      .addCase(fetchProductSettings.rejected, (state, action) => {
        state.loading.settings = false;
        state.error.settings = action.payload as string;
      })

      // ==================== PRODUCT SECTIONS REDUCERS ====================
      
      // Fetch Product Sections
      .addCase(fetchProductSections.pending, (state) => {
        state.loading.sections = true;
        state.error.sections = null;
      })
      .addCase(fetchProductSections.fulfilled, (state, action) => {
        state.loading.sections = false;
        state.productSections = action.payload || [];
      })
      .addCase(fetchProductSections.rejected, (state, action) => {
        state.loading.sections = false;
        state.error.sections = action.payload as string;
      })

      // Fetch Section by ID
      .addCase(fetchSectionById.pending, (state) => {
        state.loading.sectionDetail = true;
        state.error.sectionDetail = null;
      })
      .addCase(fetchSectionById.fulfilled, (state, action) => {
        state.loading.sectionDetail = false;
        state.currentSection = action.payload;
        // Update in list if exists
        const index = state.productSections.findIndex(s => s.sectionID === action.payload.sectionID);
        if (index !== -1) {
          state.productSections[index] = action.payload;
        }
      })
      .addCase(fetchSectionById.rejected, (state, action) => {
        state.loading.sectionDetail = false;
        state.error.sectionDetail = action.payload as string;
      })

      // Create Section
      .addCase(createProductSection.pending, (state) => {
        state.loading.sectionCreate = true;
        state.error.sectionCreate = null;
      })
      .addCase(createProductSection.fulfilled, (state, action) => {
        state.loading.sectionCreate = false;
        const section = action.payload;
        state.productSections.push(section);
        state.currentSection = section;
      })
      .addCase(createProductSection.rejected, (state, action) => {
        state.loading.sectionCreate = false;
        state.error.sectionCreate = action.payload as string;
      })

      // Update Section
      .addCase(updateProductSection.pending, (state) => {
        state.loading.sectionUpdate = true;
        state.error.sectionUpdate = null;
      })
      .addCase(updateProductSection.fulfilled, (state, action) => {
        state.loading.sectionUpdate = false;
        const updated = action.payload;
        const index = state.productSections.findIndex(s => s.sectionID === updated.sectionID);
        if (index !== -1) {
          state.productSections[index] = updated;
        }
        state.currentSection = updated;
      })
      .addCase(updateProductSection.rejected, (state, action) => {
        state.loading.sectionUpdate = false;
        state.error.sectionUpdate = action.payload as string;
      })

      // Delete Section
      .addCase(deleteProductSection.pending, (state) => {
        state.loading.sectionDelete = true;
        state.error.sectionDelete = null;
      })
      .addCase(deleteProductSection.fulfilled, (state, action) => {
        state.loading.sectionDelete = false;
        const sectionId = action.payload;
        state.productSections = state.productSections.filter(s => s.sectionID !== sectionId);
        if (state.currentSection?.sectionID === sectionId) {
          state.currentSection = null;
        }
      })
      .addCase(deleteProductSection.rejected, (state, action) => {
        state.loading.sectionDelete = false;
        state.error.sectionDelete = action.payload as string;
      })

      // ==================== PRODUCT SMIS REDUCERS ====================
      
      // Fetch Product SMIs
      .addCase(fetchProductSmis.pending, (state) => {
        state.loading.smis = true;
        state.error.smis = null;
      })
      .addCase(fetchProductSmis.fulfilled, (state, action) => {
        state.loading.smis = false;
        state.productSmis = action.payload || [];
      })
      .addCase(fetchProductSmis.rejected, (state, action) => {
        state.loading.smis = false;
        state.error.smis = action.payload as string;
      })

      // Fetch SMI by ID
      .addCase(fetchSmiById.pending, (state) => {
        state.loading.smiDetail = true;
        state.error.smiDetail = null;
      })
      .addCase(fetchSmiById.fulfilled, (state, action) => {
        state.loading.smiDetail = false;
        state.currentSmi = action.payload;
        // Update in list if exists
        const index = state.productSmis.findIndex(s => s.sid === action.payload.sid);
        if (index !== -1) {
          state.productSmis[index] = action.payload;
        }
      })
      .addCase(fetchSmiById.rejected, (state, action) => {
        state.loading.smiDetail = false;
        state.error.smiDetail = action.payload as string;
      })

      // Create SMI
      .addCase(createProductSmi.pending, (state) => {
        state.loading.smiCreate = true;
        state.error.smiCreate = null;
      })
      .addCase(createProductSmi.fulfilled, (state, action) => {
        state.loading.smiCreate = false;
        const smi = action.payload;
        state.productSmis.push(smi);
        state.currentSmi = smi;
      })
      .addCase(createProductSmi.rejected, (state, action) => {
        state.loading.smiCreate = false;
        state.error.smiCreate = action.payload as string;
      })

      // Update SMI
      .addCase(updateProductSmi.pending, (state) => {
        state.loading.smiUpdate = true;
        state.error.smiUpdate = null;
      })
      .addCase(updateProductSmi.fulfilled, (state, action) => {
        state.loading.smiUpdate = false;
        const updated = action.payload;
        const index = state.productSmis.findIndex(s => s.sid === updated.sid);
        if (index !== -1) {
          state.productSmis[index] = updated;
        }
        state.currentSmi = updated;
      })
      .addCase(updateProductSmi.rejected, (state, action) => {
        state.loading.smiUpdate = false;
        state.error.smiUpdate = action.payload as string;
      })

      // Delete SMI
      .addCase(deleteProductSmi.pending, (state) => {
        state.loading.smiDelete = true;
        state.error.smiDelete = null;
      })
      .addCase(deleteProductSmi.fulfilled, (state, action) => {
        state.loading.smiDelete = false;
        const sid = action.payload;
        state.productSmis = state.productSmis.filter(s => s.sid !== sid);
        if (state.currentSmi?.sid === sid) {
          state.currentSmi = null;
        }
      })
      .addCase(deleteProductSmi.rejected, (state, action) => {
        state.loading.smiDelete = false;
        state.error.smiDelete = action.payload as string;
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
  clearProductSettings,
  clearProductSections,
  clearProductSmis,
  setCurrentSection,
  setCurrentSmi,
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

// Product Settings selectors
export const selectProductSettings = (state: { products: ProductsState }) => ({
  settings: state.products.productSettings,
  totalCount: state.products.productSettingsTotalCount,
  totalPages: state.products.productSettingsTotalPages,
  loading: state.products.loading.settings,
  error: state.products.error.settings,
});

// Product Sections selectors
export const selectProductSections = (state: { products: ProductsState }) => ({
  sections: state.products.productSections,
  loading: state.products.loading.sections,
  error: state.products.error.sections,
});

export const selectCurrentSection = (state: { products: ProductsState }) => ({
  currentSection: state.products.currentSection,
  loading: state.products.loading.sectionDetail,
  error: state.products.error.sectionDetail,
});

// Product SMIs selectors
export const selectProductSmis = (state: { products: ProductsState }) => ({
  smis: state.products.productSmis,
  loading: state.products.loading.smis,
  error: state.products.error.smis,
});

export const selectCurrentSmi = (state: { products: ProductsState }) => ({
  currentSmi: state.products.currentSmi,
  loading: state.products.loading.smiDetail,
  error: state.products.error.smiDetail,
});

export default productSlice.reducer;