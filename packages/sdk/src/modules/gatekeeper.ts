import { BoutiqueConfig, ClientStatus } from "../types.js";

export class GatekeeperModule {
  public readonly config: BoutiqueConfig;
  private statusData: ClientStatus | null = null;
  private overlayElement: HTMLElement | null = null;
  private bannerElement: HTMLElement | null = null;
  private heartbeatTimer: number | null = null;
  private isChecking = false;

  constructor(config: BoutiqueConfig) {
    this.config = config;
    this.initRealtimeGatekeeper();
  }

  /**
   * Initializes instant real-time heartbeat polling and event listeners
   */
  private initRealtimeGatekeeper(): void {
    if (typeof window === "undefined") return;

    // Immediate check on initial page load
    this.checkStatus(true).catch((err) => {
      if (this.config.debug) console.warn("[BoutiqueSDK:Gatekeeper] Initial check error:", err);
    });

    // Start live heartbeat every 3.5 seconds to react immediately to Super Admin actions
    clearInterval(this.heartbeatTimer as number);
    this.heartbeatTimer = window.setInterval(() => {
      this.checkStatus(true).catch(() => {});
    }, 3500);

    // Re-verify immediately on tab focus / visibility return
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.checkStatus(true).catch(() => {});
      }
    });
    window.addEventListener("focus", () => {
      this.checkStatus(true).catch(() => {});
    });
  }

  /**
   * Checks subscription status with backend or local TTL cache
   */
  public async checkStatus(forceRefresh = false): Promise<ClientStatus> {
    if (this.isChecking && forceRefresh) {
      return this.statusData || ({} as ClientStatus);
    }
    this.isChecking = true;

    const cacheKey = `boutique_status_${this.config.clientId}`;
    const url = `${this.config.apiUrl || "http://localhost:5000"}/api/v1/client/status`;

    try {
      if (forceRefresh && typeof window !== "undefined") {
        localStorage.removeItem(cacheKey);
      }

      if (!forceRefresh && typeof window !== "undefined") {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as { data: ClientStatus; expires: number };
            if (Date.now() < parsed.expires) {
              this.statusData = parsed.data;
              this.applyStatusToDOM(parsed.data);
              return parsed.data;
            }
          } catch {
            // ignore cache error
          }
        }
      }

      let response: Response;
      try {
        response = await fetch(url, {
          method: "GET",
          headers: {
            "x-client-id": this.config.clientId,
            "x-public-key": this.config.publicKey,
          },
        });
      } catch {
        throw new Error("[BoutiqueSDK:Gatekeeper] Network error: Cannot reach central server.");
      }

      // 🔴 Handle 403 Unauthorized Domain Origin
      if (response.status === 403) {
        if (typeof window !== "undefined") {
          localStorage.removeItem(cacheKey);
        }
        const errData = await response.json().catch(() => ({}));
        console.error("[BoutiqueSDK:Gatekeeper] 403 Forbidden Domain:", errData);
        this.renderUnauthorizedDomainLock(errData.currentDomain || window.location.hostname);
        throw new Error(errData.message || "403 Forbidden: Unauthorized Domain Origin");
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error("[BoutiqueSDK:Gatekeeper] Status verification failed:", err);
        throw new Error(`[BoutiqueGatekeeper] Failed to verify status: ${response.statusText}`);
      }

      const status: ClientStatus = await response.json();
      this.statusData = status;

      if (this.config.debug) {
        console.log(
          `%c[BoutiqueSDK:Gatekeeper] Live Status Received: %c${status.status} (${status.environmentMode || "LIVE"} Mode)`,
          "color: #6366f1; font-weight: bold;",
          status.status === "ACTIVE" || status.status === "TESTING" ? "color: #10b981; font-weight: bold;" : "color: #ef4444; font-weight: bold;",
          status
        );
      }

      // Cache for 30 seconds for quick suspension / renewal sync
      if (typeof window !== "undefined") {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: status,
            expires: Date.now() + 30 * 1000,
          })
        );
        this.applyStatusToDOM(status);
      }

      return status;
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Applies appropriate UI gates (Testing Mode, Normal, Grace Period Banner, or Suspended Lock Screen)
   */
  public applyStatusToDOM(status: ClientStatus): void {
    if (typeof document === "undefined") return;

    // 1. Remove existing banners/overlays
    this.removeOverlay();
    this.removeBanner();

    // 🔴 2. High Priority: Explicit SUSPENDED or EXPIRED State (Full Screen Lockdown)
    if (status.status === "SUSPENDED" || status.status === "EXPIRED") {
      this.renderSuspensionLockScreen(status);
      return;
    }

    // 🟡 3. Handle TESTING Mode (Free Testing & Verification)
    if (status.status === "TESTING" || status.environmentMode === "TESTING") {
      document.body.style.filter = "none";
      document.body.style.pointerEvents = "auto";
      return;
    }

    // 🟢 4. Handle ACTIVE Live State
    if (status.status === "ACTIVE") {
      document.body.style.filter = "none";
      document.body.style.pointerEvents = "auto";
      return;
    }

    // 🟡 4. Handle GRACE_PERIOD State:
    // Keep public storefront 100% clean for normal customers; show warning banner ONLY inside store owner /admin console
    if (status.status === "GRACE_PERIOD") {
      const isAdminRoute = typeof window !== "undefined" && (
        window.location.pathname.includes("admin") || 
        window.location.hash.includes("admin") ||
        window.location.search.includes("admin") ||
        !!localStorage.getItem("boutique_store_token")
      );

      if (isAdminRoute) {
        const daysLeft = Math.max(
          0,
          Math.ceil((new Date(status.gracePeriodEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        );
        this.renderGraceBanner(daysLeft);
      }
      return;
    }

    // 🟠 5. Handle PENDING_FIRST_PAYMENT State (Initial Store Activation Paywall)
    if (status.status === "PENDING_FIRST_PAYMENT") {
      this.renderFirstPaymentActivationScreen(status);
      return;
    }

    // Default fallback
    document.body.style.filter = "none";
    document.body.style.pointerEvents = "auto";
  }

  private renderGraceBanner(daysLeft: number): void {
    const banner = document.createElement("div");
    banner.id = "boutique-grace-banner";
    banner.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 99999;
      background: #1e1b4b;
      color: #e0e7ff;
      border: 1px solid #6366f1;
      padding: 14px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 420px;
    `;

    banner.innerHTML = `
      <div style="font-size: 20px;">⚠️</div>
      <div style="flex: 1;">
        <strong>Subscription Renewal Notice:</strong>
        <div style="font-size: 12px; color: #a5b4fc; margin-top: 2px;">
          Grace period active (${daysLeft} day${daysLeft === 1 ? "" : "s"} left). Please renew to avoid website suspension.
        </div>
      </div>
      <button id="boutique-pay-banner-btn" style="
        background: #4f46e5;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        font-size: 12px;
      ">Pay</button>
    `;

    document.body.appendChild(banner);
    this.bannerElement = banner;

    const btn = document.getElementById("boutique-pay-banner-btn");
    btn?.addEventListener("click", () => {
      const globalInst = (window as unknown as { boutique?: { billing?: { openRenewalModal: () => void } } }).boutique;
      if (globalInst?.billing) {
        globalInst.billing.openRenewalModal();
      }
    });
  }

  private renderFirstPaymentActivationScreen(status: ClientStatus): void {
    document.body.style.filter = "blur(8px)";
    document.body.style.userSelect = "none";
    document.body.style.pointerEvents = "none";

    const overlay = document.createElement("div");
    overlay.id = "boutique-suspension-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 2147483647;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(16px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
      color: #f8fafc;
      pointer-events: auto;
    `;

    overlay.innerHTML = `
      <div style="
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 28px;
        padding: 40px;
        max-width: 480px;
        width: 90%;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2);
        color: #0f172a;
      ">
        <div style="
          width: 64px;
          height: 64px;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 28px;
        ">✨</div>

        <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 6px; color: #0f172a;">
          Activate Your Boutique Website
        </h2>
        <div style="display: inline-block; background: #eef2ff; color: #4f46e5; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 9999px; margin-bottom: 16px;">
          ${status.planName} • ₹${status.priceInrMonthly || 799}/month
        </div>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 28px;">
          Your custom boutique website is ready! Please complete your first month's subscription payment to activate your store admin and start your 30-day billing cycle.
        </p>

        <button id="boutique-activate-pay-btn" style="
          width: 100%;
          background: #4f46e5;
          color: #ffffff;
          border: none;
          padding: 15px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
        ">
          ⚡ Pay ₹${status.priceInrMonthly || 799} &amp; Launch Website
        </button>

        <div style="margin-top: 16px; font-size: 12px; color: #94a3b8;">
          Instant activation via PhonePe, Google Pay, Paytm &amp; UPI
        </div>
      </div>
    `;

    document.documentElement.appendChild(overlay);
    this.overlayElement = overlay;

    document.getElementById("boutique-activate-pay-btn")?.addEventListener("click", () => {
      const globalInst = (window as unknown as { boutique?: { billing?: { openRenewalModal: () => void } } }).boutique;
      if (globalInst?.billing) {
        globalInst.billing.openRenewalModal();
      }
    });
  }

  private renderSuspensionLockScreen(status: ClientStatus): void {
    document.body.style.filter = "blur(8px)";
    document.body.style.userSelect = "none";
    document.body.style.pointerEvents = "none";

    const overlay = document.createElement("div");
    overlay.id = "boutique-suspension-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 2147483647;
      background: rgba(2, 6, 23, 0.88);
      backdrop-filter: blur(16px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
      color: #f8fafc;
      pointer-events: auto;
    `;

    const isManualSuspension = Boolean(status.isManualOverride && status.status === "SUSPENDED");
    const supportPhone = this.config.whatsappNumber || "917660922416";
    const formattedPhone = supportPhone.startsWith("91") ? `+91 ${supportPhone.slice(2)}` : supportPhone;

    if (isManualSuspension) {
      overlay.innerHTML = `
        <div style="
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 24px;
          padding: 40px;
          max-width: 480px;
          width: 90%;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        ">
          <div style="
            width: 64px;
            height: 64px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 28px;
          ">🔒</div>

          <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #f8fafc;">
            ${status.businessName || "Boutique Website"}
          </h2>
          <div style="display: inline-block; background: rgba(239, 68, 68, 0.2); color: #fca5a5; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px;">
            ACCOUNT SUSPENDED BY ADMIN
          </div>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 28px;">
            This website has been temporarily suspended by the administrator. Please contact support to resolve this issue and reactivate your account.
          </p>

          <a href="https://wa.me/${supportPhone}?text=Hi%2C%20my%20website%20is%20suspended.%20Please%20help%20me%20reactivate%20my%20account." target="_blank" rel="noopener noreferrer" style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            box-sizing: border-box;
            background: #128C7E;
            color: #ffffff;
            text-decoration: none;
            padding: 14px;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            box-shadow: 0 4px 14px rgba(18, 140, 126, 0.4);
            transition: background 0.2s;
          ">
            💬 Contact Support: ${formattedPhone}
          </a>

          <div style="margin-top: 16px; font-size: 12px; color: #64748b;">
            Direct support assistance &amp; manual account clearance
          </div>
        </div>
      `;
    } else {
      overlay.innerHTML = `
        <div style="
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 24px;
          padding: 40px;
          max-width: 480px;
          width: 90%;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        ">
          <div style="
            width: 64px;
            height: 64px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 28px;
          ">🔒</div>

          <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #f8fafc;">
            ${status.businessName || "Boutique Website"}
          </h2>
          <div style="display: inline-block; background: rgba(239, 68, 68, 0.2); color: #fca5a5; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px;">
            SUBSCRIPTION RENEWAL OVERDUE
          </div>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 28px;">
            This website is currently undergoing its scheduled subscription renewal. If you are the boutique owner, you can reactivate it instantly below.
          </p>

          <button id="boutique-lock-renew-btn" style="
            width: 100%;
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: #ffffff;
            border: none;
            padding: 14px;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
            transition: transform 0.1s;
          ">
            ⚡ Pay Renewal &amp; Unlock Instantly (UPI / Card)
          </button>

          <div style="margin-top: 16px; font-size: 12px; color: #64748b;">
            Instant automated reactivation via Razorpay
          </div>
        </div>
      `;
    }

    document.documentElement.appendChild(overlay);
    this.overlayElement = overlay;

    if (!isManualSuspension) {
      const renewBtn = document.getElementById("boutique-lock-renew-btn");
      renewBtn?.addEventListener("click", () => {
        const globalInst = (window as unknown as { boutique?: { billing?: { openRenewalModal: () => void } } }).boutique;
        if (globalInst?.billing) {
          globalInst.billing.openRenewalModal();
        }
      });
    }
  }

  private renderUnauthorizedDomainLock(hostname: string): void {
    document.body.style.filter = "blur(10px)";
    document.body.style.userSelect = "none";
    document.body.style.pointerEvents = "none";

    const overlay = document.createElement("div");
    overlay.id = "boutique-suspension-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 2147483647;
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(16px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
      color: #f8fafc;
      pointer-events: auto;
    `;

    overlay.innerHTML = `
      <div style="
        background: #0f172a;
        border: 1px solid #dc2626;
        border-radius: 24px;
        padding: 40px;
        max-width: 480px;
        width: 90%;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(220, 38, 38, 0.3);
      ">
        <div style="
          width: 64px;
          height: 64px;
          background: rgba(220, 38, 38, 0.15);
          border: 1px solid rgba(220, 38, 38, 0.4);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 28px;
        ">🛡️</div>

        <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #f8fafc;">
          Unauthorized Domain Origin
        </h2>
        <div style="display: inline-block; background: rgba(220, 38, 38, 0.2); color: #fca5a5; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px;">
          DOMAIN: ${hostname} NOT WHITELISTED
        </div>
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin-bottom: 20px;">
          This ClientID is protected by domain whitelist security. The domain <strong style="color: #f8fafc;">${hostname}</strong> is not authorized to use this boutique's license.
        </p>
        <div style="font-size: 12px; color: #64748b;">
          Please whitelist <span style="font-family: monospace; color: #a5b4fc;">${hostname}</span> in your Super Admin Dashboard.
        </div>
      </div>
    `;

    document.documentElement.appendChild(overlay);
    this.overlayElement = overlay;
  }

  public removeOverlay(): void {
    const existing = document.getElementById("boutique-suspension-overlay");
    if (existing) existing.remove();
    document.body.style.removeProperty("filter");
    document.body.style.removeProperty("pointer-events");
    document.body.style.removeProperty("user-select");
  }

  public removeBanner(): void {
    const existing = document.getElementById("boutique-grace-banner");
    if (existing) existing.remove();
  }
}
