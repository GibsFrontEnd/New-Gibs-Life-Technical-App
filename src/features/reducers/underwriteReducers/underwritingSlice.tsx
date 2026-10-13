//@ts-nocheck
//@ts-nocheck
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import apiCall from "../../../utils/api-call"
import axios from 'axios'
import type {
  UnderwritingState,
  Policy,
  CreatePolicyRequest,
  UpdatePolicyRequest,
  PolicyPaginationResponse,
  PolicySection,
  CalculatePolicyRiskItemsResponse,
  PolicyAggregateTotals,
  PolicyAdjustments,
  PolicyAdjustmentCalculations,
  ProRataCalculations,
  CompletePolicyCalculationResponse,
  CompletePolicyCalculationRequest,
  PolicyCalculationBreakdown,
  PolicyRiskItemUI,
  PolicySectionsSummary,
  AvailableCalculation,
  RenewalCalculationRequest,
  PolicyMotorCalculationResponse,
  PolicyMotorCalculationRequest,
  PolicyMotorCalculationBreakdown,
  PolicyMotorVehicleUI,
  PolicyCalculationSummary,
  FireDeclarationRecomputeResponseDto,
  FirePreviewCompleteResponseDto,
  SectionDynamicAdjustment,
  ItemAdjustment,
  EndorsementTypesResponse,
  EndorsableItem,
  EndorsementRecord,
} from "../../../types/underwriting"
import { decryptData } from "../../../utils/encrypt-utils"
import { SERVER_URL, ROOT_URL } from "../../../utils/constants"

const API_BASE_URL = SERVER_URL
// EndorsementController is mounted at /endorsement (no /api prefix), so it hangs off the site root
const ENDORSEMENT_BASE_URL = String(ROOT_URL || SERVER_URL.replace(/\/api\/?$/, "")).replace(/\/+$/, "")

const getAuthToken = () => {
  try {
    const encryptedToken = localStorage.getItem("token")
    if (!encryptedToken) return null
    return decryptData(encryptedToken)
  } catch (err) {
    console.warn("Failed to get token", err)
    return null
  }
}

const handleFetchError = async (res: Response) => {
  const text = await res.text().catch(() => "")
  throw new Error(text || `HTTP error! status: ${res.status}`)
}

const loggedFetch = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, options)
  return response
}

// Some PolicyAdmin lookup endpoints (bizSource, biztype, accttype) return each
// entry as a stringified object, e.g. "{ Text = DIRECT, Value = DIRECT }",
// instead of real JSON objects. Parse both shapes into a clean {value, label}.
const parseLookupItem = (item: any): { value: string; label: string } => {
  if (item && typeof item === "object" && !Array.isArray(item)) {
    const value = item.value ?? item.Value ?? item.code ?? ""
    const label = item.text ?? item.Text ?? item.label ?? item.description ?? String(value)
    return { value: String(value), label: String(label) }
  }

  if (typeof item === "string") {
    const match = item.match(/Text\s*=\s*(.*?),\s*Value\s*=\s*(.*?)\s*\}/i)
    if (match) {
      return { label: match[1].trim(), value: match[2].trim() }
    }
    return { value: item, label: item }
  }

  return { value: "", label: "" }
}

// ============================================================================
// ASYNC THUNKS
// ============================================================================

// Helper Endpoints
export const getBizShareType = createAsyncThunk<any[], void, { rejectValue: string }>(
  "underwriting/getBizShareType",
  async (_, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/accttype`, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch business share types")
    }
  }
)

export const getPolBizType = createAsyncThunk<any[], void, { rejectValue: string }>(
  "underwriting/getPolBizType",
  async (_, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/biztype`, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch policy business types")
    }
  }
)

export const getBizSources = createAsyncThunk<any[], void, { rejectValue: string }>(
  "underwriting/getBizSources",
  async (_, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/bizSource`, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch business sources")
    }
  }
)

export const getEndorsementTypes = createAsyncThunk<string[], void, { rejectValue: string }>(
  "underwriting/getEndorsementTypes",
  async (_, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/endorsement/types`, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch endorsement types")
    }
  }
)

export const getAdjustmentOptions = createAsyncThunk<any[], void, { rejectValue: string }>(
  "underwriting/getAdjustmentOptions",
  async (_, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/adjustment-options`, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch adjustment options")
    }
  }
)

export const getMotorAdjustmentTypes = createAsyncThunk<any[], void, { rejectValue: string }>(
  "underwriting/getMotorAdjustmentTypes",
  async (_, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/motor/adjustment-types`, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch motor adjustment types")
    }
  }
)

// Vehicle types / usages / cover types as held in TPD_Premium (third-party flat premiums)
export const getMotorVehicleOptions = createAsyncThunk<
  { vehicleTypes: string[]; usageTypes: string[]; coverTypes: string[] },
  void,
  { rejectValue: string }
>("underwriting/getMotorVehicleOptions", async (_, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/motor/vehicle-options`, {
      method: "GET",
      headers: { accept: "application/json", Authorization: `Bearer ${AUTH_TOKEN}` },
    })
    if (!response.ok) await handleFetchError(response)
    return await response.json()
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch motor vehicle options")
  }
})

export const getCoinsuranceDistribution = createAsyncThunk<any[], string, { rejectValue: string }>(
  "underwriting/getCoinsuranceDistribution",
  async (policyNo, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/DebitNotes/coinsurance/${encodeURIComponent(policyNo)}`, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch coinsurance distribution")
    }
  }
)

export const getOccupations = createAsyncThunk<any[], void, { rejectValue: string }>(
  "underwriting/getOccupations",
  async (_, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/occupations`, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch occupations")
    }
  }
)

export const getBusinessChannels = createAsyncThunk<any[], void, { rejectValue: string }>(
  "underwriting/getBusinessChannels",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiCall.get(`${API_BASE_URL}/PolicyAdmin/Buschannels`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch business channels")
    }
  }
)

export const getSubChannels = createAsyncThunk<any[], string | undefined, { rejectValue: string }>(
  "underwriting/getSubChannels",
  async (branchId, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const url = branchId
        ? `${API_BASE_URL}/PolicyAdmin/Subchannel?branchId=${branchId}`
        : `${API_BASE_URL}/PolicyAdmin/Subchannel`

      const response = await fetch(url, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch sub channels")
    }
  }
)

export const getSubriskFields = createAsyncThunk<any[], string, { rejectValue: string }>(
  "underwriting/getSubriskFields",
  async (riskID, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/subriskfieldsv2/${riskID}`, {
        method: "GET",
        headers: { accept: "*/*", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch sub-risk fields")
    }
  }
)

export const fetchPolicies = createAsyncThunk<
  PolicyPaginationResponse,
  {
    page?: number
    pageSize?: number
    sortBy?: string
    sortDirection?: string
    riskClass?: string
    riskID?: string
    branchId?: string
    status?: string
    searchTerm?: string
  },
  { rejectValue: string }
>("underwriting/fetchPolicies", async (args, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const { 
      page = 1, 
      pageSize = 50, 
      sortBy = "TransDate", 
      sortDirection = "DESC", 
      riskClass = "", 
      riskID = "",
      branchId = "",
      status = "",
      searchTerm = ""
    } = args
    
    // Build the URL with all parameters
    let url = `${API_BASE_URL}/PolicyAdmin?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&sortDirection=${sortDirection}`
    
    // Try different parameter names
    if (riskID) {
      url += `&riskID=${encodeURIComponent(riskID)}`
    } else if (riskClass) {
      url += `&riskClass=${encodeURIComponent(riskClass)}`
    } else if (branchId) {
      url += `&branchId=${encodeURIComponent(branchId)}`
    }
    
    if (status) {
      url += `&status=${encodeURIComponent(status)}`
    }
    
    if (searchTerm) {
      url += `&searchTerm=${encodeURIComponent(searchTerm)}`
    }
    
    console.log("🔍 Fetching policies with URL:", url)
    
    const response = await fetch(url, {
      method: "GET",
      headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
    })

    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as PolicyPaginationResponse
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch policies")
  }
})



// Get policy by policy number
export const getPolicyByNumber = createAsyncThunk<Policy, string, { rejectValue: string }>(
  "underwriting/getPolicyByNumber",
  async (policyNo, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(policyNo)}?proposalNo=${encodeURIComponent(policyNo)}`, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      const data = await response.json()
      return data as Policy
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch policy")
    }
  },
)





export const createPolicy = createAsyncThunk<Policy, CreatePolicyRequest, { rejectValue: string }>(
  "underwriting/createPolicy",
  async (policyData, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      
      // 🔥 Remove companyID before sending
      const { companyID, ...cleanData } = policyData as any
      
      // ✅ Ensure ALL risk fields are set
      console.log("📤 Sending create policy request:", cleanData)
      
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin`, {
        method: "POST",
        headers: { 
          accept: "text/plain", 
          Authorization: `Bearer ${AUTH_TOKEN}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(cleanData),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', errorText)
        
        try {
          const errorJson = JSON.parse(errorText)
          return rejectWithValue(errorJson.message || errorText)
        } catch {
          return rejectWithValue(errorText || `HTTP ${response.status}: ${response.statusText}`)
        }
      }
      
      const data = await response.json()
      console.log("✅ API Response:", data)
      
      // ✅ The API returns { errorCode: 0, errorMessage: 'proposalNo', ... }
      // We need to fetch the created policy using the proposal number
      if (data.errorCode === 0 && data.errorMessage) {
        console.log("✅ Policy created with proposalNo:", data.errorMessage)
        
        // Fetch the newly created policy
        try {
          const policyResponse = await fetch(`${API_BASE_URL}/PolicyAdmin/${data.errorMessage}`, {
            method: "GET",
            headers: { 
              accept: "text/plain", 
              Authorization: `Bearer ${AUTH_TOKEN}`, 
              "Content-Type": "application/json" 
            },
          })
          
          if (policyResponse.ok) {
            const policyData = await policyResponse.json()
            console.log("✅ Fetched created policy:", policyData)
            return policyData as Policy
          }
        } catch (fetchError) {
          console.warn("Could not fetch created policy, returning proposal number:", fetchError)
        }
        
        // If we can't fetch the full policy, return a partial object
        return {
          proposalNo: data.errorMessage,
          // Add other fields as needed
        } as Policy
      }
      
      return data as Policy
    } catch (error) {
      console.error("❌ Create policy error:", error)
      return rejectWithValue(error instanceof Error ? error.message : "Failed to create policy")
    }
  },
)

export const updatePolicy = createAsyncThunk(
  'underwritings/updatePolicy',
  async ({ proposalNo, policyData }: { proposalNo: string; policyData: UpdatePolicyRequest }, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await axios.put(
        `${API_BASE_URL}/PolicyAdmin/${proposalNo}/renew`,
        {
          branchID: policyData.branchID,
          partyID: policyData.partyID,
          mktStaffID: policyData.mktStaffID,
          surname: policyData.surname,
          firstName: policyData.firstName,
          otherNames: policyData.otherNames,
          insAddress: policyData.insAddress,
          insMobilePhone: policyData.insMobilePhone,
          insEmail: policyData.insEmail,
          insOccupation: policyData.insOccupation,
          startDate: policyData.startDate,
          endDate: policyData.endDate,
          bizSource: policyData.bizSource,
          businessType: policyData.businessType,
          accountType: policyData.accountType,
          busChannel: policyData.busChannel,
          subChannel: policyData.subChannel,
          proportionRate: policyData.proportionRate,
          currency: policyData.currency,
          exRate: policyData.exRate,
          remarks: policyData.remarks,
          modifiedBy: policyData.modifiedBy
        },
        { 
          headers: { 
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          } 
        }
      )
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.errorMessage || 'Failed to renew policy')
    }
  }
)

// Delete policy
export const deletePolicy = createAsyncThunk<string, string, { rejectValue: string }>(
  "underwriting/deletePolicy",
  async (policyNo, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(policyNo)}?proposalNo=${encodeURIComponent(policyNo)}`, {
        method: "DELETE",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      return policyNo
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to delete policy")
    }
  },
)

// Renew policy
export const renewPolicy = createAsyncThunk<any, { policyNo: string; payload: any }, { rejectValue: string }>(
  "underwriting/renewPolicy",
  async ({ policyNo, payload }, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await loggedFetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(policyNo)}/renew`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) await handleFetchError(response)
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to renew policy")
    }
  }
)

// --- CALCULATIONS ---

// 1. Calculate Risk Items
export const calculatePolicyRiskItems = createAsyncThunk<
  CalculatePolicyRiskItemsResponse,
  { subRisk?: string; riskItems: PolicyRiskItemUI[]; proportionRate?: number },
  { rejectValue: string }
>("underwriting/calculateRiskItems", async (data, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/calculate/risk-items`, {
      method: "POST",
      headers: { accept: "application/json", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) await handleFetchError(response)
    const resData = await response.json()
    return resData as CalculatePolicyRiskItemsResponse
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to calculate risk items")
  }
})

// 2. Calculate Section Aggregate
export const calculatePolicySectionAggregate = createAsyncThunk<
  PolicyAggregateTotals,
  PolicySection,
  { rejectValue: string }
>("underwriting/calculateSectionAggregate", async (section, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/calculate/section-aggregate`, {
      method: "POST",
      headers: { accept: "text/json", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(section),
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as PolicyAggregateTotals
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to calculate section aggregate")
  }
})

// 3. Calculate Section Adjustment
export const calculatePolicySectionAdjustment = createAsyncThunk<
  PolicyAdjustmentCalculations,
  { aggregatePremium: number } & PolicyAdjustments,
  { rejectValue: string }
>(
  "underwriting/calculateSectionAdjustment",
  async (payload, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/calculate/section-adjustments`, {
        method: "POST",
        headers: { accept: "text/json", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) await handleFetchError(response)
      const data = await response.json()
      return data as PolicyAdjustmentCalculations
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to calculate section adjustments")
    }
  },
)

// 6. Complete Calculation & Save
export const calculatePolicyComplete = createAsyncThunk<
  CompletePolicyCalculationResponse,
  { policyNo: string; calculationData: CompletePolicyCalculationRequest },
  { rejectValue: string }
>("underwriting/calculateComplete", async ({ policyNo, calculationData }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await loggedFetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(policyNo)}/calculate/fire/complete`, {
      method: "POST",
      headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(calculationData),
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as CompletePolicyCalculationResponse
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to perform complete calculation")
  }
})

// 6b. Complete Additional Calculation
export const calculateAdditionalPolicy = createAsyncThunk<
  CompletePolicyCalculationResponse,
  { policyNo: string; calculationData: CompletePolicyCalculationRequest },
  { rejectValue: string }
>("underwriting/calculateAdditional", async ({ policyNo, calculationData }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await loggedFetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(policyNo)}/calculations/fire/additional`, {
      method: "POST",
      headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(calculationData),
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as CompletePolicyCalculationResponse
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to perform additional calculation")
  }
})

export const recalculatePolicyComplete = createAsyncThunk<
  CompletePolicyCalculationResponse,
  { policyNo: string; detailID: string; calculationData: CompletePolicyCalculationRequest },
  { rejectValue: string }
>("underwriting/recalculateComplete", async ({ policyNo, detailID, calculationData }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await loggedFetch(`${API_BASE_URL}/PolicyAdmin/calculations/fire/${detailID}`, {
      method: "PUT",
      headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(calculationData),
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as CompletePolicyCalculationResponse
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to recalculate")
  }
})

// 6d. Recalculate Fire Proposal Complete (in-place by proposalNo)
export const recalculateFireProposalComplete = createAsyncThunk<
  CompletePolicyCalculationResponse,
  { proposalNo: string; calculationData: CompletePolicyCalculationRequest },
  { rejectValue: string }
>("underwriting/recalculateFireProposalComplete", async ({ proposalNo, calculationData }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await loggedFetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(proposalNo)}/calculate/fire/complete`, {
      method: "PUT",
      headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(calculationData),
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as CompletePolicyCalculationResponse
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to recalculate fire proposal")
  }
})

// 6e. Incremental Fire Section: Add
export const addFireSection = createAsyncThunk<
  FireDeclarationRecomputeResponseDto,
  { proposalNo: string; sectionData: any },
  { rejectValue: string }
>("underwriting/addFireSection", async ({ proposalNo, sectionData }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await loggedFetch(`${API_BASE_URL}/PolicyAdmin/fire/sections?proposalNo=${encodeURIComponent(proposalNo)}`, {
      method: "POST",
      headers: { accept: "application/json", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(sectionData),
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as FireDeclarationRecomputeResponseDto
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to add fire section")
  }
})

// 6f. Incremental Fire Section: Update
export const updateFireSection = createAsyncThunk<
  FireDeclarationRecomputeResponseDto,
  { proposalNo: string; sectionID: string; sectionData: any },
  { rejectValue: string }
>("underwriting/updateFireSection", async ({ proposalNo, sectionID, sectionData }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await loggedFetch(`${API_BASE_URL}/PolicyAdmin/fire/sections?proposalNo=${encodeURIComponent(proposalNo)}&sectionDeclarationNo=${encodeURIComponent(sectionID)}`, {
      method: "PUT",
      headers: { accept: "application/json", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(sectionData),
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as FireDeclarationRecomputeResponseDto
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to update fire section")
  }
})

// 6g. Incremental Fire Section: Delete
export const deleteFireSection = createAsyncThunk<
  FireDeclarationRecomputeResponseDto,
  { proposalNo: string; sectionID: string },
  { rejectValue: string }
>("underwriting/deleteFireSection", async ({ proposalNo, sectionID }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await loggedFetch(`${API_BASE_URL}/PolicyAdmin/fire/sections?proposalNo=${encodeURIComponent(proposalNo)}&sectionDeclarationNo=${encodeURIComponent(sectionID)}`, {
      method: "DELETE",
      headers: { accept: "application/json", Authorization: `Bearer ${AUTH_TOKEN}` },
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as FireDeclarationRecomputeResponseDto
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to delete fire section")
  }
})

// 6h. Preview Complete Fire Calculation (all sections + proposal without saving)
export const previewCompleteFireCalculation = createAsyncThunk<
  FirePreviewCompleteResponseDto,
  CompletePolicyCalculationRequest,
  { rejectValue: string }
>("underwriting/previewCompleteFireCalculation", async (calculationData, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await loggedFetch(`${API_BASE_URL}/PolicyAdmin/calculate/preview-complete`, {
      method: "POST",
      headers: { accept: "application/json", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(calculationData),
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as FirePreviewCompleteResponseDto
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to preview complete calculation")
  }
})

// 6i. Preview Single Section Fire Calculation
export const previewSectionFireCalculation = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>("underwriting/previewSectionFireCalculation", async (sectionData, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await loggedFetch(`${API_BASE_URL}/PolicyAdmin/calculate/section-preview`, {
      method: "POST",
      headers: { accept: "application/json", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(sectionData),
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to preview section calculation")
  }
})

// 6j. Fire Adjustment Options & Validators
export const getFireAdjustmentOptions = createAsyncThunk<
  any,
  void,
  { rejectValue: string }
>("underwriting/getFireAdjustmentOptions", async (_, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/fire/section-adjustment-options`, {
      method: "GET",
      headers: { accept: "application/json", Authorization: `Bearer ${AUTH_TOKEN}` },
    })
    if (!response.ok) await handleFetchError(response)
    return await response.json()
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch fire adjustment options")
  }
})

export const getFireRiskItemAdjustmentOptions = createAsyncThunk<
  any,
  void,
  { rejectValue: string }
>("underwriting/getFireRiskItemAdjustmentOptions", async (_, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/fire/risk-item-adjustment-options`, {
      method: "GET",
      headers: { accept: "application/json", Authorization: `Bearer ${AUTH_TOKEN}` },
    })
    if (!response.ok) await handleFetchError(response)
    return await response.json()
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch fire risk item adjustment options")
  }
})

export const calculateSectionDynamicAdjustments = createAsyncThunk<
  any,
  { sectionPremium: number; adjustments: SectionDynamicAdjustment[] },
  { rejectValue: string }
>("underwriting/calculateSectionDynamicAdjustments", async (payload, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/calculate/section-dynamic-adjustments`, {
      method: "POST",
      headers: { accept: "application/json", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!response.ok) await handleFetchError(response)
    return await response.json()
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to calculate dynamic adjustments")
  }
})

export const calculateRiskItemAdjustments = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>("underwriting/calculateRiskItemAdjustments", async (payload, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/calculate/risk-item-adjustments`, {
      method: "POST",
      headers: { accept: "application/json", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!response.ok) await handleFetchError(response)
    return await response.json()
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to calculate risk item adjustments")
  }
})

export const validateFireAdjustments = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>("underwriting/validateFireAdjustments", async (adjustments, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/fire/adjustments/validate`, {
      method: "POST",
      headers: { accept: "application/json", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(adjustments),
    })
    if (!response.ok) await handleFetchError(response)
    return await response.json()
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to validate fire adjustments")
  }
})

// 7. Get Calculation Breakdown
export const getPolicyCalculationBreakdown = createAsyncThunk<
  PolicyCalculationBreakdown,
  { policyNo: string; detailID: string },
  { rejectValue: string }
>("underwriting/getCalculationBreakdown", async ({ policyNo, detailID }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await loggedFetch(`${API_BASE_URL}/PolicyAdmin/proposalNo/calculations/fire/detailID/breakdown?proposalNo=${encodeURIComponent(policyNo)}&detailID=${encodeURIComponent(detailID)}`, {
      method: "GET",
      headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    if (typeof data.inputs === "string") {
      try { data.inputs = JSON.parse(data.inputs) } catch {}
    }
    if (typeof data.calculationSteps === "string") {
      try { data.calculationSteps = JSON.parse(data.calculationSteps) } catch {}
    }
    return data as PolicyCalculationBreakdown
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to get breakdown")
  }
})

// 8. Calculate Multi-Section Aggregate
export const calculatePolicyMultiSectionAggregate = createAsyncThunk<
  PolicyAggregateTotals,
  { adjustedSections: any[] },
  { rejectValue: string }
>(
  "underwriting/calculateMultiSectionAggregate",
  async (payload, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/calculate/aggregate-adjusted-sections`, {
        method: "POST",
        headers: { accept: "text/json", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) await handleFetchError(response)
      const data = await response.json()
      return data
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Failed to calculate aggregate")
    }
  },
)

// 9. Apply Policy Adjustments
export const applyPolicyAdjustments = createAsyncThunk<
  any,
  { totalAggregatePremium: number; otherDiscountsRate: number; otherLoadingsRate: number },
  { rejectValue: string }
>(
  "underwriting/applyPolicyAdjustments",
  async (payload, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/calculate/proposal-adjustments`, {
        method: "POST",
        headers: { accept: "text/json", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) await handleFetchError(response)
      const data = await response.json()
      return data
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Failed to apply adjustments")
    }
  },
)

// 10. Calculate Pro Rata
export const calculatePolicyProRata = createAsyncThunk<
  any,
  { netPremiumDue: number; coverDays: number },
  { rejectValue: string }
>(
  "underwriting/calculateProRata",
  async (payload, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/calculate/pro-rata`, {
        method: "POST",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) await handleFetchError(response)
      const data = await response.json()
      return data
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Failed to calculate pro-rata")
    }
  },
)

// 11. Reverse Endorsement
export const reverseEndorsement = createAsyncThunk<
  any,
  { policyNo: string; payload: any },
  { rejectValue: string }
>(
  "underwriting/reverseEndorsement",
  async ({ policyNo, payload }, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await loggedFetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(policyNo)}/endorsement/reversal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) await handleFetchError(response)
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to reverse endorsement")
    }
  }
)

// --- MOTOR CALCULATIONS ---

export const calculateMotorPolicyComplete = createAsyncThunk<
  PolicyMotorCalculationResponse,
  { policyNo: string; calculationData: PolicyMotorCalculationRequest },
  { rejectValue: string }
>("underwriting/calculateMotorComplete", async ({ policyNo, calculationData }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(policyNo)}/calculate/motor/complete`, {
      method: "POST",
      headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(calculationData),
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as PolicyMotorCalculationResponse
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to calculate motor policy")
  }
})

export const recalculateMotorPolicyComplete = createAsyncThunk<
  PolicyMotorCalculationResponse,
  { policyNo: string; calculationData: PolicyMotorCalculationRequest },
  { rejectValue: string }
>("underwriting/recalculateMotorComplete", async ({ policyNo, calculationData }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(policyNo)}/calculate/motor/complete`, {
      method: "PUT",
      headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(calculationData),
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as PolicyMotorCalculationResponse
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to recalculate motor policy")
  }
})

export const getMotorPolicyCalculationBreakdown = createAsyncThunk<
  PolicyMotorCalculationBreakdown,
  string,
  { rejectValue: string }
>("underwriting/getMotorCalculationBreakdown", async (policyNo, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(policyNo)}/motor/calculation/breakdown`, {
      method: "GET",
      headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as PolicyMotorCalculationBreakdown
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to get motor breakdown")
  }
})

// Add these thunks to your underwriting slice

// 1. Get all motor calculations for a policy
export const getMotorCalculations = createAsyncThunk<
  PolicyMotorCalculationSummary[],
  string,
  { rejectValue: string }
>("underwriting/getMotorCalculations", async (proposalNo, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/proposalNo/calculations/motor?proposalNo=${encodeURIComponent(proposalNo)}`, {
      method: "GET",
      headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as PolicyMotorCalculationSummary[]
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch motor calculations")
  }
})

// 2. Get a specific motor calculation breakdown by detailID
export const getMotorCalculationBreakdownByDetailID = createAsyncThunk<
  PolicyMotorCalculationBreakdown,
  { proposalNo: string; detailID: string },
  { rejectValue: string }
>("underwriting/getMotorCalculationBreakdownByDetailID", async ({ proposalNo, detailID }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/proposalNo/calculations/motor/detailID/breakdown?proposalNo=${encodeURIComponent(proposalNo)}&detailID=${encodeURIComponent(detailID)}`, {
      method: "GET",
      headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as PolicyMotorCalculationBreakdown
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch motor calculation breakdown")
  }
})

// 3. Create additional motor calculation
export const createAdditionalMotorCalculation = createAsyncThunk<
  PolicyMotorCalculationResponse,
  { proposalNo: string; calculationData: PolicyMotorCalculationRequest },
  { rejectValue: string }
>("underwriting/createAdditionalMotorCalculation", async ({ proposalNo, calculationData }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    // Ensure proposalNo is in the body
    const payload = {
      ...calculationData,
      proposalNo: proposalNo,
    }
    
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(proposalNo)}/calculations/motor/additional`, {
      method: "POST",
      headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as PolicyMotorCalculationResponse
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to create additional motor calculation")
  }
})

// 4. Update/recalculate a specific motor calculation by detailID
export const updateMotorCalculation = createAsyncThunk<
  PolicyMotorCalculationResponse,
  { detailID: string; calculationData: PolicyMotorCalculationRequest },
  { rejectValue: string }
>("underwriting/updateMotorCalculation", async ({ detailID, calculationData }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    // The request body should contain proposalNo, not policyNo
    // Make sure calculationData has proposalNo field
    const payload = {
      ...calculationData,
      // Ensure proposalNo is present
      proposalNo: calculationData.proposalNo || calculationData.policyNo,
    }
    
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/calculations/motor/${detailID}`, {
      method: "PUT",
      headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as PolicyMotorCalculationResponse
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to update motor calculation")
  }
})

// Motor step calculations
export const calculateMotorBasicPremium = createAsyncThunk(
  "underwriting/calculateMotorBasicPremium",
  async (payload: any, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/motor/calculate/step1-basic-premium`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${AUTH_TOKEN}` },
        body: JSON.stringify(payload),
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to calculate basic premium")
    }
  }
)

export const applyMotorDiscounts = createAsyncThunk(
  "underwriting/applyMotorDiscounts",
  async (payload: any, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/motor/calculate/step2-apply-discounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${AUTH_TOKEN}` },
        body: JSON.stringify(payload),
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to apply discounts")
    }
  }
)

export const applyMotorLoadings = createAsyncThunk(
  "underwriting/applyMotorLoadings",
  async (payload: any, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/motor/calculate/step3-apply-loadings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${AUTH_TOKEN}` },
        body: JSON.stringify(payload),
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to apply loadings")
    }
  }
)

export const calculateMotorFinalPremium = createAsyncThunk(
  "underwriting/calculateMotorFinalPremium",
  async (payload: any, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/motor/calculate/step4-final-premium`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${AUTH_TOKEN}` },
        body: JSON.stringify(payload),
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to calculate final premium")
    }
  }
)

export const aggregateMotorVehicles = createAsyncThunk(
  "underwriting/aggregateMotorVehicles",
  async (payload: any, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/motor/calculate/step5-aggregate-vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${AUTH_TOKEN}` },
        body: JSON.stringify(payload),
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to aggregate vehicles")
    }
  }
)

export const applyMotorProposalAdjustments = createAsyncThunk(
  "underwriting/applyMotorProposalAdjustments",
  async (payload: any, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/motor/calculate/step6-proposal-adjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${AUTH_TOKEN}` },
        body: JSON.stringify(payload),
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to apply proposal adjustments")
    }
  }
)

export const calculateMotorFinal = createAsyncThunk(
  "underwriting/calculateMotorFinal",
  async (payload: any, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/motor/calculate/step7-final-calculation`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${AUTH_TOKEN}` },
        body: JSON.stringify(payload),
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to calculate final")
    }
  }
)

export const calculateAndSaveMotor = createAsyncThunk(
  "underwriting/calculateAndSaveMotor",
  async ({ policyNo, calculationData }: { policyNo: string; calculationData: any }, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(decodeURIComponent(policyNo))}/calculate/motor/complete`, {
        method: "POST",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(calculationData),
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to calculate and save motor")
    }
  }
)

export const recalculateMotor = createAsyncThunk(
  "underwriting/recalculateMotor",
  async ({ policyNo, calculationData }: { policyNo: string; calculationData: any }, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(decodeURIComponent(policyNo))}/calculate/motor/complete`, {
        method: "PUT",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(calculationData),
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to recalculate motor")
    }
  }
)

export const getMotorCalculationBreakdown = createAsyncThunk(
  "underwriting/getMotorCalculationBreakdown",
  async (policyNo: string, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(decodeURIComponent(policyNo))}/motor/calculation/breakdown`, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to get motor breakdown")
    }
  }
)

// --- MOTOR VEHICLES: INCREMENTAL EDITS ---

// Incremental Motor Vehicle: Add
export const addMotorVehicleApi = createAsyncThunk<
  PolicyMotorCalculationResponse,
  { proposalNo: string; vehicleData: any },
  { rejectValue: string }
>("underwriting/addMotorVehicleApi", async ({ proposalNo, vehicleData }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await loggedFetch(`${API_BASE_URL}/PolicyAdmin/motor/vehicles?proposalNo=${encodeURIComponent(proposalNo)}`, {
      method: "POST",
      headers: { accept: "application/json", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(vehicleData),
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as PolicyMotorCalculationResponse
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to add motor vehicle")
  }
})

// Incremental Motor Vehicle: Update
export const updateMotorVehicleApi = createAsyncThunk<
  PolicyMotorCalculationResponse,
  { proposalNo: string; certificateNo: string; vehicleData: any },
  { rejectValue: string }
>("underwriting/updateMotorVehicleApi", async ({ proposalNo, certificateNo, vehicleData }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await loggedFetch(`${API_BASE_URL}/PolicyAdmin/motor/vehicles?proposalNo=${encodeURIComponent(proposalNo)}&certificateNo=${encodeURIComponent(certificateNo)}`, {
      method: "PUT",
      headers: { accept: "application/json", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(vehicleData),
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as PolicyMotorCalculationResponse
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to update motor vehicle")
  }
})

// Incremental Motor Vehicle: Delete
export const deleteMotorVehicleApi = createAsyncThunk<
  PolicyMotorCalculationResponse,
  { proposalNo: string; certificateNo: string },
  { rejectValue: string }
>("underwriting/deleteMotorVehicleApi", async ({ proposalNo, certificateNo }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await loggedFetch(`${API_BASE_URL}/PolicyAdmin/motor/vehicles?proposalNo=${encodeURIComponent(proposalNo)}&certificateNo=${encodeURIComponent(certificateNo)}`, {
      method: "DELETE",
      headers: { accept: "application/json", Authorization: `Bearer ${AUTH_TOKEN}` },
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as PolicyMotorCalculationResponse
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to delete motor vehicle")
  }
})

// --- MOTOR BULK VEHICLE UPLOAD ---

// Download Blank Template
export const downloadMotorUploadTemplate = createAsyncThunk<
  Blob,
  void,
  { rejectValue: string }
>("underwriting/downloadMotorUploadTemplate", async (_, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/motor/vehicles/upload/template`, {
      method: "GET",
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    })
    if (!response.ok) await handleFetchError(response)
    return await response.blob()
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to download upload template")
  }
})

// Preview Vehicle Upload
export const previewMotorVehicleUpload = createAsyncThunk<
  any,
  FormData,
  { rejectValue: string }
>("underwriting/previewMotorVehicleUpload", async (formData, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/motor/vehicles/upload/preview`, {
      method: "POST",
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      body: formData,
    })
    if (!response.ok) await handleFetchError(response)
    return await response.json()
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to preview vehicle upload")
  }
})

// Upload and Persist Vehicles
export const uploadMotorVehicles = createAsyncThunk<
  any,
  { proposalNo: string; formData: FormData; params?: Record<string, any> },
  { rejectValue: string }
>("underwriting/uploadMotorVehicles", async ({ proposalNo, formData, params = {} }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const searchParams = new URLSearchParams({ proposalNo, ...params })
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/motor/vehicles/upload?${searchParams.toString()}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      body: formData,
    })
    if (!response.ok) await handleFetchError(response)
    return await response.json()
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to upload motor vehicles")
  }
})

// --- MOTOR RENEWAL ---

// Get Renewable Vehicles
export const getMotorRenewableVehicles = createAsyncThunk<
  any,
  { proposalNo: string; detailID: string },
  { rejectValue: string }
>("underwriting/getMotorRenewableVehicles", async ({ proposalNo, detailID }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(proposalNo)}/calculations/motor/${encodeURIComponent(detailID)}/renewable-vehicles`, {
      method: "GET",
      headers: { accept: "application/json", Authorization: `Bearer ${AUTH_TOKEN}` },
    })
    if (!response.ok) await handleFetchError(response)
    return await response.json()
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch renewable vehicles")
  }
})

// Renew Motor Calculation
export const renewMotorCalculation = createAsyncThunk<
  any,
  { proposalNo: string; detailID: string; payload: any },
  { rejectValue: string }
>("underwriting/renewMotorCalculation", async ({ proposalNo, detailID, payload }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(proposalNo)}/calculations/motor/${encodeURIComponent(detailID)}/renew`, {
      method: "POST",
      headers: { accept: "application/json", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!response.ok) await handleFetchError(response)
    return await response.json()
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to renew motor calculation")
  }
})

// Same endpoints as renewMotorCalculation / getMotorRenewableVehicles, with the argument
// shapes the ported GIBS renewal screens (Renewals/MotorRenewalCalculator) use.
export const getRenewableMotorVehicles = createAsyncThunk<
  any[],
  { proposalNo: string; detailID: string },
  { rejectValue: string }
>("underwriting/getRenewableMotorVehicles", async ({ proposalNo, detailID }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(
      `${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(proposalNo)}/calculations/motor/${encodeURIComponent(detailID)}/renewable-vehicles`,
      { method: "GET", headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` } }
    )
    if (!response.ok) await handleFetchError(response)
    return await response.json()
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch renewable motor vehicles")
  }
})

export const renewMotorVehicles = createAsyncThunk<
  any,
  { proposalNo: string; detailID: string; selectedVehicleTokens: string[]; renewedBy?: string; remarks?: string },
  { rejectValue: string }
>("underwriting/renewMotorVehicles", async ({ proposalNo, detailID, selectedVehicleTokens, renewedBy = "System", remarks = "" }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(
      `${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(proposalNo)}/calculations/motor/${encodeURIComponent(detailID)}/renew`,
      {
        method: "POST",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ selectedVehicleTokens, renewedBy, remarks }),
      }
    )
    if (!response.ok) await handleFetchError(response)
    return await response.json()
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to renew motor vehicles")
  }
})

// ===== Fire/Motor endorsement engine (EndorsementController, mounted at /endorsement — NOT under /api) =====

export const getFireEndorsementTypes = createAsyncThunk<EndorsementTypesResponse, void, { rejectValue: string }>(
  "underwriting/getFireEndorsementTypes",
  async (_, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${ENDORSEMENT_BASE_URL}/endorsement/fire/types`, {
        method: "GET",
        headers: { accept: "*/*", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch fire endorsement types")
    }
  }
)

export const getMotorEndorsementTypes = createAsyncThunk<EndorsementTypesResponse, void, { rejectValue: string }>(
  "underwriting/getMotorEndorsementTypes",
  async (_, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      // GIBS called ${API_BASE_URL}/endorsement/motor/types, which 404s: the controller isn't under /api
      const response = await fetch(`${ENDORSEMENT_BASE_URL}/endorsement/motor/types`, {
        method: "GET",
        headers: { accept: "*/*", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch motor endorsement types")
    }
  }
)

export const getEndorsableFireSections = createAsyncThunk<
  EndorsableItem[],
  { policyNo: string; detailId: string },
  { rejectValue: string }
>("underwriting/getEndorsableFireSections", async ({ policyNo, detailId }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(
      `${ENDORSEMENT_BASE_URL}/endorsement/fire/sections?policyNo=${encodeURIComponent(policyNo)}&detailId=${encodeURIComponent(detailId)}`,
      { method: "GET", headers: { accept: "*/*", Authorization: `Bearer ${AUTH_TOKEN}` } }
    )
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return Array.isArray(data) ? data : data.data || []
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch endorsable fire sections")
  }
})

export const getEndorsableMotorVehicles = createAsyncThunk<
  EndorsableItem[],
  { policyNo: string; detailId: string },
  { rejectValue: string }
>("underwriting/getEndorsableMotorVehicles", async ({ policyNo, detailId }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(
      `${ENDORSEMENT_BASE_URL}/endorsement/motor/vehicles?policyNo=${encodeURIComponent(policyNo)}&detailId=${encodeURIComponent(detailId)}`,
      { method: "GET", headers: { accept: "*/*", Authorization: `Bearer ${AUTH_TOKEN}` } }
    )
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return Array.isArray(data) ? data : data.data || []
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch endorsable motor vehicles")
  }
})

const postEndorsement = async (kind: "fire" | "motor", payload: any) => {
  const AUTH_TOKEN = getAuthToken()
  const { policyNo, ...body } = payload
  if (!policyNo) throw new Error("policyNo is required")
  const response = await fetch(
    `${ENDORSEMENT_BASE_URL}/endorsement/${kind}?policyNo=${encodeURIComponent(policyNo)}`,
    {
      method: "POST",
      headers: { accept: "*/*", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  )
  if (!response.ok) await handleFetchError(response)
  return await response.json()
}

export const createFireEndorsement = createAsyncThunk<EndorsementRecord, any, { rejectValue: string }>(
  "underwriting/createFireEndorsement",
  async (payload, { rejectWithValue }) => {
    try {
      return await postEndorsement("fire", payload)
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to create fire endorsement")
    }
  }
)

export const createMotorEndorsement = createAsyncThunk<EndorsementRecord, any, { rejectValue: string }>(
  "underwriting/createMotorEndorsement",
  async (payload, { rejectWithValue }) => {
    try {
      return await postEndorsement("motor", payload)
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to create motor endorsement")
    }
  }
)

// Fetch Policy Endorsements
export const getPolicyEndorsements = createAsyncThunk<
  any[],
  string,
  { rejectValue: string }
>("underwriting/getPolicyEndorsements", async (policyNo, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await loggedFetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(policyNo)}/endorsements`, {
      method: "GET",
      headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
    })
    if (response.status === 404) {
      return []
    }
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.warn("Failed to fetch endorsements:", error)
    return []
  }
})

// Calculate Endorsement (Fire)
export const calculateEndorsementFire = createAsyncThunk<
  any,
  { policyNo: string; endorsementData: any },
  { rejectValue: string }
>("underwriting/calculateEndorsementFire", async ({ policyNo, endorsementData }, { rejectWithValue }) => {
  console.log(endorsementData);
  
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await loggedFetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(policyNo)}/endorsement/fire`, {
      method: "POST",
      headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(endorsementData),
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to calculate endorsement")
  }
})

// Get Current Calculation
export const getPolicyCurrentCalculation = createAsyncThunk<
  CompletePolicyCalculationResponse,
  string,
  { rejectValue: string }
>(
  "underwriting/getPolicyCurrentCalculation",
  async (policyNo, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(decodeURIComponent(policyNo))}/calculation/current`, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      const data = await response.json()
      return data
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Failed to fetch current calculation")
    }
  },
)

// Get Sections Summary
export const getSectionCalculationSummary = createAsyncThunk<
  PolicySectionsSummary,
  string,
  { rejectValue: string }
>(
  "underwriting/getSectionCalculationSummary",
  async (policyNo, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(policyNo)}/calculation/sections/summary`, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      const data = await response.json()
      return data
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Failed to fetch section summary")
    }
  },
)

// Fetch Policy Calculations List
export const fetchPolicyCalculations = createAsyncThunk<
  PolicyCalculationSummary[],
  string,
  { rejectValue: string }
>(
  "underwriting/fetchPolicyCalculations",
  async (policyNo, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/proposalNo/calculations/fire?proposalNo=${encodeURIComponent(policyNo)}`, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      const data = await response.json()
      return data as PolicyCalculationSummary[]
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Failed to fetch policy calculations")
    }
  },
)

// Fetch Policy Report (Print)
export const fetchPolicyReport = createAsyncThunk<string, string, { rejectValue: string }>(
  "underwriting/fetchPolicyReport",
  async (policyNo, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/Report/print/${encodeURIComponent(decodeURIComponent(policyNo))}`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      })
      if (!response.ok) await handleFetchError(response)
      const data = await response.text()
      return data
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch policy report")
    }
  },
)

// ============================================================================
// DEBIT NOTES
// ============================================================================

export const fetchDebitNotes = createAsyncThunk<any[], string, { rejectValue: string }>(
  "underwriting/fetchDebitNotes",
  async (policyNo, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/DebitNotes?PolicyNo=${encodeURIComponent(policyNo)}`, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      const data = await response.json()
      return data.items || []
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch debit notes")
    }
  }
)

export const getDebitNoteMapping = createAsyncThunk<any, { policyNo: string; detailID: string }, { rejectValue: string }>(
  "underwriting/getDebitNoteMapping",
  async ({ policyNo, detailID }, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/DebitNotes/map-policy/${encodeURIComponent(policyNo)}?detailID=${detailID}`, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch debit note mapping")
    }
  }
)

export const createDebitNote = createAsyncThunk<any, any, { rejectValue: string }>(
  "underwriting/createDebitNote",
  async (noteData, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/DebitNotes`, {
        method: "POST",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to create debit note")
    }
  }
)

export const fetchDebitNoteById = createAsyncThunk<any, string, { rejectValue: string }>(
  "underwriting/fetchDebitNoteById",
  async (dncnNo, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/DebitNotes/${encodeURIComponent(dncnNo)}`, {
        method: "GET",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch debit note")
    }
  }
)

export const updateDebitNote = createAsyncThunk<any, { dncnNo: string; noteData: any }, { rejectValue: string }>(
  "underwriting/updateDebitNote",
  async ({ dncnNo, noteData }, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/DebitNotes/${encodeURIComponent(dncnNo)}`, {
        method: "PUT",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to update debit note")
    }
  }
)

export const deleteDebitNote = createAsyncThunk<any, string, { rejectValue: string }>(
  "underwriting/deleteDebitNote",
  async (dncnNo, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/DebitNotes/${encodeURIComponent(dncnNo)}`, {
        method: "DELETE",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
      })
      if (!response.ok) await handleFetchError(response)
      return { dncnNo }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to delete debit note")
    }
  }
)

export const recalculateDebitNote = createAsyncThunk<any, any, { rejectValue: string }>(
  "underwriting/recalculateDebitNote",
  async (noteData, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/DebitNotes/recalculate`, {
        method: "POST",
        headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to recalculate debit note")
    }
  }
)

export const calculateCoinsurance = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>(
  "underwriting/calculateCoinsurance",
  async (payload, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/DebitNotes/calculatecoinsurance`, {
        method: "POST",
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to calculate coinsurance")
    }
  }
)

// ============================================================================
// RENEWALS
// ============================================================================

export const getPreviousPolicyFireCalculationBreakdown = createAsyncThunk<
  PolicyCalculationBreakdown,
  { policyNo: string; detailID?: string },
  { rejectValue: string }
>("underwriting/getPreviousPolicyFireCalculationBreakdown", async ({ policyNo, detailID }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    let url = `${API_BASE_URL}/PolicyAdmin/proposalNo/calculations/fire?proposalNo=${encodeURIComponent(policyNo)}`
    if (detailID) {
      url = `${API_BASE_URL}/PolicyAdmin/proposalNo/calculations/fire/detailID/breakdown?proposalNo=${encodeURIComponent(policyNo)}&detailID=${encodeURIComponent(detailID)}`
    }
    const response = await fetch(url, {
      method: "GET",
      headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    if (typeof data.inputs === "string") {
      try { data.inputs = JSON.parse(data.inputs) } catch {}
    }
    if (typeof data.calculationSteps === "string") {
      try { data.calculationSteps = JSON.parse(data.calculationSteps) } catch {}
    }
    return data as PolicyCalculationBreakdown
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch previous calculation breakdown")
  }
})

export const getRenewalAvailableCalculations = createAsyncThunk<
  AvailableCalculation[],
  string,
  { rejectValue: string }
>("underwriting/getRenewalAvailableCalculations", async (originalPolicyNo, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(originalPolicyNo)}/renewal/available-calculations`, {
      method: "GET",
      headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data as AvailableCalculation[]
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch renewal calculations")
  }
})

export const getRenewableSections = createAsyncThunk<
  any[],
  { policyNo: string; riskClass: string; detailID: string },
  { rejectValue: string }
>("underwriting/getRenewableSections", async ({ policyNo, riskClass, detailID }, { rejectWithValue }) => {
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(policyNo)}/calculations/${encodeURIComponent(riskClass)}/${encodeURIComponent(detailID)}/renewable-sections`, {
      method: "GET",
      headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}` },
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch renewable sections")
  }
})

export const renewPolicySections = createAsyncThunk<
  any,
  { policyNo: string; riskClass: string; detailID: string; selectedSectionTokens: string[]; renewedBy?: string; remarks?: string },
  { rejectValue: string }
>("underwriting/renewPolicySections", async ({ policyNo, riskClass, detailID, selectedSectionTokens, renewedBy = "System", remarks = "" }, { rejectWithValue }) => {
  console.log("🌵🌵🌵🌵🌵",JSON.stringify({ selectedSectionTokens, renewedBy, remarks }));
  
  try {
    const AUTH_TOKEN = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(policyNo)}/calculations/${encodeURIComponent(riskClass)}/${encodeURIComponent(detailID)}/renew`, {
      method: "POST",
      headers: { accept: "text/plain", Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ selectedSectionTokens, renewedBy, remarks }),
    })
    if (!response.ok) await handleFetchError(response)
    const data = await response.json()
    return data
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to renew policy sections")
  }
})

export const convertMotorCalculationToVehicles = (
  calculationResponse: any
): PolicyMotorVehicleUI[] => {
  // Debug logging
  console.log("convertMotorCalculationToVehicles input:", calculationResponse);
  
  // Try both field names
  let vehicles = calculationResponse?.vehicleCalculations || calculationResponse?.calculatedVehicles;
  
  if (!vehicles) {
    // Try checking if the response itself is the vehicles array
    if (Array.isArray(calculationResponse)) {
      vehicles = calculationResponse;
    } else {
      console.log("No vehicles found in response");
      return [];
    }
  }
  
  if (!Array.isArray(vehicles)) {
    console.log("vehicles is not an array:", vehicles);
    return [];
  }
  
  console.log(`Converting ${vehicles.length} vehicles`);
  
  return vehicles.map((vehicle, index) => ({
    ...vehicle,
    uiId: vehicle.itemNo ? `vehicle-${vehicle.itemNo}` : `vehicle-${index}`,
    _collapsed: false,
    _showDetails: false
  }))
}


export const calculateRenewalFire = createAsyncThunk(
  "underwriting/calculateRenewalFire",
  async ({ proposalNo, calculationData }: { proposalNo: string; calculationData: RenewalCalculationRequest }, { rejectWithValue }) => {
    try {
      const AUTH_TOKEN = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/PolicyAdmin/${encodeURIComponent(proposalNo)}/calculations/fire/renewal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${AUTH_TOKEN}` },
        body: JSON.stringify(calculationData),
      })
      if (!response.ok) await handleFetchError(response)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to calculate renewal")
    }
  }
)

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: UnderwritingState = {
  policies: [],
  currentPolicy: null,
  currentCalculation: null,
  calculationBreakdown: null,
  sectionsSummary: null,
  calculationHistory: [],
  sections: [],
  selectedRiskFilter: null,
  currentDebitNoteMapping: null,
  availableCalculations: [],
  debitNotes: [],
  agents: [],
  businessSource: [],
  bizSources: [],
  businessType: [],
  accountType: [],
  busChannels: [],
  subChannels: [],
  currency: [],
  occupations: [],
  riskClassifications: [],
  sectionsList: [],
  riskSMI: [],
  adjustmentOptions: null,
  motorAdjustmentOptions: null,
  endorsementTypes: [],
  motorVehicles: [],
  currentMotorCalculation: null,
  motorCalculationHistory: [],
  motorCalculationBreakdown: null,
  loading: {
    fetchPolicies: false,
    fetchPolicy: false,
    createPolicy: false,
    updatePolicy: false,
    deletePolicy: false,
    calculateRiskItems: false,
    calculateSectionAggregate: false,
    calculateSectionAdjustment: false,
    calculateGeneric: false,
    fetchReport: false,
    fetchCalculation: false,
    fetchPolicyReport: false,
    fetchDebitNotes: false,
    fetchDebitNoteMapping: false,
    createDebitNote: false,
    calculateMotor: false,
    fetchMotorCalculation: false,
    fetchMotorCalculations: false,
    fetchMotorCalculationBreakdown: false,
    
    
  },
  success: {
    createPolicy: false,
    updatePolicy: false,
    deletePolicy: false,
    calculateRiskItems: false,
    calculateGeneric: false,
    fetchReport: false,
    fetchPolicyReport: false,
    createDebitNote: false,
    calculateMotor: false,
  },
  error: {
    fetchPolicies: null,
    fetchPolicy: null,
    createPolicy: null,
    updatePolicy: null,
    deletePolicy: null,
    calculateRiskItems: null,
    calculateSectionAggregate: null,
    calculateSectionAdjustment: null,
    calculateGeneric: null,
    fetchReport: null,
    fetchCalculation: null,
    fetchPolicyReport: null,
    fetchDebitNotes: null,
    fetchDebitNoteMapping: null,
    createDebitNote: null,
    calculateMotor: null,
    fetchMotorCalculation: null,
    fetchMotorCalculations: null,
    fetchMotorCalculationBreakdown: null,
  },
  pagination: {
    page: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
  searchTerm: "",
  activeTab: "overview",
}

const underwritingSlice = createSlice({
  name: "underwriting",
  initialState,
  reducers: {
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload
    },
    setCurrentPolicy: (state, action: PayloadAction<Policy | null>) => {
      state.currentPolicy = action.payload
      state.currentCalculation = null
      state.calculationBreakdown = null
      state.currentMotorCalculation = null
      state.motorCalculationBreakdown = null
      state.motorVehicles = []
    },
    setSelectedRiskFilter: (state, action: PayloadAction<string | null>) => {
      state.selectedRiskFilter = action.payload
    },
    setSections: (state, action: PayloadAction<PolicySection[]>) => {
      state.sections = action.payload
    },
    setCurrentCalculation: (state, action: PayloadAction<CompletePolicyCalculationResponse | null>) => {
      state.currentCalculation = action.payload
    },
    setCurrentMotorCalculation: (state, action: PayloadAction<PolicyMotorCalculationResponse | null>) => {
      state.currentMotorCalculation = action.payload
    },
    setCalculationBreakdown: (state, action: PayloadAction<PolicyCalculationBreakdown | null>) => {
      state.calculationBreakdown = action.payload
    },
    setSectionsSummary: (state, action: PayloadAction<PolicySectionsSummary | null>) => {
      state.sectionsSummary = action.payload
    },
    setMotorVehicles: (state, action: PayloadAction<PolicyMotorVehicleUI[]>) => {
      state.motorVehicles = action.payload
    },
    addMotorVehicle: (state, action: PayloadAction<PolicyMotorVehicleUI>) => {
      state.motorVehicles.push(action.payload)
      state.currentMotorCalculation = null
    },
    updateMotorVehicle: (state, action: PayloadAction<PolicyMotorVehicleUI>) => {
      const index = state.motorVehicles.findIndex((v) => v.uiId === action.payload.uiId)
      if (index !== -1) {
        state.motorVehicles[index] = action.payload
      }
      state.currentMotorCalculation = null
    },
    removeMotorVehicle: (state, action: PayloadAction<string>) => {
      state.motorVehicles = state.motorVehicles.filter((v) => v.uiId !== action.payload)
      state.currentMotorCalculation = null
    },
    clearMessages: (state) => {
      state.success = {
        createPolicy: false,
        updatePolicy: false,
        deletePolicy: false,
        calculateRiskItems: false,
        calculateGeneric: false,
        fetchReport: false,
        fetchPolicyReport: false,
        createDebitNote: false,
        calculateMotor: false,
      }
      state.error = {
        fetchPolicies: null,
        fetchPolicy: null,
        createPolicy: null,
        updatePolicy: null,
        deletePolicy: null,
        calculateRiskItems: null,
        calculateSectionAggregate: null,
        calculateSectionAdjustment: null,
        calculateGeneric: null,
        fetchReport: null,
        fetchCalculation: null,
        fetchPolicyReport: null,
        fetchDebitNotes: null,
        fetchDebitNoteMapping: null,
        createDebitNote: null,
        calculateMotor: null,
        fetchMotorCalculation: null,
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Policies
    builder.addCase(fetchPolicies.pending, (state) => {
      state.loading.fetchPolicies = true
      state.error.fetchPolicies = null
    })
    builder.addCase(fetchPolicies.fulfilled, (state, action) => {
      state.loading.fetchPolicies = false
      state.policies = action.payload.items.map((item: any) => ({
        ...item,
        policyNo: item.proposalNo || item.policyNo,
      }))
      state.pagination = {
        page: action.payload.page,
        pageSize: action.payload.pageSize,
        totalCount: action.payload.totalCount,
        totalPages: action.payload.totalPages,
        hasNext: action.payload.hasNext,
        hasPrevious: action.payload.hasPrevious,
      }
    })
    builder.addCase(fetchPolicies.rejected, (state, action) => {
      state.loading.fetchPolicies = false
      state.error.fetchPolicies = action.payload as string
    })

    // Renewal Available Calculations
    builder.addCase(getRenewalAvailableCalculations.pending, (state) => {
      state.loading.fetchPolicies = true
      state.availableCalculations = []
    })
    builder.addCase(getRenewalAvailableCalculations.fulfilled, (state, action) => {
      state.loading.fetchPolicies = false
      state.availableCalculations = action.payload
    })
    builder.addCase(getRenewalAvailableCalculations.rejected, (state, action) => {
      state.loading.fetchPolicies = false
      state.availableCalculations = []
    })

// Update the getPolicyByNumber reducer in the extraReducers section:

builder.addCase(getPolicyByNumber.pending, (state) => {
  state.loading.fetchPolicy = true
  state.error.fetchPolicy = null
})
builder.addCase(getPolicyByNumber.fulfilled, (state, action) => {
  state.loading.fetchPolicy = false
  // 🔥 FIX: Handle both array and object responses
  const policyData = Array.isArray(action.payload) && action.payload.length > 0 
    ? action.payload[0] 
    : action.payload
  
  if (policyData) {
    state.currentPolicy = {
      ...policyData,
      policyNo: policyData.proposalNo || policyData.policyNo,
    } as any
    console.log('✅ Policy set in state:', state.currentPolicy)
  } else {
    state.currentPolicy = null
    console.warn('⚠️ No policy data available')
  }
})
builder.addCase(getPolicyByNumber.rejected, (state, action) => {
  state.loading.fetchPolicy = false
  state.error.fetchPolicy = action.payload as string
  console.error('❌ Failed to fetch policy:', action.payload)
})

    // Create Policy
    builder.addCase(createPolicy.pending, (state) => {
      state.loading.createPolicy = true
      state.success.createPolicy = false
      state.error.createPolicy = null
    })
    builder.addCase(createPolicy.fulfilled, (state, action) => {
      state.loading.createPolicy = false
      state.success.createPolicy = true
      if (!state.policies.find((p) => p.policyNo === action.payload.policyNo)) {
        state.policies.unshift(action.payload)
      }
      state.currentPolicy = action.payload
    })
    builder.addCase(createPolicy.rejected, (state, action) => {
      state.loading.createPolicy = false
      state.error.createPolicy = action.payload as string
    })

    // Update Policy
    builder.addCase(updatePolicy.pending, (state) => {
      state.loading.updatePolicy = true
      state.success.updatePolicy = false
      state.error.updatePolicy = null
    })
    builder.addCase(updatePolicy.fulfilled, (state, action) => {
      state.loading.updatePolicy = false
      state.success.updatePolicy = true
      const index = state.policies.findIndex((p) => p.policyNo === action.payload.policyNo)
      if (index !== -1) {
        state.policies[index] = action.payload
      }
      state.currentPolicy = action.payload
    })
    builder.addCase(updatePolicy.rejected, (state, action) => {
      state.loading.updatePolicy = false
      state.error.updatePolicy = action.payload as string
    })

    // Delete Policy
    builder.addCase(deletePolicy.fulfilled, (state, action) => {
      // List rows carry proposalNo (policyNo is often absent)
      const isDeleted = (p: any) => p?.proposalNo === action.payload || p?.policyNo === action.payload
      state.policies = state.policies.filter((p) => !isDeleted(p))
      if (isDeleted(state.currentPolicy)) {
        state.currentPolicy = null
      }
    })

    // Renew Policy
    builder.addCase(renewPolicy.pending, (state) => {
      state.loading.createPolicy = true
      state.success.createPolicy = false
      state.error.createPolicy = null
    })
    builder.addCase(renewPolicy.fulfilled, (state, action) => {
      state.loading.createPolicy = false
      state.success.createPolicy = true
      if (!state.policies.find((p) => p.policyNo === action.payload.policyNo)) {
        state.policies.unshift(action.payload)
      }
      state.currentPolicy = action.payload
    })
    builder.addCase(renewPolicy.rejected, (state, action) => {
      state.loading.createPolicy = false
      state.error.createPolicy = action.payload as string
    })

    // Calculate Complete
    builder.addCase(calculatePolicyComplete.pending, (state) => {
      state.loading.calculate = true
      state.success.calculate = false
      state.error.calculate = null
    })
    builder.addCase(calculatePolicyComplete.fulfilled, (state, action) => {
      state.loading.calculate = false
      state.success.calculate = true
      state.currentCalculation = action.payload
    })
    builder.addCase(calculatePolicyComplete.rejected, (state, action) => {
      state.loading.calculate = false
      state.error.calculate = action.payload as string
    })

    // Calculate Renewal Fire
    builder.addCase(calculateRenewalFire.pending, (state) => {
      state.loading.calculate = true
      state.success.calculate = false
      state.error.calculate = null
    })
    builder.addCase(calculateRenewalFire.fulfilled, (state, action) => {
      state.loading.calculate = false
      state.success.calculate = true
      state.currentCalculation = action.payload
    })
    builder.addCase(calculateRenewalFire.rejected, (state, action) => {
      state.loading.calculate = false
      state.error.calculate = action.payload as string
    })

    // Calculate Endorsement Fire
    builder.addCase(calculateEndorsementFire.pending, (state) => {
      state.loading.calculate = true
      state.success.calculate = false
      state.error.calculate = null
    })
    builder.addCase(calculateEndorsementFire.fulfilled, (state, action) => {
      state.loading.calculate = false
      state.success.calculate = true
      state.currentCalculation = action.payload
    })
    builder.addCase(calculateEndorsementFire.rejected, (state, action) => {
      state.loading.calculate = false
      state.error.calculate = action.payload as string
    })

    // Recalculate
    builder.addCase(recalculatePolicyComplete.pending, (state) => {
      state.loading.calculate = true
    })
    builder.addCase(recalculatePolicyComplete.fulfilled, (state, action) => {
      state.loading.calculate = false
      state.success.calculate = true
      state.currentCalculation = action.payload
    })

    // Get Breakdown
    builder.addCase(getPolicyCalculationBreakdown.fulfilled, (state, action) => {
      state.calculationBreakdown = action.payload
    })

    // Get Current Calculation
    builder.addCase(getPolicyCurrentCalculation.pending, (state) => {
      state.loading.fetchCalculation = true
    })
    builder.addCase(getPolicyCurrentCalculation.fulfilled, (state, action) => {
      state.loading.fetchCalculation = false
      state.currentCalculation = action.payload
    })
    builder.addCase(getPolicyCurrentCalculation.rejected, (state, action) => {
      state.loading.fetchCalculation = false
      state.error.fetchCalculation = action.payload as string
    })

    // Risk Items
    builder.addCase(calculatePolicyRiskItems.pending, (state) => {
      state.loading.calculateRiskItems = true
      state.error.calculateRiskItems = null
    })
    builder.addCase(calculatePolicyRiskItems.fulfilled, (state) => {
      state.loading.calculateRiskItems = false
      state.success.calculateRiskItems = true
    })
    builder.addCase(calculatePolicyRiskItems.rejected, (state, action) => {
      state.loading.calculateRiskItems = false
      state.error.calculateRiskItems = action.payload as string
    })

    // Fetch Policy Report
    builder.addCase(fetchPolicyReport.pending, (state) => {
      state.loading.fetchPolicyReport = true
      state.success.fetchPolicyReport = false
      state.error.fetchPolicyReport = null
    })
    builder.addCase(fetchPolicyReport.fulfilled, (state, action) => {
      state.loading.fetchPolicyReport = false
      state.success.fetchPolicyReport = true
    })
    builder.addCase(fetchPolicyReport.rejected, (state, action) => {
      state.loading.fetchPolicyReport = false
      state.error.fetchPolicyReport = action.payload as string
    })

    // Helper Endpoints
    builder.addCase(getPolBizType.fulfilled, (state, action) => {
      state.businessType = (action.payload || []).map(parseLookupItem)
    })
    builder.addCase(getBizShareType.fulfilled, (state, action) => {
      state.accountType = (action.payload || []).map(parseLookupItem)
    })
    builder.addCase(getBizSources.fulfilled, (state, action) => {
      state.bizSources = (action.payload || []).map(parseLookupItem)
    })
    builder.addCase(getBusinessChannels.fulfilled, (state, action) => {
      state.busChannels = action.payload.map((item: any) => ({
        value: item.channelID,
        label: item.channels,
      }))
    })
    builder.addCase(getSubChannels.fulfilled, (state, action) => {
      state.subChannels = action.payload.map((item: any) => ({
        value: item.mktGroupID,
        label: item.groupName || item.groupHead || item.description || item.mktGroupID,
      }))
    })
    builder.addCase(getAdjustmentOptions.fulfilled, (state, action) => {
      state.adjustmentOptions = action.payload as any
    })
    builder.addCase(getEndorsementTypes.fulfilled, (state, action) => {
      state.endorsementTypes = action.payload
    })
    builder.addCase(getMotorAdjustmentTypes.fulfilled, (state, action) => {
      state.motorAdjustmentOptions = action.payload as any
    })
    builder.addCase(getOccupations.fulfilled, (state, action) => {
      state.occupations = action.payload.map((item: any) => ({
        value: item.occupation,
        label: item.occupation,
      }))
    })

    // --- MOTOR EXTRA REDUCERS ---
    builder.addCase(calculateMotorPolicyComplete.pending, (state) => {
      state.loading.calculateMotor = true
      state.error.calculateMotor = null
    })
    builder.addCase(calculateMotorPolicyComplete.fulfilled, (state, action) => {
      state.loading.calculateMotor = false
      state.currentMotorCalculation = action.payload
      state.success.calculateMotor = true
    })
    builder.addCase(calculateMotorPolicyComplete.rejected, (state, action) => {
      state.loading.calculateMotor = false
      state.error.calculateMotor = action.payload as string
    })

    builder.addCase(recalculateMotorPolicyComplete.pending, (state) => {
      state.loading.calculateMotor = true
      state.error.calculateMotor = null
    })
    builder.addCase(recalculateMotorPolicyComplete.fulfilled, (state, action) => {
      state.loading.calculateMotor = false
      state.currentMotorCalculation = action.payload
      state.success.calculateMotor = true
    })
    builder.addCase(recalculateMotorPolicyComplete.rejected, (state, action) => {
      state.loading.calculateMotor = false
      state.error.calculateMotor = action.payload as string
    })

    builder.addCase(getMotorPolicyCalculationBreakdown.pending, (state) => {
      state.loading.fetchMotorCalculation = true
      state.motorCalculationBreakdown = null
      state.error.fetchMotorCalculation = null
    })
    builder.addCase(getMotorPolicyCalculationBreakdown.fulfilled, (state, action) => {
      state.loading.fetchMotorCalculation = false
      state.motorCalculationBreakdown = action.payload
    })
    builder.addCase(getMotorPolicyCalculationBreakdown.rejected, (state, action) => {
      state.loading.fetchMotorCalculation = false
      state.error.fetchMotorCalculation = action.payload as string
      state.motorCalculationBreakdown = null
    })

    // Fetch Policy Calculations LIST
    builder.addCase(fetchPolicyCalculations.pending, (state, action) => {
      state.loading.fetchCalculation = true
      // Don't show another policy's calculations while this policy's list loads
      const first: any = state.calculationHistory?.[0]
      const owner = first?.policyNo ?? first?.proposalNo
      if (owner && owner !== action.meta.arg) state.calculationHistory = []
    })
    builder.addCase(fetchPolicyCalculations.fulfilled, (state, action) => {
      state.loading.fetchCalculation = false
      state.calculationHistory = action.payload
    })
    builder.addCase(fetchPolicyCalculations.rejected, (state, action) => {
      state.loading.fetchCalculation = false
      state.error.fetchCalculation = action.payload as string
      state.calculationHistory = []
    })

    // DEBIT NOTES
    builder.addCase(fetchDebitNotes.pending, (state) => {
      state.loading.fetchDebitNotes = true
      state.error.fetchDebitNotes = null
    })
    builder.addCase(fetchDebitNotes.fulfilled, (state, action) => {
      state.loading.fetchDebitNotes = false
      state.debitNotes = action.payload
    })
    builder.addCase(fetchDebitNotes.rejected, (state, action) => {
      state.loading.fetchDebitNotes = false
      state.error.fetchDebitNotes = action.payload as string
    })

    builder.addCase(getDebitNoteMapping.pending, (state) => {
      state.loading.fetchDebitNoteMapping = true
      state.error.fetchDebitNoteMapping = null
    })
    builder.addCase(getDebitNoteMapping.fulfilled, (state, action) => {
      state.loading.fetchDebitNoteMapping = false
      state.currentDebitNoteMapping = action.payload
    })
    builder.addCase(getDebitNoteMapping.rejected, (state, action) => {
      state.loading.fetchDebitNoteMapping = false
      state.error.fetchDebitNoteMapping = action.payload as string
    })

    builder.addCase(createDebitNote.pending, (state) => {
      state.loading.createDebitNote = true
      state.success.createDebitNote = false
      state.error.createDebitNote = null
    })
    builder.addCase(createDebitNote.fulfilled, (state, action) => {
      state.loading.createDebitNote = false
      state.success.createDebitNote = true
    })
    builder.addCase(createDebitNote.rejected, (state, action) => {
      state.loading.createDebitNote = false
      state.error.createDebitNote = action.payload as string
    })

    builder.addCase(deleteDebitNote.fulfilled, (state, action) => {
      state.debitNotes = state.debitNotes.filter(dn => dn.dncnNo !== action.payload.dncnNo)
    })
    // Add to extraReducers
builder.addCase(getMotorCalculations.pending, (state) => {
  state.loading.fetchMotorCalculations = true
  state.error.fetchMotorCalculations = null
})
builder.addCase(getMotorCalculations.fulfilled, (state, action) => {
  state.loading.fetchMotorCalculations = false
  state.motorCalculationHistory = action.payload
})
builder.addCase(getMotorCalculations.rejected, (state, action) => {
  state.loading.fetchMotorCalculations = false
  state.error.fetchMotorCalculations = action.payload as string
  state.motorCalculationHistory = []
})

builder.addCase(getMotorCalculationBreakdownByDetailID.pending, (state) => {
  state.loading.fetchMotorCalculationBreakdown = true
  state.error.fetchMotorCalculationBreakdown = null
})
builder.addCase(getMotorCalculationBreakdownByDetailID.fulfilled, (state, action) => {
  state.loading.fetchMotorCalculationBreakdown = false
  state.motorCalculationBreakdown = action.payload
})
builder.addCase(getMotorCalculationBreakdownByDetailID.rejected, (state, action) => {
  state.loading.fetchMotorCalculationBreakdown = false
  state.error.fetchMotorCalculationBreakdown = action.payload as string
  state.motorCalculationBreakdown = null
})

    // Incremental Fire Sections
    builder.addCase(addFireSection.pending, (state) => {
      state.loading = { ...state.loading, addFireSection: true }
      state.error = { ...state.error, addFireSection: null }
    })
    builder.addCase(addFireSection.fulfilled, (state) => {
      state.loading = { ...state.loading, addFireSection: false }
      state.success = { ...state.success, addFireSection: true }
    })
    builder.addCase(addFireSection.rejected, (state, action) => {
      state.loading = { ...state.loading, addFireSection: false }
      state.error = { ...state.error, addFireSection: action.payload as string }
    })

    builder.addCase(updateFireSection.pending, (state) => {
      state.loading = { ...state.loading, updateFireSection: true }
      state.error = { ...state.error, updateFireSection: null }
    })
    builder.addCase(updateFireSection.fulfilled, (state) => {
      state.loading = { ...state.loading, updateFireSection: false }
      state.success = { ...state.success, updateFireSection: true }
    })
    builder.addCase(updateFireSection.rejected, (state, action) => {
      state.loading = { ...state.loading, updateFireSection: false }
      state.error = { ...state.error, updateFireSection: action.payload as string }
    })

    builder.addCase(deleteFireSection.pending, (state) => {
      state.loading = { ...state.loading, deleteFireSection: true }
      state.error = { ...state.error, deleteFireSection: null }
    })
    builder.addCase(deleteFireSection.fulfilled, (state) => {
      state.loading = { ...state.loading, deleteFireSection: false }
      state.success = { ...state.success, deleteFireSection: true }
    })
    builder.addCase(deleteFireSection.rejected, (state, action) => {
      state.loading = { ...state.loading, deleteFireSection: false }
      state.error = { ...state.error, deleteFireSection: action.payload as string }
    })

    // Incremental Motor Vehicles
    builder.addCase(addMotorVehicleApi.pending, (state) => {
      state.loading = { ...state.loading, addMotorVehicle: true }
      state.error = { ...state.error, addMotorVehicle: null }
    })
    builder.addCase(addMotorVehicleApi.fulfilled, (state, action) => {
      state.loading = { ...state.loading, addMotorVehicle: false }
      state.currentMotorCalculation = action.payload
      state.success = { ...state.success, addMotorVehicle: true }
    })
    builder.addCase(addMotorVehicleApi.rejected, (state, action) => {
      state.loading = { ...state.loading, addMotorVehicle: false }
      state.error = { ...state.error, addMotorVehicle: action.payload as string }
    })

    builder.addCase(updateMotorVehicleApi.pending, (state) => {
      state.loading = { ...state.loading, updateMotorVehicle: true }
      state.error = { ...state.error, updateMotorVehicle: null }
    })
    builder.addCase(updateMotorVehicleApi.fulfilled, (state, action) => {
      state.loading = { ...state.loading, updateMotorVehicle: false }
      state.currentMotorCalculation = action.payload
      state.success = { ...state.success, updateMotorVehicle: true }
    })
    builder.addCase(updateMotorVehicleApi.rejected, (state, action) => {
      state.loading = { ...state.loading, updateMotorVehicle: false }
      state.error = { ...state.error, updateMotorVehicle: action.payload as string }
    })

    builder.addCase(deleteMotorVehicleApi.pending, (state) => {
      state.loading = { ...state.loading, deleteMotorVehicle: true }
      state.error = { ...state.error, deleteMotorVehicle: null }
    })
    builder.addCase(deleteMotorVehicleApi.fulfilled, (state, action) => {
      state.loading = { ...state.loading, deleteMotorVehicle: false }
      state.currentMotorCalculation = action.payload
      state.success = { ...state.success, deleteMotorVehicle: true }
    })
    builder.addCase(deleteMotorVehicleApi.rejected, (state, action) => {
      state.loading = { ...state.loading, deleteMotorVehicle: false }
      state.error = { ...state.error, deleteMotorVehicle: action.payload as string }
    })

    // Sections Summary
    builder.addCase(getSectionCalculationSummary.pending, (state) => {
      state.loading = { ...state.loading, fetchSectionsSummary: true }
      state.error = { ...state.error, fetchSectionsSummary: null }
    })
    builder.addCase(getSectionCalculationSummary.fulfilled, (state, action) => {
      state.loading = { ...state.loading, fetchSectionsSummary: false }
      state.sectionsSummary = action.payload
    })
    builder.addCase(getSectionCalculationSummary.rejected, (state, action) => {
      state.loading = { ...state.loading, fetchSectionsSummary: false }
      state.error = { ...state.error, fetchSectionsSummary: action.payload as string }
    })
  },
})

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  setSearchTerm,
  setActiveTab,
  setCurrentPolicy,
  setSelectedRiskFilter,
  setSections,
  setCurrentCalculation,
  setCalculationBreakdown,
  setCurrentMotorCalculation,
  setSectionsSummary,
  setMotorVehicles,
  addMotorVehicle,
  updateMotorVehicle,
  removeMotorVehicle,
  clearMessages,
} = underwritingSlice.actions

export default underwritingSlice.reducer