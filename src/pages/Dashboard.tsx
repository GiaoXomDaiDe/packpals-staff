import {
  Bell,
  ChevronRight,
  DollarSign,
  Eye,
  Filter,
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
import { useEffect, useRef, useState } from 'react';
import OrderManagement from '../components/OrderManagement';
import PayoutManagement from '../components/PayoutManagement';
import RequestManagement from '../components/RequestManagement';
import UserDetails from '../components/UserDetails';
import { useStaffSignalR } from '../hooks/useStaffSignalR';
import { RequestStatus, RequestType } from '../lib/api/request';
import { userAPI, UserRole, UserStatus, type GetUsersParams, type User, type UserDetail } from '../lib/api/user';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [currentPage, setCurrentPage] = useState('list-user');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  
  // SignalR for real-time notifications
  const {
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
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
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'offline' | 'unknown'>('unknown');

  const handleNotificationClick = (notification: any) => {
    console.log('🔔 [NOTIFICATION] Notification clicked:', notification);

    // Mark notification as read
    markAsRead();
    
    // Navigate based on notification type
    if (notification.type === 'KEEPER_REGISTRATION') {
      setCurrentPage('upgrade-request');
      setNotificationDropdownOpen(false);
    } else if (notification.type === 'KEEPER_REGISTRATION_REQUEST') {
      setCurrentPage('upgrade-request');
      setNotificationDropdownOpen(false);
    } else if (notification.type === 'CREATESTORAGE') {
      setCurrentPage('storage-request');
      setNotificationDropdownOpen(false);
    } else if (notification.type === 'CREATE_STORAGE_REQUEST') {
      setCurrentPage('storage-request');
      setNotificationDropdownOpen(false);
    } else if (notification.type === 'DELETE_STORAGE_REQUEST') {
      setCurrentPage('storage-request');
      setNotificationDropdownOpen(false);
    } else if (notification.type === 'PAYOUT_REQUEST') {
      setCurrentPage('payout-request');
      setNotificationDropdownOpen(false);
    }
  };

  const toggleNotificationDropdown = () => {
    setNotificationDropdownOpen(!notificationDropdownOpen);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'KEEPER_REGISTRATION':
      case 'KEEPER_REGISTRATION_REQUEST':
        return '👤';
      case 'CREATESTORAGE':
      case 'CREATE_STORAGE_REQUEST':
        return '🏠';
      case 'DELETE_STORAGE_REQUEST':
        return '�️';
      case 'PAYOUT_REQUEST':
        return '💰';
      default:
        return '📢';
    }
  };

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'KEEPER_REGISTRATION':
      case 'KEEPER_REGISTRATION_REQUEST':
        return 'New Keeper Registration';
      case 'CREATESTORAGE':
      case 'CREATE_STORAGE_REQUEST':
        return 'New Storage Creation';
      case 'DELETE_STORAGE_REQUEST':
        return 'New Storage Deletion';
      case 'PAYOUT_REQUEST':
        return 'Payout Request';
      default:
        return 'Notification';
    }
  };


  // Handle click outside notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setNotificationDropdownOpen(false);
      }
    };

    if (notificationDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationDropdownOpen]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const response = await userAPI.getAllUsers(filters)
      
      // Update connection status based on response
      if (response.message?.includes('Backend offline') || response.message?.includes('Mock data')) {
        setConnectionStatus('offline');
      } else {
        setConnectionStatus('connected');
      }
      
      
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
      } else {
        console.warn('⚠️ [API DEBUG] No data received from users API');
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  // Load users when component mounts or filters change
  useEffect(() => {
    loadUsers();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load users on initial mount
  useEffect(() => {
    loadUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (term: string) => {
    
    setSearchTerm(term);
    const newFilters = {
      ...filters,
      username: term || undefined,
      pageIndex: 1 // Reset to first page when searching
    };
  
    setFilters(newFilters);
  };

  const handleRoleFilter = (role: string) => {
    
    setFilters((prev: GetUsersParams) => {
      const newFilters = {
        ...prev,
        role: role === 'ALL' ? undefined : UserRole[role as keyof typeof UserRole],
        pageIndex: 1
      };
      return newFilters;
    });
  };

  const handleStatusFilter = (status: string) => {
    setFilters((prev: GetUsersParams) => {
      const newFilters = {
        ...prev,
        status: status === 'ALL' ? undefined : UserStatus[status as keyof typeof UserStatus],
        pageIndex: 1
      };
      return newFilters;
    });
  };

  const handlePageChange = (newPage: number) => {
    
    setFilters((prev: GetUsersParams) => {
      const newFilters = {
        ...prev,
        pageIndex: newPage
      };
      return newFilters;
    });
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
        { id: 'storage-request', label: 'Storage request' }
      ]
    },
    { 
      id: 'order', 
      label: 'Orders', 
      icon: TrendingUp,
      submenu: [
        { id: 'order-management', label: 'Order management' }
      ]
    },
    { 
      id: 'payout', 
      label: 'Payout', 
      icon: DollarSign,
      submenu: [
        { id: 'payout-request', label: 'Payout request' }
      ]
    }
  ];

  const [expandedMenus, setExpandedMenus] = useState(['user', 'storage', 'order', 'payout']);

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
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
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
              onClick={onLogout}
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
                {currentPage === 'list-user' && 'User Management'}
                {currentPage === 'user-details' && 'User Details'}
                {currentPage === 'upgrade-request' && 'Upgrade Requests'}
                {currentPage === 'storage-request' && 'Storage Requests'}
                {currentPage === 'order-management' && 'Order Management'}
                {currentPage === 'payout-request' && 'Payout Requests'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications Dropdown */}
              <div className="relative" ref={notificationDropdownRef}>
                <button 
                  onClick={toggleNotificationDropdown}
                  className="relative p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all"
                  title={`${unreadCount} unread notifications`}
                >
                  <Bell className="w-5 h-5 text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notificationDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                    {/* Dropdown Header */}
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">Notifications</h3>
                      <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                            {unreadCount}
                          </span>
                        )}
                        <button
                          onClick={() => setNotificationDropdownOpen(false)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No new notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.slice(0, 10).map((notification, index) => (
                            <button
                              key={index}
                              onClick={() => handleNotificationClick(notification)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-start space-x-3">
                                <div className="text-lg flex-shrink-0 mt-0.5">
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-medium text-gray-900 text-sm truncate">
                                      {getNotificationTitle(notification.type)}
                                    </h4>
                                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                      {new Date(notification.timestamp).toLocaleTimeString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  {notification.data?.Username && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      User: {notification.data.Username}
                                    </p>
                                  )}
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Dropdown Footer */}
                    {notifications.length > 0 && (
                      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                        <button
                          onClick={() => {
                            clearNotifications();
                            setNotificationDropdownOpen(false);
                          }}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Clear all
                        </button>
                        <button
                          onClick={() => {
                            markAsRead();
                            setNotificationDropdownOpen(false);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Mark all read
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            
              
              {/* User Profile */}
              <div className="flex items-center space-x-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {user?.fullName?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-white font-medium">{user?.fullName || user?.username || 'Staff User'}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Connection Status Banner */}
          {connectionStatus === 'offline' && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center space-x-3">
              <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-yellow-800 text-xs">!</span>
              </div>
              <div className="flex-1">
                <h4 className="text-yellow-800 font-medium">Development Mode</h4>
                <p className="text-yellow-700 text-sm">
                  Backend API không khả dụng. Đang sử dụng mock data để phát triển.
                </p>
              </div>
              <button 
                onClick={loadUsers}
                className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-lg text-sm hover:bg-yellow-300 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
          
          {/* User List Page */}
          {currentPage === 'list-user' && (
            <div className="space-y-6">
              {/* Search and Filter Bar */}
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
                      onChange={(e) => handleRoleFilter(e.target.value)}
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
                      onChange={(e) => handleStatusFilter(e.target.value)}
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

              {/* Table */}
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
                                  <div className="text-sm text-gray-500 font-mono">ID: {user.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{user.email}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.activeRole)}`}>
                                {user.activeRole}
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
            </div>
          )}

          {/* User Details Page */}
          {currentPage === 'user-details' && selectedUser && (
            <UserDetails 
              user={selectedUser}
              onBack={() => setCurrentPage('list-user')}
            />
          )}

          {/* Upgrade Request Page - Chỉ cho KEEPER_REGISTRATION */}
          {currentPage === 'upgrade-request' && (
            <RequestManagement 
              user={user}
              initialTypeFilter={RequestType.KEEPER_REGISTRATION}
              initialStatusFilter={RequestStatus.PENDING}
            />
          )}

          {/* Storage Request Page - Chỉ cho CREATESTORAGE requests */}
          {currentPage === 'storage-request' && (
            <RequestManagement 
              user={user}
              initialTypeFilter="STORAGE"
              initialStatusFilter={RequestStatus.PENDING}
            />
          )}

          {/* Order Management Page */}
          {currentPage === 'order-management' && (
            <OrderManagement />
          )}

          {/* Payout Request Page */}
          {currentPage === 'payout-request' && (
            <PayoutManagement />
          )}
        </main>
      </div>
    </div>
  );
}