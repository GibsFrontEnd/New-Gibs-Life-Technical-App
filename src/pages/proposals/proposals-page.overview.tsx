import { Link } from "react-router-dom";
import { TrendingUp, Scroll, Users, CreditCard } from "lucide-react";

const links = [
  {
    title: "Investment Policies",
    description: "Convert and manage investment-linked proposals.",
    path: "/proposals/convert-to-policy/investment-policies",
    icon: TrendingUp,
    badge: "Convert to Policy",
  },
  {
    title: "Traditional Policies",
    description: "Convert and manage standard traditional policies.",
    path: "/proposals/convert-to-policy/traditional-policies",
    icon: Scroll,
    badge: "Convert to Policy",
  },
  {
    title: "Group Life Policies",
    description: "Convert and manage group life schemes.",
    path: "/proposals/convert-to-scheme/group-life-policies",
    icon: Users,
    badge: "Convert to Scheme",
  },
  {
    title: "Credit Life Policies",
    description: "Convert and manage credit life schemes.",
    path: "/proposals/convert-to-scheme/credit-life-policies",
    icon: CreditCard,
    badge: "Convert to Scheme",
  },
];

const ProposalsOverview = () => {
  return (
    <div className="max-w-[1200px] mx-auto space-y-8 p-6 animate-slideDown">
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 bg-gradient-to-bl from-purple-100 to-transparent rounded-bl-full opacity-60 pointer-events-none" />
        <h1 className="text-3xl font-bold text-gray-800 m-0">Proposals Dashboard</h1>
        <p className="text-base text-gray-500 mt-2 max-w-2xl">
          Quickly navigate to all your proposal conversion workflows. Manage your investment, traditional, group life, and credit life policies from here.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="group block bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-300 flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-50 text-[#8c4b8d] group-hover:bg-[#8c4b8d] group-hover:text-white transition-colors duration-300">
                <link.icon size={24} />
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-gray-100 text-gray-500 rounded-md">
                {link.badge}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#8c4b8d] transition-colors mb-2">
              {link.title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed flex-1">
              {link.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProposalsOverview;
