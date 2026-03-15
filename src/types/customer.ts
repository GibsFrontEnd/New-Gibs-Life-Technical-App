export interface Customer {
  customerID: string
  title: string
  lastName: string | null
  firstName: string | null
  otherName: string | null
  gender: "MALE" | "FEMALE"
  email: string | null
  address: string
  phoneLine1: string | null
  phoneLine2: string | null
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
  nextOfKin: NextOfKin | null
}

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

export interface CreateCustomerRequest {
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

export interface CustomerPolicy {
  policyNo: string
  effectiveDate: string
  product: string
  broker: string
  premium: number
}

export interface CustomerState {
  customers: Customer[]
  currentCustomer: Customer | null
  customerPolicies: CustomerPolicy[]
  loading: {
    getAllCustomers: boolean
    createCustomer: boolean
    updateCustomer: boolean
    deleteCustomer: boolean
    getCustomerPolicies: boolean
  }
  error: {
    getAllCustomers: string | null
    createCustomer: string | null
    updateCustomer: string | null
    deleteCustomer: string | null
    getCustomerPolicies: string | null
  }
  success: {
    createCustomer: boolean
    updateCustomer: boolean
    deleteCustomer: boolean
  }
}
