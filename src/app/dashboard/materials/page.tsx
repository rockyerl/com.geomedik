import React from "react";
import { requirePermission, hasPermission } from "@/lib/auth/context";
import { getMaterialsWithFacility, getFacilitiesWithDetails } from "@/features/geomedik/service";
import { MaterialsView } from "@/features/geomedik/components/materials-view";

export default async function MaterialsPage() {
  const session = await requirePermission("resources.read");
  const [materials, facilities] = await Promise.all([
    getMaterialsWithFacility(),
    getFacilitiesWithDetails(),
  ]);

  const canManage = hasPermission(session, "resources.manage");

  return <MaterialsView materials={materials} facilities={facilities} canManage={canManage} />;
}
