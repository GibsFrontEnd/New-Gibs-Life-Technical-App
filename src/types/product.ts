export type ProductField = {
  name: string;
  type: string;
  required: boolean;
  description: string;
};

export interface ProductRate {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue: number;
  maximumValue: number;
  minimumValue: number;
}

export interface ProductSMI {
  code: string;
  name: string;
}
export interface ProductSection {
  sectionID: string;
  sectionName: string;
  fields: ProductField[];
  rates: ProductRate[];
  smIs: ProductSMI[];
}

export type Product = {
  riskID: string;
  productID: string;
  productName: string;
  sections: ProductSection[] | null;
  fields: ProductField[] | null;
  rates: ProductRate[] | null;
};

export interface ProductCreateUpdateRequest {
  productID: string;
  classID: string;
  midClassID: string;
  productName: string;
  shortName: string;
  naicomTypeID: string;
}

export interface ProductState {
  products: Product[];

  loading: {
    getAllProducts: boolean;
    getProductDetails: boolean;
    createProduct: boolean;
    updateProduct: boolean;
    deleteProduct: boolean;
  };
  error: {
    getAllProducts: unknown;
    getProductDetails: unknown;
    createProduct: unknown;
    updateProduct: unknown;
    deleteProduct: unknown;
  };
  success: {
    createProduct: boolean;
    updateProduct: boolean;
    deleteProduct: boolean;
  };
}
