import React from "react";
import { requireAuth, hasPermission } from "@/lib/auth/context";
import { getGeomedikExecutiveSummary } from "@/features/geomedik/service";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";

export default async function DashboardPage() {
  const session = await requireAuth();
  const summary = await getGeomedikExecutiveSummary();

  const canViewGis = hasPermission(session, "gis.view");
  const canVerifyData = hasPermission(session, "facilities.verify");

  return (
    <DashboardOverview
      session={session}
      summary={summary}
      canViewGis={canViewGis}
      canVerifyData={canVerifyData}
    />
  );
}
