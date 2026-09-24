import React, { useState } from "react";
import { ClientData } from "../types";
import { CheckCircle2, Copy, Check, Bot, Globe, Key, MessageSquare } from "lucide-react";

interface OnboardSuccessModalProps {
  client: ClientData;
  onClose: () => void;
  onOpenPrompt: (client: ClientData) => void;
}

export const OnboardSuccessModal: React.FC<OnboardSuccessModalProps> = ({ client, onClose, onOpenPrompt }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleSendCredentialsWhatsApp = () => {
    const cleanPhone = client.ownerPhone.replace(/[^0-9]/g, "");
    const msg = `🎉 *Welcome to your new Boutique Website, ${client.ownerName}!*

Your boutique store *${client.businessName}* is successfully registered.

🌐 *Public Website:* https://${client.primaryDomain}
⚙️ *Store Admin Login:* https://${client.primaryDomain}/admin
👤 *Admin Username:* ${client.adminUsername || "admin"}
🔒 *Admin Password:* ${client.adminPassword || "StorePassword@123"}
📦 *Plan:* ${client.subscription?.planName || "Starter Plan"}

You can now log into your store admin to upload your bridal collection sarees and manage dress prices!`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Boutique Store Onboarded!</h2>
          <p className="text-xs text-slate-500">
            Store <span className="font-semibold text-slate-800">{client.businessName}</span> has been registered and keys generated.
          </p>
        </div>

        {/* Credentials Box */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
          {/* Store Admin Username & Password */}
          <div className="grid grid-cols-2 gap-3 p-2.5 bg-white rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Store Username</span>
              <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">{client.adminUsername || "admin"}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Store Password</span>
              <span className="font-mono font-bold text-indigo-600 text-xs mt-0.5 block">{client.adminPassword || "StorePassword@123"}</span>
            </div>
          </div>

          {/* ClientID */}
          <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Key className="w-3 h-3 text-indigo-500" /> CLIENT ID
              </div>
              <div className="font-mono font-bold text-indigo-600 mt-0.5 text-xs">{client.id}</div>
            </div>
            <button
              onClick={() => copyText(client.id, "clientid")}
              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 cursor-pointer"
              title="Copy ClientID"
            >
              {copiedKey === "clientid" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Public Key */}
          <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80">
            <div className="truncate pr-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Globe className="w-3 h-3 text-indigo-500" /> PUBLIC API KEY
              </div>
              <div className="font-mono text-slate-700 truncate mt-0.5 text-xs">{client.publicApiKey}</div>
            </div>
            <button
              onClick={() => copyText(client.publicApiKey, "pubkey")}
              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 shrink-0 cursor-pointer"
              title="Copy Public Key"
            >
              {copiedKey === "pubkey" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 1-Click WhatsApp Handover Button */}
        <button
          onClick={handleSendCredentialsWhatsApp}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-100 transition-all"
        >
          <MessageSquare className="w-4 h-4" /> Send Login Credentials to Owner on WhatsApp
        </button>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => onOpenPrompt(client)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-100 transition-all"
          >
            <Bot className="w-4 h-4" /> Copy AI Mandate Prompt
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
