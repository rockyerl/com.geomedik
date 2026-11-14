import React from "react";
import { requirePermission, hasPermission } from "@/lib/auth/context";
import { getFacilitiesWithDetails } from "@/features/geomedik/service";
import { VerificationView } from "@/features/geomedik/components/verification-view";

export default async function VerificationPage() {
  const session = await requirePermission("facilities.verify");
  const facilities = await getFacilitiesWithDetails();
  const canVerify = hasPermission(session, "facilities.verify");

  return <VerificationView facilities={facilities} canVerify={canVerify} />;
}
