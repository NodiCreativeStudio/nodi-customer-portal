import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AcademyCourse = {
  id: string;
  title: string;
  description: string;
  verticale: "retail" | "wellness" | "repair" | "shared";
  cover_image_path: string | null;
  order_index: number;
  status: "draft" | "published" | "archived";
  prerequisites: string | null;
  total_duration_minutes: number;
  created_at: string;
  updated_at: string;
};

export type AcademyLesson = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  lesson_number: number;
  content_type: "pdf" | "video";
  content_url: string;
  duration_minutes: number;
  is_downloadable: boolean;
  published_at: string | null;
  status: "draft" | "scheduled" | "published" | "archived";
  tags: string[];
};

export type LessonAccess = {
  lesson_id: string;
  viewed_at: string;
  completed_at: string | null;
  download_count: number;
};

export function useCompanyId() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("company_id").eq("id", user.id).maybeSingle()
      .then(({ data }) => setCompanyId(data?.company_id ?? null));
  }, [user]);
  return companyId;
}

export function useAcademyCourses() {
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("academy_courses").select("*").order("order_index");
    setCourses((data as AcademyCourse[]) ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { courses, loading, reload };
}

export function useAcademyCourse(courseId: string | undefined) {
  const [course, setCourse] = useState<AcademyCourse | null>(null);
  const [lessons, setLessons] = useState<AcademyLesson[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!courseId) return;
    (async () => {
      setLoading(true);
      const [{ data: c }, { data: l }] = await Promise.all([
        supabase.from("academy_courses").select("*").eq("id", courseId).maybeSingle(),
        supabase.from("academy_lessons").select("*").eq("course_id", courseId).order("lesson_number"),
      ]);
      setCourse(c as AcademyCourse | null);
      setLessons((l as AcademyLesson[]) ?? []);
      setLoading(false);
    })();
  }, [courseId]);
  return { course, lessons, loading };
}

export function useLessonAccess(clientId: string | null) {
  const [access, setAccess] = useState<Record<string, LessonAccess>>({});
  const reload = useCallback(async () => {
    if (!clientId) return;
    const { data } = await supabase.from("academy_lesson_access").select("*").eq("client_id", clientId);
    const m: Record<string, LessonAccess> = {};
    (data ?? []).forEach((r: any) => { m[r.lesson_id] = r; });
    setAccess(m);
  }, [clientId]);
  useEffect(() => { reload(); }, [reload]);
  return { access, reload };
}

export async function markLessonViewed(clientId: string, lessonId: string) {
  await supabase.from("academy_lesson_access").upsert(
    { client_id: clientId, lesson_id: lessonId, viewed_at: new Date().toISOString(), last_accessed_at: new Date().toISOString() },
    { onConflict: "client_id,lesson_id" }
  );
}

export async function markLessonCompleted(clientId: string, lessonId: string) {
  await supabase.from("academy_lesson_access").upsert(
    { client_id: clientId, lesson_id: lessonId, viewed_at: new Date().toISOString(), completed_at: new Date().toISOString(), last_accessed_at: new Date().toISOString() },
    { onConflict: "client_id,lesson_id" }
  );
}

export async function incrementDownload(clientId: string, lessonId: string, current: number) {
  await supabase.from("academy_lesson_access").upsert(
    { client_id: clientId, lesson_id: lessonId, download_count: current + 1, last_accessed_at: new Date().toISOString(), viewed_at: new Date().toISOString() },
    { onConflict: "client_id,lesson_id" }
  );
}
