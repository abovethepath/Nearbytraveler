import * as Brevo from "@getbrevo/brevo";
import { brevo as emailAPI } from "../lib/brevo";

const SENDER = { name: "Nearby Traveler", email: "hello@nearbytraveler.com" };
const TEMPLATE_ID = Number(process.env.BREVO_WELCOME_TEMPLATE_ID);

type WelcomeParams = {
  email: string;
  name?: string;
  username?: string;
  ctaUrl?: string;
};

export async function sendWelcomeEmail({ email, name, username, ctaUrl }: WelcomeParams) {
  const msg = new Brevo.SendSmtpEmail();
  msg.templateId = TEMPLATE_ID;
  msg.sender = SENDER;
  msg.to = [{ email, name: name || username || "Traveler" }];
  msg.params = {
    firstName: name?.split(" ")[0] || username || "Traveler",
    username,
    ctaUrl: ctaUrl || "https://app.nearbytraveler.com/welcome",
  };
  // optional—but handy for dedupe in logs
  msg.headers = { "X-NT-MailType": "welcome" };

  return emailAPI.sendTransacEmail(msg);
}