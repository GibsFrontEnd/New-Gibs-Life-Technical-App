// @ts-nocheck
// The "pick one record, then convert it" list shared by Convert to Policy and Convert to Scheme.
// Rows are loaded by the page; search and filters run over them here.
import { useMemo, useState } from "react";
import { AlertCircle, ArrowRight, FileText, RefreshCw, SlidersHorizontal, X } from "lucide-react";
import {
  EmptyState,
  PageHeader,
  PageShell,
  Pager,
  Panel,
  SearchField,
  Segmented,
  StatusChip,
  btnOutline,
  btnPrimary,
  btnRow,
  inputBase,
  tableCls,
} from "./PageKit";

const fmt = (n: any) => (n == null || n === "" ? "—" : `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

const fmtDate = (d: any) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
};

const PAGE_SIZE = 15;

export interface ConvertListViewProps {
  eyebrow: string;
  title: string;
  description?: string;
  tabs?: { value: string; label: string; icon?: any }[];
  tab?: string;
  onTab?: (v: string) => void;
  items: any[];
  loading: boolean;
  error?: string | null;
  onRetry: () => void;
  /** What one record is called ("proposal", "quotation"). */
  noun: string;
  getId: (row: any) => string;
  getNo: (row: any) => string;
  getAltNo?: (row: any) => string | undefined;
  /** Second line under the client's name. */
  clientDetail?: (row: any) => string;
  actionLabel: string;
  onAction: (row: any) => void;
}

const ConvertListView = ({
  eyebrow,
  title,
  description,
  tabs,
  tab,
  onTab,
  items,
  loading,
  error,
  onRetry,
  noun,
  getId,
  getNo,
  getAltNo,
  clientDetail,
  actionLabel,
  onAction,
}: ConvertListViewProps) => {
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [coverCode, setCoverCode] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (items ?? []).filter((p: any) => {
      if (term) {
        const hay = [getNo(p), getAltNo?.(p), p.fullName, p.surName, p.otherNames].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (coverCode && !String(p.coverCode ?? "").toLowerCase().includes(coverCode.toLowerCase())) return false;
      if (status && !String(p.transSTATUS || p.status || "").toLowerCase().includes(status.toLowerCase())) return false;
      if (from && p.startDate && new Date(p.startDate) < new Date(from)) return false;
      if (to && p.startDate && new Date(p.startDate) > new Date(to)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, search, coverCode, status, from, to]);

  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = (items ?? []).find((p: any) => getId(p) === selectedId);
  const extraFilters = [coverCode, status, from, to].filter(Boolean).length;
  const filtering = extraFilters > 0 || !!search.trim();

  const set = (fn: (v: string) => void) => (v: string) => {
    fn(v);
    setPage(1);
  };
  const reset = () => {
    setSearch("");
    setCoverCode("");
    setStatus("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  return (
    <PageShell>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      <Panel bodyClassName="space-y-4 p-5 sm:p-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          {tabs && (
            <Segmented
              value={tab}
              onChange={(v) => {
                setSelectedId(null);
                setPage(1);
                onTab?.(v);
              }}
              options={tabs}
            />
          )}
          <div className="flex min-w-0 flex-1 gap-3">
            <SearchField value={search} onChange={set(setSearch)} placeholder={`Search by client name or ${noun} number`} />
            <button type="button" className={btnOutline + " h-12 shrink-0"} onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}>
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filters</span>
              {extraFilters > 0 && <span className="rounded-full bg-[#155dfd] px-1.5 text-xs text-white">{extraFilters}</span>}
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-500">Cover code</span>
              <input className={inputBase} value={coverCode} onChange={(e) => set(setCoverCode)(e.target.value)} placeholder="e.g. CEE" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-500">Status</span>
              <input className={inputBase} value={status} onChange={(e) => set(setStatus)(e.target.value)} placeholder="e.g. Pending" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-500">Start date from</span>
              <input type="date" className={inputBase} value={from} onChange={(e) => set(setFrom)(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-500">Start date to</span>
              <input type="date" className={inputBase} value={to} onChange={(e) => set(setTo)(e.target.value)} />
            </label>
          </div>
        )}
      </Panel>

      {/* What is selected, and the action */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-3.5 ${
          selected ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
        }`}
      >
        <span className={`text-sm ${selected ? "font-semibold text-[#155dfd]" : "text-slate-500"}`}>
          {selected
            ? `${getNo(selected)} · ${selected.fullName || selected.surName || ""} selected`
            : loading
              ? "Loading…"
              : `${filtered.length.toLocaleString("en-NG")} ${noun}${filtered.length === 1 ? "" : "s"}${filtering ? " match" : ""} · pick one to ${actionLabel.toLowerCase()}`}
        </span>
        <div className="flex items-center gap-2">
          {filtering && (
            <button type="button" onClick={reset} className={btnRow}>
              <X size={14} /> Clear search
            </button>
          )}
          <button type="button" onClick={() => selected && onAction(selected)} disabled={!selected} className={btnPrimary}>
            {actionLabel}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <Panel flush>
        {error ? (
          <EmptyState
            icon={AlertCircle}
            title={`Couldn't load ${noun}s`}
            description={error}
            action={
              <button onClick={onRetry} className={btnPrimary}>
                <RefreshCw size={15} /> Retry
              </button>
            }
          />
        ) : (
          <div className={tableCls.wrap}>
            <table className={tableCls.table}>
              <thead className={tableCls.thead}>
                <tr>
                  <th className={tableCls.th + " w-11 pr-0"}>
                    <span className="sr-only">Select</span>
                  </th>
                  <th className={tableCls.th + " w-[170px] capitalize"}>{noun}</th>
                  <th className={tableCls.th}>Client</th>
                  <th className={tableCls.th + " hidden w-[170px] @5xl:table-cell"}>Cover</th>
                  <th className={tableCls.th + " w-[150px] text-right"}>Sum assured</th>
                  <th className={tableCls.th + " hidden w-[130px] @3xl:table-cell"}>Start</th>
                  <th className={tableCls.th + " w-[120px]"}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={FileText}
                        title={loading ? `Loading ${noun}s…` : `No ${noun}s found`}
                        description={!loading && filtering ? "Try a different search or clear the filters." : undefined}
                      />
                    </td>
                  </tr>
                ) : (
                  rows.map((p: any) => {
                    const id = getId(p);
                    const on = id === selectedId;
                    return (
                      <tr
                        key={id}
                        className={`${tableCls.tr} cursor-pointer ${on ? "bg-blue-50/70 hover:bg-blue-50" : ""}`}
                        onClick={() => setSelectedId(on ? null : id)}
                        aria-selected={on}
                      >
                        <td className={tableCls.td + " pr-0"} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="radio"
                            name="convert-select"
                            checked={on}
                            onChange={() => setSelectedId(on ? null : id)}
                            className="h-4 w-4 cursor-pointer accent-[#155dfd]"
                            aria-label={`Select ${getNo(p)}`}
                          />
                        </td>
                        <td className={tableCls.td}>
                          <div className={tableCls.primary} title={getNo(p)}>{getNo(p) || "—"}</div>
                          {getAltNo?.(p) && <div className={tableCls.secondary}>{getAltNo(p)}</div>}
                        </td>
                        <td className={tableCls.td}>
                          <div className={tableCls.primary} title={p.fullName}>
                            {p.fullName || [p.surName, p.otherNames].filter(Boolean).join(" ") || "—"}
                          </div>
                          <div className={tableCls.secondary}>{clientDetail ? clientDetail(p) : [p.sex, p.age != null && `Age ${p.age}`].filter(Boolean).join(" · ")}</div>
                        </td>
                        <td className={tableCls.td + " hidden @5xl:table-cell"}>
                          <div className="truncate font-medium text-slate-900">{p.coverCode || "—"}</div>
                          {p.covertype && <div className={tableCls.secondary} title={p.covertype}>{p.covertype}</div>}
                        </td>
                        <td className={tableCls.td + " text-right"}>
                          <div className={tableCls.primary} title={fmt(p.sumAssured)}>{fmt(p.sumAssured)}</div>
                          <div className={tableCls.secondary}>
                            {fmt(p.totalPremium)}
                            {p.mop ? ` · ${String(p.mop).toLowerCase()}` : ""}
                          </div>
                        </td>
                        <td className={tableCls.td + " hidden @3xl:table-cell"}>
                          <div className="truncate text-slate-900">{fmtDate(p.startDate)}</div>
                          {p.state && <div className={tableCls.secondary + " capitalize"}>{String(p.state).toLowerCase()}</div>}
                        </td>
                        <td className={tableCls.td}>
                          <StatusChip status={p.transSTATUS || p.status || "Unknown"} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
      </Panel>
    </PageShell>
  );
};

export default ConvertListView;
