import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Mail, Phone, MessageCircle, CalendarDays, Clock, ShieldAlert,
  ExternalLink, BookOpen, Send, Headphones, User2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const CALENDLY = "https://calendly.com/nodi-consultation";
const WHATSAPP = "https://wa.me/393000000000";
const SUPPORT_EMAIL = "support@nodi.it";
const SUPPORT_PHONE = "+39 02 1234 5678";
const EMERGENCY_PHONE = "+39 333 999 0000";

const FAQS = [
  { q: "Come aggiorno le informazioni della mia azienda?", a: "Vai su Onboarding dalla sidebar e modifica il profilo aziendale. Le modifiche vengono salvate automaticamente." },
  { q: "Come integro nuovi servizi?", a: "Visita la pagina Tech Stack e clicca su 'Aggiungi servizio', oppure contatta il tuo consulente per una configurazione guidata." },
  { q: "Cosa è incluso nel mio pacchetto?", a: "Servizi attivi e rinnovi sono elencati nella sezione Tech Stack, con il dettaglio completo dei costi." },
  { q: "Come scarico i miei report?", a: "Tutti i report e gli export disponibili sono nella sezione Download del portale." },
  { q: "Posso esportare i miei dati?", a: "Sì — richiedi un export completo dalla pagina Download oppure contatta il supporto." },
];

const DOCS = [
  { label: "Guida introduttiva", href: "#" },
  { label: "Tutorial sulle funzionalità", href: "#" },
  { label: "Guide alle integrazioni", href: "#" },
  { label: "Privacy policy", href: "#" },
  { label: "Termini di servizio", href: "#" },
];

const feedbackSchema = z.object({
  email: z.string().trim().email("Email non valida").max(255),
  subject: z.string().min(1),
  message: z.string().trim().min(5, "Scrivi almeno 5 caratteri").max(2000),
});

export default function Contacts() {
  const { t } = useTranslation();
  const { user } = useAuth();
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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('contacts.contactSupport')}</h1>
        <p className="text-sm text-muted-foreground">Mettiti in contatto con il team NODI.</p>
      </div>

      {/* Main contact cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary"><User2 className="h-5 w-5" /></div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Il tuo consulente NODI</p>
                <p className="font-semibold">Marco Bianchi</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Consulente di strategia digitale</p>
            <div className="space-y-1.5 text-sm">
              <a href="mailto:marco@nodi.it" className="flex items-center gap-2 hover:text-primary">
                <Mail className="h-4 w-4" />marco@nodi.it
              </a>
              <a href="tel:+393333333333" className="flex items-center gap-2 hover:text-primary">
                <Phone className="h-4 w-4" />+39 333 333 3333
              </a>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
              <Clock className="mr-1 h-3 w-3" />Risposta entro 2h
            </Badge>
            <Button asChild className="w-full">
              <a href={CALENDLY} target="_blank" rel="noreferrer">
                <CalendarDays className="mr-2 h-4 w-4" />Prenota una call
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-secondary/15 p-2.5 text-secondary"><Headphones className="h-5 w-5" /></div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Team di supporto</p>
                <p className="font-semibold">Assistenza generale</p>
              </div>
            </div>
            <div className="space-y-1.5 text-sm">
              <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-2 hover:text-primary">
                <Mail className="h-4 w-4" />{SUPPORT_EMAIL}
              </a>
              <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-primary">
                <Phone className="h-4 w-4" />{SUPPORT_PHONE}
              </a>
            </div>
            <Badge variant="outline">
              <Clock className="mr-1 h-3 w-3" />Entro 24h
            </Badge>
            <Button variant="outline" className="w-full"
              onClick={() => toast.info("La live chat sarà attiva negli orari d'ufficio")}>
              <MessageCircle className="mr-2 h-4 w-4" />Avvia live chat
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2.5 text-destructive"><ShieldAlert className="h-5 w-5" /></div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Supporto urgente</p>
                <p className="font-semibold">Solo problemi critici</p>
              </div>
            </div>
            <a href={`tel:${EMERGENCY_PHONE.replace(/\s/g, "")}`}
              className="flex items-center gap-2 text-sm hover:text-destructive">
              <Phone className="h-4 w-4" />{EMERGENCY_PHONE}
            </a>
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
              Disponibile 24/7
            </Badge>
            <p className="text-xs text-muted-foreground">
              Da usare solo per disservizi in produzione o problemi di sicurezza urgenti.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Communication channels */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Canali di comunicazione</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Channel
            icon={<Mail className="h-5 w-5" />} title="Email" sub={SUPPORT_EMAIL}
            meta="Risposta in 24h" cta="Invia email"
            onClick={() => { window.location.href = `mailto:${SUPPORT_EMAIL}`; toast.success("Email aperta nel client predefinito"); }}
          />
          <Channel
            icon={<Phone className="h-5 w-5" />} title="Telefono" sub={SUPPORT_PHONE}
            meta="Lun–Ven · 9–18" cta="Chiama ora"
            onClick={() => { window.location.href = `tel:${SUPPORT_PHONE.replace(/\s/g, "")}`; }}
          />
          <Channel
            icon={<MessageCircle className="h-5 w-5" />} title="WhatsApp" sub="Chat veloce"
            meta="Negli orari d'ufficio" cta="Apri WhatsApp"
            onClick={() => window.open(WHATSAPP, "_blank")}
          />
          <Channel
            icon={<CalendarDays className="h-5 w-5" />} title="Prenota una call" sub="Slot di 30 min"
            meta="Scegli un orario" cta="Prenota"
            onClick={() => window.open(CALENDLY, "_blank")}
          />
        </div>
      </div>

      {/* FAQ */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold mb-3">Domande frequenti</h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`q-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Knowledge base */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">Knowledge base e documentazione</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {DOCS.map((d) => (
              <a key={d.label} href={d.href} target="_blank" rel="noreferrer"
                className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted transition-colors">
                <span>{d.label}</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feedback form */}
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
          <p className="text-sm">{sub}</p>
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
