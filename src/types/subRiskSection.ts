export interface SubRiskSection {
  sectionID: number
  sectionCode: string
  subRiskID: string
  sectionName: string
  subRiskName: string
  field1: string
  field2?: string | null
  rates?: number | null
  a1?: number | null
  a2?: number | null
  a3?: number | null
  a4?: number | null
  a5?: number | null
  active: number
  submittedBy: string
  submittedOn: string
  modifiedBy?: string | null
  modifiedOn?: string | null
}

export interface CreateSubRiskSectionRequest {
  sectionCode: string
  subRiskID: string
  sectionName: string
  subRiskName: string
  field1: string
  field2: string
  rates: number
  a1: number
  a2: number
  a3: number
  a4: number
  a5: number
  submittedBy: string
}

export interface UpdateSubRiskSectionRequest {
  sectionCode: string
  subRiskID: string
  sectionName: string
  subRiskName: string
  field1: string
  field2: string
  rates: number
  a1: number
  a2: number
  a3: number
  a4: number
  a5: number
  active: number
  modifiedBy: string
}

export interface SubRiskSectionState {
  subRiskSections: SubRiskSection[]
  exists: boolean | null
  loading: {
    getAllSubRiskSections: boolean
    getSubRiskSectionById: boolean
    getSubRiskSectionsBySectionCode: boolean
    getSubRiskSectionsBySubRisk: boolean
    getActiveSubRiskSections: boolean
    checkSubRiskSectionExists: boolean
    createSubRiskSection: boolean
    updateSubRiskSection: boolean
    deleteSubRiskSection: boolean
  }
  success: {
    getAllSubRiskSections: boolean
    getSubRiskSectionById: boolean
    getSubRiskSectionsBySectionCode: boolean
    getSubRiskSectionsBySubRisk: boolean
    getActiveSubRiskSections: boolean
    checkSubRiskSectionExists: boolean
    createSubRiskSection: boolean
    updateSubRiskSection: boolean
    deleteSubRiskSection: boolean
  }
  error: {
    getAllSubRiskSections: string | null
    getSubRiskSectionById: string | null
    getSubRiskSectionsBySectionCode: string | null
    getSubRiskSectionsBySubRisk: string | null
    getActiveSubRiskSections: string | null
    checkSubRiskSectionExists: string | null
    createSubRiskSection: string | null
    updateSubRiskSection: string | null
    deleteSubRiskSection: string | null
  }
}
