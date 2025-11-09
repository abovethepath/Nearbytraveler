export interface MessageReaction {
  type: 'heart' | 'thumbsup' | 'thumbsdown';
  count: number;
  userReacted?: boolean;
}

export interface MessageWithMeta {
  id: number | string;
  content: string;
  createdAt: string | Date;
  senderId?: number;
  senderName?: string;
  senderAvatar?: string;
  reactions?: MessageReaction[];
}

export interface MessageGroupData {
  timestamp: string;
  messages: MessageWithMeta[];
}
