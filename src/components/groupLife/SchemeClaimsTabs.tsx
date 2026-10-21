// Claim History and Payouts tabs of a group life scheme (also usable for any policy number).
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ClipboardList, Wallet } from "lucide-react";
import apiCall from "../../utils/api-call";
import { EmptyState, Panel, StatusChip, btnPrimary, tableCls } from "../page/PageKit";

const money = (n: number | null | undefined) =>
  n == null ? "—" : `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
};

const CLAIM_TYPES: Record<string, string> = {
  MV: "Maturity",
  SV: "Surrender",
  DB: "Death benefit",
  PWD: "Partial withdrawal",
  CLAIM: "Claim",
};

const Stat = ({ title, value, hint }: { title: string; value: string; hint?: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
    <p className="text-xs font-medium text-slate-500">{title}</p>
    <p className="mt-1 truncate text-xl font-bold text-slate-900" title={value}>{value}</p>
    {hint && <p className="mt-0.5 truncate text-xs text-slate-500">{hint}</p>}
  </div>
);

/** Loads /v1/PolicyClaims/<what>?policyNo= and tracks loading / error. */
const useClaimsData = <T,>(what: "history" | "payouts", policyNo: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!policyNo) return;
    setLoading(true);
    setError("");
    try {
      const r = await apiCall.get(`/v1/PolicyClaims/${what}`, { params: { policyNo } });
      setData(r.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || `Couldn't load the ${what === "history" ? "claim history" : "payouts"}.`);
    } finally {
      setLoading(false);
    }
  }, [what, policyNo]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, load };
};

const Failed = ({ title, error, onRetry }: { title: string; error: string; onRetry: () => void }) => (
  <Panel flush>
    <EmptyState icon={AlertCircle} title={title} description={error} action={<button onClick={onRetry} className={btnPrimary}>Retry</button>} />
  </Panel>
);

// ---------------------------------------------------------------- Claim History
interface ClaimRow {
  claimNo: string | null;
  policyNo: string | null;
  recType: string | null;
  insuredName: string | null;
  notifyDate: string | null;
  lossDate: string | null;
  lossDetails: string | null;
  amount: number;
  paidAmount: number;
  status: string | null;
}
interface ClaimHistory {
  totalClaims: number;
  totalReserved: number;
  totalPaid: number;
  items: ClaimRow[];
}

export const ClaimHistoryTab = ({ policyNo }: { policyNo: string }) => {
  const { data, loading, error, load } = useClaimsData<ClaimHistory>("history", policyNo);

  if (error) return <Failed title="Couldn't load the claim history" error={error} onRetry={load} />;

  const items = data?.items ?? [];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat title="Claims" value={String(data?.totalClaims ?? 0)} hint={policyNo} />
        <Stat title="Reserved" value={money(data?.totalReserved ?? 0)} hint="Amount set aside for the claims" />
        <Stat title="Paid" value={money(data?.totalPaid ?? 0)} hint="Paid out against those claims" />
      </div>

      <Panel title="Claim history" description="Every claim raised against this scheme, latest first." flush>
        <div className={tableCls.wrap}>
          <table className={tableCls.table}>
            <thead className={tableCls.thead}>
              <tr>
                <th className={tableCls.th + " w-[170px]"}>Claim</th>
                <th className={tableCls.th}>Insured</th>
                <th className={tableCls.th + " hidden w-[130px] @3xl:table-cell"}>Loss date</th>
                <th className={tableCls.th + " w-[170px] text-right"}>Reserved</th>
                <th className={tableCls.th + " w-[120px]"}>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={ClipboardList}
                      title={loading ? "Loading claim history…" : "No claims on this scheme"}
                      description={loading ? undefined : "Claims raised against the scheme appear here."}
                    />
                  </td>
                </tr>
              ) : (
                items.map((c, i) => (
                  <tr key={`${c.claimNo}-${i}`} className={tableCls.tr}>
                    <td className={tableCls.td}>
                      <div className={tableCls.primary} title={c.claimNo || ""}>{c.claimNo || "—"}</div>
                      <div className={tableCls.secondary}>{CLAIM_TYPES[c.recType || ""] || c.recType || "—"}</div>
                    </td>
                    <td className={tableCls.td}>
                      <div className={tableCls.primary} title={c.insuredName || ""}>{c.insuredName?.trim() || "—"}</div>
                      <div className={tableCls.secondary} title={c.lossDetails || ""}>{c.lossDetails?.trim() || `Notified ${fmtDate(c.notifyDate)}`}</div>
                    </td>
                    <td className={tableCls.td + " hidden @3xl:table-cell"}>
                      <div className="truncate text-slate-900">{fmtDate(c.lossDate)}</div>
                      <div className={tableCls.secondary}>notified {fmtDate(c.notifyDate)}</div>
                    </td>
                    <td className={tableCls.td + " text-right"}>
                      <div className={tableCls.primary}>{money(c.amount)}</div>
                      <div className={tableCls.secondary}>paid {money(c.paidAmount)}</div>
                    </td>
                    <td className={tableCls.td}><StatusChip status={c.status || "Pending"} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && data.totalClaims > items.length && (
          <p className="border-t border-slate-100 px-5 py-3 text-sm text-slate-500">Showing the latest {items.length} of {data.totalClaims} claims.</p>
        )}
      </Panel>
    </div>
  );
};

// ---------------------------------------------------------------- Payouts
interface PayoutRow {
  date: string | null;
  voucherNo: string | null;
  payee: string | null;
  policyNo: string | null;
  narration: string | null;
  amount: number;
  amountPaid: number;
  status: string | null;
}
interface Payouts {
  totalPayouts: number;
  totalPaid: number;
  items: PayoutRow[];
}

export const PayoutsTab = ({ policyNo }: { policyNo: string }) => {
  const { data, loading, error, load } = useClaimsData<Payouts>("payouts", policyNo);

  if (error) return <Failed title="Couldn't load the payouts" error={error} onRetry={load} />;

  const items = data?.items ?? [];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Stat title="Payouts" value={String(data?.totalPayouts ?? 0)} hint={policyNo} />
        <Stat title="Total paid out" value={money(data?.totalPaid ?? 0)} hint="Claim payments made on this scheme" />
      </div>

      <Panel title="Payouts" description="Claim payments made on this scheme, latest first." flush>
        <div className={tableCls.wrap}>
          <table className={tableCls.table}>
            <thead className={tableCls.thead}>
              <tr>
                <th className={tableCls.th + " w-[130px]"}>Date</th>
                <th className={tableCls.th}>Voucher</th>
                <th className={tableCls.th + " w-[170px] text-right"}>Amount paid</th>
                <th className={tableCls.th + " w-[130px]"}>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      icon={Wallet}
                      title={loading ? "Loading payouts…" : "No payouts yet"}
                      description={loading ? undefined : "Claim payments made on the scheme appear here."}
                    />
                  </td>
                </tr>
              ) : (
                items.map((p, i) => (
                  <tr key={`${p.voucherNo}-${i}`} className={tableCls.tr}>
                    <td className={tableCls.td}>{fmtDate(p.date)}</td>
                    <td className={tableCls.td}>
                      <div className={tableCls.primary} title={p.voucherNo || ""}>{p.voucherNo || "—"}</div>
                      <div className={tableCls.secondary} title={p.narration || ""}>{p.narration?.trim() || p.payee?.trim() || p.policyNo || "—"}</div>
                    </td>
                    <td className={tableCls.td + " text-right"}>
                      <div className={tableCls.primary}>{money(p.amountPaid)}</div>
                      {p.amount !== p.amountPaid && <div className={tableCls.secondary}>of {money(p.amount)}</div>}
                    </td>
                    <td className={tableCls.td}><StatusChip status={p.status || "—"} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && data.totalPayouts > items.length && (
          <p className="border-t border-slate-100 px-5 py-3 text-sm text-slate-500">Showing the latest {items.length} of {data.totalPayouts} payouts.</p>
        )}
      </Panel>
    </div>
  );
};
