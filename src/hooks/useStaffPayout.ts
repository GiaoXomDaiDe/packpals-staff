import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
    CompletePayoutRequest,
    PayoutRequest,
    ProcessPayoutRequest,
    UploadProofRequest
} from '../lib/api/payout';
import { staffPayoutAPI } from '../lib/api/payout';
import { toast } from '../utils/toast';

// Query keys
export const STAFF_PAYOUT_QUERY_KEYS = {
  all: ['staff-payout'] as const,
  requests: () => [...STAFF_PAYOUT_QUERY_KEYS.all, 'requests'] as const,
} as const;

/**
 * Hook to get all payout requests for staff
 */
export function useStaffPayoutRequests() {
  return useQuery({
    queryKey: STAFF_PAYOUT_QUERY_KEYS.requests(),
    queryFn: () => staffPayoutAPI.getAllPayoutRequests(),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

/**
 * Hook to start processing a payout request
 */
export function useStartProcessingPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ProcessPayoutRequest) => staffPayoutAPI.startProcessingPayout(request),
    onSuccess: (data: PayoutRequest) => {
      // Invalidate and refetch payout requests
      queryClient.invalidateQueries({ queryKey: STAFF_PAYOUT_QUERY_KEYS.requests() });
      
      console.log(`✅ Bắt đầu xử lý payout thành công: ${data.id.slice(0, 8)}... - ${data.amount.toLocaleString()} VND`);
    },
    onError: (error: Error) => {
      console.error('❌ Start processing payout failed:', error);
      toast.error('Lỗi xử lý payout', error.message || 'Không thể bắt đầu xử lý payout. Vui lòng thử lại.');
    },
  });
}

/**
 * Hook to upload bank transfer proof
 */
export function useUploadProof() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UploadProofRequest) => staffPayoutAPI.uploadProof(request),
    onSuccess: (data: PayoutRequest) => {
      // Invalidate and refetch payout requests
      queryClient.invalidateQueries({ queryKey: STAFF_PAYOUT_QUERY_KEYS.requests() });
      
      console.log(`📄 Upload chứng từ thành công: ${data.id.slice(0, 8)}...`);
    },
    onError: (error: Error) => {
      console.error('❌ Upload proof failed:', error);
      toast.error('Lỗi upload chứng từ', error.message || 'Không thể upload chứng từ. Vui lòng thử lại.');
    },
  });
}

/**
 * Hook to complete payout process
 */
export function useCompletePayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CompletePayoutRequest) => staffPayoutAPI.completePayout(request),
    onSuccess: (data: PayoutRequest) => {
      // Invalidate and refetch payout requests
      queryClient.invalidateQueries({ queryKey: STAFF_PAYOUT_QUERY_KEYS.requests() });
      
      console.log(`🎉 Hoàn thành payout thành công: ${data.id.slice(0, 8)}... - ${data.amount.toLocaleString()} VND`);
    },
    onError: (error: Error) => {
      console.error('❌ Complete payout failed:', error);
      toast.error('Lỗi hoàn thành payout', error.message || 'Không thể hoàn thành payout. Vui lòng thử lại.');
    },
  });
}

/**
 * Helper function to get status text in Vietnamese
 */
export function getPayoutStatusText(status: PayoutRequest['status']): string {
  switch (status) {
    case 'NOTPAID':
      return 'Chờ xử lý';
    case 'BUSY':
      return 'Đang xử lý';
    case 'PAID':
      return 'Đã thanh toán';
    default:
      return status;
  }
}

/**
 * Helper function to get status color
 */
export function getPayoutStatusColor(status: PayoutRequest['status']): string {
  switch (status) {
    case 'NOTPAID':
      return 'bg-yellow-100 text-yellow-800';
    case 'BUSY':
      return 'bg-blue-100 text-blue-800';
    case 'PAID':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Helper function to get next action text
 */
export function getNextActionText(status: PayoutRequest['status']): string {
  switch (status) {
    case 'NOTPAID':
      return 'Bắt đầu xử lý';
    case 'BUSY':
      return 'Upload chứng từ';
    case 'PAID':
      return 'Đã hoàn thành';
    default:
      return 'Không xác định';
  }
}

/**
 * Hook to invalidate payout queries (useful for SignalR updates)
 */
export function useInvalidateStaffPayoutQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateRequests: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_PAYOUT_QUERY_KEYS.requests() });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_PAYOUT_QUERY_KEYS.all });
    },
  };
}
