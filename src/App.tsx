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
import AdminOverview from "./pages/admin/admin-page.Dashboard";
import AdminSecurity from "./pages/admin/admin-page.Security";
import AdminProducts from "./pages/admin/admin-page.Products";
import AdminFeatures from "./pages/admin/admin-page.Features";
import AdminSettings from "./pages/admin/admin-page.Settings";
import Dashboard from "./pages/Dashboard";
import CSU from "./pages/CSU";
import CSUOverview from "./pages/csu/csu-page.overview";
import CSUEnquiries from "./pages/csu/csu-page.enquiries";
import CSUCustomers from "./pages/csu/csu-page.customers";
import CSUAgency from "./pages/csu/csu-page.agency";
import CSUManager from "./pages/csu/csu-page.manager";
import CSUMessaging from "./pages/csu/csu-page.messaging";
import CSUTickets from "./pages/csu/csu-page.tickets";
import CSUParty from "./pages/csu/csu-page.party";
import AdminCompany from "./pages/admin/admin-page.Company";
import Underwriting from "./pages/Underwriting";
import UnderwritingOverview from "./pages/underwriting/underwriting-page.overview";
import UnderwritingSubPage from "./pages/underwriting/underwriting-page.subpage";
import Claims from "./pages/Claims";
import ClaimsOverview from "./pages/claims/claims-page.overview";
import ClaimsSubPage from "./pages/claims/claims-page.subpage";
import Reinsurance from "./pages/Reinsurance";
// import ReinsuranceOverview from "./pages/reinsurance/reinsurance-page.overview";
import Quotations from "./pages/Quotations";
import QuotationsOverview from "./pages/quotations/quotations-page.overview";
import QuotationsSubPage from "./pages/quotations/quotations-page.subpage";
import QuotationsGroupLife from "./pages/quotations/quotations-page.group-life";
import GroupLifeQuotationDetail from "./components/groupLife/GroupLifeQuotationDetail";
import EditGroupLifeQuotationDetail from "./components/groupLife/EditGroupLifeQuotationDetail";
import PolicyHistory from "./pages/customer/PolicyHistory";
import MakePayment from "./pages/customer/MakePayment";
import ReportClaim from "./pages/customer/ReportClaim";
import AgentRegister from "./components/agent/AgentRegister";
import { UserLayout } from "./components/UserLayout";
import PaymentSuccess from "./components/PaymentSuccess"
import PaymentFailed from "./components/PaymentFailed"
import TransactionHistory from "./pages/customer/TransactionHistory";
import SchemeRenewals from "./components/groupLife/SchemeRenewals";
import Endorsement from "./pages/underwriting/GroupLife/Endorsement"
import CreditLifeSchemeAdmin from "./components/CreditLife/CreditLifeSchemeAdmin";
import CreditLifeSchemeRenewals from "./components/CreditLife/CreditLifeSchemeRenewals";

// Imports of  claim pages
import  MaturityClaims  from "./pages/claims/MaturityClaims";
import  SurrenderClaims  from "./pages/claims/SurrenderClaims";
import  PartialWithdrawalClaims  from "./pages/claims/PartialWithdrawalClaims";
import  DeathBenefitClaims  from "./pages/claims/DeathBenefitClaims";
import  ClaimCreatePage  from "./components/claims/ClaimCreatePage";
import  ClaimEditPage from "./components/claims/ClaimEditPage";
import ClaimFormPage from "./components/claims/ClaimsFormPage"; // New unified form page for create, edit, and view
import GroupLifeDeathClaims from "./pages/claims/GroupLifeClaims/GroupLifeDeathClaims";
import GroupLifeMaturityClaims from "./pages/claims/GroupLifeClaims/GroupLifeMaturityClaims";
import GroupLifeSurrenderClaims from "./pages/claims/GroupLifeClaims/GroupLifeSurrenderClaims";
import GroupLifePartialWithdrawalClaims from "./pages/claims/GroupLifeClaims/GroupLifePartialWithdrawalClaims";
import GroupLifeClaimFormPage from "./components/claims/GroupLife/GroupLifeFormPage"
import CreditLifeDeathClaims from "./pages/claims/CreditLife/CreditLifeDeathClaims";
import CreditLifeClaimFormPage from "./components/claims/CreditLife/CreditLifeFormPage";

import PlaceholderPage from "./pages/underwriting/PlaceHolderPage";
import ProductLine from "./pages/admin/configuration/ProductLine"; 
import ProductCovers from "./pages/admin/configuration/ProductCovers";
import ProductSetting from "./pages/admin/configuration/ProductSettings";
import ProductSections from "./pages/admin/configuration/ProductSections";
import ProductSMI from "./pages/admin/configuration/ProductSMI";
import ProductMainClass from "./pages/admin/configuration/ProductMainClass";
import ProductForm from "./components/admin/configuration/ProductLineForm"; 

const App: React.FC = () => {
  useAuth();
  const authState = useSelector((state: RootState) => state.auth);
  
  const isExpired = authState?.isExpired ?? true;
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
            <Route path="overview" element={<CSUOverview />} />
            <Route path="enquiries" element={<CSUEnquiries />} />
            <Route path="customers" element={<CSUCustomers />} />
            <Route path="agency" element={<CSUAgency />} />
            <Route path="manager" element={<CSUManager />} />
            <Route path="partners" element={<CSUParty />} />
            <Route path="messaging" element={<CSUMessaging />} />
            <Route path="tickets" element={<CSUTickets />} />
          </Route>

          <Route path="/underwriting" element={<Underwriting />}>
            <Route path="overview" element={<UnderwritingOverview />} />
            
            {/* All routes go through UnderwritingSubPage */}
            <Route path="group-life-quotations/members/:id" element={<UnderwritingSubPage />} />
            <Route path="group-life-quotations/new" element={<UnderwritingSubPage />} />
            <Route path="group-life-quotations/:id" element={<UnderwritingSubPage />} />
            <Route path="group-life-quotations" element={<UnderwritingSubPage />} />
            
            {/* ✅ Individual Policy Admin Routes */}
            <Route path="individual/policy-admin" element={<UnderwritingSubPage />} />
            <Route path="individual/policy-admin/new-investment" element={<UnderwritingSubPage />} />
            <Route path="individual/policy-admin/new-traditional" element={<UnderwritingSubPage />} />
            
            {/* 🆕 ADD THESE INVESTMENT AND TRADITIONAL POLICY LIST ROUTES */}
            <Route path="individual/policy-admin/investment-policies" element={<UnderwritingSubPage />} />
            <Route path="individual/policy-admin/traditional-policies" element={<UnderwritingSubPage />} />
            
            {/* ✅ EDIT ROUTES */}
            <Route path="individual/policy-admin/edit-investment/:id" element={<UnderwritingSubPage />} />
            <Route path="individual/policy-admin/edit-traditional/:id" element={<UnderwritingSubPage />} />
            
            <Route path="convert-to-policy/investment-policies" element={<UnderwritingSubPage />} />
            <Route path="convert-to-policy/investment-policies/:id" element={<UnderwritingSubPage />} />
            <Route path="convert-to-policy/group-business-quotations" element={<UnderwritingSubPage />} />
            <Route path="convert-to-scheme/group-life-policies" element={<UnderwritingSubPage />} />
            <Route path="convert-to-scheme/credit-life-policies" element={<UnderwritingSubPage />} />
            <Route path="group-life/scheme-renewals" element={<SchemeRenewals />} />
            <Route path="group-life/endorsement" element={<Endorsement />} />

            {/* All other underwriting routes - just use UnderwritingSubPage */}
            <Route path="individual/endorsements" element={<UnderwritingSubPage />} />
            <Route path="individual/endorsements/*" element={<UnderwritingSubPage />} />
            <Route path="individual/processing" element={<UnderwritingSubPage />} />
            <Route path="individual/processing/*" element={<UnderwritingSubPage />} />
            <Route path="individual/maintenance" element={<UnderwritingSubPage />} />
            <Route path="group-life/maintenance" element={<UnderwritingSubPage />} />
            <Route path="credit-life/scheme-admin" element={<UnderwritingSubPage />} />
            <Route path="credit-life/scheme-renewals" element={<UnderwritingSubPage />} />
            <Route path="credit-life/endorsements" element={<UnderwritingSubPage />} />
            <Route path="credit-life/maintenance" element={<UnderwritingSubPage />} />
            <Route path="credit-life/general-bus/fire" element={<UnderwritingSubPage />} />
            <Route path="credit-life/general-bus/motor" element={<UnderwritingSubPage />} />
            <Route path="credit-life/package-bus" element={<UnderwritingSubPage />} />
          </Route>

          {/* 
            ✅ UPDATED CLAIMS ROUTES
            Now using the new individual claim pages for maturity, surrender, partial withdrawal, and death benefit
            The ClaimsSubPage handles processing routes and group/credit life routes
          */}
          <Route path="/claims" element={<Claims />}>
            <Route path="overview" element={<ClaimsOverview />} />
            
            {/* Individual Claim Pages */}
            <Route path="individual/maturity" element={<MaturityClaims />} />
            <Route path="individual/surrender" element={<SurrenderClaims />} />
            <Route path="individual/partial-withdrawal" element={<PartialWithdrawalClaims />} />
            <Route path="individual/death-benefit" element={<DeathBenefitClaims />} />

            {/* ✅ Create Page - Single dynamic route */}
            <Route path="individual/:lossType/create" element={<ClaimFormPage mode="create" />} />
            
            {/* ✅ Edit Page - Single dynamic route */}
            <Route path="individual/claim/edit/:id" element={<ClaimFormPage mode="edit" />} />
            
            {/* ✅ View Page - Single dynamic route */}
            <Route path="individual/claim/view/:id" element={<ClaimFormPage mode="view" />} />
            
            {/* Individual Processing Routes */}
            <Route path="individual/processing/offer" element={<ClaimsSubPage />} />
            <Route path="individual/processing/requisition" element={<ClaimsSubPage />} />
            <Route path="individual/processing/payment-approval" element={<ClaimsSubPage />} />
            <Route path="individual/processing/enquiries" element={<ClaimsSubPage />} />
            
           
  {/* Group Life Claim Pages */}
  <Route path="group-life/death-claim" element={<GroupLifeDeathClaims />} />
  <Route path="group-life/maturity" element={<GroupLifeMaturityClaims />} />
  <Route path="group-life/surrender" element={<GroupLifeSurrenderClaims />} />
  <Route path="group-life/partial-withdrawal" element={<GroupLifePartialWithdrawalClaims />} />
  <Route path="group-life/:lossType/create" element={<GroupLifeClaimFormPage mode="create" />} />
  <Route path="group-life/claim/edit/:id" element={<GroupLifeClaimFormPage mode="edit" />} />
  <Route path="group-life/claim/view/:id" element={<GroupLifeClaimFormPage mode="view" />} />
  <Route path="group-life/processing/offer" element={<ClaimsSubPage />} />
  <Route path="group-life/processing/requisition" element={<ClaimsSubPage />} />
  <Route path="group-life/processing/payment-approval" element={<ClaimsSubPage />} />
  <Route path="group-life/processing/enquiries" element={<ClaimsSubPage />} />
            {/* Credit Life Routes */}
            <Route path="credit-life/death-claim" element={<CreditLifeDeathClaims />} />
             <Route path="credit-life/:lossType/create" element={<CreditLifeClaimFormPage mode="create" />} />
               <Route path="credit-life/claim/edit/:id" element={<CreditLifeClaimFormPage mode="edit" />} />
  <Route path="credit-life/claim/view/:id" element={<CreditLifeClaimFormPage mode="view" />} />
            <Route path="credit-life/processing/offer" element={<ClaimsSubPage />} />
            <Route path="credit-life/processing/requisition" element={<ClaimsSubPage />} />
            <Route path="credit-life/processing/payment-approval" element={<ClaimsSubPage />} />
            <Route path="credit-life/processing/enquiries" element={<ClaimsSubPage />} />
            
            {/* Fallback */}
            <Route path=":section/processing/:subpage" element={<ClaimsSubPage />} />
          </Route>

          <Route path="/reinsurance" element={<Reinsurance />}>
            <Route path="overview" element={<PlaceholderPage title="Reinsurance Overview" />} />
          </Route>

         


<Route path="/admin" element={<Admin />}>
  <Route index element={<AdminOverview />} />
  <Route path="security" element={<AdminSecurity />} />
  <Route path="company" element={<AdminCompany />} />
  <Route path="products" element={<AdminProducts />} />
  <Route path="features" element={<AdminFeatures />} />
  <Route path="settings" element={<AdminSettings />} />
  
  {/* Configurations category placeholder - matches sidebar path */}
  <Route path="configurations" element={<PlaceholderPage title="Configurations" />} />
  
  {/* Individual configuration sub-items */}
 {/* Product Lines */}
  <Route path="configurations/product-lines" element={<ProductLine />} />
  <Route path="configurations/product-lines/new" element={<ProductForm mode="new" configType="product-lines" />} />
  <Route path="configurations/product-lines/edit/:id" element={<ProductForm mode="edit" configType="product-lines" />} />
  <Route path="configurations/product-lines/view/:id" element={<ProductForm mode="view" configType="product-lines" />} />

  {/* Product Main Class */}
  <Route path="configurations/product-main-class" element={<ProductMainClass />} />
  <Route path="configurations/product-main-class/new" element={<ProductForm mode="new" configType="product-main-class" />} />
  <Route path="configurations/product-main-class/edit/:id" element={<ProductForm mode="edit" configType="product-main-class" />} />
  <Route path="configurations/product-main-class/view/:id" element={<ProductForm mode="view" configType="product-main-class" />} />

  {/* Product Settings */}
  <Route path="configurations/product-settings" element={<ProductSetting />} />
  <Route path="configurations/product-settings/new" element={<ProductForm mode="new" configType="product-settings" />} />
  <Route path="configurations/product-settings/edit/:id" element={<ProductForm mode="edit" configType="product-settings" />} />
  <Route path="configurations/product-settings/view/:id" element={<ProductForm mode="view" configType="product-settings" />} />

  {/* Product Sections */}
  <Route path="configurations/product-sections" element={<ProductSections />} />
  <Route path="configurations/product-sections/new" element={<ProductForm mode="new" configType="product-sections" />} />
  <Route path="configurations/product-sections/edit/:id" element={<ProductForm mode="edit" configType="product-sections" />} />
  <Route path="configurations/product-sections/view/:id" element={<ProductForm mode="view" configType="product-sections" />} />

  {/* Product Covers */}
  <Route path="configurations/product-covers" element={<ProductCovers />} />
  <Route path="configurations/product-covers/new" element={<ProductForm mode="new" configType="product-covers" />} />
  <Route path="configurations/product-covers/edit/:id" element={<ProductForm mode="edit" configType="product-covers" />} />
  <Route path="configurations/product-covers/view/:id" element={<ProductForm mode="view" configType="product-covers" />} />

  {/* Product SMI */}
  <Route path="configurations/product-smi" element={<ProductSMI />} />
  <Route path="configurations/product-smi/new" element={<ProductForm mode="new" configType="product-smi" />} />
  <Route path="configurations/product-smi/edit/:id" element={<ProductForm mode="edit" configType="product-smi" />} />
  <Route path="configurations/product-smi/view/:id" element={<ProductForm mode="view" configType="product-smi" />} />
  <Route path="configurations/bus-channel" element={<PlaceholderPage title="Bus Channel" />} />
  <Route path="configurations/sub-channel" element={<PlaceholderPage title="Sub Channel" />} />
  <Route path="configurations/commission-rates" element={<PlaceholderPage title="Commission Rates" />} />
  <Route path="configurations/interest-rates" element={<PlaceholderPage title="Interest Rates" />} />
  <Route path="configurations/premium-rates" element={<PlaceholderPage title="Premium Rates" />} />
  <Route path="configurations/allocation-rates" element={<PlaceholderPage title="Allocation Rates" />} />
  <Route path="configurations/medical-test" element={<PlaceholderPage title="Medical Test" />} />
  <Route path="configurations/test-distribution" element={<PlaceholderPage title="Test Distribution" />} />
  <Route path="configurations/medical-hospital" element={<PlaceholderPage title="Medical Hospital" />} />
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