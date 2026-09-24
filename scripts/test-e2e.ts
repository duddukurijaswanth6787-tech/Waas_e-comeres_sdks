import { buildApp } from "../apps/api/src/server.js";
import { prisma } from "../apps/api/src/db/prisma.js";

async function runE2ETestSuite() {
  console.log("==================================================================");
  console.log("🚀 STARTING COMPLETE END-TO-END QA & VERIFICATION TEST SUITE");
  console.log("==================================================================");

  const app = await buildApp();

  let adminToken = "";
  let testClientId = "";
  let testPublicKey = "";
  let testSecretKey = "";

  // 🧪 TEST 1: Super Admin Authentication
  console.log("\n[TEST 1] Testing Super Admin Login...");
  const loginRes = await app.inject({
    method: "POST",
    url: "/api/v1/admin/auth/login",
    payload: {
      email: process.env.SUPER_ADMIN_EMAIL || "admin@ecomplatform.com",
      password: "AdminPassword@123",
    },
  });

  if (loginRes.statusCode === 200) {
    const data = JSON.parse(loginRes.body);
    adminToken = data.token;
    console.log("✓ Super Admin Login Passed. JWT Token Received.");
  } else {
    throw new Error(`Super Admin Login Failed: ${loginRes.body}`);
  }

  // 🧪 TEST 2: Client Onboarding
  console.log("\n[TEST 2] Testing Client Onboarding & Key Generation...");
  const onboardRes = await app.inject({
    method: "POST",
    url: "/api/v1/admin/clients",
    headers: { Authorization: `Bearer ${adminToken}` },
    payload: {
      businessName: "Sri Leela Bridal Sarees",
      ownerName: "Ananya Reddy",
      ownerPhone: "919876543210",
      primaryDomain: "srileelasarees.com",
      allowedDomains: "localhost,127.0.0.1,srileelasarees.com",
      planId: "plan_ecom_standard",
      billingCycle: "MONTHLY",
    },
  });

  if (onboardRes.statusCode === 201) {
    const data = JSON.parse(onboardRes.body);
    testClientId = data.client.id;
    testPublicKey = data.client.publicApiKey;
    testSecretKey = data.client.secretApiKey;
    console.log(`✓ Client Onboarded Successfully: ${testClientId}`);
    console.log(`  - Public Key: ${testPublicKey}`);
    console.log(`  - Secret Key: ${testSecretKey}`);
  } else {
    throw new Error(`Client Onboarding Failed: ${onboardRes.body}`);
  }

  // 🧪 TEST 3: Gatekeeper Subscription Status Check
  console.log("\n[TEST 3] Testing SDK Gatekeeper Status Endpoint...");
  const statusRes = await app.inject({
    method: "GET",
    url: "/api/v1/client/status",
    headers: {
      "x-client-id": testClientId,
      "x-public-key": testPublicKey,
      host: "srileelasarees.com",
    },
  });

  if (statusRes.statusCode === 200) {
    const data = JSON.parse(statusRes.body);
    console.log(`✓ Gatekeeper Status: ${data.status} (Plan: ${data.planName})`);
    console.log(`  - Quota: ${data.currentImagesCount}/${data.maxImages} Images, ${(data.maxStorageBytes / (1024 * 1024)).toFixed(0)} MB Storage`);
  } else {
    throw new Error(`Gatekeeper Status Check Failed: ${statusRes.body}`);
  }

  // 🧪 TEST 4: Domain Security & Anti-Tamper Origin Check
  console.log("\n[TEST 4] Testing Domain Whitelist Anti-Tamper Security...");
  const tamperRes = await app.inject({
    method: "GET",
    url: "/api/v1/client/status",
    headers: {
      "x-client-id": testClientId,
      "x-public-key": testPublicKey,
      origin: "http://unauthorized-hacker-site.com",
    },
  });

  if (tamperRes.statusCode === 403) {
    console.log("✓ Anti-Tamper Security Passed: Unauthorized domain rejected with 403 Forbidden.");
  } else {
    throw new Error(`Anti-Tamper Failed (Expected 403, got ${tamperRes.statusCode})`);
  }

  // 🧪 TEST 5: Storage Upload & Quota Validation
  console.log("\n[TEST 5] Testing Storage Presigned Upload & Quota Check...");
  const uploadReqRes = await app.inject({
    method: "POST",
    url: "/api/v1/storage/request-upload",
    headers: {
      "x-client-id": testClientId,
      "x-secret-key": testSecretKey,
    },
    payload: {
      fileName: "bridal_silk_saree.webp",
      fileSizeBytes: 350000,
      mimeType: "image/webp",
      category: "collection",
    },
  });

  if (uploadReqRes.statusCode === 200) {
    const uploadData = JSON.parse(uploadReqRes.body);
    console.log("✓ Presigned Upload URL Generated Successfully:");
    console.log(`  - File Key: ${uploadData.fileKey}`);

    // Confirm Upload in DB
    const confirmRes = await app.inject({
      method: "POST",
      url: "/api/v1/storage/confirm-upload",
      headers: {
        "x-client-id": testClientId,
        "x-secret-key": testSecretKey,
      },
      payload: {
        fileName: "bridal_silk_saree.webp",
        fileUrl: uploadData.publicUrl,
        fileSizeBytes: 350000,
        mimeType: "image/webp",
        category: "collection",
        title: "Kanchipuram Pure Bridal Silk Saree",
        price: 18500,
      },
    });

    if (confirmRes.statusCode === 201) {
      console.log("✓ Photo Record Confirmed in Database & Quota Updated.");
    } else {
      throw new Error(`Confirm Upload Failed: ${confirmRes.body}`);
    }
  } else {
    throw new Error(`Request Upload Failed: ${uploadReqRes.body}`);
  }

  // 🧪 TEST 6: Master Killswitch (Force Suspend & Lock)
  console.log("\n[TEST 6] Testing Master Killswitch & Suspension Overlay...");
  const suspendRes = await app.inject({
    method: "PATCH",
    url: `/api/v1/admin/clients/${testClientId}/status`,
    headers: { Authorization: `Bearer ${adminToken}` },
    payload: { status: "SUSPENDED", isManualOverride: true },
  });

  if (suspendRes.statusCode === 200) {
    console.log("✓ Super Admin Force Suspend Executed.");

    // Re-verify Gatekeeper reports SUSPENDED
    const verifySuspended = await app.inject({
      method: "GET",
      url: "/api/v1/client/status",
      headers: {
        "x-client-id": testClientId,
        "x-public-key": testPublicKey,
        host: "srileelasarees.com",
      },
    });
    const subStatus = JSON.parse(verifySuspended.body).status;
    if (subStatus === "SUSPENDED") {
      console.log("✓ Gatekeeper successfully reports SUSPENDED status (Lock Screen Active).");
    } else {
      throw new Error(`Expected status SUSPENDED, got ${subStatus}`);
    }
  } else {
    throw new Error(`Force Suspend Failed: ${suspendRes.body}`);
  }

  // 🧪 TEST 7: Razorpay Webhook Auto-Reactivation
  console.log("\n[TEST 7] Testing Razorpay Webhook & Instant Site Reactivation...");
  const webhookRes = await app.inject({
    method: "POST",
    url: "/api/v1/billing/webhooks/razorpay",
    payload: {
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_test_hyd_mock_999",
            amount: 79900,
            currency: "INR",
            notes: {
              clientId: testClientId,
              planId: "plan_ecom_standard",
              billingCycle: "MONTHLY",
            },
          },
        },
      },
    },
  });

  if (webhookRes.statusCode === 200) {
    console.log("✓ Razorpay Webhook Processed.");

    // Verify Subscription is back to ACTIVE
    const reactivatedCheck = await app.inject({
      method: "GET",
      url: "/api/v1/client/status",
      headers: {
        "x-client-id": testClientId,
        "x-public-key": testPublicKey,
        host: "srileelasarees.com",
      },
    });
    const reactivatedStatus = JSON.parse(reactivatedCheck.body).status;
    if (reactivatedStatus === "ACTIVE") {
      console.log("✓ Instant Site Auto-Unlock Verified: Status is ACTIVE again!");
    } else {
      throw new Error(`Expected status ACTIVE after payment webhook, got ${reactivatedStatus}`);
    }
  } else {
    throw new Error(`Webhook test failed: ${webhookRes.body}`);
  }

  console.log("\n==================================================================");
  console.log("🎉 ALL 7 E2E INTEGRATION & SECURITY TESTS PASSED WITH 100% SUCCESS!");
  console.log("==================================================================");

  await prisma.$disconnect();
}

runE2ETestSuite().catch((err) => {
  console.error("❌ Test Suite Failed:", err);
  process.exit(1);
});
