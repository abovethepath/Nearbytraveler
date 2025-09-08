/**
 * SMS Service for Event Notifications
 * Uses Twilio for SMS messaging capabilities
 */

interface EventNotificationData {
  eventTitle: string;
  eventTime: string;
  eventLocation: string;
  eventDate: string;
  userName: string;
}

interface EventReminderData {
  eventTitle: string;
  eventTime: string;
  eventLocation: string;
  userName: string;
  minutesUntilEvent: number;
}

export class SMSService {
  private twilioClient: any;
  private twilioPhoneNumber: string;

  constructor() {
    this.initializeTwilio();
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
  }

  private async initializeTwilio() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const twilio = await import('twilio');
        this.twilioClient = twilio.default(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        console.log('📱 SMS Service: Twilio initialized successfully');
      } catch (error) {
        console.error('📱 SMS Service: Failed to initialize Twilio:', error);
      }
    } else {
      console.log('📱 SMS Service: Twilio credentials not configured - SMS notifications disabled');
    }
  }

  private async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.twilioClient) {
      console.log('📱 SMS Service: Twilio not configured - SMS not sent');
      console.log(`📱 SMS would be sent to: ${to}`);
      console.log(`📱 Message: ${message}`);
      return false;
    }

    if (!this.twilioPhoneNumber) {
      console.error('📱 SMS Service: Twilio phone number not configured');
      return false;
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: to
      });

      console.log(`📱 SMS sent successfully to ${to} - SID: ${result.sid}`);
      return true;
    } catch (error) {
      console.error('📱 SMS Service: Failed to send SMS:', error);
      return false;
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digits
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Add +1 if it's a 10-digit US number
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    
    // Add + if it doesn't have it
    if (digits.length > 10 && !phoneNumber.startsWith('+')) {
      return `+${digits}`;
    }
    
    return phoneNumber;
  }

  async sendEventRSVPConfirmation(phoneNumber: string, data: EventNotificationData): Promise<boolean> {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    
    const message = `Hi ${data.userName}! ✅ You're confirmed for "${data.eventTitle}" on ${data.eventDate} at ${data.eventTime}. Location: ${data.eventLocation}. See you there! - Nearby Traveler`;

    return this.sendSMS(formattedPhone, message);
  }

  async sendEventReminder(phoneNumber: string, data: EventReminderData): Promise<boolean> {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    
    let reminderText = '';
    if (data.minutesUntilEvent <= 30) {
      reminderText = `🔔 Reminder: "${data.eventTitle}" starts in ${data.minutesUntilEvent} minutes!`;
    } else if (data.minutesUntilEvent <= 120) {
      const hours = Math.floor(data.minutesUntilEvent / 60);
      reminderText = `🔔 Reminder: "${data.eventTitle}" starts in ${hours} hour${hours > 1 ? 's' : ''}!`;
    } else {
      reminderText = `🔔 Don't forget: "${data.eventTitle}" today at ${data.eventTime}!`;
    }

    const message = `Hi ${data.userName}! ${reminderText} Location: ${data.eventLocation}. - Nearby Traveler`;

    return this.sendSMS(formattedPhone, message);
  }

  async sendEventCancellation(phoneNumber: string, eventTitle: string, userName: string): Promise<boolean> {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    
    const message = `Hi ${userName}! 🚫 Unfortunately, "${eventTitle}" has been cancelled. Check the app for alternative events. - Nearby Traveler`;

    return this.sendSMS(formattedPhone, message);
  }

  async sendEventUpdate(phoneNumber: string, eventTitle: string, updateMessage: string, userName: string): Promise<boolean> {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    
    const message = `Hi ${userName}! 📝 Update for "${eventTitle}": ${updateMessage} - Nearby Traveler`;

    return this.sendSMS(formattedPhone, message);
  }

  async sendWelcomeSMS(phoneNumber: string, userName: string): Promise<boolean> {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    
    const message = `Welcome to Nearby Traveler, ${userName}! 🌍 You'll get SMS updates for events you RSVP to. Reply STOP to opt out. Happy traveling!`;

    return this.sendSMS(formattedPhone, message);
  }

  // Utility method to validate phone numbers
  isValidPhoneNumber(phoneNumber: string): boolean {
    const digits = phoneNumber.replace(/\D/g, '');
    // Accept 10-digit US numbers or 11+ digit international numbers
    return digits.length >= 10;
  }
}

export const smsService = new SMSService();