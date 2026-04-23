import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Usar service_role para bypassear RLS en esta ruta pública
// (la landing no tiene usuario autenticado)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, telefono, edad, estado_civil, barrio, church_slug } = body;

    if (!nombre || !telefono) {
      return NextResponse.json({ error: "Nombre y teléfono son obligatorios" }, { status: 400 });
    }

    // Resolver church_id por slug
    const slug = church_slug ?? "cfc";
    const { data: church } = await supabase
      .from("churches")
      .select("id")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    // Guardar en `visitors` para que aparezca en el portal de consolidación.
    // El marcador invited_by: 'web:soy-nuevo' identifica los registros de la landing.
    const payload: Record<string, unknown> = {
      name: nombre.trim(),
      phone: telefono.trim(),
      follow_up_status: "Pending",
      invited_by: "web:soy-nuevo",
      visit_date: new Date().toISOString().slice(0, 10),
    };

    if (edad != null) payload.edad = Number(edad);
    if (estado_civil) payload.estado_civil = String(estado_civil).trim();
    if (barrio) payload.barrio = String(barrio).trim();
    if (church?.id) payload.church_id = church.id;

    const { error } = await supabase.from("visitors").insert([payload]);

    if (error) {
      console.error("Error insertando visitante:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
