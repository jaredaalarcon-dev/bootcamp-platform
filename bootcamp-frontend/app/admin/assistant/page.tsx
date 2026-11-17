// src/app/admin/assistant/page.tsx
// Panel de JB Assist: cuánto resuelve sin IA, preguntas frecuentes editables,
// prueba del chatbot, configuración y conversaciones.
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  assistantAdminApi,
  AssistantFaq,
  AssistantSettings,
  AssistantStats,
  Accion,
} from "@/hooks/useAssistantApi";

type Tab = "resumen" | "faqs" | "probar" | "config" | "conversaciones";

const PROVEEDORES: Record<string, { label: string; color: string }> = {
  bot: { label: "Temas fijos", color: "#00C0E7" },
  faq: { label: "Preguntas frecuentes", color: "#0093B5" },
  curso: { label: "Info. de cursos", color: "#5FD4EE" },
  cache: { label: "IA (respuesta guardada)", color: "#94a3b8" },
  gemini: { label: "IA · Gemini", color: "#E31E24" },
  groq: { label: "IA · Groq", color: "#f87171" },
  fallback: { label: "Sin respuesta", color: "#64748b" },
};

const card = "bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl";
const fecha = (d: string) =>
  new Date(d).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const vacia = { question: "", variants: "", answer: "", active: true };

export default function AdminAssistantPage() {
  const [tab, setTab] = useState<Tab>("resumen");
  const [dias, setDias] = useState(30);
  const [stats, setStats] = useState<AssistantStats | null>(null);
  const [faqs, setFaqs] = useState<AssistantFaq[]>([]);
  const [editando, setEditando] = useState<(typeof vacia & { id?: string }) | null>(null);
  const [ajustes, setAjustes] = useState<AssistantSettings | null>(null);
  const [prueba, setPrueba] = useState("");
  const [resultado, setResultado] = useState<Awaited<ReturnType<typeof assistantAdminApi.test>> | null>(null);
  const [convs, setConvs] = useState<Awaited<ReturnType<typeof assistantAdminApi.conversations>> | null>(null);
  const [conv, setConv] = useState<{ id: string; mensajes: Awaited<ReturnType<typeof assistantAdminApi.conversation>> } | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    assistantAdminApi.stats(dias).then(setStats).catch(() => toast.error("No se pudieron cargar las métricas"));
  }, [dias]);

  useEffect(() => {
    if (tab === "faqs" && !faqs.length) assistantAdminApi.faqs().then(setFaqs).catch(() => undefined);
    if (tab === "config" && !ajustes) assistantAdminApi.settings().then(setAjustes).catch(() => undefined);
    if (tab === "conversaciones" && !convs) assistantAdminApi.conversations().then(setConvs).catch(() => setConvs([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const guardarFaq = async () => {
    if (!editando) return;
    setGuardando(true);
    const r = await assistantAdminApi.saveFaq(editando);
    setGuardando(false);
    if (!r.ok) { toast.error(r.error); return; }
    setFaqs((prev) => (editando.id ? prev.map((f) => (f.id === r.data.id ? r.data : f)) : [r.data, ...prev]));
    setEditando(null);
    toast.success("Pregunta guardada. El chatbot ya la reconoce.");
  };

  const borrarFaq = async (f: AssistantFaq) => {
    if (!window.confirm(`¿Eliminar la pregunta "${f.question}"?`)) return;
    await assistantAdminApi.deleteFaq(f.id);
    setFaqs((prev) => prev.filter((x) => x.id !== f.id));
    toast.success("Pregunta eliminada");
  };

  const guardarAjustes = async (cambios: Partial<AssistantSettings>) => {
    if (!ajustes) return;
    setGuardando(true);
    try {
      const nuevo = await assistantAdminApi.saveSettings({
        enabled: cambios.enabled ?? ajustes.enabled,
        aiEnabled: cambios.aiEnabled ?? ajustes.aiEnabled,
        knowledge: cambios.knowledge ?? ajustes.knowledge,
      });
      setAjustes(nuevo);
      toast.success("Configuración guardada");
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  const probar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prueba.trim()) return;
    setResultado(await assistantAdminApi.test(prueba.trim()));
  };

  const TABS: [Tab, string][] = [
    ["resumen", "Resumen"],
    ["faqs", "Preguntas frecuentes"],
    ["probar", "Probar"],
    ["config", "Configuración"],
    ["conversaciones", "Conversaciones"],
  ];

  const totalProv = stats?.byProvider.reduce((a, p) => a + p.total, 0) ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-brand text-[#00C0E7] text-2xl uppercase tracking-wide">Asistente JB Assist</h1>
        <p className="text-gray-500 text-sm mt-1">
          El chatbot responde al instante con sus temas y tus preguntas frecuentes. La IA solo se usa cuando la pregunta no coincide con ninguno.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-3" role="tablist">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === id ? "bg-[#00C0E7] text-[#0d0d0d]" : "text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Resumen ──────────────────────────────────────────────────── */}
      {tab === "resumen" && (
        <div className="space-y-6">
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDias(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${dias === d ? "bg-[#00C0E7] text-[#0d0d0d]" : "border border-gray-700 text-gray-400 hover:border-[#00C0E7]"}`}
              >
                {d} días
              </button>
            ))}
          </div>

          {!stats ? (
            <div className="flex justify-center py-16"><div className="spinner-cyan" /></div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { k: "Conversaciones", v: stats.conversations },
                  { k: "Respuestas", v: stats.answers },
                  { k: "Resueltas sin IA", v: `${stats.withoutAIRate}%` },
                  { k: "IA de respaldo", v: stats.ai ? "Activa" : "Apagada" },
                ].map((x) => (
                  <div key={x.k} className={`${card} p-4`}>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">{x.k}</p>
                    <p className="font-brand text-3xl text-[#00C0E7] mt-1">{x.v}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className={`${card} p-5`}>
                  <h2 className="font-brand text-white uppercase tracking-wide">¿Quién respondió?</h2>
                  {totalProv === 0 ? (
                    <p className="text-gray-500 text-sm mt-4">Aún no hay conversaciones en este periodo.</p>
                  ) : (
                    <>
                      <div className="flex h-3 rounded-full overflow-hidden mt-4 gap-[2px]" role="img" aria-label="Reparto de respuestas por origen">
                        {stats.byProvider.map((p) => (
                          <div key={p.provider} style={{ width: `${(p.total / totalProv) * 100}%`, background: PROVEEDORES[p.provider]?.color ?? "#64748b" }} />
                        ))}
                      </div>
                      <ul className="mt-4 space-y-2 text-sm">
                        {stats.byProvider.map((p) => (
                          <li key={p.provider} className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: PROVEEDORES[p.provider]?.color ?? "#64748b" }} />
                            <span className="text-gray-300 flex-1">{PROVEEDORES[p.provider]?.label ?? p.provider}</span>
                            <span className="text-white font-semibold">{p.total}</span>
                            <span className="text-gray-500 w-12 text-right">{Math.round((p.total / totalProv) * 100)}%</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                <div className={`${card} p-5`}>
                  <h2 className="font-brand text-white uppercase tracking-wide">Temas más consultados</h2>
                  {stats.topIntents.length === 0 ? (
                    <p className="text-gray-500 text-sm mt-4">Sin datos todavía.</p>
                  ) : (
                    <ul className="mt-4 space-y-2.5">
                      {stats.topIntents.map((t) => (
                        <li key={t.intent}>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300 truncate pr-3">{t.title}</span>
                            <span className="text-white font-semibold">{t.total}</span>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-[#00C0E7] rounded-full" style={{ width: `${(t.total / stats.topIntents[0].total) * 100}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className={`${card} p-5`}>
                <h2 className="font-brand text-white uppercase tracking-wide">Preguntas que el chatbot no tenía</h2>
                <p className="text-gray-500 text-xs mt-1">Las respondió la IA o quedaron sin respuesta. Conviértelas en preguntas frecuentes para que se respondan al instante.</p>
                {stats.unanswered.length === 0 ? (
                  <p className="text-gray-500 text-sm mt-4">¡Nada pendiente! 🎉</p>
                ) : (
                  <ul className="mt-4 divide-y divide-gray-800">
                    {stats.unanswered.map((u) => (
                      <li key={u.content} className="py-2.5 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-300 text-sm truncate">{u.content}</p>
                          <p className="text-gray-500 text-xs">
                            {u.veces > 1 ? `${u.veces} veces · ` : ""}{fecha(u.ultima)} · {u.intent === "ia" ? "respondió la IA" : u.intent === "dudoso" ? "tema dudoso" : "sin respuesta"}
                          </p>
                        </div>
                        <button
                          onClick={() => { setEditando({ ...vacia, question: u.content }); setTab("faqs"); }}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#00C0E7] text-[#00C0E7] hover:bg-[rgba(0,192,231,0.1)] shrink-0"
                        >
                          Crear respuesta
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Preguntas frecuentes ─────────────────────────────────────── */}
      {tab === "faqs" && (
        <div className="space-y-4">
          {editando ? (
            <div className={`${card} p-5 space-y-4`}>
              <h2 className="font-brand text-white uppercase tracking-wide">{editando.id ? "Editar pregunta" : "Nueva pregunta frecuente"}</h2>
              <div>
                <label htmlFor="q" className="label-dark">Pregunta</label>
                <input id="q" className="input-dark" maxLength={200} value={editando.question} onChange={(e) => setEditando({ ...editando, question: e.target.value })} placeholder="Ej.: ¿Emiten boleta o factura?" />
              </div>
              <div>
                <label htmlFor="v" className="label-dark">Otras formas de preguntarlo (una por línea, opcional)</label>
                <textarea id="v" rows={3} className="input-dark" value={editando.variants} onChange={(e) => setEditando({ ...editando, variants: e.target.value })} placeholder={"dan factura\nquiero boleta\ncomprobante de pago"} />
              </div>
              <div>
                <label htmlFor="a" className="label-dark">Respuesta</label>
                <textarea id="a" rows={5} className="input-dark" maxLength={3000} value={editando.answer} onChange={(e) => setEditando({ ...editando, answer: e.target.value })} placeholder="Puedes usar **negritas** y listas con guiones." />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={editando.active} onChange={(e) => setEditando({ ...editando, active: e.target.checked })} className="accent-[#00C0E7]" />
                Activa
              </label>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditando(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
                <button disabled={guardando || !editando.question.trim() || !editando.answer.trim()} onClick={guardarFaq} className="btn-red px-5 py-2 text-sm">
                  {guardando ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <p className="text-gray-500 text-sm">{faqs.length} pregunta{faqs.length === 1 ? "" : "s"} · se suman a los {"30+"} temas que el chatbot ya conoce.</p>
              <button onClick={() => setEditando({ ...vacia })} className="btn-red px-4 py-2 text-sm">+ Nueva pregunta</button>
            </div>
          )}

          <div className="space-y-3">
            {faqs.map((f) => (
              <div key={f.id} className={`${card} p-4 flex gap-4`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold">{f.question}</p>
                    {!f.active && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-800 text-gray-500">Inactiva</span>}
                  </div>
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2 whitespace-pre-line">{f.answer}</p>
                  <p className="text-gray-600 text-xs mt-2">Usada {f.hits} {f.hits === 1 ? "vez" : "veces"}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => setEditando({ id: f.id, question: f.question, variants: f.variants, answer: f.answer, active: f.active })} className="text-xs font-semibold text-[#00C0E7] hover:underline">Editar</button>
                  <button onClick={() => borrarFaq(f)} className="text-xs font-semibold text-gray-500 hover:text-[#E31E24]">Eliminar</button>
                </div>
              </div>
            ))}
            {!faqs.length && !editando && (
              <div className={`${card} p-10 text-center text-gray-500 text-sm`}>
                Aún no hay preguntas frecuentes. Crea la primera o revisa «Preguntas que el chatbot no tenía» en el Resumen.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Probar ───────────────────────────────────────────────────── */}
      {tab === "probar" && (
        <div className={`${card} p-5 space-y-4 max-w-3xl`}>
          <p className="text-gray-400 text-sm">Escribe una pregunta como lo haría un alumno y mira qué respondería el chatbot. No usa IA ni se guarda.</p>
          <form onSubmit={probar} className="flex gap-2">
            <input className="input-dark flex-1" value={prueba} onChange={(e) => setPrueba(e.target.value)} placeholder="Ej.: ¿puedo pagar con yape?" />
            <button type="submit" className="btn-red px-5 text-sm">Probar</button>
          </form>
          {resultado && (
            <div className="rounded-lg border border-gray-800 p-4 space-y-2">
              {resultado.understood ? (
                <>
                  <p className="text-xs uppercase tracking-wider text-[#00C0E7] font-bold">
                    Entendido · {PROVEEDORES[resultado.provider]?.label ?? resultado.provider} · tema «{resultado.intent}»
                  </p>
                  <p className="text-gray-300 text-sm whitespace-pre-line">{resultado.reply}</p>
                  {resultado.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {resultado.actions.map((a: Accion, i: number) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-full border border-gray-700 text-gray-400">{a.etiqueta}</span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-300">
                  No coincide con ningún tema ni pregunta frecuente.{" "}
                  {resultado.provider === "ia" ? "La respondería la IA." : "La IA está apagada: mostraría el menú de temas y el botón de WhatsApp."}{" "}
                  <button onClick={() => { setEditando({ ...vacia, question: prueba }); setTab("faqs"); }} className="text-[#00C0E7] font-semibold hover:underline">
                    Crear una respuesta
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Configuración ────────────────────────────────────────────── */}
      {tab === "config" && (
        !ajustes ? (
          <div className="flex justify-center py-16"><div className="spinner-cyan" /></div>
        ) : (
          <div className="space-y-4 max-w-3xl">
            {[
              { k: "enabled" as const, t: "JB Assist activo", d: "Muestra el asistente en la plataforma." },
              { k: "aiEnabled" as const, t: "Usar IA de respaldo", d: "Si lo apagas, el chatbot responde solo con sus temas y tus preguntas frecuentes (y ofrece WhatsApp)." },
            ].map((x) => (
              <div key={x.k} className={`${card} p-4 flex items-center gap-4`}>
                <div className="flex-1">
                  <p className="text-white font-semibold">{x.t}</p>
                  <p className="text-gray-500 text-sm">{x.d}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={ajustes[x.k]}
                  aria-label={x.t}
                  disabled={guardando}
                  onClick={() => guardarAjustes({ [x.k]: !ajustes[x.k] })}
                  className={`keep-theme relative w-12 h-7 rounded-full transition-colors ${ajustes[x.k] ? "bg-[#00C0E7]" : "bg-gray-600"}`}
                >
                  <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${ajustes[x.k] ? "left-6" : "left-1"}`} />
                </button>
              </div>
            ))}
            <div className={`${card} p-4 space-y-3`}>
              <div>
                <p className="text-white font-semibold">Información del negocio para la IA</p>
                <p className="text-gray-500 text-sm">Lo que la IA debe saber: horarios, precios, promociones, etc. Los datos de los cursos se leen solos.</p>
              </div>
              <textarea
                rows={14}
                className="input-dark font-mono text-xs"
                value={ajustes.knowledge}
                onChange={(e) => setAjustes({ ...ajustes, knowledge: e.target.value })}
              />
              <div className="flex justify-end">
                <button disabled={guardando} onClick={() => guardarAjustes({ knowledge: ajustes.knowledge })} className="btn-red px-5 py-2 text-sm">
                  Guardar información
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* ── Conversaciones ───────────────────────────────────────────── */}
      {tab === "conversaciones" && (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <div className={`${card} overflow-hidden max-h-[70vh] overflow-y-auto`}>
            {!convs ? (
              <div className="flex justify-center py-10"><div className="spinner-cyan" /></div>
            ) : convs.length === 0 ? (
              <p className="p-6 text-gray-500 text-sm">Aún no hay conversaciones.</p>
            ) : (
              convs.map((c) => (
                <button
                  key={c.conversationId}
                  onClick={() => assistantAdminApi.conversation(c.conversationId).then((m) => setConv({ id: c.conversationId, mensajes: m }))}
                  className={`w-full text-left px-4 py-3 border-b border-gray-800/60 hover:bg-gray-800/30 ${conv?.id === c.conversationId ? "bg-[rgba(0,192,231,0.08)]" : ""}`}
                >
                  <p className="text-gray-300 text-sm truncate">{c.firstMessage ?? "(sin texto)"}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{c.messages} mensajes · {fecha(c.lastAt)}</p>
                </button>
              ))
            )}
          </div>
          <div className={`${card} p-4 max-h-[70vh] overflow-y-auto`}>
            {!conv ? (
              <p className="text-gray-500 text-sm">Elige una conversación para verla.</p>
            ) : (
              <div className="space-y-3">
                {conv.mensajes.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-line ${m.role === "user" ? "bg-[#00C0E7] text-[#0d0d0d]" : "bg-gray-800 text-gray-300"}`}>
                      {m.content}
                      {m.role === "assistant" && m.provider && (
                        <p className="text-[10px] mt-1 opacity-60">{PROVEEDORES[m.provider]?.label ?? m.provider} · {fecha(m.createdAt)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
