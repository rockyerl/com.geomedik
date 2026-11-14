"use client";

import React, { useState } from "react";
import { Badge, Modal } from "@/shared";
import type { FacilityWithDetails, MaterialWithFacility } from "../service";
import { MATERIAL_CATEGORIES } from "../dto";
import { createMaterialAction, type GeomedikActionResult } from "../actions";
import { PackageCheck, Plus, Search, AlertTriangle, CheckCircle2 } from "lucide-react";

interface MaterialsViewProps {
  materials: MaterialWithFacility[];
  facilities: FacilityWithDetails[];
  canManage: boolean;
}

export function MaterialsView({ materials, facilities, canManage }: MaterialsViewProps) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<GeomedikActionResult | null>(null);

  const filtered = materials.filter((m) => {
    if (catFilter !== "ALL" && m.category !== catFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.facilityName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    const formData = new FormData(e.currentTarget);
    const res = await createMaterialAction(null, formData);
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
          <Badge variant="warning">Logistik Material Kesehatan (Matkes & Bekkes)</Badge>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Stok Material Kesehatan, Ambang Batas Minimum & Masa Kedaluwarsa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemantauan ketersediaan bekal kesehatan lapangan (IFAK), obat esensial, BMHP bedah,
            plasma darah, dan logistik Nubika (CBRN).
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
            Input Stok Matkes
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
            placeholder="Cari kode matkes, nama logistik medis, atau faskes..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs"
          />
        </div>

        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
        >
          <option value="ALL">Semua Kategori Material</option>
          {MATERIAL_CATEGORIES.map((c) => (
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
          {filtered.map((mat) => (
            <div key={mat.id} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                    {mat.code}
                  </span>
                  <span className="text-[10px] font-semibold uppercase text-emerald-700">
                    {mat.category.replace(/_/g, " ")}
                  </span>
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
                  {mat.stockStatus === "AMAN" ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  {mat.stockStatus}
                </Badge>
              </div>

              <div>
                <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{mat.name}</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {mat.facilityName} • {mat.storageLocation}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                    Stok / Batas Minimum
                  </span>
                  <span className="font-bold text-slate-900">
                    {mat.stockQuantity} / {mat.minThreshold} {mat.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                    Kedaluwarsa
                  </span>
                  <span className="font-mono font-semibold text-slate-700">
                    {mat.expiryDate || "-"}
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
                <th className="py-3.5 px-4">Kode</th>
                <th className="py-3.5 px-4">Nama Material Kesehatan</th>
                <th className="py-3.5 px-4">Faskes & Depo Penyimpanan</th>
                <th className="py-3.5 px-4">Stok vs Ambang Minimum</th>
                <th className="py-3.5 px-4">Kedaluwarsa</th>
                <th className="py-3.5 px-4">Status Ketersediaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((mat) => (
                <tr key={mat.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{mat.code}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <PackageCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{mat.name}</span>
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">
                      {mat.category.replace(/_/g, " ")}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-800">{mat.facilityName}</p>
                    <p className="text-[11px] text-slate-500">{mat.storageLocation}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900">
                      {mat.stockQuantity} {mat.unit}
                    </span>
                    <span className="text-slate-500 block text-[11px]">
                      Batas Minimum: {mat.minThreshold} {mat.unit}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">{mat.expiryDate || "-"}</td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        mat.stockStatus === "AMAN"
                          ? "success"
                          : mat.stockStatus === "MENIPIS"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {mat.stockStatus === "AMAN" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {mat.stockStatus}
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
        title="Input Material Kesehatan (Matkes)"
        description="Sistem secara otomatis menghitung indikator AMAN / MENIPIS / KRITIS berdasarkan ambang batas minimum."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {result && !result.success && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {result.error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Material
              </label>
              <input
                name="code"
                required
                placeholder="Mis: MAT-IFAK-019"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan</label>
              <input
                name="unit"
                required
                defaultValue="Paket"
                placeholder="Paket / Box / Vial / Botol"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fasilitas Kesehatan Terkait
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
              Kategori Material Kesehatan
            </label>
            <select
              name="category"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
            >
              {MATERIAL_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Material Kesehatan
            </label>
            <input
              name="name"
              required
              placeholder="Mis: Combat Application Tourniquet (CAT) Gen-7 & Hemostatic Dressing"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah Stok Saat Ini
              </label>
              <input
                name="stockQuantity"
                type="number"
                min={0}
                defaultValue={150}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ambang Batas Minimum
              </label>
              <input
                name="minThreshold"
                type="number"
                min={1}
                defaultValue={100}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lokasi Penyimpanan / Depo
              </label>
              <input
                name="storageLocation"
                required
                placeholder="Mis: Depo Bekkes Gudang Utama"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Kedaluwarsa
              </label>
              <input
                name="expiryDate"
                type="date"
                defaultValue="2028-06-30"
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
              {isSubmitting ? "Menyimpan..." : "Simpan Stok Matkes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
