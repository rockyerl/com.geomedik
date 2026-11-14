import React from "react";
import { requirePermission, hasPermission } from "@/lib/auth/context";
import { getPersonnelWithFacility, getFacilitiesWithDetails } from "@/features/geomedik/service";
import { PersonnelView } from "@/features/geomedik/components/personnel-view";

export default async function PersonnelPage() {
  const session = await requirePermission("resources.read");
  const [personnel, facilities] = await Promise.all([
    getPersonnelWithFacility(),
    getFacilitiesWithDetails(),
  ]);

  const canManage = hasPermission(session, "resources.manage");

  return <PersonnelView personnel={personnel} facilities={facilities} canManage={canManage} />;
}
