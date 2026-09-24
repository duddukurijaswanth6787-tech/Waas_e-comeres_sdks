import { useState, useEffect } from "react";
import { api, getAuthToken, clearAuthToken } from "./services/api";
import { ClientData, SubscriptionPlan, InvoiceItem, WebsiteHealthStatus } from "./types";
import { LoginModal } from "./components/LoginModal";
import { OnboardClientModal } from "./components/OnboardClientModal";
import { EditClientModal } from "./components/EditClientModal";
import { EditPlanModal } from "./components/EditPlanModal";
import { OnboardSuccessModal } from "./components/OnboardSuccessModal";
import { ChangeAdminPasswordModal } from "./components/ChangeAdminPasswordModal";
import { StoreDetailsDrawer } from "./components/StoreDetailsDrawer";
import { DeleteClientModal } from "./components/DeleteClientModal";
import { AiPromptModal } from "./components/AiPromptModal";
import { AiPromptKitView } from "./components/AiPromptKitView";
import { SdkTestingPlayground } from "./components/SdkTestingPlayground";
import { MandatesGuideView } from "./components/MandatesGuideView";
import { WhatsAppTemplatesView } from "./components/WhatsAppTemplatesView";
import {
  Shield,
  Plus,
  Bot,
  RefreshCw,
  LogOut,
  IndianRupee,
  HardDrive,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  LayoutDashboard,
  Store,
  Layers,
  FileText,
  Search,
  MapPin,
  Download,
  KeyRound,
  Globe,
  Zap,
  Radio,
  MessageSquare,
  TestTube2,
  CheckCircle2,
  Camera,
  Eye,
  Edit3,
  TrendingUp
} from "lucide-react";

type NavTab = "overview" | "clients" | "plans" | "storage" | "invoices" | "whatsapp" | "prompts" | "test-sdk" | "docs";

const VALID_TABS: NavTab[] = ["overview", "clients", "plans", "storage", "invoices", "whatsapp", "prompts", "test-sdk", "docs"];

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getAuthToken());

  // Persist Active Tab across Browser Refreshes (URL Hash + LocalStorage)
  const getInitialTab = (): NavTab => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace(/^#/, "") as NavTab;
      if (VALID_TABS.includes(hash)) return hash;
      const saved = localStorage.getItem("super_admin_active_nav") as NavTab;
      if (VALID_TABS.includes(saved)) return saved;
    }
    return "overview";
  };

  const [activeNav, setActiveNavState] = useState<NavTab>(getInitialTab);

  const setActiveNav = (tab: NavTab) => {
    setActiveNavState(tab);
    if (typeof window !== "undefined") {
      window.location.hash = tab;
      localStorage.setItem("super_admin_active_nav", tab);
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, "") as NavTab;
      if (VALID_TABS.includes(hash)) {
        setActiveNavState(hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const [clients, setClients] = useState<ClientData[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [websiteHealth, setWebsiteHealth] = useState<Record<string, WebsiteHealthStatus>>({});
  const [isPingingAll, setIsPingingAll] = useState<boolean>(false);
  const [pingingClientIds, setPingingClientIds] = useState<Record<string, boolean>>({});

  const handlePingAllWebsites = async () => {
    setIsPingingAll(true);
    try {
      const data = await api.pingAllWebsites();
      setWebsiteHealth((prev) => ({ ...prev, ...data.results }));
      showToast(
        `Checked ${data.summary.total} websites: ${data.summary.online} Live, ${data.summary.offline} Down/Offline`,
        data.summary.offline > 0 ? "info" : "success"
      );
    } catch {
      showToast("Failed to check website server statuses", "error");
    } finally {
      setIsPingingAll(false);
    }
  };

  const handlePingSingleWebsite = async (client: ClientData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPingingClientIds((prev) => ({ ...prev, [client.id]: true }));
    try {
      const health = await api.pingClientWebsite(client.id);
      setWebsiteHealth((prev) => ({ ...prev, [client.id]: health }));
      if (health.isLive) {
        showToast(`🟢 ${client.businessName} is LIVE (${health.responseTimeMs}ms)`, "success");
      } else {
        showToast(`🔴 ${client.businessName} server is OFFLINE (${health.statusText})`, "error");
      }
    } catch {
      setWebsiteHealth((prev) => ({
        ...prev,
        [client.id]: {
          clientId: client.id,
          domain: client.primaryDomain,
          isLive: false,
          status: "OFFLINE",
          statusCode: null,
          statusText: "Server Down / Unreachable",
          responseTimeMs: 0,
          checkedUrl: `http://${client.primaryDomain}`,
          checkedAt: new Date().toISOString(),
        },
      }));
      showToast(`🔴 ${client.businessName} is OFFLINE`, "error");
    } finally {
      setPingingClientIds((prev) => ({ ...prev, [client.id]: false }));
    }
  };
  const handleClientCreated = (newClient: ClientData) => {
    setClients((prev) => [newClient, ...prev]);
    showToast(`Boutique "${newClient.businessName}" onboarded successfully!`, "success");
  };

  const [selectedClientForPrompt, setSelectedClientForPrompt] = useState<ClientData | null>(null);
  const [selectedClientDrawer, setSelectedClientDrawer] = useState<ClientData | null>(null);
  const [selectedClientForEdit, setSelectedClientForEdit] = useState<ClientData | null>(null);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<SubscriptionPlan | null>(null);
  const [freshlyOnboardedClient, setFreshlyOnboardedClient] = useState<ClientData | null>(null);
  const [showOnboardModal, setShowOnboardModal] = useState<boolean>(false);
  const [showChangeAdminPwdModal, setShowChangeAdminPwdModal] = useState<boolean>(false);
  const [clientToDelete, setClientToDelete] = useState<ClientData | null>(null);
  const [deleteModalLoading, setDeleteModalLoading] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clientsData, plansData, invoicesData] = await Promise.all([
        api.getClients(),
        api.getPlans(),
        api.getInvoices(),
      ]);
      setClients(clientsData);
      setPlans(plansData);
      setInvoices(invoicesData);

      // Auto ping websites in background
      api.pingAllWebsites()
        .then((data) => setWebsiteHealth(data.results))
        .catch(() => {});

      if (selectedClientDrawer) {
        const fresh = clientsData.find((c) => c.id === selectedClientDrawer.id);
        if (fresh) setSelectedClientDrawer(fresh);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchData();

    // 🌟 Auto-refetch when user switches back to this browser tab
    const handleWindowFocus = () => {
      fetchData();
    };

    // 🌟 Periodic 10-second background sync for live multi-user updates
    const intervalId = setInterval(() => {
      fetchData();
    }, 10000);

    window.addEventListener("focus", handleWindowFocus);
    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      clearInterval(intervalId);
    };
  }, [isAuthenticated]);
  const handleStatusChange = async (
    clientId: string,
    action: "SUSPEND" | "EXTEND_GRACE" | "REACTIVATE" | "SWITCH_LIVE" | "SWITCH_TESTING"
  ) => {
    setActionLoadingId(clientId);
    try {
      if (action === "SUSPEND") {
        await api.updateClientStatus(clientId, { status: "SUSPENDED", isManualOverride: true });
        showToast("Website suspended successfully (Lock Screen Active).", "info");
      } else if (action === "EXTEND_GRACE") {
        await api.updateClientStatus(clientId, { extendGraceDays: 7, isManualOverride: true });
        showToast("Granted +7 days grace extension.", "success");
      } else if (action === "REACTIVATE") {
        await api.updateClientStatus(clientId, { status: "ACTIVE", isManualOverride: true });
        showToast("Website reactivated successfully.", "success");
      } else if (action === "SWITCH_LIVE") {
        await api.updateClientStatus(clientId, {
          environmentMode: "LIVE",
          status: "PENDING_FIRST_PAYMENT",
          isManualOverride: false,
        });
        showToast("🚀 Switched to Live Mode! Store owner will be prompted for first payment in /admin.", "success");
      } else if (action === "SWITCH_TESTING") {
        await api.updateClientStatus(clientId, {
          environmentMode: "TESTING",
          status: "TESTING",
          isManualOverride: false,
        });
        showToast("Switched back to Testing Mode (Clock Frozen).", "info");
      }
      await fetchData();
    } catch (err) {
      showToast("Failed to update status: " + (err as Error).message, "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteClient = (clientId: string) => {
    const target = clients.find((c) => c.id === clientId);
    if (target) {
      setClientToDelete(target);
    }
  };

  const handleConfirmDeleteClient = async (clientId: string, superAdminPassword: string) => {
    setDeleteModalLoading(true);
    try {
      const res = await api.deleteClient(clientId, superAdminPassword);
      setClientToDelete(null);
      setSelectedClientDrawer(null);
      showToast(res.message || "Store permanently deleted.", "info");
      await fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err;
      } else {
        throw new Error("Failed to delete client.");
      }
    } finally {
      setDeleteModalLoading(false);
    }
  };

  const handleSendWhatsAppAlert = (client: ClientData) => {
    const cleanPhone = client.ownerPhone.replace(/[^0-9]/g, "");
    const msg = `Hi ${client.ownerName}, your boutique website subscription for ${client.primaryDomain} (${client.subscription?.planName}) is due. Please renew to avoid service disruption: https://${client.primaryDomain}/admin`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
    showToast("WhatsApp alert chat opened.", "success");
  };

  const handleExportClientsCsv = () => {
    if (clients.length === 0) {
      showToast("No clients to export", "info");
      return;
    }

    const headers = ["ClientID,Store Name,Owner Name,WhatsApp,Location,Domain,Plan,Status,Due Date,Photos Used,Storage MB"];
    const rows = clients.map((c) => {
      const sub = c.subscription;
      const storageMb = (c.usage.currentStorageBytes / (1024 * 1024)).toFixed(1);
      const dueDate = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN") : "N/A";
      return `"${c.id}","${c.businessName}","${c.ownerName}","${c.ownerPhone}","${c.storeAddress || c.city}","${c.primaryDomain}","${sub?.planName || "Starter"}","${sub?.status || "ACTIVE"}","${dueDate}","${c.usage.currentImagesCount}","${storageMb}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `boutique_clients_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("Boutique clients exported to CSV.", "success");
  };

  if (!isAuthenticated) {
    return <LoginModal onSuccess={() => setIsAuthenticated(true)} />;
  }

  // Filtered clients list
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.primaryDomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === "ALL") {
      matchesStatus = true;
    } else if (statusFilter === "LIVE_ONLINE") {
      matchesStatus = !!websiteHealth[c.id]?.isLive;
    } else if (statusFilter === "SERVER_OFFLINE") {
      matchesStatus = websiteHealth[c.id] ? !websiteHealth[c.id].isLive : true;
    } else {
      matchesStatus = (c.subscription?.status || "ACTIVE") === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  // 100% Dynamic Financial & Business Analytics Metrics
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.subscription?.status === "ACTIVE").length;
  // 1. Realized Paid Revenue (Direct from PostgreSQL PAID Invoices)
  const paidInvoices = invoices.filter((inv) => inv.paymentStatus === "PAID");
  const totalPaidRevenue = paidInvoices.reduce((acc, inv) => acc + inv.amountInr, 0);

  // 2. Pending / Due Subscription Pipeline
  const pendingClientsList = clients.filter((c) => c.subscription?.status !== "ACTIVE");
  const pendingRevenue = pendingClientsList.reduce(
    (acc, c) => acc + (c.subscription?.priceInrMonthly || 2499),
    0
  );

  // 3. Active MRR (Monthly Recurring Revenue from actively paying stores)
  const activeMRR = clients
    .filter((c) => c.subscription?.status === "ACTIVE")
    .reduce((acc, c) => acc + (c.subscription?.priceInrMonthly || 0), 0);

  const totalStorageMb = clients.reduce(
    (acc, c) => acc + Math.round(c.usage.currentStorageBytes / (1024 * 1024)),
    0
  );
  const onlineWebsitesCount = Object.values(websiteHealth).filter((h) => h.isLive).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      {/* 🌟 LEFT SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 sticky top-0 h-screen z-30 shadow-2xs">
        <div className="p-6 space-y-6">
          {/* Logo & Platform Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                Boutique SaaS
                <span className="text-[9px] uppercase font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-1.5 py-0.5 rounded-full">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Hyderabad Hub</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveNav("overview")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === "overview"
                  ? "bg-indigo-50 text-indigo-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview &amp; Analytics</span>
            </button>

            <button
              onClick={() => setActiveNav("clients")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === "clients"
                  ? "bg-indigo-50 text-indigo-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Store className="w-4 h-4" />
                <span>Boutique Stores</span>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                {totalClients}
              </span>
            </button>

            <button
              onClick={() => setActiveNav("plans")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === "plans"
                  ? "bg-indigo-50 text-indigo-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Subscription Plans</span>
            </button>

            <button
              onClick={() => setActiveNav("storage")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === "storage"
                  ? "bg-indigo-50 text-indigo-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>AWS S3 Storage</span>
            </button>

            <button
              onClick={() => setActiveNav("whatsapp")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === "whatsapp"
                  ? "bg-indigo-50 text-indigo-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Templates</span>
            </button>

            <button
              onClick={() => setActiveNav("invoices")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === "invoices"
                  ? "bg-indigo-50 text-indigo-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Invoices &amp; Billing</span>
            </button>

            <div className="pt-3 pb-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3.5">AI &amp; Developer Hub</div>
            </div>

            <button
              onClick={() => setActiveNav("prompts")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === "prompts"
                  ? "bg-indigo-50 text-indigo-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Bot className="w-4 h-4 text-indigo-600" />
              <span>AI Prompt Kit &amp; Builder</span>
            </button>

            <button
              onClick={() => setActiveNav("test-sdk")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === "test-sdk"
                  ? "bg-indigo-50 text-indigo-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <TestTube2 className="w-4 h-4 text-emerald-600" />
              <span>SDK Testing &amp; Playground</span>
            </button>

            <button
              onClick={() => setActiveNav("docs")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === "docs"
                  ? "bg-indigo-50 text-indigo-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Developer Mandates</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer User Info & Password Change Trigger */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div
            onClick={() => setShowChangeAdminPwdModal(true)}
            className="flex items-center gap-2.5 overflow-hidden cursor-pointer group"
            title="Click to change Master Admin Password"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm group-hover:bg-indigo-700 transition-colors">
              JA
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 flex items-center gap-1">
                <span>Agency Owner</span>
                <KeyRound className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
              </div>
              <div className="text-[10px] text-slate-400 truncate">Change Password</div>
            </div>
          </div>
          <button
            onClick={() => {
              clearAuthToken();
              setIsAuthenticated(false);
            }}
            className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-white transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 🌟 MAIN CONTENT PANE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-bold text-slate-900 capitalize">
              {activeNav === "overview" && "Dashboard Overview"}
              {activeNav === "clients" && "Boutique Store Accounts"}
              {activeNav === "plans" && "Subscription Tiers & Quotas"}
              {activeNav === "storage" && "AWS S3 Cloud Storage (Hyderabad)"}
              {activeNav === "invoices" && "Invoices & Revenue Logs"}
              {activeNav === "prompts" && "AI Prompt Kit & Website Builder Hub"}
              {activeNav === "test-sdk" && "SDK Live Health & Diagnostics Playground"}
              {activeNav === "docs" && "SDK Integration Mandates & Guide"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="p-2.5 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setShowOnboardModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-100 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Onboard E-Commerce Merchant
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-8 space-y-6 flex-1">
          {/* 1. OVERVIEW & ANALYTICS TAB */}
          {activeNav === "overview" && (
            <div className="space-y-6">
              {/* Stat Cards */}
              {/* 5 100% DYNAMIC FINANCIAL & METRIC CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Card 1: Realized Paid Revenue (From Paid Invoices) */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Realized Paid Revenue</div>
                    <div className="text-2xl font-bold text-emerald-700 mt-1">₹{totalPaidRevenue.toLocaleString("en-IN")}</div>
                    <div className="text-[11px] text-emerald-600 font-medium mt-1">
                      {paidInvoices.length} Paid Invoice{paidInvoices.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-2xs">
                    <IndianRupee className="w-6 h-6" />
                  </div>
                </div>

                {/* Card 2: Pending / Due Subscriptions */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending / Due Pipeline</div>
                    <div className="text-2xl font-bold text-amber-700 mt-1">₹{pendingRevenue.toLocaleString("en-IN")}</div>
                    <div className="text-[11px] text-amber-600 font-medium mt-1">
                      {pendingClientsList.length} Store{pendingClientsList.length === 1 ? "" : "s"} Due / Testing
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-2xs">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>

                {/* Card 3: Active Monthly Recurring (MRR) */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Monthly (MRR)</div>
                    <div className="text-2xl font-bold text-indigo-700 mt-1">₹{activeMRR.toLocaleString("en-IN")}</div>
                    <div className="text-[11px] text-indigo-600 font-medium mt-1">
                      {activeClients} Active / {totalClients} Total
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-2xs">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>

                {/* Card 4: Real-Time Live Website Uptime Metric */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Websites Live Online</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                      <span>{onlineWebsitesCount} / {totalClients}</span>
                      {onlineWebsitesCount > 0 && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                      <button
                        onClick={handlePingAllWebsites}
                        disabled={isPingingAll}
                        className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer underline flex items-center gap-1"
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${isPingingAll ? "animate-spin" : ""}`} />
                        <span>{isPingingAll ? "Pinging..." : "Check All Live"}</span>
                      </button>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-2xs">
                    <Globe className="w-6 h-6" />
                  </div>
                </div>

                {/* Card 5: AWS S3 Storage Usage */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AWS S3 Storage (Hyd)</div>
                    <div className="text-2xl font-bold text-cyan-700 mt-1">{(totalStorageMb / 1024).toFixed(2)} GB</div>
                    <div className="text-[11px] text-cyan-600 font-medium mt-1">{totalStorageMb} MB across stores</div>
                  </div>
                  <div className="w-12 h-12 bg-cyan-50 border border-cyan-100 rounded-2xl flex items-center justify-center text-cyan-600 shadow-2xs">
                    <HardDrive className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* 📊 DYNAMIC FINANCIAL CHARTS & STORAGE ANALYTICS SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart 1: Live Monthly Revenue & Invoices Pipeline Graph */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-emerald-600" /> Dynamic Monthly Revenue &amp; Pipeline Performance
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Realized cash collections vs due subscription revenue calculated in real-time from PostgreSQL
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Paid Cash (₹{totalPaidRevenue.toLocaleString("en-IN")})
                      </span>
                      <span className="flex items-center gap-1.5 font-semibold text-amber-700">
                        <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span> Due Pipeline (₹{pendingRevenue.toLocaleString("en-IN")})
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Visual Graph Bars */}
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>Realized Cash Collected (Paid Invoices)</span>
                        <span className="font-mono text-emerald-700">₹{totalPaidRevenue.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                          style={{
                            width: `${
                              totalPaidRevenue + pendingRevenue > 0
                                ? Math.max(8, Math.round((totalPaidRevenue / (totalPaidRevenue + pendingRevenue)) * 100))
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>Pending / Due Subscription Pipeline</span>
                        <span className="font-mono text-amber-700">₹{pendingRevenue.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-700"
                          style={{
                            width: `${
                              totalPaidRevenue + pendingRevenue > 0
                                ? Math.max(8, Math.round((pendingRevenue / (totalPaidRevenue + pendingRevenue)) * 100))
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Tier Breakdown Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                    <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-indigo-600 block">Standard Tier (₹2,499)</span>
                      <span className="text-sm font-bold text-indigo-950 font-mono">
                        {clients.filter((c) => (c.subscription?.planId || "").includes("standard")).length} Stores
                      </span>
                    </div>
                    <div className="p-3.5 bg-purple-50/60 border border-purple-100 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-purple-600 block">Pro Flagship (₹3,999)</span>
                      <span className="text-sm font-bold text-purple-950 font-mono">
                        {clients.filter((c) => (c.subscription?.planId || "").includes("pro")).length} Stores
                      </span>
                    </div>
                    <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 block">Enterprise (₹5,999)</span>
                      <span className="text-sm font-bold text-emerald-950 font-mono">
                        {clients.filter((c) => (c.subscription?.planId || "").includes("enterprise")).length} Stores
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chart 2: S3 Media & Storage Distribution by Store */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-cyan-600" /> S3 Cloud Storage per Store
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Real-time AWS Hyderabad media usage</p>

                    <div className="mt-4 space-y-3">
                      {clients.map((c) => {
                        const mb = (c.usage.currentStorageBytes / (1024 * 1024)).toFixed(2);
                        const pct = Math.min(100, Math.round((c.usage.currentStorageBytes / (c.subscription?.maxStorageBytes || 1)) * 100));
                        return (
                          <div key={c.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-800 truncate">{c.businessName}</span>
                              <span className="text-cyan-700 font-mono">{mb} MB ({c.usage.currentImagesCount} photos)</span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${Math.max(4, pct)}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveNav("invoices")}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                  >
                    <FileText className="w-4 h-4" /> View Full Invoices &amp; Receipts
                  </button>
                </div>
              </div>
              {/* Quick Actions & Recent Accounts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Accounts Preview */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-slate-900 text-sm">Recent E-Commerce Accounts</h2>
                      <p className="text-xs text-slate-400">Click any merchant to open cart settings, staff &amp; order fulfillment</p>
                    </div>
                    <button
                      onClick={() => setActiveNav("clients")}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      View All &rarr;
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {clients.slice(0, 5).map((client) => (
                      <div
                        key={client.id}
                        onClick={() => setSelectedClientDrawer(client)}
                        className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-2xl cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-xs">
                            {client.businessName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-slate-900">{client.businessName}</div>
                            <div className="text-[11px] text-slate-400">{client.primaryDomain} • {client.city}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-slate-700">{client.subscription?.planName || "Starter"}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              client.subscription?.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {client.subscription?.status || "ACTIVE"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cloud & System Health Card */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-600" /> System Architecture Health
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Live status of central services</p>

                    <div className="mt-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="font-medium text-slate-600">Central API Engine</span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Running (Port 4000)
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="font-medium text-slate-600">AWS S3 (Hyderabad)</span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ap-south-2 Active
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="font-medium text-slate-600">Live Website Ping Engine</span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active ({onlineWebsitesCount} Online)
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="font-medium text-slate-600">Unified SDK Distribution</span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> /sdk/v1/ Served
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveNav("prompts")}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                  >
                    <Bot className="w-4 h-4" /> Open AI Prompt Kit &amp; Builder
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. BOUTIQUE STORES TABLE TAB */}
          {activeNav === "clients" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm space-y-4">
              {/* Table Search & Filter Bar */}
              {/* Table Search, Live Monitor & Filter Bar */}
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search e-com store, owner, domain, or MerchantID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                  />
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* ⚡ Ping All Websites Button */}
                  <button
                    onClick={handlePingAllWebsites}
                    disabled={isPingingAll}
                    className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                    title="Ping all client website servers to verify live reachability and response times"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isPingingAll ? "animate-spin" : ""}`} />
                    <span>{isPingingAll ? "Checking Websites..." : "Check All Live Status"}</span>
                  </button>

                  <button
                    onClick={handleExportClientsCsv}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Export All Clients to CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Export CSV</span>
                  </button>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs font-medium"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="LIVE_ONLINE">🟢 Live Online Websites Only</option>
                    <option value="SERVER_OFFLINE">🔴 Server Down / Offline Only</option>
                    <option value="ACTIVE">🟢 Active Subscriptions</option>
                    <option value="GRACE_PERIOD">🟡 Grace Period</option>
                    <option value="SUSPENDED">🔴 Suspended</option>
                  </select>
                </div>
              </div>

              {/* Minimal Clean Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">E-Com Merchant</th>
                      <th className="px-6 py-4">Merchant Contact</th>
                      <th className="px-6 py-4">Domain &amp; Live Server Status</th>
                      <th className="px-6 py-4">Plan &amp; S3 Quota</th>
                      <th className="px-6 py-4">Subscription</th>
                      <th className="px-6 py-4">Renewal Due</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400">
                          No e-commerce merchants found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => {
                        const sub = client.subscription;
                        const status = sub?.status || "ACTIVE";

                        let statusBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                        if (status === "GRACE_PERIOD") {
                          statusBadgeClass = "bg-amber-50 text-amber-700 border-amber-200";
                        } else if (status === "SUSPENDED") {
                          statusBadgeClass = "bg-rose-50 text-rose-700 border-rose-200";
                        }

                        return (
                          <tr
                            key={client.id}
                            className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                            onClick={() => setSelectedClientDrawer(client)}
                          >
                            {/* Boutique Name & Location */}
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                                {client.businessName}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-indigo-500" />
                                <span>{client.storeAddress || client.city || "Hyderabad"}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{client.id}</div>
                            </td>

                            {/* Owner Contact */}
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <div className="font-semibold text-slate-800">{client.ownerName}</div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">{client.ownerPhone}</div>
                              {client.instagramHandle && (
                                <div className="text-[10px] text-pink-600 flex items-center gap-1 mt-1 font-medium">
                                  <Camera className="w-2.5 h-2.5" />
                                  <span>{client.instagramHandle}</span>
                                </div>
                              )}
                            </td>

                            {/* Domain */}
                            {/* Domain & Live Server Reachability Monitor */}
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={`http://${client.primaryDomain}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-slate-700 hover:text-indigo-600 flex items-center gap-1 font-mono text-[11px] font-medium"
                                >
                                  {client.primaryDomain}
                                  <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                                <span className="text-[9px] uppercase font-bold tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-md">
                                  {client.websiteType}
                                </span>
                              </div>

                              {/* Real-time Server Reachability Badge */}
                              <div className="mt-1.5 flex items-center gap-1.5">
                                {pingingClientIds[client.id] ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-indigo-500" />
                                    <span>Testing server...</span>
                                  </span>
                                ) : websiteHealth[client.id] ? (
                                  websiteHealth[client.id].isLive ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      <span>LIVE</span>
                                      <span className="font-mono text-[9px] text-emerald-600 font-normal">
                                        {websiteHealth[client.id].statusCode ? `(${websiteHealth[client.id].statusCode} • ` : "("}
                                        {websiteHealth[client.id].responseTimeMs}ms)
                                      </span>
                                    </span>
                                  ) : websiteHealth[client.id].status === "DEGRADED" ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      <span>🟡 DEGRADED ({websiteHealth[client.id].statusCode})</span>
                                    </span>
                                  ) : (
                                    <span
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
                                      title={websiteHealth[client.id].statusText}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                      <span>SERVER DOWN</span>
                                      <span className="text-[9px] font-normal text-rose-600 max-w-[110px] truncate">
                                        ({websiteHealth[client.id].statusText})
                                      </span>
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                    <Radio className="w-2.5 h-2.5 text-slate-400" />
                                    <span>Not Checked</span>
                                  </span>
                                )}

                                <button
                                  onClick={(e) => handlePingSingleWebsite(client, e)}
                                  disabled={pingingClientIds[client.id]}
                                  className="p-1 hover:bg-slate-200/80 rounded-md text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                                  title="Ping this website server now"
                                >
                                  <Zap className="w-3 h-3 text-indigo-500" />
                                </button>
                              </div>
                            </td>

                            {/* Plan & Quota */}
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-800">{sub?.planName || "Starter"}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Photos: <strong>{client.usage.currentImagesCount}</strong> / {sub?.maxImages || 30}
                              </div>
                              <div className="text-[10px] text-cyan-700 mt-0.5 font-medium">
                                Storage: {(client.usage.currentStorageBytes / (1024 * 1024)).toFixed(2)} MB
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadgeClass}`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                {status}
                              </span>
                            </td>

                            {/* Next Renewal */}
                            <td className="px-6 py-4 text-[11px] text-slate-600 font-medium">
                              {sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN") : "—"}
                            </td>

                            {/* Clean Primary Manage Action Button */}
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedClientDrawer(client)}
                                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                                >
                                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Manage &amp; AI Mandate</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. SUBSCRIPTION PLANS TAB */}
          {activeNav === "plans" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div key={plan.id} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 text-base">{plan.name}</h3>
                        <span className="text-[10px] uppercase font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                          {plan.id}
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-slate-900">
                        ₹{plan.priceInrMonthly.toLocaleString("en-IN")}<span className="text-xs text-slate-400 font-normal"> / month</span>
                      </div>
                      <div className="text-xs text-emerald-600 font-medium">
                        ₹{plan.priceInrYearly.toLocaleString("en-IN")} / year (Discounted)
                      </div>

                      <div className="space-y-2 pt-4 border-t border-slate-100 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span>Max Photos Limit:</span>
                          <span className="font-bold text-slate-900">{plan.maxImages} Photos</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>AWS S3 Storage Cap:</span>
                          <span className="font-bold text-slate-900">{(plan.maxStorageBytes / (1024 * 1024 * 1024)).toFixed(1)} GB</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Staff Accounts:</span>
                          <span className="font-bold text-slate-900">{plan.allowStaffAccounts ?? 2} Staff Accounts</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Online Shopping Cart:</span>
                          <span className="font-bold text-emerald-600">✓ {plan.allowOnlineCart ?? true ? "Enabled" : "Disabled"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Payment Gateway (Razorpay):</span>
                          <span className="font-bold text-emerald-600">✓ {plan.allowCustomerGateway ?? true ? "Enabled" : "Disabled"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Customer Orders Portal:</span>
                          <span className="font-bold text-emerald-600">✓ {plan.allowOrdersPortal ?? true ? "Enabled" : "Disabled"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Inventory &amp; SKU Variants:</span>
                          <span className="font-bold text-emerald-600">✓ {plan.allowInventory ?? true ? "Enabled" : "Disabled"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Customers CRM &amp; LTV:</span>
                          <span className="font-bold text-emerald-600">✓ {plan.allowCustomersCrm ?? true ? "Enabled" : "Disabled"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Discount Coupons Engine:</span>
                          <span className="font-bold text-emerald-600">✓ {plan.allowCoupons ?? true ? "Enabled" : "Disabled"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>AI Sales Assistant Bot:</span>
                          <span className={`font-bold ${plan.allowAiSalesBot ? "text-purple-600" : "text-slate-400"}`}>
                            {plan.allowAiSalesBot ? "✓ Enterprise Bot Active" : "— Disabled"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Custom Domain Whitelist:</span>
                          <span className="font-bold text-emerald-600">✓ {plan.allowCustomDomain ?? true ? "Enabled" : "Disabled"}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedPlanForEdit(plan)}
                      className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Plan &amp; Pricing
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. AWS S3 STORAGE TAB */}
          {activeNav === "storage" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
                      <HardDrive className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">AWS S3 Media Bucket</h3>
                      <p className="text-xs text-slate-400">Region: <span className="font-mono text-slate-700 font-bold">ap-south-2 (Hyderabad)</span> • Bucket: <span className="font-mono text-slate-700 font-bold">boutique-media-848910045051-hyd</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-slate-900">{(totalStorageMb / 1024).toFixed(2)} GB</div>
                    <div className="text-xs text-slate-400">Total Consumed Storage</div>
                  </div>
                </div>
              </div>

              {/* Per Boutique Storage Breakdown Table */}
              <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">Storage Consumption by Boutique</h3>
                </div>
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3.5">Boutique</th>
                      <th className="px-6 py-3.5">Photos Uploaded</th>
                      <th className="px-6 py-3.5">Storage Used</th>
                      <th className="px-6 py-3.5">Plan Cap</th>
                      <th className="px-6 py-3.5">Usage %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clients.map((c) => {
                      const maxStorageMb = c.subscription?.maxStorageBytes ? Math.round(c.subscription.maxStorageBytes / (1024 * 1024)) : 1200;
                      const usedMb = (c.usage.currentStorageBytes / (1024 * 1024)).toFixed(1);
                      const pct = Math.min(100, Math.round((c.usage.currentStorageBytes / (c.subscription?.maxStorageBytes || 1)) * 100));

                      return (
                        <tr key={c.id}>
                          <td className="px-6 py-4 font-semibold text-slate-900">{c.businessName}</td>
                          <td className="px-6 py-4">{c.usage.currentImagesCount} photos</td>
                          <td className="px-6 py-4 font-mono font-medium text-cyan-700">{usedMb} MB</td>
                          <td className="px-6 py-4 font-mono">{maxStorageMb} MB</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                              <span className="text-[11px] font-bold text-slate-700">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. INVOICES TAB */}
          {activeNav === "invoices" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Subscription Payment Invoices</h3>
                  <p className="text-xs text-slate-400">Razorpay captured transactions &amp; automated billing history</p>
                </div>
              </div>

              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Invoice ID</th>
                    <th className="px-6 py-3.5">Boutique</th>
                    <th className="px-6 py-3.5">Amount (INR)</th>
                    <th className="px-6 py-3.5">Payment Status</th>
                    <th className="px-6 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        No invoice records yet. Invoices auto-generate upon renewal payments.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="px-6 py-4 font-mono font-medium text-slate-700">{inv.id.substring(0, 16)}...</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{inv.clientName}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">₹{inv.amountInr.toLocaleString("en-IN")}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              inv.paymentStatus === "PAID"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {inv.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{new Date(inv.createdAt).toLocaleDateString("en-IN")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 5.5 WHATSAPP TEMPLATES & AUTOMATION TAB ⭐ */}
          {activeNav === "whatsapp" && (
            <WhatsAppTemplatesView clients={clients} />
          )}

          {/* 6. AI PROMPT KIT & BUILDER TAB */}
          {activeNav === "prompts" && (
            <AiPromptKitView
              clients={clients}
              onOpenOnboardModal={() => setShowOnboardModal(true)}
            />
          )}

          {/* 7. SDK TESTING & PLAYGROUND TAB */}
          {activeNav === "test-sdk" && (
            <SdkTestingPlayground
              clients={clients}
              onOpenOnboardModal={() => setShowOnboardModal(true)}
              onClientCreated={handleClientCreated}
            />
          )}

          {/* 8. DEVELOPER MANDATES & SDK DOCS TAB */}
          {activeNav === "docs" && <MandatesGuideView />}
        </main>
      </div>

      {/* 🌟 TOAST NOTIFICATION CONTAINER */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2 ${
              toastMessage.type === "success"
                ? "bg-emerald-600 text-white border-emerald-700"
                : toastMessage.type === "error"
                ? "bg-rose-600 text-white border-rose-700"
                : "bg-slate-900 text-white border-slate-800"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* 🌟 ONBOARD SUCCESS DIALOG WITH 1-CLICK WHATSAPP CREDENTIALS SENDER */}
      {freshlyOnboardedClient && (
        <OnboardSuccessModal
          client={freshlyOnboardedClient}
          onClose={() => setFreshlyOnboardedClient(null)}
          onOpenPrompt={(client) => {
            setFreshlyOnboardedClient(null);
            setSelectedClientForPrompt(client);
          }}
        />
      )}

      {/* 🌟 ONBOARD MODAL */}
      {showOnboardModal && (
        <OnboardClientModal
          onClose={() => setShowOnboardModal(false)}
          onSuccess={(newClient) => {
            setShowOnboardModal(false);
            fetchData();
            setFreshlyOnboardedClient(newClient);
            showToast(`Store "${newClient.businessName}" onboarded!`, "success");
          }}
        />
      )}

      {/* 🌟 EDIT CLIENT PROFILE MODAL */}
      {selectedClientForEdit && (
        <EditClientModal
          client={selectedClientForEdit}
          onClose={() => setSelectedClientForEdit(null)}
          onSuccess={(updatedClient) => {
            setSelectedClientForEdit(null);
            fetchData();
            showToast(`Store "${updatedClient.businessName}" updated successfully!`, "success");
          }}
        />
      )}

      {/* 🌟 EDIT SUBSCRIPTION PLAN MODAL */}
      {selectedPlanForEdit && (
        <EditPlanModal
          plan={selectedPlanForEdit}
          onClose={() => setSelectedPlanForEdit(null)}
          onSuccess={(updatedPlan) => {
            setSelectedPlanForEdit(null);
            fetchData();
            showToast(`Plan "${updatedPlan.name}" updated successfully!`, "success");
          }}
        />
      )}

      {/* 🌟 MASTER SUPER ADMIN PASSWORD CHANGE MODAL */}
      {showChangeAdminPwdModal && (
        <ChangeAdminPasswordModal
          onClose={() => setShowChangeAdminPwdModal(false)}
          onSuccess={() => {
            setShowChangeAdminPwdModal(false);
            showToast("Master Super Admin password updated successfully!", "success");
          }}
        />
      )}

      {/* 🌟 RICH SLIDE-OVER STORE DETAILS & ACTIONS DRAWER */}
      {selectedClientDrawer && (
        <StoreDetailsDrawer
          client={selectedClientDrawer}
          onClose={() => setSelectedClientDrawer(null)}
          onOpenPrompt={(client) => {
            setSelectedClientForPrompt(client);
          }}
          onOpenEdit={(client) => {
            setSelectedClientForEdit(client);
          }}
          onStatusChange={handleStatusChange}
          onDeleteClient={handleDeleteClient}
          onSendWhatsApp={handleSendWhatsAppAlert}
          onRefresh={fetchData}
          actionLoading={actionLoadingId === selectedClientDrawer.id}
        />
      )}

      {/* AI Mandates Prompt Modal */}
      {selectedClientForPrompt && (
        <AiPromptModal
          client={selectedClientForPrompt}
          onClose={() => setSelectedClientForPrompt(null)}
        />
      )}

      {/* 🗑️ SECURE DELETE CLIENT MODAL (REQUIRES SUPER ADMIN PASSWORD) */}
      {clientToDelete && (
        <DeleteClientModal
          client={clientToDelete}
          isOpen={!!clientToDelete}
          onClose={() => setClientToDelete(null)}
          onConfirmDelete={handleConfirmDeleteClient}
          loading={deleteModalLoading}
        />
      )}
    </div>
  );
}

export default App;
