import Razorpay from "razorpay";
import crypto from "crypto";
import { env } from "../config/env.js";

let razorpayInstance: Razorpay | null = null;

export function getRazorpayClient(): Razorpay | null {
  if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET && env.RAZORPAY_KEY_ID !== "rzp_test_mock") {
    if (!razorpayInstance) {
      razorpayInstance = new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
      });
    }
    return razorpayInstance;
  }
  return null;
}

export async function createPaymentOrder(params: {
  amountInr: number;
  clientId: string;
  planId: string;
  billingCycle: string;
}): Promise<{ orderId: string; amountPaise: number; currency: string; keyId: string }> {
  const amountPaise = Math.round(params.amountInr * 100);
  const client = getRazorpayClient();

  if (!client) {
    // Development mock order
    const mockOrderId = `order_mock_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    return {
      orderId: mockOrderId,
      amountPaise,
      currency: "INR",
      keyId: env.RAZORPAY_KEY_ID,
    };
  }

  try {
    const order = await client.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `rcpt_${params.clientId.substring(0, 10)}_${Date.now()}`,
      notes: {
        clientId: params.clientId,
        planId: params.planId,
        billingCycle: params.billingCycle,
      },
    });

    return {
      orderId: order.id,
      amountPaise,
      currency: "INR",
      keyId: env.RAZORPAY_KEY_ID,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Razorpay API error";
    console.warn("[Razorpay] External order creation failed (" + msg + "), generating development order fallback.");
    const mockOrderId = `order_mock_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    return {
      orderId: mockOrderId,
      amountPaise,
      currency: "INR",
      keyId: env.RAZORPAY_KEY_ID || "rzp_test_mock",
    };
  }
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    return true; // Allow dev simulation when secret is not configured
  }

  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}
