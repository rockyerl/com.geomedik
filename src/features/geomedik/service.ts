import { randomUUID } from "crypto";
import { desc, eq } from "drizzle-orm";
import { db, ensureDbReady } from "@/db";
import {
  organizations,
  healthFacilities,
  medicalPersonnel,
  medicalEquipment,
  medicalMaterials,
  type Organization,
  type HealthFacility,
  type MedicalPersonnel,
  type MedicalEquipment,
  type MedicalMaterial,
} from "@/db/schema";
import { logAudit } from "@/lib/audit";
import type { SessionPayload } from "@/lib/auth/session";
import type {
  CreateOrganizationInput,
  CreateFacilityInput,
  VerifyFacilityInput,
  CreatePersonnelInput,
  CreateEquipmentInput,
  CreateMaterialInput,
  CsvFacilityRowInput,
} from "./dto";

export interface FacilityWithDetails extends HealthFacility {
  organization: Organization | null;
  personnel: MedicalPersonnel[];
  equipment: MedicalEquipment[];
  materials: MedicalMaterial[];
  totalPersonnelCount: number;
  totalPersonnelRequired: number;
  totalEquipmentUnits: number;
  damagedEquipmentUnits: number;
  criticalMaterialCount: number;
}

export interface PersonnelWithFacility extends MedicalPersonnel {
  facilityName: string;
  facilityCode: string;
  province: string;
  organizationName: string;
  organizationCategory: string;
}

export interface EquipmentWithFacility extends MedicalEquipment {
  facilityName: string;
  facilityCode: string;
  province: string;
  organizationName: string;
}

export interface MaterialWithFacility extends MedicalMaterial {
  facilityName: string;
  facilityCode: string;
  province: string;
  organizationName: string;
}

export interface GeomedikExecutiveSummary {
  totalOrganizations: number;
  totalFacilities: number;
  operationalFacilities: number;
  totalBeds: number;
  approvedFacilities: number;
  pendingVerificationFacilities: number;
  revisionFacilities: number;
  totalPersonnelAvailable: number;
  totalPersonnelRequired: number;
  totalMilitaryPersonnel: number;
  totalCivilPersonnel: number;
  totalEquipmentUnits: number;
  goodEquipmentUnits: number;
  damagedEquipmentUnits: number;
  totalMaterialItems: number;
  criticalOrLowMaterials: number;
  byMatra: {
    category: string;
    facilityCount: number;
    bedCount: number;
  }[];
  facilities: FacilityWithDetails[];
}

export async function getOrganizations(): Promise<Organization[]> {
  await ensureDbReady();
  return db.select().from(organizations).orderBy(organizations.code);
}

export async function getFacilitiesWithDetails(): Promise<FacilityWithDetails[]> {
  await ensureDbReady();
  const [allOrgs, allFacs, allPersonnel, allEquipment, allMaterials] = await Promise.all([
    db.select().from(organizations),
    db.select().from(healthFacilities).orderBy(desc(healthFacilities.updatedAt)),
    db.select().from(medicalPersonnel),
    db.select().from(medicalEquipment),
    db.select().from(medicalMaterials),
  ]);

  const orgMap = new Map(allOrgs.map((o) => [o.id, o]));

  return allFacs.map((fac) => {
    const facPersonnel = allPersonnel.filter((p) => p.facilityId === fac.id);
    const facEquipment = allEquipment.filter((e) => e.facilityId === fac.id);
    const facMaterials = allMaterials.filter((m) => m.facilityId === fac.id);

    const totalPersonnelCount = facPersonnel.reduce((acc, p) => acc + p.totalAvailable, 0);
    const totalPersonnelRequired = facPersonnel.reduce((acc, p) => acc + p.standardRequirement, 0);
    const totalEquipmentUnits = facEquipment.reduce((acc, e) => acc + e.totalUnits, 0);
    const damagedEquipmentUnits = facEquipment.reduce(
      (acc, e) => acc + e.minorDamageUnits + e.majorDamageUnits,
      0
    );
    const criticalMaterialCount = facMaterials.filter(
      (m) => m.stockStatus === "KRITIS" || m.stockStatus === "MENIPIS"
    ).length;

    return {
      ...fac,
      organization: orgMap.get(fac.organizationId) || null,
      personnel: facPersonnel,
      equipment: facEquipment,
      materials: facMaterials,
      totalPersonnelCount,
      totalPersonnelRequired,
      totalEquipmentUnits,
      damagedEquipmentUnits,
      criticalMaterialCount,
    };
  });
}

export async function getPersonnelWithFacility(): Promise<PersonnelWithFacility[]> {
  await ensureDbReady();
  const [allPersonnel, allFacs, allOrgs] = await Promise.all([
    db.select().from(medicalPersonnel).orderBy(desc(medicalPersonnel.updatedAt)),
    db.select().from(healthFacilities),
    db.select().from(organizations),
  ]);

  const facMap = new Map(allFacs.map((f) => [f.id, f]));
  const orgMap = new Map(allOrgs.map((o) => [o.id, o]));

  return allPersonnel.map((p) => {
    const fac = facMap.get(p.facilityId);
    const org = fac ? orgMap.get(fac.organizationId) : undefined;
    return {
      ...p,
      facilityName: fac?.name || "Tidak Diketahui",
      facilityCode: fac?.code || "-",
      province: fac?.province || "-",
      organizationName: org?.name || "-",
      organizationCategory: org?.category || "KEMHAN",
    };
  });
}

export async function getEquipmentWithFacility(): Promise<EquipmentWithFacility[]> {
  await ensureDbReady();
  const [allEquipment, allFacs, allOrgs] = await Promise.all([
    db.select().from(medicalEquipment).orderBy(desc(medicalEquipment.updatedAt)),
    db.select().from(healthFacilities),
    db.select().from(organizations),
  ]);

  const facMap = new Map(allFacs.map((f) => [f.id, f]));
  const orgMap = new Map(allOrgs.map((o) => [o.id, o]));

  return allEquipment.map((e) => {
    const fac = facMap.get(e.facilityId);
    const org = fac ? orgMap.get(fac.organizationId) : undefined;
    return {
      ...e,
      facilityName: fac?.name || "Tidak Diketahui",
      facilityCode: fac?.code || "-",
      province: fac?.province || "-",
      organizationName: org?.name || "-",
    };
  });
}

export async function getMaterialsWithFacility(): Promise<MaterialWithFacility[]> {
  await ensureDbReady();
  const [allMaterials, allFacs, allOrgs] = await Promise.all([
    db.select().from(medicalMaterials).orderBy(desc(medicalMaterials.updatedAt)),
    db.select().from(healthFacilities),
    db.select().from(organizations),
  ]);

  const facMap = new Map(allFacs.map((f) => [f.id, f]));
  const orgMap = new Map(allOrgs.map((o) => [o.id, o]));

  return allMaterials.map((m) => {
    const fac = facMap.get(m.facilityId);
    const org = fac ? orgMap.get(fac.organizationId) : undefined;
    return {
      ...m,
      facilityName: fac?.name || "Tidak Diketahui",
      facilityCode: fac?.code || "-",
      province: fac?.province || "-",
      organizationName: org?.name || "-",
    };
  });
}

export async function getGeomedikExecutiveSummary(): Promise<GeomedikExecutiveSummary> {
  await ensureDbReady();
  const [orgs, facilities, personnel, equipment, materials] = await Promise.all([
    getOrganizations(),
    getFacilitiesWithDetails(),
    db.select().from(medicalPersonnel),
    db.select().from(medicalEquipment),
    db.select().from(medicalMaterials),
  ]);

  const totalBeds = facilities.reduce((sum, f) => sum + f.bedCapacity, 0);
  const operationalFacilities = facilities.filter(
    (f) => f.operationalStatus === "OPERASIONAL" || f.operationalStatus === "SIAGA_DARURAT"
  ).length;
  const approvedFacilities = facilities.filter((f) => f.verificationStatus === "APPROVED").length;
  const pendingVerificationFacilities = facilities.filter(
    (f) => f.verificationStatus === "SUBMITTED"
  ).length;
  const revisionFacilities = facilities.filter(
    (f) => f.verificationStatus === "NEEDS_REVISION" || f.verificationStatus === "REJECTED"
  ).length;

  const totalPersonnelAvailable = personnel.reduce((sum, p) => sum + p.totalAvailable, 0);
  const totalPersonnelRequired = personnel.reduce((sum, p) => sum + p.standardRequirement, 0);
  const totalMilitaryPersonnel = personnel.reduce((sum, p) => sum + p.militaryCount, 0);
  const totalCivilPersonnel = personnel.reduce((sum, p) => sum + p.civilCount, 0);

  const totalEquipmentUnits = equipment.reduce((sum, e) => sum + e.totalUnits, 0);
  const goodEquipmentUnits = equipment.reduce((sum, e) => sum + e.goodConditionUnits, 0);
  const damagedEquipmentUnits = equipment.reduce(
    (sum, e) => sum + e.minorDamageUnits + e.majorDamageUnits,
    0
  );

  const criticalOrLowMaterials = materials.filter(
    (m) => m.stockStatus === "KRITIS" || m.stockStatus === "MENIPIS"
  ).length;

  const categories = ["KEMHAN", "MABES_TNI", "TNI_AD", "TNI_AL", "TNI_AU"];
  const byMatra = categories.map((cat) => {
    const matching = facilities.filter((f) => f.organization?.category === cat);
    return {
      category: cat,
      facilityCount: matching.length,
      bedCount: matching.reduce((sum, f) => sum + f.bedCapacity, 0),
    };
  });

  return {
    totalOrganizations: orgs.length,
    totalFacilities: facilities.length,
    operationalFacilities,
    totalBeds,
    approvedFacilities,
    pendingVerificationFacilities,
    revisionFacilities,
    totalPersonnelAvailable,
    totalPersonnelRequired,
    totalMilitaryPersonnel,
    totalCivilPersonnel,
    totalEquipmentUnits,
    goodEquipmentUnits,
    damagedEquipmentUnits,
    totalMaterialItems: materials.length,
    criticalOrLowMaterials,
    byMatra,
    facilities,
  };
}

// ---------------------------------------------------------------------------
// Mutations with Audit Trail (Modul 12)
// ---------------------------------------------------------------------------

export async function createOrganization(
  input: CreateOrganizationInput,
  actor: SessionPayload
): Promise<{ success: boolean; error?: string }> {
  await ensureDbReady();
  const existing = await db
    .select()
    .from(organizations)
    .where(eq(organizations.code, input.code))
    .limit(1);

  if (existing.length > 0) {
    return { success: false, error: `Kode organisasi ${input.code} sudah terdaftar` };
  }

  const now = new Date();
  const id = `org-${randomUUID().slice(0, 8)}`;

  await db.insert(organizations).values({
    id,
    code: input.code,
    name: input.name,
    category: input.category,
    level: input.level,
    province: input.province,
    parentId: input.parentId || null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  await logAudit({
    actorId: actor.userId,
    actorEmail: actor.email,
    action: "ORGANIZATION_CREATE",
    resource: `organizations:${id}`,
    details: { code: input.code, name: input.name, category: input.category, level: input.level },
  });

  return { success: true };
}

export async function createFacility(
  input: CreateFacilityInput,
  actor: SessionPayload
): Promise<{ success: boolean; error?: string }> {
  await ensureDbReady();
  const existing = await db
    .select()
    .from(healthFacilities)
    .where(eq(healthFacilities.code, input.code))
    .limit(1);

  if (existing.length > 0) {
    return { success: false, error: `Kode fasilitas ${input.code} sudah digunakan` };
  }

  const now = new Date();
  const id = `fac-${randomUUID().slice(0, 8)}`;

  // If created by SUPER_ADMIN or ADMIN, auto-approve or set SUBMITTED if STAFF
  const initialVerification =
    actor.roleCode === "SUPER_ADMIN" || actor.roleCode === "ADMIN" ? "APPROVED" : "SUBMITTED";

  await db.insert(healthFacilities).values({
    id,
    code: input.code,
    name: input.name,
    organizationId: input.organizationId,
    category: input.category,
    province: input.province,
    city: input.city,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    bedCapacity: input.bedCapacity,
    operationalStatus: input.operationalStatus,
    services: input.services,
    verificationStatus: initialVerification,
    verificationNote:
      initialVerification === "APPROVED"
        ? "Diinput dan disetujui langsung oleh Pejabat Verifikator."
        : "Diajukan oleh operator untuk ditinjau verifikator.",
    verifiedBy: initialVerification === "APPROVED" ? actor.name : null,
    verifiedAt: initialVerification === "APPROVED" ? now : null,
    reportingPeriod: input.reportingPeriod || "2026-TW4",
    createdAt: now,
    updatedAt: now,
  });

  await logAudit({
    actorId: actor.userId,
    actorEmail: actor.email,
    action: "FACILITY_CREATE",
    resource: `health_facilities:${id}`,
    details: {
      code: input.code,
      name: input.name,
      coordinates: [input.latitude, input.longitude],
      verificationStatus: initialVerification,
    },
  });

  return { success: true };
}

export async function verifyFacilityData(
  input: VerifyFacilityInput,
  actor: SessionPayload
): Promise<{ success: boolean; error?: string }> {
  await ensureDbReady();
  const existing = await db
    .select()
    .from(healthFacilities)
    .where(eq(healthFacilities.id, input.facilityId))
    .limit(1);

  if (existing.length === 0) {
    return { success: false, error: "Fasilitas kesehatan tidak ditemukan" };
  }

  const target = existing[0];
  const now = new Date();

  await db
    .update(healthFacilities)
    .set({
      verificationStatus: input.status,
      verificationNote: input.note,
      verifiedBy: actor.name,
      verifiedAt: now,
      updatedAt: now,
    })
    .where(eq(healthFacilities.id, input.facilityId));

  await logAudit({
    actorId: actor.userId,
    actorEmail: actor.email,
    action: `FACILITY_VERIFY_${input.status}`,
    resource: `health_facilities:${input.facilityId}`,
    details: {
      facilityCode: target.code,
      facilityName: target.name,
      previousStatus: target.verificationStatus,
      newStatus: input.status,
      note: input.note,
    },
  });

  return { success: true };
}

export async function createPersonnelRecord(
  input: CreatePersonnelInput,
  actor: SessionPayload
): Promise<{ success: boolean; error?: string }> {
  await ensureDbReady();
  const now = new Date();
  const id = `sdm-${randomUUID().slice(0, 8)}`;
  const totalAvailable = input.militaryCount + input.civilCount;

  await db.insert(medicalPersonnel).values({
    id,
    facilityId: input.facilityId,
    professionCategory: input.professionCategory,
    specialization: input.specialization,
    militaryCount: input.militaryCount,
    civilCount: input.civilCount,
    totalAvailable,
    standardRequirement: input.standardRequirement,
    certificationNote: input.certificationNote || "-",
    verificationStatus: "APPROVED",
    reportingPeriod: "2026-TW4",
    updatedAt: now,
  });

  await logAudit({
    actorId: actor.userId,
    actorEmail: actor.email,
    action: "PERSONNEL_CREATE",
    resource: `medical_personnel:${id}`,
    details: {
      facilityId: input.facilityId,
      professionCategory: input.professionCategory,
      specialization: input.specialization,
      totalAvailable,
      standardRequirement: input.standardRequirement,
    },
  });

  return { success: true };
}

export async function createEquipmentRecord(
  input: CreateEquipmentInput,
  actor: SessionPayload
): Promise<{ success: boolean; error?: string }> {
  await ensureDbReady();
  const existing = await db
    .select()
    .from(medicalEquipment)
    .where(eq(medicalEquipment.code, input.code))
    .limit(1);

  if (existing.length > 0) {
    return { success: false, error: `Kode alat kesehatan ${input.code} sudah terdaftar` };
  }

  const now = new Date();
  const id = `alkes-${randomUUID().slice(0, 8)}`;
  const totalUnits = input.goodConditionUnits + input.minorDamageUnits + input.majorDamageUnits;

  if (totalUnits <= 0) {
    return { success: false, error: "Total unit alat kesehatan minimal 1 unit" };
  }

  await db.insert(medicalEquipment).values({
    id,
    code: input.code,
    facilityId: input.facilityId,
    category: input.category,
    name: input.name,
    totalUnits,
    goodConditionUnits: input.goodConditionUnits,
    minorDamageUnits: input.minorDamageUnits,
    majorDamageUnits: input.majorDamageUnits,
    operationalStatus: input.operationalStatus,
    procurementYear: input.procurementYear,
    nextMaintenanceDate: input.nextMaintenanceDate,
    verificationStatus: "APPROVED",
    updatedAt: now,
  });

  await logAudit({
    actorId: actor.userId,
    actorEmail: actor.email,
    action: "EQUIPMENT_CREATE",
    resource: `medical_equipment:${id}`,
    details: {
      code: input.code,
      name: input.name,
      totalUnits,
      operationalStatus: input.operationalStatus,
    },
  });

  return { success: true };
}

export function computeMaterialStockStatus(
  stockQuantity: number,
  minThreshold: number
): "AMAN" | "MENIPIS" | "KRITIS" {
  if (stockQuantity <= Math.floor(minThreshold * 0.35)) {
    return "KRITIS";
  }
  if (stockQuantity <= minThreshold) {
    return "MENIPIS";
  }
  return "AMAN";
}

export async function createMaterialRecord(
  input: CreateMaterialInput,
  actor: SessionPayload
): Promise<{ success: boolean; error?: string }> {
  await ensureDbReady();
  const existing = await db
    .select()
    .from(medicalMaterials)
    .where(eq(medicalMaterials.code, input.code))
    .limit(1);

  if (existing.length > 0) {
    return { success: false, error: `Kode material kesehatan ${input.code} sudah terdaftar` };
  }

  const now = new Date();
  const id = `mat-${randomUUID().slice(0, 8)}`;
  const stockStatus = computeMaterialStockStatus(input.stockQuantity, input.minThreshold);

  await db.insert(medicalMaterials).values({
    id,
    code: input.code,
    facilityId: input.facilityId,
    category: input.category,
    name: input.name,
    unit: input.unit,
    stockQuantity: input.stockQuantity,
    minThreshold: input.minThreshold,
    storageLocation: input.storageLocation,
    expiryDate: input.expiryDate,
    stockStatus,
    verificationStatus: "APPROVED",
    updatedAt: now,
  });

  await logAudit({
    actorId: actor.userId,
    actorEmail: actor.email,
    action: "MATERIAL_CREATE",
    resource: `medical_materials:${id}`,
    details: {
      code: input.code,
      name: input.name,
      stockQuantity: input.stockQuantity,
      minThreshold: input.minThreshold,
      stockStatus,
    },
  });

  return { success: true };
}

export async function bulkImportFacilitiesFromCsv(
  rows: CsvFacilityRowInput[],
  actor: SessionPayload
): Promise<{
  success: boolean;
  importedCount: number;
  skippedCount: number;
  error?: string;
}> {
  await ensureDbReady();
  if (rows.length === 0) {
    return {
      success: false,
      importedCount: 0,
      skippedCount: 0,
      error: "Tidak ada baris data fasilitas kesehatan yang valid untuk diimpor.",
    };
  }

  const [allOrgs, allFacs] = await Promise.all([
    db.select().from(organizations),
    db.select().from(healthFacilities),
  ]);

  const orgByCode = new Map(allOrgs.map((o) => [o.code.toUpperCase(), o]));
  const existingFacCodes = new Set(allFacs.map((f) => f.code.toUpperCase()));

  const now = new Date();
  const initialVerification =
    actor.roleCode === "SUPER_ADMIN" || actor.roleCode === "ADMIN" ? "APPROVED" : "SUBMITTED";

  let importedCount = 0;
  let skippedCount = 0;
  const importedCodes: string[] = [];

  for (const row of rows) {
    const codeUpper = row.code.toUpperCase();
    const org = orgByCode.get(row.organizationCode.toUpperCase());

    if (existingFacCodes.has(codeUpper) || !org) {
      skippedCount++;
      continue;
    }

    const id = `fac-${randomUUID().slice(0, 8)}`;
    await db.insert(healthFacilities).values({
      id,
      code: codeUpper,
      name: row.name,
      organizationId: org.id,
      category: row.category,
      province: row.province,
      city: row.city,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      bedCapacity: row.bedCapacity,
      operationalStatus: row.operationalStatus,
      services: row.services,
      verificationStatus: initialVerification,
      verificationNote:
        initialVerification === "APPROVED"
          ? "Diimpor melalui Modul 8 (Bulk CSV Import) dan terverifikasi."
          : "Diimpor melalui Modul 8 (Bulk CSV Import), menunggu verifikasi.",
      verifiedBy: initialVerification === "APPROVED" ? actor.name : null,
      verifiedAt: initialVerification === "APPROVED" ? now : null,
      reportingPeriod: "2026-TW4",
      createdAt: now,
      updatedAt: now,
    });

    existingFacCodes.add(codeUpper);
    importedCodes.push(codeUpper);
    importedCount++;
  }

  await logAudit({
    actorId: actor.userId,
    actorEmail: actor.email,
    action: "FACILITY_BULK_IMPORT_CSV",
    resource: "health_facilities:bulk_import",
    details: {
      importedCount,
      skippedCount,
      importedCodes,
    },
  });

  return {
    success: true,
    importedCount,
    skippedCount,
  };
}
