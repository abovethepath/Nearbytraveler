/**
 * Data Fix Script: Add missing organizers to chatroom_members
 * 
 * Problem: Some quick meetups have chatrooms but organizers missing from chatroom_members
 * Solution: Backfill missing organizer memberships with admin role
 */

import { db } from '../server/db';
import { quickMeetups, meetupChatrooms, chatroomMembers } from '../shared/schema';
import { eq, and, notExists } from 'drizzle-orm';

async function fixMissingChatroomMembers() {
  try {
    console.log('🔧 Starting chatroom members fix...\n');

    // Find all quick meetups that have chatrooms but organizers not in chatroom_members
    const brokenMeetups = await db
      .select({
        meetupId: quickMeetups.id,
        organizerId: quickMeetups.organizerId,
        chatroomId: meetupChatrooms.id,
        title: quickMeetups.title
      })
      .from(quickMeetups)
      .innerJoin(meetupChatrooms, eq(quickMeetups.id, meetupChatrooms.meetupId))
      .where(
        and(
          eq(quickMeetups.isActive, true),
          notExists(
            db
              .select()
              .from(chatroomMembers)
              .where(
                and(
                  eq(chatroomMembers.chatroomId, meetupChatrooms.id),
                  eq(chatroomMembers.userId, quickMeetups.organizerId)
                )
              )
          )
        )
      );

    if (brokenMeetups.length === 0) {
      console.log('✅ All quick meetup organizers are already chatroom members. Nothing to fix!');
      return;
    }

    console.log(`Found ${brokenMeetups.length} meetups with missing organizer memberships:\n`);
    
    for (const meetup of brokenMeetups) {
      console.log(`  - Meetup #${meetup.meetupId}: "${meetup.title}"`);
      console.log(`    Organizer: ${meetup.organizerId}, Chatroom: ${meetup.chatroomId}`);
    }

    console.log('\n🔨 Adding missing memberships...\n');

    // Use transaction to ensure atomicity
    await db.transaction(async (tx) => {
      for (const meetup of brokenMeetups) {
        await tx.insert(chatroomMembers).values({
          chatroomId: meetup.chatroomId,
          userId: meetup.organizerId,
          role: 'admin',
          isActive: true
        });
        
        console.log(`  ✅ Added user ${meetup.organizerId} to chatroom ${meetup.chatroomId}`);
      }
    });

    console.log(`\n✅ Successfully fixed ${brokenMeetups.length} chatroom memberships!`);

  } catch (error) {
    console.error('❌ Error fixing chatroom members:', error);
    throw error;
  }
}

// Run the fix
fixMissingChatroomMembers()
  .then(() => {
    console.log('\n✨ Fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fix failed:', error);
    process.exit(1);
  });
