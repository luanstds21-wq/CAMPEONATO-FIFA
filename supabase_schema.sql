-- ==============================================================================
-- FIFA CHAMPIONS 48 - ESQUEMA SUPABASE COM ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Execute este script no "SQL Editor" do seu painel Supabase (https://supabase.com).
-- Este script configura o banco de dados, tabelas e políticas de segurança RLS
-- que garantem isolamento total dos dados de cada usuário autenticado.
-- ==============================================================================

-- 1. Habilitar extensão para geração de UUID se necessário
create extension if not exists "uuid-ossp";

-- 2. Tabela principal: tournaments (Torneios do Usuário)
-- Armazena os dados completos do campeonato do usuário, incluindo todos os 103 jogos
-- (grupos e mata-mata), gols, assistências, cartões e resultados.
create table if not exists public.tournaments (
    id text primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null default 'FIFA Champions 48',
    version integer not null default 2,
    group_matches jsonb not null default '[]'::jsonb,
    knockout_data jsonb not null default '{}'::jsonb,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Índices para consultas rápidas
create index if not exists idx_tournaments_user_id on public.tournaments(user_id);
create index if not exists idx_tournaments_updated_at on public.tournaments(updated_at desc);

-- 4. HABILITAR ROW LEVEL SECURITY (RLS) - OBRIGATÓRIO
-- O RLS impede que qualquer consulta acesse ou modifique dados fora das políticas.
alter table public.tournaments enable row level security;

-- 5. POLÍTICAS DE SEGURANÇA (RLS) ESTRITAS POR USUÁRIO (auth.uid())

-- POLÍTICA 1: Visualização (SELECT)
-- O usuário autenticado SÓ PODE visualizar os seus próprios torneios.
drop policy if exists "Users can view only their own tournaments" on public.tournaments;
create policy "Users can view only their own tournaments"
    on public.tournaments
    for select
    to authenticated
    using (auth.uid() = user_id);

-- POLÍTICA 2: Inserção (INSERT)
-- O usuário autenticado SÓ PODE criar registros vinculados ao seu próprio auth.uid().
drop policy if exists "Users can insert only their own tournaments" on public.tournaments;
create policy "Users can insert only their own tournaments"
    on public.tournaments
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- POLÍTICA 3: Atualização (UPDATE)
-- O usuário autenticado SÓ PODE atualizar registros que pertencem a ele.
drop policy if exists "Users can update only their own tournaments" on public.tournaments;
create policy "Users can update only their own tournaments"
    on public.tournaments
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- POLÍTICA 4: Exclusão (DELETE)
-- O usuário autenticado SÓ PODE excluir seus próprios registros.
drop policy if exists "Users can delete only their own tournaments" on public.tournaments;
create policy "Users can delete only their own tournaments"
    on public.tournaments
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- 6. Trigger automático para atualizar o campo updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_tournaments_updated_at on public.tournaments;
create trigger set_tournaments_updated_at
    before update on public.tournaments
    for each row
    execute function public.handle_updated_at();

-- 7. Tabela opcional de perfis de usuário (perfis e preferências)
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    phone text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
    on public.profiles for select
    to authenticated
    using (auth.uid() = id);

create policy "Users can update own profile"
    on public.profiles for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

create policy "Users can insert own profile"
    on public.profiles for insert
    to authenticated
    with check (auth.uid() = id);

-- ==============================================================================
-- Fim do script de configuração
-- ==============================================================================
