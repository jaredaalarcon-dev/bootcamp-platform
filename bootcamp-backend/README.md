# bootcamp-backend

API REST (NestJS) de la Plataforma Bootcamp de Soluciones Integrales JB.

```bash
cp .env.example .env   # completa los valores
npm install
npm run start:dev      # desarrollo: http://localhost:3001
npm run build && npm run start:prod   # producción
```

- Documentación interactiva (Swagger): `http://localhost:3001/api/docs`
- Todas las rutas usan el prefijo de versión `/v1`.
- Datos de ejemplo: `npm run seed`
- Material de los cursos (guías PDF y kits ZIP): `npm run material:cargar` (usa `-- --revisar` para ver antes qué haría, o `-- --actualizar` para reemplazar versiones anteriores)

Módulos: `auth`, `courses` (cursos, módulos, lecciones, videos), `enrollments`, `progress`,
`certificates`, `resources`, `upload`, `blog`, `admin` (estadísticas y reportes), `assistant` (JB Assist).
