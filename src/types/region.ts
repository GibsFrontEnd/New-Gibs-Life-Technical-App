// types/region.ts

export interface Region {
  regionID: string
  region: string
  manager: string
  address: string
  mobilePhone: string
  landPhone: string
  email: string
  fax: string
  remarks: string
  deleted: boolean
  active: boolean
  submittedBy: string
  submittedOn: string
  modifiedBy: string
  modifiedOn: string
}

export interface CreateRegionRequest {
  regionID: any
  region: string
  manager: string
  address: string
  mobilePhone: string
  landPhone: string
  email: string
  fax: string
  remarks: string
  deleted: boolean
  active: boolean
  submittedBy: string
}

export interface UpdateRegionRequest {
  regionID: string
  region: string
  manager: string
  address: string
  mobilePhone: string
  landPhone: string
  email: string
  fax: string
  remarks: string
  deleted: boolean
  active: boolean
  submittedBy: string
  modifiedBy: string
}

export interface RegionState {
  regions: Region[]
  loading: {
    getAllRegions: boolean
    getActiveRegions: boolean
    getRegionsByRegion: boolean
    getRegionsByEmail: boolean
    createRegion: boolean
    updateRegion: boolean
    deleteRegion: boolean
    checkRegionExists: boolean
  }
  success: {
    getAllRegions: boolean
    getActiveRegions: boolean
    getRegionsByRegion: boolean
    getRegionsByEmail: boolean
    createRegion: boolean
    updateRegion: boolean
    deleteRegion: boolean
    checkRegionExists: boolean
  }
  error: {
    getAllRegions: string | null
    getActiveRegions: string | null
    getRegionsByRegion: string | null
    getRegionsByEmail: string | null
    createRegion: string | null
    updateRegion: string | null
    deleteRegion: string | null
    checkRegionExists: string | null
  }
  exists: boolean | null
}