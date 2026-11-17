# bootcamp-frontend

Frontend (Next.js) de la Plataforma Bootcamp de Soluciones Integrales JB.

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:3001/v1
npm install
npm run dev                  # http://localhost:3000
npm run build && npm start   # producción
```

- `app/` — páginas (público, alumno y `admin/`)
- `components/` — interfaz (`ui/`, `admin/`, `assistant/` = JB Assist)
- `hooks/` — llamadas a la API por módulo
- `lib/api-client.ts` — cliente HTTP con renovación automática de sesión
