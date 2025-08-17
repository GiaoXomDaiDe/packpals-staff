// Staff Payout API for PackPals Staff Dashboard
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
export interface PayoutRequest {
  id: string;
  orderId: string;
  userId: string;
  keeperId: string;
  transactionId: string;
  amount: number;
  status: 'NOTPAID' | 'BUSY' | 'PAID';
  createdAt: string;
  updatedAt?: string;
  imageUrl?: string; // Note: API returns imageUrl not imageURL
  keeper?: {
    username: string;
    email: string;
    bankAccount: string;
    fullName: string;
  };
  order?: {
    id: string;
    totalAmount: number;
    serviceFee: number;
    isPaid: boolean;
    packageDescription: string;
    renter?: {
      username: string;
      email: string;
    };
    storage?: {
      description: string;
      address: string;
      keeper?: {
        username: string;
        email: string;
        bankAccount?: string;
      };
    };
  };
}

export interface StaffApiResponse<T> {
  data: T;
  additionalData?: any;
  message?: string;
  statusCode: number;
  code: string;
}

export interface ProcessPayoutRequest {
  payoutId: string;
  staffId: string;
}

export interface UploadProofRequest {
  payoutId: string;
  imageFile: File;
}

export interface CompletePayoutRequest {
  payoutId: string;
  transactionCode: string;
  description: string;
}

class StaffPayoutAPI {
  private async getAuthHeaders() {
    const token = localStorage.getItem('staff_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get all payout requests for staff processing
   */
  async getAllPayoutRequests(): Promise<PayoutRequest[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/payout/requests`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: StaffApiResponse<{ data: PayoutRequest[], pageIndex: number, totalCount: number }> = await response.json();
      
      // Check if response is successful based on statusCode
      if (result.statusCode === 200 && result.data) {
        return result.data.data; // Return the actual array from data.data
      } else {
        throw new Error(result.message || result.code || 'Failed to fetch payout requests');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error');
    }
  }

  /**
   * Start processing a payout request
   */
  async startProcessingPayout(request: ProcessPayoutRequest): Promise<PayoutRequest> {
    try {
      const response = await fetch(`${API_BASE_URL}/payout/${request.payoutId}/start-processing`, {
        method: 'PATCH',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ staffId: request.staffId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: StaffApiResponse<PayoutRequest> = await response.json();
      
      if (result.statusCode === 200 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || result.code || 'Failed to start processing payout');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error');
    }
  }

  /**
   * Upload bank transfer proof image
   */
  async uploadProof(request: UploadProofRequest): Promise<PayoutRequest> {
    try {
      const formData = new FormData();
      formData.append('payoutId', request.payoutId);
      formData.append('proofImage', request.imageFile);

      const token = localStorage.getItem('staff_token');
      const response = await fetch(`${API_BASE_URL}/payout/upload-proof`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: StaffApiResponse<PayoutRequest> = await response.json();
      
      if (result.statusCode === 200 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || result.code || 'Failed to upload proof');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error');
    }
  }

  /**
   * Complete payout process
   */
  async completePayout(request: CompletePayoutRequest): Promise<PayoutRequest> {
    try {
      const response = await fetch(`${API_BASE_URL}/payout/complete-payout/${request.payoutId}`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(request.transactionCode),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: StaffApiResponse<PayoutRequest> = await response.json();
      
      if (result.statusCode === 200 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || result.code || 'Failed to complete payout');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error');
    }
  }
}

export const staffPayoutAPI = new StaffPayoutAPI();
