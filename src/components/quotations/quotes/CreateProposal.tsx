//@ts-nocheck
//@ts-nocheck
// @ts-nocheck

import { useEffect, useRef, useState } from "react"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import Select from "react-select"
import CreatableSelect from "react-select/creatable";
import type { RootState } from "../../../features/store"
import { useSelector } from "react-redux"
import { createProposal, clearMessages } from "../../../features/reducers/quoteReducers/quotationSlice"
import { getAllRisks } from "../../../features/reducers/adminReducers/riskSlice"
import { getAllProducts } from "../../../features/reducers/productReducers/productSlice"
import { getAllBranches } from "../../../features/reducers/companyReducers/branchSlice"
import { getAllAgents } from "../../../features/reducers/csuReducers/agentSlice"
import { getAllCustomers } from "@/features/reducers/csuReducers/customerSlice"
import { fetchMktStaffs, selectMarketingStaff } from "@/features/reducers/companyReducers/marketingStaffSlice"

import { Button } from "../../ui/new-button"
import Input from "../../ui/Input"
import { Label } from "../../ui/label"
import type { CreateProposalRequest } from "../../../types/quotation"
import { useAppSelector } from "@/hooks/use-apps"
import {useParams } from "react-router-dom"

import "./CreateProposal.css"

const CreateProposal = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const errorRef = useRef<HTMLDivElement | null>(null)
  const { businessId: businessIdParam } = useParams<{ businessId?: string }>()
  const businessId = businessIdParam ?? null


  const { loading, success, error } = useSelector((state: RootState) => state.quotations)
  const { risks } = useSelector((state: RootState) => state.risks)
  const { products } = useSelector((state: RootState) => state.products)
  const { branches } = useSelector((state: RootState) => state.branches)
  const { customers } = useSelector((state: RootState) => state.customers)
  const { agents } = useSelector((state: RootState) => state.parties)
  const { mktStaffs } = useAppSelector(selectMarketingStaff)

  // customer search state + debounce ref
  const [customerSearch, setCustomerSearch] = useState<string>("")
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [insuredType, setInsuredType] = useState<"individual" | "corporate">("individual")
  const [riskClass, setRiskClass] = useState("")
  const [formData, setFormData] = useState<CreateProposalRequest>({
    subriskID: "",
    branchID: "",
    insuredID: "",
    partyID: "",
    mktStaffID: "",
    startDate: "",
    endDate: "",
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
  })
  const [validationErrors, setValidationErrors] = useState<string[]>([])

useEffect(()=>{
/*   if(businessId && businessId =="Package")
  setRiskClass("");
 */if(businessId)
  setRiskClass(businessId);
  console.log(businessId);
  
},[businessId])

  // Fetch all data on mount
  useEffect(() => {
    dispatch(getAllRisks({ pageNumber: 1, pageSize: 100 }) as any)
    dispatch(getAllBranches() as any)
    dispatch(getAllAgents({ pageNumber: 1, pageSize: 100 }) as any)
    dispatch(fetchMktStaffs() as any)
    dispatch(getAllCustomers({ pageNumber: 1, pageSize: 50, insuredType: insuredType }) as any)
  }, [dispatch])

  // re-fetch customers when insuredType changes
  useEffect(() => {
    dispatch(getAllCustomers({ pageNumber: 1, pageSize: 50, insuredType: insuredType }) as any)
  }, [insuredType, dispatch])

  // debounced search: dispatch when user stops typing for 2s
  useEffect(() => {
    // clear existing timer
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }

    const trimmed = (customerSearch ?? "").trim()

    // only dispatch if user typed something; remove this check if you want empty search to return all
    if (trimmed.length === 0) return

    searchDebounceRef.current = setTimeout(() => {
      dispatch(
        getAllCustomers({
          pageNumber: 1,
          pageSize: 50,
          insuredType,
          searchTerm: trimmed,
        }) as any
      )
    }, 2000)

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
        searchDebounceRef.current = null
      }
    }
  }, [customerSearch, insuredType, dispatch])

  // Fetch products when riskClass changes
  useEffect(() => {
    if (riskClass) {
      dispatch(getAllProducts({ riskId: riskClass, pageNumber: 1, pageSize: 100 }) as any)
    }
  }, [dispatch, riskClass])

  // Navigate after success
  useEffect(() => {
    if (success.createProposal) {
      navigate("/quotations")
      dispatch(clearMessages())
    }
  }, [success.createProposal, navigate, dispatch])

  const handleInputChange = (field: keyof CreateProposalRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (validationErrors.length > 0) setValidationErrors([])
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!riskClass) errors.push("Business category is required")
    if (!formData.branchID) errors.push("Branch is required")
    if (insuredType === "individual") {
      if (!formData.surname) errors.push("Surname is required")
      if (!formData.firstName) errors.push("First name is required")
    } else {
      if (!formData.insuredID) errors.push("Company name is required")
    }
    if (!formData.partyID) errors.push("Agent is required")
    if (!formData.mktStaffID) errors.push("Marketing staff is required")
    if (!formData.startDate) errors.push("Start date is required")
    if (!formData.endDate) errors.push("End date is required")
    if (!formData.insAddress) errors.push("Address is required")
    if (!formData.insMobilePhone) errors.push("Mobile phone is required")
    if (!formData.insEmail) errors.push("Email is required")

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      errors.push("End date must be after start date")
    }

    if (formData.insEmail && !/\S+@\S+\.\S+/.test(formData.insEmail)) {
      errors.push("Please enter a valid email address")
    }

    return errors
  }

  const handleSubmit = () => {
    const errors = validateForm()
    if (errors.length > 0) {
      setValidationErrors(errors)
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      return
    }

    dispatch(createProposal(formData) as any)
  }

  const handleCancel = () => {
    navigate("/quotations")
  }

  // Filtered options
  const filteredProducts = products.filter(p => p.riskID === riskClass)
  const productOptions = filteredProducts.map(p => ({ value: p.productID, label: p.productName }))
  const branchOptions = branches.map(b => ({ value: b.branchID, label: b.description }))
  const agentOptions = agents.map(a => ({ value: a.partyID, label: a.party }))
  const mktStaffOptions = mktStaffs.map(s => ({ value: s.mktStaffID, label: s.staffName }))
  const individualCustomerOptions = customers
    .filter(c => (c.insuredType ?? "").toString().toLowerCase() !== "corporate")
    .map(c => ({
      value: c.insuredID,
      label: c.fullName ? c.fullName : c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : c.firstName ? c.firstName : c.lastName ? c.lastName : c.orgName
    }))
  const companyCustomerOptions = customers
    .filter(c => (c.insuredType ?? "").toString().toLowerCase() === "corporate")
    .map(c => ({ value: c.insuredID, label: c.fullName ?? c.orgName ?? c.insuredID }))

  return (
    <div className="create-proposal-container">
      <div className="create-proposal-header">
        <h1>Create New Quotation </h1>
        <div className="header-actions">
          <Button onClick={handleCancel} variant="outline">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading.createProposal}>
            {loading.createProposal ? "Creating..." : "Create Proposal"}
          </Button>
        </div>
      </div>

      <div className="create-proposal-form" ref={errorRef}>
        {validationErrors.length > 0 && (
          <div className="validation-errors">
            <h4>Please fix the following errors:</h4>
            <ul>
              {validationErrors.map((error, i) => <li key={i}>{error}</li>)}
            </ul>
          </div>
        )}

        {error.createProposal && <div className="error-message">{error.createProposal}</div>}

        {/* Business Information */}
        <div className="form-section">
          <h3>Business Information</h3>
          <div className="form-grid">
            <div className="form-field">
              <Label htmlFor="riskClass">Business Category *</Label>
              <Select
                options={risks.map(r => ({ value: r.riskID, label: r.riskName }))}
                value={riskClass ? { value: riskClass, label: risks.find(r => r.riskID === riskClass)?.riskName } : null}
                onChange={opt => setRiskClass(opt?.value ?? "")}
                placeholder="Select Business Category"
                isDisabled={
                  businessId !== "All" &&
/*                   businessId !== "Package" &&
 */                  businessId !== null
                }
                                isClearable
              />
            </div>

            <div className="form-field">
              <Label htmlFor="subriskID">Subclass / Product *</Label>
              <Select
                options={productOptions}
                value={productOptions.find(p => p.value === formData.subriskID) || null}
                onChange={opt => handleInputChange("subriskID", opt?.value ?? "")}
                placeholder="Select Subclass"
                isDisabled={!riskClass}
                isClearable
              />
            </div>

            <div className="form-field">
              <Label htmlFor="branchID">Branch *</Label>
              <Select
                options={branchOptions}
                value={branchOptions.find(b => b.value === formData.branchID) || null}
                onChange={opt => handleInputChange("branchID", opt?.value ?? "")}
                placeholder="Select Branch"
              />
            </div>

            <div className="form-field">
              <Label htmlFor="bizSource">Business Source *</Label>
              <Select
                options={[
                  { value: "DIRECT", label: "Direct" },
                  { value: "BROKER", label: "Broker" },
                  { value: "AGENT", label: "Agent" }
                ]}
                value={{ value: formData.bizSource, label: formData.bizSource }}
                onChange={opt => handleInputChange("bizSource", opt?.value ?? "DIRECT")}
              />
            </div>
          </div>
        </div>

        {/* Insured Information */}
        <div className="form-section">
          <h3>Insured Information</h3>

          <div className="insured-type-toggle">
            <Label>Insured Type</Label>
            <div className="toggle-buttons">
              <button
                type="button"
                className={`toggle-btn ${insuredType === "individual" ? "active" : ""}`}
                onClick={() => { setInsuredType("individual"); setFormData(prev => ({ ...prev, isOrg: false }));     handleInputChange("insuredID", "");
                handleInputChange("surname", "");
                handleInputChange("firstName", "");
                handleInputChange("insAddress", "");
                handleInputChange("insEmail", "");
                handleInputChange("insMobilePhone","");
             }}
              >
                Individual
              </button>
              <button
                type="button"
                className={`toggle-btn ${insuredType === "corporate" ? "active" : ""}`}
                onClick={() => { setInsuredType("corporate"); setFormData(prev => ({ ...prev, isOrg: true }));handleInputChange("insuredID", "");
                handleInputChange("insAddress", "");
                handleInputChange("insEmail", "");
                handleInputChange("insMobilePhone","");
                 }}
              >
                Corporate
              </button>
            </div>
          </div>

          <div className="form-grid">
            {insuredType === "individual" ? (
              <>
                <div className="form-field form-field-full">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <CreatableSelect
  options={individualCustomerOptions}
  inputValue={customerSearch}
  onInputChange={(value, { action }) => {
    if (action === "input-change" || action === "input-blur" || action === "menu-close") {
      setCustomerSearch(value);
    }
  }}
  value={
    individualCustomerOptions.find((c) => c.value === formData.insuredID) ||
    (formData.insuredID ? { label: formData.insuredID, value: formData.insuredID } : null)
  }
  onChange={(opt: any) => {
    // opt will be null or { label, value }
    if (!opt) {
      handleInputChange("insuredID", "");
      handleInputChange("surname", "");
      handleInputChange("firstName", "");
      setCustomerSearch("");
      return;
    }

    // if this option corresponds to an existing customer record, populate extra fields
    const customer = customers.find((c) => c.insuredID === opt.value);
    if (customer) {
      handleInputChange("insuredID", customer.insuredID);
      handleInputChange("surname", customer.surname ?? "");
      handleInputChange("firstName", customer.firstName ?? "");
      handleInputChange("insAddress", customer.address ?? "");
      handleInputChange("insEmail", customer.email ?? "");
      handleInputChange("insMobilePhone", customer.mobilePhone || "");

    } else {
      // it was a creatable/custom value — store it and clear name fields (or set them from opt.label if you want)
      handleInputChange("insuredID", opt.value);
      handleInputChange("surname", "");
      handleInputChange("firstName", "");
      handleInputChange("insAddress", "");
      handleInputChange("insEmail", "");
      handleInputChange("insMobilePhone","");
      setIndividualCustomerOptions(prev => [...prev, { label: opt.label ?? opt.value, value: opt.value }]);
    }

    setCustomerSearch("");
  }}
  onCreateOption={(inputValue: string) => {
    // triggered when user types a new value and hits Enter (or the create button)
    handleInputChange("insuredID", inputValue);
    handleInputChange("surname", "");
    handleInputChange("firstName", "");
    handleInputChange("insAddress","");
    handleInputChange("insEmail","");
    handleInputChange("insMobilePhone","");
    setCustomerSearch("");

    // OPTIONAL: persist the created option into your options state so it appears in future selections
    // setIndividualCustomerOptions(prev => [...prev, { label: inputValue, value: inputValue }]);
  }}
  placeholder="Type to search customers..."
  isClearable
/>                </div>

                <div className="form-field">
                  <Label htmlFor="surname">Surname *</Label>
                  <Input
                    id="surname"
                    value={formData.surname}
                    onChange={e => handleInputChange("surname", e.target.value)}
                    placeholder="Enter surname"
                  />
                </div>

                <div className="form-field">
                  <Label htmlFor="firstname">First Name *</Label>
                  <Input
                    id="firstname"
                    value={formData.firstName}
                    onChange={e => handleInputChange("firstName", e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
              </>
            ) : (
              <div className="form-field form-field-full">
                <Label htmlFor="companyName">Company Name *</Label>
                <CreatableSelect
  options={companyCustomerOptions}
  inputValue={customerSearch} // reuse same search state or separate if you prefer
  onInputChange={(value, { action }) => {
    if (action === "input-change" || action === "input-blur" || action === "menu-close") {
      setCustomerSearch(value);
    }
  }}
  value={
    companyCustomerOptions.find((c) => c.value === formData.insuredID) ||
    (formData.insuredID ? { label: formData.insuredID, value: formData.insuredID } : null)
  }
  onChange={(opt: any) => {
    if (!opt) {
      handleInputChange("insuredID", "");
      handleInputChange("insAddress", "");
      handleInputChange("insMobilePhone", "");
      handleInputChange("insEmail", "");
      return;
    }

    const customer = customers.find((c) => c.insuredID === opt.value);
    if (customer) {
      handleInputChange("insuredID", customer.insuredID);
      handleInputChange("insAddress", customer.address ?? "");
      handleInputChange("insEmail", customer.email ?? "");
      handleInputChange("insMobilePhone", customer.mobilePhone || "");
    } else {
      // created/custom company value
      handleInputChange("insuredID", opt.value);
      handleInputChange("insAddress", "");
      handleInputChange("insMobilePhone", "");
      handleInputChange("insEmail", "");
      // OPTIONAL: add the new option:
      // setCompanyCustomerOptions(prev => [...prev, { label: opt.label ?? opt.value, value: opt.value }]);
    }
  }}
  onCreateOption={(inputValue: string) => {
    handleInputChange("insuredID", inputValue);
    handleInputChange("insAddress", "");
    handleInputChange("insMobilePhone", "");
    handleInputChange("insEmail", "");
    setCustomerSearch("");
    // OPTIONAL: persist created option
    // setCompanyCustomerOptions(prev => [...prev, { label: inputValue, value: inputValue }]);
  }}
  placeholder="Select Company"
  isClearable
/>              </div>
            )}

            <div className="form-field form-field-full">
              <Label htmlFor="insAddress">Address *</Label>
              <textarea
                id="insAddress"
                value={formData.insAddress}
                onChange={e => handleInputChange("insAddress", e.target.value)}
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
                onChange={e => handleInputChange("insMobilePhone", e.target.value)}
                placeholder="Enter mobile phone"
              />
            </div>

            <div className="form-field">
              <Label htmlFor="insEmail">Email *</Label>
              <Input
                id="insEmail"
                type="email"
                value={formData.insEmail}
                onChange={e => handleInputChange("insEmail", e.target.value)}
                placeholder="Enter email"
              />
            </div>

            <div className="form-field">
              <Label htmlFor="insOccupation">Occupation</Label>
              <Input
                id="insOccupation"
                value={formData.insOccupation}
                onChange={e => handleInputChange("insOccupation", e.target.value)}
                placeholder="Enter occupation"
              />
            </div>
          </div>
        </div>

        {/* Agent & Marketing Staff */}
        <div className="form-section">
          <h3>Agent & Marketing Information</h3>
          <div className="form-grid">
            <div className="form-field">
              <Label htmlFor="partyID">Agent *</Label>
              <Select
                options={agentOptions}
                value={agentOptions.find(a => a.value === formData.partyID) || null}
                onChange={opt => handleInputChange("partyID", opt?.value ?? "")}
                placeholder="Select Agent"
                isClearable
              />
            </div>

            <div className="form-field">
              <Label htmlFor="mktStaffID">Marketing Staff *</Label>
              <Select
                options={mktStaffOptions}
                value={mktStaffOptions.find(s => s.value === formData.mktStaffID) || null}
                onChange={opt => handleInputChange("mktStaffID", opt?.value ?? "")}
                placeholder="Select Marketing Staff"
                isClearable
              />
            </div>
          </div>
        </div>

        {/* Policy Period */}
        <div className="form-section">
          <h3>Policy Period</h3>
          <div className="form-grid">
          <div className="form-field">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
  id="startDate"
  type="date"
  value={formData.startDate}
  onChange={(e) => {
    const start = e.target.value;
    handleInputChange("startDate", start);

    if (start) {
      const startDateObj = new Date(start);
      const endDateObj = new Date(startDateObj);
      endDateObj.setFullYear(endDateObj.getFullYear() + 1);

      const endDateFormatted = endDateObj.toISOString().split("T")[0];
      handleInputChange("endDate", endDateFormatted);
    } else {
      handleInputChange("endDate", "");
    }
  }}
/>            </div>
<div className="form-field">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={e => handleInputChange("endDate", e.target.value)}
                disabled
              />
            </div>
            <div className="form-field">
              <Label htmlFor="proportionRate">Proportion Rate (%)</Label>
              <Input
                id="proportionRate"
                type="number"
                min={0}
                max={100}
                value={formData.proportionRate}
                onChange={e => handleInputChange("proportionRate", Number(e.target.value))}
                disabled
              />
            </div>

            <div className="form-field">
              <Label htmlFor="currency">Currency</Label>
              <Select
                options={[
                  { value: "NGN", label: "NGN - Nigerian Naira" },
                  { value: "USD", label: "USD - US Dollar" },
                  { value: "EUR", label: "EUR - Euro" },
                  { value: "GBP", label: "GBP - British Pound" }
                ]}
                value={{ value: formData.currency, label: formData.currency }}
                onChange={opt => handleInputChange("currency", opt?.value ?? "NGN")}
              />
            </div>


            <div className="form-field">
              <Label htmlFor="exRate">Exchange Rate</Label>
              <Input
                id="exRate"
                type="number"
                min={0}
                step={0.01}
                value={formData.exRate}
                onChange={e => handleInputChange("exRate", Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="footer-actions">
          <Button onClick={handleCancel} variant="outline">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading.createProposal}>
            {loading.createProposal ? "Creating..." : "Create Proposal"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CreateProposal
