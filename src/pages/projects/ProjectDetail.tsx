import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import {
  CalendarRange, CalendarCheck2, Wallet, Activity, ArrowLeft, FileText,
  Mail, Plus, CheckCircle2, Circle,
} from "lucide-react";
import { toast } from "sonner";

type ProjectStatus = "planning" | "in_progress" | "completed";
type TaskStatus = "todo" | "in_progress" | "done";

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
interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  due_date: string | null;
  project_id: string;
  assigned_to: string | null;
  description: string | null;
}
interface UploadRow {
  id: string;
  file_name: string;
  uploaded_at: string;
}

const statusBadge: Record<ProjectStatus, string> = {
  planning: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/15 text-primary border-primary/20",
  completed: "bg-success/15 text-success border-success/30",
};
const statusLabel: Record<ProjectStatus, string> = {
  planning: "Planning",
  in_progress: "In progress",
  completed: "Completed",
};
const taskTone: Record<TaskStatus, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/15 text-primary border-primary/20",
  done: "bg-success/15 text-success border-success/30",
};
const taskLabel: Record<TaskStatus, string> = {
  todo: "To-Do", in_progress: "In Progress", done: "Done",
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

function priorityOf(due: string | null): { label: string; tone: string } {
  if (!due) return { label: "Low", tone: "bg-muted text-muted-foreground" };
  const d = differenceInDays(new Date(due), new Date());
  if (d < 0) return { label: "Overdue", tone: "bg-destructive/15 text-destructive border-destructive/30" };
  if (d <= 2) return { label: "High", tone: "bg-secondary/15 text-secondary border-secondary/30" };
  if (d <= 5) return { label: "Medium", tone: "bg-warning/15 text-warning border-warning/30" };
  return { label: "Low", tone: "bg-muted text-muted-foreground" };
}

function buildPhases(p: Project) {
  if (!p.start_date || !p.end_date) {
    return [
      { name: "Planning", from: null as Date | null, to: null as Date | null, done: p.status !== "planning" },
      { name: "Development", from: null, to: null, done: p.status === "completed" },
      { name: "Testing", from: null, to: null, done: p.status === "completed" },
      { name: "Launch", from: null, to: null, done: p.status === "completed" },
    ];
  }
  const start = new Date(p.start_date).getTime();
  const end = new Date(p.end_date).getTime();
  const span = end - start;
  const pct = progressOf(p);
  const seg = (a: number, b: number) => ({
    from: new Date(start + span * a),
    to: new Date(start + span * b),
    done: pct >= b * 100,
  });
  return [
    { name: "Planning", ...seg(0, 0.2) },
    { name: "Development", ...seg(0.2, 0.7) },
    { name: "Testing", ...seg(0.7, 0.9) },
    { name: "Launch", ...seg(0.9, 1) },
  ];
}

const TEAM = [
  { name: "Sara Bianchi", role: "Project Manager", email: "sara@nodi.agency" },
  { name: "Luca Rossi", role: "Lead Developer", email: "luca@nodi.agency" },
  { name: "Elena Conti", role: "Designer", email: "elena@nodi.agency" },
];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [taskFilter, setTaskFilter] = useState<"all" | TaskStatus>("all");
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [deliverables, setDeliverables] = useState<{ name: string; date: string; done: boolean }[]>([]);
  const [openNewTask, setOpenNewTask] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "", description: "", status: "todo" as TaskStatus,
    due_date: "", priority: "medium" as "low" | "medium" | "high",
  });

  const reloadTasks = async () => {
    if (!id) return;
    const { data } = await supabase.from("tasks").select("*")
      .eq("project_id", id).order("due_date", { ascending: true });
    setTasks((data ?? []) as Task[]);
  };

  const submitNewTask = async () => {
    if (!id) return;
    if (!taskForm.title.trim()) { toast.error("Title is required"); return; }
    setSavingTask(true);
    const { error } = await supabase.from("tasks").insert({
      project_id: id,
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || null,
      status: taskForm.status,
      due_date: taskForm.due_date || null,
      priority: taskForm.priority,
    } as never);
    setSavingTask(false);
    if (error) { toast.error(error.message); return; }
    toast.success("✓ Task created");
    setOpenNewTask(false);
    setTaskForm({ title: "", description: "", status: "todo", due_date: "", priority: "medium" });
    reloadTasks();
  };

  useEffect(() => {
    if (!id) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      const [{ data: pj }, { data: tk }] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).maybeSingle(),
        supabase.from("tasks").select("*").eq("project_id", id).order("due_date", { ascending: true }),
      ]);
      let up: UploadRow[] = [];
      if (pj) {
        const { data: u } = await supabase
          .from("uploads").select("id,file_name,uploaded_at")
          .eq("client_id", (pj as Project).client_id)
          .order("uploaded_at", { ascending: false }).limit(5);
        up = (u ?? []) as UploadRow[];
      }
      if (!cancel) {
        setProject((pj as Project) ?? null);
        setTasks((tk ?? []) as Task[]);
        setUploads(up);
        const phases = buildPhases((pj as Project) ?? { status: "planning" } as Project);
        setDeliverables(phases.map((ph) => ({
          name: `${ph.name} sign-off`,
          date: ph.to ? format(ph.to, "MMM d, yyyy") : "—",
          done: ph.done,
        })));
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [id]);

  const filteredTasks = useMemo(() => {
    if (taskFilter === "all") return tasks;
    return tasks.filter((t) => t.status === taskFilter);
  }, [tasks, taskFilter]);

  const phases = useMemo(() => (project ? buildPhases(project) : []), [project]);
  const pct = project ? progressOf(project) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!project) {
    return (
      <Card><CardContent className="py-16 text-center space-y-3">
        <h2 className="text-xl font-semibold">Project not found</h2>
        <Button asChild variant="outline"><Link to="/projects"><ArrowLeft className="mr-2 h-4 w-4" />Back to projects</Link></Button>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/projects"><ArrowLeft className="mr-2 h-4 w-4" />All projects</Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.project_name}</h1>
            <p className="text-sm text-muted-foreground">
              Last updated {format(new Date(project.updated_at), "MMM d, yyyy 'at' HH:mm")}
            </p>
          </div>
          <Badge variant="outline" className={cn("text-sm", statusBadge[project.status])}>
            {statusLabel[project.status]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <InfoCard icon={<CalendarRange className="h-4 w-4" />} label="Start Date"
          value={project.start_date ? format(new Date(project.start_date), "MMM d, yyyy") : "—"} />
        <InfoCard icon={<CalendarCheck2 className="h-4 w-4" />} label="End Date"
          value={project.end_date ? format(new Date(project.end_date), "MMM d, yyyy") : "—"} />
        <InfoCard icon={<Wallet className="h-4 w-4" />} label="Budget"
          value={project.budget != null ? `€${project.budget.toLocaleString()}` : "—"} />
        <InfoCard icon={<Activity className="h-4 w-4" />} label="Progress" value={`${pct}%`} />
      </div>

      <Card>
        <CardHeader><CardTitle>Progress & Timeline</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall progress</span>
              <span className="font-medium">{pct}%</span>
            </div>
            <Progress value={pct} className="h-3" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {phases.map((ph, i) => (
              <div key={i} className={cn(
                "rounded-lg border p-4 transition-colors",
                ph.done ? "bg-success/5 border-success/30" : "bg-card"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  {ph.done ? <CheckCircle2 className="h-4 w-4 text-success" />
                    : <Circle className="h-4 w-4 text-muted-foreground" />}
                  <span className="font-medium text-sm">Phase {i + 1}: {ph.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {ph.from ? format(ph.from, "MMM d") : "—"} → {ph.to ? format(ph.to, "MMM d, yyyy") : "—"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Project Tasks</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={taskFilter} onValueChange={(v) => setTaskFilter(v as typeof taskFilter)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="todo">To-Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => toast.info("Task creation coming soon")}>
              <Plus className="mr-1 h-4 w-4" />Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTasks.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No tasks in this view.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((t) => {
                  const pri = priorityOf(t.due_date);
                  const overdue = pri.label === "Overdue" && t.status !== "done";
                  return (
                    <TableRow key={t.id} onClick={() => setOpenTask(t)}
                      className={cn("cursor-pointer", overdue && "bg-destructive/5")}>
                      <TableCell className="font-medium">{t.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={taskTone[t.status]}>{taskLabel[t.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.assigned_to ?? "Unassigned"}
                      </TableCell>
                      <TableCell className={cn("text-sm", overdue && "text-destructive font-medium")}>
                        {t.due_date ? format(new Date(t.due_date), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={pri.tone}>{pri.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Project Deliverables</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {deliverables.map((d, i) => (
              <div key={i} className="flex items-center gap-3 rounded-md border p-3">
                <Checkbox
                  checked={d.done}
                  disabled={project.status !== "in_progress"}
                  onCheckedChange={(v) => {
                    setDeliverables((prev) => prev.map((x, idx) => idx === i ? { ...x, done: !!v } : x));
                  }}
                />
                <div className="flex-1">
                  <p className={cn("text-sm font-medium", d.done && "line-through text-muted-foreground")}>{d.name}</p>
                  <p className="text-xs text-muted-foreground">Due {d.date}</p>
                </div>
                {d.done && <CheckCircle2 className="h-4 w-4 text-success" />}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Team</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {TEAM.map((m) => (
              <div key={m.email} className="flex items-center gap-3 rounded-md border p-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center font-medium">
                  {m.name.split(" ").map((s) => s[0]).join("")}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.role} · {m.email}</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <a href={`mailto:${m.email}`}><Mail className="h-4 w-4" /></a>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Project Documents</CardTitle>
          <Button asChild variant="outline" size="sm"><Link to="/uploads">Open uploads</Link></Button>
        </CardHeader>
        <CardContent>
          {uploads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent documents.</p>
          ) : (
            <ul className="divide-y">
              {uploads.map((u) => (
                <li key={u.id} className="flex items-center gap-3 py-2.5">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm">{u.file_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(u.uploaded_at), "MMM d, yyyy")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!openTask} onOpenChange={(o) => !o && setOpenTask(null)}>
        <DialogContent>
          {openTask && (
            <>
              <DialogHeader>
                <DialogTitle>{openTask.title}</DialogTitle>
                <DialogDescription>
                  {openTask.due_date ? `Due ${format(new Date(openTask.due_date), "PPP")}` : "No due date"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Badge variant="outline" className={taskTone[openTask.status]}>{taskLabel[openTask.status]}</Badge>
                  <Badge variant="outline" className={priorityOf(openTask.due_date).tone}>
                    {priorityOf(openTask.due_date).label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {openTask.description ?? "No description provided."}
                </p>
                <p className="text-xs text-muted-foreground">
                  Assigned to: {openTask.assigned_to ?? "Unassigned"}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          {icon}<span>{label}</span>
        </div>
        <p className="text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
