// Premium History tab of an individual policy: what has been paid, and every change of terms.
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, History, Receipt, RefreshCw } from "lucide-react";
import { SERVER_URL } from "../../utils/constants";
import { EmptyState, Panel, StatusChip, btnPrimary, tableCls } from "../page/PageKit";

interface Receipt {
  date: string | null;
  voucherNo: string | null;
  type: string | null;
  narration: string | null;
  amount: number;
  amountPaid: number;
  status: string | null;
}

interface Change {
  endorseId: number;
  effectiveDate: string | null;
  previousStartDate: string | null;
  maturityDate: string | null;
  duration: number | null;
  frequency: string | null;
  sumAssured: number | null;
  previousSumAssured: number | null;
  basicPremium: number | null;
  totalPremium: number | null;
  remark: string | null;
}

interface History {
  policyNo: string;
  status: string | null;
  frequency: string | null;
  mop: string | null;
  startDate: string | null;
  maturityDate: string | null;
  sumAssured: number | null;
  basicPremium: number | null;
  totalPremium: number | null;
  totalPaid: number;
  receiptCount: number;
  receipts: Receipt[];
  changes: Change[];
}

const money = (n: number | null | undefined) =>
  n == null ? "—" : `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
};

const label = (s: string | null) => (s ? s.replace(/_/g, " ").toLowerCase() : "—");

const Stat = ({ title, value, hint }: { title: string; value: string; hint?: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
    <p className="text-xs font-medium text-slate-500">{title}</p>
    <p className="mt-1 truncate text-xl font-bold text-slate-900" title={value}>{value}</p>
    {hint && <p className="mt-0.5 truncate text-xs capitalize text-slate-500">{hint}</p>}
  </div>
);

const PremiumHistoryPanel = ({ policyNo }: { policyNo: string }) => {
  const [data, setData] = useState<History | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!policyNo) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${SERVER_URL}/v1/IndividualEndorsement/premium-history?policyNo=${encodeURIComponent(policyNo)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `Couldn't load the premium history (${res.status})`);
      }
      setData(await res.json());
    } catch (e: any) {
      setError(e.message || "Couldn't load the premium history");
    } finally {
      setLoading(false);
    }
  }, [policyNo]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <Panel flush>
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load the premium history"
          description={error}
          action={<button onClick={load} className={btnPrimary}><RefreshCw size={15} /> Retry</button>}
        />
      </Panel>
    );
  }

  if (!data) {
    return (
      <Panel flush>
        <EmptyState icon={History} title={loading ? "Loading premium history…" : "No premium history"} />
      </Panel>
    );
  }

  const outstanding = Math.max(0, data.receipts.reduce((s, r) => s + (r.amount - r.amountPaid), 0));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Current premium" value={money(data.totalPremium)} hint={[data.frequency && label(data.frequency), data.mop && label(data.mop)].filter(Boolean).join(" · ")} />
        <Stat title="Sum assured" value={money(data.sumAssured)} hint={`Basic premium ${money(data.basicPremium)}`} />
        <Stat title="Total received" value={money(data.totalPaid)} hint={`${data.receiptCount} receipt${data.receiptCount === 1 ? "" : "s"}`} />
        <Stat title="Cover period" value={`${fmtDate(data.startDate)}`} hint={`to ${fmtDate(data.maturityDate)}`} />
      </div>

      <Panel title="Premium receipts" description={outstanding > 0 ? `${money(outstanding)} billed but not yet paid on the rows shown.` : "Premiums received on this policy, latest first."} flush>
        <div className={tableCls.wrap}>
          <table className={tableCls.table}>
            <thead className={tableCls.thead}>
              <tr>
                <th className={tableCls.th + " w-[130px]"}>Date</th>
                <th className={tableCls.th}>Receipt</th>
                <th className={tableCls.th + " w-[160px] text-right"}>Amount</th>
                <th className={tableCls.th + " w-[130px]"}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.receipts.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState icon={Receipt} title="No premium received yet" description="Receipts appear here once premium is posted against this policy." />
                  </td>
                </tr>
              ) : (
                data.receipts.map((r, i) => (
                  <tr key={`${r.voucherNo}-${i}`} className={tableCls.tr}>
                    <td className={tableCls.td}>{fmtDate(r.date)}</td>
                    <td className={tableCls.td}>
                      <div className={tableCls.primary} title={r.voucherNo || ""}>{r.voucherNo || "—"}</div>
                      <div className={tableCls.secondary} title={r.narration || ""}>{[label(r.type), r.narration].filter((x) => x && x !== "—").join(" · ")}</div>
                    </td>
                    <td className={tableCls.td + " text-right"}>
                      <div className={tableCls.primary}>{money(r.amountPaid)}</div>
                      {r.amount !== r.amountPaid && <div className={tableCls.secondary}>of {money(r.amount)}</div>}
                    </td>
                    <td className={tableCls.td}><StatusChip status={r.status || "—"} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data.receiptCount > data.receipts.length && (
          <p className="border-t border-slate-100 px-5 py-3 text-sm text-slate-500">Showing the latest {data.receipts.length} of {data.receiptCount} receipts.</p>
        )}
      </Panel>

      <Panel title="Changes to premium and terms" description="Each premium endorsement, latest first." flush>
        <div className={tableCls.wrap}>
          <table className={tableCls.table}>
            <thead className={tableCls.thead}>
              <tr>
                <th className={tableCls.th + " w-[130px]"}>Effective</th>
                <th className={tableCls.th}>Terms</th>
                <th className={tableCls.th + " w-[170px] text-right"}>Sum assured</th>
                <th className={tableCls.th + " w-[170px] text-right"}>Premium</th>
              </tr>
            </thead>
            <tbody>
              {data.changes.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState icon={History} title="No changes yet" description="The premium and terms are as the policy was issued." />
                  </td>
                </tr>
              ) : (
                data.changes.map((c) => (
                  <tr key={c.endorseId} className={tableCls.tr}>
                    <td className={tableCls.td}>{fmtDate(c.effectiveDate)}</td>
                    <td className={tableCls.td}>
                      <div className={tableCls.primary}>{[c.duration != null && `${c.duration} yrs`, c.frequency && label(c.frequency)].filter(Boolean).join(" · ") || "—"}</div>
                      <div className={tableCls.secondary}>Matures {fmtDate(c.maturityDate)}</div>
                    </td>
                    <td className={tableCls.td + " text-right"}>
                      <div className={tableCls.primary}>{money(c.sumAssured)}</div>
                      {c.previousSumAssured != null && c.previousSumAssured !== c.sumAssured && <div className={tableCls.secondary}>was {money(c.previousSumAssured)}</div>}
                    </td>
                    <td className={tableCls.td + " text-right"}>
                      <div className={tableCls.primary}>{money(c.totalPremium)}</div>
                      <div className={tableCls.secondary}>basic {money(c.basicPremium)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};

export default PremiumHistoryPanel;
