// server/email/brevoSend.ts
type SendEmailArgs = {
  toEmail: string;
  subject: string;
  textContent: string;
  htmlContent?: string;
};

export async function sendBrevoEmail(args: SendEmailArgs) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("Missing BREVO_API_KEY");

  const fromName = process.env.MAIL_FROM_NAME || "Nearby Traveler";
  const fromEmail = process.env.MAIL_FROM_EMAIL || "aaron@nearbytraveler.org";

  console.log(`📧 Brevo: Sending email to ${args.toEmail}, subject: ${args.subject}`);

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: args.toEmail }],
      subject: args.subject,
      textContent: args.textContent,
      htmlContent: args.htmlContent || args.textContent.replace(/\n/g, "<br/>"),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ Brevo: Failed ${res.status}: ${text}`);
    throw new Error(`Brevo send failed ${res.status}: ${text}`);
  }

  const result = await res.json();
  console.log(`✅ Brevo: Email sent successfully, messageId: ${result.messageId}`);
  return result;
}
