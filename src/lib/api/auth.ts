// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export interface StaffLoginRequest {
    username: string
    password: string
}

export interface StaffLoginResponse {
    success: boolean
    data: {
        user: {
            id: string
            username: string
            fullName: string
            email: string
            role: string
        }
        token: string
    }
    message: string
}

export interface ApiError {
    success: false
    message: string
    code?: string
}

class AuthAPI {
    private baseUrl = `${API_BASE_URL}/api/auth`

    async login(credentials: StaffLoginRequest): Promise<StaffLoginResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: credentials.username, // Backend expects email field
                    password: credentials.password,
                }),
            })

            if (!response.ok) {
                // Try to parse error response
                try {
                    const errorData = await response.json()
                    throw new Error(errorData.message || 'Đăng nhập thất bại')
                } catch (parseError) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                }
            }

            const data = await response.json()
            console.log('Login response:', JSON.stringify(data, null, 2))

            // Backend trả về response với cấu trúc: { data: { tokenString, id, email, role, expiresInMilliseconds }, message, statusCode, code }
            if (data && data.data && data.data.tokenString && data.data.id) {
                const tokenData = data.data
                
                // Kiểm tra xem user có phải là STAFF hoặc ADMIN không (ADMIN cũng có thể truy cập Staff panel)
                if (tokenData.role !== 'STAFF' && tokenData.role !== 'ADMIN') {
                    throw new Error('Bạn không có quyền truy cập hệ thống Staff')
                }

                return {
                    success: true,
                    data: {
                        user: {
                            id: tokenData.id,
                            username: credentials.username,
                            fullName: tokenData.email || credentials.username, // Backend chưa có fullName
                            email: tokenData.email || credentials.username,
                            role: tokenData.role
                        },
                        token: tokenData.tokenString
                    },
                    message: data.message || 'Đăng nhập thành công'
                }
            }

            throw new Error('Invalid response format')
        } catch (error) {
            if (error instanceof Error) {
                throw error
            }
            throw new Error('Không thể kết nối đến server')
        }
    }

    async logout(): Promise<{ success: boolean }> {
        try {
            // Clear local storage or perform logout API call if needed
            localStorage.removeItem('staff_token')
            localStorage.removeItem('staff_user')
            
            return { success: true }
        } catch (error) {
            throw new Error('Đăng xuất thất bại')
        }
    }

    async verifyToken(token: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            })

            return response.ok
        } catch (error) {
            return false
        }
    }
}

export const authAPI = new AuthAPI()
