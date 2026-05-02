create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,

  display_name text,
  business_name text,
  business_segment text,
  whatsapp text,
  role_goal text,

  default_workspace text default 'estudio',

  notification_email boolean default true,
  notification_whatsapp boolean default false,
  notification_push boolean default true,

  notify_new_user boolean default true,
  notify_system_errors boolean default true,
  notify_task_done boolean default true,

  theme_mode text default 'system' check (theme_mode in ('system', 'light', 'dark')),
  ai_tone text default 'direto' check (ai_tone in ('direto', 'estrategico', 'didatico', 'executivo')),
  ai_detail_level text default 'medio' check (ai_detail_level in ('curto', 'medio', 'detalhado')),

  allow_ai_personalization boolean default true,
  allow_marketing_emails boolean default false,
  onboarding_done boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "Users can read own settings" on public.user_settings;
drop policy if exists "Users can insert own settings" on public.user_settings;
drop policy if exists "Users can update own settings" on public.user_settings;

create policy "Users can read own settings"
on public.user_settings
for select
using (auth.uid() = user_id);

create policy "Users can insert own settings"
on public.user_settings
for insert
with check (auth.uid() = user_id);

create policy "Users can update own settings"
on public.user_settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_settings_updated_at on public.user_settings;

create trigger set_user_settings_updated_at
before update on public.user_settings
for each row
execute function public.set_updated_at();
