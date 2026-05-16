import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const churchId = formData.get("churchId") as string | null;

  if (!file || !churchId) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  // Validar tipo de archivo
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido. Solo JPG, PNG, WEBP o GIF." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "La foto no puede superar 5MB" }, { status: 400 });
  }

  // Validar que el churchId sea una iglesia real y activa — nunca confiar en el cliente
  const { data: church } = await supabaseAdmin
    .from("churches")
    .select("id")
    .eq("id", churchId)
    .eq("is_active", true)
    .maybeSingle();

  if (!church) {
    return NextResponse.json({ error: "Iglesia inválida" }, { status: 403 });
  }

  // Nombre único con random para evitar colisiones y no sobreescribir
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${churchId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from("leader-photos")
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from("leader-photos")
    .getPublicUrl(data.path);

  return NextResponse.json({ url: urlData.publicUrl });
}
