//@ts-nocheck
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Add useLocation
import { useDispatch, useSelector } from "react-redux";
import { fetchInvestmentProposals } from "../../features/reducers/proposalReducers/proposalsSlice";
import type { Proposal } from "../../features/reducers/proposalReducers/proposalsSlice";
import { FileText, ChevronDown, ChevronUp, Search, X, RefreshCw, ArrowRight, Pencil } from "lucide-react";

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
const PolicyAdminPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation(); // Add this

  const { items, loading, error, totalCount } = useSelector((s: any) => s.investmentProposals);

  // Determine active tag from URL path
  const getActiveTagFromPath = () => {
    const path = location.pathname;
    if (path.includes("/investment-policies")) {
      return "B"; // Investment Policies
    } else if (path.includes("/traditional-policies")) {
      return "A"; // Traditional Policies
    }
    // Default to "B" if no match (or you can use localStorage/sessionStorage)
    return "B";
  };

  // active tag (B = Investment, A = Traditional)
  const [activeTag, setActiveTag] = useState<"A" | "B">(getActiveTagFromPath);

  // filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterProposalNo, setFilterProposalNo] = useState("");
  const [filterClientName, setFilterClientName] = useState("");
  const [filterCoverCode, setFilterCoverCode] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  // Update activeTag when URL changes
  useEffect(() => {
    const newTag = getActiveTagFromPath();
    if (newTag !== activeTag) {
      setActiveTag(newTag);
      setPage(1);
    }
  }, [location.pathname]);

  useEffect(() => {
    dispatch(fetchInvestmentProposals(activeTag));
  }, [dispatch, activeTag]);

  const filtered = useMemo(() => {
    return items.filter((p: Proposal) => {
      // API might return all, so handle frontend tag filtering manually
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

  const retryFetch = () => dispatch(fetchInvestmentProposals(activeTag));

  const handleEdit = (proposal: Proposal) => {
    if (activeTag === "B") {
      // Investment policy - navigate to the same new investment page with edit mode
      navigate("/underwriting/individual/policy-admin/new-investment", {
        state: { 
          policyData: proposal,
          editMode: true 
        }
      });
    } else {
      // Traditional policy - navigate to the same new traditional page with edit mode
      navigate("/underwriting/individual/policy-admin/new-traditional", {
        state: { 
          policyData: proposal,
          editMode: true 
        }
      });
    }
  };

  // Handle tab change with navigation
  const handleTabChange = (tag: "A" | "B") => {
    setActiveTag(tag);
    setPage(1);
    
    // Navigate to the appropriate route
    if (tag === "B") {
      navigate("/underwriting/individual/policy-admin/investment-policies");
    } else {
      navigate("/underwriting/individual/policy-admin/traditional-policies");
    }
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
          Underwriting
        </p>
        <h1 className="text-2xl font-bold text-gray-800 mt-0.5">Policy Admin</h1>
        <p className="text-sm text-gray-500 mt-1">
          {totalCount > 0 ? `${filtered.length} proposal${filtered.length !== 1 ? "s" : ""}` : "No proposals found"}
        </p>
      </div>

      {/* Policy Type Tabs - Modern Version */}
      <div className="flex items-center gap-0 border-b-2 border-gray-200 bg-white rounded-t-xl overflow-hidden">
        <button
          onClick={() => handleTabChange("B")}
          className={`
            px-8 py-3.5 text-sm font-semibold transition-all duration-200 relative
            ${activeTag === "B" 
              ? "text-[#8c4b8d] bg-gradient-to-b from-[#8c4b8d]/5 to-white" 
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
            }
          `}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">📈</span>
            Investment Policies
          </div>
          {activeTag === "B" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#8c4b8d] rounded-t-full shadow-[0_0_8px_rgba(140,75,141,0.3)]" />
          )}
        </button>
        <button
          onClick={() => handleTabChange("A")}
          className={`
            px-8 py-3.5 text-sm font-semibold transition-all duration-200 relative
            ${activeTag === "A" 
              ? "text-[#8c4b8d] bg-gradient-to-b from-[#8c4b8d]/5 to-white" 
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
            }
          `}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🏛️</span>
            Traditional Policies
          </div>
          {activeTag === "A" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#8c4b8d] rounded-t-full shadow-[0_0_8px_rgba(140,75,141,0.3)]" />
          )}
        </button>
      </div>

      {/* Rest of your component remains the same... */}
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

      {/* Action bar */}
      <div className="flex items-center justify-between rounded-xl px-5 py-3 bg-white border border-gray-200">
        <span className="text-sm font-medium text-gray-500">
          Manage and configure policies.
        </span>
        <button
          onClick={() => navigate(activeTag === "B" ? "/underwriting/individual/policy-admin/new-investment" : "/underwriting/individual/policy-admin/new-traditional")}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-semibold shadow-sm transition-opacity hover:opacity-90 cursor-pointer"
          style={{ background: "#8c4b8d" }}
        >
          <ArrowRight size={15} />
          New Policy Business Setup
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Policy No.</th>
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
                  return (
                    <tr
                      key={p.transGUID}
                      className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                    >
                      {/* Policy No */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{p.policyNo || "—"}</div>
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

                      {/* Actions - Edit and View icons */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* ✅ Edit Button */}
                          <button
                            onClick={() => handleEdit(p)}
                            title="Edit Policy"
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Pencil size={16} />
                          </button>
                          
                          {/* View Details Button */}
                          <button
                            title="View Details"
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
                          >
                            <FileText size={16} />
                          </button>
                        </div>
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

export default PolicyAdminPage;