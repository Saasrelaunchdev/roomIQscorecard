-- =====================================================================================================================
-- The Invisible Work Scorecard: where it keeps its scorecards and its analytics, in Supabase.
-- =====================================================================================================================
--
-- Run it once: Supabase dashboard > SQL Editor > New query > paste this whole file > Run. It is safe to run again (after
-- an update too): it creates only what is missing, replaces its functions, and never deletes a row.
--
-- It can share the landing page's Supabase project (its public.leads table is left alone) or use its own.
--
-- What it creates
--   public.scorecard_assessments      One row per completed scorecard: the contact, the answers, the results on screen and
--                                     for the report, the deepener, the call, the public profile facts the team reads, the
--                                     report's review state, consent and attribution.
--   public.scorecard_events           The pages' own analytics: one row per event (a view, a start, a step answered...), with
--                                     a random visit id and nothing personal.
--   public.scorecard_submit(jsonb)    Stores one scorecard, rate-limited (5 an hour per email, 20 per network, 500 for the site).
--   public.scorecard_event_counts()   Distinct visits per variant, event and step, for the admin's Insights.
--   public.scorecard_health()         Lets GET /api/scorecard confirm this file ran in the project the site points at.
--
-- Who can reach it: only the server, with the secret key (SUPABASE_SECRET_KEY). Row level security is on with no policies,
-- and the public roles (anon, authenticated) have no grant on the tables or the functions. Read your scorecards in the
-- admin (/admin), or here in the Table Editor.
-- =====================================================================================================================

create extension if not exists pgcrypto;

create table if not exists public.scorecard_assessments (
  id              uuid primary key default gen_random_uuid(),
  token           text not null unique,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  form            text not null default 'scorecard-invisible-work',
  status          text not null default 'new',
  email           text,
  first_name      text,
  last_name       text,
  company         text,
  city            text,
  profiles        text,
  trade           text,
  visit           text,
  variant         text,
  answers         jsonb not null default '{}'::jsonb,
  result          jsonb,
  deepener        jsonb,
  deepened_at     timestamptz,
  report_result   jsonb,
  booking         jsonb,
  booked_at       timestamptz,
  public_data     jsonb,
  report          jsonb,
  sent_at         timestamptz,
  consent         jsonb not null default '{}'::jsonb,
  tracking        jsonb not null default '{}'::jsonb,
  fit             text,
  route           text,
  score           integer,
  tier            text,
  bottleneck      text,
  ip_hash         text,
  notes           text,
  unsubscribed_at timestamptz
);

comment on table public.scorecard_assessments is 'scorecard v1: one row per completed Invisible Work Scorecard, written by the scorecard''s server (sql/schema.sql in the RempoScorecard repository).';

-- An older version of this table gains what it lacks
alter table public.scorecard_assessments add column if not exists last_name text;
alter table public.scorecard_assessments add column if not exists public_data jsonb;
alter table public.scorecard_assessments add column if not exists report jsonb;
alter table public.scorecard_assessments add column if not exists sent_at timestamptz;
alter table public.scorecard_assessments add column if not exists notes text;
alter table public.scorecard_assessments add column if not exists unsubscribed_at timestamptz;

do $$ begin
  alter table public.scorecard_assessments add constraint scorecard_status_check check (status in ('new', 'booked', 'ready', 'sent', 'closed', 'spam'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.scorecard_assessments add constraint scorecard_token_check check (token ~ '^[A-Za-z0-9_-]{24,64}$');
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.scorecard_assessments add constraint scorecard_score_check check (score is null or score between 0 and 100);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.scorecard_assessments add constraint scorecard_email_check check (email is null or email ~ '^[^[:space:]@<>,]+@[^[:space:]@<>,]+\.[^[:space:]@<>,]+$');
exception when duplicate_object then null; end $$;

create index if not exists scorecard_created_idx on public.scorecard_assessments (created_at desc);
create index if not exists scorecard_email_idx on public.scorecard_assessments (lower(email), created_at desc);
create index if not exists scorecard_status_idx on public.scorecard_assessments (status, created_at desc);
create index if not exists scorecard_ip_idx on public.scorecard_assessments (ip_hash, created_at desc) where ip_hash is not null;

create table if not exists public.scorecard_events (
  id       bigint generated always as identity primary key,
  at       timestamptz not null default now(),
  visit    text not null,
  variant  text not null default '',
  name     text not null,
  step     text not null default '',
  data     jsonb not null default '{}'::jsonb
);
comment on table public.scorecard_events is 'scorecard v1: the scorecard pages'' own analytics. A random visit id per browser session, nothing personal.';
create index if not exists scorecard_events_at_idx on public.scorecard_events (at desc);
create index if not exists scorecard_events_name_idx on public.scorecard_events (name, at desc);

-- updated_at follows every change
create or replace function public.scorecard_touch()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists scorecard_touch on public.scorecard_assessments;
create trigger scorecard_touch before update on public.scorecard_assessments for each row execute function public.scorecard_touch();

-- Only the server's role reaches the tables
alter table public.scorecard_assessments enable row level security;
alter table public.scorecard_events enable row level security;
revoke all on table public.scorecard_assessments from anon, authenticated;
revoke all on table public.scorecard_events from anon, authenticated;
grant all on table public.scorecard_assessments to service_role;
grant all on table public.scorecard_events to service_role;

-- Stores one scorecard. The server sends the whole row as JSON (its token included); this checks it, rate-limits it,
-- fills the defaults and returns the stored row.
create or replace function public.scorecard_submit(payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  r public.scorecard_assessments;
begin
  if jsonb_typeof(payload) is distinct from 'object' then
    raise exception 'The scorecard must be a JSON object' using errcode = '22023';
  end if;
  r := jsonb_populate_record(null::public.scorecard_assessments, payload);
  r.id := gen_random_uuid();
  r.created_at := now();
  r.updated_at := now();
  r.status := coalesce(nullif(btrim(r.status), ''), 'new');
  r.form := coalesce(nullif(btrim(r.form), ''), 'scorecard-invisible-work');
  r.email := nullif(lower(btrim(coalesce(r.email, ''))), '');
  r.answers := coalesce(r.answers, '{}'::jsonb);
  r.consent := coalesce(r.consent, '{}'::jsonb);
  r.tracking := coalesce(r.tracking, '{}'::jsonb);
  if r.token is null or r.token !~ '^[A-Za-z0-9_-]{24,64}$' then
    raise exception 'A token is required' using errcode = '22023';
  end if;
  if r.email is null then
    raise exception 'A valid email is required' using errcode = '22023';
  end if;
  -- Rate limits, an hour at a time: 5 per email, 20 per network (the hashed IP), 500 for the whole site
  if (select count(*) from public.scorecard_assessments s where lower(s.email) = r.email and s.created_at > now() - interval '1 hour') >= 5
     or (r.ip_hash is not null and (select count(*) from public.scorecard_assessments s where s.ip_hash = r.ip_hash and s.created_at > now() - interval '1 hour') >= 20)
     or (select count(*) from public.scorecard_assessments s where s.created_at > now() - interval '1 hour') >= 500 then
    raise exception 'Too many submissions. Please try again later' using errcode = 'PT429';
  end if;
  insert into public.scorecard_assessments values (r.*);
  return to_jsonb(r);
end;
$$;
comment on function public.scorecard_submit(jsonb) is 'scorecard v1: stores one scorecard, checked and rate-limited.';
revoke all on function public.scorecard_submit(jsonb) from public, anon, authenticated;
grant execute on function public.scorecard_submit(jsonb) to service_role;

-- Distinct visits per variant, event and step, in a period: what the admin's Insights are computed from
create or replace function public.scorecard_event_counts(p_from timestamptz default null, p_to timestamptz default null)
returns table (variant text, name text, step text, visits bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select e.variant, e.name, e.step, count(distinct e.visit)
    from public.scorecard_events e
   where (p_from is null or e.at >= p_from) and (p_to is null or e.at < p_to)
   group by e.variant, e.name, e.step
$$;
revoke all on function public.scorecard_event_counts(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.scorecard_event_counts(timestamptz, timestamptz) to service_role;

create or replace function public.scorecard_health()
returns text
language sql
stable
set search_path = ''
as $$ select 'scorecard v1'::text $$;
revoke all on function public.scorecard_health() from public, anon, authenticated;
grant execute on function public.scorecard_health() to service_role;

-- The REST API sees the new functions at once
notify pgrst, 'reload schema';

-- Handy queries (run them in the SQL Editor; they are not part of the setup):
--   select created_at, company, city, first_name, email, score, tier, bottleneck, status from public.scorecard_assessments order by created_at desc;
--   select status, count(*) from public.scorecard_assessments group by status;
--   select name, step, count(distinct visit) from public.scorecard_events where at > now() - interval '7 days' group by 1, 2 order by 1, 2;
--   delete from public.scorecard_events where at < now() - interval '13 months';   -- keep a year of analytics
