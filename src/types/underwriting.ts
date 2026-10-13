//@ts-nocheck
//@ts-nocheck
// Underwriting System Types - Mirrored from Quotation types
export interface SelectOption {
  value: string
  label: string
}

export interface Occupation {
  occupation: string
  description: string | null
  tag: string | null
}

export interface MarketingStaff {
  id: string
  name: string
  email: string
}

export interface BusinessChannel {
  channelID: string
  channels: string
  description: string | null
}

export interface SubChannel {
  mktGroupID: string
  branchID: string
  groupName: string
  description: string | null
  groupHead: string | null
  active: number
}

// Replaces 'Proposal'
export interface Policy {
  proposalNo: string // Acts as policyNo/ID in this response
  transDate: string
  coPolicyNo: string | null
  companyID: string | null
  branchID: string
  branch: string
  bizSource: string
  sourceType?: string | null // Business source type (Direct, Broker, Agent, etc.)
  businessType?: string // Add businessType
  subRiskID: string
  subRisk: string
  riskID: string
  partyID: string
  party: string | null
  mktStaffID: string
  mktStaff: string
  insuredID: string | null
  insSurname: string
  insFirstname: string
  insOthernames: string | null
  insAddress: string | null
  insStateID: string | null
  insMobilePhone: string | null
  insLandPhone: string | null
  insEmail: string | null
  insFaxNo: string | null
  insOccupation: string | null
  isProposal: number
  startDate: string
  endDate: string
  exRate: number
  exCurrency: string
  premiumRate: number
  proportionRate: number
  sumInsured: number
  grossPremium: number
  sumInsuredFrgn: number
  grossPremiumFrgn: number
  proRataDays: number
  proRataPremium: number
  remarks: string | null
  deleted: number
  active: number
  undEmail1: string | null
  undEmail2: string | null
  transSTATUS: string | null
  submittedBy: string | null
  submittedOn: string | null
  modifiedBy: string | null
  modifiedOn: string | null
  leaderID: string | null
  leader: string | null
  commissionRate: number | null

  // Optional aliases for frontend compatibility if needed, but not in API response
  policyNo?: string
}

export interface CreatePolicyRequest {
  subriskID: string
  branchID: string
  partyID: string
  mktStaffID: string
  insuredID: string
  surname: string
  firstName: string
  otherNames: string
  isOrg: boolean
  startDate: string
  endDate: string
  insAddress: string
  insMobilePhone: string
  insEmail: string
  insOccupation: string
  bizSource: string
  businessType: string
  accountType: string
  busChannel: string
  subChannel: string
  proportionRate: number
  currency: string
  exRate: number

  // Optional/Legacy fields (kept for safety or strict null checks elsewhere)
  product?: string
  productID?: string
  riskLocation?: string
  riskClassification?: string

  remarks?: string
  entryDate?: string
  effectiveDate?: string
  expiryDate?: string
  proportionShare?: number
  ourShare?: number
}

export interface UpdatePolicyRequest {
  insuredName?: string
  surname?: string
  firstName?: string
  insAddress: string
  insMobilePhone: string
  insEmail: string
  insOccupation: string
  bizSource: string
  proportionRate?: number
  proportionShare?: number
  ourShare?: number
  remarks: string
  modifiedBy: string
  riskLocation?: string
  riskClassification?: string
  businessType?: string
  accountType?: string
  policyExcess?: number
  otherNames?: string
}

// Mirrored from 'StockItem'
export interface PolicyStockItem {
  stockCode: string
  stockDescription: string
  stockSumInsured: number
  stockRate: number
  stockDiscountRate: number
  stockGrossPremium?: number
  stockDiscountAmount?: number
  stockNetPremium?: number
}

export interface ItemAdjustment {
  adjustmentName: string
  rate: number
  appliedOn: "SumInsured" | "Premium"
  sequenceOrder: number
  adjustmentType?: "DISCOUNT" | "LOADING"
  amount?: number
}

export interface SectionDynamicAdjustment {
  adjustmentName: string
  adjustmentType: "DISCOUNT" | "LOADING"
  rate: number
  appliedOn: "SumInsured" | "Premium"
  sequenceOrder: number
}

export interface FireDeclarationRecomputeResponseDto {
  sections: Array<{
    sectionID: string
    sectionName?: string
    sectionSumInsured: number
    sectionPremium: number
  }>
  totalSumInsured: number
  totalPremium: number
  netPremiumDue: number
  proRataPremium: number
  success: boolean
  message?: string
}

export interface FirePreviewCompleteResponseDto {
  sectionCalculations: CalculatedSection[]
  totalSumInsured: number
  totalPremium: number
  netPremium: number
  proRataPremium: number
  success: boolean
}

// Mirrored from 'RiskItem'
export interface PolicyRiskItem {
  itemNo: number
  sectionID: string
  smiCode: string
  smiDetail?: string
  itemDescription: string
  actualValue: number // sumInsured
  sumInsured?: number
  itemRate: number
  multiplyRate: number // multiplier
  multiplier?: number
  location: string
  stockItem?: PolicyStockItem
  feaDiscountRate: number
  discounts?: ItemAdjustment[]
  loadings?: ItemAdjustment[]

  // UI/Calculation feedback fields
  actualPremium?: number
  premium?: number
  shareValue?: number
  premiumValue?: number
  stockSumInsured?: number
  stockGrossPremium?: number
  stockDiscountAmount?: number
  stockNetPremium?: number
  totalSumInsured?: number
  totalGrossPremium?: number
  feaDiscountAmount?: number
  netPremiumAfterDiscounts?: number
  actualPremiumFormula?: string
  shareValueFormula?: string
  premiumValueFormula?: string
  appliedLoadings?: Array<{
    adjustmentName: string
    adjustmentType: string
    rate: number
    amount: number
  }>
  totalItemLoadingAmount?: number
  hasStockItem?: boolean
}

export interface PolicyMotorCalculationRequest {
  proposalNo: string  // Changed from policyNo to proposalNo to match API
  vehicles: PolicyMotorVehicle[]
  otherDiscountRate: number
  otherLoadingRate: number
  proportionRate: number
  exchangeRate: number
  currency: string
  coverDays: number
  calculatedBy: string
  remarks?: string  // Added remarks as optional
  detailID?: string  // Added detailID for updates
}

export interface CalculatedPolicyAggregate {
  aggregateSumInsured: number
  aggregatePremium: number
  success: boolean
  message: string
}

export interface PolicySectionAdjustments extends Omit<PolicyAdjustments, 'otherLoadingsRate'> {
  aggregatePremium: number
}

export interface CalculatedPolicyRiskItem extends PolicyRiskItem {
  actualPremium: number
  shareValue: number
  premiumValue: number
  stockSumInsured: number
  stockGrossPremium: number
  stockDiscountAmount: number
  stockNetPremium: number
  totalSumInsured: number
  totalGrossPremium: number
  feaDiscountAmount: number
  netPremiumAfterDiscounts: number
  actualPremiumFormula: string
  shareValueFormula: string
  premiumValueFormula: string
}

export type PolicyRiskItemUI = PolicyRiskItem &
  Partial<
    Pick<
      CalculatedPolicyRiskItem,
      | "actualPremium"
      | "shareValue"
      | "premiumValue"
      | "stockSumInsured"
      | "stockGrossPremium"
      | "stockDiscountAmount"
      | "stockNetPremium"
      | "totalSumInsured"
      | "totalGrossPremium"
      | "feaDiscountAmount"
      | "netPremiumAfterDiscounts"
      | "actualPremiumFormula"
      | "shareValueFormula"
      | "premiumValueFormula"
    >
  > & {
    _showStock?: boolean
    _collapsed?: boolean
    uiId?: string
  }

// Mirrored from 'QuoteSection'
export interface PolicySection {
  sectionID: string
  sectionName: string
  location: string
  sectionSumInsured: number
  sectionPremium: number
  sectionGrossPremium?: number
  sectionNetPremium: number
  riskItems: PolicyRiskItemUI[]

  // existing policy fields
  policyNo?: string
  entryDate?: string
  startDate?: string
  expiryDate?: string
  coverDays?: number
  lastCalculated?: string
  proportionRate?: number

  // Adjustments
  sectionAdjustments?: SectionAdjustments
  specialDiscountRate?: number
  deductibleDiscountRate?: number
  spreadDiscountRate?: number
  ltaDiscountRate?: number
  otherDiscountsRate?: number
  theftLoadingRate?: number
  srccLoadingRate?: number
  otherLoading2Rate?: number
  otherLoadingsRate?: number
  [key: string]: any
}

export interface PolicyAggregateTotals {
  sectionSummaries: [
    {
      sectionID: string
      sectionName: string
      sectionSumInsured: number
      sectionAggregatePremium: number
      riskItemCount: number
    }
  ]
  totalSumInsured: number
  totalAggregatePremium: number
  sectionCount: number
  success: boolean
  message: string
}

export interface CalculatedSection {
  sectionID: string
  sectionName: string
  calculatedItems: CalculatedPolicyRiskItem[]
  sectionSumInsured: number
  sectionGrossPremium: number
  sectionNetPremium: number
  sectionAdjustments?: SectionAdjustments
}

export interface SectionAdjustments {
  startingPremium: number
  discountsApplied: any[]
  loadingsApplied: any[]
  finalNetPremium: number
  totalDiscountAmount: number
  totalLoadingAmount: number
  netAdjustmentAmount: number
  totalDiscounts?: number
  totalLoadings?: number
  netAdjustment?: number
}

// Mirrored from 'ProposalAdjustments'
export interface PolicyAdjustments {
  startingPremium?: number
  specialDiscountRate?: number
  deductibleDiscountRate?: number
  spreadDiscountRate?: number
  ltaDiscountRate?: number
  otherDiscountsRate: number
  theftLoadingRate?: number
  srccLoadingRate?: number
  otherLoading2Rate?: number
  otherLoadingsRate: number
  netPremiumDue?: number
  otherDiscountsAmount?: number
  otherLoadingsAmount?: number
  totalDiscounts?: number
  totalLoadings?: number
  netPremium?: number
}

// Mirrored from 'AdjustmentCalculations'
export interface PolicyAdjustmentCalculations {
  startingPremium: number
  specialDiscountAmount: number
  specialDiscountNetAmount: number
  deductibleDiscountAmount: number
  deductibleDiscountNetAmount: number
  spreadDiscountAmount: number
  spreadDiscountNetAmount: number
  ltaDiscountAmount: number
  ltaDiscountNetAmount: number
  theftLoadingAmount: number
  theftLoadingNetAmount: number
  srccLoadingAmount: number
  srccLoadingNetAmount: number
  otherLoading2Amount: number
  otherLoading2NetAmount: number
  netPremiumDue: number
  success: boolean
  message: string | null
}

export interface ProRataCalculations {
  netPremiumDue: number
  proRataPremium: number
  premiumDue: number
  coverDays: number
  isProRated: boolean
  success: boolean
  message: string | null
}

// Mirrored from 'CompleteCalculationRequest'
export interface CompletePolicyCalculationRequest {
  proposalNo?: string // To keep compatibility if needed, else use policyNo
  policyNo: string
  sections: PolicySection[]
  proportionRate: number
  exchangeRate: number
  currency: string
  coverDays: number
  specialDiscountRate: number
  deductibleDiscountRate: number
  spreadDiscountRate: number
  ltaDiscountRate: number
  otherDiscountsRate: number
  theftLoadingRate: number
  srccLoadingRate: number
  otherLoading2Rate: number
  otherLoadingsRate: number
  calculatedBy: string
  remarks: string
}

// Mirrored from 'CompleteCalculationResponse'
export interface CompletePolicyCalculationResponse {
  specialDiscountRate: number
  deductibleDiscountRate: number
  spreadDiscountRate: number
  ltaDiscountRate: number
  otherDiscountsRate: number
  theftLoadingRate: number
  srccLoadingRate: number
  otherLoading2Rate: number
  otherLoadingsRate: number
  remarks: any
  proposalNo?: string
  policyNo: string
  subrisk: string | null
  policyDetailId?: string | null
  sectionCalculations: CalculatedSection[]
  totalSumInsured: number
  totalPremium: number
  netPremium: number
  proRataPremium: number
  shareSumInsured: number
  sharePremium: number
  foreignSumInsured: number
  foreignPremium: number
  adjustmentCalculations: PolicyAdjustmentCalculations
  proRataCalculations: ProRataCalculations
  success: boolean
  message: string | null
  validationErrors: string[]
  calculatedOn: string
}

export interface RenewalCalculationRequest {
  proposalNo?: string // Query param or body depending on backend, user requested this in body
  newPolicyNo?: string
  originalPolicyNo?: string
  sections: PolicySection[]
  proportionRate: number
  exchangeRate: number
  currency: string
  coverDays: number
  otherDiscountsRate: number
  otherLoadingsRate: number
  calculatedBy: string
  remarks?: string
}

export interface RenewalCalculationResponse extends CompletePolicyCalculationResponse {
  // Inherits from CompletePolicyCalculationResponse but ensuring key fields match user's json if different
  // The user's JSON matches CompletePolicyCalculationResponse structure almost exactly
  // (sectionCalculations, totalSumInsured, etc.)
  // It has 'proposalLevelAdjustments' which maps to 'adjustmentCalculations' in our types but user's json key is 'proposalLevelAdjustments'
  // I will add the specific alias if needed, or mapping logic in slice.
  proposalLevelAdjustments?: PolicyAdjustmentCalculations
}

// Mirrored from 'CalculationBreakdown'
export interface PolicyCalculationBreakdown {
  proposalNo?: string
  policyNo: string
  calculatedOn: string
  calculatedBy: string
  calculationType: string
  remarks: string
  inputs: any
  calculationSteps: any
  finalResults: {
    totalSumInsured: number
    totalPremium: number
    netPremium: number
    proRataPremium: number
    shareSumInsured: number
    sharePremium: number
    foreignSumInsured: number
    foreignPremium: number
    foreignCurrency: string
    overallPremiumRate: number
    effectiveDiscountRate: number
    effectiveLoadingRate: number
    grossPremiumRate: number
    netPremiumRate: number
    proportionShare: number
    netPremiumAfterProposalAdjustments?: number
    totalNetPremium?: number
  }
}

export interface PolicyPaginationResponse {
  items: Policy[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface PolicySectionsSummary {
  policyNo: string
  sections: Array<{
    sectionID: string
    sectionName: string
    sectionSumInsured: number
    sectionPremium: number
    netPremium: number
    lastCalculated: string
    riskItems?: PolicyRiskItemUI[]
    location?: string
  }>
}

// Response for risk items calc
export interface CalculatePolicyRiskItemsResponse {
  subrisk: string
  calculatedItems: CalculatedPolicyRiskItem[]
  totalActualValue?: number
  totalActualPremium?: number
  totalShareValue?: number
  totalSharePremium?: number
  totalNetPremiumAfterDiscounts?: number
  success: boolean
  message?: string | null
}

// Response from /api/PolicyAdmin/{originalPolicyNo}/renewal/available-calculations
export interface AvailableCalculation {
  detailID: string
  certOrDocNo: string
  calculatedOn: string
  calculatedBy: string
  calculationType: string
  totalSumInsured: number
  totalPremium: number
  sectionCount: number
  status: string
  isRecommended: boolean
}



export interface UnderwritingState {
  policies: Policy[]
  currentPolicy: Policy | null
  currentCalculation: CompletePolicyCalculationResponse | null
  calculationBreakdown: PolicyCalculationBreakdown | null
  sectionsSummary: PolicySectionsSummary | null
  sections: PolicySection[]
  selectedRiskFilter: string | null

  debitNotes: any[]
  currentDebitNote: any | null
  currentDebitNoteMapping: any | null
  calculationHistory: any[]

  marketingStaffs: MarketingStaff[]
  products: SelectOption[]
  branches: SelectOption[]

  // Fire State
  // sections: PolicySection[] // Already defined above

  // Motor State
  motorVehicles: PolicyMotorVehicleUI[]
  currentMotorCalculation: PolicyMotorCalculationResponse | null
  motorCalculationBreakdown: PolicyMotorCalculationBreakdown | null

  loading: {
    fetchPolicies: boolean
    fetchPolicy: boolean
    createPolicy: boolean
    updatePolicy: boolean
    deletePolicy: boolean
    calculateRiskItems: boolean
    calculateSectionAggregate: boolean
    calculateSectionAdjustment: boolean
    calculateGeneric: boolean // General calculation loading
    fetchReport: boolean

    // Motor Loading
    calculateMotor: boolean
    fetchMotorCalculation: boolean
  }
  success: {
    createPolicy: boolean
    updatePolicy: boolean
    deletePolicy: boolean
    calculateRiskItems: boolean
    calculateGeneric: boolean
    fetchReport: boolean

    // Motor Success
    calculateMotor: boolean
  }
  error: {
    fetchPolicies: string | null
    fetchPolicy: string | null
    createPolicy: string | null
    updatePolicy: string | null
    deletePolicy: string | null
    calculateRiskItems: string | null
    calculateSectionAggregate: string | null
    calculateSectionAdjustment: string | null
    calculateGeneric: string | null
    fetchReport: string | null

    // Motor Errors
    calculateMotor: string | null
    fetchMotorCalculation: string | null
  }
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
  searchTerm: string
  subChannels: SelectOption[]
  activeTab: string


  // Helper Data
  agents: SelectOption[]
  businessSource: SelectOption[]
  businessType: SelectOption[]
  accountType: SelectOption[]
  busChannels: SelectOption[]
  currency: SelectOption[]
  occupations: SelectOption[]
  riskClassifications: SelectOption[]
  sectionsList: SelectOption[]
  riskSMI: SelectOption[]
  endorsementTypes: string[]


  // Dynamic Options
  adjustmentOptions: {
    standardDiscounts: string[]
    standardLoadings: string[]
    proposalLevelAdjustments: string[]
  } | null
  motorAdjustmentOptions: {
    standardDiscounts: string[]
    standardLoadings: string[]
    proposalLevelAdjustments: string[] | null
    coverTypes: string[]
    usageTypes: string[]
  } | null
}

// Legacy type alias if needed
export type PolicyCalculation = CompletePolicyCalculationResponse

// Motor Underwriting Types
export interface PolicyMotorAdjustment {
  adjustmentName: string
  adjustmentType: string
  rate: number
  appliedOn: "SumInsured" | "Premium"
  baseAmount: number
  amount: number
  sequenceOrder: number
  formula: string
}

export interface PolicyMotorVehicle {
  itemNo: number
  vehicleRegNo: string
  vehicleUser: string
  vehicleType: string
  vehicleMake: string
  vehicleModel: string
  chassisNo: string
  engineNo: string
  color: string
  modelYear: number
  coverType: string
  usage: string
  vehicleValue: number
  premiumRate: number
  state: string
  seatCapacity: number
  waxCode: string
  location: string
  startDate: string
  endDate: string
  trackingCost: number
  rescueCost: number
  discounts: PolicyMotorAdjustment[]
  loadings: PolicyMotorAdjustment[]
}

export interface CalculatedPolicyMotorVehicle extends PolicyMotorVehicle {
  itemNo: number,
  vehicleRegNo: string,
  certificateNo: string,
  vehicleType: string,
  coverType: string,
  vehicleValue: number,
  premiumRate: number,
  step1_BasicPremium?: {
    stepName: string
    startingAmount: number
    adjustments: {
      name: string,
      type: string,
      rate: number,
      amount: number,
      sequenceOrder: number,
      formula: string
    }[]
    totalAdjustment: number,
    resultingAmount: number
    formula: string
  }
  step2_AfterDiscounts?: {
    stepName: string
    startingAmount: number
    adjustments: {
      name: string,
      type: string,
      rate: number,
      amount: number,
      sequenceOrder: number,
      formula: string
    }[]
    totalAdjustment: number,
    resultingAmount: number
    formula: string
  }
  step3_AfterLoadings?: {
    stepName: string
    startingAmount: number
    adjustments: {
      name: string,
      type: string,
      rate: number,
      amount: number,
      sequenceOrder: number,
      formula: string
    }[]
    totalAdjustment: number,
    resultingAmount: number
    formula: string
  }
  step4_FinalPremium?: {
    stepName: string
    startingAmount: number
    adjustments: {
      name: string,
      type: string,
      rate: number,
      amount: number,
      sequenceOrder: number,
      formula: string
    }[]
    totalAdjustment: number,
    resultingAmount: number
    formula: string
  }
  shareValue: number,
  sharePremium: number
}

export interface PolicyMotorVehicleUI extends PolicyMotorVehicle {
  _collapsed?: boolean
  _showDetails?: boolean
  uiId?: string
}

export interface PolicyMotorCalculationRequest {
  policyNo: string
  vehicles: PolicyMotorVehicle[]
  otherDiscountRate: number
  otherLoadingRate: number
  proportionRate: number
  exchangeRate: number
  currency: string
  coverDays: number
  calculatedBy: string
}

export interface PolicyMotorCalculationResponse {
  policyNo: string
  vehicleCalculations: CalculatedPolicyMotorVehicle[] 
  totalVehicleValue: number
  totalNetPremium: number
  vehicleCount: number
  otherDiscountRate: number
  otherLoadingRate: number
  otherDiscountAmount: number
  otherLoadingAmount: number
  netPremiumDue: number
  proRataPremium: number
  shareSumInsured: number
  sharePremium: number
  foreignSumInsured: number
  foreignPremium: number
  finalPremiumDue: number
  success: boolean
  message: string
}

export interface PolicyMotorCalculationBreakdown {
  policyNo: string
  calculatedOn: string
  calculatedBy: string
  inputs: {
    proportionRate: number
    exchangeRate: number
    currency: string
    coverDays: number
    vehicleCount: number
    otherDiscountRate: number
    otherLoadingRate: number
  }
  vehicleAggregation: {
    totalVehicles: number,
    totalVehicleValue: number,
    totalNetPremium: number,
    vehicleSummaries: [
      {
        itemNo: number,
        vehicleRegNo: string,
        vehicleValue: number,
        netPremium: number
      }
    ]
  }
  vehicleCalculations: CalculatedPolicyMotorVehicle[]
  proposalAdjustments: {
    aggregatePremium: number
    otherDiscountRate: number
    otherDiscountAmount: number
    premiumAfterDiscount: number
    otherLoadingRate: number
    otherLoadingAmount: number
    netPremiumDue: number
  }
  finalResults: {
    totalVehicleValue: number,
    totalNetPremium: number,
    netPremiumAfterProposalAdjustments: number,
    proRataPremium: number,
    shareSumInsured: number,
    sharePremium: number,
    foreignSumInsured: number,
    foreignPremium: number,
    foreignCurrency: string,
    finalPremiumDue: number
  }
  success: boolean
  message: string
}

// ===== Fire/Motor endorsement engine (POST /endorsement/fire, /endorsement/motor) =====
export interface EndorsementType {
  code: string
  label: string
  description: string
  needs: string
  aliases: string[]
}

export interface EndorsementTypesResponse {
  success: boolean
  unit: string
  data: EndorsementType[]
}

/** A section (fire) or vehicle (motor) of a calculation that an endorsement can tick. */
export interface EndorsableItem {
  selectionToken: string
  isExpired: boolean
  [key: string]: any
}

export interface EndorsementRecord {
  detailID?: string
  policyNo?: string
  endorsementType?: string
  status?: string
  [key: string]: any
}
