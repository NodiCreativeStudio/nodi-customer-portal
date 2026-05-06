import jsPDF from "jspdf";
import type { OnboardingForm } from "./onboarding-schema";

const verticalLabels: Record<string, string> = {
  online_orders: "Wants online orders",
  loyalty_program: "Wants loyalty program",
  whatsapp_automation: "Wants WhatsApp automation",
  challenges: "Biggest challenges",
  monthly_customers: "Avg. monthly customers",
  sales_channel: "Main sales channel",
  online_booking: "Wants online appointment booking",
  membership: "Wants membership management",
  whatsapp_reminders: "Wants WhatsApp reminders",
  services: "Services offered",
  weekly_bookings: "Avg. weekly bookings",
  service_type: "Primary service type",
  job_tracking: "Wants job tracking",
  customer_notifications: "Wants customer notifications",
  whatsapp_status: "Wants repair status via WhatsApp",
  repairs: "What they repair",
  monthly_repairs: "Avg. monthly repairs",
  repair_category: "Primary repair category",
};

function suggestNextSteps(f: OnboardingForm): string[] {
  const steps: string[] = [];
  const v = f.vertical;
  if (v.whatsapp_automation || v.whatsapp_reminders || v.whatsapp_status)
    steps.push("Schedule WhatsApp Business API setup workshop");
  if (v.online_orders || v.online_booking) steps.push("Plan e-commerce / booking platform integration");
  if (v.loyalty_program || v.membership) steps.push("Design loyalty/membership program structure");
  if (f.timeline?.toLowerCase().includes("immediate")) steps.push("Kick-off call within the next 5 business days");
  if (f.goals.includes("Increase customer engagement"))
    steps.push("Audit existing customer touchpoints and engagement metrics");
  if (steps.length === 0) steps.push("Discovery call with your account manager to align on priorities");
  return steps;
}

export function generateOnboardingPdf(f: OnboardingForm): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  let y = M;

  const ensureSpace = (h: number) => {
    if (y + h > doc.internal.pageSize.getHeight() - M) {
      doc.addPage();
      y = M;
    }
  };

  // Header
  doc.setFillColor(26, 115, 232);
  doc.rect(0, 0, W, 80, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("NODI Onboarding Summary", M, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${f.company_name || "—"} · ${new Date().toLocaleDateString()}`, M, 58);
  y = 110;
  doc.setTextColor(40);

  const section = (title: string) => {
    ensureSpace(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(26, 115, 232);
    doc.text(title, M, y);
    doc.setDrawColor(220);
    doc.line(M, y + 4, W - M, y + 4);
    y += 18;
    doc.setTextColor(40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const row = (label: string, value: string) => {
    const v = value || "—";
    const lines = doc.splitTextToSize(v, W - M - 180);
    const h = Math.max(14, lines.length * 12 + 4);
    ensureSpace(h);
    doc.setFont("helvetica", "bold");
    doc.text(label, M, y);
    doc.setFont("helvetica", "normal");
    doc.text(lines, M + 160, y);
    y += h;
  };

  section("Company Information");
  row("Company name", f.company_name);
  row("Industry", f.industry);
  row("Contact email", f.contact_email);
  row("Contact phone", f.contact_phone);
  row("Website", f.website);
  row("Address", f.address);
  row("Employees", f.employees_range);
  row("VAT / Tax ID", f.vat_id);
  row("Founded", f.founding_year);
  row("Description", f.description);
  row("Preferred contact", f.preferred_contact);
  row("Best time", f.best_time);

  y += 8;
  section(`Vertical Details — ${f.industry || "—"}`);
  Object.entries(f.vertical).forEach(([k, val]) => {
    if (val === undefined || val === "" || val === false) return;
    const label = verticalLabels[k] ?? k;
    const value = typeof val === "boolean" ? "Yes" : String(val);
    row(label, value);
  });

  y += 8;
  section("Goals & Next Steps");
  row("Primary goals", f.goals.join(", "));
  row("Budget", f.budget_range);
  row("Timeline", f.timeline);
  row("Additional requirements", f.additional_requirements);

  y += 8;
  section("Suggested Next Steps");
  suggestNextSteps(f).forEach((s) => {
    const lines = doc.splitTextToSize(`• ${s}`, W - M * 2);
    ensureSpace(lines.length * 12 + 2);
    doc.text(lines, M, y);
    y += lines.length * 12 + 2;
  });

  y += 16;
  section("Need help?");
  doc.text("Contact your NODI account manager or email support@nodi.app", M, y);

  return doc;
}
