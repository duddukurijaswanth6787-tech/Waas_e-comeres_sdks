# 🚀 Boutique Platform (WaaS) — Quick Run & Execution Guide (`run.md`)

This guide provides step-by-step instructions to set up, run, test, and deploy the **Central Backend API**, **Unified Client SDK**, and **Super Admin Dashboard**.

---

## 📋 Prerequisites
- **Node.js:** v18+ or v20+ or v24+
- **NPM:** v9+ or v10+ or v11+
- **AWS S3:** Already configured with bucket `boutique-media-848910045051-hyd` in `ap-south-2` (Hyderabad).

---

## ⚡ 1. Initial Setup & Installation (One-Time)

Open your terminal in the root project directory:

```bash
# 1. Install all dependencies across all workspaces
npm install

# 2. Sync Database Schema (Prisma / SQLite / PostgreSQL)
npx prisma generate --schema=apps/api/prisma/schema.prisma
npx prisma db push --schema=apps/api/prisma/schema.prisma

# 3. Seed Default Plans & Super Admin Account
npx tsx apps/api/src/db/seed.ts

# 4. Compile the Unified Client SDK Bundles
npm run build:sdk
```

---

## 🖥️ 2. Starting the Platform (Local Development)

Open two terminal windows:

### Terminal 1: Start Central Backend API (Port 4000)
```bash
npm run dev:api
```
- **Live URL:** `http://localhost:4000`
- **Health Check:** `http://localhost:4000/health`
- **Master SDK CDN:** `http://localhost:4000/sdk/v1/boutique-sdk.min.js`

### Terminal 2: Start Super Admin Dashboard (Port 3000)
```bash
npm run dev:admin
```
- **Live URL:** `http://localhost:3000`
- **Master Login Email:** `admin@boutiqueplatform.com`
- **Master Login Password:** `AdminPassword@123`

---

## 🧪 3. Running Automated End-to-End Tests

To run the complete 7-scenario integration and security test suite:
```bash
npx tsx scripts/test-e2e.ts
```
*Tests Super Admin login, client onboarding, gatekeeper checks, AWS S3 presigned uploads, killswitch lock, anti-tamper domain security, and Razorpay webhook auto-unlock.*

---

## 👗 4. How to Build & Connect a Client Boutique Website

1. **Step 1:** Open Super Admin at `http://localhost:3000` $\rightarrow$ Click **"+ Onboard Boutique Client"**.
2. **Step 2:** Fill store details, choose plan tier, and click **"Onboard & Generate Keys"**.
3. **Step 3:** Click **"AI Prompt Kit & Builder"** in the sidebar $\rightarrow$ Select the store $\rightarrow$ Click **"Copy Complete AI Prompt"**.
4. **Step 4:** Open your AI coding tool (Cursor / Windsurf / Claude / ChatGPT / OMP) in a new empty website folder $\rightarrow$ **Paste the prompt**.
5. **Step 5:** The AI builds the entire static/React boutique website pre-wired to the SDK. Open `/admin` to upload photos and test WhatsApp ordering!

---

## 📁 5. Project Directory Structure

```text
website/
├── apps/
│   ├── api/                    # Central Backend REST API & Prisma Database (Port 4000)
│   └── super-admin/            # Agency Control Dashboard & AI Mandate Hub (Port 3000)
├── packages/
│   └── sdk/                    # Unified Client SDK (@boutique/sdk -> boutique-sdk.min.js)
├── scripts/
│   └── test-e2e.ts             # Complete E2E Integration & QA Test Suite
├── BOUTIQUE_PLATFORM_SPECIFICATION.md # Full technical architecture & DB models
├── SDK_INTEGRATION_GUIDE.md    # Developer integration manual (React & HTML)
├── PROJECT_COMPLETION_SUMMARY.md # Master system handover documentation
├── Task.md                     # Completed 20-phase roadmap checklist
├── run.md                      # Quick run instructions
└── web-Waas.zip                # Portable project archive
```

---

## ☁️ 6. Production Deployment Commands

1. **Backend API (`apps/api`):** Deploy to Railway with `DATABASE_URL` and `PORT`.
2. **Super Admin Dashboard (`apps/super-admin`):** Build with `npm run build:admin` and deploy `dist/` to Vercel or Cloudflare Pages.
3. **Client Static Websites:** Build with `npm run build` and deploy to AWS S3 Static Website Hosting or Vercel.
