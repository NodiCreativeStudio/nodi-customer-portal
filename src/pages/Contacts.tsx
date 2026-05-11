import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAgencyConfig } from "@/hooks/useAgencyConfig";
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
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Mail, Phone, MessageCircle, CalendarDays, Clock,
  Send, Headphones, User2, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const feedbackSchema = z.object({
  email: z.string().trim().email("Email non valida").max(255),
  subject: z.string().min(1),
  message: z.string().trim().min(5, "Scrivi almeno 5 caratteri").max(2000),
});

export default function Contacts() {
  const { user } = useAuth();
  const { config, faqs, loading } = useAgencyConfig();
  const [subject, setSubject] = useState("feedback");
  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const parsed = feedbackSchema.safeParse({ email, subject, message });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { e[i.path[0] as string] = i.message; });
      setErrors(e); return;
    }
    setErrors({});
    setSending(true);
    await new Promise((r) => setTimeout(r, 600));
    setSending(false);
    setMessage("");
    toast.success("✓ Grazie per il tuo feedback!");
  };

  if (loading) {
    return (
      <div className="space-y-6 p-2">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-64" /><Skeleton className="h-64" /><Skeleton className="h-64" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const calendarLink = config.google_calendar_link || config.calendly_link || "#";
  const whatsapp = config.whatsapp_link || "#";
  const supportEmail = config.support_email || config.contact_email || "";
  const supportPhone = config.support_phone || config.contact_phone || "";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contatti & Supporto</h1>
        <p className="text-sm text-muted-foreground">
          Mettiti in contatto con il team {config.agency_name ?? "NODI"}
          {config.agency_tagline ? ` — ${config.agency_tagline}` : ""}.
        </p>
      </div>

      {/* Consultant card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Il tuo consulente {config.agency_name ?? "NODI"}</p>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3 text-primary"><User2 className="h-6 w-6" /></div>
                <div>
                  <p className="text-xl font-semibold">{config.contact_name}</p>
                  <p className="text-sm text-muted-foreground">{config.contact_role}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm pt-2">
                {config.contact_email && (
                  <a href={`mailto:${config.contact_email}`} className="flex items-center gap-2 hover:text-primary">
                    <Mail className="h-4 w-4" />{config.contact_email}
                  </a>
                )}
                {config.contact_phone && (
                  <a href={`tel:${config.contact_phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-primary">
                    <Phone className="h-4 w-4" />{config.contact_phone}
                  </a>
                )}
                {config.contact_response_time && (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30 mt-2">
                    <Clock className="mr-1 h-3 w-3" />{config.contact_response_time}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 min-w-[200px]">
              <Button asChild>
                <a href={calendarLink} target="_blank" rel="noreferrer">
                  <CalendarDays className="mr-2 h-4 w-4" />Prenota Consultazione
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={whatsapp} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Channels */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Channel icon={<Mail className="h-5 w-5" />} title="Email" sub={config.contact_email ?? ""}
          meta={config.contact_response_time ?? ""} cta="Invia email"
          onClick={() => { if (config.contact_email) window.location.href = `mailto:${config.contact_email}`; }}
        />
        <Channel icon={<Phone className="h-5 w-5" />} title="Telefono" sub={config.contact_phone ?? ""}
          meta={config.business_hours ?? ""} cta="Chiama ora"
          onClick={() => { if (config.contact_phone) window.location.href = `tel:${config.contact_phone.replace(/\s/g, "")}`; }}
        />
        <Channel icon={<MessageCircle className="h-5 w-5" />} title="WhatsApp" sub="Chat veloce"
          meta="Risposta rapida" cta="Apri WhatsApp"
          onClick={() => window.open(whatsapp, "_blank")}
        />
        <Channel icon={<CalendarDays className="h-5 w-5" />} title="Prenota una call" sub="Google Calendar"
          meta="Scegli un orario" cta="Prenota"
          onClick={() => window.open(calendarLink, "_blank")}
        />
      </div>

      {/* Support */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4 text-secondary" />
            <h2 className="text-lg font-semibold">Supporto Tecnico</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 text-sm">
            {supportEmail && (
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <a href={`mailto:${supportEmail}`} className="hover:text-primary">{supportEmail}</a>
              </div>
            )}
            {supportPhone && (
              <div>
                <p className="text-xs text-muted-foreground">Telefono</p>
                <a href={`tel:${supportPhone.replace(/\s/g, "")}`} className="hover:text-primary">{supportPhone}</a>
              </div>
            )}
            {config.business_hours && (
              <div>
                <p className="text-xs text-muted-foreground">Orari</p>
                <p>{config.business_hours}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold mb-3">Domande frequenti</h2>
          {faqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna FAQ disponibile.</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f) => (
                <AccordionItem key={f.id} value={f.id}>
                  <AccordionTrigger className="text-left">{f.question}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground whitespace-pre-wrap">{f.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Inviaci un feedback</h2>
            <p className="text-sm text-muted-foreground">Leggiamo ogni messaggio — di solito rispondiamo entro 1 giorno lavorativo.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="La tua email" error={errors.email}>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
            </Field>
            <Field label="Oggetto">
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Segnalazione bug</SelectItem>
                  <SelectItem value="feature">Richiesta funzionalità</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="other">Altro</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Messaggio" error={errors.message}>
            <Textarea rows={5} value={message} maxLength={2000}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Raccontaci cosa ne pensi..." />
          </Field>
          <div className="flex justify-end">
            <Button onClick={submit} disabled={sending}>
              <Send className="mr-2 h-4 w-4" />{sending ? "Invio..." : "Invia feedback"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Channel({ icon, title, sub, meta, cta, onClick }: {
  icon: React.ReactNode; title: string; sub: string; meta: string; cta: string; onClick: () => void;
}) {
  return (
    <Card className="transition-all hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/10 p-2 text-primary">{icon}</div>
          <p className="font-semibold">{title}</p>
        </div>
        <div>
          <p className="text-sm break-all">{sub}</p>
          <p className="text-xs text-muted-foreground">{meta}</p>
        </div>
        <Button size="sm" variant="outline" className="w-full" onClick={onClick}>{cta}</Button>
      </CardContent>
    </Card>
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
