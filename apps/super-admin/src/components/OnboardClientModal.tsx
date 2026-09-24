import React, { useState, useEffect } from "react";
import { SubscriptionPlan, ClientData } from "../types";
import { api } from "../services/api";
import {
  X,
  Building2,
  User,
  Phone,
  Globe,
  Layers,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Camera,
  ShoppingBag,
  Mail,
  Sparkles,
  Code2,
  FileText,
  UploadCloud,
  Archive,
  Trash2,
  Loader2,
  AlertCircle,
  Check
} from "lucide-react";

interface OnboardClientModalProps {
  onClose: () => void;
  onSuccess: (client: ClientData) => void;
}

export const OnboardClientModal: React.FC<OnboardClientModalProps> = ({ onClose, onSuccess }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    city: "Hyderabad",
    storeAddress: "",
    instagramHandle: "",
    websiteType: "ECOMMERCE" as const,
    primaryDomain: "localhost",
    allowedDomains: "localhost,127.0.0.1",
    planId: "plan_ecom_standard",
    environmentMode: "TESTING" as "TESTING" | "LIVE",
    billingCycle: "MONTHLY" as "MONTHLY" | "YEARLY",
    githubRepo: "",
    developerNotes: "",
    projectZipUrl: "",
    projectZipName: "",
  });

  const [zipFile, setZipFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  useEffect(() => {
    api.getPlans().then(setPlans).catch(console.error);
  }, []);

  // --- Real-time Field Validators ---
  const sanitizeDomain = (input: string): string => {
    let clean = input.trim().toLowerCase();
    clean = clean.replace(/^https?:\/\//, "");
    clean = clean.replace(/\/.*$/, "");
    clean = clean.replace(/\s+/g, "");
    return clean;
  };

  // WhatsApp 10-Digit Mobile Mandate
  const isPhoneValid = /^[6-9]\d{9}$/.test(formData.ownerPhone);
  const phoneErrorMessage = (): string | null => {
    if (!formData.ownerPhone) return "Mandatory: 10-digit Indian Mobile Number";
    if (formData.ownerPhone.length < 10) return `Must be 10 digits (currently ${formData.ownerPhone.length}/10)`;
    if (!/^[6-9]/.test(formData.ownerPhone)) return "Must start with 6, 7, 8, or 9";
    return null;
  };

  // Instagram Handle Mandate (Must have @ and valid characters)
  const isInstagramValid =
    !formData.instagramHandle ||
    /^@[a-zA-Z0-9._]{1,30}$/.test(formData.instagramHandle);

  // Email Format Mandate (Must be valid email format if provided)
  const isEmailValid =
    !formData.ownerEmail ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail);

  // Store Name & Owner Name Mandates (Min 2 chars)
  const isBusinessNameValid = formData.businessName.trim().length >= 2;
  const isOwnerNameValid = formData.ownerName.trim().length >= 2;

  // Domain Mandate
  const isDomainValid =
    formData.primaryDomain.trim().length >= 3 &&
    /^[a-zA-Z0-9.:-]+$/.test(formData.primaryDomain.trim());

  // Form Validity check
  const isFormValid =
    isBusinessNameValid &&
    isOwnerNameValid &&
    isPhoneValid &&
    isInstagramValid &&
    isEmailValid &&
    isDomainValid;

  // --- Input Handlers with Auto-Formatting ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, ""); // digits only
    const clean = raw.slice(0, 10); // max 10 digits
    setFormData({ ...formData, ownerPhone: clean });
  };

  const handleInstagramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim();
    if (val && !val.startsWith("@")) {
      val = `@${val}`;
    }
    setFormData({ ...formData, instagramHandle: val });
  };

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = sanitizeDomain(e.target.value);
    setFormData({
      ...formData,
      primaryDomain: clean,
      allowedDomains: clean === "localhost" || clean === "127.0.0.1"
        ? "localhost,127.0.0.1"
        : `localhost,127.0.0.1,${clean}`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError(null);

    const cleanDomain = sanitizeDomain(formData.primaryDomain);
    const formattedPhone = `91${formData.ownerPhone}`; // normalized with 91 prefix for backend

    try {
      let uploadedZipUrl = formData.projectZipUrl || null;
      let uploadedZipName = formData.projectZipName || null;

      if (zipFile) {
        setUploadProgress("Uploading project .zip to AWS S3...");
        const { uploadUrl, publicUrl } = await api.getProjectZipPresignedUrl(zipFile.name);
        await api.uploadFileToS3(uploadUrl, zipFile);
        uploadedZipUrl = publicUrl;
        uploadedZipName = zipFile.name;
      }

      setUploadProgress("Finalizing client onboarding...");
      const res = await api.createClient({
        ...formData,
        projectZipUrl: uploadedZipUrl,
        projectZipName: uploadedZipName,
        primaryDomain: cleanDomain,
        ownerPhone: formattedPhone,
        allowedDomains: `${formData.allowedDomains},${cleanDomain}`,
      });
      onSuccess(res.client);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to onboard client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Onboard New E-Commerce Merchant</h2>
              <p className="text-xs text-slate-500">Strict Field Mandates Enforced (10-Digit Mobile, @Instagram, Domain)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* 🌟 ENVIRONMENT MODE SELECTION (TESTING VS LIVE) */}
          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-2">
            <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Initial Subscription Environment Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                formData.environmentMode === "TESTING"
                  ? "bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                  : "bg-white/60 border-slate-200 hover:bg-white"
              }`}>
                <input
                  type="radio"
                  name="environmentMode"
                  checked={formData.environmentMode === "TESTING"}
                  onChange={() => setFormData({ ...formData, environmentMode: "TESTING" })}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">🟡 Testing Mode (Recommended)</div>
                  <div className="text-[10px] text-slate-500">Free testing with AI builder. Subscription clock frozen.</div>
                </div>
              </label>

              <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                formData.environmentMode === "LIVE"
                  ? "bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                  : "bg-white/60 border-slate-200 hover:bg-white"
              }`}>
                <input
                  type="radio"
                  name="environmentMode"
                  checked={formData.environmentMode === "LIVE"}
                  onChange={() => setFormData({ ...formData, environmentMode: "LIVE" })}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">🟢 Direct Live Mode</div>
                  <div className="text-[10px] text-slate-500">Requires first month payment to activate store admin.</div>
                </div>
              </label>
            </div>
          </div>

          {/* 1. Store Name & Owner Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  Boutique / Store Name *
                </span>
                {isBusinessNameValid ? (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Valid
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Min 2 chars</span>
                )}
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Sri Leela Bridal Sarees"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none transition-all ${
                  isBusinessNameValid ? "border-slate-200 focus:border-indigo-500" : "border-amber-300 bg-amber-50/20"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  Owner Name *
                </span>
                {isOwnerNameValid ? (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Valid
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Min 2 chars</span>
                )}
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Ananya Reddy"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none transition-all ${
                  isOwnerNameValid ? "border-slate-200 focus:border-indigo-500" : "border-amber-300 bg-amber-50/20"
                }`}
              />
            </div>
          </div>

          {/* 2. Contact Details (Phone & Email with strict mandates) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-600" />
                  Owner WhatsApp Number *
                </span>
                {isPhoneValid ? (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> 10 Digits
                  </span>
                ) : (
                  <span className="text-[10px] text-rose-500 font-medium">
                    {formData.ownerPhone.length}/10 Digits
                  </span>
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-mono font-bold text-slate-400">
                  +91
                </div>
                <input
                  required
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={formData.ownerPhone}
                  onChange={handlePhoneChange}
                  className={`w-full bg-slate-50 border rounded-xl pl-12 pr-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none font-mono tracking-wider transition-all ${
                    isPhoneValid
                      ? "border-emerald-400 ring-1 ring-emerald-400/20"
                      : formData.ownerPhone.length > 0
                      ? "border-rose-400 bg-rose-50/20"
                      : "border-slate-200"
                  }`}
                />
              </div>
              <p className={`text-[10px] mt-1 ${isPhoneValid ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                {phoneErrorMessage() || "✓ Valid Indian mobile number (e.g. 9876543210)"}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  Owner Email (Optional)
                </span>
                {formData.ownerEmail && (
                  isEmailValid ? (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Valid Email
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-500 font-medium">Invalid Email</span>
                  )
                )}
              </label>
              <input
                type="email"
                placeholder="e.g. ananya@gmail.com"
                value={formData.ownerEmail}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value.trim() })}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none transition-all ${
                  formData.ownerEmail && !isEmailValid
                    ? "border-rose-400 bg-rose-50/20"
                    : "border-slate-200 focus:border-indigo-500"
                }`}
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Must include @ and valid domain (e.g. @gmail.com or @boutique.com)
              </p>
            </div>
          </div>

          {/* 3. Location & Instagram (with @ mandate) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                Store Location / Area
              </label>
              <input
                type="text"
                placeholder="e.g. Jubilee Hills, Hyderabad"
                value={formData.storeAddress}
                onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-pink-600" />
                  Instagram Handle
                </span>
                {formData.instagramHandle && (
                  isInstagramValid ? (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Has @
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-500 font-medium">Must start with @</span>
                  )
                )}
              </label>
              <input
                type="text"
                placeholder="e.g. @srileelabridal"
                value={formData.instagramHandle}
                onChange={handleInstagramChange}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none transition-all ${
                  formData.instagramHandle && !isInstagramValid
                    ? "border-rose-400 bg-rose-50/20"
                    : "border-slate-200 focus:border-indigo-500"
                }`}
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Auto-formats with @ prefix (e.g. @srileelabridal)
              </p>
            </div>
          </div>

          {/* 4. Architecture & Primary Domain (with sanitization) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                Store Architecture Type
              </label>
              <div className="w-full bg-indigo-50/70 border border-indigo-200/80 rounded-xl px-4 py-2.5 text-xs text-indigo-950 font-bold flex items-center justify-between">
                <span>🛒 Full E-Commerce Platform (Cart + Gateway + Orders)</span>
                <span className="text-[10px] bg-indigo-600 text-white font-semibold px-2 py-0.5 rounded-full">E-Com Standard</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  Primary Domain *
                </span>
                {isDomainValid ? (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Valid Domain
                  </span>
                ) : (
                  <span className="text-[10px] text-rose-500 font-medium">Domain required</span>
                )}
              </label>
              <input
                required
                type="text"
                placeholder="e.g. srileelasarees.com or localhost"
                value={formData.primaryDomain}
                onChange={handleDomainChange}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none font-mono transition-all ${
                  isDomainValid
                    ? "border-slate-200 focus:border-indigo-500"
                    : "border-rose-400 bg-rose-50/20"
                }`}
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Auto-sanitizes (removes http://, https://, and trailing /)
              </p>
            </div>
          </div>

          {/* 5. Subscription Plan & Billing Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Subscription Plan Tier
              </label>
              <select
                value={formData.planId}
                onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer font-medium"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₹{p.priceInrMonthly}/mo - {p.maxImages} Photos)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Billing Frequency
              </label>
              <select
                value={formData.billingCycle}
                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as "MONTHLY" | "YEARLY" })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="MONTHLY">Monthly Billing Cycle (30 Days)</option>
                <option value="YEARLY">Annual Billing Cycle (365 Days)</option>
              </select>
            </div>
          </div>

          {/* 6. Whitelisted Origins */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Whitelisted Origins &amp; Subdomains (Anti-Theft Guard)
            </label>
            <input
              type="text"
              value={formData.allowedDomains}
              onChange={(e) => setFormData({ ...formData, allowedDomains: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono transition-all"
            />
          </div>

          {/* 7. Optional GitHub Repo & Developer Vault Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                GitHub Repository URL (Optional)
              </label>
              <input
                type="url"
                placeholder="e.g. https://github.com/agency/boutique-site"
                value={formData.githubRepo}
                onChange={(e) => setFormData({ ...formData, githubRepo: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Developer Vault / Private Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Vercel deployment, branch main"
                value={formData.developerNotes}
                onChange={(e) => setFormData({ ...formData, developerNotes: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* 8. Optional Project Source Code (.zip) */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5 text-indigo-600" />
                Project Source Code Archive (.zip) (Optional)
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Stored in AWS S3 Bucket</span>
            </label>

            {zipFile ? (
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-indigo-100 shadow-sm text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Archive className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-mono text-slate-800 font-medium truncate">{zipFile.name}</span>
                  <span className="text-[10px] text-slate-400">({(zipFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setZipFile(null)}
                  className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 cursor-pointer bg-white transition-all group">
                <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors mb-1" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                  Click to select .zip project archive
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">Accepts .zip files up to 100MB</span>
                <input
                  type="file"
                  accept=".zip,application/zip"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setZipFile(file);
                  }}
                />
              </label>
            )}
          </div>

          {uploadProgress && (
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 font-medium flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>{uploadProgress}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              {!isFormValid && (
                <span className="text-amber-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Please fix highlighted field mandates
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className={`px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                  isFormValid && !loading
                    ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                    : "bg-slate-300 shadow-none cursor-not-allowed opacity-60"
                }`}
              >
                {loading ? "Creating..." : <><CheckCircle2 className="w-4 h-4" /> Onboard &amp; Generate Keys</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
