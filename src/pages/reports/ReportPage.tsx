// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { AlertCircle, CalendarRange, CheckCircle2, Clock, FileSpreadsheet, FileText, FileType, Loader2, MousePointerClick, Play } from "lucide-react";
import { EmptyState, PageHeader, PageShell, Panel, SearchField, Segmented, btnPrimary, inputBase } from "../../components/page/PageKit";
import { findReport, flattenItems, reportPath, slugify } from "./reportsCatalog";
import { exportReport, fetchParameters, loadLookup, lookupFor, paramKey, paramLabel, resolveApiName } from "./reportsApi";

const countLabel = (n: number) => `${n} report${n === 1 ? "" : "s"}`;
const pad = (n: number) => String(n).padStart(2, "0");
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const startOfYear = () => `${new Date().getFullYear()}-01-01`;

const formats = [
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "word", label: "Word", icon: FileType },
  { value: "excel", label: "Excel", icon: FileSpreadsheet },
];

const isDate = (p: any) => p.type === "DateTimeParameter";
// Report-heading text (Organization, ReportRange, Tag ...) is the only kind without the "@".
const isHeading = (p: any) => !isDate(p) && !String(p.name).startsWith("@");
const startingValue = (p: any) => (!isDate(p) ? "" : /period1$/i.test(paramKey(p.name)) ? startOfYear() : today());

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

/** One report parameter: a date, a code picked from a list (or typed), or free text. */
const ParamField = ({ param, value, onChange, min, max }: any) => {
  const key = paramKey(param.name);
  const kind = lookupFor(param.name);
  const [options, setOptions] = useState<any[]>([]);
  useEffect(() => {
    let live = true;
    if (kind) loadLookup(kind).then((list) => live && setOptions(list));
    return () => {
      live = false;
    };
  }, [kind]);

  const listId = options.length ? `report-${key}-options` : undefined;
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {paramLabel(param.name)}
        {isDate(param) && <span className="text-rose-500"> *</span>}
      </span>
      {isDate(param) ? (
        <input type="date" required value={value} min={min} max={max} onChange={(e) => onChange(e.target.value)} className={inputBase} />
      ) : (
        <>
          <input
            type="text"
            list={listId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={options.length ? "Pick from the list or type a code" : "Optional"}
            className={inputBase}
          />
          {listId && (
            <datalist id={listId}>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </datalist>
          )}
        </>
      )}
    </label>
  );
};

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/**
 * Opens the PDF's tab during the click (later it would be blocked) and shows a loader in it
 * until the report arrives.
 */
const openLoadingTab = (title: string) => {
  const tab = window.open("", "_blank");
  if (!tab) return null;
  const name = escapeHtml(title);
  tab.document.write(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Preparing ${name}…</title>
<style>
  :root { --bg: #f8fafc; --card: #ffffff; --text: #0f172a; --muted: #64748b; --ring: #dbeafe; --accent: #155dfd; --border: #e2e8f0; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0b1220; --card: #111a2e; --text: #e2e8f0; --muted: #94a3b8; --ring: #1e3a8a; --accent: #60a5fa; --border: #1f2a44; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px;
         background: var(--bg); color: var(--text); font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .card { width: 100%; max-width: 420px; padding: 32px 28px; text-align: center; background: var(--card);
          border: 1px solid var(--border); border-radius: 20px; box-shadow: 0 10px 30px rgba(15, 23, 42, .08); }
  .spinner { width: 48px; height: 48px; margin: 0 auto 20px; border-radius: 50%;
             border: 4px solid var(--ring); border-top-color: var(--accent); animation: spin .8s linear infinite; }
  h1 { margin: 0 0 6px; font-size: 17px; font-weight: 600; overflow-wrap: anywhere; }
  p { margin: 0; color: var(--muted); font-size: 14px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .spinner { animation-duration: 2.4s; } }
</style>
</head>
<body>
  <div class="card" role="status" aria-live="polite">
    <div class="spinner" aria-hidden="true"></div>
    <h1>${name}</h1>
    <p>Preparing your report. This can take a minute for long periods.</p>
  </div>
</body>
</html>`);
  tab.document.close();
  return tab;
};

/**
 * Shows a PDF in the tab opened by openLoadingTab; other formats download, as does a PDF
 * whose tab was blocked or closed while it loaded. True when it went to the tab.
 */
const deliver = ({ blob, filename }: any, tab: Window | null) => {
  const url = URL.createObjectURL(blob);
  const inTab = !!tab && !tab.closed;
  if (inTab) {
    tab.location.href = url;
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return inTab;
};

/** The chosen report's parameters, as the report server lists them, and the Run button. */
const RunPanel = ({ title, endpoint, apiName }: { title: string; endpoint?: string; apiName?: string }) => {
  const [state, setState] = useState<{ loading: boolean; error?: string; report?: string; params: any[] }>({ loading: !!endpoint, params: [] });
  const [values, setValues] = useState<Record<string, string>>({});
  const [format, setFormat] = useState("pdf");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!endpoint) return;
    let live = true;
    (async () => {
      try {
        const report = await resolveApiName(endpoint, title, apiName);
        const params = await fetchParameters(endpoint, report);
        if (!live) return;
        setValues(Object.fromEntries(params.map((p) => [paramKey(p.name), startingValue(p)])));
        setState({ loading: false, report, params });
      } catch (e) {
        if (live) setState({ loading: false, error: e.message, params: [] });
      }
    })();
    return () => {
      live = false;
    };
  }, [endpoint, title, apiName]);

  const set = (key: string) => (v: string) => setValues((old) => ({ ...old, [key]: v }));
  const main = state.params.filter((p) => !isHeading(p));
  const heading = state.params.filter(isHeading);
  const missing = state.params.filter((p) => isDate(p) && !values[paramKey(p.name)]);
  const backwards = values.Period1 && values.Period2 && values.Period1 > values.Period2;
  const canRun = !!state.report && !missing.length && !backwards && !running;

  const run = async () => {
    setRunning(true);
    setResult(null);
    const tab = format === "pdf" ? openLoadingTab(title) : null;
    try {
      const file = await exportReport(endpoint, state.report, format, values);
      const inTab = deliver(file, tab);
      setResult({ ok: true, text: inTab ? `Opened ${file.filename} in a new tab.` : `Downloaded ${file.filename}.` });
    } catch (e) {
      tab?.close();
      setResult({ ok: false, text: e.message });
    } finally {
      setRunning(false);
    }
  };

  // Each period bounds the other, so Period 1 can't be after Period 2.
  const bounds = (p: any) => {
    const key = paramKey(p.name);
    if (key === "Period1") return { max: values.Period2 || undefined };
    if (key === "Period2") return { min: values.Period1 || undefined };
    return {};
  };

  let body;
  if (!endpoint) {
    body = <EmptyState icon={Clock} title="Not connected yet" description="This group of reports isn't on the report server yet." />;
  } else if (state.loading) {
    body = (
      <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading this report's options…
      </div>
    );
  } else if (state.error) {
    body = <EmptyState icon={AlertCircle} title="Can't load this report" description={state.error} />;
  } else {
    body = (
      <div className="space-y-5">
        {main.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {main.map((p) => (
              <ParamField key={p.name} param={p} value={values[paramKey(p.name)] ?? ""} onChange={set(paramKey(p.name))} {...bounds(p)} />
            ))}
          </div>
        ) : (
          !heading.length && <p className="text-sm text-slate-500">This report has no options. Pick the output and run it.</p>
        )}
        {backwards && <p className="text-sm text-rose-600">Period 1 must be on or before Period 2.</p>}

        {heading.length > 0 && (
          <fieldset className="rounded-xl border border-slate-200 p-4">
            <legend className="px-1 text-sm font-medium text-slate-700">Report heading (optional)</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {heading.map((p) => (
                <ParamField key={p.name} param={p} value={values[paramKey(p.name)] ?? ""} onChange={set(paramKey(p.name))} />
              ))}
            </div>
          </fieldset>
        )}

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Output</span>
          <Segmented options={formats} value={format} onChange={setFormat} />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
          <button type="button" className={btnPrimary} disabled={!canRun} onClick={run}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? "Running…" : "Run report"}
          </button>
          {result && (
            <span role="status" className={`inline-flex items-center gap-1.5 text-sm ${result.ok ? "text-emerald-600" : "text-rose-600"}`}>
              {result.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              {result.text}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Panel title={title} description={endpoint && !state.error ? "Fill in the options, choose the output and run the report." : undefined}>
      {body}
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
        description={items.length ? `${countLabel(items.length)}. Pick one to set its options and run it.` : undefined}
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
            <RunPanel key={selected.slug} title={selected.title} endpoint={hit.section.api} apiName={selected.api} />
          ) : (
            <Panel>
              <EmptyState icon={MousePointerClick} title="Pick a report" description="Choose a report from the list to set its options and run it." />
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
