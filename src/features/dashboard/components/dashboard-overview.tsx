import React from "react";
import Link from "next/link";
import { Badge } from "@/shared";
import type { SessionPayload } from "@/lib/auth/session";
import type { GeomedikExecutiveSummary } from "@/features/geomedik";
import {
  Map,
  Hospital,
  Stethoscope,
  Activity,
  PackageCheck,
  ClipboardCheck,
  ArrowRight,
  BedDouble,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Crosshair,
  Building2,
} from "lucide-react";

interface DashboardOverviewProps {
  session: SessionPayload;
  summary: GeomedikExecutiveSummary;
  canViewGis: boolean;
  canVerifyData: boolean;
}

export function DashboardOverview({
  session,
  summary,
  canViewGis,
  canVerifyData,
}: DashboardOverviewProps) {
  const sdmFulfillmentPct =
    summary.totalPersonnelRequired > 0
      ? Math.round((summary.totalPersonnelAvailable / summary.totalPersonnelRequired) * 100)
      : 100;

  const alkesReadinessPct =
    summary.totalEquipmentUnits > 0
      ? Math.round((summary.goodEquipmentUnits / summary.totalEquipmentUnits) * 100)
      : 100;

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Executive Command Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-4 sm:p-6 md:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] sm:text-xs font-semibold border border-emerald-400/30">
              <Crosshair className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Dashboard Eksekutif Geomedik • 2026-TW4</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white leading-snug">
              Pusat Komando & Informasi Geomedik Pertahanan
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Pemantauan terpadu kesiapan Fasilitas Kesehatan, Sumber Daya Manusia (SDM), Alat
              Kesehatan (Alkes), dan Material Kesehatan (Matkes) di seluruh jajaran Kemhan dan TNI
              berbasis sistem informasi geografis (WebGIS).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {canViewGis && (
              <Link
                href="/dashboard/gis"
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Map className="w-4 h-4" />
                Buka Peta Geomedik (GIS)
              </Link>
            )}
            <div className="p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-[11px] text-slate-400 block font-medium">
                Otorisasi Pejabat Aktif
              </span>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span className="font-bold text-white text-xs">{session.roleName}</span>
                <Badge variant="purple">{session.roleCode}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* KPI 1: Faskes & Kapasitas TT */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Fasilitas Kesehatan
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {summary.totalFacilities} Faskes
            </p>
            <p className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5 shrink-0" /> Total{" "}
              {summary.totalBeds.toLocaleString("id-ID")} Tempat Tidur
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Hospital className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: SDM Kesehatan */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rekap SDM Kesehatan
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {summary.totalPersonnelAvailable.toLocaleString("id-ID")} Pers
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Pemenuhan DSP: <strong>{sdmFulfillmentPct}%</strong> ({summary.totalMilitaryPersonnel}{" "}
              Militer)
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Alat Kesehatan (Alkes) */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kesiapan Alkes
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {alkesReadinessPct}%{" "}
              <span className="text-sm font-medium text-slate-500">
                ({summary.goodEquipmentUnits}/{summary.totalEquipmentUnits} Unit)
              </span>
            </p>
            <p className="text-xs text-amber-700 font-medium mt-1">
              {summary.damagedEquipmentUnits} unit rusak / perlu kalibrasi
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Material Kesehatan (Matkes) */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Logistik Matkes
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {summary.totalMaterialItems} Komoditas
            </p>
            <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {summary.criticalOrLowMaterials}{" "}
              item stok menipis/kritis
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Distribution by Matra & Data Verification Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Distribution by Matra/Organization (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Distribusi Faskes & Kapasitas TT Menurut Instansi/Matra</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rekapitulasi berdasarkan struktur organisasi induk ({summary.totalOrganizations}{" "}
                satuan terdaftar)
              </p>
            </div>
            <Link
              href="/dashboard/organizations"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 shrink-0"
            >
              Master Organisasi <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 pt-2">
            {summary.byMatra.map((item) => {
              const pctBeds =
                summary.totalBeds > 0 ? Math.round((item.bedCount / summary.totalBeds) * 100) : 0;
              return (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-bold text-slate-800">
                      {item.category.replace("_", " ")}
                    </span>
                    <span className="text-slate-600 text-right">
                      <strong>{item.facilityCount}</strong> Faskes •{" "}
                      <strong>{item.bedCount.toLocaleString("id-ID")}</strong> TT ({pctBeds}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all"
                      style={{ width: `${Math.max(pctBeds, item.facilityCount > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Indikator Kelengkapan & Status Verifikasi Data (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Indikator Validitas & Verifikasi Data</span>
              </h3>
              <Badge variant="default">Kontrol Mutu</Badge>
            </div>
            <p className="text-xs text-slate-500">
              Status pemeriksaan laporan fasilitas kesehatan periode aktif sebelum dikonsolidasikan
              ke tingkat pimpinan Kemhan.
            </p>

            <div className="space-y-2.5 pt-1">
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 font-semibold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Disetujui (APPROVED)</span>
                </span>
                <span className="font-bold text-emerald-800 shrink-0">
                  {summary.approvedFacilities} Faskes
                </span>
              </div>

              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 font-semibold text-amber-900">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Menunggu Verifikasi (SUBMITTED)</span>
                </span>
                <span className="font-bold text-amber-800 shrink-0">
                  {summary.pendingVerificationFacilities} Faskes
                </span>
              </div>

              <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-200 flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 font-semibold text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Perlu Perbaikan (NEEDS_REVISION)</span>
                </span>
                <span className="font-bold text-rose-800 shrink-0">
                  {summary.revisionFacilities} Faskes
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {canVerifyData ? (
              <Link
                href="/dashboard/verification"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                Buka Antrean Verifikasi Data <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href="/dashboard/facilities"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                Lihat Registri Fasilitas Kesehatan <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Table / Mobile Cards of Mapped Facilities & Coordinates */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Ringkasan Kesiapan Fasilitas Kesehatan Terpetakan
            </h3>
            <p className="text-xs text-slate-500">
              Ikhtisar lokasi koordinat geografis, kapasitas TT, SDM, alkes, dan peringatan logistik
              matkes.
            </p>
          </div>
          <Link
            href="/dashboard/gis"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 shrink-0"
          >
            Eksplorasi di Peta Interaktif <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Cards View (md:hidden) */}
        <div className="md:hidden divide-y divide-slate-100">
          {summary.facilities.slice(0, 6).map((fac) => (
            <div key={fac.id} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {fac.code}
                  </span>
                  <Badge variant="default">
                    {fac.organization?.category.replace("_", " ") || "KEMHAN"}
                  </Badge>
                </div>
                <Badge
                  variant={
                    fac.verificationStatus === "APPROVED"
                      ? "success"
                      : fac.verificationStatus === "SUBMITTED"
                        ? "warning"
                        : "danger"
                  }
                >
                  {fac.verificationStatus}
                </Badge>
              </div>

              <div>
                <p className="font-bold text-slate-900 text-sm">{fac.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {fac.city}, {fac.province} •{" "}
                  <span className="font-mono text-[11px]">
                    {fac.latitude.toFixed(3)}, {fac.longitude.toFixed(3)}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                    Tempat Tidur
                  </span>
                  <span className="font-bold text-slate-800">{fac.bedCapacity} TT</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                    SDM (Tersedia/DSP)
                  </span>
                  <span className="font-bold text-slate-900">
                    {fac.totalPersonnelCount} / {fac.totalPersonnelRequired}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Kode & Nama Faskes</th>
                <th className="py-3 px-4">Satuan / Matra</th>
                <th className="py-3 px-4">Wilayah & Koordinat</th>
                <th className="py-3 px-4">Tempat Tidur</th>
                <th className="py-3 px-4">SDM (Tersedia/DSP)</th>
                <th className="py-3 px-4">Status Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {summary.facilities.slice(0, 6).map((fac) => (
                <tr key={fac.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] font-bold text-slate-500 block">
                      {fac.code}
                    </span>
                    <span className="font-bold text-slate-900">{fac.name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="default">
                      {fac.organization?.category.replace("_", " ") || "KEMHAN"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-slate-800 font-medium block">
                      {fac.city}, {fac.province}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {fac.latitude.toFixed(4)}, {fac.longitude.toFixed(4)}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">{fac.bedCapacity} TT</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900">{fac.totalPersonnelCount}</span> /{" "}
                    <span className="text-slate-500">{fac.totalPersonnelRequired}</span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        fac.verificationStatus === "APPROVED"
                          ? "success"
                          : fac.verificationStatus === "SUBMITTED"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {fac.verificationStatus}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
