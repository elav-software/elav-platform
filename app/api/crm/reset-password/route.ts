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

// Allowlist anti open-redirect
const ALLOWED_REDIRECT_BASES = [
  "https://crm.cfccasanova.com",
  ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000"] : []),
];

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

    const { data: churchUser } = await supabaseAdmin
      .from("church_users")
      .select("role, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!churchUser || churchUser.role !== "admin") {
      return NextResponse.json({ error: "Sin permisos de administrador" }, { status: 403 });
    }

    const { email, redirectBase } = await req.json();
    if (!email || !redirectBase) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    if (!ALLOWED_REDIRECT_BASES.some(b => redirectBase.startsWith(b))) {
      return NextResponse.json({ error: "redirectBase no permitido" }, { status: 400 });
    }

    const { error } = await supabasePublic.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectBase}/connect/portal/callback`,
    });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Error enviando reset de contraseña:", err);
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
