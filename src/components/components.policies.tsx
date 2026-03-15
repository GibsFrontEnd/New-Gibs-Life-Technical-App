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
  setShowCreatePolicyDialog,
  setShowRenewPolicyDialog,
  setShowPolicyDetailsDialog,
} from "../features/reducers/uiReducers/uiSlice"
import {
  createPolicy,
  renewPolicy,
  selectPolicies,
  clearMessages,
} from "../features/reducers/csuReducers/policySlice"
import type { CreatePolicyRequest, RenewPolicyRequest } from "../types/policy"
import "./components.policies.css"

export const CreatePolicy = () => {
  const dispatch = useAppDispatch()
  const { showCreatePolicyDialog } = useAppSelector(selectUiState)
  const { loading, success, error } = useAppSelector(selectPolicies)

  const [formData, setFormData] = useState<CreatePolicyRequest>({
    startDate: "",
    endDate: "",
    fxCurrency: "NGN",
    fxRate: 1,
    agentID: "",
    paymentAccountID: "",
    paymentReferenceID: "",
    productID: "",
    subChannelID: "",
    insured: {
      title: "",
      lastName: "",
      firstName: "",
      otherName: "",
      gender: "MALE",
      email: "",
      address: "",
      phoneLine1: "",
      phoneLine2: "",
      isOrg: false,
      orgName: "",
      orgRegNumber: "",
      orgRegDate: "",
      taxIdNumber: "",
      cityLGA: "",
      stateID: "",
      nationality: "",
      dateOfBirth: "",
      kycType: "NOT_AVAILABLE",
      kycNumber: "",
      kycIssueDate: "",
      kycExpiryDate: "",
      nextOfKin: {
        title: "",
        lastName: "",
        firstName: "",
        otherName: "",
        gender: "MALE",
        email: "",
        address: "",
        phoneLine1: "",
        phoneLine2: "",
      },
    },
    sections: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}
    if (!formData.startDate) newErrors.startDate = "Start date is required"
    if (!formData.endDate) newErrors.endDate = "End date is required"
    if (!formData.agentID.trim()) newErrors.agentID = "Agent ID is required"
    if (!formData.productID.trim()) newErrors.productID = "Product ID is required"
    if (!formData.insured.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.insured.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.insured.email.trim()) newErrors.email = "Email is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    dispatch(createPolicy(formData))
  }

  const handleClose = () => {
    setFormData({
      startDate: "",
      endDate: "",
      fxCurrency: "NGN",
      fxRate: 1,
      agentID: "",
      paymentAccountID: "",
      paymentReferenceID: "",
      productID: "",
      subChannelID: "",
      insured: {
        title: "",
        lastName: "",
        firstName: "",
        otherName: "",
        gender: "MALE",
        email: "",
        address: "",
        phoneLine1: "",
        phoneLine2: "",
        isOrg: false,
        orgName: "",
        orgRegNumber: "",
        orgRegDate: "",
        taxIdNumber: "",
        cityLGA: "",
        stateID: "",
        nationality: "",
        dateOfBirth: "",
        kycType: "NOT_AVAILABLE",
        kycNumber: "",
        kycIssueDate: "",
        kycExpiryDate: "",
        nextOfKin: {
          title: "",
          lastName: "",
          firstName: "",
          otherName: "",
          gender: "MALE",
          email: "",
          address: "",
          phoneLine1: "",
          phoneLine2: "",
        },
      },
      sections: [],
    })
    setErrors({})
    dispatch(setShowCreatePolicyDialog(false))
  }

  const handleInputChange = (field: string, value: any, nested?: string) => {
    if (nested) {
      setFormData((prev) => ({
        ...prev,
        [nested]: {
          ...prev[nested as keyof CreatePolicyRequest],
          [field]: value,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  useEffect(() => {
    if (success.createPolicy) {
      handleClose()
      dispatch(clearMessages())
    }
  }, [success.createPolicy, dispatch])

  return (
    <Dialog open={showCreatePolicyDialog} onOpenChange={handleClose}>
      <DialogContent className="cp-create-policy-dialog max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Policy</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="cp-policy-form">
          {/* Policy Basic Info */}
          <div className="cp-form-section">
            <h3 className="cp-section-title">Policy Information</h3>
            <div className="cp-form-grid">
              <div className="cp-form-field">
                <Label htmlFor="productID">Product ID *</Label>
                <Input
                  id="productID"
                  value={formData.productID}
                  onChange={(e) => handleInputChange("productID", e.target.value)}
                  placeholder="Enter product ID"
                  className={errors.productID ? "cp-error" : ""}
                />
                {errors.productID && <span className="cp-error-text">{errors.productID}</span>}
              </div>

              <div className="cp-form-field">
                <Label htmlFor="agentID">Agent ID *</Label>
                <Input
                  id="agentID"
                  value={formData.agentID}
                  onChange={(e) => handleInputChange("agentID", e.target.value)}
                  placeholder="Enter agent ID"
                  className={errors.agentID ? "cp-error" : ""}
                />
                {errors.agentID && <span className="cp-error-text">{errors.agentID}</span>}
              </div>

              <div className="cp-form-field">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  className={errors.startDate ? "cp-error" : ""}
                />
                {errors.startDate && <span className="cp-error-text">{errors.startDate}</span>}
              </div>

              <div className="cp-form-field">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className={errors.endDate ? "cp-error" : ""}
                />
                {errors.endDate && <span className="cp-error-text">{errors.endDate}</span>}
              </div>

              <div className="cp-form-field">
                <Label htmlFor="fxCurrency">Currency</Label>
                <select
                  id="fxCurrency"
                  value={formData.fxCurrency}
                  onChange={(e) => handleInputChange("fxCurrency", e.target.value)}
                  className="cp-select"
                >
                  <option value="NGN">NGN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div className="cp-form-field">
                <Label htmlFor="fxRate">Exchange Rate</Label>
                <Input
                  id="fxRate"
                  type="number"
                  step="0.01"
                  value={formData.fxRate}
                  onChange={(e) => handleInputChange("fxRate", Number.parseFloat(e.target.value) || 1)}
                  placeholder="Enter exchange rate"
                />
              </div>
            </div>
          </div>

          {/* Insured Information */}
          <div className="cp-form-section">
            <h3 className="cp-section-title">Insured Information</h3>
            <div className="cp-form-grid">
              <div className="cp-form-field">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.insured.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value, "insured")}
                  placeholder="Enter first name"
                  className={errors.firstName ? "cp-error" : ""}
                />
                {errors.firstName && <span className="cp-error-text">{errors.firstName}</span>}
              </div>

              <div className="cp-form-field">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.insured.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value, "insured")}
                  placeholder="Enter last name"
                  className={errors.lastName ? "cp-error" : ""}
                />
                {errors.lastName && <span className="cp-error-text">{errors.lastName}</span>}
              </div>

              <div className="cp-form-field">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.insured.email}
                  onChange={(e) => handleInputChange("email", e.target.value, "insured")}
                  placeholder="Enter email address"
                  className={errors.email ? "cp-error" : ""}
                />
                {errors.email && <span className="cp-error-text">{errors.email}</span>}
              </div>

              <div className="cp-form-field">
                <Label htmlFor="phoneLine1">Phone Number</Label>
                <Input
                  id="phoneLine1"
                  value={formData.insured.phoneLine1}
                  onChange={(e) => handleInputChange("phoneLine1", e.target.value, "insured")}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="cp-form-field">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  value={formData.insured.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value, "insured")}
                  className="cp-select"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div className="cp-form-field">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.insured.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value, "insured")}
                />
              </div>
            </div>

            <div className="cp-form-field">
              <Label htmlFor="address">Address</Label>
              <textarea
                id="address"
                value={formData.insured.address}
                onChange={(e) => handleInputChange("address", e.target.value, "insured")}
                placeholder="Enter full address"
                className="cp-textarea"
                rows={3}
              />
            </div>
          </div>

          {error.createPolicy && <div className="cp-error-message">{error.createPolicy}</div>}

          <div className="cp-form-actions">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading.createPolicy}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading.createPolicy} className="cp-submit-btn">
              {loading.createPolicy ? "Creating..." : "Create Policy"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const RenewPolicy = () => {
  const dispatch = useAppDispatch()
  const { showRenewPolicyDialog } = useAppSelector(selectUiState)
  const { currentPolicy, loading, success, error } = useAppSelector(selectPolicies)

  const [formData, setFormData] = useState<RenewPolicyRequest>({
    startDate: "",
    endDate: "",
    fxCurrency: "NGN",
    fxRate: 1,
    agentID: "",
    paymentAccountID: "",
    paymentReferenceID: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (currentPolicy && showRenewPolicyDialog) {
      const currentEndDate = new Date(currentPolicy.endDate)
      const newStartDate = new Date(currentEndDate)
      newStartDate.setDate(newStartDate.getDate() + 1)
      const newEndDate = new Date(newStartDate)
      newEndDate.setFullYear(newEndDate.getFullYear() + 1)

      setFormData({
        startDate: newStartDate.toISOString().split("T")[0],
        endDate: newEndDate.toISOString().split("T")[0],
        fxCurrency: currentPolicy.fxCurrency,
        fxRate: currentPolicy.fxRate,
        agentID: currentPolicy.agentID,
        paymentAccountID: "",
        paymentReferenceID: "",
      })
    }
  }, [currentPolicy, showRenewPolicyDialog])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPolicy) return

    const newErrors: Record<string, string> = {}
    if (!formData.startDate) newErrors.startDate = "Start date is required"
    if (!formData.endDate) newErrors.endDate = "End date is required"
    if (!formData.agentID.trim()) newErrors.agentID = "Agent ID is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    dispatch(renewPolicy({ policyNo: currentPolicy.policyNo, renewData: formData }))
  }

  const handleClose = () => {
    setFormData({
      startDate: "",
      endDate: "",
      fxCurrency: "NGN",
      fxRate: 1,
      agentID: "",
      paymentAccountID: "",
      paymentReferenceID: "",
    })
    setErrors({})
    dispatch(setShowRenewPolicyDialog(false))
  }

  const handleInputChange = (field: keyof RenewPolicyRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  useEffect(() => {
    if (success.renewPolicy) {
      handleClose()
      dispatch(clearMessages())
    }
  }, [success.renewPolicy, dispatch])

  if (!currentPolicy) return null

  return (
    <Dialog open={showRenewPolicyDialog} onOpenChange={handleClose}>
      <DialogContent className="rp-renew-policy-dialog">
        <DialogHeader>
          <DialogTitle>Renew Policy - {currentPolicy.policyNo}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="rp-policy-form">
          <div className="rp-current-policy-info">
            <h4>Current Policy Information</h4>
            <div className="rp-policy-details">
              <div className="rp-detail-item">
                <span className="rp-label">Policy No:</span>
                <span className="rp-value">{currentPolicy.policyNo}</span>
              </div>
              <div className="rp-detail-item">
                <span className="rp-label">Customer:</span>
                <span className="rp-value">{currentPolicy.customerName}</span>
              </div>
              <div className="rp-detail-item">
                <span className="rp-label">Current Period:</span>
                <span className="rp-value">
                  {new Date(currentPolicy.startDate).toLocaleDateString()} -{" "}
                  {new Date(currentPolicy.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="rp-detail-item">
                <span className="rp-label">Premium:</span>
                <span className="rp-value">
                  {new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: currentPolicy.fxCurrency,
                  }).format(currentPolicy.premium)}
                </span>
              </div>
            </div>
          </div>

          <div className="rp-form-section">
            <h4>Renewal Information</h4>
            <div className="rp-form-grid">
              <div className="rp-form-field">
                <Label htmlFor="renewStartDate">New Start Date *</Label>
                <Input
                  id="renewStartDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  className={errors.startDate ? "rp-error" : ""}
                />
                {errors.startDate && <span className="rp-error-text">{errors.startDate}</span>}
              </div>

              <div className="rp-form-field">
                <Label htmlFor="renewEndDate">New End Date *</Label>
                <Input
                  id="renewEndDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className={errors.endDate ? "rp-error" : ""}
                />
                {errors.endDate && <span className="rp-error-text">{errors.endDate}</span>}
              </div>

              <div className="rp-form-field">
                <Label htmlFor="renewAgentID">Agent ID *</Label>
                <Input
                  id="renewAgentID"
                  value={formData.agentID}
                  onChange={(e) => handleInputChange("agentID", e.target.value)}
                  placeholder="Enter agent ID"
                  className={errors.agentID ? "rp-error" : ""}
                />
                {errors.agentID && <span className="rp-error-text">{errors.agentID}</span>}
              </div>

              <div className="rp-form-field">
                <Label htmlFor="renewFxCurrency">Currency</Label>
                <select
                  id="renewFxCurrency"
                  value={formData.fxCurrency}
                  onChange={(e) => handleInputChange("fxCurrency", e.target.value)}
                  className="rp-select"
                >
                  <option value="NGN">NGN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div className="rp-form-field">
                <Label htmlFor="renewFxRate">Exchange Rate</Label>
                <Input
                  id="renewFxRate"
                  type="number"
                  step="0.01"
                  value={formData.fxRate}
                  onChange={(e) => handleInputChange("fxRate", Number.parseFloat(e.target.value) || 1)}
                  placeholder="Enter exchange rate"
                />
              </div>

              <div className="rp-form-field">
                <Label htmlFor="paymentAccountID">Payment Account ID</Label>
                <Input
                  id="paymentAccountID"
                  value={formData.paymentAccountID}
                  onChange={(e) => handleInputChange("paymentAccountID", e.target.value)}
                  placeholder="Enter payment account ID"
                />
              </div>

              <div className="rp-form-field">
                <Label htmlFor="paymentReferenceID">Payment Reference ID</Label>
                <Input
                  id="paymentReferenceID"
                  value={formData.paymentReferenceID}
                  onChange={(e) => handleInputChange("paymentReferenceID", e.target.value)}
                  placeholder="Enter payment reference ID"
                />
              </div>
            </div>
          </div>

          {error.renewPolicy && <div className="rp-error-message">{error.renewPolicy}</div>}

          <div className="rp-form-actions">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading.renewPolicy}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading.renewPolicy} className="rp-submit-btn">
              {loading.renewPolicy ? "Renewing..." : "Renew Policy"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const PolicyDetails = () => {
  const dispatch = useAppDispatch()
  const { showPolicyDetailsDialog } = useAppSelector(selectUiState)
  const { currentPolicy } = useAppSelector(selectPolicies)

  const handleClose = () => {
    dispatch(setShowPolicyDetailsDialog(false))
  }

  if (!currentPolicy) return null

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const isPolicyExpired = (endDate: string) => {
    return new Date(endDate) < new Date()
  }

  return (
    <Dialog open={showPolicyDetailsDialog} onOpenChange={handleClose}>
      <DialogContent className="pd-policy-details-dialog max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Policy Details - {currentPolicy.policyNo}</DialogTitle>
        </DialogHeader>

        <div className="pd-policy-content">
          {/* Policy Status */}
          <div className="pd-status-section">
            <div className={`pd-status-badge ${isPolicyExpired(currentPolicy.endDate) ? "pd-expired" : "pd-active"}`}>
              {isPolicyExpired(currentPolicy.endDate) ? "EXPIRED" : "ACTIVE"}
            </div>
          </div>

          {/* Basic Information */}
          <div className="pd-section">
            <h3 className="pd-section-title">Basic Information</h3>
            <div className="pd-info-grid">
              <div className="pd-info-item">
                <span className="pd-label">Policy Number:</span>
                <span className="pd-value">{currentPolicy.policyNo}</span>
              </div>
              <div className="pd-info-item">
                <span className="pd-label">Document Number:</span>
                <span className="pd-value">{currentPolicy.documentNo}</span>
              </div>
              <div className="pd-info-item">
                <span className="pd-label">Product ID:</span>
                <span className="pd-value">{currentPolicy.productID}</span>
              </div>
              <div className="pd-info-item">
                <span className="pd-label">Agent ID:</span>
                <span className="pd-value">{currentPolicy.agentID}</span>
              </div>
              <div className="pd-info-item">
                <span className="pd-label">NAICOM ID:</span>
                <span className="pd-value">{currentPolicy.naicomID || "N/A"}</span>
              </div>
              <div className="pd-info-item">
                <span className="pd-label">Entry Date:</span>
                <span className="pd-value">{formatDate(currentPolicy.entryDate)}</span>
              </div>
            </div>
          </div>

          {/* Policy Period & Financial */}
          <div className="pd-section">
            <h3 className="pd-section-title">Policy Period & Financial Details</h3>
            <div className="pd-info-grid">
              <div className="pd-info-item">
                <span className="pd-label">Start Date:</span>
                <span className="pd-value">{formatDate(currentPolicy.startDate)}</span>
              </div>
              <div className="pd-info-item">
                <span className="pd-label">End Date:</span>
                <span className="pd-value">{formatDate(currentPolicy.endDate)}</span>
              </div>
              <div className="pd-info-item">
                <span className="pd-label">Premium:</span>
                <span className="pd-value pd-premium">
                  {formatCurrency(currentPolicy.premium, currentPolicy.fxCurrency)}
                </span>
              </div>
              <div className="pd-info-item">
                <span className="pd-label">Sum Insured:</span>
                <span className="pd-value">{formatCurrency(currentPolicy.sumInsured, currentPolicy.fxCurrency)}</span>
              </div>
              <div className="pd-info-item">
                <span className="pd-label">Currency:</span>
                <span className="pd-value">{currentPolicy.fxCurrency}</span>
              </div>
              <div className="pd-info-item">
                <span className="pd-label">Exchange Rate:</span>
                <span className="pd-value">{currentPolicy.fxRate}</span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="pd-section">
            <h3 className="pd-section-title">Customer Information</h3>
            <div className="pd-info-grid">
              <div className="pd-info-item">
                <span className="pd-label">Customer Name:</span>
                <span className="pd-value pd-customer-name">{currentPolicy.customerName}</span>
              </div>
              <div className="pd-info-item">
                <span className="pd-label">Customer ID:</span>
                <span className="pd-value">{currentPolicy.customerID}</span>
              </div>
            </div>
          </div>

          {/* Policy Sections */}
          {currentPolicy.sections && currentPolicy.sections.length > 0 && (
            <div className="pd-section">
              <h3 className="pd-section-title">Policy Sections</h3>
              <div className="pd-sections-container">
                {currentPolicy.sections.map((section, index) => (
                  <div key={section.sectionID} className="pd-section-card">
                    <div className="pd-section-header">
                      <h4 className="pd-section-id">Section {section.sectionID}</h4>
                      <div className="pd-section-amounts">
                        <span className="pd-section-premium">
                          Premium: {formatCurrency(section.sectionPremium, currentPolicy.fxCurrency)}
                        </span>
                        <span className="pd-section-sum-insured">
                          Sum Insured: {formatCurrency(section.sectionSumInsured, currentPolicy.fxCurrency)}
                        </span>
                      </div>
                    </div>

                    {/* Section Fields */}
                    {section.fields && section.fields.length > 0 && (
                      <div className="pd-section-fields">
                        <h5 className="pd-subsection-title">Fields</h5>
                        <div className="pd-fields-grid">
                          {section.fields.map((field, fieldIndex) => (
                            <div key={fieldIndex} className="pd-field-item">
                              <span className="pd-field-code">{field.code}:</span>
                              <span className="pd-field-value">{field.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section Rates */}
                    {section.rates && section.rates.length > 0 && (
                      <div className="pd-section-rates">
                        <h5 className="pd-subsection-title">Rates</h5>
                        <div className="pd-rates-grid">
                          {section.rates.map((rate, rateIndex) => (
                            <div key={rateIndex} className="pd-rate-item">
                              <span className="pd-rate-code">{rate.code}:</span>
                              <span className="pd-rate-value">{rate.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section SMIs */}
                    {section.smIs && section.smIs.length > 0 && (
                      <div className="pd-section-smis">
                        <h5 className="pd-subsection-title">Sum Insured Items</h5>
                        <div className="pd-smis-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Code</th>
                                <th>Description</th>
                                <th>Sum Insured</th>
                                <th>Premium</th>
                                <th>Rate</th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.smIs.map((smi, smiIndex) => (
                                <tr key={smiIndex}>
                                  <td>{smi.code}</td>
                                  <td>{smi.description}</td>
                                  <td>{formatCurrency(smi.sumInsured, currentPolicy.fxCurrency)}</td>
                                  <td>{formatCurrency(smi.premium, currentPolicy.fxCurrency)}</td>
                                  <td>{smi.premiumRate}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pd-form-actions">
          <Button onClick={handleClose} className="pd-close-btn">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
