import { FastifyInstance } from "fastify";
import { prisma } from "../../db/prisma.js";
import { authenticateClientPublic } from "../../middleware/auth.js";

export async function clientStatusRoutes(app: FastifyInstance) {
  // 1. GET /api/v1/client/status - Primary SDK Gatekeeper Endpoint
  app.get(
    "/status",
    { preHandler: [authenticateClientPublic] },
    async (request, reply) => {
      const clientTenant = request.clientTenant!;

      const client = await prisma.client.findUnique({
        where: { id: clientTenant.id },
        include: {
          subscription: {
            include: { plan: true },
          },
          media: {
            where: { isActive: true },
            select: { fileSizeBytes: true },
          },
        },
      });

      if (!client || !client.subscription) {
        return reply.status(404).send({ error: "Subscription record not found" });
      }

      const sub = client.subscription;
      const plan = sub.plan;

      // Calculate current storage usage
      const currentImagesCount = client.media.length;
      const currentStorageBytes = client.media.reduce(
        (acc, item) => acc + Number(item.fileSizeBytes),
        0
      );

      let effectiveStatus = sub.status;
      const now = new Date();

      if (sub.isManualOverride) {
        effectiveStatus = sub.status;
      }
      // 🟡 1. TESTING MODE: Free development & testing mode (subscription clock frozen)
      else if (sub.environmentMode === "TESTING") {
        effectiveStatus = "TESTING";
      }
      // 🚀 2. LIVE MODE BUT NOT YET ACTIVATED / FIRST PAYMENT PENDING
      else if (sub.environmentMode === "LIVE" && !sub.activatedAt && sub.status !== "ACTIVE") {
        effectiveStatus = "PENDING_FIRST_PAYMENT";
      }
      // 🟢 3. LIVE MODE ACTIVATED: Evaluate active, grace, or suspended
      else if (sub.environmentMode === "LIVE") {
        if (now > sub.gracePeriodEnd) {
          effectiveStatus = "SUSPENDED";
        } else if (now > sub.currentPeriodEnd) {
          effectiveStatus = "GRACE_PERIOD";
        } else {
          effectiveStatus = "ACTIVE";
        }
      }

      // Check if client is over-quota
      const isOverQuota = currentImagesCount > plan.maxImages || currentStorageBytes > Number(plan.maxStorageBytes);

      return {
        clientId: client.id,
        businessName: client.businessName,
        environmentMode: sub.environmentMode, // "TESTING" | "LIVE"
        status: effectiveStatus,             // "TESTING" | "PENDING_FIRST_PAYMENT" | "ACTIVE" | "GRACE_PERIOD" | "SUSPENDED"
        activatedAt: sub.activatedAt?.toISOString() || null,
        planId: plan.id,
        planName: plan.name,
        priceInrMonthly: plan.priceInrMonthly,
        priceInrYearly: plan.priceInrYearly,
        maxImages: plan.maxImages,
        maxStorageBytes: Number(plan.maxStorageBytes),
        currentImagesCount,
        currentStorageBytes,
        isOverQuota,
        currentPeriodStart: sub.currentPeriodStart.toISOString(),
        currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
        gracePeriodEndsAt: sub.gracePeriodEnd.toISOString(),
        isManualOverride: sub.isManualOverride,
        allowOnlineCart: plan.allowOnlineCart,
        allowCustomerGateway: plan.allowCustomerGateway,
        allowOrdersPortal: plan.allowOrdersPortal,
        allowInventory: plan.allowInventory,
        allowVariants: plan.allowVariants,
        allowCustomersCrm: plan.allowCustomersCrm,
        allowCoupons: plan.allowCoupons,
        allowStaffAccounts: plan.allowStaffAccounts,
        allowAiSalesBot: plan.allowAiSalesBot,
        ownerPhone: client.ownerPhone,
      };
    }
  );

  // 2. GET /api/v1/client/plans - Public endpoint for SDK Plan Comparison Modal
  app.get(
    "/plans",
    { preHandler: [authenticateClientPublic] },
    async () => {
      const plans = await prisma.subscriptionPlan.findMany({
        orderBy: { priceInrMonthly: "asc" },
      });
      return plans.map((p) => ({
        id: p.id,
        name: p.name,
        priceInrMonthly: p.priceInrMonthly,
        priceInrYearly: p.priceInrYearly,
        maxImages: p.maxImages,
        maxStorageBytes: Number(p.maxStorageBytes),
        allowCustomDomain: p.allowCustomDomain,
        allowOnlineCart: p.allowOnlineCart,
        allowCustomerGateway: p.allowCustomerGateway,
        allowOrdersPortal: p.allowOrdersPortal,
        allowInventory: p.allowInventory,
        allowVariants: p.allowVariants,
        allowCustomersCrm: p.allowCustomersCrm,
        allowCoupons: p.allowCoupons,
        allowStaffAccounts: p.allowStaffAccounts,
        allowAiSalesBot: p.allowAiSalesBot,
      }));
    }
  );
}
