import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Search, Eye, Edit2, Trash2, Power, ArrowUpDown, Download as DownloadIcon,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { downloadCsv } from "@/lib/csv-export";

const PAGE_SIZE = 10;

const STATUS_CLS: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-muted text-muted-foreground border-border",
  trial: "bg-primary/10 text-primary border-primary/20",
  paused: "bg-warning/10 text-warning border-warning/20",
};

type SortKey = "company_name" | "industry" | "status" | "created_at";

interface ClientRow {
  id: string;
  company_name: string;
  industry: string | null;
  status: string;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  monthly_fee: number | null;
  created_at: string;
}

const emptyForm = {
  company_name: "",
  industry: "retail",
  contact_email: "",
  contact_phone: "",
  website: "",
  status: "active",
  monthly_fee: "",
  notes: "",
};

export default function AdminClients() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [projectCounts, setProjectCounts] = useState<Map<string, number>>(new Map());
  const [teamCounts, setTeamCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [c, p, pr] = await Promise.all([
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("client_id"),
      supabase.from("profiles").select("company_id"),
    ]);
    if (c.error) toast.error(t("admin.loadClientsFailed"));
    setRows((c.data ?? []) as ClientRow[]);
    const pc = new Map<string, number>();
    (p.data ?? []).forEach((r: any) => pc.set(r.client_id, (pc.get(r.client_id) ?? 0) + 1));
    setProjectCounts(pc);
    const tc = new Map<string, number>();
    (pr.data ?? []).forEach((r: any) => r.company_id && tc.set(r.company_id, (tc.get(r.company_id) ?? 0) + 1));
    setTeamCounts(tc);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.company_name.toLowerCase().includes(q) && !(r.contact_email ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
    list.sort((a: any, b: any) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (sortKey === "created_at") {
        return (new Date(av).getTime() - new Date(bv).getTime()) * (sortAsc ? 1 : -1);
      }
      return String(av).localeCompare(String(bv)) * (sortAsc ? 1 : -1);
    });
    return list;
  }, [rows, search, statusFilter, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search, statusFilter, sortKey, sortAsc]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortAsc(!sortAsc);
    else { setSortKey(k); setSortAsc(true); }
  };

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (r: ClientRow) => {
    setEditingId(r.id);
    setForm({
      company_name: r.company_name,
      industry: r.industry ?? "retail",
      contact_email: r.contact_email ?? "",
      contact_phone: r.contact_phone ?? "",
      website: r.website ?? "",
      status: r.status,
      monthly_fee: r.monthly_fee != null ? String(r.monthly_fee) : "",
      notes: "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.company_name.trim()) return toast.error(t("admin.companyNameRequired"));
    const fee = form.monthly_fee === "" ? 0 : Number(form.monthly_fee);
    if (Number.isNaN(fee) || fee < 0) return toast.error(t("admin.feeNonNegative"));
    if (form.status === "active" && fee <= 0) {
      return toast.error(t("admin.feeRequired"));
    }
    setSaving(true);
    const payload = {
      company_name: form.company_name,
      industry: form.industry as any,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      website: form.website || null,
      status: form.status as any,
      monthly_fee: fee,
    };
    if (editingId) {
      const { error } = await supabase.from("clients").update(payload).eq("id", editingId);
      if (error) { setSaving(false); return toast.error(error.message); }
      toast.success(t("admin.clientUpdated"));
    } else {
      const { error } = await supabase.from("clients").insert(payload);
      if (error) { setSaving(false); return toast.error(error.message); }
      toast.success(t("admin.clientCreated"));
    }
    setSaving(false);
    setOpen(false);
    load();
  };

  const toggleActive = async (r: ClientRow) => {
    const next = r.status === "active" ? "inactive" : "active";
    if (next === "active" && (!r.monthly_fee || Number(r.monthly_fee) <= 0)) {
      return toast.error(t("admin.feeRequired"));
    }
    const { error } = await supabase.from("clients").update({ status: next as any }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(t(`admin.statuses.${next}`));
    load();
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from("clients").delete().eq("id", confirmDelete);
    if (error) return toast.error(error.message);
    toast.success(t("admin.clientDeleted"));
    setConfirmDelete(null);
    load();
  };

  const exportCsv = () => {
    downloadCsv("clients", [
      ["Company", "Industry", "Status", "Monthly Fee EUR", "Email", "Phone", "Website", "Created"],
      ...filtered.map((c) => [
        c.company_name, c.industry ?? "", c.status, c.monthly_fee ?? 0, c.contact_email ?? "",
        c.contact_phone ?? "", c.website ?? "", c.created_at,
      ]),
    ]);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-[1400px]">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.clients')}</h1>
          <p className="text-muted-foreground">{t("admin.ofClients", { filtered: filtered.length, total: rows.length })}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}><DownloadIcon className="h-4 w-4 mr-2" />{t("common.export")}</Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />{t("admin.newClient")}</Button>
        </div>
      </header>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder={t("admin.searchClients")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="md:w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
              <SelectItem value="active">{t("admin.statuses.active")}</SelectItem>
              <SelectItem value="inactive">{t("admin.statuses.inactive")}</SelectItem>
              <SelectItem value="trial">{t("admin.statuses.trial")}</SelectItem>
              <SelectItem value="paused">{t("admin.statuses.paused")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="hidden lg:grid grid-cols-[2fr_1fr_1.3fr_1fr_110px_80px_80px_120px_140px] gap-3 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/30">
          <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("company_name")}>{t("admin.companyName")} <ArrowUpDown className="h-3 w-3" /></button>
          <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("industry")}>{t("admin.industry")} <ArrowUpDown className="h-3 w-3" /></button>
          <span>{t("admin.contact")}</span>
          <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("status")}>{t("admin.status")} <ArrowUpDown className="h-3 w-3" /></button>
          <span>{t("admin.monthlyRevenue")}</span>
          <span>{t("admin.team")}</span>
          <span>{t("admin.activeProjects")}</span>
          <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("created_at")}>{t("uploads.uploadedAt")} <ArrowUpDown className="h-3 w-3" /></button>
          <span className="text-right">{t("common.actions")}</span>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : pageRows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">{t("admin.noClientsFound")}</div>
        ) : pageRows.map((r) => (
          <div key={r.id} className="grid lg:grid-cols-[2fr_1fr_1.3fr_1fr_110px_80px_80px_120px_140px] gap-3 px-4 py-3 items-center border-b last:border-0 hover:bg-muted/20">
            <Link to={`/admin/clients/${r.id}`} className="font-medium hover:text-primary">{r.company_name}</Link>
            <Badge variant="outline" className="capitalize w-fit">{r.industry ? t(`admin.industries.${r.industry}`, r.industry) : "—"}</Badge>
            <span className="text-sm text-muted-foreground truncate">{r.contact_email ?? "—"}</span>
            <Badge variant="outline" className={cn("capitalize w-fit", STATUS_CLS[r.status])}>{t(`admin.statuses.${r.status}`, r.status)}</Badge>
            <span className={cn("text-sm font-semibold", (!r.monthly_fee || Number(r.monthly_fee) <= 0) && "text-warning")}>
              €{Number(r.monthly_fee ?? 0).toLocaleString()}
            </span>
            <span className="text-sm">{teamCounts.get(r.id) ?? 0}</span>
            <span className="text-sm">{projectCounts.get(r.id) ?? 0}</span>
            <span className="text-sm text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</span>
            <div className="flex justify-end gap-1">
              <Button asChild size="icon" variant="ghost" title={t("common.view")}><Link to={`/admin/clients/${r.id}`}><Eye className="h-4 w-4" /></Link></Button>
              <Button size="icon" variant="ghost" title={t("common.edit")} onClick={() => openEdit(r)}><Edit2 className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" title={r.status === "active" ? t("admin.statuses.inactive") : t("admin.statuses.active")} onClick={() => toggleActive(r)}><Power className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" title={t("common.delete")} onClick={() => setConfirmDelete(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between p-4 border-t">
            <span className="text-xs text-muted-foreground">{t("common.page")} {page} {t("common.of")} {totalPages}</span>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>{t("common.previous")}</Button>
              {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => (
                <Button key={i} size="sm" variant={page === i + 1 ? "default" : "outline"} onClick={() => setPage(i + 1)}>{i + 1}</Button>
              ))}
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>{t("common.next")}</Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? t("admin.editClient") : t("admin.newClient")}</DialogTitle>
            <DialogDescription>{t("admin.fieldsRequired")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("admin.companyName")} *</Label>
              <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("admin.industry")} *</Label>
                <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">{t("admin.industries.retail")}</SelectItem>
                    <SelectItem value="wellness">{t("admin.industries.wellness")}</SelectItem>
                    <SelectItem value="repair">{t("admin.industries.repair")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("admin.status")} *</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("admin.statuses.active")}</SelectItem>
                    <SelectItem value="inactive">{t("admin.statuses.inactive")}</SelectItem>
                    <SelectItem value="trial">{t("admin.statuses.trial")}</SelectItem>
                    <SelectItem value="paused">{t("admin.statuses.paused")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("admin.contactEmail")}</Label><Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
              <div><Label>{t("admin.contactPhone")}</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
            </div>
            <div><Label>{t("admin.website")}</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
            <div>
              <Label>{t("admin.monthlyContract")} * (€)</Label>
              <Input
                type="number" min="0" step="0.01" placeholder="2000"
                value={form.monthly_fee}
                onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">{t("admin.monthlyContractHint")}</p>
            </div>
            <div><Label>{t("tasks.description")}</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={save} disabled={saving}>{editingId ? t("common.update") : t("common.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.deleteClient")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.deleteClientDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground">{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
