// services/riskDistributionApi.ts
//@ts-nocheck
import { RiskDistribution, CreateRiskDistributionDto, UpdateRiskDistributionDto } from '../types/riskDistribution';
import { SERVER_URL } from "../utils/constants"

// Your SERVER_URL already includes '/api', so we just add '/RiskDistribution'
const API_ENDPOINT = `${SERVER_URL}/RiskDistribution`;

export const riskDistributionApi = {
  // Get all risk distributions
  getAll: async (): Promise<RiskDistribution[]> => {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'GET',
        headers: {
          'accept': 'text/plain',
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        console.error('❌ Response not OK:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const data: RiskDistribution[] = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get risk distribution by ID
  getById: async (id: number): Promise<RiskDistribution> => {
    try {
      const response = await fetch(`${API_ENDPOINT}/${id}`, {
        method: 'GET',
        headers: {
          'accept': 'text/plain',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: RiskDistribution = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching risk distribution with id ${id}:`, error);
      throw error;
    }
  },

  // Get risk distributions by subRisk ID
  getBySubRisk: async (subRiskId: string): Promise<RiskDistribution[]> => {
    try {
      const response = await fetch(`${API_ENDPOINT}/subrisk/${subRiskId}`, {
        method: 'GET',
        headers: {
          'accept': 'text/plain',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: RiskDistribution[] = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching risk distributions for subRisk ${subRiskId}:`, error);
      throw error;
    }
  },

  // Get risk distribution by subRisk ID and year
  getBySubRiskAndYear: async (subRiskId: string, underYr: string): Promise<RiskDistribution> => {
    try {
      const response = await fetch(`${API_ENDPOINT}/subrisk/${subRiskId}/year/${underYr}`, {
        method: 'GET',
        headers: {
          'accept': 'text/plain',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: RiskDistribution = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching risk distribution for ${subRiskId}/${underYr}:`, error);
      throw error;
    }
  },

  // Create new risk distribution - UPDATED with proper field mapping
  create: async (data: CreateRiskDistributionDto): Promise<RiskDistribution> => {
    try {
      // Transform to the field names the backend expects (capitalized)
      const transformedData = {
        SubRiskID: data.subRiskID,
        UnderYr: data.underYr,
        CessionRate: data.cessionRate,
        Retention: data.retention,
        Surplus1: data.surplus1,
        Surplus2: data.surplus2 || 0,
        LineNos: data.lineNos,
        Tag: data.tag || data.subRiskID,
        SubmitBy: data.submitBy || 'system',
        SubmitOn: data.submitOn || new Date().toISOString(),
        ModifiedBy: data.modifiedBy || data.submitBy || 'system',  // ← use real user
        ModifiedOn: new Date().toISOString(),
      };
      
      console.log('📤 Sending to backend (capitalized fields):', transformedData);
      
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'accept': 'text/plain',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Backend error response:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const newData: RiskDistribution = await response.json();
      console.log('✅ Created successfully:', newData);
      return newData;
    } catch (error) {
      console.error('Error creating risk distribution:', error);
      throw error;
    }
  },

  // Update risk distribution
  update: async (id: number, data: UpdateRiskDistributionDto): Promise<RiskDistribution> => {
    try {
      // Transform to capitalized fields for update as well
      const transformedData = {
        SubRiskID: data.subRiskID,
        UnderYr: data.underYr,
        CessionRate: data.cessionRate,
        Retention: data.retention,
        Surplus1: data.surplus1,
        Surplus2: data.surplus2,
        LineNos: data.lineNos,
        Tag: data.tag,
        ModifiedBy: data.modifiedBy,
        ModifiedOn: new Date().toISOString(),
      };
      
      const response = await fetch(`${API_ENDPOINT}/${id}`, {
        method: 'PUT',
        headers: {
          'accept': 'text/plain',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedData: RiskDistribution = await response.json();
      return updatedData;
    } catch (error) {
      console.error(`Error updating risk distribution with id ${id}:`, error);
      throw error;
    }
  },

  // Delete risk distribution
  delete: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_ENDPOINT}/${id}`, {
        method: 'DELETE',
        headers: {
          'accept': 'text/plain',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error deleting risk distribution with id ${id}:`, error);
      throw error;
    }
  },
};