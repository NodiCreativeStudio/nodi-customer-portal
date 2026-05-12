import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { CreditCard, Calendar, Ban, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { validateIban, formatIbanDisplay, normalizeIban } from "@/lib/iban";

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Attivo", variant: "default" },
  incomplete: { label: "Da completare", variant: "secondary" },
  past_due: { label: "Sospeso", variant: "destructive" },
  cancelled: { label: "Cancellato", variant: "outline" },
};

const PAY_STATUS: Record<string, string> = {
  succeeded: "✓ Pagato",
  failed: "❌ Fallito",
  pending: "⏳ In sospeso",
  cancelled: "Annullato",
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtEur(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

export default function Pagamenti() {
  const qc = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*").maybeSingle();
      return data;
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["my-payments"],
    queryFn: async () => {
      const { data } = await supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  const { data: paymentMethod } = useQuery({
    queryKey: ["my-payment-method"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_methods").select("*").eq("is_default", true)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });

  const [openCreate, setOpenCreate] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);

  useEffect(() => {
    if (!isLoading && !subscription) setOpenCreate(true);
  }, [isLoading, subscription]);

  const statusBadge = subscription
    ? STATUS_LABEL[subscription.subscription_status] ?? { label: subscription.subscription_status, variant: "secondary" as const }
    : null;

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ["my-subscription"] });
    qc.invalidateQueries({ queryKey: ["my-payments"] });
    qc.invalidateQueries({ queryKey: ["my-payment-method"] });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-primary" /> Pagamenti e Abbonamento
          </h1>
          <p className="text-muted-foreground">Gestisci il tuo abbonamento mensile e i metodi di pagamento.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Stato Abbonamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!subscription ? (
                <>
                  <p className="text-sm text-muted-foreground">Nessun abbonamento attivo.</p>
                  <Button onClick={() => setOpenCreate(true)}>Attiva abbonamento</Button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Stato</span>
                    {statusBadge && <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>}
                  </div>
                  <Row label="Fee mensile" value={fmtEur(Number(subscription.monthly_fee ?? 400))} />
                  <Row label="IBAN" value={subscription.iban_last_4 ? `•••• •••• •••• ${subscription.iban_last_4}` : "—"} />
                  <Row label="Prossimo addebito" value={fmtDate(subscription.next_billing_date)} />
                  <Row label="Attivato il" value={fmtDate(subscription.created_at)} />
                  <div className="pt-2">
                    <Button variant="outline" size="sm" onClick={() => setOpenUpdate(true)}>
                      Cambia metodo pagamento
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metodo di pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!paymentMethod ? (
                <p className="text-sm text-muted-foreground">Nessun metodo configurato.</p>
              ) : (
                <>
                  <Row label="IBAN" value={`•••• •••• •••• ${paymentMethod.iban_last_4 ?? "----"}`} />
                  <Row label="Titolare" value={paymentMethod.account_holder_name ?? "—"} />
                  <Row label="Paese" value={paymentMethod.iban_country ?? "—"} />
                  <Row label="Mandato SEPA" value={paymentMethod.mandate_status === "accepted" ? "Accettato ✓" : paymentMethod.mandate_status} />
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setOpenUpdate(true)}>Cambia IBAN</Button>
                    {subscription && subscription.subscription_status !== "cancelled" && (
                      <Button variant="destructive" size="sm" onClick={() => setOpenCancel(true)}>
                        <Ban className="h-4 w-4 mr-1" /> Cancella abbonamento
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Cronologia pagamenti</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun pagamento registrato.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrizione</TableHead>
                    <TableHead>Importo</TableHead>
                    <TableHead>Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{fmtDate(p.paid_at ?? p.created_at)}</TableCell>
                      <TableCell>{p.payment_type === "onboarding" ? "Onboarding" : "Abbonamento mensile"}</TableCell>
                      <TableCell>{fmtEur(Number(p.amount))}</TableCell>
                      <TableCell>{PAY_STATUS[p.status] ?? p.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <SubscriptionDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        title="Attiva abbonamento — €600 onboarding + €400/mese"
        description="Inserisci i dati SEPA per attivare l'abbonamento. Il pagamento di onboarding (€600) verrà addebitato all'attivazione."
        endpoint="payments-create-subscription"
        onSuccess={refreshAll}
      />

      <SubscriptionDialog
        open={openUpdate}
        onOpenChange={setOpenUpdate}
        title="Cambia metodo di pagamento"
        description="Il nuovo IBAN sarà usato dal prossimo addebito."
        endpoint="payments-update-method"
        onSuccess={refreshAll}
      />

      <CancelDialog open={openCancel} onOpenChange={setOpenCancel} onSuccess={refreshAll} />
    </AppLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function SubscriptionDialog({
  open, onOpenChange, title, description, endpoint, onSuccess,
}: {
  open: boolean; onOpenChange: (b: boolean) => void;
  title: string; description: string;
  endpoint: "payments-create-subscription" | "payments-update-method";
  onSuccess: () => void;
}) {
  const [iban, setIban] = useState("");
  const [holder, setHolder] = useState("");
  const [mandate, setMandate] = useState(false);

  const ibanCheck = useMemo(() => (iban ? validateIban(iban) : null), [iban]);

  const m = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: { iban: normalizeIban(iban), account_holder_name: holder, mandate_accepted: mandate },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      toast.success("Operazione completata. I pagamenti reali partiranno dopo la configurazione Stripe.");
      onOpenChange(false);
      setIban(""); setHolder(""); setMandate(false);
      onSuccess();
    },
    onError: (e: any) => toast.error(e.message ?? "Errore"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>IBAN</Label>
            <Input
              placeholder="IT60 X054 2811 1010 0000 0123 456"
              value={formatIbanDisplay(iban)}
              onChange={(e) => setIban(e.target.value)}
            />
            {iban && ibanCheck && !ibanCheck.valid && (
              <p className="text-xs text-destructive mt-1">{ibanCheck.error}</p>
            )}
            {iban && ibanCheck?.valid && (
              <p className="text-xs text-green-600 mt-1">IBAN valido ✓</p>
            )}
          </div>
          <div>
            <Label>Titolare conto</Label>
            <Input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Mario Rossi" />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={mandate} onCheckedChange={(v) => setMandate(Boolean(v))} className="mt-0.5" />
            <span>
              Accetto il mandato SEPA Direct Debit e autorizzo addebiti ricorrenti sul conto indicato.
            </span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button
            onClick={() => m.mutate()}
            disabled={m.isPending || !ibanCheck?.valid || holder.trim().length < 3 || !mandate}
          >
            {m.isPending && <RefreshCw className="h-4 w-4 mr-1 animate-spin" />}
            Conferma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelDialog({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (b: boolean) => void; onSuccess: () => void }) {
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const m = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("payments-cancel-subscription", {
        body: { reason, feedback },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      toast.success("Abbonamento cancellato.");
      onOpenChange(false);
      onSuccess();
    },
    onError: (e: any) => toast.error(e.message ?? "Errore"),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancella abbonamento</DialogTitle>
          <DialogDescription>Sei sicuro? Non riceverai più accesso ai servizi al termine del periodo corrente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Motivo (opzionale)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Es. Cambiamento esigenze" />
          </div>
          <div>
            <Label>Feedback (opzionale)</Label>
            <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button variant="destructive" onClick={() => m.mutate()} disabled={m.isPending}>
            Sì, cancella
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
