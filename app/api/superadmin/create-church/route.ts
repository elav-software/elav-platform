import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/superadmin/create-church
 *
 * Crea una iglesia nueva en Supabase y su usuario admin inicial.
 * Protegida por SUPERADMIN_SECRET — nunca exponer esta clave.
 *
 * Body (JSON):
 *   name         string  — Nombre completo de la iglesia
 *   slug         string  — Identificador único (ej: "refugio")
 *   short_name   string  — Nombre corto (ej: "El Refugio")
 *   custom_domain string — Dominio propio (ej: "elrefugio.com")
 *   admin_email  string  — Email del pastor/admin de esa iglesia
 *   admin_name   string  — Nombre del admin (para el email de bienvenida)
 *   plan         string  — "basic" | "pro"  (default: "basic")
 */
export async function POST(req: NextRequest) {
  // ── 1. Verificar clave maestra ────────────────────────────────────────────
  const secret = req.headers.get("x-superadmin-secret");
  if (!secret || secret !== process.env.SUPERADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // ── 2. Parsear y validar body ─────────────────────────────────────────────
  let body: {
    name: string;
    slug: string;
    short_name?: string;
    custom_domain: string;
    admin_email: string;
    admin_name?: string;
    plan?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { name, slug, short_name, custom_domain, admin_email, admin_name, plan = "basic" } = body;

  if (!name || !slug || !custom_domain || !admin_email) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios: name, slug, custom_domain, admin_email" },
      { status: 400 }
    );
  }

  // Validar slug: solo letras minúsculas, números y guiones
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "El slug solo puede contener letras minúsculas, números y guiones." },
      { status: 400 }
    );
  }

  // ── 3. Cliente admin de Supabase (service role) ───────────────────────────
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // ── 4. Crear registro en churches ─────────────────────────────────────────
  const { data: church, error: churchError } = await supabaseAdmin
    .from("churches")
    .insert({
      name,
      slug,
      short_name: short_name ?? name,
      custom_domain: custom_domain.replace(/^www\./, "").toLowerCase(),
      plan,
      is_active: true,
    })
    .select("id, name, slug, custom_domain")
    .single();

  if (churchError) {
    // Slug o dominio duplicado → error descriptivo
    if (churchError.code === "23505") {
      return NextResponse.json(
        { error: "Ya existe una iglesia con ese slug o dominio." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: churchError.message }, { status: 500 });
  }

  // ── 5. Crear usuario admin en Supabase Auth ───────────────────────────────
  // Genera una contraseña temporal aleatoria de 16 caracteres
  const tempPassword = Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map((b) => b.toString(36))
    .join("")
    .slice(0, 16);

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: admin_email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: admin_name ?? "",
      role: "admin",
    },
  });

  if (authError) {
    // Si falla la creación del usuario, revertir la iglesia creada
    await supabaseAdmin.from("churches").delete().eq("id", church.id);
    if (authError.message?.includes("already registered")) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // ── 6. Ligar usuario a la iglesia en church_users ─────────────────────────
  const { error: linkError } = await supabaseAdmin.from("church_users").insert({
    church_id: church.id,
    user_id: authUser.user.id,
    role: "admin",
    is_active: true,
  });

  if (linkError) {
    // Revertir todo si falla el link
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    await supabaseAdmin.from("churches").delete().eq("id", church.id);
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  // ── 7. Respuesta exitosa ──────────────────────────────────────────────────
  // ⚠️  La contraseña temporal se devuelve SOLO en esta respuesta.
  // El superadmin debe enviársela al pastor de forma segura.
  return NextResponse.json({
    ok: true,
    church: {
      id: church.id,
      name: church.name,
      slug: church.slug,
      custom_domain: church.custom_domain,
    },
    admin: {
      email: admin_email,
      temp_password: tempPassword,
    },
    urls: {
      web:   `https://${custom_domain}`,
      crm:   `https://crm.${custom_domain}`,
      censo: `https://censo.${custom_domain}`,
    },
  });
}
