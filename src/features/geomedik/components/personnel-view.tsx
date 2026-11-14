"use client";

import React, { useState } from "react";
import { Badge, Modal } from "@/shared";
import type { FacilityWithDetails, PersonnelWithFacility } from "../service";
import { PROFESSION_CATEGORIES } from "../dto";
import { createPersonnelAction, type GeomedikActionResult } from "../actions";
import { Plus, Search, AlertTriangle, CheckCircle2 } from "lucide-react";

interface PersonnelViewProps {
  personnel: PersonnelWithFacility[];
  facilities: FacilityWithDetails[];
  canManage: boolean;
}

export function PersonnelView({ personnel, facilities, canManage }: PersonnelViewProps) {
  const [search, setSearch] = useState("");
  const [profFilter, setProfFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<GeomedikActionResult | null>(null);

  const filtered = personnel.filter((p) => {
    if (profFilter !== "ALL" && p.professionCategory !== profFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.specialization.toLowerCase().includes(q) ||
        p.facilityName.toLowerCase().includes(q) ||
        p.province.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalMil = filtered.reduce((acc, p) => acc + p.militaryCount, 0);
  const totalCiv = filtered.reduce((acc, p) => acc + p.civilCount, 0);
  const totalAvail = filtered.reduce((acc, p) => acc + p.totalAvailable, 0);
  const totalReq = filtered.reduce((acc, p) => acc + p.standardRequirement, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    const formData = new FormData(e.currentTarget);
    const res = await createPersonnelAction(null, formData);
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
          <Badge variant="default">Sumber Daya Manusia (SDM) Kesehatan Pertahanan</Badge>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Rekapitulasi Agregat Tenaga Kesehatan & Analisis Pemenuhan DSP
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Distribusi tenaga medis militer (TNI) dan PNS/ASN menurut profesi, spesialisasi, serta
            perbandingan terhadap Daftar Susunan Personel (DSP).
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
            Input Rekap SDM
          </button>
        )}
      </div>

      {/* Aggregate Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] sm:text-xs text-slate-500 font-semibold uppercase">
            Total SDM Tersedia
          </p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{totalAvail} Pers</p>
          <p className="text-[11px] text-slate-500 mt-0.5">DSP: {totalReq} Pers</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] sm:text-xs text-slate-500 font-semibold uppercase">
            Nakes Militer
          </p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">{totalMil} TNI</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Siap operasi/keslap</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] sm:text-xs text-slate-500 font-semibold uppercase">
            Nakes PNS/ASN
          </p>
          <p className="text-xl sm:text-2xl font-bold text-blue-700 mt-1">{totalCiv} ASN</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Pelayanan faskes tetap</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] sm:text-xs text-slate-500 font-semibold uppercase">
            Pemenuhan DSP
          </p>
          <p className="text-xl sm:text-2xl font-bold text-purple-700 mt-1">
            {totalReq > 0 ? Math.round((totalAvail / totalReq) * 100) : 100}%
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Kurang: {Math.max(0, totalReq - totalAvail)} Pers
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari spesialisasi, fasilitas kesehatan, atau provinsi..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs"
          />
        </div>

        <select
          value={profFilter}
          onChange={(e) => setProfFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
        >
          <option value="ALL">Semua Kategori Profesi</option>
          {PROFESSION_CATEGORIES.map((c) => (
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
          {filtered.map((item) => {
            const ratio =
              item.standardRequirement > 0
                ? Math.round((item.totalAvailable / item.standardRequirement) * 100)
                : 100;
            const isShortage = ratio < 80;
            return (
              <div key={item.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                      {item.professionCategory.replace(/_/g, " ")}
                    </span>
                    <p className="font-bold text-slate-900 text-sm">{item.specialization}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.facilityName} • {item.province}
                    </p>
                  </div>
                  {isShortage ? (
                    <Badge variant="danger">
                      <AlertTriangle className="w-3 h-3" /> Kurang
                    </Badge>
                  ) : (
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3" /> Memenuhi
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                      Militer
                    </span>
                    <span className="font-bold text-slate-800">{item.militaryCount} TNI</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                      PNS / ASN
                    </span>
                    <span className="font-bold text-slate-800">{item.civilCount} Sipil</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                      DSP ({ratio}%)
                    </span>
                    <span className="font-bold text-slate-900">
                      {item.totalAvailable}/{item.standardRequirement}
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
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Fasilitas Kesehatan</th>
                <th className="py-3.5 px-4">Kategori Profesi & Spesialisasi</th>
                <th className="py-3.5 px-4">Militer (TNI)</th>
                <th className="py-3.5 px-4">PNS / Sipil</th>
                <th className="py-3.5 px-4">Tersedia vs DSP</th>
                <th className="py-3.5 px-4">Kompetensi Khusus</th>
                <th className="py-3.5 px-4">Indikator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((item) => {
                const ratio =
                  item.standardRequirement > 0
                    ? Math.round((item.totalAvailable / item.standardRequirement) * 100)
                    : 100;
                const isShortage = ratio < 80;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{item.facilityName}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.organizationName} • {item.province}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                        {item.professionCategory.replace(/_/g, " ")}
                      </span>
                      <span className="font-semibold text-slate-800">{item.specialization}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {item.militaryCount}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{item.civilCount}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{item.totalAvailable}</span> /{" "}
                      <span className="text-slate-500">{item.standardRequirement}</span>{" "}
                      <span className="text-[11px] text-slate-500">({ratio}%)</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                      {item.certificationNote || "-"}
                    </td>
                    <td className="py-3.5 px-4">
                      {isShortage ? (
                        <Badge variant="danger">
                          <AlertTriangle className="w-3 h-3" /> Kurang SDM
                        </Badge>
                      ) : (
                        <Badge variant="success">
                          <CheckCircle2 className="w-3 h-3" /> Memenuhi
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

      {/* Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Input Rekapitulasi SDM Kesehatan"
        description="Gunakan data agregat per spesialisasi/profesi sesuai prinsip pelindungan data."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {result && !result.success && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {result.error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fasilitas Kesehatan
            </label>
            <select
              name="facilityId"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.code} - {f.name} ({f.province})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kategori Profesi
            </label>
            <select
              name="professionCategory"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
            >
              {PROFESSION_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Spesialisasi / Kualifikasi
            </label>
            <input
              name="specialization"
              required
              placeholder="Mis: Dokter Spesialis Bedah Toraks Kardiovaskular"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah Militer
              </label>
              <input
                name="militaryCount"
                type="number"
                min={0}
                defaultValue={5}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah PNS/Sipil
              </label>
              <input
                name="civilCount"
                type="number"
                min={0}
                defaultValue={5}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Standar DSP</label>
              <input
                name="standardRequirement"
                type="number"
                min={1}
                defaultValue={12}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kompetensi / Sertifikasi Khusus
            </label>
            <input
              name="certificationNote"
              placeholder="Mis: ATLS, Combat Medic, Sertifikasi Hiperbarik"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
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
              {isSubmitting ? "Menyimpan..." : "Simpan Rekap SDM"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
