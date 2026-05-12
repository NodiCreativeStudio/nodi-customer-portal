import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";

export async function generateAndUploadCertificate(opts: {
  clientId: string;
  courseId: string;
  clientName: string;
  courseTitle: string;
}): Promise<string | null> {
  const { clientId, courseId, clientName, courseTitle } = opts;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Border
  doc.setDrawColor(24, 95, 165);
  doc.setLineWidth(2);
  doc.rect(10, 10, w - 20, h - 20);
  doc.setLineWidth(0.4);
  doc.rect(14, 14, w - 28, h - 28);

  // Title
  doc.setTextColor(24, 95, 165);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("NODI ACADEMY", w / 2, 30, { align: "center" });

  doc.setFontSize(34);
  doc.text("Certificato di Completamento", w / 2, 55, { align: "center" });

  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("Si certifica che", w / 2, 80, { align: "center" });

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(clientName, w / 2, 100, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text("ha completato con successo il corso", w / 2, 118, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(24, 95, 165);
  doc.text(courseTitle, w / 2, 135, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  const date = new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
  doc.text(`Rilasciato in data ${date}`, w / 2, 165, { align: "center" });

  // Signature
  doc.setDrawColor(120, 120, 120);
  doc.line(w / 2 - 40, h - 35, w / 2 + 40, h - 35);
  doc.setFontSize(11);
  doc.text("Marco · Nodi", w / 2, h - 28, { align: "center" });

  const blob = doc.output("blob");
  const path = `certificates/${clientId}/${courseId}.pdf`;
  const { error } = await supabase.storage.from("academy-lessons").upload(path, blob, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) {
    console.error("certificate upload failed", error);
    return null;
  }
  await supabase.from("academy_course_completion").upsert(
    {
      client_id: clientId,
      course_id: courseId,
      completed_at: new Date().toISOString(),
      certificate_path: path,
      certificate_generated_at: new Date().toISOString(),
    },
    { onConflict: "client_id,course_id" }
  );
  return path;
}

export async function getCertificateUrl(path: string) {
  const { data } = await supabase.storage.from("academy-lessons").createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? null;
}
