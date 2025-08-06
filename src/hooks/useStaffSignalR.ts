import { useCallback, useEffect, useState } from 'react';
import type {
  KeeperRegistrationHandler,
  KeeperRegistrationNotification,
  StaffNotification,
  StaffNotificationHandler
} from '../lib/signalr/staffSignalRService';
import staffSignalRService from '../lib/signalr/staffSignalRService';

export interface UseStaffSignalROptions {
  autoConnect?: boolean;
  staffId?: string;
  baseUrl?: string;
}

export interface UseStaffSignalRReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: (staffId: string, baseUrl?: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  keeperRegistrations: KeeperRegistrationNotification[];
  generalNotifications: StaffNotification[];
  clearKeeperRegistrations: () => void;
  clearGeneralNotifications: () => void;
  markAsRead: (type: 'keeper' | 'general', index: number) => void;
}

export const useStaffSignalR = (options: UseStaffSignalROptions = {}): UseStaffSignalRReturn => {
  const { autoConnect = false, staffId, baseUrl = 'http://localhost:5000' } = options;

  // Connection state
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Notifications state
  const [keeperRegistrations, setKeeperRegistrations] = useState<KeeperRegistrationNotification[]>([]);
  const [generalNotifications, setGeneralNotifications] = useState<StaffNotification[]>([]);

  // Connection handlers
  const connect = useCallback(async (staffId: string, baseUrl?: string): Promise<boolean> => {
    if (isConnecting) {
      console.log('Connection already in progress');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const success = await staffSignalRService.initialize(baseUrl, staffId);
      setIsConnected(success);
      
      if (!success) {
        setError('Backend server is not available. Working in offline mode.');
      } else {
        setError(null);
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown connection error';
      setError(errorMessage);
      setIsConnected(false);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      await staffSignalRService.disconnect();
      setIsConnected(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown disconnection error';
      setError(errorMessage);
    }
  }, []);

  // Notification handlers
  const handleKeeperRegistration: KeeperRegistrationHandler = useCallback((notification: KeeperRegistrationNotification) => {
    setKeeperRegistrations(prev => [notification, ...prev]);
  }, []);

  const handleGeneralNotification: StaffNotificationHandler = useCallback((notification: StaffNotification) => {
    setGeneralNotifications(prev => [notification, ...prev]);
  }, []);

  // Clear notifications
  const clearKeeperRegistrations = useCallback(() => {
    setKeeperRegistrations([]);
  }, []);

  const clearGeneralNotifications = useCallback(() => {
    setGeneralNotifications([]);
  }, []);

  const markAsRead = useCallback((type: 'keeper' | 'general', index: number) => {
    if (type === 'keeper') {
      setKeeperRegistrations(prev => prev.filter((_, i) => i !== index));
    } else {
      setGeneralNotifications(prev => prev.filter((_, i) => i !== index));
    }
  }, []);

  // Effect to register/unregister notification handlers
  useEffect(() => {
    const unsubscribeKeeper = staffSignalRService.onKeeperRegistration(handleKeeperRegistration);
    const unsubscribeGeneral = staffSignalRService.onGeneralNotification(handleGeneralNotification);

    return () => {
      unsubscribeKeeper();
      unsubscribeGeneral();
    };
  }, [handleKeeperRegistration, handleGeneralNotification]);

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect && staffId && !isConnected && !isConnecting) {
      connect(staffId, baseUrl);
    }
  }, [autoConnect, staffId, baseUrl, isConnected, isConnecting, connect]);

  // Update connection state based on service state
  useEffect(() => {
    const checkConnection = () => {
      const serviceConnected = staffSignalRService.isConnected;
      if (serviceConnected !== isConnected) {
        setIsConnected(serviceConnected);
      }
    };

    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [isConnected, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    keeperRegistrations,
    generalNotifications,
    clearKeeperRegistrations,
    clearGeneralNotifications,
    markAsRead,
  };
};

export default useStaffSignalR;
