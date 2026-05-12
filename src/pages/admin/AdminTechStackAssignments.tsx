import { useEffect, useMemo, useState } from "react";
import { Plus, Power, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Client { id: string; company_name: string; industry: string | null; contact_email: string | null; }
interface CatalogTool { id: string; name: string; }
interface Subscription {
  id: string; tech_stack_id: string; subscription_type: string;
  cost_monthly: number | null; cost_yearly: number | null;
}
interface Assignment {
  id: string; client_id: string; tech_stack_id: string; subscription_id: string;
  status: "active" | "inactive"; activated_at: string;
}

export default function AdminTechStackAssignments() {
  const [clients, setClients] = useState<Client[]>([]);
  const [tools, setTools] = useState<CatalogTool[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [clientId, setClientId] = useState<string>("");

  const [pickTool, setPickTool] = useState<string>("");
  const [pickSub, setPickSub] = useState<string>("");

  const load = async () => {
    const [c, t, s, a] = await Promise.all([
      supabase.from("clients").select("id, company_name, industry, contact_email").order("company_name"),
      supabase.from("tech_stack_catalog").select("id, name").order("name"),
      supabase.from("tech_stack_subscriptions").select("*"),
      supabase.from("client_tech_stack").select("*"),
    ]);
    setClients((c.data as Client[]) || []);
    setTools((t.data as CatalogTool[]) || []);
    setSubs((s.data as Subscription[]) || []);
    setAssignments((a.data as Assignment[]) || []);
  };
  useEffect(() => { load(); }, []);

  const client = clients.find((c) => c.id === clientId);
  const clientAssignments = assignments.filter((a) => a.client_id === clientId);
  const assignedToolIds = new Set(clientAssignments.map((a) => a.tech_stack_id));
  const availableTools = tools.filter((t) => !assignedToolIds.has(t.id));
  const availableSubs = subs.filter((s) => s.tech_stack_id === pickTool);
  const pickedSub = subs.find((s) => s.id === pickSub);

  const summary = useMemo(() => {
    let mo = 0, yr = 0;
    for (const a of clientAssignments) {
      if (a.status !== "active") continue;
      const s = subs.find((x) => x.id === a.subscription_id);
      mo += s?.cost_monthly ?? 0;
      yr += s?.cost_yearly ?? 0;
    }
    return { mo, yr };
  }, [clientAssignments, subs]);

  const assign = async () => {
    if (!clientId || !pickTool || !pickSub) {
      toast.error("Seleziona cliente, tool e piano");
      return;
    }
    const { error } = await supabase.from("client_tech_stack").insert({
      client_id: clientId,
      tech_stack_id: pickTool,
      subscription_id: pickSub,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Tool attivato");
    setPickTool(""); setPickSub("");
    load();
  };

  const toggleStatus = async (a: Assignment) => {
    const newStatus = a.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("client_tech_stack")
      .update({
        status: newStatus,
        deactivated_at: newStatus === "inactive" ? new Date().toISOString() : null,
      })
      .eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Rimuovere questo tool dal cliente?")) return;
    const { error } = await supabase.from("client_tech_stack").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Rimosso");
    load();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">🔗 Assegna Tool ai Clienti</h1>
        <p className="text-muted-foreground mt-1">Attiva e gestisci gli strumenti per ciascun cliente</p>
      </header>

      <Card>
        <CardHeader><CardTitle>Seleziona cliente</CardTitle></CardHeader>
        <CardContent>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="max-w-md"><SelectValue placeholder="Scegli un cliente" /></SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.company_name}{c.industry ? ` · ${c.industry}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {client && (
            <p className="text-sm text-muted-foreground mt-2">
              {client.industry ?? "—"} · {client.contact_email ?? "—"}
            </p>
          )}
        </CardContent>
      </Card>

      {clientId && (
        <>
          <Card>
            <CardHeader><CardTitle>Tool assegnati</CardTitle></CardHeader>
            <CardContent>
              {clientAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessun tool assegnato a questo cliente.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool</TableHead>
                      <TableHead>Piano</TableHead>
                      <TableHead>€/mese</TableHead>
                      <TableHead>Attivato il</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientAssignments.map((a) => {
                      const tool = tools.find((t) => t.id === a.tech_stack_id);
                      const sub = subs.find((s) => s.id === a.subscription_id);
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{tool?.name ?? "—"}</TableCell>
                          <TableCell className="capitalize">{sub?.subscription_type ?? "—"}</TableCell>
                          <TableCell>{sub?.cost_monthly != null ? `€ ${sub.cost_monthly}` : "—"}</TableCell>
                          <TableCell>{new Date(a.activated_at).toLocaleDateString("it-IT")}</TableCell>
                          <TableCell>
                            <Badge variant={a.status === "active" ? "default" : "secondary"}>
                              {a.status === "active" ? "Attivo" : "Inattivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => toggleStatus(a)} title={a.status === "active" ? "Disattiva" : "Riattiva"}>
                              <Power className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => remove(a.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Aggiungi tool a questo cliente</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Select value={pickTool} onValueChange={(v) => { setPickTool(v); setPickSub(""); }}>
                  <SelectTrigger><SelectValue placeholder="Scegli tool" /></SelectTrigger>
                  <SelectContent>
                    {availableTools.length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">Tutti i tool sono già assegnati</div>
                    )}
                    {availableTools.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={pickSub} onValueChange={setPickSub} disabled={!pickTool}>
                  <SelectTrigger><SelectValue placeholder="Scegli piano" /></SelectTrigger>
                  <SelectContent>
                    {availableSubs.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.subscription_type} {s.cost_monthly != null ? `· € ${s.cost_monthly}/mese` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center text-sm text-muted-foreground">
                  {pickedSub ? `Costo: € ${pickedSub.cost_monthly ?? 0}/mese` : "—"}
                </div>
              </div>
              <Button onClick={assign} disabled={!pickTool || !pickSub}>
                <Plus className="h-4 w-4" /> Attiva per questo cliente
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Riepilogo costi cliente</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">Totale mensile</div>
                  <div className="text-2xl font-bold">€ {summary.mo.toFixed(2)}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">Totale annuale</div>
                  <div className="text-2xl font-bold">€ {summary.yr.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
