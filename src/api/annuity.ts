// Annuity module - technical / underwriting API (life_technical_api: api/v1/Annuity/...)
import apiCall from "@/utils/api-call";

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages?: number;
}

const unwrap = <T>(r: { data: T }) => r.data;
const e = encodeURIComponent;
const A = "/v1/Annuity"; // base URL ends in /api; SecureControllerBase controllers live under api/v1

export const annuityApi = {
  // ---- product rules & factors
  rules: (params?: Record<string, any>) => apiCall.get<any[]>(`${A}/products`, { params }).then(unwrap),
  createRule: (body: Record<string, any>) => apiCall.post(`${A}/products/rules`, body).then(unwrap),
  deactivateRule: (id: number, reason: string) =>
    apiCall.post(`${A}/products/rules/${id}/deactivate`, { reason }).then(unwrap),
  factors: (code: string, activeOnly = true) =>
    apiCall.get<any[]>(`${A}/products/${e(code)}/factors`, { params: { activeOnly } }).then(unwrap),
  uploadFactors: (code: string, factors: Record<string, any>[]) =>
    apiCall.post(`${A}/products/${e(code)}/factors`, { factors }).then(unwrap),

  // ---- proposals / underwriting
  proposals: (params: Record<string, any>) => apiCall.get<Paged<any>>(`${A}/proposals`, { params }).then(unwrap),
  proposal: (no: string) => apiCall.get<{ proposal: any; calculations: any[] }>(`${A}/proposals/${e(no)}`).then(unwrap),
  calculate: (no: string, commencementDate?: string) =>
    apiCall.post(`${A}/proposals/${e(no)}/calculate`, commencementDate ? { commencementDate } : {}).then(unwrap),
  underwrite: (no: string, decision: string, reason?: string) =>
    apiCall.post(`${A}/proposals/${e(no)}/underwrite`, { decision, reason }).then(unwrap),
  confirmPremium: (no: string, body: Record<string, any>) =>
    apiCall.put(`${A}/proposals/${e(no)}/premium`, body).then(unwrap),
  issue: (no: string, horizonYears?: number) =>
    apiCall.post(`${A}/proposals/${e(no)}/issue`, horizonYears ? { horizonYears } : {}).then(unwrap),

  // ---- policies / schedule
  policies: (params: Record<string, any>) => apiCall.get<Paged<any>>(`${A}/policies`, { params }).then(unwrap),
  policy: (no: string) => apiCall.get<any>(`${A}/policy`, { params: { policyNo: no } }).then(unwrap),
  schedule: (no: string, includeCancelled = false) =>
    apiCall.get<any[]>(`${A}/policy/payment-schedule`, { params: { policyNo: no, includeCancelled } }).then(unwrap),
  generateSchedule: (no: string, body: Record<string, any>) =>
    apiCall.post(`${A}/policy/generate-schedule`, body, { params: { policyNo: no } }).then(unwrap),
  suspend: (no: string, reason: string) => apiCall.post(`${A}/policy/suspend-payments`, { reason }, { params: { policyNo: no } }).then(unwrap),
  resume: (no: string, reason: string) => apiCall.post(`${A}/policy/resume-payments`, { reason }, { params: { policyNo: no } }).then(unwrap),

  // ---- life verification
  lifeCertificates: (no: string) => apiCall.get<any[]>(`${A}/policy/life-verification`, { params: { policyNo: no } }).then(unwrap),
  recordLife: (no: string, body: Record<string, any>) =>
    apiCall.post(`${A}/policy/life-verification`, body, { params: { policyNo: no } }).then(unwrap),
  lifeDue: (withinDays = 30) => apiCall.get<any>(`${A}/life-verification/due`, { params: { withinDays } }).then(unwrap),

  // ---- payments
  duePayments: (params: Record<string, any>) => apiCall.get<any>(`${A}/payments/due`, { params }).then(unwrap),
  markDue: () => apiCall.post(`${A}/payments/mark-due`, {}).then(unwrap),
  pay: (id: number, body: Record<string, any>) => apiCall.post(`${A}/payments/${id}/pay`, body).then(unwrap),
  reverse: (id: number, reason: string) => apiCall.post(`${A}/payments/${id}/reverse`, { reason }).then(unwrap),
  transactions: (id: number) => apiCall.get<any[]>(`${A}/payments/${id}/transactions`).then(unwrap),

  // ---- batches
  createBatch: (body: Record<string, any>) => apiCall.post(`${A}/payments/batches`, body).then(unwrap),
  batches: (params: Record<string, any>) => apiCall.get<Paged<any>>(`${A}/payments/batches`, { params }).then(unwrap),
  batch: (no: string) => apiCall.get<any>(`${A}/payments/batches/${e(no)}`).then(unwrap),
  approveBatch: (no: string) => apiCall.post(`${A}/payments/batches/${e(no)}/approve`, {}).then(unwrap),
  rejectBatch: (no: string, reason: string) => apiCall.post(`${A}/payments/batches/${e(no)}/reject`, { reason }).then(unwrap),
  executeBatch: (no: string, body: Record<string, any>) =>
    apiCall.post(`${A}/payments/batches/${e(no)}/execute`, body).then(unwrap),
  reconcileBatch: (no: string, body: Record<string, any>) =>
    apiCall.post(`${A}/payments/batches/${e(no)}/reconcile`, body).then(unwrap),

  // ---- death & benefit
  reportDeath: (no: string, body: Record<string, any>) =>
    apiCall.post(`${A}/policy/death-notification`, body, { params: { policyNo: no } }).then(unwrap),
  deaths: (params?: Record<string, any>) => apiCall.get<any[]>(`${A}/death-notifications`, { params }).then(unwrap),
  verifyDeath: (id: number, approve: boolean, reason?: string) =>
    apiCall.post(`${A}/death-notifications/${id}/verify`, { approve, reason }).then(unwrap),
  calculateDeath: (id: number) => apiCall.post<any>(`${A}/death-notifications/${id}/calculate`, {}).then(unwrap),
  settleDeath: (id: number, body: Record<string, any>) =>
    apiCall.post(`${A}/death-notifications/${id}/settle`, body).then(unwrap),

  // ---- general ledger
  glMappings: (activeOnly = true) => apiCall.get<any[]>(`${A}/gl/mappings`, { params: { activeOnly } }).then(unwrap),
  saveGlMapping: (body: Record<string, any>) => apiCall.post(`${A}/gl/mappings`, body).then(unwrap),
  glPostings: (params: Record<string, any>) => apiCall.get<any>(`${A}/gl/postings`, { params }).then(unwrap),

  // ---- audit
  audit: (reference: string) => apiCall.get<any[]>(`${A}/audit`, { params: { reference } }).then(unwrap),
};
