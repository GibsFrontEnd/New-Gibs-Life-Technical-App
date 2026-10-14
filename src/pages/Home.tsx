//@ts-nocheck
// HomePage.tsx: the public landing page.
import { Link } from "react-router-dom";
import { ArrowRight, Check, ShieldCheck, PenTool, Scale, Users, RefreshCw, UserCog, TrendingUp } from "lucide-react";

const MODULES = [
  { icon: PenTool, tone: "bg-blue-50 text-blue-600", title: "Underwriting", text: "Policy and scheme administration, endorsements, renewals and maintenance for individual, group life and credit life." },
  { icon: Scale, tone: "bg-violet-50 text-violet-600", title: "Claims", text: "Maturity, death, surrender and partial withdrawal claims, with offers, requisitions and payment approval." },
  { icon: Users, tone: "bg-emerald-50 text-emerald-600", title: "CSU", text: "Customers and partners." },
  { icon: RefreshCw, tone: "bg-sky-50 text-sky-600", title: "Reinsurance", text: "Reinsurance overview." },
  { icon: UserCog, tone: "bg-amber-50 text-amber-600", title: "Admin", text: "Company, security and product configuration." },
  { icon: TrendingUp, tone: "bg-slate-100 text-slate-600", title: "Quotations", text: "Quotations are handled in the separate quotations application." },
];

// The main workspaces, with what is in each, for the card in the hero.
const HERO_LIST = [
  { icon: PenTool, title: "Underwriting", chips: ["Individual","Group life","Credit life"] },
  { icon: Scale, title: "Claims", chips: ["Maturity","Death benefit","Surrender"] },
  { icon: Users, title: "CSU", chips: ["Customers","Partners"] },
];

const HomePage = () => (
  <div className="min-h-dvh bg-white text-slate-900" id="home">
    {/* ───────────── Hero ───────────── */}
    <section className="relative overflow-hidden bg-gradient-to-b from-[#0a1a3f] via-[#0b2150] to-[#0d2a66] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-10 h-[34rem] w-[34rem] rounded-full bg-blue-500/20 blur-3xl" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-6 top-24 hidden h-24 w-28 opacity-40 lg:block"
        style={{ backgroundImage: "radial-gradient(#93c5fd 1.2px, transparent 1.2px)", backgroundSize: "12px 12px" }}
      />

      <header className="relative mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-5 sm:px-8 2xl:px-12">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-[#155dfd]">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold leading-tight">GIBS Life Technical</span>
            <span className="block truncate text-[11px] text-blue-200/80">Life insurance operations</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-blue-100/90 md:flex 2xl:gap-9 2xl:text-base" aria-label="Page sections">
          <a href="#modules" className="hover:text-white">
            Modules
          </a>
        </nav>

        <Link
          to="/login"
          className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          Sign in
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <div className="relative mx-auto grid max-w-[1600px] grid-cols-[minmax(0,1fr)] items-center gap-12 px-5 pb-20 pt-10 sm:px-8 2xl:px-12 lg:grid-cols-2 lg:pb-28 lg:pt-14">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-blue-100 2xl:text-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
            Life insurance operations
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem] 2xl:text-[4.25rem]">
            Life underwriting, claims and customer service in <span className="text-blue-300">one place.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base text-blue-100/80 2xl:max-w-xl 2xl:text-lg">
            Individual, group life and credit life business: policy administration, claims handling and customer service in one workspace.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[#155dfd] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 hover:bg-[#0f4bd1] 2xl:px-6 2xl:py-3.5 2xl:text-base"
            >
              Sign in to your workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-blue-100/80 2xl:text-sm">
            {["Secure sign-in","Individual, group and credit life","Claims through to payment approval"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:max-w-none" aria-hidden="true">
          <div className="rounded-2xl bg-white p-5 text-slate-900 shadow-2xl shadow-black/30">
            <p className="text-sm font-semibold">Workspaces</p>
            <p className="text-[11px] text-slate-500">What each one covers</p>
            <ul className="mt-4 space-y-3">
              {HERO_LIST.map((w) => (
                <li key={w.title} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#155dfd]">
                      <w.icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold">{w.title}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {w.chips.map((chip) => (
                      <span key={chip} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        {chip}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>

    {/* ───────────── Modules ───────────── */}
    <section id="modules" className="mx-auto max-w-[1600px] scroll-mt-6 px-5 py-20 sm:px-8 2xl:px-12">
      <div className="max-w-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#155dfd]">Modules</p>
        <h2 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl 2xl:text-5xl">Everything the life team works on.</h2>
      </div>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <li key={m.title} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${m.tone}`}>
              <m.icon className="h-5 w-5" />
            </span>
            <span>
              <h3 className="text-sm font-semibold 2xl:text-base">{m.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 2xl:text-sm">{m.text}</p>
            </span>
          </li>
        ))}
      </ul>
    </section>

    {/* ───────────── Call to action ───────────── */}
    <section className="mx-auto max-w-[1600px] px-5 sm:px-8 2xl:px-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0a1a3f] to-[#155dfd] px-8 py-12 text-white sm:px-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-8 h-48 w-48 rounded-full border border-white/10" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Ready to continue?</h2>
            <p className="mt-2 max-w-md text-sm text-blue-100/80">
              Sign in with your work account. If you do not have access yet, ask your administrator to set you up.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-blue-50"
          >
            Sign in to your workspace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>

    {/* ───────────── Footer ───────────── */}
    <footer className="mt-20 border-t border-slate-200">
      <div className="mx-auto max-w-[1600px] px-5 py-6 text-center text-xs text-slate-500 sm:px-8 2xl:px-12">
        <p>© {new Date().getFullYear()} GIBS Life Technical.</p>
      </div>
    </footer>
  </div>
);

export default HomePage;
