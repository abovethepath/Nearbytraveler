import { emailService } from "../services/emailService";

type WelcomeParams = {
  email: string;
  name?: string;
  username?: string;
  ctaUrl?: string;
};

export async function sendWelcomeEmail({ email, name, username, ctaUrl }: WelcomeParams) {
  console.log('📧 WELCOME EMAIL: Attempting to send welcome email to:', email);
  
  try {
    const result = await emailService.sendWelcomeEmail(email, {
      name: name || username || "Traveler",
      username: username || "Traveler",
      userType: "traveler"
    });
    
    if (result) {
      console.log('✅ WELCOME EMAIL: Successfully sent welcome email to:', email);
    } else {
      console.log('❌ WELCOME EMAIL: Failed to send welcome email to:', email);
    }
    
    return result;
  } catch (error) {
    console.error('💥 WELCOME EMAIL ERROR:', error);
    return false;
  }
}