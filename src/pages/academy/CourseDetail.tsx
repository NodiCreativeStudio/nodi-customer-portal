import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Video, CheckCircle2, Circle, Clock, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAcademyCourse, useCompanyId, useLessonAccess } from "@/hooks/useAcademy";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCertificateUrl } from "@/lib/academy/certificate";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { course, lessons, loading } = useAcademyCourse(id);
  const companyId = useCompanyId();
  const { access } = useLessonAccess(companyId);
  const [certPath, setCertPath] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || !id) return;
    supabase.from("academy_course_completion")
      .select("certificate_path")
      .eq("client_id", companyId).eq("course_id", id).maybeSingle()
      .then(({ data }) => setCertPath(data?.certificate_path ?? null));
  }, [companyId, id, access]);

  if (loading || !course) return <div className="text-muted-foreground">Caricamento…</div>;

  const published = lessons.filter(l => l.status === "published");
  const completed = published.filter(l => access[l.id]?.completed_at).length;
  const pct = published.length ? Math.round(completed / published.length * 100) : 0;
  const allDone = published.length > 0 && completed === published.length;

  const downloadCert = async () => {
    if (!certPath) return;
    const url = await getCertificateUrl(certPath);
    if (url) window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/academy"><ArrowLeft className="h-4 w-4" /> Torna ai corsi</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{course.title}</CardTitle>
              <CardDescription className="mt-2">{course.description}</CardDescription>
            </div>
            <Badge variant="outline" className="capitalize">{course.verticale}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {course.prerequisites && (
            <div className="text-sm"><strong>Prerequisiti:</strong> {course.prerequisites}</div>
          )}
          <div className="text-sm text-muted-foreground">{completed} di {published.length} lezioni completate</div>
          <Progress value={pct} />
          {allDone && certPath && (
            <Button onClick={downloadCert} className="mt-2">
              <Award className="h-4 w-4" /> Scarica certificato
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {published.length === 0 && (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Nessuna lezione disponibile.</CardContent></Card>
        )}
        {published.map(lesson => {
          const a = access[lesson.id];
          const done = !!a?.completed_at;
          return (
            <Card key={lesson.id}>
              <CardContent className="py-4 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                  {lesson.lesson_number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {lesson.content_type === "pdf"
                      ? <FileText className="h-4 w-4 text-muted-foreground" />
                      : <Video className="h-4 w-4 text-muted-foreground" />}
                    <span className="font-medium">{lesson.title}</span>
                    {done
                      ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                      : <Circle className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {lesson.duration_minutes} min</span>
                    <span className="capitalize">{lesson.content_type}</span>
                  </div>
                </div>
                <Button asChild size="sm" variant={done ? "outline" : "default"}>
                  <Link to={`/academy/lesson/${lesson.id}`}>{done ? "Rivedi" : "Apri"}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
