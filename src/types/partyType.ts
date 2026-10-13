export interface PartyType {
  typeID: string
  code: string
  name: string
  groupID: string
  groupName: string
  tag: string
}

export interface CreatePartyTypeRequest {
  code: string
  name: string
  groupID: number
  groupName: string
  tag: string
}

export interface UpdatePartyTypeRequest {
  name: string
  groupID: number
  groupName: string
  tag: string
}

export interface PartyTypeState {
  partyTypes: PartyType[]
  partyType: PartyType | null
  loading: {
    getAllPartyTypes: boolean
    getPartyTypeDetails: boolean
    createPartyType: boolean
    updatePartyType: boolean
    deletePartyType: boolean
  }
  error: {
    getAllPartyTypes: string | null
    getPartyTypeDetails: string | null
    createPartyType: string | null
    updatePartyType: string | null
    deletePartyType: string | null
  }
  success: {
    createPartyType: boolean
    updatePartyType: boolean
    deletePartyType: boolean
  }
}
