import React from "react";
import { requirePermission, hasPermission } from "@/lib/auth/context";
import { getEquipmentWithFacility, getFacilitiesWithDetails } from "@/features/geomedik/service";
import { EquipmentView } from "@/features/geomedik/components/equipment-view";

export default async function EquipmentPage() {
  const session = await requirePermission("resources.read");
  const [equipment, facilities] = await Promise.all([
    getEquipmentWithFacility(),
    getFacilitiesWithDetails(),
  ]);

  const canManage = hasPermission(session, "resources.manage");

  return <EquipmentView equipment={equipment} facilities={facilities} canManage={canManage} />;
}
