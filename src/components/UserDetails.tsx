import {
  ChevronRight,
  CreditCard,
  Eye,
  FileText,
  Mail,
  Phone,
  Shield,
  Users,
  UserX
} from 'lucide-react';
import { useState } from 'react';
import { type User, userAPI } from '../lib/api/user';
import BanSessionModal, { type BanSessionData } from './BanSessionModal';
import CustomModal from './CustomModal';

interface UserDetailsProps {
  user: User;
  loading: boolean;
  onBack: () => void;
  onToggleStatus: (user: User) => void;
  onUserUpdated?: (updatedUser: User) => void;
}

export default function UserDetails({ user, loading, onBack, onToggleStatus, onUserUpdated }: UserDetailsProps) {
  const [showBanModal, setShowBanModal] = useState(false);
  const [showBanSessionModal, setShowBanSessionModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isBanning, setIsBanning] = useState(false);

  const handleBanUser = async () => {
    setIsBanning(true);
    try {
      await userAPI.banAccount(user.id);
      setShowBanModal(false);
      setShowSuccessModal(true);
      
      // Update user status locally
      const updatedUser = { ...user, status: 'BANNED' as const };
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
      
      // Call parent's onToggleStatus to refresh the list
      setTimeout(() => {
        onToggleStatus(user);
      }, 1500);
    } catch (error) {
      setShowBanModal(false);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to ban user');
      setShowErrorModal(true);
    } finally {
      setIsBanning(false);
    }
  };

  const handleBanSession = async (banData: BanSessionData) => {
    setIsBanning(true);
    try {
      // For now, we'll use the same ban API but could extend it later
      await userAPI.banAccount(user.id);
      setShowBanSessionModal(false);
      setShowSuccessModal(true);
      
      // Update user status locally
      const updatedUser = { ...user, status: 'BANNED' as const };
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
      
      // Log ban details for now (could be sent to backend later)
      console.log('Ban session details:', {
        userId: user.id,
        ...banData
      });
      
      // Call parent's onToggleStatus to refresh the list
      setTimeout(() => {
        onToggleStatus(user);
      }, 1500);
    } catch (error) {
      setShowBanSessionModal(false);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to ban user');
      setShowErrorModal(true);
    } finally {
      setIsBanning(false);
    }
  };
  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={onBack}
        className="mb-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center space-x-2"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        <span>Back to list</span>
      </button>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
          <div className="flex items-center space-x-6">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white/30"
              />
            ) : (
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-4 border-white/30">
                <span className="text-4xl font-bold">{user.username[0]?.toUpperCase()}</span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{user.username}</h2>
              <div className="flex items-center space-x-4 mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.status === 'ACTIVE' ? 'bg-green-500/20 text-green-100' : 
                  user.status === 'BANNED' ? 'bg-red-500/20 text-red-100' :
                  'bg-yellow-500/20 text-yellow-100'
                }`}>
                  {user.status || 'Unknown'}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {user.role}
                </span>
              </div>
              <p className="text-white/80 text-sm font-mono">ID: {user.id}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-8">
          <div className="bg-gray-50 rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>User Information</span>
            </h3>
            
            <div className="space-y-4">
              {/* Email */}
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Email Address</p>
                  <p className="text-gray-900 break-all">{user.email}</p>
                </div>
              </div>
              
              {/* Phone */}
              {user.phoneNumber && (
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Phone Number</p>
                    <p className="text-gray-900">{user.phoneNumber}</p>
                  </div>
                </div>
              )}

              {/* Keeper Information (only for KEEPER role) */}
              {user.role === 'KEEPER' && user.keeper && (
                <>
                  <div className="border-t border-gray-200 pt-4 mt-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="text-base font-medium text-gray-900">Keeper Details</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">Keeper ID</p>
                      <p className="font-mono text-sm text-gray-900 break-all">{user.keeper.keeperId}</p>
                    </div>
                  </div>

                  {user.keeper.identityNumber && (
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">Identity Number</p>
                        <p className="font-mono text-sm text-gray-900">{user.keeper.identityNumber}</p>
                      </div>
                    </div>
                  )}

                  {user.keeper.bankAccount && (
                    <div className="flex items-start space-x-3">
                      <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">Bank Account</p>
                        <p className="text-gray-900">{user.keeper.bankAccount}</p>
                      </div>
                    </div>
                  )}

                  {user.keeper.documents && (
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">Documents</p>
                        <a 
                          href={user.keeper.documents} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          <span>View document</span>
                          <Eye className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Account Actions */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <p className="text-sm font-medium text-gray-500 mb-3">Account Management</p>
                {user.role === 'ADMIN' ? (
                  <div className="w-full px-4 py-3 bg-blue-100 text-blue-800 rounded-lg font-medium text-center">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Admin accounts cannot be banned
                  </div>
                ) : user.status === 'ACTIVE' ? (
                  <div className="space-y-3">
                    <button 
                      onClick={() => setShowBanModal(true)}
                      disabled={loading || isBanning}
                      className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <UserX className="w-4 h-4" />
                      <span>{loading || isBanning ? 'Processing...' : 'Quick Ban'}</span>
                    </button>
                    <button 
                      onClick={() => setShowBanSessionModal(true)}
                      disabled={loading || isBanning}
                      className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <Shield className="w-4 h-4" />
                      <span>{loading || isBanning ? 'Processing...' : 'Ban Session (Advanced)'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="w-full px-4 py-3 bg-gray-100 text-gray-500 rounded-lg font-medium text-center">
                    User is {user.status.toLowerCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ban Session Modal */}
      <BanSessionModal
        isVisible={showBanSessionModal}
        userInfo={{
          id: user.id,
          name: user.username,
          email: user.email,
          phone: user.phoneNumber || 'N/A'
        }}
        onConfirm={handleBanSession}
        onCancel={() => setShowBanSessionModal(false)}
      />

      {/* Ban Confirmation Modal */}
      <CustomModal
        isVisible={showBanModal}
        type="warning"
        title="Ban User Account"
        message={`Are you sure you want to ban ${user.username}? This action will prevent the user from accessing their account.`}
        confirmText="Ban User"
        cancelText="Cancel"
        onConfirm={handleBanUser}
        onCancel={() => setShowBanModal(false)}
        onClose={() => setShowBanModal(false)}
      />

      {/* Success Modal */}
      <CustomModal
        isVisible={showSuccessModal}
        type="success"
        title="User Banned Successfully"
        message={`${user.username} has been banned successfully. The user will no longer be able to access their account.`}
        confirmText="OK"
        onConfirm={() => setShowSuccessModal(false)}
      />

      {/* Error Modal */}
      <CustomModal
        isVisible={showErrorModal}
        type="error"
        title="Error"
        message={errorMessage}
        confirmText="Close"
        onConfirm={() => setShowErrorModal(false)}
      />
    </div>
  );
}
