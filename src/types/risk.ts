export interface Risk {
  riskID: string
  riskName: string
  description: string | null
}

export interface CreateRiskRequest {
  riskID: string
  riskName: string
  description: string
}

export interface UpdateRiskRequest {
  riskName: string
  description: string
}

export interface RiskState {
  risks: Risk[]
  loading: {
    getAllRisks: boolean
    getRiskById: boolean
    createRisk: boolean
    updateRisk: boolean
    deleteRisk: boolean
  }
  success: {
    createRisk: boolean
    updateRisk: boolean
    deleteRisk: boolean
  }
  error: {
    getAllRisks: string | null
    getRiskById: string | null
    createRisk: string | null
    updateRisk: string | null
    deleteRisk: string | null
  }
}
