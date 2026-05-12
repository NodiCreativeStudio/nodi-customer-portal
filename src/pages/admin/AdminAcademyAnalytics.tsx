import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { downloadCsv } from "@/lib/csv-export";

export default function AdminAcademyAnalytics() {
  const [stats, setStats] = useState({ courses: 0, lessons: 0, completions: 0, certificates: 0 });
  const [byCourse, setByCourse] = useState<any[]>([]);
  const [byLesson, setByLesson] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ count: cCourses }, { count: cLessons }, { count: cComp }, { data: certs }] = await Promise.all([
        supabase.from("academy_courses").select("*", { count: "exact", head: true }),
        supabase.from("academy_lessons").select("*", { count: "exact", head: true }),
        supabase.from("academy_course_completion").select("*", { count: "exact", head: true }),
        supabase.from("academy_course_completion").select("certificate_path").not("certificate_path", "is", null),
      ]);
      setStats({
        courses: cCourses ?? 0, lessons: cLessons ?? 0,
        completions: cComp ?? 0, certificates: certs?.length ?? 0,
      });

      // by course
      const { data: courses } = await supabase.from("academy_courses").select("id, title, verticale");
      const { data: accesses } = await supabase.from("academy_lesson_access").select("lesson_id, completed_at");
      const { data: lessons } = await supabase.from("academy_lessons").select("id, course_id, title, content_type");

      const lessonsByCourse: Record<string, string[]> = {};
      (lessons ?? []).forEach((l: any) => {
        (lessonsByCourse[l.course_id] = lessonsByCourse[l.course_id] || []).push(l.id);
      });

      const courseRows = (courses ?? []).map((c: any) => {
        const lids = lessonsByCourse[c.id] ?? [];
        const views = (accesses ?? []).filter((a: any) => lids.includes(a.lesson_id)).length;
        const completed = (accesses ?? []).filter((a: any) => lids.includes(a.lesson_id) && a.completed_at).length;
        const rate = views > 0 ? Math.round((completed / views) * 100) : 0;
        return { id: c.id, title: c.title, verticale: c.verticale, lessons: lids.length, views, completed, rate };
      });
      setByCourse(courseRows);

      const lessonRows = (lessons ?? []).map((l: any) => {
        const ax = (accesses ?? []).filter((a: any) => a.lesson_id === l.id);
        const completed = ax.filter((a: any) => a.completed_at).length;
        return { ...l, views: ax.length, completed, rate: ax.length ? Math.round(completed / ax.length * 100) : 0 };
      });
      setByLesson(lessonRows);
    })();
  }, []);

  const exportCsv = () => {
    const rows: any[] = [["Corso", "Verticale", "Lezioni", "Views", "Completati", "Tasso %"]];
    byCourse.forEach(r => rows.push([r.title, r.verticale, r.lessons, r.views, r.completed, r.rate]));
    downloadCsv("academy-analytics", rows);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📊 Analytics Academy</h1>
          <p className="text-muted-foreground">Metriche di engagement e completamento</p>
        </div>
        <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> Esporta CSV</Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: "Corsi totali", v: stats.courses },
          { l: "Lezioni totali", v: stats.lessons },
          { l: "Completamenti", v: stats.completions },
          { l: "Certificati", v: stats.certificates },
        ].map(s => (
          <Card key={s.l}>
            <CardHeader><CardTitle className="text-sm text-muted-foreground">{s.l}</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{s.v}</div></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Per Corso</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corso</TableHead><TableHead>Verticale</TableHead>
                <TableHead>Lezioni</TableHead><TableHead>Views</TableHead>
                <TableHead>Completati</TableHead><TableHead>Tasso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byCourse.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell className="capitalize">{r.verticale}</TableCell>
                  <TableCell>{r.lessons}</TableCell>
                  <TableCell>{r.views}</TableCell>
                  <TableCell>{r.completed}</TableCell>
                  <TableCell>{r.rate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Per Lezione</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lezione</TableHead><TableHead>Tipo</TableHead>
                <TableHead>Views</TableHead><TableHead>Completati</TableHead><TableHead>Tasso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byLesson.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell>{r.content_type}</TableCell>
                  <TableCell>{r.views}</TableCell>
                  <TableCell>{r.completed}</TableCell>
                  <TableCell>{r.rate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
