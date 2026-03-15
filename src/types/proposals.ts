//@ts-nocheck

export interface Proposal {
  policyID: number;
  policyNo: string | null;
  proposalNo: string;
  brCode: string;
  tDate: string | null;
  propDate: string | null;
  assDate: string | null;
  coverCode: string;
  covertype: string | null;
  title: string;
  assuredCode: string;
  surName: string;
  otherNames: string;
  fullName: string;
  address: string;
  state: string;
  landphone: string;
  mobilePhone: string;
  email: string;
  nationalID: string;
  occupation: string;
  sex: string;
  maritalStatus: string;
  country: string;
  agentcode: string;
  agentDescription: string;
  startDate: string; // ISO date string
  maturityDate: string; // ISO date string
  duration: number;
  dateofBirth: string; // ISO date string with time
  fop: string;
  age: number;
  mop: string | null;
  sumAssured: number;
  premium1: number;
  premium2: number;
  premium3: number;
  basicPremium: number;
  intrestRate: number | null;
  totalPremium: number;
  loading: number | null;
  suppsa: number | null;
  xMas: number | null;
  adbsa: number | null;
  toAllocate: number | null;
  transSTATUS: string | null;
  transGUID: string;
  remarks: string | null;
  tag: string | null;
  contactName: string;
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  contactJob: string;
  meansID: string;
  idNo: string;
  chronicIllness: string;
  isProposal: number;
  deleted: number;
  submittedBy: string;
  submittedOn: string; // ISO date string
  modifiedBy: string;
  modifiedOn: string; // ISO date string
  customerType: string;
  placeOfBirth?: string;
  spouseName?: string;
  localGovtOrigin?: string;
  religion?: string;
  designation?: string;
  residentialAddress?: string;
  landmark?: string;
  issueDate?: string;
  expiryDate?: string;
  ninNumber?: string;
  bvnNumber?: string;
  employmentType?: string;
  employerName?: string;
  employerAddress?: string;
  dateEmployed?: string;
  employerTelNo?: string;
  employerEmail?: string;
  height?: string;
  weight?: string;
  sportEngagement?: string;
  bodilyInfirmity?: string;
  medicalConditions?: string;
  currentTreatment?: string;
  workAbsence?: string;
  habits?: string;
  aviationEngagement?: string;
}

export interface Product {
  riskID: string;
  productID: string;
  productName: string;
  productType: string | null;
  description: string;
}

export interface Branch {
  branchID: string;
  regionID: string;
  stateID: string;
  branchID2: string;
  description: string;
  manager: string | null;
  address: string;
  mobilePhone: string;
  landPhone: string;
  email: string;
  fax: string | null;
  deleted: number;
  active: number;
  remarks: string | null;
  submittedBy: string;
  submittedOn: string; // ISO 8601 datetime
  modifiedBy: string | null;
  modifiedOn: string | null;
}

export interface Proposals {
  items: Proposal[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface ProposalState {
  proposals: Proposals;
  proposal: Proposal | null;
  products: Product[];
  branches: Branch[];

  loading: {
    getProposals: boolean;
    createProposal: boolean;
    createTradProposal: boolean;
    getProducts: boolean;
    getBranches: boolean;
    getProposal: boolean;
    editProposal: boolean;
  };
  error: {
    getProposals: unknown;
    createProposal: unknown;
    createTradProposal: unknown;
    getProducts: unknown;
    getBranches: unknown;
    getProposal: unknown;
    editProposal: unknown;
  };
  success: {
    createProposal: boolean;
    createTradProposal: boolean;
    editProposal: boolean;
  };
}

export interface ProposalFormData {
  brCode: string;
  title: string;
  assuredCode: string;
  surName: string;
  otherNames: string;
  fullName: string;
  address: string;
  state: string;
  landphone: string;
  mobilePhone: string;
  email: string;
  nationalID: string;
  occupation: string;
  gender: string;
  dateOfBirth: Date;
  duration: number;
  frequency: string;
  regularSaving: number | string;
  firstPremium: number | string;
  productCode: string;
  extraRate: number;
  loadingRate: number;
  maritalStatus: string;
  country: string;
  agentCode: string;
  agentDescription: string;
  contactName: string;
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  contactJob: string;
  meansID: string;
  idNo: string;
  chronicIllness: string;
  paymentMode: string;
  paymentType: string;
  depositAmount: number;
  paymentDate: Date | undefined;
  receiptNumber: string;
  bankName: string;
  bankBranch: string;
  accountNumber: string;
  beneficiaries?: BeneficiaryFormData[];
  spouseName: string;
  localGovtOrigin: string;
  religion: string;
  designation: string;
  residentialAddress: string;
  contactAddress: string;
  landmark: string;
  issueDate: Date | undefined;
  expiryDate: Date | undefined;
  ninNumber: string;
  bvnNumber: string;
  employmentType: string;
  employerName: string;
  employerAddress: string;
  dateEmployed: Date | undefined;
  employerTelNo: string;
  employerEmail: string;
  height: string;
  weight: string;
  sportEngagement: string;
  bodilyInfirmity: string;
  medicalConditions: string;
  currentTreatment: string;
  workAbsence: string;
  habits: string;
  aviationEngagement: string;
  coverCode: string;
}

export interface ProposalEditPayload {
  type: string;
  proposalNo: string;
  body: ProposalFormData;
}

export interface TradProposalFormData {
  title: string;
  assuredCode: string;
  surName: string;
  otherNames: string;
  fullName: string;
  address: string;
  state: string;
  landphone: string;
  mobilePhone: string;
  email: string;
  nationalID: string;
  occupation: string;
  gender: string;
  dateOfBirth: Date;
  duration: number;
  frequency: string;
  remark?: string;
  regularSaving: number;
  productCode: string;
  firstPremium: number;
  sumAssured: number;
  maritalStatus: string;
  country: string;
  agentCode: string;
  agentDescription: string;
  contactName: string;
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  contactJob: string;
  meansID: string;
  idNo: string;
  chronicIllness: string;
  riskID?: string;
  mop?: string;
  paymentType?: string;
  paymentAmount?: number | string;
  dateofpayment?: Date;
  receiptNo?: string;
  bankName?: string;
  accountNo?: string;
}

export type BeneficiaryFormData = {
  surname: string;
  otherNames: string;
  address: string;
  sex: string;
  dateOfBirth: Date | undefined;
  age: number;
  relationship: string;
  percentage: number;
  beneficiaryType: string;
  photo?: File | null;
};

export interface TradProposalEditPayload {
  proposalNo: string;
  body: TradProposalFormData;
}
