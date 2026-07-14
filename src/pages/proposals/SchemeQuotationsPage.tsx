//@ts-nocheck
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSchemeQuotations } from "../../features/reducers/proposalReducers/proposalsSlice";
import { FileText, ChevronDown, ChevronUp, Search, X, RefreshCw, ArrowRight } from "lucide-react";

// ─── helpers ───────────────────────────────────────────────
const fmt = (n: number | null | undefined) =>
  n == null ? "—" : `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });
};

const StatusBadge = ({ status }: { status: string | null }) => {
  const label = status || "Unknown";
  const green = ["in force", "active", "approved", "converted"].includes(label.toLowerCase());
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{
        background: green ? "#16a34a" : "#ef4444",
        color: "white",
      }}
    >
      {label}
    </span>
  );
};

// ─── main component ─────────────────────────────────────────
interface SchemeQuotationsPageProps {
  title: string;
  tag: string;
  /** Eyebrow + action button label. Defaults to "Convert to Scheme". */
  actionLabel?: string;
}

const SchemeQuotationsPage = ({ title, tag, actionLabel = "Convert to Scheme" }: SchemeQuotationsPageProps) => {
  const dispatch = useDispatch();
  const { schemeItems: items, schemeLoading: loading, schemeError: error, schemeTotalCount: totalCount } = useSelector((s: any) => s.investmentProposals);

  // filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterQuoteNo, setFilterQuoteNo] = useState("");
  const [filterClientName, setFilterClientName] = useState("");
  const [filterCoverCode, setFilterCoverCode] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // selection — single select only
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    dispatch(fetchSchemeQuotations(tag));
    // Reset selection when tag changes
    setSelectedId(null);
  }, [dispatch, tag]);

  const filtered = useMemo(() => {
    return items.filter((p: any) => {
      if (filterQuoteNo && !p.quoteNo?.toLowerCase().includes(filterQuoteNo.toLowerCase())) return false;
      if (filterClientName) {
        const name = `${p.fullName || ''} ${p.surName || ''} ${p.otherNames || ''}`.toLowerCase();
        if (!name.includes(filterClientName.toLowerCase())) return false;
      }
      if (filterCoverCode && !p.coverCode?.toLowerCase().includes(filterCoverCode.toLowerCase())) return false;
      if (filterStatus) {
        const s = (p.transSTATUS || p.status || "Unknown").toLowerCase();
        if (!s.includes(filterStatus.toLowerCase())) return false;
      }
      if (filterDateFrom && p.startDate && new Date(p.startDate) < new Date(filterDateFrom)) return false;
      if (filterDateTo && p.startDate && new Date(p.startDate) > new Date(filterDateTo)) return false;
      return true;
    });
  }, [items, filterQuoteNo, filterClientName, filterCoverCode, filterStatus, filterDateFrom, filterDateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setFilterQuoteNo("");
    setFilterClientName("");
    setFilterCoverCode("");
    setFilterStatus("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setPage(1);
  };

  const selectedProposal = items.find((p: any) => p.quoteID?.toString() === selectedId);

  const handleConvert = () => {
    if (!selectedProposal) return;
    alert(`${actionLabel}: ${selectedProposal.quoteNo}`);
    // TODO: wire up API call
  };

  // ─── loading skeleton ─────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-1/4" />
        <div className="h-12 bg-gray-100 rounded" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded" />
        ))}
      </div>
    );
  }

  // ─── error ───────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-6 flex flex-col items-center gap-4 text-center">
        <p className="text-red-500 font-medium">{error}</p>
        <button
          onClick={() => dispatch(fetchSchemeQuotations(tag))}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm"
          style={{ background: "#8c4b8d" }}
        >
          <RefreshCw size={15} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-[1400px] mx-auto">
      {/* Page header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#8c4b8d]">
          {actionLabel}
        </p>
        <h1 className="text-2xl font-bold text-gray-800 mt-0.5">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {totalCount > 0 ? `${filtered.length} quotation${filtered.length !== 1 ? "s" : ""}` : "No quotations found"}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <button
          className="w-full flex items-center justify-between px-5 py-3.5 bg-white hover:bg-gray-50 transition-colors"
          onClick={() => setFiltersOpen((p) => !p)}
        >
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Search size={16} />
            Search &amp; Filters
          </div>
          {filtersOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>

        {filtersOpen && (
          <div className="px-5 pb-5 pt-3 bg-white border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Quote No</label>
                <input
                  value={filterQuoteNo}
                  onChange={(e) => { setFilterQuoteNo(e.target.value); setPage(1); }}
                  placeholder="e.g. 910026811"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8c4b8d]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Client Name</label>
                <input
                  value={filterClientName}
                  onChange={(e) => { setFilterClientName(e.target.value); setPage(1); }}
                  placeholder="Search by name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8c4b8d]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Cover Code</label>
                <input
                  value={filterCoverCode}
                  onChange={(e) => { setFilterCoverCode(e.target.value); setPage(1); }}
                  placeholder={`e.g. ${tag}`}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8c4b8d]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <input
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                  placeholder="e.g. ACTIVE"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8c4b8d]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start Date From</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8c4b8d]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start Date To</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8c4b8d]/30"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <X size={14} /> Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selection action bar */}
      <div className={`flex items-center justify-between rounded-xl px-5 py-3 ${selectedId ? "bg-blue-50 border border-blue-200" : "bg-gray-50 border border-gray-200"}`}>
        <span className={`text-sm font-medium ${selectedId ? "text-blue-700" : "text-gray-500"}`}>
          {selectedId ? "1 quotation selected" : "0 quotations selected"}
        </span>
        <button
          onClick={handleConvert}
          disabled={!selectedId}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-semibold shadow-sm transition-opacity ${selectedId ? "hover:opacity-90 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
          style={{ background: "linear-gradient(to right, #4c58ea, #7b3aec)" }}
        >
          <ArrowRight size={15} />
          {actionLabel}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-10 px-4 py-3 text-left">
                  {/* Single select only */}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Quote No.</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Client Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Cover Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Sum Assured</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Premium</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Start Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Customer Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-gray-400">
                    No quotations found.
                  </td>
                </tr>
              ) : (
                paginated.map((p: any) => {
                  const id = p.quoteID?.toString();
                  const isSelected = selectedId === id;
                  const nameStr = [p.fullName, p.surName, p.otherNames].filter(Boolean).join(" ");
                  return (
                    <tr
                      key={id}
                      className={`border-b border-gray-100 transition-colors hover:bg-gray-50 cursor-pointer ${isSelected ? "bg-purple-50" : ""}`}
                      onClick={() => setSelectedId(isSelected ? null : id)}
                    >
                      {/* Checkbox — single select (radio-style) */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="quote-select"
                          checked={isSelected}
                          onChange={() => setSelectedId(isSelected ? null : id)}
                          className="accent-[#8c4b8d] w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Quote No */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{p.quoteNo || "—"}</div>
                        {p.proposalNo && <div className="text-xs text-gray-400 mt-0.5">{p.proposalNo}</div>}
                      </td>

                      {/* Client Name */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{nameStr || "—"}</div>
                        {p.sex && <div className="text-xs text-gray-400 mt-0.5">{p.sex}{p.age ? `, Age ${p.age}` : ''}</div>}
                      </td>

                      {/* Cover Type */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-blue-600">{p.coverCode || "—"}</div>
                        {p.covertype && <div className="text-xs text-gray-400 mt-0.5 max-w-[140px] leading-tight text-capitalize">{p.covertype}</div>}
                      </td>

                      {/* Sum Assured */}
                      <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">{fmt(p.sumAssured)}</td>

                      {/* Premium */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-700 whitespace-nowrap">{fmt(p.totalPremium)}</div>
                      </td>

                      {/* Start Date */}
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(p.startDate)}</td>

                      {/* Customer Type */}
                      <td className="px-4 py-3">
                        <div className="text-gray-700 capitalize">{p.customerType || "—"}</div>
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status || p.transSTATUS} />
                      </td>

                      {/* Actions — details icon only */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          title="View Details"
                          className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                        >
                          <FileText size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-sm text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                ← Prev
              </button>
              <span className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm font-medium">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemeQuotationsPage;
