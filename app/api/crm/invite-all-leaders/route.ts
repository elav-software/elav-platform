import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Verificar admin via church_users (fuente autoritativa)
    // o via app_metadata (solo modificable por service_role, no por el usuario)
    const isSuperadminByMeta = user.app_metadata?.role === "superadmin";

    const { data: churchUser } = await supabaseAdmin
      .from("church_users")
      .select("role, is_active, church_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!isSuperadminByMeta && (!churchUser || !["admin", "superadmin"].includes(churchUser.role))) {
      return NextResponse.json({ error: "Sin permisos de administrador" }, { status: 403 });
    }

    const churchId = churchUser?.church_id;
    if (!churchId) {
      return NextResponse.json({ error: "No se pudo determinar la iglesia" }, { status: 400 });
    }

    const { redirectBase } = await req.json();
    if (!redirectBase) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const { data: leaders, error: fetchError } = await supabaseAdmin
      .from("personas")
      .select("email, nombre, apellido")
      .eq("church_id", churchId)
      .eq("rol", "Líder")
      .eq("estado_aprobacion", "aprobado")
      .not("email", "is", null);

    if (fetchError) throw fetchError;

    let invited = 0;
    let skipped = 0;
    let failed = 0;
    const failedEmails: string[] = [];

    for (const leader of leaders ?? []) {
      if (!leader.email) { skipped++; continue; }

      try {
        const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(leader.email, {
          redirectTo: `${redirectBase}/connect/portal/callback`,
          data: { full_name: `${leader.nombre} ${leader.apellido}`.trim() },
        });

        if (inviteError) {
          const msg = inviteError.message.toLowerCase();
          // Usuario ya registrado = OK, no es un error
          if (msg.includes("already") || msg.includes("registered") || msg.includes("exist")) {
            skipped++;
          } else {
            // Error real (rate limit, etc.)
            console.error(`[invite-all] Error con ${leader.email}:`, inviteError.message);
            failed++;
            failedEmails.push(leader.email);
          }
        } else {
          invited++;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message.toLowerCase() : "";
        if (msg.includes("already") || msg.includes("registered") || msg.includes("exist")) {
          skipped++;
        } else {
          console.error(`[invite-all] Exception con ${leader.email}:`, err);
          failed++;
          failedEmails.push(leader.email);
        }
      }

      // Pausa entre invitaciones para respetar rate limits de Supabase Auth
      await delay(300);
    }

    return NextResponse.json({
      success: true,
      invited,
      skipped,
      failed,
      failedEmails: failed > 0 ? failedEmails : undefined,
    });
  } catch (err: unknown) {
    console.error("Error invitando líderes:", err);
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
