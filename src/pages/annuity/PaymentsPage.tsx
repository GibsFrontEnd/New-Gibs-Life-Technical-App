// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { annuityApi } from "@/api/annuity";
import { Banner, Btn, Card, Field, Modal, Pager, StatusBadge, Table, errMsg, fmtDate, inputCls, isoDate, money } from "@/components/annuity/ui";
import { useModalParam, useUrlPage, useUrlParam } from "@/components/annuity/useUrlState";

const PAGE_SIZE = 50;

const PaymentsPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>({ items: [], totalCount: 0, totalNetAmount: 0 });
  const [page, setPage] = useUrlPage();
  const [policyNo, setPolicyNo] = useUrlParam("policyNo");
  const dialog = useModalParam("dialog");          // "batch" or "pay:<paymentId>" - Back closes the dialog
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [pay, setPay] = useState<any>(null);
  const batchOpen = dialog.value === "batch";
  const [batch, setBatch] = useState({ asOfDate: isoDate(), policyNo: "", maxItems: "1000" });
  const [batchErr, setBatchErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await annuityApi.duePayments({ page, pageSize: PAGE_SIZE, policyNo: policyNo || undefined }));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [page, policyNo]);

  useEffect(() => {
    load();
  }, [load]);

  const toPay = (s: any) => ({ id: s.paymentID, policyNo: s.policyNo, no: s.paymentNo, net: s.netBenefit, ref: "", bank: "", method: "BANK TRANSFER", err: "" });

  // Restore the pay dialog from the URL (refresh / shared link) once the instalment is in the list.
  useEffect(() => {
    const m = /^pay:(d+)$/.exec(dialog.value ?? "");
    if (!m || pay?.id === Number(m[1])) return;
    const row = data.items.find((x: any) => x.paymentID === Number(m[1]));
    if (row) setPay(toPay(row));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog.value, data.items]);

  const markDue = async () => {
    setBusy(true);
    setNotice("");
    try {
      const r = await annuityApi.markDue();
      setNotice(`${r.markedDue} instalment(s) marked DUE.`);
      load();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const createBatch = async () => {
    setBusy(true);
    setBatchErr("");
    try {
      const b = await annuityApi.createBatch({
        asOfDate: batch.asOfDate || undefined,
        policyNo: batch.policyNo || undefined,
        maxItems: batch.maxItems ? Number(batch.maxItems) : undefined,
      });
      // replace (not push) so Back from the batch returns to this list, not to the open dialog
      navigate(`/underwriting/annuity/batches?open=${encodeURIComponent(b.batchNo)}`, { replace: true });
    } catch (e) {
      setBatchErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title={`Instalments due for payment (${data.totalCount})`}
      actions={
        <>
          <input className={inputCls + " !w-44"} placeholder="Filter by policy no." value={policyNo} onChange={(e) => setPolicyNo(e.target.value)} />
          <Btn size="sm" variant="secondary" busy={busy} onClick={markDue}>Mark due today</Btn>
          <Btn size="sm" onClick={() => { setBatchErr(""); dialog.open("batch"); }}>Create payment batch</Btn>
        </>
      }
    >
      {error && <Banner kind="error">{error}</Banner>}
      {notice && <Banner kind="success">{notice}</Banner>}
      <Table
        head={["Policy", "Due date", "Net benefit", "Status", ""]}
        cols={["w-[180px]", "w-[120px]", "", "w-[130px]", "w-[84px]"]}
        empty={!loading && data.items.length === 0 ? "Nothing is due for payment." : loading ? "Loading…" : undefined}
      >
        {data.items.map((s: any) => (
          <tr key={s.paymentID} className="hover:bg-gray-50">
            <td className="px-3 py-2">
              <div className="whitespace-nowrap font-semibold text-slate-900">{s.policyNo}</div>
              <div className="text-xs text-slate-500">Payment #{s.paymentNo}</div>
            </td>
            <td className="px-3 py-2 whitespace-nowrap">{fmtDate(s.dueDate)}</td>
            <td className="px-3 py-2 whitespace-nowrap">
              <div className="font-semibold text-slate-900">{money(s.netBenefit)}</div>
              <div className="text-xs text-slate-500">{money(s.grossBenefit)} gross · {money(s.taxAmount)} tax</div>
            </td>
            <td className="px-3 py-2"><StatusBadge status={s.paymentStatus} /></td>
            <td className="px-3 py-2 text-right">
              <Btn size="sm" variant="secondary" onClick={() => { setPay(toPay(s)); dialog.open("pay:" + s.paymentID); }}>Pay</Btn>
            </td>
          </tr>
        ))}
      </Table>
      {data.items.length > 0 && <p className="mt-2 text-right text-sm text-gray-600">Net on this page: <b>{money(data.totalNetAmount)}</b></p>}
      <Pager page={page} pageSize={PAGE_SIZE} total={data.totalCount} onPage={setPage} />

      {pay && dialog.value === "pay:" + pay.id && (
        <Modal title={`Pay ${pay.policyNo} - instalment ${pay.no}`} onClose={() => dialog.close()}
          footer={<>
            <Btn variant="secondary" onClick={() => dialog.close()}>Cancel</Btn>
            <Btn busy={busy} disabled={!pay.ref} onClick={async () => {
              setBusy(true);
              try {
                await annuityApi.pay(pay.id, { paymentMethod: pay.method, bankReference: pay.bank || undefined, transactionReference: pay.ref });
                setNotice(`Instalment ${pay.no} of ${pay.policyNo} paid (${money(pay.net)}).`);
                dialog.close();
                load();
              } catch (e) {
                setPay({ ...pay, err: errMsg(e) });
              } finally {
                setBusy(false);
              }
            }}>Confirm payment of {money(pay.net)}</Btn>
          </>}>
          {pay.err && <Banner kind="error">{pay.err}</Banner>}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Transaction reference" required><input className={inputCls} value={pay.ref} onChange={(e) => setPay({ ...pay, ref: e.target.value })} /></Field>
            <Field label="Bank reference"><input className={inputCls} value={pay.bank} onChange={(e) => setPay({ ...pay, bank: e.target.value })} /></Field>
            <Field label="Method"><input className={inputCls} value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })} /></Field>
          </div>
          <Banner kind="info">The payment is refused if the policy is not in force, a death is reported, bank details are missing or a required life certificate has expired.</Banner>
        </Modal>
      )}

      {batchOpen && (
        <Modal title="Create payment batch" onClose={() => dialog.close()}
          footer={<><Btn variant="secondary" onClick={() => dialog.close()}>Cancel</Btn><Btn busy={busy} onClick={createBatch}>Create batch</Btn></>}>
          {batchErr && <Banner kind="error">{batchErr}</Banner>}
          <p className="m-0 text-sm text-gray-600">Each due instalment is validated. Valid ones are locked into the batch for a different user to approve; invalid ones are listed as exceptions.</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Due up to" hint="Cannot be in the future"><input type="date" max={isoDate()} className={inputCls} value={batch.asOfDate} onChange={(e) => setBatch({ ...batch, asOfDate: e.target.value })} /></Field>
            <Field label="Policy (optional)"><input className={inputCls} value={batch.policyNo} onChange={(e) => setBatch({ ...batch, policyNo: e.target.value })} /></Field>
            <Field label="Maximum items" hint="Up to 5000"><input type="number" min="1" max="5000" className={inputCls} value={batch.maxItems} onChange={(e) => setBatch({ ...batch, maxItems: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
    </Card>
  );
};

export default PaymentsPage;
