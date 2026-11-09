-- Indicadores do dashboard em uma única chamada.
-- SECURITY INVOKER: respeita as políticas de RLS do usuário que consulta.
-- "Hoje" é calculado no fuso de Brasília.

create or replace function public.dashboard_stats()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with today as (
    select (now() at time zone 'America/Sao_Paulo')::date as d
  )
  select jsonb_build_object(
    'total', (select count(*) from public.subscribers),
    'active', (select count(*) from public.subscribers where status = 'active'),
    'inactive', (select count(*) from public.subscribers where status = 'inactive'),
    'overdue', (
      select count(*) from public.subscribers s, today
       where s.status = 'active' and s.due_date < today.d
    ),
    'due_next_7_days', (
      select count(*) from public.subscribers s, today
       where s.status = 'active' and s.due_date between today.d and today.d + 7
    ),
    'due_next_30_days', (
      select count(*) from public.subscribers s, today
       where s.status = 'active' and s.due_date between today.d and today.d + 30
    ),
    'by_area', coalesce((
      select jsonb_agg(
               jsonb_build_object('id', a.id, 'name', a.name, 'count', c.total)
               order by c.total desc, a.name
             )
        from public.areas a
        cross join lateral (
          select count(*) as total from public.subscribers s where s.area_id = a.id
        ) c
    ), '[]'::jsonb),
    'by_month', (
      select jsonb_agg(
               jsonb_build_object(
                 'month', m,
                 'count', (select count(*) from public.subscribers s where s.reference_month = m)
               )
               order by m
             )
        from generate_series(1, 12) as m
    )
  );
$$;

revoke all on function public.dashboard_stats() from public, anon;
grant execute on function public.dashboard_stats() to authenticated;
