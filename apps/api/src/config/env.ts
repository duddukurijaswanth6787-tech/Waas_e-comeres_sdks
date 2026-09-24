import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: true });
dotenv.config({ path: path.resolve(process.cwd(), "apps/api/.env"), override: true });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env"), override: true });
dotenv.config({ override: true });
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  API_PUBLIC_URL: z.string().default("http://localhost:4000"),
  DATABASE_URL: z.string().default("file:./dev.db"),
  JWT_SECRET: z.string().min(16).default("dev-jwt-secret-min-16-characters-long"),
  SUPER_ADMIN_EMAIL: z.string().email().default("admin@boutiqueplatform.com"),
  SUPER_ADMIN_PASSWORD_HASH: z.string().optional(),
  
  // AWS S3 Storage (ap-south-2 Hyderabad)
  AWS_REGION: z.string().default("ap-south-2"),
  AWS_BUCKET_NAME: z.string().default("boutique-media-848910045051-hyd"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  // Payment Gateway (Razorpay India)
  RAZORPAY_KEY_ID: z.string().default("rzp_test_mock"),
  RAZORPAY_KEY_SECRET: z.string().default("rzp_secret_mock"),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Automated WhatsApp Reminder Provider (UltraMsg / Interakt / Wati)
  WHATSAPP_PROVIDER: z.enum(["none", "ultramsg", "interakt", "wati", "custom"]).default("none"),
  WHATSAPP_API_URL: z.string().optional(),
  WHATSAPP_API_TOKEN: z.string().optional(),
  WHATSAPP_INSTANCE_ID: z.string().optional(),

  // Telegram Bot Management & Instant Alerts
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
});

export const env = envSchema.parse(process.env);
