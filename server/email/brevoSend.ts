// server/email/brevoSend.ts
type SendEmailArgs = {
  toEmail: string;
  subject: string;
  textContent: string;
  htmlContent?: string;
  senderName?: string;
};

export async function sendBrevoEmail(args: SendEmailArgs) {
  const rawApiKey =
    process.env.BREVO_API_KEY ||
    // Legacy / alternate env var names some deployments still use
    (process.env as any).SENDINBLUE_API_KEY ||
    (process.env as any).SIB_API_KEY;

  const apiKey = typeof rawApiKey === "string" ? rawApiKey.trim() : rawApiKey;
  const apiKeySource = process.env.BREVO_API_KEY
    ? "BREVO_API_KEY"
    : (process.env as any).SENDINBLUE_API_KEY
      ? "SENDINBLUE_API_KEY"
      : (process.env as any).SIB_API_KEY
        ? "SIB_API_KEY"
        : "MISSING";
  if (!apiKey || (typeof apiKey === "string" && apiKey.length === 0)) {
    console.error("❌ Brevo: Missing API key (expected BREVO_API_KEY).", {
      apiKeySource,
      hasBrevoKey: !!process.env.BREVO_API_KEY,
      hasSendinblueKey: !!(process.env as any).SENDINBLUE_API_KEY,
      hasSibKey: !!(process.env as any).SIB_API_KEY,
    });
    throw new Error("Missing BREVO_API_KEY");
  }

  const fromName = (process.env.MAIL_FROM_NAME || "Nearby Traveler").trim();
  const fromEmail = (process.env.MAIL_FROM_EMAIL || "aaron@nearbytraveler.org").trim();

  console.log(`📧 Brevo: BEFORE SEND (${apiKeySource})`, {
    toEmail: args.toEmail,
    subject: args.subject,
    fromEmail,
    apiKeyPrefix: typeof apiKey === "string" ? apiKey.slice(0, 4) : "UNKNOWN",
    apiKeyLength: typeof apiKey === "string" ? apiKey.length : undefined,
  });

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: args.senderName || fromName, email: fromEmail },
      to: [{ email: args.toEmail }],
      subject: args.subject,
      textContent: args.textContent,
      htmlContent: args.htmlContent || args.textContent.replace(/\n/g, "<br/>"),
      headers: { "List-Unsubscribe": "" },
      tags: ['transactional'],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ Brevo: AFTER SEND (FAILED) ${res.status}: ${text}`);
    throw new Error(`Brevo send failed ${res.status}: ${text}`);
  }

  const result = await res.json();
  console.log(`✅ Brevo: AFTER SEND (OK)`, { messageId: result.messageId });
  return result;
}
