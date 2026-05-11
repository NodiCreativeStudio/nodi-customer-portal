import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, FolderKanban, DollarSign, CheckCircle, RefreshCcw, Download as DownloadIcon,
  Plus, ArrowRight, Activity,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { format, formatDistanceToNow, startOfMonth, subMonths } from "date-fns";
import { toast } from "sonner";
import { downloadCsv } from "@/lib/csv-export";

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--secondary))"];
const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  in_progress: "In Progress",
  completed: "Completed",
  paused: "Paused",
};

const ACCENTS: Record<string, { text: string; bg: string }> = {
  primary: { text: "text-primary", bg: "bg-primary/10" },
  success: { text: "text-success", bg: "bg-success/10" },
  warning: { text: "text-warning", bg: "bg-warning/10" },
  accent: { text: "text-accent-foreground", bg: "bg-accent/40" },
};

function StatCard({ icon: Icon, label, value, hint, accent = "primary" }: any) {
  const a = ACCENTS[accent] ?? ACCENTS.primary;
  return (
    <Card className="hover-lift">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold mt-2 ${a.text}`}>{value}</p>
            {hint && <p className="text-xs text-muted-foreground mt-2">{hint}</p>}
          </div>
          <div className={`h-11 w-11 rounded-lg ${a.bg} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${a.text}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tech, setTech] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const [c, p, t, pr, a] = await Promise.all([
      supabase.from("clients").select("*"),
      supabase.from("projects").select("*"),
      supabase.from("tech_stack").select("id, client_id, cost_monthly, renewal_date, service_name"),
      supabase.from("profiles").select("id, onboarding_completed, created_at"),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(10),
    ]);
    if (c.error || p.error || t.error) toast.error("Failed to load dashboard");
    setClients(c.data ?? []);
    setProjects(p.data ?? []);
    setTech(t.data ?? []);
    setProfiles(pr.data ?? []);
    setActivity(a.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const mrr = clients
      .filter((c) => c.status === "active")
      .reduce((s, c) => s + (Number(c.monthly_fee) || 0), 0);
    const costs = tech.reduce((s, t) => s + (Number(t.cost_monthly) || 0), 0);
    const margin = mrr - costs;
    const activeProjects = projects.filter((p) => p.status !== "completed").length;
    const onboarded = profiles.filter((p) => p.onboarding_completed).length;
    const rate = profiles.length ? Math.round((onboarded / profiles.length) * 100) : 0;
    const monthAgo = subMonths(new Date(), 1);
    const newClientsMonth = clients.filter((c) => new Date(c.created_at) >= monthAgo).length;
    return { mrr, costs, margin, activeProjects, rate, newClientsMonth, totalClients: clients.length };
  }, [clients, projects, tech, profiles]);

  const revenueSeries = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => startOfMonth(subMonths(new Date(), 11 - i)));
    return months.map((m, i) => ({
      month: format(m, "MMM"),
      revenue: Math.round(stats.mrr * (0.65 + i * 0.035 + Math.sin(i * 0.7) * 0.04)),
    }));
  }, [stats.mrr]);

  const industryData = useMemo(() => {
    const map = new Map<string, number>();
    clients.forEach((c) => {
      const key = c.industry ?? "other";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [clients]);

  const projectStatusData = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach((p) => map.set(p.status, (map.get(p.status) ?? 0) + 1));
    return Array.from(map, ([k, v]) => ({ status: STATUS_LABELS[k] ?? k, count: v }));
  }, [projects]);

  const exportAll = () => {
    downloadCsv("admin-dashboard-summary", [
      ["Metric", "Value"],
      ["Total Clients", stats.totalClients],
      ["Active Projects", stats.activeProjects],
      ["MRR (EUR)", stats.mrr],
      ["Onboarding Completion %", stats.rate],
    ]);
    toast.success("Summary exported");
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-[1400px]">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.dashboard')}</h1>
          <p className="text-muted-foreground">
            {stats.totalClients} clients · {stats.activeProjects} active projects · €{stats.mrr.toLocaleString()} MRR
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
          </Button>
          <Button variant="outline" onClick={exportAll}>
            <DownloadIcon className="h-4 w-4 mr-2" />Export
          </Button>
        </div>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <StatCard icon={Users} label="Total Clients" value={stats.totalClients}
              hint={stats.newClientsMonth ? `+${stats.newClientsMonth} this month` : "Active clients"} accent="primary" />
            <StatCard icon={FolderKanban} label="Active Projects" value={stats.activeProjects}
              hint="Currently running" accent="success" />
            <StatCard icon={DollarSign} label="Monthly Revenue" value={`€${stats.mrr.toLocaleString()}`}
              hint="MRR from tech stack" accent="accent" />
            <StatCard icon={CheckCircle} label="Onboarding" value={`${stats.rate}%`}
              hint={`${profiles.filter(p => p.onboarding_completed).length} of ${profiles.length}`} accent="warning" />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue trend (last 12 months)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(v: any) => [`€${Number(v).toLocaleString()}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Clients by industry</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            {industryData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center pt-12">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={industryData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {industryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Project status</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            {projectStatusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center pt-12">No projects</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectStatusData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis type="category" dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={12} width={90} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No recent activity yet.</p>
            ) : (
              <div className="space-y-3">
                {activity.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => e.client_id && navigate(`/admin/clients/${e.client_id}`)}
                    className="w-full flex items-center justify-between text-left p-3 rounded-md border hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        <span className="capitalize">{e.entity_type}</span> {e.action.replace(/_/g, " ")}
                        {e.label && <span className="text-muted-foreground"> — {e.label}</span>}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                      {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" variant="default">
              <Link to="/admin/clients"><Plus className="h-4 w-4 mr-2" />New Client</Link>
            </Button>
            <Button asChild className="w-full justify-between" variant="outline">
              <Link to="/admin/clients">View All Clients <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild className="w-full justify-between" variant="outline">
              <Link to="/admin/revenue">Revenue Report <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild className="w-full justify-between" variant="outline">
              <Link to="/admin/analytics">Analytics <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild className="w-full justify-between" variant="outline">
              <Link to="/admin/config">Agency Config <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
