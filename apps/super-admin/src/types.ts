export interface SubscriptionPlan {
  id: string;
  name: string;
  priceInrMonthly: number;
  priceInrYearly: number;
  maxImages: number;
  maxStorageBytes: number;
  allowCustomDomain: boolean;
  allowOnlineCart: boolean;
  allowCustomerGateway: boolean;
  allowOrdersPortal: boolean;
  allowInventory: boolean;
  allowVariants: boolean;
  allowCustomersCrm: boolean;
  allowCoupons: boolean;
  allowStaffAccounts: number;
  allowAiSalesBot: boolean;
}

export interface ClientData {
  id: string;
  businessName: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
  city: string;
  storeAddress?: string;
  instagramHandle?: string;
  websiteType: "SHOWCASE" | "WHATSAPP_STORE" | "ECOMMERCE";
  primaryDomain: string;
  allowedDomains: string;
  adminUsername: string;
  adminPassword: string;
  publicApiKey: string;
  secretApiKey: string;
  githubRepo?: string | null;
  developerNotes?: string | null;
  projectZipUrl?: string | null;
  projectZipName?: string | null;
  createdAt: string;
  subscription: {
    id: string;
    planId: string;
    planName: string;
    environmentMode: "TESTING" | "LIVE";
    status: "TESTING" | "PENDING_FIRST_PAYMENT" | "ACTIVE" | "GRACE_PERIOD" | "SUSPENDED" | "CANCELLED";
    activatedAt?: string | null;
    billingCycle: "MONTHLY" | "YEARLY";
    currentPeriodStart: string;
    currentPeriodEnd: string;
    gracePeriodEnd: string;
    isManualOverride: boolean;
    maxImages: number;
    maxStorageBytes: number;
    priceInrMonthly: number;
  } | null;
  usage: {
    currentImagesCount: number;
    currentStorageBytes: number;
  };
}

export interface InvoiceItem {
  id: string;
  amountInr: number;
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  paidAt?: string;
  createdAt: string;
  clientName: string;
  clientDomain: string;
  ownerPhone: string;
}

export interface WebsiteHealthStatus {
  clientId: string;
  businessName?: string;
  domain: string;
  isLive: boolean;
  status: "ONLINE" | "DEGRADED" | "OFFLINE" | "CHECKING";
  statusCode: number | null;
  statusText: string;
  responseTimeMs: number;
  checkedUrl: string;
  checkedAt: string;
  protocol?: "https" | "http";
  serverHeader?: string;
  error?: string;
}

export interface WebsiteHealthSummary {
  total: number;
  online: number;
  degraded: number;
  offline: number;
}
