-- Second Brain v2 — run once in Supabase → SQL Editor.
-- Drops the old v1 data (as decided) and recreates the table.
drop table if exists app_state;

create table app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  schema_version int not null default 2,
  updated_at timestamptz not null default now()
);

alter table app_state enable row level security;

create policy "own row" on app_state
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
