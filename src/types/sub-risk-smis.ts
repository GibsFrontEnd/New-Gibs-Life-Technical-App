export type SubRiskSMI = {
  sid: number;
  smiCode: string;
  sectionCode: string;
  subRiskID: string;
  smiDetails: string;
  sectionName: string;
  subRiskName: string;
  field1: string;
  field2: string;
  rates: number | null;
  addSI: number | null;
  stockItem: number | null;
  multiplier: number | null;
  a1: number | null;
  a2: number | null;
  a3: number | null;
  a4: number | null;
  a5: number | null;
  active: number | null;
  submittedBy: string;
  submittedOn: string;
  modifiedBy: string;
  modifiedOn: string;
};

export interface SubRiskSMICreateUpdateRequest {
  smiCode: string;
  sectionCode: string;
  subRiskID: string;
  smiDetails: string;
  sectionName: string;
  subRiskName: string;
  field1: string;
  field2: string;
  rates: number;
  addSI: number;
  stockItem: number;
  multiplier: number;
  a1: number;
  a2: number;
  a3: number;
  a4: number;
  a5: number;
  active: number;
  submittedBy: string;
  modifiedBy?: string;
}
