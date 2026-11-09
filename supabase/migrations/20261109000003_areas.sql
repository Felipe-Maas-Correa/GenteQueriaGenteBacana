-- Áreas de atendimento/entrega dos assinantes.

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  description text not null default '' check (char_length(description) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.areas is 'Áreas de atendimento dos assinantes.';

-- Nome único, ignorando maiúsculas/minúsculas, acentos e espaços nas pontas.
create unique index areas_name_unique_idx
  on public.areas (lower(public.f_unaccent(btrim(name))));

create trigger areas_set_updated_at
  before update on public.areas
  for each row execute function public.set_updated_at();

alter table public.areas enable row level security;

revoke all on table public.areas from anon;
grant select, insert, update, delete on table public.areas to authenticated;

create policy "Equipe lê áreas"
  on public.areas for select
  to authenticated
  using ((select public.is_staff()));

create policy "Equipe cria áreas"
  on public.areas for insert
  to authenticated
  with check ((select public.is_staff()));

create policy "Equipe altera áreas"
  on public.areas for update
  to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create policy "Equipe exclui áreas"
  on public.areas for delete
  to authenticated
  using ((select public.is_staff()));
