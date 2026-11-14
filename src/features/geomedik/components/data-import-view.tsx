"use client";

import React, { useState, useMemo } from "react";
import { Badge } from "@/shared";
import type { Organization } from "@/db/schema";
import type { FacilityWithDetails } from "../service";
import { parseAndValidateCsvFacilities } from "../dto";
import { bulkImportFacilitiesAction } from "../actions";
import {
  UploadCloud,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Database,
  Building2,
} from "lucide-react";

interface DataImportViewProps {
  organizations: Organization[];
  existingFacilities: FacilityWithDetails[];
}

const SAMPLE_SIMULATION_CSV = `kode,nama,kode_organisasi,kategori,provinsi,kota,alamat,latitude,longitude,kapasitas_tt,status_operasional,layanan
FASKES-AD-071,RS Tk. IV Bima NTB,KESDAM-IX,RS_TINGKAT_IV,Nusa Tenggara Barat,Kota Bima,Jl. Soekarno Hatta No. 12 Raba Bima,-8.4606,118.7267,85,OPERASIONAL,IGD 24 Jam, Bedah Dasar, Rawat Inap, Poliklinik
FASKES-AL-015,Rumkital dr. Idris P. Siregar Batam,LANTAMAL-IV,RS_TINGKAT_IV,Kepulauan Riau,Kota Batam,Jl. Yos Sudarso Batu Ampar Batam,1.1582,104.0042,75,SIAGA_DARURAT,IGD Maritim Selat Singapura, Hiperbarik, Poliklinik Satgas Laut
FASKES-AU-013,RSAU Soemitro Lanud Muljono Surabaya,KOOPSUD-II,RS_TINGKAT_IV,Jawa Timur,Kota Surabaya,Jl. Raya Bandara Juanda Surabaya,-7.3742,112.7689,90,OPERASIONAL,IGD 24 Jam, Aeromedis, Kesehatan Penerbangan, Rawat Inap
FASKES-AD-019,RSPAD Gatot Soebroto (Duplikat Simulasi),PUSKESAD,RS_TINGKAT_I,DKI Jakarta,Jakarta Pusat,Jl. Abdul Rahman Saleh No. 24,-6.1764,106.8378,850,OPERASIONAL,Simulasi deteksi kode faskes duplikat terhadap data eksisting
FASKES-AD-099,RS Simulasi Koordinat Luar Wilayah NKRI,KESDAM-JAYA,RS_TINGKAT_III,DKI Jakarta,Jakarta Timur,Jl. Simulasi Uji Validasi Spasial,24.8500,152.4000,100,OPERASIONAL,Simulasi penolakan otomatis koordinat di luar batas wilayah Indonesia`;

const CSV_TEMPLATE_CONTENT = `kode,nama,kode_organisasi,kategori,provinsi,kota,alamat,latitude,longitude,kapasitas_tt,status_operasional,layanan
FASKES-AD-014,RS Tk. IV Guntur Garut,KESDAM-III,RS_TINGKAT_IV,Jawa Barat,Kab. Garut,Jl. Bratayudha No. 101 Garut,-7.2167,107.9000,110,OPERASIONAL,IGD 24 Jam, Bedah Umum, Rawat Inap, Poliklinik Spesialis
FASKES-AL-008,Rumkital dr. Oepomo Lantamal V,LANTAMAL-V,RS_TINGKAT_III,Jawa Timur,Kota Surabaya,Jl. Laksda M. Nazir No. 56 Perak,-7.2115,112.7289,120,OPERASIONAL,IGD Maritim, Kesehatan Penyelaman, Rawat Inap`;

export function DataImportView({ organizations, existingFacilities }: DataImportViewProps) {
  const [csvText, setCsvText] = useState<string>(SAMPLE_SIMULATION_CSV);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importFeedback, setImportFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const existingCodes = useMemo(
    () => existingFacilities.map((f) => f.code.toUpperCase()),
    [existingFacilities]
  );

  const validOrgCodes = useMemo(
    () => organizations.map((o) => o.code.toUpperCase()),
    [organizations]
  );

  const validationSummary = useMemo(() => {
    return parseAndValidateCsvFacilities(csvText, existingCodes, validOrgCodes);
  }, [csvText, existingCodes, validOrgCodes]);

  function handleDownloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE_CONTENT], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template-impor-faskes-geomedik.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFeedback(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setCsvText(content);
      }
    };
    reader.readAsText(file);
  }

  async function handleExecuteImport() {
    const validInputs = validationSummary.rows
      .filter((r) => r.isValid && r.parsedData)
      .map((r) => r.parsedData!);

    if (validInputs.length === 0) return;

    setIsImporting(true);
    setImportFeedback(null);

    const res = await bulkImportFacilitiesAction(validInputs);
    setIsImporting(false);

    if (res.success) {
      setImportFeedback({
        type: "success",
        message: `Berhasil mengimpor ${res.importedCount} fasilitas kesehatan baru ke database & Peta Geomedik (${res.skippedCount} dilewati). Catatan Audit Trail telah direkam.`,
      });
    } else {
      setImportFeedback({
        type: "error",
        message: res.error || "Gagal melakukan impor data fasilitas kesehatan.",
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="purple">Pengelolaan Data & Impor Massal CSV</Badge>
            <span className="text-xs text-slate-400">Validasi Koordinat & Deteksi Duplikat</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Impor Data CSV Fasilitas Kesehatan & Validasi Spasial Otomatis
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unggah atau tempelkan data rekapitulasi CSV dari Kotama/Satker Kesehatan untuk
            divalidasi secara otomatis sebelum dipetakan ke WebGIS Nasional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh Template CSV
          </button>

          <button
            type="button"
            onClick={() => {
              setImportFeedback(null);
              setCsvText(SAMPLE_SIMULATION_CSV);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Muat Simulasi Valid & Error
          </button>

          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-colors">
            <UploadCloud className="w-4 h-4" />
            <span>Pilih Berkas .CSV</span>
            <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Feedback Banner */}
      {importFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
            importFeedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {importFeedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{importFeedback.message}</span>
          </div>
        </div>
      )}

      {/* KPI Validation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Total Baris Diperiksa</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {validationSummary.rows.length} Baris
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Pemeriksaan skema & geospasial</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-600">
              Baris Valid & Siap Impor
            </p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {validationSummary.validCount} Faskes
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Lolos validasi koordinat & kode unik
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-rose-600">
              Baris Ditolak / Perlu Perbaikan
            </p>
            <p className="text-2xl font-bold text-rose-700 mt-1">
              {validationSummary.errorCount} Baris
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Duplikat kode atau koordinat luar NKRI
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* CSV Editor + Reference Codes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Editor Data CSV (Format:
              kode,nama,kode_organisasi,kategori,provinsi,kota,alamat,latitude,longitude,kapasitas_tt,status_operasional,layanan)
            </label>
          </div>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={8}
            spellCheck={false}
            className="w-full p-3 rounded-lg border border-slate-200 bg-slate-950 text-emerald-400 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-[11px] text-slate-500">
            Tip: Anda dapat mengedit langsung isi CSV di atas. Tabel pratinjau validasi di bawah
            akan memperbarui status validasi secara *real-time*.
          </p>
        </div>

        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Referensi Kode Organisasi Valid ({organizations.length})
            </h3>
          </div>
          <p className="text-[11px] text-slate-500">
            Gunakan salah satu kode satuan di bawah ini pada kolom{" "}
            <code className="px-1 py-0.5 bg-slate-100 rounded font-mono">kode_organisasi</code>:
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="px-2.5 py-1.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
              >
                <span className="font-mono font-bold text-emerald-700">{org.code}</span>
                <span className="text-[11px] text-slate-600 truncate max-w-[180px]">
                  {org.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Preview Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Pratinjau Hasil Validasi & Deteksi Duplikat Data
            </h3>
            <p className="text-xs text-slate-500">
              Hanya baris berstatus <strong>VALID</strong> yang akan disimpan ke dalam basis data
              SI-GEOMEDIK.
            </p>
          </div>

          <button
            type="button"
            disabled={validationSummary.validCount === 0 || isImporting}
            onClick={handleExecuteImport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-sm transition-colors"
          >
            <Database className="w-4 h-4" />
            {isImporting
              ? "Mengimpor ke Database..."
              : `Impor ${validationSummary.validCount} Data Valid ke Peta GIS`}
          </button>
        </div>

        {/* Mobile Cards View (md:hidden) */}
        <div className="md:hidden divide-y divide-slate-200">
          {validationSummary.rows.map((row) => (
            <div
              key={`${row.rowNumber}-${row.rawCode}`}
              className={`p-4 space-y-2 ${row.isValid ? "bg-white" : "bg-rose-50/40"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                    #{row.rowNumber} • {row.rawCode}
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-slate-600">
                    {row.organizationCode}
                  </span>
                </div>
                {row.isValid ? (
                  <Badge variant="success">
                    <CheckCircle2 className="w-3 h-3" /> VALID
                  </Badge>
                ) : (
                  <Badge variant="danger">
                    <AlertTriangle className="w-3 h-3" /> {row.statusType}
                  </Badge>
                )}
              </div>

              <p className="font-bold text-slate-900 text-sm">{row.rawName}</p>
              <p className="text-xs text-slate-600">
                {row.city}, {row.province} •{" "}
                <span className="font-mono">
                  {row.latitude.toFixed(3)}, {row.longitude.toFixed(3)}
                </span>{" "}
                • <strong>{row.bedCapacity} TT</strong>
              </p>

              <div className="text-xs pt-1">
                {row.isValid ? (
                  <span className="text-emerald-700 font-medium">
                    Koordinat NKRI & Kode Satuan Valid
                  </span>
                ) : (
                  <ul className="list-disc list-inside text-rose-700 space-y-0.5">
                    {row.issues.map((iss, i) => (
                      <li key={i}>{iss}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Kode & Nama Faskes</th>
                <th className="py-3 px-4">Satuan</th>
                <th className="py-3 px-4">Wilayah</th>
                <th className="py-3 px-4">Koordinat (Lat, Lng)</th>
                <th className="py-3 px-4">TT</th>
                <th className="py-3 px-4">Status Validasi</th>
                <th className="py-3 px-4">Rincian Pemeriksaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {validationSummary.rows.map((row) => (
                <tr
                  key={`${row.rowNumber}-${row.rawCode}`}
                  className={row.isValid ? "hover:bg-slate-50/80" : "bg-rose-50/40"}
                >
                  <td className="py-3 px-4 font-mono text-slate-400">{row.rowNumber}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-slate-900 block">{row.rawCode}</span>
                    <span className="text-slate-600">{row.rawName}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                    {row.organizationCode}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {row.city}, {row.province}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {row.latitude.toFixed(4)}, {row.longitude.toFixed(4)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{row.bedCapacity} TT</td>
                  <td className="py-3 px-4">
                    {row.isValid ? (
                      <Badge variant="success">
                        <CheckCircle2 className="w-3 h-3" /> VALID
                      </Badge>
                    ) : (
                      <Badge variant="danger">
                        <AlertTriangle className="w-3 h-3" /> {row.statusType}
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {row.isValid ? (
                      <span className="text-emerald-700 font-medium">
                        Koordinat NKRI & Kode Satuan Valid
                      </span>
                    ) : (
                      <ul className="list-disc list-inside text-rose-700 space-y-0.5">
                        {row.issues.map((iss, i) => (
                          <li key={i}>{iss}</li>
                        ))}
                      </ul>
                    )}
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
