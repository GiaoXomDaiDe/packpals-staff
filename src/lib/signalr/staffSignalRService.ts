import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

export interface StaffNotification {
  type: string;
  message: string;
  data?: any;
  timestamp: string;
}

export interface KeeperRegistrationNotification {
  userId: string;
  userName: string;
  requestId: string;
  email?: string;
  identityNumber?: string;
  bankAccount?: string;
}

export type StaffNotificationHandler = (notification: StaffNotification) => void;
export type KeeperRegistrationHandler = (notification: KeeperRegistrationNotification) => void;

class StaffSignalRService {
  private connection: HubConnection | null = null;
  private staffId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Event handlers
  private onKeeperRegistrationHandlers: KeeperRegistrationHandler[] = [];
  private onGeneralNotificationHandlers: StaffNotificationHandler[] = [];

  /**
   * Initialize SignalR connection for staff
   * @param baseUrl - Backend server URL
   * @param staffId - Staff member ID
   */
  async initialize(baseUrl: string = 'http://localhost:5000', staffId: string): Promise<boolean> {
    try {
      // Check if already connected with same staff ID
      if (this.connection?.state === 'Connected' && this.staffId === staffId) {
        console.log('Staff SignalR already connected');
        return true;
      }

      // Disconnect existing connection if different staff ID
      if (this.connection && this.staffId !== staffId) {
        await this.disconnect();
      }

      console.log('Initializing Staff SignalR connection to:', baseUrl);
      
      this.staffId = staffId;

      // Check if backend is available before attempting connection
      try {
        const response = await fetch(`${baseUrl}/api/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        if (!response.ok) {
          throw new Error(`Backend not available: ${response.status}`);
        }
      } catch (healthError) {
        console.warn('❌ Backend health check failed:', healthError);
        console.log('📱 SignalR will work in offline mode');
        return false;
      }

      this.connection = new HubConnectionBuilder()
        .withUrl(`${baseUrl}/hubs/staff-notifications`, {
          skipNegotiation: false,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext: any) => {
            if (retryContext.previousRetryCount < this.maxReconnectAttempts) {
              return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
            }
            return null;
          }
        })
        .configureLogging(LogLevel.Information)
        .build();

      // Setup event handlers
      this.setupEventHandlers();

      // Setup connection lifecycle handlers
      this.setupConnectionHandlers();

      // Start connection
      await this.connection.start();
      console.log('✅ Staff SignalR connected successfully');
      
      // Join staff group
      await this.joinStaffGroup(staffId);
      
      this.reconnectAttempts = 0;
      return true;
    } catch (error) {
      console.error('❌ Staff SignalR connection failed:', error);
      // Clean up on failure
      this.connection = null;
      this.staffId = null;
      return false;
    }
  }

  /**
   * Join staff group to receive notifications
   */
  private async joinStaffGroup(staffId: string): Promise<boolean> {
    try {
      if (!this.connection || this.connection.state !== 'Connected') {
        console.error('Staff SignalR not connected');
        return false;
      }

      await this.connection.invoke('JoinStaffGroup', staffId);
      console.log(`✅ Joined staff group: Staff_${staffId}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to join staff group:', error);
      return false;
    }
  }

  /**
   * Leave staff group
   */
  private async leaveStaffGroup(): Promise<boolean> {
    try {
      if (!this.connection || !this.staffId || this.connection.state !== 'Connected') {
        return true; // Already disconnected or not in group
      }

      await this.connection.invoke('LeaveStaffGroup', this.staffId);
      console.log(`✅ Left staff group: Staff_${this.staffId}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to leave staff group:', error);
      return false;
    }
  }

  /**
   * Disconnect from SignalR hub
   */
  async disconnect(): Promise<void> {
    try {
      if (this.connection && this.connection.state === 'Connected') {
        await this.leaveStaffGroup();
        await this.connection.stop();
        console.log('✅ Staff SignalR disconnected');
      } else if (this.connection) {
        // Force stop if connection exists but not connected
        await this.connection.stop();
        console.log('✅ Staff SignalR force disconnected');
      }
    } catch (error) {
      console.error('❌ Staff SignalR disconnect error:', error);
    } finally {
      this.connection = null;
      this.staffId = null;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Get connection state
   */
  get isConnected(): boolean {
    return this.connection?.state === 'Connected';
  }

  // Event handler registration methods
  onKeeperRegistration(handler: KeeperRegistrationHandler): () => void {
    this.onKeeperRegistrationHandlers.push(handler);
    return () => {
      const index = this.onKeeperRegistrationHandlers.indexOf(handler);
      if (index > -1) {
        this.onKeeperRegistrationHandlers.splice(index, 1);
      }
    };
  }

  onGeneralNotification(handler: StaffNotificationHandler): () => void {
    this.onGeneralNotificationHandlers.push(handler);
    return () => {
      const index = this.onGeneralNotificationHandlers.indexOf(handler);
      if (index > -1) {
        this.onGeneralNotificationHandlers.splice(index, 1);
      }
    };
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Handle new keeper registration requests
    this.connection.on('NewKeeperRequest', (notification: any) => {
      console.log('🆕 New keeper registration request:', notification);
      
      const data: KeeperRegistrationNotification = {
        userId: notification.UserId,
        userName: notification.UserName,
        requestId: notification.RequestId,
        email: notification.Email,
        identityNumber: notification.IdentityNumber,
        bankAccount: notification.BankAccount
      };
      
      this.onKeeperRegistrationHandlers.forEach(handler => handler(data));
    });

    // Handle general staff notifications
    this.connection.on('StaffNotification', (notification: any) => {
      console.log('📢 General staff notification:', notification);
      
      const data: StaffNotification = {
        type: notification.Type || 'GENERAL',
        message: notification.Message,
        data: notification.Data,
        timestamp: notification.Timestamp || new Date().toISOString()
      };
      
      this.onGeneralNotificationHandlers.forEach(handler => handler(data));
    });
  }

  private setupConnectionHandlers(): void {
    if (!this.connection) return;

    this.connection.onclose((error: any) => {
      console.log('🔌 Staff SignalR connection closed:', error?.message || 'No error');
    });

    this.connection.onreconnecting((error: any) => {
      console.log('🔄 Staff SignalR reconnecting:', error?.message || 'No error');
      this.reconnectAttempts++;
    });

    this.connection.onreconnected((connectionId: any) => {
      console.log('✅ Staff SignalR reconnected:', connectionId);
      this.reconnectAttempts = 0;
      
      // Rejoin staff group if we were connected
      if (this.staffId) {
        this.joinStaffGroup(this.staffId);
      }
    });
  }
}

// Export singleton instance
export const staffSignalRService = new StaffSignalRService();
export default staffSignalRService;
