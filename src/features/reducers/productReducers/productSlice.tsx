// @ts-nocheck
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiCall from "../../../utils/api-call";
import {
  ProductCreateUpdateRequest,
  ProductState,
} from "../../../types/product";

export const getAllProducts = createAsyncThunk(
  "products/getAllProducts",
  async (
    {
      riskId,
      pageNumber,
      pageSize,
    }: { riskId: string; pageNumber: number; pageSize: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiCall.get(
        `/products?pageNumber=${pageNumber}&pageSize=${pageSize}&riskId=${riskId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const getProductDetails = createAsyncThunk(
  "products/getProductDetails",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (data: ProductCreateUpdateRequest, { rejectWithValue }) => {
    try {
      const response = await apiCall.post("/products", data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export interface ProductUpdatePayload {
  id: number;
  data: ProductCreateUpdateRequest;
}

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, data }: ProductUpdatePayload, { rejectWithValue }) => {
    try {
      await apiCall.put(`/Products/${id}`, data);
      return { productID: id, ...data };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (productId: string | undefined, { rejectWithValue }) => {
    try {
      await apiCall.delete(`/products/${productId}`);
      return productId;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const initialState: ProductState = {
  products: [],

  loading: {
    getAllProducts: false,
    getProductDetails: false,
    createProduct: false,
    updateProduct: false,
    deleteProduct: false,
  },
  error: {
    getAllProducts: null,
    getProductDetails: null,
    createProduct: null,
    updateProduct: null,
    deleteProduct: null,
  },
  success: {
    createProduct: false,
    updateProduct: false,
    deleteProduct: false,
  },
};

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = { ...initialState.error };
      state.success = { ...initialState.success };
    },
    clearProducts: (state) => {
      state.products = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(getAllProducts.pending, (state) => {
        state.loading.getAllProducts = true;
        state.error.getAllProducts = null;
      })
      .addCase(getAllProducts.fulfilled, (state, action) => {
        state.loading.getAllProducts = false;
        state.products = action.payload;
      })
      .addCase(getAllProducts.rejected, (state, action) => {
        state.loading.getAllProducts = false;
        state.error.getAllProducts = action.payload;
      })

      // Fetch Products Details
      .addCase(getProductDetails.pending, (state) => {
        state.loading.getProductDetails = true;
        state.error.getProductDetails = null;
      })
      .addCase(getProductDetails.fulfilled, (state, action) => {
        state.loading.getProductDetails = false;
        state.product = action.payload;
      })
      .addCase(getProductDetails.rejected, (state, action) => {
        state.loading.getProductDetails = false;
        state.error.getProductDetails = action.payload;
      })

      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.loading.createProduct = true;
        state.error.createProduct = null;
        state.success.createProduct = false;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading.createProduct = false;
        state.success.createProduct = true;
        state.products.push(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading.createProduct = false;
        state.error.createProduct = action.payload;
      })

      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.loading.updateProduct = true;
        state.error.updateProduct = null;
        state.success.updateProduct = false;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading.updateProduct = false;
        state.success.updateProduct = true;
        // const index = state.products.findIndex(
        //   (product) => product.productID === action.payload.productID
        // );
        // if (index !== -1) {
        //   state.products[index] = {
        //     ...state.products[index],
        //     productName: action.payload.productName,
        //     productDescription: action.payload.productDescription,
        //   };
        // }
        // state.product = {
        //   ...state.product,
        //   productName: action.payload.productName,
        //   productDescription: action.payload.productDescription,
        // };
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading.updateProduct = false;
        state.error.updateProduct = action.payload;
      })

      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.loading.deleteProduct = true;
        state.error.deleteProduct = null;
        state.success.deleteProduct = false;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading.deleteProduct = false;
        state.success.deleteProduct = true;
        state.products = state.products.filter(
          (product) => product.productID !== action.payload
        );
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading.deleteProduct = false;
        state.error.deleteProduct = action.payload;
      });
  },
});

export const selectProducts = (state: { products: ProductState }) =>
  state.products;

export const { clearMessages, clearProducts } = productSlice.actions;

export default productSlice.reducer;
