"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DynamicIcon } from "./dynamic-icon";
import { Badge } from "@/shared";
import { logoutAction } from "@/features/auth/actions";
import type { NavigationCategoryGroup } from "../service";
import type { SessionPayload } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { LogOut, Shield, Menu, X, Crosshair } from "lucide-react";

interface SidebarProps {
  categories: NavigationCategoryGroup[];
  currentUser: SessionPayload;
}

export function Sidebar({ categories, currentUser }: SidebarProps) {
  const pathname = usePathname();
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const getRoleVariant = (code: string) => {
    switch (code) {
      case "SUPER_ADMIN":
        return "purple";
      case "ADMIN":
        return "default";
      case "STAFF":
        return "success";
      default:
        return "outline";
    }
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800 bg-slate-950/60">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Crosshair className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white tracking-tight text-base block">SI-GEOMEDIK</span>
            <span className="text-[10px] text-emerald-400 font-semibold block uppercase tracking-wider">
              Kemhan RI • GIS Kesehatan
            </span>
          </div>
        </Link>
        <button
          onClick={() => setIsOpenMobile(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Dynamic Nav Items */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {categories.length === 0 ? (
          <div className="px-3 py-4 text-xs text-slate-500 bg-slate-800/40 rounded-lg text-center">
            Tidak ada menu yang diizinkan untuk role Anda.
          </div>
        ) : (
          categories.map((group) => (
            <div key={group.category} className="space-y-1">
              <h4 className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                {group.category}
              </h4>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    item.path === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.path);

                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      onClick={() => setIsOpenMobile(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                        isActive
                          ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                      )}
                    >
                      <DynamicIcon
                        name={item.icon}
                        className={cn(
                          "w-4 h-4 transition-transform group-hover:scale-110",
                          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                        )}
                      />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))
        )}
      </div>

      {/* User Session Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400 shrink-0">
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Badge variant={getRoleVariant(currentUser.roleCode)} className="truncate max-w-[175px]">
            <Shield className="w-3 h-3 shrink-0" />
            <span className="truncate">{currentUser.roleName}</span>
          </Badge>

          <form action={logoutAction}>
            <button
              type="submit"
              title="Keluar / Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Trigger Button */}
      <div className="lg:hidden fixed top-3 left-4 z-40">
        <button
          onClick={() => setIsOpenMobile(true)}
          className="p-2 rounded-lg bg-slate-900 text-white shadow-lg border border-slate-700"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 border-r border-slate-800">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpenMobile(false)}
          />
          <div className="relative w-72 max-w-xs h-full z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
