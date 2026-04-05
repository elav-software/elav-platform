/**
 * base44Client.js — Compatibility shim
 *
 * Exports the same `base44` object the CRM pages expect, but every call
 * is backed by Supabase instead of the Base44 SDK.
 *
 * API contract preserved:
 *   base44.entities.<Entity>.list(orderBy, limit)
 *   base44.entities.<Entity>.filter(conditions, orderBy, limit)
 *   base44.entities.<Entity>.create(data)
 *   base44.entities.<Entity>.update(id, data)
 *   base44.entities.<Entity>.delete(id)
 *   base44.auth.me()
 *   base44.auth.logout(redirectUrl)
 *   base44.auth.redirectToLogin(redirectUrl)
 *   base44.functions.invoke(name, params)
 *   base44.users.inviteUser(email, role)
 */

import { supabase, supabaseToCRM, crmToSupabase } from "./supabaseClient";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parses a Base44-style order string ("-created_date", "name", etc.)
 * into a Supabase-compatible order descriptor.
 */
function parseOrder(orderStr = "-created_at") {
  const desc = orderStr.startsWith("-");
  const raw = desc ? orderStr.slice(1) : orderStr;
  // Base44 used "created_date"; Supabase auto-column is "created_at"
  const col = raw === "created_date" ? "created_at" : raw;
  return { column: col, ascending: !desc };
}

// ---------------------------------------------------------------------------
// Generic entity factory — direct column mapping (no translation needed)
// Used for all tables whose columns already match the CRM field names.
// ---------------------------------------------------------------------------
function makeEntity(tableName) {
  return {
    async list(orderBy = "-created_at", limit = 500) {
      const { column, ascending } = parseOrder(orderBy);
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order(column, { ascending })
        .limit(limit);
      if (error) throw new Error(error.message);
      return data;
    },

    async filter(conditions = {}, orderBy = "-created_at", limit = 500) {
      const { column, ascending } = parseOrder(orderBy);
      let q = supabase.from(tableName).select("*");
      Object.entries(conditions).forEach(([k, v]) => {
        q = q.eq(k, v);
      });
      const { data, error } = await q.order(column, { ascending }).limit(limit);
      if (error) throw new Error(error.message);
      return data;
    },

    async create(payload) {
      const { data, error } = await supabase
        .from(tableName)
        .insert(payload)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from(tableName)
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq("id", id);
      if (error) throw new Error(error.message);
      return { success: true };
    },
  };
}

// ---------------------------------------------------------------------------
// Member entity — maps to `personas` table with Spanish↔English translation
// ---------------------------------------------------------------------------

// Translates CRM filter keys → Supabase column names for `personas`
const MEMBER_FILTER_MAP = {
  member_status: {
    col: "rol",
    values: {
      Visitor: "Visitante",
      "New Believer": "Nuevo Creyente",
      Member: "Miembro",
      Leader: "Líder",
    },
  },
};

function makeMemberEntity() {
  const toDB = crmToSupabase;
  const fromDB = (row) => ({ ...supabaseToCRM(row), id: row.id });

  return {
    async list(orderBy = "-created_at", limit = 500) {
      const { column, ascending } = parseOrder(orderBy);
      const { data, error } = await supabase
        .from("personas")
        .select("*")
        .order(column, { ascending })
        .limit(limit);
      if (error) throw new Error(error.message);
      return data.map(fromDB);
    },

    async filter(conditions = {}, orderBy = "-created_at", limit = 500) {
      const { column, ascending } = parseOrder(orderBy);
      let q = supabase.from("personas").select("*");
      Object.entries(conditions).forEach(([k, v]) => {
        const mapping = MEMBER_FILTER_MAP[k];
        if (mapping) {
          q = q.eq(mapping.col, mapping.values[v] ?? v);
        } else {
          q = q.eq(k, v);
        }
      });
      const { data, error } = await q.order(column, { ascending }).limit(limit);
      if (error) throw new Error(error.message);
      return data.map(fromDB);
    },

    async create(payload) {
      const { data, error } = await supabase
        .from("personas")
        .insert(toDB(payload))
        .select()
        .single();
      if (error) throw new Error(error.message);
      return fromDB(data);
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from("personas")
        .update(toDB(payload))
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return fromDB(data);
    },

    async delete(id) {
      const { error } = await supabase.from("personas").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return { success: true };
    },
  };
}

// ---------------------------------------------------------------------------
// Auth layer — replaces base44.auth.*
// ---------------------------------------------------------------------------
export const auth = {
  async me() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    return {
      id: user.id,
      email: user.email,
      full_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "",
      role: user.user_metadata?.role ?? "user",
    };
  },

  async logout(redirectUrl = "/") {
    await supabase.auth.signOut();
    window.location.href = redirectUrl;
  },

  redirectToLogin(_redirectUrl) {
    // Sends the user to the CRM login page inside censo-iglesia
    window.location.href = "/crm/login";
  },
};

// ---------------------------------------------------------------------------
// Functions layer — replaces base44.functions.invoke()
// geocodeAddress: uses Nominatim (OpenStreetMap, free, no key required)
// User-management functions: delegated to Next.js API routes (/api/crm/*)
// ---------------------------------------------------------------------------
const functions = {
  async invoke(name, params = {}) {
    if (name === "geocodeAddress") {
      const query = encodeURIComponent(params.address || "");
      const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&accept-language=es`;
      const res = await fetch(url, {
        headers: { "User-Agent": "censo-iglesia-crm/1.0" },
      });
      const results = await res.json();
      if (results.length === 0) return null;
      return {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon),
      };
    }

    // Admin functions go through Next.js API routes (require service-role key)
    const res = await fetch(`/api/crm/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`CRM function "${name}" failed: ${text}`);
    }
    return res.json();
  },
};

// ---------------------------------------------------------------------------
// Users layer — replaces base44.users.*
// ---------------------------------------------------------------------------
const users = {
  async inviteUser(email, role) {
    const res = await fetch("/api/crm/invite-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    if (!res.ok) throw new Error("Failed to invite user");
    return res.json();
  },
};

// ---------------------------------------------------------------------------
// Main export — drop-in replacement for the old base44 SDK client
// ---------------------------------------------------------------------------
export const base44 = {
  entities: {
    Member: makeMemberEntity(),
    Visitor: makeEntity("visitors"),
    Donation: makeEntity("donations"),
    Event: makeEntity("events"),
    Attendance: makeEntity("event_attendance"),
    Leader: makeEntity("leaders"),
    CellMember: makeEntity("cell_members"),
    CellReport: makeEntity("cell_reports"),
    Ministry: makeEntity("ministries"),
    Volunteer: makeEntity("volunteers"),
    PrayerRequest: makeEntity("prayer_requests"),
    Survey: makeEntity("surveys"),
  },
  auth,
  functions,
  users,
};
