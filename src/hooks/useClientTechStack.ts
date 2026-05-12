import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ClientTool {
  id: string;
  name: string;
  website_url: string;
  description_what: string;
  description_do: string;
  description_why: string;
  icon_url: string | null;
}

export function useClientTechStack(clientId: string | null | undefined) {
  const [tools, setTools] = useState<ClientTool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("client_tech_stack")
        .select(
          "id, status, tool:tech_stack_catalog ( id, name, website_url, description_what, description_do, description_why, icon_url )",
        )
        .eq("client_id", clientId)
        .eq("status", "active");
      if (!error && data) {
        setTools(
          (data as any[])
            .map((r) => r.tool)
            .filter(Boolean)
            .map((t) => ({
              id: t.id,
              name: t.name,
              website_url: t.website_url,
              description_what: t.description_what,
              description_do: t.description_do,
              description_why: t.description_why,
              icon_url: t.icon_url,
            })),
        );
      }
      setLoading(false);
    })();
  }, [clientId]);

  return { tools, loading };
}
