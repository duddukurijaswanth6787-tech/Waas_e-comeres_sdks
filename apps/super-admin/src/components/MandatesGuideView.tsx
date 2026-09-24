import React, { useState } from "react";
import { Copy, Check, Code2, Sparkles, CreditCard, ShoppingBag, Database } from "lucide-react";

export const MandatesGuideView: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const reactHeadCode = `<!-- In your React index.html <head> -->
<script src="http://localhost:5000/sdk/v1/boutique-sdk.min.js"></script>
<script>
  window.boutique = new BoutiqueSDK({
    clientId: "YOUR_CLIENT_ID",          // e.g. "cl_hyd_kalyanbridal_acb9c0"
    publicKey: "YOUR_PUBLIC_KEY",        // e.g. "pk_live_xxxxxx"
    secretKey: "YOUR_SECRET_KEY",        // Required for catalog uploads & admin
    apiUrl: "http://localhost:5000",
    debug: true
  });
</script>`;

  const reactCartCheckoutCode = `// Wiring: React Shopping Cart & Razorpay Checkout Gateway
import React, { useEffect, useState } from "react";

export function ShoppingCartDrawer() {
  const [cartItems, setCartItems] = useState<any[]>([]);

  useEffect(() => {
    // 1. Sync live cart items from E-Com SDK
    if (window.boutique?.cart) {
      setCartItems(window.boutique.cart.getItems());
    }

    const handleCartUpdate = (e: any) => setCartItems(e.detail);
    window.addEventListener("ecom:cart:updated", handleCartUpdate);
    return () => window.removeEventListener("ecom:cart:updated", handleCartUpdate);
  }, []);

  // 2. Add product to cart with size / color
  const handleAddToCart = (product: any, size = "M", color = "Red") => {
    window.boutique?.cart.addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      size,
      color,
      image: product.fileUrl
    }, 1);
  };

  // 3. Complete Checkout & Order Placement
  const handlePlaceOrder = async (customerDetails: any) => {
    try {
      const order = await window.boutique?.checkout.placeOrder({
        customerName: customerDetails.name,
        customerPhone: customerDetails.phone,
        customerEmail: customerDetails.email,
        shippingAddress: customerDetails.address,
        city: customerDetails.city,
        pincode: customerDetails.pincode,
        paymentMethod: "RAZORPAY",
        couponCode: customerDetails.coupon
      });
      alert("✓ Order Placed Successfully! Order Number: " + order.orderNumber);
    } catch (err: any) {
      alert("Checkout failed: " + err.message);
    }
  };

  return (
    <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-200">
      <h3 className="font-bold text-slate-900">Your Cart ({cartItems.length} items)</h3>
      {/* Render Cart Items, Quantity Controls & Checkout Button */}
    </div>
  );
}`;

  const reactStoreOrdersPortalCode = `// Wiring: Custom Store Owner /admin Orders Fulfillment Portal
import React, { useEffect, useState } from "react";

export function OrdersFulfillmentTab() {
  const [orders, setOrders] = useState<any[]>([]);

  const loadOrders = async () => {
    // Fetches live customer orders using Merchant Secret API Key
    const res = await fetch("http://localhost:5000/api/v1/ecom/orders", {
      headers: {
        "x-client-id": "YOUR_CLIENT_ID",
        "x-secret-key": "YOUR_SECRET_KEY"
      }
    });
    const data = await res.json();
    setOrders(data);
  };

  const handleUpdateStatus = async (orderId: string, status: "PROCESSING" | "SHIPPED" | "DELIVERED") => {
    await fetch(\`http://localhost:5000/api/v1/ecom/orders/\${orderId}/status\`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": "YOUR_CLIENT_ID",
        "x-secret-key": "YOUR_SECRET_KEY"
      },
      body: JSON.stringify({ status })
    });
    loadOrders();
  };

  useEffect(() => { loadOrders(); }, []);

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-900">Customer Orders Fulfillment ({orders.length})</h3>
      {/* Table of Orders with Customer Name, Phone, Items & Status Dropdown */}
    </div>
  );
}`;

  const reactSubscriptionTabCode = `// Wiring: Custom "Subscription Plans" Tab in React Store Admin
import React, { useEffect, useState } from "react";

export function SubscriptionPlansTab() {
  const [subDetails, setSubDetails] = useState<any>(null);

  useEffect(() => {
    // 1. Fetch live active subscription & e-commerce entitlements from SDK
    if (window.boutique) {
      window.boutique.gatekeeper.checkStatus(true).then((status: any) => {
        setSubDetails(status);
      });
    }
  }, []);

  // 2. Trigger Razorpay renewal for current active plan
  const handleRenewActivePlan = () => {
    window.boutique?.billing.openRenewalModal();
  };

  // 3. Trigger Razorpay upgrade for higher tier
  const handleUpgradePlan = (targetPlanId: string) => {
    window.boutique?.billing.openRenewalModal({ planId: targetPlanId });
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl">
        <h3 className="font-bold text-slate-900">Current Plan: {subDetails?.planName}</h3>
        <p className="text-xs text-slate-600">Renews on: {subDetails?.currentPeriodEnd ? new Date(subDetails.currentPeriodEnd).toLocaleDateString('en-IN') : '—'}</p>
        <div className="mt-2 text-xs text-indigo-700 font-semibold">
          Cart: {subDetails?.allowOnlineCart ? 'Enabled' : 'Disabled'} • Staff: {subDetails?.allowStaffAccounts} accounts
        </div>
        <button onClick={handleRenewActivePlan} className="mt-3 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs cursor-pointer">
          ⚡ Renew Active Plan (₹{subDetails?.priceInrMonthly}/mo)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl">
          <h4 className="font-bold text-slate-900">E-Com Pro Flagship</h4>
          <p className="text-xl font-bold text-slate-900 mt-1">₹3,999 / mo</p>
          <ul className="text-xs text-slate-600 my-3 space-y-1">
            <li>📸 500 Photos Gallery Limit</li>
            <li>☁️ 25.0 GB AWS S3 Storage</li>
            <li>👥 5 Staff Role Accounts</li>
          </ul>
          <button onClick={() => handleUpgradePlan('plan_ecom_pro')} className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer">
            Upgrade to Pro &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60 border border-slate-200/80 rounded-3xl p-8 shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Developer Architecture Mandates (E-Commerce Platform)
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            E-Commerce Client Website Integration Mandates
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Strict engineering standards, SDK wiring patterns, and client-side contracts required for every boutique e-commerce storefront.
          </p>
        </div>
      </div>

      {/* Mandate 1: Root Initialization */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Mandate 1: Root SDK Initialization</h3>
              <p className="text-xs text-slate-500">Inject SDK bundle in root &lt;head&gt; before React mounts.</p>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(reactHeadCode, "m1")}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedSection === "m1" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSection === "m1" ? "Copied!" : "Copy Snippet"}
          </button>
        </div>
        <pre className="text-xs font-mono bg-slate-950 text-slate-200 p-4 rounded-2xl overflow-x-auto">
          {reactHeadCode}
        </pre>
      </div>

      {/* Mandate 2: Shopping Cart & Checkout */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Mandate 2: Online Shopping Cart &amp; Checkout</h3>
              <p className="text-xs text-slate-500">Connect add-to-cart, size/color SKUs, and Razorpay order submission.</p>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(reactCartCheckoutCode, "m2")}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedSection === "m2" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSection === "m2" ? "Copied!" : "Copy Snippet"}
          </button>
        </div>
        <pre className="text-xs font-mono bg-slate-950 text-slate-200 p-4 rounded-2xl overflow-x-auto">
          {reactCartCheckoutCode}
        </pre>
      </div>

      {/* Mandate 3: Store Orders Portal */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Mandate 3: Store Owner Orders Fulfillment Portal</h3>
              <p className="text-xs text-slate-500">Enable store managers to track, fulfill, and ship customer orders.</p>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(reactStoreOrdersPortalCode, "m3")}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedSection === "m3" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSection === "m3" ? "Copied!" : "Copy Snippet"}
          </button>
        </div>
        <pre className="text-xs font-mono bg-slate-950 text-slate-200 p-4 rounded-2xl overflow-x-auto">
          {reactStoreOrdersPortalCode}
        </pre>
      </div>

      {/* Mandate 4: Subscription & Billing */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Mandate 4: Subscription Metering &amp; Razorpay Upgrades</h3>
              <p className="text-xs text-slate-500">Embed live renewal status and self-serve tier upgrade modals.</p>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(reactSubscriptionTabCode, "m4")}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedSection === "m4" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSection === "m4" ? "Copied!" : "Copy Snippet"}
          </button>
        </div>
        <pre className="text-xs font-mono bg-slate-950 text-slate-200 p-4 rounded-2xl overflow-x-auto">
          {reactSubscriptionTabCode}
        </pre>
      </div>
    </div>
  );
};
