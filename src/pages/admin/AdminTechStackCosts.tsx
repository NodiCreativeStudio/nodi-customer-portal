import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { downloadCsv } from "@/lib/csv-export";

interface ClientSummary {
  client_id: string;
  client_name: string;
  tools_count: number;
  total_cost_monthly: number;
  total_cost_yearly: number;
}
interface ToolBreakdown {
  tech_stack_id: string;
  tool_name: string;
  tool_website: string;
  clients_using_count: number;
  active_clients_count: number;
  total_cost_monthly: number;
  total_cost_yearly: number;
}
interface Client { id: string; industry: string | null; }

export default function AdminTechStackCosts() {
  const [summary, setSummary] = useState<ClientSummary[]>([]);
  const [breakdown, setBreakdown] = useState<ToolBreakdown[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    (async () => {
      const [s, b, c] = await Promise.all([
        supabase.from("tech_stack_costs_summary").select("*"),
        supabase.from("tech_stack_tool_breakdown").select("*"),
        supabase.from("clients").select("id, industry"),
      ]);
      setSummary((s.data as ClientSummary[]) || []);
      setBreakdown((b.data as ToolBreakdown[]) || []);
      setClients((c.data as Client[]) || []);
    })();
  }, []);

  const totalMonthly = summary.reduce((acc, s) => acc + Number(s.total_cost_monthly || 0), 0);
  const totalYearly = summary.reduce((acc, s) => acc + Number(s.total_cost_yearly || 0), 0);
  const activeTools = breakdown.reduce((acc, b) => acc + Number(b.active_clients_count || 0), 0);

  const industryFor = (id: string) => clients.find((c) => c.id === id)?.industry ?? "—";

  const exportClients = () => {
    downloadCsv("costi-per-cliente", [
      ["Cliente", "Verticale", "Tool attivi", "€/mese", "€/anno", "% sul totale"],
      ...summary.map((s) => [
        s.client_name,
        industryFor(s.client_id),
        s.tools_count,
        Number(s.total_cost_monthly).toFixed(2),
        Number(s.total_cost_yearly).toFixed(2),
        totalMonthly ? ((Number(s.total_cost_monthly) / totalMonthly) * 100).toFixed(1) + "%" : "0%",
      ]),
    ]);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">💰 Dashboard Costi Stack Tecnologico</h1>
        <p className="text-muted-foreground mt-1">
          Visione completa dell'impatto dei costi tech sulla gestione aziendale
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Costo Totale Mensile</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">€ {totalMonthly.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Costo Totale Annuale</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">€ {totalYearly.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Tool Attivi (totale)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{activeTools}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Costi per cliente</CardTitle>
          <Button variant="outline" size="sm" onClick={exportClients}>
            <Download className="h-4 w-4" /> Esporta CSV
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Verticale</TableHead>
                <TableHead>Tool attivi</TableHead>
                <TableHead>€/mese</TableHead>
                <TableHead>€/anno</TableHead>
                <TableHead>% sul totale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.map((s) => (
                <TableRow key={s.client_id}>
                  <TableCell className="font-medium">{s.client_name}</TableCell>
                  <TableCell>{industryFor(s.client_id)}</TableCell>
                  <TableCell>{s.tools_count}</TableCell>
                  <TableCell>€ {Number(s.total_cost_monthly).toFixed(2)}</TableCell>
                  <TableCell>€ {Number(s.total_cost_yearly).toFixed(2)}</TableCell>
                  <TableCell>
                    {totalMonthly ? ((Number(s.total_cost_monthly) / totalMonthly) * 100).toFixed(1) : "0"}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Breakdown per tool</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Clienti attivi</TableHead>
                <TableHead>€/mese totale</TableHead>
                <TableHead>€/anno totale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breakdown.map((b) => (
                <TableRow key={b.tech_stack_id}>
                  <TableCell className="font-medium">{b.tool_name}</TableCell>
                  <TableCell>{b.active_clients_count}</TableCell>
                  <TableCell>€ {Number(b.total_cost_monthly).toFixed(2)}</TableCell>
                  <TableCell>€ {Number(b.total_cost_yearly).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
