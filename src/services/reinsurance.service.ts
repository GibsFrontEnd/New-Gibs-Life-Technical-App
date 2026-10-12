//@ts-nocheck
// src/services/reinsurance.service.ts
import apiCall from '../utils/api-call';
import { 
  FacultativeInwardPolicy, 
  PaginatedResponse, 
  ReinsuranceFilterParams,
  CreateFacultativeInwardDto,
  UpdateFacultativeInwardDto 
} from '../types/reinsurance';

class ReinsuranceService {
  /**
   * Get all Facultative Inward policies with pagination and filtering
   */
  async getAllFacInPolicies(
    params: ReinsuranceFilterParams = {}
  ): Promise<PaginatedResponse<FacultativeInwardPolicy>> {
    try {
      const queryParams: Record<string, any> = {
        page: params.page || 1,
        pageSize: params.pageSize || 50,
        sortBy: params.sortBy || 'TransDate',
        sortDirection: params.sortDirection || 'DESC',
      };

      if (params.riskClass) queryParams.riskClass = params.riskClass;
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;
      if (params.status) queryParams.status = params.status;
      if (params.searchTerm) queryParams.searchTerm = params.searchTerm;

      const response = await apiCall.get('/ReinsuranceFacIn', { params: queryParams });
      
      // Normalize response structure
      if (Array.isArray(response.data)) {
        return {
          items: response.data,
          totalCount: response.data.length,
          page: queryParams.page,
          pageSize: queryParams.pageSize,
          totalPages: Math.ceil(response.data.length / queryParams.pageSize),
          hasNext: false,
          hasPrevious: false,
        };
      }

      return {
        items: response.data?.items || [],
        totalCount: response.data?.totalCount || response.data?.items?.length || 0,
        page: response.data?.page || queryParams.page,
        pageSize: response.data?.pageSize || queryParams.pageSize,
        totalPages: response.data?.totalPages || 1,
        hasNext: response.data?.hasNext || false,
        hasPrevious: response.data?.hasPrevious || false,
      };
    } catch (error) {
      console.error('Error fetching facultative inward policies:', error);
      throw error;
    }
  }

  /**
   * Get a single Facultative Inward policy by policy number
   */
  async getFacInPolicy(policyNo: string, classType?: string): Promise<FacultativeInwardPolicy> {
    try {
      const queryParams = classType ? `?classType=${classType}` : '';
      const url = `${this.baseUrl}/${policyNo}${queryParams}`;
      const response = await axios.get<FacultativeInwardPolicy>(url, {
        headers: { 'accept': 'text/plain' }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching policy ${policyNo}:`, error);
      throw error;
    }
  }

  /**
   * Create a new Facultative Inward policy
   */
  async createFacInPolicy(data: CreateFacultativeInwardDto): Promise<FacultativeInwardPolicy> {
    try {
      const response = await axios.post<FacultativeInwardPolicy>(this.baseUrl, data, {
        headers: {
          'accept': 'text/plain',
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating facultative inward policy:', error);
      throw error;
    }
  }

  /**
   * Update an existing Facultative Inward policy
   */
  async updateFacInPolicy(
    policyNo: string, 
    data: UpdateFacultativeInwardDto
  ): Promise<FacultativeInwardPolicy> {
    try {
      const response = await axios.put<FacultativeInwardPolicy>(
        `${this.baseUrl}/${policyNo}`, 
        data,
        {
          headers: {
            'accept': 'text/plain',
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating policy ${policyNo}:`, error);
      throw error;
    }
  }
}

export default new ReinsuranceService();