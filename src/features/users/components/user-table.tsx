"use client";

import React from "react";
import { Badge } from "@/shared";
import type { UserWithRole } from "../repository";
import type { SessionPayload } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";
import { Shield, Edit2, Trash2 } from "lucide-react";

interface UserTableProps {
  users: UserWithRole[];
  currentUser: SessionPayload;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (user: UserWithRole) => void;
  onDelete: (user: UserWithRole) => void;
}

export function UserTable({
  users,
  currentUser,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: UserTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Mobile Cards View (md:hidden) */}
      <div className="md:hidden divide-y divide-slate-100">
        {users.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Tidak ada data pengguna yang ditemukan.
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs border border-indigo-100 shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                      <span className="truncate">{user.name}</span>
                      {user.id === currentUser.userId && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                          Anda
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>

                {user.isActive ? (
                  <Badge variant="success">Aktif</Badge>
                ) : (
                  <Badge variant="danger">Non-Aktif</Badge>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <Badge variant={user.role.code === "SUPER_ADMIN" ? "purple" : "default"}>
                  <Shield className="w-3 h-3" />
                  {user.role.name}
                </Badge>

                <div className="inline-flex items-center gap-1">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(user)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                      title="Ubah Pengguna"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(user)}
                      disabled={user.id === currentUser.userId}
                      className={`p-1.5 rounded-lg transition-colors ${
                        user.id === currentUser.userId
                          ? "text-slate-300 cursor-not-allowed"
                          : "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                      }`}
                      title={
                        user.id === currentUser.userId
                          ? "Tidak dapat menghapus akun sendiri"
                          : "Hapus Pengguna"
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (hidden md:block) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
            <tr>
              <th className="px-6 py-4">Pengguna</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Dibuat Pada</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  Tidak ada data pengguna yang ditemukan.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs border border-indigo-100">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{user.name}</span>
                          {user.id === currentUser.userId && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                              Anda
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <Badge variant={user.role.code === "SUPER_ADMIN" ? "purple" : "default"}>
                      <Shield className="w-3 h-3" />
                      {user.role.name}
                    </Badge>
                  </td>

                  <td className="px-6 py-4">
                    {user.isActive ? (
                      <Badge variant="success">Aktif</Badge>
                    ) : (
                      <Badge variant="danger">Non-Aktif</Badge>
                    )}
                  </td>

                  <td className="px-6 py-4 text-xs text-slate-500">{formatDate(user.createdAt)}</td>

                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(user)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                          title="Ubah Pengguna"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(user)}
                          disabled={user.id === currentUser.userId}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.id === currentUser.userId
                              ? "text-slate-300 cursor-not-allowed"
                              : "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                          }`}
                          title={
                            user.id === currentUser.userId
                              ? "Tidak dapat menghapus akun sendiri"
                              : "Hapus Pengguna"
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
