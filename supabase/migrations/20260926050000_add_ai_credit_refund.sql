create or replace function public.refund_ai_usage(
  p_user_id uuid,
  p_usage_date date
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.ai_usage
  set count = greatest(count - 1, 0),
      updated_at = now()
  where user_id = p_user_id
    and usage_date = p_usage_date
  returning count into v_count;

  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.refund_ai_usage(uuid, date) from public, anon, authenticated;
grant execute on function public.refund_ai_usage(uuid, date) to service_role;
