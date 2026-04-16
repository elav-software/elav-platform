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

/** Verifica que el token pertenece a un admin del CRM (church_users.role = 'admin'). */
async function requireCrmAdmin(request: NextRequest): Promise<{ churchId: string } | null> {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const supabase = getAdminClient();
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;

  const { data: churchUser } = await supabase
    .from("church_users")
    .select("church_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!churchUser?.church_id || churchUser.role !== "admin") return null;
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

    // ── Invite endpoints (CRM admin) ─────────────────────────────────────
    if (name === "invite-leader" || name === "invite-all-leaders") {
      const crmAdmin = await requireCrmAdmin(request);
      if (!crmAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const adminClient = getAdminClient();
      const body = await request.json();

      if (name === "invite-leader") {
        // Invite a single leader by email
        const { email, fullName, redirectBase } = body as {
          email: string;
          fullName: string;
          redirectBase: string;
        };

        if (!email) {
          return NextResponse.json({ error: "email is required" }, { status: 400 });
        }

        const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
          data: { full_name: fullName },
          redirectTo: `${redirectBase}/connect/portal/callback`,
        });

        // If user already exists, that counts as success (they already have access)
        if (error && !error.message.toLowerCase().includes("already")) {
          throw error;
        }

        return NextResponse.json({ success: true, alreadyExists: !!error });
      }

      if (name === "invite-all-leaders") {
        // Invite all approved leaders with email in this church
        const { redirectBase } = body as { redirectBase: string };

        const { data: leaders, error: fetchError } = await adminClient
          .from("personas")
          .select("id, email, nombre, apellido")
          .eq("church_id", crmAdmin.churchId)
          .eq("rol", "Líder")
          .eq("estado_aprobacion", "aprobado")
          .not("email", "is", null)
          .neq("email", "");

        if (fetchError) throw fetchError;

        let invited = 0;
        let skipped = 0;
        for (const leader of leaders ?? []) {
          const { error } = await adminClient.auth.admin.inviteUserByEmail(leader.email, {
            data: { full_name: `${leader.nombre} ${leader.apellido}`.trim() },
            redirectTo: `${redirectBase}/connect/portal/callback`,
          });
          if (!error) invited++;
          else skipped++; // already registered or error — skip silently
        }

        return NextResponse.json({ success: true, invited, skipped });
      }
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

