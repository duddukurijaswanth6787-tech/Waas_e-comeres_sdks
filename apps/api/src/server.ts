import Fastify, { FastifyRequest, FastifyReply, FastifyError } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { env } from "./config/env.js";
import { adminAuthRoutes } from "./modules/admin/auth.routes.js";
import { adminClientRoutes } from "./modules/admin/client.routes.js";
import { clientStatusRoutes } from "./modules/client/status.routes.js";
import { clientAdminAuthRoutes } from "./modules/client/adminAuth.routes.js";
import { storageRoutes } from "./modules/storage/storage.routes.js";
import { billingRoutes } from "./modules/billing/billing.routes.js";
import { ecomRoutes } from "./modules/ecom/ecom.routes.js";
import { startExpiryCronJob } from "./services/cron.service.js";
import { seedEcomDatabase } from "./db/seed.js";
import { telegramService } from "./services/telegram.service.js";
import { uptimeWatchdogService } from "./services/uptime-watchdog.service.js";
// Polyfill BigInt serialization for JSON.stringify
declare global {
  interface BigInt {
    toJSON(): number;
  }
}

BigInt.prototype.toJSON = function () {
  return Number(this);
};

export const buildApp = async () => {
  const app = Fastify({
    logger: false,
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 1000,
    timeWindow: "1 minute",
  });

  // 🌟 BEAUTIFUL FORMATTED CONSOLE LOGGING MIDDLEWARE
  app.addHook("onRequest", async (request: FastifyRequest) => {
    (request as any).__startTime = Date.now();
  });

  app.addHook("preHandler", async (request: FastifyRequest) => {
    const clientId = request.headers["x-client-id"] || (request.query as any)?.clientId || "N/A";
    const bodyStr = request.body ? JSON.stringify(request.body) : "None";
    const truncatedBody = bodyStr.length > 200 ? `${bodyStr.substring(0, 200)}...` : bodyStr;

    console.log(`\n🔵 [API REQ] ${request.method} ${request.url}`);
    console.log(`   ├─ ClientID : ${clientId}`);
    console.log(`   ├─ Origin   : ${request.headers.origin || request.headers.host || "Local"}`);
    if (request.body) {
      console.log(`   └─ Body     : ${truncatedBody}`);
    }
  });

  app.addHook("onSend", async (request: FastifyRequest, reply: FastifyReply, payload: unknown) => {
    const duration = Date.now() - ((request as any).__startTime || Date.now());
    const statusCode = reply.statusCode;
    const statusColor = statusCode >= 400 ? "🔴" : statusCode >= 300 ? "🟡" : "🟢";

    let payloadSummary = "";
    if (typeof payload === "string") {
      try {
        const parsed = JSON.parse(payload);
        const str = JSON.stringify(parsed);
        payloadSummary = str.length > 250 ? `${str.substring(0, 250)}...` : str;
      } catch {
        payloadSummary = payload.length > 100 ? `${payload.substring(0, 100)}...` : payload;
      }
    }

    console.log(`${statusColor} [API RES] ${request.method} ${request.url} -> ${statusCode} (${duration}ms)`);
    if (payloadSummary && !request.url.startsWith("/sdk/v1/")) {
      console.log(`   └─ Response : ${payloadSummary}`);
    }
    return payload;
  });

  // 🛡️ GLOBAL ROBUST ERROR HANDLER
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    console.error(`\n🚨 [API ERROR] ${request.method} ${request.url}:`, error.message);

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        message: "Invalid input payload",
        details: error.issues.map((i) => ({
          field: i.path.join("."),
          issue: i.message,
        })),
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = (error.meta?.target as string[]) || ["field"];
        return reply.status(409).send({
          error: "CONFLICT",
          message: `A record with this ${target.join(", ")} already exists.`,
          code: error.code,
        });
      }
      if (error.code === "P2025") {
        return reply.status(404).send({
          error: "NOT_FOUND",
          message: "The requested record was not found in the database.",
          code: error.code,
        });
      }
    }

    if (error.statusCode && error.statusCode < 500) {
      return reply.status(error.statusCode).send({
        error: error.name || "CLIENT_ERROR",
        message: error.message,
      });
    }

    return reply.status(500).send({
      error: "INTERNAL_SERVER_ERROR",
      message: env.NODE_ENV === "production" ? "An unexpected server error occurred." : error.message,
    });
  });

  // 404 Route Not Found Handler
  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(404).send({
      error: "ROUTE_NOT_FOUND",
      message: `The endpoint ${request.method} ${request.url} does not exist on this server.`,
    });
  });

  // Serve Compiled SDK Files via CDN endpoint: /sdk/v1/*
  const candidatePaths = [
    path.resolve(process.cwd(), "packages/sdk/dist"),
    path.resolve(process.cwd(), "../../packages/sdk/dist"),
    path.resolve(__dirname, "../../../packages/sdk/dist"),
  ];
  const sdkDistPath = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];

  if (fs.existsSync(sdkDistPath)) {
    await app.register(fastifyStatic, {
      root: sdkDistPath,
      prefix: "/sdk/v1/",
      decorateReply: false,
    });
  }

  // Root landing endpoint
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const accept = request.headers.accept || "";
    if (accept.includes("text/html")) {
      reply.type("text/html");
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boutique Platform - Central API Engine</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 40px;
      max-width: 580px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #064e3b;
      color: #34d399;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .badge::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
    }
    h1 {
      font-size: 24px;
      margin: 0 0 8px;
      color: #ffffff;
      font-weight: 700;
    }
    p {
      color: #94a3b8;
      margin: 0 0 24px;
      line-height: 1.6;
      font-size: 14px;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s ease;
    }
    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #ffffff;
    }
    .btn-primary:hover {
      opacity: 0.95;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: #334155;
      color: #e2e8f0;
    }
    .btn-secondary:hover {
      background: #475569;
    }
    .footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #334155;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Backend API Server Live</div>
    <h1>Boutique Platform Central Hub</h1>
    <p>This is the backend API engine serving REST endpoints, Gatekeeper checks, and the unified client SDK.</p>
    <div class="actions">
      <a href="http://localhost:3000" class="btn btn-primary" target="_blank">
        <span>Open Super Admin Dashboard (UI)</span>
        <span>&rarr;</span>
      </a>
      <a href="/health" class="btn btn-secondary">
        <span>API Health Check</span>
        <code>/health</code>
      </a>
      <a href="/sdk/v1/boutique-sdk.min.js" class="btn btn-secondary" target="_blank">
        <span>Unified Master Client SDK</span>
        <code>boutique-sdk.min.js</code>
      </a>
    </div>
    <div class="footer">
      <span>Port: 4000 (Backend)</span>
      <span>Super Admin: Port 3000 (Frontend)</span>
    </div>
  </div>
</body>
</html>`;
    }
    return {
      service: "boutique-central-api",
      status: "online",
      message: "Boutique Platform Central Backend API is running.",
      adminDashboardUrl: "http://localhost:3000",
      healthEndpoint: `${env.API_PUBLIC_URL}/health`,
      sdkUrl: `${env.API_PUBLIC_URL}/sdk/v1/boutique-sdk.min.js`,
    };
  });

  // Health check endpoint
  app.get("/health", async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "boutique-central-api",
      version: "1.0.0",
      sdkUrl: `${env.API_PUBLIC_URL}/sdk/v1/boutique-sdk.min.js`,
    };
  });

  // Register API Routes
  await app.register(adminAuthRoutes, { prefix: "/api/v1/admin/auth" });
  await app.register(adminClientRoutes, { prefix: "/api/v1/admin" });
  await app.register(clientStatusRoutes, { prefix: "/api/v1/client" });
  await app.register(clientAdminAuthRoutes, { prefix: "/api/v1/client" });
  await app.register(storageRoutes, { prefix: "/api/v1/storage" });
  await app.register(billingRoutes, { prefix: "/api/v1/billing" });
  await app.register(ecomRoutes, { prefix: "/api/v1/ecom" });

  return app;
};

process.on("uncaughtException", (err) => {
  console.error("💥 [Process Uncaught Exception]:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("💥 [Process Unhandled Rejection]:", reason);
});

const start = async () => {
  try {
    const app = await buildApp();
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`🚀 [E-Com Central API] Live on port ${env.PORT}`);
    console.log(`📦 [SDK CDN] Bundles at http://0.0.0.0:${env.PORT}/sdk/v1/`);
    console.log(`🛡️ [Error Handler] Global Zod, Prisma & S3 error catchers active!`);
    console.log(`===============================================================\n`);
    seedEcomDatabase().catch((err) => console.warn("[DB Auto-Init]:", err.message));
    startExpiryCronJob();
    if (telegramService.isConfigured()) {
      telegramService.startPolling();
      uptimeWatchdogService.start(10000); // Heartbeat watchdog every 10 seconds
    }
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

if (process.argv[1] && process.argv[1].endsWith("server.ts")) {
  start();
}
