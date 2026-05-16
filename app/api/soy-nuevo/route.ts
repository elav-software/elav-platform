import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ── Rate limiting (Upstash) ──────────────────────────────────────────────────
// Para activar: npm install @upstash/ratelimit @upstash/redis
// y agregar UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN al .env
// import { Ratelimit } from "@upstash/ratelimit";
// import { Redis } from "@upstash/redis";
// const ratelimit = new Ratelimit({
//   redis: Redis.fromEnv(),
//   limiter: Ratelimit.slidingWindow(5, "1 h"),
//   analytics: true,
// });
// ────────────────────────────────────────────────────────────────────────────

// Dominios permitidos por slug de iglesia (multi-tenant)
const ALLOWED_ORIGINS: Record<string, string> = {
  cfc: "https://cfccasanova.com",
  // futura-iglesia: "https://futuraIglesia.com",
};

const CORS_HEADERS = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  const allowed = Object.values(ALLOWED_ORIGINS).includes(origin)
    ? origin
    : Object.values(ALLOWED_ORIGINS)[0];
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS(allowed) });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // ── Validar origen (primera línea de defensa) ──────────────────────────
    const origin = req.headers.get("origin") ?? "";
    const body = await req.json();
    const { nombre, telefono, edad, estado_civil, barrio, church_slug, _hp } = body;

    // Honeypot: campo oculto que solo los bots completan
    if (_hp) {
      // Responder 200 para no revelar que fue detectado como bot
      return NextResponse.json({ ok: true });
    }

    const slug = church_slug ?? "cfc";

    // Validar que el origen coincide con la iglesia solicitada
    const expectedOrigin = ALLOWED_ORIGINS[slug];
    if (expectedOrigin && origin && origin !== expectedOrigin) {
      return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
    }

    const corsHeaders = CORS_HEADERS(expectedOrigin ?? origin ?? "*");

    // ── Rate limiting por IP (activar cuando Upstash esté configurado) ────
    // const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    // const { success } = await ratelimit.limit(ip);
    // if (!success) {
    //   return NextResponse.json(
    //     { error: "Demasiadas solicitudes. Intentá de nuevo en una hora." },
    //     { status: 429, headers: corsHeaders }
    //   );
    // }

    if (!nombre || !telefono) {
      return NextResponse.json({ error: "Nombre y teléfono son obligatorios" }, { status: 400, headers: corsHeaders });
    }

    // Resolver church_id por slug — si no existe, rechazar
    const { data: church } = await supabase
      .from("churches")
      .select("id")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (!church?.id) {
      return NextResponse.json({ error: "Iglesia no encontrada" }, { status: 400, headers: corsHeaders });
    }

    const payload: Record<string, unknown> = {
      name: nombre.trim(),
      phone: telefono.trim(),
      follow_up_status: "Pending",
      invited_by: "web:soy-nuevo",
      visit_date: new Date().toISOString().slice(0, 10),
      church_id: church.id,
    };

    if (edad != null) payload.edad = Number(edad);
    if (estado_civil) payload.estado_civil = String(estado_civil).trim();
    if (barrio) payload.barrio = String(barrio).trim();

    const { error } = await supabase.from("visitors").insert([payload]);

    if (error) {
      console.error("Error insertando visitante:", error);
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
