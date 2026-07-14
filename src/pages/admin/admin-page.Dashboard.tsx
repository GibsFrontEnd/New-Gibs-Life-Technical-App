import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Building2,
  Shield,

 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";

// Mirrors the admin sidebar structure so the overview stays in sync.
const sections = [
  {
    label: "Overview",
    blurb: "View key metrics and system status at a glance.",
    icon: LayoutDashboard,
    path: "/admin",
  },
  {
    label: "Company",
    blurb: "Manage company settings and configuration.",
    icon: Building2,
    path: "/admin/company",
  },
  {
    label: "Security",
    blurb: "Configure security settings and access controls.",
    icon: Shield,
    path: "/admin/security",
  },
];

// Types for the metrics data
interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  userGrowth: number;
  systemStatus: string;
  uptimePercentage: number;
  pendingTasks: number;
  taskChange: number;
  securityAlerts: number;
  criticalAlerts: number;
}

const AdminOverview = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Replace with your actual API endpoint
      const response = await fetch('/api/admin/dashboard/metrics');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics');
      }
      
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Failed to load dashboard metrics');
      
      // Fallback data for development/demo
      setMetrics({
        totalUsers: 1022,
        activeUsers: 1032,
        userGrowth: 12.5,
        systemStatus: 'Operational',
        uptimePercentage: 99.9,
        pendingTasks: 23,
        taskChange: -8.2,
        securityAlerts: 0,
        criticalAlerts: 0,
      });
    } finally {
      setLoading(false);
    }
  };

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

  // Format metrics for display
  const formatMetrics = (data: DashboardMetrics) => {
    return [
      {
        label: "Total Users",
        value: data.totalUsers.toLocaleString(),
        change: `${data.userGrowth > 0 ? '+' : ''}${data.userGrowth}%`,
        isPositive: data.userGrowth > 0,
        description: ` active users this month`,
      },
      {
        label: "System Status",
        value: data.systemStatus,
        change: `${data.uptimePercentage}%`,
        isPositive: data.uptimePercentage >= 99.5,
        description: `Uptime in last 30 days`,
      },
      {
        label: "Pending Tasks",
        value: data.pendingTasks.toString(),
        change: `${data.taskChange > 0 ? '+' : ''}${data.taskChange}%`,
        isPositive: data.taskChange < 0, // Negative change is good for pending tasks
        description: "Actions requiring attention",
      },
      {
        label: "Security Alerts",
        value: data.securityAlerts.toString(),
        change: data.criticalAlerts === 0 ? "All clear" : `${data.criticalAlerts} critical`,
        isPositive: data.securityAlerts === 0,
        description: data.criticalAlerts === 0 ? "No security issues" : `${data.criticalAlerts} critical issues`,
      },
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0d47a1] animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard metrics...</p>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to Load Dashboard</h3>
          <p className="text-gray-500">{error}</p>
          <button
            onClick={fetchDashboardMetrics}
            className="mt-4 px-4 py-2 bg-[#0d47a1] text-white rounded-lg hover:bg-[#0d47a1]/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const displayMetrics = metrics ? formatMetrics(metrics) : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-900 p-2 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header>

        <h1 className="text-3xl font-black text-gray-800 tracking-tight">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Manage system settings, security, and view key metrics.
        </p>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayMetrics.map((metric, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{metric.label}</span>
              {metric.isPositive ? (
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
              )}
            </div>
            <div className="mb-2">
              
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${
                metric.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change}
              </span>
              <span className="text-xs text-gray-400">{metric.description}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <QuickAction
              key={section.label}
              to={section.path}
              label={section.label}
              icon={<section.icon className="w-6 h-6" />}
              description={section.blurb}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;