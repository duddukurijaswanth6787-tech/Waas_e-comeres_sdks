# Boutique Platform: Central SaaS Backend, Unified SDK & Super Admin Hub
## Complete Technical Architecture & AI Mandate Generator Specification

---

## 1. Project Scope & Architecture Model

### 1.1 Scope Definition
- **This Repository is the MASTER PLATFORM / CENTRAL HUB.**
- **Excluded:** No static boutique website templates are created or hosted in this repository.
- **Workflow:** 
  1. You onboard a boutique client in this platform's **Super Admin**.
  2. The Super Admin generates a unique `ClientID`, API Keys, and an **Automated AI Agent Prompt & Developer Mandate Kit**.
  3. You copy this AI Prompt and paste it into your AI coding tool in a **separate static website project**.
  4. The AI agent in the external project builds the static website pre-wired with your **Unified SDK**.
  5. The static website connects in real-time to this central platform for Gatekeeper subscription checks, Cloudflare R2 photo uploads, quota limits, and Razorpay renewal billing.

```
+───────────────────────────────────────────────────────────────────────────────────+
|                          THIS PROJECT (CENTRAL HUB & SDK)                         |
|                                                                                   |
|  ┌─────────────────────────────────┐   ┌───────────────────────────────────────┐  |
|  │      SUPER ADMIN DASHBOARD      │   │          UNIFIED CLIENT SDK           │  |
|  │ - Client Onboarding & Plan Mgmt │   │         `boutique-sdk.min.js`         │  |
|  │ - Master Killswitch & Overrides │   │                                       │  |
|  │ - [AI PROMPT GENERATOR HUB]     │───┼─► Embedded in external client sites   │  |
|  │   (Generates prompt for AI)     │   │   - Gatekeeper subscription lock      │  |
|  └─────────────────────────────────┘   │   - Quota enforcement (30 photos/1.2GB│  |
|                  │                     │   - Dynamic gallery & WhatsApp orders │  |
|                  ▼                     │   - Self-serve Razorpay renewal modal │  |
|  ┌─────────────────────────────────┐   └───────────────────────────────────────┘  |
|  │   CENTRAL SAAS BACKEND & DB     │                      ▲                       |
|  │ - Multi-tenant PostgreSQL DB    │                      │                       |
|  │ - Cloudflare R2 Storage Engine  │──────────────────────┘                       |
|  │ - Razorpay Webhook Auto-Unlock  │                                              |
|  └─────────────────────────────────┘                                              |
+───────────────────────────────────────────────────────────────────────────────────+
                                    │
           (You copy the AI Mandate Prompt from Super Admin)
                                    │
                                    ▼
+───────────────────────────────────────────────────────────────────────────────────+
|               SEPARATE STATIC WEBSITE PROJECT (Built with your AI Agent)          |
|                                                                                   |
|  - You paste the Super Admin AI Prompt into your AI website builder               |
|  - AI Agent builds custom boutique static site + `/admin` panel                   |
|  - Website drops in `<script src="https://platform.com/sdk.js"></script>`         |
|  - Connected live via `ClientID` (e.g. `cl_hyd_ananya_01`)                         |
+───────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Core Modules in This Project

### 2.1 Central SaaS Backend Engine (Node.js / TypeScript / Fastify)
1. **Multi-Tenant Database (PostgreSQL):**
   - Stores `clients`, `subscription_plans`, `client_subscriptions`, `client_media`, and `subscription_invoices`.
   - Domain whitelisting to prevent unauthorized SDK usage on wrong domains.
2. **Subscription Status & Expiry Engine:**
   - Real-time `GET /api/v1/client/status` endpoint (cached for fast $<20\text{ms}$ responses).
   - Automated daily cron worker transitioning statuses (`ACTIVE` $\rightarrow$ `GRACE_PERIOD` $\rightarrow$ `SUSPENDED`).
3. **AWS S3 Cloud Storage Presigned Upload Service (ap-south-2 Hyderabad):**
   - `POST /api/v1/storage/request-upload`: Validates plan image count and storage bytes before returning signed S3 upload URLs.
   - Deletion endpoint that auto-decrements storage usage.
   - Direct browser presigned `PUT` upload with client-side WebP compression (<400KB).
4. **Razorpay Subscriptions & Webhook Listener:**
   - Webhook `payment.captured` auto-extends subscription and instantly reactivates suspended websites.
5. **Live Website Server & Domain Reachability Engine:**
   - `GET /api/v1/admin/clients/:id/health` & `POST /api/v1/admin/clients/health-check-all`: Real-time HTTP/HTTPS latency ping and online/offline status monitor.
---

### 2.2 Unified Client SDK (`BoutiqueCore SDK` - Single `<script>` Bundle)
Distributed from this platform via CDN (`https://yourdomain.com/v1/boutique-sdk.min.js`).

1. **Gatekeeper Module:**
   - Verifies subscription status on public page load.
   - Renders floating renewal banner during `GRACE_PERIOD`.
   - Blurs content and renders modern full-screen **Suspension Overlay** with *"Pay Renewal (UPI / Card)"* button when `SUSPENDED`.
2. **Storage & Quota Enforcer:**
   - Client-side WebP image conversion and compression (max 1920px, $<400\text{KB}$).
   - Pre-upload validation: blocks upload if quota exceeded (e.g. 31st photo on 30-photo plan) and shows upgrade prompt.
   - Direct presigned upload to Cloudflare R2 bucket.
3. **Dynamic CMS & WhatsApp Ordering Bridge:**
   - Fetches active collection images dynamically from backend (`boutique.gallery.mount('#gallery-grid')`).
   - Generates pre-filled WhatsApp click-to-chat order links for any product.
4. **Self-Serve Billing Bridge:**
   - Embedded Razorpay checkout modal.
   - Instant auto-unlock upon successful payment without page refresh.

---

### 2.3 Super Admin Dashboard (Your Agency Control Center)
1. **Client Onboarding & Plan Assignment:**
   - Input: Boutique Name, WhatsApp Number, Domain, Plan Tier.
   - Output: `ClientID`, `publicKey`, `secretKey`, script tags, and the **AI Agent Prompt**.
2. **AI Agent Prompt Generator (Mandates Hub):**
   - Click **"Generate AI Prompt for Static Website"**.
   - Generates a complete, structured prompt containing:
     - Exact `ClientID` and SDK CDN URL.
     - Mandates for gatekeeper initialization.
     - Mandates for dynamic gallery binding and WhatsApp ordering button format.
     - Mandates for the `/admin` photo uploader, quota progress bar, and billing tab.
     - Step-by-step verification checklist for the AI agent to follow.
3. **Master Killswitch & Overrides:**
   - Real-time status table with one-click **"Force Suspend"**, **"Extend 7 Days Grace"**, and **"Reactivate"** buttons.
4. **Revenue, Storage & Analytics:**
   - Monthly Recurring Revenue (MRR), total active clients, overdue payments, and R2 storage consumption.
5. **Automated WhatsApp Payment Alerts:**
   - Triggers WhatsApp payment reminders at T-5 days, T-1 day, Grace Period, and Suspended states.

---

### 2.4 Embeddable Client Admin Module (`/admin`)
- Drop-in `/admin` interface or SDK-rendered admin widget that you (or your AI agent) place inside the client's static website.
- Features:
  - Drag-and-drop photo uploader.
  - Live quota progress bars (`28 / 30 Photos`, `0.85 / 1.2 GB Storage`).
  - Text & price CMS editor.
  - Subscription status & self-serve **"Pay Next Month Renewal"** button.

---

## 3. The Super Admin AI Agent Prompt Generator Template

When you onboard a client (e.g., *Ananya Boutique*, `ClientID`: `cl_hyd_ananya_01`, Plan: *Starter 30 Photos*), the Super Admin creates this exact prompt for you to paste into your AI builder:

```markdown
# AI AGENT PROMPT: STATIC BOUTIQUE WEBSITE BUILDER (REACT / HTML)

You are building a high-converting, luxury boutique website for [BUSINESS_NAME] ([OWNER_NAME]) located in [LOCATION].

### 1. Mandatory Boutique Credentials & Contract
- **CLIENT ID:** "[CLIENT_ID]"
- **PUBLIC KEY:** "[PUBLIC_KEY]"
- **SECRET KEY:** "[SECRET_KEY]" (Used for /admin photo uploads & catalog management)
- **STORE OWNER /ADMIN LOGIN:** Username: `[ADMIN_USERNAME]` | Password: `[ADMIN_PASSWORD]`
- **DOMAIN:** "[PRIMARY_DOMAIN]"
- **OWNER WHATSAPP:** "[OWNER_WHATSAPP]"
- **PLAN QUOTA:** [PLAN_NAME] (Max [MAX_IMAGES] Photos | [MAX_STORAGE_MB] MB S3 Cloud Storage)
- **CENTRAL API:** "http://localhost:4000"
- **SDK CDN SCRIPT:** "http://localhost:4000/sdk/v1/boutique-sdk.min.js"

### 2. Root SDK Integration in index.html
Include the BoutiqueCore SDK in `<head>`:
<script src="http://localhost:4000/sdk/v1/boutique-sdk.min.js"></script>
<script>
  window.boutique = new BoutiqueSDK({
    clientId: "[CLIENT_ID]",
    publicKey: "[PUBLIC_KEY]",
    secretKey: "[SECRET_KEY]",
    apiUrl: "http://localhost:4000",
    whatsappNumber: "[OWNER_WHATSAPP]",
    debug: true
  });
</script>

### 3. Public Website Mandates
- Do NOT hardcode collection images in static HTML/React.
- Fetch dynamic collection from AWS S3 using `window.boutique.storage.fetchMedia()`.
- Ensure all product cards have an "Order on WhatsApp" button triggering `window.boutique.whatsapp.openChat(product)`.

### 4. Client Admin Panel Mandates (/admin)
- Mount the Drop-in Admin UI: `new BoutiqueSDK({ ...keys }).admin.mount(container)`.
- Store Owner Login Gate: Username `[ADMIN_USERNAME]`, Password `[ADMIN_PASSWORD]`.
- Live Quota Indicator: Displays current vs max photo count and storage bytes.
- Direct S3 Photo Uploader with automatic WebP compression.
- Subscription Tab: Includes "Pay Subscription Renewal" button wired to `boutique.billing.openRenewalModal()`.

### 5. Verification Check
- Verify that when status is ACTIVE or TESTING, the site opens instantly.
- Verify that photo uploads past plan limits show the upgrade modal.
- Verify WhatsApp checkout opens with pre-filled product details.
```
---

## 4. Summary of Deliverables in This Repo

| Component | In Scope for This Repo | Notes |
|---|---|---|
| **Central Backend API & Multi-Tenant DB** | ✅ YES | Node.js/TypeScript + PostgreSQL + Fastify |
| **Unified Client SDK (`boutique-sdk.js`)** | ✅ YES | Single CDN bundle with Gatekeeper, Quota, CMS & Billing |
| **Super Admin Dashboard** | ✅ YES | Includes Client Onboarding & AI Agent Prompt Generator Hub |
| **Client Admin Panel Core Engine** | ✅ YES | Standard drop-in `/admin` logic powered by SDK |
| **Static Website Templates** | ❌ NO (Excluded) | Built separately by your AI agent using generated prompts |
