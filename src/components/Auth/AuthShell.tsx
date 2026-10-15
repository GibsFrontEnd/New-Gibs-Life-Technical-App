//@ts-nocheck
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Users, PenTool, Scale } from "lucide-react";

const HIGHLIGHTS = [
  { icon: Users, title: "CSU", text: "Customers and partners, in one place." },
  { icon: PenTool, title: "Underwriting", text: "Individual, group life and credit life business." },
  { icon: Scale, title: "Claims", text: "Maturity, death, surrender and withdrawal claims." },
];

// A light illustration for the left panel: a shield, a document card and a small chart.
const Illustration = () => (
<svg
  viewBox="0 0 420 220"
  className="h-[clamp(6rem,29vh,20rem)] w-auto max-w-full animate-float-bounce"
  role="img"
  aria-label="Shield, document and chart"
>
    <ellipse cx="210" cy="205" rx="170" ry="10" fill="#000" opacity="0.25" />
    <path d="M70 70 L120 52 L170 70 V130 C170 160 148 178 120 190 C92 178 70 160 70 130 Z" fill="#3b82f6" />
    <path d="M70 70 L120 52 V190 C92 178 70 160 70 130 Z" fill="#2563eb" />
    <path d="M97 120 l17 17 l30 -34" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="150" y="22" width="120" height="156" rx="12" fill="#fff" />
    <rect x="164" y="38" width="60" height="7" rx="3.5" fill="#0f172a" />
    <rect x="164" y="52" width="36" height="5" rx="2.5" fill="#94a3b8" />
    <rect x="164" y="72" width="92" height="5" rx="2.5" fill="#e2e8f0" />
    <rect x="164" y="84" width="92" height="5" rx="2.5" fill="#e2e8f0" />
    <rect x="164" y="96" width="70" height="5" rx="2.5" fill="#e2e8f0" />
    <rect x="164" y="114" width="92" height="22" rx="6" fill="#dbeafe" />
    <rect x="172" y="122" width="44" height="6" rx="3" fill="#2563eb" />
    <circle cx="170" cy="158" r="5" fill="#22c55e" />
    <rect x="182" y="155" width="40" height="6" rx="3" fill="#22c55e" />
    <rect x="262" y="58" width="130" height="100" rx="12" fill="#fff" />
    <rect x="276" y="72" width="44" height="6" rx="3" fill="#0f172a" />
    <rect x="278" y="118" width="14" height="26" rx="3" fill="#bfdbfe" />
    <rect x="300" y="104" width="14" height="40" rx="3" fill="#93c5fd" />
    <rect x="322" y="90" width="14" height="54" rx="3" fill="#3b82f6" />
    <rect x="344" y="108" width="14" height="36" rx="3" fill="#bfdbfe" />
    <path d="M276 112 L306 96 L330 100 L362 82" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
    <circle cx="362" cy="82" r="4" fill="#f59e0b" />
    <circle cx="238" cy="168" r="20" fill="#16a34a" />
    <path d="M229 168 l7 7 l12 -14" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * The branded page the sign-in, forgot-password and reset-password screens share: the brand panel
 * on the left (large screens) and the page's own content, centred, on the right.
 */
const AuthShell = ({
  blurb = "Sign in to manage underwriting, claims and customer accounts.",
  backTo = "/",
  backLabel = "Back to home",
  children,
}: {
  blurb?: string;
  backTo?: string | null;
  backLabel?: string;
  children: React.ReactNode;
}) => (
    <div className="grid min-h-dvh w-full bg-white lg:h-dvh lg:overflow-hidden lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Left: brand panel (desktop only) */}
      <aside className="relative hidden flex-col overflow-hidden bg-gradient-to-b from-[#0b1f4d] via-[#0d2a66] to-[#0a1a3f] px-10 py-8 text-white lg:flex [@media(max-height:760px)]:py-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"
        />

        {/* Everything sits in the middle of the panel */}
        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-6">
          <div className="w-full max-w-md">
            <div className="flex items-center gap-3">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#155dfd] shadow-lg shadow-black/20 [@media(max-height:760px)]:h-11 [@media(max-height:760px)]:w-11">
                <ShieldCheck className="h-7 w-7" />
              </span>
              <span>
                <span className="block text-sm font-semibold leading-tight">GIBS Life Technical</span>
                <span className="block text-[11px] text-blue-200/80">Life insurance operations</span>
              </span>
            </div>

            <h2 className="mt-8 text-4xl font-bold leading-[1.15] tracking-tight xl:text-[2.75rem] [@media(max-height:900px)]:mt-6 [@media(max-height:900px)]:text-3xl xl:[@media(max-height:900px)]:text-4xl [@media(max-height:760px)]:mt-4 [@media(max-height:760px)]:text-2xl xl:[@media(max-height:760px)]:text-2xl">
              Life underwriting and claims in <span className="text-blue-300">one place.</span>
            </h2>
            <p className="mt-4 text-sm text-blue-100/80 [@media(max-height:760px)]:mt-2 [@media(max-height:760px)]:text-xs">{blurb}</p>
            <ul className="mt-6 space-y-3.5 [@media(max-height:900px)]:mt-4 [@media(max-height:900px)]:space-y-2.5 [@media(max-height:760px)]:mt-3 [@media(max-height:760px)]:space-y-2">
              {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/10 [@media(max-height:760px)]:h-8 [@media(max-height:760px)]:w-8">
                    <Icon className="h-4 w-4 text-blue-200" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold [@media(max-height:760px)]:text-[13px]">{title}</span>
                    <span className="block text-xs text-blue-100/70 [@media(max-height:760px)]:text-[11px]">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex w-full justify-center [@media(max-height:560px)]:hidden">
            <Illustration />
          </div>
        </div>

        <p className="relative text-center text-xs text-blue-200/60">© {new Date().getFullYear()} GIBS Life Technical.</p>
      </aside>

      {/* Right: the page's own content */}
      <main className="flex min-h-dvh flex-col px-5 py-6 sm:px-10 lg:h-dvh lg:min-h-0 lg:overflow-y-auto [@media(max-height:760px)]:py-4">
        <div className="flex items-center justify-between text-sm">
          {backTo === null ? (
            <span />
          ) : (
            <Link to={backTo} className="inline-flex items-center gap-2 font-medium text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
          )}
          <span className="inline-flex items-center gap-2 font-semibold text-slate-900 lg:hidden">
            <ShieldCheck className="h-6 w-6 text-[#155dfd]" />
            GIBS Life Technical
          </span>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6 [@media(max-height:760px)]:py-2">
          {children}
        </div>
      </main>
    </div>
);

export default AuthShell;
