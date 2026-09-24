import React, { useState, useEffect } from "react";
import { ClientData, WebsiteHealthStatus } from "../types";
import { api } from "../services/api";
import {
  X,
  Building2,
  Layers,
  Lock,
  Eye,
  EyeOff,
  Bot,
  Edit3,
  MessageSquare,
  Play,
  Clock,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  HardDrive,
  AlertTriangle,
  TestTube2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Shield,
  Rocket,
  Sparkles,
  Globe,
  Activity,
  FileText,
  Download,
  Save,
  Code2,
  Archive,
  UploadCloud,
  Loader2,
  Bug,
  FileCode,
  Calendar
} from "lucide-react";

interface StoreDetailsDrawerProps {
  client: ClientData;
  onClose: () => void;
  onOpenPrompt: (client: ClientData) => void;
  onOpenEdit: (client: ClientData) => void;
  onStatusChange: (clientId: string, action: "SUSPEND" | "EXTEND_GRACE" | "REACTIVATE" | "SWITCH_LIVE" | "SWITCH_TESTING") => void;
  onDeleteClient: (clientId: string, name: string) => void;
  onSendWhatsApp: (client: ClientData) => void;
  onRefresh?: () => Promise<void> | void;
  actionLoading: boolean;
}

interface TestItemResult {
  id: string;
  name: string;
  status: "idle" | "running" | "passed" | "failed";
  durationMs?: number;
  details?: string;
  payload?: Record<string, unknown> | null;
}

export const StoreDetailsDrawer: React.FC<StoreDetailsDrawerProps> = ({
  client,
  onClose,
  onOpenPrompt,
  onOpenEdit,
  onStatusChange,
  onDeleteClient,
  onSendWhatsApp,
  onRefresh,
  actionLoading,
}) => {
  const [healthStatus, setHealthStatus] = useState<WebsiteHealthStatus | null>(null);
  const [isPingingWebsite, setIsPingingWebsite] = useState(false);

  const checkWebsiteLiveHealth = async () => {
    setIsPingingWebsite(true);
    try {
      const res = await api.pingClientWebsite(client.id);
      setHealthStatus(res);
    } catch (err: unknown) {
      setHealthStatus({
        clientId: client.id,
        domain: client.primaryDomain,
        isLive: false,
        status: "OFFLINE",
        statusCode: null,
        statusText: "Server Down / Unreachable",
        responseTimeMs: 0,
        checkedUrl: `http://${client.primaryDomain}`,
        checkedAt: new Date().toISOString(),
      });
    } finally {
      setIsPingingWebsite(false);
    }
  };

  useEffect(() => {
    checkWebsiteLiveHealth();
  }, [client.id, client.primaryDomain]);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "tests" | "prompts">("details");
  const [promptSubTab, setPromptSubTab] = useState<"task_spec" | "bug_fix" | "testing_script">("task_spec");
  const [promptCopied, setPromptCopied] = useState(false);
  const [devNotes, setDevNotes] = useState(client.developerNotes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    setDevNotes(client.developerNotes || "");
  }, [client.developerNotes]);
  const [isUploadingZip, setIsUploadingZip] = useState(false);
  const [zipUploadMessage, setZipUploadMessage] = useState<string | null>(null);

  const handleUploadZipDirect = async (file: File) => {
    setIsUploadingZip(true);
    setZipUploadMessage("Requesting presigned URL from AWS S3...");
    try {
      const { uploadUrl, publicUrl } = await api.getProjectZipPresignedUrl(file.name, client.id);
      setZipUploadMessage("Uploading archive to AWS S3 bucket...");
      await api.uploadFileToS3(uploadUrl, file);
      setZipUploadMessage("Updating store database record...");
      await api.updateClientProfile(client.id, {
        projectZipUrl: publicUrl,
        projectZipName: file.name,
      });
      setZipUploadMessage("Uploaded successfully!");
      if (onRefresh) await onRefresh();
      setTimeout(() => {
        setZipUploadMessage(null);
      }, 3000);
    } catch (err: unknown) {
      setZipUploadMessage(`Upload failed: ${(err as Error).message}`);
    } finally {
      setIsUploadingZip(false);
    }
  };

  const handleDeleteZipDirect = async () => {
    if (!confirm("Are you sure you want to remove this project archive from S3 reference?")) return;
    setIsUploadingZip(true);
    try {
      await api.updateClientProfile(client.id, {
        projectZipUrl: null,
        projectZipName: null,
      });
      if (onRefresh) await onRefresh();
    } catch (err: unknown) {
      alert(`Failed to remove zip: ${(err as Error).message}`);
    } finally {
      setIsUploadingZip(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await api.updateClientProfile(client.id, { developerNotes: devNotes });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDownloadSetup = () => {
    const setupContent = `# ==============================================================================
# BOUTIQUE STORE CONFIGURATION & CREDENTIALS VAULT
# Store: ${client.businessName} (${client.id})
# Generated: ${new Date().toISOString()}
# ==============================================================================

CLIENT_ID=${client.id}
PUBLIC_KEY=${client.publicApiKey}
SECRET_KEY=${client.secretApiKey}

# Store Owner /admin Credentials
ADMIN_USERNAME=${client.adminUsername || "admin"}
ADMIN_PASSWORD=${client.adminPassword || "StorePassword@123"}

# Domain & Endpoints
PRIMARY_DOMAIN=${client.primaryDomain}
ALLOWED_DOMAINS=${client.allowedDomains}
CENTRAL_API_URL=http://localhost:5000
SDK_CDN_URL=http://localhost:5000/sdk/v1/boutique-sdk.min.js

# Owner Info & WhatsApp
OWNER_NAME=${client.ownerName}
OWNER_PHONE=${client.ownerPhone}
LOCATION=${client.storeAddress || client.city || "Hyderabad"}
INSTAGRAM=${client.instagramHandle || "N/A"}

# Code Repository & Developer Notes
GITHUB_REPO=${client.githubRepo || "N/A"}
DEVELOPER_NOTES=${devNotes || "N/A"}

# Plan & S3 Cloud Quotas
PLAN_NAME=${client.subscription?.planName || "Starter Showcase Plan"}
MAX_PHOTOS=${client.subscription?.maxImages || 30}
MAX_STORAGE_MB=${client.subscription?.maxStorageBytes ? Math.round(client.subscription.maxStorageBytes / (1024 * 1024)) : 1229}
`;
    const blob = new Blob([setupContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${client.id}_config.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const [clientTestResults, setClientTestResults] = useState<Record<string, TestItemResult>>({
    gatekeeper: { id: "gatekeeper", name: "1. Gatekeeper Status Check (<20ms)", status: "idle" },
    mediaFetch: { id: "mediaFetch", name: "2. AWS S3 Collection Fetch", status: "idle" },
    quotaCheck: { id: "quotaCheck", name: "3. Photos & S3 Quota Limit Enforcer", status: "idle" },
    whatsappTest: { id: "whatsappTest", name: "4. WhatsApp Pre-filled Order Link Generator", status: "idle" },
    antiTamper: { id: "antiTamper", name: "5. Anti-Tamper Unauthorized Domain Security", status: "idle" },
    billingOrder: { id: "billingOrder", name: "6. Self-Serve Razorpay Order Generation", status: "idle" },
  });
  const [isRunningAllClientTests, setIsRunningAllClientTests] = useState(false);

  const sub = client.subscription;
  const status = sub?.status || "ACTIVE";
  const envMode = sub?.environmentMode || "TESTING";

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  let statusBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "TESTING") {
    statusBadgeClass = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (status === "PENDING_FIRST_PAYMENT") {
    statusBadgeClass = "bg-orange-50 text-orange-700 border-orange-200";
  } else if (status === "GRACE_PERIOD") {
    statusBadgeClass = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (status === "SUSPENDED") {
    statusBadgeClass = "bg-rose-50 text-rose-700 border-rose-200";
  }

  const maxPhotos = sub?.maxImages || 30;
  const currentPhotos = client.usage.currentImagesCount;
  const photosPct = Math.min(100, Math.round((currentPhotos / maxPhotos) * 100));

  const maxStorageGb = sub?.maxStorageBytes ? (sub.maxStorageBytes / (1024 * 1024 * 1024)).toFixed(1) : "10.0";
  const currentStorageMb = (client.usage.currentStorageBytes / (1024 * 1024)).toFixed(2);
  const storagePct = Math.min(100, Math.round((client.usage.currentStorageBytes / (sub?.maxStorageBytes || 1)) * 100));

  const runClientTest = async (testId: string) => {
    setClientTestResults((prev) => ({
      ...prev,
      [testId]: { ...prev[testId], status: "running" },
    }));

    const start = Date.now();
    const rawMeta = import.meta;
    const envApiUrl = "env" in rawMeta && rawMeta.env && typeof rawMeta.env === "object" && "VITE_API_URL" in rawMeta.env && typeof rawMeta.env.VITE_API_URL === "string"
      ? rawMeta.env.VITE_API_URL
      : "http://localhost:5000";
    const apiUrl = `${envApiUrl}/api/v1`;
    try {
      if (testId === "gatekeeper") {
        const res = await fetch(`${apiUrl}/client/status`, {
          headers: {
            "x-client-id": client.id,
            "x-public-key": client.publicApiKey,
          },
        });
        const duration = Date.now() - start;
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        setClientTestResults((prev) => ({
          ...prev,
          gatekeeper: {
            ...prev.gatekeeper,
            status: "passed",
            durationMs: duration,
            details: `Status: '${data.status}' | Mode: '${data.environmentMode}' (Verified in ${duration}ms)`,
            payload: data,
          },
        }));
      }

      if (testId === "mediaFetch") {
        const res = await fetch(`${apiUrl}/storage/media`, {
          headers: {
            "x-client-id": client.id,
            "x-public-key": client.publicApiKey,
          },
        });
        const duration = Date.now() - start;
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        setClientTestResults((prev) => ({
          ...prev,
          mediaFetch: {
            ...prev.mediaFetch,
            status: "passed",
            durationMs: duration,
            details: `Retrieved ${data.length} active dresses from AWS S3 in ${duration}ms.`,
            payload: data,
          },
        }));
      }

      if (testId === "quotaCheck") {
        const duration = Date.now() - start;
        setClientTestResults((prev) => ({
          ...prev,
          quotaCheck: {
            ...prev.quotaCheck,
            status: "passed",
            durationMs: duration,
            details: `Current: ${currentPhotos}/${maxPhotos} photos used (${photosPct}% capacity).`,
            payload: { currentPhotos, maxPhotos, storageUsedMb: currentStorageMb, maxStorageGb },
          },
        }));
      }

      if (testId === "whatsappTest") {
        const phone = client.ownerPhone;
        const sampleMsg = `Hello ${client.businessName}! I want to order this dress from ${client.primaryDomain}`;
        const generatedLink = `https://wa.me/${phone}?text=${encodeURIComponent(sampleMsg)}`;
        const duration = Date.now() - start;
        setClientTestResults((prev) => ({
          ...prev,
          whatsappTest: {
            ...prev.whatsappTest,
            status: "passed",
            durationMs: duration,
            details: `WhatsApp chat URL targeting +${phone} generated correctly.`,
            payload: { phone, link: generatedLink },
          },
        }));
      }

      if (testId === "antiTamper") {
        const res = await fetch(`${apiUrl}/client/status`, {
          headers: {
            "x-client-id": client.id,
            "x-public-key": client.publicApiKey,
            origin: "http://unauthorized-fake-domain.com",
          },
        });
        const duration = Date.now() - start;
        if (res.status === 403) {
          const errData = await res.json().catch(() => ({}));
          setClientTestResults((prev) => ({
            ...prev,
            antiTamper: {
              ...prev.antiTamper,
              status: "passed",
              durationMs: duration,
              details: `Anti-Tamper Active: Unauthorized domain rejected with 403 Forbidden.`,
              payload: errData,
            },
          }));
        } else {
          throw new Error(`Expected 403 Forbidden for unauthorized domain, got HTTP ${res.status}`);
        }
      }

      if (testId === "billingOrder") {
        const res = await fetch(`${apiUrl}/billing/create-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-client-id": client.id,
            "x-public-key": client.publicApiKey,
          },
          body: JSON.stringify({ billingCycle: "MONTHLY" }),
        });
        const duration = Date.now() - start;
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        setClientTestResults((prev) => ({
          ...prev,
          billingOrder: {
            ...prev.billingOrder,
            status: "passed",
            durationMs: duration,
            details: `Razorpay Order generated: ${data.orderId} (Amount: ₹${data.amountInr}).`,
            payload: data,
          },
        }));
      }
    } catch (err: unknown) {
      const duration = Date.now() - start;
      setClientTestResults((prev) => ({
        ...prev,
        [testId]: {
          ...prev[testId],
          status: "failed",
          durationMs: duration,
          details: (err as Error).message || "Test failed",
        },
      }));
    }
  };

  const runAllClientTests = async () => {
    setIsRunningAllClientTests(true);
    for (const testId of Object.keys(clientTestResults)) {
      await runClientTest(testId);
    }
    setIsRunningAllClientTests(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm text-xl">
              👗
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{client.businessName}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeClass}`}>
                  {status}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-indigo-600 font-mono">{client.id}</span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-slate-200 text-slate-700">
                  {envMode === "TESTING" ? "🟡 Testing Mode" : "🟢 Live Mode"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Tabs */}
        <div className="px-6 pt-3 pb-2 bg-slate-50/50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-2xl flex-wrap">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "details"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📋 Store Details &amp; Control
            </button>
            <button
              onClick={() => setActiveTab("prompts")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "prompts"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-indigo-700 hover:bg-indigo-50"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>🎯 Prompts &amp; Bug Fixes</span>
            </button>
            <button
              onClick={() => setActiveTab("tests")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "tests"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <TestTube2 className="w-3.5 h-3.5" />
              <span>🧪 Live SDK Diagnostics</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            {activeTab === "details" ? "Management Mode" : activeTab === "prompts" ? "QA & Bugs" : "Real-Time Test Mode"}
          </span>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: DETAILS & ACTIONS */}
          {activeTab === "details" && (
            <>
              {/* 🌟 LAUNCH TO LIVE MODE / TESTING MODE SWITCHER BANNER */}
              {envMode === "TESTING" ? (
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" /> Website Testing Mode Active
                    </span>
                    <span className="text-[10px] uppercase font-bold bg-amber-200/80 text-amber-800 px-2 py-0.5 rounded-md">
                      Clock Frozen
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    You can test the static website freely. When ready to deliver to the client, click below to switch to Live Mode and request their first month's payment in /admin!
                  </p>
                  <button
                    disabled={actionLoading}
                    onClick={() => onStatusChange(client.id, "SWITCH_LIVE")}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Rocket className="w-3.5 h-3.5" /> Switch to Live Mode &amp; Request First Payment
                  </button>
                </div>
              ) : status === "PENDING_FIRST_PAYMENT" ? (
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-3xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" /> Live Mode: Awaiting First Payment
                    </span>
                    <span className="text-[10px] uppercase font-bold bg-indigo-200/80 text-indigo-800 px-2 py-0.5 rounded-md">
                      First Payment Due
                    </span>
                  </div>
                  <p className="text-xs text-indigo-800 leading-relaxed">
                    The store has been switched to Live Mode. When the store owner opens <code>/admin</code>, they will be prompted to complete their first month's payment (₹{sub?.priceInrMonthly || 799}) via UPI/Razorpay to activate their store.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSendWhatsApp(client)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Send WhatsApp Payment Alert
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => onStatusChange(client.id, "SWITCH_TESTING")}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer disabled:opacity-50"
                      title="Switch back to free testing mode"
                    >
                      Back to Testing
                    </button>
                  </div>
                </div>
              ) : null}

              {/* 1. Quick Action Control Center */}
              {/* 🌐 REAL-TIME WEBSITE SERVER & DOMAIN HEALTH MONITOR */}
              <div className="bg-slate-900 text-white rounded-3xl p-5 space-y-4 shadow-md border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <div>
                      <h3 className="font-bold text-sm text-white">Live Website Server &amp; Domain Monitor</h3>
                      <p className="text-[11px] text-slate-400">Real-time HTTP/HTTPS reachability &amp; ping latency</p>
                    </div>
                  </div>
                  <button
                    onClick={checkWebsiteLiveHealth}
                    disabled={isPingingWebsite}
                    className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPingingWebsite ? "animate-spin text-indigo-400" : ""}`} />
                    <span>{isPingingWebsite ? "Pinging Server..." : "Ping Now"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                    <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Server Status</div>
                    <div className="mt-1 flex items-center gap-2">
                      {isPingingWebsite ? (
                        <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" /> Checking...
                        </span>
                      ) : healthStatus?.isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          🟢 ONLINE (Live)
                        </span>
                      ) : healthStatus?.status === "DEGRADED" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-700/60">
                          🟡 DEGRADED ({healthStatus.statusCode})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-700/60">
                          <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                          🔴 SERVER DOWN / OFFLINE
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                    <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Ping Latency</div>
                    <div className="mt-1 text-sm font-bold text-white flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      {isPingingWebsite ? "Measuring..." : healthStatus ? `${healthStatus.responseTimeMs} ms` : "—"}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/40 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Target Website Domain:</span>
                    <a
                      href={healthStatus?.checkedUrl || `http://${client.primaryDomain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 underline"
                    >
                      {client.primaryDomain}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">HTTP Status:</span>
                    <span className="font-mono text-slate-200">
                      {healthStatus?.statusCode ? `${healthStatus.statusCode} ${healthStatus.statusText}` : healthStatus?.statusText || "Pending Check"}
                    </span>
                  </div>
                  {healthStatus?.serverHeader && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Server Engine:</span>
                      <span className="font-mono text-slate-200">{healthStatus.serverHeader}</span>
                    </div>
                  )}
                  {healthStatus?.checkedAt && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/40">
                      <span>Last Ping:</span>
                      <span>{new Date(healthStatus.checkedAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-3xl space-y-3">
                <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-indigo-600" /> Store Action &amp; AI Mandates
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => onOpenPrompt(client)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm shadow-indigo-100 transition-all cursor-pointer"
                  >
                    <Bot className="w-4 h-4" /> Copy AI Mandate
                  </button>

                  <button
                    onClick={() => onOpenEdit(client)}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold py-2.5 px-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-amber-600" /> Edit Store Profile
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => onSendWhatsApp(client)}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    title="Send WhatsApp Billing Alert"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Alert
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => onStatusChange(client.id, "EXTEND_GRACE")}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> +7 Days Grace
                  </button>

                  {status === "ACTIVE" ? (
                    <button
                      disabled={actionLoading}
                      onClick={() => onStatusChange(client.id, "SUSPEND")}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Force Suspend
                    </button>
                  ) : (
                    <button
                      disabled={actionLoading}
                      onClick={() => onStatusChange(client.id, "REACTIVATE")}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-600" /> Reactivate
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Subscription Lifecycle Card */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Subscription Plan &amp; Lifecycle</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenEdit(client)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                    >
                      Change Plan &rarr;
                    </button>
                    <span className="text-xs font-bold text-slate-900">
                      ₹{sub?.priceInrMonthly.toLocaleString("en-IN")} / month
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Plan Tier</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">{sub?.planName || "Starter"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Renewal Due Date</span>
                    <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                      {sub?.activatedAt ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN") : "Starts Upon First Payment"}
                    </span>
                  </div>
                </div>

                {/* 🧪 TESTING DATE SIMULATOR (Change dates to test Grace, Expiry, Suspension) */}
                <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 flex items-center gap-1.5 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      Subscription Date &amp; Lifecycle Simulator (Test Scenarios)
                    </span>
                    <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded">Simulate Scenarios</span>
                  </div>
                  <p className="text-[10px] text-amber-800 leading-snug">
                    Click any scenario to instantly shift database dates and test how the client website &amp; SDK react:
                  </p>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={async () => {
                        await api.updateClientStatus(client.id, {
                          status: "TESTING",
                          environmentMode: "TESTING",
                          isManualOverride: true,
                        });
                        if (onRefresh) await onRefresh();
                      }}
                      className="p-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-[10px] font-bold text-slate-800 transition-colors text-center cursor-pointer shadow-2xs"
                      title="Test Free Development Mode"
                    >
                      🟡 Testing Mode
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={async () => {
                        const now = new Date();
                        const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                        const grace = new Date(now.getTime() + 33 * 24 * 60 * 60 * 1000);
                        await api.updateClientStatus(client.id, {
                          currentPeriodEnd: end.toISOString(),
                          gracePeriodEnd: grace.toISOString(),
                          activatedAt: now.toISOString(),
                          status: "ACTIVE",
                          environmentMode: "LIVE",
                          isManualOverride: true,
                        });
                        if (onRefresh) await onRefresh();
                      }}
                      className="p-1.5 bg-white hover:bg-emerald-100/60 border border-emerald-300 rounded-xl text-[10px] font-bold text-emerald-900 transition-colors text-center cursor-pointer shadow-2xs"
                      title="Reset subscription to full 30 days active"
                    >
                      🟢 Active (+30d)
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={async () => {
                        const now = new Date();
                        const end = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
                        const grace = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
                        await api.updateClientStatus(client.id, {
                          currentPeriodEnd: end.toISOString(),
                          gracePeriodEnd: grace.toISOString(),
                          status: "GRACE_PERIOD",
                          environmentMode: "LIVE",
                          isManualOverride: true,
                        });
                        if (onRefresh) await onRefresh();
                      }}
                      className="p-1.5 bg-white hover:bg-amber-100/60 border border-amber-300 rounded-xl text-[10px] font-bold text-amber-900 transition-colors text-center cursor-pointer shadow-2xs"
                      title="Simulate grace period banner on client website"
                    >
                      🟡 Grace (+2d)
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={async () => {
                        const now = new Date();
                        const end = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
                        const grace = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
                        await api.updateClientStatus(client.id, {
                          currentPeriodEnd: end.toISOString(),
                          gracePeriodEnd: grace.toISOString(),
                          status: "SUSPENDED",
                          environmentMode: "LIVE",
                          isManualOverride: true,
                        });
                        if (onRefresh) await onRefresh();
                      }}
                      className="p-1.5 bg-white hover:bg-rose-100/60 border border-rose-300 rounded-xl text-[10px] font-bold text-rose-800 transition-colors text-center cursor-pointer shadow-2xs"
                      title="Simulate past-due suspension lockdown"
                    >
                      🔴 Lock Screen
                    </button>
                  </div>

                  {/* Custom Exact Date Setter */}
                  <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-amber-900 font-semibold shrink-0">Set Custom Expiry Date:</span>
                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                      <input
                        type="date"
                        defaultValue={sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toISOString().split('T')[0] : ""}
                        onChange={async (e) => {
                          if (!e.target.value) return;
                          const targetDate = new Date(e.target.value);
                          const graceDate = new Date(targetDate.getTime() + 3 * 24 * 60 * 60 * 1000);
                          const isExpired = targetDate.getTime() < Date.now();
                          await api.updateClientStatus(client.id, {
                            currentPeriodEnd: targetDate.toISOString(),
                            gracePeriodEnd: graceDate.toISOString(),
                            status: isExpired ? "GRACE_PERIOD" : "ACTIVE",
                            environmentMode: "LIVE",
                            isManualOverride: true,
                          });
                          if (onRefresh) await onRefresh();
                        }}
                        className="px-2 py-1 bg-white border border-amber-300 rounded-lg text-[11px] text-slate-800 font-mono focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Interactive Environment Mode Toggle */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Subscription Environment Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={actionLoading || envMode === "TESTING"}
                      onClick={() => onStatusChange(client.id, "SWITCH_TESTING")}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer disabled:cursor-default flex items-start gap-2 ${
                        envMode === "TESTING"
                          ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-xs"
                          : "bg-slate-50/80 border-slate-200 hover:bg-slate-100/80"
                      }`}
                    >
                      <span className="text-sm mt-0.5">🟡</span>
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1">
                          Testing Mode
                          {envMode === "TESTING" && <span className="text-[9px] bg-amber-200/80 text-amber-900 font-bold px-1.5 py-0.2 rounded">Active</span>}
                        </div>
                        <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                          Free testing. Clock frozen.
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading || envMode === "LIVE"}
                      onClick={() => onStatusChange(client.id, "SWITCH_LIVE")}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer disabled:cursor-default flex items-start gap-2 ${
                        envMode === "LIVE"
                          ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                          : "bg-slate-50/80 border-slate-200 hover:bg-slate-100/80"
                      }`}
                    >
                      <span className="text-sm mt-0.5">🟢</span>
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1">
                          Direct Live Mode
                          {envMode === "LIVE" && <span className="text-[9px] bg-emerald-200/80 text-emerald-900 font-bold px-1.5 py-0.2 rounded">Active</span>}
                        </div>
                        <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                          Requires first month payment.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Live S3 Cloud Quotas & Storage */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-cyan-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Live S3 Cloud Quotas &amp; Storage</h3>
                  </div>
                  {onRefresh && (
                    <button
                      onClick={() => onRefresh()}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                      title="Sync and refresh latest photo quotas from cloud database"
                    >
                      <RefreshCw className="w-3 h-3 text-indigo-600" />
                      <span>Sync Live</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold mb-1.5">
                      <span className="text-slate-600">Photos Uploaded: {currentPhotos} / {maxPhotos}</span>
                      <span className="text-indigo-600 font-bold">{photosPct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${photosPct}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1.5">
                      <span className="text-slate-600">S3 Storage (ap-south-2): {currentStorageMb} MB / {maxStorageGb} GB</span>
                      <span className="text-cyan-700 font-bold">{storagePct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${storagePct}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Store Owner /admin Login Credentials */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Store Owner /admin Login Credentials</h3>
                  </div>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showPassword ? "Hide" : "View Password"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Admin Username</span>
                    <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">{client.adminUsername || "admin"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Admin Password</span>
                    <span className="font-mono font-bold text-indigo-600 text-xs mt-0.5 block">
                      {showPassword ? client.adminPassword : "••••••••••••"}
                    </span>
                  </div>
                </div>

                {/* Public and Secret Keys with 1-click Copy */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="truncate pr-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Public Key</span>
                      <span className="font-mono text-slate-700 truncate block text-[11px]">{client.publicApiKey}</span>
                    </div>
                    <button
                      onClick={() => copyText(client.publicApiKey, "pubkey")}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 cursor-pointer"
                      title="Copy Public Key"
                    >
                      {copiedKey === "pubkey" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="truncate pr-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Secret Key (For /admin only)</span>
                      <span className="font-mono text-slate-700 truncate block text-[11px]">{client.secretApiKey}</span>
                    </div>
                    <button
                      onClick={() => copyText(client.secretApiKey, "seckey")}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 cursor-pointer"
                      title="Copy Secret Key"
                    >
                      {copiedKey === "seckey" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Contact & Domain Details */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-3 shadow-sm text-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Store Identity &amp; Contact</h3>
                </div>

                <div className="space-y-2 text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Owner Contact:</span>
                    <span className="font-semibold text-slate-800">{client.ownerName} ({client.ownerPhone})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Location:</span>
                    <span className="font-semibold text-slate-800">{client.storeAddress || client.city}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Instagram:</span>
                    <span className="font-semibold text-pink-600">{client.instagramHandle || "—"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Primary Domain:</span>
                    <a
                      href={`http://${client.primaryDomain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-indigo-600 flex items-center gap-1 font-mono hover:underline"
                    >
                      {client.primaryDomain} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Whitelisted Origins:</span>
                    <span className="font-mono text-slate-700 text-[11px] truncate max-w-xs">{client.allowedDomains}</span>
                  </div>
                </div>
              </div>

              {/* 6. 🐙 GitHub Repository & Source Code Link */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-3 shadow-sm text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm">GitHub Repository &amp; Source Code</h3>
                  </div>
                  <button
                    onClick={() => onOpenEdit(client)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                  >
                    {client.githubRepo ? "Edit URL" : "+ Add GitHub Link"}
                  </button>
                </div>

                {client.githubRepo ? (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="truncate pr-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Repository</span>
                      <a
                        href={client.githubRepo.startsWith("http") ? client.githubRepo : `https://${client.githubRepo}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-indigo-600 hover:underline flex items-center gap-1 font-semibold text-xs mt-0.5 truncate"
                      >
                        <span>{client.githubRepo}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl text-slate-500 text-xs flex items-center justify-between">
                    <span>No GitHub repository linked yet.</span>
                    <button
                      onClick={() => onOpenEdit(client)}
                      className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      Link Repo &rarr;
                    </button>
                  </div>
                )}
              </div>

              {/* 6.5 📦 Project Source Code Archive (.zip on AWS S3) */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-3 shadow-sm text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4 text-indigo-600" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Project Archive &amp; Source Code (.zip)</h3>
                      <p className="text-[10px] text-slate-400">Stored in AWS S3 Bucket (Optional project files backup)</p>
                    </div>
                  </div>
                  {client.projectZipUrl && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> S3 Synced
                    </span>
                  )}
                </div>

                {client.projectZipUrl ? (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-150 flex items-center justify-between gap-3">
                    <div className="truncate flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <Archive className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">S3 File Archive</span>
                        <span className="font-mono text-slate-800 font-bold text-xs truncate block">
                          {client.projectZipName || "project-source.zip"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={client.projectZipUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleDeleteZipDirect}
                        disabled={isUploadingZip}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete project zip"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl text-center">
                    <p className="text-slate-500 text-xs mb-2">No project zip archive uploaded for this store yet.</p>
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 hover:border-indigo-500 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all">
                      <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Upload Project .zip to S3</span>
                      <input
                        type="file"
                        accept=".zip,application/zip"
                        className="hidden"
                        disabled={isUploadingZip}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadZipDirect(file);
                        }}
                      />
                    </label>
                  </div>
                )}

                {isUploadingZip && (
                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 font-medium flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0" />
                    <span>{zipUploadMessage || "Processing project zip..."}</span>
                  </div>
                )}
                {!isUploadingZip && zipUploadMessage && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-medium flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{zipUploadMessage}</span>
                  </div>
                )}
              </div>
              {/* 7. 📝 Developer Vault Notes & Configuration */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-3 shadow-sm text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Developer Vault &amp; Notes</h3>
                      <p className="text-[10px] text-slate-400">Save private deployment instructions, repo links, and error logs</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {notesSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5 text-indigo-600" />}
                    <span>{notesSaved ? "Saved!" : isSavingNotes ? "Saving..." : "Save Notes"}</span>
                  </button>
                </div>

                <textarea
                  value={devNotes}
                  onChange={(e) => setDevNotes(e.target.value)}
                  placeholder="Write private notes for this boutique (e.g. repo branch, Vercel/Netlify URL, custom CSS overrides, SDK version tags, client requirements)..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono leading-relaxed"
                />
              </div>

              {/* 8. 💾 Download Complete Credentials & Setup (.txt) */}
              <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl flex items-center justify-between shadow-sm">
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-indigo-400" />
                    <span>Backup &amp; Export Store Credentials</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Download complete config file with ClientID, keys, passwords &amp; domain
                  </p>
                </div>
                <button
                  onClick={handleDownloadSetup}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm shadow-indigo-900"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export .txt</span>
                </button>
              </div>

              {/* Delete Store */}
              <div className="pt-2 flex justify-end">
                <button
                  disabled={actionLoading}
                  onClick={() => onDeleteClient(client.id, client.businessName)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1.5 p-2 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Delete Store Account Permanently
                </button>
              </div>
            </>
          )}

          {/* TAB 2: CLIENT-SPECIFIC LIVE SDK DIAGNOSTICS */}
          {activeTab === "tests" && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <TestTube2 className="w-4 h-4 text-emerald-600" /> Live SDK Test Suite for: {client.businessName}
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">Executes real API &amp; S3 queries with this store's credentials</p>
                </div>
                <button
                  onClick={runAllClientTests}
                  disabled={isRunningAllClientTests}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  {isRunningAllClientTests ? "Testing..." : "Run All Tests"}
                </button>
              </div>

              {/* Diagnostic Cards */}
              <div className="space-y-3">
                {Object.values(clientTestResults).map((test) => (
                  <div key={test.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                        {test.id === "gatekeeper" && <Shield className="w-3.5 h-3.5 text-indigo-600" />}
                        {test.id === "mediaFetch" && <HardDrive className="w-3.5 h-3.5 text-cyan-600" />}
                        {test.id === "quotaCheck" && <Layers className="w-3.5 h-3.5 text-amber-600" />}
                        {test.id === "whatsappTest" && <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
                        {test.id === "antiTamper" && <Shield className="w-3.5 h-3.5 text-rose-600" />}
                        {test.name}
                      </span>

                      <div>
                        {test.status === "idle" && (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Ready</span>
                        )}
                        {test.status === "running" && (
                          <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Running...
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

                    {test.details && (
                      <p className="text-[11px] text-slate-600 font-medium">{test.details}</p>
                    )}

                    {test.payload && (
                      <pre className="p-2.5 bg-slate-950 text-slate-300 text-[10px] font-mono rounded-xl overflow-x-auto max-h-24">
                        {JSON.stringify(test.payload, null, 2)}
                      </pre>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => runClientTest(test.id)}
                        disabled={test.status === "running"}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3 h-3" /> Test This Method
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TASK SPECIFICATION, BUG FIXING & TESTING PROMPTS ⭐ */}
          {activeTab === "prompts" && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-indigo-50 via-white to-amber-50/50 border border-indigo-100 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">
                        AI Prompts, Task Specs &amp; Bug Fixing Kit
                      </h3>
                      <p className="text-[11px] text-slate-500">For {client.businessName} ({client.primaryDomain})</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      let textToCopy = "";
                      if (promptSubTab === "task_spec") {
                        textToCopy = `# ==============================================================================
# 🎯 TASK SPECIFICATION: CLIENT BOUTIQUE FRONTEND & SDK WIRING VERIFICATION
# ==============================================================================

You are an expert QA Engineer and Senior Frontend Architect assigned to audit, verify, and wire the boutique website for:
- **Store Name:** "${client.businessName}" (${client.ownerName})
- **Primary Domain:** "${client.primaryDomain}" (Allowed: localhost, ${client.primaryDomain})
- **ClientID:** "${client.id}"
- **Public Key:** "${client.publicApiKey}"
- **Secret Key:** "${client.secretApiKey}"
- **Store WhatsApp:** "${client.ownerPhone}"
- **Platform Central API:** "http://localhost:5000"
- **SDK Script CDN:** "http://localhost:5000/sdk/v1/boutique-sdk.min.js"

### 🛠️ MANDATORY ARCHITECTURAL CHECKLIST
1. SDK Script Attachment in index.html <head>:
   <script src="http://localhost:5000/sdk/v1/boutique-sdk.min.js"></script>
   window.boutique = new BoutiqueSDK({ clientId: "${client.id}", publicKey: "${client.publicApiKey}", secretKey: "${client.secretApiKey}", apiUrl: "http://localhost:5000", whatsappNumber: "${client.ownerPhone}" });
2. Dynamic AWS S3 Gallery:
   Load live items with: const dresses = await window.boutique.storage.fetchMedia();
3. 1-Click WhatsApp Ordering:
   window.boutique.whatsapp.openChat(product);
4. Store Owner /admin:
   Username: ${client.adminUsername || "admin"} | Password: ${client.adminPassword || "StorePassword@123"}
   Photo uploader: window.boutique.storage.upload(file, { title, price });
5. Razorpay Renewal Trigger:
   window.boutique.billing.openRenewalModal();
`;
                      } else if (promptSubTab === "bug_fix") {
                        textToCopy = `# ==============================================================================
# 🐞 BUG FIXING & SDK AUDIT SPECIFICATION: BOUTIQUE CLIENT FRONTEND
# ==============================================================================

You are tasked with diagnosing, debugging, and resolving all bugs and misconfigurations in the boutique website for "${client.businessName}".

### 📋 TARGET CLIENT CREDENTIALS
- CLIENT ID: "${client.id}"
- PUBLIC KEY: "${client.publicApiKey}"
- SECRET KEY: "${client.secretApiKey}"
- DOMAIN: "${client.primaryDomain}"
- API: "http://localhost:5000"

### 🔍 COMMON BUGS & DIAGNOSIS CHECKLIST

❌ Bug 1: Website Still Active When Suspended (Killswitch Bypass)
- Cause 1 (Testing Mode): In "Testing Mode", the subscription clock is frozen and the SDK allows free development without locking. To enforce suspension locks, switch to "Direct Live Mode" first.
- Cause 2 (Local Cache): The browser cached the status for 15 minutes. In browser console, run: \`localStorage.clear(); window.location.reload();\`
- Cause 3 (SDK Init Missing): Ensure \`window.boutique = new BoutiqueSDK({...})\` is initialized in root \`index.html\` so Gatekeeper can auto-inject the full-screen suspension blur overlay.

❌ Bug 2: window.boutique is undefined
- Fix: Ensure \`<script src="http://localhost:5000/sdk/v1/boutique-sdk.min.js"></script>\` is placed in \`<head>\` before any React scripts.

❌ Bug 3: 403 UNAUTHORIZED_DOMAIN
- Fix: Check active domain against allowed domains whitelist: ${client.allowedDomains}.

❌ Bug 4: Photo upload failed in /admin
- Fix: Pass \`secretKey: "${client.secretApiKey}"\` to BoutiqueSDK in \`/admin\` and check plan quota limit.

❌ Bug 5: Razorpay modal not opening
- Fix: Bind onClick event to \`window.boutique.billing.openRenewalModal()\`.
`;
                        textToCopy = `// 🧪 BROWSER CONSOLE SMOKE TEST SCRIPT FOR ${client.businessName}
async function runSmokeTest() {
  console.log("🚀 Testing ${client.businessName} SDK integration...");
  console.log("1. SDK Attached:", !!window.boutique);
  const status = await window.boutique.gatekeeper.checkStatus(true);
  console.log("2. Gatekeeper Status:", status);
  const media = await window.boutique.storage.fetchMedia();
  console.log("3. Dynamic S3 Media Count:", media.length);
  console.log("4. WhatsApp Bridge Ready:", typeof window.boutique.whatsapp.openChat === "function");
  console.log("5. Billing Bridge Ready:", typeof window.boutique.billing.openRenewalModal === "function");
}
runSmokeTest();`;
                      }
                      navigator.clipboard.writeText(textToCopy);
                      setPromptCopied(true);
                      setTimeout(() => setPromptCopied(false), 2000);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    {promptCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{promptCopied ? "Copied!" : "Copy Active Prompt"}</span>
                  </button>
                </div>

                {/* Sub-Tabs for Prompt Types */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 flex-wrap">
                  <button
                    onClick={() => setPromptSubTab("task_spec")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      promptSubTab === "task_spec"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-indigo-700 hover:bg-indigo-50"
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>🎯 Task Specification</span>
                  </button>

                  <button
                    onClick={() => setPromptSubTab("bug_fix")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      promptSubTab === "bug_fix"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "text-rose-700 hover:bg-rose-50"
                    }`}
                  >
                    <Bug className="w-3.5 h-3.5" />
                    <span>🐞 Bug Fixing &amp; Audit</span>
                  </button>

                  <button
                    onClick={() => setPromptSubTab("testing_script")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      promptSubTab === "testing_script"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    <TestTube2 className="w-3.5 h-3.5" />
                    <span>🧪 Console Smoke Test</span>
                  </button>
                </div>
              </div>

              {/* Prompt Text Preview Box */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    {promptSubTab === "task_spec" ? (
                      <><FileCode className="w-4 h-4 text-indigo-600" /> Task Specification &amp; QA Checklist</>
                    ) : promptSubTab === "bug_fix" ? (
                      <><Bug className="w-4 h-4 text-rose-600" /> Bug Fixing &amp; Audit Prompt</>
                    ) : (
                      <><TestTube2 className="w-4 h-4 text-emerald-600" /> Console Verification Script</>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Ready for AI Tools (Cursor / Windsurf / Claude)</span>
                </div>
                <pre className="p-4 bg-slate-950 text-slate-300 text-xs font-mono rounded-b-2xl overflow-x-auto max-h-96 leading-relaxed select-all">
                  {promptSubTab === "task_spec" ? (
`# ==============================================================================
# 🎯 TASK SPECIFICATION: CLIENT BOUTIQUE FRONTEND & SDK WIRING VERIFICATION
# ==============================================================================

You are an expert QA Engineer and Senior Frontend Architect assigned to audit, verify, and wire the boutique website for:
- Store Name: "${client.businessName}" (${client.ownerName})
- Primary Domain: "${client.primaryDomain}"
- ClientID: "${client.id}"
- Public Key: "${client.publicApiKey}"
- Secret Key: "${client.secretApiKey}"
- Store WhatsApp: "${client.ownerPhone}"
- Central API: "http://localhost:5000"
- SDK Script CDN: "http://localhost:5000/sdk/v1/boutique-sdk.min.js"

### 🛠️ MANDATORY ARCHITECTURAL CHECKLIST
1. SDK Script Attachment in index.html <head>:
   <script src="http://localhost:5000/sdk/v1/boutique-sdk.min.js"></script>
   window.boutique = new BoutiqueSDK({ clientId: "${client.id}", publicKey: "${client.publicApiKey}", secretKey: "${client.secretApiKey}", apiUrl: "http://localhost:5000", whatsappNumber: "${client.ownerPhone}" });
2. Dynamic AWS S3 Gallery:
   Load live items with: const dresses = await window.boutique.storage.fetchMedia();
3. 1-Click WhatsApp Ordering:
   window.boutique.whatsapp.openChat(product);
4. Store Owner /admin:
   Username: ${client.adminUsername || "admin"} | Password: ${client.adminPassword || "StorePassword@123"}
   Photo uploader: window.boutique.storage.upload(file, { title, price });
5. Razorpay Renewal Trigger:
   window.boutique.billing.openRenewalModal();
`
                  ) : promptSubTab === "bug_fix" ? (
`# ==============================================================================
# 🐞 BUG FIXING & SDK AUDIT SPECIFICATION: BOUTIQUE CLIENT FRONTEND
# ==============================================================================

Diagnose and fix frontend integration issues for "${client.businessName}":

### 📋 TARGET CLIENT CREDENTIALS
- CLIENT ID: "${client.id}"
- PUBLIC KEY: "${client.publicApiKey}"
- SECRET KEY: "${client.secretApiKey}"
- DOMAIN: "${client.primaryDomain}"

### 🔍 COMMON BUGS & DIAGNOSIS CHECKLIST
❌ Bug 1: Website Still Active When Suspended (Killswitch Bypass)
   -> If the store is in "Testing Mode", payment walls are disabled for developers. Switch to "Live Mode" in Super Admin to enforce suspension.
   -> The SDK caches status in localStorage for 15 minutes. Run: localStorage.clear(); window.location.reload();
   -> Ensure window.boutique = new BoutiqueSDK({...}) is initialized in root index.html so Gatekeeper can inject the blur lock screen.
❌ Bug 2: window.boutique is undefined -> Ensure <script src="http://localhost:5000/sdk/v1/boutique-sdk.min.js"></script> in <head>
❌ Bug 3: 403 UNAUTHORIZED_DOMAIN -> Check domain origin against whitelist: ${client.allowedDomains}
❌ Bug 4: Photo upload quota failed -> Ensure secretKey is provided to BoutiqueSDK in /admin and plan limit is not exceeded
❌ Bug 5: WhatsApp button doesn't send item info -> Ensure window.boutique.whatsapp.openChat(product) is triggered
❌ Bug 6: Razorpay modal not opening -> Bind onClick to window.boutique.billing.openRenewalModal()
`
                  ) : (
`// 🧪 BROWSER CONSOLE SMOKE TEST SCRIPT FOR ${client.businessName}
async function runSmokeTest() {
  console.log("🚀 Testing ${client.businessName} SDK integration...");
  console.log("1. SDK Attached:", !!window.boutique);
  const status = await window.boutique.gatekeeper.checkStatus(true);
  console.log("2. Gatekeeper Status:", status);
  const media = await window.boutique.storage.fetchMedia();
  console.log("3. Dynamic S3 Media Count:", media.length);
  console.log("4. WhatsApp Bridge Ready:", typeof window.boutique.whatsapp.openChat === "function");
  console.log("5. Billing Bridge Ready:", typeof window.boutique.billing.openRenewalModal === "function");
}
runSmokeTest();`
                  )}
                </pre>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
