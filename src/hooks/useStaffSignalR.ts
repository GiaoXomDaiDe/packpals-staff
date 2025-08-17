import { useCallback, useEffect, useState } from 'react';
import { useNotification } from '../context/NotificationProvider';
import { staffSignalRService } from '../lib/signalr/staffSignalRService';

// Types for notifications
export interface StaffNotification {
  type: string;
  message: string;
  data: any;
  timestamp: string;
}

export interface KeeperRegistrationNotification {
  Type: 'KEEPER_REGISTRATION_REQUEST';
  Message: string;
  Data: {
    UserId: string;
    Username: string;
    RequestId: string;
    RequestType: 'KEEPER_REGISTRATION';
    Timestamp: string;
  };
  Timestamp: string;
}

export interface PayoutNotification {
  Id: string;
  Amount: number;
  UserId: string;
  CreatedAt: string;
}

// Hook for managing Staff SignalR connection and notifications
export const useStaffSignalR = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('Disconnected');
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastNotification, setLastNotification] = useState<StaffNotification | null>(null);
  const { showNotification } = useNotification();

  // Connection management
  const connect = useCallback(async () => {
    try {
      console.log('🔄 [useStaffSignalR] Attempting to connect...');
      await staffSignalRService.start();
      setIsConnected(true);
      setConnectionState('Connected');
      console.log('✅ [useStaffSignalR] Connected successfully');
    } catch (error) {
      console.error('❌ [useStaffSignalR] Connection failed:', error);
      setIsConnected(false);
      setConnectionState('Disconnected');
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await staffSignalRService.stop();
      setIsConnected(false);
      setConnectionState('Disconnected');
      console.log('🛑 [useStaffSignalR] Disconnected');
    } catch (error) {
      console.error('❌ [useStaffSignalR] Disconnect error:', error);
    }
  }, []);

  // Notification handlers
  const handleStaffNotification = useCallback((event: CustomEvent) => {
    const { type, notification } = event.detail;
    
    console.log(`📩 [useStaffSignalR] Received ${type} notification:`, notification);
    
    const newNotification: StaffNotification = {
      type: type,
      message: notification.Message || notification.message || 'New notification',
      data: notification.Data || notification.data || notification,
      timestamp: notification.Timestamp || notification.timestamp || new Date().toISOString()
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50 notifications
    setUnreadCount(prev => prev + 1);
    setLastNotification(newNotification);
    
    // Show toast notification
    let toastTitle = '📢 New Notification';
    if (type === 'KEEPER_REGISTRATION_REQUEST') {
      toastTitle = '🆕 New Keeper Registration';
    } else if (type === 'CREATE_STORAGE_REQUEST') {
      toastTitle = '� New Storage Creation';
    } else if (type === 'DELETE_STORAGE_REQUEST') {
      toastTitle = '🗑️ New Storage Deletion';
    } else if (type === 'PAYOUT_REQUEST') {
      toastTitle = '� New Payout Request';
    }
    
    showNotification({
      title: toastTitle,
      message: newNotification.message,
      type: 'info',
      duration: 6000
    });
  }, [showNotification]);

  const handleNotificationBadgeUpdate = useCallback(() => {
    // This could trigger UI updates, sounds, etc.
    console.log('🔔 [useStaffSignalR] Notification badge update requested');
  }, []);

  // Mark notifications as read
  const markAsRead = useCallback(() => {
    setUnreadCount(0);
    
    // Clear title notification indicator
    const currentTitle = document.title;
    if (currentTitle.includes('(!)')) {
      document.title = currentTitle.replace('(!) ', '');
    }
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    setLastNotification(null);
  }, []);

  // Get specific notification types
  const getKeeperRegistrationNotifications = useCallback(() => {
    return notifications.filter(n => n.type === 'KEEPER_REGISTRATION_REQUEST');
  }, [notifications]);

  const getPayoutNotifications = useCallback(() => {
    return notifications.filter(n => n.type === 'PAYOUT_REQUEST');
  }, [notifications]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    try {
      await staffSignalRService.sendTestNotification();
      console.log('✅ [useStaffSignalR] Test notification sent');
    } catch (error) {
      console.error('❌ [useStaffSignalR] Test notification failed:', error);
      throw error;
    }
  }, []);

  // Setup event listeners and connection
  useEffect(() => {
    // Add event listeners for SignalR notifications
    window.addEventListener('staffNotification', handleStaffNotification as EventListener);
    window.addEventListener('updateNotificationBadge', handleNotificationBadgeUpdate as EventListener);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('staffNotification', handleStaffNotification as EventListener);
      window.removeEventListener('updateNotificationBadge', handleNotificationBadgeUpdate as EventListener);
    };
  }, [handleStaffNotification, handleNotificationBadgeUpdate]);

  // Auto-connect when hook is first used
  useEffect(() => {
    const autoConnect = async () => {
      // Only connect if user is authenticated
      const token = localStorage.getItem('staff_token');
      if (token && !isConnected) {
        await connect();
      }
    };

    autoConnect();

    // Cleanup on unmount
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, []); // Only run once on mount

  // Update connection state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const currentState = staffSignalRService.getConnectionState();
      const isActive = staffSignalRService.isConnectionActive();
      
      setConnectionState(currentState);
      setIsConnected(isActive);
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Request notification permission on first load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log(`🔔 [useStaffSignalR] Notification permission: ${permission}`);
      });
    }
  }, []);

  return {
    // Connection state
    isConnected,
    connectionState,
    
    // Connection management
    connect,
    disconnect,
    
    // Notifications
    notifications,
    unreadCount,
    lastNotification,
    
    // Notification management
    markAsRead,
    clearNotifications,
    getKeeperRegistrationNotifications,
    getPayoutNotifications,
    
    // Utilities
    sendTestNotification,
    
    // Computed values
    hasUnreadNotifications: unreadCount > 0,
    totalNotifications: notifications.length,
  };
};

export default useStaffSignalR;
