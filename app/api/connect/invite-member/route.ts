import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Áreas que dan acceso al portal — sincronizar con AREA_PORTAL_SECTIONS en PortalDashboard.jsx
const PORTAL_AREAS = ["Consolidación"];

// Allowlist anti open-redirect
const ALLOWED_REDIRECT_BASES = [
  "https://crm.cfccasanova.com",
  ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000"] : []),
];

export async function POST(req: NextRequest) {
  try {
    // Verificar que hay un token de sesión del portal
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Verificar que el llamante es un Líder aprobado en personas
    const { data: callerPersona } = await supabaseAdmin
      .from("personas")
      .select("id, rol, estado_aprobacion")
      .ilike("email", user.email!)
      .eq("rol", "Líder")
      .eq("estado_aprobacion", "aprobado")
      .single();

    if (!callerPersona) {
      return NextResponse.json({ error: "Sin permisos de líder" }, { status: 403 });
    }

    const { personaId, email, fullName, redirectBase } = await req.json();
    if (!personaId || !email || !redirectBase) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    if (!ALLOWED_REDIRECT_BASES.some(b => redirectBase.startsWith(b))) {
      return NextResponse.json({ error: "redirectBase no permitido" }, { status: 400 });
    }

    // Verificar que el miembro pertenece a la célula del líder
    const { data: targetPersona } = await supabaseAdmin
      .from("personas")
      .select("id, lider_id, area_servicio_actual")
      .eq("id", personaId)
      .single();

    if (!targetPersona) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }

    if (targetPersona.lider_id !== callerPersona.id) {
      return NextResponse.json({ error: "Este miembro no pertenece a tu célula" }, { status: 403 });
    }

    // Verificar que el miembro tiene al menos un área portal
    const areas = (targetPersona.area_servicio_actual || "")
      .split(",")
      .map((a: string) => a.trim());
    if (!areas.some((a: string) => PORTAL_AREAS.includes(a))) {
      return NextResponse.json({ error: "Este miembro no tiene áreas con acceso al portal" }, { status: 400 });
    }

    // Invitar (nueva cuenta) o reenviar (ya existe → reset de contraseña)
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${redirectBase}/connect/portal/callback`,
      data: { full_name: fullName },
    });

    if (inviteError) {
      const alreadyExists =
        inviteError.message?.toLowerCase().includes("already") ||
        inviteError.message?.toLowerCase().includes("registered") ||
        (inviteError as { status?: number }).status === 422;

      if (!alreadyExists) throw inviteError;

      const { error: resetError } = await supabasePublic.auth.resetPasswordForEmail(email, {
        redirectTo: `${redirectBase}/connect/portal/callback`,
      });
      if (resetError) throw resetError;
      return NextResponse.json({ success: true, resent: true });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Error invitando miembro al portal:", err);
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
