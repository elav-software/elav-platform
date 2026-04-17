import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cliente público para operaciones que requieren anon key (como resetPasswordForEmail)
const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
      .select("role, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!churchUser || churchUser.role !== "admin") {
      return NextResponse.json({ error: "Sin permisos de administrador" }, { status: 403 });
    }

    const { email, fullName, redirectBase } = await req.json();
    if (!email || !redirectBase) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Intentar invitar directamente. Si ya existe, caer en reset de contraseña.
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${redirectBase}/connect/portal/callback`,
      data: {
        full_name: fullName,
      },
    });

    if (inviteError) {
      // "User already registered" → mandar reset de contraseña en su lugar
      const alreadyExists =
        inviteError.message?.toLowerCase().includes("already") ||
        inviteError.message?.toLowerCase().includes("registered") ||
        (inviteError as { status?: number }).status === 422;

      if (!alreadyExists) throw inviteError;

      const { error: resetError } = await supabasePublic.auth.resetPasswordForEmail(email, {
        redirectTo: `${redirectBase}/connect/portal/set-password`,
      });
      if (resetError) throw resetError;
      return NextResponse.json({ success: true, resent: true });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Error invitando líder:", err);
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
