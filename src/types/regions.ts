export interface Region {
  regionID: string;
  region: string;
  manager: string;
  address: string;
  mobilePhone: string;
  landPhone: string;
  email: string;
  fax: string;
  remarks: string;
  deleted: boolean;
  active: boolean;
  submittedBy: string;
  submittedOn: string;
  modifiedBy: string | null;
  modifiedOn: string | null;
}

export interface UpdateRegionRequest {
  regionId: string;
  data: Region;
}

export interface RegionState {
  regions: Region[];
  region: Region | null;

  loading: {
    getAllRegions: boolean;
    getRegionDetails: boolean;
    createRegion: boolean;
    updateRegion: boolean;
    deleteRegion: boolean;
  };
  error: {
    getAllRegions: unknown;
    getRegionDetails: unknown;
    createRegion: unknown;
    updateRegion: unknown;
    deleteRegion: unknown;
  };
  success: {
    createRegion: boolean;
    updateRegion: boolean;
    deleteRegion: boolean;
  };
}
