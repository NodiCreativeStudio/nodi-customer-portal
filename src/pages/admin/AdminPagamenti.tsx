import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, TrendingUp, CheckCircle2, XCircle, Download } from "lucide-react";
import { downloadCsv } from "@/lib/csv-export";

const STATUS_LABEL: Record<string, string> = {
  active: "Attivo", incomplete: "Da completare", past_due: "Sospeso", cancelled: "Cancellato",
};

function fmtEur(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}
function fmtDate(d?: string | null) {
  return d ? new Date(d).toLocaleDateString("it-IT") : "—";
}

export default function AdminPagamenti() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*, clients:client_id(company_name)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("*, clients:client_id(company_name)")
        .order("created_at", { ascending: false })
        .limit(500);
      return data ?? [];
    },
  });

  const filteredSubs = useMemo(() =>
    statusFilter === "all" ? subscriptions : subscriptions.filter((s: any) => s.subscription_status === statusFilter),
    [subscriptions, statusFilter]
  );

  const kpi = useMemo(() => {
    const succeeded = payments.filter((p: any) => p.status === "succeeded");
    const failed = payments.filter((p: any) => p.status === "failed");
    const revenue = succeeded.reduce((s: number, p: any) => s + Number(p.amount), 0);
    const active = subscriptions.filter((s: any) => s.subscription_status === "active").length;
    return {
      revenue, active, total: subscriptions.length,
      okCount: succeeded.length, failedCount: failed.length,
    };
  }, [payments, subscriptions]);

  const failures = payments.filter((p: any) => p.status === "failed");

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ["Data", "Cliente", "Tipo", "Importo", "Stato", "Stripe Payment ID"],
      ...payments.map((p: any) => [
        fmtDate(p.paid_at ?? p.created_at),
        p.clients?.company_name ?? p.client_id,
        p.payment_type,
        Number(p.amount),
        p.status,
        p.stripe_payment_id ?? "",
      ]),
    ];
    downloadCsv(`pagamenti-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="h-7 w-7 text-primary" /> Pagamenti
          </h1>
          <p className="text-muted-foreground">Dashboard abbonamenti SEPA e cronologia pagamenti.</p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4 mr-1" /> Esporta CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Kpi icon={<TrendingUp className="h-5 w-5" />} label="Revenue Totale" value={fmtEur(kpi.revenue)} />
        <Kpi icon={<Wallet className="h-5 w-5" />} label="Clienti attivi" value={`${kpi.active} / ${kpi.total}`} />
        <Kpi icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} label="Pagamenti OK" value={String(kpi.okCount)} />
        <Kpi icon={<XCircle className="h-5 w-5 text-destructive" />} label="Pagamenti falliti" value={String(kpi.failedCount)} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Abbonamenti</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="active">Attivi</SelectItem>
                <SelectItem value="incomplete">Da completare</SelectItem>
                <SelectItem value="past_due">Sospesi</SelectItem>
                <SelectItem value="cancelled">Cancellati</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>IBAN</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Prossimo addebito</TableHead>
                <TableHead>Ultimo pagamento</TableHead>
                <TableHead>Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubs.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell>{s.clients?.company_name ?? s.client_id}</TableCell>
                  <TableCell>{s.iban_last_4 ? `•••• ${s.iban_last_4}` : "—"}</TableCell>
                  <TableCell><Badge variant="outline">{STATUS_LABEL[s.subscription_status] ?? s.subscription_status}</Badge></TableCell>
                  <TableCell>{fmtDate(s.next_billing_date)}</TableCell>
                  <TableCell>{fmtDate(s.last_payment_date)}</TableCell>
                  <TableCell>{fmtEur(Number(s.monthly_fee ?? 400))}</TableCell>
                </TableRow>
              ))}
              {filteredSubs.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nessun abbonamento.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pagamenti falliti</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Importo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Retry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {failures.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{p.clients?.company_name ?? p.client_id}</TableCell>
                  <TableCell>{fmtEur(Number(p.amount))}</TableCell>
                  <TableCell>{fmtDate(p.created_at)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.failure_reason ?? "—"}</TableCell>
                  <TableCell>{p.retry_count ?? 0}</TableCell>
                </TableRow>
              ))}
              {failures.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nessun pagamento fallito.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">{icon}{label}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
