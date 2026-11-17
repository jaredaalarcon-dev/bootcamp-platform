// src/components/assistant/JBAssist.tsx
// JB Assist — asistente con IA de la plataforma (botón flotante + chat).
// El "cerebro" está en el backend (/v1/assistant/chat). Aquí solo la interfaz.
"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { DotOrb } from "@/components/assistant/DotOrb";
import { useAssistantApi } from "@/hooks/useAssistantApi";
import { useTheme } from "@/hooks/useTheme";

export const ASSISTANT_NAME = "JB Assist";
const AVATAR = "/brand/cubo-gorro.png";
const WHATSAPP = "51926392858";
const CLAVE_CONV = "jb-assist-conversacion";
const CLAVE_SALUDO = "jb-assist-saludo-visto";
const MAX = 1000;

// Rutas donde NO aparece (panel admin y pantallas de acceso)
const OCULTO_EN = [/^\/admin/, /^\/login/, /^\/register/];

const ETIQUETAS = ["Pensando", "Buscando en los cursos", "Analizando", "Redactando"];
const SUGERENCIAS = ["¿Qué cursos tienen?", "¿Cómo me inscribo?", "¿Dan certificado?", "Quiero hablar con una persona"];

interface Mensaje {
  id: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
  nuevo?: boolean; // anima la aparición palabra por palabra
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

function leerConversacion(): { id: string; mensajes: Mensaje[] } {
  try {
    const raw = localStorage.getItem(CLAVE_CONV);
    if (raw) {
      const d = JSON.parse(raw);
      if (typeof d?.id === "string" && Array.isArray(d?.mensajes)) {
        return { id: d.id, mensajes: d.mensajes.map((m: Mensaje) => ({ ...m, nuevo: false })) };
      }
    }
  } catch {}
  return { id: uid(), mensajes: [] };
}

function guardarConversacion(id: string, mensajes: Mensaje[]) {
  try {
    localStorage.setItem(
      CLAVE_CONV,
      JSON.stringify({ id, mensajes: mensajes.filter((m) => !m.error).slice(-30).map((m) => ({ id: m.id, role: m.role, content: m.content })) }),
    );
  } catch {}
}

/* ── Texto con formato básico: **negritas**, listas y saltos de línea ── */
function enLinea(texto: string, palabras: boolean, contador: { n: number }) {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return partes.map((p, i) => {
    const negrita = p.startsWith("**") && p.endsWith("**");
    const contenido = negrita ? p.slice(2, -2) : p;
    const nodos = palabras
      ? contenido.split(/(\s+)/).map((w, j) =>
          /^\s+$/.test(w) || !w ? (
            <Fragment key={j}>{w}</Fragment>
          ) : (
            <span key={j} className="jb-word" style={{ animationDelay: `${Math.min(contador.n++ * 22, 1600)}ms` }}>
              {w}
            </span>
          ),
        )
      : contenido;
    return negrita ? <strong key={i}>{nodos}</strong> : <Fragment key={i}>{nodos}</Fragment>;
  });
}

function TextoRico({ texto, animar }: { texto: string; animar: boolean }) {
  const contador = { n: 0 };
  const bloques: React.ReactNode[] = [];
  let lista: { tipo: "ul" | "ol"; items: string[] } | null = null;
  const cerrarLista = () => {
    if (!lista) return;
    const L = lista.tipo === "ul" ? "ul" : "ol";
    bloques.push(
      <L key={`l${bloques.length}`} className={lista.tipo === "ul" ? "jb-ul" : "jb-ol"}>
        {lista.items.map((it, i) => <li key={i}>{enLinea(it, animar, contador)}</li>)}
      </L>,
    );
    lista = null;
  };
  texto.split("\n").forEach((linea) => {
    const vineta = linea.match(/^\s*[-*•]\s+(.*)$/);
    const numero = linea.match(/^\s*\d+[.)]\s+(.*)$/);
    if (vineta || numero) {
      const tipo = vineta ? "ul" : "ol";
      if (lista && lista.tipo !== tipo) cerrarLista();
      if (!lista) lista = { tipo, items: [] };
      lista.items.push((vineta ?? numero)![1]);
      return;
    }
    cerrarLista();
    if (linea.trim()) bloques.push(<p key={`p${bloques.length}`}>{enLinea(linea, animar, contador)}</p>);
  });
  cerrarLista();
  return <>{bloques}</>;
}

/* ── Ícono ── */
const I = {
  enviar: <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />,
  cerrar: <path d="M6 6l12 12M18 6L6 18" />,
  nuevo: <path d="M4 4v6h6M20 20v-6h-6M5.6 15A8 8 0 0019 17.4M18.4 9A8 8 0 005 6.6" />,
  chispa: (
    <>
      <path d="M10 3.5l1.7 4.8 4.8 1.7-4.8 1.7L10 16.5l-1.7-4.8L3.5 10l4.8-1.7L10 3.5z" />
      <path d="M18 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" />
    </>
  ),
};
const Icono = ({ d, className = "h-4 w-4" }: { d: React.ReactNode; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const IconoWhatsApp = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 2.5 1 3 .8 3.6.8.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2z" />
  </svg>
);

/* ═════════════════════════════ Componente ═════════════════════════════ */
export function JBAssist() {
  const pathname = usePathname();
  const { status, chat } = useAssistantApi();
  const { esClaro } = useTheme();
  const [activo, setActivo] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [convId, setConvId] = useState("");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const [etiqueta, setEtiqueta] = useState(0);
  const [saludo, setSaludo] = useState(false);
  const [nombre, setNombre] = useState<string | undefined>();
  const [agitar, setAgitar] = useState(false);
  const listaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const oculto = OCULTO_EN.some((r) => r.test(pathname ?? ""));

  // Al cargar: ¿está activo en el servidor? + conversación guardada + nombre del alumno
  useEffect(() => {
    const c = leerConversacion();
    setConvId(c.id);
    setMensajes(c.mensajes);
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      const n = u?.firstName || (u?.email ? String(u.email).split("@")[0] : "");
      if (n) setNombre(String(n).slice(0, 40));
    } catch {}
    status().then((s) => setActivo(!!s?.enabled));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Burbuja de bienvenida una sola vez
  useEffect(() => {
    if (!activo || oculto) return;
    let visto = true;
    try { visto = localStorage.getItem(CLAVE_SALUDO) === "1"; } catch {}
    if (visto) return;
    const t = setTimeout(() => setSaludo(true), 2500);
    return () => clearTimeout(t);
  }, [activo, oculto]);

  const cerrarSaludo = () => {
    setSaludo(false);
    try { localStorage.setItem(CLAVE_SALUDO, "1"); } catch {}
  };

  // Guardar y bajar al último mensaje
  useEffect(() => {
    if (convId) guardarConversacion(convId, mensajes);
    const el = listaRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [mensajes, convId, pensando]);

  // Etiquetas que rotan mientras piensa
  useEffect(() => {
    if (!pensando) { setEtiqueta(0); return; }
    const t = setInterval(() => setEtiqueta((e) => (e + 1) % ETIQUETAS.length), 1300);
    return () => clearInterval(t);
  }, [pensando]);

  // Escape cierra · foco en el campo al abrir
  useEffect(() => {
    if (!abierto) return;
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
  }, [abierto]);

  // Altura automática del campo de texto
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(120, el.scrollHeight)}px`;
  }, [texto]);

  const enviar = useCallback(
    async (contenido?: string) => {
      const msg = (contenido ?? texto).trim();
      if (pensando) return;
      if (!msg) {
        setAgitar(true);
        setTimeout(() => setAgitar(false), 300);
        return;
      }
      setTexto("");
      setMensajes((m) => [...m.map((x) => ({ ...x, nuevo: false })), { id: uid(), role: "user", content: msg }]);
      setPensando(true);
      const inicio = Date.now();
      const r = await chat({ message: msg.slice(0, MAX), conversationId: convId, userName: nombre });
      // Un mínimo de tiempo "pensando" para que la animación se lea
      const espera = 900 - (Date.now() - inicio);
      if (espera > 0) await new Promise((res) => setTimeout(res, espera));
      setPensando(false);
      setMensajes((m) => [
        ...m,
        r.success
          ? { id: uid(), role: "assistant", content: r.reply || "…", nuevo: true }
          : { id: uid(), role: "assistant", content: r.error, error: true },
      ]);
    },
    [texto, pensando, chat, convId, nombre],
  );

  const reintentar = () => {
    const ultimoUsuario = [...mensajes].reverse().find((m) => m.role === "user");
    if (!ultimoUsuario) return;
    setMensajes((m) => m.filter((x) => !x.error && x.id !== ultimoUsuario.id));
    enviar(ultimoUsuario.content);
  };

  const nuevaConversacion = () => {
    const id = uid();
    setConvId(id);
    setMensajes([]);
    setTexto("");
    try { localStorage.removeItem(CLAVE_CONV); } catch {}
    inputRef.current?.focus();
  };

  const enlaceWhatsApp = useMemo(() => {
    const t = `Hola, vengo de la plataforma Bootcamp${nombre ? `, soy ${nombre}` : ""}. Tengo una consulta.`;
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(t)}`;
  }, [nombre]);

  if (!activo || oculto) return null;

  const listo = texto.trim().length > 0 && !pensando;

  return (
    <div className="jb-root keep-theme" data-theme={esClaro ? "light" : "dark"}>
      {/* ── Burbuja de bienvenida ── */}
      {saludo && !abierto && (
        <div className="jb-hello" role="status">
          <button className="jb-hello-x" onClick={cerrarSaludo} aria-label="Cerrar saludo"><Icono d={I.cerrar} className="h-3 w-3" /></button>
          <p><b>¡Hola{nombre ? `, ${nombre}` : ""}! 👋</b></p>
          <p>Soy {ASSISTANT_NAME}. ¿Te ayudo a elegir un curso?</p>
          <button className="jb-hello-cta" onClick={() => { cerrarSaludo(); setAbierto(true); }}>Preguntar ahora</button>
        </div>
      )}

      {/* ── Botón flotante ── */}
      <button
        className="jb-launcher"
        data-open={abierto || undefined}
        onClick={() => { cerrarSaludo(); setAbierto((a) => !a); }}
        aria-label={abierto ? `Cerrar ${ASSISTANT_NAME}` : `Abrir ${ASSISTANT_NAME}`}
        aria-expanded={abierto}
      >
        <span className="jb-launcher-ring" aria-hidden="true" />
        <span className="jb-launcher-core">
          {abierto ? <Icono d={I.cerrar} className="h-6 w-6" /> : <img src={AVATAR} alt="" />}
        </span>
      </button>

      {/* ── Panel ── */}
      <section className="jb-panel" data-open={abierto || undefined} role="dialog" aria-label={ASSISTANT_NAME} aria-hidden={!abierto}>
        <div className="jb-panel-bg" aria-hidden="true" />

        <header className="jb-head">
          <div className="jb-avatar"><img src={AVATAR} alt="" /></div>
          <div className="min-w-0 flex-1">
            <p className="jb-title">{ASSISTANT_NAME} <span className="jb-tag">IA</span></p>
            <p className="jb-sub"><span className="jb-dot" /> En línea · Soluciones Integrales JB</p>
          </div>
          {mensajes.length > 0 && (
            <button className="jb-icon-btn" onClick={nuevaConversacion} title="Nueva conversación" aria-label="Nueva conversación">
              <Icono d={I.nuevo} />
            </button>
          )}
          <button className="jb-icon-btn" onClick={() => setAbierto(false)} title="Cerrar" aria-label="Cerrar">
            <Icono d={I.cerrar} />
          </button>
        </header>

        <div className="jb-body" ref={listaRef}>
          {mensajes.length === 0 && !pensando ? (
            <div className="jb-empty">
              <div className="jb-empty-orb">
                <DotOrb size={150} state="idle" light={esClaro} />
                <img src={AVATAR} alt="" className="jb-empty-cube" />
              </div>
              <h3>Hola{nombre ? `, ${nombre}` : ""} 👋</h3>
              <p>Soy <b>{ASSISTANT_NAME}</b>, el asistente con IA de la plataforma. Pregúntame por cursos, inscripciones, certificados o cualquier duda.</p>
              <div className="jb-chips">
                {SUGERENCIAS.map((s, i) => (
                  <button key={s} className="jb-chip" style={{ animationDelay: `${200 + i * 70}ms` }} onClick={() => enviar(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="jb-thread">
              {mensajes.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="jb-msg jb-msg-user">{m.content}</div>
                ) : (
                  <div key={m.id} className={`jb-msg jb-msg-bot ${m.error ? "jb-msg-error" : ""}`}>
                    <img src={AVATAR} alt="" className="jb-msg-avatar" />
                    <div className="jb-msg-text">
                      <TextoRico texto={m.content} animar={!!m.nuevo} />
                      {m.error && <button className="jb-retry" onClick={reintentar}>Reintentar</button>}
                    </div>
                  </div>
                ),
              )}
              {pensando && (
                <div className="jb-thinking" aria-live="polite">
                  <DotOrb size={44} state="thinking" light={esClaro} />
                  <span key={etiqueta} className="jb-thinking-label">
                    {ETIQUETAS[etiqueta]}<i /><i /><i />
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="jb-foot">
          <form
            className={`jb-input ${agitar ? "jb-shake" : ""}`}
            data-ready={listo || undefined}
            onSubmit={(e) => { e.preventDefault(); enviar(); }}
          >
            <span className="jb-aurora" aria-hidden="true"><i /><i /><i /></span>
            <Icono d={I.chispa} className="jb-spark h-4 w-4 shrink-0" />
            <textarea
              ref={inputRef}
              rows={1}
              value={texto}
              maxLength={MAX}
              placeholder="Pregúntale algo a JB Assist…"
              aria-label={`Mensaje para ${ASSISTANT_NAME}`}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); enviar(); }
              }}
            />
            <button type="submit" className="jb-send" disabled={pensando} aria-label="Enviar">
              <Icono d={I.enviar} className="h-4 w-4" />
            </button>
          </form>
          <div className="jb-foot-row">
            <a href={enlaceWhatsApp} target="_blank" rel="noopener noreferrer" className="jb-wa"><IconoWhatsApp /> Continuar en WhatsApp</a>
            <span>Respuestas generadas con IA</span>
          </div>
        </footer>
      </section>
    </div>
  );
}

export default JBAssist;
