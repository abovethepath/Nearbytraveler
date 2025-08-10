import { storage } from '../storage';

interface EventReminder {
  eventId: number;
  userId: number;
  eventTitle: string;
  eventDate: Date;
  eventLocation: string;
  userEmail: string;
  userName: string;
  reminderType: '36h' | '4h';
}

export class EventReminderService {
  private sgMail: any;

  constructor() {
    this.initializeSendGrid();
  }

  private async initializeSendGrid() {
    if (process.env.SENDGRID_API_KEY) {
      const sgMail = await import('@sendgrid/mail');
      this.sgMail = sgMail.default;
      this.sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }
  
  /**
   * Check for upcoming events and send reminders
   */
  async sendUpcomingEventReminders(): Promise<void> {
    try {
      console.log('Checking for upcoming events requiring reminders...');
      
      // Get all upcoming events in the next 24 hours
      const upcomingEvents = await this.getUpcomingEvents();
      
      for (const event of upcomingEvents) {
        await this.processEventReminders(event);
      }
      
      console.log(`Processed reminders for ${upcomingEvents.length} upcoming events`);
    } catch (error) {
      console.error('Error sending event reminders:', error);
    }
  }

  /**
   * Get all events happening in the next 36 hours (for advance notice) and next 4 hours (for final reminder)
   */
  private async getUpcomingEvents(): Promise<any[]> {
    try {
      const now = new Date();
      const in36Hours = new Date(now.getTime() + 36 * 60 * 60 * 1000);
      
      // Get all events with participants
      const events = await storage.getAllEventsWithParticipants();
      
      // Filter events happening in the next 36 hours
      return events.filter((event: any) => {
        const eventDate = new Date(event.date);
        return eventDate > now && eventDate <= in36Hours;
      });
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      return [];
    }
  }

  /**
   * Process reminders for a specific event
   */
  private async processEventReminders(event: any): Promise<void> {
    try {
      const eventDate = new Date(event.date);
      const now = new Date();
      const timeDiff = eventDate.getTime() - now.getTime();
      const hoursUntilEvent = timeDiff / (1000 * 60 * 60);

      let reminderType: '36h' | '4h' | null = null;

      // Determine which reminder to send - 36 hours and 4 hours prior
      if (hoursUntilEvent <= 36 && hoursUntilEvent > 35) {
        reminderType = '36h';    // 36 hours ahead for planning
      } else if (hoursUntilEvent <= 4 && hoursUntilEvent > 3) {
        reminderType = '4h';     // 4 hours ahead for final reminder
      }

      if (!reminderType) return;

      // Process participants from the aggregated data
      if (event.participants && Array.isArray(event.participants)) {
        for (const participant of event.participants) {
          if (participant.status === 'confirmed' && participant.userEmail) {
            await this.sendEventReminder({
              eventId: event.id,
              userId: participant.userId,
              eventTitle: event.title,
              eventDate: eventDate,
              eventLocation: event.location,
              userEmail: participant.userEmail,
              userName: participant.userName,
              reminderType
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error processing reminders for event ${event.id}:`, error);
    }
  }

  /**
   * Send individual event reminder email
   */
  private async sendEventReminder(reminder: EventReminder): Promise<void> {
    if (!this.sgMail) {
      console.log('SendGrid not configured - reminder email not sent');
      return;
    }

    try {
      const { eventTitle, eventDate, eventLocation, userEmail, userName, reminderType } = reminder;
      
      const timeText = this.getTimeText(reminderType);
      const eventTimeFormatted = eventDate.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      const subject = `Reminder: ${eventTitle} is ${timeText}!`;
      
      const htmlContent = this.createReminderEmailTemplate({
        userName,
        eventTitle,
        eventTimeFormatted,
        eventLocation,
        timeText,
        reminderType
      });

      const textContent = `
Hi ${userName},

This is a friendly reminder that your event "${eventTitle}" is ${timeText}!

Event Details:
📅 When: ${eventTimeFormatted}
📍 Where: ${eventLocation}

Don't forget to bring everything you need and arrive on time. We're excited to see you there!

Best regards,
The Nearby Traveler Team

Visit: https://nearbytraveler.com
      `.trim();

      const msg = {
        to: userEmail,
        from: 'aaron_marc2004@yahoo.com',
        subject,
        html: htmlContent,
        text: textContent
      };

      await this.sgMail.send(msg);
      console.log(`Event reminder sent to ${userEmail} for event: ${eventTitle} (${reminderType})`);
    } catch (error) {
      console.error(`Error sending reminder to ${reminder.userEmail}:`, error);
    }
  }

  /**
   * Get time text for reminder type
   */
  private getTimeText(reminderType: '36h' | '4h'): string {
    switch (reminderType) {
      case '36h': return 'in 36 hours';
      case '4h': return 'in 4 hours';
      default: return 'soon';
    }
  }

  /**
   * Create HTML email template for event reminders
   */
  private createReminderEmailTemplate(data: {
    userName: string;
    eventTitle: string;
    eventTimeFormatted: string;
    eventLocation: string;
    timeText: string;
    reminderType: string;
  }): string {
    const { userName, eventTitle, eventTimeFormatted, eventLocation, timeText, reminderType } = data;
    
    const urgencyColor = reminderType === '4h' ? '#f59e0b' : '#3b82f6';
    const urgencyEmoji = reminderType === '4h' ? '⏰' : '📅';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Reminder - ${eventTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #f97316 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">The Nearby Traveler</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Event Reminder</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            
            <!-- Reminder Alert -->
            <div style="background-color: ${urgencyColor}; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
                <h2 style="margin: 0; font-size: 20px;">${urgencyEmoji} Event ${timeText.charAt(0).toUpperCase() + timeText.slice(1)}!</h2>
            </div>

            <!-- Greeting -->
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px;">Hi ${userName},</h2>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
                This is a friendly reminder that your event <strong>"${eventTitle}"</strong> is ${timeText}!
            </p>

            <!-- Event Details Card -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Event Details</h3>
                
                <div style="margin: 15px 0;">
                    <div style="display: inline-block; width: 20px; color: #3b82f6;">📅</div>
                    <strong style="color: #333;">When:</strong> 
                    <span style="color: #666;">${eventTimeFormatted}</span>
                </div>
                
                <div style="margin: 15px 0;">
                    <div style="display: inline-block; width: 20px; color: #3b82f6;">📍</div>
                    <strong style="color: #333;">Where:</strong> 
                    <span style="color: #666;">${eventLocation}</span>
                </div>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://nearbytraveler.com/event-details/${data.eventTitle.toLowerCase().replace(/\s+/g, '-')}" 
                   style="background: linear-gradient(135deg, #3b82f6 0%, #f97316 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold; 
                          font-size: 16px;
                          display: inline-block;
                          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                    View Event Details
                </a>
            </div>

            <!-- Tips -->
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px 20px; margin: 25px 0;">
                <p style="color: #1e40af; margin: 0; font-size: 14px;">
                    💡 <strong>Pro Tip:</strong> Don't forget to bring everything you need and arrive on time. We're excited to see you there!
                </p>
            </div>

            <!-- Closing -->
            <p style="color: #666; line-height: 1.6; margin: 25px 0 0 0; font-size: 16px;">
                Best regards,<br>
                <strong style="color: #333;">The Nearby Traveler Team</strong>
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #666; margin: 0; font-size: 14px;">
                <a href="https://nearbytraveler.com" style="color: #3b82f6; text-decoration: none;">Visit The Nearby Traveler</a> |
                <a href="mailto:aaron_marc2004@yahoo.com" style="color: #3b82f6; text-decoration: none;">Contact Support</a>
            </p>
            <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">
                Connecting Travelers Around The World
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }
}

export const eventReminderService = new EventReminderService();