import { BillingModule } from "../modules/billing.js";
import { GatekeeperModule } from "../modules/gatekeeper.js";
import { BoutiqueConfig } from "../types.js";

export class BillingSDK extends BillingModule {
  public readonly gatekeeper: GatekeeperModule;

  constructor(config: BoutiqueConfig) {
    const gatekeeper = new GatekeeperModule(config);
    super(config, gatekeeper);
    this.gatekeeper = gatekeeper;
  }
}

declare global {
  interface Window {
    BillingSDK?: typeof BillingSDK;
  }
}

if (typeof window !== "undefined") {
  window.BillingSDK = BillingSDK;
}

export * from "../types.js";
export default BillingSDK;
