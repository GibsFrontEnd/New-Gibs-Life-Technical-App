//@ts-nocheck
import type React from "react"
import { useEffect, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
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
import { useToast } from "./UI/use-toast"
import "./components.customers.css"


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

const formatApiDate = (dateVal?: string | null): string | null => {
  if (!dateVal || !dateVal.trim()) return null
  const clean = dateVal.trim()
  if (clean.includes("T")) return clean
  return `${clean}T00:00:00`
}

export const CreateCustomer = () => {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const { showCreateCustomerDialog } = useAppSelector(selectUiState)
  const { loading, success, error } = useAppSelector(selectCustomers)

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
    password: "",
    cityLGA: "",
    stateID: "",
    nationality: "Nigeria",
    dateOfBirth: "",
    kycType: "",
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
      if (!formData.nationality.trim()) newErrors.nationality = "Nationality is required"
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
      if (!formData.nextOfKin.email.trim()) {
        newErrors.nextOfKinEmail = "Next of kin email is required"
      } else if (!/\S+@\S+\.\S+/.test(formData.nextOfKin.email)) {
        newErrors.nextOfKinEmail = "Please enter a valid next of kin email address"
      }
    }

    // Common field validation
    if (!formData.address.trim()) newErrors.address = "Address is required"
    if (!formData.phoneLine1.trim()) newErrors.phoneLine1 = "Primary phone is required"
    if (!formData.cityLGA.trim()) newErrors.cityLGA = "City/LGA is required"
    if (!formData.stateID.trim()) newErrors.stateID = "State is required"
    if (!formData.isOrg && !formData.password.trim()) newErrors.password = "Password is required"

    // Email validation (optional but must be valid if provided)
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // KYC validation — only for individuals when a specific KYC type is selected
    if (!formData.isOrg && formData.kycType && formData.kycType !== "NOT_AVAILABLE") {
      if (!formData.kycNumber.trim()) newErrors.kycNumber = "KYC number is required"
      if (!formData.kycIssueDate.trim()) newErrors.kycIssueDate = "KYC issue date is required"
      if (!formData.kycExpiryDate.trim()) newErrors.kycExpiryDate = "KYC expiry date is required"
    }

    // Phone number validation
    const phoneRegex = /^[0-9+\-\s()]+$/
    if (formData.phoneLine1 && !phoneRegex.test(formData.phoneLine1)) {
      newErrors.phoneLine1 = "Please enter a valid phone number"
    }
    if (formData.phoneLine2 && !phoneRegex.test(formData.phoneLine2)) {
      newErrors.phoneLine2 = "Please enter a valid phone number"
    }

    // Date validation for Individual
    if (!formData.isOrg && formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth)
      const today = new Date()
      if (birthDate >= today) {
        newErrors.dateOfBirth = "Date of birth must be in the past"
      }
    }

    if (formData.kycType && formData.kycType !== "NOT_AVAILABLE" && formData.kycIssueDate && formData.kycExpiryDate) {
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

    const formattedDOB = formData.isOrg ? null : formatApiDate(formData.dateOfBirth)
    const formattedOrgRegDate = formData.isOrg ? formatApiDate(formData.orgRegDate) : null
    const formattedKycIssueDate = formData.kycType && formData.kycType !== "NOT_AVAILABLE" ? formatApiDate(formData.kycIssueDate) : null
    const formattedKycExpiryDate = formData.kycType && formData.kycType !== "NOT_AVAILABLE" ? formatApiDate(formData.kycExpiryDate) : null

    let payload: any

    if (formData.isOrg) {
      // Organization payload: exact fields requested
      payload = {
        isOrg: true,
        email: formData.email && formData.email.trim() ? formData.email.trim() : "",
        address: formData.address || "",
        phoneLine1: formData.phoneLine1 || "",
        cityLGA: formData.cityLGA || "",
        stateID: formData.stateID || "",
        nationality: formData.nationality?.trim() || "Nigeria",
        orgName: formData.orgName.trim(),
        orgRegNumber: formData.orgRegNumber?.trim() || "",
        orgRegDate: formData.orgRegDate ? formData.orgRegDate.split("T")[0] : "",
      }
    } else {
      // Individual payload
      payload = {
        title: formData.title || "",
        lastName: formData.lastName || "",
        firstName: formData.firstName || "",
        otherName: formData.otherName || "",
        gender: formData.gender || "MALE",
        address: formData.address || "",
        phoneLine1: formData.phoneLine1 || "",
        phoneLine2: formData.phoneLine2 || "",
        isOrg: false,
        password: formData.password || "",
        email: formData.email && formData.email.trim() ? formData.email.trim() : "",
        cityLGA: formData.cityLGA || "",
        stateID: formData.stateID || "",
        nationality: formData.nationality || "",
        dateOfBirth: formattedDOB,
        kycType: formData.kycType || "NOT_AVAILABLE",
        kycNumber: formData.kycNumber || "",
        kycIssueDate: formattedKycIssueDate,
        kycExpiryDate: formattedKycExpiryDate,
        nextOfKin: formData.nextOfKin,
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
      password: "",
      cityLGA: "",
      stateID: "",
      nationality: "Nigeria",
      dateOfBirth: "",
      kycType: "",
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
      toast({
        title: "Customer Created",
        description: "New customer record has been created successfully.",
        variant: "success",
      })
      handleClose()
      dispatch(clearMessages())
    }
  }, [success.createCustomer, dispatch, toast])

  useEffect(() => {
    if (error.createCustomer) {
      toast({
        title: "Creation Failed",
        description: error.createCustomer,
        variant: "error",
      })
    }
  }, [error.createCustomer, toast])

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
                    <Label htmlFor="nationality">Nationality *</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => handleInputChange("nationality", e.target.value)}
                      placeholder="e.g. Nigeria"
                      className={errors.nationality ? "cc-error" : ""}
                    />
                    {errors.nationality && <span className="cc-error-text">{errors.nationality}</span>}
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
              {!formData.isOrg && (
                <div className="cc-form-field">
                  <Label htmlFor="password">Password *</Label>
                  <PasswordInput
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Enter portal password"
                    className={errors.password ? "cc-error" : ""}
                  />
                  {errors.password && <span className="cc-error-text">{errors.password}</span>}
                </div>
              )}
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
              {!formData.isOrg && (
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
              )}
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

          {/* KYC Information (individuals only — not applicable to organizations) */}
          {!formData.isOrg && (
            <div className="cc-form-section">
              <h3 className="cc-section-title">KYC Information</h3>
              <div className="cc-form-grid">
                <div className="cc-form-field">
                  <Label htmlFor="kycType">KYC Type *</Label>
                  <select
                    id="kycType"
                    value={formData.kycType}
                    onChange={(e) => handleInputChange("kycType", e.target.value)}
                    className={`cc-select ${errors.kycType ? "cc-error" : ""}`}
                  >
                    <option value="">Select KYC Type</option>
                    <option value="NOT_AVAILABLE">Not Available</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="DRIVERS_LICENSE">Driver's License</option>
                    <option value="NATIONAL_ID_CARD">National ID Card</option>
                    <option value="COMPANY_REG_NO">Company Registration Number</option>
                  </select>
                  {errors.kycType && <span className="cc-error-text">{errors.kycType}</span>}
                </div>
                <div className="cc-form-field">
                  <Label htmlFor="kycNumber">KYC Number *</Label>
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
                  <Label htmlFor="kycIssueDate">KYC Issue Date *</Label>
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
                  <Label htmlFor="kycExpiryDate">KYC Expiry Date *</Label>
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
          )}

          {/* Next of Kin (individuals only — not applicable to organizations) */}
          {!formData.isOrg && (
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
                  <Label htmlFor="nokEmail">Email *</Label>
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
          )}

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
  const { toast } = useToast()
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
      const rawType = (currentCustomer.clientType || "").trim().toUpperCase()
      const isOrg =
        currentCustomer.isOrg === true ||
        rawType === "CORPORATE" ||
        rawType === "CORP" ||
        rawType === "ORGANIZATION" ||
        rawType === "ORGANISATION"

      const lName = currentCustomer.surName || currentCustomer.lastName || ""
      let fName = currentCustomer.firstName || ""
      if (!fName && currentCustomer.fullName) {
        fName = currentCustomer.fullName.replace(lName, "").trim()
      }

      setFormData({
        title: currentCustomer.title || "",
        lastName: lName,
        firstName: fName,
        otherName: currentCustomer.otherNames || currentCustomer.otherName || "",
        gender: currentCustomer.sex || currentCustomer.gender || "MALE",
        email: currentCustomer.email && currentCustomer.email.trim() !== "@" ? currentCustomer.email : "",
        address: currentCustomer.address || "",
        phoneLine1: currentCustomer.mobilePhone || currentCustomer.phoneLine1 || "",
        phoneLine2: currentCustomer.landphone || currentCustomer.phoneLine2 || "",
        isOrg: isOrg,
        orgName: currentCustomer.orgName || (isOrg ? currentCustomer.fullName || currentCustomer.surName : "") || "",
        orgRegNumber: isOrg
          ? (currentCustomer.nationalID || currentCustomer.nationalId || currentCustomer.orgRegNumber || "")
          : (currentCustomer.orgRegNumber || ""),
        orgRegDate: isOrg
          ? (currentCustomer.dateofBirth ? currentCustomer.dateofBirth.split("T")[0] : currentCustomer.dateOfBirth ? currentCustomer.dateOfBirth.split("T")[0] : currentCustomer.orgRegDate ? currentCustomer.orgRegDate.split("T")[0] : "")
          : (currentCustomer.orgRegDate ? currentCustomer.orgRegDate.split("T")[0] : ""),
        taxIdNumber: "",
        cityLGA: currentCustomer.cityLGA || "",
        stateID: currentCustomer.state || currentCustomer.stateID || "",
        nationality: currentCustomer.country || currentCustomer.nationality || "Nigeria",
        dateOfBirth: currentCustomer.dateofBirth ? currentCustomer.dateofBirth.split("T")[0] : currentCustomer.dateOfBirth ? currentCustomer.dateOfBirth.split("T")[0] : "",
        kycType: currentCustomer.kycType || "NOT_AVAILABLE",
        kycNumber: currentCustomer.kycNumber || currentCustomer.nationalID || "",
        kycIssueDate: currentCustomer.kycIssueDate ? currentCustomer.kycIssueDate.split("T")[0] : "",
        kycExpiryDate: currentCustomer.kycExpiryDate ? currentCustomer.kycExpiryDate.split("T")[0] : "",
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
      if (!formData.nationality.trim()) newErrors.nationality = "Nationality is required"
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
    if (!formData.isOrg && formData.kycType !== "NOT_AVAILABLE") {
      if (!formData.kycNumber.trim()) newErrors.kycNumber = "KYC number is required when KYC type is selected"
      if (!formData.kycIssueDate.trim()) newErrors.kycIssueDate = "KYC issue date is required when KYC type is selected"
      if (!formData.kycExpiryDate.trim())
        newErrors.kycExpiryDate = "KYC expiry date is required when KYC type is selected"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const customerIdentifier = currentCustomer.insuredID || currentCustomer.customerID

    const formattedDOB = formData.isOrg ? null : formatApiDate(formData.dateOfBirth)
    const formattedOrgRegDate = formData.isOrg ? formatApiDate(formData.orgRegDate) : null
    const formattedKycIssueDate = formData.kycType && formData.kycType !== "NOT_AVAILABLE" ? formatApiDate(formData.kycIssueDate) : null
    const formattedKycExpiryDate = formData.kycType && formData.kycType !== "NOT_AVAILABLE" ? formatApiDate(formData.kycExpiryDate) : null

    let payload: any

    if (formData.isOrg) {
      // Organization payload: omit individual fields
      payload = {
        insuredID: customerIdentifier,
        isOrg: true,
        orgName: formData.orgName.trim(),
        orgRegNumber: formData.orgRegNumber?.trim() || "",
        orgRegDate: formattedOrgRegDate,
        nationality: formData.nationality?.trim() || "Nigerian",
        address: formData.address || "",
        phoneLine1: formData.phoneLine1 || "",
        phoneLine2: formData.phoneLine2 || "",
        email: formData.email && formData.email.trim() ? formData.email.trim() : "",
        cityLGA: formData.cityLGA || "",
        stateID: formData.stateID || "",
        kycType: formData.kycType || "NOT_AVAILABLE",
        kycNumber: formData.kycNumber || "",
        kycIssueDate: formattedKycIssueDate,
        kycExpiryDate: formattedKycExpiryDate,
        remarks: currentCustomer.remarks || "",
        active: currentCustomer.active ?? 1,
      }
    } else {
      // Individual payload
      payload = {
        insuredID: customerIdentifier,
        title: formData.title || "",
        lastName: formData.lastName || "",
        firstName: formData.firstName || "",
        otherName: formData.otherName || "",
        gender: formData.gender || "MALE",
        isOrg: false,
        address: formData.address || "",
        phoneLine1: formData.phoneLine1 || "",
        phoneLine2: formData.phoneLine2 || "",
        email: formData.email && formData.email.trim() ? formData.email.trim() : "",
        cityLGA: formData.cityLGA || "",
        stateID: formData.stateID || "",
        nationality: formData.nationality || "",
        dateOfBirth: formattedDOB,
        kycType: formData.kycType || "NOT_AVAILABLE",
        kycNumber: formData.kycNumber || "",
        kycIssueDate: formattedKycIssueDate,
        kycExpiryDate: formattedKycExpiryDate,
        nextOfKin: formData.nextOfKin,
        remarks: currentCustomer.remarks || "",
        active: currentCustomer.active ?? 1,
      }
    }

    dispatch(updateCustomer({ customerID: customerIdentifier, customerData: payload }))
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
      toast({
        title: "Customer Updated",
        description: "Customer record has been updated successfully.",
        variant: "success",
      })
      handleClose()
      dispatch(clearMessages())
    }
  }, [success.updateCustomer, dispatch, toast])

  useEffect(() => {
    if (error.updateCustomer) {
      toast({
        title: "Update Failed",
        description: error.updateCustomer,
        variant: "error",
      })
    }
  }, [error.updateCustomer, toast])

  if (!currentCustomer) return null

  return (
    <Dialog open={showEditCustomerDialog} onOpenChange={handleClose}>
      <DialogContent className="ec-edit-customer-dialog max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Customer - {currentCustomer.insuredID || currentCustomer.customerID || "N/A"}</DialogTitle>
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
                    <Label htmlFor="editNationality">Nationality *</Label>
                    <Input
                      id="editNationality"
                      value={formData.nationality}
                      onChange={(e) => handleInputChange("nationality", e.target.value)}
                      placeholder="e.g. Nigeria"
                      className={errors.nationality ? "ec-error" : ""}
                    />
                    {errors.nationality && <span className="ec-error-text">{errors.nationality}</span>}
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
          </div>          {/* KYC Information (individuals only — not applicable to organizations) */}
          {!formData.isOrg && (
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
                    <option value="NATIONAL_ID_CARD">National ID Card</option>
                    <option value="COMPANY_REG_NO">Company Registration Number</option>
                  </select>
                </div>
                <div className="cc-form-field">
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
          )}

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
  const { currentCustomer, loading } = useAppSelector(selectCustomers)

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

  const rawType = (currentCustomer.clientType || "").trim().toUpperCase()
  const isOrg =
    currentCustomer.isOrg === true ||
    rawType === "CORPORATE" ||
    rawType === "CORP" ||
    rawType === "ORGANIZATION" ||
    rawType === "ORGANISATION"

  const clientTypeDisplay = isOrg ? "Organization" : "Individual"

  const getCustomerDisplayName = () => {
    if (isOrg && currentCustomer.orgName) return currentCustomer.orgName
    return (
      currentCustomer.fullName ||
      `${currentCustomer.title ? currentCustomer.title + " " : ""}${currentCustomer.surName || ""} ${currentCustomer.otherNames || ""}`.trim() ||
      currentCustomer.orgName ||
      "Unknown"
    )
  }

  return (
    <Dialog open={showCustomerDetailsDialog} onOpenChange={handleClose}>
      <DialogContent className="cd-customer-details-dialog max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Details - {currentCustomer.insuredID || currentCustomer.customerID || "N/A"}</DialogTitle>
        </DialogHeader>

        <div className="cd-customer-content">
          {/* Customer Header */}
          <div className="cd-customer-header">
            <div className="cd-customer-avatar">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="cd-customer-info">
              <h2 className="cd-customer-name">{getCustomerDisplayName()}</h2>
              <div className="cd-customer-meta">
                <span className={`cd-type-badge ${isOrg ? "cd-org" : "cd-individual"}`}>
                  {clientTypeDisplay}
                </span>
                <span className="cd-customer-id">ID: {currentCustomer.insuredID || "N/A"}</span>
              </div>
            </div>
          </div>

          {loading.getCustomer ? (
            <div className="cd-loading-state">
              <div className="cd-loading-spinner"></div>
              <p>Loading customer details...</p>
            </div>
          ) : (
            <>
              {/* Basic Information */}
              <div className="cd-section">
                <h3 className="cd-section-title">{isOrg ? "Organization Information" : "Basic Information"}</h3>
                <div className="cd-info-grid">
                  {isOrg ? (
                    <>
                      <div className="cd-info-item">
                        <span className="cd-label">Organization Name:</span>
                        <span className="cd-value">{getCustomerDisplayName()}</span>
                      </div>
                      <div className="cd-info-item">
                        <span className="cd-label">Client Type:</span>
                        <span className="cd-value">Organization</span>
                      </div>
                      <div className="cd-info-item">
                        <span className="cd-label">State:</span>
                        <span className="cd-value">{currentCustomer.state || "N/A"}</span>
                      </div>
                      <div className="cd-info-item">
                        <span className="cd-label">Country:</span>
                        <span className="cd-value">{currentCustomer.country || "N/A"}</span>
                      </div>
                      {(currentCustomer.orgRegNumber || (currentCustomer.isOrg && currentCustomer.nationalID)) && (
                        <div className="cd-info-item">
                          <span className="cd-label">Registration Number:</span>
                          <span className="cd-value">{currentCustomer.orgRegNumber || currentCustomer.nationalID}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="cd-info-item">
                        <span className="cd-label">Title:</span>
                        <span className="cd-value">{currentCustomer.title || "N/A"}</span>
                      </div>
                      <div className="cd-info-item">
                        <span className="cd-label">Surname:</span>
                        <span className="cd-value">{currentCustomer.surName || "N/A"}</span>
                      </div>
                      <div className="cd-info-item">
                        <span className="cd-label">Other Names:</span>
                        <span className="cd-value">{currentCustomer.otherNames || "N/A"}</span>
                      </div>
                      <div className="cd-info-item">
                        <span className="cd-label">Full Name:</span>
                        <span className="cd-value">{currentCustomer.fullName || getCustomerDisplayName()}</span>
                      </div>
                      <div className="cd-info-item">
                        <span className="cd-label">Gender / Sex:</span>
                        <span className="cd-value">{currentCustomer.sex || currentCustomer.gender || "N/A"}</span>
                      </div>
                      <div className="cd-info-item">
                        <span className="cd-label">Date of Birth:</span>
                        <span className="cd-value">{formatDate(currentCustomer.dateofBirth || currentCustomer.dateOfBirth)}</span>
                      </div>
                      <div className="cd-info-item">
                        <span className="cd-label">Age:</span>
                        <span className="cd-value">{currentCustomer.age ?? "N/A"}</span>
                      </div>
                      <div className="cd-info-item">
                        <span className="cd-label">Marital Status:</span>
                        <span className="cd-value">{currentCustomer.maritalStatus || "N/A"}</span>
                      </div>
                      <div className="cd-info-item">
                        <span className="cd-label">Occupation:</span>
                        <span className="cd-value">{currentCustomer.occupation || "N/A"}</span>
                      </div>
                      <div className="cd-info-item">
                        <span className="cd-label">National ID:</span>
                        <span className="cd-value">{currentCustomer.nationalID || "N/A"}</span>
                      </div>
                      <div className="cd-info-item">
                        <span className="cd-label">Country:</span>
                        <span className="cd-value">{currentCustomer.country || "N/A"}</span>
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
                    <span className="cd-value">
                      {currentCustomer.email && currentCustomer.email.trim() !== "@"
                        ? currentCustomer.email
                        : "N/A"}
                    </span>
                  </div>
                  <div className="cd-info-item">
                    <span className="cd-label">Mobile Phone:</span>
                    <span className="cd-value">{currentCustomer.mobilePhone || currentCustomer.phoneLine1 || "N/A"}</span>
                  </div>
                  <div className="cd-info-item">
                    <span className="cd-label">Land Phone:</span>
                    <span className="cd-value">{currentCustomer.landphone || currentCustomer.phoneLine2 || "N/A"}</span>
                  </div>
                  <div className="cd-info-item">
                    <span className="cd-label">State:</span>
                    <span className="cd-value">{currentCustomer.state || "N/A"}</span>
                  </div>
                  <div className="cd-info-item">
                    <span className="cd-label">Country:</span>
                    <span className="cd-value">{currentCustomer.country || "N/A"}</span>
                  </div>
                </div>
                <div className="cd-info-item cd-full-width" style={{ marginTop: "1rem" }}>
                  <span className="cd-label">Address:</span>
                  <span className="cd-value">{currentCustomer.address || "N/A"}</span>
                </div>
              </div>

              {/* Record Information */}
              <div className="cd-section">
                <h3 className="cd-section-title">Record Information</h3>
                <div className="cd-info-grid">
                  <div className="cd-info-item">
                    <span className="cd-label">Status:</span>
                    <span className="cd-value">{currentCustomer.active === 1 ? "Active" : "Inactive"}</span>
                  </div>
                  <div className="cd-info-item">
                    <span className="cd-label">Remarks:</span>
                    <span className="cd-value">{currentCustomer.remarks || "N/A"}</span>
                  </div>
                  {currentCustomer.reinBalance != null && (
                    <div className="cd-info-item">
                      <span className="cd-label">Reinsurance Balance:</span>
                      <span className="cd-value">{formatCurrency(currentCustomer.reinBalance)}</span>
                    </div>
                  )}
                  <div className="cd-info-item">
                    <span className="cd-label">Submitted By:</span>
                    <span className="cd-value">{currentCustomer.submittedBy || "N/A"}</span>
                  </div>
                  <div className="cd-info-item">
                    <span className="cd-label">Submitted On:</span>
                    <span className="cd-value">{formatDate(currentCustomer.submittedOn)}</span>
                  </div>
                  <div className="cd-info-item">
                    <span className="cd-label">Modified By:</span>
                    <span className="cd-value">{currentCustomer.modifiedBy || "N/A"}</span>
                  </div>
                  <div className="cd-info-item">
                    <span className="cd-label">Modified On:</span>
                    <span className="cd-value">{formatDate(currentCustomer.modifiedOn)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
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
