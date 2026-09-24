import { BoutiqueConfig, ClientStatus, MediaItem, SubscriptionPlanSummary } from "../types.js";
import { StorageModule } from "./storage.js";
import { GatekeeperModule } from "./gatekeeper.js";
import { BillingModule } from "./billing.js";

export class AdminModule {
  public readonly config: BoutiqueConfig;
  public readonly storage: StorageModule;
  public readonly gatekeeper: GatekeeperModule;
  public readonly billing: BillingModule;
  private activeSecretKey: string | null = null;

  constructor(
    config: BoutiqueConfig,
    storage: StorageModule,
    gatekeeper: GatekeeperModule,
    billing: BillingModule
  ) {
    this.config = config;
    this.storage = storage;
    this.gatekeeper = gatekeeper;
    this.billing = billing;
    this.activeSecretKey = config.secretKey || null;
  }

  /**
   * Mounts complete boutique admin dashboard in any HTML element
   */
  public async mount(containerSelector: string | HTMLElement): Promise<void> {
    if (typeof document === "undefined") return;
    const container = typeof containerSelector === "string" ? document.querySelector(containerSelector) : containerSelector;
    if (!container) {
      console.error(`[BoutiqueAdmin] Container '${containerSelector}' not found`);
      return;
    }

    // Check if authenticated in sessionStorage
    const sessionKey = `boutique_admin_session_${this.config.clientId}`;
    const savedSecret = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(sessionKey) : null;
    if (savedSecret) {
      this.activeSecretKey = savedSecret;
    }

    // If not authenticated, render Store Owner Login Screen
    if (!this.activeSecretKey) {
      this.renderLoginScreen(container as HTMLElement);
      return;
    }

    // Render Full Dashboard
    this.renderDashboard(container as HTMLElement);
  }

  private renderLoginScreen(container: HTMLElement): void {
    const apiUrl = this.config.apiUrl || "http://localhost:5000";

    container.innerHTML = `
      <div style="box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; max-width: 440px; margin: 40px auto; padding: 32px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); position: relative; z-index: 10;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 56px; height: 56px; background: #eef2ff; border: 1px solid #e0e7ff; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 24px; color: #4f46e5;">👗</div>
          <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 4px;">Store Owner Login</h2>
          <p style="font-size: 13px; color: #64748b; margin: 0;">Sign in to manage boutique collection & renewals</p>
        </div>

        <form id="boutique-admin-login-form" style="display: flex; flex-direction: column; gap: 14px;">
          <div id="boutique-login-error" style="display: none; padding: 10px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; font-size: 12px; color: #b91c1c; font-weight: 500; text-align: center;"></div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: #334155; margin-bottom: 4px;">Admin Username</label>
            <input id="boutique-login-username" type="text" placeholder="e.g. admin or phone" required style="width: 100%; box-sizing: border-box; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 13px; outline: none; background: #f8fafc;" />
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: #334155; margin-bottom: 4px;">Store Password</label>
            <input id="boutique-login-password" type="password" placeholder="••••••••" required style="width: 100%; box-sizing: border-box; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 13px; outline: none; background: #f8fafc;" />
          </div>

          <button id="boutique-login-btn" type="submit" style="width: 100%; margin-top: 8px; background: #4f46e5; color: #ffffff; border: none; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
            Sign In to Dashboard
          </button>
        </form>
      </div>
    `;

    const form = document.getElementById("boutique-admin-login-form");
    const errorEl = document.getElementById("boutique-login-error");
    const btn = document.getElementById("boutique-login-btn") as HTMLButtonElement;

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const usernameInput = (document.getElementById("boutique-login-username") as HTMLInputElement).value;
      const passwordInput = (document.getElementById("boutique-login-password") as HTMLInputElement).value;

      if (btn) btn.textContent = "Verifying...";
      if (errorEl) errorEl.style.display = "none";

      try {
        const response = await fetch(`${apiUrl}/api/v1/client/admin/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-client-id": this.config.clientId,
            "x-public-key": this.config.publicKey,
          },
          body: JSON.stringify({ username: usernameInput, password: passwordInput }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Invalid store username or password");
        }

        const data = await response.json();
        this.activeSecretKey = data.secretApiKey;
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(`boutique_admin_session_${this.config.clientId}`, data.secretApiKey);
        }

        this.renderDashboard(container);
      } catch (err: unknown) {
        if (errorEl) {
          errorEl.textContent = (err as Error).message || "Login failed";
          errorEl.style.display = "block";
        }
        if (btn) btn.textContent = "Sign In to Dashboard";
      }
    });
  }

  private async renderDashboard(container: HTMLElement): Promise<void> {
    const render = async () => {
      let status: ClientStatus;
      try {
        status = await this.gatekeeper.checkStatus(true);
      } catch (err) {
        console.error(err);
        return;
      }

      // 🟠 Handle First Payment Activation Gate
      if (status.status === "PENDING_FIRST_PAYMENT") {
        container.innerHTML = `
          <div style="box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; max-width: 520px; margin: 50px auto; padding: 36px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 28px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05); text-align: center;">
            <div style="width: 60px; height: 60px; background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 28px;">✨</div>
            <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 6px;">Activate Your Store Admin</h2>
            <div style="display: inline-block; background: #eef2ff; color: #4f46e5; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; margin-bottom: 14px;">
              ${status.planName} • ₹${status.priceInrMonthly || 799}/month
            </div>
            <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0 0 24px;">
              Welcome to <strong>${status.businessName}</strong>! Please complete your first month's subscription payment to unlock your photo uploader and start your 30-day billing cycle.
            </p>
            <button id="boutique-admin-first-pay-btn" style="width: 100%; background: #4f46e5; color: #ffffff; border: none; padding: 14px; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
              ⚡ Pay ₹${status.priceInrMonthly || 799} &amp; Unlock Store Admin
            </button>
            <div style="margin-top: 14px; font-size: 11px; color: #94a3b8;">Instant activation via UPI, Google Pay, PhonePe &amp; Cards</div>
          </div>
        `;

        document.getElementById("boutique-admin-first-pay-btn")?.addEventListener("click", () => {
          this.billing.openRenewalModal();
        });
        return;
      }

      // 🟢 Full Dashboard Render (Testing Mode or Active Live Mode)
      const isTestMode = status.status === "TESTING" || status.environmentMode === "TESTING";

      container.innerHTML = `
        <div style="box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; width: 100%; max-width: 1000px; margin: 0 auto; padding: 24px 16px; color: #1e293b; isolation: isolate; position: relative; clear: both;">
          
          ${isTestMode ? `
            <div style="background: #fefce8; border: 1px solid #fef08a; border-radius: 16px; padding: 12px 18px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #854d0e;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>🟡</span>
                <span><strong>Testing / Development Mode Active:</strong> You can test photo uploads & features freely with zero payment walls. Subscription cycle is frozen.</span>
              </div>
            </div>
          ` : ""}

          <!-- TOP HEADER SECTION -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="display: flex; flex-direction: column; md:flex-row; justify-content: space-between; align-items: flex-start; gap: 16px;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 24px;">👗</span>
                  <h1 style="font-size: 22px; font-weight: 800; margin: 0; color: #0f172a; letter-spacing: -0.02em;">Store Admin Dashboard</h1>
                </div>
                <div id="boutique-admin-sub-tag" style="font-size: 13px; color: #64748b; margin-top: 6px; font-weight: 500;">
                  ${status.businessName} • Plan: ${status.planName} • Status: ${status.status}
                </div>
              </div>

              <!-- ACTION BUTTONS TOOLBAR -->
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; width: 100%; md:width: auto; justify-content: flex-start;">
                <button id="boutique-admin-compare-plans-btn" style="
                  background: #eef2ff;
                  color: #4f46e5;
                  border: 1px solid #c7d2fe;
                  padding: 8px 14px;
                  border-radius: 12px;
                  font-size: 12px;
                  font-weight: 600;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                ">💎 Compare Plans &amp; Upgrade</button>

                <button id="boutique-admin-pwd-btn" style="
                  background: #f8fafc;
                  color: #334155;
                  border: 1px solid #cbd5e1;
                  padding: 8px 12px;
                  border-radius: 12px;
                  font-size: 12px;
                  font-weight: 600;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                ">🔒 Password</button>

                <button id="boutique-admin-renew-top-btn" style="
                  background: #4f46e5;
                  color: white;
                  border: none;
                  padding: 8px 16px;
                  border-radius: 12px;
                  font-size: 12px;
                  font-weight: 600;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.25);
                ">⚡ Pay Renewal</button>

                <button id="boutique-admin-logout-btn" style="
                  background: #fef2f2;
                  color: #dc2626;
                  border: 1px solid #fecaca;
                  padding: 8px 12px;
                  border-radius: 12px;
                  font-size: 12px;
                  font-weight: 600;
                  cursor: pointer;
                ">Sign Out</button>
              </div>
            </div>
          </div>

          <!-- OVER-QUOTA NOTICE BANNER -->
          <div id="boutique-admin-plan-update-banner" style="${(status.isOverQuota || status.currentImagesCount > status.maxImages) ? "display: block;" : "display: none;"} margin-bottom: 24px; background: #fefce8; border: 1px solid #fef08a; border-radius: 20px; padding: 18px; color: #854d0e; font-size: 13px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 260px;">
                <strong style="font-size: 14px; display: block; margin-bottom: 2px;">📢 Plan Quota Notice:</strong>
                <p style="margin: 0; color: #a16207; line-height: 1.5;">
                  Your boutique currently has ${status.currentImagesCount} photos, which exceeds the plan limit of ${status.maxImages} photos. All existing photos remain live on your website. To upload more dresses or upgrade storage capacity, please choose a plan below.
                </p>
              </div>
              <button id="boutique-banner-upgrade-btn" style="background: #eab308; color: #000; font-weight: 700; border: none; padding: 9px 16px; border-radius: 10px; font-size: 12px; cursor: pointer; white-space: nowrap;">
                Upgrade Plan Now &rarr;
              </button>
            </div>
          </div>

          <!-- QUOTA PROGRESS CARD -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div style="font-size: 14px; font-weight: 700; color: #0f172a;">Plan Storage &amp; S3 Quotas</div>
              <div style="font-size: 13px; font-weight: 800; color: #4f46e5;">₹${status.priceInrMonthly || 799}/month</div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
              <div style="background: #f8fafc; padding: 16px; border-radius: 16px; border: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; margin-bottom: 8px;">
                  <span style="color: #334155;">Photos: ${status.currentImagesCount} / ${status.maxImages}</span>
                  <span style="color: #4f46e5;">${Math.min(100, Math.round((status.currentImagesCount / status.maxImages) * 100))}%</span>
                </div>
                <div style="height: 10px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;">
                  <div style="height: 100%; width: ${Math.min(100, Math.round((status.currentImagesCount / status.maxImages) * 100))}%; background: #4f46e5; border-radius: 9999px; transition: width 0.3s;"></div>
                </div>
              </div>
              <div style="background: #f8fafc; padding: 16px; border-radius: 16px; border: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; margin-bottom: 8px;">
                  <span style="color: #334155;">Storage: ${(status.currentStorageBytes / (1024 * 1024)).toFixed(1)} MB / ${(status.maxStorageBytes / (1024 * 1024)).toFixed(0)} MB</span>
                  <span style="color: #0891b2;">${Math.min(100, Math.round((status.currentStorageBytes / status.maxStorageBytes) * 100))}%</span>
                </div>
                <div style="height: 10px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;">
                  <div style="height: 100%; width: ${Math.min(100, Math.round((status.currentStorageBytes / status.maxStorageBytes) * 100))}%; background: #0891b2; border-radius: 9999px; transition: width 0.3s;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- PHOTO UPLOAD SECTION -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 16px; color: #0f172a;">Add New Collection Dress</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 16px;">
              <div>
                <label style="display: block; font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 4px;">Dress Name / Title</label>
                <input id="boutique-upload-title" type="text" placeholder="e.g. Royal Bridal Saree" style="width: 100%; box-sizing: border-box; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 13px; outline: none; background: #f8fafc;" />
              </div>
              <div>
                <label style="display: block; font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 4px;">Price in INR (₹)</label>
                <input id="boutique-upload-price" type="number" placeholder="e.g. 18500" style="width: 100%; box-sizing: border-box; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 13px; outline: none; background: #f8fafc;" />
              </div>
            </div>
            <div style="border: 2px dashed #cbd5e1; border-radius: 16px; padding: 32px 16px; text-align: center; cursor: pointer; background: #f8fafc; transition: background 0.2s;" id="boutique-dropzone">
              <input type="file" id="boutique-file-input" accept="image/*" style="display: none;" />
              <div style="font-size: 32px; margin-bottom: 8px;">📷</div>
              <div style="font-size: 14px; font-weight: 700; color: #1e293b;">Click to select or drag boutique photo here</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Automatic in-browser WebP compression &amp; direct AWS S3 upload</div>
            </div>
            <div id="boutique-upload-status" style="margin-top: 12px; font-size: 13px; font-weight: 600;"></div>
          </div>

          <!-- GALLERY MANAGER -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="font-size: 16px; font-weight: 700; margin: 0; color: #0f172a;">Uploaded Collection Catalog</h3>
              <span style="font-size: 12px; color: #64748b;">Live dresses displayed on your website</span>
            </div>
            <div id="boutique-admin-photos-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px;">
              <div style="color: #94a3b8; font-size: 13px;">Loading photos...</div>
            </div>
          </div>
        </div>
      `;

      // Load Photos
      const loadPhotosGrid = async () => {
        const grid = document.getElementById("boutique-admin-photos-grid");
        if (!grid) return;
        try {
          const items = await this.storage.fetchMedia();
          if (items.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; color: #94a3b8; font-size: 13px; padding: 24px 0; text-align: center;">No dresses uploaded yet. Use the uploader above to add your first saree.</div>`;
            return;
          }
          grid.innerHTML = items
            .map(
              (item: MediaItem) => `
              <div style="border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column;">
                <div style="position: relative; padding-top: 100%; background: #f8fafc;">
                  <img src="${item.fileUrl}" style="position: absolute; top:0; left:0; width:100%; height:100%; object-fit: cover;" />
                </div>
                <div style="padding: 12px; display: flex; flex-direction: column; justify-content: space-between; flex: 1;">
                  <div>
                    <div style="font-size: 13px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title || "Dress"}</div>
                    ${item.price ? `<div style="font-size: 12px; color: #d97706; font-weight: 800; margin-top: 2px;">₹${item.price.toLocaleString("en-IN")}</div>` : ""}
                  </div>
                  <button class="boutique-delete-photo-btn" data-id="${item.id}" style="
                    margin-top: 10px; width: 100%; background: #fee2e2; color: #ef4444; border: none; padding: 6px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer;
                  ">Delete</button>
                </div>
              </div>
            `
            )
            .join("");

          grid.querySelectorAll(".boutique-delete-photo-btn").forEach((btn) => {
            btn.addEventListener("click", async (e) => {
              const id = (e.currentTarget as HTMLElement).dataset.id;
              if (id && confirm("Are you sure you want to delete this photo?")) {
                await this.storage.delete(id);
                render();
              }
            });
          });
        } catch (err) {
          console.error(err);
        }
      };
      loadPhotosGrid();

      // Bind Dropzone & Upload
      const dropzone = document.getElementById("boutique-dropzone");
      const fileInput = document.getElementById("boutique-file-input") as HTMLInputElement;
      const statusEl = document.getElementById("boutique-upload-status");

      dropzone?.addEventListener("click", () => fileInput?.click());
      fileInput?.addEventListener("change", async () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        const titleInput = document.getElementById("boutique-upload-title") as HTMLInputElement;
        const priceInput = document.getElementById("boutique-upload-price") as HTMLInputElement;

        if (statusEl) {
          statusEl.style.color = "#4f46e5";
          statusEl.textContent = "Compressing & uploading to AWS S3...";
        }

        try {
          await this.storage.upload(file, {
            title: titleInput?.value || undefined,
            price: priceInput?.value ? Number(priceInput.value) : undefined,
          });
          if (statusEl) {
            statusEl.style.color = "#16a34a";
            statusEl.textContent = "✓ Upload successful!";
          }
          if (titleInput) titleInput.value = "";
          if (priceInput) priceInput.value = "";
          fileInput.value = "";
          setTimeout(render, 800);
        } catch (err: unknown) {
          if (statusEl) {
            statusEl.style.color = "#ef4444";
            statusEl.textContent = (err as Error).message || "Upload failed";
          }
        }
      });

      // Bind Logout
      document.getElementById("boutique-admin-logout-btn")?.addEventListener("click", () => {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem(`boutique_admin_session_${this.config.clientId}`);
        }
        this.activeSecretKey = null;
        this.renderLoginScreen(container);
      });

      // Bind Password & Plan Comparison
      document.getElementById("boutique-admin-pwd-btn")?.addEventListener("click", () => {
        this.renderChangePasswordModal();
      });

      document.getElementById("boutique-admin-compare-plans-btn")?.addEventListener("click", () => {
        this.renderPlanComparisonModal();
      });

      document.getElementById("boutique-banner-upgrade-btn")?.addEventListener("click", () => {
        this.renderPlanComparisonModal();
      });

      document.getElementById("boutique-admin-renew-top-btn")?.addEventListener("click", () => {
        this.billing.openRenewalModal();
      });
    };

    render();
  }

  /**
   * Renders the interactive Plan Comparison & Upgrade Modal for the boutique owner
   */
  public async renderPlanComparisonModal(): Promise<void> {
    if (typeof document === "undefined") return;
    const apiUrl = this.config.apiUrl || "http://localhost:5000";

    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 999999;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, sans-serif;
      padding: 16px;
    `;

    modal.innerHTML = `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 28px; padding: 32px; max-width: 780px; width: 100%; color: #0f172a; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); max-height: 90vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h3 style="font-size: 20px; font-weight: 700; margin: 0 0 4px; color: #0f172a;">Compare &amp; Choose Subscription Plan</h3>
            <p style="font-size: 13px; color: #64748b; margin: 0;">Select a plan to upgrade photo limits and cloud storage capacity.</p>
          </div>
          <button id="boutique-plans-modal-close" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #94a3b8;">✕</button>
        </div>

        <div id="boutique-plans-modal-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div style="text-align: center; color: #94a3b8; padding: 20px;">Loading subscription plans...</div>
        </div>

        <div style="text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; pt: 16px;">
          Instant automated upgrade via Razorpay UPI / Card
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("boutique-plans-modal-close")?.addEventListener("click", () => modal.remove());

    // Fetch and render plans
    try {
      const response = await fetch(`${apiUrl}/api/v1/client/plans`, {
        headers: {
          "x-client-id": this.config.clientId,
          "x-public-key": this.config.publicKey,
        },
      });

      if (!response.ok) throw new Error("Failed to load plans");
      const plans: SubscriptionPlanSummary[] = await response.json();

      const cardsContainer = document.getElementById("boutique-plans-modal-cards");
      if (cardsContainer) {
        cardsContainer.innerHTML = plans
          .map(
            (p) => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; text-align: center;">
              <div>
                <h4 style="font-size: 16px; font-weight: 700; margin: 0 0 8px; color: #1e293b;">${p.name}</h4>
                <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">₹${p.priceInrMonthly.toLocaleString("en-IN")}<span style="font-size: 12px; color: #64748b; font-weight: normal;">/mo</span></div>
                <div style="font-size: 11px; color: #16a34a; font-weight: 600; margin-bottom: 16px;">₹${p.priceInrYearly.toLocaleString("en-IN")}/year (Discounted)</div>

                <div style="text-align: left; font-size: 12px; color: #475569; display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; border-top: 1px solid #e2e8f0; padding-top: 14px;">
                  <div>📸 <strong>${p.maxImages} Photos</strong> Limit</div>
                  <div>☁️ <strong>${(p.maxStorageBytes / (1024 * 1024 * 1024)).toFixed(1)} GB</strong> Cloud Storage</div>
                  <div>👥 Staff: <strong>${p.allowStaffAccounts ?? 2} Accounts</strong></div>
                  <div>🛍️ Cart &amp; Checkout: <strong>${p.allowOnlineCart ?? true ? "Enabled" : "Disabled"}</strong></div>
                  <div>📦 Inventory &amp; CRM: <strong>${p.allowInventory ?? true ? "Enabled" : "Disabled"}</strong></div>
                  <div>🏷️ Coupons Engine: <strong>${p.allowCoupons ?? true ? "Enabled" : "Disabled"}</strong></div>
                  <div>🤖 AI Sales Bot: <strong>${p.allowAiSalesBot ? "Enterprise Bot" : "Disabled"}</strong></div>
                  <div>🌐 Custom Domain: <strong>${p.allowCustomDomain ?? true ? "Enabled" : "Disabled"}</strong></div>
                </div>
              </div>

              <button class="boutique-select-plan-upgrade-btn" data-plan-id="${p.id}" style="width: 100%; background: #4f46e5; color: #ffffff; border: none; padding: 10px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 6px rgba(79, 70, 229, 0.2);">
                Select &amp; Upgrade &rarr;
              </button>
            </div>
          `
          )
          .join("");

        cardsContainer.querySelectorAll(".boutique-select-plan-upgrade-btn").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const planId = (e.currentTarget as HTMLElement).dataset.planId;
            modal.remove();
            this.billing.openRenewalModal({ planId });
          });
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  private renderChangePasswordModal(): void {
    if (typeof document === "undefined") return;
    const apiUrl = this.config.apiUrl || "http://localhost:5000";

    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 999999;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, sans-serif;
    `;

    modal.innerHTML = `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 28px; max-width: 380px; width: 90%; color: #0f172a; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
        <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 4px;">Change Store Password</h3>
        <p style="font-size: 12px; color: #64748b; margin: 0 0 16px;">Update your credentials for store admin access.</p>

        <div id="boutique-pwd-modal-error" style="display: none; padding: 8px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; font-size: 11px; color: #b91c1c; margin-bottom: 12px;"></div>

        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
          <div>
            <label style="display: block; font-size: 11px; font-weight: 600; color: #334155; margin-bottom: 4px;">New Password</label>
            <input id="boutique-modal-new-pwd" type="password" placeholder="Min 6 characters" style="width: 100%; box-sizing: border-box; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12px;" />
          </div>
          <div>
            <label style="display: block; font-size: 11px; font-weight: 600; color: #334155; margin-bottom: 4px;">Update Username (Optional)</label>
            <input id="boutique-modal-new-user" type="text" placeholder="e.g. new_username" style="width: 100%; box-sizing: border-box; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12px;" />
          </div>
        </div>

        <div style="display: flex; gap: 8px;">
          <button id="boutique-modal-pwd-cancel" style="flex: 1; background: #f1f5f9; color: #475569; border: none; padding: 10px; border-radius: 10px; cursor: pointer; font-size: 12px; font-weight: 600;">Cancel</button>
          <button id="boutique-modal-pwd-save" style="flex: 1; background: #4f46e5; color: white; border: none; padding: 10px; border-radius: 10px; cursor: pointer; font-size: 12px; font-weight: 600;">Save Password</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("boutique-modal-pwd-cancel")?.addEventListener("click", () => modal.remove());
    document.getElementById("boutique-modal-pwd-save")?.addEventListener("click", async () => {
      const newPwd = (document.getElementById("boutique-modal-new-pwd") as HTMLInputElement).value;
      const newUser = (document.getElementById("boutique-modal-new-user") as HTMLInputElement).value;
      const errEl = document.getElementById("boutique-pwd-modal-error");

      if (!newPwd || newPwd.length < 6) {
        if (errEl) {
          errEl.textContent = "New password must be at least 6 characters.";
          errEl.style.display = "block";
        }
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/api/v1/client/admin/change-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-client-id": this.config.clientId,
            "x-secret-key": this.activeSecretKey || "",
          },
          body: JSON.stringify({ newPassword: newPwd, newUsername: newUser || undefined }),
        });

        if (response.ok) {
          modal.remove();
          alert("✓ Password updated successfully! Please remember your new password.");
        } else {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to update password");
        }
      } catch (err: unknown) {
        if (errEl) {
          errEl.textContent = (err as Error).message || "Update failed";
          errEl.style.display = "block";
        }
      }
    });
  }
}
