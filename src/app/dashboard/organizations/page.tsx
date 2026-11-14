import React from "react";
import { requirePermission, hasPermission } from "@/lib/auth/context";
import { getOrganizations, getFacilitiesWithDetails } from "@/features/geomedik/service";
import { OrganizationsView } from "@/features/geomedik/components/organizations-view";

export default async function OrganizationsPage() {
  const session = await requirePermission("organizations.read");
  const [organizations, facilities] = await Promise.all([
    getOrganizations(),
    getFacilitiesWithDetails(),
  ]);

  const canManage = hasPermission(session, "organizations.manage");

  return (
    <OrganizationsView
      organizations={organizations}
      facilities={facilities}
      canManage={canManage}
    />
  );
}
