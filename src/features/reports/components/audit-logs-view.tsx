"use client";

import React, { useState, useMemo } from "react";
import { Badge } from "@/shared";
import type { AuditLog } from "@/db/schema";
import type { FacilityWithDetails } from "@/features/geomedik";
import { ORG_CATEGORIES } from "@/features/geomedik/dto";
import { formatDate } from "@/lib/utils";
import {
  FileBarChart,
  Activity,
  Clock,
  Download,
  Printer,
  Hospital,
  BedDouble,
  Stethoscope,
  PackageCheck,
} from "lucide-react";

interface AuditLogsViewProps {
  logs: AuditLog[];
  facilities?: FacilityWithDetails[];
}

export function AuditLogsView({ logs, facilities = [] }: AuditLogsViewProps) {
  const [filterMatra, setFilterMatra] = useState<string>("ALL");
  const [filterProvince, setFilterProvince] = useState<string>("ALL");

  const provinces = useMemo(() => {
    const set = new Set(facilities.map((f) => f.province));
    return Array.from(set).sort();
  }, [facilities]);

  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      if (filterMatra !== "ALL" && f.organization?.category !== filterMatra) {
        return false;
      }
      if (filterProvince !== "ALL" && f.province !== filterProvince) {
        return false;
      }
      return true;
    });
  }, [facilities, filterMatra, filterProvince]);

  const totals = useMemo(() => {
    return filteredFacilities.reduce(
      (acc, f) => {
        acc.beds += f.bedCapacity;
        acc.sdmAvailable += f.totalPersonnelCount;
        acc.sdmRequired += f.totalPersonnelRequired;
        acc.alkesTotal += f.totalEquipmentUnits;
        acc.alkesDamaged += f.damagedEquipmentUnits;
        acc.matkesCritical += f.criticalMaterialCount;
        return acc;
      },
      {
        beds: 0,
        sdmAvailable: 0,
        sdmRequired: 0,
        alkesTotal: 0,
        alkesDamaged: 0,
        matkesCritical: 0,
      }
    );
  }, [filteredFacilities]);

  function handleExportCsv() {
    const headers = [
      "Kode_Faskes",
      "Nama_Faskes",
      "Kode_Satuan",
      "Matra",
      "Kategori_Faskes",
      "Provinsi",
      "Kota_Kabupaten",
      "Latitude",
      "Longitude",
      "Kapasitas_TT",
      "SDM_Tersedia",
      "SDM_Standar_DSP",
      "Total_Unit_Alkes",
      "Alkes_Rusak",
      "Matkes_Kritis_Menipis",
      "Status_Operasional",
      "Status_Verifikasi",
    ];

    const rows = filteredFacilities.map((f) => [
      f.code,
      `"${f.name.replace(/"/g, '""')}"`,
      f.organization?.code || "-",
      f.organization?.category || "KEMHAN",
      f.category,
      `"${f.province}"`,
      `"${f.city}"`,
      f.latitude.toFixed(4),
      f.longitude.toFixed(4),
      String(f.bedCapacity),
      String(f.totalPersonnelCount),
      String(f.totalPersonnelRequired),
      String(f.totalEquipmentUnits),
      String(f.damagedEquipmentUnits),
      String(f.criticalMaterialCount),
      f.operationalStatus,
      f.verificationStatus,
    ]);

    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rekapitulasi-geomedik-kemhan-${filterMatra.toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Export Buttons */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="success">Pelaporan Nasional, Ekspor & Audit Trail</Badge>
            <span className="text-xs text-slate-400">Periode 2026-TW4</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-emerald-600" />
            Pelaporan Rekapitulasi Nasional & Jejak Audit Sistem
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekapitulasi kesiapan Fasilitas Kesehatan, SDM, Alkes, dan Matkes Pertahanan beserta
            rekam jejak verifikasi berjenjang (Audit Trail).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Ekspor Rekapitulasi CSV (Excel)
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan (Print/PDF)
          </button>
        </div>
      </div>

      {/* Modul 11: Rekapitulasi Nasional Faskes & Sumber Daya Kesehatan */}
      {facilities.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tabel Rekapitulasi Nasional Sumber Daya Kesehatan Pertahanan
              </h3>
              <p className="text-xs text-slate-500">
                Menampilkan <strong>{filteredFacilities.length}</strong> dari{" "}
                <strong>{facilities.length}</strong> Fasilitas Kesehatan Kemhan & TNI.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterMatra}
                onChange={(e) => setFilterMatra(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
              >
                <option value="ALL">Semua Instansi / Matra</option>
                {ORG_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              <select
                value={filterProvince}
                onChange={(e) => setFilterProvince(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
              >
                <option value="ALL">Semua Provinsi ({provinces.length})</option>
                {provinces.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary KPI Bar for Filtered Report */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3">
              <Hospital className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Faskes Terfilter
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {filteredFacilities.length} Faskes
                </span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3">
              <BedDouble className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Total Kapasitas TT
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {totals.beds.toLocaleString("id-ID")} TT
                </span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3">
              <Stethoscope className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Total Personel SDM
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {totals.sdmAvailable.toLocaleString("id-ID")} /{" "}
                  {totals.sdmRequired.toLocaleString("id-ID")} DSP
                </span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3">
              <PackageCheck className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Alkes & Matkes Kritis
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {totals.alkesTotal} Alkes • {totals.matkesCritical} Kritis
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Cards View for Filtered Facilities (md:hidden) */}
          <div className="md:hidden divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {filteredFacilities.map((f) => (
              <div key={f.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {f.code}
                    </span>
                    <Badge variant="purple">{f.organization?.category || "KEMHAN"}</Badge>
                  </div>
                  <Badge
                    variant={
                      f.verificationStatus === "APPROVED"
                        ? "success"
                        : f.verificationStatus === "SUBMITTED"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {f.verificationStatus}
                  </Badge>
                </div>

                <div>
                  <p className="font-bold text-slate-900 text-sm">{f.name}</p>
                  <p className="text-xs text-slate-500">
                    {f.city}, {f.province} •{" "}
                    <span className="font-mono">
                      {f.latitude.toFixed(3)}, {f.longitude.toFixed(3)}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                      Kapasitas
                    </span>
                    <span className="font-bold text-slate-800">{f.bedCapacity} TT</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                      SDM / DSP
                    </span>
                    <span className="font-bold text-slate-800">
                      {f.totalPersonnelCount}/{f.totalPersonnelRequired}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                      Matkes Kritis
                    </span>
                    <span
                      className={`font-bold ${
                        f.criticalMaterialCount > 0 ? "text-rose-600" : "text-emerald-700"
                      }`}
                    >
                      {f.criticalMaterialCount} Item
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (hidden md:block) */}
          <div className="hidden md:block overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 sticky top-0">
                <tr>
                  <th className="py-3 px-4">Kode & Nama Faskes</th>
                  <th className="py-3 px-4">Satuan / Matra</th>
                  <th className="py-3 px-4">Wilayah</th>
                  <th className="py-3 px-4">Koordinat</th>
                  <th className="py-3 px-4">Kapasitas</th>
                  <th className="py-3 px-4">SDM (DSP)</th>
                  <th className="py-3 px-4">Alkes / Matkes</th>
                  <th className="py-3 px-4">Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredFacilities.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{f.code}</span>
                      <span className="text-slate-700 font-medium">{f.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="purple">{f.organization?.category || "KEMHAN"}</Badge>
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        {f.organization?.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {f.city}, <span className="font-medium text-slate-800">{f.province}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{f.bedCapacity} TT</td>
                    <td className="py-3 px-4 text-slate-700">
                      {f.totalPersonnelCount} / {f.totalPersonnelRequired}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {f.totalEquipmentUnits} Unit •{" "}
                      <span
                        className={
                          f.criticalMaterialCount > 0
                            ? "text-rose-600 font-bold"
                            : "text-emerald-700"
                        }
                      >
                        {f.criticalMaterialCount} Kritis
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          f.verificationStatus === "APPROVED"
                            ? "success"
                            : f.verificationStatus === "SUBMITTED"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {f.verificationStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modul 12: Audit Trail Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            Jejak Audit & Riwayat Mutasi Data ({logs.length} Catatan Terakhir)
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Realtime
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Waktu</th>
                <th className="px-6 py-3.5">Aktor</th>
                <th className="px-6 py-3.5">Aksi</th>
                <th className="px-6 py-3.5">Resource</th>
                <th className="px-6 py-3.5">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Belum ada rekaman audit log.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 text-xs">
                    <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-900">
                      {log.actorEmail || "Sistem"}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={log.action.includes("DELETE") ? "danger" : "default"}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-500">{log.resource}</td>
                    <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px] max-w-xs truncate">
                      {log.details || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
