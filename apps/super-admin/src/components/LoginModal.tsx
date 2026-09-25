import React, { useState } from "react";
import { api, getCustomApiUrl, setCustomApiUrl } from "../services/api";
import { Shield, Lock, Mail, ArrowRight, Sparkles, Server, Check } from "lucide-react";

interface LoginModalProps {
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState("admin@boutiqueplatform.com");
  const [password, setPassword] = useState("AdminPassword@123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [apiUrl, setApiUrl] = useState(getCustomApiUrl());
  const [savedUrlMsg, setSavedUrlMsg] = useState(false);

  const handleSaveApiUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomApiUrl(apiUrl);
    setSavedUrlMsg(true);
    setTimeout(() => setSavedUrlMsg(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Invalid admin email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
            <Shield className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/60 rounded-full text-amber-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Agency Master Portal
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Super Admin Login</h1>
          <p className="text-xs text-slate-500">Sign in to manage boutique clients, subscriptions & AI prompts</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium leading-relaxed">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-600" /> Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-600" /> Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
          >
            {loading ? "Authenticating..." : <><ArrowRight className="w-4 h-4" /> Sign In to Dashboard</>}
          </button>
        </form>

        {/* Backend API URL Settings Toggle */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Default seed: <strong className="text-slate-700 font-mono">admin@boutiqueplatform.com</strong></span>
            <button
              type="button"
              onClick={() => setShowApiConfig(!showApiConfig)}
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Server className="w-3 h-3" /> {showApiConfig ? "Hide API Config" : "API Server URL"}
            </button>
          </div>

          {showApiConfig && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <label className="block font-semibold text-slate-700">Railway / Cloud Backend URL:</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://your-service.up.railway.app"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleSaveApiUrl}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 cursor-pointer"
                >
                  {savedUrlMsg ? <><Check className="w-3 h-3 text-emerald-400" /> Saved</> : "Set URL"}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Current connected backend: <code className="text-slate-600">{apiUrl}</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
