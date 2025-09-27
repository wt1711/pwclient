import { IgApiClient } from 'instagram-private-api';
import { withFbnsAndRealtime } from 'instagram_mqtt';
import { WebSocket } from 'ws';
import { EventEmitter } from 'events';

// Extended Instagram client with MQTT support
type ExtendedIgApiClient = ReturnType<typeof withFbnsAndRealtime>;

interface RealtimeMessage {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  timestamp: number;
  threadId: string;
  [key: string]: unknown; // Index signature for compatibility
}

interface RealtimeEvent {
  type: 'message' | 'typing' | 'presence';
  data: Record<string, unknown>;
  userId: string;
}

class InstagramRealtimeService extends EventEmitter {
  private ig: ExtendedIgApiClient | null;
  private isConnected: boolean = false;
  private connectedClients: Map<string, WebSocket> = new Map();
  private userSessions: Map<string, string> = new Map(); // userId -> sessionId

  constructor() {
    super();
    this.ig = null;
  }

  async initialize(username: string, password: string): Promise<void> {
    try {
      console.log('� Initializing Instagram Realtime Service...');
      
      // Create Instagram client with MQTT support
      const baseClient = new IgApiClient();
      this.ig = withFbnsAndRealtime(baseClient);
      
      // Generate device ID
      this.ig.state.generateDevice(username);
      
      // Login
      await this.ig.account.login(username, password);
      console.log('✅ Instagram login successful');
      
      // Set up real-time event listeners
      if (this.ig) {
        this.setupRealtimeListeners();
      }
      
      this.isConnected = true;
      console.log('✅ Instagram Realtime Service initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Instagram Realtime Service:', error);
      throw error;
    }
  }

  private setupRealtimeListeners(): void {
    console.log('🔗 Setting up realtime listeners...');
    
    if (!this.ig) return;

    if (!this.ig.realtime) {
      console.error('❌ Realtime client not available');
      return;
    }

    // Listen for direct messages
    this.ig.realtime.on('message', (data: unknown) => {
      console.log('📨 New realtime message:', data);
      this.handleRealtimeMessage(data as Record<string, unknown>);
      
      // Broadcast to WebSocket clients
      this.broadcastToWebSocketClients({
        type: 'instagram_message',
        data: data,
        timestamp: Date.now()
      });
    });

    // Listen for direct events (typing, etc.)
    this.ig.realtime.on('direct', (data: unknown) => {
      console.log('📱 Direct event:', data);
      this.handleDirectEvent(data as Record<string, unknown>);
      
      // Broadcast direct events to WebSocket clients
      this.broadcastToWebSocketClients({
        type: 'direct_event',
        data: data,
        timestamp: Date.now()
      });
    });

    // Listen for presence updates
    this.ig.realtime.on('appPresence', (data: unknown) => {
      console.log('👤 Presence update:', data);
      this.handlePresenceUpdate(data as Record<string, unknown>);
      
      // Broadcast presence updates to WebSocket clients
      this.broadcastToWebSocketClients({
        type: 'presence_update',
        data: data,
        timestamp: Date.now()
      });
    });

    // Listen for push notifications
    if (this.ig.fbns) {
      this.ig.fbns.on('push', (data: unknown) => {
        console.log('🔔 Push notification:', data);
        this.handlePushNotification(data as Record<string, unknown>);
        
        // Broadcast push notifications to WebSocket clients
        this.broadcastToWebSocketClients({
          type: 'push_notification',
          data: data,
          timestamp: Date.now()
        });
      });
    }

    console.log('✅ Realtime listeners set up');
  }

  private handleRealtimeMessage(data: Record<string, unknown>): void {
    try {
      // Parse Instagram message data
      const message: RealtimeMessage = {
        id: (data.item_id as string) || Date.now().toString(),
        senderId: (data.user_id as string)?.toString() || '',
        recipientId: (data.thread_id as string) || '',
        text: (data.text as string) || '',
        timestamp: (data.timestamp as number) || Date.now(),
        threadId: (data.thread_id as string) || ''
      };

      // Emit to connected WebSocket clients
      this.broadcastToClients({
        type: 'message',
        data: message,
        userId: message.recipientId
      });

      // Emit internal event
      this.emit('newMessage', message);
      
    } catch (error) {
      console.error('❌ Error handling realtime message:', error);
    }
  }

  private handleDirectEvent(data: Record<string, unknown>): void {
    try {
      // Handle typing indicators, read receipts, etc.
      const event: RealtimeEvent = {
        type: 'typing',
        data: data,
        userId: (data.user_id as string)?.toString() || ''
      };

      this.broadcastToClients(event);
      this.emit('directEvent', event);
      
    } catch (error) {
      console.error('❌ Error handling direct event:', error);
    }
  }

  private handlePresenceUpdate(data: Record<string, unknown>): void {
    try {
      const event: RealtimeEvent = {
        type: 'presence',
        data: data,
        userId: (data.user_id as string)?.toString() || ''
      };

      this.broadcastToClients(event);
      this.emit('presenceUpdate', event);
      
    } catch (error) {
      console.error('❌ Error handling presence update:', error);
    }
  }

  private handlePushNotification(data: Record<string, unknown>): void {
    try {
      console.log('🔔 Processing push notification:', data);
      
      // Handle different types of push notifications
      if (data.collapse_key === 'direct_v2_message') {
        // New message notification
        this.emit('pushNotification', {
          type: 'message',
          data: data
        });
      }
      
    } catch (error) {
      console.error('❌ Error handling push notification:', error);
    }
  }

  // WebSocket client management
  addClient(clientId: string, ws: WebSocket, userId?: string): void {
    this.connectedClients.set(clientId, ws);
    
    if (userId) {
      this.userSessions.set(userId, clientId);
    }

    ws.on('close', () => {
      this.removeClient(clientId);
    });

    ws.on('error', (error) => {
      console.error(`❌ WebSocket error for client ${clientId}:`, error);
      this.removeClient(clientId);
    });

    console.log(`✅ Client ${clientId} connected. Total clients: ${this.connectedClients.size}`);
  }

  removeClient(clientId: string): void {
    this.connectedClients.delete(clientId);
    
    // Remove from user sessions
    for (const [userId, sessionId] of this.userSessions.entries()) {
      if (sessionId === clientId) {
        this.userSessions.delete(userId);
        break;
      }
    }

    console.log(`🔌 Client ${clientId} disconnected. Total clients: ${this.connectedClients.size}`);
  }

  // Add WebSocket client for real-time updates
  addWebSocketClient(userId: string, ws: WebSocket): void {
    this.connectedClients.set(userId, ws);
    console.log(`✅ WebSocket client added for user: ${userId}`);
  }

  // Remove WebSocket client
  removeWebSocketClient(userId: string): void {
    const ws = this.connectedClients.get(userId);
    if (ws) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      this.connectedClients.delete(userId);
      console.log(`🗑️ WebSocket client removed for user: ${userId}`);
    }
  }
  
  private broadcastToWebSocketClients(message: Record<string, unknown>): void {
    try {
      // Broadcast to internal WebSocket clients
      this.connectedClients.forEach((ws, clientId) => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify(message));
          } catch (error) {
            console.error(`❌ Error sending to client ${clientId}:`, error);
            this.removeClient(clientId);
          }
        }
      });
    } catch (error) {
      console.error('Error broadcasting to WebSocket clients:', error);
    }
  }
  
  public sendMessageToUser(userId: string, message: Record<string, unknown>): boolean {
    try {
      const sessionId = this.userSessions.get(userId);
      if (sessionId) {
        const ws = this.connectedClients.get(sessionId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error sending message to user:', error);
      return false;
    }
  }

  private broadcastToClients(event: RealtimeEvent): void {
    const message = JSON.stringify(event);
    
    this.connectedClients.forEach((ws, clientId) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (error) {
          console.error(`❌ Error sending to client ${clientId}:`, error);
          this.removeClient(clientId);
        }
      }
    });
  }

  // Send message through Instagram
  async sendMessage(recipientId: string, text: string): Promise<unknown> {
    try {
      if (!this.isConnected || !this.ig) {
        throw new Error('Instagram client not connected');
      }

      // Send message using Instagram API
      const thread = this.ig.entity.directThread([recipientId]);
      const result = await thread.broadcastText(text);
      
      console.log('✅ Message sent via Instagram API:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  // Get Instagram client for other operations
  getClient(): ExtendedIgApiClient | null {
    return this.ig;
  }

  isReady(): boolean {
    return this.isConnected && this.ig !== null;
  }

  async disconnect(): Promise<void> {
    try {
      if (this.ig?.realtime) {
        // Clean up realtime connections
        this.ig.realtime.removeAllListeners();
      }
      
      if (this.ig?.fbns) {
        this.ig.fbns.removeAllListeners();
      }

      // Close all WebSocket connections
      this.connectedClients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      
      this.connectedClients.clear();
      this.userSessions.clear();
      this.isConnected = false;
      
      console.log('✅ Instagram Realtime Service disconnected');
      
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
    }
  }
}

// Singleton instance
let realtimeService: InstagramRealtimeService | null = null;

export function getRealtimeService(): InstagramRealtimeService {
  if (!realtimeService) {
    realtimeService = new InstagramRealtimeService();
  }
  return realtimeService;
}

export type { RealtimeMessage, RealtimeEvent };
export { InstagramRealtimeService };
export default getRealtimeService;