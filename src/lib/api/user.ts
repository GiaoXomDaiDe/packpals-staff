// User types and constants based on backend
export const UserRole = {
  ADMIN: 0,
  STAFF: 1, 
  KEEPER: 2,
  RENTER: 3
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 1,
  INACTIVE: 2,
  BANNED: 3
} as const;

export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

// Match backend UserViewModel
export interface User {
  id: string;
  email: string;
  username: string;
  roles: string[];
  activeRole: string;
  status: string;
  avatarUrl?: string;
}

// Match backend UserDetailModel  
export interface UserDetail {
  id: string;
  email: string;
  username: string;
  phoneNumber: string;
  roles: string[];
  activeRole: string;
  status: string;
  avatarUrl?: string;
  keeper?: {
    keeperId: string;
    identityNumber: string;
    documents: string;
    bankAccount: string;
  };
  renter?: {
    renterId: string;
  };
}

// Match backend UserQuery
export interface GetUsersParams {
  role?: number; // 0=ADMIN, 1=STAFF, 2=KEEPER, 3=RENTER
  username?: string;
  pageIndex?: number;
  pageSize?: number;
  status?: number; // 1=ACTIVE, 2=INACTIVE, 3=BANNED
}

// Match backend PagingModel
export interface PaginatedResponse<T> {
  pageIndex: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
  data: T[];
}

// Match backend BaseResponseModel
export interface ApiResponse<T> {
  data: T;
  additionalData?: any;
  message?: string;
  statusCode: number;
  code: string;
}

// API functions matching backend endpoints
export const userAPI = {
  // Helper function to get auth headers
  getAuthHeaders: (): HeadersInit => {
    const token = localStorage.getItem('staff_token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  },

  // Helper function to get API base URL
  getApiBaseUrl: (): string => {
    return import.meta.env.VITE_API_BASE_URL || 'https://packpal-api.up.railway.app/api';
  },

  // Test API connection
  testConnection: async (): Promise<{ connected: boolean; message: string }> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(`${userAPI.getApiBaseUrl().replace('/api', '')}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        return { connected: true, message: 'Backend API is available' };
      } else {
        return { connected: false, message: `Backend returned ${response.status}` };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return { connected: false, message: 'Connection timeout' };
      }
      return { connected: false, message: 'Backend is offline' };
    }
  },

  getAllUsers: async (params: GetUsersParams): Promise<ApiResponse<PaginatedResponse<User>>> => {
    // Real implementation using fetch with timeout and retry
    const queryParams = new URLSearchParams();
    
    if (params.role !== undefined) queryParams.append('role', params.role.toString());
    if (params.username) queryParams.append('username', params.username);
    if (params.pageIndex) queryParams.append('pageIndex', params.pageIndex.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.status !== undefined) queryParams.append('status', params.status.toString());

    const apiUrl = `${userAPI.getApiBaseUrl()}/user/get-all?${queryParams}`;
    
    // Try real API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      console.log('🌐 [API] Attempting to connect to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: userAPI.getAuthHeaders(),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('✅ [API] Successfully connected to backend');
      
      return {
        data: data.data || data, // Handle backend response structure - data.data contains the paginated response
        statusCode: response.status,
        code: data.code || (response.ok ? 'SUCCESS' : 'ERROR'),
        message: data.message
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Log the specific error type and re-throw
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn('⏰ [API] Request timeout');
          throw new Error('Request timeout - please try again');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_TIMED_OUT')) {
          console.warn('🔌 [API] Connection failed - backend might be offline');
          throw new Error('Unable to connect to server - please check your connection');
        } else {
          console.error('❌ [API] Unexpected error:', error.message);
          throw error;
        }
      } else {
        console.error('❌ [API] Unknown error:', error);
        throw new Error('An unexpected error occurred');
      }
    }
  },

  getUserDetail: async (userId: string): Promise<ApiResponse<UserDetail>> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      console.log('🔍 [API] Fetching user detail for:', userId);
      
      const response = await fetch(`${userAPI.getApiBaseUrl()}/user/get-detail?userId=${userId}`, {
        method: 'GET',
        signal: controller.signal,
        headers: userAPI.getAuthHeaders(),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('✅ [API] User detail fetched successfully');
      
      return {
        data: data.data || data,
        statusCode: response.status,
        code: data.code || (response.ok ? 'SUCCESS' : 'ERROR'),
        message: data.message
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn('⏰ [API] User detail request timeout');
          throw new Error('Request timeout - please try again');
        } else {
          console.warn('🔌 [API] User detail fetch failed');
          throw error;
        }
      } else {
        throw new Error('Failed to fetch user details');
      }
    }
  },

  banUser: async (userId: string): Promise<ApiResponse<string>> => {
    try {
      const response = await fetch(`${userAPI.getApiBaseUrl()}/user/ban-account?userId=${userId}`, {
        method: 'DELETE',
        headers: userAPI.getAuthHeaders(),
      });

      const data = await response.json();
      
      return {
        data: data.data || 'User banned successfully',
        statusCode: response.status,
        code: data.code || (response.ok ? 'SUCCESS' : 'ERROR'),
        message: data.message || 'Account banned successfully!'
      };
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  registerKeeper: async (keeperData: {
    userId: string;
    email: string;
    identityNumber: string;
    bankAccount: string;
    documentsUrl: string;
  }): Promise<ApiResponse<string>> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for registration

    try {
      console.log('🔄 [API] Registering keeper with data:', keeperData);
      
      const response = await fetch(`${userAPI.getApiBaseUrl()}/user/register-keeper-from-request`, {
        method: 'POST',
        signal: controller.signal,
        headers: userAPI.getAuthHeaders(),
        body: JSON.stringify(keeperData)
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('✅ [API] Keeper registered successfully');
      
      return {
        data: data.data || 'Keeper registered successfully',
        statusCode: response.status,
        code: data.code || (response.ok ? 'SUCCESS' : 'ERROR'),
        message: data.message || 'Keeper registration completed!'
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn('⏰ [API] Keeper registration timeout');
          throw new Error('Registration timeout - please try again');
        } else {
          console.error('❌ [API] Keeper registration failed:', error.message);
          throw error;
        }
      } else {
        console.error('❌ [API] Unknown error during keeper registration:', error);
        throw new Error('Registration failed');
      }
    }
  }
};
