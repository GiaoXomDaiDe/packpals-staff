import { useEffect, useState } from 'react';
import { Login } from './components/Login';
import { NotificationProvider } from './context/NotificationProvider';
import { ToastProvider } from './context/ToastProvider';
import { authAPI, type StaffUser } from './lib/api/auth';
import Dashboard from './pages/Dashboard';

function App() {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('staff_token');
        const userData = localStorage.getItem('staff_user');
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          
          // Validate stored user has proper staff access
          const hasStaffAccess = parsedUser.roles?.includes('STAFF') || 
                                parsedUser.roles?.includes('ADMIN') ||
                                parsedUser.role === 'STAFF' || 
                                parsedUser.role === 'ADMIN';
          
          if (!hasStaffAccess) {
            console.warn('Stored user does not have staff access');
            localStorage.removeItem('staff_token');
            localStorage.removeItem('staff_user');
            return;
          }

          // Optional: Validate token with backend
          // const isValidToken = await authAPI.validateToken(token);
          // if (!isValidToken) {
          //   localStorage.removeItem('staff_token');
          //   localStorage.removeItem('staff_user');
          //   return;
          // }

          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid data
        localStorage.removeItem('staff_token');
        localStorage.removeItem('staff_user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleLogin = async (userData: StaffUser, token: string) => {
    // Verify user has staff access
    const hasStaffAccess = userData.roles?.includes('STAFF') || 
                          userData.roles?.includes('ADMIN') ||
                          userData.role === 'STAFF' || 
                          userData.role === 'ADMIN';

    if (!hasStaffAccess) {
      throw new Error('Bạn không có quyền truy cập hệ thống quản trị');
    }

    // Store auth data
    localStorage.setItem('staff_token', token);
    localStorage.setItem('staff_user', JSON.stringify(userData));
    
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang khởi tạo ứng dụng...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Authenticated - show dashboard
  return (
    <ToastProvider>
      <NotificationProvider>
        <Dashboard user={user} onLogout={handleLogout} />
      </NotificationProvider>
    </ToastProvider>
  );
}

export default App;
