import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchIndividualQuotations, IndividualQuotation } from "../../features/reducers/proposalReducers/proposalsSlice";
import { FileText, ChevronDown, ChevronUp, Search, X, RefreshCw } from "lucide-react";

// ─── helpers ───────────────────────────────────────────────
const fmt = (n: number | null | undefined) =>
  n == null ? "—" : `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });
};

const StatusBadge = ({ status }: { status: string | null }) => {
  const label = status || "Draft";
  const green = ["in force", "active", "approved", "converted"].includes(label.toLowerCase());
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{
        background: green ? "#16a34a" : "#8c4b8d",
        color: "white",
      }}
    >
      {label}
    </span>
  );
};

interface QuotationsTablePageProps {
  title: string;
  tag: "A" | "B";
}

const QuotationsTablePage = ({ title, tag }: QuotationsTablePageProps) => {
  const dispatch = useDispatch() as any;
  const navigate = useNavigate();
  const { quotationItems: items, quotationLoading: loading, quotationError: error } = useSelector((s: any) => s.investmentProposals);

  // filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterQuoteNo, setFilterQuoteNo] = useState("");
  const [filterClientName, setFilterClientName] = useState("");
  const [filterCoverCode, setFilterCoverCode] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    dispatch(fetchIndividualQuotations({ page: 1, pageSize: 500 })); // Fetch a large batch for frontend filtering if needed
  }, [dispatch]);

  const filtered = useMemo(() => {
    return items.filter((q: IndividualQuotation) => {
      // Filter by tag
      if (q.tag !== tag) return false;
      
      if (filterQuoteNo && !q.quoteNo?.toLowerCase().includes(filterQuoteNo.toLowerCase())) return false;
      if (filterClientName) {
        const name = `${q.fullName}`.toLowerCase();
        if (!name.includes(filterClientName.toLowerCase())) return false;
      }
      if (filterCoverCode && !q.coverCode?.toLowerCase().includes(filterCoverCode.toLowerCase())) return false;
      if (filterStatus) {
        const s = (q.status || "Unknown").toLowerCase();
        if (!s.includes(filterStatus.toLowerCase())) return false;
      }
      return true;
    });
  }, [items, filterQuoteNo, filterClientName, filterCoverCode, filterStatus, tag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setFilterQuoteNo("");
    setFilterClientName("");
    setFilterCoverCode("");
    setFilterStatus("");
    setPage(1);
  };

  const retryFetch = () => dispatch(fetchIndividualQuotations({}));

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse uppercase">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-1/4" />
        <div className="h-12 bg-gray-100 rounded" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center gap-4 text-center">
        <p className="text-red-500 font-medium">{error}</p>
        <button
          onClick={retryFetch}
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
          Quotations
        </p>
        <h1 className="text-2xl font-bold text-gray-800 mt-0.5">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {filtered.length > 0 ? `${filtered.length} quotation${filtered.length !== 1 ? "s" : ""}` : "No quotations found"}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Quote No</label>
                <input
                  value={filterQuoteNo}
                  onChange={(e) => { setFilterQuoteNo(e.target.value); setPage(1); }}
                  placeholder="Search by quote no"
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
                  placeholder="e.g. CAP"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8c4b8d]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <input
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                  placeholder="e.g. Draft"
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

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl px-5 py-4 bg-white border border-gray-200">
        <span className="text-sm font-medium text-gray-500">
          Capture and process new quotations.
        </span>
        <div className="flex flex-wrap gap-3">
          {tag === "B" && (
            <button
              onClick={() => navigate("/quotations/new-investment")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold shadow-sm transition-opacity hover:opacity-90 cursor-pointer whitespace-nowrap"
              style={{ background: "#8c4b8d" }}
            >
               New Investment Link Quote
            </button>
          )}
          {tag === "A" && (
            <button
              onClick={() => navigate("/quotations/new-traditional")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold shadow-sm transition-opacity hover:opacity-90 cursor-pointer whitespace-nowrap"
              style={{ background: "#8c4b8d" }}
            >
               New Traditional Quote
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Quote No.</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Client Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Cover Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Sum Assured</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Premium</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Start Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Maturity Date</th>
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
                paginated.map((q: IndividualQuotation) => (
                  <tr key={q.quoteID} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-800">{q.quoteNo || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{q.fullName}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-blue-600">{q.coverCode}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{q.covertype}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">{fmt(q.sumAssured)}</td>
                    <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">{fmt(q.totalPremium)}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(q.startDate)}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(q.maturityDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => navigate(`/quotations/view-quote/${q.quoteNo}`)}
                        className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                        title="View Quotation"
                      >
                        <FileText size={16} />
                      </button>
                    </td>
                  </tr>
                ))
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

export default QuotationsTablePage;
