import { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../../db/prisma.js";
import { authenticateSuperAdmin } from "../../middleware/auth.js";
import { generatePresignedUploadUrl, deleteStorageObject } from "../../services/storage.service.js";
import { uptimeWatchdogService } from "../../services/uptime-watchdog.service.js";
import crypto from "crypto";

const createClientSchema = z.object({
  businessName: z.string().min(2),
  ownerName: z.string().min(2),
  ownerPhone: z.string().min(10),
  ownerEmail: z.string().email().optional().or(z.literal("")).nullable(),
  city: z.string().default("Hyderabad"),
  storeAddress: z.string().optional(),
  instagramHandle: z.string().optional(),
  websiteType: z.enum(["SHOWCASE", "WHATSAPP_STORE", "ECOMMERCE"]).default("WHATSAPP_STORE"),
  primaryDomain: z.string().min(3),
  allowedDomains: z.string().default("localhost,127.0.0.1"),
  planId: z.string().default("plan_ecom_standard"),
  environmentMode: z.enum(["TESTING", "LIVE"]).default("TESTING"),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
  adminUsername: z.string().default("admin"),
  adminPassword: z.string().default("StorePassword@123"),
  githubRepo: z.string().optional().nullable(),
  developerNotes: z.string().optional().nullable(),
  projectZipUrl: z.string().optional().nullable(),
  projectZipName: z.string().optional().nullable(),
});

const updateClientProfileSchema = z.object({
  businessName: z.string().min(2).optional(),
  ownerName: z.string().min(2).optional(),
  ownerPhone: z.string().min(10).optional(),
  ownerEmail: z.string().email().optional().or(z.literal("")).nullable(),
  city: z.string().optional(),
  storeAddress: z.string().optional().nullable(),
  instagramHandle: z.string().optional().nullable(),
  websiteType: z.enum(["SHOWCASE", "WHATSAPP_STORE", "ECOMMERCE"]).optional(),
  primaryDomain: z.string().min(3).optional(),
  allowedDomains: z.string().optional(),
  adminUsername: z.string().optional(),
  adminPassword: z.string().optional(),
  githubRepo: z.string().optional().nullable(),
  developerNotes: z.string().optional().nullable(),
  projectZipUrl: z.string().optional().nullable(),
  projectZipName: z.string().optional().nullable(),
  planId: z.string().optional(),
  environmentMode: z.enum(["TESTING", "LIVE"]).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["TESTING", "PENDING_FIRST_PAYMENT", "ACTIVE", "GRACE_PERIOD", "SUSPENDED", "CANCELLED"]).optional(),
  environmentMode: z.enum(["TESTING", "LIVE"]).optional(),
  isManualOverride: z.boolean().optional(),
  extendGraceDays: z.number().int().optional(),
  currentPeriodEnd: z.string().optional(),
  gracePeriodEnd: z.string().optional(),
  activatedAt: z.string().optional().nullable(),
  planId: z.string().optional(),
});

const updatePlanSchema = z.object({
  name: z.string().min(2).optional(),
  priceInrMonthly: z.number().int().positive().optional(),
  priceInrYearly: z.number().int().positive().optional(),
  maxImages: z.number().int().positive().optional(),
  maxStorageGb: z.number().positive().optional(),
  allowCustomDomain: z.boolean().optional(),
  allowOnlineCart: z.boolean().optional(),
  allowCustomerGateway: z.boolean().optional(),
  allowOrdersPortal: z.boolean().optional(),
  allowInventory: z.boolean().optional(),
  allowVariants: z.boolean().optional(),
  allowCustomersCrm: z.boolean().optional(),
  allowCoupons: z.boolean().optional(),
  allowStaffAccounts: z.number().int().min(0).optional(),
  allowAiSalesBot: z.boolean().optional(),
});
export interface DomainLiveHealthResult {
  isLive: boolean;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  statusCode: number | null;
  statusText: string;
  responseTimeMs: number;
  checkedUrl: string;
  checkedAt: string;
  protocol: "https" | "http";
  serverHeader?: string;
  error?: string;
}

export async function checkDomainLiveHealth(rawDomain: string): Promise<DomainLiveHealthResult> {
  const clean = rawDomain.trim();
  let candidateUrls: string[] = [];

  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    candidateUrls = [clean];
  } else if (clean.includes(":") || clean.startsWith("localhost:") || clean.startsWith("127.0.0.1:")) {
    // Specific host with port (e.g. localhost:3000 or localhost:5173) -> Check exact port!
    candidateUrls = [`http://${clean}`];
  } else if (clean === "localhost" || clean === "127.0.0.1") {
    // Localhost without port -> Probe Next.js (3000) & Vite (5173)
    candidateUrls = [
      `http://${clean}:3000`,
      `http://${clean}:5173`,
      `http://${clean}:5174`,
      `http://${clean}:3001`,
    ];
  } else {
    // Production domain -> Try HTTPS first, HTTP as fallback
    candidateUrls = [`https://${clean}`, `http://${clean}`];
  }

  const startTime = Date.now();

  for (const target of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(target, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "BoutiquePlatform-HealthChecker/1.0",
          "Accept": "*/*",
        },
      });
      clearTimeout(timeoutId);

      const responseTimeMs = Date.now() - startTime;
      const isOk = res.status >= 200 && res.status < 400;
      const isDegraded = res.status >= 400 && res.status < 600;

      if (isOk || isDegraded) {
        return {
          isLive: isOk,
          status: isOk ? ("ONLINE" as const) : ("DEGRADED" as const),
          statusCode: res.status,
          statusText: res.statusText || (isOk ? "OK" : `HTTP ${res.status}`),
          responseTimeMs,
          checkedUrl: target,
          checkedAt: new Date().toISOString(),
          protocol: target.startsWith("https") ? ("https" as const) : ("http" as const),
          serverHeader: res.headers.get("server") || undefined,
        };
      }
    } catch {
      // Try next candidate port
    }
  }

  const fallbackTarget = candidateUrls[0] || `http://${clean}`;
  const responseTimeMs = Date.now() - startTime;
  return {
    isLive: false,
    status: "OFFLINE" as const,
    statusCode: null,
    statusText: "Connection Refused (Server Down / Offline)",
    responseTimeMs,
    checkedUrl: fallbackTarget,
    checkedAt: new Date().toISOString(),
    protocol: fallbackTarget.startsWith("https") ? ("https" as const) : ("http" as const),
    error: "Connection Refused (Server Down / Offline)",
  };
}


export async function adminClientRoutes(app: FastifyInstance) {
  // All routes here require Super Admin JWT
  app.addHook("preHandler", authenticateSuperAdmin);

  // GET /api/v1/admin/clients - List all clients with usage, credentials and status
  app.get("/clients", async () => {
    const clients = await prisma.client.findMany({
      include: {
        subscription: {
          include: { plan: true },
        },
        media: {
          where: { isActive: true },
          select: { fileSizeBytes: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return clients.map((c) => {
      const currentImagesCount = c.media.length;
      const currentStorageBytes = c.media.reduce(
        (acc, item) => acc + Number(item.fileSizeBytes),
        0
      );

      return {
        id: c.id,
        businessName: c.businessName,
        ownerName: c.ownerName,
        ownerPhone: c.ownerPhone,
        ownerEmail: c.ownerEmail,
        city: c.city || "Hyderabad",
        storeAddress: c.storeAddress || "",
        instagramHandle: c.instagramHandle || "",
        websiteType: c.websiteType || "WHATSAPP_STORE",
        primaryDomain: c.primaryDomain,
        allowedDomains: c.allowedDomains,
        adminUsername: c.adminUsername || "admin",
        adminPassword: c.adminPassword || "StorePassword@123",
        publicApiKey: c.publicApiKey,
        secretApiKey: c.secretApiKey,
        createdAt: c.createdAt,
        subscription: c.subscription
          ? {
              id: c.subscription.id,
              planId: c.subscription.planId,
              planName: c.subscription.plan.name,
              environmentMode: c.subscription.environmentMode || "TESTING",
              status: c.subscription.status,
              activatedAt: c.subscription.activatedAt,
              billingCycle: c.subscription.billingCycle,
              currentPeriodStart: c.subscription.currentPeriodStart,
              currentPeriodEnd: c.subscription.currentPeriodEnd,
              gracePeriodEnd: c.subscription.gracePeriodEnd,
              isManualOverride: c.subscription.isManualOverride,
              maxImages: c.subscription.plan.maxImages,
              maxStorageBytes: Number(c.subscription.plan.maxStorageBytes),
              priceInrMonthly: c.subscription.plan.priceInrMonthly,
            }
          : null,
        usage: {
          currentImagesCount,
          currentStorageBytes,
        },
      };
    });
  });

  // POST /api/v1/admin/clients - Onboard a new boutique client
  app.post("/clients", async (request, reply) => {
    const parseResult = createClientSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid client payload", details: parseResult.error.format() });
    }

    const data = parseResult.data;

    const cleanBusinessSlug = data.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 12);
    const randomSuffix = crypto.randomBytes(3).toString("hex");
    const clientId = `cl_hyd_${cleanBusinessSlug}_${randomSuffix}`;
    const publicApiKey = `pk_live_${crypto.randomBytes(16).toString("hex")}`;
    const secretApiKey = `sk_live_${crypto.randomBytes(24).toString("hex")}`;

    const now = new Date();
    const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const gracePeriodEnd = new Date(currentPeriodEnd.getTime() + 3 * 24 * 60 * 60 * 1000);

    const domainList = Array.from(
      new Set(
        `${data.allowedDomains},${data.primaryDomain},localhost,127.0.0.1`
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean)
      )
    ).join(",");

    const initialStatus = data.environmentMode === "TESTING" ? "TESTING" : "PENDING_FIRST_PAYMENT";

    const client = await prisma.client.create({
      data: {
        id: clientId,
        businessName: data.businessName,
        ownerName: data.ownerName,
        ownerPhone: data.ownerPhone,
        ownerEmail: data.ownerEmail,
        city: data.city,
        storeAddress: data.storeAddress,
        instagramHandle: data.instagramHandle,
        websiteType: data.websiteType,
        primaryDomain: data.primaryDomain,
        allowedDomains: domainList,
        adminUsername: data.adminUsername,
        adminPassword: data.adminPassword,
        githubRepo: data.githubRepo || null,
        developerNotes: data.developerNotes || null,
        projectZipUrl: data.projectZipUrl || null,
        projectZipName: data.projectZipName || null,
        publicApiKey,
        secretApiKey,
        subscription: {
          create: {
            planId: data.planId,
            environmentMode: data.environmentMode,
            status: initialStatus,
            billingCycle: data.billingCycle,
            currentPeriodStart: now,
            currentPeriodEnd,
            gracePeriodEnd,
          },
        },
      },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    return reply.status(201).send({
      success: true,
      client: {
        ...client,
        subscription: client.subscription
          ? {
              ...client.subscription,
              plan: {
                ...client.subscription.plan,
                maxStorageBytes: Number(client.subscription.plan.maxStorageBytes),
              },
            }
          : null,
      },
    });
  });

  // PATCH /api/v1/admin/clients/:id - Full Profile, Domain, Whitelist, Password & Environment Mode Update
  app.patch("/clients/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parseResult = updateClientProfileSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid profile update payload", details: parseResult.error.format() });
    }

    const data = parseResult.data;

    const existingClient = await prisma.client.findUnique({
      where: { id },
      include: { subscription: true },
    });

    if (!existingClient) {
      return reply.status(404).send({ error: "Client not found" });
    }

    const updateData: Record<string, unknown> = {};

    if (data.businessName !== undefined) updateData.businessName = data.businessName;
    if (data.ownerName !== undefined) updateData.ownerName = data.ownerName;
    if (data.ownerPhone !== undefined) updateData.ownerPhone = data.ownerPhone;
    if (data.ownerEmail !== undefined) updateData.ownerEmail = data.ownerEmail;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.storeAddress !== undefined) updateData.storeAddress = data.storeAddress;
    if (data.instagramHandle !== undefined) updateData.instagramHandle = data.instagramHandle;
    if (data.websiteType !== undefined) updateData.websiteType = data.websiteType;
    if (data.primaryDomain !== undefined) updateData.primaryDomain = data.primaryDomain;
    if (data.allowedDomains !== undefined) updateData.allowedDomains = data.allowedDomains;
    if (data.adminUsername !== undefined) updateData.adminUsername = data.adminUsername;
    if (data.adminPassword !== undefined) updateData.adminPassword = data.adminPassword;
    if (data.githubRepo !== undefined) updateData.githubRepo = data.githubRepo;
    if (data.developerNotes !== undefined) updateData.developerNotes = data.developerNotes;
    if (data.projectZipUrl !== undefined) updateData.projectZipUrl = data.projectZipUrl;
    if (data.projectZipName !== undefined) updateData.projectZipName = data.projectZipName;
    // Subscription updates
    const subUpdateData: Record<string, unknown> = {};
    if (data.planId) subUpdateData.planId = data.planId;
    if (data.environmentMode) {
      subUpdateData.environmentMode = data.environmentMode;
      if (data.environmentMode === "TESTING") {
        subUpdateData.status = "TESTING";
      } else if (data.environmentMode === "LIVE" && !existingClient.subscription?.activatedAt) {
        subUpdateData.status = "PENDING_FIRST_PAYMENT";
      }
    }

    if (Object.keys(subUpdateData).length > 0 && existingClient.subscription) {
      await prisma.clientSubscription.update({
        where: { clientId: id },
        data: subUpdateData,
      });
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: updateData,
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    return {
      success: true,
      message: "Client profile updated successfully.",
      client: updatedClient,
    };
  });

  // PATCH /api/v1/admin/clients/:id/status - Status, Overrides, & Grace extensions
  app.patch("/clients/:id/status", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parseResult = updateStatusSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid status payload", details: parseResult.error.format() });
    }

    const { status, environmentMode, isManualOverride, extendGraceDays, currentPeriodEnd, gracePeriodEnd, activatedAt, planId } = parseResult.data;
    const existingSub = await prisma.clientSubscription.findUnique({
      where: { clientId: id },
    });

    if (!existingSub) {
      return reply.status(404).send({ error: "Client subscription not found" });
    }

    const updateData: Record<string, unknown> = {};

    if (status) updateData.status = status;
    if (environmentMode) updateData.environmentMode = environmentMode;
    if (isManualOverride !== undefined) updateData.isManualOverride = isManualOverride;
    if (planId) updateData.planId = planId;
    if (currentPeriodEnd) updateData.currentPeriodEnd = new Date(currentPeriodEnd);
    if (gracePeriodEnd) updateData.gracePeriodEnd = new Date(gracePeriodEnd);
    if (activatedAt !== undefined) {
      updateData.activatedAt = activatedAt ? new Date(activatedAt) : null;
    }

    if (extendGraceDays) {
      const currentGrace = new Date(existingSub.gracePeriodEnd);
      updateData.gracePeriodEnd = new Date(currentGrace.getTime() + extendGraceDays * 24 * 60 * 60 * 1000);
      updateData.status = "ACTIVE";
    }
    const updated = await prisma.clientSubscription.update({
      where: { clientId: id },
      data: updateData,
      include: { plan: true },
    });

    return {
      success: true,
      subscription: {
        ...updated,
        plan: {
          ...updated.plan,
          maxStorageBytes: Number(updated.plan.maxStorageBytes),
        },
      },
    };
  });

  // DELETE /api/v1/admin/clients/:id - Remove client account with Super Admin Password Verification
  app.delete("/clients/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = (request.body && typeof request.body === "object" ? request.body : {}) as { superAdminPassword?: string };
    const superAdminPassword = body.superAdminPassword || "";

    if (!superAdminPassword) {
      return reply.status(400).send({
        error: "PASSWORD_REQUIRED",
        message: "Super Admin password is required to delete a boutique client.",
      });
    }

    const adminId = request.superAdmin?.adminId;
    if (!adminId) {
      return reply.status(401).send({ error: "UNAUTHORIZED", message: "Unauthorized admin session." });
    }

    const admin = await prisma.superAdmin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return reply.status(401).send({ error: "UNAUTHORIZED", message: "Super Admin account not found." });
    }

    const isMatch = await bcrypt.compare(superAdminPassword, admin.passwordHash);
    if (!isMatch) {
      return reply.status(401).send({
        error: "INVALID_PASSWORD",
        message: "Incorrect Super Admin password. Deletion cancelled.",
      });
    }

    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return reply.status(404).send({ error: "NOT_FOUND", message: "Boutique client not found." });
    }

    await prisma.client.delete({ where: { id } });
    return {
      success: true,
      message: `Store "${existingClient.businessName}" (${id}) and all associated credentials permanently deleted.`,
    };
  });

  // GET /api/v1/admin/plans - List all plans
  app.get("/plans", async () => {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { priceInrMonthly: "asc" },
    });
    return plans.map((p) => ({
      ...p,
      maxStorageBytes: Number(p.maxStorageBytes),
    }));
  });

  // PATCH /api/v1/admin/plans/:id - Edit Plan Prices, Photos & Quotas
  app.patch("/plans/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parseResult = updatePlanSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid plan update payload", details: parseResult.error.format() });
    }

    const data = parseResult.data;

    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return reply.status(404).send({ error: "Subscription plan not found" });
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.priceInrMonthly !== undefined) updateData.priceInrMonthly = data.priceInrMonthly;
    if (data.priceInrYearly !== undefined) updateData.priceInrYearly = data.priceInrYearly;
    if (data.maxImages !== undefined) updateData.maxImages = data.maxImages;
    if (data.maxStorageGb !== undefined) {
      updateData.maxStorageBytes = BigInt(Math.round(data.maxStorageGb * 1024 * 1024 * 1024));
    }
    if (data.allowCustomDomain !== undefined) updateData.allowCustomDomain = data.allowCustomDomain;
    if (data.allowOnlineCart !== undefined) updateData.allowOnlineCart = data.allowOnlineCart;
    if (data.allowCustomerGateway !== undefined) updateData.allowCustomerGateway = data.allowCustomerGateway;
    if (data.allowOrdersPortal !== undefined) updateData.allowOrdersPortal = data.allowOrdersPortal;
    if (data.allowInventory !== undefined) updateData.allowInventory = data.allowInventory;
    if (data.allowVariants !== undefined) updateData.allowVariants = data.allowVariants;
    if (data.allowCustomersCrm !== undefined) updateData.allowCustomersCrm = data.allowCustomersCrm;
    if (data.allowCoupons !== undefined) updateData.allowCoupons = data.allowCoupons;
    if (data.allowStaffAccounts !== undefined) updateData.allowStaffAccounts = data.allowStaffAccounts;
    if (data.allowAiSalesBot !== undefined) updateData.allowAiSalesBot = data.allowAiSalesBot;
    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      message: "Subscription plan updated successfully.",
      plan: {
        ...updatedPlan,
        maxStorageBytes: Number(updatedPlan.maxStorageBytes),
      },
    };
  });

  // GET /api/v1/admin/invoices - List recent invoices across all clients
  app.get("/invoices", async () => {
    const invoices = await prisma.subscriptionInvoice.findMany({
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return invoices.map((inv) => ({
      id: inv.id,
      amountInr: inv.amountInr,
      paymentStatus: inv.status,
      paidAt: inv.createdAt,
      createdAt: inv.createdAt,
      clientName: inv.client?.businessName || "Unknown Boutique",
      clientDomain: inv.client?.primaryDomain || "",
      ownerPhone: inv.client?.ownerPhone || "",
    }));
  });

  // GET /api/v1/admin/clients/:id/health - Ping and test single client website server live status
  app.get("/clients/:id/health", async (request, reply) => {
    const { id } = request.params as { id: string };
    const client = await prisma.client.findUnique({
      where: { id },
      select: { id: true, primaryDomain: true, businessName: true },
    });

    if (!client) {
      return reply.status(404).send({ error: "Client not found" });
    }

    const health = await uptimeWatchdogService.evaluateClientHealth(client.id, client.businessName, client.primaryDomain);
    return {
      clientId: client.id,
      businessName: client.businessName,
      domain: client.primaryDomain,
      ...health,
    };
  });

  // GET & POST /api/v1/admin/clients/health-check-all - Ping all client websites in parallel
  const handleHealthCheckAll = async () => {
    const clients = await prisma.client.findMany({
      select: { id: true, primaryDomain: true, businessName: true },
    });

    const results: Record<string, {
      clientId: string;
      businessName: string;
      domain: string;
      isLive: boolean;
      status: "ONLINE" | "DEGRADED" | "OFFLINE";
      statusCode: number | null;
      statusText: string;
      responseTimeMs: number;
      checkedUrl: string;
      checkedAt: string;
      protocol: "https" | "http";
      error?: string;
    }> = {};

    const pingPromises = clients.map(async (c) => {
      const health = await uptimeWatchdogService.evaluateClientHealth(c.id, c.businessName, c.primaryDomain);
      results[c.id] = {
        clientId: c.id,
        businessName: c.businessName,
        domain: c.primaryDomain,
        ...health,
      };
    });

    await Promise.all(pingPromises);

    const allResults = Object.values(results);
    const summary = {
      total: allResults.length,
      online: allResults.filter((r) => r.status === "ONLINE").length,
      degraded: allResults.filter((r) => r.status === "DEGRADED").length,
      offline: allResults.filter((r) => r.status === "OFFLINE").length,
    };

    return {
      summary,
      results,
    };
  };

  app.get("/clients/health-check-all", handleHealthCheckAll);
  app.post("/clients/health-check-all", handleHealthCheckAll);

  // GET /api/v1/admin/ping-domain - Ping any domain or custom URL
  app.get("/ping-domain", async (request, reply) => {
    const { domain } = request.query as { domain?: string };
    if (!domain) {
      return reply.status(400).send({ error: "Missing required query parameter: domain" });
    }
    const health = await checkDomainLiveHealth(domain);
    return {
      domain,
      ...health,
    };
  });

  // POST /api/v1/admin/clients/project-zip/presigned-url - Presigned S3 URL for uploading project zip
  app.post("/clients/project-zip/presigned-url", async (request, reply) => {
    const schema = z.object({
      fileName: z.string().min(1),
      clientId: z.string().optional(),
    });
    const parseResult = schema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid request payload", details: parseResult.error.format() });
    }

    const { fileName, clientId } = parseResult.data;
    const safeClientId = clientId ? clientId.replace(/[^a-zA-Z0-9_-]/g, "") : "temp";
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileKey = `projects/${safeClientId}/${Date.now()}_${crypto.randomBytes(4).toString("hex")}_${sanitizedName}`;

    try {
      const { uploadUrl, publicUrl } = await generatePresignedUploadUrl(
        fileKey,
        "application/zip",
        900
      );
      return {
        success: true,
        fileKey,
        uploadUrl,
        publicUrl,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return reply.status(500).send({ error: "Failed to generate presigned upload URL", details: message });
    }
  });
}
