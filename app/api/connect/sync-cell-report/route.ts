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

    // Buscar el líder en la tabla leaders del CRM por su email
    const { data: crmLeader } = await supabaseAdmin
      .from("leaders")
      .select("id, church_id")
      .ilike("email", user.email!)
      .maybeSingle();

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
      offering: offering ? parseFloat(offering) : 0,
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
