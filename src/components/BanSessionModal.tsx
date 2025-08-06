import { AlertTriangle, Mail, Phone, User } from 'lucide-react'
import React, { useState } from 'react'

interface BanSessionModalProps {
  isVisible: boolean
  onConfirm: (banData: BanSessionData) => void
  onCancel: () => void
  userInfo: {
    id: string
    name: string
    email: string
    phone: string
  }
}

interface BanSessionData {
  reason: string
  customReason?: string
  allowAppeal: boolean
}

const BanSessionModal: React.FC<BanSessionModalProps> = ({
  isVisible,
  onConfirm,
  onCancel,
  userInfo
}) => {
  const [banData, setBanData] = useState<BanSessionData>({
    reason: 'spam',
    allowAppeal: true
  })

  const [showCustomReason, setShowCustomReason] = useState(false)

  const banReasons = [
    { value: 'spam', label: 'Spam or inappropriate content' },
    { value: 'fraud', label: 'Fraudulent activity' },
    { value: 'harassment', label: 'Harassment or abuse' },
    { value: 'fake_profile', label: 'Fake profile information' },
    { value: 'terms_violation', label: 'Terms of service violation' },
    { value: 'custom', label: 'Other (specify reason)' }
  ]

  const handleReasonChange = (reason: string) => {
    setBanData(prev => ({ ...prev, reason }))
    setShowCustomReason(reason === 'custom')
  }

  const handleSubmit = () => {
    if (banData.reason === 'custom' && !banData.customReason?.trim()) {
      alert('Please specify the custom reason')
      return
    }
    onConfirm(banData)
  }

  const getReasonLabel = (reason: string) => {
    return banReasons.find(r => r.value === reason)?.label || reason
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-auto transform transition-all relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ban User Session</h2>
          <p className="text-gray-600">Configure ban settings for selected user</p>
        </div>

        {/* User Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <User className="w-5 h-5 mr-2" />
            User Information
          </h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Name:</span> {userInfo.name}</div>
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-2 text-gray-500" />
              <span className="font-medium">Email:</span> 
              <span className="ml-1">{userInfo.email}</span>
            </div>
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-2 text-gray-500" />
              <span className="font-medium">Phone:</span> 
              <span className="ml-1">{userInfo.phone}</span>
            </div>
          </div>
        </div>

        {/* Ban Reason */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Reason for Ban</h3>
          <div className="space-y-2">
            {banReasons.map((reason) => (
              <label key={reason.value} className="flex items-center">
                <input
                  type="radio"
                  name="reason"
                  value={reason.value}
                  checked={banData.reason === reason.value}
                  onChange={(e) => handleReasonChange(e.target.value)}
                  className="mr-2"
                />
                <span>{reason.label}</span>
              </label>
            ))}
          </div>
          
          {showCustomReason && (
            <div className="mt-3">
              <textarea
                placeholder="Please specify the reason..."
                value={banData.customReason || ''}
                onChange={(e) => setBanData(prev => ({ ...prev, customReason: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md resize-none"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Appeal Process */}
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={banData.allowAppeal}
              onChange={(e) => setBanData(prev => ({ ...prev, allowAppeal: e.target.checked }))}
              className="mr-2"
            />
            <span className="font-medium">Allow user to appeal this ban</span>
          </label>
          {banData.allowAppeal && (
            <p className="text-sm text-gray-600 mt-2 ml-6">
              User will be able to contact support@packpals.com to request a review of their ban.
            </p>
          )}
        </div>

        {/* Preview */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-amber-800 mb-2">Ban Summary</h4>
          <div className="text-sm text-amber-700 space-y-1">
            <div><strong>User:</strong> {userInfo.name} ({userInfo.email})</div>
            <div><strong>Duration:</strong> Permanent Ban</div>
            <div><strong>Reason:</strong> {banData.reason === 'custom' ? banData.customReason : getReasonLabel(banData.reason)}</div>
            <div><strong>Appeal:</strong> {banData.allowAppeal ? 'Allowed' : 'Not allowed'}</div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Confirm Ban
          </button>
        </div>
      </div>
    </div>
  )
}

export default BanSessionModal
export type { BanSessionData, BanSessionModalProps }

