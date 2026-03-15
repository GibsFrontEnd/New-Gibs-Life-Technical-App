// Policy Field Interface
export interface PolicyField {
  code: string
  value: string
}

// Policy Rate Interface
export interface PolicyRate {
  code: string
  value: string
}

// Policy SMI (Sum Insured Item) Interface
export interface PolicySMI {
  code: string
  sumInsured: number
  premium: number
  premiumRate: number
  description: string
}

// Policy Section Interface
export interface PolicySection {
  sectionID: string
  sectionSumInsured: number
  sectionPremium: number
  fields: PolicyField[]
  rates: PolicyRate[]
  smIs: PolicySMI[]
}

// Next of Kin Interface
export interface NextOfKin {
  title: string
  lastName: string
  firstName: string
  otherName: string
  gender: "MALE" | "FEMALE"
  email: string
  address: string
  phoneLine1: string
  phoneLine2: string
}

// Insured Person/Organization Interface
export interface Insured {
  title: string
  lastName: string
  firstName: string
  otherName: string
  gender: "MALE" | "FEMALE"
  email: string
  address: string
  phoneLine1: string
  phoneLine2: string
  isOrg: boolean
  orgName: string
  orgRegNumber: string
  orgRegDate: string
  taxIdNumber: string
  cityLGA: string
  stateID: string
  nationality: string
  dateOfBirth: string
  kycType: "NOT_AVAILABLE" | "PASSPORT" | "DRIVERS_LICENSE" | "NATIONAL_ID" | "VOTERS_CARD"
  kycNumber: string
  kycIssueDate: string
  kycExpiryDate: string
  nextOfKin: NextOfKin
}

// Main Policy Interface
export interface Policy {
  documentNo: string
  policyNo: string
  naicomID: string | null
  productID: string
  agentID: string
  entryDate: string
  startDate: string
  endDate: string
  sumInsured: number
  premium: number
  fxRate: number
  fxCurrency: string
  customerName: string
  customerID: string
  sections: PolicySection[]
}

// Create Policy Request Interface
export interface CreatePolicyRequest {
  startDate: string
  endDate: string
  fxCurrency: string
  fxRate: number
  agentID: string
  paymentAccountID: string
  paymentReferenceID: string
  productID: string
  subChannelID: string
  insured: Insured
  sections: PolicySection[]
}

// Renew Policy Request Interface
export interface RenewPolicyRequest {
  startDate: string
  endDate: string
  fxCurrency: string
  fxRate: number
  agentID: string
  paymentAccountID: string
  paymentReferenceID: string
}

// Policy Sections Filter Request
export interface PolicySectionsFilterRequest {
  fieldName: string
  fieldValue: string
}

// NIIP Upload Response Interface
export interface NIIPUploadResponse {
  policyNo: string
  success: boolean
  resultCode: number
  resultMessage: string
  errorDetails: string
  requestJson: string
}

// Policy State Interface
export interface PolicyState {
  policies: Policy[]
  currentPolicy: Policy | null
  policySections: PolicySection[]
  loading: {
    getAllPolicies: boolean
    getPolicyDetails: boolean
    createPolicy: boolean
    renewPolicy: boolean
    endorsePolicy: boolean
    cancelPolicy: boolean
    niipUpload: boolean
    getPolicySections: boolean
  }
  error: {
    getAllPolicies: string | null
    getPolicyDetails: string | null
    createPolicy: string | null
    renewPolicy: string | null
    endorsePolicy: string | null
    cancelPolicy: string | null
    niipUpload: string | null
    getPolicySections: string | null
  }
  success: {
    createPolicy: boolean
    renewPolicy: boolean
    endorsePolicy: boolean
    cancelPolicy: boolean
    niipUpload: boolean
  }
  niipResponse: NIIPUploadResponse | null
}
