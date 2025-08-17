import { ArrowLeft, CreditCard, FileText, Mail, Phone, Shield, User as UserIcon, Users } from 'lucide-react';
import type { UserDetail } from '../lib/api/user';
import { formatBankAccount, parseBankAccount } from '../utils/bankUtils';

interface UserDetailsProps {
  user: UserDetail;
  onBack: () => void;
}

export default function UserDetails({ 
  user, 
  onBack
}: UserDetailsProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-700';
      case 'STAFF': return 'bg-orange-100 text-orange-700';
      case 'KEEPER': return 'bg-blue-100 text-blue-700';
      case 'RENTER': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Parse bank account information from keeper data
  const getBankInfo = () => {
    if (!user.keeper?.bankAccount) {
      return {
        accountNumber: 'N/A',
        bankName: 'No bank account',
        bankCode: '',
        isValid: false
      };
    }
    return parseBankAccount(user.keeper.bankAccount);
  };

  const bankInfo = getBankInfo();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Users</span>
        </button>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
          <div className="flex items-center space-x-6">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover border-4 border-white "
              />
            ) : (
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center ">
                <UserIcon className="w-12 h-12 text-gray-600" />
              </div>
            )}
            <div className="text-white">
              <h1 className="text-3xl font-bold">{user.username}</h1>
              <p className="text-blue-100 text-lg">@{user.username}</p>
              <div className="flex items-center space-x-2 mt-2 flex-wrap">
                {/* Current Active Role */}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.activeRole)}`}>
                  {user.activeRole} (Active)
                </span>
                {/* All Roles */}
                {user.roles.filter(role => role !== user.activeRole).map(role => (
                  <span key={role} className={`px-3 py-1 rounded-full text-sm font-medium opacity-70 ${getRoleColor(role)}`}>
                    {role}
                  </span>
                ))}
                {/* Status */}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  user.status === 'BANNED' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {user.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{user.phoneNumber}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <UserIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="font-medium font-mono text-sm break-all">{user.id}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Bank Name</p>
                  <p className="font-medium">{bankInfo.bankName}</p>
                </div>
              </div>
            </div>

            {/* Role Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Role Information</h3>
              
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Active Role</p>
                  <p className="font-medium">{user.activeRole}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">All Roles</p>
                  <p className="font-medium">{user.roles.join(', ')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Keeper Details */}
          {user.keeper && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Keeper Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Identity Number</p>
                    <p className="font-medium">{user.keeper.identityNumber}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Bank Account</p>
                    <div className="space-y-1">
                      <p className="font-medium">{bankInfo.bankName}</p>
                      <p className="font-mono text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                        {formatBankAccount(user.keeper.bankAccount)}
                      </p>
                      {!bankInfo.isValid && (
                        <p className="text-xs text-amber-600">⚠️ Could not parse bank information</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Documents</p>
                    <a 
                      href={user.keeper.documents} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-800 underline"
                    >
                      View Documents
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
