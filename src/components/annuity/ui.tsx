// Small, dependency-free UI helpers shared by the annuity screens.
// Plain Tailwind + lucide-react so they behave the same in every GIBS front end.
import { ReactNode, ButtonHTMLAttributes, useEffect } from "react";
import { X, Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";

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
const STATUS_COLOURS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ISSUED: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-indigo-100 text-indigo-800",
  CONVERTED: "bg-emerald-100 text-emerald-800",
  EXPIRED: "bg-amber-100 text-amber-800",
  CANCELLED: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-800",
  REFERRED: "bg-orange-100 text-orange-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  DECLINED: "bg-red-100 text-red-700",
  "IN FORCE": "bg-emerald-100 text-emerald-800",
  "PAYMENT SUSPENDED": "bg-orange-100 text-orange-800",
  "DEATH REPORTED": "bg-red-100 text-red-700",
  SETTLED: "bg-gray-200 text-gray-700",
  PAID: "bg-emerald-100 text-emerald-800",
  DUE: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  FAILED: "bg-red-100 text-red-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-800",
  EXECUTED: "bg-blue-100 text-blue-800",
  RECONCILED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-700",
  REPORTED: "bg-amber-100 text-amber-800",
  VERIFIED: "bg-blue-100 text-blue-800",
  CALCULATED: "bg-indigo-100 text-indigo-800",
  POSTED: "bg-emerald-100 text-emerald-800",
  REVERSED: "bg-red-100 text-red-700",
  VALID: "bg-emerald-100 text-emerald-800",
  SUPERSEDED: "bg-gray-100 text-gray-600",
  INCLUDED: "bg-blue-100 text-blue-800",
  EXCEPTION: "bg-red-100 text-red-700",
};

export const StatusBadge = ({ status }: { status?: string | null }) => (
  <span
    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
      STATUS_COLOURS[(status ?? "").toUpperCase()] ?? "bg-gray-100 text-gray-700"
    }`}
  >
    {status ?? "—"}
  </span>
);

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  busy?: boolean;
};

export const Btn = ({ variant = "primary", size = "md", busy, disabled, className = "", children, ...rest }: BtnProps) => {
  const v = {
    primary: "bg-blue-900 text-white hover:bg-blue-800",
    secondary: "bg-white text-blue-900 border border-blue-900 hover:bg-blue-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent text-blue-900 hover:bg-blue-50",
  }[variant];
  const s = size === "sm" ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm";
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || busy}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${v} ${s} ${className}`}
    >
      {busy && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
};

export const inputCls =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100";

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
    <span className="mb-1 block text-xs font-semibold text-gray-600">
      {label}
      {required && <span className="text-red-600"> *</span>}
    </span>
    {children}
    {hint && <span className="mt-1 block text-[11px] text-gray-500">{hint}</span>}
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
    <div className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${cls}`}>
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
    <div className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className={`my-8 w-full rounded-lg bg-white shadow-xl ${wide ? "max-w-5xl" : "max-w-2xl"}`}>
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="m-0 text-base font-semibold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t bg-gray-50 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
};

export const Card = ({ title, actions, children }: { title?: string; actions?: ReactNode; children: ReactNode }) => (
  <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
    {(title || actions) && (
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <h3 className="m-0 text-sm font-semibold text-gray-900">{title}</h3>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

/** Label / value grid used on detail screens. */
export const KV = ({ items }: { items: [string, ReactNode][] }) => (
  <dl className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-3">
    {items.map(([k, v]) => (
      <div key={k}>
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{k}</dt>
        <dd className="m-0 text-sm text-gray-900">{v ?? "—"}</dd>
      </div>
    ))}
  </dl>
);

export const Table = ({ head, children, empty }: { head: string[]; children: ReactNode; empty?: string }) => (
  <div className="overflow-x-auto rounded-md border border-gray-200">
    <table className="w-full text-left text-sm">
      <thead className="bg-gray-50 text-xs uppercase text-gray-600">
        <tr>
          {head.map((h) => (
            <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">{children}</tbody>
    </table>
    {empty && <div className="px-3 py-6 text-center text-sm text-gray-500">{empty}</div>}
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
    <div className="flex items-center justify-between pt-3 text-sm text-gray-600">
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
