// WebSocket Instant Messaging Service
class WebSocketService {
  private ws: WebSocket | null = null;
  private userId: number | null = null;
  private username: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private isAuthenticated = false;
  
  // Event listeners
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeAudioContext();
  }

  // Audio context for notification sounds
  private audioContext: AudioContext | null = null;

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported');
    }
  }

  // Play notification sound
  private playNotificationSound() {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  connect(userId: number, username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userId = userId;
      this.username = username;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      console.log('🔗 Connecting to WebSocket:', wsUrl);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('🟢 WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Authenticate immediately
        this.authenticate();
        
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔴 WebSocket disconnected:', event.code, event.reason);
        this.isAuthenticated = false;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('🔴 WebSocket error:', error);
        reject(error);
      };
    });
  }

  private authenticate() {
    if (this.ws?.readyState === WebSocket.OPEN && this.userId && this.username) {
      this.ws.send(JSON.stringify({
        type: 'auth',
        userId: this.userId,
        username: this.username
      }));
      this.isAuthenticated = true;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    // Dramatically reduce reconnection frequency to prevent spam
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectInterval * Math.pow(3, this.reconnectAttempts - 1), 60000); // Cap at 60 seconds, slower exponential backoff
    
    console.log(`WebSocket reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.userId && this.username && this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect(this.userId, this.username).catch(console.error);
      }
    }, delay);
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'friends_online':
        this.emit('friends_online', data.friends);
        break;

      case 'friend_status_update':
        this.emit('friend_status_update', {
          userId: data.userId,
          username: data.username,
          status: data.status
        });
        break;

      case 'instant_message_received':
        this.emit('instant_message', data.message);
        break;

      case 'im_alert':
        this.handleIMAlert(data);
        break;

      case 'user_typing':
        this.emit('user_typing', {
          senderId: data.senderId,
          senderUsername: data.senderUsername,
          isTyping: data.isTyping
        });
        break;

      case 'message_sent':
        this.emit('message_sent', {
          messageId: data.messageId,
          delivered: data.delivered
        });
        break;

      case 'message_read':
        this.emit('message_read', {
          messageId: data.messageId,
          readBy: data.readBy
        });
        break;

      case 'error':
        console.error('WebSocket server error:', data.message);
        break;

      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  private handleIMAlert(data: any) {
    // Play notification sound
    if (data.sound) {
      this.playNotificationSound();
    }

    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`New message from ${data.from}`, {
        body: data.preview,
        icon: '/icon-32x32.png',
        badge: '/icon-32x32.png',
        tag: `im-${data.from}`,
        requireInteraction: false
      });
    }

    // Emit event for UI components
    this.emit('im_alert', {
      from: data.from,
      preview: data.preview,
      timestamp: new Date()
    });
  }

  // Send instant message
  sendInstantMessage(receiverId: number, content: string) {
    if (this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated) {
      this.ws.send(JSON.stringify({
        type: 'instant_message',
        receiverId,
        content,
        senderId: this.userId
      }));
    } else {
      console.error('WebSocket not connected or not authenticated');
    }
  }

  // Send typing indicator
  sendTypingIndicator(receiverId: number, isTyping: boolean) {
    if (this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated) {
      this.ws.send(JSON.stringify({
        type: 'typing',
        receiverId,
        senderId: this.userId,
        isTyping
      }));
    }
  }

  // Mark message as read
  markAsRead(messageId: number, senderId: number) {
    if (this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated) {
      this.ws.send(JSON.stringify({
        type: 'mark_read',
        messageId,
        senderId
      }));
    }
  }

  // Update user status
  updateStatus(status: 'online' | 'away' | 'offline') {
    if (this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated) {
      this.ws.send(JSON.stringify({
        type: 'status_update',
        status
      }));
    }
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Request notification permission
  static async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  disconnect() {
    if (this.ws) {
      this.updateStatus('offline');
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
    this.isAuthenticated = false;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;