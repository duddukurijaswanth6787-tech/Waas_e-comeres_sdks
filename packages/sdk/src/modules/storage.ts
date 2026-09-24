import { BoutiqueConfig, MediaItem, UploadOptions } from "../types.js";

export class StorageModule {
  public readonly config: BoutiqueConfig;

  constructor(config: BoutiqueConfig) {
    this.config = config;
  }

  /**
   * Compresses image client-side to modern WebP format
   */
  public async compressImage(file: File, maxWidth = 1920, quality = 0.82): Promise<Blob> {
    const { promise, resolve, reject } = Promise.withResolvers<Blob>();

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject(new Error("Canvas 2D context unavailable for WebP compression"));
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to compress image to WebP format"));
          }
        },
        "image/webp",
        quality
      );
    };
    img.onerror = () => reject(new Error("Invalid or corrupted image file"));

    return promise;
  }

  /**
   * Uploads an image with automatic quota checking and direct cloud upload
   */
  public async upload(file: File, options: UploadOptions = {}): Promise<MediaItem> {
    const apiUrl = this.config.apiUrl || "http://localhost:5000";

    // 0. Initial Validation
    if (!file) {
      throw new Error("No file selected for upload.");
    }
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files (JPG, PNG, WebP, AVIF) are supported.");
    }
    if (file.size > 25 * 1024 * 1024) {
      throw new Error("File size exceeds 25 MB. Please select a smaller photo.");
    }

    // 1. Client-Side WebP Compression
    let uploadBlob: Blob = file;
    let mimeType = file.type;
    let fileName = file.name;

    if (typeof document !== "undefined") {
      try {
        uploadBlob = await this.compressImage(file);
        mimeType = "image/webp";
        fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
        if (this.config.debug) {
          console.log(
            `%c[BoutiqueSDK:Storage] Compressed ${(file.size / (1024 * 1024)).toFixed(2)} MB -> ${(uploadBlob.size / 1024).toFixed(1)} KB WebP`,
            "color: #10b981; font-weight: bold;"
          );
        }
      } catch (err) {
        console.warn("[BoutiqueSDK:Storage] Compression fallback to original file:", err);
      }
    }

    const fileSizeBytes = uploadBlob.size;

    // 2. Request Presigned Upload URL & Validate Plan Quota
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "x-client-id": this.config.clientId,
    };
    if (this.config.secretKey) {
      requestHeaders["x-secret-key"] = this.config.secretKey;
    } else {
      requestHeaders["x-public-key"] = this.config.publicKey;
    }

    let preUploadResponse: Response;
    try {
      preUploadResponse = await fetch(`${apiUrl}/api/v1/storage/request-upload`, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          fileName,
          fileSizeBytes,
          mimeType,
          category: options.category || "collection",
        }),
      });
    } catch {
      throw new Error("Network error: Unable to reach the central upload server. Please check your internet connection.");
    }

    if (!preUploadResponse.ok) {
      const errorData = await preUploadResponse.json().catch(() => ({}));
      if (errorData.error === "QUOTA_EXCEEDED") {
        this.renderQuotaExceededModal(errorData.message);
      }
      throw new Error(errorData.message || `Upload request rejected (${preUploadResponse.statusText})`);
    }

    const { uploadUrl, publicUrl } = await preUploadResponse.json();

    // 3. Direct Upload to AWS S3
    const { promise: uploadPromise, resolve: resolveUpload, reject: rejectUpload } = Promise.withResolvers<void>();
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", mimeType);

    if (options.onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          options.onProgress?.(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolveUpload();
      } else {
        rejectUpload(new Error(`Cloud storage upload failed with status ${xhr.status}: ${xhr.statusText}`));
      }
    };
    xhr.onerror = () => rejectUpload(new Error("Network drop during direct cloud upload. Please retry."));
    xhr.send(uploadBlob);

    await uploadPromise;

    // 4. Confirm upload in Database
    let confirmResponse: Response;
    try {
      confirmResponse = await fetch(`${apiUrl}/api/v1/storage/confirm-upload`, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          fileName,
          fileUrl: publicUrl,
          fileSizeBytes,
          mimeType,
          category: options.category || "collection",
          title: options.title,
          price: options.price,
        }),
      });
    } catch {
      throw new Error("Image uploaded to S3 but failed to register in database. Please refresh your admin panel.");
    }

    if (!confirmResponse.ok) {
      const confirmErr = await confirmResponse.json().catch(() => ({}));
      throw new Error(confirmErr.message || "Failed to register photo in database.");
    }

    const confirmed = await confirmResponse.json();
    return confirmed.media;
  }

  /**
   * Fetches active gallery collection
   */
  public async fetchMedia(): Promise<MediaItem[]> {
    const apiUrl = this.config.apiUrl || "http://localhost:5000";
    try {
      const response = await fetch(`${apiUrl}/api/v1/storage/media`, {
        headers: {
          "x-client-id": this.config.clientId,
          "x-public-key": this.config.publicKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load collection media: ${response.statusText}`);
      }

      return response.json();
    } catch (err) {
      console.error("[BoutiqueSDK:Storage] fetchMedia error:", err);
      return [];
    }
  }

  /**
   * Deletes a photo and restores plan quota
   */
  public async delete(mediaId: string): Promise<boolean> {
    const apiUrl = this.config.apiUrl || "http://localhost:5000";
    try {
      const response = await fetch(`${apiUrl}/api/v1/storage/media/${mediaId}`, {
        method: "DELETE",
        headers: {
          "x-client-id": this.config.clientId,
          "x-secret-key": this.config.secretKey || "",
        },
      });
      return response.ok;
    } catch (err) {
      console.error("[BoutiqueSDK:Storage] delete photo error:", err);
      return false;
    }
  }

  private renderQuotaExceededModal(message: string): void {
    if (typeof document === "undefined") return;

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
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 32px; max-width: 440px; width: 90%; color: #0f172a; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
        <div style="width: 56px; height: 56px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px; color: #ef4444;">⚠️</div>
        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Upload Limit Reached</h3>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 24px;">
          ${message}
        </p>
        <div style="display: flex; gap: 10px;">
          <button id="boutique-close-quota-modal" style="flex: 1; background: #f1f5f9; color: #475569; border: none; padding: 12px; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 13px;">Close</button>
          <button id="boutique-upgrade-quota-btn" style="flex: 1; background: #4f46e5; color: white; border: none; padding: 12px; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 13px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">Upgrade Plan</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("boutique-close-quota-modal")?.addEventListener("click", () => modal.remove());
    document.getElementById("boutique-upgrade-quota-btn")?.addEventListener("click", () => {
      modal.remove();
      const globalInst = (window as unknown as { boutique?: { billing?: { openRenewalModal: () => void } } }).boutique;
      if (globalInst?.billing) {
        globalInst.billing.openRenewalModal();
      }
    });
  }
}
