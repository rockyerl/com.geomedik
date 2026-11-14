import React from "react";
import { requirePermission, hasPermission } from "@/lib/auth/context";
import { getFacilitiesWithDetails, getOrganizations } from "@/features/geomedik/service";
import { getCartoConnectionSummary, buildGeomedikGeoJson } from "@/features/geomedik/carto";
import { GisMapView } from "@/features/geomedik/components/geomedik-gis-map";

export default async function GisPage() {
  const session = await requirePermission("gis.view");
  const [facilities, organizations] = await Promise.all([
    getFacilitiesWithDetails(),
    getOrganizations(),
  ]);

  const canManageFacilities = hasPermission(session, "facilities.manage");
  const cartoConfig = getCartoConnectionSummary();
  const geoJsonCollection = buildGeomedikGeoJson(facilities);

  return (
    <GisMapView
      facilities={facilities}
      organizations={organizations}
      canManageFacilities={canManageFacilities}
      cartoConfig={cartoConfig}
      geoJsonCollection={geoJsonCollection}
    />
  );
}
