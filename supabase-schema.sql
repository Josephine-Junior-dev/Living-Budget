-- Living Budget: run this script in Supabase SQL Editor.
-- All personal records are protected by Row Level Security.
create extension if not exists pgcrypto;
create table if not exists public.lb_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text,
 currency text not null default 'KSh',
 plan text not null default 'free' check (plan in ('free','premium')),
 created_at timestamptz not null default now()
);
create table if not exists public.lb_transactions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 description text not null,
 category text not null default 'Other',
 transaction_date date not null default current_date,
 amount numeric(14,2) not null check (amount > 0),
 type text not null check (type in ('income','expense')),
 payment_method text,
 notes text,
 created_at timestamptz not null default now()
);
create index if not exists lb_transactions_user_date_idx on public.lb_transactions(user_id, transaction_date desc);
create table if not exists public.lb_budgets (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null, category text not null, monthly_limit numeric(14,2) not null check(monthly_limit>=0),
 month_start date not null default date_trunc('month',current_date)::date, created_at timestamptz not null default now()
);
create table if not exists public.lb_categories (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null, kind text not null check(kind in ('income','expense','both')), icon text, created_at timestamptz not null default now()
);
create table if not exists public.lb_savings_goals (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null, target_amount numeric(14,2) not null check(target_amount>0), saved_amount numeric(14,2) not null default 0 check(saved_amount>=0),
 target_date date, created_at timestamptz not null default now()
);
create table if not exists public.lb_bills (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null, amount numeric(14,2) not null check(amount>=0), due_date date not null, is_paid boolean not null default false,
 repeat_interval text not null default 'none' check(repeat_interval in ('none','weekly','monthly','yearly')), created_at timestamptz not null default now()
);
create table if not exists public.lb_debts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null, direction text not null check(direction in ('owed','owe')), original_amount numeric(14,2) not null check(original_amount>=0),
 balance numeric(14,2) not null check(balance>=0), due_date date, notes text, created_at timestamptz not null default now()
);
create table if not exists public.lb_budget_members (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 member_email text not null, member_user_id uuid references auth.users(id) on delete set null,
 role text not null default 'viewer' check(role in ('viewer','editor')), invite_status text not null default 'pending' check(invite_status in ('pending','accepted','revoked')),
 created_at timestamptz not null default now(), unique(owner_id, member_email)
);
alter table public.lb_profiles enable row level security;
alter table public.lb_transactions enable row level security;
alter table public.lb_budgets enable row level security;
alter table public.lb_categories enable row level security;
alter table public.lb_savings_goals enable row level security;
alter table public.lb_bills enable row level security;
alter table public.lb_debts enable row level security;
alter table public.lb_budget_members enable row level security;
drop policy if exists "lb_profiles_own" on public.lb_profiles;
create policy "lb_profiles_own" on public.lb_profiles for all to authenticated using (id=auth.uid()) with check (id=auth.uid());
drop policy if exists "lb_transactions_own" on public.lb_transactions;
create policy "lb_transactions_own" on public.lb_transactions for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "lb_budgets_own" on public.lb_budgets;
create policy "lb_budgets_own" on public.lb_budgets for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "lb_categories_own" on public.lb_categories;
create policy "lb_categories_own" on public.lb_categories for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "lb_goals_own" on public.lb_savings_goals;
create policy "lb_goals_own" on public.lb_savings_goals for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "lb_bills_own" on public.lb_bills;
create policy "lb_bills_own" on public.lb_bills for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "lb_debts_own" on public.lb_debts;
create policy "lb_debts_own" on public.lb_debts for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "lb_members_owner" on public.lb_budget_members;
create policy "lb_members_owner" on public.lb_budget_members for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.lb_profiles, public.lb_transactions, public.lb_budgets, public.lb_categories, public.lb_savings_goals, public.lb_bills, public.lb_debts, public.lb_budget_members to authenticated;
grant select on public.lb_profiles, public.lb_transactions, public.lb_budgets, public.lb_categories, public.lb_savings_goals, public.lb_bills, public.lb_debts, public.lb_budget_members to anon;
-- Do not add broad anon write grants. Authenticated access is restricted by RLS.
