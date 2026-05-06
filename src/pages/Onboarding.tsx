import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Loader2,
  ShoppingBag, Sparkles, Wrench, Save, Download,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  emptyForm, OnboardingForm, employeesOptions, bestTimeOptions,
  budgetOptions, timelineOptions, goalOptions,
  validatePage1, validatePage2, validatePage3, Industry,
} from "@/lib/onboarding-schema";
import { generateOnboardingPdf } from "@/lib/onboarding-pdf";

const TOTAL = 3;

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<OnboardingForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  // Load existing draft
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("onboarding_moduli")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setDraftId(data.id);
        if (data.status === "submitted") {
          setSubmitted(true);
        }
        setForm({
          company_name: data.company_name ?? "",
          industry: (data.industry as Industry) ?? "",
          contact_email: data.contact_email ?? "",
          contact_phone: data.contact_phone ?? "",
          website: data.website ?? "",
          address: data.address ?? "",
          employees_range: data.employees_range ?? "",
          vat_id: data.vat_id ?? "",
          founding_year: data.founding_year ? String(data.founding_year) : "",
          description: data.description ?? "",
          preferred_contact: (data.preferred_contact as any) ?? "",
          best_time: data.best_time ?? "",
          vertical: (data.vertical_data as any) ?? {},
          goals: data.goals ?? [],
          budget_range: data.budget_range ?? "",
          timeline: data.timeline ?? "",
          additional_requirements: data.additional_requirements ?? "",
          agreed_terms: data.agreed_terms ?? false,
        });
      }
    })();
  }, [user]);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, [step]);

  // Auto-save draft (debounced)
  useEffect(() => {
    if (!user || submitted) return;
    const t = setTimeout(async () => {
      const payload = toDbPayload(form, user.id, "draft");
      if (draftId) {
        const { error } = await supabase.from("onboarding_moduli").update(payload).eq("id", draftId);
        if (!error) setSavedAt(new Date());
      } else {
        const { data, error } = await supabase
          .from("onboarding_moduli").insert(payload).select("id").single();
        if (!error && data) {
          setDraftId(data.id);
          setSavedAt(new Date());
        }
      }
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, user, draftId, submitted]);

  const update = <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const updateVertical = (patch: Partial<OnboardingForm["vertical"]>) =>
    setForm((f) => ({ ...f, vertical: { ...f.vertical, ...patch } }));

  const validators = [validatePage1, validatePage2, validatePage3];

  const next = () => {
    const err = validators[step - 1](form);
    if (err) { setError(err); toast.error(err); return; }
    setError(null);
    setStep((s) => Math.min(TOTAL, s + 1));
  };

  const prev = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    const err = validatePage3(form);
    if (err) { setError(err); toast.error(err); return; }
    if (!user) return;
    setBusy(true);
    const payload = toDbPayload(form, user.id, "submitted");
    const result = draftId
      ? await supabase.from("onboarding_moduli").update(payload).eq("id", draftId)
      : await supabase.from("onboarding_moduli").insert(payload);
    setBusy(false);
    if (result.error) { toast.error(result.error.message); return; }
    setSubmitted(true);
    toast.success("Onboarding submitted!");
    const pdf = generateOnboardingPdf(form);
    pdf.save(`NODI-onboarding-${(form.company_name || "summary").replace(/\s+/g, "-")}.pdf`);
    setTimeout(() => navigate("/"), 3000);
  };

  const downloadPdf = () => {
    const pdf = generateOnboardingPdf(form);
    pdf.save(`NODI-onboarding-${(form.company_name || "summary").replace(/\s+/g, "-")}.pdf`);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="shadow-[var(--shadow-elegant)]">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <CardTitle>Onboarding complete</CardTitle>
            <CardDescription>
              Thanks {form.company_name || "—"}, your responses have been saved. Your account manager will be in touch shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={downloadPdf} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Download summary PDF
            </Button>
            <Button onClick={() => navigate("/")}>Go to dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Client Onboarding</h1>
        <p className="text-muted-foreground">Tell us about your business so we can tailor your workspace.</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Step {step} of {TOTAL}</span>
          <span className="text-muted-foreground inline-flex items-center gap-1">
            {savedAt ? (
              <><Save className="h-3 w-3 text-success" /> Draft saved {savedAt.toLocaleTimeString()}</>
            ) : "Auto-saving as you go"}
          </span>
        </div>
        <Progress value={(step / TOTAL) * 100} className="h-2" />
      </div>

      <Card className="shadow-[var(--shadow-elegant)] animate-in fade-in duration-300" key={step}>
        <CardHeader>
          <CardTitle>
            {step === 1 && "Anagrafica — Company information"}
            {step === 2 && "Business vertical details"}
            {step === 3 && "Goals & next steps"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Basic information about your company."}
            {step === 2 && "Tell us what you'd like to enable for your business."}
            {step === 3 && "Help us understand your priorities."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 1 && <Page1 form={form} update={update} firstRef={firstFieldRef} />}
          {step === 2 && <Page2 form={form} updateVertical={updateVertical} />}
          {step === 3 && <Page3 form={form} update={update} />}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={prev} disabled={step === 1 || busy}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                i + 1 === step ? "bg-primary w-6" : "bg-muted",
              )}
            />
          ))}
        </div>
        {step < TOTAL ? (
          <Button onClick={next} disabled={busy}>
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Complete
          </Button>
        )}
      </div>
    </div>
  );
}

function toDbPayload(f: OnboardingForm, userId: string, status: "draft" | "submitted") {
  return {
    user_id: userId,
    status,
    company_name: f.company_name || null,
    industry: f.industry || null,
    contact_email: f.contact_email || null,
    contact_phone: f.contact_phone || null,
    website: f.website || null,
    address: f.address || null,
    employees_range: f.employees_range || null,
    vat_id: f.vat_id || null,
    founding_year: f.founding_year ? Number(f.founding_year) : null,
    description: f.description || null,
    preferred_contact: f.preferred_contact || null,
    best_time: f.best_time || null,
    vertical_data: f.vertical,
    goals: f.goals,
    budget_range: f.budget_range || null,
    timeline: f.timeline || null,
    additional_requirements: f.additional_requirements || null,
    agreed_terms: f.agreed_terms,
    submitted_at: status === "submitted" ? new Date().toISOString() : null,
  };
}

/* ---------------- Page 1 ---------------- */

function Page1({
  form, update, firstRef,
}: {
  form: OnboardingForm;
  update: <K extends keyof OnboardingForm>(k: K, v: OnboardingForm[K]) => void;
  firstRef: React.MutableRefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Company name *" className="sm:col-span-2">
        <Input ref={firstRef} value={form.company_name} onChange={(e) => update("company_name", e.target.value)} />
      </Field>
      <Field label="Industry *">
        <Select value={form.industry} onValueChange={(v) => update("industry", v as Industry)}>
          <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="retail">Retail</SelectItem>
            <SelectItem value="wellness">Wellness</SelectItem>
            <SelectItem value="repair">Repair</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Number of employees *">
        <Select value={form.employees_range} onValueChange={(v) => update("employees_range", v)}>
          <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
          <SelectContent>
            {employeesOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Contact email *">
        <Input type="email" value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)} />
      </Field>
      <Field label="Contact phone *">
        <Input type="tel" value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} />
      </Field>
      <Field label="Website">
        <Input placeholder="https://" value={form.website} onChange={(e) => update("website", e.target.value)} />
      </Field>
      <Field label="VAT / Tax ID">
        <Input value={form.vat_id} onChange={(e) => update("vat_id", e.target.value)} />
      </Field>
      <Field label="Founding year">
        <Input type="number" min={1800} max={new Date().getFullYear()} value={form.founding_year} onChange={(e) => update("founding_year", e.target.value)} />
      </Field>
      <Field label="Best time to contact">
        <Select value={form.best_time} onValueChange={(v) => update("best_time", v)}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            {bestTimeOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Company address" className="sm:col-span-2">
        <Textarea rows={2} value={form.address} onChange={(e) => update("address", e.target.value)} />
      </Field>
      <Field label={`Company description (${form.description.length}/200)`} className="sm:col-span-2">
        <Textarea
          rows={3} maxLength={200}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </Field>
      <Field label="Preferred contact method" className="sm:col-span-2">
        <RadioGroup
          value={form.preferred_contact}
          onValueChange={(v) => update("preferred_contact", v as any)}
          className="flex flex-wrap gap-4"
        >
          {[["email", "Email"], ["phone", "Phone"], ["both", "Both"]].map(([v, l]) => (
            <div key={v} className="flex items-center gap-2">
              <RadioGroupItem id={`pc-${v}`} value={v} />
              <Label htmlFor={`pc-${v}`} className="font-normal cursor-pointer">{l}</Label>
            </div>
          ))}
        </RadioGroup>
      </Field>
    </div>
  );
}

/* ---------------- Page 2 ---------------- */

function Page2({
  form, updateVertical,
}: {
  form: OnboardingForm;
  updateVertical: (patch: Partial<OnboardingForm["vertical"]>) => void;
}) {
  if (!form.industry) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Please go back and select an industry on step 1.</AlertDescription>
      </Alert>
    );
  }

  const v = form.vertical;
  const VerticalCard = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <div className="flex items-center gap-3 rounded-lg border bg-accent/40 p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">Tailored questions for your vertical</p>
      </div>
    </div>
  );

  if (form.industry === "retail") {
    return (
      <div className="space-y-5">
        <VerticalCard icon={ShoppingBag} title="Retail" />
        <CheckboxRow id="online_orders" label="I want to accept orders online" checked={!!v.online_orders} onChange={(c) => updateVertical({ online_orders: c })} />
        <CheckboxRow id="loyalty_program" label="I want to use a loyalty program" checked={!!v.loyalty_program} onChange={(c) => updateVertical({ loyalty_program: c })} />
        <CheckboxRow id="whatsapp_automation" label="I want WhatsApp automation" checked={!!v.whatsapp_automation} onChange={(c) => updateVertical({ whatsapp_automation: c })} />
        <Field label={`Biggest challenges (${(v.challenges ?? "").length}/200)`}>
          <Textarea rows={3} maxLength={200} value={v.challenges ?? ""} onChange={(e) => updateVertical({ challenges: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Average monthly customers">
            <Input type="number" value={v.monthly_customers ?? ""} onChange={(e) => updateVertical({ monthly_customers: e.target.value })} />
          </Field>
          <Field label="Main sales channel">
            <Select value={v.sales_channel ?? ""} onValueChange={(val) => updateVertical({ sales_channel: val })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="In-store">In-store</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="Both">Both</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>
    );
  }

  if (form.industry === "wellness") {
    return (
      <div className="space-y-5">
        <VerticalCard icon={Sparkles} title="Wellness" />
        <CheckboxRow id="online_booking" label="I want online appointment booking" checked={!!v.online_booking} onChange={(c) => updateVertical({ online_booking: c })} />
        <CheckboxRow id="membership" label="I want membership management" checked={!!v.membership} onChange={(c) => updateVertical({ membership: c })} />
        <CheckboxRow id="whatsapp_reminders" label="I want WhatsApp reminders" checked={!!v.whatsapp_reminders} onChange={(c) => updateVertical({ whatsapp_reminders: c })} />
        <Field label={`Services offered (${(v.services ?? "").length}/200)`}>
          <Textarea rows={3} maxLength={200} value={v.services ?? ""} onChange={(e) => updateVertical({ services: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Average weekly bookings">
            <Input type="number" value={v.weekly_bookings ?? ""} onChange={(e) => updateVertical({ weekly_bookings: e.target.value })} />
          </Field>
          <Field label="Primary service type">
            <Select value={v.service_type ?? ""} onValueChange={(val) => updateVertical({ service_type: val })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {["Fitness", "Spa", "Medical", "Other"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>
    );
  }

  // repair
  return (
    <div className="space-y-5">
      <VerticalCard icon={Wrench} title="Repair" />
      <CheckboxRow id="job_tracking" label="I want a job tracking system" checked={!!v.job_tracking} onChange={(c) => updateVertical({ job_tracking: c })} />
      <CheckboxRow id="customer_notifications" label="I want customer notifications" checked={!!v.customer_notifications} onChange={(c) => updateVertical({ customer_notifications: c })} />
      <CheckboxRow id="whatsapp_status" label="I want repair status updates via WhatsApp" checked={!!v.whatsapp_status} onChange={(c) => updateVertical({ whatsapp_status: c })} />
      <Field label={`What do you repair? (${(v.repairs ?? "").length}/200)`}>
        <Textarea rows={3} maxLength={200} value={v.repairs ?? ""} onChange={(e) => updateVertical({ repairs: e.target.value })} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Average monthly repairs">
          <Input type="number" value={v.monthly_repairs ?? ""} onChange={(e) => updateVertical({ monthly_repairs: e.target.value })} />
        </Field>
        <Field label="Primary repair category">
          <Select value={v.repair_category ?? ""} onValueChange={(val) => updateVertical({ repair_category: val })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {["Electronics", "Automotive", "Home", "Other"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
}

/* ---------------- Page 3 ---------------- */

function Page3({
  form, update,
}: {
  form: OnboardingForm;
  update: <K extends keyof OnboardingForm>(k: K, v: OnboardingForm[K]) => void;
}) {
  const toggleGoal = (g: string, checked: boolean) => {
    update("goals", checked ? [...form.goals, g] : form.goals.filter((x) => x !== g));
  };

  return (
    <div className="space-y-5">
      <Field label="Primary goals * (select all that apply)">
        <div className="grid gap-2 sm:grid-cols-2">
          {goalOptions.map((g) => (
            <label key={g} className="flex items-center gap-2 rounded-md border p-2.5 cursor-pointer hover:bg-accent transition-colors">
              <Checkbox checked={form.goals.includes(g)} onCheckedChange={(c) => toggleGoal(g, !!c)} />
              <span className="text-sm">{g}</span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="Budget range *">
        <RadioGroup value={form.budget_range} onValueChange={(v) => update("budget_range", v)} className="grid gap-2 sm:grid-cols-2">
          {budgetOptions.map((b) => (
            <label key={b} className="flex items-center gap-2 rounded-md border p-2.5 cursor-pointer hover:bg-accent transition-colors">
              <RadioGroupItem value={b} />
              <span className="text-sm">{b}</span>
            </label>
          ))}
        </RadioGroup>
      </Field>

      <Field label="Timeline *">
        <Select value={form.timeline} onValueChange={(v) => update("timeline", v)}>
          <SelectTrigger><SelectValue placeholder="Select timeline" /></SelectTrigger>
          <SelectContent>
            {timelineOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <Field label={`Additional requirements (${form.additional_requirements.length}/300)`}>
        <Textarea
          rows={3} maxLength={300}
          placeholder="Any other features or integrations you need?"
          value={form.additional_requirements}
          onChange={(e) => update("additional_requirements", e.target.value)}
        />
      </Field>

      <label className="flex items-start gap-2 cursor-pointer">
        <Checkbox className="mt-0.5" checked={form.agreed_terms} onCheckedChange={(c) => update("agreed_terms", !!c)} />
        <span className="text-sm leading-snug">
          I agree to the{" "}
          <a href="#" className="text-primary hover:underline">NODI Service Agreement</a>{" "}
          and{" "}
          <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
        </span>
      </label>
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function CheckboxRow({
  id, label, checked, onChange,
}: {
  id: string; label: string; checked: boolean; onChange: (c: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent transition-colors">
      <Checkbox id={id} checked={checked} onCheckedChange={(c) => onChange(!!c)} />
      <span className="text-sm">{label}</span>
    </label>
  );
}
