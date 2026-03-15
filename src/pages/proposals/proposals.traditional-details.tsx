//@ts-nocheck
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card";
import {
  AlertCircle,
  CalendarIcon,
  DollarSign,
  FileText,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  Users,
  CheckCircle,
  XCircle,
  Heart,
  Scale,
  Briefcase,
  IdCard,
  ArrowRight, // Added missing import
  Plus, // Added for beneficiary add button
  AlertTriangle, // Added for allocation warning
  UserCheck,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/ui-utilities";
import { Separator } from "@/components/UI/separator";
import { useAppDispatch, useAppSelector } from "@/hooks/use-apps";
import {
  clearMessages,
  clearProposal,
  editProposal,
  getBranches,
  getProducts,
  getProposal,
  selectProposals,
} from "@/features/reducers/proposalReducers/proposalSlice";
import {
  getBeneficiariesByProposal,
  selectBeneficiaries,
  clearMessages as clearBeneficiaryMessages,
} from "@/features/reducers/beneficiariesReducers/beneficiariesSlice";
import { Alert, AlertDescription } from "@/components/UI/alert";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/UI/badge";
import { Label } from "@/components/UI/label";
import { Textarea } from "@/components/UI/textarea";
import { Input } from "@/components/UI/new-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/UI/new-select";
import { Button } from "@/components/UI/new-button";
import type { TradProposalFormData } from "@/types/proposals";
import { DOBCalendar } from "@/components/UI/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/UI/popover";
import { format } from "date-fns";
import { cn } from "@/utils/class-names";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/UI/dropdown";
import { useToast } from "@/components/UI/use-toast";
import DocumentManager from "../../components/proposals/DocumentManager";

const TradProposalDetail = () => {
  const { toast } = useToast();
  const { proposalId } = useParams();
  const dispatch = useAppDispatch();
  const {
    branches,
    products,
    proposal: data,
    success,
    loading,
    error,
  } = useAppSelector(selectProposals);

  // Beneficiaries selector
  const {
    beneficiaries: beneficiariesData,
    loading: beneficiariesLoading,
    error: beneficiariesError,
  } = useAppSelector(selectBeneficiaries);

  useEffect(() => {
    if (proposalId) {
      dispatch(clearProposal());
      dispatch(getProposal({ type: "trad", proposalNo: proposalId }));
      // Fetch beneficiaries for this proposal
      dispatch(getBeneficiariesByProposal(proposalId));
    }
  }, [dispatch, proposalId]);

  useEffect(() => {
    let successTimer: NodeJS.Timeout | null = null;
    let errorTimer: NodeJS.Timeout | null = null;

    if (success.editProposal) {
      dispatch(clearMessages());
      // Success toast with 1-second delay
      successTimer = setTimeout(() => {
        toast({
          title: "Success",
          description: "Proposal updated successfully",
          variant: "success",
        });
      }, 1000);
      setIsEditing(false);
    } else if (error.editProposal) {
      // Error toast with 1-second delay
      errorTimer = setTimeout(() => {
        toast({
          title: "Error",
          description: "Failed to update proposal! Please try again.",
          variant: "destructive",
        });
      }, 1000);
      console.log("Proposal update error:", error.editProposal);
    }

    // Cleanup function
    return () => {
      if (successTimer) clearTimeout(successTimer);
      if (errorTimer) clearTimeout(errorTimer);
    };
  }, [dispatch, error.editProposal, success.editProposal, toast]);

  useEffect(() => {
    dispatch(clearMessages());
    dispatch(getProducts());
    dispatch(getBranches());
  }, [dispatch]);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const toggleDropdown = () => {
    setOpen((prev) => !prev);
  };

  const filteredOptions = products
    .filter(
      (product) =>
        product.productName.toLowerCase().includes(search.toLowerCase()) &&
        product.riskID === "B"
    )
    .slice(0, 5);

  const [isEditing, setIsEditing] = useState(false);

  // Initialize editData properly with all fields matching API structure
  const initializeEditData = (): TradProposalFormData => {
    if (!data) {
      return {
        // All fields that match the API request body
        title: "",
        assuredCode: "",
        surName: "",
        otherNames: "",
        fullName: "",
        address: "",
        state: "",
        landphone: "",
        mobilePhone: "",
        email: "",
        nationalID: "",
        occupation: "",
        gender: "",
        dateOfBirth: new Date(),
        duration: 0,
        frequency: "Single",
        remark: "",
        regularSaving: 0,
        productCode: "",
        firstPremium: 0,
        sumAssured: 0,
        maritalStatus: "",
        country: "",
        agentCode: "",
        agentDescription: "",
        meansID: "",
        idNo: "",
        chronicIllness: "",
        riskID: "B", // Default for traditional
        mop: "",
        paymentType: "",
        paymentAmount: 0,
        dateofpayment: new Date(),
        receiptNo: "",
        bankName: "",
        accountNo: "",
        
        // Additional fields for traditional proposals
        placeOfBirth: "",
        spouseName: "",
        govtOfOrigin: "",
        resAddress: "",
        landMark: "",
        nin: "",
        bvn: "",
        employmentType: "",
        employerName: "",
        employerAddress: "",
        employerNumber: "",
        employerEmail: "",
        dateEmployed: new Date(),
        height: "",
        weight: "",
        sport: "",
        infirmity: "",
        stroke: "",
        treatment: "",
        workAbesent: "",
        smoke: "",
        aviation: "",
        religion: "",
        designation: "",
        issueDate: new Date(),
        expiryDate: new Date(),
      };
    }

    // Helper function to parse dates
    const parseDate = (dateString: string | undefined): Date => {
      if (!dateString) return new Date();
      try {
        const date = new Date(dateString);
        // Check if date is valid
        return isNaN(date.getTime()) ? new Date() : date;
      } catch {
        return new Date();
      }
    };

    return {
      // Map all backend fields to API fields
      title: data?.title || "",
      assuredCode: data?.assuredCode || "",
      surName: data?.surName || "",
      otherNames: data?.otherNames || "",
      fullName: data?.fullName || "",
      address: data?.address || "",
      state: data?.state || "",
      landphone: data?.landphone || "",
      mobilePhone: data?.mobilePhone || "",
      email: data?.email || "",
      nationalID: data?.nationalID || "",
      occupation: data?.occupation || "",
      gender: data?.sex || "",
      dateOfBirth: parseDate(data?.dateofBirth),
      duration: data?.duration || 0,
      frequency: "Single",
      remark: data?.remarks || "",
      regularSaving: 0,
      productCode: data?.coverCode || "",
      firstPremium: data?.premium1 || 0,
      sumAssured: data?.sumAssured || 0,
      maritalStatus: data?.maritalStatus || "",
      country: data?.country || "",
      agentCode: data?.agentcode || "",
      agentDescription: data?.agentDescription || "",
      meansID: data?.meansID || "",
      idNo: data?.idNo || "",
      chronicIllness: data?.chronicIllness || "",
      riskID: "B",
      mop: data?.mop || "",
      paymentType: data?.paymentType || "",
      paymentAmount: data?.paymentAmount || 0,
      dateofpayment: parseDate(data?.dateofpayment),
      receiptNo: data?.receiptNo || "",
      bankName: data?.bankName || "",
      accountNo: data?.accountNo || "",
      
      // Map new fields
      placeOfBirth: data?.placeOfBirth || "",
      spouseName: data?.spouseName || "",
      govtOfOrigin: data?.govtofOrigin || "",
      resAddress: data?.residentialAddress || data?.address || "",
      landMark: data?.landMark || "",
      nin: data?.nin || "",
      bvn: data?.bvn || "",
      employmentType: data?.employmentType || "",
      employerName: data?.employerName || "",
      employerAddress: data?.employerAddress || "",
      employerNumber: data?.employerNumber || "",
      employerEmail: data?.employerEmail || "",
      dateEmployed: parseDate(data?.dateEmployed),
      height: data?.height || "",
      weight: data?.weight || "",
      sport: data?.sport || "",
      infirmity: data?.infirmity || "",
      stroke: data?.stroke || "",
      treatment: data?.treatment || "",
      workAbesent: data?.workAbesent || "",
      smoke: data?.smoke || "",
      aviation: data?.aviation || "",
      religion: data?.religion || "",
      designation: data?.designation || "",
      issueDate: parseDate(data?.issueDate),
      expiryDate: parseDate(data?.expiryDate),
    };
  };

  const [editData, setEditData] = useState<TradProposalFormData>(initializeEditData());

  // Update editData when data loads
  useEffect(() => {
    if (data && !isEditing) {
      setEditData(initializeEditData());
    }
  }, [data]);

  const handleInputChange = (
    field: keyof TradProposalFormData,
    value: string | number | Date | undefined
  ) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    if (!proposalId) {
      console.error("Cannot update proposal: No proposal number available");
      return;
    }
    
    // Prepare data for API - convert dates to strings
    const payload = {
      ...editData,
      // Ensure required fields have values
      duration: editData.duration || 1,
      regularSaving: editData.regularSaving || 10000,
      firstPremium: editData.firstPremium || 10000,
      sumAssured: editData.sumAssured || 1000000,
      paymentAmount: editData.paymentAmount || 1000000,
      
      // Convert dates to ISO strings (matching API format)
      dateOfBirth: editData.dateOfBirth.toISOString(),
      dateofpayment: editData.dateofpayment?.toISOString() || new Date().toISOString(),
      dateEmployed: editData.dateEmployed?.toISOString() || new Date().toISOString(),
      issueDate: editData.issueDate?.toISOString() || new Date().toISOString(),
      expiryDate: editData.expiryDate?.toISOString() || new Date().toISOString(),
      
      // Ensure required string fields
      frequency: editData.frequency || "Single",
      productCode: editData.productCode || "DEL",
      riskID: editData.riskID || "B",
      chronicIllness: editData.chronicIllness || "string",
      mop: editData.mop || "string",
      paymentType: editData.paymentType || "string",
      receiptNo: editData.receiptNo || "string",
      bankName: editData.bankName || "string",
      accountNo: editData.accountNo || "string",
      placeOfBirth: editData.placeOfBirth || "string",
      spouseName: editData.spouseName || "string",
      govtOfOrigin: editData.govtOfOrigin || "string",
      resAddress: editData.resAddress || "string",
      landMark: editData.landMark || "string",
      nin: editData.nin || "string",
      bvn: editData.bvn || "string",
      employmentType: editData.employmentType || "string",
      employerName: editData.employerName || "string",
      employerAddress: editData.employerAddress || "string",
      employerNumber: editData.employerNumber || "string",
      employerEmail: editData.employerEmail || "string",
      height: editData.height || "string",
      weight: editData.weight || "string",
      sport: editData.sport || "string",
      infirmity: editData.infirmity || "string",
      stroke: editData.stroke || "string",
      treatment: editData.treatment || "string",
      workAbesent: editData.workAbesent || "string",
      smoke: editData.smoke || "string",
      aviation: editData.aviation || "string",
      remark: editData.remark || "string",
      religion: editData.religion || "string",
      designation: editData.designation || "string",
    };
    
    // Remove any undefined or null values
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== undefined && v !== null)
    );
    
    console.log("Sending payload to API:", JSON.stringify(cleanPayload, null, 2));
    
    dispatch(
      editProposal({ 
        type: "trad", 
        proposalNo: proposalId, 
        body: cleanPayload 
      })
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(initializeEditData());
  };

  // Beneficiaries Section Component
  const BeneficiariesSection = () => {
    if (beneficiariesLoading.getBeneficiariesByProposal) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Beneficiaries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading beneficiaries...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (beneficiariesError.getBeneficiariesByProposal) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Beneficiaries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load beneficiaries:{" "}
                {beneficiariesError.getBeneficiariesByProposal}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    const beneficiaries = beneficiariesData.items || [];

    if (beneficiaries.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Beneficiaries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Beneficiaries
              </h3>
              <p className="text-gray-500 mb-4">
                No beneficiaries have been added to this proposal yet.
              </p>
              <Button
                onClick={() => {
                  toast({
                    title: "Add Beneficiary",
                    description:
                      "Use the beneficiaries section to add new beneficiaries to this proposal.",
                    variant: "default",
                  });
                }}
                variant="outline"
              >
                Add Beneficiary
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    const totalAllocation = beneficiaries.reduce((sum, b) => sum + b.percentage, 0);
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Beneficiaries ({beneficiaries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {/* Only the list of beneficiaries scrolls */}
            <div className="max-h-[300px] overflow-y-auto">
              <div className="space-y-4 pr-2">
                {beneficiaries.map((beneficiary, index) => (
                  <div
                    key={beneficiary.transID || index}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {beneficiary.surname} {beneficiary.otherNames}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {beneficiary.relation} • {beneficiary.sex} •{" "}
                          {beneficiary.age} years
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            beneficiary.type === "PRIMARY" ? "default" : "secondary"
                          }
                        >
                          {beneficiary.type}
                        </Badge>
                        <Badge variant="outline">{beneficiary.percentage}%</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Date of Birth</p>
                        <p className="font-medium">{formatDate(beneficiary.dob)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Address</p>
                        <p className="font-medium">{beneficiary.address}</p>
                      </div>
                    </div>

                    {beneficiary.remark && (
                      <div className="mt-3">
                        <p className="text-gray-600 text-sm">Remark</p>
                        <p className="text-sm">{beneficiary.remark}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Added: {formatDate(beneficiary.submittedOn)}</span>
                        {beneficiary.modifiedBy && (
                          <span>
                            Modified: {formatDate(beneficiary.modifiedOn)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {beneficiary.active === 1 ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs">Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span className="text-xs">Inactive</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary (always visible, doesn't scroll) */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                Beneficiary Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Total Beneficiaries</p>
                  <p className="font-semibold">{beneficiaries.length}</p>
                </div>
                <div>
                  <p className="text-blue-700">Primary</p>
                  <p className="font-semibold">
                    {beneficiaries.filter((b) => b.type === "PRIMARY").length}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Contingent</p>
                  <p className="font-semibold">
                    {beneficiaries.filter((b) => b.type === "CONTINGENT").length}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Total Allocation</p>
                  <p className="font-semibold">
                    {totalAllocation}%
                    {totalAllocation !== 100 && (
                      <Badge variant="outline" className="ml-2 text-amber-700 border-amber-200 bg-amber-50">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Incomplete
                      </Badge>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading.getProposal) {
    return (
      <Alert variant="default">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Fetching Proposals
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Could not fetch traditional proposal detail
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Traditional Proposal Details
          </h1>
          <p className="text-gray-600 mt-1">Proposal No: {data.proposalNo}</p>
        </div>
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Edit Traditional Proposal
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                loading={loading.editProposal}
                onClick={handleSave}
                className="w-[250px]"
                size="sm"
              >
                Update Traditional Proposal
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {isEditing ? (
        // Edit Form - UPDATED WITH ALL FIELDS MATCHING API
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Select
                      value={editData.title}
                      onValueChange={(value) =>
                        handleInputChange("title", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select title" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mr">Mr</SelectItem>
                        <SelectItem value="Mrs">Mrs</SelectItem>
                        <SelectItem value="Miss">Miss</SelectItem>
                        <SelectItem value="Dr">Dr</SelectItem>
                        <SelectItem value="Prof">Prof</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="assuredCode">Assured Code</Label>
                    <Input
                      id="assuredCode"
                      value={editData.assuredCode}
                      onChange={(e) =>
                        handleInputChange("assuredCode", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="productCode">Product Code</Label>
                    <DropdownMenu>
                      <button
                        className="w-full px-4 py-2 border border-border rounded-md bg-white text-left"
                        onClick={toggleDropdown}
                        type="button"
                      >
                        {editData.productCode
                          ? editData.productCode
                          : "Select a product"}
                      </button>

                      <DropdownMenuContent
                        className="w-full p-2 bg-white border border-border rounded-md shadow-md"
                        open={open}
                        setOpen={setOpen}
                      >
                        <Input
                          placeholder="Search for a product"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="mb-2 w-full px-2 py-1 border border-border rounded-md"
                          autoFocus
                        />
                        {filteredOptions.map((product) => (
                          <DropdownMenuItem
                            key={product.productID}
                            onClick={() => {
                              handleInputChange(
                                "productCode",
                                product.productID
                              );
                              setOpen(false);
                              setSearch("");
                            }}
                          >
                            <button className="cursor-pointer px-4 py-2 rounded-md">
                              {product.productName}
                            </button>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div>
                    <Label htmlFor="riskID">Risk ID</Label>
                    <Input
                      id="riskID"
                      value={editData.riskID}
                      onChange={(e) =>
                        handleInputChange("riskID", e.target.value)
                      }
                      placeholder="B"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="surName">Surname</Label>
                    <Input
                      id="surName"
                      value={editData.surName}
                      onChange={(e) =>
                        handleInputChange("surName", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="otherNames">Other Names</Label>
                    <Input
                      id="otherNames"
                      value={editData.otherNames}
                      onChange={(e) =>
                        handleInputChange("otherNames", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={editData.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={editData.gender}
                      onValueChange={(value) =>
                        handleInputChange("gender", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editData.dateOfBirth && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editData.dateOfBirth
                            ? format(editData.dateOfBirth, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <DOBCalendar
                          mode="single"
                          selected={editData.dateOfBirth}
                          onSelect={(date) => handleInputChange("dateOfBirth", date || new Date())}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select
                      value={editData.maritalStatus}
                      onValueChange={(value) =>
                        handleInputChange("maritalStatus", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={editData.occupation}
                      onChange={(e) =>
                        handleInputChange("occupation", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="religion">Religion</Label>
                    <Select
                      value={editData.religion}
                      onValueChange={(value) => handleInputChange("religion", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select religion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Christian">Christian</SelectItem>
                        <SelectItem value="Islam">Islam</SelectItem>
                        <SelectItem value="Traditional">Traditional</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="placeOfBirth">Place of Birth</Label>
                    <Input
                      id="placeOfBirth"
                      value={editData.placeOfBirth}
                      onChange={(e) => handleInputChange("placeOfBirth", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="spouseName">Spouse Name</Label>
                    <Input
                      id="spouseName"
                      value={editData.spouseName}
                      onChange={(e) => handleInputChange("spouseName", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      value={editData.designation}
                      onChange={(e) => handleInputChange("designation", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="govtOfOrigin">Government of Origin</Label>
                    <Input
                      id="govtOfOrigin"
                      value={editData.govtOfOrigin}
                      onChange={(e) => handleInputChange("govtOfOrigin", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nationalID">National ID</Label>
                    <Input
                      id="nationalID"
                      value={editData.nationalID}
                      onChange={(e) => handleInputChange("nationalID", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={editData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="resAddress">Residential Address</Label>
                  <Textarea
                    id="resAddress"
                    value={editData.resAddress}
                    onChange={(e) =>
                      handleInputChange("resAddress", e.target.value)
                    }
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={editData.state}
                      onChange={(e) =>
                        handleInputChange("state", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={editData.country}
                      onChange={(e) =>
                        handleInputChange("country", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="landphone">Land Phone</Label>
                    <Input
                      id="landphone"
                      value={editData.landphone}
                      onChange={(e) =>
                        handleInputChange("landphone", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobilePhone">Mobile Phone</Label>
                    <Input
                      id="mobilePhone"
                      value={editData.mobilePhone}
                      onChange={(e) =>
                        handleInputChange("mobilePhone", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="landMark">Landmark</Label>
                    <Input
                      id="landMark"
                      value={editData.landMark}
                      onChange={(e) =>
                        handleInputChange("landMark", e.target.value)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Policy Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Policy Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (Years)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={editData.duration}
                      onChange={(e) =>
                        handleInputChange(
                          "duration",
                          Number.parseInt(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={editData.frequency}
                      onValueChange={(value) =>
                        handleInputChange("frequency", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Half-Yearly">Half-Yearly</SelectItem>
                        <SelectItem value="Annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="regularSaving">Regular Saving</Label>
                    <Input
                      id="regularSaving"
                      type="number"
                      step="0.01"
                      value={editData.regularSaving}
                      onChange={(e) =>
                        handleInputChange(
                          "regularSaving",
                          Number.parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="firstPremium">First Premium</Label>
                    <Input
                      id="firstPremium"
                      type="number"
                      step="0.01"
                      value={editData.firstPremium}
                      onChange={(e) =>
                        handleInputChange(
                          "firstPremium",
                          Number.parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="sumAssured">Sum Assured</Label>
                    <Input
                      id="sumAssured"
                      type="number"
                      step="0.01"
                      value={editData.sumAssured}
                      onChange={(e) =>
                        handleInputChange(
                          "sumAssured",
                          Number.parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Information */}
            <Card>
              <CardHeader>
               <CardTitle className="flex items-center gap-2">
                                           <Heart className="h-5 w-5" />
                                           Health Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      value={editData.height}
                      onChange={(e) =>
                        handleInputChange("height", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      value={editData.weight}
                      onChange={(e) =>
                        handleInputChange("weight", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="sport">Sport Engagement</Label>
                    <Input
                      id="sport"
                      value={editData.sport}
                      onChange={(e) =>
                        handleInputChange("sport", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="infirmity">Bodily Infirmity</Label>
                    <Select
                      value={editData.infirmity}
                      onValueChange={(value) =>
                        handleInputChange("infirmity", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YES">YES</SelectItem>
                        <SelectItem value="NO">NO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="stroke">Medical Conditions</Label>
                    <Input
                      id="stroke"
                      value={editData.stroke}
                      onChange={(e) =>
                        handleInputChange("stroke", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="treatment">Current Treatment</Label>
                    <Select
                      value={editData.treatment}
                      onValueChange={(value) =>
                        handleInputChange("treatment", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YES">YES</SelectItem>
                        <SelectItem value="NO">NO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="workAbesent">Work Absence (Last 5 Years)</Label>
                    <Input
                      id="workAbesent"
                      value={editData.workAbesent}
                      onChange={(e) =>
                        handleInputChange("workAbesent", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="smoke">Habits (Smoking/Alcohol)</Label>
                    <Input
                      id="smoke"
                      value={editData.smoke}
                      onChange={(e) =>
                        handleInputChange("smoke", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="aviation">Aviation Engagement</Label>
                    <Select
                      value={editData.aviation}
                      onValueChange={(value) =>
                        handleInputChange("aviation", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YES">YES</SelectItem>
                        <SelectItem value="NO">NO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="chronicIllness">Chronic Illness</Label>
                    <Input
                      id="chronicIllness"
                      value={editData.chronicIllness}
                      onChange={(e) =>
                        handleInputChange("chronicIllness", e.target.value)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>


             {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5" />
                          Employment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employmentType">Employment Type</Label>
                    <Select
                      value={editData.employmentType}
                      onValueChange={(value) =>
                        handleInputChange("employmentType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Self-employed">Self-employed</SelectItem>
                        <SelectItem value="Unemployed">Unemployed</SelectItem>
                        <SelectItem value="Retired">Retired</SelectItem>
                        <SelectItem value="Student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="employerName">Employer Name</Label>
                    <Input
                      id="employerName"
                      value={editData.employerName}
                      onChange={(e) =>
                        handleInputChange("employerName", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="employerAddress">Employer Address</Label>
                    <Textarea
                      id="employerAddress"
                      value={editData.employerAddress}
                      onChange={(e) =>
                        handleInputChange("employerAddress", e.target.value)
                      }
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateEmployed">Date Employed</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editData.dateEmployed && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editData.dateEmployed
                            ? format(editData.dateEmployed, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <DOBCalendar
                          mode="single"
                          selected={editData.dateEmployed}
                          onSelect={(date) => handleInputChange("dateEmployed", date || new Date())}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="employerNumber">Employer Telephone</Label>
                    <Input
                      id="employerNumber"
                      value={editData.employerNumber}
                      onChange={(e) =>
                        handleInputChange("employerNumber", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="employerEmail">Employer Email</Label>
                    <Input
                      id="employerEmail"
                      type="email"
                      value={editData.employerEmail}
                      onChange={(e) =>
                        handleInputChange("employerEmail", e.target.value)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           

            {/* Identification Details */}
            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                            <IdCard className="h-5 w-5" />
                                        Identification Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="meansID">ID Type</Label>
                    <Select
                      value={editData.meansID}
                      onValueChange={(value) =>
                        handleInputChange("meansID", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Passport">Passport</SelectItem>
                        <SelectItem value="Drivers License">Driver's License</SelectItem>
                        <SelectItem value="National ID">National ID</SelectItem>
                        <SelectItem value="Voters Card">Voter's Card</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="idNo">ID Number</Label>
                    <Input
                      id="idNo"
                      value={editData.idNo}
                      onChange={(e) =>
                        handleInputChange("idNo", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="nin">NIN Number</Label>
                    <Input
                      id="nin"
                      value={editData.nin}
                      onChange={(e) =>
                        handleInputChange("nin", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="bvn">BVN Number</Label>
                    <Input
                      id="bvn"
                      value={editData.bvn}
                      onChange={(e) =>
                        handleInputChange("bvn", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="remark">Remarks</Label>
                    <Input
                      id="remark"
                      value={editData.remark}
                      onChange={(e) =>
                        handleInputChange("remark", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={editData.issueDate ? format(editData.issueDate, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : new Date();
                        handleInputChange("issueDate", date);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={editData.expiryDate ? format(editData.expiryDate, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : new Date();
                        handleInputChange("expiryDate", date);
                      }}
                      min={editData.issueDate ? format(editData.issueDate, "yyyy-MM-dd") : undefined}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mop">Mode of Payment</Label>
                  <Select
                    value={editData.mop}
                    onValueChange={(value) => handleInputChange("mop", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Automatic Salary Deduction">Automatic Salary Deduction</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Direct Debit">Direct Debit</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentType">Payment Type</Label>
                  <Select
                    value={editData.paymentType}
                    onValueChange={(value) => handleInputChange("paymentType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full Payment">Full Payment</SelectItem>
                      <SelectItem value="Installment">Installment</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentAmount">Payment Amount</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editData.paymentAmount}
                    onChange={(e) => handleInputChange("paymentAmount", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="dateofpayment">Payment Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editData.dateofpayment && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editData.dateofpayment ? (
                          format(editData.dateofpayment, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <DOBCalendar
                        mode="single"
                        selected={editData.dateofpayment}
                        onSelect={(date) => handleInputChange("dateofpayment", date || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="receiptNo">Receipt Number</Label>
                  <Input
                    id="receiptNo"
                    value={editData.receiptNo}
                    onChange={(e) => handleInputChange("receiptNo", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={editData.bankName}
                    onChange={(e) => handleInputChange("bankName", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="accountNo">Account Number</Label>
                  <Input
                    id="accountNo"
                    value={editData.accountNo}
                    onChange={(e) => handleInputChange("accountNo", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          </div>

          {/* Agent Information */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agentCode">Agent Code</Label>
                  <Input
                    id="agentCode"
                    value={editData.agentCode}
                    onChange={(e) =>
                      handleInputChange("agentCode", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="agentDescription">Agent Description</Label>
                  <Input
                    id="agentDescription"
                    value={editData.agentDescription}
                    onChange={(e) =>
                      handleInputChange("agentDescription", e.target.value)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Section - View Only in Edit Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
                <Badge variant="outline" className="ml-2">
                  View Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Documents are view-only in edit mode
                      </p>
                      <p className="text-sm text-yellow-700">
                        Exit edit mode to upload, delete, or manage documents
                      </p>
                    </div>
                  </div>
                </div>
                {data?.proposalNo && (
                  <DocumentManager 
                    proposalIds={[data.proposalNo]} 
                    className="w-full"
                    readOnly={true}
                  />
                )}
                {!data?.proposalNo && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No proposal number available. Cannot load documents.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save/Cancel Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              loading={loading.editProposal}
              onClick={handleSave}
              className="w-48"
              size="lg"
            >
              Update Traditional Proposal
            </Button>
            <Button onClick={handleCancel} variant="outline" size="lg">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        // View Mode - Display Existing Data
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Title</p>
                    <p className="font-medium">{data.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Assured Code</p>
                    <p className="font-medium">{data.assuredCode || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cover Code</p>
                    <p className="font-medium">{data.coverCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Risk ID</p>
                    <p className="font-medium">B</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Surname</p>
                    <p className="font-medium">{data.surName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Other Names</p>
                    <p className="font-medium">{data.otherNames}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-medium">{data.fullName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-medium">{data.sex}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="font-medium">{formatDate(data.dateofBirth)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Marital Status</p>
                    <p className="font-medium">{data.maritalStatus || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Occupation</p>
                    <p className="font-medium">{data.occupation || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Place of Birth</p>
                    <p className="font-medium">{data.placeOfBirth || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Spouse Name</p>
                    <p className="font-medium">{data.spouseName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Govt of Origin</p>
                    <p className="font-medium">{data.govtofOrigin || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Religion</p>
                    <p className="text-sm">{data.religion}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Designation</p>
                    <p className="text-sm">{data.designation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

         

          {/* Additional Information Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Contact Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium">{data.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Residential Address</p>
                  <p className="font-medium">{data.residentialAddress || data.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">State</p>
                  <p className="font-medium">{data.state}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Country</p>
                  <p className="font-medium">{data.country || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Land Phone</p>
                  <p className="font-medium">{data.landphone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mobile Phone</p>
                  <p className="font-medium">{data.mobilePhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{data.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Landmark</p>
                  <p className="font-medium">{data.landmark || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Policy Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Policy Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium">{data.duration} years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sum Assured</p>
                  <p className="font-medium">{formatCurrency(data.sumAssured)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">First Premium</p>
                  <p className="font-medium">{formatCurrency(data.premium1)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">National ID</p>
                  <p className="font-medium">{data.nationalID || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Agent Code</p>
                  <p className="font-medium">{data.agentcode || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Agent Description</p>
                  <p className="font-medium">{data.agentDescription || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
            {/* Health Information */}
            <Card>
              <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                                           <Heart className="h-5 w-5" />
                                           Health Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Height/Weight</p>
                    <p className="font-medium">
                      {data.height ? `${data.height}cm` : "N/A"} / {data.weight ? `${data.weight}kg` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sport Engagement</p>
                    <p className="font-medium">{data.sport || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bodily Infirmity</p>
                    <p className="font-medium">{data.infirmity || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Medical Conditions</p>
                    <p className="font-medium">{data.stroke || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Treatment</p>
                    <p className="font-medium">{data.treatment || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Work Absence</p>
                    <p className="font-medium">{data.workAbesent || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Habits</p>
                    <p className="font-medium">{data.smoke || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Aviation Engagement</p>
                    <p className="font-medium">{data.aviation || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Chronic Illness</p>
                    <p className="font-medium">{data.chronicIllness || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5" />
                          Employment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Employment Type</p>
                    <p className="font-medium">{data.employmentType || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employer Name</p>
                    <p className="font-medium">{data.employerName || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Employer Address</p>
                    <p className="font-medium">{data.employerAddress || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date Employed</p>
                    <p className="font-medium">{formatDate(data.dateEmployed)}</p>
                  </div>                                                                    
                  <div>
                    <p className="text-sm text-gray-600">Employer Telephone</p>
                    <p className="font-medium">{data.employerNumber || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employer Email</p>
                    <p className="font-medium">{data.employerEmail || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* More Information Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Identification Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                            <IdCard className="h-5 w-5" />
                                        Identification Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">NIN Number</p>
                    <p className="font-medium">{data.nin || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">BVN Number</p>
                    <p className="font-medium">{data.bvn || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ID Type</p>
                    <p className="font-medium">{data.meansID || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ID Number</p>
                    <p className="font-medium">{data.idNo || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Remarks</p>
                    <p className="font-medium">{data.remarks || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Issue Date</p>
                        <p className="font-medium">{formatDate(data.issueDate)}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-300 mx-4" />
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Expiry Date</p>
                        <p className="font-medium">{formatDate(data.expiryDate)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
         

          {/* Payment Information */}
         
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Mode of Payment</p>
                    <p className="font-medium">{data.mop || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Type</p>
                    <p className="font-medium">{data.paymentType || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Amount</p>
                    <p className="font-medium">{data.paymentAmount ? formatCurrency(data.paymentAmount) : "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Date</p>
                    <p className="font-medium">{formatDate(data.dateofpayment)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Receipt Number</p>
                    <p className="font-medium">{data.receiptNo || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bank Name</p>
                    <p className="font-medium">{data.bankName || "Not provided"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Account Number</p>
                    <p className="font-medium">{data.accountNo || "Not provided"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
             </div>

            {/* DOCUMENTS SECTION */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {!isEditing && (
              <Card className="w-full">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-0">
                        Upload and manage documents for this proposal. You can view, upload, and manage all related documents here.
                      </p>
                    </div>
                    {data?.proposalNo && (
                      <div className="max-h-[300px] overflow-y-auto">
                        <DocumentManager 
                          proposalIds={[data.proposalNo]} 
                          className="w-full"
                        />
                      </div>
                    )}
                    {!data?.proposalNo && (
                      <Alert variant="destructive" className="mt-3 sm:mt-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
                          <AlertDescription className="text-xs sm:text-sm">
                            No proposal number available. Cannot load documents.
                          </AlertDescription>
                        </div>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
         

          {/* Beneficiaries Section */}
          <BeneficiariesSection />
          </div>
        </div>
      )}
    </div>
  );
};

export default TradProposalDetail;