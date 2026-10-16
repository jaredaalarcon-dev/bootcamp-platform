// src/app/blog/page.tsx
// Blog de Soluciones Integrales JB: últimas publicaciones de las redes de la
// empresa (Facebook, Instagram, YouTube, TikTok, LinkedIn) que publica el admin.
// Es público: con sesión se ve dentro del panel del alumno; sin sesión, con
// la cabecera de la página principal.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { StudentLayout } from "@/components/ui/StudentLayout";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TiltedGridHero, TiltedGridImage } from "@/components/ui/TiltedGridHero";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { useBlogApi, ItemBlog, RedBlog, REDES_BLOG } from "@/hooks/useBlogApi";
import { useCoursesApi } from "@/hooks/useCoursesApi";
import { REDES } from "@/lib/social";

// Fotos de apoyo para el hero (se suman a las portadas reales de los cursos)
const U = (id: string) => `https://images.unsplash.com/${id}?w=900&auto=format&fit=crop&q=60`;
const FOTOS: TiltedGridImage[] = [
  { src: U("photo-1498050108023-c5249f4df085"), alt: "Laptop con código" },
  { src: U("photo-1522071820081-009f0129c71c"), alt: "Equipo trabajando" },
  { src: U("photo-1518770660439-4636190af475"), alt: "Circuito electrónico" },
  { src: U("photo-1461749280684-dccba630e2f6"), alt: "Pantalla con código" },
  { src: U("photo-1519389950473-47ba0277781c"), alt: "Personas con laptops" },
  { src: U("photo-1550751827-4bd374c3f58b"), alt: "Ciberseguridad" },
  { src: U("photo-1517694712202-14dd9538aa97"), alt: "Programación" },
  { src: U("photo-1531297484001-80022131f5a1"), alt: "Tecnología" },
];

const COLOR_RED: Record<RedBlog, string> = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  youtube: "#FF0000",
  tiktok: "#111111",
  linkedin: "#0A66C2",
  github: "#24292F",
  noticia: "#E31E24",
};
const etiquetaRed = (r: RedBlog) => REDES_BLOG.find((x) => x.value === r)?.label ?? "Noticia";

function fecha(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

// ── Tarjeta de publicación ──────────────────────────────────────────────────
function TarjetaPost({ p }: { p: ItemBlog }) {
  const [sinImagen, setSinImagen] = useState(!p.imageUrl);
  const red = p.network === "noticia" ? null : REDES.find((r) => r.red === p.network);
  return (
    <a href={p.url} target="_blank" rel="noopener noreferrer"
      className="group card-dark overflow-hidden flex flex-col h-full hover:border-[#00C0E7]/50 transition-colors">
      <div className="keep-theme relative h-44 shrink-0 overflow-hidden bg-gradient-to-br from-[#0f2a3f] to-[#111827]">
        {!sinImagen && (
          <img src={p.imageUrl!} alt="" loading="lazy" onError={() => setSinImagen(true)}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        )}
        {sinImagen && (
          <div className="absolute inset-0 flex items-center justify-center opacity-80">
            {red ? <SocialIcon red={red.red} color="#ffffff" className="w-14 h-14" />
                 : <img src="/brand/icono-sijb.png" alt="" className="w-16 h-16 opacity-80" />}
          </div>
        )}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow"
          style={{ backgroundColor: COLOR_RED[p.network] }}>
          {red && <SocialIcon red={red.red} color="#ffffff" className="w-3.5 h-3.5" />}
          {etiquetaRed(p.network)}
        </span>
        {p.network === "youtube" && !sinImagen && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-[#FF0000] transition-colors">
              <svg className="w-5 h-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </span>
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        {p.category && <p className="text-[#00C0E7] text-[11px] font-bold uppercase tracking-wider mb-1">{p.category}</p>}
        <h3 className="text-white font-semibold text-[15px] leading-snug line-clamp-2 min-h-[2.6rem] group-hover:text-[#00C0E7] transition-colors">{p.title}</h3>
        {p.summary && <p className="text-gray-500 text-sm mt-1.5 line-clamp-3">{p.summary}</p>}
        <div className="mt-auto pt-4 flex items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-1.5 text-gray-500">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {fecha(p.publishedAt)}
          </span>
          <span className="font-semibold text-[#E31E24] group-hover:translate-x-0.5 transition-transform">
            {p.network === "youtube" ? "Ver video" : "Ver publicación"} →
          </span>
        </div>
      </div>
    </a>
  );
}

// ── Contenido del blog ──────────────────────────────────────────────────────
function ContenidoBlog({ logueado }: { logueado: boolean }) {
  const { getFeed, subscribe, loading } = useBlogApi();
  const { getCourses } = useCoursesApi();
  const [items, setItems] = useState<ItemBlog[]>([]);
  const [error, setError] = useState(false);
  const [filtro, setFiltro] = useState<RedBlog | "todos">("todos");
  const [extra, setExtra] = useState(0); // filas agregadas con "Ver más"
  const [filasBase, setFilasBase] = useState(3);
  const asideRef = useRef<HTMLDivElement>(null); // contenido natural del panel (sin estirar)
  const ctaRef = useRef<HTMLDivElement>(null);
  const cabeceraRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [cursos, setCursos] = useState<{ image?: string; title: string; category?: { name: string } }[]>([]);
  const [correo, setCorreo] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    getFeed().then((r) => { setItems(r.items); setError(!r.success); });
    getCourses().then((r: any) => { if (r?.success && r.data) setCursos(r.data); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const imagenesHero = useMemo<TiltedGridImage[]>(() => {
    const deCursos = cursos.filter((c) => c.image).map((c) => ({ src: c.image!, alt: c.title }));
    // Se intercalan portadas de cursos y fotos de apoyo
    const mezcla: TiltedGridImage[] = [];
    const n = Math.max(deCursos.length, FOTOS.length);
    for (let i = 0; i < n; i++) {
      if (FOTOS[i]) mezcla.push(FOTOS[i]);
      if (deCursos[i]) mezcla.push(deCursos[i]);
    }
    return mezcla;
  }, [cursos]);

  // Iguala el alto de la columna de publicaciones con la barra lateral:
  // calcula cuántas filas de tarjetas caben sin dejar espacio vacío.
  useEffect(() => {
    const aside = asideRef.current;
    if (!aside) return;
    const calcular = () => {
      if (window.innerWidth < 1024) { setFilasBase(3); return; }
      const tarjeta = gridRef.current?.firstElementChild as HTMLElement | null;
      const altoTarjeta = tarjeta?.offsetHeight || 330;
      const cabecera = (cabeceraRef.current?.offsetHeight ?? 40) + 24;
      const boton = 64;
      const altoPanel = aside.offsetHeight + (ctaRef.current?.offsetHeight ?? 0) + 2;
      const filas = Math.ceil((altoPanel - cabecera - boton + 20) / (altoTarjeta + 20));
      setFilasBase(Math.max(2, filas));
    };
    calcular();
    const ro = new ResizeObserver(calcular);
    ro.observe(aside);
    window.addEventListener("resize", calcular);
    return () => { ro.disconnect(); window.removeEventListener("resize", calcular); };
  }, [items.length]);

  const redesPresentes = useMemo(
    () => REDES_BLOG.filter((r) => items.some((i) => i.network === r.value)),
    [items],
  );
  const categorias = new Set(cursos.map((c) => c.category?.name).filter(Boolean)).size;
  const filtrados = filtro === "todos" ? items : items.filter((i) => i.network === filtro);
  const visibles = (filasBase + extra) * 2;

  const suscribir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(correo.trim())) { toast.error("Ingresa un correo válido"); return; }
    setEnviando(true);
    const r = await subscribe(correo.trim());
    setEnviando(false);
    if (!r.success) { toast.error(r.error || "No se pudo suscribir"); return; }
    toast.success("¡Listo! Te avisaremos de las novedades.");
    setCorreo("");
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <TiltedGridHero
        images={imagenesHero}
        tileHeight={34}
        axis={60}
        speed={4.5}
        className="keep-theme h-[440px] sm:h-[480px] w-full rounded-2xl border border-[rgba(0,192,231,0.25)] bg-[#0d0d0d]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent z-[5]" />
        <div className="relative z-10 flex h-full flex-col items-center justify-between py-9 sm:py-10 text-center">
          <div className="px-6">
            <span className="inline-block rounded-full bg-[#00C0E7] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#0d0d0d]">Blog</span>
            <h1 className="mt-3 font-brand uppercase text-white text-4xl sm:text-5xl tracking-wide leading-none">
              Aprende, crece, <span className="text-[#00C0E7]">avanza</span>
            </h1>
            <div className="mx-auto mt-3 h-[3px] w-16 rounded bg-[#E31E24]" />
            <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-gray-300">
              Novedades, consejos y lo último que compartimos en nuestras redes.
            </p>
          </div>
          <p className="max-w-md px-6 text-sm italic text-gray-400">“La educación es la clave para un mejor futuro.”</p>
        </div>
      </TiltedGridHero>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Columna principal ──────────────────────────────────────────── */}
        <div className="space-y-6 min-w-0">
          <div ref={cabeceraRef} className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-brand text-white text-xl uppercase tracking-wide">Últimas publicaciones</h2>
              <div className="h-[2px] w-10 bg-[#E31E24] rounded mt-1" />
            </div>
            {redesPresentes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {([{ value: "todos", label: "Todos" }, ...redesPresentes] as { value: RedBlog | "todos"; label: string }[]).map((r) => (
                  <button key={r.value} onClick={() => { setFiltro(r.value); setExtra(0); }}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                      filtro === r.value ? "bg-[#00C0E7] text-[#0d0d0d]" : "border border-[rgba(0,192,231,0.3)] text-gray-400 hover:border-[#00C0E7] hover:text-[#00C0E7]"
                    }`}>
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading && items.length === 0 ? (
            <div className="card-dark p-16 flex justify-center"><div className="spinner-cyan" /></div>
          ) : filtrados.length === 0 ? (
            <div className="card-dark p-10 text-center">
              <img src="/brand/icono-sijb.png" alt="" className="w-14 h-14 mx-auto mb-3 opacity-80" />
              <p className="text-white font-semibold">{error ? "No pudimos cargar las publicaciones" : "Muy pronto encontrarás novedades aquí"}</p>
              <p className="text-gray-500 text-sm mt-1">Mientras tanto, síguenos en nuestras redes para no perderte nada.</p>
            </div>
          ) : (
            <>
              <div ref={gridRef} className="grid gap-5 sm:grid-cols-2">
                {filtrados.slice(0, visibles).map((p) => <TarjetaPost key={p.id} p={p} />)}
              </div>
              {filtrados.length > visibles && (
                <div className="text-center">
                  <button onClick={() => setExtra((v) => v + 2)} className="btn-cyan text-sm px-6 py-2">Ver más publicaciones</button>
                </div>
              )}
            </>
          )}

        </div>

        {/* ── Barra lateral ──────────────────────────────────────────────── */}
        {/* ── Barra lateral: un solo panel que llega hasta el final de las publicaciones ── */}
        <aside className="min-w-0">
          <div className="card-dark h-full flex flex-col overflow-hidden">
            <div ref={asideRef}>
              <div className="p-5">
                <h3 className="text-white font-semibold text-lg">Síguenos en nuestras redes</h3>
                <p className="text-gray-500 text-xs mt-0.5 mb-4">Mantente conectado y no te pierdas ninguna novedad.</p>
              <div className="space-y-2">
                {REDES.map((r) => (
                  <a key={r.red} href={r.url} target={r.red === "email" ? undefined : "_blank"} rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-lg border border-[rgba(0,192,231,0.15)] px-3 py-2 hover:border-[#00C0E7]/60 hover:bg-[rgba(0,192,231,0.05)] transition-colors">
                    <SocialIcon red={r.red} color={r.color} tile className="w-9 h-9" />
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-semibold leading-tight">{r.nombre}</p>
                      <p className="text-gray-500 text-xs truncate">{r.usuario}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-[#00C0E7] group-hover:translate-x-0.5 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </a>
                ))}
              </div>
              </div>

            <form onSubmit={suscribir} className="p-5 border-t border-[rgba(0,192,231,0.15)]">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-lg bg-[rgba(0,192,231,0.12)] text-[#00C0E7] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </span>
                <div>
                  <h3 className="text-white font-semibold">Suscríbete a nuestro blog</h3>
                  <p className="text-gray-500 text-xs mt-0.5">Recibe las novedades y nuevos cursos en tu correo.</p>
                </div>
              </div>
              <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="Tu correo electrónico"
                className="input-dark mt-4" maxLength={255} />
              <button type="submit" disabled={enviando} className="btn-red w-full mt-3 text-sm py-2.5">
                {enviando ? "Enviando…" : "Suscribirme"}
              </button>
            </form>

              <div className="p-5 border-t border-[rgba(0,192,231,0.15)]">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00C0E7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  Datos importantes
                </h3>
                <ul className="mt-3 space-y-3 text-sm">
                  <li className="flex items-center gap-3"><span className="font-brand text-[#00C0E7] text-xl w-14 shrink-0">{cursos.length || "—"}</span><span className="text-gray-400">Cursos disponibles</span></li>
                  <li className="flex items-center gap-3"><span className="font-brand text-[#00C0E7] text-xl w-14 shrink-0">{categorias || "—"}</span><span className="text-gray-400">Áreas de especialización</span></li>
                  <li className="flex items-center gap-3"><span className="font-brand text-[#00C0E7] text-xl w-14 shrink-0">100%</span><span className="text-gray-400">Certificados con ID verificable</span></li>
                </ul>
              </div>
            </div>

            {/* Llamado a la acción: siempre al pie del panel */}
            <div ref={ctaRef} className="keep-theme mt-auto relative overflow-hidden p-6 bg-gradient-to-br from-[#0f2a3f] to-[#111827] border-t border-[rgba(0,192,231,0.3)]">
              <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-[#00C0E7]/10" />
              <svg className="w-8 h-8 text-[#00C0E7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>
              <h3 className="mt-3 text-white font-semibold text-lg">¿Listo para dar el siguiente paso?</h3>
              <p className="text-gray-400 text-sm mt-1">Explora nuestros cursos y comienza tu camino hacia el éxito profesional.</p>
              <Link href={logueado ? "/courses" : "/register"} className="btn-red mt-4 text-sm px-5 py-2 relative">
                {logueado ? "Ver cursos" : "Crear mi cuenta"} →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Página ──────────────────────────────────────────────────────────────────
export default function BlogPage() {
  // null hasta leer la sesión en el navegador (evita diferencias de hidratación)
  const [logueado, setLogueado] = useState<boolean | null>(null);
  useEffect(() => {
    try { setLogueado(!!localStorage.getItem("accessToken")); } catch { setLogueado(false); }
  }, []);

  if (logueado === null) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d]"><div className="spinner-cyan" /></div>;
  }

  if (logueado) {
    return <StudentLayout><ContenidoBlog logueado /></StudentLayout>;
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <header className="border-b border-[rgba(0,192,231,0.12)] bg-[#111827]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/"><BrandLogo width={210} /></Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:inline text-sm font-semibold text-gray-300 hover:text-[#00C0E7] transition-colors">Iniciar sesión</Link>
            <Link href="/register" className="btn-red text-sm py-2 px-4">Crear cuenta</Link>
          </div>
        </div>
      </header>
      <ContenidoBlog logueado={false} />
      <footer className="border-t border-gray-900 py-6 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} Soluciones Integrales JB S.A.C. Todos los derechos reservados.
      </footer>
    </div>
  );
}
