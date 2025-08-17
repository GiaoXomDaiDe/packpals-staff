import {
  DollarSign,
  Eye,
  Filter,
  Package,
  RefreshCw,
  TrendingUp,
  Users,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  type Order,
  type OrderFilters,
  OrderStatus,
  getOrderStatusColor,
  getOrderStatusText,
  orderAPI
} from '../lib/api/order';
import Pagination from './shared/Pagination';
import SummaryStats, { type StatCard } from './shared/SummaryStats';

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'offline' | 'unknown'>('unknown');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [businessMetrics, setBusinessMetrics] = useState<{
    totalRevenue: number;
    platformIncome: number;
    totalOrders: number;
    paidOrdersCount: number;
  }>({ 
    totalRevenue: 0, 
    platformIncome: 0,
    totalOrders: 0,
    paidOrdersCount: 0
  });
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    pageIndex: 1,
    pageSize: 10,
    totalPages: 1,
    totalCount: 0,
    hasPrevious: false,
    hasNext: false
  });

  // Filter states
  const [filters, setFilters] = useState<OrderFilters>({
    pageIndex: 1,
    pageSize: 10
  });
  const [statusFilter, setStatusFilter] = useState<'ALL' | string>('ALL');
  const [paidFilter, setPaidFilter] = useState<'ALL' | boolean>('ALL');
  const [monthYearFilter, setMonthYearFilter] = useState('');

  // Load business metrics with specific queries for accurate business data
  const loadBusinessMetrics = async () => {
    try {
      setMetricsLoading(true);
      
      // Get completed & paid orders for business revenue
      const completedPaidResponse = await orderAPI.getAllOrders({
        isPaid: true,
        status: 3, // COMPLETED status
        pageSize: 1000 // Get all completed paid orders for accurate revenue calculation
      });

      // Get all orders for total count and ratio calculation
      const allOrdersResponse = await orderAPI.getAllOrders({
        pageSize: 1000 // Get a large page to get total count
      });

      const completedPaidData = completedPaidResponse.additionalData;
      const totalOrders = allOrdersResponse.data?.totalCount || 0;
      
      // Calculate paid orders count from current orders data
      const paidOrdersCount = allOrdersResponse.data?.data?.filter(order => order.isPaid).length || 0;

      setBusinessMetrics({
        totalRevenue: completedPaidData?.totalAmount || 0,
        platformIncome: completedPaidData?.platformIncome || 0,
        totalOrders: totalOrders,
        paidOrdersCount: paidOrdersCount
      });

    } catch (error) {
      console.error('Failed to load business metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      const response = await orderAPI.getAllOrders(filters);
      
      // Update connection status based on response
      if (response.message?.includes('Backend offline') || response.message?.includes('Mock data')) {
        setConnectionStatus('offline');
      } else {
        setConnectionStatus('connected');
      }
      
      if (response.data) {
        console.log('Loaded orders:', response.data.data);
        setOrders(response.data.data);
        setPagination({
          pageIndex: response.data.pageIndex,
          pageSize: response.data.pageSize,
          totalPages: response.data.totalPages,
          totalCount: response.data.totalCount,
          hasPrevious: response.data.hasPrevious,
          hasNext: response.data.hasNext
        });

        // Load business metrics separately for accurate business data
        loadBusinessMetrics();

        // Update revenue data from current orders response (for display consistency)
        if (response.additionalData) {
          console.log('Revenue data found:', response.additionalData);
        } else {
          console.warn('⚠️ [ORDER API] No additionalData found in response');
        }
      } else {
        console.warn('⚠️ [ORDER API] No data received from orders API');
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      setConnectionStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  // Load orders when component mounts or filters change
  useEffect(() => {
    loadOrders();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load business metrics when component mounts
  useEffect(() => {
    loadBusinessMetrics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status === 'ALL' ? 'ALL' : status);
    setFilters((prev: OrderFilters) => ({
      ...prev,
      status: status === 'ALL' ? undefined : OrderStatus[status as keyof typeof OrderStatus],
      pageIndex: 1
    }));
  };

  const handlePaidFilter = (paid: string) => {
    const newPaid = paid === 'ALL' ? 'ALL' : paid === 'true';
    setPaidFilter(newPaid);
    setFilters((prev: OrderFilters) => ({
      ...prev,
      isPaid: newPaid === 'ALL' ? undefined : newPaid as boolean,
      pageIndex: 1
    }));
  };

  const handleMonthYearFilter = (monthYear: string) => {
    setMonthYearFilter(monthYear);
    setFilters((prev: OrderFilters) => ({
      ...prev,
      monthAndYear: monthYear || undefined,
      pageIndex: 1
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev: OrderFilters) => ({
      ...prev,
      pageIndex: newPage
    }));
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const formatCurrency = (amount: number) => {
    console.log('Formatting currency for amount:', amount);
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  console.log('Current business metrics state:', businessMetrics);

  // Prepare stats cards for SummaryStats component
  const statsCards: StatCard[] = [
    {
      label: 'Total Revenue',
      value: formatCurrency(businessMetrics.totalRevenue),
      description: 'From completed paid orders',
      icon: TrendingUp,
      bgColor: 'bg-white border border-gray-100',
      textColor: 'text-gray-900',
      iconColor: 'text-green-600',
      loading: metricsLoading
    },
    {
      label: 'Platform Income (20%)',
      value: formatCurrency(businessMetrics.platformIncome),
      description: 'Commission from completed orders',
      icon: DollarSign,
      bgColor: 'bg-white border border-gray-100',
      textColor: 'text-gray-900',
      iconColor: 'text-blue-600',
      loading: metricsLoading
    },
    {
      label: 'Total Orders',
      value: businessMetrics.totalOrders,
      description: 'All orders in system',
      icon: Package,
      bgColor: 'bg-white border border-gray-100',
      textColor: 'text-gray-900',
      iconColor: 'text-purple-600',
      loading: metricsLoading
    },
    {
      label: 'Paid Orders',
      value: `${businessMetrics.paidOrdersCount}/${businessMetrics.totalOrders}`,
      description: 'Paid vs total orders',
      icon: Users,
      bgColor: 'bg-white border border-gray-100',
      textColor: 'text-gray-900',
      iconColor: 'text-orange-600',
      loading: metricsLoading
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
          <p className="text-gray-600 mt-1">Manage all orders and view revenue metrics</p>
        </div>
        <button
          onClick={loadOrders}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

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
            onClick={loadOrders}
            className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-lg text-sm hover:bg-yellow-300 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Revenue Summary Cards */}
      <SummaryStats stats={statsCards} columns={4} />
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_STORAGE">In Storage</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
            <select
              value={paidFilter.toString()}
              onChange={(e) => handlePaidFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Payment Status</option>
              <option value="true">Paid</option>
              <option value="false">Unpaid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month & Year</label>
            <input
              type="month"
              value={monthYearFilter}
              onChange={(e) => handleMonthYearFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button 
              onClick={() => {
                setStatusFilter('ALL');
                setPaidFilter('ALL');
                setMonthYearFilter('');
                setFilters({
                  pageIndex: 1,
                  pageSize: 10
                });
              }}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              All Orders ({pagination.totalCount})
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Package</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 font-mono text-sm">
                            {order.id}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="font-medium text-gray-900 truncate">
                          {order.packageDescription}
                        </div>
                        {order.storage && (
                          <div className="text-sm text-gray-500 truncate">
                            {order.storage.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.isPaid 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {order.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {orders.length === 0 && !loading && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && orders.length > 0 && (
          <Pagination
            currentPage={pagination.pageIndex}
            totalPages={pagination.totalPages}
            totalCount={pagination.totalCount}
            pageSize={pagination.pageSize}
            onPageChange={handlePageChange}
            loading={loading}
            itemName="orders"
          />
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/85 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Order Details</h3>
                  <p className="text-blue-100 text-sm">{selectedOrder.id}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Order Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Package:</span>
                      <span className="font-medium">{selectedOrder.packageDescription}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold">{formatCurrency(selectedOrder.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded text-sm ${getOrderStatusColor(selectedOrder.status)}`}>
                        {getOrderStatusText(selectedOrder.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment:</span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        selectedOrder.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedOrder.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Timestamps</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Date:</span>
                      <span className="font-medium">{new Date(selectedOrder.orderDate).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Renter Information */}
              {selectedOrder.renter && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h4 className="font-medium text-green-900 mb-3 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Renter Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-700">Name:</span>
                      <span className="font-medium text-green-900">
                        {selectedOrder.renter.fullName || selectedOrder.renter.username}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Email:</span>
                      <span className="font-medium text-green-900">{selectedOrder.renter.email}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Storage Information */}
              {selectedOrder.storage && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Storage Information
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-purple-700">Description:</span>
                      <p className="font-medium text-purple-900 mt-1">{selectedOrder.storage.description}</p>
                    </div>
                    <div>
                      <span className="text-purple-700">Address:</span>
                      <p className="font-medium text-purple-900 mt-1">{selectedOrder.storage.address}</p>
                    </div>
                    {selectedOrder.storage.keeper && (
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <h5 className="font-medium text-purple-900 mb-2">Keeper</h5>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-purple-700">Name:</span>
                            <span className="font-medium text-purple-900">
                              {selectedOrder.storage.keeper.fullName || selectedOrder.storage.keeper.username}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-purple-700">Email:</span>
                            <span className="font-medium text-purple-900">{selectedOrder.storage.keeper.email}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
