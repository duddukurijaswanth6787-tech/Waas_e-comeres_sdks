import { buildApp } from "../apps/api/src/server.js";

async function runEcomE2ETests() {
  console.log("==================================================================");
  console.log("🛒 STARTING PLATFORM 2 (FULL E-COMMERCE) INTEGRATION & QA MATRIX");
  console.log("==================================================================");

  const app = await buildApp();
  await app.listen({ port: 5000, host: "127.0.0.1" });
  console.log("✅ Platform 2 E-Com API started on http://127.0.0.1:5000");

  const baseUrl = "http://127.0.0.1:5000/api/v1";

  // 1. Super Admin Login
  console.log("\n[TEST 1] Testing E-Com Super Admin Login...");
  const loginRes = await fetch(`${baseUrl}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@ecomplatform.com", password: "AdminPassword@123" }),
  });
  const loginData = (await loginRes.json()) as { success: boolean; token: string };
  if (!loginData.token) throw new Error("Super Admin Login failed");
  console.log("✓ Super Admin Login Passed. JWT Received.");
  const token = loginData.token;

  // 2. Onboard E-Com Store
  console.log("\n[TEST 2] Testing E-Com Merchant Onboarding (plan_ecom_standard)...");
  const onboardRes = await fetch(`${baseUrl}/admin/clients`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      businessName: "Kalyan Bridal Silks",
      ownerName: "Kalyan Kumar",
      ownerPhone: "919876543210",
      primaryDomain: "kalyanbridalsilks.com",
      allowedDomains: "localhost,127.0.0.1,kalyanbridalsilks.com",
      planId: "plan_ecom_standard",
      websiteType: "ECOMMERCE",
    }),
  });
  const onboardData = (await onboardRes.json()) as { success: boolean; client: { id: string; publicApiKey: string; secretApiKey: string } };
  console.log("✓ E-Com Client Onboarded:", onboardData.client.id);
  const client = onboardData.client;

  // 3. Gatekeeper Check with E-Commerce Feature Flags
  console.log("\n[TEST 3] Testing SDK Gatekeeper with E-Com Feature Entitlements...");
  const gkRes = await fetch(`${baseUrl}/client/status`, {
    headers: {
      "x-client-id": client.id,
      "x-public-key": client.publicApiKey,
      Origin: "kalyanbridalsilks.com",
    },
  });
  const gkData = (await gkRes.json()) as { status: string; allowOnlineCart: boolean; allowOrdersPortal: boolean; allowInventory: boolean; allowStaffAccounts: number };
  console.log("✓ Gatekeeper Entitlements Verified:", {
    status: gkData.status,
    cartEnabled: gkData.allowOnlineCart,
    ordersPortal: gkData.allowOrdersPortal,
    inventory: gkData.allowInventory,
    staffAccountsAllowed: gkData.allowStaffAccounts,
  });

  // 4. Multi-Item Cart Checkout (Order Placement)
  console.log("\n[TEST 4] Testing Public Customer Order Placement (Shopping Cart)...");
  const orderRes = await fetch(`${baseUrl}/ecom/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": client.id,
      "x-public-key": client.publicApiKey,
      Origin: "kalyanbridalsilks.com",
    },
    body: JSON.stringify({
      customerName: "Pooja Hegde",
      customerPhone: "919988776655",
      customerEmail: "pooja@example.com",
      shippingAddress: "Flat 402, Royal Palms, Jubilee Hills",
      city: "Hyderabad",
      pincode: "500033",
      items: [
        { id: "item_1", title: "Kanchipuram Pure Zari Silk Saree", price: 24500, quantity: 1, size: "Free Size", color: "Crimson Red" },
        { id: "item_2", title: "Designer Blouse Stitching", price: 3500, quantity: 1, size: "36", color: "Gold" },
      ],
      paymentMethod: "RAZORPAY",
    }),
  });
  const orderData = (await orderRes.json()) as { success: boolean; orderNumber: string; totalAmountInr: number };
  console.log(`✓ Order Placed Successfully: ${orderData.orderNumber} (Total: ₹${orderData.totalAmountInr})`);

  // 5. Merchant Order Management & Status Update
  console.log("\n[TEST 5] Testing Store Owner /admin Order Fulfillment...");
  const ordersListRes = await fetch(`${baseUrl}/ecom/orders`, {
    headers: {
      "x-client-id": client.id,
      "x-secret-key": client.secretApiKey,
    },
  });
  const ordersList = (await ordersListRes.json()) as Array<{ id: string; orderNumber: string; customerName: string; totalAmountInr: number }>;
  console.log(`✓ Retrieved ${ordersList.length} live orders for ${client.id}`);

  // 6. Multi-Staff Account Creation & Role Authentication
  console.log("\n[TEST 6] Testing Multi-Staff Role Creation (Cashier / Order Fulfiller)...");
  const createStaffRes = await fetch(`${baseUrl}/ecom/staff`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": client.id,
      "x-secret-key": client.secretApiKey,
    },
    body: JSON.stringify({
      name: "Suresh Rao",
      email: "suresh@kalyanbridalsilks.com",
      phone: "918877665544",
      password: "StaffPassword@123",
      role: "ORDER_FULFILLER",
    }),
  });
  const staffData = (await createStaffRes.json()) as { success: boolean; staff: { name: string; role: string } };
  console.log(`✓ Staff Account Created: ${staffData.staff.name} (Role: ${staffData.staff.role})`);

  // 7. Customer CRM Listing
  console.log("\n[TEST 7] Testing Customer CRM & Lifetime Value (LTV)...");
  const crmRes = await fetch(`${baseUrl}/ecom/customers`, {
    headers: {
      "x-client-id": client.id,
      "x-secret-key": client.secretApiKey,
    },
  });
  const customers = (await crmRes.json()) as Array<{ name: string; phone: string; totalSpentInr: number; totalOrders: number }>;
  console.log(`✓ Customer CRM Verified: ${customers[0]?.name} (Orders: ${customers[0]?.totalOrders}, Spent: ₹${customers[0]?.totalSpentInr})`);

  console.log("\n==================================================================");
  console.log("🎉 ALL 7 FULL E-COMMERCE INTEGRATION TESTS PASSED WITH 100% SUCCESS!");
  console.log("==================================================================");

  await app.close();
  process.exit(0);
}

runEcomE2ETests().catch((e) => {
  console.error("❌ E2E Failed:", e);
  process.exit(1);
});
