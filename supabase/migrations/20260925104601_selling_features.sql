alter table public.tenants
  add column bot_name text not null default 'Asisten AI' check (char_length(bot_name) between 1 and 60),
  add column bot_tone text not null default 'friendly' check (bot_tone in ('friendly', 'professional', 'casual')),
  add column handoff_whatsapp text not null default '' check (handoff_whatsapp ~ '^[0-9]{0,20}$'),
  add column lead_capture_enabled boolean not null default false,
  add column quick_questions jsonb not null default '["Apa saja produknya?","Berapa harganya?","Bagaimana cara pesan?"]'::jsonb,
  add constraint quick_questions_is_array check (jsonb_typeof(quick_questions) = 'array');

alter table public.conversations
  add column visitor_email text,
  add column visitor_phone text,
  add column status text not null default 'open' check (status in ('open', 'needs_human', 'resolved'));

create table public.api_rate_limits (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  key_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count >= 0),
  primary key (tenant_id, key_hash, window_start)
);

alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from public, anon, authenticated;

grant update (bot_name, bot_tone, handoff_whatsapp, lead_capture_enabled, quick_questions) on public.tenants to authenticated;
grant update (status) on public.conversations to authenticated;

create policy "owners update conversation status" on public.conversations for update to authenticated
  using (exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_user_id = (select auth.uid())));

-- Atomic, hashed per-visitor limiter for the public chat endpoint.
create or replace function public.check_chat_rate_limit(
  tenant_uuid uuid,
  visitor_key_hash text,
  max_requests integer default 20,
  window_seconds integer default 60
)
returns table (allowed boolean, remaining integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz;
  v_count integer;
begin
  if max_requests < 1 or window_seconds < 1 or char_length(visitor_key_hash) < 16 then
    return query select false, 0; return;
  end if;
  v_window := to_timestamp(floor(extract(epoch from now()) / window_seconds) * window_seconds);

  delete from public.api_rate_limits
  where tenant_id = tenant_uuid and window_start < now() - interval '1 day';

  insert into public.api_rate_limits (tenant_id, key_hash, window_start, request_count)
  values (tenant_uuid, visitor_key_hash, v_window, 1)
  on conflict (tenant_id, key_hash, window_start) do update
    set request_count = public.api_rate_limits.request_count + 1
    where public.api_rate_limits.request_count < max_requests
  returning public.api_rate_limits.request_count into v_count;

  if v_count is null then return query select false, 0; return; end if;
  return query select true, greatest(max_requests - v_count, 0);
end;
$$;

revoke all on function public.check_chat_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_chat_rate_limit(uuid, text, integer, integer) to service_role;

create index conversations_leads_idx on public.conversations (tenant_id, updated_at desc)
  where visitor_email is not null or visitor_phone is not null;
