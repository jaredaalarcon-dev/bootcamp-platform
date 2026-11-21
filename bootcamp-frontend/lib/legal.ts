// src/lib/legal.ts
// Textos legales de la plataforma: Términos y Condiciones y Política de Privacidad.
// ⚠ Texto base: debe revisarlo la empresa (idealmente un abogado) antes de publicarse.
// Si cambias cualquier texto, sube TERMS_VERSION aquí y en el backend
// (src/legal/legal.constants.ts): a todos se les volverá a pedir aceptar.

import { WHATSAPP_VISIBLE, enlaceWhatsApp } from "./social";

export const TERMS_VERSION = "2026-11-17";
export const TERMS_FECHA = "17 de noviembre de 2026";

export const EMPRESA = {
  titular: "Wilder Florentino Julca Broncano",
  ruc: "10410697551",
  nombreComercial: "Soluciones Integrales JB",
  correo: "consultas@solucionesintegralesjb.com",
  direccion: "Calle López de Zúñiga 547, Chancay, Huaral, Lima (C.P. 15131)",
  direccionCorta: "C. López de Zúñiga 547, Chancay 15131",
  mapa: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Calle López de Zúñiga 547, Chancay 15131, Perú"),
  whatsapp: WHATSAPP_VISIBLE,
  whatsappLink: enlaceWhatsApp(),
  plataforma: "Plataforma Bootcamp de Soluciones Integrales JB",
};

export interface SeccionLegal {
  id: string;
  titulo: string;
  parrafos?: string[];
  lista?: string[];
  nota?: string;
}

const E = EMPRESA;

export const TERMINOS: SeccionLegal[] = [
  {
    id: "quienes-somos",
    titulo: "Quiénes somos",
    parrafos: [
      `La ${E.plataforma} (en adelante, «la Plataforma») es operada por ${E.titular}, con RUC ${E.ruc} y domicilio en ${E.direccion}, que desarrolla sus actividades con el nombre comercial «${E.nombreComercial}» (en adelante, «la Empresa»).`,
      `Puedes comunicarte con nosotros al correo ${E.correo} o por WhatsApp al ${E.whatsapp}.`,
    ],
  },
  {
    id: "aceptacion",
    titulo: "Aceptación de los términos",
    parrafos: [
      "Al crear una cuenta o usar la Plataforma declaras que leíste y aceptas estos Términos y Condiciones y la Política de Privacidad. Si no estás de acuerdo, no debes usar la Plataforma.",
      "Guardamos la fecha y la versión de los términos que aceptaste. Cuando los actualicemos, te pediremos aceptarlos nuevamente al iniciar sesión.",
      "Si eres menor de 14 años, solo puedes registrarte con la autorización de tu madre, padre o tutor, quien será responsable del uso de la cuenta.",
    ],
  },
  {
    id: "cuenta",
    titulo: "Tu cuenta",
    lista: [
      "Debes registrarte con datos verdaderos y mantenerlos actualizados. Tu nombre se usará en los certificados y constancias.",
      "La cuenta es personal e intransferible: no puedes compartirla, venderla ni prestarla.",
      "Eres responsable de cuidar tu contraseña y de lo que se haga con tu cuenta. Si sospechas un uso no autorizado, avísanos de inmediato.",
      "Puedes solicitar la eliminación de tu cuenta en cualquier momento escribiendo a nuestro correo.",
    ],
  },
  {
    id: "cursos",
    titulo: "Cursos y acceso al contenido",
    lista: [
      "La Plataforma ofrece cursos gratuitos y cursos de pago. En cada curso se indica su modalidad.",
      "Los cursos se desarrollan de forma virtual y a tu propio ritmo, mediante lecciones en video y recursos descargables.",
      "La Plataforma registra tu avance automáticamente para mostrarte tu progreso.",
      "La Empresa puede actualizar, mejorar o reorganizar el contenido de los cursos para mantenerlo vigente.",
    ],
  },
  {
    id: "pagos",
    titulo: "Pagos",
    lista: [
      `Los pagos de los cursos se coordinan directamente con la Empresa por WhatsApp (${E.whatsapp}), donde se te indicará el precio, los medios de pago disponibles y el comprobante correspondiente.`,
      "El acceso a los beneficios de un curso de pago se habilita cuando la Empresa confirma la recepción del pago.",
      "Antes de pagar, la Empresa te informará las condiciones aplicables, incluidas las de cambios o devoluciones.",
      "La Plataforma no solicita ni almacena datos de tarjetas de crédito o débito. Nunca compartas esos datos por el chat de la Plataforma.",
    ],
  },
  {
    id: "certificados",
    titulo: "Certificados y constancias",
    lista: [
      "Al completar el 100 % de un curso puedes descargar gratis una constancia de culminación.",
      `El certificado oficial tiene costo. Se solicita por WhatsApp (${E.whatsapp}) y se habilita en tu cuenta cuando la Empresa confirma el pago.`,
      "Para emitir el certificado debes registrar en «Mi perfil» tu nombre completo tal como figura en tu documento de identidad, el número de ese documento y una foto formal. Eres responsable de que esos datos sean verdaderos.",
      "Cada documento incluye un código único que permite verificar su autenticidad.",
      "Está prohibido alterar, falsificar o presentar como propios certificados o constancias de otra persona. La Empresa podrá anular los documentos obtenidos de forma indebida.",
    ],
  },
  {
    id: "propiedad",
    titulo: "Propiedad intelectual",
    parrafos: [
      "Los videos, textos, guías, imágenes, logotipos y demás contenidos de la Plataforma pertenecen a la Empresa o se usan con autorización de sus titulares, y están protegidos por las normas de propiedad intelectual.",
      "Se te otorga un permiso personal, limitado y no exclusivo para ver los contenidos con fines de estudio. No está permitido grabar, descargar (salvo los recursos habilitados para descarga), copiar, compartir, publicar ni vender los contenidos sin autorización escrita de la Empresa.",
    ],
  },
  {
    id: "uso",
    titulo: "Uso adecuado de la Plataforma",
    parrafos: ["Al usar la Plataforma te comprometes a no:"],
    lista: [
      "Intentar acceder a cuentas, datos o zonas restringidas, ni vulnerar la seguridad del sistema.",
      "Usar programas automáticos para copiar contenidos o saturar el servicio.",
      "Publicar o enviar contenido ilegal, ofensivo, discriminatorio o que afecte derechos de terceros.",
      "Usar la Plataforma para fines distintos al aprendizaje.",
    ],
  },
  {
    id: "jb-assist",
    titulo: "Asistente virtual JB Assist",
    lista: [
      "JB Assist es un asistente virtual que responde automáticamente mediante inteligencia artificial, usando la información de la Plataforma.",
      "Sus respuestas son orientativas y pueden contener errores. Ante cualquier duda, prevalece la información oficial de la Empresa.",
      "No compartas datos sensibles con el asistente (contraseñas, número de documento, datos bancarios o de salud).",
      "Las conversaciones se guardan para dar continuidad a la atención y mejorar el servicio, según la Política de Privacidad.",
    ],
  },
  {
    id: "suspension",
    titulo: "Suspensión de cuentas",
    parrafos: [
      "La Empresa puede suspender o cancelar una cuenta que incumpla estos términos, especialmente en casos de cuentas compartidas, copia o distribución de contenidos, o intentos de vulnerar la seguridad.",
    ],
  },
  {
    id: "responsabilidad",
    titulo: "Disponibilidad y responsabilidad",
    lista: [
      "Trabajamos para que la Plataforma esté disponible de forma continua, pero puede haber interrupciones por mantenimiento, fallas técnicas o causas ajenas a la Empresa.",
      "Algunos contenidos se muestran mediante servicios de terceros (por ejemplo, videos de YouTube), que tienen sus propias condiciones.",
      "Los cursos buscan desarrollar tus conocimientos; los resultados dependen de tu dedicación y no garantizan un empleo u otro resultado específico.",
    ],
  },
  {
    id: "cambios",
    titulo: "Cambios en los términos",
    parrafos: [
      "Podemos actualizar estos términos para reflejar mejoras de la Plataforma o cambios normativos. Publicaremos la nueva versión con su fecha y te pediremos aceptarla al iniciar sesión.",
    ],
  },
  {
    id: "ley",
    titulo: "Ley aplicable y reclamos",
    parrafos: [
      "Estos términos se rigen por las leyes de la República del Perú, incluido el Código de Protección y Defensa del Consumidor (Ley N.° 29571).",
      `Si tienes una consulta o un reclamo, escríbenos a ${E.correo}. También puedes acudir a las autoridades competentes, como el INDECOPI.`,
    ],
  },
];

export const PRIVACIDAD: SeccionLegal[] = [
  {
    id: "responsable",
    titulo: "Responsable de tus datos",
    parrafos: [
      `El responsable del tratamiento de tus datos personales es ${E.titular}, con RUC ${E.ruc}, nombre comercial «${E.nombreComercial}», con domicilio en ${E.direccion}. Contacto: ${E.correo} · WhatsApp ${E.whatsapp}.`,
      "Tratamos tus datos conforme a la Ley N.° 29733, Ley de Protección de Datos Personales, y su Reglamento.",
    ],
  },
  {
    id: "datos",
    titulo: "Qué datos recopilamos",
    lista: [
      "Datos de identificación y contacto: nombre, apellido y correo electrónico.",
      "Datos de acceso: tu contraseña, que se guarda cifrada y nadie de la Empresa puede ver.",
      "Datos académicos: cursos en los que te inscribes, avance, lecciones completadas, certificados y constancias.",
      "Datos para tu certificado, solo si decides registrarlos: nombre completo, tipo y número de documento de identidad y una foto formal. La foto se guarda en un almacenamiento privado y solo se usa en tu certificado.",
      "Si usas el Libro de Reclamaciones: nombre, documento, domicilio, teléfono, correo y el detalle de tu reclamo o queja, que usamos solo para atenderlo y conservar el registro que exige la ley.",
      "Estado de pago del certificado (pagado o pendiente). Los pagos se coordinan por WhatsApp; la Plataforma no guarda datos bancarios ni de tarjetas.",
      "Mensajes que escribes al asistente JB Assist.",
      "Datos técnicos: dirección IP, tipo de navegador y la fecha en que aceptaste estos documentos.",
    ],
  },
  {
    id: "finalidades",
    titulo: "Para qué usamos tus datos",
    lista: [
      "Crear y administrar tu cuenta.",
      "Darte acceso a los cursos y registrar tu avance.",
      "Emitir y verificar tus certificados o constancias. En la verificación pública solo se muestran tu nombre, el curso, la fecha y los últimos 4 dígitos de tu documento.",
      "Responder tus consultas por correo, WhatsApp o mediante JB Assist.",
      "Enviarte comunicaciones necesarias del servicio, como el correo de bienvenida o avisos sobre tu cuenta.",
      "Proteger la seguridad de la Plataforma y prevenir fraudes.",
      "Elaborar estadísticas internas para mejorar los cursos.",
    ],
    nota: "No vendemos tus datos ni te enviamos publicidad sin tu consentimiento.",
  },
  {
    id: "consentimiento",
    titulo: "Tu consentimiento",
    parrafos: [
      "Al registrarte y marcar la casilla de aceptación, nos das tu consentimiento libre, previo, expreso e informado para tratar tus datos con las finalidades indicadas. Puedes revocarlo en cualquier momento escribiéndonos; si lo haces, ya no podremos brindarte el servicio que dependa de esos datos.",
    ],
  },
  {
    id: "terceros",
    titulo: "Con quién compartimos tus datos",
    parrafos: [
      "Para que la Plataforma funcione usamos proveedores tecnológicos que tratan los datos por encargo nuestro y con medidas de seguridad:",
    ],
    lista: [
      "Supabase: base de datos, autenticación y almacenamiento de archivos.",
      "Google (Gemini): procesa los mensajes que escribes a JB Assist para generar las respuestas.",
      "Vercel: alojamiento de la página web y estadísticas anónimas de visitas (Vercel Web Analytics, sin cookies).",
      "Proveedores de alojamiento web y de envío de correos.",
    ],
    nota: "Algunos de estos proveedores tienen servidores fuera del Perú, por lo que tus datos pueden almacenarse o procesarse en otros países (transferencia internacional), siempre con medidas para protegerlos.",
  },
  {
    id: "conservacion",
    titulo: "Cuánto tiempo los guardamos",
    parrafos: [
      "Conservamos tus datos mientras tengas una cuenta activa y, después, solo durante el tiempo necesario para cumplir las finalidades indicadas, verificar certificados emitidos o atender obligaciones legales.",
    ],
  },
  {
    id: "seguridad",
    titulo: "Cómo protegemos tus datos",
    lista: [
      "Conexiones cifradas (HTTPS).",
      "Contraseñas cifradas y sesiones con tokens que vencen.",
      "Acceso a la base de datos restringido por reglas de seguridad por usuario.",
      "Acceso del personal limitado a lo necesario para su función.",
    ],
  },
  {
    id: "derechos",
    titulo: "Tus derechos",
    parrafos: [
      "Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, cancelación y oposición (derechos ARCO), así como revocar tu consentimiento.",
      `Para hacerlo, escribe a ${E.correo} con el asunto «Derechos ARCO», indicando tu nombre, el correo de tu cuenta y tu solicitud, y adjunta un documento que acredite tu identidad. Responderemos dentro de los plazos que establece la ley.`,
      "Si consideras que no atendimos tu solicitud, puedes presentar un reclamo ante la Autoridad Nacional de Protección de Datos Personales del Ministerio de Justicia y Derechos Humanos.",
    ],
  },
  {
    id: "menores",
    titulo: "Menores de edad",
    parrafos: [
      "Los menores de 14 años solo pueden usar la Plataforma con el consentimiento de su madre, padre o tutor. Si detectamos datos de un menor registrados sin esa autorización, los eliminaremos.",
    ],
  },
  {
    id: "almacenamiento",
    titulo: "Almacenamiento en tu navegador",
    parrafos: [
      "La Plataforma guarda en tu navegador la información necesaria para funcionar: tu sesión, tu preferencia de modo claro u oscuro y la conversación reciente con JB Assist. No usamos cookies publicitarias ni de rastreo.",
      "Para mejorar la Plataforma medimos visitas de forma anónima y agregada (páginas vistas, país y tipo de dispositivo) con Vercel Web Analytics, que no usa cookies ni nos permite identificarte.",
    ],
  },
  {
    id: "cambios-privacidad",
    titulo: "Cambios en esta política",
    parrafos: [
      "Si actualizamos esta política, publicaremos la nueva versión con su fecha y te pediremos aceptarla al iniciar sesión.",
    ],
  },
];
