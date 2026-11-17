// src/hooks/useAssistantApi.ts
// JB Assist: chatbot (temas fijos + preguntas frecuentes) con IA de respaldo.
import { apiClient } from "@/lib/api-client";

export interface AssistantStatus { name: string; enabled: boolean; configured: boolean; ai?: boolean }

export type Accion =
  | { tipo: "respuesta"; etiqueta: string; intent: string }
  | { tipo: "enlace"; etiqueta: string; url: string }
  | { tipo: "whatsapp"; etiqueta: string; texto: string };

export interface MenuAyuda {
  groups: { id: string; titulo: string; icono: string; items: { intent: string; titulo: string }[] }[];
  whatsapp: string;
}

export interface AssistantFaq {
  id: string;
  question: string;
  variants: string;
  answer: string;
  active: boolean;
  hits: number;
  createdAt: string;
}

export interface AssistantStats {
  days: number;
  conversations: number;
  answers: number;
  withoutAI: number;
  withoutAIRate: number;
  byProvider: { provider: string; total: number }[];
  topIntents: { intent: string; title: string; total: number }[];
  unanswered: { content: string; veces: number; ultima: string; intent: string }[];
  ai: boolean;
}

export interface AssistantSettings { id: string; enabled: boolean; aiEnabled: boolean; knowledge: string; updatedAt: string }

const mensaje = (err: unknown, porDefecto: string) => {
  const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (Array.isArray(m)) return m.join(". ");
  return m || porDefecto;
};

export function useAssistantApi() {
  const status = async (): Promise<AssistantStatus | null> => {
    try {
      const { data } = await apiClient.get("/assistant/status");
      return (data?.data ?? null) as AssistantStatus | null;
    } catch {
      return null;
    }
  };

  const chat = async (datos: { message: string; conversationId: string; userName?: string; intent?: string }) => {
    try {
      const { data } = await apiClient.post("/assistant/chat", datos);
      return {
        success: true as const,
        reply: String(data?.data?.reply ?? ""),
        provider: String(data?.data?.provider ?? ""),
        actions: (data?.data?.actions ?? []) as Accion[],
      };
    } catch (err) {
      return {
        success: false as const,
        error: mensaje(err, "No pude conectarme. Revisa tu conexión e inténtalo de nuevo."),
      };
    }
  };

  const menu = async (): Promise<MenuAyuda | null> => {
    try {
      const { data } = await apiClient.get("/assistant/menu");
      return data?.data ?? null;
    } catch {
      return null;
    }
  };

  return { status, chat, menu };
}

// ── Panel admin ────────────────────────────────────────────────────────────
export const assistantAdminApi = {
  async stats(days = 30): Promise<AssistantStats> {
    const { data } = await apiClient.get("/assistant/stats", { params: { days } });
    return data.data;
  },
  async faqs(): Promise<AssistantFaq[]> {
    const { data } = await apiClient.get("/assistant/faqs");
    return data.data;
  },
  async saveFaq(faq: { id?: string; question: string; variants: string; answer: string; active: boolean }) {
    try {
      const body = { question: faq.question, variants: faq.variants, answer: faq.answer, active: faq.active };
      const { data } = faq.id
        ? await apiClient.put(`/assistant/faqs/${faq.id}`, body)
        : await apiClient.post("/assistant/faqs", body);
      return { ok: true as const, data: data.data as AssistantFaq };
    } catch (err) {
      return { ok: false as const, error: mensaje(err, "No se pudo guardar") };
    }
  },
  async deleteFaq(id: string) {
    await apiClient.delete(`/assistant/faqs/${id}`);
  },
  async settings(): Promise<AssistantSettings> {
    const { data } = await apiClient.get("/assistant/settings");
    return data.data;
  },
  async saveSettings(body: Partial<Pick<AssistantSettings, "enabled" | "aiEnabled" | "knowledge">>) {
    const { data } = await apiClient.put("/assistant/settings", body);
    return data.data as AssistantSettings;
  },
  async test(message: string) {
    const { data } = await apiClient.post("/assistant/test", { message });
    return data.data as { understood: boolean; reply: string | null; provider: string; intent: string | null; actions: Accion[] };
  },
  async conversations() {
    const { data } = await apiClient.get("/assistant/conversations");
    return data.data as { conversationId: string; channel: string; messages: number; startedAt: string; lastAt: string; firstMessage: string | null }[];
  },
  async conversation(id: string) {
    const { data } = await apiClient.get(`/assistant/conversations/${id}`);
    return data.data as { role: "user" | "assistant"; content: string; provider: string | null; createdAt: string }[];
  },
};
