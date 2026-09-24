# Boutique SDK Integration Guide & Developer Manual
## Complete Guide for Building Fast React (Vite) & Static Boutique Websites with the Unified SDK

This manual provides complete step-by-step instructions for integrating the **BoutiqueCore SDK** into your external boutique websites using **React (Vite + Tailwind)** (Recommended) or **Vanilla HTML/JS**.

---

## 🧭 System Architecture at a Glance

```
1. SUPER ADMIN DASHBOARD (http://localhost:3000)
   └── Onboard Client -> Generate `ClientID`, `PublicKey`, `SecretKey`
         │
         ▼
2. EXTERNAL STATIC WEBSITE (Built with React/Vite in a separate project)
   ├── [Public View] Loads Master SDK -> Auto-Gatekeeper + Dynamic Collection + WhatsApp Orders
   └── [/admin Route] Loads Master SDK with SecretKey -> Live Quota Bar + WebP Uploader + Renewal Modal
         │
         ▼
3. CENTRAL SAAS BACKEND & MULTI-TENANT DATABASE (http://localhost:4000)
   ├── Real-time Subscription Verification (<20ms)
   ├── Cloudflare R2 / S3 Presigned Direct Photo Uploads
   └── Razorpay Webhook Auto-Reactivation
```

---

# ⚛️ METHOD 1: React + Vite + Tailwind CSS (Primary & Recommended)

This is the fastest, most responsive stack for building luxury boutique websites in Hyderabad.

### Step 1: SDK Script in `index.html`
In your React project's root `index.html`, add the SDK script in `<head>`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ananya Designer Studio - Hyderabad</title>

    <!-- 1. Include Central Boutique SDK -->
    <script src="http://localhost:4000/sdk/v1/boutique-sdk.min.js"></script>
    <script>
      // 2. Initialize Master SDK on window
      window.boutique = new BoutiqueSDK({
        clientId: "YOUR_CLIENT_ID",          // e.g. "cl_hyd_ananya_01"
        publicKey: "YOUR_PUBLIC_KEY",        // e.g. "pk_live_xxxxxx"
        whatsappNumber: "919876543210",      // Owner WhatsApp Number
        apiUrl: "http://localhost:4000"
      });
    </script>
  </head>
  <body class="bg-slate-950 text-slate-100 antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

### Step 2: TypeScript Types Declaration (`src/types/boutique.d.ts`)
Create a type declaration file so TypeScript recognizes `window.boutique` and `window.BoutiqueSDK`:

```ts
export interface MediaProduct {
  id: string;
  title?: string;
  price?: number;
  fileUrl: string;
  category: string;
}

declare global {
  interface Window {
    boutique?: any;
    BoutiqueSDK?: any;
  }
}
```

---

### Step 3: Public Collection Component (`src/components/Collection.tsx`)
This component fetches dresses from your central cloud database and binds the WhatsApp ordering button:

```tsx
import React, { useEffect, useState } from "react";
import { MediaProduct } from "../types/boutique";

export function Collection() {
  const [products, setProducts] = useState<MediaProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch active collection from Central SDK
    if (window.boutique) {
      window.boutique.storage.fetchMedia()
        .then((data: MediaProduct[]) => {
          setProducts(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, []);

  const handleOrderOnWhatsApp = (product: MediaProduct) => {
    // 2. Trigger SDK WhatsApp Order Generator
    window.boutique?.whatsapp.openChat(product);
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-400">
        <div className="animate-spin text-3xl mb-2">✨</div>
        <p>Loading Exclusive Collection...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <div className="text-4xl mb-3">👗</div>
        <h3 className="text-lg font-semibold text-white">New Collection Arriving Soon</h3>
        <p className="text-sm text-slate-500 mt-1">Please check back shortly or message us on WhatsApp.</p>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-serif text-amber-300 font-bold">Exclusive Bridal & Festive Collection</h2>
        <p className="text-slate-400 text-sm mt-2">Handcrafted luxury designs from Jubilee Hills, Hyderabad</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {products.map((item) => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col group hover:border-amber-500/40 transition-all">
            <div className="relative pt-[125%] bg-slate-950 overflow-hidden">
              <img
                src={item.fileUrl}
                alt={item.title || "Boutique Dress"}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
            <div className="p-5 flex flex-col justify-between flex-1">
              <div>
                <h3 className="font-semibold text-base text-white">{item.title || "Designer Collection"}</h3>
                {item.price && (
                  <p className="text-amber-400 font-bold text-lg mt-1">₹{item.price.toLocaleString("en-IN")}</p>
                )}
              </div>

              {/* WhatsApp Checkout Button */}
              <button
                onClick={() => handleOrderOnWhatsApp(item)}
                className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer text-sm"
              >
                <span>💬 Order on WhatsApp</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

---

### Step 4: Store Owner Admin Page (`src/pages/Admin.tsx`)
Create an admin route (e.g. `yourboutique.com/admin`) that mounts the complete photo manager, live quota bars, and billing tab:

```tsx
import React, { useEffect, useRef } from "react";

export function AdminPage() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mountRef.current && window.BoutiqueSDK) {
      // Initialize Admin SDK with Secret Key
      const adminSDK = new window.BoutiqueSDK({
        clientId: "YOUR_CLIENT_ID",
        publicKey: "YOUR_PUBLIC_KEY",
        secretKey: "YOUR_SECRET_KEY",       // Required for photo uploads & deletion
        whatsappNumber: "919876543210",
        apiUrl: "http://localhost:4000"
      });

      // Mount complete Admin UI
      adminSDK.admin.mount(mountRef.current);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div ref={mountRef}></div>
    </div>
  );
}
```

---

# 📄 METHOD 2: Plain Static HTML + Tailwind (Single-File Alternative)

If you prefer building pure HTML without React:

### `index.html` (Public Site):
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Ananya Boutique</title>
  <script src="http://localhost:4000/sdk/v1/boutique-sdk.min.js"></script>
  <script>
    window.boutique = new BoutiqueSDK({
      clientId: "YOUR_CLIENT_ID",
      publicKey: "YOUR_PUBLIC_KEY",
      whatsappNumber: "919876543210",
      apiUrl: "http://localhost:4000"
    });
  </script>
</head>
<body>
  <!-- Dynamic Catalog Mount -->
  <div id="boutique-gallery"></div>
  <script>
    window.addEventListener("DOMContentLoaded", () => {
      window.boutique.gallery.mountGallery("#boutique-gallery", { columns: 3 });
    });
  </script>
</body>
</html>
```

### `/admin/index.html` (Store Owner Panel):
```html
<!DOCTYPE html>
<html>
<head>
  <title>Store Admin</title>
  <script src="http://localhost:4000/sdk/v1/boutique-sdk.min.js"></script>
</head>
<body style="margin: 0; background: #f8fafc;">
  <div id="admin-root"></div>
  <script>
    const admin = new BoutiqueSDK({
      clientId: "YOUR_CLIENT_ID",
      publicKey: "YOUR_PUBLIC_KEY",
      secretKey: "YOUR_SECRET_KEY",
      whatsappNumber: "919876543210",
      apiUrl: "http://localhost:4000"
    });
    admin.admin.mount("#admin-root");
  </script>
</body>
</html>
```

---

# 🤖 AI Agent Prompt Template (For React/Vite Builders)

When using Cursor, Windsurf, Claude, ChatGPT, or OMP to build a client's React boutique website, paste this exact prompt:

```markdown
# AI AGENT PROMPT: LUXURY BOUTIQUE REACT WEBSITE BUILDER

You are building a high-converting, luxury React (Vite + Tailwind CSS) boutique website for "[BOUTIQUE_NAME]" located in Hyderabad.

### 1. Mandatory Boutique Credentials & Contract
- **CLIENT ID:** "[CLIENT_ID]"
- **PUBLIC KEY:** "[PUBLIC_KEY]"
- **SECRET KEY:** "[SECRET_KEY]" (Used for /admin photo uploads & password updates)
- **STORE OWNER /ADMIN LOGIN:** Username: `admin` | Password: `StorePassword@123`
- **PRIMARY DOMAIN:** "[PRIMARY_DOMAIN]"
- **OWNER WHATSAPP:** "[OWNER_WHATSAPP]"
- **CENTRAL API:** "http://localhost:4000"
- **SDK CDN SCRIPT:** "http://localhost:4000/sdk/v1/boutique-sdk.min.js"

### 2. Root SDK Integration in index.html
Add the BoutiqueCore SDK in `<head>`:
```html
<script src="http://localhost:4000/sdk/v1/boutique-sdk.min.js"></script>
<script>
  window.boutique = new BoutiqueSDK({
    clientId: "[CLIENT_ID]",
    publicKey: "[PUBLIC_KEY]",
    secretKey: "[SECRET_KEY]",
    apiUrl: "http://localhost:4000",
    whatsappNumber: "[WHATSAPP_NUMBER]",
    debug: true
  });
</script>
```

### 3. React Components Mandate
- Do NOT hardcode photos in static files.
- Fetch collection photos dynamically using `window.boutique.storage.fetchMedia()`.
- Add an "Order on WhatsApp" button to every dress card that triggers `window.boutique.whatsapp.openChat(product)`.
- Create an `/admin` route that mounts the Admin UI using `new BoutiqueSDK({ ...keys }).admin.mount(container)`.

### 4. Design & Luxury Aesthetic
- Colors: Deep Slate/Black background with warm Gold/Champagne accents (`#f59e0b` / `#d97706`).
- Luxury typography (Serif headings, clean sans body).
- Mobile-first responsive layout tailored for Instagram shoppers.
```

---

# 🧪 Developer Verification Checklist (4 Tests)

Before delivering the site to your client:

- [ ] **1. Active Website Test:** Open `http://localhost:5173` $\rightarrow$ Site opens instantly in $< 1.5$s with active products.
- [ ] **2. Photo Upload Test:** Open `/admin` $\rightarrow$ Upload a dress $\rightarrow$ Verify live quota progress bar updates (e.g. `25/30 Photos Used`).
- [ ] **3. WhatsApp Order Test:** Click *"Order on WhatsApp"* on any dress $\rightarrow$ WhatsApp opens with pre-typed message.
- [ ] **4. Suspension & Auto-Unlock Test:**
  - In Super Admin, click **"Force Suspend"** $\rightarrow$ Refresh client site $\rightarrow$ Verify site is blurred and Lock Screen appears.
  - Click **"Pay Renewal"** $\rightarrow$ Complete payment $\rightarrow$ Verify site unlocks instantly within 3 seconds!
- [ ] **5. Browser Console Smoke Test:**
  - Open browser console (F12) $\rightarrow$ Run `window.boutique.gatekeeper.checkStatus(true)` and verify it returns HTTP 200 with active status.

# 🚀 Deployment Guide (1-Click Hosting)

1. **Deploy Client React Site:**
   - Push your client website repository to GitHub.
   - Connect to **Vercel** or **Netlify** or **Cloudflare Pages**.
   - Build command: `npm run build` | Output directory: `dist`.
2. **Custom Domain:**
   - Add client's custom domain (e.g. `ananyaboutique.com`) in Vercel/Netlify DNS.
   - Ensure the domain is whitelisted in your Super Admin Dashboard.
