// src/hooks/useAssistantApi.ts
// JB Assist: el asistente con IA de la plataforma.
import { apiClient } from "@/lib/api-client";

export interface AssistantStatus { name: string; enabled: boolean; configured: boolean }

const mensaje = (err: any, porDefecto: string) => {
  const m = err?.response?.data?.message;
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

  const chat = async (datos: { message: string; conversationId: string; userName?: string }) => {
    try {
      const { data } = await apiClient.post("/assistant/chat", datos);
      return { success: true as const, reply: String(data?.data?.reply ?? "") };
    } catch (err: any) {
      return {
        success: false as const,
        error: mensaje(err, "No pude conectarme. Revisa tu conexión e inténtalo de nuevo."),
      };
    }
  };

  return { status, chat };
}
