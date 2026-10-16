// src/components/ui/SecureVideoPlayer.tsx
//
// Reproductor propio de Soluciones Integrales JB sobre YouTube.
// - Oculta los controles de YouTube y bloquea todos los clics hacia YouTube
//   (título, logo, "Ver en YouTube", compartir, clic derecho).
// - Recorta visualmente las franjas donde YouTube dibuja título y logo.
// - Muestra portada propia al inicio y al final (donde YouTube pone sus botones
//   y videos recomendados).
// - Controles propios con la paleta de la marca.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LOGO_SRC } from "@/components/ui/BrandLogo";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// ── Carga única de la API de YouTube ────────────────────────────────────────
let apiPromise: Promise<any> | null = null;

function cargarApiYoutube(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    const anterior = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      anterior?.();
      resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiPromise;
}

// ── Utilidades ──────────────────────────────────────────────────────────────
export function extraerIdYoutube(url: string): string | null {
  const patrones = [
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/live\/([\w-]{11})/,
    /[?&]v=([\w-]{11})/,
  ];
  for (const p of patrones) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function formatearTiempo(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos < 0) return "0:00";
  const s = Math.floor(segundos % 60);
  const m = Math.floor((segundos / 60) % 60);
  const h = Math.floor(segundos / 3600);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

const VELOCIDADES = [1, 1.25, 1.5, 2, 0.75];

// ── Íconos ──────────────────────────────────────────────────────────────────
const IconPlay = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);
const IconPause = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
);
const IconBack10 = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v5h5" />
  </svg>
);
const IconFwd10 = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 3v5h-5" />
  </svg>
);
const IconVolumen = ({ muted }: { muted: boolean }) => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
    {muted ? (
      <path strokeLinecap="round" d="M23 9l-6 6M17 9l6 6" />
    ) : (
      <path strokeLinecap="round" d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" />
    )}
  </svg>
);
const IconFullscreen = ({ activo }: { activo: boolean }) => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    {activo ? (
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
    )}
  </svg>
);

// ── Componente público ──────────────────────────────────────────────────────
interface Props {
  url: string;
  title?: string;
  onEnded?: () => void;
  onNext?: () => void;
}

export function SecureVideoPlayer(props: Props) {
  const videoId = extraerIdYoutube(props.url);

  // Si no es YouTube (Vimeo, MP4, etc.) usamos un iframe normal
  if (!videoId) {
    return (
      <div className="keep-theme relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-[rgba(0,192,231,0.15)]">
        <iframe
          src={props.url}
          title={props.title ?? "Video"}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
        />
      </div>
    );
  }

  return <ReproductorYoutube {...props} videoId={videoId} />;
}

// ── Reproductor YouTube con controles propios ───────────────────────────────
function ReproductorYoutube({
  videoId,
  title,
  onEnded,
  onNext,
}: Props & { videoId: string }) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const ocultarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [listo, setListo] = useState(false);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [iniciado, setIniciado] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [actual, setActual] = useState(0);
  const [duracion, setDuracion] = useState(0);
  const [volumen, setVolumen] = useState(100);
  const [silenciado, setSilenciado] = useState(false);
  const [velocidad, setVelocidad] = useState(1);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [mostrarControles, setMostrarControles] = useState(true);
  const [error, setError] = useState(false);

  // Crear el reproductor
  useEffect(() => {
    let cancelado = false;
    setListo(false);
    setIniciado(false);
    setTerminado(false);
    setReproduciendo(false);
    setActual(0);
    setDuracion(0);
    setError(false);

    cargarApiYoutube()
      .then((YT) => {
        if (cancelado || !holderRef.current) return;
        // Elemento propio para que YouTube no choque con React
        const montaje = document.createElement("div");
        holderRef.current.innerHTML = "";
        holderRef.current.appendChild(montaje);

        playerRef.current = new YT.Player(montaje, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            playsinline: 1,
            cc_load_policy: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (e: any) => {
              if (cancelado) return;
              setListo(true);
              setDuracion(e.target.getDuration() || 0);
              setVolumen(e.target.getVolume() ?? 100);
              setSilenciado(e.target.isMuted?.() ?? false);
            },
            onStateChange: (e: any) => {
              const S = window.YT?.PlayerState;
              if (!S) return;
              setCargando(e.data === S.BUFFERING);
              if (e.data === S.PLAYING) {
                setReproduciendo(true);
                setIniciado(true);
                setTerminado(false);
                setDuracion(e.target.getDuration() || 0);
              } else if (e.data === S.PAUSED) {
                setReproduciendo(false);
              } else if (e.data === S.ENDED) {
                setReproduciendo(false);
                setTerminado(true);
                onEnded?.();
              }
            },
            onError: () => setError(true),
          },
        });
      })
      .catch(() => setError(true));

    return () => {
      cancelado = true;
      try {
        playerRef.current?.destroy?.();
      } catch {}
      playerRef.current = null;
      if (holderRef.current) holderRef.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Actualizar el tiempo mientras reproduce
  useEffect(() => {
    if (!reproduciendo) return;
    const id = setInterval(() => {
      const t = playerRef.current?.getCurrentTime?.();
      if (typeof t === "number") setActual(t);
    }, 250);
    return () => clearInterval(id);
  }, [reproduciendo]);

  // Detectar entrada/salida de pantalla completa
  useEffect(() => {
    const alCambiar = () =>
      setPantallaCompleta(document.fullscreenElement === contenedorRef.current);
    document.addEventListener("fullscreenchange", alCambiar);
    return () => document.removeEventListener("fullscreenchange", alCambiar);
  }, []);

  // ── Acciones ──────────────────────────────────────────────────────────────
  const alternarReproduccion = useCallback(() => {
    const p = playerRef.current;
    if (!p || !listo) return;
    if (terminado) {
      p.seekTo(0, true);
      p.playVideo();
      return;
    }
    if (reproduciendo) p.pauseVideo();
    else p.playVideo();
  }, [listo, reproduciendo, terminado]);

  const saltar = (segundos: number) => {
    const p = playerRef.current;
    if (!p) return;
    const destino = Math.min(Math.max((p.getCurrentTime?.() ?? 0) + segundos, 0), duracion || 0);
    p.seekTo(destino, true);
    setActual(destino);
  };

  const buscar = (valor: number) => {
    playerRef.current?.seekTo(valor, true);
    setActual(valor);
  };

  const alternarSilencio = () => {
    const p = playerRef.current;
    if (!p) return;
    if (silenciado) {
      p.unMute();
      if (volumen === 0) {
        p.setVolume(50);
        setVolumen(50);
      }
      setSilenciado(false);
    } else {
      p.mute();
      setSilenciado(true);
    }
  };

  const cambiarVolumen = (v: number) => {
    const p = playerRef.current;
    if (!p) return;
    p.setVolume(v);
    setVolumen(v);
    if (v === 0) {
      p.mute();
      setSilenciado(true);
    } else if (silenciado) {
      p.unMute();
      setSilenciado(false);
    }
  };

  const cambiarVelocidad = () => {
    const siguiente = VELOCIDADES[(VELOCIDADES.indexOf(velocidad) + 1) % VELOCIDADES.length];
    playerRef.current?.setPlaybackRate?.(siguiente);
    setVelocidad(siguiente);
  };

  const alternarPantallaCompleta = () => {
    const el = contenedorRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
  };

  const alMoverMouse = () => {
    setMostrarControles(true);
    if (ocultarTimer.current) clearTimeout(ocultarTimer.current);
    ocultarTimer.current = setTimeout(() => setMostrarControles(false), 2500);
  };

  const alPresionarTecla = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case " ":
      case "k":
        e.preventDefault();
        alternarReproduccion();
        break;
      case "ArrowRight":
        e.preventDefault();
        saltar(5);
        break;
      case "ArrowLeft":
        e.preventDefault();
        saltar(-5);
        break;
      case "f":
        alternarPantallaCompleta();
        break;
      case "m":
        alternarSilencio();
        break;
    }
  };

  const progreso = duracion > 0 ? (actual / duracion) * 100 : 0;
  const controlesVisibles = !reproduciendo || mostrarControles;
  const miniatura = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={contenedorRef}
      tabIndex={0}
      onKeyDown={alPresionarTecla}
      onMouseMove={alMoverMouse}
      onMouseLeave={() => reproduciendo && setMostrarControles(false)}
      onContextMenu={(e) => e.preventDefault()}
      className={`keep-theme relative w-full bg-black overflow-hidden select-none outline-none ${
        pantallaCompleta
          ? "h-screen"
          : "aspect-video rounded-2xl border border-[rgba(0,192,231,0.15)]"
      } ${controlesVisibles ? "cursor-default" : "cursor-none"}`}
    >
      {/* Iframe de YouTube: sin clics y recortado arriba/abajo
          (ahí YouTube dibuja el título y el logo) */}
      <div
        ref={holderRef}
        aria-hidden
        className="absolute left-0 w-full pointer-events-none"
        style={{ top: "-64px", height: "calc(100% + 128px)" }}
      />

      {/* Capa que recibe todos los clics (bloquea YouTube) */}
      <div className="absolute inset-0 z-10" onClick={alternarReproduccion} onDoubleClick={alternarPantallaCompleta} />

      {/* Marca de agua */}
      <div className="absolute top-3 left-4 z-20 pointer-events-none">
        <img src={LOGO_SRC} alt="" draggable={false} className="w-28 sm:w-36 h-auto opacity-70 drop-shadow" />
      </div>

      {/* Cargando */}
      {cargando && iniciado && !terminado && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="spinner-cyan" />
        </div>
      )}

      {/* Pausa: velo que también tapa los "más videos" de YouTube */}
      {iniciado && !reproduciendo && !terminado && (
        <div className="absolute inset-0 z-20 bg-black/55 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-[#E31E24] flex items-center justify-center text-white shadow-lg">
            <IconPlay className="w-8 h-8 ml-1" />
          </div>
        </div>
      )}

      {/* Portada inicial */}
      {!iniciado && (
        <div className="absolute inset-0 z-30">
          <img src={miniatura} alt="" className="w-full h-full object-cover" draggable={false} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <img src={LOGO_SRC} alt="Soluciones Integrales JB" draggable={false} className="w-44 sm:w-60 h-auto mb-1" />
            {error ? (
              <p className="text-gray-300 text-sm">No se pudo cargar el video. Revisa el enlace de la lección.</p>
            ) : (
              <>
                <button
                  onClick={alternarReproduccion}
                  disabled={!listo}
                  aria-label="Reproducir"
                  className="w-20 h-20 rounded-full bg-[#E31E24] text-white flex items-center justify-center shadow-[0_0_40px_rgba(231,30,36,0.5)] hover:scale-105 transition-transform disabled:opacity-60"
                >
                  {listo ? <IconPlay className="w-10 h-10 ml-1" /> : <div className="spinner-cyan" />}
                </button>
                {title && (
                  <p className="font-brand text-[#00C0E7] text-lg sm:text-xl uppercase tracking-wide line-clamp-2 max-w-xl">
                    {title}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Pantalla final (tapa los videos recomendados de YouTube) */}
      {terminado && (
        <div className="absolute inset-0 z-30 bg-[#0d0d0d]/95 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <img src={LOGO_SRC} alt="" draggable={false} className="w-40 sm:w-52 h-auto mb-2" />
          <p className="font-brand text-[#00C0E7] text-xl uppercase tracking-wide">Lección terminada</p>
          <div className="h-[2px] w-12 bg-[#E31E24] rounded" />
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            <button onClick={alternarReproduccion} className="btn-cyan text-sm py-2">
              ↺ Ver de nuevo
            </button>
            {onNext && (
              <button onClick={onNext} className="btn-red text-sm py-2">
                Siguiente lección →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Barra de controles */}
      {iniciado && !terminado && (
        <div
          className={`absolute bottom-0 inset-x-0 z-40 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-10 px-4 pb-3 transition-opacity duration-300 ${
            controlesVisibles ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Barra de avance */}
          <div className="relative h-1.5 group/barra mb-3">
            <div className="absolute inset-0 rounded-full bg-white/20" />
            <div className="absolute inset-y-0 left-0 rounded-full bg-[#00C0E7]" style={{ width: `${progreso}%` }} />
            <input
              type="range"
              min={0}
              max={duracion || 0}
              step={0.1}
              value={actual}
              onChange={(e) => buscar(Number(e.target.value))}
              aria-label="Avance del video"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#00C0E7] shadow pointer-events-none"
              style={{ left: `${progreso}%` }}
            />
          </div>

          <div className="flex items-center gap-3 text-white">
            <button onClick={alternarReproduccion} aria-label={reproduciendo ? "Pausar" : "Reproducir"} className="hover:text-[#00C0E7] transition-colors">
              {reproduciendo ? <IconPause /> : <IconPlay />}
            </button>
            <button onClick={() => saltar(-10)} aria-label="Retroceder 10 segundos" className="hover:text-[#00C0E7] transition-colors">
              <IconBack10 />
            </button>
            <button onClick={() => saltar(10)} aria-label="Adelantar 10 segundos" className="hover:text-[#00C0E7] transition-colors">
              <IconFwd10 />
            </button>

            {/* Volumen */}
            <div className="flex items-center gap-2 group/vol">
              <button onClick={alternarSilencio} aria-label="Silenciar" className="hover:text-[#00C0E7] transition-colors">
                <IconVolumen muted={silenciado || volumen === 0} />
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={silenciado ? 0 : volumen}
                onChange={(e) => cambiarVolumen(Number(e.target.value))}
                aria-label="Volumen"
                className="w-0 group-hover/vol:w-20 transition-all duration-200 accent-[#00C0E7] cursor-pointer"
              />
            </div>

            <span className="text-xs text-gray-300 tabular-nums">
              {formatearTiempo(actual)} / {formatearTiempo(duracion)}
            </span>

            <div className="flex-1" />

            <button
              onClick={cambiarVelocidad}
              aria-label="Velocidad de reproducción"
              className="text-xs font-bold px-2 py-0.5 rounded border border-white/30 hover:border-[#00C0E7] hover:text-[#00C0E7] transition-colors tabular-nums"
            >
              {velocidad}x
            </button>
            <button onClick={alternarPantallaCompleta} aria-label="Pantalla completa" className="hover:text-[#00C0E7] transition-colors">
              <IconFullscreen activo={pantallaCompleta} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
