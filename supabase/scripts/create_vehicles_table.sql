-- ================================================================
-- VitaOS 2.1 — Vehicles Migration
-- Esegui questo script nel SQL Editor della tua Dashboard Supabase
-- ================================================================

-- 1. Crea la tabella vehicles
create table if not exists public.vehicles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name         text not null default 'La mia Auto',
  brand        text,
  model        text,
  year         int,
  color        text default '#9aacc8',
  fuel_type    text default 'gasoline',  -- gasoline | diesel | electric | hybrid
  vehicle_type text default 'sedan',     -- city | hatchback | sedan | wagon | suv | suv_large | electric
  plate        text,
  sort_order   int  default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 2. RLS
alter table public.vehicles enable row level security;

create policy "vehicles_select_own"
  on public.vehicles for select using (auth.uid() = user_id);

create policy "vehicles_insert_own"
  on public.vehicles for insert with check (auth.uid() = user_id);

create policy "vehicles_update_own"
  on public.vehicles for update using (auth.uid() = user_id);

create policy "vehicles_delete_own"
  on public.vehicles for delete using (auth.uid() = user_id);

-- 3. Aggiungi vehicle_id a vehicle_logs (nullable per retrocompatibilità)
alter table public.vehicle_logs
  add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null;

-- 4. Indice per query veloci per utente + veicolo
create index if not exists vehicles_user_id_idx on public.vehicles(user_id);
create index if not exists vehicle_logs_vehicle_id_idx on public.vehicle_logs(vehicle_id);
