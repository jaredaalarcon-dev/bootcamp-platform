-- ═══════════════════════════════════════════════════════════════════════════
-- Esquema completo de la base de datos de SIJB Bootcamp (PostgreSQL 15+)
-- ═══════════════════════════════════════════════════════════════════════════
-- ¿Cuándo usarlo?  SOLO en una base de datos NUEVA y vacía (por ejemplo, un
-- proyecto nuevo de Supabase). Tu base actual ya tiene estas tablas: el backend
-- las creó en desarrollo. Si lo ejecutas sobre una base con datos, fallará
-- (las tablas ya existen) sin borrar nada.
--
-- Cómo:  Supabase → SQL Editor → pega todo este archivo → Run.
--
-- Incluye:
--   1. roles y profiles (las usa Supabase Auth; el backend no las crea solo)
--   2. todas las tablas del backend (generadas desde las entidades de TypeORM)
--   3. RLS activado en todas (el backend usa la service role, que lo salta)
--   4. los roles iniciales: student y admin
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Roles y perfiles ────────────────────────────────────────────────────────
CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name character varying(50) NOT NULL UNIQUE,
    description text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    supabase_id uuid NOT NULL UNIQUE,
    email character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    role_id uuid REFERENCES public.roles(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Tablas del backend ──────────────────────────────────────────────────────
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assistant_faqs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assistant_faqs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    question character varying(200) NOT NULL,
    variants text DEFAULT ''::text NOT NULL,
    answer text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    hits integer DEFAULT 0 NOT NULL
);


--
-- Name: assistant_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assistant_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "conversationId" character varying(80) NOT NULL,
    channel character varying(20) DEFAULT 'web'::character varying NOT NULL,
    role character varying(20) NOT NULL,
    content text NOT NULL,
    provider character varying(30),
    intent character varying(60)
);


--
-- Name: assistant_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assistant_settings (
    id character varying(20) NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "aiEnabled" boolean DEFAULT true NOT NULL,
    knowledge text NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    title character varying(200) NOT NULL,
    summary text,
    network character varying(20) DEFAULT 'noticia'::character varying NOT NULL,
    category character varying(50),
    "imageUrl" text,
    url text NOT NULL,
    "publishedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "isPublished" boolean DEFAULT true NOT NULL
);


--
-- Name: blog_subscribers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_subscribers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    email character varying(255) NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    name character varying(150) NOT NULL,
    description text
);


--
-- Name: certificate_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificate_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "userId" character varying(64) NOT NULL,
    "fullName" character varying(150) NOT NULL,
    "documentType" character varying(20) DEFAULT 'DNI'::character varying NOT NULL,
    "documentNumber" character varying(20) NOT NULL,
    "photoPath" character varying(255)
);


--
-- Name: complaints; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.complaints (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    numero integer NOT NULL,
    code character varying(20),
    "fullName" character varying(150) NOT NULL,
    "documentType" character varying(20) NOT NULL,
    "documentNumber" character varying(20) NOT NULL,
    address character varying(250) NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(150) NOT NULL,
    "isMinor" boolean DEFAULT false NOT NULL,
    "guardianName" character varying(150),
    "itemType" character varying(20) NOT NULL,
    amount numeric(10,2),
    "itemDescription" text NOT NULL,
    type character varying(20) NOT NULL,
    detail text NOT NULL,
    request text NOT NULL,
    status character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    response text,
    "respondedAt" timestamp with time zone,
    "userId" character varying(64),
    ip character varying(64),
    "userAgent" character varying(300)
);


--
-- Name: complaints_numero_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.complaints_numero_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: complaints_numero_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.complaints_numero_seq OWNED BY public.complaints.numero;


--
-- Name: course_resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    type character varying(30) DEFAULT 'guia'::character varying NOT NULL,
    "externalUrl" text,
    "storagePath" text,
    "fileName" character varying(255),
    "fileSize" integer,
    "mimeType" character varying(150),
    "orderNumber" integer DEFAULT 0 NOT NULL,
    "courseId" uuid NOT NULL
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    image text,
    status character varying(50) DEFAULT 'draft'::character varying NOT NULL,
    "categoryId" uuid
);


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    status character varying DEFAULT 'in_progress'::character varying NOT NULL,
    "enrolledAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    "paidAt" timestamp with time zone,
    "paymentNote" character varying(200),
    "userId" uuid NOT NULL,
    "courseId" uuid NOT NULL
);


--
-- Name: issued_certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issued_certificates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    code character varying(32) NOT NULL,
    type character varying(20) NOT NULL,
    "userId" character varying(64) NOT NULL,
    "courseId" uuid NOT NULL,
    "studentName" character varying(150) NOT NULL,
    "documentLabel" character varying(40),
    "courseName" character varying(200) NOT NULL,
    "completedAt" timestamp with time zone NOT NULL,
    revoked boolean DEFAULT false NOT NULL
);


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    "orderNumber" integer NOT NULL,
    "moduleId" uuid
);


--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    "orderNumber" integer NOT NULL,
    "courseId" uuid
);


--
-- Name: progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    "watchedTime" integer DEFAULT 0 NOT NULL,
    "completedAt" timestamp without time zone,
    "userId" uuid NOT NULL,
    "lessonId" uuid NOT NULL
);


--
-- Name: terms_acceptances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.terms_acceptances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "userId" character varying(64) NOT NULL,
    version character varying(20) NOT NULL,
    source character varying(20) NOT NULL,
    ip character varying(64),
    "userAgent" character varying(300)
);


--
-- Name: videos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.videos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    title character varying(200) NOT NULL,
    "videoUrl" text NOT NULL,
    duration integer,
    "lessonId" uuid
);


--
-- Name: complaints numero; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.complaints ALTER COLUMN numero SET DEFAULT nextval('public.complaints_numero_seq'::regclass);


--
-- Name: assistant_settings PK_163483d7c1edaa6ed13a9c4f2c7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assistant_settings
    ADD CONSTRAINT "PK_163483d7c1edaa6ed13a9c4f2c7" PRIMARY KEY (id);


--
-- Name: certificate_profiles PK_171f0f058bc223a8b43c3a212f1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_profiles
    ADD CONSTRAINT "PK_171f0f058bc223a8b43c3a212f1" PRIMARY KEY (id);


--
-- Name: categories PK_24dbc6126a28ff948da33e97d3b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY (id);


--
-- Name: assistant_messages PK_2e3cd3325f853089044baca6b77; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assistant_messages
    ADD CONSTRAINT "PK_2e3cd3325f853089044baca6b77" PRIMARY KEY (id);


--
-- Name: courses PK_3f70a487cc718ad8eda4e6d58c9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY (id);


--
-- Name: complaints PK_4b7566a2a489c2cc7c12ed076ad; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT "PK_4b7566a2a489c2cc7c12ed076ad" PRIMARY KEY (id);


--
-- Name: course_resources PK_507049dc482f8148211142994ed; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_resources
    ADD CONSTRAINT "PK_507049dc482f8148211142994ed" PRIMARY KEY (id);


--
-- Name: terms_acceptances PK_6862bb2dab40bd9f9a6ec2098b8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.terms_acceptances
    ADD CONSTRAINT "PK_6862bb2dab40bd9f9a6ec2098b8" PRIMARY KEY (id);


--
-- Name: progress PK_79abdfd87a688f9de756a162b6f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT "PK_79abdfd87a688f9de756a162b6f" PRIMARY KEY (id);


--
-- Name: enrollments PK_7c0f752f9fb68bf6ed7367ab00f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT "PK_7c0f752f9fb68bf6ed7367ab00f" PRIMARY KEY (id);


--
-- Name: modules PK_7dbefd488bd96c5bf31f0ce0c95; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT "PK_7dbefd488bd96c5bf31f0ce0c95" PRIMARY KEY (id);


--
-- Name: assistant_faqs PK_88365729ce36eb40c1d6c317150; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assistant_faqs
    ADD CONSTRAINT "PK_88365729ce36eb40c1d6c317150" PRIMARY KEY (id);


--
-- Name: issued_certificates PK_9a993193d4b8369f5a3fe9ae3da; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issued_certificates
    ADD CONSTRAINT "PK_9a993193d4b8369f5a3fe9ae3da" PRIMARY KEY (id);


--
-- Name: lessons PK_9b9a8d455cac672d262d7275730; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT "PK_9b9a8d455cac672d262d7275730" PRIMARY KEY (id);


--
-- Name: blog_subscribers PK_d9d07e3f85b7af6b7c3c2fe37a8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_subscribers
    ADD CONSTRAINT "PK_d9d07e3f85b7af6b7c3c2fe37a8" PRIMARY KEY (id);


--
-- Name: blog_posts PK_dd2add25eac93daefc93da9d387; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT "PK_dd2add25eac93daefc93da9d387" PRIMARY KEY (id);


--
-- Name: videos PK_e4c86c0cf95aff16e9fb8220f6b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT "PK_e4c86c0cf95aff16e9fb8220f6b" PRIMARY KEY (id);


--
-- Name: videos REL_a4983a6ff1a5063d67b90b7b53; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT "REL_a4983a6ff1a5063d67b90b7b53" UNIQUE ("lessonId");


--
-- Name: categories UQ_8b0be371d28245da6e4f4b61878; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE (name);


--
-- Name: enrollments UQ_enrollment_user_course; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT "UQ_enrollment_user_course" UNIQUE ("userId", "courseId");


--
-- Name: progress UQ_progress_user_lesson; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT "UQ_progress_user_lesson" UNIQUE ("userId", "lessonId");


--
-- Name: IDX_15a986701bc25b8aefcf41cf17; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_15a986701bc25b8aefcf41cf17" ON public.certificate_profiles USING btree ("userId");


--
-- Name: IDX_30088571fc713250b38c8af15b; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_30088571fc713250b38c8af15b" ON public.issued_certificates USING btree ("userId", "courseId", type);


--
-- Name: IDX_5af34cf5dd79c380d32abd71d3; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_5af34cf5dd79c380d32abd71d3" ON public.complaints USING btree (code);


--
-- Name: IDX_5f96961c166c528855cdca9251; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_5f96961c166c528855cdca9251" ON public.complaints USING btree (numero);


--
-- Name: IDX_8e9c052ae338e0291158117938; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8e9c052ae338e0291158117938" ON public.assistant_messages USING btree ("conversationId");


--
-- Name: IDX_9aba179dca2c2e5b14fa494f78; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9aba179dca2c2e5b14fa494f78" ON public.course_resources USING btree ("courseId");


--
-- Name: IDX_9ea0495e52eca415a41d8beacd; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9ea0495e52eca415a41d8beacd" ON public.terms_acceptances USING btree ("userId", version);


--
-- Name: IDX_b407af1b4b399c77e27150020c; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_b407af1b4b399c77e27150020c" ON public.blog_subscribers USING btree (email);


--
-- Name: IDX_be1c80305e1b11c0a119aa190c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_be1c80305e1b11c0a119aa190c" ON public.blog_posts USING btree ("publishedAt");


--
-- Name: IDX_d92661279dc6c991647f34c52d; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_d92661279dc6c991647f34c52d" ON public.issued_certificates USING btree (code);


--
-- Name: lessons FK_16e7969589c0b789d9868782259; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT "FK_16e7969589c0b789d9868782259" FOREIGN KEY ("moduleId") REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: enrollments FK_60dd0ae4e21002e63a5fdefeec8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT "FK_60dd0ae4e21002e63a5fdefeec8" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: modules FK_83489b37212a5a547bde8f89014; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT "FK_83489b37212a5a547bde8f89014" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_resources FK_9aba179dca2c2e5b14fa494f78c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_resources
    ADD CONSTRAINT "FK_9aba179dca2c2e5b14fa494f78c" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: videos FK_a4983a6ff1a5063d67b90b7b538; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT "FK_a4983a6ff1a5063d67b90b7b538" FOREIGN KEY ("lessonId") REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: courses FK_c730473dfb837b3e62057cd9447; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT "FK_c730473dfb837b3e62057cd9447" FOREIGN KEY ("categoryId") REFERENCES public.categories(id);


--
-- Name: progress FK_df6c728a3df388df34e03d08088; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT "FK_df6c728a3df388df34e03d08088" FOREIGN KEY ("lessonId") REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

-- 2b. Comunidad y evaluación (notificaciones, preguntas, reseñas, cuestionarios)
CREATE TABLE public.course_reviews (
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
CREATE TABLE public.lesson_questions (
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
CREATE TABLE public.notifications (
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
CREATE TABLE public.quiz_attempts (
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
CREATE TABLE public.quiz_questions (
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
CREATE TABLE public.quizzes (
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
ALTER TABLE ONLY public.course_reviews
    ADD CONSTRAINT "PK_2dc117d5b688a2040125a09d1f1" PRIMARY KEY (id);
ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY (id);
ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT "PK_a84a93fb092359516dc5b325b90" PRIMARY KEY (id);
ALTER TABLE ONLY public.lesson_questions
    ADD CONSTRAINT "PK_a90c71312451e7b01e96521e856" PRIMARY KEY (id);
ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT "PK_b24f0f7662cf6b3a0e7dba0a1b4" PRIMARY KEY (id);
ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT "PK_ec0447fd30d9f5c182e7653bfd3" PRIMARY KEY (id);
ALTER TABLE ONLY public.course_reviews
    ADD CONSTRAINT "UQ_course_review_user_course" UNIQUE ("userId", "courseId");
CREATE INDEX "IDX_course_reviews_course" ON public.course_reviews USING btree ("courseId", "createdAt");
CREATE INDEX "IDX_lesson_questions_lesson" ON public.lesson_questions USING btree ("lessonId", "createdAt");
CREATE INDEX "IDX_lesson_questions_status" ON public.lesson_questions USING btree ("answeredAt", "createdAt");
CREATE INDEX "IDX_notifications_user_created" ON public.notifications USING btree ("userId", "createdAt");
CREATE INDEX "IDX_quiz_attempts_user_quiz" ON public.quiz_attempts USING btree ("userId", "quizId");
CREATE INDEX "IDX_quizzes_course" ON public.quizzes USING btree ("courseId");
CREATE UNIQUE INDEX "UQ_notifications_user_key" ON public.notifications USING btree ("userId", key) WHERE (key IS NOT NULL);
ALTER TABLE ONLY public.lesson_questions
    ADD CONSTRAINT "FK_22d9d64085477c1845a44e0b868" FOREIGN KEY ("lessonId") REFERENCES public.lessons(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT "FK_23f2bbe9288b221b1b377372782" FOREIGN KEY ("quizId") REFERENCES public.quizzes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.course_reviews
    ADD CONSTRAINT "FK_2e14b15c1658e0b78a86df473d9" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT "FK_8889ccc5a40989ea308a588870e" FOREIGN KEY ("quizId") REFERENCES public.quizzes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT "FK_c504bb35e922b60d38aee5ef53b" FOREIGN KEY ("moduleId") REFERENCES public.modules(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT "FK_eba9ff0775c843581aab6916b32" FOREIGN KEY ("lessonId") REFERENCES public.lessons(id) ON DELETE CASCADE;

-- 3. Seguridad: RLS activado en todas las tablas ────────────────────────────
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issued_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- 4. Roles iniciales ──────────────────────────────────────────────────────────
INSERT INTO public.roles (name, description) VALUES
  ('student', 'Alumno'),
  ('admin', 'Administrador')
ON CONFLICT (name) DO NOTHING;
