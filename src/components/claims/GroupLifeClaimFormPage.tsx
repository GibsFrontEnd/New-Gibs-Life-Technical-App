// features/claims/pages/GroupLifeClaimFormPage.tsx
//@ts-nocheck

import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { 
  ArrowLeft, Save, Loader2, Eye, Pencil,
  FileText, Upload, AlertCircle, Calculator, 
  CheckCircle, Clock, RefreshCw, Plus,
  Building2, User, Calendar, FileCheck, X
} from "lucide-react";
import { Button } from "../../components/UI/new-button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/UI/card";
import { Input } from "../../components/UI/new-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/UI/new-select";
import { Label } from "../../components/UI/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/UI/tabs";
import { Badge } from "../../components/UI/badge";
import { Checkbox } from "../../components/UI/checkbox";
import {
  insertClaimReserve,
  updateClaimReserve,
  fetchClaimReserveById,
  selectCurrentReserve,
  selectCurrentLoading,
  selectCurrentError,
  clearCurrentError,
  type ClaimReserve,
} from "../../features/reducers/claimsReducers/claimsSlice";
import { useToast } from "../../hooks/use-toast";

// ==================== NAIRA ICON COMPONENT ====================

const NairaIcon = ({ className = "w-5 h-5" }) => (
  <span className={`font-bold text-purple-600 ${className}`}>₦</span>
);

// ==================== SECTION HEADER COMPONENT ====================

const SectionHeader: React.FC<{
  title: string;
  icon?: React.ReactNode;
  className?: string;
  badge?: string;
  badgeColor?: "blue" | "green" | "red" | "yellow" | "purple" | "gray";
  rightElement?: React.ReactNode;
  borderColor?: string;
}> = ({ 
  title, 
  icon, 
  className, 
  badge, 
  badgeColor = "blue", 
  rightElement,
  borderColor = "border-gray-200"
}) => {
  const badgeColors = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
    purple: "bg-purple-100 text-purple-700",
    gray: "bg-gray-100 text-gray-700",
  };

  return (
    <div className={`flex items-center justify-between mb-4 pb-3 border-b-2 ${borderColor} ${className || ''}`}>
      <div className="flex items-center gap-3">
        {icon && <span className="text-blue-600">{icon}</span>}
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {badge && (
          <Badge className={`${badgeColors[badgeColor]} px-2 py-0.5 text-xs font-medium`}>
            {badge}
          </Badge>
        )}
      </div>
      {rightElement && (
        <div className="flex items-center gap-2">
          {rightElement}
        </div>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

interface GroupLifeClaimFormPageProps {
  mode: "create" | "edit" | "view";
}

const GroupLifeClaimFormPage: React.FC<GroupLifeClaimFormPageProps> = ({ mode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("details");

  const returnPath = location.state?.returnPath || "/claims/group-life/death-claim";

  const currentReserve = useSelector(selectCurrentReserve);
  const loading = useSelector(selectCurrentLoading);
  const error = useSelector(selectCurrentError);

  // ===== STATE =====
  const [formData, setFormData] = useState<Partial<ClaimReserve>>({
    claimNo: "",
    schemeNo: "",
    debitNo: "",
    memberNo: "",
    notifiedDate: new Date().toISOString().split("T")[0],
    lossDate: new Date().toISOString().split("T")[0],
    courseOfDeath: "",
    totalAmountPayable: 0,
    recoveryFromCoinsurers: 0,
    ourSharePayment: 0,
    ourShareOfPayable: 0,
    recoveryFromReinsurers: 0,
    paymentDelayReasons: "",
    coInsuranceStatus: "",
    // Document checkboxes
    validMeansId: false,
    deathCertificate: false,
    policeReport: false,
    burialCertificate: false,
    recentUtilities: false,
    passport: false,
    // DV Details
    currencyType: "NAIRA",
    exchangeRate: 1,
    adjustedAmountDue: 0,
    ourLiabilityAmount: 0,
    dvSignedDate: "2010-01-01",
    dvSentDate: "2010-01-01",
    // Status
    approval: 0,
    active: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isCreateMode = mode === "create";

  // ===== EFFECTS =====

  // Fetch claim data if in edit or view mode
  useEffect(() => {
    if ((isEditMode || isViewMode) && id) {
      dispatch(fetchClaimReserveById(parseInt(id)));
    }
  }, [isEditMode, isViewMode, id, dispatch]);

  // Populate form when data is loaded
  useEffect(() => {
    if ((isEditMode || isViewMode) && currentReserve) {
      setFormData({
        claimID: currentReserve.claimID,
        claimNo: currentReserve.claimNo || "",
        schemeNo: currentReserve.schemeNo || currentReserve.field1 || "",
        debitNo: currentReserve.debitNo || currentReserve.field2 || "",
        memberNo: currentReserve.memberNo || currentReserve.field3 || "",
        notifiedDate: currentReserve.notifiedDate || new Date().toISOString().split("T")[0],
        lossDate: currentReserve.lossDate || new Date().toISOString().split("T")[0],
        courseOfDeath: currentReserve.courseOfDeath || currentReserve.field4 || "",
        totalAmountPayable: currentReserve.totalAmountPayable || currentReserve.a1 || 0,
        recoveryFromCoinsurers: currentReserve.recoveryFromCoinsurers || currentReserve.a2 || 0,
        ourSharePayment: currentReserve.ourSharePayment || currentReserve.a3 || 0,
        ourShareOfPayable: currentReserve.ourShareOfPayable || currentReserve.a4 || 0,
        recoveryFromReinsurers: currentReserve.recoveryFromReinsurers || currentReserve.a5 || 0,
        paymentDelayReasons: currentReserve.paymentDelayReasons || currentReserve.field5 || "",
        coInsuranceStatus: currentReserve.coInsuranceStatus || currentReserve.field6 || "",
        validMeansId: currentReserve.validMeansId || false,
        deathCertificate: currentReserve.deathCertificate || false,
        policeReport: currentReserve.policeReport || false,
        burialCertificate: currentReserve.burialCertificate || false,
        recentUtilities: currentReserve.recentUtilities || false,
        passport: currentReserve.passport || false,
        currencyType: currentReserve.currencyType || currentReserve.field12 || "NAIRA",
        exchangeRate: currentReserve.exchangeRate || currentReserve.propRate || 1,
        adjustedAmountDue: currentReserve.adjustedAmountDue || currentReserve.a6 || 0,
        ourLiabilityAmount: currentReserve.ourLiabilityAmount || currentReserve.a7 || 0,
        dvSignedDate: currentReserve.dvSignedDate || "2010-01-01",
        dvSentDate: currentReserve.dvSentDate || "2010-01-01",
        approval: currentReserve.approval || 0,
        active: currentReserve.active || 1,
      });
    }
  }, [isEditMode, isViewMode, currentReserve]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearCurrentError());
    };
  }, [dispatch]);

  // ===== HANDLERS =====

  const handleChange = (key: keyof ClaimReserve, value: any) => {
    if (isViewMode) return;
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleCheckboxChange = (key: string, checked: boolean) => {
    if (isViewMode) return;
    setFormData((prev) => ({ ...prev, [key]: checked }));
  };

  const validate = () => {
    if (isViewMode) return true;
    const newErrors: Record<string, string> = {};

    if (!formData.schemeNo?.trim()) {
      newErrors.schemeNo = "Scheme number is required";
    }
    if (!formData.memberNo?.trim()) {
      newErrors.memberNo = "Member number is required";
    }
    if (!formData.lossDate) {
      newErrors.lossDate = "Loss date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isViewMode) return;
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        lossType: "Group Life",
        entryDate: new Date().toISOString(),
        submittedOn: new Date().toISOString(),
        modifiedOn: new Date().toISOString(),
        // Map group life specific fields
        field1: formData.schemeNo,
        field2: formData.debitNo,
        field3: formData.memberNo,
        field4: formData.courseOfDeath,
        field5: formData.paymentDelayReasons,
        field6: formData.coInsuranceStatus,
        field12: formData.currencyType,
        propRate: formData.exchangeRate,
        a1: formData.totalAmountPayable,
        a2: formData.recoveryFromCoinsurers,
        a3: formData.ourSharePayment,
        a4: formData.ourShareOfPayable,
        a5: formData.recoveryFromReinsurers,
        a6: formData.adjustedAmountDue,
        a7: formData.ourLiabilityAmount,
      };

      if (isCreateMode) {
        await dispatch(insertClaimReserve(submitData)).unwrap();
        toast({
          title: "✅ Claim Created",
          description: "Group Life claim has been created successfully!",
          variant: "default",
        });
      } else if (isEditMode && formData.claimID) {
        await dispatch(updateClaimReserve({ 
          id: formData.claimID, 
          data: submitData 
        })).unwrap();
        toast({
          title: "✅ Claim Updated",
          description: "Group Life claim has been updated successfully!",
          variant: "default",
        });
      }
      
      navigate(returnPath);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "Failed to save claim",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(returnPath);
  };

  const getPageTitle = () => {
    if (isViewMode) return "Group Life Claim Details";
    if (isEditMode) return "Edit Group Life Claim";
    return "New Group Life Claim";
  };

  const getPageSubtitle = () => {
    if (isViewMode) return "View complete group life claim details";
    if (isEditMode) return "Update group life claim information";
    return "Fill in the details to create a new group life claim";
  };

  // ===== RENDER =====

  if (loading && (isEditMode || isViewMode)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading claim details...</p>
        <p className="text-gray-400 text-sm mt-2">Please wait while we fetch your data</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium mb-2">Error loading claim</p>
              <p className="text-red-500 text-sm">{error}</p>
              <Button variant="outline" className="mt-4" onClick={handleCancel}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="container mx-auto max-w-7xl">
        {/* ===== HEADER ===== */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleCancel} className="bg-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
              <p className="text-sm text-gray-500 mt-1">{getPageSubtitle()}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {isViewMode && (
              <Button
                onClick={() => {
                  navigate(`/claims/group-life/claim/edit/${id}`, {
                    state: { returnPath: returnPath }
                  });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Claim
              </Button>
            )}
            {!isViewMode && (
              <>
                <Button variant="outline" onClick={handleCancel} className="bg-white w-full md:w-auto">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isCreateMode ? "Creating..." : "Updating..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isCreateMode ? "Create Claim" : "Update Claim"}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ===== STATUS BADGE ===== */}
        {isViewMode && (
          <div className="mb-6 flex items-center gap-3">
            <Badge className="bg-green-100 text-green-700 px-3 py-1">
              <CheckCircle className="w-3 h-3 mr-1" />
              {formData.approval === 2 ? 'Approved' : formData.approval === 1 ? 'Pending' : 'Draft'}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Clock className="w-3 h-3 mr-1" />
              {new Date().toLocaleDateString()}
            </Badge>
          </div>
        )}

        {/* ===== MAIN FORM CARD ===== */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Group Life Claim Management
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="details" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <FileText className="w-4 h-4" />
                  Claim Details
                </TabsTrigger>
                <TabsTrigger value="payment" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <NairaIcon className="w-4 h-4" />
                  Payment Details
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Upload className="w-4 h-4" />
                  Documents
                </TabsTrigger>
              </TabsList>

              {/* ===== TAB 1: CLAIM DETAILS ===== */}
              <TabsContent value="details" className="animate-in slide-in-from-top-3 fade-in duration-300">
                <div className="space-y-6">
                  {/* Loss Details Section */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <SectionHeader 
                      title="Loss Details" 
                      icon={<FileText className="w-4 h-4" />}
                      borderColor="border-blue-200"
                      badge="Required"
                      badgeColor="blue"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="claimNo">Claim No</Label>
                        <Input
                          id="claimNo"
                          value={formData.claimNo || "[AUTO]"}
                          disabled
                          className="bg-gray-50 font-medium"
                        />
                      </div>
                      <div>
                        <Label htmlFor="schemeNo">Scheme No</Label>
                        <Input
                          id="schemeNo"
                          value={formData.schemeNo || ""}
                          onChange={(e) => handleChange("schemeNo", e.target.value)}
                          placeholder="Enter scheme number"
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                        {errors.schemeNo && <p className="text-red-500 text-xs mt-1">{errors.schemeNo}</p>}
                      </div>
                      <div>
                        <Label htmlFor="debitNo">Debit No</Label>
                        <Input
                          id="debitNo"
                          value={formData.debitNo || ""}
                          onChange={(e) => handleChange("debitNo", e.target.value)}
                          placeholder="Enter debit number"
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="processingDate">Processing Date</Label>
                        <Input
                          id="processingDate"
                          value={new Date().toLocaleDateString('en-US', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="memberNo">Member No</Label>
                        <Input
                          id="memberNo"
                          value={formData.memberNo || ""}
                          onChange={(e) => handleChange("memberNo", e.target.value)}
                          placeholder="Enter member number"
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                        {errors.memberNo && <p className="text-red-500 text-xs mt-1">{errors.memberNo}</p>}
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 w-full"
                          disabled={isViewMode}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Get Details
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Payable Amount Section */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <SectionHeader 
                      title="Payable Amount" 
                      icon={<Calculator className="w-4 h-4" />}
                      borderColor="border-blue-200"
                      badge="Required"
                      badgeColor="blue"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Document Checkboxes */}
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium mb-2 block">Valid Documents</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="validMeansId"
                              checked={formData.validMeansId || false}
                              onCheckedChange={(checked) => handleCheckboxChange("validMeansId", checked)}
                              disabled={isViewMode}
                            />
                            <Label htmlFor="validMeansId" className="text-sm cursor-pointer">Valid Means ID</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="deathCertificate"
                              checked={formData.deathCertificate || false}
                              onCheckedChange={(checked) => handleCheckboxChange("deathCertificate", checked)}
                              disabled={isViewMode}
                            />
                            <Label htmlFor="deathCertificate" className="text-sm cursor-pointer">Death Certificate</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="policeReport"
                              checked={formData.policeReport || false}
                              onCheckedChange={(checked) => handleCheckboxChange("policeReport", checked)}
                              disabled={isViewMode}
                            />
                            <Label htmlFor="policeReport" className="text-sm cursor-pointer">Police Report</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="burialCertificate"
                              checked={formData.burialCertificate || false}
                              onCheckedChange={(checked) => handleCheckboxChange("burialCertificate", checked)}
                              disabled={isViewMode}
                            />
                            <Label htmlFor="burialCertificate" className="text-sm cursor-pointer">Burial Certificate</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="recentUtilities"
                              checked={formData.recentUtilities || false}
                              onCheckedChange={(checked) => handleCheckboxChange("recentUtilities", checked)}
                              disabled={isViewMode}
                            />
                            <Label htmlFor="recentUtilities" className="text-sm cursor-pointer">Recent Utilities</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="passport"
                              checked={formData.passport || false}
                              onCheckedChange={(checked) => handleCheckboxChange("passport", checked)}
                              disabled={isViewMode}
                            />
                            <Label htmlFor="passport" className="text-sm cursor-pointer">Passport</Label>
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast({ title: "Recalculated", description: "All values have been recalculated", variant: "default" })}
                          className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                          disabled={isViewMode}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          ReCalc
                        </Button>
                      </div>

                      <div>
                        <Label htmlFor="notifiedDate">Notified Date</Label>
                        <Input
                          id="notifiedDate"
                          type="date"
                          value={formData.notifiedDate || ""}
                          onChange={(e) => handleChange("notifiedDate", e.target.value)}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="courseOfDeath">Course Of Death</Label>
                        <Input
                          id="courseOfDeath"
                          value={formData.courseOfDeath || ""}
                          onChange={(e) => handleChange("courseOfDeath", e.target.value)}
                          placeholder="Enter course of death"
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lossDate">Loss (Death) Date</Label>
                        <Input
                          id="lossDate"
                          type="date"
                          value={formData.lossDate || ""}
                          onChange={(e) => handleChange("lossDate", e.target.value)}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                        {errors.lossDate && <p className="text-red-500 text-xs mt-1">{errors.lossDate}</p>}
                      </div>
                      <div>
                        <Label htmlFor="coInsuranceStatus">Co-Insurance Status</Label>
                        <Select
                          value={formData.coInsuranceStatus || ""}
                          onValueChange={(value) => handleChange("coInsuranceStatus", value)}
                          disabled={isViewMode}
                        >
                          <SelectTrigger className={isViewMode ? "bg-gray-50" : ""}>
                            <SelectValue placeholder="- Select -" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="None">None</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="totalAmountPayable">Total Amount Payable</Label>
                        <Input
                          id="totalAmountPayable"
                          type="number"
                          step="0.01"
                          value={formData.totalAmountPayable || 0}
                          onChange={(e) => handleChange("totalAmountPayable", parseFloat(e.target.value) || 0)}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="recoveryFromCoinsurers">Recovery From Coinsurers</Label>
                        <Input
                          id="recoveryFromCoinsurers"
                          type="number"
                          step="0.01"
                          value={formData.recoveryFromCoinsurers || 0}
                          onChange={(e) => handleChange("recoveryFromCoinsurers", parseFloat(e.target.value) || 0)}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ourSharePayment">Our Share Payment</Label>
                        <Input
                          id="ourSharePayment"
                          type="number"
                          step="0.01"
                          value={formData.ourSharePayment || 0}
                          onChange={(e) => handleChange("ourSharePayment", parseFloat(e.target.value) || 0)}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ourShareOfPayable">Our Share Of Payable</Label>
                        <Input
                          id="ourShareOfPayable"
                          type="number"
                          step="0.01"
                          value={formData.ourShareOfPayable || 0}
                          onChange={(e) => handleChange("ourShareOfPayable", parseFloat(e.target.value) || 0)}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="recoveryFromReinsurers">Recovery From Reinsurers</Label>
                        <Input
                          id="recoveryFromReinsurers"
                          type="number"
                          step="0.01"
                          value={formData.recoveryFromReinsurers || 0}
                          onChange={(e) => handleChange("recoveryFromReinsurers", parseFloat(e.target.value) || 0)}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="paymentDelayReasons">Payment Delay Reasons</Label>
                        <Input
                          id="paymentDelayReasons"
                          value={formData.paymentDelayReasons || ""}
                          onChange={(e) => handleChange("paymentDelayReasons", e.target.value)}
                          placeholder="Enter payment delay reasons"
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                    </div>
                  </div>

                  {/* DV Details Section */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <SectionHeader 
                      title="DV Details" 
                      icon={<NairaIcon className="w-4 h-4" />}
                      borderColor="border-purple-200"
                      badge="Exchange"
                      badgeColor="purple"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="currencyType">Currency Type</Label>
                        <Select
                          value={formData.currencyType || "NAIRA"}
                          onValueChange={(value) => handleChange("currencyType", value)}
                          disabled={isViewMode}
                        >
                          <SelectTrigger className={isViewMode ? "bg-gray-50" : ""}>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NAIRA">NAIRA</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="exchangeRate">Exchange Rate</Label>
                        <Input
                          id="exchangeRate"
                          type="number"
                          step="0.01"
                          value={formData.exchangeRate || 1}
                          onChange={(e) => handleChange("exchangeRate", parseFloat(e.target.value) || 1)}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="adjustedAmountDue">Adjusted Amount Due</Label>
                        <Input
                          id="adjustedAmountDue"
                          type="number"
                          step="0.01"
                          value={formData.adjustedAmountDue || 0}
                          onChange={(e) => handleChange("adjustedAmountDue", parseFloat(e.target.value) || 0)}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ourLiabilityAmount">Our Liability Amount (Local)</Label>
                        <Input
                          id="ourLiabilityAmount"
                          type="number"
                          step="0.01"
                          value={formData.ourLiabilityAmount || 0}
                          onChange={(e) => handleChange("ourLiabilityAmount", parseFloat(e.target.value) || 0)}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dvSignedDate">DV Signed Date</Label>
                        <Input
                          id="dvSignedDate"
                          type="date"
                          value={formData.dvSignedDate || ""}
                          onChange={(e) => handleChange("dvSignedDate", e.target.value)}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dvSentDate">DV Sent Date</Label>
                        <Input
                          id="dvSentDate"
                          type="date"
                          value={formData.dvSentDate || ""}
                          onChange={(e) => handleChange("dvSentDate", e.target.value)}
                          disabled={isViewMode}
                          className={isViewMode ? "bg-gray-50" : ""}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ===== TAB 2: PAYMENT DETAILS ===== */}
              <TabsContent value="payment" className="animate-in slide-in-from-top-3 fade-in duration-300">
                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <SectionHeader 
                      title="Payment Summary" 
                      icon={<NairaIcon className="w-4 h-4" />}
                      borderColor="border-green-200"
                      badge="Summary"
                      badgeColor="green"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label className="text-lg font-bold">Total Amount Payable</Label>
                        <Input
                          value={`₦ ${(formData.totalAmountPayable || 0).toFixed(2)}`}
                          disabled
                          className="bg-green-50 font-bold text-green-700 text-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ===== TAB 3: DOCUMENTS ===== */}
              <TabsContent value="documents" className="animate-in slide-in-from-top-3 fade-in duration-300">
                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <SectionHeader 
                      title="Upload Documents" 
                      icon={<Upload className="w-4 h-4" />}
                      borderColor="border-blue-200"
                      badge="Upload"
                      badgeColor="blue"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fileUpload">Upload</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="fileUpload"
                            type="file"
                            disabled={isViewMode}
                            className={isViewMode ? "bg-gray-50" : ""}
                          />
                          <Button
                            disabled={isViewMode}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <SectionHeader 
                      title="HELP" 
                      icon={<AlertCircle className="w-4 h-4" />}
                      borderColor="border-blue-300"
                      badge="Important"
                      badgeColor="blue"
                    />
                    <ul className="text-sm text-blue-700 space-y-1 list-disc pl-4 mt-2">
                      <li>Make sure you click on ADD button to add the record to grid-view before you click on SAVE button</li>
                      <li>Make sure you click on choose file button then click ADD DOCUMENT button if you have document you want to upload.</li>
                      <li>Verify all added records before you click on SAVE button.</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroupLifeClaimFormPage;