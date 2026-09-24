import React, { useState } from "react";
import { ClientData } from "../types";
import { AlertTriangle, Trash2, X, Lock, Eye, EyeOff, ShieldAlert } from "lucide-react";

interface DeleteClientModalProps {
  client: ClientData;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (clientId: string, superAdminPassword: string) => Promise<void>;
  loading: boolean;
}

export const DeleteClientModal: React.FC<DeleteClientModalProps> = ({
  client,
  isOpen,
  onClose,
  onConfirmDelete,
  loading,
}) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter your Super Admin password to authorize deletion.");
      return;
    }
    setError(null);
    try {
      await onConfirmDelete(client.id, password);
      setPassword("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete client. Please verify password.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-rose-100 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-6 border-b border-rose-100 bg-rose-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Authorize Permanent Deletion</h2>
              <p className="text-xs text-rose-700 font-medium">Destructive &amp; Irreversible Action</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Target Store Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">{client.businessName}</span>
              <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                {client.id}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Domain: <span className="font-mono text-slate-700">{client.primaryDomain}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Owner: <span className="font-medium text-slate-700">{client.ownerName}</span> ({client.ownerPhone})
            </div>
          </div>

          {/* Warning Points */}
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-rose-900">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              What will be permanently deleted:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700 pl-1">
              <li>API Keys (<code className="font-mono">{client.publicApiKey.substring(0, 10)}...</code>)</li>
              <li>Database subscription &amp; quota records</li>
              <li>Connected website will be locked &amp; disconnected</li>
            </ul>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              Enter Super Admin Master Password to Confirm:
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Super Admin password..."
                autoFocus
                disabled={loading}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-100/80 border border-rose-300 text-rose-800 text-xs rounded-xl font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm shadow-rose-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{loading ? "Deleting..." : "Authorize & Delete"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
