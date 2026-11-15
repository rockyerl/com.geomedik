import { randomUUID } from "crypto";
import { db, ensureDbReady } from "@/db";
import { auditLogs } from "@/db/schema";

export interface LogAuditParams {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  resource: string;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    await ensureDbReady();
    await db.insert(auditLogs).values({
      id: randomUUID(),
      actorId: params.actorId || null,
      actorEmail: params.actorEmail || null,
      action: params.action,
      resource: params.resource,
      details: params.details ? JSON.stringify(params.details) : null,
      ipAddress: params.ipAddress || null,
      createdAt: new Date(),
    });
  } catch (error) {
    // Non-blocking: fail safe without crashing primary operation
    console.error("[AUDIT LOG ERROR]", error);
  }
}
