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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger,
  ContextMenuTrigger, ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  UploadCloud, FileText, FileImage, FileArchive, FileSpreadsheet,
  File as FileIcon, Download, Trash2, Eye, Search, Folder, FolderPlus,
  ChevronRight, ChevronDown, Share2, FolderInput, Pencil,
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
  folder_id: string | null;
}

interface FolderRow {
  id: string;
  client_id: string;
  folder_name: string;
  parent_id: string | null;
}

const ACCEPTED = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip";
const MAX_BYTES = 50 * 1024 * 1024;
const BUCKET = "uploads";

type FilterType = "all" | "pdf" | "doc" | "image" | "spreadsheet" | "archive";

function fileKind(name: string, mime?: string | null): FilterType {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext) || mime?.includes("pdf")) return "pdf";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext) || mime?.startsWith("image/")) return "image";
  if (["xls", "xlsx", "csv"].includes(ext)) return "spreadsheet";
  if (["zip", "rar", "7z"].includes(ext)) return "archive";
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
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<{ name: string; pct: number } | null>(null);
  const [preview, setPreview] = useState<{ row: UploadRow; url: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UploadRow | null>(null);
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState<FolderRow | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParent, setNewFolderParent] = useState<string | null>(null);
  const [renameRow, setRenameRow] = useState<UploadRow | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [draggingFileId, setDraggingFileId] = useState<string | null>(null);
  const [dropTargetFolder, setDropTargetFolder] = useState<string | "root" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: prof } = await supabase
      .from("profiles").select("company_id").eq("id", user.id).maybeSingle();
    const cid = prof?.company_id ?? null;
    setCompanyId(cid);
    if (!cid) { setFiles([]); setFolders([]); setLoading(false); return; }
    const [{ data: fileData }, { data: folderData }] = await Promise.all([
      supabase.from("uploads").select("*").eq("client_id", cid).order("uploaded_at", { ascending: false }),
      supabase.from("folders").select("*").eq("client_id", cid).order("folder_name"),
    ]);
    setFiles((fileData ?? []) as UploadRow[]);
    setFolders((folderData ?? []) as FolderRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Build folder tree
  const childMap = useMemo(() => {
    const m = new Map<string | null, FolderRow[]>();
    for (const f of folders) {
      const arr = m.get(f.parent_id) ?? [];
      arr.push(f);
      m.set(f.parent_id, arr);
    }
    return m;
  }, [folders]);

  const folderById = useMemo(() => {
    const m = new Map<string, FolderRow>();
    folders.forEach((f) => m.set(f.id, f));
    return m;
  }, [folders]);

  // Breadcrumb path
  const breadcrumbs = useMemo(() => {
    const path: FolderRow[] = [];
    let cur = currentFolderId ? folderById.get(currentFolderId) : null;
    while (cur) {
      path.unshift(cur);
      cur = cur.parent_id ? folderById.get(cur.parent_id) ?? null : null;
    }
    return path;
  }, [currentFolderId, folderById]);

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
      const folderSlug = currentFolderId ?? "root";
      const path = `${companyId}/${folderSlug}/${Date.now()}-${f.name}`;
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
        folder_id: currentFolderId,
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
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
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
    if (row.storage_path) await supabase.storage.from(BUCKET).remove([row.storage_path]);
    await supabase.from("uploads").delete().eq("id", row.id);
    toast.success("File deleted");
    setConfirmDelete(null);
    load();
  };

  const moveFileToFolder = async (fileId: string, newFolderId: string | null) => {
    const { error } = await supabase
      .from("uploads").update({ folder_id: newFolderId }).eq("id", fileId);
    if (error) toast.error(error.message);
    else {
      const target = newFolderId ? folderById.get(newFolderId)?.folder_name : "Root";
      toast.success(`Moved to ${target}`);
      load();
    }
  };

  const renameFile = async () => {
    if (!renameRow || !renameValue.trim()) return;
    const { error } = await supabase
      .from("uploads").update({ file_name: renameValue.trim() }).eq("id", renameRow.id);
    if (error) toast.error(error.message);
    else { toast.success("File renamed"); setRenameRow(null); load(); }
  };

  const createFolder = async () => {
    if (!companyId || !newFolderName.trim()) return;
    const { error } = await supabase.from("folders").insert({
      client_id: companyId,
      folder_name: newFolderName.trim(),
      parent_id: newFolderParent,
    } as never);
    if (error) toast.error(error.message);
    else {
      toast.success("Folder created");
      setNewFolderOpen(false);
      setNewFolderName("");
      if (newFolderParent) setExpanded((s) => new Set(s).add(newFolderParent));
      load();
    }
  };

  const deleteFolder = async (folder: FolderRow) => {
    const hasFiles = files.some((f) => f.folder_id === folder.id);
    const hasChildren = folders.some((f) => f.parent_id === folder.id);
    if (hasFiles || hasChildren) {
      toast.error("Folder is not empty. Move or delete its contents first.");
      setConfirmDeleteFolder(null);
      return;
    }
    const { error } = await supabase.from("folders").delete().eq("id", folder.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Folder deleted");
      if (currentFolderId === folder.id) setCurrentFolderId(folder.parent_id);
      setConfirmDeleteFolder(null);
      load();
    }
  };

  const visible = useMemo(() => {
    let list = files.filter((f) => (f.folder_id ?? null) === currentFolderId);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((f) => f.file_name.toLowerCase().includes(q));
    }
    return list;
  }, [files, currentFolderId, search]);

  const allFolderOptions = folders;

  // Folder tree node component
  const TreeNode = ({ folder, depth }: { folder: FolderRow; depth: number }) => {
    const children = childMap.get(folder.id) ?? [];
    const isOpen = expanded.has(folder.id);
    const isActive = currentFolderId === folder.id;
    const isDropTarget = dropTargetFolder === folder.id;
    return (
      <div>
        <div
          onDragOver={(e) => { if (draggingFileId) { e.preventDefault(); setDropTargetFolder(folder.id); } }}
          onDragLeave={() => setDropTargetFolder((t) => (t === folder.id ? null : t))}
          onDrop={(e) => {
            e.preventDefault();
            if (draggingFileId) moveFileToFolder(draggingFileId, folder.id);
            setDropTargetFolder(null);
            setDraggingFileId(null);
          }}
          className={cn(
            "flex items-center gap-1 rounded-md px-1.5 py-1 text-sm transition-colors",
            isActive && "bg-primary/10 text-primary font-medium",
            isDropTarget && "ring-2 ring-primary bg-primary/10",
            !isActive && !isDropTarget && "hover:bg-muted",
          )}
          style={{ paddingLeft: depth * 12 + 6 }}
        >
          <button
            onClick={() => setExpanded((s) => {
              const n = new Set(s);
              n.has(folder.id) ? n.delete(folder.id) : n.add(folder.id);
              return n;
            })}
            className="shrink-0 p-0.5"
            aria-label={isOpen ? "Collapse" : "Expand"}
          >
            {children.length > 0 ? (
              isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
            ) : <span className="inline-block w-3.5" />}
          </button>
          <button
            onClick={() => setCurrentFolderId(folder.id)}
            onDoubleClick={() => {
              setCurrentFolderId(folder.id);
              setExpanded((s) => new Set(s).add(folder.id));
            }}
            className="flex flex-1 items-center gap-2 truncate text-left"
          >
            <Folder className="h-4 w-4 shrink-0" />
            <span className="truncate">{folder.folder_name}</span>
          </button>
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <button className="shrink-0 px-1 text-muted-foreground hover:text-foreground" aria-label="Folder actions">⋮</button>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => { setNewFolderParent(folder.id); setNewFolderOpen(true); }}>
                <FolderPlus className="mr-2 h-4 w-4" /> New subfolder
              </ContextMenuItem>
              <ContextMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setConfirmDeleteFolder(folder)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete folder
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
        {isOpen && children.map((c) => <TreeNode key={c.id} folder={c} depth={depth + 1} />)}
      </div>
    );
  };

  const rootFolders = childMap.get(null) ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Project Files & Documents</h1>
        <p className="text-sm text-muted-foreground">Organize files into folders, drag to move, right-click for actions.</p>
      </div>

      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1 text-sm">
        <button
          onClick={() => setCurrentFolderId(null)}
          onDragOver={(e) => { if (draggingFileId) { e.preventDefault(); setDropTargetFolder("root"); } }}
          onDragLeave={() => setDropTargetFolder((t) => (t === "root" ? null : t))}
          onDrop={(e) => {
            e.preventDefault();
            if (draggingFileId) moveFileToFolder(draggingFileId, null);
            setDropTargetFolder(null);
            setDraggingFileId(null);
          }}
          className={cn(
            "rounded px-2 py-1 font-medium transition-colors",
            currentFolderId === null ? "text-primary" : "hover:bg-muted",
            dropTargetFolder === "root" && "ring-2 ring-primary",
          )}
        >Root</button>
        {breadcrumbs.map((b) => (
          <div key={b.id} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <button
              onClick={() => setCurrentFolderId(b.id)}
              className={cn(
                "rounded px-2 py-1 transition-colors",
                b.id === currentFolderId ? "text-primary font-medium" : "hover:bg-muted",
              )}
            >{b.folder_name}</button>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Folder tree sidebar */}
        <Card className="h-fit">
          <CardContent className="space-y-2 p-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">Folders</p>
              <Button
                size="sm" variant="ghost" className="h-7 px-2"
                onClick={() => { setNewFolderParent(null); setNewFolderOpen(true); }}
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div
              onDragOver={(e) => { if (draggingFileId) { e.preventDefault(); setDropTargetFolder("root"); } }}
              onDragLeave={() => setDropTargetFolder((t) => (t === "root" ? null : t))}
              onDrop={(e) => {
                e.preventDefault();
                if (draggingFileId) moveFileToFolder(draggingFileId, null);
                setDropTargetFolder(null);
                setDraggingFileId(null);
              }}
              className={cn(
                "rounded-md px-2 py-1 text-sm cursor-pointer transition-colors",
                currentFolderId === null && "bg-primary/10 text-primary font-medium",
                dropTargetFolder === "root" && "ring-2 ring-primary bg-primary/10",
                currentFolderId !== null && "hover:bg-muted",
              )}
              onClick={() => setCurrentFolderId(null)}
            >
              <div className="flex items-center gap-2"><Folder className="h-4 w-4" /> Root</div>
            </div>
            {rootFolders.map((f) => <TreeNode key={f.id} folder={f} depth={0} />)}
            {rootFolders.length === 0 && (
              <p className="px-2 py-3 text-xs text-muted-foreground">No folders yet.</p>
            )}
            <Button
              size="sm" variant="outline" className="w-full mt-2"
              onClick={() => { setNewFolderParent(null); setNewFolderOpen(true); }}
            >
              <FolderPlus className="mr-2 h-3.5 w-3.5" /> New Folder
            </Button>
          </CardContent>
        </Card>

        {/* Files area */}
        <div className="space-y-4">
          {/* Upload zone */}
          <Card
            onDragOver={(e) => { if (!draggingFileId) { e.preventDefault(); setDragOver(true); } }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              "border-2 border-dashed transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <UploadCloud className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Drop files here to upload to this folder</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  PDF, DOC, XLS, JPG, PNG, ZIP · Max 50MB
                </p>
              </div>
              <input
                ref={inputRef} type="file" multiple accept={ACCEPTED} className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
              <Button size="sm" onClick={() => inputRef.current?.click()}>Browse files</Button>
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

          {/* Search */}
          <Card>
            <CardContent className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search in this folder..." value={search}
                  onChange={(e) => setSearch(e.target.value)} className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
          ) : visible.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <UploadCloud className="mx-auto h-10 w-10 mb-3 opacity-40" />
                <p>This folder is empty. Drop files above to add them.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((row) => {
                const kind = fileKind(row.file_name, row.file_type);
                return (
                  <ContextMenu key={row.id}>
                    <ContextMenuTrigger asChild>
                      <Card
                        draggable
                        onDragStart={() => setDraggingFileId(row.id)}
                        onDragEnd={() => { setDraggingFileId(null); setDropTargetFolder(null); }}
                        className={cn(
                          "group transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing",
                          draggingFileId === row.id && "opacity-50",
                        )}
                      >
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
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => openPreview(row)}>
                        <Eye className="mr-2 h-4 w-4" /> Preview
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => downloadFile(row)}>
                        <Download className="mr-2 h-4 w-4" /> Download
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => { setRenameRow(row); setRenameValue(row.file_name); }}>
                        <Pencil className="mr-2 h-4 w-4" /> Rename
                      </ContextMenuItem>
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>
                          <FolderInput className="mr-2 h-4 w-4" /> Move to folder
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="max-h-72 overflow-y-auto">
                          <ContextMenuItem onClick={() => moveFileToFolder(row.id, null)}>
                            <Folder className="mr-2 h-4 w-4" /> Root
                          </ContextMenuItem>
                          {allFolderOptions.map((f) => (
                            <ContextMenuItem key={f.id} onClick={() => moveFileToFolder(row.id, f.id)}>
                              <Folder className="mr-2 h-4 w-4" /> {f.folder_name}
                            </ContextMenuItem>
                          ))}
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setConfirmDelete(row)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* New folder dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newFolderParent
                ? `New subfolder in "${folderById.get(newFolderParent)?.folder_name}"`
                : "New folder"}
            </DialogTitle>
          </DialogHeader>
          <Input
            autoFocus placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>Cancel</Button>
            <Button onClick={createFolder} disabled={!newFolderName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={!!renameRow} onOpenChange={(o) => !o && setRenameRow(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename file</DialogTitle></DialogHeader>
          <Input
            autoFocus value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && renameFile()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameRow(null)}>Cancel</Button>
            <Button onClick={renameFile} disabled={!renameValue.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
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

      {/* Delete file confirm */}
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

      {/* Delete folder confirm */}
      <AlertDialog open={!!confirmDeleteFolder} onOpenChange={(o) => !o && setConfirmDeleteFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder "{confirmDeleteFolder?.folder_name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              The folder must be empty. Move or delete its files and subfolders first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteFolder && deleteFolder(confirmDeleteFolder)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
