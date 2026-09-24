import React, { useState } from "react";
import { ClientData } from "../types";
import { MessageSquare, Send, Copy, Check, Sparkles, Building2, Layers, ShieldCheck, AlertTriangle, CreditCard, Clock } from "lucide-react";

interface WhatsAppTemplatesViewProps {
  clients: ClientData[];
}

interface TemplateOption {
  id: string;
  title: string;
  category: "renewal" | "grace" | "suspension" | "onboarding" | "plan_change" | "payment_success";
  description: string;
  icon: typeof MessageSquare;
  badgeColor: string;
  generateText: (client: ClientData, customNotes?: string) => string;
}

export const WhatsAppTemplatesView: React.FC<WhatsAppTemplatesViewProps> = ({ clients }) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || "");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("renewal_reminder");
  const [customNote, setCustomNote] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const templates: TemplateOption[] = [
    {
      id: "renewal_reminder",
      title: "1. 📅 Subscription Renewal Due (T-5 Days)",
      category: "renewal",
      description: "Friendly reminder sent 5 days before the monthly billing cycle ends.",
      icon: Clock,
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      generateText: (c, note) => {
        const plan = c.subscription?.planName || "Starter Plan";
        const price = c.subscription?.priceInrMonthly || 799;
        const dueDate = c.subscription?.currentPeriodEnd 
          ? new Date(c.subscription.currentPeriodEnd).toLocaleDateString("en-IN")
          : "in 5 days";
        return `Hello ${c.ownerName || c.businessName} 🙏,

Greetings from Boutique Platform (Hyderabad)! 🌸

This is a gentle reminder that your monthly website & cloud hosting subscription for *"${c.businessName}"* is due for renewal on *${dueDate}*.

📋 *Subscription Summary:*
• Store: *${c.businessName}*
• Active Plan: *${plan}*
• Monthly Amount: *₹${price} / month*
• Website Domain: *https://${c.primaryDomain}*

To avoid any interruption in your online customer WhatsApp orders and S3 cloud photo gallery, please renew your subscription by logging into your store console at:
👉 *https://${c.primaryDomain}/#/admin*

${note ? `\n💬 *Note from Agency:* ${note}\n` : ""}
Thank you for growing your boutique with us! ✨
_Boutique Platform Technical Support_`;
      },
    },
    {
      id: "grace_warning",
      title: "2. ⚠️ Grace Period Active (Urgent 2 Days Left)",
      category: "grace",
      description: "Urgent notice when renewal date has passed and 3-day grace period is running.",
      icon: AlertTriangle,
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      generateText: (c, note) => {
        const price = c.subscription?.priceInrMonthly || 799;
        return `⚠️ *URGENT: Subscription Grace Period Active* ⚠️

Dear ${c.ownerName || c.businessName},

The monthly renewal for *"${c.businessName}"* was due recently and your store is currently in the *3-Day Grace Period*.

Your website is currently active, but it will be automatically locked by the system in *48 hours* if payment is not completed.

💳 *Amount Due:* ₹${price}
🌐 *Website:* https://${c.primaryDomain}

Please complete your payment immediately using UPI / Card in your store admin portal:
👉 *https://${c.primaryDomain}/#/admin*

${note ? `\n📌 *Special Note:* ${note}\n` : ""}
If you have already paid or need assistance, please reply to this message directly.`;
      },
    },
    {
      id: "suspension_notice",
      title: "3. 🔴 Account Suspended (Instant Unlock Link)",
      category: "suspension",
      description: "Sent after suspension to provide 1-click Razorpay renewal and auto-unlock instructions.",
      icon: ShieldCheck,
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      generateText: (c, note) => {
        const price = c.subscription?.priceInrMonthly || 799;
        return `🔴 *WEBSITE TEMPORARILY SUSPENDED* 🔴

Dear ${c.ownerName || c.businessName},

Your boutique website *"${c.businessName}"* (https://${c.primaryDomain}) has been temporarily suspended due to pending subscription renewal.

*How to Reactivate Your Website Instantly:*
1. Open your website: *https://${c.primaryDomain}*
2. Click the *'Pay Renewal & Unlock Instantly'* button.
3. Complete the ₹${price} payment via UPI (GPay / PhonePe / Paytm / Card).
4. Your website, S3 cloud saree gallery, and WhatsApp ordering will *unlock automatically in 3 seconds*!

${note ? `\n💬 *Agency Message:* ${note}\n` : ""}
We are ready to assist you anytime.`;
      },
    },
    {
      id: "onboarding_welcome",
      title: "4. 🎉 New Boutique Client Welcome & Keys",
      category: "onboarding",
      description: "Sent when onboarding a new store with their admin credentials and website link.",
      icon: Sparkles,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      generateText: (c, note) => {
        return `🎉 *Welcome to Boutique Platform!* 👗✨

Dear ${c.ownerName || c.businessName},

Congratulations! Your luxury digital boutique website for *"${c.businessName}"* is ready and registered.

🌐 *Live Website:* https://${c.primaryDomain}
📱 *WhatsApp Ordering:* Connected to +${c.ownerPhone}

🔑 *Store Owner Admin Console:*
• URL: *https://${c.primaryDomain}/#/admin*
• Username: \`${c.adminUsername || "admin"}\`
• Default Password: \`${c.adminPassword || "StorePassword@123"}\`

You can log into your admin portal to upload your latest bridal sarees, lehengas, and manage customer catalogs in real-time.

${note ? `\n📌 *Special Note:* ${note}\n` : ""}
We are excited to help you scale your boutique orders! 🚀`;
      },
    },
    {
      id: "plan_upgrade",
      title: "5. 🚀 Plan Upgrade & Quota Expansion Offer",
      category: "plan_change",
      description: "Offer to upgrade store photo limits from Starter to Growth (100 Photos) or Pro.",
      icon: Layers,
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      generateText: (c, note) => {
        return `Hello ${c.ownerName || c.businessName} 🌸,

We noticed your boutique collection for *"${c.businessName}"* is growing quickly! 👗

Would you like to upgrade your boutique store to our *Growth Studio Plan*?

✨ *Growth Plan Benefits:*
• 📸 Up to *100 High-Res Saree Photos* (S3 Cloud)
• 🛍️ Priority WhatsApp 1-Click Ordering
• ⚡ 5 GB Ultra-Fast S3 Cloud Media Storage

Upgrade directly from your store dashboard or reply to this message to upgrade for *₹1,499 / month*.

${note ? `\n💬 *Note:* ${note}\n` : ""}`;
      },
    },
    {
      id: "payment_receipt",
      title: "6. 🧾 Payment Received & 30-Day Extension Confirmation",
      category: "payment_success",
      description: "Sent right after client completes monthly renewal via Razorpay/UPI.",
      icon: CreditCard,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      generateText: (c, note) => {
        const price = c.subscription?.priceInrMonthly || 799;
        const validTill = c.subscription?.currentPeriodEnd
          ? new Date(c.subscription.currentPeriodEnd).toLocaleDateString("en-IN")
          : "30 days from today";
        return `✅ *PAYMENT CONFIRMATION & SUBSCRIPTION ACTIVE*

Dear ${c.ownerName || c.businessName},

We have received your monthly subscription payment of *₹${price}* for *"${c.businessName}"*.

🧾 *Receipt Details:*
• Store: *${c.businessName}*
• Status: *🟢 ACTIVE & LIVE*
• Valid Till: *${validTill}*
• Website: *https://${c.primaryDomain}*

Your S3 cloud photos, WhatsApp ordering engine, and admin console are fully operational.

${note ? `\n💬 *Agency Note:* ${note}\n` : ""}
Thank you for your business! 🙏`;
      },
    },
  ];

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const renderedMessage = selectedClient
    ? activeTemplate.generateText(selectedClient, customNote)
    : "Please select a client to generate message.";

  const handleCopy = () => {
    navigator.clipboard.writeText(renderedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!selectedClient?.ownerPhone) return;
    const cleanPhone = selectedClient.ownerPhone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(renderedMessage)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50/80 via-white to-indigo-50/60 border border-slate-200/80 rounded-3xl p-8 shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            Client WhatsApp Automation &amp; Notification Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            WhatsApp Template Engine &amp; Direct Dispatcher
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Select any client store and notification template (Renewal T-5, Grace Warning, Suspension Lock, Welcome Credentials, or Plan Upgrade). Variable tags auto-populate dynamically!
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs px-4 py-3 rounded-2xl shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copied ? "Copied Message!" : "Copy Text"}</span>
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-3 rounded-2xl shadow-md shadow-emerald-200 flex items-center gap-2 transition-all cursor-pointer transform active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Send on WhatsApp &rarr;</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Selectors & Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Client Selector & Template List (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Client Selector */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              1. Select Target Boutique Client:
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.businessName} ({c.ownerPhone}) • {c.subscription?.status || "ACTIVE"}
                </option>
              ))}
            </select>

            {selectedClient && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Owner:</span>
                  <strong className="text-slate-900">{selectedClient.ownerName}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phone (WhatsApp):</span>
                  <strong className="text-emerald-700 font-mono">+{selectedClient.ownerPhone}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Primary Domain:</span>
                  <span className="font-mono text-[11px] text-slate-700">{selectedClient.primaryDomain}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Plan &amp; Status:</span>
                  <span>
                    <strong className="text-slate-900">{selectedClient.subscription?.planName}</strong> •{" "}
                    <span className="font-bold text-indigo-600">{selectedClient.subscription?.status}</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Template Choice List */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              2. Choose Notification Template:
            </label>

            <div className="space-y-2">
              {templates.map((tpl) => {
                const Icon = tpl.icon;
                const isSelected = tpl.id === selectedTemplateId;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                        : "bg-slate-50/70 border-slate-200/70 hover:bg-slate-100/70"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate">{tpl.title}</div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{tpl.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Custom Variables & Live WhatsApp Chat Bubble Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Custom Message Add-on */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3 text-xs">
            <label className="block font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Optional Custom Note / Agency Add-on (Appends to template):
            </label>
            <input
              type="text"
              placeholder="e.g. As discussed over call, 10% renewal discount applied if paid today."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Live WhatsApp Chat Bubble UI */}
          <div className="bg-emerald-950/10 border border-emerald-200/60 rounded-3xl p-6 shadow-sm space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-900/10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-emerald-950">Live WhatsApp Chat Preview</span>
                <span className="text-[10px] text-emerald-800 font-mono bg-emerald-100 px-2 py-0.5 rounded-full">
                  To: +{selectedClient?.ownerPhone || "91..."}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Rendered with dynamic client variables</span>
            </div>

            {/* WhatsApp Green Bubble */}
            <div className="bg-[#d9fdd3] text-slate-900 p-5 rounded-2xl shadow-sm border border-emerald-300/40 text-xs font-sans whitespace-pre-wrap leading-relaxed select-all">
              {renderedMessage}
              <div className="text-[10px] text-slate-500 text-right mt-3 flex items-center justify-end gap-1">
                <span>Just now</span>
                <span className="text-emerald-700 font-bold">✓✓</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Full Message"}</span>
              </button>

              <button
                onClick={handleSendWhatsApp}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-200 transition-all cursor-pointer transform active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Open in WhatsApp &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
