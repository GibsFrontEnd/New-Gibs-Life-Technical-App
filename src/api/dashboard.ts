// Figures for the home page, read from the list endpoints the rest of the app already uses
// (the API's own /Dashboard endpoints are commented out). Each list is asked for one small page;
// its total count is the figure. A source that fails shows as unavailable, not as zero.
import apiCall from "../utils/api-call";
import { annuityApi } from "./annuity";

export type Figure = number | null;

export interface DashboardData {
  investment: Figure;
  traditional: Figure;
  groupLife: Figure;
  customers: Figure;
  annuity: Figure;
  annuityPending: Figure;
  recentPolicies: any[];
  recentSchemes: any[];
}

const total = (d: any): Figure => {
  const n = d?.totalCount ?? d?.TotalCount ?? d?.totalRecords ?? d?.TotalRecords;
  return typeof n === "number" ? n : null;
};

const items = (d: any): any[] => (Array.isArray(d) ? d : d?.items ?? d?.Items ?? d?.data ?? []);

const settle = async <T>(p: Promise<T>): Promise<T | null> => {
  try {
    return await p;
  } catch {
    return null;
  }
};

export const loadDashboard = async (): Promise<DashboardData> => {
  const policies = (params: Record<string, any>) =>
    apiCall.get("/v1/lifepolicyAdmin/policies", { params: { page: 1, ...params } }).then((r) => r.data);

  const [inv, trad, recent, schemes, customers, annuity, annuityPending] = await Promise.all([
    settle(policies({ pageSize: 1, tag: "B" })),
    settle(policies({ pageSize: 1, tag: "A" })),
    settle(policies({ pageSize: 6 })),
    settle(apiCall.get("/grouplife/policies", { params: { Page: 1, PageSize: 5 } }).then((r) => r.data)),
    // the customers endpoint answers 404 when there are none
    apiCall
      .get("/v1/Customers", { params: { pageNumber: 1, pageSize: 1 } })
      .then((r) => r.data)
      .catch((e) => (e?.response?.status === 404 ? { totalRecords: 0 } : null)),
    settle(annuityApi.policies({ page: 1, pageSize: 1 })),
    settle(annuityApi.proposals({ page: 1, pageSize: 1, status: "PENDING" })),
  ]);

  return {
    investment: total(inv),
    traditional: total(trad),
    groupLife: total(schemes),
    customers: total(customers),
    annuity: total(annuity),
    annuityPending: total(annuityPending),
    recentPolicies: items(recent),
    recentSchemes: items(schemes),
  };
};
