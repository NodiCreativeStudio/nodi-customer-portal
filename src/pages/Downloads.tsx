import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow } from "date-fns";
import {
  Download, Eye, Trash2, Share2, Search, FileText, Receipt,
  FileSignature, Package, ClipboardList, File as FileIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Category = "report" | "invoice" | "contract" | "deliverable" | "onboarding" | "other";

interface DocRow {
  id: string;
  client_id: string;
  name: string;
  category: Category;
  storage_path: string | null;
  external_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  description: string | null;
  created_at: string;
}

const CATEGORY_META: Record<Category, { label: string; icon: typeof FileText; cls: string }> = {
  report:      { label: "Report",      icon: FileText,      cls: "bg-primary/10 text-primary border-primary/20" },
  invoice:     { label: "Invoice",     icon: Receipt,       cls: "bg-success/10 text-success border-success/20" },
  contract:    { label: "Contract",    icon: FileSignature, cls: "bg-warning/10 text-warning border-warning/20" },
  deliverable: { label: "Deliverable", icon: Package,       cls: "bg-secondary/10 text-secondary-foreground border-secondary/30" },
  onboarding:  { label: "Onboarding",  icon: ClipboardList, cls: "bg-accent/10 text-accent-foreground border-accent/30" },
  other:       { label: "Other",       icon: FileIcon,      cls: "bg-muted text-muted-foreground border-border" },
};

function fmtSize(n?: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

type SortKey = "date" | "name" | "size" | "type";
type DateRange = "30" | "90" | "all";

export default function Downloads() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | Category>("all");
  const [filter, setFilter] = useState<"all" | Category>("all");
  const [range, setRange] = useState<DateRange>("all");
  const [sort, setSort] = useState<SortKey>("date");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<DocRow | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DocRow | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("company_id").eq("id", user.id).maybeSingle()
      .then(({ data }) => setCompanyId(data?.company_id ?? null));
  }, [user]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("documents").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Failed to load documents");
    setDocs((data ?? []) as DocRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff = range === "all" ? 0 : now - parseInt(range) * 86400000;
    let list = docs.filter(d => {
      if (tab !== "all" && d.category !== tab) return false;
      if (filter !== "all" && d.category !== filter) return false;
      if (cutoff && new Date(d.created_at).getTime() < cutoff) return false;
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    list.sort((a, b) => {
      switch (sort) {
        case "name": return a.name.localeCompare(b.name);
        case "size": return (b.file_size ?? 0) - (a.file_size ?? 0);
        case "type": return a.category.localeCompare(b.category);
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return list;
  }, [docs, tab, filter, range, search, sort]);

  const getUrl = async (doc: DocRow): Promise<string | null> => {
    if (doc.external_url) return doc.external_url;
    if (!doc.storage_path) return null;
    const { data, error } = await supabase.storage
      .from("uploads").createSignedUrl(doc.storage_path, 300);
    if (error) { toast.error("Could not get file link"); return null; }
    return data.signedUrl;
  };

  const handleDownload = async (doc: DocRow) => {
    toast("Downloading…");
    const url = await getUrl(doc);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url; a.download = doc.name; a.target = "_blank";
    document.body.appendChild(a); a.click(); a.remove();
    toast.success("Downloaded");
  };

  const handlePreview = async (doc: DocRow) => {
    setPreview(doc);
    setPreviewUrl(null);
    const url = await getUrl(doc);
    setPreviewUrl(url);
  };

  const handleShare = async (doc: DocRow) => {
    const url = await getUrl(doc);
    if (!url) return;
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard");
  };

  const handleDelete = async (doc: DocRow) => {
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) { toast.error("Delete failed"); return; }
    toast.success("Document deleted");
    setConfirmDelete(null);
    setDocs(prev => prev.filter(d => d.id !== doc.id));
  };

  const toggleSel = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const downloadSelected = async () => {
    for (const id of selected) {
      const d = docs.find(x => x.id === id);
      if (d) await handleDownload(d);
    }
    setSelected(new Set());
  };

  const tabs: ("all" | Category)[] = ["all", "report", "deliverable", "invoice", "contract", "onboarding"];

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Downloads &amp; Reports</h1>
        <p className="text-muted-foreground">Access your documents, reports, and invoices.</p>
      </header>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search documents…" value={search}
              onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filter} onValueChange={v => setFilter(v as any)}>
            <SelectTrigger className="md:w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {(Object.keys(CATEGORY_META) as Category[]).map(c => (
                <SelectItem key={c} value={c}>{CATEGORY_META[c].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={v => setRange(v as DateRange)}>
            <SelectTrigger className="md:w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={v => setSort(v as SortKey)}>
            <SelectTrigger className="md:w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-1">
          <span className="text-sm text-muted-foreground">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={downloadSelected}>
            <Download className="h-4 w-4 mr-2" />Download all
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      <Tabs value={tab} onValueChange={v => setTab(v as any)}>
        <TabsList className="flex flex-wrap h-auto">
          {tabs.map(t => (
            <TabsTrigger key={t} value={t} className="capitalize">
              {t === "all" ? "All" : CATEGORY_META[t as Category].label + "s"}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="p-12 text-center space-y-2">
              <FileIcon className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="font-medium">No documents available yet</p>
              <p className="text-sm text-muted-foreground">Your reports will appear here once generated.</p>
            </CardContent></Card>
          ) : (
            <>
              {/* Desktop table */}
              <Card className="hidden md:block overflow-hidden">
                <div className="grid grid-cols-[40px_1fr_140px_140px_100px_220px] gap-3 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/30">
                  <span></span>
                  <span>Document</span>
                  <span>Type</span>
                  <span>Date</span>
                  <span>Size</span>
                  <span className="text-right">Actions</span>
                </div>
                {filtered.map(doc => {
                  const meta = CATEGORY_META[doc.category];
                  const Icon = meta.icon;
                  return (
                    <div key={doc.id}
                      className="grid grid-cols-[40px_1fr_140px_140px_100px_220px] gap-3 px-4 py-3 items-center border-b last:border-0 hover:bg-muted/20">
                      <Checkbox checked={selected.has(doc.id)} onCheckedChange={() => toggleSel(doc.id)} />
                      <button onClick={() => handlePreview(doc)} className="flex items-center gap-3 text-left min-w-0">
                        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <span className="truncate font-medium hover:text-primary">{doc.name}</span>
                      </button>
                      <Badge variant="outline" className={cn("w-fit", meta.cls)}>{meta.label}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                      </span>
                      <span className="text-sm">{fmtSize(doc.file_size)}</span>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handlePreview(doc)} title="Preview"><Eye className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDownload(doc)} title="Download"><Download className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleShare(doc)} title="Share"><Share2 className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setConfirmDelete(doc)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  );
                })}
              </Card>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {filtered.map(doc => {
                  const meta = CATEGORY_META[doc.category];
                  const Icon = meta.icon;
                  return (
                    <Card key={doc.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <Icon className="h-6 w-6 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <button onClick={() => handlePreview(doc)} className="font-medium truncate block w-full text-left">
                              {doc.name}
                            </button>
                            <div className="flex flex-wrap gap-2 mt-1 items-center">
                              <Badge variant="outline" className={cn("text-xs", meta.cls)}>{meta.label}</Badge>
                              <span className="text-xs text-muted-foreground">{fmtSize(doc.file_size)}</span>
                              <span className="text-xs text-muted-foreground">
                                · {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4 mr-2" />Download
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleShare(doc)}><Share2 className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(doc)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview modal */}
      <Dialog open={!!preview} onOpenChange={o => { if (!o) { setPreview(null); setPreviewUrl(null); } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">{preview?.name}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <Badge variant="outline" className={CATEGORY_META[preview.category].cls}>
                  {CATEGORY_META[preview.category].label}
                </Badge>
                <span>{fmtSize(preview.file_size)}</span>
                <span>{new Date(preview.created_at).toLocaleDateString()}</span>
              </div>
              {preview.description && <p className="text-sm">{preview.description}</p>}
              <div className="bg-muted rounded-md h-[400px] overflow-hidden flex items-center justify-center">
                {!previewUrl ? (
                  <Skeleton className="h-full w-full" />
                ) : preview.mime_type?.startsWith("image/") ? (
                  <img src={previewUrl} alt={preview.name} className="max-h-full max-w-full" />
                ) : preview.mime_type?.includes("pdf") || preview.name.endsWith(".pdf") ? (
                  <iframe src={previewUrl} className="w-full h-full" title={preview.name} />
                ) : (
                  <div className="text-center text-muted-foreground p-6">
                    <FileIcon className="h-12 w-12 mx-auto mb-2" />
                    <p>Preview not available for this file type.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => preview && handleShare(preview)}>
              <Share2 className="h-4 w-4 mr-2" />Share
            </Button>
            <Button onClick={() => preview && handleDownload(preview)}>
              <Download className="h-4 w-4 mr-2" />Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={o => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.name}" will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
