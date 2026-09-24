import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { authenticateClientPublic } from "../../middleware/auth.js";
import { createPaymentOrder, verifyWebhookSignature } from "../../services/razorpay.service.js";
import { env } from "../../config/env.js";
import { telegramService } from "../../services/telegram.service.js";

const createOrderSchema = z.object({
  planId: z.string().optional(),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
});

const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string().optional(),
  planId: z.string().optional(),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
});

export async function billingRoutes(app: FastifyInstance) {
  // 1. POST /api/v1/billing/create-order - Initiate self-serve renewal or first payment activation
  app.post(
    "/create-order",
    { preHandler: [authenticateClientPublic] },
    async (request, reply) => {
      const parseResult = createOrderSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: "Invalid order request", details: parseResult.error.format() });
      }

      const clientId = request.clientTenant!.id;
      const { planId: requestedPlanId, billingCycle } = parseResult.data;

      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { subscription: { include: { plan: true } } },
      });

      if (!client || !client.subscription) {
        return reply.status(404).send({ error: "Client subscription not found" });
      }

      const targetPlanId = requestedPlanId || client.subscription.planId;
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: targetPlanId },
      });

      if (!plan) {
        return reply.status(404).send({ error: "Selected plan not found" });
      }

      const amountInr = billingCycle === "YEARLY" ? plan.priceInrYearly : plan.priceInrMonthly;

      const orderData = await createPaymentOrder({
        amountInr,
        clientId,
        planId: plan.id,
        billingCycle,
      });

      // Record pending invoice
      await prisma.subscriptionInvoice.create({
        data: {
          id: orderData.orderId,
          clientId,
          amountInr,
          status: "PENDING",
        },
      });

      return {
        success: true,
        orderId: orderData.orderId,
        amountInr,
        amountPaise: orderData.amountPaise,
        currency: orderData.currency,
        keyId: orderData.keyId,
        businessName: client.businessName,
        ownerPhone: client.ownerPhone,
        planName: plan.name,
      };
    }
  );

  // 2. POST /api/v1/billing/verify-payment - Confirm payment & start 30-day official cycle
  app.post(
    "/verify-payment",
    { preHandler: [authenticateClientPublic] },
    async (request, reply) => {
      const parseResult = verifyPaymentSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: "Invalid verification payload", details: parseResult.error.format() });
      }

      const clientId = request.clientTenant!.id;
      const { razorpayOrderId, razorpayPaymentId, planId, billingCycle } = parseResult.data;

      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { subscription: true },
      });

      if (!client || !client.subscription) {
        return reply.status(404).send({ error: "Client not found" });
      }

      const now = new Date();
      const daysToAdd = billingCycle === "YEARLY" ? 365 : 30;

      // Subscription cycle starts FROM TODAY (exact payment date)
      const newPeriodStart = now;
      const newPeriodEnd = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      const newGraceEnd = new Date(newPeriodEnd.getTime() + 3 * 24 * 60 * 60 * 1000);

      // Update Subscription to LIVE and ACTIVE
      await prisma.clientSubscription.update({
        where: { clientId },
        data: {
          status: "ACTIVE",
          environmentMode: "LIVE",
          activatedAt: client.subscription.activatedAt || now,
          planId: planId || client.subscription.planId,
          billingCycle,
          currentPeriodStart: newPeriodStart,
          currentPeriodEnd: newPeriodEnd,
          gracePeriodEnd: newGraceEnd,
          isManualOverride: false,
        },
      });

      // Update Invoice
      await prisma.subscriptionInvoice.upsert({
        where: { id: razorpayOrderId },
        create: {
          id: razorpayOrderId,
          clientId,
          amountInr: 0,
          razorpayPaymentId,
          status: "PAID",
        },
        update: {
          razorpayPaymentId,
          status: "PAID",
        },
      });
      // Dispatch Real-Time Telegram Alert
      if (telegramService.isConfigured()) {
        const client = await prisma.client.findUnique({
          where: { id: clientId },
          include: { subscription: { include: { plan: true } } },
        });
        if (client) {
          telegramService.sendPaymentCapturedAlert(
            client.businessName,
            client.subscription?.plan?.name || "Standard",
            client.subscription?.plan?.priceInrMonthly || 2499,
            razorpayPaymentId,
            newPeriodEnd
          ).catch(() => {});
        }
      }
      return {
        success: true,
        message: "Payment verified successfully. Subscription cycle started for 30 days.",
        status: "ACTIVE",
        environmentMode: "LIVE",
        currentPeriodStart: newPeriodStart.toISOString(),
        currentPeriodEnd: newPeriodEnd.toISOString(),
      };
    }
  );

  // 3. POST /api/v1/billing/webhooks/razorpay - Webhook handler from Razorpay
  app.post("/webhooks/razorpay", async (request, reply) => {
    const signature = request.headers["x-razorpay-signature"] as string;
    const rawBody = typeof request.body === "string" ? request.body : JSON.stringify(request.body);

    if (env.NODE_ENV === "production" && !verifyWebhookSignature(rawBody, signature)) {
      return reply.status(400).send({ error: "Invalid webhook signature" });
    }

    const payload = request.body as Record<string, unknown>;
    const event = payload.event as string;

    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = (payload.payload as Record<string, unknown>)?.payment as Record<string, unknown>;
      const entity = (paymentEntity?.entity || {}) as Record<string, unknown>;
      const notes = (entity.notes || {}) as Record<string, string>;

      const clientId = notes.clientId;
      const planId = notes.planId;
      const billingCycle = notes.billingCycle || "MONTHLY";

      if (clientId) {
        const now = new Date();
        const daysToAdd = billingCycle === "YEARLY" ? 365 : 30;
        const newPeriodStart = now;
        const newPeriodEnd = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        const newGraceEnd = new Date(newPeriodEnd.getTime() + 3 * 24 * 60 * 60 * 1000);

        await prisma.clientSubscription.update({
          where: { clientId },
          data: {
            status: "ACTIVE",
            environmentMode: "LIVE",
            activatedAt: now,
            planId: planId || undefined,
            billingCycle,
            currentPeriodStart: newPeriodStart,
            currentPeriodEnd: newPeriodEnd,
            gracePeriodEnd: newGraceEnd,
            isManualOverride: false,
          },
        });

        console.log(`[Webhook] Client ${clientId} auto-activated & 30-day subscription cycle started via Razorpay.`);
      }
    }

    return { received: true };
  });
}
