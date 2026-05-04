import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const churchId = formData.get("churchId") as string | null;

  if (!file || !churchId) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "La foto no puede superar 5MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const path = `${churchId}/${Date.now()}.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from("leader-photos")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from("leader-photos")
    .getPublicUrl(data.path);

  return NextResponse.json({ url: urlData.publicUrl });
}
