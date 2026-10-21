// Free-text search over in-force individual policies, page by page.
//
// The updated API takes `q` on GET /v1/lifepolicyAdmin/policies and matches every typed word
// against policy/proposal number, names, insured code, product, phone, email, ID/NIN/BVN, agent
// and state; it echoes `search` back so we know it applied the filter. An older API ignores `q`,
// so in that case we fall back to the fields it can filter (policy number, any name, insured code,
// cover code), run together and merged, then keep rows that contain every typed word.
import apiCall from "../utils/api-call";

export interface PolicySearchPage {
  items: any[];
  /** Total matches, when the server can tell us. */
  total: number | null;
  hasMore: boolean;
}

const URL = "/v1/lifepolicyAdmin/policies";
let serverSearch: boolean | null = null; // learnt on the first search

const get = (params: Record<string, any>) => apiCall.get(URL, { params }).then((r) => r.data);
const rowsOf = (d: any): any[] => d?.items ?? d?.Items ?? (Array.isArray(d) ? d : []);
const totalOf = (d: any): number | null => (typeof d?.totalCount === "number" ? d.totalCount : null);

const haystack = (p: any) =>
  [p.policyNo, p.proposalNo, p.surName, p.otherNames, p.fullName, p.assuredCode, p.coverCode, p.covertype, p.mobilePhone, p.landphone, p.email, p.agentcode, p.agentDescription, p.state]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export const searchPolicies = async ({ term, page = 1, pageSize = 25 }: { term: string; page?: number; pageSize?: number }): Promise<PolicySearchPage> => {
  const q = term.trim().replace(/\s+/g, " ");
  const base = { page, pageSize };

  if (!q) {
    const d = await get(base);
    const total = totalOf(d);
    return { items: rowsOf(d), total, hasMore: total !== null ? page * pageSize < total : rowsOf(d).length === pageSize };
  }

  if (serverSearch !== false) {
    const d = await get({ ...base, q });
    if (d && d.search !== undefined) {
      serverSearch = true;
      const total = totalOf(d);
      return { items: rowsOf(d), total, hasMore: total !== null ? page * pageSize < total : rowsOf(d).length === pageSize };
    }
    serverSearch = false;
  }

  // Older API: search the fields it can filter with the longest word, then keep rows matching every word.
  const words = q.toLowerCase().split(" ");
  const key = [...words].sort((a, b) => b.length - a.length)[0];
  const answers = await Promise.allSettled([{ policyNo: key }, { surname: key }, { assuredCode: key }, { coverCode: key }].map((p) => get({ ...base, ...p })));
  if (answers.every((a) => a.status === "rejected")) throw (answers[0] as PromiseRejectedResult).reason;
  const seen = new Map<string, any>();
  let more = false;
  for (const a of answers) {
    if (a.status !== "fulfilled") continue;
    const rows = rowsOf(a.value);
    const total = totalOf(a.value);
    if (total !== null ? page * pageSize < total : rows.length === pageSize) more = true;
    for (const r of rows) seen.set(r.policyNo || r.transGUID, r);
  }
  const items = [...seen.values()].filter((r) => words.every((w) => haystack(r).includes(w)));
  return { items, total: null, hasMore: more };
};
