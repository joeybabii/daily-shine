alter table public.user_data enable row level security;

revoke all on table public.user_data from anon, authenticated;
grant select, insert, update on table public.user_data to authenticated;

alter policy "Users can insert own data"
  on public.user_data
  to authenticated;

alter policy "Users can read own data"
  on public.user_data
  to authenticated;

alter policy "Users can update own data"
  on public.user_data
  to authenticated;
