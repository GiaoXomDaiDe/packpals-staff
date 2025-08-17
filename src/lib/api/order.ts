// Order API types and functions

export interface Order {
  id: string;
  packageDescription: string;
  totalAmount: number;
  serviceFee?: number; // Optional since API doesn't always return this
  status: string; // API returns string like "IN_STORAGE", "PENDING", etc.
  isPaid: boolean;
  orderDate: string; // API uses orderDate instead of createdAt
  renterId: string;
  storageId: string;
  renter?: {
    id: string;
    username: string;
    email: string;
    fullName?: string;
  } | null;
  storage?: {
    id: string;
    description: string;
    address: string;
    keeperId: string;
    keeper?: {
      id: string;
      username: string;
      email: string;
      fullName?: string;
    };
  } | null;
}

// Order Status Constants (matching backend enum)
export const OrderStatus = {
  PENDING: 0,    // Vừa tạo, chờ keeper confirm
  CONFIRMED: 1,  // Keeper đã xác nhận
  IN_STORAGE: 2, // Nhận được gói hàng và bắt đầu tính giờ
  COMPLETED: 3,  // Hoàn thành và đã thanh toán
  CANCELLED: 4   // Đã hủy
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

export interface OrderFilters {
  isPaid?: boolean;
  status?: number;
  pageIndex?: number;
  pageSize?: number;
  monthAndYear?: string; // Format: "MM/yyyy"
}

export interface OrdersResponse {
  data: Order[];
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
  additionalData?: {
    totalAmount: number;      // Tổng doanh thu từ orders đã completed
    platformIncome: number;   // 20% commission từ completed orders
  };
}

export const orderAPI = {
  // Get all orders with filters and revenue data
  getAllOrders: async (filters: OrderFilters = {}): Promise<{ 
    data: OrdersResponse; 
    additionalData?: {
      totalAmount: number;
      platformIncome: number;
    };
    message?: string 
  }> => {
    try {
      console.log('🔍 [ORDER API] Fetching orders with filters:', filters);
      
      const params = new URLSearchParams();
      
      if (filters.isPaid !== undefined) {
        params.append('IsPaid', filters.isPaid.toString());
      }
      if (filters.status !== undefined) {
        params.append('Status', filters.status.toString());
      }
      if (filters.pageIndex) {
        params.append('PageIndex', filters.pageIndex.toString());
      }
      if (filters.pageSize) {
        params.append('PageSize', filters.pageSize.toString());
      }
      if (filters.monthAndYear) {
        params.append('MonthAndYear', filters.monthAndYear);
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://packpal-api.up.railway.app/api';
      const token = localStorage.getItem('staff_token');
      
      const response = await fetch(`${apiBaseUrl}/order/all?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('✅ [ORDER API] Orders fetched successfully:', data);
      
      return {
        data: data.data || data,
        additionalData: data.additionalData,
        message: data.message || 'Orders fetched successfully'
      };
    } catch (error: any) {
      console.error('❌ [ORDER API] Error fetching orders:', error);
      
      // Return error instead of mock data
      throw new Error('Failed to fetch orders from backend');
    }
  }
};

// Helper functions
export const getOrderStatusText = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return 'Pending';
    case 'CONFIRMED':
      return 'Confirmed';
    case 'IN_STORAGE':
      return 'In Storage';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status; // Return the original status if not found
  }
};

export const getOrderStatusColor = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800';
    case 'IN_STORAGE':
      return 'bg-purple-100 text-purple-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
