-- =============================================================================
-- CRM Tables Migration
-- Run this SQL in your Supabase project → SQL Editor
--
-- Tables: visitors, donations, events, event_attendance, leaders,
--         cell_members, cell_reports, ministries, volunteers,
--         prayer_requests, surveys
--
-- The `personas` table already exists from the censo form.
-- Each table uses:
--   - id UUID primary key (auto-generated)
--   - created_at TIMESTAMPTZ (auto-managed by Supabase)
-- Column names match the CRM entity field names directly (no translation needed).
-- =============================================================================

-- Enable UUID generation if not already enabled
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- visitors
-- ---------------------------------------------------------------------------
create table if not exists public.visitors (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text,
  phone       text,
  whatsapp    text,
  email       text,
  visit_date  date,
  invited_by  text,
  follow_up_status text default 'Pending',
  edad        integer,
  estado_civil text,
  barrio       text,
  notes       text
);

-- ---------------------------------------------------------------------------
-- donations
-- ---------------------------------------------------------------------------
create table if not exists public.donations (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  donor_name    text,
  amount        numeric(12, 2),
  donation_type text,   -- Tithe, Offering, Special, etc.
  date          date,
  payment_method text,
  notes         text,
  member_id     uuid references public.personas(id) on delete set null
);

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  title       text not null,
  description text,
  date        date,
  time        text,
  location    text,
  type        text,   -- Service, Meeting, Retreat, etc.
  notes       text
);

-- ---------------------------------------------------------------------------
-- event_attendance
-- ---------------------------------------------------------------------------
create table if not exists public.event_attendance (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_id   uuid references public.events(id) on delete cascade,
  member_id  uuid references public.personas(id) on delete set null,
  name       text,   -- for non-members / guests
  status     text default 'Present'
);

-- ---------------------------------------------------------------------------
-- leaders
-- ---------------------------------------------------------------------------
create table if not exists public.leaders (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  full_name        text not null,
  phone            text,
  email            text,
  cell_name        text,
  meeting_day      text,
  meeting_time     text,
  meeting_location text,
  district         text,
  notes            text,
  latitude         numeric(10, 7),
  longitude        numeric(10, 7),
  member_id        uuid references public.personas(id) on delete set null,
  supabase_id      text   -- legacy field kept for compatibility
);

-- ---------------------------------------------------------------------------
-- cell_members
-- ---------------------------------------------------------------------------
create table if not exists public.cell_members (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  leader_id   uuid references public.leaders(id) on delete cascade,
  member_name text not null,
  phone       text,
  join_date   date,
  status      text default 'Active'   -- Active | Inactive
);

-- ---------------------------------------------------------------------------
-- cell_reports
-- ---------------------------------------------------------------------------
create table if not exists public.cell_reports (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  leader_id     uuid references public.leaders(id) on delete cascade,
  date          date not null,
  topic         text,
  attendance    integer default 0,
  visits        integer default 0,
  new_converts  integer default 0,
  offering      numeric(12, 2) default 0,
  notes         text
);

-- ---------------------------------------------------------------------------
-- ministries
-- ---------------------------------------------------------------------------
create table if not exists public.ministries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  description text,
  leader_id   uuid references public.personas(id) on delete set null,
  meeting_day text,
  meeting_time text,
  location    text,
  notes       text
);

-- ---------------------------------------------------------------------------
-- volunteers
-- ---------------------------------------------------------------------------
create table if not exists public.volunteers (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  ministry_id  uuid references public.ministries(id) on delete cascade,
  member_id    uuid references public.personas(id) on delete set null,
  name         text not null,
  role         text,
  join_date    date,
  status       text default 'Active'
);

-- ---------------------------------------------------------------------------
-- prayer_requests
-- ---------------------------------------------------------------------------
create table if not exists public.prayer_requests (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  requester_name  text,
  category        text,
  request         text,
  status          text default 'Pending',
  is_anonymous    boolean default false,
  notes           text
);

-- ---------------------------------------------------------------------------
-- surveys
-- ---------------------------------------------------------------------------
create table if not exists public.surveys (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  respondent_name    text,
  survey_type        text,
  satisfaction_score integer,
  comments           text,
  date               date,
  follow_up_needed   boolean default false
);

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- Enable RLS and create policies so only authenticated users can read/write.
-- Adjust these policies to match your auth requirements.
-- ---------------------------------------------------------------------------

alter table public.visitors         enable row level security;
alter table public.donations        enable row level security;
alter table public.events           enable row level security;
alter table public.event_attendance enable row level security;
alter table public.leaders          enable row level security;
alter table public.cell_members     enable row level security;
alter table public.cell_reports     enable row level security;
alter table public.ministries       enable row level security;
alter table public.volunteers       enable row level security;
alter table public.prayer_requests  enable row level security;
alter table public.surveys          enable row level security;

-- Allow authenticated users full access to all CRM tables
do $$
declare
  tbl text;
  tables text[] := array[
    'visitors','donations','events','event_attendance','leaders',
    'cell_members','cell_reports','ministries','volunteers',
    'prayer_requests','surveys'
  ];
begin
  foreach tbl in array tables loop
    -- Drop first (idempotent), then recreate
    execute format(
      'drop policy if exists "authenticated_full_access" on public.%I', tbl
    );
    execute format(
      'create policy "authenticated_full_access" on public.%I
       for all to authenticated using (true) with check (true)',
      tbl
    );
  end loop;
end $$;
