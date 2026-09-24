export interface BoutiqueConfig {
  clientId: string;
  publicKey: string;
  secretKey?: string;
  apiUrl?: string;
  whatsappNumber?: string;
  currencySymbol?: string;
  autoGatekeep?: boolean;
  debug?: boolean;
}

export interface ClientStatus {
  clientId: string;
  businessName: string;
  environmentMode?: "TESTING" | "LIVE";
  status: "TESTING" | "PENDING_FIRST_PAYMENT" | "ACTIVE" | "GRACE_PERIOD" | "SUSPENDED" | "EXPIRED";
  activatedAt?: string | null;
  planId?: string;
  planName: string;
  priceInrMonthly?: number;
  priceInrYearly?: number;
  maxImages: number;
  maxStorageBytes: number;
  currentImagesCount: number;
  currentStorageBytes: number;
  isOverQuota?: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  gracePeriodEndsAt: string;
  isManualOverride: boolean;
  allowOnlineCart: boolean;
  allowCustomerGateway: boolean;
  allowOrdersPortal: boolean;
  allowInventory: boolean;
  allowVariants: boolean;
  allowCustomersCrm: boolean;
  allowCoupons: boolean;
  allowStaffAccounts: number;
  allowAiSalesBot: boolean;
  ownerPhone: string;
}

export interface SubscriptionPlanSummary {
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

export interface MediaItem {
  id: string;
  fileName: string;
  fileUrl: string;
  category: string;
  title?: string;
  price?: number;
  fileSizeBytes: number;
  createdAt: string;
}

export interface GalleryMountOptions {
  layout?: "grid" | "masonry";
  enableWhatsAppOrder?: boolean;
  columns?: number;
  customCardRenderer?: (item: MediaItem) => string;
}

export interface UploadOptions {
  title?: string;
  price?: number;
  category?: string;
  onProgress?: (percentage: number) => void;
}
