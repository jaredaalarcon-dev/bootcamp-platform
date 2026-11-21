// src/hooks/useComplaintsApi.ts — Libro de Reclamaciones virtual
import { apiClient } from "@/lib/api-client";

export type TipoReclamo = "reclamo" | "queja";

export interface HojaReclamo {
  id?: string;
  code: string;
  numero: number;
  type: TipoReclamo;
  status: "pendiente" | "respondido";
  createdAt: string;
  deadline: string;
  response: string | null;
  respondedAt: string | null;
  itemType: "servicio" | "producto";
  itemDescription: string;
  fullName?: string;
  documentType?: string;
  documentNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  isMinor?: boolean;
  guardianName?: string | null;
  amount?: number | null;
  detail?: string;
  request?: string;
}

export interface NuevaHoja {
  fullName: string;
  documentType: string;
  documentNumber: string;
  address: string;
  phone: string;
  email: string;
  isMinor: boolean;
  guardianName?: string;
  itemType: "servicio" | "producto";
  amount: number | null;
  itemDescription: string;
  type: TipoReclamo;
  detail: string;
  request: string;
  accepted: boolean;
}

const mensaje = (err: unknown, porDefecto: string) => {
  const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  return Array.isArray(m) ? m[0] : (m ?? porDefecto);
};

export const complaintsApi = {
  async create(body: NuevaHoja) {
    try {
      const { data } = await apiClient.post("/complaints", body);
      return { ok: true as const, data: data.data as HojaReclamo };
    } catch (err) {
      return { ok: false as const, error: mensaje(err, "No se pudo registrar. Revisa tu conexión e inténtalo de nuevo.") };
    }
  },
  async consultar(codigo: string, documento: string) {
    try {
      const { data } = await apiClient.get("/complaints/consulta", { params: { codigo, documento } });
      return { ok: true as const, data: data.data as HojaReclamo };
    } catch (err) {
      return { ok: false as const, error: mensaje(err, "No encontramos una hoja con esos datos") };
    }
  },
  async list(): Promise<HojaReclamo[]> {
    const { data } = await apiClient.get("/complaints");
    return data.data;
  },
  async respond(id: string, response: string): Promise<HojaReclamo> {
    const { data } = await apiClient.patch(`/complaints/${id}/respond`, { response });
    return data.data;
  },
};
