import { describe, it, expect } from "vitest";
import {
  createFacilitySchema,
  createOrganizationSchema,
  verifyFacilitySchema,
  computeMaterialStockStatus,
  getCartoConnectionSummary,
  buildGeomedikGeoJson,
  parseAndValidateCsvFacilities,
} from "@/features/geomedik";

describe("Geomedik GIS Coordinate & Domain Validation (Modul 2, 3, 4, 7, 9)", () => {
  it("should accept valid Indonesian facility coordinates (e.g. Jakarta RSPAD)", () => {
    const parsed = createFacilitySchema.safeParse({
      code: "FASKES-AD-001",
      name: "RSPAD Gatot Soebroto",
      organizationId: "org-ad-puskesad",
      category: "RS_TINGKAT_I",
      province: "DKI Jakarta",
      city: "Jakarta Pusat",
      address: "Jl. Abdul Rahman Saleh No. 24",
      latitude: "-6.1764",
      longitude: "106.8378",
      bedCapacity: "850",
      operationalStatus: "OPERASIONAL",
      services: "IGD 24 Jam, ICU, Trauma Center",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.latitude).toBeCloseTo(-6.1764, 4);
      expect(parsed.data.longitude).toBeCloseTo(106.8378, 4);
      expect(parsed.data.bedCapacity).toBe(850);
    }
  });

  it("should reject facility coordinates outside Indonesia geographic bounds", () => {
    const outOfBounds = createFacilitySchema.safeParse({
      code: "FASKES-INVALID",
      name: "RS Luar Wilayah",
      organizationId: "org-ad-puskesad",
      category: "RS_TINGKAT_II",
      province: "DKI Jakarta",
      city: "Jakarta",
      address: "Jl. Contoh No. 10",
      latitude: "45.0", // Outside Indonesia (-11.5 to 6.5)
      longitude: "106.8",
      bedCapacity: "100",
      operationalStatus: "OPERASIONAL",
      services: "IGD",
    });

    expect(outOfBounds.success).toBe(false);
  });

  it("should validate organization code format and hierarchy level", () => {
    const validOrg = createOrganizationSchema.safeParse({
      code: "AD-KESDAM-III",
      name: "Kesdam III/Siliwangi",
      category: "TNI_AD",
      level: "KOTAMA",
      province: "Jawa Barat",
    });

    expect(validOrg.success).toBe(true);

    const invalidOrgCode = createOrganizationSchema.safeParse({
      code: "invalid code with spaces!",
      name: "Kesdam",
      category: "TNI_AD",
      level: "KOTAMA",
      province: "Jawa Barat",
    });

    expect(invalidOrgCode.success).toBe(false);
  });

  it("should require a verification note when approving or requesting revision", () => {
    const validVerify = verifyFacilitySchema.safeParse({
      facilityId: "fac-rst-soedjono",
      status: "APPROVED",
      note: "Koordinat dan kapasitas tempat tidur telah sesuai berita acara.",
    });
    expect(validVerify.success).toBe(true);

    const emptyNoteVerify = verifyFacilitySchema.safeParse({
      facilityId: "fac-rst-soedjono",
      status: "NEEDS_REVISION",
      note: "ok", // Too short (< 3 chars)
    });
    expect(emptyNoteVerify.success).toBe(false);
  });

  it("should accurately compute material stock status (AMAN, MENIPIS, KRITIS)", () => {
    expect(computeMaterialStockStatus(250, 100)).toBe("AMAN");
    expect(computeMaterialStockStatus(80, 100)).toBe("MENIPIS");
    expect(computeMaterialStockStatus(20, 100)).toBe("KRITIS");
  });

  it("should generate RFC 7946 GeoJSON FeatureCollection for CARTO integration", () => {
    const summary = getCartoConnectionSummary();
    expect(summary.region).toBe("gcp-asia-northeast1");
    expect(summary.accountId).toBe("ac_i59iz3dh");

    const now = new Date();
    const geoJson = buildGeomedikGeoJson([
      {
        id: "fac-1",
        code: "FASKES-AD-001",
        name: "RSPAD Gatot Soebroto",
        organizationId: "org-1",
        category: "RS_TINGKAT_I",
        province: "DKI Jakarta",
        city: "Jakarta Pusat",
        address: "Jl. Abdul Rahman Saleh No. 24",
        latitude: -6.1764,
        longitude: 106.8378,
        bedCapacity: 850,
        operationalStatus: "OPERASIONAL",
        services: "IGD",
        verificationStatus: "APPROVED",
        verificationNote: null,
        verifiedBy: null,
        verifiedAt: null,
        reportingPeriod: "2026-TW4",
        createdAt: now,
        updatedAt: now,
        organization: null,
        personnel: [],
        equipment: [],
        materials: [],
        totalPersonnelCount: 672,
        totalPersonnelRequired: 685,
        totalEquipmentUnits: 4,
        damagedEquipmentUnits: 0,
        criticalMaterialCount: 0,
      },
    ]);

    expect(geoJson.type).toBe("FeatureCollection");
    expect(geoJson.features).toHaveLength(1);
    // RFC 7946 GeoJSON Point coordinates order is [longitude, latitude]
    expect(geoJson.features[0].geometry.coordinates).toEqual([106.8378, -6.1764]);
    expect(geoJson.features[0].properties.code).toBe("FASKES-AD-001");
  });

  it("should validate CSV facility import rows and detect duplicate codes & out-of-bounds coordinates (Modul 8)", () => {
    const csvSample = [
      "kode,nama,kode_organisasi,kategori,provinsi,kota,alamat,latitude,longitude,kapasitas_tt,status_operasional,layanan",
      "FASKES-AD-013,RS Tk. IV Merauke,KESDAM-XVII,RS_TINGKAT_IV,Papua Selatan,Kab. Merauke,Jl. Poros Merauke,-8.4932,140.4018,85,OPERASIONAL,IGD Perbatasan",
      "FASKES-AD-001,RSPAD Duplikat,PUSKESAD,RS_TINGKAT_I,DKI Jakarta,Jakarta Pusat,Jl. Abdul Rahman Saleh,-6.1764,106.8378,850,OPERASIONAL,IGD",
      "FASKES-AD-099,RS Luar NKRI,KESDAM-JAYA,RS_TINGKAT_III,DKI Jakarta,Jakarta Timur,Jl. Uji Koordinat,25.0000,152.0000,100,OPERASIONAL,IGD",
    ].join("\n");

    const result = parseAndValidateCsvFacilities(
      csvSample,
      ["FASKES-AD-001"],
      ["KESDAM-XVII", "PUSKESAD", "KESDAM-JAYA"]
    );

    expect(result.rows).toHaveLength(3);
    expect(result.validCount).toBe(1);
    expect(result.errorCount).toBe(2);
    expect(result.rows[0].statusType).toBe("VALID");
    expect(result.rows[1].statusType).toBe("DUPLIKAT");
    expect(result.rows[2].statusType).toBe("KOORDINAT_INVALID");
  });
});
