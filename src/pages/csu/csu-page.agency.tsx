import { Building2 } from "lucide-react";

const CSUAgency = () => {
  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-[#8c4b8d]/10 p-3 rounded-2xl">
          <Building2 className="w-8 h-8 text-[#8c4b8d]" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Agency Hub</h1>
          <p className="text-gray-500">Track and manage agency performance results.</p>
        </div>
      </div>

      <div className="bg-white p-20 rounded-3xl border border-gray-100 shadow-sm text-center">
        <div className="max-w-md mx-auto">
          <Building2 className="w-16 h-16 text-gray-200 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-400 mb-2">Agency Module Incoming</h2>
          <p className="text-gray-400">We are finalizing the agency performance tracking and relationship management interface for your portal.</p>
        </div>
      </div>
    </div>
  );
};

export default CSUAgency;
