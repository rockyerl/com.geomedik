"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/context";
import { logAudit } from "@/lib/audit";
import {
  createOrganizationSchema,
  createFacilitySchema,
  verifyFacilitySchema,
  createPersonnelSchema,
  createEquipmentSchema,
  createMaterialSchema,
  csvFacilityRowSchema,
  type CsvFacilityRowInput,
} from "./dto";
import {
  createOrganization,
  createFacility,
  verifyFacilityData,
  createPersonnelRecord,
  createEquipmentRecord,
  createMaterialRecord,
  bulkImportFacilitiesFromCsv,
} from "./service";
import { verifyCartoApiConnection } from "./carto";

export interface GeomedikActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function formatZodIssues(
  issues: { path: PropertyKey[]; message: string }[]
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path[0]?.toString() || "form";
    fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

function revalidateGeomedikPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/gis");
  revalidatePath("/dashboard/organizations");
  revalidatePath("/dashboard/facilities");
  revalidatePath("/dashboard/verification");
  revalidatePath("/dashboard/personnel");
  revalidatePath("/dashboard/equipment");
  revalidatePath("/dashboard/materials");
  revalidatePath("/dashboard/import");
  revalidatePath("/dashboard/reports");
}

export async function createOrganizationAction(
  _prevState: GeomedikActionResult | null,
  formData: FormData
): Promise<GeomedikActionResult> {
  const session = await requirePermission("organizations.manage");

  const rawData = {
    code: String(formData.get("code") || "").toUpperCase(),
    name: formData.get("name"),
    category: formData.get("category"),
    level: formData.get("level"),
    province: formData.get("province"),
    parentId: formData.get("parentId") ? String(formData.get("parentId")) : null,
  };

  const parsed = createOrganizationSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Periksa kembali data organisasi yang diinput",
      fieldErrors: formatZodIssues(parsed.error.issues),
    };
  }

  const res = await createOrganization(parsed.data, session);
  if (!res.success) {
    return { success: false, error: res.error };
  }

  revalidateGeomedikPaths();
  return { success: true };
}

export async function createFacilityAction(
  _prevState: GeomedikActionResult | null,
  formData: FormData
): Promise<GeomedikActionResult> {
  const session = await requirePermission("facilities.manage");

  const rawData = {
    code: String(formData.get("code") || "").toUpperCase(),
    name: formData.get("name"),
    organizationId: formData.get("organizationId"),
    category: formData.get("category"),
    province: formData.get("province"),
    city: formData.get("city"),
    address: formData.get("address"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    bedCapacity: formData.get("bedCapacity"),
    operationalStatus: formData.get("operationalStatus"),
    services: formData.get("services"),
    reportingPeriod: formData.get("reportingPeriod") || "2026-TW4",
  };

  const parsed = createFacilitySchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Data fasilitas kesehatan atau koordinat geografis tidak valid",
      fieldErrors: formatZodIssues(parsed.error.issues),
    };
  }

  const res = await createFacility(parsed.data, session);
  if (!res.success) {
    return { success: false, error: res.error };
  }

  revalidateGeomedikPaths();
  return { success: true };
}

export async function verifyFacilityAction(
  _prevState: GeomedikActionResult | null,
  formData: FormData
): Promise<GeomedikActionResult> {
  const session = await requirePermission("facilities.verify");

  const rawData = {
    facilityId: formData.get("facilityId"),
    status: formData.get("status"),
    note: formData.get("note"),
  };

  const parsed = verifyFacilitySchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Keputusan dan catatan verifikasi wajib dilengkapi",
      fieldErrors: formatZodIssues(parsed.error.issues),
    };
  }

  const res = await verifyFacilityData(parsed.data, session);
  if (!res.success) {
    return { success: false, error: res.error };
  }

  revalidateGeomedikPaths();
  return { success: true };
}

export async function createPersonnelAction(
  _prevState: GeomedikActionResult | null,
  formData: FormData
): Promise<GeomedikActionResult> {
  const session = await requirePermission("resources.manage");

  const rawData = {
    facilityId: formData.get("facilityId"),
    professionCategory: formData.get("professionCategory"),
    specialization: formData.get("specialization"),
    militaryCount: formData.get("militaryCount"),
    civilCount: formData.get("civilCount"),
    standardRequirement: formData.get("standardRequirement"),
    certificationNote: formData.get("certificationNote") || "",
  };

  const parsed = createPersonnelSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Data rekap SDM kesehatan tidak valid",
      fieldErrors: formatZodIssues(parsed.error.issues),
    };
  }

  const res = await createPersonnelRecord(parsed.data, session);
  if (!res.success) {
    return { success: false, error: res.error };
  }

  revalidateGeomedikPaths();
  return { success: true };
}

export async function createEquipmentAction(
  _prevState: GeomedikActionResult | null,
  formData: FormData
): Promise<GeomedikActionResult> {
  const session = await requirePermission("resources.manage");

  const rawData = {
    code: String(formData.get("code") || "").toUpperCase(),
    facilityId: formData.get("facilityId"),
    category: formData.get("category"),
    name: formData.get("name"),
    goodConditionUnits: formData.get("goodConditionUnits"),
    minorDamageUnits: formData.get("minorDamageUnits"),
    majorDamageUnits: formData.get("majorDamageUnits"),
    operationalStatus: formData.get("operationalStatus"),
    procurementYear: formData.get("procurementYear"),
    nextMaintenanceDate: formData.get("nextMaintenanceDate"),
  };

  const parsed = createEquipmentSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Data alat kesehatan tidak valid",
      fieldErrors: formatZodIssues(parsed.error.issues),
    };
  }

  const res = await createEquipmentRecord(parsed.data, session);
  if (!res.success) {
    return { success: false, error: res.error };
  }

  revalidateGeomedikPaths();
  return { success: true };
}

export async function createMaterialAction(
  _prevState: GeomedikActionResult | null,
  formData: FormData
): Promise<GeomedikActionResult> {
  const session = await requirePermission("resources.manage");

  const rawData = {
    code: String(formData.get("code") || "").toUpperCase(),
    facilityId: formData.get("facilityId"),
    category: formData.get("category"),
    name: formData.get("name"),
    unit: formData.get("unit"),
    stockQuantity: formData.get("stockQuantity"),
    minThreshold: formData.get("minThreshold"),
    storageLocation: formData.get("storageLocation"),
    expiryDate: formData.get("expiryDate"),
  };

  const parsed = createMaterialSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Data material kesehatan tidak valid",
      fieldErrors: formatZodIssues(parsed.error.issues),
    };
  }

  const res = await createMaterialRecord(parsed.data, session);
  if (!res.success) {
    return { success: false, error: res.error };
  }

  revalidateGeomedikPaths();
  return { success: true };
}

export async function checkCartoMcpConnectionAction(): Promise<{
  reachable: boolean;
  statusCode?: number;
  message: string;
}> {
  const session = await requirePermission("gis.view");
  const res = await verifyCartoApiConnection();

  await logAudit({
    actorId: session.userId,
    actorEmail: session.email,
    action: "CARTO_API_CHECK",
    resource: "carto:gcp-asia-northeast1",
    details: { reachable: res.reachable, statusCode: res.statusCode },
  });

  revalidatePath("/dashboard/gis");
  return res;
}

export async function bulkImportFacilitiesAction(rows: CsvFacilityRowInput[]): Promise<{
  success: boolean;
  importedCount: number;
  skippedCount: number;
  error?: string;
}> {
  const session = await requirePermission("facilities.manage");

  const validRows: CsvFacilityRowInput[] = [];
  for (const r of rows) {
    const parsed = csvFacilityRowSchema.safeParse(r);
    if (parsed.success) {
      validRows.push(parsed.data);
    }
  }

  const res = await bulkImportFacilitiesFromCsv(validRows, session);
  if (res.success) {
    revalidateGeomedikPaths();
  }
  return res;
}
