import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAcademyCourses, type AcademyLesson } from "@/hooks/useAcademy";

const verticalColor = (v: string) =>
  v === "retail" ? "bg-blue-500/20 text-blue-700 dark:text-blue-300"
  : v === "wellness" ? "bg-green-500/20 text-green-700 dark:text-green-300"
  : v === "repair" ? "bg-orange-500/20 text-orange-700 dark:text-orange-300"
  : "bg-purple-500/20 text-purple-700 dark:text-purple-300";

export default function AdminAcademyScheduling() {
  const { courses } = useAcademyCourses();
  // Batch upload
  const [batchCourse, setBatchCourse] = useState("");
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchStartNum, setBatchStartNum] = useState(1);
  const [batchUploading, setBatchUploading] = useState(false);

  const runBatch = async () => {
    if (!batchCourse) return toast.error("Seleziona un corso");
    if (!batchFiles.length) return toast.error("Nessun file selezionato");
    setBatchUploading(true);
    let n = batchStartNum;
    for (const f of batchFiles) {
      const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `pdf/${batchCourse}/${Date.now()}_${safe}`;
      const { error: upErr } = await supabase.storage.from("academy-lessons").upload(path, f, { contentType: "application/pdf" });
      if (upErr) { toast.error(`${f.name}: ${upErr.message}`); continue; }
      const title = f.name.replace(/\.pdf$/i, "").replace(/_/g, " ");
      await supabase.from("academy_lessons").insert({
        course_id: batchCourse, title, description: "", lesson_number: n++,
        content_type: "pdf", content_url: path, duration_minutes: 10,
        is_downloadable: true, status: "draft",
      });
    }
    toast.success(`${batchFiles.length} lezioni create`);
    setBatchFiles([]); setBatchUploading(false);
  };

  // Auto schedule
  const [autoCourse, setAutoCourse] = useState("");
  const [autoStart, setAutoStart] = useState("");
  const [autoFreqDays, setAutoFreqDays] = useState(14);
  const [autoTime, setAutoTime] = useState("09:00");

  const runAuto = async () => {
    if (!autoCourse || !autoStart) return toast.error("Compila tutti i campi");
    const { data: lessons } = await supabase.from("academy_lessons").select("id, lesson_number")
      .eq("course_id", autoCourse).order("lesson_number");
    if (!lessons?.length) return toast.error("Nessuna lezione nel corso");
    const start = new Date(`${autoStart}T${autoTime}:00`);
    for (let i = 0; i < lessons.length; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i * autoFreqDays);
      await supabase.from("academy_lessons").update({
        published_at: d.toISOString(), status: "scheduled",
      }).eq("id", lessons[i].id);
    }
    toast.success("Programmazione applicata");
  };

  // Calendar
  const [scheduled, setScheduled] = useState<(AcademyLesson & { courseTitle?: string; verticale?: string })[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("academy_lessons")
        .select("*, academy_courses(title, verticale)")
        .not("published_at", "is", null).order("published_at");
      setScheduled((data ?? []).map((r: any) => ({
        ...r, courseTitle: r.academy_courses?.title, verticale: r.academy_courses?.verticale,
      })));
    })();
  }, []);

  // Group by month/day
  const byDate: Record<string, typeof scheduled> = {};
  scheduled.forEach(l => {
    const k = new Date(l.published_at!).toLocaleDateString("it-IT");
    (byDate[k] = byDate[k] || []).push(l);
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">⏰ Scheduling Lezioni</h1>
        <p className="text-muted-foreground">Batch upload e programmazione automatica</p>
      </header>

      <Card>
        <CardHeader><CardTitle>A · Carica lezioni in batch</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Select value={batchCourse} onValueChange={setBatchCourse}>
            <SelectTrigger><SelectValue placeholder="Scegli corso" /></SelectTrigger>
            <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
          </Select>
          <div>
            <Label>Numero lezione iniziale</Label>
            <Input type="number" value={batchStartNum} onChange={e => setBatchStartNum(Number(e.target.value))} />
          </div>
          <div>
            <Label>File PDF (multipli)</Label>
            <Input type="file" accept="application/pdf" multiple onChange={e => setBatchFiles(Array.from(e.target.files ?? []))} />
            {batchFiles.length > 0 && <p className="text-xs text-muted-foreground mt-1">{batchFiles.length} file selezionati</p>}
          </div>
          <Button onClick={runBatch} disabled={batchUploading}>
            {batchUploading ? "Caricamento…" : "Carica in batch"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>B · Calendario lezioni programmate</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {Object.keys(byDate).length === 0 && <p className="text-muted-foreground">Nessuna lezione programmata.</p>}
          {Object.entries(byDate).map(([date, items]) => (
            <div key={date} className="flex gap-3 border-l-2 border-primary/40 pl-4">
              <div className="font-semibold w-32">{date}</div>
              <div className="flex-1 space-y-2">
                {items.map(l => (
                  <div key={l.id} className={`rounded-lg px-3 py-2 ${verticalColor(l.verticale ?? "shared")}`}>
                    <div className="text-sm font-medium">{l.title}</div>
                    <div className="text-xs opacity-80">{l.courseTitle} · {l.content_type} · {l.status}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>C · Programmazione automatica</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Select value={autoCourse} onValueChange={setAutoCourse}>
            <SelectTrigger><SelectValue placeholder="Scegli corso" /></SelectTrigger>
            <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
          </Select>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Data inizio</Label>
              <Input type="date" value={autoStart} onChange={e => setAutoStart(e.target.value)} />
            </div>
            <div>
              <Label>Ora</Label>
              <Input type="time" value={autoTime} onChange={e => setAutoTime(e.target.value)} />
            </div>
            <div>
              <Label>Frequenza (giorni)</Label>
              <Input type="number" value={autoFreqDays} onChange={e => setAutoFreqDays(Number(e.target.value))} />
            </div>
          </div>
          <Button onClick={runAuto}>Applica programmazione</Button>
        </CardContent>
      </Card>
    </div>
  );
}
