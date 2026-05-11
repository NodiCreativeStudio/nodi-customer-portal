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
import { it as itLocale, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { downloadCsv } from "@/lib/csv-export";

export default function AdminConfig() {
  const { t, i18n } = useTranslation();
  const dfLocale = i18n.language?.startsWith("it") ? itLocale : enUS;
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
    if (c.error) toast.error(t("admin.loadConfigFailed"));
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
      contact_role: config.contact_role,
      contact_response_time: config.contact_response_time,
      whatsapp_link: config.whatsapp_link,
      calendly_link: config.calendly_link,
      google_calendar_link: config.google_calendar_link,
      business_hours: config.business_hours,
      support_email: config.support_email,
      support_phone: config.support_phone,
      sender_email: config.sender_email,
      agency_name: config.agency_name,
      agency_tagline: config.agency_tagline,
      send_welcome_email: config.send_welcome_email,
      send_onboarding_reminder: config.send_onboarding_reminder,
      send_monthly_report: config.send_monthly_report,
    }).eq("id", true);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("admin.configUpdated"));
    setDirty(false);
    load();
  };

  const openFaq = (f: any | null) => {
    setEditingFaq(f);
    setFaqForm(f ? { question: f.question, answer: f.answer } : { question: "", answer: "" });
    setFaqOpen(true);
  };
  const saveFaq = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return toast.error(t("admin.config.qaRequired"));
    if (editingFaq) {
      const { error } = await supabase.from("agency_faqs").update(faqForm).eq("id", editingFaq.id);
      if (error) return toast.error(error.message);
      toast.success(t("admin.config.faqUpdated"));
    } else {
      const maxOrder = faqs.reduce((m, f) => Math.max(m, f.sort_order ?? 0), 0);
      const { error } = await supabase.from("agency_faqs").insert({ ...faqForm, sort_order: maxOrder + 1 });
      if (error) return toast.error(error.message);
      toast.success(t("admin.config.faqAdded"));
    }
    setFaqOpen(false);
    load();
  };
  const deleteFaq = async () => {
    if (!confirmDelFaq) return;
    const { error } = await supabase.from("agency_faqs").delete().eq("id", confirmDelFaq);
    if (error) return toast.error(error.message);
    toast.success(t("admin.config.faqDeleted"));
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

  const logActionLabel = (a: string) => t(`admin.config.logActions.${a}`, a.replace(/_/g, " "));

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
            {config?.updated_at ? `${t("common.lastUpdated")} ${format(new Date(config.updated_at), "PP p", { locale: dfLocale })}` : t("admin.agencyConfig")}
          </p>
        </div>
        {dirty && (
          <Button onClick={saveConfig} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />{saving ? t("common.saving") : t("common.saveChanges")}
          </Button>
        )}
      </header>

      <Tabs defaultValue="contact">
        <TabsList>
          <TabsTrigger value="contact">{t("admin.tabs.contact")}</TabsTrigger>
          <TabsTrigger value="faqs">{t("admin.tabs.faqs")}</TabsTrigger>
          <TabsTrigger value="email">{t("admin.tabs.email")}</TabsTrigger>
          <TabsTrigger value="logs">{t("admin.tabs.logs")}</TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="mt-4">
          <Card><CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>{t("admin.config.contactName")}</Label><Input value={config?.contact_name ?? ""} onChange={(e) => updateField("contact_name", e.target.value)} /></div>
            <div><Label>{t("admin.config.contactEmail")}</Label><Input type="email" value={config?.contact_email ?? ""} onChange={(e) => updateField("contact_email", e.target.value)} /></div>
            <div><Label>{t("admin.config.contactPhone")}</Label><Input value={config?.contact_phone ?? ""} onChange={(e) => updateField("contact_phone", e.target.value)} /></div>
            <div><Label>{t("admin.config.whatsappLink")}</Label><Input value={config?.whatsapp_link ?? ""} onChange={(e) => updateField("whatsapp_link", e.target.value)} placeholder="https://wa.me/…" /></div>
            <div><Label>{t("admin.config.calendlyLink")}</Label><Input value={config?.calendly_link ?? ""} onChange={(e) => updateField("calendly_link", e.target.value)} placeholder="https://calendly.com/…" /></div>
            <div><Label>{t("admin.config.businessHours")}</Label><Input value={config?.business_hours ?? ""} onChange={(e) => updateField("business_hours", e.target.value)} placeholder="Lun-Ven 9-18 CET" /></div>
            <div><Label>{t("admin.config.supportEmail")}</Label><Input type="email" value={config?.support_email ?? ""} onChange={(e) => updateField("support_email", e.target.value)} /></div>
            <div><Label>{t("admin.config.supportPhone")}</Label><Input value={config?.support_phone ?? ""} onChange={(e) => updateField("support_phone", e.target.value)} /></div>
            <div className="md:col-span-2 flex justify-end">
              <Button onClick={saveConfig} disabled={saving || !dirty}><Save className="h-4 w-4 mr-2" />{t("common.save")}</Button>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="faqs" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => openFaq(null)}><Plus className="h-4 w-4 mr-2" />{t("admin.config.addFaq")}</Button>
          </div>
          {faqs.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">{t("admin.config.noFaqs")}</CardContent></Card>
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

        <TabsContent value="email" className="mt-4">
          <Card><CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <p className="font-medium">{t("admin.config.welcomeEmail")}</p>
                <p className="text-xs text-muted-foreground">{t("admin.config.welcomeEmailDesc")}</p>
              </div>
              <Switch checked={!!config?.send_welcome_email} onCheckedChange={(v) => updateField("send_welcome_email", v)} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <p className="font-medium">{t("admin.config.onboardingReminder")}</p>
                <p className="text-xs text-muted-foreground">{t("admin.config.onboardingReminderDesc")}</p>
              </div>
              <Switch checked={!!config?.send_onboarding_reminder} onCheckedChange={(v) => updateField("send_onboarding_reminder", v)} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <p className="font-medium">{t("admin.config.monthlyReport")}</p>
                <p className="text-xs text-muted-foreground">{t("admin.config.monthlyReportDesc")}</p>
              </div>
              <Switch checked={!!config?.send_monthly_report} onCheckedChange={(v) => updateField("send_monthly_report", v)} />
            </div>
            <div><Label>{t("admin.config.senderEmail")}</Label><Input type="email" value={config?.sender_email ?? ""} onChange={(e) => updateField("sender_email", e.target.value)} placeholder="hello@agency.com" /></div>
            <div className="flex justify-end">
              <Button onClick={saveConfig} disabled={saving || !dirty}><Save className="h-4 w-4 mr-2" />{t("common.save")}</Button>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4 space-y-3">
          <Card><CardContent className="p-4 flex flex-wrap gap-2 justify-between items-center">
            <div className="flex flex-wrap gap-1">
              {["all", "created", "status_changed", "uploaded", "completed_onboarding"].map((a) => (
                <Button key={a} size="sm" variant={logFilter === a ? "default" : "outline"} onClick={() => setLogFilter(a)}>
                  {logActionLabel(a)}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={exportLogs}><DownloadIcon className="h-4 w-4 mr-2" />{t("common.export")}</Button>
          </CardContent></Card>
          <Card><CardContent className="p-0">
            {filteredLogs.length === 0 ? (
              <p className="p-12 text-center text-muted-foreground">{t("admin.config.noLogs")}</p>
            ) : filteredLogs.map((l) => (
              <div key={l.id} className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 border-b last:border-0 text-sm">
                <span><span className="capitalize font-medium">{l.entity_type}</span> {logActionLabel(l.action)}{l.label && ` — ${l.label}`}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(l.created_at), { addSuffix: true, locale: dfLocale })}</span>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={faqOpen} onOpenChange={setFaqOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingFaq ? t("admin.config.editFaq") : t("admin.config.newFaq")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{t("admin.config.question")}</Label><Input value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} /></div>
            <div><Label>{t("admin.config.answer")}</Label><Textarea rows={5} value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFaqOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={saveFaq}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelFaq} onOpenChange={(o) => !o && setConfirmDelFaq(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.config.deleteFaq")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.config.irreversible")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={deleteFaq} className="bg-destructive text-destructive-foreground">{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
