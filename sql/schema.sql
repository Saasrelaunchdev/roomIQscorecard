-- =====================================================================================================================
-- The Invisible Work Scorecard: where it keeps its scorecards, its analytics, its emails and its settings, in Supabase.
-- =====================================================================================================================
--
-- Run it in the SAME Supabase project as the landing page: SQL Editor > New query > paste this whole file > Run.
-- It is safe to run again (after an update too): it creates only what is missing, adds new columns to old tables,
-- replaces its functions, and never deletes a row. It does not touch the landing page's tables (public.leads,
-- public.purchases) or its functions; everything here is named scorecard_..., plus one reading view in the landing
-- page's private reports schema (named <brand>_reports by the scaffold; roomiq_first_deal_reports in the template).
--
-- What it creates
--   public.scorecard_assessments    One row per completed scorecard: contact, answers, results (on screen and for the
--                                   report), the deepener, the call, time spent per question, approximate location
--                                   (country, state, city from the IP address; never precise), device, the public
--                                   profile facts the team reads, the report's state, consent, attribution.
--   public.scorecard_events         The pages' own analytics: one row per event (view, start, step, result...), with a
--                                   random visit id, the step's seconds, and coarse dimensions (state, device, source).
--                                   Nothing personal.
--   public.scorecard_emails         Every email sent (to owners and to the team) and what Resend reported back:
--                                   delivered, opened, clicked, bounced.
--   public.scorecard_settings       The admin's settings (the report's letter, who signs it and its sections; who on the
--                                   team gets lead notices, and whether the PDF goes with them), changed without a deploy.
--   roomiq_first_deal_reports.scorecard_leads   A flat, readable view of the scorecards for the Table Editor (optional reading).
--   Functions                       scorecard_submit, scorecard_event_counts, scorecard_event_dims,
--                                   scorecard_step_times, scorecard_report_viewed, scorecard_email_event,
--                                   scorecard_health.
--
-- Who can reach it: only the scorecard's server, with a secret key (SUPABASE_SECRET_KEY). Row level security is on
-- with no policies, and the public roles (anon, authenticated) have no grant on the tables, the view or the functions.
-- You read everything in the scorecard's admin (/admin); you never need to open Supabase.
-- =====================================================================================================================

create extension if not exists pgcrypto;

/* ---------- The scorecards ---------- */
create table if not exists public.scorecard_assessments (
  id              uuid primary key default gen_random_uuid(),
  token           text not null unique,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  form            text not null default 'scorecard-roomiq-first-deal',
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
comment on table public.scorecard_assessments is 'scorecard v2: one row per completed Invisible Work Scorecard, written by the scorecard''s server (sql/schema.sql).';

-- Version 1 tables gain what version 2 adds
alter table public.scorecard_assessments add column if not exists last_name text;
alter table public.scorecard_assessments add column if not exists public_data jsonb;
alter table public.scorecard_assessments add column if not exists report jsonb;
alter table public.scorecard_assessments add column if not exists sent_at timestamptz;
alter table public.scorecard_assessments add column if not exists notes text;
alter table public.scorecard_assessments add column if not exists unsubscribed_at timestamptz;
alter table public.scorecard_assessments add column if not exists timing jsonb;            -- seconds per question, total, time on the page before starting
alter table public.scorecard_assessments add column if not exists deepener_timing jsonb;
alter table public.scorecard_assessments add column if not exists geo jsonb;               -- country, region (state), city, time zone: from the IP address, never precise
alter table public.scorecard_assessments add column if not exists device jsonb;            -- phone, tablet or computer; system; browser; in-app browser (Facebook, Instagram...)
alter table public.scorecard_assessments add column if not exists report_views integer not null default 0;
alter table public.scorecard_assessments add column if not exists pdf_downloads integer not null default 0;
alter table public.scorecard_assessments add column if not exists report_viewed_at timestamptz;

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

/* ---------- The pages' analytics ---------- */
create table if not exists public.scorecard_events (
  id       bigint generated always as identity primary key,
  at       timestamptz not null default now(),
  visit    text not null,
  variant  text not null default '',
  name     text not null,
  step     text not null default '',
  data     jsonb not null default '{}'::jsonb
);
comment on table public.scorecard_events is 'scorecard v2: the scorecard pages'' own analytics. A random visit id per browser session and coarse dimensions; nothing personal.';
alter table public.scorecard_events add column if not exists country text;
alter table public.scorecard_events add column if not exists region text;
alter table public.scorecard_events add column if not exists device text;
alter table public.scorecard_events add column if not exists inapp text;
alter table public.scorecard_events add column if not exists source text;
alter table public.scorecard_events add column if not exists assessment uuid;
create index if not exists scorecard_events_at_idx on public.scorecard_events (at desc);
create index if not exists scorecard_events_name_idx on public.scorecard_events (name, at desc);
create index if not exists scorecard_events_assessment_idx on public.scorecard_events (assessment, at desc) where assessment is not null;

/* ---------- Every email, and what Resend reported ---------- */
create table if not exists public.scorecard_emails (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  assessment_id uuid references public.scorecard_assessments (id) on delete set null,
  kind          text not null,
  to_email      text,
  subject       text,
  provider_id   text,
  status        text not null default 'sent',
  error         text,
  attachments   integer not null default 0,
  delivered_at  timestamptz,
  opened_at     timestamptz,
  clicked_at    timestamptz,
  bounced_at    timestamptz,
  events        jsonb not null default '[]'::jsonb
);
comment on table public.scorecard_emails is 'scorecard v2: every email the scorecard sent, and the delivery events Resend reported.';
do $$ begin
  alter table public.scorecard_emails add constraint scorecard_emails_status_check check (status in ('sent', 'failed', 'delivered', 'delayed', 'opened', 'clicked', 'bounced', 'complained'));
exception when duplicate_object then null; end $$;
create index if not exists scorecard_emails_created_idx on public.scorecard_emails (created_at desc);
create index if not exists scorecard_emails_assessment_idx on public.scorecard_emails (assessment_id, created_at desc);
create unique index if not exists scorecard_emails_provider_idx on public.scorecard_emails (provider_id) where provider_id is not null;

/* ---------- The admin's settings ---------- */
create table if not exists public.scorecard_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
comment on table public.scorecard_settings is 'scorecard v2: the admin''s settings (one row per group: report, notifications).';

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
drop trigger if exists scorecard_settings_touch on public.scorecard_settings;
create trigger scorecard_settings_touch before update on public.scorecard_settings for each row execute function public.scorecard_touch();

-- Only the server's role reaches the tables
alter table public.scorecard_assessments enable row level security;
alter table public.scorecard_events enable row level security;
alter table public.scorecard_emails enable row level security;
alter table public.scorecard_settings enable row level security;
revoke all on table public.scorecard_assessments, public.scorecard_events, public.scorecard_emails, public.scorecard_settings from anon, authenticated;
grant all on table public.scorecard_assessments, public.scorecard_events, public.scorecard_emails, public.scorecard_settings to service_role;

/* ---------- Functions ---------- */

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
  r.form := coalesce(nullif(btrim(r.form), ''), 'scorecard-roomiq-first-deal');
  r.email := nullif(lower(btrim(coalesce(r.email, ''))), '');
  r.answers := coalesce(r.answers, '{}'::jsonb);
  r.consent := coalesce(r.consent, '{}'::jsonb);
  r.tracking := coalesce(r.tracking, '{}'::jsonb);
  r.report_views := 0;
  r.pdf_downloads := 0;
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
comment on function public.scorecard_submit(jsonb) is 'scorecard v2: stores one scorecard, checked and rate-limited.';

-- Distinct visits per variant, event and step, in a period: the funnel and the question-by-question drop-off
create or replace function public.scorecard_event_counts(p_from timestamptz default null, p_to timestamptz default null)
returns table (variant text, name text, step text, visits bigint)
language sql stable security definer set search_path = ''
as $$
  select e.variant, e.name, e.step, count(distinct e.visit)
    from public.scorecard_events e
   where (p_from is null or e.at >= p_from) and (p_to is null or e.at < p_to)
   group by e.variant, e.name, e.step
$$;

-- Distinct visits per dimension (device, state, source, in-app browser, day) and milestone, in a period
create or replace function public.scorecard_event_dims(p_from timestamptz default null, p_to timestamptz default null)
returns table (dim text, value text, name text, visits bigint)
language sql stable security definer set search_path = ''
as $$
  with e as (
    select * from public.scorecard_events x
     where (p_from is null or x.at >= p_from) and (p_to is null or x.at < p_to)
       and x.name in ('view', 'start', 'complete', 'booked', 'deepener_saved')
  )
  select 'device', coalesce(e.device, ''), e.name, count(distinct e.visit) from e group by 2, 3
  union all
  select 'region', coalesce(e.country, '') || ':' || coalesce(e.region, ''), e.name, count(distinct e.visit) from e group by 2, 3
  union all
  select 'source', coalesce(e.source, ''), e.name, count(distinct e.visit) from e group by 2, 3
  union all
  select 'inapp', coalesce(e.inapp, ''), e.name, count(distinct e.visit) from e group by 2, 3
  union all
  select 'day', to_char(e.at at time zone 'UTC', 'YYYY-MM-DD'), e.name, count(distinct e.visit) from e group by 2, 3
$$;

-- Seconds spent on each question, by everyone who answered it (finished or not): the median and the slowest quarter
create or replace function public.scorecard_step_times(p_from timestamptz default null, p_to timestamptz default null)
returns table (step text, n bigint, median_ms integer, p75_ms integer)
language sql stable security definer set search_path = ''
as $$
  select e.step, count(*),
         (percentile_cont(0.5) within group (order by (e.data ->> 'ms')::numeric))::integer,
         (percentile_cont(0.75) within group (order by (e.data ->> 'ms')::numeric))::integer
    from public.scorecard_events e
   where e.name in ('step', 'deepener_step')
     and (e.data ->> 'ms') ~ '^[0-9]{1,8}$'
     and (p_from is null or e.at >= p_from) and (p_to is null or e.at < p_to)
   group by e.step
$$;

-- A report was opened (kind 'view') or its PDF downloaded (kind 'pdf'): counted on the scorecard, and logged as an event
create or replace function public.scorecard_report_viewed(p_id uuid, p_kind text)
returns void
language plpgsql volatile security definer set search_path = ''
as $$
begin
  update public.scorecard_assessments
     set report_views = report_views + case when p_kind = 'view' then 1 else 0 end,
         pdf_downloads = pdf_downloads + case when p_kind = 'pdf' then 1 else 0 end,
         report_viewed_at = now()
   where id = p_id;
  insert into public.scorecard_events (visit, variant, name, step, assessment)
  values ('report-' || p_id::text, '', case when p_kind = 'pdf' then 'pdf_download' else 'report_view' end, '', p_id);
end;
$$;

-- What Resend reported about an email: delivered, opened, clicked, bounced... The status only moves forward.
create or replace function public.scorecard_email_event(p_provider_id text, p_type text, p_at timestamptz default now(), p_data jsonb default '{}'::jsonb)
returns boolean
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_status text := case p_type
    when 'email.delivered' then 'delivered' when 'email.delivery_delayed' then 'delayed' when 'email.opened' then 'opened'
    when 'email.clicked' then 'clicked' when 'email.bounced' then 'bounced' when 'email.complained' then 'complained' else null end;
  v_rank jsonb := '{"failed":0,"sent":1,"delayed":2,"delivered":3,"opened":4,"clicked":5,"bounced":6,"complained":7}'::jsonb;
  v_found boolean;
begin
  if v_status is null then return false; end if;
  update public.scorecard_emails m
     set status = case when (v_rank ->> v_status)::int > coalesce((v_rank ->> m.status)::int, 0) then v_status else m.status end,
         delivered_at = case when v_status = 'delivered' then coalesce(m.delivered_at, p_at) else m.delivered_at end,
         opened_at = case when v_status = 'opened' then coalesce(m.opened_at, p_at) else m.opened_at end,
         clicked_at = case when v_status = 'clicked' then coalesce(m.clicked_at, p_at) else m.clicked_at end,
         bounced_at = case when v_status = 'bounced' then coalesce(m.bounced_at, p_at) else m.bounced_at end,
         events = case when jsonb_array_length(m.events) < 100 then m.events || jsonb_build_array(jsonb_build_object('type', v_status, 'at', p_at, 'data', p_data)) else m.events end
   where m.provider_id = p_provider_id
  returning true into v_found;
  if v_found and v_status = 'complained' then
    -- A spam complaint means no more email to that address: the lead counts as unsubscribed
    update public.scorecard_assessments a set unsubscribed_at = coalesce(a.unsubscribed_at, p_at)
     where a.id in (select m.assessment_id from public.scorecard_emails m where m.provider_id = p_provider_id and m.kind not like 'team%');
  end if;
  return coalesce(v_found, false);
end;
$$;

create or replace function public.scorecard_health()
returns text language sql stable set search_path = '' as $$ select 'scorecard v2'::text $$;

-- Only the server calls them
revoke all on function public.scorecard_submit(jsonb) from public, anon, authenticated;
revoke all on function public.scorecard_event_counts(timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.scorecard_event_dims(timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.scorecard_step_times(timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.scorecard_report_viewed(uuid, text) from public, anon, authenticated;
revoke all on function public.scorecard_email_event(text, text, timestamptz, jsonb) from public, anon, authenticated;
revoke all on function public.scorecard_health() from public, anon, authenticated;
grant execute on function public.scorecard_submit(jsonb) to service_role;
grant execute on function public.scorecard_event_counts(timestamptz, timestamptz) to service_role;
grant execute on function public.scorecard_event_dims(timestamptz, timestamptz) to service_role;
grant execute on function public.scorecard_step_times(timestamptz, timestamptz) to service_role;
grant execute on function public.scorecard_report_viewed(uuid, text) to service_role;
grant execute on function public.scorecard_email_event(text, text, timestamptz, jsonb) to service_role;
grant execute on function public.scorecard_health() to service_role;

/* ---------- A readable view for the Table Editor (schema roomiq_first_deal_reports, which the Data API does not serve) ---------- */
create schema if not exists roomiq_first_deal_reports;
revoke all on schema roomiq_first_deal_reports from public, anon, authenticated;
create or replace view roomiq_first_deal_reports.scorecard_leads with (security_invoker = true) as
select
  s.created_at,
  s.status,
  s.first_name,
  s.last_name,
  s.email,
  s.company                                                as business,
  s.city                                                   as city_typed,
  s.geo ->> 'region'                                       as state_from_ip,
  s.geo ->> 'city'                                         as city_from_ip,
  s.trade,
  s.score,
  s.tier,
  (s.report_result ->> 'score')::int                       as report_score,
  s.bottleneck                                             as fix_first,
  s.fit,
  s.route,
  s.answers ->> 'jobs'                                     as jobs_a_week,
  s.answers ->> 'asked10'                                  as asked_of_last_10,
  s.answers ->> 'asks'                                     as how_asked,
  s.answers ->> 'newest'                                   as newest_review,
  s.answers ->> 'replies'                                  as replies,
  s.answers ->> 'ticket'                                   as ticket,
  s.answers ->> 'records'                                  as jobs_recorded_in,
  s.answers ->> 'profiles'                                 as google_profiles,
  (s.result -> 'invisible' ->> 'unasked')::int             as unasked_customers_a_year,
  (s.result -> 'invisible' ->> 'workValue')::int           as invisible_work_dollars,
  s.deepened_at is not null                                as deepened,
  s.booking ->> 'day'                                      as call_day,
  s.booking ->> 'window'                                   as call_window,
  s.booking ->> 'phone'                                    as phone,
  s.sent_at                                                as report_sent_at,
  s.report_views,
  s.pdf_downloads,
  round(((s.timing ->> 'totalMs')::numeric) / 1000)        as seconds_to_finish,
  s.device ->> 'type'                                      as device,
  s.device ->> 'inApp'                                     as in_app_browser,
  s.tracking ->> 'utm_source'                              as utm_source,
  s.tracking ->> 'utm_campaign'                            as utm_campaign,
  s.variant,
  s.id
from public.scorecard_assessments s;
revoke all on roomiq_first_deal_reports.scorecard_leads from public, anon, authenticated;

-- The REST API sees the new functions at once
notify pgrst, 'reload schema';

-- Handy queries (run them in the SQL Editor; they are not part of the setup):
--   select * from roomiq_first_deal_reports.scorecard_leads order by created_at desc;
--   select status, count(*) from public.scorecard_assessments group by status;
--   select kind, status, count(*) from public.scorecard_emails group by 1, 2 order by 1, 2;
--   delete from public.scorecard_events where at < now() - interval '13 months';   -- keep a year of analytics
