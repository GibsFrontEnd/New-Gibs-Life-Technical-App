//@ts-nocheck
//@ts-nocheck
// @ts-nocheck
import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"
import Select, { type SingleValue } from "react-select"
import CreatableSelect from "react-select/creatable"
import type { RootState } from "../../../features/store"
import {
  getPolicyByNumber,
  updatePolicy, // Using updatePolicy or similar instead of renewPolicy? 
  // renewPolicy, // Removed renewal action usage
  clearMessages,
  getBizShareType,
  getPolBizType,
  getBusinessChannels,
  getSubChannels,
  getOccupations
} from "../../../features/reducers/underwriteReducers/underwritingSlice"
import { getAllRisks } from "../../../features/reducers/adminReducers/riskSlice"
import { fetchProducts as getAllProducts } from "../../../features/reducers/productReducers/productSlice"
import { getAllBranches } from "../../../features/reducers/companyReducers/branchSlice"
import { getAllAgents } from "../../../features/reducers/csuReducers/agentSlice"
import { getAllCustomers } from "../../../features/reducers/csuReducers/customerSlice"
import { fetchMktStaffs, selectMarketingStaff } from "../../../features/reducers/companyReducers/marketingStaffSlice"
import { useAppSelector } from "../../../hooks/use-apps"

import { Button } from "../../ui/new-button"
import Input from "../../ui/Input"
import { Label } from "../../ui/label"
import type { CreatePolicyRequest } from "../../../types/underwriting"
import "./EndorsementPolicy.css"
import { useToast } from "../../ui/use-toast"
import { Loader2 } from "lucide-react"

const EndorsementPolicy = () => {
  const { toast } = useToast()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const errorRef = useRef<HTMLDivElement | null>(null)

  // Get policyNo from URL
  const { policyNo } = useParams<{ policyNo: string }>()



  const {
    loading,
    success,
    error,
    businessType: businessTypeOptions,
    accountType: accountTypeOptions,
    busChannels: busChannelOptions,
    subChannels: subChannelOptions,
    currentPolicy,
    occupations: occupationOptions
  } = useSelector((state: RootState) => state.underwritings)

  const { risks } = useSelector((state: RootState) => state.risks)
  const { products } = useSelector((state: RootState) => state.products)
  const { branches } = useSelector((state: RootState) => state.branches)
  const { customers } = useSelector((state: RootState) => state.customers)
  const { agents } = useSelector((state: RootState) => state.parties)
  const { mktStaffs } = useAppSelector(selectMarketingStaff)

  const [customerSearch, setCustomerSearch] = useState<string>("")
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [insuredType, setInsuredType] = useState<"individual" | "corporate">("individual")
  const [isDataReady, setIsDataReady] = useState(false)

  const [formData, setFormData] = useState<CreatePolicyRequest>({
    productID: "",
    subriskID: "",
    branchID: "",
    insuredID: "",
    partyID: "",
    mktStaffID: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0], // Default to today/policy end
    insAddress: "",
    insMobilePhone: "",
    insEmail: "",
    insOccupation: "",
    bizSource: "DIRECT",
    proportionRate: 100,
    currency: "NGN",
    exRate: 1,
    surname: "",
    firstName: "",
    otherNames: "",
    isOrg: false,
    remarks: "",
    businessType: "",
    accountType: "",
    busChannel: "",
    subChannel: "",
    riskClassification: "",
    riskLocation: ""
  })

  // 1. Fetch Policy Data on Mount
  useEffect(() => {
    if (policyNo) {
      dispatch(getPolicyByNumber(policyNo));
    }
  }, [dispatch, policyNo]);

  // Cleanup: Clear error messages when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearMessages());
    };
  }, [dispatch]);

  // 2. Populate Form when Policy Data is Loaded
  useEffect(() => {
    if (currentPolicy && policyNo) {
      setFormData({
        productID: String(currentPolicy.productID || currentPolicy.subRiskID || ""),
        subriskID: currentPolicy.subRiskID || "",
        branchID: currentPolicy.branchID || "",
        insuredID: currentPolicy.insuredID || "",
        partyID: currentPolicy.partyID || "",
        mktStaffID: currentPolicy.mktStaffID || "",
        startDate: currentPolicy.startDate ? new Date(currentPolicy.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        // Endorsements typically inherit the same end date, unless extending.
        // Default to current policy end date.
        endDate: currentPolicy.endDate ? new Date(currentPolicy.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        insAddress: currentPolicy.insAddress || "",
        insMobilePhone: currentPolicy.insMobilePhone || "",
        insEmail: currentPolicy.insEmail || "",
        insOccupation: currentPolicy.insOccupation || "",
        bizSource: currentPolicy.bizSource || "DIRECT",
        proportionRate: currentPolicy.proportionRate || 100,
        currency: currentPolicy.exCurrency || "NGN",
        exRate: currentPolicy.exRate || 1,
        surname: currentPolicy.insSurname || "",
        firstName: currentPolicy.insFirstname || "",
        otherNames: currentPolicy.insOthernames || "",
        isOrg: currentPolicy.isOrg || false,
        remarks: `Endorsement for Policy ${policyNo}`,
        businessType: currentPolicy.sourceType || currentPolicy.businessType || "",
        accountType: currentPolicy.accountType || "",
        busChannel: currentPolicy.channelID || "",
        subChannel: currentPolicy.subChannelID || "",
        riskClassification: "",
        riskLocation: ""
      });

      if (currentPolicy.riskID) {
        dispatch(getAllProducts({ riskId: currentPolicy.riskID, pageNumber: 1, pageSize: 100 }))
      } else if (currentPolicy.subRiskID) {
        dispatch(getAllProducts({ riskId: "", pageNumber: 1, pageSize: 100 }))
      }

      if (currentPolicy.isOrg) setInsuredType("corporate");
    }
  }, [currentPolicy, policyNo]);

  // Track when all data is ready
  useEffect(() => {
    const hasPolicy = !!currentPolicy
    const hasProducts = products.length > 0 || !!currentPolicy?.subRiskID
    if (hasPolicy && hasProducts) {
      setTimeout(() => setIsDataReady(true), 200)
    } else {
      setIsDataReady(false)
    }
  }, [currentPolicy, products]);

  // Set default values logic (kept same)
  useEffect(() => {
    if (accountTypeOptions?.length === 1 && !formData.accountType) {
      setFormData((prev) => ({ ...prev, accountType: accountTypeOptions[0].code }))
    }
    if (businessTypeOptions?.length === 1 && !formData.businessType) {
      setFormData((prev) => ({ ...prev, businessType: businessTypeOptions[0].code }))
    }
    if (busChannelOptions?.length === 1 && !formData.busChannel) {
      setFormData((prev) => ({ ...prev, busChannel: busChannelOptions[0].code }))
    }
  }, [accountTypeOptions, businessTypeOptions, busChannelOptions, formData.accountType, formData.businessType, formData.busChannel])

  // Fetch initial dropdown data
  useEffect(() => {
    dispatch(getAllBranches())
    dispatch(getAllRisks())
    dispatch(getAllAgents())
    dispatch(getAllCustomers())
    dispatch(fetchMktStaffs())
    dispatch(getBizShareType())
    dispatch(getPolBizType())
    dispatch(getBusinessChannels())
    dispatch(getOccupations())
  }, [dispatch])

  // Fetch subchannels
  useEffect(() => {
    if (formData.busChannel) {
      dispatch(getSubChannels(formData.busChannel))
    }
  }, [formData.busChannel, dispatch])

  // Debounced Customer Search
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    if (customerSearch.length > 2) {
      searchDebounceRef.current = setTimeout(() => {
        // Search logic
      }, 500)
    }
  }, [customerSearch, dispatch])

  // Success handling
  useEffect(() => {
    // If we use updatePolicy or new action, check success state here
    if (success.updatePolicy) { // Assuming updatePolicy success exists
      toast({ title: "Success", description: "Endorsement processed successfully.", variant: "default" })
      dispatch(clearMessages())
      navigate("/underwriting/endorsements")
    }
  }, [success, dispatch, navigate, toast])

  // Scroll to error
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [error])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleProductChange = (newValue: SingleValue<{ value: string; label: string }>) => {
    const selectedProduct = products.find((p: any) => p.productID === newValue?.value)
    setFormData((prev) => ({
      ...prev,
      productID: newValue?.value || "",
      subriskID: selectedProduct?.subRiskID || ""
    }))
  }

  const handleInsuredSelect = (newValue: SingleValue<{ value: string; label: string }>) => {
    const selectedCustomer = customers.find((c: any) => c.insuredID === newValue?.value)
    if (selectedCustomer) {
      setFormData((prev) => ({
        ...prev,
        insuredID: selectedCustomer.insuredID,
        surname: selectedCustomer.surname,
        firstName: selectedCustomer.firstname,
        otherNames: selectedCustomer.othername,
        insAddress: selectedCustomer.address,
        insMobilePhone: selectedCustomer.mobile,
        insEmail: selectedCustomer.email,
        insOccupation: selectedCustomer.occupation,
        isOrg: selectedCustomer.isCorporate
      }))
      setInsuredType(selectedCustomer.isCorporate ? "corporate" : "individual")
    }
  }

  // --- SUBMIT: ENDORSE POLICY ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.startDate || !formData.endDate) {
      toast({ title: "Validation Error", description: "Please fill all required fields.", variant: "destructive" })
      return
    }

    const payload = {
      // ... same payload structure
      branchID: formData.branchID,
      partyID: formData.partyID,
      mktStaffID: formData.mktStaffID,
      surname: formData.surname,
      firstName: formData.firstName,
      otherNames: formData.otherNames,
      insAddress: formData.insAddress,
      insMobilePhone: formData.insMobilePhone,
      insEmail: formData.insEmail,
      insOccupation: formData.insOccupation,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      bizSource: formData.bizSource,
      businessType: formData.businessType,
      accountType: formData.accountType,
      busChannel: formData.busChannel,
      subChannel: formData.subChannel,
      proportionRate: Number(formData.proportionRate),
      currency: formData.currency,
      exRate: Number(formData.exRate),
      remarks: formData.remarks,
      modifiedBy: "system_admin"
    };

   
    // await dispatch(endorsePolicy({ policyNo, payload })) 

    toast({
      title: "Endorsement",
      description: "Endorsement submission logic to be implemented. Payload logged.",
      variant: "default"
    });

    // navigate(`/underwriting/endorsements/calculate/${policyNo}`)
  }

  const toggleInsuredType = (type: "individual" | "corporate") => {
    setInsuredType(type)
    setFormData((prev) => ({ ...prev, isOrg: type === "corporate" }))
  }

  const productOptions = products.map((p: any) => ({ value: p.productID, label: `${p.productName} (${p.riskID})` }))
  const branchOptions = branches.map((b: any) => ({ value: b.branchID, label: b.description || b.branchName || "Unknown Branch" }))
  const agentOptions = agents.map((a: any) => ({ value: a.partyID, label: a.partyName }))
  const mktStaffOptions = mktStaffs.map((m: any) => ({ value: m.mktStaffID, label: m.staffName || `${m.surname} ${m.firstname}` }))
  const customerOptions = customers.map((c: any) => ({ value: c.insuredID, label: `${c.surname || ""} ${c.firstname || ""} ${c.othername || ""} (${c.insuredID})` }))

  return (
    <div className="endorsement-policy-container">
      <div className="endorsement-policy-header">
        <h1>Endorse Policy: {policyNo}</h1>
        <div className="header-actions">
          <Button variant="outline" onClick={() => navigate("/underwriting/endorsements")}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading.createPolicy} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {loading?.createPolicy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Process Endorsement"}
          </Button>
        </div>
      </div>

      {(typeof error === 'string' || (error && (error.createPolicy || error.fetchPolicy))) && (
        <div ref={errorRef} className="validation-errors">
          <h4>Submission Error</h4>
          <p>{typeof error === 'string' ? error : (error.createPolicy || error.fetchPolicy)}</p>
        </div>
      )}

      <div className="relative">
        {!isDataReady && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-sm font-medium text-gray-600">Loading policy data...</p>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="endorsement-policy-form pt-8">
          {/* Form Fields - identical structure but using formData */}
          {/* 1. Policy Info */}
          <div className="form-section">
            <h3>Policy Information</h3>
            <div className="form-grid">
              <div className="form-field">
                <Label>Business Category (Risk) *</Label>
                <Select
                  options={risks.map(r => ({ value: r.riskID, label: r.riskName }))}
                  value={risks.find(r => r.riskID === (currentPolicy?.riskID || "")) ? { value: currentPolicy.riskID, label: risks.find(r => r.riskID === currentPolicy.riskID)?.riskName } : null}
                  isDisabled
                  classNamePrefix="react-select"
                />
              </div>

              <div className="form-field">
                <Label>Subclass (Product) *</Label>
                <Select
                  options={productOptions}
                  onChange={handleProductChange}
                  value={productOptions.find((p) => String(p.value) === String(formData.productID))}
                  isDisabled
                  classNamePrefix="react-select"
                />
              </div>

              <div className="form-field">
                <Label>Select Branch *</Label>
                <Select
                  options={branchOptions}
                  onChange={(opt) => handleSelectChange("branchID", opt?.value || "")}
                  value={branchOptions.find((b) => String(b.value) === String(formData.branchID))}
                  classNamePrefix="react-select"
                />
              </div>

              <div className="form-field">
                <Label>Business Source *</Label>
                <Select
                  options={[{ value: "DIRECT", label: "Direct" }, { value: "BROKER", label: "Broker" }, { value: "AGENT", label: "Agent" }]}
                  value={{ value: formData.bizSource, label: formData.bizSource }}
                  onChange={(opt) => handleSelectChange("bizSource", opt?.value || "")}
                  classNamePrefix="react-select"
                />
              </div>

              {(formData.bizSource === 'BROKER' || formData.bizSource === 'AGENT') && (
                <div className="form-field">
                  <Label>Select {formData.bizSource === 'BROKER' ? 'Broker' : 'Agent'} *</Label>
                  <Select
                    options={agentOptions}
                    onChange={(opt) => handleSelectChange("partyID", opt?.value || "")}
                    value={agentOptions.find((a) => String(a.value) === String(formData.partyID))}
                    classNamePrefix="react-select"
                  />
                </div>
              )}

              <div className="form-field">
                <Label>Marketing Staff</Label>
                <Select
                  options={mktStaffOptions}
                  onChange={(opt) => handleSelectChange("mktStaffID", opt?.value || "")}
                  value={mktStaffOptions.find((m) => String(m.value) === String(formData.mktStaffID))}
                  classNamePrefix="react-select"
                />
              </div>

              <div className="form-field">
                <Label>Business Type</Label>
                <Select
                  options={businessTypeOptions}
                  value={businessTypeOptions.find(o => String(o.value) === String(formData.businessType)) || (formData.businessType ? { label: formData.businessType, value: formData.businessType } : null)}
                  onChange={(opt) => handleSelectChange("businessType", opt?.value || "")}
                  classNamePrefix="react-select"
                />
              </div>
            </div>
          </div>

          {/* 2. Insured Details */}
          <div className="form-section">
            <h3>Insured Details</h3>
            <div className="insured-type-toggle">
              <div className="toggle-buttons">
                <button type="button" className={`toggle-btn ${insuredType === "individual" ? "active" : ""}`} onClick={() => toggleInsuredType("individual")}>Individual</button>
                <button type="button" className={`toggle-btn ${insuredType === "corporate" ? "active" : ""}`} onClick={() => toggleInsuredType("corporate")}>Corporate</button>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <Label>Search Existing Insured</Label>
                <Select options={customerOptions} onInputChange={setCustomerSearch} onChange={handleInsuredSelect} placeholder="Type to search..." classNamePrefix="react-select" />
              </div>

              {insuredType === "individual" ? (
                <>
                  <div className="form-field"><Label>Surname *</Label><Input name="surname" value={formData.surname} onChange={handleInputChange} /></div>
                  <div className="form-field"><Label>First Name *</Label><Input name="firstName" value={formData.firstName} onChange={handleInputChange} /></div>
                  <div className="form-field form-field-full"><Label>Other Names</Label><Input name="otherNames" value={formData.otherNames} onChange={handleInputChange} /></div>
                </>
              ) : (
                <div className="form-field form-field-full"><Label>Company Name *</Label><Input name="surname" value={formData.surname} onChange={handleInputChange} /></div>
              )}

              <div className="form-field"><Label>Address</Label><Input name="insAddress" value={formData.insAddress} onChange={handleInputChange} /></div>
              <div className="form-field"><Label>Mobile Phone</Label><Input name="insMobilePhone" value={formData.insMobilePhone} onChange={handleInputChange} /></div>
              <div className="form-field"><Label>Email</Label><Input name="insEmail" value={formData.insEmail} onChange={handleInputChange} /></div>
              <div className="form-field">
                <Label>Occupation</Label>
                <CreatableSelect
                  options={occupationOptions}
                  onChange={(opt) => handleSelectChange("insOccupation", opt?.label || "")}
                  value={occupationOptions.find((o) => o?.label === formData.insOccupation) || (formData.insOccupation ? { label: formData.insOccupation, value: formData.insOccupation } : null)}
                  classNamePrefix="react-select"
                  isClearable
                />
              </div>
              <div className="form-field form-field-full">
                <Label>Remarks</Label>
                <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} className="form-textarea" rows={3} />
              </div>
            </div>
          </div>

          {/* 3. Coverage Period */}
          <div className="form-section">
            <h3>Coverage Period</h3>
            <div className="form-grid">
              <div className="form-field">
                <Label>Effective Date *</Label>
                <Input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} />
              </div>
              <div className="form-field">
                <Label>Expiry Date *</Label>
                <Input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} />
              </div>
            </div>
          </div>

          <div className="endorsement-policy-footer">
            <Button variant="outline" type="button" onClick={() => navigate("/underwriting/endorsements")}>Cancel</Button>
            <Button type="submit" disabled={loading?.createPolicy} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading?.createPolicy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Process Endorsement"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EndorsementPolicy
