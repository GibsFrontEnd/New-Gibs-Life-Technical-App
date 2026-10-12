import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import apiCall from "../../../utils/api-call";

interface AutoNumberRow {
  numID: number;
  numType: string;
  branchID: string;
  riskID?: string | null;
  nextValue: number;
  format: string;
  sample?: string | null;
  lastUpdated?: string | null;
}

interface FormState {
  numType: string;
  branchID: string;
  riskID: string;
  nextValue: number;
  format: string;
}

const EMPTY: FormState = { numType: "POLICY", branchID: "ALL", riskID: "", nextValue: 1, format: "$SR$/$YR$/$00000$/$BR$" };

const TOKENS: { token: string; meaning: string }[] = [
  { token: "$SR$", meaning: "Sub-risk code, e.g. GOTB" },
  { token: "$RC$", meaning: "Risk code (from the sub-risk)" },
  { token: "$YR$", meaning: "2-digit year, e.g. 26" },
  { token: "$MO$", meaning: "2-digit month" },
  { token: "$BR$", meaning: "Branch id, e.g. 100" },
  { token: "$BR2$", meaning: "Branch short code, e.g. HO" },
  { token: "$P$", meaning: "Endorsement letter (A/C/R/E/N)" },
  { token: "$00000$", meaning: "Serial number; the zeros set the width" },
];

// What each numbering type is used for, across every product (individual, group, credit, annuity, general business)
const TYPE_HELP: Record<string, string> = {
  POLICY: "Policy and proposal numbers (general business, individual life, annuity)",
  POLICY_GRP: "Group life scheme policy numbers",
  PROPOSAL: "Declaration / batch numbers on fire and motor proposals",
  CERTNO: "Certificate numbers for each risk item or vehicle, and group life members",
  DECLARATION_NO: "Calculation-level certificate numbers on fire and motor",
  ENDTNO: "Endorsement numbers (fire, motor and group life)",
  DNOTE: "Debit note numbers",
  CNOTE: "Credit note numbers",
  RECEIPT: "Receipt numbers",
  CLAIM: "Claim numbers",
  INSURED: "Customer (insured) ids",
  AGENTS: "Agent ids",
  BROKER: "Broker ids",
  VOUCHER: "Payment vouchers",
  JOURNAL: "Journal vouchers",
  OTHERS: "Quotation numbers and other general references",
};

const errMsg = (e: any) => e?.response?.data?.message || e?.response?.data?.title || e?.message || "Request failed";

const CompanyAutoNumbers = () => {
  const [rows, setRows] = useState<AutoNumberRow[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState("");
  const [previewError, setPreviewError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [list, t] = await Promise.all([apiCall.get("/AutoNumberSettings"), apiCall.get("/AutoNumberSettings/types")]);
      setRows(list.data || []);
      setTypes(t.data || []);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live preview of the format being edited (does not consume a number)
  useEffect(() => {
    if (!form) return;
    setPreviewError("");
    const handle = setTimeout(async () => {
      try {
        const res = await apiCall.post("/AutoNumberSettings/preview", {
          format: form.format,
          nextValue: Number(form.nextValue) || 1,
          branchID: form.branchID === "ALL" ? "HO" : form.branchID,
          subRiskID: form.riskID || "GOTB",
        });
        setPreview(res.data?.data || "");
      } catch (e) {
        setPreview("");
        setPreviewError(errMsg(e));
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [form?.format, form?.nextValue, form?.branchID, form?.riskID]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.numType, r.branchID, r.riskID, r.format].some((v) => (v || "").toLowerCase().includes(q)));
  }, [rows, filter]);

  const openNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY });
    setNotice("");
  };

  const openEdit = (r: AutoNumberRow) => {
    setEditingId(r.numID);
    setForm({ numType: r.numType, branchID: r.branchID, riskID: r.riskID || "", nextValue: r.nextValue, format: r.format });
    setNotice("");
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setError("");
    try {
      const body = { ...form, nextValue: Number(form.nextValue) || 1, riskID: form.riskID || null, sample: preview || null };
      if (editingId == null) await apiCall.post("/AutoNumberSettings", body);
      else await apiCall.put(`/AutoNumberSettings/${editingId}`, body);
      setNotice(editingId == null ? "Auto number format created." : "Auto number format updated.");
      setForm(null);
      await load();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: AutoNumberRow) => {
    if (!window.confirm(`Delete the ${r.numType} format for branch ${r.branchID}${r.riskID ? ` / ${r.riskID}` : ""}?`)) return;
    try {
      await apiCall.delete(`/AutoNumberSettings/${r.numID}`);
      setNotice("Auto number format deleted.");
      await load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const set = (patch: Partial<FormState>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const inputCls = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-4 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          className={`${inputCls} max-w-xs`}
          placeholder="Search type, branch, risk or format"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="flex gap-2">
          <button onClick={load} className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={openNew} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add format
          </button>
        </div>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</div>}

      {form && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editingId == null ? "New auto number format" : "Edit auto number format"}</h3>
            <button onClick={() => setForm(null)} aria-label="Close" className="p-1 text-gray-500 hover:text-gray-800">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-sm">
              <span className="mb-1 block text-gray-600">Type</span>
              <select className={inputCls} value={form.numType} onChange={(e) => set({ numType: e.target.value })}>
                {(types.length ? types : [form.numType]).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {TYPE_HELP[form.numType] && <span className="mt-1 block text-xs text-gray-500">{TYPE_HELP[form.numType]}</span>}
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-gray-600">Branch (ALL = every branch)</span>
              <input className={inputCls} value={form.branchID} onChange={(e) => set({ branchID: e.target.value.toUpperCase() })} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-gray-600">Risk / sub-risk (optional)</span>
              <input className={inputCls} value={form.riskID} onChange={(e) => set({ riskID: e.target.value.toUpperCase() })} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-gray-600">Next serial number</span>
              <input type="number" min={1} className={inputCls} value={form.nextValue} onChange={(e) => set({ nextValue: Number(e.target.value) })} />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-gray-600">Format</span>
            <input className={`${inputCls} font-mono`} value={form.format} onChange={(e) => set({ format: e.target.value })} />
          </label>

          <div className="flex flex-wrap gap-1.5">
            {TOKENS.map((t) => (
              <button
                key={t.token}
                type="button"
                title={t.meaning}
                onClick={() => set({ format: form.format + t.token })}
                className="rounded border border-gray-300 bg-white px-2 py-1 font-mono text-xs hover:bg-gray-100"
              >
                {t.token}
              </button>
            ))}
          </div>

          <div className="rounded-md bg-white border border-gray-200 px-3 py-2 text-sm">
            <span className="text-gray-500">Preview: </span>
            {previewError ? <span className="text-red-600">{previewError}</span> : <span className="font-mono font-semibold">{preview || "…"}</span>}
            <span className="ml-2 text-xs text-gray-400">(sample branch HO / sub-risk GOTB when not set)</span>
          </div>

          {editingId != null && (
            <p className="text-xs text-amber-700">
              Changing the next serial number can create duplicate numbers if it is set at or below one already issued.
            </p>
          )}

          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setForm(null)} className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Branch</th>
              <th className="px-3 py-2">Risk</th>
              <th className="px-3 py-2">Format</th>
              <th className="px-3 py-2 text-right">Next no.</th>
              <th className="px-3 py-2">Sample</th>
              <th className="px-3 py-2 w-24" />
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.numID} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2">
                  <div className="font-medium">{r.numType}</div>
                  {TYPE_HELP[r.numType] && <div className="text-xs text-gray-500">{TYPE_HELP[r.numType]}</div>}
                </td>
                <td className="px-3 py-2">{r.branchID}</td>
                <td className="px-3 py-2">{r.riskID || "—"}</td>
                <td className="px-3 py-2 font-mono">{r.format}</td>
                <td className="px-3 py-2 text-right">{r.nextValue}</td>
                <td className="px-3 py-2 font-mono text-gray-500">{r.sample || ""}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(r)} aria-label="Edit" className="rounded p-1.5 hover:bg-gray-200">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(r)} aria-label="Delete" className="rounded p-1.5 text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!visible.length && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-400">
                  {loading ? "Loading…" : "No auto number formats found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="mb-2 text-sm font-semibold">Format tokens</h4>
        <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {TOKENS.map((t) => (
            <div key={t.token}>
              <code className="mr-2 rounded bg-gray-100 px-1.5 py-0.5">{t.token}</code>
              <span className="text-gray-600">{t.meaning}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Example: <code>$SR$/$YR$/$00000$/$BR$</code> gives <code>GOTB/26/00941/HO</code>. Rows are looked up in this order: branch
          ALL (risk blank), then the exact branch (risk blank), then branch + risk. So a risk-specific row is only used when no ALL or
          branch-wide row exists for that type.
        </p>
      </div>
    </div>
  );
};

export default CompanyAutoNumbers;
