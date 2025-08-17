import { AlertCircle, Check, Clock, CreditCard, Eye, Loader2, RefreshCw, User, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastProvider';
import {
  getPayoutStatusColor,
  getPayoutStatusText,
  useCompletePayout,
  useStaffPayoutRequests,
  useStartProcessingPayout,
  useUploadProof
} from '../hooks/useStaffPayout';
import type { PayoutRequest } from '../lib/api/payout';
import { formatBankAccount, formatCurrency, parseBankAccount } from '../utils/bankUtils';
import Pagination from './shared/Pagination';
import SummaryStats from './shared/SummaryStats';

const PayoutManagement: React.FC = () => {
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NOTPAID' | 'BUSY' | 'PAID'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [processingPayoutId, setProcessingPayoutId] = useState<string | null>(null);

  // Queries and mutations
  const { data: payoutResponse, isLoading, error, refetch } = useStaffPayoutRequests(currentPage, pageSize);
  const payoutRequests = payoutResponse?.data || [];
  const totalCount = payoutResponse?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startProcessingMutation = useStartProcessingPayout();
  const uploadProofMutation = useUploadProof();
  const completePayoutMutation = useCompletePayout();
  const { success, error: showError } = useToast();

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Filter and sort payouts based on status with smart positioning for recently processed items
  const filteredPayouts = payoutRequests?.filter(payout => {
    if (statusFilter === 'ALL') return true;
    return payout.status === statusFilter;
  }).sort((a, b) => {
    // If one of the items was recently processed, keep it in a stable position
    if (processingPayoutId) {
      if (a.id === processingPayoutId) return -1; // Keep processed item at current position
      if (b.id === processingPayoutId) return 1;
    }
    
    // Priority sorting: BUSY (processing) > NOTPAID > PAID
    const statusPriority = { 'BUSY': 0, 'NOTPAID': 1, 'PAID': 2 };
    const aPriority = statusPriority[a.status] ?? 3;
    const bPriority = statusPriority[b.status] ?? 3;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // If same status, sort by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }) || [];

  const payoutStats = {
    notPaid: payoutRequests?.filter(p => p.status === 'NOTPAID').length || 0,
    busy: payoutRequests?.filter(p => p.status === 'BUSY').length || 0,
    paid: payoutRequests?.filter(p => p.status === 'PAID').length || 0,
  };

  const handleStartProcessing = async (payout: PayoutRequest) => {
    if (!confirm(`Bạn có chắc muốn bắt đầu xử lý payout ${payout.id.slice(0, 8)}...?`)) {
      return;
    }

    // Track which payout is being processed to maintain its position
    setProcessingPayoutId(payout.id);

    try {
      const staffId = localStorage.getItem('staff_id') || '';
      await startProcessingMutation.mutateAsync({
        payoutId: payout.id,
        staffId: staffId,
      });
      
      // Keep the processed item visible by maintaining sort order
      // React Query will handle the refresh via onSuccess
    } catch (error) {
      console.error('Error starting processing:', error);
    } finally {
      // Clear processing state after a short delay to maintain smooth UX
      setTimeout(() => setProcessingPayoutId(null), 1000);
    }
  };

  const handleUploadProof = async () => {
    if (!uploadFile || !selectedPayout) {
      showError('Lỗi', 'Vui lòng chọn file chứng từ');
      return;
    }

    try {
      await uploadProofMutation.mutateAsync({
        payoutId: selectedPayout.id,
        imageFile: uploadFile,
      });
      
      // Close upload modal and automatically open complete modal
      setShowUploadModal(false);
      setUploadFile(null);
      // Keep selectedPayout to open complete modal
      setShowCompleteModal(true);
    } catch (error) {
      console.error('Error uploading proof:', error);
    }
  };

  const handleCompletePayout = async () => {
    if (!selectedPayout) {
      showError('Lỗi', 'Không tìm thấy payout request');
      return;
    }

    try {
      await completePayoutMutation.mutateAsync({
        payoutId: selectedPayout.id,
        transactionCode: `AUTO_${Date.now()}`, // Auto-generated transaction code
        description: description.trim() || 'Payout completed',
      });
      
      // Close modal immediately - React Query will handle the refresh via onSuccess
      setShowCompleteModal(false);
      setDescription('');
      setSelectedPayout(null);
      
      success('Thành công', 'Payout đã được hoàn thành');
    } catch (error) {
      console.error('Error completing payout:', error);
    }
  };

  const openUploadModal = (payout: PayoutRequest) => {
    setSelectedPayout(payout);
    setShowUploadModal(true);
  };

  const viewPayoutDetails = (payout: PayoutRequest) => {
    setSelectedPayout(payout);
    setShowDetailsModal(true);
  };

  const openCompleteModal = (payout: PayoutRequest) => {
    setSelectedPayout(payout);
    setShowCompleteModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="text-red-800 font-semibold">Lỗi tải dữ liệu</h3>
            <p className="text-red-600 text-sm mt-1">{(error as Error).message}</p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payout Management</h2>
          <p className="text-gray-600 mt-1">Process payout requests from keepers</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Stats */}
      <SummaryStats 
        stats={[
          {
            label: 'Not Paid',
            value: payoutStats.notPaid,
            description: 'Pending requests',
            icon: Clock,
            bgColor: 'bg-white border border-gray-100',
            textColor: 'text-gray-900',
            iconColor: 'text-yellow-600'
          },
          {
            label: 'Processing',
            value: payoutStats.busy,
            description: 'In progress',
            icon: CreditCard,
            bgColor: 'bg-white border border-gray-100',
            textColor: 'text-gray-900',
            iconColor: 'text-blue-600'
          },
          {
            label: 'Completed',
            value: payoutStats.paid,
            description: 'Successfully paid',
            icon: Check,
            bgColor: 'bg-white border border-gray-100',
            textColor: 'text-gray-900',
            iconColor: 'text-green-600'
          }
        ]} 
        columns={3} 
      />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'NOTPAID' | 'BUSY' | 'PAID')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="NOTPAID">Not Paid</option>
              <option value="BUSY">Processing</option>
              <option value="PAID">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payout Requests Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {!payoutRequests || payoutRequests.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No payout requests found</p>
              <p className="text-gray-500 text-sm mt-1">New requests will appear here</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Payout Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayouts.map((payout) => (
                  <tr 
                    key={payout.id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      processingPayoutId === payout.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 font-mono text-sm">
                            {payout.id}
                          </div>
                          <div className="text-sm text-gray-500">
                            Order: <span className="font-mono">{payout.orderId}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(payout.createdAt).toLocaleString('vi-VN')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          {payout.keeper ? (
                            <>
                              <div className="font-medium text-gray-900">
                                {payout.keeper.username || payout.keeper.fullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {payout.keeper.email}
                              </div>
                              {payout.keeper.bankAccount && (
                                (() => {
                                  const parsed = parseBankAccount(payout.keeper.bankAccount);
                                  if (parsed) {
                                    return (
                                      <div className="text-xs text-gray-500">
                                        <div className="font-mono">
                                          {formatBankAccount(parsed.accountNumber)}
                                        </div>
                                        <div className="text-blue-600">
                                          {parsed.bankName}
                                        </div>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div className="text-xs text-gray-400 font-mono">
                                      {payout.keeper.bankAccount}
                                    </div>
                                  );
                                })()
                              )}
                            </>
                          ) : (
                            <>
                              <div className="font-medium text-gray-900 font-mono text-sm">
                                {payout.userId}
                              </div>
                              <div className="text-sm text-gray-500">User ID</div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(payout.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPayoutStatusColor(payout.status)}`}>
                        {getPayoutStatusText(payout.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {/* View Details Button */}
                        <button
                          onClick={() => viewPayoutDetails(payout)}
                          className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Action buttons based on status */}
                        {payout.status === 'NOTPAID' && (
                          <button
                            onClick={() => handleStartProcessing(payout)}
                            disabled={startProcessingMutation.isPending}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                            title="Start Processing"
                          >
                            {startProcessingMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                          </button>
                        )}

                        {payout.status === 'BUSY' && !payout.imageUrl && (
                          <button
                            onClick={() => openUploadModal(payout)}
                            className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                            title="Upload Proof"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                        )}

                        {payout.status === 'BUSY' && payout.imageUrl && (
                          <button
                            onClick={() => openCompleteModal(payout)}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                            title="Complete Payout"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}

                        {payout.status === 'PAID' && (
                          <span className="text-green-600 font-medium text-sm">✅ Completed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              loading={false}
              itemName="payouts"
            />
          </div>
        )}
      </div>

      {/* Upload Proof Modal */}
      {showUploadModal && selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Upload Proof</h3>
                  <p className="text-orange-100 text-sm">
                    {formatCurrency(selectedPayout.amount)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setSelectedPayout(null);
                  }}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <AlertCircle className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Proof Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleUploadProof}
                  disabled={!uploadFile || uploadProofMutation.isPending}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-all duration-200 font-medium"
                >
                  {uploadProofMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Upload</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setSelectedPayout(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Payout Modal */}
      {showCompleteModal && selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Complete Payout</h3>
                  <p className="text-green-100 text-sm">
                    {formatCurrency(selectedPayout.amount)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCompleteModal(false);
                    setDescription('');
                    setSelectedPayout(null);
                  }}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <AlertCircle className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Additional notes"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleCompletePayout}
                  disabled={completePayoutMutation.isPending}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all duration-200 font-medium"
                >
                  {completePayoutMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Complete</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowCompleteModal(false);
                    setDescription('');
                    setSelectedPayout(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout Details Modal */}
      {showDetailsModal && selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Payout Details</h3>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedPayout.status === 'NOTPAID' ? 'bg-yellow-100 text-yellow-800' :
                      selectedPayout.status === 'BUSY' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {getPayoutStatusText(selectedPayout.status)}
                    </span>
                  </div>
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
              {/* Basic Payout Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Payout ID</span>
                  <span className="font-mono text-gray-900">{selectedPayout.id}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-semibold text-lg text-gray-900">{formatCurrency(selectedPayout.amount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Created</span>
                  <span className="font-medium">{new Date(selectedPayout.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                {selectedPayout.updatedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Updated</span>
                    <span className="font-medium">{new Date(selectedPayout.updatedAt).toLocaleString('vi-VN')}</span>
                  </div>
                )}
              </div>

              {/* Keeper Information */}
              {(selectedPayout.keeper || selectedPayout.order?.storage?.keeper) && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-medium text-blue-900 mb-3">Keeper Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700 text-sm">Name</span>
                      <span className="font-medium text-blue-900">
                        {selectedPayout.keeper?.fullName || selectedPayout.keeper?.username || selectedPayout.order?.storage?.keeper?.username}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700 text-sm">Email</span>
                      <span className="font-medium text-blue-900">
                        {selectedPayout.keeper?.email || selectedPayout.order?.storage?.keeper?.email}
                      </span>
                    </div>
                    {(selectedPayout.keeper?.bankAccount || selectedPayout.order?.storage?.keeper?.bankAccount) && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-700 text-sm">Bank Account</span>
                          {(() => {
                            const bankAccount = selectedPayout.keeper?.bankAccount || selectedPayout.order?.storage?.keeper?.bankAccount;
                            if (!bankAccount) return null;
                            const parsed = parseBankAccount(bankAccount);
                            if (parsed) {
                              return (
                                <div className="text-right">
                                  <div className="font-mono text-blue-900">
                                    {formatBankAccount(parsed.accountNumber)}
                                  </div>
                                  <div className="text-xs text-blue-600">
                                    {parsed.bankName}
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <span className="font-mono text-blue-900">{bankAccount}</span>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Information */}
              {selectedPayout.order && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Order Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Order ID</span>
                      <span className="font-mono text-gray-900">{selectedPayout.order.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Total Amount</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedPayout.order.totalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Service Fee</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedPayout.order.serviceFee)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Package</span>
                      <span className="font-medium text-gray-900">{selectedPayout.order.packageDescription}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Payment Status</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedPayout.order.isPaid 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedPayout.order.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Renter Information */}
              {selectedPayout.order?.renter && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h4 className="font-medium text-green-900 mb-3">Renter Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-green-700 text-sm">Name</span>
                      <span className="font-medium text-green-900">{selectedPayout.order.renter.username}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-green-700 text-sm">Email</span>
                      <span className="font-medium text-green-900">{selectedPayout.order.renter.email}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Storage Information */}
              {selectedPayout.order?.storage && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <h4 className="font-medium text-purple-900 mb-3">Storage Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-purple-700 text-sm">Description</span>
                      <p className="font-medium text-purple-900 mt-1">{selectedPayout.order.storage.description}</p>
                    </div>
                    <div>
                      <span className="text-purple-700 text-sm">Address</span>
                      <p className="font-medium text-purple-900 mt-1">{selectedPayout.order.storage.address}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Proof */}
              {selectedPayout.imageUrl && (
                <div className="bg-orange-50 rounded-xl p-4">
                  <h4 className="font-medium text-orange-900 mb-3">Payment Proof</h4>
                  <a 
                    href={selectedPayout.imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-orange-600 hover:text-orange-800 text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Payment Proof</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutManagement;
