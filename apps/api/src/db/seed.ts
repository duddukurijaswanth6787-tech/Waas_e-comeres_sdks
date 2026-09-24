import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";
import { env } from "../config/env.js";

export async function seedEcomDatabase() {
  console.log("[Seed] Seeding E-Commerce subscription plans...");

  const plans = [
    {
      id: "plan_ecom_standard",
      name: "E-Com Standard Store",
      priceInrMonthly: 2499,
      priceInrYearly: 24990,
      maxImages: 150,
      maxStorageBytes: BigInt(10 * 1024 * 1024 * 1024), // 10 GB
      allowCustomDomain: true,
      allowOnlineCart: true,
      allowCustomerGateway: true,
      allowOrdersPortal: true,
      allowInventory: true,
      allowVariants: true,
      allowCustomersCrm: true,
      allowCoupons: true,
      allowStaffAccounts: 2,
      allowAiSalesBot: false,
    },
    {
      id: "plan_ecom_pro",
      name: "E-Com Pro Flagship",
      priceInrMonthly: 3999,
      priceInrYearly: 39990,
      maxImages: 500,
      maxStorageBytes: BigInt(25 * 1024 * 1024 * 1024), // 25 GB
      allowCustomDomain: true,
      allowOnlineCart: true,
      allowCustomerGateway: true,
      allowOrdersPortal: true,
      allowInventory: true,
      allowVariants: true,
      allowCustomersCrm: true,
      allowCoupons: true,
      allowStaffAccounts: 5,
      allowAiSalesBot: false,
    },
    {
      id: "plan_ecom_enterprise",
      name: "E-Com Enterprise Omnichannel",
      priceInrMonthly: 5999,
      priceInrYearly: 59990,
      maxImages: 2000,
      maxStorageBytes: BigInt(100 * 1024 * 1024 * 1024), // 100 GB
      allowCustomDomain: true,
      allowOnlineCart: true,
      allowCustomerGateway: true,
      allowOrdersPortal: true,
      allowInventory: true,
      allowVariants: true,
      allowCustomersCrm: true,
      allowCoupons: true,
      allowStaffAccounts: 20,
      allowAiSalesBot: true,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
  }

  // Seed Default Super Admin Account
  const passwordHash = await bcrypt.hash("AdminPassword@123", 10);
  await prisma.superAdmin.upsert({
    where: { email: env.SUPER_ADMIN_EMAIL },
    update: {
      passwordHash: passwordHash,
      name: "Master E-Commerce Agency Owner",
    },
    create: {
      email: env.SUPER_ADMIN_EMAIL,
      name: "Master E-Commerce Agency Owner",
      passwordHash: passwordHash,
    },
  });

  console.log("[Seed] E-Commerce Database seeded successfully.");
}
if (process.argv[1] && (process.argv[1].endsWith("seed.ts") || process.argv[1].endsWith("seed.js"))) {
  seedEcomDatabase()
    .catch((e) => {
      console.error("[Seed Error]", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
