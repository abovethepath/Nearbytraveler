import { db } from "./db";
import { meetupChatrooms, meetupChatroomMessages, chatroomMembers, users } from "../shared/schema";
import { eq, and, desc, sql, inArray, isNotNull } from "drizzle-orm";

interface CreateOrJoinChatroomParams {
  meetupId?: number | null;
  availableNowId?: number | null;
  hostUserId: number;
  joinerUserId: number;
  chatroomName: string;
  description: string;
  city: string;
  state?: string | null;
  country: string;
  activityType?: string | null;
  expiresAt: Date;
}

interface CreateOrJoinResult {
  chatroomId: number;
  isNew: boolean;
  chatroom: any;
}

export async function createOrJoinMeetupChatroom(params: CreateOrJoinChatroomParams): Promise<CreateOrJoinResult> {
  const { meetupId, availableNowId, hostUserId, joinerUserId, chatroomName, description, city, state, country, activityType, expiresAt } = params;

  const [hostUser] = await db.select({ username: users.username }).from(users).where(eq(users.id, hostUserId)).limit(1);
  const [joinerUser] = await db.select({ username: users.username }).from(users).where(eq(users.id, joinerUserId)).limit(1);
  const hostName = hostUser?.username || "Someone";
  const joinerName = joinerUser?.username || "Someone";

  const lookupConditions = [];
  if (meetupId) lookupConditions.push(eq(meetupChatrooms.meetupId, meetupId));
  if (availableNowId) lookupConditions.push(eq(meetupChatrooms.availableNowId, availableNowId));

  let existingChatroom: any = null;
  if (lookupConditions.length > 0) {
    const [found] = await db.select()
      .from(meetupChatrooms)
      .where(and(...lookupConditions, eq(meetupChatrooms.isActive, true)))
      .limit(1);
    existingChatroom = found || null;
  }

  if (existingChatroom) {
    const inserted = await addMemberToChatroom(existingChatroom.id, joinerUserId, 'member');

    if (inserted) {
      await db.update(meetupChatrooms)
        .set({ participantCount: sql`${meetupChatrooms.participantCount} + 1` })
        .where(eq(meetupChatrooms.id, existingChatroom.id));

      await db.insert(meetupChatroomMessages).values({
        meetupChatroomId: existingChatroom.id,
        userId: joinerUserId,
        username: joinerName,
        message: `@${joinerName} joined the meetup! 🎉`,
        messageType: 'system',
      });

      try {
        const { chatWebSocketService } = await import('./services/chatWebSocketService.js');
        await chatWebSocketService.broadcastMemberUpdate(existingChatroom.id, 'meetup', joinerUserId, joinerName);
      } catch {}
    }

    return { chatroomId: existingChatroom.id, isNew: false, chatroom: existingChatroom };
  }

  const isSameUser = hostUserId === joinerUserId;
  const [newChatroom] = await db.insert(meetupChatrooms).values({
    meetupId: meetupId || null,
    availableNowId: availableNowId || null,
    chatroomName,
    description,
    city: (city || 'Unknown').trim() || 'Unknown',
    state: state || null,
    country: (country || 'USA').trim() || 'USA',
    activityType: activityType || null,
    isActive: true,
    expiresAt,
    participantCount: isSameUser ? 1 : 2,
  }).returning();

  console.log(`[CHATROOM UTILS] Created chatroom ${newChatroom.id}: "${chatroomName}" (meetupId=${meetupId}, availableNowId=${availableNowId})`);

  await db.insert(meetupChatroomMessages).values({
    meetupChatroomId: newChatroom.id,
    userId: hostUserId,
    username: hostName,
    message: isSameUser
      ? `Group chat created by @${hostName}! Everyone accepted will join here automatically. 🤝`
      : `Group chat created! @${hostName} and @${joinerName} are meeting up. Everyone accepted will join here automatically. 🤝`,
    messageType: 'system',
  });

  const memberRows = [
    { chatroomId: newChatroom.id, userId: hostUserId, role: 'admin' as const, isActive: true },
  ];
  if (!isSameUser) {
    memberRows.push({ chatroomId: newChatroom.id, userId: joinerUserId, role: 'member' as const, isActive: true });
  }
  await db.insert(chatroomMembers).values(memberRows).onConflictDoNothing();

  return { chatroomId: newChatroom.id, isNew: true, chatroom: newChatroom };
}

export async function addMemberToChatroom(chatroomId: number, userId: number, role: string = 'member'): Promise<boolean> {
  const result = await db.insert(chatroomMembers).values({
    chatroomId,
    userId,
    role,
    isActive: true,
  }).onConflictDoNothing().returning();
  return result.length > 0;
}

export async function getUserMeetupChatrooms(userId: number): Promise<any[]> {
  const memberRows = await db.select({ chatroomId: chatroomMembers.chatroomId })
    .from(chatroomMembers)
    .where(and(
      eq(chatroomMembers.userId, userId),
      eq(chatroomMembers.isActive, true)
    ));

  if (memberRows.length === 0) return [];

  const chatroomIds = memberRows.map(r => r.chatroomId);

  const chatrooms = await db.select()
    .from(meetupChatrooms)
    .where(and(
      inArray(meetupChatrooms.id, chatroomIds),
      eq(meetupChatrooms.isActive, true)
    ))
    .orderBy(desc(meetupChatrooms.createdAt));

  return chatrooms;
}
