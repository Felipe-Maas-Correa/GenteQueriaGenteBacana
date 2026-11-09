-- Extensões e funções utilitárias compartilhadas pelas demais migrations.

create schema if not exists extensions;

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- Mantém `updated_at` sempre atualizado.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Versão IMMUTABLE de unaccent, necessária para colunas geradas e índices.
create or replace function public.f_unaccent(value text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, value);
$$;
