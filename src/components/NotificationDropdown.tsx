import { AlertCircle, Bell, Clock, User, X } from 'lucide-react';
import React from 'react';
import type { KeeperRegistrationNotification, StaffNotification } from '../lib/signalr/staffSignalRService';

interface NotificationDropdownProps {
  keeperRegistrations: KeeperRegistrationNotification[];
  generalNotifications: StaffNotification[];
  onMarkAsRead: (type: 'keeper' | 'general', index: number) => void;
  onClearAll: (type: 'keeper' | 'general') => void;
  onKeeperRequestClick: (requestId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  keeperRegistrations,
  generalNotifications,
  onMarkAsRead,
  onClearAll,
  onKeeperRequestClick,
  isOpen,
  onToggle
}) => {
  const totalNotifications = keeperRegistrations.length + generalNotifications.length;

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={onToggle}
        className="relative p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all"
      >
        <Bell className="w-5 h-5 text-white" />
        {totalNotifications > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {totalNotifications > 9 ? '9+' : totalNotifications}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={onToggle}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {totalNotifications > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {totalNotifications} new notification{totalNotifications !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Notifications Content */}
          <div className="max-h-80 overflow-y-auto">
            {totalNotifications === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No new notifications</p>
              </div>
            ) : (
              <>
                {/* Keeper Registration Notifications */}
                {keeperRegistrations.length > 0 && (
                  <div className="p-3 border-b">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center">
                        <User className="w-4 h-4 mr-1 text-blue-500" />
                        Keeper Registrations ({keeperRegistrations.length})
                      </h4>
                      <button
                        onClick={() => onClearAll('keeper')}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {keeperRegistrations.map((notification, index) => (
                        <div
                          key={`keeper-${index}`}
                          className="p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => onKeeperRequestClick(notification.requestId)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                New Keeper Registration
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                <strong>{notification.userName}</strong> has submitted a keeper registration request
                              </p>
                              {notification.email && (
                                <p className="text-xs text-gray-500 mt-1">
                                  📧 {notification.email}
                                </p>
                              )}
                              <div className="flex items-center mt-2 text-xs text-gray-400">
                                <Clock className="w-3 h-3 mr-1" />
                                Just now
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead('keeper', index);
                              }}
                              className="text-gray-400 hover:text-gray-600 ml-2"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* General Notifications */}
                {generalNotifications.length > 0 && (
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1 text-green-500" />
                        General ({generalNotifications.length})
                      </h4>
                      <button
                        onClick={() => onClearAll('general')}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {generalNotifications.map((notification, index) => (
                        <div
                          key={`general-${index}`}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.type}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center mt-2 text-xs text-gray-400">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(notification.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                            <button
                              onClick={() => onMarkAsRead('general', index)}
                              className="text-gray-400 hover:text-gray-600 ml-2"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {totalNotifications > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    onClearAll('keeper');
                    onClearAll('general');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear All Notifications
                </button>
                <button
                  onClick={onToggle}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
