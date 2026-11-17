# Plataforma Bootcamp — Soluciones Integrales JB

Plataforma educativa de **Soluciones Integrales JB S.A.C.** — *Tu mejor opción tecnológica*.
Cursos virtuales con módulos, lecciones en video, progreso real, recursos descargables,
certificados, blog y **JB Assist**, un asistente virtual con inteligencia artificial.

## Estructura

| Carpeta | Tecnología | Qué contiene |
|---|---|---|
| `bootcamp-frontend/` | Next.js 16 · React 19 · Tailwind 4 | Sitio público, área del alumno y panel admin |
| `bootcamp-backend/`  | NestJS 11 · TypeORM | API REST `/v1`, autenticación, cursos, progreso, reportes, IA |
| Base de datos | Supabase (PostgreSQL + Auth + Storage) | Datos, usuarios y archivos |

## Funcionalidades principales

- **Alumno:** catálogo, inscripción, reproductor de lecciones, progreso, recursos del curso, certificados.
- **Admin:** cursos, categorías, módulos y lecciones, usuarios y roles, blog, reportes y métricas.
- **JB Assist:** asistente con IA (Google Gemini, con respaldo opcional en Groq) que conoce los cursos reales de la plataforma.
- **Diseño:** paleta de la marca (cian `#00C0E7`, rojo `#E31E24`, negro) con modo claro y oscuro.

## Cómo ejecutarlo en local

Requisitos: Node.js 20 o superior.

```bash
# Backend
cd bootcamp-backend
cp .env.example .env        # y completa los valores
npm install
npm run start:dev           # http://localhost:3001  ·  Swagger: /api/docs

# Frontend (otra terminal)
cd bootcamp-frontend
cp .env.example .env.local  # y completa el valor
npm install
npm run dev                 # http://localhost:3000
```

## Variables de entorno

Las plantillas están en `bootcamp-backend/.env.example` y `bootcamp-frontend/.env.example`.
Los archivos `.env` reales **nunca** se suben al repositorio.

## Seguridad

- Row Level Security activado en todas las tablas públicas de Supabase.
- Las claves privadas (Supabase service role, JWT, Gemini) solo viven en el servidor.
- Validación de datos en todas las rutas de la API.
