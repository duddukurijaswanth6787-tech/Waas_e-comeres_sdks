import { BoutiqueConfig } from "../types.js";
import { GatekeeperModule } from "./gatekeeper.js";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

export class BillingModule {
  public readonly config: BoutiqueConfig;
  public readonly gatekeeper: GatekeeperModule;

  constructor(config: BoutiqueConfig, gatekeeper: GatekeeperModule) {
    this.config = config;
    this.gatekeeper = gatekeeper;
  }

  /**
   * Dynamically loads Razorpay checkout script if not present
   */
  public async loadRazorpayScript(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    if (window.Razorpay) return true;

    const { promise, resolve } = Promise.withResolvers<boolean>();

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.head.appendChild(script);
    return promise;
  }

  /**
   * Opens Razorpay renewal or upgrade modal and auto-unlocks upon payment
   */
  public async openRenewalModal(options: { planId?: string; billingCycle?: "MONTHLY" | "YEARLY" } = {}): Promise<void> {
    const apiUrl = this.config.apiUrl || "http://localhost:5000";

    // 1. Ensure Razorpay script loaded
    await this.loadRazorpayScript();

    // 2. Create order on backend
    const orderResponse = await fetch(`${apiUrl}/api/v1/billing/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": this.config.clientId,
        "x-public-key": this.config.publicKey,
      },
      body: JSON.stringify({
        planId: options.planId,
        billingCycle: options.billingCycle || "MONTHLY",
      }),
    });

    if (!orderResponse.ok) {
      alert("Failed to initiate renewal order. Please try again or contact support.");
      return;
    }

    const orderData = await orderResponse.json();

    // 3. Launch Razorpay UI
    if (!window.Razorpay) {
      // Fallback direct mock confirmation in dev
      await this.verifyAndUnlock(orderData.orderId, "mock_pay_" + Date.now(), options);
      return;
    }

    const rzp = new window.Razorpay({
      key: orderData.keyId,
      amount: orderData.amountPaise,
      currency: orderData.currency || "INR",
      name: orderData.businessName || "Boutique Website",
      description: `Subscription Renewal (${orderData.planName})`,
      order_id: orderData.orderId,
      prefill: {
        contact: orderData.ownerPhone,
      },
      theme: {
        color: "#4f46e5",
      },
      handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature?: string }) => {
        await this.verifyAndUnlock(response.razorpay_order_id, response.razorpay_payment_id, options);
      },
    });

    rzp.open();
  }

  public async verifyAndUnlock(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    options: { planId?: string; billingCycle?: "MONTHLY" | "YEARLY" }
  ): Promise<void> {
    const apiUrl = this.config.apiUrl || "http://localhost:5000";

    const verifyResponse = await fetch(`${apiUrl}/api/v1/billing/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": this.config.clientId,
        "x-public-key": this.config.publicKey,
      },
      body: JSON.stringify({
        razorpayOrderId,
        razorpayPaymentId,
        planId: options.planId,
        billingCycle: options.billingCycle || "MONTHLY",
      }),
    });

    if (verifyResponse.ok) {
      // Instantly remove suspension overlays and refresh status
      this.gatekeeper.removeOverlay();
      this.gatekeeper.removeBanner();
      await this.gatekeeper.checkStatus(true);
      alert("🎉 Payment Successful! Your website subscription is active.");
    }
  }
}
