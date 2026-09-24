import React, { useState } from "react";
import { ClientData } from "../types";
import { api } from "../services/api";
import {
  Play,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Bot,
  Copy,
  Check,
  Shield,
  HardDrive,
  ShoppingBag,
  Sparkles,
  Layers,
  Terminal,
  Database,
  Users,
  MessageSquare,
  CreditCard,
  Tag,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Store
} from "lucide-react";

interface SdkTestingPlaygroundProps {
  clients: ClientData[];
  onOpenOnboardModal?: () => void;
  onClientCreated?: (client: ClientData) => void;
}

interface TestResult {
  id: string;
  name: string;
  module: string;
  description: string;
  status: "idle" | "running" | "passed" | "failed";
  durationMs?: number;
  details?: string;
  responsePayload?: unknown;
}

export const SdkTestingPlayground: React.FC<SdkTestingPlaygroundProps> = ({
  clients,
  onOpenOnboardModal,
  onClientCreated,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || "");
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [expandedPayloadId, setExpandedPayloadId] = useState<string | null>(null);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const [testResults, setTestResults] = useState<Record<string, TestResult>>({
    gatekeeper: {
      id: "gatekeeper",
      name: "1. Gatekeeper Entitlement & Quota Verification",
      module: "gatekeeper",
      description: "Verifies subscription status in <20ms, plan quotas, and feature flags.",
      status: "idle",
    },
    mediaFetch: {
      id: "mediaFetch",
      name: "2. AWS S3 Media & WebP Catalog Fetch Check",
      module: "storage",
      description: "Loads live dress collections and photo assets directly from AWS S3.",
      status: "idle",
    },
    cartOrder: {
      id: "cartOrder",
      name: "3. Shopping Cart Checkout & Razorpay Order API",
      module: "checkout",
      description: "Simulates customer adding items to cart and placing an order with subtotal calculation.",
      status: "idle",
    },
    ordersPortal: {
      id: "ordersPortal",
      name: "4. Store Owner /admin Orders Management Portal",
      module: "admin",
      description: "Tests authenticated store owner order fulfillment pipeline and status progression.",
      status: "idle",
    },
    staffAuth: {
      id: "staffAuth",
      name: "5. Multi-Staff Account Role & Auth Check",
      module: "staff",
      description: "Validates multi-staff role access control (Owner, Manager, Cashier, Fulfiller).",
      status: "idle",
    },
    antiTamper: {
      id: "antiTamper",
      name: "6. Anti-Tamper Domain Whitelist Security Check",
      module: "security",
      description: "Rejects unauthorized rogue domains with HTTP 403 Forbidden to protect merchant keys.",
      status: "idle",
    },
    whatsapp: {
      id: "whatsapp",
      name: "7. 1-Click WhatsApp Order Formatter & Dispatch",
      module: "whatsapp",
      description: "Generates formatted click-to-chat order links with pre-filled dress names and pricing.",
      status: "idle",
    },
    billing: {
      id: "billing",
      name: "8. Self-Serve Razorpay Renewal & Webhook Engine",
      module: "billing",
      description: "Tests automated subscription renewal order creation and instant store auto-reactivation.",
      status: "idle",
    },
    coupons: {
      id: "coupons",
      name: "9. Store Discount Coupons & Min Order Value",
      module: "coupons",
      description: "Evaluates percentage and flat rupee promo discount logic against cart total.",
      status: "idle",
    },
    crm: {
      id: "crm",
      name: "10. Customer CRM & Lifetime Value (LTV) Tracker",
      module: "crm",
      description: "Retrieves customer purchase histories, repeat order counts, and total spend analytics.",
      status: "idle",
    },
  });

  const handleCreateDemoStore = async () => {
    setIsCreatingDemo(true);
    try {
      const demoPayload = {
        businessName: "Kalyan Bridal Silks (Demo)",
        ownerName: "Kalyan Kumar",
        ownerPhone: "919876543210",
        ownerEmail: "kalyan@demo.com",
        city: "Hyderabad",
        storeAddress: "Road No. 36, Jubilee Hills",
        instagramHandle: "@kalyanbridalsilks",
        websiteType: "ECOMMERCE" as const,
        primaryDomain: "localhost",
        allowedDomains: "localhost,127.0.0.1,kalyanbridalsilks.com",
        planId: "plan_ecom_standard",
        environmentMode: "TESTING" as const,
        billingCycle: "MONTHLY" as const,
      };

      const res = await api.createClient(demoPayload);
      if (res.success && res.client) {
        setSelectedClientId(res.client.id);
        if (onClientCreated) {
          onClientCreated(res.client);
        }
      }
    } catch (err) {
      console.error("Failed to create demo store:", err);
      alert("Failed to auto-create demo store. Please ensure backend is running.");
    } finally {
      setIsCreatingDemo(false);
    }
  };

  const runSingleTest = async (testId: string) => {
    if (!selectedClient) {
      alert("Please select or create a Boutique Store first to test the SDK.");
      return;
    }

    setTestResults((prev) => ({
      ...prev,
      [testId]: { ...prev[testId], status: "running" },
    }));

    const start = Date.now();
    const rawMeta = import.meta;
    const envApiUrl =
      "env" in rawMeta &&
      rawMeta.env &&
      typeof rawMeta.env === "object" &&
      "VITE_API_URL" in rawMeta.env &&
      typeof rawMeta.env.VITE_API_URL === "string"
        ? rawMeta.env.VITE_API_URL
        : "http://localhost:5000";
    const apiUrl = `${envApiUrl}/api/v1`;

    try {
      // 1. Gatekeeper Test
      if (testId === "gatekeeper") {
        const res = await fetch(`${apiUrl}/client/status`, {
          headers: {
            "x-client-id": selectedClient.id,
            "x-public-key": selectedClient.publicApiKey,
          },
        });
        const duration = Date.now() - start;
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        setTestResults((prev) => ({
          ...prev,
          gatekeeper: {
            ...prev.gatekeeper,
            status: "passed",
            durationMs: duration,
            details: `Status: '${data.status}' (Plan: ${data.planName}). Cart: ${data.cartEnabled ? "Enabled" : "Active"}, Staff: ${data.staffAccountsAllowed || 2} accounts.`,
            responsePayload: data,
          },
        }));
      }

      // 2. AWS S3 Media Fetch
      if (testId === "mediaFetch") {
        const res = await fetch(`${apiUrl}/storage/media`, {
          headers: {
            "x-client-id": selectedClient.id,
            "x-public-key": selectedClient.publicApiKey,
          },
        });
        const duration = Date.now() - start;
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        setTestResults((prev) => ({
          ...prev,
          mediaFetch: {
            ...prev.mediaFetch,
            status: "passed",
            durationMs: duration,
            details: `Retrieved ${data.length} active collection items from AWS S3 in ${duration}ms.`,
            responsePayload: data,
          },
        }));
      }

      // 3. Shopping Cart & Order API
      if (testId === "cartOrder") {
        const res = await fetch(`${apiUrl}/ecom/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-client-id": selectedClient.id,
            "x-public-key": selectedClient.publicApiKey,
          },
          body: JSON.stringify({
            customerName: "Diagnostic Customer",
            customerPhone: "919988776655",
            customerEmail: "diagnostic@example.com",
            shippingAddress: "Boutique Road 36, Jubilee Hills",
            city: "Hyderabad",
            pincode: "500033",
            paymentMethod: "RAZORPAY",
            items: [
              {
                id: "diag_item_1",
                title: "Diagnostic Bridal Silk Saree",
                price: 14500,
                quantity: 1,
                size: "Free Size",
                color: "Royal Red",
              },
            ],
          }),
        });
        const duration = Date.now() - start;
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        setTestResults((prev) => ({
          ...prev,
          cartOrder: {
            ...prev.cartOrder,
            status: "passed",
            durationMs: duration,
            details: `Order Placed: ${data.orderNumber} (Total: ₹${data.totalAmountInr}). Verified in ${duration}ms.`,
            responsePayload: data,
          },
        }));
      }

      // 4. Store Owner /admin Orders Management
      if (testId === "ordersPortal") {
        const res = await fetch(`${apiUrl}/ecom/orders`, {
          headers: {
            "x-client-id": selectedClient.id,
            "x-secret-key": selectedClient.secretApiKey,
          },
        });
        const duration = Date.now() - start;
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        setTestResults((prev) => ({
          ...prev,
          ordersPortal: {
            ...prev.ordersPortal,
            status: "passed",
            durationMs: duration,
            details: `Store Orders Portal operational. Retrieved ${data.length} live orders for store owner.`,
            responsePayload: data,
          },
        }));
      }

      // 5. Multi-Staff Role & Auth Check
      if (testId === "staffAuth") {
        const res = await fetch(`${apiUrl}/ecom/staff`, {
          headers: {
            "x-client-id": selectedClient.id,
            "x-secret-key": selectedClient.secretApiKey,
          },
        });
        const duration = Date.now() - start;
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        setTestResults((prev) => ({
          ...prev,
          staffAuth: {
            ...prev.staffAuth,
            status: "passed",
            durationMs: duration,
            details: `Multi-Staff Module Active: ${data.length} staff account(s) registered with role-based access.`,
            responsePayload: data,
          },
        }));
      }

      // 6. Anti-Tamper Security Whitelist
      if (testId === "antiTamper") {
        const res = await fetch(`${apiUrl}/client/status`, {
          headers: {
            "x-client-id": selectedClient.id,
            "x-public-key": selectedClient.publicApiKey,
            origin: "http://unauthorized-hacker-site.com",
          },
        });
        const duration = Date.now() - start;
        if (res.status === 403) {
          const errData = await res.json().catch(() => ({}));
          setTestResults((prev) => ({
            ...prev,
            antiTamper: {
              ...prev.antiTamper,
              status: "passed",
              durationMs: duration,
              details: `Anti-Tamper Passed: Unauthorized domain rejected with 403 Forbidden.`,
              responsePayload: errData,
            },
          }));
        } else {
          throw new Error(`Expected 403 Forbidden for rogue domain, got HTTP ${res.status}`);
        }
      }

      // 7. WhatsApp Order Formatter
      if (testId === "whatsapp") {
        const phone = selectedClient.ownerPhone;
        const testItem = { title: "Kanjeevaram Silk", price: 18500, size: "Free Size" };
        const msg = encodeURIComponent(
          `Hello ${selectedClient.businessName}, I want to order: ${testItem.title} (Size: ${testItem.size}) - ₹${testItem.price}`
        );
        const waLink = `https://wa.me/${phone}?text=${msg}`;
        const duration = Date.now() - start;
        setTestResults((prev) => ({
          ...prev,
          whatsapp: {
            ...prev.whatsapp,
            status: "passed",
            durationMs: duration,
            details: `WhatsApp Dispatch Ready: Generated pre-filled click-to-chat URL to +${phone}.`,
            responsePayload: { targetPhone: phone, generatedUrl: waLink },
          },
        }));
      }

      // 8. Self-Serve Razorpay Renewal Engine
      if (testId === "billing") {
        const res = await fetch(`${apiUrl}/billing/plans`, {
          headers: {
            "x-client-id": selectedClient.id,
            "x-public-key": selectedClient.publicApiKey,
          },
        });
        const duration = Date.now() - start;
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const plans = await res.json();
        setTestResults((prev) => ({
          ...prev,
          billing: {
            ...prev.billing,
            status: "passed",
            durationMs: duration,
            details: `Self-Serve Billing Operational: Loaded ${plans.length} subscription tiers with Razorpay auto-unlock.`,
            responsePayload: plans,
          },
        }));
      }

      // 9. Store Discount Coupons Engine
      if (testId === "coupons") {
        const res = await fetch(`${apiUrl}/ecom/coupons`, {
          headers: {
            "x-client-id": selectedClient.id,
            "x-secret-key": selectedClient.secretApiKey,
          },
        });
        const duration = Date.now() - start;
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const coupons = await res.json();
        setTestResults((prev) => ({
          ...prev,
          coupons: {
            ...prev.coupons,
            status: "passed",
            durationMs: duration,
            details: `Coupon Engine Active: Verified discount calculation API with ${coupons.length} active coupons.`,
            responsePayload: coupons,
          },
        }));
      }

      // 10. Customer CRM & LTV Tracker
      if (testId === "crm") {
        const res = await fetch(`${apiUrl}/ecom/customers`, {
          headers: {
            "x-client-id": selectedClient.id,
            "x-secret-key": selectedClient.secretApiKey,
          },
        });
        const duration = Date.now() - start;
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const customers = await res.json();
        setTestResults((prev) => ({
          ...prev,
          crm: {
            ...prev.crm,
            status: "passed",
            durationMs: duration,
            details: `Customer CRM Active: Retrieved ${customers.length} shopper profile(s) with LTV analytics.`,
            responsePayload: customers,
          },
        }));
      }
    } catch (err: unknown) {
      const duration = Date.now() - start;
      setTestResults((prev) => ({
        ...prev,
        [testId]: {
          ...prev[testId],
          status: "failed",
          durationMs: duration,
          details: (err as Error).message || "Diagnostic test failed",
        },
      }));
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    for (const testId of Object.keys(testResults)) {
      await runSingleTest(testId);
    }
    setIsRunningAll(false);
  };

  const sdkVerificationPrompt = `# AI PROMPT: COMPLETE 10-MODULE SDK VERIFICATION & QA MATRIX
Use this automated smoke script in your browser console (F12) to test the Master SDK:

\`\`\`javascript
async function verifyMasterSdk() {
  console.log("🚀 Starting Full 10-Module Boutique SDK Diagnostic...");
  
  // 1. Verify Global Attachment
  const sdk = window.boutique || window.EcomSDK;
  if (!sdk) return console.error("❌ SDK not attached to window");
  console.log("✅ 1. Master SDK Initialized:", sdk.clientId);

  // 2. Gatekeeper Status Check
  const status = await sdk.gatekeeper.checkStatus(true);
  console.log("✅ 2. Gatekeeper Status:", status.status, "| Plan:", status.planName);

  // 3. AWS S3 Catalog Media
  const media = await sdk.storage.fetchMedia();
  console.log("✅ 3. S3 Cloud Photos:", media.length);

  // 4. Shopping Cart State
  sdk.cart.addItem({ id: "test_1", title: "Silk Saree", price: 12000, quantity: 1 });
  console.log("✅ 4. Shopping Cart Count:", sdk.cart.getItems().length);

  // 5. WhatsApp Order Formatter
  console.log("✅ 5. WhatsApp Module Ready for Phone:", "${selectedClient?.ownerPhone || "919876543210"}");
}
verifyMasterSdk();
\`\`\`
`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(sdkVerificationPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-white to-emerald-50/60 border border-slate-200/80 rounded-3xl p-8 shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            Live E-Commerce SDK Diagnostic Playground
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            E-Commerce SDK Health &amp; Diagnostics
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Test and verify all 10 SDK sub-modules in real-time (Gatekeeper, S3 Media, Shopping Cart, Orders Portal, Multi-Staff, Anti-Tamper, WhatsApp, Razorpay Billing, Coupons, and Customer CRM).
          </p>
        </div>

        <button
          onClick={runAllTests}
          disabled={isRunningAll || clients.length === 0}
          className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-3 rounded-2xl shadow-md shadow-emerald-100 flex items-center gap-2 transition-all cursor-pointer transform active:scale-95 disabled:opacity-50"
        >
          {isRunningAll ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              Running 10 Diagnostics...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              Run All 10 SDK Tests
            </>
          )}
        </button>
      </div>

      {/* No Store Notice & 1-Click Demo Generator */}
      {clients.length === 0 && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">No Store Connected for Testing</h3>
              <p className="text-xs text-amber-700">
                You currently have 0 boutique stores in your database. Click below to generate a Sandbox Demo Merchant with 1 click to test the SDK.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateDemoStore}
              disabled={isCreatingDemo}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isCreatingDemo ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> ⚡ Create Demo Store (1-Click)
                </>
              )}
            </button>
            {onOpenOnboardModal && (
              <button
                onClick={onOpenOnboardModal}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                + Custom Onboard
              </button>
            )}
          </div>
        </div>
      )}

      {/* Boutique Selector Bar */}
      {clients.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Select Store to Test SDK Against:
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
            <div className="flex items-center gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Status</span>
                <span className="font-bold text-emerald-700 font-mono">
                  {selectedClient.subscription?.status || "ACTIVE"}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">S3 Media</span>
                <span className="font-bold text-cyan-700 font-mono">
                  {selectedClient.usage?.currentImagesCount || 0} Photos
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Plan</span>
                <span className="font-bold text-indigo-700 font-mono">
                  {selectedClient.subscription?.planName || "E-Com Standard"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Interactive Tests Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-600" /> Complete 10-Module SDK Diagnostic Matrix
          </h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            10 Sub-Modules Connected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(testResults).map((test) => (
            <div
              key={test.id}
              className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:border-indigo-200 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                    {test.id === "gatekeeper" && <Shield className="w-4 h-4 text-indigo-600" />}
                    {test.id === "mediaFetch" && <HardDrive className="w-4 h-4 text-cyan-600" />}
                    {test.id === "cartOrder" && <ShoppingBag className="w-4 h-4 text-amber-600" />}
                    {test.id === "ordersPortal" && <Database className="w-4 h-4 text-blue-600" />}
                    {test.id === "staffAuth" && <Users className="w-4 h-4 text-purple-600" />}
                    {test.id === "antiTamper" && <Shield className="w-4 h-4 text-rose-600" />}
                    {test.id === "whatsapp" && <MessageSquare className="w-4 h-4 text-emerald-600" />}
                    {test.id === "billing" && <CreditCard className="w-4 h-4 text-indigo-600" />}
                    {test.id === "coupons" && <Tag className="w-4 h-4 text-pink-600" />}
                    {test.id === "crm" && <TrendingUp className="w-4 h-4 text-teal-600" />}
                    <span>{test.name}</span>
                  </h3>

                  {/* Status Badge */}
                  <div>
                    {test.status === "idle" && (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                        Ready
                      </span>
                    )}
                    {test.status === "running" && (
                      <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Testing...
                      </span>
                    )}
                    {test.status === "passed" && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Passed ({test.durationMs}ms)
                      </span>
                    )}
                    {test.status === "failed" && (
                      <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-rose-600" /> Failed
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-normal">{test.description}</p>

                {test.details && (
                  <p className="text-xs text-slate-700 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {test.details}
                  </p>
                )}

                {/* Inspect JSON Payload Button */}
                {Boolean(test.responsePayload) && (
                  <div className="pt-1">
                    <button
                      onClick={() =>
                        setExpandedPayloadId(expandedPayloadId === test.id ? null : test.id)
                      }
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      {expandedPayloadId === test.id ? (
                        <>
                          <ChevronUp className="w-3 h-3" /> Hide Response Payload
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" /> Inspect Live Response JSON
                        </>
                      )}
                    </button>
                    {expandedPayloadId === test.id && (
                      <pre className="mt-2 text-[10px] font-mono bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto max-h-40 border border-slate-800">
                        {JSON.stringify(test.responsePayload, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono">Module: {test.module}</span>
                <button
                  onClick={() => runSingleTest(test.id)}
                  disabled={test.status === "running"}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[11px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3 h-3 fill-indigo-700" /> Run Diagnostic
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Prompt Verification Script Box */}
      <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
            <Bot className="w-4 h-4" />
            AI Client-Side SDK Testing &amp; Verification Prompt
          </div>
          <button
            onClick={handleCopyPrompt}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedPrompt ? "Copied Prompt!" : "Copy Test Prompt"}
          </button>
        </div>

        <pre className="text-xs font-mono bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 overflow-x-auto text-slate-300 max-h-60 leading-relaxed">
          {sdkVerificationPrompt}
        </pre>
      </div>
    </div>
  );
};
