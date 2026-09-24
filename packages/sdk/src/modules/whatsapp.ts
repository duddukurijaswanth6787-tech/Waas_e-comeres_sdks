import { BoutiqueConfig, MediaItem } from "../types.js";

export class WhatsAppModule {
  private config: BoutiqueConfig;

  constructor(config: BoutiqueConfig) {
    this.config = config;
  }

  /**
   * Generates a pre-filled WhatsApp click-to-chat order URL
   */
  public generateOrderLink(product: Partial<MediaItem> & { name?: string; image?: string; size?: string }, customPhone?: string): string {
    const rawPhone = customPhone || this.config.whatsappNumber || "919999999999";
    const cleanPhone = rawPhone.replace(/[^0-9]/g, "");

    const title = product.title || product.name || product.fileName || "Collection Item";
    const priceText = product.price ? `\n- Price: Rs. ${product.price.toLocaleString("en-IN")}` : "";
    const sizeText = product.size ? `\n- Size: ${product.size}` : "";
    const mediaUrl = product.fileUrl || product.image;
    const imageText = mediaUrl ? `\n- Image: ${mediaUrl}` : "";

    const message = `Hello! I would like to order this item from your collection:
- Product: ${title}${sizeText}${priceText}${imageText}

Please share availability and payment details. Thank you!`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  /**
   * Opens WhatsApp chat directly
   */
  public openChat(product: MediaItem, customPhone?: string): void {
    if (typeof window === "undefined") return;
    const link = this.generateOrderLink(product, customPhone);
    window.open(link, "_blank", "noopener,noreferrer");
  }
}
