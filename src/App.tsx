//@ts-nocheck
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import "./styles/global.css";
import { useAuth } from "./hooks/use-auth";
import { useSelector } from "react-redux";
import type { RootState } from "./features/store";
import { Toaster } from "./components/UI/toaster";
import HomePage from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/admin/admin-page.Dashboard";
import AdminSecurity from "./pages/admin/admin-page.Security";
import AdminProducts from "./pages/admin/admin-page.Products";
import AdminFeatures from "./pages/admin/admin-page.Features";
import AdminSettings from "./pages/admin/admin-page.Settings";
import Dashboard from "./pages/Dashboard";
import CSU from "./pages/CSU";
import CSUEnquiries from "./pages/csu/csu-page.enquiries";
import CSUCustomers from "./pages/csu/csu-page.customers";
import CSUMessaging from "./pages/csu/csu-page.messaging";
import CSUTickets from "./pages/csu/csu-page.tickets";
import CSUParty from "./pages/csu/csu-page.party";
import AdminCompany from "./pages/admin/admin-page.Company";
import Quotations from "./pages/Quotations";
import QuotationsOverview from "./pages/quotations/quotations-page.overview";
import QuotationsInvestment from "./pages/quotations/quotations-page.investment";
import QuotationsTraditional from "./pages/quotations/quotations-page.traditional";
import QuotationsGroupLife from "./pages/quotations/quotations-page.group-life";
import QuotationsCreditLife from "./pages/quotations/quotations-page.credit-life";
import Proposals from "./pages/Proposals";
import ProposalsOverview from "./pages/proposals/proposals-page.overview";
import ProposalsInvestmentLink from "./pages/proposals/proposals-page.investment-link";
import ProposalsTraditional from "./pages/proposals/proposals-page.traditional";
import ProposalsGroup from "./pages/proposals/proposals-page.group";
import ProposalsCredit from "./pages/proposals/proposals-page.credit";
import ProposalsHealth from "./pages/proposals/proposals-page.health";
import Underwriting from "./pages/Underwriting";
import UnderwritingOverview from "./pages/underwriting/underwriting-page.overview";
import UnderwritingInvestmentLink from "./pages/underwriting/underwriting-page.investment-link";
import UnderwritingTraditional from "./pages/underwriting/underwriting-page.traditional";
import UnderwritingGroupLife from "./pages/underwriting/underwriting-page.group-life";
import UnderwritingCreditLife from "./pages/underwriting/underwriting-page.credit-life";
import UnderwritingHealth from "./pages/underwriting/underwriting-page.health";
import PolicyHistory from "./pages/customer/PolicyHistory";
import InvestmentLinkProposalDetail from "./pages/proposals/proposals.investment-link-detail";
import TradProposalDetail from "./pages/proposals/proposals.traditional-details";
import MakePayment from "./pages/customer/MakePayment";
import ReportClaim from "./pages/customer/ReportClaim";
import AgentRegister from "./components/agent/AgentRegister";
import { UserLayout } from "./components/UserLayout";
import ProposalsPolicyHistory from "./components/proposals/ProposalsPolicyHistory";
import PaymentSuccess from "./components/PaymentSuccess"
import PaymentFailed from "./components/PaymentFailed"
import TransactionHistory from "./pages/customer/TransactionHistory";

const App: React.FC = () => {
  useAuth();
  const authState = useSelector((state: RootState) => state.auth);
  
  const isExpired = authState?.isExpired || true;
  const user = authState?.user || null;

  const getUserRole = () => {
    if (!user) return 'agent';
    
    try {
      if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
        return user.roles[0]?.toLowerCase() || 'agent';
      }
      if (user.role) {
        return user.role.toLowerCase();
      }
      return 'agent';
    } catch (error) {
      console.error("Error detecting user role:", error);
      return 'agent';
    }
  };

  const userRole = getUserRole();
  
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
       
        <Route path="/agent/register" element={<AgentRegister />} />

        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />

        {/* ALL PROTECTED ROUTES - Single Layout that handles both customer and agent/admin views */}
        <Route element={<UserLayout><Layout /></UserLayout>}>
          {/* SINGLE DASHBOARD FOR ALL USERS */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Customer-specific routes */}
          <Route path="/policy-history" element={<PolicyHistory />} />
          <Route path="/make-payment" element={<MakePayment />} />
          <Route path="/report-claim" element={<ReportClaim />} />
          <Route path="/transaction-history" element={<TransactionHistory />} />
          


          {/* Agent/Admin routes */}
          <Route path="/csu" element={<CSU />}>
            <Route path="enquiries" element={<CSUEnquiries />} />
            <Route path="customers" element={<CSUCustomers />} />
            <Route path="partners" element={<CSUParty />} />
            <Route path="messaging" element={<CSUMessaging />} />
            <Route path="tickets" element={<CSUTickets />} />
          </Route>

          <Route path="/quotations" element={<Quotations />}>
            <Route path="overview" element={<QuotationsOverview />} />
            <Route path="investment-link" element={<QuotationsInvestment />} />
            <Route path="traditional" element={<QuotationsTraditional />} />
            <Route path="group-life" element={<QuotationsGroupLife />} />
            <Route path="group-life/:Param" element={<QuotationsGroupLife />} />
            <Route path="credit-life" element={<QuotationsCreditLife />} />
          </Route>

          <Route path="/proposals" element={<Proposals />}>
            <Route path="overview" element={<ProposalsOverview />} />
            <Route path="investment-link" element={<ProposalsInvestmentLink />} />
            <Route path="investment-link/:proposalId/detail" element={<InvestmentLinkProposalDetail />} />
            <Route path="traditional" element={<ProposalsTraditional />} />
            <Route path="traditional/:proposalId/detail" element={<TradProposalDetail />} />
            <Route path="group" element={<ProposalsGroup />} />
            <Route path="credit" element={<ProposalsCredit />} />
            <Route path="health" element={<ProposalsHealth />} />
            <Route path="policy-history" element={<ProposalsPolicyHistory />} />
          </Route>

          <Route path="/underwriting" element={<Underwriting />}>
            <Route path="overview" element={<UnderwritingOverview />} />
            <Route path="investment-link" element={<UnderwritingInvestmentLink />} />
            <Route path="traditional" element={<UnderwritingTraditional />} />
            <Route path="group-life" element={<UnderwritingGroupLife />} />
            <Route path="credit-life" element={<UnderwritingCreditLife />} />
            <Route path="health" element={<UnderwritingHealth />} />
          </Route>

          <Route path="/admin" element={<Admin />}>
            <Route index element={<AdminDashboard />} />
            <Route path="security" element={<AdminSecurity />} />
            <Route path="company" element={<AdminCompany />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="features" element={<AdminFeatures />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>

        {/* REDIRECT EVERYONE TO /dashboard */}
        <Route
          path="*"
          element={
            !isExpired ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </>
  );
};

export default App;