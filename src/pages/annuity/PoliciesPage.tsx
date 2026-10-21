// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { annuityApi } from "@/api/annuity";
import { Banner, Btn, Card, Field, KV, Modal, Pager, StatusBadge, Table, errMsg, fmtDate, inputCls, isoDate, money, pct, printSchedule } from "@/components/annuity/ui";
import { useModalParam, useUrlPage, useUrlParam } from "@/components/annuity/useUrlState";

const PAGE_SIZE = 20;
const STATUSES = ["", "IN FORCE", "PAYMENT SUSPENDED", "DEATH REPORTED", "SETTLED"];
const METHODS = ["IN-PERSON", "BIOMETRIC", "NOTARISED-CERTIFICATE", "BANK-CONFIRMATION"];

const PoliciesPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  // page, filter, the open policy and its tab live in the URL: Back/Forward/refresh/shared links work
  const [page, setPage] = useUrlPage();
  const [status, setStatus] = useUrlParam("status");
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
  const [due, setDue] = useState<any>(null);

  const modal = useModalParam("open", ["tab"]);
  const openNo = modal.value;
  const [tab, setTab] = useUrlParam("tab", "overview", false);
  const [detail, setDetail] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [detailErr, setDetailErr] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [life, setLife] = useState({ verificationMethod: METHODS[0], verificationDate: isoDate(), expiryDate: "", notes: "" });
  const [reason, setReason] = useState("");
  const [death, setDeath] = useState({ dateOfDeath: "", reportedBy: "", evidenceReference: "", notes: "" });
  const [regen, setRegen] = useState({ horizonYears: "", reason: "" });
  const [pay, setPay] = useState<any>(null);
  const [schedPage, setSchedPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await annuityApi.policies(term ? { page: 1, pageSize: 500, status: status || undefined } : { page, pageSize: PAGE_SIZE, status: status || undefined });
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

  const loadDetail = async (no = openNo!) => {
    const [d, s, c] = await Promise.all([annuityApi.policy(no), annuityApi.schedule(no, true), annuityApi.lifeCertificates(no)]);
    setDetail(d);
    setSchedule(s);
    setCerts(c);
  };

  // Load the policy whenever the URL says one is open (also covers refresh and direct links).
  useEffect(() => {
    setDetail(null);
    setDetailErr("");
    setNotice("");
    setSchedPage(1);
    setReason("");
    if (!openNo) return;
    let cancelled = false;
    loadDetail(openNo).catch((e) => !cancelled && setDetailErr(errMsg(e)));
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
      await loadDetail();
      return r;
    } catch (e) {
      setDetailErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const showDue = async () => {
    try {
      setDue(await annuityApi.lifeDue(30));
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const policy = detail?.policy;
  const calc = detail?.calculation;
  const sum = detail?.schedule;
  const active = schedule.filter((s) => s.paymentStatus !== "CANCELLED");
  const visibleSched = active.slice((schedPage - 1) * 24, schedPage * 24);
  const noReason = () => {
    if (!reason.trim()) {
      setDetailErr("A reason is required.");
      return true;
    }
    return false;
  };

  const visible = rows.filter((r) => {
    const s = term.toLowerCase();
    return !s || [r.policyNo, r.fullName, r.assuredCode].some((x) => String(x ?? "").toLowerCase().includes(s));
  });

  return (
    <Card
      title="Annuity policies"
      actions={
        <>
          <input type="search" className={inputCls + " !w-64"} placeholder="Search name or number…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className={inputCls + " !w-auto"} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s || "All statuses"}</option>
            ))}
          </select>
          <Btn size="sm" variant="secondary" onClick={showDue}>Life certificates due</Btn>
        </>
      }
    >
      {error && <Banner kind="error">{error}</Banner>}
      <Table
        head={["Policy", "Customer", "Purchase price", "Status", ""]}
        cols={["w-[170px]", "", "w-[160px]", "w-[130px]", "w-[90px]"]}
        empty={!loading && visible.length === 0 ? "No annuity policies found." : loading ? "Loading…" : undefined}
      >
        {visible.map((r) => (
          <tr key={r.policyNo} className="hover:bg-gray-50">
            <td className="px-3 py-2">
              <div className="whitespace-nowrap font-semibold text-slate-900">{r.policyNo}</div>
              <div className="text-xs text-slate-500">From {fmtDate(r.startDate)}</div>
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
            <td className="px-3 py-2 text-right"><Btn size="sm" variant="secondary" onClick={() => open(r.policyNo)}>Open</Btn></td>
          </tr>
        ))}
      </Table>
      {!term && <Pager page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />}

      {due && (
        <Modal title="Life certificates due or missing (next 30 days)" onClose={() => setDue(null)}>
          <Table head={["Policy", "Customer", "Product", "Certificate expires"]} empty={due.items.length === 0 ? "All in-force policies have a current certificate." : undefined}>
            {due.items.map((i: any) => (
              <tr key={i.policyNo}>
                <td className="px-3 py-2 font-semibold text-slate-900">{i.policyNo}</td>
                <td className="px-3 py-2">{i.fullName}</td>
                <td className="px-3 py-2">{i.coverCode}</td>
                <td className="px-3 py-2">{i.expiry ? fmtDate(i.expiry) : <span className="text-red-700">None on record</span>}</td>
              </tr>
            ))}
          </Table>
          <p className="text-xs text-gray-500">Only policies whose product requires life verification are blocked from payment; guaranteed instalments are always payable.</p>
        </Modal>
      )}

      {openNo && (
        <Modal title={`Annuity policy ${openNo}`} wide onClose={() => { modal.close(); load(); }}>
          {detailErr && <Banner kind="error">{detailErr}</Banner>}
          {notice && <Banner kind="success">{notice}</Banner>}
          {!detail && !detailErr && <p className="text-sm text-gray-500">Loading…</p>}

          {policy && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={policy.status} />
                <div className="ml-auto flex flex-wrap gap-1">
                  {[["overview", "Overview"], ["schedule", "Payment schedule"], ["life", "Life verification"], ["actions", "Actions"]].map(([k, l]) => (
                    <button key={k} type="button" onClick={() => setTab(k)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${tab === k ? "bg-[#155dfd] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {tab === "overview" && (
                <>
                  <KV
                    items={[
                      ["Customer", policy.fullName],
                      ["Proposal", policy.proposalNo],
                      ["Product", policy.covertype ?? policy.coverCode],
                      ["Purchase price", money(policy.sumAssured)],
                      ["Commencement", fmtDate(policy.startDate)],
                      ["Guarantee ends", policy.maturityDate ? fmtDate(policy.maturityDate) : "No guarantee"],
                      ["Bank / Account", [policy.bankName, policy.accountNo].filter(Boolean).join(" · ") || "Missing"],
                      ["Mobile", policy.mobilePhone],
                      ["Email", policy.email],
                    ]}
                  />
                  {calc && (
                    <>
                      <h4 className="text-sm font-semibold text-slate-900">Approved benefit</h4>
                      <KV
                        items={[
                          ["Periodic benefit", money(calc.periodicBenefit)],
                          ["Tax", money(calc.taxAmount)],
                          ["Net per payment", money(calc.netPeriodicBenefit)],
                          ["Annual benefit", money(calc.annualBenefit)],
                          ["Frequency", `${calc.paymentFrequency} (${calc.paymentConvention === "ADVANCE" ? "advance" : "arrears"})`],
                          ["Escalation", pct(calc.escalationRate)],
                          ["Factor", `${calc.actuarialFactor} (v${calc.factorVersion})`],
                          ["Deferred", calc.deferredMonths ? `${calc.deferredMonths} months` : "None"],
                        ]}
                      />
                    </>
                  )}
                  {sum && (
                    <>
                      <h4 className="text-sm font-semibold text-slate-900">Schedule position</h4>
                      <KV
                        items={[
                          ["Instalments", sum.totalInstalments],
                          ["Paid", `${sum.paid} (${money(sum.totalPaid)})`],
                          ["Outstanding", `${sum.outstanding} (${money(sum.totalOutstanding)})`],
                          ["Next due", fmtDate(sum.nextDueDate)],
                        ]}
                      />
                    </>
                  )}
                </>
              )}

              {tab === "schedule" && (
                <>
                  <div className="mb-2 flex justify-end">
                    <Btn size="sm" variant="secondary" disabled={active.length === 0}
                      onClick={() => printSchedule({ title: "Annuity payment schedule", reference: openNo, customer: detail?.policy?.fullName, product: detail?.policy?.covertype, frequency: detail?.policy?.fop, rows: active })}>
                      Print schedule
                    </Btn>
                  </div>
                  <Table head={["#", "Period", "Due date", "Gross", "Tax", "Net", "Status", "Reference", ""]} empty={active.length === 0 ? "No schedule generated." : undefined}>
                    {visibleSched.map((s) => (
                      <tr key={s.paymentID}>
                        <td className="px-3 py-2">{s.paymentNo}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">{fmtDate(s.periodStartDate)} – {fmtDate(s.periodEndDate)}</td>
                        <td className="px-3 py-2">{fmtDate(s.dueDate)}</td>
                        <td className="px-3 py-2">{money(s.grossBenefit)}</td>
                        <td className="px-3 py-2">{money(s.taxAmount)}</td>
                        <td className="px-3 py-2 font-medium">{money(s.netBenefit)}</td>
                        <td className="px-3 py-2"><StatusBadge status={s.paymentStatus} /></td>
                        <td className="px-3 py-2 text-xs">{s.transactionReference}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          {["PENDING", "DUE", "FAILED"].includes(s.paymentStatus) && new Date(s.dueDate) <= new Date() && (
                            <Btn size="sm" onClick={() => setPay({ id: s.paymentID, no: s.paymentNo, net: s.netBenefit, ref: "", method: "BANK TRANSFER", bank: "" })}>Pay</Btn>
                          )}
                          {s.paymentStatus === "PAID" && (
                            <Btn size="sm" variant="danger" onClick={() => {
                              const r = window.prompt(`Reason for reversing payment ${s.paymentNo}?`);
                              if (r) run(() => annuityApi.reverse(s.paymentID, r), () => `Payment ${s.paymentNo} reversed.`);
                            }}>Reverse</Btn>
                          )}
                        </td>
                      </tr>
                    ))}
                  </Table>
                  <Pager page={schedPage} pageSize={24} total={active.length} onPage={setSchedPage} />
                </>
              )}

              {tab === "life" && (
                <>
                  <h4 className="text-sm font-semibold text-slate-900">Record life verification</h4>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <Field label="Method" required>
                      <select className={inputCls} value={life.verificationMethod} onChange={(e) => setLife({ ...life, verificationMethod: e.target.value })}>
                        {METHODS.map((m) => <option key={m}>{m}</option>)}
                      </select>
                    </Field>
                    <Field label="Verified on"><input type="date" max={isoDate()} className={inputCls} value={life.verificationDate} onChange={(e) => setLife({ ...life, verificationDate: e.target.value })} /></Field>
                    <Field label="Valid until" hint="Blank = product default"><input type="date" className={inputCls} value={life.expiryDate} onChange={(e) => setLife({ ...life, expiryDate: e.target.value })} /></Field>
                    <Field label="Notes"><input className={inputCls} value={life.notes} onChange={(e) => setLife({ ...life, notes: e.target.value })} /></Field>
                  </div>
                  <Btn busy={busy} onClick={() => run(() => annuityApi.recordLife(openNo!, { ...life, expiryDate: life.expiryDate || undefined, notes: life.notes || undefined }), () => "Life verification recorded.")}>Record verification</Btn>
                  <h4 className="pt-2 text-sm font-semibold text-slate-900">History</h4>
                  <Table head={["Method", "Verified", "Expires", "By", "Status"]} empty={certs.length === 0 ? "No certificates recorded." : undefined}>
                    {certs.map((c) => (
                      <tr key={c.certificateID}>
                        <td className="px-3 py-2">{c.verificationMethod}</td>
                        <td className="px-3 py-2">{fmtDate(c.verificationDate)}</td>
                        <td className="px-3 py-2">{fmtDate(c.expiryDate)}</td>
                        <td className="px-3 py-2 text-xs">{c.verifiedBy}</td>
                        <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                      </tr>
                    ))}
                  </Table>
                </>
              )}

              {tab === "actions" && (
                <div className="space-y-5">
                  <section className="space-y-2 rounded-md border p-3">
                    <h4 className="m-0 text-sm font-semibold text-slate-900">Payments</h4>
                    <Field label="Reason (required)"><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
                    <div className="flex gap-2">
                      {policy.status === "IN FORCE" && <Btn variant="secondary" busy={busy} onClick={() => !noReason() && run(() => annuityApi.suspend(openNo!, reason), () => "Payments suspended.")}>Suspend payments</Btn>}
                      {policy.status === "PAYMENT SUSPENDED" && <Btn busy={busy} onClick={() => !noReason() && run(() => annuityApi.resume(openNo!, reason), () => "Payments resumed.")}>Resume payments</Btn>}
                    </div>
                  </section>

                  {policy.status === "IN FORCE" && (
                    <section className="space-y-2 rounded-md border p-3">
                      <h4 className="m-0 text-sm font-semibold text-slate-900">Regenerate payment schedule</h4>
                      <p className="m-0 text-xs text-gray-500">Cancels unpaid instalments and creates a new schedule version. Not allowed once any instalment has been paid.</p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        {!(calc?.guaranteePeriodYears > 0) && <Field label="Horizon (years)"><input type="number" min="1" max="60" className={inputCls} value={regen.horizonYears} onChange={(e) => setRegen({ ...regen, horizonYears: e.target.value })} /></Field>}
                        <Field label="Reason" required><input className={inputCls} value={regen.reason} onChange={(e) => setRegen({ ...regen, reason: e.target.value })} /></Field>
                      </div>
                      <Btn variant="secondary" busy={busy} onClick={() => run(() => annuityApi.generateSchedule(openNo!, { regenerate: true, reason: regen.reason, horizonYears: regen.horizonYears ? Number(regen.horizonYears) : undefined }), (r) => `Schedule version ${r.scheduleVersion} generated (${r.instalments} instalments).`)}>Regenerate schedule</Btn>
                    </section>
                  )}

                  {["IN FORCE", "PAYMENT SUSPENDED"].includes(policy.status) && (
                    <section className="space-y-2 rounded-md border border-red-200 p-3">
                      <h4 className="m-0 text-sm font-semibold text-red-800">Report death of annuitant</h4>
                      <p className="m-0 text-xs text-gray-500">Payments stop immediately. A different user must verify the notification before the benefit can be calculated.</p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <Field label="Date of death" required><input type="date" max={isoDate()} className={inputCls} value={death.dateOfDeath} onChange={(e) => setDeath({ ...death, dateOfDeath: e.target.value })} /></Field>
                        <Field label="Reported by" required><input className={inputCls} value={death.reportedBy} onChange={(e) => setDeath({ ...death, reportedBy: e.target.value })} /></Field>
                        <Field label="Evidence reference"><input className={inputCls} value={death.evidenceReference} onChange={(e) => setDeath({ ...death, evidenceReference: e.target.value })} /></Field>
                        <Field label="Notes"><input className={inputCls} value={death.notes} onChange={(e) => setDeath({ ...death, notes: e.target.value })} /></Field>
                      </div>
                      <Btn variant="danger" busy={busy} disabled={!death.dateOfDeath || !death.reportedBy}
                        onClick={() => window.confirm("Report this death? Payments will stop immediately.") &&
                          run(() => annuityApi.reportDeath(openNo!, { ...death, evidenceReference: death.evidenceReference || undefined, notes: death.notes || undefined }), () => "Death reported. Payments stopped - see Death & benefits.")}>
                        Report death
                      </Btn>
                    </section>
                  )}
                </div>
              )}
            </>
          )}

          {pay && (
            <Modal title={`Pay instalment ${pay.no}`} onClose={() => setPay(null)}
              footer={<>
                <Btn variant="secondary" onClick={() => setPay(null)}>Cancel</Btn>
                <Btn busy={busy} disabled={!pay.ref} onClick={async () => {
                  const ok = await run(() => annuityApi.pay(pay.id, { paymentMethod: pay.method, bankReference: pay.bank || undefined, transactionReference: pay.ref }), (r) => `Instalment ${r.paymentNo} paid: ${money(r.amount)}.`);
                  if (ok) setPay(null);
                }}>Confirm payment of {money(pay.net)}</Btn>
              </>}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Field label="Transaction reference" required><input className={inputCls} value={pay.ref} onChange={(e) => setPay({ ...pay, ref: e.target.value })} /></Field>
                <Field label="Bank reference"><input className={inputCls} value={pay.bank} onChange={(e) => setPay({ ...pay, bank: e.target.value })} /></Field>
                <Field label="Method"><input className={inputCls} value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })} /></Field>
              </div>
              <Banner kind="info">Large runs should go through a payment batch (maker/checker).</Banner>
            </Modal>
          )}
        </Modal>
      )}
    </Card>
  );
};

export default PoliciesPage;
