import React from "react";
import { requirePermission } from "@/lib/auth/context";
import { getFacilitiesWithDetails } from "@/features/geomedik/service";
import { AnalyticsView } from "@/features/geomedik/components/analytics-view";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requirePermission("resources.view");

  const facilities = await getFacilitiesWithDetails();

  return <AnalyticsView facilities={facilities} />;
}
