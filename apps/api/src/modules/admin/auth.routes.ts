import { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../db/prisma.js";
import { env } from "../../config/env.js";
import { authenticateSuperAdmin } from "../../middleware/auth.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const changeMasterPasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export async function adminAuthRoutes(app: FastifyInstance) {
  // POST /api/v1/admin/auth/login
  app.post("/login", async (request, reply) => {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid login payload", details: parseResult.error.format() });
    }

    const { email, password } = parseResult.data;

    const admin = await prisma.superAdmin.findUnique({
      where: { email },
    });

    if (!admin) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        adminId: admin.id,
        email: admin.email,
        role: "SUPER_ADMIN",
      },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    };
  });

  // GET /api/v1/admin/auth/me
  app.get("/me", { preHandler: [authenticateSuperAdmin] }, async (request) => {
    return {
      authenticated: true,
      user: request.superAdmin,
    };
  });

  // POST /api/v1/admin/auth/change-password - Change Super Admin Master Password
  app.post("/change-password", { preHandler: [authenticateSuperAdmin] }, async (request, reply) => {
    const parseResult = changeMasterPasswordSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid password payload", details: parseResult.error.format() });
    }

    const { currentPassword, newPassword } = parseResult.data;
    const adminId = request.superAdmin!.adminId;

    const admin = await prisma.superAdmin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return reply.status(404).send({ error: "Admin account not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isMatch) {
      return reply.status(400).send({ error: "Current password is incorrect" });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.superAdmin.update({
      where: { id: adminId },
      data: { passwordHash: newHash },
    });

    return {
      success: true,
      message: "Master Super Admin password updated successfully.",
    };
  });
}
