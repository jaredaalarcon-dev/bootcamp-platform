// src/components/ui/StudentNavbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function StudentNavbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { getUser, logout } = useAuth();
  const user = getUser();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors ${
        pathname === href
          ? "text-[#00C0E7]"
          : "text-gray-400 hover:text-[#00C0E7]"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="bg-[#0d0d0d] sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <Link href="/dashboard" className="flex flex-col leading-none">
            <span className="font-brand text-[#00C0E7] text-lg tracking-wide uppercase">
              Soluciones Integrales JB
            </span>
            <span className="text-white text-sm font-bold">Bootcamp</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            {link("/dashboard",  "Dashboard")}
            {link("/courses",    "Cursos")}
            {link("/my-courses", "Mis Cursos")}
          </nav>

          {/* User */}
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden sm:block text-xs text-gray-400 max-w-[140px] truncate">
                {user.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="btn-red text-sm px-3 py-1.5"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
      {/* Línea roja de marca */}
      <div className="line-red" />
    </header>
  );
}
