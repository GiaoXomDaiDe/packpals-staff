import {
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Eye,
    FileText,
    Search,
    User,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    getRequestStatusColor,
    getRequestStatusLabel,
    getRequestTypeLabel,
    requestAPI,
    RequestStatus,
    RequestType,
    type Request,
    type RequestQuery
} from '../lib/api/request';

interface RequestManagementProps {
  onBackToMain: () => void;
}

const RequestManagement = ({ onBackToMain }: RequestManagementProps) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 1,
    pageSize: 10,
    totalPages: 1,
    totalCount: 0,
    hasPrevious: false,
    hasNext: false
  });

  // Filter states
  const [filters, setFilters] = useState<RequestQuery>({
    pageIndex: 1,
    pageSize: 10
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Load requests
  useEffect(() => {
    loadRequests();
  }, [filters]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await requestAPI.getAllRequests(filters);
      
      if (response.data) {
        setRequests(response.data.data);
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
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setFilters(prev => ({
      ...prev,
      username: term || undefined,
      pageIndex: 1
    }));
  };

  const handleTypeFilter = (type: number | undefined) => {
    setFilters(prev => ({
      ...prev,
      type,
      pageIndex: 1
    }));
  };

  const handleStatusFilter = (status: number | undefined) => {
    setFilters(prev => ({
      ...prev,
      status,
      pageIndex: 1
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      pageIndex: newPage
    }));
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const staffId = localStorage.getItem('staff_id') || '00000000-0000-0000-0000-000000000000';
      await requestAPI.updateRequestStatus(requestId, staffId, RequestStatus.APPROVED);
      await loadRequests(); // Reload to see updated status
      setSelectedRequest(null);
      
      // TODO: Add toast notification
      console.log('Request approved successfully');
    } catch (error) {
      console.error('Error approving request:', error);
      // TODO: Add error toast
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const staffId = localStorage.getItem('staff_id') || '00000000-0000-0000-0000-000000000000';
      await requestAPI.updateRequestStatus(requestId, staffId, RequestStatus.REJECTED);
      await loadRequests(); // Reload to see updated status
      setSelectedRequest(null);
      
      // TODO: Add toast notification
      console.log('Request rejected successfully');
    } catch (error) {
      console.error('Error rejecting request:', error);
      // TODO: Add error toast
    }
  };

  const parseRequestData = (requestData?: string) => {
    if (!requestData) return null;
    try {
      return JSON.parse(requestData);
    } catch {
      return null;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToMain}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ChevronLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center space-x-2">
            <FileText className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-gray-800">Request Management</h1>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search by Username
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Enter username..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Request Type
            </label>
            <select
              value={filters.type || ''}
              onChange={(e) => handleTypeFilter(e.target.value ? parseInt(e.target.value) : undefined)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value={RequestType.KEEPER_REGISTRATION}>Keeper Registration</option>
              <option value={RequestType.ROLECHANGE}>Role Change</option>
              <option value={RequestType.CREATESTORAGE}>Create Storage</option>
              <option value={RequestType.DELETESTORAGE}>Delete Storage</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleStatusFilter(e.target.value ? parseInt(e.target.value) : undefined)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value={RequestStatus.PENDING}>Pending</option>
              <option value={RequestStatus.APPROVED}>Approved</option>
              <option value={RequestStatus.REJECTED}>Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Loading requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No requests found
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="text-gray-400 mr-2" size={16} />
                        <span className="text-sm font-medium text-gray-900">
                          {request.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getRequestTypeLabel(parseInt(request.type))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRequestStatusColor(parseInt(request.status))}`}>
                        {getRequestStatusLabel(parseInt(request.status))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="mr-1" size={14} />
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Eye size={16} className="mr-1" />
                          View
                        </button>
                        {parseInt(request.status) === RequestStatus.PENDING && (
                          <>
                            <button
                              onClick={() => handleApproveRequest(request.id)}
                              className="text-green-600 hover:text-green-900 flex items-center"
                            >
                              <CheckCircle size={16} className="mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <XCircle size={16} className="mr-1" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.pageIndex - 1)}
                disabled={!pagination.hasPrevious}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.pageIndex + 1)}
                disabled={!pagination.hasNext}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.pageIndex - 1) * pagination.pageSize + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.pageIndex * pagination.pageSize, pagination.totalCount)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.pageIndex - 1)}
                    disabled={!pagination.hasPrevious}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.pageIndex
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(pagination.pageIndex + 1)}
                    disabled={!pagination.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Request Details</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {getRequestTypeLabel(parseInt(selectedRequest.type))}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRequestStatusColor(parseInt(selectedRequest.status))}`}>
                    {getRequestStatusLabel(parseInt(selectedRequest.status))}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requested At</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedRequest.requestedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Show keeper registration data if available */}
              {parseInt(selectedRequest.type) === RequestType.KEEPER_REGISTRATION && selectedRequest.requestData && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keeper Registration Details
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {(() => {
                      const data = parseRequestData(selectedRequest.requestData);
                      return data ? (
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium">Email:</span> {data.email}
                          </div>
                          <div>
                            <span className="font-medium">Identity Number:</span> {data.identityNumber}
                          </div>
                          <div>
                            <span className="font-medium">Bank Account:</span> {data.bankAccount}
                          </div>
                          {data.documentsInfo && (
                            <div>
                              <span className="font-medium">Document:</span> {data.documentsInfo.name} 
                              ({(data.documentsInfo.size / 1024 / 1024).toFixed(2)} MB)
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500">No additional data available</p>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Actions for pending requests */}
              {parseInt(selectedRequest.status) === RequestStatus.PENDING && (
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={() => handleApproveRequest(selectedRequest.id)}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Approve Request
                  </button>
                  <button
                    onClick={() => handleRejectRequest(selectedRequest.id)}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center justify-center"
                  >
                    <XCircle size={16} className="mr-2" />
                    Reject Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestManagement;
