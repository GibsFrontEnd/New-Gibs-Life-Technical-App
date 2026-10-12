// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { annuityApi } from "@/api/annuity";
import { Banner, Btn, Card, Field, Modal, StatusBadge, Table, errMsg, fmtDate, inputCls, isoDate, money, pct } from "@/components/annuity/ui";
import { useModalParam } from "@/components/annuity/useUrlState";

const FREQS = ["MONTHLY", "QUARTERLY", "HALF-YEARLY", "ANNUALLY"];
const TYPES = [["ILA", "Immediate Life Annuity"], ["DLA", "Deferred Life Annuity"], ["TCA", "Term Certain Annuity"], ["LAG", "Life Annuity with Guarantee"]];

const blankRule = {
  productCode: "", annuityType: "ILA", frequencies: [...FREQS], allowedGuaranteeYears: "", interestRatePct: "", minEscPct: "0", maxEscPct: "0",
  minimumPremium: "", maximumPremium: "", minimumEntryAge: "", maximumEntryAge: "", minDeferredMonths: "0", maxDeferredMonths: "0",
  paymentConvention: "ARREARS", quotationValidityDays: "30", lifeCertificateValidityMonths: "0", chargePct: "0", fixedCharge: "0", taxPct: "0",
  effectiveFrom: isoDate(),
};

/** Parses pasted / uploaded CSV. Rates are entered as percentages (6 = 6%). */
const parseFactorCsv = (text: string) => {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: any[] = [];
  const errors: string[] = [];
  lines.forEach((line, i) => {
    const c = line.split(",").map((x) => x.trim());
    if (i === 0 && /gender/i.test(c[0] ?? "")) return; // header
    if (c.length < 8) return errors.push(`Line ${i + 1}: expected at least 8 columns`);
    const [gender, minAge, maxAge, guar, freq, interest, esc, factor, from, mort] = c;
    const row = {
      gender: gender || "ALL",
      minimumAge: Number(minAge),
      maximumAge: Number(maxAge),
      guaranteePeriodYears: guar === "" ? null : Number(guar),
      paymentFrequency: freq || null,
      interestRate: Number(interest) / 100,
      escalationRate: Number(esc) / 100,
      annuityFactor: Number(factor),
      effectiveFrom: from || isoDate(),
      mortalityTable: mort || null,
    };
    if ([row.minimumAge, row.maximumAge, row.interestRate, row.escalationRate, row.annuityFactor].some((n) => Number.isNaN(n)))
      return errors.push(`Line ${i + 1}: a numeric column is invalid`);
    out.push(row);
  });
  return { rows: out, errors };
};

const ProductsPage = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [activeOnly, setActiveOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const ruleModal = useModalParam("newRule");     // Back closes the dialog
  const ruleOpen = ruleModal.value === "1";
  const factorsModal = useModalParam("factors");  // the product code
  const [rule, setRule] = useState<any>({ ...blankRule });
  const [ruleErr, setRuleErr] = useState("");

  const [fx, setFx] = useState<{ code: string; rows: any[]; err: string; csv: string; show: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRules(await annuityApi.rules({ activeOnly }));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const num = (v: string) => (v === "" ? null : Number(v));

  const saveRule = async () => {
    setRuleErr("");
    if (!rule.productCode.trim()) return setRuleErr("Enter the product code (it must already exist as a product).");
    if (rule.interestRatePct === "") return setRuleErr("Enter the interest rate.");
    if (rule.frequencies.length === 0) return setRuleErr("Select at least one payment frequency.");
    setBusy(true);
    try {
      await annuityApi.createRule({
        productCode: rule.productCode.trim(),
        annuityType: rule.annuityType,
        allowedFrequencies: rule.frequencies.join(","),
        allowedGuaranteeYears: rule.allowedGuaranteeYears.trim() || null,
        interestRate: Number(rule.interestRatePct) / 100,
        minEscalationRate: Number(rule.minEscPct) / 100,
        maxEscalationRate: Number(rule.maxEscPct) / 100,
        minimumPremium: num(rule.minimumPremium),
        maximumPremium: num(rule.maximumPremium),
        minimumEntryAge: num(rule.minimumEntryAge),
        maximumEntryAge: num(rule.maximumEntryAge),
        minDeferredMonths: Number(rule.minDeferredMonths || 0),
        maxDeferredMonths: Number(rule.maxDeferredMonths || 0),
        paymentConvention: rule.paymentConvention,
        quotationValidityDays: Number(rule.quotationValidityDays || 30),
        lifeCertificateValidityMonths: Number(rule.lifeCertificateValidityMonths || 0),
        chargePercent: Number(rule.chargePct || 0) / 100,
        fixedCharge: Number(rule.fixedCharge || 0),
        taxRate: Number(rule.taxPct || 0) / 100,
        effectiveFrom: rule.effectiveFrom,
      });
      ruleModal.close();
      setNotice(`New rule version saved for ${rule.productCode}. Load actuarial factors for it before quoting.`);
      setRule({ ...blankRule });
      load();
    } catch (e) {
      setRuleErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  // Load the factor table for the product named in the URL (also covers refresh and direct links).
  const factorsCode = factorsModal.value;
  useEffect(() => {
    if (!factorsCode) { setFx(null); return; }
    let cancelled = false;
    setFx({ code: factorsCode, rows: [], err: "", csv: "", show: false });
    annuityApi
      .factors(factorsCode, true)
      .then((rows) => !cancelled && setFx({ code: factorsCode, rows, err: "", csv: "", show: false }))
      .catch((e) => !cancelled && setFx({ code: factorsCode, rows: [], err: errMsg(e), csv: "", show: false }));
    return () => { cancelled = true; };
  }, [factorsCode]);

  const openFactors = (code: string) => factorsModal.open(code);

  const upload = async () => {
    const { rows, errors } = parseFactorCsv(fx!.csv);
    if (errors.length) return setFx({ ...fx!, err: errors.slice(0, 5).join("; ") });
    if (rows.length === 0) return setFx({ ...fx!, err: "Paste or choose a CSV with at least one factor row." });
    setBusy(true);
    try {
      const r = await annuityApi.uploadFactors(fx!.code, rows);
      setNotice(`Factor version ${r.versionNo} loaded for ${fx!.code}: ${r.rowsLoaded} row(s), ${r.rowsSuperseded} superseded.`);
      factorsModal.close();
    } catch (e) {
      setFx({ ...fx!, err: errMsg(e) });
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async (r: any) => {
    const reason = window.prompt(`Reason for deactivating ${r.productCode} v${r.ruleVersion}?`);
    if (!reason) return;
    try {
      await annuityApi.deactivateRule(r.ruleID, reason);
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const toggleFreq = (f: string) =>
    setRule({ ...rule, frequencies: rule.frequencies.includes(f) ? rule.frequencies.filter((x: string) => x !== f) : [...rule.frequencies, f] });
  const rset = (k: string) => (e: any) => setRule({ ...rule, [k]: e.target.value });

  return (
    <Card
      title="Annuity product rules & actuarial factors"
      actions={
        <>
          <label className="flex items-center gap-2 text-xs text-gray-700">
            <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} /> Active only
          </label>
          <Btn size="sm" onClick={() => { setRuleErr(""); ruleModal.open("1"); }}>New rule version</Btn>
        </>
      }
    >
      {error && <Banner kind="error">{error}</Banner>}
      {notice && <Banner kind="success">{notice}</Banner>}
      <Banner kind="info">
        Rules and factors are versioned and never edited: a new version end-dates the previous one, so past quotations and calculations stay reproducible.
        All figures are approved by the insurer's actuary - nothing is hard-coded.
      </Banner>
      <div className="mt-3">
        <Table
          head={["Product", "Type", "Ver.", "Frequencies", "Guarantee", "Interest", "Entry age", "Purchase price", "Escalation", "Convention", "Effective", "Status", ""]}
          empty={!loading && rules.length === 0 ? "No annuity rules yet. Create the product under Product Configuration, then add its rule here." : loading ? "Loading…" : undefined}
        >
          {rules.map((r) => (
            <tr key={r.ruleID} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-medium text-blue-900">{r.productCode}</td>
              <td className="px-3 py-2">{r.annuityType}</td>
              <td className="px-3 py-2">v{r.ruleVersion}</td>
              <td className="px-3 py-2 text-xs">{r.allowedFrequencies}</td>
              <td className="px-3 py-2 text-xs">{r.allowedGuaranteeYears ?? "—"}</td>
              <td className="px-3 py-2">{pct(r.interestRate)}</td>
              <td className="px-3 py-2">{r.minimumEntryAge ?? "—"}–{r.maximumEntryAge ?? "—"}</td>
              <td className="px-3 py-2 text-xs">{r.minimumPremium ? money(r.minimumPremium) : "—"} – {r.maximumPremium ? money(r.maximumPremium) : "—"}</td>
              <td className="px-3 py-2 text-xs">{pct(r.minEscalationRate)}–{pct(r.maxEscalationRate)}</td>
              <td className="px-3 py-2">{r.paymentConvention}</td>
              <td className="px-3 py-2 text-xs whitespace-nowrap">{fmtDate(r.effectiveFrom)}{r.effectiveTo ? ` → ${fmtDate(r.effectiveTo)}` : ""}</td>
              <td className="px-3 py-2"><StatusBadge status={r.isActive ? "VALID" : "CANCELLED"} /></td>
              <td className="px-3 py-2 text-right whitespace-nowrap">
                <Btn size="sm" variant="secondary" onClick={() => openFactors(r.productCode)}>Factors</Btn>{" "}
                {r.isActive && <Btn size="sm" variant="ghost" onClick={() => deactivate(r)}>Deactivate</Btn>}
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {ruleOpen && (
        <Modal title="New annuity rule version" wide onClose={() => ruleModal.close()}
          footer={<><Btn variant="secondary" onClick={() => ruleModal.close()}>Cancel</Btn><Btn busy={busy} onClick={saveRule}>Save rule</Btn></>}>
          {ruleErr && <Banner kind="error">{ruleErr}</Banner>}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Product code" required hint="Must exist as a product (SubRisk)"><input className={inputCls} value={rule.productCode} onChange={rset("productCode")} /></Field>
            <Field label="Annuity type" required>
              <select className={inputCls} value={rule.annuityType} onChange={rset("annuityType")}>{TYPES.map(([v, l]) => <option key={v} value={v}>{v} - {l}</option>)}</select>
            </Field>
            <Field label="Effective from" required><input type="date" className={inputCls} value={rule.effectiveFrom} onChange={rset("effectiveFrom")} /></Field>

            <div className="md:col-span-3">
              <span className="mb-1 block text-xs font-semibold text-gray-600">Payment frequencies offered</span>
              <div className="flex flex-wrap gap-4">
                {FREQS.map((f) => (
                  <label key={f} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={rule.frequencies.includes(f)} onChange={() => toggleFreq(f)} />{f}</label>
                ))}
              </div>
            </div>

            <Field label="Interest rate (%)" required><input type="number" step="0.01" className={inputCls} value={rule.interestRatePct} onChange={rset("interestRatePct")} /></Field>
            <Field label="Guarantee periods (years)" hint="Comma separated, e.g. 5,10,15. Include 0 to allow none. Blank = no guarantee."><input className={inputCls} value={rule.allowedGuaranteeYears} onChange={rset("allowedGuaranteeYears")} /></Field>
            <Field label="Payment convention">
              <select className={inputCls} value={rule.paymentConvention} onChange={rset("paymentConvention")}><option value="ARREARS">Arrears</option><option value="ADVANCE">Advance</option></select>
            </Field>

            <Field label="Minimum purchase price (₦)"><input type="number" className={inputCls} value={rule.minimumPremium} onChange={rset("minimumPremium")} /></Field>
            <Field label="Maximum purchase price (₦)"><input type="number" className={inputCls} value={rule.maximumPremium} onChange={rset("maximumPremium")} /></Field>
            <span />
            <Field label="Minimum entry age"><input type="number" className={inputCls} value={rule.minimumEntryAge} onChange={rset("minimumEntryAge")} /></Field>
            <Field label="Maximum entry age"><input type="number" className={inputCls} value={rule.maximumEntryAge} onChange={rset("maximumEntryAge")} /></Field>
            <span />
            <Field label="Min escalation (%)"><input type="number" step="0.01" className={inputCls} value={rule.minEscPct} onChange={rset("minEscPct")} /></Field>
            <Field label="Max escalation (%)"><input type="number" step="0.01" className={inputCls} value={rule.maxEscPct} onChange={rset("maxEscPct")} /></Field>
            <span />
            <Field label="Min deferred months"><input type="number" className={inputCls} value={rule.minDeferredMonths} onChange={rset("minDeferredMonths")} /></Field>
            <Field label="Max deferred months" hint="Only deferred annuities (DLA)"><input type="number" className={inputCls} value={rule.maxDeferredMonths} onChange={rset("maxDeferredMonths")} /></Field>
            <span />
            <Field label="Charge (% of price)"><input type="number" step="0.01" className={inputCls} value={rule.chargePct} onChange={rset("chargePct")} /></Field>
            <Field label="Fixed charge (₦)"><input type="number" className={inputCls} value={rule.fixedCharge} onChange={rset("fixedCharge")} /></Field>
            <Field label="Tax on payments (%)"><input type="number" step="0.01" className={inputCls} value={rule.taxPct} onChange={rset("taxPct")} /></Field>
            <Field label="Quotation validity (days)"><input type="number" className={inputCls} value={rule.quotationValidityDays} onChange={rset("quotationValidityDays")} /></Field>
            <Field label="Life certificate valid (months)" hint="0 = life verification not required"><input type="number" className={inputCls} value={rule.lifeCertificateValidityMonths} onChange={rset("lifeCertificateValidityMonths")} /></Field>
          </div>
        </Modal>
      )}

      {fx && (
        <Modal title={`Actuarial factors - ${fx.code}`} wide onClose={() => factorsModal.close()}
          footer={<><Btn variant="secondary" onClick={() => setFx({ ...fx, show: !fx.show, err: "" })}>{fx.show ? "Hide upload" : "Load new factor version"}</Btn>{fx.show && <Btn busy={busy} onClick={upload}>Upload factors</Btn>}</>}>
          {fx.err && <Banner kind="error">{fx.err}</Banner>}
          {fx.show && (
            <div className="space-y-2 rounded-md border p-3">
              <p className="m-0 text-xs text-gray-600">
                CSV columns: <code>gender,minAge,maxAge,guaranteeYears,frequency,interestRate%,escalation%,factor,effectiveFrom,mortalityTable</code>.
                Gender M, F or ALL; blank guarantee / frequency = any. Example: <code>M,60,60,10,,6,0,11.469,2026-10-01,SAMPLE</code>.
                Rows that replace existing ones end-date them.
              </p>
              <input type="file" accept=".csv,text/csv" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setFx({ ...fx, csv: await f.text(), err: "" }); }} />
              <textarea className={inputCls + " font-mono text-xs"} rows={7} value={fx.csv} onChange={(e) => setFx({ ...fx, csv: e.target.value })} placeholder="Paste CSV rows here" />
            </div>
          )}
          <Table head={["Ver.", "Gender", "Age", "Guarantee", "Frequency", "Interest", "Escalation", "Factor", "Effective", "Mortality table"]} empty={fx.rows.length === 0 ? "No active factors for this product." : undefined}>
            {fx.rows.map((f) => (
              <tr key={f.factorID}>
                <td className="px-3 py-2">v{f.versionNo}</td>
                <td className="px-3 py-2">{f.gender}</td>
                <td className="px-3 py-2">{f.minimumAge}–{f.maximumAge}</td>
                <td className="px-3 py-2">{f.guaranteePeriodYears ?? "any"}</td>
                <td className="px-3 py-2">{f.paymentFrequency ?? "any"}</td>
                <td className="px-3 py-2">{pct(f.interestRate)}</td>
                <td className="px-3 py-2">{pct(f.escalationRate)}</td>
                <td className="px-3 py-2 font-medium">{f.annuityFactor}</td>
                <td className="px-3 py-2 text-xs whitespace-nowrap">{fmtDate(f.effectiveFrom)}{f.effectiveTo ? ` → ${fmtDate(f.effectiveTo)}` : ""}</td>
                <td className="px-3 py-2 text-xs">{f.mortalityTable}</td>
              </tr>
            ))}
          </Table>
        </Modal>
      )}
    </Card>
  );
};

export default ProductsPage;
