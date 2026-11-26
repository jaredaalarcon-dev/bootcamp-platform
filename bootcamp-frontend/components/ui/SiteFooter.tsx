// src/components/ui/SiteFooter.tsx
// Pie de página público: datos de la empresa, contacto, enlaces legales
// y el Libro de Reclamaciones (obligatorio para proveedores en Perú).
import Link from "next/link";
import { EMPRESA } from "@/lib/legal";

// conRuc=false: la página de inicio no muestra el RUC (sí en las demás páginas públicas)
export function SiteFooter({ conRuc = true }: { conRuc?: boolean }) {
  return (
    <footer className="border-t border-gray-900 py-8 text-xs text-gray-500">
      <div className="max-w-6xl mx-auto px-4 grid gap-6 sm:grid-cols-[1fr_auto] items-start">
        <div className="space-y-1.5 text-center sm:text-left">
          <p className="text-gray-400 font-semibold">{EMPRESA.nombreComercial}</p>
          <p>
            {EMPRESA.titular}{conRuc && <> · RUC {EMPRESA.ruc}</>}
          </p>
          <p>
            <a href={EMPRESA.mapa} target="_blank" rel="noopener noreferrer" className="hover:text-[#00C0E7]">
              {EMPRESA.direccionCorta}
            </a>
          </p>
          <p className="flex flex-wrap justify-center sm:justify-start gap-x-3 gap-y-1">
            <a href={`mailto:${EMPRESA.correo}`} className="hover:text-[#00C0E7]">{EMPRESA.correo}</a>
            <a href={EMPRESA.whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366]">
              WhatsApp {EMPRESA.whatsapp}
            </a>
          </p>
        </div>

        <div className="flex flex-col items-center sm:items-end gap-3">
          <Link
            href="/libro-de-reclamaciones"
            className="keep-theme inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-white px-3 py-2 text-[#111827] hover:border-[#E31E24]"
            aria-label="Libro de Reclamaciones virtual"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#E31E24" strokeWidth={1.8} aria-hidden="true">
              <path d="M4 4.5A1.5 1.5 0 015.5 3H18v15H5.5A1.5 1.5 0 004 19.5v-15z" />
              <path d="M4 19.5A1.5 1.5 0 005.5 21H18v-3M8 7h6M8 10.5h6" />
            </svg>
            <span className="leading-tight text-left">
              <b className="block text-[12px]">Libro de Reclamaciones</b>
              <span className="text-[10px] text-gray-600">Virtual</span>
            </span>
          </Link>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/terminos" className="hover:text-[#00C0E7]">Términos y Condiciones</Link>
            <Link href="/privacidad" className="hover:text-[#00C0E7]">Política de Privacidad</Link>
            <Link href="/verificar" className="hover:text-[#00C0E7]">Verificar certificado</Link>
          </div>
        </div>
      </div>
      <p className="mt-6 text-center text-gray-600">
        © {new Date().getFullYear()} {EMPRESA.nombreComercial}. Todos los derechos reservados.
      </p>
    </footer>
  );
}
