import {
  GroupLifeQuotation,
  GroupLifeQuotationFilters,
} from "../types/groupLifeQuotation";
import apiCall from "@/utils/api-call";

export async function fetchGroupLifeQuotations(
  filters: GroupLifeQuotationFilters,
  page: number,
  pageSize: number
) {
  return apiCall<{ data: GroupLifeQuotation[]; total: number }>(
    "/Quotation/quotations",
    {
      method: "GET",
      params: { ...filters, page, pageSize, tag: filters.tag },
    }
  );
}

export async function fetchGroupLifeQuotationsByAgent(
  agentCode: string,
  page: number,
  pageSize: number
) {
  return apiCall<{ data: GroupLifeQuotation[]; total: number }>(
    `/Quotation/grouplife/agent/${agentCode}/paged`,
    {
      method: "GET",
      params: { page, pageSize },
    }
  );
}

export async function fetchGroupLifeQuotationById(id: string) {
  return apiCall<GroupLifeQuotation>(`/Quotation/GroupLife/${id}`, {
    method: "GET",
  });
}

export async function createGroupLifeQuotation(
  data: Partial<GroupLifeQuotation>
) {
  return apiCall<GroupLifeQuotation>("/Quotation/", {
    method: "POST",
    data,
  });
}

export async function updateGroupLifeQuotation(
  id: string,
  data: Partial<GroupLifeQuotation>
) {
  return apiCall<GroupLifeQuotation>(`/Quotation/GroupLife/${id}`, {
    method: "PUT",
    data,
  });
}

export async function deleteGroupLifeQuotation(id: string) {
  return apiCall<void>(`/Quotation/GroupLife/${id}`, {
    method: "DELETE",
  });
}

export async function updateMemberInCurrentQuotation(
  id: string,
  memberId: string,
  data: any
) {
  return apiCall<void>(`/Quotation/${id}/member/${memberId}`, {
    method: "PUT",
    data,
  });
}

export async function removeMemberFromCurrentQuotation(
  id: string,
  memberId: string
) {
  return apiCall<void>(`/Quotation/${id}/member/${memberId}`, {
    method: "DELETE",
  });
}

export async function addMemberToCurrentQuotation(id: string, data: any) {
  return apiCall<void>(`/Quotation/${id}/member`, {
    method: "POST",
    data,
  });
}

export interface ComputeQuotationMember {
  staffNo: string;
  employeeNames: string;
  sex: string;
  dateOfBirth: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  hireDate: string;
  permanentDisabilityRate: number;
  temporaryDisabilityRate: number;
  medicalExpensesRate: number;
  funeralExtensionRate: number;
  criticalIllnessRate: number;
}

export interface ComputeQuotationPayload {
  quotationNumber: string;
  transactionDate: string;
  effectiveDate: string;
  expiryDate: string;
  insuredType: string;
  schemeType: string;
  clientName: string;
  groupLifeFactor: number;
  groupFactorAmount: number;
  useFixedRate: boolean;
  fixedRate: number;
  useAverageAge: boolean;
  averageAge: number;
  loadingRate: number;
  reductionRate: number;
  coverDays: number;
  members: ComputeQuotationMember[];
}

export interface ComputeQuotationResponse {
  success?: boolean;
  totalSumInsured?: number;
  totalPremium?: number;
  netPremiumDue?: number;
  loadingPercentage?: number;
  reductionPercentage?: number;
  // allow additional backend fields without breaking
  [key: string]: unknown;
}

// change compute to accept payload and return server response
export async function computeQuotation(data: ComputeQuotationPayload) {
  return apiCall<ComputeQuotationResponse>(`/Quotation/compute`, {
    method: "POST",
    data,
  });
}

// ensure these exist and return blobs/results
export async function getCsvTemplate() {
  return apiCall<Blob>(`/Quotation/template/csv`, {
    method: "GET",
    responseType: "blob",
  });
}

export async function getExcelTemplate() {
  return apiCall<Blob>(`/Quotation/template/excel`, {
    method: "GET",
    responseType: "blob",
  });
}

export async function validateMembers(file: Blob) {
  const form = new FormData();
  form.append("file", file);
  return apiCall<{
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    validationResults: {
      rowNumber: number;
      staffNo: string;
      employeeName: string;
      isValid: boolean;
      validationErrors: string[];
    }[];
    fileErrors: string[];
    validatedAt: string;
  }>(`/Quotation/validate`, {
    method: "POST",
    data: form,
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function uploadMembers(file: Blob) {
  const form = new FormData();
  form.append("file", file);
  return apiCall<{
    success: boolean;
    totalRecords: number;
    validRecords: number;
    members: ComputeQuotationMember[];
    errors: string[];
    processedAt: string;
  }>(`/Quotation/upload`, {
    method: "POST",
    data: form,
    headers: { "Content-Type": "multipart/form-data" },
  });
}
