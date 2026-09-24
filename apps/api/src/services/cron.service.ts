import { prisma } from "../db/prisma.js";
import { sendAutomatedWhatsAppAlert } from "./whatsapp.service.js";

export interface ExpiryCheckResult {
  checkedCount: number;
  transitionedToGrace: string[];
  transitionedToSuspended: string[];
  remindersSent: number;
}

/**
 * Checks all client subscriptions, transitions expired accounts, and dispatches automated WhatsApp reminders
 */
export async function runSubscriptionExpiryCheck(): Promise<ExpiryCheckResult> {
  const now = new Date();

  const subscriptions = await prisma.clientSubscription.findMany({
    where: {
      isManualOverride: false,
    },
    include: {
      client: true,
      plan: true,
    },
  });

  const transitionedToGrace: string[] = [];
  const transitionedToSuspended: string[] = [];
  let remindersSent = 0;

  for (const sub of subscriptions) {
    const daysUntilDue = Math.ceil((sub.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // 1. Send T-5 Days Reminder
    if (daysUntilDue === 5 && sub.status === "ACTIVE") {
      await sendAutomatedWhatsAppAlert({
        toPhone: sub.client.ownerPhone,
        ownerName: sub.client.ownerName,
        businessName: sub.client.businessName,
        domain: sub.client.primaryDomain,
        reason: "EXPIRY_5_DAYS",
        dueDate: sub.currentPeriodEnd.toLocaleDateString("en-IN"),
        planName: sub.plan.name,
        amountInr: sub.plan.priceInrMonthly,
      });
      remindersSent++;
    }

    // 2. Send T-1 Day Reminder
    if (daysUntilDue === 1 && sub.status === "ACTIVE") {
      await sendAutomatedWhatsAppAlert({
        toPhone: sub.client.ownerPhone,
        ownerName: sub.client.ownerName,
        businessName: sub.client.businessName,
        domain: sub.client.primaryDomain,
        reason: "EXPIRY_1_DAY",
        dueDate: sub.currentPeriodEnd.toLocaleDateString("en-IN"),
        planName: sub.plan.name,
        amountInr: sub.plan.priceInrMonthly,
      });
      remindersSent++;
    }

    // 3. Transition to SUSPENDED (After Grace Period)
    if (now > sub.gracePeriodEnd) {
      if (sub.status !== "SUSPENDED") {
        await prisma.clientSubscription.update({
          where: { id: sub.id },
          data: { status: "SUSPENDED" },
        });
        transitionedToSuspended.push(sub.clientId);

        await sendAutomatedWhatsAppAlert({
          toPhone: sub.client.ownerPhone,
          ownerName: sub.client.ownerName,
          businessName: sub.client.businessName,
          domain: sub.client.primaryDomain,
          reason: "SUSPENDED",
        });
        remindersSent++;
      }
    }
    // 4. Transition to GRACE_PERIOD (Due Date Passed)
    else if (now > sub.currentPeriodEnd) {
      if (sub.status !== "GRACE_PERIOD" && sub.status !== "SUSPENDED") {
        await prisma.clientSubscription.update({
          where: { id: sub.id },
          data: { status: "GRACE_PERIOD" },
        });
        transitionedToGrace.push(sub.clientId);

        await sendAutomatedWhatsAppAlert({
          toPhone: sub.client.ownerPhone,
          ownerName: sub.client.ownerName,
          businessName: sub.client.businessName,
          domain: sub.client.primaryDomain,
          reason: "GRACE_PERIOD",
        });
        remindersSent++;
      }
    }
  }

  console.log(
    `[Cron] Expiry check completed. Checked: ${subscriptions.length}, To Grace: ${transitionedToGrace.length}, To Suspended: ${transitionedToSuspended.length}, WhatsApp Reminders Dispatched: ${remindersSent}`
  );

  return {
    checkedCount: subscriptions.length,
    transitionedToGrace,
    transitionedToSuspended,
    remindersSent,
  };
}

let cronInterval: NodeJS.Timeout | undefined;

export function startExpiryCronJob(intervalMs = 1000 * 60 * 60) {
  // Run once on startup
  runSubscriptionExpiryCheck().catch(console.error);

  // Run periodically (default every 1 hour)
  clearInterval(cronInterval);
  cronInterval = setInterval(() => {
    runSubscriptionExpiryCheck().catch(console.error);
  }, intervalMs);
}
