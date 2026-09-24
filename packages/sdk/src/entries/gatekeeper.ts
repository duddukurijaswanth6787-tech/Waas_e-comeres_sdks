import { GatekeeperModule } from "../modules/gatekeeper.js";
import { BoutiqueConfig, ClientStatus } from "../types.js";

export class GatekeeperSDK extends GatekeeperModule {
  constructor(config: BoutiqueConfig) {
    super(config);
    if (config.autoGatekeep !== false && typeof window !== "undefined") {
      this.checkStatus().catch(console.warn);
    }
  }
}

declare global {
  interface Window {
    GatekeeperSDK?: typeof GatekeeperSDK;
  }
}

if (typeof window !== "undefined") {
  window.GatekeeperSDK = GatekeeperSDK;
}

export * from "../types.js";
export default GatekeeperSDK;
