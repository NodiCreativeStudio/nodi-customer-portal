import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Download as DownloadIcon, Save } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { downloadCsv } from "@/lib/csv-export";

export default function AdminConfig() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [faqs, setFaqs] = useState<any[]>([]);
  const [faqOpen, setFaqOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "" });
  const [confirmDelFaq, setConfirmDelFaq] = useState<string | null>(null);

  const [logs, setLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const [c, f, l] = await Promise.all([
      supabase.from("agency_config").select("*").maybeSingle(),
      supabase.from("agency_faqs").select("*").order("sort_order", { ascending: true }),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    if (c.error) toast.error("Failed to load config");
    setConfig(c.data ?? {});
    setFaqs(f.data ?? []);
    setLogs(l.data ?? []);
    setLoading(false);
    setDirty(false);
  };
  useEffect(() => { load(); }, []);

  const updateField = (k: string, v: any) => { setConfig({ ...config, [k]: v }); setDirty(true); };

  const saveConfig = async () => {
    setSaving(true);
    const { error } = await supabase.from("agency_config").update({
      contact_name: config.contact_name,
      contact_email: config.contact_email,
      contact_phone: config.contact_phone,
      whatsapp_link: config.whatsapp_link,
      calendly_link: config.calendly_link,
      business_hours: config.business_hours,
      support_email: config.support_email,
      support_phone: config.support_phone,
      sender_email: config.sender_email,
      send_welcome_email: config.send_welcome_email,
      send_onboarding_reminder: config.send_onboarding_reminder,
      send_monthly_report: config.send_monthly_report,
    }).eq("id", true);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Configuration updated");
    setDirty(false);
    load();
  };

  // FAQ management
  const openFaq = (f: any | null) => {
    setEditingFaq(f);
    setFaqForm(f ? { question: f.question, answer: f.answer } : { question: "", answer: "" });
    setFaqOpen(true);
  };
  const saveFaq = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return toast.error("Question and answer required");
    if (editingFaq) {
      const { error } = await supabase.from("agency_faqs").update(faqForm).eq("id", editingFaq.id);
      if (error) return toast.error(error.message);
      toast.success("FAQ updated");
    } else {
      const maxOrder = faqs.reduce((m, f) => Math.max(m, f.sort_order ?? 0), 0);
      const { error } = await supabase.from("agency_faqs").insert({ ...faqForm, sort_order: maxOrder + 1 });
      if (error) return toast.error(error.message);
      toast.success("FAQ added");
    }
    setFaqOpen(false);
    load();
  };
  const deleteFaq = async () => {
    if (!confirmDelFaq) return;
    const { error } = await supabase.from("agency_faqs").delete().eq("id", confirmDelFaq);
    if (error) return toast.error(error.message);
    toast.success("FAQ deleted");
    setConfirmDelFaq(null);
    load();
  };
  const moveFaq = async (id: string, dir: -1 | 1) => {
    const idx = faqs.findIndex((f) => f.id === id);
    const swap = faqs[idx + dir];
    if (!swap) return;
    const cur = faqs[idx];
    await Promise.all([
      supabase.from("agency_faqs").update({ sort_order: swap.sort_order }).eq("id", cur.id),
      supabase.from("agency_faqs").update({ sort_order: cur.sort_order }).eq("id", swap.id),
    ]);
    load();
  };

  const filteredLogs = logs.filter((l) => logFilter === "all" || l.action === logFilter);
  const exportLogs = () => {
    downloadCsv("system-logs", [
      ["Date", "Action", "Entity", "Label"],
      ...filteredLogs.map((l) => [l.created_at, l.action, l.entity_type, l.label ?? ""]),
    ]);
  };

  if (loading) return (
    <div className="container mx-auto p-8 space-y-4">
      <Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" />
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-[1400px]">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.settings')}</h1>
          <p className="text-muted-foreground">
            {config?.updated_at ? `Last updated ${format(new Date(config.updated_at), "MMM d, yyyy 'at' h:mm a")}` : "Agency configuration"}
          </p>
        </div>
        {dirty && (
          <Button onClick={saveConfig} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />{saving ? "Saving…" : "Save changes"}
          </Button>
        )}
      </header>

      <Tabs defaultValue="contact">
        <TabsList>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* CONTACT */}
        <TabsContent value="contact" className="mt-4">
          <Card><CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Contact name</Label><Input value={config?.contact_name ?? ""} onChange={(e) => updateField("contact_name", e.target.value)} /></div>
            <div><Label>Contact email</Label><Input type="email" value={config?.contact_email ?? ""} onChange={(e) => updateField("contact_email", e.target.value)} /></div>
            <div><Label>Contact phone</Label><Input value={config?.contact_phone ?? ""} onChange={(e) => updateField("contact_phone", e.target.value)} /></div>
            <div><Label>WhatsApp link</Label><Input value={config?.whatsapp_link ?? ""} onChange={(e) => updateField("whatsapp_link", e.target.value)} placeholder="https://wa.me/…" /></div>
            <div><Label>Calendly link</Label><Input value={config?.calendly_link ?? ""} onChange={(e) => updateField("calendly_link", e.target.value)} placeholder="https://calendly.com/…" /></div>
            <div><Label>Business hours</Label><Input value={config?.business_hours ?? ""} onChange={(e) => updateField("business_hours", e.target.value)} placeholder="Mon-Fri 9-18 CET" /></div>
            <div><Label>Support email</Label><Input type="email" value={config?.support_email ?? ""} onChange={(e) => updateField("support_email", e.target.value)} /></div>
            <div><Label>Support phone</Label><Input value={config?.support_phone ?? ""} onChange={(e) => updateField("support_phone", e.target.value)} /></div>
            <div className="md:col-span-2 flex justify-end">
              <Button onClick={saveConfig} disabled={saving || !dirty}><Save className="h-4 w-4 mr-2" />Save</Button>
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* FAQs */}
        <TabsContent value="faqs" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => openFaq(null)}><Plus className="h-4 w-4 mr-2" />Add FAQ</Button>
          </div>
          {faqs.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">No FAQs yet.</CardContent></Card>
          ) : faqs.map((f, i) => (
            <Card key={f.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium">{f.question}</p>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{f.answer}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => moveFaq(f.id, -1)}><ArrowUp className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" disabled={i === faqs.length - 1} onClick={() => moveFaq(f.id, 1)}><ArrowDown className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => openFaq(f)}><Edit2 className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setConfirmDelFaq(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* EMAIL */}
        <TabsContent value="email" className="mt-4">
          <Card><CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <p className="font-medium">Welcome email to new clients</p>
                <p className="text-xs text-muted-foreground">Sent on first signup</p>
              </div>
              <Switch checked={!!config?.send_welcome_email} onCheckedChange={(v) => updateField("send_welcome_email", v)} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <p className="font-medium">Onboarding reminder</p>
                <p className="text-xs text-muted-foreground">After 7 days if not completed</p>
              </div>
              <Switch checked={!!config?.send_onboarding_reminder} onCheckedChange={(v) => updateField("send_onboarding_reminder", v)} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <p className="font-medium">Monthly report to clients</p>
                <p className="text-xs text-muted-foreground">First day of each month</p>
              </div>
              <Switch checked={!!config?.send_monthly_report} onCheckedChange={(v) => updateField("send_monthly_report", v)} />
            </div>
            <div><Label>Sender email address</Label><Input type="email" value={config?.sender_email ?? ""} onChange={(e) => updateField("sender_email", e.target.value)} placeholder="hello@agency.com" /></div>
            <div className="flex justify-end">
              <Button onClick={saveConfig} disabled={saving || !dirty}><Save className="h-4 w-4 mr-2" />Save</Button>
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* LOGS */}
        <TabsContent value="logs" className="mt-4 space-y-3">
          <Card><CardContent className="p-4 flex flex-wrap gap-2 justify-between items-center">
            <div className="flex flex-wrap gap-1">
              {["all", "created", "status_changed", "uploaded", "completed_onboarding"].map((a) => (
                <Button key={a} size="sm" variant={logFilter === a ? "default" : "outline"} onClick={() => setLogFilter(a)}>
                  {a.replace(/_/g, " ")}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={exportLogs}><DownloadIcon className="h-4 w-4 mr-2" />Export</Button>
          </CardContent></Card>
          <Card><CardContent className="p-0">
            {filteredLogs.length === 0 ? (
              <p className="p-12 text-center text-muted-foreground">No logs.</p>
            ) : filteredLogs.map((l) => (
              <div key={l.id} className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 border-b last:border-0 text-sm">
                <span><span className="capitalize font-medium">{l.entity_type}</span> {l.action.replace(/_/g, " ")}{l.label && ` — ${l.label}`}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}</span>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* FAQ dialog */}
      <Dialog open={faqOpen} onOpenChange={setFaqOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingFaq ? "Edit FAQ" : "New FAQ"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Question</Label><Input value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} /></div>
            <div><Label>Answer</Label><Textarea rows={5} value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFaqOpen(false)}>Cancel</Button>
            <Button onClick={saveFaq}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelFaq} onOpenChange={(o) => !o && setConfirmDelFaq(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteFaq} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
