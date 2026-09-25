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

  // Seed / Sync Boutique Clients
  console.log("[Seed] Syncing active boutique clients...");

  // 1. Ramu boutique
  await prisma.client.upsert({
    where: { id: "cl_hyd_ramuboutique_791848" },
    update: {
      businessName: "Ramu boutique",
      ownerName: "Ramu",
      ownerPhone: "917788996655",
      ownerEmail: "ramu@gmail.com",
      city: "Hyderabad",
      storeAddress: "Hyderabad",
      instagramHandle: "@ramu",
      websiteType: "ECOMMERCE",
      primaryDomain: "localhost",
      allowedDomains: "localhost,127.0.0.1",
      adminUsername: "admin",
      adminPassword: "StorePassword@123",
      publicApiKey: "pk_" + "live_4be1fa991fd6ad880f12ba34c9e6cde5",
      secretApiKey: "sk_" + "live_4848a45318d8d2b53a6e8a94371802a293b4ee94759a78ea",
    },
    create: {
      id: "cl_hyd_ramuboutique_791848",
      businessName: "Ramu boutique",
      ownerName: "Ramu",
      ownerPhone: "917788996655",
      ownerEmail: "ramu@gmail.com",
      city: "Hyderabad",
      storeAddress: "Hyderabad",
      instagramHandle: "@ramu",
      websiteType: "ECOMMERCE",
      primaryDomain: "localhost",
      allowedDomains: "localhost,127.0.0.1",
      adminUsername: "admin",
      adminPassword: "StorePassword@123",
      publicApiKey: "pk_" + "live_4be1fa991fd6ad880f12ba34c9e6cde5",
      secretApiKey: "sk_" + "live_4848a45318d8d2b53a6e8a94371802a293b4ee94759a78ea",
      createdAt: new Date("2026-09-24T07:54:38.230Z"),
    },
  });

  await prisma.clientSubscription.upsert({
    where: { clientId: "cl_hyd_ramuboutique_791848" },
    update: {
      planId: "plan_ecom_standard",
      environmentMode: "TESTING",
      status: "TESTING",
      billingCycle: "MONTHLY",
    },
    create: {
      id: "5ec7c857-3f1e-43ee-a437-fc07d62f5d96",
      clientId: "cl_hyd_ramuboutique_791848",
      planId: "plan_ecom_standard",
      environmentMode: "TESTING",
      status: "TESTING",
      billingCycle: "MONTHLY",
      currentPeriodStart: new Date("2026-09-24T07:54:38.226Z"),
      currentPeriodEnd: new Date("2026-10-24T07:54:38.226Z"),
      gracePeriodEnd: new Date("2026-10-27T07:54:38.226Z"),
    },
  });

  // 2. Vasanti Creations
  await prisma.client.upsert({
    where: { id: "cl_hyd_vasanticreat_3ab4d8" },
    update: {
      businessName: "Vasanti Creations",
      ownerName: "Vasanti Devi",
      ownerPhone: "919876543210",
      ownerEmail: "vasanti@vasanticreations.com",
      city: "Hyderabad",
      storeAddress: "Road No. 10, Jubilee Hills, Hyderabad",
      instagramHandle: "@vasanticreations",
      websiteType: "ECOMMERCE",
      primaryDomain: "vswaas-web.vercel.app",
      allowedDomains: "localhost,127.0.0.1,localhost:3000,vswaas-web.vercel.app,vasanticreations.com",
      adminUsername: "admin",
      adminPassword: "StorePassword@123",
      publicApiKey: "pk_" + "live_52996adda36429e6aa48d824dbdf44ca",
      secretApiKey: "sk_" + "live_c6328a1f8448453dcb9aaed6fc02d45ac5fed30ddce09c5d",
    },
    create: {
      id: "cl_hyd_vasanticreat_3ab4d8",
      businessName: "Vasanti Creations",
      ownerName: "Vasanti Devi",
      ownerPhone: "919876543210",
      ownerEmail: "vasanti@vasanticreations.com",
      city: "Hyderabad",
      storeAddress: "Road No. 10, Jubilee Hills, Hyderabad",
      instagramHandle: "@vasanticreations",
      websiteType: "ECOMMERCE",
      primaryDomain: "vswaas-web.vercel.app",
      allowedDomains: "localhost,127.0.0.1,localhost:3000,vswaas-web.vercel.app,vasanticreations.com",
      adminUsername: "admin",
      adminPassword: "StorePassword@123",
      publicApiKey: "pk_" + "live_52996adda36429e6aa48d824dbdf44ca",
      secretApiKey: "sk_" + "live_c6328a1f8448453dcb9aaed6fc02d45ac5fed30ddce09c5d",
      createdAt: new Date("2026-09-24T09:21:57.804Z"),
    },
  });

  await prisma.clientSubscription.upsert({
    where: { clientId: "cl_hyd_vasanticreat_3ab4d8" },
    update: {
      planId: "plan_ecom_standard",
      environmentMode: "TESTING",
      status: "TESTING",
      billingCycle: "MONTHLY",
    },
    create: {
      id: "4d0960d2-c445-4c28-91b0-25b795f777d0",
      clientId: "cl_hyd_vasanticreat_3ab4d8",
      planId: "plan_ecom_standard",
      environmentMode: "TESTING",
      status: "TESTING",
      billingCycle: "MONTHLY",
      currentPeriodStart: new Date("2026-09-24T09:21:57.799Z"),
      currentPeriodEnd: new Date("2026-10-24T09:21:57.799Z"),
      gracePeriodEnd: new Date("2026-10-27T09:21:57.799Z"),
    },
  });

  // Media items for Vasanti Creations
  await prisma.mediaItem.upsert({
    where: { id: "4cd7328f-f8bc-4923-9072-7edb83794eea" },
    update: {},
    create: {
      id: "4cd7328f-f8bc-4923-9072-7edb83794eea",
      clientId: "cl_hyd_vasanticreat_3ab4d8",
      fileName: "ChatGPT Image Sep 16, 2026, 07_23_33 PM.webp",
      fileUrl: "https://boutique-media-848910045051-hyd.s3.ap-south-2.amazonaws.com/clients/cl_hyd_vasanticreat_3ab4d8/1790249519506_339f065c_ChatGPT_Image_Sep_16__2026__07_23_33_PM.webp",
      fileSizeBytes: BigInt(176300),
      mimeType: "image/webp",
      category: "media_library",
      title: "ChatGPT Image Sep 16, 2026, 07_23_33 PM.png",
      stockCount: 10,
      isActive: true,
      createdAt: new Date("2026-09-24T11:31:59.790Z"),
    },
  });

  await prisma.mediaItem.upsert({
    where: { id: "a869b5d2-7283-414c-be75-94ba266772e5" },
    update: {},
    create: {
      id: "a869b5d2-7283-414c-be75-94ba266772e5",
      clientId: "cl_hyd_vasanticreat_3ab4d8",
      fileName: "ChatGPT Image Sep 16, 2026, 05_12_43 PM.webp",
      fileUrl: "https://boutique-media-848910045051-hyd.s3.ap-south-2.amazonaws.com/clients/cl_hyd_vasanticreat_3ab4d8/1790252715697_256e8dff_ChatGPT_Image_Sep_16__2026__05_12_43_PM.webp",
      fileSizeBytes: BigInt(155112),
      mimeType: "image/webp",
      category: "media_library",
      title: "ChatGPT Image Sep 16, 2026, 05_12_43 PM.png",
      stockCount: 10,
      isActive: true,
      createdAt: new Date("2026-09-24T12:25:15.994Z"),
    },
  });

  console.log("[Seed] E-Commerce Database seeded successfully with active clients.");
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
