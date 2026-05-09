-- Add missing INSERT, UPDATE, DELETE policies for clients

-- ==========================================
-- PROJECTS
-- ==========================================

CREATE POLICY "Clients create projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  client_id = public.current_user_company()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Clients update projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  client_id = public.current_user_company()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Clients delete projects"
ON public.projects
FOR DELETE
TO authenticated
USING (
  client_id = public.current_user_company()
  OR public.has_role(auth.uid(), 'admin')
);

-- ==========================================
-- TASKS
-- ==========================================

CREATE POLICY "Clients create tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS(
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id
    AND (
      p.client_id = public.current_user_company()
      OR public.has_role(auth.uid(), 'admin')
    )
  )
);

CREATE POLICY "Clients update tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM public.projects p
    WHERE p.id = tasks.project_id
    AND (
      p.client_id = public.current_user_company()
      OR public.has_role(auth.uid(), 'admin')
    )
  )
);

CREATE POLICY "Clients delete tasks"
ON public.tasks
FOR DELETE
TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM public.projects p
    WHERE p.id = tasks.project_id
    AND (
      p.client_id = public.current_user_company()
      OR public.has_role(auth.uid(), 'admin')
    )
  )
);

-- ==========================================
-- CREDENTIALS
-- ==========================================

CREATE POLICY "Clients create credentials"
ON public.credentials
FOR INSERT
TO authenticated
WITH CHECK (
  client_id = public.current_user_company()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Clients update credentials"
ON public.credentials
FOR UPDATE
TO authenticated
USING (
  client_id = public.current_user_company()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Clients delete credentials"
ON public.credentials
FOR DELETE
TO authenticated
USING (
  client_id = public.current_user_company()
  OR public.has_role(auth.uid(), 'admin')
);

-- ==========================================
-- TECH_STACK
-- ==========================================

CREATE POLICY "Clients create tech_stack"
ON public.tech_stack
FOR INSERT
TO authenticated
WITH CHECK (
  client_id = public.current_user_company()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Clients update tech_stack"
ON public.tech_stack
FOR UPDATE
TO authenticated
USING (
  client_id = public.current_user_company()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Clients delete tech_stack"
ON public.tech_stack
FOR DELETE
TO authenticated
USING (
  client_id = public.current_user_company()
  OR public.has_role(auth.uid(), 'admin')
);

-- ==========================================
-- UPLOADS
-- ==========================================

CREATE POLICY "Clients create uploads"
ON public.uploads
FOR INSERT
TO authenticated
WITH CHECK (
  client_id = public.current_user_company()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Clients update uploads"
ON public.uploads
FOR UPDATE
TO authenticated
USING (
  client_id = public.current_user_company()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Clients delete uploads"
ON public.uploads
FOR DELETE
TO authenticated
USING (
  client_id = public.current_user_company()
  OR public.has_role(auth.uid(), 'admin')
);