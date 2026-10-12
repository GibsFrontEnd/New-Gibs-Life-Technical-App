// types/treatyExcessLoss.ts
export interface TreatyExcessLossDto {
    id: number;
    subriskID: string;
    partyID: string;
    underYr: number;
    cover: number;
    deductible: number;
    mdPremium: number;
    _2ndCover: number;
    _2ndDeductible: number;
    _2ndMDPremium: number;
    reinstateNo: number;
    reinstatePercent: number;
    adjustRate1: number;
    adjustRate2: number;
    adjust2ndRate1: number;
    adjust2ndRate2: number;
    loadingFactor: number;
    a1: number;
    a2: number;
    tag: string;
    submitBy: string;
    submitOn: string;
    modifiedBy: string;
    modifiedOn: string;
  }
  
  export interface CreateTreatyExcessLossDto {
    subriskID: string;
    partyID: string;
    underYr: number;
    cover: number;
    deductible: number;
    mdPremium: number;
    _2ndCover: number;
    _2ndDeductible: number;
    _2ndMDPremium: number;
    reinstateNo: number;
    reinstatePercent: number;
    adjustRate1: number;
    adjustRate2: number;
    adjust2ndRate1: number;
    adjust2ndRate2: number;
    loadingFactor: number;
    a1: number;
    a2: number;
    tag: string;
  }
  
  export interface UpdateTreatyExcessLossDto extends TreatyExcessLossDto {}
  
  export interface TreatyExcessLossState {
    records: TreatyExcessLossDto[];
    selectedRecord: TreatyExcessLossDto | null;
    loading: boolean;
    error: string | null;
  }