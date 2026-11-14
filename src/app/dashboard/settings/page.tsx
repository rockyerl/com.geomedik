import React from "react";
import { requirePermission } from "@/lib/auth/context";
import { getGeomedikExecutiveSummary } from "@/features/geomedik/service";
import { getCartoConnectionSummary } from "@/features/geomedik/carto";
import { SystemSettingsView } from "@/features/geomedik/components/system-settings-view";

export const dynamic = "force-dynamic";

export default async function SystemSettingsPage() {
  await requirePermission("settings.manage");

  const [summary, cartoConfig] = await Promise.all([
    getGeomedikExecutiveSummary(),
    Promise.resolve(getCartoConnectionSummary()),
  ]);

  return <SystemSettingsView summary={summary} cartoConfig={cartoConfig} />;
}
