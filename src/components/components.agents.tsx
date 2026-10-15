//@ts-nocheck
"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "../hooks/use-apps"
import { Button } from "./UI/new-button"
import Input from "./UI/Input"
import { Label } from "./UI/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./UI/dialog"
import {
  selectUiState,
  setShowCreateAgentDialog,
  setShowEditAgentDialog,
  setShowAgentDetailsDialog,
} from "../features/reducers/uiReducers/uiSlice"
import {
  createAgent,
  updateAgent,
  selectAgentState,
  clearMessages,
  getAllAgents,
  getUnits,
} from "../features/reducers/csuReducers/agentSlice"
import type { CreateAgentRequest } from "../types/agent"
import "./components.agents.css"
import {Eye, EyeOff} from "lucide-react"

const PasswordInput = ({ value, onChange, placeholder, className }: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
}) => {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`pr-10 ${className || ""}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

const emptyAgentForm: CreateAgentRequest = {
  UnitId: "",
  AgentName: "",
  Address: "",
  Area: "",
  City: "",
  State: "",
  Phone1: "",
  Phone2: "",
  FaxNo: "",
  Email: "",
  InsPerson: "",
  FinPerson: "",
  Balance: 0,
  CreditLimit: 0,
  ComRate: 0,
  Remark: "",
  AccountNo: "",
  BankName: "",
  Tag: "",
  Password: "",
  Files: [],
}

export const CreateAgent = () => {
  const dispatch = useAppDispatch()
  const { showCreateAgentDialog } = useAppSelector(selectUiState)
  const { loading, success, error, units } = useAppSelector(selectAgentState)

  const [formData, setFormData] = useState<CreateAgentRequest>(emptyAgentForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (showCreateAgentDialog && (!units || units.length === 0)) {
      dispatch(getUnits())
    }
  }, [showCreateAgentDialog, units, dispatch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}

    if (!formData.UnitId.trim()) newErrors.UnitId = "Unit is required"
    if (!formData.AgentName.trim()) newErrors.AgentName = "Agent name is required"
    if (!formData.Address.trim()) newErrors.Address = "Address is required"
    if (!formData.Phone1.trim()) newErrors.Phone1 = "Primary phone is required"
    if (!formData.Password.trim()) newErrors.Password = "Password is required"
    if (formData.Email && !/\S+@\S+\.\S+/.test(formData.Email)) {
      newErrors.Email = "Please enter a valid email address"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    dispatch(createAgent(formData))
  }

  const handleClose = () => {
    setFormData(emptyAgentForm)
    setErrors({})
    dispatch(setShowCreateAgentDialog(false))
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  useEffect(() => {
    if (success.createAgent) {
      handleClose()
      dispatch(clearMessages())
      dispatch(getAllAgents({ pageNumber: 1, pageSize: 10 }))
    }
  }, [success.createAgent, dispatch])

  return (
    <Dialog open={showCreateAgentDialog} onOpenChange={handleClose}>
      <DialogContent className="ca-create-agent-dialog max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="ca-agent-form">
          {/* Basic Information */}
          <div className="ca-form-section">
            <h3 className="ca-section-title">Basic Information</h3>
            <div className="ca-form-grid">
              <div className="ca-form-field">
                <Label htmlFor="unitId">Unit *</Label>
                <select
                  id="unitId"
                  value={formData.UnitId}
                  onChange={(e) => handleInputChange("UnitId", e.target.value)}
                  className={`ca-select ${errors.UnitId ? "ca-error" : ""}`}
                >
                  <option value="">Select Unit</option>
                  {(units || []).map((u: any) => (
                    <option key={u.unitID} value={u.unitID}>
                      {u.unitID} - {u.unitName}
                    </option>
                  ))}
                </select>
                {errors.UnitId && <span className="ca-error-text">{errors.UnitId}</span>}
              </div>
              <div className="ca-form-field ca-full-width">
                <Label htmlFor="agentName">Agent Name *</Label>
                <Input
                  id="agentName"
                  value={formData.AgentName}
                  onChange={(e) => handleInputChange("AgentName", e.target.value)}
                  placeholder="Enter agent name"
                  className={errors.AgentName ? "ca-error" : ""}
                />
                {errors.AgentName && <span className="ca-error-text">{errors.AgentName}</span>}
              </div>
              <div className="ca-form-field">
                <Label htmlFor="area">Area</Label>
                <Input
                  id="area"
                  value={formData.Area}
                  onChange={(e) => handleInputChange("Area", e.target.value)}
                  placeholder="Enter area"
                />
              </div>
              <div className="ca-form-field">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.City}
                  onChange={(e) => handleInputChange("City", e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              <div className="ca-form-field">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.State}
                  onChange={(e) => handleInputChange("State", e.target.value)}
                  placeholder="Enter state"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="ca-form-section">
            <h3 className="ca-section-title">Contact Information</h3>
            <div className="ca-form-grid">
              <div className="ca-form-field">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.Email}
                  onChange={(e) => handleInputChange("Email", e.target.value)}
                  placeholder="Enter email address"
                  className={errors.Email ? "ca-error" : ""}
                />
                {errors.Email && <span className="ca-error-text">{errors.Email}</span>}
              </div>
              <div className="ca-form-field">
                <Label htmlFor="phone1">Phone 1 *</Label>
                <Input
                  id="phone1"
                  value={formData.Phone1}
                  onChange={(e) => handleInputChange("Phone1", e.target.value)}
                  placeholder="Enter primary phone number"
                  className={errors.Phone1 ? "ca-error" : ""}
                />
                {errors.Phone1 && <span className="ca-error-text">{errors.Phone1}</span>}
              </div>
              <div className="ca-form-field">
                <Label htmlFor="phone2">Phone 2</Label>
                <Input
                  id="phone2"
                  value={formData.Phone2}
                  onChange={(e) => handleInputChange("Phone2", e.target.value)}
                  placeholder="Enter secondary phone number"
                />
              </div>
              <div className="ca-form-field">
                <Label htmlFor="faxNo">Fax</Label>
                <Input
                  id="faxNo"
                  value={formData.FaxNo}
                  onChange={(e) => handleInputChange("FaxNo", e.target.value)}
                  placeholder="Enter fax number"
                />
              </div>
            </div>

            <div className="ca-form-field">
              <Label htmlFor="address">Address *</Label>
              <textarea
                id="address"
                value={formData.Address}
                onChange={(e) => handleInputChange("Address", e.target.value)}
                placeholder="Enter full address"
                className={`ca-textarea ${errors.Address ? "ca-error" : ""}`}
                rows={3}
              />
              {errors.Address && <span className="ca-error-text">{errors.Address}</span>}
            </div>
          </div>

          {/* Business Information */}
          <div className="ca-form-section">
            <h3 className="ca-section-title">Business Information</h3>
            <div className="ca-form-grid">
              <div className="ca-form-field">
                <Label htmlFor="insPerson">Insurance Contact</Label>
                <Input
                  id="insPerson"
                  value={formData.InsPerson}
                  onChange={(e) => handleInputChange("InsPerson", e.target.value)}
                  placeholder="Enter insurance contact"
                />
              </div>
              <div className="ca-form-field">
                <Label htmlFor="finPerson">Finance Contact</Label>
                <Input
                  id="finPerson"
                  value={formData.FinPerson}
                  onChange={(e) => handleInputChange("FinPerson", e.target.value)}
                  placeholder="Enter finance contact"
                />
              </div>
              <div className="ca-form-field">
                <Label htmlFor="accountNo">Account Number</Label>
                <Input
                  id="accountNo"
                  value={formData.AccountNo}
                  onChange={(e) => handleInputChange("AccountNo", e.target.value)}
                  placeholder="Enter account number"
                />
              </div>
              <div className="ca-form-field">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={formData.BankName}
                  onChange={(e) => handleInputChange("BankName", e.target.value)}
                  placeholder="Enter bank name"
                />
              </div>
              <div className="ca-form-field">
                <Label htmlFor="balance">Opening Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  value={formData.Balance}
                  onChange={(e) => handleInputChange("Balance", Number.parseFloat(e.target.value) || 0)}
                  placeholder="Enter opening balance"
                />
              </div>
              <div className="ca-form-field">
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={formData.CreditLimit}
                  onChange={(e) => handleInputChange("CreditLimit", Number.parseFloat(e.target.value) || 0)}
                  placeholder="Enter credit limit"
                />
              </div>
              <div className="ca-form-field">
                <Label htmlFor="comRate">Commission Rate (%)</Label>
                <Input
                  id="comRate"
                  type="number"
                  step="0.01"
                  value={formData.ComRate}
                  onChange={(e) => handleInputChange("ComRate", Number.parseFloat(e.target.value) || 0)}
                  placeholder="Enter commission rate"
                />
              </div>
              <div className="ca-form-field">
                <Label htmlFor="tag">Tag</Label>
                <Input
                  id="tag"
                  value={formData.Tag}
                  onChange={(e) => handleInputChange("Tag", e.target.value)}
                  placeholder="Enter tag"
                />
              </div>
              <div className="ca-form-field">
  <Label htmlFor="password">Password *</Label>
  <PasswordInput
    value={formData.Password}
    onChange={(e) => handleInputChange("Password", e.target.value)}
    placeholder="Enter portal password"
    className={errors.Password ? "ca-error" : ""}
  />
  {errors.Password && <span className="ca-error-text">{errors.Password}</span>}
</div>
            </div>

            <div className="ca-form-field">
              <Label htmlFor="remark">Remarks</Label>
              <textarea
                id="remark"
                value={formData.Remark}
                onChange={(e) => handleInputChange("Remark", e.target.value)}
                placeholder="Enter remarks"
                className="ca-textarea"
                rows={2}
              />
            </div>

            <div className="ca-form-field">
              <Label htmlFor="files">Attachments</Label>
              <input
                id="files"
                type="file"
                multiple
                onChange={(e) => handleInputChange("Files", Array.from(e.target.files || []))}
              />
            </div>
          </div>

          {error.createAgent && <div className="ca-error-message">{error.createAgent}</div>}

          <div className="ca-form-actions">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading.createAgent}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading.createAgent} className="ca-submit-btn">
              {loading.createAgent ? "Creating..." : "Create Agent"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const EditAgent = () => {
  const dispatch = useAppDispatch()
  const { showEditAgentDialog } = useAppSelector(selectUiState)
  const { currentAgent, loading, success, error, units } = useAppSelector(selectAgentState)

  const [formData, setFormData] = useState({
    unitID: "",
    agent: "",
    address: "",
    area: "",
    city: "",
    state: "",
    phone1: "",
    phone2: "",
    faxNo: "",
    email: "",
    insPerson: "",
    finPerson: "",
    balance: 0,
    creditLimit: 0,
    comRate: 0,
    remark: "",
    accountNo: "",
    bankname: "",
    tag: "",
    passwords: "",
    isVerified: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (showEditAgentDialog && (!units || units.length === 0)) {
      dispatch(getUnits())
    }
  }, [showEditAgentDialog, units, dispatch])

  useEffect(() => {
    if (currentAgent && showEditAgentDialog) {
      setFormData({
        unitID: currentAgent.unitID || "",
        agent: currentAgent.agent || "",
        address: currentAgent.address || "",
        area: currentAgent.area || "",
        city: currentAgent.city || "",
        state: currentAgent.state || "",
        phone1: currentAgent.phone1 || "",
        phone2: currentAgent.phone2 || "",
        faxNo: currentAgent.faxNo || "",
        email: currentAgent.email || "",
        insPerson: currentAgent.insPerson || "",
        finPerson: currentAgent.finPerson || "",
        balance: currentAgent.balance || 0,
        creditLimit: currentAgent.creditLimit || 0,
        comRate: currentAgent.comRate || 0,
        remark: currentAgent.remark || "",
        accountNo: currentAgent.accountno || "",
        bankname: currentAgent.bankname || "",
        tag: currentAgent.tag || "",
        passwords: "",
        isVerified: !!currentAgent.isVerified,
      })
    }
  }, [currentAgent, showEditAgentDialog])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentAgent) return

    const newErrors: Record<string, string> = {}

    if (!formData.agent.trim()) newErrors.agent = "Agent name is required"
    if (!formData.address.trim()) newErrors.address = "Address is required"
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    dispatch(
      updateAgent({
        agentId: currentAgent.agentID,
        agentData: { agentID: currentAgent.agentID, ...formData },
      }),
    )
  }

  const handleClose = () => {
    setErrors({})
    dispatch(setShowEditAgentDialog(false))
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  useEffect(() => {
    if (success.updateAgent) {
      handleClose()
      dispatch(clearMessages())
      dispatch(getAllAgents({ pageNumber: 1, pageSize: 10 }))
    }
  }, [success.updateAgent, dispatch])

  if (!currentAgent) return null

  return (
    <Dialog open={showEditAgentDialog} onOpenChange={handleClose}>
      <DialogContent className="ea-edit-agent-dialog max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Agent - {currentAgent.agentID}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="ea-agent-form">
          {/* Basic Information */}
          <div className="ea-form-section">
            <h3 className="ea-section-title">Basic Information</h3>
            <div className="ea-form-grid">
              <div className="ea-form-field">
                <Label htmlFor="editUnitID">Unit</Label>
                <select
                  id="editUnitID"
                  value={formData.unitID}
                  onChange={(e) => handleInputChange("unitID", e.target.value)}
                  className="ea-select"
                >
                  <option value="">Select Unit</option>
                  {(units || []).map((u: any) => (
                    <option key={u.unitID} value={u.unitID}>
                      {u.unitID} - {u.unitName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ea-form-field ca-full-width">
                <Label htmlFor="editAgent">Agent Name *</Label>
                <Input
                  id="editAgent"
                  value={formData.agent}
                  onChange={(e) => handleInputChange("agent", e.target.value)}
                  placeholder="Enter agent name"
                  className={errors.agent ? "ea-error" : ""}
                />
                {errors.agent && <span className="ea-error-text">{errors.agent}</span>}
              </div>
              <div className="ea-form-field">
                <Label htmlFor="editArea">Area</Label>
                <Input
                  id="editArea"
                  value={formData.area}
                  onChange={(e) => handleInputChange("area", e.target.value)}
                  placeholder="Enter area"
                />
              </div>
              <div className="ea-form-field">
                <Label htmlFor="editCity">City</Label>
                <Input
                  id="editCity"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              <div className="ea-form-field">
                <Label htmlFor="editState">State</Label>
                <Input
                  id="editState"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  placeholder="Enter state"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="ea-form-section">
            <h3 className="ea-section-title">Contact Information</h3>
            <div className="ea-form-grid">
              <div className="ea-form-field">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                  className={errors.email ? "ea-error" : ""}
                />
                {errors.email && <span className="ea-error-text">{errors.email}</span>}
              </div>
              <div className="ea-form-field">
                <Label htmlFor="editPhone1">Phone 1</Label>
                <Input
                  id="editPhone1"
                  value={formData.phone1}
                  onChange={(e) => handleInputChange("phone1", e.target.value)}
                  placeholder="Enter primary phone number"
                />
              </div>
              <div className="ea-form-field">
                <Label htmlFor="editPhone2">Phone 2</Label>
                <Input
                  id="editPhone2"
                  value={formData.phone2}
                  onChange={(e) => handleInputChange("phone2", e.target.value)}
                  placeholder="Enter secondary phone number"
                />
              </div>
              <div className="ea-form-field">
                <Label htmlFor="editFaxNo">Fax</Label>
                <Input
                  id="editFaxNo"
                  value={formData.faxNo}
                  onChange={(e) => handleInputChange("faxNo", e.target.value)}
                  placeholder="Enter fax number"
                />
              </div>
            </div>

            <div className="ea-form-field">
              <Label htmlFor="editAddress">Address *</Label>
              <textarea
                id="editAddress"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter full address"
                className={`ea-textarea ${errors.address ? "ea-error" : ""}`}
                rows={3}
              />
              {errors.address && <span className="ea-error-text">{errors.address}</span>}
            </div>
          </div>

          {/* Business Information */}
          <div className="ea-form-section">
            <h3 className="ea-section-title">Business Information</h3>
            <div className="ea-form-grid">
              <div className="ea-form-field">
                <Label htmlFor="editInsPerson">Insurance Contact</Label>
                <Input
                  id="editInsPerson"
                  value={formData.insPerson}
                  onChange={(e) => handleInputChange("insPerson", e.target.value)}
                  placeholder="Enter insurance contact"
                />
              </div>
              <div className="ea-form-field">
                <Label htmlFor="editFinPerson">Finance Contact</Label>
                <Input
                  id="editFinPerson"
                  value={formData.finPerson}
                  onChange={(e) => handleInputChange("finPerson", e.target.value)}
                  placeholder="Enter finance contact"
                />
              </div>
              <div className="ea-form-field">
                <Label htmlFor="editAccountNo">Account Number</Label>
                <Input
                  id="editAccountNo"
                  value={formData.accountNo}
                  onChange={(e) => handleInputChange("accountNo", e.target.value)}
                  placeholder="Enter account number"
                />
              </div>
              <div className="ea-form-field">
                <Label htmlFor="editBankname">Bank Name</Label>
                <Input
                  id="editBankname"
                  value={formData.bankname}
                  onChange={(e) => handleInputChange("bankname", e.target.value)}
                  placeholder="Enter bank name"
                />
              </div>
              <div className="ea-form-field">
                <Label htmlFor="editBalance">Balance</Label>
                <Input
                  id="editBalance"
                  type="number"
                  value={formData.balance}
                  onChange={(e) => handleInputChange("balance", Number.parseFloat(e.target.value) || 0)}
                  placeholder="Enter balance"
                />
              </div>
              <div className="ea-form-field">
                <Label htmlFor="editCreditLimit">Credit Limit</Label>
                <Input
                  id="editCreditLimit"
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => handleInputChange("creditLimit", Number.parseFloat(e.target.value) || 0)}
                  placeholder="Enter credit limit"
                />
              </div>
              <div className="ea-form-field">
                <Label htmlFor="editComRate">Commission Rate (%)</Label>
                <Input
                  id="editComRate"
                  type="number"
                  step="0.01"
                  value={formData.comRate}
                  onChange={(e) => handleInputChange("comRate", Number.parseFloat(e.target.value) || 0)}
                  placeholder="Enter commission rate"
                />
              </div>
              <div className="ea-form-field">
                <Label htmlFor="editTag">Tag</Label>
                <Input
                  id="editTag"
                  value={formData.tag}
                  onChange={(e) => handleInputChange("tag", e.target.value)}
                  placeholder="Enter tag"
                />
              </div>
              <div className="ea-form-field">
  <Label htmlFor="editPasswords">New Password</Label>
  <PasswordInput
    value={formData.passwords}
    onChange={(e) => handleInputChange("passwords", e.target.value)}
    placeholder="Leave blank to keep current password"
  />
</div>
            </div>

            <div className="ea-form-field">
              <Label htmlFor="editRemark">Remarks</Label>
              <textarea
                id="editRemark"
                value={formData.remark}
                onChange={(e) => handleInputChange("remark", e.target.value)}
                placeholder="Enter remarks"
                className="ea-textarea"
                rows={2}
              />
            </div>
          </div>

          {/* Status */}
          <div className="ea-form-section">
            <h3 className="ea-section-title">Status</h3>
            <div className="ea-form-field">
              <label className="ea-checkbox-option">
                <input
                  type="checkbox"
                  checked={formData.isVerified}
                  onChange={(e) => handleInputChange("isVerified", e.target.checked)}
                />
                <span className="ea-checkbox-label">Verified Agent</span>
              </label>
            </div>
          </div>

          {error.updateAgent && <div className="ea-error-message">{error.updateAgent}</div>}

          <div className="ea-form-actions">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading.updateAgent}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading.updateAgent} className="ea-submit-btn">
              {loading.updateAgent ? "Updating..." : "Update Agent"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const AgentDetails = () => {
  const dispatch = useAppDispatch()
  const { showAgentDetailsDialog } = useAppSelector(selectUiState)
  const { currentAgent, loading } = useAppSelector(selectAgentState)

  const handleClose = () => {
    dispatch(setShowAgentDetailsDialog(false))
  }

  if (!currentAgent) return null

  const formatDate = (dateString: string | null) => {
    if (!dateString || dateString === "1900-01-01T00:00:00") return "N/A"
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "₦0"
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Dialog open={showAgentDetailsDialog} onOpenChange={handleClose}>
      <DialogContent className="ad-agent-details-dialog max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agent Details - {currentAgent.agentID}</DialogTitle>
        </DialogHeader>

        <div className="ad-agent-content">
          {/* Agent Header */}
          <div className="ad-agent-header">
            <div className="ad-agent-avatar">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="ad-agent-info">
              <h2 className="ad-agent-name">{currentAgent.agent || "N/A"}</h2>
              <div className="ad-agent-meta">
                <span className="ad-type-badge">Unit: {currentAgent.unitID || "N/A"}</span>
                <span className="ad-agent-id">ID: {currentAgent.agentID}</span>
                <span className={`ad-status-badge ${currentAgent.deleted === 1 ? "ad-inactive" : "ad-active"}`}>
                  {currentAgent.deleted === 1 ? "Inactive" : "Active"}
                </span>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="ad-section">
            <h3 className="ad-section-title">Basic Information</h3>
            <div className="ad-info-grid">
              <div className="ad-info-item">
                <span className="ad-label">Agent ID:</span>
                <span className="ad-value">{currentAgent.agentID}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Unit ID:</span>
                <span className="ad-value">{currentAgent.unitID || "N/A"}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Area:</span>
                <span className="ad-value">{currentAgent.area || "N/A"}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">City:</span>
                <span className="ad-value">{currentAgent.city || "N/A"}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">State:</span>
                <span className="ad-value">{currentAgent.state || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="ad-section">
            <h3 className="ad-section-title">Contact Information</h3>
            <div className="ad-info-grid">
              <div className="ad-info-item">
                <span className="ad-label">Email:</span>
                <span className="ad-value">{currentAgent.email || "N/A"}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Phone 1:</span>
                <span className="ad-value">{currentAgent.phone1 || "N/A"}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Phone 2:</span>
                <span className="ad-value">{currentAgent.phone2 || "N/A"}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Fax:</span>
                <span className="ad-value">{currentAgent.faxNo || "N/A"}</span>
              </div>
            </div>
            <div className="ad-info-item ad-full-width">
              <span className="ad-label">Address:</span>
              <span className="ad-value">{currentAgent.address || "N/A"}</span>
            </div>
          </div>

          {/* Business Information */}
          <div className="ad-section">
            <h3 className="ad-section-title">Business Information</h3>
            <div className="ad-info-grid">
              <div className="ad-info-item">
                <span className="ad-label">Insurance Contact:</span>
                <span className="ad-value">{currentAgent.insPerson || "N/A"}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Finance Contact:</span>
                <span className="ad-value">{currentAgent.finPerson || "N/A"}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Balance:</span>
                <span className="ad-value">{formatCurrency(currentAgent.balance)}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Credit Limit:</span>
                <span className="ad-value">{formatCurrency(currentAgent.creditLimit)}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Commission Rate:</span>
                <span className="ad-value">{currentAgent.comRate || 0}%</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Account Number:</span>
                <span className="ad-value">{currentAgent.accountno || "N/A"}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Bank Name:</span>
                <span className="ad-value">{currentAgent.bankname || "N/A"}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Tag:</span>
                <span className="ad-value">{currentAgent.tag || "N/A"}</span>
              </div>
            </div>
            {currentAgent.remark && (
              <div className="ad-info-item ad-full-width">
                <span className="ad-label">Remarks:</span>
                <span className="ad-value">{currentAgent.remark}</span>
              </div>
            )}
          </div>

          {/* System Information */}
          <div className="ad-section">
            <h3 className="ad-section-title">System Information</h3>
            <div className="ad-info-grid">
              <div className="ad-info-item">
                <span className="ad-label">Submitted By:</span>
                <span className="ad-value">{currentAgent.submittedBy || "N/A"}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Submitted On:</span>
                <span className="ad-value">{formatDate(currentAgent.submittedOn)}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Modified By:</span>
                <span className="ad-value">{currentAgent.modifiedBy || "N/A"}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Modified On:</span>
                <span className="ad-value">{formatDate(currentAgent.modifiedOn)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="ad-form-actions">
          <Button onClick={handleClose} className="ad-close-btn">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
