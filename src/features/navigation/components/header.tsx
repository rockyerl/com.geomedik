"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { SessionPayload } from "@/lib/auth/session";
import { Badge } from "@/shared";
import {
  ShieldCheck,
  Globe,
  Bell,
  Clock,
  AlertTriangle,
  ClipboardCheck,
  CalendarClock,
} from "lucide-react";

interface HeaderProps {
  currentUser: SessionPayload;
}

const SYSTEM_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Antrean Verifikasi Data Faskes",
    description:
      "Terdapat pengajuan pembaruan data dari RS Tk. II dr. Soedjono, RS Tk. IV Padangsidimpuan, dan RSAU Manuhua Biak.",
    href: "/dashboard/verification",
    type: "warning" as const,
    time: "Periode 2026-TW4",
  },
  {
    id: "notif-2",
    title: "Peringatan Stok Matkes & IFAK Kritis",
    description:
      "Beberapa faskes siaga perbatasan membutuhkan pengisian ulang paket IFAK & Cairan Infus.",
    href: "/dashboard/materials",
    type: "danger" as const,
    time: "Pemantauan Logistik",
  },
  {
    id: "notif-3",
    title: "Jadwal Kalibrasi & Pemeliharaan Alkes",
    description: "Unit Chamber Hiperbarik & Ventilator ICU Transport terjadwal kalibrasi berkala.",
    href: "/dashboard/equipment",
    type: "info" as const,
    time: "Jadwal Pemeliharaan",
  },
  {
    id: "notif-4",
    title: "Pengingat Tenggat Konsolidasi Triwulan IV",
    description:
      "Batas akhir sinkronisasi data Geomedik Kotama/Kesdam/Lantamal/Koopsud periode 2026-TW4.",
    href: "/dashboard/reports",
    type: "info" as const,
    time: "Batas Pelaporan",
  },
];

export function Header({ currentUser }: HeaderProps) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <header className="h-16 shrink-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-3.5 sm:px-6 flex items-center justify-between gap-2 sticky top-0 z-30">
      <div className="pl-11 lg:pl-0 min-w-0">
        <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
          <span className="sm:hidden">SI-GEOMEDIK KEMHAN RI</span>
          <span className="hidden sm:inline">
            Sistem Informasi Geomedik & Sumber Daya Kesehatan Pertahanan
          </span>
        </h1>
        <p className="text-[11px] sm:text-xs text-slate-500 truncate">
          <span className="sm:hidden">100 Faskes • WebGIS Kesehatan Pertahanan</span>
          <span className="hidden sm:inline">
            Kementerian Pertahanan RI • Pemetaan Spasial 100 Faskes, SDM, Alkes & Material Kesehatan
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
          <Globe className="w-3.5 h-3.5 text-emerald-600" />
          <span>GIS Nasional Aktif</span>
        </div>

        {/* Notification Bell & Reminder Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Notifikasi & Pengingat Sistem"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
              {SYSTEM_NOTIFICATIONS.length}
            </span>
          </button>

          {isNotifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
              <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 bg-white rounded-xl border border-slate-200 shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">
                      Pusat Notifikasi & Pengingat Pelaporan
                    </span>
                  </div>
                  <Badge variant="purple">{SYSTEM_NOTIFICATIONS.length} Aktif</Badge>
                </div>

                <div className="divide-y divide-slate-100 max-h-[70vh] sm:max-h-80 overflow-y-auto">
                  {SYSTEM_NOTIFICATIONS.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsNotifOpen(false)}
                      className="block p-3.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        {item.type === "danger" ? (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        ) : item.type === "warning" ? (
                          <ClipboardCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <CalendarClock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-slate-900">{item.title}</p>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {item.description}
                          </p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {item.time}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <Badge variant="purple" className="py-1 px-2.5 sm:px-3">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden">{currentUser.roleCode}</span>
          <span className="hidden sm:inline">{currentUser.roleName}</span>
        </Badge>
      </div>
    </header>
  );
}
