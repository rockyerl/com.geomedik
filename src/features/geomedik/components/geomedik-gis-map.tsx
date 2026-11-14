"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import type * as LeafletTypes from "leaflet";
import { Badge, Modal } from "@/shared";
import type { Organization } from "@/db/schema";
import type { FacilityWithDetails } from "../service";
import type { CartoConnectionSummary, GeoJsonFeatureCollection } from "../carto";
import {
  ORG_CATEGORIES,
  FACILITY_CATEGORIES,
  OPERATIONAL_STATUSES,
  VERIFICATION_STATUSES,
} from "../dto";
import {
  createFacilityAction,
  checkCartoMcpConnectionAction,
  type GeomedikActionResult,
} from "../actions";
import {
  MapPin,
  Layers,
  Search,
  RotateCcw,
  Plus,
  Crosshair,
  BedDouble,
  Stethoscope,
  Activity,
  PackageCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Navigation,
  Radio,
  Building2,
  Download,
  Globe,
  RefreshCw,
} from "lucide-react";

interface GisMapViewProps {
  facilities: FacilityWithDetails[];
  organizations: Organization[];
  canManageFacilities: boolean;
  cartoConfig: CartoConnectionSummary;
  geoJsonCollection: GeoJsonFeatureCollection;
}

type BaseLayerKey = "topo" | "osm" | "light" | "dark" | "satellite";

const BASE_LAYERS: Record<BaseLayerKey, { label: string; url: string; attribution: string }> = {
  topo: {
    label: "Peta Topografi Taktis",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; National Geographic, DeLorme, NAVTEQ",
  },
  osm: {
    label: "OpenStreetMap Nasional",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
  light: {
    label: "Peta Kanvas Terang",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
  },
  dark: {
    label: "Peta Komando Gelap",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
  },
  satellite: {
    label: "Citra Satelit (World Imagery)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
  },
};

function getMatraColor(category?: string): { bg: string; border: string; label: string } {
  switch (category) {
    case "TNI_AD":
      return { bg: "#15803d", border: "#dcfce7", label: "TNI AD" };
    case "TNI_AL":
      return { bg: "#0369a1", border: "#e0f2fe", label: "TNI AL" };
    case "TNI_AU":
      return { bg: "#4338ca", border: "#e0e7ff", label: "TNI AU" };
    case "MABES_TNI":
      return { bg: "#b45309", border: "#fef3c7", label: "Mabes TNI" };
    case "KEMHAN":
    default:
      return { bg: "#7e22ce", border: "#f3e8ff", label: "Kemhan RI" };
  }
}

export interface StrategicRiskZone {
  id: string;
  code: string;
  name: string;
  threatType: string;
  riskLevel: "TINGGI" | "SEDANG";
  latitude: number;
  longitude: number;
  radiusMeters: number;
  color: string;
  description: string;
  keyFacilityCode: string;
}

export const STRATEGIC_RISK_ZONES: StrategicRiskZone[] = [
  {
    id: "zone-natuna",
    code: "ZONA-01",
    name: "Zona Siaga Pertahanan Laut Natuna Utara",
    threatType: "Perbatasan Maritim & ALKI I",
    riskLevel: "TINGGI",
    latitude: 3.9488,
    longitude: 108.3885,
    radiusMeters: 165000,
    color: "#ef4444",
    description:
      "Wilayah perbatasan maritim strategis ALKI I & Laut Natuna Utara. Prioritas evakuasi medis udara/laut & kesiapsiagaan hyperbaric/trauma.",
    keyFacilityCode: "FASKES-AU-007",
  },
  {
    id: "zone-ikn",
    code: "ZONA-02",
    name: "Zona Penyangga Medis IKN & ALKI II Kaltim",
    threatType: "Objek Vital Strategis Nasional",
    riskLevel: "TINGGI",
    latitude: -1.15,
    longitude: 116.85,
    radiusMeters: 135000,
    color: "#f59e0b",
    description:
      "Kawasan penyangga kesehatan pertahanan Ibu Kota Nusantara (IKN) & jalur pelayaran strategis Selat Makassar.",
    keyFacilityCode: "FASKES-AD-052",
  },
  {
    id: "zone-sumbar",
    code: "ZONA-03",
    name: "Zona Rawan Bencana Megathrust Pantai Barat Sumatera",
    threatType: "Rawan Gempa & Tsunami Megathrust",
    riskLevel: "TINGGI",
    latitude: -0.9471,
    longitude: 100.3672,
    radiusMeters: 150000,
    color: "#ea580c",
    description:
      "Zona megathrust & kontijensi bencana Sumatera Barat. Membutuhkan kesiapan RS Lapangan, bedah ortopedi/trauma, dan cadangan matkes darurat.",
    keyFacilityCode: "FASKES-AD-008",
  },
  {
    id: "zone-kalbar",
    code: "ZONA-04",
    name: "Zona Perbatasan Darat RI–Malaysia (Kalimantan Barat)",
    threatType: "Sabuk Perbatasan Darat & Endemis",
    riskLevel: "SEDANG",
    latitude: 0.15,
    longitude: 109.55,
    radiusMeters: 145000,
    color: "#eab308",
    description:
      "Sabuk pengamanan perbatasan darat Entikong–Sanggau–Pontianak dan pengendalian penyakit endemis/malaria tropis.",
    keyFacilityCode: "FASKES-AD-048",
  },
  {
    id: "zone-ntt",
    code: "ZONA-05",
    name: "Zona Perbatasan RI–RDTL & Pulau Terluar Selatan (NTT)",
    threatType: "Perbatasan Darat & Pulau Terluar",
    riskLevel: "TINGGI",
    latitude: -10.1688,
    longitude: 123.5844,
    radiusMeters: 140000,
    color: "#ef4444",
    description:
      "Wilayah perbatasan darat RI–Timor Leste & pulau terselatan (Rote/Ndana). Fokus dukungan kesehatan operasi pengamanan perbatasan.",
    keyFacilityCode: "FASKES-AD-046",
  },
  {
    id: "zone-papua",
    code: "ZONA-06",
    name: "Zona Siaga Dukungan Medis Wilayah Timur & Papua",
    threatType: "Operasi Pengamanan Wilayah Timur",
    riskLevel: "TINGGI",
    latitude: -2.5337,
    longitude: 140.7181,
    radiusMeters: 175000,
    color: "#dc2626",
    description:
      "Koridor dukungan medis gabungan (AD, AL, AU) untuk satuan tugas pengamanan wilayah Papua & evakuasi medik udara Biak–Jayapura.",
    keyFacilityCode: "FASKES-AD-066",
  },
];

export function GisMapView({
  facilities,
  organizations,
  canManageFacilities,
  cartoConfig,
  geoJsonCollection,
}: GisMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [mapMountGeneration, setMapMountGeneration] = useState<number>(0);
  const detailPanelRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletTypes.Map | null>(null);
  const tileLayerRef = useRef<LeafletTypes.TileLayer | null>(null);
  const markersLayerRef = useRef<LeafletTypes.LayerGroup | null>(null);
  const leafletModuleRef = useRef<typeof LeafletTypes | null>(null);

  const handleMapContainerRef = React.useCallback((node: HTMLDivElement | null) => {
    if (mapContainerRef.current !== node) {
      mapContainerRef.current = node;
      if (node) {
        setMapMountGeneration((prev) => prev + 1);
      }
    }
  }, []);

  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [baseLayer, setBaseLayer] = useState<BaseLayerKey>("topo");
  const [showRadiusLayer, setShowRadiusLayer] = useState<boolean>(true);
  const [showRiskZonesLayer, setShowRiskZonesLayer] = useState<boolean>(true);
  const [onlyAlertFacilities, setOnlyAlertFacilities] = useState<boolean>(false);
  const [isPickingCoord, setIsPickingCoord] = useState<boolean>(false);
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // CARTO MCP Ping state
  const [isPingingCarto, setIsPingingCarto] = useState(false);
  const [cartoPingResult, setCartoPingResult] = useState<{
    reachable: boolean;
    message: string;
  } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMatra, setFilterMatra] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterOperational, setFilterOperational] = useState("ALL");
  const [filterVerification, setFilterVerification] = useState("ALL");

  // Selected Facility for Side Inspection Panel
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(
    facilities[0]?.id || null
  );

  // Add Facility Modal state (with picked coordinates)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pickedLat, setPickedLat] = useState<string>("-6.1764");
  const [pickedLng, setPickedLng] = useState<string>("106.8378");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionResult, setActionResult] = useState<GeomedikActionResult | null>(null);

  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchName = f.name.toLowerCase().includes(q);
        const matchCode = f.code.toLowerCase().includes(q);
        const matchCity = f.city.toLowerCase().includes(q);
        const matchProv = f.province.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchCity && !matchProv) return false;
      }
      if (filterMatra !== "ALL" && f.organization?.category !== filterMatra) {
        return false;
      }
      if (filterCategory !== "ALL" && f.category !== filterCategory) {
        return false;
      }
      if (filterOperational !== "ALL" && f.operationalStatus !== filterOperational) {
        return false;
      }
      if (filterVerification !== "ALL" && f.verificationStatus !== filterVerification) {
        return false;
      }
      if (onlyAlertFacilities) {
        const hasAlert =
          f.criticalMaterialCount > 0 ||
          f.damagedEquipmentUnits > 0 ||
          f.operationalStatus !== "OPERASIONAL" ||
          f.verificationStatus !== "APPROVED";
        if (!hasAlert) return false;
      }
      return true;
    });
  }, [
    facilities,
    searchQuery,
    filterMatra,
    filterCategory,
    filterOperational,
    filterVerification,
    onlyAlertFacilities,
  ]);

  const selectedFacility = useMemo(() => {
    return (
      filteredFacilities.find((f) => f.id === selectedFacilityId) ||
      facilities.find((f) => f.id === selectedFacilityId) ||
      filteredFacilities[0] ||
      null
    );
  }, [filteredFacilities, facilities, selectedFacilityId]);

  // Initialize Leaflet Map whenever the DOM element is attached/replaced
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    let isCancelled = false;
    let localMap: LeafletTypes.Map | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let invalidateTimer: ReturnType<typeof setTimeout> | null = null;

    async function initMap() {
      const targetEl = mapContainerRef.current;
      if (!targetEl) return;

      const importedModule = await import("leaflet");
      const L = (
        "default" in importedModule && importedModule.default
          ? importedModule.default
          : importedModule
      ) as typeof LeafletTypes;

      if (isCancelled || !mapContainerRef.current) return;
      leafletModuleRef.current = L;

      // Clean up any stale Leaflet instance attached to the same DOM node
      const containerWithId = mapContainerRef.current as HTMLDivElement & {
        _leaflet_id?: number | null;
      };
      if (containerWithId._leaflet_id) {
        containerWithId._leaflet_id = null;
        mapContainerRef.current.innerHTML = "";
      }

      const map = L.map(mapContainerRef.current, {
        center: [-2.6, 117.5],
        zoom: 5,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: true,
      });

      localMap = map;

      const initialTile = BASE_LAYERS.topo;
      const tileLayer = L.tileLayer(initialTile.url, {
        attribution: initialTile.attribution,
        maxZoom: 19,
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      tileLayerRef.current = tileLayer;
      markersLayerRef.current = markersLayer;
      setIsMapReady(true);

      map.invalidateSize();
      invalidateTimer = setTimeout(() => {
        if (!isCancelled && localMap) {
          localMap.invalidateSize();
        }
      }, 200);

      if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (!isCancelled && localMap) {
            localMap.invalidateSize();
          }
        });
        resizeObserver.observe(mapContainerRef.current);
      }
    }

    initMap();

    return () => {
      isCancelled = true;
      if (invalidateTimer) {
        clearTimeout(invalidateTimer);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (localMap) {
        localMap.remove();
        localMap = null;
      }
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      markersLayerRef.current = null;
      setIsMapReady(false);
    };
  }, [mapMountGeneration]);

  // Handle Map Click when Coordinate Picker Mode is active
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isMapReady || !map) return;

    function handleMapClick(e: LeafletTypes.LeafletMouseEvent) {
      if (!isPickingCoord) return;
      const lat = e.latlng.lat.toFixed(4);
      const lng = e.latlng.lng.toFixed(4);
      setPickedLat(lat);
      setPickedLng(lng);
      setIsPickingCoord(false);
      setIsAddModalOpen(true);
    }

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [isMapReady, isPickingCoord]);

  // Switch Base Layer when `baseLayer` state changes
  useEffect(() => {
    const L = leafletModuleRef.current;
    const map = mapInstanceRef.current;
    if (!isMapReady || !L || !map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const cfg = BASE_LAYERS[baseLayer];
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: 19,
    }).addTo(map);
  }, [isMapReady, baseLayer]);

  // Render Markers & Coverage Radius Circles whenever filteredFacilities or showRadiusLayer changes
  useEffect(() => {
    const L = leafletModuleRef.current;
    const map = mapInstanceRef.current;
    const group = markersLayerRef.current;
    if (!isMapReady || !L || !map || !group) return;

    group.clearLayers();

    filteredFacilities.forEach((fac) => {
      const matraStyle = getMatraColor(fac.organization?.category);
      const isSelected = selectedFacility?.id === fac.id;
      const hasWarning = fac.criticalMaterialCount > 0 || fac.damagedEquipmentUnits > 0;

      // Optional 75km service coverage radius circle
      if (showRadiusLayer) {
        L.circle([fac.latitude, fac.longitude], {
          radius: 75000, // 75 km radius rujukan regional
          color: matraStyle.bg,
          weight: 1.5,
          fillColor: matraStyle.bg,
          fillOpacity: isSelected ? 0.18 : 0.08,
          dashArray: fac.operationalStatus === "OPERASIONAL" ? undefined : "4 4",
        }).addTo(group);
      }

      const size = isSelected ? 36 : 28;
      const pulseRing = hasWarning
        ? `<span style="position:absolute;top:-4px;right:-4px;width:11px;height:11px;background:#ef4444;border:2px solid #fff;border-radius:9999px;"></span>`
        : "";

      const iconHtml = `
        <div style="
          position: relative;
          width: ${size}px;
          height: ${size}px;
          border-radius: 9999px;
          background: ${matraStyle.bg};
          border: 3px solid ${isSelected ? "#facc15" : "#ffffff"};
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 800;
          font-size: 11px;
          transition: transform 0.2s;
        ">
          <span>+</span>
          ${pulseRing}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "geomedik-custom-marker",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
      });

      const marker = L.marker([fac.latitude, fac.longitude], { icon: customIcon });

      const popupContent = `
        <div style="min-width: 220px; font-family: system-ui, sans-serif;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${matraStyle.bg}; margin-bottom: 2px;">
            ${matraStyle.label} • ${fac.code}
          </div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
            ${fac.name}
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
            ${fac.city}, ${fac.province}<br/>
            <span style="font-family: monospace; font-size: 10px;">Koordinat: ${fac.latitude.toFixed(4)}, ${fac.longitude.toFixed(4)}</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #f8fafc; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 11px;">
            <div><strong>Kapasitas:</strong> ${fac.bedCapacity} TT</div>
            <div><strong>SDM:</strong> ${fac.totalPersonnelCount} Pers</div>
            <div><strong>Alkes:</strong> ${fac.totalEquipmentUnits} Unit</div>
            <div><strong>Matkes Kritis:</strong> ${fac.criticalMaterialCount} Item</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on("click", () => {
        setSelectedFacilityId(fac.id);
      });

      marker.addTo(group);
    });

    // Layer Peta Risiko, Kedaruratan & Zona Strategis Pertahanan
    if (showRiskZonesLayer) {
      STRATEGIC_RISK_ZONES.forEach((zone) => {
        L.circle([zone.latitude, zone.longitude], {
          radius: zone.radiusMeters,
          color: zone.color,
          weight: 2,
          fillColor: zone.color,
          fillOpacity: 0.12,
          dashArray: "6 6",
        }).addTo(group);

        const zoneBadgeHtml = `
          <div style="
            background: rgba(15, 23, 42, 0.92);
            color: #ffffff;
            border: 1.5px solid ${zone.color};
            padding: 2px 7px;
            border-radius: 9999px;
            font-size: 9px;
            font-weight: 800;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: inline-flex;
            align-items: center;
            gap: 4px;
          ">
            <span style="width:6px;height:6px;border-radius:9999px;background:${zone.color};display:inline-block;"></span>
            <span>${zone.code} • SIAGA ${zone.riskLevel}</span>
          </div>
        `;

        const zoneIcon = L.divIcon({
          html: zoneBadgeHtml,
          className: "geomedik-zone-badge",
          iconSize: [110, 22],
          iconAnchor: [55, -14],
        });

        const zoneMarker = L.marker([zone.latitude, zone.longitude], {
          icon: zoneIcon,
        });

        zoneMarker.bindPopup(`
          <div style="min-width: 220px; font-family: system-ui, sans-serif;">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${zone.color}; margin-bottom: 2px;">
              ZONA KONTIJENSI • ${zone.code} (${zone.riskLevel})
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
              ${zone.name}
            </div>
            <div style="font-size: 11px; color: #334155; margin-bottom: 6px;">
              <strong>Ancaman/Kontijensi:</strong> ${zone.threatType}
            </div>
            <div style="font-size: 11px; color: #475569; line-height: 1.4;">
              ${zone.description}
            </div>
          </div>
        `);

        zoneMarker.addTo(group);
      });
    }
  }, [isMapReady, filteredFacilities, selectedFacility, showRadiusLayer, showRiskZonesLayer]);

  function focusFacilityOnMap(fac: FacilityWithDetails) {
    setSelectedFacilityId(fac.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([fac.latitude, fac.longitude], 10, {
        duration: 1.2,
      });
    }
  }

  function focusRiskZoneOnMap(zone: StrategicRiskZone) {
    const matchingFacility = facilities.find((f) => f.code === zone.keyFacilityCode);
    if (matchingFacility) {
      setSelectedFacilityId(matchingFacility.id);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([zone.latitude, zone.longitude], 7, {
        duration: 1.2,
      });
    }
  }

  function resetNationalView() {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([-2.6, 117.5], 5, {
        duration: 1.0,
      });
    }
  }

  function handleExportGeoJson() {
    const blob = new Blob([JSON.stringify(geoJsonCollection, null, 2)], {
      type: "application/geo+json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `geomedik-kemhan-${cartoConfig.accountId}.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handlePingCarto() {
    setIsPingingCarto(true);
    const res = await checkCartoMcpConnectionAction();
    setCartoPingResult(res);
    setIsPingingCarto(false);
  }

  async function handleAddFacilitySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setActionResult(null);

    const formData = new FormData(e.currentTarget);
    const res = await createFacilityAction(null, formData);
    setIsSubmitting(false);

    if (res.success) {
      setIsAddModalOpen(false);
    } else {
      setActionResult(res);
    }
  }

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">WebGIS Nasional & CARTO Spatial Intelligence</Badge>
            <span className="text-xs text-slate-400 font-mono">WGS84 (EPSG:4326)</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1 leading-snug">
            Peta Geomedik & Sebaran Sumber Daya Kesehatan Pertahanan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualisasi interaktif lokasi Fasilitas Kesehatan Kemhan & TNI beserta kesiapan Tempat
            Tidur, SDM, Alat Kesehatan, dan Material Kesehatan.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={resetNationalView}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Reset Nasional</span>
          </button>

          <button
            type="button"
            onClick={handleExportGeoJson}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Ekspor GeoJSON</span>
          </button>

          {canManageFacilities && (
            <>
              <button
                type="button"
                onClick={() => setIsPickingCoord((prev) => !prev)}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                  isPickingCoord
                    ? "bg-amber-500 text-white border-amber-600 shadow-sm animate-pulse"
                    : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                }`}
              >
                <Crosshair className="w-3.5 h-3.5 shrink-0" />
                <span>{isPickingCoord ? "Klik Peta..." : "Ambil Koordinat"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActionResult(null);
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Input Faskes</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* CARTO Cloud API Integration Banner */}
      <div className="bg-slate-900 text-slate-200 p-3.5 sm:p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div className="text-xs min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-white">CARTO Location Intelligence API</span>
              <Badge variant="purple">{cartoConfig.region}</Badge>
              <span className="font-mono text-[11px] text-emerald-400">
                Account: {cartoConfig.accountId}
              </span>
              {cartoConfig.isTokenConfigured ? (
                <Badge variant="success">Token .env.local Aktif</Badge>
              ) : (
                <Badge variant="warning">Set CARTO_API_TOKEN di .env.local</Badge>
              )}
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5 font-mono truncate">
              API Base URL: {cartoConfig.apiBaseUrl}
            </p>
            {cartoPingResult && (
              <p
                className={`text-[11px] mt-1 font-medium ${
                  cartoPingResult.reachable ? "text-emerald-400" : "text-amber-300"
                }`}
              >
                {cartoPingResult.message}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handlePingCarto}
          disabled={isPingingCarto}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white shrink-0 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPingingCarto ? "animate-spin" : ""}`} />
          {isPingingCarto ? "Menguji..." : "Uji Koneksi CARTO API"}
        </button>
      </div>

      {/* Multi-Filter & Layer Control Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          {/* Search always visible */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, kode, kota/provinsi..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowMobileFilters((prev) => !prev)}
            className="md:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 shrink-0"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>{showMobileFilters ? "Tutup Filter" : "Filter & Layer"}</span>
          </button>
        </div>

        {/* Collapsible Filters on Mobile, Always Open on Desktop */}
        <div
          className={`${
            showMobileFilters ? "grid" : "hidden md:grid"
          } grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3`}
        >
          {/* Filter Matra */}
          <select
            value={filterMatra}
            onChange={(e) => setFilterMatra(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Instansi / Matra</option>
            {ORG_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Filter Kategori Faskes */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Tingkat Faskes</option>
            {FACILITY_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Filter Status Operasional */}
          <select
            value={filterOperational}
            onChange={(e) => setFilterOperational(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Status Operasional</option>
            {OPERATIONAL_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Filter Status Verifikasi */}
          <select
            value={filterVerification}
            onChange={(e) => setFilterVerification(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Status Verifikasi</option>
            {VERIFICATION_STATUSES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {/* Layer Controls & Legend */}
        <div
          className={`${
            showMobileFilters ? "flex" : "hidden md:flex"
          } pt-2 border-t border-slate-100 flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Basemap:</span>
            </div>
            {(Object.keys(BASE_LAYERS) as BaseLayerKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setBaseLayer(key)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  baseLayer === key
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {BASE_LAYERS[key].label}
              </button>
            ))}

            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={showRadiusLayer}
                onChange={(e) => setShowRadiusLayer(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Radius Jangkauan (75 km)</span>
            </label>

            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-amber-800 font-medium">
              <input
                type="checkbox"
                checked={showRiskZonesLayer}
                onChange={(e) => setShowRiskZonesLayer(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span>Zona Risiko & Strategis</span>
            </label>

            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-rose-700 font-medium">
              <input
                type="checkbox"
                checked={onlyAlertFacilities}
                onChange={(e) => setOnlyAlertFacilities(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span>Hanya Faskes Peringatan</span>
            </label>
          </div>

          {/* Matra Color Legend */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-700 inline-block" /> Kemhan
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-green-700 inline-block" /> TNI AD
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-700 inline-block" /> TNI AL
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-700 inline-block" /> TNI AU
            </span>
          </div>
        </div>
      </div>

      {/* Main Map + Tactical Side Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Map Canvas (8 columns) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-300 shadow-md">
            {isPickingCoord && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-amber-500 text-white px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold shadow-lg flex items-center gap-2 max-w-[92%] text-center">
                <Crosshair className="w-4 h-4 animate-spin shrink-0" />
                <span>Klik lokasi di peta untuk mengambil titik koordinat</span>
              </div>
            )}

            <div
              ref={handleMapContainerRef}
              className="w-full z-10"
              style={{
                width: "100%",
                height: "520px",
                minHeight: "400px",
                cursor: isPickingCoord ? "crosshair" : "grab",
              }}
            />

            {/* Bottom Overlay Status Bar */}
            <div className="bg-slate-900 text-slate-300 px-3.5 sm:px-4 py-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Menampilkan <strong>{filteredFacilities.length}</strong> dari{" "}
                    <strong>{facilities.length}</strong> Faskes
                  </span>
                </div>

                {selectedFacility && (
                  <button
                    type="button"
                    onClick={() =>
                      detailPanelRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      })
                    }
                    className="lg:hidden text-[11px] font-bold text-emerald-400 underline shrink-0"
                  >
                    Lihat Detail RS &darr;
                  </button>
                )}
              </div>
              <div className="font-mono text-[10px] sm:text-[11px] text-slate-400">
                CARTO Tiles • WGS 1984 (EPSG:4326) • Cakupan NKRI
              </div>
            </div>
          </div>

          {/* Quick Horizontal List of Filtered Facilities */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Daftar Cepat Lokasi Faskes (Klik untuk Fokus Peta)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto pr-1">
              {filteredFacilities.map((fac) => {
                const isSelected = selectedFacility?.id === fac.id;
                const matra = getMatraColor(fac.organization?.category);
                return (
                  <button
                    key={fac.id}
                    type="button"
                    onClick={() => focusFacilityOnMap(fac)}
                    className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20"
                        : "bg-slate-50/70 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                          style={{ backgroundColor: matra.bg }}
                        >
                          {matra.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{fac.code}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-1.5 truncate">{fac.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {fac.city}, {fac.province}
                      </p>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-[10px] text-slate-600">
                      <span>{fac.bedCapacity} TT</span>
                      <span className="font-mono">
                        {fac.latitude.toFixed(2)}, {fac.longitude.toFixed(2)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Analisis Peta Risiko, Kedaruratan & Zona Strategis Pertahanan */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning">Peta Risiko & Kedaruratan Strategis</Badge>
                  <span className="text-[11px] text-slate-500">
                    6 Zona Kontijensi & Perbatasan Strategis NKRI
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  Zona Siaga Pertahanan, Perbatasan & Kontijensi Bencana Medis
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRiskZonesLayer((prev) => !prev)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
              >
                {showRiskZonesLayer ? "Sembunyikan Layer Zona" : "Tampilkan Layer Zona"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {STRATEGIC_RISK_ZONES.map((zone) => {
                const keyFac = facilities.find((f) => f.code === zone.keyFacilityCode);
                return (
                  <div
                    key={zone.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: zone.color }}
                        >
                          {zone.code} • SIAGA {zone.riskLevel}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          Radius {(zone.radiusMeters / 1000).toFixed(0)} km
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-1.5">{zone.name}</p>
                      <p className="text-[11px] font-medium text-amber-800 mt-0.5">
                        {zone.threatType}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        {zone.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-600 truncate">
                        Faskes Rujukan:{" "}
                        <strong className="text-slate-800">
                          {keyFac ? keyFac.name : zone.keyFacilityCode}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => focusRiskZoneOnMap(zone)}
                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold shrink-0"
                      >
                        <Navigation className="w-3 h-3" /> Fokus Zona
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side Inspection Panel (4 columns) */}
        <div ref={detailPanelRef} className="lg:col-span-4 scroll-mt-20">
          {selectedFacility ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-20">
              <div className="bg-slate-900 text-white p-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="purple">{selectedFacility.code}</Badge>
                  <Badge
                    variant={
                      selectedFacility.verificationStatus === "APPROVED"
                        ? "success"
                        : selectedFacility.verificationStatus === "SUBMITTED"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {selectedFacility.verificationStatus === "APPROVED" ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    {selectedFacility.verificationStatus}
                  </Badge>
                </div>

                <h3 className="text-lg font-bold text-white leading-snug">
                  {selectedFacility.name}
                </h3>
                <p className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{selectedFacility.organization?.name || "Kemhan / TNI"}</span>
                </p>

                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedFacility.city}, {selectedFacility.province}
                  </span>
                  <button
                    type="button"
                    onClick={() => focusFacilityOnMap(selectedFacility)}
                    className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    <Navigation className="w-3 h-3" /> Zoom Titik
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-5 max-h-[580px] overflow-y-auto">
                {/* Coordinate & Status Box */}
                <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                      Koordinat Lintang/Bujur
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedFacility.latitude.toFixed(4)},{" "}
                      {selectedFacility.longitude.toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                      Status Operasional
                    </span>
                    <span className="font-bold text-slate-800">
                      {selectedFacility.operationalStatus.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Key Metrics of Selected Facility */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <BedDouble className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">
                        Tempat Tidur
                      </p>
                      <p className="text-base font-bold text-slate-900">
                        {selectedFacility.bedCapacity} TT
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">
                        Total SDM
                      </p>
                      <p className="text-base font-bold text-slate-900">
                        {selectedFacility.totalPersonnelCount}{" "}
                        <span className="text-xs font-normal text-slate-500">
                          / {selectedFacility.totalPersonnelRequired}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">
                        Unit Alkes
                      </p>
                      <p className="text-base font-bold text-slate-900">
                        {selectedFacility.totalEquipmentUnits} Unit
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <PackageCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">
                        Matkes Kritis
                      </p>
                      <p className="text-base font-bold text-slate-900">
                        {selectedFacility.criticalMaterialCount} Item
                      </p>
                    </div>
                  </div>
                </div>

                {/* Layanan Unggulan */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Kapabilitas & Layanan Medis
                  </h4>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                    {selectedFacility.services || "Layanan kesehatan umum dan rujukan satuan."}
                  </p>
                </div>

                {/* SDM Breakdown */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Rekap SDM Kesehatan ({selectedFacility.personnel.length} Kelompok)
                  </h4>
                  {selectedFacility.personnel.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Belum ada data rekap SDM.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedFacility.personnel.map((p) => {
                        const pct =
                          p.standardRequirement > 0
                            ? Math.round((p.totalAvailable / p.standardRequirement) * 100)
                            : 100;
                        return (
                          <div
                            key={p.id}
                            className="p-2.5 rounded-lg border border-slate-200 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between font-semibold text-slate-800">
                              <span>{p.specialization}</span>
                              <span
                                className={
                                  pct < 80 ? "text-rose-600 font-bold" : "text-emerald-700"
                                }
                              >
                                {p.totalAvailable}/{p.standardRequirement} ({pct}%)
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Militer: {p.militaryCount} • PNS/Sipil: {p.civilCount}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Alkes & Matkes Alerts */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Status Alat & Material Kesehatan
                  </h4>
                  <div className="space-y-2">
                    {selectedFacility.equipment.map((eq) => (
                      <div
                        key={eq.id}
                        className="p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{eq.name}</p>
                          <p className="text-[11px] text-slate-500">
                            Baik: {eq.goodConditionUnits} • Rusak:{" "}
                            {eq.minorDamageUnits + eq.majorDamageUnits}
                          </p>
                        </div>
                        <Badge
                          variant={eq.operationalStatus === "BERFUNGSI" ? "success" : "warning"}
                        >
                          {eq.operationalStatus.replace("_", " ")}
                        </Badge>
                      </div>
                    ))}

                    {selectedFacility.materials.map((mat) => (
                      <div
                        key={mat.id}
                        className="p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{mat.name}</p>
                          <p className="text-[11px] text-slate-500">
                            Stok: {mat.stockQuantity} {mat.unit} (Min: {mat.minThreshold})
                          </p>
                        </div>
                        <Badge
                          variant={
                            mat.stockStatus === "AMAN"
                              ? "success"
                              : mat.stockStatus === "MENIPIS"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {mat.stockStatus !== "AMAN" && <AlertTriangle className="w-3 h-3" />}
                          {mat.stockStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
              Pilih salah satu penanda fasilitas kesehatan pada peta untuk melihat rincian sumber
              daya.
            </div>
          )}
        </div>
      </div>

      {/* Modal Input Faskes & Koordinat Baru */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Input Fasilitas Kesehatan & Titik Koordinat GIS"
        description="Validasi otomatis rentang koordinat geografis wilayah Indonesia (-11.5 s/d 6.5 LS/LU, 94.5 s/d 141.5 BT)."
        maxWidth="2xl"
      >
        <form onSubmit={handleAddFacilitySubmit} className="space-y-4">
          {actionResult && !actionResult.success && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {actionResult.error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Faskes Unik
              </label>
              <input
                name="code"
                required
                placeholder="Mis: FASKES-AD-025"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Fasilitas Kesehatan
              </label>
              <input
                name="name"
                required
                placeholder="Mis: RST Tk. II Dustira Cimahi"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organisasi / Satuan Pengelola
              </label>
              <select
                name="organizationId"
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.code} - {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori / Tingkat Faskes
              </label>
              <select
                name="category"
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
              >
                {FACILITY_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Provinsi</label>
              <input
                name="province"
                required
                placeholder="Mis: Jawa Barat"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kabupaten / Kota
              </label>
              <input
                name="city"
                required
                placeholder="Mis: Kota Cimahi"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Latitude (Lintang)
              </label>
              <input
                name="latitude"
                type="number"
                step="0.0001"
                required
                value={pickedLat}
                onChange={(e) => setPickedLat(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Longitude (Bujur)
              </label>
              <input
                name="longitude"
                type="number"
                step="0.0001"
                required
                value={pickedLng}
                onChange={(e) => setPickedLng(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kapasitas Tempat Tidur (TT)
              </label>
              <input
                name="bedCapacity"
                type="number"
                min={0}
                defaultValue={150}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Operasional
              </label>
              <select
                name="operationalStatus"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
              >
                {OPERATIONAL_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alamat Lengkap
            </label>
            <input
              name="address"
              required
              placeholder="Jl. dr. Dustira No. 1, Baros, Cimahi Tengah"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Layanan Medis & Fasilitas Pendukung
            </label>
            <textarea
              name="services"
              required
              rows={2}
              placeholder="IGD 24 Jam, ICU, Bedah Trauma, Poliklinik Spesialis, Evakuasi Medis"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan & Petakan Faskes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
