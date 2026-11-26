// src/components/landing/Cubo3D.tsx
// El cubo 3D original de Soluciones Integrales JB (el mismo modelo de su web).
// Se gira arrastrando con el mouse o con el dedo, tiene inercia y gira solo.
// three.js se carga aparte (solo en esta página) y el dibujo se pausa cuando
// el cubo no está en pantalla o la pestaña está oculta, para cuidar la batería.
"use client";

import { useEffect, useRef, useState } from "react";

const MODELO = "/models/cubo-sijb.glb";

export function Cubo3D({ className = "" }: { className?: string }) {
  const caja = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "sin3d">("cargando");

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    let cancelado = false;
    let limpiar = () => {};

    (async () => {
      // ¿El navegador puede dibujar 3D?
      try {
        const prueba = document.createElement("canvas");
        if (!(prueba.getContext("webgl2") || prueba.getContext("webgl"))) throw new Error("sin webgl");
      } catch {
        setEstado("sin3d");
        return;
      }

      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      if (cancelado) return;

      const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.domElement.style.cssText = "width:100%;height:100%;display:block;touch-action:pan-y;cursor:grab";
      renderer.domElement.setAttribute("aria-hidden", "true");
      el.appendChild(renderer.domElement);

      const escena = new THREE.Scene();
      const camara = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camara.position.set(0, 1.7, 8.2);
      camara.lookAt(0, 0, 0);

      escena.add(new THREE.AmbientLight(0xffffff, 0.55 * Math.PI));
      const luz = new THREE.DirectionalLight(0xffffff, 1.1 * Math.PI);
      luz.position.set(4, 6, 5);
      escena.add(luz);
      const luzCian = new THREE.PointLight(0x00c0e7, 18, 12);
      luzCian.position.set(-3.5, -1, 3);
      escena.add(luzCian);
      const luzRoja = new THREE.PointLight(0xe31e24, 10, 10);
      luzRoja.position.set(3.5, -2, -2);
      escena.add(luzRoja);

      // Pivote: el arrastre gira el pivote; "flota" mueve el grupo arriba/abajo
      const pivote = new THREE.Group();
      const flota = new THREE.Group();
      pivote.add(flota);
      escena.add(pivote);
      pivote.rotation.set(0.42, -0.65, 0);

      const gltf = await new GLTFLoader().loadAsync(MODELO).catch(() => null);
      if (cancelado) { renderer.dispose(); return; }
      if (!gltf) { setEstado("sin3d"); renderer.domElement.remove(); renderer.dispose(); return; }
      const modelo = gltf.scene;
      const cajaModelo = new THREE.Box3().setFromObject(modelo);
      modelo.position.sub(cajaModelo.getCenter(new THREE.Vector3()));
      const tam = cajaModelo.getSize(new THREE.Vector3());
      flota.scale.setScalar(2.6 / Math.max(tam.x, tam.y, tam.z));
      flota.add(modelo);
      setEstado("listo");

      // ── Arrastrar para girar (mouse y dedo) con inercia ─────────────────
      let arrastrando = false;
      let ultX = 0, ultY = 0, velX = 0, velY = 0;
      const auto = reducir ? 0 : 0.0045;
      const cv = renderer.domElement;
      const abajo = (e: PointerEvent) => {
        arrastrando = true; ultX = e.clientX; ultY = e.clientY;
        cv.setPointerCapture(e.pointerId); cv.style.cursor = "grabbing";
      };
      const mover = (e: PointerEvent) => {
        if (!arrastrando) return;
        const dx = e.clientX - ultX, dy = e.clientY - ultY;
        ultX = e.clientX; ultY = e.clientY;
        velY = dx * 0.0065;
        // En celular el gesto vertical es para desplazar la página
        velX = e.pointerType === "touch" ? 0 : dy * 0.0065;
        pivote.rotation.y += velY;
        pivote.rotation.x = Math.max(-1.1, Math.min(1.1, pivote.rotation.x + velX));
      };
      const arriba = (e: PointerEvent) => {
        arrastrando = false; cv.style.cursor = "grab";
        try { cv.releasePointerCapture(e.pointerId); } catch {}
      };
      cv.addEventListener("pointerdown", abajo);
      cv.addEventListener("pointermove", mover);
      cv.addEventListener("pointerup", arriba);
      cv.addEventListener("pointercancel", arriba);

      // ── Tamaño ───────────────────────────────────────────────────────────
      const ajustar = () => {
        const { width, height } = el.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camara.aspect = width / height;
        camara.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(ajustar);
      ro.observe(el);
      ajustar();

      // ── Dibujar solo cuando se ve ────────────────────────────────────────
      let visible = true;
      const io = new IntersectionObserver(([entrada]) => { visible = entrada.isIntersecting; });
      io.observe(el);
      let raf = 0;
      const t0 = performance.now();
      const cuadro = (t: number) => {
        raf = requestAnimationFrame(cuadro);
        if (!visible || document.hidden) return;
        if (!arrastrando) {
          velY *= 0.94; velX *= 0.9;
          pivote.rotation.y += velY + auto;
          pivote.rotation.x = Math.max(-1.1, Math.min(1.1, pivote.rotation.x + velX));
          // vuelve suave a su inclinación natural
          pivote.rotation.x += (0.42 - pivote.rotation.x) * 0.012;
        }
        if (!reducir) flota.position.y = Math.sin((t - t0) / 900) * 0.12;
        renderer.render(escena, camara);
      };
      raf = requestAnimationFrame(cuadro);

      limpiar = () => {
        cancelAnimationFrame(raf);
        ro.disconnect(); io.disconnect();
        cv.removeEventListener("pointerdown", abajo);
        cv.removeEventListener("pointermove", mover);
        cv.removeEventListener("pointerup", arriba);
        cv.removeEventListener("pointercancel", arriba);
        escena.traverse((o) => {
          const m = o as unknown as { geometry?: { dispose: () => void }; material?: { dispose: () => void } | { dispose: () => void }[] };
          m.geometry?.dispose();
          if (Array.isArray(m.material)) m.material.forEach((x) => x.dispose()); else m.material?.dispose();
        });
        renderer.dispose();
        cv.remove();
      };
    })();

    return () => { cancelado = true; limpiar(); };
  }, []);

  return (
    // Debe tener posición (absolute o relative) para que el lienzo ocupe todo su tamaño
    <div className={className || "relative h-full w-full"}>
      <div ref={caja} className="absolute inset-0" />
      {estado !== "listo" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/icono-sijb.png" alt="" className={`w-[42%] max-w-[220px] ${estado === "cargando" ? "animate-pulse opacity-70" : "lp-flota"}`} />
        </div>
      )}
    </div>
  );
}
