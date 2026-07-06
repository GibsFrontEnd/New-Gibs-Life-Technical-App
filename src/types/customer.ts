// Matches the GET /v1/Customers response (insured/party schema).
// customerID === insuredID.
export interface Customer {
  insuredID: string
  surName: string | null
  otherNames: string | null
  title: string | null
  address: string | null
  fullName: string | null
  state: string | null
  landphone: string | null
  mobilePhone: string | null
  email: string | null
  nationalID: string | null
  occupation: string | null
  sex: string | null
  maritalStatus: string | null
  country: string | null
  dateofBirth: string | null
  age: number | null
  height: number | null
  weight: number | null
  reinBalance: number | null
  remarks: string | null
  deleted: number
  active: number
  clientType: string | null
  submittedBy: string | null
  submittedOn: string | null
  modifiedBy: string | null
  modifiedOn: string | null
  password?: string | null
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
  password: string
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
