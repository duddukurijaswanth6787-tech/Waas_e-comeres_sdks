import React, { useState } from "react";
import { SubscriptionPlan } from "../types";
import { api } from "../services/api";
import { X, Layers, IndianRupee, Image, HardDrive, CheckCircle2, ShoppingBag, Shield, Users, Bot, Tag, Database } from "lucide-react";

interface EditPlanModalProps {
  plan: SubscriptionPlan;
  onClose: () => void;
  onSuccess: (updatedPlan: SubscriptionPlan) => void;
}

export const EditPlanModal: React.FC<EditPlanModalProps> = ({ plan, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialStorageGb = Number((plan.maxStorageBytes / (1024 * 1024 * 1024)).toFixed(1));

  const [formData, setFormData] = useState({
    name: plan.name,
    priceInrMonthly: plan.priceInrMonthly,
    priceInrYearly: plan.priceInrYearly,
    maxImages: plan.maxImages,
    maxStorageGb: initialStorageGb,
    allowCustomDomain: plan.allowCustomDomain ?? true,
    allowOnlineCart: plan.allowOnlineCart ?? true,
    allowCustomerGateway: plan.allowCustomerGateway ?? true,
    allowOrdersPortal: plan.allowOrdersPortal ?? true,
    allowInventory: plan.allowInventory ?? true,
    allowVariants: plan.allowVariants ?? true,
    allowCustomersCrm: plan.allowCustomersCrm ?? true,
    allowCoupons: plan.allowCoupons ?? true,
    allowStaffAccounts: plan.allowStaffAccounts ?? 2,
    allowAiSalesBot: plan.allowAiSalesBot ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.updatePlan(plan.id, formData);
      onSuccess(res.plan);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to update subscription plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Edit E-Commerce Subscription Plan</h2>
              <p className="text-xs text-slate-500 font-mono">Plan ID: {plan.id}</p>
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

          {/* Plan Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Plan Title / Display Name
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                Monthly Price (INR)
              </label>
              <input
                required
                type="number"
                min="0"
                value={formData.priceInrMonthly}
                onChange={(e) => setFormData({ ...formData, priceInrMonthly: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                Yearly Price (INR)
              </label>
              <input
                required
                type="number"
                min="0"
                value={formData.priceInrYearly}
                onChange={(e) => setFormData({ ...formData, priceInrYearly: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold"
              />
            </div>
          </div>

          {/* Quotas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-indigo-600" />
                Max Photos Limit
              </label>
              <input
                required
                type="number"
                min="1"
                value={formData.maxImages}
                onChange={(e) => setFormData({ ...formData, maxImages: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-cyan-600" />
                Max Storage (GB)
              </label>
              <input
                required
                type="number"
                step="0.1"
                min="0.1"
                value={formData.maxStorageGb}
                onChange={(e) => setFormData({ ...formData, maxStorageGb: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                Staff Accounts
              </label>
              <input
                required
                type="number"
                min="1"
                value={formData.allowStaffAccounts}
                onChange={(e) => setFormData({ ...formData, allowStaffAccounts: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* E-Commerce Capabilities Matrix */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-800">E-Commerce Capabilities & Permissions</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-100/70">
                <input
                  type="checkbox"
                  checked={formData.allowOnlineCart}
                  onChange={(e) => setFormData({ ...formData, allowOnlineCart: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" /> Online Shopping Cart
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-100/70">
                <input
                  type="checkbox"
                  checked={formData.allowCustomerGateway}
                  onChange={(e) => setFormData({ ...formData, allowCustomerGateway: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Razorpay Checkout Gateway
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-100/70">
                <input
                  type="checkbox"
                  checked={formData.allowOrdersPortal}
                  onChange={(e) => setFormData({ ...formData, allowOrdersPortal: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-600" /> Orders Management Portal
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-100/70">
                <input
                  type="checkbox"
                  checked={formData.allowInventory}
                  onChange={(e) => setFormData({ ...formData, allowInventory: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-600" /> Inventory & Stock Counts
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-100/70">
                <input
                  type="checkbox"
                  checked={formData.allowVariants}
                  onChange={(e) => setFormData({ ...formData, allowVariants: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-600" /> Sizes & Color Variants
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-100/70">
                <input
                  type="checkbox"
                  checked={formData.allowCustomersCrm}
                  onChange={(e) => setFormData({ ...formData, allowCustomersCrm: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-600" /> Customers CRM
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-100/70">
                <input
                  type="checkbox"
                  checked={formData.allowCoupons}
                  onChange={(e) => setFormData({ ...formData, allowCoupons: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-rose-600" /> Discount Coupons Engine
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-100/70">
                <input
                  type="checkbox"
                  checked={formData.allowCustomDomain}
                  onChange={(e) => setFormData({ ...formData, allowCustomDomain: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" /> Custom Domain Whitelist
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-100/70 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={formData.allowAiSalesBot}
                  onChange={(e) => setFormData({ ...formData, allowAiSalesBot: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-purple-600" /> AI Sales Assistant Bot (Enterprise Only)
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 flex items-center gap-2 transition-all cursor-pointer"
            >
              {loading ? "Updating..." : <><CheckCircle2 className="w-4 h-4" /> Save Plan & Pricing</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
