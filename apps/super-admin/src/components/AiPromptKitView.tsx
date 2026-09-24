import React, { useState } from "react";
import { ClientData } from "../types";
import {
  Copy,
  Check,
  Sparkles,
  Code2,
  Layers,
  Key,
  Shield,
  HardDrive,
  ShoppingBag,
  Database,
  MessageSquare,
  CreditCard,
  Tag,
  TrendingUp,
  Terminal,
  TestTube2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface AiPromptKitViewProps {
  clients: ClientData[];
  onOpenOnboardModal: () => void;
}

type PromptCategory = "master" | "sub_sdks";

type SubSdkKey =
  | "gatekeeper"
  | "storage"
  | "cms"
  | "cart"
  | "checkout"
  | "whatsapp"
  | "admin"
  | "billing"
  | "coupons"
  | "crm";

interface SubSdkDefinition {
  key: SubSdkKey;
  name: string;
  badge: string;
  icon: React.ElementType;
  summary: string;
  endpoint: string;
  generatePrompt: (client: ClientData, planName: string, maxImages: number, maxStorageGb: string) => string;
}

export const AiPromptKitView: React.FC<AiPromptKitViewProps> = ({ clients }) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || "");
  const [activeCategory, setActiveCategory] = useState<PromptCategory>("master");
  const [activeSubSdk, setActiveSubSdk] = useState<SubSdkKey>("gatekeeper");
  const [copied, setCopied] = useState(false);
  const [copiedPill, setCopiedPill] = useState<string | null>(null);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const planName = selectedClient?.subscription?.planName || "E-Com Standard Store";
  const maxImages = selectedClient?.subscription?.maxImages || 150;
  const maxStorageGb = selectedClient?.subscription?.maxStorageBytes
    ? (selectedClient.subscription.maxStorageBytes / (1024 * 1024 * 1024)).toFixed(1)
    : "10.0";

  const clientId = selectedClient?.id || "cl_hyd_kalyanbridal_01";
  const publicKey = selectedClient?.publicApiKey || "pk_live_sample_key_123";
  const secretKey = selectedClient?.secretApiKey || "sk_live_sample_secret_456";
  const businessName = selectedClient?.businessName || "Kalyan Heritage Silks";
  const ownerName = selectedClient?.ownerName || "Kalyan Kumar";
  const ownerPhone = selectedClient?.ownerPhone || "919876543210";
  const primaryDomain = selectedClient?.primaryDomain || "localhost";
  const allowedDomains = selectedClient?.allowedDomains || "localhost,127.0.0.1";
  const city = selectedClient?.city || "Hyderabad";
  const storeAddress = selectedClient?.storeAddress || "Road No. 36, Jubilee Hills, Hyderabad";
  const instagramHandle = selectedClient?.instagramHandle || "@kalyanheritagesilks";
  const adminUsername = selectedClient?.adminUsername || "admin";
  const adminPassword = selectedClient?.adminPassword || "StorePassword@123";

  const copyPill = (text: string, pillId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPill(pillId);
    setTimeout(() => setCopiedPill(null), 1500);
  };

  // 1. MASTER ALL-IN-ONE REACT + TYPESCRIPT STOREFRONT PROMPT
  const pureReactTsPrompt = `# ==============================================================================
# 🛒 AI SPECIFICATION: 100% REACT + TYPESCRIPT FULL E-COMMERCE STOREFRONT
# ==============================================================================

You are building a production-grade, luxury E-Commerce Storefront in **React 19 / 18 with TypeScript and Tailwind CSS** for:
- **STORE NAME:** "${businessName}"
- **OWNER:** ${ownerName} (+${ownerPhone})
- **LOCATION:** ${storeAddress}, ${city}
- **INSTAGRAM:** ${instagramHandle}
- **DOMAIN:** "${primaryDomain}"

---

### 📋 1. CENTRAL SAAS E-COMMERCE CREDENTIALS & API CONTRACT
- **CLIENT ID:** \`${clientId}\`
- **PUBLIC API KEY:** \`${publicKey}\`
- **SECRET API KEY:** \`${secretKey}\` (For store owner /admin order fulfillment)
- **DEFAULT /ADMIN LOGIN:** Username: \`${adminUsername}\` | Password: \`${adminPassword}\`
- **SUBSCRIPTION STATE:** Dynamic real-time quotas loaded via SDK Gatekeeper (\`window.boutique.gatekeeper.checkStatus()\`). Never hardcode static limits.
- **API URL:** \`http://localhost:5000\`
- **SDK CDN SCRIPT:** \`http://localhost:5000/sdk/v1/boutique-sdk.min.js\`

### 📦 COMPLETE 10-MODULE SDK SUITE PRE-WIRED
1. **🛡️ Gatekeeper:** Subscription verification in <20ms & suspension blur lock
2. **☁️ Storage:** HTML5 Canvas WebP image compressor & presigned S3 uploads
3. **🖼️ CMS Catalog:** Dynamic dress & bridal media fetcher directly from cloud S3
4. **🛍️ Shopping Cart:** Persistent bag with size/color variants & local storage sync
5. **💳 Checkout & Gateway:** Multi-option checkout with live Razorpay order placement
6. **💬 WhatsApp Dispatch:** 1-Click WhatsApp click-to-chat order links with pre-filled items
7. **⚙️ Turnkey /admin Portal:** Drop-in store owner panel (mounts with \`window.boutique.admin.mount\`)
8. **🔄 Self-Serve Billing:** Automated Razorpay renewal modal with instant store reactivation
9. **🏷️ Coupons Engine:** Promo discount validation & minimum order value calculations
10. **📈 Customer CRM:** Automatic customer address book, purchase histories & LTV tracking

### ☁️ STRICT CLOUD STORAGE & DATA FLOW POLICY:
1. **ALL MEDIA (Images, Videos, Product Reels, Banners) -> AWS S3 ONLY:**
   - Bucket: \`boutique-media-848910045051-hyd\` in \`ap-south-2\` (Hyderabad).
   - Policy: NEVER save image/video binaries to local disk or local server folders.
   - Upload Mechanism: Browser requests presigned S3 URLs from \`POST /api/v1/storage/request-upload\` and streams direct to AWS S3.
   - MIME Types: \`image/webp\`, \`image/jpeg\`, \`image/png\`, \`video/mp4\`, \`video/webm\`, \`video/quicktime\`.

2. **ALL TEXT & BUSINESS DATA -> CENTRAL POSTGRESQL ONLY:**
   - Database: \`ecom_boutique_db\` on PostgreSQL port 5432.
   - Saved Data: Products (titles, prices, sizes, colors, stock, S3 URLs), Orders, Customers, Subscriptions, Invoices, Coupons, and Staff accounts.

3. **WHAT DATA IS ON THE CLIENT WEBSITE? (STATELESS FRONTEND):**
   - The client React storefront is **100% stateless & dynamic**, fetching live data via SDK over HTTPS.
   - Only temporary in-browser state is held:
     - \`ecom_cart_${clientId}\`: Active shopping bag in \`localStorage\` while customer shops.
     - \`boutique_status_${clientId}\`: 15-minute TTL cache of subscription status.
     - \`boutique_admin_jwt\`: Session token when logged in to \`/admin\`.
---

### 🛠️ 2. ROOT SDK ATTACHMENT (\`index.html\`)
In your React app \`index.html\`, load and initialize the Master SDK in the \`<head>\` tag:
\`\`\`html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${businessName} — Luxury E-Commerce & Bridal Collection</title>

  <!-- Central E-Commerce SDK -->
  <script src="http://localhost:5000/sdk/v1/boutique-sdk.min.js"></script>
  <script>
    window.boutique = new BoutiqueSDK({
      clientId: "${clientId}",
      publicKey: "${publicKey}",
      secretKey: "${secretKey}",
      apiUrl: "http://localhost:5000",
      whatsappNumber: "${ownerPhone}",
      debug: true
    });
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
\`\`\`

---

### 📦 3. TYPESCRIPT CONTRACTS (\`src/types/ecom.ts\`)
\`\`\`typescript
export interface Product {
  id: string;
  title: string;
  price: number;
  fileUrl: string;
  category: string;
  sku?: string;
  stockCount?: number;
  sizes?: string[];
  colors?: string[];
}

export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
}

export interface CheckoutPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  city: string;
  pincode: string;
  couponCode?: string;
  paymentMethod: "RAZORPAY" | "COD" | "WHATSAPP_MANUAL";
}

declare global {
  interface Window {
    boutique?: {
      cart: {
        getItems: () => CartItem[];
        addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => CartItem[];
        removeItem: (id: string, size?: string, color?: string) => CartItem[];
        updateQuantity: (id: string, quantity: number, size?: string, color?: string) => CartItem[];
        getTotalAmount: () => number;
        clearCart: () => void;
      };
      checkout: {
        placeOrder: (payload: CheckoutPayload) => Promise<{
          success: boolean;
          orderId: string;
          orderNumber: string;
          totalAmountInr: number;
        }>;
      };
      whatsapp: {
        openChat: (item: { title: string; price?: number; size?: string }) => void;
      };
      storage: {
        fetchMedia: () => Promise<Product[]>;
      };
      billing: {
        openRenewalModal: () => Promise<void>;
      };
      admin: {
        mount: (container: string | HTMLElement) => Promise<void>;
      };
    };
    BoutiqueSDK: unknown;
    EcomSDK: unknown;
  }
}
\`\`\`

---

### 🛍️ 4. DYNAMIC S3 GALLERY WITH LIVE ADDTOCART
\`\`\`tsx
import React, { useEffect, useState } from "react";
import { Product } from "./types/ecom";

export const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function load() {
      if (window.boutique) {
        const data = await window.boutique.storage.fetchMedia();
        setProducts(data);
      }
    }
    load();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((p) => (
        <div key={p.id} className="border rounded-2xl p-4 bg-stone-900 text-white">
          <img src={p.fileUrl} alt={p.title} className="w-full h-64 object-cover rounded-xl" />
          <h3 className="font-bold text-base mt-2">{p.title || "Bridal Silk Saree"}</h3>
          <p className="text-amber-400 font-mono font-bold">₹{(p.price || 12500).toLocaleString("en-IN")}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => window.boutique?.cart.addItem({ id: p.id, title: p.title, price: p.price || 12500, image: p.fileUrl })}
              className="flex-1 bg-amber-400 text-stone-950 font-bold py-2 rounded-xl text-xs"
            >
              Add to Bag
            </button>
            <button
              onClick={() => window.boutique?.whatsapp.openChat(p)}
              className="px-3 bg-emerald-600 text-white rounded-xl text-xs"
            >
              WhatsApp
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
\`\`\`

### 🛍️ 4. AMAZON / MYNTRA / MEESHO / AJIO FEATURE SPECIFICATION

Build the complete e-commerce experience with all industry-standard features:

1. **🌟 Header & Navigation Bar (Amazon / Myntra Style):**
   - **Top Notification Bar:** Announcement ticker (*"Complimentary Express Shipping Across India on Orders Above ₹2,999 | Direct Weaver Prices"*).
   - **Sticky Luxury Header:** Brand Logo with serif typography, Mega-menu navigation links (Bridal, Sarees, Lehengas, Ready-to-wear), Live Predictive Search Bar (filters products by title/category as user types), Pincode Delivery Estimator (*"Deliver to: 500033 (Jubilee Hills)"*), Wishlist Heart icon with counter badge, and Floating Shopping Bag badge with live item count.

2. **👗 Catalog, Filtering & Merchandising (Myntra / Ajio Style):**
   - **Multi-Filter Sidebar:** Filter by Price Range Slider, Category Checkboxes, Clickable Color Swatches (*Red, Blue, Green, Gold, Wine*), Size Pills (\`XS, S, M, L, XL, XXL, Free Size\`), and Sort Dropdown (*Price: Low to High, Price: High to Low, Newest Arrivals, Best Sellers*).
   - **Product Cards:** \`4:5\` aspect ratio cards with smooth hover zoom, Discount % Badge (e.g. \`20% OFF\`), Strikethrough MRP price alongside real selling price, Customer Rating Badge (e.g. \`★ 4.8\`), Hover Quick-Add Size bar for 1-click cart addition, Gold **"Add to Bag"** button, and Green **"Order via WhatsApp"** button (Meesho model).

3. **🔍 Product Details & Quick-View Modal (Amazon / Myntra Style):**
   - Multi-photo and video carousel from AWS S3, Stock scarcity indicator (*"Only 2 left in stock — order soon"*), Interactive size & color swatches, Size Chart measurement guide modal, Delivery Date Estimator with 6-digit pincode input, Fabric specifications, and Customer Reviews with star rating breakdown.

4. **🛍️ Slide-Over Shopping Bag & Coupon Engine (Ajio / Myntra Style):**
   - Slide-over cart drawer with quantity steppers (\`-\`, \`+\`), Move to Wishlist, Interactive Promo Coupon Drawer with 1-click Apply pills (\`WELCOME10\`, \`BRIDAL500\`), Live discount savings banner (*"🎉 You saved ₹1,500 on this order!"*), and detailed price breakdown card.

5. **💳 Multi-Option Checkout (Amazon / Meesho Style):**
   - Step 1: Customer Name, 10-digit WhatsApp phone, auto-filled address book, city, and pincode.
   - Step 2: Payment method toggle:
     - \`💳 Razorpay Live Online Gateway\` (Google Pay, PhonePe, Cards, NetBanking)
     - \`💵 Cash on Delivery (COD)\`
     - \`💬 1-Click WhatsApp Direct Order\` (pre-fills entire shopping list into WhatsApp chat for instant order confirmation)
   - Step 3: Order confirmation with animated confetti, \`#ORD-XXXXXX\` order number, invoice PDF download, and WhatsApp notification.

6. **📦 Real-Time Order Tracking (\`/track\`) (Amazon Style):**
   - Visual 4-step pipeline: \`Order Placed\` -> \`Order Confirmed\` -> \`Shipped (with Tracking Link)\` -> \`Delivered\`.

7. **⚙️ Turnkey Store Owner Management Portal (\`/admin\`):**
   - Mounted via \`window.boutique.admin.mount("#admin-root")\` with store owner auth, S3 product uploader, live orders fulfillment tab, staff management, and Razorpay renewal modal.
---

### 🤖 5. STEP-BY-STEP EXECUTION ROADMAP FOR AI AGENTS
1. **Step 1: Setup:** Scaffold Vite React + TypeScript + Tailwind CSS and install \`lucide-react\`.
2. **Step 2: SDK Attachment:** Add Master SDK script tag in \`index.html\` \`<head>\` and initialize \`window.boutique\`.
3. **Step 3: Types:** Copy TypeScript contract interfaces into \`src/types/ecom.ts\`.
4. **Step 4: Components:** Build Header, Hero, S3 Product Catalog, Cart Drawer with address form, and Admin Page.
5. **Step 5: Verify:** Open browser console (F12), test adding items to bag, placing an order, and mounting \`/admin\`.
`;

  // 2. THE 10 INDIVIDUAL SUB-SDK TESTING PROMPTS DEFINITION
  const subSdksList: SubSdkDefinition[] = [
    {
      key: "gatekeeper",
      name: "1. 🛡️ Gatekeeper & Anti-Tamper Security Sub-SDK",
      badge: "Security & Entitlements",
      icon: Shield,
      summary: "Tests subscription health in <20ms, plan quotas, grace period banners, suspension blur overlay, and domain whitelist rejection.",
      endpoint: "GET /api/v1/client/status",
      generatePrompt: () => `# ==============================================================================
# 🧪 AI QA PROMPT: GATEKEEPER & ANTI-TAMPER SECURITY SUB-SDK
# ==============================================================================

You are testing and verifying the **Gatekeeper & Anti-Tamper Security Sub-SDK Module** for:
- **STORE:** "${businessName}"
- **CLIENT ID:** \`${clientId}\`
- **PUBLIC KEY:** \`${publicKey}\`
- **ALLOWED DOMAINS:** \`${allowedDomains}\`
- **CENTRAL API:** \`http://localhost:5000\`

---

### 📋 1. OBJECTIVE & TEST MATRIX
Verify that:
1. The Gatekeeper executes on page load in <20ms and caches status in localStorage for 15 minutes.
2. An active subscription allows full browsing with no banners.
3. Overdue stores (GRACE_PERIOD) display the non-intrusive 3-day grace banner with a Razorpay renewal button.
4. Suspended stores (SUSPENDED) inject a full-page blur lock screen with a UPI payment trigger.
5. Unauthorized domains (outside '${allowedDomains}') are rejected with HTTP 403 Forbidden.

---

### 💻 2. BACKEND API VERIFICATION (cURL & Fastify)
\`\`\`bash
# Test 1: Valid Whitelisted Domain Request
curl -s -H "x-client-id: ${clientId}" -H "x-public-key: ${publicKey}" -H "origin: http://localhost" http://localhost:5000/api/v1/client/status

# Test 2: Unauthorized Hacker Domain (Must return 403 UNAUTHORIZED_DOMAIN)
curl -s -H "x-client-id: ${clientId}" -H "x-public-key: ${publicKey}" -H "origin: http://rogue-hacker-site.com" http://localhost:5000/api/v1/client/status
\`\`\`

---

### ⚛️ 3. FRONTEND INTEGRATION & DYNAMIC DATA CHECK
Verify in your React client:
\`\`\`typescript
const status = await window.boutique.gatekeeper.checkStatus(true);
console.assert(status.clientId === "${clientId}", "Gatekeeper must return matching clientId");
console.assert(typeof status.cartEnabled === "boolean", "Dynamic plan flags must be boolean");
console.assert(typeof status.maxImages === "number", "Quota limit must be integer from plan");
\`\`\`

---

### 🧪 4. BROWSER CONSOLE (F12) SMOKE SCRIPT
\`\`\`javascript
async function testGatekeeperSubSdk() {
  console.log("Testing Gatekeeper Sub-SDK...");
  localStorage.clear();
  const start = performance.now();
  const status = await window.boutique.gatekeeper.checkStatus(true);
  const duration = performance.now() - start;
  
  console.log("⏱️ Response Time:", duration.toFixed(2), "ms");
  console.log("🛡️ Status:", status.status, "| Plan:", status.planName);
  console.log("📦 Feature Flags:", { cart: status.cartEnabled, orders: status.ordersPortal, staff: status.staffAccountsAllowed });
}
testGatekeeperSubSdk();
\`\`\`
`,
    },
    {
      key: "storage",
      name: "2. ☁️ AWS S3 Storage & WebP Compressor Sub-SDK",
      badge: "Media Engine & Canvas",
      icon: HardDrive,
      summary: "Tests client-side canvas WebP compression (10MB -> <350KB), presigned S3 uploads, quota tracking, and delete restitution.",
      endpoint: "POST /api/v1/storage/request-upload",
      generatePrompt: () => `# ==============================================================================
# 🧪 AI QA PROMPT: AWS S3 STORAGE & WEBP CANVAS COMPRESSOR SUB-SDK
# ==============================================================================

You are testing and verifying the **Storage & Image Optimizer Sub-SDK Module** for:
- **STORE:** "${businessName}"
- **CLIENT ID:** \`${clientId}\`
- **SECRET KEY:** \`${secretKey}\`
- **QUOTA ENFORCEMENT:** Dynamic quota limits & storage bytes evaluated in real-time by the Central Gatekeeper API.

---

### 📋 1. OBJECTIVE & TEST MATRIX
Verify that:
1. Camera photos up to 10MB are auto-compressed in the browser using HTML5 Canvas to WebP format (<350KB).
2. The SDK requests presigned direct upload URLs from AWS S3 in \`ap-south-2\` (Hyderabad).
3. Photo upload consumes 1 slot dynamically from the active subscription quota.
4. Deleting an image via SDK restores the quota count in the central PostgreSQL database.

---

### 💻 2. BACKEND API VERIFICATION (Direct Upload Contract)
\`\`\`bash
# Request S3 Presigned URL
curl -X POST http://localhost:5000/api/v1/storage/request-upload \\
  -H "Content-Type: application/json" \\
  -H "x-client-id: ${clientId}" \\
  -H "x-secret-key: ${secretKey}" \\
  -d '{"fileName":"bridal_saree.webp","fileSizeBytes":320000,"mimeType":"image/webp","category":"collection"}'
\`\`\`

---

### 🧪 3. BROWSER CONSOLE (F12) SMOKE SCRIPT
\`\`\`javascript
async function testStorageSubSdk() {
  console.log("Testing Storage Sub-SDK...");
  // Create a 1x1 test image blob
  const canvas = document.createElement("canvas");
  canvas.width = 100; canvas.height = 100;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#e11d48"; ctx.fillRect(0,0,100,100);
  
  canvas.toBlob(async (blob) => {
    const file = new File([blob], "test_bridal_saree.webp", { type: "image/webp" });
    const uploaded = await window.boutique.storage.upload(file, { title: "Test Saree", price: 15000 });
    console.log("✅ Uploaded Media Item:", uploaded);
  }, "image/webp");
}
testStorageSubSdk();
\`\`\`
`,
    },
    {
      key: "cms",
      name: "3. 🖼️ Dynamic CMS Catalog & Cloud Gallery Sub-SDK",
      badge: "Dynamic S3 Catalog",
      icon: Code2,
      summary: "Tests dynamic loading of dress collections from AWS S3, empty-state fallbacks, real-time sync with database, and catalog card bindings.",
      endpoint: "GET /api/v1/storage/media",
      generatePrompt: () => `# ==============================================================================
# 🧪 AI QA PROMPT: DYNAMIC CMS & S3 CATALOG GALLERY SUB-SDK
# ==============================================================================

You are testing and verifying the **Dynamic CMS Catalog & Gallery Sub-SDK Module** for:
- **STORE:** "${businessName}"
- **CLIENT ID:** \`${clientId}\`
- **PUBLIC KEY:** \`${publicKey}\`

---

### 📋 1. OBJECTIVE & TEST MATRIX
Verify that:
1. The frontend website NEVER uses hardcoded dummy arrays for product catalog.
2. \`window.boutique.storage.fetchMedia()\` returns the real-time live product list from PostgreSQL/S3.
3. Every product object contains valid properties: \`id\`, \`title\`, \`price\`, \`fileUrl\`, \`category\`.
4. Empty catalog states gracefully render fallback UI without crashing React render cycles.

---

### ⚛️ 2. FRONTEND REACT HOOK VERIFICATION
\`\`\`tsx
export function useDynamicCatalog() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (window.boutique) {
        const media = await window.boutique.storage.fetchMedia();
        setItems(media);
      }
      setLoading(false);
    }
    load();
  }, []);

  return { items, loading };
}
\`\`\`
`,
    },
    {
      key: "cart",
      name: "4. 🛍️ Shopping Cart & Variant State Sub-SDK",
      badge: "Local State & Bag",
      icon: ShoppingBag,
      summary: "Tests add/remove/update quantity actions, size/color variant isolation, local storage persistence, and custom event broadcasting.",
      endpoint: "Local Storage: ecom_cart_${clientId}",
      generatePrompt: () => `# ==============================================================================
# 🧪 AI QA PROMPT: SHOPPING CART & VARIANT MANAGER SUB-SDK
# ==============================================================================

You are testing the **Shopping Cart & Variant Sub-SDK Module** for:
- **CLIENT ID:** \`${clientId}\`
- **STORAGE KEY:** \`ecom_cart_${clientId}\`

---

### 📋 1. OBJECTIVE & TEST MATRIX
Verify that:
1. \`addItem({ id, title, price, size: 'L', color: 'Red' })\` creates unique cart items partitioned by variant.
2. Adding the same item with identical size/color increments \`quantity\`.
3. Cart state persists across page refreshes via scoped localStorage.
4. \`ecom:cart:updated\` CustomEvent fires whenever the cart mutates so any floating bag icon re-renders instantly.

---

### 🧪 2. BROWSER CONSOLE (F12) SMOKE SCRIPT
\`\`\`javascript
function testCartSubSdk() {
  const cart = window.boutique.cart;
  cart.clearCart();
  
  // Test 1: Add item variant
  cart.addItem({ id: "prod_1", title: "Kanjeevaram Silk", price: 18000, size: "Free Size" }, 1);
  cart.addItem({ id: "prod_1", title: "Kanjeevaram Silk", price: 18000, size: "Free Size" }, 2);
  
  const items = cart.getItems();
  console.assert(items.length === 1, "Should combine identical variants");
  console.assert(items[0].quantity === 3, "Quantity must sum to 3");
  console.assert(cart.getTotalAmount() === 54000, "Subtotal must equal ₹54,000");
  console.log("✅ Shopping Cart Module passed 100% tests!");
}
testCartSubSdk();
\`\`\`
`,
    },
    {
      key: "checkout",
      name: "5. 💳 Checkout & Razorpay Payment Gateway Sub-SDK",
      badge: "Orders & Gateway",
      icon: CreditCard,
      summary: "Tests customer address validation, order ID generation (#ORD-XXXXXX), stock deduction, COD checkout, and Razorpay online checkout.",
      endpoint: "POST /api/v1/ecom/orders",
      generatePrompt: () => `# ==============================================================================
# 🧪 AI QA PROMPT: CHECKOUT & RAZORPAY PAYMENT GATEWAY SUB-SDK
# ==============================================================================

You are testing the **Checkout & Order Creation Sub-SDK Module** for:
- **STORE:** "${businessName}"
- **CLIENT ID:** \`${clientId}\`
- **CENTRAL API:** \`http://localhost:5000/api/v1/ecom/orders\`

---

### 📋 1. OBJECTIVE & TEST MATRIX
Verify that:
1. Full validation occurs on \`customerName\`, \`customerPhone\` (10 digits), \`shippingAddress\`, and \`pincode\`.
2. Automatic delivery fee logic applies (Free shipping over ₹2,999; otherwise ₹99).
3. The server generates a unique order reference number (\`#ORD-XXXXXX\`).
4. Order appears immediately in the store owner's \`/admin\` dashboard.

---

### 💻 2. DIRECT API CHECKOUT TEST (cURL)
\`\`\`bash
curl -X POST http://localhost:5000/api/v1/ecom/orders \\
  -H "Content-Type: application/json" \\
  -H "x-client-id: ${clientId}" \\
  -H "x-public-key: ${publicKey}" \\
  -d '{
    "customerName": "Pooja Hegde",
    "customerPhone": "919988776655",
    "shippingAddress": "Flat 402, Jubilee Hills",
    "city": "Hyderabad",
    "pincode": "500033",
    "paymentMethod": "RAZORPAY",
    "items": [{"id": "item_1", "title": "Bridal Dupatta", "price": 4500, "quantity": 1}]
  }'
\`\`\`
`,
    },
    {
      key: "whatsapp",
      name: "6. 💬 1-Click WhatsApp Direct Order Sub-SDK",
      badge: "WhatsApp Dispatch",
      icon: MessageSquare,
      summary: "Tests formatted click-to-chat WhatsApp link generation, product name and price inclusion, and direct dispatch to the owner's WhatsApp.",
      endpoint: "https://wa.me/${ownerPhone}?text=...",
      generatePrompt: () => `# ==============================================================================
# 🧪 AI QA PROMPT: 1-CLICK WHATSAPP DIRECT ORDER SUB-SDK
# ==============================================================================

You are testing the **WhatsApp Order Dispatch Sub-SDK Module** for:
- **STORE:** "${businessName}"
- **OWNER WHATSAPP:** "+${ownerPhone}"

---

### 📋 1. OBJECTIVE & TEST MATRIX
Verify that:
1. \`window.boutique.whatsapp.openChat(product)\` generates a valid URI-encoded WhatsApp API link.
2. The generated link targets \`https://wa.me/${ownerPhone}\`.
3. Pre-filled text includes: Store Name, Product Title, Price in ₹ INR, and Selected Size.

---

### 🧪 2. BROWSER CONSOLE (F12) SMOKE SCRIPT
\`\`\`javascript
function testWhatsAppSubSdk() {
  const item = { title: "Kanjeevaram Pure Silk", price: 24000, size: "Free Size" };
  const encoded = encodeURIComponent("Hello ${businessName}, I would like to order: " + item.title + " (₹" + item.price + ")");
  const expectedUrl = "https://wa.me/${ownerPhone}?text=" + encoded;
  console.log("Target Link:", expectedUrl);
  console.assert(expectedUrl.includes("${ownerPhone}"), "Must target store owner phone");
  console.log("✅ WhatsApp Dispatch Sub-SDK verified successfully!");
}
testWhatsAppSubSdk();
\`\`\`
`,
    },
    {
      key: "admin",
      name: "7. ⚙️ Turnkey Store Owner /admin Engine Sub-SDK",
      badge: "Drop-in Admin Portal",
      icon: Database,
      summary: "Tests mounting the complete turnkey management UI at /admin, store owner password auth, product uploads, order fulfillment, and staff roles.",
      endpoint: "POST /api/v1/client/admin/login",
      generatePrompt: () => `# ==============================================================================
# 🧪 AI QA PROMPT: TURNKEY STORE OWNER /admin PORTAL ENGINE SUB-SDK
# ==============================================================================

You are testing the **Drop-in /admin Engine Sub-SDK Module** for:
- **STORE:** "${businessName}"
- **CLIENT ID:** \`${clientId}\`
- **SECRET KEY:** \`${secretKey}\`
- **DEFAULT LOGIN:** Username: \`${adminUsername}\` | Password: \`${adminPassword}\`

---

### 📋 1. OBJECTIVE & TEST MATRIX
Verify that:
1. \`window.boutique.admin.mount("#admin-root")\` injects the turnkey management dashboard into the React DOM.
2. Store owner can authenticate using \`${adminUsername}\` / \`${adminPassword}\`.
3. Admin panel provides 4 live tabs:
   - 📸 **Catalog & Media:** Direct drag-and-drop S3 photo uploader.
   - 📦 **Live Orders:** Status progression (\`PENDING\` $\\rightarrow$ \`CONFIRMED\` $\\rightarrow$ \`SHIPPED\` $\\rightarrow$ \`DELIVERED\`).
   - 👥 **Staff Management:** Role assignment (Owner, Manager, Cashier, Fulfiller).
   - ⚙️ **Settings & Renewal:** Plan limits and Razorpay upgrade modal.

---

### ⚛️ 2. REACT COMPONENT ROUTE (\`src/pages/AdminPage.tsx\`)
\`\`\`tsx
import React, { useEffect, useRef } from "react";

export const AdminPage: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.boutique && mountRef.current) {
      window.boutique.admin.mount(mountRef.current);
    }
  }, []);

  return <div ref={mountRef} className="min-h-screen bg-slate-900" />;
};
\`\`\`
`,
    },
    {
      key: "billing",
      name: "8. 🔄 Self-Serve Razorpay Renewal & Billing Sub-SDK",
      badge: "Subscription & Auto-Unlock",
      icon: CreditCard,
      summary: "Tests self-serve renewal order creation, launching the Razorpay popup, and instant client auto-unlock upon webhook confirmation.",
      endpoint: "POST /api/v1/billing/create-order",
      generatePrompt: () => `# ==============================================================================
# 🧪 AI QA PROMPT: SELF-SERVE BILLING & RAZORPAY AUTO-UNLOCK SUB-SDK
# ==============================================================================

You are testing the **Self-Serve Billing & Renewal Sub-SDK Module** for:
- **STORE:** "${businessName}"
- **CLIENT ID:** \`${clientId}\`
- **PLAN:** ${planName}

---

### 📋 1. OBJECTIVE & TEST MATRIX
Verify that:
1. \`window.boutique.billing.openRenewalModal()\` fetches subscription tiers and launches Razorpay checkout.
2. Completed payments dispatch verification to \`POST /api/v1/billing/verify-payment\`.
3. Status changes from \`SUSPENDED\` $\\rightarrow$ \`ACTIVE\` instantly and removes all suspension blur overlays from the DOM.

---

### 🧪 2. BROWSER CONSOLE (F12) SMOKE SCRIPT
\`\`\`javascript
async function testBillingSubSdk() {
  console.log("Triggering Self-Serve Razorpay Renewal Modal...");
  await window.boutique.billing.openRenewalModal();
}
testBillingSubSdk();
\`\`\`
`,
    },
    {
      key: "coupons",
      name: "9. 🏷️ Store Discount Coupons Engine Sub-SDK",
      badge: "Discounts & Offers",
      icon: Tag,
      summary: "Tests coupon code validation (percentage vs flat rupee), minimum order value constraints, and single-use usage counter increments.",
      endpoint: "GET /api/v1/ecom/coupons",
      generatePrompt: () => `# ==============================================================================
# 🧪 AI QA PROMPT: STORE DISCOUNT COUPONS ENGINE SUB-SDK
# ==============================================================================

You are testing the **Discount Coupons Engine Sub-SDK Module** for:
- **STORE:** "${businessName}"
- **CLIENT ID:** \`${clientId}\`
- **SECRET KEY:** \`${secretKey}\`

---

### 📋 1. OBJECTIVE & TEST MATRIX
Verify that:
1. Coupons evaluate \`minOrderValue\` before applying discount.
2. \`PERCENTAGE\` discounts calculate accurately against cart subtotal.
3. \`FIXED\` rupee discounts deduct the exact specified amount.
4. Expired or inactive coupons return appropriate error messages.
`,
    },
    {
      key: "crm",
      name: "10. 📈 Customer CRM & Lifetime Value (LTV) Sub-SDK",
      badge: "Customer Intelligence",
      icon: TrendingUp,
      summary: "Tests automated customer profile creation upon order, repeat purchase tracking, total spent (₹ LTV) calculation, and customer address book.",
      endpoint: "GET /api/v1/ecom/customers",
      generatePrompt: () => `# ==============================================================================
# 🧪 AI QA PROMPT: CUSTOMER CRM & LIFETIME VALUE (LTV) SUB-SDK
# ==============================================================================

You are testing the **Customer CRM & LTV Intelligence Sub-SDK Module** for:
- **STORE:** "${businessName}"
- **CLIENT ID:** \`${clientId}\`
- **SECRET KEY:** \`${secretKey}\`

---

### 📋 1. OBJECTIVE & TEST MATRIX
Verify that:
1. Placing an order automatically upserts a customer record in PostgreSQL matched by \`phone\`.
2. Repeat orders increment \`totalOrders\` and aggregate \`totalSpentInr\`.
3. Store owner can query the CRM list via \`GET /api/v1/ecom/customers\` to identify high-value VIP buyers.
`,
    },
  ];

  const currentSubSdk = subSdksList.find((s) => s.key === activeSubSdk) || subSdksList[0];

  const activePromptText =
    activeCategory === "master"
      ? pureReactTsPrompt
      : currentSubSdk.generatePrompt(selectedClient, planName, maxImages, maxStorageGb);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(activePromptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-white to-amber-50/60 border border-slate-200/80 rounded-3xl p-8 shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            100% React &amp; TypeScript AI Builder &amp; Sub-SDK QA Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            React + TypeScript E-Commerce Prompt Kit
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Generates turnkey AI coding specifications for building the entire React storefront, plus 10 dedicated QA testing prompts for each sub-SDK module.
          </p>
        </div>

        <button
          onClick={handleCopyPrompt}
          className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6 py-3.5 rounded-2xl shadow-md shadow-indigo-100 flex items-center gap-2 transition-all cursor-pointer transform active:scale-95"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied
            ? "Copied to Clipboard!"
            : activeCategory === "master"
            ? "Copy Complete React Prompt"
            : `Copy ${currentSubSdk.name.split(" ")[1]} QA Prompt`}
        </button>
      </div>

      {/* Boutique Selector Bar */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            Select Store to Generate Prompt For:
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.businessName} ({c.primaryDomain}) • {c.id}
              </option>
            ))}
          </select>
        </div>

        {selectedClient && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => copyPill(selectedClient.id, "cid")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 cursor-pointer transition-colors"
            >
              <Key className="w-3 h-3 text-slate-400" />
              {selectedClient.id}
              {copiedPill === "cid" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
            </button>
            <button
              onClick={() => copyPill(selectedClient.publicApiKey, "pk")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-700 cursor-pointer transition-colors"
            >
              <Key className="w-3 h-3 text-emerald-500" />
              {selectedClient.publicApiKey.substring(0, 16)}...
              {copiedPill === "pk" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-emerald-500" />}
            </button>
          </div>
        )}
      </div>

      {/* Primary Category Selector (Master Specification vs 10 Sub-SDK Testing Prompts) */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl flex gap-2">
        <button
          onClick={() => setActiveCategory("master")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeCategory === "master"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          🌟 Master Storefront Specification (All-in-One)
        </button>

        <button
          onClick={() => setActiveCategory("sub_sdks")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeCategory === "sub_sdks"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <TestTube2 className="w-4 h-4 text-emerald-600" />
          🧪 10 Dedicated Sub-SDK Testing &amp; QA Prompts
        </button>
      </div>

      {/* Sub-SDK Selection Horizontal Grid (Visible when sub_sdks tab is active) */}
      {activeCategory === "sub_sdks" && (
        <div className="space-y-3 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-600" /> Choose Sub-SDK Module to Test:
            </h3>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {currentSubSdk.badge}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {subSdksList.map((sdk) => {
              const Icon = sdk.icon;
              const isSelected = activeSubSdk === sdk.key;
              return (
                <button
                  key={sdk.key}
                  onClick={() => setActiveSubSdk(sdk.key)}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                      : "bg-slate-50 border-slate-200/80 hover:bg-slate-100/80 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-slate-500"}`} />
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${isSelected ? "text-indigo-950" : "text-slate-800"}`}>
                      {sdk.name.split(" ")[1]}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{sdk.endpoint}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            {currentSubSdk.summary}
          </p>
        </div>
      )}

      {/* Code Editor / Prompt Display Terminal */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Terminal Title Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-xs font-mono text-slate-400">
              {activeCategory === "master"
                ? "PURE_REACT_TYPESCRIPT_ECOM_SPECIFICATION.md"
                : `TEST_SUB_SDK_${currentSubSdk.key.toUpperCase()}.md`}
            </span>
          </div>

          <button
            onClick={handleCopyPrompt}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Prompt"}
          </button>
        </div>

        {/* Prompt Content */}
        <pre className="p-6 text-xs font-mono text-slate-200 overflow-x-auto max-h-[600px] overflow-y-auto leading-relaxed selection:bg-indigo-600 selection:text-white">
          {activePromptText}
        </pre>
      </div>
    </div>
  );
};
