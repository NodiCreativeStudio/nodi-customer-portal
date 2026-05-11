import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, AlertCircle, ShoppingBag, Sparkles, Wrench, Download, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import retailCfg from "@/data/onboarding/retail.json";
import wellnessCfg from "@/data/onboarding/wellness.json";
import repairCfg from "@/data/onboarding/repair.json";
import { Anagrafica, anagraficaFields, emptyAnagrafica, VerticaleConfig, Campo } from "@/lib/onboarding-v2/types";
import { generatePercorso12Mesi, generateReportDiagnostico } from "@/lib/onboarding-v2/pdf";

const CONFIGS: Record<string, VerticaleConfig> = {
  retail: retailCfg as VerticaleConfig,
  wellness: wellnessCfg as VerticaleConfig,
  repair: repairCfg as VerticaleConfig,
};

type Screen = "welcome" | "anagrafica" | "verticale" | "moduli" | "completion";

function humanizeOpzione(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>("welcome");
  const [anagrafica, setAnagrafica] = useState<Anagrafica>(emptyAnagrafica);
  const [verticale, setVerticale] = useState<"retail" | "wellness" | "repair" | null>(null);
  const [moduloIdx, setModuloIdx] = useState(0); // 0..2
  const [dati, setDati] = useState<Record<number, Record<string, unknown>>>({ 1: {}, 2: {}, 3: {} });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);

  const config = verticale ? CONFIGS[verticale] : null;

  // Inject vertical color as CSS var
  useEffect(() => {
    if (config) document.documentElement.style.setProperty("--v-color", config.colore);
    return () => { document.documentElement.style.removeProperty("--v-color"); };
  }, [config]);

  const validateAnagrafica = (): string | null => {
    for (const f of anagraficaFields) {
      if (f.required && !String(anagrafica[f.id] || "").trim()) return `Compila il campo: ${f.label}`;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(anagrafica.email)) return "Email non valida";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(anagrafica.email_referente)) return "Email referente non valida";
    return null;
  };

  const validateModulo = (pageNum: number): string | null => {
    if (!config) return null;
    const page = config.pagine.find((p) => p.numero === pageNum)!;
    const d = dati[pageNum] || {};
    for (const sez of page.sezioni) {
      for (const c of sez.campi) {
        if (!c.obbligatorio) continue;
        const v = d[c.id];
        if (c.tipo === "checkbox") continue; // checkboxes never required visually
        if (v === undefined || v === null || String(v).trim() === "") {
          return `Campo obbligatorio mancante in "${sez.nome}": ${c.label}`;
        }
      }
    }
    return null;
  };

  const updateField = (pageNum: number, id: string, value: unknown) => {
    setDati((prev) => ({ ...prev, [pageNum]: { ...prev[pageNum], [id]: value } }));
  };

  const handleSelectVerticale = (v: "retail" | "wellness" | "repair") => {
    setVerticale(v);
    setModuloIdx(0);
    setScreen("moduli");
  };

  const handleNextModulo = () => {
    const pageNum = moduloIdx + 1;
    const err = validateModulo(pageNum);
    if (err) { setError(err); return; }
    setError(null);
    if (moduloIdx < 2) {
      setModuloIdx(moduloIdx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      void handleComplete();
    }
  };

  const handlePrevModulo = () => {
    setError(null);
    if (moduloIdx > 0) setModuloIdx(moduloIdx - 1);
  };

  const handleComplete = async () => {
    if (!user || !verticale) return;
    setBusy(true);
    setError(null);
    try {
      const payload = {
        user_id: user.id,
        ragione_sociale: anagrafica.ragione_sociale,
        anagrafica: anagrafica as unknown as Record<string, unknown>,
        verticale,
        pagina_1_dati: dati[1] || {},
        pagina_2_dati: dati[2] || {},
        pagina_3_dati: dati[3] || {},
        status: "completed" as const,
        submitted_at: new Date().toISOString(),
        completato_il: new Date().toISOString(),
        // Compat with old schema
        company_name: anagrafica.ragione_sociale,
        contact_email: anagrafica.email,
        contact_phone: anagrafica.telefono,
        address: anagrafica.indirizzo,
        agreed_terms: true,
        goals: [],
        vertical_data: { ...dati[1], ...dati[2], ...dati[3] },
      };
      const { data, error } = await supabase
        .from("onboarding_moduli")
        .insert(payload as any)
        .select("id")
        .single();
      if (error) throw error;
      setRecordId(data.id);
      await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
      setScreen("completion");
      toast.success("Onboarding completato!");
    } catch (e: any) {
      setError(e.message || "Errore durante il salvataggio");
    } finally {
      setBusy(false);
    }
  };

  const downloadReport = () => {
    if (!config) return;
    const doc = generateReportDiagnostico(anagrafica, config, dati[1], dati[2], dati[3]);
    doc.save(`Nodi_Report_Diagnostico_${anagrafica.ragione_sociale || "azienda"}.pdf`);
  };
  const downloadPercorso = () => {
    if (!config) return;
    const doc = generatePercorso12Mesi(anagrafica, config, dati[1], dati[2], dati[3]);
    doc.save(`Nodi_Percorso_12_Mesi_${anagrafica.ragione_sociale || "azienda"}.pdf`);
  };

  // ---- Renderers ----
  if (screen === "welcome") {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <Card>
          <CardHeader className="text-center">
            <div className="text-6xl mb-2">🎯</div>
            <CardTitle className="text-3xl">Benvenuto in Nodi</CardTitle>
            <CardDescription className="text-base mt-3">
              Questo percorso ti guiderà attraverso un'analisi completa della tua attività,
              aiutandoti a identificare le opportunità di crescita nei prossimi 90 giorni.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="text-muted-foreground">⏱️ Tempo stimato: 2-3 ore</div>
            <Button size="lg" onClick={() => setScreen("anagrafica")}>
              Inizia Subito <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (screen === "anagrafica") {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Anagrafica Aziendale</CardTitle>
            <CardDescription>I campi con * sono obbligatori</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {anagraficaFields.map((f) => (
                <div key={f.id} className="space-y-1.5">
                  <Label htmlFor={f.id}>{f.label}{f.required && " *"}</Label>
                  <Input
                    id={f.id}
                    type={f.type || "text"}
                    value={anagrafica[f.id]}
                    onChange={(e) => setAnagrafica({ ...anagrafica, [f.id]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setScreen("welcome")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Indietro
              </Button>
              <Button onClick={() => {
                const err = validateAnagrafica();
                if (err) { setError(err); return; }
                setError(null);
                setScreen("verticale");
              }}>
                Continua <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (screen === "verticale") {
    const cards = [
      { id: "retail" as const, emoji: "🛍️", title: "Retail Specialistico", desc: "Boutique, gioiellerie, profumerie, negozi regalo", color: "#855F0B", Icon: ShoppingBag },
      { id: "wellness" as const, emoji: "💆", title: "Wellness", desc: "Saloni, Barber, Spa, Centri estetici", color: "#0F6E56", Icon: Sparkles },
      { id: "repair" as const, emoji: "🔧", title: "Repair", desc: "Centri assistenza smartphone, tablet, PC", color: "#BA2625", Icon: Wrench },
    ];
    return (
      <div className="mx-auto max-w-5xl py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Scegli la tua verticale</h1>
          <p className="text-muted-foreground">Caricheremo le domande specifiche per il tuo settore</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelectVerticale(c.id)}
              className="text-left rounded-2xl border-2 border-border/50 p-6 transition-all hover:scale-[1.03] hover:shadow-xl bg-card/60 backdrop-blur-md"
              style={{ borderColor: `${c.color}40` }}
            >
              <div className="text-5xl mb-3">{c.emoji}</div>
              <div className="text-xl font-bold mb-1" style={{ color: c.color }}>{c.title}</div>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
            </button>
          ))}
        </div>
        <div className="mt-6">
          <Button variant="outline" onClick={() => setScreen("anagrafica")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Indietro
          </Button>
        </div>
      </div>
    );
  }

  if (screen === "moduli" && config) {
    const pageNum = moduloIdx + 1;
    const page = config.pagine.find((p) => p.numero === pageNum)!;
    const progress = ((moduloIdx + 1) / 3) * 100;
    const color = config.colore;

    return (
      <div className="mx-auto max-w-4xl py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium" style={{ color }}>
              Modulo {pageNum} di 3 — {page.titolo}
            </div>
            <div className="text-sm text-muted-foreground">{Math.round(progress)}%</div>
          </div>
          <Progress value={progress} className="h-2" style={{ ["--v-color" as any]: color }} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle style={{ color }}>{page.titolo}</CardTitle>
            <CardDescription>{config.nome_verticale}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {error && (
              <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>
            )}
            {page.sezioni.map((sez) => (
              <section key={sez.id} className="space-y-4">
                <h3 className="text-lg font-semibold pb-2 border-b" style={{ borderColor: `${color}40`, color }}>
                  {sez.nome}
                </h3>
                <div className={`grid grid-cols-1 ${sez.campi.some(c => c.tipo === "checkbox") ? "md:grid-cols-2" : ""} gap-4`}>
                  {sez.campi.map((c) => (
                    <FieldRenderer
                      key={c.id}
                      campo={c}
                      value={dati[pageNum]?.[c.id]}
                      onChange={(v) => updateField(pageNum, c.id, v)}
                    />
                  ))}
                </div>
              </section>
            ))}

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handlePrevModulo} disabled={moduloIdx === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Indietro
              </Button>
              <Button onClick={handleNextModulo} disabled={busy} style={{ backgroundColor: color }}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {moduloIdx < 2 ? <>Avanti <ArrowRight className="ml-2 h-4 w-4" /></> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Completa</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (screen === "completion") {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <Card>
          <CardHeader className="text-center">
            <div className="text-7xl mb-3">✅</div>
            <CardTitle className="text-3xl">Onboarding Completato!</CardTitle>
            <CardDescription className="text-base mt-3">
              Grazie {anagrafica.ragione_sociale}. Abbiamo ricevuto tutti i tuoi dati e siamo pronti per partire.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-700 dark:text-emerald-300 text-sm">
              ✓ Dati salvati correttamente nel sistema Nodi
            </div>
            <div className="space-y-3">
              <div className="font-semibold">Scarica i tuoi documenti:</div>
              <Button variant="outline" className="w-full justify-start" onClick={downloadReport}>
                <Download className="mr-2 h-4 w-4" /> 📊 Report Diagnostico Completo
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={downloadPercorso}>
                <Download className="mr-2 h-4 w-4" /> 🎯 Percorso 12 mesi Completo
              </Button>
            </div>
            <Button className="w-full" onClick={() => navigate("/")}>Torna al Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

function FieldRenderer({ campo, value, onChange }: { campo: Campo; value: unknown; onChange: (v: unknown) => void }) {
  const req = campo.obbligatorio ? " *" : "";
  if (campo.tipo === "checkbox") {
    return (
      <label className="flex items-center gap-2 rounded-lg border border-border/50 p-3 cursor-pointer hover:bg-muted/40">
        <Checkbox checked={!!value} onCheckedChange={(c) => onChange(c === true)} />
        <span className="text-sm">{campo.label}</span>
      </label>
    );
  }
  return (
    <div className="space-y-1.5">
      <Label htmlFor={campo.id}>{campo.label}{req}</Label>
      {campo.tipo === "textarea" ? (
        <Textarea id={campo.id} rows={campo.rows || 2} value={(value as string) || ""} onChange={(e) => onChange(e.target.value)} />
      ) : campo.tipo === "select" ? (
        <Select value={(value as string) || ""} onValueChange={onChange}>
          <SelectTrigger id={campo.id}><SelectValue placeholder="Seleziona..." /></SelectTrigger>
          <SelectContent>
            {(campo.opzioni || []).map((o) => (
              <SelectItem key={o} value={o}>{humanizeOpzione(o)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={campo.id}
          type={campo.tipo === "number" ? "number" : "text"}
          value={(value as string | number) ?? ""}
          onChange={(e) => onChange(campo.tipo === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
        />
      )}
    </div>
  );
}
