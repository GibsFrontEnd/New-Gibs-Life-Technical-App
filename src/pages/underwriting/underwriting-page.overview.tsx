import { Link } from "react-router-dom";
import { User, Users, CreditCard, ArrowRight } from "lucide-react";

const sections = [
  {
    label: "Individual",
    blurb: "Administer individual life policies end to end.",
    icon: User,
    path: "/underwriting/individual/policy-admin",
  },
  {
    label: "Group Life",
    blurb: "Manage group life schemes and renewals.",
    icon: Users,
    path: "/underwriting/group-life-quotations",
  },
  {
    label: "Credit Life",
    blurb: "Manage credit life schemes and renewals.",
    icon: CreditCard,
    path: "/underwriting/credit-life/scheme-admin",
  },
];

const UnderwritingOverview = () => {
  const QuickAction = ({ to, label, icon, description, index }: any) => (
    <Link
      to={to}
      style={{ animationDelay: `${index * 80}ms` }}
      className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm
                 hover:shadow-md hover:border-[#8c4b8d]/20
                 transition-all duration-300 flex flex-col h-full
                 hover:-translate-y-1
                 animate-card-enter"
    >
      <div className="bg-gray-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4
                      group-hover:bg-[#8c4b8d]/10
                      group-hover:shadow-[0_0_0_6px_rgba(140,75,141,0.08)]
                      transition-all duration-300">
        <span className="text-gray-600 group-hover:text-[#8c4b8d] transition-colors">
          {icon}
        </span>
      </div>
      <h3 className="font-bold text-gray-800 text-lg mb-2">{label}</h3>
      <p className="text-gray-500 text-sm mb-6 flex-1">{description}</p>
      <div className="flex items-center text-[#8c4b8d] text-sm font-bold
                      opacity-0 group-hover:opacity-100 transition-opacity">
        Get Started <ArrowRight className="w-4 h-4 ml-1" />
      </div>
    </Link>
  );

  return (
    <div className="space-y-8 p-2 lg:p-6 max-w-7xl mx-auto animate-overview-enter">
      <header>
        <h1 className="text-3xl font-black text-gray-800 tracking-tight">
          Underwriting Overview
        </h1>
        <p className="text-gray-500 mt-1">
          Convert proposals into policies and schemes, then administer the full policy lifecycle.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section, i) => (
          <QuickAction
            key={section.label}
            to={section.path}
            label={section.label}
            icon={<section.icon className="w-6 h-6" />}
            description={section.blurb}
            index={i}
          />
        ))}
      </div>
    </div>
  );
};

export default UnderwritingOverview;