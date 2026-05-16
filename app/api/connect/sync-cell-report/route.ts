import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Verificar sesión del líder del portal
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { reportDate, topic, attendance, visits, newConverts, offering, notes } = await req.json();

    // Buscar el líder en la tabla leaders del CRM.
    // Estrategia 1: por member_id (personas.id) — es el vínculo más confiable
    // Estrategia 2: por email — fallback si no hay member_id linkeado
    // Estrategia 3: por full_name — último fallback si email también está vacío en leaders
    const { data: personaRow } = await supabaseAdmin
      .from("personas")
      .select("id, church_id, nombre, apellido")
      .ilike("email", user.email!)
      .maybeSingle();

    let crmLeader = null;
    if (personaRow) {
      const { data } = await supabaseAdmin
        .from("leaders")
        .select("id, church_id")
        .eq("member_id", personaRow.id)
        .maybeSingle();
      crmLeader = data;
    }

    // Fallback: buscar por email directo en leaders
    if (!crmLeader) {
      const { data } = await supabaseAdmin
        .from("leaders")
        .select("id, church_id")
        .ilike("email", user.email!)
        .maybeSingle();
      crmLeader = data;
    }

    // Fallback 3: buscar por full_name usando nombre+apellido de personas
    // IMPORTANTE: filtrar por church_id para evitar cruzar datos entre iglesias
    if (!crmLeader && personaRow?.church_id) {
      const fullName = `${personaRow.nombre} ${personaRow.apellido}`.trim();
      const { data } = await supabaseAdmin
        .from("leaders")
        .select("id, church_id")
        .ilike("full_name", fullName)
        .eq("church_id", personaRow.church_id)
        .maybeSingle();
      crmLeader = data;
    }

    if (!crmLeader) {
      // No hay entrada en leaders aún — sync ignorada silenciosamente
      return NextResponse.json({ synced: false, reason: "leader_not_in_crm" });
    }

    const { error: insertError } = await supabaseAdmin.from("cell_reports").insert({
      leader_id: crmLeader.id,
      church_id: crmLeader.church_id,
      date: reportDate,
      topic: topic || null,
      attendance: attendance ? parseInt(attendance) : 0,
      visits: visits ? parseInt(visits) : 0,
      new_converts: newConverts ? parseInt(newConverts) : 0,
      offering: (() => { const v = parseFloat(offering); return isFinite(v) && v >= 0 ? v : 0; })(),
      notes: notes || null,
    });

    if (insertError) throw insertError;

    return NextResponse.json({ synced: true });
  } catch (err: unknown) {
    console.error("Error sincronizando reporte de célula:", err);
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
