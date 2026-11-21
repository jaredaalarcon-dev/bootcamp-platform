// src/assistant/engine/intenciones.ts
// Base de conocimiento fija del chatbot: cada "intención" es un tema con
// frases de ejemplo, la respuesta y botones de acción. Responde al instante,
// sin usar IA. Para agregar un tema nuevo, copia un bloque y cambia los textos.
// (Las preguntas frecuentes que crea el admin se suman a estas desde la base de datos.)

export const CONTACTO = {
  whatsapp: '+51 943 014 618',
  correo: 'consultas@solucionesintegralesjb.com',
};

export type Accion =
  | { tipo: 'respuesta'; etiqueta: string; intent: string }
  | { tipo: 'enlace'; etiqueta: string; url: string }
  | { tipo: 'whatsapp'; etiqueta: string; texto: string };

export interface CursoInfo {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  modulos: number;
  lecciones: number;
}

export interface Contexto {
  nombre?: string;
  cursos: CursoInfo[];
}

export interface Intencion {
  id: string;
  titulo: string;
  categoria: 'cursos' | 'certificados' | 'cuenta' | 'tecnico' | 'contacto' | 'charla';
  ejemplos: string[];
  /** Palabras que, si aparecen, suman puntos a esta intención */
  claves?: string[];
  respuesta: string | ((ctx: Contexto) => string);
  acciones?: Accion[] | ((ctx: Contexto) => Accion[]);
}

const W = CONTACTO.whatsapp;
const wa = (etiqueta: string, texto: string): Accion => ({ tipo: 'whatsapp', etiqueta, texto });
const ir = (etiqueta: string, url: string): Accion => ({ tipo: 'enlace', etiqueta, url });
const ver = (etiqueta: string, intent: string): Accion => ({ tipo: 'respuesta', etiqueta, intent });
const hola = (ctx: Contexto) => (ctx.nombre ? `, ${ctx.nombre}` : '');

export const INTENCIONES: Intencion[] = [
  // ═══════════════════════════ Conversación ═══════════════════════════
  {
    id: 'saludo',
    titulo: 'Saludo',
    categoria: 'charla',
    ejemplos: ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'que tal', 'saludos'],
    respuesta: (ctx) =>
      `¡Hola${hola(ctx)}! 👋 Soy **JB Assist**. Te ayudo con cursos, inscripción, certificados y cualquier duda de la plataforma. ¿Qué necesitas?`,
    acciones: [ver('Ver cursos', 'cursos_lista'), ver('Certificados', 'certificado_vs_constancia'), ver('Cómo me inscribo', 'inscripcion')],
  },
  {
    id: 'gracias',
    titulo: 'Agradecimiento',
    categoria: 'charla',
    ejemplos: ['gracias', 'muchas gracias', 'mil gracias', 'te agradezco', 'genial gracias', 'perfecto gracias', 'excelente'],
    respuesta: '¡Con gusto! 😊 Si tienes otra duda, aquí estoy.',
    acciones: [ver('Ayuda rápida', 'menu')],
  },
  {
    id: 'despedida',
    titulo: 'Despedida',
    categoria: 'charla',
    ejemplos: ['adios', 'chau', 'chao', 'hasta luego', 'nos vemos', 'bye', 'hasta pronto'],
    respuesta: '¡Hasta pronto! Que te vaya muy bien con tus cursos. 🚀',
  },
  {
    id: 'identidad',
    titulo: '¿Quién eres?',
    categoria: 'charla',
    ejemplos: ['quien eres', 'que eres', 'eres un robot', 'eres humano', 'eres una ia', 'como te llamas', 'que puedes hacer'],
    respuesta:
      'Soy **JB Assist**, el asistente de la plataforma Bootcamp de Soluciones Integrales JB. Respondo al instante las dudas más comunes (cursos, inscripción, certificados, tu cuenta) y, si la pregunta es más específica, uso inteligencia artificial. Para pagos o casos particulares te derivo con una persona por WhatsApp.',
    acciones: [ver('Ayuda rápida', 'menu'), wa('Hablar con una persona', 'Hola, vengo de la plataforma Bootcamp y quiero hablar con una persona.')],
  },
  {
    id: 'menu',
    titulo: 'Menú de ayuda',
    categoria: 'charla',
    ejemplos: ['ayuda', 'menu', 'opciones', 'en que me ayudas', 'necesito ayuda', 'temas', 'no se que hacer', 'info', 'informacion', 'quiero informacion'],
    respuesta: 'Elige un tema y te respondo al instante 👇',
    acciones: [
      ver('Cursos', 'cursos_lista'),
      ver('Inscripción', 'inscripcion'),
      ver('Certificados', 'certificado_vs_constancia'),
      ver('Pagos', 'pagar_certificado'),
      ver('Mi cuenta', 'olvide_contrasena'),
      ver('Problemas técnicos', 'video_no_carga'),
      ver('Contacto', 'contacto'),
    ],
  },

  // ═══════════════════════════ Cursos ═══════════════════════════
  {
    id: 'cursos_lista',
    titulo: '¿Qué cursos hay?',
    categoria: 'cursos',
    ejemplos: ['que cursos tienen', 'cursos disponibles', 'lista de cursos', 'que puedo estudiar', 'catalogo de cursos', 'que enseñan', 'ver cursos', 'cursos'],
    claves: ['cursos', 'catalogo'],
    respuesta: (ctx) => {
      if (!ctx.cursos.length) return 'Por ahora estamos preparando los cursos. Muy pronto habrá nuevos; mientras tanto puedes escribirnos por WhatsApp.';
      const lista = ctx.cursos
        .slice(0, 8)
        .map((c) => `- **${c.titulo}**${c.categoria ? ` · ${c.categoria}` : ''}`)
        .join('\n');
      return `Estos son los cursos disponibles:\n${lista}\n\nToca uno para ver de qué trata, o entra a «Explorar cursos».`;
    },
    acciones: (ctx) => [
      ...ctx.cursos.slice(0, 4).map((c) => ver(c.titulo, `curso:${c.id}`)),
      ir('Explorar cursos', '/courses'),
    ],
  },
  {
    id: 'inscripcion',
    titulo: '¿Cómo me inscribo?',
    categoria: 'cursos',
    ejemplos: ['como me inscribo', 'como inscribirme', 'quiero inscribirme', 'matricula', 'como me matriculo', 'como empiezo un curso', 'como accedo a un curso', 'unirme a un curso'],
    claves: ['inscrib', 'matricul'],
    respuesta:
      'Inscribirte es muy fácil:\n1. Crea tu cuenta gratis en «Registrarse» (o inicia sesión).\n2. Entra a «Explorar cursos» y elige el que te guste.\n3. Pulsa **Inscribirme**.\n\nEl curso aparecerá en «Mis cursos» y tu avance se guarda solo.',
    acciones: [ir('Explorar cursos', '/courses'), ir('Crear cuenta', '/register'), ver('¿Tiene costo?', 'costo')],
  },
  {
    id: 'costo',
    titulo: '¿Cuánto cuesta?',
    categoria: 'cursos',
    ejemplos: ['cuanto cuesta', 'precio', 'es gratis', 'tiene costo', 'cuanto vale', 'precio del curso', 'cuanto pago', 'son gratuitos', 'costo del certificado', 'tienen descuentos', 'promociones', 'ofertas'],
    claves: ['precio', 'cuesta', 'costo', 'gratis', 'gratuito', 'descuento', 'promocion'],
    respuesta:
      'Puedes crear tu cuenta, inscribirte y avanzar los cursos desde la plataforma. Al terminar un curso:\n- La **constancia de culminación es gratis**.\n- El **certificado oficial** tiene un costo. El precio, los medios de pago y las promociones vigentes te los damos por WhatsApp.',
    acciones: [wa('Consultar precio', 'Hola, quiero saber el precio del certificado oficial del Bootcamp SIJB.'), ver('Constancia vs. certificado', 'certificado_vs_constancia')],
  },
  {
    id: 'modalidad',
    titulo: 'Modalidad y horarios',
    categoria: 'cursos',
    ejemplos: ['es virtual', 'es presencial', 'horario de clases', 'a que hora son las clases', 'cuanto dura el curso', 'duracion', 'clases en vivo', 'tengo que conectarme a una hora'],
    claves: ['virtual', 'presencial', 'horario', 'dura', 'duracion', 'vivo'],
    respuesta:
      'Los cursos son **100 % virtuales y a tu ritmo**: lecciones en video que ves cuando quieras, desde cualquier dispositivo. No hay horario fijo. La duración depende de ti; en «Mis cursos» ves tu avance.',
    acciones: [ir('Mis cursos', '/my-courses'), ver('¿Qué necesito?', 'requisitos')],
  },
  {
    id: 'requisitos',
    titulo: 'Requisitos',
    categoria: 'cursos',
    ejemplos: ['que necesito para el curso', 'requisitos', 'necesito saber programar', 'es para principiantes', 'nivel del curso', 'necesito experiencia'],
    claves: ['requisito', 'principiante', 'nivel', 'experiencia'],
    respuesta:
      'Solo necesitas una computadora (o celular) con internet y ganas de aprender. Cada curso indica su nivel en su descripción, y en la pestaña **Recursos** encontrarás la guía del curso con requisitos y herramientas a instalar.',
    acciones: [ir('Explorar cursos', '/courses'), ver('Material del curso', 'material')],
  },
  {
    id: 'material',
    titulo: 'Material y recursos',
    categoria: 'cursos',
    ejemplos: ['material del curso', 'donde estan los pdf', 'recursos del curso', 'guia del curso', 'descargar material', 'ejercicios', 'bibliografia', 'archivos del curso'],
    claves: ['material', 'pdf', 'recurso', 'guia', 'descargar', 'zip', 'ejercicio'],
    respuesta:
      'Dentro de cada curso, en la pestaña **Recursos**, encontrarás la guía del curso en PDF, ejercicios, kits de práctica (ZIP) y bibliografía. Solo los ven los alumnos inscritos.',
    acciones: [ir('Mis cursos', '/my-courses')],
  },

  // ═══════════════════════════ Certificados ═══════════════════════════
  {
    id: 'certificado_vs_constancia',
    titulo: 'Constancia vs. certificado',
    categoria: 'certificados',
    ejemplos: ['dan certificado', 'tienen certificado', 'certificado', 'constancia', 'que diferencia hay entre constancia y certificado', 'el certificado es gratis', 'me dan certificado al terminar', 'el curso tiene certificado'],
    claves: ['certificado', 'constancia', 'certifica'],
    respuesta:
      'Al completar el 100 % de un curso tienes dos opciones:\n- **Constancia de culminación**: gratis, la descargas al instante en «Certificados».\n- **Certificado oficial**: con tu foto y documento de identidad, y código de verificación. Tiene costo y se solicita por WhatsApp.',
    acciones: [ver('Cómo obtengo el certificado', 'obtener_certificado'), ir('Mis certificados', '/certificates')],
  },
  {
    id: 'obtener_certificado',
    titulo: 'Cómo obtener el certificado oficial',
    categoria: 'certificados',
    ejemplos: ['como obtengo el certificado', 'quiero mi certificado', 'como saco mi certificado', 'como consigo el certificado oficial', 'pasos para el certificado', 'solicitar certificado', 'tramitar certificado'],
    claves: ['obtener', 'solicitar', 'tramit', 'sacar'],
    respuesta:
      'Para tu **certificado oficial**:\n1. Completa el 100 % del curso.\n2. En «Mi perfil» registra tu nombre (como en tu documento), tu documento y una foto formal.\n3. Escríbenos por WhatsApp para coordinar el pago.\n4. Cuando confirmemos el pago, se habilita en «Certificados» para descargarlo en PDF.',
    acciones: [ir('Mi perfil', '/profile'), wa('Solicitar certificado', 'Hola, terminé un curso en el Bootcamp SIJB y quiero solicitar mi certificado oficial.')],
  },
  {
    id: 'pagar_certificado',
    titulo: 'Pagos',
    categoria: 'certificados',
    ejemplos: ['como pago', 'medios de pago', 'yape', 'plin', 'transferencia', 'pagar el certificado', 'como pago el certificado', 'pago del certificado', 'pague mi certificado', 'pagar con tarjeta', 'donde pago', 'formas de pago', 'ya pague', 'envie mi pago'],
    claves: ['pago', 'pague', 'yape', 'plin', 'transferencia', 'deposito', 'voucher'],
    respuesta: `Los pagos se coordinan **solo por WhatsApp** al ${W}: ahí te indicamos el precio, los medios de pago y te enviamos el comprobante. Si ya pagaste, envíanos tu constancia de pago por ese mismo chat y habilitamos tu certificado.\n\nPor seguridad, nunca compartas datos de tarjetas en este chat.`,
    acciones: [wa('Ir a WhatsApp', 'Hola, quiero coordinar el pago de mi certificado del Bootcamp SIJB.')],
  },
  {
    id: 'datos_certificado',
    titulo: 'Datos y foto del certificado',
    categoria: 'certificados',
    ejemplos: ['donde pongo mi foto', 'subir foto', 'mi nombre sale mal en el certificado', 'cambiar nombre del certificado', 'dni en el certificado', 'foto formal', 'corregir datos del certificado'],
    claves: ['foto', 'dni', 'nombre', 'documento', 'corregir'],
    respuesta:
      'En **Mi perfil** registras tu nombre completo tal como figura en tu documento, el número de documento y una foto formal (de frente, fondo claro). Si corriges tus datos, el certificado se actualiza con el mismo código.',
    acciones: [ir('Ir a Mi perfil', '/profile')],
  },
  {
    id: 'verificar_certificado',
    titulo: 'Verificar un certificado',
    categoria: 'certificados',
    ejemplos: ['verificar certificado', 'como verifico un certificado', 'el certificado es valido', 'comprobar autenticidad', 'codigo del certificado', 'validar constancia'],
    claves: ['verific', 'valid', 'autentic', 'comprobar'],
    respuesta:
      'Cada certificado y constancia tiene un código (por ejemplo, SIJB-CE-…). Cualquier persona puede comprobarlo en la página **Verificar certificado**, sin iniciar sesión.',
    acciones: [ir('Verificar certificado', '/verificar')],
  },
  {
    id: 'certificado_no_aparece',
    titulo: 'No aparece mi certificado',
    categoria: 'certificados',
    ejemplos: ['no me aparece el certificado', 'termine el curso y no me sale el certificado', 'no puedo descargar mi certificado', 'certificado bloqueado', 'termine y no tengo certificado', 'no sale mi constancia'],
    claves: ['aparece', 'bloquead', 'descargar'],
    respuesta:
      'Revisa esto:\n- Debes tener el curso al **100 %** (mira «Mi progreso»).\n- La constancia es gratis y sale al instante.\n- El certificado oficial aparece cuando confirmamos el pago y tienes completos tus datos y tu foto en «Mi perfil».\n\nSi todo está bien y aún no aparece, escríbenos por WhatsApp.',
    acciones: [ir('Mi progreso', '/my-progress'), ir('Mi perfil', '/profile'), wa('Reportar problema', 'Hola, terminé un curso pero no me aparece mi certificado en la plataforma Bootcamp.')],
  },

  // ═══════════════════════════ Cuenta ═══════════════════════════
  {
    id: 'registro',
    titulo: 'Crear cuenta',
    categoria: 'cuenta',
    ejemplos: ['como me registro', 'crear cuenta', 'registrarme', 'abrir cuenta', 'no tengo cuenta', 'como creo una cuenta'],
    claves: ['registr', 'cuenta'],
    respuesta: 'Entra a **Registrarse**, completa tu nombre, correo y contraseña, y acepta los Términos y la Política de Privacidad. ¡Listo! Ya puedes inscribirte en los cursos.',
    acciones: [ir('Crear cuenta', '/register'), ir('Iniciar sesión', '/login')],
  },
  {
    id: 'olvide_contrasena',
    titulo: 'Olvidé mi contraseña / no puedo entrar',
    categoria: 'cuenta',
    ejemplos: ['olvide mi contraseña', 'no puedo entrar', 'no puedo iniciar sesion', 'recuperar contraseña', 'cambiar contraseña', 'mi cuenta no funciona', 'contraseña incorrecta'],
    claves: ['contrasena', 'password', 'clave', 'sesion', 'entrar', 'login'],
    respuesta:
      'Si no puedes entrar:\n- Revisa que el correo esté bien escrito y que no tengas activadas las mayúsculas.\n- Si olvidaste tu contraseña, escríbenos por WhatsApp o al correo desde el correo de tu cuenta y te ayudamos a recuperarla.\n\nNunca compartas tu contraseña en este chat.',
    acciones: [ir('Iniciar sesión', '/login'), wa('Recuperar acceso', 'Hola, no puedo entrar a mi cuenta de la plataforma Bootcamp.')],
  },
  {
    id: 'progreso',
    titulo: 'Mi avance',
    categoria: 'cuenta',
    ejemplos: ['mi progreso', 'cuanto me falta', 'ver mi avance', 'en que leccion me quede', 'porcentaje del curso'],
    claves: ['progreso', 'avance', 'falta', 'porcentaje'],
    respuesta: 'Tu avance se guarda automáticamente. En **Mi progreso** ves el porcentaje de cada curso y las lecciones que te faltan; en «Mis cursos» puedes continuar donde te quedaste.',
    acciones: [ir('Mi progreso', '/my-progress'), ir('Mis cursos', '/my-courses')],
  },
  {
    id: 'eliminar_cuenta',
    titulo: 'Mis datos personales',
    categoria: 'cuenta',
    ejemplos: ['eliminar mi cuenta', 'borrar mis datos', 'darme de baja', 'proteccion de datos', 'privacidad', 'que hacen con mis datos'],
    claves: ['eliminar', 'borrar', 'baja', 'privacidad', 'datos'],
    respuesta: `Tus datos se tratan según la Ley 29733. Para acceder, corregir o eliminar tus datos (derechos ARCO), escríbenos a ${CONTACTO.correo} desde el correo de tu cuenta. Más detalles en la Política de Privacidad.`,
    acciones: [ir('Política de privacidad', '/privacidad'), ir('Términos y condiciones', '/terminos')],
  },

  // ═══════════════════════════ Técnico ═══════════════════════════
  {
    id: 'video_no_carga',
    titulo: 'El video no carga',
    categoria: 'tecnico',
    ejemplos: ['el video no carga', 'no se ve el video', 'no reproduce', 'video en negro', 'se traba el video', 'no puedo ver la clase', 'pantalla negra'],
    claves: ['video', 'carga', 'reproduc', 'traba', 'negro'],
    respuesta:
      'Prueba estos pasos:\n1. Recarga la página (F5).\n2. Revisa tu conexión a internet.\n3. Desactiva extensiones que bloquean anuncios para este sitio.\n4. Prueba en otro navegador (Chrome o Edge actualizados).\n\nSi sigue sin funcionar, cuéntanos qué curso y lección por WhatsApp.',
    acciones: [wa('Reportar el problema', 'Hola, un video de la plataforma Bootcamp no me carga. Curso y lección: ')],
  },
  {
    id: 'leccion_no_marca',
    titulo: 'La lección no se marca como completada',
    categoria: 'tecnico',
    ejemplos: ['no se marca la leccion', 'no avanza mi progreso', 'leccion no completada', 'no se guarda mi avance', 'se queda en 0'],
    claves: ['marca', 'guarda', 'complet'],
    respuesta: 'Al terminar cada lección pulsa **Marcar como completada**. Si ya lo hiciste y no cambia, recarga la página y revisa que tu sesión siga iniciada. Si el problema continúa, avísanos por WhatsApp.',
    acciones: [ir('Mi progreso', '/my-progress'), wa('Reportar el problema', 'Hola, mi avance no se guarda en la plataforma Bootcamp.')],
  },

  // ═══════════════════════════ Contacto ═══════════════════════════
  {
    id: 'contacto',
    titulo: 'Contacto',
    categoria: 'contacto',
    ejemplos: ['contacto', 'numero de whatsapp', 'correo de contacto', 'como los contacto', 'telefono', 'donde escribo'],
    claves: ['contacto', 'whatsapp', 'telefono', 'correo', 'numero', 'celular'],
    respuesta: `Puedes escribirnos por:\n- **WhatsApp**: ${W} (pagos, certificados y consultas directas)\n- **Correo**: ${CONTACTO.correo}`,
    acciones: [wa('Abrir WhatsApp', 'Hola, vengo de la plataforma Bootcamp. Tengo una consulta.')],
  },
  {
    id: 'humano',
    titulo: 'Hablar con una persona',
    categoria: 'contacto',
    ejemplos: ['quiero hablar con una persona', 'hablar con un asesor', 'atencion humana', 'pasame con alguien', 'asesor', 'operador', 'quiero hablar con alguien real'],
    claves: ['persona', 'asesor', 'humano', 'operador', 'alguien'],
    respuesta: `¡Claro! Te atiende una persona del equipo por WhatsApp al ${W}. Toca el botón y el mensaje irá listo.`,
    acciones: [wa('Hablar con un asesor', 'Hola, vengo de la plataforma Bootcamp y quiero hablar con un asesor.')],
  },
  {
    id: 'empresa',
    titulo: 'Sobre la empresa',
    categoria: 'contacto',
    ejemplos: ['quienes son', 'que es soluciones integrales jb', 'sobre la empresa', 'de donde son', 'son confiables'],
    claves: ['empresa', 'soluciones integrales', 'quienes'],
    respuesta:
      '**Soluciones Integrales JB** es una empresa peruana de tecnología («Tu mejor opción tecnológica»). Su Plataforma Bootcamp ofrece cursos virtuales de tecnología con constancias y certificados verificables.',
    acciones: [ir('Blog y redes', '/blog'), ver('Ver cursos', 'cursos_lista')],
  },
];

/** Categorías de la "Ayuda rápida" (botones), en orden */
export const MENU = [
  { id: 'cursos', titulo: 'Cursos', icono: 'cursos', intents: ['cursos_lista', 'inscripcion', 'costo', 'modalidad', 'requisitos', 'material'] },
  { id: 'certificados', titulo: 'Certificados', icono: 'certificado', intents: ['certificado_vs_constancia', 'obtener_certificado', 'datos_certificado', 'verificar_certificado', 'certificado_no_aparece'] },
  { id: 'pagos', titulo: 'Pagos', icono: 'pago', intents: ['pagar_certificado', 'costo'] },
  { id: 'cuenta', titulo: 'Mi cuenta', icono: 'cuenta', intents: ['registro', 'olvide_contrasena', 'progreso', 'eliminar_cuenta'] },
  { id: 'tecnico', titulo: 'Problemas técnicos', icono: 'tecnico', intents: ['video_no_carga', 'leccion_no_marca'] },
  { id: 'contacto', titulo: 'Contacto', icono: 'contacto', intents: ['contacto', 'humano', 'empresa'] },
];
