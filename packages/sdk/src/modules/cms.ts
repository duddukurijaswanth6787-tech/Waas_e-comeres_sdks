import { BoutiqueConfig, GalleryMountOptions, MediaItem } from "../types.js";
import { StorageModule } from "./storage.js";
import { WhatsAppModule } from "./whatsapp.js";

export class CmsModule {
  public readonly config: BoutiqueConfig;
  public readonly storage: StorageModule;
  public readonly whatsapp: WhatsAppModule;

  constructor(config: BoutiqueConfig, storage: StorageModule, whatsapp: WhatsAppModule) {
    this.config = config;
    this.storage = storage;
    this.whatsapp = whatsapp;
  }

  /**
   * Mounts dynamic boutique collection gallery inside any CSS container
   */
  public async mountGallery(selector: string, options: GalleryMountOptions = {}): Promise<void> {
    if (typeof document === "undefined") return;

    const container = document.querySelector(selector);
    if (!container) {
      console.error(`[BoutiqueCMS] Container element '${selector}' not found`);
      return;
    }

    container.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; padding: 40px; color: #64748b; font-family: system-ui, sans-serif;">
        <div style="font-size: 14px;">Loading Boutique Collection...</div>
      </div>
    `;

    try {
      const items = await this.storage.fetchMedia();

      if (items.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 48px; color: #94a3b8; font-family: system-ui, sans-serif;">
            <div style="font-size: 32px; margin-bottom: 8px;">👗</div>
            <div style="font-size: 16px; font-weight: 600;">Collection Coming Soon</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 4px;">New arrivals will be showcased here shortly.</div>
          </div>
        `;
        return;
      }

      const columns = options.columns || 3;
      const grid = document.createElement("div");
      grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 24px;
        width: 100%;
        box-sizing: border-box;
      `;

      for (const item of items) {
        const card = document.createElement("div");
        card.style.cssText = `
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          border: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s, box-shadow 0.2s;
        `;

        if (options.customCardRenderer) {
          card.innerHTML = options.customCardRenderer(item);
        } else {
          const priceDisplay = item.price ? `₹${item.price.toLocaleString("en-IN")}` : "";
          card.innerHTML = `
            <div style="position: relative; width: 100%; padding-top: 125%; background: #f8fafc; overflow: hidden;">
              <img src="${item.fileUrl}" alt="${item.title || "Boutique Collection"}" style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.3s;
              " loading="lazy" />
            </div>
            <div style="padding: 16px; display: flex; flex-direction: column; flex: 1; justify-content: space-between;">
              <div>
                <h4 style="margin: 0 0 6px; font-size: 16px; font-weight: 600; color: #1e293b; font-family: system-ui, sans-serif;">
                  ${item.title || "Designer Collection"}
                </h4>
                ${priceDisplay ? `<div style="font-size: 15px; font-weight: 700; color: #d97706; margin-bottom: 12px; font-family: system-ui, sans-serif;">${priceDisplay}</div>` : ""}
              </div>
              <button class="boutique-wa-order-btn" data-item-id="${item.id}" style="
                width: 100%;
                background: #25D366;
                color: #ffffff;
                border: none;
                padding: 10px 14px;
                border-radius: 10px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                font-family: system-ui, sans-serif;
                box-shadow: 0 2px 8px rgba(37, 211, 102, 0.3);
              ">
                <span>💬 Order on WhatsApp</span>
              </button>
            </div>
          `;

          const waBtn = card.querySelector(".boutique-wa-order-btn");
          waBtn?.addEventListener("click", () => {
            this.whatsapp.openChat(item);
          });
        }

        grid.appendChild(card);
      }

      container.innerHTML = "";
      container.appendChild(grid);
    } catch (err) {
      console.error("[BoutiqueCMS] Failed to render collection:", err);
      container.innerHTML = `
        <div style="color: #ef4444; padding: 20px; text-align: center; font-family: system-ui, sans-serif;">
          Unable to load collection. Please try again later.
        </div>
      `;
    }
  }
}
