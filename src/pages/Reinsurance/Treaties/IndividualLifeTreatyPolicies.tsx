// Reinsurance → Treaties → Individual Life Underwriting Treaty.
// Lists every in-force individual life policy (investment, traditional and the rest), with search and filters.
import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, FileText, RefreshCw, SlidersHorizontal, X } from 'lucide-react';
import apiCall from '../../../utils/api-call';
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

interface Policy {
  policyID: number;
  policyNo: string | null;
  coverCode: string | null;
  covertype: string | null;
  fullName: string | null;
  sex: string | null;
  age: number | null;
  sumAssured: number | null;
  totalPremium: number | null;
  mop: string | null;
  fop: string | null;
  startDate: string | null;
  maturityDate: string | null;
  tag: string | null;
  status: string | null;
  transSTATUS: string | null;
  remarks: string | null;
}

const PAGE_SIZE = 15;

const CLASS_LABEL: Record<string, string> = { A: 'Traditional', B: 'Investment', N: 'Annuity' };

const fmt = (n: number | null | undefined) =>
  n == null ? '—' : `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
};

const IndividualLifeTreatyPolicies: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [coverCode, setCoverCode] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

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
      const r = await apiCall.get('/v1/lifepolicyAdmin/policies', {
        params: {
          page,
          pageSize: PAGE_SIZE,
          q: query || undefined,
          coverCode: coverCode.trim() || undefined,
          fromDate: from || undefined,
          toDate: to || undefined,
        },
      });
      setPolicies(r.data?.items || []);
      setTotal(r.data?.totalCount || 0);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load policies.');
      setPolicies([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, query, coverCode, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const activeFilters = [coverCode, from, to].filter(Boolean).length;
  const filtering = !!query || activeFilters > 0;
  const reset = () => {
    setSearch('');
    setQuery('');
    setCoverCode('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Reinsurance · Treaties"
        title="Individual Life Underwriting Treaty"
        description="In-force individual life policies."
      />

      <Panel bodyClassName="space-y-4 p-5 sm:p-6">
        <div className="flex min-w-0 gap-3">
          <SearchField value={search} onChange={setSearch} placeholder="Search policy number, client, product or agent" />
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
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Cover code</span>
                <input value={coverCode} onChange={e => { setCoverCode(e.target.value); setPage(1); }} placeholder="e.g. CEE" className={inputBase} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Start date from</span>
                <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} className={inputBase} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Start date to</span>
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
        {loading ? 'Loading…' : `${total.toLocaleString('en-NG')} polic${total === 1 ? 'y' : 'ies'}${query ? ` matching “${query}”` : ''}`}
      </p>

      <Panel flush>
        {error ? (
          <EmptyState
            icon={AlertCircle}
            title="Couldn't load policies"
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
                  <th className={tableCls.th + ' w-[190px]'}>Policy</th>
                  <th className={tableCls.th}>Client</th>
                  <th className={tableCls.th + ' w-[170px] text-right'}>Sum assured</th>
                  <th className={tableCls.th + ' hidden w-[140px] @3xl:table-cell'}>Start</th>
                  <th className={tableCls.th + ' w-[120px]'}>Status</th>
                </tr>
              </thead>
              <tbody>
                {policies.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        icon={FileText}
                        title={loading ? 'Loading policies…' : 'No policies found'}
                        description={loading ? undefined : filtering ? 'Try a different search or clear the filters.' : undefined}
                      />
                    </td>
                  </tr>
                ) : (
                  policies.map(p => (
                    <tr key={p.policyID || p.policyNo} className={tableCls.tr}>
                      <td className={tableCls.td}>
                        <div className={tableCls.primary} title={p.policyNo || ''}>{p.policyNo || '—'}</div>
                        <div className={tableCls.secondary} title={p.covertype || ''}>
                          {[p.coverCode, CLASS_LABEL[p.tag || ''] || p.tag].filter(Boolean).join(' · ')}
                        </div>
                      </td>
                      <td className={tableCls.td}>
                        <div className={tableCls.primary} title={p.fullName || ''}>{p.fullName || '—'}</div>
                        <div className={tableCls.secondary}>{[p.sex, p.age != null && `Age ${p.age}`].filter(Boolean).join(' · ')}</div>
                      </td>
                      <td className={tableCls.td + ' text-right'}>
                        <div className={tableCls.primary}>{fmt(p.sumAssured)}</div>
                        <div className={tableCls.secondary}>
                          {fmt(p.totalPremium)}
                          {p.fop ? ` · ${String(p.fop).toLowerCase()}` : ''}
                        </div>
                      </td>
                      <td className={tableCls.td + ' hidden @3xl:table-cell'}>
                        <div className="truncate text-slate-900">{fmtDate(p.startDate)}</div>
                        <div className={tableCls.secondary}>to {fmtDate(p.maturityDate)}</div>
                      </td>
                      <td className={tableCls.td}>
                        <StatusChip status={p.transSTATUS || p.status || p.remarks || 'Unknown'} />
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

export default IndividualLifeTreatyPolicies;
