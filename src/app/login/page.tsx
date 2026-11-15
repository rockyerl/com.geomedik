import React from "react";
import { LoginForm } from "@/features/auth/components/login-form";
import { Crosshair, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-emerald-500 selection:text-white">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand Logo & Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 mb-2">
            <Crosshair className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SI-GEOMEDIK KEMHAN RI</h1>
          <p className="text-sm text-slate-400">
            Sistem Informasi Geospasial & Sumber Daya Kesehatan Pertahanan
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-100">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Autentikasi Personel
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan kredensial sesuai peran otorisasi (Pusdatin / Verifikator Ditkes / Operator
              Faskes).
            </p>
          </div>

          <LoginForm />
        </div>

        {/* Security Footer Notice */}
        <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Sesi terenkripsi HS256, RBAC Dinamis & Audit Trail (SUNDAWA SEC-07)</span>
        </div>
      </div>
    </div>
  );
}
