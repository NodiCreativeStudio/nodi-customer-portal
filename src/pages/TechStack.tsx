import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import {
  MessageCircle, Mail, Gift, Globe, Calendar, BarChart3,
  Search, Plus, ExternalLink, Settings2, Unplug, HelpCircle,
  AlertTriangle, CheckCircle2, Layers,
} from "lucide-react";
import { toast } from "sonner";

type Status = "active" | "inactive" | "trial" | "error";
type Category = "whatsapp" | "email" | "loyalty" | "web" | "calendar" | "analytics" | "sms";

interface Service {
  id: string;
  client_id: string;
  service_name: string;
  category: Category | null;
  status: Status;
  cost_monthly: number | null;
  cost_annual: number | null;
  renewal_date: string | null;
  connected_account: string | null;
  last_sync_at: string | null;
  description: string | null;
  external_url: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES: { key: Category; label: string; icon: typeof MessageCircle; tone: string }[] = [
  { key: "whatsapp", label: "WhatsApp & Messaging", icon: MessageCircle, tone: "text-success" },
  { key: "email", label: "Email & Communications", icon: Mail, tone: "text-primary" },
  { key: "loyalty", label: "Loyalty & Engagement", icon: Gift, tone: "text-secondary" },
  { key: "web", label: "Websites & Portals", icon: Globe, tone: "text-primary" },
  { key: "calendar", label: "Calendar & Scheduling", icon: Calendar, tone: "text-warning" },
  { key: "analytics", label: "Analytics & Monitoring", icon: BarChart3, tone: "text-secondary" },
  { key: "sms", label: "SMS", icon: MessageCircle, tone: "text-warning" },
];

const catMeta = (k: Category | null) =>
  CATEGORIES.find((c) => c.key === k) ?? { key: "web" as Category, label: "Other", icon: Layers, tone: "text-muted-foreground" };

const statusBadge: Record<Status, string> = {
  active: "bg-success/15 text-success border-success/30",
  inactive: "bg-muted text-muted-foreground",
  trial: "bg-primary/15 text-primary border-primary/20",
  error: "bg-destructive/15 text-destructive border-destructive/30",
};
const statusLabel: Record<Status, string> = {
  active: "Active", inactive: "Inactive", trial: "Trial", error: "Error",
};

function fmtMoney(v: number | null | undefined) {
  if (v == null) return "—";
  return `€${Number(v).toFixed(0)}`;
}

export default function TechStack() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [tab, setTab] = useState<"all" | Category>("all");
  const [viewing, setViewing] = useState<Service | null>(null);
  const [confirmDc, setConfirmDc] = useState<Service | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: prof } = await supabase
      .from("profiles").select("company_id").eq("id", user.id).maybeSingle();
    const cid = prof?.company_id ?? null;
    setCompanyId(cid);
    if (!cid) { setItems([]); setLoading(false); return; }
    const { data } = await supabase
      .from("tech_stack").select("*").eq("client_id", cid)
      .order("service_name", { ascending: true });
    setItems((data ?? []) as Service[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    let list = [...items];
    if (tab !== "all") list = list.filter((s) => s.category === tab);
    if (statusFilter !== "all") list = list.filter((s) => s.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.service_name.toLowerCase().includes(q));
    }
    return list;
  }, [items, tab, statusFilter, search]);

  const totals = useMemo(() => {
    const monthly = items.reduce((s, x) => s + (x.cost_monthly ?? 0), 0);
    const annual = items.reduce((s, x) => s + (x.cost_annual ?? (x.cost_monthly ?? 0) * 12), 0);
    const byCat: Record<string, number> = {};
    for (const s of items) {
      const k = catMeta(s.category).label;
      byCat[k] = (byCat[k] ?? 0) + (s.cost_monthly ?? 0);
    }
    const renewals = items
      .filter((x) => x.renewal_date)
      .sort((a, b) => +new Date(a.renewal_date!) - +new Date(b.renewal_date!));
    const next = renewals[0] ?? null;
    const expiringSoon = renewals.filter((x) => {
      const d = differenceInDays(new Date(x.renewal_date!), new Date());
      return d >= 0 && d <= 7;
    });
    return { monthly, annual, byCat, next, expiringSoon };
  }, [items]);

  const disconnect = async (s: Service) => {
    const { error } = await supabase.from("tech_stack").delete().eq("id", s.id);
    if (error) toast.error(error.message);
    else { toast.success("Service disconnected"); load(); }
    setConfirmDc(null);
    if (viewing?.id === s.id) setViewing(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Tech Stack</h1>
          <p className="text-sm text-muted-foreground">Services and tools integrated into your account.</p>
        </div>
        <Button onClick={() => toast.info("Contact your account manager to add a new service")}>
          <Plus className="mr-2 h-4 w-4" />Add service
        </Button>
      </div>

      {totals.expiringSoon.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm">
              <span className="font-medium">{totals.expiringSoon.length} service(s)</span>{" "}
              renewing within 7 days. Review before auto-renewal.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search services..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="flex flex-wrap h-auto justify-start">
          <TabsTrigger value="all">All</TabsTrigger>
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.key} value={c.key} className="gap-1.5">
              <c.icon className="h-3.5 w-3.5" />{c.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
            </div>
          ) : visible.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Layers className="mx-auto h-10 w-10 mb-3 opacity-40" />
                <p>No services in this view.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((s) => {
                const meta = catMeta(s.category);
                const Icon = meta.icon;
                const renewSoon = s.renewal_date &&
                  differenceInDays(new Date(s.renewal_date), new Date()) <= 7;
                return (
                  <Card key={s.id} className="group transition-all hover:shadow-md hover:-translate-y-0.5">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn("rounded-lg bg-muted/50 p-2.5", meta.tone)}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{s.service_name}</p>
                            <Badge variant="outline" className="mt-1 text-xs">{meta.label}</Badge>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn("shrink-0", statusBadge[s.status])}>
                          {statusLabel[s.status]}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Monthly</p>
                          <p className="font-medium">{fmtMoney(s.cost_monthly)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Renews</p>
                          <p className={cn("font-medium", renewSoon && "text-warning")}>
                            {s.renewal_date ? format(new Date(s.renewal_date), "MMM d, yyyy") : "—"}
                          </p>
                        </div>
                      </div>

                      {(s.connected_account || s.last_sync_at) && (
                        <div className="text-xs text-muted-foreground space-y-0.5 border-t pt-3">
                          {s.connected_account && <p>Account: <span className="text-foreground">{s.connected_account}</span></p>}
                          {s.last_sync_at && (
                            <p>Last sync: {formatDistanceToNow(new Date(s.last_sync_at), { addSuffix: true })}</p>
                          )}
                        </div>
                      )}

                      <div className="flex gap-1 pt-1">
                        <Button size="sm" variant="outline" onClick={() => setViewing(s)}>View</Button>
                        <Button size="sm" variant="ghost" onClick={() => toast.info("Configuration coming soon")}>
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost"
                          onClick={() => s.external_url ? window.open(s.external_url, "_blank") : toast.info("No support link configured")}>
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="ml-auto text-destructive hover:text-destructive"
                          onClick={() => setConfirmDc(s)}>
                          <Unplug className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Cost summary */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Cost summary</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Total monthly</p>
              <p className="text-2xl font-bold">{fmtMoney(totals.monthly)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Total annual</p>
              <p className="text-2xl font-bold">{fmtMoney(totals.annual)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Next renewal</p>
              <p className="text-lg font-semibold">
                {totals.next?.renewal_date ? format(new Date(totals.next.renewal_date), "MMM d, yyyy") : "—"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{totals.next?.service_name ?? ""}</p>
            </div>
          </div>
          {Object.keys(totals.byCat).length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase text-muted-foreground">Breakdown by category</p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {Object.entries(totals.byCat).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm border-b py-1.5">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium">{fmtMoney(v)}/mo</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail modal */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          {viewing && (() => {
            const meta = catMeta(viewing.category);
            const Icon = meta.icon;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className={cn("rounded-md bg-muted p-1.5", meta.tone)}>
                      <Icon className="h-4 w-4" />
                    </span>
                    {viewing.service_name}
                  </DialogTitle>
                  <DialogDescription className="flex gap-2 pt-1">
                    <Badge variant="outline">{meta.label}</Badge>
                    <Badge variant="outline" className={statusBadge[viewing.status]}>
                      {statusLabel[viewing.status]}
                    </Badge>
                  </DialogDescription>
                </DialogHeader>

                {viewing.description && (
                  <p className="text-sm text-muted-foreground">{viewing.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Monthly cost" value={fmtMoney(viewing.cost_monthly)} />
                  <Info label="Annual cost" value={fmtMoney(viewing.cost_annual ?? (viewing.cost_monthly ?? 0) * 12)} />
                  <Info label="Renews on" value={viewing.renewal_date ? format(new Date(viewing.renewal_date), "MMM d, yyyy") : "—"} />
                  <Info label="Auto-renew" value={viewing.auto_renew ? "Enabled" : "Disabled"} />
                  <Info label="Connected account" value={viewing.connected_account ?? "—"} />
                  <Info label="Last sync" value={viewing.last_sync_at ? formatDistanceToNow(new Date(viewing.last_sync_at), { addSuffix: true }) : "—"} />
                </div>

                <div className="rounded-md border p-3 flex items-center gap-2 text-sm">
                  {viewing.status === "error" ? (
                    <><AlertTriangle className="h-4 w-4 text-destructive" /><span className="text-destructive">Connection error — reconnect required</span></>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 text-success" /><span>Service is healthy</span></>
                  )}
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                  <Button variant="outline" className="text-destructive"
                    onClick={() => setConfirmDc(viewing)}>
                    <Unplug className="mr-2 h-4 w-4" />Disconnect
                  </Button>
                  {viewing.external_url && (
                    <Button asChild>
                      <a href={viewing.external_url} target="_blank" rel="noreferrer">
                        Open service<ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDc} onOpenChange={(o) => !o && setConfirmDc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {confirmDc?.service_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This service will be removed from your account and stop syncing. You can re-add it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDc && disconnect(confirmDc)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >Disconnect</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium truncate">{value}</p>
    </div>
  );
}
