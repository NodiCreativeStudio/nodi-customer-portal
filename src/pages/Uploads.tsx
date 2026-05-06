import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  UploadCloud, FileText, FileImage, FileArchive, FileSpreadsheet,
  File as FileIcon, Download, Trash2, Eye, Search, Folder, Share2,
} from "lucide-react";
import { toast } from "sonner";

interface UploadRow {
  id: string;
  client_id: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_at: string;
  uploaded_by: string | null;
  storage_path: string | null;
  folder: string | null;
}

type FolderKey = "all" | "retail" | "wellness" | "general";
type FilterType = "all" | "pdf" | "doc" | "image" | "spreadsheet" | "archive";
type DateRange = "7" | "30" | "all";
type SortBy = "date" | "name" | "size" | "type";

const ACCEPTED = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip";
const MAX_BYTES = 50 * 1024 * 1024;
const BUCKET = "uploads";

function fileKind(name: string, mime?: string | null): FilterType {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext) || mime?.includes("pdf")) return "pdf";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext) || mime?.startsWith("image/")) return "image";
  if (["xls", "xlsx", "csv"].includes(ext)) return "spreadsheet";
  if (["zip", "rar", "7z"].includes(ext)) return "archive";
  if (["doc", "docx", "txt", "md"].includes(ext)) return "doc";
  return "doc";
}

function FileTypeIcon({ kind, className }: { kind: FilterType; className?: string }) {
  const map: Record<FilterType, JSX.Element> = {
    pdf: <FileText className={cn("text-destructive", className)} />,
    image: <FileImage className={cn("text-primary", className)} />,
    spreadsheet: <FileSpreadsheet className={cn("text-success", className)} />,
    archive: <FileArchive className={cn("text-warning", className)} />,
    doc: <FileText className={cn("text-secondary", className)} />,
    all: <FileIcon className={className} />,
  };
  return map[kind];
}

function fmtSize(n?: number | null): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Uploads() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [files, setFiles] = useState<UploadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState<FolderKey>("all");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [uploadedBy, setUploadedBy] = useState<"all" | "me">("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<{ name: string; pct: number } | null>(null);
  const [preview, setPreview] = useState<{ row: UploadRow; url: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UploadRow | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: prof } = await supabase
      .from("profiles").select("company_id").eq("id", user.id).maybeSingle();
    const cid = prof?.company_id ?? null;
    setCompanyId(cid);
    if (!cid) { setFiles([]); setLoading(false); return; }
    const { data } = await supabase
      .from("uploads").select("*").eq("client_id", cid)
      .order("uploaded_at", { ascending: false });
    setFiles((data ?? []) as UploadRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleFiles = async (list: FileList | File[]) => {
    if (!companyId || !user) {
      toast.error("Your account isn't linked to a company yet.");
      return;
    }
    const items = Array.from(list);
    for (const f of items) {
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} exceeds 50MB limit`);
        continue;
      }
      const folderName = folder === "all" ? "general" : folder;
      const path = `${companyId}/${folderName}/${Date.now()}-${f.name}`;
      setProgress({ name: f.name, pct: 10 });
      const { error: upErr } = await supabase.storage
        .from(BUCKET).upload(path, f, { contentType: f.type, upsert: false });
      if (upErr) {
        toast.error(`Upload failed: ${upErr.message}`);
        setProgress(null);
        continue;
      }
      setProgress({ name: f.name, pct: 80 });
      const { error: dbErr } = await supabase.from("uploads").insert({
        client_id: companyId,
        file_name: f.name,
        file_size: f.size,
        file_type: f.type || null,
        uploaded_by: user.id,
        storage_path: path,
        folder: folderName,
      } as never);
      setProgress({ name: f.name, pct: 100 });
      if (dbErr) toast.error(`Saved file but record failed: ${dbErr.message}`);
      else toast.success(`✓ ${f.name} uploaded`);
      setTimeout(() => setProgress(null), 600);
    }
    load();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const openPreview = async (row: UploadRow) => {
    if (!row.storage_path) { toast.error("File path missing"); return; }
    const { data, error } = await supabase.storage
      .from(BUCKET).createSignedUrl(row.storage_path, 60 * 5);
    if (error || !data) { toast.error("Could not open file"); return; }
    setPreview({ row, url: data.signedUrl });
  };

  const downloadFile = async (row: UploadRow) => {
    if (!row.storage_path) return;
    const { data, error } = await supabase.storage
      .from(BUCKET).createSignedUrl(row.storage_path, 60, { download: row.file_name });
    if (error || !data) { toast.error("Download failed"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const shareFile = async (row: UploadRow) => {
    if (!row.storage_path) return;
    const { data } = await supabase.storage
      .from(BUCKET).createSignedUrl(row.storage_path, 60 * 60);
    if (data) {
      await navigator.clipboard.writeText(data.signedUrl);
      toast.success("Share link copied (valid 1h)");
    }
  };

  const deleteFile = async (row: UploadRow) => {
    if (row.storage_path) {
      await supabase.storage.from(BUCKET).remove([row.storage_path]);
    }
    await supabase.from("uploads").delete().eq("id", row.id);
    toast.success("File deleted");
    setConfirmDelete(null);
    load();
  };

  const visible = useMemo(() => {
    let list = [...files];
    if (folder !== "all") list = list.filter((f) => (f.folder ?? "general") === folder);
    if (filterType !== "all") list = list.filter((f) => fileKind(f.file_name, f.file_type) === filterType);
    if (dateRange !== "all") {
      const cutoff = Date.now() - parseInt(dateRange) * 86400000;
      list = list.filter((f) => new Date(f.uploaded_at).getTime() > cutoff);
    }
    if (uploadedBy === "me" && user) list = list.filter((f) => f.uploaded_by === user.id);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((f) => f.file_name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sortBy === "name") return a.file_name.localeCompare(b.file_name);
      if (sortBy === "size") return (b.file_size ?? 0) - (a.file_size ?? 0);
      if (sortBy === "type") return fileKind(a.file_name, a.file_type).localeCompare(fileKind(b.file_name, b.file_type));
      return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
    });
    return list;
  }, [files, folder, filterType, dateRange, uploadedBy, search, sortBy, user]);

  const folders: { key: FolderKey; label: string }[] = [
    { key: "all", label: "All Files" },
    { key: "retail", label: "Retail Vertical" },
    { key: "wellness", label: "Wellness Vertical" },
    { key: "general", label: "General Documents" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Files & Documents</h1>
          <p className="text-sm text-muted-foreground">Upload, preview and manage your project assets.</p>
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger className="md:w-44"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Sort by Date</SelectItem>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="size">Sort by Size</SelectItem>
            <SelectItem value="type">Sort by Type</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "border-2 border-dashed transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border",
        )}
      >
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <UploadCloud className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-medium">Drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, ZIP · Max 50MB per file
            </p>
          </div>
          <input
            ref={inputRef} type="file" multiple accept={ACCEPTED} className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <Button onClick={() => inputRef.current?.click()}>Browse files</Button>
          {progress && (
            <div className="w-full max-w-sm space-y-1 pt-2">
              <div className="flex justify-between text-xs">
                <span className="truncate max-w-[70%]">{progress.name}</span>
                <span>{progress.pct}%</span>
              </div>
              <Progress value={progress.pct} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit">
          <CardContent className="p-3">
            <p className="px-2 pb-2 text-xs font-medium uppercase text-muted-foreground">Folders</p>
            <nav className="space-y-1">
              {folders.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFolder(f.key)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    folder === f.key ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted",
                  )}
                >
                  <Folder className="h-4 w-4" />{f.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search files..." value={search}
                  onChange={(e) => setSearch(e.target.value)} className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="doc">Documents</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="spreadsheet">Spreadsheets</SelectItem>
                  <SelectItem value="archive">Archives</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                <SelectTrigger className="md:w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              <Select value={uploadedBy} onValueChange={(v) => setUploadedBy(v as "all" | "me")}>
                <SelectTrigger className="md:w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  <SelectItem value="me">Me</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
          ) : visible.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <UploadCloud className="mx-auto h-10 w-10 mb-3 opacity-40" />
                <p>No files uploaded yet. Drag files here to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((row) => {
                const kind = fileKind(row.file_name, row.file_type);
                return (
                  <Card key={row.id} className="group transition-shadow hover:shadow-md">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <FileTypeIcon kind={kind} className="h-8 w-8 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <button
                            onClick={() => openPreview(row)}
                            className="block text-sm font-medium truncate hover:underline text-left w-full"
                            title={row.file_name}
                          >{row.file_name}</button>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(row.uploaded_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="outline">{kind.toUpperCase()}</Badge>
                        <span className="text-muted-foreground">{fmtSize(row.file_size)}</span>
                      </div>
                      <div className="flex gap-1 pt-1 border-t opacity-80 group-hover:opacity-100">
                        <Button size="sm" variant="ghost" onClick={() => openPreview(row)} title="Preview">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => downloadFile(row)} title="Download">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => shareFile(row)} title="Share link">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm" variant="ghost" className="ml-auto text-destructive hover:text-destructive"
                          onClick={() => setConfirmDelete(row)} title="Delete"
                        ><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle className="truncate">{preview.row.file_name}</DialogTitle>
              </DialogHeader>
              <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                <span>{fmtSize(preview.row.file_size)}</span>
                <span>{preview.row.file_type ?? "unknown"}</span>
                <span>{formatDistanceToNow(new Date(preview.row.uploaded_at), { addSuffix: true })}</span>
              </div>
              <div className="rounded-md border bg-muted/30 overflow-hidden h-[60vh]">
                {fileKind(preview.row.file_name, preview.row.file_type) === "image" ? (
                  <img src={preview.url} alt={preview.row.file_name} className="w-full h-full object-contain" />
                ) : fileKind(preview.row.file_name, preview.row.file_type) === "pdf" ? (
                  <iframe src={preview.url} title={preview.row.file_name} className="w-full h-full" />
                ) : (
                  <div className="grid place-items-center h-full text-sm text-muted-foreground p-6 text-center">
                    Preview not available for this file type. Use Download to open it.
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPreview(null)}>Close</Button>
                <Button onClick={() => downloadFile(preview.row)}>
                  <Download className="mr-2 h-4 w-4" />Download
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this file?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.file_name} will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && deleteFile(confirmDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
