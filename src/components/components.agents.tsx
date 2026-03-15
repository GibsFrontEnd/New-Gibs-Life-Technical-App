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
  selectAgents,
  clearMessages,
  getAllAgents,
} from "../features/reducers/csuReducers/agentSlice"
import type { CreateAgentRequest } from "../types/agent"
import "./components.agents.css"

export const CreateAgent = () => {
  const dispatch = useAppDispatch()
  const { showCreateAgentDialog } = useAppSelector(selectUiState)
  const { loading, success, error } = useAppSelector(selectAgents)

  const [formData, setFormData] = useState<CreateAgentRequest>({
    PartyID: "",
    StateID: "",
    Party: "",
    Description: "",
    PartyType: "FP",
    Address: "",
    mobilePhone: "",
    LandPhone: "",
    Email: "",
    Fax: "",
    InsContact: "",
    FinContact: "",
    CreditLimit: 0,
    ComRate: 0,
    StartDate: new Date().toISOString().split("T")[0],
    ExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    Remarks: "",
    Tag: "",
    Deleted: 0,
    Active: 1,
    SubmittedBy: new Date().toISOString(),
    ModifiedBy: new Date().toISOString(),
    Z_NAICOM_ID: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}

    if (!formData.PartyID.trim()) newErrors.PartyID = "Party ID is required"
    if (!formData.Party.trim()) newErrors.Party = "Party name is required"
    if (!formData.Address.trim()) newErrors.Address = "Address is required"
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
    setFormData({
      PartyID: "",
      StateID: "",
      Party: "",
      Description: "",
      PartyType: "FP",
      Address: "",
      mobilePhone: "",
      LandPhone: "",
      Email: "",
      Fax: "",
      InsContact: "",
      FinContact: "",
      CreditLimit: 0,
      ComRate: 0,
      StartDate: new Date().toISOString().split("T")[0],
      ExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      Remarks: "",
      Tag: "",
      Deleted: 0,
      Active: 1,
      SubmittedBy: new Date().toISOString(),
      ModifiedBy: new Date().toISOString(),
      Z_NAICOM_ID: "",
    })
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
                <Label htmlFor="partyID">Party ID *</Label>
                <Input
                  id="partyID"
                  value={formData.PartyID}
                  onChange={(e) => handleInputChange("PartyID", e.target.value)}
                  placeholder="Enter party ID (e.g., FP-00001)"
                  className={errors.PartyID ? "ca-error" : ""}
                />
                {errors.PartyID && <span className="ca-error-text">{errors.PartyID}</span>}
              </div>
              <div className="ca-form-field">
                <Label htmlFor="partyType">Party Type</Label>
                <select
                  id="partyType"
                  value={formData.PartyType}
                  onChange={(e) => handleInputChange("PartyType", e.target.value)}
                  className="ca-select"
                >
                  <option value="FP">FP - Financial Partner</option>
                  <option value="AG">AG - Agent</option>
                  <option value="BN">BN - Bank</option>
                  <option value="BAS">BAS - Broker Agent Specialist</option>
                </select>
              </div>
              <div className="ca-form-field ca-full-width">
                <Label htmlFor="party">Party Name *</Label>
                <Input
                  id="party"
                  value={formData.Party}
                  onChange={(e) => handleInputChange("Party", e.target.value)}
                  placeholder="Enter party name"
                  className={errors.Party ? "ca-error" : ""}
                />
                {errors.Party && <span className="ca-error-text">{errors.Party}</span>}
              </div>
              <div className="ca-form-field ca-full-width">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.Description}
                  onChange={(e) => handleInputChange("Description", e.target.value)}
                  placeholder="Enter description"
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
                <Label htmlFor="mobilePhone">Mobile Phone</Label>
                <Input
                  id="mobilePhone"
                  value={formData.mobilePhone}
                  onChange={(e) => handleInputChange("mobilePhone", e.target.value)}
                  placeholder="Enter mobile phone number"
                />
              </div>
              <div className="ca-form-field">
                <Label htmlFor="landPhone">Land Phone</Label>
                <Input
                  id="landPhone"
                  value={formData.LandPhone}
                  onChange={(e) => handleInputChange("LandPhone", e.target.value)}
                  placeholder="Enter land phone number"
                />
              </div>
              <div className="ca-form-field">
                <Label htmlFor="fax">Fax</Label>
                <Input
                  id="fax"
                  value={formData.Fax}
                  onChange={(e) => handleInputChange("Fax", e.target.value)}
                  placeholder="Enter fax number"
                />
              </div>
              <div className="ca-form-field">
                <Label htmlFor="stateID">State</Label>
                <Input
                  id="stateID"
                  value={formData.StateID}
                  onChange={(e) => handleInputChange("StateID", e.target.value)}
                  placeholder="Enter state"
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
                <Label htmlFor="insContact">Insurance Contact</Label>
                <Input
                  id="insContact"
                  value={formData.InsContact}
                  onChange={(e) => handleInputChange("InsContact", e.target.value)}
                  placeholder="Enter insurance contact"
                />
              </div>
              <div className="ca-form-field">
                <Label htmlFor="finContact">Finance Contact</Label>
                <Input
                  id="finContact"
                  value={formData.FinContact}
                  onChange={(e) => handleInputChange("FinContact", e.target.value)}
                  placeholder="Enter finance contact"
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
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.StartDate}
                  onChange={(e) => handleInputChange("StartDate", e.target.value)}
                />
              </div>
              <div className="ca-form-field">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.ExpiryDate}
                  onChange={(e) => handleInputChange("ExpiryDate", e.target.value)}
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
                <Label htmlFor="naicomId">NAICOM ID</Label>
                <Input
                  id="naicomId"
                  value={formData.Z_NAICOM_ID}
                  onChange={(e) => handleInputChange("Z_NAICOM_ID", e.target.value)}
                  placeholder="Enter NAICOM ID"
                />
              </div>
            </div>

            <div className="ca-form-field">
              <Label htmlFor="remarks">Remarks</Label>
              <textarea
                id="remarks"
                value={formData.Remarks}
                onChange={(e) => handleInputChange("Remarks", e.target.value)}
                placeholder="Enter remarks"
                className="ca-textarea"
                rows={2}
              />
            </div>
          </div>

          {/* Status */}
          <div className="ca-form-section">
            <h3 className="ca-section-title">Status</h3>
            <div className="ca-form-field">
              <label className="ca-checkbox-option">
                <input
                  type="checkbox"
                  checked={formData.Active === 1}
                  onChange={(e) => handleInputChange("Active", e.target.checked ? 1 : 0)}
                />
                <span className="ca-checkbox-label">Active Agent</span>
              </label>
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
  const { currentAgent, loading, success, error } = useAppSelector(selectAgents)

  const [formData, setFormData] = useState({
    party: "",
    description: "",
    address: "",
    mobilePhone: "",
    landPhone: "",
    email: "",
    fax: "",
    insContact: "",
    finContact: "",
    creditLimit: 0,
    comRate: 0,
    startDate: "",
    expiryDate: "",
    remarks: "",
    tag: "",
    active: 1,
    z_NAICOM_ID: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (currentAgent && showEditAgentDialog) {
      setFormData({
        party: currentAgent.party || "",
        description: currentAgent.description || "",
        address: currentAgent.address || "",
        mobilePhone: currentAgent.mobilePhone || "",
        landPhone: currentAgent.landPhone || "",
        email: currentAgent.email || "",
        fax: currentAgent.fax || "",
        insContact: currentAgent.insContact || "",
        finContact: currentAgent.finContact || "",
        creditLimit: currentAgent.creditLimit || 0,
        comRate: currentAgent.comRate || 0,
        startDate: currentAgent.startDate ? currentAgent.startDate.split("T")[0] : "",
        expiryDate: currentAgent.expiryDate ? currentAgent.expiryDate.split("T")[0] : "",
        remarks: currentAgent.remarks || "",
        tag: currentAgent.tag || "",
        active: currentAgent.active,
        z_NAICOM_ID: currentAgent.z_NAICOM_ID || "",
      })
    }
  }, [currentAgent, showEditAgentDialog])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentAgent) return

    const newErrors: Record<string, string> = {}

    if (!formData.party.trim()) newErrors.party = "Party name is required"
    if (!formData.address.trim()) newErrors.address = "Address is required"
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    dispatch(updateAgent({ agentID: currentAgent.partyID, agentData: formData }))
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
    }
  }, [success.updateAgent, dispatch])

  if (!currentAgent) return null

  return (
    <Dialog open={showEditAgentDialog} onOpenChange={handleClose}>
      <DialogContent className="ea-edit-agent-dialog max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Agent - {currentAgent.partyID}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="ea-agent-form">
          {/* Basic Information */}
          <div className="ea-form-section">
            <h3 className="ea-section-title">Basic Information</h3>
            <div className="ea-form-grid">
              <div className="ea-form-field">
                <Label htmlFor="editPartyType">Party Type</Label>
                <div className="ea-readonly-field">{currentAgent.partyType}</div>
              </div>
              <div className="ea-form-field ca-full-width">
                <Label htmlFor="editParty">Party Name *</Label>
                <Input
                  id="editParty"
                  value={formData.party}
                  onChange={(e) => handleInputChange("party", e.target.value)}
                  placeholder="Enter party name"
                  className={errors.party ? "ea-error" : ""}
                />
                {errors.party && <span className="ea-error-text">{errors.party}</span>}
              </div>
              <div className="ea-form-field ca-full-width">
                <Label htmlFor="editDescription">Description</Label>
                <Input
                  id="editDescription"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Enter description"
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
                <Label htmlFor="editMobilePhone">Mobile Phone</Label>
                <Input
                  id="editMobilePhone"
                  value={formData.mobilePhone}
                  onChange={(e) => handleInputChange("mobilePhone", e.target.value)}
                  placeholder="Enter mobile phone number"
                />
              </div>
              <div className="ea-form-field">
                <Label htmlFor="editLandPhone">Land Phone</Label>
                <Input
                  id="editLandPhone"
                  value={formData.landPhone}
                  onChange={(e) => handleInputChange("landPhone", e.target.value)}
                  placeholder="Enter land phone number"
                />
              </div>
              <div className="ea-form-field">
                <Label htmlFor="editFax">Fax</Label>
                <Input
                  id="editFax"
                  value={formData.fax}
                  onChange={(e) => handleInputChange("fax", e.target.value)}
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
                <Label htmlFor="editInsContact">Insurance Contact</Label>
                <Input
                  id="editInsContact"
                  value={formData.insContact}
                  onChange={(e) => handleInputChange("insContact", e.target.value)}
                  placeholder="Enter insurance contact"
                />
              </div>
              <div className="ea-form-field">
                <Label htmlFor="editFinContact">Finance Contact</Label>
                <Input
                  id="editFinContact"
                  value={formData.finContact}
                  onChange={(e) => handleInputChange("finContact", e.target.value)}
                  placeholder="Enter finance contact"
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
                <Label htmlFor="editStartDate">Start Date</Label>
                <Input
                  id="editStartDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                />
              </div>
              <div className="ea-form-field">
                <Label htmlFor="editExpiryDate">Expiry Date</Label>
                <Input
                  id="editExpiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange("expiryDate", e.target.value)}
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
                <Label htmlFor="editNaicomId">NAICOM ID</Label>
                <Input
                  id="editNaicomId"
                  value={formData.z_NAICOM_ID}
                  onChange={(e) => handleInputChange("z_NAICOM_ID", e.target.value)}
                  placeholder="Enter NAICOM ID"
                />
              </div>
            </div>

            <div className="ea-form-field">
              <Label htmlFor="editRemarks">Remarks</Label>
              <textarea
                id="editRemarks"
                value={formData.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
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
                  checked={formData.active === 1}
                  onChange={(e) => handleInputChange("active", e.target.checked ? 1 : 0)}
                />
                <span className="ea-checkbox-label">Active Agent</span>
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
  const { currentAgent, loading } = useAppSelector(selectAgents)

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
          <DialogTitle>Agent Details - {currentAgent.partyID}</DialogTitle>
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
              <h2 className="ad-agent-name">{currentAgent.party || "N/A"}</h2>
              <div className="ad-agent-meta">
                <span className={`ad-type-badge ad-type-${currentAgent.partyType?.toLowerCase()}`}>
                  {currentAgent.partyType}
                </span>
                <span className="ad-agent-id">ID: {currentAgent.partyID}</span>
                <span className={`ad-status-badge ${currentAgent.active === 1 ? "ad-active" : "ad-inactive"}`}>
                  {currentAgent.active === 1 ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="ad-section">
            <h3 className="ad-section-title">Basic Information</h3>
            <div className="ad-info-grid">
              <div className="ad-info-item">
                <span className="ad-label">Party ID:</span>
                <span className="ad-value">{currentAgent.partyID}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Party Type:</span>
                <span className="ad-value">{currentAgent.partyType || "N/A"}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">State ID:</span>
                <span className="ad-value">{currentAgent.stateID || "N/A"}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Description:</span>
                <span className="ad-value">{currentAgent.description || "N/A"}</span>
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
                <span className="ad-label">Mobile Phone:</span>
                <span className="ad-value">{currentAgent.mobilePhone || "N/A"}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Land Phone:</span>
                <span className="ad-value">{currentAgent.landPhone || "N/A"}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Fax:</span>
                <span className="ad-value">{currentAgent.fax || "N/A"}</span>
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
                <span className="ad-value">{currentAgent.insContact || "N/A"}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Finance Contact:</span>
                <span className="ad-value">{currentAgent.finContact || "N/A"}</span>
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
                <span className="ad-label">Start Date:</span>
                <span className="ad-value">{formatDate(currentAgent.startDate)}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Expiry Date:</span>
                <span className="ad-value">{formatDate(currentAgent.expiryDate)}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">Tag:</span>
                <span className="ad-value">{currentAgent.tag || "N/A"}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-label">NAICOM ID:</span>
                <span className="ad-value">{currentAgent.z_NAICOM_ID || "N/A"}</span>
              </div>
            </div>
            {currentAgent.remarks && (
              <div className="ad-info-item ad-full-width">
                <span className="ad-label">Remarks:</span>
                <span className="ad-value">{currentAgent.remarks}</span>
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
