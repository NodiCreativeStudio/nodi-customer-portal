import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SEPA = new Set(["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IS","IE","IT","LV","LI","LT","LU","MT","MC","NL","NO","PL","PT","RO","SM","SK","SI","ES","SE","CH","GB"]);
function validateIban(input: string) {
  const iban = (input || "").replace(/\s+/g, "").toUpperCase();
  if (iban.length < 15 || iban.length > 34) return { valid: false, error: "Lunghezza IBAN non valida", iban };
  if (!/^[A-Z]{2}[0-9A-Z]+$/.test(iban)) return { valid: false, error: "Formato IBAN non valido", iban };
  const c = iban.slice(0, 2);
  if (!SEPA.has(c)) return { valid: false, error: `Paese non SEPA: ${c}`, iban };
  const rearr = iban.slice(4) + iban.slice(0, 4);
  const num = rearr.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
  let r = 0;
  for (let i = 0; i < num.length; i++) r = (r * 10 + Number(num[i])) % 97;
  if (r !== 1) return { valid: false, error: "Checksum IBAN non valido", iban };
  return { valid: true, iban, country: c };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return j({ error: "Unauthorized" }, 401);
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: claims } = await supa.auth.getClaims(auth.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return j({ error: "Unauthorized" }, 401);

    const { iban, account_holder_name, mandate_accepted } = await req.json();
    if (!mandate_accepted) return j({ error: "Mandato SEPA richiesto" }, 400);
    if (!account_holder_name || account_holder_name.trim().length < 3) return j({ error: "Nome titolare non valido" }, 400);
    const v = validateIban(iban || "");
    if (!v.valid) return j({ error: v.error }, 400);

    const { data: profile } = await supa.from("profiles").select("company_id").eq("id", claims.claims.sub).maybeSingle();
    const clientId = profile?.company_id;
    if (!clientId) return j({ error: "Cliente non trovato" }, 400);

    const last4 = v.iban!.slice(-4);

    // Mark previous default as not default
    await supa.from("payment_methods").update({ is_default: false }).eq("client_id", clientId).eq("is_default", true);
    // Insert new default
    await supa.from("payment_methods").insert({
      client_id: clientId, type: "sepa_debit", iban_country: v.country, iban_last_4: last4,
      account_holder_name, is_default: true, mandate_status: "accepted",
    });
    await supa.from("subscriptions").update({ iban_last_4: last4 }).eq("client_id", clientId);

    // TODO: [Stripe] Update payment method on Stripe subscription
    return j({ success: true, iban_last_4: last4 });
  } catch (e) {
    return j({ error: e instanceof Error ? e.message : "Errore" }, 500);
  }
});
function j(b: unknown, s = 200) { return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
