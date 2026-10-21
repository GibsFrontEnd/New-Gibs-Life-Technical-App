// Individual-life (investment "B" / traditional "A") endorsements.
// Legacy: modules/individual/endorse_premium, endorse_personnel, endorse_scheme, endorse_merge.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, RefreshCw, Calculator, Save, ChevronRight } from "lucide-react";
import { SearchField, tableCls } from "../../components/page/PageKit";
import { searchPolicies } from "../../api/policySearch";
import apiCall from "../../utils/api-call";
import { useToast } from "../../components/UI/use-toast";

type Tab = "PREMIUM" | "PERSONAL" | "SCHEME" | "MERGE";

const TABS: { key: Tab; label: string }[] = [
  { key: "PREMIUM", label: "Premium & Terms" },
  { key: "PERSONAL", label: "Personal Details" },
  { key: "SCHEME", label: "Change Scheme" },
  { key: "MERGE", label: "Merge Policies" },
];

const BASE = "/v1/IndividualEndorsement";
const fmt = (n: any) =>
  n === null || n === undefined || n === "" ? "—" : `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (d: any) => (d ? String(d).split("T")[0] : "");
const errText = (e: any) => e?.response?.data?.message || e?.response?.data?.title || e?.message || "Request failed";

const FREQUENCIES = ["Single", "Monthly", "Quarterly", "Half-Yearly", "Annually", "Weekly", "Fortnightly", "Daily"];
const FREQ_LABEL: Record<string, string> = {
  SINGLE: "Single", MONTHLY: "Monthly", QUARTERLY: "Quarterly", "HALF-YEARLY": "Half-Yearly", ANNUALLY: "Annually",
  ANNUAL: "Annually", WEEKLY: "Weekly", FORTNIGHTLY: "Fortnightly", FORTHNIGHTLY: "Fortnightly", DAILY: "Daily",
};
const MOPS = ["CASH", "TRANSFER", "CHEQUE", "POS", "DIRECT DEBIT"];

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:border-[#155dfd] focus:ring-4 focus:ring-blue-100 focus:border-[#155dfd] disabled:bg-gray-100";

const Field = ({ label, children }: { label: string; children: any }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-800 mb-1">{label}</label>
    {children}
  </div>
);

const Primary = ({ children, ...p }: any) => (
  <button
    {...p}
    className="flex items-center gap-2 px-5 py-2.5 bg-[#155dfd] text-white rounded-lg text-sm font-semibold hover:bg-opacity-90 disabled:opacity-50"
  >
    {children}
  </button>
);

const Secondary = ({ children, ...p }: any) => (
  <button
    {...p}
    className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
  >
    {children}
  </button>
);

const History = ({ rows, loading }: { rows: any[]; loading: boolean }) => (
  <div className="mt-8">
    <h3 className="text-base font-semibold text-gray-800 mb-2">Endorsement history</h3>
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left px-3 py-2 w-16">#</th>
            <th className="text-left px-3 py-2 w-32">Date</th>
            <th className="text-left px-3 py-2">Details</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={3} className="px-3 py-4 text-gray-500">Loading…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={3} className="px-3 py-4 text-gray-500">No endorsements of this type yet.</td></tr>
          ) : (
            rows.map((r) => (
              <tr key={`${r.type}-${r.endorseId}`} className="border-t border-gray-100">
                <td className="px-3 py-2">{r.endorseId}</td>
                <td className="px-3 py-2">{day(r.date) || "—"}</td>
                <td className="px-3 py-2 text-gray-700">{r.description}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const IndividualEndorsementsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const policyNo = params.get("policyNo") || "";

  // ── policy picker ──
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // ── selected policy ──
  const [policy, setPolicy] = useState<any>(null);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [tab, setTab] = useState<Tab>("PREMIUM");
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [busy, setBusy] = useState(false);

  const fail = (description: string) => toast({ title: "Error", description, variant: "destructive" });
  const ok = (description: string) => toast({ title: "Success", description, variant: "success" });

  // The list fills in as you type (short pause between keystrokes) and searches names, numbers,
  // phone, email, IDs, agent and product (see api/policySearch). With nothing typed it shows the
  // latest in-force policies. More pages load as you scroll. Only the newest request's answer is shown.
  const PAGE = 25;
  const lastSearch = useRef(0);
  const [showList, setShowList] = useState(!policyNo);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const search = async (raw = term, nextPage = 1) => {
    const id = ++lastSearch.current;
    if (nextPage === 1) setSearching(true);
    else setLoadingMore(true);
    try {
      const res = await searchPolicies({ term: raw, page: nextPage, pageSize: PAGE });
      if (id !== lastSearch.current) return;
      setResults((prev) => {
        if (nextPage === 1) return res.items;
        const seen = new Set(prev.map((r) => r.policyNo));
        return [...prev, ...res.items.filter((r) => !seen.has(r.policyNo))];
      });
      setPage(nextPage);
      setTotal(res.total);
      setHasMore(res.hasMore);
    } catch (e) {
      if (id === lastSearch.current) fail(errText(e));
    } finally {
      if (id === lastSearch.current) {
        setSearching(false);
        setLoadingMore(false);
      }
    }
  };

  const loadMore = () => {
    if (hasMore && !searching && !loadingMore) search(term, page + 1);
  };

  useEffect(() => {
    if (!showList) return;
    const t = setTimeout(() => search(term, 1), term.trim() ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, showList]);

  // load the next page when the end of the list scrolls into view
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = endRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((entries) => entries.some((x) => x.isIntersecting) && loadMore(), { root: el.parentElement, rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, page, searching, loadingMore, showList]);

  const loadPolicy = useCallback(async (no: string) => {
    if (!no) { setPolicy(null); return; }
    setLoadingPolicy(true);
    try {
      const res = await apiCall.get(`${BASE}/policy`, { params: { policyNo: no } });
      setPolicy(res.data);
    } catch (e) {
      setPolicy(null);
      toast({ title: "Error", description: errText(e), variant: "destructive" });
    } finally {
      setLoadingPolicy(false);
    }
  }, [toast]);

  const loadHistory = useCallback(async (no: string, type: Tab) => {
    if (!no) return;
    setLoadingHistory(true);
    try {
      const res = await apiCall.get(BASE, { params: { policyNo: no, type } });
      setHistory(res.data ?? []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => { loadPolicy(policyNo); }, [policyNo, loadPolicy]);
  useEffect(() => { if (policy) loadHistory(policy.policyNo, tab); }, [policy?.policyNo, tab, loadHistory]); // eslint-disable-line react-hooks/exhaustive-deps

  // individual life only: investment (B) and traditional (A)
  const listed = results.filter((r) => r.tag === "A" || r.tag === "B");

  const select = (no: string) => {
    setShowList(false);
    setParams({ policyNo: no });
  };

  // after any endorsement: refresh the policy (the number may have changed) and the history
  const afterSave = async (result: any) => {
    ok(result.message);
    if (result.warning) toast({ title: "Note", description: result.warning, variant: "default" });
    if (result.policyNo && result.policyNo !== policyNo) setParams({ policyNo: result.policyNo });
    else { await loadPolicy(policyNo); await loadHistory(policyNo, tab); }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft size={20} /></button>
        <div>
          <p className="text-sm font-medium text-[#155dfd]">Underwriting · Individual</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Policy Endorsements</h1>
        </div>
      </div>

      {/* picker: lists as you type */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-3 p-5 sm:p-6">
          <div className="flex gap-3">
            <SearchField
              value={term}
              onChange={(v) => {
                setTerm(v);
                setShowList(true);
              }}
              onEnter={() => search(term)}
              placeholder="Search by name, policy no., phone, email, NIN, agent or product"
            />
            {!showList && (
              <button
                type="button"
                onClick={() => setShowList(true)}
                className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Search size={16} /> Change policy
              </button>
            )}
          </div>
          {showList && (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              {searching && <RefreshCw size={14} className="animate-spin" />}
              {searching
                ? "Searching…"
                : term.trim()
                  ? total !== null
                    ? `${total.toLocaleString("en-NG")} polic${total === 1 ? "y" : "ies"} matching “${term.trim()}” · showing ${listed.length}`
                    : `${listed.length} polic${listed.length === 1 ? "y" : "ies"} matching “${term.trim()}” so far`
                  : total !== null
                    ? `${total.toLocaleString("en-NG")} in-force policies · showing the latest ${listed.length}. Type to narrow the list.`
                    : "Latest in-force policies. Type to narrow the list."}
            </p>
          )}
        </div>

        {showList && (
          <div className="max-h-[420px] overflow-y-auto border-t border-slate-100">
            {listed.length === 0 ? (
              !searching && !hasMore && <p className="px-6 py-10 text-center text-sm text-slate-500">No individual policies match. Try part of a name, policy number, phone or email.</p>
            ) : (
              <div className={tableCls.wrap}>
                <table className={tableCls.table}>
                  <thead className={tableCls.thead + " sticky top-0 z-10"}>
                    <tr>
                      <th className={tableCls.th + " w-[180px]"}>Policy</th>
                      <th className={tableCls.th}>Insured</th>
                      <th className={tableCls.th + " hidden w-[200px] @3xl:table-cell"}>Product</th>
                      <th className={tableCls.th + " w-[150px] text-right"}>Sum assured</th>
                      <th className={tableCls.th + " w-[48px]"}>
                        <span className="sr-only">Select</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {listed.map((r) => {
                      const name = r.fullName || `${r.surName ?? ""} ${r.otherNames ?? ""}`.trim();
                      const on = r.policyNo === policyNo;
                      return (
                        <tr
                          key={r.policyNo}
                          onClick={() => select(r.policyNo)}
                          className={`${tableCls.tr} cursor-pointer ${on ? "bg-blue-50/70" : ""}`}
                        >
                          <td className={tableCls.td}>
                            <div className={tableCls.primary} title={r.policyNo}>{r.policyNo}</div>
                            <div className={tableCls.secondary}>{r.tag === "A" ? "Traditional" : "Investment"}</div>
                          </td>
                          <td className={tableCls.td}>
                            <div className={tableCls.primary} title={name}>{name || "—"}</div>
                            <div className={tableCls.secondary} title={[r.mobilePhone, r.email].filter(Boolean).join(" · ")}>
                              {[r.mobilePhone, r.email].filter(Boolean).join(" · ") || r.assuredCode || ""}
                            </div>
                          </td>
                          <td className={tableCls.td + " hidden @3xl:table-cell"}>
                            <div className="truncate text-slate-900" title={r.covertype || r.coverCode}>{r.covertype || r.coverCode || "—"}</div>
                          </td>
                          <td className={tableCls.td + " text-right"}>
                            <div className={tableCls.primary}>{fmt(r.sumAssured)}</div>
                          </td>
                          <td className={tableCls.td + " text-right text-slate-400"}>
                            <ChevronRight size={16} className="ml-auto" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {/* more pages: load when this comes into view, or on click */}
            <div ref={endRef} className="flex justify-center px-6 py-3">
              {loadingMore ? (
                <span className="flex items-center gap-2 text-sm text-slate-500"><RefreshCw size={14} className="animate-spin" /> Loading more…</span>
              ) : hasMore && !searching ? (
                <button type="button" onClick={loadMore} className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Load more
                </button>
              ) : listed.length > 0 && !searching ? (
                <span className="text-xs text-slate-400">End of list</span>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {loadingPolicy && <p className="text-gray-500">Loading policy…</p>}

      {policy && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><div className="text-gray-500">Policy</div><div className="font-semibold">{policy.policyNo}</div></div>
            <div><div className="text-gray-500">Insured</div><div className="font-semibold">{policy.fullName}</div></div>
            <div><div className="text-gray-500">Product</div><div className="font-semibold">{policy.productName || policy.productCode}</div></div>
            <div><div className="text-gray-500">Class</div><div className="font-semibold">{policy.tag === "A" ? "Traditional" : "Investment"}</div></div>
            <div><div className="text-gray-500">Sum assured</div><div className="font-semibold">{fmt(policy.sumAssured)}</div></div>
            <div><div className="text-gray-500">Premium</div><div className="font-semibold">{fmt(policy.basicPremium)} ({FREQ_LABEL[String(policy.frequency).toUpperCase()] ?? policy.frequency})</div></div>
            <div><div className="text-gray-500">Cover</div><div className="font-semibold">{day(policy.startDate)} → {day(policy.maturityDate)}</div></div>
            <div><div className="text-gray-500">Age (next birthday)</div><div className="font-semibold">{policy.age ?? "—"}</div></div>
          </div>

          <div className="flex gap-2 border-b border-gray-200 mb-6">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-5 py-3 text-sm font-semibold relative ${tab === t.key ? "text-[#155dfd]" : "text-gray-500 hover:text-gray-700"}`}
              >
                {t.label}
                {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#155dfd]" />}
              </button>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            {tab === "PREMIUM" && <PremiumForm key={policy.policyNo + policy.startDate + policy.sumAssured} policy={policy} busy={busy} setBusy={setBusy} onSaved={afterSave} fail={fail} />}
            {tab === "PERSONAL" && <PersonalForm key={policy.policyNo + policy.surName + policy.address} policy={policy} busy={busy} setBusy={setBusy} onSaved={afterSave} fail={fail} />}
            {tab === "SCHEME" && <SchemeForm policy={policy} busy={busy} setBusy={setBusy} onSaved={afterSave} fail={fail} />}
            {tab === "MERGE" && <MergeForm policy={policy} busy={busy} setBusy={setBusy} onSaved={afterSave} fail={fail} />}
            <History rows={history} loading={loadingHistory} />
          </div>
        </>
      )}
    </div>
  );
};

// ───────────────────────── premium & terms ─────────────────────────
const PremiumForm = ({ policy, busy, setBusy, onSaved, fail }: any) => {
  const isTrad = policy.tag === "A";
  const [f, setF] = useState({
    newStartDate: day(policy.startDate),
    duration: Math.round(Number(policy.duration) || 0),
    frequency: FREQ_LABEL[String(policy.frequency).toUpperCase()] ?? "Monthly",
    mop: String(policy.mop || "").toUpperCase(),
    sumAssured: Number(policy.sumAssured) || 0,
    firstPremium: 0,
    regularSaving: Number(policy.basicPremium) || 0,
  });
  const [quote, setQuote] = useState<any>(null);
  const set = (k: string, v: any) => { setF((p) => ({ ...p, [k]: v })); setQuote(null); };

  const body = () => ({
    policyNo: policy.policyNo,
    newStartDate: f.newStartDate ? new Date(f.newStartDate).toISOString() : null,
    duration: Number(f.duration) || 0,
    frequency: f.frequency,
    mop: f.mop || null,
    ...(isTrad
      ? Number(f.firstPremium) > 0 ? { firstPremium: Number(f.firstPremium) } : { sumAssured: Number(f.sumAssured) }
      : { regularSaving: Number(f.regularSaving) }),
  });

  const calc = async () => {
    setBusy(true);
    try { setQuote((await apiCall.post(`${BASE}/premium/calculate`, body())).data); }
    catch (e) { setQuote(null); fail(errText(e)); }
    finally { setBusy(false); }
  };
  const save = async () => {
    setBusy(true);
    try { onSaved((await apiCall.post(`${BASE}/premium`, body())).data); }
    catch (e) { fail(errText(e)); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Field label="New start date"><input type="date" className={inputCls} value={f.newStartDate} onChange={(e) => set("newStartDate", e.target.value)} /></Field>
        <Field label="Duration (years)"><input type="number" min={1} className={inputCls} value={f.duration} onChange={(e) => set("duration", Number(e.target.value))} /></Field>
        <Field label="Frequency">
          <select className={inputCls} value={f.frequency} onChange={(e) => set("frequency", e.target.value)}>{FREQUENCIES.map((x) => <option key={x}>{x}</option>)}</select>
        </Field>
        <Field label="Mode of payment">
          <select className={inputCls} value={f.mop} onChange={(e) => set("mop", e.target.value)}>
            {!MOPS.includes(f.mop) && <option value={f.mop}>{f.mop || "Select…"}</option>}
            {MOPS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </Field>
        {isTrad ? (
          <>
            <Field label="Sum assured"><input type="number" className={inputCls} disabled={Number(f.firstPremium) > 0} value={f.sumAssured || ""} onChange={(e) => set("sumAssured", Number(e.target.value))} /></Field>
            <Field label="…or premium (calculates the sum assured)"><input type="number" className={inputCls} value={f.firstPremium || ""} onChange={(e) => set("firstPremium", Number(e.target.value))} /></Field>
          </>
        ) : (
          <Field label="Regular saving (per payment)"><input type="number" className={inputCls} value={f.regularSaving || ""} onChange={(e) => set("regularSaving", Number(e.target.value))} /></Field>
        )}
      </div>

      {quote && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-purple-50 border border-purple-100 rounded-lg p-4 text-sm">
          <div><div className="text-gray-500">New sum assured</div><div className="font-semibold">{fmt(quote.sumAssured)}</div><div className="text-xs text-gray-500">was {fmt(quote.previousSumAssured)}</div></div>
          <div><div className="text-gray-500">New premium</div><div className="font-semibold">{fmt(quote.basicPremium)}</div><div className="text-xs text-gray-500">was {fmt(quote.previousPremium)}</div>{Number(quote.riderPremium) > 0 && <div className="text-xs text-gray-500">+ riders {fmt(quote.riderPremium)} = {fmt(quote.totalPremium)}</div>}</div>
          <div><div className="text-gray-500">Age at new start</div><div className="font-semibold">{quote.age}</div></div>
          <div><div className="text-gray-500">New maturity</div><div className="font-semibold">{day(quote.maturityDate)}</div></div>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <Secondary onClick={calc} disabled={busy}><Calculator size={16} /> Calculate</Secondary>
        <Primary onClick={save} disabled={busy || !quote}><Save size={16} /> Save endorsement</Primary>
      </div>
      <p className="text-xs text-gray-500 mt-2">Calculate first, then save. The change takes effect on the policy immediately.</p>
    </div>
  );
};

// ───────────────────────── personal details ─────────────────────────
const PersonalForm = ({ policy, busy, setBusy, onSaved, fail }: any) => {
  const [f, setF] = useState({
    title: policy.title || "", surName: policy.surName || "", otherNames: policy.otherNames || "",
    address: policy.address || "", state: policy.state || "", mobilePhone: policy.mobilePhone || "",
    landphone: policy.landphone || "", email: policy.email || "", maritalStatus: policy.maritalStatus || "",
    sex: policy.sex || "", occupation: policy.occupation || "", dateOfBirth: day(policy.dateOfBirth),
  });
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));
  const text = (k: string, label: string, type = "text") => (
    <Field label={label}><input type={type} className={inputCls} value={(f as any)[k]} onChange={(e) => set(k, e.target.value)} /></Field>
  );

  const save = async () => {
    setBusy(true);
    try {
      onSaved((await apiCall.post(`${BASE}/personal`, {
        policyNo: policy.policyNo, ...f, dateOfBirth: f.dateOfBirth ? new Date(f.dateOfBirth).toISOString() : null,
      })).data);
    } catch (e) { fail(errText(e)); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {text("title", "Title")}{text("surName", "Surname")}{text("otherNames", "Other names")}
        {text("dateOfBirth", "Date of birth", "date")}
        <Field label="Sex">
          <select className={inputCls} value={f.sex} onChange={(e) => set("sex", e.target.value)}>
            {!["Male", "Female"].includes(f.sex) && <option value={f.sex}>{f.sex || "Select…"}</option>}
            <option>Male</option><option>Female</option>
          </select>
        </Field>
        <Field label="Marital status">
          <select className={inputCls} value={f.maritalStatus} onChange={(e) => set("maritalStatus", e.target.value)}>
            {!["Single", "Married", "Divorced", "Widowed"].includes(f.maritalStatus) && <option value={f.maritalStatus}>{f.maritalStatus || "Select…"}</option>}
            {["Single", "Married", "Divorced", "Widowed"].map((x) => <option key={x}>{x}</option>)}
          </select>
        </Field>
        {text("occupation", "Occupation")}{text("mobilePhone", "Mobile phone")}{text("landphone", "Land phone")}
        {text("email", "Email", "email")}{text("state", "State")}
        <div className="md:col-span-3">{text("address", "Address")}</div>
      </div>
      <div className="flex gap-3 mt-6">
        <Primary onClick={save} disabled={busy}><Save size={16} /> Save endorsement</Primary>
      </div>
      <p className="text-xs text-gray-500 mt-2">Changing the date of birth changes the age on the policy but does not re-price it — use Premium &amp; Terms for that.</p>
    </div>
  );
};

// ───────────────────────── change scheme ─────────────────────────
const SchemeForm = ({ policy, busy, setBusy, onSaved, fail }: any) => {
  const [products, setProducts] = useState<any[]>([]);
  const [code, setCode] = useState("");

  useEffect(() => {
    apiCall.get("/v1/Products")
      .then((r) => setProducts((r.data || []).filter((p: any) => p.riskID === policy.tag && p.productID !== policy.productCode)))
      .catch(() => setProducts([]));
  }, [policy.tag, policy.productCode]);

  const save = async () => {
    if (!window.confirm("This gives the policy a NEW policy number and moves its notes and beneficiaries to it. Continue?")) return;
    setBusy(true);
    try { onSaved((await apiCall.post(`${BASE}/scheme`, { policyNo: policy.policyNo, newProductCode: code })).data); }
    catch (e) { fail(errText(e)); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Current scheme"><input className={inputCls} disabled value={policy.productName || policy.productCode || ""} /></Field>
        <Field label="New scheme">
          <select className={inputCls} value={code} onChange={(e) => setCode(e.target.value)}>
            <option value="">Select…</option>
            {products.map((p) => <option key={p.productID} value={p.productID}>{p.productName}</option>)}
          </select>
        </Field>
      </div>
      <div className="flex gap-3 mt-6">
        <Primary onClick={save} disabled={busy || !code}><Save size={16} /> Save endorsement</Primary>
      </div>
      <p className="text-xs text-gray-500 mt-2">Only schemes of the same class are offered. The premium is not re-priced.</p>
    </div>
  );
};

// ───────────────────────── merge ─────────────────────────
const MergeForm = ({ policy, busy, setBusy, onSaved, fail }: any) => {
  const [rows, setRows] = useState<any[]>([]);
  const [pick, setPick] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useMemo(() => async () => {
    setLoading(true);
    try { setRows((await apiCall.get(`${BASE}/merge-candidates`, { params: { policyNo: policy.policyNo } })).data ?? []); }
    catch { setRows([]); }
    finally { setLoading(false); }
  }, [policy.policyNo]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!window.confirm(`Merge ${pick} into ${policy.policyNo}? ${pick} will be cancelled.`)) return;
    setBusy(true);
    try { onSaved((await apiCall.post(`${BASE}/merge`, { policyNo: policy.policyNo, mergePolicyNo: pick })).data); setPick(""); load(); }
    catch (e) { fail(errText(e)); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <p className="text-sm text-gray-600 mb-3">Other in-force policies of the same insured and class that can be folded into <b>{policy.policyNo}</b>.</p>
      {loading ? <p className="text-gray-500">Loading…</p> : rows.length === 0 ? (
        <p className="text-gray-500">No other policy of this insured can be merged.</p>
      ) : (
        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50 text-gray-600"><tr>
            <th className="w-10" /><th className="text-left px-3 py-2">Policy</th><th className="text-left px-3 py-2">Product</th>
            <th className="text-right px-3 py-2">Sum assured</th><th className="text-right px-3 py-2">Premium</th><th className="text-left px-3 py-2">Start</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.policyNo} className="border-t border-gray-100 cursor-pointer" onClick={() => setPick(r.policyNo)}>
                <td className="px-3"><input type="radio" checked={pick === r.policyNo} onChange={() => setPick(r.policyNo)} /></td>
                <td className="px-3 py-2">{r.policyNo}</td><td className="px-3 py-2">{r.productName}</td>
                <td className="px-3 py-2 text-right">{fmt(r.sumAssured)}</td><td className="px-3 py-2 text-right">{fmt(r.basicPremium)}</td>
                <td className="px-3 py-2">{day(r.startDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="flex gap-3 mt-6">
        <Primary onClick={save} disabled={busy || !pick}><Save size={16} /> Merge policies</Primary>
      </div>
      <p className="text-xs text-gray-500 mt-2">Notes and beneficiaries move to this policy and the other policy is cancelled. Sum assured and premium are not added together.</p>
    </div>
  );
};

export default IndividualEndorsementsPage;
