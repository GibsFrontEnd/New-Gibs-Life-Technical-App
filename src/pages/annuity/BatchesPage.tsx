// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { annuityApi } from "@/api/annuity";
import { Banner, Btn, Card, Field, KV, Modal, Pager, StatusBadge, Table, errMsg, fmtDate, inputCls, money } from "@/components/annuity/ui";
import { useModalParam, useUrlPage, useUrlParam } from "@/components/annuity/useUrlState";

const PAGE_SIZE = 20;
const STATUSES = ["", "PENDING_APPROVAL", "APPROVED", "EXECUTED", "RECONCILED", "REJECTED"];

const BatchesPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  // page, filter and the open batch live in the URL: Back/Forward/refresh/shared links work
  const [page, setPage] = useUrlPage();
  const [status, setStatus] = useUrlParam("status");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [detail, setDetail] = useState<any>(null);
  const modal = useModalParam("open");
  const openNo = modal.value;
  const [detailErr, setDetailErr] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [reason, setReason] = useState("");
  const [exec, setExec] = useState({ bankReference: "", paymentMethod: "BANK TRANSFER" });
  const [failed, setFailed] = useState<Record<number, string>>({});
  const [bankAmount, setBankAmount] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await annuityApi.batches({ page, pageSize: PAGE_SIZE, status: status || undefined });
      setRows(res.items ?? []);
      setTotal(res.totalCount ?? 0);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async (no = openNo!) => setDetail(await annuityApi.batch(no));

  useEffect(() => {
    if (!openNo) return;
    setDetail(null);
    setDetailErr("");
    setNotice("");
    setFailed({});
    setReason("");
    refresh(openNo).catch((e) => setDetailErr(errMsg(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openNo]);

  const close = () => {
    modal.close();
    setDetail(null);
    load();
  };

  const run = async (fn: () => Promise<any>, ok: (r: any) => string) => {
    setBusy(true);
    setDetailErr("");
    setNotice("");
    try {
      const r = await fn();
      setNotice(ok(r));
      await refresh();
    } catch (e) {
      setDetailErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const b = detail?.batch;
  const items = detail?.items ?? [];
  const included = items.filter((i: any) => i.result === "INCLUDED");

  return (
    <Card
      title="Annuity payment batches"
      actions={
        <select className={inputCls + " !w-auto"} value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s ? s.replace("_", " ") : "All statuses"}</option>
          ))}
        </select>
      }
    >
      {error && <Banner kind="error">{error}</Banner>}
      <Table
        head={["Batch", "As of", "Policies", "Items", "Exceptions", "Net amount", "Paid", "Created by", "Status", ""]}
        empty={!loading && rows.length === 0 ? "No payment batches. Create one from Due payments." : loading ? "Loading…" : undefined}
      >
        {rows.map((r) => (
          <tr key={r.batchNo} className="hover:bg-gray-50">
            <td className="px-3 py-2 font-medium text-blue-900">{r.batchNo}</td>
            <td className="px-3 py-2">{fmtDate(r.asOfDate)}</td>
            <td className="px-3 py-2">{r.policyCount}</td>
            <td className="px-3 py-2">{r.itemCount}</td>
            <td className="px-3 py-2">{r.exceptionCount}</td>
            <td className="px-3 py-2">{money(r.netAmount)}</td>
            <td className="px-3 py-2">{r.status === "EXECUTED" || r.status === "RECONCILED" ? money(r.paidAmount) : "—"}</td>
            <td className="px-3 py-2 text-xs">{r.createdBy}</td>
            <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
            <td className="px-3 py-2 text-right"><Btn size="sm" variant="secondary" onClick={() => modal.open(r.batchNo)}>Open</Btn></td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />

      {openNo && (
        <Modal title={`Payment batch ${openNo}`} wide onClose={close}>
          {detailErr && <Banner kind="error">{detailErr}</Banner>}
          {notice && <Banner kind="success">{notice}</Banner>}
          {!detail && !detailErr && <p className="text-sm text-gray-500">Loading…</p>}

          {b && (
            <>
              <div className="flex items-center gap-3"><StatusBadge status={b.status} /></div>
              <KV
                items={[
                  ["As of", fmtDate(b.asOfDate)],
                  ["Policies / items", `${b.policyCount} / ${b.itemCount}`],
                  ["Exceptions", b.exceptionCount],
                  ["Gross", money(b.grossAmount)],
                  ["Deductions", money(b.deductionAmount)],
                  ["Net", money(b.netAmount)],
                  ["Created by", `${b.createdBy} · ${fmtDate(b.createdOn)}`],
                  ["Approved by", b.approvedBy ? `${b.approvedBy} · ${fmtDate(b.approvedOn)}` : "—"],
                  ["Executed", b.executedBy ? `${b.executedBy} · ${fmtDate(b.executedOn)} · ${b.bankReference}` : "—"],
                  ["Paid", ["EXECUTED", "RECONCILED"].includes(b.status) ? money(b.paidAmount) : "—"],
                  ["Reconciled", b.reconciledBy ? `${b.reconciledBy} · ${money(b.bankStatementAmount)}` : "—"],
                  ["Decision reason", b.decisionReason],
                ]}
              />

              {b.status === "PENDING_APPROVAL" && (
                <div className="space-y-2 rounded-md border p-3">
                  <h4 className="m-0 text-sm font-semibold text-blue-900">Checker review</h4>
                  <p className="m-0 text-xs text-gray-500">The user who created the batch cannot approve it.</p>
                  <Field label="Reason (required to reject)"><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
                  <div className="flex gap-2">
                    <Btn busy={busy} onClick={() => run(() => annuityApi.approveBatch(openNo!), () => "Batch approved.")}>Approve batch</Btn>
                    <Btn variant="danger" busy={busy} onClick={() => reason.trim() ? run(() => annuityApi.rejectBatch(openNo!, reason), () => "Batch rejected; instalments released.") : setDetailErr("Enter a reason to reject.")}>Reject</Btn>
                  </div>
                </div>
              )}

              {b.status === "APPROVED" && (
                <div className="space-y-3 rounded-md border p-3">
                  <h4 className="m-0 text-sm font-semibold text-blue-900">Record bank execution</h4>
                  <p className="m-0 text-xs text-gray-500">
                    Everything not ticked as rejected is treated as paid and recorded in the payment records (undDNCN), marked PAID. Items that no longer pass validation are released automatically.
                  </p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Field label="Bank reference" required><input className={inputCls} value={exec.bankReference} onChange={(e) => setExec({ ...exec, bankReference: e.target.value })} /></Field>
                    <Field label="Method"><input className={inputCls} value={exec.paymentMethod} onChange={(e) => setExec({ ...exec, paymentMethod: e.target.value })} /></Field>
                  </div>
                  <Table head={["Bank rejected?", "Policy", "#", "Net", "Rejection reason"]}>
                    {included.map((i: any) => (
                      <tr key={i.itemID}>
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={i.paymentID in failed}
                            onChange={(e) => {
                              const f = { ...failed };
                              if (e.target.checked) f[i.paymentID] = ""; else delete f[i.paymentID];
                              setFailed(f);
                            }} />
                        </td>
                        <td className="px-3 py-2">{i.policyNo}</td>
                        <td className="px-3 py-2">{i.paymentNo}</td>
                        <td className="px-3 py-2">{money(i.netBenefit)}</td>
                        <td className="px-3 py-2">
                          {i.paymentID in failed && <input className={inputCls} value={failed[i.paymentID]} onChange={(e) => setFailed({ ...failed, [i.paymentID]: e.target.value })} placeholder="Reason from bank" />}
                        </td>
                      </tr>
                    ))}
                  </Table>
                  <Btn busy={busy} disabled={!exec.bankReference}
                    onClick={() => window.confirm(`Execute batch ${openNo}? Payments will be recorded.`) &&
                      run(() => annuityApi.executeBatch(openNo!, { ...exec, failures: Object.entries(failed).map(([id, r]) => ({ paymentId: Number(id), reason: r })) }),
                        (r) => `Executed: ${r.paid} paid (${money(r.paidAmount)}), ${r.notPaid} not paid.`)}>
                    Execute batch
                  </Btn>
                </div>
              )}

              {b.status === "EXECUTED" && (
                <div className="space-y-2 rounded-md border p-3">
                  <h4 className="m-0 text-sm font-semibold text-blue-900">Reconcile with bank statement</h4>
                  <div className="flex items-end gap-3">
                    <Field label="Amount on bank statement (₦)" hint={`Expected ${money(b.paidAmount)}`}>
                      <input type="number" step="0.01" className={inputCls} value={bankAmount} onChange={(e) => setBankAmount(e.target.value)} />
                    </Field>
                    <Btn busy={busy} disabled={!bankAmount} onClick={() => run(() => annuityApi.reconcileBatch(openNo!, { bankStatementAmount: Number(bankAmount) }), () => "Batch reconciled.")}>Reconcile</Btn>
                  </div>
                </div>
              )}

              <h4 className="text-sm font-semibold text-blue-900">Items</h4>
              <Table head={["Policy", "#", "Gross", "Deductions", "Net", "Result", "Reason"]} empty={items.length === 0 ? "No items." : undefined}>
                {items.map((i: any) => (
                  <tr key={i.itemID}>
                    <td className="px-3 py-2">{i.policyNo}</td>
                    <td className="px-3 py-2">{i.paymentNo}</td>
                    <td className="px-3 py-2">{money(i.grossBenefit)}</td>
                    <td className="px-3 py-2">{money(i.deductions)}</td>
                    <td className="px-3 py-2">{money(i.netBenefit)}</td>
                    <td className="px-3 py-2"><StatusBadge status={i.result} /></td>
                    <td className="px-3 py-2 text-xs">{i.reason}</td>
                  </tr>
                ))}
              </Table>
            </>
          )}
        </Modal>
      )}
    </Card>
  );
};

export default BatchesPage;
