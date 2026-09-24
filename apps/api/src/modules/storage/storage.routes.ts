import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { authenticateClientSecret, authenticateClientPublic } from "../../middleware/auth.js";
import { generatePresignedUploadUrl, deleteStorageObject } from "../../services/storage.service.js";
import crypto from "crypto";

const requestUploadSchema = z.object({
  fileName: z.string().min(1),
  fileSizeBytes: z.number().int().positive(),
  mimeType: z.string().default("image/webp"),
  category: z.string().default("collection"),
});

const confirmUploadSchema = z.object({
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  fileSizeBytes: z.number().int().positive(),
  mimeType: z.string().default("image/webp"),
  category: z.string().default("collection"),
  title: z.string().optional(),
  price: z.number().optional(),
});

export async function storageRoutes(app: FastifyInstance) {
  // 1. GET /api/v1/storage/media - Fetch active gallery products for public website
  app.get(
    "/media",
    { preHandler: [authenticateClientPublic] },
    async (request) => {
      const clientId = request.clientTenant!.id;
      const media = await prisma.clientMedia.findMany({
        where: {
          clientId,
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return media.map((m) => ({
        id: m.id,
        fileName: m.fileName,
        fileUrl: m.fileUrl,
        category: m.category,
        title: m.title,
        price: m.price,
        fileSizeBytes: Number(m.fileSizeBytes),
        createdAt: m.createdAt,
      }));
    }
  );

  // 2. POST /api/v1/storage/request-upload - Quota Gate & Presigned URL Generation
  app.post(
    "/request-upload",
    { preHandler: [authenticateClientSecret] },
    async (request, reply) => {
      const parseResult = requestUploadSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: "Invalid upload request", details: parseResult.error.format() });
      }

      const clientId = request.clientTenant!.id;
      const { fileName, fileSizeBytes, mimeType } = parseResult.data;

      // Fetch client subscription and current quota usage
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          subscription: { include: { plan: true } },
          media: { where: { isActive: true }, select: { fileSizeBytes: true } },
        },
      });

      if (!client || !client.subscription) {
        return reply.status(404).send({ error: "Client subscription not found" });
      }

      const plan = client.subscription.plan;
      const currentImagesCount = client.media.length;
      const currentStorageBytes = client.media.reduce(
        (acc, item) => acc + Number(item.fileSizeBytes),
        0
      );

      // QUOTA CHECK 1: Max Images Count Limit
      if (currentImagesCount + 1 > plan.maxImages) {
        return reply.status(403).send({
          error: "QUOTA_EXCEEDED",
          reason: "IMAGE_COUNT_LIMIT",
          message: `Photo limit reached (${currentImagesCount}/${plan.maxImages} photos used). Please upgrade your plan to upload more photos.`,
          currentCount: currentImagesCount,
          maxImages: plan.maxImages,
        });
      }

      // QUOTA CHECK 2: Storage Size Byte Limit
      const maxStorageBytes = Number(plan.maxStorageBytes);
      if (currentStorageBytes + fileSizeBytes > maxStorageBytes) {
        return reply.status(403).send({
          error: "QUOTA_EXCEEDED",
          reason: "STORAGE_SIZE_LIMIT",
          message: `Storage capacity reached (${(currentStorageBytes / (1024 * 1024 * 1024)).toFixed(2)} GB / ${(maxStorageBytes / (1024 * 1024 * 1024)).toFixed(2)} GB). Please upgrade your plan.`,
          currentStorageBytes,
          maxStorageBytes,
        });
      }

      // Generate unique file path in R2 bucket
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const fileKey = `clients/${clientId}/${Date.now()}_${crypto.randomBytes(4).toString("hex")}_${sanitizedName}`;

      const { uploadUrl, publicUrl } = await generatePresignedUploadUrl(fileKey, mimeType);

      return {
        success: true,
        fileKey,
        uploadUrl,
        publicUrl,
        currentUsage: {
          imagesUsed: currentImagesCount,
          maxImages: plan.maxImages,
          storageBytesUsed: currentStorageBytes,
          maxStorageBytes,
        },
      };
    }
  );

  // 3. POST /api/v1/storage/confirm-upload - Save uploaded photo in DB
  app.post(
    "/confirm-upload",
    { preHandler: [authenticateClientSecret] },
    async (request, reply) => {
      const parseResult = confirmUploadSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: "Invalid payload", details: parseResult.error.format() });
      }

      const clientId = request.clientTenant!.id;
      const data = parseResult.data;

      const media = await prisma.clientMedia.create({
        data: {
          clientId,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileSizeBytes: BigInt(data.fileSizeBytes),
          mimeType: data.mimeType,
          category: data.category,
          title: data.title,
          price: data.price,
        },
      });

      return reply.status(201).send({
        success: true,
        media: {
          id: media.id,
          fileName: media.fileName,
          fileUrl: media.fileUrl,
          title: media.title,
          price: media.price,
          category: media.category,
        },
      });
    }
  );

  // 4. DELETE /api/v1/storage/media/:id - Delete photo & free up quota
  app.delete(
    "/media/:id",
    { preHandler: [authenticateClientSecret] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const clientId = request.clientTenant!.id;

      const media = await prisma.clientMedia.findFirst({
        where: { id, clientId },
      });

      if (!media) {
        return reply.status(404).send({ error: "Media item not found" });
      }

      // Delete from cloud storage if needed
      try {
        const url = new URL(media.fileUrl);
        const fileKey = url.pathname.replace(/^\//, "");
        await deleteStorageObject(fileKey);
      } catch {
        // ignore url parsing issues
      }

      // Delete from DB
      await prisma.clientMedia.delete({
        where: { id },
      });

      return {
        success: true,
        message: "Media item deleted and quota restored.",
      };
    }
  );
}
