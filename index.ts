import { withSupabase } from "npm:@supabase/server@^1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeWhatsApp(value: string) {
  return value.trim().replace(/[^\d+]/g, "");
}

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    try {
      const body = await req.json();

      const name = String(body?.name ?? "").trim();
      const whatsappNumber = normalizeWhatsApp(String(body?.whatsappNumber ?? ""));
      const consent = body?.consent === true;

      if (name.length < 1 || name.length > 100) {
        return json({ error: "Please enter a valid name." }, 400);
      }

      if (!/^\+?\d{7,15}$/.test(whatsappNumber)) {
        return json({ error: "Please enter a valid WhatsApp number with country code." }, 400);
      }

      if (!consent) {
        return json({ error: "Consent is required to subscribe." }, 400);
      }

      const { data: existing, error: lookupError } = await ctx.supabaseAdmin
        .from("subscribers")
        .select("id,status")
        .eq("whatsapp_number", whatsappNumber)
        .maybeSingle();

      if (lookupError) {
        console.error(lookupError);
        return json({ error: "Unable to check subscription." }, 500);
      }

      if (existing?.status === "active") {
        return json({ ok: true, message: "This WhatsApp number is already subscribed." });
      }

      if (existing?.id) {
        const { error } = await ctx.supabaseAdmin
          .from("subscribers")
          .update({
            name,
            consent: true,
            status: "active",
            subscribed_at: new Date().toISOString(),
            unsubscribed_at: null,
          })
          .eq("id", existing.id);

        if (error) {
          console.error(error);
          return json({ error: "Unable to reactivate subscription." }, 500);
        }
      } else {
        const { error } = await ctx.supabaseAdmin
          .from("subscribers")
          .insert({
            name,
            whatsapp_number: whatsappNumber,
            consent: true,
            status: "active",
          });

        if (error) {
          console.error(error);
          return json({ error: "Unable to save subscription." }, 500);
        }
      }

      return json({ ok: true, message: "Subscription saved successfully." });
    } catch (error) {
      console.error(error);
      return json({ error: "Invalid request." }, 400);
    }
  }),
};
