// Email Templates for Nearby Traveler Platform

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface WelcomeEmailData {
  name: string;
  username: string;
  userType: 'local' | 'business' | 'traveler';
}

export interface PasswordResetData {
  name: string;
  resetUrl: string;
  expiryHours: number;
}

export interface ReferralEmailData {
  referrerName: string;
  referralCode: string;
  joinUrl: string;
}

export interface ConnectionRequestData {
  senderName: string;
  senderLocation: string;
  message?: string;
  profileUrl: string;
}

export interface EventInviteData {
  eventName: string;
  eventDate: string;
  eventLocation: string;
  inviterName: string;
  eventUrl: string;
}

export interface BusinessOfferData {
  businessName: string;
  offerTitle: string;
  discount: string;
  validUntil: string;
  businessUrl: string;
}

const emailStyles = `
  <style>
    .email-container {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #f97316 100%);
      padding: 30px 20px;
      text-align: center;
    }
    .logo {
      color: white;
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .tagline {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
    }
    .content {
      padding: 40px 30px;
      line-height: 1.6;
      color: #333333;
    }
    .greeting {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #1f2937;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #f97316 100%);
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      background-color: #f8fafc;
      padding: 25px 30px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .highlight {
      background-color: #dbeafe;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
      margin: 20px 0;
    }
    .stats {
      display: inline-block;
      margin: 10px 15px;
      text-align: center;
    }
    .stats-number {
      font-size: 24px;
      font-weight: bold;
      color: #3b82f6;
    }
    .stats-label {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
  </style>
`;

export const welcomeEmail = (data: WelcomeEmailData): EmailTemplate => ({
  subject: `Welcome to Nearby Traveler, ${data.name}! 🌍`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Nearby Traveler</title>
      ${emailStyles}
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
      <div class="email-container">
        <div class="header">
          <div class="logo">Nearby Traveler</div>
          <div class="tagline">Connect with Locals & Travelers Worldwide</div>
        </div>
        
        <div class="content">
          <div class="greeting">Welcome, ${data.name}! 👋</div>
          
          <p>Congratulations on joining Nearby Traveler as a <strong>${data.userType === 'business' ? 'Business' : data.userType === 'local' ? 'Local' : 'Traveler'}</strong>! You're now part of a global community that connects amazing people through shared interests and travel experiences.</p>
          
          ${data.userType === 'business' ? `
            <div class="highlight">
              <strong>🏢 Business Benefits:</strong><br>
              • Connect with your Target Market who are Nearby Travelers and locals in your area<br>
              • Promote special offers and deals<br>
              • Build authentic relationships with your community<br>
              • Access our business dashboard for insights
            </div>
          ` : `
            <div class="highlight">
              <strong>🌟 What's Next:</strong><br>
              • Complete your profile with interests and activities (as many as you possibly can)<br>
              • Add your travel plans to connect with others<br>
              • Upload photos to showcase your personality (add travel photos as you travel)<br>
              • Start discovering events and connecting with people
            </div>
          `}
          
          <p><strong>Your username:</strong> @${data.username}</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nearbytraveler.com/profile" class="button">Complete Your Profile</a>
          </div>
          

          
          <p>Need help getting started? Check out our <a href="https://nearbytraveler.com/getting-started" style="color: #3b82f6;">Getting Started Guide</a> or reply to this email with any questions.</p>
          
          <p>Happy connecting!<br>
          <strong>The Nearby Traveler Team</strong></p>
        </div>
        
        <div class="footer">
          <p>© 2025 Nearby Traveler. All rights reserved.</p>
          <p>
            <a href="https://nearbytraveler.com/privacy" style="color: #6b7280;">Privacy Policy</a> | 
            <a href="https://nearbytraveler.com/terms" style="color: #6b7280;">Terms of Service</a> | 
            <a href="https://nearbytraveler.com/settings" style="color: #6b7280;">Email Preferences</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `Welcome to Nearby Traveler, ${data.name}!

You're now part of a global community connecting amazing people through shared interests and travel experiences.

Your username: @${data.username}

Complete your profile: https://nearbytraveler.com/profile
Getting started guide: https://nearbytraveler.com/getting-started

Happy connecting!
The Nearby Traveler Team`
});

export const passwordResetEmail = (data: PasswordResetData): EmailTemplate => ({
  subject: "Reset Your Nearby Traveler Password",
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - Nearby Traveler</title>
      ${emailStyles}
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
      <div class="email-container">
        <div class="header">
          <div class="logo">Nearby Traveler</div>
          <div class="tagline">Password Reset Request</div>
        </div>
        
        <div class="content">
          <div class="greeting">Hello ${data.name},</div>
          
          <p>We received a request to reset your password for your Nearby Traveler account.</p>
          
          <div class="highlight">
            <strong>🔒 Security Notice:</strong><br>
            This link will expire in <strong>${data.expiryHours} hour${data.expiryHours > 1 ? 's' : ''}</strong> for your security.
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetUrl}" class="button">Reset My Password</a>
          </div>
          
          <p><strong>If you didn't request this:</strong></p>
          <p>No worries! Your account is still secure. Simply ignore this email and your password will remain unchanged.</p>
          
          <p>For security reasons, if you continue to receive these emails, please contact our support team.</p>
          
          <p>Best regards,<br>
          <strong>Nearby Traveler Security Team</strong></p>
        </div>
        
        <div class="footer">
          <p>This is an automated security email. Please do not reply.</p>
          <p>© 2025 Nearby Traveler. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `Password Reset - Nearby Traveler

Hello ${data.name},

We received a request to reset your password. Click the link below to reset it:

${data.resetUrl}

This link expires in ${data.expiryHours} hour${data.expiryHours > 1 ? 's' : ''}.

If you didn't request this, simply ignore this email.

Nearby Traveler Security Team`
});

export const referralEmail = (data: ReferralEmailData): EmailTemplate => ({
  subject: `${data.referrerName} invited you to join Nearby Traveler! 🌍`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're Invited to Nearby Traveler</title>
      ${emailStyles}
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
      <div class="email-container">
        <div class="header">
          <div class="logo">Nearby Traveler</div>
          <div class="tagline">You've Been Invited!</div>
        </div>
        
        <div class="content">
          <div class="greeting">You're invited! 🎉</div>
          
          <p><strong>${data.referrerName}</strong> thinks you'd love Nearby Traveler - the platform that connects travelers and locals through shared interests!</p>
          
          <div class="highlight">
            <strong>🎁 Special Invitation Benefits:</strong><br>
            • Priority matching with top-rated locals and travelers<br>
            • Access to exclusive events and experiences<br>
            • Premium features unlocked for your first month<br>
            • Direct connection to ${data.referrerName}'s network
          </div>
          
          <p><strong>Your invitation code:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${data.referralCode}</code></p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.joinUrl}" class="button">Join Nearby Traveler</a>
          </div>
          
          <p><strong>What is Nearby Traveler?</strong></p>
          <p>We're a global community where travelers connect with locals and other travelers based on shared interests, activities, and travel plans. Whether you're exploring a new city or welcoming visitors to yours, we help you form meaningful connections.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div class="stats">
              <div class="stats-number">95%</div>
              <div class="stats-label">Successful Connections</div>
            </div>
            <div class="stats">
              <div class="stats-number">4.8★</div>
              <div class="stats-label">User Rating</div>
            </div>
            <div class="stats">
              <div class="stats-number">24h</div>
              <div class="stats-label">Avg Response Time</div>
            </div>
          </div>
          
          <p>Join thousands of travelers and locals already making amazing connections!</p>
          
          <p>Welcome to the community,<br>
          <strong>The Nearby Traveler Team</strong></p>
        </div>
        
        <div class="footer">
          <p>This invitation was sent by ${data.referrerName}.</p>
          <p>© 2025 Nearby Traveler. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `You're invited to Nearby Traveler!

${data.referrerName} invited you to join Nearby Traveler - connecting travelers and locals worldwide!

Your invitation code: ${data.referralCode}

Join now: ${data.joinUrl}

Nearby Traveler connects people through shared interests and travel experiences.

The Nearby Traveler Team`
});

export const connectionRequestEmail = (data: ConnectionRequestData): EmailTemplate => ({
  subject: `${data.senderName} wants to connect with you on Nearby Traveler!`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Connection Request</title>
      ${emailStyles}
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
      <div class="email-container">
        <div class="header">
          <div class="logo">Nearby Traveler</div>
          <div class="tagline">New Connection Request</div>
        </div>
        
        <div class="content">
          <div class="greeting">New Connection! 🤝</div>
          
          <p><strong>${data.senderName}</strong> from <strong>${data.senderLocation}</strong> would like to connect with you on Nearby Traveler!</p>
          
          ${data.message ? `
            <div class="highlight">
              <strong>Their message:</strong><br>
              "${data.message}"
            </div>
          ` : ''}
          
          <p>Check out their profile to see if you share common interests, activities, or travel plans that could lead to an amazing connection!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.profileUrl}" class="button">View Profile & Respond</a>
          </div>
          
          <p><strong>💡 Connection Tips:</strong></p>
          <p>• Review their interests and travel plans<br>
          • Check if you're in similar locations<br>
          • Look for shared activities or events<br>
          • Send a thoughtful response to start the conversation</p>
          
          <p>Great connections start with shared interests!</p>
          
          <p>Happy connecting,<br>
          <strong>The Nearby Traveler Team</strong></p>
        </div>
        
        <div class="footer">
          <p>Manage your notification preferences in your account settings.</p>
          <p>© 2025 Nearby Traveler. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `New Connection Request - Nearby Traveler

${data.senderName} from ${data.senderLocation} wants to connect with you!

${data.message ? `Their message: "${data.message}"` : ''}

View their profile: ${data.profileUrl}

The Nearby Traveler Team`
});

export const eventInviteEmail = (data: EventInviteData): EmailTemplate => ({
  subject: `You're invited: ${data.eventName} by ${data.inviterName}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Event Invitation</title>
      ${emailStyles}
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
      <div class="email-container">
        <div class="header">
          <div class="logo">Nearby Traveler</div>
          <div class="tagline">Event Invitation</div>
        </div>
        
        <div class="content">
          <div class="greeting">You're Invited! 🎉</div>
          
          <p><strong>${data.inviterName}</strong> has invited you to join an exciting event!</p>
          
          <div class="highlight">
            <strong>📅 Event Details:</strong><br>
            <strong>Event:</strong> ${data.eventName}<br>
            <strong>Date:</strong> ${data.eventDate}<br>
            <strong>Location:</strong> ${data.eventLocation}<br>
            <strong>Organized by:</strong> ${data.inviterName}
          </div>
          
          <p>This looks like a great opportunity to meet new people and share amazing experiences with fellow travelers and locals!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.eventUrl}" class="button">View Event & RSVP</a>
          </div>
          
          <p><strong>🌟 Why attend?</strong></p>
          <p>• Meet like-minded travelers and locals<br>
          • Discover new activities and experiences<br>
          • Build meaningful connections<br>
          • Create unforgettable memories</p>
          
          <p>Don't miss out on this opportunity to connect!</p>
          
          <p>See you there,<br>
          <strong>The Nearby Traveler Team</strong></p>
        </div>
        
        <div class="footer">
          <p>Event organized through Nearby Traveler platform.</p>
          <p>© 2025 Nearby Traveler. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `Event Invitation - ${data.eventName}

You're invited by ${data.inviterName}!

Event: ${data.eventName}
Date: ${data.eventDate}
Location: ${data.eventLocation}

View event and RSVP: ${data.eventUrl}

The Nearby Traveler Team`
});

export const businessOfferEmail = (data: BusinessOfferData): EmailTemplate => ({
  subject: `Exclusive ${data.discount} off at ${data.businessName}!`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Special Offer</title>
      ${emailStyles}
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
      <div class="email-container">
        <div class="header">
          <div class="logo">Nearby Traveler</div>
          <div class="tagline">Exclusive Local Deal</div>
        </div>
        
        <div class="content">
          <div class="greeting">Special Offer Just for You! 🎁</div>
          
          <p><strong>${data.businessName}</strong> has an exclusive offer for Nearby Traveler members!</p>
          
          <div class="highlight">
            <strong>💰 Your Exclusive Deal:</strong><br>
            <strong>${data.offerTitle}</strong><br>
            <strong>Discount:</strong> ${data.discount}<br>
            <strong>Valid until:</strong> ${data.validUntil}
          </div>
          
          <p>This is a limited-time offer exclusively for travelers and locals in the Nearby Traveler community. Don't miss out!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.businessUrl}" class="button">Claim Your Offer</a>
          </div>
          
          <p><strong>🏪 About ${data.businessName}:</strong></p>
          <p>This local business is part of our verified partner network, committed to providing amazing experiences for travelers and locals alike.</p>
          
          <p><strong>How to redeem:</strong></p>
          <p>• Visit the business location<br>
          • Show this email or mention "Nearby Traveler"<br>
          • Enjoy your exclusive discount!<br>
          • Don't forget to leave a review</p>
          
          <p>Enjoy your local experience!</p>
          
          <p>Happy exploring,<br>
          <strong>The Nearby Traveler Team</strong></p>
        </div>
        
        <div class="footer">
          <p>Offer provided by ${data.businessName} through Nearby Traveler.</p>
          <p>Terms and conditions may apply. Valid until ${data.validUntil}.</p>
          <p>© 2025 Nearby Traveler. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `Exclusive Offer - ${data.businessName}

${data.offerTitle}
Discount: ${data.discount}
Valid until: ${data.validUntil}

Claim your offer: ${data.businessUrl}

Show this email at the business to redeem.

The Nearby Traveler Team`
});

// Weekly digest email
export const weeklyDigestEmail = (data: {
  name: string;
  newConnections: number;
  newEvents: number;
  newOffers: number;
  location: string;
}): EmailTemplate => ({
  subject: `Your weekly Nearby Traveler digest - ${data.newConnections + data.newEvents} new opportunities!`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Weekly Digest</title>
      ${emailStyles}
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
      <div class="email-container">
        <div class="header">
          <div class="logo">Nearby Traveler</div>
          <div class="tagline">Your Weekly Activity Digest</div>
        </div>
        
        <div class="content">
          <div class="greeting">Week in Review 📊</div>
          
          <p>Hi ${data.name}! Here's what happened in your area this week:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div class="stats">
              <div class="stats-number">${data.newConnections}</div>
              <div class="stats-label">New Potential Connections</div>
            </div>
            <div class="stats">
              <div class="stats-number">${data.newEvents}</div>
              <div class="stats-label">New Events Near You</div>
            </div>
            <div class="stats">
              <div class="stats-number">${data.newOffers}</div>
              <div class="stats-label">Exclusive Local Offers</div>
            </div>
          </div>
          
          <div class="highlight">
            <strong>📍 Activity in ${data.location}:</strong><br>
            Don't miss out on the connections and experiences waiting for you!
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nearbytraveler.com/discover" class="button">Explore Opportunities</a>
          </div>
          
          <p><strong>💡 This Week's Tip:</strong></p>
          <p>Users with complete profiles get 3x more connections. Make sure your interests, activities, and travel plans are up to date!</p>
          
          <p>Keep exploring,<br>
          <strong>The Nearby Traveler Team</strong></p>
        </div>
        
        <div class="footer">
          <p>Weekly digest for ${data.location} area.</p>
          <p><a href="https://nearbytraveler.com/settings" style="color: #6b7280;">Unsubscribe from weekly digests</a></p>
          <p>© 2025 Nearby Traveler. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `Weekly Digest - Nearby Traveler

Hi ${data.name}!

This week in ${data.location}:
- ${data.newConnections} new potential connections
- ${data.newEvents} new events
- ${data.newOffers} exclusive offers

Explore opportunities: https://nearbytraveler.com/discover

The Nearby Traveler Team`
});