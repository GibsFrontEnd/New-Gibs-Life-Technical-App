import { FileInput, TrendingUp, Scroll,  ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const QuotationsOverview = () => {
  const QuickAction = ({ to, label, icon, description }: any) => (
    <Link
      to={to}
      className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full hover:-translate-y-1"
    >
      <div className="bg-gray-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#0d47a1]/10 transition-colors">
        <span className="text-gray-600 group-hover:text-[#0d47a1] transition-colors">{icon}</span>
      </div>
      <h3 className="font-bold text-gray-800 text-lg mb-2">{label}</h3>
      <p className="text-gray-500 text-sm mb-6 flex-1">{description}</p>
      <div className="flex items-center text-[#0d47a1] text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
        Get Started <ArrowRight className="w-4 h-4 ml-1" />
      </div>
    </Link>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-2 lg:p-6">
      <header>
        <h1 className="text-3xl font-black text-gray-800 tracking-tight">Quotations Overview</h1>
        <p className="text-gray-500 mt-1">Manage all your quotation needs in one place.</p>
      </header>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
        <QuickAction
          to="/quotations/investment-link-quotes"
          label="Investment Link Quotes"
          icon={<TrendingUp className="w-6 h-6" />}
          description="Create and manage investment-linked quotation requests for clients."
        />
        <QuickAction
          to="/quotations/traditional-quotes"
          label="Traditional Quotes"
          icon={<Scroll className="w-6 h-6" />}
          description="Handle traditional insurance quotations with ease and precision."
        />
        <QuickAction
          to="/quotations/group-life"
          label="Group Life Quotes"
          icon={<FileInput className="w-6 h-6" />}
          description="Manage group life insurance quotations for corporate clients."
        />
      </div>

      </div>
   
  );
};

export default QuotationsOverview;