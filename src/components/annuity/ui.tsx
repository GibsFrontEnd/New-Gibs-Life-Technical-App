// Small, dependency-free UI helpers shared by the annuity screens.
// Plain Tailwind + lucide-react so they behave the same in every GIBS front end.
import { ReactNode, ButtonHTMLAttributes, useEffect } from "react";
import { X, Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { StatusChip, type Tone } from "../page/PageKit";

// ---------------------------------------------------------------- formatting
export const money = (v: number | string | null | undefined): string => {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(n);
};

export const fmtDate = (v: string | Date | null | undefined): string => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const pct = (v: number | null | undefined): string =>
  v === null || v === undefined ? "—" : `${(Number(v) * 100).toFixed(2)}%`;

/** yyyy-MM-dd in local time, for <input type="date"> and API dates. */
export const isoDate = (d: Date = new Date()): string => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** Pulls the most useful message out of an axios error / API error body. */
export const errMsg = (e: any): string => {
  const data = e?.response?.data;
  if (typeof data === "string" && data.trim()) return data.split("\n")[0] ?? data;
  if (data?.message) return String(data.message);
  if (data?.title) return String(data.title);
  if (data?.errors) {
    const first = Object.values(data.errors as Record<string, string[]>)[0];
    if (first?.[0]) return first[0];
  }
  if (e?.response?.status === 403) return "You do not have permission to do this.";
  if (e?.response?.status === 401) return "Your session has expired. Please sign in again.";
  return e?.message ?? "Something went wrong.";
};

// ---------------------------------------------------------------- components
const STATUS_TONE: Record<string, Tone> = {
  DRAFT: "amber",
  ISSUED: "blue",
  ACCEPTED: "violet",
  CONVERTED: "emerald",
  EXPIRED: "amber",
  CANCELLED: "rose",
  PENDING: "amber",
  REFERRED: "orange",
  APPROVED: "emerald",
  DECLINED: "rose",
  "IN FORCE": "emerald",
  "PAYMENT SUSPENDED": "orange",
  "DEATH REPORTED": "rose",
  SETTLED: "slate",
  PAID: "emerald",
  DUE: "amber",
  PROCESSING: "blue",
  FAILED: "rose",
  PENDING_APPROVAL: "amber",
  EXECUTED: "blue",
  RECONCILED: "emerald",
  REJECTED: "rose",
  REPORTED: "amber",
  VERIFIED: "blue",
  CALCULATED: "violet",
  POSTED: "emerald",
  REVERSED: "rose",
  VALID: "emerald",
  SUPERSEDED: "slate",
  INCLUDED: "blue",
  EXCEPTION: "rose",
};

/** Annuity statuses use the same soft, bordered chip as the rest of the app. */
export const StatusBadge = ({ status }: { status?: string | null }) => <StatusChip status={status} tone={STATUS_TONE[(status ?? "").toUpperCase()]} />;

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  busy?: boolean;
};

export const Btn = ({ variant = "primary", size = "md", busy, disabled, className = "", children, ...rest }: BtnProps) => {
  const v = {
    primary: "bg-[#155dfd] text-white shadow-sm shadow-blue-600/20 hover:bg-[#0f4fe0]",
    secondary: "bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900",
    danger: "bg-white text-rose-600 border border-rose-200 hover:bg-rose-50",
    ghost: "bg-transparent text-[#155dfd] hover:bg-blue-50",
  }[variant];
  const s = size === "sm" ? "rounded-lg px-3 py-1.5 text-xs" : "rounded-xl px-4 py-2.5 text-sm";
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || busy}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${v} ${s} ${className}`}
    >
      {busy && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
};

export const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#155dfd] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500";

export const Field = ({
  label,
  hint,
  required,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="text-red-600"> *</span>}
    </span>
    {children}
    {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
  </label>
);

export const Banner = ({ kind = "info", children }: { kind?: "info" | "error" | "success"; children: ReactNode }) => {
  const map = {
    info: ["bg-blue-50 border-blue-200 text-blue-900", Info],
    error: ["bg-red-50 border-red-200 text-red-800", AlertCircle],
    success: ["bg-emerald-50 border-emerald-200 text-emerald-800", CheckCircle2],
  } as const;
  const [cls, Icon] = map[kind];
  return (
    <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${cls}`}>
      <Icon size={16} className="mt-0.5 flex-shrink-0" />
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
};

export const Modal = ({
  title,
  onClose,
  children,
  wide,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  footer?: ReactNode;
}) => {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-[2px]">
      <div className={`my-8 w-full overflow-hidden rounded-2xl bg-white shadow-2xl ${wide ? "max-w-5xl" : "max-w-2xl"}`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="m-0 text-lg font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
};

export const Card = ({ title, actions, children }: { title?: string; actions?: ReactNode; children: ReactNode }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    {(title || actions) && (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h3 className="m-0 text-base font-semibold text-slate-900">{title}</h3>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

/** Label / value grid used on detail screens. */
export const KV = ({ items }: { items: [string, ReactNode][] }) => (
  <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 md:grid-cols-3">
    {items.map(([k, v]) => (
      <div key={k} className="bg-white px-4 py-3">
        <dt className="text-xs text-slate-500">{k}</dt>
        <dd className="m-0 mt-0.5 break-words text-sm font-semibold text-slate-900">{v ?? "—"}</dd>
      </div>
    ))}
  </dl>
);

/**
 * `cols` (one class string per column, e.g. "w-[130px]" or "hidden w-[100px] @4xl:table-cell")
 * makes the table fixed-layout and as wide as its card: give the compact columns a width, leave
 * the main text column without one, and cut long text with "truncate". The wrapper is a size
 * container, so @3xl:/@4xl:/@5xl: hide columns by the card's width. The page puts the same hiding
 * classes on its <td>s. Without `cols` the table sizes itself and headers wrap.
 */
export const Table = ({ head, children, empty, cols }: { head: string[]; children: ReactNode; empty?: string; cols?: string[] }) => (
  <div className="@container overflow-x-auto rounded-xl border border-slate-200">
    <table className={`w-full text-left text-sm ${cols ? "table-fixed" : ""}`}>
      <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
        <tr>
          {head.map((h, i) => (
            <th key={h || i} className={`border-b border-slate-200 px-3 py-3 font-semibold leading-tight ${cols ? "truncate" : ""} ${cols?.[i] ?? ""}`}>
              {h ? h : <span className="sr-only">Actions</span>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className={`divide-y divide-slate-100 text-slate-700 [&_td]:!px-3 [&_td]:!py-3 [&_tr]:transition-colors [&_tr:hover]:bg-slate-50/80 ${cols ? "[&_td>div]:truncate" : ""}`}>{children}</tbody>
    </table>
    {empty && <div className="px-4 py-12 text-center text-sm text-slate-500">{empty}</div>}
  </div>
);

export const Pager = ({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-sm text-slate-500">
      <span>
        Page {page} of {pages} · {total} records
      </span>
      <div className="flex gap-2">
        <Btn size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Btn>
        <Btn size="sm" variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </Btn>
      </div>
    </div>
  );
};

const HTML_ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" };
const escHtml = (v: any): string => String(v ?? "").replace(/[&<>"]/g, (c: string) => HTML_ESC[c] ?? c);

/**
 * Opens a clean, print-ready payment schedule in a new window and starts the print dialog.
 * `rows` need: paymentNo, dueDate, grossBenefit, taxAmount, netBenefit (and optionally paymentStatus).
 */
export const printSchedule = (opts: {
  title: string;
  reference: string;
  customer?: string;
  product?: string;
  frequency?: string;
  rows: any[];
  note?: string;
}) => {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Please allow pop-ups to print the payment schedule.");
    return;
  }
  const hasStatus = opts.rows.some((r) => r.paymentStatus);
  const body = opts.rows
    .map(
      (r) =>
        `<tr><td>${escHtml(r.paymentNo)}</td><td>${escHtml(fmtDate(r.dueDate))}</td><td class="n">${escHtml(money(r.grossBenefit))}</td><td class="n">${escHtml(
          money(r.taxAmount)
        )}</td><td class="n">${escHtml(money(r.netBenefit))}</td>${hasStatus ? `<td>${escHtml(r.paymentStatus)}</td>` : ""}</tr>`
    )
    .join("");
  const total = opts.rows.reduce((a, r) => a + Number(r.netBenefit || 0), 0);
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escHtml(opts.title)} ${escHtml(opts.reference)}</title>
<style>body{font-family:Arial,Helvetica,sans-serif;margin:24px;color:#111}h1{font-size:18px;margin:0 0 4px}p{margin:2px 0;font-size:12px}
table{border-collapse:collapse;width:100%;margin-top:12px;font-size:12px}th,td{border:1px solid #bbb;padding:4px 8px;text-align:left}th{background:#eef2f7}td.n,th.n{text-align:right}
tfoot td{font-weight:bold}.note{margin-top:12px;font-size:11px;color:#555}</style></head><body>
<h1>${escHtml(opts.title)}</h1><p><b>Reference:</b> ${escHtml(opts.reference)}</p>
${opts.customer ? `<p><b>Customer:</b> ${escHtml(opts.customer)}</p>` : ""}${opts.product ? `<p><b>Product:</b> ${escHtml(opts.product)}</p>` : ""}${
    opts.frequency ? `<p><b>Frequency:</b> ${escHtml(opts.frequency)}</p>` : ""
  }
<table><thead><tr><th>#</th><th>Due date</th><th class="n">Gross benefit</th><th class="n">Tax</th><th class="n">Net benefit</th>${hasStatus ? "<th>Status</th>" : ""}</tr></thead>
<tbody>${body}</tbody><tfoot><tr><td colspan="4">Total net benefit (${opts.rows.length} payments)</td><td class="n">${escHtml(money(total))}</td>${
    hasStatus ? "<td></td>" : ""
  }</tr></tfoot></table>
${opts.note ? `<p class="note">${escHtml(opts.note)}</p>` : ""}
<p class="note">Printed ${escHtml(new Date().toLocaleString())}</p></body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
};
