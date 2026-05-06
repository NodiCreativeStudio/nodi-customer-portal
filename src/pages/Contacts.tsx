import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
  { q: "How do I update my company information?", a: "Go to Onboarding from the sidebar and edit your company profile. Changes are saved automatically." },
  { q: "How do I integrate new services?", a: "Visit the Tech Stack page and click 'Add service', or contact your consultant for guided setup." },
  { q: "What's included in my package?", a: "Your active services and renewals are listed in the Tech Stack section, with full cost breakdown." },
  { q: "How do I download my reports?", a: "All available reports and exports live in the Downloads section of the portal." },
  { q: "Can I export my data?", a: "Yes — request a full data export from the Downloads page or contact support." },
];

const DOCS = [
  { label: "Getting started guide", href: "#" },
  { label: "Feature tutorials", href: "#" },
  { label: "Integration guides", href: "#" },
  { label: "Privacy policy", href: "#" },
  { label: "Terms of service", href: "#" },
];

const feedbackSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  subject: z.string().min(1),
  message: z.string().trim().min(5, "Please write at least 5 characters").max(2000),
});

export default function Contacts() {
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
    toast.success("✓ Thank you for your feedback!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contact & Support</h1>
        <p className="text-sm text-muted-foreground">Get in touch with the NODI team.</p>
      </div>

      {/* Main contact cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary"><User2 className="h-5 w-5" /></div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Your NODI Consultant</p>
                <p className="font-semibold">Marco Bianchi</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Digital Strategy Consultant</p>
            <div className="space-y-1.5 text-sm">
              <a href="mailto:marco@nodi.it" className="flex items-center gap-2 hover:text-primary">
                <Mail className="h-4 w-4" />marco@nodi.it
              </a>
              <a href="tel:+393333333333" className="flex items-center gap-2 hover:text-primary">
                <Phone className="h-4 w-4" />+39 333 333 3333
              </a>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
              <Clock className="mr-1 h-3 w-3" />Replies within 2h
            </Badge>
            <Button asChild className="w-full">
              <a href={CALENDLY} target="_blank" rel="noreferrer">
                <CalendarDays className="mr-2 h-4 w-4" />Schedule a call
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-secondary/15 p-2.5 text-secondary"><Headphones className="h-5 w-5" /></div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Support Team</p>
                <p className="font-semibold">General assistance</p>
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
              <Clock className="mr-1 h-3 w-3" />Within 24h
            </Badge>
            <Button variant="outline" className="w-full"
              onClick={() => toast.info("Live chat will open during business hours")}>
              <MessageCircle className="mr-2 h-4 w-4" />Start live chat
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2.5 text-destructive"><ShieldAlert className="h-5 w-5" /></div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Emergency Support</p>
                <p className="font-semibold">Critical issues only</p>
              </div>
            </div>
            <a href={`tel:${EMERGENCY_PHONE.replace(/\s/g, "")}`}
              className="flex items-center gap-2 text-sm hover:text-destructive">
              <Phone className="h-4 w-4" />{EMERGENCY_PHONE}
            </a>
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
              Available 24/7
            </Badge>
            <p className="text-xs text-muted-foreground">
              Use only for production outages or urgent security issues.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Communication channels */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Communication channels</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Channel
            icon={<Mail className="h-5 w-5" />} title="Email" sub={SUPPORT_EMAIL}
            meta="Response in 24h" cta="Send email"
            onClick={() => { window.location.href = `mailto:${SUPPORT_EMAIL}`; toast.success("Email opened in your default client"); }}
          />
          <Channel
            icon={<Phone className="h-5 w-5" />} title="Phone" sub={SUPPORT_PHONE}
            meta="Mon–Fri · 9–18" cta="Call now"
            onClick={() => { window.location.href = `tel:${SUPPORT_PHONE.replace(/\s/g, "")}`; }}
          />
          <Channel
            icon={<MessageCircle className="h-5 w-5" />} title="WhatsApp" sub="Quick chat"
            meta="During business hours" cta="Open WhatsApp"
            onClick={() => window.open(WHATSAPP, "_blank")}
          />
          <Channel
            icon={<CalendarDays className="h-5 w-5" />} title="Book a call" sub="30 min slot"
            meta="Pick a time" cta="Schedule"
            onClick={() => window.open(CALENDLY, "_blank")}
          />
        </div>
      </div>

      {/* FAQ */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold mb-3">Frequently asked questions</h2>
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
            <h2 className="text-lg font-semibold">Knowledge base & documentation</h2>
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
            <h2 className="text-lg font-semibold">Send us your feedback</h2>
            <p className="text-sm text-muted-foreground">We read every message — usually responds within 1 business day.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Your email" error={errors.email}>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
            </Field>
            <Field label="Subject">
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug report</SelectItem>
                  <SelectItem value="feature">Feature request</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Message" error={errors.message}>
            <Textarea rows={5} value={message} maxLength={2000}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's on your mind..." />
          </Field>
          <div className="flex justify-end">
            <Button onClick={submit} disabled={sending}>
              <Send className="mr-2 h-4 w-4" />{sending ? "Sending..." : "Send feedback"}
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
