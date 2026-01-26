import { Redis } from "ioredis";

const CHANNEL_PREFIX = "nt:ws:";

type MessageHandler = (channel: string, message: any) => void;

class RedisPubSubService {
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private isConnected = false;
  private instanceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  constructor() {
    if (process.env.REDIS_URL) {
      try {
        this.publisher = new Redis(process.env.REDIS_URL);
        this.subscriber = new Redis(process.env.REDIS_URL);

        this.publisher.on("connect", () => {
          this.isConnected = true;
          console.log(`✅ Redis PubSub: Publisher connected (instance ${this.instanceId})`);
        });

        this.publisher.on("error", (err) => {
          console.error("❌ Redis PubSub publisher error:", err.message);
          this.isConnected = false;
        });

        this.subscriber.on("connect", () => {
          console.log(`✅ Redis PubSub: Subscriber connected (instance ${this.instanceId})`);
        });

        this.subscriber.on("error", (err) => {
          console.error("❌ Redis PubSub subscriber error:", err.message);
        });

        this.subscriber.on("message", (channel, message) => {
          this.handleMessage(channel, message);
        });

      } catch (error) {
        console.log("⚠️ Redis PubSub: Failed to initialize, WebSocket scaling disabled");
      }
    } else {
      console.log("⚠️ Redis PubSub: No REDIS_URL, running in single-instance mode");
    }
  }

  private handleMessage(channel: string, rawMessage: string) {
    try {
      const data = JSON.parse(rawMessage);
      
      if (data._instanceId === this.instanceId) {
        return;
      }

      const handlers = this.handlers.get(channel) || [];
      for (const handler of handlers) {
        handler(channel, data);
      }
    } catch (error) {
      console.error("Redis PubSub: Failed to parse message:", error);
    }
  }

  async subscribe(channel: string, handler: MessageHandler): Promise<void> {
    const fullChannel = `${CHANNEL_PREFIX}${channel}`;
    
    if (!this.handlers.has(fullChannel)) {
      this.handlers.set(fullChannel, []);
    }
    this.handlers.get(fullChannel)!.push(handler);

    if (this.subscriber) {
      await this.subscriber.subscribe(fullChannel);
    }
  }

  async publish(channel: string, message: any): Promise<void> {
    const fullChannel = `${CHANNEL_PREFIX}${channel}`;
    
    if (this.publisher && this.isConnected) {
      const payload = JSON.stringify({
        ...message,
        _instanceId: this.instanceId,
        _timestamp: Date.now()
      });
      await this.publisher.publish(fullChannel, payload);
    }
  }

  async publishChatEvent(chatroomId: number, chatType: string, event: any): Promise<void> {
    await this.publish(`chat:${chatType}:${chatroomId}`, event);
  }

  async subscribeChatroom(chatroomId: number, chatType: string, handler: MessageHandler): Promise<void> {
    await this.subscribe(`chat:${chatType}:${chatroomId}`, handler);
  }

  async publishUserEvent(userId: number, event: any): Promise<void> {
    await this.publish(`user:${userId}`, event);
  }

  async subscribeUserEvents(userId: number, handler: MessageHandler): Promise<void> {
    await this.subscribe(`user:${userId}`, handler);
  }

  isAvailable(): boolean {
    return this.isConnected;
  }

  getInstanceId(): string {
    return this.instanceId;
  }
}

export const redisPubSub = new RedisPubSubService();
