// types/beneficiaries.ts
export interface BeneficiaryFormData {
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
  policyNo?: string;
  proposalNo?: string;
  remark?: string;
  tag?: string;
}

export interface Beneficiary {
  transID: number;
  proposalNo: string;
  surname: string;
  otherNames: string;
  age: string;
  sex: string;
  dob: string;
  relation: string;
  percentage: number;
  type: string;
  transFlag: string;
  photoBase64: string;
  hasPhoto: boolean;
  policyNo: string;
  address: string;
  remark: string;
  tag: string;
  deleted: number;
  active: number;
  submittedBy: string;
  submittedOn: string;
  modifiedBy: string;
  modifiedOn: string;
}