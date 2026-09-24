import { CmsModule } from "../modules/cms.js";
import { StorageModule } from "../modules/storage.js";
import { WhatsAppModule } from "../modules/whatsapp.js";
import { BoutiqueConfig } from "../types.js";

export class CmsSDK extends CmsModule {
  public readonly storage: StorageModule;
  public readonly whatsapp: WhatsAppModule;

  constructor(config: BoutiqueConfig) {
    const storage = new StorageModule(config);
    const whatsapp = new WhatsAppModule(config);
    super(config, storage, whatsapp);
    this.storage = storage;
    this.whatsapp = whatsapp;
  }
}

declare global {
  interface Window {
    CmsSDK?: typeof CmsSDK;
  }
}

if (typeof window !== "undefined") {
  window.CmsSDK = CmsSDK;
}

export * from "../types.js";
export default CmsSDK;
