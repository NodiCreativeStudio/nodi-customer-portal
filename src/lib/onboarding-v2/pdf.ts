import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Anagrafica, VerticaleConfig } from "./types";

function todayStr() {
  return new Date().toLocaleDateString("it-IT");
}
function nowStr() {
  return new Date().toLocaleString("it-IT");
}
function plus12mStr() {
  const d = new Date();
  d.setMonth(d.getMonth() + 12);
  return d.toLocaleDateString("it-IT");
}

function humanize(v: unknown): string {
  if (v === undefined || v === null || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sì" : "No";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  return String(v);
}

function pageRows(config: VerticaleConfig, pageNum: number, data: Record<string, unknown>): [string, string][] {
  const page = config.pagine.find((p) => p.numero === pageNum);
  if (!page) return [];
  const rows: [string, string][] = [];
  for (const sez of page.sezioni) {
    // section header row (rendered via autoTable head later); push fields
    for (const c of sez.campi) {
      const val = data?.[c.id];
      if (c.tipo === "checkbox") {
        if (val === true) rows.push([`${sez.nome} · ${c.label}`, "Sì"]);
      } else if (val !== undefined && val !== "") {
        rows.push([`${sez.nome} · ${c.label}`, humanize(val)]);
      }
    }
  }
  return rows;
}

function anagraficaRows(a: Anagrafica): [string, string][] {
  return [
    ["Ragione Sociale", a.ragione_sociale],
    ["Insegna", a.insegna],
    ["Partita IVA", a.partita_iva],
    ["SDI", a.sdi],
    ["Indirizzo", `${a.indirizzo}, ${a.cap} ${a.comune} (${a.provincia})`],
    ["Email", a.email],
    ["PEC", a.pec],
    ["Telefono", a.telefono],
    ["Referente", `${a.nome_referente} — ${a.ruolo_referente}`],
    ["Email Referente", a.email_referente],
    ["Telefono Referente", a.telefono_referente],
  ].map(([k, v]) => [k, v || "—"]) as [string, string][];
}

function addSection(doc: jsPDF, title: string, rows: [string, string][], headColor: [number, number, number]) {
  if (!rows.length) rows = [["—", "Nessun dato"]];
  autoTable(doc, {
    head: [[{ content: title, colSpan: 2, styles: { fillColor: headColor, textColor: 255, fontStyle: "bold", fontSize: 12 } }]],
    body: rows,
    startY: (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : 90,
    margin: { left: 40, right: 40 },
    styles: { fontSize: 9, cellPadding: 5, overflow: "linebreak" },
    columnStyles: { 0: { cellWidth: 200, fontStyle: "bold" }, 1: { cellWidth: "auto" } },
    theme: "grid",
  });
}

function addFooter(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Generato da Nodi | ${nowStr()} | Pagina ${i}/${total}`, 40, doc.internal.pageSize.getHeight() - 20);
  }
}

export function generateReportDiagnostico(
  anagrafica: Anagrafica,
  config: VerticaleConfig,
  pagina1: Record<string, unknown>,
  pagina2: Record<string, unknown>,
  pagina3: Record<string, unknown>,
): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const blue: [number, number, number] = [24, 95, 165];
  doc.setFillColor(...blue);
  doc.rect(0, 0, W, 70, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("REPORT DIAGNOSTICO", 40, 35);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${anagrafica.ragione_sociale || "—"} · ${config.nome_verticale} · ${todayStr()}`, 40, 55);
  doc.setTextColor(40);

  addSection(doc, "DATI AZIENDALI", anagraficaRows(anagrafica), blue);
  addSection(doc, "SITUAZIONE ATTUALE", pageRows(config, 1, pagina1), blue);
  addSection(doc, "OBIETTIVI E KPI", pageRows(config, 2, pagina2), blue);
  addSection(doc, "IMPLEMENTAZIONE TECNOLOGICA", pageRows(config, 3, pagina3), blue);
  addFooter(doc);
  return doc;
}

export function generatePercorso12Mesi(
  anagrafica: Anagrafica,
  config: VerticaleConfig,
  pagina1: Record<string, unknown>,
  pagina2: Record<string, unknown>,
  pagina3: Record<string, unknown>,
): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const green: [number, number, number] = [46, 125, 50];
  doc.setFillColor(...green);
  doc.rect(0, 0, W, 70, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("PERCORSO 12 MESI", 40, 35);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${anagrafica.ragione_sociale || "—"} · Inizio ${todayStr()} → Fine ${plus12mStr()}`, 40, 55);
  doc.setTextColor(40);

  addSection(doc, "AZIENDA", [
    ["Ragione Sociale", anagrafica.ragione_sociale || "—"],
    ["Settore", config.nome_verticale],
    ["Referente", `${anagrafica.nome_referente} (${anagrafica.ruolo_referente})`],
  ], green);
  addSection(doc, "SITUAZIONE ATTUALE", pageRows(config, 1, pagina1), green);
  addSection(doc, "PRIORITÀ 90 GIORNI", pageRows(config, 2, pagina2), green);
  addSection(doc, "IMPLEMENTAZIONE TECNOLOGICA", pageRows(config, 3, pagina3), green);
  addSection(doc, "ROADMAP TEMPORALE", [
    ["Fase 1 — Mese 1-3", "Quick win: attivazione strumenti prioritari, raccolta dati, baseline KPI"],
    ["Fase 2 — Mese 4-6", "Ottimizzazione processi, automazioni reminder/recensioni, formazione team"],
    ["Fase 3 — Mese 7-9", "Scalata: campagne marketing, fidelizzazione, dashboard analitica"],
    ["Fase 4 — Mese 10-12", "Consolidamento: review KPI, espansione canali, piano anno successivo"],
  ], green);
  addFooter(doc);
  return doc;
}
