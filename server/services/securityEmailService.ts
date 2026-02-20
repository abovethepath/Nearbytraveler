interface BlockingNotificationData {
  blockerUsername: string;
  blockerEmail: string;
  blockedUsername: string;
  blockedEmail: string;
  reason: string;
  timestamp: Date;
}

async function sendBrevoDirectEmail(to: string, from: string, fromName: string, subject: string, html: string, text: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ BREVO_API_KEY not found - security email not sent");
    return false;
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: fromName, email: from },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`❌ Brevo security email failed ${res.status}: ${errorText}`);
    return false;
  }

  return true;
}

export async function sendBlockingNotification(data: BlockingNotificationData): Promise<boolean> {
  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚨 User Blocking Alert</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827; margin-top: 0;">Blocking Incident Report</h2>
          
          <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="color: #dc2626; margin-top: 0;">Blocker Information</h3>
            <p><strong>Username:</strong> @${data.blockerUsername}</p>
            <p><strong>Email:</strong> ${data.blockerEmail}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ea580c;">
            <h3 style="color: #ea580c; margin-top: 0;">Blocked User Information</h3>
            <p><strong>Username:</strong> @${data.blockedUsername}</p>
            <p><strong>Email:</strong> ${data.blockedEmail}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #f59e0b; margin-top: 0;">Reason for Blocking</h3>
            <p style="font-style: italic; font-size: 16px; color: #374151;">"${data.reason}"</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #111827; margin-top: 0;">Incident Details</h3>
            <p><strong>Timestamp:</strong> ${data.timestamp.toLocaleString()}</p>
            <p><strong>Platform:</strong> NearbyTraveler</p>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0;">⚠️ Action Required</h3>
            <p style="color: #92400e;">Please review this blocking incident. If @${data.blockedUsername} receives multiple blocks, consider account suspension or removal.</p>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated security notification from NearbyTraveler<br>
              Time: ${data.timestamp.toISOString()}
            </p>
          </div>
        </div>
      </div>
    `;

    const emailText = `
NEARBYTRAVELER SECURITY ALERT - USER BLOCKING INCIDENT

Blocker: @${data.blockerUsername} (${data.blockerEmail})
Blocked User: @${data.blockedUsername} (${data.blockedEmail})
Reason: "${data.reason}"
Timestamp: ${data.timestamp.toLocaleString()}

Please review this incident. Multiple blocks for the same user may require administrative action.

This is an automated security notification.
    `;

    const result = await sendBrevoDirectEmail(
      'security@nearbytraveler.org',
      'aaron_marc2004@yahoo.com',
      'NearbyTraveler Security',
      `🚨 User Blocking Alert: @${data.blockerUsername} blocked @${data.blockedUsername}`,
      emailHtml,
      emailText
    );

    if (result) {
      console.log('Security blocking notification sent successfully');
    }
    return result;
  } catch (error) {
    console.error('Failed to send blocking notification:', error);
    return false;
  }
}

export async function sendMultipleBlocksAlert(username: string, email: string, blockCount: number): Promise<boolean> {
  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚨 CRITICAL: Multiple Block Alert</h1>
        </div>
        
        <div style="background: #fef2f2; padding: 30px; border-radius: 0 0 8px 8px; border: 2px solid #dc2626;">
          <h2 style="color: #dc2626; margin-top: 0;">High Priority Security Alert</h2>
          
          <div style="background: white; padding: 25px; border-radius: 6px; margin: 20px 0; border: 2px solid #dc2626;">
            <h3 style="color: #dc2626; margin-top: 0;">⚠️ User with Multiple Blocks</h3>
            <p><strong>Username:</strong> @${username}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Total Blocks Received:</strong> <span style="color: #dc2626; font-size: 24px; font-weight: bold;">${blockCount}</span></p>
          </div>
          
          <div style="background: #dc2626; color: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: white; margin-top: 0;">🚨 IMMEDIATE ACTION REQUIRED</h3>
            <p>This user has been blocked by ${blockCount} different users, indicating potential problematic behavior.</p>
            <p><strong>Recommended Actions:</strong></p>
            <ul>
              <li>Review user's profile and activity history</li>
              <li>Consider temporary account suspension</li>
              <li>Investigate reported incidents</li>
              <li>Evaluate for permanent account removal</li>
            </ul>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated high-priority security alert from NearbyTraveler<br>
              Generated: ${new Date().toISOString()}
            </p>
          </div>
        </div>
      </div>
    `;

    const emailText = `
CRITICAL NEARBYTRAVELER SECURITY ALERT - MULTIPLE BLOCKS

User: @${username} (${email})
Total Blocks Received: ${blockCount}

IMMEDIATE ACTION REQUIRED:
This user has been blocked by multiple community members, indicating potential problematic behavior.

Recommended Actions:
- Review user's profile and activity history
- Consider temporary account suspension  
- Investigate reported incidents
- Evaluate for permanent account removal

This is an automated high-priority security alert.
Generated: ${new Date().toISOString()}
    `;

    const result = await sendBrevoDirectEmail(
      'security@nearbytraveler.org',
      'aaron_marc2004@yahoo.com',
      'NearbyTraveler Security',
      `🚨 CRITICAL: @${username} has ${blockCount} blocks - Review Required`,
      emailHtml,
      emailText
    );

    if (result) {
      console.log('Multiple blocks alert sent successfully');
    }
    return result;
  } catch (error) {
    console.error('Failed to send multiple blocks alert:', error);
    return false;
  }
}
