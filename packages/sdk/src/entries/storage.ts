import { StorageModule } from "../modules/storage.js";
import { BoutiqueConfig } from "../types.js";

export class StorageSDK extends StorageModule {
  constructor(config: BoutiqueConfig) {
    super(config);
  }
}

declare global {
  interface Window {
    StorageSDK?: typeof StorageSDK;
  }
}

if (typeof window !== "undefined") {
  window.StorageSDK = StorageSDK;
}

export * from "../types.js";
export default StorageSDK;
