import { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../db/prisma.js";
import { env } from "../../config/env.js";
import { authenticateClientSecret, authenticateClientPublic } from "../../middleware/auth.js";
import { telegramService } from "../../services/telegram.service.js";

const createOrderSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(10),
  customerEmail: z.string().email().optional(),
  shippingAddress: z.string().min(5),
  city: z.string().min(2),
  pincode: z.string().min(4),
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      price: z.number().int().positive(),
      quantity: z.number().int().positive(),
      size: z.string().optional(),
      color: z.string().optional(),
      image: z.string().optional(),
    })
  ).min(1),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(["RAZORPAY", "COD", "WHATSAPP_MANUAL"]).default("RAZORPAY"),
});

const staffLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

const createStaffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(["OWNER", "MANAGER", "CATALOG_EDITOR", "ORDER_FULFILLER"]).default("MANAGER"),
});

export async function ecomRoutes(app: FastifyInstance) {
  // 1. POST /api/v1/ecom/orders - Public customer checkout
  app.post(
    "/orders",
    { preHandler: [authenticateClientPublic] },
    async (request, reply) => {
      const clientId = request.clientTenant!.id;
      const parseResult = createOrderSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: "Invalid order payload", details: parseResult.error.format() });
      }

      const {
        customerName,
        customerPhone,
        customerEmail,
        shippingAddress,
        city,
        pincode,
        items,
        couponCode,
        paymentMethod,
      } = parseResult.data;

      // Calculate Subtotal
      let subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      let discount = 0;

      // Apply Coupon if provided
      if (couponCode) {
        const coupon = await prisma.storeCoupon.findFirst({
          where: {
            clientId,
            code: couponCode.toUpperCase(),
            isActive: true,
          },
        });

        if (coupon && subtotal >= coupon.minOrderValue) {
          if (coupon.discountType === "PERCENTAGE") {
            discount = Math.round((subtotal * coupon.discountValue) / 100);
          } else {
            discount = coupon.discountValue;
          }
          await prisma.storeCoupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }

      const deliveryFee = subtotal >= 2999 ? 0 : 99; // Free shipping over ₹2,999
      const totalAmount = Math.max(0, subtotal - discount + deliveryFee);
      const orderNumber = `#ORD-${Date.now().toString().slice(-6)}`;

      // Create or update Customer CRM
      const cleanPhone = customerPhone.replace(/[^0-9]/g, "");
      await prisma.storeCustomer.upsert({
        where: {
          clientId_phone: { clientId, phone: cleanPhone },
        },
        update: {
          name: customerName,
          email: customerEmail || undefined,
          city,
          address: shippingAddress,
          totalOrders: { increment: 1 },
          totalSpentInr: { increment: totalAmount },
          lastOrderAt: new Date(),
        },
        create: {
          clientId,
          name: customerName,
          phone: cleanPhone,
          email: customerEmail || null,
          city,
          address: shippingAddress,
          totalOrders: 1,
          totalSpentInr: totalAmount,
        },
      });

      // Create Order
      const order = await prisma.storeOrder.create({
        data: {
          clientId,
          orderNumber,
          customerName,
          customerPhone: cleanPhone,
          customerEmail: customerEmail || null,
          shippingAddress,
          city,
          pincode,
          itemsJson: JSON.stringify(items),
          subtotalInr: subtotal,
          discountInr: discount,
          deliveryFeeInr: deliveryFee,
          totalAmountInr: totalAmount,
          status: "PENDING",
          paymentStatus: paymentMethod === "COD" ? "PENDING" : "PENDING",
          paymentMethod,
        },
      });
      // Dispatch Instant Telegram Order Alert
      if (telegramService.isConfigured()) {
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        telegramService.sendNewCustomerOrderAlert(
          client?.businessName || "Store",
          order.orderNumber,
          customerName,
          cleanPhone,
          totalAmount,
          items.length,
          paymentMethod
        ).catch(() => {});
      }

      return reply.status(201).send({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmountInr: totalAmount,
        currency: "INR",
        paymentMethod,
        order,
      });
    }
  );

  // 2. GET /api/v1/ecom/orders - Store Admin Orders Management
  app.get(
    "/orders",
    { preHandler: [authenticateClientSecret] },
    async (request) => {
      const clientId = request.clientTenant!.id;
      const orders = await prisma.storeOrder.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
      });

      return orders.map((o) => ({
        ...o,
        items: JSON.parse(o.itemsJson),
      }));
    }
  );

  // 3. PATCH /api/v1/ecom/orders/:id/status - Update Order Status (Shipped / Delivered)
  app.patch(
    "/orders/:id/status",
    { preHandler: [authenticateClientSecret] },
    async (request, reply) => {
      const clientId = request.clientTenant!.id;
      const { id } = request.params as { id: string };
      const schema = z.object({
        status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
        paymentStatus: z.enum(["PENDING", "PAID_ONLINE", "COD"]).optional(),
      });
      const parseResult = schema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: "Invalid status", details: parseResult.error.format() });
      }

      const updated = await prisma.storeOrder.update({
        where: { id, clientId },
        data: parseResult.data,
      });

      return { success: true, order: updated };
    }
  );

  // 4. GET /api/v1/ecom/customers - Customer CRM List
  app.get(
    "/customers",
    { preHandler: [authenticateClientSecret] },
    async (request) => {
      const clientId = request.clientTenant!.id;
      return prisma.storeCustomer.findMany({
        where: { clientId },
        orderBy: { totalSpentInr: "desc" },
      });
    }
  );

  // 5. GET /api/v1/ecom/inventory - Stock Inventory Tracker
  app.get(
    "/inventory",
    { preHandler: [authenticateClientSecret] },
    async (request) => {
      const clientId = request.clientTenant!.id;
      return prisma.clientMedia.findMany({
        where: { clientId, isActive: true },
        select: {
          id: true,
          title: true,
          price: true,
          stockCount: true,
          sku: true,
          sizesJson: true,
          colorsJson: true,
          fileUrl: true,
        },
      });
    }
  );

  // 6. POST /api/v1/ecom/staff/login - Multi-Staff Authentication
  app.post("/staff/login", async (request, reply) => {
    const parseResult = staffLoginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid staff credentials", details: parseResult.error.format() });
    }

    const { email, password } = parseResult.data;
    const staff = await prisma.storeStaff.findFirst({
      where: { email, isActive: true },
      include: { client: true },
    });

    if (!staff) {
      return reply.status(401).send({ error: "Invalid email or staff account inactive" });
    }

    const isMatch = await bcrypt.compare(password, staff.passwordHash);
    if (!isMatch) {
      return reply.status(401).send({ error: "Incorrect staff password" });
    }

    const token = jwt.sign(
      {
        staffId: staff.id,
        clientId: staff.clientId,
        role: staff.role,
        name: staff.name,
      },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      success: true,
      token,
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        clientId: staff.clientId,
        storeName: staff.client.businessName,
      },
    };
  });

  // 7. GET /api/v1/ecom/staff - Staff List
  app.get(
    "/staff",
    { preHandler: [authenticateClientSecret] },
    async (request) => {
      const clientId = request.clientTenant!.id;
      return prisma.storeStaff.findMany({
        where: { clientId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });
    }
  );

  // 8. POST /api/v1/ecom/staff - Add Staff Account
  app.post(
    "/staff",
    { preHandler: [authenticateClientSecret] },
    async (request, reply) => {
      const clientId = request.clientTenant!.id;
      const parseResult = createStaffSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: "Invalid staff payload", details: parseResult.error.format() });
      }

      const { name, email, phone, password, role } = parseResult.data;
      const passwordHash = await bcrypt.hash(password, 10);

      const staff = await prisma.storeStaff.create({
        data: {
          clientId,
          name,
          email,
          phone: phone || null,
          passwordHash,
          role,
        },
      });

      return reply.status(201).send({
        success: true,
        staff: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
        },
      });
    }
  );
}
