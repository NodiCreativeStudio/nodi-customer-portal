import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderKanban, ListChecks, CheckCircle2, CalendarClock,
  Upload, Layers, Contact, RefreshCw, Search, ArrowRight,
  FileUp, CheckSquare, Flag, Inbox,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format, differenceInDays, addDays } from "date-fns";

type ProjectStatus = "planning" | "in_progress" | "completed";
type TaskStatus = "todo" | "in_progress" | "done";

interface Project {
  id: string;
  project_name: string;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  client_id: string;
}
interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  due_date: string | null;
  project_id: string;
  assigned_to: string | null;
}
interface Upload {
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

function projectProgress(p: Project): number {
  if (p.status === "completed") return 100;
  if (p.status === "planning") return 5;
  if (p.start_date && p.end_date) {
    const start = new Date(p.start_date).getTime();
    const end = new Date(p.end_date).getTime();
    const now = Date.now();
    if (end <= start) return 50;
    return Math.max(5, Math.min(95, Math.round(((now - start) / (end - start)) * 100)));
  }
  return 50;
}

function taskPriority(due: string | null): { label: string; tone: string } {
  if (!due) return { label: "Low", tone: "bg-muted text-muted-foreground" };
  const days = differenceInDays(new Date(due), new Date());
  if (days < 0) return { label: "Overdue", tone: "bg-destructive/15 text-destructive border-destructive/30" };
  if (days <= 2) return { label: "High", tone: "bg-secondary/15 text-secondary border-secondary/30" };
  if (days <= 5) return { label: "Medium", tone: "bg-warning/15 text-warning border-warning/30" };
  return { label: "Low", tone: "bg-muted text-muted-foreground" };
}

export default function Dashboard() {
  const { user, role } = useAuth();
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    setRefreshing(true);
    const weekAhead = addDays(new Date(), 7).toISOString().slice(0, 10);

    const [projRes, weekTasksRes, doneTasksRes, uploadsRes] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("tasks").select("*").lte("due_date", weekAhead).neq("status", "done").order("due_date", { ascending: true }),
      supabase.from("tasks").select("*").eq("status", "done"),
      supabase.from("uploads").select("id, file_name, uploaded_at").order("uploaded_at", { ascending: false }).limit(10),
    ]);

    setProjects((projRes.data ?? []) as Project[]);
    setTasks((weekTasksRes.data ?? []) as Task[]);
    setCompletedTasks((doneTasksRes.data ?? []) as Task[]);
    setUploads((uploadsRes.data ?? []) as Upload[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0]
    ?? user?.email?.split("@")[0]
    ?? "there";

  const activeProjects = projects.filter((p) => p.status !== "completed");
  const allTasksCount = tasks.length + completedTasks.length;

  // Days until next milestone = closest upcoming project end_date
  const nextMilestone = (() => {
    const future = projects
      .map((p) => p.end_date)
      .filter((d): d is string => !!d && new Date(d) >= new Date())
      .sort();
    if (!future.length) return null;
    return differenceInDays(new Date(future[0]), new Date());
  })();

  const recentDoneTasks = [...completedTasks]
    .sort((a, b) => (b.due_date ?? "").localeCompare(a.due_date ?? ""))
    .slice(0, 5);

  const activity = [
    ...uploads.map((u) => ({
      id: `u-${u.id}`,
      kind: "upload" as const,
      title: u.file_name,
      date: u.uploaded_at,
    })),
    ...recentDoneTasks.map((t) => ({
      id: `t-${t.id}`,
      kind: "task" as const,
      title: t.title,
      date: t.due_date ?? new Date().toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const filteredProjects = activeProjects.filter((p) =>
    !search || p.project_name.toLowerCase().includes(search.toLowerCase()),
  );

  const stats = [
    { label: "Active projects", value: activeProjects.length, icon: FolderKanban, tone: "text-primary bg-primary/10" },
    { label: "Total tasks", value: allTasksCount, icon: ListChecks, tone: "text-[hsl(var(--primary-glow))] bg-primary/5" },
    { label: "Completed deliverables", value: completedTasks.length, icon: CheckCircle2, tone: "text-success bg-success/10" },
    { label: "Days to next milestone", value: nextMilestone ?? "—", icon: CalendarClock, tone: "text-secondary bg-secondary/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500" style={{ background: "transparent" }}>
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {firstName}!
          </h1>
          <p className="text-muted-foreground">
            {format(now, "EEEE, MMMM d, yyyy")} · {format(now, "HH:mm")}
            {role === "admin" && <span className="ml-2 text-primary font-medium">· Admin view</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="pl-8 w-full sm:w-64"
            />
          </div>
          <Button variant="outline" size="icon" onClick={load} disabled={refreshing} aria-label="Refresh">
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card
            key={s.label}
            className="shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", s.tone)}>
                <s.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : s.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Projects + Tasks */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-[var(--shadow-card)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your active projects</CardTitle>
              <CardDescription>Live status of ongoing engagements</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/projects">View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : filteredProjects.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title={search ? "No matching projects" : "No active projects yet"}
                description={search ? "Try a different search term." : "Active projects will appear here once your team starts one."}
              />
            ) : (
              <div className="space-y-3">
                {filteredProjects.slice(0, 5).map((p) => {
                  const progress = projectProgress(p);
                  return (
                    <Link
                      key={p.id}
                      to={`/projects`}
                      className="block rounded-lg border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium truncate">{p.project_name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.start_date ? format(new Date(p.start_date), "MMM d, yyyy") : "—"}
                            {" → "}
                            {p.end_date ? format(new Date(p.end_date), "MMM d, yyyy") : "—"}
                          </p>
                        </div>
                        <Badge variant="outline" className={cn("border", statusBadge[p.status])}>
                          {statusLabel[p.status]}
                        </Badge>
                      </div>
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span className="font-medium text-foreground">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tasks due this week</CardTitle>
              <CardDescription>Next 7 days</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : tasks.length === 0 ? (
              <EmptyState icon={CheckSquare} title="All caught up" description="No tasks due this week." />
            ) : (
              <ul className="space-y-2">
                {tasks.slice(0, 6).map((t) => {
                  const pr = taskPriority(t.due_date);
                  const overdue = t.due_date && new Date(t.due_date) < new Date();
                  return (
                    <li key={t.id}>
                      <Link
                        to={`/projects`}
                        className="flex items-center gap-3 rounded-md border p-2.5 transition-colors hover:bg-accent"
                      >
                        <Flag className={cn("h-4 w-4 shrink-0", overdue ? "text-destructive" : "text-muted-foreground")} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{t.title}</p>
                          <p className={cn("text-xs", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                            {t.due_date ? `Due ${format(new Date(t.due_date), "MMM d")}` : "No due date"}
                          </p>
                        </div>
                        <Badge variant="outline" className={cn("border text-[10px]", pr.tone)}>
                          {pr.label}
                        </Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            <Button variant="ghost" size="sm" className="mt-3 w-full" asChild>
              <Link to="/projects">View all tasks <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Activity */}
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Latest uploads and completed tasks</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : activity.length === 0 ? (
            <EmptyState icon={Inbox} title="No recent activity" description="Activity will appear here as your team works." />
          ) : (
            <ol className="relative space-y-4 border-l border-border pl-6">
              {activity.map((a) => (
                <li key={a.id} className="relative">
                  <span className={cn(
                    "absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background",
                    a.kind === "upload" ? "bg-primary/15 text-primary" : "bg-success/15 text-success",
                  )}>
                    {a.kind === "upload" ? <FileUp className="h-3 w-3" /> : <CheckSquare className="h-3 w-3" />}
                  </span>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm">
                      <span className="font-medium">
                        {a.kind === "upload" ? "Uploaded " : "Completed task "}
                      </span>
                      <span className="text-muted-foreground">{a.title}</span>
                    </p>
                    <time className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(a.date), { addSuffix: true })}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickAction to="/uploads" icon={Upload} label="Upload files" />
        <QuickAction to="/stack" icon={Layers} label="View stack" />
        <QuickAction to="/contacts" icon={Contact} label="Contact us" />
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border bg-card p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-elegant)]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
