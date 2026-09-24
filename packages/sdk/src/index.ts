import { BoutiqueConfig, ClientStatus } from "./types.js";
import { GatekeeperModule } from "./modules/gatekeeper.js";
import { StorageModule } from "./modules/storage.js";
import { WhatsAppModule } from "./modules/whatsapp.js";
import { CmsModule } from "./modules/cms.js";
import { BillingModule } from "./modules/billing.js";
import { AdminModule } from "./modules/admin.js";
import { CartModule } from "./modules/cart.js";
import { CheckoutModule } from "./modules/checkout.js";

export class EcomSDK {
  public readonly config: BoutiqueConfig;
  public readonly clientId: string;
  public readonly publicKey: string;
  public readonly apiUrl: string;
  public readonly gatekeeper: GatekeeperModule;
  public readonly storage: StorageModule;
  public readonly whatsapp: WhatsAppModule;
  public readonly gallery: CmsModule;
  public readonly billing: BillingModule;
  public readonly admin: AdminModule;
  public readonly cart: CartModule;
  public readonly checkout: CheckoutModule;

  constructor(config: BoutiqueConfig) {
    if (!config.clientId || !config.publicKey) {
      throw new Error("[EcomSDK] Initialization failed: clientId and publicKey are required.");
    }

    const normalizedConfig: BoutiqueConfig = {
      ...config,
      apiUrl: config.apiUrl || "http://localhost:5000",
    };

    this.config = normalizedConfig;
    this.clientId = normalizedConfig.clientId;
    this.publicKey = normalizedConfig.publicKey;
    this.apiUrl = normalizedConfig.apiUrl ?? "http://localhost:5000";

    // Initialize Submodules
    this.gatekeeper = new GatekeeperModule(normalizedConfig);
    this.storage = new StorageModule(normalizedConfig);
    this.whatsapp = new WhatsAppModule(normalizedConfig);
    this.gallery = new CmsModule(normalizedConfig, this.storage, this.whatsapp);
    this.billing = new BillingModule(normalizedConfig, this.gatekeeper);
    this.admin = new AdminModule(normalizedConfig, this.storage, this.gatekeeper, this.billing);
    this.cart = new CartModule(normalizedConfig.clientId);
    this.checkout = new CheckoutModule(normalizedConfig, this.cart);

    if (config.autoGatekeep !== false && typeof window !== "undefined") {
      this.gatekeeper.checkStatus().catch(() => {});
    }
  }

  public async getStatus(forceRefresh = false): Promise<ClientStatus> {
    return this.gatekeeper.checkStatus(forceRefresh);
  }
}

// Global Browser Window attachment
if (typeof window !== "undefined") {
  (window as unknown as { EcomSDK: typeof EcomSDK; BoutiqueSDK: typeof EcomSDK }).EcomSDK = EcomSDK;
  (window as unknown as { EcomSDK: typeof EcomSDK; BoutiqueSDK: typeof EcomSDK }).BoutiqueSDK = EcomSDK;
}

export * from "./types.js";
export * from "./modules/cart.js";
export * from "./modules/checkout.js";
