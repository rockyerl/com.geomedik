import React from "react";
import { requirePermission } from "@/lib/auth/context";
import { getRecentAuditLogs } from "@/features/reports/service";
import { AuditLogsView } from "@/features/reports/components/audit-logs-view";
import { getFacilitiesWithDetails } from "@/features/geomedik/service";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  // Requires "reports.view" permission
  await requirePermission("reports.view");

  const [recentLogs, facilities] = await Promise.all([
    getRecentAuditLogs(30),
    getFacilitiesWithDetails(),
  ]);

  return <AuditLogsView logs={recentLogs} facilities={facilities} />;
}
