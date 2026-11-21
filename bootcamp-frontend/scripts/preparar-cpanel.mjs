// scripts/preparar-cpanel.mjs
// Después de "next build" en modo standalone, junta en una sola carpeta todo
// lo que necesita el servidor de cPanel: deploy-cpanel/
//   server.js (archivo de inicio) + .next/ + public/ + node_modules mínimos
import { cpSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const raiz = process.cwd();

// 1. Compilar en modo standalone (funciona igual en Windows, Mac y Linux)
if (process.argv.includes("--compilar")) {
  const r = spawnSync("npx", ["next", "build"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, BUILD_STANDALONE: "1" },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const standalone = join(raiz, ".next", "standalone");
const destino = join(raiz, "deploy-cpanel");

if (!existsSync(join(standalone, "server.js"))) {
  console.error("✖ No se generó .next/standalone/server.js. Revisa los errores de compilación de arriba.");
  process.exit(1);
}

rmSync(destino, { recursive: true, force: true });
cpSync(standalone, destino, { recursive: true });
cpSync(join(raiz, ".next", "static"), join(destino, ".next", "static"), { recursive: true });
if (existsSync(join(raiz, "public"))) cpSync(join(raiz, "public"), join(destino, "public"), { recursive: true });

writeFileSync(
  join(destino, "LEEME-CPANEL.txt"),
  [
    "Frontend de SIJB Bootcamp listo para cPanel (Setup Node.js App).",
    "",
    "1. Sube el CONTENIDO de esta carpeta a la carpeta de tu aplicación en el servidor.",
    "2. En cPanel → Setup Node.js App:",
    "   - Node.js version: 20 o superior",
    "   - Application startup file: server.js",
    "   - Variables: NODE_ENV=production",
    "3. Pulsa Restart.",
    "",
    "Las variables NEXT_PUBLIC_* (URL del backend y del sitio) quedan grabadas al compilar:",
    "si cambian, vuelve a ejecutar npm run build:cpanel en tu PC con los valores nuevos.",
  ].join("\n"),
);
console.log("✔ Listo: carpeta deploy-cpanel/ (súbela a cPanel; ver LEEME-CPANEL.txt)");
