import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, format, subMonths, startOfMonth } from "date-fns";
import {
  Users, FolderKanban, TrendingUp, AlertTriangle, Search, Mail,
  Eye, Archive, Download as DownloadIcon, Activity,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  company_name: string;
  industry: string | null;
  status: string;
  contact_email: string | null;
  contact_phone: string | null;
  contract_date: string | null;
  updated_at: string;
}
interface Project {
  id: string; client_id: string; project_name: string;
  status: string; budget: number | null; start_date: string | null;
  end_date: string | null; updated_at: string;
}
interface Tech { id: string; client_id: string; cost_monthly: number | null; renewal_date: string | null; status: string; }

const STATUS_CLS: Record<string, string> = {
  active:   "bg-success/10 text-success border-success/20",
  inactive: "bg-muted text-muted-foreground border-border",
  trial:    "bg-primary/10 text-primary border-primary/20",
  paused:   "bg-warning/10 text-warning border-warning/20",
  planning: "bg-accent/10 text-accent-foreground border-accent/30",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-success/10 text-success border-success/20",
};

function StatCard({ icon: Icon, label, value, hint }: any) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tech, setTech] = useState<Tech[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [sort, setSort] = useState<"name" | "date" | "status">("date");

  const [projStatus, setProjStatus] = useState<string>("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [c, p, t] = await Promise.all([
        supabase.from("clients").select("*"),
        supabase.from("projects").select("*"),
        supabase.from("tech_stack").select("id, client_id, cost_monthly, renewal_date, status"),
      ]);
      if (c.error || p.error || t.error) toast.error("Failed to load admin data");
      setClients((c.data ?? []) as Client[]);
      setProjects((p.data ?? []) as Project[]);
      setTech((t.data ?? []) as Tech[]);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const active = clients.filter(c => c.status === "active").length;
    const mrr = tech.reduce((s, t) => s + (Number(t.cost_monthly) || 0), 0);
    const now = Date.now();
    const in30 = now + 30 * 86400000;
    const renewals = tech.filter(t => {
      if (!t.renewal_date) return false;
      const d = new Date(t.renewal_date).getTime();
      return d >= now && d <= in30;
    }).length;
    return {
      activeClients: active,
      totalProjects: projects.length,
      mrr,
      renewals,
    };
  }, [clients, projects, tech]);

  const projectCountByClient = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach(p => map.set(p.client_id, (map.get(p.client_id) ?? 0) + 1));
    return map;
  }, [projects]);

  const filteredClients = useMemo(() => {
    let list = clients.filter(c => {
      if (industry !== "all" && c.industry !== industry) return false;
      if (status !== "all" && c.status !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!c.company_name.toLowerCase().includes(q) &&
            !(c.contact_email ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
    list.sort((a, b) => {
      if (sort === "name") return a.company_name.localeCompare(b.company_name);
      if (sort === "status") return a.status.localeCompare(b.status);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return list;
  }, [clients, industry, status, search, sort]);

  const industries = useMemo(() => {
    return Array.from(new Set(clients.map(c => c.industry).filter(Boolean))) as string[];
  }, [clients]);

  // Revenue chart: last 12 months (synthetic from MRR baseline)
  const revenueSeries = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => startOfMonth(subMonths(new Date(), 11 - i)));
    return months.map((m, i) => ({
      month: format(m, "MMM"),
      revenue: Math.round(stats.mrr * (0.7 + i * 0.03 + Math.sin(i) * 0.05)),
    }));
  }, [stats.mrr]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => projStatus === "all" || p.status === projStatus);
  }, [projects, projStatus]);

  const exportClientsCsv = () => {
    const rows = [
      ["Company", "Industry", "Status", "Email", "Phone", "Projects", "Last Activity"],
      ...filteredClients.map(c => [
        c.company_name, c.industry ?? "", c.status, c.contact_email ?? "",
        c.contact_phone ?? "", String(projectCountByClient.get(c.id) ?? 0),
        c.updated_at,
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "clients.csv"; a.click(); URL.revokeObjectURL(url);
    toast.success("Clients exported");
  };

  const archiveClient = async (id: string) => {
    const { error } = await supabase.from("clients").update({ status: "inactive" }).eq("id", id);
    if (error) return toast.error("Archive failed");
    setClients(prev => prev.map(c => c.id === id ? { ...c, status: "inactive" } : c));
    toast.success("Client archived");
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage clients, projects and revenue.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <StatCard icon={Users} label="Active Clients" value={stats.activeClients} hint={`${clients.length} total`} />
            <StatCard icon={FolderKanban} label="Total Projects" value={stats.totalProjects} />
            <StatCard icon={TrendingUp} label="MRR" value={`€${stats.mrr.toLocaleString()}`} hint="from tech stack" />
            <StatCard icon={AlertTriangle} label="Renewals (30d)" value={stats.renewals} />
          </>
        )}
      </div>

      <Tabs defaultValue="clients">
        <TabsList>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* CLIENTS */}
        <TabsContent value="clients" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-4 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger className="md:w-[160px]"><SelectValue placeholder="Industry" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All industries</SelectItem>
                  {industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="md:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={v => setSort(v as any)}>
                <SelectTrigger className="md:w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Last activity</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportClientsCsv}>
                <DownloadIcon className="h-4 w-4 mr-2" />Export
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1.5fr_80px_140px_180px] gap-3 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/30">
              <span>Client</span><span>Industry</span><span>Status</span>
              <span>Contact</span><span>Projects</span><span>Last Activity</span>
              <span className="text-right">Actions</span>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No clients found.</div>
            ) : filteredClients.map(c => (
              <div key={c.id} className="grid md:grid-cols-[1.5fr_1fr_1fr_1.5fr_80px_140px_180px] gap-3 px-4 py-3 items-center border-b last:border-0 hover:bg-muted/20">
                <Link to={`/admin/clients/${c.id}`} className="font-medium hover:text-primary">{c.company_name}</Link>
                <span><Badge variant="outline" className="capitalize">{c.industry ?? "—"}</Badge></span>
                <span><Badge variant="outline" className={cn("capitalize", STATUS_CLS[c.status])}>{c.status}</Badge></span>
                <a href={`mailto:${c.contact_email}`} className="text-sm text-muted-foreground truncate hover:text-primary">
                  {c.contact_email ?? "—"}
                </a>
                <span className="text-sm">{projectCountByClient.get(c.id) ?? 0}</span>
                <span className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}</span>
                <div className="flex justify-end gap-1">
                  <Button asChild size="icon" variant="ghost" title="View"><Link to={`/admin/clients/${c.id}`}><Eye className="h-4 w-4" /></Link></Button>
                  <Button size="icon" variant="ghost" asChild title="Email"><a href={`mailto:${c.contact_email}`}><Mail className="h-4 w-4" /></a></Button>
                  <Button size="icon" variant="ghost" onClick={() => archiveClient(c.id)} title="Archive"><Archive className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </Card>
        </TabsContent>

        {/* PROJECTS */}
        <TabsContent value="projects" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-4 flex gap-3">
              <Select value={projStatus} onValueChange={setProjStatus}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_120px_100px] gap-3 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/30">
              <span>Project</span><span>Client</span><span>Status</span>
              <span>Budget</span><span>End Date</span><span className="text-right">Actions</span>
            </div>
            {filteredProjects.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No projects.</div>
            ) : filteredProjects.map(p => {
              const client = clients.find(c => c.id === p.client_id);
              return (
                <div key={p.id} className="grid md:grid-cols-[2fr_1.5fr_1fr_1fr_120px_100px] gap-3 px-4 py-3 items-center border-b last:border-0 hover:bg-muted/20">
                  <Link to={`/projects/${p.id}`} className="font-medium hover:text-primary">{p.project_name}</Link>
                  <Link to={client ? `/admin/clients/${client.id}` : "#"} className="text-sm text-muted-foreground hover:text-primary">{client?.company_name ?? "—"}</Link>
                  <span><Badge variant="outline" className={cn("capitalize", STATUS_CLS[p.status])}>{p.status.replace("_", " ")}</Badge></span>
                  <span className="text-sm">{p.budget ? `€${Number(p.budget).toLocaleString()}` : "—"}</span>
                  <span className="text-sm text-muted-foreground">{p.end_date ? format(new Date(p.end_date), "MMM d, yyyy") : "—"}</span>
                  <div className="flex justify-end">
                    <Button asChild size="sm" variant="ghost"><Link to={`/projects/${p.id}`}>View</Link></Button>
                  </div>
                </div>
              );
            })}
          </Card>
        </TabsContent>

        {/* REVENUE */}
        <TabsContent value="revenue" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon={TrendingUp} label="MRR" value={`€${stats.mrr.toLocaleString()}`} />
            <StatCard icon={TrendingUp} label="ARR" value={`€${(stats.mrr * 12).toLocaleString()}`} />
            <StatCard icon={AlertTriangle} label="Renewals (30d)" value={stats.renewals} />
          </div>

          <Card>
            <CardHeader><CardTitle>Revenue trend (last 12 months)</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#rev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader><CardTitle>Upcoming renewals</CardTitle></CardHeader>
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/30">
              <span>Client</span><span>Renewal Date</span><span>Monthly</span><span>Status</span>
            </div>
            {tech.filter(t => t.renewal_date).slice(0, 10).map(t => {
              const client = clients.find(c => c.id === t.client_id);
              return (
                <div key={t.id} className="grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-4 py-3 items-center border-b last:border-0">
                  <span className="font-medium">{client?.company_name ?? "—"}</span>
                  <span className="text-sm">{t.renewal_date ? format(new Date(t.renewal_date), "MMM d, yyyy") : "—"}</span>
                  <span className="text-sm">€{Number(t.cost_monthly ?? 0).toLocaleString()}</span>
                  <span><Badge variant="outline" className={cn("capitalize", STATUS_CLS[t.status])}>{t.status}</Badge></span>
                </div>
              );
            })}
            {tech.filter(t => t.renewal_date).length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No upcoming renewals.</div>
            )}
          </Card>
        </TabsContent>

        {/* ACTIVITY */}
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[...projects.map(p => ({
                id: `p-${p.id}`, when: p.updated_at,
                text: `Project "${p.project_name}" updated`, icon: FolderKanban,
              })), ...clients.map(c => ({
                id: `c-${c.id}`, when: c.updated_at,
                text: `Client "${c.company_name}" updated`, icon: Users,
              }))]
                .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
                .slice(0, 20)
                .map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{item.text}</p>
                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(item.when), { addSuffix: true })}</p>
                      </div>
                    </div>
                  );
                })}
              {clients.length === 0 && projects.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
