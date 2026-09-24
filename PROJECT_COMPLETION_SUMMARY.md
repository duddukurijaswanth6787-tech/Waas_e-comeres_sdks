# Boutique Platform: Complete System Handover & Project Summary
## Website-as-a-Service (WaaS), Central SaaS Engine & Unified SDK Platform

---

## 📖 1. Project Overview & Business Model

* **Target Market:** Boutique stores, bridal studios, couture designers, and local retail stores in Hyderabad and India.
* **Core Problem Solved:** Small boutique owners hesitate to pay high upfront development fees (₹20,000–₹50,000). This platform enables a recurring **Website-as-a-Service (WaaS)** subscription model (e.g. ₹799/mo, ₹1,499/mo, ₹2,999/mo).
* **Architecture Strategy:**
  - **This Central Hub Repository (`website`):** Hosts the Central Multi-Tenant Backend API, PostgreSQL Database, AWS S3 Hyderabad Storage Engine, Razorpay Billing Webhook Auto-Unlocker, and the Super Admin Control Dashboard.
  - **Unified Master Client SDK (`boutique-sdk.min.js`):** A single 35KB JavaScript library distributed via CDN that drops into any external static or React boutique website to enforce gatekeeping, photo quotas, dynamic gallery rendering, and WhatsApp checkout.
  - **External Client Websites:** Built in separate, independent repositories using AI coding tools (Cursor / Windsurf / Claude / ChatGPT / OMP) driven by the AI Prompts generated from this platform.

---

## 🏗️ 2. What Was Built (The 5 Core Pillars)

### Pillar 1: Central SaaS Backend API & Multi-Tenant Database (`apps/api`)
- **Framework:** Node.js, TypeScript, Fastify.
- **Database Engine:** Multi-Tenant Prisma schema with data isolation keyed by `ClientID`.
- **Key Services:**
  - Real-time Sub-20ms Gatekeeper Status Check (`GET /api/v1/client/status`).
  - Strict Domain Whitelist Anti-Tamper Security (rejects unauthorized domains with `403 Forbidden`).
  - AWS S3 Hyderabad Presigned Uploads (`POST /api/v1/storage/request-upload`).
  - Automated Daily Midnight Subscription Expiry Worker.
  - Automated WhatsApp Renewal Reminder Dispatcher (`T-5 Days`, `T-1 Day`, `Grace`, `Suspended`).
  - Razorpay Webhook Auto-Reactivation (`POST /api/v1/billing/webhooks/razorpay`).

---

### Pillar 2: Real AWS S3 Cloud Storage Integration (Hyderabad Region)
- **Bucket Name:** `boutique-media-848910045051-hyd`
- **Region:** `ap-south-2` (Hyderabad, India — ultra-low latency).
- **Security & Access:** Public Read enabled for boutique photos, CORS configured for direct browser presigned `PUT` uploads.
- **Quota Enforcer:** Automatically blocks uploads when plan photo count or storage bytes are exceeded.

---

### Pillar 3: Unified Client Master SDK (`packages/sdk`)
Hosted live at `http://localhost:4000/sdk/v1/boutique-sdk.min.js`:
1. **Gatekeeper Module:** `<20ms` status check, 3-day Grace Period banner, Full-screen Suspension Lock Screen with UPI payment button, and Red Unauthorized Domain Lock.
2. **Storage Module:** Client-side HTML5 Canvas WebP compressor (reduces 10MB camera photos to &lt;400KB WebP) and presigned direct S3 upload handler.
3. **Dynamic CMS & WhatsApp Module:** Anti-tamper cloud gallery fetcher and pre-filled WhatsApp click-to-chat checkout link generator.
4. **Self-Serve Billing Module:** Embedded Razorpay modal launcher with 3-second instant auto-unlock.
5. **Store Owner `/admin` UI Module:** Complete drop-in admin dashboard with Username & Password login gate, live quota progress bars, WebP uploader, password update modal, and plan comparison & upgrade modal.

---

### Pillar 4: Super Admin Dashboard (`apps/super-admin`)
Hosted live at `http://localhost:3000`:
- **Theme:** Clean, modern, elegant light theme with Left Sidebar Navigation (Stripe / Shopify style).
- **Navigation Sections:**
  1. **📊 Overview & Analytics:** MRR metrics (₹), active stores counter, overdue count, S3 MB consumed, system health.
  2. **👗 Boutique Stores:** Search bar, status filters (`🟢 Active`, `🟡 Grace`, `🔴 Suspended`), export to CSV, and the **Slide-Over Store Management Drawer** (with 👁️ Password View, +7 Days Grace, Force Suspend, Edit Profile, and Delete).
  3. **📦 Subscription Plans:** Tiers (Starter, Growth, Pro) with 1-click **"Edit Plan & Pricing"** modal.
  4. **☁️ AWS S3 Storage:** Hyderabad bucket metrics + per-boutique storage breakdown table with progress bars.
  5. **💳 Invoices & Billing:** Payment transaction logs and receipt amounts.
  6. **🤖 AI Prompt Kit & Builder Hub:** 4-pillar metadata pills with 1-click copy + 3 output formats (**React Vite**, **Plain HTML**, and **Automated SDK Testing & E2E Verification**).
  7. **🧪 Live SDK Testing Playground:** Interactive diagnostic runner testing all 6 SDK sub-modules in real-time.
  8. **📖 Developer Mandates & Docs:** Interactive manual with copyable code snippets.

---

### Pillar 5: Complete Testing-to-Live Lifecycle & First-Payment Engine
1. **🟡 Testing Mode (Default):** Onboard store $\rightarrow$ website and `/admin` work freely with zero payment walls for the developer to build and test. Subscription clock is frozen.
2. **🚀 Switch to Live Mode:** Super Admin clicks *"Switch to Live Mode"*. Status becomes `PENDING_FIRST_PAYMENT`.
3. **✨ First Payment & 30-Day Clock Start:** Boutique owner opens `/admin` $\rightarrow$ pays first month's subscription (₹799) via UPI $\rightarrow$ 30-day subscription cycle officially starts on that exact payment date!

---

## 🧪 3. E2E QA Verification & Test Matrix

All 7 integration test scenarios pass with 100% success (`scripts/test-e2e.ts`):
- `[TEST 1]` Super Admin Authentication $\rightarrow$ **PASSED**
- `[TEST 2]` Client Onboarding & Key Generation $\rightarrow$ **PASSED**
- `[TEST 3]` Gatekeeper Subscription Verification $\rightarrow$ **PASSED**
- `[TEST 4]` Anti-Tamper Unauthorized Domain Rejection (403) $\rightarrow$ **PASSED**
- `[TEST 5]` S3 Presigned Upload & Quota Check $\rightarrow$ **PASSED**
- `[TEST 6]` Master Killswitch & Suspension Overlay $\rightarrow$ **PASSED**
- `[TEST 7]` Razorpay Webhook Auto-Reactivation & 3-Second Unlock $\rightarrow$ **PASSED**

---

## 🚀 4. How to Run the Platform

### Terminal 1: Backend API Server
```bash
npm run dev:api
```
- **URL:** `http://localhost:4000`
- **Health Check:** `http://localhost:4000/health`
- **SDK CDN Endpoint:** `http://localhost:4000/sdk/v1/boutique-sdk.min.js`

### Terminal 2: Super Admin Dashboard
```bash
npm run dev:admin
```
- **URL:** `http://localhost:3000`
- **Email:** `admin@boutiqueplatform.com`
- **Password:** `AdminPassword@123`
