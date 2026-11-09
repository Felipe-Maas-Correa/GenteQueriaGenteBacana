-- Perfis dos usuários administrativos, vinculados ao Supabase Auth.
--
-- Papéis:
--   admin   → acesso total, inclusive gestão de perfis
--   editor  → gerencia assinantes e áreas
--   pending → usuário autenticado ainda sem acesso liberado (padrão)
--
-- Todo usuário novo nasce como `pending`. A liberação é feita por um admin
-- (ou via SQL, no caso do primeiro administrador — ver README).

create type public.user_role as enum ('admin', 'editor', 'pending');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '' check (char_length(name) <= 160),
  email text not null,
  role public.user_role not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Informações complementares dos usuários autenticados (Supabase Auth).';

create index profiles_role_idx on public.profiles (role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Cria/sincroniza o perfil a partir de auth.users.
create or replace function public.handle_auth_user_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.profiles (id, email, name)
    values (
      new.id,
      coalesce(new.email, ''),
      coalesce(new.raw_user_meta_data ->> 'name', '')
    )
    on conflict (id) do nothing;
  elsif new.email is distinct from old.email then
    update public.profiles
       set email = coalesce(new.email, '')
     where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_auth_user_change();

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_auth_user_change();

-- Funções de autorização usadas pelas políticas de RLS.
-- SECURITY DEFINER evita recursão de RLS ao consultar `profiles`.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() in ('admin', 'editor'), false);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

revoke all on function public.handle_auth_user_change() from public, anon, authenticated;
revoke all on function public.current_user_role() from public, anon;
revoke all on function public.is_staff() from public, anon;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- Row Level Security
alter table public.profiles enable row level security;

revoke all on table public.profiles from anon;
grant select, update on table public.profiles to authenticated;

create policy "Usuário lê o próprio perfil; admin lê todos"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "Somente admin altera perfis"
  on public.profiles for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
