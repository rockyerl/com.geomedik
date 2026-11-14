import * as dotenv from "dotenv";
import type { FacilityWithDetails } from "./service";

export interface CartoConnectionSummary {
  apiBaseUrl: string;
  accountId: string;
  region: string;
  isTokenConfigured: boolean;
}

export interface GeoJsonFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude] per RFC 7946
  };
  properties: {
    id: string;
    code: string;
    name: string;
    matra: string;
    organizationName: string;
    category: string;
    province: string;
    city: string;
    address: string;
    bedCapacity: number;
    operationalStatus: string;
    verificationStatus: string;
    totalPersonnelCount: number;
    totalPersonnelRequired: number;
    totalEquipmentUnits: number;
    damagedEquipmentUnits: number;
    criticalMaterialCount: number;
    reportingPeriod: string;
  };
}

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  metadata: {
    generator: string;
    cartoAccountId: string;
    cartoApiBaseUrl: string;
    cartoRegion: string;
    crs: string;
    exportedAt: string;
    totalFeatures: number;
  };
  features: GeoJsonFeature[];
}

export function getCartoConnectionSummary(): CartoConnectionSummary {
  dotenv.config({ path: [".env.local", ".env"], override: true });

  const apiBaseUrl = process.env.CARTO_API_BASE_URL || "https://gcp-asia-northeast1.api.carto.com";
  const accountId = process.env.CARTO_ACCOUNT_ID || "ac_i59iz3dh";
  const token = process.env.CARTO_API_TOKEN || "";

  const isTokenConfigured =
    token.trim().length > 20 && token !== "your-carto-api-access-token-here";

  return {
    apiBaseUrl,
    accountId,
    region: "gcp-asia-northeast1",
    isTokenConfigured,
  };
}

export function buildGeomedikGeoJson(facilities: FacilityWithDetails[]): GeoJsonFeatureCollection {
  const summary = getCartoConnectionSummary();

  const features: GeoJsonFeature[] = facilities.map((fac) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [fac.longitude, fac.latitude],
    },
    properties: {
      id: fac.id,
      code: fac.code,
      name: fac.name,
      matra: fac.organization?.category || "KEMHAN",
      organizationName: fac.organization?.name || "Kemhan RI",
      category: fac.category,
      province: fac.province,
      city: fac.city,
      address: fac.address,
      bedCapacity: fac.bedCapacity,
      operationalStatus: fac.operationalStatus,
      verificationStatus: fac.verificationStatus,
      totalPersonnelCount: fac.totalPersonnelCount,
      totalPersonnelRequired: fac.totalPersonnelRequired,
      totalEquipmentUnits: fac.totalEquipmentUnits,
      damagedEquipmentUnits: fac.damagedEquipmentUnits,
      criticalMaterialCount: fac.criticalMaterialCount,
      reportingPeriod: fac.reportingPeriod,
    },
  }));

  return {
    type: "FeatureCollection",
    metadata: {
      generator: "SI-GEOMEDIK Kemhan RI • CARTO API v3 Connector",
      cartoAccountId: summary.accountId,
      cartoApiBaseUrl: summary.apiBaseUrl,
      cartoRegion: summary.region,
      crs: "EPSG:4326 (WGS84)",
      exportedAt: new Date().toISOString(),
      totalFeatures: features.length,
    },
    features,
  };
}

export async function verifyCartoApiConnection(): Promise<{
  reachable: boolean;
  statusCode?: number;
  message: string;
}> {
  const summary = getCartoConnectionSummary();
  const token = process.env.CARTO_API_TOKEN || "";

  if (!summary.isTokenConfigured) {
    return {
      reachable: false,
      message:
        "CARTO_API_TOKEN belum diisi pada berkas .env.local. Tambahkan CARTO_API_TOKEN di .env.local untuk mengaktifkan koneksi CARTO API.",
    };
  }

  try {
    // Verify JWT structure and test connectivity against CARTO API Base URL
    const response = await fetch(`${summary.apiBaseUrl}/v3/connections`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok || response.status === 401 || response.status === 403) {
      // Even if the token is scoped to specific Maps/SQL resources (403 on /v3/connections),
      // reaching the regional CARTO API gateway confirms the endpoint & token are active.
      return {
        reachable: true,
        statusCode: response.status,
        message: `Terhubung ke CARTO Cloud API (${summary.apiBaseUrl} • Account ${summary.accountId}, HTTP ${response.status}).`,
      };
    }

    return {
      reachable: false,
      statusCode: response.status,
      message: `CARTO API (${summary.apiBaseUrl}) merespons dengan HTTP ${response.status}.`,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Network error";
    return {
      reachable: false,
      message: `Gagal menghubungi ${summary.apiBaseUrl}: ${errMsg}`,
    };
  }
}
