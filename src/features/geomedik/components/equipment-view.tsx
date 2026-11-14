"use client";

import React, { useState } from "react";
import { Badge, Modal } from "@/shared";
import type { EquipmentWithFacility, FacilityWithDetails } from "../service";
import { EQUIPMENT_CATEGORIES } from "../dto";
import { createEquipmentAction, type GeomedikActionResult } from "../actions";
import { Activity, Plus, Search, Wrench, CheckCircle2, AlertTriangle } from "lucide-react";

interface EquipmentViewProps {
  equipment: EquipmentWithFacility[];
  facilities: FacilityWithDetails[];
  canManage: boolean;
}

export function EquipmentView({ equipment, facilities, canManage }: EquipmentViewProps) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<GeomedikActionResult | null>(null);

  const filtered = equipment.filter((e) => {
    if (catFilter !== "ALL" && e.category !== catFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.facilityName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    const formData = new FormData(e.currentTarget);
    const res = await createEquipmentAction(null, formData);
    setIsSubmitting(false);
    if (res.success) {
      setIsModalOpen(false);
    } else {
      setResult(res);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <Badge variant="purple">Inventarisasi Alat Kesehatan (Alkes)</Badge>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Inventarisasi Alat Kesehatan, Kalibrasi & Kesiapan Operasional
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemantauan kondisi alkes strategis (Baik, Rusak Ringan, Rusak Berat), tahun pengadaan,
            serta jadwal pemeliharaan berkala.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Data Alkes
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode alkes, nama peralatan, atau lokasi RS..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs"
          />
        </div>

        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
        >
          <option value="ALL">Semua Kategori Alkes</option>
          {EQUIPMENT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile Cards & Desktop Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Mobile Cards View (md:hidden) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filtered.map((eq) => (
            <div key={eq.id} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                    {eq.code}
                  </span>
                  <span className="text-[10px] font-semibold uppercase text-purple-700">
                    {eq.category.replace(/_/g, " ")}
                  </span>
                </div>
                <Badge
                  variant={
                    eq.operationalStatus === "BERFUNGSI"
                      ? "success"
                      : eq.operationalStatus === "RUSAK_BERAT"
                        ? "danger"
                        : "warning"
                  }
                >
                  {eq.operationalStatus.replace(/_/g, " ")}
                </Badge>
              </div>

              <div>
                <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>{eq.name}</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {eq.facilityName} • {eq.province}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    Baik: {eq.goodConditionUnits}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                    RR: {eq.minorDamageUnits}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700">
                    RB: {eq.majorDamageUnits}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  Kalibrasi: {eq.nextMaintenanceDate || "-"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Kode</th>
                <th className="py-3.5 px-4">Nama Alat Kesehatan</th>
                <th className="py-3.5 px-4">Lokasi Faskes</th>
                <th className="py-3.5 px-4">Kondisi (B / RR / RB)</th>
                <th className="py-3.5 px-4">Tahun Pengadaan</th>
                <th className="py-3.5 px-4">Pemeliharaan Berikutnya</th>
                <th className="py-3.5 px-4">Status Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((eq) => (
                <tr key={eq.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{eq.code}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>{eq.name}</span>
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">
                      {eq.category.replace(/_/g, " ")}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-800">{eq.facilityName}</p>
                    <p className="text-[11px] text-slate-500">{eq.province}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        Baik: {eq.goodConditionUnits}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                        RR: {eq.minorDamageUnits}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700">
                        RB: {eq.majorDamageUnits}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{eq.procurementYear}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {eq.nextMaintenanceDate || "-"}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        eq.operationalStatus === "BERFUNGSI"
                          ? "success"
                          : eq.operationalStatus === "RUSAK_BERAT"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {eq.operationalStatus === "BERFUNGSI" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : eq.operationalStatus === "RUSAK_BERAT" ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <Wrench className="w-3 h-3" />
                      )}
                      {eq.operationalStatus.replace(/_/g, " ")}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Input Inventaris Alat Kesehatan (Alkes)"
        description="Catat jumlah unit menurut kondisi fisik dan jadwal kalibrasi berikutnya."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {result && !result.success && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {result.error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Alkes</label>
              <input
                name="code"
                required
                placeholder="Mis: ALK-AD-099"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun Pengadaan
              </label>
              <input
                name="procurementYear"
                type="number"
                defaultValue={2024}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fasilitas Kesehatan Pemilik/Pengguna
            </label>
            <select
              name="facilityId"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.code} - {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kategori Alat Kesehatan
            </label>
            <select
              name="category"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
            >
              {EQUIPMENT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama & Spesifikasi Alat Kesehatan
            </label>
            <input
              name="name"
              required
              placeholder="Mis: Mesin Anestesi & Monitor Pasien Intra-Operatif"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kondisi Baik
              </label>
              <input
                name="goodConditionUnits"
                type="number"
                min={0}
                defaultValue={2}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rusak Ringan
              </label>
              <input
                name="minorDamageUnits"
                type="number"
                min={0}
                defaultValue={0}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rusak Berat</label>
              <input
                name="majorDamageUnits"
                type="number"
                min={0}
                defaultValue={0}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Operasional
              </label>
              <select
                name="operationalStatus"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
              >
                <option value="BERFUNGSI">BERFUNGSI — Siap Pakai</option>
                <option value="PERLU_KALIBRASI">PERLU_KALIBRASI — Jadwal Kalibrasi</option>
                <option value="DALAM_PERBAIKAN">DALAM_PERBAIKAN — Sedang Diperbaiki</option>
                <option value="RUSAK_BERAT">RUSAK_BERAT — Usulan Penghapusan/Ganti</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jadwal Kalibrasi / Pemeliharaan
              </label>
              <input
                name="nextMaintenanceDate"
                type="date"
                defaultValue="2027-06-15"
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Data Alkes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
