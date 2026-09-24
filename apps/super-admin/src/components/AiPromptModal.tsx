import React, { useState } from "react";
import { ClientData } from "../types";
import { Copy, Check, Sparkles, X, Bot, Code2 } from "lucide-react";

interface AiPromptModalProps {
  client: ClientData;
  onClose: () => void;
}

export const AiPromptModal: React.FC<AiPromptModalProps> = ({ client, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"steps" | "master">("steps");
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [format, setFormat] = useState<"react" | "html">("react");

  const rawMeta = import.meta;
  const envApiUrl =
    "env" in rawMeta &&
    rawMeta.env &&
    typeof rawMeta.env === "object" &&
    "VITE_API_URL" in rawMeta.env &&
    typeof rawMeta.env.VITE_API_URL === "string"
      ? rawMeta.env.VITE_API_URL
      : "http://localhost:5000";
  const sdkUrl = `${envApiUrl}/sdk/v1/boutique-sdk.min.js`;

  // Step 1 Prompt
  const step1Prompt = `# STEP 1 OF 5: ROOT SDK INITIALIZATION
Include the Master SDK in your static/React project's index.html <head>:

<script src="${sdkUrl}"></script>
<script>
  window.boutique = new BoutiqueSDK({
    clientId: "${client.id}",
    publicKey: "${client.publicApiKey}",
    apiUrl: "${envApiUrl}",
    whatsappNumber: "${client.ownerPhone}",
    debug: true
  });
</script>

Verification: In browser console (F12), window.boutique is initialized.`;

  // Step 2 Prompt
  const step2Prompt = `# STEP 2 OF 5: DYNAMIC S3 GALLERY & WHATSAPP ORDERS
1. Fetch dynamic collection from AWS S3:
   const dresses = await window.boutique.storage.fetchMedia();
2. Bind "Order on WhatsApp" button on dress cards:
   window.boutique.whatsapp.openChat(product);
   (Sends pre-filled dress details to +${client.ownerPhone})`;

  // Step 3 Prompt
  const step3Prompt = `# STEP 3 OF 5: STORE OWNER /admin PANEL
Mount the drop-in Admin Engine at route /admin:

const adminSDK = new window.BoutiqueSDK({
  clientId: "${client.id}",
  publicKey: "${client.publicApiKey}",
  secretKey: "${client.secretApiKey}",
  apiUrl: "${envApiUrl}",
  whatsappNumber: "${client.ownerPhone}"
});
adminSDK.admin.mount("#boutique-admin-mount");

Store Owner Login: Username: "${client.adminUsername || "admin"}" | Password: "${client.adminPassword || "StorePassword@123"}"
Subscription Limits: Dynamic real-time quotas via Central SDK Gatekeeper (Never hardcode static numbers in code)`;

  // Step 4 Prompt
  const step4Prompt = `# STEP 4 OF 5: GATEKEEPER BANNER & RAZORPAY RENEWAL
1. Self-serve renewal trigger:
   window.boutique?.billing.openRenewalModal();
2. Gatekeeper displays 3-day grace banner or full-screen lock on suspension.
3. Unlocks instantly upon payment.`;

  // Step 5 Prompt
  const step5Prompt = `# STEP 5 OF 5: SMOKE TEST SCRIPT (Run in F12 Console)
async function testBoutique() {
  console.log("1. SDK Init:", !!window.boutique);
  const s = await window.boutique.gatekeeper.checkStatus(true);
  console.log("2. Status:", s.status, "Plan:", s.planName);
  const m = await window.boutique.storage.fetchMedia();
  console.log("3. S3 Photos:", m.length);
}
testBoutique();`;

  // 1. REACT PROMPT
  const reactPrompt = `# ==============================================================================
# AI AGENT BUILDER SPECIFICATION: BOUTIQUE FASHION & BRIDAL STUDIO WEBSITE
# ==============================================================================

You are building a high-converting, luxury React (Vite + Tailwind CSS) boutique website for **"${client.businessName}"** (${client.ownerName}) in ${client.city || "Hyderabad"}.

### 🎯 BOUTIQUE STORE CONTEXT & SPECIALIZATION
- **Niche:** Bridal Couture, Designer Sarees, Lehengas, Festive Kurtis & Custom Stitching.
- **Location:** ${client.storeAddress || client.city || "Hyderabad"}
- **Social Proof:** Instagram: ${client.instagramHandle || "@boutiquestudio"}
- **Primary Sales Channel:** Instant "Order on WhatsApp / Custom Blouse Stitching" checkout.
- **Central Platform Engine:** Connected to the Central SaaS Hub via BoutiqueCore SDK.

---

### 📋 MANDATE 1: BOUTIQUE CREDENTIALS & PLAN CONTRACT
- **CLIENT ID:** "${client.id}"
- **PUBLIC KEY:** "${client.publicApiKey}"
- **SECRET KEY:** "${client.secretApiKey}" (For /admin route & photo uploads)
- **STORE OWNER /ADMIN LOGIN:** Username: "${client.adminUsername || "admin"}" | Password: "${client.adminPassword || "StorePassword@123"}"
- **DOMAIN:** "${client.primaryDomain}"
- **OWNER WHATSAPP:** "${client.ownerPhone}"
- **SUBSCRIPTION STATE:** Managed dynamically in real time by the Central SDK Gatekeeper (window.boutique.gatekeeper.checkStatus()). Never hardcode static limits.
- **CENTRAL API:** "${envApiUrl}"
- **SDK CDN SCRIPT:** "${sdkUrl}"
---

### 🛡️ MANDATE 2: ROOT SDK ATTACHMENT & GATEKEEPER SPEC
Include the Master SDK in \`index.html\` \`<head>\` tag:
\`\`\`html
<script src="${sdkUrl}"></script>
<script>
  window.boutique = new BoutiqueSDK({
    clientId: "${client.id}",
    publicKey: "${client.publicApiKey}",
    apiUrl: "${envApiUrl}",
    whatsappNumber: "${client.ownerPhone}",
    debug: true
  });
</script>
\`\`\`

---

### 👗 MANDATE 3: BOUTIQUE COLLECTION & WHATSAPP CHECKOUT
Create \`src/types/boutique.d.ts\`:
\`\`\`ts
export interface BoutiqueProduct {
  id: string;
  title?: string;
  price?: number;
  fileUrl: string;
  category: string;
}

declare global {
  interface Window {
    boutique?: {
      storage: { fetchMedia: () => Promise<BoutiqueProduct[]> };
      whatsapp: { openChat: (product: BoutiqueProduct, customPhone?: string) => void };
      gatekeeper: { checkStatus: (forceRefresh?: boolean) => Promise<any> };
      billing: { openRenewalModal: () => void };
    };
    BoutiqueSDK?: any;
  }
}
\`\`\`

Create \`src/components/Collection.tsx\`:
- Fetch dresses using \`window.boutique.storage.fetchMedia()\`.
- Render luxury boutique cards with high-res saree/lehenga photo, title, price in ₹.
- Attach click trigger to the *"Order on WhatsApp / Custom Stitching"* button:
  \`window.boutique.whatsapp.openChat(product)\`.
- Pre-filled WhatsApp message sent to ${client.ownerPhone}:
  \`\`\`text
  Hello ${client.businessName}!
  I would like to order/inquire about this dress:
  - Product: [Dress Title]
  - Price: Rs. [Price]
  - Image: [Image URL]
  Please share available sizes, fabric details & custom blouse stitching options.
  \`\`\`

---

### 📱 MANDATE 4: STORE OWNER /ADMIN PANEL (\`src/pages/Admin.tsx\`)
Mount the drop-in Admin SDK controller at route \`/admin\`:
\`\`\`tsx
import React, { useEffect, useRef } from "react";

export function AdminPage() {
  const adminMountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adminMountRef.current && window.BoutiqueSDK) {
      const adminSDK = new window.BoutiqueSDK({
        clientId: "${client.id}",
        publicKey: "${client.publicApiKey}",
        secretKey: "${client.secretApiKey}",
        apiUrl: "${envApiUrl}",
        whatsappNumber: "${client.ownerPhone}"
      });
      adminSDK.admin.mount(adminMountRef.current);
    }
  }, []);

  return <div ref={adminMountRef} className="min-h-screen bg-slate-50 py-8" />;
}
\`\`\`

---

### 🧪 MANDATE 5: PRE-HANDOVER QUALITY ASSURANCE CHECKLIST
- [ ] 1. Open website -> Loads in <1.5s with live boutique dresses.
- [ ] 2. Open \`/admin\` -> Verify dynamic photo and storage quota bar loaded directly from live SDK status.
- [ ] 3. Click *"Order on WhatsApp"* -> WhatsApp opens with pre-filled dress details sent to ${client.ownerPhone}.
- [ ] 4. In \`/admin\`, test Razorpay renewal modal -> Unlocks site instantly upon payment.
`;

  const htmlPrompt = `# ==============================================================================
# AI AGENT BUILDER SPECIFICATION: STATIC HTML BOUTIQUE WEBSITE
# ==============================================================================

Build a static website for "${client.businessName}" in ${client.city || "Hyderabad"}.

### 📋 BOUTIQUE CREDENTIALS & ENDPOINTS
- **CLIENT ID:** "${client.id}"
- **PUBLIC KEY:** "${client.publicApiKey}"
- **SECRET KEY:** "${client.secretApiKey}"
- **STORE OWNER /ADMIN LOGIN:** Username: "${client.adminUsername || "admin"}" | Password: "${client.adminPassword || "StorePassword@123"}"
- **OWNER WHATSAPP:** "${client.ownerPhone}"
- **LOCATION:** "${client.storeAddress || client.city || "Hyderabad"}"
- **SUBSCRIPTION STATE:** Dynamic real-time quotas loaded via SDK Gatekeeper (window.boutique.gatekeeper.checkStatus()). Never hardcode static numbers.
- **SDK SCRIPT:** "${sdkUrl}"
- **API ENDPOINT:** "${envApiUrl}"

### 🛡️ ROOT SDK ATTACHMENT IN index.html
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${client.businessName} - Boutique Collection</title>
  <script src="${sdkUrl}"></script>
  <script>
    window.boutique = new BoutiqueSDK({
      clientId: "${client.id}",
      publicKey: "${client.publicApiKey}",
      apiUrl: "${envApiUrl}",
      whatsappNumber: "${client.ownerPhone}"
    });
  </script>
</head>
<body>
  <!-- Dynamic Catalog Mount Point -->
  <div id="boutique-collection-grid"></div>

  <script>
    window.addEventListener("DOMContentLoaded", () => {
      window.boutique.gallery.mountGallery("#boutique-collection-grid", {
        columns: 3,
        enableWhatsAppOrder: true
      });
    });
  </script>
</body>
</html>
\`\`\`

---

### 📱 STORE OWNER /admin/index.html PANEL
\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>Admin - ${client.businessName}</title>
  <script src="${sdkUrl}"></script>
</head>
<body style="margin: 0; background: #f8fafc;">
  <div id="boutique-admin-mount"></div>
  <script>
    window.addEventListener("DOMContentLoaded", () => {
      const admin = new BoutiqueSDK({
        clientId: "${client.id}",
        publicKey: "${client.publicApiKey}",
        secretKey: "${client.secretApiKey}",
        apiUrl: "${envApiUrl}",
        whatsappNumber: "${client.ownerPhone}"
      });
      admin.admin.mount("#boutique-admin-mount");
    });
  </script>
</body>
</html>
\`\`\`
`;

  const activeStepPrompt =
    currentStep === 1
      ? step1Prompt
      : currentStep === 2
      ? step2Prompt
      : currentStep === 3
      ? step3Prompt
      : currentStep === 4
      ? step4Prompt
      : step5Prompt;

  const currentPrompt = mode === "steps" ? activeStepPrompt : format === "react" ? reactPrompt : htmlPrompt;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Boutique AI Builder Specification
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h2>
              <p className="text-xs text-slate-500">
                Client: <span className="text-slate-800 font-semibold">{client.businessName}</span> ({client.id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector */}
        {/* Mode Selector & Format Tabs */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-3 space-y-2">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
              <button
                onClick={() => setMode("steps")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === "steps" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🪜 Step-by-Step Prompts
              </button>
              <button
                onClick={() => setMode("master")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === "master" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📦 All-in-One Master
              </button>
            </div>

            {mode === "master" ? (
              <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl">
                <button
                  onClick={() => setFormat("react")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    format === "react" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ⚛️ React Vite
                </button>
                <button
                  onClick={() => setFormat("html")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    format === "html" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  📄 Plain HTML
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl flex-wrap">
                <button
                  onClick={() => setCurrentStep(1)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    currentStep === 1 ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  1. Init
                </button>
                <button
                  onClick={() => setCurrentStep(2)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    currentStep === 2 ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  2. Storefront
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    currentStep === 3 ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  3. /admin
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    currentStep === 4 ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  4. Billing
                </button>
                <button
                  onClick={() => setCurrentStep(5)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    currentStep === 5 ? "bg-emerald-600 text-white shadow-xs" : "text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  5. Smoke Test
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Code Content Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed select-all">
          <pre className="whitespace-pre-wrap">{currentPrompt}</pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Code2 className="w-4 h-4 text-indigo-600" />
            <span>Ready for Cursor / Windsurf / Claude / ChatGPT / OMP</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-200/70 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 flex items-center gap-2 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied Spec to Clipboard!" : `Copy ${format === "react" ? "React" : "HTML"} Boutique Specification`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
