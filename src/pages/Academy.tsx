import { Link } from "react-router-dom";
import { GraduationCap, ArrowRight, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAcademyCourses, useCompanyId, useLessonAccess } from "@/hooks/useAcademy";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Academy() {
  const { courses, loading } = useAcademyCourses();
  const companyId = useCompanyId();
  const { access } = useLessonAccess(companyId);
  const [lessonsByCourse, setLessonsByCourse] = useState<Record<string, { id: string }[]>>({});

  useEffect(() => {
    if (!courses.length) return;
    supabase
      .from("academy_lessons")
      .select("id, course_id")
      .eq("status", "published")
      .in("course_id", courses.map(c => c.id))
      .then(({ data }) => {
        const m: Record<string, { id: string }[]> = {};
        (data ?? []).forEach((l: any) => {
          (m[l.course_id] = m[l.course_id] || []).push({ id: l.id });
        });
        setLessonsByCourse(m);
      });
  }, [courses]);

  const published = courses.filter(c => c.status === "published");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" /> Academy Nodi
        </h1>
        <p className="text-muted-foreground mt-1">
          Lezioni e materiali di formazione per far crescere la tua attività
        </p>
      </header>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : published.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p>Nessun corso disponibile al momento. Torna presto!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {published.map(course => {
            const lessons = lessonsByCourse[course.id] ?? [];
            const completed = lessons.filter(l => access[l.id]?.completed_at).length;
            const total = lessons.length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const status = total === 0 ? "Vuoto" : completed === 0 ? "Non iniziato" : completed === total ? "Completato" : "In corso";
            return (
              <Card key={course.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                    <Badge variant="outline" className="capitalize">{course.verticale}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 flex-1">
                  <div className="text-sm text-muted-foreground">
                    {completed} di {total} lezioni completate
                  </div>
                  <Progress value={pct} />
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <Badge variant={status === "Completato" ? "default" : status === "In corso" ? "secondary" : "outline"}>
                      {status}
                    </Badge>
                    <Button asChild size="sm">
                      <Link to={`/academy/course/${course.id}`}>
                        Accedi <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
