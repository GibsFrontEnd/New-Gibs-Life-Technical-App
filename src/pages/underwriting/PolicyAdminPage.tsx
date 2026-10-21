//@ts-nocheck
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchInvestmentProposals } from "../../features/reducers/proposalReducers/proposalsSlice";
import type { Proposal } from "../../features/reducers/proposalReducers/proposalsSlice";
import { FileText, X, RefreshCw, Pencil, Plus, FilePen, TrendingUp, Landmark, SlidersHorizontal, AlertCircle } from "lucide-react";
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
  btnIcon,
  btnRow,
  inputBase,
  tableCls,
} from "../../components/page/PageKit";

// ─── helpers ───────────────────────────────────────────────
const fmt = (n: number | null | undefined) =>
  n == null ? "—" : `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
};

/** Policy numbers have digits or slashes; names don't. The API filters the two separately. */
const looksLikePolicyNo = (term: string) => /[\d/]/.test(term);

// ─── main component ─────────────────────────────────────────
const PolicyAdminPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { items, loading, error, totalCount } = useSelector((s: any) => s.investmentProposals);

  // B = Investment, A = Traditional, taken from the URL
  const getActiveTagFromPath = () => (location.pathname.includes("/traditional-policies") ? "A" : "B");
  const [activeTag, setActiveTag] = useState<"A" | "B">(getActiveTagFromPath);

  // the one search box (name or policy number) and the extra filters
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterProposalNo, setFilterProposalNo] = useState("");
  const [filterCoverCode, setFilterCoverCode] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    const newTag = getActiveTagFromPath();
    if (newTag !== activeTag) {
      setActiveTag(newTag);
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const term = search.trim();
  const query = {
    tag: activeTag,
    page,
    pageSize: PAGE_SIZE,
    policyNo: filterProposalNo.trim() || (looksLikePolicyNo(term) ? term : ""),
    surname: looksLikePolicyNo(term) ? "" : term,
    coverCode: filterCoverCode.trim(),
    status: filterStatus.trim(),
    fromDate: filterDateFrom,
    toDate: filterDateTo,
  };

  // filters, paging and the tag are applied by the API (debounced so typing doesn't fire a request per key)
  useEffect(() => {
    const t = setTimeout(() => dispatch(fetchInvestmentProposals(query)), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, activeTag, page, term, filterProposalNo, filterCoverCode, filterStatus, filterDateFrom, filterDateTo]);

  const resetFilters = () => {
    setSearch("");
    setFilterProposalNo("");
    setFilterCoverCode("");
    setFilterStatus("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setPage(1);
  };

  const retryFetch = () => dispatch(fetchInvestmentProposals(query));

  const handleEdit = (proposal: Proposal) => {
    navigate(activeTag === "B" ? "/underwriting/individual/policy-admin/new-investment" : "/underwriting/individual/policy-admin/new-traditional", {
      state: { policyData: proposal, editMode: true },
    });
  };

  const handleTabChange = (tag: "A" | "B") => {
    setActiveTag(tag);
    setPage(1);
    navigate(tag === "B" ? "/underwriting/individual/policy-admin/investment-policies" : "/underwriting/individual/policy-admin/traditional-policies");
  };

  const activeFilters = [filterProposalNo, filterCoverCode, filterStatus, filterDateFrom, filterDateTo].filter(Boolean).length;
  const filtering = activeFilters > 0 || !!term;
  const kind = activeTag === "B" ? "investment" : "traditional";

  return (
    <PageShell>
      <PageHeader
        eyebrow="Underwriting"
        title="Policy admin"
        description="Search, set up and endorse individual life policies."
        actions={
          <button onClick={() => navigate(activeTag === "B" ? "/underwriting/individual/policy-admin/new-investment" : "/underwriting/individual/policy-admin/new-traditional")} className={btnPrimary}>
            <Plus size={16} />
            New {kind} policy
          </button>
        }
      />

      {/* Search & Filters */}
      <Panel bodyClassName="space-y-4 p-5 sm:p-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <Segmented
            value={activeTag}
            onChange={(v) => handleTabChange(v as "A" | "B")}
            options={[
              { value: "B", label: "Investment", icon: TrendingUp },
              { value: "A", label: "Traditional", icon: Landmark },
            ]}
          />
          <div className="flex min-w-0 flex-1 gap-3">
            <SearchField
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search by client name or policy number"
            />
            <button type="button" className={btnOutline + " h-12 shrink-0"} onClick={() => setFiltersOpen((p) => !p)} aria-expanded={filtersOpen}>
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filters</span>
              {activeFilters > 0 && <span className="rounded-full bg-[#155dfd] px-1.5 text-xs text-white">{activeFilters}</span>}
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="border-t border-slate-100 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Policy no.</span>
                <input value={filterProposalNo} onChange={(e) => { setFilterProposalNo(e.target.value); setPage(1); }} placeholder="e.g. 402/26/00967/HO" className={inputBase} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Cover code</span>
                <input value={filterCoverCode} onChange={(e) => { setFilterCoverCode(e.target.value); setPage(1); }} placeholder="e.g. CEE" className={inputBase} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Status</span>
                <input value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} placeholder="e.g. Converted" className={inputBase} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Start date from</span>
                <input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }} className={inputBase} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Start date to</span>
                <input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }} className={inputBase} />
              </label>
            </div>
          </div>
        )}

        {filtering && (
          <div className="flex justify-end">
            <button onClick={resetFilters} className={btnRow}>
              <X size={14} /> Clear search and filters
            </button>
          </div>
        )}
      </Panel>

      <p className="text-sm text-slate-500">
        {loading ? "Loading…" : `${(totalCount || 0).toLocaleString("en-NG")} ${kind} polic${totalCount === 1 ? "y" : "ies"}${term ? ` matching “${term}”` : ""}`}
      </p>

      {/* Table: six columns, so it fits beside the menu without sideways scrolling */}
      <Panel flush>
        {error ? (
          <EmptyState
            icon={AlertCircle}
            title="Couldn't load policies"
            description={error}
            action={
              <button onClick={retryFetch} className={btnPrimary}>
                <RefreshCw size={15} /> Retry
              </button>
            }
          />
        ) : (
          <div className={tableCls.wrap}>
            <table className={tableCls.table}>
              <thead className={tableCls.thead}>
                <tr>
                  <th className={tableCls.th + " w-[170px]"}>Policy</th>
                  <th className={tableCls.th}>Client</th>
                  <th className={tableCls.th + " w-[150px] text-right"}>Sum assured</th>
                  <th className={tableCls.th + " hidden w-[130px] @3xl:table-cell"}>Start</th>
                  <th className={tableCls.th + " w-[120px]"}>Status</th>
                  <th className={tableCls.th + " w-[92px] text-right"}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={FileText}
                        title={loading ? "Loading policies…" : "No policies found"}
                        description={loading ? undefined : filtering ? "Try a different search or clear the filters." : undefined}
                      />
                    </td>
                  </tr>
                ) : (
                  items.map((p: Proposal) => (
                    <tr key={p.transGUID || p.policyNo} className={tableCls.tr + " cursor-pointer"} onClick={() => handleEdit(p)}>
                      <td className={tableCls.td}>
                        <div className={tableCls.primary} title={p.policyNo}>{p.policyNo || "—"}</div>
                        <div className={tableCls.secondary} title={p.covertype}>
                          {[p.coverCode, p.covertype].filter(Boolean).join(" · ")}
                        </div>
                      </td>

                      <td className={tableCls.td}>
                        <div className={tableCls.primary} title={p.fullName}>{p.fullName || "—"}</div>
                        <div className={tableCls.secondary}>{[p.sex, p.age != null && `Age ${p.age}`].filter(Boolean).join(" · ")}</div>
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

                      <td className={tableCls.td} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => handleEdit(p)} title="Edit policy" aria-label="Edit policy" className={btnIcon}>
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => navigate(`/underwriting/individual/endorsements?policyNo=${encodeURIComponent(p.policyNo)}`)}
                            title="Endorse policy"
                            aria-label="Endorse policy"
                            className={btnIcon}
                          >
                            <FilePen size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pager page={page} pageSize={PAGE_SIZE} total={totalCount || 0} onPage={setPage} />
      </Panel>
    </PageShell>
  );
};

export default PolicyAdminPage;
