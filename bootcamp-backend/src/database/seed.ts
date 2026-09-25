// src/database/seed.ts
//
// Ejecutar con: npm run seed
//
// El script es IDEMPOTENTE: si los datos ya existen los omite
// y no lanza error. Puedes ejecutarlo cuantas veces quieras.

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { DataSource } from 'typeorm';
import { Category } from '../courses/entities/category.entity';
import { Course } from '../courses/entities/course.entity';
import { Module as ModuleEntity } from '../courses/entities/module.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { Video } from '../courses/entities/video.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Progress } from '../progress/entities/progress.entity';

// ── Conexión ────────────────────────────────────────────────────────────────
const DB = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    Category,
    Course,
    ModuleEntity,
    Lesson,
    Video,
    Enrollment,
    Progress,
  ],
  ssl: { rejectUnauthorized: false },
  logging: false,
});

// ── Datos de ejemplo ────────────────────────────────────────────────────────

const ROLES = [
  { name: 'admin', description: 'Administrador de la plataforma' },
  { name: 'student', description: 'Estudiante de la plataforma' },
];

const CATEGORIAS = [
  {
    name: 'Desarrollo Web',
    description:
      'HTML, CSS, JavaScript, frameworks modernos y desarrollo full-stack',
  },
  {
    name: 'Inteligencia Artificial',
    description:
      'Machine Learning, Deep Learning, Python para IA y ciencia de datos',
  },
  {
    name: 'Diseño UX/UI',
    description:
      'Principios de diseño, Figma, prototipado y experiencia de usuario',
  },
  {
    name: 'Ciberseguridad',
    description:
      'Seguridad en aplicaciones, ethical hacking y protección de datos',
  },
];

// Cada video usa el formato embed de YouTube (ya convertido por aUrlIncrustable)
const CURSOS = [
  {
    title: 'Desarrollo Web con React desde Cero',
    description:
      'Aprende a construir aplicaciones web modernas con React, el framework más demandado del mercado. Desde los fundamentos hasta proyectos reales con hooks, estado y componentes reutilizables.',
    image:
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format',
    status: 'published',
    categoria: 'Desarrollo Web',
    modulos: [
      {
        title: 'Fundamentos de React',
        order: 1,
        description:
          'Los pilares sobre los que se construye cualquier aplicación React',
        lecciones: [
          {
            order: 1,
            title: '¿Qué es React y por qué usarlo?',
            description:
              'Historia, ecosistema y ventajas del desarrollo con React',
            video: {
              title: 'Intro a React',
              url: 'https://www.youtube.com/embed/bMknfKXIFA8',
              duration: 720,
            },
          },
          {
            order: 2,
            title: 'Componentes y JSX',
            description:
              'Crea componentes reutilizables y escribe JSX de forma correcta',
            video: {
              title: 'Componentes React',
              url: 'https://www.youtube.com/embed/w7ejDZ8SWv8',
              duration: 540,
            },
          },
          {
            order: 3,
            title: 'Props: comunicación entre componentes',
            description: 'Pasa datos de padres a hijos y estructura bien tu UI',
            video: {
              title: 'Props en React',
              url: 'https://www.youtube.com/embed/Ke90Tje7VS0',
              duration: 480,
            },
          },
        ],
      },
      {
        title: 'Estado y Hooks',
        order: 2,
        description:
          'Manejo del estado reactivo con los hooks principales de React',
        lecciones: [
          {
            order: 1,
            title: 'useState: el estado local del componente',
            description: 'Qué es el estado, cómo actualizarlo y cuándo usarlo',
            video: {
              title: 'useState Hook',
              url: 'https://www.youtube.com/embed/O6P86uwfdR0',
              duration: 600,
            },
          },
          {
            order: 2,
            title: 'useEffect: efectos y ciclo de vida',
            description: 'Sincroniza tu componente con APIs, timers y el DOM',
            video: {
              title: 'useEffect Hook',
              url: 'https://www.youtube.com/embed/0ZJgIjIuY7U',
              duration: 660,
            },
          },
          {
            order: 3,
            title: 'useContext: estado global sin librerías',
            description:
              'Comparte estado entre componentes distantes sin prop drilling',
            video: {
              title: 'useContext Hook',
              url: 'https://www.youtube.com/embed/5LrDIWkK_Bc',
              duration: 480,
            },
          },
        ],
      },
      {
        title: 'Proyecto Final: App de Gestión de Tareas',
        order: 3,
        description:
          'Aplicamos todo lo aprendido construyendo una app completa y funcional',
        lecciones: [
          {
            order: 1,
            title: 'Diseño de componentes y estado global',
            description:
              'Planificamos la arquitectura antes de escribir una sola línea',
            video: {
              title: 'Planificación React App',
              url: 'https://www.youtube.com/embed/hQAHSlTtcmY',
              duration: 420,
            },
          },
          {
            order: 2,
            title: 'Implementación con React + Tailwind CSS',
            description: 'Construimos la UI y le damos estilos con Tailwind',
            video: {
              title: 'React + Tailwind',
              url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              duration: 900,
            },
          },
        ],
      },
    ],
  },

  {
    title: 'Python para Data Science e Inteligencia Artificial',
    description:
      'Domina Python y las librerías más importantes del ecosistema de datos: Pandas, NumPy y Scikit-learn. Construye tu primer modelo de Machine Learning con datos reales.',
    image:
      'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format',
    status: 'published',
    categoria: 'Inteligencia Artificial',
    modulos: [
      {
        title: 'Python para el análisis de datos',
        order: 1,
        description:
          'Las bases del lenguaje Python orientadas al mundo de los datos',
        lecciones: [
          {
            order: 1,
            title: 'Python desde cero: variables y tipos de datos',
            description:
              'Fundamentos del lenguaje que usaremos durante todo el curso',
            video: {
              title: 'Python Crash Course',
              url: 'https://www.youtube.com/embed/rfscVS0vtbw',
              duration: 780,
            },
          },
          {
            order: 2,
            title: 'Listas, tuplas y diccionarios',
            description:
              'Las estructuras de datos que más usarás al manipular colecciones',
            video: {
              title: 'Estructuras de Datos Python',
              url: 'https://www.youtube.com/embed/pkYVOmU3MgA',
              duration: 540,
            },
          },
          {
            order: 3,
            title: 'Funciones, módulos y programación funcional',
            description:
              'Organiza tu código y aprovecha funciones lambda y map/filter',
            video: {
              title: 'Funciones en Python',
              url: 'https://www.youtube.com/embed/u-OmVr_fT4s',
              duration: 480,
            },
          },
        ],
      },
      {
        title: 'Análisis de datos con Pandas',
        order: 2,
        description:
          'La librería fundamental para trabajar con datos tabulares en Python',
        lecciones: [
          {
            order: 1,
            title: 'Introducción a Pandas y DataFrames',
            description: 'Carga, explora y visualiza conjuntos de datos reales',
            video: {
              title: 'Pandas Tutorial',
              url: 'https://www.youtube.com/embed/vmEHCJofslg',
              duration: 840,
            },
          },
          {
            order: 2,
            title: 'Limpieza y transformación de datos',
            description:
              'Maneja nulos, duplicados y transforma columnas de forma eficiente',
            video: {
              title: 'Data Cleaning con Pandas',
              url: 'https://www.youtube.com/embed/bDhvCp3_lYw',
              duration: 720,
            },
          },
        ],
      },
      {
        title: 'Machine Learning con Scikit-learn',
        order: 3,
        description:
          'Construye y evalúa tus primeros modelos predictivos paso a paso',
        lecciones: [
          {
            order: 1,
            title: '¿Qué es el Machine Learning?',
            description:
              'Tipos de aprendizaje, flujo de trabajo y métricas de evaluación',
            video: {
              title: 'Intro Machine Learning',
              url: 'https://www.youtube.com/embed/NWONeJKn6kc',
              duration: 600,
            },
          },
          {
            order: 2,
            title: 'Tu primer modelo: clasificación con árboles de decisión',
            description:
              'Entrena, valida y mejora un clasificador con datos reales',
            video: {
              title: 'Decision Trees Scikit-learn',
              url: 'https://www.youtube.com/embed/NUXdtN1W1FE',
              duration: 660,
            },
          },
        ],
      },
    ],
  },

  {
    title: 'Ciberseguridad: Defensa de Aplicaciones Web',
    description:
      'Comprende cómo piensan los atacantes para defender mejor tus sistemas. Cubre el modelo OWASP Top 10, vulnerabilidades comunes y mejores prácticas de seguridad en aplicaciones modernas.',
    image:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format',
    status: 'published',
    categoria: 'Ciberseguridad',
    modulos: [
      {
        title: 'Conceptos fundamentales',
        order: 1,
        description: 'El panorama actual de la seguridad informática',
        lecciones: [
          {
            order: 1,
            title: '¿Qué es la ciberseguridad y por qué importa?',
            description:
              'Tipos de amenazas, actores maliciosos y el ciclo de ataque',
            video: {
              title: 'Intro Ciberseguridad',
              url: 'https://www.youtube.com/embed/inWWhr5tnEA',
              duration: 720,
            },
          },
          {
            order: 2,
            title: 'Criptografía: la base de todo sistema seguro',
            description:
              'Cifrado simétrico, asimétrico, hashing y certificados SSL/TLS',
            video: {
              title: 'Criptografía Básica',
              url: 'https://www.youtube.com/embed/AQDCe585Lnc',
              duration: 600,
            },
          },
        ],
      },
      {
        title: 'OWASP y vulnerabilidades web',
        order: 2,
        description:
          'Las vulnerabilidades más críticas en aplicaciones web y cómo prevenirlas',
        lecciones: [
          {
            order: 1,
            title: 'OWASP Top 10: las amenazas más relevantes',
            description:
              'Recorre las 10 vulnerabilidades que todo desarrollador debe conocer',
            video: {
              title: 'OWASP Top 10',
              url: 'https://www.youtube.com/embed/t4jQ7LFSJsc',
              duration: 840,
            },
          },
          {
            order: 2,
            title: 'SQL Injection: ataque y defensa práctica',
            description:
              'Cómo funciona una inyección SQL y cómo proteger tus consultas',
            video: {
              title: 'SQL Injection',
              url: 'https://www.youtube.com/embed/ciNHn38EyRc',
              duration: 540,
            },
          },
          {
            order: 3,
            title: 'XSS y CSRF: ataques del lado del cliente',
            description:
              'Cross-Site Scripting y CSRF explicados con ejemplos reales y defensas',
            video: {
              title: 'XSS y CSRF',
              url: 'https://www.youtube.com/embed/cbmBDiR6WGs',
              duration: 480,
            },
          },
        ],
      },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) {
  process.stdout.write(msg + '\n');
}
function ok(msg: string) {
  log(`  ✅ ${msg}`);
}
function skip(msg: string) {
  log(`  ⏭  ${msg} (ya existe)`);
}

// ── Seed ────────────────────────────────────────────────────────────────────

async function seed() {
  log('\n🌱  Iniciando seed de la base de datos...\n');
  await DB.initialize();
  log('🔗  Conexión a Supabase establecida\n');

  const qr = DB.createQueryRunner();

  // ── 1. Roles ─────────────────────────────────────────────────────────────
  log('── Roles ──────────────────────────────────────────────────────────');
  for (const rol of ROLES) {
    const existe = await qr.query(
      `SELECT id FROM roles WHERE name = $1 LIMIT 1`,
      [rol.name],
    );
    if (existe.length) {
      skip(`rol "${rol.name}"`);
    } else {
      await qr.query(
        `INSERT INTO roles (id, name, description, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())`,
        [rol.name, rol.description],
      );
      ok(`rol "${rol.name}" creado`);
    }
  }

  // ── 2. Categorías ─────────────────────────────────────────────────────────
  log('\n── Categorías ─────────────────────────────────────────────────────');
  const catRepo = DB.getRepository(Category);
  const mapaCategoria: Record<string, Category> = {};

  for (const c of CATEGORIAS) {
    let cat = await catRepo.findOne({ where: { name: c.name } });
    if (cat) {
      skip(`categoría "${c.name}"`);
    } else {
      cat = await catRepo.save(catRepo.create(c));
      ok(`categoría "${c.name}" creada`);
    }
    mapaCategoria[c.name] = cat;
  }

  // ── 3. Cursos ─────────────────────────────────────────────────────────────
  const courseRepo = DB.getRepository(Course);
  const moduleRepo = DB.getRepository(ModuleEntity);
  const lessonRepo = DB.getRepository(Lesson);
  const videoRepo = DB.getRepository(Video);

  for (const c of CURSOS) {
    log(
      `\n── Curso: "${c.title}" ────────────────────────────────────────────`,
    );

    let curso = await courseRepo.findOne({ where: { title: c.title } });
    if (curso) {
      skip(`curso "${c.title}"`);
    } else {
      curso = await courseRepo.save(
        courseRepo.create({
          title: c.title,
          description: c.description,
          image: c.image,
          status: c.status,
          category: mapaCategoria[c.categoria],
        }),
      );
      ok(`curso "${c.title}" creado`);
    }

    for (const m of c.modulos) {
      let modulo = await moduleRepo.findOne({
        where: { title: m.title, course: { id: curso.id } },
      });
      if (modulo) {
        skip(`  módulo "${m.title}"`);
      } else {
        modulo = await moduleRepo.save(
          moduleRepo.create({
            title: m.title,
            description: m.description,
            orderNumber: m.order,
            course: curso,
          }),
        );
        ok(`  módulo "${m.title}" creado`);
      }

      for (const l of m.lecciones) {
        let leccion = await lessonRepo.findOne({
          where: { title: l.title, module: { id: modulo.id } },
        });
        if (leccion) {
          skip(`    lección "${l.title}"`);
        } else {
          leccion = await lessonRepo.save(
            lessonRepo.create({
              title: l.title,
              description: l.description,
              orderNumber: l.order,
              module: modulo,
            }),
          );
          ok(`    lección "${l.title}" creada`);
        }

        if (l.video) {
          const videoExiste = await videoRepo.findOne({
            where: { lesson: { id: leccion.id } },
          });
          if (videoExiste) {
            skip(`      video de "${l.title}"`);
          } else {
            await videoRepo.save(
              videoRepo.create({
                title: l.video.title,
                videoUrl: l.video.url,
                duration: l.video.duration,
                lesson: leccion,
              }),
            );
            ok(`      video de "${l.title}" creado`);
          }
        }
      }
    }
  }

  // ── Resumen ───────────────────────────────────────────────────────────────
  const nCat = await catRepo.count();
  const nCursos = await courseRepo.count();
  const nModulos = await moduleRepo.count();
  const nLecc = await lessonRepo.count();
  const nVideos = await videoRepo.count();

  log('\n╔══════════════════════════════════════╗');
  log('║         SEED COMPLETADO ✅            ║');
  log('╠══════════════════════════════════════╣');
  log(`║  Categorías : ${String(nCat).padStart(3)}                    ║`);
  log(`║  Cursos     : ${String(nCursos).padStart(3)}                    ║`);
  log(`║  Módulos    : ${String(nModulos).padStart(3)}                    ║`);
  log(`║  Lecciones  : ${String(nLecc).padStart(3)}                    ║`);
  log(`║  Videos     : ${String(nVideos).padStart(3)}                    ║`);
  log('╚══════════════════════════════════════╝\n');

  await DB.destroy();
}

seed().catch((err) => {
  console.error('\n❌  Error durante el seed:\n', err);
  process.exit(1);
});
