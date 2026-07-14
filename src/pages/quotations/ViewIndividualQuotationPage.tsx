import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  User, 
  Calculator, 
  FileText, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle,
  Loader2,
  RefreshCw,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "../../components/UI/card";
import { Input } from "../../components/UI/new-input";
import { Button } from "../../components/UI/new-button";
import { 
  getSingleQuotation, 
  getBranches, 
  type Branch 
} from "../../types/quotation";

const ViewIndividualQuotationPage = () => {
  const { pathname } = useLocation();
  // URL: /quotations/view-quote/{quoteNo}
  const parts = pathname.split("/");
  const quoteNo = parts[parts.length - 1];
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<any>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!quoteNo) return;
      setIsLoading(true);
      setError(null);
      try {
        const [quoteData, branchesData] = await Promise.all([
          getSingleQuotation(quoteNo),
          getBranches()
        ]);
        
        // The API returns an array or single object? User response shows a single object.
        // If it's an array, take the first one.
        const data = Array.isArray(quoteData) ? quoteData[0] : quoteData;
        setQuotation(data);
        setBranches(branchesData);
      } catch (err: any) {
        console.error("Fetch Error:", err);
        setError(err.message || "Failed to fetch quotation details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [quoteNo]);

  const formatCurrency = (amount: any) => {
    const val = Number(amount);
    if (isNaN(val)) return "₦ 0.00";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(val);
  };

  const fmtDate = (dateStr: string) => {
    if (!dateStr || dateStr === "null") return "N/A";
    try {
      return format(new Date(dateStr), "dd MMM yyyy");
    } catch {
      return dateStr;
    }
  };

  const getBranchName = (id: string) => {
    return branches.find(b => b.branchID === id)?.description || id || "N/A";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#8c4b8d]" />
        <p className="text-gray-500 font-medium">Loading quotation details...</p>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-block">
          {error || "Quotation not found"}
        </div>
        <div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isInvestment = quotation.tag === "B";
  const title = isInvestment ? "Investment Link Quote" : "Traditional Quote";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8c4b8d]">
                Quotations
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium uppercase">
                {quotation.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Eye className="w-6 h-6 text-[#8c4b8d]" />
              {title} Details
            </h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Quote Number</p>
          <p className="text-xl font-black text-[#8c4b8d] tracking-tight">{quotation.quoteNo}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Client Information Card */}
          <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm overflow-hidden border-t-4 border-t-[#8c4b8d]">
            <CardHeader className="pb-4 bg-gray-50/50">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <User className="w-5 h-5 text-[#8c4b8d]" />
                <span>Client Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Surname
                    </label>
                    <Input value={quotation.surName} readOnly className="bg-gray-50/50 border-gray-100 font-medium" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      First Name
                    </label>
                    <Input value={quotation.otherNames} readOnly className="bg-gray-50/50 border-gray-100 font-medium" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Input value={fmtDate(quotation.dateofBirth)} readOnly className="bg-gray-50/50 border-gray-100 font-medium pl-10" />
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Gender
                    </label>
                    <Input value={quotation.sex || "N/A"} readOnly className="bg-gray-50/50 border-gray-100 font-medium" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Branch
                    </label>
                    <div className="relative">
                      <Input value={getBranchName(quotation.brCode)} readOnly className="bg-gray-50/50 border-gray-100 font-medium pl-10" />
                      <MapPin className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Input value={quotation.email} readOnly className="bg-gray-50/50 border-gray-100 font-medium pl-10" />
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Input value={quotation.mobilePhone} readOnly className="bg-gray-50/50 border-gray-100 font-medium pl-10" />
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Status
                    </label>
                    <div className="relative">
                      <Input value={quotation.status} readOnly className="bg-gray-50/50 border-gray-100 font-bold text-blue-600 capitalize pl-10" />
                      <CheckCircle className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quotation Information Card */}
          <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm overflow-hidden border-t-4 border-t-[#8c4b8d]">
            <CardHeader className="pb-4 bg-gray-50/50">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Calculator className="w-5 h-5 text-[#8c4b8d]" />
                <span>Quotation Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Product Code
                    </label>
                    <Input value={quotation.coverCode} readOnly className="bg-gray-50/50 border-gray-100 font-bold text-blue-700" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Frequency of Payment
                    </label>
                    <Input value={quotation.cardNo || "N/A"} readOnly className="bg-gray-50/50 border-gray-100 font-medium" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Duration (Years)
                    </label>
                    <Input value={quotation.duration} readOnly className="bg-gray-50/50 border-gray-100 font-medium" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Standard Premium
                    </label>
                    <Input value={formatCurrency(quotation.premium1)} readOnly className="bg-gray-50/50 border-gray-100 font-bold" />
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Quotation Date
                  </label>
                  <p className="font-medium text-gray-800">{fmtDate(quotation.submittedOn)}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Start Date
                  </label>
                  <p className="font-medium text-gray-800">{fmtDate(quotation.startDate)}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Maturity Date
                  </label>
                  <p className="font-medium text-gray-800">{fmtDate(quotation.maturityDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary Card */}
        <div className="lg:col-span-1">
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm sticky top-6 border-t-4 border-t-[#8c4b8d]">
            <CardHeader className="pb-4 bg-gray-50/50">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <FileText className="w-5 h-5 text-[#8c4b8d]" />
                <span>Financial Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Annual Premium:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(quotation.premium1)}</span>
                </div>
                {quotation.basicPremium != null && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Basic Premium:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(quotation.basicPremium)}</span>
                  </div>
                )}
                {Number(quotation.loading) > 0 ? (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Loading:</span>
                    <span className="font-bold text-red-500">+{formatCurrency(quotation.loading)}</span>
                  </div>
                ) : null}
                {Number(quotation.a1) > 0 ? (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Extra Rate Cost:</span>
                    <span className="font-bold text-red-500">+{formatCurrency(quotation.a1)}</span>
                  </div>
                ) : null}

                {quotation.premium2 != null && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">1st Maturity Benefit:</span>
                    <span className="font-bold text-green-600">{formatCurrency(quotation.premium2)}</span>
                  </div>
                )}
                {quotation.premium3 != null && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">2nd Maturity Benefit:</span>
                    <span className="font-bold text-green-600">{formatCurrency(quotation.premium3)}</span>
                  </div>
                )}
                {quotation.intrestRate != null && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">3rd Maturity Benefit:</span>
                    <span className="font-bold text-green-600">{formatCurrency(quotation.intrestRate)}</span>
                  </div>
                )}
                
                <div className="pt-4 border-t border-dashed border-gray-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-bold uppercase tracking-tighter">Life Cover</span>
                    <span className="text-lg font-bold text-[#8c4b8d]">{formatCurrency(quotation.sumAssured)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-bold uppercase tracking-tighter">Sum Assured</span>
                    <span className="text-xl font-black text-[#8c4b8d]">{formatCurrency(quotation.sumAssured)}</span>
                  </div>
                </div>

                <div className="p-4 bg-[#8c4b8d]/5 rounded-xl border border-[#8c4b8d]/10 mt-6">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-gray-500 font-bold uppercase mb-1">Total Premium Payable</span>
                    <span className="text-2xl font-black text-[#8c4b8d] font-mono">
                      {formatCurrency(quotation.totalPremium)}
                    </span>
                    <p className="text-[10px] text-[#8c4b8d] font-medium mt-1">
                      {quotation.cardNo || "Annual"} Payment
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg text-[11px] text-blue-700">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <p>This quotation was submitted by <strong>{quotation.submittedBy || 'system'}</strong> on {fmtDate(quotation.submittedOn)}.</p>
                </div>
                <Button 
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-6 font-semibold"
                  onClick={() => window.print()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Print Quotation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ViewIndividualQuotationPage;
