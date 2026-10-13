//@ts-nocheck
import { useEffect, useState, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams, useOutletContext, useLocation } from "react-router-dom"
import type { RootState } from "../../../features/store"
import {
  getPolicyByNumber,
  updatePolicy,
  clearMessages,
  fetchPolicyReport,
  getBizShareType,
  getBusinessChannels,
  getSubChannels,
  getOccupations,
} from "../../../features/reducers/underwriteReducers/underwritingSlice"
import { getAllRisks } from "../../../features/reducers/adminReducers/riskSlice"
import { fetchProducts } from "../../../features/reducers/productReducers/productSlice"
import { getAllBranches, clearBranchError } from "../../../features/reducers/companyReducers/branchSlice"
import { getAllAgents } from "../../../features/reducers/csuReducers/agentSlice"
import { fetchMktStaffs, selectMarketingStaff } from "../../../features/reducers/companyReducers/marketingStaffSlice"
import { fetchPolicies } from "../../../features/reducers/underwriteReducers/underwritingSlice"
import { Button } from "../../ui/new-button"
import Input from "../../ui/Input"
import { Label } from "../../ui/label"
import type { UpdatePolicyRequest } from "../../../types/underwriting"
import "./EditPolicy.css"
import { useToast } from "@/components/ui/use-toast"
import useProposalPDF from "@/hooks/use-proposal-pdf"
import { useAppSelector } from "../../../hooks/use-apps"
import {
  FileText,
  User,
  Calendar,
  Banknote,
  Building,
  Briefcase,
  Layers,
  CreditCard,
  RefreshCcw,
  Loader2
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert"
import { formatMoney, policyCurrency } from "../../../utils/currency"

const EditPolicy = () => {
  const { toast } = useToast()
  const { policyNo } = useParams<{ policyNo: string }>()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { downloadPDF } = useProposalPDF()
  const location = useLocation()

  const initialized = useRef(false)
  const dataFetched = useRef(false)
  const renderCount = useRef(0)

  renderCount.current += 1

  // ==================== REDUX SELECTORS ====================
  
  const fullUnderwritingState = useSelector((state: RootState) => state.underwritings) || {}

  let currentPolicy = fullUnderwritingState.currentPolicy
  
  if (Array.isArray(currentPolicy) && currentPolicy.length > 0) {
    currentPolicy = currentPolicy[0]
  }
  
  if (!currentPolicy && fullUnderwritingState.policies && fullUnderwritingState.policies.length > 0) {
    const found = fullUnderwritingState.policies.find((p: any) => 
      p.proposalNo === policyNo || p.policyNo === policyNo
    )
    if (found) {
      currentPolicy = found
    }
  }

  const {
    loading = {},
    success = {},
    error = {},
  } = fullUnderwritingState

  const { risks = [] } = useSelector((state: RootState) => state.risks) || {}
  const { products = [] } = useSelector((state: RootState) => state.products) || {}
  const { branches = [], error: branchError } = useSelector((state: RootState) => state.branches) || {}
  const { agents = [] } = useSelector((state: RootState) => state.parties) || {}
  const { mktStaffs } = useAppSelector(selectMarketingStaff)
  
  const {
    busChannels: busChannelOptions = [],
    subChannels: subChannelOptions = [],
    occupations: occupationOptions = []
  } = useSelector((state: RootState) => state.underwritings) || {}

  const [formData, setFormData] = useState<UpdatePolicyRequest>({
    surname: "",
    firstName: "",
    otherNames: "",
    insAddress: "",
    insMobilePhone: "",
    insEmail: "",
    insOccupation: "",
    bizSource: "",
    partyID: "",
    mktStaffID: "",
    branchID: "",
    businessType: "",
    busChannel: "",
    subChannel: "",
    startDate: "",
    endDate: "",
    proportionRate: 0,
    remarks: "",
    modifiedBy: "SYSTEM",
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [branchErrorShown, setBranchErrorShown] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Get context from PolicyLayout
  const { isReadOnly, isRenewed } = useOutletContext<{ isReadOnly: boolean, isRenewed: boolean }>() || { isReadOnly: false, isRenewed: false }

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    if (!initialized.current && policyNo) {
      initialized.current = true
      
      dispatch(getPolicyByNumber(policyNo) as any)
      dispatch(getAllRisks({ pageNumber: 1, pageSize: 100 }) as any)
      dispatch(getAllBranches() as any)
      dispatch(getAllAgents({ pageNumber: 1, pageSize: 100 }) as any)
      dispatch(fetchMktStaffs() as any)
      dispatch(getBizShareType() as any)
      dispatch(getBusinessChannels() as any)
      dispatch(getOccupations() as any)
    }
  }, [policyNo, dispatch])

  // ==================== POPULATE FORM WITH POLICY DATA ====================

  useEffect(() => {
    if (currentPolicy && !dataFetched.current) {
      dataFetched.current = true
      setIsLoading(false)

      let resolvedBranchID = currentPolicy.branchID || ""
      
      if (branches && branches.length > 0 && !resolvedBranchID) {
        const matchedBranch = branches.find(
          (branch: any) =>
            String(branch.description || "").trim() === String(currentPolicy.branch || "").trim() ||
            String(branch.branchName || "").trim() === String(currentPolicy.branch || "").trim() ||
            String(branch.branch || "").trim() === String(currentPolicy.branch || "").trim()
        )
        resolvedBranchID = matchedBranch?.branchID || ""
      }

      setFormData({
        surname: currentPolicy.insSurname || "",
        firstName: currentPolicy.insFirstname || "",
        otherNames: currentPolicy.insOthernames || "",
        insAddress: currentPolicy.insAddress || "",
        insMobilePhone: currentPolicy.insMobilePhone || "",
        insEmail: currentPolicy.insEmail || "",
        insOccupation: currentPolicy.insOccupation || "",
        bizSource: currentPolicy.bizSource || currentPolicy.sourceType || "",
        partyID: currentPolicy.partyID || "",
        mktStaffID: currentPolicy.mktStaffID || "",
        branchID: resolvedBranchID || currentPolicy.branchID || "",
        businessType: currentPolicy.businessType || currentPolicy.sourceType || "",
        busChannel: currentPolicy.channelID || currentPolicy.busChannel || "",
        subChannel: currentPolicy.subChannelID || currentPolicy.subChannel || "",
        startDate: currentPolicy.startDate ? currentPolicy.startDate.split("T")[0] : "",
        endDate: currentPolicy.endDate ? currentPolicy.endDate.split("T")[0] : "",
        proportionRate: currentPolicy.proportionRate || 0,
        remarks: currentPolicy.remarks || "",
        modifiedBy: "SYSTEM",
      })

      if (currentPolicy.subRiskID) {
        dispatch(fetchProducts({ riskId: currentPolicy.subRiskID, pageNumber: 1, pageSize: 100 }) as any)
      }
    }
    
    if (!currentPolicy && !isLoading && !dataFetched.current) {
      // No policy data yet, keeping loading state
    }
  }, [currentPolicy, branches, dispatch])

  // ==================== SUB-CHANNEL EFFECT ====================

  useEffect(() => {
    if (formData.busChannel) {
      dispatch(getSubChannels(formData.busChannel) as any)
    }
  }, [dispatch, formData.busChannel])

  // ==================== UPDATE SUCCESS EFFECT ====================

  useEffect(() => {
    if (success.updatePolicy) {
      dispatch(clearMessages())
      toast({
        title: "Success!",
        description: "Policy updated successfully!",
        variant: "success",
        duration: 3000
      })
      if (policyNo) {
        dataFetched.current = false
        dispatch(getPolicyByNumber(policyNo) as any)
      }
    }
  }, [success.updatePolicy, dispatch, policyNo, toast])

  // ==================== REPORT EFFECT ====================

  useEffect(() => {
    if (success.fetchPolicyReport) {
      dispatch(clearMessages())
      toast({
        title: "Report fetched successfully!",
        description: "You can proceed to view the report in the downloads",
        duration: 3000,
        variant: "success",
      })
    } else if (error.fetchPolicyReport) {
      dispatch(clearMessages())
      toast({
        title: "Failed to download policy",
        duration: 3000,
        variant: "destructive"
      })
    }
  }, [dispatch, success.fetchPolicyReport, error.fetchPolicyReport, toast])

  // ==================== BRANCH ERROR EFFECT ====================

  useEffect(() => {
    if (branchError?.getAllBranches && !branchErrorShown) {
      setBranchErrorShown(true)
      let errorMessage = "Could not load branches. Please refresh the page."
      
      if (typeof branchError.getAllBranches === 'string') {
        errorMessage = branchError.getAllBranches
      } else if (branchError.getAllBranches?.message) {
        errorMessage = branchError.getAllBranches.message
      } else if (branchError.getAllBranches?.response?.data?.message) {
        errorMessage = branchError.getAllBranches.response.data.message
      }
      
      toast({
        title: "Warning",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      })
    }
  }, [branchError, branchErrorShown, toast])

  // ==================== HANDLERS ====================

  const handleInputChange = (field: keyof UpdatePolicyRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (validationErrors.length > 0) {
      setValidationErrors([])
    }
  }

  const validateForm = (): string[] => {
    const errors: string[] = []
    const today = getTodayString()

    if (!formData.startDate) errors.push("Start date is required")
    if (!formData.endDate) errors.push("End date is required")

    if (formData.startDate && formData.startDate < today) {
      errors.push("Start date cannot be earlier than today")
    }
    if (formData.endDate && formData.endDate < today) {
      errors.push("End date cannot be earlier than today")
    }
    if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      errors.push("End date must be after start date")
    }

    if (formData.insEmail && !/\S+@\S+\.\S+/.test(formData.insEmail)) {
      errors.push("Please enter a valid email address")
    }

    return errors
  }

  const handleSubmit = async () => {
    const errors = validateForm()
    if (errors.length > 0) {
      setValidationErrors(errors)
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving.",
        variant: "destructive",
        duration: 3000
      })
      return
    }

    if (policyNo) {
      try {
        await dispatch(updatePolicy({ proposalNo: policyNo, policyData: formData })).unwrap()
        toast({
          title: "Success!",
          description: "Policy updated successfully!",
          variant: "success",
          duration: 3000
        })
      } catch (error: any) {
        console.error('❌ Update failed:', error)
        toast({
          title: "Error",
          description: typeof error === 'string' ? error : error?.message || "Failed to update policy",
          variant: "destructive",
          duration: 3000
        })
      }
    }
  }

  const isRenewalContext = location.pathname.includes('/renewals/')

  const handleCancel = () => {
    navigate(-1);
  };

  const handleDoUnderwriting = () => {
    if (policyNo) {
      const calculatorPath = isRenewalContext
        ? `/underwriting/renewals/calculate/${encodeURIComponent(policyNo)}`
        : `calculator${isReadOnly ? '?readonly=true' : ''}`
      navigate(calculatorPath)
    }
  }

  const handleDoClause = () => {
    if (policyNo) {
      navigate(`/underwriting/clauses/${policyNo}`)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  // Amounts are in the policy's currency
  const formatCurrency = (amount: number | null) => formatMoney(amount, policyCurrency(currentPolicy), "N/A")

  const getTodayString = () => {
    const now = new Date()
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    return local.toISOString().split("T")[0]
  }

  // ==================== SELECT OPTIONS ====================

  const busChannelSelectOptions = (busChannelOptions || []).map((opt: any) => ({
    value: String(opt?.value ?? opt ?? ""),
    label: String(opt?.label ?? opt?.channels ?? opt?.value ?? opt ?? ""),
  }))

  const subChannelSelectOptions = (subChannelOptions || []).map((opt: any) => ({
    value: String(opt?.value ?? opt ?? ""),
    label: String(opt?.label ?? opt?.groupName ?? opt?.description ?? opt?.value ?? opt ?? ""),
  }))

  const mktStaffOptions = (mktStaffs || []).map((m: any) => ({
    value: m.mktStaffID,
    label: m.staffName || `${m.surname} ${m.firstname}`,
  }))

  const agentOptions = (agents || [])
    .filter((a: any) => {
      const id = a?.agentID ?? a?.partyID
      const name = a?.agent ?? a?.party
      return a?.deleted !== 1 && id && id !== "Auto" && name !== "0"
    })
    .map((a: any) => ({
      value: a.agentID ?? a.partyID,
      label: String(a.agent || a.party || a.description || a.agentID || a.partyID).trim(),
    }))

  const branchOptions = (branches || []).map((b: any) => ({
    value: b.branchID,
    label: b.description || b.branchName || b.branch || b.branchID,
  }))

  // ==================== RENDER ====================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading policy data...</p>
          <p className="text-sm text-gray-400 mt-2">Policy: {policyNo}</p>
        </div>
      </div>
    )
  }

  if (!currentPolicy) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold">Policy not found</p>
          <p className="text-sm mt-2">Policy number: {policyNo}</p>
          <Button 
            onClick={() => navigate(-1)} 
            className="mt-4"
            variant="outline"
          >
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="edit-policy-container">
      <div className="edit-policy-header">
        <div>
          <h1>Edit Policy</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="policy-number m-0">Policy No: {currentPolicy.proposalNo || currentPolicy.policyNo}</p>
            {isReadOnly && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                Outdated
              </span>
            )}
            {!isReadOnly && currentPolicy.coPolicyNo && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                Renewed
              </span>
            )}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              {currentPolicy.riskID || currentPolicy.riskClass || 'N/A'}
            </span>
          </div>
        </div>
        <div className="header-actions">
          <Button onClick={handleCancel} variant="outline">
            Back to List
          </Button>
          <Button onClick={handleDoUnderwriting} variant="outline">
            View Details
          </Button>
          {!isReadOnly && (
            <Button onClick={handleSubmit} disabled={loading.updatePolicy}>
              {loading.updatePolicy ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </div>

      <div className="edit-policy-content">
        {validationErrors.length > 0 && (
          <div className="validation-errors">
            <h4>Please fix the following errors:</h4>
            <ul>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {error.updatePolicy && <div className="error-message">{error.updatePolicy}</div>}

        {success.updatePolicy && <div className="success-message">Policy updated successfully!</div>}

        <div className="form-section readonly-section">
          <h3><FileText className="w-5 h-5 text-indigo-600" /> Policy Summary</h3>
          <div className="info-grid">
            <div className="info-item">
              <Label>Status</Label>
              <Input value={currentPolicy.transSTATUS || currentPolicy.status || "PENDING"} disabled className="bg-gray-50/50 border-gray-200 text-gray-700 h-9" />
            </div>
            <div className="info-item">
              <Label><Layers className="w-3 h-3 inline mr-1" /> Business Category</Label>
              <Input value={risks.find((r) => r.riskID == currentPolicy.riskID)?.riskName || currentPolicy.riskID || "N/A"} disabled className="bg-gray-50/50 border-gray-200 text-gray-700 h-9" />
            </div>
            <div className="info-item">
              <Label><Briefcase className="w-3 h-3 inline mr-1" /> Subclass</Label>
              <Input value={currentPolicy.subRisk || currentPolicy.subRiskID || "N/A"} disabled className="bg-gray-50/50 border-gray-200 text-gray-700 h-9" />
            </div>
            <div className="info-item">
              <Label><Building className="w-3 h-3 inline mr-1" /> Branch</Label>
              <Input
                value={branchOptions.find((b) => String(b.value) === String(formData.branchID))?.label || currentPolicy.branch || "N/A"}
                disabled
                className="bg-gray-50/50 border-gray-200 text-gray-700 h-9"
              />
            </div>
            <div className="info-item">
              <Label><User className="w-3 h-3 inline mr-1" /> Broker / Agent</Label>
              <Input
                value={agentOptions.find((a) => String(a.value) === String(formData.partyID))?.label || currentPolicy.party || "N/A"}
                disabled
                className="bg-gray-50/50 border-gray-200 text-gray-700 h-9"
              />
            </div>
            <div className="info-item">
              <Label><User className="w-3 h-3 inline mr-1" /> Marketing Staff</Label>
              <Input
                value={mktStaffOptions.find((m) => String(m.value) === String(formData.mktStaffID))?.label || "N/A"}
                disabled
                className="bg-gray-50/50 border-gray-200 text-gray-700 h-9"
              />
            </div>
            <div className="info-item">
              <Label><Calendar className="w-3 h-3 inline mr-1" /> Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                min={getTodayString()}
                onChange={(e) => {
                  const start = e.target.value
                  handleInputChange("startDate", start)
                  if (start) {
                    const next = new Date(start)
                    next.setFullYear(next.getFullYear() + 1)
                    handleInputChange("endDate", next.toISOString().split("T")[0])
                  }
                }}
                disabled={isReadOnly}
                className="bg-gray-50/50 border-gray-200 text-gray-700 h-9"
              />
            </div>
            <div className="info-item">
              <Label><Calendar className="w-3 h-3 inline mr-1" /> End Date</Label>
              <Input
                type="date"
                value={formData.endDate}
                min={formData.startDate || getTodayString()}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                disabled={isReadOnly}
                className="bg-gray-50/50 border-gray-200 text-gray-700 h-9"
              />
            </div>
            <div className="info-item">
              <Label><Banknote className="w-3 h-3 inline mr-1" /> Sum Insured</Label>
              <Input value={formatCurrency(currentPolicy.sumInsured)} disabled className="bg-gray-50/50 border-gray-200 text-gray-700 h-9 font-semibold" />
            </div>
            <div className="info-item">
              <Label><Banknote className="w-3 h-3 inline mr-1" /> Gross Premium</Label>
              <Input value={formatCurrency(currentPolicy.grossPremium)} disabled className="bg-gray-50/50 border-gray-200 text-gray-700 h-9 font-semibold" />
            </div>
            <div className="info-item">
              <Label><CreditCard className="w-3 h-3 inline mr-1" /> Currency</Label>
              <Input value={currentPolicy.exCurrency || "NGN"} disabled className="bg-gray-50/50 border-gray-200 text-gray-700 h-9" />
            </div>
            <div className="info-item">
              <Label><CreditCard className="w-3 h-3 inline mr-1" /> Exchange Rate</Label>
              <Input value={currentPolicy.exRate || 1} disabled className="bg-gray-50/50 border-gray-200 text-gray-700 h-9" />
            </div>
            <div className="info-item">
              <Label><Briefcase className="w-3 h-3 inline mr-1" /> Business Source</Label>
              <Input
                value={currentPolicy.sourceType || "N/A"}
                disabled
                className="bg-gray-50/50 border-gray-200 text-gray-700 h-9"
              />
            </div>
          </div>

          {currentPolicy.coPolicyNo && (
            <div className="mt-6">
              <Alert className="bg-blue-50 border-blue-200 text-blue-900">
                <RefreshCcw className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Renewal Information</AlertTitle>
                <AlertDescription className="text-blue-700 mt-1">
                  This policy is a renewal of Policy <strong>{currentPolicy.coPolicyNo}</strong>.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <div className="form-section">
          <h3>Insured Information (Editable)</h3>
          <div className="form-grid">
            <div className="form-field">
              <Label htmlFor="surname">Last Name *</Label>
              <Input
                id="surname"
                value={formData.surname}
                onChange={(e) => handleInputChange("surname", e.target.value)}
                placeholder="Enter last name"
                disabled={isReadOnly}
              />
            </div>

            <div className="form-field">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="Enter first name"
                disabled={isReadOnly}
              />
            </div>
            <div className="form-field form-field-full">
              <Label htmlFor="insuredName">Other Names *</Label>
              <Input
                id="fistName"
                value={formData.otherNames}
                onChange={(e) => handleInputChange("otherNames", e.target.value)}
                placeholder="Enter insured name"
                disabled={isReadOnly}
              />
            </div>

            <div className="form-field">
              <Label htmlFor="insAddress">Address *</Label>
              <textarea
                id="insAddress"
                value={formData.insAddress}
                onChange={(e) => handleInputChange("insAddress", e.target.value)}
                placeholder="Enter address"
                className="form-textarea"
                rows={3}
                disabled={isReadOnly}
              />
            </div>

            <div className="form-field">
              <Label htmlFor="insMobilePhone">Mobile Phone *</Label>
              <Input
                id="insMobilePhone"
                value={formData.insMobilePhone}
                onChange={(e) => handleInputChange("insMobilePhone", e.target.value)}
                placeholder="Enter mobile phone"
                disabled={isReadOnly}
              />
            </div>

            <div className="form-field">
              <Label htmlFor="insEmail">Email *</Label>
              <Input
                id="insEmail"
                type="email"
                value={formData.insEmail}
                onChange={(e) => handleInputChange("insEmail", e.target.value)}
                placeholder="Enter email"
                disabled={isReadOnly}
              />
            </div>

            <div className="form-field">
              <Label htmlFor="insOccupation">Occupation</Label>
              <Input
                id="insOccupation"
                value={formData.insOccupation}
                onChange={(e) => handleInputChange("insOccupation", e.target.value)}
                placeholder="Enter occupation"
                disabled={isReadOnly}
              />
            </div>

            <div className="form-field">
              <Label htmlFor="proportionRate">Proportion Rate (%)</Label>
              <Input
                id="proportionRate"
                type="number"
                min="0"
                max="100"
                value={formData.proportionRate}
                onChange={(e) => handleInputChange("proportionRate", Number(e.target.value))}
                disabled
              />
            </div>

            <div className="form-field form-field-full">
              <Label htmlFor="remarks">Remarks</Label>
              <textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
                placeholder="Enter remarks"
                className="form-textarea"
                rows={3}
                disabled={isReadOnly}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditPolicy