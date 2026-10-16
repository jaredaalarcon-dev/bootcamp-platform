// src/app/admin/layout.tsx
"use client";
import { usePathname } from "next/navigation";
import { AdminGuard } from "@/guards/admin.guard";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") return <>{children}</>;
  return (
    <AdminGuard>
      <AdminLayout>{children}</AdminLayout>
    </AdminGuard>
  );
}
