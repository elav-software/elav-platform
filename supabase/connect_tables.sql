-- =============================================================================
-- connect_tables.sql
-- Run in Supabase SQL Editor to create the public church website tables.
-- All tables are read-only for the public (anon key), write for service_role.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Services / Cultos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS connect_services (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  date         date NOT NULL,
  time         text,
  description  text,
  youtube_url  text,
  thumbnail_url text,
  is_live      boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE connect_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_services" ON connect_services;
CREATE POLICY "public_read_services" ON connect_services FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- Sermons / Sermones
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS connect_sermons (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  date          date NOT NULL,
  speaker       text,
  youtube_url   text,
  description   text,
  thumbnail_url text,
  series        text,
  duration_min  integer,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE connect_sermons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_sermons" ON connect_sermons;
CREATE POLICY "public_read_sermons" ON connect_sermons FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- Devotionals / Devocionales
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS connect_devotionals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  content         text NOT NULL,
  scripture       text,
  scripture_text  text,
  author_name     text,
  publish_date    date NOT NULL,
  is_published    boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE connect_devotionals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_devotionals" ON connect_devotionals;
CREATE POLICY "public_read_devotionals" ON connect_devotionals FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- Events / Eventos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS connect_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  date         date NOT NULL,
  time         text,
  location     text,
  description  text,
  image_url    text,
  category     text,
  is_featured  boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  max_capacity integer,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE connect_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_events" ON connect_events;
CREATE POLICY "public_read_events" ON connect_events FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- Announcements / Anuncios
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS connect_announcements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  content      text NOT NULL,
  image_url    text,
  publish_date date NOT NULL,
  is_published boolean NOT NULL DEFAULT true,
  priority     text NOT NULL DEFAULT 'normal', -- normal | important | urgent
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE connect_announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_announcements" ON connect_announcements;
CREATE POLICY "public_read_announcements" ON connect_announcements FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- Prayer Requests / Peticiones de Oración
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS connect_prayer_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text,
  request      text NOT NULL,
  is_anonymous boolean NOT NULL DEFAULT false,
  is_public    boolean NOT NULL DEFAULT false,
  status       text NOT NULL DEFAULT 'active', -- active | answered
  prayer_count integer NOT NULL DEFAULT 0,
  created_date timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE connect_prayer_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_prayer_requests" ON connect_prayer_requests;
CREATE POLICY "public_read_prayer_requests" ON connect_prayer_requests
  FOR SELECT USING (is_public = true AND status = 'active');

DROP POLICY IF EXISTS "public_insert_prayer_requests" ON connect_prayer_requests;
CREATE POLICY "public_insert_prayer_requests" ON connect_prayer_requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_prayer_count" ON connect_prayer_requests;
CREATE POLICY "public_update_prayer_count" ON connect_prayer_requests
  FOR UPDATE USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Counseling Requests / Solicitudes de Consejería
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS connect_counseling_requests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_name text NOT NULL,
  requester_email text,
  requester_phone text,
  topic          text,
  message        text NOT NULL,
  status         text NOT NULL DEFAULT 'pending', -- pending | contacted | closed
  created_date   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE connect_counseling_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_insert_counseling" ON connect_counseling_requests;
CREATE POLICY "public_insert_counseling" ON connect_counseling_requests
  FOR INSERT WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Event Registrations / Inscripciones a Eventos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS connect_event_registrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid REFERENCES connect_events(id) ON DELETE CASCADE,
  attendee_name   text NOT NULL,
  attendee_email  text,
  attendee_phone  text,
  guests          integer NOT NULL DEFAULT 0,
  created_date    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE connect_event_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_insert_registrations" ON connect_event_registrations;
CREATE POLICY "public_insert_registrations" ON connect_event_registrations
  FOR INSERT WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Daily Verses / Versículos Diarios (optional)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS connect_daily_verses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verse_text  text NOT NULL,
  reference   text NOT NULL,
  date        date NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE connect_daily_verses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_verses" ON connect_daily_verses;
CREATE POLICY "public_read_verses" ON connect_daily_verses FOR SELECT USING (true);
