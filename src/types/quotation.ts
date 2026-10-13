import { ROOT_URL } from "../utils/constants";

const BASE_URL = ROOT_URL;

export interface QuotationState {
  quotations: any[];
  loading: boolean;
  error: string | null;
  currentQuotation: FilteredQuotationData | null;
}

export interface QuotationCalculatePayload {
  quoteNo: string;
  surName: string;
  otherNames: string;
  quotationDate: string;
  dateOfBirth: string;
  branchID: string;
  mobileNumber: string;
  email: string;
  duration: number;
  frequency: string;
  remark: string;
  regularSaving: number;
  sumAssured?: number;
  productCode: string;
  product: string;
  extraRate: number;
  loadingRate: number;
  status: string;
}

export interface QuotationData {
  id: null;
  quoteNo: string;
  surName: string;
  otherNames: string;
  quotationDate: string;
  dateOfBirth: string;
  branchID: string;
  mobileNumber: string;
  email: string;
  duration: number;
  frequency: string;
  regularSaving: number;
  productCode: string;
  product: string;
  extraRate: number;
  loadingRate: number;
  status: string;
  totalPremium: number;
  cardNo: string;
  tag: string; // Added tag for filtering
}

export interface QuotationCalculateResponse {
  quoteNo: string;
  annualPremium: number;
  sumAssured: number;
  lifeCover: number;
  loading: number;
  extraPremium: number;
  totalPremium: number;
}

export interface FilteredQuotationData {
  quoteID: number;
  quoteNo: string;
  proposalNo: string;
  brCode: string;
  tDate: string;
  assDate: string;
  coverCode: string;
  covertype: string;
  assuredCode: string | null;
  surName: string;
  otherNames: string;
  address: string | null;
  state: string | null;
  landphone: string | null;
  mobilePhone: string;
  email: string;
  nationalID: string | null;
  occupation: string | null;
  sex: string | null;
  maritalStatus: string | null;
  country: string | null;
  startDate: string;
  maturityDate: string;
  duration: number;
  dateofBirth: string;
  sumAssured: number;
  customerType: string | null;
  cardNo: string;
  createdAt: string;
  status: string;
  medical: string | null;
  premium1: number;
  premium2: number;
  premium3: number;
  a1: number;
  a2: number;
  tpdRate: string | null;
  ttdrAte: string | null;
  ciRate: string | null;
  medicalRate: string | null;
  funeralRate: string | null;
  suppsa: string | null;
  toAllocate: string | null;
  loading: number;
  xMas: string | null;
  adbsa: string | null;
  basicPremium: number;
  intrestRate: string | null;
  totalPremium: number;
  transSTATUS: string | null;
  transGUID: string;
  remarks: string | null;
  tag: string | null;
  isQuote: number;
  submittedBy: string;
  submittedOn: string;
  modifiedBy: string | null;
  modifiedOn: string;
}

export interface QuotationResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface Product {
  riskID: string;
  productID: string;
  productName: string;
  productType: string | null;
  description: string;
}

export interface Branch {
  branchID: string;
  regionID: string;
  stateID: string;
  branchID2: string;
  description: string;
  manager: string | null;
  address: string;
  mobilePhone: string;
  landPhone: string;
  email: string;
  fax: string | null;
  deleted: number;
  active: number;
  remarks: string | null;
  submittedBy: string;
  submittedOn: string;
  modifiedBy: string | null;
  modifiedOn: string | null;
}

export interface ProductSettings {
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
  a1: number | null;
  a2: number | null;
  remarks: string | null;
  tag: string | null;
}

export interface CreateProductSettingsPayload {
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
  a1?: number;
  a2?: number;
  remarks?: string;
  tag?: string;
}

export interface UpdateProductSettingsPayload
  extends CreateProductSettingsPayload {}

export interface ProductSettingsResponse {
  success: boolean;
  message: string;
  data?: ProductSettings;
}

export interface QuotationsApiResponse {
  items: QuotationData[];
  totalCount: number;
}

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export async function calculateQuotation(
  payload: QuotationCalculatePayload
): Promise<QuotationCalculateResponse> {
  const resp = await fetch(`${BASE_URL}api/Quotation/calculate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    let errorMessage = "Failed to calculate quotation";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return resp.json();
}

export async function previewQuotation(
  payload: QuotationCalculatePayload
): Promise<QuotationCalculateResponse> {
  const resp = await fetch(`${BASE_URL}api/Quotation/calculate/preview`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    let errorMessage = "Failed to preview quotation";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return resp.json();
}

// â”€â”€â”€ Investment Link Quote: Get Premium Rate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface PremiumRateParams {
  productCode: string;
  duration: number;
  age: number;
  rateCode?: string;
  remark?: string;
}

export interface PremiumRateResponse {
  rateCode?: string;
  rate?: number;
  remark?: string;
  [key: string]: any;
}

export async function getPremiumRate(
  params: PremiumRateParams
): Promise<PremiumRateResponse> {
  const query = new URLSearchParams({
    productCode: params.productCode,
    duration: String(params.duration),
    age: String(params.age),
    ...(params.rateCode ? { rateCode: params.rateCode } : {}),
    ...(params.remark ? { remark: params.remark } : {}),
  }).toString();

  const resp = await fetch(`${BASE_URL}api/lifequotes/get-premium-rate?${query}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!resp.ok) {
    let errorMessage = "Failed to fetch premium rate";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return resp.json();
}

// â”€â”€â”€ Investment Link Quote: Preview/Calculate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// --- Investment Link Quote: Save/Confirm (POST) ---
export async function calculateInvestmentQuotation(
  payload: QuotationCalculatePayload
): Promise<QuotationCalculateResponse> {
  const resp = await fetch(`${BASE_URL}api/lifequotes/calculate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    let errorMessage = "Failed to save investment quotation";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return resp.json();
}
export async function previewInvestmentQuotation(
  payload: QuotationCalculatePayload
): Promise<QuotationCalculateResponse> {
  const resp = await fetch(`${BASE_URL}api/lifequotes/calculate/preview`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    let errorMessage = "Failed to preview investment quotation";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return resp.json();
}

// ─── Traditional Quote: Save/Confirm (POST) ─────────────────────
export async function calculateTradQuotationNew(
  payload: QuotationCalculatePayload
): Promise<QuotationCalculateResponse> {
  const resp = await fetch(`${BASE_URL}api/lifequotes/tradcalculate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    let errorMessage = "Failed to save traditional quotation";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return resp.json();
}

// ─── Traditional Quote: Preview/Calculate (POST) ────────────────
export async function previewTradQuotationNew(
  payload: QuotationCalculatePayload
): Promise<QuotationCalculateResponse> {
  const resp = await fetch(`${BASE_URL}api/lifequotes/tradcalculate/preview`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    let errorMessage = "Failed to preview traditional quotation";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return resp.json();
}

export async function getSingleQuotation(quoteNo: string): Promise<any> {
  const resp = await fetch(`${BASE_URL}api/lifequotes/filterquotation?quoteNo=${quoteNo}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!resp.ok) {
    let errorMessage = "Failed to fetch quotation details";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return resp.json();
}



export interface TradQuotationCalculatePayload {
  quoteNo: string;
  surName: string;
  otherNames: string;
  quotationDate: string;
  dateOfBirth: string;
  branchID: string;
  mobileNumber: string;
  assuredCode?: string;
  email: string;
  duration: number;
  frequency: string;
  regularSaving: number;
  productCode: string;
  age: number;
  rateCode: string;
  product: string;
  firstPremium: number;
  sumAssured: number;
  status: string;
  agentCode?: string;
}

export interface TradQuotationCalculateResponse {
  quoteNo: string;
  annualPremium: number;
  sumAssured: number;
  lifeCover: number;
  loading: number;
  extraPremium: number;
  totalPremium: number;
  firstPremium: number;
  firstpayable?: number | null;
  secondpayable?: number | null;
  thirdpayable?: number | null;
}

export interface QuotationByQuoteNoResponse {
  quoteID: number;
  quoteNo: string;
  proposalNo: string;
  brCode: string;
  tDate: string;
  assDate: string;
  coverCode: string;
  covertype: string;
  assuredCode: string | null;
  surName: string;
  otherNames: string;
  address: string | null;
  state: string | null;
  landphone: string | null;
  mobilePhone: string;
  email: string;
  nationalID: string | null;
  occupation: string | null;
  sex: string | null;
  maritalStatus: string | null;
  country: string | null;
  startDate: string;
  maturityDate: string;
  duration: number;
  dateofBirth: string;
  sumAssured: number;
  customerType: string | null;
  cardNo: string;
  status: string;
  medical: string | null;
  premium1: number;
  premium2: number;
  premium3: number | null;
  a1: number | null;
  a2: number | null;
  tpdRate: string | null;
  ttdrAte: string | null;
  ciRate: string | null;
  medicalRate: string | null;
  funeralRate: string | null;
  suppsa: string | null;
  toAllocate: string | null;
  loading: number;
  xMas: string | null;
  adbsa: string | null;
  basicPremium: number;
  intrestRate: string | null;
  totalPremium: number;
  transSTATUS: string | null;
  transGUID: string;
  remarks: string | null;
  tag: string | null;
  isQuote: number;
  submittedBy: string;
  submittedOn: string;
  modifiedBy: string | null;
  modifiedOn: string;
}

export async function getQuotationByQuoteNo(
  quoteNo: string
): Promise<QuotationByQuoteNoResponse> {
  const resp = await fetch(
    `${BASE_URL}api/Quotation/quote-no?quoteNo=${encodeURIComponent(quoteNo)}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!resp.ok) {
    let errorMessage = "Failed to fetch quotation by quote number";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return resp.json();
}

export async function calculateTradQuotation(
  payload: TradQuotationCalculatePayload
): Promise<TradQuotationCalculateResponse> {
  const resp = await fetch(`${BASE_URL}api/Quotation/tradcalculate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    let errorMessage = "Failed to calculate traditional quotation";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return resp.json();
}

export async function previewTradQuotation(
  payload: TradQuotationCalculatePayload
): Promise<TradQuotationCalculateResponse> {
  const resp = await fetch(`${BASE_URL}api/Quotation/tradcalculate/preview`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    let errorMessage = "Failed to preview traditional quotation";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return resp.json();
}

export async function getQuotations(
  page: number,
  pageSize: number
): Promise<QuotationsApiResponse> {
  const resp = await fetch(
    `${BASE_URL}api/Quotation/quotations?page=${page}&pageSize=${pageSize}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!resp.ok) {
    let errorMessage = "Failed to fetch quotations";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await resp.json();
  // Ensure data has items and totalCount, or default
  return {
    items: Array.isArray(data.items) ? data.items : [],
    totalCount: typeof data.totalCount === "number" ? data.totalCount : 0,
  };
}

export async function getFilteredQuotations(
  quoteNo: string
): Promise<FilteredQuotationData[]> {
  const resp = await fetch(
    `${BASE_URL}api/Quotation/filterquotation?quoteNo=${quoteNo}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!resp.ok) {
    let errorMessage = "Failed to fetch filtered quotations";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await resp.json();
  return Array.isArray(data) ? data : [];
}

export async function updateQuotation(
  quoteId: number,
  payload: Partial<FilteredQuotationData>
): Promise<QuotationResponse> {
  const resp = await fetch(`${BASE_URL}api/Quotation/${quoteId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    let errorMessage = "Failed to update quotation";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return resp.json();
}

export async function deleteQuotation(quoteId: number): Promise<void> {
  const resp = await fetch(`${BASE_URL}api/Quotation/${quoteId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!resp.ok) {
    let errorMessage = "Failed to delete quotation";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
  }
}

export async function getProducts(): Promise<Product[]> {
  const resp = await fetch(`${BASE_URL}api/v1/Products`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!resp.ok) {
    let errorMessage = "Failed to fetch products";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await resp.json();
  const products = Array.isArray(data) ? data : data.data || [];

  // Filter products to only include those with riskID "B"
  // return products.filter((product: Product) => product.riskID === "B")
  return products;
}

export const getBranches = async (): Promise<Branch[]> => {
  const resp = await fetch(`${BASE_URL}api/lookups/branches`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!resp.ok) {
    let errorMessage = "Failed to fetch branches";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await resp.json();
  return Array.isArray(data) ? data : [];
};

export async function getProductSettings(): Promise<ProductSettings[]> {
  const resp = await fetch(`${BASE_URL}api/Quotation/ProductSettings`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!resp.ok) {
    let errorMessage = "Failed to fetch product settings";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await resp.json();
  return Array.isArray(data) ? data : [];
}

export async function getProductSettingById(
  productId: string
): Promise<ProductSettings> {
  const resp = await fetch(`${BASE_URL}api/Quotation/product/${productId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!resp.ok) {
    let errorMessage = "Failed to fetch product setting";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return resp.json();
}

export async function createProductSettings(
  payload: CreateProductSettingsPayload
): Promise<ProductSettings> {
  const resp = await fetch(`${BASE_URL}api/Quotation/productsettings`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    let errorMessage = "Failed to create product settings";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return resp.json();
}

export async function updateProductSettings(
  productId: string,
  payload: UpdateProductSettingsPayload
): Promise<void> {
  const resp = await fetch(
    `${BASE_URL}api/Quotation/ProductSettings/${productId}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );

  if (!resp.ok) {
    let errorMessage = "Failed to update product settings";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new Error(errorMessage);
  }

  // nothing to return
}

export async function deleteProductSettings(productId: string): Promise<void> {
  const resp = await fetch(
    `${BASE_URL}api/Quotation/ProductSettings/${productId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  if (!resp.ok) {
    let errorMessage = "Failed to delete product settings";
    try {
      const errorData = await resp.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
    }
  }
}
