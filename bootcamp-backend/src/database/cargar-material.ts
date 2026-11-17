// src/database/cargar-material.ts
// Sube las guías (PDF) y kits de práctica (ZIP) de la carpeta material-cursos/
// a los cursos que todavía no los tienen. No duplica nada.
//
//   npm run material:cargar               → sube lo que falta
//   npm run material:cargar -- --revisar  → solo muestra qué haría (no cambia nada)
//   npm run material:cargar -- --actualizar → reemplaza los archivos con el mismo nombre
//                                             por la versión nueva de la carpeta
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../app.module';
import { ResourcesService } from '../resources/resources.service';
import { CourseResource } from '../resources/entities/course-resource.entity';
import type { TipoRecurso } from '../resources/entities/course-resource.entity';

interface ArchivoManifest { archivo: string; titulo: string; tipo: TipoRecurso; descripcion?: string }
interface Grupo { nombre: string; claves: string[]; archivos: ArchivoManifest[] }

const CARPETA = path.join(__dirname, '..', '..', 'material-cursos');
const MIME: Record<string, string> = { '.pdf': 'application/pdf', '.zip': 'application/zip' };
const normal = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

async function main() {
  const revisar = process.argv.includes('--revisar');
  const actualizar = process.argv.includes('--actualizar');

  const manifest = JSON.parse(fs.readFileSync(path.join(CARPETA, 'manifest.json'), 'utf8')) as { grupos: Grupo[] };
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const db = app.get(DataSource);
  const recursos = app.get(ResourcesService);
  const repo = db.getRepository(CourseResource);

  const cursos: { id: string; title: string }[] = await db.query(`SELECT id, title FROM courses ORDER BY title`);
  let subidos = 0, omitidos = 0, reemplazados = 0;
  const sinMaterial: string[] = [];

  console.log(`\n📚 Material de cursos ${revisar ? '(modo revisión: no se cambia nada)' : ''}\n`);

  for (const curso of cursos) {
    const titulo = normal(curso.title);
    // Una clave de varias palabras ("movil basico") exige que estén todas en el título
    const grupo = manifest.grupos.find((g) =>
      g.claves.some((c) => normal(c).split(/\s+/).every((palabra) => titulo.includes(palabra))),
    );
    if (!grupo) {
      sinMaterial.push(curso.title);
      continue;
    }
    console.log(`▸ ${curso.title}  (${grupo.nombre})`);

    for (const a of grupo.archivos) {
      const ruta = path.join(CARPETA, a.archivo);
      if (!fs.existsSync(ruta)) {
        console.log(`   ⚠ Falta el archivo ${a.archivo} en material-cursos/`);
        continue;
      }
      const existente = await repo.findOne({ where: { courseId: curso.id, fileName: a.archivo } });
      if (existente && !actualizar) {
        console.log(`   = Ya tiene ${a.archivo}`);
        omitidos++;
        continue;
      }
      if (revisar) {
        console.log(`   ${existente ? '↻ Reemplazaría' : '+ Subiría'} ${a.archivo}`);
        continue;
      }
      if (existente) {
        await recursos.remove(existente.id);
        reemplazados++;
      }
      const buffer = fs.readFileSync(ruta);
      await recursos.upload(
        { courseId: curso.id, title: a.titulo, description: a.descripcion, type: a.tipo },
        {
          originalname: a.archivo,
          mimetype: MIME[path.extname(a.archivo).toLowerCase()] ?? 'application/octet-stream',
          size: buffer.length,
          buffer,
        },
      );
      console.log(`   ${existente ? '↻ Reemplazado' : '+ Subido'} ${a.archivo}`);
      subidos++;
    }
  }

  console.log(`\n✔ Listo: ${subidos} subido(s), ${reemplazados} reemplazado(s), ${omitidos} ya estaban.`);
  if (sinMaterial.length) {
    console.log(`\nCursos sin material automático (pide su guía y kit):`);
    sinMaterial.forEach((t) => console.log(`   · ${t}`));
  }
  console.log('');
  await app.close();
}

main().catch((e) => {
  console.error('\n✖ No se pudo cargar el material:', e?.message ?? e);
  process.exit(1);
});
