// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { annuityApi } from "@/api/annuity";
import { Banner, Btn, Card, Field, Pager, StatusBadge, Table, errMsg, fmtDate, inputCls, money } from "@/components/annuity/ui";

const TYPES = [
  ["ANN-PREMIUM", "Premium received (Dr bank, Cr annuity liability)"],
  ["ANN-PAYMENT", "Annuity payment, net (Dr annuity liability, Cr bank)"],
  ["ANN-TAX", "Tax deducted (Dr annuity liability, Cr tax payable)"],
  ["ANN-BENEFIT", "Death benefit (Dr annuity liability, Cr bank)"],
];
const PAGE_SIZE = 50;

const GLPage = () => {
  const [maps, setMaps] = useState<any[]>([]);
  const [form, setForm] = useState({ transactionType: "ANN-PREMIUM", productCode: "", debitAccount: "", creditAccount: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [posts, setPosts] = useState<any>({ items: [], totalCount: 0 });
  const [page, setPage] = useState(1);
  const [reference, setReference] = useState("");
  const [glBatchNo, setGlBatchNo] = useState("");

  const loadMaps = useCallback(async () => {
    try {
      setMaps(await annuityApi.glMappings(true));
    } catch (e) {
      setError(errMsg(e));
    }
  }, []);

  const loadPosts = useCallback(async () => {
    try {
      setPosts(await annuityApi.glPostings({ page, pageSize: PAGE_SIZE, reference: reference || undefined, glBatchNo: glBatchNo || undefined }));
    } catch (e) {
      setError(errMsg(e));
    }
  }, [page, reference, glBatchNo]);

  useEffect(() => { loadMaps(); }, [loadMaps]);
  useEffect(() => { loadPosts(); }, [loadPosts]);

  const save = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await annuityApi.saveGlMapping({ ...form, productCode: form.productCode || undefined });
      setNotice(`Mapping for ${form.transactionType} saved.`);
      setForm({ ...form, debitAccount: "", creditAccount: "" });
      loadMaps();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const missing = TYPES.filter(([t]) => !maps.some((m) => m.transactionType === t && !m.productCode));

  return (
    <div className="space-y-4">
      {error && <Banner kind="error">{error}</Banner>}
      {notice && <Banner kind="success">{notice}</Banner>}
      {missing.length > 0 && (
        <Banner kind="info">
          No default ledger mapping for: <b>{missing.map(([t]) => t).join(", ")}</b>. Premium confirmation, payments and benefit settlement are refused until each is mapped.
        </Banner>
      )}

      <Card title="Ledger account mapping">
        <Table head={["Transaction", "Product", "Debit account", "Credit account", "Set by"]} empty={maps.length === 0 ? "No mappings yet." : undefined}>
          {maps.map((m) => (
            <tr key={m.mappingID}>
              <td className="px-3 py-2 font-medium">{m.transactionType}</td>
              <td className="px-3 py-2">{m.productCode ?? "All products"}</td>
              <td className="px-3 py-2">{m.debitAccount}</td>
              <td className="px-3 py-2">{m.creditAccount}</td>
              <td className="px-3 py-2 text-xs">{m.createdBy} · {fmtDate(m.createdDate)}</td>
            </tr>
          ))}
        </Table>
        <h4 className="mb-2 mt-4 text-sm font-semibold text-slate-900">Set accounts</h4>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Field label="Transaction" required className="md:col-span-2">
            <select className={inputCls} value={form.transactionType} onChange={(e) => setForm({ ...form, transactionType: e.target.value })}>
              {TYPES.map(([t, l]) => <option key={t} value={t}>{t} - {l}</option>)}
            </select>
          </Field>
          <Field label="Product (optional)" hint="Blank = all products"><input className={inputCls} value={form.productCode} onChange={(e) => setForm({ ...form, productCode: e.target.value })} /></Field>
          <span />
          <Field label="Debit account" required><input className={inputCls} value={form.debitAccount} onChange={(e) => setForm({ ...form, debitAccount: e.target.value })} /></Field>
          <Field label="Credit account" required><input className={inputCls} value={form.creditAccount} onChange={(e) => setForm({ ...form, creditAccount: e.target.value })} /></Field>
        </div>
        <div className="mt-3"><Btn busy={busy} disabled={!form.debitAccount || !form.creditAccount} onClick={save}>Save mapping</Btn></div>
        <p className="mt-2 text-xs text-gray-500">Saving replaces the active mapping for the same transaction and product. Earlier postings are not changed.</p>
      </Card>

      <Card
        title={`Ledger postings (${posts.totalCount})`}
        actions={
          <>
            <input className={inputCls + " !w-40"} placeholder="Policy / proposal" value={reference} onChange={(e) => { setPage(1); setReference(e.target.value); }} />
            <input className={inputCls + " !w-44"} placeholder="GL batch no." value={glBatchNo} onChange={(e) => { setPage(1); setGlBatchNo(e.target.value); }} />
          </>
        }
      >
        <Table head={["Posted", "GL batch", "Type", "Reference", "Debit", "Credit", "Amount", "Status"]} empty={posts.items.length === 0 ? "No postings." : undefined}>
          {posts.items.map((p: any) => (
            <tr key={p.postingID}>
              <td className="px-3 py-2 whitespace-nowrap">{fmtDate(p.postedOn)}</td>
              <td className="px-3 py-2 text-xs">{p.glBatchNo}</td>
              <td className="px-3 py-2">{p.transactionType}</td>
              <td className="px-3 py-2">{p.reference}</td>
              <td className="px-3 py-2">{p.debitAccount}</td>
              <td className="px-3 py-2">{p.creditAccount}</td>
              <td className="px-3 py-2 font-medium">{money(p.amount)}</td>
              <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
            </tr>
          ))}
        </Table>
        <Pager page={page} pageSize={PAGE_SIZE} total={posts.totalCount} onPage={setPage} />
      </Card>
    </div>
  );
};

export default GLPage;
