// src/assistant/engine/texto.ts
// Herramientas de lenguaje del chatbot (sin IA): normalizar, separar palabras,
// tolerar errores de tipeo y medir qué tan parecida es una frase a otra.

const VACIAS = new Set(
  (
    'a al algo algun alguna alguno ante como con contra cual cuales cuando de del desde donde e el ella ' +
    'ellas ellos en entre era es esa ese eso esta este esto estoy fue ha hay la las le les lo los me mi mis ' +
    'muy ni no nos o os para pero por porque que quien se ser si sin sobre su sus te ti tu tus un una uno ' +
    'unos unas y ya yo hola buenas buenos dias tardes noches porfa favor gracias puedo quisiera quiero ' +
    'necesito saber hacer tengo tiene tienen podria podrias puedes ustedes usted vez solo tambien bueno ok'
  ).split(' '),
);

/** minúsculas, sin tildes, sin signos */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Raíz sencilla: quita plurales y algunas terminaciones frecuentes */
export function raiz(p: string): string {
  if (p.length <= 4) return p;
  return p
    .replace(/(aciones|acion)$/, 'ac')
    .replace(/(mente)$/, '')
    .replace(/(es|s)$/, '')
    .replace(/(ado|ada|ido|ida|ando|iendo|ar|er|ir)$/, '');
}

/** Palabras con significado (sin palabras vacías), ya reducidas a su raíz */
export function palabras(texto: string, conVacias = false): string[] {
  return normalizar(texto)
    .split(' ')
    .filter((p) => p && (conVacias || !VACIAS.has(p)))
    .map(raiz)
    .filter((p) => p.length > 1 || /\d/.test(p));
}

/** Distancia de edición (Levenshtein) con corte temprano */
export function distancia(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let minFila = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < minFila) minFila = cur[j];
    }
    if (minFila > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** ¿Dos palabras son "la misma" aunque tengan un error de tipeo? */
export function parecidas(a: string, b: string): boolean {
  if (a === b) return true;
  const largo = Math.min(a.length, b.length);
  if (largo < 5) return false; // en palabras cortas un error cambia el sentido (hago / pago)
  if (largo >= 6 && (a.startsWith(b) || b.startsWith(a))) return true;
  return distancia(a, b, largo >= 8 ? 2 : 1) <= (largo >= 8 ? 2 : 1);
}

/**
 * Parecido entre el mensaje y una frase de ejemplo (0 a 1).
 * Mide cuántas palabras del ejemplo aparecen en el mensaje y castiga un poco
 * los mensajes muy largos que solo coinciden en una palabra.
 */
/** Cuántas palabras del ejemplo aparecen en el mensaje */
export function coincidencias(mensaje: string[], ejemplo: string[]): number {
  return ejemplo.filter((e) => mensaje.some((m) => parecidas(m, e))).length;
}

export function parecido(mensaje: string[], ejemplo: string[]): number {
  if (!mensaje.length || !ejemplo.length) return 0;
  let encontradas = 0;
  for (const e of ejemplo) if (mensaje.some((m) => parecidas(m, e))) encontradas++;
  const cobertura = encontradas / ejemplo.length;
  const precision = encontradas / mensaje.length;
  return 0.75 * cobertura + 0.25 * Math.min(1, precision * 1.5);
}

/** ¿El mensaje contiene esta palabra clave (tolerando errores)? */
export function contiene(mensaje: string[], clave: string): boolean {
  const c = palabras(clave, true);
  if (!c.length) return false;
  return c.every((x) => mensaje.some((m) => parecidas(m, x)));
}
