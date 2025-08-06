// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Constants
export const UserRole = {
  ADMIN: 0,
  RENTER: 1,
  KEEPER: 2,
  STAFF: 3
} as const

export const UserStatus = {
  ACTIVE: 1,
  INACTIVE: 2,
  BANNED: 3
} as const

export type UserRoleValue = typeof UserRole[keyof typeof UserRole]
export type UserStatusValue = typeof UserStatus[keyof typeof UserStatus]

// Types
export interface User {
  id: string
  email: string
  username: string
  phoneNumber?: string
  role: 'ADMIN' | 'RENTER' | 'KEEPER' | 'STAFF'
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | ''
  avatarUrl: string | null
  keeper?: {
    keeperId: string
    identityNumber?: string
    documents?: string
    bankAccount?: string
  } | null
  renter?: {
    renterId: string
  } | null
}

export interface GetUsersParams {
  role?: UserRoleValue
  username?: string
  pageIndex?: number
  pageSize?: number
  status?: UserStatusValue
}

export interface PaginatedResponse<T> {
  pageIndex: number
  totalPages: number
  pageSize: number
  totalCount: number
  hasPrevious: boolean
  hasNext: boolean
  data: T[]
}

export interface GetUsersResponse {
  data: PaginatedResponse<User>
  additionalData: any
  message: string
  statusCode: number
  code: string
}

class UserAPI {
  private baseUrl = `${API_BASE_URL}/api/user`

  async testConnection(): Promise<GetUsersResponse> {
    try {
      const url = `${this.baseUrl}/test`
      
      console.log('🔍 Testing connection to:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 404) {
          throw new Error('Backend server not available. Please start the PackPals Backend (.NET) service.')
        }
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Test connection successful:', result)
      
      // Transform the response to match expected format
      return {
        data: result.data,
        additionalData: result.additionalData || null,
        message: result.message || 'Test connection successful',
        statusCode: result.statusCode || 200,
        code: result.code || 'SUCCESS'
      }
    } catch (error) {
      console.error('❌ Test connection failed:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Failed to connect to backend service')
    }
  }

  async getAllUsers(params: GetUsersParams = {}): Promise<GetUsersResponse> {
    try {
      const token = localStorage.getItem('staff_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Build query string
      const queryParams = new URLSearchParams()
      
      if (params.role !== undefined) {
        queryParams.append('Role', params.role.toString())
      }
      if (params.username) {
        queryParams.append('Username', params.username)
      }
      if (params.pageIndex !== undefined) {
        queryParams.append('PageIndex', params.pageIndex.toString())
      }
      if (params.pageSize !== undefined) {
        queryParams.append('PageSize', params.pageSize.toString())
      }
      if (params.status !== undefined) {
        queryParams.append('Status', params.status.toString())
      }

      const url = `${this.baseUrl}/get-all${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          if (response.status === 404) {
            throw new Error('Backend server not available. Please start the PackPals Backend (.NET) service.')
          }
          if (response.status === 401) {
            throw new Error('Authentication required. Please log in first.')
          }
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        return data
      } catch (networkError) {
        // Handle network connectivity issues
        if (networkError instanceof TypeError && networkError.message.includes('fetch')) {
          throw new Error('Cannot connect to backend server. Please ensure the PackPals Backend (.NET) is running at http://localhost:5000')
        }
        throw networkError
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Failed to fetch users')
    }
  }

  async updateUserStatus(userId: string, status: UserStatusValue): Promise<any> {
    try {
      const token = localStorage.getItem('staff_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${this.baseUrl}/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          status
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating user status:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Failed to update user status')
    }
  }

  async getUserDetail(userId: string): Promise<any> {
    try {
      const token = localStorage.getItem('staff_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${this.baseUrl}/get-detail?userID=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching user detail:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Failed to fetch user detail')
    }
  }

  async banAccount(userId: string): Promise<any> {
    try {
      const token = localStorage.getItem('staff_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${this.baseUrl}/ban-account?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error banning user:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Failed to ban user')
    }
  }
}

export const userAPI = new UserAPI()
