// @ts-nocheck
// services/treatyExcessLossService.ts
import axios from 'axios';
import { 
  TreatyExcessLossDto, 
  CreateTreatyExcessLossDto, 
  UpdateTreatyExcessLossDto 
} from '../types/treatyExcessLoss';
import { SERVER_URL } from '@/utils/constants';

const TREATY_EXCESS_LOSS_API_BASE = `${SERVER_URL}/reinsurance-treaties/excess-loss`;

class TreatyExcessLossService {
  async getAll(): Promise<TreatyExcessLossDto[]> {
    try {
      const response = await axios.get(TREATY_EXCESS_LOSS_API_BASE, {
        headers: { 'accept': '*/*' }  // Changed from 'text/plain' to '*/*'
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching treaty excess loss records:', error);
      throw error;
    }
  }

  async getById(subriskId: string, underYr: number): Promise<TreatyExcessLossDto> {
    try {
      const response = await axios.get(`${TREATY_EXCESS_LOSS_API_BASE}/${subriskId}/${underYr}`, {
        headers: { 'accept': '*/*' }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching record for ${subriskId}/${underYr}:`, error);
      throw error;
    }
  }

  async create(data: CreateTreatyExcessLossDto): Promise<TreatyExcessLossDto> {
    try {
      const submitData = {
        ...data,
        submitBy: data.submitBy || "current_user",
        modifiedBy: data.modifiedBy || "current_user"
      };
      
      // FIXED: Use submitData instead of data
      const response = await axios.post(TREATY_EXCESS_LOSS_API_BASE, submitData, {
        headers: { 
          'Content-Type': 'application/json',
          'accept': '*/*'
        }
      });
      
      // Handle the "Created successfully" text response
      if (typeof response.data === 'string' && response.data.includes('Created successfully')) {
        // Fetch the newly created record
        const allRecords = await this.getAll();
        const newRecord = allRecords.find(r => 
          r.subriskID === data.subriskID && r.underYr === data.underYr
        );
        return newRecord || data as TreatyExcessLossDto;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating record:', error);
      throw error;
    }
  }

  async update(data: UpdateTreatyExcessLossDto): Promise<TreatyExcessLossDto> {
    try {
      // Note: PUT might still fail with 405
      const response = await axios.put(TREATY_EXCESS_LOSS_API_BASE, data, {
        headers: { 
          'Content-Type': 'application/json',
          'accept': '*/*'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  }

  async delete(subriskId: string, underYr: number): Promise<void> {
    try {
      await axios.delete(`${TREATY_EXCESS_LOSS_API_BASE}/${subriskId}/${underYr}`);
    } catch (error) {
      console.error(`Error deleting record ${subriskId}/${underYr}:`, error);
      throw error;
    }
  }
}

export const treatyExcessLossService = new TreatyExcessLossService();