import { Users, Handshake, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CSUOverview = () => {
  const QuickAction = ({ to, label, icon, description }: any) => (
    <Link
      to={to}
      className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full hover:-translate-y-1"
    >
      <div className="bg-gray-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#8c4b8d]/10 transition-colors">
        <span className="text-gray-600 group-hover:text-[#8c4b8d] transition-colors">{icon}</span>
      </div>
      <h3 className="font-bold text-gray-800 text-lg mb-2">{label}</h3>
      <p className="text-gray-500 text-sm mb-6 flex-1">{description}</p>
      <div className="flex items-center text-[#8c4b8d] text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
        Get Started <ArrowRight className="w-4 h-4 ml-1" />
      </div>
    </Link>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-2 lg:p-6">
      <header>
       
        <h1 className="text-3xl font-black text-gray-800 tracking-tight">CSU Overview</h1>
        <p className="text-gray-500 mt-1">Manage customers and partners seamlessly.</p>
      </header>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
        <QuickAction
          to="/csu/customers"
          label="Customer Care"
          icon={<Users className="w-6 h-6" />}
          description="View and manage customer profiles, policy history and active accounts."
        />
        <QuickAction
          to="/csu/partners"
          label="Partners"
          icon={<Handshake className="w-6 h-6" />}
          description="Track and manage partner relationships and their account status."
        />
      </div>
    </div>
  );
};

export default CSUOverview;
