// src/app/admin/users/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useAdminApi, AdminUser } from "@/hooks/useAdminApi";
import toast from "react-hot-toast";

export default function AdminUsersPage() {
  const { getUsers, updateUserRole, loading } = useAdminApi();
  const [users,   setUsers]   = useState<AdminUser[]>([]);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState<"all" | "admin" | "student">("all");
  const [changing, setChanging] = useState<string | null>(null);

  useEffect(() => { getUsers().then(setUsers); }, []);

  const handleRoleChange = async (user: AdminUser) => {
    const nuevoRol = user.role === "admin" ? "student" : "admin";
    const ok = window.confirm(`¿Cambiar el rol de ${user.email} a "${nuevoRol}"?`);
    if (!ok) return;
    setChanging(user.id);
    try {
      await updateUserRole(user.id, nuevoRol);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: nuevoRol } : u));
      toast.success(`Rol actualizado a ${nuevoRol}`);
    } catch { toast.error("No se pudo actualizar el rol"); }
    finally { setChanging(null); }
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || u.role === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-brand text-[#00C0E7] text-2xl uppercase tracking-wide">Usuarios y Roles</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona los permisos de los miembros de la plataforma</p>
      </div>

      {/* Filtros */}
      <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className="flex-1 bg-[#0d0d0d] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C0E7]" />
        <div className="flex gap-2">
          {(["all","admin","student"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f ? "bg-[#00C0E7] text-[#0d0d0d]" : "border border-gray-700 text-gray-400 hover:border-[#00C0E7]"}`}>
              {f === "all" ? "Todos" : f === "admin" ? "Admins" : "Estudiantes"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-[#00C0E7] font-brand text-xs uppercase tracking-wide">Usuario</th>
                <th className="text-left px-5 py-3 text-[#00C0E7] font-brand text-xs uppercase tracking-wide hidden sm:table-cell">Correo</th>
                <th className="text-center px-5 py-3 text-[#00C0E7] font-brand text-xs uppercase tracking-wide">Rol</th>
                <th className="text-center px-5 py-3 text-[#00C0E7] font-brand text-xs uppercase tracking-wide hidden md:table-cell">Inscripciones</th>
                <th className="text-center px-5 py-3 text-[#00C0E7] font-brand text-xs uppercase tracking-wide">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center"><div className="spinner-cyan mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-gray-500 text-sm">No hay usuarios que coincidan</td></tr>
              ) : filtered.map((user) => (
                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-brand text-sm ${user.role === "admin" ? "bg-[#E31E24]" : "bg-[#00C0E7]"}`}>
                        {(user.firstName || user.email)?.[0]?.toUpperCase() ?? "U"}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{user.firstName} {user.lastName}</p>
                        <p className="text-gray-500 text-xs sm:hidden">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs hidden sm:table-cell">{user.email}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${user.role === "admin" ? "bg-[rgba(231,30,36,0.15)] text-[#E31E24]" : "bg-[rgba(0,192,231,0.1)] text-[#00C0E7]"}`}>
                      {user.role === "admin" ? "Admin" : "Estudiante"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center text-gray-400 text-sm hidden md:table-cell">{user.enrollments}</td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => handleRoleChange(user)} disabled={changing === user.id}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
                        user.role === "admin"
                          ? "border-gray-600 text-gray-400 hover:border-[#00C0E7] hover:text-[#00C0E7]"
                          : "border-gray-600 text-gray-400 hover:border-[#E31E24] hover:text-[#E31E24]"
                      }`}>
                      {changing === user.id ? "..." : user.role === "admin" ? "Quitar admin" : "Hacer admin"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-800 text-xs text-gray-600">
          {filtered.length} de {users.length} usuarios
        </div>
      </div>
    </div>
  );
}
