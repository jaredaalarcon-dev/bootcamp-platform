// src/app/admin/settings/page.tsx
"use client";
import { useState } from "react";
import toast from "react-hot-toast";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800">
        <h3 className="font-brand text-[#00C0E7] text-sm uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        {desc && <p className="text-gray-500 text-xs mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? "bg-[#00C0E7]" : "bg-gray-700"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    platformName: "Soluciones Integrales JB",
    maintenanceMode: false,
    emailNotifications: true,
    allowRegistration: true,
    requireEmailConfirmation: false,
    maxCoursesPerUser: 10,
  });

  const toggle = (key: keyof typeof settings) =>
    setSettings((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = () => toast.success("Configuración guardada (demo)");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-brand text-[#00C0E7] text-2xl uppercase tracking-wide">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">Ajustes generales de la plataforma</p>
      </div>

      <Section title="Información de la Plataforma">
        <SettingRow label="Nombre de la plataforma">
          <input value={settings.platformName}
            onChange={(e) => setSettings((p) => ({ ...p, platformName: e.target.value }))}
            className="bg-[#0d0d0d] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#00C0E7] w-64" />
        </SettingRow>
        <SettingRow label="Modo mantenimiento" desc="Los estudiantes no podrán acceder mientras esté activo">
          <Toggle enabled={settings.maintenanceMode} onChange={() => toggle("maintenanceMode")} />
        </SettingRow>
      </Section>

      <Section title="Registro y Acceso">
        <SettingRow label="Permitir nuevos registros" desc="Los usuarios pueden crear cuentas nuevas">
          <Toggle enabled={settings.allowRegistration} onChange={() => toggle("allowRegistration")} />
        </SettingRow>
        <SettingRow label="Requerir confirmación de correo" desc="Los nuevos usuarios deben confirmar su email">
          <Toggle enabled={settings.requireEmailConfirmation} onChange={() => toggle("requireEmailConfirmation")} />
        </SettingRow>
      </Section>

      <Section title="Notificaciones">
        <SettingRow label="Notificaciones por correo" desc="Enviar emails automáticos a los estudiantes">
          <Toggle enabled={settings.emailNotifications} onChange={() => toggle("emailNotifications")} />
        </SettingRow>
      </Section>

      <Section title="Estado de Integraciones">
        {[
          { name: "Supabase Auth", status: true, desc: "Autenticación de usuarios" },
          { name: "Supabase Storage", status: true, desc: "Almacenamiento de imágenes" },
          { name: "Supabase PostgreSQL", status: true, desc: "Base de datos principal" },
          { name: "JWT Tokens", status: true, desc: "Autenticación de API" },
        ].map((integration) => (
          <SettingRow key={integration.name} label={integration.name} desc={integration.desc}>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${integration.status ? "bg-[rgba(0,192,231,0.1)] text-[#00C0E7]" : "bg-[rgba(231,30,36,0.1)] text-[#E31E24]"}`}>
              {integration.status ? "✓ Activo" : "✗ Inactivo"}
            </span>
          </SettingRow>
        ))}
      </Section>

      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-red px-6 py-2.5 text-sm">
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}
