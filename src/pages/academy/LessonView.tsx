import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, CheckCircle2, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId, markLessonViewed, markLessonCompleted, incrementDownload, type AcademyLesson } from "@/hooks/useAcademy";
import { generateAndUploadCertificate, getCertificateUrl } from "@/lib/academy/certificate";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function LessonView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const [lesson, setLesson] = useState<AcademyLesson | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [accessRow, setAccessRow] = useState<any>(null);
  const [completing, setCompleting] = useState(false);
  const [certPath, setCertPath] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("academy_lessons").select("*").eq("id", id).maybeSingle();
      setLesson(data as AcademyLesson | null);
      if (data?.content_type === "pdf" && data.content_url) {
        const { data: signed } = await supabase.storage.from("academy-lessons").createSignedUrl(data.content_url, 3600);
        setPdfUrl(signed?.signedUrl ?? null);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!companyId || !id) return;
    supabase.from("academy_lesson_access").select("*")
      .eq("client_id", companyId).eq("lesson_id", id).maybeSingle()
      .then(({ data }) => setAccessRow(data));
    if (companyId && id) markLessonViewed(companyId, id);
  }, [companyId, id]);

  const handleDownload = async () => {
    if (!pdfUrl || !companyId || !lesson) return;
    await incrementDownload(companyId, lesson.id, accessRow?.download_count ?? 0);
    window.open(pdfUrl, "_blank");
  };

  const handleComplete = async () => {
    if (!companyId || !lesson || !user) return;
    setCompleting(true);
    await markLessonCompleted(companyId, lesson.id);
    toast.success("Lezione completata!");

    // Check if course done
    const { data: lessons } = await supabase.from("academy_lessons")
      .select("id").eq("course_id", lesson.course_id).eq("status", "published");
    const { data: completed } = await supabase.from("academy_lesson_access")
      .select("lesson_id, completed_at")
      .eq("client_id", companyId)
      .in("lesson_id", (lessons ?? []).map((l: any) => l.id));
    const doneCount = (completed ?? []).filter((c: any) => c.completed_at).length;

    if (lessons && doneCount === lessons.length) {
      const [{ data: course }, { data: profile }] = await Promise.all([
        supabase.from("academy_courses").select("title").eq("id", lesson.course_id).maybeSingle(),
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      ]);
      const { data: client } = await supabase.from("clients").select("company_name").eq("id", companyId).maybeSingle();
      const path = await generateAndUploadCertificate({
        clientId: companyId,
        courseId: lesson.course_id,
        clientName: client?.company_name ?? profile?.full_name ?? "Cliente",
        courseTitle: course?.title ?? "Corso",
      });
      if (path) {
        setCertPath(path);
        toast.success("Hai completato il corso! Certificato disponibile.");
      }
    }
    setCompleting(false);
  };

  const downloadCert = async () => {
    if (!certPath) return;
    const url = await getCertificateUrl(certPath);
    if (url) window.open(url, "_blank");
  };

  if (!lesson) return <div className="text-muted-foreground">Caricamento…</div>;

  const done = !!accessRow?.completed_at;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Indietro
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Lezione {lesson.lesson_number}: {lesson.title}</CardTitle>
              {lesson.description && <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>}
            </div>
            {done && <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Completata</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {lesson.content_type === "pdf" ? (
            pdfUrl ? (
              <iframe src={pdfUrl} title={lesson.title} className="w-full h-[70vh] rounded-lg border border-border/50" />
            ) : (
              <div className="text-muted-foreground">Caricamento PDF…</div>
            )
          ) : (
            <div className="aspect-video rounded-lg overflow-hidden border border-border/50">
              <iframe
                src={`https://www.youtube.com/embed/${lesson.content_url}`}
                title={lesson.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {lesson.content_type === "pdf" && lesson.is_downloadable && pdfUrl && (
              <Button onClick={handleDownload} variant="outline">
                <Download className="h-4 w-4" /> Scarica PDF
              </Button>
            )}
            <Button onClick={handleComplete} disabled={completing || done}>
              <CheckCircle2 className="h-4 w-4" /> {done ? "Già completata" : "Contrassegna come completata"}
            </Button>
            {certPath && (
              <Button onClick={downloadCert} variant="secondary">
                <Award className="h-4 w-4" /> Scarica certificato
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
