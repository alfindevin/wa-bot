-- LanturAI multi-tenant schema for Supabase Postgres.
create extension if not exists pgcrypto;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  business_profile text not null default '',
  welcome_message text not null default 'Halo! Ada yang bisa kami bantu?',
  brand_color text not null default '#6D5DFB' check (brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  plan text not null default 'Starter',
  monthly_limit integer not null default 500 check (monthly_limit >= 0),
  is_active boolean not null default true,
  channel_config jsonb not null default '{"web":{"enabled":true},"whatsapp":{"enabled":false}}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner','admin','agent','viewer')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  question text not null check (char_length(question) between 2 and 500),
  answer text not null check (char_length(answer) between 1 and 5000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  description text not null default '',
  price numeric(14,2) not null default 0 check (price >= 0),
  price_label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  content text not null check (char_length(content) between 1 and 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  session_token uuid not null,
  channel text not null default 'web' check (channel in ('web','whatsapp','api')),
  external_id text,
  visitor_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, session_token)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system','agent')),
  content text not null check (char_length(content) between 1 and 20000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.monthly_usage (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  month date not null,
  message_count integer not null default 0 check (message_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, month),
  check (month = date_trunc('month', month)::date)
);

create index faqs_tenant_idx on public.faqs (tenant_id, sort_order);
create index products_tenant_idx on public.products (tenant_id, is_active);
create index knowledge_tenant_idx on public.knowledge_entries (tenant_id);
create index conversations_tenant_updated_idx on public.conversations (tenant_id, updated_at desc);
create index messages_conversation_created_idx on public.messages (conversation_id, created_at);
create index messages_tenant_idx on public.messages (tenant_id);

alter table public.tenants enable row level security;
alter table public.memberships enable row level security;
alter table public.faqs enable row level security;
alter table public.products enable row level security;
alter table public.knowledge_entries enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.monthly_usage enable row level security;

create policy "owners select tenants" on public.tenants for select to authenticated using ((select auth.uid()) is not null and owner_user_id = (select auth.uid()));
create policy "owners update tenants" on public.tenants for update to authenticated using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));
create policy "owners delete tenants" on public.tenants for delete to authenticated using (owner_user_id = (select auth.uid()));

create policy "users see own memberships" on public.memberships for select to authenticated using (user_id = (select auth.uid()));
create policy "owners manage memberships" on public.memberships for all to authenticated
  using (exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_user_id = (select auth.uid())));

create policy "owners manage faqs" on public.faqs for all to authenticated
  using (exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_user_id = (select auth.uid())));
create policy "owners manage products" on public.products for all to authenticated
  using (exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_user_id = (select auth.uid())));
create policy "owners manage knowledge" on public.knowledge_entries for all to authenticated
  using (exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_user_id = (select auth.uid())));
create policy "owners read conversations" on public.conversations for select to authenticated
  using (exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_user_id = (select auth.uid())));
create policy "owners read messages" on public.messages for select to authenticated
  using (exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_user_id = (select auth.uid())));
create policy "owners read usage" on public.monthly_usage for select to authenticated
  using (exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_user_id = (select auth.uid())));

grant usage on schema public to anon, authenticated;
grant select, delete on public.tenants to authenticated;
grant update (name, slug, business_profile, welcome_message, brand_color, channel_config) on public.tenants to authenticated;
grant select, insert, update, delete on public.memberships, public.faqs, public.products, public.knowledge_entries to authenticated;
grant select on public.conversations, public.messages, public.monthly_usage to authenticated;
revoke all on public.tenants, public.memberships, public.faqs, public.products, public.knowledge_entries, public.conversations, public.messages, public.monthly_usage from anon;

-- Tenant creation is constrained server-side so a user cannot self-assign a paid plan or unlimited quota.
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
  insert into public.tenants (owner_user_id, name, slug, business_profile)
  values (v_user, trim(tenant_name), tenant_slug, left(coalesce(tenant_profile, ''), 10000))
  returning id into v_tenant;
  insert into public.memberships (tenant_id, user_id, role) values (v_tenant, v_user, 'owner');
  return v_tenant;
end;
$$;

revoke all on function public.create_tenant(text, text, text) from public, anon;
grant execute on function public.create_tenant(text, text, text) to authenticated;

-- Atomic quota consumption. Only the server-side secret/service role may call it.
create or replace function public.consume_tenant_message(tenant_uuid uuid)
returns table (allowed boolean, remaining integer, message_count integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer;
  v_count integer;
  v_month date := date_trunc('month', current_date)::date;
begin
  select monthly_limit into v_limit from public.tenants where id = tenant_uuid and is_active = true;
  if v_limit is null then return query select false, 0, 0; return; end if;
  if v_limit <= 0 then return query select false, 0, 0; return; end if;

  insert into public.monthly_usage (tenant_id, month, message_count)
  values (tenant_uuid, v_month, 1)
  on conflict (tenant_id, month) do update
    set message_count = public.monthly_usage.message_count + 1, updated_at = now()
    where public.monthly_usage.message_count < v_limit
  returning public.monthly_usage.message_count into v_count;

  if v_count is null then
    select mu.message_count into v_count from public.monthly_usage mu where mu.tenant_id = tenant_uuid and mu.month = v_month;
    return query select false, 0, coalesce(v_count, 0); return;
  end if;
  return query select true, greatest(v_limit - v_count, 0), v_count;
end;
$$;

revoke all on function public.consume_tenant_message(uuid) from public, anon, authenticated;
grant execute on function public.consume_tenant_message(uuid) to service_role;
