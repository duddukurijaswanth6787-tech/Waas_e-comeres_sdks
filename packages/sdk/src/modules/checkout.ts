import { BoutiqueConfig } from "../types.js";
import { CartModule, CheckoutPayload } from "./cart.js";

export class CheckoutModule {
  private config: BoutiqueConfig;
  private cart: CartModule;

  constructor(config: BoutiqueConfig, cart: CartModule) {
    this.config = config;
    this.cart = cart;
  }

  public async placeOrder(payload: CheckoutPayload): Promise<{
    success: boolean;
    orderId: string;
    orderNumber: string;
    totalAmountInr: number;
    paymentMethod: string;
  }> {
    const items = this.cart.getItems();
    if (items.length === 0) {
      throw new Error("Cannot checkout with an empty cart.");
    }

    const apiUrl = `${this.config.apiUrl || "http://localhost:5000"}/api/v1/ecom/orders`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": this.config.clientId,
        "x-public-key": this.config.publicKey,
      },
      body: JSON.stringify({
        ...payload,
        items,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to place order.");
    }

    const orderResult = await response.json();
    this.cart.clearCart();
    return orderResult;
  }
}
