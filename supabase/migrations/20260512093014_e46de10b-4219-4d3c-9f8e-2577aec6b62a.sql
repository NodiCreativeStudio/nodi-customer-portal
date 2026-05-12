
-- Enums
CREATE TYPE public.academy_verticale AS ENUM ('retail','wellness','repair','shared');
CREATE TYPE public.academy_status AS ENUM ('draft','published','archived');
CREATE TYPE public.academy_lesson_status AS ENUM ('draft','scheduled','published','archived');
CREATE TYPE public.academy_content_type AS ENUM ('pdf','video');

-- Helper: verticale del cliente loggato (dall'ultimo onboarding)
CREATE OR REPLACE FUNCTION public.current_user_verticale()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT verticale FROM public.onboarding_moduli
  WHERE user_id = auth.uid() AND verticale IS NOT NULL
  ORDER BY updated_at DESC LIMIT 1
$$;

-- Tabelle
CREATE TABLE public.academy_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  verticale public.academy_verticale NOT NULL,
  cover_image_path TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  status public.academy_status NOT NULL DEFAULT 'draft',
  prerequisites TEXT,
  total_duration_minutes INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.academy_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  lesson_number INTEGER NOT NULL,
  content_type public.academy_content_type NOT NULL,
  content_url TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  is_downloadable BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ,
  status public.academy_lesson_status NOT NULL DEFAULT 'draft',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_academy_lessons_course ON public.academy_lessons(course_id);

CREATE TABLE public.academy_lesson_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.academy_lessons(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  download_count INTEGER NOT NULL DEFAULT 0,
  video_progress_percent INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, lesson_id)
);

CREATE TABLE public.academy_course_completion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  certificate_path TEXT,
  certificate_generated_at TIMESTAMPTZ,
  UNIQUE(client_id, course_id)
);

-- Triggers updated_at
CREATE TRIGGER trg_academy_courses_updated BEFORE UPDATE ON public.academy_courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_academy_lessons_updated BEFORE UPDATE ON public.academy_lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- View progress
CREATE OR REPLACE VIEW public.academy_course_progress AS
SELECT
  c.id AS course_id,
  c.title AS course_title,
  c.verticale,
  cli.id AS client_id,
  (SELECT COUNT(*) FROM public.academy_lessons l WHERE l.course_id = c.id AND l.status = 'published') AS total_lessons,
  (SELECT COUNT(*) FROM public.academy_lesson_access a
     JOIN public.academy_lessons l ON l.id = a.lesson_id
     WHERE l.course_id = c.id AND a.client_id = cli.id AND a.completed_at IS NOT NULL) AS completed_lessons,
  cc.completed_at AS completion_date,
  (cc.id IS NOT NULL) AS is_course_completed
FROM public.academy_courses c
CROSS JOIN public.clients cli
LEFT JOIN public.academy_course_completion cc ON cc.course_id = c.id AND cc.client_id = cli.id;

-- RLS
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lesson_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_course_completion ENABLE ROW LEVEL SECURITY;

-- Courses
CREATE POLICY "Admin manage courses" ON public.academy_courses FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Clients read courses" ON public.academy_courses FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR (
      status = 'published' AND (
        verticale = 'shared' OR verticale::text = current_user_verticale()
      )
    )
  );

-- Lessons
CREATE POLICY "Admin manage lessons" ON public.academy_lessons FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Clients read lessons" ON public.academy_lessons FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR EXISTS (
      SELECT 1 FROM public.academy_courses c
      WHERE c.id = course_id AND c.status='published'
        AND (c.verticale='shared' OR c.verticale::text = current_user_verticale())
    )
  );

-- Lesson access (own client_id)
CREATE POLICY "Admin manage access" ON public.academy_lesson_access FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Clients view own access" ON public.academy_lesson_access FOR SELECT TO authenticated
  USING (client_id = current_user_company() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Clients insert own access" ON public.academy_lesson_access FOR INSERT TO authenticated
  WITH CHECK (client_id = current_user_company());
CREATE POLICY "Clients update own access" ON public.academy_lesson_access FOR UPDATE TO authenticated
  USING (client_id = current_user_company());

-- Course completion
CREATE POLICY "Admin manage completion" ON public.academy_course_completion FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Clients view own completion" ON public.academy_course_completion FOR SELECT TO authenticated
  USING (client_id = current_user_company() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Clients insert own completion" ON public.academy_course_completion FOR INSERT TO authenticated
  WITH CHECK (client_id = current_user_company());
CREATE POLICY "Clients update own completion" ON public.academy_course_completion FOR UPDATE TO authenticated
  USING (client_id = current_user_company());

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('academy-lessons','academy-lessons', false)
  ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Admin manage academy storage" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id='academy-lessons' AND has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id='academy-lessons' AND has_role(auth.uid(),'admin'));

CREATE POLICY "Clients read academy pdf and covers" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id='academy-lessons' AND (
      (split_part(name,'/',1) IN ('pdf','covers') AND EXISTS (
        SELECT 1 FROM public.academy_courses c
        WHERE c.id::text = split_part(name,'/',2)
          AND c.status='published'
          AND (c.verticale='shared' OR c.verticale::text = current_user_verticale())
      ))
    )
  );

CREATE POLICY "Clients read own certificates" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id='academy-lessons'
    AND split_part(name,'/',1) = 'certificates'
    AND split_part(name,'/',2) = current_user_company()::text
  );

CREATE POLICY "Clients write own certificates" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id='academy-lessons'
    AND split_part(name,'/',1) = 'certificates'
    AND split_part(name,'/',2) = current_user_company()::text
  );
