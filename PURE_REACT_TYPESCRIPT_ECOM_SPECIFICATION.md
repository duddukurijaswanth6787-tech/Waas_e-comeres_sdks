# ==============================================================================
# 🛒 MASTER FULL-STACK AI SPECIFICATION: FULL E-COMMERCE STOREFRONT
# ==============================================================================
# Amazon / Myntra / Meesho / Ajio-Grade E-Commerce Storefront Specification
# Pre-Wired with the Master All-in-One SDK & Central Multi-Tenant SaaS Backend
# Frontend: React 19/18 + TypeScript + Tailwind CSS
# Backend: Central Fastify SaaS API (Port 5000) + PostgreSQL + AWS S3 + Razorpay
# ==============================================================================

You are building a production-grade, high-converting, luxury Full-Stack E-Commerce Storefront in **React 19 / 18 + TypeScript + Tailwind CSS** modeled after top Indian & Global e-commerce platforms (**Amazon, Myntra, Meesho, and Ajio**), pre-wired directly to the Central Multi-Tenant SaaS Backend via the **Master All-in-One Boutique SDK**.

---

## 📋 1. STORE CREDENTIALS & CENTRAL API CONTRACT

```ini
STORE_NAME="[STORE_NAME]"
OWNER_NAME="[OWNER_NAME]"
OWNER_WHATSAPP="[OWNER_PHONE]"
LOCATION="[STORE_ADDRESS], [CITY]"
PRIMARY_DOMAIN="[PRIMARY_DOMAIN]"

# Central SaaS Credentials
CLIENT_ID="[CLIENT_ID]"
PUBLIC_KEY="[PUBLIC_KEY]"
SECRET_KEY="[SECRET_KEY]" # Used only in /admin management portal
DEFAULT_ADMIN_USER="[ADMIN_USERNAME]"
DEFAULT_ADMIN_PASS="[ADMIN_PASSWORD]"

# Central Endpoints
CENTRAL_API_URL="http://localhost:5000"
SDK_CDN_URL="http://localhost:5000/sdk/v1/boutique-sdk.min.js"
```

---

## ☁️ 2. STRICT CLOUD STORAGE & DATA FLOW POLICY

### 🚨 INVIOLABLE STORAGE RULES FOR AI CODE GENERATION:
1. **ALL MEDIA (Images, Videos, Product Reels, Banners) -> AWS S3 ONLY:**
   - **Bucket:** `boutique-media-848910045051-hyd` (`ap-south-2` Hyderabad Region)
   - **Policy:** NEVER save or write image/video files to local disk, local folders (`/uploads`), or local server storage.
   - **Upload Mechanism:** The SDK requests a presigned secure upload URL from `POST /api/v1/storage/request-upload` and streams the media directly from the client browser to AWS S3.
   - **MIME Support:** `image/webp`, `image/jpeg`, `image/png`, `video/mp4`, `video/webm`, `video/quicktime`.

2. **ALL TEXT & STRUCTURED DATA -> CENTRAL POSTGRESQL ONLY:**
   - **Database:** `ecom_boutique_db` (PostgreSQL on port 5432)
   - **Saved Entities:** Products (titles, prices, categories, sizes, colors, inventory stock, S3 public URLs), Orders, Customers, Subscriptions, Invoices, Coupons, and Staff accounts.
   - **Policy:** NEVER create local JSON database files or local SQLite files in client projects.

3. **WHAT DATA EXISTS ON THE CLIENT WEBSITE? (STATELESS FRONTEND):**
   - The client React storefront is **100% dynamic, thin, and stateless**.
   - It fetches real-time data dynamically from the Central API via SDK over HTTPS.
   - The ONLY client-side data is temporary, in-browser state:
     - `ecom_cart_[CLIENT_ID]`: Temporary shopping bag in browser `localStorage` while customer shops.
     - `boutique_status_[CLIENT_ID]`: 15-minute TTL cache of subscription status.
     - `boutique_admin_jwt`: JWT session token in `localStorage` when the store owner logs in to `/admin`.

---

## 🛍️ 3. AMAZON / MYNTRA / MEESHO / AJIO FEATURE SPECIFICATION

The AI agent MUST build the complete e-commerce experience with all industry-standard features:

### 🌟 1. Header & Navigation Bar (Amazon / Myntra Style)
- **Top Notification Bar:** Announcement ticker (*"Complimentary Express Shipping on Orders Above ₹2,999 | Direct Weaver Prices"*).
- **Sticky Luxury Header:**
  - Brand Logo with luxury serif typography.
  - **Mega-Menu Navigation:** Category links (*Bridal Silk Sarees, Kanjeevaram, Designer Lehengas, Kurtis, Ready-to-Wear*).
  - **Live Predictive Search Bar (Amazon Style):** Instant debounced search filtering products by title, category, and color as the user types.
  - **Pincode Delivery Estimator (Myntra Style):** Header widget displaying *"Deliver to: 500033 (Jubilee Hills)"* with change pincode modal.
  - **Wishlist Heart Badge:** Tracks saved favorite items in `localStorage`.
  - **Floating Shopping Bag Badge:** Shows dynamic item count (`3`) and triggers the Slide-Over Cart Drawer.
  - **WhatsApp Support Link:** 1-click connect to store helpline.

---

### 👗 2. Catalog, Filtering & Merchandising (Myntra / Ajio Style)
- **Multi-Filter Sidebar & Top Filter Bar:**
  - **Price Range Filter:** Interactive range slider or pills (*Under ₹5,000, ₹5,000–₹15,000, ₹15,000–₹30,000, ₹30,000+*).
  - **Category Filter:** Checkbox list with item counts.
  - **Color Swatches:** Clickable color circles (*Crimson Red, Royal Blue, Emerald Green, Gold, Wine, Magenta*).
  - **Size Selector:** Interactive pills (`XS, S, M, L, XL, XXL, Free Size`).
  - **Sort Dropdown:** *Price: Low to High*, *Price: High to Low*, *Newest Arrivals*, *Popular / Best Sellers*.
- **Product Cards (Myntra / Ajio Merchandising Grid):**
  - High-res AWS S3 photo with smooth hover zoom and optional video reel preview.
  - **Discount % Badge:** (e.g. `20% OFF`).
  - **Strikethrough MRP Price:** (e.g. `₹24,000`) alongside **Real Selling Price:** (e.g. `₹19,200`).
  - **Customer Rating Badge:** (e.g. `★ 4.8 (128)`).
  - **Hover Quick-Add Size Bar:** Hovering reveals instant size buttons for 1-click add to cart without opening details.
  - **Wishlist Heart Button:** Toggles active state.
  - **Dual Action Buttons:**
    1. Gold **"Add to Bag"** (adds item to `window.boutique.cart`).
    2. Green **"Order via WhatsApp"** (Meesho model — calls `window.boutique.whatsapp.openChat`).

---

### 🔍 3. Product Details & Quick-View Modal (Amazon / Myntra Style)
- **Multi-Photo & Video Reel Carousel:** Large high-res viewer with thumbnail slider loaded directly from AWS S3.
- **Stock Scarcity Badge (Amazon Style):** *"Only 2 items left in stock — order soon"* when stock $\le 3$.
- **Interactive Size & Color Choosers:** Select size and view stock availability for selected variant.
- **Size Chart Modal:** Measurements table (Bust, Waist, Hip, Length in inches & cm).
- **Delivery Date Estimator:** Input 6-digit pincode to display *"Get it by Tomorrow, 5 PM"*.
- **Product Highlights & Fabric Specifications:** Fabric details, weave type, wash care instructions, authenticity guarantee.
- **Customer Ratings & Reviews Section:** Star breakdown bar chart, verified customer feedback, and photo review gallery.

---

### 🛍️ 4. Slide-Over Shopping Bag & Coupon Engine (Ajio / Myntra Style)
- **Slide-Over Drawer:** Slides in from right on cart button click.
- **Cart Item Row:** Image, title, selected size/color, price, and `-` / `+` quantity steppers + remove button.
- **Interactive Coupon Drawer (Myntra Style):**
  - Dedicated input box for promo codes (e.g. `WELCOME10`, `BRIDAL500`).
  - 1-Click "Apply" pills for active coupons.
  - Instant live validation against central backend with discount subtraction.
  - Live celebration banner: *"🎉 Congratulations! You saved ₹1,500 on this order!"*
- **Detailed Price Breakdown Card:**
  $$\begin{aligned}
  \text{Total MRP} &\quad \text{₹24,000} \\
  \text{Discount on MRP} &\quad -\text{₹4,800} \\
  \text{Coupon Discount} &\quad -\text{₹1,500} \\
  \text{Delivery Fee} &\quad \text{FREE (Orders above ₹2,999)} \\
  \hline
  \textbf{Total Amount} &\quad \textbf{₹17,700}
  \end{aligned}$$

---

### 💳 5. Multi-Option Checkout (Amazon / Meesho Style)
- **Step 1: Customer & Shipping Details:**
  - Full Name, 10-Digit WhatsApp Mobile Number, Delivery Address, City, State, and Pincode.
  - Auto-fills address if previously entered on this device.
- **Step 2: Flexible Payment Methods:**
  1. **💳 Razorpay Live Online Gateway:** Instant Google Pay, PhonePe, Paytm UPI, Credit/Debit Cards, NetBanking.
  2. **💵 Cash on Delivery (COD):** Pay upon physical delivery.
  3. **💬 1-Click WhatsApp Direct Order (Meesho Style):** Formats complete shopping list and address into a WhatsApp message directly to the store owner.
- **Step 3: Order Confirmation & Invoice:**
  - Animated order success screen with confetti effect.
  - Unique Order Reference Number: `#ORD-XXXXXX`.
  - Downloadable PDF invoice link & SMS/WhatsApp notification confirmation.

---

### 📦 6. Real-Time Customer Order Tracking (`/track`) (Amazon Style)
- Allows customers to enter their `#ORD-XXXXXX` and phone number.
- Visual 4-Step Status Progress Tracker:
  $$\text{1. Order Placed} \longrightarrow \text{2. Order Confirmed} \longrightarrow \text{3. Shipped (with Courier Tracking Link)} \longrightarrow \text{4. Delivered}$$

---

### ⚙️ 7. Turnkey Store Owner Management Portal (`/admin`)
- Mounted directly via `window.boutique.admin.mount("#admin-root")`.
- Store Owner Login (`[ADMIN_USERNAME]` / `[ADMIN_PASSWORD]`).
- 4 Full Operational Panels:
  1. **📸 Product & Media Catalog Hub:** Drag-and-drop S3 photo/video uploader with automatic canvas WebP compressor.
  2. **📦 Order Fulfillment Management:** View new orders, update status (`CONFIRMED`, `SHIPPED` with tracking ID, `DELIVERED`), print shipping labels.
  3. **👥 Staff Roles Management:** Add Cashiers, Managers, and Order Fulfillers.
  4. **💳 Plan Quota & Subscription Renewal:** Photo quota bar and 1-click Razorpay subscription renewal modal.

---

## 🛠️ 4. ROOT SDK ATTACHMENT (`index.html`)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>[STORE_NAME] — Luxury Boutique & Bridal Collection</title>

  <!-- Central All-in-One Boutique SDK -->
  <script src="http://localhost:5000/sdk/v1/boutique-sdk.min.js"></script>
  <script>
    window.boutique = new BoutiqueSDK({
      clientId: "[CLIENT_ID]",
      publicKey: "[PUBLIC_KEY]",
      secretKey: "[SECRET_KEY]",
      apiUrl: "http://localhost:5000",
      whatsappNumber: "[OWNER_PHONE]",
      debug: true
    });
  </script>
</head>
<body class="bg-stone-950 text-stone-100 antialiased selection:bg-amber-400 selection:text-stone-900">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

---

## 📄 5. TYPESCRIPT CONTRACTS (`src/types/ecom.ts`)

```typescript
export interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  fileUrl: string;
  category: string;
  sku?: string;
  stockCount?: number;
  sizes?: string[];
  colors?: string[];
  rating?: number;
  reviewCount?: number;
  description?: string;
}

export interface CartItem {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
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

export interface ClientStatus {
  clientId: string;
  businessName: string;
  environmentMode: "TESTING" | "LIVE";
  status: "ACTIVE" | "GRACE_PERIOD" | "SUSPENDED" | "TESTING";
  planName: string;
  priceInrMonthly: number;
  cartEnabled: boolean;
  ordersPortal: boolean;
  inventory: boolean;
  staffAccountsAllowed: number;
  maxImages: number;
  maxStorageBytes: number;
  currentImagesCount: number;
  currentStorageBytes: number;
}

declare global {
  interface Window {
    boutique?: {
      clientId: string;
      publicKey: string;
      secretKey?: string;
      apiUrl: string;
      gatekeeper: {
        checkStatus: (forceRefresh?: boolean) => Promise<ClientStatus>;
      };
      storage: {
        fetchMedia: () => Promise<Product[]>;
        upload: (file: File, options?: { title?: string; price?: number; category?: string }) => Promise<unknown>;
        delete: (id: string) => Promise<boolean>;
      };
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
```

---

## 🤖 6. STEP-BY-STEP EXECUTION ROADMAP FOR AI AGENTS

1. **Step 1: Project Setup**
   - Scaffold Vite React + TypeScript (`npm create vite@latest . -- --template react-ts`).
   - Install Tailwind CSS (`@tailwindcss/vite`) and Lucide React icons (`npm install lucide-react`).

2. **Step 2: Attach Master SDK in `index.html`**
   - Add `<script src="http://localhost:5000/sdk/v1/boutique-sdk.min.js"></script>` in `<head>`.
   - Initialize `window.boutique = new BoutiqueSDK({...})` with store keys.

3. **Step 3: Setup TypeScript Contracts (`src/types/ecom.ts`)**
   - Copy Section 5 TypeScript definitions.

4. **Step 4: Build Storefront Components**
   - Build `Header.tsx` with Mega-menu, live predictive search, and shopping bag counter.
   - Build `Hero.tsx` with editorial background photography/video from AWS S3.
   - Build `ProductCatalog.tsx` with sidebar filter (price slider, colors, sizes) and sort dropdown.
   - Build `ProductCard.tsx` with hover zoom, discount badges, quick size selector, and Add to Bag / WhatsApp buttons.
   - Build `CartDrawer.tsx` with quantity steppers, coupon apply box, and multi-option checkout form.
   - Build `OrderTracking.tsx` (`/track`) with visual 4-step pipeline.
   - Build `AdminPage.tsx` (`/admin`) with drop-in `window.boutique.admin.mount`.
   - Build `Footer.tsx` with showroom details, Google Map badge, and `/admin` link.

5. **Step 5: Verify in Browser**
   - Open browser console (`F12`), confirm `window.boutique` is initialized, test adding products, applying coupons, placing an order, and verifying in `/admin`.
