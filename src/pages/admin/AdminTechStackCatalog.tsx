import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Edit, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type SubType = "free" | "basic" | "pro" | "enterprise";

interface Subscription {
  id: string;
  tech_stack_id: string;
  subscription_type: SubType;
  cost_monthly: number | null;
  cost_yearly: number | null;
  currency: string;
}

interface CatalogTool {
  id: string;
  name: string;
  website_url: string;
  description_what: string;
  description_do: string;
  description_why: string;
  icon_url: string | null;
}

const emptyTool = {
  name: "", website_url: "", description_what: "",
  description_do: "", description_why: "", icon_url: "",
};

export default function AdminTechStackCatalog() {
  const [tools, setTools] = useState<CatalogTool[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [toolDialogOpen, setToolDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<CatalogTool | null>(null);
  const [toolForm, setToolForm] = useState(emptyTool);

  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [subToolId, setSubToolId] = useState<string | null>(null);
  const [subForm, setSubForm] = useState({
    subscription_type: "basic" as SubType,
    cost_monthly: "",
    cost_yearly: "",
  });

  const load = async () => {
    setLoading(true);
    const [toolsRes, subsRes] = await Promise.all([
      supabase.from("tech_stack_catalog").select("*").order("name"),
      supabase.from("tech_stack_subscriptions").select("*"),
    ]);
    setTools((toolsRes.data as CatalogTool[]) || []);
    setSubs((subsRes.data as Subscription[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNewTool = () => {
    setEditingTool(null);
    setToolForm(emptyTool);
    setToolDialogOpen(true);
  };
  const openEditTool = (t: CatalogTool) => {
    setEditingTool(t);
    setToolForm({
      name: t.name, website_url: t.website_url,
      description_what: t.description_what, description_do: t.description_do,
      description_why: t.description_why, icon_url: t.icon_url ?? "",
    });
    setToolDialogOpen(true);
  };

  const saveTool = async () => {
    if (!toolForm.name.trim() || !toolForm.website_url.trim()) {
      toast.error("Nome e website sono obbligatori");
      return;
    }
    const payload = {
      name: toolForm.name.trim(),
      website_url: toolForm.website_url.trim(),
      description_what: toolForm.description_what.trim(),
      description_do: toolForm.description_do.trim(),
      description_why: toolForm.description_why.trim(),
      icon_url: toolForm.icon_url.trim() || null,
    };
    const res = editingTool
      ? await supabase.from("tech_stack_catalog").update(payload).eq("id", editingTool.id)
      : await supabase.from("tech_stack_catalog").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(editingTool ? "Tool aggiornato" : "Tool creato");
    setToolDialogOpen(false);
    load();
  };

  const deleteTool = async (id: string) => {
    if (!confirm("Eliminare questo tool? Verranno rimosse anche le assegnazioni.")) return;
    const { error } = await supabase.from("tech_stack_catalog").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Tool eliminato");
    load();
  };

  const openNewSub = (toolId: string) => {
    setEditingSub(null);
    setSubToolId(toolId);
    setSubForm({ subscription_type: "basic", cost_monthly: "", cost_yearly: "" });
    setSubDialogOpen(true);
  };
  const openEditSub = (s: Subscription) => {
    setEditingSub(s);
    setSubToolId(s.tech_stack_id);
    setSubForm({
      subscription_type: s.subscription_type,
      cost_monthly: s.cost_monthly?.toString() ?? "",
      cost_yearly: s.cost_yearly?.toString() ?? "",
    });
    setSubDialogOpen(true);
  };

  const saveSub = async () => {
    if (!subToolId) return;
    const payload = {
      tech_stack_id: subToolId,
      subscription_type: subForm.subscription_type,
      cost_monthly: subForm.cost_monthly ? parseFloat(subForm.cost_monthly) : null,
      cost_yearly: subForm.cost_yearly ? parseFloat(subForm.cost_yearly) : null,
    };
    const res = editingSub
      ? await supabase.from("tech_stack_subscriptions").update(payload).eq("id", editingSub.id)
      : await supabase.from("tech_stack_subscriptions").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Piano salvato");
    setSubDialogOpen(false);
    load();
  };

  const deleteSub = async (id: string) => {
    if (!confirm("Eliminare questo piano?")) return;
    const { error } = await supabase.from("tech_stack_subscriptions").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Piano eliminato");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📚 Catalogo Stack Tecnologico</h1>
          <p className="text-muted-foreground mt-1">Gestisci tool e piani di abbonamento</p>
        </div>
        <Button onClick={openNewTool}>
          <Plus className="h-4 w-4" /> Aggiungi Nuovo Tool
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tool nel catalogo</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Caricamento…</p>
          ) : tools.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun tool nel catalogo. Aggiungine uno.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Nome</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Piani</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tools.map((t) => {
                  const toolSubs = subs.filter((s) => s.tech_stack_id === t.id);
                  const isOpen = expanded === t.id;
                  return (
                    <>
                      <TableRow key={t.id}>
                        <TableCell>
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => setExpanded(isOpen ? null : t.id)}
                          >
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>
                          <a href={t.website_url} target="_blank" rel="noopener noreferrer"
                             className="text-primary hover:underline text-sm">
                            {t.website_url.replace(/^https?:\/\//, "")}
                          </a>
                        </TableCell>
                        <TableCell>{toolSubs.length}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditTool(t)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteTool(t.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow key={t.id + "-exp"}>
                          <TableCell colSpan={5} className="bg-muted/30">
                            <div className="space-y-3 p-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">Piani di abbonamento</h4>
                                <Button size="sm" onClick={() => openNewSub(t.id)}>
                                  <Plus className="h-3 w-3" /> Aggiungi piano
                                </Button>
                              </div>
                              {toolSubs.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nessun piano configurato.</p>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Tipo</TableHead>
                                      <TableHead>€/mese</TableHead>
                                      <TableHead>€/anno</TableHead>
                                      <TableHead className="text-right">Azioni</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {toolSubs.map((s) => (
                                      <TableRow key={s.id}>
                                        <TableCell className="capitalize">{s.subscription_type}</TableCell>
                                        <TableCell>{s.cost_monthly != null ? `€ ${s.cost_monthly}` : "—"}</TableCell>
                                        <TableCell>{s.cost_yearly != null ? `€ ${s.cost_yearly}` : "—"}</TableCell>
                                        <TableCell className="text-right space-x-1">
                                          <Button variant="ghost" size="icon" onClick={() => openEditSub(s)}>
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button variant="ghost" size="icon" onClick={() => deleteSub(s.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={toolDialogOpen} onOpenChange={setToolDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTool ? "Modifica tool" : "Nuovo tool"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome servizio *</Label>
                <Input value={toolForm.name} onChange={(e) => setToolForm({ ...toolForm, name: e.target.value })} />
              </div>
              <div>
                <Label>Website URL *</Label>
                <Input value={toolForm.website_url} onChange={(e) => setToolForm({ ...toolForm, website_url: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div>
              <Label>Cos'è (descrizione breve) *</Label>
              <Textarea rows={2} value={toolForm.description_what} onChange={(e) => setToolForm({ ...toolForm, description_what: e.target.value })} />
            </div>
            <div>
              <Label>Cosa fa (funzionalità) *</Label>
              <Textarea rows={2} value={toolForm.description_do} onChange={(e) => setToolForm({ ...toolForm, description_do: e.target.value })} />
            </div>
            <div>
              <Label>Perché lo usiamo *</Label>
              <Textarea rows={2} value={toolForm.description_why} onChange={(e) => setToolForm({ ...toolForm, description_why: e.target.value })} />
            </div>
            <div>
              <Label>URL icona/logo (opzionale)</Label>
              <Input value={toolForm.icon_url} onChange={(e) => setToolForm({ ...toolForm, icon_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToolDialogOpen(false)}>Annulla</Button>
            <Button onClick={saveTool}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSub ? "Modifica piano" : "Nuovo piano"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo abbonamento</Label>
              <Select value={subForm.subscription_type} onValueChange={(v) => setSubForm({ ...subForm, subscription_type: v as SubType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Costo mensile (€)</Label>
                <Input type="number" step="0.01" value={subForm.cost_monthly} onChange={(e) => setSubForm({ ...subForm, cost_monthly: e.target.value })} />
              </div>
              <div>
                <Label>Costo annuale (€)</Label>
                <Input type="number" step="0.01" value={subForm.cost_yearly} onChange={(e) => setSubForm({ ...subForm, cost_yearly: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubDialogOpen(false)}>Annulla</Button>
            <Button onClick={saveSub}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
