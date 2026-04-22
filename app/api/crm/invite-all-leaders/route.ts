import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Verificar auth del CRM
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Verificar que el usuario es admin del CRM
    const { data: churchUser } = await supabaseAdmin
      .from("church_users")
      .select("role, is_active, church_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!churchUser || churchUser.role !== "admin") {
      return NextResponse.json({ error: "Sin permisos de administrador" }, { status: 403 });
    }

    const { redirectBase } = await req.json();
    if (!redirectBase) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Obtener todos los líderes aprobados con email de esta iglesia
    const { data: leaders, error: fetchError } = await supabaseAdmin
      .from("personas")
      .select("email, nombre, apellido")
      .eq("church_id", churchUser.church_id)
      .eq("rol", "Líder")
      .eq("estado_aprobacion", "aprobado")
      .not("email", "is", null);

    if (fetchError) throw fetchError;

    let invited = 0;
    let skipped = 0;

    for (const leader of leaders ?? []) {
      if (!leader.email) { skipped++; continue; }

      try {
        await supabaseAdmin.auth.admin.inviteUserByEmail(leader.email, {
          redirectTo: `${redirectBase}/connect/portal/callback`,
          data: {
            full_name: `${leader.nombre} ${leader.apellido}`.trim(),
          },
        });
        invited++;
      } catch (err: unknown) {
        // Si ya existe el usuario, contar como skipped sin lanzar error
        const msg = err instanceof Error ? err.message.toLowerCase() : "";
        const isAlreadyExists = msg.includes("already") || msg.includes("registered");
        if (isAlreadyExists) { skipped++; } else { skipped++; }
      }
    }

    return NextResponse.json({ success: true, invited, skipped });
  } catch (err: unknown) {
    console.error("Error invitando líderes:", err);
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
