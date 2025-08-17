import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Download,
  Eye,
  FileText,
  RefreshCw,
  User,
  X
} from 'lucide-react';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import type { StaffUser } from '../lib/api/auth';
import { requestAPI, RequestStatus, RequestType, type DeleteStorageData, type KeeperRegistrationData, type Request } from '../lib/api/request';
import { userAPI } from '../lib/api/user';
import { toast } from '../utils/toast';
import Pagination from './shared/Pagination';

// Lazy load PDF Viewer (client-side only)
const PdfViewer = lazy(() => import('./PdfViewer'));

interface RequestManagementProps {
  className?: string;
  initialTypeFilter?: RequestType | 'ALL' | 'STORAGE'; // Add STORAGE for multiple storage types
  initialStatusFilter?: RequestStatus | 'ALL';
  user?: StaffUser; // Add user prop for staff user ID
}

export const RequestManagement: React.FC<RequestManagementProps> = ({ 
  className = '',
  initialTypeFilter = 'ALL',
  initialStatusFilter = 'ALL',
  user
}) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    pageIndex: 1,
    pageSize: 10,
    totalPages: 1,
    totalCount: 0,
    hasPrevious: false,
    hasNext: false
  });
  
  // PDF viewer states - simplified for lazy component
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'ALL'>(initialStatusFilter);
  const [typeFilter, setTypeFilter] = useState<RequestType | 'ALL' | 'STORAGE'>(
    initialTypeFilter === 'STORAGE' ? RequestType.CREATESTORAGE : initialTypeFilter
  );
  
  // Lock type filter only for specific single types (not for STORAGE which allows dropdown)
  const isTypeFilterLocked = initialTypeFilter !== 'ALL' && initialTypeFilter !== 'STORAGE';

  // Load requests
  const loadRequests = async () => {
    try {
      setLoading(true);
      console.log('🔄 [REQUEST MGMT] Loading requests...');
      
      const query = {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        ...(statusFilter !== 'ALL' && { status: statusFilter as RequestStatus }),
        ...(typeFilter !== 'ALL' && typeFilter !== 'STORAGE' && { type: typeFilter as RequestType })
      };
      
      console.log('📋 [REQUEST MGMT] Query:', query);
      const response = await requestAPI.getAllRequests(query);
      
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
        console.log('✅ [REQUEST MGMT] Loaded requests:', response.data.data.length);
      }
    } catch (error) {
      console.error('❌ [REQUEST MGMT] Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load requests on component mount
  useEffect(() => {
    loadRequests();
  }, [statusFilter, typeFilter, pagination.pageIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset pagination when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 1 }));
  }, [statusFilter, typeFilter]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, pageIndex: newPage }));
  };

  // Handle request approval/rejection
  const handleRequestAction = async (requestId: string, approve: boolean) => {
    try {
      setActionLoading(requestId);
      console.log(`🔄 [REQUEST MGMT] ${approve ? 'Approving' : 'Rejecting'} request:`, requestId);
      
      // Find the request to get its data
      const request = requests.find(req => req.id === requestId);
      if (!request) {
        throw new Error('Request not found');
      }
      
      const status = approve ? RequestStatus.APPROVED : RequestStatus.REJECTED;
      const reason = approve ? 'Approved by staff' : 'Rejected by staff';
      
      // Step 1: Change request status
      const response = await requestAPI.changeRequestStatus({
        requestId,
        userId: user?.id || 'STAFF_USER_ID', // Use actual staff user ID or fallback
        status,
        reason
      });
      
      if (response.statusCode === 200) {
        console.log(`✅ [REQUEST MGMT] Request ${approve ? 'approved' : 'rejected'} successfully`);
        
        // Step 2: If approved and it's KEEPER_REGISTRATION, register the keeper
        if (approve && request.type === RequestType.KEEPER_REGISTRATION) {
          try {
            console.log('🔄 [REQUEST MGMT] Processing keeper registration...');
            
            // Parse the request data
            const keeperData = JSON.parse(request.data) as KeeperRegistrationData;
            
            // Call register keeper API
            const keeperResponse = await userAPI.registerKeeper({
              userId: request.userId,
              email: keeperData.email,
              identityNumber: keeperData.identityNumber,
              bankAccount: keeperData.bankAccount,
              documentsUrl: keeperData.documentsUrl || ''
            });
            
            if (keeperResponse.statusCode === 200) {
              console.log('✅ [REQUEST MGMT] Keeper registered successfully');
              toast.success(
                'Keeper Registration Approved!', 
                'The user has been successfully registered as a keeper and their account has been updated with KEEPER role.\n\nNote: The user needs to logout and login again in the mobile app to see the role switcher and access keeper features.'
              );
            } else {
              console.warn('⚠️ [REQUEST MGMT] Keeper registration failed but request was approved');
              toast.warning(
                'Request approved but keeper registration failed', 
                'Please try manual registration or contact support.'
              );
            }
          } catch (keeperError) {
            console.error('❌ [REQUEST MGMT] Error during keeper registration:', keeperError);
            toast.error(
              'Request approved but keeper registration failed', 
              'Please try manual registration.'
            );
          }
        } else {
          // Show success message for non-keeper requests or rejections
          toast.success(`Request ${approve ? 'approved' : 'rejected'} successfully!`);
        }
        
        // Update the request in the list
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: approve ? "APPROVED" : "REJECTED", reason, reviewedAt: new Date().toISOString() }
            : req
        ));
      }
    } catch (error) {
      console.error(`❌ [REQUEST MGMT] Error ${approve ? 'approving' : 'rejecting'} request:`, error);
      toast.error(
        `Failed to ${approve ? 'approve' : 'reject'} request`, 
        'Please try again.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  // View request details
  const viewRequestDetails = (request: Request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  // Get request type label
  const getRequestTypeLabel = (type: RequestType) => {
    switch (type) {
      case RequestType.KEEPER_REGISTRATION:
        return 'Keeper Registration';
      case RequestType.CREATESTORAGE:
        return 'Create Storage';
      case RequestType.DELETESTORAGE:
        return 'Delete Storage';
      default:
        return 'Unknown';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return 'bg-yellow-100 text-yellow-800';
      case "APPROVED":
        return 'bg-green-100 text-green-800';
      case "REJECTED":
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return 'Pending';
      case "APPROVED":
        return 'Approved';
      case "REJECTED":
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Render request data based on type
  const renderRequestData = (request: Request) => {
    try {
      const data = JSON.parse(request.data);
      
      if (request.type === RequestType.KEEPER_REGISTRATION) {
        const keeperData = data as KeeperRegistrationData;
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-blue-500" />
              <div>
                <h4 className="font-medium text-gray-900">Keeper Registration</h4>
                <p className="text-sm text-gray-600">{keeperData.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">ID Number:</span>
                <p className="font-mono">{keeperData.identityNumber}</p>
              </div>
              <div>
                <span className="text-gray-500">Bank Account:</span>
                <p className="font-mono">{keeperData.bankAccount}</p>
              </div>
            </div>
            {keeperData.documentsUrl && (
              <div className="flex space-x-2">
                <button 
                  onClick={() => openPdfViewer(keeperData.documentsUrl!)}
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded border border-blue-200 hover:bg-blue-50"
                >
                  <Eye className="w-4 h-4" />
                  <span>View PDF</span>
                </button>
                <a 
                  href={keeperData.documentsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 text-sm font-medium px-3 py-1 rounded border border-gray-200 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
              </div>
            )}
          </div>
        );
      }
      
      if (request.type === RequestType.CREATESTORAGE) {
        const storageData = data as any;
        return (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 text-green-500 mt-0.5">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Create Storage</h4>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{storageData.description}</p>
              </div>
            </div>
            <div className="space-y-3">
              {/* Keeper Information */}
              {storageData.keeperId && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Keeper ID</p>
                      <p className="text-sm font-mono text-gray-900">{storageData.keeperId}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Location Information */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="text-sm font-medium text-gray-900">{storageData.address}</p>
                    </div>
                    <a 
                      href={`https://www.google.com/maps?q=${storageData.latitude},${storageData.longitude}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs font-medium bg-blue-50 px-2 py-1 rounded"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <span>Map</span>
                    </a>
                  </div>
                  {/* Coordinates */}
                  {storageData.latitude && storageData.longitude && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500">Latitude</p>
                        <p className="text-xs font-mono text-gray-700">{storageData.latitude}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Longitude</p>
                        <p className="text-xs font-mono text-gray-700">{storageData.longitude}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Additional Storage Info - flexible for any extra fields */}
              {Object.keys(storageData).some(key => 
                !['description', 'address', 'keeperId', 'latitude', 'longitude'].includes(key)
              ) && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">Additional Information</p>
                  <div className="space-y-2">
                    {Object.entries(storageData).map(([key, value]) => {
                      if (['description', 'address', 'keeperId', 'latitude', 'longitude'].includes(key)) {
                        return null;
                      }
                      return (
                        <div key={key} className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                          <span className="font-medium text-gray-900">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }
      
      if (request.type === RequestType.DELETESTORAGE) {
        const deleteData = data as DeleteStorageData;
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 text-red-500">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Delete Storage</h4>
                <p className="text-sm text-gray-600">{deleteData.reason}</p>
              </div>
            </div>
          </div>
        );
      }
      
      return (
        <div className="text-sm text-gray-500 italic">
          No additional details available
        </div>
      );
    } catch (error) {
      return (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Unable to load request details</span>
        </div>
      );
    }
  };

  // PDF viewer handlers - simplified for lazy component
  const openPdfViewer = (url: string) => {
    setCurrentPdfUrl(url);
    setShowPdfViewer(true);
  };

  const closePdfViewer = () => {
    setShowPdfViewer(false);
    setCurrentPdfUrl('');
  };

  const pendingRequests = requests.filter(req => req.status === "PENDING");

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isTypeFilterLocked ? (
              typeFilter === RequestType.KEEPER_REGISTRATION ? 'Keeper Registration Requests' :
              typeFilter === RequestType.CREATESTORAGE ? 'Storage Creation Requests' :
              typeFilter === RequestType.DELETESTORAGE ? 'Storage Deletion Requests' :
              'Request Management'
            ) : initialTypeFilter === 'STORAGE' ? 'Storage Requests' : 'Request Management'}
          </h2>
          <p className="text-gray-600 mt-1">
            {isTypeFilterLocked ? (
              typeFilter === RequestType.KEEPER_REGISTRATION ? 'Review and approve keeper registration applications' :
              typeFilter === RequestType.CREATESTORAGE ? 'Review and approve storage creation requests' :
              typeFilter === RequestType.DELETESTORAGE ? 'Review and approve storage deletion requests' :
              'Manage user requests and applications'
            ) : initialTypeFilter === 'STORAGE' ? 'Review and approve storage-related requests (Create/Delete)' : 'Manage user requests and applications'}
          </p>
        </div>
        <button
          onClick={loadRequests}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl  border border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl  border border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(req => req.status === "APPROVED").length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl  border border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <X className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(req => req.status === "REJECTED").length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl  border border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl  border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RequestStatus | 'ALL')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value={RequestStatus.PENDING}>Pending</option>
              <option value={RequestStatus.APPROVED}>Approved</option>
              <option value={RequestStatus.REJECTED}>Rejected</option>
            </select>
          </div>
          
          {/* Only show type filter if not locked to a specific type */}
          {isTypeFilterLocked ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                {typeFilter === RequestType.KEEPER_REGISTRATION && 'Keeper Registration Only'}
                {typeFilter === RequestType.CREATESTORAGE && 'Storage Creation Only'}
                {typeFilter === RequestType.DELETESTORAGE && 'Storage Deletion Only'}
                {typeFilter === 'STORAGE' && 'Storage Requests Only'}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as RequestType | 'ALL' | 'STORAGE')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {initialTypeFilter === 'STORAGE' ? (
                  // Only show storage options when in storage context
                  <>
                    <option value={RequestType.CREATESTORAGE}>Create Storage</option>
                    <option value={RequestType.DELETESTORAGE}>Delete Storage</option>
                  </>
                ) : (
                  // Show all options for general context
                  <>
                    <option value="ALL">All Types</option>
                    <option value={RequestType.KEEPER_REGISTRATION}>Keeper Registration</option>
                    <option value={RequestType.CREATESTORAGE}>Create Storage</option>
                    <option value={RequestType.DELETESTORAGE}>Delete Storage</option>
                  </>
                )}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl  border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Request Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 font-mono text-sm">
                            {request.id}
                          </div>
                          <div className="text-sm text-gray-500">
                            User: <span className="font-mono">{request.userId}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {getRequestTypeLabel(request.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{formatDate(request.requestedAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewRequestDetails(request)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {request.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleRequestAction(request.id, true)}
                              disabled={actionLoading === request.id}
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleRequestAction(request.id, false)}
                              disabled={actionLoading === request.id}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {actionLoading === request.id && (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {requests.length === 0 && !loading && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
                <p className="text-gray-500">No requests match your current filters.</p>
              </div>
            )}

            {/* Pagination */}
            {!loading && requests.length > 0 && (
              <Pagination
                currentPage={pagination.pageIndex}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
                pageSize={pagination.pageSize}
                onPageChange={handlePageChange}
                loading={loading}
                itemName="requests"
              />
            )}
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Request Details</h3>
                  <p className="text-blue-100 text-sm mt-1">
                    {getRequestTypeLabel(selectedRequest.type)}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedRequest.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    selectedRequest.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {getStatusLabel(selectedRequest.status)}
                  </span>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Essential Info Only */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Created</span>
                  <span className="font-medium">{formatDate(selectedRequest.requestedAt)}</span>
                </div>
                {selectedRequest.reviewedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Reviewed</span>
                    <span className="font-medium">{formatDate(selectedRequest.reviewedAt)}</span>
                  </div>
                )}
              </div>

              {/* Request Content */}
              <div className="bg-gray-50 rounded-xl p-4">
                {renderRequestData(selectedRequest)}
              </div>

              {/* Reason (if rejected) */}
              {selectedRequest.reason && selectedRequest.status === 'REJECTED' && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-red-800 font-medium">Rejection Reason</h4>
                      <p className="text-red-700 text-sm mt-1">{selectedRequest.reason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedRequest.status === "PENDING" && (
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => {
                      handleRequestAction(selectedRequest.id, true);
                      setShowModal(false);
                    }}
                    disabled={actionLoading === selectedRequest.id}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all duration-200 font-medium"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => {
                      handleRequestAction(selectedRequest.id, false);
                      setShowModal(false);
                    }}
                    disabled={actionLoading === selectedRequest.id}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all duration-200 font-medium"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal with Suspense */}
      {showPdfViewer && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                <span>Loading PDF Viewer...</span>
              </div>
            </div>
          </div>
        }>
          <PdfViewer 
            pdfUrl={currentPdfUrl} 
            onClose={closePdfViewer}
          />
        </Suspense>
      )}
    </div>
  );
};

export default RequestManagement;
