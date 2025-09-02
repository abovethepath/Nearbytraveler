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

export interface LocationMatchData {
  recipientName: string;
  newUserName: string;
  city: string;
  newUserType: string;
  sharedInterests?: string[];
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
  subject: `Welcome to the community, ${data.name}! 🌍`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Nearby Traveler</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #f97316 100%); padding: 30px 20px; text-align: center; color: white; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 22px; font-weight: 600; margin-bottom: 20px; color: #1f2937; }
        .highlight { background-color: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #f97316 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background-color: #f8fafc; padding: 25px 30px; text-align: center; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; }
        .benefit { margin: 15px 0; display: flex; align-items: flex-start; }
        .benefit-icon { margin-right: 12px; font-size: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Nearby Traveler</div>
          <div style="font-size: 16px; opacity: 0.9;">Welcome to the community!</div>
        </div>
        
        <div class="content">
          <div class="greeting">Hey ${data.name}! 👋</div>
          
          <p>You just joined something special. Nearby Traveler connects amazing people like you with others who share your interests and travel spirit.</p>
          
          <div class="highlight">
            <strong>🎯 You're all set as a ${data.userType === 'business' ? 'Business' : data.userType === 'local' ? 'Local' : 'Traveler'}!</strong><br>
            Username: <strong>@${data.username}</strong>
          </div>
          
          <p><strong>Here's what you can do right now:</strong></p>
          
          ${data.userType === 'business' ? `
            <div class="benefit">
              <span class="benefit-icon">💼</span>
              <div>
                <strong>Create your first deal</strong><br>
                Attract travelers and locals with special offers that get results
              </div>
            </div>
            <div class="benefit">
              <span class="benefit-icon">📈</span>
              <div>
                <strong>Connect with your audience</strong><br>
                Find customers who are actively looking for what you offer
              </div>
            </div>
            <div class="benefit">
              <span class="benefit-icon">🌟</span>
              <div>
                <strong>Build your reputation</strong><br>
                Get reviews and recommendations from happy customers
              </div>
            </div>
          ` : `
            <div class="benefit">
              <span class="benefit-icon">🤝</span>
              <div>
                <strong>Find your people</strong><br>
                Connect with others who share your interests and travel plans
              </div>
            </div>
            <div class="benefit">
              <span class="benefit-icon">📍</span>
              <div>
                <strong>Discover local gems</strong><br>
                Get insider tips from locals and fellow travelers
              </div>
            </div>
            <div class="benefit">
              <span class="benefit-icon">🎉</span>
              <div>
                <strong>Join amazing events</strong><br>
                From coffee meetups to adventure trips - find your next experience
              </div>
            </div>
          `}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nearbytraveler.org/profile" class="button">Complete Your Profile</a>
          </div>
          
          <p>Complete your profile to unlock the full experience - it takes just 2 minutes and makes all the difference in finding great connections!</p>
          
          <p>Questions? Just reply to this email.</p>
          
          <p>Excited to see what connections you'll make,</p>
          <p><strong>Aaron</strong><br>
          <em>Founder, Nearby Traveler, Inc</em></p>
        </div>
        
        <div class="footer">
          <p>You're now part of a growing community of travelers and locals worldwide.</p>
          <p>© 2025 Nearby Traveler, Inc. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `Welcome to Nearby Traveler! 🌍

Hey ${data.name}!

You just joined something special. Nearby Traveler connects amazing people like you with others who share your interests and travel spirit.

You're all set as a ${data.userType === 'business' ? 'Business' : data.userType === 'local' ? 'Local' : 'Traveler'}!
Username: @${data.username}

Here's what you can do right now:

${data.userType === 'business' ? `• Create your first deal - Attract travelers and locals with special offers
• Connect with your audience - Find customers actively looking for what you offer  
• Build your reputation - Get reviews and recommendations from happy customers` : `• Find your people - Connect with others who share your interests and travel plans
• Discover local gems - Get insider tips from locals and fellow travelers
• Join amazing events - From coffee meetups to adventure trips`}

Complete your profile to unlock the full experience: https://nearbytraveler.org/profile

Questions? Just reply to this email.

Excited to see what connections you'll make,

Aaron
Founder, Nearby Traveler, Inc`
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
            <a href="https://www.thenearbytraveler.com/discover" class="button">Explore Opportunities</a>
          </div>
          
          <p><strong>💡 This Week's Tip:</strong></p>
          <p>Users with complete profiles get 3x more connections. Make sure your interests, activities, and travel plans are up to date!</p>
          
          <p>Keep exploring,<br>
          <strong>The Nearby Traveler Team</strong></p>
        </div>
        
        <div class="footer">
          <p>Weekly digest for ${data.location} area.</p>
          <p><a href="https://www.thenearbytraveler.com/settings" style="color: #6b7280;">Unsubscribe from weekly digests</a></p>
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

Explore opportunities: https://www.thenearbytraveler.com/discover

The Nearby Traveler Team`
});

export const locationMatchEmail = (data: LocationMatchData): EmailTemplate => ({
  subject: `New ${data.newUserType} from ${data.city} joined Nearby Traveler! 🌍`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Location Match - Nearby Traveler</title>
      ${emailStyles}
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
      <div class="email-container">
        <div class="header">
          <div class="logo">Nearby Traveler</div>
          <div class="tagline">Someone New in Your City!</div>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${data.recipientName}! 👋</div>
          
          <p>Exciting news! <strong>@${data.newUserName}</strong> just joined Nearby Traveler from <strong>${data.city}</strong> - the same city as you!</p>
          
          <div class="highlight">
            <strong>🌟 New ${data.newUserType} in ${data.city}</strong><br>
            ${data.sharedInterests && data.sharedInterests.length > 0 ? `
              <p><strong>You might have things in common:</strong></p>
              <ul>
                ${data.sharedInterests.map(interest => `<li>${interest}</li>`).join('')}
              </ul>
            ` : ''}
            <p>This could be the start of a great connection!</p>
          </div>
          
          <p>Why not reach out and say hello? Local connections often lead to the best experiences and friendships.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://www.thenearbytraveler.com/discover" class="button">Discover ${data.newUserName}</a>
          </div>
          
          <p>Remember to always meet in public places when connecting with new people for the first time.</p>
          
          <p>Happy connecting!<br>
          <strong>The Nearby Traveler Team</strong></p>
        </div>
        
        <div class="footer">
          <p>Location-based notification for ${data.city}.</p>
          <p><a href="https://www.thenearbytraveler.com/settings" style="color: #6b7280;">Manage notification preferences</a></p>
          <p>© 2025 Nearby Traveler. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `New ${data.newUserType} from ${data.city} joined Nearby Traveler!

Hi ${data.recipientName}!

@${data.newUserName} just joined from ${data.city} - the same city as you!

${data.sharedInterests && data.sharedInterests.length > 0 ? 
  `You might have things in common: ${data.sharedInterests.join(', ')}` : ''}

Why not reach out and say hello? Visit: https://www.thenearbytraveler.com/discover

The Nearby Traveler Team`
});

export const forgotPasswordEmail = (data: PasswordResetData): EmailTemplate => ({
  subject: "Password Reset - Nearby Traveler Account",
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
          <div class="greeting">Account Security Notice</div>
          
          <p>Hello ${data.name},</p>
          
          <p>We received a request to reset the password for your Nearby Traveler account. If you made this request, please click the button below to create a new password.</p>
          
          <div class="highlight">
            <strong>🔒 Security Notice:</strong><br>
            • This link expires in <strong>${data.expiryHours} hours</strong><br>
            • Only use this link if you requested the password reset<br>
            • If you didn't request this, you can safely ignore this email
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetUrl}" class="button">Reset My Password</a>
          </div>
          
          <p><strong>Can't click the button?</strong> Copy and paste this link into your browser:</p>
          <p style="background-color: #f8fafc; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px;">${data.resetUrl}</p>
          
          <p>If you continue to have trouble accessing your account, reply to this email and we'll help you out.</p>
          
          <p>Stay secure!<br>
          <strong>The Nearby Traveler Team</strong></p>
        </div>
        
        <div class="footer">
          <p>This password reset request was made from your account.</p>
          <p><a href="https://www.thenearbytraveler.com/help" style="color: #6b7280;">Need help?</a></p>
          <p>© 2025 Nearby Traveler. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `Password Reset - Nearby Traveler

Hi ${data.name}!

You requested to reset your password for your Nearby Traveler account.

Reset your password here: ${data.resetUrl}

This link expires in ${data.expiryHours} hours.

If you didn't request this, you can safely ignore this email.

The Nearby Traveler Team`
});