import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import {
  ArrowLeft, Mail, Phone, Calendar, Edit, Plus, DownloadIcon,
  AlertTriangle, FolderKanban, Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_CLS: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-muted text-muted-foreground border-border",
  trial: "bg-primary/10 text-primary border-primary/20",
  planning: "bg-accent/10 text-accent-foreground border-accent/30",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-success/10 text-success border-success/20",
};

export default function AdminClientDetail() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [tech, setTech] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [c, p, t, m] = await Promise.all([
        supabase.from("clients").select("*").eq("id", id).maybeSingle(),
        supabase.from("projects").select("*").eq("client_id", id),
        supabase.from("tech_stack").select("*").eq("client_id", id),
        supabase.from("profiles").select("id, full_name, email").eq("company_id", id),
      ]);
      setClient(c.data);
      setProjects(p.data ?? []);
      setTech(t.data ?? []);
      setTeam(m.data ?? []);
      if (c.data) setForm(c.data);
      setLoading(false);
    })();
  }, [id]);

  const monthlyFee = Number(client?.monthly_fee) || 0;
  const monthlyCosts = tech.reduce((s, t) => s + (Number(t.cost_monthly) || 0), 0);
  const margin = monthlyFee - monthlyCosts;
  const arr = monthlyFee * 12;
  const nextRenewal = tech
    .filter(t => t.renewal_date)
    .map(t => new Date(t.renewal_date))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const renewalDays = nextRenewal ? differenceInDays(nextRenewal, new Date()) : null;

  const saveEdit = async () => {
    const { error } = await supabase.from("clients").update({
      company_name: form.company_name,
      contact_email: form.contact_email,
      contact_phone: form.contact_phone,
      industry: form.industry,
      status: form.status,
    }).eq("id", id!);
    if (error) return toast.error("Update failed");
    setClient({ ...client, ...form });
    setEditOpen(false);
    toast.success("Client updated");
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ client, projects, tech, team }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${client?.company_name ?? "client"}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="container mx-auto p-8 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-40 w-full" /></div>;
  }
  if (!client) {
    return <div className="container mx-auto p-8">Client not found.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="ghost" asChild><Link to="/admin"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link></Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}><Edit className="h-4 w-4 mr-2" />Edit</Button>
          <Button variant="outline" onClick={exportData}><DownloadIcon className="h-4 w-4 mr-2" />Export</Button>
          <Button asChild><a href={`mailto:${client.contact_email}`}><Mail className="h-4 w-4 mr-2" />Email</a></Button>
        </div>
      </div>

      {/* Client info */}
      <Card>
        <CardContent className="p-6 grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{client.company_name}</h1>
              <Badge variant="outline" className={cn("capitalize", STATUS_CLS[client.status])}>{client.status}</Badge>
              {client.industry && <Badge variant="outline" className="capitalize">{client.industry}</Badge>}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {client.contact_email && (
                <a href={`mailto:${client.contact_email}`} className="flex items-center gap-2 hover:text-primary">
                  <Mail className="h-4 w-4" />{client.contact_email}
                </a>
              )}
              {client.contact_phone && (
                <a href={`tel:${client.contact_phone}`} className="flex items-center gap-2 hover:text-primary">
                  <Phone className="h-4 w-4" />{client.contact_phone}
                </a>
              )}
              {client.contract_date && (
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />Contract: {format(new Date(client.contract_date), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2 md:border-l md:pl-6">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">MRR</span><span className="font-semibold">€{mrr.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">ARR</span><span className="font-semibold">€{arr.toLocaleString()}</span></div>
            {nextRenewal && (
              <div className={cn("flex justify-between text-sm pt-2 border-t",
                renewalDays !== null && renewalDays <= 14 && "text-warning")}>
                <span className="flex items-center gap-1">
                  {renewalDays !== null && renewalDays <= 14 && <AlertTriangle className="h-3 w-3" />}
                  Next renewal
                </span>
                <span>{format(nextRenewal, "MMM d, yyyy")}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><FolderKanban className="h-5 w-5" />Projects ({projects.length})</CardTitle>
          <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" />New project</Button>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No projects yet.</p>
          ) : (
            <div className="space-y-2">
              {projects.map(p => (
                <Link key={p.id} to={`/projects/${p.id}`}
                  className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/30">
                  <div>
                    <p className="font-medium">{p.project_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.end_date ? `Ends ${format(new Date(p.end_date), "MMM d, yyyy")}` : "No end date"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.budget && <span className="text-sm">€{Number(p.budget).toLocaleString()}</span>}
                    <Badge variant="outline" className={cn("capitalize", STATUS_CLS[p.status])}>{p.status.replace("_", " ")}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Team */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Team ({team.length})</CardTitle></CardHeader>
          <CardContent>
            {team.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No team members linked.</p>
            ) : (
              <div className="space-y-2">
                {team.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-md border">
                    <div>
                      <p className="text-sm font-medium">{m.full_name ?? m.email}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...projects.map(p => ({ id: p.id, text: `Project "${p.project_name}" updated`, when: p.updated_at })),
                { id: "client", text: "Client record updated", when: client.updated_at }]
                .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
                .slice(0, 6)
                .map(item => (
                  <div key={item.id} className="flex justify-between text-sm border-b pb-2 last:border-0">
                    <span>{item.text}</span>
                    <span className="text-muted-foreground text-xs">{formatDistanceToNow(new Date(item.when), { addSuffix: true })}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit client</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Company name</Label><Input value={form.company_name ?? ""} onChange={e => setForm({ ...form, company_name: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.contact_email ?? ""} onChange={e => setForm({ ...form, contact_email: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.contact_phone ?? ""} onChange={e => setForm({ ...form, contact_phone: e.target.value })} /></div>
            <div><Label>Industry</Label><Input value={form.industry ?? ""} onChange={e => setForm({ ...form, industry: e.target.value })} /></div>
            <div><Label>Status</Label><Input value={form.status ?? ""} onChange={e => setForm({ ...form, status: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
