/**
 * apiClient.js — CRM (panel administrativo)
 *
 * Cliente Supabase multi-tenant para el módulo CRM.
 * Todas las operaciones de escritura incluyen automáticamente el church_id
 * del usuario autenticado. Las lecturas son filtradas además por RLS.
 *
 * Reemplaza a base44Client.js (que era solo un shim de compatibilidad).
 * Uso: import { api } from '@crm/api/apiClient'
 */
import { supabase, supabaseToCRM, crmToSupabase } from "./supabaseClient";

// ---------------------------------------------------------------------------
// Resolución de church_id — se obtiene de la tabla church_users una sola vez
// ---------------------------------------------------------------------------

let _churchId = null;

async function getMyChurchId() {
  if (_churchId) return _churchId;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('church_users')
    .select('church_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  if (error || !data) {
    console.warn('[apiClient/crm] No se encontró church_id para este usuario.');
    return null;
  }
  _churchId = data.church_id;
  return _churchId;
}

// Limpia la caché al hacer logout (llamar desde AuthContext)
export { getMyChurchId };

export function clearChurchIdCache() {
  _churchId = null;
}

// ---------------------------------------------------------------------------
// Helper: parse sort string ("-created_date" → { column, ascending })
// ---------------------------------------------------------------------------
function parseOrder(orderStr = "-created_at") {
  const desc = orderStr.startsWith("-");
  const raw = desc ? orderStr.slice(1) : orderStr;
  const col = raw === "created_date" ? "created_at" : raw;
  return { column: col, ascending: !desc };
}

// ---------------------------------------------------------------------------
// Factory genérica — tablas CRM con columnas que ya coinciden con el CRM
// ---------------------------------------------------------------------------
function makeEntity(tableName) {
  return {
    async list(orderBy = "-created_at", limit = 500) {
      const { column, ascending } = parseOrder(orderBy);
      // RLS ya filtra por church_id, pero lo agregamos explícitamente
      // para claridad y como defensa en profundidad
      const churchId = await getMyChurchId();
      let q = supabase.from(tableName).select("*");
      if (churchId) q = q.eq("church_id", churchId);
      const { data, error } = await q.order(column, { ascending }).limit(limit);
      if (error) throw new Error(error.message);
      return data;
    },

    async filter(conditions = {}, orderBy = "-created_at", limit = 500) {
      const { column, ascending } = parseOrder(orderBy);
      const churchId = await getMyChurchId();
      let q = supabase.from(tableName).select("*");
      if (churchId) q = q.eq("church_id", churchId);
      Object.entries(conditions).forEach(([k, v]) => {
        q = q.eq(k, v);
      });
      const { data, error } = await q.order(column, { ascending }).limit(limit);
      if (error) throw new Error(error.message);
      return data;
    },

    async create(payload) {
      const churchId = await getMyChurchId();
      const data = churchId ? { ...payload, church_id: churchId } : payload;
      const { data: inserted, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return inserted;
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
// Entidad Member — tabla `personas` con traducción ES ↔ EN
// ---------------------------------------------------------------------------
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
      const churchId = await getMyChurchId();
      let q = supabase.from("personas").select("*");
      if (churchId) q = q.eq("church_id", churchId);
      // Filtrar líderes no aprobados
      q = q.or("rol.neq.Líder,and(rol.eq.Líder,estado_aprobacion.eq.aprobado)");
      const { data, error } = await q.order(column, { ascending }).limit(limit);
      if (error) throw new Error(error.message);
      return data.map(fromDB);
    },

    async filter(conditions = {}, orderBy = "-created_at", limit = 500) {
      const { column, ascending } = parseOrder(orderBy);
      const churchId = await getMyChurchId();
      let q = supabase.from("personas").select("*");
      if (churchId) q = q.eq("church_id", churchId);
      // Filtrar líderes no aprobados
      q = q.or("rol.neq.Líder,and(rol.eq.Líder,estado_aprobacion.eq.aprobado)");
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
      const churchId = await getMyChurchId();
      const dbData = toDB(payload);
      if (churchId) dbData.church_id = churchId;
      // Creado desde el CRM → aprobado automáticamente (el admin es quien carga)
      dbData.estado_aprobacion = "aprobado";
      const { data, error } = await supabase
        .from("personas")
        .insert(dbData)
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
// Capa Auth — Supabase Auth para el CRM
// ---------------------------------------------------------------------------
export const auth = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return {
      id: user.id,
      email: user.email,
      full_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "",
      role: user.app_metadata?.role ?? user.user_metadata?.role ?? "user",
    };
  },

  async logout(redirectUrl = "/") {
    clearChurchIdCache();
    await supabase.auth.signOut();
    window.location.href = redirectUrl;
  },

  redirectToLogin(_redirectUrl) {
    window.location.href = "/crm/login";
  },
};

// ---------------------------------------------------------------------------
// Capa Functions — geocodificación y rutas admin via Next.js API
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
      return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
    }

    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/crm/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
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
// Capa Users — invitaciones via Next.js API
// ---------------------------------------------------------------------------
const users = {
  async inviteUser(email, role) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/crm/invite-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ email, role }),
    });
    if (!res.ok) throw new Error("Failed to invite user");
    return res.json();
  },
};

// ---------------------------------------------------------------------------
// Exportación principal
// ---------------------------------------------------------------------------
export const api = {
  entities: {
    Member:        makeMemberEntity(),
    Visitor:       makeEntity("visitors"),
    Donation:      makeEntity("donations"),
    Event:         makeEntity("events"),
    Attendance:    makeEntity("event_attendance"),
    Leader:        makeEntity("leaders"),
    CellMember:    makeEntity("cell_members"),
    CellReport:    makeEntity("cell_reports"),
    Ministry:      makeEntity("ministries"),
    Volunteer:     makeEntity("volunteers"),
    PrayerRequest: makeEntity("prayer_requests"),
    Survey:        makeEntity("surveys"),
  },
  auth,
  functions,
  users,
};
