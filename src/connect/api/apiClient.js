/**
 * apiClient.js — Connect (web pública)
 *
 * Cliente Supabase multi-tenant para el módulo Connect.
 * Todas las queries se filtran automáticamente por el church_id
 * de la iglesia activa, detectado desde el hostname.
 *
 * Reemplaza a base44Client.js (que era solo un shim de compatibilidad).
 * Uso: import { api } from '@connect/api/apiClient'
 */
import { supabase } from '@connect/api/supabaseClient';

// ---------------------------------------------------------------------------
// Resolución de iglesia — detecta el church_id por el dominio del navegador
// No requiere configuración de código: cada iglesia se registra solo en Supabase.
// ---------------------------------------------------------------------------

// Caché de church_id para la sesión del navegador (una sola query al cargar)
let _churchId = null;

async function getChurchId() {
  if (_churchId) return _churchId;
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  let result;
  if (isLocal) {
    // Desarrollo local: resolver por slug desde ?church= o variable de entorno
    const slug =
      new URLSearchParams(window.location.search).get('church') ??
      process.env.NEXT_PUBLIC_DEFAULT_CHURCH_SLUG ??
      'cfc';
    result = await supabase
      .from('churches')
      .select('id')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
  } else {
    // Producción: resolver directamente por dominio
    // Strip www. y subdominios conocidos (crm., censo.) para obtener el dominio raíz
    const rootDomain = hostname
      .replace(/^www\./, '')
      .replace(/^(crm|censo|portal)\./, '');
    result = await supabase
      .from('churches')
      .select('id')
      .eq('custom_domain', rootDomain)
      .eq('is_active', true)
      .single();
  }

  if (result.error || !result.data) {
    console.warn(`[apiClient/connect] No se encontró iglesia activa para este dominio.`);
    return null;
  }
  _churchId = result.data.id;
  return _churchId;
}

// Expone el church_id resuelto para uso en formularios (censo, prayer, etc.)
export async function getCurrentChurchId() {
  return getChurchId();
}

// ---------------------------------------------------------------------------
// Helper: parse sort string ('-field' = DESC)
// ---------------------------------------------------------------------------
function applySort(query, sort) {
  if (!sort) return query;
  const desc = sort.startsWith('-');
  const column = desc ? sort.slice(1) : sort;
  return query.order(column, { ascending: !desc });
}

// ---------------------------------------------------------------------------
// Factory de entidades — todas las operaciones filtradas por church_id
// ---------------------------------------------------------------------------
function createEntity(tableName) {
  return {
    async list(sort, limit) {
      const churchId = await getChurchId();
      let q = supabase.from(tableName).select('*');
      if (churchId) q = q.eq('church_id', churchId);
      if (sort)  q = applySort(q, sort);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },

    async filter(filters, sort) {
      const churchId = await getChurchId();
      let q = supabase.from(tableName).select('*');
      if (churchId) q = q.eq('church_id', churchId);
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value === undefined || value === null) continue;
          q = q.eq(key, value);
        }
      }
      if (sort) q = applySort(q, sort);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },

    async create(data) {
      const churchId = await getChurchId();
      const payload = churchId ? { ...data, church_id: churchId } : data;
      const { data: inserted, error } = await supabase
        .from(tableName)
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return inserted;
    },

    async update(id, data) {
      const { data: updated, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },

    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },
  };
}

// ---------------------------------------------------------------------------
// Auth — la web pública es anónima, pero líderes pueden estar autenticados
// ---------------------------------------------------------------------------
const auth = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return {
      id: user.id,
      email: user.email,
      full_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        '',
      role: user.app_metadata?.role ?? user.user_metadata?.role ?? 'user',
    };
  },
  logout: async (redirectUrl = '/') => {
    _churchId = null;
    await supabase.auth.signOut();
    window.location.href = redirectUrl;
  },
  redirectToLogin: () => {},
};

// ---------------------------------------------------------------------------
// Exportación principal
// ---------------------------------------------------------------------------
export const api = {
  auth,
  entities: {
    Service:             createEntity('connect_services'),
    Sermon:              createEntity('connect_sermons'),
    Devotional:          createEntity('connect_devotionals'),
    Event:               createEntity('connect_events'),
    Announcement:        createEntity('connect_announcements'),
    PrayerRequest:       createEntity('connect_prayer_requests'),
    CounselingRequest:   createEntity('connect_counseling_requests'),
    EventRegistration:   createEntity('connect_event_registrations'),
    SermonNote:          createEntity('connect_sermon_notes'),
    BibleFavorite:       createEntity('connect_bible_favorites'),
    Donation:            createEntity('connect_donations'),
    MinistryMaterial:    createEntity('connect_ministry_materials'),
    MinistryReport:      createEntity('connect_ministry_reports'),
    DailyVerse:          createEntity('connect_daily_verses'),
  },
  appLogs: { logUserInApp: async () => {} },
};
