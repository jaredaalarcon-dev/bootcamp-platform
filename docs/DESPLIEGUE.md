# Guía de despliegue · SIJB Bootcamp

Cómo publicar la plataforma **gratis**:

| Parte | Dónde | Plan |
|---|---|---|
| Frontend (Next.js) | **Vercel** | Hobby (gratis) |
| Backend (NestJS) | **Render** | Free |
| Base de datos, login y archivos | **Supabase** (el mismo proyecto que usas hoy) | Free |
| Mantenerlo despierto | **GitHub Actions** (+ cron-job.org opcional) | Gratis |

> Orden recomendado: **1 → 2 → 3 → 4 → 5**. Toma unos 30–40 minutos la primera vez.

---

## 0. Antes de empezar

1. En tu PC, en cada carpeta, ejecuta `npm install` y prueba que todo funcione en local.
2. Sube todo a GitHub (`git add .` → `git commit -m "..."` → `git push`).
3. Ten a mano tu archivo `bootcamp-backend/.env`: vas a copiar sus valores en Render.
4. Decide el nombre del proyecto en Vercel. Ejemplo: **sijb-bootcamp** → tu web será
   `https://sijb-bootcamp.vercel.app`. Lo usaremos desde el paso 1.

---

## 1. Backend en Render

1. Entra a **render.com** con tu cuenta de GitHub.
2. **New → Blueprint** → elige el repositorio `bootcamp-platform` → **Connect**.
   Render lee el archivo `render.yaml` y crea el servicio `sijb-bootcamp-api`.
3. Te pedirá las variables secretas. Cópialas de tu `.env`:

   | Variable | Valor |
   |---|---|
   | `FRONTEND_URL` | `https://sijb-bootcamp.vercel.app` (la URL que tendrá Vercel) |
   | `DATABASE_URL` | igual que en tu `.env` |
   | `SUPABASE_URL` | igual que en tu `.env` |
   | `SUPABASE_KEY` | igual que en tu `.env` |
   | `SUPABASE_SERVICE_ROLE_KEY` | igual que en tu `.env` |
   | `JWT_SECRET` | igual que en tu `.env` |
   | `GEMINI_API_KEY` | igual que en tu `.env` |

4. **Apply**. La primera compilación tarda unos minutos.
5. Copia la URL del servicio (ej. `https://sijb-bootcamp-api.onrender.com`) y ábrela con
   `/health` al final. Debe mostrar: `{"status":"ok","database":"ok",...}`

> 💡 Si más adelante cambias una variable: Render → tu servicio → **Environment** → editar →
> **Save, rebuild and deploy**.

---

## 2. Frontend en Vercel

1. Entra a **vercel.com** con tu cuenta de GitHub.
2. **Add New… → Project** → importa `bootcamp-platform`.
3. Configura:
   - **Project Name:** `sijb-bootcamp` (el que elegiste en el paso 0)
   - **Root Directory:** `bootcamp-frontend` ← importante
   - **Environment Variables:**

     | Variable | Valor |
     |---|---|
     | `NEXT_PUBLIC_API_URL` | `https://sijb-bootcamp-api.onrender.com/v1` (tu URL de Render + `/v1`) |
     | `NEXT_PUBLIC_SITE_URL` | `https://sijb-bootcamp.vercel.app` |

4. **Deploy**. Al terminar, abre la URL.
5. Activa las analíticas: proyecto en Vercel → pestaña **Analytics** → **Enable**.

> ⚠️ Si la URL final de Vercel es distinta a la que pusiste en `FRONTEND_URL` (paso 1),
> cámbiala en Render. Si no coincide, el navegador bloquea las peticiones (error de CORS).

---

## 3. Supabase: avisarle la nueva dirección

Para que el correo de confirmación de cuenta lleve a tu web publicada:

1. Supabase → tu proyecto → **Authentication → URL Configuration**.
2. **Site URL:** `https://sijb-bootcamp.vercel.app`
3. **Redirect URLs:** agrega `https://sijb-bootcamp.vercel.app/**`
   (deja también `http://localhost:3000/**` para seguir probando en tu PC).

> La base de datos es la misma que usas en tu PC: los cursos, alumnos y material ya están.
> En producción el backend **no crea tablas solo** (por seguridad). Si en el futuro agregas
> tablas nuevas, ejecuta una vez el backend en tu PC (modo desarrollo) y se crearán.
> Para una base de datos nueva desde cero existe `bootcamp-backend/database/schema.sql`.

---

## 4. Mantenerlo despierto (keep-alive)

En el plan gratis, Render apaga el backend tras 15 minutos sin visitas y tarda cerca de
un minuto en volver. Para evitarlo:

**A. GitHub Actions (ya incluido en el proyecto)**
1. GitHub → tu repositorio → **Settings → Secrets and variables → Actions → Variables**.
2. **New repository variable** → Nombre `BACKEND_URL` → Valor `https://sijb-bootcamp-api.onrender.com`
3. Pestaña **Actions** → **Keep-alive** → **Run workflow** para probarlo (debe salir ✔).

**B. cron-job.org (recomendado como respaldo, más puntual)**
1. Crea una cuenta gratis en **cron-job.org**.
2. **Create cronjob** → URL `https://sijb-bootcamp-api.onrender.com/health` → cada **10 minutos** → Guardar.

> Cada visita también consulta la base de datos, así Supabase no pausa el proyecto por inactividad.

---

## 5. Revisión final ✅

- [ ] `https://…onrender.com/health` responde `"status":"ok"`.
- [ ] La web abre, cambia entre modo claro y oscuro y JB Assist responde.
- [ ] Puedo **registrarme**, me llega el correo de confirmación y veo la pantalla de bienvenida.
- [ ] Puedo **iniciar sesión** como alumno y como admin.
- [ ] Un curso muestra sus videos y la pestaña **Recursos** (guía y kit).
- [ ] `/libro-de-reclamaciones` registra una hoja de prueba y aparece en el panel admin.
- [ ] `/verificar`, `/terminos`, `/privacidad` y `/sitemap.xml` abren bien.
- [ ] Una dirección que no existe muestra la página 404 de la marca.
- [ ] En un curso: preguntar en una lección, resolver un cuestionario y dejar una reseña.
- [ ] La campana muestra las notificaciones y el admin ve las preguntas en **Preguntas y Reseñas**.

### Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| La web carga pero no inicia sesión / "Network Error" | `NEXT_PUBLIC_API_URL` mal escrita (debe terminar en `/v1`) o `FRONTEND_URL` en Render no coincide con la URL de Vercel. Tras corregir en Vercel: **Deployments → Redeploy**. |
| La primera visita tarda ~1 minuto | El backend estaba dormido: revisa el keep-alive (paso 4). |
| Render dice "FRONTEND_URL es obligatorio" o "JWT_SECRET es obligatorio" | Falta esa variable en Render → Environment. |
| El enlace del correo de confirmación lleva a localhost | Falta el paso 3 (Site URL en Supabase). |
| `/health` dice `"database":"error"` | `DATABASE_URL` incorrecta en Render. |
| Error al abrir notificaciones, preguntas, reseñas o cuestionarios (`relation "notifications" does not exist`) | Falta ejecutar `database/2026-11-comunidad.sql` en Supabase (ver «Actualizaciones de la base de datos»). |

---

## Actualizaciones de la base de datos

En producción el backend **no crea tablas solo** (así no puede borrar datos por error).
Cuando una actualización trae tablas nuevas, se agregan una sola vez desde Supabase,
**antes** de subir el código:

1. Supabase → **SQL Editor** → **New query**.
2. Copia y pega todo el archivo indicado → **Run**. Debe decir *Success*.
3. Recién después haz `git push` (Render y Vercel se actualizan solos).

| Fecha | Archivo | Qué agrega |
|---|---|---|
| Nov. 2026 | `bootcamp-backend/database/2026-11-comunidad.sql` | Notificaciones, preguntas por lección, reseñas y cuestionarios (6 tablas) |

> Los archivos se pueden ejecutar más de una vez sin problema: no borran ni cambian datos.

---

## 6. Más adelante: pasar a cPanel

Cuando la empresa tenga un hosting con **cPanel**, se puede mover el frontend y el backend
allí. **Supabase se queda igual** (base de datos, login y archivos en la nube), así no hay que
migrar datos.

**Requisito del hosting:** que cPanel tenga **"Setup Node.js App"** con Node.js **20 o superior**.
Muchos planes compartidos básicos no lo incluyen: pregúntale al proveedor antes de contratar.

### Frontend
En tu PC, dentro de `bootcamp-frontend`, crea un archivo `.env.production.local` con:
```
NEXT_PUBLIC_API_URL=https://api.tudominio.com/v1
NEXT_PUBLIC_SITE_URL=https://tudominio.com
```
y ejecuta:
```
npm run build:cpanel
```
Se crea la carpeta **`deploy-cpanel/`**. Súbela al servidor y en **Setup Node.js App**:
- Application startup file: `server.js`
- Variable: `NODE_ENV=production`
- Pulsa **Restart**. (Instrucciones también en `deploy-cpanel/LEEME-CPANEL.txt`.)

### Backend
1. En tu PC, dentro de `bootcamp-backend`: `npm run build` (crea la carpeta `dist/`).
2. Sube al servidor: `dist/`, `package.json`, `package-lock.json` y `material-cursos/`.
3. En **Setup Node.js App** crea otra aplicación (por ejemplo en el subdominio `api.tudominio.com`):
   - Application startup file: `dist/main.js`
   - Variables de entorno: las mismas del paso 1 (con `FRONTEND_URL=https://tudominio.com`)
   - Pulsa **Run NPM Install** y luego **Restart**.
4. Prueba `https://api.tudominio.com/health`.
5. Actualiza **Site URL** en Supabase (paso 3) con tu dominio.

> El keep-alive no hace falta en cPanel (no se apaga), pero no estorba si lo dejas.
