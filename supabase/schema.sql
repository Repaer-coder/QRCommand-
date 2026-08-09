create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free',
  stripe_customer_id text unique,
  business_type text,
  onboarding_completed_at timestamptz,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.organizations add column if not exists business_type text;
alter table public.organizations add column if not exists onboarding_completed_at timestamptz;
alter table public.organizations add column if not exists settings jsonb not null default '{}'::jsonb;
alter table public.organizations add column if not exists updated_at timestamptz not null default now();
update public.organizations set plan = case plan when 'starter' then 'essentials' when 'business' then 'premium' when 'enterprise' then 'pro_plus_ai' else plan end;

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  role text not null default 'member',
  location_id uuid,
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
alter table public.organization_members add column if not exists email text;
alter table public.organization_members add column if not exists location_id uuid;
alter table public.organization_members add column if not exists invited_by uuid references auth.users(id) on delete set null;
alter table public.organization_members add column if not exists joined_at timestamptz not null default now();

create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null default 'member',
  invited_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.locations add column if not exists updated_at timestamptz not null default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'organization_members_location_id_fkey') then
    alter table public.organization_members add constraint organization_members_location_id_fkey foreign key (location_id) references public.locations(id) on delete set null;
  end if;
end $$;

create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  name text not null,
  slug text unique not null,
  destination_url text not null,
  qr_type text not null default 'website',
  is_dynamic boolean not null default true,
  status text not null default 'active',
  style jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  password_hash text,
  scan_count bigint not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.qr_codes add column if not exists scan_count bigint not null default 0;

create table if not exists public.scan_events (
  id bigint generated always as identity primary key,
  qr_code_id uuid not null references public.qr_codes(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  country text,
  region text,
  city text,
  device_type text,
  browser text,
  os text,
  referrer text,
  ip_hash text
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid unique not null references public.organizations(id) on delete cascade,
  stripe_subscription_id text unique,
  status text not null,
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

create table if not exists public.blueprint_instances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  template_key text not null,
  name text not null,
  status text not null default 'draft',
  configuration jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  trigger_type text not null,
  trigger_config jsonb not null default '{}'::jsonb,
  condition_config jsonb not null default '{}'::jsonb,
  action_type text not null,
  action_config jsonb not null default '{}'::jsonb,
  enabled boolean not null default false,
  cooldown_minutes integer not null default 60,
  max_runs_per_hour integer not null default 4,
  retry_limit integer not null default 2,
  last_run_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rule_id uuid not null references public.automation_rules(id) on delete cascade,
  status text not null,
  attempt integer not null default 1,
  output jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  name text not null,
  status text not null default 'connected',
  config jsonb not null default '{}'::jsonb,
  encrypted_secret text,
  last_tested_at timestamptz,
  last_error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversion_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  qr_code_id uuid references public.qr_codes(id) on delete set null,
  event_type text not null,
  external_reference text,
  value_cents bigint,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  summary text not null,
  severity text not null default 'info',
  evidence jsonb not null default '[]'::jsonb,
  period_start timestamptz,
  period_end timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  rationale text not null,
  confidence text not null,
  supporting_metrics jsonb not null default '[]'::jsonb,
  status text not null default 'proposed',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_action_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recommendation_id uuid references public.ai_recommendations(id) on delete set null,
  action_type text not null,
  action_payload jsonb not null default '{}'::jsonb,
  status text not null default 'proposed',
  proposed_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  executed_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  operation text not null,
  model text,
  status text not null default 'started',
  input_tokens integer,
  output_tokens integer,
  request_id text,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists scan_events_qr_time_idx on public.scan_events(qr_code_id, scanned_at desc);
create index if not exists qr_codes_org_idx on public.qr_codes(organization_id);
create index if not exists qr_codes_slug_idx on public.qr_codes(slug);
create index if not exists members_user_idx on public.organization_members(user_id);
create index if not exists invitations_email_idx on public.team_invitations(lower(email));
create index if not exists automation_due_idx on public.automation_rules(enabled, last_run_at);
create index if not exists ai_usage_org_time_idx on public.ai_usage(organization_id, created_at desc);
create index if not exists audit_org_time_idx on public.audit_log(organization_id, created_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$ declare table_name text; begin
  foreach table_name in array array['organizations','locations','qr_codes','subscriptions','blueprint_instances','automation_rules','integrations','ai_recommendations']
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

create or replace function public.is_org_member(org_id uuid) returns boolean
language sql stable security definer set search_path = public set row_security = off as $$
  select exists(select 1 from public.organizations where id = org_id and owner_id = auth.uid())
    or exists(select 1 from public.organization_members where organization_id = org_id and user_id = auth.uid());
$$;

create or replace function public.org_role(org_id uuid) returns text
language sql stable security definer set search_path = public set row_security = off as $$
  select case
    when exists(select 1 from public.organizations where id = org_id and owner_id = auth.uid()) then 'owner'
    else (select role from public.organization_members where organization_id = org_id and user_id = auth.uid())
  end;
$$;

create or replace function public.has_org_role(org_id uuid, allowed_roles text[]) returns boolean
language sql stable security definer set search_path = public set row_security = off as $$
  select coalesce(public.org_role(org_id) = any(allowed_roles), false);
$$;

create or replace function public.claim_workspace_invites() returns integer
language plpgsql security definer set search_path = public, auth set row_security = off as $$
declare claimed integer := 0; user_email text;
begin
  if auth.uid() is null then return 0; end if;
  user_email := lower(coalesce(auth.jwt()->>'email', ''));
  if user_email = '' then return 0; end if;
  insert into public.organization_members(organization_id, user_id, email, role, invited_by)
  select i.organization_id, auth.uid(), user_email, i.role, i.invited_by
  from public.team_invitations i
  where lower(i.email) = user_email and i.accepted_at is null and i.expires_at > now()
  on conflict (organization_id, user_id) do nothing;
  get diagnostics claimed = row_count;
  update public.team_invitations set accepted_at = now()
  where lower(email) = user_email and accepted_at is null and expires_at > now();
  return claimed;
end;
$$;

create or replace function public.record_qr_scan(
  scan_slug text,
  scan_country text default null,
  scan_region text default null,
  scan_city text default null,
  scan_device text default null,
  scan_browser text default null,
  scan_os text default null,
  scan_referrer text default null,
  scan_ip_hash text default null
) returns table(code_id uuid, resolved_destination text)
language plpgsql security definer set search_path = public set row_security = off as $$
declare selected_code public.qr_codes%rowtype;
begin
  select * into selected_code from public.qr_codes
  where slug = scan_slug and status = 'active' and (expires_at is null or expires_at > now())
  for update;
  if not found then return; end if;
  update public.qr_codes set scan_count = scan_count + 1 where id = selected_code.id;
  insert into public.scan_events(qr_code_id,country,region,city,device_type,browser,os,referrer,ip_hash)
  values(selected_code.id,scan_country,scan_region,scan_city,scan_device,scan_browser,scan_os,left(scan_referrer,1000),scan_ip_hash);
  return query select selected_code.id, selected_code.destination_url;
end;
$$;

grant execute on function public.claim_workspace_invites() to authenticated;
revoke all on function public.record_qr_scan(text,text,text,text,text,text,text,text,text) from public;
grant execute on function public.record_qr_scan(text,text,text,text,text,text,text,text,text) to anon, authenticated;
revoke insert, update, delete on public.scan_events from anon, authenticated;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.team_invitations enable row level security;
alter table public.locations enable row level security;
alter table public.qr_codes enable row level security;
alter table public.scan_events enable row level security;
alter table public.subscriptions enable row level security;
alter table public.blueprint_instances enable row level security;
alter table public.automation_rules enable row level security;
alter table public.automation_runs enable row level security;
alter table public.integrations enable row level security;
alter table public.conversion_events enable row level security;
alter table public.ai_insights enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.ai_action_runs enable row level security;
alter table public.ai_usage enable row level security;
alter table public.audit_log enable row level security;
alter table public.stripe_webhook_events enable row level security;

-- Keep this schema safely re-runnable by replacing only this application's policies.
do $$ declare policy_row record; begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any(array[
        'organizations','organization_members','team_invitations','locations','qr_codes',
        'scan_events','subscriptions','blueprint_instances','automation_rules','automation_runs',
        'integrations','conversion_events','ai_insights','ai_recommendations','ai_action_runs',
        'ai_usage','audit_log','stripe_webhook_events'
      ])
  loop
    execute format('drop policy if exists %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
end $$;

drop policy if exists "members read organizations" on public.organizations;
drop policy if exists "owners manage organizations" on public.organizations;
create policy "members read organizations" on public.organizations for select to authenticated using (public.is_org_member(id));
create policy "owners create organizations" on public.organizations for insert to authenticated with check (owner_id = auth.uid());
create policy "owners update organizations" on public.organizations for update to authenticated using (public.has_org_role(id, array['owner','admin'])) with check (public.has_org_role(id, array['owner','admin']));
create policy "owners delete organizations" on public.organizations for delete to authenticated using (owner_id = auth.uid());

create policy "members read memberships" on public.organization_members for select to authenticated using (public.is_org_member(organization_id));
create policy "admins create memberships" on public.organization_members for insert to authenticated with check (public.has_org_role(organization_id, array['owner','admin']) or (user_id = auth.uid() and public.org_role(organization_id) = 'owner'));
create policy "admins update memberships" on public.organization_members for update to authenticated using (public.has_org_role(organization_id, array['owner','admin'])) with check (public.has_org_role(organization_id, array['owner','admin']));
create policy "admins delete memberships" on public.organization_members for delete to authenticated using (public.has_org_role(organization_id, array['owner','admin']) and role <> 'owner');

create policy "admins manage invitations" on public.team_invitations for all to authenticated using (public.has_org_role(organization_id, array['owner','admin'])) with check (public.has_org_role(organization_id, array['owner','admin']));
create policy "members read locations" on public.locations for select to authenticated using (public.is_org_member(organization_id));
create policy "managers create locations" on public.locations for insert to authenticated with check (public.has_org_role(organization_id, array['owner','admin','manager']));
create policy "managers update locations" on public.locations for update to authenticated using (public.has_org_role(organization_id, array['owner','admin','manager'])) with check (public.has_org_role(organization_id, array['owner','admin','manager']));
create policy "admins delete locations" on public.locations for delete to authenticated using (public.has_org_role(organization_id, array['owner','admin']));

drop policy if exists "members manage qr codes" on public.qr_codes;
drop policy if exists "public resolve active qr" on public.qr_codes;
create policy "members read qr codes" on public.qr_codes for select to authenticated using (public.is_org_member(organization_id));
create policy "members create qr codes" on public.qr_codes for insert to authenticated with check (public.is_org_member(organization_id) and created_by = auth.uid());
create policy "members update qr codes" on public.qr_codes for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "managers delete qr codes" on public.qr_codes for delete to authenticated using (public.has_org_role(organization_id, array['owner','admin','manager']));

drop policy if exists "members read scans" on public.scan_events;
drop policy if exists "public insert scans" on public.scan_events;
create policy "members read scans" on public.scan_events for select to authenticated using (exists(select 1 from public.qr_codes q where q.id = qr_code_id and public.is_org_member(q.organization_id)));
create policy "billing admins read subscriptions" on public.subscriptions for select to authenticated using (public.has_org_role(organization_id, array['owner','admin']));

create policy "members read blueprints" on public.blueprint_instances for select to authenticated using (public.is_org_member(organization_id));
create policy "managers manage blueprints" on public.blueprint_instances for all to authenticated using (public.has_org_role(organization_id, array['owner','admin','manager'])) with check (public.has_org_role(organization_id, array['owner','admin','manager']));
create policy "members read automation rules" on public.automation_rules for select to authenticated using (public.is_org_member(organization_id));
create policy "managers manage automation rules" on public.automation_rules for all to authenticated using (public.has_org_role(organization_id, array['owner','admin','manager'])) with check (public.has_org_role(organization_id, array['owner','admin','manager']));
create policy "members read automation runs" on public.automation_runs for select to authenticated using (public.is_org_member(organization_id));
create policy "managers create automation runs" on public.automation_runs for insert to authenticated with check (public.has_org_role(organization_id, array['owner','admin','manager']));
create policy "managers update automation runs" on public.automation_runs for update to authenticated using (public.has_org_role(organization_id, array['owner','admin','manager'])) with check (public.has_org_role(organization_id, array['owner','admin','manager']));
create policy "members read integrations" on public.integrations for select to authenticated using (public.is_org_member(organization_id));
create policy "admins manage integrations" on public.integrations for all to authenticated using (public.has_org_role(organization_id, array['owner','admin'])) with check (public.has_org_role(organization_id, array['owner','admin']));
create policy "members read conversions" on public.conversion_events for select to authenticated using (public.is_org_member(organization_id));
create policy "members read ai insights" on public.ai_insights for select to authenticated using (public.is_org_member(organization_id));
create policy "members read ai recommendations" on public.ai_recommendations for select to authenticated using (public.is_org_member(organization_id));
create policy "members read ai actions" on public.ai_action_runs for select to authenticated using (public.is_org_member(organization_id));
create policy "admins manage ai actions" on public.ai_action_runs for update to authenticated using (public.has_org_role(organization_id, array['owner','admin'])) with check (public.has_org_role(organization_id, array['owner','admin']));
create policy "admins read audit log" on public.audit_log for select to authenticated using (public.has_org_role(organization_id, array['owner','admin']));
create policy "managers create audit log" on public.audit_log for insert to authenticated with check (public.has_org_role(organization_id, array['owner','admin','manager']));

-- Server-only tables intentionally have RLS enabled without client policies:
-- stripe_webhook_events and ai_usage are written through service-role routes only.
