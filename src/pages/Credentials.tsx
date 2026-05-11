import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  Plus, Eye, EyeOff, Copy, Pencil, Trash2, ExternalLink,
  Lock, Search, KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

interface Credential {
  id: string;
  client_id: string;
  service_name: string;
  username: string | null;
  password: string | null;
  category: string | null;
  platform: string | null;
  access_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: "social", label: "Social Media" },
  { value: "email", label: "Email" },
  { value: "review", label: "Piattaforma recensioni" },
  { value: "cloud", label: "Cloud Storage" },
  { value: "cms", label: "CMS" },
  { value: "other", label: "Altro" },
] as const;

const categoryLabel = (v: string | null) =>
  CATEGORIES.find((c) => c.value === v)?.label ?? "Altro";

const schema = z.object({
  service_name: z.string().trim().min(1, "Obbligatorio").max(120),
  category: z.string().min(1),
  username: z.string().trim().min(1, "Obbligatorio").max(255),
  password: z.string().min(1, "Obbligatorio").max(500),
  access_url: z.string().trim().max(500).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;
const empty: FormData = {
  service_name: "", category: "other", username: "", password: "",
  access_url: "", notes: "",
};

function maskUser(u?: string | null) {
  if (!u) return "—";
  if (u.length <= 2) return "•••";
  return u.slice(0, 2) + "•".repeat(Math.max(3, u.length - 2));
}

async function copy(text: string, label = "Copiato negli appunti") {
  try { await navigator.clipboard.writeText(text); toast.success(`✓ ${label}`); }
  catch { toast.error("Impossibile copiare"); }
}

export default function Credentials() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [items, setItems] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Credential | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPwForm, setShowPwForm] = useState(false);

  const [viewing, setViewing] = useState<Credential | null>(null);
  const [showPwView, setShowPwView] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Credential | null>(null);
  const [confirmCopyPw, setConfirmCopyPw] = useState<Credential | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: prof } = await supabase
      .from("profiles").select("company_id").eq("id", user.id).maybeSingle();
    const cid = prof?.company_id ?? null;
    setCompanyId(cid);
    if (!cid) { setItems([]); setLoading(false); return; }
    const { data } = await supabase
      .from("credentials").select("*").eq("client_id", cid)
      .order("updated_at", { ascending: false });
    setItems((data ?? []) as Credential[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    let list = [...items];
    if (filter !== "all") list = list.filter((c) => (c.category ?? "other") === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.service_name.toLowerCase().includes(q));
    }
    return list;
  }, [items, filter, search]);

  const grouped = useMemo(() => {
    const map: Record<string, Credential[]> = {};
    for (const c of visible) {
      const k = c.category ?? "other";
      (map[k] ??= []).push(c);
    }
    return map;
  }, [visible]);

  const openAdd = () => {
    setEditing(null); setForm(empty); setErrors({}); setShowPwForm(false); setOpenForm(true);
  };
  const openEdit = (c: Credential) => {
    setEditing(c);
    setForm({
      service_name: c.service_name,
      category: c.category ?? "other",
      username: c.username ?? "",
      password: c.password ?? "",
      access_url: c.access_url ?? "",
      notes: c.notes ?? "",
    });
    setErrors({}); setShowPwForm(false); setOpenForm(true);
  };

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { e[i.path[0] as string] = i.message; });
      setErrors(e); return;
    }
    if (!companyId) { toast.error("Account non collegato a un'azienda"); return; }
    const payload = {
      ...parsed.data,
      access_url: parsed.data.access_url || null,
      notes: parsed.data.notes || null,
      platform: categoryLabel(parsed.data.category),
      client_id: companyId,
    };
    if (editing) {
      const { error } = await supabase.from("credentials")
        .update(payload as never).eq("id", editing.id);
      if (error) toast.error(error.message);
      else toast.success("✓ Credenziale aggiornata");
    } else {
      const { error } = await supabase.from("credentials").insert(payload as never);
      if (error) toast.error(error.message);
      else toast.success("✓ Credenziale aggiunta");
    }
    setOpenForm(false);
    load();
  };

  const remove = async (c: Credential) => {
    const { error } = await supabase.from("credentials").delete().eq("id", c.id);
    if (error) toast.error("✗ Eliminazione non riuscita");
    else { toast.success("Credenziale eliminata"); load(); }
    setConfirmDelete(null);
    if (viewing?.id === c.id) setViewing(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('credentials.title')}</h1>
          <p className="text-sm text-muted-foreground">
            Salva in modo sicuro login e credenziali di accesso ai tuoi account.
          </p>
        </div>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Aggiungi credenziale</Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome servizio..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="md:w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le categorie</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <Skeleton className="h-64" />
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <KeyRound className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Nessuna credenziale salvata</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Aggiungi le credenziali del primo account per tenerle al sicuro e organizzate.
            </p>
            <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Aggiungi credenziale</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servizio</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Ultima modifica</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer"
                    onClick={() => { setViewing(c); setShowPwView(false); }}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        {c.service_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {maskUser(c.username)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{categoryLabel(c.category)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" onClick={() => { setViewing(c); setShowPwView(false); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => copy(c.username ?? "", "Username copiato")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                        onClick={() => setConfirmDelete(c)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {visible.map((c) => (
              <Card key={c.id} className="cursor-pointer"
                onClick={() => { setViewing(c); setShowPwView(false); }}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="font-medium truncate">{c.service_name}</p>
                    </div>
                    <Badge variant="outline">{categoryLabel(c.category)}</Badge>
                  </div>
                  <p className="text-sm font-mono text-muted-foreground">{maskUser(c.username)}</p>
                  <p className="text-xs text-muted-foreground">
                    Aggiornato {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                  </p>
                  <div className="flex gap-1 pt-1 border-t" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => { setViewing(c); setShowPwView(false); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="ml-auto text-destructive hover:text-destructive"
                      onClick={() => setConfirmDelete(c)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* View modal */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-md">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />{viewing.service_name}
                </DialogTitle>
                <DialogDescription>
                  <Badge variant="outline" className="mt-1">{categoryLabel(viewing.category)}</Badge>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Field label="Username">
                  <div className="flex gap-2">
                    <Input readOnly value={viewing.username ?? ""} className="font-mono text-sm" />
                    <Button size="icon" variant="outline" onClick={() => copy(viewing.username ?? "", "Username copiato")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </Field>

                <Field label="Password">
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      type={showPwView ? "text" : "password"}
                      value={viewing.password ?? ""}
                      className="font-mono text-sm"
                    />
                    <Button size="icon" variant="outline" onClick={() => setShowPwView((s) => !s)}>
                      {showPwView ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => setConfirmCopyPw(viewing)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </Field>

                {viewing.access_url && (
                  <Field label="URL">
                    <a href={viewing.access_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline break-all">
                      {viewing.access_url}<ExternalLink className="h-3 w-3" />
                    </a>
                  </Field>
                )}

                {viewing.notes && (
                  <Field label="Note">
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">{viewing.notes}</p>
                  </Field>
                )}

                <p className="text-xs text-muted-foreground">
                  Ultima modifica {formatDistanceToNow(new Date(viewing.updated_at), { addSuffix: true })}
                </p>
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" className="text-destructive"
                  onClick={() => setConfirmDelete(viewing)}>
                  <Trash2 className="mr-2 h-4 w-4" />Elimina
                </Button>
                <Button onClick={() => { const c = viewing; setViewing(null); openEdit(c); }}>
                  <Pencil className="mr-2 h-4 w-4" />Modifica
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit modal */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifica credenziale" : "Aggiungi credenziale"}</DialogTitle>
            <DialogDescription>
              I campi con * sono obbligatori. I dati vengono salvati in modo sicuro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Field label="Nome servizio *" error={errors.service_name}>
              <Input value={form.service_name} maxLength={120}
                onChange={(e) => setForm({ ...form, service_name: e.target.value })} />
            </Field>
            <Field label="Categoria *">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Username *" error={errors.username}>
              <Input value={form.username} maxLength={255}
                onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </Field>
            <Field label="Password *" error={errors.password}>
              <div className="flex gap-2">
                <Input
                  type={showPwForm ? "text" : "password"}
                  value={form.password} maxLength={500}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <Button type="button" size="icon" variant="outline"
                  onClick={() => setShowPwForm((s) => !s)}>
                  {showPwForm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </Field>
            <Field label="URL / link di accesso">
              <Input value={form.access_url} maxLength={500} placeholder="https://..."
                onChange={(e) => setForm({ ...form, access_url: e.target.value })} />
            </Field>
            <Field label="Note">
              <Textarea value={form.notes} maxLength={2000} rows={3}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Annulla</Button>
            <Button onClick={submit}>{editing ? "Aggiorna" : "Salva"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa credenziale?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.service_name} verrà rimossa definitivamente. L'azione è irreversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && remove(confirmDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Copy password confirm */}
      <AlertDialog open={!!confirmCopyPw} onOpenChange={(o) => !o && setConfirmCopyPw(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Copiare la password negli appunti?</AlertDialogTitle>
            <AlertDialogDescription>
              La password verrà copiata negli appunti. Ricorda di cancellarli al termine.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (confirmCopyPw?.password) copy(confirmCopyPw.password, "Password copiata");
              setConfirmCopyPw(null);
            }}>Copia</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
