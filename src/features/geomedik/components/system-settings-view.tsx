"use client";

import React, { useState } from "react";
import { Badge } from "@/shared";
import type { GeomedikExecutiveSummary } from "../service";
import type { CartoConnectionSummary } from "../carto";
import {
  Settings,
  Database,
  FileText,
  Download,
  ShieldCheck,
  CheckCircle2,
  Server,
  HardDrive,
  RefreshCw,
} from "lucide-react";

interface SystemSettingsViewProps {
  summary: GeomedikExecutiveSummary;
  cartoConfig: CartoConnectionSummary;
}

const REFERENCE_DOCUMENTS = [
  {
    id: "doc-01",
    code: "PED-KEMHAN-01",
    title: "Pedoman Tata Kelola & Verifikasi Data Geomedik Pertahanan",
    category: "SOP & Tata Kelola",
    version: "v2.4 (2026)",
    size: "1.8 MB",
    summary:
      "Standar operasional prosedur pengajuan, verifikasi berjenjang, dan persetujuan data fasilitas kesehatan di lingkungan Kemhan & TNI.",
  },
  {
    id: "doc-02",
    code: "NOM-PUSKES-02",
    title: "Standar Daftar Susunan Personel (DSP) SDM Kesehatan Rumah Sakit TNI",
    category: "Nomenklatur SDM",
    version: "v3.1 (2026)",
    size: "2.4 MB",
    summary:
      "Klasifikasi kebutuhan minimal dokter spesialis, dokter umum, perawat klinis, dan paramedis tempur untuk RS Tingkat I s/d IV.",
  },
  {
    id: "doc-03",
    code: "STD-ALKES-03",
    title: "Katalog Standar Alat Kesehatan & Bekal Kesehatan Lapangan (IFAK/CBRN)",
    category: "Standar Alkes & Matkes",
    version: "v1.9 (2026)",
    size: "3.2 MB",
    summary:
      "Spesifikasi teknis peralatan radiologi, ICU, chamber hiperbarik, aeromedis, serta ambang batas stok minimum material kesehatan.",
  },
  {
    id: "doc-04",
    code: "GIS-WGS84-04",
    title: "Panduan Teknis Pemetaan Koordinat Spasial WGS84 & Integrasi CARTO",
    category: "Standar Geospasial",
    version: "v1.5 (2026)",
    size: "1.1 MB",
    summary:
      "Ketentuan akurasi titik koordinat lintang/bujur fasilitas kesehatan dan pertukaran format RFC 7946 GeoJSON.",
  },
];

export function SystemSettingsView({ summary, cartoConfig }: SystemSettingsViewProps) {
  const [reportingPeriod, setReportingPeriod] = useState("2026-TW4");
  const [criticalThresholdPct, setCriticalThresholdPct] = useState("35");
  const [radiusDefaultKm, setRadiusDefaultKm] = useState("75");
  const [savedBanner, setSavedBanner] = useState(false);

  function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3500);
  }

  function handleDownloadDatabaseBackup() {
    const backupSnapshot = {
      metadata: {
        system: "SI-GEOMEDIK KEMHAN RI",
        exportedAt: new Date().toISOString(),
        reportingPeriod,
        environment: "production-ready-local",
        totalOrganizations: summary.totalOrganizations,
        totalFacilities: summary.totalFacilities,
        totalBeds: summary.totalBeds,
        totalPersonnelAvailable: summary.totalPersonnelAvailable,
        totalEquipmentUnits: summary.totalEquipmentUnits,
        totalMaterialItems: summary.totalMaterialItems,
      },
      cartoIntegration: {
        region: cartoConfig.region,
        accountId: cartoConfig.accountId,
        apiBaseUrl: cartoConfig.apiBaseUrl,
      },
      facilities: summary.facilities,
    };

    const blob = new Blob([JSON.stringify(backupSnapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-geomedik-kemhan-${reportingPeriod.toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleDownloadReferenceDoc(docCode: string, title: string) {
    const content = [
      "====================================================================",
      "DOKUMEN REFERENSI STANDAR — SISTEM INFORMASI GEOMEDIK KEMHAN RI",
      "====================================================================",
      `Kode Dokumen : ${docCode}`,
      `Judul        : ${title}`,
      `Periode Aktif: ${reportingPeriod}`,
      `Tanggal Unduh: ${new Date().toISOString()}`,
      "",
      "Ringkasan Ketentuan:",
      "1. Seluruh satuan kesehatan wajib memperbarui data Faskes, SDM, Alkes, dan Matkes setiap triwulan.",
      "2. Titik koordinat geografis menggunakan proyeksi WGS 1984 (EPSG:4326) dalam batas wilayah NKRI.",
      "3. Setiap perubahan data wajib melalui verifikasi berjenjang dan terekam pada Audit Trail.",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${docCode.toLowerCase()}-geomedik.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="purple">Administrasi Sistem, Dokumen & Pencadangan</Badge>
            <span className="text-xs text-slate-400">Otoritas Administrator</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            Konfigurasi Sistem, Nomenklatur Dokumen & Backup Basis Data
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengaturan parameter periode pelaporan nasional, repositori dokumen standar kesehatan
            pertahanan, serta pencadangan (*Disaster Recovery Snapshot*) basis data.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadDatabaseBackup}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
        >
          <Database className="w-4 h-4" />
          Unduh Backup Snapshot Database (.JSON)
        </button>
      </div>

      {savedBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Parameter konfigurasi periode pelaporan dan aturan validasi berhasil diperbarui.
        </div>
      )}

      {/* System Infrastructure & Health Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Status Basis Data</p>
            <p className="text-lg font-bold text-slate-900 mt-1">SQLite / Drizzle ORM Aktif</p>
            <p className="text-xs text-emerald-700 font-medium mt-1">
              {summary.totalFacilities} Faskes • {summary.totalOrganizations} Satuan Organisasi
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Integrasi Spasial</p>
            <p className="text-lg font-bold text-slate-900 mt-1">
              CARTO API ({cartoConfig.region})
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Account: <span className="font-mono font-bold">{cartoConfig.accountId}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Keamanan & Sesi</p>
            <p className="text-lg font-bold text-slate-900 mt-1">JWT HttpOnly + RBAC</p>
            <p className="text-xs text-blue-700 font-medium mt-1">
              Bcrypt Cost-12 & Audit Trail Aktif
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Configuration Form + Document Repository */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: System Parameters Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Parameter Pelaporan & Validasi Sistem
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Pengaturan periode pelaporan aktif dan ambang batas indikator peringatan dini.
          </p>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Periode Pelaporan Nasional Aktif
              </label>
              <select
                value={reportingPeriod}
                onChange={(e) => setReportingPeriod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white font-semibold text-slate-800"
              >
                <option value="2026-TW4">2026-TW4 (Triwulan IV Tahun 2026 — Aktif)</option>
                <option value="2026-TW3">2026-TW3 (Triwulan III Tahun 2026)</option>
                <option value="2027-TW1">2027-TW1 (Persiapan Triwulan I Tahun 2027)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ambang Batas Stok Kritis Material Kesehatan (%)
              </label>
              <input
                type="number"
                min={10}
                max={80}
                value={criticalThresholdPct}
                onChange={(e) => setCriticalThresholdPct(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Stok di bawah {criticalThresholdPct}% dari batas minimum ditandai sebagai KRITIS.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Radius Cakupan Layanan Spasial Default (km)
              </label>
              <input
                type="number"
                min={10}
                max={300}
                value={radiusDefaultKm}
                onChange={(e) => setRadiusDefaultKm(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono"
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-700 block">
                Batas Geografis Validasi Koordinat NKRI:
              </span>
              <span className="font-mono text-[11px] text-slate-600 block">
                Latitude : -11.5000° LS s/d +6.5000° LU
              </span>
              <span className="font-mono text-[11px] text-slate-600 block">
                Longitude: +94.5000° BT s/d +141.5000° BT
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Simpan Konfigurasi Sistem
            </button>
          </form>
        </div>

        {/* Right: Reference Documents & Nomenclature Repository (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Repositori Dokumen Standar & Nomenklatur Geomedik
              </h3>
              <p className="text-xs text-slate-500">
                Dokumen pedoman resmi, standar DSP, dan katalog referensi pengisian data.
              </p>
            </div>
            <Badge variant="default">{REFERENCE_DOCUMENTS.length} Dokumen</Badge>
          </div>

          <div className="space-y-3">
            {REFERENCE_DOCUMENTS.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl border border-slate-200 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {doc.code}
                    </span>
                    <Badge variant="purple">{doc.category}</Badge>
                    <span className="text-[11px] text-slate-400">
                      {doc.version} • {doc.size}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {doc.title}
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{doc.summary}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadReferenceDoc(doc.code, doc.title)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 shrink-0 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  Unduh
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
