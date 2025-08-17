// Auth API for PackPals Staff Dashboard
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
export interface StaffLoginRequest {
    username: string;
    password: string;
}

export interface StaffUser {
    id: string;
    username: string;
    fullName: string;
    email: string;
    role: string;
    activeRole: string;
    roles: string[];
    status: string;
    avatarUrl?: string;
}

export interface StaffLoginResponse {
    success: boolean;
    data: {
        user: StaffUser;
        token: string;
    };
    message: string;
    statusCode: number;
}

class AuthAPI {
    async login(credentials: StaffLoginRequest): Promise<StaffLoginResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                },
                body: JSON.stringify({
                    email: credentials.username,
                    password: credentials.password,
                }),
            });

            const data = await response.json();

            if (response.ok && data.data) {
                // Parse user data from backend response
                const userData = data.data;
                const userRoles = userData.roles || [userData.role];
                
                // Check if user has STAFF or ADMIN role
                const hasStaffAccess = userRoles.includes('STAFF') || userRoles.includes('ADMIN');

                if (!hasStaffAccess) {
                    throw new Error('Bạn không có quyền truy cập hệ thống quản trị. Chỉ Staff và Admin mới được phép đăng nhập.');
                }

                return {
                    success: true,
                    data: {
                        user: {
                            id: userData.id,
                            username: userData.username || credentials.username,
                            fullName: userData.fullName || userData.username || credentials.username,
                            email: userData.email,
                            role: userData.activeRole || userData.role || 'STAFF',
                            activeRole: userData.activeRole || userData.role || 'STAFF',
                            roles: userRoles,
                            status: userData.status || 'ACTIVE',
                            avatarUrl: userData.avatarUrl,
                        },
                        token: userData.token || userData.tokenString || ''
                    },
                    message: data.message || 'Đăng nhập thành công',
                    statusCode: response.status
                };
            } else {
                throw new Error(data.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
            }
        } catch (error) {
            console.error('Login API Error:', error);
            
            // Throw original error or generic message
            throw new Error(error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
        }
    }

    async logout(): Promise<void> {
        try {
            // Clear localStorage
            localStorage.removeItem('staff_token');
            localStorage.removeItem('staff_user');
            
            // Optional: Call backend logout endpoint if available
            // const token = localStorage.getItem('staff_token');
            // if (token) {
            //     await fetch(`${API_BASE_URL}/auth/logout`, {
            //         method: 'POST',
            //         headers: {
            //             'Authorization': `Bearer ${token}`,
            //         },
            //     });
            // }
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear local storage even if API call fails
            localStorage.removeItem('staff_token');
            localStorage.removeItem('staff_user');
        }
    }

    async validateToken(token: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/validate`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }
}

export const authAPI = new AuthAPI();
