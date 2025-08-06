// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export interface RequestQuery {
  type?: number;
  status?: number;
  username?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface Request {
  id: string;
  userId: string;
  type: string;
  status: string;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  username: string;
  requestData?: string; // JSON string
}

export interface RequestsResponse {
  data: Request[];
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface ApiResponse<T> {
  statusCode: number;
  code: string;
  data: T;
  message: string;
}

// Request Types
export const RequestType = {
  ROLECHANGE: 1,
  CREATESTORAGE: 2,
  DELETESTORAGE: 3,
  KEEPER_REGISTRATION: 4
} as const

// Request Status
export const RequestStatus = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3
} as const

export type RequestTypeValue = typeof RequestType[keyof typeof RequestType]
export type RequestStatusValue = typeof RequestStatus[keyof typeof RequestStatus]

export const requestAPI = {
  // Get all requests with filtering and pagination
  getAllRequests: async (query: RequestQuery): Promise<ApiResponse<RequestsResponse>> => {
    try {
      const token = localStorage.getItem('staff_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const params = new URLSearchParams();
      
      if (query.type !== undefined) params.append('type', query.type.toString());
      if (query.status !== undefined) params.append('status', query.status.toString());
      if (query.username) params.append('username', query.username);
      if (query.pageIndex !== undefined) params.append('pageIndex', query.pageIndex.toString());
      if (query.pageSize !== undefined) params.append('pageSize', query.pageSize.toString());

      const url = `${API_BASE_URL}/api/request${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching requests:', error);
      throw error;
    }
  },

  // Update request status (approve/reject)
  updateRequestStatus: async (
    requestId: string, 
    userId: string, 
    status: RequestStatusValue
  ): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('staff_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const url = `${API_BASE_URL}/api/request/changeStatus?requestId=${requestId}&userId=${userId}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(status)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  },

  // Get request by ID
  getRequestById: async (requestId: string): Promise<ApiResponse<Request>> => {
    try {
      const token = localStorage.getItem('staff_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const url = `${API_BASE_URL}/api/request/${requestId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching request by ID:', error);
      throw error;
    }
  }
};

// Helper functions
export const getRequestTypeLabel = (type: number): string => {
  switch (type) {
    case RequestType.ROLECHANGE:
      return 'Role Change';
    case RequestType.CREATESTORAGE:
      return 'Create Storage';
    case RequestType.DELETESTORAGE:
      return 'Delete Storage';
    case RequestType.KEEPER_REGISTRATION:
      return 'Keeper Registration';
    default:
      return 'Unknown';
  }
};

export const getRequestStatusLabel = (status: number): string => {
  switch (status) {
    case RequestStatus.PENDING:
      return 'Pending';
    case RequestStatus.APPROVED:
      return 'Approved';
    case RequestStatus.REJECTED:
      return 'Rejected';
    default:
      return 'Unknown';
  }
};

export const getRequestStatusColor = (status: number): string => {
  switch (status) {
    case RequestStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    case RequestStatus.APPROVED:
      return 'bg-green-100 text-green-800';
    case RequestStatus.REJECTED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
