// pages/Reinsurance/Treaties/FinalRIDistribution.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TABS = [
  "Process Underwriting Treaty",
  "RI Distribution",
  "Final RI Distribution",
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const fmt = (n: number) => n?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';

const FinalRIDistribution: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(2);
  const [loading, setLoading] = useState(false);
  const [debitNotes, setDebitNotes] = useState<any[]>([]);
  const [selectedRisk, setSelectedRisk] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  const [filterField, setFilterField] = useState("Debit Note #");
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizingId, setFinalizingId] = useState<number | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeNotes, setFinalizeNotes] = useState('');

  const RISK_CLASSES = [
    { key: '', label: 'All Risks' },
    { key: 'AG', label: 'Agric' },
    { key: 'B', label: 'Bond' },
    { key: 'E', label: 'Engineering' },
    { key: 'F', label: 'Fire' },
    { key: 'G', label: 'General Accident' },
    { key: 'H', label: 'Aviation' },
    { key: 'M', label: 'Marine Cargo' },
    { key: 'MH', label: 'Marine Hull' },
    { key: 'O', label: 'Oil and Energy' },
    { key: 'S', label: 'Special Risk' },
    { key: 'V', label: 'Motor' },
  ];

  useEffect(() => {
    fetchDebitNotes();
  }, [selectedRisk, pagination.page, pagination.pageSize]);

  const fetchDebitNotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedRisk) params.append('RiskClass', selectedRisk);
      params.append('Page', pagination.page.toString());
      params.append('PageSize', pagination.pageSize.toString());
      
      const response = await fetch(`/api/reinsurance-treaties/debit-notes-treaties?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDebitNotes(data.items || []);
        setPagination(prev => ({
          ...prev,
          totalItems: data.totalItems || 0,
          totalPages: data.totalPages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching debit notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = debitNotes.filter((note) => {
    if (!showSearchFilter || !filterValue) return true;
    if (filterField === "Debit Note #") {
      return note.debitNoteNumber?.toLowerCase().includes(filterValue.toLowerCase());
    }
    if (filterField === "Treaty #") {
      return note.treatyNumber?.toLowerCase().includes(filterValue.toLowerCase());
    }
    if (filterField === "Ceding Company") {
      return note.cedingCompany?.toLowerCase().includes(filterValue.toLowerCase());
    }
    return true;
  });

  const currentPageData = filteredData;
  const allPageSelected = currentPageData.length > 0 && currentPageData.every(item => selected.has(item.id));
  
  const toggleAll = () => {
    if (allPageSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(currentPageData.map(item => item.id)));
    }
  };
  
  const toggleRow = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleFinalizeClick = (id: number) => {
    setFinalizingId(id);
    setFinalizeNotes('');
    setShowFinalizeModal(true);
  };

  const handleBulkFinalize = () => {
    if (selected.size === 0) return;
    setFinalizingId(null);
    setFinalizeNotes('');
    setShowFinalizeModal(true);
  };

  const handleFinalizeConfirm = async () => {
    setIsFinalizing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowFinalizeModal(false);
      setSelected(new Set());
      fetchDebitNotes();
    } catch (error) {
      console.error('Error finalizing distribution:', error);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleApplyFilter = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearFilter = () => {
    setFilterValue('');
    setShowSearchFilter(false);
  };

  const pageNumbers = () => {
    const pages: (number | "...")[] = [];
    const totalPages = pagination.totalPages;
    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = 1; i <= 7; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  if (loading && debitNotes.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Finalize Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Finalize RI Distribution</h3>
            <p className="text-gray-600 mb-4">
              {finalizingId 
                ? "Are you sure you want to finalize the distribution for this debit note?"
                : `Are you sure you want to finalize distribution for ${selected.size} debit note(s)?`
              }
            </p>
            <textarea
              value={finalizeNotes}
              onChange={(e) => setFinalizeNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-4"
              rows={3}
              placeholder="Add finalization notes..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowFinalizeModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalizeConfirm}
                disabled={isFinalizing}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 flex items-center gap-2"
              >
                {isFinalizing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                Finalize
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Final RI Distribution</h1>
      </div>

      <div className="border-b border-gray-300">
        <div className="flex gap-0">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(i);
                if (i === 0) navigate("/reinsurance/treaties/process-underwriting-treaty");
                if (i === 1) navigate("/reinsurance/treaties/ri-distribution");
                if (i === 2) navigate("/reinsurance/treaties/final-ri-distribution");
              }}
              className={`px-4 py-2 text-sm font-medium border border-b-0 rounded-t-md mr-1 cursor-pointer transition-colors ${
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

      <div className="bg-white border border-gray-300 border-t-0 rounded-b-lg shadow-sm">
        {/* Risk Class Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2 flex-wrap">
            {RISK_CLASSES.map((risk) => (
              <button
                key={risk.key}
                onClick={() => {
                  setSelectedRisk(risk.key);
                  setSelected(new Set());
                }}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  selectedRisk === risk.key
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {risk.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Filter Checkbox */}
        <div className="p-4 border-b border-gray-200">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={showSearchFilter}
              onChange={(e) => {
                setShowSearchFilter(e.target.checked);
                if (!e.target.checked) {
                  setFilterValue("");
                }
              }}
              className="rounded border-gray-300"
            />
            Search Filter
          </label>

          {/* Search Filter Dropdown - Only shows when checkbox is checked */}
          {showSearchFilter && (
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-600">where</span>
              <select
                value={filterField}
                onChange={(e) => setFilterField(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1.5"
              >
                <option>Debit Note #</option>
                <option>Treaty #</option>
                <option>Ceding Company</option>
              </select>
              <span className="text-sm text-gray-600">contains</span>
              <input
                type="text"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyFilter()}
                className="text-sm border border-gray-300 rounded px-3 py-1.5 w-48"
                placeholder="Enter search value..."
              />
              <button
                onClick={handleApplyFilter}
                className="px-4 py-1.5 text-sm font-medium text-white bg-primary rounded hover:bg-primary-dark"
              >
                Apply
              </button>
              <button
                onClick={handleClearFilter}
                className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {currentPageData.length} of {pagination.totalItems} debit notes
            {selectedRisk && <span className="ml-2 text-primary">(Risk Class: {RISK_CLASSES.find(r => r.key === selectedRisk)?.label})</span>}
            {showSearchFilter && filterValue && <span className="ml-2 text-blue-600">(Filtered)</span>}
          </div>
          <button
            onClick={handleBulkFinalize}
            disabled={selected.size === 0}
            className="px-3 py-1 text-sm text-white bg-purple-600 rounded disabled:opacity-50 hover:bg-purple-700"
          >
            Finalize Selected ({selected.size})
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" checked={allPageSelected} onChange={toggleAll} />
                </th>
                <th className="px-4 py-3 text-left font-semibold">Debit Note #</th>
                <th className="px-4 py-3 text-left font-semibold">Treaty #</th>
                <th className="px-4 py-3 text-left font-semibold">Ceding Company</th>
                <th className="px-4 py-3 text-right font-semibold">Premium Amount</th>
                <th className="px-4 py-3 text-right font-semibold">Commission</th>
                <th className="px-4 py-3 text-right font-semibold">Net Amount</th>
                <th className="px-4 py-3 text-left font-semibold">Debit Note Date</th>
                <th className="px-4 py-3 text-left font-semibold">Due Date</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPageData.map((note, idx) => (
                <tr key={note.id} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(note.id)}
                      onChange={() => toggleRow(note.id)}
                      disabled={note.status === 'Finalized'}
                    />
                  </td>
                  <td className="px-4 py-2.5 font-medium">{note.debitNoteNumber}</td>
                  <td className="px-4 py-2.5">{note.treatyNumber}</td>
                  <td className="px-4 py-2.5">{note.cedingCompany}</td>
                  <td className="px-4 py-2.5 text-right">{fmt(note.premiumAmount)}</td>
                  <td className="px-4 py-2.5 text-right">{fmt(note.commissionAmount)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{fmt(note.netAmount)}</td>
                  <td className="px-4 py-2.5">{new Date(note.debitNoteDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5">{new Date(note.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      note.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      note.status === 'Distributed' ? 'bg-blue-100 text-blue-800' :
                      note.status === 'Finalized' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {note.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {(note.status === 'Distributed' || note.status === 'Pending') && (
                      <button
                        onClick={() => handleFinalizeClick(note.id)}
                        className="text-purple-600 hover:text-purple-800"
                        title="Finalize"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {currentPageData.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-gray-400">
                    No debit notes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalItems > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              {(pagination.page - 1) * pagination.pageSize + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-50"
              >
                ←
              </button>
              {pageNumbers().map((p, i) => (
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-gray-400">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPagination(prev => ({ ...prev, page: p as number }))}
                    className={`px-3 py-1 text-sm border rounded ${
                      pagination.page === p ? 'bg-primary text-white' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              ))}
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-50"
              >
                →
              </button>
            </div>
            <select
              value={pagination.pageSize}
              onChange={(e) => setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), page: 1 }))}
              className="text-sm border rounded px-2 py-1"
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinalRIDistribution;