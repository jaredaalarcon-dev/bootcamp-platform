// src/assistant/engine/motor.ts
// Motor de comprensión del chatbot (sin IA). Decide, para cada mensaje:
//   1) si es una pregunta frecuente creada por el admin,
//   2) si es uno de los temas fijos (intenciones),
//   3) si pregunta por un curso concreto,
//   4) o si no está seguro (ofrece opciones) / no sabe (pasa a la IA).
import { Accion, Contexto, CursoInfo, INTENCIONES, Intencion } from './intenciones';
import { coincidencias, contiene, palabras, parecidas, parecido } from './texto';

export interface FaqMotor {
  id: string;
  pregunta: string;
  variantes: string[];
  respuesta: string;
}

export type Deteccion =
  | { tipo: 'intencion'; intencion: Intencion; puntaje: number }
  | { tipo: 'faq'; faq: FaqMotor; puntaje: number }
  | { tipo: 'curso'; curso: CursoInfo; puntaje: number }
  | { tipo: 'dudoso'; opciones: { id: string; titulo: string }[]; puntaje: number }
  | { tipo: 'nada'; puntaje: number };

export const UMBRAL_SEGURO = 0.62;
export const UMBRAL_DUDOSO = 0.42;

// Palabras de los títulos de cursos que no sirven para distinguir uno de otro
const GENERICAS = new Set(
  palabras(
    'curso cursos desarrollo web con de desde cero para e y en la el introduccion fundamentos ' +
      'avanzado basico intermedio programacion aplicaciones aplicacion proceso procesos datos ' +
      'completo practico profesional taller bootcamp nivel',
    true,
  ),
);

// Ejemplos ya procesados (se calculan una sola vez). Los saludos ("hola",
// "buenas") solo tienen palabras vacías: esos se comparan con el mensaje completo.
const EJEMPLOS = INTENCIONES.map((intencion) => ({
  intencion,
  ejemplos: intencion.ejemplos.map((e) => {
    const sinVacias = palabras(e);
    return sinVacias.length ? { tokens: sinVacias, completo: false } : { tokens: palabras(e, true), completo: true };
  }),
}));

function puntajeIntencion(msg: string[], msgCompleto: string[], i: (typeof EJEMPLOS)[number]) {
  let mejor = 0;
  let orden = 0; // desempate: gana el ejemplo que coincide en más palabras
  for (const ej of i.ejemplos) {
    const base = ej.completo || !msg.length ? msgCompleto : msg;
    const p = parecido(base, ej.tokens);
    const o = p + 0.04 * coincidencias(base, ej.tokens);
    if (p > mejor) mejor = p;
    if (o > orden) orden = o;
  }
  // Charla: solo si el mensaje es corto (un "hola, ¿cuánto cuesta?" no es solo un saludo)
  const factor = i.intencion.categoria === 'charla' && msgCompleto.length > 4 ? 0.6 : 1;
  const conClave = (i.intencion.claves ?? []).some((c) => contiene(msgCompleto, c));
  const bono = conClave ? 0.15 : 0;
  // Para ordenar pesa más la frase parecida que la palabra clave suelta
  return { p: Math.min(1, mejor * factor + bono), orden: orden * factor + (conClave ? 0.03 : 0) };
}

function puntajeFaq(msg: string[], faq: FaqMotor) {
  let mejor = 0;
  for (const frase of [faq.pregunta, ...faq.variantes]) {
    const ej = palabras(frase);
    if (!ej.length) continue;
    const p = parecido(msg, ej);
    if (p > mejor) mejor = p;
  }
  return mejor;
}

// Palabras normales al preguntar por un curso ("¿de qué trata?", "¿cuánto dura?")
const SOBRE_CURSO = new Set(
  palabras(
    'trata tratan info informacion curso cursos tienen tiene hay sobre dura duracion temario contenido ' +
      'detalle detalles ensenan ensena aprendo aprender cuesta precio modulos lecciones dictan llevar tomar estudiar ' +
      'quiero interesa interesado ver',
    true,
  ),
);

function puntajeCurso(msg: string[], msgCompleto: string[], curso: CursoInfo) {
  const distintivas = palabras(curso.titulo, true).filter((p) => p.length >= 3 && !GENERICAS.has(p));
  if (!distintivas.length) return 0;
  const hallazgos = distintivas.filter((d) => msgCompleto.some((m) => parecidas(m, d))).length;
  if (!hallazgos) return 0;
  // "¿cómo hago un for en Python?" no pregunta por el curso: es una duda técnica (para la IA)
  const resto = msg.filter((m) => !distintivas.some((d) => parecidas(m, d)) && !SOBRE_CURSO.has(m));
  if (resto.length >= 2) return 0;
  return Math.min(1, 0.7 + 0.1 * (hallazgos - 1));
}

export function detectar(texto: string, faqs: FaqMotor[], cursos: CursoInfo[]): Deteccion {
  const msg = palabras(texto);
  const msgCompleto = palabras(texto, true);
  if (!msgCompleto.length) return { tipo: 'nada', puntaje: 0 };

  // Mensajes muy largos suelen ser preguntas complejas: solo se aceptan coincidencias muy claras
  const exigencia = msg.length > 22 ? 0.78 : UMBRAL_SEGURO;

  const intenciones = EJEMPLOS.map((i) => ({ i: i.intencion, ...puntajeIntencion(msg, msgCompleto, i) })).sort(
    (a, b) => b.orden - a.orden,
  );
  const preguntas = faqs.map((f) => ({ f, p: puntajeFaq(msg.length ? msg : msgCompleto, f) })).sort((a, b) => b.p - a.p);
  const enCursos = cursos.map((c) => ({ c, p: puntajeCurso(msg, msgCompleto, c) })).sort((a, b) => b.p - a.p);

  const mejorI = intenciones[0];
  const mejorF = preguntas[0];
  const mejorC = enCursos[0];

  // 1) Preguntas frecuentes del admin (tienen prioridad en empate)
  if (mejorF && mejorF.p >= exigencia && mejorF.p + 0.05 >= (mejorI?.p ?? 0)) {
    return { tipo: 'faq', faq: mejorF.f, puntaje: mejorF.p };
  }

  // 2) Un curso concreto ("¿de qué trata Laravel?"), salvo que el tema sea otro muy claro
  const temaFuerte = mejorI && mejorI.p >= 0.8 && !['cursos_lista', 'saludo', 'requisitos', 'modalidad', 'material'].includes(mejorI.i.id);
  if (mejorC && mejorC.p > 0 && !temaFuerte) {
    return { tipo: 'curso', curso: mejorC.c, puntaje: mejorC.p };
  }

  // 3) Temas fijos
  if (mejorI && mejorI.p >= exigencia) {
    return { tipo: 'intencion', intencion: mejorI.i, puntaje: mejorI.p };
  }

  // 4) No está seguro: ofrece los temas más parecidos
  const cercanas = [
    ...intenciones.filter((x) => x.p >= UMBRAL_DUDOSO && x.i.categoria !== 'charla').map((x) => ({ id: x.i.id, titulo: x.i.titulo, p: x.p })),
    ...preguntas.filter((x) => x.p >= UMBRAL_DUDOSO).map((x) => ({ id: `faq:${x.f.id}`, titulo: x.f.pregunta, p: x.p })),
  ]
    .sort((a, b) => b.p - a.p)
    .slice(0, 3);
  if (cercanas.length) {
    return { tipo: 'dudoso', opciones: cercanas.map(({ id, titulo }) => ({ id, titulo })), puntaje: cercanas[0].p };
  }
  return { tipo: 'nada', puntaje: Math.max(mejorI?.p ?? 0, mejorF?.p ?? 0) };
}

export function resolverAcciones(i: Intencion, ctx: Contexto): Accion[] {
  if (!i.acciones) return [];
  return typeof i.acciones === 'function' ? i.acciones(ctx) : i.acciones;
}

export function resolverRespuesta(i: Intencion, ctx: Contexto): string {
  return typeof i.respuesta === 'function' ? i.respuesta(ctx) : i.respuesta;
}

export function respuestaCurso(c: CursoInfo): { texto: string; acciones: Accion[] } {
  const desc = c.descripcion.replace(/\s+/g, ' ').trim();
  const corta = desc.length > 260 ? `${desc.slice(0, 257).trimEnd()}…` : desc;
  const partes = [
    `**${c.titulo}**${c.categoria ? ` · ${c.categoria}` : ''}`,
    corta,
    c.lecciones ? `Tiene ${c.modulos} módulo${c.modulos === 1 ? '' : 's'} y ${c.lecciones} lecciones en video, a tu ritmo.` : '',
  ].filter(Boolean);
  return {
    texto: partes.join('\n\n'),
    acciones: [
      { tipo: 'enlace', etiqueta: 'Ver el curso', url: `/courses/${c.id}` },
      { tipo: 'respuesta', etiqueta: '¿Cómo me inscribo?', intent: 'inscripcion' },
      { tipo: 'respuesta', etiqueta: '¿Dan certificado?', intent: 'certificado_vs_constancia' },
    ],
  };
}

export function buscarIntencion(id: string) {
  return INTENCIONES.find((i) => i.id === id);
}
