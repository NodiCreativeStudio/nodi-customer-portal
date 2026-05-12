import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return j({ error: "Unauthorized" }, 401);
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: claims } = await supa.auth.getClaims(auth.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return j({ error: "Unauthorized" }, 401);

    const { reason, feedback } = await req.json().catch(() => ({}));

    const { data: profile } = await supa.from("profiles").select("company_id").eq("id", claims.claims.sub).maybeSingle();
    const clientId = profile?.company_id;
    if (!clientId) return j({ error: "Cliente non trovato" }, 400);

    const reasonText = [reason, feedback].filter(Boolean).join(" — ") || null;

    const { error } = await supa.from("subscriptions").update({
      subscription_status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reasonText,
    }).eq("client_id", clientId);
    if (error) throw error;

    // TODO: [Stripe] Cancel Stripe subscription
    return j({ success: true, cancelled_at: new Date().toISOString() });
  } catch (e) {
    return j({ error: e instanceof Error ? e.message : "Errore" }, 500);
  }
});
function j(b: unknown, s = 200) { return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
