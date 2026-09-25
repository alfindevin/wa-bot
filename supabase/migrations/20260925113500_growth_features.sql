alter table public.tenants
  add column if not exists allow_public_widget boolean not null default true,
  add column if not exists billing_cycle_start date not null default date_trunc('month', current_date)::date;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tenants_plan_known'
      and conrelid = 'public.tenants'::regclass
  ) then
    alter table public.tenants
      add constraint tenants_plan_known check (plan in ('Free', 'Starter', 'Pro', 'Agency'));
  end if;
end $$;

create table if not exists public.tenant_channels (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  channel text not null check (channel in ('web', 'whatsapp', 'api')),
  status text not null default 'draft' check (status in ('active', 'draft', 'disabled')),
  label text not null default '',
  external_id text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, channel)
);

create table if not exists public.conversation_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  event_type text not null check (event_type in ('lead_captured', 'handoff_requested', 'quota_blocked', 'ai_error')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tenant_channels_tenant_idx on public.tenant_channels (tenant_id, channel);
create index if not exists conversation_events_tenant_created_idx on public.conversation_events (tenant_id, created_at desc);
create index if not exists conversation_events_conversation_idx on public.conversation_events (conversation_id, created_at desc);

alter table public.tenant_channels enable row level security;
alter table public.conversation_events enable row level security;

grant select, insert, update on public.tenant_channels to authenticated;
grant select on public.conversation_events to authenticated;
grant update (allow_public_widget) on public.tenants to authenticated;
revoke all on public.tenant_channels, public.conversation_events from anon;

drop policy if exists "owners manage tenant channels" on public.tenant_channels;
create policy "owners manage tenant channels" on public.tenant_channels for all to authenticated
  using (exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_user_id = (select auth.uid())));

drop policy if exists "owners read conversation events" on public.conversation_events;
create policy "owners read conversation events" on public.conversation_events for select to authenticated
  using (exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_user_id = (select auth.uid())));

insert into public.tenant_channels (tenant_id, channel, status, label, settings)
select id, 'web', 'active', 'Web Chat', jsonb_build_object('public_widget', allow_public_widget)
from public.tenants
on conflict (tenant_id, channel) do nothing;

insert into public.tenant_channels (tenant_id, channel, status, label, settings)
select id, 'whatsapp', 'draft', 'WhatsApp Cloud API', jsonb_build_object('ready_for_webhook', false)
from public.tenants
on conflict (tenant_id, channel) do nothing;

create or replace function public.create_tenant(tenant_name text, tenant_slug text, tenant_profile text default '')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_tenant uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if char_length(trim(tenant_name)) not between 2 and 100 then raise exception 'Invalid tenant name'; end if;
  if tenant_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'Invalid tenant slug'; end if;

  insert into public.tenants (owner_user_id, name, slug, business_profile, plan, monthly_limit)
  values (v_user, trim(tenant_name), tenant_slug, left(coalesce(tenant_profile, ''), 10000), 'Free', 100)
  returning id into v_tenant;

  insert into public.memberships (tenant_id, user_id, role) values (v_tenant, v_user, 'owner');
  insert into public.tenant_channels (tenant_id, channel, status, label, settings)
  values
    (v_tenant, 'web', 'active', 'Web Chat', '{"public_widget":true}'::jsonb),
    (v_tenant, 'whatsapp', 'draft', 'WhatsApp Cloud API', '{"ready_for_webhook":false}'::jsonb);

  return v_tenant;
end;
$$;

revoke all on function public.create_tenant(text, text, text) from public, anon;
grant execute on function public.create_tenant(text, text, text) to authenticated;
