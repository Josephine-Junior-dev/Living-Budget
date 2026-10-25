-- Living Budget read-only security audit. Run in Supabase SQL Editor after applying supabase-schema.sql.
-- These queries inspect settings; they do not modify data.

-- 1) Every expected lb_ table should exist and have row-level security enabled.
select c.relname as table_name, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relkind='r'
  and c.relname in ('lb_profiles','lb_transactions','lb_budgets','lb_categories','lb_savings_goals','lb_bills','lb_debts','lb_budget_members')
order by c.relname;

-- 2) List the policies that protect each Living Budget table.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname='public'
  and tablename in ('lb_profiles','lb_transactions','lb_budgets','lb_categories','lb_savings_goals','lb_bills','lb_debts','lb_budget_members')
order by tablename, policyname;

-- 3) Check direct table grants. Ideally, anon and PUBLIC have no table privileges;
-- authenticated should have CRUD privileges, constrained by the RLS policies above.
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema='public'
  and table_name in ('lb_profiles','lb_transactions','lb_budgets','lb_categories','lb_savings_goals','lb_bills','lb_debts','lb_budget_members')
  and grantee in ('anon','authenticated','PUBLIC')
order by table_name, grantee, privilege_type;

-- 4) Check whether any Living Budget table has RLS disabled.
select c.relname as table_without_rls
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relkind='r'
  and c.relname like 'lb!_%' escape '!'
  and not c.relrowsecurity
order by c.relname;
