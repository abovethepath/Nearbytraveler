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

export class EmailService {
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

  private async sendEmail(to: string, subject: string, html: string, text?: string) {
    if (!this.sgMail) {
      console.log('SendGrid not configured - email not sent');
      console.log(`Email would be sent to: ${to}`);
      console.log(`Subject: ${subject}`);
      return false;
    }

    try {
      const msg = {
        to,
        from: 'aaron_marc2004@yahoo.com', // Your verified email address
        subject,
        html,
        text
      };

      await this.sgMail.send(msg);
      console.log(`Email sent successfully to ${to}: ${subject}`);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
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