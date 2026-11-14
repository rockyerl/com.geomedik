import React from "react";
import { requirePermission, hasPermission } from "@/lib/auth/context";
import { getFacilitiesWithDetails, getOrganizations } from "@/features/geomedik/service";
import { FacilitiesView } from "@/features/geomedik/components/facilities-view";

export default async function FacilitiesPage() {
  const session = await requirePermission("facilities.read");
  const [facilities, organizations] = await Promise.all([
    getFacilitiesWithDetails(),
    getOrganizations(),
  ]);

  const canManage = hasPermission(session, "facilities.manage");

  return (
    <FacilitiesView facilities={facilities} organizations={organizations} canManage={canManage} />
  );
}
