create extension if not exists pgcrypto;
create table public.organizations(id uuid primary key default gen_random_uuid(),name text not null,owner_id uuid not null references auth.users(id) on delete cascade,plan text not null default 'free',stripe_customer_id text,created_at timestamptz not null default now());
create table public.organization_members(organization_id uuid references public.organizations(id) on delete cascade,user_id uuid references auth.users(id) on delete cascade,role text not null default 'member',primary key(organization_id,user_id));
create table public.locations(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,name text not null,address text,created_at timestamptz not null default now());
create table public.qr_codes(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,location_id uuid references public.locations(id) on delete set null,name text not null,slug text unique not null,destination_url text not null,qr_type text not null default 'website',is_dynamic boolean not null default true,status text not null default 'active',style jsonb not null default '{}'::jsonb,expires_at timestamptz,password_hash text,created_by uuid references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.scan_events(id bigint generated always as identity primary key,qr_code_id uuid not null references public.qr_codes(id) on delete cascade,scanned_at timestamptz not null default now(),country text,region text,city text,device_type text,browser text,os text,referrer text,ip_hash text);
create table public.subscriptions(id uuid primary key default gen_random_uuid(),organization_id uuid unique not null references public.organizations(id) on delete cascade,stripe_subscription_id text unique,status text not null,price_id text,current_period_end timestamptz,cancel_at_period_end boolean not null default false,updated_at timestamptz not null default now());
alter table public.organizations enable row level security;alter table public.organization_members enable row level security;alter table public.locations enable row level security;alter table public.qr_codes enable row level security;alter table public.scan_events enable row level security;alter table public.subscriptions enable row level security;
create or replace function public.is_org_member(org_id uuid) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from organization_members where organization_id=org_id and user_id=auth.uid()) or exists(select 1 from organizations where id=org_id and owner_id=auth.uid());$$;
create policy "members read organizations" on public.organizations for select using (public.is_org_member(id));
create policy "owners manage organizations" on public.organizations for all using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy "members manage qr codes" on public.qr_codes for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members manage locations" on public.locations for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members read scans" on public.scan_events for select using (exists(select 1 from qr_codes q where q.id=qr_code_id and public.is_org_member(q.organization_id)));
create index scan_events_qr_time_idx on public.scan_events(qr_code_id,scanned_at desc);create index qr_codes_org_idx on public.qr_codes(organization_id);create index qr_codes_slug_idx on public.qr_codes(slug);

alter table public.qr_codes add column if not exists scan_count bigint not null default 0;
create or replace function public.increment_scan_count(code_id uuid)
returns void language sql security definer set search_path=public as $$
  update public.qr_codes set scan_count=scan_count+1 where id=code_id;
$$;
grant execute on function public.increment_scan_count(uuid) to anon, authenticated;

create policy "public resolve active qr" on public.qr_codes for select to anon using (status='active');
create policy "public insert scans" on public.scan_events for insert to anon with check (true);
