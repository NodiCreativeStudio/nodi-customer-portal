// Stripe webhook receiver (STUB).
// Phase 1: logs every incoming event to webhooks_log. No signature verification yet.
// Phase 2: enable signature verification with STRIPE_WEBHOOK_SECRET and process events.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "stripe-signature, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const raw = await req.text();
  // const sig = req.headers.get("stripe-signature");
  // TODO: [Stripe] Verify signature with STRIPE_WEBHOOK_SECRET (HMAC SHA-256)

  let event: any = null;
  try { event = JSON.parse(raw); } catch { /* ignore */ }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  await admin.from("webhooks_log").insert({
    stripe_event_id: event?.id ?? null,
    event_type: event?.type ?? "unknown",
    event_data: event ?? { raw_body: raw.slice(0, 4000) },
    processed: false,
  });

  // TODO: [Stripe] Handle charge.succeeded / charge.failed / invoice.* / customer.subscription.updated
  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
