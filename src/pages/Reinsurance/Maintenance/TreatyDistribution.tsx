//@ts-nocheck
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRiskDistribution } from "../../../hooks/useRiskDistribution";

const TABS = [
  "Treaty Distribution",
  "Treaty Proportion Rules",
  "Excess of Loss Treaty Rules",
  "Fac-Out Auto Distribution Rules",
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const fmt = (n: number) => n.toLocaleString();

const TreatyDistribution: React.FC = () => {
  const navigate = useNavigate();
  
  // Use our custom hook
  const {
    items: allItems,  // Renamed to allItems
    loading,
    error,
    getAll,
    remove,
    resetError
  } = useRiskDistribution();

  // Local state
  const [activeTab, setActiveTab] = useState(0);
  
  // Search filter
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [filterField, setFilterField] = useState("Sub Class");
  const [filterValue, setFilterValue] = useState("");
  
  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set());
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch data on mount - only once
  useEffect(() => {
    getAll();
  }, []); // Empty dependency array

  // Watch for state changes - use allItems instead of items
  useEffect(() => {
  }, [loading, allItems, error]);

  // Log when items are loaded
  useEffect(() => {
    if (allItems.length > 0) {
    }
  }, [allItems]);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!filterEnabled || !filterValue) return allItems;
    
    return allItems.filter((row) => {
      if (filterField === "Sub Class") {
        return row.subRiskID.toLowerCase().includes(filterValue.toLowerCase());
      }
      if (filterField === "Under Yr") {
        return row.underYr.includes(filterValue);
      }
      if (filterField === "Retention Value") {
        return row.retention.toString().includes(filterValue);
      }
      return true;
    });
  }, [allItems, filterEnabled, filterField, filterValue]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const pageData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  // Selection helpers
  const allPageSelected = pageData.length > 0 && pageData.every((r) => selected.has(r.distributionID));
  
  const toggleAll = () => {
    if (allPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        pageData.forEach((r) => next.delete(r.distributionID));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        pageData.forEach((r) => next.add(r.distributionID));
        return next;
      });
    }
  };
  
  const toggleRow = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Handle single delete
  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    setDeletingId(null);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (deletingId) {
      // Delete single item
      await remove(deletingId);
      setSelected(prev => {
        const next = new Set(prev);
        next.delete(deletingId);
        return next;
      });
    } else {
      // Delete multiple items
      for (const id of selected) {
        await remove(id);
      }
      setSelected(new Set());
    }
    
    setShowDeleteModal(false);
    setDeletingId(null);
    getAll(); // Refresh list
  };

  // Pagination range helper
  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = 1; i <= 7; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages]);

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading treaty distributions...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-red-800 font-semibold">Error Loading Data</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={() => {
                  resetError();
                  getAll();
                }}
                className="mt-3 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Treaty Distribution</h1>
      </div>

      {/* Tabs */}
<div className="border-b border-gray-200 mb-0">
  <div className="flex gap-1">
    {TABS.map((tab, i) => (
      <button
        key={tab}
        onClick={() => {
          setActiveTab(i);
          if (i === 0) navigate("/reinsurance/maintenance/treaty-distribution");
          if (i === 1) navigate("/reinsurance/maintenance/treaty-proportion-rules");
          if (i === 2) navigate("/reinsurance/maintenance/excess-of-loss-treaty-rules");
        }}
        className={`px-6 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200 ${
          activeTab === i
            ? "bg-red-600 text-white shadow-sm"
            : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-900"
        }`}
      >
        {tab}
      </button>
    ))}
  </div>
</div>

      {/* Tab Content */}
      <div className="bg-white border border-gray-300 border-t-0 rounded-b-lg shadow-sm">

        {/* Search Filter Panel */}
        <div className="p-4 border-b border-gray-200">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={filterEnabled}
              onChange={(e) => {
                setFilterEnabled(e.target.checked);
                if (!e.target.checked) setFilterValue("");
              }}
              className="rounded border-gray-300"
            />
            Search Filter
          </label>

          {filterEnabled && (
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-600">where</span>
              <select
                value={filterField}
                onChange={(e) => setFilterField(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option>Sub Class</option>
                <option>Under Yr</option>
                <option>Retention Value</option>
              </select>
              <span className="text-sm text-gray-600">contains</span>
              <input
                type="text"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setPage(1)}
                className="text-sm border border-gray-300 rounded px-3 py-1.5 w-48 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Enter search value..."
              />
              <button
                onClick={() => setPage(1)}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-primary rounded hover:bg-primary-dark transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-10 px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Sub Class</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Under Yr</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Retention Value</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">1st Surplus Value</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Line Nos</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((row, idx) => (
                <tr
                  key={row.distributionID}
                  className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                    selected.has(row.distributionID) ? "bg-blue-50" : idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                >
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(row.distributionID)}
                      onChange={() => toggleRow(row.distributionID)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => navigate(`/reinsurance/maintenance/treaty-distribution/${row.distributionID}`)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {row.distributionID}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">{row.subRiskID}</td>
                  <td className="px-4 py-2.5 text-gray-700">{row.underYr}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{fmt(row.retention)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{fmt(row.surplus1)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{row.lineNos}</td>
                  <td className="px-4 py-2.5 text-center">
                     {/* View Icon */}
    <button
      onClick={() => navigate(`/reinsurance/maintenance/treaty-distribution/view/${row.distributionID}`)}
      className="text-blue-600 hover:text-blue-800"
      title="View"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    </button>
    
    {/* Edit Icon */}
    <button
      onClick={() => navigate(`/reinsurance/maintenance/treaty-distribution/edit/${row.distributionID}`)}
      className="text-green-600 hover:text-green-800"
      title="Edit"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
                    <button
                      onClick={() => handleDeleteClick(row.distributionID)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}

              {pageData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 flex-wrap gap-3">
          {/* Summary */}
          <span className="text-sm text-gray-600">
            {filteredData.length === 0
              ? "0 records"
              : `${(page - 1) * pageSize + 1} to ${Math.min(page * pageSize, filteredData.length)} of ${filteredData.length}`}
          </span>

          {/* Page buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="min-w-[30px] h-7 px-2 text-sm rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ←
            </button>
            {pageNumbers.map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`min-w-[30px] h-7 px-2 text-sm rounded border transition-colors ${
                    page === p
                      ? "bg-primary text-white border-primary font-semibold"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="min-w-[30px] h-7 px-2 text-sm rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              →
            </button>
          </div>

          {/* Page size */}
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s} items per page</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          
          <button
            onClick={handleBulkDelete}
            disabled={selected.size === 0}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete {selected.size > 0 ? `(${selected.size})` : ""}
          </button>
          <button
            onClick={() => navigate("/reinsurance/maintenance/treaty-distribution/new")}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-primary rounded hover:bg-primary-dark transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Distribution
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              {deletingId 
                ? "Are you sure you want to delete this distribution? This action cannot be undone."
                : `Are you sure you want to delete ${selected.size} distribution(s)? This action cannot be undone.`
              }
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingId(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatyDistribution;