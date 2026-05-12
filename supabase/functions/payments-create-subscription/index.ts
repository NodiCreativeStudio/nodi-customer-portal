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
  const country = iban.slice(0, 2);
  if (!SEPA.has(country)) return { valid: false, error: `Paese non SEPA: ${country}`, iban };
  const rearr = iban.slice(4) + iban.slice(0, 4);
  const num = rearr.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let r = 0;
  for (let i = 0; i < num.length; i++) r = (r * 10 + Number(num[i])) % 97;
  if (r !== 1) return { valid: false, error: "Checksum IBAN non valido", iban };
  return { valid: true, iban, country };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims } = await supa.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { iban, account_holder_name, mandate_accepted } = body || {};
    if (!mandate_accepted) return json({ error: "Mandato SEPA richiesto" }, 400);
    if (!account_holder_name || account_holder_name.trim().length < 3 || account_holder_name.length > 70)
      return json({ error: "Nome titolare non valido (3-70 caratteri)" }, 400);

    const v = validateIban(iban || "");
    if (!v.valid) return json({ error: v.error }, 400);

    const { data: profile } = await supa.from("profiles").select("company_id").eq("id", claims.claims.sub).maybeSingle();
    const clientId = profile?.company_id;
    if (!clientId) return json({ error: "Cliente non trovato per questo utente" }, 400);

    const last4 = v.iban!.slice(-4);

    const { data: existing } = await supa
      .from("subscriptions").select("id").eq("client_id", clientId).maybeSingle();

    let subscriptionId = existing?.id as string | undefined;
    if (!subscriptionId) {
      const { data: ins, error } = await supa.from("subscriptions").insert({
        client_id: clientId,
        iban_last_4: last4,
        subscription_status: "incomplete",
        monthly_fee: 400,
        onboarding_fee: 600,
      }).select("id").single();
      if (error) throw error;
      subscriptionId = ins.id;
    } else {
      await supa.from("subscriptions").update({ iban_last_4: last4 }).eq("id", subscriptionId);
    }

    await supa.from("payment_methods").insert({
      client_id: clientId,
      type: "sepa_debit",
      iban_country: v.country,
      iban_last_4: last4,
      account_holder_name,
      is_default: true,
      mandate_status: "accepted",
    });

    await supa.from("payments").insert({
      subscription_id: subscriptionId,
      client_id: clientId,
      amount: 600,
      currency: "EUR",
      payment_type: "onboarding",
      status: "pending",
    });

    return json({ success: true, subscription_id: subscriptionId, iban_last_4: last4, note: "Stripe non configurato: pagamento in pending" });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Errore" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
