import {
  Activity,
  BarChart3,
  Bell,
  ChevronRight,
  DollarSign,
  Eye,
  FileText,
  Filter,
  Home,
  LogOut,
  Menu,
  Package,
  Search,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import NotificationDropdown from '../components/NotificationDropdown';
import RequestManagement from '../components/RequestManagement';
import UserDetails from '../components/UserDetails';
import useStaffSignalR from '../hooks/useStaffSignalR';
import { userAPI, UserRole, UserStatus, type GetUsersParams, type User } from '../lib/api/user';

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  
  // SignalR hook for real-time notifications
  const {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    keeperRegistrations,
    generalNotifications,
    clearKeeperRegistrations,
    clearGeneralNotifications,
    markAsRead
  } = useStaffSignalR();

  // User management states
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 1,
    pageSize: 10,
    totalPages: 1,
    totalCount: 0,
    hasPrevious: false,
    hasNext: false
  });
  
  // Filter states
  const [filters, setFilters] = useState<GetUsersParams>({
    pageIndex: 1,
    pageSize: 10
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize SignalR connection when component mounts
  useEffect(() => {
    let isMounted = true;
    
    // Set a demo token for testing (remove this in production)
    if (!localStorage.getItem('staff_token')) {
      localStorage.setItem('staff_token', 'demo-staff-token-for-testing');
      console.log('🔑 Demo authentication token set for testing');
    }
    
    const initializeSignalR = async () => {
      // Get staff ID from localStorage or your auth system
      const staffId = localStorage.getItem('staffId') || 'staff-001';
      
      // Avoid multiple connection attempts
      if (isConnected || !isMounted) {
        return;
      }
      
      try {
        const connected = await connect(staffId);
        if (connected && isMounted) {
          console.log('✅ Staff SignalR connected successfully');
        } else if (isMounted) {
          console.log('📱 Working in offline mode - backend server not available');
        }
      } catch (error) {
        if (isMounted) {
          console.error('❌ SignalR initialization error:', error);
        }
      }
    };

    // Add a small delay to avoid React StrictMode double execution issues
    const timer = setTimeout(initializeSignalR, 100);

    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(timer);
      // Note: We don't disconnect here as it causes issues in StrictMode
      // The service handles cleanup properly
    };
  }, []); // Remove connect/disconnect from deps to avoid re-execution

  // Separate effect for cleanup on unmount
  useEffect(() => {
    return () => {
      // Only disconnect when component is actually unmounting (not in StrictMode)
      setTimeout(() => {
        disconnect();
      }, 100);
    };
  }, [disconnect]);

  // Handle keeper registration notification click
  const handleKeeperRequestClick = (_requestId: string) => {
    setCurrentPage('request-management');
    setNotificationOpen(false);
    // You could also filter the requests page to show this specific request
  };

  // Load users when component mounts or filters change
  useEffect(() => {
    if (currentPage === 'list-user' && isConnected) {
      loadUsers();
    }
  }, [currentPage, filters, isConnected]);

  const loadUsers = async () => {
    // Check if backend is available and user is authenticated
    const token = localStorage.getItem('staff_token');
    if (!token || !isConnected) {
      console.log('⚠️ Cannot load users: No authentication token or backend unavailable');
      return;
    }

    try {
      setLoading(true);
      const response = await userAPI.getAllUsers(filters);
      
      if (response.data) {
        setUsers(response.data.data);
        setPagination({
          pageIndex: response.data.pageIndex,
          pageSize: response.data.pageSize,
          totalPages: response.data.totalPages,
          totalCount: response.data.totalCount,
          hasPrevious: response.data.hasPrevious,
          hasNext: response.data.hasNext
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      // Reset users if there's an authentication error
      if (error instanceof Error && error.message.includes('401')) {
        setUsers([]);
        console.log('🔒 Authentication required for user management');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setFilters(prev => ({
      ...prev,
      username: term || undefined,
      pageIndex: 1 // Reset to first page when searching
    }));
  };

  const handleRoleFilter = (role: keyof typeof UserRole | 'ALL') => {
    setFilters(prev => ({
      ...prev,
      role: role === 'ALL' ? undefined : UserRole[role],
      pageIndex: 1
    }));
  };

  const handleStatusFilter = (status: keyof typeof UserStatus | 'ALL') => {
    setFilters(prev => ({
      ...prev,
      status: status === 'ALL' ? undefined : UserStatus[status],
      pageIndex: 1
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      pageIndex: newPage
    }));
  };

  const toggleUserStatus = async (_user: User) => {
    try {
      setLoading(true);
      // Just reload user data to refresh the view
      await loadUsers();
    } catch (error) {
      console.error('Error reloading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-700';
      case 'STAFF': return 'bg-orange-100 text-orange-700';
      case 'KEEPER': return 'bg-blue-100 text-blue-700';
      case 'RENTER': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'BANNED': return 'bg-red-100 text-red-700';
      case 'INACTIVE': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { 
      id: 'user', 
      label: 'User', 
      icon: Users,
      submenu: [
        { id: 'list-user', label: 'List user' },
        { id: 'upgrade-request', label: 'Upgrade request' }
      ]
    },
    { 
      id: 'storage', 
      label: 'Storages', 
      icon: Package,
      submenu: [
        { id: 'list-storage', label: 'List storage' },
        { id: 'storage-request', label: 'Storage request' }
      ]
    },
    { 
      id: 'request', 
      label: 'Requests', 
      icon: Bell,
      submenu: [
        { id: 'request-management', label: 'All Requests' },
        { id: 'keeper-requests', label: 'Keeper Registrations' }
      ]
    },
    { id: 'order', label: 'Order', icon: FileText },
    { id: 'rating', label: 'Rating', icon: Activity },
    { 
      id: 'payout', 
      label: 'Payout', 
      icon: DollarSign,
      submenu: [
        { id: 'payout-request', label: 'Payout request' }
      ]
    }
  ];

  const [expandedMenus, setExpandedMenus] = useState(['user', 'storage', 'request', 'payout']);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleMenuClick = (menuId: string, submenuId?: string) => {
    if (submenuId) {
      setCurrentPage(submenuId);
    } else {
      setCurrentPage(menuId);
    }
  };

  const viewUserDetails = async (user: User) => {
    try {
      setLoading(true);
      const response = await userAPI.getUserDetail(user.id);
      
      if (response.data) {
        setSelectedUser(response.data);
        setCurrentPage('user-details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdated = (updatedUser: User) => {
    // Update the selected user state
    setSelectedUser(updatedUser);
    
    // Update the user in the users list as well
    setUsers(prevUsers => 
      prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u)
    );
  };

  const handleLogout = () => {
    // Show confirmation dialog
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
      try {
        // Disconnect SignalR connection
        disconnect();
        
        // Clear authentication token
        localStorage.removeItem('staff_token');
        localStorage.removeItem('staffId');

        // Clear user data
        setUsers([]);
        setSelectedUser(null);
        
        // Reset to dashboard page
        setCurrentPage('dashboard');
        
        console.log('🚪 User logged out successfully');
        
        // In a real app, you would redirect to login page
        // For now, just show an alert
        alert('Đăng xuất thành công! Trong ứng dụng thực tế, bạn sẽ được chuyển hướng đến trang đăng nhập.');
        
        // You could redirect to login page like this:
        // window.location.href = '/login';
      } catch (error) {
        console.error('Error during logout:', error);
        alert('Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gradient-to-b from-gray-900 to-gray-800 transition-all duration-300 shadow-2xl flex-shrink-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-gray-700">
            {sidebarOpen ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-white">PackPals</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => item.submenu ? toggleMenu(item.id) : handleMenuClick(item.id)}
                  className={`w-full flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} ${sidebarOpen ? 'px-4' : 'px-3'} py-3 rounded-xl transition-all duration-200 group
                    ${currentPage === item.id 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5" />
                    {sidebarOpen && <span className="font-medium">{item.label}</span>}
                  </div>
                  {sidebarOpen && item.submenu && (
                    <ChevronRight className={`w-4 h-4 transition-transform ${expandedMenus.includes(item.id) ? 'rotate-90' : ''}`} />
                  )}
                </button>
                
                {/* Submenu */}
                {sidebarOpen && item.submenu && expandedMenus.includes(item.id) && (
                  <div className="mt-2 ml-4 space-y-1">
                    {item.submenu.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => handleMenuClick(item.id, subItem.id)}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200
                          ${currentPage === subItem.id 
                            ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400' 
                            : 'text-gray-400 hover:bg-gray-700/30 hover:text-gray-200'
                          }`}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-700">
            <button 
              onClick={handleLogout}
              className={`w-full flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'} ${sidebarOpen ? 'px-4' : 'px-3'} py-3 text-gray-300 hover:bg-red-600/20 hover:text-red-400 rounded-xl transition-all duration-200`}
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-xl">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">
                {currentPage === 'dashboard' && 'Dashboard Overview'}
                {currentPage === 'list-user' && 'User Management'}
                {currentPage === 'user-details' && 'User Details'}
                {currentPage === 'upgrade-request' && 'Upgrade Requests'}
                {currentPage === 'list-storage' && 'Storage Management'}
                {currentPage === 'storage-request' && 'Storage Requests'}
                {currentPage === 'request-management' && 'Request Management'}
                {currentPage === 'keeper-requests' && 'Keeper Registration Requests'}
                {currentPage === 'order' && 'Order Management'}
                {currentPage === 'rating' && 'Rating Management'}
                {currentPage === 'payout-request' && 'Payout Requests'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:bg-white/30 transition-all"
                />
              </div>
              
              {/* Notifications */}
              <NotificationDropdown
                keeperRegistrations={keeperRegistrations}
                generalNotifications={generalNotifications}
                onMarkAsRead={markAsRead}
                onClearAll={(type) => {
                  if (type === 'keeper') {
                    clearKeeperRegistrations();
                  } else {
                    clearGeneralNotifications();
                  }
                }}
                onKeeperRequestClick={handleKeeperRequestClick}
                isOpen={notificationOpen}
                onToggle={() => setNotificationOpen(!notificationOpen)}
              />
              
              {/* SignalR Connection Status */}
              <div 
                className="flex items-center space-x-2 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-xl cursor-pointer"
                title={
                  isConnecting 
                    ? 'Đang kết nối đến dịch vụ thông báo...' 
                    : isConnected 
                      ? 'Thông báo thời gian thực đang hoạt động' 
                      : error 
                        ? `Lỗi kết nối: ${error}` 
                        : 'Đang hoạt động ở chế độ offline'
                }
              >
                <div className={`w-2 h-2 rounded-full ${
                  isConnecting 
                    ? 'bg-yellow-400 animate-pulse' 
                    : isConnected 
                      ? 'bg-green-400 animate-pulse' 
                      : 'bg-red-400'
                }`}></div>
                <span className="text-white/80 text-xs hidden md:block">
                  {isConnecting ? 'Đang kết nối...' : isConnected ? 'Trực tuyến' : 'Ngoại tuyến'}
                </span>
              </div>
              
              {/* User Profile */}
              <div className="flex items-center space-x-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {localStorage.getItem('staff_token') ? 'S' : 'G'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-white font-medium">
                    {localStorage.getItem('staff_token') ? 'Staff User' : 'Guest User'}
                  </p>
                  <p className="text-white/70 text-sm">
                    {localStorage.getItem('staff_token') ? 'staff@packpals.com' : 'Chưa đăng nhập'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Dashboard Page */}
          {currentPage === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-gray-500 text-sm mb-1">Total Users</h3>
                  <p className="text-3xl font-bold text-gray-800">1,234</p>
                  <p className="text-sm text-green-500 mt-2">+12% from last month</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-gray-500 text-sm mb-1">Total Revenue</h3>
                  <p className="text-3xl font-bold text-gray-800">$45,678</p>
                  <p className="text-sm text-green-500 mt-2">+8% from last month</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <Activity className="w-5 h-5 text-purple-500" />
                  </div>
                  <h3 className="text-gray-500 text-sm mb-1">Active Storage</h3>
                  <p className="text-3xl font-bold text-gray-800">892</p>
                  <p className="text-sm text-purple-500 mt-2">23 pending</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <Activity className="w-5 h-5 text-orange-500" />
                  </div>
                  <h3 className="text-gray-500 text-sm mb-1">Pending Requests</h3>
                  <p className="text-3xl font-bold text-gray-800">47</p>
                  <p className="text-sm text-orange-500 mt-2">Requires attention</p>
                </div>
              </div>

              {/* Chart Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Overview</h3>
                  <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-16 h-16 text-blue-500/30" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">User Growth</h3>
                  <div className="h-64 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-16 h-16 text-green-500/30" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User List Page */}
          {currentPage === 'list-user' && (
            <div className="space-y-6">
              {/* Offline Mode Notice */}
              {!isConnected && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    <div>
                      <h3 className="text-amber-800 font-medium">Đang hoạt động ở chế độ Offline</h3>
                      <p className="text-amber-600 text-sm">Quản lý người dùng yêu cầu kết nối backend. Vui lòng khởi động PackPals Backend (.NET) tại cổng 5000 để truy cập dữ liệu người dùng.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Authentication Notice */}
              {isConnected && !localStorage.getItem('staff_token') && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div>
                      <h3 className="text-blue-800 font-medium">Yêu cầu đăng nhập</h3>
                      <p className="text-blue-600 text-sm">Vui lòng đăng nhập để truy cập các tính năng quản lý người dùng. Click vào nút "Demo Login" để đăng nhập với tài khoản demo.</p>
                      <div className="mt-3 flex gap-3">
                        <button 
                          onClick={async () => {
                            try {
                              // Call demo token endpoint
                              const response = await fetch('http://localhost:5000/api/user/demo-token', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                              });
                              
                              if (response.ok) {
                                const data = await response.json();
                                const token = data.data?.accessToken;
                                
                                if (token) {
                                  localStorage.setItem('staff_token', token);
                                  localStorage.setItem('staffId', 'staff-001');
                                  alert('✅ Demo login thành công! Token đã được lưu.');
                                  window.location.reload();
                                } else {
                                  alert('❌ Token không hợp lệ trong response');
                                }
                              } else {
                                alert('❌ Failed to get demo token: ' + response.status);
                              }
                            } catch (error) {
                              console.error('❌ Demo login failed:', error);
                              alert('❌ Demo login failed: ' + error);
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Demo Login
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              const response = await userAPI.testConnection();
                              console.log('✅ Test connection result:', response);
                              alert('✅ Kết nối backend thành công!\n' + 
                                    `Message: ${response.message}\n` +
                                    `Status: ${response.statusCode}\n` +
                                    `Found ${response.data?.totalCount || 0} test users`);
                            } catch (error) {
                              console.error('❌ Test connection failed:', error);
                              alert('❌ Không thể kết nối backend:\n' + 
                                    (error instanceof Error ? error.message : 'Unknown error'));
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Test Connection
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Search and Filter Bar */}
              {isConnected && localStorage.getItem('staff_token') && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by username..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    {/* Role Filter */}
                    <select
                      onChange={(e) => handleRoleFilter(e.target.value as keyof typeof UserRole | 'ALL')}
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="ADMIN">Admin</option>
                      <option value="STAFF">Staff</option>
                      <option value="KEEPER">Keeper</option>
                      <option value="RENTER">Renter</option>
                    </select>
                    
                    {/* Status Filter */}
                    <select
                      onChange={(e) => handleStatusFilter(e.target.value as keyof typeof UserStatus | 'ALL')}
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ALL">All Status</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="BANNED">Banned</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={loadUsers}
                      disabled={loading}
                      className="px-4 py-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-xl transition-colors flex items-center space-x-2"
                    >
                      <Filter className="w-4 h-4" />
                      <span>{loading ? 'Loading...' : 'Refresh'}</span>
                    </button>
                  </div>
                </div>
              </div>
              )}

              {/* Table */}
              {isConnected && localStorage.getItem('staff_token') && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
                {/* Table Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                      All Users ({pagination.totalCount})
                    </h2>
                    <div className="text-sm text-gray-500">
                      Page {pagination.pageIndex} of {pagination.totalPages}
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                )}

                {/* Table Content */}
                {!loading && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                {user.avatarUrl ? (
                                  <img
                                    src={user.avatarUrl}
                                    alt={user.username}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold">{user.username[0]?.toUpperCase()}</span>
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-gray-900">{user.username}</div>
                                  <div className="text-sm text-gray-500">ID: {user.id.substring(0, 8)}...</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{user.email}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${getStatusColor(user.status || '')}`}>
                                {user.status === 'ACTIVE' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                                <span>{user.status || 'Unknown'}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => viewUserDetails(user)}
                                  disabled={loading}
                                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Empty State */}
                    {users.length === 0 && !loading && (
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                        <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Pagination */}
                {!loading && users.length > 0 && (
                  <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing {((pagination.pageIndex - 1) * pagination.pageSize) + 1} to {Math.min(pagination.pageIndex * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} users
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.pageIndex - 1)}
                        disabled={!pagination.hasPrevious}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-2 text-sm font-medium">
                        {pagination.pageIndex}
                      </span>
                      <button
                        onClick={() => handlePageChange(pagination.pageIndex + 1)}
                        disabled={!pagination.hasNext}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>
          )}

          {/* User Details Page */}
          {currentPage === 'user-details' && selectedUser && (
            <UserDetails 
              user={selectedUser}
              loading={loading}
              onBack={() => setCurrentPage('list-user')}
              onToggleStatus={toggleUserStatus}
              onUserUpdated={handleUserUpdated}
            />
          )}

          {/* Request Management Pages */}
          {(currentPage === 'request-management' || currentPage === 'keeper-requests') && (
            <RequestManagement 
              onBackToMain={() => setCurrentPage('dashboard')}
            />
          )}

          {/* Other Pages Placeholder */}
          {['upgrade-request', 'list-storage', 'storage-request', 'order', 'rating', 'payout-request'].includes(currentPage) && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-12 h-12 text-gray-500" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-2">Coming Soon</h3>
                <p className="text-gray-500">This page is under development</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}