"use client";

import React, { useState } from "react";
import { loginAction, type ActionResult } from "../actions";
import { Lock, Mail, Loader2, AlertCircle, Shield, Check } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  function fillDemo(e: string, p: string) {
    setEmail(e);
    setPassword(p);
    setResult(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);

    try {
      const res = await loginAction(null, formData);
      setIsSubmitting(false);

      if (res && !res.success) {
        setResult(res);
      }
    } catch {
      setIsSubmitting(false);
      setResult({
        success: false,
        error: "Terjadi kendala jaringan saat menghubungi server. Silakan coba kembali.",
      });
    }
  }

  return (
    <div className="space-y-6">
      {result && !result.success && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{result.error}</p>
            {result.fieldErrors && (
              <ul className="list-disc list-inside text-xs space-y-0.5 text-rose-700">
                {Object.values(result.fieldErrors).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Alamat Email Dinas
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="nama@sundawa.id"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Kata Sandi
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-slate-800"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memverifikasi Kredensial...</span>
            </>
          ) : (
            <span>Masuk ke SI-GEOMEDIK</span>
          )}
        </button>
      </form>

      {/* Demo Credentials Quick-Select */}
      <div className="pt-4 border-t border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
          Simulasi Peran Pengguna (Klik untuk Mengisi)
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fillDemo("superadmin@sundawa.id", "Password123!")}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              email === "superadmin@sundawa.id"
                ? "bg-purple-50 border-purple-300 ring-2 ring-purple-400/20"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-purple-600" /> Pusdatin
              </span>
              {email === "superadmin@sundawa.id" && (
                <Check className="w-3.5 h-3.5 text-purple-600" />
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Super Admin Penuh</p>
          </button>

          <button
            type="button"
            onClick={() => fillDemo("admin@sundawa.id", "Password123!")}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              email === "admin@sundawa.id"
                ? "bg-blue-50 border-blue-300 ring-2 ring-blue-400/20"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-600" /> Verifikator
              </span>
              {email === "admin@sundawa.id" && <Check className="w-3.5 h-3.5 text-blue-600" />}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Ditkes Kuathan</p>
          </button>

          <button
            type="button"
            onClick={() => fillDemo("staff@sundawa.id", "Password123!")}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              email === "staff@sundawa.id"
                ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" /> Operator
              </span>
              {email === "staff@sundawa.id" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Faskes / Kesdam</p>
          </button>
        </div>
      </div>
    </div>
  );
}
