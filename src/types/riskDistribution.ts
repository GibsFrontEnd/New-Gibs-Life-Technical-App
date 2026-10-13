// types/riskDistribution.ts
//@ts-nocheck
export interface RiskDistribution {
    distributionID: number;
    subRiskID: string;
    underYr: string;
    cessionRate: number;
    retention: number;
    surplus1: number;
    surplus2: number;
    lineNos: number;
    tag: string;
    submitBy: string;
    submitOn: string | null;
    modifiedBy: string | null;
    modifiedOn: string | null;
  }
  
  export interface CreateRiskDistributionDto {
    SubRiskID?: string;        // Capital S
    UnderYr?: string;          // Capital U
    CessionRate?: number;      // Capital C
    Retention?: number;        // Capital R
    Surplus1?: number;         // Capital S
    Surplus2?: number;         // Capital S
    LineNos?: number;          // Capital L
    Tag?: string;              // Capital T
    SubmitBy?: string;         // Capital S
    SubmitOn?: string;         // Capital S
    ModifiedBy?: string | null; // Capital M - Important!
    ModifiedOn?: string | null; // Capital M - Important!
  }
  
  export interface UpdateRiskDistributionDto extends Partial<CreateRiskDistributionDto> {
    distributionID: number;
  }
  
  // Query params types
  export interface GetBySubRiskAndYearParams {
    subRiskId: string;
    underYr: string;
  }
  
  // API Response type
  export interface ApiResponse<T> {
    data: T;
    status: number;
    message?: string;
  }