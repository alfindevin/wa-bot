revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

create index if not exists tenants_owner_user_id_idx on public.tenants (owner_user_id);
create index if not exists memberships_user_id_idx on public.memberships (user_id);
