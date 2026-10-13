// @ts-nocheck

import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import CustomerDashboard from "./customer/CustomerDashboard";
import {
  Users,
  ShieldCheck,
  Plus,
  Eye,
  AlertCircle,
  Calendar,
  FileCheck,
  ChevronRight,
} from "lucide-react";

// ========== FONT AWESOME IMPORTS ==========
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNairaSign } from '@fortawesome/free-solid-svg-icons';

// ========== NAIRA ICON using Font Awesome ==========
const NairaIcon = ({ className }: { className?: string }) => (
  <FontAwesomeIcon 
    icon={faNairaSign} 
    className={className}
  />
);

// ========== STAT CARD ==========
const StatCard = ({ title, value, icon: Icon, iconBg, iconColor }) => {
  return (
    <div className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-default relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1.5 group-hover:scale-105 transition-transform duration-300 origin-left">
              ₦{value}
            </p>
          </div>
          <div className={`${iconBg} p-3 rounded-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== QUICK ACTION ==========
const QuickAction = ({ icon: Icon, label, sub, path, iconColor, iconBg }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className="group bg-white hover:bg-gradient-to-br hover:from-white hover:to-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col items-start gap-2.5 text-left transition-all duration-500 hover:shadow-xl hover:border-gray-200 hover:-translate-y-2 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      <div className={`${iconBg} p-3 rounded-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative z-10`}>
        <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
      </div>
      <span className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 transition-colors duration-300 relative z-10">{label}</span>
      <span className="text-xs text-gray-400 group-hover:text-gray-500 transition-colors duration-300 relative z-10">{sub}</span>
    </button>
  );
};

// ========== SECTION CARD ==========
const SectionCard = ({ icon: Icon, iconColor, hoverText, hoverBg, title, links }) => {
  const navigate = useNavigate();
  const bgColor = hoverBg.replace('hover:', '').trim();
  
  return (
    <div className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
      <div className={`absolute inset-0 ${bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-4">
          <div className={`p-2 rounded-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ${bgColor}`}>
            <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
          </div>
          <h2 className="text-sm font-semibold text-gray-900 group-hover:text-gray-800 transition-colors duration-300">{title}</h2>
        </div>
        <div className="space-y-0.5">
          {links.map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`w-full text-left text-sm text-gray-600 ${hoverText} ${hoverBg} px-3 py-2.5 rounded-xl transition-all duration-300 flex items-center justify-between group/link relative overflow-hidden`}
            >
              <span className="relative z-10">{label}</span>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover/link:opacity-100 group-hover/link:translate-x-2 transition-all duration-300 text-gray-400 relative z-10" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ========== MAIN DASHBOARD ==========
const Dashboard = () => {
  const navigate = useNavigate();
  const authState = useSelector((state: any) => state.auth);

  const getUserRole = () => {
    const storedRole = localStorage.getItem("userRole");
    if (storedRole) return storedRole.toLowerCase();
    if (authState?.user) {
      const u = authState.user;
      if (u.roles?.length) return u.roles[0]?.toLowerCase() || "agent";
      if (u.role) return u.role.toLowerCase();
      if (u.userType) return u.userType.toLowerCase();
    }
    return "agent";
  };

  const userRole = getUserRole();

  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (userRole === "customer") return <CustomerDashboard />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ===== HEADER ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              {today}
            </p>
          </div>
        </div>

        {/* ===== STATS ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <StatCard
            title="Total Premium"
            value="0"
            icon={NairaIcon}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatCard
            title="Active Policies"
            value="0"
            icon={FileCheck}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Pending Claims"
            value="0"
            icon={AlertCircle}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <StatCard
            title="Total Clients"
            value="0"
            icon={Users}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
        </div>

        {/* ===== QUICK ACTIONS ===== */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Quick Actions</h2>
            <span className="text-xs text-gray-400 animate-pulse">Get started with common tasks</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <QuickAction
              icon={Plus}
              label="New Quotation"
              sub="Group Life"
              path="/quotations/group-life/new"
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
            />
            <QuickAction
              icon={Eye}
              label="View Quotations"
              sub="Group Life list"
              path="/quotations/group-life"
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            />
            <QuickAction
              icon={ShieldCheck}
              label="Underwriting"
              sub="Manage policies"
              path="/underwriting/overview"
              iconColor="text-purple-600"
              iconBg="bg-purple-50"
            />
            <QuickAction
              icon={AlertCircle}
              label="Claims"
              sub="View & process"
              path="/claims/overview"
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
            />
          </div>
        </div>

        {/* ===== SECTION CARDS ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          <SectionCard
            icon={ShieldCheck}
            iconColor="text-purple-600"
            hoverText="hover:text-purple-700"
            hoverBg="hover:bg-purple-50"
            title="Underwriting"
            links={[
              { label: "Overview", path: "/underwriting/overview" },
              { label: "Group Life Quotations", path: "/underwriting/group-life-quotations" },
            ]}
          />
          <SectionCard
            icon={AlertCircle}
            iconColor="text-amber-600"
            hoverText="hover:text-amber-700"
            hoverBg="hover:bg-amber-50"
            title="Claims"
            links={[
              { label: "Overview", path: "/claims/overview" },
            ]}
          />
          <SectionCard
            icon={Users}
            iconColor="text-teal-600"
            hoverText="hover:text-teal-700"
            hoverBg="hover:bg-teal-50"
            title="CSU"
            links={[
              { label: "Overview", path: "/csu/overview" },
              { label: "Customers", path: "/csu/customers" },
              { label: "Enquiries", path: "/csu/enquiries" },
              { label: "Agency", path: "/csu/agency" },
              { label: "Tickets", path: "/csu/tickets" },
            ]}
          />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;