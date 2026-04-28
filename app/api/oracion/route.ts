import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://cfccasanova.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// Usar service_role para bypassear RLS — este endpoint es público (sin auth)
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
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, apellido, telefono, email, mensaje, church_slug } = body;

    if (!nombre?.trim() || !mensaje?.trim()) {
      return NextResponse.json(
        { error: "Nombre y mensaje son obligatorios" },
        { status: 400 }
      );
    }

    // Resolver church_id por slug; si no matchea, usar la primera iglesia activa (single-tenant fallback)
    const slug = church_slug ?? "cfc";
    let churchId: string | null = null;

    const { data: churchBySlug } = await supabase
      .from("churches")
      .select("id")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (churchBySlug?.id) {
      churchId = churchBySlug.id;
    } else {
      const { data: firstChurch } = await supabase
        .from("churches")
        .select("id")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      churchId = firstChurch?.id ?? null;
    }

    if (!churchId) {
      console.error("No se encontró ninguna iglesia activa en la base de datos");
      return NextResponse.json({ error: "Configuración interna inválida" }, { status: 500 });
    }

    const memberName = [nombre.trim(), apellido?.trim()].filter(Boolean).join(" ");

    const payload: Record<string, unknown> = {
      church_id: churchId,
      requester_name: memberName,
      request: mensaje.trim(),
      category: "Other",
      status: "Active",
      source: "landing",
    };

    if (telefono) payload.phone = String(telefono).trim();
    if (email) payload.email = String(email).trim();

    console.log("[oracion] Insertando payload:", JSON.stringify(payload));
    const { error } = await supabase.from("prayer_requests").insert([payload]);

    if (error) {
      console.error("[oracion] Error insertando pedido de oración:", JSON.stringify(error));
      return NextResponse.json({ error: error.message, detail: error.details, hint: error.hint }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500, headers: CORS_HEADERS });
  }
}
