// Email Service for Nearby Traveler Platform
import { 
  welcomeEmail, 
  passwordResetEmail, 
  referralEmail, 
  connectionRequestEmail, 
  eventInviteEmail, 
  businessOfferEmail,
  weeklyDigestEmail,
  locationMatchEmail,
  forgotPasswordEmail,
  type WelcomeEmailData,
  type PasswordResetData,
  type ReferralEmailData,
  type ConnectionRequestData,
  type EventInviteData,
  type BusinessOfferData,
  type LocationMatchData
} from '../templates/emailTemplates.js';
import sgMail from '@sendgrid/mail';

export class EmailService {
  private sgMail: any;
  private isInitialized: boolean = false;

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    console.log('🔍 SENDGRID DEBUG: Checking initialization. Current state:', {
      isInitialized: this.isInitialized,
      hasApiKey: !!process.env.SENDGRID_API_KEY,
      apiKeyPrefix: process.env.SENDGRID_API_KEY?.substring(0, 10)
    });

    if (this.isInitialized) {
      console.log('✅ SendGrid already initialized');
      return;
    }

    if (process.env.SENDGRID_API_KEY) {
      try {
        console.log('🔧 Attempting SendGrid initialization...');
        this.sgMail = sgMail;
        this.sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        this.isInitialized = true;
        console.log('✅ SendGrid initialized successfully with key starting with:', process.env.SENDGRID_API_KEY.substring(0, 10));
      } catch (error) {
        console.error('❌ SendGrid initialization failed:', error);
      }
    } else {
      console.log('⚠️ SENDGRID_API_KEY not found - emails will not be sent');
    }
  }

  private async sendEmail(to: string, subject: string, html: string, text?: string) {
    // Ensure initialization before each send
    this.ensureInitialized();
    
    if (!this.sgMail || !this.isInitialized) {
      console.log('SendGrid not properly initialized - email not sent');
      console.log(`Email would be sent to: ${to}`);
      console.log(`Subject: ${subject}`);
      return false;
    }

    try {
      const msg = {
        to,
        from: 'aaron_marc2004@yahoo.com', // Verified sender address
        subject,
        html,
        text
      };

      console.log('📧 Sending email:', { to, from: msg.from, subject });

      await this.sgMail.send(msg);
      console.log(`Email sent successfully to ${to}: ${subject}`);
      return true;
    } catch (error: any) {
      console.error('📧 SendGrid Email sending failed:', error.message);
      if (error.code === 401) {
        console.error('❌ SendGrid API authentication failed (401 Unauthorized)');
        const errorBody = error.response?.body;
        console.error('🔍 Error details:', JSON.stringify(errorBody, null, 2));
        
        // Check for specific error conditions
        if (errorBody?.errors?.some((e: any) => e.message?.includes('Maximum credits exceeded'))) {
          console.error('💳 CRITICAL: SendGrid account has exceeded its credit limit!');
          console.error('📞 Contact the account owner to add more SendGrid credits.');
        } else {
          console.error('🔍 This usually means:');
          console.error('   1. API key is invalid/expired');
          console.error('   2. Sender email domain is not verified in SendGrid');
          console.error('   3. API key does not have permission to send emails');
        }
      }
      return false;
    }
  }

  async sendWelcomeEmail(to: string, data: WelcomeEmailData) {
    const template = welcomeEmail(data);
    return this.sendEmail(to, template.subject, template.html, template.text);
  }

  async sendPasswordResetEmail(to: string, data: PasswordResetData) {
    const template = passwordResetEmail(data);
    return this.sendEmail(to, template.subject, template.html, template.text);
  }

  async sendForgotPasswordEmail(to: string, data: PasswordResetData) {
    const template = forgotPasswordEmail(data);
    return this.sendEmail(to, template.subject, template.html, template.text);
  }

  async sendLocationMatchEmail(to: string, data: LocationMatchData) {
    const template = locationMatchEmail(data);
    return this.sendEmail(to, template.subject, template.html, template.text);
  }

  async sendReferralEmail(to: string, data: ReferralEmailData) {
    const template = referralEmail(data);
    return this.sendEmail(to, template.subject, template.html, template.text);
  }

  async sendConnectionRequestEmail(to: string, data: ConnectionRequestData) {
    const template = connectionRequestEmail(data);
    return this.sendEmail(to, template.subject, template.html, template.text);
  }

  async sendEventInviteEmail(to: string, data: EventInviteData) {
    const template = eventInviteEmail(data);
    return this.sendEmail(to, template.subject, template.html, template.text);
  }

  async sendBusinessOfferEmail(to: string, data: BusinessOfferData) {
    const template = businessOfferEmail(data);
    return this.sendEmail(to, template.subject, template.html, template.text);
  }

  async sendWeeklyDigestEmail(to: string, data: {
    name: string;
    newConnections: number;
    newEvents: number;
    newOffers: number;
    location: string;
  }) {
    const template = weeklyDigestEmail(data);
    return this.sendEmail(to, template.subject, template.html, template.text);
  }

  async sendWeeklyNewUsersDigest(to: string, data: {
    recipientName: string;
    city: string;
    newUsers: Array<{
      username: string;
      userType: string;
      interests: string[];
      joinDate: Date;
    }>;
    weekStart: Date;
    weekEnd: Date;
  }) {
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });

    const subject = `New Update: ${data.newUsers.length} new people joined ${data.city} recently`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">Nearby Traveler</h1>
          <p style="color: #6b7280; margin: 5px 0;">Community Update</p>
        </div>

        <h2 style="color: #1f2937;">Hi ${data.recipientName}!</h2>
        
        <p style="color: #374151; line-height: 1.6;">
          Here's who joined the ${data.city} community recently (${formatDate(data.weekStart)} - ${formatDate(data.weekEnd)}):
        </p>

        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
          ${data.newUsers.map(user => `
            <div style="border-bottom: 1px solid #e5e7eb; padding: 15px 0; margin-bottom: 15px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <strong style="color: #1f2937;">@${user.username}</strong>
                <span style="background-color: #3b82f6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; text-transform: capitalize;">
                  ${user.userType}
                </span>
              </div>
              ${user.interests.length > 0 ? `
                <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">
                  Interested in: ${user.interests.slice(0, 3).join(', ')}${user.interests.length > 3 ? '...' : ''}
                </p>
              ` : ''}
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                Joined ${formatDate(user.joinDate)}
              </p>
            </div>
          `).join('')}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://www.thenearbytraveler.com/discover" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Discover & Connect
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          Want to reach out? Send them a message or plan a meetup!
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          You're receiving this because you're part of the ${data.city} community on Nearby Traveler.
          <br>
          <a href="#" style="color: #3b82f6;">Manage email preferences</a>
        </p>
      </div>
    `;

    const text = `Weekly Community Update for ${data.city}

Hi ${data.recipientName}!

Here's who joined the ${data.city} community this week (${formatDate(data.weekStart)} - ${formatDate(data.weekEnd)}):

${data.newUsers.map(user => 
  `• @${user.username} (${user.userType}) - ${user.interests.slice(0, 3).join(', ')} - Joined ${formatDate(user.joinDate)}`
).join('\n')}

Discover & Connect: https://www.thenearbytraveler.com/discover

Want to reach out? Send them a message or plan a meetup!

You're receiving this because you're part of the ${data.city} community on Nearby Traveler.`;

    return this.sendEmail(to, subject, html, text);
  }

  async sendBusinessReferralInvitation(data: {
    to: string;
    referrerName: string;
    referrerUsername: string;
    message?: string;
  }): Promise<boolean> {
    const defaultMessage = `Hi! I'd like to invite you to join Nearby Traveler, a platform that helps businesses connect with travelers. When you sign up, please mention my username: ${data.referrerUsername}. You can register at: https://www.thenearbytraveler.com/signup-business`;
    
    const finalMessage = data.message || defaultMessage;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3b82f6;">Business Invitation to Nearby Traveler</h2>
        <p>Hello!</p>
        <p>${data.referrerName} (${data.referrerUsername}) has invited you to join Nearby Traveler's business network.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;">${finalMessage}</p>
        </div>
        <p>Nearby Traveler connects businesses with travelers and locals to help grow your customer base.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://www.thenearbytraveler.com/signup-business" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Join Nearby Traveler Business Network
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Remember to mention ${data.referrerUsername} when you sign up!</p>
      </div>
    `;
    
    const text = `Business Invitation to Nearby Traveler\n\n${data.referrerName} (${data.referrerUsername}) has invited you to join Nearby Traveler's business network.\n\n${finalMessage}\n\nJoin at: https://www.thenearbytraveler.com/signup-business\n\nRemember to mention ${data.referrerUsername} when you sign up!`;
    
    return this.sendEmail(
      data.to,
      `Business Invitation to Nearby Traveler from ${data.referrerName}`,
      html,
      text
    );
  }
}

export const emailService = new EmailService();