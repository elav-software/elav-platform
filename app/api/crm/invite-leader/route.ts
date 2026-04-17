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

    // Verificar si el usuario ya existe en Supabase Auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const alreadyExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (alreadyExists) {
      // Ya tiene cuenta → mandar reset de contraseña con el cliente público
      const { error: resetError } = await supabasePublic.auth.resetPasswordForEmail(email, {
        redirectTo: `${redirectBase}/connect/portal/set-password`,
      });
      if (resetError) throw resetError;
      return NextResponse.json({ success: true, resent: true });
    }

    // Invitar al usuario (manda email con link para setear contraseña)
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${redirectBase}/connect/portal/callback`,
      data: {
        full_name: fullName,
      },
    });

    if (inviteError) throw inviteError;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Error invitando líder:", err);
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
