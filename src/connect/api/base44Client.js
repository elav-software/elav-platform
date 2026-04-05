/**
 * Base44 SDK compatibility shim for the connect app.
 * Replaces base44.entities.* calls with Supabase queries.
 * All public data - no user authentication required.
 */
import { supabase } from '@connect/api/supabaseClient';

// ---------------------------------------------------------------------------
// Helper: parse Base44-style sort string ('-field' means DESC)
// ---------------------------------------------------------------------------
function applySort(query, sort) {
  if (!sort) return query;
  const desc = sort.startsWith('-');
  const column = desc ? sort.slice(1) : sort;
  return query.order(column, { ascending: !desc });
}

// ---------------------------------------------------------------------------
// Generic entity factory
// ---------------------------------------------------------------------------
function createEntity(tableName) {
  return {
    /** list(sort?, limit?) */
    async list(sort, limit) {
      let q = supabase.from(tableName).select('*');
      if (sort) q = applySort(q, sort);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },

    /** filter(filters?, sort?) */
    async filter(filters, sort) {
      let q = supabase.from(tableName).select('*');
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

    /** create(data) */
    async create(data) {
      const { data: inserted, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return inserted;
    },

    /** update(id, data) */
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

    /** delete(id) */
    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },
  };
}

// ---------------------------------------------------------------------------
// Auth shim - no authentication in the public connect app
// ---------------------------------------------------------------------------
const auth = {
  me: async () => null,
  logout: () => {},
  redirectToLogin: () => {},
};

// ---------------------------------------------------------------------------
// Entity definitions (table names use connect_ prefix)
// ---------------------------------------------------------------------------
export const base44 = {
  auth,
  entities: {
    Service: createEntity('connect_services'),
    Sermon: createEntity('connect_sermons'),
    Devotional: createEntity('connect_devotionals'),
    Event: createEntity('connect_events'),
    Announcement: createEntity('connect_announcements'),
    PrayerRequest: createEntity('connect_prayer_requests'),
    CounselingRequest: createEntity('connect_counseling_requests'),
    EventRegistration: createEntity('connect_event_registrations'),
    SermonNote: createEntity('connect_sermon_notes'),
    BibleFavorite: createEntity('connect_bible_favorites'),
    Donation: createEntity('connect_donations'),
    MinistryMaterial: createEntity('connect_ministry_materials'),
    MinistryReport: createEntity('connect_ministry_reports'),
    DailyVerse: createEntity('connect_daily_verses'),
  },
  // No-op appLogs
  appLogs: {
    logUserInApp: async () => {},
  },
};
