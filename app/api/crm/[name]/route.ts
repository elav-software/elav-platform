/**
 * /api/crm/[name]/route.ts
 *
 * Single catch-all handler for CRM admin functions.
 * Requires SUPABASE_SERVICE_ROLE_KEY env var (server-side only, never exposed to client).
 *
 * Supported names:
 *   - listUsers
 *   - updateUser
 *   - deleteUser
 *   - invite-user
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

async function requireAdmin(request: NextRequest): Promise<boolean> {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return false;
  const supabase = getAdminClient();
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.app_metadata?.role === "admin";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  try {
    const isAdmin = await requireAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = getAdminClient();
    const body = await request.json();

    switch (name) {
      case "listUsers": {
        const { data: { users }, error } = await supabase.auth.admin.listUsers();
        if (error) throw error;
        return NextResponse.json({ data: { users } });
      }

      case "updateUser": {
        const { id, role, is_active } = body;
        const updateData: Record<string, unknown> = {};
        if (role !== undefined) updateData.role = role;
        if (is_active !== undefined) updateData.is_active = is_active;
        const { data, error } = await supabase.auth.admin.updateUserById(id, {
          app_metadata: updateData,
        });
        if (error) throw error;
        return NextResponse.json({ data });
      }

      case "deleteUser": {
        const { id } = body;
        const { error } = await supabase.auth.admin.deleteUser(id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case "invite-user": {
        const { email, role } = body;
        const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
          data: { role: role ?? "user" },
        });
        if (error) throw error;
        // Set app_metadata so the role is not user-editable
        if (data.user?.id) {
          await supabase.auth.admin.updateUserById(data.user.id, {
            app_metadata: { role: role ?? "user" },
          });
        }
        return NextResponse.json({ data });
      }

      default:
        return NextResponse.json({ error: `Unknown function: ${name}` }, { status: 404 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
