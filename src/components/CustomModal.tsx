import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react'
import React from 'react'

type ModalType = 'info' | 'success' | 'error' | 'warning'

interface CustomModalProps {
  isVisible: boolean
  type: ModalType
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
  onClose?: () => void
  // Custom styling
  customIcon?: React.ReactNode
  customIconColor?: string
  customButtonColor?: string
}

const CustomModal: React.FC<CustomModalProps> = ({
  isVisible,
  type,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  onClose,
  customIcon,
  customIconColor,
  customButtonColor
}) => {
  // Default configurations for each type
  const getTypeConfig = (modalType: ModalType) => {
    switch (modalType) {
      case 'success':
        return {
          icon: <CheckCircle className="w-16 h-16" />,
          iconColor: 'text-green-500',
          iconBgColor: 'bg-green-100',
          confirmButtonColor: 'bg-green-600 hover:bg-green-700',
          defaultConfirmText: 'OK'
        }
      case 'error':
        return {
          icon: <XCircle className="w-16 h-16" />,
          iconColor: 'text-red-500',
          iconBgColor: 'bg-red-100',
          confirmButtonColor: 'bg-red-600 hover:bg-red-700',
          defaultConfirmText: 'Close'
        }
      case 'warning':
        return {
          icon: <AlertTriangle className="w-16 h-16" />,
          iconColor: 'text-amber-500',
          iconBgColor: 'bg-amber-100',
          confirmButtonColor: 'bg-amber-600 hover:bg-amber-700',
          defaultConfirmText: 'Confirm'
        }
      case 'info':
      default:
        return {
          icon: <Info className="w-16 h-16" />,
          iconColor: 'text-blue-500',
          iconBgColor: 'bg-blue-100',
          confirmButtonColor: 'bg-blue-600 hover:bg-blue-700',
          defaultConfirmText: 'OK'
        }
    }
  }

  const config = getTypeConfig(type)
  
  // Use custom props if provided, otherwise use defaults from type
  const finalIcon = customIcon || config.icon
  const finalIconColor = customIconColor || config.iconColor
  const finalConfirmText = confirmText || config.defaultConfirmText
  const finalCancelText = cancelText || 'Cancel'
  const finalButtonColor = customButtonColor || config.confirmButtonColor

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (onClose) {
        onClose()
      } else if (type === 'error' || type === 'info') {
        onConfirm()
      }
    }
  }

  if (!isVisible) return null

  return (
    <div 
      className="fixed inset-0 bg-gray-500 bg-opacity-40 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-auto transform transition-all relative">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {/* Icon */}
        <div className={`w-20 h-20 ${config.iconBgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <div className={finalIconColor}>
            {finalIcon}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
          {title}
        </h2>

        {/* Message */}
        <p className="text-gray-600 text-center mb-8 leading-relaxed">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
            >
              {finalCancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-3 ${finalButtonColor} text-white font-medium rounded-lg transition-colors`}
          >
            {finalConfirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomModal
export type { CustomModalProps, ModalType }

