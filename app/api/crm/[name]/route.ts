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

interface AdminContext {
  churchId: string;
}

/**
 * Validates the Bearer token, confirms the user has role=admin in app_metadata,
 * and resolves their church_id from the church_users table.
 * Returns null if the token is missing, invalid, or not scoped to a church.
 */
async function requireAdmin(request: NextRequest): Promise<AdminContext | null> {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const supabase = getAdminClient();
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user || user.app_metadata?.role !== "admin") return null;

  // Resolve the church this admin belongs to
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

    const { churchId } = admin;
    const supabase = getAdminClient();
    const body = await request.json();

    switch (name) {
      case "listUsers": {
        // Get the user_ids that belong to this church
        const { data: churchUsers, error: cuError } = await supabase
          .from("church_users")
          .select("user_id, role, is_active")
          .eq("church_id", churchId);
        if (cuError) throw cuError;

        if (!churchUsers || churchUsers.length === 0) {
          return NextResponse.json({ data: { users: [] } });
        }

        // Fetch all auth users in one call, then filter to this church
        const churchUserIds = new Set(churchUsers.map((cu) => cu.user_id));
        const { data: { users: allUsers }, error: listError } =
          await supabase.auth.admin.listUsers({ perPage: 1000 });
        if (listError) throw listError;

        const roleMap = new Map(
          churchUsers.map((cu) => [cu.user_id, { church_role: cu.role, church_is_active: cu.is_active }])
        );
        const users = allUsers
          .filter((u) => churchUserIds.has(u.id))
          .map((u) => ({ ...u, ...roleMap.get(u.id) }));

        return NextResponse.json({ data: { users } });
      }

      case "updateUser": {
        const { id, role, is_active } = body;
        const VALID_ROLES = ["admin", "user", "leader"];
        if (role !== undefined && !VALID_ROLES.includes(role)) {
          return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 });
        }

        // Verify the target user belongs to this admin's church
        const { data: membership } = await supabase
          .from("church_users")
          .select("id")
          .eq("user_id", id)
          .eq("church_id", churchId)
          .single();
        if (!membership) {
          return NextResponse.json({ error: "User not found in your church" }, { status: 404 });
        }

        const updateData: Record<string, unknown> = {};
        if (role !== undefined) updateData.role = role;
        if (is_active !== undefined) updateData.is_active = is_active;
        const { data, error } = await supabase.auth.admin.updateUserById(id, {
          app_metadata: updateData,
        });
        if (error) throw error;

        // Keep church_users in sync so role-based nav/access reflects the change
        const churchUsersUpdate: Record<string, unknown> = {};
        if (role !== undefined) churchUsersUpdate.role = role;
        if (is_active !== undefined) churchUsersUpdate.is_active = is_active;
        if (Object.keys(churchUsersUpdate).length > 0) {
          await supabase
            .from("church_users")
            .update(churchUsersUpdate)
            .eq("user_id", id)
            .eq("church_id", churchId);
        }

        return NextResponse.json({ data });
      }

      case "deleteUser": {
        const { id } = body;

        // Verify the target user belongs to this admin's church
        const { data: membership } = await supabase
          .from("church_users")
          .select("id")
          .eq("user_id", id)
          .eq("church_id", churchId)
          .single();
        if (!membership) {
          return NextResponse.json({ error: "User not found in your church" }, { status: 404 });
        }

        const { error } = await supabase.auth.admin.deleteUser(id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case "invite-user": {
        const { email, role } = body;
        const VALID_ROLES = ["admin", "user", "leader"];
        if (role !== undefined && !VALID_ROLES.includes(role)) {
          return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 });
        }
        const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
          data: { role: role ?? "user" },
        });
        if (error) throw error;

        if (data.user?.id) {
          // Set app_metadata so the role is not user-editable
          await supabase.auth.admin.updateUserById(data.user.id, {
            app_metadata: { role: role ?? "user" },
          });
          // Link the new user to this church
          await supabase.from("church_users").insert({
            church_id: churchId,
            user_id: data.user.id,
            role: role ?? "user",
            is_active: true,
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
