import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

function resolveDatabaseUrl(): string {
  const configured = process.env.DATABASE_URL?.trim();
  if (configured && configured.length > 0) {
    // On Vercel serverless, relative file:local.db points to read-only /var/task
    if (process.env.VERCEL && configured === "file:local.db") {
      return "file:/tmp/geomedik.db";
    }
    return configured;
  }

  // Fallback for Vercel serverless environments when DATABASE_URL is not configured
  if (process.env.VERCEL) {
    return "file:/tmp/geomedik.db";
  }

  return "file:local.db";
}

const dbUrl = resolveDatabaseUrl();
const dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.trim() || undefined;

// Global client & initialization caching across warm serverless invocations & hot reloads
const globalForDb = globalThis as unknown as {
  libsqlClient: ReturnType<typeof createClient> | undefined;
  dbReadyPromise: Promise<void> | undefined;
};

export const client =
  globalForDb.libsqlClient ??
  createClient({
    url: dbUrl,
    ...(dbAuthToken ? { authToken: dbAuthToken } : {}),
  });

globalForDb.libsqlClient = client;

export const db = drizzle(client, { schema });

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY NOT NULL,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    "group" TEXT NOT NULL,
    description TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS role_permissions (
    id TEXT PRIMARY KEY NOT NULL,
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS navigation_menus (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    path TEXT NOT NULL,
    icon TEXT NOT NULL,
    required_permission TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role_id TEXT NOT NULL REFERENCES roles(id),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY NOT NULL,
    actor_id TEXT,
    actor_email TEXT,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY NOT NULL,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'KOTAMA',
    parent_id TEXT,
    province TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS health_facilities (
    id TEXT PRIMARY KEY NOT NULL,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    category TEXT NOT NULL,
    province TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    bed_capacity INTEGER NOT NULL DEFAULT 0,
    operational_status TEXT NOT NULL DEFAULT 'OPERASIONAL',
    services TEXT,
    verification_status TEXT NOT NULL DEFAULT 'APPROVED',
    verification_note TEXT,
    verified_by TEXT,
    verified_at INTEGER,
    reporting_period TEXT NOT NULL DEFAULT '2026-TW4',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS medical_personnel (
    id TEXT PRIMARY KEY NOT NULL,
    facility_id TEXT NOT NULL REFERENCES health_facilities(id) ON DELETE CASCADE,
    profession_category TEXT NOT NULL,
    specialization TEXT NOT NULL,
    military_count INTEGER NOT NULL DEFAULT 0,
    civil_count INTEGER NOT NULL DEFAULT 0,
    total_available INTEGER NOT NULL DEFAULT 0,
    standard_requirement INTEGER NOT NULL DEFAULT 0,
    certification_note TEXT,
    verification_status TEXT NOT NULL DEFAULT 'APPROVED',
    reporting_period TEXT NOT NULL DEFAULT '2026-TW4',
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS medical_equipment (
    id TEXT PRIMARY KEY NOT NULL,
    code TEXT NOT NULL UNIQUE,
    facility_id TEXT NOT NULL REFERENCES health_facilities(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    total_units INTEGER NOT NULL DEFAULT 1,
    good_condition_units INTEGER NOT NULL DEFAULT 1,
    minor_damage_units INTEGER NOT NULL DEFAULT 0,
    major_damage_units INTEGER NOT NULL DEFAULT 0,
    operational_status TEXT NOT NULL DEFAULT 'BERFUNGSI',
    procurement_year INTEGER NOT NULL DEFAULT 2023,
    next_maintenance_date TEXT,
    verification_status TEXT NOT NULL DEFAULT 'APPROVED',
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS medical_materials (
    id TEXT PRIMARY KEY NOT NULL,
    code TEXT NOT NULL UNIQUE,
    facility_id TEXT NOT NULL REFERENCES health_facilities(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_threshold INTEGER NOT NULL DEFAULT 50,
    storage_location TEXT NOT NULL,
    expiry_date TEXT,
    stock_status TEXT NOT NULL DEFAULT 'AMAN',
    verification_status TEXT NOT NULL DEFAULT 'APPROVED',
    updated_at INTEGER NOT NULL
  )`,
];

async function bootstrapDatabaseIfNeeded(): Promise<void> {
  // Fast check: see if users table already exists and has records
  try {
    const existingUsers = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
    if (Number(existingUsers[0]?.count || 0) > 0) {
      return;
    }
  } catch {
    // Table does not exist yet — proceed to create tables & seed
  }

  for (const stmt of SCHEMA_STATEMENTS) {
    await client.execute(stmt);
  }

  const checkAfterCreate = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
  if (Number(checkAfterCreate[0]?.count || 0) === 0) {
    const { seedGeomedikDatabase } = await import("./seed");
    await seedGeomedikDatabase();
  }
}

/**
 * Ensures the SQLite/LibSQL database schema & initial 100-facility seed data
 * exist before running queries (especially on Vercel serverless `/tmp/geomedik.db`).
 */
export async function ensureDbReady(): Promise<void> {
  if (!globalForDb.dbReadyPromise) {
    globalForDb.dbReadyPromise = bootstrapDatabaseIfNeeded().catch((err) => {
      globalForDb.dbReadyPromise = undefined;
      throw err;
    });
  }
  return globalForDb.dbReadyPromise;
}
