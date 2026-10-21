// @ts-nocheck
// The report server (Crystal reports behind lifereportapi): its report list, each report's
// parameters, and the export that returns the PDF / Word / Excel file.
import { REPORTS_API_URL } from "../../config/config";
import apiCall from "../../utils/api-call";

const base = (endpoint: string) => `${REPORTS_API_URL}/api/reports/${endpoint}`;

/** Names match whatever their spacing, case and punctuation: the server has "All Matured  Policy Registers". */
export const nameKey = (name: string) => String(name).toLowerCase().replace(/[^a-z0-9]/g, "");

const errorText = async (res: Response) => {
  try {
    const body = await res.json();
    if (body?.Message) return body.Message;
  } catch {}
  return res.status === 404 ? "The report server doesn't know this report." : `The report server returned an error (HTTP ${res.status}).`;
};

const getJson = async (url: string) => {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(await errorText(res));
  return res.json();
};

const lists = new Map<string, Promise<any[]>>();

/** The server's own spelling of a report name, looked up once per endpoint. */
export const resolveApiName = async (endpoint: string, title: string, override?: string) => {
  if (override) return override;
  if (!lists.has(endpoint)) lists.set(endpoint, getJson(base(endpoint)).catch((e) => (lists.delete(endpoint), Promise.reject(e))));
  const hit = (await lists.get(endpoint)).find((r) => nameKey(r.report) === nameKey(title));
  if (!hit) throw new Error("This report isn't on the report server yet.");
  return hit.report;
};

/** [{ name: "@Period1", type: "DateTimeParameter" }, ...] */
export const fetchParameters = (endpoint: string, report: string) =>
  getJson(`${base(endpoint)}/parameters?${new URLSearchParams({ report })}`);

/** The name as it goes into `args` and on screen: "@Period1" -> "Period1". */
export const paramKey = (name: string) => String(name).replace(/^@/, "");

const LABELS = {
  brcode: "Branch",
  branchid: "Branch",
  agentcode: "Agent",
  covercode: "Product (cover code)",
  partyid: "Party ID",
  insuredid: "Insured ID",
  supportemail: "Support email",
};

export const paramLabel = (name: string) => {
  const key = paramKey(name);
  return (
    LABELS[key.toLowerCase()] ??
    key
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z0-9])/g, "$1 $2")
      .replace(/^./, (c) => c.toUpperCase())
  );
};

/** Runs the report and returns the file. Every parameter must be sent; text ones may be empty. */
export const exportReport = async (endpoint: string, report: string, format: string, values: Record<string, string>) => {
  // Values go in as typed (a space stays a space): the server splits `args` on & and =.
  const args = Object.entries(values)
    .map(([k, v]) => `${k}=${v ?? ""}`)
    .join("&");
  const res = await fetch(`${base(endpoint)}/export?${new URLSearchParams({ report, format, args })}`);
  if (!res.ok) throw new Error(await errorText(res));
  const blob = await res.blob();
  const disposition = res.headers.get("content-disposition") ?? "";
  const named = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const ext = { pdf: "pdf", word: "doc", excel: "xls" }[format] ?? format;
  return { blob, filename: named ? decodeURIComponent(named[1]) : `${report.trim()}.${ext}` };
};

// ---------------------------------------------------------------- dropdown lists
// Text parameters that are codes from a list the app already has. Anything else is typed in.
const rows = (data: any) => (Array.isArray(data) ? data : data?.data ?? data?.items ?? data?.result ?? []);

const LOOKUPS = {
  branches: async () =>
    rows((await apiCall.get("/lookups/branches")).data).map((b) => ({ value: b.branchID, label: b.description || b.branchID2 })),
  agents: async () =>
    rows((await apiCall.get("/v1/Agents", { params: { pageNumber: 1, pageSize: 1000 } })).data).map((a) => ({
      value: a.agentID ?? a.agentId,
      label: a.agent || a.name || a.fullName,
    })),
  products: async () =>
    rows((await apiCall.get("/v1/Products")).data).map((p) => ({ value: p.productID, label: p.productName })),
};

const LOOKUP_FOR = { brcode: "branches", branchid: "branches", agentcode: "agents", covercode: "products" };

export const lookupFor = (name: string) => LOOKUP_FOR[paramKey(name).toLowerCase()] ?? null;

const loaded = new Map<string, Promise<any[]>>();

/** The options for a dropdown, loaded once. An empty list leaves the field as plain text. */
export const loadLookup = (kind: string) => {
  if (!loaded.has(kind)) {
    loaded.set(
      kind,
      LOOKUPS[kind]()
        .then((list) => list.filter((o) => o.value))
        .catch(() => (loaded.delete(kind), [])),
    );
  }
  return loaded.get(kind);
};
