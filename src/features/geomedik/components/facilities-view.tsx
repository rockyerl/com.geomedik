"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge, Modal } from "@/shared";
import type { Organization } from "@/db/schema";
import type { FacilityWithDetails } from "../service";
import { FACILITY_CATEGORIES, OPERATIONAL_STATUSES } from "../dto";
import { createFacilityAction, type GeomedikActionResult } from "../actions";
import {
  Hospital,
  MapPin,
  Plus,
  Search,
  BedDouble,
  CheckCircle2,
  Clock,
  AlertCircle,
  Map,
} from "lucide-react";

interface FacilitiesViewProps {
  facilities: FacilityWithDetails[];
  organizations: Organization[];
  canManage: boolean;
}

export function FacilitiesView({ facilities, organizations, canManage }: FacilitiesViewProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<GeomedikActionResult | null>(null);

  const filtered = facilities.filter((f) => {
    if (categoryFilter !== "ALL" && f.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.code.toLowerCase().includes(q) ||
        f.province.toLowerCase().includes(q) ||
        f.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    const formData = new FormData(e.currentTarget);
    const res = await createFacilityAction(null, formData);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <Badge variant="success">Registri Nasional Fasilitas Kesehatan</Badge>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1 leading-snug">
            Registri Fasilitas Kesehatan & Titik Koordinat Geomedik
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar Rumah Sakit TNI/Kemhan, kapasitas tempat tidur, koordinat spasial, layanan medis,
            dan status verifikasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/gis"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700"
          >
            <Map className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Lihat di Peta GIS</span>
          </Link>

          {canManage && (
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setIsModalOpen(true);
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Tambah Faskes Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode faskes, nama RS, kota, atau provinsi..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
        >
          <option value="ALL">Semua Kategori Faskes</option>
          {FACILITY_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Cards / Table Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((fac) => (
          <div
            key={fac.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                    {fac.code}
                  </span>
                  <Badge variant="purple">{fac.organization?.category.replace("_", " ")}</Badge>
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
                  {fac.verificationStatus === "APPROVED" ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : fac.verificationStatus === "SUBMITTED" ? (
                    <Clock className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  {fac.verificationStatus}
                </Badge>
              </div>

              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Hospital className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{fac.name}</span>
              </h3>

              <p className="text-xs text-slate-500">
                {fac.organization?.name} • <strong>{fac.category.replace(/_/g, " ")}</strong>
              </p>

              <p className="text-xs text-slate-600 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {fac.address}, {fac.city}, {fac.province}
                </span>
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                    Kapasitas
                  </span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <BedDouble className="w-3.5 h-3.5 text-blue-600" /> {fac.bedCapacity} TT
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                    Koordinat GIS
                  </span>
                  <span className="font-mono font-semibold text-slate-800 text-[11px]">
                    {fac.latitude.toFixed(3)}, {fac.longitude.toFixed(3)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                    Operasional
                  </span>
                  <span className="font-semibold text-emerald-700 text-[11px]">
                    {fac.operationalStatus.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600">
                <strong>Layanan:</strong> {fac.services}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Input Data Fasilitas Kesehatan Baru"
        description="Masukkan informasi faskes beserta titik koordinat geografis yang valid."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {result && !result.success && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {result.error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Faskes</label>
              <input
                name="code"
                required
                placeholder="Mis: FASKES-AD-030"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Fasilitas Kesehatan
              </label>
              <input
                name="name"
                required
                placeholder="Mis: RS Tk. II dr. AK Gani Palembang"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organisasi Pengelola
              </label>
              <select
                name="organizationId"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
              >
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.code} - {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Faskes
              </label>
              <select
                name="category"
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
                placeholder="Mis: Sumatera Selatan"
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
                placeholder="Mis: Kota Palembang"
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
                defaultValue="-2.9909"
                required
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
                defaultValue="104.7567"
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kapasitas Tempat Tidur
              </label>
              <input
                name="bedCapacity"
                type="number"
                min={0}
                defaultValue={220}
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
              placeholder="Jl. Merdeka No. 1, Bukit Kecil, Palembang"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Layanan Unggulan & Fasilitas Pendukung
            </label>
            <textarea
              name="services"
              required
              rows={2}
              placeholder="IGD 24 Jam, ICU, Bedah Umum, Evakuasi Medis"
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
              {isSubmitting ? "Menyimpan..." : "Simpan Fasilitas"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
