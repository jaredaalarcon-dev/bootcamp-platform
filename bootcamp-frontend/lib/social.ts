// src/lib/social.ts
// Redes sociales y contacto oficiales de Soluciones Integrales JB.
// Si cambia algún enlace, se edita solo aquí.

export type RedSocial =
  | "facebook" | "instagram" | "youtube" | "linkedin"
  | "tiktok" | "whatsapp" | "github" | "email";

export interface Enlace {
  red: RedSocial;
  nombre: string;
  usuario: string;
  url: string;
  /** Color oficial de la red (para el ícono) */
  color: string;
}

export const WHATSAPP_NUMERO = "51926392858";
export const CORREO = "consultas@solucionesintegralesjb.com";

export const REDES: Enlace[] = [
  { red: "facebook",  nombre: "Facebook",  usuario: "solucionesintegralesJB", url: "https://www.facebook.com/solucionesintegralesJB/", color: "#1877F2" },
  { red: "instagram", nombre: "Instagram", usuario: "@solucionesintegralesjb", url: "https://www.instagram.com/solucionesintegralesjb/", color: "#E4405F" },
  { red: "youtube",   nombre: "YouTube",   usuario: "Soluciones Integrales JB", url: "https://www.youtube.com/channel/UCwZllsxQMp2LwUSIDmldUeQ", color: "#FF0000" },
  { red: "linkedin",  nombre: "LinkedIn",  usuario: "soluciones-integrales-jb", url: "https://www.linkedin.com/company/soluciones-integrales-jb/", color: "#0A66C2" },
  { red: "tiktok",    nombre: "TikTok",    usuario: "@solucionesintegralesjb", url: "https://www.tiktok.com/@solucionesintegralesjb?lang=es", color: "#111111" },
  { red: "whatsapp",  nombre: "WhatsApp",  usuario: "+51 926 392 858", url: `https://api.whatsapp.com/send/?phone=${WHATSAPP_NUMERO}&type=phone_number&app_absent=0`, color: "#25D366" },
  { red: "github",    nombre: "GitHub",    usuario: "SolucionesIntegralesJB", url: "https://github.com/SolucionesIntegralesJB", color: "#24292F" },
  { red: "email",     nombre: "Correo",    usuario: CORREO, url: `mailto:${CORREO}`, color: "#E31E24" },
];

export const URL_FACEBOOK = REDES[0].url;
export const USUARIO_TIKTOK = "solucionesintegralesjb";
