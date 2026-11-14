"use client";

import React, { useState } from "react";
import { Badge, Modal } from "@/shared";
import type { FacilityWithDetails } from "../service";
import { verifyFacilityAction, type GeomedikActionResult } from "../actions";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileCheck,
  XCircle,
  MapPin,
} from "lucide-react";

interface VerificationViewProps {
  facilities: FacilityWithDetails[];
  canVerify: boolean;
}

export function VerificationView({ facilities, canVerify }: VerificationViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [activeFacility, setActiveFacility] = useState<FacilityWithDetails | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<
    "APPROVED" | "NEEDS_REVISION" | "REJECTED" | "SUBMITTED"
  >("APPROVED");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<GeomedikActionResult | null>(null);

  const pendingCount = facilities.filter((f) => f.verificationStatus === "SUBMITTED").length;
  const revisionCount = facilities.filter((f) => f.verificationStatus === "NEEDS_REVISION").length;
  const approvedCount = facilities.filter((f) => f.verificationStatus === "APPROVED").length;

  const filtered = facilities.filter((f) => {
    if (filterStatus === "ALL") return true;
    return f.verificationStatus === filterStatus;
  });

  function openVerifyModal(
    fac: FacilityWithDetails,
    defaultDecision: "APPROVED" | "NEEDS_REVISION" | "REJECTED" | "SUBMITTED"
  ) {
    setActiveFacility(fac);
    setDecisionStatus(defaultDecision);
    setNote(fac.verificationNote || "");
    setResult(null);
  }

  async function handleVerifySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeFacility) return;
    setIsSubmitting(true);
    setResult(null);

    const formData = new FormData();
    formData.set("facilityId", activeFacility.id);
    formData.set("status", decisionStatus);
    formData.set("note", note);

    const res = await verifyFacilityAction(null, formData);
    setIsSubmitting(false);

    if (res.success) {
      setActiveFacility(null);
    } else {
      setResult(res);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <Badge variant="warning">Tata Kelola Verifikasi & Persetujuan Berjenjang</Badge>
        <h2 className="text-xl font-bold text-slate-900 mt-1">
          Antrean Pemeriksaan, Validasi & Persetujuan Data Geomedik
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Alur kontrol kualitas berjenjang (Operator Faskes/Kesdam &rarr; Pejabat Verifikator
          Ditkes/Puskes) untuk memastikan akurasi koordinat dan sumber daya.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setFilterStatus("SUBMITTED")}
          className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
            filterStatus === "SUBMITTED"
              ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400/20"
              : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase">Menunggu Verifikasi</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{pendingCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Pengajuan baru dari daerah</p>
          </div>
          <Clock className="w-8 h-8 text-amber-500" />
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus("NEEDS_REVISION")}
          className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
            filterStatus === "NEEDS_REVISION"
              ? "bg-rose-50 border-rose-400 ring-2 ring-rose-400/20"
              : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-rose-700 uppercase">Perlu Perbaikan</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{revisionCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Menunggu revisi operator</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus("APPROVED")}
          className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
            filterStatus === "APPROVED"
              ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20"
              : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase">
              Disetujui / Terverifikasi
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{approvedCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Layak tayang di Dashboard Eksekutif</p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {["ALL", "SUBMITTED", "NEEDS_REVISION", "APPROVED", "REJECTED"].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterStatus === st
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {st === "ALL" ? "Semua Data" : st}
          </button>
        ))}
      </div>

      {/* Queue List */}
      <div className="space-y-3">
        {filtered.map((fac) => (
          <div
            key={fac.id}
            className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                  {fac.code}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Periode: {fac.reportingPeriod}
                </span>
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

              <h3 className="text-sm sm:text-base font-bold text-slate-900">{fac.name}</h3>
              <p className="text-xs text-slate-600 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {fac.organization?.name} • {fac.city}, {fac.province} (Koordinat:{" "}
                  <span className="font-mono">
                    {fac.latitude.toFixed(4)}, {fac.longitude.toFixed(4)}
                  </span>
                  ) • Kapasitas: <strong>{fac.bedCapacity} TT</strong>
                </span>
              </p>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700 mt-2">
                <strong>Catatan Verifikasi:</strong>{" "}
                {fac.verificationNote || "Belum ada catatan keputusan."}
                {fac.verifiedBy && (
                  <span className="block text-[11px] text-slate-400 mt-0.5">
                    Diverifikasi oleh: {fac.verifiedBy}
                  </span>
                )}
              </div>
            </div>

            {canVerify && (
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-col items-stretch gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openVerifyModal(fac, "APPROVED")}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  Setujui Data
                </button>
                <button
                  type="button"
                  onClick={() => openVerifyModal(fac, "NEEDS_REVISION")}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  Minta Perbaikan
                </button>
                <button
                  type="button"
                  onClick={() => openVerifyModal(fac, "REJECTED")}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Tolak
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Keputusan Verifikasi */}
      <Modal
        isOpen={Boolean(activeFacility)}
        onClose={() => setActiveFacility(null)}
        title={`Keputusan Verifikasi: ${activeFacility?.name || ""}`}
        description="Keputusan ini akan dicatat secara permanen ke dalam rekam jejak Audit Trail."
      >
        <form onSubmit={handleVerifySubmit} className="space-y-4">
          {result && !result.success && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {result.error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status Keputusan Verifikator
            </label>
            <select
              value={decisionStatus}
              onChange={(e) =>
                setDecisionStatus(
                  e.target.value as "APPROVED" | "NEEDS_REVISION" | "REJECTED" | "SUBMITTED"
                )
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white font-semibold"
            >
              <option value="APPROVED">APPROVED — Disetujui & Terverifikasi</option>
              <option value="NEEDS_REVISION">
                NEEDS_REVISION — Minta Perbaikan Data/Koordinat
              </option>
              <option value="REJECTED">REJECTED — Tolak Pengajuan</option>
              <option value="SUBMITTED">SUBMITTED — Kembalikan ke Antrean Tinjauan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Pemeriksaan / Instruksi Perbaikan
            </label>
            <textarea
              required
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tuliskan dasar persetujuan atau detail data/koordinat yang harus diperbaiki oleh satuan..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveFacility(null)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              {isSubmitting ? "Menyimpan Keputusan..." : "Simpan Keputusan Verifikasi"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
