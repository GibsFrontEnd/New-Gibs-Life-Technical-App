//@ts-nocheck
import { 
    TreatyProportion, 
    TreatyProportionApiResult,
    TreatyProportionBulkOperationResult 
} from '../types/treaty-proportion.types';
import { SERVER_URL } from '@/utils/constants';

// FIXED: Use correct API endpoint
const TREATY_PROPORTION_API_BASE = `${SERVER_URL}/reinsurance-treaties/proportions`;

// Add auth headers helper
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Accept': '*/*',
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

class TreatyProportionService {
    private async handleResponse<T>(response: Response): Promise<TreatyProportionApiResult<T>> {
        const timestamp = new Date().toISOString();

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            let errorDetails;

            try {
                const errorBody = await response.json();
                errorMessage = errorBody.message || errorBody.title || errorMessage;
                errorDetails = errorBody;
            } catch {
                try {
                    errorMessage = await response.text();
                } catch {
                    // Fallback
                }
            }

            return {
                success: false,
                error: {
                    code: `HTTP_${response.status}`,
                    message: errorMessage,
                    details: errorDetails,
                    status: response.status,
                    timestamp,
                },
                status: response.status,
                timestamp,
            };
        }

        try {
            const data = await response.json();
            return {
                success: true,
                data: data as T,
                status: response.status,
                timestamp,
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'PARSE_ERROR',
                    message: 'Failed to parse response data',
                    details: error instanceof Error ? { message: error.message } : undefined,
                    status: response.status,
                    timestamp,
                },
                status: response.status,
                timestamp,
            };
        }
    }

   // In treaty-proportion.service.ts, update getAllTreatyProportions:

async getAllTreatyProportions(): Promise<TreatyProportionApiResult<TreatyProportion[]>> {
    try {
        
        const response = await fetch(TREATY_PROPORTION_API_BASE, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        
        
        // Check if response is JSON
        const text = await response.text();
    
        
        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON! Response is not JSON:', e);
            return {
                success: false,
                error: {
                    code: 'PARSE_ERROR',
                    message: 'Response is not JSON. You might need to login.',
                    status: response.status,
                    timestamp: new Date().toISOString(),
                },
                status: response.status,
                timestamp: new Date().toISOString(),
            };
        }
        
        return {
            success: true,
            data: data,
            status: response.status,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Network error:', error);
        return {
            success: false,
            error: {
                code: 'NETWORK_ERROR',
                message: error instanceof Error ? error.message : 'Network request failed',
                status: 0,
                timestamp: new Date().toISOString(),
            },
            status: 0,
            timestamp: new Date().toISOString(),
        };
    }
}

    async getTreatyProportionById(subriskId: string, underYr: number): Promise<TreatyProportionApiResult<TreatyProportion>> {
        try {
            const response = await fetch(`${TREATY_PROPORTION_API_BASE}/${subriskId}/${underYr}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });
            return this.handleResponse<TreatyProportion>(response);
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'NETWORK_ERROR',
                    message: error instanceof Error ? error.message : 'Network request failed',
                    status: 0,
                    timestamp: new Date().toISOString(),
                },
                status: 0,
                timestamp: new Date().toISOString(),
            };
        }
    }

    async createTreatyProportion(data: Omit<TreatyProportion, 'propID' | 'submitOn' | 'modifiedOn'>): Promise<TreatyProportionApiResult<TreatyProportion>> {
        try {
            const now = new Date().toISOString();
            const currentUser = localStorage.getItem('username') || 'system';
            
            const payload = {
                ...data,
                submitBy: data.submitBy || currentUser,
                modifiedBy: data.modifiedBy || currentUser,
                submitOn: now,
                modifiedOn: now,
                propID: 0,
            };

            const response = await fetch(TREATY_PROPORTION_API_BASE, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });
            return this.handleResponse<TreatyProportion>(response);
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'NETWORK_ERROR',
                    message: error instanceof Error ? error.message : 'Network request failed',
                    status: 0,
                    timestamp: new Date().toISOString(),
                },
                status: 0,
                timestamp: new Date().toISOString(),
            };
        }
    }

    async updateTreatyProportion(data: TreatyProportion): Promise<TreatyProportionApiResult<TreatyProportion>> {
        try {
            const currentUser = localStorage.getItem('username') || 'system';
            
            const payload = {
                ...data,
                modifiedBy: currentUser,
                modifiedOn: new Date().toISOString(),
            };

            const response = await fetch(TREATY_PROPORTION_API_BASE, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });
            return this.handleResponse<TreatyProportion>(response);
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'NETWORK_ERROR',
                    message: error instanceof Error ? error.message : 'Network request failed',
                    status: 0,
                    timestamp: new Date().toISOString(),
                },
                status: 0,
                timestamp: new Date().toISOString(),
            };
        }
    }

    async deleteTreatyProportion(subriskId: string, underYr: number): Promise<TreatyProportionApiResult<void>> {
        try {
            const response = await fetch(`${TREATY_PROPORTION_API_BASE}/${subriskId}/${underYr}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            return this.handleResponse<void>(response);
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'NETWORK_ERROR',
                    message: error instanceof Error ? error.message : 'Network request failed',
                    status: 0,
                    timestamp: new Date().toISOString(),
                },
                status: 0,
                timestamp: new Date().toISOString(),
            };
        }
    }

    async bulkInsertTreatyProportions(data: Omit<TreatyProportion, 'propID' | 'submitOn' | 'modifiedOn'>[]): Promise<TreatyProportionApiResult<TreatyProportionBulkOperationResult>> {
        try {
            const now = new Date().toISOString();
            const currentUser = localStorage.getItem('username') || 'system';
            
            const payload = data.map(item => ({
                ...item,
                submitBy: currentUser,
                modifiedBy: currentUser,
                submitOn: now,
                modifiedOn: now,
                propID: 0,
            }));

            const response = await fetch(`${TREATY_PROPORTION_API_BASE}/bulk`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });
            return this.handleResponse<TreatyProportionBulkOperationResult>(response);
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'NETWORK_ERROR',
                    message: error instanceof Error ? error.message : 'Network request failed',
                    status: 0,
                    timestamp: new Date().toISOString(),
                },
                status: 0,
                timestamp: new Date().toISOString(),
            };
        }
    }

    async bulkUpdateTreatyProportions(data: TreatyProportion[]): Promise<TreatyProportionApiResult<TreatyProportionBulkOperationResult>> {
        try {
            const currentUser = localStorage.getItem('username') || 'system';
            
            const payload = data.map(item => ({
                ...item,
                modifiedBy: currentUser,
                modifiedOn: new Date().toISOString(),
            }));

            const response = await fetch(`${TREATY_PROPORTION_API_BASE}/bulk`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });
            return this.handleResponse<TreatyProportionBulkOperationResult>(response);
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'NETWORK_ERROR',
                    message: error instanceof Error ? error.message : 'Network request failed',
                    status: 0,
                    timestamp: new Date().toISOString(),
                },
                status: 0,
                timestamp: new Date().toISOString(),
            };
        }
    }
}

export const treatyProportionService = new TreatyProportionService();