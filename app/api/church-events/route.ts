import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const churchId = searchParams.get("church_id");

  if (!churchId) return NextResponse.json([]);

  const { data: church } = await supabaseAdmin
    .from("churches")
    .select("events_api_url")
    .eq("id", churchId)
    .single();

  if (!church?.events_api_url) return NextResponse.json([]);

  try {
    const res = await fetch(church.events_api_url, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return NextResponse.json([]);
    const events = await res.json();
    return NextResponse.json(Array.isArray(events) ? events : [], {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json([]);
  }
}
