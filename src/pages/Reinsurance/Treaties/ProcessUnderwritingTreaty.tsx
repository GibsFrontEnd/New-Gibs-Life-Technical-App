// pages/Reinsurance/Maintenance/ProcessUnderwritingTreaty.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GroupLifeTreatyDebitNotes from './GroupLifeTreatyDebitNotes';
import IndividualLifeTreatyPolicies from './IndividualLifeTreatyPolicies';
import RIDistribution from './RIDistribution';
import FinalRIDistribution from './FinalRIDistribution';
import DebitNoteViewEdit, { DebitNote, getApprovalLabel, getApprovalStyle } from '../../../components/Reinsurance/DebitNoteViewEdit';
import { SERVER_URL } from '../../../utils/constants';

const TABS = [
  'Process Underwriting Treaty',
  'RI Distribution',
  'Final RI Distribution',
];

const RISK_CLASSES = [
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

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const fmt = (n: number) =>
  n?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({
  type,
  message,
  onClose,
}: {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-20 right-4 z-[60]">
      <div
        className={`rounded-lg shadow-lg p-4 min-w-[320px] flex items-start gap-3 ${
          type === 'success'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}
      >
        <div className="flex-shrink-0 mt-0.5">
          {type === 'success' ? (
            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <p className={`text-sm font-medium flex-1 ${type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
          {message}
        </p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors ml-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ── Root tabs ─────────────────────────────────────────────────────────────────
const ProcessUnderwritingTreaty: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(0);
  const isGroupLife = searchParams.get('class') === 'group';

  // Group Life Underwriting Treaty is its own screen: RI Distribution and Final RI Distribution have their own menu items
  if (isGroupLife) return <GroupLifeTreatyDebitNotes />;
  if (searchParams.get('class') === 'individual') return <IndividualLifeTreatyPolicies />;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Process Underwriting Treaty</h1>
      </div>

      <div className="border-b border-gray-300">
        <div className="flex gap-0">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(i);
                if (i === 0) navigate('/reinsurance/treaties/process-underwriting-treaty');
                if (i === 1) navigate('/reinsurance/treaties/ri-distribution');
                if (i === 2) navigate('/reinsurance/treaties/final-ri-distribution');
              }}
              className={`px-4 py-2 text-sm font-medium border border-b-0 rounded-t-md mr-1 cursor-pointer transition-colors ${
                activeTab === i
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-300 border-t-0 rounded-b-lg shadow-sm">
        {activeTab === 0 && <ProcessUnderwritingContent />}
        {activeTab === 1 && <RIDistribution />}
        {activeTab === 2 && <FinalRIDistribution />}
      </div>
    </div>
  );
};

// ── Main content ──────────────────────────────────────────────────────────────
const ProcessUnderwritingContent: React.FC = () => {
  const [debitNotes, setDebitNotes] = useState<DebitNote[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedRisk, setSelectedRisk] = useState('F');
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  const [filterField, setFilterField] = useState('dncnNo');

  // Date range state
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 2);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Pagination — flat state so goToPage(n) just sets page, nothing else resets it
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Selection — persists across page navigation
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingProcessId, setPendingProcessId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewNote, setViewNote] = useState<DebitNote | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ── Date range handlers ─────────────────────────────────────────────────────
  const handleDateFilterToggle = (checked: boolean) => {
    setShowDateFilter(checked);
    setPage(1);
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFrom(e.target.value);
    setPage(1);
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateTo(e.target.value);
    setPage(1);
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchDebitNotes = useCallback(async (pg: number, pgSize: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedRisk) params.append('RiskClass', selectedRisk);

      // Date range logic
      if (showDateFilter && dateFrom && dateTo) {
        // Use user-selected dates
        params.append('Date1', new Date(dateFrom).toISOString());
        params.append('Date2', new Date(dateTo).toISOString());
      } else {
        // Default: last 2 years (dynamic)
        const date2 = new Date().toISOString();  // Today's date
        const date1 = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString(); // 2 years ago
        params.append('Date1', date1);
        params.append('Date2', date2);
      }
      
      params.append('Page', pg.toString());
      params.append('PageSize', pgSize.toString());

      if (showSearchFilter && filterValue.trim()) {
        params.append('SearchField', filterField);
        params.append('SearchText', filterValue.trim());
      }

      const response = await fetch(
        `${SERVER_URL}/reinsurance-treaties/debit-notes-treaties?${params.toString()}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setDebitNotes(data.items || []);
        setTotalItems(data.totalCount || 0);
        setTotalPages(data.totalPages || 0);
      } else {
        setToast({ type: 'error', message: `Failed to fetch data (${response.status})` });
      }
    } catch {
      setToast({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, [selectedRisk, showSearchFilter, filterField, filterValue, showDateFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchDebitNotes(page, pageSize);
  }, [page, pageSize, fetchDebitNotes]);

  // ── Filter / risk handlers — these reset to page 1 ───────────────────────
  const handleRiskChange = (risk: string) => {
    setSelectedRisk(risk);
    setSelected(new Set());
    setPage(1);
  };

  const handleSearchFilterToggle = (checked: boolean) => {
    setShowSearchFilter(checked);
    if (!checked) setFilterValue('');
    setPage(1);
  };

  const handleFilterClear = () => {
    setFilterValue('');
    setPage(1);
  };

  // ── Pagination — goToPage does NOT touch selected ─────────────────────────
  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    // selections are intentionally NOT cleared here
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  // ── Selection ─────────────────────────────────────────────────────────────
  const selectableOnPage = debitNotes;  // Remove the filter - make all notes selectable
  const allOnPageSelected =
    selectableOnPage.length > 0 && selectableOnPage.every(n => selected.has(n.dncnNo));
  const someOnPageSelected =
    selectableOnPage.some(n => selected.has(n.dncnNo)) && !allOnPageSelected;

  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        selectableOnPage.forEach(n => next.delete(n.dncnNo));
      } else {
        selectableOnPage.forEach(n => next.add(n.dncnNo));
      }
      return next;
    });
  };

  const toggleRow = (dncnNo: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(dncnNo) ? next.delete(dncnNo) : next.add(dncnNo);
      return next;
    });
  };

  // ── Process ───────────────────────────────────────────────────────────────
  const openProcessSingle = (dncnNo: string) => {
    setPendingProcessId(dncnNo);
    setShowConfirmModal(true);
  };

  const openProcessBulk = () => {
    if (selected.size === 0) return;
    setPendingProcessId(null);
    setShowConfirmModal(true);
  };

  const handleConfirmProcess = async () => {
    setIsProcessing(true);
    try {
      let response: Response;

      if (pendingProcessId) {
        response = await fetch(
          `${SERVER_URL}/reinsurance-treaties/raw-treaty/process/${pendingProcessId}`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );
      } else {
        response = await fetch(
          `${SERVER_URL}/reinsurance-treaties/raw-treaty/process-bulk`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify([...selected]),
          }
        );
      }

      const data = await response.json().catch(() => null);

      if (response.ok) {
        setShowConfirmModal(false);
        const count = selected.size;
        setSelected(new Set());
        setToast({
          type: 'success',
          message: pendingProcessId
            ? `Debit note ${pendingProcessId} processed successfully!`
            : `${count} debit note(s) processed successfully!`,
        });
        fetchDebitNotes(page, pageSize);
      } else {
        setToast({
          type: 'error',
          message: data?.message || `Processing failed (${response.status})`,
        });
      }
    } catch {
      setToast({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Page numbers ──────────────────────────────────────────────────────────
  const pageNumbers = useMemo((): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, page]);

  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {viewNote && (
        <DebitNoteViewEdit
          note={viewNote}
          onClose={() => setViewNote(null)}
          onSaved={() => {
            setViewNote(null);
            fetchDebitNotes(page, pageSize);
            setToast({ type: 'success', message: 'Debit note updated successfully!' });
          }}
        />
      )}

      {/* Confirm process modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Confirm Processing</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {pendingProcessId
                    ? `Process debit note ${pendingProcessId}?`
                    : `Process ${selected.size} selected debit note(s)?`}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmProcess}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 disabled:opacity-60"
              >
                {isProcessing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                {isProcessing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Risk class filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-2 flex-wrap">
          {RISK_CLASSES.map(risk => (
            <button
              key={risk.key}
              onClick={() => handleRiskChange(risk.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                selectedRisk === risk.key
                   ? "bg-primary text-white border-primary font-semibold"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {risk.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search filter */}
      <div className="p-4 border-b border-gray-200">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={showSearchFilter}
            onChange={e => handleSearchFilterToggle(e.target.checked)}
            className="rounded border-gray-300"
          />
          Search Filter
        </label>

        {showSearchFilter && (
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-600">where</span>
            <select
              value={filterField}
              onChange={e => { setFilterField(e.target.value); setPage(1); }}
              className="text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="dncnNo">Debit Note #</option>
              <option value="policyNo">Policy #</option>
              <option value="insuredName">Insured Name</option>
              <option value="bizSource">Biz Source</option>
            </select>
            <span className="text-sm text-gray-600">contains</span>
            <input
              type="text"
              value={filterValue}
              onChange={e => { setFilterValue(e.target.value); setPage(1); }}
              className="text-sm border border-gray-300 rounded px-3 py-1.5 w-48 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="Enter search value..."
            />
            <button
              onClick={handleFilterClear}
              className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Date Range Filter */}
      <div className="p-4 border-b border-gray-200">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={showDateFilter}
            onChange={e => handleDateFilterToggle(e.target.checked)}
            className="rounded border-gray-300"
          />
          Date Range Filter
        </label>
        
        {showDateFilter && (
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-600">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={handleDateFromChange}
              className="text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
            <span className="text-sm text-gray-600">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={handleDateToChange}
              className="text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>
        )}
      </div>

      {/* Stats + bulk process button */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {loading ? (
            <span>Loading...</span>
          ) : (
            <>
              {totalItems > 0 ? `${startItem}–${endItem} of ${totalItems} debit notes` : '0 debit notes'}
              {selectedRisk && (
                <span className="ml-2 text-red-600 font-medium">
                  · {RISK_CLASSES.find(r => r.key === selectedRisk)?.label}
                </span>
              )}
              {selected.size > 0 && (
                <span className="ml-2 text-blue-600 font-medium">· {selected.size} selected</span>
              )}
            </>
          )}
        </div>

        {/* Enabled as soon as any checkbox is ticked */}
        <button
          onClick={openProcessBulk}
          disabled={selected.size === 0}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-all ${
            selected.size > 0
              ? 'text-white bg-green-600 hover:bg-green-700 shadow-sm cursor-pointer'
              : 'text-white bg-green-300 cursor-not-allowed'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Process Selected ({selected.size})
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-10 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    ref={el => {
                      if (el) el.indeterminate = someOnPageSelected;
                    }}
                    onChange={toggleAll}
                    className="rounded border-gray-300 cursor-pointer"
                    title={allOnPageSelected ? 'Deselect all on this page' : 'Select all on this page'}
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Debit Note #</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Policy #</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Insured Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Biz Source</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Gross Premium</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Net Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Billing Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Submitted By</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {debitNotes.map((note, idx) => {
                const isSelectable = true; 
                const isSelected = selected.has(note.dncnNo);
                return (
                  <tr
                    key={note.dncnNo}
                    className={`border-b border-gray-100 transition-colors ${
                      isSelected ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    } hover:bg-blue-50`}
                  >
                    <td className="px-3 py-2.5 text-center">
                      {isSelectable ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(note.dncnNo)}
                          className="rounded border-gray-300 cursor-pointer"
                        />
                      ) : (
                        <input
                          type="checkbox"
                          disabled
                          className="opacity-30 cursor-not-allowed"
                          title="Already approved"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-blue-700">{note.dncnNo}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs">{note.policyNo}</td>
                    <td className="px-4 py-2.5 max-w-[200px] truncate" title={note.insuredName?.trim()}>
                      {note.insuredName?.trim()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">
                        {!note.bizSource || note.bizSource === 'NULL' ? '—' : note.bizSource}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmt(note.grossPremium)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{fmt(note.netAmount)}</td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {note.billingDate ? new Date(note.billingDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{note.submittedBy}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getApprovalStyle(note.approval)}`}>
                        {getApprovalLabel(note.approval)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-2">
                        {/* View / Edit */}
                        <button
                          onClick={() => setViewNote(note)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="View / Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {/* Process single — non-approved only */}
                        {isSelectable && (
                          <button
                            onClick={() => openProcessSingle(note.dncnNo)}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            title="Process this note"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {debitNotes.length === 0 && !loading && (
                <tr>
                  <td colSpan={11} className="px-4 py-14 text-center text-gray-400">
                    <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    No debit notes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 flex-wrap gap-3">
          <span className="text-sm text-gray-600">
            Showing {startItem} to {endItem} of {totalItems} entries
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(1)}
              disabled={page === 1}
              className="min-w-[30px] h-7 px-2 text-sm rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >«</button>
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="min-w-[30px] h-7 px-2 text-sm rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >‹</button>

            {pageNumbers.map((p, i) =>
              p === '...' ? (
                <span key={`e-${i}`} className="px-2 text-gray-400 text-sm">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p as number)}
                  className={`min-w-[30px] h-7 px-2 text-sm rounded border transition-colors ${
                    page === p
                      ? "bg-primary text-white border-primary font-semibold"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >{p}</button>
              )
            )}

            <button
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className="min-w-[30px] h-7 px-2 text-sm rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >›</button>
            <button
              onClick={() => goToPage(totalPages)}
              disabled={page === totalPages}
              className="min-w-[30px] h-7 px-2 text-sm rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >»</button>
          </div>

          <select
            value={pageSize}
            onChange={e => handlePageSizeChange(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none"
          >
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>{size} per page</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default ProcessUnderwritingTreaty;