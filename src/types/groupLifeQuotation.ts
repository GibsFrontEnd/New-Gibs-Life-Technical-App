export interface GroupLifeMember {
  id: string
  employeeNames: string;
  sex: string;
  dateOfBirth: string
  anb: number // Age Next Birthday
  totalEmolument: number
  sumInsured: number
  premium: number
  rate: number
  staffNo?: string
  basicSalary?: number
  housingAllowance?: number
  transportAllowance?: number
  hireDate?: string
}

export interface GroupLifeExtension {
  id: string
  itemNo: number
  description: string
  rate: number
  itemValue: number
}

export interface GroupLifeQuotation {
  id: string
  quotationNumber: string
  transactionDate: string
  effectiveDate: string
  expiryDate: string
  coverDay: number

  // Client Information
  companyName: string
  address?: string
  email?: string
  phone?: string

  // Policy Details
  insuredType: "Company" | "Individual"
  schemeType: "Credit life" | "Group life"
  groupFactorAmount: number
  groupLifeFactor: number
  rateType: "Fixed" | "Variable" | "Premium"
  existingClient: boolean

  // Members
  members: GroupLifeMember[]
  totalMembers: number

  // Extensions
  extensions: GroupLifeExtension[]
  groupLifeExtension: boolean

  // Financial Details
  totalSumInsured: number
  totalPremium: number
  loadingPercentage: number
  reductionPercentage: number
  netPremiumDue: number

  // Status
  status: "PROSPECT" | "ACTIVE" | "PENDING" | "CANCELLED"

  // Metadata
  createdAt: string
  updatedAt: string
}

export interface GroupLifeQuotationFilters {
  searchField: "companyName" | "quotationNumber"
  searchValue: string
  startDate: string
  endDate: string
  status: "all" | "prospect" | "active" | "pending" | "cancelled"
  schemeType: "all" | "Credit life" | "Group life"
  insuredType: "all" | "Company" | "Individual"
  tag: string
}

export interface CreateGroupLifeQuotationDto {
  companyName: string
  insuredType: "Company" | "Individual"
  schemeType: "Credit life" | "Group life"
  effectiveDate: string
  expiryDate: string
  groupFactorAmount: number
  rateType: "Fixed" | "Variable" | "Premium"
}
