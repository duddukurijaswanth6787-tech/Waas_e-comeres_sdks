import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../db/prisma.js";
import { env } from "../config/env.js";
import jwt from "jsonwebtoken";

export interface AdminJwtPayload {
  adminId: string;
  email: string;
  role: "SUPER_ADMIN";
}

declare module "fastify" {
  interface FastifyRequest {
    superAdmin?: AdminJwtPayload;
    clientTenant?: {
      id: string;
      businessName: string;
      primaryDomain: string;
      allowedDomains: string[];
      publicApiKey: string;
      secretApiKey: string;
    };
  }
}

/**
 * Middleware to authenticate Super Admin via Bearer JWT
 */
export async function authenticateSuperAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Unauthorized: Missing Bearer Token" });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AdminJwtPayload;
    if (decoded.role !== "SUPER_ADMIN") {
      return reply.status(403).send({ error: "Forbidden: Super Admin access required" });
    }
    request.superAdmin = decoded;
  } catch {
    return reply.status(401).send({ error: "Unauthorized: Invalid or expired token" });
  }
}

/**
 * Helper to extract domain/hostname from request headers
 */
function extractHostname(request: FastifyRequest): string {
  const origin = request.headers.origin || request.headers.referer;
  if (origin) {
    try {
      const url = new URL(origin);
      return url.hostname.toLowerCase();
    } catch {
      // ignore
    }
  }
  const host = request.headers.host;
  if (host) {
    return host.split(":")[0].toLowerCase();
  }
  return "localhost";
}

/**
 * Middleware to authenticate Client SDK Public Key with Strict Domain Security
 */
export async function authenticateClientPublic(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const clientId = (request.headers["x-client-id"] as string) || (request.query as { clientId?: string })?.clientId;
  const publicKey = (request.headers["x-public-key"] as string) || (request.query as { publicKey?: string })?.publicKey;

  if (!clientId || !publicKey) {
    return reply.status(401).send({ error: "Unauthorized: Missing x-client-id or x-public-key" });
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client || client.publicApiKey !== publicKey) {
    return reply.status(401).send({ error: "Unauthorized: Invalid client credentials" });
  }

  // Strict Domain Origin Security Check
  const requestHostname = extractHostname(request);
  const allowed = client.allowedDomains
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").split(":")[0])
    .filter(Boolean);

  const isDomainAllowed = allowed.includes(requestHostname) || allowed.includes("*");

  if (!isDomainAllowed) {
    return reply.status(403).send({
      error: "UNAUTHORIZED_DOMAIN",
      message: `Forbidden: Domain '${requestHostname}' is not whitelisted for this ClientID (${client.id})`,
      currentDomain: requestHostname,
      whitelistedDomains: allowed,
    });
  }

  request.clientTenant = {
    id: client.id,
    businessName: client.businessName,
    primaryDomain: client.primaryDomain,
    allowedDomains: allowed,
    publicApiKey: client.publicApiKey,
    secretApiKey: client.secretApiKey,
  };
}

/**
 * Middleware to authenticate Client Secret Key (Used in /admin dashboard)
 */
export async function authenticateClientSecret(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const clientId = (request.headers["x-client-id"] as string) || (request.headers["x-boutique-client-id"] as string);
  const secretKey = (request.headers["x-secret-key"] as string) || (request.headers["x-boutique-secret-key"] as string);

  if (!clientId || !secretKey) {
    return reply.status(401).send({ error: "Unauthorized: Missing Client Secret Key" });
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client || client.secretApiKey !== secretKey) {
    return reply.status(401).send({ error: "Unauthorized: Invalid client secret credentials" });
  }

  request.clientTenant = {
    id: client.id,
    businessName: client.businessName,
    primaryDomain: client.primaryDomain,
    allowedDomains: client.allowedDomains.split(",").map((d) => d.trim()),
    publicApiKey: client.publicApiKey,
    secretApiKey: client.secretApiKey,
  };
}
