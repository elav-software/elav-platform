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

    // Verificar que es admin o superadmin
    // Caso 1: superadmin via user_metadata (no tiene fila en church_users)
    const isSuperadminByMeta =
      user.user_metadata?.role === "superadmin" ||
      user.app_metadata?.role === "superadmin";

    if (!isSuperadminByMeta) {
      // Caso 2: admin/superadmin via church_users
      const { data: churchUser, error: cuError } = await supabaseAdmin
        .from("church_users")
        .select("church_id, role, is_active")
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("[upload-material] church_users row:", churchUser, "error:", cuError);

      if (
        !churchUser ||
        !["admin", "superadmin"].includes(churchUser.role)
      ) {
        return NextResponse.json(
          { error: "Sin permisos de admin", debug: { role: churchUser?.role ?? null } },
          { status: 403 }
        );
      }
    }

    // Parsear FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const filePath = formData.get("filePath") as string | null;

    if (!file || !filePath) {
      return NextResponse.json({ error: "Falta archivo o path" }, { status: 400 });
    }

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir con service role (bypasea RLS)
    const { error: uploadError } = await supabaseAdmin.storage
      .from("materiales")
      .upload(filePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("[upload-material] Storage error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Generar URL firmada (1 año)
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from("materiales")
      .createSignedUrl(filePath, 60 * 60 * 24 * 365);

    if (signedError || !signedData?.signedUrl) {
      return NextResponse.json({ error: "No se pudo generar URL" }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: signedData.signedUrl });
  } catch (err) {
    console.error("[upload-material] Error inesperado:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
