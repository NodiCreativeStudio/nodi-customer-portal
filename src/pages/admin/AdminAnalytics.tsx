import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users as UsersIcon, CheckCircle, Clock, UserPlus, Download as DownloadIcon } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend,
} from "recharts";
import { format, startOfMonth, subMonths, eachDayOfInterval, parseISO, isWithinInterval } from "date-fns";
import { toast } from "sonner";
import { downloadCsv } from "@/lib/csv-export";

export default function AdminAnalytics() {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [uploads, setUploads] = useState<any[]>([]);
  const [tech, setTech] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [from, setFrom] = useState(format(subMonths(new Date(), 1), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [pr, p, u, t, a] = await Promise.all([
        supabase.from("profiles").select("id, onboarding_completed, created_at"),
        supabase.from("projects").select("id, created_at"),
        supabase.from("uploads").select("id, uploaded_at"),
        supabase.from("tech_stack").select("service_name, client_id"),
        supabase.from("activity_log").select("*"),
      ]);
      if (pr.error) toast.error("Failed to load analytics");
      setProfiles(pr.data ?? []);
      setProjects(p.data ?? []);
      setUploads(u.data ?? []);
      setTech(t.data ?? []);
      setActivity(a.data ?? []);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const total = profiles.length;
    const onboarded = profiles.filter((p) => p.onboarding_completed).length;
    const pending = total - onboarded;
    return { total, onboarded, pending, rate: total ? Math.round((onboarded / total) * 100) : 0 };
  }, [profiles]);

  const growthSeries = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => startOfMonth(subMonths(new Date(), 11 - i)));
    return months.map((m) => {
      const cumulative = profiles.filter((p) => new Date(p.created_at) <= m).length;
      const newThis = profiles.filter((p) => {
        const d = new Date(p.created_at);
        return d >= m && d < startOfMonth(subMonths(m, -1));
      }).length;
      return { month: format(m, "MMM"), users: cumulative, new: newThis };
    });
  }, [profiles]);

  const funnel = useMemo(() => {
    const total = profiles.length;
    const started = profiles.filter((p) => !p.onboarding_completed).length + profiles.filter((p) => p.onboarding_completed).length;
    const done = profiles.filter((p) => p.onboarding_completed).length;
    return [
      { stage: "Signed Up", count: total },
      { stage: "Started Onboarding", count: started },
      { stage: "Completed", count: done },
    ];
  }, [profiles]);

  const serviceAdoption = useMemo(() => {
    const map = new Map<string, Set<string>>();
    tech.forEach((t) => {
      if (!t.service_name) return;
      if (!map.has(t.service_name)) map.set(t.service_name, new Set());
      map.get(t.service_name)!.add(t.client_id);
    });
    return Array.from(map, ([service, set]) => ({ service, clients: set.size }))
      .sort((a, b) => b.clients - a.clients).slice(0, 8);
  }, [tech]);

  const dailyTable = useMemo(() => {
    const start = parseISO(from);
    const end = parseISO(to);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
    const days = eachDayOfInterval({ start, end });
    return days.map((d) => {
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
      const within = (dStr: string) => {
        const dt = new Date(dStr);
        return isWithinInterval(dt, { start: dayStart, end: dayEnd });
      };
      return {
        date: format(d, "yyyy-MM-dd"),
        signups: profiles.filter((p) => within(p.created_at)).length,
        onboarded: activity.filter((a) => a.action === "completed_onboarding" && within(a.created_at)).length,
        projects: projects.filter((p) => within(p.created_at)).length,
        uploads: uploads.filter((u) => within(u.uploaded_at)).length,
      };
    });
  }, [from, to, profiles, projects, uploads, activity]);

  const exportTable = () => {
    downloadCsv(`analytics-${from}-to-${to}`, [
      ["Date", "Signups", "Onboarding Completed", "Projects Created", "Files Uploaded"],
      ...dailyTable.map((r) => [r.date, r.signups, r.onboarded, r.projects, r.uploads]),
    ]);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-[1400px]">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.analytics')}</h1>
        <p className="text-muted-foreground">Users, onboarding funnel, and adoption</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />) : (
          <>
            <Card><CardContent className="p-5 flex items-start justify-between">
              <div><p className="text-xs uppercase text-muted-foreground">Total Users</p><p className="text-3xl font-bold mt-2">{stats.total}</p></div>
              <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center"><UsersIcon className="h-5 w-5 text-primary" /></div>
            </CardContent></Card>
            <Card><CardContent className="p-5 flex items-start justify-between">
              <div><p className="text-xs uppercase text-muted-foreground">Onboarded</p><p className="text-3xl font-bold mt-2 text-success">{stats.onboarded}</p></div>
              <div className="h-11 w-11 rounded-lg bg-success/10 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-success" /></div>
            </CardContent></Card>
            <Card><CardContent className="p-5 flex items-start justify-between">
              <div><p className="text-xs uppercase text-muted-foreground">Pending</p><p className="text-3xl font-bold mt-2 text-warning">{stats.pending}</p></div>
              <div className="h-11 w-11 rounded-lg bg-warning/10 flex items-center justify-center"><Clock className="h-5 w-5 text-warning" /></div>
            </CardContent></Card>
            <Card><CardContent className="p-5 flex items-start justify-between">
              <div><p className="text-xs uppercase text-muted-foreground">Completion Rate</p><p className="text-3xl font-bold mt-2">{stats.rate}%</p></div>
              <div className="h-11 w-11 rounded-lg bg-accent/30 flex items-center justify-center"><UserPlus className="h-5 w-5 text-accent-foreground" /></div>
            </CardContent></Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>User growth (12 months)</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Onboarding funnel</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="stage" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Service adoption</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            {serviceAdoption.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center pt-12">No services yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceAdoption} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis type="category" dataKey="service" stroke="hsl(var(--muted-foreground))" fontSize={12} width={140} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="clients" name="Clients using" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle>Daily breakdown</CardTitle>
          <div className="flex items-end gap-2">
            <div><Label className="text-xs">From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" /></div>
            <div><Label className="text-xs">To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" /></div>
            <Button variant="outline" size="sm" onClick={exportTable}><DownloadIcon className="h-4 w-4 mr-2" />Export</Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground text-xs">
                <th className="py-2">Date</th><th>Signups</th><th>Onboarded</th><th>Projects</th><th>Uploads</th>
              </tr>
            </thead>
            <tbody>
              {dailyTable.map((r) => (
                <tr key={r.date} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="py-2">{r.date}</td>
                  <td>{r.signups}</td>
                  <td>{r.onboarded}</td>
                  <td>{r.projects}</td>
                  <td>{r.uploads}</td>
                </tr>
              ))}
              {dailyTable.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Pick a date range</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
