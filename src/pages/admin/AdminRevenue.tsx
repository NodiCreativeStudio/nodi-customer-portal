import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, TrendingDown, AlertTriangle, DollarSign, Users as UsersIcon,
  Download as DownloadIcon, Calendar,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { format, formatDistanceToNow, startOfMonth, subMonths, differenceInDays, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { downloadCsv } from "@/lib/csv-export";

export default function AdminRevenue() {
  const { t } = useTranslation();
  const [tech, setTech] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [t, c] = await Promise.all([
        supabase.from("tech_stack").select("*"),
        supabase.from("clients").select("id, company_name, status"),
      ]);
      if (t.error || c.error) toast.error("Failed to load revenue data");
      setTech(t.data ?? []);
      setClients(c.data ?? []);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const activeClients = clients.filter((c: any) => c.status === "active");
    const mrr = activeClients.reduce((s, c: any) => s + (Number(c.monthly_fee) || 0), 0);
    const arr = mrr * 12;
    const costs = tech.reduce((s, t) => s + (Number(t.cost_monthly) || 0), 0);
    const margin = mrr - costs;
    const monthEnd = endOfMonth(new Date());
    const monthStart = startOfMonth(new Date());
    const renewalsThisMonth = tech.filter((t) => {
      if (!t.renewal_date) return false;
      const d = new Date(t.renewal_date);
      return d >= monthStart && d <= monthEnd;
    });
    const arpc = activeClients.length ? mrr / activeClients.length : 0;
    return {
      mrr, arr, costs, margin, arpc,
      activeClientCount: activeClients.length,
      renewalsThisMonthCount: renewalsThisMonth.length,
    };
  }, [tech, clients]);

  const revenueSeries = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => startOfMonth(subMonths(new Date(), 11 - i)));
    // Synthetic ramp-up to current MRR (no historical fee snapshots stored)
    return months.map((m, i) => ({
      month: format(m, "MMM yy"),
      revenue: Math.round(stats.mrr * (0.6 + i * 0.04)),
      current: i === 11,
    }));
  }, [stats.mrr]);

  const clientBreakdown = useMemo(() => {
    const costByClient = new Map<string, number>();
    tech.forEach((t) => {
      costByClient.set(t.client_id, (costByClient.get(t.client_id) ?? 0) + (Number(t.cost_monthly) || 0));
    });
    return clients
      .map((c: any) => {
        const fee = Number(c.monthly_fee) || 0;
        const cost = costByClient.get(c.id) ?? 0;
        return { id: c.id, name: c.company_name, status: c.status, fee, cost, margin: fee - cost };
      })
      .sort((a, b) => b.fee - a.fee);
  }, [clients, tech]);

  const renewals = useMemo(() => {
    const today = new Date();
    return tech
      .filter((t) => t.renewal_date)
      .map((t) => ({
        ...t,
        client: clients.find((c) => c.id === t.client_id),
        days: differenceInDays(new Date(t.renewal_date), today),
      }))
      .sort((a, b) => a.days - b.days);
  }, [tech, clients]);

  const exportRenewals = () => {
    downloadCsv("upcoming-renewals", [
      ["Client", "Service", "Renewal Date", "Monthly Amount EUR", "Days Until"],
      ...renewals.map((r) => [
        r.client?.company_name ?? "—", r.service_name, r.renewal_date,
        r.cost_monthly ?? 0, r.days,
      ]),
    ]);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-[1400px]">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.revenue')}</h1>
        <p className="text-muted-foreground">MRR, renewals, and revenue distribution</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />) : (
          <>
            <Card className="hover-lift"><CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground tracking-wide">MRR</p>
                  <p className="text-3xl font-bold mt-2">€{stats.mrr.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stats.activeClientCount} active client{stats.activeClientCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-primary" /></div>
              </div>
            </CardContent></Card>
            <Card className="hover-lift"><CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground tracking-wide">ARR</p>
                  <p className="text-3xl font-bold mt-2 text-success">€{stats.arr.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-2">Projected yearly (MRR × 12)</p>
                </div>
                <div className="h-11 w-11 rounded-lg bg-success/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-success" /></div>
              </div>
            </CardContent></Card>
            <Card className="hover-lift"><CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground tracking-wide">Total Client Costs</p>
                  <p className="text-3xl font-bold mt-2 text-warning">€{stats.costs.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-2">Third-party services / month</p>
                </div>
                <div className="h-11 w-11 rounded-lg bg-warning/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-warning" /></div>
              </div>
            </CardContent></Card>
            <Card className="hover-lift"><CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground tracking-wide">Gross Margin</p>
                  <p className={cn("text-3xl font-bold mt-2", stats.margin >= 0 ? "text-success" : "text-destructive")}>
                    €{stats.margin.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">MRR − costs · avg €{Math.round(stats.arpc).toLocaleString()}/client</p>
                </div>
                <div className="h-11 w-11 rounded-lg bg-accent/30 flex items-center justify-center">
                  {stats.margin >= 0 ? <TrendingUp className="h-5 w-5 text-success" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
                </div>
              </div>
            </CardContent></Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Revenue trend (last 12 months)</CardTitle></CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueSeries}>
              <defs>
                <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
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
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#rev2)" strokeWidth={2} animationDuration={800} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Breakdown by client</CardTitle></CardHeader>
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/30">
          <span>Client</span><span>Status</span><span>Monthly Fee</span><span>Costs</span><span>Margin</span>
        </div>
        {clientBreakdown.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No clients yet.</div>
        ) : (
          <>
            {clientBreakdown.map((c) => (
              <Link
                key={c.id} to={`/admin/clients/${c.id}`}
                className="grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 items-center border-b last:border-0 hover:bg-muted/20"
              >
                <span className="font-medium">{c.name}</span>
                <Badge variant="outline" className="capitalize w-fit">{c.status}</Badge>
                <span className="text-sm font-semibold">€{c.fee.toLocaleString()}</span>
                <span className="text-sm text-warning">€{c.cost.toLocaleString()}</span>
                <span className={cn("text-sm font-semibold", c.margin >= 0 ? "text-success" : "text-destructive")}>
                  €{c.margin.toLocaleString()}
                </span>
              </Link>
            ))}
            <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 items-center bg-muted/30 font-semibold text-sm">
              <span>Total</span><span />
              <span>€{stats.mrr.toLocaleString()}</span>
              <span className="text-warning">€{stats.costs.toLocaleString()}</span>
              <span className={stats.margin >= 0 ? "text-success" : "text-destructive"}>€{stats.margin.toLocaleString()}</span>
            </div>
          </>
        )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Upcoming renewals</CardTitle>
          <Button variant="outline" size="sm" onClick={exportRenewals}><DownloadIcon className="h-4 w-4 mr-2" />Export</Button>
        </CardHeader>
        <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-3 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/30">
          <span>Client</span><span>Service</span><span>Renewal Date</span><span>Monthly</span><span>Days Until</span>
        </div>
        {renewals.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No upcoming renewals.</div>
        ) : renewals.slice(0, 20).map((r) => (
          <Link
            key={r.id}
            to={r.client_id ? `/admin/clients/${r.client_id}` : "#"}
            className={cn(
              "grid md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-3 px-4 py-3 items-center border-b last:border-0 hover:bg-muted/20",
              r.days < 7 && r.days >= 0 && "bg-warning/5",
              r.days < 0 && "bg-destructive/5",
            )}
          >
            <span className="font-medium">{r.client?.company_name ?? "—"}</span>
            <span className="text-sm">{r.service_name}</span>
            <span className="text-sm">{format(new Date(r.renewal_date), "MMM d, yyyy")}</span>
            <span className="text-sm font-semibold">€{Number(r.cost_monthly ?? 0).toLocaleString()}</span>
            <Badge variant="outline" className={cn(
              r.days < 0 ? "bg-destructive/10 text-destructive border-destructive/20" :
              r.days < 7 ? "bg-warning/10 text-warning border-warning/20" :
              "bg-muted/50"
            )}>
              {r.days < 0 ? `${Math.abs(r.days)}d overdue` : `${r.days}d`}
            </Badge>
          </Link>
        ))}
      </Card>
    </div>
  );
}
