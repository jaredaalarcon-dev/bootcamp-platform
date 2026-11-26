// src/community/community.helpers.ts — utilidades compartidas
import { DataSource } from 'typeorm';

/** Nombre visible: "Nombre A." (nombre y la inicial del apellido). */
export async function nombrePublico(db: DataSource, userId: string): Promise<string> {
  const [p] = await db.query(
    `SELECT first_name, last_name, email FROM profiles WHERE supabase_id = $1 LIMIT 1`,
    [userId],
  );
  const nombre = (p?.first_name ?? '').trim().split(/\s+/)[0];
  const apellido = (p?.last_name ?? '').trim();
  if (nombre) return apellido ? `${nombre} ${apellido[0].toUpperCase()}.` : nombre;
  const correo = (p?.email ?? '').split('@')[0];
  return correo ? correo.slice(0, 20) : 'Alumno';
}

export async function estaInscrito(db: DataSource, userId: string, courseId: string) {
  const [r] = await db.query(
    `SELECT 1 FROM enrollments WHERE "userId" = $1 AND "courseId" = $2 LIMIT 1`,
    [userId, courseId],
  );
  return !!r;
}

/** Limpia texto: sin espacios sobrantes ni saltos de línea excesivos. */
export const limpiarTexto = (t: string) =>
  (t ?? '').replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
