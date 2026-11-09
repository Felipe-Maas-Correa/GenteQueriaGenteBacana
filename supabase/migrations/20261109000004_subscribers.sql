-- Assinantes do jornal.

create type public.subscriber_status as enum ('active', 'inactive');

create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 160),
  address text not null check (char_length(btrim(address)) between 3 and 300),
  -- Apenas dígitos (DDD + número). Vazio quando não informado.
  phone text not null default '' check (phone ~ '^([0-9]{10,11})?$'),
  area_id uuid not null references public.areas (id) on delete restrict,
  due_date date not null,
  -- Dia do vencimento (1–31), derivado de due_date para filtros por dia.
  due_day smallint generated always as (extract(day from due_date)::smallint) stored,
  -- Mês de referência estruturado: 1 = janeiro … 12 = dezembro.
  reference_month smallint not null check (reference_month between 1 and 12),
  observation text not null default '' check (char_length(observation) <= 2000),
  status public.subscriber_status not null default 'active',
  -- Define se o assinante entra na geração de etiquetas.
  label_enabled boolean not null default true,
  -- Texto normalizado (sem acentos, minúsculo) para a pesquisa geral.
  search_text text generated always as (
    lower(public.f_unaccent(name || ' ' || address || ' ' || phone))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.subscribers is 'Assinantes do jornal.';
comment on column public.subscribers.reference_month is 'Mês de referência (1–12).';
comment on column public.subscribers.label_enabled is 'Se o assinante participa da geração de etiquetas.';

-- Índices para ordenação, filtros e pesquisa.
create index subscribers_name_idx on public.subscribers (name);
create index subscribers_phone_idx on public.subscribers (phone);
create index subscribers_area_id_idx on public.subscribers (area_id);
create index subscribers_due_date_idx on public.subscribers (due_date);
create index subscribers_due_day_idx on public.subscribers (due_day);
create index subscribers_reference_month_idx on public.subscribers (reference_month);
create index subscribers_status_idx on public.subscribers (status);
create index subscribers_created_at_idx on public.subscribers (created_at desc);
create index subscribers_search_text_trgm_idx
  on public.subscribers using gin (search_text extensions.gin_trgm_ops);

create trigger subscribers_set_updated_at
  before update on public.subscribers
  for each row execute function public.set_updated_at();

alter table public.subscribers enable row level security;

revoke all on table public.subscribers from anon;
grant select, insert, update, delete on table public.subscribers to authenticated;

create policy "Equipe lê assinantes"
  on public.subscribers for select
  to authenticated
  using ((select public.is_staff()));

create policy "Equipe cria assinantes"
  on public.subscribers for insert
  to authenticated
  with check ((select public.is_staff()));

create policy "Equipe altera assinantes"
  on public.subscribers for update
  to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create policy "Equipe exclui assinantes"
  on public.subscribers for delete
  to authenticated
  using ((select public.is_staff()));
