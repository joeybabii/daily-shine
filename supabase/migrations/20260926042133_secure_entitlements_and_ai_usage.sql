create table if not exists public.user_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_premium boolean not null default false,
  stripe_customer_id text unique,
  updated_at timestamptz not null default now()
);

alter table public.user_entitlements enable row level security;
revoke all on table public.user_entitlements from anon, authenticated;
grant select, insert, update, delete on table public.user_entitlements to service_role;

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table public.ai_usage enable row level security;
revoke all on table public.ai_usage from anon, authenticated;
grant select, insert, update, delete on table public.ai_usage to service_role;

create or replace function public.consume_ai_usage(
  p_user_id uuid,
  p_usage_date date,
  p_limit integer
)
returns table (allowed boolean, new_count integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  insert into public.ai_usage (user_id, usage_date, count, updated_at)
  values (p_user_id, p_usage_date, 1, now())
  on conflict (user_id, usage_date)
  do update set
    count = public.ai_usage.count + 1,
    updated_at = now()
  returning count into v_count;

  return query select (v_count <= p_limit), v_count;
end;
$$;

revoke all on function public.consume_ai_usage(uuid, date, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_usage(uuid, date, integer) to service_role;
