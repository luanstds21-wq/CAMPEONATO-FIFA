-- ==============================================================================
-- FIFA CHAMPIONS 48 - BANCO DE DADOS ÚNICO COMPARTILHADO (SEM LOGIN / SEM CONTAS)
-- ==============================================================================
-- Execute este script no "SQL Editor" do seu painel Supabase (https://supabase.com).
-- Este script cria a tabela única global acessível por todos os dispositivos.
-- Não requer autenticação, senhas ou login: todos acessam e editam o mesmo campeonato.
-- ==============================================================================

-- 1. Tabela principal: global_tournament
create table if not exists public.global_tournament (
    id integer primary key default 1,
    name text not null default 'FIFA Champions 48',
    version integer not null default 1,
    group_matches jsonb not null default '[]'::jsonb,
    knockout_data jsonb not null default '{}'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Garante que existe pelo menos o registro com id = 1
insert into public.global_tournament (id, name, version, group_matches, knockout_data)
values (1, 'FIFA Champions 48', 1, '[]'::jsonb, '{}'::jsonb)
on conflict (id) do nothing;

-- 2. Permissões Públicas (Qualquer pessoa pode ler e atualizar o campeonato)
alter table public.global_tournament enable row level security;

drop policy if exists "Public can view global tournament" on public.global_tournament;
create policy "Public can view global tournament"
    on public.global_tournament
    for select
    to anon, authenticated
    using (true);

drop policy if exists "Public can update global tournament" on public.global_tournament;
create policy "Public can update global tournament"
    on public.global_tournament
    for update
    to anon, authenticated
    using (true)
    with check (true);

drop policy if exists "Public can insert global tournament" on public.global_tournament;
create policy "Public can insert global tournament"
    on public.global_tournament
    for insert
    to anon, authenticated
    with check (true);

-- 3. Habilitar Supabase Realtime para a tabela global_tournament
alter publication supabase_realtime add table public.global_tournament;
