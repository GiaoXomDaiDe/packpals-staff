import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

// SignalR Service for Staff Web Interface
class StaffSignalRService {
  private connection: HubConnection | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection() {
    // Use environment variable with fallback to production URL
    const signalRUrl = import.meta.env.VITE_SIGNALR_URL || 'https://packpal-api.up.railway.app/signalrhub';
    
    console.log('🔗 [Staff SignalR] Initializing connection to:', signalRUrl);

    this.connection = new HubConnectionBuilder()
      .withUrl(signalRUrl, {
        accessTokenFactory: () => {
          // Get staff token from localStorage
          const token = localStorage.getItem('staff_token') || '';
          console.log('🔐 [Staff SignalR] Using token:', token ? 'Token present' : 'No token');
          return token;
        }
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Progressive backoff: 2s, 5s, 10s, 20s, 30s
          const delays = [2000, 5000, 10000, 20000, 30000];
          const delayIndex = Math.min(retryContext.previousRetryCount, delays.length - 1);
          const delay = delays[delayIndex];
          console.log(`🔄 [Staff SignalR] Next reconnect attempt ${retryContext.previousRetryCount + 1} in ${delay}ms`);
          return delay;
        }
      })
      .configureLogging(LogLevel.Information)
      .build();

    this.setupConnectionEvents();
    this.setupNotificationHandlers();
  }

  private setupConnectionEvents() {
    if (!this.connection) return;

    // Connection established
    this.connection.onreconnecting((error) => {
      console.log('🔄 [Staff SignalR] Reconnecting...', error);
      this.isConnected = false;
    });

    this.connection.onreconnected((connectionId) => {
      console.log('✅ [Staff SignalR] Reconnected successfully:', connectionId);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.joinStaffGroup();
    });

    this.connection.onclose(async (error) => {
      console.log('❌ [Staff SignalR] Connection closed:', error);
      this.isConnected = false;
      
      // Attempt manual reconnection if automatic reconnect fails
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 [Staff SignalR] Manual reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        
        setTimeout(() => {
          this.start();
        }, this.reconnectDelay);
      }
    });
  }

  private setupNotificationHandlers() {
    if (!this.connection) return;

    // Keeper registration request notification
    this.connection.on('KeeperRegistrationRequest', (notification) => {
      console.log('📩 [Staff SignalR] Keeper registration request received:', notification);
      this.handleKeeperRegistrationRequest(notification);
    });

    // Storage creation request notification
    this.connection.on('CreateStorageRequest', (notification) => {
      console.log('🏠 [Staff SignalR] Create storage request received:', notification);
      this.handleCreateStorageRequest(notification);
    });

    // Storage deletion request notification
    this.connection.on('DeleteStorageRequest', (notification) => {
      console.log('🗑️ [Staff SignalR] Delete storage request received:', notification);
      this.handleDeleteStorageRequest(notification);
    });

    // Payout request notification  
    this.connection.on('ReceivePayoutRequest', (notification) => {
      console.log('💰 [Staff SignalR] Payout request received:', notification);
      this.handlePayoutRequest(notification);
    });

    // Generic staff notification
    this.connection.on('StaffNotification', (notification) => {
      console.log('📢 [Staff SignalR] Staff notification received:', notification);
      this.handleGenericNotification(notification);
    });
  }

  private handleKeeperRegistrationRequest(notification: any) {
    console.log('📩 [Staff SignalR] Keeper registration request received:', notification);
    
    // Extract username safely
    const username = notification.data?.Username || notification.Data?.Username || 'Unknown User';
    
    // Show browser notification if permission granted
    this.showBrowserNotification(
      'New Keeper Registration',
      `${username} wants to become a keeper`,
      '/staff/upgrade-request'
    );

    // Dispatch custom event for React components to listen
    window.dispatchEvent(new CustomEvent('staffNotification', {
      detail: {
        type: 'KEEPER_REGISTRATION_REQUEST',
        notification: notification
      }
    }));

    // Update badge count
    this.updateNotificationBadge();
  }

  private handleCreateStorageRequest(notification: any) {
    console.log('🏠 [Staff SignalR] Create storage request received:', notification);
    
    // Extract username safely
    const username = notification.data?.Username || notification.Data?.Username || 'Unknown User';
    
    // Show browser notification if permission granted
    this.showBrowserNotification(
      'New Storage Creation Request',
      `${username} wants to create a new storage`,
      '/staff/storage-request'
    );

    // Dispatch custom event for React components to listen
    window.dispatchEvent(new CustomEvent('staffNotification', {
      detail: {
        type: 'CREATE_STORAGE_REQUEST',
        notification: notification
      }
    }));

    // Update badge count
    this.updateNotificationBadge();
  }

  private handleDeleteStorageRequest(notification: any) {
    console.log('🗑️ [Staff SignalR] Delete storage request received:', notification);
    
    // Extract username safely
    const username = notification.data?.Username || notification.Data?.Username || 'Unknown User';
    
    // Show browser notification if permission granted
    this.showBrowserNotification(
      'New Storage Deletion Request',
      `${username} wants to delete a storage`,
      '/staff/storage-request'
    );

    // Dispatch custom event for React components to listen
    window.dispatchEvent(new CustomEvent('staffNotification', {
      detail: {
        type: 'DELETE_STORAGE_REQUEST',
        notification: notification
      }
    }));

    // Update badge count
    this.updateNotificationBadge();
  }

  private handlePayoutRequest(notification: any) {
    this.showBrowserNotification(
      'New Payout Request',
      `Payout request of $${notification.Amount}`,
      '/staff/payout-request'
    );

    window.dispatchEvent(new CustomEvent('staffNotification', {
      detail: {
        type: 'PAYOUT_REQUEST',
        notification: notification
      }
    }));

    this.updateNotificationBadge();
  }

  private handleGenericNotification(notification: any) {
    console.log('📢 [Staff SignalR] Generic notification:', notification);
    
    window.dispatchEvent(new CustomEvent('staffNotification', {
      detail: {
        type: 'GENERIC',
        notification: notification
      }
    }));
  }

  private showBrowserNotification(title: string, body: string, clickUrl?: string) {
    // Check if browser supports notifications
    if ('Notification' in window) {
      // Request permission if not granted
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            this.createNotification(title, body, clickUrl);
          }
        });
      } else if (Notification.permission === 'granted') {
        this.createNotification(title, body, clickUrl);
      }
    }
  }

  private createNotification(title: string, body: string, clickUrl?: string) {
    const notification = new Notification(title, {
      body: body,
      icon: '/vite.svg', // Replace with actual app icon
      badge: '/vite.svg',
      tag: 'staff-notification',
      requireInteraction: true,
    });

    notification.onclick = function() {
      window.focus();
      if (clickUrl) {
        window.location.href = clickUrl;
      }
      notification.close();
    };

    // Auto close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);
  }

  private updateNotificationBadge() {
    // Update document title with notification indicator
    const currentTitle = document.title;
    if (!currentTitle.includes('(!)')) {
      document.title = `(!) ${currentTitle}`;
    }

    // Dispatch event for UI components to update badge
    window.dispatchEvent(new CustomEvent('updateNotificationBadge'));
  }

  private async joinStaffGroup() {
    if (!this.connection || !this.isConnected) return;

    try {
      // Join the Staff group to receive staff notifications
      await this.connection.invoke('JoinStaffGroup');
      console.log('✅ [Staff SignalR] Joined Staff group successfully');
    } catch (error) {
      console.error('❌ [Staff SignalR] Failed to join Staff group:', error);
    }
  }

  // Public methods
  public async start(): Promise<void> {
    if (!this.connection) {
      this.initializeConnection();
    }

    try {
      if (this.connection!.state === 'Disconnected') {
        await this.connection!.start();
        console.log('✅ [Staff SignalR] Connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // Join staff group after connection
        await this.joinStaffGroup();
      }
    } catch (error) {
      console.error('❌ [Staff SignalR] Connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('🛑 [Staff SignalR] Connection stopped');
        this.isConnected = false;
      } catch (error) {
        console.error('❌ [Staff SignalR] Error stopping connection:', error);
      }
    }
  }

  public getConnectionState(): string {
    return this.connection?.state || 'Disconnected';
  }

  public isConnectionActive(): boolean {
    return this.isConnected && this.connection?.state === 'Connected';
  }

  // Send test notification (for debugging)
  public async sendTestNotification(): Promise<void> {
    if (!this.connection || !this.isConnected) {
      throw new Error('SignalR connection not established');
    }

    try {
      await this.connection.invoke('SendTestNotification', 'Test message from staff');
      console.log('✅ [Staff SignalR] Test notification sent');
    } catch (error) {
      console.error('❌ [Staff SignalR] Failed to send test notification:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const staffSignalRService = new StaffSignalRService();
export default staffSignalRService;
