// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { annuityApi } from "@/api/annuity";
import { Banner, Btn, Card, Field, KV, Modal, StatusBadge, Table, errMsg, fmtDate, inputCls, money } from "@/components/annuity/ui";
import { useModalParam, useUrlParam } from "@/components/annuity/useUrlState";

const STATUSES = ["", "REPORTED", "VERIFIED", "CALCULATED", "SETTLED", "REJECTED"];

const DeathsPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useUrlParam("status");
  const modal = useModalParam("open");          // the notification id; Back closes the dialog
  const openId = modal.value;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sel, setSel] = useState<any>(null);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [detailErr, setDetailErr] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [payee, setPayee] = useState({ payeeName: "", payeeBank: "", payeeAccountNo: "", settlementReference: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await annuityApi.deaths({ status: status || undefined }));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  // Resolve the record named in the URL (also covers refresh and direct links, and records hidden by the filter).
  useEffect(() => {
    setBeneficiaries([]);
    setDetailErr("");
    setNotice("");
    setReason("");
    if (!openId) { setSel(null); return; }
    let cancelled = false;
    (async () => {
      let n = rows.find((x: any) => String(x.notificationID) === openId);
      if (!n && !loading) n = (await annuityApi.deaths({})).find((x: any) => String(x.notificationID) === openId);
      if (cancelled) return;
      if (n) setSel(n);
      else if (!loading) setDetailErr(`Death notification ${openId} was not found.`);
    })().catch((e) => !cancelled && setDetailErr(errMsg(e)));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, loading]);

  const open = (n: any) => modal.open(String(n.notificationID));

  const run = async (fn: () => Promise<any>, ok: (r: any) => string) => {
    setBusy(true);
    setDetailErr("");
    setNotice("");
    try {
      const r = await fn();
      setNotice(ok(r));
      const list = await annuityApi.deaths({ status: status || undefined });
      setRows(list);
      const fresh = (await annuityApi.deaths({})).find((x: any) => x.notificationID === sel.notificationID);
      if (fresh) setSel(fresh);
      return r;
    } catch (e) {
      setDetailErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title="Death notifications & benefit settlement"
      actions={
        <select className={inputCls + " !w-auto"} value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || "All statuses"}</option>
          ))}
        </select>
      }
    >
      {error && <Banner kind="error">{error}</Banner>}
      <Table
        head={["Policy", "Date of death", "Reported by", "Recorded", "Benefit", "Status", ""]}
        empty={!loading && rows.length === 0 ? "No death notifications. Deaths are reported from the policy screen." : loading ? "Loading…" : undefined}
      >
        {rows.map((n) => (
          <tr key={n.notificationID} className="hover:bg-gray-50">
            <td className="px-3 py-2 font-medium text-blue-900">{n.policyNo}</td>
            <td className="px-3 py-2">{fmtDate(n.dateOfDeath)}</td>
            <td className="px-3 py-2">{n.reportedBy}</td>
            <td className="px-3 py-2">{fmtDate(n.reportedOn)}</td>
            <td className="px-3 py-2">{n.benefitAmount != null ? money(n.benefitAmount) : "—"}</td>
            <td className="px-3 py-2"><StatusBadge status={n.status} /></td>
            <td className="px-3 py-2 text-right"><Btn size="sm" variant="secondary" onClick={() => open(n)}>Open</Btn></td>
          </tr>
        ))}
      </Table>

      {sel && (
        <Modal title={`Death notification - policy ${sel.policyNo}`} wide onClose={() => { modal.close(); load(); }}>
          {detailErr && <Banner kind="error">{detailErr}</Banner>}
          {notice && <Banner kind="success">{notice}</Banner>}
          <div className="flex items-center gap-3"><StatusBadge status={sel.status} /></div>
          <KV
            items={[
              ["Date of death", fmtDate(sel.dateOfDeath)],
              ["Reported by", sel.reportedBy],
              ["Recorded by", sel.recordedBy],
              ["Evidence", sel.evidenceReference],
              ["Notes", sel.notes],
              ["Verified by", sel.verifiedBy ? `${sel.verifiedBy} · ${fmtDate(sel.verifiedOn)}` : "—"],
              ["Guaranteed instalments", sel.guaranteedAmount != null ? money(sel.guaranteedAmount) : "—"],
              ["Accrued to date of death", sel.arrearsAmount != null ? money(sel.arrearsAmount) : "—"],
              ["Total benefit", sel.benefitAmount != null ? money(sel.benefitAmount) : "—"],
              ["Settled", sel.settledBy ? `${sel.settledBy} · ${fmtDate(sel.settledOn)}` : "—"],
              ["Payee", sel.payeeName],
              ["Settlement ref / DNCN", [sel.settlementReference, sel.settlementDNCNNo].filter(Boolean).join(" · ") || "—"],
            ]}
          />

          {sel.status === "REPORTED" && (
            <div className="space-y-2 rounded-md border p-3">
              <h4 className="m-0 text-sm font-semibold text-blue-900">Verify the death</h4>
              <p className="m-0 text-xs text-gray-500">The person who recorded the notification cannot verify it. Rejecting restores the policy to its previous status.</p>
              <Field label="Reason (required to reject)"><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
              <div className="flex gap-2">
                <Btn busy={busy} onClick={() => run(() => annuityApi.verifyDeath(sel.notificationID, true, reason || undefined), () => "Death verified.")}>Verify</Btn>
                <Btn variant="danger" busy={busy} onClick={() => reason.trim() ? run(() => annuityApi.verifyDeath(sel.notificationID, false, reason), () => "Notification rejected; policy restored.") : setDetailErr("Enter a reason to reject.")}>Reject</Btn>
              </div>
            </div>
          )}

          {["VERIFIED", "CALCULATED"].includes(sel.status) && (
            <div className="space-y-2 rounded-md border p-3">
              <h4 className="m-0 text-sm font-semibold text-blue-900">Benefit calculation</h4>
              <p className="m-0 text-xs text-gray-500">Unpaid guaranteed instalments (undiscounted) plus the amount accrued up to the date of death.</p>
              <Btn busy={busy} onClick={() => run(async () => { const r = await annuityApi.calculateDeath(sel.notificationID); setBeneficiaries(r.beneficiaries ?? []); return r; }, (r) => `Benefit calculated: ${money(r.notification.benefitAmount)}.`)}>
                {sel.status === "CALCULATED" ? "Recalculate" : "Calculate benefit"}
              </Btn>
              {beneficiaries.length > 0 && (
                <Table head={["Beneficiary", "Relationship", "Share %", "Indicative amount"]}>
                  {beneficiaries.map((b, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{b.name}</td>
                      <td className="px-3 py-2">{b.relation}</td>
                      <td className="px-3 py-2">{b.percentage ?? "—"}</td>
                      <td className="px-3 py-2">{b.share != null ? money(b.share) : "—"}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </div>
          )}

          {sel.status === "CALCULATED" && (
            <div className="space-y-3 rounded-md border border-red-200 p-3">
              <h4 className="m-0 text-sm font-semibold text-red-800">Settle benefit - {money(sel.benefitAmount)}</h4>
              <p className="m-0 text-xs text-gray-500">Records the benefit payment, cancels the remaining schedule and closes the policy. The person who calculated the benefit cannot settle it.</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Payee name" required><input className={inputCls} value={payee.payeeName} onChange={(e) => setPayee({ ...payee, payeeName: e.target.value })} /></Field>
                <Field label="Settlement reference" required><input className={inputCls} value={payee.settlementReference} onChange={(e) => setPayee({ ...payee, settlementReference: e.target.value })} /></Field>
                <Field label="Payee bank"><input className={inputCls} value={payee.payeeBank} onChange={(e) => setPayee({ ...payee, payeeBank: e.target.value })} /></Field>
                <Field label="Payee account no."><input className={inputCls} value={payee.payeeAccountNo} onChange={(e) => setPayee({ ...payee, payeeAccountNo: e.target.value })} /></Field>
              </div>
              <Btn variant="danger" busy={busy} disabled={!payee.payeeName || !payee.settlementReference}
                onClick={() => window.confirm("Settle this benefit? This cannot be undone.") &&
                  run(() => annuityApi.settleDeath(sel.notificationID, { ...payee, payeeBank: payee.payeeBank || undefined, payeeAccountNo: payee.payeeAccountNo || undefined }),
                    (r) => `Benefit of ${money(r.benefitAmount)} settled; ${r.instalmentsCancelled} instalment(s) cancelled. Policy ${r.policyStatus}.`)}>
                Settle benefit
              </Btn>
            </div>
          )}
        </Modal>
      )}
    </Card>
  );
};

export default DeathsPage;
