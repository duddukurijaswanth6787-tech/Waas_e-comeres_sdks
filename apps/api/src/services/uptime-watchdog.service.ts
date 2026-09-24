import { prisma } from "../db/prisma.js";
import { telegramService } from "./telegram.service.js";
import { checkDomainLiveHealth, DomainLiveHealthResult } from "../modules/admin/client.routes.js";

interface StoreState {
  isLive: boolean;
  statusText: string;
  checkedUrl: string;
  lastAlertedAt?: number;
}

export class UptimeWatchdogService {
  private storeStates: Map<string, StoreState> = new Map();
  private watchdogInterval: NodeJS.Timeout | undefined;
  private isChecking = false;

  /**
   * Evaluates a single client health result and dispatches Telegram alerts on state transitions
   */
  public async evaluateClientHealth(
    clientId: string,
    businessName: string,
    primaryDomain: string
  ): Promise<DomainLiveHealthResult> {
    const health = await checkDomainLiveHealth(primaryDomain);
    const prevState = this.storeStates.get(clientId);
    const now = Date.now();

    // 🚨 CASE 1: Store was ONLINE (or first check) and is now OFFLINE
    if (!health.isLive) {
      const shouldAlert =
        !prevState || // First check and down
        prevState.isLive === true || // Transition from Online -> Offline
        (prevState.lastAlertedAt && now - prevState.lastAlertedAt > 1000 * 60 * 60); // 1-hour quiet reminder if still down

      if (shouldAlert && telegramService.isConfigured()) {
        console.log(`🚨 [Watchdog] Detected downtime for ${businessName} (${health.checkedUrl}). Alerting Telegram...`);
        telegramService
          .sendServerDowntimeAlert(
            businessName,
            health.checkedUrl,
            health.statusText || "Connection Refused (Server Down)",
            clientId
          )
          .catch((err) => console.error("[Watchdog Alert Error]:", err));

        this.storeStates.set(clientId, {
          isLive: false,
          statusText: health.statusText,
          checkedUrl: health.checkedUrl,
          lastAlertedAt: now,
        });
      }
    }

    // 🟢 CASE 2: Store was OFFLINE and has now RECOVERED (Back Online)
    if (health.isLive && prevState && prevState.isLive === false) {
      console.log(`🟢 [Watchdog] Detected recovery for ${businessName} (${health.checkedUrl}). Alerting Telegram...`);
      if (telegramService.isConfigured()) {
        telegramService
          .sendServerRestoredAlert(businessName, health.checkedUrl, health.responseTimeMs)
          .catch((err) => console.error("[Watchdog Alert Error]:", err));
      }
      this.storeStates.set(clientId, {
        isLive: true,
        statusText: health.statusText,
        checkedUrl: health.checkedUrl,
        lastAlertedAt: now,
      });
    }

    // Save active state
    if (health.isLive) {
      this.storeStates.set(clientId, {
        isLive: true,
        statusText: health.statusText,
        checkedUrl: health.checkedUrl,
        lastAlertedAt: prevState?.lastAlertedAt,
      });
    }

    return health;
  }

  /**
   * Scans all connected stores across the platform
   */
  public async checkAllStoresNow(): Promise<void> {
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      const clients = await prisma.client.findMany({
        select: { id: true, businessName: true, primaryDomain: true },
      });

      for (const client of clients) {
        await this.evaluateClientHealth(client.id, client.businessName, client.primaryDomain);
      }
    } catch (err) {
      console.error("[Watchdog Scan Error]:", err);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Starts the continuous background heartbeat watchdog (runs every 15 seconds)
   */
  public start(intervalMs = 15000): void {
    clearInterval(this.watchdogInterval);
    console.log(`⚡ [Uptime Watchdog] Active & monitoring storefronts every ${intervalMs / 1000}s...`);

    // Run first scan after 3 seconds
    setTimeout(() => {
      this.checkAllStoresNow().catch(console.error);
    }, 3000);

    this.watchdogInterval = setInterval(() => {
      this.checkAllStoresNow().catch(console.error);
    }, intervalMs);
  }

  public stop(): void {
    clearInterval(this.watchdogInterval);
  }
}

export const uptimeWatchdogService = new UptimeWatchdogService();
