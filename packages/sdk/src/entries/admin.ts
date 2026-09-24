import { AdminModule } from "../modules/admin.js";
import { StorageModule } from "../modules/storage.js";
import { GatekeeperModule } from "../modules/gatekeeper.js";
import { BillingModule } from "../modules/billing.js";
import { BoutiqueConfig } from "../types.js";

export class AdminSDK extends AdminModule {
  public readonly storage: StorageModule;
  public readonly gatekeeper: GatekeeperModule;
  public readonly billing: BillingModule;

  constructor(config: BoutiqueConfig) {
    const storage = new StorageModule(config);
    const gatekeeper = new GatekeeperModule(config);
    const billing = new BillingModule(config, gatekeeper);
    super(config, storage, gatekeeper, billing);
    this.storage = storage;
    this.gatekeeper = gatekeeper;
    this.billing = billing;
  }
}

declare global {
  interface Window {
    AdminSDK?: typeof AdminSDK;
  }
}

if (typeof window !== "undefined") {
  window.AdminSDK = AdminSDK;
}

export * from "../types.js";
export default AdminSDK;
