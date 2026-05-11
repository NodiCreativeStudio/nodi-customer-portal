import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AgencyConfig {
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_role?: string | null;
  contact_response_time?: string | null;
  whatsapp_link?: string | null;
  calendly_link?: string | null;
  google_calendar_link?: string | null;
  support_email?: string | null;
  support_phone?: string | null;
  business_hours?: string | null;
  agency_name?: string | null;
  agency_tagline?: string | null;
  updated_at?: string | null;
}

export interface AgencyFaq {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export function useAgencyConfig() {
  const [config, setConfig] = useState<AgencyConfig>({});
  const [faqs, setFaqs] = useState<AgencyFaq[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [c, f] = await Promise.all([
        supabase.from("agency_config").select("*").maybeSingle(),
        supabase.from("agency_faqs").select("*").order("sort_order", { ascending: true }),
      ]);
      if (cancelled) return;
      setConfig((c.data as AgencyConfig) ?? {});
      setFaqs((f.data as AgencyFaq[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { config, faqs, loading };
}
