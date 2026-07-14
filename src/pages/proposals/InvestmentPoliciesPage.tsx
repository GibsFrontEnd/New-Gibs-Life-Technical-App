//@ts-nocheck
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchInvestmentProposals } from "../../features/reducers/proposalReducers/proposalsSlice";
import type { Proposal } from "../../features/reducers/proposalReducers/proposalsSlice";
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
const InvestmentPoliciesPage = () => {
  const dispatch = useDispatch();
  const { items, loading, error, totalCount } = useSelector((s: any) => s.investmentProposals);

  // active tag (B = Investment, A = Traditional)
  const [activeTag, setActiveTag] = useState<"A" | "B">("B");

  // filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterProposalNo, setFilterProposalNo] = useState("");
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
    dispatch(fetchInvestmentProposals(activeTag));
    // Reset selection when switching tabs
    setSelectedId(null);
  }, [dispatch, activeTag]);

  const filtered = useMemo(() => {
    return items.filter((p: Proposal) => {
      // API might return all tags, so filter by the active tab manually
      if (p.tag && p.tag !== activeTag) return false;

      if (filterProposalNo && !p.proposalNo?.toLowerCase().includes(filterProposalNo.toLowerCase())) return false;
      if (filterClientName) {
        const name = `${p.fullName} ${p.surName} ${p.otherNames}`.toLowerCase();
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
  }, [items, filterProposalNo, filterClientName, filterCoverCode, filterStatus, filterDateFrom, filterDateTo, activeTag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setFilterProposalNo("");
    setFilterClientName("");
    setFilterCoverCode("");
    setFilterStatus("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setPage(1);
  };

  const selectedProposal = items.find((p: Proposal) => p.transGUID === selectedId);

  const navigate = useNavigate();
  const handleConvert = () => {
    if (!selectedProposal) return;
    navigate(`/underwriting/convert-to-policy/investment-policies/${selectedProposal.proposalNo}`);
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
          onClick={() => dispatch(fetchInvestmentProposals(activeTag))}
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
          Convert to Policy
        </p>
        <h1 className="text-2xl font-bold text-gray-800 mt-0.5">
          {activeTag === "B" ? "Investment Policies" : "Traditional Policies"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {totalCount > 0 ? `${filtered.length} proposal${filtered.length !== 1 ? "s" : ""}` : "No proposals found"}
        </p>
      </div>

      {/* Policy Type Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => { setActiveTag("B"); setPage(1); }}
          className={`px-5 py-3 text-sm font-semibold transition-colors relative ${activeTag === "B" ? "text-[#8c4b8d]" : "text-gray-500 hover:text-gray-700"}`}
        >
          Investment Policies
          {activeTag === "B" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8c4b8d]" />}
        </button>
        <button
          onClick={() => { setActiveTag("A"); setPage(1); }}
          className={`px-5 py-3 text-sm font-semibold transition-colors relative ${activeTag === "A" ? "text-[#8c4b8d]" : "text-gray-500 hover:text-gray-700"}`}
        >
          Traditional Policies
          {activeTag === "A" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8c4b8d]" />}
        </button>
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
                <label className="block text-xs font-medium text-gray-500 mb-1">Proposal No</label>
                <input
                  value={filterProposalNo}
                  onChange={(e) => { setFilterProposalNo(e.target.value); setPage(1); }}
                  placeholder="e.g. PR910050002"
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
                  placeholder="e.g. CEE"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8c4b8d]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <input
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                  placeholder="e.g. In Force"
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
          {selectedId ? "1 proposal selected" : "0 proposals selected"}
        </span>
        <button
          onClick={handleConvert}
          disabled={!selectedId}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-semibold shadow-sm transition-opacity ${selectedId ? "hover:opacity-90 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
          style={{ background: "linear-gradient(to right, #4c58ea, #7b3aec)" }}
        >
          <ArrowRight size={15} />
          Convert to Policy
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-10 px-4 py-3 text-left">
                  {/* No "select all" — single select only */}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Policy/Proposal No.</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Client Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Cover Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Sum Assured</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Premium</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Start Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">State</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-gray-400">
                    No proposals found.
                  </td>
                </tr>
              ) : (
                paginated.map((p: Proposal) => {
                  const isSelected = selectedId === p.transGUID;
                  return (
                    <tr
                      key={p.transGUID}
                      className={`border-b border-gray-100 transition-colors hover:bg-gray-50 cursor-pointer ${isSelected ? "bg-purple-50" : ""}`}
                      onClick={() => setSelectedId(isSelected ? null : p.transGUID)}
                    >
                      {/* Checkbox — single select (radio-style) */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="proposal-select"
                          checked={isSelected}
                          onChange={() => setSelectedId(isSelected ? null : p.transGUID)}
                          className="accent-[#8c4b8d] w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Policy/Proposal No */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{p.proposalNo}</div>
                        {p.policyNo && <div className="text-xs text-gray-400 mt-0.5">{p.policyNo}</div>}
                      </td>

                      {/* Client Name */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{p.fullName}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{p.sex}, Age {p.age}</div>
                      </td>

                      {/* Cover Type */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-blue-600">{p.coverCode}</div>
                        {p.covertype && <div className="text-xs text-gray-400 mt-0.5 max-w-[140px] leading-tight">{p.covertype}</div>}
                      </td>

                      {/* Sum Assured */}
                      <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">{fmt(p.sumAssured)}</td>

                      {/* Premium */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-700 whitespace-nowrap">{fmt(p.totalPremium)}</div>
                        {p.mop && <div className="text-xs text-gray-400 mt-0.5">{p.mop}</div>}
                      </td>

                      {/* Start Date */}
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(p.startDate)}</td>

                      {/* State */}
                      <td className="px-4 py-3">
                        <div className="text-gray-700">{p.state}</div>
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3">
                        <StatusBadge status={p.transSTATUS || p.status} />
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

export default InvestmentPoliciesPage;
