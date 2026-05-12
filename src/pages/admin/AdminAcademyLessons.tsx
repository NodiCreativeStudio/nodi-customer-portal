import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, FileText, Video, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAcademyCourses, type AcademyLesson } from "@/hooks/useAcademy";

const empty = {
  id: "", course_id: "", title: "", description: "", lesson_number: 1,
  content_type: "pdf", content_url: "", duration_minutes: 10,
  is_downloadable: true, published_at: "", status: "draft",
};

export default function AdminAcademyLessons() {
  const { courses } = useAcademyCourses();
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [lessons, setLessons] = useState<AcademyLesson[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    let q = supabase.from("academy_lessons").select("*").order("lesson_number");
    if (filterCourse !== "all") q = q.eq("course_id", filterCourse);
    const { data } = await q;
    setLessons((data as AcademyLesson[]) ?? []);
  };

  useEffect(() => { load(); }, [filterCourse]);

  const save = async () => {
    if (!form.course_id) return toast.error("Seleziona un corso");
    setUploading(true);
    let contentUrl = form.content_url;

    if (form.content_type === "pdf" && pdfFile) {
      if (pdfFile.size > 50 * 1024 * 1024) {
        setUploading(false);
        return toast.error("File troppo grande (max 50MB)");
      }
      const safe = pdfFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `pdf/${form.course_id}/${Date.now()}_${safe}`;
      const { error } = await supabase.storage.from("academy-lessons").upload(path, pdfFile, {
        contentType: "application/pdf", upsert: false,
      });
      if (error) { setUploading(false); return toast.error(error.message); }
      contentUrl = path;
    }

    if (!contentUrl) { setUploading(false); return toast.error("Carica un PDF o inserisci ID YouTube"); }

    const payload: any = {
      course_id: form.course_id,
      title: form.title,
      description: form.description || "",
      lesson_number: Number(form.lesson_number) || 1,
      content_type: form.content_type,
      content_url: contentUrl,
      duration_minutes: Number(form.duration_minutes) || 0,
      is_downloadable: form.content_type === "pdf" ? !!form.is_downloadable : false,
      published_at: form.published_at || null,
      status: form.status,
    };
    const res = form.id
      ? await supabase.from("academy_lessons").update(payload).eq("id", form.id)
      : await supabase.from("academy_lessons").insert(payload);
    setUploading(false);
    if (res.error) return toast.error(res.error.message);
    toast.success("Lezione salvata");
    setOpen(false); setForm(empty); setPdfFile(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminare questa lezione?")) return;
    await supabase.from("academy_lessons").delete().eq("id", id);
    toast.success("Eliminata"); load();
  };

  const edit = (l: AcademyLesson) => {
    setForm({ ...l, published_at: l.published_at?.slice(0, 16) ?? "" });
    setPdfFile(null); setOpen(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">📖 Gestione Lezioni</h1>
          <p className="text-muted-foreground">PDF e video delle lezioni</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Filtra per corso" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i corsi</SelectItem>
              {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setForm(empty); setPdfFile(null); } }}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Aggiungi Lezione</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{form.id ? "Modifica Lezione" : "Nuova Lezione"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Select value={form.course_id} onValueChange={v => setForm({ ...form, course_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Corso *" /></SelectTrigger>
                  <SelectContent>
                    {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Titolo *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                <Textarea placeholder="Descrizione" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="Numero lezione" value={form.lesson_number} onChange={e => setForm({ ...form, lesson_number: e.target.value })} />
                  <Input type="number" placeholder="Durata (min)" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} />
                </div>
                <Select value={form.content_type} onValueChange={v => setForm({ ...form, content_type: v, content_url: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="video">Video YouTube</SelectItem>
                  </SelectContent>
                </Select>

                {form.content_type === "pdf" ? (
                  <div className="space-y-2">
                    <Label>File PDF</Label>
                    <Input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files?.[0] ?? null)} />
                    {form.content_url && !pdfFile && <p className="text-xs text-muted-foreground">Esistente: {form.content_url}</p>}
                    <div className="flex items-center gap-2">
                      <Switch checked={form.is_downloadable} onCheckedChange={v => setForm({ ...form, is_downloadable: v })} />
                      <Label>Scaricabile dal cliente</Label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>YouTube Video ID</Label>
                    <Input placeholder="es. dQw4w9WgXcQ" value={form.content_url} onChange={e => setForm({ ...form, content_url: e.target.value.trim() })} />
                    {form.content_url && (
                      <img src={`https://img.youtube.com/vi/${form.content_url}/mqdefault.jpg`} alt="thumb" className="rounded-lg border" />
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Pubblicazione</Label>
                    <Input type="datetime-local" value={form.published_at} onChange={e => setForm({ ...form, published_at: e.target.value })} />
                  </div>
                  <div>
                    <Label>Stato</Label>
                    <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Bozza</SelectItem>
                        <SelectItem value="scheduled">Programmata</SelectItem>
                        <SelectItem value="published">Pubblicata</SelectItem>
                        <SelectItem value="archived">Archiviata</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={save} disabled={uploading} className="w-full">
                  {uploading ? "Salvataggio…" : "Salva"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Card>
        <CardHeader><CardTitle>Lezioni ({lessons.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead><TableHead>Titolo</TableHead>
                <TableHead>Tipo</TableHead><TableHead>Stato</TableHead>
                <TableHead>Pubblicata</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessons.map(l => (
                <TableRow key={l.id}>
                  <TableCell>{l.lesson_number}</TableCell>
                  <TableCell className="font-medium">{l.title}</TableCell>
                  <TableCell>
                    {l.content_type === "pdf" ? <FileText className="h-4 w-4 inline" /> : <Video className="h-4 w-4 inline" />} {l.content_type}
                  </TableCell>
                  <TableCell><Badge variant={l.status === "published" ? "default" : "secondary"}>{l.status}</Badge></TableCell>
                  <TableCell>{l.published_at ? new Date(l.published_at).toLocaleString("it-IT") : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => edit(l)}><Edit className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(l.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
