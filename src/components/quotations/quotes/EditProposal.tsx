//@ts-nocheck
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import { FileText, Calculator, Save, ArrowLeft, FileCheck, CheckCircle } from "lucide-react"
import type { RootState } from "../../../features/store"
import {
  getProposalByNumber,
  updateProposal,
  clearMessages,
  fetchProposalReport,
} from "../../../features/reducers/quoteReducers/quotationSlice"
import { getAllRisks } from "../../../features/reducers/adminReducers/riskSlice"
import { getAllProducts } from "../../../features/reducers/productReducers/productSlice"
import { getAllBranches } from "../../../features/reducers/companyReducers/branchSlice"
import { getAllAgents } from "../../../features/reducers/csuReducers/agentSlice"
import { Button } from "../../ui/new-button"
import Input from "../../ui/Input"
import { Label } from "../../ui/label"
import type { UpdateProposalRequest } from "../../../types/quotation"
import "./EditProposal.css"
import { useToast } from "@/components/ui/use-toast"
import useProposalPDF from "@/hooks/use-proposal-pdf"
import QuoteTabs from "./QuoteTabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../ui/dialog"

// Tab component
const EditProposalTabs = ({ activeTab, onTabChange, riskName, proposalNo }: { activeTab: string; onTabChange: (tab: string) => void; riskName: string; proposalNo: string }) => {
  return (
    <QuoteTabs riskName={riskName} proposalNo={proposalNo} />
  )
}

const EditProposal = () => {
  const { toast } = useToast()
  const { proposalNo } = useParams<{ proposalNo: string }>()
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { downloadPDF } = useProposalPDF();

  const { currentProposal, proposalReport, loading, success, error } = useSelector((state: RootState) => state.quotations)
  const { risks } = useSelector((state: RootState) => state.risks)
  const { products } = useSelector((state: RootState) => state.products)
  const { branches } = useSelector((state: RootState) => state.branches)
  const { agents } = useSelector((state: RootState) => state.parties)

  // State for convert to policy dialog
  const [showConvertDialog, setShowConvertDialog] = useState(false)
  const [converting, setConverting] = useState(false)

  // Determine active tab based on path
  let activeTab = "details";
  if (location.pathname.includes("/quote-details")) {
    activeTab = "quote-details";
  }

  const [formData, setFormData] = useState<UpdateProposalRequest>({
    surname: "",
    firstName: "",
    otherNames: "",
    insAddress: "",
    insMobilePhone: "",
    insEmail: "",
    insOccupation: "",
    bizSource: "",
    proportionRate: 0,
    remarks: "",
    modifiedBy: "SYSTEM",
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const handleTabChange = (tab: string) => {
    if (!proposalNo) return;

    switch (tab) {
      case "details":
        navigate(`/quotations/edit/${encodeURIComponent(proposalNo)}`)
        break;
      case "quote-details":
        // Navigate to the quote details page (formerly do quote)
        if (risks.find((r) => r.riskID == currentProposal?.riskID)?.riskName == "Motor") {
          navigate(`/quotations/quote/motor/${proposalNo}`)
        } else {
          navigate(`/quotations/quote/${proposalNo}`)
        }
        break;
    }
  }

  // Convert to Policy handler
  const handleConvertToPolicy = async () => {
    setConverting(true);
    try {
      // TODO: Add your convert to policy API call here when ready
      // await dispatch(convertQuotationToPolicy(proposalNo) as any)
      
      console.log('Converting quotation to policy:', proposalNo)
      
      toast({
        title: "Convert to Policy",
        description: "Convert to policy functionality will be added when endpoint is ready.",
        duration: 3000,
        variant: "info",
      })
      
      setShowConvertDialog(false)
    } catch (err: any) {
      console.error('Failed to convert:', err)
      toast({
        title: "Conversion Failed",
        description: `Failed to convert to policy: ${err?.message ?? err}`,
        duration: 3000,
        variant: "destructive",
      })
    } finally {
      setConverting(false)
    }
  }

  useEffect(() => {
    if (success.fetchProposalReport) {
      dispatch(clearMessages())
      toast({
        title: "Report fetched succesfully!",
        description: "You can proceed to view the report in the downloads",
        duration: 3000,
        variant: "success",
      })
      downloadPDF(proposalReport)
    } else if (error.fetchProposalReport) {
      dispatch(clearMessages())
      toast({
        title: "Failed to download proposal",
        duration: 3000,
        variant: "destructive"
      })
    }
  }, [dispatch, success.fetchProposalReport, error.fetchProposalReport])

  useEffect(() => {
    if (proposalNo) {
      dispatch(getProposalByNumber(proposalNo) as any)
    }
    dispatch(getAllRisks({ pageNumber: 1, pageSize: 100 }) as any)
    dispatch(getAllBranches() as any)
    dispatch(getAllAgents({ pageNumber: 1, pageSize: 100 }) as any)
  }, [dispatch, proposalNo])

  useEffect(() => {
    console.log("it's log");

    if (currentProposal) {
      console.log(currentProposal);

      setFormData({
        surname: `${currentProposal.insSurname}`,
        firstName: `${currentProposal.insFirstname}`,
        otherNames: `${currentProposal.insOthernames}`,
        insAddress: currentProposal.insAddress,
        insMobilePhone: currentProposal.insMobilePhone,
        insEmail: currentProposal.insEmail,
        insOccupation: currentProposal.insOccupation,
        bizSource: currentProposal.bizSource,
        proportionRate: currentProposal.proportionRate,
        remarks: currentProposal.remarks || "",
        modifiedBy: "SYSTEM",
      })

      if (currentProposal.subRiskID) {
        dispatch(getAllProducts({ riskId: currentProposal.subRiskID, pageNumber: 1, pageSize: 100 }) as any)
      }
    }
  }, [currentProposal, dispatch])

  useEffect(() => {
    if (success.updateProposal) {
      dispatch(clearMessages())
    }
  }, [success.updateProposal, dispatch])

  const handleInputChange = (field: keyof UpdateProposalRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (validationErrors.length > 0) {
      setValidationErrors([])
    }
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.surname) errors.push("Insured name is required")
    if (!formData.insAddress) errors.push("Address is required")
    if (!formData.insMobilePhone) errors.push("Mobile phone is required")
    if (!formData.insEmail) errors.push("Email is required")

    if (formData.insEmail && !/\S+@\S+\.\S+/.test(formData.insEmail)) {
      errors.push("Please enter a valid email address")
    }

    return errors
  }

  const handleSubmit = () => {
    const errors = validateForm()
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    if (proposalNo) {
      dispatch(updateProposal({ proposalNo, proposalData: formData }) as any)
      dispatch(getProposalByNumber(proposalNo) as any)
    }
  }

  const handleCancel = () => {
    navigate("/quotations")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "N/A"
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
  }

  const riskName = risks.find(r => r.riskID === currentProposal?.riskID)?.riskName || "Risk";

  if (loading.fetchProposals || !currentProposal) {
    return <div className="edit-proposal-loading">Loading proposal...</div>
  }

  return (
    <div className="edit-proposal-container">
      <div className="edit-proposal-header">
        <div>
          <h1>Edit Quotation</h1>
          <p className="proposal-number">Proposal No: {currentProposal.proposalNo}</p>
        </div>
        <div className="header-actions">
          <Button onClick={handleCancel} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Proposals
          </Button>
          <Button 
            onClick={() => setShowConvertDialog(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Convert to Policy
          </Button>
        </div>
      </div>

      {/* Tabs Component */}
      <EditProposalTabs 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        riskName={riskName}
        proposalNo={proposalNo || ""}
      />

      <div className="edit-proposal-content">
        {activeTab === "details" && (
          <>
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

            {error.updateProposal && <div className="error-message">{error.updateProposal}</div>}

            {success.updateProposal && <div className="success-message">Proposal updated successfully!</div>}

            {/* Read-only proposal information */}
            <div className="form-section readonly-section">
              
              <div className="info-grid">
                <div className="info-item">
                  <Label>Status</Label>
                  <div className={`status-badge status-${currentProposal.transSTATUS}`}>
                    {currentProposal.transSTATUS}
                  </div>
                </div>
                <div className="info-item">
                  <Label>Business Category</Label>
                  <div className="info-value">{risks.find((r) => r.riskID == currentProposal.riskID)?.riskName}</div>
                </div>
                <div className="info-item">
                  <Label>Subclass</Label>
                  <div className="info-value">{currentProposal.subRisk}</div>
                </div>
                <div className="info-item">
                  <Label>Branch</Label>
                  <div className="info-value">{currentProposal.branch}</div>
                </div>
                <div className="info-item">
                  <Label>Agent</Label>
                  <div className="info-value">{currentProposal.party}</div>
                </div>
                <div className="info-item">
                  <Label>Marketing Staff</Label>
                  <div className="info-value">{currentProposal.mktStaff}</div>
                </div>
                <div className="info-item">
                  <Label>Start Date</Label>
                  <div className="info-value">{formatDate(currentProposal.startDate)}</div>
                </div>
                <div className="info-item">
                  <Label>End Date</Label>
                  <div className="info-value">{formatDate(currentProposal.endDate)}</div>
                </div>
                <div className="info-item">
                  <Label>Sum Insured</Label>
                  <div className="info-value">{formatCurrency(currentProposal.sumInsured)}</div>
                </div>
                <div className="info-item">
                  <Label>Gross Premium</Label>
                  <div className="info-value">{formatCurrency(currentProposal.grossPremium)}</div>
                </div>
                <div className="info-item">
                  <Label>Currency</Label>
                  <div className="info-value">{currentProposal.exCurrency}</div>
                </div>
                <div className="info-item">
                  <Label>Exchange Rate</Label>
                  <div className="info-value">{currentProposal.exRate}</div>
                </div>
              </div>
            </div>

            {/* Editable fields */}
            <div className="form-section">
              <h3>Insured Information </h3>
              <div className="form-grid">
                <div className="form-field">
                  <Label htmlFor="surname">Last Name *</Label>
                  <Input
                    id="surname"
                    value={formData.surname}
                    onChange={(e) => handleInputChange("surname", e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>

                <div className="form-field">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="form-field form-field-full">
                  <Label htmlFor="insuredName">Other Names *</Label>
                  <Input
                    id="fistName"
                    value={formData.otherNames}
                    onChange={(e) => handleInputChange("otherNames", e.target.value)}
                    placeholder="Enter insured name"
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
                  />
                </div>

                <div className="form-field">
                  <Label htmlFor="insMobilePhone">Mobile Phone *</Label>
                  <Input
                    id="insMobilePhone"
                    value={formData.insMobilePhone}
                    onChange={(e) => handleInputChange("insMobilePhone", e.target.value)}
                    placeholder="Enter mobile phone"
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
                  />
                </div>

                <div className="form-field">
                  <Label htmlFor="insOccupation">Occupation</Label>
                  <Input
                    id="insOccupation"
                    value={formData.insOccupation}
                    onChange={(e) => handleInputChange("insOccupation", e.target.value)}
                    placeholder="Enter occupation"
                  />
                </div>

                <div className="form-field">
                  <Label htmlFor="bizSource">Business Source</Label>
                  <select
                    id="bizSource"
                    value={formData.bizSource}
                    onChange={(e) => handleInputChange("bizSource", e.target.value)}
                    className="form-select"
                  >
                    <option value="DIRECT">Direct</option>
                    <option value="BROKER">Broker</option>
                    <option value="AGENT">Agent</option>
                  </select>
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
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "quote-details" && (
          <div className="quote-details-container">
            <p>Loading quote details...</p>
            {/* The quote details will be rendered by the child route */}
          </div>
        )}
      </div>

      {/* Convert to Policy Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Convert to Policy</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-medium">
                Ready to convert this quotation to a policy?
              </p>
            </div>
            <p className="text-gray-600 text-sm">
              This action will create a policy from this quotation. The policy will be available in the policies section.
            </p>
            <p className="text-gray-500 text-xs mt-3">
              Proposal Number: {currentProposal?.proposalNo}
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button 
              onClick={handleConvertToPolicy} 
              disabled={converting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {converting ? "Converting..." : "Convert to Policy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EditProposal