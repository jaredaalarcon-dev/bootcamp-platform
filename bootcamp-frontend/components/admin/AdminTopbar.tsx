// src/components/admin/AdminTopbar.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export function AdminTopbar() {
  const router = useRouter();
  const { getUser, logout } = useAuth();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    setEmail(getUser()?.email ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    logout();
    router.replace("/admin/login");
  };

  return (
    <header className="border-b border-slate-700 bg-slate-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-3">
        <Link href="/admin" className="text-sm font-medium text-white">
          Bootcamp · Administración
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{email}</span>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-400 hover:text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
