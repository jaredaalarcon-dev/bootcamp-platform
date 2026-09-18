// src/app/admin/layout.tsx
"use client";

import { usePathname } from "next/navigation";
import { AdminGuard } from "@/guards/admin.guard";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // La pantalla de login vive dentro de /admin, así que tiene que
  // quedar fuera del guard o se produce un redirect infinito.
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <AdminGuard>
      <AdminTopbar />
      {children}
    </AdminGuard>
  );
}
