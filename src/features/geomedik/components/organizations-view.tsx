"use client";

import React, { useState } from "react";
import { Badge, Modal } from "@/shared";
import type { Organization } from "@/db/schema";
import type { FacilityWithDetails } from "../service";
import { ORG_CATEGORIES, ORG_LEVELS } from "../dto";
import { createOrganizationAction, type GeomedikActionResult } from "../actions";
import { Building2, Plus, Search, ShieldCheck, Network } from "lucide-react";

interface OrganizationsViewProps {
  organizations: Organization[];
  facilities: FacilityWithDetails[];
  canManage: boolean;
}

export function OrganizationsView({
  organizations,
  facilities,
  canManage,
}: OrganizationsViewProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<GeomedikActionResult | null>(null);

  const filtered = organizations.filter((o) => {
    if (categoryFilter !== "ALL" && o.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.name.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        o.province.toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    const formData = new FormData(e.currentTarget);
    const res = await createOrganizationAction(null, formData);
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
          <Badge variant="purple">Master Data Organisasi & Satuan Kesehatan</Badge>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Struktur Organisasi & Komando Kesehatan Pertahanan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan hierarki organisasi Kemhan RI, Mabes TNI, Pusat Kesehatan Matra (AD/AL/AU),
            dan Kotama/Kesdam pengelola fasilitas.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Organisasi / Satuan
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
            placeholder="Cari kode, nama satuan, atau provinsi..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
        >
          <option value="ALL">Semua Induk / Matra</option>
          {ORG_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Organization Mobile Cards & Desktop Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Mobile Cards View (md:hidden) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filtered.map((org) => {
            const countFaskes = facilities.filter((f) => f.organizationId === org.id).length;
            const parentOrg = organizations.find((p) => p.id === org.parentId);
            return (
              <div key={org.id} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {org.code}
                    </span>
                    <Badge variant="default">{org.category.replace("_", " ")}</Badge>
                  </div>
                  <Badge variant="success">
                    <ShieldCheck className="w-3 h-3" /> Aktif
                  </Badge>
                </div>

                <div>
                  <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{org.name}</span>
                  </p>
                  {parentOrg && (
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <Network className="w-3 h-3 shrink-0" /> Induk: {parentOrg.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                      Tingkat
                    </span>
                    <span className="font-bold text-slate-800">{org.level}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                      Wilayah
                    </span>
                    <span className="font-semibold text-slate-700 truncate block">
                      {org.province}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                      Faskes
                    </span>
                    <span className="font-bold text-emerald-700">{countFaskes} RS</span>
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
                <th className="py-3.5 px-4">Kode Unik</th>
                <th className="py-3.5 px-4">Nama Organisasi / Satuan</th>
                <th className="py-3.5 px-4">Matra / Induk</th>
                <th className="py-3.5 px-4">Tingkat Hierarki</th>
                <th className="py-3.5 px-4">Wilayah Utama</th>
                <th className="py-3.5 px-4">Faskes Terkait</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((org) => {
                const countFaskes = facilities.filter((f) => f.organizationId === org.id).length;
                const parentOrg = organizations.find((p) => p.id === org.parentId);
                return (
                  <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{org.code}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{org.name}</span>
                      </div>
                      {parentOrg && (
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 pl-6">
                          <Network className="w-3 h-3" /> Induk: {parentOrg.name}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="default">{org.category.replace("_", " ")}</Badge>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{org.level}</td>
                    <td className="py-3.5 px-4 text-slate-600">{org.province}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{countFaskes}</span>{" "}
                      <span className="text-slate-500">Faskes</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="success">
                        <ShieldCheck className="w-3 h-3" /> Aktif
                      </Badge>
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
        title="Tambah Master Organisasi / Satuan Kesehatan"
        description="Pastikan kode organisasi unik dan sesuai dengan nomenklatur Kemhan/TNI."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {result && !result.success && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {result.error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Unik Organisasi
              </label>
              <input
                name="code"
                required
                placeholder="Mis: AD-KESDAM-III"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Provinsi Wilayah Kerja
              </label>
              <input
                name="province"
                required
                placeholder="Mis: Jawa Barat"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Resmi Organisasi / Satuan
            </label>
            <input
              name="name"
              required
              placeholder="Mis: Kesdam III/Siliwangi"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Matra / Instansi
              </label>
              <select
                name="category"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
              >
                {ORG_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tingkat Hierarki
              </label>
              <select
                name="level"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
              >
                {ORG_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Organisasi Induk (Opsional)
            </label>
            <select
              name="parentId"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
            >
              <option value="">-- Tingkat Puncak / Tanpa Induk --</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code} - {o.name}
                </option>
              ))}
            </select>
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
              {isSubmitting ? "Menyimpan..." : "Simpan Organisasi"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
