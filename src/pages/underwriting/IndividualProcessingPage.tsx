// Individual life → Processing. The legacy menu had four options; none is built yet, so each one is a
// placeholder that keeps its place in the menu until the real screen replaces it.
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calculator, Clock, FileText, Wallet, AlertCircle } from "lucide-react";

const OPTIONS = [
  {
    slug: "statement-of-account",
    title: "Statement of Account",
    description: "Premium and payment statement for a policy.",
    icon: FileText,
  },
  {
    slug: "lapse-policies-processing",
    title: "LAPSE Policies Processing",
    description: "Find and lapse policies whose premiums are overdue.",
    icon: AlertCircle,
  },
  {
    slug: "premium-acct-position",
    title: "Premium Acct Position",
    description: "Premium account position across policies.",
    icon: Wallet,
  },
  {
    slug: "yr-end-actuarial-process",
    title: "Yr End Actuarial Process",
    description: "Year-end actuarial balances and processing.",
    icon: Calculator,
  },
];

const ComingSoon = () => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs text-gray-600">
    <Clock size={12} /> Coming soon
  </span>
);

const IndividualProcessingPage = () => {
  const { option } = useParams();
  const navigate = useNavigate();
  const selected = OPTIONS.find((o) => o.slug === option);

  // /underwriting/individual/processing/<option>: the placeholder for one option
  if (option) {
    return (
      <div className="mx-auto max-w-[900px] p-6">
        <button
          onClick={() => navigate("/underwriting/individual/processing")}
          className="mb-6 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft size={16} /> Back to Processing
        </button>
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mb-5 rounded-2xl bg-blue-50 p-4">
            {selected ? <selected.icon size={36} className="text-[#155dfd]" /> : <Clock size={36} className="text-[#155dfd]" />}
          </div>
          <h1 className="mb-2 text-xl font-semibold text-gray-900">{selected ? selected.title : "Processing option"}</h1>
          <p className="mb-5 max-w-sm text-sm leading-relaxed text-gray-500">
            {selected
              ? "This process has not been built yet. It will appear here when it is ready."
              : "That processing option does not exist."}
          </p>
          <ComingSoon />
        </div>
      </div>
    );
  }

  // /underwriting/individual/processing: the list of options
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <p className="text-sm font-medium text-[#155dfd]">Underwriting · Individual</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Processing</h1>
      <p className="mt-1.5 text-sm text-slate-500 sm:text-base">Periodic processing for individual life policies.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {OPTIONS.map((o) => (
          <Link
            key={o.slug}
            to={`/underwriting/individual/processing/${o.slug}`}
            className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-[#155dfd]/40 hover:bg-blue-50/40"
          >
            <div className="rounded-xl bg-blue-50 p-3 text-[#155dfd]">
              <o.icon size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <h2 className="truncate text-base font-semibold text-gray-900">{o.title}</h2>
                <ComingSoon />
              </div>
              <p className="mt-1 text-sm text-gray-500">{o.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default IndividualProcessingPage;
