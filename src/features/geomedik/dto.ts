import { z } from "zod";

export const ORG_CATEGORIES = [
  { value: "KEMHAN", label: "Kementerian Pertahanan (Kemhan)" },
  { value: "MABES_TNI", label: "Markas Besar TNI (Puskes TNI)" },
  { value: "TNI_AD", label: "TNI Angkatan Darat (TNI AD)" },
  { value: "TNI_AL", label: "TNI Angkatan Laut (TNI AL)" },
  { value: "TNI_AU", label: "TNI Angkatan Udara (TNI AU)" },
] as const;

export const ORG_LEVELS = [
  { value: "PUSAT", label: "Tingkat Pusat / Kementerian" },
  { value: "MATRA", label: "Pusat Kesehatan Matra" },
  { value: "KOTAMA", label: "Kotama / Kesdam / Lantamal / Koopsud" },
  { value: "SATKER", label: "Satuan Kerja / Detasemen Kesehatan" },
] as const;

export const FACILITY_CATEGORIES = [
  { value: "RS_TINGKAT_I", label: "Rumah Sakit Tingkat I (Rujukan Utama)" },
  { value: "RS_TINGKAT_II", label: "Rumah Sakit Tingkat II (Kotama)" },
  { value: "RS_TINGKAT_III", label: "Rumah Sakit Tingkat III" },
  { value: "RS_TINGKAT_IV", label: "Rumah Sakit Tingkat IV / Bantuan" },
  { value: "FKTP_KLINIK", label: "FKTP / Poliklinik Satuan" },
  { value: "LAFIOMED", label: "Lembaga Farmasi / Biovaksin" },
] as const;

export const OPERATIONAL_STATUSES = [
  { value: "OPERASIONAL", label: "Operasional Penuh" },
  { value: "SIAGA_DARURAT", label: "Siaga Operasi / Darurat" },
  { value: "RENOVASI", label: "Dalam Renovasi / Pengembangan" },
  { value: "NON_AKTIF", label: "Non-Aktif Sementara" },
] as const;

export const VERIFICATION_STATUSES = [
  { value: "DRAFT", label: "Draf" },
  { value: "SUBMITTED", label: "Menunggu Verifikasi" },
  { value: "NEEDS_REVISION", label: "Perlu Perbaikan" },
  { value: "APPROVED", label: "Disetujui / Terverifikasi" },
  { value: "REJECTED", label: "Ditolak" },
] as const;

export const PROFESSION_CATEGORIES = [
  { value: "DOKTER_SPESIALIS", label: "Dokter Spesialis / Subspesialis" },
  { value: "DOKTER_UMUM", label: "Dokter Umum Militer & Sipil" },
  { value: "DOKTER_GIGI", label: "Dokter Gigi & Spesialis Gigi" },
  { value: "PERAWAT", label: "Perawat Klinis & Gawat Darurat" },
  { value: "PARAMEDIS_MILITER", label: "Paramedis Tempur / Evakuasi Medis" },
  { value: "APOTEKER_FARMASI", label: "Apoteker & Tenaga Teknis Kefarmasian" },
  { value: "ANALIS_LAB", label: "Analis Laboratorium & Radiografer" },
  { value: "BIDAN", label: "Bidan" },
] as const;

export const EQUIPMENT_CATEGORIES = [
  { value: "RADIOLOGI_IMAGING", label: "Radiologi & Pencitraan Diagnostik" },
  { value: "BEDAH_ANESTESI", label: "Bedah Sentral, Anestesi & Rehabilitasi" },
  { value: "ICU_RESUSITASI", label: "ICU, Resusitasi & Life Support" },
  { value: "HIPERBARIK_AEROMEDIS", label: "Hiperbarik Kelautan & Aeromedis" },
  { value: "EVAKUASI_LAPANGAN", label: "Alkes Lapangan & Evakuasi Medis" },
  { value: "LABORATORIUM", label: "Laboratorium Klinik & Bank Darah" },
] as const;

export const MATERIAL_CATEGORIES = [
  { value: "TRAUMA_COMBAT_KIT", label: "Kit Trauma Tempur & IFAK" },
  { value: "OBAT_ESENSIAL", label: "Obat Esensial & Injeksi Darurat" },
  { value: "BMHP_BEDAH", label: "Bahan Medis Habis Pakai (BMHP) Bedah" },
  { value: "REAGEN_DARAH", label: "Plasma, Produk Darah & Reagensia" },
  { value: "APD_CBRN", label: "Logistik Nubika (CBRN) & Dekontaminasi" },
  { value: "VAKSIN_SERUM", label: "Vaksin, Serum & Biologi" },
] as const;

export const createOrganizationSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Kode organisasi minimal 3 karakter")
    .max(30, "Kode organisasi maksimal 30 karakter")
    .regex(/^[A-Z0-9-]+$/, "Kode hanya boleh huruf kapital, angka, dan tanda hubung (-)"),
  name: z.string().trim().min(3, "Nama organisasi minimal 3 karakter"),
  category: z.enum(["KEMHAN", "MABES_TNI", "TNI_AD", "TNI_AL", "TNI_AU"]),
  level: z.enum(["PUSAT", "MATRA", "KOTAMA", "SATKER"]),
  province: z.string().trim().min(2, "Provinsi wajib diisi"),
  parentId: z.string().optional().nullable(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const createFacilitySchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Kode faskes minimal 3 karakter")
    .max(30, "Kode faskes maksimal 30 karakter")
    .regex(/^[A-Z0-9-]+$/, "Kode hanya boleh huruf kapital, angka, dan tanda hubung (-)"),
  name: z.string().trim().min(3, "Nama fasilitas kesehatan minimal 3 karakter"),
  organizationId: z.string().min(1, "Organisasi pengelola wajib dipilih"),
  category: z.enum([
    "RS_TINGKAT_I",
    "RS_TINGKAT_II",
    "RS_TINGKAT_III",
    "RS_TINGKAT_IV",
    "FKTP_KLINIK",
    "LAFIOMED",
  ]),
  province: z.string().trim().min(2, "Provinsi wajib diisi"),
  city: z.string().trim().min(2, "Kabupaten/Kota wajib diisi"),
  address: z.string().trim().min(5, "Alamat lengkap wajib diisi"),
  latitude: z.coerce
    .number()
    .min(-11.5, "Koordinat Lintang (Latitude) di luar wilayah Indonesia (-11.5 s/d 6.5)")
    .max(6.5, "Koordinat Lintang (Latitude) di luar wilayah Indonesia (-11.5 s/d 6.5)"),
  longitude: z.coerce
    .number()
    .min(94.5, "Koordinat Bujur (Longitude) di luar wilayah Indonesia (94.5 s/d 141.5)")
    .max(141.5, "Koordinat Bujur (Longitude) di luar wilayah Indonesia (94.5 s/d 141.5)"),
  bedCapacity: z.coerce.number().int().min(0, "Kapasitas tempat tidur tidak boleh negatif"),
  operationalStatus: z.enum(["OPERASIONAL", "SIAGA_DARURAT", "RENOVASI", "NON_AKTIF"]),
  services: z.string().trim().min(3, "Ringkasan layanan wajib diisi"),
  reportingPeriod: z.string().trim().default("2026-TW4"),
});

export type CreateFacilityInput = z.infer<typeof createFacilitySchema>;

export const verifyFacilitySchema = z.object({
  facilityId: z.string().min(1, "ID Fasilitas wajib ada"),
  status: z.enum(["APPROVED", "NEEDS_REVISION", "REJECTED", "SUBMITTED"]),
  note: z.string().trim().min(3, "Catatan verifikasi/keputusan wajib diisi minimal 3 karakter"),
});

export type VerifyFacilityInput = z.infer<typeof verifyFacilitySchema>;

export const createPersonnelSchema = z.object({
  facilityId: z.string().min(1, "Fasilitas kesehatan wajib dipilih"),
  professionCategory: z.enum([
    "DOKTER_SPESIALIS",
    "DOKTER_UMUM",
    "DOKTER_GIGI",
    "PERAWAT",
    "PARAMEDIS_MILITER",
    "APOTEKER_FARMASI",
    "ANALIS_LAB",
    "BIDAN",
  ]),
  specialization: z.string().trim().min(3, "Spesialisasi/kualifikasi wajib diisi"),
  militaryCount: z.coerce.number().int().min(0, "Jumlah personel militer tidak boleh negatif"),
  civilCount: z.coerce.number().int().min(0, "Jumlah personel ASN/Sipil tidak boleh negatif"),
  standardRequirement: z.coerce.number().int().min(1, "Standar kebutuhan (DSP) minimal 1 personel"),
  certificationNote: z.string().trim().optional(),
});

export type CreatePersonnelInput = z.infer<typeof createPersonnelSchema>;

export const createEquipmentSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Kode alkes minimal 3 karakter")
    .regex(/^[A-Z0-9-]+$/, "Kode hanya boleh huruf kapital, angka, dan tanda hubung (-)"),
  facilityId: z.string().min(1, "Fasilitas kesehatan wajib dipilih"),
  category: z.enum([
    "RADIOLOGI_IMAGING",
    "BEDAH_ANESTESI",
    "ICU_RESUSITASI",
    "HIPERBARIK_AEROMEDIS",
    "EVAKUASI_LAPANGAN",
    "LABORATORIUM",
  ]),
  name: z.string().trim().min(3, "Nama alat kesehatan wajib diisi"),
  goodConditionUnits: z.coerce.number().int().min(0),
  minorDamageUnits: z.coerce.number().int().min(0),
  majorDamageUnits: z.coerce.number().int().min(0),
  operationalStatus: z.enum(["BERFUNGSI", "DALAM_PERBAIKAN", "PERLU_KALIBRASI", "RUSAK_BERAT"]),
  procurementYear: z.coerce.number().int().min(1990).max(2030),
  nextMaintenanceDate: z.string().trim().min(4, "Jadwal pemeliharaan wajib diisi"),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;

export const createMaterialSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Kode matkes minimal 3 karakter")
    .regex(/^[A-Z0-9-]+$/, "Kode hanya boleh huruf kapital, angka, dan tanda hubung (-)"),
  facilityId: z.string().min(1, "Fasilitas kesehatan wajib dipilih"),
  category: z.enum([
    "TRAUMA_COMBAT_KIT",
    "OBAT_ESENSIAL",
    "BMHP_BEDAH",
    "REAGEN_DARAH",
    "APD_CBRN",
    "VAKSIN_SERUM",
  ]),
  name: z.string().trim().min(3, "Nama material kesehatan wajib diisi"),
  unit: z.string().trim().min(1, "Satuan wajib diisi"),
  stockQuantity: z.coerce.number().int().min(0, "Jumlah stok tidak boleh negatif"),
  minThreshold: z.coerce.number().int().min(1, "Ambang batas minimum minimal 1"),
  storageLocation: z.string().trim().min(3, "Lokasi penyimpanan wajib diisi"),
  expiryDate: z.string().trim().min(4, "Tanggal kedaluwarsa wajib diisi"),
});

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;

// ---------------------------------------------------------------------------
// Modul 8: Pengelolaan Data, Validasi & Impor CSV Fasilitas Kesehatan
// ---------------------------------------------------------------------------

export const csvFacilityRowSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Kode faskes minimal 3 karakter")
    .max(30, "Kode faskes maksimal 30 karakter")
    .regex(/^[A-Z0-9-]+$/, "Format kode tidak valid"),
  name: z.string().trim().min(3, "Nama faskes minimal 3 karakter"),
  organizationCode: z.string().trim().min(2, "Kode organisasi wajib diisi"),
  category: z.enum([
    "RS_TINGKAT_I",
    "RS_TINGKAT_II",
    "RS_TINGKAT_III",
    "RS_TINGKAT_IV",
    "FKTP_KLINIK",
    "LAFIOMED",
  ]),
  province: z.string().trim().min(2, "Provinsi wajib diisi"),
  city: z.string().trim().min(2, "Kota/Kabupaten wajib diisi"),
  address: z.string().trim().min(5, "Alamat lengkap wajib diisi"),
  latitude: z.coerce
    .number()
    .min(-11.5, "Lintang di luar wilayah NKRI (-11.5 s/d 6.5)")
    .max(6.5, "Lintang di luar wilayah NKRI (-11.5 s/d 6.5)"),
  longitude: z.coerce
    .number()
    .min(94.5, "Bujur di luar wilayah NKRI (94.5 s/d 141.5)")
    .max(141.5, "Bujur di luar wilayah NKRI (94.5 s/d 141.5)"),
  bedCapacity: z.coerce.number().int().min(0, "Kapasitas TT tidak valid"),
  operationalStatus: z.enum(["OPERASIONAL", "SIAGA_DARURAT", "RENOVASI", "NON_AKTIF"]),
  services: z.string().trim().min(3, "Layanan medis wajib diisi"),
});

export type CsvFacilityRowInput = z.infer<typeof csvFacilityRowSchema>;

export interface ValidatedCsvFacilityRow {
  rowNumber: number;
  rawCode: string;
  rawName: string;
  organizationCode: string;
  category: string;
  province: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  bedCapacity: number;
  operationalStatus: string;
  services: string;
  isValid: boolean;
  statusType: "VALID" | "DUPLIKAT" | "KOORDINAT_INVALID" | "ORGANISASI_INVALID" | "FORMAT_INVALID";
  issues: string[];
  parsedData?: CsvFacilityRowInput;
}

export function parseAndValidateCsvFacilities(
  csvText: string,
  existingFacilityCodes: string[],
  validOrgCodes: string[]
): {
  rows: ValidatedCsvFacilityRow[];
  validCount: number;
  errorCount: number;
} {
  const existingSet = new Set(existingFacilityCodes.map((c) => c.toUpperCase()));
  const orgSet = new Set(validOrgCodes.map((c) => c.toUpperCase()));
  const seenInBatch = new Set<string>();

  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  if (lines.length === 0) {
    return { rows: [], validCount: 0, errorCount: 0 };
  }

  // Skip header if first line starts with "kode" or "code"
  const firstLower = lines[0].toLowerCase();
  const dataLines =
    firstLower.startsWith("kode,") || firstLower.startsWith("code,") ? lines.slice(1) : lines;

  const rows: ValidatedCsvFacilityRow[] = dataLines.map((line, idx) => {
    const parts = line.split(",").map((p) => p.trim());
    const [
      rawCode = "",
      rawName = "",
      organizationCode = "",
      category = "RS_TINGKAT_III",
      province = "",
      city = "",
      address = "",
      rawLat = "0",
      rawLng = "0",
      rawBeds = "0",
      operationalStatus = "OPERASIONAL",
      ...restServices
    ] = parts;

    const services = restServices.join(", ").trim() || "IGD 24 Jam, Poliklinik, Rawat Inap";
    const upperCode = rawCode.toUpperCase();
    const upperOrg = organizationCode.toUpperCase();
    const latNum = Number(rawLat);
    const lngNum = Number(rawLng);
    const bedsNum = Number(rawBeds);

    const issues: string[] = [];
    let statusType: ValidatedCsvFacilityRow["statusType"] = "VALID";

    if (existingSet.has(upperCode)) {
      issues.push(`Kode faskes ${upperCode} sudah terdaftar di database (Duplikat)`);
      statusType = "DUPLIKAT";
    } else if (seenInBatch.has(upperCode)) {
      issues.push(`Kode faskes ${upperCode} duplikat di dalam berkas CSV yang sama`);
      statusType = "DUPLIKAT";
    }

    if (!orgSet.has(upperOrg)) {
      issues.push(
        `Kode satuan organisasi ${upperOrg || "(Kosong)"} tidak ditemukan di Master Organisasi`
      );
      if (statusType === "VALID") statusType = "ORGANISASI_INVALID";
    }

    const parsed = csvFacilityRowSchema.safeParse({
      code: upperCode,
      name: rawName,
      organizationCode: upperOrg,
      category,
      province,
      city,
      address,
      latitude: rawLat,
      longitude: rawLng,
      bedCapacity: rawBeds,
      operationalStatus,
      services,
    });

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        issues.push(issue.message);
        const field = issue.path[0]?.toString();
        if ((field === "latitude" || field === "longitude") && statusType === "VALID") {
          statusType = "KOORDINAT_INVALID";
        } else if (statusType === "VALID") {
          statusType = "FORMAT_INVALID";
        }
      }
    }

    if (upperCode) {
      seenInBatch.add(upperCode);
    }

    const isValid = issues.length === 0 && parsed.success;

    return {
      rowNumber: idx + 1,
      rawCode: upperCode,
      rawName,
      organizationCode: upperOrg,
      category,
      province,
      city,
      address,
      latitude: Number.isFinite(latNum) ? latNum : 0,
      longitude: Number.isFinite(lngNum) ? lngNum : 0,
      bedCapacity: Number.isFinite(bedsNum) ? bedsNum : 0,
      operationalStatus,
      services,
      isValid,
      statusType: isValid ? "VALID" : statusType,
      issues,
      parsedData: isValid && parsed.success ? parsed.data : undefined,
    };
  });

  const validCount = rows.filter((r) => r.isValid).length;
  const errorCount = rows.length - validCount;

  return { rows, validCount, errorCount };
}
