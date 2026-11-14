"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/shared";
import type { FacilityWithDetails } from "../service";
import {
  BarChart3,
  ShieldAlert,
  BedDouble,
  Stethoscope,
  Activity,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ArrowRight,
  Sliders,
} from "lucide-react";

interface AnalyticsViewProps {
  facilities: FacilityWithDetails[];
}

interface ContingencyScenario {
  id: string;
  name: string;
  regionLabel: string;
  provinces: string[];
  defaultSurgePatients: number;
  description: string;
}

const CONTINGENCY_SCENARIOS: ContingencyScenario[] = [
  {
    id: "scen-natuna",
    name: "Operasi Siaga Pertahanan Laut Natuna Utara & ALKI I",
    regionLabel: "Kepulauan Riau, Riau & Sumatera Utara",
    provinces: ["Kepulauan Riau", "Riau", "Sumatera Utara"],
    defaultSurgePatients: 180,
    description:
      "Simulasi dukungan kesehatan operasi maritim dan udara di mandala Laut Natuna Utara dengan rujukan cepat ke Lanud Raden Sadjad, Tanjungpinang, dan Medan.",
  },
  {
    id: "scen-megathrust",
    name: "Kontijensi Tanggap Darurat Megathrust Pantai Barat Sumatera",
    regionLabel: "Sumatera Barat, Aceh & Bengkulu",
    provinces: ["Sumatera Barat", "Aceh", "Bengkulu"],
    defaultSurgePatients: 450,
    description:
      "Simulasi lonjakan pasien trauma ortopedi dan bedah darurat akibat gempa megathrust di pesisir barat Sumatera.",
  },
  {
    id: "scen-ikn",
    name: "Dukungan Kesehatan Pertahanan Kawasan Penyangga IKN Nusantara",
    regionLabel: "Kalimantan Timur, Kalimantan Selatan & Kalimantan Utara",
    provinces: ["Kalimantan Timur", "Kalimantan Selatan", "Kalimantan Utara"],
    defaultSurgePatients: 250,
    description:
      "Simulasi kesiapan jaringan rumah sakit TNI di koridor Balikpapan–Samarinda–Tarakan–Banjarmasin dalam mendukung objek vital strategis nasional.",
  },
  {
    id: "scen-kalbar",
    name: "Sabuk Pengamanan Perbatasan Darat RI–Malaysia (Kalbar & Kalteng)",
    regionLabel: "Kalimantan Barat & Kalimantan Tengah",
    provinces: ["Kalimantan Barat", "Kalimantan Tengah"],
    defaultSurgePatients: 160,
    description:
      "Simulasi dukungan medis satuan tugas pengamanan perbatasan darat Entikong–Sintang–Putussibau dan penanganan penyakit tropis.",
  },
  {
    id: "scen-ntt",
    name: "Operasi Pengamanan Perbatasan RI–RDTL & Pulau Terluar Selatan",
    regionLabel: "Nusa Tenggara Timur, Nusa Tenggara Barat & Bali",
    provinces: ["Nusa Tenggara Timur", "Nusa Tenggara Barat", "Bali"],
    defaultSurgePatients: 200,
    description:
      "Simulasi dukungan medis perbatasan darat Atambua–Kupang dengan dukungan rujukan belakang ke Mataram dan Denpasar.",
  },
  {
    id: "scen-papua",
    name: "Dukungan Medis Gabungan Wilayah Timur (Maluku & Papua)",
    regionLabel: "Papua, Papua Barat, Papua Selatan, Papua Tengah, Papua Barat Daya & Maluku",
    provinces: [
      "Papua",
      "Papua Barat",
      "Papua Selatan",
      "Papua Tengah",
      "Papua Barat Daya",
      "Maluku",
      "Maluku Utara",
    ],
    defaultSurgePatients: 300,
    description:
      "Simulasi evakuasi medis udara dan laut terpadu di wilayah timur Indonesia dari Merauke, Timika, Biak, Sorong, Jayapura, hingga Ambon.",
  },
];

export function AnalyticsView({ facilities }: AnalyticsViewProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(CONTINGENCY_SCENARIOS[0].id);
  const [surgePatients, setSurgePatients] = useState<number>(
    CONTINGENCY_SCENARIOS[0].defaultSurgePatients
  );
  const [selectedMatraFilter, setSelectedMatraFilter] = useState<string>("ALL");

  const activeScenario = useMemo(
    () =>
      CONTINGENCY_SCENARIOS.find((s) => s.id === selectedScenarioId) || CONTINGENCY_SCENARIOS[0],
    [selectedScenarioId]
  );

  const theaterFacilities = useMemo(() => {
    return facilities.filter((f) => activeScenario.provinces.includes(f.province));
  }, [facilities, activeScenario]);

  const simulationMetrics = useMemo(() => {
    const totalBeds = theaterFacilities.reduce((acc, f) => acc + f.bedCapacity, 0);
    // Assume 35% of total beds can be mobilized immediately for emergency surge
    const surgeReadyBeds = Math.round(totalBeds * 0.35);
    const totalSdm = theaterFacilities.reduce((acc, f) => acc + f.totalPersonnelCount, 0);
    const totalAlkes = theaterFacilities.reduce(
      (acc, f) => acc + Math.max(0, f.totalEquipmentUnits - f.damagedEquipmentUnits),
      0
    );
    const totalIfakPacks = theaterFacilities.reduce((acc, f) => {
      const packs = f.materials.reduce((mAcc, m) => mAcc + m.stockQuantity, 0);
      return acc + packs;
    }, 0);

    const requiredBeds = surgePatients;
    const requiredSdm = Math.ceil(surgePatients * 1.2);
    const requiredAlkes = Math.ceil(surgePatients * 0.15);
    const requiredPacks = surgePatients * 3;

    return {
      totalBeds,
      surgeReadyBeds,
      requiredBeds,
      bedGap: surgeReadyBeds - requiredBeds,
      totalSdm,
      requiredSdm,
      sdmGap: totalSdm - requiredSdm,
      totalAlkes,
      requiredAlkes,
      alkesGap: totalAlkes - requiredAlkes,
      totalIfakPacks,
      requiredPacks,
      packsGap: totalIfakPacks - requiredPacks,
    };
  }, [theaterFacilities, surgePatients]);

  // Province-level Gap Analysis across all 100 facilities
  const provincialGapSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        province: string;
        facilityCount: number;
        beds: number;
        sdmAvailable: number;
        sdmRequired: number;
        alkesUnits: number;
        alkesDamaged: number;
        criticalMaterials: number;
      }
    >();

    for (const f of facilities) {
      if (selectedMatraFilter !== "ALL" && f.organization?.category !== selectedMatraFilter) {
        continue;
      }
      const existing = map.get(f.province) || {
        province: f.province,
        facilityCount: 0,
        beds: 0,
        sdmAvailable: 0,
        sdmRequired: 0,
        alkesUnits: 0,
        alkesDamaged: 0,
        criticalMaterials: 0,
      };
      existing.facilityCount += 1;
      existing.beds += f.bedCapacity;
      existing.sdmAvailable += f.totalPersonnelCount;
      existing.sdmRequired += f.totalPersonnelRequired;
      existing.alkesUnits += f.totalEquipmentUnits;
      existing.alkesDamaged += f.damagedEquipmentUnits;
      existing.criticalMaterials += f.criticalMaterialCount;
      map.set(f.province, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.beds - a.beds);
  }, [facilities, selectedMatraFilter]);

  function handleScenarioChange(id: string) {
    setSelectedScenarioId(id);
    const found = CONTINGENCY_SCENARIOS.find((s) => s.id === id);
    if (found) {
      setSurgePatients(found.defaultSurgePatients);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="purple">Analisis Ketersediaan & Simulasi Kontijensi</Badge>
            <span className="text-xs text-slate-400">
              Cakupan Nasional ({facilities.length} Faskes)
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1 flex items-center gap-2 leading-snug">
            <BarChart3 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Analisis Kebutuhan Sumber Daya & Simulator Skenario Operasi Medis</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluasi kesenjangan Daftar Susunan Personel (DSP), kecukupan tempat tidur, kesiapan
            alkes, serta simulasi kontijensi operasi/bencana per mandala wilayah.
          </p>
        </div>

        <Link
          href="/dashboard/gis"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shrink-0 transition-colors"
        >
          Lihat Zona Risiko di Peta GIS <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Interactive Contingency Simulator */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Simulator Kontijensi & Dukungan Kesehatan Lapangan
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold mt-1 leading-snug">
              {activeScenario.name}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">{activeScenario.description}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 shrink-0">
            <div className="w-full sm:w-64">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Pilih Skenario Wilayah
              </label>
              <select
                value={selectedScenarioId}
                onChange={(e) => handleScenarioChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-semibold"
              >
                {CONTINGENCY_SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Estimasi Beban Korban / Pasien Darurat
              </label>
              <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <input
                  type="number"
                  min={20}
                  max={2000}
                  step={10}
                  value={surgePatients}
                  onChange={(e) => setSurgePatients(Math.max(10, Number(e.target.value) || 0))}
                  className="w-20 bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
                />
                <span className="text-[11px] text-slate-400">Pasien</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* 4 Simulation Readiness Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <BedDouble className="w-4 h-4 text-blue-600" /> Kapasitas TT Siaga (35%)
                </span>
                {simulationMetrics.bedGap >= 0 ? (
                  <Badge variant="success">MEMADAI</Badge>
                ) : (
                  <Badge variant="danger">DEFISIT</Badge>
                )}
              </div>
              <p className="text-xl font-bold text-slate-900">
                {simulationMetrics.surgeReadyBeds} TT{" "}
                <span className="text-xs font-normal text-slate-500">
                  (Total: {simulationMetrics.totalBeds} TT)
                </span>
              </p>
              <p className="text-[11px] text-slate-600">
                Kebutuhan Skenario: <strong>{simulationMetrics.requiredBeds} TT</strong> (
                {simulationMetrics.bedGap >= 0
                  ? `Surplus +${simulationMetrics.bedGap} TT`
                  : `Kurang ${simulationMetrics.bedGap} TT — Perlu RS Lapangan`}
                )
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-emerald-600" /> Tenaga Medis Mandala
                </span>
                {simulationMetrics.sdmGap >= 0 ? (
                  <Badge variant="success">SIAP</Badge>
                ) : (
                  <Badge variant="warning">BKO PUSAT</Badge>
                )}
              </div>
              <p className="text-xl font-bold text-slate-900">
                {simulationMetrics.totalSdm.toLocaleString("id-ID")} Pers
              </p>
              <p className="text-[11px] text-slate-600">
                Kebutuhan Skenario: <strong>{simulationMetrics.requiredSdm} Pers</strong> (
                {simulationMetrics.sdmGap >= 0
                  ? `Cadangan +${simulationMetrics.sdmGap} Pers`
                  : `Perlu BKO ${Math.abs(simulationMetrics.sdmGap)} Pers`}
                )
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-600" /> Alkes ICU & Diagnostik
                </span>
                {simulationMetrics.alkesGap >= 0 ? (
                  <Badge variant="success">SIAP</Badge>
                ) : (
                  <Badge variant="danger">KURANG</Badge>
                )}
              </div>
              <p className="text-xl font-bold text-slate-900">
                {simulationMetrics.totalAlkes} Unit Siap
              </p>
              <p className="text-[11px] text-slate-600">
                Kebutuhan Skenario: <strong>{simulationMetrics.requiredAlkes} Unit</strong> (
                {simulationMetrics.alkesGap >= 0
                  ? `Surplus +${simulationMetrics.alkesGap} Unit`
                  : `Kurang ${Math.abs(simulationMetrics.alkesGap)} Unit`}
                )
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-amber-600" /> Bekkes & Trauma Kit
                </span>
                {simulationMetrics.packsGap >= 0 ? (
                  <Badge variant="success">AMAN</Badge>
                ) : (
                  <Badge variant="warning">MOBILISASI</Badge>
                )}
              </div>
              <p className="text-xl font-bold text-slate-900">
                {simulationMetrics.totalIfakPacks.toLocaleString("id-ID")} Paket
              </p>
              <p className="text-[11px] text-slate-600">
                Kebutuhan Skenario: <strong>{simulationMetrics.requiredPacks} Paket</strong> (
                {simulationMetrics.packsGap >= 0
                  ? `Surplus +${simulationMetrics.packsGap} Paket`
                  : `Perlu Drop Logistik ${Math.abs(simulationMetrics.packsGap)} Paket`}
                )
              </p>
            </div>
          </div>

          {/* Facilities in Active Scenario Theater */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Daftar Rumah Sakit & Faskes Penyangga di Wilayah Skenario ({theaterFacilities.length}{" "}
              Faskes — {activeScenario.regionLabel})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
              {theaterFacilities.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-lg border border-slate-200 bg-white flex flex-col justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-emerald-700">{f.code}</span>
                      <Badge variant="purple">{f.organization?.category.replace("_", " ")}</Badge>
                    </div>
                    <p className="font-bold text-slate-900 mt-1">{f.name}</p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {f.city}, {f.province}
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <span>
                      <strong>{f.bedCapacity}</strong> TT • <strong>{f.totalPersonnelCount}</strong>{" "}
                      SDM
                    </span>
                    <span className="font-mono">
                      {f.latitude.toFixed(2)}, {f.longitude.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Provincial Resource & DSP Gap Analysis Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Matriks Kecukupan Sumber Daya Kesehatan Antar-Provinsi ({provincialGapSummary.length}{" "}
              Provinsi)
            </h3>
            <p className="text-xs text-slate-500">
              Perbandingan kapasitas tempat tidur, pemenuhan DSP tenaga kesehatan, dan kesiapan
              alkes/matkes di setiap provinsi.
            </p>
          </div>

          <select
            value={selectedMatraFilter}
            onChange={(e) => setSelectedMatraFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
          >
            <option value="ALL">Semua Matra / Instansi</option>
            <option value="KEMHAN">Kemhan RI</option>
            <option value="MABES_TNI">Mabes TNI</option>
            <option value="TNI_AD">TNI Angkatan Darat</option>
            <option value="TNI_AL">TNI Angkatan Laut</option>
            <option value="TNI_AU">TNI Angkatan Udara</option>
          </select>
        </div>

        {/* Mobile Cards View for Provincial Matrix (md:hidden) */}
        <div className="md:hidden divide-y divide-slate-100">
          {provincialGapSummary.map((row) => {
            const pct =
              row.sdmRequired > 0 ? Math.round((row.sdmAvailable / row.sdmRequired) * 100) : 100;
            const isOptimal = pct >= 85 && row.criticalMaterials === 0;
            return (
              <div key={row.province} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{row.province}</p>
                    <p className="text-xs text-slate-500">
                      {row.facilityCount} Faskes •{" "}
                      <strong className="text-emerald-700">
                        {row.beds.toLocaleString("id-ID")} TT
                      </strong>
                    </p>
                  </div>
                  {isOptimal ? (
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3" /> Optimal
                    </Badge>
                  ) : (
                    <Badge variant="warning">
                      <AlertTriangle className="w-3 h-3" /> Perlu Penguatan
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      SDM vs DSP ({pct}%)
                    </span>
                    <span className="font-bold text-slate-800">
                      {row.sdmAvailable.toLocaleString("id-ID")} /{" "}
                      {row.sdmRequired.toLocaleString("id-ID")} Pers
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Kesiapan Alkes
                    </span>
                    <span className="font-bold text-slate-800">
                      {row.alkesUnits} Unit{" "}
                      {row.alkesDamaged > 0 && (
                        <span className="text-amber-700 font-normal">
                          ({row.alkesDamaged} kalibrasi)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <th className="py-3 px-4">Provinsi</th>
                <th className="py-3 px-4">Jumlah Faskes</th>
                <th className="py-3 px-4">Total Kapasitas TT</th>
                <th className="py-3 px-4">SDM Tersedia vs DSP</th>
                <th className="py-3 px-4">Pemenuhan SDM</th>
                <th className="py-3 px-4">Unit Alkes (Rusak)</th>
                <th className="py-3 px-4">Status Kecukupan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {provincialGapSummary.map((row) => {
                const pct =
                  row.sdmRequired > 0
                    ? Math.round((row.sdmAvailable / row.sdmRequired) * 100)
                    : 100;
                const isOptimal = pct >= 85 && row.criticalMaterials === 0;
                return (
                  <tr key={row.province} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">{row.province}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {row.facilityCount} Faskes
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      {row.beds.toLocaleString("id-ID")} TT
                    </td>
                    <td className="py-3 px-4">
                      <strong>{row.sdmAvailable.toLocaleString("id-ID")}</strong> /{" "}
                      {row.sdmRequired.toLocaleString("id-ID")} Pers
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 85 ? "bg-emerald-600" : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-700">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {row.alkesUnits} Unit{" "}
                      {row.alkesDamaged > 0 && (
                        <span className="text-amber-700 font-medium">
                          ({row.alkesDamaged} perlu kalibrasi/perbaikan)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isOptimal ? (
                        <Badge variant="success">
                          <CheckCircle2 className="w-3 h-3" /> Optimal
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <AlertTriangle className="w-3 h-3" /> Perlu Penguatan
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
