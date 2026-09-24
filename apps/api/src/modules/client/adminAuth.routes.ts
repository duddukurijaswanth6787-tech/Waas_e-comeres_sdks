import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { authenticateClientPublic, authenticateClientSecret } from "../../middleware/auth.js";

const clientLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6),
  newUsername: z.string().optional(),
});

export async function clientAdminAuthRoutes(app: FastifyInstance) {
  // 1. POST /api/v1/client/admin/login - Store Owner logs in to /admin
  app.post(
    "/admin/login",
    { preHandler: [authenticateClientPublic] },
    async (request, reply) => {
      const parseResult = clientLoginSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: "Invalid login credentials", details: parseResult.error.format() });
      }

      const clientId = request.clientTenant!.id;
      const { username, password } = parseResult.data;

      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        return reply.status(404).send({ error: "Client store not found" });
      }

      const isMatch = client.adminUsername.toLowerCase() === username.toLowerCase() && client.adminPassword === password;
      if (!isMatch) {
        return reply.status(401).send({ error: "Invalid username or password" });
      }

      return {
        success: true,
        message: "Login successful",
        secretApiKey: client.secretApiKey,
        businessName: client.businessName,
        adminUsername: client.adminUsername,
      };
    }
  );

  // 2. POST /api/v1/client/admin/change-password - Store Owner updates their password
  app.post(
    "/admin/change-password",
    { preHandler: [authenticateClientSecret] },
    async (request, reply) => {
      const parseResult = changePasswordSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: "Invalid password update payload", details: parseResult.error.format() });
      }

      const clientId = request.clientTenant!.id;
      const { newPassword, newUsername } = parseResult.data;

      const updateData: { adminPassword?: string; adminUsername?: string } = {
        adminPassword: newPassword,
      };
      if (newUsername) updateData.adminUsername = newUsername;

      await prisma.client.update({
        where: { id: clientId },
        data: updateData,
      });

      return {
        success: true,
        message: "Store admin password updated successfully.",
      };
    }
  );
}
