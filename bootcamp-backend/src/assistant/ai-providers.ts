// src/assistant/ai-providers.ts
// Conexión con las IAs gratuitas. Gemini es la principal y Groq el respaldo.
// Se usa fetch directo (Node 18+): no hace falta instalar ninguna librería.

export interface Turno {
  role: 'user' | 'assistant';
  content: string;
}

/** Error de la IA con su código HTTP (503 = saturada, 429 = cuota, etc.) */
export class ErrorIA extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
  /** Vale la pena reintentar o probar otro modelo */
  get temporal() {
    return [408, 429, 500, 502, 503, 504].includes(this.status) || this.status === 0;
  }
}

export interface RespuestaIA {
  text: string;
  provider: 'gemini' | 'groq';
}

const TIEMPO_MAXIMO = 25_000; // ms

export async function preguntarGemini(
  apiKey: string,
  model: string,
  system: string,
  turnos: Turno[],
): Promise<RespuestaIA> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    signal: AbortSignal.timeout(TIEMPO_MAXIMO),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: turnos.map((t) => ({
        role: t.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: t.content }],
      })),
      generationConfig: { temperature: 0.6, maxOutputTokens: 700 },
    }),
  });
  if (!res.ok) {
    const detalle = await res.text().catch(() => '');
    throw new ErrorIA(res.status, `Gemini (${model}) ${res.status}: ${detalle.slice(0, 300)}`);
  }
  const data: any = await res.json();
  const text = (data?.candidates?.[0]?.content?.parts ?? [])
    .map((p: any) => p?.text ?? '')
    .join('')
    .trim();
  if (!text) throw new Error('Gemini respondió vacío');
  return { text, provider: 'gemini' };
}

export async function preguntarGroq(
  apiKey: string,
  model: string,
  system: string,
  turnos: Turno[],
): Promise<RespuestaIA> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(TIEMPO_MAXIMO),
    body: JSON.stringify({
      model,
      temperature: 0.6,
      max_tokens: 700,
      messages: [{ role: 'system', content: system }, ...turnos],
    }),
  });
  if (!res.ok) {
    const detalle = await res.text().catch(() => '');
    throw new ErrorIA(res.status, `Groq ${res.status}: ${detalle.slice(0, 300)}`);
  }
  const data: any = await res.json();
  const text = String(data?.choices?.[0]?.message?.content ?? '').trim();
  if (!text) throw new Error('Groq respondió vacío');
  return { text, provider: 'groq' };
}
