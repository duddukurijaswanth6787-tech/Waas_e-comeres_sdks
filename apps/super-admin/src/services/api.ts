import { ClientData, SubscriptionPlan, InvoiceItem, WebsiteHealthStatus, WebsiteHealthSummary } from "../types";

const rawMeta = import.meta;
const envApiUrl = "env" in rawMeta && rawMeta.env && typeof rawMeta.env === "object" && "VITE_API_URL" in rawMeta.env && typeof rawMeta.env.VITE_API_URL === "string"
  ? rawMeta.env.VITE_API_URL
  : "http://localhost:5000";
export const API_BASE = `${envApiUrl}/api/v1`;

export function getAuthToken(): string | null {
  return localStorage.getItem("super_admin_jwt");
}

export function setAuthToken(token: string): void {
  localStorage.setItem("super_admin_jwt", token);
}

export function clearAuthToken(): void {
  localStorage.removeItem("super_admin_jwt");
}

function getHeaders(includeContentType = true): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (includeContentType) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export const api = {
  async login(email: string, password: string): Promise<{ success: boolean; token: string }> {
    const res = await fetch(`${API_BASE}/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Invalid admin credentials");
    const data = await res.json();
    setAuthToken(data.token);
    return data;
  },

  async verifyMe(): Promise<boolean> {
    const token = getAuthToken();
    if (!token) return false;
    const res = await fetch(`${API_BASE}/admin/auth/me`, { headers: getHeaders() });
    return res.ok;
  },
  async changePassword(currentPassword?: string, newPassword?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/admin/auth/change-password`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Failed to change password");
    }
    return res.json();
  },

  async getClients(): Promise<ClientData[]> {
    const res = await fetch(`${API_BASE}/admin/clients`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch clients");
    return res.json();
  },

  async getPlans(): Promise<SubscriptionPlan[]> {
    const res = await fetch(`${API_BASE}/admin/plans`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch plans");
    return res.json();
  },

  async updatePlan(
    planId: string,
    payload: {
      name?: string;
      priceInrMonthly?: number;
      priceInrYearly?: number;
      maxImages?: number;
      maxStorageGb?: number;
      allowCustomDomain?: boolean;
      allowOnlineCart?: boolean;
      allowCustomerGateway?: boolean;
      allowOrdersPortal?: boolean;
      allowInventory?: boolean;
      allowVariants?: boolean;
      allowCustomersCrm?: boolean;
      allowCoupons?: boolean;
      allowStaffAccounts?: number;
      allowAiSalesBot?: boolean;
    }
  ): Promise<{ success: boolean; plan: SubscriptionPlan }> {
    const res = await fetch(`${API_BASE}/admin/plans/${planId}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update subscription plan");
    return res.json();
  },

  async getInvoices(): Promise<InvoiceItem[]> {
    const res = await fetch(`${API_BASE}/admin/invoices`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async createClient(payload: {
    businessName: string;
    ownerName: string;
    ownerPhone: string;
    ownerEmail?: string;
    city?: string;
    storeAddress?: string;
    instagramHandle?: string;
    websiteType?: "SHOWCASE" | "WHATSAPP_STORE" | "ECOMMERCE";
    primaryDomain: string;
    allowedDomains: string;
    planId: string;
    billingCycle: "MONTHLY" | "YEARLY";
    adminUsername?: string;
    adminPassword?: string;
    githubRepo?: string | null;
    developerNotes?: string | null;
    projectZipUrl?: string | null;
    projectZipName?: string | null;
  }): Promise<{ success: boolean; client: ClientData }> {
    const res = await fetch(`${API_BASE}/admin/clients`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to onboard client");
    return res.json();
  },

  async updateClientProfile(
    clientId: string,
    payload: {
      businessName?: string;
      ownerName?: string;
      ownerPhone?: string;
      ownerEmail?: string | null;
      city?: string;
      storeAddress?: string | null;
      instagramHandle?: string | null;
      websiteType?: "SHOWCASE" | "WHATSAPP_STORE" | "ECOMMERCE";
      primaryDomain?: string;
      allowedDomains?: string;
      adminUsername?: string;
      adminPassword?: string;
      githubRepo?: string | null;
      developerNotes?: string | null;
      projectZipUrl?: string | null;
      projectZipName?: string | null;
      planId?: string;
    }
  ): Promise<{ success: boolean; client: ClientData }> {
    const res = await fetch(`${API_BASE}/admin/clients/${clientId}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update store profile");
    return res.json();
  },

  async updateClientStatus(
    clientId: string,
    payload: {
      status?: "TESTING" | "PENDING_FIRST_PAYMENT" | "ACTIVE" | "GRACE_PERIOD" | "SUSPENDED" | "CANCELLED";
      environmentMode?: "TESTING" | "LIVE";
      isManualOverride?: boolean;
      extendGraceDays?: number;
      currentPeriodEnd?: string;
      gracePeriodEnd?: string;
      activatedAt?: string | null;
      planId?: string;
    }
  ): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/clients/${clientId}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update status");
    return res.json();
  },

  async deleteClient(clientId: string, superAdminPassword?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/admin/clients/${clientId}`, {
      method: "DELETE",
      headers: getHeaders(true),
      body: JSON.stringify({ superAdminPassword: superAdminPassword || "" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || data.error || "Failed to delete client");
    }
    return data;
  },

  async pingClientWebsite(clientId: string): Promise<WebsiteHealthStatus> {
    const res = await fetch(`${API_BASE}/admin/clients/${clientId}/health`, {
      headers: getHeaders(false),
    });
    if (!res.ok) throw new Error("Failed to check website health");
    return res.json();
  },

  async pingAllWebsites(): Promise<{
    summary: WebsiteHealthSummary;
    results: Record<string, WebsiteHealthStatus>;
  }> {
    const res = await fetch(`${API_BASE}/admin/clients/health-check-all`, {
      method: "GET",
      headers: getHeaders(false),
    });
    if (!res.ok) throw new Error("Failed to check all websites");
    return res.json();
  },

  async pingDomain(domain: string): Promise<WebsiteHealthStatus> {
    const res = await fetch(`${API_BASE}/admin/ping-domain?domain=${encodeURIComponent(domain)}`, {
      headers: getHeaders(false),
    });
    if (!res.ok) throw new Error("Failed to ping domain");
    return res.json();
  },

  async getProjectZipPresignedUrl(fileName: string, clientId?: string): Promise<{
    success: boolean;
    fileKey: string;
    uploadUrl: string;
    publicUrl: string;
  }> {
    const res = await fetch(`${API_BASE}/admin/clients/project-zip/presigned-url`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ fileName, clientId }),
    });
    if (!res.ok) throw new Error("Failed to get presigned upload URL for project zip");
    return res.json();
  },

  async uploadFileToS3(uploadUrl: string, file: File, contentType = "application/zip"): Promise<void> {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: file,
    });
    if (!res.ok) {
      throw new Error(`Direct S3 upload failed with status ${res.status}`);
    }
  },
};
