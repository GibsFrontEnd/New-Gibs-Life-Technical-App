//@ts-nocheck
import React, { useState, useEffect } from "react";
import {
  FileText,
  Shield,
  Clock,
  AlertTriangle,
  X,
  Search,
  Filter,
  Plus,
  Download,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import {
  getRegularProposalsByInsuredId,
  getTraditionalProposalsByInsuredId,
  getRegularQuotationsByInsuredId,
  getTraditionalQuotationsByInsuredId,
  getGroupLifeQuotationsByInsuredId,
  setCurrentCustomer,
  clearMessages,
} from "../../features/reducers/csuReducers/customerSlice";

interface InsuranceItem {
  type: string;
  policyNumber: string;
  policyHolder: string;
  productName: string;
  status: string;
  premium: string;
  renewalDate: string;
  coverage: string;
  icon: JSX.Element;
  statusColor: string;
  expiryDate?: string;
  createdDate?: string;
  category: "proposal" | "quotation";
  productType?: string;
}

interface Quotation {
  quoteID: number;
  quoteNo: string;
  proposalNo: string;
  brCode: string;
  tDate: string;
  assDate: string;
  coverCode: string;
  covertype: string;
  surName: string;
  otherNames: string;
  mobilePhone: string;
  email: string;
  startDate: string;
  maturityDate: string;
  duration: number;
  dateofBirth: string;
  sumAssured: number;
  status: string;
  premium1: number;
  totalPremium: number;
  basicPremium: number;
}

interface Proposal {
  policyID: number;
  policyNo: string | null;
  proposalNo: string;
  brCode: string;
  tDate: string | null;
  propDate: string | null;
  assDate: string | null;
  coverCode: string;
  covertype: string | null;
  title: string;
  assuredCode: string;
  surName: string;
  otherNames: string;
  fullName: string;
  address: string;
  state: string;
  landphone: string;
  mobilePhone: string;
  email: string;
  nationalID: string;
  occupation: string;
  sex: string;
  maritalStatus: string;
  country: string;
  agentcode: string;
  agentDescription: string;
  startDate: string;
  maturityDate: string;
  duration: number;
  dateofBirth: string;
  fop: string | null;
  age: number;
  mop: string | null;
  sumAssured: number;
  premium1: number;
  premium2: number;
  premium3: number;
  basicPremium: number;
  intrestRate: number | null;
  totalPremium: number;
  loading: number | null;
  suppsa: number | null;
  xMas: number | null;
  adbsa: number | null;
  toAllocate: number | null;
  transSTATUS: string | null;
  transGUID: string;
  remarks: string | null;
  tag: string | null;
  contactName: string;
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  contactJob: string;
  customerType: string;
  meansID: string;
  idNo: string;
  chronicIllness: string;
  isProposal: number;
  deleted: number;
  submittedBy: string;
  submittedOn: string;
  modifiedBy: string | null;
  modifiedOn: string;
}

// Helper functions defined OUTSIDE the main component
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount);
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return "Invalid Date";
  }
};

const getStatusBadge = (status: string) => {
  const statusConfig = {
    active: { text: "Active", color: "bg-green-100 text-green-800 border-green-200" },
    pending: { text: "Pending", color: "bg-orange-100 text-orange-800 border-orange-200" },
    draft: { text: "Draft", color: "bg-blue-100 text-blue-800 border-blue-200" },
    processing: { text: "Processing", color: "bg-blue-100 text-blue-800 border-blue-200" },
    expired: { text: "Expired", color: "bg-red-100 text-red-800 border-red-200" }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {config.text}
    </span>
  );
};

const getCategoryBadge = (category: 'proposal' | 'quotation') => {
  const config = category === 'proposal' 
    ? { text: "Proposal", color: "bg-indigo-100 text-indigo-800 border-indigo-200" }
    : { text: "Quotation", color: "bg-teal-100 text-teal-800 border-teal-200" };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {config.text}
    </span>
  );
};

// Insurance Card Component
const InsuranceCard = ({ item, onViewDetails, index }: { item: InsuranceItem; onViewDetails: (item: InsuranceItem) => void; index: number }) => (
  <div 
    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-500 overflow-hidden animate-fade-in"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg animate-pulse-once">
            {item.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 animate-fade-in-up">{item.type}</h3>
            <p className="text-sm text-gray-600 animate-fade-in-up" style={{ animationDelay: '100ms' }}>{item.policyNumber}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            {getStatusBadge(item.status)}
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            {getCategoryBadge(item.category)}
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <p className="text-sm text-gray-600">Product</p>
          <p className="font-medium text-gray-900">{item.productName}</p>
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <p className="text-sm text-gray-600">Policy Holder</p>
          <p className="font-medium text-gray-900">{item.policyHolder}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <p className="text-sm text-gray-600">Premium</p>
          <p className="font-bold text-green-600">{item.premium}</p>
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '700ms' }}>
          <p className="text-sm text-gray-600">Coverage</p>
          <p className="font-bold text-blue-600">{item.coverage}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="animate-fade-in-up" style={{ animationDelay: '800ms' }}>
          <p className="text-sm text-gray-600">
            {item.status === 'pending' ? 'Expires' :
             item.status === 'draft' ? 'Created' : 'Renewal'}
          </p>
          <p className="text-sm font-medium text-gray-900">
            {formatDate(
              item.status === 'pending' ? item.expiryDate :
              item.status === 'draft' ? item.createdDate : item.renewalDate
            )}
          </p>
        </div>
        
        <button 
          onClick={() => onViewDetails(item)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 text-sm font-medium animate-fade-in-up hover:scale-105"
          style={{ animationDelay: '900ms' }}
        >
          <Eye size={16} />
          View
        </button>
      </div>
    </div>
  </div>
);

// Insurance Grid Component
const InsuranceGrid = ({ items, title, emptyMessage, onViewDetails }: { 
  items: InsuranceItem[]; 
  title: string; 
  emptyMessage: string;
  onViewDetails: (item: InsuranceItem) => void;
}) => (
  <section className="animate-fade-in">
    <div className="flex items-center justify-between mb-6 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <span className="text-sm text-gray-600">{items.length} {items.length === 1 ? 'item' : 'items'} total</span>
    </div>
    
    {items.length === 0 ? (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200 animate-fade-in">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-bounce-once" />
        <h3 className="text-lg font-medium text-gray-900 mb-2 animate-fade-in-up">No {title.toLowerCase()} found</h3>
        <p className="text-gray-500 animate-fade-in-up" style={{ animationDelay: '200ms' }}>{emptyMessage}</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {items.map((item, index) => (
          <InsuranceCard key={index} item={item} onViewDetails={onViewDetails} index={index} />
        ))}
      </div>
    )}
  </section>
);

// Insurance Modal Component
const InsuranceModal = ({ item, onClose }: { item: InsuranceItem; onClose: () => void }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ${
      isClosing ? 'animate-fade-out' : 'animate-fade-in'
    }`}>
      <div className={`bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
        isClosing ? 'animate-scale-out' : 'animate-scale-in'
      }`}>
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 animate-fade-in-up">
            <div className="p-2 bg-blue-100 rounded-lg">
              {item.icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{item.type}</h2>
              <p className="text-gray-600">{item.policyNumber}</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-300 hover:scale-110 animate-fade-in"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Shield size={20} />
                Policy Details
              </h3>
              
              <div className="space-y-3">
                <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  <label className="text-sm font-medium text-gray-600">Product Name</label>
                  <p className="text-gray-900">{item.productName}</p>
                </div>
                
                <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                  <label className="text-sm font-medium text-gray-600">Policy Holder</label>
                  <p className="text-gray-900">{item.policyHolder}</p>
                </div>
                
                <div className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">{getStatusBadge(item.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Category</label>
                    <div className="mt-1">{getCategoryBadge(item.category)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={20} />
                Financial Details
              </h3>
              
              <div className="space-y-3">
                <div className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                  <label className="text-sm font-medium text-gray-600">Premium Amount</label>
                  <p className="text-xl font-bold text-green-600">{item.premium}</p>
                </div>
                
                <div className="animate-fade-in-up" style={{ animationDelay: '700ms' }}>
                  <label className="text-sm font-medium text-gray-600">Coverage Amount</label>
                  <p className="text-xl font-bold text-blue-600">{item.coverage}</p>
                </div>
                
                <div className="animate-fade-in-up" style={{ animationDelay: '800ms' }}>
                  <label className="text-sm font-medium text-gray-600">
                    {item.status === 'pending' ? 'Expiry Date' :
                     item.status === 'draft' ? 'Created Date' : 'Renewal Date'}
                  </label>
                  <p className="text-gray-900">
                    {formatDate(
                      item.status === 'pending' ? item.expiryDate :
                      item.status === 'draft' ? item.createdDate : item.renewalDate
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3 animate-fade-in-up" style={{ animationDelay: '900ms' }}>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 font-medium hover:scale-105">
              <Download size={18} />
              Download Documents
            </button>
            <button className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 font-medium hover:scale-105">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { 
    currentCustomer, 
    regularProposals, 
    traditionalProposals,
    regularQuotations,
    traditionalQuotations,
    groupLifeQuotations,
    loading,
    error 
  } = useSelector((state: RootState) => state.customers);
  
  const { user } = useSelector((state: RootState) => state.auth); 
  
  const [selectedItem, setSelectedItem] = useState<InsuranceItem | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'proposals' | 'quotations'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  

  const findCustomerId = (): string | null => {
    const unEncryptedUser = localStorage.getItem("unEncryptedUser");
    if (unEncryptedUser) {
      try {
        const loginResponse = JSON.parse(unEncryptedUser);
        if (loginResponse.customer?.id) {
          return loginResponse.customer.id.toString();
        }
      } catch (error) {
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const customerId = findCustomerId();

    if (customerId) {
      dispatch(getRegularProposalsByInsuredId(customerId) as any);
      dispatch(getTraditionalProposalsByInsuredId(customerId) as any);
      dispatch(getRegularQuotationsByInsuredId(customerId) as any);
      dispatch(getTraditionalQuotationsByInsuredId(customerId) as any);
      dispatch(getGroupLifeQuotationsByInsuredId(customerId) as any);
    }
  }, [dispatch]);

  useEffect(() => {
    if (!loading.getRegularProposalsByInsuredId && !loading.getTraditionalProposalsByInsuredId) {
      const timer = setTimeout(() => {
        setIsDataLoaded(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading.getRegularProposalsByInsuredId, loading.getTraditionalProposalsByInsuredId]);

  const transformProposalsToInsuranceItems = (): InsuranceItem[] => {
    const allProposals: Proposal[] = [];

    if (regularProposals) {
      if (regularProposals.data && Array.isArray(regularProposals.data)) {
        allProposals.push(...regularProposals.data);
      } else if (Array.isArray(regularProposals)) {
        allProposals.push(...regularProposals);
      }
    }

    if (traditionalProposals) {
      if (traditionalProposals.data && Array.isArray(traditionalProposals.data)) {
        allProposals.push(...traditionalProposals.data);
      } else if (Array.isArray(traditionalProposals)) {
        allProposals.push(...traditionalProposals);
      }
    }

    if (allProposals.length === 0) {
      return [];
    }

    return allProposals.map((proposal, index) => {
      const hasPolicyNo = proposal.policyNo && proposal.policyNo !== "null" && proposal.policyNo !== "undefined";
      const isActive = proposal.remarks?.includes("IN FORCE") || hasPolicyNo;
      const isQuotation = !hasPolicyNo;

      const type = isActive
        ? "Active Policy"
        : isQuotation
        ? "Pending Proposal"
        : "Proposal Draft";
      const icon = isActive ? (
        <Shield className="w-5 h-5" />
      ) : isQuotation ? (
        <Clock className="w-5 h-5" />
      ) : (
        <FileText className="w-5 h-5" />
      );
      const status = isActive ? "active" : isQuotation ? "pending" : "draft";

      return {
        type,
        policyNumber: proposal.policyNo || proposal.proposalNo || `PROP-${index + 1}`,
        policyHolder: proposal.fullName || `${proposal.surName} ${proposal.otherNames}`.trim() || "Customer",
        productName: proposal.covertype || proposal.coverCode || "Insurance Proposal",
        status,
        premium: formatCurrency(proposal.totalPremium || proposal.basicPremium || 0),
        renewalDate: proposal.maturityDate || "",
        coverage: formatCurrency(proposal.sumAssured || 0),
        icon,
        statusColor: "",
        expiryDate: proposal.maturityDate || "",
        createdDate: proposal.startDate || proposal.submittedOn || "",
        category: "proposal",
        productType: proposal.covertype || "Regular",
      };
    });
  };

  const transformQuotationsToInsuranceItems = (): InsuranceItem[] => {
    const allQuotations: any[] = [];

    if (regularQuotations && Array.isArray(regularQuotations)) {
      allQuotations.push(...regularQuotations.map((q) => ({ ...q, productType: "Regular" })));
    }
    if (traditionalQuotations && Array.isArray(traditionalQuotations)) {
      allQuotations.push(...traditionalQuotations.map((q) => ({ ...q, productType: "Traditional" })));
    }
    if (groupLifeQuotations && Array.isArray(groupLifeQuotations)) {
      allQuotations.push(...groupLifeQuotations.map((q) => ({ ...q, productType: "Group Life" })));
    }

    if (allQuotations.length === 0) {
      return [];
    }

    return allQuotations.map((quotation, index) => {
      const status = quotation.status?.toLowerCase() || "draft";
      const icon = status === "active" ? (
        <Shield className="w-5 h-5" />
      ) : status === "pending" ? (
        <Clock className="w-5 h-5" />
      ) : (
        <FileText className="w-5 h-5" />
      );

      return {
        type: "Quotation",
        policyNumber: quotation.quoteNo || quotation.proposalNo || `QUOTE-${index + 1}`,
        policyHolder: quotation.fullName || `${quotation.surName} ${quotation.otherNames}`.trim() || "Customer",
        productName: quotation.covertype || quotation.coverCode || "Insurance Quotation",
        status,
        premium: formatCurrency(quotation.totalPremium || quotation.premium1 || quotation.basicPremium || 0),
        renewalDate: quotation.maturityDate || "",
        coverage: formatCurrency(quotation.sumAssured || 0),
        icon,
        statusColor: "",
        expiryDate: quotation.maturityDate || "",
        createdDate: quotation.tDate || quotation.assDate || "",
        category: "quotation",
        productType: quotation.productType || "Regular",
      };
    });
  };

  const proposalsData: InsuranceItem[] = transformProposalsToInsuranceItems();
  const quotationsData: InsuranceItem[] = transformQuotationsToInsuranceItems();
  const allData: InsuranceItem[] = [...proposalsData, ...quotationsData];

  const filteredData = allData.filter(
    (item) =>
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.policyHolder.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProposals = proposalsData.filter(
    (item) =>
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.policyHolder.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredQuotations = quotationsData.filter(
    (item) =>
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.policyHolder.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "policy-history":
        navigate("/policy-history");
        break;
      case "make-payment":
        navigate("/make-payment");
        break;
      case "report-claim":
        navigate("/report-claim");
        break;
      case "new-quotation":
        navigate("/new-quotation");
        break;
      default:
        break;
    }
  };

  const handleViewDetails = (item: InsuranceItem) => {
    setSelectedItem(item);
  };

  const handleTabChange = (tab: 'overview' | 'proposals' | 'quotations') => {
    setActiveTab(tab);
  };

  

  const getCustomerName = (): string => {
    const unEncryptedUser = localStorage.getItem("unEncryptedUser");
    if (unEncryptedUser) {
      try {
        const userData = JSON.parse(unEncryptedUser);
        if (userData?.customer?.orgName) return userData.customer.orgName;
        if (userData?.customer?.firstName)
          return `${userData.customer.firstName} ${userData.customer.lastName || ""}`.trim();
        if (userData?.name) return userData.name;
      } catch (error) {
        // Silent error
      }
    }

    if (currentCustomer?.orgName) return currentCustomer.orgName;
    if (currentCustomer?.firstName)
      return `${currentCustomer.firstName} ${currentCustomer.lastName || ""}`.trim();

    return "Customer";
  };

  if (loading.getRegularProposalsByInsuredId || loading.getTraditionalProposalsByInsuredId) {
    return (
      <main className="flex-1 p-6 lg:p-8">
        <div className="flex items-center justify-center h-64 animate-fade-in">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 animate-pulse">Loading your insurance portfolio...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 lg:p-8 bg-gray-50 min-h-screen animate-fade-in">
      {/* Header Section */}
      <section className="mb-8 animate-fade-in-up">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 animate-fade-in-up">
              Welcome back, {getCustomerName()}!
            </h1>
            <p className="text-gray-600 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Here's your insurance overview and portfolio
            </p>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Total Policies",
              value: proposalsData.filter(p => p.status === 'active').length,
              subtitle: "Active policies",
              icon: <Shield className="w-6 h-6 text-white" />,
              color: "bg-blue-500 group-hover:bg-blue-600",
              bgColor: "group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:to-white",
              borderColor: "group-hover:border-blue-200",
              textColor: "group-hover:text-blue-600",
              delay: 0
            },
            {
              title: "Pending Proposals",
              value: proposalsData.filter(p => p.status === 'pending').length,
              subtitle: "Awaiting approval",
              icon: <Clock className="w-6 h-6 text-white" />,
              color: "bg-orange-500 group-hover:bg-orange-600",
              bgColor: "group-hover:bg-gradient-to-br group-hover:from-orange-50 group-hover:to-white",
              borderColor: "group-hover:border-orange-200",
              textColor: "group-hover:text-orange-600",
              delay: 100
            },
            {
              title: "Active Quotations",
              value: quotationsData.filter(q => q.status === 'active').length,
              subtitle: "Ready for purchase",
              icon: <FileText className="w-6 h-6 text-white" />,
              color: "bg-green-500 group-hover:bg-green-600",
              bgColor: "group-hover:bg-gradient-to-br group-hover:from-green-50 group-hover:to-white",
              borderColor: "group-hover:border-green-200",
              textColor: "group-hover:text-green-600",
              delay: 200
            },
            {
              title: "Draft Quotations",
              value: quotationsData.filter(q => q.status === 'draft').length,
              subtitle: "In progress",
              icon: <FileText className="w-6 h-6 text-white" />,
              color: "bg-blue-500 group-hover:bg-blue-600",
              bgColor: "group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:to-white",
              borderColor: "group-hover:border-blue-200",
              textColor: "group-hover:text-blue-600",
              delay: 300
            }
          ].map((stat, index) => (
            <div 
              key={index} 
              className="group cursor-pointer transform transition-all duration-500 hover:scale-105 hover:-translate-y-2 animate-fade-in-up"
              style={{ animationDelay: `${stat.delay}ms` }}
            >
              <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-500 group-hover:shadow-xl ${stat.bgColor} ${stat.borderColor}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium text-gray-600 ${stat.textColor} transition-colors`}>{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1 transition-colors">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1 transition-colors">{stat.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color} group-hover:scale-110 transition-all duration-500`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full w-full transition-colors duration-500 ${stat.color.split(' ')[0]}`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="mb-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              // { id: 'overview', name: 'Overview', count: allData.length },
              { id: 'proposals', name: 'Proposals', count: proposalsData.length },
              { id: 'quotations', name: 'Quotations', count: quotationsData.length },
            ].map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-300 animate-fade-in-up ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 scale-105'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                style={{ animationDelay: `${500 + index * 100}ms` }}
              >
                {tab.name}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-800 scale-110'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </section>

      {/* Search and Filter Bar */}
      <section className="mb-6 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-pulse-once" />
            <input
              type="text"
              placeholder="Search by policy number, product name, or holder..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 animate-fade-in-up"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-300 animate-fade-in-up hover:scale-105">
            <Filter className="w-5 h-5 text-gray-600" />
            Filter
          </button>
        </div>
      </section>

      {/* Content Sections */}
      {activeTab === 'overview' && (
        <section>
          <div className="space-y-8">
            {/* Proposals Section */}
            {filteredProposals.length > 0 && (
              <InsuranceGrid
                items={filteredProposals}
                title="Your Proposals"
                emptyMessage="You don't have any proposals yet"
                onViewDetails={handleViewDetails}
              />
            )}

            {/* Quotations Section */}
            {filteredQuotations.length > 0 && (
              <InsuranceGrid
                items={filteredQuotations}
                title="Your Quotations"
                emptyMessage="You don't have any quotations yet"
                onViewDetails={handleViewDetails}
              />
            )}

            {/* Empty State */}
            {filteredData.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-blue-200 hover:bg-blue-50/30">
                <FileText className="w-20 h-20 text-gray-400 mx-auto mb-6 transition-colors group-hover:text-blue-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No insurance items found</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">You don't have any active policies, proposals, or quotations yet.</p>
               
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'proposals' && (
        <InsuranceGrid
          items={filteredProposals}
          title="Proposals"
          emptyMessage="You don't have any proposals yet. Start by creating your first quotation."
          onViewDetails={handleViewDetails}
        />
      )}

      {activeTab === 'quotations' && (
        <InsuranceGrid
          items={filteredQuotations}
          title="Quotations"
          emptyMessage="You don't have any quotations yet. Start by creating your first quotation."
          onViewDetails={handleViewDetails}
        />
      )}

      {/* Quick Actions */}
      <section className="mt-6 animate-fade-in-up" style={{ animationDelay: '1200ms' }}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all duration-500 hover:shadow-lg hover:border-blue-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 group-hover:text-blue-700 transition-colors animate-fade-in-up">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                action: 'policy-history',
                icon: <FileText className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />,
                title: 'Policy History',
                description: 'View all transactions',
                bgColor: 'bg-blue-100 group-hover:bg-blue-500',
                borderColor: 'border-gray-200 hover:border-blue-300',
                gradient: 'hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100',
                textColor: 'text-gray-700 group-hover:text-blue-700',
                delay: 100
              },
              {
                action: 'make-payment',
                icon: <Shield className="w-6 h-6 text-green-600 group-hover:text-white transition-colors duration-300" />,
                title: 'Make Payment',
                description: 'Pay your premiums',
                bgColor: 'bg-green-100 group-hover:bg-green-500',
                borderColor: 'border-gray-200 hover:border-green-300',
                gradient: 'hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100',
                textColor: 'text-gray-700 group-hover:text-green-700',
                delay: 200
              },
              {
                action: 'report-claim',
                icon: <AlertTriangle className="w-6 h-6 text-orange-600 group-hover:text-white transition-colors duration-300" />,
                title: 'Report Claim',
                description: 'File insurance claim',
                bgColor: 'bg-orange-100 group-hover:bg-orange-500',
                borderColor: 'border-gray-200 hover:border-orange-300',
                gradient: 'hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-100',
                textColor: 'text-gray-700 group-hover:text-orange-700',
                delay: 300
              }
            ].map((action, index) => (
              <button 
                key={action.action}
                onClick={() => handleQuickAction(action.action)}
                className={`group p-4 border rounded-xl transition-all duration-500 text-center transform hover:scale-105 hover:shadow-lg animate-fade-in-up ${action.borderColor} ${action.gradient}`}
                style={{ animationDelay: `${action.delay}ms` }}
              >
                <div className={`p-3 rounded-lg transition-colors duration-500 w-12 h-12 mx-auto mb-3 flex items-center justify-center ${action.bgColor}`}>
                  {action.icon}
                </div>
                <span className={`text-sm font-semibold transition-colors ${action.textColor}`}>{action.title}</span>
                <p className="text-xs text-gray-500 mt-1 transition-colors">{action.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      {selectedItem && (
        <InsuranceModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Add CSS animations */}
      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes fadeInUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes scaleOut {
          from { 
            opacity: 1;
            transform: scale(1);
          }
          to { 
            opacity: 0;
            transform: scale(0.9);
          }
        }
        @keyframes pulseOnce {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes bounceOnce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            transform: translate3d(0,-8px,0);
          }
          70% {
            transform: translate3d(0,-4px,0);
          }
          90% {
            transform: translate3d(0,-2px,0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-fade-out {
          animation: fadeOut 0.3s ease-in forwards;
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out forwards;
        }
        .animate-scale-out {
          animation: scaleOut 0.3s ease-in forwards;
        }
        .animate-pulse-once {
          animation: pulseOnce 0.5s ease-in-out;
        }
        .animate-bounce-once {
          animation: bounceOnce 1s ease-in-out;
        }
      `}</style>
    </main>
  );
};

export default CustomerDashboard;