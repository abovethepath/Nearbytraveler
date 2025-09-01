// Email Routes for Nearby Traveler Platform
import { Router } from 'express';
import { emailService } from '../services/emailService.js';
import { storage } from '../storage.js';

const router = Router();

// Send welcome email to new user
router.post('/send-welcome', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if welcome email was already sent
    if (user.welcomeEmailSent) {
      return res.json({ 
        success: false, 
        message: 'Welcome email already sent to this user' 
      });
    }

    const success = await emailService.sendWelcomeEmail(user.email, {
      name: user.name || user.username,
      username: user.username,
      userType: user.userType as 'local' | 'business' | 'traveler'
    });

    // Mark as sent if successful
    if (success) {
      await storage.updateUser(userId, { welcomeEmailSent: true });
    }

    res.json({ success, message: success ? 'Welcome email sent' : 'Email sending failed' });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send referral email
router.post('/send-referral', async (req, res) => {
  try {
    const { email, referrerName, referralCode } = req.body;
    
    const joinUrl = `https://www.thenearbytraveler.com/auth?ref=${referralCode}`;
    
    const success = await emailService.sendReferralEmail(email, {
      referrerName,
      referralCode,
      joinUrl
    });

    res.json({ success, message: success ? 'Referral email sent' : 'Email sending failed' });
  } catch (error) {
    console.error('Error sending referral email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send connection request email
router.post('/send-connection-request', async (req, res) => {
  try {
    const { recipientUserId, senderUserId, message } = req.body;
    
    const [recipient, sender] = await Promise.all([
      storage.getUser(recipientUserId),
      storage.getUser(senderUserId)
    ]);

    if (!recipient || !sender) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profileUrl = `https://www.thenearbytraveler.com/profile/${sender.id}`;
    const senderLocation = `${sender.hometownCity}, ${sender.hometownCountry}`;

    const success = await emailService.sendConnectionRequestEmail(recipient.email, {
      senderName: sender.name || sender.username,
      senderLocation,
      message,
      profileUrl
    });

    res.json({ success, message: success ? 'Connection request email sent' : 'Email sending failed' });
  } catch (error) {
    console.error('Error sending connection request email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send event invitation email
router.post('/send-event-invite', async (req, res) => {
  try {
    const { recipientEmail, eventId, inviterUserId } = req.body;
    
    const [event, inviter] = await Promise.all([
      storage.getEvent(eventId),
      storage.getUser(inviterUserId)
    ]);

    if (!event || !inviter) {
      return res.status(404).json({ message: 'Event or inviter not found' });
    }

    const eventUrl = `https://www.thenearbytraveler.com/events/${eventId}`;
    const eventDate = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const success = await emailService.sendEventInviteEmail(recipientEmail, {
      eventName: event.title,
      eventDate,
      eventLocation: `${event.city}, ${event.country}`,
      inviterName: inviter.name || inviter.username,
      eventUrl
    });

    res.json({ success, message: success ? 'Event invitation sent' : 'Email sending failed' });
  } catch (error) {
    console.error('Error sending event invitation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send business offer email
router.post('/send-business-offer', async (req, res) => {
  try {
    const { recipientEmail, offerId } = req.body;
    
    const offer = await storage.getBusinessOffer(offerId);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const business = await storage.getUser(offer.businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const businessUrl = `https://www.thenearbytraveler.com/business/${business.id}`;
    const validUntil = new Date(offer.validUntil).toLocaleDateString();

    const success = await emailService.sendBusinessOfferEmail(recipientEmail, {
      businessName: business.businessName || business.name,
      offerTitle: offer.title,
      discount: offer.discount,
      validUntil,
      businessUrl
    });

    res.json({ success, message: success ? 'Business offer email sent' : 'Email sending failed' });
  } catch (error) {
    console.error('Error sending business offer email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send weekly digest email
router.post('/send-weekly-digest', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get weekly stats (you'll need to implement these queries)
    const weeklyStats = {
      newConnections: 5, // Replace with actual query
      newEvents: 8,      // Replace with actual query
      newOffers: 3       // Replace with actual query
    };

    const userLocation = `${user.hometownCity}, ${user.hometownCountry}`;

    const success = await emailService.sendWeeklyDigestEmail(user.email, {
      name: user.name || user.username,
      ...weeklyStats,
      location: userLocation
    });

    res.json({ success, message: success ? 'Weekly digest sent' : 'Email sending failed' });
  } catch (error) {
    console.error('Error sending weekly digest:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;