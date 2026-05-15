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
// El superadmin puede cambiar de iglesia en tiempo de ejecución
// ---------------------------------------------------------------------------

let _churchId = null;
let _role = null;

// Superadmin: iglesia actualmente seleccionada (se guarda en sessionStorage)
const SUPERADMIN_CHURCH_KEY = 'superadmin_selected_church';

export function getSuperadminSelectedChurch() {
  return sessionStorage.getItem(SUPERADMIN_CHURCH_KEY);
}

export function setSuperadminSelectedChurch(churchId) {
  sessionStorage.setItem(SUPERADMIN_CHURCH_KEY, churchId);
  _churchId = churchId; // actualizar caché
}

async function getMyChurchId() {
  // Superadmin: usa la iglesia seleccionada en el selector
  const selected = getSuperadminSelectedChurch();
  if (selected) return selected;

  if (_churchId) return _churchId;
  // Usar getSession() — no hace llamada de red extra
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const { data, error } = await supabase
    .from('church_users')
    .select('church_id, role')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .not('church_id', 'is', null)
    .limit(1)
    .maybeSingle();
  if (error || !data) {
    console.warn('[apiClient/crm] No se encontró church_id para este usuario.');
    return null;
  }
  _role = data.role;
  _churchId = data.church_id;
  return _churchId;
}

export async function getMyRole() {
  if (_role) return _role;
  // Usar getSession() — no hace llamada de red extra
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  if (session.user.user_metadata?.role === 'superadmin') {
    _role = 'superadmin';
    return _role;
  }
  // Fallback: consultar church_users
  const { data } = await supabase
    .from('church_users')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .maybeSingle();
  _role = data?.role ?? null;
  return _role;
}

// Limpia la caché al hacer logout (llamar desde AuthContext)
export { getMyChurchId };

export function clearChurchIdCache() {
  _churchId = null;
  _role = null;
  sessionStorage.removeItem(SUPERADMIN_CHURCH_KEY);
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
      const address = params.address || "";
      const district = params.district || "";

      const wait = () => new Promise(r => setTimeout(r, 1100));

      const nominatim = async (q) => {
        const query = q.toLowerCase().includes("argentina") ? q : `${q}, Argentina`;
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=es&countrycodes=ar`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const res = await fetch(url, { headers: { "User-Agent": "censo-iglesia-crm/1.0" }, signal: controller.signal });
          if (!res.ok) {
            console.warn(`[Geocoding] Nominatim HTTP ${res.status} para: "${query}"`);
            return null;
          }
          const data = await res.json();
          console.log(`[Geocoding] "${query}" →`, data.length > 0 ? `lat=${data[0].lat}, lon=${data[0].lon}` : "sin resultados");
          return data.length > 0 ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
        } finally {
          clearTimeout(timeout);
        }
      };

      // Intento 1: dirección completa
      const result1 = await nominatim(address);
      if (result1) return result1;

      // Construir partes limpias (sin códigos postales, provincia, Argentina, duplicados)
      const parts = address.split(',').map(p => p.trim()).filter(p =>
        p &&
        !/^[A-Z]\d{4}/.test(p) &&
        !/^provincia/i.test(p) &&
        !/^argentina$/i.test(p)
      );
      const seen = new Set();
      const unique = parts.filter(p => { const k = p.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });

      // Intento 2: calle + localidad simplificados
      if (unique.length >= 2) {
        const simplified = `${unique[0]}, ${unique[unique.length - 1]}, Argentina`;
        await wait();
        const result2 = await nominatim(simplified);
        if (result2) return result2;
      }

      // Intento 3: solo el district pasado explícitamente (ej: "González Catán")
      // Útil cuando la calle no está en OpenStreetMap pero la localidad sí
      if (district && district.trim()) {
        await wait();
        const result3 = await nominatim(district);
        if (result3) return result3;
      }

      // Intento 4: extraer la localidad de la dirección (último segmento significativo)
      if (unique.length >= 2) {
        const locality = unique[unique.length - 1];
        await wait();
        return await nominatim(locality);
      }

      return null;
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
// Exportación principal
// ---------------------------------------------------------------------------
export const api = {
  entities: {
    Member:        makeMemberEntity(),
    Visitor:       makeEntity("visitors"),
    Donation:      makeEntity("donations"),
    Gasto:         makeEntity("gastos"),
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
};
