import React from "react";
import type { SessionPayload } from "@/lib/auth/session";
import { Badge } from "@/shared";
import { ShieldCheck, Globe } from "lucide-react";

interface HeaderProps {
  currentUser: SessionPayload;
}

export function Header({ currentUser }: HeaderProps) {
  return (
    <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      <div className="pl-10 lg:pl-0">
        <h1 className="text-base font-semibold text-slate-900 tracking-tight">
          Sistem Informasi Geomedik & Sumber Daya Kesehatan Pertahanan
        </h1>
        <p className="text-xs text-slate-500 hidden sm:block">
          Kementerian Pertahanan RI • Pemetaan Spasial Faskes, SDM, Alkes & Material Kesehatan
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
          <Globe className="w-3.5 h-3.5 text-emerald-600" />
          <span>GIS Nasional Aktif</span>
        </div>

        <Badge variant="purple" className="py-1 px-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{currentUser.roleName}</span>
        </Badge>
      </div>
    </header>
  );
}
