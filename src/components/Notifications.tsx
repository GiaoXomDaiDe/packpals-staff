import { Bell, X } from 'lucide-react'
import React from 'react'

interface NotificationBadgeProps {
  count: number
  onClick?: () => void
  className?: string
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  onClick,
  className = ''
}) => {
  if (count === 0) return null

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
    >
      <Bell className="w-6 h-6" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}

interface NotificationToastProps {
  visible: boolean
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  onClose: () => void
  autoClose?: boolean
  duration?: number
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  visible,
  title,
  message,
  type = 'info',
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  React.useEffect(() => {
    if (visible && autoClose) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [visible, autoClose, duration, onClose])

  if (!visible) return null

  const bgColors = {
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200'
  }

  const textColors = {
    info: 'text-blue-900',
    success: 'text-green-900',
    warning: 'text-yellow-900',
    error: 'text-red-900'
  }

  const iconColors = {
    info: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500'
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className={`max-w-sm p-4 rounded-lg border  ${bgColors[type]}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className={`font-semibold ${textColors[type]} mb-1`}>
              {title}
            </h4>
            <p className={`text-sm ${textColors[type]} opacity-90`}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`ml-3 p-1 hover:bg-white/50 rounded ${iconColors[type]}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default { NotificationBadge, NotificationToast }
