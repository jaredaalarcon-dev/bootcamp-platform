-- ═══════════════════════════════════════════════════════════════════════════
-- Actualización: notificaciones, preguntas por lección, reseñas y cuestionarios
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pega todo este archivo → Run.
-- Es seguro ejecutarlo más de una vez: no borra ni cambia datos existentes.
-- Hazlo ANTES de subir el backend nuevo a Render (en producción el backend
-- no crea tablas por su cuenta).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.course_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "userId" uuid NOT NULL,
    "courseId" uuid NOT NULL,
    "authorName" character varying(120) NOT NULL,
    rating smallint NOT NULL,
    comment text,
    hidden boolean DEFAULT false NOT NULL
);
CREATE TABLE IF NOT EXISTS public.lesson_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "userId" uuid NOT NULL,
    "lessonId" uuid NOT NULL,
    "courseId" uuid NOT NULL,
    "authorName" character varying(120) NOT NULL,
    question text NOT NULL,
    answer text,
    "answeredAt" timestamp with time zone,
    "answeredBy" character varying(120)
);
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    type character varying(30) DEFAULT 'general'::character varying NOT NULL,
    title character varying(160) NOT NULL,
    message text NOT NULL,
    link character varying(300),
    key character varying(120),
    "readAt" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "quizId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    score smallint NOT NULL,
    "correctCount" smallint NOT NULL,
    "totalQuestions" smallint NOT NULL,
    passed boolean NOT NULL,
    answers jsonb NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "quizId" uuid NOT NULL,
    text text NOT NULL,
    options jsonb NOT NULL,
    "correctIndex" smallint NOT NULL,
    explanation text,
    "orderNumber" integer DEFAULT 0 NOT NULL
);
CREATE TABLE IF NOT EXISTS public.quizzes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "courseId" uuid NOT NULL,
    "moduleId" uuid,
    "lessonId" uuid,
    title character varying(200) NOT NULL,
    description text,
    "passingScore" smallint DEFAULT '70'::smallint NOT NULL,
    published boolean DEFAULT true NOT NULL
);
DO $$ BEGIN
  ALTER TABLE ONLY public.course_reviews ADD CONSTRAINT "PK_2dc117d5b688a2040125a09d1f1" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE ONLY public.notifications ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE ONLY public.quiz_attempts ADD CONSTRAINT "PK_a84a93fb092359516dc5b325b90" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE ONLY public.lesson_questions ADD CONSTRAINT "PK_a90c71312451e7b01e96521e856" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE ONLY public.quizzes ADD CONSTRAINT "PK_b24f0f7662cf6b3a0e7dba0a1b4" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE ONLY public.quiz_questions ADD CONSTRAINT "PK_ec0447fd30d9f5c182e7653bfd3" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE ONLY public.course_reviews ADD CONSTRAINT "UQ_course_review_user_course" UNIQUE ("userId", "courseId");
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "IDX_course_reviews_course" ON public.course_reviews USING btree ("courseId", "createdAt");
CREATE INDEX IF NOT EXISTS "IDX_lesson_questions_lesson" ON public.lesson_questions USING btree ("lessonId", "createdAt");
CREATE INDEX IF NOT EXISTS "IDX_lesson_questions_status" ON public.lesson_questions USING btree ("answeredAt", "createdAt");
CREATE INDEX IF NOT EXISTS "IDX_notifications_user_created" ON public.notifications USING btree ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "IDX_quiz_attempts_user_quiz" ON public.quiz_attempts USING btree ("userId", "quizId");
CREATE INDEX IF NOT EXISTS "IDX_quizzes_course" ON public.quizzes USING btree ("courseId");
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_notifications_user_key" ON public.notifications USING btree ("userId", key) WHERE (key IS NOT NULL);
DO $$ BEGIN
  ALTER TABLE ONLY public.lesson_questions ADD CONSTRAINT "FK_22d9d64085477c1845a44e0b868" FOREIGN KEY ("lessonId") REFERENCES public.lessons(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE ONLY public.quiz_attempts ADD CONSTRAINT "FK_23f2bbe9288b221b1b377372782" FOREIGN KEY ("quizId") REFERENCES public.quizzes(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE ONLY public.course_reviews ADD CONSTRAINT "FK_2e14b15c1658e0b78a86df473d9" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE ONLY public.quiz_questions ADD CONSTRAINT "FK_8889ccc5a40989ea308a588870e" FOREIGN KEY ("quizId") REFERENCES public.quizzes(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE ONLY public.quizzes ADD CONSTRAINT "FK_c504bb35e922b60d38aee5ef53b" FOREIGN KEY ("moduleId") REFERENCES public.modules(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE ONLY public.quizzes ADD CONSTRAINT "FK_eba9ff0775c843581aab6916b32" FOREIGN KEY ("lessonId") REFERENCES public.lessons(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

-- Seguridad: RLS activado (solo el backend, con service role, accede a estas tablas)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
