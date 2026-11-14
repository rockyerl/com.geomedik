import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("3000"),
  DATABASE_URL: z.string().default("file:local.db"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters long"),
  NEXT_PUBLIC_APP_NAME: z.string().default("SI-GEOMEDIK Kemhan RI"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  CARTO_API_BASE_URL: z.string().default("https://gcp-asia-northeast1.api.carto.com"),
  CARTO_ACCOUNT_ID: z.string().default("ac_i59iz3dh"),
  CARTO_API_TOKEN: z.string().optional(),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  CARTO_API_BASE_URL: process.env.CARTO_API_BASE_URL,
  CARTO_ACCOUNT_ID: process.env.CARTO_ACCOUNT_ID,
  CARTO_API_TOKEN: process.env.CARTO_API_TOKEN,
});
