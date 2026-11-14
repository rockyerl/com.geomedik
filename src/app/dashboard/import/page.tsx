import React from "react";
import { requirePermission } from "@/lib/auth/context";
import { getOrganizations, getFacilitiesWithDetails } from "@/features/geomedik/service";
import { DataImportView } from "@/features/geomedik/components/data-import-view";

export const dynamic = "force-dynamic";

export default async function DataImportPage() {
  await requirePermission("facilities.manage");

  const [organizations, existingFacilities] = await Promise.all([
    getOrganizations(),
    getFacilitiesWithDetails(),
  ]);

  return <DataImportView organizations={organizations} existingFacilities={existingFacilities} />;
}
