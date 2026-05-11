import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { LayoutGrid, List, Search, ArrowRight, Inbox, Mail, Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ProjectStatus = "planning" | "in_progress" | "completed";

interface Project {
  id: string;
  project_name: string;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  client_id: string;
  budget: number | null;
  updated_at: string;
}

const statusBadge: Record<ProjectStatus, string> = {
  planning: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/15 text-primary border-primary/20",
  completed: "bg-success/15 text-success border-success/30",
};
const statusLabel: Record<ProjectStatus, string> = {
  planning: "Pianificazione",
  in_progress: "In corso",
  completed: "Completato",
};

function progressOf(p: Project): number {
  if (p.status === "completed") return 100;
  if (p.status === "planning") return 5;
  if (p.start_date && p.end_date) {
    const s = new Date(p.start_date).getTime();
    const e = new Date(p.end_date).getTime();
    const now = Date.now();
    if (e <= s) return 50;
    return Math.max(5, Math.min(95, Math.round(((now - s) / (e - s)) * 100)));
  }
  return 50;
}

export default function ProjectsList() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    project_name: "", description: "", status: "planning" as ProjectStatus,
    start_date: "", end_date: "", budget: "",
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "archived">("all");
  const [sort, setSort] = useState<"name" | "date" | "status">("date");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!user) return;
      setLoading(true);
      const { data: prof } = await supabase
        .from("profiles").select("company_id").eq("id", user.id).maybeSingle();
      const cid = prof?.company_id ?? null;
      if (!cancel) setCompanyId(cid);
      if (!cid) { if (!cancel) { setProjects([]); setLoading(false); } return; }
      const { data } = await supabase
        .from("projects").select("*").eq("client_id", cid);
      if (!cancel) {
        setProjects((data ?? []) as Project[]);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [user]);

  const reload = async () => {
    if (!companyId) return;
    const { data } = await supabase.from("projects").select("*").eq("client_id", companyId);
    setProjects((data ?? []) as Project[]);
  };

  const submitNew = async () => {
    if (!form.project_name.trim()) { toast.error("Il nome del progetto è obbligatorio"); return; }
    if (!companyId) { toast.error("Account non collegato ad un'azienda"); return; }
    setSaving(true);
    const { error } = await supabase.from("projects").insert({
      client_id: companyId,
      project_name: form.project_name.trim(),
      description: form.description.trim() || null,
      status: form.status,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      budget: form.budget ? Number(form.budget) : null,
    } as never);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("✓ Progetto creato");
    setOpenNew(false);
    setForm({ project_name: "", description: "", status: "planning", start_date: "", end_date: "", budget: "" });
    reload();
  };

  const filtered = useMemo(() => {
    let list = [...projects];
    if (filter === "active") list = list.filter((p) => p.status !== "completed");
    else if (filter === "completed") list = list.filter((p) => p.status === "completed");
    else if (filter === "archived") list = [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.project_name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sort === "name") return a.project_name.localeCompare(b.project_name);
      if (sort === "status") return a.status.localeCompare(b.status);
      const da = a.start_date ? new Date(a.start_date).getTime() : 0;
      const db = b.start_date ? new Date(b.start_date).getTime() : 0;
      return db - da;
    });
    return list;
  }, [projects, filter, sort, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('projects.title')}</h1>
          <p className="text-sm text-muted-foreground">Sfoglia, filtra e apri i dettagli dei progetti.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "cards" ? "default" : "outline"} size="sm"
            onClick={() => setView("cards")}
          ><LayoutGrid className="h-4 w-4" /></Button>
          <Button
            variant={view === "table" ? "default" : "outline"} size="sm"
            onClick={() => setView("table")}
          ><List className="h-4 w-4" /></Button>
          <Button size="sm" onClick={() => setOpenNew(true)}>
            <Plus className="mr-1 h-4 w-4" />Nuovo progetto
          </Button>
        </div>
      </div>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuovo progetto</DialogTitle>
            <DialogDescription>Crea un nuovo progetto per la tua azienda.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome progetto *</Label>
              <Input value={form.project_name} maxLength={120}
                onChange={(e) => setForm({ ...form, project_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrizione</Label>
              <Textarea value={form.description} maxLength={2000}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Stato</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProjectStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Pianificazione</SelectItem>
                  <SelectItem value="in_progress">In corso</SelectItem>
                  <SelectItem value="completed">Completato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data inizio</Label>
                <Input type="date" value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Data fine</Label>
                <Input type="date" value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Budget (€)</Label>
              <Input type="number" min="0" value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Annulla</Button>
            <Button onClick={submitNew} disabled={saving}>{saving ? "Salvataggio..." : "Crea"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome progetto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="active">Attivi</SelectItem>
              <SelectItem value="completed">Completati</SelectItem>
              <SelectItem value="archived">Archiviati</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Ordina per nome</SelectItem>
              <SelectItem value="date">Ordina per data</SelectItem>
              <SelectItem value="status">Ordina per stato</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="rounded-full bg-muted p-4"><Inbox className="h-8 w-8 text-muted-foreground" /></div>
            <h3 className="text-lg font-semibold">Nessun progetto</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Non hai ancora progetti. Contattaci per iniziare.
            </p>
            <Button asChild><Link to="/contacts"><Mail className="mr-2 h-4 w-4" />Contattaci</Link></Button>
          </CardContent>
        </Card>
      ) : view === "cards" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const pct = progressOf(p);
            return (
              <Card key={p.id} className="group transition-all hover:shadow-md hover:-translate-y-0.5">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight">{p.project_name}</CardTitle>
                    <Badge variant="outline" className={cn("shrink-0", statusBadge[p.status])}>
                      {statusLabel[p.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Avanzamento</span><span className="font-medium text-foreground">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.start_date ? format(new Date(p.start_date), "d MMM yyyy") : "—"}
                    {" → "}
                    {p.end_date ? format(new Date(p.end_date), "d MMM yyyy") : "—"}
                  </div>
                  <div className="flex -space-x-2">
                    {["A", "B", "C"].map((l, i) => (
                      <div key={i} className="h-7 w-7 rounded-full border-2 border-background bg-primary/10 text-xs font-medium text-primary grid place-items-center">{l}</div>
                    ))}
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link to={`/projects/${p.id}`}>Vedi dettagli <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome progetto</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Avanzamento</TableHead>
                <TableHead>Inizio</TableHead>
                <TableHead>Fine</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const pct = progressOf(p);
                return (
                  <TableRow key={p.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link to={`/projects/${p.id}`} className="hover:underline">{p.project_name}</Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadge[p.status]}>{statusLabel[p.status]}</Badge>
                    </TableCell>
                    <TableCell className="w-48">
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-2" />
                        <span className="text-xs text-muted-foreground w-9 text-right">{pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{p.start_date ? format(new Date(p.start_date), "d MMM yyyy") : "—"}</TableCell>
                    <TableCell>{p.end_date ? format(new Date(p.end_date), "d MMM yyyy") : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/projects/${p.id}`}>Apri</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
