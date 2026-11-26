// src/database/cargar-cuestionarios.ts
// Crea los cuestionarios de cuestionarios/banco.json en los cursos que coinciden:
// uno por módulo (según su número de orden) y el examen final del curso.
// No duplica: si ya existe un cuestionario con el mismo título, lo deja como está.
//
//   npm run cuestionarios:cargar               → crea lo que falta
//   npm run cuestionarios:cargar -- --revisar  → solo muestra qué haría (no cambia nada)
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../app.module';
import { QuizzesService } from '../quizzes/quizzes.service';

interface PreguntaBanco { text: string; options: string[]; correctIndex: number; explanation?: string }
interface CuestionarioBanco { titulo: string; descripcion?: string; notaMinima: number; preguntas: PreguntaBanco[] }
interface Grupo { nombre: string; claves: string[]; modulos: (CuestionarioBanco & { orden: number })[]; final?: CuestionarioBanco }

const ARCHIVO = path.join(__dirname, '..', '..', 'cuestionarios', 'banco.json');
const normal = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');

async function main() {
  const revisar = process.argv.includes('--revisar');
  const banco = JSON.parse(fs.readFileSync(ARCHIVO, 'utf8')) as { grupos: Grupo[] };
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const db = app.get(DataSource);
  const quizzes = app.get(QuizzesService);

  const cursos: { id: string; title: string }[] = await db.query(`SELECT id, title FROM courses ORDER BY title`);
  let creados = 0, omitidos = 0;
  const sinBanco: string[] = [];
  console.log(`\n📝 Cuestionarios ${revisar ? '(modo revisión: no se cambia nada)' : ''}\n`);

  const crear = async (etiqueta: string, cuerpo: Parameters<QuizzesService['save']>[0]) => {
    const [existe] = await db.query(`SELECT id FROM quizzes WHERE "courseId" = $1 AND title = $2`, [cuerpo.courseId, cuerpo.title]);
    if (existe) { console.log(`   = Ya existe: ${etiqueta}`); omitidos++; return; }
    if (revisar) { console.log(`   + Crearía: ${etiqueta} (${cuerpo.questions.length} preguntas)`); return; }
    await quizzes.save(cuerpo);
    console.log(`   ✔ Creado: ${etiqueta} (${cuerpo.questions.length} preguntas)`);
    creados++;
  };
  const preguntas = (ps: PreguntaBanco[]) => ps.map((p) => ({ text: p.text, options: p.options, correctIndex: p.correctIndex, explanation: p.explanation }));

  for (const curso of cursos) {
    const titulo = normal(curso.title);
    const grupo = banco.grupos.find((g) => g.claves.some((c) => normal(c).split(' ').every((w) => titulo.includes(w))));
    if (!grupo) { sinBanco.push(curso.title); continue; }
    console.log(`▸ ${curso.title.trim()}  (${grupo.nombre})`);

    const modulos: { id: string; orderNumber: number; title: string }[] = await db.query(
      `SELECT id, "orderNumber", title FROM modules WHERE "courseId" = $1 ORDER BY "orderNumber"`, [curso.id],
    );
    for (const m of modulos) {
      const q = grupo.modulos.find((x) => x.orden === m.orderNumber);
      if (!q) { console.log(`   · ${m.title}: sin cuestionario en el banco`); continue; }
      await crear(`${m.title} → ${q.titulo}`, {
        courseId: curso.id, moduleId: m.id, lessonId: null, title: q.titulo, description: q.descripcion,
        passingScore: q.notaMinima, published: true, questions: preguntas(q.preguntas),
      });
    }
    if (grupo.final) {
      const [hayFinal] = await db.query(
        `SELECT title FROM quizzes WHERE "courseId" = $1 AND "moduleId" IS NULL AND "lessonId" IS NULL`, [curso.id],
      );
      if (hayFinal) { console.log(`   = Ya tiene examen final: ${hayFinal.title}`); omitidos++; }
      else await crear(grupo.final.titulo, {
        courseId: curso.id, moduleId: null, lessonId: null, final: true, title: grupo.final.titulo,
        description: grupo.final.descripcion, passingScore: grupo.final.notaMinima, published: true,
        questions: preguntas(grupo.final.preguntas),
      });
    }
  }

  console.log(`\nResumen: ${creados} creados, ${omitidos} ya existían.`);
  if (sinBanco.length) console.log(`Cursos sin cuestionarios en el banco: ${sinBanco.map((t) => t.trim()).join(', ')}`);
  if (revisar) console.log('\nModo revisión: no se cambió nada. Quita --revisar para crearlos.');
  await app.close();
}

main().catch((e) => { console.error('❌', e?.message ?? e); process.exit(1); });
