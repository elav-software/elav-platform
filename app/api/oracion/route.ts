import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Rate limiting (Upstash) ──────────────────────────────────────────────────
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "oracion",
});

// ── Dominios permitidos por slug de iglesia (multi-tenant) ───────────────────
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

/**
 * POST /api/oracion
 *
 * Guarda un pedido de oración enviado desde la landing pública.
 * No requiere autenticación.
 *
 * Body (JSON):
 *   nombre        string  — Nombre del solicitante
 *   apellido      string  — Apellido (opcional)
 *   telefono      string  — Teléfono (opcional)
 *   email         string  — Email (opcional)
 *   mensaje       string  — El pedido de oración
 *   church_slug   string  — Slug de la iglesia (opcional, default: "cfc")
 *   _hp           string  — Honeypot anti-bot (debe venir vacío)
 */
export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin") ?? "";
    const body = await req.json();
    const { nombre, apellido, telefono, email, mensaje, church_slug, _hp } = body;

    // Honeypot: campo oculto que solo los bots completan
    if (_hp) {
      return NextResponse.json({ ok: true });
    }

    const slug = church_slug ?? "cfc";

    // Validar que el origen coincide con la iglesia solicitada
    const expectedOrigin = ALLOWED_ORIGINS[slug];
    if (expectedOrigin && origin && origin !== expectedOrigin) {
      return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
    }

    const corsHeaders = CORS_HEADERS(expectedOrigin ?? origin ?? "*");

    // ── Rate limiting por IP ───────────────────────────────────────────────
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intentá de nuevo en una hora." },
        { status: 429, headers: corsHeaders }
      );
    }

    if (!nombre?.trim() || !mensaje?.trim()) {
      return NextResponse.json(
        { error: "Nombre y mensaje son obligatorios" },
        { status: 400, headers: corsHeaders }
      );
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

    const memberName = [nombre.trim(), apellido?.trim()].filter(Boolean).join(" ");

    const payload: Record<string, unknown> = {
      church_id: church.id,
      requester_name: memberName,
      request: mensaje.trim(),
      category: "Other",
      status: "Active",
      source: "landing",
    };

    if (telefono) payload.phone = String(telefono).trim();
    if (email) payload.email = String(email).trim();

    const { error } = await supabase.from("prayer_requests").insert([payload]);

    if (error) {
      console.error("[oracion] Error insertando pedido de oración:", JSON.stringify(error));
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
