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
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAcademyCourses, type AcademyCourse } from "@/hooks/useAcademy";

const empty = {
  id: "", title: "", description: "", verticale: "shared",
  status: "draft", order_index: 0, prerequisites: "",
};

export default function AdminAcademyCourses() {
  const { courses, loading, reload } = useAcademyCourses();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);

  const save = async () => {
    const payload: any = {
      title: form.title,
      description: form.description,
      verticale: form.verticale,
      status: form.status,
      order_index: Number(form.order_index) || 0,
      prerequisites: form.prerequisites || null,
    };
    if (form.id) {
      const { error } = await supabase.from("academy_courses").update(payload).eq("id", form.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("academy_courses").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Corso salvato");
    setOpen(false); setForm(empty); reload();
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminare questo corso?")) return;
    const { error } = await supabase.from("academy_courses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Corso eliminato"); reload();
  };

  const edit = (c: AcademyCourse) => {
    setForm({ ...c, prerequisites: c.prerequisites ?? "" });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📚 Gestione Corsi</h1>
          <p className="text-muted-foreground">Crea e organizza i corsi Academy</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setForm(empty); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Crea Nuovo Corso</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{form.id ? "Modifica Corso" : "Nuovo Corso"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Titolo *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <Textarea placeholder="Descrizione *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.verticale} onValueChange={v => setForm({ ...form, verticale: v })}>
                  <SelectTrigger><SelectValue placeholder="Verticale" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="wellness">Wellness</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="shared">Condiviso</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue placeholder="Stato" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Bozza</SelectItem>
                    <SelectItem value="published">Pubblicato</SelectItem>
                    <SelectItem value="archived">Archiviato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input type="number" placeholder="Ordine" value={form.order_index} onChange={e => setForm({ ...form, order_index: e.target.value })} />
              <Textarea placeholder="Prerequisiti (opzionale)" value={form.prerequisites} onChange={e => setForm({ ...form, prerequisites: e.target.value })} />
              <Button onClick={save} className="w-full">Salva</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <Card>
        <CardHeader><CardTitle>Corsi ({courses.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-muted-foreground">Caricamento…</div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titolo</TableHead><TableHead>Verticale</TableHead>
                  <TableHead>Stato</TableHead><TableHead>Ordine</TableHead><TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{c.verticale}</Badge></TableCell>
                    <TableCell><Badge variant={c.status === "published" ? "default" : "secondary"}>{c.status}</Badge></TableCell>
                    <TableCell>{c.order_index}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => edit(c)}><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
