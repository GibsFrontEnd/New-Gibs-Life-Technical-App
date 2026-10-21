// Reinsurance → Treaties → Group Life Underwriting Treaty.
// Lists every group life debit note raised in Underwriting (the same notes as the scheme's Debit Note tab).
import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Loader2, RefreshCw, SlidersHorizontal, X } from 'lucide-react';
import { SERVER_URL } from '../../../utils/constants';
import {
  EmptyState,
  PageHeader,
  PageShell,
  Pager,
  Panel,
  SearchField,
  StatusChip,
  btnOutline,
  btnPrimary,
  btnRow,
  inputBase,
  tableCls,
} from '../../../components/page/PageKit';

interface GroupDebitNote {
  debitNoteNo: string;
  policyNo: string;
  insuredName: string;
  partyName: string;
  bizSource: string;
  bizOption: string;
  sumInsured: number;
  grossPremium: number;
  netAmount: number;
  billingDate: string | null;
  submittedBy: string;
  approvalStatus: string;
}

const PAGE_SIZE = 15;

const fmt = (n: number | null | undefined) =>
  n == null ? '—' : `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
};

const GroupLifeTreatyDebitNotes: React.FC = () => {
  const [notes, setNotes] = useState<GroupDebitNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // ticked debit notes, kept across pages; Process sends them to the treaty
  const [selected, setSelected] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  // search as the user types, without a request per keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const p = new URLSearchParams({ Page: String(page), PageSize: String(PAGE_SIZE) });
      if (query) p.set('Search', query);
      if (from) p.set('BillingFrom', from);
      if (to) p.set('BillingTo', to);
      const res = await fetch(`${SERVER_URL}/grouplife/debit-notes?${p.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message || `Failed to load debit notes (${res.status})`);
        setNotes([]);
        setTotal(0);
        return;
      }
      const data = await res.json();
      setNotes(data.items || []);
      setTotal(data.totalCount || 0);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, query, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const pageNos = notes.map(n => n.debitNoteNo);
  const allOnPage = pageNos.length > 0 && pageNos.every(n => selected.includes(n));
  const toggleRow = (no: string) => setSelected(prev => (prev.includes(no) ? prev.filter(n => n !== no) : [...prev, no]));
  const togglePage = () =>
    setSelected(prev => (allOnPage ? prev.filter(n => !pageNos.includes(n)) : [...new Set([...prev, ...pageNos])]));

  const processSelected = async () => {
    if (selected.length === 0) {
      setNotice({ ok: false, text: 'Please select a debit note to process.' });
      return;
    }
    if (!window.confirm(`Process ${selected.length} selected debit note${selected.length === 1 ? '' : 's'}?`)) return;
    setProcessing(true);
    setNotice(null);
    try {
      const res = await fetch(`${SERVER_URL}/reinsurance-treaties/raw-treaty/process-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(selected),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setNotice({ ok: false, text: body?.message || `Processing failed (${res.status})` });
        return;
      }
      setNotice({ ok: true, text: `${selected.length} debit note${selected.length === 1 ? '' : 's'} processed successfully.` });
      setSelected([]);
      load();
    } catch {
      setNotice({ ok: false, text: 'Network error. Please try again.' });
    } finally {
      setProcessing(false);
    }
  };

  const activeFilters = (from ? 1 : 0) + (to ? 1 : 0);
  const filtering = !!query || activeFilters > 0;
  const reset = () => {
    setSearch('');
    setQuery('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Reinsurance · Treaties"
        title="Group Life Underwriting Treaty"
        description="Group life debit notes raised in Underwriting."
      />

      <Panel bodyClassName="space-y-4 p-5 sm:p-6">
        <div className="flex min-w-0 gap-3">
          <SearchField value={search} onChange={setSearch} placeholder="Search debit note, policy, party or insured" />
          <button type="button" className={btnOutline + ' h-12 shrink-0'} onClick={() => setFiltersOpen(p => !p)} aria-expanded={filtersOpen}>
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters > 0 && <span className="rounded-full bg-[#155dfd] px-1.5 text-xs text-white">{activeFilters}</span>}
          </button>
        </div>

        {filtersOpen && (
          <div className="border-t border-slate-100 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Billing date from</span>
                <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} className={inputBase} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Billing date to</span>
                <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} className={inputBase} />
              </label>
            </div>
          </div>
        )}

        {filtering && (
          <div className="flex justify-end">
            <button onClick={reset} className={btnRow}>
              <X size={14} /> Clear search and filters
            </button>
          </div>
        )}
      </Panel>

      <p className="text-sm text-slate-500">
        {loading ? 'Loading…' : `${total.toLocaleString('en-NG')} debit note${total === 1 ? '' : 's'}${query ? ` matching “${query}”` : ''}`}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={processSelected}
          disabled={processing || selected.length === 0}
          className={btnPrimary}
          title={selected.length === 0 ? 'Tick a debit note first' : 'Process the selected debit notes'}
        >
          {processing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          {processing ? 'Processing…' : `Process Selected (${selected.length})`}
        </button>
        {selected.length > 0 && (
          <button type="button" onClick={() => setSelected([])} className={btnRow}>
            <X size={14} /> Clear selection
          </button>
        )}
      </div>
      {notice && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${notice.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>{notice.text}</div>
      )}

      <Panel flush>
        {error ? (
          <EmptyState
            icon={AlertCircle}
            title="Couldn't load debit notes"
            description={error}
            action={
              <button onClick={load} className={btnPrimary}>
                <RefreshCw size={15} /> Retry
              </button>
            }
          />
        ) : (
          <div className={tableCls.wrap}>
            <table className={tableCls.table}>
              <thead className={tableCls.thead}>
                <tr>
                  <th className={tableCls.th + ' w-[44px]'}>
                    <input type="checkbox" checked={allOnPage} onChange={togglePage} aria-label="Select all debit notes on this page" className="h-4 w-4 rounded border-slate-300" />
                  </th>
                  <th className={tableCls.th + ' w-[190px]'}>Debit note</th>
                  <th className={tableCls.th}>Scheme</th>
                  <th className={tableCls.th + ' w-[170px] text-right'}>Gross premium</th>
                  <th className={tableCls.th + ' hidden w-[140px] @3xl:table-cell'}>Billing date</th>
                  <th className={tableCls.th + ' w-[120px]'}>Status</th>
                </tr>
              </thead>
              <tbody>
                {notes.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={FileText}
                        title={loading ? 'Loading debit notes…' : 'No debit notes found'}
                        description={loading ? undefined : filtering ? 'Try a different search or clear the filters.' : undefined}
                      />
                    </td>
                  </tr>
                ) : (
                  notes.map(n => (
                    <tr key={n.debitNoteNo} className={tableCls.tr}>
                      <td className={tableCls.td}>
                        <input type="checkbox" checked={selected.includes(n.debitNoteNo)} onChange={() => toggleRow(n.debitNoteNo)} aria-label={`Select ${n.debitNoteNo}`} className="h-4 w-4 rounded border-slate-300" />
                      </td>
                      <td className={tableCls.td}>
                        <div className={tableCls.primary} title={n.debitNoteNo}>{n.debitNoteNo}</div>
                        <div className={tableCls.secondary}>
                          {[n.bizOption, n.bizSource && n.bizSource !== 'NULL' ? n.bizSource : ''].filter(Boolean).join(' · ')}
                        </div>
                      </td>
                      <td className={tableCls.td}>
                        <div className={tableCls.primary} title={(n.insuredName || n.partyName || '').trim()}>
                          {(n.insuredName || n.partyName || '').trim() || '—'}
                        </div>
                        <div className={tableCls.secondary} title={n.policyNo}>{n.policyNo || '—'}</div>
                      </td>
                      <td className={tableCls.td + ' text-right'}>
                        <div className={tableCls.primary} title={fmt(n.grossPremium)}>{fmt(n.grossPremium)}</div>
                        <div className={tableCls.secondary}>Net {fmt(n.netAmount)}</div>
                      </td>
                      <td className={tableCls.td + ' hidden @3xl:table-cell'}>
                        <div className="truncate text-slate-900">{fmtDate(n.billingDate)}</div>
                        {n.submittedBy && <div className={tableCls.secondary}>{n.submittedBy}</div>}
                      </td>
                      <td className={tableCls.td}>
                        <StatusChip status={n.approvalStatus || 'Pending'} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pager page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
      </Panel>
    </PageShell>
  );
};

export default GroupLifeTreatyDebitNotes;
