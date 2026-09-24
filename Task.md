# Boutique Platform: Complete Implementation Roadmap & Checklist (`Task.md`)

This roadmap details the exact phases for building the **Master Platform (Central Backend, Unified SDK, Super Admin with AI Prompt Generator, and Client Admin SDK Engine)**.

---

## 🧭 Phase Overview

| Phase | Focus Area | Deliverables |
|---|---|---|
| **Phase 1** | **Central Backend Engine & Multi-Tenant DB** | PostgreSQL schemas, REST API, Subscription lifecycle, Cloudflare R2 / S3 storage, Razorpay webhooks. |
| **Phase 2** | **Unified Client SDK (`BoutiqueCore SDK`)** | Gatekeeper engine, Quota enforcement, Dynamic gallery loader, Self-serve billing modal, Anti-tamper. |
| **Phase 3** | **Super Admin Platform & AI Prompt Hub** | Client onboarding, **AI Agent Prompt Generator (Mandates Hub)**, Master killswitch, MRR analytics, WhatsApp queue. |
| **Phase 4** | **Client Admin Engine & Drop-in SDK UI** | Embeddable `/admin` controller, Photo manager, Live quota tracker, CMS editor, Razorpay renewal tab. |
| **Phase 5** | **End-to-End Testing & Verification Suite** | Unit tests, Quota limit tests, Tamper resistance, Webhook auto-unlock, AI prompt validation. |
| **Phase 6** | **Deployment, CDN & Production Operations** | Edge CDN distribution for `boutique-sdk.js`, Database hosting, SSL setup, WhatsApp API integration. |

---

## 📋 Phase 1: Central Backend Engine & Database Architecture

- [ ] **1.1 Project Scaffolding & Environment Setup**
  - [ ] Initialize TypeScript / Node.js backend project (`Fastify` or `Express`).
  - [ ] Configure environment variables (`DATABASE_URL`, `R2_ACCESS_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `JWT_SECRET`).
  - [ ] Set up Prisma / Drizzle ORM for PostgreSQL.

- [ ] **1.2 Database Schema Implementation & Migrations**
  - [ ] Create `subscription_plans` table (Starter, Growth, Pro tiers with quotas).
  - [ ] Create `clients` table (Business info, WhatsApp number, domain whitelist, API keys).
  - [ ] Create `client_subscriptions` table (`status`, `billing_cycle`, `grace_period_end`, `is_manual_override`).
  - [ ] Create `client_media` table (`file_url`, `file_size_bytes`, `category`, `price`, `title`).
  - [ ] Create `subscription_invoices` table (`amount_inr`, `razorpay_payment_id`, `status`).

- [ ] **1.3 Authentication & Multi-Tenant Security Middleware**
  - [ ] Super Admin JWT authentication (email/password login).
  - [ ] Client Public Key authentication (`pk_live_...`) with domain origin verification.
  - [ ] Client Secret Key authentication (`sk_live_...`) for client admin actions.

- [ ] **1.4 Subscription Lifecycle & Status Engine**
  - [ ] Endpoint: `GET /api/v1/client/status` (Returns `ACTIVE`, `GRACE_PERIOD`, `SUSPENDED`, or `EXPIRED`).
  - [ ] Automated cron worker: daily subscription expiry checker & grace period transition.
  - [ ] Manual override endpoint for Super Admin (`POST /api/v1/admin/clients/:id/override`).

- [ ] **1.5 Media Storage & Presigned Upload Service**
  - [ ] Cloudflare R2 / AWS S3 integration.
  - [ ] Endpoint: `POST /api/v1/storage/request-upload` (Validates plan image count and storage size before generating presigned upload URL).
  - [ ] Endpoint: `POST /api/v1/storage/confirm-upload` (Records uploaded image in database).
  - [ ] Endpoint: `DELETE /api/v1/storage/media/:id` (Deletes from R2 and frees up client quota).

- [ ] **1.6 Payment & Webhook Processing (Razorpay / UPI)**
  - [ ] Endpoint: `POST /api/v1/billing/create-order` (Generates renewal order for client).
  - [ ] Webhook: `POST /api/v1/webhooks/razorpay` (Verifies signature, captures payment, extends subscription, updates status to `ACTIVE`).

---

## 📋 Phase 2: Unified Client SDK (`BoutiqueCore SDK`)

- [ ] **2.1 SDK Core Architecture & Build Pipeline**
  - [ ] Set up Rollup / esbuild pipeline for single-file bundle (`boutique-sdk.min.js`, < 20KB).
  - [ ] Implement `new BoutiqueSDK({ clientId, publicKey })` entry point.
  - [ ] Implement local cache & TTL layer (30-minute status caching for instant page loads).

- [ ] **2.2 Gatekeeper Module (`boutique.gatekeeper`)**
  - [ ] Implement startup status check against backend.
  - [ ] Implement `GRACE_PERIOD` floating bottom notification banner.
  - [ ] Implement `SUSPENDED` full-page blur and modal lock screen with "Pay Renewal" button.
  - [ ] Implement anti-tamper check (Validates current browser domain against allowed origins).

- [ ] **2.3 Media & Quota Manager Module (`boutique.storage`)**
  - [ ] Client-side WebP image conversion and compression (max 1920px, ~80% reduction).
  - [ ] Pre-upload quota validation with user-friendly error dialogs on limit breach.
  - [ ] Direct-to-bucket S3/R2 presigned upload handler with progress bar.

- [ ] **2.4 Dynamic CMS & WhatsApp Ordering Engine (`boutique.cms`)**
  - [ ] Dynamic gallery renderer: `boutique.gallery.mount('#container')`.
  - [ ] Automated WhatsApp order bridge: generates pre-filled WhatsApp chat links with product image, code, and price.
  - [ ] Dynamic banner / text content binding.

- [ ] **2.5 Self-Serve Billing Portal Module (`boutique.billing`)**
  - [ ] Embedded Razorpay checkout modal trigger.
  - [ ] Post-payment auto-refresh & instant unlock handler.

---

## 📋 Phase 3: Super Admin Platform & AI Prompt Hub (For You)

- [ ] **3.1 Dashboard Layout & Authentication**
  - [ ] Super Admin Login screen with JWT token management.
  - [ ] Modern UI layout (Dashboard, Clients, Plans, Storage, Invoices, Settings).
  - [ ] Responsive design optimized for mobile & desktop.

- [ ] **3.2 Client Onboarding & Plan Assignment**
  - [ ] "Add New Client" modal (Business Name, Owner WhatsApp, Domain, Plan selection).
  - [ ] Auto-generate `ClientID`, `publicKey`, `secretKey`, and embeddable `<script>` code snippet.

- [ ] **3.3 AI Agent Prompt Generator (Mandates Hub)**
  - [ ] Dedicated tab / modal: **"Generate AI Prompt for Static Website"**.
  - [ ] Generates complete prompt containing:
    - ClientID, API keys, CDN script tags.
    - Public website integration mandates (Dynamic gallery mount, WhatsApp ordering trigger).
    - Client Admin panel mandates (`/admin` setup, Quota progress bar, Photo uploader).
    - AI Agent verification and testing checklist.
  - [ ] One-click **"Copy Prompt for AI Agent"** button.

- [ ] **3.4 Master Killswitch & Overrides**
  - [ ] Real-time status table: `ACTIVE`, `GRACE_PERIOD`, `SUSPENDED`.
  - [ ] One-click action buttons: `Extend 7 Days Grace`, `Force Suspend`, `Reactivate`.

- [ ] **3.5 Analytics & Revenue Metrics**
  - [ ] Monthly Recurring Revenue (MRR) calculation.
  - [ ] Storage & bandwidth usage counters across all clients.
  - [ ] Active vs Overdue client distribution charts.

- [ ] **3.6 Automated WhatsApp Notification Center**
  - [ ] WhatsApp API connection (Interakt / Wati / Twilio).
  - [ ] Automated template triggers (Expiry T-5 days, Expiry T-1 day, Expired/Grace, Suspended).

---

## 📋 Phase 4: Client Admin Engine & Drop-in SDK UI

- [ ] **4.1 Embeddable Client Admin Engine (`boutique.admin`)**
  - [ ] Drop-in `/admin` UI controller provided by the SDK.
  - [ ] PIN/Password protection for boutique store owner.
  - [ ] Real-time quota progress bar: `Photos Used: 28 / 30` & `Storage: 0.85 / 1.2 GB`.

- [ ] **4.2 Photo & Collection Manager**
  - [ ] Drag-and-drop photo uploader with category tagging (Sarees, Lehengas, Kurtis, Bridal).
  - [ ] Edit product details (Title, Product Code, Price, In Stock toggle).
  - [ ] Delete photo action (Auto-decrements storage usage).

- [ ] **4.3 Store Details & CMS Editor**
  - [ ] Edit boutique address, opening hours, Instagram handle, and WhatsApp number.
  - [ ] Edit hero banner text and announcement bar.

- [ ] **4.4 Subscription & Self-Serve Renewal Tab**
  - [ ] Display current plan, next billing date, and payment status.
  - [ ] One-click "Pay Next Month Renewal" button (Opens Razorpay UPI modal).
  - [ ] "Upgrade Plan" selector (e.g., Upgrade to 100 Photos).

---

## 📋 Phase 5: End-to-End Testing & Verification Suite

- [ ] **5.1 Gatekeeper & Subscription Tests**
  - [ ] Verify `ACTIVE` subscription allows normal site loading (< 20ms check).
  - [ ] Verify `GRACE_PERIOD` shows warning banner without blocking visitor access.
  - [ ] Verify `SUSPENDED` renders lock screen and blurs content.
  - [ ] Verify unauthorized domain origin returns `401 Unauthorized`.

- [ ] **5.2 Storage & Quota Tests**
  - [ ] Verify uploading 31st photo on 30-photo plan is blocked with upgrade modal.
  - [ ] Verify deleting an image immediately restores quota count.
  - [ ] Verify oversized images (>10MB) are compressed client-side before upload.

- [ ] **5.3 Payment & Webhook Tests**
  - [ ] Simulate Razorpay `payment.captured` webhook -> verify site unlocks in < 3 seconds.

- [ ] **5.4 AI Prompt Generator Verification**
  - [ ] Test generating an AI prompt for a new client and verify all dynamic fields (`ClientID`, quotas, URLs) populate correctly.

---

## 📋 Phase 6: Deployment & Production Operations

- [ ] **6.1 Infrastructure Deployment**
  - [ ] Deploy Central Backend API to Cloud / VPS with SSL.
  - [ ] Deploy SDK bundle to CDN (Cloudflare / jsDelivr).
  - [ ] Configure Cloudflare R2 bucket CORS and lifecycle rules.
  - [ ] Deploy Super Admin Dashboard.
