// The page building blocks shared with the quotation app: header, panels, search and filter
// chips, status chips, stat and shortcut cards, stepper and summary list. Plain Tailwind.
import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Inbox, Search } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// ---------------------------------------------------------------- colours
export type Tone = "blue" | "amber" | "violet" | "emerald" | "rose" | "teal" | "orange" | "slate";

/** Icon tile colours, as on the quotation app's cards. */
export const TONE_TILE: Record<Tone, string> = {
  blue: "bg-blue-50 text-[#155dfd]",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
  teal: "bg-teal-50 text-teal-600",
  orange: "bg-orange-50 text-orange-600",
  slate: "bg-slate-100 text-slate-600",
};

const TONE_CHIP: Record<Tone, string> = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  teal: "border-teal-200 bg-teal-50 text-teal-700",
  orange: "border-orange-200 bg-orange-50 text-orange-700",
  slate: "border-slate-200 bg-slate-50 text-slate-600",
};

// Matched in order, so the more specific words come first.
const STATUS_TONES: [RegExp, Tone][] = [
  [/draft|unsaved|new\b/i, "amber"],
  [/pending|due|await|referred|reported|review|processing|suspend/i, "orange"],
  [/declin|reject|cancel|lapse|fail|death|revers|terminat|void|inactive/i, "rose"],
  [/expir|supersed|settled|closed|matur/i, "slate"],
  [/in ?force|active|approv|paid|posted|reconcil|convert|valid|issued|complete|live|current|renewed/i, "emerald"],
  [/accepted|calculated|verified|executed|endors|submitted|quoted/i, "blue"],
];

export const statusTone = (status?: string | null): Tone => {
  const s = String(status ?? "").trim();
  if (!s) return "slate";
  return STATUS_TONES.find(([re]) => re.test(s))?.[1] ?? "slate";
};

/** A status as the quotation app shows it: a soft, bordered pill. */
export const StatusChip = ({ status, tone, className }: { status?: string | null; tone?: Tone; className?: string }) => (
  <span
    className={cx(
      "inline-block max-w-full truncate whitespace-nowrap rounded-full border px-2.5 py-0.5 align-middle text-xs font-semibold capitalize leading-5",
      TONE_CHIP[tone ?? statusTone(status)],
      className,
    )}
    title={status ? String(status) : undefined}
  >
    {status ? String(status).replace(/_/g, " ").toLowerCase() : "—"}
  </span>
);

// ---------------------------------------------------------------- buttons
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#155dfd] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-[#0f4fe0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155dfd] disabled:cursor-not-allowed disabled:opacity-50";
export const btnOutline =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155dfd] disabled:cursor-not-allowed disabled:opacity-50";
/** A square icon-only row action; give it a title and aria-label. */
export const btnIcon =
  "inline-grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-[#155dfd] disabled:cursor-not-allowed disabled:opacity-50";
/** The small outlined row action ("Edit", "View") in tables. */
export const btnRow =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-[#155dfd] disabled:cursor-not-allowed disabled:opacity-50";
export const btnRowDanger =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50";

export const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#155dfd] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500";

// ---------------------------------------------------------------- layout
/** Centres the page content and spaces its sections. */
export const PageShell = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cx("mx-auto w-full max-w-[1400px] space-y-6", className)}>{children}</div>
);

export const PageHeader = ({
  eyebrow,
  title,
  description,
  actions,
  backTo,
  backLabel = "Back",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  backTo?: string;
  backLabel?: string;
}) => (
  <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {backTo && (
        <Link to={backTo} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#155dfd]">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      )}
      {eyebrow && <p className="text-sm font-medium text-[#155dfd]">{eyebrow}</p>}
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      {description && <p className="mt-1.5 max-w-3xl text-sm text-slate-500 sm:text-base">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
  </header>
);

/** A white rounded card with an optional header row. */
export const Panel = ({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  flush,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** No body padding, for tables that run edge to edge. */
  flush?: boolean;
}) => (
  <section className={cx("overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
    {(title || actions) && (
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          {title && <h2 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h2>}
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className={cx(!flush && "p-5 sm:p-6", bodyClassName)}>{children}</div>
  </section>
);

// ---------------------------------------------------------------- search and filters
/** Search box with the quotation app's "/" shortcut to focus it. */
export const SearchField = ({
  value,
  onChange,
  placeholder = "Search",
  className,
  onEnter,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  /** Enter pressed: search now rather than after the typing pause. */
  onEnter?: () => void;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={cx("relative min-w-0 flex-1", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onEnter?.();
          if (e.key === "Escape" && value) onChange("");
        }}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-12 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#155dfd] focus:bg-white focus:ring-4 focus:ring-blue-100"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-xs text-slate-400 sm:block">
        /
      </kbd>
    </div>
  );
};

export type ChipOption = { value: string; label: string; count?: number };

/** One-of filter pills ("All", "Draft", "Pending" ...). */
export const FilterChips = ({
  options,
  value,
  onChange,
  label = "Filter",
}: {
  options: ChipOption[];
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) => (
  <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
    {options.map((o) => {
      const on = o.value === value;
      return (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={on}
          onClick={() => onChange(o.value)}
          className={cx(
            "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            on ? "border-[#155dfd] bg-[#155dfd] text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
          )}
        >
          {o.label}
          {o.count != null && <span className={cx("rounded-full px-1.5 text-xs", on ? "bg-white/20" : "bg-slate-100 text-slate-500")}>{o.count}</span>}
        </button>
      );
    })}
  </div>
);

/** Two-or-more option switch, e.g. Investment / Traditional, or Table / Cards. */
export const Segmented = ({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: ReactNode; icon?: any }[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
    {options.map((o) => {
      const on = o.value === value;
      const Icon = o.icon;
      return (
        <button
          key={o.value}
          type="button"
          aria-pressed={on}
          onClick={() => onChange(o.value)}
          className={cx(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            on ? "bg-white text-[#155dfd] shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-900",
          )}
        >
          {Icon && <Icon className="h-4 w-4" />}
          {o.label}
        </button>
      );
    })}
  </div>
);

// ---------------------------------------------------------------- tables
/**
 * Class names for hand-written tables, so they match the shared Table component.
 *
 * Tables are fixed-layout and as wide as their card, never wider: compact columns (numbers,
 * dates, status, actions) get a set width on their <th>, the main text column takes what is
 * left, and long text is cut with "…" (full value in the tooltip). The wrapper is a size
 * container, so optional columns hide with @3xl:/@4xl:/@5xl: by the card's width, not the
 * screen's (the menu takes 256px of the screen).
 */
export const tableCls = {
  wrap: "@container overflow-x-auto",
  table: "w-full table-fixed text-left text-sm",
  thead: "bg-slate-50/70",
  th: "truncate border-b border-slate-200 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500",
  tr: "border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/80",
  td: "px-3 py-3 align-middle text-slate-700",
  primary: "truncate font-semibold text-slate-900",
  secondary: "mt-0.5 truncate text-xs text-slate-500",
};

export const EmptyState = ({ title = "Nothing here yet", description, icon: Icon = Inbox, action }: { title?: string; description?: ReactNode; icon?: any; action?: ReactNode }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
      <Icon className="h-6 w-6" />
    </span>
    <p className="mt-4 text-sm font-semibold text-slate-900">{title}</p>
    {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const Pager = ({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
      <span>
        Showing <span className="font-semibold text-slate-900">{from}–{to}</span> of <span className="font-semibold text-slate-900">{total}</span>
      </span>
      <div className="flex items-center gap-2">
        <button type="button" className={btnRow} disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <span className="px-2 text-slate-600">
          {page} / {pages}
        </span>
        <button type="button" className={btnRow} disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- cards
export const StatCard = ({ label, value, hint, icon: Icon, tone = "blue" }: { label: string; value: ReactNode; hint?: ReactNode; icon?: any; tone?: Tone }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {Icon && (
        <span className={cx("grid h-11 w-11 shrink-0 place-items-center rounded-xl", TONE_TILE[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      )}
    </div>
    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    {hint && <p className="mt-1.5 text-sm text-slate-500">{hint}</p>}
  </div>
);

/** A small link card: icon tile, title and one line beneath. */
export const ShortcutCard = ({ to, icon: Icon, title, subtitle, tone = "blue", external }: { to: string; icon: any; title: string; subtitle?: string; tone?: Tone; external?: boolean }) => {
  const body = (
    <>
      <span className={cx("grid h-12 w-12 shrink-0 place-items-center rounded-xl", TONE_TILE[tone])}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold text-slate-900 group-hover:text-[#155dfd]">{title}</span>
        {subtitle && <span className="block truncate text-sm text-slate-500">{subtitle}</span>}
      </span>
    </>
  );
  const cls =
    "group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155dfd]";
  return external ? (
    <a href={to} target="_blank" rel="noopener noreferrer" className={cls}>
      {body}
    </a>
  ) : (
    <Link to={to} className={cls}>
      {body}
    </Link>
  );
};

// ---------------------------------------------------------------- forms
/** Numbered steps joined by lines: "1 Client — 2 Plan — 3 Review". */
export const Stepper = ({
  steps,
  current,
  onStep,
  reachable,
}: {
  steps: string[];
  current: number;
  onStep?: (i: number) => void;
  /** The furthest step that can be clicked (defaults to the current one). */
  reachable?: number;
}) => (
  <ol className="flex items-center gap-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-6">
    {steps.map((label, i) => {
      const done = i < current;
      const on = i === current;
      const clickable = !!onStep && i !== current && i <= (reachable ?? current);
      return (
        <li key={label} className={cx("flex items-center gap-3", i < steps.length - 1 && "flex-1")}>
          <button
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onStep?.(i)}
            className="flex shrink-0 items-center gap-3 disabled:cursor-default"
            aria-current={on ? "step" : undefined}
          >
            <span
              className={cx(
                "grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-semibold",
                on && "border-[#155dfd] bg-[#155dfd] text-white ring-4 ring-blue-100",
                done && "border-[#155dfd] bg-blue-50 text-[#155dfd]",
                !on && !done && "border-slate-200 bg-white text-slate-500",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cx("whitespace-nowrap text-sm font-medium", on ? "text-slate-900" : "hidden text-slate-500 lg:inline")}>{label}</span>
          </button>
          {i < steps.length - 1 && <span className={cx("h-0.5 min-w-6 flex-1 rounded-full", done ? "bg-[#155dfd]" : "bg-slate-200")} />}
        </li>
      );
    })}
  </ol>
);

/** Label / value rows for a side summary ("Quotation summary"). */
export const SummaryList = ({ rows }: { rows: [ReactNode, ReactNode][] }) => (
  <dl className="divide-y divide-slate-100">
    {rows.map(([k, v], i) => (
      <div key={i} className="flex items-start justify-between gap-4 py-3">
        <dt className="text-sm text-slate-500">{k}</dt>
        <dd className="m-0 text-right text-sm font-semibold text-slate-900">{v === null || v === undefined || v === "" ? <span className="font-normal text-slate-400">—</span> : v}</dd>
      </div>
    ))}
  </dl>
);
