# Automatizaciones con n8n

La plataforma se conecta con **n8n** para automatizar tareas sin programar: enviar correos,
mensajes de Telegram o WhatsApp, guardar datos en Google Sheets, etc.

Funciona en dos direcciones:

| Dirección | Qué hace |
|---|---|
| **Plataforma → n8n** | Cada vez que pasa algo importante, la plataforma envía un *evento* a tu flujo de n8n. |
| **n8n → Plataforma** | n8n puede enviar notificaciones a los alumnos (por ejemplo, recordatorios) y consultar quién lleva días sin avanzar. |

> Es **opcional**. Si no configuras nada, la plataforma funciona exactamente igual.

---

## 1. Dónde tener n8n

| Opción | Costo | Comentario |
|---|---|---|
| **n8n Cloud** (n8n.io) | Prueba gratis, luego de pago | Lo más fácil: siempre encendido, sin instalar nada. |
| **Tu propio servidor (VPS)** con Docker | Desde ~US$ 5/mes | n8n es gratis; solo pagas el servidor. |
| **Tu PC** (`npx n8n`) | Gratis | Solo para probar: funciona mientras la PC esté prendida. |

> Render gratis **no** sirve para n8n: se duerme y borra sus datos al reiniciar.

---

## 2. Eventos que envía la plataforma

| Evento | Cuándo |
|---|---|
| `alumno.registrado` | Un alumno nuevo creó su cuenta |
| `curso.inscripcion` | Un alumno se inscribió en un curso |
| `curso.completado` | Un alumno completó el 100 % de un curso |
| `examen_final.aprobado` | Un alumno aprobó el examen final (constancia habilitada) |
| `pregunta.nueva` | Un alumno preguntó en una lección |
| `pregunta.respondida` | El equipo respondió una pregunta |
| `resena.nueva` | Un alumno calificó un curso |
| `pago.confirmado` | Se confirmó el pago de un certificado oficial |
| `curso.publicado` | Se publicó un curso nuevo |
| `reclamo.nuevo` | Llegó una hoja al Libro de Reclamaciones |

Cada evento llega como `POST` con este formato:

```json
{
  "id": "…",
  "evento": "pregunta.nueva",
  "descripcion": "Un alumno hizo una pregunta en una lección",
  "fecha": "2026-11-26T14:03:00.000Z",
  "plataforma": "SIJB Bootcamp",
  "datos": { "alumno": "María Q.", "curso": "Laravel", "leccion": "Clase 1", "pregunta": "…" }
}
```

Cabeceras de seguridad:
- `x-sijb-key`: tu clave secreta (`N8N_WEBHOOK_SECRET`).
- `x-sijb-signature`: firma HMAC-SHA256 del cuerpo con esa misma clave.

---

## 3. Paso a paso

### 3.1 Importar los flujos listos

En la carpeta [`n8n/`](../n8n) hay dos flujos:

| Archivo | Qué hace |
|---|---|
| `SIJB-avisos-por-correo.json` | Recibe los eventos y envía correos: al equipo (reclamos, preguntas, reseñas, alumnos nuevos) y a los alumnos (bienvenida, examen aprobado, pago confirmado, respuesta a su pregunta). |
| `SIJB-recordatorio-alumnos-inactivos.json` | Todos los días a las 9:00 busca a quienes llevan 7 días sin avanzar y les deja un aviso en la campana de la plataforma. |

En n8n: **Workflows → ⋯ → Import from File** y elige el archivo.

### 3.2 Configurar el flujo de correos

1. Abre el nodo **Preparar correo** y cambia, al inicio del código:
   - `CLAVE`: la misma clave que pondrás en Render como `N8N_WEBHOOK_SECRET` (inventa una larga, por ejemplo de 40 caracteres).
   - `CORREO_ADMIN`: el correo que recibirá los avisos del equipo.
2. Abre el nodo **Enviar correo** y crea la credencial **SMTP** de tu correo (Gmail necesita una *contraseña de aplicación*). Cambia también el remitente (`From Email`).
3. Abre el nodo **Eventos SIJB** y copia la **Production URL**.
4. Activa el flujo (interruptor **Active**).

### 3.3 Conectar la plataforma (Render)

En **Render → tu servicio → Environment** agrega:

| Variable | Valor |
|---|---|
| `N8N_WEBHOOK_URL` | La Production URL que copiaste |
| `N8N_WEBHOOK_SECRET` | La misma clave que pusiste en `CLAVE` |
| `N8N_API_KEY` | *(Opcional, para el flujo de recordatorios)* otra clave larga distinta |

Guarda: Render se reinicia solo.

### 3.4 Probar

Panel admin → **Configuración** → *Automatizaciones con n8n* → **Enviar evento de prueba**.
Debe llegarte el correo «✅ Prueba de n8n».

### 3.5 Recordatorios (opcional)

1. Importa `SIJB-recordatorio-alumnos-inactivos.json`.
2. En los dos nodos HTTP cambia `PEGA_AQUI_TU_N8N_API_KEY` por tu `N8N_API_KEY`.
3. Activa el flujo.

---

## 4. API para n8n

Todas las llamadas llevan la cabecera `x-sijb-key: <N8N_API_KEY>`.

**Enviar una notificación**: `POST /v1/integrations/n8n/notify`

```json
{ "para": "usuario", "usuario": "correo@alumno.com", "titulo": "¡Nuevo taller!", "mensaje": "Este sábado…", "enlace": "/courses" }
```

- `para`: `"usuario"` (un alumno, por correo o id) o `"todos"`.
- `enlace`: ruta de la plataforma (empieza con `/`). Opcional.
- `clave`: opcional; evita enviar dos veces el mismo aviso.

**Alumnos inactivos**: `GET /v1/integrations/n8n/inactive-students?dias=7`

Devuelve a los alumnos con cursos sin terminar que no avanzan desde hace N días.

---

## 5. Ideas de automatizaciones

- Aviso por **Telegram** al equipo cuando llega un reclamo (nodo *Telegram*).
- Registrar cada inscripción en **Google Sheets** para un reporte semanal.
- Enviar por **WhatsApp** (con la API de WhatsApp Business) la felicitación cuando aprueban el examen final.
- Publicar en redes sociales cuando sale un curso nuevo (`curso.publicado`).
