import { env } from "../config/env.js";

export type WhatsAppAlertReason = "EXPIRY_5_DAYS" | "EXPIRY_1_DAY" | "GRACE_PERIOD" | "SUSPENDED" | "PAYMENT_SUCCESS";

export interface SendWhatsAppAlertParams {
  toPhone: string;
  ownerName: string;
  businessName: string;
  domain: string;
  reason: WhatsAppAlertReason;
  dueDate?: string;
  planName?: string;
  amountInr?: number;
}

export function formatWhatsAppMessage(params: SendWhatsAppAlertParams): string {
  const { ownerName, businessName, domain, reason, dueDate, planName, amountInr } = params;

  switch (reason) {
    case "EXPIRY_5_DAYS":
      return `👗 *${businessName} - Subscription Renewal Notice*\n\nHi ${ownerName}, your boutique website subscription for *${domain}* (${planName || "Starter Plan"}) will renew on *${dueDate || "in 5 days"}*.\n\nAmount: Rs. ${amountInr || 799}\nTo ensure uninterrupted service, please renew your subscription at: https://${domain}/admin\n\nThank you for choosing our boutique platform!`;

    case "EXPIRY_1_DAY":
      return `⚠️ *URGENT: Subscription Renews Tomorrow*\n\nHi ${ownerName}, your website *${domain}* will expire tomorrow on *${dueDate}*.\n\nPlease visit your admin panel to pay and keep your site active: https://${domain}/admin`;

    case "GRACE_PERIOD":
      return `🚨 *Notice: Website in Grace Period*\n\nHi ${ownerName}, your boutique website subscription for *${domain}* has expired.\n\nA *3-day grace period* is currently active. Please pay before grace ends to avoid automatic website lockdown: https://${domain}/admin`;

    case "SUSPENDED":
      return `🔒 *ALERT: Website Temporarily Suspended*\n\nHi ${ownerName}, your boutique website *${domain}* is currently suspended due to an overdue renewal.\n\nTo reactivate your website instantly in 3 seconds, please click here and pay via UPI: https://${domain}/admin`;

    case "PAYMENT_SUCCESS":
      return `🎉 *Payment Received - Website Active!*\n\nHi ${ownerName}, thank you for your payment! Your boutique website *${domain}* is active and renewed for the next billing cycle.`;

    default:
      return `Hi ${ownerName}, this is a reminder regarding your boutique website ${domain}.`;
  }
}

export async function sendAutomatedWhatsAppAlert(params: SendWhatsAppAlertParams): Promise<{ success: boolean; error?: string }> {
  const cleanPhone = params.toPhone.replace(/[^0-9]/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  const message = formatWhatsAppMessage(params);

  // If no provider configured, log alert for development
  if (env.WHATSAPP_PROVIDER === "none" || !env.WHATSAPP_API_TOKEN) {
    console.log(`\n[Automated WhatsApp Logger] (${params.reason}) -> To: +${formattedPhone}`);
    console.log(`------------------------------------------------------------`);
    console.log(message);
    console.log(`------------------------------------------------------------\n`);
    return { success: true };
  }

  // UltraMsg Integration Example
  if (env.WHATSAPP_PROVIDER === "ultramsg" && env.WHATSAPP_INSTANCE_ID && env.WHATSAPP_API_TOKEN) {
    try {
      const response = await fetch(`https://api.ultramsg.com/${env.WHATSAPP_INSTANCE_ID}/messages/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: env.WHATSAPP_API_TOKEN,
          to: formattedPhone,
          body: message,
        }),
      });
      return { success: response.ok };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  return { success: true };
}
