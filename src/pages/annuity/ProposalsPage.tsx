// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { annuityApi } from "@/api/annuity";
import { Banner, Btn, Card, Field, KV, Modal, Pager, StatusBadge, Table, errMsg, fmtDate, inputCls, isoDate, money, pct } from "@/components/annuity/ui";
import { useModalParam, useUrlPage, useUrlParam } from "@/components/annuity/useUrlState";

const STATUSES = ["", "PENDING", "REFERRED", "APPROVED", "DECLINED", "ISSUED"];
const PAGE_SIZE = 20;

const ProposalsPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  // page, filter and the open record live in the URL: Back/Forward/refresh/shared links work
  const [page, setPage] = useUrlPage();
  const [statusParam, setStatusParam] = useUrlParam("status", "ALL");
  const status = statusParam === "ALL" ? "" : statusParam;           // "ALL" = the explicit "All statuses" choice
  const setStatus = (v: string) => setStatusParam(v === "" ? "ALL" : v);
  const [search, setSearch] = useState("");
  // The annuity API has no text search: while a term is typed, load every record (up to 500)
  // and search those, instead of only the page on screen.
  const [term, setTerm] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setTerm(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const modal = useModalParam("open");
  const openNo = modal.value;
  const [detail, setDetail] = useState<any>(null);
  const [detailErr, setDetailErr] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  // action inputs
  const [commence, setCommence] = useState("");
  const [reason, setReason] = useState("");
  const [prem, setPrem] = useState({ receiptNo: "", paymentAmount: "", dateofpayment: isoDate(), paymentType: "", bankName: "" });
  const [horizon, setHorizon] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await annuityApi.proposals(term ? { page: 1, pageSize: 500, status: status || undefined } : { page, pageSize: PAGE_SIZE, status: status || undefined });
      setRows(res.items ?? []);
      setTotal(res.totalCount ?? 0);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [page, status, term]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshDetail = async (no = openNo!) => {
    const d = await annuityApi.proposal(no);
    setDetail(d);
    return d;
  };

  // Load the record whenever the URL says one is open (also covers refresh and direct links).
  useEffect(() => {
    setDetail(null);
    setDetailErr("");
    setNotice("");
    setReason("");
    setCommence("");
    if (!openNo) return;
    let cancelled = false;
    refreshDetail(openNo)
      .then((d) => !cancelled && setPrem((s) => ({ ...s, paymentAmount: String(d.proposal.sumAssured ?? "") })))
      .catch((e) => !cancelled && setDetailErr(errMsg(e)));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openNo]);

  const open = (no: string) => modal.open(no);

  const run = async (fn: () => Promise<any>, ok: (r: any) => string) => {
    setBusy(true);
    setDetailErr("");
    setNotice("");
    try {
      const r = await fn();
      setNotice(ok(r));
      await refreshDetail();
      return r;
    } catch (e) {
      setDetailErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const p = detail?.proposal;
  const calcs = detail?.calculations ?? [];
  const formal = calcs.filter((c: any) => c.calculationType === "FORMAL");
  const latest = formal.filter((c: any) => ["CALCULATED", "APPROVED"].includes(c.status)).slice(-1)[0];
  const quote = calcs.find((c: any) => c.calculationType === "QUOTATION");
  const needReason = (d: string) => {
    if (!reason.trim()) {
      setDetailErr(`A reason is required to ${d.toLowerCase()} a proposal.`);
      return false;
    }
    return true;
  };

  const visible = rows.filter((r) => {
    const s = term.toLowerCase();
    return !s || [r.proposalNo, r.fullName, r.assuredCode].some((x) => String(x ?? "").toLowerCase().includes(s));
  });

  return (
    <Card
      title="Annuity proposals"
      actions={
        <>
          <input type="search" className={inputCls + " !w-64"} placeholder="Search name or number…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className={inputCls + " !w-auto"} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s || "All statuses"}</option>
            ))}
          </select>
        </>
      }
    >
      {error && <Banner kind="error">{error}</Banner>}
      <Table
        head={["Proposal", "Customer", "Purchase price", "Status", ""]}
        cols={["w-[170px]", "", "w-[160px]", "w-[130px]", "w-[124px]"]}
        empty={!loading && visible.length === 0 ? "No annuity proposals found." : loading ? "Loading…" : undefined}
      >
        {visible.map((r) => (
          <tr key={r.proposalNo} className="hover:bg-gray-50">
            <td className="px-3 py-2">
              <div className="whitespace-nowrap font-semibold text-slate-900">{r.proposalNo}</div>
              <div className="text-xs text-slate-500">{fmtDate(r.tDate)}</div>
            </td>
            <td className="px-3 py-2">
              <div className="font-semibold text-slate-900">{r.fullName}</div>
              <div className="max-w-[260px] truncate text-xs text-slate-500" title={r.covertype ?? r.coverCode}>{r.covertype ?? r.coverCode}</div>
            </td>
            <td className="px-3 py-2 whitespace-nowrap">
              <div className="font-semibold text-slate-900">{money(r.sumAssured)}</div>
              <div className="text-xs capitalize text-slate-500">{String(r.fop ?? "").toLowerCase()}</div>
            </td>
            <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
            <td className="px-3 py-2 text-right"><Btn size="sm" variant="secondary" onClick={() => open(r.proposalNo)}>Underwrite</Btn></td>
          </tr>
        ))}
      </Table>
      {!term && <Pager page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />}

      {openNo && (
        <Modal title={`Annuity proposal ${openNo}`} wide onClose={() => { modal.close(); load(); }}>
          {detailErr && <Banner kind="error">{detailErr}</Banner>}
          {notice && <Banner kind="success">{notice}</Banner>}
          {!detail && !detailErr && <p className="text-sm text-gray-500">Loading…</p>}

          {p && (
            <>
              <div className="flex items-center gap-3"><StatusBadge status={p.status} /></div>
              <KV
                items={[
                  ["Customer", p.fullName],
                  ["Customer ID", p.assuredCode],
                  ["Date of birth / age", `${fmtDate(p.dateofBirth)} / ${p.age ?? "—"}`],
                  ["Gender", p.sex],
                  ["Product", p.covertype ?? p.coverCode],
                  ["Purchase price", money(p.sumAssured)],
                  ["Frequency", p.fop],
                  ["Guarantee (years)", p.duration || "None"],
                  ["Commencement", fmtDate(p.startDate)],
                  ["ID", [detail.customer?.meansID, detail.customer?.idNo].filter(Boolean).join(" ") || "—"],
                  ["NIN / BVN", [detail.customer?.nin, detail.customer?.bvn].filter(Boolean).join(" / ") || "—"],
                  ["ID issued / expires", detail.customer ? `${fmtDate(detail.customer.idIssueDate)} / ${fmtDate(detail.customer.idExpiryDate)}` : "—"],
                  ["Bank / Account", [p.bankName, p.accountNo].filter(Boolean).join(" · ") || "—"],
                  ["Premium receipt (undDNCN)", detail.premium ? `${detail.premium.receiptNo} · ${money(detail.premium.amount)} · ${fmtDate(detail.premium.receiptDate)}` : "Not issued"],
                ]}
              />

              <h4 className="text-sm font-semibold text-slate-900">Calculations</h4>
              <Table head={["Type", "Status", "Age", "Factor", "Periodic benefit", "Net of tax", "Annual benefit", "Date"]} empty={calcs.length === 0 ? "None." : undefined}>
                {calcs.map((c: any) => (
                  <tr key={c.calculationID}>
                    <td className="px-3 py-2">{c.calculationType}</td>
                    <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                    <td className="px-3 py-2">{c.ageAtCalculation}</td>
                    <td className="px-3 py-2">{c.actuarialFactor} <span className="text-xs text-gray-500">v{c.factorVersion}</span></td>
                    <td className="px-3 py-2">{money(c.periodicBenefit)}</td>
                    <td className="px-3 py-2">{money(c.netPeriodicBenefit)}</td>
                    <td className="px-3 py-2">{money(c.annualBenefit)}</td>
                    <td className="px-3 py-2">{fmtDate(c.calculatedOn)}</td>
                  </tr>
                ))}
              </Table>
              {latest && quote && (
                <Banner kind={latest.benefitDifference ? "info" : "success"}>
                  Quoted {money(quote.periodicBenefit)} → formal {money(latest.periodicBenefit)}{" "}
                  ({latest.benefitDifference > 0 ? "+" : ""}{money(latest.benefitDifference)}). Interest basis {pct(latest.interestRate)}.
                </Banner>
              )}

              {["PENDING", "REFERRED"].includes(p.status) && (
                <div className="space-y-3 rounded-md border border-gray-200 p-3">
                  <h4 className="m-0 text-sm font-semibold text-slate-900">1. Formal calculation</h4>
                  <div className="flex flex-wrap items-end gap-3">
                    <Field label="New commencement date (optional)" hint="Only needed if the quoted date has passed.">
                      <input type="date" min={isoDate()} className={inputCls} value={commence} onChange={(e) => setCommence(e.target.value)} />
                    </Field>
                    <Btn busy={busy} onClick={() => run(() => annuityApi.calculate(openNo!, commence || undefined), (r) => `Formal benefit calculated: ${money(r.periodicBenefit)} ${r.paymentFrequency?.toLowerCase()}.`)}>
                      {formal.length ? "Recalculate" : "Run formal calculation"}
                    </Btn>
                  </div>
                  <h4 className="m-0 pt-2 text-sm font-semibold text-slate-900">2. Underwriting decision</h4>
                  <Field label="Reason (required to refer or decline)">
                    <textarea className={inputCls} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Btn busy={busy} disabled={!latest || latest.status !== "CALCULATED"} onClick={() => run(() => annuityApi.underwrite(openNo!, "APPROVE", reason), () => "Proposal approved.")}>Approve</Btn>
                    <Btn variant="secondary" busy={busy} onClick={() => needReason("Refer") && run(() => annuityApi.underwrite(openNo!, "REFER", reason), () => "Proposal referred.")}>Refer</Btn>
                    <Btn variant="danger" busy={busy} onClick={() => needReason("Decline") && window.confirm("Decline this proposal?") && run(() => annuityApi.underwrite(openNo!, "DECLINE", reason), () => "Proposal declined.")}>Decline</Btn>
                  </div>
                  {!latest && <p className="m-0 text-xs text-gray-500">Run the formal calculation before approving.</p>}
                </div>
              )}

              {p.status === "APPROVED" && (
                <div className="space-y-3 rounded-md border border-gray-200 p-3">
                  <h4 className="m-0 text-sm font-semibold text-slate-900">3. Premium receipt</h4>
                  {detail.premium ? (
                    <Banner kind="success">Receipt <b>{detail.premium.receiptNo}</b> issued for {money(detail.premium.amount)} on {fmtDate(detail.premium.receiptDate)} (undDNCN {detail.premium.dncnNo}).</Banner>
                  ) : (<>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <Field label="Receipt no." required><input className={inputCls} value={prem.receiptNo} onChange={(e) => setPrem({ ...prem, receiptNo: e.target.value })} /></Field>
                    <Field label="Amount received (₦)" required hint={`Purchase price ${money(latest?.purchasePrice ?? p.sumAssured)}`}><input type="number" className={inputCls} value={prem.paymentAmount} onChange={(e) => setPrem({ ...prem, paymentAmount: e.target.value })} /></Field>
                    <Field label="Date received"><input type="date" max={isoDate()} className={inputCls} value={prem.dateofpayment} onChange={(e) => setPrem({ ...prem, dateofpayment: e.target.value })} /></Field>
                    <Field label="Payment type"><input className={inputCls} value={prem.paymentType} onChange={(e) => setPrem({ ...prem, paymentType: e.target.value })} /></Field>
                    <Field label="Bank paid into"><input className={inputCls} value={prem.bankName} onChange={(e) => setPrem({ ...prem, bankName: e.target.value })} /></Field>
                  </div>
                  <Btn busy={busy} disabled={!prem.receiptNo || !prem.paymentAmount}
                    onClick={() => run(() => annuityApi.confirmPremium(openNo!, { ...prem, paymentAmount: Number(prem.paymentAmount), paymentType: prem.paymentType || undefined, bankName: prem.bankName || undefined }), () => "Premium receipt issued (recorded in undDNCN).")}>
                    Issue premium receipt
                  </Btn>
                  </>)}

                  <h4 className="m-0 pt-2 text-sm font-semibold text-slate-900">4. Issue policy</h4>
                  <div className="flex flex-wrap items-end gap-3">
                    {!(latest?.guaranteePeriodYears > 0) && (
                      <Field label="Schedule horizon (years)" hint="Lifetime annuity with no guarantee - default 5.">
                        <input type="number" min="1" max="60" className={inputCls} value={horizon} onChange={(e) => setHorizon(e.target.value)} />
                      </Field>
                    )}
                    <Btn busy={busy} disabled={!detail.premium}
                      onClick={() => window.confirm("Issue the annuity policy and generate its payment schedule?") &&
                        run(() => annuityApi.issue(openNo!, horizon ? Number(horizon) : undefined), (r) => `Policy ${r.policyNo} issued with ${r.scheduledPayments} scheduled payments.`)}>
                      Issue policy
                    </Btn>
                  </div>
                  {!detail.premium && <p className="m-0 text-xs text-gray-500">Issue the premium receipt before issuing the policy.</p>}
                </div>
              )}
            </>
          )}
        </Modal>
      )}
    </Card>
  );
};

export default ProposalsPage;
