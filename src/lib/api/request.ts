import { apiClient } from '../config/api.config';

// Request Types
export const RequestType = {
  KEEPER_REGISTRATION: "KEEPER_REGISTRATION",
  CREATESTORAGE: "CREATESTORAGE", 
  DELETESTORAGE: "DELETESTORAGE"
} as const;

// Storage Request Types (for filtering)
export const StorageRequestTypes = [
  RequestType.CREATESTORAGE,
  RequestType.DELETESTORAGE
] as const;

export const RequestStatus = {
  PENDING: 1,
  APPROVED: 2, 
  REJECTED: 3
} as const;

// For display purposes, we'll need string mappings
export const RequestStatusStrings = {
  1: "PENDING",
  2: "APPROVED", 
  3: "REJECTED"
} as const;

// Helper functions to convert between string and enum
export const RequestStatusHelper = {
  fromString: (status: string): RequestStatus => {
    switch (status) {
      case "PENDING": return RequestStatus.PENDING;
      case "APPROVED": return RequestStatus.APPROVED;
      case "REJECTED": return RequestStatus.REJECTED;
      default: return RequestStatus.PENDING;
    }
  },
  toString: (status: RequestStatus): string => {
    return RequestStatusStrings[status];
  }
};

export type RequestType = typeof RequestType[keyof typeof RequestType];
export type RequestStatus = typeof RequestStatus[keyof typeof RequestStatus];

// Request Interfaces
export interface RequestQuery {
  type?: RequestType;
  status?: RequestStatus;
  username?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface StorageRequestQuery {
  types?: RequestType[]; // Array of storage types
  status?: RequestStatus;
  username?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface Request {
  id: string;
  userId: string;
  type: RequestType;
  status: string; // Backend returns string like "PENDING", "APPROVED", "REJECTED" 
  data: string; // JSON string containing request-specific data
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reason?: string;
  username?: string; // Added from backend response
}

export interface KeeperRegistrationData {
  email: string;
  identityNumber: string;
  bankAccount: string;
  documentsUrl?: string;
}

export interface CreateStorageData {
  description: string;
  address: string;
  keeperId: string;
  latitude: number;
  longitude: number;
}

export interface DeleteStorageData {
  storageId: string;
  reason: string;
  keeperId: string;
}

export interface ChangeRequestStatusRequest {
  requestId: string;
  userId: string;
  status: RequestStatus;
  reason?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
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
  message: string;
  data?: T;
}

// Request API
export const requestAPI = {
  // Get all requests with filters
  async getAllRequests(query?: RequestQuery): Promise<ApiResponse<PaginatedResponse<Request>>> {
    console.log('🔄 [REQUEST API] Getting all requests with query:', query);
    
    const params = new URLSearchParams();
    if (query?.type !== undefined) params.append('type', query.type.toString());
    if (query?.status !== undefined) params.append('status', query.status.toString());
    if (query?.username) params.append('username', query.username);
    if (query?.pageIndex) params.append('pageIndex', query.pageIndex.toString());
    if (query?.pageSize) params.append('pageSize', query.pageSize.toString());

    const response = await apiClient.get(`/request?${params.toString()}`);
    
    console.log('✅ [REQUEST API] Get all requests response:', response.data);
    return response.data;
  },

  // Get specific request by ID
  async getRequestById(requestId: string): Promise<ApiResponse<Request>> {
    console.log('🔄 [REQUEST API] Getting request by ID:', requestId);
    
    const response = await apiClient.get(`/request/${requestId}`);
    
    console.log('✅ [REQUEST API] Get request by ID response:', response.data);
    return response.data;
  },

  // Change request status (approve/reject)
  async changeRequestStatus(request: ChangeRequestStatusRequest): Promise<ApiResponse<Request>> {
    try {
      console.log('🔄 [REQUEST API] Changing request status:', request);
      
      const response = await apiClient.put(`/request/changeStatus?requestId=${request.requestId}&userId=${request.userId}`, request.status);
      
      console.log('✅ [REQUEST API] Change request status response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [REQUEST API] Error changing request status:', error);
      throw error;
    }
  },

  // Get pending keeper registration requests (helper method)
  async getPendingKeeperRegistrations(query?: Omit<RequestQuery, 'type' | 'status'>): Promise<ApiResponse<PaginatedResponse<Request>>> {
    return this.getAllRequests({
      ...query,
      type: RequestType.KEEPER_REGISTRATION,
      status: RequestStatus.PENDING
    });
  },

  // Get pending storage creation requests (helper method)
  async getPendingStorageRequests(query?: Omit<RequestQuery, 'type' | 'status'>): Promise<ApiResponse<PaginatedResponse<Request>>> {
    return this.getAllRequests({
      ...query,
      type: RequestType.CREATESTORAGE,
      status: RequestStatus.PENDING
    });
  },

  // Get all storage requests (both create and delete)
  async getAllStorageRequests(query?: Omit<StorageRequestQuery, 'types'>): Promise<ApiResponse<PaginatedResponse<Request>>> {
    console.log('🔄 [REQUEST API] Getting all storage requests with query:', query);
    
    const params = new URLSearchParams();
    if (query?.status !== undefined) params.append('status', query.status.toString());
    if (query?.username) params.append('username', query.username);
    if (query?.pageIndex) params.append('pageIndex', query.pageIndex.toString());
    if (query?.pageSize) params.append('pageSize', query.pageSize.toString());
    
    // Add storage types filter
    StorageRequestTypes.forEach(type => {
      params.append('types', type);
    });

    const response = await apiClient.get(`/request?${params.toString()}`);
    
    console.log('✅ [REQUEST API] Get all storage requests response:', response.data);
    return response.data;
  }
};

export default requestAPI;
