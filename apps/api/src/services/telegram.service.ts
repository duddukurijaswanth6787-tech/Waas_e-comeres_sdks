import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { checkDomainLiveHealth } from "../modules/admin/client.routes.js";
interface InlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export class TelegramService {
  private botToken: string | undefined;
  private authorizedChatId: string | undefined;
  private isPolling = false;
  private lastUpdateId = 0;

  constructor() {
    this.botToken = env.TELEGRAM_BOT_TOKEN;
    this.authorizedChatId = env.TELEGRAM_CHAT_ID;
  }

  public isConfigured(): boolean {
    return Boolean(this.botToken && this.authorizedChatId);
  }

  // --- CORE TELEGRAM API SENDER ---
  public async sendMessage(
    text: string,
    options: {
      chatId?: string;
      parseMode?: "HTML" | "Markdown";
      inlineKeyboard?: InlineButton[][];
    } = {}
  ): Promise<boolean> {
    if (!this.botToken) {
      console.warn("[Telegram] Bot token not configured.");
      return false;
    }

    const chatId = options.chatId || this.authorizedChatId;
    if (!chatId) {
      console.warn("[Telegram] Chat ID not configured.");
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const body: Record<string, unknown> = {
        chat_id: chatId,
        text,
        parse_mode: options.parseMode || "HTML",
        disable_web_page_preview: true,
      };

      if (options.inlineKeyboard && options.inlineKeyboard.length > 0) {
        body.reply_markup = {
          inline_keyboard: options.inlineKeyboard,
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { ok: boolean; description?: string };
      if (!data.ok) {
        console.error("[Telegram API Error]:", data.description);
        return false;
      }
      return true;
    } catch (err) {
      console.error("[Telegram Send Error]:", err);
      return false;
    }
  }

  // --- 12 AUTOMATED REAL-TIME ALERT DISPATCHERS ---

  /** 1. Server Offline / Downtime Alert */
  public async sendServerDowntimeAlert(
    storeName: string,
    domain: string,
    error: string,
    clientId?: string
  ): Promise<void> {
    const text = `🚨 <b>CRITICAL ALERT: Website Server Down!</b>\n\n` +
      `🏬 <b>Store:</b> ${storeName}\n` +
      `🌐 <b>Domain:</b> <code>${domain}</code>\n` +
      `⚠️ <b>Error:</b> ${error}\n` +
      `⏱️ <b>Time:</b> ${new Date().toLocaleTimeString("en-IN")} (${new Date().toLocaleDateString("en-IN")})\n\n` +
      `<i>Client customers cannot access the storefront while server is down.</i>`;

    const inlineKeyboard: InlineButton[][] = [];
    if (clientId) {
      inlineKeyboard.push([
        { text: "⚡ Check Health", callback_data: `health_${clientId}` },
        { text: "🏬 View Store", callback_data: `store_${clientId}` },
      ]);
    }

    await this.sendMessage(text, { inlineKeyboard });
  }

  /** 2. Server Restored / Back Online Alert */
  public async sendServerRestoredAlert(
    storeName: string,
    domain: string,
    responseTimeMs: number
  ): Promise<void> {
    const text = `🟢 <b>RECOVERY ALERT: Website Back Online!</b>\n\n` +
      `🏬 <b>Store:</b> ${storeName}\n` +
      `🌐 <b>Domain:</b> <code>${domain}</code>\n` +
      `⚡ <b>Response Time:</b> ${responseTimeMs}ms (200 OK)\n` +
      `⏱️ <b>Restored At:</b> ${new Date().toLocaleTimeString("en-IN")}`;

    await this.sendMessage(text);
  }

  /** 3. Razorpay Subscription Payment Captured */
  public async sendPaymentCapturedAlert(
    storeName: string,
    planName: string,
    amountInr: number,
    paymentId: string,
    validUntil: Date
  ): Promise<void> {
    const text = `🎉 <b>PAYMENT CAPTURED: ₹${amountInr.toLocaleString("en-IN")}</b>\n\n` +
      `🏬 <b>Store:</b> ${storeName}\n` +
      `💎 <b>Subscription Plan:</b> ${planName}\n` +
      `💳 <b>Razorpay ID:</b> <code>${paymentId}</code>\n` +
      `📅 <b>Next Renewal Due:</b> ${validUntil.toLocaleDateString("en-IN")}\n` +
      `🟢 <b>Storefront Status:</b> Auto-Unlocked (ACTIVE)\n\n` +
      `<i>30-day billing cycle activated automatically in PostgreSQL.</i>`;

    await this.sendMessage(text);
  }

  /** 4. Renewal Due Countdown Alert */
  public async sendRenewalDueAlert(
    storeName: string,
    ownerName: string,
    ownerPhone: string,
    amountInr: number,
    expiresAt: Date,
    daysLeft: number
  ): Promise<void> {
    const text = `⏳ <b>UPCOMING RENEWAL: ${daysLeft} Day${daysLeft === 1 ? "" : "s"} Left!</b>\n\n` +
      `🏬 <b>Store:</b> ${storeName}\n` +
      `👤 <b>Owner:</b> ${ownerName} (+${ownerPhone})\n` +
      `💰 <b>Amount Due:</b> ₹${amountInr.toLocaleString("en-IN")}\n` +
      `📅 <b>Expires On:</b> ${expiresAt.toLocaleDateString("en-IN")}\n\n` +
      `<i>Send reminder to client to prevent automated store suspension.</i>`;

    const inlineKeyboard: InlineButton[][] = [
      [
        {
          text: "💬 Remind on WhatsApp",
          url: `https://wa.me/${ownerPhone}?text=${encodeURIComponent(
            `Hello ${ownerName}, your boutique subscription for ${storeName} (₹${amountInr}) is due on ${expiresAt.toLocaleDateString("en-IN")}. Please renew from your /admin dashboard.`
          )}`,
        },
      ],
    ];

    await this.sendMessage(text, { inlineKeyboard });
  }

  /** 5. Quota Warning Alert */
  public async sendQuotaWarningAlert(
    storeName: string,
    currentImages: number,
    maxImages: number,
    currentStorageMb: string,
    maxStorageGb: string
  ): Promise<void> {
    const pct = Math.round((currentImages / maxImages) * 100);
    const text = `⚠️ <b>S3 QUOTA WARNING: ${pct}% Used!</b>\n\n` +
      `🏬 <b>Store:</b> ${storeName}\n` +
      `📸 <b>Photos Used:</b> ${currentImages} / ${maxImages} Photos\n` +
      `☁️ <b>Storage Used:</b> ${currentStorageMb} MB / ${maxStorageGb} GB\n\n` +
      `<i>Client is approaching photo limits. Great opportunity to upsell next tier!</i>`;

    await this.sendMessage(text);
  }

  /** 6. New Live Customer Order Placed */
  public async sendNewCustomerOrderAlert(
    storeName: string,
    orderNumber: string,
    customerName: string,
    customerPhone: string,
    totalAmountInr: number,
    itemCount: number,
    paymentMethod: string
  ): Promise<void> {
    const text = `🛒 <b>NEW CUSTOMER ORDER: ${orderNumber}</b>\n\n` +
      `🏬 <b>Store:</b> ${storeName}\n` +
      `👤 <b>Customer:</b> ${customerName} (+${customerPhone})\n` +
      `📦 <b>Items:</b> ${itemCount} item(s)\n` +
      `💰 <b>Total:</b> ₹${totalAmountInr.toLocaleString("en-IN")} (${paymentMethod})\n` +
      `⏱️ <b>Time:</b> ${new Date().toLocaleTimeString("en-IN")}`;

    await this.sendMessage(text);
  }

  /** 7. Store Suspended Alert */
  public async sendStoreSuspendedAlert(storeName: string, reason: string): Promise<void> {
    const text = `🛑 <b>STORE SUSPENDED</b>\n\n` +
      `🏬 <b>Store:</b> ${storeName}\n` +
      `🔒 <b>Reason:</b> ${reason}\n` +
      `⏱️ <b>Action:</b> Master Killswitch overlay active on client storefront.`;

    await this.sendMessage(text);
  }

  /** 8. Store Activated Alert */
  public async sendStoreActivatedAlert(storeName: string): Promise<void> {
    const text = `🟢 <b>STORE ACTIVATED & UNLOCKED</b>\n\n` +
      `🏬 <b>Store:</b> ${storeName}\n` +
      `✨ <b>Status:</b> ACTIVE (All lock screens removed in real-time).`;

    await this.sendMessage(text);
  }

  /** 9. Security Rogue Domain Blocked */
  public async sendSecurityRogueDomainAlert(
    storeName: string,
    rogueDomain: string,
    clientId: string
  ): Promise<void> {
    const text = `🛡️ <b>SECURITY GUARD: Rogue Domain Blocked!</b>\n\n` +
      `🏬 <b>Store:</b> ${storeName}\n` +
      `🔑 <b>ClientID:</b> <code>${clientId}</code>\n` +
      `🚫 <b>Attacking Domain:</b> <code>${rogueDomain}</code>\n` +
      `🔒 <b>Enforcement:</b> HTTP 403 Forbidden & Access Denied\n\n` +
      `<i>Unauthorized third-party domain attempted to use client API keys.</i>`;

    await this.sendMessage(text);
  }

  /** 10. Staff Registered Alert */
  public async sendStaffRegisteredAlert(
    storeName: string,
    staffName: string,
    role: string,
    email: string
  ): Promise<void> {
    const text = `👥 <b>NEW STAFF ACCOUNT CREATED</b>\n\n` +
      `🏬 <b>Store:</b> ${storeName}\n` +
      `👤 <b>Staff:</b> ${staffName} (${role})\n` +
      `✉️ <b>Email:</b> <code>${email}</code>`;

    await this.sendMessage(text);
  }

  /** 11. Daily Midnight Summary Alert */
  public async sendDailyMidnightSummaryAlert(): Promise<void> {
    const clients = await prisma.client.findMany({
      include: { subscription: { include: { plan: true } } },
    });

    const activeCount = clients.filter(
      (c) => c.subscription?.status === "ACTIVE" || c.subscription?.environmentMode === "TESTING"
    ).length;

    const totalMrr = clients.reduce(
      (acc, c) => acc + (c.subscription?.plan?.priceInrMonthly || 0),
      0
    );

    const text = `📊 <b>DAILY MIDNIGHT EXECUTIVE SUMMARY</b>\n\n` +
      `🏬 <b>Total Stores:</b> ${clients.length}\n` +
      `🟢 <b>Active Stores:</b> ${activeCount} / ${clients.length}\n` +
      `💰 <b>Platform MRR:</b> ₹${totalMrr.toLocaleString("en-IN")}\n` +
      `📅 <b>Date:</b> ${new Date().toLocaleDateString("en-IN")}\n\n` +
      `<i>All central PostgreSQL & AWS S3 systems operating normally.</i>`;

    await this.sendMessage(text);
  }

  // --- INTERACTIVE COMMAND HANDLERS ---

  private async handleStoresCommand(chatId: string): Promise<void> {
    const clients = await prisma.client.findMany({
      include: {
        subscription: { include: { plan: true } },
        media: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (clients.length === 0) {
      await this.sendMessage("ℹ️ No boutique stores onboarded yet.", { chatId });
      return;
    }

    let text = `🏬 <b>CONNECTED BOUTIQUE STORES (${clients.length})</b>\n\n`;

    clients.forEach((c, idx) => {
      const sub = c.subscription;
      const statusIcon =
        sub?.status === "ACTIVE"
          ? "🟢"
          : sub?.status === "TESTING"
          ? "🟡"
          : sub?.status === "GRACE_PERIOD"
          ? "🟠"
          : "🔴";
      const planName = sub?.plan?.name || "Standard";
      const price = sub?.plan?.priceInrMonthly || 2499;
      const photos = c.media.length;
      const maxP = sub?.plan?.maxImages || 150;

      text += `${idx + 1}. ${statusIcon} <b>${c.businessName}</b>\n` +
        `   • <b>ID:</b> <code>${c.id}</code>\n` +
        `   • <b>Domain:</b> <code>${c.primaryDomain}</code>\n` +
        `   • <b>Plan:</b> ${planName} (₹${price}/mo)\n` +
        `   • <b>Photos:</b> ${photos}/${maxP} | <b>Status:</b> ${sub?.status || "TESTING"}\n\n`;
    });

    const inlineKeyboard: InlineButton[][] = [
      [
        { text: "⚡ Ping All Health", callback_data: "cmd_health" },
        { text: "💰 View Revenue", callback_data: "cmd_revenue" },
      ],
    ];

    await this.sendMessage(text, { chatId, inlineKeyboard });
  }

  private async handleHealthCommand(chatId: string): Promise<void> {
    await this.sendMessage("⚡ <i>Pinging all client storefronts in real-time...</i>", { chatId });

    const clients = await prisma.client.findMany({
      select: { id: true, businessName: true, primaryDomain: true },
      orderBy: { createdAt: "desc" },
    });

    let text = `⚡ <b>LIVE STOREFRONT HEALTH REPORT</b>\n\n`;
    let onlineCount = 0;

    for (const c of clients) {
      const health = await checkDomainLiveHealth(c.primaryDomain);
      if (health.isLive) {
        onlineCount++;
        text += `🟢 <b>${c.businessName}</b>: 200 OK (${health.responseTimeMs}ms)\n` +
          `   └ <code>${health.checkedUrl}</code>\n\n`;
      } else if (health.status === "DEGRADED") {
        text += `🟠 <b>${c.businessName}</b>: HTTP ${health.statusCode} (${health.responseTimeMs}ms)\n` +
          `   └ <code>${health.checkedUrl}</code>\n\n`;
      } else {
        text += `🔴 <b>${c.businessName}</b>: ${health.statusText}\n` +
          `   └ <code>${health.checkedUrl}</code>\n\n`;
      }
    }

    text += `📊 <b>Summary:</b> ${onlineCount}/${clients.length} Storefronts Online.`;
    await this.sendMessage(text, { chatId });
  }

  private async handleRevenueCommand(chatId: string): Promise<void> {
    const clients = await prisma.client.findMany({
      include: { subscription: { include: { plan: true } } },
    });

    const invoices = await prisma.subscriptionInvoice.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { client: true },
    });

    const paidInvoices = invoices.filter((inv) => inv.status === "PAID");
    const totalPaid = paidInvoices.reduce((acc, inv) => acc + inv.amountInr, 0);

    const activeClients = clients.filter((c) => c.subscription?.status === "ACTIVE");
    const activeMRR = activeClients.reduce((acc, c) => acc + (c.subscription?.plan?.priceInrMonthly || 0), 0);

    const pendingClients = clients.filter((c) => c.subscription?.status !== "ACTIVE");
    const pendingRevenue = pendingClients.reduce((acc, c) => acc + (c.subscription?.plan?.priceInrMonthly || 2499), 0);

    let text = `💰 <b>AGENCY REVENUE & BILLING OVERVIEW</b>\n\n` +
      `💵 <b>Realized Paid Revenue:</b> ₹${totalPaid.toLocaleString("en-IN")}\n` +
      `⏳ <b>Pending / Due Subscriptions:</b> ₹${pendingRevenue.toLocaleString("en-IN")}\n` +
      `📈 <b>Active Monthly Recurring (MRR):</b> ₹${activeMRR.toLocaleString("en-IN")}\n` +
      `🏬 <b>Stores:</b> ${activeClients.length} Active / ${clients.length} Total\n\n` +
      `🧾 <b>Recent Invoices:</b>\n`;

    if (paidInvoices.length === 0) {
      text += `<i>No paid invoices generated yet. (Clients in Testing/Pending mode).</i>`;
    } else {
      paidInvoices.forEach((inv) => {
        text += `• ₹${inv.amountInr.toLocaleString("en-IN")} - <b>${inv.client?.businessName || "Boutique"}</b> (PAID • ${new Date(inv.createdAt).toLocaleDateString("en-IN")})\n`;
      });
    }

    await this.sendMessage(text, { chatId });
  }

  private async handleOrdersCommand(chatId: string): Promise<void> {
    const orders = await prisma.storeOrder.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { client: true },
    });

    if (orders.length === 0) {
      await this.sendMessage("🛒 <b>Recent Customer Orders:</b>\n\n<i>No customer orders placed yet.</i>", { chatId });
      return;
    }

    let text = `🛒 <b>RECENT CUSTOMER ORDERS (Last 5)</b>\n\n`;
    orders.forEach((o) => {
      text += `• <b>${o.orderNumber}</b> - ₹${o.totalAmountInr.toLocaleString("en-IN")}\n` +
        `  🏬 <b>Store:</b> ${o.client?.businessName || "Store"}\n` +
        `  👤 <b>Customer:</b> ${o.customerName} (+${o.customerPhone})\n` +
        `  📦 <b>Status:</b> ${o.status} | 💳 ${o.paymentMethod}\n\n`;
    });

    await this.sendMessage(text, { chatId });
  }

  private async handleStoreDetail(query: string, chatId: string): Promise<void> {
    const cleanQuery = query.toLowerCase().trim();
    const client = await prisma.client.findFirst({
      where: {
        OR: [
          { id: { contains: cleanQuery } },
          { businessName: { contains: cleanQuery } },
          { primaryDomain: { contains: cleanQuery } },
        ],
      },
      include: {
        subscription: { include: { plan: true } },
        media: true,
        orders: { take: 3, orderBy: { createdAt: "desc" } },
      },
    });

    if (!client) {
      await this.sendMessage(`❓ Store matching "<b>${query}</b>" not found in database.`, { chatId });
      return;
    }

    const sub = client.subscription;
    const plan = sub?.plan;
    const currentStorageMb = (
      client.media.reduce((acc, m) => acc + Number(m.fileSizeBytes), 0) /
      (1024 * 1024)
    ).toFixed(2);
    const maxStorageGb = plan?.maxStorageBytes
      ? (Number(plan.maxStorageBytes) / (1024 * 1024 * 1024)).toFixed(1)
      : "10.0";

    const text = `🏬 <b>STORE PROFILE: ${client.businessName}</b>\n\n` +
      `🔑 <b>ClientID:</b> <code>${client.id}</code>\n` +
      `🌐 <b>Primary Domain:</b> <code>${client.primaryDomain}</code>\n` +
      `👤 <b>Owner:</b> ${client.ownerName} (+${client.ownerPhone})\n` +
      `📍 <b>Location:</b> ${client.storeAddress || client.city || "Hyderabad"}\n` +
      `📸 <b>Instagram:</b> ${client.instagramHandle || "N/A"}\n\n` +
      `💎 <b>Active Plan:</b> ${plan?.name || "Standard"} (₹${plan?.priceInrMonthly || 2499}/mo)\n` +
      `🟢 <b>Status:</b> ${sub?.status || "TESTING"}\n` +
      `📸 <b>Photos Quota:</b> ${client.media.length} / ${plan?.maxImages || 150} used\n` +
      `☁️ <b>Storage Quota:</b> ${currentStorageMb} MB / ${maxStorageGb} GB\n` +
      `📅 <b>Period End:</b> ${sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN") : "N/A"}`;

    const isSuspended = sub?.status === "SUSPENDED";
    const inlineKeyboard: InlineButton[][] = [
      [
        isSuspended
          ? { text: "🟢 Unlock Store", callback_data: `activate_${client.id}` }
          : { text: "🛑 Suspend Store", callback_data: `suspend_${client.id}` },
        { text: "⏰ Extend 7 Days", callback_data: `extend_${client.id}_7` },
      ],
    ];

    await this.sendMessage(text, { chatId, inlineKeyboard });
  }

  private async handleSuspendStore(clientId: string, chatId: string): Promise<void> {
    try {
      await prisma.clientSubscription.update({
        where: { clientId },
        data: { status: "SUSPENDED", isManualOverride: true },
      });
      await this.sendMessage(`🛑 <b>Store ${clientId} SUSPENDED!</b>\nMaster Killswitch blur lock active.`, {
        chatId,
      });
    } catch {
      await this.sendMessage(`❌ Failed to suspend store ${clientId}.`, { chatId });
    }
  }

  private async handleActivateStore(clientId: string, chatId: string): Promise<void> {
    try {
      await prisma.clientSubscription.update({
        where: { clientId },
        data: { status: "ACTIVE", isManualOverride: false },
      });
      await this.sendMessage(`🟢 <b>Store ${clientId} ACTIVATED!</b>\nLock screen removed in real-time.`, {
        chatId,
      });
    } catch {
      await this.sendMessage(`❌ Failed to activate store ${clientId}.`, { chatId });
    }
  }

  private async handleExtendStore(clientId: string, days: number, chatId: string): Promise<void> {
    try {
      const sub = await prisma.clientSubscription.findUnique({ where: { clientId } });
      if (!sub) throw new Error("Subscription not found");

      const newEnd = new Date(sub.currentPeriodEnd);
      newEnd.setDate(newEnd.getDate() + days);

      await prisma.clientSubscription.update({
        where: { clientId },
        data: { currentPeriodEnd: newEnd, status: "ACTIVE" },
      });

      await this.sendMessage(
        `⏰ <b>Extended ${clientId} by ${days} days!</b>\nNew expiration date: ${newEnd.toLocaleDateString("en-IN")}`,
        { chatId }
      );
    } catch {
      await this.sendMessage(`❌ Failed to extend store subscription.`, { chatId });
    }
  }

  // --- NATURAL LANGUAGE AI Q&A PROCESSOR ---
  private async processNaturalLanguageQuery(text: string, chatId: string): Promise<void> {
    const clean = text.toLowerCase().trim();

    // 1. Client / Store Count & Listing Questions
    const isCountOrListQuery =
      clean.includes("how many client") ||
      clean.includes("how many store") ||
      clean.includes("how many boutique") ||
      clean.includes("how many merchant") ||
      clean.includes("clients are there") ||
      clean.includes("stores are there") ||
      clean.includes("list client") ||
      clean.includes("list store") ||
      clean.includes("show client") ||
      clean.includes("show store") ||
      clean.includes("all client") ||
      clean.includes("all store") ||
      clean.includes("all boutique") ||
      clean.includes("who are the client") ||
      clean.includes("who are my client") ||
      clean.includes("total client") ||
      clean.includes("total store");

    if (isCountOrListQuery) {
      await this.handleStoresCommand(chatId);
      return;
    }

    // 2. Actions: Suspend Intent
    if (clean.startsWith("suspend") || clean.startsWith("block") || clean.startsWith("lock")) {
      const target = clean.replace(/suspend|block|lock/g, "").trim();
      if (target) {
        const c = await prisma.client.findFirst({
          where: {
            OR: [{ id: { contains: target } }, { businessName: { contains: target } }],
          },
        });
        if (c) {
          await this.handleSuspendStore(c.id, chatId);
          return;
        }
      }
    }

    // 3. Actions: Activate Intent
    if (clean.startsWith("activate") || clean.startsWith("unlock") || clean.startsWith("enable")) {
      const target = clean.replace(/activate|unlock|enable/g, "").trim();
      if (target) {
        const c = await prisma.client.findFirst({
          where: {
            OR: [{ id: { contains: target } }, { businessName: { contains: target } }],
          },
        });
        if (c) {
          await this.handleActivateStore(c.id, chatId);
          return;
        }
      }
    }

    // 4. Specific Store Match by Name (Vasanti, Ramu, etc.)
    const allClients = await prisma.client.findMany({
      select: { id: true, businessName: true, primaryDomain: true },
    });

    const matchedClient = allClients.find((c) => {
      const bName = c.businessName.toLowerCase();
      const firstWord = bName.split(/\s+/)[0];
      return clean.includes(bName) || clean.includes(c.id.toLowerCase()) || clean.includes(firstWord);
    });

    if (matchedClient) {
      // If question specifically asks about storage/photos
      if (clean.includes("storage") || clean.includes("photo") || clean.includes("quota") || clean.includes("media") || clean.includes("space")) {
        await this.handleStoreDetail(matchedClient.id, chatId);
        return;
      }
      // If question asks about orders
      if (clean.includes("order") || clean.includes("sale") || clean.includes("customer")) {
        await this.handleOrdersCommand(chatId);
        return;
      }
      // Otherwise show full store profile & live status
      await this.handleStoreDetail(matchedClient.id, chatId);
      return;
    }

    // 5. General Revenue / MRR / Invoices Questions
    if (clean.includes("revenue") || clean.includes("mrr") || clean.includes("income") || clean.includes("money") || clean.includes("earn") || clean.includes("invoice") || clean.includes("billing")) {
      await this.handleRevenueCommand(chatId);
      return;
    }

    // 6. General Orders / Sales Questions
    if (clean.includes("order") || clean.includes("orders") || clean.includes("sale") || clean.includes("sales") || clean.includes("purchase")) {
      await this.handleOrdersCommand(chatId);
      return;
    }

    // 7. General Health / Uptime / Server Questions
    if (clean.includes("health") || clean.includes("status") || clean.includes("live") || clean.includes("online") || clean.includes("offline") || clean.includes("server") || clean.includes("down") || clean.includes("uptime") || clean.includes("ping")) {
      await this.handleHealthCommand(chatId);
      return;
    }

    // 8. Default Fallback: Menu with helpful context
    await this.sendWelcomeMenu(chatId);
  }

  private async sendWelcomeMenu(chatId: string): Promise<void> {
    const text = `🤖 <b>BOUTIQUE SAAS AGENCY CONSOLE</b>\n\n` +
      `Welcome! I am your 24/7 central platform management bot. You can monitor live stores, manage S3 storage quotas, track revenue, and trigger instant killswitches.\n\n` +
      `⚡ <b>Quick Commands:</b>\n` +
      `• /stores — View all connected boutique stores\n` +
      `• /health — Ping all storefronts in real-time\n` +
      `• /revenue — View monthly revenue & paid invoices\n` +
      `• /orders — View recent customer orders\n` +
      `• <i>Or just ask me any question in plain English!</i>`;

    const inlineKeyboard: InlineButton[][] = [
      [
        { text: "🏬 All Stores", callback_data: "cmd_stores" },
        { text: "⚡ Health Ping", callback_data: "cmd_health" },
      ],
      [
        { text: "💰 Revenue & MRR", callback_data: "cmd_revenue" },
        { text: "🛒 Live Orders", callback_data: "cmd_orders" },
      ],
    ];

    await this.sendMessage(text, { chatId, inlineKeyboard });
  }

  // --- CONTINUOUS LONG-POLLING ENGINE ---
  public async startPolling(): Promise<void> {
    if (!this.botToken || this.isPolling) return;
    this.isPolling = true;
    console.log("🤖 [Telegram Bot] Polling service active & listening for commands...");

    const poll = async () => {
      if (!this.isPolling) return;
      try {
        const url = `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=20`;
        const res = await fetch(url);
        if (res.ok) {
          const data = (await res.json()) as {
            ok: boolean;
            result: Array<{
              update_id: number;
              message?: {
                chat: { id: number };
                text?: string;
              };
              callback_query?: {
                id: string;
                from: { id: number };
                data?: string;
                message?: { chat: { id: number } };
              };
            }>;
          };

          if (data.ok && Array.isArray(data.result)) {
            for (const update of data.result) {
              this.lastUpdateId = update.update_id;

              // Handle Button Clicks
              if (update.callback_query) {
                const cbChatId = String(update.callback_query.message?.chat.id || update.callback_query.from.id);
                if (cbChatId !== this.authorizedChatId) {
                  await this.sendMessage("⛔ Unauthorized account.", { chatId: cbChatId });
                  continue;
                }

                const action = update.callback_query.data || "";
                if (action === "cmd_stores") await this.handleStoresCommand(cbChatId);
                else if (action === "cmd_health") await this.handleHealthCommand(cbChatId);
                else if (action === "cmd_revenue") await this.handleRevenueCommand(cbChatId);
                else if (action === "cmd_orders") await this.handleOrdersCommand(cbChatId);
                else if (action.startsWith("store_")) await this.handleStoreDetail(action.replace("store_", ""), cbChatId);
                else if (action.startsWith("suspend_")) await this.handleSuspendStore(action.replace("suspend_", ""), cbChatId);
                else if (action.startsWith("activate_")) await this.handleActivateStore(action.replace("activate_", ""), cbChatId);
                else if (action.startsWith("extend_")) {
                  const parts = action.split("_");
                  await this.handleExtendStore(parts[1], Number(parts[2]) || 7, cbChatId);
                }
              }

              // Handle Text Messages & Commands
              if (update.message && update.message.text) {
                const msgChatId = String(update.message.chat.id);
                if (msgChatId !== this.authorizedChatId) {
                  await this.sendMessage("⛔ <b>403 Unauthorized:</b> Your Telegram account is not authorized.", {
                    chatId: msgChatId,
                  });
                  continue;
                }

                const msg = update.message.text.trim();
                if (msg === "/start" || msg === "/help") await this.sendWelcomeMenu(msgChatId);
                else if (msg === "/stores") await this.handleStoresCommand(msgChatId);
                else if (msg === "/health") await this.handleHealthCommand(msgChatId);
                else if (msg === "/revenue" || msg === "/mrr") await this.handleRevenueCommand(msgChatId);
                else if (msg === "/orders") await this.handleOrdersCommand(msgChatId);
                else if (msg.startsWith("/store ")) await this.handleStoreDetail(msg.replace("/store ", "").trim(), msgChatId);
                else if (msg.startsWith("/suspend ")) await this.handleSuspendStore(msg.replace("/suspend ", "").trim(), msgChatId);
                else if (msg.startsWith("/activate ")) await this.handleActivateStore(msg.replace("/activate ", "").trim(), msgChatId);
                else {
                  await this.processNaturalLanguageQuery(msg, msgChatId);
                }
              }
            }
          }
        }
      } catch {
        // Polling network retry
      }

      if (this.isPolling) {
        setTimeout(poll, 1000);
      }
    };

    poll();
  }

  public stopPolling(): void {
    this.isPolling = false;
  }
}

export const telegramService = new TelegramService();
