//@ts-nocheck

import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FileText,
  PlusCircle,
  List,
  ClipboardList,
  FileCheck,
  LayoutGrid,
} from "lucide-react";
import { Card, CardContent } from "../components/UI/card";
import CustomerDashboard from "./customer/CustomerDashboard";

const Dashboard = () => {
  const navigate = useNavigate();
  const authState = useSelector((state: any) => state.auth);

  // Get user role from localStorage or Redux store
  const getUserRole = () => {
    // First try from localStorage (set during login)
    const storedRole = localStorage.getItem("userRole");
    if (storedRole) {
      return storedRole.toLowerCase();
    }

    // Then try from Redux store
    if (authState?.user) {
      const user = authState.user;
      if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
        return user.roles[0]?.toLowerCase() || "agent";
      }
      if (user.role) {
        return user.role.toLowerCase();
      }
      if (user.userType) {
        return user.userType.toLowerCase();
      }
    }

    return "agent"; // default
  };

  const userRole = getUserRole();

  // If user is customer, show CustomerDashboard
  if (userRole === "customer") {
    return <CustomerDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome to your insurance management system
          </p>
        </div>

        {/* Quick Access Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <LayoutGrid className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-900">
              Quick Access
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quotations Section */}
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Quotations
                  </h3>
                </div>
                <div className="space-y-3">
                  <Link
                    to="/quotations/overview"
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                  >
                    <LayoutGrid className="w-5 h-5" />
                    <span>Overview</span>
                  </Link>
                  <Link
                    to="/quotations/investment-link"
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Investment Link Quotes</span>
                  </Link>
                  <Link
                    to="/quotations/traditional"
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Traditional Quotes</span>
                  </Link>
                  <Link
                    to="/quotations/group-life"
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Group Life Quotes</span>
                  </Link>
                  <Link
                    to="/quotations/credit-life"
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Credit Life Quotes</span>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Proposals Section */}
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <ClipboardList className="w-8 h-8 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Proposals
                  </h3>
                </div>
                <div className="space-y-3">
                  <Link
                    to="/proposals/overview"
                    className="flex items-center gap-2 text-gray-700 hover:text-green-600 hover:bg-green-50 p-2 rounded transition-colors"
                  >
                    <LayoutGrid className="w-5 h-5" />
                    <span>Overview</span>
                  </Link>
                  <Link
                    to="/proposals/investment-link"
                    className="flex items-center gap-2 text-gray-700 hover:text-green-600 hover:bg-green-50 p-2 rounded transition-colors"
                  >
                    <ClipboardList className="w-5 h-5" />
                    <span>Investment Link Schemes</span>
                  </Link>
                  <Link
                    to="/proposals/traditional"
                    className="flex items-center gap-2 text-gray-700 hover:text-green-600 hover:bg-green-50 p-2 rounded transition-colors"
                  >
                    <ClipboardList className="w-5 h-5" />
                    <span>Traditional Schemes</span>
                  </Link>
                  <Link
                    to="/proposals/policy-history"
                    className="flex items-center gap-2 text-gray-700 hover:text-green-600 hover:bg-green-50 p-2 rounded transition-colors"
                  >
                    <FileCheck className="w-5 h-5" />
                    <span>Policy History</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
