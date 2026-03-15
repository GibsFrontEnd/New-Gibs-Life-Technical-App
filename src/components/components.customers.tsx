//@ts-nocheck
import type React from "react"
import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "../hooks/use-apps"
import { Button } from "./UI/new-button"
import Input from "./UI/Input"
import { Label } from "./UI/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./UI/dialog"
import {
  selectUiState,
  setShowCreateCustomerDialog,
  setShowEditCustomerDialog,
  setShowCustomerDetailsDialog,
} from "../features/reducers/uiReducers/uiSlice"
import {
  createCustomer,
  updateCustomer,
  selectCustomers,
  clearMessages,
} from "../features/reducers/csuReducers/customerSlice"
import type { CreateCustomerRequest } from "../types/customer"
import "./components.customers.css"

export const CreateCustomer = () => {
  const dispatch = useAppDispatch()
  const { showCreateCustomerDialog } = useAppSelector(selectUiState)
  const { loading, success, error } = useAppSelector(selectCustomers)

  const [formData, setFormData] = useState<CreateCustomerRequest>({
    title: "string",
    lastName: "string",
    firstName: "string",
    otherName: "string",
    gender: "MALE",
    email: "user@example.com",
    address: "string",
    phoneLine1: "0",
    phoneLine2: "0",
    isOrg: true,
    orgName: "string",
    orgRegNumber: "string",
    orgRegDate: "2025-09-22",
    taxIdNumber: "string",
    cityLGA: "string",
    stateID: "string",
    nationality: "string",
    dateOfBirth: "2025-09-22",
    kycType: "NOT_AVAILABLE",
    kycNumber: "string",
    kycIssueDate: "2025-09-22",
    kycExpiryDate: "2025-09-22",
    nextOfKin: {
      title: "string",
      lastName: "string",
      firstName: "string",
      otherName: "string",
      gender: "MALE",
      email: "user@example.com",
      address: "string",
      phoneLine1: "0",
      phoneLine2: "0",
    },
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    console.log(formData)

    e.preventDefault()

    const newErrors: Record<string, string> = {}

    // Customer type specific validation
    if (formData.isOrg) {
      // Organization validation
      if (!formData.orgName.trim()) newErrors.orgName = "Organization name is required"
      if (!formData.orgRegNumber.trim()) newErrors.orgRegNumber = "Registration number is required"
      if (!formData.orgRegDate.trim()) newErrors.orgRegDate = "Registration date is required"
      if (!formData.taxIdNumber.trim()) newErrors.taxIdNumber = "Tax ID number is required"
    } else {
      // Individual validation
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
      if (!formData.title.trim()) newErrors.title = "Title is required"
      if (!formData.gender.trim()) newErrors.gender = "Gender is required"
      if (!formData.dateOfBirth.trim()) newErrors.dateOfBirth = "Date of birth is required"
      if (!formData.nationality.trim()) newErrors.nationality = "Nationality is required"

      // Next of Kin validation for individuals
      if (!formData.nextOfKin.firstName.trim()) newErrors.nextOfKinFirstName = "Next of kin first name is required"
      if (!formData.nextOfKin.lastName.trim()) newErrors.nextOfKinLastName = "Next of kin last name is required"
      if (!formData.nextOfKin.phoneLine1.trim()) newErrors.nextOfKinPhoneLine1 = "Next of kin primary phone is required"
      if (!formData.nextOfKin.address.trim()) newErrors.nextOfKinAddress = "Next of kin address is required"
      if (formData.nextOfKin.email && !/\S+@\S+\.\S+/.test(formData.nextOfKin.email)) {
        newErrors.nextOfKinEmail = "Please enter a valid next of kin email address"
      }
    }

    // Common field validation
    if (!formData.address.trim()) newErrors.address = "Address is required"
    if (!formData.phoneLine1.trim()) newErrors.phoneLine1 = "Primary phone is required"
    if (!formData.cityLGA.trim()) newErrors.cityLGA = "City/LGA is required"
    if (!formData.stateID.trim()) newErrors.stateID = "State is required"

    // Email validation (optional but must be valid if provided)
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // KYC validation
    if (formData.kycType !== "NOT_AVAILABLE") {
      if (!formData.kycNumber.trim()) newErrors.kycNumber = "KYC number is required when KYC type is selected"
      if (!formData.kycIssueDate.trim()) newErrors.kycIssueDate = "KYC issue date is required when KYC type is selected"
      if (!formData.kycExpiryDate.trim())
        newErrors.kycExpiryDate = "KYC expiry date is required when KYC type is selected"
    }

    // Phone number validation
    const phoneRegex = /^[0-9+\-\s()]+$/
    if (formData.phoneLine1 && !phoneRegex.test(formData.phoneLine1)) {
      newErrors.phoneLine1 = "Please enter a valid phone number"
    }
    if (formData.phoneLine2 && !phoneRegex.test(formData.phoneLine2)) {
      newErrors.phoneLine2 = "Please enter a valid phone number"
    }

    // Date validation
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth)
      const today = new Date()
      if (birthDate >= today) {
        newErrors.dateOfBirth = "Date of birth must be in the past"
      }
    }

    if (formData.kycIssueDate && formData.kycExpiryDate) {
      const issueDate = new Date(formData.kycIssueDate)
      const expiryDate = new Date(formData.kycExpiryDate)
      if (issueDate >= expiryDate) {
        newErrors.kycExpiryDate = "KYC expiry date must be after issue date"
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Create payload based on customer type
    let payload: any = {
      title: formData.title,
      firstName: formData.firstName,
      lastName: formData.lastName,
      otherName: formData.otherName,
      gender: formData.gender,
      nationality: formData.nationality,
      dateOfBirth: formData.dateOfBirth,
      nextOfKin: formData.nextOfKin,
      email: formData.email,
      address: formData.address,
      phoneLine1: formData.phoneLine1,
      phoneLine2: formData.phoneLine2,
      cityLGA: formData.cityLGA,
      stateID: formData.stateID,
      kycType: formData.kycType,
      kycNumber: formData.kycNumber,
      kycIssueDate: formData.kycIssueDate,
      kycExpiryDate: formData.kycExpiryDate,
      isOrg: formData.isOrg,
    }

    if (formData.isOrg) {
      // Organization fields only
      payload = {
        ...payload,
        orgName: formData.orgName,
        orgRegNumber: formData.orgRegNumber,
        orgRegDate: formData.orgRegDate,
        taxIdNumber: formData.taxIdNumber,
      }
    } else {
      // Individual fields only
      payload = {
        ...payload
      }
    }

    dispatch(createCustomer(payload))
  }

  const handleClose = () => {
    setFormData({
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
    })
    setErrors({})
    dispatch(setShowCreateCustomerDialog(false))
  }

  const handleInputChange = (field: string, value: any, nested?: string) => {
    if (nested) {
      setFormData((prev) => ({
        ...prev,
        [nested]: {
          ...prev[nested as keyof CreateCustomerRequest],
          [field]: value,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

    // Clear error when user starts typing
    const errorKey = nested ? `${nested}${field.charAt(0).toUpperCase() + field.slice(1)}` : field
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: "" }))
    }
  }

  useEffect(() => {
    if (success.createCustomer) {
      handleClose()
      dispatch(clearMessages())
    }
  }, [success.createCustomer, dispatch])

  return (
    <Dialog open={showCreateCustomerDialog} onOpenChange={handleClose}>
      <DialogContent className="cc-create-customer-dialog max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Customer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="cc-customer-form">
          {/* Customer Type Selection */}
          <div className="cc-form-section">
            <h3 className="cc-section-title">Customer Type</h3>
            <div className="cc-type-selection">
              <label className="cc-radio-option">
                <input
                  type="radio"
                  name="customerType"
                  checked={!formData.isOrg}
                  onChange={() => handleInputChange("isOrg", false)}
                />
                <span className="cc-radio-label">Individual</span>
              </label>
              <label className="cc-radio-option">
                <input
                  type="radio"
                  name="customerType"
                  checked={formData.isOrg}
                  onChange={() => handleInputChange("isOrg", true)}
                />
                <span className="cc-radio-label">Organization</span>
              </label>
            </div>
          </div>

          {/* Basic Information */}
          <div className="cc-form-section">
            <h3 className="cc-section-title">Basic Information</h3>
            <div className="cc-form-grid">
              {formData.isOrg ? (
                <>
                  <div className="cc-form-field cc-full-width">
                    <Label htmlFor="orgName">Organization Name *</Label>
                    <Input
                      id="orgName"
                      value={formData.orgName}
                      onChange={(e) => handleInputChange("orgName", e.target.value)}
                      placeholder="Enter organization name"
                      className={errors.orgName ? "cc-error" : ""}
                    />
                    {errors.orgName && <span className="cc-error-text">{errors.orgName}</span>}
                  </div>
                  <div className="cc-form-field">
                    <Label htmlFor="orgRegNumber">Registration Number *</Label>
                    <Input
                      id="orgRegNumber"
                      value={formData.orgRegNumber}
                      onChange={(e) => handleInputChange("orgRegNumber", e.target.value)}
                      placeholder="Enter registration number"
                      className={errors.orgRegNumber ? "cc-error" : ""}
                    />
                    {errors.orgRegNumber && <span className="cc-error-text">{errors.orgRegNumber}</span>}
                  </div>
                  <div className="cc-form-field">
                    <Label htmlFor="orgRegDate">Registration Date *</Label>
                    <Input
                      id="orgRegDate"
                      type="date"
                      value={formData.orgRegDate}
                      onChange={(e) => handleInputChange("orgRegDate", e.target.value)}
                      className={errors.orgRegDate ? "cc-error" : ""}
                    />
                    {errors.orgRegDate && <span className="cc-error-text">{errors.orgRegDate}</span>}
                  </div>
                  <div className="cc-form-field">
                    <Label htmlFor="taxIdNumber">Tax ID Number *</Label>
                    <Input
                      id="taxIdNumber"
                      value={formData.taxIdNumber}
                      onChange={(e) => handleInputChange("taxIdNumber", e.target.value)}
                      placeholder="Enter tax ID number"
                      className={errors.taxIdNumber ? "cc-error" : ""}
                    />
                    {errors.taxIdNumber && <span className="cc-error-text">{errors.taxIdNumber}</span>}
                  </div>
                </>
              ) : (
                <>
                  <div className="cc-form-field">
                    <Label htmlFor="title">Title *</Label>
                    <select
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className={`cc-select ${errors.title ? "cc-error" : ""}`}
                    >
                      <option value="">Select Title</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Miss">Miss</option>
                      <option value="Dr">Dr</option>
                      <option value="Prof">Prof</option>
                    </select>
                    {errors.title && <span className="cc-error-text">{errors.title}</span>}
                  </div>
                  <div className="cc-form-field">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Enter first name"
                      className={errors.firstName ? "cc-error" : ""}
                    />
                    {errors.firstName && <span className="cc-error-text">{errors.firstName}</span>}
                  </div>
                  <div className="cc-form-field">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Enter last name"
                      className={errors.lastName ? "cc-error" : ""}
                    />
                    {errors.lastName && <span className="cc-error-text">{errors.lastName}</span>}
                  </div>
                  <div className="cc-form-field">
                    <Label htmlFor="otherName">Other Name</Label>
                    <Input
                      id="otherName"
                      value={formData.otherName}
                      onChange={(e) => handleInputChange("otherName", e.target.value)}
                      placeholder="Enter other name"
                    />
                  </div>
                  <div className="cc-form-field">
                    <Label htmlFor="gender">Gender *</Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => handleInputChange("gender", e.target.value)}
                      className={`cc-select ${errors.gender ? "cc-error" : ""}`}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                    {errors.gender && <span className="cc-error-text">{errors.gender}</span>}
                  </div>
                  <div className="cc-form-field">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                      className={errors.dateOfBirth ? "cc-error" : ""}
                    />
                    {errors.dateOfBirth && <span className="cc-error-text">{errors.dateOfBirth}</span>}
                  </div>
                  <div className="cc-form-field">
                    <Label htmlFor="nationality">Nationality *</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => handleInputChange("nationality", e.target.value)}
                      placeholder="Enter nationality"
                      className={errors.nationality ? "cc-error" : ""}
                    />
                    {errors.nationality && <span className="cc-error-text">{errors.nationality}</span>}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="cc-form-section">
            <h3 className="cc-section-title">Contact Information</h3>
            <div className="cc-form-grid">
              <div className="cc-form-field">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                  className={errors.email ? "cc-error" : ""}
                />
                {errors.email && <span className="cc-error-text">{errors.email}</span>}
              </div>
              <div className="cc-form-field">
                <Label htmlFor="phoneLine1">Primary Phone *</Label>
                <Input
                  id="phoneLine1"
                  value={formData.phoneLine1}
                  onChange={(e) => handleInputChange("phoneLine1", e.target.value)}
                  placeholder="Enter primary phone number"
                  className={errors.phoneLine1 ? "cc-error" : ""}
                />
                {errors.phoneLine1 && <span className="cc-error-text">{errors.phoneLine1}</span>}
              </div>
              <div className="cc-form-field">
                <Label htmlFor="phoneLine2">Secondary Phone</Label>
                <Input
                  id="phoneLine2"
                  value={formData.phoneLine2}
                  onChange={(e) => handleInputChange("phoneLine2", e.target.value)}
                  placeholder="Enter secondary phone number"
                  className={errors.phoneLine2 ? "cc-error" : ""}
                />
                {errors.phoneLine2 && <span className="cc-error-text">{errors.phoneLine2}</span>}
              </div>
              <div className="cc-form-field">
                <Label htmlFor="stateID">State *</Label>
                <Input
                  id="stateID"
                  value={formData.stateID}
                  onChange={(e) => handleInputChange("stateID", e.target.value)}
                  placeholder="Enter state"
                  className={errors.stateID ? "cc-error" : ""}
                />
                {errors.stateID && <span className="cc-error-text">{errors.stateID}</span>}
              </div>
              <div className="cc-form-field">
                <Label htmlFor="cityLGA">City/LGA *</Label>
                <Input
                  id="cityLGA"
                  value={formData.cityLGA}
                  onChange={(e) => handleInputChange("cityLGA", e.target.value)}
                  placeholder="Enter city or LGA"
                  className={errors.cityLGA ? "cc-error" : ""}
                />
                {errors.cityLGA && <span className="cc-error-text">{errors.cityLGA}</span>}
              </div>
            </div>

            <div className="cc-form-field">
              <Label htmlFor="address">Address *</Label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter full address"
                className={`cc-textarea ${errors.address ? "cc-error" : ""}`}
                rows={3}
              />
              {errors.address && <span className="cc-error-text">{errors.address}</span>}
            </div>
          </div>

          {/* KYC Information */}
          <div className="cc-form-section">
            <h3 className="cc-section-title">KYC Information</h3>
            <div className="cc-form-grid">
              <div className="cc-form-field">
                <Label htmlFor="kycType">KYC Type</Label>
                <select
                  id="kycType"
                  value={formData.kycType}
                  onChange={(e) => handleInputChange("kycType", e.target.value)}
                  className={`cc-select ${errors.kycType ? "cc-error" : ""}`}
                >
                  <option value="NOT_AVAILABLE">Not Available</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVERS_LICENSE">Driver's License</option>
                  <option value="NATIONAL_ID">National ID</option>
                  <option value="VOTERS_CARD">Voter's Card</option>
                </select>
                {errors.kycType && <span className="cc-error-text">{errors.kycType}</span>}
              </div>
              <div className="cc-form-field">
                <Label htmlFor="kycNumber">KYC Number</Label>
                <Input
                  id="kycNumber"
                  value={formData.kycNumber}
                  onChange={(e) => handleInputChange("kycNumber", e.target.value)}
                  placeholder="Enter KYC number"
                  className={errors.kycNumber ? "cc-error" : ""}
                />
                {errors.kycNumber && <span className="cc-error-text">{errors.kycNumber}</span>}
              </div>
              <div className="cc-form-field">
                <Label htmlFor="kycIssueDate">KYC Issue Date</Label>
                <Input
                  id="kycIssueDate"
                  type="date"
                  value={formData.kycIssueDate}
                  onChange={(e) => handleInputChange("kycIssueDate", e.target.value)}
                  className={errors.kycIssueDate ? "cc-error" : ""}
                />
                {errors.kycIssueDate && <span className="cc-error-text">{errors.kycIssueDate}</span>}
              </div>
              <div className="cc-form-field">
                <Label htmlFor="kycExpiryDate">KYC Expiry Date</Label>
                <Input
                  id="kycExpiryDate"
                  type="date"
                  value={formData.kycExpiryDate}
                  onChange={(e) => handleInputChange("kycExpiryDate", e.target.value)}
                  className={errors.kycExpiryDate ? "cc-error" : ""}
                />
                {errors.kycExpiryDate && <span className="cc-error-text">{errors.kycExpiryDate}</span>}
              </div>
            </div>
          </div>

          {/* Next of Kin (for individuals) */}
            <div className="cc-form-section">
              <h3 className="cc-section-title">Next of Kin</h3>
              <div className="cc-form-grid">
                <div className="cc-form-field">
                  <Label htmlFor="nokTitle">Title</Label>
                  <select
                    id="nokTitle"
                    value={formData.nextOfKin.title}
                    onChange={(e) => handleInputChange("title", e.target.value, "nextOfKin")}
                    className="cc-select"
                  >
                    <option value="">Select Title</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Miss">Miss</option>
                    <option value="Dr">Dr</option>
                    <option value="Prof">Prof</option>
                  </select>
                </div>
                <div className="cc-form-field">
                  <Label htmlFor="nokFirstName">First Name *</Label>
                  <Input
                    id="nokFirstName"
                    value={formData.nextOfKin.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value, "nextOfKin")}
                    placeholder="Enter first name"
                    className={errors.nextOfKinFirstName ? "cc-error" : ""}
                  />
                  {errors.nextOfKinFirstName && <span className="cc-error-text">{errors.nextOfKinFirstName}</span>}
                </div>
                <div className="cc-form-field">
                  <Label htmlFor="nokLastName">Last Name *</Label>
                  <Input
                    id="nokLastName"
                    value={formData.nextOfKin.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value, "nextOfKin")}
                    placeholder="Enter last name"
                    className={errors.nextOfKinLastName ? "cc-error" : ""}
                  />
                  {errors.nextOfKinLastName && <span className="cc-error-text">{errors.nextOfKinLastName}</span>}
                </div>
                <div className="cc-form-field">
                  <Label htmlFor="nokOtherName">Other Name</Label>
                  <Input
                    id="nokOtherName"
                    value={formData.nextOfKin.otherName}
                    onChange={(e) => handleInputChange("otherName", e.target.value, "nextOfKin")}
                    placeholder="Enter other name"
                  />
                </div>
                <div className="cc-form-field">
                  <Label htmlFor="nokGender">Gender</Label>
                  <select
                    id="nokGender"
                    value={formData.nextOfKin.gender}
                    onChange={(e) => handleInputChange("gender", e.target.value, "nextOfKin")}
                    className="cc-select"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div className="cc-form-field">
                  <Label htmlFor="nokEmail">Email</Label>
                  <Input
                    id="nokEmail"
                    type="email"
                    value={formData.nextOfKin.email}
                    onChange={(e) => handleInputChange("email", e.target.value, "nextOfKin")}
                    placeholder="Enter email address"
                    className={errors.nextOfKinEmail ? "cc-error" : ""}
                  />
                  {errors.nextOfKinEmail && <span className="cc-error-text">{errors.nextOfKinEmail}</span>}
                </div>
                <div className="cc-form-field">
                  <Label htmlFor="nokPhone1">Primary Phone *</Label>
                  <Input
                    id="nokPhone1"
                    value={formData.nextOfKin.phoneLine1}
                    onChange={(e) => handleInputChange("phoneLine1", e.target.value, "nextOfKin")}
                    placeholder="Enter primary phone number"
                    className={errors.nextOfKinPhoneLine1 ? "cc-error" : ""}
                  />
                  {errors.nextOfKinPhoneLine1 && <span className="cc-error-text">{errors.nextOfKinPhoneLine1}</span>}
                </div>
                <div className="cc-form-field">
                  <Label htmlFor="nokPhone2">Secondary Phone</Label>
                  <Input
                    id="nokPhone2"
                    value={formData.nextOfKin.phoneLine2}
                    onChange={(e) => handleInputChange("phoneLine2", e.target.value, "nextOfKin")}
                    placeholder="Enter secondary phone number"
                  />
                </div>
              </div>
              <div className="cc-form-field">
                <Label htmlFor="nokAddress">Address *</Label>
                <textarea
                  id="nokAddress"
                  value={formData.nextOfKin.address}
                  onChange={(e) => handleInputChange("address", e.target.value, "nextOfKin")}
                  placeholder="Enter address"
                  className={`cc-textarea ${errors.nextOfKinAddress ? "cc-error" : ""}`}
                  rows={2}
                />
                {errors.nextOfKinAddress && <span className="cc-error-text">{errors.nextOfKinAddress}</span>}
              </div>
            </div>

          {error.createCustomer && <div className="cc-error-message">{error.createCustomer}</div>}

          <div className="cc-form-actions">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading.createCustomer}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading.createCustomer} className="cc-submit-btn">
              {loading.createCustomer ? "Creating..." : "Create Customer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const EditCustomer = () => {
  const dispatch = useAppDispatch()
  const { showEditCustomerDialog } = useAppSelector(selectUiState)
  const { currentCustomer, loading, success, error } = useAppSelector(selectCustomers)

  const [formData, setFormData] = useState<CreateCustomerRequest>({
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
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (currentCustomer && showEditCustomerDialog) {
      setFormData({
        title: currentCustomer.title || "",
        lastName: currentCustomer.lastName || "",
        firstName: currentCustomer.firstName || "",
        otherName: currentCustomer.otherName || "",
        gender: currentCustomer.gender,
        email: currentCustomer.email || "",
        address: currentCustomer.address,
        phoneLine1: currentCustomer.phoneLine1 || "",
        phoneLine2: currentCustomer.phoneLine2 || "",
        isOrg: currentCustomer.isOrg,
        orgName: currentCustomer.orgName,
        orgRegNumber: currentCustomer.orgRegNumber,
        orgRegDate: currentCustomer.orgRegDate,
        taxIdNumber: currentCustomer.taxIdNumber,
        cityLGA: currentCustomer.cityLGA,
        stateID: currentCustomer.stateID,
        nationality: currentCustomer.nationality,
        dateOfBirth: currentCustomer.dateOfBirth,
        kycType: currentCustomer.kycType,
        kycNumber: currentCustomer.kycNumber,
        kycIssueDate: currentCustomer.kycIssueDate,
        kycExpiryDate: currentCustomer.kycExpiryDate,
        nextOfKin: currentCustomer.nextOfKin || {
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
      })
    }
  }, [currentCustomer, showEditCustomerDialog])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentCustomer) return

    const newErrors: Record<string, string> = {}

    // Customer type specific validation
    if (formData.isOrg) {
      // Organization validation
      if (!formData.orgName.trim()) newErrors.orgName = "Organization name is required"
      if (!formData.orgRegNumber.trim()) newErrors.orgRegNumber = "Registration number is required"
      if (!formData.orgRegDate.trim()) newErrors.orgRegDate = "Registration date is required"
      if (!formData.taxIdNumber.trim()) newErrors.taxIdNumber = "Tax ID number is required"
    } else {
      // Individual validation
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
      if (!formData.title.trim()) newErrors.title = "Title is required"
      if (!formData.gender.trim()) newErrors.gender = "Gender is required"
      if (!formData.dateOfBirth.trim()) newErrors.dateOfBirth = "Date of birth is required"
      if (!formData.nationality.trim()) newErrors.nationality = "Nationality is required"
    }

    // Common field validation
    if (!formData.address.trim()) newErrors.address = "Address is required"
    if (!formData.phoneLine1.trim()) newErrors.phoneLine1 = "Primary phone is required"
    if (!formData.cityLGA.trim()) newErrors.cityLGA = "City/LGA is required"
    if (!formData.stateID.trim()) newErrors.stateID = "State is required"

    // Email validation (optional but must be valid if provided)
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // KYC validation
    if (formData.kycType !== "NOT_AVAILABLE") {
      if (!formData.kycNumber.trim()) newErrors.kycNumber = "KYC number is required when KYC type is selected"
      if (!formData.kycIssueDate.trim()) newErrors.kycIssueDate = "KYC issue date is required when KYC type is selected"
      if (!formData.kycExpiryDate.trim())
        newErrors.kycExpiryDate = "KYC expiry date is required when KYC type is selected"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Create payload based on customer type
    let payload: any = {
      title: formData.title,
      firstName: formData.firstName,
      lastName: formData.lastName,
      otherName: formData.otherName,
      gender: formData.gender,
      nationality: formData.nationality,
      dateOfBirth: formData.dateOfBirth,
      nextOfKin: formData.nextOfKin,
      email: formData.email,
      address: formData.address,
      phoneLine1: formData.phoneLine1,
      phoneLine2: formData.phoneLine2,
      cityLGA: formData.cityLGA,
      stateID: formData.stateID,
      kycType: formData.kycType,
      kycNumber: formData.kycNumber,
      kycIssueDate: formData.kycIssueDate,
      kycExpiryDate: formData.kycExpiryDate,
      isOrg: formData.isOrg,
    }

    if (formData.isOrg) {
      // Organization fields only
      payload = {
        ...payload,
        orgName: formData.orgName,
        orgRegNumber: formData.orgRegNumber,
        orgRegDate: formData.orgRegDate,
        taxIdNumber: formData.taxIdNumber,
      }
    } else {
      // Individual fields only
      payload = {
        ...payload      }
    }

    dispatch(updateCustomer({ customerID: currentCustomer.customerID, customerData: payload }))
  }

  const handleClose = () => {
    setErrors({})
    dispatch(setShowEditCustomerDialog(false))
  }

  const handleInputChange = (field: string, value: any, nested?: string) => {
    if (nested) {
      setFormData((prev) => ({
        ...prev,
        [nested]: {
          ...prev[nested as keyof CreateCustomerRequest],
          [field]: value,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

    // Clear error when user starts typing
    const errorKey = nested ? `${nested}${field.charAt(0).toUpperCase() + field.slice(1)}` : field
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: "" }))
    }
  }

  useEffect(() => {
    if (success.updateCustomer) {
      handleClose()
      dispatch(clearMessages())
    }
  }, [success.updateCustomer, dispatch])

  if (!currentCustomer) return null

  return (
    <Dialog open={showEditCustomerDialog} onOpenChange={handleClose}>
      <DialogContent className="ec-edit-customer-dialog max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Customer - {currentCustomer.customerID}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="ec-customer-form">
          {/* Customer Type Display */}
          <div className="ec-form-section">
            <h3 className="ec-section-title">Customer Type</h3>
            <div className="ec-type-display">
              <span className={`ec-type-badge ${formData.isOrg ? "ec-org" : "ec-individual"}`}>
                {formData.isOrg ? "Organization" : "Individual"}
              </span>
            </div>
          </div>

          {/* Basic Information */}
          <div className="ec-form-section">
            <h3 className="ec-section-title">Basic Information</h3>
            <div className="ec-form-grid">
              {formData.isOrg ? (
                <>
                  <div className="ec-form-field ec-full-width">
                    <Label htmlFor="editOrgName">Organization Name *</Label>
                    <Input
                      id="editOrgName"
                      value={formData.orgName}
                      onChange={(e) => handleInputChange("orgName", e.target.value)}
                      placeholder="Enter organization name"
                      className={errors.orgName ? "ec-error" : ""}
                    />
                    {errors.orgName && <span className="ec-error-text">{errors.orgName}</span>}
                  </div>
                  <div className="ec-form-field">
                    <Label htmlFor="editOrgRegNumber">Registration Number *</Label>
                    <Input
                      id="editOrgRegNumber"
                      value={formData.orgRegNumber}
                      onChange={(e) => handleInputChange("orgRegNumber", e.target.value)}
                      placeholder="Enter registration number"
                      className={errors.orgRegNumber ? "ec-error" : ""}
                    />
                    {errors.orgRegNumber && <span className="ec-error-text">{errors.orgRegNumber}</span>}
                  </div>
                  <div className="ec-form-field">
                    <Label htmlFor="editOrgRegDate">Registration Date *</Label>
                    <Input
                      id="editOrgRegDate"
                      type="date"
                      value={formData.orgRegDate}
                      onChange={(e) => handleInputChange("orgRegDate", e.target.value)}
                      className={errors.orgRegDate ? "ec-error" : ""}
                    />
                    {errors.orgRegDate && <span className="ec-error-text">{errors.orgRegDate}</span>}
                  </div>
                  <div className="ec-form-field">
                    <Label htmlFor="editTaxIdNumber">Tax ID Number *</Label>
                    <Input
                      id="editTaxIdNumber"
                      value={formData.taxIdNumber}
                      onChange={(e) => handleInputChange("taxIdNumber", e.target.value)}
                      placeholder="Enter tax ID number"
                      className={errors.taxIdNumber ? "ec-error" : ""}
                    />
                    {errors.taxIdNumber && <span className="ec-error-text">{errors.taxIdNumber}</span>}
                  </div>
                </>
              ) : (
                <>
                  <div className="ec-form-field">
                    <Label htmlFor="editTitle">Title *</Label>
                    <select
                      id="editTitle"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className={`ec-select ${errors.title ? "ec-error" : ""}`}
                    >
                      <option value="">Select Title</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Miss">Miss</option>
                      <option value="Dr">Dr</option>
                      <option value="Prof">Prof</option>
                    </select>
                    {errors.title && <span className="ec-error-text">{errors.title}</span>}
                  </div>
                  <div className="ec-form-field">
                    <Label htmlFor="editFirstName">First Name *</Label>
                    <Input
                      id="editFirstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Enter first name"
                      className={errors.firstName ? "ec-error" : ""}
                    />
                    {errors.firstName && <span className="ec-error-text">{errors.firstName}</span>}
                  </div>
                  <div className="ec-form-field">
                    <Label htmlFor="editLastName">Last Name *</Label>
                    <Input
                      id="editLastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Enter last name"
                      className={errors.lastName ? "ec-error" : ""}
                    />
                    {errors.lastName && <span className="ec-error-text">{errors.lastName}</span>}
                  </div>
                  <div className="ec-form-field">
                    <Label htmlFor="editOtherName">Other Name</Label>
                    <Input
                      id="editOtherName"
                      value={formData.otherName}
                      onChange={(e) => handleInputChange("otherName", e.target.value)}
                      placeholder="Enter other name"
                    />
                  </div>
                  <div className="ec-form-field">
                    <Label htmlFor="editGender">Gender *</Label>
                    <select
                      id="editGender"
                      value={formData.gender}
                      onChange={(e) => handleInputChange("gender", e.target.value)}
                      className={`ec-select ${errors.gender ? "ec-error" : ""}`}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                    {errors.gender && <span className="ec-error-text">{errors.gender}</span>}
                  </div>
                  <div className="ec-form-field">
                    <Label htmlFor="editDateOfBirth">Date of Birth *</Label>
                    <Input
                      id="editDateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                      className={errors.dateOfBirth ? "ec-error" : ""}
                    />
                    {errors.dateOfBirth && <span className="ec-error-text">{errors.dateOfBirth}</span>}
                  </div>
                  <div className="ec-form-field">
                    <Label htmlFor="editNationality">Nationality *</Label>
                    <Input
                      id="editNationality"
                      value={formData.nationality}
                      onChange={(e) => handleInputChange("nationality", e.target.value)}
                      placeholder="Enter nationality"
                      className={errors.nationality ? "ec-error" : ""}
                    />
                    {errors.nationality && <span className="ec-error-text">{errors.nationality}</span>}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="ec-form-section">
            <h3 className="ec-section-title">Contact Information</h3>
            <div className="ec-form-grid">
              <div className="ec-form-field">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                  className={errors.email ? "ec-error" : ""}
                />
                {errors.email && <span className="ec-error-text">{errors.email}</span>}
              </div>
              <div className="ec-form-field">
                <Label htmlFor="editPhoneLine1">Primary Phone *</Label>
                <Input
                  id="editPhoneLine1"
                  value={formData.phoneLine1}
                  onChange={(e) => handleInputChange("phoneLine1", e.target.value)}
                  placeholder="Enter primary phone number"
                  className={errors.phoneLine1 ? "ec-error" : ""}
                />
                {errors.phoneLine1 && <span className="ec-error-text">{errors.phoneLine1}</span>}
              </div>
              <div className="ec-form-field">
                <Label htmlFor="editPhoneLine2">Secondary Phone</Label>
                <Input
                  id="editPhoneLine2"
                  value={formData.phoneLine2}
                  onChange={(e) => handleInputChange("phoneLine2", e.target.value)}
                  placeholder="Enter secondary phone number"
                />
              </div>
              <div className="ec-form-field">
                <Label htmlFor="editStateID">State *</Label>
                <Input
                  id="editStateID"
                  value={formData.stateID}
                  onChange={(e) => handleInputChange("stateID", e.target.value)}
                  placeholder="Enter state"
                  className={errors.stateID ? "ec-error" : ""}
                />
                {errors.stateID && <span className="ec-error-text">{errors.stateID}</span>}
              </div>
              <div className="ec-form-field">
                <Label htmlFor="editCityLGA">City/LGA *</Label>
                <Input
                  id="editCityLGA"
                  value={formData.cityLGA}
                  onChange={(e) => handleInputChange("cityLGA", e.target.value)}
                  placeholder="Enter city or LGA"
                  className={errors.cityLGA ? "ec-error" : ""}
                />
                {errors.cityLGA && <span className="ec-error-text">{errors.cityLGA}</span>}
              </div>
            </div>

            <div className="ec-form-field">
              <Label htmlFor="editAddress">Address *</Label>
              <textarea
                id="editAddress"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter full address"
                className={`ec-textarea ${errors.address ? "ec-error" : ""}`}
                rows={3}
              />
              {errors.address && <span className="ec-error-text">{errors.address}</span>}
            </div>
          </div>

          {/* KYC Information */}
          <div className="ec-form-section">
            <h3 className="ec-section-title">KYC Information</h3>
            <div className="ec-form-grid">
              <div className="ec-form-field">
                <Label htmlFor="editKycType">KYC Type</Label>
                <select
                  id="editKycType"
                  value={formData.kycType}
                  onChange={(e) => handleInputChange("kycType", e.target.value)}
                  className="ec-select"
                >
                  <option value="NOT_AVAILABLE">Not Available</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVERS_LICENSE">Driver's License</option>
                  <option value="NATIONAL_ID">National ID</option>
                  <option value="VOTERS_CARD">Voter's Card</option>
                </select>
              </div>
              <div className="ec-form-field">
                <Label htmlFor="editKycNumber">KYC Number</Label>
                <Input
                  id="editKycNumber"
                  value={formData.kycNumber}
                  onChange={(e) => handleInputChange("kycNumber", e.target.value)}
                  placeholder="Enter KYC number"
                  className={errors.kycNumber ? "ec-error" : ""}
                />
                {errors.kycNumber && <span className="ec-error-text">{errors.kycNumber}</span>}
              </div>
              <div className="ec-form-field">
                <Label htmlFor="editKycIssueDate">KYC Issue Date</Label>
                <Input
                  id="editKycIssueDate"
                  type="date"
                  value={formData.kycIssueDate}
                  onChange={(e) => handleInputChange("kycIssueDate", e.target.value)}
                  className={errors.kycIssueDate ? "ec-error" : ""}
                />
                {errors.kycIssueDate && <span className="ec-error-text">{errors.kycIssueDate}</span>}
              </div>
              <div className="ec-form-field">
                <Label htmlFor="editKycExpiryDate">KYC Expiry Date</Label>
                <Input
                  id="editKycExpiryDate"
                  type="date"
                  value={formData.kycExpiryDate}
                  onChange={(e) => handleInputChange("kycExpiryDate", e.target.value)}
                  className={errors.kycExpiryDate ? "ec-error" : ""}
                />
                {errors.kycExpiryDate && <span className="ec-error-text">{errors.kycExpiryDate}</span>}
              </div>
            </div>
          </div>

          {error.updateCustomer && <div className="ec-error-message">{error.updateCustomer}</div>}

          <div className="ec-form-actions">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading.updateCustomer}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading.updateCustomer} className="ec-submit-btn">
              {loading.updateCustomer ? "Updating..." : "Update Customer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const CustomerDetails = () => {
  const dispatch = useAppDispatch()
  const { showCustomerDetailsDialog } = useAppSelector(selectUiState)
  const { currentCustomer, customerPolicies, loading } = useAppSelector(selectCustomers)

  const handleClose = () => {
    dispatch(setShowCustomerDetailsDialog(false))
  }

  if (!currentCustomer) return null

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "1900-01-01") return "N/A"
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getCustomerDisplayName = () => {
    if (currentCustomer.isOrg) {
      return currentCustomer.orgName || "Unknown Organization"
    }
    return `${currentCustomer.firstName || ""} ${currentCustomer.lastName || ""}`.trim() || "Unknown Individual"
  }

  return (
    <Dialog open={showCustomerDetailsDialog} onOpenChange={handleClose}>
      <DialogContent className="cd-customer-details-dialog max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Details - {currentCustomer.customerID}</DialogTitle>
        </DialogHeader>

        <div className="cd-customer-content">
          {/* Customer Header */}
          <div className="cd-customer-header">
            <div className="cd-customer-avatar">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {currentCustomer.isOrg ? (
                  <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
                ) : (
                  <>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </>
                )}
              </svg>
            </div>
            <div className="cd-customer-info">
              <h2 className="cd-customer-name">{getCustomerDisplayName()}</h2>
              <div className="cd-customer-meta">
                <span className={`cd-type-badge ${currentCustomer.isOrg ? "cd-org" : "cd-individual"}`}>
                  {currentCustomer.isOrg ? "Organization" : "Individual"}
                </span>
                <span className="cd-customer-id">ID: {currentCustomer.customerID}</span>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="cd-section">
            <h3 className="cd-section-title">Basic Information</h3>
            <div className="cd-info-grid">
              {currentCustomer.isOrg ? (
                <>
                  <div className="cd-info-item">
                    <span className="cd-label">Organization Name:</span>
                    <span className="cd-value">{currentCustomer.orgName || "N/A"}</span>
                  </div>
                  <div className="cd-info-item">
                    <span className="cd-label">Registration Number:</span>
                    <span className="cd-value">{currentCustomer.orgRegNumber || "N/A"}</span>
                  </div>
                  <div className="cd-info-item">
                    <span className="cd-label">Registration Date:</span>
                    <span className="cd-value">{formatDate(currentCustomer.orgRegDate)}</span>
                  </div>
                  <div className="cd-info-item">
                    <span className="cd-label">Tax ID Number:</span>
                    <span className="cd-value">{currentCustomer.taxIdNumber || "N/A"}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="cd-info-item">
                    <span className="cd-label">Title:</span>
                    <span className="cd-value">{currentCustomer.title || "N/A"}</span>
                  </div>
                  <div className="cd-info-item">
                    <span className="cd-label">First Name:</span>
                    <span className="cd-value">{currentCustomer.firstName || "N/A"}</span>
                  </div>
                  <div className="cd-info-item">
                    <span className="cd-label">Last Name:</span>
                    <span className="cd-value">{currentCustomer.lastName || "N/A"}</span>
                  </div>
                  <div className="cd-info-item">
                    <span className="cd-label">Other Name:</span>
                    <span className="cd-value">{currentCustomer.otherName || "N/A"}</span>
                  </div>
                  <div className="cd-info-item">
                    <span className="cd-label">Gender:</span>
                    <span className="cd-value">{currentCustomer.gender}</span>
                  </div>
                  <div className="cd-info-item">
                    <span className="cd-label">Date of Birth:</span>
                    <span className="cd-value">{formatDate(currentCustomer.dateOfBirth)}</span>
                  </div>
                  <div className="cd-info-item">
                    <span className="cd-label">Nationality:</span>
                    <span className="cd-value">{currentCustomer.nationality || "N/A"}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="cd-section">
            <h3 className="cd-section-title">Contact Information</h3>
            <div className="cd-info-grid">
              <div className="cd-info-item">
                <span className="cd-label">Email:</span>
                <span className="cd-value">{currentCustomer.email || "N/A"}</span>
              </div>
              <div className="cd-info-item">
                <span className="cd-label">Primary Phone:</span>
                <span className="cd-value">{currentCustomer.phoneLine1 || "N/A"}</span>
              </div>
              <div className="cd-info-item">
                <span className="cd-label">Secondary Phone:</span>
                <span className="cd-value">{currentCustomer.phoneLine2 || "N/A"}</span>
              </div>
              <div className="cd-info-item">
                <span className="cd-label">State:</span>
                <span className="cd-value">{currentCustomer.stateID || "N/A"}</span>
              </div>
              <div className="cd-info-item">
                <span className="cd-label">City/LGA:</span>
                <span className="cd-value">{currentCustomer.cityLGA || "N/A"}</span>
              </div>
            </div>
            <div className="cd-info-item cd-full-width">
              <span className="cd-label">Address:</span>
              <span className="cd-value">{currentCustomer.address}</span>
            </div>
          </div>

          {/* KYC Information */}
          <div className="cd-section">
            <h3 className="cd-section-title">KYC Information</h3>
            <div className="cd-info-grid">
              <div className="cd-info-item">
                <span className="cd-label">KYC Type:</span>
                <span className="cd-value">{currentCustomer.kycType.replace("_", " ")}</span>
              </div>
              <div className="cd-info-item">
                <span className="cd-label">KYC Number:</span>
                <span className="cd-value">{currentCustomer.kycNumber || "N/A"}</span>
              </div>
              <div className="cd-info-item">
                <span className="cd-label">Issue Date:</span>
                <span className="cd-value">{formatDate(currentCustomer.kycIssueDate)}</span>
              </div>
              <div className="cd-info-item">
                <span className="cd-label">Expiry Date:</span>
                <span className="cd-value">{formatDate(currentCustomer.kycExpiryDate)}</span>
              </div>
            </div>
          </div>

          {/* Next of Kin (for individuals) */}
          {!currentCustomer.isOrg && currentCustomer.nextOfKin && (
            <div className="cd-section">
              <h3 className="cd-section-title">Next of Kin</h3>
              <div className="cd-info-grid">
                <div className="cd-info-item">
                  <span className="cd-label">Name:</span>
                  <span className="cd-value">
                    {`${currentCustomer.nextOfKin.title || ""} ${currentCustomer.nextOfKin.firstName || ""} ${currentCustomer.nextOfKin.lastName || ""}`.trim() ||
                      "N/A"}
                  </span>
                </div>
                <div className="cd-info-item">
                  <span className="cd-label">Other Name:</span>
                  <span className="cd-value">{currentCustomer.nextOfKin.otherName || "N/A"}</span>
                </div>
                <div className="cd-info-item">
                  <span className="cd-label">Gender:</span>
                  <span className="cd-value">{currentCustomer.nextOfKin.gender}</span>
                </div>
                <div className="cd-info-item">
                  <span className="cd-label">Email:</span>
                  <span className="cd-value">{currentCustomer.nextOfKin.email || "N/A"}</span>
                </div>
                <div className="cd-info-item">
                  <span className="cd-label">Phone:</span>
                  <span className="cd-value">{currentCustomer.nextOfKin.phoneLine1 || "N/A"}</span>
                </div>
              </div>
              {currentCustomer.nextOfKin.address && (
                <div className="cd-info-item cd-full-width">
                  <span className="cd-label">Address:</span>
                  <span className="cd-value">{currentCustomer.nextOfKin.address}</span>
                </div>
              )}
            </div>
          )}

          {/* Customer Policies */}
          <div className="cd-section">
            <h3 className="cd-section-title">Customer Policies</h3>
            {loading.getCustomerPolicies ? (
              <div className="cd-loading-state">
                <div className="cd-loading-spinner"></div>
                <p>Loading policies...</p>
              </div>
            ) : customerPolicies.length === 0 ? (
              <div className="cd-empty-policies">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10,9 9,9 8,9" />
                </svg>
                <p>No policies found for this customer</p>
              </div>
            ) : (
              <div className="cd-policies-table">
                <table>
                  <thead>
                    <tr>
                      <th>Policy No</th>
                      <th>Effective Date</th>
                      <th>Product</th>
                      <th>Broker</th>
                      <th>Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerPolicies.map((policy, index) => (
                      <tr key={index}>
                        <td>{policy.policyNo}</td>
                        <td>{formatDate(policy.effectiveDate)}</td>
                        <td>{policy.product}</td>
                        <td>{policy.broker}</td>
                        <td>{formatCurrency(policy.premium)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="cd-form-actions">
          <Button onClick={handleClose} className="cd-close-btn">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
