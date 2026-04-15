/**
 * /api/crm/[name]/route.ts
 *
 * Catch-all handler for CRM server-side functions.
 * Requires SUPABASE_SERVICE_ROLE_KEY (server-side only, never exposed to client).
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase service role configuration");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function requireAdmin(request: NextRequest): Promise<{ churchId: string } | null> {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const supabase = getAdminClient();
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user || user.app_metadata?.role !== "admin") return null;

  const { data: churchUser } = await supabase
    .from("church_users")
    .select("church_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!churchUser?.church_id) return null;
  return { churchId: churchUser.church_id };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    switch (name) {
      default:
        return NextResponse.json({ error: `Unknown function: ${name}` }, { status: 404 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

