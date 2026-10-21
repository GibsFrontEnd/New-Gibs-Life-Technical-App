// Documents tab of an individual policy: the files attached to it (legacy "Docs.") and the generated policy document.
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Download, FileText, FileBadge, Loader2, Trash2, Upload } from "lucide-react";
import { SERVER_URL } from "../../utils/constants";
import { EmptyState, Panel, StatusChip, btnIcon, btnOutline, btnPrimary, inputBase, tableCls } from "../page/PageKit";

interface AttachDocument {
  attachID: number;
  docNo: string | null;
  entryDate: string;
  docTypes: string | null;
  docFrom: string | null;
  docDetails: string | null;
  documentSize: number;
  active: number;
  submittedBy: string | null;
  submittedOn: string;
}

const DOC_TYPES = ["POLICY", "KYC", "CLAIM", "CORRESPONDENCE", "OTHER"];
const DOC_FROM = ["CLIENT", "COMPANY", "AGENT", "OTHER"];

const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || ""}` });

const submittedBy = () => {
  try {
    const raw = localStorage.getItem("user") || localStorage.getItem("userInfo") || localStorage.getItem("currentUser");
    if (raw) {
      const p = JSON.parse(raw);
      return p.username ?? p.userName ?? p.email ?? p.name ?? "Unknown";
    }
  } catch {
    /* fall through */
  }
  return "Unknown";
};

const fmtSize =(b: number) => (!b ? "—" : b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`);
const fmtDate = (d: string) => {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
};

const looksLikeFilename = (s: string | null) => !!s && /\.[a-z0-9]{2,5}$/i.test(s.trim());

const save = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const errorFrom = async (res: Response, fallback: string) => {
  const text = await res.text().catch(() => "");
  try {
    const j = JSON.parse(text);
    return j.message || j.title || `${fallback} (${res.status})`;
  } catch {
    return text && text.length < 200 ? text : `${fallback} (${res.status})`;
  }
};

const PolicyDocumentsPanel = ({ policyNo }: { policyNo: string }) => {
  const [docs, setDocs] = useState<AttachDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  const [docType, setDocType] = useState("POLICY");
  const [docFrom, setDocFrom] = useState("CLIENT");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!policyNo) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${SERVER_URL}/v1/Documents/docno?docNo=${encodeURIComponent(policyNo)}`, { headers: auth() });
      if (res.status === 404 || res.status === 204) {
        setDocs([]);
        return;
      }
      if (!res.ok) throw new Error(await errorFrom(res, "Couldn't load documents"));
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || "Couldn't load documents");
    } finally {
      setLoading(false);
    }
  }, [policyNo]);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async () => {
    if (!file) {
      setNotice({ ok: false, text: "Choose a file to upload." });
      return;
    }
    setUploading(true);
    setNotice(null);
    try {
      const fd = new FormData();
      fd.append("DocNo", policyNo);
      fd.append("DocTypes", docType);
      fd.append("DocFrom", docFrom);
      fd.append("DocumentFile", file);
      fd.append("OptionType", "POLY");
      fd.append("SubmittedBy", submittedBy());
      const res = await fetch(`${SERVER_URL}/v1/Documents`, { method: "POST", headers: auth(), body: fd });
      if (!res.ok) throw new Error(await errorFrom(res, "Upload failed"));
      setNotice({ ok: true, text: `${file.name} uploaded.` });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (e: any) {
      setNotice({ ok: false, text: e.message || "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const download = async (d: AttachDocument) => {
    setBusyId(d.attachID);
    setNotice(null);
    try {
      const res = await fetch(`${SERVER_URL}/v1/Documents/${d.attachID}/file`, { headers: auth() });
      if (!res.ok) throw new Error(await errorFrom(res, "Download failed"));
      // the file endpoint always names the file "<docNo>.bin"; the uploaded name survives in docDetails
      save(await res.blob(), looksLikeFilename(d.docDetails) ? d.docDetails!.trim() : `document-${d.attachID}`);
    } catch (e: any) {
      setNotice({ ok: false, text: e.message || "Download failed" });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (d: AttachDocument) => {
    if (!window.confirm(`Delete this ${d.docTypes || "document"}?`)) return;
    setBusyId(d.attachID);
    setNotice(null);
    try {
      const res = await fetch(`${SERVER_URL}/v1/Documents/${d.attachID}`, { method: "DELETE", headers: auth() });
      if (!res.ok) throw new Error(await errorFrom(res, "Delete failed"));
      setNotice({ ok: true, text: "Document deleted." });
      await load();
    } catch (e: any) {
      setNotice({ ok: false, text: e.message || "Delete failed" });
    } finally {
      setBusyId(null);
    }
  };

  const generate = async () => {
    setGenerating(true);
    setNotice(null);
    try {
      const res = await fetch(`${SERVER_URL}/PolicyDocument?policyNo=${encodeURIComponent(policyNo)}`, { headers: auth() });
      if (!res.ok) throw new Error(await errorFrom(res, "Couldn't generate the policy document"));
      const cd = res.headers.get("content-disposition");
      const m = cd && /filename\*?=(?:UTF-8'')?"?([^;"]+)"?/i.exec(cd);
      save(await res.blob(), m?.[1] ? decodeURIComponent(m[1]) : `${policyNo.replace(/\//g, "-")}.docx`);
    } catch (e: any) {
      setNotice({ ok: false, text: e.message || "Couldn't generate the policy document" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-6">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Policy document</h2>
          <p className="mt-0.5 text-sm text-slate-500">The policy schedule, filled in from the policy record and the product template.</p>
        </div>
        <button type="button" onClick={generate} disabled={generating} className={btnPrimary}>
          {generating ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
          {generating ? "Generating…" : "Generate policy document"}
        </button>
      </section>

      <Panel title="Attach a document" description="Proof of identity, signed forms, letters and any other file for this policy." bodyClassName="p-5 sm:p-6">
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-[1fr_180px_180px_auto]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500">File</span>
            <input ref={fileRef} type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className={inputBase + " py-2"} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500">Document type</span>
            <select value={docType} onChange={(e) => setDocType(e.target.value)} className={inputBase}>
              {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500">Received from</span>
            <select value={docFrom} onChange={(e) => setDocFrom(e.target.value)} className={inputBase}>
              {DOC_FROM.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <button type="button" onClick={upload} disabled={uploading || !file} className={btnPrimary + " h-12"}>
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            Upload
          </button>
        </div>
      </Panel>

      {notice && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${notice.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
          {notice.text}
        </div>
      )}

      <Panel flush>
        {error ? (
          <EmptyState
            icon={AlertCircle}
            title="Couldn't load documents"
            description={error}
            action={<button onClick={load} className={btnOutline}>Retry</button>}
          />
        ) : (
          <div className={tableCls.wrap}>
            <table className={tableCls.table}>
              <thead className={tableCls.thead}>
                <tr>
                  <th className={tableCls.th}>Document</th>
                  <th className={tableCls.th + " w-[140px]"}>Type</th>
                  <th className={tableCls.th + " hidden w-[130px] @3xl:table-cell"}>Added</th>
                  <th className={tableCls.th + " w-[100px]"}>Status</th>
                  <th className={tableCls.th + " w-[92px] text-right"}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {docs.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        icon={FileBadge}
                        title={loading ? "Loading documents…" : "No documents attached"}
                        description={loading ? undefined : "Attach a file above to keep it with this policy."}
                      />
                    </td>
                  </tr>
                ) : (
                  docs.map((d) => (
                    <tr key={d.attachID} className={tableCls.tr}>
                      <td className={tableCls.td}>
                        <div className={tableCls.primary} title={d.docDetails || ""}>{d.docDetails || `Document ${d.attachID}`}</div>
                        <div className={tableCls.secondary}>{[fmtSize(d.documentSize), d.docFrom && `from ${String(d.docFrom).toLowerCase()}`].filter(Boolean).join(" · ")}</div>
                      </td>
                      <td className={tableCls.td}>{d.docTypes || "—"}</td>
                      <td className={tableCls.td + " hidden @3xl:table-cell"}>
                        <div className="truncate text-slate-900">{fmtDate(d.entryDate || d.submittedOn)}</div>
                        {d.submittedBy && <div className={tableCls.secondary}>{d.submittedBy}</div>}
                      </td>
                      <td className={tableCls.td}><StatusChip status={d.active === 1 ? "Active" : "Inactive"} /></td>
                      <td className={tableCls.td}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => download(d)} disabled={busyId === d.attachID} title="Download" aria-label="Download" className={btnIcon}>
                            {busyId === d.attachID ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                          </button>
                          <button onClick={() => remove(d)} disabled={busyId === d.attachID} title="Delete" aria-label="Delete" className={btnIcon}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
};

export default PolicyDocumentsPanel;
