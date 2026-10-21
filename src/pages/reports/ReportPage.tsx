// @ts-nocheck
import { useMemo, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { CalendarRange, Clock, Eye, FileSpreadsheet, FileText, MousePointerClick, Play } from "lucide-react";
import { EmptyState, PageHeader, PageShell, Panel, SearchField, Segmented, btnPrimary, inputBase } from "../../components/page/PageKit";
import { findReport, flattenItems, reportPath, slugify } from "./reportsCatalog";

const countLabel = (n: number) => `${n} report${n === 1 ? "" : "s"}`;
const today = () => new Date().toISOString().slice(0, 10);
const startOfYear = () => `${new Date().getFullYear()}-01-01`;

const formats = [
  { value: "screen", label: "On screen", icon: Eye },
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "excel", label: "Excel", icon: FileSpreadsheet },
];

/** Switches between the reports of one section ("Individual") without going back to the menu. */
const SectionTabs = ({ section, current }: any) => (
  <nav aria-label={`${section.title} reports`} className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
    {section.reports.map((r) => {
      const on = r.slug === current;
      return (
        <Link
          key={r.slug}
          to={reportPath(section.slug, r.slug)}
          aria-current={on ? "page" : undefined}
          className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
            on ? "bg-[#155dfd] text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          {r.title}
          {r.items && <span className={`rounded-full px-1.5 text-xs ${on ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{flattenItems(r.items).length}</span>}
        </Link>
      );
    })}
  </nav>
);

/** The chosen report's parameters. Not wired to the reports server yet, so Run stays disabled. */
const RunPanel = ({ title }: { title: string }) => {
  const [from, setFrom] = useState(startOfYear());
  const [to, setTo] = useState(today());
  const [format, setFormat] = useState("screen");

  return (
    <Panel title={title} description="Set the period and output, then run the report.">
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">From</span>
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={inputBase} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">To</span>
            <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={inputBase} />
          </label>
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Output</span>
          <Segmented options={formats} value={format} onChange={setFormat} />
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
          <button type="button" className={btnPrimary} disabled title="Not connected to the reports server yet">
            <Play className="h-4 w-4" /> Run report
          </button>
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
            <Clock className="h-4 w-4" /> Not connected to the reports server yet.
          </span>
        </div>
      </div>
    </Panel>
  );
};

const ReportPage = () => {
  const { section, report } = useParams();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const hit = findReport(section, report);

  const items = useMemo(() => flattenItems(hit?.report?.items).map((it, i) => ({ ...it, no: i + 1, slug: slugify(it.title) })), [hit]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => i.title.toLowerCase().includes(q)) : items;
  }, [items, query]);

  if (!hit) return <Navigate to="/reports/overview" replace />;

  const selected = items.find((i) => i.slug === params.get("report"));
  const pick = (slug: string) => setParams({ report: slug }, { replace: true });

  return (
    <PageShell>
      <PageHeader
        eyebrow={`Reports · ${hit.section.title}`}
        title={hit.report?.title ?? hit.section.title}
        description={items.length ? `${countLabel(items.length)}. Pick one to set its period and output.` : undefined}
        backTo="/reports/overview"
        backLabel="All reports"
      />

      {hit.section.reports && <SectionTabs section={hit.section} current={hit.report?.slug} />}

      {items.length ? (
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <Panel title="Reports" flush>
            <div className="border-b border-slate-100 p-4">
              <SearchField value={query} onChange={setQuery} placeholder={`Search ${countLabel(items.length)}`} />
            </div>
            {shown.length ? (
              <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
                {shown.map((i, n) => {
                  const on = i.slug === selected?.slug;
                  const heading = i.group && i.group !== shown[n - 1]?.group;
                  return (
                    <li key={i.slug}>
                      {heading && (
                        <p className="bg-slate-50/70 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{i.group}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => pick(i.slug)}
                        aria-pressed={on}
                        className={`flex w-full items-center gap-3 px-5 py-3 text-left text-sm transition-colors ${
                          on ? "bg-blue-50 font-semibold text-[#155dfd]" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-semibold ${
                            on ? "bg-[#155dfd] text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {i.no}
                        </span>
                        <span className="min-w-0 flex-1">{i.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState title="No matching reports" description={`Nothing matches “${query}”.`} />
            )}
          </Panel>

          {selected ? (
            <RunPanel key={selected.slug} title={selected.title} />
          ) : (
            <Panel>
              <EmptyState icon={MousePointerClick} title="Pick a report" description="Choose a report from the list to set its period and output." />
            </Panel>
          )}
        </div>
      ) : (
        <Panel>
          <EmptyState icon={CalendarRange} title="Coming soon" description="This report has not been built yet." />
        </Panel>
      )}
    </PageShell>
  );
};

export default ReportPage;
